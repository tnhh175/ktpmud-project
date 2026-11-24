"""Patients & Visits listing/creation endpoints (D2: M2, M3, M4 createVisit)."""
from __future__ import annotations

from datetime import date, datetime, timezone
import re
from typing import Any, Literal
from uuid import UUID

from fastapi import APIRouter, Depends, Header, Query, Request, Response

from .audit import record_audit_log
from .care import (ACTIVE_ASSIGNMENT_SQL, ACCESS_EXISTS_SQL, access_shape,
                   create_creator_assignment, require_patient_access)
from .auth import Principal, get_client_ip, get_request_id, require_role
from .db import compute_pagination, num_to_json, parse_if_match, to_date_iso, to_iso
from .models import (
    CreatePatientRequest,
    CreateVisitRequest,
    Patient,
    PatientDetailResponse,
    PatientListResponse,
    ProblemError,
    UpdatePatientRequest,
    Visit,
    VisitListResponse,
)


router = APIRouter(prefix="/api/v1", tags=["Patients"])

_require_doctor_patient = require_role("doctor", "patient")
_require_doctor_visit = require_role("doctor", "visit")


def patient_row_to_dict(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": str(row["id"]),
        "patientCode": row["patient_code"],
        "access": row.get("access"),
        "updatedBy": str(row.get("updated_by") or row["created_by"]),
        "updatedByName": row.get("editor_name") or row.get("creator_name"),
        "externalPatientCode": row.get("external_patient_code"),
        "fullName": row["full_name"],
        "sex": row["sex"],
        "birthDate": to_date_iso(row.get("birth_date")),
        "birthYear": int(row["birth_year"]) if row.get("birth_year") is not None else None,
        "declaredAge": int(row["declared_age"]) if row.get("declared_age") is not None else None,
        "rowVersion": int(row["row_version"]),
        "createdBy": str(row["created_by"]),
        "createdAt": to_iso(row["created_at"]),
        "updatedAt": to_iso(row["updated_at"]),
    }


def visit_row_to_dict(row: dict[str, Any]) -> dict[str, Any]:
    rev_no = int(row["current_revision_no"])
    if row.get("max_revision_no") is not None:
        rev_no = max(rev_no, int(row["max_revision_no"]))
    return {
        "id": str(row["id"]),
        "visitCode": row["visit_code"],
        "performedBy": str(row["created_by"]),
        "performedByName": row.get("creator_name"),
        "updatedBy": str(row.get("updated_by") or row["created_by"]),
        "updatedByName": row.get("editor_name") or row.get("creator_name"),
        "externalVisitCode": row.get("external_visit_code"),
        "patientId": str(row["patient_id"]),
        "formVersionId": str(row["form_version_id"]),
        "formVersionLabel": row.get("form_version_label"),
        "visitDate": to_iso(row["visit_date"]),
        "visitType": row["visit_type"],
        "chiefComplaint": row.get("chief_complaint"),
        "clinicalNote": row.get("clinical_note"),
        "infoSource": row.get("info_source"),
        "medicationListState": row.get("medication_list_state", "unknown"),
        "allergyListState": row.get("allergy_list_state", "unknown"),
        "diagnosisListState": row.get("diagnosis_list_state", "unknown"),
        "status": row["status"],
        "currentRevisionNo": rev_no,
        "createdBy": str(row["created_by"]),
        "createdAt": to_iso(row["created_at"]),
        "updatedAt": to_iso(row["updated_at"]),
        "confirmedAt": to_iso(row.get("confirmed_at")),
        "confirmedBy": str(row["confirmed_by"]) if row.get("confirmed_by") is not None else None,
        "confirmNote": row.get("confirm_note"),
        "rowVersion": int(row["row_version"]),
    }


