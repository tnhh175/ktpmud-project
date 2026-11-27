"""Persisted, doctor-driven workflow. Run/decision histories are append-only."""
from concurrent.futures import ThreadPoolExecutor, TimeoutError as FutureTimeout
from copy import deepcopy
from datetime import datetime, timezone
from decimal import Decimal, InvalidOperation
import re
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, Header, Query, Request, Response
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from psycopg.types.json import Jsonb

from .audit import record_audit_log
from .auth import Principal, get_current_principal, get_client_ip, get_request_id
from .care import require_visit_access
from .db import parse_if_match, to_iso
from .hf_ai import digest
from .models import ProblemError, WorkflowFieldsRequest, WorkflowRunRequest, WorkflowDecisionRequest, WorkflowConfirmationRequest, WorkflowFinishRequest
from . import workflow_mock as mock
from .workflow_schema import SCHEMA, matches, validate

_workflow_bearer=HTTPBearer(auto_error=False)


def workflow_principal(request:Request,creds:HTTPAuthorizationCredentials|None=Depends(_workflow_bearer)):
    try:
        return get_current_principal(request,creds)
    except ProblemError as exc:
        if exc.code=='AUTH_UNAUTHORIZED':
            raise problem('AUTH_REQUIRED',401) from None
        raise

router = APIRouter(prefix='/api/v1/visits', tags=['Test workflow'])
MODULES = ('m1','m2','m3','m4')
CONTRACT = 'hf-workflow/1.0'
ALIASES = {'tang_huyet_ap':'ts_tang_huyet_ap','dai_thao_duong':'ts_dai_thao_duong',
           'copd':'ts_copd','thieu_mau':'ts_thieu_mau'}
NEW_FIELDS = set(SCHEMA['$defs']['fields']['properties']) - {'age','sex','cls_bnp','cls_nt_probnp','cls_lvef','cls_creatinin','cls_kali'} | {'bat_thuong_cau_truc_tim'}
LISTS = ('diagnoses','medications','allergies')
FORM_CODES = {**ALIASES, 'age':'luot_tuoi', 'sex':'bn_gioi_tinh'}


def form_code(code):
    return FORM_CODES.get(code, code)


def canonical_code(code):
    return next((key for key, value in FORM_CODES.items() if value == code), code)

# Stable owners: general/shared inputs are edited at M1, treatment measurements
# at M3, and the two medication-safety lists at M4. Read access is shared.
M3_FIELDS = {'e_over_a_ratio','cls_creatinin','egfr_ckd_epi','egfr_formula',
             'cls_kali','ecg_12_chuyen_dao','xquang_nguc_thang','selected_medications'}
M2_OBSERVATION_FIELDS = {'cls_bnp','cls_nt_probnp','cls_lvef','ecg_12_chuyen_dao','xquang_nguc_thang'}
_UNIT_ALIASES = {
    'lần/phút': '/min', 'lần/p': '/min', 'l/p': '/min', 'nhịp/phút': '/min', 'bpm': '/min', '/min': '/min',
    'µmol/l': 'umol/L', 'μmol/l': 'umol/L', 'umol/l': 'umol/L',
    'ml/phút/1.73m²': 'mL/min/1.73m2', 'ml/min/1.73m²': 'mL/min/1.73m2', 'ml/min/1.73m2': 'mL/min/1.73m2',
    'pg/ml': 'pg/mL', 'mmol/l': 'mmol/L', 'meq/l': 'mEq/L', 'ml': 'mL',
    'mmhg': 'mmHg', 'mg/ngày': 'mg/day', 'mg/day': 'mg/day', 'mg/l': 'mg/L',
    'kg/m²': 'kg/m2', 'kg/m2': 'kg/m2',
}
_EGFR_OPTION_MAP = {
    'ckd_epi_2021': 'CKD-EPI 2021',
    'mdrd': 'MDRD',
    'cockcroft_gault': 'Cockcroft-Gault',
    'unknown': 'Không rõ',
}


def _normalize_field_answer(code, raw):
    """Normalize legacy/older visit field answers to match inputSnapshot schema without altering clinical values."""
    if not isinstance(raw, dict):
        return raw
    field_schema = SCHEMA['$defs']['fields']['properties'].get(code)
    # Lossless fast-path: preserve answers that already satisfy the exact schema cleanly (e.g. C8 migration parity).
    if 'ownerModule' not in raw and matches(raw, field_schema if isinstance(field_schema, dict) else {'$ref': '#/$defs/observation'}):
        return deepcopy(raw)
    ans = deepcopy(raw)
    ans.pop('ownerModule', None)
    state_val = ans.get('value_state')
    if state_val not in ('answered', 'unknown'):
        return ans
    if 'reason' in ans:
        r = ans['reason']
        if not isinstance(r, str) or not r.strip():
            ans.pop('reason', None)
        else:
            ans['reason'] = r.strip()
    branches = field_schema.get('oneOf', [field_schema]) if isinstance(field_schema, dict) else []
    branch = next((b for b in branches if isinstance(b, dict) and b.get('properties', {}).get('value_state', {}).get('const') == state_val), None)
    bprops = branch.get('properties', {}) if isinstance(branch, dict) else {}

    if state_val == 'unknown':
        ans['value'] = None
        if isinstance(branch, dict):
            if 'unit' not in bprops:
                ans.pop('unit', None)
            elif 'unit' in ans:
                u_rule = bprops['unit']
                if ans['unit'] is None and u_rule.get('const') is not None:
                    ans.pop('unit', None)
                elif isinstance(ans['unit'], str):
                    mapped = _UNIT_ALIASES.get(ans['unit'].strip().lower(), ans['unit'].strip())
                    if u_rule.get('const') is not None and mapped != u_rule['const']:
                        ans.pop('unit', None)
                    else:
                        ans['unit'] = mapped
            if 'measuredAt' not in bprops or ans.get('measuredAt') in (None, ''):
                ans.pop('measuredAt', None)
            for k in list(ans.keys()):
                if k not in bprops:
                    ans.pop(k, None)
        else:
            if ans.get('unit') in (None, ''):
                ans.pop('unit', None)
            if ans.get('measuredAt') in (None, ''):
                ans.pop('measuredAt', None)
        return ans

    # value_state == 'answered'
    val = ans.get('value')
    if code == 'egfr_formula' and isinstance(val, str):
        ans['value'] = _EGFR_OPTION_MAP.get(val, val)
        val = ans['value']
    if isinstance(branch, dict):
        v_rule = bprops.get('value', {})
        if v_rule.get('type') == 'integer' and type(val) is float and val.is_integer():
            ans['value'] = int(val)
        elif 'enum' in v_rule and isinstance(val, str) and val.isdigit() and int(val) in v_rule['enum']:
            ans['value'] = int(val)
        elif v_rule.get('type') == 'integer' and isinstance(val, str) and val.isdigit():
            ans['value'] = int(val)
        if 'unit' not in bprops:
            ans.pop('unit', None)
        else:
            u_rule = bprops['unit']
            cur_u = ans.get('unit')
            if isinstance(cur_u, str):
                cur_u = cur_u.strip()
                cur_u = _UNIT_ALIASES.get(cur_u.lower(), cur_u) if cur_u else None
            if cur_u:
                ans['unit'] = cur_u
            elif u_rule.get('const') is not None:
                ans['unit'] = u_rule['const']
            elif 'unit' in ans and cur_u is None and u_rule.get('const') is not None:
                ans.pop('unit', None)
            elif 'unit' in ans and not cur_u:
                ans.pop('unit', None)
        if 'measuredAt' not in bprops:
            ans.pop('measuredAt', None)
        elif ans.get('measuredAt') in (None, '') and 'measuredAt' not in branch.get('required', []):
            ans.pop('measuredAt', None)
        for k in list(ans.keys()):
            if k not in bprops:
                ans.pop(k, None)
    else:
        if isinstance(ans.get('unit'), str):
            u_clean = ans['unit'].strip()
            ans['unit'] = _UNIT_ALIASES.get(u_clean.lower(), u_clean) if u_clean else None
        if ans.get('unit') is None:
            ans.pop('unit', None)
        if ans.get('measuredAt') in (None, ''):
            ans.pop('measuredAt', None)
    return ans


def _normalize_observation(obs):
    if not isinstance(obs, dict):
        return obs
    o = deepcopy(obs)
    ans = o.get('answer')
    if isinstance(ans, dict):
        cleaned = _normalize_field_answer(o.get('fieldCode', ''), ans)
        # Observation schema allows only value_state, value, unit, measuredAt, reason
        for k in list(cleaned.keys()):
            if k not in ('value_state', 'value', 'unit', 'measuredAt', 'reason'):
                cleaned.pop(k, None)
        o['answer'] = cleaned
    return {k: o[k] for k in ('id', 'fieldCode', 'answer') if k in o}


