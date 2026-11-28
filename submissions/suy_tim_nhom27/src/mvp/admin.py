"""Admin endpoints (D5: M6 Users & Permissions, M7 Form Versions, M8 Audit Logs)."""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Literal
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, Header, Query, Request, Response
from psycopg import Error as DatabaseError
from pydantic import BaseModel, Field

from .audit import record_audit_log, sanitize_audit_detail
from .auth import (
    Principal,
    get_client_ip,
    get_request_id,
    hash_password,
    require_role,
    user_row_to_schema_dict,
)
from .db import compute_pagination, parse_if_match, to_date_iso, to_iso
from .models import (
    AdminPatientItem,
    AdminPatientListResponse,
    AdminPatientRecordRequestListResponse,
    AdminUpdateRecordStatusRequest,
    AppUser,
    ApprovePatientRecordRequest,
    ApprovePatientRecordRequestResponse,
    AuditAction,
    AuditLogListResponse,
    CreateFormVersionDraftRequest,
    CreateUserRequest,
    CreateUserResponse,
    FieldDataType,
    FieldDefinitionListResponse,
    FieldScopeStatus,
    FormTemplateListResponse,
    FormVersion,
    FormVersionDetailResponse,
    FormVersionDiffResponse,
    FormVersionListResponse,
    FormVersionPreviewResponse,
    FormVersionStatus,
    PasswordResetRequestItem,
    PasswordResetRequestListResponse,
    PasswordResetRequestStatus,
    PatientRecordRequestItem,
    PatientRecordRequestStatus,
    PatientRecordRequestType,
    PermissionPreviewRequest,
    PermissionPreviewResponse,
    ProblemError,
    PublishFormVersionRequest,
    RecordStatus,
    RejectPasswordResetRequest,
    RejectPatientRecordRequest,
    ResolvePasswordResetRequest,
    ResolvePasswordResetResponse,
    SectionCode,
    UpdateFormVersionRequest,
    UpdateUserRequest,
    UpdateUserResponse,
    UserListResponse,
    UserRole,
)
from .permissions import CATALOG, PROTECTED, ROLES, is_granted, permission_available
from .temporary_credentials import clear_expired, credential_key, storage_available, store_credential
from .patients import record_request_row_to_dict
from .visits import (
    form_version_row_to_dict,
    load_field_definitions_with_children,
    load_form_version_bundle,
)


router = APIRouter(prefix="/api/v1/admin", tags=["Admin"])

_require_admin_users = require_role("admin", "app_user", "accounts.manage")
_require_admin_forms = require_role("admin", "form_version", "forms.manage")
_require_admin_audit = require_role("admin", "audit_log", "audit.read")
_require_admin_patients = require_role("admin", "patient", "records.manage")


class PermissionChange(BaseModel):
    role: Literal['admin', 'doctor', 'nurse']
    permissionCode: str
    granted: bool
    previous: bool


class UpdateRolePermissionsRequest(BaseModel):
    changes: list[PermissionChange] = Field(min_length=1, max_length=len(CATALOG) * len(ROLES))


_require_permissions = require_role('admin', 'role_permission', 'permissions.manage')
_require_reveal = require_role('admin', 'app_user', 'credentials.reveal')


def permission_matrix(conn):
    if not permission_available(conn):
        raise ProblemError(503, 'PERMISSIONS_UNAVAILABLE', 'Chưa có bảng phân quyền',
                           'Cần nâng cơ sở dữ liệu lên migration 013.')
    rows = conn.execute('SELECT role, permission_code, granted FROM role_permission').fetchall()
    grants = {(row['role'], row['permission_code']): row['granted'] for row in rows}
    return {'roles': list(ROLES), 'permissions': [
        {'code': code, 'labelVi': label,
         'grants': {role: grants.get((role, code), False) for role in ROLES},
         'editable': {role: role in eligible and not (role == 'admin' and code in PROTECTED)
                      for role in ROLES}}
        for code, (label, _, eligible) in CATALOG.items()
    ]}


@router.get('/role-permissions', operation_id='getRolePermissions')
def list_role_permissions(request: Request, principal: Principal = Depends(_require_permissions)):
    with request.app.state.pool.connection() as conn:
        return permission_matrix(conn)


@router.put('/role-permissions', operation_id='updateRolePermissions')
def update_role_permissions(body: UpdateRolePermissionsRequest, request: Request,
                            principal: Principal = Depends(_require_permissions)):
    with request.app.state.pool.connection() as conn:
        permission_matrix(conn)
        changes = sorted(body.changes, key=lambda item: (item.role, item.permissionCode))
        if len({(item.role, item.permissionCode) for item in changes}) != len(changes):
            raise ProblemError(422, 'DUPLICATE_PERMISSION_CHANGE', 'Trùng quyền',
                               'Mỗi quyền của một vai trò chỉ được gửi một lần.')
        for change in changes:
            code = change.permissionCode
            if change.role == 'admin' and code in PROTECTED:
                raise ProblemError(422, 'ADMIN_PERMISSION_PROTECTED', 'Quyền quản trị được bảo vệ',
                                   'Không thể đổi quyền quản lý tài khoản hoặc phân quyền của Admin.')
            if code not in CATALOG or change.role not in CATALOG[code][2]:
                raise ProblemError(422, 'UNSUPPORTED_ROLE_PERMISSION', 'Quyền không hợp lệ',
                                   'Quyền này không áp dụng cho vai trò đã chọn.')
            updated = conn.execute('''UPDATE role_permission SET granted=%s
                WHERE role=%s AND permission_code=%s AND granted=%s RETURNING role''',
                (change.granted, change.role, code, change.previous)).fetchone()
            if updated is None:
                raise ProblemError(409, 'PERMISSION_CHANGED', 'Quyền đã thay đổi',
                                   'Tải lại ma trận phân quyền rồi lưu lại.')
        record_audit_log(conn, actor_user_id=principal.user_id, action='user_update',
                         entity_type='role_permission', entity_id=None, ip=get_client_ip(request),
                         request_id=get_request_id(request), outcome='success',
                         detail={'event': 'role_permissions_update',
                                 'changes': [change.model_dump() for change in changes]})
        return permission_matrix(conn)


@router.get('/users/{userId}/temporary-password', operation_id='revealTemporaryPassword')
def reveal_temporary_password(userId: UUID, request: Request, response: Response,
                              principal: Principal = Depends(_require_reveal)):
    response.headers['Cache-Control'] = 'no-store'
    with request.app.state.pool.connection() as conn:
        if not conn.execute('SELECT id FROM app_user WHERE id=%s FOR SHARE', (userId,)).fetchone():
            raise ProblemError(404, 'RESOURCE_NOT_FOUND', 'Không tìm thấy tài khoản',
                               'Tài khoản không còn tồn tại.')
        row = None
        if storage_available(conn):
            clear_expired(conn)
            encrypted = conn.execute('''SELECT ciphertext, expires_at FROM temporary_credential
                WHERE user_id=%s AND ciphertext IS NOT NULL AND expires_at > now()''', (userId,)).fetchone()
            if encrypted:
                try:
                    key = credential_key()
                    row = conn.execute('SELECT public.pgp_sym_decrypt(%s, %s) AS code',
                                       (encrypted['ciphertext'], key)).fetchone()
                except DatabaseError:
                    raise ProblemError(503, 'CREDENTIAL_DECRYPT_FAILED', 'Không đọc được mật khẩu tạm',
                                       'Kiểm tra khóa bảo vệ mật khẩu tạm trên máy chủ.') from None
        record_audit_log(conn, actor_user_id=principal.user_id, action='user_update', entity_type='app_user',
                         entity_id=userId, ip=get_client_ip(request), request_id=get_request_id(request),
                         outcome='success', detail={'event': 'temporary_password_view', 'available': bool(row)})
        return {'temporaryPassword': row['code'] if row else None,
                'expiresAt': to_iso(encrypted['expires_at']) if row else None}


def _permission_matrix_for_role(conn, role: str) -> dict[str, Any]:
    granted, denied = [], []
    for code, (label, _, eligible) in CATALOG.items():
        entry = {'code': code, 'labelVi': label, 'category': 'audit' if code == 'audit.read' else ('administration' if eligible == ('admin',) else 'clinical')}
        (granted if is_granted(conn, role, code) else denied).append(entry)
    return {'role': role, 'clinicalDataAccessAllowed': role == 'doctor',
            'separationNoticeVi': 'Phạm vi hồ sơ phụ thuộc vai trò và lượt khám được phân công.',
            'grantedPermissions': granted, 'deniedPermissions': denied}


def _generate_one_time_code(prefix: str = "OTP") -> str:
    import secrets

    return f"{prefix}-{secrets.token_hex(2).upper()}-{secrets.token_hex(2).upper()}"


# ---------------------------------------------------------------------------
# M6: Admin Users & Permission Preview
# ---------------------------------------------------------------------------
@router.get(
    "/users",
    operation_id="listUsers",
    response_model=UserListResponse,
    tags=["AdminUsers"],
)
def list_users(
    request: Request,
    q: str | None = Query(default=None, max_length=100),
    role: UserRole | None = Query(default=None),
    isActive: bool | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    pageSize: int = Query(default=20, ge=1, le=100),
    principal: Principal = Depends(_require_admin_users),
) -> dict[str, Any]:
    pool = request.app.state.pool
    where: list[str] = []
    params: list[Any] = []
    if q and q.strip():
        like = f"%{q.strip()}%"
        where.append("(u.username ILIKE %s OR u.full_name ILIKE %s)")
        params.extend([like, like])
    if role is not None:
        where.append("u.role = %s::user_role")
        params.append(role)
    if isActive is not None:
        where.append("u.is_active = %s")
        params.append(isActive)

    where_sql = f"WHERE {' AND '.join(where)}" if where else ""
    with pool.connection() as conn:
        total_row = conn.execute(
            f"SELECT count(*)::int AS cnt FROM app_user u {where_sql}",
            params,
        ).fetchone()
        total_items = int(total_row["cnt"]) if total_row else 0
        offset = (page - 1) * pageSize
        rows = conn.execute(
            f"""
            SELECT
                u.id, u.username, u.full_name, u.role, u.is_active,
                u.row_version, u.created_at, u.updated_at,
                (SELECT max(s.created_at) FROM user_session s WHERE s.user_id = u.id) AS last_login_at
            FROM app_user u
            {where_sql}
            ORDER BY u.created_at DESC, u.username ASC
            LIMIT %s OFFSET %s
            """,
            [*params, pageSize, offset],
        ).fetchall()

    return {
        "items": [user_row_to_schema_dict(r) for r in rows],
        "pagination": compute_pagination(page, pageSize, total_items),
    }


