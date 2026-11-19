"""Synthetic HIS regression cases; never load the private hospital workbook.

DB cases refuse every target except the disposable qa_pre004 database/schema.
The upload guard cases exercise the actual ASGI route without a database.
"""
import base64
import hashlib
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta, timezone
from io import BytesIO
from uuid import uuid4

from openpyxl import Workbook
from fastapi import HTTPException
import psycopg
from psycopg.conninfo import conninfo_to_dict
import pytest

from test_excel_request_limits import app, post
from test_forms_api import DSN, checked, live, patch, snapshot, case


AUTO_PATH = '/api/forms/imports/excel/auto-preview'
_MIB = 1024 * 1024


@pytest.mark.parametrize('token,expected', [(None, 401), ('invalid-token', 401), ('qa-admin', 403)])
def test_his_upload_checks_role_before_consuming_body(app, token, expected):
    status, _, _ = post(app, 'excel/auto-preview', token=token)
    assert status == expected


@pytest.mark.parametrize('role', ['nurse', 'pharmacist', 'patient'])
@pytest.mark.parametrize('route', ['excel/auto-preview', 'commit'])
def test_his_other_authenticated_roles_are_rejected_before_body(app, role, route):
    user_id = uuid4()
    pool = app.state.pool
    pool.users['qa-role'] = {'id': user_id, 'username': 'qa-role', 'active': True}
    pool.roles[user_id] = [role]
    pool.sessions[hashlib.sha256(b'qa-role-token').hexdigest()] = {
        'user_id': user_id, 'expires_at': datetime.now(timezone.utc) + timedelta(minutes=5), 'revoked_at': None}
    status, _, _ = post(app, route, token='qa-role-token')
    assert status == 403


def test_his_upload_declared_and_streaming_body_limits(app):
    status, _, _ = post(app, 'excel/auto-preview', token='qa-doctor', length=6 * _MIB + 1)
    assert status == 413
    status, _, _ = post(app, 'excel/auto-preview', token='qa-doctor',
                        chunks=[(b' ' * _MIB, True)] * 6 + [(b'!', True)])
    assert status == 413


def test_his_source_identity_uses_code_and_canonical_admission_time():
    from src.gateway.forms.his_import import canonical_time, visit_identity
    assert canonical_time(datetime(2024, 2, 3, 8, 15)) == '2024-02-03T01:15:00+00:00'
    first = visit_identity('QA-001', '2024-02-03T08:15:00+07:00')
    assert first == visit_identity('QA-001', '2024-02-03T01:15:00+00:00')
    assert first.startswith('HIS:Sheet3:v1:')
    assert first != visit_identity('QA-002', '2024-02-03T08:15:00+07:00')
    assert first != visit_identity('QA-001', '2024-02-04T08:15:00+07:00')


@pytest.mark.parametrize('value', [0, False, None, 'not-a-date', '03/02/2024'])
def test_his_source_identity_does_not_guess_dates_from_ambiguous_values(value):
    from src.gateway.forms.his_import import canonical_time
    with pytest.raises(ValueError):
        canonical_time(value)


@pytest.fixture(scope='module')
def his_live(request):
    if not DSN:
        pytest.skip('Dedicated synthetic HIS QA connection required')
    target = conninfo_to_dict(DSN)
    assert target.get('dbname') == 'qa_pre004', 'Refuse non-disposable database'
    assert target.get('host') in ('127.0.0.1', 'localhost')
    assert target.get('port') == '55497', 'Refuse other PostgreSQL instances'
    assert target.get('options') == '-csearch_path=d3_form_qa_20261023,public'
    return request.getfixturevalue('live')


def source_row(code=None, admitted=None, **values):
    """All demographic/clinical values here are independently invented QA data."""
    return {'MaNghienCuu': code or 'HIS-QA-' + uuid4().hex,
            'NgayVaoVien': admitted or datetime(2024, 2, 3, 8, 15), **values}


