"""Authentication, password hashing (scrypt), HS256 JWT, and K8 RBAC dependencies."""
from __future__ import annotations

import base64
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
import hashlib
import hmac
import json
import os
import secrets
import time
from typing import Any, Callable
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, Request, Response
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
import psycopg

from .audit import record_audit_log
from .db import normalize_ip, to_iso
from .models import (
    AppUser,
    AuthTokenResponse,
    LoginRequest,
    LogoutRequest,
    ProblemError,
    RefreshTokenRequest,
)


ACCESS_TOKEN_TTL_SECONDS = 900
REFRESH_TOKEN_TTL_DAYS = 7

_SEED_PLACEHOLDER_PREFIX = "$argon2id$v=19$m=65536,t=3,p=4$"
_SEED_PLACEHOLDER_MARKER = "placeholder_hash_only_not_for_prod_"
_SCRYPT_N = 16384
_SCRYPT_R = 8
_SCRYPT_P = 1
_SCRYPT_DKLEN = 32

_bearer_scheme = HTTPBearer(auto_error=False)


def _b64url_encode(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).rstrip(b"=").decode("ascii")


def _b64url_decode(encoded: str) -> bytes:
    padding = "=" * (-len(encoded) % 4)
    return base64.urlsafe_b64decode(encoded + padding)


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    dk = hashlib.scrypt(
        password.encode("utf-8"),
        salt=salt,
        n=_SCRYPT_N,
        r=_SCRYPT_R,
        p=_SCRYPT_P,
        dklen=_SCRYPT_DKLEN,
    )
    return (
        f"scrypt${_SCRYPT_N}${_SCRYPT_R}${_SCRYPT_P}$"
        f"{_b64url_encode(salt)}${_b64url_encode(dk)}"
    )


def verify_password(password: str, stored_hash: str) -> bool:
    if not stored_hash or not stored_hash.startswith("scrypt$"):
        return False
    parts = stored_hash.split("$")
    if len(parts) != 6:
        return False
    try:
        n = int(parts[1])
        r = int(parts[2])
        p = int(parts[3])
        salt = _b64url_decode(parts[4])
        expected_dk = _b64url_decode(parts[5])
    except Exception:
        return False
    actual_dk = hashlib.scrypt(
        password.encode("utf-8"),
        salt=salt,
        n=n,
        r=r,
        p=p,
        dklen=len(expected_dk),
    )
    return hmac.compare_digest(actual_dk, expected_dk)


def hash_refresh_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def create_access_token(
    *,
    user_id: UUID | str,
    role: str,
    session_id: UUID | str,
    secret: bytes,
    ttl_seconds: int = ACCESS_TOKEN_TTL_SECONDS,
) -> str:
    now_ts = int(time.time())
    header = {"alg": "HS256", "typ": "JWT"}
    payload = {
        "sub": str(user_id),
        "role": role,
        "sid": str(session_id),
        "iat": now_ts,
        "exp": now_ts + ttl_seconds,
        "jti": uuid4().hex,
    }
    h_b64 = _b64url_encode(json.dumps(header, separators=(",", ":"), sort_keys=True).encode("utf-8"))
    p_b64 = _b64url_encode(json.dumps(payload, separators=(",", ":"), sort_keys=True).encode("utf-8"))
    signing_input = f"{h_b64}.{p_b64}".encode("ascii")
    sig = hmac.new(secret, signing_input, hashlib.sha256).digest()
    return f"{h_b64}.{p_b64}.{_b64url_encode(sig)}"


