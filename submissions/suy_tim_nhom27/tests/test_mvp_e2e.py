"""End-to-end tests against real PostgreSQL 18.6 (127.0.0.1:5439) using TEMPLATE suytim_tpl.

Covers all 8 delivery criteria (TC-01..TC-08 / BAN-GIAO Section 8) and Stage D slices D1..D6,
including DB trigger enforcement, K1-K10 invariants, and persistence across app restarts.
"""
from __future__ import annotations

import os
from pathlib import Path
import sys
from typing import Any, Iterator
from uuid import uuid4

from fastapi.testclient import TestClient
import psycopg
import pytest
import yaml


SUBMISSION_ROOT = Path(__file__).resolve().parents[1]
if str(SUBMISSION_ROOT) not in sys.path:
    sys.path.insert(0, str(SUBMISSION_ROOT))

from src.mvp.app import create_app  # noqa: E402


PG_HOST = os.environ.get("MVP_TEST_PG_HOST", "127.0.0.1")
PG_PORT = os.environ.get("MVP_TEST_PG_PORT", "5439")
PG_USER = os.environ.get("MVP_TEST_PG_USER", "postgres")
PG_TEMPLATE = os.environ.get("MVP_TEST_PG_TEMPLATE", "suytim_tpl")
AUTH_SECRET = "test-secret-for-mvp-e2e-restart-check"


def _admin_dsn(db_name: str = "postgres") -> str:
    return f"postgresql://{PG_USER}@{PG_HOST}:{PG_PORT}/{db_name}"


@pytest.fixture()
def temp_pg_dsn() -> Iterator[str]:
    db_name = f"suytim_e2e_{uuid4().hex[:10]}"
    with psycopg.connect(_admin_dsn("postgres"), autocommit=True) as admin_conn:
        admin_conn.execute(f'CREATE DATABASE "{db_name}" TEMPLATE "{PG_TEMPLATE}"')
    try:
        yield _admin_dsn(db_name)
    finally:
        with psycopg.connect(_admin_dsn("postgres"), autocommit=True) as admin_conn:
            admin_conn.execute(
                """
                SELECT pg_terminate_backend(pid)
                FROM pg_stat_activity
                WHERE datname = %s AND pid <> pg_backend_pid()
                """,
                (db_name,),
            )
            admin_conn.execute(f'DROP DATABASE IF EXISTS "{db_name}"')


@pytest.fixture()
def client(temp_pg_dsn: str) -> Iterator[TestClient]:
    app = create_app(database_url=temp_pg_dsn, auth_secret=AUTH_SECRET, mount_web=True)
    with TestClient(app) as tc:
        yield tc


def _login(tc: TestClient, username: str, password: str) -> dict[str, Any]:
    res = tc.post("/api/v1/auth/login", json={"username": username, "password": password})
    assert res.status_code == 200, res.text
    return res.json()


def _auth_headers(token: str, if_match: int | str | None = None) -> dict[str, str]:
    headers = {"Authorization": f"Bearer {token}"}
    if if_match is not None:
        headers["If-Match"] = f'"{if_match}"'
    return headers


def _iter_app_routes(app: Any) -> list[tuple[str, str, str]]:
    out: list[tuple[str, str, str]] = []
    for r in app.routes:
        if hasattr(r, "original_router"):
            for route in r.original_router.routes:
                op_id = getattr(route, "operation_id", None)
                if op_id:
                    for m in route.methods or ():
                        if m not in {"HEAD", "OPTIONS"}:
                            out.append((m, route.path, op_id))
        elif getattr(r, "operation_id", None):
            for m in r.methods or ():
                if m not in {"HEAD", "OPTIONS"}:
                    out.append((m, r.path, r.operation_id))
    return out


# ---------------------------------------------------------------------------
# D1: Auth, ProblemDetails RFC 9457, Session Revocation, Web & OpenAPI Mounts
# ---------------------------------------------------------------------------
def test_d1_auth_lifecycle_problem_details_and_web_mount(
    client: TestClient, temp_pg_dsn: str
) -> None:
    health = client.get("/api/v1/health")
    assert health.status_code == 200
    assert health.json() == {"status": "ok", "persistence": "postgres"}

    # Web UI & OpenAPI mounts
    idx = client.get("/")
    assert idx.status_code == 200
    assert "api-client.js" in idx.text
    assert client.get("/config.js").status_code == 200
    assert client.get("/app.js").status_code == 200
    spec_res = client.get("/api/openapi.yaml")
    assert spec_res.status_code == 200
    assert "openapi: 3.1.0" in spec_res.text

    # Seed password hashes upgraded to real scrypt on startup
    with psycopg.connect(temp_pg_dsn) as conn:
        hashes = conn.execute(
            "SELECT username, password_hash FROM app_user ORDER BY username"
        ).fetchall()
        for uname, pwh in hashes:
            assert pwh.startswith("scrypt$"), f"{uname} hash not upgraded: {pwh}"

    # Wrong password -> 401 RFC 9457 application/problem+json
    bad = client.post(
        "/api/v1/auth/login",
        json={"username": "doctor_demo", "password": "WrongPassword!"},
    )
    assert bad.status_code == 401
    assert bad.headers["content-type"].startswith("application/problem+json")
    prob = bad.json()
    for key in ("type", "title", "status", "detail", "errors"):
        assert key in prob
    assert prob["status"] == 401

    # Valid doctor login
    doc_auth = _login(client, "doctor_demo", "Doctor@2026!")
    assert doc_auth["user"]["role"] == "doctor"
    assert "passwordHash" not in doc_auth["user"]
    assert "password_hash" not in doc_auth["user"]

    me = client.get("/api/v1/auth/me", headers=_auth_headers(doc_auth["accessToken"]))
    assert me.status_code == 200
    assert me.json()["username"] == "doctor_demo"

    # Refresh token rotation
    ref = client.post("/api/v1/auth/refresh", json={"refreshToken": doc_auth["refreshToken"]})
    assert ref.status_code == 200
    ref_data = ref.json()
    assert ref_data["refreshToken"] != doc_auth["refreshToken"]

    # Old refresh token must no longer work
    old_ref = client.post("/api/v1/auth/refresh", json={"refreshToken": doc_auth["refreshToken"]})
    assert old_ref.status_code == 401

    # Logout revokes session immediately
    out = client.post(
        "/api/v1/auth/logout",
        headers=_auth_headers(ref_data["accessToken"]),
        json={"refreshToken": ref_data["refreshToken"]},
    )
    assert out.status_code == 204
    after_logout = client.get("/api/v1/auth/me", headers=_auth_headers(ref_data["accessToken"]))
    assert after_logout.status_code == 401


