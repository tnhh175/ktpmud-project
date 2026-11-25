"""Versioned HF export adapter: only confirmed frozen sources, deterministic projection."""
from datetime import datetime, timezone
import hashlib
import hmac
import json
import math
import os
from pathlib import Path
from uuid import uuid4
from .hf_registry import REGISTRY, MODULES
from .models import ProblemError

CATALOG=json.loads((Path(__file__).resolve().parents[2]/'api/hf-code-catalog-0.1.json').read_text(encoding='utf-8-sig'))

def digest(value):
    return 'sha256:'+hashlib.sha256(json.dumps(value,sort_keys=True,ensure_ascii=False,separators=(',',':'),allow_nan=False,default=str).encode()).hexdigest()

def token(secret,key_version,kind,identity):
    message=json.dumps(['hfcare',key_version,kind,str(identity)],separators=(',',':')).encode()
    return kind+'_'+hmac.new(secret.encode(),message,hashlib.sha256).hexdigest()

def wrap(state='not_collected',value=None,unit=None):
    return {'valueState':state,'value':value,'unit':unit}

def normalize_unit(unit):
    return {'µmol/L':'umol/L','μmol/L':'umol/L','kg/m²':'kg/m2','lần/phút':'/min','tuổi':'years'}.get(unit,unit)

