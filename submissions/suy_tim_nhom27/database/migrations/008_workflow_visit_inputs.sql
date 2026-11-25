-- G2: canonical input values share the visit draft and visit concurrency token.
BEGIN;
SELECT pg_advisory_xact_lock(hashtext('hf-workflow-visit-inputs'));
ALTER TABLE visit_value ADD COLUMN IF NOT EXISTS answer jsonb;
UPDATE field_definition SET storage_level='visit_value' WHERE storage_level='workflow_value';
CREATE OR REPLACE FUNCTION fn_visit_value_guard()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_visit_status text;
  v_form_version_id uuid;
  v_data_type text;
  v_min_val numeric;
  v_max_val numeric;
  v_storage_level varchar(24);
  v_in_form boolean;
BEGIN
  IF TG_OP = 'DELETE' THEN
    SELECT status::text INTO v_visit_status FROM visit WHERE id = OLD.visit_id;
    IF v_visit_status = 'confirmed' THEN
      RAISE EXCEPTION 'Cannot delete visit_value of confirmed visit %', OLD.visit_id
        USING ERRCODE = 'check_violation';
    END IF;
    RETURN OLD;
  END IF;

  SELECT status::text, form_version_id INTO v_visit_status, v_form_version_id
  FROM visit WHERE id = NEW.visit_id;

  IF v_visit_status = 'confirmed' THEN
    RAISE EXCEPTION 'Cannot modify visit_value of confirmed visit %', NEW.visit_id
      USING ERRCODE = 'check_violation';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM form_field
    WHERE form_version_id = v_form_version_id
      AND field_definition_id = NEW.field_definition_id
  ) INTO v_in_form;

  IF NOT v_in_form AND NOT (EXISTS(SELECT 1 FROM form_version WHERE id=v_form_version_id AND version_label='v1.2') AND EXISTS(SELECT 1 FROM field_definition WHERE id=NEW.field_definition_id AND code IN ('diagnoses','medications','allergies'))) THEN
    RAISE EXCEPTION 'Field % is not registered in visit form_version %', NEW.field_definition_id, v_form_version_id
      USING ERRCODE = 'check_violation';
  END IF;

  SELECT data_type::text, min_value, max_value, storage_level
  INTO v_data_type, v_min_val, v_max_val, v_storage_level
  FROM field_definition
  WHERE id = NEW.field_definition_id;

  IF EXISTS(SELECT 1 FROM field_definition WHERE id=NEW.field_definition_id AND code='di_ung_thuoc_can_quang') THEN
    SELECT COALESCE(definition_overrides->'di_ung_thuoc_can_quang'->>'storageLevel', v_storage_level)
    INTO v_storage_level FROM form_version WHERE id=v_form_version_id;
  END IF;

  IF NEW.answer IS NOT NULL THEN
    IF NOT EXISTS(SELECT 1 FROM form_version WHERE id=v_form_version_id AND version_label='v1.2')
       OR v_data_type='text' OR jsonb_typeof(NEW.answer)<>'object'
       OR NEW.answer->>'value_state' IS DISTINCT FROM NEW.value_state::text
       OR NOT (NEW.answer ? 'value')
       OR num_nonnulls(NEW.value_num,NEW.value_text,NEW.value_bool,NEW.value_date,NEW.field_option_id,NEW.unit)<>0
       OR (NEW.value_state='unknown' AND NEW.answer->'value'<>'null'::jsonb)
    THEN RAISE EXCEPTION 'Invalid structured visit answer' USING ERRCODE='check_violation'; END IF;
    RETURN NEW;
  END IF;

  IF v_storage_level IN ('orthostatic_bp', 'medication', 'allergy', 'lab_result', 'patient') THEN
    RAISE EXCEPTION 'Field % uses storage_level=% and cannot be stored in visit_value', NEW.field_definition_id, v_storage_level
      USING ERRCODE = 'check_violation';
  END IF;

  IF NEW.value_state = 'unknown' THEN
    IF num_nonnulls(NEW.value_num, NEW.value_text, NEW.value_bool, NEW.value_date, NEW.field_option_id) <> 0
       OR NEW.unit IS NOT NULL
    THEN
      RAISE EXCEPTION 'When value_state=unknown, all value columns and unit must be NULL'
        USING ERRCODE = 'check_violation';
    END IF;
    RETURN NEW;
  END IF;

  IF v_data_type = 'multi_choice' THEN
    IF num_nonnulls(NEW.value_num, NEW.value_text, NEW.value_bool, NEW.value_date, NEW.field_option_id) <> 0 THEN
      RAISE EXCEPTION 'multi_choice visit_value must store options in visit_value_option with NULL scalar columns'
        USING ERRCODE = 'check_violation';
    END IF;
    RETURN NEW;
  END IF;

  IF num_nonnulls(NEW.value_num, NEW.value_text, NEW.value_bool, NEW.value_date, NEW.field_option_id) <> 1 THEN
    RAISE EXCEPTION 'When value_state=answered for %, exactly one scalar value column must be non-NULL', v_data_type
      USING ERRCODE = 'check_violation';
  END IF;

  IF v_data_type = 'number' THEN
    IF NEW.value_num IS NULL THEN
      RAISE EXCEPTION 'data_type=number requires value_num' USING ERRCODE = 'check_violation';
    END IF;
    IF v_min_val IS NOT NULL AND NEW.value_num < v_min_val THEN
      RAISE EXCEPTION 'value_num % < min_value %', NEW.value_num, v_min_val USING ERRCODE = 'check_violation';
    END IF;
    IF v_max_val IS NOT NULL AND NEW.value_num > v_max_val THEN
      RAISE EXCEPTION 'value_num % > max_value %', NEW.value_num, v_max_val USING ERRCODE = 'check_violation';
    END IF;
  ELSIF v_data_type = 'integer' THEN
    IF NEW.value_num IS NULL OR NEW.value_num <> trunc(NEW.value_num) THEN
      RAISE EXCEPTION 'data_type=integer requires integer value_num' USING ERRCODE = 'check_violation';
    END IF;
    IF v_min_val IS NOT NULL AND NEW.value_num < v_min_val THEN
      RAISE EXCEPTION 'value_num % < min_value %', NEW.value_num, v_min_val USING ERRCODE = 'check_violation';
    END IF;
    IF v_max_val IS NOT NULL AND NEW.value_num > v_max_val THEN
      RAISE EXCEPTION 'value_num % > max_value %', NEW.value_num, v_max_val USING ERRCODE = 'check_violation';
    END IF;
  ELSIF v_data_type = 'text' THEN
    IF NEW.value_text IS NULL OR length(trim(NEW.value_text)) = 0 THEN
      RAISE EXCEPTION 'data_type=text requires non-empty value_text' USING ERRCODE = 'check_violation';
    END IF;
  ELSIF v_data_type = 'boolean' THEN
    IF NEW.value_bool IS NULL THEN
      RAISE EXCEPTION 'data_type=boolean requires value_bool' USING ERRCODE = 'check_violation';
    END IF;
  ELSIF v_data_type = 'date' THEN
    IF NEW.value_date IS NULL THEN
      RAISE EXCEPTION 'data_type=date requires value_date' USING ERRCODE = 'check_violation';
    END IF;
  ELSIF v_data_type = 'single_choice' THEN
    IF NEW.field_option_id IS NULL THEN
      RAISE EXCEPTION 'data_type=single_choice requires field_option_id' USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;