def bp_row_to_dict(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": str(row["id"]),
        "visitId": str(row["visit_id"]),
        "position": row["position"],
        "minuteAfter": int(row["minute_after"]) if row.get("minute_after") is not None else None,
        "systolic": int(row["systolic"]),
        "diastolic": int(row["diastolic"]),
        "heartRate": int(row["heart_rate"]) if row.get("heart_rate") is not None else None,
        "measuredAt": to_iso(row["measured_at"]),
        "note": row.get("note"),
        "createdAt": to_iso(row["created_at"]),
    }


def med_row_to_dict(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "atcCode": row.get("atc_code"),
        "id": str(row["id"]),
        "visitId": str(row["visit_id"]),
        "medicationGroup": row["medication_group"],
        "drugName": row["drug_name"],
        "activeIngredient": row.get("active_ingredient"),
        "strength": row.get("strength"),
        "dose": num_to_json(row.get("dose"), "number"),
        "unit": row.get("unit"),
        "frequency": row.get("frequency"),
        "route": row.get("route"),
        "status": row["status"],
        "startedAt": to_date_iso(row.get("started_at")),
        "note": row.get("note"),
        "createdAt": to_iso(row["created_at"]),
    }


def allergy_row_to_dict(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "atcCode": row.get("atc_code"),
        "id": str(row["id"]),
        "visitId": str(row["visit_id"]),
        "kind": row["kind"],
        "agentCategory": row["agent_category"],
        "allergen": row["allergen"],
        "reaction": row.get("reaction"),
        "severity": row["severity"],
        "recordedAt": to_iso(row.get("recorded_at")),
        "note": row.get("note"),
        "createdAt": to_iso(row["created_at"]),
    }


def _validate_patient_fields(
    *,
    full_name: str,
    birth_date: date | None,
    birth_year: int | None,
    declared_age: int | None,
) -> None:
    errors: list[dict[str, Any]] = []
    if len(full_name.strip()) < 2:
        errors.append(
            {
                "fieldCode": "fullName",
                "sectionCode": "hanh_chinh",
                "message": "Họ tên / ký hiệu hồ sơ phải có ít nhất 2 ký tự.",
                "rejectedValue": full_name,
            }
        )
    non_null_precisions = sum(
        1 for x in (birth_date, birth_year, declared_age) if x is not None
    )
    if non_null_precisions > 1:
        errors.append(
            {
                "fieldCode": "birthDate",
                "sectionCode": "hanh_chinh",
                "message": "Chỉ được chọn tối đa một mức chính xác (ngày sinh, năm sinh hoặc tuổi khai báo).",
                "rejectedValue": None,
            }
        )
    if birth_date is not None:
        if birth_date < date(1900, 1, 1) or birth_date > date.today():
            errors.append(
                {
                    "fieldCode": "birthDate",
                    "sectionCode": "hanh_chinh",
                    "message": "Ngày sinh phải từ 1900-01-01 đến không vượt quá ngày hiện tại.",
                    "rejectedValue": birth_date.isoformat(),
                }
            )
    if birth_year is not None and not (1900 <= birth_year <= 2100):
        errors.append(
            {
                "fieldCode": "birthYear",
                "sectionCode": "hanh_chinh",
                "message": "Năm sinh phải nằm trong khoảng 1900–2100.",
                "rejectedValue": birth_year,
            }
        )
    if declared_age is not None and not (0 <= declared_age <= 120):
        errors.append(
            {
                "fieldCode": "declaredAge",
                "sectionCode": "hanh_chinh",
                "message": "Tuổi khai báo phải nằm trong khoảng 0–120.",
                "rejectedValue": declared_age,
            }
        )
    if errors:
        raise ProblemError(
            422,
            "FIELD_VALIDATION_FAILED",
            "Dữ liệu hành chính không hợp lệ",
            errors[0]["message"],
            errors=errors,
        )