def decode_access_token(token: str, secret: bytes) -> dict[str, Any]:
    parts = token.split(".")
    if len(parts) != 3:
        raise ProblemError(
            401,
            "AUTH_INVALID_TOKEN",
            "Token xác thực không hợp lệ",
            "Định dạng Bearer token không hợp lệ.",
        )
    h_b64, p_b64, sig_b64 = parts
    signing_input = f"{h_b64}.{p_b64}".encode("ascii")
    expected_sig = hmac.new(secret, signing_input, hashlib.sha256).digest()
    try:
        actual_sig = _b64url_decode(sig_b64)
        header = json.loads(_b64url_decode(h_b64).decode("utf-8"))
        payload = json.loads(_b64url_decode(p_b64).decode("utf-8"))
    except Exception as exc:
        raise ProblemError(
            401,
            "AUTH_INVALID_TOKEN",
            "Token xác thực không hợp lệ",
            "Không thể giải mã Bearer token.",
        ) from exc

    if header.get("alg") != "HS256" or not hmac.compare_digest(actual_sig, expected_sig):
        raise ProblemError(
            401,
            "AUTH_INVALID_TOKEN",
            "Token xác thực không hợp lệ",
            "Chữ ký Bearer token không hợp lệ.",
        )
    exp = payload.get("exp")
    if not isinstance(exp, int) or int(time.time()) >= exp:
        raise ProblemError(
            401,
            "AUTH_TOKEN_EXPIRED",
            "Phiên đăng nhập đã hết hạn",
            "Access token đã hết hạn; vui lòng làm mới phiên hoặc đăng nhập lại.",
        )
    return payload


def seed_password_for_username(username: str) -> str | None:
    if username == "doctor_demo":
        return os.environ.get("MVP_SEED_DOCTOR_PASSWORD", "Doctor@2026!")
    if username == "admin_demo":
        return os.environ.get("MVP_SEED_ADMIN_PASSWORD", "Admin@2026!")
    return None


def bootstrap_seed_passwords(conn: psycopg.Connection[Any]) -> None:
    """Upgrade placeholder seed hashes once to real scrypt hashes."""
    rows = conn.execute(
        """
        SELECT id, username, password_hash
        FROM app_user
        WHERE username IN ('doctor_demo', 'admin_demo')
          AND password_hash LIKE %s
        """,
        (f"%{_SEED_PLACEHOLDER_MARKER}%",),
    ).fetchall()
    for row in rows:
        raw_pw = seed_password_for_username(row["username"])
        if raw_pw:
            conn.execute(
                "UPDATE app_user SET password_hash = %s WHERE id = %s",
                (hash_password(raw_pw), row["id"]),
            )
    if rows:
        conn.commit()


def user_row_to_schema_dict(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": str(row["id"]),
        "username": row["username"],
        "fullName": row["full_name"],
        "role": row["role"],
        "isActive": bool(row["is_active"]),
        "lastLoginAt": to_iso(row.get("last_login_at")),
        "rowVersion": int(row["row_version"]),
        "createdAt": to_iso(row["created_at"]),
        "updatedAt": to_iso(row["updated_at"]),
    }


@dataclass(frozen=True)
class Principal:
    user_id: UUID
    username: str
    full_name: str
    role: str
    session_id: UUID
    is_active: bool
    row_version: int
    created_at: datetime
    updated_at: datetime
    last_login_at: datetime | None


def get_request_id(request: Request) -> str:
    return request.headers.get("X-Request-Id") or f"req-{uuid4().hex[:12]}"


def get_client_ip(request: Request) -> str | None:
    fwd = request.headers.get("X-Forwarded-For")
    if fwd:
        first = fwd.split(",")[0].strip()
        ip = normalize_ip(first)
        if ip:
            return ip
    return normalize_ip(request.client.host if request.client else None)


