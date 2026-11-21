-- Reopen a confirmed visit only through the revision endpoint transaction.
-- Apply to existing standard MVP databases before deploying the matching API.
BEGIN;

CREATE OR REPLACE FUNCTION fn_visit_lifecycle_guard()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_form_status text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT status::text INTO v_form_status FROM form_version WHERE id = NEW.form_version_id;
    IF v_form_status IS DISTINCT FROM 'published' THEN
      RAISE EXCEPTION 'Visit must bind to a published form_version (got status=%)', v_form_status
        USING ERRCODE = 'check_violation';
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'DELETE' THEN
    IF OLD.status = 'confirmed' THEN
      RAISE EXCEPTION 'Confirmed visit % cannot be deleted', OLD.id
        USING ERRCODE = 'check_violation';
    END IF;
    RETURN OLD;
  END IF;

  IF OLD.status = 'confirmed' THEN
    IF NEW.status = 'draft'
       AND current_setting('app.allow_visit_amendment', true) = '1'
       AND NEW.confirmed_at IS NULL
       AND NEW.confirmed_by IS NULL
       AND NEW.confirm_note IS NULL
       AND NEW.current_revision_no = OLD.current_revision_no + 1
       AND NEW.row_version = OLD.row_version + 1
       AND NEW.visit_date IS NOT DISTINCT FROM OLD.visit_date
       AND NEW.visit_type IS NOT DISTINCT FROM OLD.visit_type
       AND NEW.chief_complaint IS NOT DISTINCT FROM OLD.chief_complaint
       AND NEW.clinical_note IS NOT DISTINCT FROM OLD.clinical_note
       AND NEW.info_source IS NOT DISTINCT FROM OLD.info_source
    THEN
      NEW.updated_at := now();
      RETURN NEW;
    END IF;
    RAISE EXCEPTION 'Confirmed visit % is read-only; create a visit_revision instead of direct update', OLD.id
      USING ERRCODE = 'check_violation';
  END IF;

  IF NEW.patient_id IS DISTINCT FROM OLD.patient_id
     OR NEW.form_version_id IS DISTINCT FROM OLD.form_version_id
     OR NEW.visit_code IS DISTINCT FROM OLD.visit_code
     OR NEW.created_by IS DISTINCT FROM OLD.created_by
     OR NEW.created_at IS DISTINCT FROM OLD.created_at
  THEN
    RAISE EXCEPTION 'Immutable visit header columns cannot be altered'
      USING ERRCODE = 'check_violation';
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

COMMIT;
