-- C16: role grants, encrypted temporary credentials and M3 decision rationale.
BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.role_permission (
    role text NOT NULL CHECK (role IN ('admin', 'doctor', 'nurse')),
    permission_code text NOT NULL,
    granted boolean NOT NULL,
    PRIMARY KEY (role, permission_code),
    CHECK (role <> 'admin' OR permission_code NOT IN ('accounts.manage', 'permissions.manage') OR granted)
);

INSERT INTO public.role_permission (role, permission_code, granted) VALUES
    ('admin', 'accounts.manage', true),
    ('doctor', 'accounts.manage', false),
    ('nurse', 'accounts.manage', false),
    ('admin', 'permissions.manage', true),
    ('doctor', 'permissions.manage', false),
    ('nurse', 'permissions.manage', false),
    ('admin', 'credentials.reveal', true),
    ('doctor', 'credentials.reveal', false),
    ('nurse', 'credentials.reveal', false),
    ('admin', 'forms.manage', true),
    ('doctor', 'forms.manage', false),
    ('nurse', 'forms.manage', false),
    ('admin', 'audit.read', true),
    ('doctor', 'audit.read', false),
    ('nurse', 'audit.read', false),
    ('admin', 'records.manage', true),
    ('doctor', 'records.manage', false),
    ('nurse', 'records.manage', false),
    ('admin', 'care.manage', true),
    ('doctor', 'care.manage', false),
    ('nurse', 'care.manage', false),
    ('admin', 'patients.read', false),
    ('doctor', 'patients.read', true),
    ('nurse', 'patients.read', true),
    ('admin', 'patients.create', false),
    ('doctor', 'patients.create', true),
    ('nurse', 'patients.create', true),
    ('admin', 'patients.update', false),
    ('doctor', 'patients.update', true),
    ('nurse', 'patients.update', true),
    ('admin', 'records.requests.read', false),
    ('doctor', 'records.requests.read', true),
    ('nurse', 'records.requests.read', true),
    ('admin', 'records.requests.write', false),
    ('doctor', 'records.requests.write', false),
    ('nurse', 'records.requests.write', true),
    ('admin', 'visits.create', false),
    ('doctor', 'visits.create', false),
    ('nurse', 'visits.create', true),
    ('admin', 'visits.mine', false),
    ('doctor', 'visits.mine', true),
    ('nurse', 'visits.mine', false),
    ('admin', 'visits.intake_list', false),
    ('doctor', 'visits.intake_list', false),
    ('nurse', 'visits.intake_list', true),
    ('admin', 'visits.read', false),
    ('doctor', 'visits.read', true),
    ('nurse', 'visits.read', true),
    ('admin', 'visits.intake', false),
    ('doctor', 'visits.intake', false),
    ('nurse', 'visits.intake', true),
    ('admin', 'visits.clinical', false),
    ('doctor', 'visits.clinical', true),
    ('nurse', 'visits.clinical', false),
    ('admin', 'visits.submit', false),
    ('doctor', 'visits.submit', false),
    ('nurse', 'visits.submit', true),
    ('admin', 'queue.read', false),
    ('doctor', 'queue.read', true),
    ('nurse', 'queue.read', false),
    ('admin', 'visits.claim', false),
    ('doctor', 'visits.claim', true),
    ('nurse', 'visits.claim', false),
    ('admin', 'visits.review', false),
    ('doctor', 'visits.review', true),
    ('nurse', 'visits.review', false),
    ('admin', 'visits.confirm', false),
    ('doctor', 'visits.confirm', true),
    ('nurse', 'visits.confirm', false),
    ('admin', 'visits.revise', false),
    ('doctor', 'visits.revise', true),
    ('nurse', 'visits.revise', false),
    ('admin', 'visits.ai_export', false),
    ('doctor', 'visits.ai_export', true),
    ('nurse', 'visits.ai_export', false),
    ('admin', 'workflow.read', false),
    ('doctor', 'workflow.read', true),
    ('nurse', 'workflow.read', false),
    ('admin', 'workflow.edit', false),
    ('doctor', 'workflow.edit', true),
    ('nurse', 'workflow.edit', false),
    ('admin', 'workflow.run', false),
    ('doctor', 'workflow.run', true),
    ('nurse', 'workflow.run', false),
    ('admin', 'workflow.decide', false),
    ('doctor', 'workflow.decide', true),
    ('nurse', 'workflow.decide', false)
ON CONFLICT (role, permission_code) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.temporary_credential (
    user_id uuid PRIMARY KEY REFERENCES public.app_user(id) ON DELETE CASCADE,
    ciphertext bytea,
    expires_at timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_temporary_credential_expiry ON public.temporary_credential (expires_at);

ALTER TABLE IF EXISTS public.ai_module_decision
    ADD COLUMN IF NOT EXISTS unselected_reasons jsonb NOT NULL DEFAULT '[]'::jsonb;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'hfcare_mvp_runtime') THEN
        GRANT SELECT, UPDATE (granted) ON public.role_permission TO hfcare_mvp_runtime;
        GRANT SELECT, INSERT, UPDATE, DELETE ON public.temporary_credential TO hfcare_mvp_runtime;
        IF to_regclass('public.ai_module_decision') IS NOT NULL THEN
            GRANT SELECT (unselected_reasons), INSERT (unselected_reasons)
                ON public.ai_module_decision TO hfcare_mvp_runtime;
        END IF;
    END IF;
END $$;

COMMIT;
