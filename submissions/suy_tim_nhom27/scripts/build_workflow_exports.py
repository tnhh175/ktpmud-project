"""Emit the additive 1.1 test mapping/schema, preserving the 1.0 files byte-for-byte."""
from copy import deepcopy
import json
from pathlib import Path
import sys

ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT))
from src.mvp.hf_registry import REGISTRY_V11
from src.mvp.workflow_schema import SCHEMA


def build():
    schema=json.loads((ROOT/'api/schemas/hf-ai-input-1.0.schema.json').read_text(encoding='utf-8'))
    schema['$id']='urn:hfcare:ai-input:1.1'
    for key,value in [('contractVersion','hf-ai-input/1.1'),('mappingVersion','hf-map/1.1-test'),('jsonSchemaId',schema['$id'])]:
        schema['properties'][key]={'const':value}
    schema['$defs']=deepcopy(SCHEMA['$defs'])
    for entry in REGISTRY_V11['inputs']:
        code=entry['aiCode']
        if not entry['transform'].startswith(('manual-','structured-')):
            continue
        if entry['type']=='object':
            value={'$ref':'#/$defs/'+('ecgValue' if code=='ECG_12_CHUYEN_DAO' else 'xrayValue')}
        else:
            source=SCHEMA['$defs']['fields']['properties'][entry['source']]['oneOf'][0]['properties']['value']
            value=deepcopy(source.get('anyOf',[source])[0])
        schema['properties']['values']['properties'][code]={'oneOf':[
          {'type':'object','properties':{'valueState':{'const':'answered'},'value':value,'unit':{'const':entry['canonicalUnit']}},'required':['valueState','value','unit'],'additionalProperties':False},
          {'type':'object','properties':{'valueState':{'enum':['unknown','unfilled','not_collected']},'value':{'type':'null'},'unit':{'const':entry['canonicalUnit']}},'required':['valueState','value','unit'],'additionalProperties':False}]}
    (ROOT/'api/hf-map-1.1.json').write_text(json.dumps(REGISTRY_V11,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    (ROOT/'api/schemas/hf-ai-input-1.1.schema.json').write_text(json.dumps(schema,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')


if __name__=='__main__':
    build()