def his_file(rows, *, headers=None, title='Sheet3'):
    from src.gateway.forms.his_template import HIS_HEADERS
    headers = list(HIS_HEADERS) if headers is None else headers
    assert len(HIS_HEADERS) == 42 and len(set(HIS_HEADERS)) == 42
    assert {'MaNghienCuu', 'NgayVaoVien'} <= set(HIS_HEADERS)
    book = Workbook()
    sheet = book.active
    sheet.title = title
    sheet.append(headers)
    for row in rows:
        assert set(row) <= set(HIS_HEADERS), 'QA fixture has a misspelled source header'
        sheet.append([row.get(header) for header in headers])
    output = BytesIO()
    book.save(output)
    book.close()
    return {'filename': 'synthetic-his-qa.xlsx',
            'content_base64': base64.b64encode(output.getvalue()).decode()}


def auto_preview(his_live, rows, **file_options):
    return checked(his_live[0].post(AUTO_PATH, headers=his_live[1]['doctor'],
                                    json=his_file(rows, **file_options)))


def commit(his_live, plan, records=None, status=200):
    records = [{'index': 0}] if records is None else records
    return checked(his_live[0].post('/api/forms/imports/commit',
                   headers=his_live[1]['doctor'],
                   json={'preview_token': plan['preview_token'], 'records': records}), status)


def database_state():
    """Exclude auth sessions while detecting any preview business/catalog writes."""
    with psycopg.connect(DSN) as connection:
        connection.execute('SET LOCAL ROLE hf_demo_owner')
        tables = ('form_patient', 'form_visit', 'form_history', 'form_import_batch',
                  'form_import_preset', 'form_field', 'form_field_history')
        counts = tuple(connection.execute('SELECT count(*) FROM ' + table).fetchone()[0]
                       for table in tables)
        sequence = tuple(connection.execute('SELECT last_value,is_called FROM form_patient_code_seq').fetchone())
        catalog = tuple(connection.execute('SELECT revision FROM form_catalog WHERE id=1').fetchone())
        return counts, sequence, catalog


def imported_target(his_live, source):
    client, headers, _ = his_live
    patients = checked(client.get('/api/forms/patients', headers=headers['doctor']))
    patient = next(patient for patient in patients if patient['external_id'] == source['MaNghienCuu'])
    visits = checked(client.get('/api/forms/patients/' + patient['id'] + '/visits', headers=headers['doctor']))
    assert len(visits) == 1
    return patient, visits[0]


def test_his_preview_never_allocates_profiles_visits_codes_or_catalog(his_live):
    rows = [source_row(), source_row()]
    before = database_state()
    plan = auto_preview(his_live, rows)
    assert plan['business_writes'] is False
    assert plan['eligible'] == 2 and plan['errors'] == 0
    assert len(plan['records']) == 2
    assert database_state() == before
    for index, row in enumerate(plan['records']):
        assert row['patient_code'] == rows[index]['MaNghienCuu']
        assert row['raw_source']['sheet'] == 'Sheet3'
        assert row['raw_source']['row'] == index + 2
        assert len(row['raw_source']['columns']) == 42
    commit(his_live, plan, records=[{'index': 0}, {'index': 1}])
    after = database_state()
    assert after[0][0] == before[0][0] + 2
    assert after[0][1] == before[0][1] + 2


@pytest.mark.parametrize('malformation', ['renamed', 'missing', 'extra', 'reordered', 'wrong_sheet'])
def test_his_rejects_incomplete_or_changed_source_profile_without_writes(his_live, malformation):
    from src.gateway.forms.his_template import HIS_HEADERS
    headers, title = list(HIS_HEADERS), 'Sheet3'
    if malformation == 'renamed':
        headers[-1] += '_UNKNOWN'
    elif malformation == 'missing':
        headers.pop()
    elif malformation == 'extra':
        headers.append('EXTRA_QA_COLUMN')
    elif malformation == 'reordered':
        headers[0], headers[1] = headers[1], headers[0]
    else:
        title = 'OTHER_QA_SHEET'
    before = database_state()
    response = his_live[0].post(AUTO_PATH, headers=his_live[1]['doctor'],
                              json=his_file([source_row()], headers=headers, title=title))
    checked(response, 422)
    assert database_state() == before