# ---------------------------------------------------------------------------
# TC-01 (Mục 8.1): Patients BN-xxxxx, birth precision, 2 isolated visits
# ---------------------------------------------------------------------------
def test_tc01_patients_and_two_isolated_visits(client: TestClient) -> None:
    doc = _login(client, "doctor_demo", "Doctor@2026!")
    tok = doc["accessToken"]

    # Create patient 1 with birthYear only (no fake 01/01 birthDate)
    p1_res = client.post(
        "/api/v1/patients",
        headers=_auth_headers(tok),
        json={"fullName": "Nguyễn Văn An", "sex": "male", "birthYear": 1948},
    )
    assert p1_res.status_code == 201, p1_res.text
    p1 = p1_res.json()
    assert p1["patientCode"] == "BN-00001"
    assert p1["birthDate"] is None
    assert p1["birthYear"] == 1948
    assert p1["declaredAge"] is None
    assert p1_res.headers["etag"] == '"1"'

    # Create patient 2 with declaredAge only
    p2_res = client.post(
        "/api/v1/patients",
        headers=_auth_headers(tok),
        json={"fullName": "Trần Thị Bình", "sex": "female", "declaredAge": 79},
    )
    assert p2_res.status_code == 201
    p2 = p2_res.json()
    assert p2["patientCode"] == "BN-00002"
    assert p2["patientCode"] != p1["patientCode"]

    # Reject mixed birthDate + birthYear
    bad_pt = client.post(
        "/api/v1/patients",
        headers=_auth_headers(tok),
        json={
            "fullName": "Lê Văn C",
            "sex": "male",
            "birthDate": "1950-05-10",
            "birthYear": 1950,
        },
    )
    assert bad_pt.status_code == 422

    # Immutable patientCode + optimistic concurrency on patient PATCH
    stale_patch = client.patch(
        f"/api/v1/patients/{p1['id']}",
        headers=_auth_headers(tok, if_match=99),
        json={"rowVersion": 99, "fullName": "Nguyễn Văn An Sửa"},
    )
    assert stale_patch.status_code == 409

    tamper_code = client.patch(
        f"/api/v1/patients/{p1['id']}",
        headers=_auth_headers(tok, if_match=1),
        json={"rowVersion": 1, "patientCode": "BN-99999"},
    )
    assert tamper_code.status_code == 422

    ok_patch = client.patch(
        f"/api/v1/patients/{p1['id']}",
        headers=_auth_headers(tok, if_match=1),
        json={"rowVersion": 1, "fullName": "Nguyễn Văn An (Cập nhật)"},
    )
    assert ok_patch.status_code == 200
    assert ok_patch.json()["rowVersion"] == 2
    assert ok_patch.headers["etag"] == '"2"'

    # Create Visit 1 & populate data
    v1_res = client.post(
        f"/api/v1/patients/{p1['id']}/visits",
        headers=_auth_headers(tok),
        json={"visitDate": "2026-11-20T09:00:00Z", "visitType": "outpatient_new", "chiefComplaint": "Khó thở"},
    )
    assert v1_res.status_code == 201
    v1 = v1_res.json()

    save1 = client.put(
        f"/api/v1/visits/{v1['id']}/draft",
        headers=_auth_headers(tok, if_match=v1["rowVersion"]),
        json={
            "rowVersion": v1["rowVersion"],
            "values": [
                {"fieldCode": "chieu_cao_cm", "valueState": "answered", "valueNum": 160, "unit": "cm"},
                {"fieldCode": "can_nang_kg", "valueState": "answered", "valueNum": 64, "unit": "kg"},
            ],
            "orthostaticBp": [],
            "medications": [
                {"drugName": "Furosemide", "dose": 40, "unit": "mg", "status": "active"}
            ],
            "allergies": [],
            "labResults": [
                {"labCode": "cls_lvef", "valueNum": 35, "unit": "%", "measuredAt": "2026-11-20T08:30:00Z"}
            ],
        },
    )
    assert save1.status_code == 200, save1.text

    # Create Visit 2 on same patient -> must start completely blank (no copying from Visit 1)
    v2_res = client.post(
        f"/api/v1/patients/{p1['id']}/visits",
        headers=_auth_headers(tok),
        json={"visitDate": "2026-11-21T09:00:00Z", "visitType": "follow_up"},
    )
    assert v2_res.status_code == 201
    v2 = v2_res.json()
    assert v2["id"] != v1["id"]
    assert v2["visitCode"] != v1["visitCode"]

    v2_detail = client.get(f"/api/v1/visits/{v2['id']}", headers=_auth_headers(tok)).json()
    assert v2_detail["values"] == []
    assert v2_detail["orthostaticBp"] == []
    assert v2_detail["medications"] == []
    assert v2_detail["allergies"] == []
    assert v2_detail["labResults"] == []

    # Before v1 is confirmed, latest visit by date is v2 (blank -> bmi must be None, not leaked from v1)
    p1_detail_draft = client.get(f"/api/v1/patients/{p1['id']}", headers=_auth_headers(tok)).json()
    assert p1_detail_draft["latestVisitSummary"]["sourceVisitId"] == v2["id"]
    assert p1_detail_draft["latestVisitSummary"]["bmi"] is None

    # Confirm v1 -> latestVisitSummary prefers confirmed v1 and shows BMI 25.0 from v1
    conf_v1 = client.post(
        f"/api/v1/visits/{v1['id']}/confirm",
        headers=_auth_headers(tok, if_match=2),
        json={"rowVersion": 2, "confirmNote": "Xác nhận lượt 1"},
    )
    assert conf_v1.status_code == 200

    p1_detail = client.get(f"/api/v1/patients/{p1['id']}", headers=_auth_headers(tok)).json()
    assert p1_detail["latestVisitSummary"]["sourceVisitId"] == v1["id"]
    assert p1_detail["latestVisitSummary"]["bmi"] == 25.0

    # Filter listPatients & listPatientVisits
    listed = client.get(
        "/api/v1/patients",
        headers=_auth_headers(tok),
        params={"q": "BN-00001", "latestVisitStatus": "draft"},
    )
    assert listed.status_code == 200
    assert listed.json()["pagination"]["totalItems"] == 1
    assert listed.json()["items"][0]["visitCount"] == 2

    v_list = client.get(
        f"/api/v1/patients/{p1['id']}/visits",
        headers=_auth_headers(tok),
        params={"status": "confirmed"},
    )
    assert v_list.status_code == 200
    assert len(v_list.json()["items"]) == 1
    assert v_list.json()["items"][0]["id"] == v1["id"]


