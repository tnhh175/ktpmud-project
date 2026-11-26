-- v2 draft saves update only this column after inserting the scalar answer.
-- Keep existing table/column ACLs; never create or elevate the runtime role.
BEGIN;
SET LOCAL lock_timeout = '3s';
SET LOCAL statement_timeout = '15s';
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'hfcare_mvp_runtime') THEN
        IF NOT has_column_privilege('hfcare_mvp_runtime', 'public.visit_value', 'unknown_reason', 'UPDATE') THEN
            GRANT UPDATE (unknown_reason) ON TABLE public.visit_value TO hfcare_mvp_runtime;
        END IF;
    END IF;
END $$;
COMMIT;