@router.post(
    "/users",
    operation_id="createUser",
    response_model=CreateUserResponse,
    status_code=201,
    tags=["AdminUsers"],
)
def create_user(
    body: CreateUserRequest,
    request: Request,
    response: Response,
    principal: Principal = Depends(_require_admin_users),
) -> dict[str, Any]:
    uname = body.username.strip()
    full_name = body.fullName.strip()
    reason = body.reason.strip()
    errors: list[dict[str, Any]] = []
    if not full_name:
        errors.append(
            {
                "fieldCode": "fullName",
                "sectionCode": "hanh_chinh",
                "message": "Họ tên hiển thị không được để trống.",
                "rejectedValue": body.fullName,
            }
        )
    if len(reason) < 3:
        errors.append(
            {
                "fieldCode": "reason",
                "sectionCode": "hanh_chinh",
                "message": "Lý do tạo tài khoản phải có ít nhất 3 ký tự.",
                "rejectedValue": body.reason,
            }
        )
    if errors:
        raise ProblemError(
            422,
            "FIELD_VALIDATION_FAILED",
            "Thông tin tài khoản không hợp lệ",
            errors[0]["message"],
            errors=errors,
        )

    one_time_code = _generate_one_time_code("OTP")
    pw_hash = hash_password(one_time_code)

    pool = request.app.state.pool
    req_id = get_request_id(request)
    ip_addr = get_client_ip(request)

    with pool.connection() as conn:
        dup = conn.execute(
            "SELECT id FROM app_user WHERE lower(username) = lower(%s)",
            (uname,),
        ).fetchone()
        if dup:
            raise ProblemError(
                409,
                "DUPLICATE_USERNAME",
                "Tên đăng nhập đã tồn tại",
                f"Tên đăng nhập '{uname}' đã được sử dụng trong hệ thống.",
            )

        user_row = conn.execute(
            """
            INSERT INTO app_user (username, password_hash, full_name, role, is_active)
            VALUES (%s, %s, %s, %s::user_role, %s)
            RETURNING id, username, full_name, role, is_active, row_version, created_at, updated_at
            """,
            (uname, pw_hash, full_name, body.role, body.isActive),
        ).fetchone()

        store_credential(conn, user_row["id"], one_time_code)
        record_audit_log(
            conn,
            actor_user_id=principal.user_id,
            action="user_create",
            entity_type="app_user",
            entity_id=user_row["id"],
            ip=ip_addr,
            request_id=req_id,
            outcome="success",
            detail={
                "username": uname,
                "role": body.role,
                "isActive": body.isActive,
                "reason": reason,
            },
        )
        conn.commit()

    response.headers["ETag"] = f'"{int(user_row["row_version"])}"'
    return {
        "user": user_row_to_schema_dict(user_row),
    }


@router.get(
    "/users/{userId}",
    operation_id="getUser",
    response_model=AppUser,
    tags=["AdminUsers"],
)
def get_user(
    userId: UUID,
    request: Request,
    response: Response,
    principal: Principal = Depends(_require_admin_users),
) -> dict[str, Any]:
    pool = request.app.state.pool
    with pool.connection() as conn:
        row = conn.execute(
            """
            SELECT
                u.id, u.username, u.full_name, u.role, u.is_active,
                u.row_version, u.created_at, u.updated_at,
                (SELECT max(s.created_at) FROM user_session s WHERE s.user_id = u.id) AS last_login_at
            FROM app_user u
            WHERE u.id = %s
            """,
            (str(userId),),
        ).fetchone()
    if not row:
        raise ProblemError(
            404,
            "RESOURCE_NOT_FOUND",
            "Không tìm thấy tài khoản",
            "Tài khoản người dùng không tồn tại.",
        )
    response.headers["ETag"] = f'"{int(row["row_version"])}"'
    return user_row_to_schema_dict(row)


@router.patch(
    "/users/{userId}",
    operation_id="updateUser",
    response_model=UpdateUserResponse,
    tags=["AdminUsers"],
)
def update_user(
    userId: UUID,
    body: UpdateUserRequest,
    request: Request,
    response: Response,
    if_match: str | None = Header(default=None, alias="If-Match"),
    principal: Principal = Depends(_require_admin_users),
) -> dict[str, Any]:
    reason = body.reason.strip()
    if len(reason) < 3:
        raise ProblemError(
            422,
            "FIELD_VALIDATION_FAILED",
            "Thiếu lý do cập nhật tài khoản",
            "Lý do thao tác phải dài tối thiểu 3 ký tự.",
            errors=[
                {
                    "fieldCode": "reason",
                    "sectionCode": "hanh_chinh",
                    "message": "Lý do thao tác phải có ít nhất 3 ký tự.",
                    "rejectedValue": body.reason,
                }
            ],
        )

    pool = request.app.state.pool
    req_id = get_request_id(request)
    ip_addr = get_client_ip(request)

    with pool.connection() as conn:
        u_row = conn.execute(
            """
            SELECT id, username, full_name, role, is_active, row_version, created_at, updated_at
            FROM app_user
            WHERE id = %s
            FOR UPDATE
            """,
            (str(userId),),
        ).fetchone()
        if not u_row:
            raise ProblemError(
                404,
                "RESOURCE_NOT_FOUND",
                "Không tìm thấy tài khoản",
                "Tài khoản người dùng không tồn tại.",
            )

        current_rv = int(u_row["row_version"])
        expected_rv = parse_if_match(
            if_match, body.rowVersion, current_row_version=current_rv
        )
        if expected_rv != current_rv:
            raise ProblemError(
                409,
                "CONCURRENCY_ROW_VERSION_MISMATCH",
                "Xung đột phiên bản tài khoản (409)",
                f"Tài khoản đã được cập nhật lên rowVersion {current_rv} ở phiên khác.",
                current_row_version=current_rv,
            )

        next_full_name = (
            body.fullName.strip() if body.fullName is not None else u_row["full_name"]
        )
        if not next_full_name:
            raise ProblemError(
                422,
                "FIELD_VALIDATION_FAILED",
                "Họ tên không hợp lệ",
                "Họ tên hiển thị không được để trống.",
                errors=[
                    {
                        "fieldCode": "fullName",
                        "sectionCode": "hanh_chinh",
                        "message": "fullName không được rỗng.",
                        "rejectedValue": body.fullName,
                    }
                ],
            )
        next_role = body.role if body.role is not None else u_row["role"]
        next_active = body.isActive if body.isActive is not None else bool(u_row["is_active"])

        if u_row["role"] == "admin" and u_row["is_active"] and (not next_active or next_role != "admin"):
            cnt_row = conn.execute(
                "SELECT count(*)::int AS cnt FROM app_user WHERE role = 'admin' AND is_active = true"
            ).fetchone()
            if int(cnt_row["cnt"]) <= 1:
                raise ProblemError(
                    409,
                    "LAST_ACTIVE_ADMIN",
                    "Không thể khóa Quản trị viên cuối cùng",
                    "Hệ thống phải duy trì ít nhất một tài khoản admin đang hoạt động.",
                    current_row_version=current_rv,
                )

        diff: dict[str, Any] = {}
        if next_full_name != u_row["full_name"]:
            diff["fullName"] = {"from": u_row["full_name"], "to": next_full_name}
        if next_role != u_row["role"]:
            diff["role"] = {"from": u_row["role"], "to": next_role}
        if next_active != bool(u_row["is_active"]):
            diff["isActive"] = {"from": bool(u_row["is_active"]), "to": next_active}

        one_time_code: str | None = None
        if body.resetPassword:
            one_time_code = _generate_one_time_code("RST")
            new_pw_hash = hash_password(one_time_code)
            diff["resetPassword"] = True
            updated = conn.execute(
                """
                UPDATE app_user
                SET full_name = %s,
                    role = %s::user_role,
                    is_active = %s,
                    password_hash = %s,
                    row_version = row_version + 1
                WHERE id = %s AND row_version = %s
                RETURNING id, username, full_name, role, is_active, row_version, created_at, updated_at
                """,
                (next_full_name, next_role, next_active, new_pw_hash, str(userId), current_rv),
            ).fetchone()
        else:
            updated = conn.execute(
                """
                UPDATE app_user
                SET full_name = %s,
                    role = %s::user_role,
                    is_active = %s,
                    row_version = row_version + 1
                WHERE id = %s AND row_version = %s
                RETURNING id, username, full_name, role, is_active, row_version, created_at, updated_at
                """,
                (next_full_name, next_role, next_active, str(userId), current_rv),
            ).fetchone()

        if body.resetPassword:
            store_credential(conn, userId, one_time_code)

        if not next_active or body.resetPassword or next_role != u_row["role"]:
            conn.execute(
                """
                UPDATE user_session
                SET revoked_at = GREATEST(now(), created_at)
                WHERE user_id = %s AND revoked_at IS NULL
                """,
                (str(userId),),
            )

        last_login_row = conn.execute(
            "SELECT max(created_at) AS last_login_at FROM user_session WHERE user_id = %s",
            (str(userId),),
        ).fetchone()

        record_audit_log(
            conn,
            actor_user_id=principal.user_id,
            action="user_update",
            entity_type="app_user",
            entity_id=userId,
            ip=ip_addr,
            request_id=req_id,
            outcome="success",
            detail={
                "targetUsername": u_row["username"],
                "diff": diff,
                "reason": reason,
            },
        )
        conn.commit()

    out_row = dict(updated)
    out_row["last_login_at"] = last_login_row["last_login_at"] if last_login_row else None
    response.headers["ETag"] = f'"{int(updated["row_version"])}"'
    return {
        "user": user_row_to_schema_dict(out_row),
    }


@router.post(
    "/users/permission-preview",
    operation_id="previewUserPermissions",
    response_model=PermissionPreviewResponse,
    tags=["AdminUsers"],
)
def preview_user_permissions(
    body: PermissionPreviewRequest,
    request: Request,
    principal: Principal = Depends(_require_admin_users),
) -> dict[str, Any]:
    with request.app.state.pool.connection() as conn:
        return _permission_matrix_for_role(conn, body.role)


# ---------------------------------------------------------------------------
# M7: Admin Field Definitions & Form Versions
# ---------------------------------------------------------------------------
@router.get(
    "/field-definitions",
    operation_id="listFieldDefinitions",
    response_model=FieldDefinitionListResponse,
    tags=["AdminForms"],
)
def list_field_definitions(
    request: Request,
    sectionCode: SectionCode | None = Query(default=None),
    scopeStatus: FieldScopeStatus | None = Query(default=None),
    dataType: FieldDataType | None = Query(default=None),
    q: str | None = Query(default=None, max_length=100),
    principal: Principal = Depends(_require_admin_forms),
) -> dict[str, Any]:
    pool = request.app.state.pool
    with pool.connection() as conn:
        items = load_field_definitions_with_children(
            conn,
            section_code=sectionCode,
            scope_status=scopeStatus,
            data_type=dataType,
            q=q,
        )
    return {"items": items, "total": len(items)}


@router.get(
    "/forms",
    operation_id="listForms",
    response_model=FormTemplateListResponse,
    tags=["AdminForms"],
)
def list_forms(
    request: Request,
    principal: Principal = Depends(_require_admin_forms),
) -> dict[str, Any]:
    pool = request.app.state.pool
    with pool.connection() as conn:
        rows = conn.execute("SELECT * FROM form_template ORDER BY created_at ASC").fetchall()
    return {
        "items": [
            {
                "id": str(r["id"]),
                "code": r["code"],
                "name": r["name"],
                "description": r.get("description"),
                "isActive": bool(r["is_active"]),
                "createdAt": to_iso(r["created_at"]),
            }
            for r in rows
        ]
    }


@router.get(
    "/forms/{formId}/versions",
    operation_id="listFormVersions",
    response_model=FormVersionListResponse,
    tags=["AdminForms"],
)
def list_form_versions(
    formId: UUID,
    request: Request,
    status: FormVersionStatus | None = Query(default=None),
    principal: Principal = Depends(_require_admin_forms),
) -> dict[str, Any]:
    pool = request.app.state.pool
    with pool.connection() as conn:
        ft = conn.execute(
            "SELECT id FROM form_template WHERE id = %s",
            (str(formId),),
        ).fetchone()
        if not ft:
            raise ProblemError(
                404,
                "RESOURCE_NOT_FOUND",
                "Không tìm thấy biểu mẫu",
                "Biểu mẫu logic không tồn tại.",
            )

        where = ["fv.form_template_id = %s"]
        params: list[Any] = [str(formId)]
        if status is not None:
            where.append("fv.status = %s::form_version_status")
            params.append(status)

        rows = conn.execute(
            f"""
            SELECT fv.*,
                   (SELECT count(*)::int FROM visit v WHERE v.form_version_id = fv.id) AS visit_count
            FROM form_version fv
            WHERE {' AND '.join(where)}
            ORDER BY fv.version_no DESC
            """,
            params,
        ).fetchall()

    return {"items": [form_version_row_to_dict(r) for r in rows]}


