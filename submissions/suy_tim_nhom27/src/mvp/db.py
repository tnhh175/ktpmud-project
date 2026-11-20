"""Database connection pool, concurrency helpers, and type conversion utilities."""
from __future__ import annotations

from datetime import date, datetime, timezone
from decimal import Decimal
import ipaddress
import math
import os
import re
from typing import Any
from uuid import UUID

import psycopg
from psycopg.rows import dict_row
from psycopg_pool import ConnectionPool

from .models import ProblemError


DEFAULT_DATABASE_URL = "postgresql://postgres@127.0.0.1:5439/suytim_c"
_IF_MATCH_RE = re.compile(r'^(?:W/)?"?(\d+)"?$')


def resolve_database_url(database_url: str | None = None) -> str:
    return (
        database_url
        or os.environ.get("MVP_DATABASE_URL")
        or os.environ.get("DATABASE_URL")
        or DEFAULT_DATABASE_URL
    )


def create_pool(database_url: str | None = None) -> ConnectionPool:
    dsn = resolve_database_url(database_url)
    return ConnectionPool(
        conninfo=dsn,
        min_size=1,
        max_size=10,
        open=False,
        timeout=10.0,
        kwargs={"row_factory": dict_row},
    )


def check_pool(pool: ConnectionPool | None) -> bool:
    if pool is None:
        return False
    try:
        with pool.connection(timeout=3.0) as conn:
            row = conn.execute("SELECT 1 AS ok").fetchone()
            return bool(row and row["ok"] == 1)
    except psycopg.Error:
        return False
    except Exception:
        return False


def parse_if_match(
    if_match: str | None,
    body_row_version: int | None = None,
    *,
    current_row_version: int | None = None,
) -> int:
    """Resolve optimistic concurrency rowVersion from If-Match header or body."""
    header_ver: int | None = None
    if if_match is not None and if_match.strip() != "":
        m = _IF_MATCH_RE.match(if_match.strip())
        if not m:
            raise ProblemError(
                422,
                "INVALID_IF_MATCH",
                "Giá trị If-Match không hợp lệ",
                "Header If-Match phải biểu diễn số nguyên dương của rowVersion (vd: \"1\").",
            )
        header_ver = int(m.group(1))
        if header_ver < 1:
            raise ProblemError(
                422,
                "INVALID_IF_MATCH",
                "Giá trị If-Match không hợp lệ",
                "Header If-Match phải lớn hơn hoặc bằng 1.",
            )

    if header_ver is not None and body_row_version is not None and header_ver != body_row_version:
        raise ProblemError(
            409,
            "CONCURRENCY_ROW_VERSION_MISMATCH",
            "Xung đột phiên bản dữ liệu (409)",
            "Giá trị If-Match trên header không khớp với rowVersion trong nội dung yêu cầu.",
            current_row_version=current_row_version,
        )

    resolved = header_ver if header_ver is not None else body_row_version
    if resolved is None:
        raise ProblemError(
            409,
            "CONCURRENCY_ROW_VERSION_MISMATCH",
            "Thiếu khóa kiểm soát đồng thời (If-Match)",
            "Thao tác ghi bắt buộc gửi header If-Match hoặc rowVersion hiện hành.",
            current_row_version=current_row_version,
        )
    return resolved


def num_to_json(val: Decimal | int | float | None, data_type: str | None = None) -> int | float | None:
    if val is None:
        return None
    if data_type == "integer":
        return int(val)
    if isinstance(val, Decimal):
        f = float(val)
        return int(val) if val == val.to_integral_value() and data_type != "number" else f
    return val


def to_iso(dt: datetime | None) -> str | None:
    if dt is None:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    else:
        dt = dt.astimezone(timezone.utc)
    return dt.isoformat().replace("+00:00", "Z")


def to_date_iso(d: date | None) -> str | None:
    if d is None:
        return None
    return d.isoformat()


def normalize_ip(raw_ip: str | None) -> str | None:
    if not raw_ip:
        return None
    candidate = raw_ip.strip()
    if not candidate:
        return None
    if candidate.lower() in {"testclient", "localhost"}:
        return "127.0.0.1"
    try:
        return str(ipaddress.ip_address(candidate))
    except ValueError:
        return None


def compute_pagination(page: int, page_size: int, total_items: int) -> dict[str, int]:
    total_pages = 0 if total_items == 0 else math.ceil(total_items / page_size)
    return {
        "page": page,
        "pageSize": page_size,
        "totalItems": total_items,
        "totalPages": total_pages,
    }


def serialize_uuid(val: UUID | str | None) -> str | None:
    return str(val) if val is not None else None