# ---------------------------------------------------------------------------
# TC-02 (Mục 8.2): 3-state values (unfilled/unknown/0/false), 422, 409, multi_choice
# ---------------------------------------------------------------------------
def test_tc02_three_state_draft_validation_and_concurrency(
    client: TestClient, temp_pg_dsn: str
) -> None:
    doc = _login(client, "doctor_demo", "Doctor@2026!")
    tok = doc["accessToken"]

    pt = client.post(
        "/api/v1/patients",
        headers=_auth_headers(tok),
        json={"fullName": "Phạm Thị Minh", "sex": "female", "birthDate": "1955-06-15"},
    ).json()
    visit = client.post(
        f"/api/v1/patients/{pt['id']}/visits",
        headers=_auth_headers(tok),
        json={"visitDate": "2026-11-20T10:00:00Z", "visitType": "outpatient_new"},
    ).json()

    form_res = client.get(f"/api/v1/visits/{visit['id']}/form", headers=_auth_headers(tok))
    assert form_res.status_code == 200
    form_data = form_res.json()
    assert len(form_data["sections"]) == 8
    assert len(form_data["fieldDefinitions"]) == 121
    defs_by_code = {d["code"]: d for d in form_data["fieldDefinitions"]}

    # Save partial draft (missing most clinical fields -> allowed in Tier 2)
    # Distinguish: unfilled (kho_tho_khi_nam omitted), unknown (ts_hoa_tri_thuoc_doc_tim),
    # answered false (kho_tho_khi_gang_suc), answered integer 0 (so_lan_cap_cuu_nhap_vien),
    # and multi_choice (muc_tieu_dieu_tri)
    multi_def = defs_by_code["muc_tieu_dieu_tri"]
    opt_ids = [o["id"] for o in multi_def["options"][:2]]

    draft_ok = client.put(
        f"/api/v1/visits/{visit['id']}/draft",
        headers=_auth_headers(tok, if_match=visit["rowVersion"]),
        json={
            "rowVersion": visit["rowVersion"],
            "values": [
                {"fieldCode": "chieu_cao_cm", "valueState": "answered", "valueNum": 162},
                {"fieldCode": "kho_tho_khi_gang_suc", "valueState": "answered", "valueBool": False},
                {"fieldCode": "so_lan_cap_cuu_nhap_vien", "valueState": "answered", "valueNum": 0, "unit": "lần"},
                {"fieldCode": "ts_hoa_tri_thuoc_doc_tim", "valueState": "unknown"},
                {
                    "fieldCode": "muc_tieu_dieu_tri",
                    "valueState": "answered",
                    "selectedOptions": [{"fieldOptionId": oid} for oid in opt_ids],
                },
            ],
            "orthostaticBp": [],
            "medications": [],
            "allergies": [],
            "labResults": [],
        },
    )
    assert draft_ok.status_code == 200, draft_ok.text
    d_body = draft_ok.json()
    assert d_body["visit"]["rowVersion"] == 2

    val_map = {v["fieldCode"]: v for v in d_body["values"]}
    assert "kho_tho_khi_nam" not in val_map
    assert val_map["kho_tho_khi_gang_suc"]["valueState"] == "answered"
    assert val_map["kho_tho_khi_gang_suc"]["valueBool"] is False
    assert val_map["so_lan_cap_cuu_nhap_vien"]["valueState"] == "answered"
    assert val_map["so_lan_cap_cuu_nhap_vien"]["valueNum"] == 0
    assert val_map["ts_hoa_tri_thuoc_doc_tim"]["valueState"] == "unknown"
    assert val_map["ts_hoa_tri_thuoc_doc_tim"]["valueBool"] is None
    assert len(val_map["muc_tieu_dieu_tri"]["selectedOptions"]) == 2

    # Check raw PostgreSQL rows directly
    with psycopg.connect(temp_pg_dsn) as conn:
        rows = conn.execute(
            """
            SELECT fd.code, vv.value_state::text, vv.value_num, vv.value_bool
            FROM visit_value vv
            JOIN field_definition fd ON fd.id = vv.field_definition_id
            WHERE vv.visit_id = %s
            """,
            (visit["id"],),
        ).fetchall()
        pg_map = {r[0]: r for r in rows}
        assert "kho_tho_khi_nam" not in pg_map
        assert pg_map["so_lan_cap_cuu_nhap_vien"][2] == 0
        assert pg_map["kho_tho_khi_gang_suc"][3] is False
        assert pg_map["ts_hoa_tri_thuoc_doc_tim"][1] == "unknown"
        assert pg_map["ts_hoa_tri_thuoc_doc_tim"][3] is None

    # 422 validation errors: SpO2 > 100, height = 0, diastolic >= systolic, unknown with valueBool
    bad_draft = client.put(
        f"/api/v1/visits/{visit['id']}/draft",
        headers=_auth_headers(tok, if_match=2),
        json={
            "rowVersion": 2,
            "values": [
                {"fieldCode": "spo2", "valueState": "answered", "valueNum": 140},
                {"fieldCode": "chieu_cao_cm", "valueState": "answered", "valueNum": 0},
                {"fieldCode": "ts_hoa_tri_thuoc_doc_tim", "valueState": "unknown", "valueBool": False},
            ],
            "orthostaticBp": [
                {
                    "position": "sitting",
                    "systolic": 100,
                    "diastolic": 110,
                    "measuredAt": "2026-11-20T10:05:00Z",
                }
            ],
            "medications": [],
            "allergies": [],
            "labResults": [],
        },
    )
    assert bad_draft.status_code == 422
    assert bad_draft.headers["content-type"].startswith("application/problem+json")
    err_codes = {e["fieldCode"] for e in bad_draft.json()["errors"]}
    assert {"spo2", "chieu_cao_cm", "ts_hoa_tri_thuoc_doc_tim", "huyet_ap_tam_thu"} <= err_codes

    # Verify previously valid draft data was NOT corrupted
    still_ok = client.get(f"/api/v1/visits/{visit['id']}", headers=_auth_headers(tok)).json()
    assert still_ok["visit"]["rowVersion"] == 2
    assert {v["fieldCode"] for v in still_ok["values"]} >= {"chieu_cao_cm", "so_lan_cap_cuu_nhap_vien"}

    # Stale If-Match -> 409 Conflict with currentRowVersion
    stale = client.put(
        f"/api/v1/visits/{visit['id']}/draft",
        headers=_auth_headers(tok, if_match=1),
        json={"rowVersion": 1, "values": [], "orthostaticBp": [], "medications": [], "allergies": [], "labResults": []},
    )
    assert stale.status_code == 409
    assert stale.json()["currentRowVersion"] == 2


