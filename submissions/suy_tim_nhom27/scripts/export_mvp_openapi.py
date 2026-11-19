"""Regenerate the MVP API contract. Run from any working directory."""
from pathlib import Path
import sys
import yaml

root = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(root))
from src.mvp_gateway.main import create_app
from src.mvp_gateway.spec import contract

target = root / "api" / "openapi.yaml"
target.write_text(yaml.safe_dump(contract(create_app()), allow_unicode=True, sort_keys=False), encoding="utf-8")
print(target)
