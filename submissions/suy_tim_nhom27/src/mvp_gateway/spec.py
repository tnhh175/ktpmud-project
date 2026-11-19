"""Export a strict OpenAPI 3.0.3 contract from the runnable stub."""
from fastapi.openapi.utils import get_openapi


def contract(app):
    spec = get_openapi(title=app.title, version=app.version, description=app.description,
                       routes=app.routes, openapi_version="3.0.3")

    def convert(value):
        if isinstance(value, list):
            return [convert(item) for item in value]
        if not isinstance(value, dict):
            return value
        value = {key: convert(item) for key, item in value.items()}
        if "anyOf" in value:
            options = [item for item in value["anyOf"] if item.get("type") != "null"]
            if len(options) < len(value["anyOf"]):
                value["nullable"] = True
                if len(options) == 1:
                    value.pop("anyOf")
                    if "$ref" in options[0]:
                        value["allOf"] = [options[0]]
                    else:
                        value.update(options[0])
                else:
                    value["anyOf"] = options
        if "const" in value:
            value["enum"] = [value.pop("const")]
        if value.pop("contentMediaType", None) == "application/octet-stream":
            value["format"] = "binary"
        for bound, limit in (("exclusiveMinimum", "minimum"), ("exclusiveMaximum", "maximum")):
            if bound in value and not isinstance(value[bound], bool):
                value[limit] = value[bound]
                value[bound] = True
        return value

    spec = convert(spec)
    spec["servers"] = [{"url": "http://127.0.0.1:8003", "description": "Local stub; deployment requires HTTPS"}]
    spec.setdefault("components", {}).setdefault("securitySchemes", {})["BearerAuth"] = {
        "type": "http", "scheme": "bearer", "description": "Synthetic local token from /api/v1/auth/token; never use in production."
    }
    spec["components"]["schemas"]["Error"] = {
        "type": "object", "required": ["code", "message"],
        "properties": {"code": {"type": "string"}, "message": {"type": "string"}},
    }
    error = {"description": "Yêu cầu không thành công", "content": {
        "application/json": {"schema": {"$ref": "#/components/schemas/Error"}}
    }}
    placeholders = {
        ("post", "/api/v1/auth/recovery"),
        ("post", "/api/v1/patients/{patient_id}/identifiers"),
        ("patch", "/api/v1/encounters/{encounter_id}/status"),
        ("post", "/api/v1/encounters/{encounter_id}/identifiers"),
        ("post", "/api/v1/encounters/{encounter_id}/clinical-orders"),
        ("post", "/api/v1/imports/{batch_id}/apply"),
        ("post", "/api/v1/imports/{batch_id}/retry"),
        ("post", "/api/v1/admin/role-grants"),
        ("get", "/api/v1/admin/catalogs"),
        ("put", "/api/v1/admin/catalogs/{code}"),
        ("post", "/api/v1/admin/backups"),
        ("post", "/api/v1/admin/backups/{backup_id}/restore"),
    }
    for path, methods in spec["paths"].items():
        for method, operation in methods.items():
            if not isinstance(operation, dict) or "responses" not in operation:
                continue
            operation["x-implementation-status"] = "placeholder" if (method, path) in placeholders else "in-memory-mock"
            for code in ("401", "403", "404", "409", "422"):
                operation["responses"][code] = error
            if path.startswith("/api/v1/") and path not in ("/api/v1/auth/token", "/api/v1/auth/recovery"):
                operation["security"] = [{"BearerAuth": []}]
    return spec