# ---------------------------------------------------------------------------
# TC-03 (Mục 8.3): Repeating BP, Meds, Allergies, Labs (K6, K7)
# ---------------------------------------------------------------------------
def test_tc03_repeating_records_order_units_and_k7_separation(client: TestClient) -> None:
    doc = _login(client, "doctor_demo", "Doctor@2026!")
    tok = doc["accessToken"]

    pt = client.post(
        "/api/v1/patients",
        headers=_auth_headers(tok),
        json={"fullName": "Hoàng Văn Nam", "sex": "male", "birthYear": 1951},
    ).json()
    visit = client.post(
        f"/api/v1/patients/{pt['id']}/visits",
        headers=_auth_headers(tok),
        json={"visitDate": "2026-11-20T11:00:00Z", "visitType": "follow_up"},
    ).json()

    saved = client.put(
        f"/api/v1/visits/{visit['id']}/draft",
        headers=_auth_headers(tok, if_match=1),
        json={
            "rowVersion": 1,
            "values": [],
            "orthostaticBp": [
                {
                    "position": "supine",
                    "minuteAfter": 0,
                    "systolic": 132,
                    "diastolic": 78,
                    "heartRate": 74,
                    "measuredAt": "2026-11-20T11:02:00Z",
                },
                {
                    "position": "standing",
                    "minuteAfter": 3,
                    "systolic": 110,
                    "diastolic": 68,
                    "heartRate": 88,
                    "measuredAt": "2026-11-20T11:05:00Z",
                },
            ],
            "medications": [
                {
                    "medicationGroup": "prescribed",
                    "drugName": "Sacubitril/Valsartan",
                    "dose": 50,
                    "unit": "mg",
                    "frequency": "2 lần/ngày",
                    "route": "oral",
                    "status": "active",
                },
                {
                    "medicationGroup": "prescribed",
                    "drugName": "Empagliflozin",
                    "dose": 10,
                    "unit": "mg",
                    "frequency": "1 lần/ngày",
                    "route": "oral",
                    "status": "active",
                },
                {
                    "medicationGroup": "otc_supplement_tcm",
                    "drugName": "Hoạt huyết dưỡng não",
                    "dose": 1,
                    "unit": "viên",
                    "status": "stopped",
                },
            ],
            "allergies": [
                {
                    "kind": "allergy",
                    "agentCategory": "contrast_media",
                    "allergen": "Thuốc cản quang iod",
                    "reaction": "Mày đay toàn thân",
                    "severity": "moderate",
                },
                {
                    "kind": "adr",
                    "agentCategory": "therapeutic_drug",
                    "allergen": "Enalapril",
                    "reaction": "Ho khan kéo dài",
                    "severity": "mild",
                },
            ],
            "labResults": [
                {
                    "labCode": "cls_bnp",
                    "valueNum": 380,
                    "unit": "pg/mL",
                    "measuredAt": "2026-11-20T09:10:00Z",
                },
                {
                    "labCode": "cls_nt_probnp",
                    "valueNum": 1820.5,
                    "unit": "pg/mL",
                    "measuredAt": "2026-11-20T09:15:00Z",
                },
                {
                    "labCode": "cls_creatinin",
                    "valueNum": 124,
                    "unit": "umol/L",
                    "measuredAt": "2026-11-20T09:15:00Z",
                },
                {
                    "labCode": "cls_egfr",
                    "valueNum": 52,
                    "unit": "mL/phút/1.73m²",
                    "measuredAt": "2026-11-20T09:15:00Z",
                },
            ],
        },
    )
    assert saved.status_code == 200, saved.text

    fetched = client.get(f"/api/v1/visits/{visit['id']}", headers=_auth_headers(tok)).json()
    assert [b["position"] for b in fetched["orthostaticBp"]] == ["supine", "standing"]
    assert [m["drugName"] for m in fetched["medications"]] == [
        "Sacubitril/Valsartan",
        "Empagliflozin",
        "Hoạt huyết dưỡng não",
    ]
    assert [a["allergen"] for a in fetched["allergies"]] == [
        "Thuốc cản quang iod",
        "Enalapril",
    ]
    assert [l["labCode"] for l in fetched["labResults"]] == [
        "cls_bnp",
        "cls_nt_probnp",
        "cls_creatinin",
        "cls_egfr",
    ]
    assert fetched["labResults"][0]["unit"] == "pg/mL"
    assert fetched["labResults"][2]["unit"] == "umol/L"

    # Draft visit must return 409 for ai-input
    ai_draft = client.get(f"/api/v1/visits/{visit['id']}/ai-input", headers=_auth_headers(tok))
    assert ai_draft.status_code == 409


