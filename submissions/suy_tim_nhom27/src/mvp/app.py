"""FastAPI application factory for the Heart Failure Clinical Intake MVP (Stage D)."""
from __future__ import annotations

from contextlib import asynccontextmanager
import os
from pathlib import Path
import secrets
from typing import Any, AsyncIterator
from uuid import uuid4

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse, Response
from fastapi.staticfiles import StaticFiles
import psycopg
from psycopg_pool import ConnectionPool, PoolTimeout
from starlette.exceptions import HTTPException as StarletteHTTPException
import yaml

from .admin import router as admin_router
from .auth import bootstrap_seed_passwords, get_request_id, router as auth_router
from .db import check_pool, create_pool, resolve_database_url
from .models import ProblemError, problem_response
from .patients import router as patients_router
from .visits import router as visits_router


_SUBMISSION_ROOT = Path(__file__).resolve().parents[2]
_OPENAPI_PATH = _SUBMISSION_ROOT / "api" / "openapi.yaml"
_WEB_MVP_DIR = _SUBMISSION_ROOT / "web-mvp"


def _load_openapi_dict() -> dict[str, Any]:
    if _OPENAPI_PATH.is_file():
        return yaml.safe_load(_OPENAPI_PATH.read_text(encoding="utf-8"))
    return {}