INSERT INTO field_definition(code,label_vi,section_code,data_type,scope_status,storage_level,source_ref,help_text)
SELECT 'diagnoses','Chẩn đoán có cấu trúc',section_code,'object','mvp','visit_value','G2 D1/D2','Ghi danh sách có cấu trúc; chọn Chưa rõ nếu chưa xác minh.' FROM field_definition WHERE code='icd_code'
ON CONFLICT(code) DO NOTHING;

INSERT INTO field_definition(code,label_vi,section_code,data_type,scope_status,storage_level,source_ref,help_text)
SELECT 'medications','Thuốc đang dùng có cấu trúc',section_code,'object','mvp','visit_value','G2 D1/D2','Ghi danh sách có cấu trúc; chọn Chưa rõ nếu chưa xác minh.' FROM field_definition WHERE code='thuoc_ghi_nhan'
ON CONFLICT(code) DO NOTHING;

INSERT INTO field_definition(code,label_vi,section_code,data_type,scope_status,storage_level,source_ref,help_text)
SELECT 'allergies','Dị ứng có cấu trúc',section_code,'object','mvp','visit_value','G2 D1/D2','Ghi danh sách có cấu trúc; chọn Chưa rõ nếu chưa xác minh.' FROM field_definition WHERE code='di_ung_adr'
ON CONFLICT(code) DO NOTHING;