def test_his_duplicate_source_admission_is_not_last_row_wins(his_live):
    row = source_row()
    before = database_state()
    plan = auto_preview(his_live, [row, row])
    assert plan['eligible'] == 0 and plan['errors'] == 2
    commit(his_live, plan, status=422)
    assert database_state() == before


def test_his_commit_creates_once_and_concurrent_retry_replays(his_live):
    source = source_row()
    plan = auto_preview(his_live, [source])
    before = database_state()
    with ThreadPoolExecutor(max_workers=2) as workers:
        results = list(workers.map(lambda _: commit(his_live, plan), range(2)))
    assert sorted(result['replayed'] for result in results) == [False, True]
    assert database_state()[0][0] == before[0][0] + 1
    assert database_state()[0][1] == before[0][1] + 1
    state = database_state()
    assert commit(his_live, plan)['replayed'] is True
    assert database_state() == state
    patient, visit = imported_target(his_live, source)
    assert patient['sex'] is None
    current = snapshot(his_live, visit)
    assert datetime.fromisoformat(current['metadata_json']['admitted_at']) == datetime.fromisoformat('2024-02-03T01:15:00+00:00')


def test_his_two_admissions_of_same_source_code_create_one_profile(his_live):
    first = source_row()
    second = source_row(first['MaNghienCuu'], datetime(2024, 2, 4, 8, 15))
    plan = auto_preview(his_live, [first, second])
    assert plan['eligible'] == 2
    before = database_state()
    commit(his_live, plan, records=[{'index': 0}, {'index': 1}])
    after = database_state()
    assert after[0][0] == before[0][0] + 1
    assert after[0][1] == before[0][1] + 2


def test_his_admin_and_anonymous_cannot_preview_or_commit(his_live):
    plan = auto_preview(his_live, [source_row()])
    client, headers, _ = his_live
    before = database_state()
    for credentials, status in [(headers['admin'], 403), ({}, 401)]:
        checked(client.post(AUTO_PATH, headers=credentials, json=his_file([source_row()])), status)
        checked(client.post('/api/forms/imports/commit', headers=credentials,
                            json={'preview_token': plan['preview_token'], 'records': [{'index': 0}]}), status)
    assert database_state() == before


def test_his_new_profile_collision_after_preview_requires_repreview(his_live):
    source = source_row()
    plan = auto_preview(his_live, [source])
    client, headers, _ = his_live
    checked(client.post('/api/forms/patients', headers=headers['doctor'],
                        json={'id': str(uuid4()), 'external_id': source['MaNghienCuu']}), 201)
    before = database_state()
    commit(his_live, plan, status=409)
    assert database_state() == before


def test_his_source_profile_outside_doctor_scope_is_not_duplicated(his_live):
    patient, _ = case(his_live)
    source = source_row(patient['external_id'])
    admin = his_live[2]['accounts']['admin']['id']
    with psycopg.connect(DSN) as connection:
        connection.execute('SET LOCAL ROLE hf_demo_owner')
        connection.execute('UPDATE form_patient SET owner_id=%s WHERE id=%s', (admin, patient['id']))
    before = database_state()
    plan = auto_preview(his_live, [source])
    assert plan['eligible'] == 0 and plan['errors'] == 1
    assert 'visit_id' not in plan['records'][0]
    commit(his_live, plan, status=422)
    assert database_state() == before


def test_his_cross_namespace_identity_ambiguity_is_rejected(his_live):
    first, _ = case(his_live)
    second, _ = case(his_live)
    # An old alias may collide with a generated display code. Do not choose one.
    with psycopg.connect(DSN) as connection:
        connection.execute('SET LOCAL ROLE hf_demo_owner')
        connection.execute("INSERT INTO form_patient_alias(alias,patient_id,origin) VALUES(%s,%s,'administrative_update')",
                           (first['code'], second['id']))
    before = database_state()
    plan = auto_preview(his_live, [source_row(first['code'])])
    assert plan['eligible'] == 0 and plan['errors'] == 1
    commit(his_live, plan, status=422)
    assert database_state() == before


