"""Admin endpoints (D5: M6 Users & Permissions, M7 Form Versions, M8 Audit Logs)."""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any, Literal
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, Header, Query, Request, Response

from .audit import record_audit_log, sanitize_audit_detail
from .auth import (
    Principal,
    get_client_ip,
    get_request_id,
    hash_password,
    require_role,
    user_row_to_schema_dict,
)
from .db import compute_pagination, parse_if_match, to_iso
from .models import (
    AppUser,
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
    PermissionPreviewRequest,
    PermissionPreviewResponse,
    ProblemError,
    PublishFormVersionRequest,
    SectionCode,
    UpdateFormVersionRequest,
    UpdateUserRequest,
    UpdateUserResponse,
    UserListResponse,
    UserRole,
)
from .visits import (
    form_version_row_to_dict,
    load_field_definitions_with_children,
    load_form_version_bundle,
)


router = APIRouter(prefix="/api/v1/admin", tags=["Admin"])

_require_admin_users = require_role("admin", "app_user")
_require_admin_forms = require_role("admin", "form_version")
_require_admin_audit = require_role("admin", "audit_log")


def _permission_matrix_for_role(role: str) -> dict[str, Any]:
    if role == 'nurse':
        return dict(role='nurse',clinicalDataAccessAllowed=False,
            separationNoticeVi='NVYT chỉ nhập hành chính và sinh hiệu, gửi/rút lượt trước khi bác sĩ nhận.',
            grantedPermissions=[dict(code=code,labelVi=label,category='clinical') for code,label in (
                ('patients:read_write','Tìm, tạo và sửa hành chính bệnh nhân'),
                ('visits:intake','Tạo lượt, nhập hành chính và sinh hiệu ở intake'),
                ('visits:submit_withdraw','Gửi hàng chờ hoặc rút lượt của mình trước khi được nhận'))],
            deniedPermissions=[dict(code=code,labelVi=label,category='clinical') for code,label in (
                ('visits:clinical','Không đọc chẩn đoán, thuốc hay kết quả AI'),
                ('visits:claim_confirm','Không nhận hoặc xác nhận lượt khám'),
                ('admin_users:manage','Không quản trị tài khoản và biểu mẫu'))])
    if role == "doctor":
        return {
            "role": "doctor",
            "clinicalDataAccessAllowed": True,
            "separationNoticeVi": (
                "Vai trò Bác sĩ (doctor) được phép quản lý hồ sơ bệnh nhân, nhập và xác nhận dữ liệu lượt khám; "
                "không có quyền truy cập phân hệ Quản trị tài khoản, Biểu mẫu hay Nhật ký hệ thống."
            ),
            "grantedPermissions": [
                {
                    "code": "patients:read_write",
                    "labelVi": "Tìm kiếm, tạo mới và cập nhật hành chính hồ sơ bệnh nhân (BN-xxxxx)",
                    "category": "clinical",
                },
                {
                    "code": "visits:draft",
                    "labelVi": "Nhận lượt hàng chờ, nhập và lưu lượt mình đã nhận",
                    "category": "clinical",
                },
                {
                    "code": "visits:confirm",
                    "labelVi": "Xem lại dữ liệu lượt khám và xác nhận lượt khám (Tầng 3)",
                    "category": "clinical",
                },
                {
                    "code": "visits:revise",
                    "labelVi": "Tạo bản sửa mới (visit_revision) kèm lý do sau khi xác nhận",
                    "category": "clinical",
                },
                {
                    "code": "visits:ai_input_export",
                    "labelVi": "Xuất gói dữ liệu chuẩn AiInputPayload của lượt khám đã xác nhận",
                    "category": "clinical",
                },
            ],
            "deniedPermissions": [
                {
                    "code": "admin_users:manage",
                    "labelVi": "Tạo, phân quyền, khóa/mở hoặc đặt lại mật khẩu tài khoản hệ thống",
                    "category": "administration",
                },
                {
                    "code": "admin_forms:manage",
                    "labelVi": "Tạo bản nháp, chỉnh sửa cấu trúc và phát hành phiên bản biểu mẫu",
                    "category": "administration",
                },
                {
                    "code": "admin_audit:read",
                    "labelVi": "Tra cứu nhật ký kiểm toán hệ thống toàn cục",
                    "category": "audit",
                },
            ],
        }
    return {
        "role": "admin",
        "clinicalDataAccessAllowed": False,
        "separationNoticeVi": (
            "Vai trò Quản trị viên (admin) bị tách biệt hoàn toàn khỏi quyền đọc và chỉnh sửa bệnh án lâm sàng (chốt K8). "
            "Mọi truy cập trực tiếp vào /patients* hoặc /visits* đều bị chặn với mã 403 Forbidden."
        ),
        "grantedPermissions": [
            {
                "code": "admin_users:manage",
                "labelVi": "Quản lý tài khoản hệ thống, xem trước quyền, khóa/mở và đặt lại mật khẩu",
                "category": "administration",
            },
            {
                "code": "admin_forms:manage",
                "labelVi": "Quản lý vòng đời phiên bản biểu mẫu (Bản nháp, Xem trước, Diff, Phát hành)",
                "category": "administration",
            },
            {
                "code": "admin_audit:read",
                "labelVi": "Tra cứu nhật ký kiểm toán hệ thống (chỉ siêu dữ liệu, che giấu PHI và mật khẩu)",
                "category": "audit",
            },
        ],
        "deniedPermissions": [
            {
                "code": "patients:read_write",
                "labelVi": "Đọc hoặc sửa hồ sơ bệnh nhân lâm sàng (bị chặn 403 theo chốt K8)",
                "category": "clinical",
            },
            {
                "code": "visits:draft",
                "labelVi": "Đọc chi tiết, nhập liệu hoặc lưu nháp lượt khám bệnh nhân",
                "category": "clinical",
            },
            {
                "code": "visits:confirm",
                "labelVi": "Xác nhận dữ liệu lượt khám hoặc xuất dữ liệu lâm sàng AiInputPayload",
                "category": "clinical",
            },
        ],
    }


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
    setup_expires_at = datetime.now(timezone.utc) + timedelta(hours=24)

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
        "oneTimeSetupCode": one_time_code,
        "setupExpiresAt": to_iso(setup_expires_at),
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
        "oneTimeSetupCode": one_time_code,
    }


@router.post(
    "/users/permission-preview",
    operation_id="previewUserPermissions",
    response_model=PermissionPreviewResponse,
    tags=["AdminUsers"],
)
def preview_user_permissions(
    body: PermissionPreviewRequest,
    principal: Principal = Depends(_require_admin_users),
) -> dict[str, Any]:
    return _permission_matrix_for_role(body.role)


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
        like = f"%{q.strip()}%"
        where.append(
            "(COALESCE(u.username, '') ILIKE %s OR COALESCE(a.request_id, '') ILIKE %s OR a.entity_type ILIKE %s OR a.detail::text ILIKE %s)"
        )
        params.extend([like, like, like, like])

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
                u.username AS actor_username, u.role AS actor_role
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