def _module_dependencies(module, rules):
    deps = set(rules['outputProjection']['gapFields'][module.upper()]) | set(rules['workflowPolicy']['requiredResolved'][module.upper()])
    if module == 'm3':
        deps.add('egfr_formula')
    if module == 'm4':
        deps |= {'so_luong_thuoc_dong_thoi', 'co_da_thuoc', 'nhom_thuoc_tu_dong'}
    return deps
DRUG_CLASSES = {'MRA','ACEI','ARB','ARNI','NSAID','digoxin','amiodarone',
                'loop_diuretic','beta_blocker','SGLT2i','other','corticosteroid','TZD','class_I_antiarrhythmic'}
GROUP_CLASSES = {'mra':'MRA','sglt2i':'SGLT2i',
                 'beta_blocker':'beta_blocker','loop_diuretic':'loop_diuretic','other':'other'}
# Exact structured ingredient/ATC codes only; never parse drug names or notes.
INGREDIENT_CLASSES = {
    'spironolactone':'MRA','eplerenone':'MRA','enalapril':'ACEI','lisinopril':'ACEI',
    'ramipril':'ACEI','captopril':'ACEI','perindopril':'ACEI','losartan':'ARB',
    'valsartan':'ARB','candesartan':'ARB','sacubitril_valsartan':'ARNI',
    'ibuprofen':'NSAID','diclofenac':'NSAID','naproxen':'NSAID','celecoxib':'NSAID',
    'digoxin':'digoxin','amiodarone':'amiodarone','furosemide':'loop_diuretic',
    'bumetanide':'loop_diuretic','torsemide':'loop_diuretic','bisoprolol':'beta_blocker',
    'carvedilol':'beta_blocker','metoprolol':'beta_blocker','dapagliflozin':'SGLT2i',
    'empagliflozin':'SGLT2i'}
ATC_CLASSES = {'C03DA01':'MRA','C03DA04':'MRA','C09AA02':'ACEI','C09AA03':'ACEI',
               'C09CA01':'ARB','C09CA03':'ARB','C09DX04':'ARNI','M01AE01':'NSAID',
               'M01AB05':'NSAID','C01AA05':'digoxin','C01BD01':'amiodarone'}


def medication_class(ingredient, group=None, atc=None):
    return INGREDIENT_CLASSES.get(ingredient) or ATC_CLASSES.get(atc) or GROUP_CLASSES.get(group)


def compact_drug(item):
    """Adapt validated C1 drug objects to the existing mock input vocabulary."""
    if 'ingredientCode' not in item:
        return deepcopy(item)
    return dict(id=item['id'],ingredient=item['ingredientCode'],
                **{'class':medication_class(item['ingredientCode'],item['therapeuticGroup'],item['atcCode'])},
                dose=item['dose'],unit=item['doseUnit'],route=item['route'],
                frequency={1:'once_daily',2:'twice_daily',3:'three_times_daily'}.get(item['timesPerDay'],'unknown'),
                detail_state=item['detailState'])


def normalize_lists(fields):
    result=deepcopy(fields)
    answer=result.get('medications',{})
    if answer.get('value_state')=='answered':
        answer['value']=[compact_drug(item) for item in answer['value']]
    return result


def problem(code, status=409, *, fields=(), detail=None):
    return ProblemError(status, code, 'Workflow thử nghiệm', detail or code,
        errors=[{'fieldCode':f,'message':code,'rejectedValue':None} for f in fields])


def check_role(principal, *, write=False, module=None):
    if principal.role == 'admin':
        raise problem('CLINICAL_DATA_SEPARATION_ENFORCED',403)
    if principal.role != 'doctor' and (write or principal.role != 'pharmacist' or module != 'm4'):
        raise problem('WORKFLOW_FORBIDDEN',403)


def access(conn, visit_id, principal, *, write=False):
    if principal.role != 'doctor':
        require_visit_access(conn, visit_id, principal, write=write)
    if principal.role == 'doctor':
        try:
            require_visit_access(conn, visit_id, principal, write=write)
        except ProblemError as exc:
            if exc.status == 404:
                raise problem('VISIT_NOT_FOUND',404) from None
            raise
    else:
        if not conn.execute('''SELECT 1 FROM visit v JOIN workflow_pharmacist_assignment a ON a.patient_id=v.patient_id
           WHERE v.id=%s AND a.pharmacist_user_id=%s AND a.revoked_at IS NULL''',
           (str(visit_id),str(principal.user_id))).fetchone():
            raise problem('VISIT_NOT_FOUND',404)
    row=conn.execute('SELECT * FROM visit WHERE id=%s'+(' FOR UPDATE' if write else ' FOR SHARE'),(str(visit_id),)).fetchone()
    if not row:
        raise problem('VISIT_NOT_FOUND',404)
    if write and row['status']=='confirmed':
        raise problem('VISIT_ALREADY_CONFIRMED')
    version=conn.execute('SELECT version_label FROM form_version WHERE id=%s',(row['form_version_id'],)).fetchone()
    if version['version_label'] not in ('v1.2','v2.0'):
        raise problem('FORM_VERSION_NOT_WORKFLOW_CAPABLE', detail=f"Lượt khám dùng phiên bản biểu mẫu {version['version_label']} chưa hỗ trợ Luồng 4 Module AI (chỉ hỗ trợ v1.2 và v2.0).")
    return row


def source_fields(conn, visit):
    """Allowlisted projection of original visit sources; free text never enters mock."""
    from .visits import _compute_age, _load_visit_detail_dict
    patient=conn.execute('SELECT * FROM patient WHERE id=%s',(visit['patient_id'],)).fetchone()
    detail=_load_visit_detail_dict(conn,visit['id'])
    fields={}
    age=_compute_age(patient,visit['visit_date'])
    if age is not None:
        fields['age']={'value_state':'answered','value':age,'unit':'years'}
    if patient['sex'] in ('male','female'):
        fields['sex']={'value_state':'answered','value':patient['sex']}
    definitions={r['code']:r for r in conn.execute('SELECT code,data_type FROM field_definition').fetchall()}
    option_map={str(r['id']):r['option_code'] for r in conn.execute('SELECT id,option_code FROM field_option').fetchall()}
    canonical={}
    for value in detail['values']:
        code=value['fieldCode']
        if definitions[code]['data_type']=='text':continue
        if value.get('answer') is not None:
            canonical[canonical_code(code)]=deepcopy(value['answer']);continue
        if value['fieldCode'].startswith('cls_') and value.get('valueText'):
            continue
        if definitions[code]['data_type']=='multi_choice' and value['valueState']=='answered':
            # Multi-choice rows saved through selectedOptions carry no scalar value; project option codes.
            ids=[str(o['fieldOptionId']) for o in value.get('selectedOptions') or []]
            if not ids:continue
            fields[code]={'value_state':'answered','value':[option_map[i] for i in ids if i in option_map]}
            continue
        if value.get('fieldOptionId') and value['valueState']=='answered':
            opt_code=option_map.get(str(value['fieldOptionId']))
            if opt_code is not None:
                val=int(opt_code) if opt_code.isdigit() else opt_code
                if code=='egfr_formula':
                    val=_EGFR_OPTION_MAP.get(val,val)
                fields[canonical_code(code)]={'value_state':'answered','value':val}
            continue
        if value.get('valueText') or value.get('valueDate'):
            continue
        answer={'value_state':value['valueState'],'value':None}
        if value['valueState']=='answered':
            scalar_val=value.get('valueBool') if value.get('valueBool') is not None else value.get('valueNum')
            if scalar_val is None:
                continue
            answer['value']=scalar_val
            if value.get('unit'):
                answer['unit']=value['unit']
        fields[value['fieldCode']]=answer
    for alias,code in ALIASES.items():
        if code in fields:
            fields[alias]=fields[code]
    # A scalar observation is selected only when it is unambiguous. Never select a tie.
    for code in {r['labCode'] for r in detail['labResults']}:
        rows=[r for r in detail['labResults'] if r['labCode']==code and r.get('valueNum') is not None]
        if len(rows)==1:
            r=rows[0]
            fields[code]={'value_state':'answered','value':r['valueNum'],'unit':r['unit'],'measuredAt':r['measuredAt']}
    for key,state_key in [('diagnoses','diagnosis_list_state'),('medications','medication_list_state'),('allergies','allergy_list_state')]:
        state=visit[state_key]
        items=[]
        if key=='diagnoses':
            items=[r['code'] for r in detail[key]]
        elif key=='medications':
            for r in detail[key]:
                if r['status']!='active':continue
                ingredient=r.get('activeIngredient')
                ingredient=ingredient if ingredient in INGREDIENT_CLASSES else r.get('atcCode') or 'unmapped'
                items.append({'id':r['id'],'ingredient':ingredient,
                    'class':medication_class(ingredient,atc=r.get('atcCode')),
                    'dose':r.get('dose'),'unit':r.get('unit'),
                    'route':{'subcutaneous':'sc'}.get(r.get('route'),r.get('route')),
                    'frequency':r.get('frequency') if r.get('frequency') in ('once_daily','twice_daily','three_times_daily','as_needed') else 'unknown',
                    'detail_state':'unknown'})
        else:
            items=[{'id':r['id'],'ingredient':r.get('atcCode') or 'unmapped'} for r in detail[key]]
        fields[key]={'value_state':'answered' if state in ('known','none') else 'unknown','value':items if state in ('known','none') else None}
    for code in ('age','sex'):
        if fields.get(code,{}).get('value_state')=='answered':canonical.pop(code,None)
    fields.update(canonical)
    label=conn.execute('SELECT version_label FROM form_version WHERE id=%s',(visit['form_version_id'],)).fetchone()['version_label']
    if label=='v2.0':
        from .his_v2.runtime import project_fields
        fields=project_fields(fields,detail,patient,visit,option_map)
    return {k:_normalize_field_answer(k,v) for k,v in fields.items()}


