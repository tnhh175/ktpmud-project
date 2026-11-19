"""One source-bound HIS profile. Preview never creates profiles, visits or fields."""
from __future__ import annotations

from datetime import date, datetime, timezone, timedelta
import hashlib
import re
import time
from uuid import UUID, uuid4

from fastapi import HTTPException
from pydantic import ValidationError
from psycopg.types.json import Jsonb

from ..database import staff_connection
from .his_template import HIS_HEADERS
from .router import (catalog, check_visit_birth, demographics, fingerprint,
                     identity_available, patient_access, persist, pinned_catalog, visit_access)
from .validation import value_for

PROFILE = 'his_sheet3_v1'
NAMESPACE = 'HIS:Sheet3:v1'
VIETNAM = timezone(timedelta(hours=7))
NOTES = [
    'Chỉ đọc Sheet3 theo đúng 42 cột của mẫu HIS.',
    'ChieuCao dùng cm và CanNang dùng kg theo hợp đồng nguồn HIS đã duyệt; không tự đổi đơn vị.',
    'Ngày Excel không có múi giờ được hiểu theo hồ sơ nguồn Asia/Ho_Chi_Minh (UTC+07:00).',
    'Mã lượt dẫn xuất từ MaNghienCuu và NgayVaoVien, không phải mã lượt do HIS cấp.',
    'GioiTinh và cờ số chưa có bảng mã; NamSinh chỉ là năm. Không suy ra giới tính, ngày sinh hoặc Có/Không.',
    'BMI nguồn được giữ nguyên; BMI hiển thị được tính từ chiều cao và cân nặng của lượt.',
    'Huyết áp không có tư thế hoặc đơn vị trong nguồn; nhiệt độ và kết quả chưa xác minh được giữ ở dữ liệu nguồn.',
]


def his_definitions(definitions):
    """Add source measurements to NEW snapshots, never mutate existing catalogs."""
    result = dict(definitions)
    for offset, (header, code) in enumerate([('HuyetApCao', 'his_huyet_ap_cao'),
                                            ('HuyetApThap', 'his_huyet_ap_thap'),
                                            ('NhietDo', 'his_nhiet_do')]):
        definition = {'code': code, 'label': header + ' (nguồn HIS)', 'group': 'Chỉ số nguồn HIS',
                        'type': 'number', 'unit': None, 'active': True, 'choices': [], 'order': 9900 + offset,
                        'help': 'Giữ số đo nguồn HIS. Nguồn chưa khai báo đơn vị hoặc tư thế đo; không suy diễn.',
                        'source': {'origin': PROFILE, 'column': header}, 'data_role': 'recorded_input', 'version': 1}
        if code in result and result[code] != definition:
            raise ValueError('Mã trường nguồn HIS đã được dùng với định nghĩa khác; cần quản trị đối chiếu')
        result[code] = definition
    return result


def canonical_time(value):
    """The declared profile timezone makes naive Excel datetimes explicit."""
    if isinstance(value, str):
        value = datetime.fromisoformat(value.strip())
    elif isinstance(value, date) and not isinstance(value, datetime):
        value = datetime.combine(value, datetime.min.time())
    if not isinstance(value, datetime):
        raise ValueError('Cần ngày/giờ Excel hoặc ISO hợp lệ, không tự đổi số thành ngày')
    if value.tzinfo is None:
        value = value.replace(tzinfo=VIETNAM)
    return value.astimezone(timezone.utc).isoformat()


def visit_identity(patient_code, admitted_at):
    canonical = canonical_time(admitted_at)
    digest = fingerprint({'MaNghienCuu': patient_code, 'NgayVaoVien': canonical})
    return NAMESPACE + ':' + digest


def _display(value):
    return value.isoformat() if isinstance(value, (date, datetime)) else value


