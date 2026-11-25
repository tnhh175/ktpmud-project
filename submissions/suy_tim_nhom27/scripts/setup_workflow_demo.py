"""Bootstrap only the local synthetic 5450 demo; write credentials outside Git."""
import json
import os
from pathlib import Path
import secrets
import sys

import psycopg

ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT))
from src.mvp.auth import hash_password
from upgrade_workflow import upgrade

DSN='postgresql://postgres@127.0.0.1:5450/hf_test_workflow'
PRIVATE_LOGIN=Path('D:/1.TNHH/project/ktpmud/.claude/hf-test-workflow-login.local.txt')


def setup():
    directory=Path(os.environ['TEMP'])/'hf-test-workflow-db'
    config=directory/'workflow-app.local.json'
    with psycopg.connect('postgresql://postgres@127.0.0.1:5450/postgres',autocommit=True) as conn:
        data=Path(conn.execute('SHOW data_directory').fetchone()[0]).resolve()
        if data!=directory.resolve():
            raise SystemExit('Refuse PostgreSQL outside the assigned temporary demo directory')
        if not conn.execute("SELECT 1 FROM pg_database WHERE datname='hf_test_workflow'").fetchone():
            conn.execute('CREATE DATABASE hf_test_workflow')
    with psycopg.connect(DSN,autocommit=True) as conn:
        if not conn.execute("SELECT to_regclass('public.app_user')").fetchone()[0]:
            for f in ('schema.sql','seed.sql','migrations/005_visit_amendment_reopen.sql'):
                conn.execute((ROOT/'database'/f).read_text(encoding='utf-8'))
    upgrade(DSN,publish=True)
    if not config.exists():
        accounts={role:{'username':role+'_demo','password':secrets.token_urlsafe(28)} for role in ('admin','doctor','pharmacist')}
        private={'database_url':DSN,'auth_secret':secrets.token_hex(32),'hmac_secret':secrets.token_hex(32),'accounts':accounts}
        with psycopg.connect(DSN) as conn:
            for role,account in accounts.items():
                conn.execute('''INSERT INTO app_user(username,password_hash,full_name,role) VALUES(%s,%s,%s,%s)
                  ON CONFLICT(username) DO UPDATE SET password_hash=EXCLUDED.password_hash''',
                  (account['username'],hash_password(account['password']),'SYNTHETIC '+role,role))
        config.write_text(json.dumps(private,ensure_ascii=False),encoding='utf-8')
        PRIVATE_LOGIN.parent.mkdir(parents=True,exist_ok=True)
        PRIVATE_LOGIN.write_text('Local synthetic workflow only: http://127.0.0.1:8010\n'+
             '\n'.join(role+': '+a['username']+' / '+a['password'] for role,a in accounts.items())+'\n',encoding='utf-8')
    print('Local synthetic demo initialized; v1.2 published. Credentials saved to the authorized private file.')


if __name__=='__main__':
    setup()