# ---------------------------------------------------------------------------
# TC-04 (Mục 8.4): Review Tier3 vs Tier4, Confirm, DB Lock, Revisions, AiInputPayload
# ---------------------------------------------------------------------------
def test_tc04_review_confirm_db_lock_revision_and_ai_input(
    client: TestClient, temp_pg_dsn: str
) -> None:
    doc = _login(client, "doctor_demo", "Doctor@2026!")
    tok = doc["accessToken"]

    pt = client.post(
        "/api/v1/patients",
        headers=_auth_headers(tok),
        json={"fullName": "Vũ Thị Lan", "sex": "female", "birthDate": "1950-01-10"},
    ).json()
    visit = client.post(
        f"/api/v1/patients/{pt['id']}/visits",
        headers=_auth_headers(tok),
        json={"visitDate": "2026-11-20T08:00:00Z", "visitType": "outpatient_new"},
    ).json()

    # Save draft with 0, false, unknown, BNP + NT-proBNP, Creatinin + eGFR, but missing cls_kali
    client.put(
        f"/api/v1/visits/{visit['id']}/draft",
        headers=_auth_headers(tok, if_match=1),
        json={
            "rowVersion": 1,
            "values": [
                {"fieldCode": "chieu_cao_cm", "valueState": "answered", "valueNum": 158, "unit": "cm"},
                {"fieldCode": "can_nang_kg", "valueState": "answered", "valueNum": 56, "unit": "kg"},
                {"fieldCode": "kho_tho_khi_gang_suc", "valueState": "answered", "valueBool": True},
                {"fieldCode": "kho_tho_khi_nam", "valueState": "answered", "valueBool": False},
                {"fieldCode": "so_lan_cap_cuu_nhap_vien", "valueState": "answered", "valueNum": 0, "unit": "lần"},
                {"fieldCode": "ts_hoa_tri_thuoc_doc_tim", "valueState": "unknown"},
            ],
            "orthostaticBp": [
                {"position": "sitting", "minuteAfter": 0, "systolic": 120, "diastolic": 75, "measuredAt": "2026-11-20T08:05:00Z"}
            ],
            "medications": [
                {"drugName": "Bisoprolol", "dose": 2.5, "unit": "mg", "status": "active"},
                {"drugName": "Vitamin E", "dose": 400, "unit": "IU", "status": "stopped"},
            ],
            "allergies": [],
            "labResults": [
                {"labCode": "cls_nt_probnp", "valueNum": 1450.5, "unit": "pg/mL", "measuredAt": "2026-11-20T07:50:00Z"},
                {"labCode": "cls_lvef", "valueNum": 38, "unit": "%", "measuredAt": "2026-11-20T07:55:00Z"},
            ],
        },
    )

    # K1: Review shows Tier 3 canConfirm=True even though Tier 4 AI modules have missing fields!
    rev = client.get(f"/api/v1/visits/{visit['id']}/review", headers=_auth_headers(tok)).json()
    assert rev["canConfirm"] is True
    assert rev["tier3ConfirmErrors"] == []
    mod_map = {m["aiModuleCode"]: m for m in rev["tier4AiModules"]}
    assert mod_map["ai_diagnosis"]["ready"] is False
    assert "mach" in mod_map["ai_diagnosis"]["missingFieldCodes"]

    # Confirm atomically
    conf_res = client.post(
        f"/api/v1/visits/{visit['id']}/confirm",
        headers=_auth_headers(tok, if_match=2),
        json={"rowVersion": 2, "confirmNote": "Đã rà soát đầy đủ lượt khám"},
    )
    assert conf_res.status_code == 200, conf_res.text
    conf_v = conf_res.json()
    assert conf_v["status"] == "confirmed"
    assert conf_v["confirmedBy"] == doc["user"]["id"]
    assert conf_v["confirmedAt"] is not None
    assert conf_v["rowVersion"] == 3

    # PUT /draft on confirmed visit -> 409 Conflict
    blocked_draft = client.put(
        f"/api/v1/visits/{visit['id']}/draft",
        headers=_auth_headers(tok, if_match=3),
        json={"rowVersion": 3, "values": [], "orthostaticBp": [], "medications": [], "allergies": [], "labResults": []},
    )
    assert blocked_draft.status_code == 409

    # DB triggers also block direct SQL modification on confirmed visit & child tables
    with psycopg.connect(temp_pg_dsn) as conn:
        with pytest.raises(psycopg.errors.CheckViolation):
            conn.execute("UPDATE visit SET clinical_note = 'tamper' WHERE id = %s", (visit["id"],))
        conn.rollback()
        with pytest.raises(psycopg.errors.CheckViolation):
            conn.execute(
                "INSERT INTO visit_medication (visit_id, drug_name) VALUES (%s, 'Aspirin')",
                (visit["id"],),
            )
        conn.rollback()

    # Post-confirm revision requires changeReason >= 5 chars
    bad_rev = client.post(
        f"/api/v1/visits/{visit['id']}/revisions",
        headers=_auth_headers(tok, if_match=3),
        json={"rowVersion": 3, "changeReason": "abc"},
    )
    assert bad_rev.status_code == 422

    ok_rev = client.post(
        f"/api/v1/visits/{visit['id']}/revisions",
        headers=_auth_headers(tok, if_match=3),
        json={"rowVersion": 3, "changeReason": "Bổ sung nhận xét sau hội chẩn tim mạch"},
    )
    assert ok_rev.status_code == 201, ok_rev.text
    assert ok_rev.json()["revisionNo"] == 2
    assert ok_rev.json()["revisionType"] == "post_confirm_amendment"

    detail = client.get(f"/api/v1/visits/{visit['id']}", headers=_auth_headers(tok)).json()
    assert [r["revisionNo"] for r in detail["revisions"]] == [1, 2]
    assert detail["revisions"][0]["revisionType"] == "confirmed_snapshot"
    assert detail["visit"]["status"] == "draft"
    assert detail["visit"]["rowVersion"] == 4
    assert detail["visit"]["confirmedAt"] is None
    assert detail["visit"]["confirmedBy"] is None
    amended_list = client.get(
        "/api/v1/patients",
        headers=_auth_headers(tok),
        params={"q": pt["patientCode"], "latestVisitStatus": "draft"},
    )
    assert amended_list.status_code == 200
    assert amended_list.json()["items"][0]["latestVisitId"] == visit["id"]
    assert amended_list.json()["items"][0]["latestVisitStatus"] == "draft"

    # The amendment opens an editable draft.  A fresh confirmation must create
    # the next immutable snapshot before AiInputPayload can be read again.
    draft_ai = client.get(f"/api/v1/visits/{visit['id']}/ai-input", headers=_auth_headers(tok))
    assert draft_ai.status_code == 409
    reconfirm = client.post(
        f"/api/v1/visits/{visit['id']}/confirm",
        headers=_auth_headers(tok, if_match=4),
        json={"rowVersion": 4, "confirmNote": "Đã xác nhận lại sau khi sửa"},
    )
    assert reconfirm.status_code == 200, reconfirm.text
    assert reconfirm.json()["status"] == "confirmed"
    assert reconfirm.json()["rowVersion"] == 5
    confirmed_list = client.get(
        "/api/v1/patients",
        headers=_auth_headers(tok),
        params={"q": pt["patientCode"], "latestVisitStatus": "confirmed"},
    )
    assert confirmed_list.status_code == 200
    assert confirmed_list.json()["items"][0]["latestVisitStatus"] == "confirmed"

    # AiInputPayload contract on confirmed visit
    ai_res = client.get(f"/api/v1/visits/{visit['id']}/ai-input", headers=_auth_headers(tok))
    assert ai_res.status_code == 200, ai_res.text
    ai = ai_res.json()
    assert ai["patientCode"] == pt["patientCode"]
    assert ai["formVersionId"] == visit["formVersionId"]
    assert ai["confirmedBy"] == doc["user"]["id"]
    assert "kho_tho_khi_tet_unfilled" not in ai["values"]
    assert "phu_hai_chi_duoi" not in ai["values"]
    assert ai["values"]["kho_tho_khi_nam"] == {"state": "answered", "value": False, "unit": None}
    assert ai["values"]["so_lan_cap_cuu_nhap_vien"] == {"state": "answered", "value": 0, "unit": "lần"}
    assert ai["values"]["ts_hoa_tri_thuoc_doc_tim"] == {"state": "unknown", "value": None, "unit": None}
    assert ai["values"]["so_luong_thuoc_dong_thoi"] == {"state": "answered", "value": 1, "unit": "thuốc"}
    assert ai["values"]["bmi"]["state"] == "answered"
    assert ai["values"]["luot_tuoi"] == {"state": "answered", "value": 76, "unit": "tuổi"}
    assert len(ai["modules"]) == 4


