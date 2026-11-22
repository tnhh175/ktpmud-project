"""Doctor self-service password changes against an isolated PostgreSQL clone."""
from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor

from fastapi.testclient import TestClient
import psycopg

from test_mvp_e2e import AUTH_SECRET, _auth_headers, _login, client, temp_pg_dsn
from src.mvp.app import create_app


URL = "/api/v1/auth/change-password"
OLD = "Doctor@2026!"
NEW = "ChangedDoctor@2026!"


def _user_state(dsn: str) -> tuple[str, int]:
    with psycopg.connect(dsn) as conn:
        row = conn.execute(
            "SELECT password_hash, row_version FROM app_user WHERE username = 'doctor_demo'"
        ).fetchone()
    return row[0], row[1]


def test_change_password_rejects_invalid_input_without_mutating_account(
    client: TestClient, temp_pg_dsn: str
) -> None:
    doctor = _login(client, "doctor_demo", OLD)
    admin = _login(client, "admin_demo", "Admin@2026!")
    headers = _auth_headers(doctor["accessToken"])
    before = _user_state(temp_pg_dsn)

    no_auth = client.post(URL, json={"currentPassword": OLD, "newPassword": NEW})
    assert no_auth.status_code == 401
    denied = client.post(
        URL,
        headers=_auth_headers(admin["accessToken"]),
        json={"currentPassword": "Admin@2026!", "newPassword": NEW},
    )
    assert denied.status_code == 403

    invalid = [
        ({"currentPassword": "wrong-current", "newPassword": NEW}, "CURRENT_PASSWORD_INCORRECT", "currentPassword"),
        ({"currentPassword": OLD, "newPassword": OLD}, "FIELD_VALIDATION_FAILED", "newPassword"),
        ({"currentPassword": OLD, "newPassword": "short"}, "FIELD_VALIDATION_FAILED", "newPassword"),
        ({"currentPassword": OLD, "newPassword": "x" * 129}, "FIELD_VALIDATION_FAILED", "newPassword"),
        ({"currentPassword": "x" * 129, "newPassword": NEW}, "FIELD_VALIDATION_FAILED", "currentPassword"),
        ({"currentPassword": OLD}, "FIELD_VALIDATION_FAILED", "newPassword"),
        ({"currentPassword": OLD, "newPassword": NEW, "userId": "forbidden-target"}, "FIELD_VALIDATION_FAILED", "userId"),
        ({"currentPassword": OLD, "newPassword": NEW, "password": "forbidden-secret"}, "FIELD_VALIDATION_FAILED", "password"),
    ]
    for body, code, field in invalid:
        response = client.post(URL, headers=headers, json=body)
        assert response.status_code == 422, response.text
        problem = response.json()
        assert problem["code"] == code
        assert any(error["fieldCode"] == field for error in problem["errors"])
        for secret in (OLD, NEW, "wrong-current", "forbidden-target", "forbidden-secret", "x" * 129):
            assert secret not in response.text
    assert _user_state(temp_pg_dsn) == before


def test_change_password_updates_only_self_and_revokes_other_sessions(
    client: TestClient, temp_pg_dsn: str
) -> None:
    primary = _login(client, "doctor_demo", OLD)
    secondary = _login(client, "doctor_demo", OLD)
    admin = _login(client, "admin_demo", "Admin@2026!")
    before_hash, before_version = _user_state(temp_pg_dsn)
    result = client.post(
        URL,
        headers=_auth_headers(primary["accessToken"]),
        json={"currentPassword": OLD, "newPassword": NEW},
    )
    assert result.status_code == 200, result.text
    user = result.json()
    assert user["id"] == primary["user"]["id"]
    assert user["rowVersion"] == before_version + 1
    assert "password" not in result.text.lower()
    assert "token" not in result.text.lower()
    after_hash, after_version = _user_state(temp_pg_dsn)
    assert after_hash != before_hash and after_version == before_version + 1

    assert client.get("/api/v1/auth/me", headers=_auth_headers(primary["accessToken"])).status_code == 200
    current_refresh = client.post(
        "/api/v1/auth/refresh", json={"refreshToken": primary["refreshToken"]}
    )
    assert current_refresh.status_code == 200
    assert client.get("/api/v1/auth/me", headers=_auth_headers(secondary["accessToken"])).status_code == 401
    assert client.post("/api/v1/auth/refresh", json={"refreshToken": secondary["refreshToken"]}).status_code == 401
    assert client.get("/api/v1/auth/me", headers=_auth_headers(admin["accessToken"])).status_code == 200
    assert client.post("/api/v1/auth/login", json={"username": "doctor_demo", "password": OLD}).status_code == 401
    assert _login(client, "doctor_demo", NEW)["user"]["rowVersion"] == before_version + 1

    with psycopg.connect(temp_pg_dsn) as conn:
        rows = conn.execute(
            """
            SELECT detail::text FROM audit_log
            WHERE actor_user_id = %s AND action = 'user_update'
            """,
            (user["id"],),
        ).fetchall()
    assert len(rows) == 1 and "password_changed" in rows[0][0]
    assert OLD not in rows[0][0] and NEW not in rows[0][0] and after_hash not in rows[0][0]

    app2 = create_app(database_url=temp_pg_dsn, auth_secret=AUTH_SECRET, mount_web=False)
    with TestClient(app2) as restarted:
        assert restarted.get("/api/v1/auth/me", headers=_auth_headers(primary["accessToken"])).status_code == 200
        assert restarted.post("/api/v1/auth/login", json={"username": "doctor_demo", "password": OLD}).status_code == 401
        assert _login(restarted, "doctor_demo", NEW)["user"]["id"] == user["id"]


def test_concurrent_changes_with_same_old_password_have_one_winner(
    client: TestClient,
) -> None:
    first = _login(client, "doctor_demo", OLD)
    second = _login(client, "doctor_demo", OLD)

    def change(token: str, password: str) -> int:
        return client.post(
            URL,
            headers=_auth_headers(token),
            json={"currentPassword": OLD, "newPassword": password},
        ).status_code

    with ThreadPoolExecutor(max_workers=2) as executor:
        futures = [
            executor.submit(change, first["accessToken"], "FirstWinner@2026!"),
            executor.submit(change, second["accessToken"], "SecondWinner@2026!"),
        ]
        statuses = [future.result(timeout=20) for future in futures]
    assert statuses.count(200) == 1
    assert statuses.count(401) + statuses.count(422) == 1
