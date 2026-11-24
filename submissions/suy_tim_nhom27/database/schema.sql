-- =============================================================================
-- PostgreSQL 16+ DDL: Web Thu Thap Du Lieu Lam Sang Suy Tim (MVP Nhom 1, 2, 6)
-- Source of truth: CONTRACT.md & CR-W1-01.md
-- Run once on a clean database. No DROP statements.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. ENUM TYPES (CONTRACT.md Section 4.2)
-- -----------------------------------------------------------------------------
CREATE TYPE user_role AS ENUM ('doctor', 'admin');
CREATE TYPE visit_status AS ENUM ('draft', 'confirmed');
CREATE TYPE value_state AS ENUM ('answered', 'unknown');
CREATE TYPE form_version_status AS ENUM ('draft', 'published', 'retired');
CREATE TYPE field_scope_status AS ENUM ('mvp', 'can_xac_nhan');
CREATE TYPE field_data_type AS ENUM ('number', 'integer', 'text', 'boolean', 'date', 'single_choice', 'multi_choice');
CREATE TYPE section_code AS ENUM ('hanh_chinh', 'trieu_chung_dien_bien', 'sinh_ton_kham', 'benh_su_dong_mac', 'thuoc_di_ung', 'can_lam_sang', 'lao_khoa', 'ghi_chu');
CREATE TYPE readiness_tier AS ENUM ('patient_created', 'draft_saved', 'confirmed', 'ai_ready');
CREATE TYPE bp_position AS ENUM ('supine', 'sitting', 'standing');
CREATE TYPE audit_action AS ENUM ('login', 'logout', 'login_failed', 'user_create', 'user_update', 'form_version_create', 'form_version_update', 'form_version_publish', 'patient_create', 'visit_confirm', 'ai_input_export', 'care_assignment_add', 'care_assignment_revoke');

-- -----------------------------------------------------------------------------
-- 2. TABLES (21 tables including diagnosis and patient care assignments)
-- -----------------------------------------------------------------------------

CREATE TABLE app_user (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  username varchar(64) NOT NULL,
  password_hash text NOT NULL,
  full_name varchar(120) NOT NULL,
  role user_role NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  row_version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pk_app_user PRIMARY KEY (id),
  CONSTRAINT uq_app_user_username UNIQUE (username),
  CONSTRAINT chk_app_user_username_fmt CHECK (length(trim(username)) >= 3 AND username ~ '^[a-zA-Z0-9_.-]+$'),
  CONSTRAINT chk_app_user_full_name_nonempty CHECK (length(trim(full_name)) > 0),
  CONSTRAINT chk_app_user_password_hash_nonempty CHECK (length(trim(password_hash)) > 0),
  CONSTRAINT chk_app_user_row_version_pos CHECK (row_version > 0)
);
CREATE INDEX ix_app_user_role_active ON app_user (role, is_active);

CREATE TABLE user_session (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  refresh_token_hash varchar(128) NOT NULL,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  ip inet,
  user_agent varchar(255),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pk_user_session PRIMARY KEY (id),
  CONSTRAINT uq_user_session_token_hash UNIQUE (refresh_token_hash),
  FOREIGN KEY (user_id) REFERENCES app_user(id) ON DELETE CASCADE,
  CONSTRAINT chk_user_session_hash_nonempty CHECK (length(trim(refresh_token_hash)) > 0),
  CONSTRAINT chk_user_session_expires_after_create CHECK (expires_at > created_at),
  CONSTRAINT chk_user_session_revoked_after_create CHECK (revoked_at IS NULL OR revoked_at >= created_at)
);
CREATE INDEX ix_user_session_user_active ON user_session (user_id, expires_at) WHERE revoked_at IS NULL;

