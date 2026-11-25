-- Run with psql as the schema owner, against the explicitly selected test DB.
-- Existing v1.2 drafts from before workflow may contain no workflow placements.
-- Keep their identity and customizations; never change a referenced/published form.
\set ON_ERROR_STOP on
\if :{?publish_v12}
\else
\set publish_v12 false
\endif
\ir migrations/006_workflow.sql
\ir migrations/007_workflow_form_v12.sql

BEGIN;
SET LOCAL lock_timeout = '10s';
DO $$
DECLARE
    target form_version%ROWTYPE;
    placement record;
    shifted record;
    section_id uuid;
    anchor_order integer;
    changed boolean := false;
    field_count integer;
BEGIN
    PERFORM pg_advisory_xact_lock(hashtext('hf-workflow-form-v12'));
    IF (SELECT count(*) FROM form_version WHERE version_label='v1.2') <> 1 THEN
        RAISE EXCEPTION 'Expected exactly one v1.2 form';
    END IF;
    SELECT * INTO STRICT target FROM form_version WHERE version_label='v1.2' FOR UPDATE;
    -- Reverse insertion at shared anchors gives the same order as migration 007.
    FOR placement IN SELECT * FROM (VALUES
        (1,'kho_tho_nang','trieu_chung_dien_bien','kho_tho_khi_gang_suc'),
        (2,'phu_chi_duoi_muc_do','trieu_chung_dien_bien','phu_hai_chi_duoi'),
        (3,'bien_thien_can_nang_7ngay','trieu_chung_dien_bien','thay_doi_can_nang_kg'),
        (4,'trieu_chung_khong_dien_hinh','trieu_chung_dien_bien','lu_lan_sang'),
        (5,'danh_gia_suy_yeu_frailty','lao_khoa','lao_khoa_frailty'),
        (6,'e_over_a_ratio','can_lam_sang','cls_sieu_am_tim_ket_luan'),
        (7,'bat_thuong_cau_truc_tim','can_lam_sang','cls_sieu_am_tim_ket_luan'),
        (8,'egfr_ckd_epi','can_lam_sang','cls_egfr'),
        (9,'egfr_formula','can_lam_sang','cls_egfr'),
        (10,'ecg_12_chuyen_dao','can_lam_sang','cls_ecg_ket_luan'),
        (11,'xquang_nguc_thang','can_lam_sang','cls_xquang_ket_luan')
    ) AS spec(seq,code,section_code,anchor_code) ORDER BY seq DESC LOOP
        IF EXISTS (SELECT 1 FROM form_field ff JOIN field_definition fd ON fd.id=ff.field_definition_id
                   WHERE ff.form_version_id=target.id AND fd.code=placement.code) THEN
            IF NOT EXISTS (SELECT 1 FROM form_field ff JOIN field_definition fd ON fd.id=ff.field_definition_id
                JOIN form_section fs ON fs.id=ff.form_section_id
                WHERE ff.form_version_id=target.id AND fd.code=placement.code AND fs.section_code::text=placement.section_code) THEN
                RAISE EXCEPTION 'Existing workflow field % is in the wrong section', placement.code;
            END IF;
            CONTINUE;
        END IF;
        IF target.status <> 'draft' OR EXISTS (SELECT 1 FROM visit WHERE form_version_id=target.id) THEN
            RAISE EXCEPTION 'Cannot extend a non-draft or referenced v1.2 form';
        END IF;
        SELECT fs.id,ff.display_order INTO STRICT section_id,anchor_order
        FROM form_field ff JOIN field_definition fd ON fd.id=ff.field_definition_id
        JOIN form_section fs ON fs.id=ff.form_section_id
        WHERE ff.form_version_id=target.id AND fs.section_code::text=placement.section_code AND fd.code=placement.anchor_code;
        FOR shifted IN SELECT id FROM form_field WHERE form_section_id=section_id
                       AND display_order>anchor_order ORDER BY display_order DESC LOOP
            UPDATE form_field SET display_order=display_order+1 WHERE id=shifted.id;
        END LOOP;
        INSERT INTO form_field(form_version_id,form_section_id,field_definition_id,display_order,required_for_confirm)
        SELECT target.id,section_id,id,anchor_order+1,false FROM field_definition WHERE code=placement.code;
        GET DIAGNOSTICS field_count = ROW_COUNT;
        IF field_count <> 1 THEN RAISE EXCEPTION 'Missing field definition %', placement.code; END IF;
        changed := true;
    END LOOP;
    IF target.definition_overrides->'_workflow' IS DISTINCT FROM
        '{"contractVersion":"hf-workflow/1.0","mappingVersion":"hf-map/1.1-test"}'::jsonb THEN
        IF target.status <> 'draft' OR EXISTS (SELECT 1 FROM visit WHERE form_version_id=target.id) THEN
            RAISE EXCEPTION 'Cannot change metadata of a non-draft or referenced v1.2 form';
        END IF;
        UPDATE form_version SET definition_overrides=definition_overrides ||
            '{"_workflow":{"contractVersion":"hf-workflow/1.0","mappingVersion":"hf-map/1.1-test"}}'::jsonb
        WHERE id=target.id;
        changed := true;
    END IF;
    IF changed THEN UPDATE form_version SET row_version=row_version+1 WHERE id=target.id; END IF;
END $$;
COMMIT;

\if :publish_v12
BEGIN;
DO $$
DECLARE target form_version%ROWTYPE; actor uuid;
BEGIN
    SELECT * INTO STRICT target FROM form_version WHERE version_label='v1.2' FOR UPDATE;
    IF target.status='published' THEN RETURN; END IF;
    IF target.status <> 'draft' THEN RAISE EXCEPTION 'v1.2 must be draft or published'; END IF;
    SELECT id INTO STRICT actor FROM app_user WHERE username='admin_demo';
    UPDATE form_version SET status='retired' WHERE form_template_id=target.form_template_id AND status='published';
    UPDATE form_version SET status='published',published_at=now(),published_by=actor,row_version=row_version+1 WHERE id=target.id;
END $$;
COMMIT;
\endif

\ir migrations/008_workflow_visit_inputs.sql
