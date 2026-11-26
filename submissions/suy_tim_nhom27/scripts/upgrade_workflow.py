"""Explicit SQL upgrade/publish; requires an operator-supplied DSN. Never auto-runs."""
import argparse
from pathlib import Path
import psycopg

ROOT = Path(__file__).resolve().parents[1]


def upgrade(dsn, *, publish=False):
    with psycopg.connect(dsn, autocommit=True) as conn:
        has_roles = conn.execute("SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='visit' AND column_name='assigned_doctor_id')").fetchone()[0]
        has_v2 = conn.execute("SELECT EXISTS(SELECT 1 FROM form_version WHERE version_label='v2.0')").fetchone()[0]
        # Separate statements/transactions for PostgreSQL enum visibility.
        source = (ROOT/'database/migrations/006_workflow.sql').read_text(encoding='utf-8')
        enum, body = source.split('\nBEGIN;', 1)
        for statement in enum.splitlines():
            if statement.startswith('ALTER TYPE '):
                conn.execute(statement)
        conn.execute('BEGIN;' + body)
        conn.execute((ROOT/'database/migrations/007_workflow_form_v12.sql').read_text(encoding='utf-8'))
        conn.execute((ROOT/'database/migrations/008_workflow_visit_inputs.sql').read_text(encoding='utf-8'))
        # Replaying the legacy upgrade must retain guards installed by v2.
        if has_roles:
            source = (ROOT/'database/migrations/009_v2_roles_queue.sql').read_text(encoding='utf-8')
            enum, body = source.split('\nBEGIN;', 1)
            for statement in enum.splitlines():
                if statement.startswith('ALTER TYPE '):
                    conn.execute(statement)
            conn.execute('BEGIN;' + body)
        if has_v2:
            conn.execute((ROOT/'database/migrations/010_form_v2.sql').read_text(encoding='utf-8'))
        if publish:
            with conn.transaction():
                row = conn.execute("SELECT id,status,form_template_id FROM form_version WHERE version_label='v1.2' FOR UPDATE").fetchone()
                if row[1]=='draft':
                    conn.execute("UPDATE form_version SET status='retired' WHERE form_template_id=%s AND status='published'",(row[2],))
                    conn.execute("UPDATE form_version SET status='published',published_at=now(),published_by=(SELECT id FROM app_user WHERE username='admin_demo'),row_version=row_version+1 WHERE id=%s",(row[0],))


if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--dsn',required=True);p.add_argument('--publish-v12',action='store_true')
    args=p.parse_args();upgrade(args.dsn,publish=args.publish_v12)
    print('Workflow migration applied; v1.2 '+('published' if args.publish_v12 else 'draft')+'.')