def _project_data(snapshot, encode_id, module=None):
    """Shared normalization and quality rules; identifier encoding has no clinical role."""
    source=snapshot.get('hfSource') or {}
    detail=source.get('detail') or {}
    visit=detail.get('visit') or {}
    form=source.get('form') or {}
    defs={f['code']:f for f in form.get('fieldDefinitions',[])}
    raw={v['fieldCode']:v for v in detail.get('values',[])}
    legacy=snapshot.get('values') or {}
    values={}; arrays={}; issues=[]
    def issue(code,path,field,mods,message):
        for mod in mods:
            issues.append({'issueCode':code,'path':path,'fieldCode':field or '', 'severity':'error','module':mod,'messageVi':message})
    for entry in REGISTRY['inputs']:
        code=entry['aiCode'];src=entry['source'];transform=entry['transform'];mods=entry['requiredForModules'];unit=entry['canonicalUnit']
        if transform=='omit-privacy-v1' or entry['type']=='array': continue
        item=wrap(unit=unit)
        if transform.startswith('hmac-'):
            identity=source.get(src)
            if identity: item=wrap('answered',encode_id('p' if code=='MA_BN' else 'e',identity))
        elif transform=='age-at-confirm-v1' and source.get('age') is not None:
            item=wrap('answered',source['age'],unit)
        elif transform=='sex-code-v1' and source:
            sex=source.get('sex');item=wrap('answered',{'male':1,'female':2}[sex]) if sex in ('male','female') else wrap('unknown')
        elif transform in ('identity-v1','boolean-01-v1') and src in defs:
            r=raw.get(src)
            if not r: item=wrap('unfilled',unit=unit)
            elif r['valueState']=='unknown': item=wrap('unknown',unit=unit)
            else:
                value=r.get('valueBool') if transform=='boolean-01-v1' else r.get('valueNum')
                actual=normalize_unit(r.get('unit') or (None if transform=='boolean-01-v1' else defs[src].get('canonicalUnit')))
                if transform=='boolean-01-v1' and type(value) is bool: item=wrap('answered',int(value),unit)
                elif type(value) in (int,float) and math.isfinite(value) and actual==unit: item=wrap('answered',value,unit)
                else: issue('UNIT_OR_TYPE_UNSUPPORTED','values.'+code,src,mods,'Kiểu hoặc đơn vị chưa được ánh xạ.')
        elif transform=='bmi-v1' and src in defs:
            # BMI was calculated at confirmation, never recalculate from mutable demographics.
            r=legacy.get('bmi',{})
            if r.get('state')=='answered': item=wrap('answered',r['value'],unit)
            else: item=wrap('unfilled',unit=unit)
        elif transform=='lab-series-v1' and src in defs:
            # No scalar selector approved: full measurements are in observations.labs.
            item=wrap('not_collected',unit=unit)
        values[code]=item
        if item['valueState']!='answered' and transform not in ('lab-series-v1',):
            issue('NOT_COLLECTED' if item['valueState']=='not_collected' else 'MISSING_VALUE','values.'+code,src or code,mods,
                  'Có biến chưa được thu thập hoặc chưa có ánh xạ trong hợp đồng AI.' if item['valueState']=='not_collected' else 'Chưa có dữ liệu phù hợp hợp đồng.')
    observations={'bloodPressure':[],'labs':[],'allergyDetails':[],'diagnoses':[]}
    for bp in detail.get('orthostaticBp',[]):
        observations['bloodPressure'].append({'measurementId':encode_id('b',bp['id']),'position':bp['position'],'minuteAfter':bp.get('minuteAfter'),'measuredAt':bp['measuredAt'],'values':{'HA_TAM_THU':bp['systolic'],'HA_TAM_TRUONG':bp['diastolic'],'TAN_SO_TIM':bp.get('heartRate')}})
    lab_map={e['source']:e for e in REGISTRY['inputs'] if e['transform']=='lab-series-v1'}
    for lab in detail.get('labResults',[]):
        fd=defs.get(lab['labCode'],{});entry=lab_map.get(lab['labCode']);value=lab.get('valueNum');unit=normalize_unit(lab.get('unit'));state='answered' if type(value) in (int,float) and math.isfinite(value) else 'not_collected'
        if entry and unit!=entry['canonicalUnit']:
            issue('UNIT_UNSUPPORTED','observations.labs.'+encode_id('l',lab['id']),lab['labCode'],entry['requiredForModules'],'Đơn vị kết quả chưa tương thích.');state='not_collected'
        observations['labs'].append({'observationId':encode_id('l',lab['id']),'fieldCode':lab['labCode'],'aiCode':entry['aiCode'] if entry else None,'valueState':state,'valueNum':value if state=='answered' else None,'valueText':None,'unit':unit if unit in ('pg/mL','%','umol/L','mmol/L','ng/mL','mIU/L','g/L','10^9/L','10^12/L','U/L','mL/min/1.73m2') else None,'measuredAt':lab['measuredAt']})
        if lab.get('valueText'):
            issue('FREE_TEXT_WITHHELD','observations.labs',lab['labCode'],('ai_diagnosis','ai_lab_test','ai_treatment'),'Kết luận chữ được giữ trong hồ sơ; cần quy trình rà định danh trước xuất.')
        if not lab.get('measuredAt'):
            issue('TIME_MISSING','observations.labs',lab['labCode'],('ai_diagnosis','ai_treatment'),'Thiếu thời điểm kết quả.')
    for entry in lab_map.values():
        if not any(l['aiCode']==entry['aiCode'] and l['valueState']=='answered' for l in observations['labs']):
            issue('LAB_MISSING','observations.labs',entry['source'],entry['requiredForModules'],'Chưa có kết quả đúng đơn vị; không chọn scalar hiện tại.')
    for code,key,statekey,catalogkey in [('DANH_MUC_THUOC_DANG_DUNG','medications','medicationListState','atc'),('TIEN_SU_DI_UNG','allergies','allergyListState','atc'),('BENH_DONG_MAC_ICD10','diagnoses','diagnosisListState','icd10')]:
        state=visit.get(statekey,'unknown');rows=detail.get(key,[]);items=[];mods=next(e['requiredForModules'] for e in REGISTRY['inputs'] if e['aiCode']==code)
        for row in rows:
            coding=row.get('code') if key=='diagnoses' else row.get('atcCode')
            found=coding in CATALOG[catalogkey]['entries']
            if key=='medications':
                if row.get('status')!='active':continue
                items.append({'recordId':encode_id('m',row['id']),'code':coding if found else None,'system':'ATC','version':CATALOG['atc']['systemVersion'],'display':CATALOG['atc']['entries'].get(coding),'hospitalVerified':False,'dose':row.get('dose'),'unit':row.get('unit') if row.get('unit') in ('mg','g','mcg','mL','IU') else None,'status':row['status']})
            elif key=='allergies':
                if found:items.append(coding)
                observations['allergyDetails'].append({'recordId':encode_id('a',row['id']),'code':coding if found else None,'system':'ATC','version':CATALOG['atc']['systemVersion'],'kind':row['kind'],'category':row['agentCategory'],'hospitalVerified':False})
            else:
                if row['role']=='secondary' and found:items.append(coding)
                observations['diagnoses'].append({'code':coding,'display':CATALOG['icd10']['entries'].get(coding),'role':row['role'],'system':'ICD-10','version':CATALOG['icd10']['systemVersion'],'hospitalVerified':False})
                if row.get('display'):
                    issue('FREE_TEXT_WITHHELD','observations.diagnoses.'+str(len(observations['diagnoses'])-1)+'.display','icd_display',mods,'Tên ICD tự nhập được giữ trong hồ sơ; chỉ xuất tên từ danh mục chuẩn.')
            issue('CATALOG_UNVERIFIED' if found else 'CODE_UNMAPPED','arrays.'+code, 'icd_code' if key=='diagnoses' else key, mods,'Mã chưa xác minh với danh mục bệnh viện.' if found else 'Chưa có mã chuẩn phù hợp; giữ text trong hồ sơ.')
        arrays[code]={'valueState':'answered' if state in ('known','none') else 'unknown','items':items,'listState':state}
        if state=='unknown':issue('LIST_UNKNOWN','arrays.'+code,statekey,mods,'Chưa xác nhận trạng thái danh sách.')
        # Structured drug frequency/ingredient/strength semantics have not been approved.
        if key=='medications' and items:issue('DRUG_STRUCTURE_UNSUPPORTED','arrays.'+code,key,mods,'Chưa đủ dữ liệu cấu trúc để kiểm tra DDI.')
    modules=[{'module':m,'status':'blocked' if any(i['module']==m for i in issues) else 'ready','issueCount':sum(i['module']==m for i in issues)} for m in MODULES]
    quality={'status':'blocked' if any(m['status']=='blocked' for m in modules if module is None or m['module']==module) else 'ready','requestedModule':module,'issues':issues,'modules':modules}
    return values, arrays, observations, quality


