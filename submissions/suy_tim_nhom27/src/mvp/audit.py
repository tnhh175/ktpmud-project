"""Audit logging helpers with strict K8 clinical-data & credential scrubbing."""
from __future__ import annotations

from typing import Any
from uuid import UUID

import psycopg
from psycopg.types.json import Jsonb

from .db import normalize_ip


# Keep in sync with schema.sql fn_audit_log_no_clinical_data + camelCase equivalents
_FORBIDDEN_KEYS_LOWER = {
    "values",
    "visit_values",
    "visitvalues",
    "orthostatic_bp",
    "orthostaticbp",
    "medications",
    "allergies",
    "lab_results",
    "labresults",
    "clinical_note",
    "clinicalnote",
    "snapshot_data",
    "snapshotdata",
    "password",
    "password_hash",
    "passwordhash",
    "onetimesetupcode",
    "one_time_setup_code",
    "refreshtoken",
    "refresh_token",
    "accesstoken",
    "access_token",
}


def sanitize_audit_detail(detail: dict[str, Any] | None) -> dict[str, Any]:
    """Recursively strip any clinical payload or secret keys from audit_log.detail."""
    if not isinstance(detail, dict):
        return {}
    cleaned: dict[str, Any] = {}
    for k, v in detail.items():
        key_str = str(k)
        if key_str.lower() in _FORBIDDEN_KEYS_LOWER:
            continue
        if isinstance(v, dict):
            cleaned[key_str] = sanitize_audit_detail(v)
        elif isinstance(v, list):
            cleaned[key_str] = [
                sanitize_audit_detail(item) if isinstance(item, dict) else item
                for item in v
            ]
        elif isinstance(v, UUID):
            cleaned[key_str] = str(v)
        else:
            cleaned[key_str] = v
    return cleaned


def record_audit_log(
    conn: psycopg.Connection[Any],
    *,
    actor_user_id: UUID | str | None,
    action: str,
    entity_type: str,
    entity_id: UUID | str | None = None,
    ip: str | None = None,
    request_id: str | None = None,
    outcome: str = "success",
    detail: dict[str, Any] | None = None,
) -> UUID:
    clean_detail = sanitize_audit_detail(detail)
    safe_ip = normalize_ip(ip)
    row = conn.execute(
        """
        INSERT INTO audit_log (
            actor_user_id, action, entity_type, entity_id,
            ip, request_id, outcome, detail
        )
        VALUES (%s, %s::audit_action, %s, %s, %s::inet, %s, %s, %s)
        RETURNING id
        """,
        (
            str(actor_user_id) if actor_user_id is not None else None,
            action,
            entity_type,
            str(entity_id) if entity_id is not None else None,
            safe_ip,
            request_id,
            outcome,
            Jsonb(clean_detail),
        ),
    ).fetchone()
    return row["id"]
