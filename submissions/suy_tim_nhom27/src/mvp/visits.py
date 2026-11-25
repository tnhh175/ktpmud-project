"""Clinical visit endpoints: form structure, 3-state draft save, review, confirm, revisions, AiInputPayload."""
from __future__ import annotations

from datetime import date, datetime, timedelta, timezone
import math
from typing import Any, Literal
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, Header, Request, Response
import psycopg
from psycopg.types.json import Jsonb

from .audit import record_audit_log
from .care import require_visit_access, audit_access
from .auth import Principal, get_client_ip, get_request_id, require_role
from .db import num_to_json, parse_if_match, to_date_iso, to_iso
from .models import (
    AiInputPayload,
    ProblemError,
    SaveVisitDraftRequest,
    Visit,
    VisitDetailResponse,
    VisitFormStructureResponse,
    VisitReviewResponse,
    VisitRevision,
    ConfirmVisitRequest,
    CreateVisitRevisionRequest,
)
from .patients import allergy_row_to_dict, bp_row_to_dict, med_row_to_dict, visit_row_to_dict


router = APIRouter(prefix="/api/v1", tags=["Visits"])

_require_doctor_visit = require_role("doctor", "visit")

_CORE_AI_MODULE_BASELINE: dict[str, list[str]] = {
    "ai_diagnosis": [
        "kho_tho_khi_gang_suc",
        "chieu_cao_cm",
        "can_nang_kg",
        "mach",
        "spo2",
        "cls_nt_probnp",
        "cls_lvef",
    ],
    "ai_lab_test": [
        "kho_tho_khi_gang_suc",
        "ts_dai_thao_duong",
        "ts_benh_than_man",
        "cls_creatinin",
        "cls_kali",
    ],
    "ai_treatment": [
        "nyha_hien_tai",
        "cls_lvef",
        "cls_egfr",
        "cls_kali",
        "huyet_ap_tam_thu",
    ],
    "ai_medsafety": [
        "thuoc_ghi_nhan",
        "di_ung_adr",
        "cls_creatinin",
        "cls_kali",
        "cls_natri",
    ],
}


def field_runtime_metadata(row):
    rule = row.get("validation_rule") or {}
    storage = row["storage_level"]
    bp_paths = {"huyet_ap_tam_thu":"systolic", "huyet_ap_tam_truong":"diastolic", "thoi_diem_do_ha":"measuredAt", "tu_the_do_ha":"position"}
    bp_paths.update({"cls_don_vi":"unit", "cls_thoi_diem":"measuredAt", "cls_ecg_thoi_diem":"measuredAt", "cls_sieu_am_tim_thoi_diem":"measuredAt", "cls_xquang_thoi_diem":"measuredAt", "cls_troponin_loai":"labSubtype"})
    groups = {"orthostatic_bp":"orthostaticBp", "medication":"medications", "allergy":"allergies", "lab_result":"labResults", "diagnosis":"diagnoses"}
    computed = bool(row["is_calculated"]) or storage == "computed"
    system = computed or storage in ("patient", "visit", "diagnosis")
    return {"system":system,"computed":computed,"locked":system,"repeatGroup":rule.get("repeatGroup",groups.get(storage)),"memberPath":rule.get("memberPath",bp_paths.get(row["code"]))}


def field_def_row_to_dict(
    row: dict[str, Any],
    options: list[dict[str, Any]] | None = None,
    ai_modules: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    return {
        "id": str(row["id"]),
        "code": row["code"],
        "labelVi": row["label_vi"],
        "sectionCode": row["section_code"],
        "dataType": row["data_type"],
        "canonicalUnit": row.get("canonical_unit"),
        "scopeStatus": row["scope_status"],
        "storageLevel": row["storage_level"],
        "isCalculated": bool(row["is_calculated"]),
        **field_runtime_metadata(row),
        "minValue": num_to_json(row.get("min_value"), "number"),
        "maxValue": num_to_json(row.get("max_value"), "number"),
        "validationRule": row.get("validation_rule"),
        "helpText": row.get("help_text"),
        "sourceRef": row["source_ref"],
        "createdAt": to_iso(row["created_at"]),
        "updatedAt": to_iso(row["updated_at"]),
        "options": options or [],
        "aiModules": ai_modules or [],
    }


def form_version_row_to_dict(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": str(row["id"]),
        "formTemplateId": str(row["form_template_id"]),
        "versionNo": int(row["version_no"]),
        "versionLabel": row["version_label"],
        "status": row["status"],
        "basedOnVersionId": str(row["based_on_version_id"]) if row.get("based_on_version_id") else None,
        "changeNote": row.get("change_note"),
        "createdBy": str(row["created_by"]),
        "createdAt": to_iso(row["created_at"]),
        "publishedAt": to_iso(row.get("published_at")),
        "publishedBy": str(row["published_by"]) if row.get("published_by") else None,
        "rowVersion": int(row["row_version"]),
        "visitCount": int(row.get("visit_count", 0)),
    }


def load_field_definitions_with_children(
    conn: psycopg.Connection[Any],
    *,
    field_ids: list[str] | None = None,
    section_code: str | None = None,
    scope_status: str | None = None,
    data_type: str | None = None,
    q: str | None = None,
) -> list[dict[str, Any]]:
    where: list[str] = []
    params: list[Any] = []
    if field_ids is not None:
        if not field_ids:
            return []
        where.append("id = ANY(%s::uuid[])")
        params.append(field_ids)
    if section_code is not None:
        where.append("section_code = %s::section_code")
        params.append(section_code)
    if scope_status is not None:
        where.append("scope_status = %s::field_scope_status")
        params.append(scope_status)
    if data_type is not None:
        where.append("data_type = %s::field_data_type")
        params.append(data_type)
    if q and q.strip():
        like = f"%{q.strip()}%"
        where.append("(code ILIKE %s OR label_vi ILIKE %s)")
        params.extend([like, like])

    where_sql = f"WHERE {' AND '.join(where)}" if where else ""
    defs = conn.execute(
        f"SELECT * FROM field_definition {where_sql} ORDER BY section_code, code",
        params,
    ).fetchall()
    if not defs:
        return []

    def_ids = [str(d["id"]) for d in defs]
    opt_rows = conn.execute(
        """
        SELECT * FROM field_option
        WHERE field_definition_id = ANY(%s::uuid[])
        ORDER BY field_definition_id, display_order ASC
        """,
        (def_ids,),
    ).fetchall()
    opts_by_def: dict[str, list[dict[str, Any]]] = {}
    for o in opt_rows:
        fid = str(o["field_definition_id"])
        opts_by_def.setdefault(fid, []).append(
            {
                "id": str(o["id"]),
                "fieldDefinitionId": fid,
                "optionCode": o["option_code"],
                "labelVi": o["label_vi"],
                "displayOrder": int(o["display_order"]),
                "isActive": bool(o["is_active"]),
            }
        )

    ai_rows = conn.execute(
        """
        SELECT * FROM field_ai_module
        WHERE field_definition_id = ANY(%s::uuid[])
        ORDER BY field_definition_id, ai_module_code ASC
        """,
        (def_ids,),
    ).fetchall()
    ai_by_def: dict[str, list[dict[str, Any]]] = {}
    for a in ai_rows:
        fid = str(a["field_definition_id"])
        ai_by_def.setdefault(fid, []).append(
            {
                "fieldDefinitionId": fid,
                "aiModuleCode": a["ai_module_code"],
                "isRequired": bool(a["is_required"]),
                "sourceSttRefs": a.get("source_stt_refs"),
            }
        )

    return [
        field_def_row_to_dict(
            d,
            options=opts_by_def.get(str(d["id"]), []),
            ai_modules=ai_by_def.get(str(d["id"]), []),
        )
        for d in defs
    ]


def load_form_version_bundle(
    conn: psycopg.Connection[Any],
    version_id: UUID | str,
) -> tuple[dict[str, Any], list[dict[str, Any]], list[dict[str, Any]]]:
    fv_row = conn.execute(
        """
        SELECT fv.*,
               (SELECT count(*)::int FROM visit v WHERE v.form_version_id = fv.id) AS visit_count
        FROM form_version fv
        WHERE fv.id = %s
        """,
        (str(version_id),),
    ).fetchone()
    if not fv_row:
        raise ProblemError(
            404,
            "RESOURCE_NOT_FOUND",
            "Không tìm thấy phiên bản biểu mẫu",
            "Phiên bản biểu mẫu không tồn tại.",
        )

    sec_rows = conn.execute(
        """
        SELECT * FROM form_section
        WHERE form_version_id = %s
        ORDER BY display_order ASC
        """,
        (str(version_id),),
    ).fetchall()

    ff_rows = conn.execute(
        """
        SELECT ff.*, fd.code AS field_code
        FROM form_field ff
        JOIN field_definition fd ON fd.id = ff.field_definition_id
        WHERE ff.form_version_id = %s
        ORDER BY ff.form_section_id, ff.display_order ASC
        """,
        (str(version_id),),
    ).fetchall()

    fields_by_sec: dict[str, list[dict[str, Any]]] = {}
    referenced_def_ids: list[str] = []
    seen_def_ids: set[str] = set()
    for ff in ff_rows:
        sid = str(ff["form_section_id"])
        fid = str(ff["field_definition_id"])
        if fid not in seen_def_ids:
            seen_def_ids.add(fid)
            referenced_def_ids.append(fid)
        fields_by_sec.setdefault(sid, []).append(
            {
                "id": str(ff["id"]),
                "formVersionId": str(ff["form_version_id"]),
                "formSectionId": sid,
                "fieldDefinitionId": fid,
                "fieldCode": ff["field_code"],
                "displayOrder": int(ff["display_order"]),
                "requiredForConfirm": bool(ff["required_for_confirm"]),
                "isVisible": bool(ff["is_visible"]),
                "isReadonly": bool(ff["is_readonly"]),
                "customLabelVi": ff.get("custom_label_vi"),
                "customHelpText": ff.get("custom_help_text"),
            }
        )

    sections = [
        {
            "id": str(s["id"]),
            "formVersionId": str(s["form_version_id"]),
            "sectionCode": s["section_code"],
            "titleVi": s["title_vi"],
            "description": s.get("description"),
            "displayOrder": int(s["display_order"]),
            "fields": fields_by_sec.get(str(s["id"]), []),
        }
        for s in sec_rows
    ]

    field_defs = load_field_definitions_with_children(conn, field_ids=referenced_def_ids)
    overrides = fv_row.get("definition_overrides") or {}
    from .hf_form import apply_definition_overrides
    apply_definition_overrides(field_defs, overrides)
    return form_version_row_to_dict(fv_row), sections, field_defs


def lab_row_to_dict(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": str(row["id"]),
        "visitId": str(row["visit_id"]),
        "labCode": row["lab_code"],
        "labSubtype": row.get("lab_subtype"),
        "valueNum": num_to_json(row.get("value_num"), "number"),
        "valueText": row.get("value_text"),
        "unit": row.get("unit"),
        "measuredAt": to_iso(row["measured_at"]),
        "note": row.get("note"),
        "createdAt": to_iso(row["created_at"]),
    }


def revision_row_to_dict(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": str(row["id"]),
        "visitId": str(row["visit_id"]),
        "revisionNo": int(row["revision_no"]),
        "formVersionId": str(row["form_version_id"]),
        "revisionType": row["revision_type"],
        "changeReason": row["change_reason"],
        "snapshotData": row["snapshot_data"],
        "createdBy": str(row["created_by"]),
        "createdAt": to_iso(row["created_at"]),
    }


def _load_visit_detail_dict(conn: psycopg.Connection[Any], visit_id: UUID | str) -> dict[str, Any]:
    v_row = conn.execute(
        """
        SELECT
            v.*,pc.full_name AS creator_name,pu.full_name AS editor_name,
            fv.version_label AS form_version_label,
            (SELECT MAX(vr.revision_no) FROM visit_revision vr WHERE vr.visit_id = v.id) AS max_revision_no
        FROM visit v
        JOIN app_user pc ON pc.id=v.created_by
        JOIN app_user pu ON pu.id=COALESCE(v.updated_by,v.created_by)
        JOIN form_version fv ON fv.id = v.form_version_id
        WHERE v.id = %s
        """,
        (str(visit_id),),
    ).fetchone()
    if not v_row:
        raise ProblemError(
            404,
            "RESOURCE_NOT_FOUND",
            "Không tìm thấy lượt khám",
            "Không tồn tại lượt khám với mã định danh yêu cầu.",
        )

    val_rows = conn.execute(
        """
        SELECT vv.*, fd.code AS field_code, fd.data_type
        FROM visit_value vv
        JOIN field_definition fd ON fd.id = vv.field_definition_id
        WHERE vv.visit_id = %s
        ORDER BY fd.section_code, fd.code
        """,
        (str(visit_id),),
    ).fetchall()

    opt_rows = conn.execute(
        """
        SELECT visit_id, field_definition_id, field_option_id
        FROM visit_value_option
        WHERE visit_id = %s
        ORDER BY field_definition_id, field_option_id
        """,
        (str(visit_id),),
    ).fetchall()
    opts_by_field: dict[str, list[dict[str, str]]] = {}
    for o in opt_rows:
        fid = str(o["field_definition_id"])
        opts_by_field.setdefault(fid, []).append(
            {
                "visitId": str(o["visit_id"]),
                "fieldDefinitionId": fid,
                "fieldOptionId": str(o["field_option_id"]),
            }
        )

    values = []
    for vr in val_rows:
        fid = str(vr["field_definition_id"])
        values.append(
            {
                "visitId": str(vr["visit_id"]),
                "fieldDefinitionId": fid,
                "fieldCode": vr["field_code"],
                "valueState": vr["value_state"],
                "valueNum": num_to_json(vr.get("value_num"), vr["data_type"]),
                "valueText": vr.get("value_text"),
                "valueBool": vr.get("value_bool"),
                "valueDate": to_date_iso(vr.get("value_date")),
                "fieldOptionId": str(vr["field_option_id"]) if vr.get("field_option_id") else None,
                "selectedOptions": opts_by_field.get(fid, []),
                "unit": vr.get("unit"),
                "updatedAt": to_iso(vr["updated_at"]),
            }
        )

    bp_rows = conn.execute(
        """
        SELECT * FROM visit_orthostatic_bp
        WHERE visit_id = %s
        ORDER BY created_at ASC, id ASC
        """,
        (str(visit_id),),
    ).fetchall()
    med_rows = conn.execute(
        """
        SELECT * FROM visit_medication
        WHERE visit_id = %s
        ORDER BY created_at ASC, id ASC
        """,
        (str(visit_id),),
    ).fetchall()
    alg_rows = conn.execute(
        """
        SELECT * FROM visit_allergy
        WHERE visit_id = %s
        ORDER BY created_at ASC, id ASC
        """,
        (str(visit_id),),
    ).fetchall()
    lab_rows = conn.execute(
        """
        SELECT * FROM visit_lab_result
        WHERE visit_id = %s
        ORDER BY created_at ASC, id ASC
        """,
        (str(visit_id),),
    ).fetchall()
    rev_rows = conn.execute(
        """
        SELECT * FROM visit_revision
        WHERE visit_id = %s
        ORDER BY revision_no ASC
        """,
        (str(visit_id),),
    ).fetchall()

    return {
        "visit": visit_row_to_dict(v_row),
        "values": values,
        "orthostaticBp": [bp_row_to_dict(r) for r in bp_rows],
        "medications": [med_row_to_dict(r) for r in med_rows],
        "allergies": [allergy_row_to_dict(r) for r in alg_rows],
        "labResults": [lab_row_to_dict(r) for r in lab_rows],
        "revisions": [revision_row_to_dict(r) for r in rev_rows],
        "diagnoses": ([{"code":r["code"],"display":r["display"],"role":r["role"]} for r in conn.execute("SELECT * FROM visit_diagnosis WHERE visit_id=%s ORDER BY role,code",(str(visit_id),)).fetchall()] if "diagnosis_list_state" in v_row else []),
    }


def _parse_iso_datetime(raw: datetime | str | None) -> datetime | None:
    if raw is None:
        return None
    if isinstance(raw, datetime):
        return raw if raw.tzinfo else raw.replace(tzinfo=timezone.utc)
    text = str(raw).strip()
    if not text:
        return None
    if text.endswith("Z"):
        text = text[:-1] + "+00:00"
    dt = datetime.fromisoformat(text)
    return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)


