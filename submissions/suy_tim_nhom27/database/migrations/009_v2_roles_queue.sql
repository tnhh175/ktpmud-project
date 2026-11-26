-- Explicit v2 upgrade. Run with psql/autocommit: enum additions must commit first.
ALTER TYPE section_code ADD VALUE IF NOT EXISTS 'sinh_ton';
ALTER TYPE section_code ADD VALUE IF NOT EXISTS 'trieu_chung_kham';
ALTER TYPE section_code ADD VALUE IF NOT EXISTS 'chan_doan_nguy_co';
ALTER TYPE section_code ADD VALUE IF NOT EXISTS 'thuoc';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'nurse';
ALTER TYPE visit_status ADD VALUE IF NOT EXISTS 'intake';
ALTER TYPE visit_status ADD VALUE IF NOT EXISTS 'waiting';
ALTER TYPE visit_status ADD VALUE IF NOT EXISTS 'in_progress';
ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'visit_create';
ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'visit_submit';
ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'visit_claim';
ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'visit_withdraw';
ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'patient_update';

BEGIN;
SET LOCAL lock_timeout = '10s';
SELECT pg_advisory_xact_lock(hashtext('hf-v2-roles-queue'));
ALTER TABLE visit ADD COLUMN IF NOT EXISTS assigned_doctor_id uuid REFERENCES app_user(id);
ALTER TABLE visit ADD COLUMN IF NOT EXISTS claimed_at timestamptz;
ALTER TABLE visit ADD COLUMN IF NOT EXISTS submitted_by uuid REFERENCES app_user(id);
ALTER TABLE visit ADD COLUMN IF NOT EXISTS submitted_at timestamptz;
ALTER TABLE visit ALTER COLUMN status SET DEFAULT 'intake';
ALTER TABLE visit DROP CONSTRAINT IF EXISTS chk_visit_confirm_meta;
ALTER TABLE visit ADD CONSTRAINT chk_visit_confirm_meta CHECK (
  (status IN ('draft','intake','waiting','in_progress') AND confirmed_at IS NULL AND confirmed_by IS NULL)
  OR (status='confirmed' AND confirmed_at IS NOT NULL AND confirmed_by IS NOT NULL));

-- Retain the confirmed-row protection, including the controlled revision escape.
CREATE OR REPLACE FUNCTION fn_visit_lifecycle_guard()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE v_form_status text;
BEGIN
  IF TG_OP='INSERT' THEN
    SELECT status::text INTO v_form_status FROM form_version WHERE id=NEW.form_version_id;
    IF v_form_status IS DISTINCT FROM 'published' THEN
      RAISE EXCEPTION 'Visit must bind to a published form_version' USING ERRCODE='check_violation';
    END IF;
    RETURN NEW;
  ELSIF TG_OP='DELETE' THEN
    IF OLD.status='confirmed' THEN
      RAISE EXCEPTION 'Confirmed visit cannot be deleted' USING ERRCODE='check_violation';
    END IF;
    RETURN OLD;
  END IF;
  IF OLD.status='confirmed' THEN
    -- Migration may fill ownership only; it may not alter the clinical record.
    IF current_setting('app.v2_ownership_backfill',true)='1'
       AND OLD.assigned_doctor_id IS NULL
       AND (to_jsonb(NEW)-'assigned_doctor_id'-'claimed_at') =
           (to_jsonb(OLD)-'assigned_doctor_id'-'claimed_at') THEN
      RETURN NEW;
    END IF;
    IF NEW.status IN ('draft','in_progress')
       AND current_setting('app.allow_visit_amendment',true)='1'
       AND NEW.confirmed_at IS NULL AND NEW.confirmed_by IS NULL AND NEW.confirm_note IS NULL
       AND NEW.current_revision_no=OLD.current_revision_no+1 AND NEW.row_version=OLD.row_version+1
       AND NEW.visit_date IS NOT DISTINCT FROM OLD.visit_date
       AND NEW.visit_type IS NOT DISTINCT FROM OLD.visit_type
       AND NEW.chief_complaint IS NOT DISTINCT FROM OLD.chief_complaint
       AND NEW.clinical_note IS NOT DISTINCT FROM OLD.clinical_note
       AND NEW.info_source IS NOT DISTINCT FROM OLD.info_source
       AND NEW.assigned_doctor_id IS NOT DISTINCT FROM OLD.assigned_doctor_id THEN
      NEW.updated_at:=now(); RETURN NEW;
    END IF;
    RAISE EXCEPTION 'Confirmed visit is read-only; create a visit_revision' USING ERRCODE='check_violation';
  END IF;
  IF NEW.patient_id IS DISTINCT FROM OLD.patient_id OR NEW.form_version_id IS DISTINCT FROM OLD.form_version_id
     OR NEW.visit_code IS DISTINCT FROM OLD.visit_code OR NEW.created_by IS DISTINCT FROM OLD.created_by
     OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'Immutable visit header columns cannot be altered' USING ERRCODE='check_violation';
  END IF;
  NEW.updated_at:=now(); RETURN NEW;
END $$;

