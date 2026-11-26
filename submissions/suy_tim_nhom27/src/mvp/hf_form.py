"""Heart failure form metadata and confirmed source capture, with no duplicated visit values."""
from .models import ProblemError


def apply_definition_overrides(definitions, overrides):
    """Use the pinned version's storage/options in saved and unsaved bundles."""
    for definition in definitions:
        override = overrides.get(definition['code'], {})
        if overrides.get('_workflow',{}).get('mappingVersion')=='hf-map/2.0':
            for key in ('sectionCode','labelVi','dataType','canonicalUnit','storageLevel','isCalculated','scopeStatus','validationRule','entryRole','helpText','repeatGroup','memberPath'):
                if key in override:definition[key]=override[key]
            # Existing published v2 bundles are immutable. Correct the legacy
            # renderer hint on read as well as in newly generated v2 metadata.
            if definition['code'] in ('huyet_ap_tam_thu','huyet_ap_tam_truong'):
                definition.update(repeatGroup=None, memberPath=None)
        if definition['code'] == 'di_ung_thuoc_can_quang' and override.get('storageLevel') == 'visit_value':
            definition.update(storageLevel='visit_value', repeatGroup=None, memberPath=None)
        extras = override.get('extraOptions', [])
        if definition['code'] == 'chan_doan_kieu_hinh_ef' and not any(o['optionCode'] == 'hfmref' for o in extras):
            definition['options'] = [o for o in definition['options'] if o['optionCode'] != 'hfmref']
        for option in extras:
            if not any(o['optionCode'] == option['optionCode'] for o in definition['options']):
                definition['options'].append({**option, 'fieldDefinitionId': definition['id']})


def synchronize_contrast_allergy(definitions, values, allergies, list_state, errors):
    """Keep explicit tri-state answers; never invent or delete reaction details."""
    definition = next((f for f in definitions if f['code'] == 'di_ung_thuoc_can_quang' and f['storageLevel'] == 'visit_value'), None)
    if definition is None:
        return  # v1.0 still derives presence from the allergy table.
    answer = next((v for v in values if v['fieldDefinitionId'] == definition['id']), None)
    has_contrast = any(a['agentCategory'] == 'contrast_media' for a in allergies)
    if has_contrast and answer is None:
        values.append({'fieldDefinitionId': definition['id'], 'fieldCode': definition['code'],
                       'valueState': 'answered', 'valueBool': True, 'valueNum': None,
                       'valueText': None, 'valueDate': None, 'fieldOptionId': None,
                       'optionIds': [], 'unit': None})
        return  # Compatibility with clients that send only allergy rows.
    positive = answer and answer['valueState'] == 'answered' and answer['valueBool'] is True
    if (has_contrast and not positive) or (positive and list_state == 'none'):
        errors.append({'fieldCode': definition['code'], 'sectionCode': 'thuoc_di_ung',
                       'message': 'Trạng thái dị ứng cản quang mâu thuẫn với danh sách dị ứng; hãy rà lại cả câu trả lời và các dòng tác nhân.',
                       'rejectedValue': None})


def validate_lists(body, visit, errors):
    groups = [('medication',body.medications),('allergy',body.allergies),('diagnosis',body.diagnoses)]
    states=[]
    for name,rows in groups:
        raw=getattr(body,name+'ListState')
        state=raw if raw is not None else ('known' if rows else ('none' if visit.get(name+'_list_state')=='none' else 'unknown'))
        if (state=='known') != bool(rows):
            errors.append({'fieldCode':name+'_list_state','message':'known cần có dòng; none/unknown không được có dòng.','rejectedValue':None})
        states.append(state)
    if len({d.code for d in body.diagnoses}) != len(body.diagnoses) or sum(d.role=='primary' for d in body.diagnoses)>1 or any(not d.display.strip() for d in body.diagnoses):
        errors.append({'fieldCode':'icd_code','message':'ICD không trùng mã, tối đa một chẩn đoán chính và tên không rỗng.','rejectedValue':None})
    if body.diagnoses:
        # The caller validates pinned membership below before allowing new data on old forms.
        if 'diagnosis_list_state' not in visit:
            errors.append({'fieldCode':'icd_code','message':'Cần migration 006 trước khi lưu ICD.','rejectedValue':None})
    return states


def export_snapshot(conn,visit_id):
    from .visits import _load_visit_detail_dict,load_form_version_bundle,_compute_age,_parse_iso_datetime
    detail=_load_visit_detail_dict(conn,visit_id)
    detail.pop('revisions',None)
    visit=detail['visit']
    fv,sections,definitions=load_form_version_bundle(conn,visit['formVersionId'])
    patient=conn.execute('SELECT * FROM patient WHERE id=%s',(visit['patientId'],)).fetchone()
    source={'sourceVersion':'hf-source/1.0','patientId':visit['patientId'],'visitId':visit['id'],'age':_compute_age(patient,_parse_iso_datetime(visit['visitDate'])),'agePrecision':'exact' if patient.get('birth_date') else ('year_only' if patient.get('birth_year') else 'declared'),'sex':patient['sex'],'form':{'formVersion':fv,'sections':sections,'fieldDefinitions':definitions},'detail':detail}
    if fv['versionLabel'] in ('v1.2','v2.0') and conn.execute("SELECT to_regclass('public.ai_workflow') AS relation").fetchone()['relation']:
        from .workflow import source_fields
        visit_row=conn.execute('SELECT * FROM visit WHERE id=%s',(str(visit_id),)).fetchone()
        source['workflowFields']=source_fields(conn,visit_row)
    return source
