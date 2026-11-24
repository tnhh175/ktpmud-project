"""Synchronize MVP OpenAPI additions and changed model schemas, preserving authored documentation."""
from pathlib import Path
import sys
import yaml
from fastapi.openapi.utils import get_openapi
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT))
from src.mvp.app import create_app
from src.mvp.models import ProblemDetailsModel

def main():
    path=ROOT/'api/openapi.yaml';spec=yaml.safe_load(path.read_text(encoding='utf-8'))
    # Demo care assignment supersedes the trial care contract; remove its routes and schemas.
    spec['paths'] = {p:m for p,m in spec['paths'].items() if '/care' not in p}
    for name in ('Assignment','AssignmentList','ReasonBody','ConsultBody','TransferBody','EmergencyBody',
                 'EmergencyResult','CareDoctor','CareDoctors','CarePatient','CarePatients','EmergencyReview','EmergencyReviews'):
        spec['components']['schemas'].pop(name,None)
    app=create_app(mount_web=False)
    generated=get_openapi(title=spec['info']['title'],version=spec['info']['version'],routes=app.routes,openapi_version='3.1.0')
    spec['paths']={p:m for p,m in spec['paths'].items() if not p.startswith('/api/v1')}
    spec['components']['schemas'].update(generated.get('components',{}).get('schemas',{}))
    problem=ProblemDetailsModel.model_json_schema(ref_template='#/components/schemas/{model}')
    spec['components']['schemas'].update(problem.pop('$defs',{}))
    spec['components']['schemas']['ProblemDetailsModel']=problem
    for route,methods in generated['paths'].items():
        if not route.startswith('/api/v1/') or route=='/api/v1/health': continue
        route=route.removeprefix('/api/v1')
        for method,operation in methods.items():
            if method not in spec.get('paths',{}).get(route,{}):
                spec['paths'].setdefault(route,{})[method]=operation
    # Endpoint is a strict external JSON Schema; security is inherited from the API.
    op=spec['paths']['/visits/{visitId}/ai-input/hf/1.0']['get']
    op['responses']['200']={'description':'Confirmed HF snapshot projection. diagnostic=true may return quality blocked.','content':{'application/json':{'schema':{'$ref':'./schemas/hf-ai-input-1.0.schema.json'}}}}
    op['responses']['422']={'description':'AI_INPUT_NOT_READY, ProblemDetails with field-level quality','content':{'application/problem+json':{'schema':{'$ref':'#/components/schemas/ProblemDetailsModel'}}}}
    # Keep access semantics and problem responses alongside the typed models.
    for route,methods in spec['paths'].items():
        clinical_object = route.startswith(('/patients/{patientId}', '/visits/{visitId}'))
        care = '/care' in route
        if not (clinical_object or care or route == '/patients'):
            continue
        for method,operation in methods.items():
            if method not in ('get','post','put','patch','delete'):
                continue
            description = operation.get('description','').split('\n\nC4 access:')[0]
            if clinical_object:
                policy = 'Doctor assignment required for all clinical reads and writes; unauthorized and missing objects both return 404. Only admin manages assignments.'
            elif route.startswith('/admin/'):
                policy = 'Admin coordination only: patient identifiers, doctor names and assignment metadata; no clinical data.'
            else:
                policy = 'Doctor only. GET filters assignments in SQL before count/pagination; POST assigns the creator atomically.'
            operation['description'] = description + '\n\nC4 access: ' + policy
            codes = {401:'Authentication required',403:'Role forbidden'}
            if clinical_object or '{patientId}' in route:
                codes[404] = 'Resource not found or no patient access (same response)'
            if method == 'post' and route.endswith('/care-assignments'):
                codes[409] = 'CARE_ASSIGNMENT_CONFLICT: doctor already assigned'
            for code,detail in codes.items():
                operation['responses'].setdefault(str(code), {'description':detail,'content':{'application/problem+json':{'schema':{'$ref':'#/components/schemas/ProblemDetailsModel'}}}})
    path.write_text(yaml.safe_dump(spec,allow_unicode=True,sort_keys=False),encoding='utf-8')
if __name__=='__main__':main()
