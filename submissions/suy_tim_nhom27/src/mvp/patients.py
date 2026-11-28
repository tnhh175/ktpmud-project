"""Patients & Visits listing/creation endpoints (D2: M2, M3, M4 createVisit)."""
from __future__ import annotations

from datetime import date, datetime, timezone
import re
from typing import Any, Literal
from uuid import UUID

from fastapi import APIRouter, Depends, Header, Query, Request, Response

from .audit import record_audit_log
from .care import ACCESS_EXISTS_SQL, has_record_status_schema, require_patient_access
from .auth import Principal, get_client_ip, get_request_id, require_role
from .db import compute_pagination, num_to_json, parse_if_match, to_date_iso, to_iso
from .models import (
    CreatePatientRecordRequest,
    CreatePatientRequest,
    CreateVisitRequest,
    Patient,
    PatientDetailResponse,
    PatientListResponse,
    PatientRecordRequestItem,
    PatientRecordRequestListResponse,
    ProblemError,
    UpdatePatientRequest,
    Visit,
    VisitListResponse,
)


router = APIRouter(prefix="/api/v1", tags=["Patients"])



# Display flags follow the supplied rule-base; no invented Na/HbA1c cutoff.
SUMMARY_LABS = (
    ('cls_nt_probnp','NT-proBNP','pg/mL',125,None,True),
    ('cls_bnp','BNP','pg/mL',35,None,True),
    ('cls_lvef','LVEF','%',None,50,False),
    ('cls_creatinin','Creatinin','µmol/L',221,None,False),
    ('egfr_ckd_epi','eGFR','mL/min/1.73m²',None,30,False),
    ('cls_kali','K','mmol/L',5.0,None,False),
    ('cls_natri','Na','mmol/L',None,None,False),
    ('cls_hba1c','HbA1c','%',None,None,False),
)


def patient_has_visits(conn, patient_id):
    return bool(conn.execute('SELECT 1 FROM visit WHERE patient_id=%s LIMIT 1', (patient_id,)).fetchone())


