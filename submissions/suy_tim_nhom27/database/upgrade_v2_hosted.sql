-- Explicit operator command only, after backup and review (C13).
-- Prerequisite: upgrade_workflow_hosted.sql (006--008) has already succeeded.
\set ON_ERROR_STOP on
\ir migrations/009_v2_roles_queue.sql
\ir migrations/010_form_v2.sql
