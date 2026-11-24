"""Demo patient assignments: admin-managed, permanent until revoked.

Clinical reads lock the patient shared; writes and assignment mutations lock it
exclusively before checking access. Revocation cannot race a clinical write.
"""
from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, Query, Request, Response
from pydantic import BaseModel, ConfigDict, Field, field_validator

from .audit import record_audit_log
from .auth import Principal, get_client_ip, get_request_id, require_role
from .db import compute_pagination, to_iso
from .models import ProblemError, PaginationMeta

router = APIRouter(prefix='/api/v1', tags=['Care assignments'])
admin = require_role('admin', 'care_assignment')
ACTIVE_ASSIGNMENT_SQL = 'ca.revoked_at IS NULL'
ACCESS_EXISTS_SQL = f'''EXISTS (SELECT 1 FROM patient_care_assignment ca
WHERE ca.patient_id=p.id AND ca.doctor_user_id=%s AND {ACTIVE_ASSIGNMENT_SQL})'''


def missing():
    return ProblemError(404, 'RESOURCE_NOT_FOUND', 'Không tìm thấy hồ sơ', 'Không tìm thấy hồ sơ yêu cầu.')


def access_shape(row):
    return {'assignmentId': str(row['id']), 'assignedAt': to_iso(row['assigned_at']), 'assignedBy': str(row['assigned_by'])}


def require_patient_access(conn, patient_id, principal, *, write=False):
    row = conn.execute('SELECT id FROM patient WHERE id=%s FOR ' + ('UPDATE' if write else 'SHARE'),
                       (str(patient_id),)).fetchone()
    if not row:
        raise missing()
    assignment = conn.execute(f'''SELECT ca.* FROM patient_care_assignment ca
        WHERE ca.patient_id=%s AND ca.doctor_user_id=%s AND {ACTIVE_ASSIGNMENT_SQL}''',
        (str(patient_id), str(principal.user_id))).fetchone()
    if not assignment:
        raise missing()
    return access_shape(assignment)


def require_visit_access(conn, visit_id, principal, *, write=False):
    visit = conn.execute('SELECT patient_id FROM visit WHERE id=%s', (str(visit_id),)).fetchone()
    if not visit:
        raise missing()
    return require_patient_access(conn, visit['patient_id'], principal, write=write)


def audit_access(conn, request, principal, action, entity_type, entity_id, detail=None):
    record_audit_log(conn, actor_user_id=principal.user_id, action=action,
                     entity_type=entity_type, entity_id=entity_id,
                     request_id=get_request_id(request), ip=get_client_ip(request), detail=detail)


def create_creator_assignment(conn, patient_id, principal):
    return conn.execute('''INSERT INTO patient_care_assignment
        (patient_id,doctor_user_id,assigned_by,reason) VALUES(%s,%s,%s,'Patient creator assignment') RETURNING *''',
        (str(patient_id), str(principal.user_id), str(principal.user_id))).fetchone()


class Assignment(BaseModel):
    id: UUID
    patientId: UUID
    doctorUserId: UUID
    doctorName: str
    assignedAt: datetime
    assignedBy: UUID
    assignedByName: str
    reason: str | None
    revokedAt: datetime | None
    revokedBy: UUID | None
    revokedByName: str | None


class AssignmentList(BaseModel):
    items: list[Assignment]


class AssignmentBody(BaseModel):
    model_config = ConfigDict(extra='forbid')
    reason: str | None = Field(default=None, max_length=1000)

    @field_validator('reason')
    @classmethod
    def trimmed_reason(cls, value):
        return value.strip() or None if value is not None else None


class AddAssignment(AssignmentBody):
    doctorUserId: UUID


class ReplaceAssignments(AssignmentBody):
    doctorUserIds: list[UUID] = Field(max_length=100)

    @field_validator('doctorUserIds')
    @classmethod
    def unique_ids(cls, values):
        if len(values) != len(set(values)):
            raise ValueError('Danh sách bác sĩ không được trùng ID.')
        return values


class CareDoctor(BaseModel):
    id: UUID
    username: str
    fullName: str


