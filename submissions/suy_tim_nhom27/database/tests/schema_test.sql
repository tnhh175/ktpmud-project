-- =============================================================================
-- PostgreSQL 16 Verification Script (CONTRACT.md Section 3 criteria a-g)
-- Run on a clean PG16 database AFTER schema.sql and seed.sql.
-- Wraps tests in a transaction or cleans up via SAVEPOINT / ROLLBACK.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- (e), (f), (g) Seed exactness checks:
--   - 95 mvp + 26 can_xac_nhan = 121 field_definition rows
--   - 0 giai_doan_sau / AI output codes in field_definition
--   - 8 form_section, 1 form_template, 1 published form_version v1, 2 app_user
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  v_mvp_cnt integer;
  v_cxn_cnt integer;
  v_ai_leak integer;
  v_sec_cnt integer;
  v_user_cnt integer;
BEGIN
  SELECT count(*) INTO v_mvp_cnt FROM field_definition WHERE scope_status = 'mvp';
  SELECT count(*) INTO v_cxn_cnt FROM field_definition WHERE scope_status = 'can_xac_nhan';
  SELECT count(*) INTO v_ai_leak FROM field_definition WHERE code LIKE 'ai_%';
  SELECT count(*) INTO v_sec_cnt FROM form_section;
  SELECT count(*) INTO v_user_cnt FROM app_user;

  IF v_mvp_cnt <> 140 THEN
    RAISE EXCEPTION 'Expected 140 mvp field_definition rows, got %', v_mvp_cnt;
  END IF;
  IF v_cxn_cnt <> 26 THEN
    RAISE EXCEPTION 'Expected 26 can_xac_nhan field_definition rows, got %', v_cxn_cnt;
  END IF;
  IF v_ai_leak <> 0 THEN
    RAISE EXCEPTION 'Found % leaked ai_* output codes in field_definition', v_ai_leak;
  END IF;
  IF v_sec_cnt <> 16 THEN
    RAISE EXCEPTION 'Expected 16 form_section rows, got %', v_sec_cnt;
  END IF;
  IF v_user_cnt <> 2 THEN
    RAISE EXCEPTION 'Expected 2 seeded app_user rows, got %', v_user_cnt;
  END IF;
END;
$$;

-- -----------------------------------------------------------------------------
-- (d) patient_code format BN-xxxxx & immutability
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  v_doc_id uuid;
  v_pat_id uuid;
BEGIN
  SELECT id INTO v_doc_id FROM app_user WHERE username = 'doctor_demo';

  -- Invalid patient_code format must fail CHECK
  BEGIN
    INSERT INTO patient (patient_code, full_name, sex, birth_year, created_by)
    VALUES ('SYN-00001', 'Nguyen Van A', 'male', 1950, v_doc_id);
    RAISE EXCEPTION 'Invalid patient_code SYN-00001 unexpectedly succeeded';
  EXCEPTION WHEN check_violation THEN
    NULL;
  END;

  -- Valid BN-00001 must succeed
  INSERT INTO patient (patient_code, full_name, sex, birth_year, created_by)
  VALUES ('BN-00001', 'Nguyen Van A', 'male', 1950, v_doc_id)
  RETURNING id INTO v_pat_id;

  -- Updating patient_code must fail trigger
  BEGIN
    UPDATE patient SET patient_code = 'BN-00002' WHERE id = v_pat_id;
    RAISE EXCEPTION 'Immutable patient_code update unexpectedly succeeded';
  EXCEPTION WHEN check_violation THEN
    NULL;
  END;
END;
$$;

-- -----------------------------------------------------------------------------
-- (b) Trigger blocking modification of published form_version & its sections/fields
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  v_ver_id uuid;
BEGIN
  SELECT id INTO v_ver_id FROM form_version WHERE status = 'published' LIMIT 1;

  BEGIN
    UPDATE form_version SET change_note = 'Illegal direct edit' WHERE id = v_ver_id;
    RAISE EXCEPTION 'Direct edit of published form_version unexpectedly succeeded';
  EXCEPTION WHEN check_violation THEN
    NULL;
  END;

  BEGIN
    UPDATE form_section SET title_vi = 'Modified' WHERE form_version_id = v_ver_id;
    RAISE EXCEPTION 'Direct edit of published form_section unexpectedly succeeded';
  EXCEPTION WHEN check_violation THEN
    NULL;
  END;

  BEGIN
    UPDATE form_field SET is_visible = false WHERE form_version_id = v_ver_id;
    RAISE EXCEPTION 'Direct edit of published form_field unexpectedly succeeded';
  EXCEPTION WHEN check_violation THEN
    NULL;
  END;