# ---------------------------------------------------------------------------
# TC-05 (Mục 8.5): Strict RBAC K8 Matrix (403), Admin Users, Audit Log Hygiene
# ---------------------------------------------------------------------------
def test_tc05_rbac_k8_matrix_admin_users_and_audit_logs(client: TestClient) -> None:
    doc = _login(client, "doctor_demo", "Doctor@2026!")
    adm = _login(client, "admin_demo", "Admin@2026!")
    doc_tok = doc["accessToken"]
    adm_tok = adm["accessToken"]

    fake_id = "00000000-0000-4000-8000-000000000999"

    # Admin calling ANY clinical endpoint -> 403 Forbidden (K8)
    clinical_calls = [
        ("GET", "/api/v1/patients"),
        ("POST", "/api/v1/patients"),
        ("GET", f"/api/v1/patients/{fake_id}"),
        ("PATCH", f"/api/v1/patients/{fake_id}"),
        ("GET", f"/api/v1/patients/{fake_id}/visits"),
        ("POST", f"/api/v1/patients/{fake_id}/visits"),
        ("GET", f"/api/v1/visits/{fake_id}"),
        ("GET", f"/api/v1/visits/{fake_id}/form"),
        ("PUT", f"/api/v1/visits/{fake_id}/draft"),
        ("GET", f"/api/v1/visits/{fake_id}/review"),
        ("POST", f"/api/v1/visits/{fake_id}/confirm"),
        ("POST", f"/api/v1/visits/{fake_id}/revisions"),
        ("GET", f"/api/v1/visits/{fake_id}/ai-input"),
    ]
    for method, path in clinical_calls:
        res = client.request(method, path, headers=_auth_headers(adm_tok), json={})
        assert res.status_code == 403, f"Admin allowed or non-403 on {method} {path}: {res.status_code}"
        assert res.headers["content-type"].startswith("application/problem+json")

    # Doctor calling ANY admin endpoint -> 403 Forbidden
    admin_calls = [
        ("GET", "/api/v1/admin/users"),
        ("POST", "/api/v1/admin/users"),
        ("GET", f"/api/v1/admin/users/{fake_id}"),
        ("PATCH", f"/api/v1/admin/users/{fake_id}"),
        ("POST", "/api/v1/admin/users/permission-preview"),
        ("GET", "/api/v1/admin/field-definitions"),
        ("GET", "/api/v1/admin/forms"),
        ("GET", f"/api/v1/admin/forms/{fake_id}/versions"),
        ("POST", f"/api/v1/admin/forms/{fake_id}/versions"),
        ("GET", f"/api/v1/admin/form-versions/{fake_id}"),
        ("PATCH", f"/api/v1/admin/form-versions/{fake_id}"),
        ("DELETE", f"/api/v1/admin/form-versions/{fake_id}"),
        ("GET", f"/api/v1/admin/form-versions/{fake_id}/preview"),
        ("GET", f"/api/v1/admin/form-versions/{fake_id}/diff?baseVersionId={fake_id}"),
        ("POST", f"/api/v1/admin/form-versions/{fake_id}/publish"),
        ("GET", "/api/v1/admin/audit-logs"),
    ]
    for method, path in admin_calls:
        res = client.request(method, path, headers=_auth_headers(doc_tok), json={})
        assert res.status_code == 403, f"Doctor allowed or non-403 on {method} {path}: {res.status_code}"
        assert res.headers["content-type"].startswith("application/problem+json")

    # Permission preview (K8)
    pv_admin = client.post(
        "/api/v1/admin/users/permission-preview",
        headers=_auth_headers(adm_tok),
        json={"role": "admin"},
    ).json()
    assert pv_admin["clinicalDataAccessAllowed"] is False

    pv_doc = client.post(
        "/api/v1/admin/users/permission-preview",
        headers=_auth_headers(adm_tok),
        json={"role": "doctor"},
    ).json()
    assert pv_doc["clinicalDataAccessAllowed"] is True

    # Create new doctor account -> oneTimeSetupCode works for login -> no passwordHash leaked
    created_res = client.post(
        "/api/v1/admin/users",
        headers=_auth_headers(adm_tok),
        json={
            "username": "bs.tuan",
            "fullName": "BS. Đỗ Văn Tuấn",
            "role": "doctor",
            "isActive": True,
            "reason": "Cấp tài khoản bác sĩ khoa Tim mạch",
        },
    )
    assert created_res.status_code == 201, created_res.text
    created = created_res.json()
    otp = created["oneTimeSetupCode"]
    new_uid = created["user"]["id"]
    assert "passwordHash" not in created["user"]
    assert "password_hash" not in created["user"]

    # New doctor logs in with oneTimeSetupCode
    tuan_auth = _login(client, "bs.tuan", otp)
    tuan_tok = tuan_auth["accessToken"]

    # Optimistic concurrency C4 on user PATCH
    stale_user = client.patch(
        f"/api/v1/admin/users/{new_uid}",
        headers=_auth_headers(adm_tok, if_match=99),
        json={"rowVersion": 99, "isActive": False, "reason": "Thử sai phiên bản"},
    )
    assert stale_user.status_code == 409

    # Lock bs.tuan -> revokes session immediately -> existing token gets 403, login gets 403
    locked = client.patch(
        f"/api/v1/admin/users/{new_uid}",
        headers=_auth_headers(adm_tok, if_match=1),
        json={"rowVersion": 1, "isActive": False, "reason": "Tạm khóa kiểm thử"},
    )
    assert locked.status_code == 200
    assert locked.json()["user"]["isActive"] is False
    assert locked.json()["user"]["rowVersion"] == 2

    assert client.get("/api/v1/auth/me", headers=_auth_headers(tuan_tok)).status_code in (401, 403)
    assert client.post("/api/v1/auth/login", json={"username": "bs.tuan", "password": otp}).status_code == 403

    # Unlock + reset password -> new oneTimeSetupCode works
    reset_res = client.patch(
        f"/api/v1/admin/users/{new_uid}",
        headers=_auth_headers(adm_tok, if_match=2),
        json={
            "rowVersion": 2,
            "isActive": True,
            "resetPassword": True,
            "reason": "Mở khóa và cấp lại mã kích hoạt",
        },
    )
    assert reset_res.status_code == 200, reset_res.text
    new_otp = reset_res.json()["oneTimeSetupCode"]
    assert new_otp and new_otp != otp
    assert _login(client, "bs.tuan", new_otp)["user"]["username"] == "bs.tuan"

    # Cannot lock last active admin
    last_adm = client.patch(
        f"/api/v1/admin/users/{adm['user']['id']}",
        headers=_auth_headers(adm_tok, if_match=adm["user"]["rowVersion"]),
        json={"rowVersion": adm["user"]["rowVersion"], "isActive": False, "reason": "Tự khóa admin cuối"},
    )
    assert last_adm.status_code == 409

    # Audit logs filter & zero clinical/password exposure
    logs = client.get(
        "/api/v1/admin/audit-logs",
        headers=_auth_headers(adm_tok),
        params={"entityType": "app_user", "pageSize": 50},
    )
    assert logs.status_code == 200
    items = logs.json()["items"]
    assert len(items) >= 2
    for log_item in items:
        detail_str = str(log_item["detail"]).lower()
        assert otp.lower() not in detail_str
        assert "password_hash" not in detail_str
        assert "visit_values" not in detail_str

    # Invalid date range -> 422
    bad_range = client.get(
        "/api/v1/admin/audit-logs",
        headers=_auth_headers(adm_tok),
        params={"fromDate": "2026-11-25T00:00:00Z", "toDate": "2026-11-20T00:00:00Z"},
    )
    assert bad_range.status_code == 422

    # Also verify 'from'/'to' query param aliases and Swagger /docs
    alias_logs = client.get(
        "/api/v1/admin/audit-logs",
        headers=_auth_headers(adm_tok),
        params={"from": "2020-01-01T00:00:00Z", "to": "2030-01-01T00:00:00Z", "action": "user_create"},
    )
    assert alias_logs.status_code == 200
    assert alias_logs.json()["pagination"]["totalItems"] >= 1
    assert client.get("/docs").status_code == 200