def _parse_iso_date(raw: date | str | None) -> date | None:
    if raw is None:
        return None
    if isinstance(raw, date) and not isinstance(raw, datetime):
        return raw
    text = str(raw).strip()
    if not text:
        return None
    return date.fromisoformat(text)


def _compute_age(patient_row: dict[str, Any], visit_date: datetime) -> int | None:
    if patient_row.get("birth_date") is not None:
        bd: date = patient_row["birth_date"]
        vd = visit_date.astimezone(timezone.utc).date() if visit_date.tzinfo else visit_date.date()
        age = vd.year - bd.year - ((vd.month, vd.day) < (bd.month, bd.day))
        return max(0, min(120, age))
    if patient_row.get("birth_year") is not None:
        vd = visit_date.astimezone(timezone.utc).date() if visit_date.tzinfo else visit_date.date()
        return max(0, min(120, vd.year - int(patient_row["birth_year"])))
    if patient_row.get("declared_age") is not None:
        return max(0, min(120, int(patient_row["declared_age"])))
    return None


def _validate_and_normalize_draft(
    conn: psycopg.Connection[Any],
    *,
    visit_id: UUID,
    form_version_id: UUID,
    body: SaveVisitDraftRequest,
) -> tuple[
    list[dict[str, Any]],
    list[dict[str, Any]],
    list[dict[str, Any]],
    list[dict[str, Any]],
    list[dict[str, Any]],
    list[dict[str, Any]],
]:
    errors: list[dict[str, Any]] = []

    _, _, all_defs = load_form_version_bundle(conn, form_version_id)
    def_by_id = {d["id"]: d for d in all_defs}
    def_by_code = {d["code"]: d for d in all_defs}

    ff_rows = conn.execute(
        "SELECT field_definition_id FROM form_field WHERE form_version_id = %s",
        (str(form_version_id),),
    ).fetchall()
    registered_def_ids = {str(r["field_definition_id"]) for r in ff_rows}

    normalized_values: list[dict[str, Any]] = []
    seen_field_ids: set[str] = set()

    for v in body.values:
        if v.visitId is not None and v.visitId != visit_id:
            errors.append(
                {
                    "fieldCode": v.fieldCode or "visitId",
                    "sectionCode": "ghi_chu",
                    "message": "visitId trong phần tử giá trị không khớp lượt khám trên URL.",
                    "rejectedValue": str(v.visitId),
                }
            )
            continue

        fd = None
        if v.fieldDefinitionId is not None:
            fd = def_by_id.get(str(v.fieldDefinitionId))
        if fd is None and v.fieldCode is not None:
            fd = def_by_code.get(v.fieldCode)

        if fd is None:
            errors.append(
                {
                    "fieldCode": v.fieldCode or str(v.fieldDefinitionId or "unknown"),
                    "sectionCode": "ghi_chu",
                    "message": "Trường dữ liệu không tồn tại trong từ điển field_definition.",
                    "rejectedValue": v.fieldCode or str(v.fieldDefinitionId),
                }
            )
            continue

        if v.fieldDefinitionId is not None and v.fieldCode is not None and str(v.fieldDefinitionId) != fd["id"]:
            errors.append(
                {
                    "fieldCode": fd["code"],
                    "sectionCode": fd["sectionCode"],
                    "message": "fieldDefinitionId và fieldCode không khớp cùng một trường.",
                    "rejectedValue": v.fieldCode,
                }
            )
            continue

        if fd["id"] not in registered_def_ids:
            errors.append(
                {
                    "fieldCode": fd["code"],
                    "sectionCode": fd["sectionCode"],
                    "message": "Trường dữ liệu không thuộc phiên bản biểu mẫu của lượt khám này.",
                    "rejectedValue": fd["code"],
                }
            )
            continue

        if fd["code"] == "nhiet_do" and v.valueState == "answered" and v.unit not in (None,"°C"):
            errors.append({"fieldCode":"nhiet_do","sectionCode":"sinh_ton_kham","message":"Nhiệt độ dùng đơn vị °C.","rejectedValue":None})
            continue

        if fd["storageLevel"] != "visit_value":
            errors.append(
                {
                    "fieldCode": fd["code"],
                    "sectionCode": fd["sectionCode"],
                    "message": f"Trường có storage_level={fd['storageLevel']} không lưu trực tiếp trong visit_value.",
                    "rejectedValue": fd["code"],
                }
            )
            continue

        if fd["id"] in seen_field_ids:
            errors.append(
                {
                    "fieldCode": fd["code"],
                    "sectionCode": fd["sectionCode"],
                    "message": "Trường bị gửi lặp lại nhiều lần trong cùng request.",
                    "rejectedValue": fd["code"],
                }
            )
            continue
        seen_field_ids.add(fd["id"])

        if v.valueState not in ("answered", "unknown"):
            errors.append(
                {
                    "fieldCode": fd["code"],
                    "sectionCode": fd["sectionCode"],
                    "message": "valueState chỉ chấp nhận 'answered' hoặc 'unknown'.",
                    "rejectedValue": v.valueState,
                }
            )
            continue

        if v.valueState == "unknown":
            has_any = (
                v.valueNum is not None
                or v.valueText is not None
                or v.valueBool is not None
                or v.valueDate is not None
                or v.fieldOptionId is not None
                or v.unit is not None
                or len(v.selectedOptions) > 0
            )
            if has_any:
                errors.append(
                    {
                        "fieldCode": fd["code"],
                        "sectionCode": fd["sectionCode"],
                        "message": "Khi valueState='unknown', toàn bộ cột giá trị và đơn vị phải để trống (null).",
                        "rejectedValue": None,
                    }
                )
                continue
            normalized_values.append(
                {
                    "fieldDefinitionId": fd["id"],
                    "fieldCode": fd["code"],
                    "valueState": "unknown",
                    "valueNum": None,
                    "valueText": None,
                    "valueBool": None,
                    "valueDate": None,
                    "fieldOptionId": None,
                    "optionIds": [],
                    "unit": None,
                }
            )
            continue

        # valueState == 'answered'
        dtype = fd["dataType"]
        val_num: float | int | None = None
        val_text: str | None = None
        val_bool: bool | None = None
        val_date: date | None = None
        val_opt_id: str | None = None
        opt_ids: list[str] = []
        unit_out: str | None = None

        if dtype in ("number", "integer"):
            if v.valueNum is None or isinstance(v.valueNum, bool):
                errors.append(
                    {
                        "fieldCode": fd["code"],
                        "sectionCode": fd["sectionCode"],
                        "message": f"{fd['labelVi']}: bắt buộc nhập giá trị số hợp lệ.",
                        "rejectedValue": v.valueNum,
                    }
                )
                continue
            fval = float(v.valueNum)
            if not math.isfinite(fval):
                errors.append(
                    {
                        "fieldCode": fd["code"],
                        "sectionCode": fd["sectionCode"],
                        "message": f"{fd['labelVi']}: giá trị số không hợp lệ.",
                        "rejectedValue": str(v.valueNum),
                    }
                )
                continue
            if dtype == "integer":
                if not fval.is_integer():
                    errors.append(
                        {
                            "fieldCode": fd["code"],
                            "sectionCode": fd["sectionCode"],
                            "message": f"{fd['labelVi']}: giá trị phải là số nguyên.",
                            "rejectedValue": v.valueNum,
                        }
                    )
                    continue
                val_num = int(fval)
            else:
                val_num = fval

            min_v = fd.get("minValue")
            max_v = fd.get("maxValue")
            if min_v is not None and val_num < min_v:
                errors.append(
                    {
                        "fieldCode": fd["code"],
                        "sectionCode": fd["sectionCode"],
                        "message": f"{fd['labelVi']} không được nhỏ hơn {min_v}"
                        + (f" {fd['canonicalUnit']}" if fd.get("canonicalUnit") else "")
                        + ".",
                        "rejectedValue": val_num,
                    }
                )
                continue
            if max_v is not None and val_num > max_v:
                errors.append(
                    {
                        "fieldCode": fd["code"],
                        "sectionCode": fd["sectionCode"],
                        "message": f"{fd['labelVi']} không được vượt quá {max_v}"
                        + (f" {fd['canonicalUnit']}" if fd.get("canonicalUnit") else "")
                        + ".",
                        "rejectedValue": val_num,
                    }
                )
                continue
            if any(x is not None for x in (v.valueText, v.valueBool, v.valueDate, v.fieldOptionId)):
                errors.append(
                    {
                        "fieldCode": fd["code"],
                        "sectionCode": fd["sectionCode"],
                        "message": f"{fd['labelVi']}: chỉ được điền cột valueNum cho kiểu số.",
                        "rejectedValue": None,
                    }
                )
                continue
            unit_out = v.unit if v.unit is not None else fd.get("canonicalUnit")

        elif dtype == "boolean":
            if not isinstance(v.valueBool, bool):
                errors.append(
                    {
                        "fieldCode": fd["code"],
                        "sectionCode": fd["sectionCode"],
                        "message": f"{fd['labelVi']}: phải chọn Có (true) hoặc Không (false).",
                        "rejectedValue": v.valueBool,
                    }
                )
                continue
            if any(x is not None for x in (v.valueNum, v.valueText, v.valueDate, v.fieldOptionId)):
                errors.append(
                    {
                        "fieldCode": fd["code"],
                        "sectionCode": fd["sectionCode"],
                        "message": f"{fd['labelVi']}: chỉ được điền valueBool cho kiểu boolean.",
                        "rejectedValue": None,
                    }
                )
                continue
            val_bool = v.valueBool

        elif dtype == "text":
            if v.valueText is None or v.valueText.strip() == "":
                errors.append(
                    {
                        "fieldCode": fd["code"],
                        "sectionCode": fd["sectionCode"],
                        "message": f"{fd['labelVi']}: nội dung văn bản không được để trống.",
                        "rejectedValue": v.valueText,
                    }
                )
                continue
            if any(x is not None for x in (v.valueNum, v.valueBool, v.valueDate, v.fieldOptionId)):
                errors.append(
                    {
                        "fieldCode": fd["code"],
                        "sectionCode": fd["sectionCode"],
                        "message": f"{fd['labelVi']}: chỉ được điền valueText cho kiểu văn bản.",
                        "rejectedValue": None,
                    }
                )
                continue
            val_text = v.valueText

        elif dtype == "date":
            try:
                parsed_d = _parse_iso_date(v.valueDate)
            except Exception:
                parsed_d = None
            if parsed_d is None:
                errors.append(
                    {
                        "fieldCode": fd["code"],
                        "sectionCode": fd["sectionCode"],
                        "message": f"{fd['labelVi']}: ngày không đúng định dạng YYYY-MM-DD.",
                        "rejectedValue": v.valueDate,
                    }
                )
                continue
            if any(x is not None for x in (v.valueNum, v.valueText, v.valueBool, v.fieldOptionId)):
                errors.append(
                    {
                        "fieldCode": fd["code"],
                        "sectionCode": fd["sectionCode"],
                        "message": f"{fd['labelVi']}: chỉ được điền valueDate cho kiểu ngày.",
                        "rejectedValue": None,
                    }
                )
                continue
            val_date = parsed_d

        elif dtype == "single_choice":
            valid_opt_ids = {o["id"] for o in fd.get("options", []) if o.get("isActive", True)}
            if v.fieldOptionId is None or str(v.fieldOptionId) not in valid_opt_ids:
                errors.append(
                    {
                        "fieldCode": fd["code"],
                        "sectionCode": fd["sectionCode"],
                        "message": f"{fd['labelVi']}: lựa chọn không thuộc danh mục hợp lệ của trường này.",
                        "rejectedValue": str(v.fieldOptionId) if v.fieldOptionId else None,
                    }
                )
                continue
            if any(x is not None for x in (v.valueNum, v.valueText, v.valueBool, v.valueDate)):
                errors.append(
                    {
                        "fieldCode": fd["code"],
                        "sectionCode": fd["sectionCode"],
                        "message": f"{fd['labelVi']}: chỉ được điền fieldOptionId cho single_choice.",
                        "rejectedValue": None,
                    }
                )
                continue
            val_opt_id = str(v.fieldOptionId)

        elif dtype == "multi_choice":
            valid_opt_ids = {o["id"] for o in fd.get("options", []) if o.get("isActive", True)}
            chosen = []
            seen_opt: set[str] = set()
            for so in v.selectedOptions:
                oid = str(so.fieldOptionId)
                if oid not in valid_opt_ids:
                    errors.append(
                        {
                            "fieldCode": fd["code"],
                            "sectionCode": fd["sectionCode"],
                            "message": f"{fd['labelVi']}: có lựa chọn không thuộc danh mục hợp lệ.",
                            "rejectedValue": oid,
                        }
                    )
                    chosen = []
                    break
                if oid not in seen_opt:
                    seen_opt.add(oid)
                    chosen.append(oid)
            else:
                if not chosen:
                    errors.append(
                        {
                            "fieldCode": fd["code"],
                            "sectionCode": fd["sectionCode"],
                            "message": f"{fd['labelVi']}: cần chọn ít nhất một mục hoặc đánh dấu Chưa rõ.",
                            "rejectedValue": None,
                        }
                    )
                    continue
                if any(x is not None for x in (v.valueNum, v.valueText, v.valueBool, v.valueDate, v.fieldOptionId)):
                    errors.append(
                        {
                            "fieldCode": fd["code"],
                            "sectionCode": fd["sectionCode"],
                            "message": f"{fd['labelVi']}: multi_choice phải lưu qua selectedOptions.",
                            "rejectedValue": None,
                        }
                    )
                    continue
                opt_ids = chosen
            if not opt_ids:
                continue

        normalized_values.append(
            {
                "fieldDefinitionId": fd["id"],
                "fieldCode": fd["code"],
                "valueState": "answered",
                "valueNum": val_num,
                "valueText": val_text,
                "valueBool": val_bool,
                "valueDate": val_date,
                "fieldOptionId": val_opt_id,
                "optionIds": opt_ids,
                "unit": unit_out,
            }
        )

    # Repeating table 1: orthostaticBp
    normalized_bp: list[dict[str, Any]] = []
    for idx, bp in enumerate(body.orthostaticBp, start=1):
        if bp.visitId is not None and bp.visitId != visit_id:
            errors.append(
                {
                    "fieldCode": "huyet_ap_tam_thu",
                    "sectionCode": "sinh_ton_kham",
                    "message": f"Lần đo HA #{idx}: visitId không khớp lượt khám.",
                    "rejectedValue": str(bp.visitId),
                }
            )
            continue
        if bp.position not in ("supine", "sitting", "standing"):
            errors.append(
                {
                    "fieldCode": "tu_the_do_ha",
                    "sectionCode": "sinh_ton_kham",
                    "message": f"Lần đo HA #{idx}: tư thế phải là supine, sitting hoặc standing.",
                    "rejectedValue": bp.position,
                }
            )
        row_ok = True
        sys_val: int | None = None
        dia_val: int | None = None
        if bp.systolic is None or isinstance(bp.systolic, bool) or not float(bp.systolic).is_integer():
            errors.append(
                {
                    "fieldCode": "huyet_ap_tam_thu",
                    "sectionCode": "sinh_ton_kham",
                    "message": f"Lần đo HA #{idx}: huyết áp tâm thu phải là số nguyên từ 40–300 mmHg.",
                    "rejectedValue": bp.systolic,
                }
            )
            row_ok = False
        else:
            sys_val = int(bp.systolic)
            if not (40 <= sys_val <= 300):
                errors.append(
                    {
                        "fieldCode": "huyet_ap_tam_thu",
                        "sectionCode": "sinh_ton_kham",
                        "message": f"Lần đo HA #{idx}: huyết áp tâm thu phải từ 40 đến 300 mmHg.",
                        "rejectedValue": sys_val,
                    }
                )
                row_ok = False

        if bp.diastolic is None or isinstance(bp.diastolic, bool) or not float(bp.diastolic).is_integer():
            errors.append(
                {
                    "fieldCode": "huyet_ap_tam_truong",
                    "sectionCode": "sinh_ton_kham",
                    "message": f"Lần đo HA #{idx}: huyết áp tâm trương phải là số nguyên từ 20–200 mmHg.",
                    "rejectedValue": bp.diastolic,
                }
            )
            row_ok = False
        else:
            dia_val = int(bp.diastolic)
            if not (20 <= dia_val <= 200):
                errors.append(
                    {
                        "fieldCode": "huyet_ap_tam_truong",
                        "sectionCode": "sinh_ton_kham",
                        "message": f"Lần đo HA #{idx}: huyết áp tâm trương phải từ 20 đến 200 mmHg.",
                        "rejectedValue": dia_val,
                    }
                )
                row_ok = False

        if sys_val is not None and dia_val is not None and dia_val >= sys_val:
            errors.append(
                {
                    "fieldCode": "huyet_ap_tam_thu",
                    "sectionCode": "sinh_ton_kham",
                    "message": f"Lần đo HA #{idx}: huyết áp tâm trương ({dia_val}) phải nhỏ hơn tâm thu ({sys_val}).",
                    "rejectedValue": dia_val,
                }
            )
            row_ok = False

        hr_val: int | None = None
        if bp.heartRate is not None:
            if isinstance(bp.heartRate, bool) or not float(bp.heartRate).is_integer() or not (20 <= int(bp.heartRate) <= 300):
                errors.append(
                    {
                        "fieldCode": "mach",
                        "sectionCode": "sinh_ton_kham",
                        "message": f"Lần đo HA #{idx}: nhịp tim phải là số nguyên 20–300 lần/phút.",
                        "rejectedValue": bp.heartRate,
                    }
                )
                row_ok = False
            else:
                hr_val = int(bp.heartRate)

        min_after_val: int | None = None
        if bp.minuteAfter is not None:
            if isinstance(bp.minuteAfter, bool) or not float(bp.minuteAfter).is_integer() or not (0 <= int(bp.minuteAfter) <= 60):
                errors.append(
                    {
                        "fieldCode": "thoi_diem_do_ha",
                        "sectionCode": "sinh_ton_kham",
                        "message": f"Lần đo HA #{idx}: phút sau đổi tư thế phải là số nguyên 0–60.",
                        "rejectedValue": bp.minuteAfter,
                    }
                )
                row_ok = False
            else:
                min_after_val = int(bp.minuteAfter)

        try:
            measured_dt = _parse_iso_datetime(bp.measuredAt)
        except Exception:
            measured_dt = None
        if measured_dt is None:
            errors.append(
                {
                    "fieldCode": "thoi_diem_do_ha",
                    "sectionCode": "sinh_ton_kham",
                    "message": f"Lần đo HA #{idx}: bắt buộc nhập thời điểm đo hợp lệ.",
                    "rejectedValue": bp.measuredAt,
                }
            )
            row_ok = False

        if row_ok and bp.position in ("supine", "sitting", "standing"):
            normalized_bp.append(
                {
                    "id": str(bp.id or uuid4()),
                    "position": bp.position,
                    "minuteAfter": min_after_val,
                    "systolic": sys_val,
                    "diastolic": dia_val,
                    "heartRate": hr_val,
                    "measuredAt": measured_dt,
                    "note": bp.note,
                }
            )

    # Repeating table 2: medications
    normalized_meds: list[dict[str, Any]] = []
    for idx, med in enumerate(body.medications, start=1):
        if med.visitId is not None and med.visitId != visit_id:
            errors.append(
                {
                    "fieldCode": "thuoc_ghi_nhan",
                    "sectionCode": "thuoc_di_ung",
                    "message": f"Thuốc #{idx}: visitId không khớp lượt khám.",
                    "rejectedValue": str(med.visitId),
                }
            )
            continue
        row_ok = True
        if not med.drugName or not med.drugName.strip():
            errors.append(
                {
                    "fieldCode": "thuoc_ghi_nhan",
                    "sectionCode": "thuoc_di_ung",
                    "message": f"Bản ghi thuốc #{idx}: bắt buộc nhập tên thuốc.",
                    "rejectedValue": med.drugName,
                }
            )
            row_ok = False
        if med.medicationGroup not in ("prescribed", "otc_supplement_tcm"):
            errors.append(
                {
                    "fieldCode": "thuoc_ghi_nhan",
                    "sectionCode": "thuoc_di_ung",
                    "message": f"Thuốc #{idx}: phân nhóm thuốc không hợp lệ.",
                    "rejectedValue": med.medicationGroup,
                }
            )
            row_ok = False
        if med.status not in ("active", "stopped", "proposed"):
            errors.append(
                {
                    "fieldCode": "thuoc_ghi_nhan",
                    "sectionCode": "thuoc_di_ung",
                    "message": f"Thuốc #{idx}: trạng thái dùng thuốc không hợp lệ.",
                    "rejectedValue": med.status,
                }
            )
            row_ok = False
        if med.route is not None and med.route not in ("oral", "iv", "subcutaneous", "inhaled", "topical", "other"):
            errors.append(
                {
                    "fieldCode": "thuoc_ghi_nhan",
                    "sectionCode": "thuoc_di_ung",
                    "message": f"Thuốc #{idx}: đường dùng không hợp lệ.",
                    "rejectedValue": med.route,
                }
            )
            row_ok = False
        dose_val: float | None = None
        if med.dose is not None:
            if isinstance(med.dose, bool) or not math.isfinite(float(med.dose)) or float(med.dose) <= 0:
                errors.append(
                    {
                        "fieldCode": "thuoc_ghi_nhan",
                        "sectionCode": "thuoc_di_ung",
                        "message": f"Thuốc #{idx}: liều dùng phải lớn hơn 0.",
                        "rejectedValue": med.dose,
                    }
                )
                row_ok = False
            else:
                dose_val = float(med.dose)
        started_date: date | None = None
        if med.startedAt is not None:
            try:
                started_date = _parse_iso_date(med.startedAt)
            except Exception:
                errors.append(
                    {
                        "fieldCode": "thuoc_ghi_nhan",
                        "sectionCode": "thuoc_di_ung",
                        "message": f"Thuốc #{idx}: ngày bắt đầu không đúng định dạng YYYY-MM-DD.",
                        "rejectedValue": str(med.startedAt),
                    }
                )
                row_ok = False
        if row_ok:
            normalized_meds.append(
                {
                    "id": str(med.id or uuid4()),
                    "medicationGroup": med.medicationGroup,
                    "drugName": med.drugName.strip(),
                    "activeIngredient": med.activeIngredient,
                    "strength": med.strength,
                    "dose": dose_val,
                    "unit": med.unit,
                    "frequency": med.frequency,
                    "route": med.route,
                    "status": med.status,
                    "startedAt": started_date,
                    "note": med.note,
                }
            )

    # Repeating table 3: allergies
    normalized_allergies: list[dict[str, Any]] = []
    for idx, alg in enumerate(body.allergies, start=1):
        if alg.visitId is not None and alg.visitId != visit_id:
            errors.append(
                {
                    "fieldCode": "di_ung_adr",
                    "sectionCode": "thuoc_di_ung",
                    "message": f"Dị ứng #{idx}: visitId không khớp lượt khám.",
                    "rejectedValue": str(alg.visitId),
                }
            )
            continue
        row_ok = True
        if not alg.allergen or not alg.allergen.strip():
            errors.append(
                {
                    "fieldCode": "di_ung_adr",
                    "sectionCode": "thuoc_di_ung",
                    "message": f"Bản ghi dị ứng #{idx}: bắt buộc nhập tác nhân gây dị ứng/ADR.",
                    "rejectedValue": alg.allergen,
                }
            )
            row_ok = False
        if alg.kind not in ("allergy", "adr", "intolerance"):
            errors.append(
                {
                    "fieldCode": "di_ung_adr",
                    "sectionCode": "thuoc_di_ung",
                    "message": f"Bản ghi dị ứng #{idx}: loại phản ứng không hợp lệ.",
                    "rejectedValue": alg.kind,
                }
            )
            row_ok = False
        if alg.agentCategory not in ("therapeutic_drug", "contrast_media", "other"):
            errors.append(
                {
                    "fieldCode": "di_ung_adr",
                    "sectionCode": "thuoc_di_ung",
                    "message": f"Bản ghi dị ứng #{idx}: nhóm tác nhân không hợp lệ.",
                    "rejectedValue": alg.agentCategory,
                }
            )
            row_ok = False
        if alg.severity not in ("mild", "moderate", "severe", "unknown"):
            errors.append(
                {
                    "fieldCode": "di_ung_adr",
                    "sectionCode": "thuoc_di_ung",
                    "message": f"Bản ghi dị ứng #{idx}: mức độ phản ứng không hợp lệ.",
                    "rejectedValue": alg.severity,
                }
            )
            row_ok = False
        recorded_dt: datetime | None = None
        if alg.recordedAt is not None:
            try:
                recorded_dt = _parse_iso_datetime(alg.recordedAt)
            except Exception:
                errors.append(
                    {
                        "fieldCode": "di_ung_adr",
                        "sectionCode": "thuoc_di_ung",
                        "message": f"Bản ghi dị ứng #{idx}: thời điểm ghi nhận không hợp lệ.",
                        "rejectedValue": str(alg.recordedAt),
                    }
                )
                row_ok = False
        if row_ok:
            normalized_allergies.append(
                {
                    "id": str(alg.id or uuid4()),
                    "kind": alg.kind,
                    "agentCategory": alg.agentCategory,
                    "allergen": alg.allergen.strip(),
                    "reaction": alg.reaction,
                    "severity": alg.severity,
                    "recordedAt": recorded_dt,
                    "note": alg.note,
                }
            )

    # Repeating table 4: labResults
    normalized_labs: list[dict[str, Any]] = []
    for idx, lab in enumerate(body.labResults, start=1):
        if lab.visitId is not None and lab.visitId != visit_id:
            errors.append(
                {
                    "fieldCode": lab.labCode or "can_lam_sang",
                    "sectionCode": "can_lam_sang",
                    "message": f"Kết quả CLS #{idx}: visitId không khớp lượt khám.",
                    "rejectedValue": str(lab.visitId),
                }
            )
            continue
        fd = def_by_code.get(lab.labCode)
        if not fd or fd["id"] not in registered_def_ids or fd["storageLevel"] != "lab_result":
            errors.append(
                {
                    "fieldCode": lab.labCode or "cls_bnp",
                    "sectionCode": "can_lam_sang",
                    "message": f"Kết quả CLS #{idx}: mã xét nghiệm '{lab.labCode}' không hợp lệ.",
                    "rejectedValue": lab.labCode,
                }
            )
            continue

        row_ok = True
        try:
            measured_dt = _parse_iso_datetime(lab.measuredAt)
        except Exception:
            measured_dt = None
        if measured_dt is None:
            errors.append(
                {
                    "fieldCode": fd["code"],
                    "sectionCode": "can_lam_sang",
                    "message": f"{fd['labelVi']} (#{idx}): bắt buộc nhập thời điểm đo/lấy mẫu hợp lệ.",
                    "rejectedValue": lab.measuredAt,
                }
            )
            row_ok = False

        val_num_lab: float | None = None
        val_text_lab: str | None = lab.valueText.strip() if lab.valueText else None
        unit_lab: str | None = lab.unit.strip() if lab.unit else None

        if fd["dataType"] in ("number", "integer"):
            if lab.valueNum is None or isinstance(lab.valueNum, bool) or not math.isfinite(float(lab.valueNum)):
                errors.append(
                    {
                        "fieldCode": fd["code"],
                        "sectionCode": "can_lam_sang",
                        "message": f"{fd['labelVi']} (#{idx}): bắt buộc nhập giá trị số hợp lệ.",
                        "rejectedValue": lab.valueNum,
                    }
                )
                row_ok = False
            else:
                val_num_lab = float(lab.valueNum)
                if val_num_lab < 0:
                    errors.append(
                        {
                            "fieldCode": fd["code"],
                            "sectionCode": "can_lam_sang",
                            "message": f"{fd['labelVi']} (#{idx}): giá trị số không được âm.",
                            "rejectedValue": val_num_lab,
                        }
                    )
                    row_ok = False
                min_v = fd.get("minValue")
                max_v = fd.get("maxValue")
                if min_v is not None and val_num_lab < min_v:
                    errors.append(
                        {
                            "fieldCode": fd["code"],
                            "sectionCode": "can_lam_sang",
                            "message": f"{fd['labelVi']} (#{idx}) không được nhỏ hơn {min_v}"
                            + (f" {fd['canonicalUnit']}" if fd.get("canonicalUnit") else "")
                            + ".",
                            "rejectedValue": val_num_lab,
                        }
                    )
                    row_ok = False
                if max_v is not None and val_num_lab > max_v:
                    errors.append(
                        {
                            "fieldCode": fd["code"],
                            "sectionCode": "can_lam_sang",
                            "message": f"{fd['labelVi']} (#{idx}) không được vượt quá {max_v}"
                            + (f" {fd['canonicalUnit']}" if fd.get("canonicalUnit") else "")
                            + ".",
                            "rejectedValue": val_num_lab,
                        }
                    )
                    row_ok = False
                if not unit_lab:
                    errors.append(
                        {
                            "fieldCode": fd["code"],
                            "sectionCode": "can_lam_sang",
                            "message": f"{fd['labelVi']} (#{idx}): bắt buộc ghi đơn vị đo cho kết quả số.",
                            "rejectedValue": lab.unit,
                        }
                    )
                    row_ok = False
        else:
            if val_num_lab is None and not val_text_lab:
                errors.append(
                    {
                        "fieldCode": fd["code"],
                        "sectionCode": "can_lam_sang",
                        "message": f"{fd['labelVi']} (#{idx}): bắt buộc nhập kết luận hoặc giá trị.",
                        "rejectedValue": lab.valueText,
                    }
                )
                row_ok = False

        if row_ok:
            normalized_labs.append(
                {
                    "id": str(lab.id or uuid4()),
                    "labCode": fd["code"],
                    "labSubtype": lab.labSubtype,
                    "valueNum": val_num_lab,
                    "valueText": val_text_lab,
                    "unit": unit_lab,
                    "measuredAt": measured_dt,
                    "note": lab.note,
                }
            )

    from .hf_form import synchronize_contrast_allergy
    synchronize_contrast_allergy(all_defs, normalized_values, normalized_allergies, body.allergyListState, errors)
    return (
        errors,
        normalized_values,
        normalized_bp,
        normalized_meds,
        normalized_allergies,
        normalized_labs,
    )


