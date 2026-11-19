"""Security headers and cache policy tests for forms-v2 static assets (no DB required)."""
from __future__ import annotations

from pathlib import Path
import sys

import pytest
from fastapi.testclient import TestClient

APP_ROOT = str(Path(__file__).resolve().parents[1])
if APP_ROOT not in sys.path:
    sys.path.insert(0, APP_ROOT)

from src.gateway.main import create_app

EXPECTED_CSP = (
    "default-src 'self'; script-src 'self'; style-src 'self'; "
    "font-src 'self'; img-src 'self' data:; connect-src 'self'; "
    "frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
)


@pytest.fixture
def client(monkeypatch):
    monkeypatch.delenv("DATABASE_URL", raising=False)
    with TestClient(create_app()) as test_client:
        yield test_client


def test_forms_v2_html_has_security_headers_and_no_store_cache(client):
    response = client.get("/forms-v2.html")
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/html")
    assert response.headers["content-security-policy"] == EXPECTED_CSP
    assert response.headers["x-content-type-options"] == "nosniff"
    assert response.headers["referrer-policy"] == "no-referrer"
    assert response.headers["cache-control"] == "no-store"


@pytest.mark.parametrize(
    "asset_path",
    [
        "/forms-v2/router.js",
        "/forms-v2/styles.css",
        "/forms-v2/assets/plus-jakarta-sans-variable.woff2",
    ],
)
def test_forms_v2_subpaths_have_security_headers_without_no_store(client, asset_path):
    response = client.get(asset_path)
    assert response.status_code == 200
    assert response.headers["content-security-policy"] == EXPECTED_CSP
    assert response.headers["x-content-type-options"] == "nosniff"
    assert response.headers["referrer-policy"] == "no-referrer"
    assert response.headers.get("cache-control") != "no-store"


def test_legacy_forms_and_other_routes_remain_unchanged(client):
    for legacy_path in ("/", "/login", "/forms"):
        response = client.get(legacy_path)
        assert response.status_code == 200
        assert "forms.js" in response.text
        assert response.headers["cache-control"] == "no-store"
        assert "content-security-policy" not in response.headers

    legacy_html = client.get("/forms.html")
    assert legacy_html.status_code == 200
    assert "forms.js" in legacy_html.text
    assert "content-security-policy" not in legacy_html.headers

    for asset_path in ("/forms.js", "/forms.css"):
        asset = client.get(asset_path)
        assert asset.status_code == 200
        assert asset.headers["cache-control"] == "no-cache, must-revalidate"
        assert "content-security-policy" not in asset.headers