def test_his_raw_labels_unknown_flags_missing_units_and_null_false_zero_survive(his_live):
    source = source_row(GioiTinh='G', NamSinh=1991, DiUng=False, ThuocLa=0, ThuocLao=None,
                        CanNang=0, ChieuCao=170, BMI=999, Creatinin_KetQua=125,
                        Creatinin_DonVi=None, KhoaRa='Khoa QA nguồn',
                        MaICD_VaoKhoa='QA.01', TenICD_VaoKhoa='Nhãn QA nguyên trạng',
                        NgayRaVien=datetime(2024, 2, 5, 9, 30))
    plan = auto_preview(his_live, [source])
    assert plan['eligible'] == 1
    fields = plan['records'][0]['fields']
    pending = {item['source']: item for item in fields if item['status'] == 'raw_pending'}
    for header in ('GioiTinh', 'NamSinh', 'DiUng', 'ThuocLa', 'ThuocLao', 'BMI', 'Creatinin_KetQua'):
        assert pending[header]['raw'] == source[header]
    assert not any(item.get('code') == 'creatinin_egfr' for item in fields)
    commit(his_live, plan)
    patient, visit = imported_target(his_live, source)
    assert patient['sex'] is None and patient['date_of_birth'] is None
    current = snapshot(his_live, visit)
    assert current['values_json']['can_nang'] == 0
    assert current['values_json']['chieu_cao'] == 170
    assert current['derived_values']['bmi'] is None
    assert datetime.fromisoformat(current['metadata_json']['admitted_at']) == datetime.fromisoformat('2024-02-03T01:15:00+00:00')
    assert datetime.fromisoformat(current['metadata_json']['ended_at']) == datetime.fromisoformat('2024-02-05T02:30:00+00:00')
    assert current['metadata_json']['department'] == 'Khoa QA nguồn'
    assert current['metadata_json']['primary_diagnosis_code'] == 'QA.01'
    cells = {cell['header']: cell for cell in current['metadata_json']['his_source_rows'][0]['columns']}
    assert cells['DiUng']['value'] is False
    assert type(cells['ThuocLa']['value']) is int and cells['ThuocLa']['value'] == 0
    assert cells['ThuocLao']['value'] is None
    assert cells['TenICD_VaoKhoa']['value'] == 'Nhãn QA nguyên trạng'
    assert cells['BMI']['value'] == 999


def test_his_conflicts_require_explicit_keep_or_override_and_bmi_recalculates(his_live):
    source = source_row(CanNang=60, ChieuCao=170, BMI=999)
    commit(his_live, auto_preview(his_live, [source]))
    _, visit = imported_target(his_live, source)
    incoming = {**source, 'CanNang': 65}
    plan = auto_preview(his_live, [incoming])
    assert {item['code'] for item in plan['records'][0]['fields'] if item['status'] == 'conflict'} == {'can_nang'}
    before = database_state()
    for decision in ({'index': 0},
                     {'index': 0, 'override_fields': ['can_nang'], 'keep_fields': ['can_nang']},
                     {'index': 0, 'keep_fields': ['can_nang', 'chieu_cao']}):
        commit(his_live, plan, records=[decision], status=422)
        assert database_state() == before
    commit(his_live, plan, records=[{'index': 0, 'keep_fields': ['can_nang']}])
    assert snapshot(his_live, visit)['values_json']['can_nang'] == 60
    plan = auto_preview(his_live, [incoming])
    commit(his_live, plan, records=[{'index': 0, 'override_fields': ['can_nang']}])
    current = snapshot(his_live, visit)
    assert current['values_json']['can_nang'] == 65
    assert current['derived_values']['bmi'] == 22.49
    empty = {**source, 'CanNang': None, 'ChieuCao': None}
    commit(his_live, auto_preview(his_live, [empty]))
    current = snapshot(his_live, visit)
    assert current['values_json']['can_nang'] == 65 and current['values_json']['chieu_cao'] == 170
    assert current['derived_values']['bmi'] == 22.49