def rules_for_visit(conn,visit):
    rules=mock.load_rules()
    label=conn.execute('SELECT version_label FROM form_version WHERE id=%s',(visit['form_version_id'],)).fetchone()['version_label']
    if label=='v2.0':
        from .his_v2.rules import profile
        rules=profile(rules)
    return rules


def blank(visit, fields):
    return dict(visit_id=visit['id'],row_version=1,fields=fields,observations=[{'id':str(uuid4()),'fieldCode':k,'answer':deepcopy(v)} for k,v in fields.items() if v.get('measuredAt')],recent_test_evidence={},module_meta={},
                completed_at=None,source_hash=digest(fields),source_fields=deepcopy(fields),source_revision_no=visit['current_revision_no'])


def load(conn, visit, *, write=False, request=None, principal=None):
    row=conn.execute('SELECT * FROM ai_workflow WHERE visit_id=%s FOR UPDATE',(visit['id'],)).fetchone()
    if row:
        synchronize_source(conn,visit,row,request,principal)
        return row
    result=blank(visit,source_fields(conn,visit))
    if write:
        conn.execute('''INSERT INTO ai_workflow(visit_id,fields,source_hash,source_fields,source_revision_no,observations) VALUES(%s,%s,%s,%s,%s,%s)''',
                     (visit['id'],Jsonb(result['fields']),result['source_hash'],Jsonb(result['source_fields']),result['source_revision_no'],Jsonb(result['observations'])))
    return result


def save(conn, workflow, *, bump=True):
    if bump:
        workflow['row_version']+=1
    conn.execute('''UPDATE ai_workflow SET row_version=%s,fields=%s,observations=%s,recent_test_evidence=%s,
      module_meta=%s,completed_at=%s,source_hash=%s,source_fields=%s,source_revision_no=%s,updated_at=now() WHERE visit_id=%s''',
      (workflow['row_version'],Jsonb(workflow['fields']),Jsonb(workflow['observations']),Jsonb(workflow['recent_test_evidence']),
       Jsonb(workflow['module_meta']),workflow['completed_at'],workflow['source_hash'],Jsonb(workflow['source_fields']),workflow['source_revision_no'],workflow['visit_id']))


def rows(conn, visit_id):
    runs=conn.execute('SELECT * FROM ai_module_run WHERE visit_id=%s ORDER BY module,attempt',(visit_id,)).fetchall()
    decisions=conn.execute('SELECT * FROM ai_module_decision WHERE visit_id=%s AND superseded_at IS NULL ORDER BY module',(visit_id,)).fetchall()
    return {m:next((r for r in reversed(runs) if r['module']==m),None) for m in MODULES}, {r['module']:r for r in decisions}


def required(module, fields, rules):
    resolved=rules['workflowPolicy']['requiredResolved'][module.upper()]
    strict=set(rules['workflowPolicy']['requiredAnswered'])
    missing=[k for k in resolved if fields.get(k,{}).get('value_state') not in ('answered','unknown')
             or k in strict and fields.get(k,{}).get('value_state')!='answered']
    # eGFR's formula is part of the same field group.
    if module=='m3' and fields.get('egfr_ckd_epi',{}).get('value_state')=='answered' and fields.get('egfr_formula',{}).get('value_state') not in ('answered','unknown'):
        missing.append('egfr_formula')
    return missing,[k for k in resolved if fields.get(k,{}).get('value_state')=='unknown']


def merged_confirmations(conn, run):
    output=deepcopy(run['output'])
    if run['module']=='m4' and output:
        output['xac_nhan_bac_si']=[dict(alertId=r['alert_id'],quyet_dinh=r['decision'],**({'ly_do':r['reason']} if r['reason'] else {}))
          for r in conn.execute('SELECT * FROM ai_module_confirmation WHERE output_ref=%s AND superseded_at IS NULL ORDER BY created_at,id',(run['id'],)).fetchall()]
    return output


def check_confirmations(output, confirmations, *, finish=False):
    alerts={a['id']:a for a in output['canh_bao']}
    seen=set()
    for c in confirmations:
        key=c.get('alertId')
        if key not in alerts or key in seen:
            raise problem('M4_ALERT_INVALID',422)
        seen.add(key)
        reason=c.get('ly_do','')
        reason=reason.strip() if isinstance(reason,str) else ''
        if not reason and alerts[key]['muc_do']=='Nghiêm trọng':
            raise problem('M4_SERIOUS_REASON_REQUIRED',422)
        if not reason and c.get('quyet_dinh')=='Không đồng ý':
            raise problem('M4_DISAGREE_REASON_REQUIRED',422)
        if c.get('quyet_dinh') not in ('Đồng ý','Không đồng ý'):
            raise problem('OUTPUT_SCHEMA_INVALID',422)
    pending=[k for k,a in alerts.items() if a['muc_do']=='Nghiêm trọng' and k not in seen]
    if finish and pending:
        raise problem('M4_SERIOUS_ALERT_UNRESOLVED',422,fields=pending)
    return pending


def state(conn, visit, workflow, rules=None):
    rules=rules or rules_for_visit(conn,visit)
    latest,decisions=rows(conn,visit['id'])
    fields=deepcopy(workflow['fields'])
    prescription=decisions.get('m3',{}).get('selected_prescription')
    project_prescription(fields,prescription)
    pending=[]
    m4_output=None
    if 'm4' in decisions:
        m4_output=decisions['m4']['effective_output']
    elif latest['m4'] and latest['m4']['status']=='succeeded':
        m4_output=merged_confirmations(conn,latest['m4'])
    if m4_output:
        pending=check_confirmations(m4_output,m4_output['xac_nhan_bac_si'])
    modules={}
    for i,module in enumerate(MODULES):
        run,decision=latest[module],decisions.get(module)
        meta=workflow['module_meta'].get(module,{})
        missing,unknown=required(module,fields,rules)
        upstream=all(m in decisions and not workflow['module_meta'].get(m,{}).get('staleAt') for m in MODULES[:i])
        stale=bool(meta.get('staleAt') and run)
        editing=bool(meta.get('editing'))
        running=bool(run and run['status']=='running')
        current=('stale' if stale else 'accepted' if decision else 'locked' if not upstream else
                 'needs_input' if missing else 'ran' if run and run['status']=='succeeded' and not editing else 'ready')
        attempt=run['attempt'] if run else 0
        actions=[]
        if current=='ready':
            actions=['rerun' if attempt else 'run']
        elif current=='ran':
            actions=['edit']
            if module=='m4':
                if m4_output and m4_output['canh_bao']:
                    actions+=['confirm_m4']
                if attempt>=2:
                    actions+=['accept_ai','manual_override']
                if not pending:
                    actions+=['complete']
            else:
                actions+=['continue_next'] if attempt==1 else ['accept_ai','manual_override']
        elif current=='accepted':
            actions=['edit']
            if module=='m4' and not workflow['completed_at'] and not pending and upstream:
                actions+=['complete']
        elif current=='stale':
            actions=['edit']+(['rerun'] if upstream and not missing else [])
        if running:
            actions=[]
        modules[module]=dict(module=module,state=current,attemptCount=attempt,latestRunId=str(run['id']) if run else None,
            effectiveDecisionId=str(decision['id']) if decision else None,decisionSource=decision['source'] if decision else None,
            missingFieldCodes=[form_code(k) for k in missing],unknownFieldCodes=unknown,staleReasons=meta.get('reasons',[]) if stale else [],
            isEditing=editing,isRunning=running,availableActions=actions,
            staleChangedAt=meta.get('staleAt') if stale else None,staleChangedModule=meta.get('staleModule') if stale else None)
    return dict(visitId=str(visit['id']),rowVersion=workflow['row_version'],contractVersion=CONTRACT,engine='mock-rules',
                simulationLabel=rules['displayLabel'],completed=workflow['completed_at'] is not None,
                completedAt=to_iso(workflow['completed_at']),modules=modules,pendingSeriousAlertIds=pending)