def _compute_review_and_ai_payload(
    conn: psycopg.Connection[Any],
    visit_id: UUID | str,
) -> tuple[dict[str, Any], dict[str, Any] | None]:
    detail = _load_visit_detail_dict(conn, visit_id)
    v = detail["visit"]
    pt_row = conn.execute(
        "SELECT * FROM patient WHERE id = %s",
        (v["patientId"],),
    ).fetchone()

    _, sections, field_defs = load_form_version_bundle(conn, v["formVersionId"])
    def_by_id = {d["id"]: d for d in field_defs}
    def_by_code = {d["code"]: d for d in field_defs}
    # Load full catalog for AI module mapping even if a field isn't in form_field
    all_defs = load_field_definitions_with_children(conn)
    for d in all_defs:
        def_by_id.setdefault(d["id"], d)
        def_by_code.setdefault(d["code"], d)

    val_by_def_id = {val["fieldDefinitionId"]: val for val in detail["values"]}
    val_by_code = {val["fieldCode"]: val for val in detail["values"]}
    visit_dt = _parse_iso_datetime(v["visitDate"]) or datetime.now(timezone.utc)

    def is_satisfied(fd: dict[str, Any]) -> bool:
        sl = fd["storageLevel"]
        if sl == "patient":
            return bool(pt_row and pt_row.get("sex") in ("male", "female"))
        if sl == "computed":
            if fd["code"] == "bmi":
                h = val_by_code.get("chieu_cao_cm")
                w = val_by_code.get("can_nang_kg")
                return bool(
                    h and h["valueState"] == "answered"
                    and w and w["valueState"] == "answered"
                    and h.get("valueNum") and w.get("valueNum")
                )
            if fd["code"] == "so_luong_thuoc_dong_thoi":
                return len(detail["medications"]) > 0
            if fd["code"] == "luot_tuoi":
                return bool(pt_row and _compute_age(pt_row, visit_dt) is not None)
            return False
        if sl == "visit":
            return bool(v.get(fd.get("memberPath")))
        if sl == "diagnosis":
            return bool(detail.get("diagnoses")) or v.get("diagnosisListState") == "none"
        if fd.get("repeatGroup") and fd.get("memberPath"):
            rows = detail.get(fd["repeatGroup"], [])
            if rows:
                return all(row.get(fd["memberPath"]) is not None and row.get(fd["memberPath"]) != "" for row in rows)
            state_key = {"medications":"medicationListState","allergies":"allergyListState","diagnoses":"diagnosisListState"}.get(fd["repeatGroup"])
            return bool(state_key and v.get(state_key) == "none")
        if sl == "orthostatic_bp":
            return len(detail["orthostaticBp"]) > 0
        if sl == "medication":
            return len(detail["medications"]) > 0 or v.get("medicationListState") == "none"
        if sl == "allergy":
            if fd["code"] == "di_ung_thuoc_can_quang":
                return any(a.get("agentCategory") == "contrast_media" for a in detail["allergies"])
            return len(detail["allergies"]) > 0 or v.get("allergyListState") == "none"
        if sl == "lab_result":
            if fd["code"] in ("cls_don_vi", "cls_thoi_diem"):
                return len(detail["labResults"]) > 0
            return any(l["labCode"] == fd["code"] for l in detail["labResults"])
        val = val_by_def_id.get(fd["id"])
        return bool(val and val["valueState"] == "answered")

    tier3_errors: list[dict[str, Any]] = []
    err_count_by_sec: dict[str, int] = {}
    section_summaries: list[dict[str, Any]] = []
    total_answered = 0
    total_unfilled = 0
    total_unknown = 0

    for sec in sections:
        ans = 0
        unf = 0
        unk = 0
        sc = sec["sectionCode"]
        for ff in sec["fields"]:
            if not ff["isVisible"]:
                continue
            fd = def_by_id.get(ff["fieldDefinitionId"])
            if not fd:
                continue
            if fd["storageLevel"] == "visit_value":
                val = val_by_def_id.get(fd["id"])
                if val is None:
                    unf += 1
                    if ff["requiredForConfirm"]:
                        tier3_errors.append(
                            {
                                "fieldCode": fd["code"],
                                "sectionCode": sc,
                                "message": f"{ff.get('customLabelVi') or fd['labelVi']} là trường bắt buộc khi xác nhận lượt khám (Tầng 3).",
                                "rejectedValue": None,
                            }
                        )
                        err_count_by_sec[sc] = err_count_by_sec.get(sc, 0) + 1
                elif val["valueState"] == "unknown":
                    unk += 1
                else:
                    ans += 1
            else:
                if is_satisfied(fd):
                    ans += 1
                else:
                    unf += 1
                    if ff["requiredForConfirm"]:
                        tier3_errors.append(
                            {
                                "fieldCode": fd["code"],
                                "sectionCode": sc,
                                "message": f"{ff.get('customLabelVi') or fd['labelVi']} là trường bắt buộc khi xác nhận lượt khám (Tầng 3).",
                                "rejectedValue": None,
                            }
                        )
                        err_count_by_sec[sc] = err_count_by_sec.get(sc, 0) + 1

        total_answered += ans
        total_unfilled += unf
        total_unknown += unk
        section_summaries.append(
            {
                "sectionCode": sc,
                "titleVi": sec["titleVi"],
                "answeredCount": ans,
                "unfilledCount": unf,
                "unknownCount": unk,
                "errorCount": err_count_by_sec.get(sc, 0),
            }
        )

    # Tier 4 AI module readiness from field_ai_module table
    ai_rows = conn.execute(
        """
        SELECT fam.ai_module_code, fam.is_required, fd.code
        FROM field_ai_module fam
        JOIN field_definition fd ON fd.id = fam.field_definition_id
        ORDER BY fam.ai_module_code, fd.code
        """
    ).fetchall()
    req_by_mod: dict[str, list[str]] = {}
    all_by_mod: dict[str, set[str]] = {}
    for ar in ai_rows:
        mc = ar["ai_module_code"]
        all_by_mod.setdefault(mc, set()).add(ar["code"])
        if ar["is_required"]:
            req_by_mod.setdefault(mc, []).append(ar["code"])

    tier4_modules: list[dict[str, Any]] = []
    for mod_code in ("ai_diagnosis", "ai_lab_test", "ai_treatment", "ai_medsafety"):
        req_codes = req_by_mod.get(mod_code)
        if not req_codes:
            linked = all_by_mod.get(mod_code, set())
            req_codes = [c for c in _CORE_AI_MODULE_BASELINE[mod_code] if c in linked]
        missing = []
        for code in req_codes:
            fd = def_by_code.get(code)
            if not fd or not is_satisfied(fd):
                missing.append(code)
        tier4_modules.append(
            {
                "aiModuleCode": mod_code,
                "ready": len(missing) == 0,
                "missingFieldCodes": missing,
            }
        )

    if v["status"] == "confirmed":
        readiness_tier = "ai_ready" if all(m["ready"] for m in tier4_modules) else "confirmed"
    else:
        has_any_data = bool(
            detail["values"]
            or detail["orthostaticBp"]
            or detail["medications"]
            or detail["allergies"]
            or detail["labResults"]
            or v["rowVersion"] > 1
        )
        readiness_tier = "draft_saved" if has_any_data else "patient_created"

    review_payload = {
        "visitId": v["id"],
        "formVersionId": v["formVersionId"],
        "rowVersion": v["rowVersion"],
        "readinessTier": readiness_tier,
        "canConfirm": len(tier3_errors) == 0,
        "totalAnswered": total_answered,
        "totalUnfilled": total_unfilled,
        "totalUnknown": total_unknown,
        "totalErrors": len(tier3_errors),
        "sections": section_summaries,
        "tier3ConfirmErrors": tier3_errors,
        "tier4AiModules": tier4_modules,
    }

    ai_payload: dict[str, Any] | None = None
    if v["status"] == "confirmed":
        values_map: dict[str, dict[str, Any]] = {}
        for val in detail["values"]:
            fd = def_by_id.get(val["fieldDefinitionId"])
            if not fd:
                continue
            code = fd["code"]
            if val["valueState"] == "unknown":
                values_map[code] = {"state": "unknown", "value": None, "unit": None}
                continue
            dtype = fd["dataType"]
            out_val: Any = None
            if dtype in ("number", "integer"):
                out_val = val["valueNum"]
            elif dtype == "boolean":
                out_val = val["valueBool"]
            elif dtype == "text":
                out_val = val["valueText"]
            elif dtype == "date":
                out_val = val["valueDate"]
            elif dtype == "single_choice":
                opt_match = next(
                    (o for o in fd.get("options", []) if o["id"] == val.get("fieldOptionId")),
                    None,
                )
                out_val = opt_match["optionCode"] if opt_match else val.get("fieldOptionId")
            elif dtype == "multi_choice":
                opt_lookup = {o["id"]: o["optionCode"] for o in fd.get("options", [])}
                out_val = [
                    opt_lookup.get(so["fieldOptionId"], so["fieldOptionId"])
                    for so in val.get("selectedOptions", [])
                ]
            values_map[code] = {
                "state": "answered",
                "value": out_val,
                "unit": val.get("unit") if val.get("unit") is not None else fd.get("canonicalUnit"),
            }

        # Computed & patient demographic fields in AiInputPayload
        if pt_row is not None:
            age = _compute_age(pt_row, visit_dt)
            if age is not None:
                values_map["luot_tuoi"] = {"state": "answered", "value": age, "unit": "tuổi"}
            if pt_row["sex"] == "unknown":
                values_map["bn_gioi_tinh"] = {"state": "unknown", "value": None, "unit": None}
            else:
                values_map["bn_gioi_tinh"] = {
                    "state": "answered",
                    "value": pt_row["sex"],
                    "unit": None,
                }

        h_entry = values_map.get("chieu_cao_cm")
        w_entry = values_map.get("can_nang_kg")
        if (
            h_entry and h_entry["state"] == "answered" and h_entry["value"]
            and w_entry and w_entry["state"] == "answered" and w_entry["value"]
        ):
            h_m = float(h_entry["value"]) / 100.0
            if h_m > 0:
                values_map["bmi"] = {
                    "state": "answered",
                    "value": round(float(w_entry["value"]) / (h_m * h_m), 2),
                    "unit": "kg/m²",
                }

        if len(detail["medications"]) > 0:
            active_med_count = sum(
                1 for m in detail["medications"] if m["status"] == "active"
            )
            values_map["so_luong_thuoc_dong_thoi"] = {
                "state": "answered",
                "value": active_med_count,
                "unit": "thuốc",
            }

        ai_payload = {
            "visitId": v["id"],
            "patientCode": pt_row["patient_code"] if pt_row else "BN-00000",
            "formVersionId": v["formVersionId"],
            "revisionNo": v["currentRevisionNo"],
            "confirmedAt": v["confirmedAt"],
            "confirmedBy": v["confirmedBy"],
            "values": values_map,
            "orthostaticBp": detail["orthostaticBp"],
            "medications": detail["medications"],
            "allergies": detail["allergies"],
            "labResults": detail["labResults"],
            "modules": tier4_modules,
        }

    from .hf_ai import evaluate_quality, has_hf_registry, readiness_from_quality
    version_config = conn.execute(
        "SELECT definition_overrides FROM form_version WHERE id=%s", (v["formVersionId"],)
    ).fetchone()
    if has_hf_registry(version_config["definition_overrides"] or {}):
        # Confirmed reviews must use the same immutable source as JSON export.
        frozen = None
        if v["status"] == "confirmed":
            frozen = conn.execute(
                "SELECT snapshot_data FROM visit_revision WHERE visit_id=%s AND revision_no=%s "
                "AND revision_type='confirmed_snapshot'",
                (str(visit_id), v["currentRevisionNo"]),
            ).fetchone()
        if frozen:
            quality_snapshot = frozen["snapshot_data"]
        else:
            # Also used inside confirm, before its new revision has been inserted.
            from .hf_form import export_snapshot
            quality_snapshot = {**(ai_payload or {}), "hfSource": export_snapshot(conn, visit_id)}
        source_form = (quality_snapshot.get("hfSource") or {}).get("form") or {}
        tier4_modules = readiness_from_quality(evaluate_quality(quality_snapshot), source_form)
        review_payload["tier4AiModules"] = tier4_modules
        if v["status"] == "confirmed":
            review_payload["readinessTier"] = "ai_ready" if all(m["ready"] for m in tier4_modules) else "confirmed"
        if ai_payload is not None:
            ai_payload["modules"] = tier4_modules

    return review_payload, ai_payload