def latest_visit_summary(conn, patient_id, principal):
    ref = conn.execute("""SELECT v.*,fv.version_label AS form_version_label FROM visit v
      JOIN form_version fv ON fv.id=v.form_version_id WHERE v.patient_id=%s
      AND (v.status='confirmed' OR (v.status='in_progress' AND v.assigned_doctor_id=%s))
      ORDER BY (v.status='confirmed') DESC,v.visit_date DESC,v.created_at DESC,v.id LIMIT 1""",
      (str(patient_id),str(principal.user_id))).fetchone()
    if not ref:
        return None
    values = conn.execute("""SELECT fd.code,vv.*,fo.option_code FROM visit_value vv
      JOIN field_definition fd ON fd.id=vv.field_definition_id
      LEFT JOIN field_option fo ON fo.id=vv.field_option_id WHERE vv.visit_id=%s""",(ref['id'],)).fetchall()
    by_code = {r['code']:r for r in values}
    projected = {}
    if ref['form_version_label'] == 'v2.0':
        from .workflow import source_fields
        projected = source_fields(conn, ref)
    def answer(code):
        if code == 'egfr_ckd_epi' and code in projected:
            obj = projected[code]
            return obj.get('value') if obj.get('value_state') == 'answered' else None
        row = by_code.get(code)
        if not row or row['value_state']!='answered':
            return None
        obj = row.get('answer')
        if obj is not None:
            return obj.get('value') if obj.get('value_state')=='answered' else None
        return next((row[k] for k in ('value_num','value_text','value_bool','value_date','option_code')
                     if row.get(k) is not None),None)
    decisions = {}
    if conn.execute("SELECT to_regclass('public.ai_module_decision') AS r").fetchone()['r']:
        decisions = {r['module']:r for r in conn.execute("""SELECT module,source,effective_output
          FROM ai_module_decision WHERE visit_id=%s AND superseded_at IS NULL""",(ref['id'],)).fetchall()}
    from .his_v2.rules import effective_diagnosis
    m1 = decisions.get('m1', {})
    m2 = decisions.get('m2', {})
    m2_output = m2.get('effective_output') or {}
    output = effective_diagnosis({'effective_m1': m1.get('effective_output'), 'effective_m2': m2_output})
    diagnosis_source = (m2 if 'stage' in m2_output else m1).get('source')
    stage = output.get('stage')
    if stage not in ('A','B','C','D'):
        stage = None
    phenotype = output.get('kieu_hinh_ef')
    if phenotype not in ('HFrEF','HFmrEF','HFpEF'):
        phenotype = None
    # Explicit doctor classification is also valid on pinned pre-workflow forms.
    if not stage and 'stage' not in m2_output:
        raw = answer('chan_doan_stage_suy_tim') or answer('chan_doan_giai_doan_suy_tim')
        stage = raw.upper().removeprefix('STAGE_') if isinstance(raw,str) else None
        if stage not in ('A','B','C','D'): stage = None
    if not phenotype and 'stage' not in m2_output:
        raw = answer('chan_doan_kieu_hinh_ef')
        phenotype = {'hfref':'HFrEF','hfmref':'HFmrEF','hfpef':'HFpEF'}.get(str(raw).lower())
    labs = conn.execute('SELECT * FROM visit_lab_result WHERE visit_id=%s ORDER BY measured_at DESC,created_at DESC,id',
                        (ref['id'],)).fetchall()
    key_labs = []
    for code,label,unit,high,low,inclusive in SUMMARY_LABS:
        aliases = (code,'cls_egfr') if code=='egfr_ckd_epi' else (code,)
        lab = next((r for r in labs if r['lab_code'] in aliases and r['value_num'] is not None),None)
        if code == 'egfr_ckd_epi' and projected:
            lab = None  # v2 eGFR always follows the current creatinine sources.
        value = num_to_json(lab['value_num']) if lab else next((answer(c) for c in aliases if answer(c) is not None),None)
        if not isinstance(value,(int,float)) and value is not None:
            try: value = float(value)
            except (TypeError,ValueError): value = None
        if value is None:
            continue
        value = float(value)
        flag = ('high' if high is not None and (value>=high if inclusive else value>high)
                else 'low' if low is not None and value<low else None)
        obj = projected.get(code) or (by_code.get(code) or {}).get('answer') or {}
        measured = to_iso(lab['measured_at']) if lab else obj.get('measuredAt',obj.get('measured_at'))
        key_labs.append(dict(code=code,label=label,value=value,unit=lab['unit'] if lab else obj.get('unit') or unit,
                             measuredAt=measured,flag=flag))
    group_labels = {'ACEI':'ACE-I','ARB':'ARB','ARNI':'ARNI','beta_blocker':'Chẹn beta','MRA':'MRA',
                    'SGLT2i':'SGLT2','loop_diuretic':'Lợi tiểu quai','NSAID':'NSAIDs',
                    'corticosteroid':'Corticoid','TZD':'TZD','class_I_antiarrhythmic':'Chống loạn nhịp nhóm I','other':'Khác'}
    from .workflow import medication_class
    meds = []
    for row in conn.execute("SELECT * FROM visit_medication WHERE visit_id=%s AND status='active' ORDER BY created_at,id",
                            (ref['id'],)).fetchall():
        group = medication_class(row.get('active_ingredient'),row.get('medication_group'),row.get('atc_code'))
        from .his_v2.medications import classify
        group = group or classify(row['drug_name']).get('group')
        meds.append(dict(name=row['drug_name'],group=group,groupLabel=group_labels.get(group),
                         pillar=group in ('ACEI','ARB','ARNI','beta_blocker','MRA','SGLT2i'),
                         caution=group in ('NSAID','corticosteroid','TZD','class_I_antiarrhythmic')))
    # Structured workflow medications are canonical when present.
    structured = answer('medications')
    if isinstance(structured,list):
        meds = []
        for item in structured:
            from .his_v2.medications import classify
            group = (classify(item['name']).get('group') if item.get('name') else
                     item.get('class') or medication_class(item.get('ingredientCode'),item.get('therapeuticGroup'),item.get('atcCode')))
            group = group or classify(item.get('name') or item.get('drugName') or item.get('ingredient') or '').get('group')
            meds.append(dict(name=item.get('name') or item.get('drugName') or item.get('ingredientCode') or item.get('ingredient'),
                group=group,groupLabel=group_labels.get(group),pillar=group in ('ACEI','ARB','ARNI','beta_blocker','MRA','SGLT2i'),
                caution=group in ('NSAID','corticosteroid','TZD','class_I_antiarrhythmic')))
    alerts = (decisions.get('m4',{}).get('effective_output') or {}).get('canh_bao',[])
    return dict(sourceVisitId=str(ref['id']),sourceVisitCode=ref['visit_code'],sourceVisitDate=to_iso(ref['visit_date']),
        sourceVisitStatus=ref['status'],sourceFormVersionId=str(ref['form_version_id']),
        sourceFormVersionLabel=ref['form_version_label'],sourceRowVersion=ref['row_version'],
        hfStage=dict(code=stage,label='Giai đoạn '+stage if stage else 'Chưa phân loại',source=(diagnosis_source or 'manual') if stage else None),
        efPhenotype=dict(code=phenotype,label=phenotype or 'Chưa phân loại'),keyLabs=key_labs,medications=meds,
        openAlerts=[dict(ruleId=a.get('ruleId') or a.get('rule_id') or a.get('id'),
                         severity=a.get('severity') or a.get('muc_do'),message=a.get('message') or a.get('noi_dung')) for a in alerts])