# ---------------------------------------------------------------------------
# TC-06 (Mục 8.6): FormVersion immutability (K4), Draft -> Edit -> Preview -> Diff -> Publish
# ---------------------------------------------------------------------------
def test_tc06_form_version_immutability_diff_publish_and_visit_binding(
    client: TestClient, temp_pg_dsn: str
) -> None:
    doc = _login(client, "doctor_demo", "Doctor@2026!")
    adm = _login(client, "admin_demo", "Admin@2026!")
    doc_tok = doc["accessToken"]
    adm_tok = adm["accessToken"]

    # Create patient & visit bound to v1.0 BEFORE publishing v1.1
    pt = client.post(
        "/api/v1/patients",
        headers=_auth_headers(doc_tok),
        json={"fullName": "Đặng Văn Hùng", "sex": "male", "birthYear": 1953},
    ).json()
    visit_v1 = client.post(
        f"/api/v1/patients/{pt['id']}/visits",
        headers=_auth_headers(doc_tok),
        json={"visitDate": "2026-11-20T08:00:00Z", "visitType": "outpatient_new"},
    ).json()

    # Check 121 field definitions (95 mvp + 26 can_xac_nhan)
    defs_res = client.get("/api/v1/admin/field-definitions", headers=_auth_headers(adm_tok)).json()
    assert defs_res["total"] == 121

    forms = client.get("/api/v1/admin/forms", headers=_auth_headers(adm_tok)).json()["items"]
    form_id = forms[0]["id"]
    versions = client.get(
        f"/api/v1/admin/forms/{form_id}/versions", headers=_auth_headers(adm_tok)
    ).json()["items"]
    v1 = versions[0]
    assert v1["status"] == "published"
    assert visit_v1["formVersionId"] == v1["id"]

    # Direct edit of published v1 -> 409 Conflict (K4)
    v1_detail = client.get(f"/api/v1/admin/form-versions/{v1['id']}", headers=_auth_headers(adm_tok)).json()
    imm = client.patch(
        f"/api/v1/admin/form-versions/{v1['id']}",
        headers=_auth_headers(adm_tok, if_match=v1["rowVersion"]),
        json={"rowVersion": v1["rowVersion"], "sections": v1_detail["sections"]},
    )
    assert imm.status_code == 409

    # DB trigger also blocks direct SQL modification on published form_version
    with psycopg.connect(temp_pg_dsn) as conn:
        with pytest.raises(psycopg.errors.CheckViolation):
            conn.execute("UPDATE form_version SET change_note = 'tamper' WHERE id = %s", (v1["id"],))
        conn.rollback()

    # Create draft v1.1 from v1.0
    draft_res = client.post(
        f"/api/v1/admin/forms/{form_id}/versions",
        headers=_auth_headers(adm_tok),
        json={"basedOnVersionId": v1["id"], "changeNote": "Bật chỉ số can_xac_nhan"},
    )
    assert draft_res.status_code == 201, draft_res.text
    v2_draft = draft_res.json()
    assert v2_draft["status"] == "draft"

    # Creating a second draft while v1.1 draft is open -> 409
    dup_draft = client.post(
        f"/api/v1/admin/forms/{form_id}/versions",
        headers=_auth_headers(adm_tok),
        json={"basedOnVersionId": v1["id"]},
    )
    assert dup_draft.status_code == 409

    # Edit draft: toggle visibility of 'so_lan_cap_cuu_nhap_vien' & require 'kho_tho_khi_gang_suc' for Tier 3
    v2_detail = client.get(
        f"/api/v1/admin/form-versions/{v2_draft['id']}", headers=_auth_headers(adm_tok)
    ).json()
    sections = v2_detail["sections"]
    for sec in sections:
        for ff in sec["fields"]:
            if ff["fieldCode"] == "so_lan_cap_cuu_nhap_vien":
                ff["isVisible"] = True
            if ff["fieldCode"] == "kho_tho_khi_gang_suc":
                ff["requiredForConfirm"] = True
                ff["customLabelVi"] = "Khó thở khi gắng sức (Bắt buộc T3)"

    upd_v2 = client.patch(
        f"/api/v1/admin/form-versions/{v2_draft['id']}",
        headers=_auth_headers(adm_tok, if_match=v2_draft["rowVersion"]),
        json={"rowVersion": v2_draft["rowVersion"], "sections": sections},
    )
    assert upd_v2.status_code == 200, upd_v2.text
    new_v2_rv = upd_v2.json()["formVersion"]["rowVersion"]

    # Preview & Diff
    prev = client.get(
        f"/api/v1/admin/form-versions/{v2_draft['id']}/preview", headers=_auth_headers(adm_tok)
    )
    assert prev.status_code == 200
    assert prev.json()["isPreviewOnly"] is True

    diff = client.get(
        f"/api/v1/admin/form-versions/{v2_draft['id']}/diff",
        headers=_auth_headers(adm_tok),
        params={"baseVersionId": v1["id"]},
    )
    assert diff.status_code == 200
    diff_data = diff.json()
    assert diff_data["hasChanges"] is True
    assert any(f["fieldCode"] == "so_lan_cap_cuu_nhap_vien" for f in diff_data["addedFields"])
    assert any(f["fieldCode"] == "kho_tho_khi_gang_suc" for f in diff_data["modifiedFields"])

    # Publish v1.1 -> atomically retires v1.0
    pub = client.post(
        f"/api/v1/admin/form-versions/{v2_draft['id']}/publish",
        headers=_auth_headers(adm_tok, if_match=new_v2_rv),
        json={"rowVersion": new_v2_rv, "changeNote": "Phát hành v1.1"},
    )
    assert pub.status_code == 200, pub.text
    assert pub.json()["status"] == "published"

    v1_after = client.get(f"/api/v1/admin/form-versions/{v1['id']}", headers=_auth_headers(adm_tok)).json()
    assert v1_after["formVersion"]["status"] == "retired"

    # Old visit STILL binds to v1.0; new visit binds to v1.1 and enforces Tier 3 requiredForConfirm!
    visit_v2 = client.post(
        f"/api/v1/patients/{pt['id']}/visits",
        headers=_auth_headers(doc_tok),
        json={"visitDate": "2026-11-21T08:00:00Z", "visitType": "follow_up"},
    ).json()
    assert visit_v2["formVersionId"] == v2_draft["id"]

    old_form = client.get(f"/api/v1/visits/{visit_v1['id']}/form", headers=_auth_headers(doc_tok)).json()
    assert old_form["formVersion"]["id"] == v1["id"]

    # Confirming visit_v2 without kho_tho_khi_gang_suc must fail Tier 3 with 422!
    bad_confirm = client.post(
        f"/api/v1/visits/{visit_v2['id']}/confirm",
        headers=_auth_headers(doc_tok, if_match=1),
        json={"rowVersion": 1},
    )
    assert bad_confirm.status_code == 422
    assert any(e["fieldCode"] == "kho_tho_khi_gang_suc" for e in bad_confirm.json()["errors"])