def parse_sheet(sheet, definitions=None):
    from .imports import LIMITS, problem
    rows = sheet.iter_rows()
    headers = tuple(c.value for c in next(rows, ()))
    if headers != tuple(HIS_HEADERS):
        problem('/sheet', 'Sheet3 phải có đúng 42 cột và thứ tự tiêu đề của mẫu HIS')
    records = []
    logical_text_bytes = 0
    for number, cells in enumerate(rows, 2):
        if all(c.value is None for c in cells):
            continue
        if len(records) >= LIMITS['records']:
            problem('/records', 'Tối đa 100 dòng không trống mỗi lần nhập')
        # A small ZIP can reference the same large shared string thousands of
        # times. Bound logical text before copying it into raw evidence/JSON.
        for cell in cells:
            if isinstance(cell.value, str):
                if len(cell.value) > 32767:
                    problem('/sheet', 'Nội dung ô vượt giới hạn 32767 ký tự')
                logical_text_bytes += len(cell.value.encode('utf-8'))
                if logical_text_bytes > 1024 * 1024:
                    problem('/sheet', 'Tổng văn bản Sheet3 vượt 1 MiB; chia nhỏ nguồn trước khi nhập')
        raw = {header: cells[i].value for i, header in enumerate(HIS_HEADERS)}
        errors = []
        source = {'sheet': 'Sheet3', 'row': number, 'columns': [
            {'column': i + 1, 'header': h, 'value': _display(cells[i].value), 'cell_type': cells[i].data_type}
            for i, h in enumerate(HIS_HEADERS)]}
        for i, cell in enumerate(cells):
            if cell.data_type in {'f', 'e'}:
                errors.append({'path': f'Sheet3!row{number}/column{i + 1}',
                               'reason': 'Ô công thức hoặc lỗi không được nhập; cần giá trị nguồn đã xác minh'})
        code = raw['MaNghienCuu']
        if not isinstance(code, str) or not code.strip() or code != code.strip() or len(code) > 100:
            errors.append({'path': f'Sheet3!row{number}/MaNghienCuu', 'reason': 'Mã nghiên cứu phải là chuỗi rõ ràng tối đa 100 ký tự, không tự sửa định danh'})
            code = None
        dates = {}
        for key in ('NgayVaoVien', 'NgayRaVien'):
            try:
                dates[key] = canonical_time(raw[key]) if raw[key] is not None else None
                if key == 'NgayVaoVien' and dates[key] is None:
                    raise ValueError('Thiếu ngày vào viện để định danh lượt')
            except (ValueError, TypeError, OverflowError) as exc:
                errors.append({'path': f'Sheet3!row{number}/{key}', 'reason': str(exc)})
        if dates.get('NgayVaoVien') and dates.get('NgayRaVien') and dates['NgayRaVien'] < dates['NgayVaoVien']:
            errors.append({'path': f'Sheet3!row{number}/NgayRaVien', 'reason': 'Ngày ra viện không được trước ngày vào viện'})
        identity = visit_identity(code, dates['NgayVaoVien']) if code and dates.get('NgayVaoVien') else None
        records.append({'patient_code': code, 'visit_external_id': identity, 'raw': {k: _display(v) for k, v in raw.items()},
                        'raw_source': source, '_errors': errors, 'dates': dates})
    if not records:
        problem('/sheet', 'Sheet3 không có dòng dữ liệu')
    return records


def _resolve_patient(conn, actor, code):
    matches = conn.execute('''SELECT DISTINCT p.* FROM form_patient p WHERE p.code=%s OR p.external_id=%s
        OR EXISTS(SELECT 1 FROM form_patient_alias a WHERE a.patient_id=p.id AND a.alias=%s)''', (code, code, code)).fetchall()
    if len(matches) > 1:
        raise ValueError('Định danh nguồn trùng nhiều hồ sơ; cần đối chiếu trước khi nhập')
    if not matches:
        return None
    try:
        return patient_access(conn, actor, matches[0]['id'])
    except HTTPException:
        raise ValueError('Định danh nguồn không thuộc phạm vi tài khoản; không tạo hồ sơ trùng') from None


