"""Pure boundary checks; no shared QA writes or guessed medical normal ranges."""
from datetime import datetime

import pytest
from fastapi import HTTPException

from pydantic import ValidationError

from src.gateway.forms.router import Demographics, VisitMetadata, check_visit_birth, present_visit
from src.gateway.forms.validation import calculate_bmi, value_for


def test_age_at_vietnam_calendar_boundary_and_birth_validation():
    when = datetime.fromisoformat('2026-05-01T00:30:00+07:00')
    row = {'demographics_snapshot': {'date_of_birth': '2000-05-01'},
           'occurred_at': when.astimezone(__import__('datetime').timezone.utc),
           'values_json': {}, 'metadata_json': {}}
    assert present_visit(row, {}, 1)['age_at_visit'] == 26
    check_visit_birth('2026-05-01', row['occurred_at'])
    with pytest.raises(HTTPException) as exc:
        check_visit_birth('2026-05-02', row['occurred_at'])
    assert exc.value.status_code == 422


def test_unknown_and_explicit_empty_secondary_codes_are_distinct():
    assert VisitMetadata().secondary_diagnosis_codes is None
    assert VisitMetadata(secondary_diagnosis_codes=[]).secondary_diagnosis_codes == []


@pytest.mark.parametrize('code,value', [('tuoi',150),('can_nang',-1),('chieu_cao',-1)])
def test_source_and_physical_bounds(code,value):
    with pytest.raises(HTTPException):
        value_for({'code':code,'type':'integer' if code=='tuoi' else 'number','active':True},value)


def test_bounds_do_not_invent_normal_ranges_or_conflate_zero_null_false():
    weight={'code':'can_nang','type':'number','active':True}
    assert value_for(weight,0)==0
    assert value_for(weight,1000)==1000
    assert value_for(weight,None) is None
    with pytest.raises(HTTPException):
        value_for(weight,False)


@pytest.mark.parametrize('code', ['HF-DEMO-01', 'NB_A', '001', 'CASE.42', 'Người bệnh giả lập 00001'])
def test_pseudonymous_display_codes_and_existing_labels_are_supported(code):
    assert Demographics(display_name=code).display_name == code


@pytest.mark.parametrize('name', ['', 'Nguyễn Văn A', 'Nguyen Van A', '<script>alert(1)</script>'])
def test_display_identifier_rejects_names_and_markup(name):
    with pytest.raises(ValidationError):
        Demographics(display_name=name)


@pytest.mark.parametrize('height,weight,expected', [(168, 86, 30.47), (170, 65, 22.49), (100, 2.675, 2.68)])
def test_bmi_uses_cm_and_kg_with_two_decimal_half_up_rounding(height, weight, expected):
    values = {'chieu_cao': height, 'can_nang': weight, 'bmi': None}
    assert calculate_bmi(values) == expected
    assert values['bmi'] is None


@pytest.mark.parametrize('value', [None, 0, -1, False, '168', float('inf'), float('nan')])
@pytest.mark.parametrize('code', ['chieu_cao', 'can_nang'])
def test_bmi_requires_positive_finite_numeric_measurements(code, value):
    assert calculate_bmi({'chieu_cao': 168, 'can_nang': 86, code: value}) is None


def test_legacy_visit_exposes_calculation_without_rewriting_pinned_definition_or_value():
    definition = {'code': 'bmi', 'label': 'BMI', 'type': 'unavailable', 'order': 6, 'active': True}
    definitions = {'bmi': definition}
    row = {'demographics_snapshot': {}, 'occurred_at': None, 'metadata_json': {},
           'values_json': {'can_nang': 86, 'chieu_cao': 168, 'bmi': None}}
    result = present_visit(row, definitions, 3)
    assert result['derived_values']['bmi'] == 30.47
    assert result['values_json']['bmi'] is None
    assert result['fields'][0] == definition
    assert row['values_json']['bmi'] is None
    row['values_json']['chieu_cao'] = None
    assert present_visit(row, definitions, 3)['derived_values']['bmi'] is None


def test_bmi_cannot_be_overridden_even_if_a_catalog_type_is_changed():
    with pytest.raises(HTTPException) as failure:
        value_for({'code': 'bmi', 'type': 'number', 'active': True}, 30.47)
    assert failure.value.status_code == 422
    assert value_for({'code': 'bmi', 'type': 'unavailable', 'active': True}, None) is None
