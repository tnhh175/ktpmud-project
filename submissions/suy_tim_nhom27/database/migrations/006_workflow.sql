-- Explicit upgrade for an existing MVP database. Never run automatically on hosted DBs.
-- Enum additions must commit before the new values can be used.
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'pharmacist';
ALTER TYPE field_data_type ADD VALUE IF NOT EXISTS 'object';
ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'workflow_fields_saved';
ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'workflow_run';
ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'workflow_decision';
ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'workflow_confirmation';
ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'workflow_invalidated';
ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'workflow_finished';

BEGIN;
ALTER TABLE field_definition DROP CONSTRAINT IF EXISTS chk_field_def_storage_level;
ALTER TABLE field_definition ADD CONSTRAINT chk_field_def_storage_level CHECK
 (storage_level IN ('patient','visit_value','computed','orthostatic_bp','medication','allergy','lab_result','visit','diagnosis','workflow_value'));
CREATE TABLE IF NOT EXISTS ai_workflow (
    visit_id uuid PRIMARY KEY REFERENCES visit(id) ON DELETE RESTRICT,
    row_version integer NOT NULL DEFAULT 1 CHECK (row_version > 0),
    -- One shared workflow draft, never a separate editable copy per module.
    fields jsonb NOT NULL DEFAULT '{}',
    observations jsonb NOT NULL DEFAULT '[]',
    recent_test_evidence jsonb NOT NULL DEFAULT '{}',
    module_meta jsonb NOT NULL DEFAULT '{}',
    source_hash text,
    source_fields jsonb NOT NULL DEFAULT '{}',
    source_revision_no integer NOT NULL DEFAULT 1,
    completed_at timestamptz,
    updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE ai_workflow ADD COLUMN IF NOT EXISTS source_fields jsonb NOT NULL DEFAULT '{}';
ALTER TABLE ai_workflow ADD COLUMN IF NOT EXISTS source_revision_no integer NOT NULL DEFAULT 1;
CREATE TABLE IF NOT EXISTS ai_module_run (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    visit_id uuid NOT NULL REFERENCES visit(id) ON DELETE RESTRICT,
    module text NOT NULL CHECK(module IN ('m1','m2','m3','m4')),
    attempt integer NOT NULL CHECK(attempt > 0),
    status text NOT NULL CHECK(status IN ('running','succeeded','failed')),
    form_version_id uuid NOT NULL REFERENCES form_version(id),
    visit_revision_no integer NOT NULL,
    input_snapshot jsonb NOT NULL,
    engine_context jsonb NOT NULL DEFAULT '{}',
    input_hash text NOT NULL CHECK(input_hash ~ '^sha256:[0-9a-f]{64}$'),
    upstream_decision_ids jsonb NOT NULL DEFAULT '[]',
    output jsonb,
    error jsonb,
    engine text NOT NULL CHECK(engine='mock-rules'),
    rules_version text NOT NULL,
    contract_version text NOT NULL DEFAULT 'hf-workflow/1.0',
    mapping_version text NOT NULL DEFAULT 'hf-map/1.1-test',
    started_at timestamptz NOT NULL DEFAULT now(),
    finished_at timestamptz,
    run_by uuid NOT NULL REFERENCES app_user(id),
    UNIQUE(visit_id,module,attempt),
    UNIQUE(id,visit_id,module),
    CHECK ((status='running' AND output IS NULL AND error IS NULL AND finished_at IS NULL)
       OR (status='succeeded' AND output IS NOT NULL AND error IS NULL AND finished_at IS NOT NULL)
       OR (status='failed' AND output IS NULL AND error IS NOT NULL AND finished_at IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS ix_ai_run_visit_module ON ai_module_run(visit_id,module,attempt DESC);
ALTER TABLE ai_module_run ADD COLUMN IF NOT EXISTS engine_context jsonb NOT NULL DEFAULT '{}';
CREATE UNIQUE INDEX IF NOT EXISTS ix_ai_run_inflight ON ai_module_run(visit_id,module) WHERE status='running';
CREATE TABLE IF NOT EXISTS ai_module_decision (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    visit_id uuid NOT NULL REFERENCES visit(id) ON DELETE RESTRICT,
    module text NOT NULL CHECK(module IN ('m1','m2','m3','m4')),
    source text NOT NULL CHECK(source IN ('ai','manual')),
    run_id uuid,
    effective_output jsonb NOT NULL,
    selected_prescription jsonb,
    manual_reason text,
    input_hash text NOT NULL,
    upstream_decision_ids jsonb NOT NULL DEFAULT '[]',
    decided_by uuid NOT NULL REFERENCES app_user(id),
    decided_at timestamptz NOT NULL DEFAULT now(),
    superseded_at timestamptz,
    contract_version text NOT NULL DEFAULT 'hf-workflow/1.0',
    FOREIGN KEY(run_id,visit_id,module) REFERENCES ai_module_run(id,visit_id,module),
    CHECK ((source='ai' AND run_id IS NOT NULL AND manual_reason IS NULL)
        OR (source='manual' AND run_id IS NULL AND length(btrim(manual_reason))>0)),
    CHECK ((module='m3') = (selected_prescription IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS ix_ai_decision_visit_module ON ai_module_decision(visit_id,module,decided_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS ix_ai_decision_current ON ai_module_decision(visit_id,module) WHERE superseded_at IS NULL;
CREATE TABLE IF NOT EXISTS ai_module_confirmation (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    visit_id uuid NOT NULL REFERENCES visit(id) ON DELETE RESTRICT,
    output_ref uuid NOT NULL REFERENCES ai_module_run(id) ON DELETE RESTRICT,
    alert_id text NOT NULL,
    decision text NOT NULL CHECK(decision IN ('Đồng ý','Không đồng ý')),
    reason text,
    actor uuid NOT NULL REFERENCES app_user(id),
    created_at timestamptz NOT NULL DEFAULT now(),
    superseded_at timestamptz,
    CHECK(reason IS NULL OR length(btrim(reason))>0)
);
CREATE UNIQUE INDEX IF NOT EXISTS ix_ai_confirmation_current ON ai_module_confirmation(output_ref,alert_id) WHERE superseded_at IS NULL;
CREATE INDEX IF NOT EXISTS ix_ai_confirmation_visit ON ai_module_confirmation(visit_id,created_at);
CREATE TABLE IF NOT EXISTS ai_workflow_request (
    actor uuid NOT NULL REFERENCES app_user(id),
    endpoint text NOT NULL,
    idempotency_key text NOT NULL,
    payload_hash text NOT NULL,
    receipt jsonb NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY(actor,endpoint,idempotency_key)
);
-- Explicit patient scope for read-only M4; no reuse of a doctor's assignment.
CREATE TABLE IF NOT EXISTS workflow_pharmacist_assignment (
    patient_id uuid NOT NULL REFERENCES patient(id) ON DELETE RESTRICT,
    pharmacist_user_id uuid NOT NULL REFERENCES app_user(id),
    assigned_by uuid NOT NULL REFERENCES app_user(id),
    assigned_at timestamptz NOT NULL DEFAULT now(),
    revoked_at timestamptz,
    PRIMARY KEY(patient_id,pharmacist_user_id)
);
CREATE OR REPLACE FUNCTION fn_workflow_history_guard() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    IF TG_OP='DELETE' THEN RAISE EXCEPTION 'Workflow history is immutable' USING ERRCODE='check_violation'; END IF;
    IF TG_TABLE_NAME='ai_module_run' THEN
        IF OLD.status <> 'running' OR NEW.status='running'
           OR (to_jsonb(NEW)-ARRAY['status','output','error','finished_at']) IS DISTINCT FROM
              (to_jsonb(OLD)-ARRAY['status','output','error','finished_at']) THEN
            RAISE EXCEPTION 'Finished workflow run is immutable' USING ERRCODE='check_violation';
        END IF;
    ELSIF OLD.superseded_at IS NOT NULL OR NEW.superseded_at IS NULL
       OR (to_jsonb(NEW)-'superseded_at') IS DISTINCT FROM (to_jsonb(OLD)-'superseded_at') THEN
        RAISE EXCEPTION 'Workflow decision history is immutable' USING ERRCODE='check_violation';
    END IF;
    RETURN NEW;
END $$;
DO $$ DECLARE t text; BEGIN
    FOREACH t IN ARRAY ARRAY['ai_module_run','ai_module_decision','ai_module_confirmation'] LOOP
        IF NOT EXISTS(SELECT 1 FROM pg_trigger WHERE tgname='trg_'||t||'_history') THEN
            EXECUTE format('CREATE TRIGGER %I BEFORE UPDATE OR DELETE ON %I FOR EACH ROW EXECUTE FUNCTION fn_workflow_history_guard()', 'trg_'||t||'_history', t);
        END IF;
    END LOOP;
END $$;
-- Runtime role may exist on a future hosted test DB. This file only grants local DB privileges.
DO $$ BEGIN
    IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='hfcare_mvp_runtime') THEN
        GRANT SELECT,INSERT,UPDATE ON ai_workflow,ai_module_run,ai_module_decision,ai_module_confirmation,ai_workflow_request TO hfcare_mvp_runtime;
        GRANT SELECT ON workflow_pharmacist_assignment TO hfcare_mvp_runtime;
    END IF;
END $$;
COMMIT;
