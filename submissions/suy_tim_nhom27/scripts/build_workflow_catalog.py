"""Generate the additive C3 catalog migration; old definitions and forms stay pinned."""
import json
from pathlib import Path
from uuid import NAMESPACE_URL, uuid5

ROOT = Path(__file__).resolve().parents[1]
LABEL = 'thang thử nghiệm, chờ bác sĩ duyệt'
FIELDS = [
 ('kho_tho_nang','Mức độ khó thở','trieu_chung_dien_bien','kho_tho_khi_gang_suc','single_choice',None,['Không khó thở','Khi gắng sức nặng (leo từ hai tầng)','Khi gắng sức nhẹ/sinh hoạt thường','Khi nghỉ hoặc phải ngồi dậy để thở']),
 ('phu_chi_duoi_muc_do','Mức độ phù chi dưới','trieu_chung_dien_bien','phu_hai_chi_duoi','single_choice',None,['Không phù','Phù mắt cá/1 phần 3 dưới cẳng chân, ấn lõm nông','Phù vượt 1 phần 3 cẳng chân, gồm quá gối/ấn lõm sâu/phù toàn thân']),
 ('bien_thien_can_nang_7ngay','Biến thiên cân nặng 7 ngày','trieu_chung_dien_bien','thay_doi_can_nang_kg','number','kg',[]),
 ('trieu_chung_khong_dien_hinh','Triệu chứng không điển hình nổi bật','trieu_chung_dien_bien','lu_lan_sang','single_choice',None,['Không','Lơ mơ/lú lẫn/sảng','Chán ăn/sụt ăn']),
 ('danh_gia_suy_yeu_frailty','Điểm suy yếu CFS','lao_khoa','lao_khoa_frailty','single_choice',None,['Rất khỏe, vận động tốt','Khỏe, chưa hoạt động đều như mức 1','Quản lý bệnh tốt, sinh hoạt độc lập','Dễ tổn thương, triệu chứng hạn chế hoạt động','Suy yếu nhẹ, cần giúp việc phức tạp','Suy yếu vừa, cần giúp hoạt động thường ngày','Suy yếu nặng, phụ thuộc chăm sóc cá nhân','Suy yếu rất nặng, phụ thuộc hoàn toàn','Bệnh giai đoạn cuối']),
 ('e_over_a_ratio','Tỉ lệ E/A Doppler','can_lam_sang','cls_sieu_am_tim_ket_luan','number','ratio',[]),
 ('egfr_ckd_epi','eGFR kèm công thức','can_lam_sang','cls_egfr','number','mL/min/1.73m2',[]),
 ('egfr_formula','Công thức eGFR','can_lam_sang','cls_egfr','single_choice',None,['CKD-EPI 2021','MDRD','Cockcroft-Gault','Không rõ']),
 ('ecg_12_chuyen_dao','ECG có cấu trúc','can_lam_sang','cls_ecg_ket_luan','object',None,[]),
 ('xquang_nguc_thang','X-quang có cấu trúc','can_lam_sang','cls_xquang_ket_luan','object',None,[]),
 ('bat_thuong_cau_truc_tim','Bất thường cấu trúc/chức năng tim đã được xác nhận','can_lam_sang','cls_sieu_am_tim_ket_luan','boolean',None,[]),
]


def identity(text):
    return str(uuid5(NAMESPACE_URL, 'hf-workflow/1.0/' + text))


def quote(value):
    return 'NULL' if value is None else "'" + str(value).replace("'", "''") + "'"