def patient_row_to_dict(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": str(row["id"]),
        "patientCode": row["patient_code"],
        "access": row.get("access"),
        "updatedBy": str(row.get("updated_by") or row["created_by"]),
        "updatedByName": row.get("editor_name") or row.get("creator_name"),
        "externalPatientCode": row.get("external_patient_code"),
        "cccd": row.get("cccd"),
        "fullName": row["full_name"],
        "sex": row["sex"],
        "birthDate": to_date_iso(row.get("birth_date")),
        "birthYear": int(row["birth_year"]) if row.get("birth_year") is not None else None,
        "declaredAge": int(row["declared_age"]) if row.get("declared_age") is not None else None,
        "recordStatus": row.get("record_status") or "active",
        "recordStatusUpdatedAt": to_iso(row.get("record_status_updated_at")),
        "recordStatusUpdatedBy": str(row["record_status_updated_by"]) if row.get("record_status_updated_by") else None,
        "recordStatusUpdatedByName": row.get("record_status_updated_by_name"),
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
        "performedBy": str(row.get("assigned_doctor_id") or row["created_by"]),
        "performedByName": row.get("assigned_doctor_name") if row.get("assigned_doctor_id") else row.get("creator_name"),
        "performedByRole": 'doctor' if row.get("assigned_doctor_id") else row.get("creator_role"),
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
        "assignedDoctorId": str(row["assigned_doctor_id"]) if row.get("assigned_doctor_id") else None,
        "claimedAt": to_iso(row.get("claimed_at")),
        "submittedBy": str(row["submitted_by"]) if row.get("submitted_by") else None,
        "submittedAt": to_iso(row.get("submitted_at")),
        "currentRevisionNo": rev_no,
        "createdBy": str(row["created_by"]),
        "createdAt": to_iso(row["created_at"]),
        "updatedAt": to_iso(row["updated_at"]),
        "confirmedAt": to_iso(row.get("confirmed_at")),
        "confirmedBy": str(row["confirmed_by"]) if row.get("confirmed_by") is not None else None,
        "confirmNote": row.get("confirm_note"),
        "rowVersion": int(row["row_version"]),
    }


def nurse_visit_dict(row):
    result = visit_row_to_dict(row)
    for key in ('chiefComplaint','clinicalNote','infoSource','confirmNote'):
        result[key] = None
    for key in ('medicationListState','allergyListState','diagnosisListState'):
        result[key] = 'unknown'
    return result


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


_HIS_CODE_MAX_LEN = 20
_HIS_CODE_RE = re.compile(r"^[A-Za-z0-9._/-]+$")