def create_app(
    database_url: str | None = None,
    pool: ConnectionPool | None = None,
    *,
    auth_secret: str | None = None,
    mount_web: bool = True,
    enable_api_docs: bool | None = None,
) -> FastAPI:
    if enable_api_docs is None:
        enable_api_docs = os.environ.get("MVP_ENABLE_API_DOCS", "0") == "1"
    resolved_dsn = resolve_database_url(database_url)
    owned_pool = pool if pool is not None else create_pool(resolved_dsn)
    secret_raw = auth_secret or os.environ.get("MVP_AUTH_SECRET") or secrets.token_hex(32)
    secret_bytes = secret_raw.encode("utf-8")

    @asynccontextmanager
    async def lifespan(app: FastAPI) -> AsyncIterator[None]:
        app.state.pool = owned_pool
        if pool is None:
            owned_pool.open(wait=True, timeout=10.0)
        with owned_pool.connection() as conn:
            bootstrap_seed_passwords(conn)
        try:
            yield
        finally:
            if pool is None:
                owned_pool.close()

    app = FastAPI(
        title="Hệ thống Thu thập và Xác nhận Dữ liệu Lâm sàng Suy tim Trước AI (MVP API)",
        version="1.0.0",
        openapi_url="/api/openapi.json" if enable_api_docs else None,
        docs_url="/docs" if enable_api_docs else None,
        redoc_url="/redoc" if enable_api_docs else None,
        lifespan=lifespan,
    )
    app.state.pool = owned_pool
    app.state.database_url = resolved_dsn
    app.state.auth_secret = secret_bytes

    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://127.0.0.1:8000",
            "http://localhost:8000",
            "http://127.0.0.1:5173",
            "http://localhost:5173",
        ],
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type", "If-Match", "X-Request-Id"],
        expose_headers=["ETag"],
    )

    @app.exception_handler(ProblemError)
    async def problem_error_handler(request: Request, exc: ProblemError) -> JSONResponse:
        return problem_response(
            status=exc.status,
            code=exc.code,
            title=exc.title,
            detail=exc.detail,
            instance=request.url.path,
            correlation_id=get_request_id(request),
            type_uri=exc.type_uri,
            current_row_version=exc.current_row_version,
            errors=exc.errors,
        )

    @app.exception_handler(RequestValidationError)
    async def validation_error_handler(
        request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        formatted_errors: list[dict[str, Any]] = []
        for err in exc.errors():
            loc = [str(part) for part in err.get("loc", ()) if part not in ("body", "query", "path", "header")]
            field_code = loc[-1] if loc else "request"
            inp = err.get("input")
            secret_field = any(
                marker in part.lower()
                for part in loc
                for marker in ("password", "token", "secret", "credential", "setupcode")
            )
            credential_request = request.url.path.startswith("/api/v1/auth/")
            if isinstance(inp, (dict, list)) or secret_field or credential_request:
                inp = None
            formatted_errors.append(
                {
                    "fieldCode": field_code,
                    "message": (
                        "Dữ liệu không hợp lệ."
                        if secret_field or credential_request
                        else err.get("msg", "Dữ liệu không hợp lệ.")
                    ),
                    "rejectedValue": inp,
                }
            )
        detail = (
            formatted_errors[0]["message"]
            if formatted_errors
            else "Dữ liệu yêu cầu không đúng định dạng hoặc thiếu trường bắt buộc."
        )
        return problem_response(
            status=422,
            code="FIELD_VALIDATION_FAILED",
            title="Dữ liệu đầu vào không hợp lệ",
            detail=detail,
            instance=request.url.path,
            correlation_id=get_request_id(request),
            errors=formatted_errors,
        )

    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(
        request: Request, exc: StarletteHTTPException
    ) -> JSONResponse:
        code_map = {
            401: "AUTH_UNAUTHORIZED",
            403: "RBAC_ROLE_FORBIDDEN",
            404: "RESOURCE_NOT_FOUND",
            405: "METHOD_NOT_ALLOWED",
            409: "CONFLICT",
        }
        code = code_map.get(exc.status_code, f"HTTP_{exc.status_code}")
        detail = str(exc.detail) if exc.detail else f"Lỗi HTTP {exc.status_code}"
        return problem_response(
            status=exc.status_code,
            code=code,
            title=detail,
            detail=detail,
            instance=request.url.path,
            correlation_id=get_request_id(request),
        )

    @app.exception_handler(psycopg.Error)
    async def psycopg_error_handler(request: Request, exc: psycopg.Error) -> JSONResponse:
        sqlstate = getattr(exc, "sqlstate", None)
        msg = str(exc).lower()
        if sqlstate == "23505":
            return problem_response(
                status=409,
                code="UNIQUE_CONSTRAINT_VIOLATION",
                title="Xung đột dữ liệu trùng lặp",
                detail="Bản ghi đã tồn tại hoặc xung đột khóa duy nhất.",
                instance=request.url.path,
                correlation_id=get_request_id(request),
            )
        if sqlstate in {"23503", "23514", "P0001", "22003", "22007", "22008", "22P02"}:
            if any(tok in msg for tok in ("confirmed", "published", "retired", "immutable")):
                return problem_response(
                    status=409,
                    code="IMMUTABLE_STATE_CONFLICT",
                    title="Bản ghi đã khóa bất biến",
                    detail="Không thể chỉnh sửa trực tiếp tài nguyên đã xác nhận hoặc đã phát hành.",
                    instance=request.url.path,
                    correlation_id=get_request_id(request),
                )
            return problem_response(
                status=422,
                code="FIELD_VALIDATION_FAILED",
                title="Dữ liệu không thỏa ràng buộc lưu trữ",
                detail="Dữ liệu không đáp ứng ràng buộc toàn vẹn trên cơ sở dữ liệu.",
                instance=request.url.path,
                correlation_id=get_request_id(request),
            )
        return problem_response(
            status=503,
            code="DATABASE_UNAVAILABLE",
            title="Cơ sở dữ liệu tạm thời không khả dụng",
            detail="Không thể hoàn tất truy vấn cơ sở dữ liệu.",
            instance=request.url.path,
            correlation_id=get_request_id(request),
        )

    @app.exception_handler(PoolTimeout)
    async def pool_timeout_handler(request: Request, exc: PoolTimeout) -> JSONResponse:
        return problem_response(
            status=503,
            code="DATABASE_UNAVAILABLE",
            title="Cơ sở dữ liệu tạm thời bận",
            detail="Hết thời gian chờ kết nối cơ sở dữ liệu.",
            instance=request.url.path,
            correlation_id=get_request_id(request),
        )

    @app.exception_handler(Exception)
    async def fallback_error_handler(request: Request, exc: Exception) -> JSONResponse:
        return problem_response(
            status=500,
            code="INTERNAL_SERVER_ERROR",
            title="Lỗi máy chủ nội bộ",
            detail="Đã xảy ra lỗi không mong muốn khi xử lý yêu cầu.",
            instance=request.url.path,
            correlation_id=f"req-{uuid4().hex[:12]}",
        )

    @app.get("/api/v1/health", tags=["System"])
    @app.get("/health", include_in_schema=False)
    def health() -> dict[str, str]:
        if not check_pool(app.state.pool):
            raise ProblemError(
                503,
                "DATABASE_UNAVAILABLE",
                "Cơ sở dữ liệu chưa sẵn sàng",
                "Không thể kết nối tới PostgreSQL.",
            )
        return {"status": "ok", "persistence": "postgres"}

    def get_openapi_yaml() -> Response:
        if not _OPENAPI_PATH.is_file():
            raise ProblemError(
                404,
                "RESOURCE_NOT_FOUND",
                "Không tìm thấy tệp OpenAPI",
                "Tệp api/openapi.yaml không tồn tại.",
            )
        return FileResponse(
            path=str(_OPENAPI_PATH),
            media_type="application/yaml; charset=utf-8",
        )

    if enable_api_docs:
        app.add_api_route("/api/openapi.yaml", get_openapi_yaml, include_in_schema=False)
        app.add_api_route("/api/v1/openapi.yaml", get_openapi_yaml, include_in_schema=False)

    app.include_router(auth_router)
    app.include_router(patients_router)
    app.include_router(visits_router)
    app.include_router(admin_router)

    cached_spec = _load_openapi_dict()
    if cached_spec:
        app.openapi = lambda: cached_spec  # type: ignore[method-assign]

    if mount_web and _WEB_MVP_DIR.is_dir():
        app.mount(
            "/",
            StaticFiles(directory=str(_WEB_MVP_DIR), html=True),
            name="web-mvp",
        )

    return app