def audit(conn, request, principal, action, visit_id, **detail):
    record_audit_log(conn,actor_user_id=principal.user_id,action=action,entity_type='visit',entity_id=visit_id,
      request_id=get_request_id(request),ip=get_client_ip(request),detail=detail)


def upstream(module, view):
    if any(view['modules'][m]['state']!='accepted' for m in MODULES[:MODULES.index(module)]):
        raise problem('WORKFLOW_UPSTREAM_NOT_ACCEPTED')


def invalidate(conn, workflow, source, changed, request=None, principal=None):
    latest,_=rows(conn,workflow['visit_id'])
    invalid=[]
    stamp=datetime.now(timezone.utc).isoformat()
    for module in MODULES[MODULES.index(source):]:
        if not latest[module]:
            continue
        invalid.append(module)
        workflow['module_meta'][module]={'staleAt':stamp,'staleModule':source,'reasons':['INPUT_CHANGED:'+k for k in sorted(changed)],'editing':False}
        conn.execute('UPDATE ai_module_decision SET superseded_at=now() WHERE visit_id=%s AND module=%s AND superseded_at IS NULL',
                     (workflow['visit_id'],module))
    if invalid:
        workflow['completed_at']=None
        if request:
            audit(conn,request,principal,'workflow_invalidated',workflow['visit_id'],modules=invalid,fieldCodes=sorted(changed))
    return invalid


def compare_version(workflow, body, if_match):
    if body.rowVersion is None:
        raise problem('CONCURRENCY_ROW_VERSION_MISMATCH')
    expected=parse_if_match(if_match,body.rowVersion,current_row_version=workflow['row_version'])
    if expected!=workflow['row_version']:
        raise ProblemError(409,'CONCURRENCY_ROW_VERSION_MISMATCH','Xung đột phiên bản','Tải lại workflow trước khi ghi.',current_row_version=workflow['row_version'])


def validate_fields(fields, allowed):
    errors=[]
    contracts=SCHEMA['$defs']['fields']['properties']
    for key,answer in fields.items():
        code=None
        if key not in allowed:
            code='FIELD_NOT_WORKFLOW_INPUT'
        elif not matches(answer,contracts.get(key,{'$ref':'#/$defs/observation'})):
            code='FIELD_ENUM_INVALID' if key in (*LISTS,'kho_tho_nang','phu_chi_duoi_muc_do','trieu_chung_khong_dien_hinh','egfr_formula','sex') else 'FIELD_OUT_OF_RANGE'
            steps={'bien_thien_can_nang_7ngay':'.1','e_over_a_ratio':'.01','egfr_ckd_epi':'1'}
            if key in steps and isinstance(answer,dict) and type(answer.get('value')) in (int,float):
                try:
                    if Decimal(str(answer['value'])) % Decimal(steps[key]):
                        code='FIELD_PRECISION_INVALID'
                except InvalidOperation:
                    code='FIELD_OUT_OF_RANGE'
            if isinstance(answer,dict) and answer.get('value_state')=='answered':
                if key in ('cls_bnp','cls_nt_probnp','cls_lvef','cls_creatinin','cls_kali'):
                    properties=contracts[key]['oneOf'][0]['properties']
                    if answer.get('unit')!=properties['unit']['const']:
                        code='UNIT_UNSUPPORTED'
                    elif not matches(answer.get('measuredAt'),properties['measuredAt']):
                        code='TIME_MISSING'
                elif 'unit' in answer and not matches(answer['unit'],contracts.get(key,{}).get('oneOf',[{'properties':{}}])[0]['properties'].get('unit',True)):
                    code='UNIT_UNSUPPORTED'
        elif answer.get('value_state')=='answered':
            value=answer['value']
            if key in LISTS and not isinstance(value,list):
                code='FIELD_ENUM_INVALID'
            elif key in ('medications','allergies'):
                allowed_keys={'id','ingredient','class','dose','unit','route','frequency','detail_state'}
                for item in value:
                    if key=='medications' and isinstance(item,dict) and 'ingredientCode' in item:
                        if not matches(item,{'$ref':'#/$defs/drug'}):
                            code='FIELD_ENUM_INVALID';break
                        continue
                    if not isinstance(item,dict) or set(item)-allowed_keys or not isinstance(item.get('id'),str) or not isinstance(item.get('ingredient'),str) or not re.fullmatch(r'[A-Za-z0-9_-]{1,100}',item['ingredient']):
                        code='FIELD_ENUM_INVALID';break
                    if key=='medications' and (item.get('class') not in (*DRUG_CLASSES,None)
                        or item.get('dose') is not None and (type(item['dose']) not in (int,float) or not 0<item['dose']<=100000)
                        or item.get('unit') not in ('mg','g','mcg','mL','IU','tablet',None)
                        or item.get('route') not in ('oral','iv','im','sc','inhaled','topical','other',None)
                        or item.get('frequency') not in ('once_daily','twice_daily','three_times_daily','as_needed','unknown',None)):
                        code='FIELD_ENUM_INVALID';break
            elif key=='diagnoses' and any(not isinstance(v,str) or not re.fullmatch(r'[A-Z][0-9]{2}(?:\.[0-9A-Z]{1,4})?',v) for v in value):
                code='FIELD_ENUM_INVALID'
            elif key not in contracts and key not in LISTS and type(value) not in (int,float,bool):
                code='FIELD_ENUM_INVALID'
            if key in ('bat_thuong_cau_truc_tim','tang_huyet_ap','dai_thao_duong','copd','thieu_mau','tinh_mach_co_noi','ran_am_phoi') and type(value) is not bool:
                code='FIELD_ENUM_INVALID'
            if key in ('ecg_12_chuyen_dao','xquang_nguc_thang'):
                if all(v is None or v=='unknown' for v in value.values()):
                    code='FIELD_ENUM_INVALID'
        if code:
            messages={'TIME_MISSING':'Thiếu hoặc sai thời điểm đo ISO-8601 có múi giờ (measuredAt).',
                      'UNIT_UNSUPPORTED':'Đơn vị không được hỗ trợ cho trường này.',
                      'FIELD_OUT_OF_RANGE':'Giá trị ngoài miền cho phép hoặc sai kiểu dữ liệu.',
                      'FIELD_PRECISION_INVALID':'Giá trị không đúng bước số cho phép.',
                      'FIELD_ENUM_INVALID':'Giá trị không thuộc danh sách lựa chọn hoặc sai cấu trúc.',
                      'FIELD_NOT_WORKFLOW_INPUT':'Trường không thuộc đầu vào workflow.'}
            errors.append({'fieldCode':key,'code':code,'message':messages[code],'rejectedValue':None})
    if errors:
        raise ProblemError(422,errors[0]['code'],'Dữ liệu không hợp lệ','Kiểm tra các trường được liệt kê.',errors=errors)


def allowed_fields(conn, visit):
    definitions=conn.execute('''SELECT fd.code FROM form_field ff JOIN field_definition fd ON fd.id=ff.field_definition_id
                              WHERE ff.form_version_id=%s AND fd.data_type<>'text' ''',(visit['form_version_id'],)).fetchall()
    return {r['code'] for r in definitions}|set(ALIASES)|set(LISTS)|{'age','sex','egfr_formula'}


def semantic(answer):
    if answer is None:
        return None
    return {k:v for k,v in answer.items() if v is not None and k not in ('reason','ownerModule')}


def owner_for(key, module=None, fields=None, rules=None):
    if key in ('medications','allergies'):
        return 'm4'
    if key in M3_FIELDS:
        return 'm3'
    return 'm1'


def consumed_fields(run):
    """Dependencies recorded by this run, not all fields its module could read."""
    snapshot=run['input_snapshot']
    codes=set(snapshot['fields'])
    codes.update(o['fieldCode'] for o in snapshot['observations'])
    evidence=(run.get('engine_context') or {}).get('recentTestEvidence',{})
    codes.update(e['fieldCode'] for e in evidence.values() if e.get('fieldCode'))
    return codes


