"""Public builds omit API docs; backend developers explicitly enable them internally."""
from pathlib import Path
import re

from fastapi.testclient import TestClient
import pytest
import yaml

from scripts.build_pages import (
    build_pages, DEFAULT_WEB_SRC, DEFAULT_OPENAPI, DEFAULT_ARCH_MD, STATIC_CONFIG_JS, WEB_ASSETS,
)
from src.mvp.app import create_app
from src.gateway.main import create_app as create_gateway


DOC_URLS = (
    "/docs", "/redoc", "/openapi.json", "/openapi.yaml", "/api/",
    "/api/index.html", "/api/openapi.json", "/api/openapi.yaml", "/api/v1/openapi.yaml",
)


@pytest.mark.parametrize("mount_web", [False, True])
def test_mvp_docs_default_off_and_contract_available(monkeypatch, mount_web):
    monkeypatch.delenv("MVP_ENABLE_API_DOCS", raising=False)
    app = create_app(mount_web=mount_web)
    try:
        client = TestClient(app)
        for url in DOC_URLS:
            assert client.get(url).status_code == 404, url
        assert app.openapi() == yaml.safe_load(DEFAULT_OPENAPI.read_text(encoding="utf-8"))
    finally:
        app.state.pool.close()


def test_mvp_internal_docs_explicitly_enabled(monkeypatch):
    monkeypatch.setenv("MVP_ENABLE_API_DOCS", "1")
    app = create_app(mount_web=True)
    try:
        client = TestClient(app)
        spec = app.openapi()
        assert client.get("/api/openapi.json").json() == spec
        for url in ("/api/openapi.yaml", "/api/v1/openapi.yaml"):
            assert yaml.safe_load(client.get(url).text) == spec
        for url in ("/docs", "/redoc"):
            response = client.get(url)
            assert response.status_code == 200
            assert "/api/openapi.json" in response.text
        disabled = create_app(mount_web=False, enable_api_docs=False)
        try:
            assert TestClient(disabled).get("/docs").status_code == 404
        finally:
            disabled.state.pool.close()
    finally:
        app.state.pool.close()


@pytest.mark.parametrize("forms_only", [False, True])
def test_gateway_docs_are_also_private_by_default(monkeypatch, forms_only):
    monkeypatch.delenv("MVP_ENABLE_API_DOCS", raising=False)
    monkeypatch.delenv("DATABASE_URL", raising=False)
    app = create_gateway(forms_only=forms_only)
    client = TestClient(app)
    for url in DOC_URLS:
        assert client.get(url).status_code == 404, url
    assert app.openapi()["paths"]
    internal = TestClient(create_gateway(forms_only=forms_only, enable_api_docs=True))
    assert internal.get("/openapi.json").status_code == 200
    assert internal.get("/docs").status_code == 200
    assert internal.get("/redoc").status_code == 200


@pytest.mark.parametrize("stale", [False, True])
def test_public_build_contains_no_api_docs(tmp_path, stale):
    output = tmp_path / "site"
    if stale:
        output.mkdir()
        (output / "index.html").write_text(DEFAULT_WEB_SRC.joinpath("index.html").read_text(encoding="utf-8"), encoding="utf-8")
        (output / "config.js").write_text(STATIC_CONFIG_JS, encoding="utf-8", newline="\n")
        (output / ".nojekyll").touch()
        for name in ("api/index.html", "api/openapi.yaml", "api/openapi.json",
                     "openapi.json", "schemas/contract.json"):
            dest = output / name
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_text("OLD PUBLIC API DOCS", encoding="utf-8")
    original = DEFAULT_OPENAPI.read_bytes()
    build_pages(DEFAULT_WEB_SRC, DEFAULT_OPENAPI, DEFAULT_ARCH_MD, output)
    files = {p.relative_to(output).as_posix() for p in output.rglob("*") if p.is_file()}
    assert files == {*WEB_ASSETS, "config.js", ".nojekyll", "docs/index.html"}
    for name in ("index.html", "app.js", "docs/index.html"):
        text = (output / name).read_text(encoding="utf-8")
        assert not re.search(r'href=[\"\'][^\"\']*(?:api/|openapi\.)', text)
        assert "openapi-data" not in text
    assert DEFAULT_OPENAPI.read_bytes() == original


@pytest.mark.parametrize("target_name", ["src", "tests", "custom-output"])
def test_public_build_refuses_unknown_nonempty_directory(tmp_path, target_name):
    output = tmp_path / target_name
    output.mkdir()
    sentinel = output / "keep.txt"
    sentinel.write_text("do not remove", encoding="utf-8")
    with pytest.raises(ValueError, match="dữ liệu khác"):
        build_pages(DEFAULT_WEB_SRC, DEFAULT_OPENAPI, DEFAULT_ARCH_MD, output)
    assert sentinel.read_text(encoding="utf-8") == "do not remove"


@pytest.mark.parametrize("target", [DEFAULT_WEB_SRC, DEFAULT_OPENAPI.parent,
                                  DEFAULT_WEB_SRC.parents[2], Path.home(),
                                  Path(DEFAULT_WEB_SRC.anchor),
                                  DEFAULT_WEB_SRC / "generated", DEFAULT_OPENAPI.parent / "generated",
                                  DEFAULT_ARCH_MD.parent / "generated",
                                  DEFAULT_WEB_SRC.parents[2] / ".git" / "generated"])
def test_build_refuses_source_or_ancestor_cleanup(target):
    # An output containing source files must never reach recursive deletion.
    with pytest.raises(ValueError):
        build_pages(DEFAULT_WEB_SRC, DEFAULT_OPENAPI, DEFAULT_ARCH_MD, target)
