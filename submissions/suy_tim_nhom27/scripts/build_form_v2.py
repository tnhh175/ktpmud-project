"""Generate pinned v2 form/mapping/schema and idempotent migration 010."""
from copy import deepcopy
import importlib.util
import json
from pathlib import Path
import sys
from uuid import NAMESPACE_URL,uuid5

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT))
from src.mvp.his_v2.catalog import FIELDS,SECTIONS

def identity(code):return str(uuid5(NAMESPACE_URL,'hf-form/2.0/'+code))
def q(value):
    if value is None:return 'NULL'
    if isinstance(value,bool):return str(value).lower()
    if isinstance(value,(int,float)):return str(value)
    return "'"+str(value).replace("'","''")+"'"
def dump(path,data):path.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf8')

def build():
    path=ROOT/'web/catalog-seed.json';catalog=json.loads(path.read_text(encoding='utf8'))
    old={f['code']:f for f in catalog['fields']};definitions=[];overrides={};sql=[]
    for spec in FIELDS:
        code=spec['code'];row=deepcopy(old.get(code,{}));fid=row.get('id',identity(code))
        storage='computed' if spec['isCalculated'] else 'visit_value'
        if code in ('bn_ma','bn_ho_ten','bn_gioi_tinh','ma_benh_nhan_his'):storage='patient'
        if code in ('ngay_kham','ma_luot_kham_his'):storage='visit'
        row.update(id=fid,**spec,storageLevel=storage,scopeStatus='mvp')
        if code in ('huyet_ap_tam_thu','huyet_ap_tam_truong'):
            row.update(repeatGroup=None,memberPath=None)
        row.setdefault('options',[]);row.setdefault('aiModules',[])
        row.setdefault('minValue',None);row.setdefault('maxValue',None)
        row['helpText']='Chọn Chưa rõ khi chưa có thông tin xác minh.'
        if spec['isCalculated']:row['helpText']='Hệ thống tính khi đủ đầu vào; thiếu dữ liệu thì Chưa rõ.'
        row['sourceRef']='docs/test-workflow/PLAN-v2.md; source/Rules-based_Suy_tim.md: '+spec['rules']
        validation=deepcopy(row.get('validationRule') or {})
        validation.update(entryRole=spec['entryRole'],unknownClearsValue=True,rules=spec['rules'])
        if code.startswith('cls_') or code in ('natri_nieu_2gio','nuoc_tieu_6gio'):
            validation['requiresMeasuredAt']=True
        row['validationRule']=validation
        options={'bat_thuong_cau_truc_chi_tiet':[('day_that_trai','Dày thất trái'),('gian_buong','Giãn buồng tim'),('benh_van','Bệnh van tim')]}.get(code)
        if options:row['options']=[dict(id=identity(code+'/'+o),fieldDefinitionId=fid,optionCode=o,labelVi=l,displayOrder=i,isActive=True) for i,(o,l) in enumerate(options,1)]
        # Replay emits every definition, including definitions added by prior builds.
        columns=['id','code','label_vi','section_code','data_type','canonical_unit','storage_level','is_calculated','scope_status','validation_rule','help_text','source_ref']
        vals=[fid,code,row['labelVi'],row['sectionCode'],row['dataType'],row['canonicalUnit'],storage,row['isCalculated'],'mvp',json.dumps(validation,ensure_ascii=False),row['helpText'],row['sourceRef']]
        sql.append('INSERT INTO field_definition('+','.join(columns)+') VALUES('+','.join(q(v) for v in vals)+') ON CONFLICT(code) DO NOTHING;')
        for opt in row['options']:
            sql.append('INSERT INTO field_option(id,field_definition_id,option_code,label_vi,display_order) VALUES('+','.join(q(opt[k]) for k in ('id','fieldDefinitionId','optionCode','labelVi','displayOrder'))+') ON CONFLICT DO NOTHING;')
        if code not in old:catalog['fields'].append(row)
        overrides[code]={k:deepcopy(row[k]) for k in ('sectionCode','labelVi','dataType','canonicalUnit','storageLevel','isCalculated','scopeStatus','validationRule','entryRole','helpText')}
        if code in ('huyet_ap_tam_thu','huyet_ap_tam_truong'):
            overrides[code].update(repeatGroup=None,memberPath=None)
        definitions.append(row)
    overrides['_workflow']={'contractVersion':'hf-workflow/1.0','mappingVersion':'hf-map/2.0','inputContract':'hf-ai-input/2.0'}
    sql.append('''DO $$ DECLARE base form_version%ROWTYPE; target uuid; author_id uuid; sid uuid; BEGIN
      PERFORM pg_advisory_xact_lock(hashtext('hf-form-v20'));
      IF EXISTS(SELECT 1 FROM form_version WHERE version_label='v2.0') THEN RETURN; END IF;
      SELECT * INTO STRICT base FROM form_version WHERE version_label='v1.2' ORDER BY version_no DESC LIMIT 1;
      SELECT id INTO STRICT author_id FROM app_user WHERE username='admin_demo';
      target:=gen_random_uuid();
      INSERT INTO form_version(id,form_template_id,version_no,version_label,based_on_version_id,change_note,created_by,definition_overrides)
      SELECT target,base.form_template_id,max(version_no)+1,'v2.0',base.id,'PLAN-v2: biểu mẫu hỗ trợ bác sĩ, chưa thẩm định lâm sàng',author_id,'''+q(json.dumps(overrides,ensure_ascii=False))+'''::jsonb FROM form_version WHERE form_template_id=base.form_template_id;''')
    for order,(section,title) in enumerate(SECTIONS,1):
        sql.append(f'INSERT INTO form_section(form_version_id,section_code,title_vi,display_order) VALUES(target,{q(section)},{q(title)},{order}) RETURNING id INTO sid;')
        for n,row in enumerate([f for f in definitions if f['sectionCode']==section],1):
            # Membership uses stable code, so existing installations with different UUIDs work.
            sql.append('INSERT INTO form_field(form_version_id,form_section_id,field_definition_id,display_order,required_for_confirm,is_visible,is_readonly) SELECT target,sid,id,'+str(n)+',false,true,'+q(row['isCalculated'])+' FROM field_definition WHERE code='+q(row['code'])+';')
    sql.append("UPDATE form_version SET status='retired' WHERE form_template_id=base.form_template_id AND status='published';")
    sql.append("UPDATE form_version SET status='retired',published_at=now(),published_by=author_id WHERE form_template_id=base.form_template_id AND version_label LIKE 'v1.%' AND status='draft' AND NOT EXISTS(SELECT 1 FROM visit WHERE form_version_id=form_version.id);")
    sql.append("UPDATE form_version SET status='published',published_at=now(),published_by=author_id WHERE id=target; END $$;")
    # Reuse the current role/unknown-reason guard, including v2 text answers.
    guard=(ROOT/'database/migrations/009_v2_roles_queue.sql').read_text(encoding='utf8')
    guard=guard[guard.index('CREATE OR REPLACE FUNCTION fn_visit_value_guard()'):]
    guard=guard[:guard.index('\n$$;')+4]
    sql.append(guard)
    enums='\n'.join("ALTER TYPE section_code ADD VALUE IF NOT EXISTS "+q(code)+';' for code in ('sinh_ton','trieu_chung_kham','chan_doan_nguy_co','thuoc'))
    (ROOT/'database/migrations/010_form_v2.sql').write_text('-- Generated by scripts/build_form_v2.py; never alters pinned v1.x structures.\nBEGIN;\n'+enums+'\nCOMMIT;\nBEGIN;\n'+'\n'.join(sql)+'\nCOMMIT;\n',encoding='utf8')
    catalog['formV2']={'versionLabel':'v2.0','status':'published','sections':[dict(sectionCode=c,titleVi=l,displayOrder=i) for i,(c,l) in enumerate(SECTIONS,1)],'fieldCodes':[f['code'] for f in definitions],'fieldDefinitions':definitions,'definitionOverrides':overrides}
    catalog['defaultVersionLabel']='v2.0'
    dump(path,catalog)
    aliases={'ts_tang_huyet_ap':'tang_huyet_ap','ts_dai_thao_duong':'dai_thao_duong','luot_tuoi':'age','bn_gioi_tinh':'sex'}
    mapping={'mappingVersion':'hf-map/2.0','contractVersion':'hf-ai-input/2.0','formVersionLabel':'v2.0','clinicalUse':False,
      'source':'docs/test-workflow/source/Rules-based_Suy_tim.md',
      'fields':[dict(fieldCode=f['code'],entryRole=f['entryRole'],unit=f['canonicalUnit'],rules=f['rules'],
        payloadPath=None if f['dataType'] in ('text','date') else 'workflowFields.'+aliases.get(f['code'],f['code']),
        freeTextWithheld=f['dataType'] in ('text','date')) for f in definitions]}
    dump(ROOT/'api/hf-map-2.0.json',mapping)
    base=json.loads((ROOT/'api/schemas/hf-ai-input-1.1.schema.json').read_text(encoding='utf8'))
    base['$id']='urn:hfcare:ai-input:2.0'
    for key,value in [('contractVersion','hf-ai-input/2.0'),('mappingVersion','hf-map/2.0'),('jsonSchemaId','urn:hfcare:ai-input:2.0')]:base['properties'][key]={'const':value}
    # Same privacy envelope; v2 structured fields are allowlisted below.
    workflow=json.loads((ROOT/'api/schemas/hf-workflow-1.0.schema.json').read_text(encoding='utf8'))
    base['$defs']=deepcopy(workflow['$defs'])
    base['$defs']['m1Output']['properties']['canh_bao_cap_cuu']['items']['enum']+=['Thở nhanh','Co kéo cơ hô hấp']
    drug_class=base['$defs']['compactMedication']['properties']['class']
    for branch in drug_class.get('anyOf',[drug_class]):
        if 'enum' in branch:branch['enum']+=['corticosteroid','TZD','class_I_antiarrhythmic']
    props=base['$defs']['fields']['properties']
    for row in definitions:
        code={'ts_tang_huyet_ap':'tang_huyet_ap','ts_dai_thao_duong':'dai_thao_duong','luot_tuoi':'age','bn_gioi_tinh':'sex'}.get(row['code'],row['code'])
        if code in props or row['dataType'] in ('text','date'):continue
        kind={'single_choice':'string','multi_choice':'array','object':'array'}.get(row['dataType'],row['dataType'])
        val={'type':kind}
        if kind=='array':val['items']={} if row['entryRole']=='auto' else {'type':'string'}
        if code=='nyha_hien_tai':val={'enum':['nyha_i','nyha_ii','nyha_iii','nyha_iv']}
        answered={'type':'object','properties':{'value_state':{'const':'answered'},'value':val},'required':['value_state','value'],'additionalProperties':False}
        if row['canonicalUnit']:answered['properties']['unit']={'const':row['canonicalUnit']}
        if row['validationRule'].get('requiresMeasuredAt'):
            answered['properties']['measuredAt']={'type':'string','format':'date-time'};answered['required']+=['unit','measuredAt']
        props[code]={'oneOf':[answered,{'type':'object','properties':{'value_state':{'const':'unknown'},'value':{'type':'null'},'reason':{'type':'string','minLength':1}},'required':['value_state','value'],'additionalProperties':False}]}
    base['$defs']['inputSnapshot']['properties']['formVersionLabel']={'enum':['v1.2','v2.0']}
    base['$defs']['inputSnapshot']['properties']['mappingVersion']={'enum':['hf-map/1.1-test','hf-map/2.0']}
    # Runtime uses these definitions for v2; exported workflowFields retain explicit states.
    base['properties']['workflowFields']={'$ref':'#/$defs/fields'}
    if 'workflowFields' not in base['required']:base['required'].append('workflowFields')
    dump(ROOT/'api/schemas/hf-ai-input-2.0.schema.json',base)
    return definitions


def build_image_assets():
    """Reuse the existing deterministic packer within C11's file ownership."""
    spec=importlib.util.spec_from_file_location('workflow_image_assets',ROOT/'scripts/build_workflow_image_assets.py')
    packer=importlib.util.module_from_spec(spec);spec.loader.exec_module(packer)
    packer.FILES+=('api/hf-map-2.0.json','api/schemas/hf-ai-input-2.0.schema.json',
                   'database/migrations/009_v2_roles_queue.sql','database/migrations/010_form_v2.sql')
    packer.build()

if __name__=='__main__':
    result=build();build_image_assets();print(f'v2.0: {len(result)} fields, {len(SECTIONS)} sections')
