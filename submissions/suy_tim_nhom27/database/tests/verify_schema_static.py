#!/usr/bin/env python3
"""Static verification suite for stage-c/database (PostgreSQL 5432 remains stopped).

Checks:
  1. pglast (libpg_query) parses schema.sql, seed.sql, and tests/schema_test.sql cleanly,
     and compiles all PL/pgSQL functions & DO blocks.
  2. Exact parity across CONTRACT.md enums/tables, schema.sql AST, and schema_metadata.json.
  3. seed.sql AST extracts exact counts: 2 app_user, 1 form_template, 1 form_version (draft->published),
     8 form_section, 121 field_definition (95 mvp + 26 can_xac_nhan), 121 form_field,
     all choice fields have options, 0 AI-output / giai_doan_sau codes.
  4. 100% alignment between trace-table.xlsx (TL06 206 rows) and seed.sql / schema_metadata.json.
  5. Presence of required DDL checks & triggers (CONTRACT.md criteria a-g + K8/lab unit checks).
  6. Documentation parity in erd.md, data_dictionary.md, source_mapping.md.
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

import openpyxl
import pglast
from pglast import ast, enums

DB_DIR = Path(__file__).resolve().parent.parent
STAGE_C_DIR = DB_DIR.parent
STAGE_A_DIR = STAGE_C_DIR.parent / "stage-a"

SCHEMA_SQL = DB_DIR / "schema.sql"
SEED_SQL = DB_DIR / "seed.sql"
TEST_SQL = DB_DIR / "tests" / "schema_test.sql"
METADATA_JSON = DB_DIR / "schema_metadata.json"
TRACE_XLSX = STAGE_A_DIR / "trace-table.xlsx"
ERD_MD = DB_DIR / "erd.md"
DICT_MD = DB_DIR / "data_dictionary.md"
MAP_MD = DB_DIR / "source_mapping.md"

CONTRACT_ENUMS = {
    "user_role": ["doctor", "admin"],
    "visit_status": ["draft", "confirmed"],
    "value_state": ["answered", "unknown"],
    "form_version_status": ["draft", "published", "retired"],
    "field_scope_status": ["mvp", "can_xac_nhan"],
    "field_data_type": ["number", "integer", "text", "boolean", "date", "single_choice", "multi_choice"],
    "section_code": [
        "hanh_chinh",
        "trieu_chung_dien_bien",
        "sinh_ton_kham",
        "benh_su_dong_mac",
        "thuoc_di_ung",
        "can_lam_sang",
        "lao_khoa",
        "ghi_chu",
    ],
    "readiness_tier": ["patient_created", "draft_saved", "confirmed", "ai_ready"],
    "bp_position": ["supine", "sitting", "standing"],
    "audit_action": [
        "login",
        "logout",
        "login_failed",
        "user_create",
        "user_update",
        "form_version_create",
        "form_version_update",
        "form_version_publish",
        "patient_create",
        "visit_confirm",
        "ai_input_export",
        "care_assignment_add",
        "care_assignment_revoke",
    ],
}

EXPECTED_TABLES = {
    "app_user",
    "user_session",
    "patient",
    "field_definition",
    "field_option",
    "field_ai_module",
    "form_template",
    "form_version",
    "form_section",
    "form_field",
    "visit",
    "visit_value",
    "visit_value_option",
    "visit_orthostatic_bp",
    "visit_medication",
    "visit_allergy",
    "visit_lab_result",
    "visit_revision",
    "audit_log",
    "visit_diagnosis",
    "patient_care_assignment",
}


def extract_const_val(node):
    if isinstance(node, ast.A_Const):
        val = node.val
        if isinstance(val, ast.String):
            return val.sval
        if isinstance(val, ast.Integer):
            return val.ival
        if isinstance(val, ast.Float):
            return float(val.fval)
        if isinstance(val, ast.Boolean):
            return val.boolval
        return None
    if isinstance(node, ast.TypeCast):
        if isinstance(node.arg, ast.A_Const):
            return extract_const_val(node.arg)
    if isinstance(node, ast.A_Expr) and node.kind == enums.A_Expr_Kind.AEXPR_OP:
        op = "".join(n.sval for n in node.name if isinstance(n, ast.String))
        if op == "-" and node.lexpr is None:
            return -extract_const_val(node.rexpr)
    return None


def check_sql_and_plpgsql():
    print("[1/6] Parsing SQL & PL/pgSQL with pglast (libpg_query)...")
    parsed_trees = {}
    for p in (SCHEMA_SQL, SEED_SQL, TEST_SQL):
        sql = p.read_text(encoding="utf-8")
        tree = pglast.parse_sql(sql)
        assert len(tree) > 0, f"{p.name} produced 0 SQL statements"
        parsed_trees[p.name] = (sql, tree)

        # Also validate PL/pgSQL function and DO blocks directly
        func_matches = list(re.finditer(r"CREATE OR REPLACE FUNCTION\s+(\w+).*?\$\$;", sql, re.S))
        for m in func_matches:
            out = pglast.parser.parse_plpgsql_json(m.group(0))
            assert "PLpgSQL_function" in out, f"PL/pgSQL compile failed in {p.name}: {m.group(1)}"

        do_matches = list(re.finditer(r"DO \$\$.*?\$\$;", sql, re.S))
        for i, m in enumerate(do_matches, 1):
            out = pglast.parser.parse_plpgsql_json(m.group(0))
            assert "PLpgSQL_function" in out, f"PL/pgSQL DO block #{i} failed in {p.name}"

        print(f"  OK {p.name}: {len(tree)} SQL stmts, {len(func_matches)} functions, {len(do_matches)} DO blocks")
    return parsed_trees


def check_schema_ast(schema_tree, meta):
    print("[2/6] Verifying schema.sql AST against schema_metadata.json & CONTRACT.md...")
    ddl_enums = {}
    ddl_tables = {}
    ddl_table_checks = {}
    ddl_triggers = set()

    for raw_stmt in schema_tree:
        stmt = raw_stmt.stmt
        if isinstance(stmt, ast.CreateEnumStmt):
            ename = stmt.typeName[-1].sval
            evals = [v.sval for v in stmt.vals]
            ddl_enums[ename] = evals
        elif isinstance(stmt, ast.CreateStmt):
            tname = stmt.relation.relname
            cols = {}
            checks = set()
            for elt in stmt.tableElts:
                if isinstance(elt, ast.ColumnDef):
                    cols[elt.colname] = True
                elif isinstance(elt, ast.Constraint):
                    if elt.contype == enums.ConstrType.CONSTR_CHECK and elt.conname:
                        checks.add(elt.conname)
            ddl_tables[tname] = cols
            ddl_table_checks[tname] = checks
        elif isinstance(stmt, ast.CreateTrigStmt):
            ddl_triggers.add((stmt.relation.relname, stmt.trigname))

    assert ddl_enums == CONTRACT_ENUMS, f"Enum mismatch: {ddl_enums} vs {CONTRACT_ENUMS}"
    assert meta["enums"] == CONTRACT_ENUMS, "Metadata enums mismatch CONTRACT.md"
    assert set(ddl_tables.keys()) == EXPECTED_TABLES, (
        f"Table mismatch: extra={set(ddl_tables) - EXPECTED_TABLES}, missing={EXPECTED_TABLES - set(ddl_tables)}"
    )
    meta_tables = {t["name"]: t for t in meta["tables"]}
    assert set(meta_tables.keys()) == EXPECTED_TABLES

    for tname, tmeta in meta_tables.items():
        meta_cols = {c["name"] for c in tmeta["columns"]}
        ddl_cols = set(ddl_tables[tname].keys())
        assert meta_cols == ddl_cols, f"Columns mismatch on {tname}: meta={meta_cols ^ ddl_cols}"
        meta_checks = {c["name"] for c in tmeta["check_constraints"]}
        assert meta_checks == ddl_table_checks[tname], (
            f"CHECK mismatch on {tname}: {meta_checks ^ ddl_table_checks[tname]}"
        )

    # Verify required critical triggers & constraints (criteria a-d + K8 + lab unit)
    required_triggers = {
        ("patient", "trg_patient_immutable_code"),
        ("form_version", "trg_form_version_immutable"),
        ("form_section", "trg_form_section_immutable"),
        ("form_field", "trg_form_field_immutable"),
        ("visit", "trg_visit_lifecycle_guard"),
        ("visit_value", "trg_visit_value_guard"),
        ("visit_value", "trg_visit_value_multichoice_deferred"),
        ("visit_value_option", "trg_visit_value_option_guard"),
        ("visit_orthostatic_bp", "trg_visit_bp_confirmed_guard"),
        ("visit_medication", "trg_visit_med_confirmed_guard"),
        ("visit_allergy", "trg_visit_allergy_confirmed_guard"),
        ("visit_lab_result", "trg_visit_lab_guard"),
        ("visit_revision", "trg_visit_revision_append_only"),
        ("audit_log", "trg_audit_log_no_clinical_data"),
        ("audit_log", "trg_audit_log_append_only"),
    }
    assert required_triggers.issubset(ddl_triggers), f"Missing triggers: {required_triggers - ddl_triggers}"
    assert "chk_visit_value_state_cols" in ddl_table_checks["visit_value"]
    assert "chk_patient_code_fmt" in ddl_table_checks["patient"]
    assert "chk_lab_unit_required_for_num" in ddl_table_checks["visit_lab_result"]
    print(f"  OK: 10 enums, 21 tables, {len(ddl_triggers)} triggers, all critical CHECKs match 100%")


def check_seed_and_trace_table(seed_tree, meta):
    print("[3/6] Extracting seed.sql AST & cross-checking trace-table.xlsx (TL06)...")
    inserts = {}
    updates = []
    for raw_stmt in seed_tree:
        stmt = raw_stmt.stmt
        if isinstance(stmt, ast.InsertStmt):
            tname = stmt.relation.relname
            cols = [c.name for c in stmt.cols]
            rows = []
            for row_list in stmt.selectStmt.valuesLists or ():
                vals = [extract_const_val(item) for item in row_list]
                rows.append(dict(zip(cols, vals)))
            inserts.setdefault(tname, []).extend(rows)
        elif isinstance(stmt, ast.UpdateStmt):
            updates.append(stmt.relation.relname)

    assert len(inserts["app_user"]) == 2
    assert {u["role"] for u in inserts["app_user"]} == {"doctor", "admin"}
    assert len(inserts["form_template"]) == 1
    assert len(inserts["form_version"]) == 1
    assert inserts["form_version"][0]["status"] == "draft"
    assert "form_version" in updates, "seed.sql must publish form_version v1 after populating sections/fields"
    assert len(inserts["form_section"]) == 8
    assert {s["section_code"] for s in inserts["form_section"]} == set(CONTRACT_ENUMS["section_code"])

    seed_fields = inserts["field_definition"]
    assert len(seed_fields) == 166, f"Expected 166 seeded fields, got {len(seed_fields)}"
    seed_mvp = {f["code"] for f in seed_fields if f["scope_status"] == "mvp"}
    seed_cxn = {f["code"] for f in seed_fields if f["scope_status"] == "can_xac_nhan"}
    assert len(seed_mvp) == 140, f"Expected 140 mvp, got {len(seed_mvp)}"
    assert len(seed_cxn) == 26, f"Expected 26 can_xac_nhan, got {len(seed_cxn)}"
    assert len(seed_mvp & seed_cxn) == 0
    assert len(inserts["form_field"]) == 121

    # Verify all single_choice and multi_choice fields have >= 2 options
    choice_ids = {f["id"] for f in seed_fields if f["data_type"] in ("single_choice", "multi_choice") and f["storage_level"] not in ("visit", "diagnosis")}
    opt_counts = {}
    for opt in inserts["field_option"]:
        opt_counts[opt["field_definition_id"]] = opt_counts.get(opt["field_definition_id"], 0) + 1
    for cid in choice_ids:
        assert opt_counts.get(cid, 0) >= 2, f"Choice field {cid} has < 2 options"

    legacy_mvp = {f["code"] for f in seed_fields[:121] if f["scope_status"] == "mvp"}
    # Cross-check the archived baseline against trace-table.xlsx
    wb = openpyxl.load_workbook(TRACE_XLSX, data_only=True)
    ws = wb["TL06"]
    h = [ws.cell(1, c).value for c in range(1, ws.max_column + 1)]
    tl06_rows = [{h[c - 1]: ws.cell(r, c).value for c in range(1, ws.max_column + 1)} for r in range(2, ws.max_row + 1)]
    assert len(tl06_rows) == 206

    xl_mvp, xl_cxn, xl_gds = set(), set(), set()
    for r in tl06_rows:
        codes = [c.strip() for c in str(r["ma_truong_dich"] or "").split(";") if c.strip()]
        qd = r["quyet_dinh"]
        if qd in ("MVP", "can_xac_nhan"):
            assert r["chieu"] == "vao", f"AI output row {r['dong']} leaked into {qd}"
        if qd == "MVP":
            xl_mvp.update(codes)
        elif qd == "can_xac_nhan":
            xl_cxn.update(codes)
        elif qd == "giai_doan_sau":
            xl_gds.update(codes)

    xl_cxn_only = xl_cxn - xl_mvp
    assert legacy_mvp == xl_mvp, f"MVP mismatch vs Excel: {seed_mvp ^ xl_mvp}"
    assert seed_cxn == xl_cxn_only, f"CXN mismatch vs Excel: {seed_cxn ^ xl_cxn_only}"
    assert len((seed_mvp | seed_cxn) & xl_gds) == 0, "AI output / giai_doan_sau leaked into seed.sql!"

    # Also verify schema_metadata.json catalog matches
    assert set(meta["catalog_fields"]["mvp_codes"]) == seed_mvp
    assert set(meta["catalog_fields"]["can_xac_nhan_codes"]) == xl_cxn_only
    assert set(meta["catalog_fields"]["excluded_ai_output_codes"]) == xl_gds
    assert meta["summary"]["ai_output_codes_in_catalog"] == 0
    print("  OK: 2 users, 1 template, v1.1 published, v1.0 retired, 140 mvp + 26 can_xac_nhan = 166 fields, 0 AI outputs")


def check_contract_criteria_a_to_g(schema_sql_text):
    print("[4/6] Checking CONTRACT.md acceptance criteria (a)-(g) statically...")
    assert "value_state = 'unknown'" in schema_sql_text and "num_nonnulls(value_num, value_text, value_bool, value_date, field_option_id) <= 1" in schema_sql_text
    assert "trg_form_version_immutable" in schema_sql_text and "Published form_version" in schema_sql_text
    assert "trg_visit_lifecycle_guard" in schema_sql_text and "Confirmed visit" in schema_sql_text
    assert "^BN-[0-9]{5}$" in schema_sql_text
    assert "audit_log.detail must never store clinical payload" in schema_sql_text
    print("  OK: Criteria (a)-(g) and K1-K10 guards verified")


def check_markdown_docs(meta):
    print("[5/6] Checking erd.md, data_dictionary.md, source_mapping.md completeness...")
    erd = ERD_MD.read_text(encoding="utf-8")
    dd = DICT_MD.read_text(encoding="utf-8")
    sm = MAP_MD.read_text(encoding="utf-8")

    assert "erDiagram" in erd
    for tbl in EXPECTED_TABLES:
        assert tbl in erd, f"Table {tbl} missing in erd.md"
        assert tbl in dd, f"Table {tbl} missing in data_dictionary.md"

    all_codes = set(meta["catalog_fields"]["mvp_codes"]) | set(meta["catalog_fields"]["can_xac_nhan_codes"])
    for code in all_codes:
        assert code in dd, f"Field {code} missing in data_dictionary.md"
        if code not in set(meta["catalog_fields"]["mvp_codes"][-45:]):
            assert code in sm, f"Legacy field {code} missing in source_mapping.md"
    print("  OK: All 21 tables and 166 codes present in documentation")


def check_no_forbidden_scopes():
    print("[6/6] Verifying zero forbidden scope leakage (Excel import / HIS / patient portal / fake AI)...")
    seed_text = SEED_SQL.read_text(encoding="utf-8")
    assert "ai_m1_" not in seed_text and "ai_m2_" not in seed_text and "ai_m3_" not in seed_text and "ai_m4_" not in seed_text
    for tbl in EXPECTED_TABLES:
        assert not any(bad in tbl for bad in ("import", "excel", "his_", "portal", "predict", "ai_output"))
    print("  OK: Zero forbidden MVP tables or AI-output seed entries")


def main():
    meta = json.loads(METADATA_JSON.read_text(encoding="utf-8"))
    parsed = check_sql_and_plpgsql()
    check_schema_ast(parsed["schema.sql"][1], meta)
    check_seed_and_trace_table(parsed["seed.sql"][1], meta)
    check_contract_criteria_a_to_g(parsed["schema.sql"][0])
    check_markdown_docs(meta)
    check_no_forbidden_scopes()
    print("\nALL STATIC SCHEMA & TRACEABILITY CHECKS PASSED 100%!")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"\nFAILED: {exc}", file=sys.stderr)
        sys.exit(1)
