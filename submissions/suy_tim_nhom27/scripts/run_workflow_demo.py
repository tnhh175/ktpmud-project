"""Local demo entry point; fixed loopback/8010/5450, private settings outside Git."""
import json
import os
from pathlib import Path
import sys

ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT))


def main():
    config=Path(os.environ['TEMP'])/'hf-test-workflow-db/workflow-app.local.json'
    settings=json.loads(config.read_text(encoding='utf-8'))
    expected='postgresql://postgres@127.0.0.1:5450/hf_test_workflow'
    if settings['database_url']!=expected:
        raise SystemExit('Refuse unexpected demo database')
    os.environ.setdefault("MVP_DATA_DIR", str(config.parent))
    os.environ.update(MVP_DATABASE_URL=expected,MVP_AUTH_SECRET=settings['auth_secret'],
       HF_AI_HMAC_SECRET=settings['hmac_secret'],HF_AI_KEY_VERSION='workflow-synthetic-1',MVP_HOSTED='0')
    import uvicorn
    from src.mvp.app import create_app
    uvicorn.run(create_app(database_url=expected,auth_secret=settings['auth_secret']),host='127.0.0.1',port=8010)


if __name__=='__main__':
    main()