def prescription_to_compact(prescription):
    return [compact_drug(d)
            for d in prescription['items'] if d['action']!='stop']


def project_prescription(fields,prescription):
    if not prescription:return
    removed={d['replacesMedicationId'] for d in prescription['items'] if d.get('replacesMedicationId')}
    selected_ids={d['id'] for d in prescription['items']}
    current=fields.get('medications',{})
    if current.get('value_state')=='answered':
        current['value']=[d for d in current['value'] if d['id'] not in removed|selected_ids]
    fields['selected_medications']={'value_state':'answered','value':prescription_to_compact(prescription)}


def make_snapshot(conn, visit, workflow, module, rules):
    _,decisions=rows(conn,visit['id'])
    ids=[str(decisions[m]['id']) for m in MODULES[:MODULES.index(module)]]
    prescription=decisions.get('m3',{}).get('selected_prescription') if module=='m4' else None
    fields=deepcopy(workflow['fields'])
    project_prescription(fields,prescription)
    dependencies=set(rules['outputProjection']['gapFields'][module.upper()])|set(rules['workflowPolicy']['requiredResolved'][module.upper()])
    if module=='m3':dependencies.add('egfr_formula')
    observation_codes=dependencies|(M2_OBSERVATION_FIELDS if module=='m2' else set())
    fields={k:_normalize_field_answer(k,v) for k,v in fields.items() if k in dependencies}
    # Snapshot is a private allowlisted workflow projection, separate from the legacy AI export.
    label=conn.execute('SELECT version_label FROM form_version WHERE id=%s',(visit['form_version_id'],)).fetchone()['version_label']
    snap=dict(formVersionId=str(visit['form_version_id']),formVersionLabel=label,visitRevisionNo=visit['current_revision_no'],
              mappingVersion='hf-map/2.0' if label=='v2.0' else 'hf-map/1.1-test',fields=fields,upstreamDecisionIds=ids,selectedPrescription=prescription,
              observations=[_normalize_observation(o) for o in workflow['observations'] if o.get('fieldCode') in observation_codes],
              lists={k:_normalize_field_answer(k,fields.get(k,{'value_state':'unknown','value':None})) for k in LISTS})
    try:
        validate(snap,'inputSnapshot')
    except ValueError:
        props=SCHEMA['$defs']['fields']['properties']
        labels={r['code']:r['label_vi'] for r in conn.execute('SELECT code,label_vi FROM field_definition').fetchall()}
        bad_errors=[]
        for k,val in snap['fields'].items():
            sch=props.get(k,{'$ref':'#/$defs/observation'})
            if not matches(val,sch):
                fcode=form_code(k)
                lbl=labels.get(fcode) or labels.get(k) or fcode
                reason='định dạng hoặc miền giá trị dữ liệu cũ chưa tương thích.'
                if isinstance(val,dict) and val.get('value_state')=='answered':
                    branches=sch.get('oneOf',[sch]) if isinstance(sch,dict) else []
                    ans_branch=next((b for b in branches if isinstance(b,dict) and b.get('properties',{}).get('value_state',{}).get('const')=='answered'),{})
                    if 'measuredAt' in ans_branch.get('required',[]) and not val.get('measuredAt'):
                        reason='thiếu thời điểm đo (measuredAt).'
                    elif 'unit' in ans_branch.get('properties',{}) and ans_branch['properties']['unit'].get('const') and val.get('unit')!=ans_branch['properties']['unit']['const']:
                        reason=f"đơn vị chưa đúng chuẩn ({ans_branch['properties']['unit']['const']})."
                bad_errors.append({'fieldCode':fcode,'message':f'{lbl}: {reason}','rejectedValue':None})
        obs_sch=SCHEMA['$defs']['inputSnapshot']['properties']['observations']['items']
        for obs in snap['observations']:
            if not matches(obs,obs_sch):
                fcode=form_code(obs.get('fieldCode',''))
                lbl=labels.get(fcode) or fcode or 'cận lâm sàng'
                if not any(e['fieldCode']==fcode for e in bad_errors):
                    bad_errors.append({'fieldCode':fcode,'message':f'{lbl}: bản ghi thời điểm đo dữ liệu cũ chưa đúng định dạng.','rejectedValue':None})
        if bad_errors:
            summary='; '.join(e['message'] for e in bad_errors[:4])
            detail=f"Không thể chạy {module.upper()} do dữ liệu lượt khám cũ chưa tương thích ({summary}). Vui lòng mở biểu mẫu, cập nhật và lưu lại các trường này rồi chạy lại."
        else:
            detail=f"Không thể chạy {module.upper()} do gói dữ liệu đầu vào của lượt khám cũ chưa tương thích với biểu mẫu hiện hành. Vui lòng mở biểu mẫu, kiểm tra và lưu lại."
        raise ProblemError(422,'WORKFLOW_INPUT_INCOMPATIBLE','Dữ liệu lượt khám chưa tương thích để chạy Module',detail,errors=bad_errors) from None
    engine={**snap,'fields':normalize_lists(fields),'visitTime':to_iso(visit['visit_date']),
            'recentTestEvidence':deepcopy(workflow['recent_test_evidence']) if module=='m2' else {}}
    for m,decision in decisions.items():
        if m in MODULES[:MODULES.index(module)]:
            engine['effective_'+m]=decision['effective_output']
    return snap,engine,digest({'snapshot':snap,'rules':rules,'visitTime':engine['visitTime'],'recentTestEvidence':engine['recentTestEvidence'],'upstreamOutputs':{m:decisions[m]['effective_output'] for m in MODULES[:MODULES.index(module)]}})


def run_view(row):
    return dict(id=str(row['id']),visitId=str(row['visit_id']),module=row['module'],attempt=row['attempt'],status=row['status'],
      inputSnapshot=row['input_snapshot'],inputHash=row['input_hash'],upstreamDecisionIds=row['upstream_decision_ids'],output=row['output'],
      error=row['error'],engine=row['engine'],rulesVersion=row['rules_version'],contractVersion=row['contract_version'],
      startedAt=to_iso(row['started_at']),finishedAt=to_iso(row['finished_at']),runBy=str(row['run_by']))


def decision_view(row):
    return dict(id=str(row['id']),visitId=str(row['visit_id']),module=row['module'],source=row['source'],runId=str(row['run_id']) if row['run_id'] else None,
      output=row['effective_output'],selectedPrescription=row['selected_prescription'],inputHash=row['input_hash'],upstreamDecisionIds=row['upstream_decision_ids'],
      decidedBy=str(row['decided_by']),decidedAt=to_iso(row['decided_at']),supersededAt=to_iso(row['superseded_at']),contractVersion=CONTRACT)


def module_match(module, body):
    if module not in MODULES or body.module!=module:
        raise problem('WORKFLOW_MODULE_MISMATCH',422)


@router.get('/{visitId}/workflow', operation_id='getVisitWorkflow')
def get_workflow(visitId:UUID,request:Request,response:Response,module:str|None=Query(default=None),principal:Principal=Depends(workflow_principal)):
    check_role(principal,module=module)
    with request.app.state.pool.connection() as conn:
        visit=access(conn,visitId,principal)
        workflow=load(conn,visit,request=request,principal=principal)
        view=state(conn,visit,workflow)
        response.headers['ETag']='"'+str(workflow['row_version'])+'"'
        if module=='m4':
            latest,decisions=rows(conn,visitId)
            output=decisions.get('m4',{}).get('effective_output')
            if output is None and latest['m4'] and latest['m4']['status']=='succeeded':
                output=merged_confirmations(conn,latest['m4'])
            return dict(visitId=str(visitId),rowVersion=workflow['row_version'],module='m4',state=view['modules']['m4']['state'],output=output)
        return view


@router.get('/{visitId}/workflow/{module}/fields',operation_id='getWorkflowFields')
def get_fields(visitId:UUID,module:str,request:Request,response:Response,principal:Principal=Depends(workflow_principal)):
    check_role(principal)
    if module not in MODULES:
        raise problem('WORKFLOW_MODULE_MISMATCH',422)
    with request.app.state.pool.connection() as conn:
        visit=access(conn,visitId,principal);workflow=load(conn,visit,request=request,principal=principal)
        response.headers['ETag']='"'+str(workflow['row_version'])+'"'
        metadata=field_metadata(conn,visit)
        fields={k:{**v,'ownerModule':owner_for(k)} for k,v in workflow['fields'].items()}
        return {'module':module,'rowVersion':workflow['row_version'],'fields':fields,
                'fieldMetadata':metadata,'observations':workflow['observations']}