CREATE TABLE patient (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  patient_code varchar(16) NOT NULL,
  external_patient_code varchar(64),
  full_name varchar(120) NOT NULL,
  sex varchar(16) NOT NULL,
  birth_date date,
  birth_year smallint,
  declared_age smallint,
  row_version integer NOT NULL DEFAULT 1,
  created_by uuid NOT NULL,
  updated_by uuid REFERENCES app_user(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pk_patient PRIMARY KEY (id),
  CONSTRAINT uq_patient_code UNIQUE (patient_code),
  FOREIGN KEY (created_by) REFERENCES app_user(id) ON DELETE RESTRICT,
  CONSTRAINT chk_patient_code_fmt CHECK (patient_code ~ '^BN-[0-9]{5}$'),
  CONSTRAINT chk_patient_full_name_len CHECK (length(trim(full_name)) >= 2),
  CONSTRAINT chk_patient_sex CHECK (sex IN ('male', 'female', 'unknown')),
  CONSTRAINT chk_patient_birth_date_range CHECK (birth_date IS NULL OR (birth_date >= DATE '1900-01-01' AND birth_date <= CURRENT_DATE)),
  CONSTRAINT chk_patient_birth_year_range CHECK (birth_year IS NULL OR (birth_year BETWEEN 1900 AND 2100)),
  CONSTRAINT chk_patient_declared_age_range CHECK (declared_age IS NULL OR (declared_age BETWEEN 0 AND 120)),
  CONSTRAINT chk_patient_age_precision_mutex CHECK (num_nonnulls(birth_date, birth_year, declared_age) <= 1),
  CONSTRAINT chk_patient_row_version_pos CHECK (row_version > 0)
);
CREATE INDEX ix_patient_full_name ON patient (full_name);
CREATE INDEX ix_patient_external_code ON patient (external_patient_code) WHERE external_patient_code IS NOT NULL;

CREATE TABLE field_definition (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  code varchar(80) NOT NULL,
  label_vi varchar(200) NOT NULL,
  section_code section_code NOT NULL,
  data_type field_data_type NOT NULL,
  canonical_unit varchar(40),
  scope_status field_scope_status NOT NULL,
  storage_level varchar(24) NOT NULL DEFAULT 'visit_value',
  is_calculated boolean NOT NULL DEFAULT false,
  min_value numeric,
  max_value numeric,
  validation_rule jsonb,
  help_text text,
  source_ref text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pk_field_definition PRIMARY KEY (id),
  CONSTRAINT uq_field_definition_code UNIQUE (code),
  CONSTRAINT chk_field_def_code_fmt CHECK (code ~ '^[a-z][a-z0-9_]*$'),
  CONSTRAINT chk_field_def_label_nonempty CHECK (length(trim(label_vi)) > 0),
  CONSTRAINT chk_field_def_source_nonempty CHECK (length(trim(source_ref)) > 0),
  CONSTRAINT chk_field_def_storage_level CHECK (storage_level IN ('patient', 'visit_value', 'computed', 'orthostatic_bp', 'medication', 'allergy', 'lab_result', 'visit', 'diagnosis')),
  CONSTRAINT chk_field_def_min_max CHECK (min_value IS NULL OR max_value IS NULL OR min_value <= max_value),
  CONSTRAINT chk_field_def_bounds_numeric_only CHECK (data_type IN ('number', 'integer') OR (min_value IS NULL AND max_value IS NULL))
);
CREATE INDEX ix_field_def_scope_section ON field_definition (scope_status, section_code);

CREATE TABLE field_option (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  field_definition_id uuid NOT NULL,
  option_code varchar(64) NOT NULL,
  label_vi varchar(160) NOT NULL,
  display_order smallint NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  CONSTRAINT pk_field_option PRIMARY KEY (id),
  CONSTRAINT uq_field_option_code UNIQUE (field_definition_id, option_code),
  CONSTRAINT uq_field_option_order UNIQUE (field_definition_id, display_order),
  CONSTRAINT uq_field_option_id_field UNIQUE (id, field_definition_id),
  FOREIGN KEY (field_definition_id) REFERENCES field_definition(id) ON DELETE CASCADE,
  CONSTRAINT chk_field_option_code_fmt CHECK (option_code ~ '^[a-z0-9_]+$'),
  CONSTRAINT chk_field_option_label_nonempty CHECK (length(trim(label_vi)) > 0),
  CONSTRAINT chk_field_option_order_pos CHECK (display_order > 0)
);

CREATE TABLE field_ai_module (
  field_definition_id uuid NOT NULL,
  ai_module_code varchar(32) NOT NULL,
  is_required boolean NOT NULL DEFAULT false,
  source_stt_refs text,
  CONSTRAINT pk_field_ai_module PRIMARY KEY (field_definition_id, ai_module_code),
  FOREIGN KEY (field_definition_id) REFERENCES field_definition(id) ON DELETE CASCADE,
  CONSTRAINT chk_field_ai_module_code CHECK (ai_module_code IN ('ai_diagnosis', 'ai_lab_test', 'ai_treatment', 'ai_medsafety'))
);
CREATE INDEX ix_field_ai_module_code ON field_ai_module (ai_module_code);

CREATE TABLE form_template (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  code varchar(64) NOT NULL,
  name varchar(160) NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pk_form_template PRIMARY KEY (id),
  CONSTRAINT uq_form_template_code UNIQUE (code),
  CONSTRAINT chk_form_template_code_fmt CHECK (code ~ '^[a-z][a-z0-9_]*$'),
  CONSTRAINT chk_form_template_name_nonempty CHECK (length(trim(name)) > 0)
);

CREATE TABLE form_version (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  form_template_id uuid NOT NULL,
  version_no integer NOT NULL,
  version_label varchar(32) NOT NULL,
  status form_version_status NOT NULL DEFAULT 'draft',
  based_on_version_id uuid,
  change_note text,
  definition_overrides jsonb NOT NULL DEFAULT '{}',
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz,
  published_by uuid,
  row_version integer NOT NULL DEFAULT 1,
  CONSTRAINT pk_form_version PRIMARY KEY (id),
  CONSTRAINT uq_form_version_template_no UNIQUE (form_template_id, version_no),
  FOREIGN KEY (form_template_id) REFERENCES form_template(id) ON DELETE RESTRICT,
  FOREIGN KEY (based_on_version_id) REFERENCES form_version(id) ON DELETE RESTRICT,
  FOREIGN KEY (created_by) REFERENCES app_user(id) ON DELETE RESTRICT,
  FOREIGN KEY (published_by) REFERENCES app_user(id) ON DELETE RESTRICT,
  CONSTRAINT chk_form_version_no_pos CHECK (version_no > 0),
  CONSTRAINT chk_form_version_label_nonempty CHECK (length(trim(version_label)) > 0),
  CONSTRAINT chk_form_version_not_self_based CHECK (based_on_version_id IS NULL OR based_on_version_id <> id),
  CONSTRAINT chk_form_version_publish_meta CHECK ((status = 'draft' AND published_at IS NULL AND published_by IS NULL) OR (status IN ('published', 'retired') AND published_at IS NOT NULL AND published_by IS NOT NULL)),
  CONSTRAINT chk_form_version_row_version_pos CHECK (row_version > 0)
);
CREATE UNIQUE INDEX ux_form_version_one_published ON form_version (form_template_id) WHERE status = 'published';

CREATE TABLE form_section (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  form_version_id uuid NOT NULL,
  section_code section_code NOT NULL,
  title_vi varchar(160) NOT NULL,
  description text,
  display_order smallint NOT NULL,
  CONSTRAINT pk_form_section PRIMARY KEY (id),
  CONSTRAINT uq_form_section_version_code UNIQUE (form_version_id, section_code),
  CONSTRAINT uq_form_section_version_order UNIQUE (form_version_id, display_order),
  CONSTRAINT uq_form_section_id_version UNIQUE (id, form_version_id),
  FOREIGN KEY (form_version_id) REFERENCES form_version(id) ON DELETE CASCADE,
  CONSTRAINT chk_form_section_title_nonempty CHECK (length(trim(title_vi)) > 0),
  CONSTRAINT chk_form_section_order_pos CHECK (display_order > 0)
);

CREATE TABLE form_field (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  form_version_id uuid NOT NULL,
  form_section_id uuid NOT NULL,
  field_definition_id uuid NOT NULL,
  display_order smallint NOT NULL,
  required_for_confirm boolean NOT NULL DEFAULT false,
  is_visible boolean NOT NULL DEFAULT true,
  is_readonly boolean NOT NULL DEFAULT false,
  custom_label_vi varchar(200),
  custom_help_text text,
  CONSTRAINT pk_form_field PRIMARY KEY (id),
  CONSTRAINT uq_form_field_version_def UNIQUE (form_version_id, field_definition_id),
  CONSTRAINT uq_form_field_section_order UNIQUE (form_section_id, display_order),
  FOREIGN KEY (form_section_id, form_version_id) REFERENCES form_section(id, form_version_id) ON DELETE CASCADE,
  FOREIGN KEY (field_definition_id) REFERENCES field_definition(id) ON DELETE RESTRICT,
  CONSTRAINT chk_form_field_order_pos CHECK (display_order > 0)
);
CREATE INDEX ix_form_field_def ON form_field (field_definition_id);

CREATE TABLE visit (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  visit_code varchar(24) NOT NULL,
  external_visit_code varchar(64),
  patient_id uuid NOT NULL,
  form_version_id uuid NOT NULL,
  visit_date timestamptz NOT NULL,
  visit_type varchar(32) NOT NULL DEFAULT 'outpatient_new',
  chief_complaint text,
  clinical_note text,
  info_source varchar(64),
  medication_list_state text NOT NULL DEFAULT 'unknown' CHECK (medication_list_state IN ('known', 'none', 'unknown')),
  allergy_list_state text NOT NULL DEFAULT 'unknown' CHECK (allergy_list_state IN ('known', 'none', 'unknown')),
  diagnosis_list_state text NOT NULL DEFAULT 'unknown' CHECK (diagnosis_list_state IN ('known', 'none', 'unknown')),
  status visit_status NOT NULL DEFAULT 'draft',
  current_revision_no integer NOT NULL DEFAULT 1,
  created_by uuid NOT NULL,
  updated_by uuid REFERENCES app_user(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  confirmed_at timestamptz,
  confirmed_by uuid,
  confirm_note text,
  row_version integer NOT NULL DEFAULT 1,
  CONSTRAINT pk_visit PRIMARY KEY (id),
  CONSTRAINT uq_visit_code UNIQUE (visit_code),
  FOREIGN KEY (patient_id) REFERENCES patient(id) ON DELETE RESTRICT,
  FOREIGN KEY (form_version_id) REFERENCES form_version(id) ON DELETE RESTRICT,
  FOREIGN KEY (created_by) REFERENCES app_user(id) ON DELETE RESTRICT,
  FOREIGN KEY (confirmed_by) REFERENCES app_user(id) ON DELETE RESTRICT,
  CONSTRAINT chk_visit_code_fmt CHECK (visit_code ~ '^LK-[A-Z0-9-]+$'),
  CONSTRAINT chk_visit_type CHECK (visit_type IN ('outpatient_new', 'follow_up', 'acute_inpatient')),
  CONSTRAINT chk_visit_confirm_meta CHECK ((status = 'draft' AND confirmed_at IS NULL AND confirmed_by IS NULL) OR (status = 'confirmed' AND confirmed_at IS NOT NULL AND confirmed_by IS NOT NULL)),
  CONSTRAINT chk_visit_revision_pos CHECK (current_revision_no > 0),
  CONSTRAINT chk_visit_row_version_pos CHECK (row_version > 0)
);
CREATE INDEX ix_visit_patient_date ON visit (patient_id, visit_date DESC);
CREATE INDEX ix_visit_form_version ON visit (form_version_id);
CREATE INDEX ix_visit_status ON visit (status);

CREATE TABLE visit_value (
  visit_id uuid NOT NULL,
  field_definition_id uuid NOT NULL,
  value_state value_state NOT NULL,
  value_num numeric,
  value_text text,
  value_bool boolean,
  value_date date,
  field_option_id uuid,
  unit varchar(40),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pk_visit_value PRIMARY KEY (visit_id, field_definition_id),
  FOREIGN KEY (visit_id) REFERENCES visit(id) ON DELETE CASCADE,
  FOREIGN KEY (field_definition_id) REFERENCES field_definition(id) ON DELETE RESTRICT,
  FOREIGN KEY (field_option_id, field_definition_id) REFERENCES field_option(id, field_definition_id) ON DELETE RESTRICT,
  CONSTRAINT chk_visit_value_state_cols CHECK ((value_state = 'unknown' AND value_num IS NULL AND value_text IS NULL AND value_bool IS NULL AND value_date IS NULL AND field_option_id IS NULL AND unit IS NULL) OR (value_state = 'answered' AND num_nonnulls(value_num, value_text, value_bool, value_date, field_option_id) <= 1))
);
CREATE INDEX ix_visit_value_field ON visit_value (field_definition_id);

CREATE TABLE visit_value_option (
  visit_id uuid NOT NULL,
  field_definition_id uuid NOT NULL,
  field_option_id uuid NOT NULL,
  CONSTRAINT pk_visit_value_option PRIMARY KEY (visit_id, field_definition_id, field_option_id),
  FOREIGN KEY (visit_id, field_definition_id) REFERENCES visit_value(visit_id, field_definition_id) ON DELETE CASCADE,
  FOREIGN KEY (field_option_id, field_definition_id) REFERENCES field_option(id, field_definition_id) ON DELETE RESTRICT
);
CREATE INDEX ix_visit_value_option_opt ON visit_value_option (field_option_id);

CREATE TABLE visit_orthostatic_bp (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  visit_id uuid NOT NULL,
  position bp_position NOT NULL,
  minute_after smallint,
  systolic smallint NOT NULL,
  diastolic smallint NOT NULL,
  heart_rate smallint,
  measured_at timestamptz NOT NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pk_visit_orthostatic_bp PRIMARY KEY (id),
  FOREIGN KEY (visit_id) REFERENCES visit(id) ON DELETE CASCADE,
  CONSTRAINT chk_bp_minute_after CHECK (minute_after IS NULL OR minute_after BETWEEN 0 AND 60),
  CONSTRAINT chk_bp_systolic_range CHECK (systolic BETWEEN 40 AND 300),
  CONSTRAINT chk_bp_diastolic_range CHECK (diastolic BETWEEN 20 AND 200),
  CONSTRAINT chk_bp_sys_gt_dia CHECK (systolic > diastolic),
  CONSTRAINT chk_bp_hr_range CHECK (heart_rate IS NULL OR heart_rate BETWEEN 20 AND 300)
);
CREATE INDEX ix_visit_bp_visit_time ON visit_orthostatic_bp (visit_id, measured_at);

CREATE TABLE visit_medication (
  atc_code text CHECK (atc_code ~ '^[A-Z][0-9]{2}[A-Z]{2}[0-9]{2}$'),
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  visit_id uuid NOT NULL,
  medication_group varchar(32) NOT NULL DEFAULT 'prescribed',
  drug_name varchar(160) NOT NULL,
  active_ingredient varchar(160),
  strength varchar(64),
  dose numeric,
  unit varchar(32),
  frequency varchar(80),
  route varchar(32),
  status varchar(24) NOT NULL DEFAULT 'active',
  started_at date,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pk_visit_medication PRIMARY KEY (id),
  FOREIGN KEY (visit_id) REFERENCES visit(id) ON DELETE CASCADE,
  CONSTRAINT chk_med_group CHECK (medication_group IN ('prescribed', 'otc_supplement_tcm')),
  CONSTRAINT chk_med_drug_name_nonempty CHECK (length(trim(drug_name)) > 0),
  CONSTRAINT chk_med_dose_pos CHECK (dose IS NULL OR dose > 0),
  CONSTRAINT chk_med_route CHECK (route IS NULL OR route IN ('oral', 'iv', 'subcutaneous', 'inhaled', 'topical', 'other')),
  CONSTRAINT chk_med_status CHECK (status IN ('active', 'stopped', 'proposed'))
);
CREATE INDEX ix_visit_med_visit_status ON visit_medication (visit_id, status);

CREATE TABLE visit_allergy (
  atc_code text CHECK (atc_code ~ '^[A-Z][0-9]{2}[A-Z]{2}[0-9]{2}$'),
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  visit_id uuid NOT NULL,
  kind varchar(24) NOT NULL,
  agent_category varchar(32) NOT NULL DEFAULT 'therapeutic_drug',
  allergen varchar(160) NOT NULL,
  reaction text,
  severity varchar(24) NOT NULL DEFAULT 'unknown',
  recorded_at timestamptz,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pk_visit_allergy PRIMARY KEY (id),
  FOREIGN KEY (visit_id) REFERENCES visit(id) ON DELETE CASCADE,
  CONSTRAINT chk_allergy_kind CHECK (kind IN ('allergy', 'adr', 'intolerance')),
  CONSTRAINT chk_allergy_agent_cat CHECK (agent_category IN ('therapeutic_drug', 'contrast_media', 'other')),
  CONSTRAINT chk_allergy_allergen_nonempty CHECK (length(trim(allergen)) > 0),
  CONSTRAINT chk_allergy_severity CHECK (severity IN ('mild', 'moderate', 'severe', 'unknown'))
);
CREATE INDEX ix_visit_allergy_visit_kind ON visit_allergy (visit_id, kind);

CREATE TABLE visit_lab_result (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  visit_id uuid NOT NULL,
  lab_code varchar(80) NOT NULL,
  lab_subtype varchar(64),
  value_num numeric,
  value_text text,
  unit varchar(40),
  measured_at timestamptz NOT NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pk_visit_lab_result PRIMARY KEY (id),
  FOREIGN KEY (visit_id) REFERENCES visit(id) ON DELETE CASCADE,
  FOREIGN KEY (lab_code) REFERENCES field_definition(code) ON DELETE RESTRICT,
  CONSTRAINT chk_lab_has_value CHECK (value_num IS NOT NULL OR (value_text IS NOT NULL AND length(trim(value_text)) > 0)),
  CONSTRAINT chk_lab_value_num_nonneg CHECK (value_num IS NULL OR value_num >= 0),
  CONSTRAINT chk_lab_unit_required_for_num CHECK (value_num IS NULL OR (unit IS NOT NULL AND length(trim(unit)) > 0))
);
CREATE INDEX ix_visit_lab_visit_code_time ON visit_lab_result (visit_id, lab_code, measured_at DESC);

CREATE TABLE visit_revision (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  visit_id uuid NOT NULL,
  revision_no integer NOT NULL,
  form_version_id uuid NOT NULL,
  revision_type varchar(32) NOT NULL DEFAULT 'confirmed_snapshot',
  change_reason text NOT NULL,
  snapshot_data jsonb NOT NULL,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pk_visit_revision PRIMARY KEY (id),
  CONSTRAINT uq_visit_revision_visit_no UNIQUE (visit_id, revision_no),
  FOREIGN KEY (visit_id) REFERENCES visit(id) ON DELETE RESTRICT,
  FOREIGN KEY (form_version_id) REFERENCES form_version(id) ON DELETE RESTRICT,
  FOREIGN KEY (created_by) REFERENCES app_user(id) ON DELETE RESTRICT,
  CONSTRAINT chk_visit_rev_no_pos CHECK (revision_no > 0),
  CONSTRAINT chk_visit_rev_type CHECK (revision_type IN ('confirmed_snapshot', 'post_confirm_amendment')),
  CONSTRAINT chk_visit_rev_reason_nonempty CHECK (length(trim(change_reason)) > 0),
  CONSTRAINT chk_visit_rev_snapshot_obj CHECK (jsonb_typeof(snapshot_data) = 'object')
);
CREATE INDEX ix_visit_revision_visit_time ON visit_revision (visit_id, created_at DESC);

CREATE TABLE audit_log (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  actor_user_id uuid,
  action audit_action NOT NULL,
  entity_type varchar(64) NOT NULL,
  entity_id uuid,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  ip inet,
  request_id varchar(64),
  outcome varchar(16) NOT NULL DEFAULT 'success',
  detail jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT pk_audit_log PRIMARY KEY (id),
  FOREIGN KEY (actor_user_id) REFERENCES app_user(id) ON DELETE RESTRICT,
  CONSTRAINT chk_audit_entity_type_nonempty CHECK (length(trim(entity_type)) > 0),
  CONSTRAINT chk_audit_outcome CHECK (outcome IN ('success', 'denied', 'failure')),
  CONSTRAINT chk_audit_detail_object CHECK (jsonb_typeof(detail) = 'object')
);
CREATE INDEX ix_audit_occurred_at ON audit_log (occurred_at DESC);
CREATE INDEX ix_audit_actor_time ON audit_log (actor_user_id, occurred_at DESC);
CREATE INDEX ix_audit_entity_time ON audit_log (entity_type, entity_id, occurred_at DESC);

-- -----------------------------------------------------------------------------
-- 3. TRIGGER FUNCTIONS & TRIGGERS (Immutability, 3-state & type validation, Audit guard)
-- -----------------------------------------------------------------------------

CREATE TABLE visit_diagnosis (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  visit_id uuid NOT NULL REFERENCES visit(id),
  code text NOT NULL,
  display text NOT NULL,
  role text NOT NULL,
  CONSTRAINT pk_visit_diagnosis PRIMARY KEY (id),
  CONSTRAINT uq_visit_diagnosis_code UNIQUE (visit_id, code),
  CONSTRAINT chk_visit_diagnosis_code CHECK (code ~ '^[A-Z][0-9]{2}(\.[A-Z0-9]{1,4})?$'),
  CONSTRAINT chk_visit_diagnosis_display CHECK (length(btrim(display)) BETWEEN 1 AND 200),
  CONSTRAINT chk_visit_diagnosis_role CHECK (role IN ('primary', 'secondary'))
);
CREATE UNIQUE INDEX ix_visit_diagnosis_primary ON visit_diagnosis (visit_id) WHERE role = 'primary';

CREATE TABLE patient_care_assignment (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patient(id),
  doctor_user_id uuid NOT NULL REFERENCES app_user(id),
  assigned_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  assigned_by uuid NOT NULL REFERENCES app_user(id),
  reason text,
  revoked_at timestamptz,
  revoked_by uuid REFERENCES app_user(id),
  CONSTRAINT pk_patient_care_assignment PRIMARY KEY (id),
  CONSTRAINT chk_care_reason_length CHECK (reason IS NULL OR length(reason) <= 1000),
  CONSTRAINT chk_care_revocation_pair CHECK ((revoked_at IS NULL) = (revoked_by IS NULL))
);
CREATE UNIQUE INDEX ix_care_active_pair ON patient_care_assignment (patient_id, doctor_user_id) WHERE revoked_at IS NULL;
CREATE INDEX ix_care_doctor_patient ON patient_care_assignment (doctor_user_id, patient_id) WHERE revoked_at IS NULL;
CREATE INDEX ix_care_patient ON patient_care_assignment (patient_id, assigned_at DESC);

CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION fn_bump_row_version()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.row_version < OLD.row_version THEN
    RAISE EXCEPTION 'row_version cannot decrease (% -> %)', OLD.row_version, NEW.row_version
      USING ERRCODE = 'check_violation';
  END IF;
  IF NEW.row_version = OLD.row_version THEN
    NEW.row_version := OLD.row_version + 1;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_app_user_row_version
  BEFORE UPDATE ON app_user
  FOR EACH ROW EXECUTE FUNCTION fn_bump_row_version();

CREATE TRIGGER trg_app_user_updated_at
  BEFORE UPDATE ON app_user
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TRIGGER trg_field_definition_updated_at
  BEFORE UPDATE ON field_definition
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TRIGGER trg_visit_value_updated_at
  BEFORE UPDATE ON visit_value
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE OR REPLACE FUNCTION fn_patient_immutable_code()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.patient_code IS DISTINCT FROM OLD.patient_code THEN
    RAISE EXCEPTION 'patient_code (%) is immutable and cannot be modified', OLD.patient_code
      USING ERRCODE = 'check_violation';
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_patient_immutable_code
  BEFORE UPDATE ON patient
  FOR EACH ROW EXECUTE FUNCTION fn_patient_immutable_code();

CREATE OR REPLACE FUNCTION fn_form_version_immutable()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_has_visits boolean;
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.status <> 'draft' THEN
      RAISE EXCEPTION 'Cannot delete non-draft form_version % (status=%)', OLD.id, OLD.status
        USING ERRCODE = 'check_violation';
    END IF;
    SELECT EXISTS (SELECT 1 FROM visit WHERE form_version_id = OLD.id) INTO v_has_visits;
    IF v_has_visits THEN
      RAISE EXCEPTION 'Cannot delete form_version % already referenced by visit', OLD.id
        USING ERRCODE = 'check_violation';
    END IF;
    RETURN OLD;
  END IF;

  IF OLD.status = 'retired' THEN
    RAISE EXCEPTION 'Retired form_version % is immutable', OLD.id
      USING ERRCODE = 'check_violation';
  END IF;

  IF OLD.status = 'published' THEN
    IF NEW.status = 'retired'
       AND NEW.form_template_id = OLD.form_template_id
       AND NEW.version_no = OLD.version_no
       AND NEW.version_label = OLD.version_label
       AND NEW.based_on_version_id IS NOT DISTINCT FROM OLD.based_on_version_id
       AND NEW.change_note IS NOT DISTINCT FROM OLD.change_note
       AND NEW.definition_overrides IS NOT DISTINCT FROM OLD.definition_overrides
       AND NEW.created_by = OLD.created_by
       AND NEW.created_at = OLD.created_at
       AND NEW.published_at = OLD.published_at
       AND NEW.published_by = OLD.published_by
    THEN
      RETURN NEW;
    END IF;
    RAISE EXCEPTION 'Published form_version % is immutable; only transition published -> retired is permitted', OLD.id
      USING ERRCODE = 'check_violation';
  END IF;

  SELECT EXISTS (SELECT 1 FROM visit WHERE form_version_id = OLD.id) INTO v_has_visits;
  IF v_has_visits THEN
    RAISE EXCEPTION 'Form version % already used by visits cannot be modified', OLD.id
      USING ERRCODE = 'check_violation';
  END IF;

  IF NEW.status = 'published' THEN
    IF NOT EXISTS (SELECT 1 FROM form_section WHERE form_version_id = NEW.id) THEN
      RAISE EXCEPTION 'Cannot publish form_version % without form_section rows', NEW.id
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_form_version_immutable
  BEFORE UPDATE OR DELETE ON form_version
  FOR EACH ROW EXECUTE FUNCTION fn_form_version_immutable();

CREATE OR REPLACE FUNCTION fn_form_structure_immutable()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_version_id uuid;
  v_status text;
  v_has_visits boolean;
BEGIN
  v_version_id := COALESCE(NEW.form_version_id, OLD.form_version_id);
  SELECT status::text INTO v_status FROM form_version WHERE id = v_version_id;
  IF TG_OP = 'DELETE' AND v_status IS NULL THEN
    RETURN OLD;
  END IF;
  IF v_status IS NULL THEN
    RAISE EXCEPTION 'Referenced form_version % does not exist', v_version_id
      USING ERRCODE = 'foreign_key_violation';
  END IF;
  IF v_status <> 'draft' THEN
    RAISE EXCEPTION 'Cannot modify structure of form_version % (status=%)', v_version_id, v_status
      USING ERRCODE = 'check_violation';
  END IF;
  SELECT EXISTS (SELECT 1 FROM visit WHERE form_version_id = v_version_id) INTO v_has_visits;
  IF v_has_visits THEN
    RAISE EXCEPTION 'Cannot modify structure of form_version % already referenced by visits', v_version_id
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_form_section_immutable
  BEFORE INSERT OR UPDATE OR DELETE ON form_section
  FOR EACH ROW EXECUTE FUNCTION fn_form_structure_immutable();

CREATE TRIGGER trg_form_field_immutable
  BEFORE INSERT OR UPDATE OR DELETE ON form_field
  FOR EACH ROW EXECUTE FUNCTION fn_form_structure_immutable();

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

CREATE TRIGGER trg_visit_lifecycle_guard
  BEFORE INSERT OR UPDATE OR DELETE ON visit
  FOR EACH ROW EXECUTE FUNCTION fn_visit_lifecycle_guard();

CREATE OR REPLACE FUNCTION fn_visit_child_confirmed_guard()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_visit_id uuid;
  v_status text;
BEGIN
  v_visit_id := COALESCE(NEW.visit_id, OLD.visit_id);
  SELECT status::text INTO v_status FROM visit WHERE id = v_visit_id;
  IF v_status = 'confirmed' THEN
    RAISE EXCEPTION 'Cannot modify child records of confirmed visit %', v_visit_id
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_visit_bp_confirmed_guard
  BEFORE INSERT OR UPDATE OR DELETE ON visit_orthostatic_bp
  FOR EACH ROW EXECUTE FUNCTION fn_visit_child_confirmed_guard();

CREATE TRIGGER trg_visit_med_confirmed_guard
  BEFORE INSERT OR UPDATE OR DELETE ON visit_medication
  FOR EACH ROW EXECUTE FUNCTION fn_visit_child_confirmed_guard();

CREATE TRIGGER trg_visit_allergy_confirmed_guard
  BEFORE INSERT OR UPDATE OR DELETE ON visit_allergy
  FOR EACH ROW EXECUTE FUNCTION fn_visit_child_confirmed_guard();

CREATE TRIGGER trg_visit_diagnosis_confirmed_guard
  BEFORE INSERT OR UPDATE OR DELETE ON visit_diagnosis
  FOR EACH ROW EXECUTE FUNCTION fn_visit_child_confirmed_guard();

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

  IF NOT v_in_form THEN
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

CREATE TRIGGER trg_visit_value_guard
  BEFORE INSERT OR UPDATE OR DELETE ON visit_value
  FOR EACH ROW EXECUTE FUNCTION fn_visit_value_guard();

CREATE OR REPLACE FUNCTION fn_visit_value_multichoice_deferred()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_data_type text;
  v_opt_count integer;
BEGIN
  SELECT data_type::text INTO v_data_type FROM field_definition WHERE id = NEW.field_definition_id;
  IF v_data_type = 'multi_choice' AND NEW.value_state = 'answered' THEN
    SELECT count(*) INTO v_opt_count
    FROM visit_value_option
    WHERE visit_id = NEW.visit_id AND field_definition_id = NEW.field_definition_id;
    IF v_opt_count = 0 THEN
      RAISE EXCEPTION 'multi_choice answered visit_value (visit=%, field=%) requires at least one visit_value_option row', NEW.visit_id, NEW.field_definition_id
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN NULL;
END;
$$;

CREATE CONSTRAINT TRIGGER trg_visit_value_multichoice_deferred
  AFTER INSERT OR UPDATE ON visit_value
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION fn_visit_value_multichoice_deferred();

CREATE OR REPLACE FUNCTION fn_visit_value_option_guard()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_visit_id uuid;
  v_field_id uuid;
  v_visit_status text;
  v_val_state text;
  v_data_type text;
BEGIN
  v_visit_id := COALESCE(NEW.visit_id, OLD.visit_id);
  v_field_id := COALESCE(NEW.field_definition_id, OLD.field_definition_id);
  SELECT status::text INTO v_visit_status FROM visit WHERE id = v_visit_id;
  IF v_visit_status = 'confirmed' THEN
    RAISE EXCEPTION 'Cannot modify visit_value_option of confirmed visit %', v_visit_id
      USING ERRCODE = 'check_violation';
  END IF;
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  SELECT data_type::text INTO v_data_type FROM field_definition WHERE id = v_field_id;
  IF v_data_type <> 'multi_choice' THEN
    RAISE EXCEPTION 'visit_value_option only allows fields with data_type=multi_choice (got %)', v_data_type
      USING ERRCODE = 'check_violation';
  END IF;
  SELECT value_state::text INTO v_val_state FROM visit_value
  WHERE visit_id = v_visit_id AND field_definition_id = v_field_id;
  IF v_val_state IS DISTINCT FROM 'answered' THEN
    RAISE EXCEPTION 'visit_value_option requires parent visit_value.value_state=answered'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_visit_value_option_guard
  BEFORE INSERT OR UPDATE OR DELETE ON visit_value_option
  FOR EACH ROW EXECUTE FUNCTION fn_visit_value_option_guard();

CREATE OR REPLACE FUNCTION fn_visit_lab_guard()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_visit_id uuid;
  v_status text;
  v_storage_level varchar(24);
BEGIN
  v_visit_id := COALESCE(NEW.visit_id, OLD.visit_id);
  SELECT status::text INTO v_status FROM visit WHERE id = v_visit_id;
  IF v_status = 'confirmed' THEN
    RAISE EXCEPTION 'Cannot modify visit_lab_result of confirmed visit %', v_visit_id
      USING ERRCODE = 'check_violation';
  END IF;
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  SELECT storage_level INTO v_storage_level FROM field_definition WHERE code = NEW.lab_code;
  IF v_storage_level IS DISTINCT FROM 'lab_result' THEN
    RAISE EXCEPTION 'lab_code % must map to a field_definition with storage_level=lab_result', NEW.lab_code
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_visit_lab_guard
  BEFORE INSERT OR UPDATE OR DELETE ON visit_lab_result
  FOR EACH ROW EXECUTE FUNCTION fn_visit_lab_guard();

CREATE OR REPLACE FUNCTION fn_append_only_immutable()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'Table % is append-only; % is forbidden', TG_TABLE_NAME, TG_OP
    USING ERRCODE = 'check_violation';
END;
$$;

CREATE TRIGGER trg_visit_revision_append_only
  BEFORE UPDATE OR DELETE ON visit_revision
  FOR EACH ROW EXECUTE FUNCTION fn_append_only_immutable();

CREATE TRIGGER trg_audit_log_append_only
  BEFORE UPDATE OR DELETE ON audit_log
  FOR EACH ROW EXECUTE FUNCTION fn_append_only_immutable();

CREATE OR REPLACE FUNCTION fn_audit_log_no_clinical_data()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.detail ?| ARRAY[
    'values', 'visit_values', 'orthostatic_bp', 'medications',
    'allergies', 'lab_results', 'clinical_note', 'snapshot_data',
    'password', 'password_hash'
  ] THEN
    RAISE EXCEPTION 'audit_log.detail must never store clinical payload or credentials (Contract K8)'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_audit_log_no_clinical_data
  BEFORE INSERT ON audit_log
  FOR EACH ROW EXECUTE FUNCTION fn_audit_log_no_clinical_data();

COMMIT;