def get_current_principal(
    request: Request,
    creds: HTTPAuthorizationCredentials | None = Depends(_bearer_scheme),
) -> Principal:
    if creds is None or creds.scheme.lower() != "bearer" or not creds.credentials:
        raise ProblemError(
            401,
            "AUTH_UNAUTHORIZED",
            "Chưa xác thực",
            "Yêu cầu đăng nhập và gửi header Authorization: Bearer <accessToken>.",
        )

    secret: bytes = request.app.state.auth_secret
    claims = decode_access_token(creds.credentials, secret)
    try:
        user_id = UUID(str(claims["sub"]))
        session_id = UUID(str(claims["sid"]))
        claim_role = str(claims["role"])
    except Exception as exc:
        raise ProblemError(
            401,
            "AUTH_INVALID_TOKEN",
            "Token xác thực không hợp lệ",
            "Thông tin phiên trong token không hợp lệ.",
        ) from exc

    pool = request.app.state.pool
    with pool.connection() as conn:
        row = conn.execute(
            """
            SELECT
                s.id AS session_id,
                s.expires_at,
                s.revoked_at,
                u.id,
                u.username,
                u.full_name,
                u.role,
                u.is_active,
                u.row_version,
                u.created_at,
                u.updated_at,
                (
                    SELECT max(s2.created_at)
                    FROM user_session s2
                    WHERE s2.user_id = u.id
                ) AS last_login_at
            FROM user_session s
            JOIN app_user u ON u.id = s.user_id
            WHERE s.id = %s AND u.id = %s
            """,
            (str(session_id), str(user_id)),
        ).fetchone()

    if not row or row["revoked_at"] is not None:
        raise ProblemError(
            401,
            "AUTH_SESSION_REVOKED",
            "Phiên đăng nhập đã bị thu hồi",
            "Phiên đăng nhập không còn hiệu lực. Vui lòng đăng nhập lại.",
        )
    if row["expires_at"] <= datetime.now(timezone.utc):
        raise ProblemError(
            401,
            "AUTH_TOKEN_EXPIRED",
            "Phiên đăng nhập đã hết hạn",
            "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
        )
    if not row["is_active"]:
        raise ProblemError(
            403,
            "ACCOUNT_DEACTIVATED",
            "Tài khoản đã bị tạm khóa",
            "Tài khoản đã bị khóa — vui lòng liên hệ Quản trị viên.",
        )
    if row["role"] != claim_role:
        raise ProblemError(
            401,
            "AUTH_SESSION_REVOKED",
            "Vai trò tài khoản đã thay đổi",
            "Quyền của tài khoản vừa được cập nhật; vui lòng đăng nhập lại.",
        )

    return Principal(
        user_id=row["id"],
        username=row["username"],
        full_name=row["full_name"],
        role=row["role"],
        session_id=row["session_id"],
        is_active=bool(row["is_active"]),
        row_version=int(row["row_version"]),
        created_at=row["created_at"],
        updated_at=row["updated_at"],
        last_login_at=row["last_login_at"],
    )


def require_role(allowed_role: str, entity_type_for_audit: str) -> Callable[..., Principal]:
    """Dependency enforcing strict K8 separation between doctor and admin roles."""

    def _dependency(
        request: Request,
        principal: Principal = Depends(get_current_principal),
    ) -> Principal:
        if principal.role != allowed_role:
            is_admin_clinical = principal.role == "admin" and allowed_role == "doctor"
            err_code = (
                "CLINICAL_DATA_SEPARATION_ENFORCED"
                if is_admin_clinical
                else "RBAC_ROLE_FORBIDDEN"
            )
            detail_msg = (
                "Vai trò Quản trị viên (admin) bị tách biệt hoàn toàn khỏi quyền đọc và chỉnh sửa hồ sơ/dữ liệu lâm sàng (chốt K8)."
                if is_admin_clinical
                else "Tài khoản hiện tại không có quyền truy cập chức năng quản trị này."
            )
            pool = request.app.state.pool
            with pool.connection() as conn:
                record_audit_log(
                    conn,
                    actor_user_id=principal.user_id,
                    action="login",
                    entity_type=entity_type_for_audit,
                    entity_id=None,
                    ip=get_client_ip(request),
                    request_id=get_request_id(request),
                    outcome="denied",
                    detail={
                        "event": "rbac_denied",
                        "code": err_code,
                        "requiredRole": allowed_role,
                        "actorRole": principal.role,
                        "method": request.method,
                        "path": request.url.path,
                    },
                )
                conn.commit()
            raise ProblemError(
                403,
                err_code,
                "Không đủ quyền truy cập",
                detail_msg,
            )
        return principal

    return _dependency


router = APIRouter(prefix="/api/v1/auth", tags=["Auth"])