@router.get(
    "/visits/{visitId}",
    operation_id="getVisit",
    response_model=VisitDetailResponse,
)
def get_visit(
    visitId: UUID,
    request: Request,
    response: Response,
    principal: Principal = Depends(_require_doctor_visit),
) -> dict[str, Any]:
    pool = request.app.state.pool
    with pool.connection() as conn:
        access = require_visit_access(conn, visitId, principal, write=False)
        detail = _load_visit_detail_dict(conn, visitId)
        detail["access"] = access
    response.headers["ETag"] = f'"{detail["visit"]["rowVersion"]}"'
    return detail


@router.get(
    "/visits/{visitId}/form",
    operation_id="getVisitForm",
    response_model=VisitFormStructureResponse,
)
def get_visit_form(
    visitId: UUID,
    request: Request,
    principal: Principal = Depends(_require_doctor_visit),
) -> dict[str, Any]:
    pool = request.app.state.pool
    with pool.connection() as conn:
        access = require_visit_access(conn, visitId, principal, write=False)
        v_row = conn.execute(
            "SELECT id, form_version_id FROM visit WHERE id = %s",
            (str(visitId),),
        ).fetchone()
        if not v_row:
            raise ProblemError(
                404,
                "RESOURCE_NOT_FOUND",
                "Không tìm thấy lượt khám",
                "Không tồn tại lượt khám với mã định danh yêu cầu.",
            )
        fv_dict, sections, field_defs = load_form_version_bundle(
            conn, v_row["form_version_id"]
        )
    return {
        "visitId": str(v_row["id"]),
        "formVersion": fv_dict,
        "sections": sections,
        "fieldDefinitions": field_defs,
    }