def evaluate_quality(snapshot, module=None):
    """Evaluate without HMAC configuration, export metadata, or audit writes."""
    return _project_data(snapshot, lambda kind, identity: str(identity), module)[3]


def has_hf_registry(overrides):
    # This pinned override distinguishes v1.1 and its clones from archived v1.0.
    # Form placement edits must not change which quality contract is used.
    return (overrides.get('di_ung_thuoc_can_quang') or {}).get('storageLevel') == 'visit_value'


def readiness_from_quality(quality, form):
    """Adapt quality issues to review links without introducing clinical rules."""
    definitions = {f['code']: f for f in form.get('fieldDefinitions', [])}
    visible = {f['fieldCode'] for s in form.get('sections', []) for f in s['fields']
               if f['isVisible'] and not f['isReadonly']}
    editable = {c for c in visible if not definitions[c].get('computed')
                and definitions[c]['storageLevel'] != 'patient'}
    aliases = {'medicationListState': 'medication_list_state',
               'allergyListState': 'allergy_list_state',
               'diagnosisListState': 'diagnosis_list_state',
               'medications': 'thuoc_drugname', 'allergies': 'diung_allergen',
               'diagnoses': 'icd_code', 'age': 'luot_tuoi', 'sex': 'bn_gioi_tinh'}
    fillable_issues = {'MISSING_VALUE', 'LIST_UNKNOWN', 'LAB_MISSING', 'TIME_MISSING',
                       'UNIT_UNSUPPORTED', 'UNIT_OR_TYPE_UNSUPPORTED'}
    modules = []
    for module in quality['modules']:
        issues = []
        missing = []
        for issue in quality['issues']:
            if issue['module'] != module['module']:
                continue
            code = aliases.get(issue['fieldCode'], issue['fieldCode'])
            code = code if code in definitions else None
            issues.append({'issueCode': issue['issueCode'], 'fieldCode': code,
                           'messageVi': issue['messageVi']})
            if issue['issueCode'] in fillable_issues and code in editable and code not in missing:
                missing.append(code)
        modules.append({'aiModuleCode': module['module'], 'ready': module['status'] == 'ready',
                        'missingFieldCodes': missing, 'issues': issues})
    return modules


