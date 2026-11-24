"""Emit the Draft 2020-12 contract from the versioned mapping registry."""
import json
from pathlib import Path
import sys
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT))
from src.mvp.hf_registry import REGISTRY, MODULES

def obj(properties,required=None):return {'type':'object','properties':properties,'required':list(properties) if required is None else required,'additionalProperties':False}
def arr(item):return {'type':'array','items':item}
def nullable(schema):return {'anyOf':[schema,{'type':'null'}]}
string={'type':'string'};number={'type':'number'};integer={'type':'integer'};boolean={'type':'boolean'}
time={'type':'string','format':'date-time'}
token={'type':'string','pattern':'^[pembla]_[0-9a-f]{64}$'}
def wrapper(entry):
    value={'type':entry['type']}
    if entry.get('enum') is not None:value['enum']=entry['enum']
    if entry['aiCode'] in ('MA_BN','MA_LK'):value=token
    base={'unit':{'const':entry['canonicalUnit']}}
    return {'oneOf':[obj({**base,'valueState':{'const':'answered'},'value':value}),obj({**base,'valueState':{'enum':['unknown','unfilled','not_collected','not_applicable']},'value':{'type':'null'}})]}

def schema():
    scalar={e['aiCode']:wrapper(e) for e in REGISTRY['inputs'] if e['type']!='array' and e['transform']!='omit-privacy-v1'}
    bp=obj({'measurementId':token,'position':{'enum':['supine','sitting','standing']},'minuteAfter':nullable(integer),'measuredAt':time,'values':obj({'HA_TAM_THU':integer,'HA_TAM_TRUONG':integer,'TAN_SO_TIM':nullable(integer)})})
    lab_fields={'observationId':token,'fieldCode':string,'aiCode':nullable({'enum':[e['aiCode'] for e in REGISTRY['inputs'] if e['transform']=='lab-series-v1']}),'valueText':{'type':'null'},'unit':nullable(string),'measuredAt':time}
    lab={'oneOf':[obj({**lab_fields,'valueState':{'const':'answered'},'valueNum':number}),obj({**lab_fields,'valueState':{'const':'not_collected'},'valueNum':{'type':'null'}})]}
    med=obj({'recordId':token,'code':nullable({'type':'string','pattern':'^[A-Z][0-9]{2}[A-Z]{2}[0-9]{2}$'}),'system':{'const':'ATC'},'version':string,'display':nullable(string),'hospitalVerified':{'const':False},'dose':nullable(number),'unit':nullable(string),'status':{'const':'active'}})
    allergy=obj({'recordId':token,'code':nullable(string),'system':{'const':'ATC'},'version':string,'kind':{'enum':['allergy','adr','intolerance']},'category':{'enum':['therapeutic_drug','contrast_media','other']},'hospitalVerified':{'const':False}})
    diagnosis=obj({'code':{'type':'string','pattern':r'^[A-Z][0-9]{2}(\.[A-Z0-9]{1,4})?$'},'display':nullable(string),'role':{'enum':['primary','secondary']},'system':{'const':'ICD-10'},'version':string,'hospitalVerified':{'const':False}})
    issue=obj({'issueCode':string,'path':string,'fieldCode':string,'severity':{'const':'error'},'module':{'enum':list(MODULES)},'messageVi':string})
    module=obj({'module':{'enum':list(MODULES)},'status':{'enum':['ready','blocked']},'issueCount':{'type':'integer','minimum':0}})
    arrays={}
    for e in REGISTRY['inputs']:
        if e['type']!='array':continue
        item=med if e['source']=='medications' else {'type':'string','pattern':r'^[A-Z][0-9]{2}(\.[A-Z0-9]{1,4})?$' if e['source']=='diagnoses' else r'^[A-Z][0-9]{2}[A-Z]{2}[0-9]{2}$'}
        arrays[e['aiCode']]={'oneOf':[obj({'valueState':{'const':'answered'},'items':arr(item),'listState':{'const':'known'}}),obj({'valueState':{'const':'answered'},'items':{**arr(item),'maxItems':0},'listState':{'const':'none'}}),obj({'valueState':{'const':'unknown'},'items':{**arr(item),'maxItems':0},'listState':{'const':'unknown'}})]}
    result=obj({'contractVersion':{'const':'hf-ai-input/1.0'},'variableTableVersion':{'const':'3.0'},'mappingVersion':{'const':'hf-map/1.0'},'jsonSchemaId':{'const':'urn:hfcare:ai-input:1.0'},'profile':{'const':'HF'},'form':obj({'versionId':{'type':'string','format':'uuid'},'definitionHash':{'type':'string','pattern':'^sha256:[0-9a-f]{64}$'}}),'revision':obj({'number':{'type':'integer','minimum':1},'status':{'const':'confirmed'},'snapshotHash':{'type':'string','pattern':'^sha256:[0-9a-f]{64}$'}}),'export':obj({'id':{'type':'string','format':'uuid'},'exportedAt':time}),'privacy':obj({'profile':{'const':'ai-pseudonym-v1'},'keyVersion':{'type':'string','minLength':1}}),'values':obj(scalar),'arrays':obj(arrays),'observations':obj({'bloodPressure':arr(bp),'labs':arr(lab),'allergyDetails':arr(allergy),'diagnoses':arr(diagnosis)}),'quality':obj({'status':{'enum':['ready','blocked']},'requestedModule':nullable({'enum':list(MODULES)}),'issues':arr(issue),'modules':arr(module)})})
    return {'$schema':'https://json-schema.org/draft/2020-12/schema','$id':'urn:hfcare:ai-input:1.0',**result}

if __name__=='__main__':
    dest=ROOT/'api/schemas';dest.mkdir(exist_ok=True)
    (dest/'hf-ai-input-1.0.schema.json').write_text(json.dumps(schema(),ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    (ROOT/'api/hf-map-1.0.json').write_text(json.dumps(REGISTRY,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
