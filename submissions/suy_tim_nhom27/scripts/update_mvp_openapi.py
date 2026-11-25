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
    spec['paths']['/visits/{visitId}/ai-input/hf/1.1']['get']['responses']['200']={'description':'Frozen v1.2 projection; diagnostic mode preserves quality blockers.','content':{'application/json':{'schema':{'$ref':'./schemas/hf-ai-input-1.1.schema.json'}}}}
    ext='./schemas/hf-workflow-1.0.schema.json#/$defs/'
    workflow_responses={'getVisitWorkflow':'workflowState','getWorkflowRun':'moduleRun','getWorkflowDecision':'effectiveDecision'}
    receipts={
      'listWorkflowRuns':{'items':{'type':'array','items':{'$ref':ext+'moduleRun'}}},
      'getWorkflowFields':{'module':{'$ref':ext+'module'},'rowVersion':{'type':'integer'},'fields':{'$ref':ext+'fieldReadFields'},'fieldMetadata':{'type':'object','additionalProperties':{'$ref':ext+'fieldMetadata'}},'observations':{'type':'array','items':{'type':'object'}}},
      'saveWorkflowFields':{'rowVersion':{'type':'integer'},'module':{'$ref':ext+'module'},'state':{'type':'string'},'invalidatedModules':{'type':'array','items':{'$ref':ext+'module'}},'unknownFieldCodes':{'type':'array','items':{'type':'string'}}},
      'runWorkflowModule':{'rowVersion':{'type':'integer'},'module':{'$ref':ext+'module'},'state':{'const':'ran'},'runId':{'type':'string','format':'uuid'},'attempt':{'type':'integer'},'engine':{'const':'mock-rules'},'rulesVersion':{'type':'string'}},
      'decideWorkflowModule':{'rowVersion':{'type':'integer'},'module':{'$ref':ext+'module'},'state':{'const':'accepted'},'decisionId':{'type':'string','format':'uuid'},'decisionSource':{'enum':['ai','manual']},'nextModule':{'anyOf':[{'$ref':ext+'module'},{'type':'null'}]},'autoRunModules':{'type':'array','maxItems':0}},
      'confirmWorkflowM4':{'rowVersion':{'type':'integer'},'module':{'const':'m4'},'outputRef':{'type':'string','format':'uuid'},'pendingSeriousAlertIds':{'type':'array','items':{'type':'string'}},'canFinish':{'type':'boolean'}},
      'finishVisitWorkflow':{'rowVersion':{'type':'integer'},'completed':{'const':True},'completedAt':{'type':'string','format':'date-time'}}}
    for route,methods in spec['paths'].items():
        if '/workflow' not in route:continue
        for method,op in methods.items():
            if method not in ('get','put','post'):continue
            op['description']='Synthetic mock only; doctor assignment required. Pharmacists may only GET workflow?module=m4 with explicit patient scope. Workflow writes require body rowVersion; optional If-Match must agree. POST Idempotency-Key replays the same payload; changed payload returns 409. No automatic downstream runs.'
            name=op.get('operationId')
            if name=='getVisitWorkflow':
                op['description']+=' With module=m4, assigned doctors and scoped pharmacists receive the effective M4 read projection, including saved confirmations. Omit module for the full doctor workflow state.'
            elif name in ('getWorkflowRun','listWorkflowRuns'):
                op['description']+=' Run resources preserve the original immutable engine output. Read workflow?module=m4 for saved M4 confirmations.'
            elif name=='getWorkflowFields':
                op['description']+=' Each existing answer includes read-only ownerModule; fieldMetadata provides ownerModule for all allowed fields, including absent answers. Remove answer ownerModule before PUT. Only the owner path accepts writes (422 WORKFLOW_FIELD_OWNER_MISMATCH otherwise); selected_medications is written only by M3 decision.'
            definition=workflow_responses.get(name)
            if definition:
                schema={'$ref':ext+definition}
                if name=='getVisitWorkflow':
                    schema={'oneOf':[schema,{'$ref':ext+'m4ReadView'}]}
                op['responses']['200']={'description':'Workflow receipt or immutable resource','content':{'application/json':{'schema':schema}}}
            elif name in receipts:
                props=receipts[name]
                op['responses']['200']={'description':'Workflow receipt','content':{'application/json':{'schema':{'type':'object','properties':props,'required':list(props),'additionalProperties':False}}}}
            for code in ('401','403','404')+ (('409','422','503') if method!='get' else ()) + (('504',) if name=='runWorkflowModule' else ()):
                op['responses'][code]={'description':'ProblemDetails; see C1 contract error codes.','content':{'application/problem+json':{'schema':{'$ref':'#/components/schemas/ProblemDetailsModel'}}}}
            if name in ('decideWorkflowModule','confirmWorkflowM4'):
                op['requestBody']['content']['application/json']['schema']={'$ref':ext+('decisionRequest' if name=='decideWorkflowModule' else 'confirmationRequest')}
    fields_schema=spec['components']['schemas']['WorkflowFieldsRequest']
    fields_schema['properties']['fields']={'$ref':ext+'fields'}
    for name in ('WorkflowFieldsRequest','WorkflowRunRequest','WorkflowFinishRequest'):
        required=spec['components']['schemas'][name].setdefault('required',[])
        if 'rowVersion' not in required:required.append('rowVersion')
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
                if '/workflow' in route:
                    policy='Assigned doctor only; scoped pharmacist GET workflow?module=m4 returns only the M4 read view; no pharmacist writes or M1-M3 access.'
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
