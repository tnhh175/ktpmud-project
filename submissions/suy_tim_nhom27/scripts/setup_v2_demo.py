"""Explicit local synthetic C10 seed; credentials remain outside the repository."""
import argparse
from datetime import date
import json
import os
from pathlib import Path
import secrets
import sys
from urllib.parse import urlparse

import psycopg
from psycopg.rows import dict_row

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT))
from src.mvp.auth import hash_password
from src.mvp.audit import record_audit_log


def seed(dsn=None):
    directory = Path(os.environ['TEMP'])/'hf-test-workflow-db'
    dsn = dsn or 'postgresql://postgres@127.0.0.1:5450/hf_test_workflow'
    parsed = urlparse(dsn)
    if parsed.hostname!='127.0.0.1' or parsed.port not in (5450,5451):
        raise SystemExit('Only local C10 PostgreSQL 5450/5451 is permitted')
    testing = parsed.port==5451
    if testing and not parsed.path.startswith('/c10_seed_'):
        raise SystemExit('Test seed requires a dedicated c10_seed_ database')
    local_file = Path(os.environ['TEMP'])/'hf-c10-seed-login.local.json' if testing else directory/'v2-login.local.json'
    config = json.loads(local_file.read_text(encoding='utf-8')) if local_file.exists() else {}
    with psycopg.connect(dsn,autocommit=True,row_factory=dict_row) as conn:
        if not testing and Path(conn.execute('SHOW data_directory').fetchone()['data_directory']).resolve()!=directory.resolve():
            raise SystemExit('Refuse a database outside the assigned local demo directory')
        for filename in ('009_v2_roles_queue.sql','010_form_v2.sql'):
            sql = (ROOT/'database/migrations'/filename).read_text(encoding='utf-8')
            enums,body = sql.split('\nBEGIN;',1)
            for line in enums.splitlines():
                if line.startswith('ALTER TYPE '):conn.execute(line)
            conn.execute('BEGIN;'+body)
        with conn.transaction():
            for username,role in [('nurse01','nurse'),('nurse02','nurse'),('doctor01','doctor'),('doctor02','doctor')]:
                existing = conn.execute('SELECT id,role FROM app_user WHERE username=%s',(username,)).fetchone()
                if existing:
                    if existing['role']!=role:raise SystemExit('Demo username already has another role')
                    continue  # Keep existing credentials and sessions.
                password = secrets.token_urlsafe(28)
                conn.execute('INSERT INTO app_user(username,password_hash,full_name,role) VALUES(%s,%s,%s,%s)',
                             (username,hash_password(password),'SYNTHETIC '+username,role))
                config[username] = dict(username=username,password=password,role=role)
            actor = conn.execute("SELECT id FROM app_user WHERE username='nurse01'").fetchone()['id']
            form = conn.execute("SELECT id FROM form_version WHERE version_label='v2.0' AND status='published'").fetchone()['id']
            conn.execute("SELECT pg_advisory_xact_lock(hashtext('patient_code_seq'))")
            for i in range(1,4):
                visit_code = f'LK-C10-SYNTHETIC-{i:02}'
                if conn.execute('SELECT 1 FROM visit WHERE visit_code=%s',(visit_code,)).fetchone():continue
                number = conn.execute("SELECT COALESCE(max(substring(patient_code,4)::int),0)+1 AS n FROM patient WHERE patient_code ~ '^BN-[0-9]{5}$'").fetchone()['n']
                pt = conn.execute("""INSERT INTO patient(patient_code,external_patient_code,full_name,sex,birth_date,created_by)
                    VALUES(%s,%s,%s,'female',%s,%s) RETURNING id""",
                    (f'BN-{number:05}',f'C10-SYNTHETIC-{i:02}',f'SYNTHETIC C10 waiting {i}',date(1955+i,1,1),actor)).fetchone()['id']
                vid = conn.execute("""INSERT INTO visit(visit_code,patient_id,form_version_id,visit_date,status,created_by,submitted_by,submitted_at)
                   VALUES(%s,%s,%s,now(),'waiting',%s,%s,now()) RETURNING id""",(visit_code,pt,form,actor,actor)).fetchone()['id']
                for code,value in [('chieu_cao_cm',160+i),('can_nang_kg',60+i),('huyet_ap_tam_thu',120+i),('huyet_ap_tam_truong',70),('mach',75)]:
                    conn.execute("INSERT INTO visit_value(visit_id,field_definition_id,value_state,value_num) SELECT %s,id,'answered',%s FROM field_definition WHERE code=%s",(vid,value,code))
                record_audit_log(conn,actor_user_id=actor,action='visit_create',entity_type='visit',entity_id=vid,detail={'event':'synthetic_c10_seed'})
                record_audit_log(conn,actor_user_id=actor,action='visit_submit',entity_type='visit',entity_id=vid,detail={'from':'intake','to':'waiting','event':'synthetic_c10_seed'})
        remaining = conn.execute('SELECT count(*) AS n FROM patient WHERE birth_date IS NULL').fetchone()['n']
    local_file.write_text(json.dumps(config,ensure_ascii=False,indent=2),encoding='utf-8')
    print(f'C10 synthetic seed ready; preserved existing credentials; birth_date unresolved: {remaining}.')
    print('New credentials saved locally: '+str(local_file))


if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--test-dsn')
    seed(parser.parse_args().test_dsn)