class CareDoctors(BaseModel):
    items: list[CareDoctor]


class AssignedDoctor(BaseModel):
    id: UUID
    fullName: str


class CarePatient(BaseModel):
    id: UUID
    patientCode: str
    fullName: str
    assignedDoctors: list[AssignedDoctor]


class CarePatients(BaseModel):
    items: list[CarePatient]
    pagination: PaginationMeta


def lock_patient(conn, patient_id):
    if not conn.execute('SELECT id FROM patient WHERE id=%s FOR UPDATE', (str(patient_id),)).fetchone():
        raise missing()


def target_doctor(conn, doctor_id):
    if not conn.execute("SELECT id FROM app_user WHERE id=%s AND role='doctor' AND is_active FOR SHARE",
                        (str(doctor_id),)).fetchone():
        raise ProblemError(422, 'CARE_DOCTOR_INVALID', 'Bác sĩ không hợp lệ', 'Cần chọn bác sĩ đang hoạt động.')


def assignment_shape(row):
    return dict(id=str(row['id']), patientId=str(row['patient_id']), doctorUserId=str(row['doctor_user_id']),
                doctorName=row['doctor_name'], assignedAt=to_iso(row['assigned_at']),
                assignedBy=str(row['assigned_by']), assignedByName=row['assigned_by_name'], reason=row['reason'],
                revokedAt=to_iso(row['revoked_at']), revokedBy=str(row['revoked_by']) if row['revoked_by'] else None,
                revokedByName=row['revoked_by_name'])


def assignments(conn, patient_id):
    rows = conn.execute('''SELECT ca.*,u.full_name AS doctor_name,a.full_name AS assigned_by_name,
        r.full_name AS revoked_by_name FROM patient_care_assignment ca
        JOIN app_user u ON u.id=ca.doctor_user_id JOIN app_user a ON a.id=ca.assigned_by
        LEFT JOIN app_user r ON r.id=ca.revoked_by WHERE patient_id=%s ORDER BY assigned_at DESC,ca.id''',
        (str(patient_id),)).fetchall()
    return {'items': [assignment_shape(r) for r in rows]}


def add_assignment(conn, patient_id, doctor_id, reason, request, principal):
    row = conn.execute('''INSERT INTO patient_care_assignment(patient_id,doctor_user_id,assigned_by,reason)
        VALUES(%s,%s,%s,%s) RETURNING id''', (str(patient_id), str(doctor_id), str(principal.user_id), reason)).fetchone()
    audit_access(conn, request, principal, 'care_assignment_add', 'patient', patient_id, {'assignmentId': str(row['id']), 'doctorUserId': str(doctor_id)})
    return row['id']


def revoke_assignment(conn, patient_id, assignment_id, request, principal):
    changed = conn.execute('''UPDATE patient_care_assignment SET revoked_at=clock_timestamp(),revoked_by=%s
        WHERE id=%s AND patient_id=%s AND revoked_at IS NULL RETURNING doctor_user_id''',
        (str(principal.user_id), str(assignment_id), str(patient_id))).fetchone()
    if changed:
        audit_access(conn, request, principal, 'care_assignment_revoke', 'patient', patient_id,
                     {'assignmentId': str(assignment_id), 'doctorUserId': str(changed['doctor_user_id'])})


@router.get('/admin/care/doctors', operation_id='adminListCareDoctors', response_model=CareDoctors)
def doctors(request: Request, principal: Principal = Depends(admin)):
    with request.app.state.pool.connection() as conn:
        rows = conn.execute("SELECT id,username,full_name FROM app_user WHERE role='doctor' AND is_active ORDER BY full_name,id").fetchall()
    return {'items': [{'id': str(r['id']), 'username': r['username'], 'fullName': r['full_name']} for r in rows]}


@router.get('/admin/patients/{patientId}/care-assignments', operation_id='adminListCareAssignments', response_model=AssignmentList)
def list_assignments(patientId: UUID, request: Request, principal: Principal = Depends(admin)):
    with request.app.state.pool.connection() as conn:
        lock_patient(conn, patientId)
        return assignments(conn, patientId)