def _raw_reason(header):
    if header == 'BMI':
        return 'BMI nguồn lưu nguyên trạng; ứng dụng tính BMI từ chiều cao và cân nặng'
    if header in {'GioiTinh', 'DiUng', 'MaTuy', 'RuouBia', 'ThuocLa', 'ThuocLao'}:
        return 'Chưa có bảng mã nguồn, không tự diễn giải'
    if header == 'NamSinh':
        return 'Chỉ biết năm sinh, không tạo ngày sinh'
    if header in {'HuyetApCao', 'HuyetApThap'}:
        return 'Không có tư thế hoặc đơn vị huyết áp trong nguồn; không gán trường đứng/nằm'
    if header.startswith(('Creatinin_', 'Troponin_', 'Natri_', 'Clo_')):
        return 'Chưa xác minh đầy đủ mã xét nghiệm và đơn vị theo danh mục đích; giữ nguyên kết quả nguồn'
    return 'Giữ dữ liệu nguồn; chưa đủ đặc tả để ghi vào trường có cấu trúc'


def _field_items(record, definitions, current, source_name):
    raw = record['raw']
    fields, values, sources, consumed = [], {}, {}, set()

    def add(code, incoming, headers):
        field = definitions.get(code)
        if not field or not field.get('active') or field['type'] == 'unavailable':
            return
        incoming = value_for(field, incoming)
        before = current.get('values_json', {}).get(code)
        # Results are additive: approving a differing test never deletes older results.
        if field['type'] == 'results' and incoming is not None and before:
            incoming = before + [item for item in incoming if item not in before]
        status = 'source_null' if incoming is None else 'unchanged' if incoming == before else 'fill' if before is None else 'conflict'
        fields.append({'code': code, 'source': ', '.join(headers), 'label': field['label'], 'raw': {h: raw[h] for h in headers},
                       'incoming': incoming, 'current': before, 'status': status, 'path': f"Sheet3!row{record['raw_source']['row']}/{headers[0]}"})
        values[code] = incoming
        sources[code] = {'kind': 'excel', 'source_name': source_name, 'profile': PROFILE,
                         'location': fields[-1]['path'], 'source_key': headers}
        consumed.update(headers)

    for header, code in [('ChieuCao', 'chieu_cao'), ('CanNang', 'can_nang'), ('Mach', 'mach'), ('NhipTho', 'nhip_tho')]:
        add(code, raw[header], [header])
    for header, code in [('HuyetApCao', 'his_huyet_ap_cao'), ('HuyetApThap', 'his_huyet_ap_thap'), ('NhietDo', 'his_nhiet_do')]:
        add(code, raw[header], [header])
    # Only explicit test codes and catalog-approved source units qualify.
    tests = [('NTproBNP', 'bnp_ntprobnp', 'NT_PROBNP', 'NT-proBNP', 'NTproBNP_Ngay'),
             ('Troponin', 'troponin', 'TROPONIN', raw['Troponin_TenDichVu'], 'Troponin_Ngay'),
             ('Creatinin', 'creatinin_egfr', 'CREATININE', 'Creatinin', 'Creatinin_Ngay'),
             ('Natri', 'dien_giai', 'NA', 'Natri', 'DienGiai_Ngay'),
             ('Kali', 'dien_giai', 'K', 'Kali', 'DienGiai_Ngay')]
    grouped = {}
    for prefix, code, test_code, name, date_header in tests:
        field = definitions.get(code, {})
        test = next((t for t in field.get('result_tests', []) if t['code'] == test_code), None)
        unit = raw[prefix + '_DonVi']
        normalized = {'pg/ml': 'pg/mL', 'mmol/l': 'mmol/L'}.get(str(unit).lower(), unit)
        if raw[prefix + '_KetQua'] is None or not test or not unit or normalized not in test.get('units', []):
            continue
        observed = canonical_time(raw[date_header]) if raw[date_header] else None
        entry = {'name': name, 'test_code': test_code, 'value': raw[prefix + '_KetQua'], 'unit': normalized,
                 'observed_at': observed, 'source': source_name}
        group = grouped.setdefault(code, ([], []))
        group[0].append(entry)
        group[1].extend([prefix + '_KetQua', prefix + '_DonVi', date_header])
    for code, (entries, headers) in grouped.items():
        add(code, entries, list(dict.fromkeys(headers)))
    metadata = {'admitted_at': record['dates'].get('NgayVaoVien'), 'ended_at': record['dates'].get('NgayRaVien'),
                'department': raw['KhoaRa'], 'primary_diagnosis_code': raw['MaICD_VaoKhoa']}
    secondary = raw['DanhSachMaICD_Phu']
    if isinstance(secondary, str):
        codes = [part.strip() for part in secondary.split(';') if part.strip()]
        if codes and len(codes) == len(set(codes)) and all(re.fullmatch(r'[A-Z][0-9]{2}(?:\.[A-Z0-9]{1,4})?', code) for code in codes):
            metadata['secondary_diagnosis_codes'] = codes
            consumed.add('DanhSachMaICD_Phu')
    from .router import VisitMetadata
    metadata = VisitMetadata.model_validate(metadata).model_dump(mode='json', exclude_none=True)
    for key, incoming in metadata.items():
        before = current.get('metadata_json', {}).get(key)
        code = '@metadata:' + key
        labels = {'admitted_at': 'Ngày vào viện', 'ended_at': 'Ngày ra viện', 'department': 'Khoa ra viện',
                  'primary_diagnosis_code': 'Mã ICD vào khoa', 'secondary_diagnosis_codes': 'Mã ICD phụ'}
        # Secondary diagnoses are additive as well: existing codes remain recorded.
        if key == 'secondary_diagnosis_codes' and before:
            incoming = before + [item for item in incoming if item not in before]
        fields.append({'code': code, 'source': key, 'label': labels[key], 'incoming': incoming, 'current': before,
                       'status': 'unchanged' if incoming == before else 'fill' if before is None else 'conflict',
                       'path': '/metadata/' + key})
        values[code] = incoming
    consumed.update(('MaNghienCuu', 'NgayVaoVien', 'NgayRaVien', 'KhoaRa', 'MaICD_VaoKhoa'))
    for header in HIS_HEADERS:
        if header not in consumed:
            fields.append({'source': header, 'label': header, 'raw': raw[header], 'status': 'raw_pending',
                           'reason': _raw_reason(header), 'path': f"Sheet3!row{record['raw_source']['row']}/{header}"})
    return fields, values, sources