@router.get(
    "/patients",
    operation_id="listPatients",
    response_model=PatientListResponse,
)
def list_patients(
    request: Request,
    q: str | None = Query(default=None, max_length=100),
    latestVisitStatus: Literal["draft", "confirmed", "none"] | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    pageSize: int = Query(default=20, ge=1, le=100),
    principal: Principal = Depends(_require_doctor_patient),
) -> dict[str, Any]:
    pool = request.app.state.pool
    where_clauses: list[str] = [ACCESS_EXISTS_SQL]
    params: list[Any] = [str(principal.user_id)]

    if q and q.strip():
        like = f"%{q.strip()}%"
        where_clauses.append(
            "(p.patient_code ILIKE %s OR p.full_name ILIKE %s OR COALESCE(p.external_patient_code, '') ILIKE %s)"
        )
        params.extend([like, like, like])

    if latestVisitStatus is not None:
        where_clauses.append("COALESCE(lv.status::text, 'none') = %s")
        params.append(latestVisitStatus)

    where_sql = f"WHERE {' AND '.join(where_clauses)}" if where_clauses else ""

    base_from = f"""
        FROM patient p
        JOIN app_user pc ON pc.id=p.created_by
        JOIN app_user pu ON pu.id=COALESCE(p.updated_by,p.created_by)
        LEFT JOIN LATERAL (
            SELECT v.id, v.visit_code, v.visit_date, v.status
            FROM visit v
            WHERE v.patient_id = p.id
            ORDER BY v.visit_date DESC, v.created_at DESC
            LIMIT 1
        ) lv ON true
        LEFT JOIN LATERAL (
            SELECT count(*)::int AS visit_count
            FROM visit v2
            WHERE v2.patient_id = p.id
        ) vc ON true
        {where_sql}
    """

    with pool.connection() as conn:
        total_row = conn.execute(
            f"SELECT count(*)::int AS cnt {base_from}",
            params,
        ).fetchone()
        total_items = int(total_row["cnt"]) if total_row else 0

        offset = (page - 1) * pageSize
        rows = conn.execute(
            f"""
            SELECT
                p.*, pc.full_name AS creator_name, pu.full_name AS editor_name,
                (SELECT jsonb_build_object('assignmentId',ca.id,'assignedAt',ca.assigned_at,'assignedBy',ca.assigned_by)
                 FROM patient_care_assignment ca WHERE ca.patient_id=p.id AND ca.doctor_user_id=%s
                 AND {ACTIVE_ASSIGNMENT_SQL}
                 LIMIT 1) AS access,
                COALESCE(vc.visit_count, 0) AS visit_count,
                lv.id AS latest_visit_id,
                lv.visit_code AS latest_visit_code,
                lv.visit_date AS latest_visit_date,
                COALESCE(lv.status::text, 'none') AS latest_visit_status
            {base_from}
            ORDER BY p.updated_at DESC, p.patient_code DESC
            LIMIT %s OFFSET %s
            """,
            [str(principal.user_id), *params, pageSize, offset],
        ).fetchall()

    items = [
        {
            "patient": patient_row_to_dict(r),
            "visitCount": int(r["visit_count"]),
            "latestVisitId": str(r["latest_visit_id"]) if r["latest_visit_id"] is not None else None,
            "latestVisitCode": r["latest_visit_code"],
            "latestVisitDate": to_iso(r["latest_visit_date"]),
            "latestVisitStatus": r["latest_visit_status"],
        }
        for r in rows
    ]
    return {
        "items": items,
        "pagination": compute_pagination(page, pageSize, total_items),
    }