@router.post(
    "/forms/{formId}/versions",
    operation_id="createFormVersionDraft",
    response_model=FormVersion,
    status_code=201,
    tags=["AdminForms"],
)
def create_form_version_draft(
    formId: UUID,
    body: CreateFormVersionDraftRequest,
    request: Request,
    response: Response,
    principal: Principal = Depends(_require_admin_forms),
) -> dict[str, Any]:
    pool = request.app.state.pool
    req_id = get_request_id(request)
    ip_addr = get_client_ip(request)

    with pool.connection() as conn:
        ft = conn.execute(
            "SELECT id FROM form_template WHERE id = %s",
            (str(formId),),
        ).fetchone()
        if not ft:
            raise ProblemError(
                404,
                "RESOURCE_NOT_FOUND",
                "Không tìm thấy biểu mẫu",
                "Biểu mẫu logic không tồn tại.",
            )

        existing_draft = conn.execute(
            "SELECT id, row_version FROM form_version WHERE form_template_id = %s AND status = 'draft' LIMIT 1",
            (str(formId),),
        ).fetchone()
        if existing_draft:
            raise ProblemError(
                409,
                "DRAFT_ALREADY_EXISTS",
                "Đã tồn tại bản nháp chưa phát hành",
                "Biểu mẫu này đang có sẵn một bản nháp; hãy chỉnh sửa hoặc phát hành bản nháp hiện có.",
                current_row_version=int(existing_draft["row_version"]),
            )

        base_ver = conn.execute(
            "SELECT * FROM form_version WHERE id = %s",
            (str(body.basedOnVersionId),),
        ).fetchone()
        if not base_ver:
            raise ProblemError(
                404,
                "RESOURCE_NOT_FOUND",
                "Không tìm thấy phiên bản gốc",
                "Phiên bản biểu mẫu gốc (basedOnVersionId) không tồn tại.",
            )
        if str(base_ver["form_template_id"]) != str(formId):
            raise ProblemError(
                422,
                "FIELD_VALIDATION_FAILED",
                "Phiên bản gốc không thuộc biểu mẫu",
                "basedOnVersionId phải thuộc cùng form_template.",
                errors=[
                    {
                        "fieldCode": "basedOnVersionId",
                        "message": "basedOnVersionId không thuộc biểu mẫu đang chọn.",
                        "rejectedValue": str(body.basedOnVersionId),
                    }
                ],
            )

        max_no_row = conn.execute(
            "SELECT COALESCE(MAX(version_no), 0) AS max_no FROM form_version WHERE form_template_id = %s",
            (str(formId),),
        ).fetchone()
        next_no = int(max_no_row["max_no"]) + 1
        version_label = f"v1.{next_no - 1}"
        change_note = body.changeNote or f"Bản nháp tạo từ {base_ver['version_label']}"

        new_ver = conn.execute(
            """
            INSERT INTO form_version (
                form_template_id, version_no, version_label, status,
                based_on_version_id, change_note, created_by
            )
            VALUES (%s, %s, %s, 'draft', %s, %s, %s)
            RETURNING *
            """,
            (
                str(formId),
                next_no,
                version_label,
                str(base_ver["id"]),
                change_note,
                str(principal.user_id),
            ),
        ).fetchone()

        if base_ver.get("definition_overrides"):
            from psycopg.types.json import Jsonb
            conn.execute("UPDATE form_version SET definition_overrides=%s WHERE id=%s",(Jsonb(base_ver["definition_overrides"]),str(new_ver["id"])))

        base_sections = conn.execute(
            "SELECT * FROM form_section WHERE form_version_id = %s ORDER BY display_order ASC",
            (str(base_ver["id"]),),
        ).fetchall()
        sec_id_map: dict[str, str] = {}
        for sec in base_sections:
            new_sec = conn.execute(
                """
                INSERT INTO form_section (
                    form_version_id, section_code, title_vi, description, display_order
                )
                VALUES (%s, %s::section_code, %s, %s, %s)
                RETURNING id
                """,
                (
                    str(new_ver["id"]),
                    sec["section_code"],
                    sec["title_vi"],
                    sec.get("description"),
                    sec["display_order"],
                ),
            ).fetchone()
            sec_id_map[str(sec["id"])] = str(new_sec["id"])

        base_fields = conn.execute(
            "SELECT * FROM form_field WHERE form_version_id = %s ORDER BY form_section_id, display_order ASC",
            (str(base_ver["id"]),),
        ).fetchall()
        for ff in base_fields:
            new_sec_id = sec_id_map.get(str(ff["form_section_id"]))
            if not new_sec_id:
                continue
            conn.execute(
                """
                INSERT INTO form_field (
                    form_version_id, form_section_id, field_definition_id,
                    display_order, required_for_confirm, is_visible, is_readonly,
                    custom_label_vi, custom_help_text
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    str(new_ver["id"]),
                    new_sec_id,
                    str(ff["field_definition_id"]),
                    ff["display_order"],
                    ff["required_for_confirm"],
                    ff["is_visible"],
                    ff["is_readonly"],
                    ff.get("custom_label_vi"),
                    ff.get("custom_help_text"),
                ),
            )

        record_audit_log(
            conn,
            actor_user_id=principal.user_id,
            action="form_version_create",
            entity_type="form_version",
            entity_id=new_ver["id"],
            ip=ip_addr,
            request_id=req_id,
            outcome="success",
            detail={
                "versionNo": next_no,
                "versionLabel": version_label,
                "basedOnVersionId": str(base_ver["id"]),
            },
        )
        conn.commit()

    out = dict(new_ver)
    out["visit_count"] = 0
    response.headers["ETag"] = f'"{int(new_ver["row_version"])}"'
    return form_version_row_to_dict(out)


@router.get(
    "/form-versions/{versionId}",
    operation_id="getFormVersion",
    response_model=FormVersionDetailResponse,
    tags=["AdminForms"],
)
def get_form_version(
    versionId: UUID,
    request: Request,
    response: Response,
    principal: Principal = Depends(_require_admin_forms),
) -> dict[str, Any]:
    pool = request.app.state.pool
    with pool.connection() as conn:
        fv_dict, sections, field_defs = load_form_version_bundle(conn, versionId)
    response.headers["ETag"] = f'"{fv_dict["rowVersion"]}"'
    return {
        "formVersion": fv_dict,
        "sections": sections,
        "fieldDefinitions": field_defs,
    }


def validate_form_configuration(conn, body, current_rv, version_id):
    # Validate sections & fields
    errors: list[dict[str, Any]] = []
    if not body.sections:
        errors.append(
            {
                "fieldCode": "sections",
                "message": "Phiên bản biểu mẫu phải có ít nhất một nhóm.",
                "rejectedValue": [],
            }
        )

    valid_def_rows = conn.execute("SELECT id, code FROM field_definition").fetchall()
    valid_def_ids = {str(r["id"]) for r in valid_def_rows}

    seen_sec_codes: set[str] = set()
    seen_sec_orders: set[int] = set()
    seen_def_ids: set[str] = set()
    # Preview must reject identifiers that PATCH cannot save, including IDs owned
    # by another version. Accept fresh IDs, as PATCH already does for new rows.
    for table, items in (('form_section', body.sections), ('form_field', [f for s in body.sections for f in s.fields])):
        ids = [str(item.id) for item in items if item.id is not None]
        owners = conn.execute(f'SELECT id, form_version_id FROM {table} WHERE id=ANY(%s::uuid[])', (ids,)).fetchall() if ids else []
        if len(ids) != len(set(ids)) or any(str(row['form_version_id']) != str(version_id) for row in owners):
            errors.append({'fieldCode':'sections','message':'ID nhóm/trường bị trùng hoặc thuộc phiên bản biểu mẫu khác.','rejectedValue':None})

    for sec in body.sections:
        if sec.sectionCode in seen_sec_codes:
            errors.append(
                {
                    "fieldCode": sec.sectionCode,
                    "sectionCode": sec.sectionCode,
                    "message": f"Nhóm {sec.sectionCode} bị trùng lặp.",
                    "rejectedValue": sec.sectionCode,
                }
            )
        seen_sec_codes.add(sec.sectionCode)

        if sec.displayOrder in seen_sec_orders:
            errors.append(
                {
                    "fieldCode": sec.sectionCode,
                    "sectionCode": sec.sectionCode,
                    "message": f"Thứ tự nhóm {sec.displayOrder} bị trùng lặp.",
                    "rejectedValue": sec.displayOrder,
                }
            )
        seen_sec_orders.add(sec.displayOrder)

        seen_field_orders: set[int] = set()
        for ff in sec.fields:
            fid = str(ff.fieldDefinitionId)
            if fid not in valid_def_ids:
                errors.append(
                    {
                        "fieldCode": ff.fieldCode or fid,
                        "sectionCode": sec.sectionCode,
                        "message": "fieldDefinitionId không tồn tại trong field_definition.",
                        "rejectedValue": fid,
                    }
                )
            if fid in seen_def_ids:
                errors.append(
                    {
                        "fieldCode": ff.fieldCode or fid,
                        "sectionCode": sec.sectionCode,
                        "message": "Trường dữ liệu bị gắn lặp lại trong cùng phiên bản biểu mẫu.",
                        "rejectedValue": fid,
                    }
                )
            seen_def_ids.add(fid)

            if ff.displayOrder in seen_field_orders:
                errors.append(
                    {
                        "fieldCode": ff.fieldCode or fid,
                        "sectionCode": sec.sectionCode,
                        "message": f"Thứ tự trường {ff.displayOrder} bị trùng trong nhóm {sec.sectionCode}.",
                        "rejectedValue": ff.displayOrder,
                    }
                )
            seen_field_orders.add(ff.displayOrder)

            if ff.customLabelVi is not None and len(ff.customLabelVi) > 200:
                errors.append(
                    {
                        "fieldCode": ff.fieldCode or fid,
                        "sectionCode": sec.sectionCode,
                        "message": "customLabelVi không được vượt quá 200 ký tự.",
                        "rejectedValue": ff.customLabelVi,
                    }
                )

    if errors:
        raise ProblemError(
            422,
            "FIELD_VALIDATION_FAILED",
            "Cấu trúc biểu mẫu không hợp lệ",
            errors[0]["message"],
            current_row_version=current_rv,
            errors=errors,
        )


@router.patch(
    "/form-versions/{versionId}",
    operation_id="updateFormVersion",
    response_model=FormVersionDetailResponse,
    tags=["AdminForms"],
)
def update_form_version(
    versionId: UUID,
    body: UpdateFormVersionRequest,
    request: Request,
    response: Response,
    if_match: str | None = Header(default=None, alias="If-Match"),
    principal: Principal = Depends(_require_admin_forms),
) -> dict[str, Any]:
    pool = request.app.state.pool
    req_id = get_request_id(request)
    ip_addr = get_client_ip(request)

    with pool.connection() as conn:
        fv_row = conn.execute(
            "SELECT * FROM form_version WHERE id = %s FOR UPDATE",
            (str(versionId),),
        ).fetchone()
        if not fv_row:
            raise ProblemError(
                404,
                "RESOURCE_NOT_FOUND",
                "Không tìm thấy phiên bản biểu mẫu",
                "Phiên bản biểu mẫu không tồn tại.",
            )

        current_rv = int(fv_row["row_version"])
        has_visits_row = conn.execute(
            "SELECT EXISTS (SELECT 1 FROM visit WHERE form_version_id = %s) AS used",
            (str(versionId),),
        ).fetchone()
        if fv_row["status"] != "draft" or (has_visits_row and has_visits_row["used"]):
            raise ProblemError(
                409,
                "FORM_VERSION_IMMUTABLE",
                "Phiên bản biểu mẫu đã khóa bất biến (K4)",
                "Phiên bản biểu mẫu đã phát hành, đã lưu trữ hoặc đã có lượt khám sử dụng không thể chỉnh sửa trực tiếp.",
                current_row_version=current_rv,
            )

        expected_rv = parse_if_match(
            if_match, body.rowVersion, current_row_version=current_rv
        )
        if expected_rv != current_rv:
            raise ProblemError(
                409,
                "CONCURRENCY_ROW_VERSION_MISMATCH",
                "Xung đột phiên bản biểu mẫu (409)",
                f"Bản nháp biểu mẫu đã được cập nhật lên rowVersion {current_rv} ở phiên khác.",
                current_row_version=current_rv,
            )

        validate_form_configuration(conn, body, current_rv, versionId)

        conn.execute("DELETE FROM form_field WHERE form_version_id = %s", (str(versionId),))
        conn.execute("DELETE FROM form_section WHERE form_version_id = %s", (str(versionId),))

        for sec in body.sections:
            sec_id = str(sec.id) if sec.id else str(uuid4())
            conn.execute(
                """
                INSERT INTO form_section (
                    id, form_version_id, section_code, title_vi, description, display_order
                )
                VALUES (%s, %s, %s::section_code, %s, %s, %s)
                """,
                (
                    sec_id,
                    str(versionId),
                    sec.sectionCode,
                    sec.titleVi.strip(),
                    sec.description,
                    sec.displayOrder,
                ),
            )
            for ff in sec.fields:
                ff_id = str(ff.id) if ff.id else str(uuid4())
                conn.execute(
                    """
                    INSERT INTO form_field (
                        id, form_version_id, form_section_id, field_definition_id,
                        display_order, required_for_confirm, is_visible, is_readonly,
                        custom_label_vi, custom_help_text
                    )
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """,
                    (
                        ff_id,
                        str(versionId),
                        sec_id,
                        str(ff.fieldDefinitionId),
                        ff.displayOrder,
                        ff.requiredForConfirm,
                        ff.isVisible,
                        ff.isReadonly,
                        ff.customLabelVi,
                        ff.customHelpText,
                    ),
                )

        new_note = body.changeNote if "changeNote" in body.model_fields_set else fv_row.get("change_note")
        updated_fv = conn.execute(
            """
            UPDATE form_version
            SET change_note = %s,
                row_version = row_version + 1
            WHERE id = %s AND row_version = %s
            RETURNING row_version
            """,
            (new_note, str(versionId), current_rv),
        ).fetchone()

        record_audit_log(
            conn,
            actor_user_id=principal.user_id,
            action="form_version_update",
            entity_type="form_version",
            entity_id=versionId,
            ip=ip_addr,
            request_id=req_id,
            outcome="success",
            detail={
                "versionLabel": fv_row["version_label"],
                "rowVersion": int(updated_fv["row_version"]),
            },
        )
        conn.commit()
        fv_dict, sections, field_defs = load_form_version_bundle(conn, versionId)

    response.headers["ETag"] = f'"{fv_dict["rowVersion"]}"'
    return {
        "formVersion": fv_dict,
        "sections": sections,
        "fieldDefinitions": field_defs,
    }


@router.get(
    "/form-versions/{versionId}/preview",
    operation_id="previewFormVersion",
    response_model=FormVersionPreviewResponse,
    tags=["AdminForms"],
)
def preview_form_version(
    versionId: UUID,
    request: Request,
    principal: Principal = Depends(_require_admin_forms),
) -> dict[str, Any]:
    pool = request.app.state.pool
    with pool.connection() as conn:
        fv_dict, sections, field_defs = load_form_version_bundle(conn, versionId)
    return {
        "isPreviewOnly": True,
        "previewBannerVi": (
            f"Chế độ xem trước góc nhìn Bác sĩ cho {fv_dict['versionLabel']} — "
            "mọi thao tác nhập thử không được lưu vào hồ sơ bệnh án."
        ),
        "formVersion": fv_dict,
        "sections": sections,
        "fieldDefinitions": field_defs,
    }


@router.get(
    "/form-versions/{versionId}/diff",
    operation_id="diffFormVersion",
    response_model=FormVersionDiffResponse,
    tags=["AdminForms"],
)
def diff_form_version(
    versionId: UUID,
    request: Request,
    baseVersionId: UUID = Query(...),
    principal: Principal = Depends(_require_admin_forms),
) -> dict[str, Any]:
    pool = request.app.state.pool
    with pool.connection() as conn:
        _, target_secs, target_defs = load_form_version_bundle(conn, versionId)
        _, base_secs, base_defs = load_form_version_bundle(conn, baseVersionId)

    def_map = {d["id"]: d for d in (base_defs + target_defs)}

    def index_fields(secs: list[dict[str, Any]]) -> dict[str, dict[str, Any]]:
        out: dict[str, dict[str, Any]] = {}
        for sec in secs:
            for ff in sec["fields"]:
                fd = def_map.get(ff["fieldDefinitionId"])
                if not fd:
                    continue
                out[fd["code"]] = {
                    "fieldCode": fd["code"],
                    "labelVi": ff.get("customLabelVi") or fd["labelVi"],
                    "helpText": ff.get("customHelpText") or fd.get("helpText") or "",
                    "sectionCode": sec["sectionCode"],
                    "displayOrder": ff["displayOrder"],
                    "requiredForConfirm": bool(ff["requiredForConfirm"]),
                    "isVisible": bool(ff["isVisible"]),
                    "isReadonly": bool(ff["isReadonly"]),
                }
        return out

    base_map = index_fields(base_secs)
    target_map = index_fields(target_secs)

    added: list[dict[str, Any]] = []
    modified: list[dict[str, Any]] = []
    removed: list[dict[str, Any]] = []

    for code, cur in target_map.items():
        prev = base_map.get(code)
        if not prev or (not prev["isVisible"] and cur["isVisible"]):
            if cur["isVisible"]:
                added.append(
                    {
                        "changeType": "added",
                        "fieldCode": cur["fieldCode"],
                        "labelVi": cur["labelVi"],
                        "sectionCode": cur["sectionCode"],
                        "previousAttributeSummary": "Ẩn ở phiên bản gốc" if prev else None,
                        "currentAttributeSummary": (
                            f"Hiển thị ở nhóm {cur['sectionCode']}"
                            + (" · Bắt buộc Tầng 3" if cur["requiredForConfirm"] else "")
                        ),
                    }
                )
            continue

        if prev["isVisible"] and not cur["isVisible"]:
            removed.append(
                {
                    "changeType": "removed",
                    "fieldCode": cur["fieldCode"],
                    "labelVi": prev["labelVi"],
                    "sectionCode": prev["sectionCode"],
                    "previousAttributeSummary": f"Hiển thị ở nhóm {prev['sectionCode']}",
                    "currentAttributeSummary": "Ngừng hiển thị cho lượt khám mới (giữ nguyên dữ liệu lượt cũ)",
                }
            )
            continue

        diffs: list[str] = []
        if prev["labelVi"] != cur["labelVi"]:
            diffs.append(f"Nhãn: \"{prev['labelVi']}\" → \"{cur['labelVi']}\"")
        if prev["helpText"] != cur["helpText"]:
            diffs.append("Cập nhật mô tả trợ giúp")
        if prev["requiredForConfirm"] != cur["requiredForConfirm"]:
            diffs.append(
                f"Bắt buộc Tầng 3: {'Có' if prev['requiredForConfirm'] else 'Không'} → {'Có' if cur['requiredForConfirm'] else 'Không'}"
            )
        if prev["sectionCode"] != cur["sectionCode"]:
            diffs.append(f"Chuyển nhóm: {prev['sectionCode']} → {cur['sectionCode']}")
        if prev["displayOrder"] != cur["displayOrder"]:
            diffs.append(f"Thứ tự: #{prev['displayOrder']} → #{cur['displayOrder']}")
        if prev["isReadonly"] != cur["isReadonly"]:
            diffs.append(
                f"Chỉ đọc: {'Có' if prev['isReadonly'] else 'Không'} → {'Có' if cur['isReadonly'] else 'Không'}"
            )

        if diffs:
            modified.append(
                {
                    "changeType": "modified",
                    "fieldCode": cur["fieldCode"],
                    "labelVi": cur["labelVi"],
                    "sectionCode": cur["sectionCode"],
                    "previousAttributeSummary": f"Nhóm {prev['sectionCode']} · #{prev['displayOrder']}",
                    "currentAttributeSummary": " · ".join(diffs),
                }
            )

    for code, prev in base_map.items():
        if code not in target_map and prev["isVisible"]:
            removed.append(
                {
                    "changeType": "removed",
                    "fieldCode": code,
                    "labelVi": prev["labelVi"],
                    "sectionCode": prev["sectionCode"],
                    "previousAttributeSummary": f"Hiển thị ở nhóm {prev['sectionCode']}",
                    "currentAttributeSummary": "Đã gỡ khỏi bản nháp mới",
                }
            )

    return {
        "targetVersionId": str(versionId),
        "baseVersionId": str(baseVersionId),
        "hasChanges": bool(added or modified or removed),
        "addedFields": added,
        "modifiedFields": modified,
        "removedFields": removed,
    }


@router.post(
    "/form-versions/{versionId}/publish",
    operation_id="publishFormVersion",
    response_model=FormVersion,
    tags=["AdminForms"],
)
def publish_form_version(
    versionId: UUID,
    body: PublishFormVersionRequest,
    request: Request,
    response: Response,
    if_match: str | None = Header(default=None, alias="If-Match"),
    principal: Principal = Depends(_require_admin_forms),
) -> dict[str, Any]:
    pool = request.app.state.pool
    req_id = get_request_id(request)
    ip_addr = get_client_ip(request)

    with pool.connection() as conn:
        fv_row = conn.execute(
            "SELECT * FROM form_version WHERE id = %s FOR UPDATE",
            (str(versionId),),
        ).fetchone()
        if not fv_row:
            raise ProblemError(
                404,
                "RESOURCE_NOT_FOUND",
                "Không tìm thấy phiên bản biểu mẫu",
                "Phiên bản biểu mẫu không tồn tại.",
            )
        current_rv = int(fv_row["row_version"])
        if fv_row["status"] != "draft":
            raise ProblemError(
                409,
                "FORM_VERSION_NOT_DRAFT",
                "Chỉ phát hành được bản nháp",
                "Phiên bản này đã được phát hành hoặc đã lưu trữ.",
                current_row_version=current_rv,
            )

        expected_rv = parse_if_match(
            if_match, body.rowVersion, current_row_version=current_rv
        )
        if expected_rv != current_rv:
            raise ProblemError(
                409,
                "CONCURRENCY_ROW_VERSION_MISMATCH",
                "Xung đột phiên bản biểu mẫu (409)",
                f"Bản nháp biểu mẫu hiện ở rowVersion {current_rv}.",
                current_row_version=current_rv,
            )

        sec_cnt = conn.execute(
            "SELECT count(*)::int AS cnt FROM form_section WHERE form_version_id = %s",
            (str(versionId),),
        ).fetchone()["cnt"]
        vis_cnt = conn.execute(
            "SELECT count(*)::int AS cnt FROM form_field WHERE form_version_id = %s AND is_visible = true",
            (str(versionId),),
        ).fetchone()["cnt"]
        if sec_cnt == 0 or vis_cnt == 0:
            raise ProblemError(
                422,
                "EMPTY_FORM_VERSION",
                "Bản nháp biểu mẫu chưa đủ điều kiện phát hành",
                "Phiên bản biểu mẫu cần có ít nhất một nhóm và một trường hiển thị.",
                errors=[
                    {
                        "fieldCode": "sections",
                        "message": "Cần ít nhất 1 trường hiển thị trước khi phát hành.",
                    }
                ],
            )

        # Retire previous published version first (respecting ux_form_version_one_published)
        retired_row = conn.execute(
            """
            UPDATE form_version
            SET status = 'retired',
                row_version = row_version + 1
            WHERE form_template_id = %s AND status = 'published'
            RETURNING id
            """,
            (str(fv_row["form_template_id"]),),
        ).fetchone()
        retired_id = str(retired_row["id"]) if retired_row else None

        published_row = conn.execute(
            """
            UPDATE form_version
            SET status = 'published',
                published_at = now(),
                published_by = %s,
                change_note = COALESCE(%s, change_note),
                row_version = row_version + 1
            WHERE id = %s AND row_version = %s
            RETURNING *
            """,
            (
                str(principal.user_id),
                body.changeNote,
                str(versionId),
                current_rv,
            ),
        ).fetchone()

        record_audit_log(
            conn,
            actor_user_id=principal.user_id,
            action="form_version_publish",
            entity_type="form_version",
            entity_id=versionId,
            ip=ip_addr,
            request_id=req_id,
            outcome="success",
            detail={
                "versionNo": int(published_row["version_no"]),
                "versionLabel": published_row["version_label"],
                "retiredVersionId": retired_id,
            },
        )
        visit_cnt = conn.execute(
            "SELECT count(*)::int AS cnt FROM visit WHERE form_version_id = %s",
            (str(versionId),),
        ).fetchone()["cnt"]
        conn.commit()

    out = dict(published_row)
    out["visit_count"] = int(visit_cnt)
    response.headers["ETag"] = f'"{int(published_row["row_version"])}"'
    return form_version_row_to_dict(out)


@router.delete(
    "/form-versions/{versionId}",
    operation_id="deleteFormVersionDraft",
    tags=["AdminForms"],
)
def delete_form_version_draft(
    versionId: UUID,
    request: Request,
    if_match: str | None = Header(default=None, alias="If-Match"),
    principal: Principal = Depends(_require_admin_forms),
) -> dict[str, Any]:
    pool = request.app.state.pool
    req_id = get_request_id(request)
    ip_addr = get_client_ip(request)

    with pool.connection() as conn:
        fv_row = conn.execute(
            "SELECT * FROM form_version WHERE id = %s FOR UPDATE",
            (str(versionId),),
        ).fetchone()
        if not fv_row:
            raise ProblemError(
                404,
                "RESOURCE_NOT_FOUND",
                "Không tìm thấy phiên bản biểu mẫu",
                "Phiên bản biểu mẫu không tồn tại.",
            )
        current_rv = int(fv_row["row_version"])
        if fv_row["status"] != "draft":
            raise ProblemError(
                409,
                "FORM_VERSION_NOT_DRAFT",
                "Không thể xóa phiên bản đã phát hành",
                "Chỉ được xóa bản nháp chưa phát hành và chưa gắn lượt khám.",
                current_row_version=current_rv,
            )
        visit_cnt = conn.execute(
            "SELECT count(*)::int AS cnt FROM visit WHERE form_version_id = %s",
            (str(versionId),),
        ).fetchone()["cnt"]
        if visit_cnt > 0:
            raise ProblemError(
                409,
                "FORM_VERSION_IN_USE",
                "Bản nháp đã có lượt khám sử dụng",
                "Không thể xóa phiên bản đang có lượt khám gắn kèm.",
                current_row_version=current_rv,
            )
        if if_match is not None:
            expected_rv = parse_if_match(if_match, current_rv, current_row_version=current_rv)
            if expected_rv != current_rv:
                raise ProblemError(
                    409,
                    "CONCURRENCY_ROW_VERSION_MISMATCH",
                    "Xung đột phiên bản biểu mẫu (409)",
                    f"Bản nháp biểu mẫu hiện ở rowVersion {current_rv}.",
                    current_row_version=current_rv,
                )
        conn.execute("DELETE FROM form_version WHERE id = %s", (str(versionId),))
        record_audit_log(
            conn,
            actor_user_id=principal.user_id,
            action="form_version_update",
            entity_type="form_version",
            entity_id=versionId,
            ip=ip_addr,
            request_id=req_id,
            outcome="success",
            detail={"deletedDraft": True, "versionLabel": fv_row["version_label"]},
        )
        conn.commit()
    return {"deleted": True, "versionId": str(versionId), "versionLabel": fv_row["version_label"]}


# ---------------------------------------------------------------------------
# M8: Admin Audit Logs
# ---------------------------------------------------------------------------
@router.get(
    "/audit-logs",
    operation_id="listAuditLogs",
    response_model=AuditLogListResponse,
    tags=["AdminAuditLogs"],
)
def list_audit_logs(
    request: Request,
    actorUserId: UUID | None = Query(default=None),
    action: AuditAction | None = Query(default=None),
    entityType: Literal[
        "app_user",
        "user_session",
        "patient",
        "visit",
        "visit_revision",
        "form_template",
        "form_version",
        "field_definition",
        "care_assignment",
        "patient_record_request",
        "password_reset_request",
    ]
    | None = Query(default=None),
    entityId: UUID | None = Query(default=None),
    fromDate: datetime | None = Query(default=None),
    toDate: datetime | None = Query(default=None),
    q: str | None = Query(default=None, max_length=100),
    page: int = Query(default=1, ge=1),
    pageSize: int = Query(default=20, ge=1, le=100),
    principal: Principal = Depends(_require_admin_audit),
) -> dict[str, Any]:
    # Support optional 'from'/'to' alias query params if caller uses them instead of fromDate/toDate
    if fromDate is None and request.query_params.get("from"):
        try:
            raw = request.query_params["from"].replace("Z", "+00:00")
            fromDate = datetime.fromisoformat(raw)
        except ValueError as exc:
            raise ProblemError(
                422,
                "FIELD_VALIDATION_FAILED",
                "Tham số lọc thời gian không hợp lệ",
                "Tham số 'from' không đúng định dạng ISO 8601.",
                errors=[{"fieldCode": "fromDate", "message": "Định dạng thời gian không hợp lệ."}],
            ) from exc
    if toDate is None and request.query_params.get("to"):
        try:
            raw = request.query_params["to"].replace("Z", "+00:00")
            toDate = datetime.fromisoformat(raw)
        except ValueError as exc:
            raise ProblemError(
                422,
                "FIELD_VALIDATION_FAILED",
                "Tham số lọc thời gian không hợp lệ",
                "Tham số 'to' không đúng định dạng ISO 8601.",
                errors=[{"fieldCode": "toDate", "message": "Định dạng thời gian không hợp lệ."}],
            ) from exc

    if fromDate is not None and fromDate.tzinfo is None:
        fromDate = fromDate.replace(tzinfo=timezone.utc)
    if toDate is not None and toDate.tzinfo is None:
        toDate = toDate.replace(tzinfo=timezone.utc)

    if fromDate is not None and toDate is not None and fromDate > toDate:
        raise ProblemError(
            422,
            "FIELD_VALIDATION_FAILED",
            "Khoảng thời gian lọc không hợp lệ",
            "Thời điểm bắt đầu (fromDate) phải nhỏ hơn hoặc bằng thời điểm kết thúc (toDate).",
            errors=[
                {
                    "fieldCode": "fromDate",
                    "message": "fromDate không được lớn hơn toDate.",
                    "rejectedValue": to_iso(fromDate),
                }
            ],
        )

    where: list[str] = []
    params: list[Any] = []
    if actorUserId is not None:
        where.append("a.actor_user_id = %s")
        params.append(str(actorUserId))
    if action is not None:
        where.append("a.action = %s::audit_action")
        params.append(action)
    if entityType is not None:
        where.append("a.entity_type = %s")
        params.append(entityType)
    if entityId is not None:
        where.append("a.entity_id = %s")
        params.append(str(entityId))
    if fromDate is not None:
        where.append("a.occurred_at >= %s")
        params.append(fromDate)
    if toDate is not None:
        where.append("a.occurred_at <= %s")
        params.append(toDate)
    if q and q.strip():
        term = q.strip()
        like = f"%{term}%"
        # A role label ("Bác sĩ", "Nhân viên y tế", ...) filters by actor role only, so it
        # does not also match account-edit details that merely mention that role.
        role_labels = {
            "bác sĩ": "doctor", "bác sĩ lâm sàng": "doctor", "bs": "doctor",
            "nhân viên y tế": "nurse", "nvyt": "nurse", "điều dưỡng": "nurse",
            "quản trị viên": "admin", "quản trị": "admin", "admin": "admin",
            "dược sĩ": "pharmacist",
        }
        role = role_labels.get(" ".join(term.lower().split()))
        if role is not None:
            where.append("(u.role::text = %s OR COALESCE(u.username, '') ILIKE %s)")
            params.extend([role, like])
        else:
            where.append(
                "(COALESCE(u.username, '') ILIKE %s OR COALESCE(u.full_name, '') ILIKE %s OR COALESCE(a.request_id, '') ILIKE %s OR a.entity_type ILIKE %s OR a.detail::text ILIKE %s)"
            )
            params.extend([like, like, like, like, like])

    where_sql = f"WHERE {' AND '.join(where)}" if where else ""
    pool = request.app.state.pool

    with pool.connection() as conn:
        total_row = conn.execute(
            f"""
            SELECT count(*)::int AS cnt
            FROM audit_log a
            LEFT JOIN app_user u ON u.id = a.actor_user_id
            {where_sql}
            """,
            params,
        ).fetchone()
        total_items = int(total_row["cnt"]) if total_row else 0
        offset = (page - 1) * pageSize
        rows = conn.execute(
            f"""
            SELECT
                a.id, a.actor_user_id, a.action, a.entity_type, a.entity_id,
                a.occurred_at, a.ip::text AS ip_text, a.request_id, a.outcome, a.detail,
                u.username AS actor_username, u.full_name AS actor_full_name, u.role AS actor_role
            FROM audit_log a
            LEFT JOIN app_user u ON u.id = a.actor_user_id
            {where_sql}
            ORDER BY a.occurred_at DESC, a.id DESC
            LIMIT %s OFFSET %s
            """,
            [*params, pageSize, offset],
        ).fetchall()

    items = [
        {
            "id": str(r["id"]),
            "actorUserId": str(r["actor_user_id"]) if r["actor_user_id"] is not None else None,
            "actorUsername": r.get("actor_username"),
            "actorFullName": r.get("actor_full_name"),
            "actorRole": r.get("actor_role"),
            "action": r["action"],
            "entityType": r["entity_type"],
            "entityId": str(r["entity_id"]) if r["entity_id"] is not None else None,
            "occurredAt": to_iso(r["occurred_at"]),
            "ip": r["ip_text"].split("/")[0] if r.get("ip_text") else None,
            "requestId": r.get("request_id"),
            "outcome": r["outcome"],
            "detail": sanitize_audit_detail(r.get("detail")),
        }
        for r in rows
    ]
    return {
        "items": items,
        "pagination": compute_pagination(page, pageSize, total_items),
    }


@router.post("/form-versions/{versionId}/preview", operation_id="previewUnsavedFormVersion", response_model=FormVersionPreviewResponse, tags=["AdminForms"])
def preview_unsaved_form_version(versionId: UUID, body: UpdateFormVersionRequest, request: Request, principal: Principal = Depends(_require_admin_forms)):
    with request.app.state.pool.connection() as conn:
        fv, _, _ = load_form_version_bundle(conn, versionId)
        if fv["status"] != "draft":
            raise ProblemError(409,"FORM_VERSION_IMMUTABLE","Phiên bản đã khóa","Chỉ xem trạng thái chưa lưu của bản nháp.")
        if body.rowVersion is not None and body.rowVersion != fv["rowVersion"]:
            raise ProblemError(409,"CONCURRENCY_ROW_VERSION_MISMATCH","Bản nháp đã đổi","Tải lại bản nháp.",current_row_version=fv["rowVersion"])
        validate_form_configuration(conn,body,fv["rowVersion"],versionId)
        ids = [str(ff.fieldDefinitionId) for sec in body.sections for ff in sec.fields]
        definitions = load_field_definitions_with_children(conn,field_ids=ids)
        row = conn.execute("SELECT definition_overrides FROM form_version WHERE id=%s",(str(versionId),)).fetchone()
        from .hf_form import apply_definition_overrides
        apply_definition_overrides(definitions, row['definition_overrides'])
        lookup = {fd["id"]:fd["code"] for fd in definitions}
        sections = [sec.model_dump(mode="json") for sec in body.sections]
        for sec in sections:
            sec["formVersionId"]=str(versionId)
            for ff in sec["fields"]: ff.update(fieldCode=lookup[ff["fieldDefinitionId"]],formVersionId=str(versionId))
    return {"isPreviewOnly":True,"previewBannerVi":"Xem trước trạng thái chưa lưu; không ghi dữ liệu.","formVersion":fv,"sections":sorted(sections,key=lambda x:x["displayOrder"]),"fieldDefinitions":definitions}


# ---------------------------------------------------------------------------
# UI-02: Admin Password Reset Requests
# ---------------------------------------------------------------------------
def _pw_reset_row_to_dict(row: dict[str, Any]) -> dict[str, Any]:
    matched_user = None
    if row.get("matched_user_id") is not None:
        matched_user = {
            "id": str(row["matched_user_id"]),
            "username": row["matched_username"],
            "fullName": row["matched_full_name"],
            "role": row["matched_role"],
            "isActive": bool(row["matched_is_active"]),
            "rowVersion": int(row["matched_row_version"]),
        }
    return {
        "id": str(row["id"]),
        "usernameEntered": row["username_entered"],
        "note": row.get("note"),
        "status": row["status"],
        "requestedAt": to_iso(row["requested_at"]),
        "lastRequestedAt": to_iso(row["last_requested_at"]),
        "requestCount": int(row["request_count"]),
        "handledBy": str(row["handled_by"]) if row.get("handled_by") else None,
        "handledByName": row.get("handled_by_name"),
        "handledAt": to_iso(row.get("handled_at")),
        "adminNote": row.get("admin_note"),
        "matchedUser": matched_user,
    }


@router.get(
    "/password-reset-requests",
    operation_id="listPasswordResetRequests",
    response_model=PasswordResetRequestListResponse,
    tags=["AdminUsers"],
)
def list_password_reset_requests(
    request: Request,
    status: PasswordResetRequestStatus | None = Query(default=None),
    q: str | None = Query(default=None, max_length=100),
    page: int = Query(default=1, ge=1),
    pageSize: int = Query(default=20, ge=1, le=100),
    principal: Principal = Depends(_require_admin_users),
) -> dict[str, Any]:
    pool = request.app.state.pool
    with pool.connection() as conn:
        if not conn.execute("SELECT to_regclass('public.password_reset_request') AS r").fetchone()["r"]:
            return {
                "items": [],
                "pendingCount": 0,
                "pagination": compute_pagination(page, pageSize, 0),
            }

        pending_row = conn.execute(
            "SELECT count(*)::int AS cnt FROM password_reset_request WHERE status = 'pending'"
        ).fetchone()
        pending_count = int(pending_row["cnt"]) if pending_row else 0

        where: list[str] = []
        params: list[Any] = []
        if status is not None:
            where.append("r.status = %s")
            params.append(status)
        if q and q.strip():
            like = f"%{q.strip()}%"
            where.append(
                "(r.username_entered ILIKE %s OR COALESCE(u.full_name, '') ILIKE %s OR COALESCE(u.username, '') ILIKE %s)"
            )
            params.extend([like, like, like])

        where_sql = f"WHERE {' AND '.join(where)}" if where else ""
        base_from = f"""
            FROM password_reset_request r
            LEFT JOIN app_user u ON u.id = r.user_id
            LEFT JOIN app_user h ON h.id = r.handled_by
            {where_sql}
        """

        total_row = conn.execute(f"SELECT count(*)::int AS cnt {base_from}", params).fetchone()
        total_items = int(total_row["cnt"]) if total_row else 0
        offset = (page - 1) * pageSize
        rows = conn.execute(
            f"""
            SELECT
                r.*,
                u.id AS matched_user_id,
                u.username AS matched_username,
                u.full_name AS matched_full_name,
                u.role AS matched_role,
                u.is_active AS matched_is_active,
                u.row_version AS matched_row_version,
                h.full_name AS handled_by_name
            {base_from}
            ORDER BY (r.status = 'pending') DESC, r.last_requested_at DESC, r.id DESC
            LIMIT %s OFFSET %s
            """,
            [*params, pageSize, offset],
        ).fetchall()

    return {
        "items": [_pw_reset_row_to_dict(r) for r in rows],
        "pendingCount": pending_count,
        "pagination": compute_pagination(page, pageSize, total_items),
    }


@router.post(
    "/password-reset-requests/{requestId}/resolve",
    operation_id="resolvePasswordResetRequest",
    response_model=ResolvePasswordResetResponse,
    tags=["AdminUsers"],
)
def resolve_password_reset_request(
    requestId: UUID,
    body: ResolvePasswordResetRequest,
    request: Request,
    principal: Principal = Depends(_require_admin_users),
) -> dict[str, Any]:
    admin_note = body.adminNote.strip() if body.adminNote else None
    pool = request.app.state.pool
    req_id = get_request_id(request)
    ip_addr = get_client_ip(request)

    with pool.connection() as conn:
        req_row = conn.execute(
            """
            SELECT *
            FROM password_reset_request
            WHERE id = %s
            FOR UPDATE
            """,
            (str(requestId),),
        ).fetchone()
        if not req_row:
            raise ProblemError(
                404,
                "RESOURCE_NOT_FOUND",
                "Không tìm thấy yêu cầu cấp lại mật khẩu",
                "Yêu cầu cấp lại mật khẩu không tồn tại.",
            )
        if req_row["status"] != "pending":
            raise ProblemError(
                409,
                "REQUEST_ALREADY_HANDLED",
                "Yêu cầu đã được xử lý",
                "Yêu cầu cấp lại mật khẩu này không còn ở trạng thái chờ xử lý.",
            )

        user_row = None
        if req_row.get("user_id") is not None:
            user_row = conn.execute(
                """
                SELECT id, username, full_name, role, is_active, row_version, created_at, updated_at
                FROM app_user
                WHERE id = %s
                FOR UPDATE
                """,
                (str(req_row["user_id"]),),
            ).fetchone()
        if user_row is None:
            user_row = conn.execute(
                """
                SELECT id, username, full_name, role, is_active, row_version, created_at, updated_at
                FROM app_user
                WHERE lower(username) = %s
                FOR UPDATE
                """,
                (req_row["username_normalized"],),
            ).fetchone()

        if user_row is None:
            raise ProblemError(
                422,
                "USER_NOT_FOUND_FOR_RESET",
                "Không tìm thấy tài khoản khớp",
                "Tên đăng nhập trong yêu cầu không khớp tài khoản nào trong hệ thống. Vui lòng từ chối yêu cầu này.",
            )
        if user_row["role"] == "admin":
            raise ProblemError(
                403,
                "ADMIN_RESET_REQUEST_FORBIDDEN",
                "Không áp dụng cho tài khoản Quản trị viên",
                "Luồng quên mật khẩu không áp dụng cho tài khoản Quản trị viên.",
            )
        if not user_row["is_active"]:
            raise ProblemError(
                409,
                "ACCOUNT_DEACTIVATED",
                "Tài khoản đang bị tạm khóa",
                "Tài khoản này đang bị tạm khóa; vui lòng mở khóa tài khoản trước khi cấp mã đăng nhập một lần.",
            )

        one_time_code = _generate_one_time_code("RST")
        new_pw_hash = hash_password(one_time_code)

        updated_user = conn.execute(
            """
            UPDATE app_user
            SET password_hash = %s,
                row_version = row_version + 1
            WHERE id = %s
            RETURNING id, username, full_name, role, is_active, row_version, created_at, updated_at
            """,
            (new_pw_hash, str(user_row["id"])),
        ).fetchone()

        store_credential(conn, user_row["id"], one_time_code)
        conn.execute(
            """
            UPDATE user_session
            SET revoked_at = GREATEST(now(), created_at)
            WHERE user_id = %s AND revoked_at IS NULL
            """,
            (str(user_row["id"]),),
        )

        updated_req = conn.execute(
            """
            UPDATE password_reset_request
            SET status = 'resolved',
                user_id = %s,
                handled_by = %s,
                handled_at = now(),
                admin_note = %s
            WHERE id = %s
            RETURNING *
            """,
            (str(user_row["id"]), str(principal.user_id), admin_note, str(requestId)),
        ).fetchone()

        last_login_row = conn.execute(
            "SELECT max(created_at) AS last_login_at FROM user_session WHERE user_id = %s",
            (str(user_row["id"]),),
        ).fetchone()

        record_audit_log(
            conn,
            actor_user_id=principal.user_id,
            action="password_reset_resolve",
            entity_type="password_reset_request",
            entity_id=requestId,
            ip=ip_addr,
            request_id=req_id,
            outcome="success",
            detail={
                "targetUserId": str(user_row["id"]),
                "targetUsername": user_row["username"],
                "adminNote": admin_note,
            },
        )
        conn.commit()

    out_user = dict(updated_user)
    out_user["last_login_at"] = last_login_row["last_login_at"] if last_login_row else None
    out_req = dict(updated_req)
    out_req["matched_user_id"] = updated_user["id"]
    out_req["matched_username"] = updated_user["username"]
    out_req["matched_full_name"] = updated_user["full_name"]
    out_req["matched_role"] = updated_user["role"]
    out_req["matched_is_active"] = updated_user["is_active"]
    out_req["matched_row_version"] = updated_user["row_version"]
    out_req["handled_by_name"] = principal.full_name

    return {
        "request": _pw_reset_row_to_dict(out_req),
        "user": user_row_to_schema_dict(out_user),
    }


@router.post(
    "/password-reset-requests/{requestId}/reject",
    operation_id="rejectPasswordResetRequest",
    response_model=PasswordResetRequestItem,
    tags=["AdminUsers"],
)
def reject_password_reset_request(
    requestId: UUID,
    body: RejectPasswordResetRequest,
    request: Request,
    principal: Principal = Depends(_require_admin_users),
) -> dict[str, Any]:
    admin_note = body.adminNote.strip()
    if len(admin_note) < 3:
        raise ProblemError(
            422,
            "FIELD_VALIDATION_FAILED",
            "Thiếu lý do từ chối",
            "Ghi chú từ chối phải dài tối thiểu 3 ký tự.",
            errors=[{"fieldCode": "adminNote", "message": "Ghi chú từ chối phải có ít nhất 3 ký tự."}],
        )

    pool = request.app.state.pool
    req_id = get_request_id(request)
    ip_addr = get_client_ip(request)

    with pool.connection() as conn:
        req_row = conn.execute(
            """
            SELECT
                r.*,
                u.id AS matched_user_id,
                u.username AS matched_username,
                u.full_name AS matched_full_name,
                u.role AS matched_role,
                u.is_active AS matched_is_active,
                u.row_version AS matched_row_version
            FROM password_reset_request r
            LEFT JOIN app_user u ON u.id = r.user_id
            WHERE r.id = %s
            FOR UPDATE OF r
            """,
            (str(requestId),),
        ).fetchone()
        if not req_row:
            raise ProblemError(
                404,
                "RESOURCE_NOT_FOUND",
                "Không tìm thấy yêu cầu cấp lại mật khẩu",
                "Yêu cầu cấp lại mật khẩu không tồn tại.",
            )
        if req_row["status"] != "pending":
            raise ProblemError(
                409,
                "REQUEST_ALREADY_HANDLED",
                "Yêu cầu đã được xử lý",
                "Chỉ có thể từ chối yêu cầu đang ở trạng thái chờ xử lý.",
            )

        updated = conn.execute(
            """
            UPDATE password_reset_request
            SET status = 'rejected',
                handled_by = %s,
                handled_at = now(),
                admin_note = %s
            WHERE id = %s
            RETURNING *
            """,
            (str(principal.user_id), admin_note, str(requestId)),
        ).fetchone()

        record_audit_log(
            conn,
            actor_user_id=principal.user_id,
            action="password_reset_reject",
            entity_type="password_reset_request",
            entity_id=requestId,
            ip=ip_addr,
            request_id=req_id,
            outcome="success",
            detail={
                "usernameEntered": req_row["username_entered"],
                "adminNote": admin_note,
            },
        )
        conn.commit()

    out = dict(updated)
    for k in (
        "matched_user_id",
        "matched_username",
        "matched_full_name",
        "matched_role",
        "matched_is_active",
        "matched_row_version",
    ):
        out[k] = req_row.get(k)
    out["handled_by_name"] = principal.full_name
    return _pw_reset_row_to_dict(out)


# ---------------------------------------------------------------------------
# UI-18: Admin System-Wide Patient Records & Nurse Record Requests (Admin-only, K8-safe)
# ---------------------------------------------------------------------------
def _admin_patient_row_to_dict(row: dict[str, Any]) -> dict[str, Any]:
    """Strictly administrative patient metadata only — zero clinical or M1-M4 fields."""
    return {
        "id": str(row["id"]),
        "patientCode": row["patient_code"],
        "fullName": row["full_name"],
        "sex": row["sex"],
        "birthDate": to_date_iso(row.get("birth_date")),
        "birthYear": int(row["birth_year"]) if row.get("birth_year") is not None else None,
        "declaredAge": int(row["declared_age"]) if row.get("declared_age") is not None else None,
        "externalPatientCode": row.get("external_patient_code"),
        "cccd": row.get("cccd"),
        "recordStatus": row.get("record_status") or "active",
        "recordStatusUpdatedAt": to_iso(row.get("record_status_updated_at")),
        "recordStatusUpdatedBy": str(row["record_status_updated_by"]) if row.get("record_status_updated_by") else None,
        "recordStatusUpdatedByName": row.get("record_status_updated_by_name"),
        "visitCount": int(row.get("visit_count") or 0),
        "latestVisitDate": to_iso(row.get("latest_visit_date")),
        "pendingRequestCount": int(row.get("pending_request_count") or 0),
        "rowVersion": int(row["row_version"]),
        "createdAt": to_iso(row["created_at"]),
        "updatedAt": to_iso(row["updated_at"]),
    }


def _load_admin_patient_item(conn: Any, patient_id: UUID | str) -> dict[str, Any] | None:
    row = conn.execute(
        """
        SELECT
            p.id, p.patient_code, p.full_name, p.sex, p.birth_date, p.birth_year,
            p.declared_age, p.external_patient_code, p.cccd,
            p.record_status, p.record_status_updated_at, p.record_status_updated_by,
            p.row_version, p.created_at, p.updated_at,
            prs.full_name AS record_status_updated_by_name,
            COALESCE(vc.visit_count, 0) AS visit_count,
            vc.latest_visit_date,
            COALESCE(prc.pending_request_count, 0) AS pending_request_count
        FROM patient p
        LEFT JOIN app_user prs ON prs.id = p.record_status_updated_by
        LEFT JOIN LATERAL (
            SELECT count(*)::int AS visit_count, max(v.visit_date) AS latest_visit_date
            FROM visit v
            WHERE v.patient_id = p.id
        ) vc ON true
        LEFT JOIN LATERAL (
            SELECT count(*)::int AS pending_request_count
            FROM patient_record_request r
            WHERE r.patient_id = p.id AND r.status = 'pending'
        ) prc ON true
        WHERE p.id = %s
        """,
        (str(patient_id),),
    ).fetchone()
    return _admin_patient_row_to_dict(row) if row else None


@router.get(
    "/patients",
    operation_id="adminListPatients",
    response_model=AdminPatientListResponse,
    tags=["AdminPatients"],
)
def admin_list_patients(
    request: Request,
    q: str | None = Query(default=None, max_length=100),
    recordStatus: RecordStatus | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    pageSize: int = Query(default=20, ge=1, le=100),
    principal: Principal = Depends(_require_admin_patients),
) -> dict[str, Any]:
    pool = request.app.state.pool
    with pool.connection() as conn:
        if not conn.execute("SELECT to_regclass('public.patient_record_request') AS r").fetchone()["r"]:
            raise ProblemError(
                503,
                "MIGRATION_REQUIRED",
                "Chưa sẵn sàng quản lý hồ sơ bệnh nhân",
                "Cơ sở dữ liệu chưa áp dụng migration 012.",
            )

        summary_row = conn.execute(
            """
            SELECT
                count(*)::int AS total_all,
                count(*) FILTER (WHERE record_status = 'active')::int AS active_count,
                count(*) FILTER (WHERE record_status = 'locked')::int AS locked_count,
                count(*) FILTER (WHERE record_status = 'archived')::int AS archived_count,
                (SELECT count(*)::int FROM patient_record_request WHERE status = 'pending') AS pending_req_count
            FROM patient
            """
        ).fetchone()

        where: list[str] = []
        params: list[Any] = []
        if q and q.strip():
            like = f"%{q.strip()}%"
            where.append(
                "(p.patient_code ILIKE %s OR p.full_name ILIKE %s OR COALESCE(p.external_patient_code, '') ILIKE %s OR COALESCE(p.cccd, '') ILIKE %s)"
            )
            params.extend([like, like, like, like])
        if recordStatus is not None:
            where.append("p.record_status = %s")
            params.append(recordStatus)

        where_sql = f"WHERE {' AND '.join(where)}" if where else ""
        total_row = conn.execute(
            f"SELECT count(*)::int AS cnt FROM patient p {where_sql}",
            params,
        ).fetchone()
        total_items = int(total_row["cnt"]) if total_row else 0
        offset = (page - 1) * pageSize

        rows = conn.execute(
            f"""
            SELECT
                p.id, p.patient_code, p.full_name, p.sex, p.birth_date, p.birth_year,
                p.declared_age, p.external_patient_code, p.cccd,
                p.record_status, p.record_status_updated_at, p.record_status_updated_by,
                p.row_version, p.created_at, p.updated_at,
                prs.full_name AS record_status_updated_by_name,
                COALESCE(vc.visit_count, 0) AS visit_count,
                vc.latest_visit_date,
                COALESCE(prc.pending_request_count, 0) AS pending_request_count
            FROM patient p
            LEFT JOIN app_user prs ON prs.id = p.record_status_updated_by
            LEFT JOIN LATERAL (
                SELECT count(*)::int AS visit_count, max(v.visit_date) AS latest_visit_date
                FROM visit v
                WHERE v.patient_id = p.id
            ) vc ON true
            LEFT JOIN LATERAL (
                SELECT count(*)::int AS pending_request_count
                FROM patient_record_request r
                WHERE r.patient_id = p.id AND r.status = 'pending'
            ) prc ON true
            {where_sql}
            ORDER BY COALESCE(prc.pending_request_count, 0) DESC, p.updated_at DESC, p.patient_code DESC
            LIMIT %s OFFSET %s
            """,
            [*params, pageSize, offset],
        ).fetchall()

    return {
        "items": [_admin_patient_row_to_dict(r) for r in rows],
        "summary": {
            "totalAll": int(summary_row["total_all"]),
            "activeCount": int(summary_row["active_count"]),
            "lockedCount": int(summary_row["locked_count"]),
            "archivedCount": int(summary_row["archived_count"]),
            "pendingRequestCount": int(summary_row["pending_req_count"]),
        },
        "pagination": compute_pagination(page, pageSize, total_items),
    }


@router.get(
    "/patients/record-requests",
    operation_id="adminListPatientRecordRequests",
    response_model=AdminPatientRecordRequestListResponse,
    tags=["AdminPatients"],
)
def admin_list_patient_record_requests(
    request: Request,
    status: PatientRecordRequestStatus | None = Query(default=None),
    requestType: PatientRecordRequestType | None = Query(default=None),
    q: str | None = Query(default=None, max_length=100),
    page: int = Query(default=1, ge=1),
    pageSize: int = Query(default=20, ge=1, le=100),
    principal: Principal = Depends(_require_admin_patients),
) -> dict[str, Any]:
    pool = request.app.state.pool
    with pool.connection() as conn:
        if not conn.execute("SELECT to_regclass('public.patient_record_request') AS r").fetchone()["r"]:
            return {
                "items": [],
                "pendingCount": 0,
                "pagination": compute_pagination(page, pageSize, 0),
            }

        pending_row = conn.execute(
            "SELECT count(*)::int AS cnt FROM patient_record_request WHERE status = 'pending'"
        ).fetchone()
        pending_count = int(pending_row["cnt"]) if pending_row else 0

        where: list[str] = []
        params: list[Any] = []
        if status is not None:
            where.append("r.status = %s")
            params.append(status)
        if requestType is not None:
            where.append("r.request_type = %s")
            params.append(requestType)
        if q and q.strip():
            like = f"%{q.strip()}%"
            where.append(
                "(p.patient_code ILIKE %s OR p.full_name ILIKE %s OR req_u.full_name ILIKE %s OR r.reason ILIKE %s)"
            )
            params.extend([like, like, like, like])

        where_sql = f"WHERE {' AND '.join(where)}" if where else ""
        base_from = f"""
            FROM patient_record_request r
            JOIN patient p ON p.id = r.patient_id
            JOIN app_user req_u ON req_u.id = r.requested_by
            LEFT JOIN app_user hdl_u ON hdl_u.id = r.handled_by
            {where_sql}
        """

        total_row = conn.execute(f"SELECT count(*)::int AS cnt {base_from}", params).fetchone()
        total_items = int(total_row["cnt"]) if total_row else 0
        offset = (page - 1) * pageSize

        rows = conn.execute(
            f"""
            SELECT
                r.*,
                p.patient_code,
                p.full_name AS patient_name,
                p.record_status AS patient_record_status,
                req_u.full_name AS requested_by_name,
                hdl_u.full_name AS handled_by_name
            {base_from}
            ORDER BY (r.status = 'pending') DESC, r.requested_at DESC, r.id DESC
            LIMIT %s OFFSET %s
            """,
            [*params, pageSize, offset],
        ).fetchall()

    return {
        "items": [record_request_row_to_dict(r, principal) for r in rows],
        "pendingCount": pending_count,
        "pagination": compute_pagination(page, pageSize, total_items),
    }


@router.post(
    "/patients/record-requests/{requestId}/approve",
    operation_id="adminApprovePatientRecordRequest",
    response_model=ApprovePatientRecordRequestResponse,
    tags=["AdminPatients"],
)
def admin_approve_patient_record_request(
    requestId: UUID,
    body: ApprovePatientRecordRequest,
    request: Request,
    principal: Principal = Depends(_require_admin_patients),
) -> dict[str, Any]:
    admin_note = body.adminNote.strip() if body.adminNote else None
    pool = request.app.state.pool
    req_id = get_request_id(request)
    ip_addr = get_client_ip(request)

    with pool.connection() as conn:
        req_row = conn.execute(
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
            WHERE r.id = %s
            FOR UPDATE OF r, p
            """,
            (str(requestId),),
        ).fetchone()
        if not req_row:
            raise ProblemError(
                404,
                "RESOURCE_NOT_FOUND",
                "Không tìm thấy yêu cầu hồ sơ",
                "Yêu cầu khóa/lưu trữ hồ sơ không tồn tại.",
            )
        if req_row["status"] != "pending":
            raise ProblemError(
                409,
                "REQUEST_ALREADY_HANDLED",
                "Yêu cầu đã được xử lý",
                "Yêu cầu này không còn ở trạng thái chờ duyệt.",
            )

        old_status = req_row["patient_record_status"]
        target_status = "locked" if req_row["request_type"] == "lock" else "archived"

        conn.execute(
            """
            UPDATE patient
            SET record_status = %s,
                record_status_updated_at = now(),
                record_status_updated_by = %s,
                updated_by = %s,
                row_version = row_version + 1
            WHERE id = %s
            """,
            (target_status, str(principal.user_id), str(principal.user_id), str(req_row["patient_id"])),
        )

        updated_req = conn.execute(
            """
            UPDATE patient_record_request
            SET status = 'approved',
                handled_by = %s,
                handled_at = now(),
                admin_note = %s
            WHERE id = %s
            RETURNING *
            """,
            (str(principal.user_id), admin_note, str(requestId)),
        ).fetchone()

        # If approving archive (soft delete), close any other pending lock request on the same patient.
        if target_status == "archived":
            conn.execute(
                """
                UPDATE patient_record_request
                SET status = 'rejected',
                    handled_by = %s,
                    handled_at = now(),
                    admin_note = COALESCE(admin_note, 'Hồ sơ đã được duyệt chuyển sang lưu trữ.')
                WHERE patient_id = %s AND id <> %s AND status = 'pending'
                """,
                (str(principal.user_id), str(req_row["patient_id"]), str(requestId)),
            )

        record_audit_log(
            conn,
            actor_user_id=principal.user_id,
            action="patient_record_request_approve",
            entity_type="patient_record_request",
            entity_id=requestId,
            ip=ip_addr,
            request_id=req_id,
            outcome="success",
            detail={
                "patientId": str(req_row["patient_id"]),
                "patientCode": req_row["patient_code"],
                "requestType": req_row["request_type"],
                "fromStatus": old_status,
                "toStatus": target_status,
                "adminNote": admin_note,
            },
        )
        patient_item = _load_admin_patient_item(conn, req_row["patient_id"])
        conn.commit()

    out_req = dict(updated_req)
    out_req["patient_code"] = req_row["patient_code"]
    out_req["patient_name"] = req_row["patient_name"]
    out_req["patient_record_status"] = target_status
    out_req["requested_by_name"] = req_row["requested_by_name"]
    out_req["handled_by_name"] = principal.full_name

    return {
        "request": record_request_row_to_dict(out_req, principal),
        "patient": patient_item,
    }