@router.put(
    "/visits/{visitId}/draft",
    operation_id="saveVisitDraft",
    response_model=VisitDetailResponse,
)
def save_visit_draft(
    visitId: UUID,
    body: SaveVisitDraftRequest,
    request: Request,
    response: Response,
    if_match: str | None = Header(default=None, alias="If-Match"),
    principal: Principal = Depends(_require_doctor_visit),
) -> dict[str, Any]:
    pool = request.app.state.pool
    with pool.connection() as conn:
        access = require_visit_access(conn, visitId, principal, write=True)
        v_row = conn.execute(
            "SELECT * FROM visit WHERE id = %s FOR UPDATE",
            (str(visitId),),
        ).fetchone()
        if not v_row:
            raise ProblemError(
                404,
                "RESOURCE_NOT_FOUND",
                "Không tìm thấy lượt khám",
                "Không tồn tại lượt khám với mã định danh yêu cầu.",
            )
        current_rv = int(v_row["row_version"])
        if v_row["status"] == "confirmed":
            raise ProblemError(
                409,
                "VISIT_ALREADY_CONFIRMED",
                "Lượt khám đã xác nhận (Chỉ đọc)",
                "Lượt khám đã xác nhận không thể sửa trực tiếp qua lưu nháp; hãy tạo bản sửa mới (revision).",
                current_row_version=current_rv,
            )

        expected_rv = parse_if_match(
            if_match, body.rowVersion, current_row_version=current_rv
        )
        if expected_rv != current_rv:
            raise ProblemError(
                409,
                "CONCURRENCY_ROW_VERSION_MISMATCH",
                "Xung đột phiên bản dữ liệu (409)",
                f"Lượt khám đã được cập nhật lên rowVersion {current_rv} bởi phiên khác. Vui lòng tải lại.",
                current_row_version=current_rv,
            )

        (
            errors,
            norm_vals,
            norm_bp,
            norm_meds,
            norm_algs,
            norm_labs,
        ) = _validate_and_normalize_draft(
            conn,
            visit_id=visitId,
            form_version_id=v_row["form_version_id"],
            body=body,
        )
        from .hf_form import validate_lists
        list_states = validate_lists(body, v_row, errors)
        if body.diagnoses:
            codes = conn.execute("SELECT fd.code FROM form_field ff JOIN field_definition fd ON fd.id=ff.field_definition_id WHERE ff.form_version_id=%s AND fd.code='icd_code'",(str(v_row["form_version_id"]),)).fetchall()
            if not codes: errors.append({"fieldCode":"icd_code","message":"ICD không thuộc phiên bản lượt khám.","rejectedValue":None})
        if errors:
            raise ProblemError(
                422,
                "FIELD_VALIDATION_FAILED",
                "Dữ liệu trường không hợp lệ",
                f"Phát hiện {len(errors)} lỗi dữ liệu; các trường hợp lệ khác chưa bị ghi đè.",
                current_row_version=current_rv,
                errors=errors,
            )

        updated_visit = conn.execute(
            """
            UPDATE visit
            SET updated_by = %s,
                clinical_note = %s,
                info_source = %s,
                row_version = row_version + 1
            WHERE id = %s AND row_version = %s
            RETURNING row_version
            """,
            (
                str(principal.user_id),
                body.clinicalNote if "clinicalNote" in body.model_fields_set else v_row.get("clinical_note"),
                body.infoSource if "infoSource" in body.model_fields_set else v_row.get("info_source"),
                str(visitId),
                current_rv,
            ),
        ).fetchone()
        if not updated_visit:
            raise ProblemError(
                409,
                "CONCURRENCY_ROW_VERSION_MISMATCH",
                "Xung đột phiên bản dữ liệu (409)",
                "Lượt khám vừa được cập nhật đồng thời.",
            )

        conn.execute("DELETE FROM visit_value_option WHERE visit_id = %s", (str(visitId),))
        conn.execute("DELETE FROM visit_value WHERE visit_id = %s", (str(visitId),))

        for val in norm_vals:
            conn.execute(
                """
                INSERT INTO visit_value (
                    visit_id, field_definition_id, value_state,
                    value_num, value_text, value_bool, value_date,
                    field_option_id, unit
                )
                VALUES (%s, %s, %s::value_state, %s, %s, %s, %s, %s, %s)
                """,
                (
                    str(visitId),
                    val["fieldDefinitionId"],
                    val["valueState"],
                    val["valueNum"],
                    val["valueText"],
                    val["valueBool"],
                    val["valueDate"],
                    val["fieldOptionId"],
                    val["unit"],
                ),
            )
            for opt_id in val["optionIds"]:
                conn.execute(
                    """
                    INSERT INTO visit_value_option (visit_id, field_definition_id, field_option_id)
                    VALUES (%s, %s, %s)
                    """,
                    (str(visitId), val["fieldDefinitionId"], opt_id),
                )

        base_ts = datetime.now(timezone.utc)

        conn.execute("DELETE FROM visit_orthostatic_bp WHERE visit_id = %s", (str(visitId),))
        for idx, bp in enumerate(norm_bp):
            conn.execute(
                """
                INSERT INTO visit_orthostatic_bp (
                    id, visit_id, position, minute_after, systolic, diastolic,
                    heart_rate, measured_at, note, created_at
                )
                VALUES (%s, %s, %s::bp_position, %s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    bp["id"],
                    str(visitId),
                    bp["position"],
                    bp["minuteAfter"],
                    bp["systolic"],
                    bp["diastolic"],
                    bp["heartRate"],
                    bp["measuredAt"],
                    bp["note"],
                    base_ts + timedelta(microseconds=idx),
                ),
            )

        conn.execute("DELETE FROM visit_medication WHERE visit_id = %s", (str(visitId),))
        for idx, med in enumerate(norm_meds):
            conn.execute(
                """
                INSERT INTO visit_medication (
                    id, visit_id, medication_group, drug_name, active_ingredient,
                    strength, dose, unit, frequency, route, status, started_at, note, created_at
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    med["id"],
                    str(visitId),
                    med["medicationGroup"],
                    med["drugName"],
                    med["activeIngredient"],
                    med["strength"],
                    med["dose"],
                    med["unit"],
                    med["frequency"],
                    med["route"],
                    med["status"],
                    med["startedAt"],
                    med["note"],
                    base_ts + timedelta(microseconds=idx),
                ),
            )

        conn.execute("DELETE FROM visit_allergy WHERE visit_id = %s", (str(visitId),))
        for idx, alg in enumerate(norm_algs):
            conn.execute(
                """
                INSERT INTO visit_allergy (
                    id, visit_id, kind, agent_category, allergen,
                    reaction, severity, recorded_at, note, created_at
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    alg["id"],
                    str(visitId),
                    alg["kind"],
                    alg["agentCategory"],
                    alg["allergen"],
                    alg["reaction"],
                    alg["severity"],
                    alg["recordedAt"],
                    alg["note"],
                    base_ts + timedelta(microseconds=idx),
                ),
            )

        conn.execute("DELETE FROM visit_lab_result WHERE visit_id = %s", (str(visitId),))
        for idx, lab in enumerate(norm_labs):
            conn.execute(
                """
                INSERT INTO visit_lab_result (
                    id, visit_id, lab_code, lab_subtype, value_num,
                    value_text, unit, measured_at, note, created_at
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    lab["id"],
                    str(visitId),
                    lab["labCode"],
                    lab["labSubtype"],
                    lab["valueNum"],
                    lab["valueText"],
                    lab["unit"],
                    lab["measuredAt"],
                    lab["note"],
                    base_ts + timedelta(microseconds=idx),
                ),
            )

        if "diagnosis_list_state" in v_row:
            conn.execute("UPDATE visit SET medication_list_state=%s,allergy_list_state=%s,diagnosis_list_state=%s WHERE id=%s",(*list_states,str(visitId)))
            conn.execute("DELETE FROM visit_diagnosis WHERE visit_id=%s",(str(visitId),))
            for med,norm in zip(body.medications,norm_meds):
                if med.atcCode:
                    conn.execute("UPDATE visit_medication SET atc_code=%s WHERE id=%s AND visit_id=%s",(med.atcCode,norm["id"],str(visitId)))
            for alg,norm in zip(body.allergies,norm_algs):
                if alg.atcCode:
                    conn.execute("UPDATE visit_allergy SET atc_code=%s WHERE id=%s AND visit_id=%s",(alg.atcCode,norm["id"],str(visitId)))
            for dx in body.diagnoses:
                conn.execute("INSERT INTO visit_diagnosis(visit_id,code,display,role) VALUES(%s,%s,%s,%s)",(str(visitId),dx.code,dx.display.strip(),dx.role))
        detail = _load_visit_detail_dict(conn, visitId)
        detail["access"] = access
        from .workflow import on_visit_saved
        on_visit_saved(conn, visitId, request, principal)
        conn.commit()

    response.headers["ETag"] = f'"{detail["visit"]["rowVersion"]}"'
    return detail