# ---------------------------------------------------------------------------
# TC-07 & TC-08: 33/33 OpenAPI Parity, K9 Scope Exclusion, Restart Persistence
# ---------------------------------------------------------------------------
def test_tc07_openapi_33_routes_k9_and_restart_persistence(temp_pg_dsn: str) -> None:
    spec_path = SUBMISSION_ROOT / "api" / "openapi.yaml"
    spec = yaml.safe_load(spec_path.read_text(encoding="utf-8"))
    spec_ops = {
        (method.upper(), "/api/v1" + path, op["operationId"])
        for path, path_item in spec["paths"].items()
        for method, op in path_item.items()
        if method in {"get", "post", "put", "patch", "delete"} and "operationId" in op
    }

    app1 = create_app(database_url=temp_pg_dsn, auth_secret=AUTH_SECRET, mount_web=True)
    app_ops = set(_iter_app_routes(app1))
    assert len(spec_ops) == 33
    assert app_ops == spec_ops

    # Verify K9: zero excluded routes (import/excel/his/portal/predict)
    for _, path, op_id in app_ops:
        combined = f"{path} {op_id}".lower()
        for forbidden in ("import", "excel", "his", "portal", "predict"):
            assert forbidden not in combined

    # Persist data in app instance #1
    with TestClient(app1) as tc1:
        doc = _login(tc1, "doctor_demo", "Doctor@2026!")
        tok = doc["accessToken"]
        pt = tc1.post(
            "/api/v1/patients",
            headers=_auth_headers(tok),
            json={"fullName": "Nguyễn Thị Persist", "sex": "female", "birthYear": 1954},
        ).json()
        v = tc1.post(
            f"/api/v1/patients/{pt['id']}/visits",
            headers=_auth_headers(tok),
            json={"visitDate": "2026-11-20T14:00:00Z", "visitType": "outpatient_new"},
        ).json()
        tc1.put(
            f"/api/v1/visits/{v['id']}/draft",
            headers=_auth_headers(tok, if_match=1),
            json={
                "rowVersion": 1,
                "values": [{"fieldCode": "so_lan_cap_cuu_nhap_vien", "valueState": "answered", "valueNum": 0}],
                "orthostaticBp": [],
                "medications": [],
                "allergies": [],
                "labResults": [],
            },
        )
        tc1.post(
            f"/api/v1/visits/{v['id']}/confirm",
            headers=_auth_headers(tok, if_match=2),
            json={"rowVersion": 2, "confirmNote": "Restart persistence test"},
        )
        refresh_tok = doc["refreshToken"]

    # Restart completely fresh FastAPI app2 against the SAME PostgreSQL database
    app2 = create_app(database_url=temp_pg_dsn, auth_secret=AUTH_SECRET, mount_web=True)
    with TestClient(app2) as tc2:
        refreshed = tc2.post("/api/v1/auth/refresh", json={"refreshToken": refresh_tok})
        assert refreshed.status_code == 200
        tok2 = refreshed.json()["accessToken"]

        pt_read = tc2.get(f"/api/v1/patients/{pt['id']}", headers=_auth_headers(tok2))
        assert pt_read.status_code == 200
        assert pt_read.json()["patient"]["patientCode"] == "BN-00001"

        ai_read = tc2.get(f"/api/v1/visits/{v['id']}/ai-input", headers=_auth_headers(tok2))
        assert ai_read.status_code == 200
        assert ai_read.json()["values"]["so_lan_cap_cuu_nhap_vien"] == {
            "state": "answered",
            "value": 0,
            "unit": "lần",
        }
