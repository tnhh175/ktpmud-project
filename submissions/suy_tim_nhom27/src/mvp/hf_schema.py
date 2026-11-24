"""Runtime assertions for the deliberately small generated JSON Schema vocabulary.

The emitted schema is also tested independently with jsonschema Draft202012Validator.
No optional runtime package is required by the hosted MVP.
"""
from datetime import datetime
import json
import math
from pathlib import Path
import re
from uuid import UUID

SCHEMA=json.loads((Path(__file__).resolve().parents[2]/'api/schemas/hf-ai-input-1.0.schema.json').read_text(encoding='utf-8'))

def matches(value,schema):
    if 'anyOf' in schema and not any(matches(value,s) for s in schema['anyOf']):return False
    if 'oneOf' in schema and sum(matches(value,s) for s in schema['oneOf'])!=1:return False
    if 'const' in schema and (type(value)!=type(schema['const']) or value!=schema['const']):return False
    if 'enum' in schema and not any(type(value)==type(v) and value==v for v in schema['enum']):return False
    kind=schema.get('type')
    checks={'object':lambda:type(value) is dict,'array':lambda:type(value) is list,'string':lambda:type(value) is str,'integer':lambda:type(value) is int,'number':lambda:type(value) in (int,float) and math.isfinite(value),'boolean':lambda:type(value) is bool,'null':lambda:value is None}
    if kind and not checks[kind]():return False
    if type(value) is dict:
        props=schema.get('properties',{})
        if any(k not in value for k in schema.get('required',[])):return False
        if schema.get('additionalProperties') is False and any(k not in props for k in value):return False
        if any(k in props and not matches(v,props[k]) for k,v in value.items()):return False
    if type(value) is list and any(not matches(v,schema.get('items',{})) for v in value):return False
    if type(value) is list and 'maxItems' in schema and len(value)>schema['maxItems']:return False
    if type(value) is str:
        if len(value)<schema.get('minLength',0):return False
        if schema.get('pattern') and not re.search(schema['pattern'],value):return False
        try:
            if schema.get('format')=='uuid':UUID(value)
            if schema.get('format')=='date-time':
                parsed=datetime.fromisoformat(value.replace('Z','+00:00'))
                if parsed.utcoffset() is None:return False
        except ValueError:return False
    if type(value) in (int,float) and ('minimum' in schema and value<schema['minimum']):return False
    return True

def validate_export(payload):
    if not matches(payload,SCHEMA):raise ValueError('HF export violates hf-ai-input/1.0 schema')
    for name,series in payload['observations'].items():
        ids=[r.get('measurementId',r.get('observationId',r.get('recordId'))) for r in series]
        ids=[x for x in ids if x is not None]
        if len(ids)!=len(set(ids)):raise ValueError('Duplicate observation identifiers')
    for wrapper in payload['arrays'].values():
        if wrapper['listState']=='none' and wrapper['items']:raise ValueError('none list has items')
        if (wrapper['listState']=='unknown') != (wrapper['valueState']=='unknown'):raise ValueError('Inconsistent list state')
