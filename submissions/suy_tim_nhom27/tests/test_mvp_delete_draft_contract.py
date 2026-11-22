"""Contract and runtime coverage for deleting an unused form-version draft."""
from __future__ import annotations

from pathlib import Path
from uuid import uuid4

from fastapi.testclient import TestClient
from openapi_spec_validator import validate_spec
import yaml

from test_mvp_e2e import _auth_headers, _login, client, temp_pg_dsn  # noqa: F401


ROOT = Path(__file__).resolve().parents[1]
DELETE_PATH = "/admin/form-versions/{versionId}"


def test_delete_draft_is_in_source_and_internal_contract(client: TestClient) -> None:
    spec = yaml.safe_load((ROOT / "api" / "openapi.yaml").read_text(encoding="utf-8"))
    validate_spec(spec)
    operation = spec["paths"][DELETE_PATH]["delete"]
    assert operation["operationId"] == "deleteFormVersionDraft"
    assert operation["x-allowed-roles"] == ["admin"]
    assert spec["security"] == [{"bearerAuth": []}]
    assert len(operation["parameters"]) == 1
    if_match = operation["parameters"][0]
    assert (if_match["name"], if_match["in"], if_match["required"]) == (
        "If-Match", "header", False
    )
    assert if_match["schema"]["type"] == "string"
    assert set(operation["responses"]) == {"200", "401", "403", "404", "409", "422"}
    assert operation["responses"]["200"]["content"]["application/json"]["schema"]["$ref"] == (
        "#/components/schemas/DeleteFormVersionDraftResponse"
    )
    response_schema = spec["components"]["schemas"]["DeleteFormVersionDraftResponse"]
    assert set(response_schema["required"]) == {"deleted", "versionId", "versionLabel"}
    assert response_schema["properties"]["deleted"] == {"type": "boolean", "const": True}
    assert response_schema["properties"]["versionId"] == {"type": "string", "format": "uuid"}

    assert client.app.openapi() == spec
    assert client.get("/api/openapi.yaml").status_code == 404
    assert client.get("/api/openapi.json").status_code == 404
    assert client.get("/docs").status_code == 404


def test_delete_draft_permissions_preconditions_and_response(client: TestClient) -> None:
    admin_token = _login(client, "admin_demo", "Admin@2026!")["accessToken"]
    doctor_token = _login(client, "doctor_demo", "Doctor@2026!")["accessToken"]
    forms = client.get("/api/v1/admin/forms", headers=_auth_headers(admin_token))
    assert forms.status_code == 200
    form_id = forms.json()["items"][0]["id"]
    versions = client.get(
        f"/api/v1/admin/forms/{form_id}/versions", headers=_auth_headers(admin_token)
    )
    assert versions.status_code == 200
    published = next(version for version in versions.json()["items"] if version["status"] == "published")

    draft_response = client.post(
        f"/api/v1/admin/forms/{form_id}/versions",
        headers=_auth_headers(admin_token),
        json={"basedOnVersionId": published["id"], "changeNote": "Kiểm tra xóa nháp"},
    )
    assert draft_response.status_code == 201
    draft = draft_response.json()
    draft_url = f"/api/v1/admin/form-versions/{draft['id']}"

    unauthenticated = client.delete(draft_url)
    assert unauthenticated.status_code == 401
    assert unauthenticated.headers["content-type"].startswith("application/problem+json")

    forbidden = client.delete(draft_url, headers=_auth_headers(doctor_token))
    assert forbidden.status_code == 403
    assert forbidden.json()["code"] == "RBAC_ROLE_FORBIDDEN"

    missing = client.delete(
        f"/api/v1/admin/form-versions/{uuid4()}", headers=_auth_headers(admin_token)
    )
    assert missing.status_code == 404
    assert missing.json()["code"] == "RESOURCE_NOT_FOUND"

    nondraft = client.delete(
        f"/api/v1/admin/form-versions/{published['id']}",
        headers=_auth_headers(admin_token, if_match=published["rowVersion"]),
    )
    assert nondraft.status_code == 409
    assert nondraft.json()["code"] == "FORM_VERSION_NOT_DRAFT"
    assert nondraft.json()["currentRowVersion"] == published["rowVersion"]

    stale = client.delete(
        draft_url, headers=_auth_headers(admin_token, if_match=draft["rowVersion"] + 1)
    )
    assert stale.status_code == 409
    assert stale.json()["code"] == "CONCURRENCY_ROW_VERSION_MISMATCH"
    assert stale.json()["currentRowVersion"] == draft["rowVersion"]

    malformed_headers = _auth_headers(admin_token)
    malformed_headers["If-Match"] = "not-an-etag"
    malformed = client.delete(draft_url, headers=malformed_headers)
    assert malformed.status_code == 422
    assert malformed.json()["code"] == "INVALID_IF_MATCH"
    assert client.get(draft_url, headers=_auth_headers(admin_token)).status_code == 200

    deleted = client.delete(
        draft_url, headers=_auth_headers(admin_token, if_match=draft["rowVersion"])
    )
    assert deleted.status_code == 200
    assert deleted.json() == {
        "deleted": True,
        "versionId": draft["id"],
        "versionLabel": draft["versionLabel"],
    }
    assert client.get(draft_url, headers=_auth_headers(admin_token)).status_code == 404

    # The existing runtime also accepts this DELETE without If-Match.
    second = client.post(
        f"/api/v1/admin/forms/{form_id}/versions",
        headers=_auth_headers(admin_token),
        json={"basedOnVersionId": published["id"], "changeNote": "Kiểm tra header tùy chọn"},
    )
    assert second.status_code == 201
    second_draft = second.json()
    without_if_match = client.delete(
        f"/api/v1/admin/form-versions/{second_draft['id']}",
        headers=_auth_headers(admin_token),
    )
    assert without_if_match.status_code == 200
    assert without_if_match.json()["versionId"] == second_draft["id"]