@router.put('/{visitId}/workflow/{module}/fields',operation_id='saveWorkflowFields')
def put_fields(visitId:UUID,module:str,body:WorkflowFieldsRequest,request:Request,response:Response,
               if_match:str|None=Header(default=None,alias='If-Match'),principal:Principal=Depends(workflow_principal)):
    check_role(principal,write=True);module_match(module,body)
    rules=mock.load_rules()
    with request.app.state.pool.connection() as conn:
        visit=access(conn,visitId,principal,write=True);workflow=load(conn,visit,write=True,request=request,principal=principal)
        rules=rules_for_visit(conn,visit)
        compare_version(workflow,body,if_match)
        if body.fields:
            raise problem('WORKFLOW_INPUTS_MOVED_TO_DRAFT',422,fields=[form_code(k) for k in body.fields],
                detail='Lưu đầu vào tại PUT /visits/{id}/draft, values[].answer, dùng rowVersion của lượt khám.')
        if body.recentTestEvidence is not None:
            if set(body.recentTestEvidence)-{'bnp_ntprobnp','ecg','sieu_am_tim','xquang'}:
                raise problem('FIELD_ENUM_INVALID',422,fields=['recentTestEvidence'])
            for evidence in body.recentTestEvidence.values():
                if (not isinstance(evidence,dict) or set(evidence)-{'id','fieldCode','measuredAt','doctorConfirmedReuse'}
                    or type(evidence.get('doctorConfirmedReuse')) is not bool
                    or not any(o['id']==evidence.get('id') and o['fieldCode']==evidence.get('fieldCode') for o in workflow['observations'])):
                    raise problem('FIELD_ENUM_INVALID',422,fields=['recentTestEvidence'])
        evidence_changed=body.recentTestEvidence is not None and body.recentTestEvidence!=workflow['recent_test_evidence']
        invalid=[]
        if evidence_changed:
            invalid=invalidate(conn,workflow,'m2',{'recent_test_evidence'},request,principal)
            workflow['recent_test_evidence']=deepcopy(body.recentTestEvidence)
            save(conn,workflow)
            audit(conn,request,principal,'workflow_fields_saved',visitId,module=module,fieldCodes=['recent_test_evidence'])
        # Explicit edit mode does not invalidate unchanged data.
        if 'editing' in body.model_fields_set:
            meta=workflow['module_meta'].setdefault(module,{})
            if bool(meta.get('editing'))!=body.editing:
                meta['editing']=body.editing;save(conn,workflow)
        view=state(conn,visit,workflow,rules)
        response.headers['ETag']='"'+str(workflow['row_version'])+'"'
        return dict(rowVersion=workflow['row_version'],module=module,state=view['modules'][module]['state'],invalidatedModules=invalid,
                    unknownFieldCodes=view['modules'][module]['unknownFieldCodes'])


def replay(conn,principal,endpoint,key,body):
    if not key:
        return None
    row=conn.execute('SELECT * FROM ai_workflow_request WHERE actor=%s AND endpoint=%s AND idempotency_key=%s',
                     (str(principal.user_id),endpoint,key)).fetchone()
    if row:
        if row['payload_hash']!=digest(body):
            raise problem('IDEMPOTENCY_KEY_REUSED')
        if '_failure' in row['receipt']:
            code,status=row['receipt']['_failure']
            raise problem(code,status)
        return row['receipt']
    return None


def remember(conn,principal,endpoint,key,body,receipt):
    if key:
        conn.execute('INSERT INTO ai_workflow_request(actor,endpoint,idempotency_key,payload_hash,receipt) VALUES(%s,%s,%s,%s,%s)',
                     (str(principal.user_id),endpoint,key,digest(body),Jsonb(receipt)))


@router.post('/{visitId}/workflow/{module}/runs',operation_id='runWorkflowModule')
def post_run(visitId:UUID,module:str,body:WorkflowRunRequest,request:Request,response:Response,
             if_match:str|None=Header(default=None,alias='If-Match'),idempotency_key:str|None=Header(default=None,alias='Idempotency-Key'),
             principal:Principal=Depends(workflow_principal)):
    check_role(principal,write=True);module_match(module,body)
    rules=mock.load_rules();endpoint=str(request.url.path);payload=body.model_dump(mode='json')
    with request.app.state.pool.connection() as conn:
        visit=access(conn,visitId,principal,write=True);workflow=load(conn,visit,write=True,request=request,principal=principal)
        rules=rules_for_visit(conn,visit)
        receipt=replay(conn,principal,endpoint,idempotency_key,payload)
        if receipt:
            response.headers['Location']=endpoint+'/'+receipt['runId'];response.headers['ETag']='"'+str(receipt['rowVersion'])+'"'
            return receipt
        compare_version(workflow,body,if_match)
        view=state(conn,visit,workflow,rules);upstream(module,view)
        if view['modules'][module]['isRunning']:
            raise problem('WORKFLOW_RUN_IN_PROGRESS')
        if view['modules'][module]['missingFieldCodes']:
            raise problem('WORKFLOW_REQUIRED_VALUE_MISSING',422,fields=view['modules'][module]['missingFieldCodes'])
        snapshot,engine_input,input_hash=make_snapshot(conn,visit,workflow,module,rules)
        attempt=view['modules'][module]['attemptCount']+1;run_id=uuid4()
        invalidate(conn,workflow,module,{'rerun'},request,principal)
        conn.execute('''INSERT INTO ai_module_run(id,visit_id,module,attempt,status,form_version_id,visit_revision_no,input_snapshot,engine_context,input_hash,upstream_decision_ids,engine,rules_version,run_by)
          VALUES(%s,%s,%s,%s,'running',%s,%s,%s,%s,%s,%s,'mock-rules',%s,%s)''',
          (run_id,visitId,module,attempt,visit['form_version_id'],visit['current_revision_no'],Jsonb(snapshot),Jsonb({'visitTime':engine_input['visitTime'],'recentTestEvidence':engine_input['recentTestEvidence'],'rulesHash':digest(rules)}),input_hash,Jsonb(snapshot['upstreamDecisionIds']),rules['rulesVersion'],principal.user_id))
        # A rerun supersedes the old decision but preserves every history row.
        save(conn,workflow);prepared_version=workflow['row_version']
        audit(conn,request,principal,'workflow_run',visitId,module=module,runId=str(run_id),phase='started',attempt=attempt,inputHash=input_hash)
    failure=None;output=None
    executor=ThreadPoolExecutor(max_workers=1)
    try:
        future=executor.submit(mock.run_module,module,engine_input,rules=rules)
        output,_matched=future.result(timeout=30)
        validate(output,module+'Output')
    except FutureTimeout:
        failure=('MOCK_TIMEOUT',504)
    except ValueError:
        failure=('OUTPUT_SCHEMA_INVALID',422)
    except Exception:
        failure=('ENGINE_UNAVAILABLE',503)
    finally:
        executor.shutdown(wait=False,cancel_futures=True)
    with request.app.state.pool.connection() as conn:
        # Scope and input are checked again after releasing the lock for the engine.
        try:
            visit=access(conn,visitId,principal,write=True)
            workflow=load(conn,visit,write=True,request=request,principal=principal)
            current_snapshot,_,current_hash=make_snapshot(conn,visit,workflow,module,rules)
            if workflow['row_version']!=prepared_version or current_hash!=input_hash:
                failure=('INPUT_CHANGED_DURING_RUN',409)
        except (ProblemError,KeyError):
            # Access revoked/confirmed mid-run: finish the run as failed without exposing data.
            failure=('INPUT_CHANGED_DURING_RUN',409)
            workflow=conn.execute('SELECT * FROM ai_workflow WHERE visit_id=%s FOR UPDATE',(visitId,)).fetchone()
        if failure:
            error={'code':failure[0],'message':'Không ghi nhận kết quả module; kiểm tra dữ liệu và chạy lại bằng nút.','retryable':True}
            conn.execute("UPDATE ai_module_run SET status='failed',error=%s,finished_at=now() WHERE id=%s",(Jsonb(error),run_id))
        else:
            conn.execute("UPDATE ai_module_run SET status='succeeded',output=%s,finished_at=now() WHERE id=%s",(Jsonb(output),run_id))
            workflow['module_meta'][module]={'editing':False}
        save(conn,workflow)
        audit(conn,request,principal,'workflow_run',visitId,module=module,runId=str(run_id),phase='failed' if failure else 'succeeded',code=failure[0] if failure else 'OK')
        receipt=dict(rowVersion=workflow['row_version'],module=module,state='ran' if not failure else state(conn,visit,workflow,rules)['modules'][module]['state'],
                     runId=str(run_id),attempt=attempt,engine='mock-rules',rulesVersion=rules['rulesVersion'])
        remember(conn,principal,endpoint,idempotency_key,payload,{'_failure':list(failure)} if failure else receipt)
    if failure:
        raise problem(failure[0],failure[1])
    response.headers['Location']=endpoint+'/'+str(run_id);response.headers['ETag']='"'+str(receipt['rowVersion'])+'"'
    return receipt