@router.post(
    "/patients",
    operation_id="createPatient",
    response_model=Patient,
    status_code=201,
)
def create_patient(
    body: CreatePatientRequest,
    request: Request,
    response: Response,
    principal: Principal = Depends(_require_doctor_patient),
) -> dict[str, Any]:
    full_name = body.fullName.strip()
    _validate_patient_fields(
        full_name=full_name,
        birth_date=body.birthDate,
        birth_year=body.birthYear,
        declared_age=body.declaredAge,
    )
    ext_code = body.externalPatientCode.strip() if body.externalPatientCode else None

    pool = request.app.state.pool
    req_id = get_request_id(request)
    ip_addr = get_client_ip(request)

    with pool.connection() as conn:
        conn.execute("SELECT pg_advisory_xact_lock(hashtext('patient_code_seq'))")
        seq_row = conn.execute(
            """
            SELECT COALESCE(MAX(CAST(substring(patient_code FROM 4) AS integer)), 0) + 1 AS next_seq
            FROM patient
            WHERE patient_code ~ '^BN-[0-9]{5}$'
            """
        ).fetchone()
        next_seq = int(seq_row["next_seq"])
        patient_code = f"BN-{next_seq:05d}"

        row = conn.execute(
            """
            INSERT INTO patient (
                patient_code, external_patient_code, full_name, sex,
                birth_date, birth_year, declared_age, created_by
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING *
            """,
            (
                patient_code,
                ext_code,
                full_name,
                body.sex,
                body.birthDate,
                body.birthYear,
                body.declaredAge,
                str(principal.user_id),
            ),
        ).fetchone()

        row["creator_name"] = principal.full_name
        row["access"] = access_shape(create_creator_assignment(conn, row["id"], principal))
        record_audit_log(
            conn,
            actor_user_id=principal.user_id,
            action="patient_create",
            entity_type="patient",
            entity_id=row["id"],
            ip=ip_addr,
            request_id=req_id,
            outcome="success",
            detail={"patientCode": patient_code},
        )
        conn.commit()

    response.headers["ETag"] = f'"{int(row["row_version"])}"'
    return patient_row_to_dict(row)


@router.get(
    "/patients/{patientId}",
    operation_id="getPatient",
    response_model=PatientDetailResponse,
)
def get_patient(
    patientId: UUID,
    request: Request,
    response: Response,
    principal: Principal = Depends(_require_doctor_patient),
) -> dict[str, Any]:
    pool = request.app.state.pool
    with pool.connection() as conn:
        access = require_patient_access(conn, patientId, principal, write=False)
        pt = conn.execute(
            """SELECT p.*,pc.full_name AS creator_name,pu.full_name AS editor_name
            FROM patient p JOIN app_user pc ON pc.id=p.created_by
            JOIN app_user pu ON pu.id=COALESCE(p.updated_by,p.created_by) WHERE p.id=%s""",
            (str(patientId),),
        ).fetchone()
        if not pt:
            raise ProblemError(
                404,
                "RESOURCE_NOT_FOUND",
                "Không tìm thấy hồ sơ bệnh nhân",
                "Không tồn tại hồ sơ bệnh nhân với mã định danh yêu cầu.",
            )

        ref_visit = conn.execute(
            """
            SELECT v.*, fv.version_label AS form_version_label
            FROM visit v
            JOIN form_version fv ON fv.id = v.form_version_id
            WHERE v.patient_id = %s
            ORDER BY (v.status = 'confirmed') DESC, v.visit_date DESC, v.created_at DESC
            LIMIT 1
            """,
            (str(patientId),),
        ).fetchone()

        summary: dict[str, Any] | None = None
        if ref_visit:
            anthro = conn.execute(
                """
                SELECT fd.code, vv.value_num
                FROM visit_value vv
                JOIN field_definition fd ON fd.id = vv.field_definition_id
                WHERE vv.visit_id = %s
                  AND vv.value_state = 'answered'
                  AND fd.code IN ('chieu_cao_cm', 'can_nang_kg')
                """,
                (str(ref_visit["id"]),),
            ).fetchall()
            anthro_map = {r["code"]: num_to_json(r["value_num"], "number") for r in anthro}
            height_cm = anthro_map.get("chieu_cao_cm")
            weight_kg = anthro_map.get("can_nang_kg")
            bmi = None
            if height_cm is not None and weight_kg is not None and height_cm > 0 and weight_kg > 0:
                h_m = float(height_cm) / 100.0
                bmi = round(float(weight_kg) / (h_m * h_m), 2)

            bp_row = conn.execute(
                """
                SELECT *
                FROM visit_orthostatic_bp
                WHERE visit_id = %s
                ORDER BY measured_at DESC, created_at DESC
                LIMIT 1
                """,
                (str(ref_visit["id"]),),
            ).fetchone()
            med_rows = conn.execute(
                """
                SELECT *
                FROM visit_medication
                WHERE visit_id = %s
                ORDER BY created_at ASC, id ASC
                """,
                (str(ref_visit["id"]),),
            ).fetchall()
            alg_rows = conn.execute(
                """
                SELECT *
                FROM visit_allergy
                WHERE visit_id = %s
                ORDER BY created_at ASC, id ASC
                """,
                (str(ref_visit["id"]),),
            ).fetchall()

            summary = {
                "sourceVisitId": str(ref_visit["id"]),
                "sourceVisitCode": ref_visit["visit_code"],
                "sourceVisitDate": to_iso(ref_visit["visit_date"]),
                "sourceVisitStatus": ref_visit["status"],
                "sourceFormVersionId": str(ref_visit["form_version_id"]),
                "sourceFormVersionLabel": ref_visit["form_version_label"],
                "sourceRowVersion": int(ref_visit["row_version"]),
                "heightCm": height_cm,
                "weightKg": weight_kg,
                "bmi": bmi,
                "latestBp": bp_row_to_dict(bp_row) if bp_row else None,
                "recordedMedications": [med_row_to_dict(m) for m in med_rows],
                "recordedAllergies": [allergy_row_to_dict(a) for a in alg_rows],
            }

        pt["access"] = access

    response.headers["ETag"] = f'"{int(pt["row_version"])}"'
    return {
        "patient": patient_row_to_dict(pt),
        "latestVisitSummary": summary,
    }


