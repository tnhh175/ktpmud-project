-- Explicit v2 upgrade (A13): patient record status, lock/archive requests, and password reset requests.
-- Idempotent: safe to run repeatedly with psql/autocommit. Enum additions must commit before BEGIN.
ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'password_reset_request';
ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'password_reset_resolve';
ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'password_reset_reject';
ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'patient_record_request_create';
ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'patient_record_request_cancel';
ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'patient_record_request_approve';
ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'patient_record_request_reject';
ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'patient_record_status_change';

BEGIN;
SET LOCAL lock_timeout = '10s';
SELECT pg_advisory_xact_lock(hashtext('hf-v2-record-and-password-requests'));

-- 1. Soft record lifecycle columns on patient (never hard-delete patients or visits)
ALTER TABLE patient
  ADD COLUMN IF NOT EXISTS record_status varchar(16) NOT NULL DEFAULT 'active';
ALTER TABLE patient
  ADD COLUMN IF NOT EXISTS record_status_updated_at timestamptz;
ALTER TABLE patient
  ADD COLUMN IF NOT EXISTS record_status_updated_by uuid REFERENCES app_user(id) ON DELETE RESTRICT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'chk_patient_record_status'
      AND conrelid = 'public.patient'::regclass
  ) THEN
    ALTER TABLE patient
      ADD CONSTRAINT chk_patient_record_status
      CHECK (record_status IN ('active', 'locked', 'archived'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS ix_patient_record_status
  ON patient (record_status, updated_at DESC);

-- 2. Nurse lock/archive (soft-delete) requests on patient records (UI-03 / UI-18)
CREATE TABLE IF NOT EXISTS patient_record_request (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patient(id) ON DELETE RESTRICT,
  request_type varchar(16) NOT NULL,
  reason varchar(500) NOT NULL,
  status varchar(16) NOT NULL DEFAULT 'pending',
  requested_by uuid NOT NULL REFERENCES app_user(id) ON DELETE RESTRICT,
  requested_at timestamptz NOT NULL DEFAULT now(),
  handled_by uuid REFERENCES app_user(id) ON DELETE RESTRICT,
  handled_at timestamptz,
  admin_note varchar(500),
  CONSTRAINT pk_patient_record_request PRIMARY KEY (id),
  CONSTRAINT chk_patient_record_req_type CHECK (request_type IN ('lock', 'delete')),
  CONSTRAINT chk_patient_record_req_status CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  CONSTRAINT chk_patient_record_req_reason CHECK (length(trim(reason)) >= 3),
  CONSTRAINT chk_patient_record_req_handled CHECK (
    (status = 'pending' AND handled_by IS NULL AND handled_at IS NULL)
    OR (status IN ('approved', 'rejected') AND handled_by IS NOT NULL AND handled_at IS NOT NULL)
    OR (status = 'cancelled' AND handled_at IS NOT NULL)
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_patient_record_request_pending_type
  ON patient_record_request (patient_id, request_type)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS ix_patient_record_request_patient_time
  ON patient_record_request (patient_id, requested_at DESC);

CREATE INDEX IF NOT EXISTS ix_patient_record_request_status_time
  ON patient_record_request (status, requested_at DESC);

-- 3. Password reset requests submitted from login screen and handled by Admin (UI-02)
CREATE TABLE IF NOT EXISTS password_reset_request (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  username_entered varchar(64) NOT NULL,
  username_normalized varchar(64) NOT NULL,
  user_id uuid REFERENCES app_user(id) ON DELETE SET NULL,
  note varchar(300),
  status varchar(16) NOT NULL DEFAULT 'pending',
  requested_at timestamptz NOT NULL DEFAULT now(),
  last_requested_at timestamptz NOT NULL DEFAULT now(),
  request_count integer NOT NULL DEFAULT 1,
  handled_by uuid REFERENCES app_user(id) ON DELETE RESTRICT,
  handled_at timestamptz,
  admin_note varchar(500),
  client_ip_hash varchar(64),
  CONSTRAINT pk_password_reset_request PRIMARY KEY (id),
  CONSTRAINT chk_pw_reset_req_username CHECK (length(trim(username_entered)) >= 1),
  CONSTRAINT chk_pw_reset_req_status CHECK (status IN ('pending', 'resolved', 'rejected')),
  CONSTRAINT chk_pw_reset_req_count CHECK (request_count >= 1),
  CONSTRAINT chk_pw_reset_req_handled CHECK (
    (status = 'pending' AND handled_by IS NULL AND handled_at IS NULL)
    OR (status IN ('resolved', 'rejected') AND handled_by IS NOT NULL AND handled_at IS NOT NULL)
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_password_reset_request_pending_user
  ON password_reset_request (username_normalized)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS ix_password_reset_request_status_time
  ON password_reset_request (status, last_requested_at DESC);

CREATE INDEX IF NOT EXISTS ix_password_reset_request_ip_time
  ON password_reset_request (client_ip_hash, last_requested_at DESC)
  WHERE client_ip_hash IS NOT NULL;

CREATE INDEX IF NOT EXISTS ix_password_reset_request_user_time
  ON password_reset_request (username_normalized, last_requested_at DESC);

-- 4. Least-privilege runtime grants (matching 006 / 011; never elevate or create the role)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'hfcare_mvp_runtime') THEN
    GRANT SELECT, INSERT, UPDATE ON TABLE public.patient_record_request TO hfcare_mvp_runtime;
    GRANT SELECT, INSERT, UPDATE ON TABLE public.password_reset_request TO hfcare_mvp_runtime;
    IF NOT has_column_privilege('hfcare_mvp_runtime', 'public.patient', 'record_status', 'UPDATE') THEN
      GRANT SELECT (record_status, record_status_updated_at, record_status_updated_by),
            UPDATE (record_status, record_status_updated_at, record_status_updated_by)
        ON TABLE public.patient TO hfcare_mvp_runtime;
    END IF;
  END IF;
END $$;

COMMIT;