@router.post("/login", operation_id="login", response_model=AuthTokenResponse)
def login(body: LoginRequest, request: Request) -> dict[str, Any]:
    username = body.username.strip()
    password = body.password
    if not username or not password:
        raise ProblemError(
            422,
            "FIELD_VALIDATION_FAILED",
            "Thiếu thông tin đăng nhập",
            "Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.",
            errors=[
                {
                    "fieldCode": "username" if not username else "password",
                    "message": "Tên đăng nhập và mật khẩu là bắt buộc.",
                }
            ],
        )

    pool = request.app.state.pool
    req_id = get_request_id(request)
    ip_addr = get_client_ip(request)
    user_agent = (request.headers.get("User-Agent") or "")[:255] or None

    with pool.connection() as conn:
        user = conn.execute(
            """
            SELECT id, username, password_hash, full_name, role, is_active,
                   row_version, created_at, updated_at
            FROM app_user
            WHERE lower(username) = lower(%s)
            """,
            (username,),
        ).fetchone()

        password_ok = False
        if user is not None:
            stored = user["password_hash"]
            if _SEED_PLACEHOLDER_MARKER in stored:
                expected_seed_pw = seed_password_for_username(user["username"])
                if expected_seed_pw is not None and hmac.compare_digest(password, expected_seed_pw):
                    new_hash = hash_password(password)
                    user = conn.execute(
                        """
                        UPDATE app_user
                        SET password_hash = %s
                        WHERE id = %s
                        RETURNING id, username, password_hash, full_name, role, is_active,
                                  row_version, created_at, updated_at
                        """,
                        (new_hash, user["id"]),
                    ).fetchone()
                    password_ok = True
            else:
                password_ok = verify_password(password, stored)

        if user is None or not password_ok:
            record_audit_log(
                conn,
                actor_user_id=user["id"] if user else None,
                action="login_failed",
                entity_type="user_session",
                entity_id=user["id"] if user else None,
                ip=ip_addr,
                request_id=req_id,
                outcome="failure",
                detail={"attemptedUsername": username},
            )
            conn.commit()
            raise ProblemError(
                401,
                "AUTH_INVALID_CREDENTIALS",
                "Đăng nhập thất bại",
                "Tên đăng nhập hoặc mật khẩu không đúng.",
            )

        if not user["is_active"]:
            record_audit_log(
                conn,
                actor_user_id=user["id"],
                action="login_failed",
                entity_type="user_session",
                entity_id=user["id"],
                ip=ip_addr,
                request_id=req_id,
                outcome="denied",
                detail={"reason": "ACCOUNT_DEACTIVATED"},
            )
            conn.commit()
            raise ProblemError(
                403,
                "ACCOUNT_DEACTIVATED",
                "Tài khoản đã bị tạm khóa",
                "Tài khoản đã bị khóa — vui lòng liên hệ Quản trị viên.",
            )

        refresh_raw = secrets.token_urlsafe(48)
        refresh_hash = hash_refresh_token(refresh_raw)
        expires_at = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_TTL_DAYS)

        sess_row = conn.execute(
            """
            INSERT INTO user_session (
                user_id, refresh_token_hash, expires_at, ip, user_agent
            )
            VALUES (%s, %s, %s, %s::inet, %s)
            RETURNING id, created_at
            """,
            (str(user["id"]), refresh_hash, expires_at, ip_addr, user_agent),
        ).fetchone()

        record_audit_log(
            conn,
            actor_user_id=user["id"],
            action="login",
            entity_type="user_session",
            entity_id=sess_row["id"],
            ip=ip_addr,
            request_id=req_id,
            outcome="success",
            detail={"role": user["role"]},
        )
        conn.commit()

    user_dict = dict(user)
    user_dict["last_login_at"] = sess_row["created_at"]
    access_token = create_access_token(
        user_id=user["id"],
        role=user["role"],
        session_id=sess_row["id"],
        secret=request.app.state.auth_secret,
    )
    return {
        "accessToken": access_token,
        "refreshToken": refresh_raw,
        "tokenType": "Bearer",
        "expiresIn": ACCESS_TOKEN_TTL_SECONDS,
        "user": user_row_to_schema_dict(user_dict),
    }


