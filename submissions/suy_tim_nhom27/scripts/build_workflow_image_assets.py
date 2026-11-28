"""Generate a reproducible image bundle within the existing Docker context allowlist.

.dockerignore belongs outside C3's edit scope. src/mvp/** is already admitted;
the Dockerfile expands only these explicitly enumerated, repository-owned assets.
Run after changing the workflow schemas/rules/migrations/OpenAPI.
"""
from pathlib import Path
import zipfile

ROOT=Path(__file__).resolve().parents[1]
FILES=('api/hf-map-1.0.json','api/hf-map-1.1.json','api/schemas/hf-ai-input-1.1.schema.json',
       'api/schemas/hf-workflow-1.0.schema.json','api/openapi.yaml','tests/fixtures/workflow/mock_ai_rules.json',
       'database/migrations/006_workflow.sql','database/migrations/007_workflow_form_v12.sql','scripts/upgrade_workflow.py','database/migrations/008_workflow_visit_inputs.sql',
        'api/hf-map-2.0.json','api/schemas/hf-ai-input-2.0.schema.json',
        'database/migrations/009_v2_roles_queue.sql','database/migrations/010_form_v2.sql',
        'database/migrations/013_role_permissions_and_workflow.sql')


def build():
    target=ROOT/'src/mvp/workflow-image-assets.zip'
    with zipfile.ZipFile(target,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=9) as archive:
        for name in FILES:
            entry=zipfile.ZipInfo(name,date_time=(2026,11,25,0,0,0));entry.compress_type=zipfile.ZIP_DEFLATED
            entry.external_attr=0o100644<<16
            archive.writestr(entry,(ROOT/name).read_bytes(),compresslevel=9)
    print('Generated workflow image assets ('+str(len(FILES))+' files).')


if __name__=='__main__':build()