@router.patch(
    "/patients/{patientId}",
    operation_id="updatePatient",
    response_model=Patient,
)
def update_patient(
    patientId: UUID,
    body: UpdatePatientRequest,
    request: Request,
    response: Response,
    if_match: str | None = Header(default=None, alias="If-Match"),
    principal: Principal = Depends(_require_doctor_patient),
) -> dict[str, Any]:
    pool = request.app.state.pool
    with pool.connection() as conn:
        access = require_patient_access(conn, patientId, principal, write=True)
        pt = conn.execute(
            "SELECT * FROM patient WHERE id = %s FOR UPDATE",
            (str(patientId),),
        ).fetchone()
        if not pt:
            raise ProblemError(
                404,
                "RESOURCE_NOT_FOUND",
                "Không tìm thấy hồ sơ bệnh nhân",
                "Không tồn tại hồ sơ bệnh nhân với mã định danh yêu cầu.",
            )

        extra = body.model_extra or {}
        if "patientCode" in extra and extra["patientCode"] != pt["patient_code"]:
            raise ProblemError(
                422,
                "IMMUTABLE_PATIENT_CODE",
                "Mã bệnh nhân là bất biến",
                "Không được phép chỉnh sửa mã hồ sơ BN-xxxxx sau khi cấp (chốt K10).",
                errors=[
                    {
                        "fieldCode": "patientCode",
                        "sectionCode": "hanh_chinh",
                        "message": "patientCode không thể thay đổi.",
                        "rejectedValue": extra["patientCode"],
                    }
                ],
            )

        current_rv = int(pt["row_version"])
        expected_rv = parse_if_match(
            if_match, body.rowVersion, current_row_version=current_rv
        )
        if expected_rv != current_rv:
            raise ProblemError(
                409,
                "CONCURRENCY_ROW_VERSION_MISMATCH",
                "Xung đột phiên bản dữ liệu (409)",
                f"Hồ sơ bệnh nhân đã được cập nhật lên rowVersion {current_rv} ở phiên khác. Vui lòng tải lại.",
                current_row_version=current_rv,
            )

        fset = body.model_fields_set
        new_full_name = (
            body.fullName.strip() if "fullName" in fset and body.fullName is not None else pt["full_name"]
        )
        new_sex = body.sex if "sex" in fset and body.sex is not None else pt["sex"]
        new_ext_code = (
            (body.externalPatientCode.strip() if body.externalPatientCode else None)
            if "externalPatientCode" in fset
            else pt["external_patient_code"]
        )

        # Precision mutex handling for partial PATCH updates
        explicit_non_null = [
            k
            for k in ("birthDate", "birthYear", "declaredAge")
            if k in fset and getattr(body, k) is not None
        ]
        if len(explicit_non_null) > 1:
            _validate_patient_fields(
                full_name=new_full_name,
                birth_date=body.birthDate,
                birth_year=body.birthYear,
                declared_age=body.declaredAge,
            )

        if len(explicit_non_null) == 1:
            chosen = explicit_non_null[0]
            new_birth_date = body.birthDate if chosen == "birthDate" else None
            new_birth_year = body.birthYear if chosen == "birthYear" else None
            new_declared_age = body.declaredAge if chosen == "declaredAge" else None
        else:
            new_birth_date = body.birthDate if "birthDate" in fset else pt["birth_date"]
            new_birth_year = body.birthYear if "birthYear" in fset else pt["birth_year"]
            new_declared_age = body.declaredAge if "declaredAge" in fset else pt["declared_age"]

        _validate_patient_fields(
            full_name=new_full_name,
            birth_date=new_birth_date,
            birth_year=new_birth_year,
            declared_age=new_declared_age,
        )

        updated = conn.execute(
            """
            UPDATE patient
            SET updated_by = %s,
                full_name = %s,
                sex = %s,
                birth_date = %s,
                birth_year = %s,
                declared_age = %s,
                external_patient_code = %s,
                row_version = row_version + 1
            WHERE id = %s AND row_version = %s
            RETURNING *
            """,
            (
                str(principal.user_id),
                new_full_name,
                new_sex,
                new_birth_date,
                new_birth_year,
                new_declared_age,
                new_ext_code,
                str(patientId),
                current_rv,
            ),
        ).fetchone()
        conn.commit()

    response.headers["ETag"] = f'"{int(updated["row_version"])}"'
    updated["editor_name"] = principal.full_name
    updated["access"] = access
    return patient_row_to_dict(updated)


