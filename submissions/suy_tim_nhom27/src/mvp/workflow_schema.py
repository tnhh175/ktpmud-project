"""Validate the bundled, local C1 schema vocabulary without an external resolver."""
from datetime import datetime
from decimal import Decimal, InvalidOperation
import json
import math
from pathlib import Path
import re
from uuid import UUID

ROOT = Path(__file__).resolve().parents[2]
SCHEMA = json.loads((ROOT / 'api/schemas/hf-workflow-1.0.schema.json').read_text(encoding='utf-8'))


def matches(value, schema, root=SCHEMA):
    if isinstance(schema, bool):
        return schema
    if '$ref' in schema:
        ref = schema['$ref']
        if not ref.startswith('#/'):
            return False
        target = root
        for part in ref[2:].split('/'):
            target = target[part.replace('~1', '/').replace('~0', '~')]
        if not matches(value, target, root):
            return False
    for key, check in [('allOf', all), ('anyOf', any)]:
        if key in schema and not check(matches(value, s, root) for s in schema[key]):
            return False
    if 'oneOf' in schema and sum(matches(value, s, root) for s in schema['oneOf']) != 1:
        return False
    if 'not' in schema and matches(value, schema['not'], root):
        return False
    if 'if' in schema:
        branch = 'then' if matches(value, schema['if'], root) else 'else'
        if branch in schema and not matches(value, schema[branch], root):
            return False
    def equal(a, b):
        return a == b and (type(a) is type(b) or type(a) in (int, float) and type(b) in (int, float))
    if 'const' in schema and not equal(value, schema['const']):
        return False
    if 'enum' in schema and not any(equal(value, v) for v in schema['enum']):
        return False
    finite_number = type(value) is int or type(value) is float and math.isfinite(value)
    checks = {'object': type(value) is dict, 'array': type(value) is list,
              'string': type(value) is str, 'integer': finite_number and value == int(value),
              'number': finite_number,
              'boolean': type(value) is bool, 'null': value is None}
    kind = schema.get('type')
    if kind and not any(checks[t] for t in (kind if isinstance(kind, list) else [kind])):
        return False
    if isinstance(value, dict):
        props = schema.get('properties', {})
        if any(k not in value for k in schema.get('required', [])):
            return False
        for k, v in value.items():
            rule = props.get(k, schema.get('additionalProperties', True))
            if not matches(v, rule, root):
                return False
    if isinstance(value, list):
        if len(value) < schema.get('minItems', 0) or len(value) > schema.get('maxItems', math.inf):
            return False
        if schema.get('uniqueItems') and any(value[i] == value[j] for i in range(len(value)) for j in range(i)):
            return False
        if any(not matches(v, schema.get('items', True), root) for v in value):
            return False
    if type(value) in (int, float):
        if not finite_number:
            return False
        if any(k in schema and bad for k, bad in [
            ('minimum', value < schema.get('minimum', -math.inf)),
            ('maximum', value > schema.get('maximum', math.inf)),
            ('exclusiveMinimum', value <= schema.get('exclusiveMinimum', -math.inf)),
            ('exclusiveMaximum', value >= schema.get('exclusiveMaximum', math.inf))]):
            return False
        try:
            if 'multipleOf' in schema and Decimal(str(value)) % Decimal(str(schema['multipleOf'])):
                return False
        except InvalidOperation:
            return False
    if isinstance(value, str):
        if len(value) < schema.get('minLength', 0) or len(value) > schema.get('maxLength', math.inf):
            return False
        if schema.get('pattern') and not re.search(schema['pattern'], value):
            return False
        try:
            if schema.get('format') == 'uuid':
                UUID(value)
            if schema.get('format') == 'date-time':
                if not re.fullmatch(r'\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})', value):
                    return False
                if datetime.fromisoformat(value.replace('Z', '+00:00')).utcoffset() is None:
                    return False
        except ValueError:
            return False
    return True


def validate(value, definition):
    if not matches(value, {'$ref': '#/$defs/' + definition}):
        raise ValueError('Invalid workflow schema: ' + definition)
    if definition == 'm1Output':
        # C1 section 5: explicit stage labels must agree with the structured stage.
        stages = {'Có nguy cơ – Stage A': 'A', 'Pre-HF – Stage B': 'B',
                  'Suy tim có triệu chứng – Stage C': 'C', 'Suy tim tiến triển – Stage D': 'D'}
        expected = stages.get(value['xac_suat_suy_tim']['muc'])
        if expected is not None and value['stage'] != expected:
            raise ValueError('M1 stage does not match its label')