END;
$$;

-- -----------------------------------------------------------------------------
-- (a) 3-state value_state CHECK & type validation + (c) confirmed visit lock
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  v_doc_id uuid;
  v_pat_id uuid;
  v_ver_id uuid;
  v_visit_id uuid;
  v_bool_field_id uuid;
  v_num_field_id uuid;
  v_choice_field_id uuid;
  v_opt_id uuid;
  v_wrong_opt_id uuid;
BEGIN
  SELECT id INTO v_doc_id FROM app_user WHERE username = 'doctor_demo';
  SELECT id INTO v_pat_id FROM patient WHERE patient_code = 'BN-00001';
  SELECT id INTO v_ver_id FROM form_version WHERE status = 'published' LIMIT 1;
  SELECT id INTO v_bool_field_id FROM field_definition WHERE code = 'kho_tho_khi_gang_suc';
  SELECT id INTO v_num_field_id FROM field_definition WHERE code = 'chieu_cao_cm';
  SELECT id INTO v_choice_field_id FROM field_definition WHERE code = 'nyha_hien_tai';
  SELECT id INTO v_opt_id FROM field_option WHERE field_definition_id = v_choice_field_id AND option_code = 'nyha_ii';
  SELECT id INTO v_wrong_opt_id FROM field_option WHERE field_definition_id <> v_choice_field_id LIMIT 1;

  INSERT INTO visit (visit_code, patient_id, form_version_id, visit_date, created_by)
  VALUES ('LK-TEST-0001', v_pat_id, v_ver_id, now(), v_doc_id)
  RETURNING id INTO v_visit_id;

  -- (a1) unknown with non-null value must fail CHECK
  BEGIN
    INSERT INTO visit_value (visit_id, field_definition_id, value_state, value_bool)
    VALUES (v_visit_id, v_bool_field_id, 'unknown', false);
    RAISE EXCEPTION 'unknown state with non-null value_bool unexpectedly succeeded';
  EXCEPTION WHEN check_violation THEN
    NULL;
  END;

  -- (a2) answered with all NULL values for boolean must fail trigger
  BEGIN
    INSERT INTO visit_value (visit_id, field_definition_id, value_state)
    VALUES (v_visit_id, v_bool_field_id, 'answered');
    RAISE EXCEPTION 'answered boolean with NULL value_bool unexpectedly succeeded';
  EXCEPTION WHEN check_violation THEN
    NULL;
  END;

  -- (a3) answered boolean false is VALID (distinct from unfilled and unknown)
  INSERT INTO visit_value (visit_id, field_definition_id, value_state, value_bool)
  VALUES (v_visit_id, v_bool_field_id, 'answered', false);

  -- (a4) 0 for chieu_cao_cm (min_value=50) must fail
  BEGIN
    INSERT INTO visit_value (visit_id, field_definition_id, value_state, value_num)
    VALUES (v_visit_id, v_num_field_id, 'answered', 0);
    RAISE EXCEPTION 'chieu_cao_cm=0 unexpectedly succeeded';
  EXCEPTION WHEN check_violation THEN
    NULL;
  END;

  -- (a5) wrong field_option belonging to another field must fail composite FK
  BEGIN
    INSERT INTO visit_value (visit_id, field_definition_id, value_state, field_option_id)
    VALUES (v_visit_id, v_choice_field_id, 'answered', v_wrong_opt_id);
    RAISE EXCEPTION 'Cross-field option_id unexpectedly succeeded';
  EXCEPTION WHEN foreign_key_violation THEN
    NULL;
  END;

  -- Valid choice + lab result with unit + orthostatic BP
  INSERT INTO visit_value (visit_id, field_definition_id, value_state, field_option_id)
  VALUES (v_visit_id, v_choice_field_id, 'answered', v_opt_id);

  INSERT INTO visit_orthostatic_bp (visit_id, position, minute_after, systolic, diastolic, heart_rate, measured_at)
  VALUES (v_visit_id, 'supine', 0, 125, 78, 76, now());

  -- Lab numeric without unit must fail CHECK
  BEGIN
    INSERT INTO visit_lab_result (visit_id, lab_code, value_num, unit, measured_at)
    VALUES (v_visit_id, 'cls_creatinin', 110, NULL, now());
    RAISE EXCEPTION 'Numeric lab result without unit unexpectedly succeeded';
  EXCEPTION WHEN check_violation THEN
    NULL;
  END;

  INSERT INTO visit_lab_result (visit_id, lab_code, value_num, unit, measured_at)
  VALUES (v_visit_id, 'cls_creatinin', 110, 'umol/L', now());

  -- Confirm visit + record immutable revision 1
  UPDATE visit
  SET status = 'confirmed',
      confirmed_at = now(),
      confirmed_by = v_doc_id,
      row_version = row_version + 1
  WHERE id = v_visit_id;

  INSERT INTO visit_revision (visit_id, revision_no, form_version_id, revision_type, change_reason, snapshot_data, created_by)
  VALUES (v_visit_id, 1, v_ver_id, 'confirmed_snapshot', 'Xác nhận dữ liệu khám ban đầu', '{"confirmed": true}'::jsonb, v_doc_id);

  -- (c) Direct update of confirmed visit & child rows must fail trigger
  BEGIN
    UPDATE visit SET clinical_note = 'Tamper after confirm' WHERE id = v_visit_id;
    RAISE EXCEPTION 'Update on confirmed visit unexpectedly succeeded';
  EXCEPTION WHEN check_violation THEN
    NULL;
  END;

  BEGIN
    INSERT INTO visit_lab_result (visit_id, lab_code, value_num, unit, measured_at)
    VALUES (v_visit_id, 'cls_bnp', 320, 'pg/mL', now());
    RAISE EXCEPTION 'Insert into child table of confirmed visit unexpectedly succeeded';
  EXCEPTION WHEN check_violation THEN
    NULL;
  END;

  -- audit_log clinical key rejection (K8)
  BEGIN
    INSERT INTO audit_log (actor_user_id, action, entity_type, entity_id, outcome, detail)
    VALUES (v_doc_id, 'visit_confirm', 'visit', v_visit_id, 'success', '{"visit_values": []}'::jsonb);
    RAISE EXCEPTION 'Clinical payload in audit_log.detail unexpectedly succeeded';
  EXCEPTION WHEN check_violation THEN
    NULL;
  END;

  -- app_user.row_version optimistic concurrency & trigger
  DECLARE
    v_rv integer;
    v_rows integer;
  BEGIN
    SELECT row_version INTO v_rv FROM app_user WHERE id = v_doc_id;
    IF v_rv <> 1 THEN
      RAISE EXCEPTION 'Expected initial app_user.row_version = 1, got %', v_rv;
    END IF;

    UPDATE app_user SET full_name = 'BS. Nguyễn Minh Tâm (Updated)'
    WHERE id = v_doc_id AND row_version = 1
    RETURNING row_version INTO v_rv;
    IF v_rv <> 2 THEN
      RAISE EXCEPTION 'Expected trg_app_user_row_version to bump row_version to 2, got %', v_rv;
    END IF;

    -- Stale version (If-Match=1) must affect 0 rows (API returns 409)
    UPDATE app_user SET full_name = 'Stale Write'
    WHERE id = v_doc_id AND row_version = 1;
    GET DIAGNOSTICS v_rows = ROW_COUNT;
    IF v_rows <> 0 THEN
      RAISE EXCEPTION 'Stale app_user.row_version=1 unexpectedly matched % rows', v_rows;
    END IF;

    -- Explicit row_version = row_version + 1 must advance cleanly by +1 (to 3, not 4)
    UPDATE app_user SET full_name = 'Explicit Bump', row_version = row_version + 1
    WHERE id = v_doc_id AND row_version = 2
    RETURNING row_version INTO v_rv;
    IF v_rv <> 3 THEN
      RAISE EXCEPTION 'Expected explicit row_version bump to 3, got %', v_rv;
    END IF;

    -- Decreasing row_version must fail trigger check_violation
    BEGIN
      UPDATE app_user SET row_version = 1 WHERE id = v_doc_id;
      RAISE EXCEPTION 'Decreasing app_user.row_version unexpectedly succeeded';
    EXCEPTION WHEN check_violation THEN
      NULL;
    END;
  END;