def _validate_patient_fields(
    *,
    full_name: str,
    birth_date: date | None,
    birth_year: int | None,
    declared_age: int | None,
    external_patient_code: str | None = None,
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
    if external_patient_code is not None:
        if len(external_patient_code) > _HIS_CODE_MAX_LEN:
            errors.append(
                {
                    "fieldCode": "externalPatientCode",
                    "sectionCode": "hanh_chinh",
                    "message": f"Mã HIS (Số vào viện) tối đa {_HIS_CODE_MAX_LEN} ký tự (hiện có {len(external_patient_code)} ký tự).",
                    "rejectedValue": external_patient_code,
                }
            )
        elif not _HIS_CODE_RE.fullmatch(external_patient_code):
            errors.append(
                {
                    "fieldCode": "externalPatientCode",
                    "sectionCode": "hanh_chinh",
                    "message": 'Mã HIS (Số vào viện) chỉ gồm chữ cái không dấu, chữ số hoặc ký tự "-", "_", "/", ".", không chứa khoảng trắng.',
                    "rejectedValue": external_patient_code,
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
    latestVisitStatus: Literal["draft", "intake", "waiting", "in_progress", "confirmed", "none"] | None = Query(default=None),
    recordStatus: Literal["active", "locked"] | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    pageSize: int = Query(default=20, ge=1, le=100),
    principal: Principal = Depends(require_role(["doctor", "nurse"], "patient", "patients.read")),
) -> dict[str, Any]:
    pool = request.app.state.pool
    where_clauses: list[str] = [ACCESS_EXISTS_SQL] if principal.role == "doctor" else []
    params: list[Any] = [str(principal.user_id)] if principal.role == "doctor" else []

    if q and q.strip():
        like = f"%{q.strip()}%"
        where_clauses.append(
            "(p.patient_code ILIKE %s OR p.full_name ILIKE %s OR COALESCE(p.external_patient_code, '') ILIKE %s OR COALESCE(p.cccd, '') ILIKE %s)"
        )
        params.extend([like, like, like, like])

    if latestVisitStatus is not None:
        where_clauses.append("COALESCE(lv.status::text, 'none') = %s")
        params.append(latestVisitStatus)

    with pool.connection() as conn:
        has_rs = has_record_status_schema(conn)
        if has_rs:
            where_clauses.append("p.record_status <> 'archived'")
            if recordStatus is not None:
                where_clauses.append("p.record_status = %s")
                params.append(recordStatus)
        elif recordStatus == "locked":
            where_clauses.append("FALSE")
        where_sql = f"WHERE {' AND '.join(where_clauses)}" if where_clauses else ""
        rs_join = "LEFT JOIN app_user prs ON prs.id = p.record_status_updated_by" if has_rs else ""
        rs_select = "prs.full_name AS record_status_updated_by_name," if has_rs else "NULL AS record_status_updated_by_name,"

        base_from = f"""
            FROM patient p
            JOIN app_user pc ON pc.id=p.created_by
            JOIN app_user pu ON pu.id=COALESCE(p.updated_by,p.created_by)
            {rs_join}
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
                {rs_select}
                NULL AS access,
                COALESCE(vc.visit_count, 0) AS visit_count,
                lv.id AS latest_visit_id,
                lv.visit_code AS latest_visit_code,
                lv.visit_date AS latest_visit_date,
                COALESCE(lv.status::text, 'none') AS latest_visit_status
            {base_from}
            ORDER BY p.updated_at DESC, p.patient_code DESC
            LIMIT %s OFFSET %s
            """,
            [*params, pageSize, offset],
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
    principal: Principal = Depends(require_role(["doctor", "nurse"], "patient", "patients.create")),
) -> dict[str, Any]:
    full_name = body.fullName.strip()
    ext_code = body.externalPatientCode.strip() if body.externalPatientCode else None
    _validate_patient_fields(
        full_name=full_name,
        birth_date=body.birthDate,
        birth_year=None,
        declared_age=None,
        external_patient_code=ext_code,
    )

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
                birth_date, birth_year, declared_age, created_by, cccd
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING *
            """,
            (
                patient_code,
                ext_code,
                full_name,
                body.sex,
                body.birthDate,
                None,
                None,
                str(principal.user_id),
                body.cccd,
            ),
        ).fetchone()

        row["creator_name"] = principal.full_name
        row["access"] = None
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
    principal: Principal = Depends(require_role(["doctor", "nurse"], "patient", "patients.read")),
) -> dict[str, Any]:
    pool = request.app.state.pool
    with pool.connection() as conn:
        access = require_patient_access(conn, patientId, principal, write=False)
        has_rs = has_record_status_schema(conn)
        rs_join = "LEFT JOIN app_user prs ON prs.id=p.record_status_updated_by" if has_rs else ""
        rs_select = ", prs.full_name AS record_status_updated_by_name" if has_rs else ", NULL AS record_status_updated_by_name"
        pt = conn.execute(
            f"""SELECT p.*,pc.full_name AS creator_name,pu.full_name AS editor_name{rs_select}
            FROM patient p JOIN app_user pc ON pc.id=p.created_by
            JOIN app_user pu ON pu.id=COALESCE(p.updated_by,p.created_by)
            {rs_join} WHERE p.id=%s""",
            (str(patientId),),
        ).fetchone()
        if not pt:
            raise ProblemError(
                404,
                "RESOURCE_NOT_FOUND",
                "Không tìm thấy hồ sơ bệnh nhân",
                "Không tồn tại hồ sơ bệnh nhân với mã định danh yêu cầu.",
            )

        summary = latest_visit_summary(conn, patientId, principal) if principal.role == 'doctor' else None

        pt["access"] = access
        has_visits = patient_has_visits(conn, patientId)

    response.headers["ETag"] = f'"{int(pt["row_version"])}"'
    return {
        "patient": patient_row_to_dict(pt),
        "latestVisitSummary": summary,
        "hasVisits": has_visits,
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
    principal: Principal = Depends(require_role(["doctor", "nurse"], "patient", "patients.update")),
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
        if pt.get("record_status") == "locked":
            raise ProblemError(
                409,
                "PATIENT_RECORD_LOCKED",
                "Hồ sơ bệnh nhân đã bị khóa",
                "Hồ sơ đang ở trạng thái đã khóa nên không thể chỉnh sửa thông tin hành chính. Liên hệ Quản trị viên để mở khóa.",
            )
        if pt.get("record_status") == "archived":
            raise ProblemError(
                409,
                "PATIENT_RECORD_ARCHIVED",
                "Hồ sơ bệnh nhân đã lưu trữ",
                "Hồ sơ đang ở trạng thái lưu trữ nên không thể chỉnh sửa thông tin hành chính.",
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

        new_birth_date = body.birthDate
        new_birth_year = new_declared_age = None
        new_cccd = body.cccd if 'cccd' in fset else pt.get('cccd')
        _validate_patient_fields(
            full_name=new_full_name,
            birth_date=new_birth_date,
            birth_year=None,
            declared_age=None,
            external_patient_code=new_ext_code if "externalPatientCode" in fset else None,
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
                cccd = %s,
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
                new_cccd,
                str(patientId),
                current_rv,
            ),
        ).fetchone()
        record_audit_log(conn,actor_user_id=principal.user_id,action='patient_update',entity_type='patient',
                         entity_id=patientId,request_id=get_request_id(request),ip=get_client_ip(request))
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
    status: Literal["draft", "intake", "waiting", "in_progress", "confirmed"] | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    pageSize: int = Query(default=20, ge=1, le=100),
    principal: Principal = Depends(require_role(["doctor", "nurse"], "visit", "visits.read")),
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
        if principal.role == 'doctor':
            where.append('v.assigned_doctor_id=%s'); params.append(str(principal.user_id))
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
                v.*, pc.full_name AS creator_name, pc.role AS creator_role, pu.full_name AS editor_name,
                pd.full_name AS assigned_doctor_name,
                fv.version_label AS form_version_label,
                (SELECT MAX(vr.revision_no) FROM visit_revision vr WHERE vr.visit_id = v.id) AS max_revision_no
            FROM visit v
            JOIN app_user pc ON pc.id=v.created_by
            LEFT JOIN app_user pd ON pd.id=v.assigned_doctor_id
            JOIN app_user pu ON pu.id=COALESCE(v.updated_by,v.created_by)
            JOIN form_version fv ON fv.id = v.form_version_id
            WHERE {where_sql}
            ORDER BY v.visit_date DESC, v.created_at DESC
            LIMIT %s OFFSET %s
            """,
            [*params, pageSize, offset],
        ).fetchall()

        if principal.role == 'nurse':
            from .visits import _queue_vitals
            items = [{**nurse_visit_dict(r), "vitals": _queue_vitals(conn, r["id"])[0]} for r in rows]
        else:
            items = [visit_row_to_dict(r) for r in rows]

    return {
        "items": items,
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
    principal: Principal = Depends(require_role("nurse", "visit", "visits.create")),
) -> dict[str, Any]:
    if body.chiefComplaint is not None:
        raise ProblemError(403, 'FIELD_NOT_ALLOWED_FOR_ROLE', 'Trường ngoài quyền NVYT',
                           'NVYT chỉ nhập hành chính và sinh hiệu; bác sĩ nhập lý do khám sau khi nhận lượt.')
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
        has_rs = has_record_status_schema(conn)
        pt = conn.execute(
            f"SELECT id{', record_status' if has_rs else ''} FROM patient WHERE id = %s",
            (str(patientId),),
        ).fetchone()
        if not pt:
            raise ProblemError(
                404,
                "RESOURCE_NOT_FOUND",
                "Không tìm thấy hồ sơ bệnh nhân",
                "Hồ sơ bệnh nhân không tồn tại.",
            )
        if has_rs and pt.get("record_status") == "locked":
            raise ProblemError(
                409,
                "PATIENT_RECORD_LOCKED",
                "Hồ sơ bệnh nhân đã bị khóa",
                "Không thể tạo lượt khám mới cho hồ sơ đang ở trạng thái đã khóa. Liên hệ Quản trị viên để mở khóa.",
            )
        if has_rs and pt.get("record_status") == "archived":
            raise ProblemError(
                409,
                "PATIENT_RECORD_ARCHIVED",
                "Hồ sơ bệnh nhân đã lưu trữ",
                "Không thể tạo lượt khám mới cho hồ sơ đã lưu trữ.",
            )

        has_visits = patient_has_visits(conn, patientId)
        default_type = 'follow_up' if has_visits else 'outpatient_new'
        visit_type = body.visitType or default_type
        if visit_type not in (default_type, 'acute_inpatient'):
            detail = ('Hồ sơ đã có lượt khám. Chỉ chọn Tái khám hoặc Cấp cứu.' if has_visits
                      else 'Hồ sơ chưa có lượt khám. Chỉ chọn Khám mới hoặc Cấp cứu.')
            raise ProblemError(422, 'VISIT_TYPE_NOT_ALLOWED', 'Loại lượt khám không hợp lệ',
                               detail, errors=[{'fieldCode': 'visitType', 'message': detail}])

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
            VALUES (%s, %s, %s, %s, %s, %s, %s, 'intake', 1, %s)
            RETURNING *
            """,
            (
                visit_code,
                body.externalVisitCode,
                str(patientId),
                str(published["id"]),
                visit_dt,
                visit_type,
                body.chiefComplaint,
                str(principal.user_id),
            ),
        ).fetchone()
        record_audit_log(conn,actor_user_id=principal.user_id,action='visit_create',entity_type='visit',
                         entity_id=row['id'],request_id=get_request_id(request),ip=get_client_ip(request),
                         detail={'status':'intake'})
        conn.commit()

    row_dict = dict(row)
    row_dict["form_version_label"] = published["version_label"]
    row_dict["creator_name"] = principal.full_name
    row_dict["creator_role"] = principal.role
    response.headers["ETag"] = f'"{int(row["row_version"])}"'
    return visit_row_to_dict(row_dict)


# ---------------------------------------------------------------------------
# Patient Record Lock/Archive Requests (UI-03)
# ---------------------------------------------------------------------------
def record_request_row_to_dict(
    row: dict[str, Any],
    principal: Principal | None = None,
) -> dict[str, Any]:
    can_cancel = bool(
        principal is not None
        and principal.role == "nurse"
        and row["status"] == "pending"
        and str(row["requested_by"]) == str(principal.user_id)
    )
    return {
        "id": str(row["id"]),
        "patientId": str(row["patient_id"]),
        "patientCode": row["patient_code"],
        "patientName": row["patient_name"],
        "patientRecordStatus": row.get("patient_record_status") or "active",
        "requestType": row["request_type"],
        "reason": row["reason"],
        "status": row["status"],
        "requestedBy": str(row["requested_by"]),
        "requestedByName": row.get("requested_by_name"),
        "requestedAt": to_iso(row["requested_at"]),
        "handledBy": str(row["handled_by"]) if row.get("handled_by") else None,
        "handledByName": row.get("handled_by_name"),
        "handledAt": to_iso(row.get("handled_at")),
        "adminNote": row.get("admin_note"),
        "canCancel": can_cancel,
    }


@router.get(
    "/patients/{patientId}/record-requests",
    operation_id="listPatientRecordRequests",
    response_model=PatientRecordRequestListResponse,
)
def list_patient_record_requests(
    patientId: UUID,
    request: Request,
    principal: Principal = Depends(require_role(["doctor", "nurse"], "patient", "records.requests.read")),
) -> dict[str, Any]:
    pool = request.app.state.pool
    with pool.connection() as conn:
        require_patient_access(conn, patientId, principal, write=False)
        if not has_record_status_schema(conn):
            return {"items": []}
        rows = conn.execute(
            """
            SELECT
                r.*,
                p.patient_code,
                p.full_name AS patient_name,
                p.record_status AS patient_record_status,
                req_u.full_name AS requested_by_name,
                hdl_u.full_name AS handled_by_name
            FROM patient_record_request r
            JOIN patient p ON p.id = r.patient_id
            JOIN app_user req_u ON req_u.id = r.requested_by
            LEFT JOIN app_user hdl_u ON hdl_u.id = r.handled_by
            WHERE r.patient_id = %s
            ORDER BY r.requested_at DESC, r.id DESC
            """,
            (str(patientId),),
        ).fetchall()
    return {"items": [record_request_row_to_dict(r, principal) for r in rows]}


@router.post(
    "/patients/{patientId}/record-requests",
    operation_id="createPatientRecordRequest",
    response_model=PatientRecordRequestItem,
    status_code=201,
)
def create_patient_record_request(
    patientId: UUID,
    body: CreatePatientRecordRequest,
    request: Request,
    principal: Principal = Depends(require_role("nurse", "patient_record_request", "records.requests.write")),
) -> dict[str, Any]:
    reason = body.reason.strip()
    if len(reason) < 3:
        raise ProblemError(
            422,
            "FIELD_VALIDATION_FAILED",
            "Lý do yêu cầu không hợp lệ",
            "Vui lòng nhập lý do tối thiểu 3 ký tự.",
            errors=[
                {
                    "fieldCode": "reason",
                    "message": "Lý do yêu cầu phải có ít nhất 3 ký tự.",
                    "rejectedValue": body.reason,
                }
            ],
        )

    pool = request.app.state.pool
    req_id = get_request_id(request)
    ip_addr = get_client_ip(request)

    with pool.connection() as conn:
        require_patient_access(conn, patientId, principal, write=True)
        if not has_record_status_schema(conn):
            raise ProblemError(
                503,
                "MIGRATION_REQUIRED",
                "Chưa sẵn sàng tính năng yêu cầu hồ sơ",
                "Cơ sở dữ liệu chưa áp dụng migration 012.",
            )
        pt = conn.execute(
            "SELECT id, patient_code, full_name, record_status FROM patient WHERE id = %s FOR UPDATE",
            (str(patientId),),
        ).fetchone()
        if not pt or pt["record_status"] == "archived":
            raise ProblemError(
                404,
                "RESOURCE_NOT_FOUND",
                "Không tìm thấy hồ sơ bệnh nhân",
                "Hồ sơ bệnh nhân không tồn tại hoặc đã được lưu trữ.",
            )
        if body.requestType == "lock" and pt["record_status"] == "locked":
            raise ProblemError(
                409,
                "PATIENT_ALREADY_LOCKED",
                "Hồ sơ bệnh nhân đã bị khóa",
                "Hồ sơ này hiện đã ở trạng thái khóa nên không cần gửi thêm yêu cầu khóa.",
            )

        existing = conn.execute(
            """
            SELECT id
            FROM patient_record_request
            WHERE patient_id = %s AND request_type = %s AND status = 'pending'
            """,
            (str(patientId), body.requestType),
        ).fetchone()
        if existing:
            type_label = "khóa" if body.requestType == "lock" else "xóa (lưu trữ)"
            raise ProblemError(
                409,
                "RECORD_REQUEST_ALREADY_PENDING",
                "Đã có yêu cầu đang chờ xử lý",
                f"Hồ sơ này đang có một yêu cầu {type_label} chờ Quản trị viên xét duyệt.",
            )

        row = conn.execute(
            """
            INSERT INTO patient_record_request (
                patient_id, request_type, reason, status, requested_by
            )
            VALUES (%s, %s, %s, 'pending', %s)
            RETURNING *
            """,
            (str(patientId), body.requestType, reason, str(principal.user_id)),
        ).fetchone()

        record_audit_log(
            conn,
            actor_user_id=principal.user_id,
            action="patient_record_request_create",
            entity_type="patient_record_request",
            entity_id=row["id"],
            ip=ip_addr,
            request_id=req_id,
            outcome="success",
            detail={
                "patientId": str(patientId),
                "patientCode": pt["patient_code"],
                "requestType": body.requestType,
                "reason": reason,
            },
        )
        conn.commit()

    out = dict(row)
    out["patient_code"] = pt["patient_code"]
    out["patient_name"] = pt["full_name"]
    out["patient_record_status"] = pt["record_status"]
    out["requested_by_name"] = principal.full_name
    out["handled_by_name"] = None
    return record_request_row_to_dict(out, principal)


@router.post(
    "/patients/{patientId}/record-requests/{requestId}/cancel",
    operation_id="cancelPatientRecordRequest",
    response_model=PatientRecordRequestItem,
)
def cancel_patient_record_request(
    patientId: UUID,
    requestId: UUID,
    request: Request,
    principal: Principal = Depends(require_role("nurse", "patient_record_request", "records.requests.write")),
) -> dict[str, Any]:
    pool = request.app.state.pool
    req_id = get_request_id(request)
    ip_addr = get_client_ip(request)

    with pool.connection() as conn:
        require_patient_access(conn, patientId, principal, write=False)
        if not has_record_status_schema(conn):
            raise ProblemError(404, "RESOURCE_NOT_FOUND", "Không tìm thấy yêu cầu", "Không tìm thấy yêu cầu.")
        row = conn.execute(
            """
            SELECT
                r.*,
                p.patient_code,
                p.full_name AS patient_name,
                p.record_status AS patient_record_status,
                req_u.full_name AS requested_by_name
            FROM patient_record_request r
            JOIN patient p ON p.id = r.patient_id
            JOIN app_user req_u ON req_u.id = r.requested_by
            WHERE r.id = %s AND r.patient_id = %s
            FOR UPDATE OF r
            """,
            (str(requestId), str(patientId)),
        ).fetchone()
        if not row:
            raise ProblemError(
                404,
                "RESOURCE_NOT_FOUND",
                "Không tìm thấy yêu cầu",
                "Yêu cầu khóa/lưu trữ hồ sơ không tồn tại.",
            )
        if str(row["requested_by"]) != str(principal.user_id):
            raise ProblemError(
                403,
                "RECORD_REQUEST_NOT_OWNER",
                "Không có quyền hủy yêu cầu",
                "Bạn chỉ có thể hủy yêu cầu đang chờ do chính mình gửi.",
            )
        if row["status"] != "pending":
            raise ProblemError(
                409,
                "REQUEST_ALREADY_HANDLED",
                "Yêu cầu đã được xử lý",
                "Chỉ có thể hủy yêu cầu đang ở trạng thái chờ duyệt.",
            )

        updated = conn.execute(
            """
            UPDATE patient_record_request
            SET status = 'cancelled', handled_at = now()
            WHERE id = %s
            RETURNING *
            """,
            (str(requestId),),
        ).fetchone()

        record_audit_log(
            conn,
            actor_user_id=principal.user_id,
            action="patient_record_request_cancel",
            entity_type="patient_record_request",
            entity_id=requestId,
            ip=ip_addr,
            request_id=req_id,
            outcome="success",
            detail={
                "patientId": str(patientId),
                "patientCode": row["patient_code"],
                "requestType": row["request_type"],
            },
        )
        conn.commit()

    out = dict(updated)
    out["patient_code"] = row["patient_code"]
    out["patient_name"] = row["patient_name"]
    out["patient_record_status"] = row["patient_record_status"]
    out["requested_by_name"] = row["requested_by_name"]
    out["handled_by_name"] = None
    return record_request_row_to_dict(out, principal)