WITH migrated AS (UPDATE visit v SET status='in_progress',assigned_doctor_id=v.created_by,
 claimed_at=COALESCE(v.claimed_at,v.created_at),row_version=v.row_version+1
FROM app_user u WHERE v.status='draft' AND u.id=v.created_by AND u.role='doctor'
RETURNING v.id,v.created_by)
INSERT INTO audit_log(actor_user_id,action,entity_type,entity_id,detail)
SELECT created_by,'visit_claim','visit',id,'{"event":"legacy_draft_migration","from":"draft","to":"in_progress"}'::jsonb
FROM migrated;
-- Confirmed legacy visits must remain accessible to their original doctor.
SET LOCAL app.v2_ownership_backfill='1';
UPDATE visit v SET assigned_doctor_id=CASE WHEN confirmer.role='doctor' THEN v.confirmed_by ELSE v.created_by END,
 claimed_at=COALESCE(v.claimed_at,v.created_at)
FROM app_user creator,app_user confirmer
WHERE v.status='confirmed' AND v.assigned_doctor_id IS NULL
 AND creator.id=v.created_by AND confirmer.id=v.confirmed_by
 AND (confirmer.role='doctor' OR creator.role='doctor');
SET LOCAL app.v2_ownership_backfill='0';
CREATE INDEX IF NOT EXISTS ix_visit_waiting_submitted ON visit(submitted_at,id) WHERE status='waiting';
CREATE INDEX IF NOT EXISTS ix_visit_assigned_doctor ON visit(assigned_doctor_id,patient_id,visit_date DESC)
 WHERE assigned_doctor_id IS NOT NULL;

ALTER TABLE patient ADD COLUMN IF NOT EXISTS cccd varchar(12);
ALTER TABLE patient DROP CONSTRAINT IF EXISTS chk_patient_cccd;
ALTER TABLE patient ADD CONSTRAINT chk_patient_cccd CHECK (cccd IS NULL OR cccd ~ '^[0-9]{12}$');
UPDATE patient SET cccd=external_patient_code WHERE cccd IS NULL AND external_patient_code ~ '^[0-9]{12}$';
-- Duplicate legacy identifiers intentionally abort the transaction for reconciliation.
CREATE UNIQUE INDEX IF NOT EXISTS uq_patient_cccd ON patient(cccd) WHERE cccd IS NOT NULL;
UPDATE patient SET birth_date=make_date(birth_year,1,1),birth_year=NULL,declared_age=NULL,
 row_version=row_version+1 WHERE birth_date IS NULL AND birth_year IS NOT NULL
 AND birth_year BETWEEN 1900 AND extract(year FROM current_date)::int;
UPDATE patient SET birth_date=make_date(extract(year FROM created_at)::int-declared_age,1,1),
 declared_age=NULL,birth_year=NULL,row_version=row_version+1
WHERE birth_date IS NULL AND declared_age IS NOT NULL
 AND extract(year FROM created_at)::int-declared_age BETWEEN 1900 AND extract(year FROM current_date)::int;
DO $$ DECLARE remaining integer; BEGIN
 SELECT count(*) INTO remaining FROM patient WHERE birth_date IS NULL;
 RAISE NOTICE 'v2 patients without inferable birth_date: %',remaining;
END $$;
-- Unknown vital signs require a reason, kept separate from their scalar value.
ALTER TABLE visit_value ADD COLUMN IF NOT EXISTS unknown_reason varchar(500);
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

  -- Resolve storage/type from the pinned form, never mutate shared v1.x definitions.
  IF EXISTS(SELECT 1 FROM form_version WHERE id=v_form_version_id AND version_label='v2.0') THEN
    SELECT COALESCE(definition_overrides->fd.code->>'storageLevel',v_storage_level),
           COALESCE(definition_overrides->fd.code->>'dataType',v_data_type)
      INTO v_storage_level,v_data_type FROM form_version fv CROSS JOIN field_definition fd
      WHERE fv.id=v_form_version_id AND fd.id=NEW.field_definition_id;
  END IF;

  IF NEW.answer IS NOT NULL THEN
    IF NOT EXISTS(SELECT 1 FROM form_version WHERE id=v_form_version_id AND version_label IN ('v1.2','v2.0'))
       OR (v_data_type='text' AND NOT EXISTS(SELECT 1 FROM form_version WHERE id=v_form_version_id AND version_label='v2.0')) OR jsonb_typeof(NEW.answer)<>'object'
       OR NEW.answer->>'value_state' IS DISTINCT FROM NEW.value_state::text
       OR NOT (NEW.answer ? 'value')
       OR num_nonnulls(NEW.value_num,NEW.value_text,NEW.value_bool,NEW.value_date,NEW.field_option_id,NEW.unit)<>0
       OR (NEW.value_state='unknown' AND NEW.answer->'value'<>'null'::jsonb)
    THEN RAISE EXCEPTION 'Invalid structured visit answer' USING ERRCODE='check_violation'; END IF;
    RETURN NEW;
  END IF;

  IF NEW.value_state='unknown' AND NEW.unknown_reason IS NOT NULL
     AND EXISTS(SELECT 1 FROM field_definition WHERE id=NEW.field_definition_id AND code IN ('huyet_ap_tam_thu','huyet_ap_tam_truong'))
     AND num_nonnulls(NEW.value_num,NEW.value_text,NEW.value_bool,NEW.value_date,NEW.field_option_id,NEW.unit)=0 THEN
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
COMMIT;
