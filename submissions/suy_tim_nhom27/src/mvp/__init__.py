"""MVP Backend package (Stage D: FastAPI + PostgreSQL 18.6, OpenAPI 3.1 contract)."""
from __future__ import annotations

from .app import create_app

__all__ = ["create_app"]