@router.get(
    "/visits/{visitId}/review",
    operation_id="getVisitReview",
    response_model=VisitReviewResponse,
)
def get_visit_review(
    visitId: UUID,
    request: Request,
    principal: Principal = Depends(_require_doctor_visit),
) -> dict[str, Any]:
    pool = request.app.state.pool
    with pool.connection() as conn:
        access = require_visit_access(conn, visitId, principal, write=False)
        review_payload, _ = _compute_review_and_ai_payload(conn, visitId)
    return review_payload


@router.post(
    "/visits/{visitId}/confirm",
    operation_id="confirmVisit",
    response_model=Visit,
)
def confirm_visit(
    visitId: UUID,
    body: ConfirmVisitRequest,
    request: Request,
    response: Response,
    if_match: str | None = Header(default=None, alias="If-Match"),
    principal: Principal = Depends(_require_doctor_visit),
) -> dict[str, Any]:
    pool = request.app.state.pool
    req_id = get_request_id(request)
    ip_addr = get_client_ip(request)

    with pool.connection() as conn:
        access = require_visit_access(conn, visitId, principal, write=True)
        v_row = conn.execute(
            "SELECT * FROM visit WHERE id = %s FOR UPDATE",
            (str(visitId),),
        ).fetchone()
        if not v_row:
            raise ProblemError(
                404,
                "RESOURCE_NOT_FOUND",
                "Không tìm thấy lượt khám",
                "Không tồn tại lượt khám với mã định danh yêu cầu.",
            )
        current_rv = int(v_row["row_version"])
        if v_row["status"] == "confirmed":
            raise ProblemError(
                409,
                "VISIT_ALREADY_CONFIRMED",
                "Lượt khám đã được xác nhận",
                "Lượt khám này đã ở trạng thái confirmed.",
                current_row_version=current_rv,
            )

        expected_rv = parse_if_match(
            if_match, body.rowVersion, current_row_version=current_rv
        )
        if expected_rv != current_rv:
            raise ProblemError(
                409,
                "CONCURRENCY_ROW_VERSION_MISMATCH",
                "Xung đột phiên bản dữ liệu (409)",
                f"Dữ liệu lượt khám đã cập nhật lên rowVersion {current_rv}. Vui lòng tải lại.",
                current_row_version=current_rv,
            )

        conn.execute("SELECT id FROM patient WHERE id=%s FOR SHARE",(str(v_row["patient_id"]),))
        review_payload, _ = _compute_review_and_ai_payload(conn, visitId)
        if not review_payload["canConfirm"]:
            raise ProblemError(
                422,
                "TIER3_CONFIRM_REQUIREMENTS_UNMET",
                "Chưa đạt điều kiện xác nhận Tầng 3",
                f"Còn {len(review_payload['tier3ConfirmErrors'])} lỗi hoặc trường bắt buộc chưa đạt.",
                current_row_version=current_rv,
                errors=review_payload["tier3ConfirmErrors"],
            )

        rev_seq_row = conn.execute(
            "SELECT COALESCE(MAX(revision_no), 0) + 1 AS next_rev FROM visit_revision WHERE visit_id = %s",
            (str(visitId),),
        ).fetchone()
        next_rev_no = int(rev_seq_row["next_rev"])

        updated_row = conn.execute(
            """
            UPDATE visit
            SET updated_by = %s,
                status = 'confirmed',
                confirmed_at = now(),
                confirmed_by = %s,
                confirm_note = %s,
                current_revision_no = %s,
                row_version = row_version + 1
            WHERE id = %s AND row_version = %s
            RETURNING *
            """,
            (
                str(principal.user_id),
                str(principal.user_id),
                body.confirmNote,
                next_rev_no,
                str(visitId),
                current_rv,
            ),
        ).fetchone()

        updated_row["creator_name"] = conn.execute("SELECT full_name FROM app_user WHERE id=%s", (updated_row["created_by"],)).fetchone()["full_name"]
        updated_row["editor_name"] = principal.full_name
        _, ai_snapshot = _compute_review_and_ai_payload(conn, visitId)
        ai_snapshot = ai_snapshot or {}
        from .hf_form import export_snapshot
        ai_snapshot["hfSource"] = export_snapshot(conn, visitId)
        conn.execute(
            """
            INSERT INTO visit_revision (
                visit_id, revision_no, form_version_id, revision_type,
                change_reason, snapshot_data, created_by
            )
            VALUES (%s, %s, %s, 'confirmed_snapshot', %s, %s, %s)
            """,
            (
                str(visitId),
                next_rev_no,
                str(updated_row["form_version_id"]),
                body.confirmNote or "Xác nhận dữ liệu lượt khám",
                Jsonb(ai_snapshot or {}),
                str(principal.user_id),
            ),
        )

        record_audit_log(
            conn,
            actor_user_id=principal.user_id,
            action="visit_confirm",
            entity_type="visit",
            entity_id=visitId,
            ip=ip_addr,
            request_id=req_id,
            outcome="success",
            detail={
                "visitCode": updated_row["visit_code"],
                "formVersionId": str(updated_row["form_version_id"]),
                "revisionNo": next_rev_no,
            },
        )

        fv_label_row = conn.execute(
            "SELECT version_label FROM form_version WHERE id = %s",
            (str(updated_row["form_version_id"]),),
        ).fetchone()
        from .workflow import on_visit_saved
        on_visit_saved(conn, visitId, request, principal)
        conn.commit()

    out_dict = dict(updated_row)
    out_dict["form_version_label"] = fv_label_row["version_label"] if fv_label_row else None
    response.headers["ETag"] = f'"{int(updated_row["row_version"])}"'
    return visit_row_to_dict(out_dict)


