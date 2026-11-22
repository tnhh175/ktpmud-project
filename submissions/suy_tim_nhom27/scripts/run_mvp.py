"""Launch the Heart Failure Clinical Intake MVP."""
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
    hosted = os.environ.get("MVP_HOSTED") == "1"
    if hosted:
        database_url = os.environ.get("MVP_DATABASE_URL")
        auth_secret = os.environ.get("MVP_AUTH_SECRET")
        if not database_url or not auth_secret or len(auth_secret) < 32:
            raise SystemExit("Set MVP_DATABASE_URL and an MVP_AUTH_SECRET of at least 32 characters.")
        host = "0.0.0.0"
        port = int(os.environ["PORT"])
    else:
        database_url = resolve_database_url()
        host = os.environ.get("MVP_HOST", "127.0.0.1")
        port = int(os.environ.get("MVP_PORT", "8000"))

    app = create_app(database_url=database_url, mount_web=True, enable_api_docs=False if hosted else None)
    uvicorn.run(app, host=host, port=port)


if __name__ == "__main__":
    main()
