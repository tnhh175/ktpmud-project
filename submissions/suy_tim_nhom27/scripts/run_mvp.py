"""Local launcher for the Heart Failure Clinical Intake MVP FastAPI + PostgreSQL app."""
from __future__ import annotations

import os
from pathlib import Path
import sys

import uvicorn


SUBMISSION_ROOT = Path(__file__).resolve().parents[1]
if str(SUBMISSION_ROOT) not in sys.path:
    sys.path.insert(0, str(SUBMISSION_ROOT))

from src.mvp.app import create_app  # noqa: E402
from src.mvp.db import resolve_database_url  # noqa: E402


def main() -> None:
    database_url = resolve_database_url()
    host = os.environ.get("MVP_HOST", "127.0.0.1")
    port = int(os.environ.get("MVP_PORT", "8000"))

    print("============================================================")
    print("Heart Failure Clinical Intake MVP (FastAPI + PostgreSQL)")
    print(f"Web UI     : http://{host}:{port}/")
    print(f"API Base   : http://{host}:{port}/api/v1")
    print(f"Swagger UI : http://{host}:{port}/docs")
    print(f"OpenAPI    : http://{host}:{port}/api/openapi.yaml")
    print("Seed local test accounts (development/local only):")
    print("  - doctor_demo / Doctor@2026!")
    print("  - admin_demo  / Admin@2026!")
    print("============================================================")

    app = create_app(database_url=database_url, mount_web=True)
    uvicorn.run(app, host=host, port=port)


if __name__ == "__main__":
    main()