def build_plan(conn, actor, records, revision, definitions, source_name):
    from .imports import LIMITS
    identities = [(r['patient_code'], r['visit_external_id']) for r in records]
    result = []
    for index, record in enumerate(records):
        errors = list(record['_errors'])
        row = {'index': index, 'patient_code': record['patient_code'], 'visit_external_id': record['visit_external_id'],
               'fields': [], 'values': {}, 'sources': {}, 'errors': errors, 'raw_source': record['raw_source'],
               'source_identity': {'namespace': NAMESPACE, 'patient_code': record['patient_code'],
                   'admitted_at': record['dates'].get('NgayVaoVien'), 'timezone': 'Asia/Ho_Chi_Minh',
                   'visit_external_id': record['visit_external_id'], 'basis': ['MaNghienCuu', 'NgayVaoVien']},
               'new_patient': False, 'new_target': False}
        try:
            if identities.count(identities[index]) > 1:
                raise ValueError('Nhiều dòng cùng MaNghienCuu và NgayVaoVien; không lấy dòng cuối')
            if errors:
                raise ValueError('Định danh hoặc ô nguồn chưa hợp lệ')
            patient = _resolve_patient(conn, actor, record['patient_code'])
            existing = conn.execute('SELECT * FROM form_visit WHERE patient_id=%s AND external_id=%s',
                                    (patient['id'], record['visit_external_id'])).fetchone() if patient else None
            row.update(patient_id=str(patient['id']) if patient else None,
                       target_patient_code=patient['code'] if patient else 'Sẽ cấp mã BN khi xác nhận',
                       target_patient_name=patient['display_name'] if patient else record['patient_code'],
                       new_patient=patient is None, new_target=existing is None,
                       target_action='update_visit' if existing else 'create_visit' if patient else 'create_patient_and_visit',
                       visit_id=str(existing['id']) if existing else None,
                       expected_revision=existing['revision'] if existing else 0,
                       catalog_revision=existing['catalog_revision'] if existing else revision,
                       target_occurred_at=existing['occurred_at'].isoformat() if existing and existing['occurred_at'] else record['dates'].get('NgayVaoVien'))
            if patient:
                check_visit_birth(patient.get('date_of_birth'), datetime.fromisoformat(record['dates']['NgayVaoVien']))
            row_definitions = pinned_catalog(existing)[1] if existing else his_definitions(definitions)
            row['fields'], row['values'], row['sources'] = _field_items(record, row_definitions, existing or {}, source_name)
        except (ValueError, HTTPException) as exc:
            errors.append({'path': f'/records/{index}', 'reason': str(exc) if isinstance(exc, ValueError) else str(exc.detail)})
        row['status'] = 'error' if errors else 'eligible'
        result.append(row)
    return {'actor': str(actor.user_id), 'expires': int(time.time()) + LIMITS['preview_seconds'],
            'catalog_revision': revision, 'source_kind': 'excel', 'source_name': source_name, 'mapping_version': '1.0',
            'mapping': {'profile': PROFILE, 'sheet': 'Sheet3', 'headers': list(HIS_HEADERS)},
            'plan_kind': 'his_excel_auto', 'profile': PROFILE, 'notes': NOTES,
            'identity_policy': {'namespace': NAMESPACE, 'basis': ['MaNghienCuu', 'NgayVaoVien']}, 'records': result}