@router.post(
    "/patients/record-requests/{requestId}/reject",
    operation_id="adminRejectPatientRecordRequest",
    response_model=PatientRecordRequestItem,
    tags=["AdminPatients"],
)
def admin_reject_patient_record_request(
    requestId: UUID,
    body: RejectPatientRecordRequest,
    request: Request,
    principal: Principal = Depends(_require_admin_patients),
) -> dict[str, Any]:
    admin_note = body.adminNote.strip()
    if len(admin_note) < 3:
        raise ProblemError(
            422,
            "FIELD_VALIDATION_FAILED",
            "Thiếu lý do từ chối",
            "Ghi chú từ chối phải có ít nhất 3 ký tự.",
            errors=[{"fieldCode": "adminNote", "message": "Ghi chú từ chối phải có ít nhất 3 ký tự."}],
        )

    pool = request.app.state.pool
    req_id = get_request_id(request)
    ip_addr = get_client_ip(request)

    with pool.connection() as conn:
        req_row = conn.execute(
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
            WHERE r.id = %s
            FOR UPDATE OF r
            """,
            (str(requestId),),
        ).fetchone()
        if not req_row:
            raise ProblemError(
                404,
                "RESOURCE_NOT_FOUND",
                "Không tìm thấy yêu cầu hồ sơ",
                "Yêu cầu khóa/lưu trữ hồ sơ không tồn tại.",
            )
        if req_row["status"] != "pending":
            raise ProblemError(
                409,
                "REQUEST_ALREADY_HANDLED",
                "Yêu cầu đã được xử lý",
                "Chỉ có thể từ chối yêu cầu đang chờ duyệt.",
            )

        updated = conn.execute(
            """
            UPDATE patient_record_request
            SET status = 'rejected',
                handled_by = %s,
                handled_at = now(),
                admin_note = %s
            WHERE id = %s
            RETURNING *
            """,
            (str(principal.user_id), admin_note, str(requestId)),
        ).fetchone()

        record_audit_log(
            conn,
            actor_user_id=principal.user_id,
            action="patient_record_request_reject",
            entity_type="patient_record_request",
            entity_id=requestId,
            ip=ip_addr,
            request_id=req_id,
            outcome="success",
            detail={
                "patientId": str(req_row["patient_id"]),
                "patientCode": req_row["patient_code"],
                "requestType": req_row["request_type"],
                "adminNote": admin_note,
            },
        )
        conn.commit()

    out = dict(updated)
    out["patient_code"] = req_row["patient_code"]
    out["patient_name"] = req_row["patient_name"]
    out["patient_record_status"] = req_row["patient_record_status"]
    out["requested_by_name"] = req_row["requested_by_name"]
    out["handled_by_name"] = principal.full_name
    return record_request_row_to_dict(out, principal)


@router.patch(
    "/patients/{patientId}/record-status",
    operation_id="adminUpdatePatientRecordStatus",
    response_model=AdminPatientItem,
    tags=["AdminPatients"],
)
def admin_update_patient_record_status(
    patientId: UUID,
    body: AdminUpdateRecordStatusRequest,
    request: Request,
    response: Response,
    if_match: str | None = Header(default=None, alias="If-Match"),
    principal: Principal = Depends(_require_admin_patients),
) -> dict[str, Any]:
    reason = body.reason.strip()
    if len(reason) < 3:
        raise ProblemError(
            422,
            "FIELD_VALIDATION_FAILED",
            "Thiếu lý do thay đổi trạng thái hồ sơ",
            "Lý do thao tác phải có ít nhất 3 ký tự.",
            errors=[{"fieldCode": "reason", "message": "Lý do thao tác phải có ít nhất 3 ký tự."}],
        )

    pool = request.app.state.pool
    req_id = get_request_id(request)
    ip_addr = get_client_ip(request)

    with pool.connection() as conn:
        pt = conn.execute(
            "SELECT id, patient_code, record_status, row_version FROM patient WHERE id = %s FOR UPDATE",
            (str(patientId),),
        ).fetchone()
        if not pt:
            raise ProblemError(
                404,
                "RESOURCE_NOT_FOUND",
                "Không tìm thấy hồ sơ bệnh nhân",
                "Hồ sơ bệnh nhân không tồn tại.",
            )

        current_rv = int(pt["row_version"])
        if if_match is not None or body.rowVersion is not None:
            expected_rv = parse_if_match(if_match, body.rowVersion, current_row_version=current_rv)
            if expected_rv != current_rv:
                raise ProblemError(
                    409,
                    "CONCURRENCY_ROW_VERSION_MISMATCH",
                    "Xung đột phiên bản hồ sơ (409)",
                    f"Hồ sơ bệnh nhân đã được cập nhật lên rowVersion {current_rv} ở phiên khác.",
                    current_row_version=current_rv,
                )

        old_status = pt["record_status"]
        if old_status == body.recordStatus:
            raise ProblemError(
                409,
                "RECORD_STATUS_UNCHANGED",
                "Trạng thái hồ sơ không thay đổi",
                "Hồ sơ bệnh nhân hiện đã ở trạng thái này.",
                current_row_version=current_rv,
            )

        conn.execute(
            """
            UPDATE patient
            SET record_status = %s,
                record_status_updated_at = now(),
                record_status_updated_by = %s,
                updated_by = %s,
                row_version = row_version + 1
            WHERE id = %s
            """,
            (body.recordStatus, str(principal.user_id), str(principal.user_id), str(patientId)),
        )

        # Keep pending nurse requests consistent when Admin applies lock/archive directly.
        if body.recordStatus == "locked":
            conn.execute(
                """
                UPDATE patient_record_request
                SET status = 'approved',
                    handled_by = %s,
                    handled_at = now(),
                    admin_note = %s
                WHERE patient_id = %s AND request_type = 'lock' AND status = 'pending'
                """,
                (str(principal.user_id), f"Quản trị viên khóa trực tiếp: {reason}", str(patientId)),
            )
        elif body.recordStatus == "archived":
            conn.execute(
                """
                UPDATE patient_record_request
                SET status = CASE WHEN request_type = 'delete' THEN 'approved' ELSE 'rejected' END,
                    handled_by = %s,
                    handled_at = now(),
                    admin_note = %s
                WHERE patient_id = %s AND status = 'pending'
                """,
                (str(principal.user_id), f"Quản trị viên lưu trữ trực tiếp: {reason}", str(patientId)),
            )

        record_audit_log(
            conn,
            actor_user_id=principal.user_id,
            action="patient_record_status_change",
            entity_type="patient",
            entity_id=patientId,
            ip=ip_addr,
            request_id=req_id,
            outcome="success",
            detail={
                "patientCode": pt["patient_code"],
                "fromStatus": old_status,
                "toStatus": body.recordStatus,
                "reason": reason,
            },
        )
        patient_item = _load_admin_patient_item(conn, patientId)
        conn.commit()

    response.headers["ETag"] = f'"{patient_item["rowVersion"]}"'
    return patient_item