@router.post(
    "/visits/{visitId}/revisions",
    operation_id="createVisitRevision",
    response_model=VisitRevision,
    status_code=201,
)
def create_visit_revision(
    visitId: UUID,
    body: CreateVisitRevisionRequest,
    request: Request,
    response: Response,
    if_match: str | None = Header(default=None, alias="If-Match"),
    principal: Principal = Depends(_require_doctor_visit),
) -> dict[str, Any]:
    reason = body.changeReason.strip()
    if len(reason) < 5:
        raise ProblemError(
            422,
            "FIELD_VALIDATION_FAILED",
            "Thiếu lý do sửa đổi sau xác nhận",
            "Lý do tạo bản sửa mới (changeReason) phải có ít nhất 5 ký tự.",
            errors=[
                {
                    "fieldCode": "changeReason",
                    "sectionCode": "ghi_chu",
                    "message": "changeReason phải dài tối thiểu 5 ký tự.",
                    "rejectedValue": body.changeReason,
                }
            ],
        )

    pool = request.app.state.pool
    req_id = get_request_id(request)
    ip_addr = get_client_ip(request)

    with pool.connection() as conn:
        access = require_visit_access(conn, visitId, principal, write=True)
        v_row = conn.execute(
            "SELECT * FROM visit WHERE id = %s FOR UPDATE",
            (str(visitId),),
        ).fetchone()
        if not v_row:
            raise ProblemError(
                404,
                "RESOURCE_NOT_FOUND",
                "Không tìm thấy lượt khám",
                "Không tồn tại lượt khám với mã định danh yêu cầu.",
            )
        current_rv = int(v_row["row_version"])
        if v_row["status"] != "confirmed":
            raise ProblemError(
                409,
                "VISIT_NOT_CONFIRMED",
                "Lượt khám chưa xác nhận",
                "Chỉ được tạo visit_revision sau khi lượt khám đã xác nhận (status = confirmed).",
                current_row_version=current_rv,
            )

        expected_rv = parse_if_match(
            if_match, body.rowVersion, current_row_version=current_rv
        )
        if expected_rv != current_rv:
            raise ProblemError(
                409,
                "CONCURRENCY_ROW_VERSION_MISMATCH",
                "Xung đột phiên bản dữ liệu (409)",
                f"Dữ liệu lượt khám hiện ở rowVersion {current_rv}.",
                current_row_version=current_rv,
            )

        rev_seq_row = conn.execute(
            "SELECT COALESCE(MAX(revision_no), 0) + 1 AS next_rev FROM visit_revision WHERE visit_id = %s",
            (str(visitId),),
        ).fetchone()
        next_rev_no = int(rev_seq_row["next_rev"])

        _, snapshot = _compute_review_and_ai_payload(conn, visitId)
        snapshot_data = dict(snapshot or {})
        snapshot_data["revisionNo"] = next_rev_no
        snapshot_data["amendmentReason"] = reason

        rev_row = conn.execute(
            """
            INSERT INTO visit_revision (
                visit_id, revision_no, form_version_id, revision_type,
                change_reason, snapshot_data, created_by
            )
            VALUES (%s, %s, %s, 'post_confirm_amendment', %s, %s, %s)
            RETURNING *
            """,
            (
                str(visitId),
                next_rev_no,
                str(v_row["form_version_id"]),
                reason,
                Jsonb(snapshot_data),
                str(principal.user_id),
            ),
        ).fetchone()

        # A post-confirm amendment deliberately reopens the working copy.  The
        # immutable revision above retains the prior confirmed snapshot; the
        # visit itself must be draft again so its fields can be edited and then
        # confirmed into a new snapshot.
        conn.execute(
            "SELECT set_config('app.allow_visit_amendment', '1', true)"
        )
        amended_visit = conn.execute(
            """
            UPDATE visit
            SET updated_by = %s,
                status = 'draft',
                confirmed_at = NULL,
                confirmed_by = NULL,
                confirm_note = NULL,
                current_revision_no = %s,
                row_version = row_version + 1
            WHERE id = %s AND row_version = %s
            RETURNING *
            """,
            (str(principal.user_id), next_rev_no, str(visitId), current_rv),
        ).fetchone()
        if not amended_visit:
            raise ProblemError(
                409,
                "CONCURRENCY_ROW_VERSION_MISMATCH",
                "Xung đột phiên bản dữ liệu (409)",
                "Lượt khám đã thay đổi trong khi mở bản sửa mới.",
                current_row_version=current_rv,
            )

        record_audit_log(
            conn,
            actor_user_id=principal.user_id,
            action="visit_confirm",
            entity_type="visit_revision",
            entity_id=rev_row["id"],
            ip=ip_addr,
            request_id=req_id,
            outcome="success",
            detail={
                "visitCode": v_row["visit_code"],
                "revisionNo": next_rev_no,
                "revisionType": "post_confirm_amendment",
                "changeReason": reason,
            },
        )
        from .workflow import on_visit_saved
        on_visit_saved(conn, visitId, request, principal)
        conn.commit()

    response.headers["ETag"] = '"' + str(int(amended_visit["row_version"])) + '"'
    return revision_row_to_dict(rev_row)


