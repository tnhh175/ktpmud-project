"""Deterministic C2 rule interpreter. No network, providers, or autonomous actions."""
from collections import OrderedDict
from copy import deepcopy
from datetime import datetime, timedelta
import json
import os
from pathlib import Path

from .workflow_schema import ROOT, validate


def load_rules():
    path = Path(os.environ.get('WORKFLOW_MOCK_RULES_PATH', str(ROOT / 'tests/fixtures/workflow/mock_ai_rules.json')))
    rules = json.loads(path.read_text(encoding='utf-8'))
    if rules['engine'] != 'mock-rules' or not rules.get('syntheticOnly'):
        raise ValueError('Only bundled synthetic mock rules are supported')
    return rules


def get_path(data, path):
    for key in path.split('.'):
        if not isinstance(data, dict):
            return None
        data = data.get(key)
    return data


def condition(rule, data):
    if rule.get('always'):
        return True
    if 'all' in rule:
        return all(condition(c, data) for c in rule['all'])
    if 'any' in rule:
        return any(condition(c, data) for c in rule['any'])
    a, b, op = get_path(data, rule['path']), rule.get('value'), rule['op']
    if op == 'missing_or_null':
        return a is None
    if a is None:
        return False
    if op == 'nonempty':
        return isinstance(a, (list, dict, str)) and bool(a)
    if op == 'eq':
        return type(a) is type(b) and a == b or type(a) in (int, float) and type(b) in (int, float) and a == b
    if op == 'in':
        return any(condition({'path': 'a', 'op': 'eq', 'value': x}, {'a': a}) for x in b)
    if op == 'contains':
        return isinstance(a, list) and b in a
    if type(a) not in (int, float) or type(b) not in (int, float):
        return False
    return {'lt': lambda: a < b, 'lte': lambda: a <= b, 'gt': lambda: a > b, 'gte': lambda: a >= b}[op]()


def medication_class(row):
    # Explicit codes only; never search display/free text for a drug name.
    return row.get('class') or {'mra': 'MRA', 'raas': 'ACEI'}.get(row.get('therapeuticGroup'), row.get('therapeuticGroup'))


def recent_evidence(fields, observations, visit_time, requested):
    valid = {}
    at = datetime.fromisoformat(visit_time.replace('Z', '+00:00'))
    tests = {'bnp_ntprobnp': ('cls_bnp', 'cls_nt_probnp'), 'ecg': ('ecg_12_chuyen_dao',),
             'sieu_am_tim': ('cls_lvef',), 'xquang': ('xquang_nguc_thang',)}
    for key, evidence in requested.items():
        if key not in tests or evidence.get('doctorConfirmedReuse') is not True:
            continue
        obs = next((o for o in observations if o['id'] == evidence.get('id') and o['fieldCode'] in tests[key]), None)
        if not obs or obs['answer'].get('value_state') != 'answered':
            continue
        measured = obs['answer'].get('measuredAt')
        if not measured:
            continue
        when = datetime.fromisoformat(measured.replace('Z', '+00:00'))
        if timedelta(0) <= at - when <= timedelta(days=30):
            valid[key] = {**evidence, 'measuredAt': measured}
    return valid


def run_module(module, snapshot, *, rules=None):
    rules = rules or load_rules()
    module = module.upper()
    data = deepcopy(snapshot)
    fields = data.get('fields', {})
    # Null out unknown values even for callers that are not the HTTP adapter.
    for answer in fields.values():
        if answer.get('value_state') != 'answered':
            answer['value'] = None
    drugs = [row for key in rules['outputProjection']['medicationFields']
             for row in (fields.get(key, {}).get('value') or [])]
    data['medicationClasses'] = sorted({medication_class(row) for row in drugs if medication_class(row)})
    # The API derives recentTests using stored observation IDs and a doctor reuse flag.
    if 'observations' in data:
        evidence = recent_evidence(fields, data['observations'], data['visitTime'], data.get('recentTestEvidence', {}))
        data['recentTestEvidence'], data['recentTests'] = evidence, list(evidence)
    output = deepcopy(rules['outputDefaults'][module])
    data['output'] = output
    groups = OrderedDict()
    for rule in rules['rules']:
        if rule['module'] == module:
            groups.setdefault(rule['group'], []).append(rule)
    matched = []
    for candidates in groups.values():
        for rule in sorted(candidates, key=lambda r: r['priority']):
            if not condition(rule['when'], data):
                continue
            matched.append(rule['id'])
            for effect in rule['effects']:
                parent = output
                parts = effect['path'].split('.')
                for part in parts[:-1]:
                    parent = parent.setdefault(part, {})
                key, value = parts[-1], deepcopy(effect['value'])
                if effect['op'] == 'set':
                    parent[key] = value
                elif effect['op'] == 'append_unique':
                    if value not in parent.setdefault(key, []):
                        parent[key].append(value)
                else:
                    raise ValueError('Unsupported mock effect')
            break
    projection = rules['outputProjection']
    for key in projection['gapFields'][module]:
        if fields.get(key, {}).get('value_state') != 'answered':
            output['dataGaps'].append(key+': '+fields.get(key,{}).get('value_state','unfilled'))
    if module == 'M1' and any(v is None for v in output['du_bao_nguy_co'].values()):
        output['dataGaps'].append(projection['unestimatedRiskGap'])
    if module == 'M2':
        for key in output['khoa_trung_lap']:
            output['goi_y_chi_dinh'][key]['evidenceObservationIds'] = [data['recentTestEvidence'][key]['id']]
    if module == 'M3':
        for key, path in projection['m3CopyFrom'].items():
            output[key] = get_path(data, path)
    if module == 'M4':
        for alert in output['canh_bao']:
            classes = projection['relatedClassesByAlert'].get(alert['id'], [])
            alert['thuoc_lien_quan'] = sorted({r['id'] for r in drugs if medication_class(r) in classes})
    validate(output, module.lower() + 'Output')
    return output, matched