@router.post('/admin/patients/{patientId}/care-assignments', operation_id='adminAddCareAssignment', status_code=201, response_model=Assignment)
def add(patientId: UUID, body: AddAssignment, request: Request, principal: Principal = Depends(admin)):
    with request.app.state.pool.connection() as conn:
        lock_patient(conn, patientId)
        target_doctor(conn, body.doctorUserId)
        if conn.execute('SELECT id FROM patient_care_assignment WHERE patient_id=%s AND doctor_user_id=%s AND revoked_at IS NULL',
                        (str(patientId), str(body.doctorUserId))).fetchone():
            raise ProblemError(409, 'CARE_ASSIGNMENT_CONFLICT', 'Phân công đã tồn tại', 'Bác sĩ đã được phân công cho hồ sơ này.')
        aid = add_assignment(conn, patientId, body.doctorUserId, body.reason, request, principal)
        return next(a for a in assignments(conn, patientId)['items'] if a['id']==str(aid))


@router.put('/admin/patients/{patientId}/care-assignments', operation_id='adminReplaceCareAssignments', response_model=AssignmentList)
def replace(patientId: UUID, body: ReplaceAssignments, request: Request, principal: Principal = Depends(admin)):
    with request.app.state.pool.connection() as conn:
        lock_patient(conn, patientId)
        for uid in sorted(body.doctorUserIds):
            target_doctor(conn, uid)
        current = conn.execute('SELECT id,doctor_user_id FROM patient_care_assignment WHERE patient_id=%s AND revoked_at IS NULL', (str(patientId),)).fetchall()
        desired = set(body.doctorUserIds)
        active = {r['doctor_user_id'] for r in current}
        for row in current:
            if row['doctor_user_id'] not in desired:
                revoke_assignment(conn, patientId, row['id'], request, principal)
        for uid in sorted(desired-active):
            add_assignment(conn, patientId, uid, body.reason, request, principal)
        return assignments(conn, patientId)


@router.delete('/admin/patients/{patientId}/care-assignments/{assignmentId}', operation_id='adminRevokeCareAssignment', status_code=204)
def revoke(patientId: UUID, assignmentId: UUID, request: Request, principal: Principal = Depends(admin)):
    with request.app.state.pool.connection() as conn:
        lock_patient(conn, patientId)
        if not conn.execute('SELECT id FROM patient_care_assignment WHERE patient_id=%s AND id=%s', (str(patientId), str(assignmentId))).fetchone():
            raise missing()
        revoke_assignment(conn, patientId, assignmentId, request, principal)
    return Response(status_code=204)


@router.get('/admin/care/patients', operation_id='adminListCarePatients', response_model=CarePatients)
def patients(request: Request, q: str = Query(default='', max_length=100), page: int = Query(default=1, ge=1),
             pageSize: int = Query(default=20, ge=1, le=100), principal: Principal = Depends(admin)):
    with request.app.state.pool.connection() as conn:
        params = [f'%{q}%', f'%{q}%']
        where = 'WHERE p.patient_code ILIKE %s OR p.full_name ILIKE %s'
        total = conn.execute(f'SELECT count(*) AS n FROM patient p {where}', params).fetchone()['n']
        rows = conn.execute(f'''SELECT p.id,p.patient_code,p.full_name,
            COALESCE((SELECT jsonb_agg(jsonb_build_object('id',u.id,'fullName',u.full_name) ORDER BY u.full_name,u.id)
                FROM patient_care_assignment ca JOIN app_user u ON u.id=ca.doctor_user_id
                WHERE ca.patient_id=p.id AND {ACTIVE_ASSIGNMENT_SQL}),'[]'::jsonb) AS doctors
            FROM patient p {where} ORDER BY p.patient_code,p.id LIMIT %s OFFSET %s''',
            [*params, pageSize, (page-1)*pageSize]).fetchall()
        return {'items': [{'id': str(r['id']), 'patientCode': r['patient_code'], 'fullName': r['full_name'],
                           'assignedDoctors': r['doctors']} for r in rows], 'pagination': compute_pagination(page, pageSize, total)}