def test_his_stale_existing_target_is_rejected_atomically(his_live):
    source = source_row(CanNang=60)
    commit(his_live, auto_preview(his_live, [source]))
    _, visit = imported_target(his_live, source)
    plan = auto_preview(his_live, [{**source, 'CanNang': 65}])
    checked(patch(his_live, visit, {'can_nang': 67})[0])
    before = database_state()
    commit(his_live, plan, records=[{'index': 0, 'override_fields': ['can_nang']}], status=409)
    assert database_state() == before
    assert snapshot(his_live, visit)['values_json']['can_nang'] == 67


def test_his_concurrent_different_source_intents_cannot_duplicate_visit(his_live):
    source = source_row(CanNang=60)
    plans = [auto_preview(his_live, [source]), auto_preview(his_live, [{**source, 'CanNang': 61}])]
    before = database_state()

    def send(plan):
        return his_live[0].post('/api/forms/imports/commit', headers=his_live[1]['doctor'],
                               json={'preview_token': plan['preview_token'], 'records': [{'index': 0}]})

    with ThreadPoolExecutor(max_workers=2) as workers:
        responses = list(workers.map(send, plans))
    assert sorted(response.status_code for response in responses) == [200, 409]
    after = database_state()
    assert after[0][0] == before[0][0] + 1 and after[0][1] == before[0][1] + 1
    _, visit = imported_target(his_live, source)
    assert snapshot(his_live, visit)['values_json']['can_nang'] in (60, 61)


def test_manual_metadata_save_preserves_his_source_evidence(his_live):
    source = source_row(CanNang=62, GioiTinh='T')
    commit(his_live, auto_preview(his_live, [source]))
    _, visit = imported_target(his_live, source)
    before = snapshot(his_live, visit)
    checked(patch(his_live, visit, {}, metadata={'reason': 'Tái khám QA'})[0])
    after = snapshot(his_live, visit)
    assert after['metadata_json']['reason'] == 'Tái khám QA'
    for protected in ('his_source_rows', 'his_identity'):
        assert after['metadata_json'][protected] == before['metadata_json'][protected]


def test_his_conflict_choices_cannot_create_invalid_merged_admission_dates(his_live):
    source = source_row(NgayRaVien=datetime(2024, 2, 5, 9, 30))
    commit(his_live, auto_preview(his_live, [source]))
    _, visit = imported_target(his_live, source)
    checked(patch(his_live, visit, {}, metadata={
        'admitted_at': '2024-02-06T08:00:00+07:00',
        'ended_at': '2024-02-08T08:00:00+07:00'})[0])
    plan = auto_preview(his_live, [source])
    conflicts = {item['code'] for item in plan['records'][0]['fields'] if item['status'] == 'conflict'}
    assert conflicts == {'@metadata:admitted_at', '@metadata:ended_at'}
    before = database_state()
    old_visit = snapshot(his_live, visit)
    commit(his_live, plan, records=[{'index': 0,
        'keep_fields': ['@metadata:admitted_at'],
        'override_fields': ['@metadata:ended_at']}], status=422)
    assert database_state() == before
    assert snapshot(his_live, visit) == old_visit


def test_his_batch_failure_rolls_back_new_profiles_visits_and_history(his_live, monkeypatch):
    from src.gateway.forms import his_import
    plan = auto_preview(his_live, [source_row(CanNang=61), source_row(CanNang=62)])
    before = database_state()
    original = his_import.persist
    calls = 0

    def fail_second(*args, **kwargs):
        nonlocal calls
        calls += 1
        if calls == 2:
            raise HTTPException(422, 'Synthetic second-record transaction failure')
        return original(*args, **kwargs)

    monkeypatch.setattr(his_import, 'persist', fail_second)
    commit(his_live, plan, records=[{'index': 0}, {'index': 1}], status=422)
    assert calls == 2
    # PostgreSQL sequences deliberately do not roll back; business rows must.
    assert database_state()[0] == before[0]
