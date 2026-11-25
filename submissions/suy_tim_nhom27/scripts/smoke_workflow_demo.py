"""Exercise TC01 and TC09 over HTTP on the assigned local synthetic demo only."""
import json
import os
from pathlib import Path
import sys
from types import SimpleNamespace

import httpx
import psycopg

ROOT=Path(__file__).resolve().parents[1]
sys.path[:0]=[str(ROOT),str(ROOT/'tests')]
from test_workflow_cases import CASES, test_c2_steps_over_real_api


def main():
    directory=Path(os.environ['TEMP'])/'hf-test-workflow-db'
    settings=json.loads((directory/'workflow-app.local.json').read_text(encoding='utf8'))
    dsn='postgresql://postgres@127.0.0.1:5450/hf_test_workflow'
    assert settings['database_url']==dsn
    with psycopg.connect(dsn) as conn:
        assert Path(conn.execute('SHOW data_directory').fetchone()[0]).resolve()==directory.resolve()
    with httpx.Client(base_url='http://127.0.0.1:8010',timeout=35) as client:
        assert client.get('/health').json()=={'status':'ok','persistence':'postgres'}
        headers={}
        for role,account in settings['accounts'].items():
            response=client.post('/api/v1/auth/login',json=account)
            assert response.status_code==200,'Synthetic login failed: '+role
            headers[role]={'Authorization':'Bearer '+response.json()['accessToken']}
        api=SimpleNamespace(client=client,headers=headers,dsn=dsn)
        for case in CASES:
            if case['id'] in ('TC01','TC09'):
                test_c2_steps_over_real_api(api,case)
                print(case['id']+': all HTTP steps passed')
        with psycopg.connect(dsn) as conn:
            conn.execute("""INSERT INTO workflow_pharmacist_assignment(patient_id,pharmacist_user_id,assigned_by)
              SELECT patient.id,p.id,a.id FROM patient CROSS JOIN app_user p CROSS JOIN app_user a
              WHERE patient.full_name LIKE 'SYNTHETIC TC%' AND p.username='pharmacist_demo' AND a.username='admin_demo'
              ON CONFLICT DO NOTHING""")
    print('Synthetic demo records retained for review; credentials omitted.')


if __name__=='__main__':main()