@router.get(
    "/visits/{visitId}/ai-input",
    operation_id="getVisitAiInput",
    response_model=AiInputPayload,
)
def get_visit_ai_input(
    visitId: UUID,
    request: Request,
    principal: Principal = Depends(_require_doctor_visit),
) -> dict[str, Any]:
    pool = request.app.state.pool
    with pool.connection() as conn:
        access = require_visit_access(conn, visitId, principal, write=False)
        v_row = conn.execute(
            "SELECT id, status, row_version FROM visit WHERE id = %s",
            (str(visitId),),
        ).fetchone()
        if not v_row:
            raise ProblemError(
                404,
                "RESOURCE_NOT_FOUND",
                "Không tìm thấy lượt khám",
                "Không tồn tại lượt khám với mã định danh yêu cầu.",
            )
        if v_row["status"] != "confirmed":
            raise ProblemError(
                409,
                "VISIT_NOT_CONFIRMED_FOR_AI_INPUT",
                "Lượt khám chưa xác nhận",
                "Chỉ xuất hợp đồng AiInputPayload cho lượt khám đã xác nhận (status = confirmed).",
                current_row_version=int(v_row["row_version"]),
            )
        _, ai_payload = _compute_review_and_ai_payload(conn, visitId)
        audit_access(conn, request, principal, "ai_input_export", "visit", visitId, {"contractVersion": "legacy"})
    return ai_payload or {}


@router.get("/visits/{visitId}/ai-input/hf/1.0", operation_id="getVisitHfAiInputV1", responses={409:{"description":"Visit not confirmed"},422:{"description":"AI_INPUT_NOT_READY with quality"},503:{"description":"HMAC key unavailable"}})
def get_visit_hf_ai_input(visitId: UUID, request: Request, module: Literal["ai_diagnosis","ai_lab_test","ai_treatment","ai_medsafety"] | None = None, diagnostic: bool = False, principal: Principal = Depends(_require_doctor_visit)):
    from .hf_ai import export_hf_input
    return export_hf_input(visitId,request,principal,module,diagnostic)


@router.get('/visits/{visitId}/ai-input/hf/1.1',operation_id='getVisitHfAiInputV11')
def get_visit_hf_ai_input_v11(visitId:UUID,request:Request,module:Literal['ai_diagnosis','ai_lab_test','ai_treatment','ai_medsafety']|None=None,
                            diagnostic:bool=False,principal:Principal=Depends(_require_doctor_visit)):
    from .hf_ai import export_hf_input
    return export_hf_input(visitId,request,principal,module,diagnostic,version='1.1')
