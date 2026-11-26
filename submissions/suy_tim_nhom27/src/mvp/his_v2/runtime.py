"""Allowlisted v2 projection, including source-only calculated values."""
from copy import deepcopy
from .calculations import derive,icd_risks,answer
import re
import math

SCORE_CODES = frozenset(('kho_tho_nang', 'phu_chi_duoi_muc_do',
                       'trieu_chung_khong_dien_hinh', 'danh_gia_suy_yeu_frailty'))


def normalize_source_answer(code, obj):
    """One v2 storage shape; accept older UI scores/drug rows at the boundary."""
    obj = deepcopy(obj)
    if obj.get('value_state') != 'answered':
        return obj
    value = obj.get('value')
    if code in SCORE_CODES and type(value) is int:
        obj['value'] = str(value)
    if code == 'medications' and isinstance(value, list):
        from .medications import classify
        for item in value:
            if not isinstance(item, dict):
                continue
            if 'name' not in item and isinstance(item.get('ingredient'), str):
                item['name'] = item['ingredient']
            if isinstance(item.get('name'), str):
                item['name'] = item['name'].strip()
                item.pop('ingredient', None)
                item.pop('class', None)
                item['group'] = classify(item['name'])['group']
    return obj


def valid_source_answer(code, obj):
    """Validate objects before projection; malformed lists must not reach derive()."""
    from ..workflow_schema import SCHEMA, matches
    if code == 'medications':
        items = obj.get('value')
        if not isinstance(items, list):
            return False
        for item in items:
            if not isinstance(item, dict):
                return False
            if 'name' in item:
                if not isinstance(item['name'], str) or not item['name'].strip():
                    return False
                if 'id' in item and (not isinstance(item['id'], str) or not item['id'].strip()):
                    return False
                schedule = item.get('schedule', {})
                if not isinstance(schedule, dict):
                    return False
                for key, detail in schedule.items():
                    amount = detail.get('amount') if isinstance(detail,dict) else detail
                    if key not in ('S','T','C','Tr') or type(amount) not in (int,float) or abs(amount)>1e6 or not math.isfinite(amount) or amount<0:
                        return False
                    if isinstance(detail,dict) and not isinstance(detail.get('unit'),str):
                        return False
                if item.get('scheduleText') is not None and not isinstance(item['scheduleText'], str):
                    return False
                for key in ('unit', 'route', 'frequency'):
                    if item.get(key) is not None and not isinstance(item[key], str):
                        return False
                dose = item.get('dose')
                if dose is not None and (type(dose) not in (int, float) or abs(dose)>1e6 or not math.isfinite(dose) or dose<0):
                    return False
            else:
                return False
        return True
    schema = SCHEMA['$defs']['fields']['properties'].get(code)
    return schema is not None and matches(obj, schema)

def project_fields(fields,detail,patient,visit,options=None):
    from ..workflow import canonical_code,compact_drug
    fields=deepcopy(fields)
    for key in ('kho_tho_nang','phu_chi_duoi_muc_do','trieu_chung_khong_dien_hinh','danh_gia_suy_yeu_frailty'):
        field=fields.get(key,{})
        if field.get('value_state')=='answered' and isinstance(field.get('value'),str) and field['value'].isdigit():
            field['value']=int(field['value'])
    # Choice answers stored as scalar option IDs must also reach the mock.
    for row in detail['values']:
        option=(options or {}).get(row.get('fieldOptionId'))
        if option:
            value=int(option) if option.isdigit() else option
            if row['fieldCode']=='egfr_formula':value={'ckd_epi_2021':'CKD-EPI 2021'}.get(value,value)
            fields[canonical_code(row['fieldCode'])]={'value_state':row['valueState'],'value':value}
    raw=fields.get('medications',{})
    if raw.get('value_state')=='answered':
        compact=[]
        for i,item in enumerate(raw['value']):
            if 'name' in item:
                from .medications import classify
                mapped=classify(item['name'])
                compact.append({'id':item.get('id',f'his-{i}'),'ingredient':mapped['ingredient'] or 'unmapped',
                  'class':mapped['group'] if mapped['mapped'] else None,'dose':None,'unit':None,
                  'route':None,'frequency':'unknown','detail_state':'unknown'})
            else:compact.append(compact_drug(item))
        raw['value']=compact
    # Compute from original sources every time; stale/manual auto values cannot win.
    computed=derive(fields,birth_date=patient.get('birth_date'),visit_date=visit['visit_date'],sex=patient['sex'])
    # Primary/secondary ICD boxes contain codes; keep their free text out of AI.
    primary_codes=[]
    for row in detail['values']:
        if row['fieldCode'] in ('icd_chinh','icd_phu') and row['valueState']=='answered':
            raw=(row.get('answer') or {}).get('value') or row.get('valueText')
            if isinstance(raw,str):primary_codes.extend(c for c in raw.upper().split('+') if re.fullmatch(r'[A-Z][0-9]{2}(?:\.[0-9A-Z]{1,4})?',c.strip()))
    if primary_codes:
        current=fields.get('diagnoses',{})
        codes=(current.get('value') or []) if current.get('value_state')=='answered' else []
        computed['goi_y_nguy_co_icd']=answer(icd_risks(codes+primary_codes))
    for code,value in computed.items():fields[canonical_code(code)]=value
    return fields