def project(snapshot, *, secret, key_version, module=None):
    source = snapshot.get('hfSource') or {}
    form = source.get('form') or {}
    values, arrays, observations, quality = _project_data(
        snapshot, lambda kind, identity: token(secret, key_version, kind, identity), module
    )
    return {'contractVersion':'hf-ai-input/1.0','variableTableVersion':'3.0','mappingVersion':'hf-map/1.0','jsonSchemaId':'urn:hfcare:ai-input:1.0','profile':'HF','form':{'versionId':(form.get('formVersion') or {}).get('id',snapshot.get('formVersionId')),'definitionHash':digest(form)},'revision':{'number':snapshot.get('revisionNo',1),'status':'confirmed','snapshotHash':digest(snapshot)},'export':{'id':str(uuid4()),'exportedAt':datetime.now(timezone.utc).isoformat()},'privacy':{'profile':'ai-pseudonym-v1','keyVersion':key_version},'values':values,'arrays':arrays,'observations':observations,'quality':quality}


def project_v11(snapshot, *, secret, key_version, module=None):
    from .hf_registry import REGISTRY_V11
    from .workflow_schema import SCHEMA, matches
    source=snapshot.get('hfSource') or {}
    if (source.get('form',{}).get('formVersion') or {}).get('versionLabel')!='v1.2':
        raise ValueError('1.1 requires a frozen v1.2 source')
    result=project(snapshot,secret=secret,key_version=key_version,module=module)
    fields=source.get('workflowFields') or {}
    replaced=[];extra=[]
    for entry in REGISTRY_V11['inputs']:
        if not entry['transform'].startswith(('manual-','structured-')):
            continue
        code,key=entry['aiCode'],entry['source'];replaced.append(code)
        answer=fields.get(key)
        item=wrap('unfilled',unit=entry['canonicalUnit'])
        reason='MISSING_VALUE'
        if answer:
            if not matches(answer,SCHEMA['$defs']['fields']['properties'][key]):
                raise ValueError('Frozen workflow field violates schema')
            if answer['value_state']=='unknown':
                item=wrap('unknown',unit=entry['canonicalUnit'])
            elif key=='e_over_a_ratio' and answer['value']=='not_measurable_af':
                item=wrap('unknown',unit=entry['canonicalUnit']);reason='NOT_MEASURABLE_AF'
            elif key=='egfr_ckd_epi' and fields.get('egfr_formula',{}).get('value')!='CKD-EPI 2021':
                item=wrap('unknown',unit=entry['canonicalUnit']);reason='FORMULA_NOT_CKD_EPI'
            else:
                item=wrap('answered',answer['value'],entry['canonicalUnit'])
        result['values'][code]=item
        if item['valueState']!='answered':
            for mod in entry['requiredForModules']:
                extra.append(dict(issueCode=reason,path='values.'+code,fieldCode=key,severity='error',module=mod,messageVi='Chưa có giá trị phù hợp: '+reason))
    quality=result['quality']
    quality['issues']=[i for i in quality['issues'] if i['path'] not in ['values.'+c for c in replaced]]+extra
    for m in quality['modules']:
        m['issueCount']=sum(i['module']==m['module'] for i in quality['issues'])
        m['status']='blocked' if m['issueCount'] else 'ready'
    quality['status']='blocked' if any(m['status']=='blocked' for m in quality['modules'] if module is None or m['module']==module) else 'ready'
    result.update(contractVersion='hf-ai-input/1.1',mappingVersion='hf-map/1.1-test',jsonSchemaId='urn:hfcare:ai-input:1.1')
    return result


