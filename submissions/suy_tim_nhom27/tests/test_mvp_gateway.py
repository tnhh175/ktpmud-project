"""Meaningful MVP contract and stub checks; no database or real hospital data."""
from pathlib import Path

import yaml
from fastapi.testclient import TestClient
from openapi_spec_validator import validate

from src.mvp_gateway.main import create_app


def client_and_headers():
    client = TestClient(create_app())
    headers = {}
    for role in ("doctor", "admin"):
        response = client.post("/api/v1/auth/token", json={"login_name": f"{role}_demo", "password": "demo-only"})
        assert response.status_code == 200
        headers[role] = {"Authorization": f"Bearer {response.json()['access_token']}"}
    return client, headers


def test_contract_matches_runnable_stub():
    from src.mvp_gateway.spec import contract
    app = create_app()
    path = Path(__file__).resolve().parents[1] / "api" / "openapi.yaml"
    spec = yaml.safe_load(path.read_text(encoding="utf-8"))
    assert spec == contract(app)
    assert spec["openapi"] == "3.0.3"
    validate(spec)
    assert spec["paths"]["/api/v1/imports/preview"]["post"]["requestBody"]["content"]["application/octet-stream"]
    assert spec["paths"]["/api/v1/patients"]["post"]["security"] == [{"BearerAuth": []}]


def test_patient_encounter_and_observation_bound_to_form_version():
    c, h = client_and_headers()
    assert c.post("/api/v1/patients", json={"full_name": "BN giả lập"}).status_code == 401
    assert c.post("/api/v1/patients", json={"full_name": "BN giả lập"}, headers=h["admin"]).status_code == 403
    p = c.post("/api/v1/patients", json={"full_name": "BN giả lập"}, headers=h["doctor"])
    assert p.status_code == 201 and p.json()["patient_code"] == "BN-00001"
    assert c.post("/api/v1/patients", json={"full_name": "BN 2", "birth_date": "1980-01-01", "birth_year": 1980}, headers=h["doctor"]).status_code == 422
    e = c.post("/api/v1/patients/1/encounters", json={"form_version_id": 1}, headers=h["doctor"])
    assert e.status_code == 201 and e.json()["encounter_code"] == "LK-00001"
    url = "/api/v1/encounters/1/observations/1/default"
    unknown = c.put(url, json={"value_status": "unknown"}, headers=h["doctor"])
    assert unknown.status_code == 200 and unknown.json()["value_number"] is None
    zero = c.put(url, json={"value_status": "known", "value_number": 0}, headers=h["doctor"])
    assert zero.status_code == 200 and zero.json()["version_no"] == 2
    assert c.put(url, json={"value_status": "unknown", "value_number": 0}, headers=h["doctor"]).status_code == 422
    assert c.put("/api/v1/encounters/1/observations/999/default", json={"value_status": "known", "value_number": 42}, headers=h["doctor"]).status_code == 409
    assert c.put(url, json={"value_status": "known", "value_text": "50"}, headers=h["doctor"]).status_code == 422


def test_form_version_and_file_stub_never_claim_import_success():
    c, h = client_and_headers()
    p = c.post("/api/v1/patients", json={"full_name": "BN giả lập"}, headers=h["doctor"]).json()
    c.post(f"/api/v1/patients/{p['id']}/encounters", json={"form_version_id": 1}, headers=h["doctor"])
    form = c.get("/api/v1/form-versions/1", headers=h["admin"]).json()
    assert c.put("/api/v1/form-versions/1", json=form, headers=h["admin"]).status_code == 409
    profile = c.post("/api/v1/mapping-profiles", json={"name": "Mẫu thử", "form_version_id": 1, "rules": {"LVEF": 1}}, headers=h["admin"])
    assert profile.status_code == 201
    params = {"source_name": "HIS", "mapping_profile_id": 1, "patient_id": 1, "encounter_id": 1, "file_name": "du_lieu_mau.xlsx"}
    preview = c.post("/api/v1/imports/preview", params=params, content=b"synthetic test bytes", headers={**h["doctor"], "Content-Type": "application/octet-stream"})
    assert preview.status_code == 201 and preview.json()["mode"] == "stub_unparsed" and preview.json()["items"] == []
    assert c.post("/api/v1/imports/1/apply", headers=h["doctor"]).status_code == 409
    params["patient_id"] = 999
    assert c.post("/api/v1/imports/preview", params=params, content=b"test", headers={**h["doctor"], "Content-Type": "application/octet-stream"}).status_code == 404


def test_slot_capacity_and_admin_only_backup():
    c, h = client_and_headers()
    c.post("/api/v1/patients", json={"full_name": "BN giả lập"}, headers=h["doctor"])
    slot = c.post("/api/v1/clinic-slots", json={"starts_at": "2026-11-20T09:00:00Z", "ends_at": "2026-11-20T09:30:00Z", "capacity": 1}, headers=h["admin"])
    assert slot.status_code == 201
    assert c.post("/api/v1/appointments", json={"patient_id": 1, "slot_id": 1}, headers=h["doctor"]).status_code == 201
    assert c.post("/api/v1/appointments", json={"patient_id": 1, "slot_id": 1}, headers=h["doctor"]).status_code == 409
    assert c.post("/api/v1/admin/backups", headers=h["doctor"]).status_code == 403
    assert c.post("/api/v1/admin/backups", headers=h["admin"]).status_code == 501