@router.get('/{visitId}/workflow/{module}/runs',operation_id='listWorkflowRuns')
def list_runs(visitId:UUID,module:str,request:Request,principal:Principal=Depends(workflow_principal)):
    check_role(principal)
    if module not in MODULES:
        raise problem('WORKFLOW_MODULE_MISMATCH',422)
    with request.app.state.pool.connection() as conn:
        access(conn,visitId,principal)
        records=conn.execute("SELECT * FROM ai_module_run WHERE visit_id=%s AND module=%s AND status<>'running' ORDER BY attempt DESC",(visitId,module)).fetchall()
        return {'items':[run_view(row) for row in records]}


@router.get('/{visitId}/workflow/{module}/runs/{runId}',operation_id='getWorkflowRun')
def get_run(visitId:UUID,module:str,runId:UUID,request:Request,principal:Principal=Depends(workflow_principal)):
    check_role(principal)
    with request.app.state.pool.connection() as conn:
        access(conn,visitId,principal)
        row=conn.execute('SELECT * FROM ai_module_run WHERE id=%s AND visit_id=%s AND module=%s AND status<>\'running\'',(runId,visitId,module)).fetchone()
        if not row:
            raise problem('WORKFLOW_RESULT_NOT_FOUND',404)
        return run_view(row)


@router.get('/{visitId}/workflow/{module}/decisions/{decisionId}',operation_id='getWorkflowDecision')
def get_decision(visitId:UUID,module:str,decisionId:UUID,request:Request,principal:Principal=Depends(workflow_principal)):
    check_role(principal)
    with request.app.state.pool.connection() as conn:
        access(conn,visitId,principal)
        row=conn.execute('SELECT * FROM ai_module_decision WHERE id=%s AND visit_id=%s AND module=%s',(decisionId,visitId,module)).fetchone()
        if not row:
            raise problem('WORKFLOW_RESULT_NOT_FOUND',404)
        return decision_view(row)


@router.post('/{visitId}/workflow/m4/confirmations',operation_id='confirmWorkflowM4')
def post_confirmations(visitId:UUID,body:WorkflowConfirmationRequest,request:Request,response:Response,
                       if_match:str|None=Header(default=None,alias='If-Match'),idempotency_key:str|None=Header(default=None,alias='Idempotency-Key'),principal:Principal=Depends(workflow_principal)):
    check_role(principal,write=True);module_match('m4',body)
    with request.app.state.pool.connection() as conn:
        visit=access(conn,visitId,principal,write=True);workflow=load(conn,visit,write=True,request=request,principal=principal)
        payload=body.model_dump(mode='json');endpoint=str(request.url.path)
        receipt=replay(conn,principal,endpoint,idempotency_key,payload)
        if receipt:
            response.headers['ETag']='"'+str(receipt['rowVersion'])+'"';return receipt
        compare_version(workflow,body,if_match)
        view=state(conn,visit,workflow);upstream('m4',view)
        latest,_=rows(conn,visitId);run=latest['m4']
        if not run or str(run['id'])!=str(body.outputRef) or view['modules']['m4']['state']!='ran':
            raise problem('WORKFLOW_RESULT_STALE')
        # Reason errors are semantic and precede the generic schema check.
        check_confirmations(run['output'],body.confirmations)
        if not matches(body.model_dump(mode='json'),SCHEMA['$defs']['confirmationRequest']):
            raise problem('OUTPUT_SCHEMA_INVALID',422)
        for c in body.confirmations:
            conn.execute('UPDATE ai_module_confirmation SET superseded_at=now() WHERE output_ref=%s AND alert_id=%s AND superseded_at IS NULL',(run['id'],c['alertId']))
            conn.execute('''INSERT INTO ai_module_confirmation(visit_id,output_ref,alert_id,decision,reason,actor) VALUES(%s,%s,%s,%s,%s,%s)''',
              (visitId,run['id'],c['alertId'],c['quyet_dinh'],c.get('ly_do','').strip() or None,principal.user_id))
        pending=check_confirmations(run['output'],merged_confirmations(conn,run)['xac_nhan_bac_si'])
        save(conn,workflow);audit(conn,request,principal,'workflow_confirmation',visitId,runId=str(run['id']),alertIds=[c['alertId'] for c in body.confirmations])
        response.headers['ETag']='"'+str(workflow['row_version'])+'"'
        receipt=dict(rowVersion=workflow['row_version'],module='m4',outputRef=str(run['id']),pendingSeriousAlertIds=pending,canFinish=not pending)
        remember(conn,principal,endpoint,idempotency_key,payload,receipt)
        return receipt


@router.post('/{visitId}/workflow/{module}/decision',operation_id='decideWorkflowModule')
def post_decision(visitId:UUID,module:str,body:WorkflowDecisionRequest,request:Request,response:Response,
                  if_match:str|None=Header(default=None,alias='If-Match'),idempotency_key:str|None=Header(default=None,alias='Idempotency-Key'),
                  principal:Principal=Depends(workflow_principal)):
    check_role(principal,write=True);module_match(module,body)
    endpoint=str(request.url.path);payload=body.model_dump(mode='json',exclude_none=True)
    with request.app.state.pool.connection() as conn:
        visit=access(conn,visitId,principal,write=True);workflow=load(conn,visit,write=True,request=request,principal=principal)
        receipt=replay(conn,principal,endpoint,idempotency_key,payload)
        if receipt:
            response.headers['Location']=str(request.url.path).removesuffix('/decision')+'/decisions/'+receipt['decisionId']
            return receipt
        compare_version(workflow,body,if_match);view=state(conn,visit,workflow);upstream(module,view)
        latest,_=rows(conn,visitId);run=latest[module]
        if view['modules'][module]['state']!='ran' or view['modules'][module]['isRunning']:
            raise problem('WORKFLOW_RESULT_STALE')
        if body.source=='manual':
            if run['attempt']<2:
                raise problem('MANUAL_REQUIRES_RERUN')
            if not body.manualReason or not body.manualReason.strip():
                raise problem('MANUAL_REASON_REQUIRED',422)
        if not matches(payload,SCHEMA['$defs']['decisionRequest']):
            raise problem('OUTPUT_SCHEMA_INVALID',422)
        if body.source=='ai':
            if str(body.runId)!=str(run['id']):
                raise problem('WORKFLOW_RESULT_STALE')
            output=merged_confirmations(conn,run)
        else:
            output=deepcopy(body.output)
            try:
                validate(output,module+'Output')
            except ValueError:
                raise problem('OUTPUT_SCHEMA_INVALID',422) from None
        if module=='m4':
            # A decision freezes confirmations. Require serious reviews before accepting,
            # otherwise accepted M4 cannot be confirmed through the run endpoint.
            check_confirmations(output,output['xac_nhan_bac_si'],finish=True)
        elif body.intent=='finish_workflow':
            raise problem('WORKFLOW_MODULE_MISMATCH',422)
        # Hash/lineage must still correspond to the succeeded current run.
        _,_,current_hash=make_snapshot(conn,visit,workflow,module,rules_for_visit(conn,visit))
        if current_hash!=run['input_hash']:
            raise problem('WORKFLOW_RESULT_STALE')
        decision_id=uuid4()
        conn.execute('''INSERT INTO ai_module_decision(id,visit_id,module,source,run_id,effective_output,selected_prescription,manual_reason,input_hash,upstream_decision_ids,decided_by)
          VALUES(%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)''',
          (decision_id,visitId,module,body.source,run['id'] if body.source=='ai' else None,Jsonb(output),
           Jsonb(body.selectedPrescription) if module=='m3' else None,body.manualReason.strip() if body.source=='manual' else None,
           run['input_hash'],Jsonb(run['upstream_decision_ids']),principal.user_id))
        if body.intent=='finish_workflow':
            workflow['completed_at']=datetime.now(timezone.utc)
            audit(conn,request,principal,'workflow_finished',visitId,decisionId=str(decision_id))
        save(conn,workflow);audit(conn,request,principal,'workflow_decision',visitId,module=module,decisionId=str(decision_id),source=body.source,inputHash=run['input_hash'])
        receipt=dict(rowVersion=workflow['row_version'],module=module,state='accepted',decisionId=str(decision_id),decisionSource=body.source,
                     nextModule=MODULES[MODULES.index(module)+1] if module!='m4' else None,autoRunModules=[])
        remember(conn,principal,endpoint,idempotency_key,payload,receipt)
        response.headers['Location']=str(request.url.path).removesuffix('/decision')+'/decisions/'+str(decision_id)
        response.headers['ETag']='"'+str(workflow['row_version'])+'"'
        return receipt