def _create_patient(conn, actor, source_code):
    patient_id = uuid4()
    identity_available(conn, source_code, patient_id)
    while True:
        seq = conn.execute('SELECT last_value,is_called FROM form_patient_code_seq').fetchone()
        if seq['is_called'] and seq['last_value'] >= 99999:
            raise HTTPException(409, 'Đã hết phạm vi mã BN; cần mở rộng trước khi cấp tiếp')
        number = conn.execute("SELECT nextval('form_patient_code_seq') AS n").fetchone()['n']
        code = f'BN-{number:05}'
        if not conn.execute('SELECT 1 FROM form_patient_alias WHERE alias=%s UNION ALL SELECT 1 FROM form_patient WHERE code=%s OR external_id=%s',
                            (code, code, code)).fetchone() and code != source_code:
            break
    return conn.execute('''INSERT INTO form_patient(id,code,external_id,display_name,owner_id)
        VALUES(%s,%s,%s,%s,%s) RETURNING *''', (patient_id, code, source_code, code, actor.user_id)).fetchone()


def commit_plan(body, request, actor, plan):
    """All identity, ACL and revision checks run in the same atomic transaction."""
    from .imports import problem
    if len({d.index for d in body.records}) != len(body.records):
        problem('/records', 'Không chọn lặp bản ghi')
    selected = []
    for decision in body.records:
        if decision.index >= len(plan['records']):
            problem('/records', 'Bản ghi không có trong preview')
        row = plan['records'][decision.index]
        if row['status'] != 'eligible':
            problem('/records/' + str(decision.index), 'Bản ghi còn lỗi, không được ghi')
        conflicts = {f['code'] for f in row['fields'] if f['status'] == 'conflict'}
        override, keep = set(decision.override_fields), set(decision.keep_fields)
        if (len(override) != len(decision.override_fields) or len(keep) != len(decision.keep_fields)
                or override & keep or override | keep != conflicts):
            problem('/records/' + str(decision.index), 'Cần chọn giữ hoặc ghi đè rõ ràng cho từng trường xung đột')
        selected.append((row, override, keep))
    # Hash source intents, not generated UUIDs or current merged result arrays.
    content_hash = fingerprint({'profile': PROFILE, 'records': sorted([
        {'patient_code': r['patient_code'], 'visit_external_id': r['visit_external_id'],
         'raw_source': r['raw_source'], 'overrides': sorted(overrides), 'keep': sorted(keep)}
        for r, overrides, keep in selected], key=lambda r: (r['patient_code'], r['visit_external_id']))})
    with staff_connection(request, actor) as conn:
        # Shared with administrative profile creation/edit: alias identity cannot race.
        conn.execute("SELECT pg_advisory_xact_lock(hashtextextended('form_patient_create',0))")
        lock_key = int.from_bytes(hashlib.sha256((str(actor.user_id) + content_hash).encode()).digest()[:8], 'big', signed=True)
        conn.execute('SELECT pg_advisory_xact_lock(%s)', (lock_key,))
        previous = conn.execute('SELECT result FROM form_import_batch WHERE actor_id=%s AND content_hash=%s',
                                (actor.user_id, content_hash)).fetchone()
        if previous:
            for outcome in previous['result']['records']:
                visit_access(conn, actor, UUID(outcome['visit_id']))
            return {**previous['result'], 'replayed': True}
        current_revision, current_definitions = catalog(conn)
        created_patients, targets = {}, {}
        # Acquire target row locks in stable order before writing any values.
        for row, _, _ in sorted(selected, key=lambda item: item[0]['visit_external_id']):
            try:
                patient = _resolve_patient(conn, actor, row['patient_code'])
            except ValueError as exc:
                raise HTTPException(409, str(exc)) from None
            if row['patient_id']:
                if patient is None or str(patient['id']) != row['patient_id']:
                    raise HTTPException(409, 'Liên kết định danh đã đổi; xem trước lại')
            elif patient is not None and row['patient_code'] not in created_patients:
                raise HTTPException(409, 'Hồ sơ nguồn vừa được tạo hoặc liên kết; xem trước lại')
            if patient is None:
                patient = _create_patient(conn, actor, row['patient_code'])
                created_patients[row['patient_code']] = patient
            existing = conn.execute('SELECT * FROM form_visit WHERE patient_id=%s AND external_id=%s FOR UPDATE',
                                    (patient['id'], row['visit_external_id'])).fetchone()
            if row['visit_id']:
                if existing is None or str(existing['id']) != row['visit_id']:
                    raise HTTPException(409, 'Liên kết lượt đã đổi; xem trước lại')
                current = visit_access(conn, actor, existing['id'], lock=True)
                if current['revision'] != row['expected_revision'] or current['catalog_revision'] != row['catalog_revision']:
                    raise HTTPException(409, 'Dữ liệu lượt đã thay đổi; xem trước lại')
            else:
                if existing is not None:
                    raise HTTPException(409, 'Lượt nguồn vừa được tạo; xem trước và đối chiếu lại')
                if current_revision != row['catalog_revision']:
                    raise HTTPException(409, 'Danh mục đã đổi; xem trước lại trước khi tạo lượt')
                occurred_at = datetime.fromisoformat(row['source_identity']['admitted_at'])
                check_visit_birth(patient.get('date_of_birth'), occurred_at)
                current = conn.execute('''INSERT INTO form_visit(id,patient_id,external_id,occurred_at,created_by,
                    catalog_revision,definitions_json,demographics_snapshot,snapshot_origin,metadata_json)
                    VALUES(%s,%s,%s,%s,%s,%s,%s,%s,'his_import_creation','{}')
                    ON CONFLICT DO NOTHING RETURNING *''',
                    (uuid4(), patient['id'], row['visit_external_id'], occurred_at, actor.user_id, current_revision,
                     Jsonb(his_definitions(current_definitions)), Jsonb(demographics(patient)))).fetchone()
                if current is None:
                    raise HTTPException(409, 'Lượt nguồn vừa được tạo đồng thời; xem trước lại')
            targets[row['index']] = (patient, current)
        batch_id, outcomes = uuid4(), []
        for row, overrides, _ in selected:
            patient, current = targets[row['index']]
            revision, definitions = pinned_catalog(current)
            changes, sources, skipped = {}, {}, []
            metadata = dict(current.get('metadata_json', {}))
            metadata_changes = 0
            for item in row['fields']:
                status, code = item['status'], item.get('code')
                if status == 'fill' or status == 'conflict' and code in overrides:
                    if code.startswith('@metadata:'):
                        metadata[code.split(':', 1)[1]] = row['values'][code]
                        metadata_changes += 1
                    else:
                        changes[code] = value_for(definitions[code], row['values'][code])
                        sources[code] = {**row['sources'][code], 'actor_id': str(actor.user_id),
                            'recorded_at': datetime.now(timezone.utc).isoformat(), 'batch_id': str(batch_id), 'mapping_version': plan['mapping_version']}
                else:
                    skipped.append({'field': code or item.get('source'), 'reason': status,
                                    **({'raw': item['raw'], 'detail': item.get('reason')} if status == 'raw_pending' else {})})
            # Mixed keep/overwrite choices must also satisfy the metadata contract.
            from .router import VisitMetadata
            try:
                checked = VisitMetadata.model_validate({k: v for k, v in metadata.items() if k in VisitMetadata.model_fields})
            except ValidationError:
                problem('/records/' + str(row['index']) + '/metadata', 'Lựa chọn giữ/ghi đè tạo thông tin lượt không hợp lệ; xem trước và đối chiếu lại')
            check_visit_birth(patient.get('date_of_birth'), current['occurred_at'])
            if checked.admitted_at:
                check_visit_birth(patient.get('date_of_birth'), checked.admitted_at)
            # Never replace or prune older raw evidence. Every source column remains auditable.
            source_row = {**row['raw_source'], 'source_name': plan['source_name'], 'profile': PROFILE}
            source_hash = fingerprint(source_row)
            source_rows = list(metadata.get('his_source_rows', []))
            source_added = not any(fingerprint({k: v for k, v in old.items() if k not in {'batch_id', 'recorded_at'}}) == source_hash for old in source_rows)
            if source_added:
                source_rows.append({**source_row, 'batch_id': str(batch_id), 'recorded_at': datetime.now(timezone.utc).isoformat()})
                metadata['his_source_rows'] = source_rows
                metadata['his_identity'] = row['source_identity']
            new_revision = current['revision']
            if changes or metadata != current.get('metadata_json', {}):
                new_revision = persist(conn, actor, current, revision, definitions, changes, sources, uuid4(), content_hash, metadata=metadata)['revision']
            outcomes.append({'index': row['index'], 'patient_code': row['patient_code'], 'visit_external_id': row['visit_external_id'],
                'visit_id': str(current['id']), 'patient_id': str(patient['id']), 'target_patient_code': patient['code'],
                'target_patient_name': patient['display_name'], 'target_occurred_at': row['target_occurred_at'],
                'new_patient': row['new_patient'], 'new_target': row['new_target'], 'target_action': row['target_action'],
                'written_fields': len(changes) + metadata_changes, 'source_columns_preserved': len(row['raw_source']['columns']),
                'source_recorded': source_added,
                'raw_source': row['raw_source'],
                'source_identity': row['source_identity'], 'skipped': skipped, 'revision': new_revision})
        selected_indices = {r['index'] for r, _, _ in selected}
        result = {'batch_id': str(batch_id), 'written_records': sum(o['written_fields'] > 0 or o['new_target'] or o['source_recorded'] for o in outcomes),
            'written_fields': sum(o['written_fields'] for o in outcomes), 'skipped_fields': sum(len(o['skipped']) for o in outcomes),
            'records': outcomes, 'unselected_records': len(plan['records']) - len(selected),
            'unselected': [{'index': r['index'], 'status': r['status'], 'errors': r['errors']} for r in plan['records'] if r['index'] not in selected_indices],
            'source_kind': 'excel', 'source_name': plan['source_name'], 'mapping_version': plan['mapping_version'],
            'profile': PROFILE, 'replayed': False}
        conn.execute('''INSERT INTO form_import_batch(id,actor_id,source_kind,content_hash,mapping,mapping_version,result)
            VALUES(%s,%s,%s,%s,%s,%s,%s)''', (batch_id, actor.user_id, 'excel', content_hash, Jsonb(plan['mapping']), plan['mapping_version'], Jsonb(result)))
    return result
