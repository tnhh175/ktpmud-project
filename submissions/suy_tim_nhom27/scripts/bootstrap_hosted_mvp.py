"""Initialize a dedicated, empty PostgreSQL database for the hosted MVP."""
from __future__ import annotations

import os
from pathlib import Path
import re
import sys

import psycopg
from psycopg import sql


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from src.mvp.auth import hash_password  # noqa: E402


RUNTIME_ROLE = "hfcare_mvp_runtime"
BOOTSTRAP_FILES = (
    "schema.sql",
    "seed.sql",
    "migrations/005_visit_amendment_reopen.sql",
)


def required_secret(name: str) -> str:
    value = os.environ.get(name, "")
    if not re.fullmatch(r"[0-9a-f]{32,128}", value):
        raise SystemExit(f"{name} must be a generated lowercase hex secret (32–128 characters).")
    return value


def sql_body(path: Path) -> str:
    # Each source file can also be applied on its own with psql. Keep a single
    # outer transaction here so a failed seed leaves the hosted database empty.
    source = path.read_text(encoding="utf-8").strip()
    _, begin, body = source.partition("\nBEGIN;")
    if not begin or not body.endswith("\nCOMMIT;"):
        raise SystemExit(f"Expected transaction bounds in {path.name}.")
    return body.removesuffix("\nCOMMIT;")


def bootstrap(conn: psycopg.Connection, admin: str, doctor: str, runtime: str) -> bool:
    if conn.info.server_version < 160000:
        raise SystemExit("PostgreSQL 16 or newer is required.")
    role = sql.Identifier(RUNTIME_ROLE)
    conn.execute("SELECT pg_advisory_xact_lock(hashtext('hfcare_hosted_mvp_bootstrap'))")
    conn.execute("SET LOCAL search_path TO public")
    if conn.execute("SELECT to_regclass('public.hfcare_bootstrap')").fetchone()[0]:
        return False
    occupied = conn.execute(
        """
        SELECT EXISTS (
            SELECT 1 FROM pg_class WHERE relnamespace = 'public'::regnamespace
        ) OR EXISTS (
            SELECT 1 FROM pg_roles WHERE rolname = %s
        )
        """,
        (RUNTIME_ROLE,),
    ).fetchone()[0]
    if occupied:
        raise SystemExit("Bootstrap requires an empty dedicated database and an unused runtime role.")

    for filename in BOOTSTRAP_FILES:
        conn.execute(sql_body(ROOT / "database" / filename))

    for username, password in (("admin_demo", admin), ("doctor_demo", doctor)):
        result = conn.execute(
            "UPDATE app_user SET password_hash = %s WHERE username = %s",
            (hash_password(password), username),
        )
        if result.rowcount != 1:
            raise SystemExit(f"Missing seeded user {username}.")

    conn.execute(sql.SQL("CREATE ROLE {} LOGIN PASSWORD {}").format(role, sql.Literal(runtime)))
    conn.execute("REVOKE CREATE ON SCHEMA public FROM PUBLIC")
    conn.execute(sql.SQL("GRANT USAGE ON SCHEMA public TO {}").format(role))
    conn.execute(sql.SQL("GRANT SELECT ON ALL TABLES IN SCHEMA public TO {}").format(role))
    conn.execute(sql.SQL("""
        GRANT INSERT, UPDATE ON app_user, user_session, patient, visit, patient_care_assignment TO {}
    """).format(role))
    conn.execute(sql.SQL("""
        GRANT INSERT ON audit_log, visit_revision TO {}
    """).format(role))
    conn.execute(sql.SQL("""
        GRANT INSERT, UPDATE, DELETE ON form_version TO {}
    """).format(role))
    conn.execute(sql.SQL("""
        GRANT INSERT, DELETE ON form_field, form_section, visit_value, visit_value_option,
            visit_orthostatic_bp, visit_medication, visit_allergy, visit_lab_result, visit_diagnosis TO {}
    """).format(role))
    conn.execute(sql.SQL("GRANT UPDATE(atc_code) ON visit_medication, visit_allergy TO {}").format(role))
    conn.execute("CREATE TABLE hfcare_bootstrap (version integer PRIMARY KEY)")
    conn.execute("INSERT INTO hfcare_bootstrap (version) VALUES (1)")
    return True


def main() -> None:
    admin = required_secret("MVP_BOOTSTRAP_ADMIN_PASSWORD")
    doctor = required_secret("MVP_BOOTSTRAP_DOCTOR_PASSWORD")
    runtime = required_secret("MVP_BOOTSTRAP_RUNTIME_PASSWORD")
    if len({admin, doctor, runtime}) != 3:
        raise SystemExit("Use distinct secrets for the admin, doctor and runtime role.")
    with psycopg.connect(os.environ["MVP_BOOTSTRAP_DATABASE_URL"], connect_timeout=10) as conn:
        initialized = bootstrap(conn, admin, doctor, runtime)
    print("HFCARE database initialized." if initialized else "HFCARE database already initialized.")


if __name__ == "__main__":
    main()