@router.get(
    "/patients/{patientId}/visits",
    operation_id="listPatientVisits",
    response_model=VisitListResponse,
)
def list_patient_visits(
    patientId: UUID,
    request: Request,
    status: Literal["draft", "confirmed"] | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    pageSize: int = Query(default=20, ge=1, le=100),
    principal: Principal = Depends(_require_doctor_visit),
) -> dict[str, Any]:
    pool = request.app.state.pool
    with pool.connection() as conn:
        access = require_patient_access(conn, patientId, principal, write=False)
        pt_exists = conn.execute(
            "SELECT 1 FROM patient WHERE id = %s",
            (str(patientId),),
        ).fetchone()
        if not pt_exists:
            raise ProblemError(
                404,
                "RESOURCE_NOT_FOUND",
                "Không tìm thấy hồ sơ bệnh nhân",
                "Hồ sơ bệnh nhân không tồn tại.",
            )

        where = ["v.patient_id = %s"]
        params: list[Any] = [str(patientId)]
        if status is not None:
            where.append("v.status = %s::visit_status")
            params.append(status)
        where_sql = " AND ".join(where)

        total_row = conn.execute(
            f"SELECT count(*)::int AS cnt FROM visit v WHERE {where_sql}",
            params,
        ).fetchone()
        total_items = int(total_row["cnt"]) if total_row else 0

        offset = (page - 1) * pageSize
        rows = conn.execute(
            f"""
            SELECT
                v.*, pc.full_name AS creator_name, pu.full_name AS editor_name,
                fv.version_label AS form_version_label,
                (SELECT MAX(vr.revision_no) FROM visit_revision vr WHERE vr.visit_id = v.id) AS max_revision_no
            FROM visit v
            JOIN app_user pc ON pc.id=v.created_by
            JOIN app_user pu ON pu.id=COALESCE(v.updated_by,v.created_by)
            JOIN form_version fv ON fv.id = v.form_version_id
            WHERE {where_sql}
            ORDER BY v.visit_date DESC, v.created_at DESC
            LIMIT %s OFFSET %s
            """,
            [*params, pageSize, offset],
        ).fetchall()

    return {
        "items": [visit_row_to_dict(r) for r in rows],
        "pagination": compute_pagination(page, pageSize, total_items),
    }