@router.post('/{visitId}/workflow/finish',operation_id='finishVisitWorkflow')
def post_finish(visitId:UUID,body:WorkflowFinishRequest,request:Request,response:Response,
                if_match:str|None=Header(default=None,alias='If-Match'),idempotency_key:str|None=Header(default=None,alias='Idempotency-Key'),principal:Principal=Depends(workflow_principal)):
    check_role(principal,write=True)
    with request.app.state.pool.connection() as conn:
        visit=access(conn,visitId,principal,write=True);workflow=load(conn,visit,write=True,request=request,principal=principal)
        payload=body.model_dump(mode='json');endpoint=str(request.url.path)
        receipt=replay(conn,principal,endpoint,idempotency_key,payload)
        if receipt:
            response.headers['ETag']='"'+str(receipt['rowVersion'])+'"';return receipt
        compare_version(workflow,body,if_match)
        view=state(conn,visit,workflow)
        if any(view['modules'][m]['state']!='accepted' for m in MODULES) or workflow['completed_at']:
            raise problem('WORKFLOW_UPSTREAM_NOT_ACCEPTED')
        _,decisions=rows(conn,visitId)
        check_confirmations(decisions['m4']['effective_output'],decisions['m4']['effective_output']['xac_nhan_bac_si'],finish=True)
        workflow['completed_at']=datetime.now(timezone.utc);save(conn,workflow)
        audit(conn,request,principal,'workflow_finished',visitId,decisionId=str(decisions['m4']['id']))
        response.headers['ETag']='"'+str(workflow['row_version'])+'"'
        receipt=dict(rowVersion=workflow['row_version'],completed=True,completedAt=to_iso(workflow['completed_at']))
        remember(conn,principal,endpoint,idempotency_key,payload,receipt)
        return receipt


def on_visit_saved(conn, visit_id, request=None, principal=None):
    """Legacy draft/revision writes also invalidate workflow; cannot bypass with old API."""
    if not conn.execute("SELECT to_regclass('ai_workflow') AS relation").fetchone()['relation']:
        return
    workflow=conn.execute('SELECT * FROM ai_workflow WHERE visit_id=%s FOR UPDATE',(visit_id,)).fetchone()
    if not workflow:
        visit=conn.execute('SELECT * FROM visit WHERE id=%s',(visit_id,)).fetchone()
        label=conn.execute('SELECT version_label FROM form_version WHERE id=%s',(visit['form_version_id'],)).fetchone()
        if label['version_label'] in ('v1.2','v2.0') and visit['status'] in ('draft','intake','waiting','in_progress'):load(conn,visit,write=True,request=request,principal=principal)
        return
    visit=conn.execute('SELECT * FROM visit WHERE id=%s',(visit_id,)).fetchone()
    synchronize_source(conn,visit,workflow,request,principal)


def synchronize_source(conn,visit,workflow,request=None,principal=None):
    """Refresh original inputs after legacy writes, patient edits or a revision."""
    if visit['status']=='confirmed':return
    current=source_fields(conn,visit)
    previous=workflow['source_fields']
    changed={k for k in set(current)|set(previous) if semantic(current.get(k))!=semantic(workflow['fields'].get(k))}
    revision_changed=workflow['source_revision_no']!=visit['current_revision_no']
    if changed or revision_changed:
        latest,_=rows(conn,visit['id'])
        rules=rules_for_visit(conn,visit)
        if revision_changed:
            affected='m1'
        else:
            affected=None
            for mod in MODULES:
                deps=_module_dependencies(mod,rules)
                if latest[mod]:
                    deps=deps|consumed_fields(latest[mod])
                if changed & deps:
                    affected=mod
                    break
        if affected is not None:
            invalidate(conn,workflow,affected,changed|({'visit_revision'} if revision_changed else set()),request,principal)
        for key in changed:
            if key in current:
                workflow['fields'][key]=current[key]
            else:
                workflow['fields'].pop(key,None)
        for key in changed:
            workflow['observations']=[o for o in workflow['observations'] if o['fieldCode']!=key]
            answer=current.get(key,{})
            if answer.get('measuredAt'):
                workflow['observations'].append({'id':str(uuid4()),'fieldCode':key,'answer':deepcopy(answer)})
        workflow['source_fields']=current;workflow['source_hash']=digest(current)
        workflow['source_revision_no']=visit['current_revision_no'];save(conn,workflow)
    else:
        # Silently normalize legacy shape drift (e.g. stray unit: null / ownerModule) without invalidating accepted runs.
        normalized_fields={k:_normalize_field_answer(k,v) for k,v in workflow['fields'].items()}
        normalized_obs=[_normalize_observation(o) for o in workflow['observations']]
        if normalized_fields!=workflow['fields'] or normalized_obs!=workflow['observations']:
            workflow['fields']=normalized_fields
            workflow['observations']=normalized_obs
            workflow['source_fields']=current
            workflow['source_hash']=digest(current)
            save(conn,workflow,bump=False)



def field_metadata(conn, visit):
    from .visits import load_form_version_bundle
    _,_,definitions=load_form_version_bundle(conn,visit['form_version_id'])
    definitions=[{'code':d['code'],'data_type':d['dataType']} for d in definitions]
    rules=rules_for_visit(conn,visit)
    result={}
    allowed=allowed_fields(conn,visit)
    for row in definitions:
        key=canonical_code(row['code'])
        needed=[] if row['data_type']=='text' else [m for m in MODULES if key in
            set(rules['workflowPolicy']['requiredResolved'][m.upper()])|set(rules['outputProjection']['gapFields'][m.upper()])]
        if key=='egfr_formula':needed=['m3']
        result[key]={'fieldCode':row['code'],'ownerModule':owner_for(key),'owner':'visit',
            'dataType':row['data_type'],'modules':needed,'input':row['data_type']!='text' and key in allowed}
        if key!=row['code']:result[row['code']]=deepcopy(result[key])
    result['selected_medications']={'fieldCode':None,'ownerModule':'m3','owner':'decision','dataType':'object','modules':['m4'],'input':False}
    return result


def attach_visit_workflow(conn, visit_id, detail, request=None, principal=None):
    if detail['visit']['formVersionLabel'] not in ('v1.2','v2.0') or not conn.execute("SELECT to_regclass('ai_workflow') AS relation").fetchone()['relation']:
        return
    visit=conn.execute('SELECT * FROM visit WHERE id=%s',(visit_id,)).fetchone()
    workflow=load(conn,visit,request=request,principal=principal)
    if detail['visit']['formVersionLabel']=='v2.0':
        from .his_v2.catalog import FIELDS
        auto={f['code'] for f in FIELDS if f['entryRole']=='auto'}
        if principal is not None and principal.role=='nurse':auto &= {'luot_tuoi','bmi','giam_ha_tu_the'}
        definitions={r['code']:r['id'] for r in conn.execute('SELECT fd.id,fd.code FROM form_field ff JOIN field_definition fd ON fd.id=ff.field_definition_id WHERE ff.form_version_id=%s',(visit['form_version_id'],))}
        detail['values']=[v for v in detail['values'] if v['fieldCode'] not in auto]
        for code in sorted(auto):
            a=workflow['fields'].get(canonical_code(code),{'value_state':'unknown','value':None})
            detail['values'].append(dict(visitId=str(visit_id),updatedAt=to_iso(visit['updated_at']),fieldDefinitionId=str(definitions[code]),fieldCode=code,valueState=a['value_state'],answer=deepcopy(a),
                valueNum=a['value'] if type(a['value']) in (int,float) else None,valueBool=a['value'] if type(a['value']) is bool else None,
                valueText=None,valueDate=None,fieldOptionId=None,selectedOptions=[],unit=a.get('unit')))
    if principal is not None and principal.role=='nurse':return
    summary=state(conn,visit,workflow)
    # selected_medications belongs to the M3 decision, not an input to jump to.
    for module in summary['modules'].values():
        module['missingDecisionCodes']=[k for k in module['missingFieldCodes'] if k=='selected_medications']
        module['missingFieldCodes']=[k for k in module['missingFieldCodes'] if k!='selected_medications']
    detail['workflow']=summary
    detail['fieldMetadata']=field_metadata(conn,visit)