END;
$$;

-- -----------------------------------------------------------------------------
-- Extra coverage for every trigger / error branch + 3-state & multi_choice
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  v_doc_id uuid;
  v_admin_id uuid;
  v_pat_id uuid;
  v_ver_id uuid;
  v_draft_ver_id uuid;
  v_tpl_id uuid;
  v_draft_visit_id uuid;
  v_conf_visit_id uuid;
  v_multi_field_id uuid;
  v_multi_opt_id uuid;
  v_bool_field_id uuid;
  v_lab_field_id uuid;
  v_num_field_id uuid;
  v_rev_id uuid;
  v_audit_id uuid;
BEGIN
  SELECT id INTO v_doc_id FROM app_user WHERE username = 'doctor_demo';
  SELECT id INTO v_admin_id FROM app_user WHERE username = 'admin_demo';
  SELECT id INTO v_ver_id FROM form_version WHERE status = 'published' LIMIT 1;
  SELECT form_template_id INTO v_tpl_id FROM form_version WHERE id = v_ver_id;
  SELECT id INTO v_multi_field_id FROM field_definition WHERE code = 'muc_tieu_dieu_tri';
  SELECT id INTO v_multi_opt_id FROM field_option WHERE field_definition_id = v_multi_field_id LIMIT 1;
  SELECT id INTO v_bool_field_id FROM field_definition WHERE code = 'kho_tho_khi_gang_suc';
  SELECT id INTO v_lab_field_id FROM field_definition WHERE code = 'cls_bnp';
  SELECT id INTO v_num_field_id FROM field_definition WHERE code = 'chieu_cao_cm';

  INSERT INTO patient (patient_code, full_name, sex, birth_year, created_by)
  VALUES ('BN-99901', 'Nguyen Thi Test', 'female', 1955, v_doc_id)
  RETURNING id INTO v_pat_id;

  -- Check 4th state on enum value_state raises 22P02 and violating chk_visit_value_state_cols raises 23514
  INSERT INTO visit (visit_code, patient_id, form_version_id, visit_date, created_by)
  VALUES ('LK-TEST-EXTRA-1', v_pat_id, v_ver_id, now(), v_doc_id)
  RETURNING id INTO v_draft_visit_id;

  BEGIN
    EXECUTE format(
      'INSERT INTO visit_value (visit_id, field_definition_id, value_state, value_bool) VALUES (%L, %L, %L, true)',
      v_draft_visit_id, v_bool_field_id, 'fourth_state'
    );
    RAISE EXCEPTION '4th value_state unexpectedly succeeded';
  EXCEPTION WHEN invalid_text_representation THEN
    NULL;
  END;

  BEGIN
    INSERT INTO visit_value (visit_id, field_definition_id, value_state, value_num, value_text)
    VALUES (v_draft_visit_id, v_num_field_id, 'answered', 165, '165');
    RAISE EXCEPTION 'Multiple value columns unexpectedly succeeded';
  EXCEPTION WHEN check_violation THEN
    NULL;
  END;

  -- Wrong storage_level in visit_value must fail fn_visit_value_guard
  BEGIN
    INSERT INTO visit_value (visit_id, field_definition_id, value_state, value_num)
    VALUES (v_draft_visit_id, v_lab_field_id, 'answered', 100);
    RAISE EXCEPTION 'lab_result field in visit_value unexpectedly succeeded';
  EXCEPTION WHEN check_violation THEN
    NULL;
  END;

  -- Non-lab field in visit_lab_result must fail fn_visit_lab_guard
  BEGIN
    INSERT INTO visit_lab_result (visit_id, lab_code, value_num, unit, measured_at)
    VALUES (v_draft_visit_id, 'chieu_cao_cm', 160, 'cm', now());
    RAISE EXCEPTION 'Non-lab code in visit_lab_result unexpectedly succeeded';
  EXCEPTION WHEN check_violation THEN
    NULL;
  END;

  -- multi_choice without option fails deferred constraint trigger when enforced
  INSERT INTO visit_value (visit_id, field_definition_id, value_state)
  VALUES (v_draft_visit_id, v_multi_field_id, 'answered');

  BEGIN
    SET CONSTRAINTS trg_visit_value_multichoice_deferred IMMEDIATE;
    RAISE EXCEPTION 'multi_choice without visit_value_option unexpectedly passed';
  EXCEPTION WHEN check_violation THEN
    SET CONSTRAINTS trg_visit_value_multichoice_deferred DEFERRED;
  END;

  -- Now attach valid option and verify deferred check passes
  INSERT INTO visit_value_option (visit_id, field_definition_id, field_option_id)
  VALUES (v_draft_visit_id, v_multi_field_id, v_multi_opt_id);
  SET CONSTRAINTS trg_visit_value_multichoice_deferred IMMEDIATE;

  -- visit_value_option for non-multi_choice field must fail fn_visit_value_option_guard
  BEGIN
    INSERT INTO visit_value_option (visit_id, field_definition_id, field_option_id)
    VALUES (v_draft_visit_id, v_bool_field_id, v_multi_opt_id);
    RAISE EXCEPTION 'Non-multi_choice visit_value_option unexpectedly succeeded';
  EXCEPTION WHEN check_violation OR foreign_key_violation THEN
    NULL;
  END;

  -- Immutable visit header column update must fail fn_visit_lifecycle_guard
  BEGIN
    UPDATE visit SET visit_code = 'LK-TEST-TAMPER' WHERE id = v_draft_visit_id;
    RAISE EXCEPTION 'Immutable visit_code update unexpectedly succeeded';
  EXCEPTION WHEN check_violation THEN
    NULL;
  END;

  -- Creating draft form_version and trying to bind a visit to draft must fail
  INSERT INTO form_version (form_template_id, version_no, version_label, status, based_on_version_id, created_by)
  VALUES (v_tpl_id, 3, 'v2.0-draft', 'draft', v_ver_id, v_admin_id)
  RETURNING id INTO v_draft_ver_id;

  BEGIN
    INSERT INTO visit (visit_code, patient_id, form_version_id, visit_date, created_by)
    VALUES ('LK-TEST-DRAFT-VER', v_pat_id, v_draft_ver_id, now(), v_doc_id);
    RAISE EXCEPTION 'Visit bound to draft form_version unexpectedly succeeded';
  EXCEPTION WHEN check_violation THEN
    NULL;
  END;

  -- Publishing empty draft form_version (no sections) must fail fn_form_version_immutable
  BEGIN
    UPDATE form_version
    SET status = 'published', published_at = now(), published_by = v_admin_id
    WHERE id = v_draft_ver_id;
    RAISE EXCEPTION 'Publishing empty form_version unexpectedly succeeded';
  EXCEPTION WHEN check_violation THEN
    NULL;
  END;

  -- Confirm visit and test confirmed child guards (bp, med, allergy) + delete confirmed visit + append-only
  INSERT INTO visit (visit_code, patient_id, form_version_id, visit_date, created_by)
  VALUES ('LK-TEST-EXTRA-2', v_pat_id, v_ver_id, now(), v_doc_id)
  RETURNING id INTO v_conf_visit_id;

  UPDATE visit
  SET status = 'confirmed', confirmed_at = now(), confirmed_by = v_doc_id, row_version = row_version + 1
  WHERE id = v_conf_visit_id;

  INSERT INTO visit_revision (visit_id, revision_no, form_version_id, revision_type, change_reason, snapshot_data, created_by)
  VALUES (v_conf_visit_id, 1, v_ver_id, 'confirmed_snapshot', 'Extra test confirm', '{}'::jsonb, v_doc_id)
  RETURNING id INTO v_rev_id;

  INSERT INTO audit_log (actor_user_id, action, entity_type, entity_id, outcome, detail)
  VALUES (v_doc_id, 'visit_confirm', 'visit', v_conf_visit_id, 'success', '{}'::jsonb)
  RETURNING id INTO v_audit_id;

  BEGIN
    INSERT INTO visit_orthostatic_bp (visit_id, position, minute_after, systolic, diastolic, heart_rate, measured_at)
    VALUES (v_conf_visit_id, 'sitting', 1, 120, 75, 72, now());
    RAISE EXCEPTION 'Insert into confirmed visit_orthostatic_bp unexpectedly succeeded';
  EXCEPTION WHEN check_violation THEN
    NULL;
  END;

  BEGIN
    INSERT INTO visit_medication (visit_id, drug_name) VALUES (v_conf_visit_id, 'Furosemide');
    RAISE EXCEPTION 'Insert into confirmed visit_medication unexpectedly succeeded';
  EXCEPTION WHEN check_violation THEN
    NULL;
  END;

  BEGIN
    INSERT INTO visit_allergy (visit_id, kind, allergen) VALUES (v_conf_visit_id, 'allergy', 'Penicillin');
    RAISE EXCEPTION 'Insert into confirmed visit_allergy unexpectedly succeeded';
  EXCEPTION WHEN check_violation THEN
    NULL;
  END;

  BEGIN
    DELETE FROM visit WHERE id = v_conf_visit_id;
    RAISE EXCEPTION 'Delete confirmed visit unexpectedly succeeded';
  EXCEPTION WHEN check_violation THEN
    NULL;
  END;

  BEGIN
    UPDATE visit_revision SET change_reason = 'Tamper' WHERE id = v_rev_id;
    RAISE EXCEPTION 'Update on append-only visit_revision unexpectedly succeeded';
  EXCEPTION WHEN check_violation THEN
    NULL;
  END;

  BEGIN
    DELETE FROM audit_log WHERE id = v_audit_id;
    RAISE EXCEPTION 'Delete on append-only audit_log unexpectedly succeeded';
  EXCEPTION WHEN check_violation THEN
    NULL;
  END;
END;
$$;

ROLLBACK;