def export_hf_input(visit_id,request,principal,module,diagnostic,version='1.0'):
    from .audit import record_audit_log
    from .care import require_visit_access
    from .auth import get_request_id,get_client_ip
    secret=os.getenv('HF_AI_HMAC_SECRET','');key_version=os.getenv('HF_AI_KEY_VERSION','')
    pending=None;payload=None
    with request.app.state.pool.connection() as conn:
        require_visit_access(conn, visit_id, principal)
        row=conn.execute('SELECT * FROM visit WHERE id=%s FOR SHARE',(str(visit_id),)).fetchone()
        if not row:raise ProblemError(404,'RESOURCE_NOT_FOUND','Không tìm thấy lượt khám','Lượt khám không tồn tại.')
        if row['status']!='confirmed':pending=ProblemError(409,'VISIT_NOT_CONFIRMED','Lượt chưa xác nhận','Chỉ xuất snapshot đã xác nhận.')
        elif len(secret)<32 or not key_version:pending=ProblemError(503,'AI_EXPORT_KEY_UNAVAILABLE','Chưa cấu hình khóa xuất','Cần secret HMAC ít nhất 32 ký tự và keyVersion bên ngoài dữ liệu.')
        else:
            rev=conn.execute("SELECT snapshot_data FROM visit_revision WHERE visit_id=%s AND revision_no=%s AND revision_type='confirmed_snapshot'",(str(visit_id),row['current_revision_no'])).fetchone()
            if not rev:pending=ProblemError(409,'VISIT_NOT_CONFIRMED','Thiếu snapshot','Không tìm thấy snapshot của bản xác nhận hiện tại.')
            else:
                try:
                    projector=project_v11 if version=='1.1' else project
                    payload=projector(rev['snapshot_data'],secret=secret,key_version=key_version,module=module)
                    from .hf_schema import validate_export
                    validate_export(payload)
                except (ValueError,TypeError,KeyError):
                    payload=None
                    pending=ProblemError(422,'AI_SNAPSHOT_INCOMPATIBLE','Snapshot chưa tương thích','Snapshot không đáp ứng hợp đồng có phiên bản; không dùng dữ liệu hiện tại để bù.')
                if payload is not None and payload['quality']['status']=='blocked' and not diagnostic:
                    pending=ProblemError(422,'AI_INPUT_NOT_READY','Dữ liệu chưa sẵn sàng cho AI','Xem quality theo module và field.');pending.quality=payload['quality']
        audit_detail={'contractVersion':'hf-ai-input/'+version,'mappingVersion':'hf-map/1.1-test' if version=='1.1' else 'hf-map/1.0','privacyVersion':'ai-pseudonym-v1','keyVersion':key_version,'revisionNo':row['current_revision_no'],'module':module,'diagnostic':diagnostic,'code':pending.code if pending else 'OK'}
        if payload:
            stable={k:v for k,v in payload.items() if k!='export'}
            audit_detail.update(contentHash=digest(stable),issueCount=len(payload['quality']['issues']),exportId=payload['export']['id'])
        record_audit_log(conn,actor_user_id=principal.user_id,action='ai_input_export',entity_type='visit',entity_id=visit_id,request_id=get_request_id(request),ip=get_client_ip(request),outcome='denied' if pending else 'success',detail=audit_detail)
        conn.commit()
    if pending:raise pending
    return payload