@router.post(
    "/patients/{patientId}/visits",
    operation_id="createVisit",
    response_model=Visit,
    status_code=201,
)
def create_visit(
    patientId: UUID,
    body: CreateVisitRequest,
    request: Request,
    response: Response,
    principal: Principal = Depends(_require_doctor_visit),
) -> dict[str, Any]:
    pool = request.app.state.pool
    visit_dt = body.visitDate
    if visit_dt.tzinfo is None:
        visit_dt = visit_dt.replace(tzinfo=timezone.utc)
    else:
        visit_dt = visit_dt.astimezone(timezone.utc)
    date_part = visit_dt.strftime("%Y%m%d")
    prefix = f"LK-{date_part}-"

    with pool.connection() as conn:
        access = require_patient_access(conn, patientId, principal, write=True)
        pt = conn.execute(
            "SELECT id FROM patient WHERE id = %s",
            (str(patientId),),
        ).fetchone()
        if not pt:
            raise ProblemError(
                404,
                "RESOURCE_NOT_FOUND",
                "Không tìm thấy hồ sơ bệnh nhân",
                "Hồ sơ bệnh nhân không tồn tại.",
            )

        published = conn.execute(
            """
            SELECT id, version_label
            FROM form_version
            WHERE status = 'published'
            ORDER BY version_no DESC
            LIMIT 1
            """
        ).fetchone()
        if not published:
            raise ProblemError(
                409,
                "NO_PUBLISHED_FORM_VERSION",
                "Chưa có phiên bản biểu mẫu đang phát hành",
                "Hệ thống chưa có phiên bản biểu mẫu ở trạng thái published để tạo lượt khám.",
            )

        conn.execute("SELECT pg_advisory_xact_lock(hashtext('visit_code_seq'))")
        existing_codes = conn.execute(
            "SELECT visit_code FROM visit WHERE visit_code LIKE %s",
            (f"{prefix}%",),
        ).fetchall()
        max_seq = 0
        pattern = re.compile(r"^" + re.escape(prefix) + r"(\d+)$")
        for r in existing_codes:
            m = pattern.match(r["visit_code"])
            if m:
                max_seq = max(max_seq, int(m.group(1)))
        visit_code = f"{prefix}{max_seq + 1:02d}"

        row = conn.execute(
            """
            INSERT INTO visit (
                visit_code, external_visit_code, patient_id, form_version_id,
                visit_date, visit_type, chief_complaint, status,
                current_revision_no, created_by
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, 'draft', 1, %s)
            RETURNING *
            """,
            (
                visit_code,
                body.externalVisitCode,
                str(patientId),
                str(published["id"]),
                visit_dt,
                body.visitType,
                body.chiefComplaint,
                str(principal.user_id),
            ),
        ).fetchone()
        conn.commit()

    row_dict = dict(row)
    row_dict["form_version_label"] = published["version_label"]
    row_dict["creator_name"] = principal.full_name
    response.headers["ETag"] = f'"{int(row["row_version"])}"'
    return visit_row_to_dict(row_dict)