def build():
    schema = json.loads((ROOT/'api/schemas/hf-workflow-1.0.schema.json').read_text(encoding='utf-8'))
    rules = json.loads((ROOT/'tests/fixtures/workflow/mock_ai_rules.json').read_text(encoding='utf-8'))
    defs, sql = [], []
    for code, label, section, anchor, kind, unit, options in FIELDS:
        fid = identity(code)
        contract = schema['$defs']['fields']['properties'].get(code, schema['$defs']['observation'])
        bounds = rules['fieldContracts'].get(code, {})
        minimum = bounds.get('minimum') if kind in ('number','integer') else None
        maximum = bounds.get('maximum') if kind in ('number','integer') else None
        validation = {'workflowSchema':contract,'workflowContract':'hf-workflow/1.0','step':bounds.get('step'), 'unknownClearsValue':True}
        offset = 1 if code=='danh_gia_suy_yeu_frailty' else 0
        opts = [{'id':identity(code+'/'+str(i+offset)), 'fieldDefinitionId':fid,
                 'optionCode':['ckd_epi_2021','mdrd','cockcroft_gault','unknown'][i] if code=='egfr_formula' else str(i+offset),
                 'labelVi':text,'displayOrder':i+1,'isActive':True} for i,text in enumerate(options)]
        modules=['ai_diagnosis','ai_lab_test'] if code in ('kho_tho_nang','phu_chi_duoi_muc_do','bien_thien_can_nang_7ngay','trieu_chung_khong_dien_hinh','danh_gia_suy_yeu_frailty','bat_thuong_cau_truc_tim') else ['ai_treatment']
        ai_modules=[dict(fieldDefinitionId=fid,aiModuleCode=m,isRequired=True,sourceSttRefs='C1 test workflow') for m in modules]
        definition = dict(id=fid,code=code,labelVi=label,sectionCode=section,dataType=kind,canonicalUnit=unit,
                          scopeStatus='mvp',storageLevel='visit_value',isCalculated=False,minValue=minimum,maxValue=maximum,
                          validationRule=validation,helpText=LABEL,sourceRef='C1-contract.md §3; G1-review.md §6',options=opts,aiModules=ai_modules)
        defs.append(definition)
        vals = [fid,code,label,section,kind,unit,'mvp','visit_value',minimum,maximum,json.dumps(validation,ensure_ascii=False),LABEL,definition['sourceRef']]
        sql.append('INSERT INTO field_definition(id,code,label_vi,section_code,data_type,canonical_unit,scope_status,storage_level,min_value,max_value,validation_rule,help_text,source_ref) VALUES (' + ','.join(quote(v) for v in vals) + ') ON CONFLICT(code) DO NOTHING;')
        for m in modules:
            sql.append('INSERT INTO field_ai_module(field_definition_id,ai_module_code,is_required,source_stt_refs) VALUES('+','.join([quote(fid),quote(m),'true',quote('C1 test workflow')])+') ON CONFLICT DO NOTHING;')
        for opt in opts:
            sql.append('INSERT INTO field_option(id,field_definition_id,option_code,label_vi,display_order) VALUES('+','.join(quote(opt[k]) for k in ['id','fieldDefinitionId','optionCode','labelVi','displayOrder'])+') ON CONFLICT DO NOTHING;')
    # Clone only once; do not edit an already published or Admin-edited v1.2 on replay.
    sql += ['''DO $$ DECLARE base form_version%ROWTYPE; target uuid; admin_id uuid; s record; f record; ord integer; BEGIN
      PERFORM pg_advisory_xact_lock(hashtext('hf-workflow-form-v12'));
      IF EXISTS(SELECT 1 FROM form_version WHERE version_label='v1.2') THEN RETURN; END IF;
      SELECT * INTO STRICT base FROM form_version WHERE version_label='v1.1' ORDER BY version_no DESC LIMIT 1;
      SELECT id INTO STRICT admin_id FROM app_user WHERE username='admin_demo';
      target := gen_random_uuid();
      INSERT INTO form_version(id,form_template_id,version_no,version_label,based_on_version_id,change_note,created_by,definition_overrides)
      VALUES(target,base.form_template_id,3,'v1.2',base.id,'C3: workflow synthetic, thang thử nghiệm, chờ bác sĩ duyệt',admin_id,
        base.definition_overrides || '{"_workflow":{"contractVersion":"hf-workflow/1.0","mappingVersion":"hf-map/1.1-test"}}'::jsonb);
      FOR s IN SELECT * FROM form_section WHERE form_version_id=base.id ORDER BY display_order LOOP
        INSERT INTO form_section(form_version_id,section_code,title_vi,description,display_order)
        VALUES(target,s.section_code,s.title_vi,s.description,s.display_order);
        ord:=0;
        FOR f IN SELECT ff.*,fd.code FROM form_field ff JOIN field_definition fd ON fd.id=ff.field_definition_id
           WHERE ff.form_section_id=s.id ORDER BY ff.display_order LOOP
          ord:=ord+1;
          INSERT INTO form_field(form_version_id,form_section_id,field_definition_id,display_order,required_for_confirm,is_visible,is_readonly,custom_label_vi,custom_help_text)
          SELECT target,id,f.field_definition_id,ord,f.required_for_confirm,f.is_visible,f.is_readonly,f.custom_label_vi,f.custom_help_text
          FROM form_section WHERE form_version_id=target AND section_code=s.section_code;''']
    for code,_,section,anchor,*_ in FIELDS:
        sql.append(f'''IF s.section_code={quote(section)} AND f.code={quote(anchor)} THEN
          ord:=ord+1;
          INSERT INTO form_field(form_version_id,form_section_id,field_definition_id,display_order,required_for_confirm)
          SELECT target,fs.id,fd.id,ord,false FROM form_section fs CROSS JOIN field_definition fd
          WHERE fs.form_version_id=target AND fs.section_code=s.section_code AND fd.code={quote(code)};
          END IF;''')
    sql += ['END LOOP; END LOOP; END $$;']
    out = '-- Generated by scripts/build_workflow_catalog.py. Draft v1.2 only.\nBEGIN;\n'+'\n'.join(sql)+'\nCOMMIT;\n'
    (ROOT/'database/migrations/007_workflow_form_v12.sql').write_text(out,encoding='utf-8')
    catalog_path = ROOT/'web/catalog-seed.json'
    catalog = json.loads(catalog_path.read_text(encoding='utf-8'))
    known = {f['code'] for f in catalog['fields']}
    own={f['code']:f for f in defs}
    catalog['fields']=[own.get(f['code'],f) for f in catalog['fields']]+[f for f in defs if f['code'] not in known]
    catalog['workflowDraftVersionLabel'] = 'v1.2'
    catalog['workflowFieldCodes'] = [f['code'] for f in defs]
    catalog_path.write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')


if __name__=='__main__':
    build()