WITH copied AS (
INSERT INTO visit_value(visit_id,field_definition_id,value_state,answer)
SELECT v.id,fd.id,(entry.value->>'value_state')::value_state,entry.value
FROM ai_workflow w JOIN visit v ON v.id=w.visit_id
JOIN form_version fv ON fv.id=v.form_version_id AND fv.version_label='v1.2'
CROSS JOIN LATERAL jsonb_each(w.fields) entry
JOIN field_definition fd ON fd.code=CASE entry.key
 WHEN 'tang_huyet_ap' THEN 'ts_tang_huyet_ap' WHEN 'dai_thao_duong' THEN 'ts_dai_thao_duong'
 WHEN 'copd' THEN 'ts_copd' WHEN 'thieu_mau' THEN 'ts_thieu_mau' ELSE entry.key END
WHERE (fd.code IN ('diagnoses','medications','allergies') OR EXISTS(SELECT 1 FROM form_field ff WHERE ff.form_version_id=v.form_version_id AND ff.field_definition_id=fd.id)) AND v.status='draft' AND fd.data_type<>'text' AND entry.key NOT IN ('age','sex','selected_medications')
 AND entry.value->>'value_state' IN ('answered','unknown')
ON CONFLICT(visit_id,field_definition_id) DO NOTHING RETURNING visit_id)
UPDATE visit SET row_version=row_version+1 WHERE id IN (SELECT visit_id FROM copied);
UPDATE field_definition SET help_text='Ghi trạng thái danh sách dị ứng. Chọn Chưa rõ nếu chưa có thông tin xác minh.' WHERE code='allergy_list_state' AND help_text IS DISTINCT FROM 'Ghi trạng thái danh sách dị ứng. Chọn Chưa rõ nếu chưa có thông tin xác minh.';
UPDATE field_definition SET help_text='Ghi chú lâm sàng bổ sung. Chọn Chưa rõ nếu chưa có thông tin xác minh.' WHERE code='clinical_note' AND help_text IS DISTINCT FROM 'Ghi chú lâm sàng bổ sung. Chọn Chưa rõ nếu chưa có thông tin xác minh.';
UPDATE field_definition SET help_text='Ghi kết quả công thức máu dạng chữ; chỉ lưu ghi chú, không dùng làm đầu vào workflow.' WHERE code='cls_cong_thuc_mau' AND help_text IS DISTINCT FROM 'Ghi kết quả công thức máu dạng chữ; chỉ lưu ghi chú, không dùng làm đầu vào workflow.';
UPDATE field_definition SET help_text='Ghi ferritin. Đơn vị ng/mL. Chọn Chưa rõ nếu chưa có thông tin xác minh.' WHERE code='cls_ferritin' AND help_text IS DISTINCT FROM 'Ghi ferritin. Đơn vị ng/mL. Chọn Chưa rõ nếu chưa có thông tin xác minh.';
UPDATE field_definition SET help_text='Ghi glucose. Đơn vị mmol/L. Chọn Chưa rõ nếu chưa có thông tin xác minh.' WHERE code='cls_glucose' AND help_text IS DISTINCT FROM 'Ghi glucose. Đơn vị mmol/L. Chọn Chưa rõ nếu chưa có thông tin xác minh.';
UPDATE field_definition SET help_text='Ghi hbA1c. Đơn vị %. Chọn Chưa rõ nếu chưa có thông tin xác minh.' WHERE code='cls_hba1c' AND help_text IS DISTINCT FROM 'Ghi hbA1c. Đơn vị %. Chọn Chưa rõ nếu chưa có thông tin xác minh.';
UPDATE field_definition SET help_text='Ghi thời điểm của kết quả. Chọn Chưa rõ nếu chưa có thông tin xác minh.' WHERE code='cls_result_measured_at' AND help_text IS DISTINCT FROM 'Ghi thời điểm của kết quả. Chọn Chưa rõ nếu chưa có thông tin xác minh.';
UPDATE field_definition SET help_text='Ghi đơn vị của kết quả. Chọn Chưa rõ nếu chưa có thông tin xác minh.' WHERE code='cls_result_unit' AND help_text IS DISTINCT FROM 'Ghi đơn vị của kết quả. Chọn Chưa rõ nếu chưa có thông tin xác minh.';
UPDATE field_definition SET help_text='Ghi tSAT. Đơn vị %. Chọn Chưa rõ nếu chưa có thông tin xác minh.' WHERE code='cls_tsat' AND help_text IS DISTINCT FROM 'Ghi tSAT. Đơn vị %. Chọn Chưa rõ nếu chưa có thông tin xác minh.';
UPDATE field_definition SET help_text='Ghi tSH. Đơn vị mIU/L. Chọn Chưa rõ nếu chưa có thông tin xác minh.' WHERE code='cls_tsh' AND help_text IS DISTINCT FROM 'Ghi tSH. Đơn vị mIU/L. Chọn Chưa rõ nếu chưa có thông tin xác minh.';
UPDATE field_definition SET help_text='Ghi trạng thái danh sách ICD. Chọn Chưa rõ nếu chưa có thông tin xác minh.' WHERE code='diagnosis_list_state' AND help_text IS DISTINCT FROM 'Ghi trạng thái danh sách ICD. Chọn Chưa rõ nếu chưa có thông tin xác minh.';
UPDATE field_definition SET help_text='Ghi nhóm tác nhân. Chọn Chưa rõ nếu chưa có thông tin xác minh.' WHERE code='diung_agentcategory' AND help_text IS DISTINCT FROM 'Ghi nhóm tác nhân. Chọn Chưa rõ nếu chưa có thông tin xác minh.';
UPDATE field_definition SET help_text='Ghi tác nhân. Chọn Chưa rõ nếu chưa có thông tin xác minh.' WHERE code='diung_allergen' AND help_text IS DISTINCT FROM 'Ghi tác nhân. Chọn Chưa rõ nếu chưa có thông tin xác minh.';
UPDATE field_definition SET help_text='Ghi loại phản ứng. Chọn Chưa rõ nếu chưa có thông tin xác minh.' WHERE code='diung_kind' AND help_text IS DISTINCT FROM 'Ghi loại phản ứng. Chọn Chưa rõ nếu chưa có thông tin xác minh.';
UPDATE field_definition SET help_text='Ghi phản ứng. Chọn Chưa rõ nếu chưa có thông tin xác minh.' WHERE code='diung_reaction' AND help_text IS DISTINCT FROM 'Ghi phản ứng. Chọn Chưa rõ nếu chưa có thông tin xác minh.';
UPDATE field_definition SET help_text='Ghi thời điểm ghi nhận. Chọn Chưa rõ nếu chưa có thông tin xác minh.' WHERE code='diung_recordedat' AND help_text IS DISTINCT FROM 'Ghi thời điểm ghi nhận. Chọn Chưa rõ nếu chưa có thông tin xác minh.';
UPDATE field_definition SET help_text='Ghi mức độ. Chọn Chưa rõ nếu chưa có thông tin xác minh.' WHERE code='diung_severity' AND help_text IS DISTINCT FROM 'Ghi mức độ. Chọn Chưa rõ nếu chưa có thông tin xác minh.';
UPDATE field_definition SET help_text='Ghi nhịp tim khi đo HA. Đơn vị lần/phút. Chọn Chưa rõ nếu chưa có thông tin xác minh.' WHERE code='ha_nhip_tim' AND help_text IS DISTINCT FROM 'Ghi nhịp tim khi đo HA. Đơn vị lần/phút. Chọn Chưa rõ nếu chưa có thông tin xác minh.';
UPDATE field_definition SET help_text='Ghi phút sau đổi tư thế. Đơn vị phút. Chọn Chưa rõ nếu chưa có thông tin xác minh.' WHERE code='ha_phut_sau_doi_tu_the' AND help_text IS DISTINCT FROM 'Ghi phút sau đổi tư thế. Đơn vị phút. Chọn Chưa rõ nếu chưa có thông tin xác minh.';
UPDATE field_definition SET help_text='Ghi mã ICD-10. Chọn Chưa rõ nếu chưa có thông tin xác minh.' WHERE code='icd_code' AND help_text IS DISTINCT FROM 'Ghi mã ICD-10. Chọn Chưa rõ nếu chưa có thông tin xác minh.';
UPDATE field_definition SET help_text='Ghi tên chẩn đoán. Chọn Chưa rõ nếu chưa có thông tin xác minh.' WHERE code='icd_display' AND help_text IS DISTINCT FROM 'Ghi tên chẩn đoán. Chọn Chưa rõ nếu chưa có thông tin xác minh.';
UPDATE field_definition SET help_text='Ghi chẩn đoán chính/phụ. Chọn Chưa rõ nếu chưa có thông tin xác minh.' WHERE code='icd_role' AND help_text IS DISTINCT FROM 'Ghi chẩn đoán chính/phụ. Chọn Chưa rõ nếu chưa có thông tin xác minh.';
UPDATE field_definition SET help_text='Ghi nguồn cung cấp thông tin lâm sàng. Chọn Chưa rõ nếu chưa có thông tin xác minh.' WHERE code='info_source' AND help_text IS DISTINCT FROM 'Ghi nguồn cung cấp thông tin lâm sàng. Chọn Chưa rõ nếu chưa có thông tin xác minh.';
UPDATE field_definition SET help_text='Ghi trạng thái danh sách thuốc. Chọn Chưa rõ nếu chưa có thông tin xác minh.' WHERE code='medication_list_state' AND help_text IS DISTINCT FROM 'Ghi trạng thái danh sách thuốc. Chọn Chưa rõ nếu chưa có thông tin xác minh.';
UPDATE field_definition SET help_text='Ghi nhiệt độ. Đơn vị °C. Chọn Chưa rõ nếu chưa có thông tin xác minh.' WHERE code='nhiet_do' AND help_text IS DISTINCT FROM 'Ghi nhiệt độ. Đơn vị °C. Chọn Chưa rõ nếu chưa có thông tin xác minh.';
UPDATE field_definition SET help_text='Ghi hoạt chất. Chọn Chưa rõ nếu chưa có thông tin xác minh.' WHERE code='thuoc_activeingredient' AND help_text IS DISTINCT FROM 'Ghi hoạt chất. Chọn Chưa rõ nếu chưa có thông tin xác minh.';
UPDATE field_definition SET help_text='Ghi liều. Chọn Chưa rõ nếu chưa có thông tin xác minh.' WHERE code='thuoc_dose' AND help_text IS DISTINCT FROM 'Ghi liều. Chọn Chưa rõ nếu chưa có thông tin xác minh.';
UPDATE field_definition SET help_text='Ghi tên thuốc. Chọn Chưa rõ nếu chưa có thông tin xác minh.' WHERE code='thuoc_drugname' AND help_text IS DISTINCT FROM 'Ghi tên thuốc. Chọn Chưa rõ nếu chưa có thông tin xác minh.';
UPDATE field_definition SET help_text='Ghi tần suất. Chọn Chưa rõ nếu chưa có thông tin xác minh.' WHERE code='thuoc_frequency' AND help_text IS DISTINCT FROM 'Ghi tần suất. Chọn Chưa rõ nếu chưa có thông tin xác minh.';
UPDATE field_definition SET help_text='Ghi nhóm thuốc. Chọn Chưa rõ nếu chưa có thông tin xác minh.' WHERE code='thuoc_medicationgroup' AND help_text IS DISTINCT FROM 'Ghi nhóm thuốc. Chọn Chưa rõ nếu chưa có thông tin xác minh.';
UPDATE field_definition SET help_text='Ghi đường dùng. Chọn Chưa rõ nếu chưa có thông tin xác minh.' WHERE code='thuoc_route' AND help_text IS DISTINCT FROM 'Ghi đường dùng. Chọn Chưa rõ nếu chưa có thông tin xác minh.';
UPDATE field_definition SET help_text='Ghi ngày bắt đầu. Chọn Chưa rõ nếu chưa có thông tin xác minh.' WHERE code='thuoc_startedat' AND help_text IS DISTINCT FROM 'Ghi ngày bắt đầu. Chọn Chưa rõ nếu chưa có thông tin xác minh.';
UPDATE field_definition SET help_text='Ghi trạng thái thuốc. Chọn Chưa rõ nếu chưa có thông tin xác minh.' WHERE code='thuoc_status' AND help_text IS DISTINCT FROM 'Ghi trạng thái thuốc. Chọn Chưa rõ nếu chưa có thông tin xác minh.';
UPDATE field_definition SET help_text='Ghi hàm lượng. Chọn Chưa rõ nếu chưa có thông tin xác minh.' WHERE code='thuoc_strength' AND help_text IS DISTINCT FROM 'Ghi hàm lượng. Chọn Chưa rõ nếu chưa có thông tin xác minh.';
UPDATE field_definition SET help_text='Ghi đơn vị liều. Chọn Chưa rõ nếu chưa có thông tin xác minh.' WHERE code='thuoc_unit' AND help_text IS DISTINCT FROM 'Ghi đơn vị liều. Chọn Chưa rõ nếu chưa có thông tin xác minh.';
UPDATE field_definition SET help_text='Chất gây nghiện: chọn Có hoặc Không; chọn Chưa rõ nếu chưa xác minh.' WHERE code='ts_chat_gay_nghien' AND help_text IS DISTINCT FROM 'Chất gây nghiện: chọn Có hoặc Không; chọn Chưa rõ nếu chưa xác minh.';
UPDATE field_definition SET help_text='Ghi chú chất gây nghiện. Chọn Chưa rõ nếu chưa có thông tin xác minh.' WHERE code='ts_chat_gay_nghien_ghi_chu' AND help_text IS DISTINCT FROM 'Ghi chú chất gây nghiện. Chọn Chưa rõ nếu chưa có thông tin xác minh.';
UPDATE field_definition SET help_text='Tiền sử khác: chọn Có hoặc Không; chọn Chưa rõ nếu chưa xác minh.' WHERE code='ts_khac' AND help_text IS DISTINCT FROM 'Tiền sử khác: chọn Có hoặc Không; chọn Chưa rõ nếu chưa xác minh.';
UPDATE field_definition SET help_text='Ghi chú tiền sử khác. Chọn Chưa rõ nếu chưa có thông tin xác minh.' WHERE code='ts_khac_ghi_chu' AND help_text IS DISTINCT FROM 'Ghi chú tiền sử khác. Chọn Chưa rõ nếu chưa có thông tin xác minh.';
UPDATE field_definition SET help_text='Rượu bia: chọn Có hoặc Không; chọn Chưa rõ nếu chưa xác minh.' WHERE code='ts_ruou_bia' AND help_text IS DISTINCT FROM 'Rượu bia: chọn Có hoặc Không; chọn Chưa rõ nếu chưa xác minh.';
UPDATE field_definition SET help_text='Ghi chú rượu bia. Chọn Chưa rõ nếu chưa có thông tin xác minh.' WHERE code='ts_ruou_bia_ghi_chu' AND help_text IS DISTINCT FROM 'Ghi chú rượu bia. Chọn Chưa rõ nếu chưa có thông tin xác minh.';
UPDATE field_definition SET help_text='Thuốc lá: chọn Có hoặc Không; chọn Chưa rõ nếu chưa xác minh.' WHERE code='ts_thuoc_la' AND help_text IS DISTINCT FROM 'Thuốc lá: chọn Có hoặc Không; chọn Chưa rõ nếu chưa xác minh.';
UPDATE field_definition SET help_text='Ghi chú thuốc lá. Chọn Chưa rõ nếu chưa có thông tin xác minh.' WHERE code='ts_thuoc_la_ghi_chu' AND help_text IS DISTINCT FROM 'Ghi chú thuốc lá. Chọn Chưa rõ nếu chưa có thông tin xác minh.';
UPDATE field_definition SET help_text='Thuốc lào: chọn Có hoặc Không; chọn Chưa rõ nếu chưa xác minh.' WHERE code='ts_thuoc_lao' AND help_text IS DISTINCT FROM 'Thuốc lào: chọn Có hoặc Không; chọn Chưa rõ nếu chưa xác minh.';
UPDATE field_definition SET help_text='Ghi chú thuốc lào. Chọn Chưa rõ nếu chưa có thông tin xác minh.' WHERE code='ts_thuoc_lao_ghi_chu' AND help_text IS DISTINCT FROM 'Ghi chú thuốc lào. Chọn Chưa rõ nếu chưa có thông tin xác minh.';
COMMIT;