@router.post("/refresh", operation_id="refreshToken", response_model=AuthTokenResponse)
def refresh_token(body: RefreshTokenRequest, request: Request) -> dict[str, Any]:
    token_hash = hash_refresh_token(body.refreshToken)
    pool = request.app.state.pool
    now_utc = datetime.now(timezone.utc)

    with pool.connection() as conn:
        row = conn.execute(
            """
            SELECT
                s.id AS session_id,
                s.expires_at,
                s.revoked_at,
                s.created_at AS session_created_at,
                u.id,
                u.username,
                u.full_name,
                u.role,
                u.is_active,
                u.row_version,
                u.created_at,
                u.updated_at
            FROM user_session s
            JOIN app_user u ON u.id = s.user_id
            WHERE s.refresh_token_hash = %s
            FOR UPDATE OF s
            """,
            (token_hash,),
        ).fetchone()

        if not row:
            raise ProblemError(
                401,
                "AUTH_INVALID_CREDENTIALS",
                "Refresh token không hợp lệ",
                "Không tìm thấy phiên đăng nhập tương ứng.",
            )
        if row["revoked_at"] is not None:
            raise ProblemError(
                401,
                "AUTH_SESSION_REVOKED",
                "Phiên đăng nhập đã bị thu hồi",
                "Phiên đăng nhập đã bị thu hồi; vui lòng đăng nhập lại.",
            )
        if row["expires_at"] <= now_utc:
            raise ProblemError(
                401,
                "AUTH_TOKEN_EXPIRED",
                "Phiên đăng nhập đã hết hạn",
                "Refresh token đã hết hạn; vui lòng đăng nhập lại.",
            )
        if not row["is_active"]:
            raise ProblemError(
                403,
                "ACCOUNT_DEACTIVATED",
                "Tài khoản đã bị tạm khóa",
                "Tài khoản đã bị khóa — vui lòng liên hệ Quản trị viên.",
            )

        new_refresh = secrets.token_urlsafe(48)
        new_hash = hash_refresh_token(new_refresh)
        new_expires = max(
            now_utc + timedelta(days=REFRESH_TOKEN_TTL_DAYS),
            row["session_created_at"] + timedelta(seconds=1),
        )
        conn.execute(
            """
            UPDATE user_session
            SET refresh_token_hash = %s, expires_at = %s
            WHERE id = %s
            """,
            (new_hash, new_expires, str(row["session_id"])),
        )
        last_login_row = conn.execute(
            "SELECT max(created_at) AS last_login_at FROM user_session WHERE user_id = %s",
            (str(row["id"]),),
        ).fetchone()
        conn.commit()

    user_dict = dict(row)
    user_dict["last_login_at"] = (
        last_login_row["last_login_at"] if last_login_row else row["session_created_at"]
    )
    access_token = create_access_token(
        user_id=row["id"],
        role=row["role"],
        session_id=row["session_id"],
        secret=request.app.state.auth_secret,
    )
    return {
        "accessToken": access_token,
        "refreshToken": new_refresh,
        "tokenType": "Bearer",
        "expiresIn": ACCESS_TOKEN_TTL_SECONDS,
        "user": user_row_to_schema_dict(user_dict),
    }


@router.post("/logout", operation_id="logout", status_code=204)
def logout(
    request: Request,
    body: LogoutRequest | None = None,
    principal: Principal = Depends(get_current_principal),
) -> Response:
    pool = request.app.state.pool
    req_id = get_request_id(request)
    ip_addr = get_client_ip(request)
    with pool.connection() as conn:
        conn.execute(
            """
            UPDATE user_session
            SET revoked_at = GREATEST(now(), created_at)
            WHERE id = %s AND revoked_at IS NULL
            """,
            (str(principal.session_id),),
        )
        if body and body.refreshToken:
            conn.execute(
                """
                UPDATE user_session
                SET revoked_at = GREATEST(now(), created_at)
                WHERE user_id = %s AND refresh_token_hash = %s AND revoked_at IS NULL
                """,
                (str(principal.user_id), hash_refresh_token(body.refreshToken)),
            )
        record_audit_log(
            conn,
            actor_user_id=principal.user_id,
            action="logout",
            entity_type="user_session",
            entity_id=principal.session_id,
            ip=ip_addr,
            request_id=req_id,
            outcome="success",
            detail={"username": principal.username},
        )
        conn.commit()
    return Response(status_code=204)


@router.get("/me", operation_id="getCurrentUser", response_model=AppUser)
def get_current_user(principal: Principal = Depends(get_current_principal)) -> dict[str, Any]:
    return {
        "id": str(principal.user_id),
        "username": principal.username,
        "fullName": principal.full_name,
        "role": principal.role,
        "isActive": principal.is_active,
        "lastLoginAt": to_iso(principal.last_login_at),
        "rowVersion": principal.row_version,
        "createdAt": to_iso(principal.created_at),
        "updatedAt": to_iso(principal.updated_at),
    }
