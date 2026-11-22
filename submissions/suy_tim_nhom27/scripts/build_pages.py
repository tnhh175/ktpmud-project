#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
build_pages.py — Xây dựng gói tĩnh cho GitHub Pages (chế độ ngoại tuyến trên trình duyệt).

Đầu ra gồm:
  - index.html, styles.css, api-client.js, static-runtime.js, app.js, catalog-seed.json
  - config.js với window.APP_CONFIG = { mode: 'static', apiBase: '' }
  - .nojekyll
  - docs/index.html (tổng quan kiến trúc Clinical Blue: Layered, ERD 19 bảng, Class Diagram, 3 Sequence Diagram dạng SVG nhúng + mã nguồn Mermaid)

Mọi đường dẫn tài nguyên đều dùng đường dẫn tương đối để chạy mượt dưới subpath `/ktpmud-project/`.
"""

from __future__ import annotations

import argparse
import html
import re
import shutil
import sys
from pathlib import Path
from typing import Any

import yaml

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

SUBMISSION_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_WEB_SRC = SUBMISSION_ROOT / "web"
DEFAULT_OPENAPI = SUBMISSION_ROOT / "api" / "openapi.yaml"
DEFAULT_ARCH_MD = SUBMISSION_ROOT / "docs" / "architecture" / "architecture-uml.md"
DEFAULT_OUT = SUBMISSION_ROOT / ".dist-pages"

WEB_ASSETS = [
    "index.html",
    "styles.css",
    "api-client.js",
    "static-runtime.js",
    "app.js",
    "catalog-seed.json",
]

FAVICON_DATA_URI = (
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E"
    "%3Crect width='32' height='32' rx='6' fill='%231D4ED8'/%3E"
    "%3Cpath d='M6 16h5l2.5-6 4 12 2.5-6h6' fill='none' stroke='%23FFFFFF' "
    "stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E"
)

STATIC_CONFIG_JS = """'use strict';

window.APP_CONFIG = {
  mode: 'static',
  apiBase: ''
};
"""


def extract_mermaid_blocks(arch_md_path: Path) -> list[str]:
    if not arch_md_path.exists():
        return []
    text = arch_md_path.read_text(encoding="utf-8")
    blocks = re.findall(r"```mermaid\s*\n(.*?)```", text, flags=re.DOTALL)
    return [b.strip() for b in blocks]


def svg_layered_architecture(operation_count: int) -> str:
    return """<svg viewBox="0 0 920 390" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Sơ đồ Kiến trúc Phân lớp Tổng thể Clinical Blue">
  <rect x="0" y="0" width="920" height="390" rx="10" fill="#F8FAFC"/>
  <rect x="20" y="18" width="880" height="68" rx="8" fill="#EFF6FF" stroke="#1D4ED8" stroke-width="1.5"/>
  <text x="36" y="40" font-size="13" font-weight="700" fill="#1E3A8A">Tầng Giao diện Web SPA (Clinical Blue · 8 Màn hình M1–M8)</text>
  <rect x="36" y="48" width="240" height="28" rx="5" fill="#DBEAFE" stroke="#2563EB"/>
  <text x="48" y="66" font-size="11.5" font-weight="600" fill="#1E3A8A">M1: Đăng nhập chung (Server cấp role)</text>
  <rect x="292" y="48" width="290" height="28" rx="5" fill="#DBEAFE" stroke="#2563EB"/>
  <text x="304" y="66" font-size="11.5" font-weight="600" fill="#1E3A8A">Luồng Bác sĩ (M2–M5): Hồ sơ · 8 nhóm · Xác nhận</text>
  <rect x="598" y="48" width="286" height="28" rx="5" fill="#DBEAFE" stroke="#2563EB"/>
  <text x="610" y="66" font-size="11.5" font-weight="600" fill="#1E3A8A">Luồng Admin (M6–M8): Tài khoản · Form · Audit</text>

  <line x1="460" y1="86" x2="460" y2="106" stroke="#1D4ED8" stroke-width="2"/>
  <polygon points="455,102 465,102 460,110" fill="#1D4ED8"/>

  <rect x="20" y="110" width="880" height="64" rx="8" fill="#DBEAFE" stroke="#1D4ED8" stroke-width="1.5"/>
  <text x="36" y="132" font-size="13" font-weight="700" fill="#1E3A8A">Tầng API Gateway &amp; Bảo mật (/api/v1 · OpenAPI 3.1.0 · __OP_COUNT__ operationId)</text>
  <rect x="36" y="140" width="260" height="26" rx="5" fill="#FFFFFF" stroke="#1D4ED8"/>
  <text x="48" y="157" font-size="11" fill="#0F172A">JWT Bearer + Refresh Token Hash</text>
  <rect x="312" y="140" width="284" height="26" rx="5" fill="#FFFFFF" stroke="#1D4ED8"/>
  <text x="324" y="157" font-size="11" fill="#0F172A">RBAC Guard K8 (Admin ≠ Bệnh án -> 403)</text>
  <rect x="612" y="140" width="272" height="26" rx="5" fill="#FFFFFF" stroke="#1D4ED8"/>
  <text x="624" y="157" font-size="11" fill="#0F172A">ETag / If-Match (409) · RFC 9457 (422)</text>

  <line x1="460" y1="174" x2="460" y2="194" stroke="#1D4ED8" stroke-width="2"/>
  <polygon points="455,190 465,190 460,198" fill="#1D4ED8"/>

  <rect x="20" y="198" width="880" height="72" rx="8" fill="#EFF6FF" stroke="#1D4ED8" stroke-width="1.5"/>
  <text x="36" y="218" font-size="13" font-weight="700" fill="#1E3A8A">Tầng Dịch vụ Nghiệp vụ (Domain Services — Chốt K1–K10)</text>
  <rect x="36" y="228" width="155" height="32" rx="5" fill="#DBEAFE" stroke="#1D4ED8"/>
  <text x="46" y="248" font-size="11" font-weight="600" fill="#1E3A8A">AuthService</text>
  <rect x="203" y="228" width="165" height="32" rx="5" fill="#DBEAFE" stroke="#1D4ED8"/>
  <text x="213" y="248" font-size="11" font-weight="600" fill="#1E3A8A">PatientService (BN-xxxxx)</text>
  <rect x="380" y="228" width="180" height="32" rx="5" fill="#DBEAFE" stroke="#1D4ED8"/>
  <text x="390" y="248" font-size="11" font-weight="600" fill="#1E3A8A">VisitService &amp; Validator</text>
  <rect x="572" y="228" width="155" height="32" rx="5" fill="#DBEAFE" stroke="#1D4ED8"/>
  <text x="582" y="248" font-size="11" font-weight="600" fill="#1E3A8A">FormVersionService</text>
  <rect x="739" y="228" width="145" height="32" rx="5" fill="#DBEAFE" stroke="#1D4ED8"/>
  <text x="749" y="248" font-size="11" font-weight="600" fill="#1E3A8A">User &amp; AuditService</text>

  <line x1="300" y1="270" x2="300" y2="294" stroke="#1D4ED8" stroke-width="2"/>
  <polygon points="295,290 305,290 300,298" fill="#1D4ED8"/>
  <line x1="720" y1="270" x2="720" y2="294" stroke="#64748B" stroke-width="1.5" stroke-dasharray="5,4"/>
  <polygon points="715,290 725,290 720,298" fill="#64748B"/>

  <rect x="20" y="298" width="540" height="74" rx="8" fill="#0F172A" stroke="#1D4ED8" stroke-width="1.5"/>
  <text x="36" y="320" font-size="13" font-weight="700" fill="#FFFFFF">PostgreSQL (19 Bảng Chuẩn 3NF · 10 Enum · 19 Triggers · 121 Trường)</text>
  <text x="36" y="340" font-size="11" fill="#CBD5E1">IAM &amp; Audit: app_user, user_session, audit_log (0 PHI / 0 mật khẩu)</text>
  <text x="36" y="357" font-size="11" fill="#93C5FD">Metadata + Clinical: form_* (K4 bất biến), patient (K10), visit, visit_revision, visit_value (K2), 4 bảng lặp (K6)</text>

  <rect x="580" y="298" width="320" height="74" rx="8" fill="#FFFFFF" stroke="#64748B" stroke-width="1.5" stroke-dasharray="6,4"/>
  <text x="596" y="320" font-size="12.5" font-weight="700" fill="#334155">Tích hợp AI Giai đoạn sau (Chỉ đọc Hợp đồng)</text>
  <text x="596" y="339" font-size="11" fill="#475569">GET /api/v1/visits/{visitId}/ai-input (chỉ lượt confirmed)</text>
  <text x="596" y="356" font-size="10.5" fill="#1D4ED8">ai_diagnosis · ai_lab_test · ai_treatment · ai_medsafety</text>
</svg>""".replace("__OP_COUNT__", str(operation_count))


def svg_erd_19_tables() -> str:
    return """<svg viewBox="0 0 960 520" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Sơ đồ ERD 19 Bảng Chuẩn 3NF">
  <rect x="0" y="0" width="960" height="520" rx="10" fill="#F8FAFC"/>
  <!-- Group 1: IAM & Audit -->
  <rect x="16" y="16" width="292" height="196" rx="8" fill="#EFF6FF" stroke="#1D4ED8" stroke-width="1.5"/>
  <text x="28" y="36" font-size="12.5" font-weight="700" fill="#1E3A8A">1. Định danh &amp; Kiểm toán (3 bảng)</text>
  <rect x="28" y="48" width="268" height="46" rx="5" fill="#FFFFFF" stroke="#1D4ED8"/>
  <text x="36" y="65" font-size="11.5" font-weight="700" fill="#0F172A">app_user</text>
  <text x="36" y="82" font-size="10.5" fill="#475569">id PK · username UK · role · is_active · row_version</text>
  <rect x="28" y="102" width="268" height="46" rx="5" fill="#FFFFFF" stroke="#1D4ED8"/>
  <text x="36" y="119" font-size="11.5" font-weight="700" fill="#0F172A">user_session</text>
  <text x="36" y="136" font-size="10.5" fill="#475569">id PK · user_id FK · refresh_token_hash · revoked_at</text>
  <rect x="28" y="156" width="268" height="46" rx="5" fill="#FFFFFF" stroke="#1D4ED8"/>
  <text x="36" y="173" font-size="11.5" font-weight="700" fill="#0F172A">audit_log (append-only, K8)</text>
  <text x="36" y="190" font-size="10.5" fill="#475569">id PK · actor_user_id FK · action · outcome · detail</text>

  <!-- Group 2: Metadata Form Catalog -->
  <rect x="328" y="16" width="616" height="196" rx="8" fill="#EFF6FF" stroke="#1D4ED8" stroke-width="1.5"/>
  <text x="340" y="36" font-size="12.5" font-weight="700" fill="#1E3A8A">2. Danh mục Biểu mẫu &amp; Phiên bản Bất biến K3/K4 (7 bảng)</text>
  <rect x="340" y="48" width="185" height="46" rx="5" fill="#FFFFFF" stroke="#1D4ED8"/>
  <text x="348" y="65" font-size="11.5" font-weight="700" fill="#0F172A">form_template</text>
  <text x="348" y="82" font-size="10.5" fill="#475569">id PK · code UK · name</text>
  <rect x="538" y="48" width="195" height="46" rx="5" fill="#DBEAFE" stroke="#1D4ED8" stroke-width="1.5"/>
  <text x="546" y="65" font-size="11.5" font-weight="700" fill="#1E3A8A">form_version (K4 Lock)</text>
  <text x="546" y="82" font-size="10.5" fill="#1E3A8A">id PK · version_no · status · row_version</text>
  <rect x="746" y="48" width="185" height="46" rx="5" fill="#FFFFFF" stroke="#1D4ED8"/>
  <text x="754" y="65" font-size="11.5" font-weight="700" fill="#0F172A">form_section (1..8)</text>
  <text x="754" y="82" font-size="10.5" fill="#475569">id PK · section_code · title_vi</text>

  <rect x="340" y="110" width="215" height="88" rx="5" fill="#FFFFFF" stroke="#1D4ED8"/>
  <text x="348" y="128" font-size="11.5" font-weight="700" fill="#0F172A">field_definition (121 mã)</text>
  <text x="348" y="145" font-size="10.5" fill="#475569">id PK · code UK · data_type</text>
  <text x="348" y="161" font-size="10.5" fill="#475569">scope_status (95 mvp + 26)</text>
  <text x="348" y="177" font-size="10.5" fill="#475569">storage_level · min/max · unit</text>

  <rect x="568" y="110" width="180" height="88" rx="5" fill="#FFFFFF" stroke="#1D4ED8"/>
  <text x="576" y="128" font-size="11.5" font-weight="700" fill="#0F172A">form_field</text>
  <text x="576" y="145" font-size="10.5" fill="#475569">form_version_id FK</text>
  <text x="576" y="161" font-size="10.5" fill="#475569">form_section_id FK</text>
  <text x="576" y="177" font-size="10.5" fill="#475569">required_for_confirm · is_visible</text>

  <rect x="760" y="110" width="171" height="40" rx="5" fill="#FFFFFF" stroke="#1D4ED8"/>
  <text x="768" y="127" font-size="11" font-weight="700" fill="#0F172A">field_option</text>
  <text x="768" y="142" font-size="10" fill="#475569">id PK · field_def_id FK · code</text>
  <rect x="760" y="158" width="171" height="40" rx="5" fill="#FFFFFF" stroke="#1D4ED8"/>
  <text x="768" y="175" font-size="11" font-weight="700" fill="#0F172A">field_ai_module (Tầng 4)</text>
  <text x="768" y="190" font-size="10" fill="#475569">field_def_id · ai_module_code</text>

  <!-- Group 3: Clinical Records & 4 Repeating Tables -->
  <rect x="16" y="232" width="928" height="272" rx="8" fill="#EFF6FF" stroke="#1D4ED8" stroke-width="1.5"/>
  <text x="28" y="252" font-size="12.5" font-weight="700" fill="#1E3A8A">3. Hồ sơ Bệnh nhân, Lượt khám &amp; 4 Bảng Lặp Lâm sàng K2/K5/K6/K7/K10 (9 bảng)</text>

  <rect x="28" y="266" width="215" height="98" rx="5" fill="#DBEAFE" stroke="#1D4ED8" stroke-width="1.5"/>
  <text x="36" y="284" font-size="12" font-weight="700" fill="#1E3A8A">patient (K10)</text>
  <text x="36" y="302" font-size="10.5" fill="#0F172A">id UUID PK</text>
  <text x="36" y="318" font-size="10.5" fill="#1E3A8A">patient_code UK (BN-\\d{5})</text>
  <text x="36" y="334" font-size="10.5" fill="#475569">full_name · sex · birth_date|year|age</text>
  <text x="36" y="350" font-size="10.5" fill="#475569">row_version · created_by FK</text>

  <line x1="243" y1="315" x2="275" y2="315" stroke="#1D4ED8" stroke-width="2"/>
  <text x="247" y="308" font-size="10" font-weight="700" fill="#1D4ED8">1..*</text>

  <rect x="275" y="266" width="248" height="98" rx="5" fill="#DBEAFE" stroke="#1D4ED8" stroke-width="1.5"/>
  <text x="283" y="284" font-size="12" font-weight="700" fill="#1E3A8A">visit (K3/K5)</text>
  <text x="283" y="302" font-size="10.5" fill="#0F172A">id PK · visit_code UK · patient_id FK</text>
  <text x="283" y="318" font-size="10.5" fill="#1E3A8A">form_version_id FK (bất biến)</text>
  <text x="283" y="334" font-size="10.5" fill="#475569">status (draft|confirmed) · row_version</text>
  <text x="283" y="350" font-size="10.5" fill="#475569">current_revision_no · confirmed_at/by</text>

  <line x1="523" y1="295" x2="555" y2="295" stroke="#1D4ED8" stroke-width="1.5"/>
  <rect x="555" y="266" width="180" height="98" rx="5" fill="#FFFFFF" stroke="#1D4ED8"/>
  <text x="563" y="284" font-size="11.5" font-weight="700" fill="#0F172A">visit_revision (K5)</text>
  <text x="563" y="302" font-size="10.5" fill="#475569">id PK · visit_id FK</text>
  <text x="563" y="318" font-size="10.5" fill="#475569">revision_no · revision_type</text>
  <text x="563" y="334" font-size="10.5" fill="#475569">change_reason · snapshot_data</text>
  <text x="563" y="350" font-size="10.5" fill="#475569">(append-only trigger)</text>

  <rect x="748" y="266" width="184" height="46" rx="5" fill="#FFFFFF" stroke="#1D4ED8"/>
  <text x="756" y="283" font-size="11" font-weight="700" fill="#0F172A">visit_value (CHECK K2)</text>
  <text x="756" y="299" font-size="10" fill="#475569">value_state (answered|unknown)</text>
  <rect x="748" y="318" width="184" height="46" rx="5" fill="#FFFFFF" stroke="#1D4ED8"/>
  <text x="756" y="335" font-size="11" font-weight="700" fill="#0F172A">visit_value_option (3NF)</text>
  <text x="756" y="351" font-size="10" fill="#475569">multi_choice composite FK</text>

  <!-- 4 Repeating Tables Row -->
  <rect x="28" y="384" width="215" height="104" rx="5" fill="#FFFFFF" stroke="#2563EB" stroke-width="1.5"/>
  <text x="36" y="403" font-size="11.5" font-weight="700" fill="#1E3A8A">visit_orthostatic_bp (K6)</text>
  <text x="36" y="421" font-size="10.5" fill="#475569">visit_id FK · position (bp_position)</text>
  <text x="36" y="438" font-size="10.5" fill="#475569">systolic &gt; diastolic · heart_rate</text>
  <text x="36" y="455" font-size="10.5" fill="#475569">minute_after · measured_at</text>
  <text x="36" y="472" font-size="10" fill="#1D4ED8">Bảng lặp HA nhiều tư thế</text>

  <rect x="256" y="384" width="215" height="104" rx="5" fill="#FFFFFF" stroke="#2563EB" stroke-width="1.5"/>
  <text x="264" y="403" font-size="11.5" font-weight="700" fill="#1E3A8A">visit_medication (K6)</text>
  <text x="264" y="421" font-size="10.5" fill="#475569">visit_id FK · medication_group</text>
  <text x="264" y="438" font-size="10.5" fill="#475569">drug_name · dose &gt; 0 · unit</text>
  <text x="264" y="455" font-size="10.5" fill="#475569">frequency · route · status</text>
  <text x="264" y="472" font-size="10" fill="#1D4ED8">Thuốc kê đơn + OTC/TPCN/YHCT</text>

  <rect x="484" y="384" width="215" height="104" rx="5" fill="#FFFFFF" stroke="#2563EB" stroke-width="1.5"/>
  <text x="492" y="403" font-size="11.5" font-weight="700" fill="#1E3A8A">visit_allergy (K6)</text>
  <text x="492" y="421" font-size="10.5" fill="#475569">visit_id FK · kind (allergy|adr)</text>
  <text x="492" y="438" font-size="10.5" fill="#475569">agent_category (contrast_media)</text>
  <text x="492" y="455" font-size="10.5" fill="#475569">allergen · reaction · severity</text>
  <text x="492" y="472" font-size="10" fill="#1D4ED8">Dị ứng, ADR &amp; thuốc cản quang</text>

  <rect x="712" y="384" width="220" height="104" rx="5" fill="#FFFFFF" stroke="#2563EB" stroke-width="1.5"/>
  <text x="720" y="403" font-size="11.5" font-weight="700" fill="#1E3A8A">visit_lab_result (K6/K7)</text>
  <text x="720" y="421" font-size="10.5" fill="#475569">visit_id FK · lab_code FK</text>
  <text x="720" y="438" font-size="10.5" fill="#475569">value_num | value_text · unit</text>
  <text x="720" y="455" font-size="10.5" fill="#475569">measured_at · lab_subtype</text>
  <text x="720" y="472" font-size="10" fill="#1D4ED8">Tách BNP≠NT-proBNP, Cr≠eGFR</text>
</svg>"""


def svg_class_diagram() -> str:
    return """<svg viewBox="0 0 960 400" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Biểu đồ Lớp UML Miền Nghiệp vụ">
  <rect x="0" y="0" width="960" height="400" rx="10" fill="#F8FAFC"/>
  <rect x="20" y="20" width="210" height="158" rx="6" fill="#FFFFFF" stroke="#1D4ED8" stroke-width="1.5"/>
  <rect x="20" y="20" width="210" height="30" rx="6" fill="#DBEAFE" stroke="#1D4ED8"/>
  <text x="30" y="39" font-size="12" font-weight="700" fill="#1E3A8A">AppUser &lt;&lt;Aggregate&gt;&gt;</text>
  <text x="30" y="68" font-size="10.5" fill="#334155">- id, username, role, isActive</text>
  <text x="30" y="84" font-size="10.5" fill="#334155">- rowVersion (C4)</text>
  <line x1="20" y1="94" x2="230" y2="94" stroke="#E2E8F0"/>
  <text x="30" y="112" font-size="10.5" fill="#1D4ED8">+ authenticate(rawPwd)</text>
  <text x="30" y="128" font-size="10.5" fill="#1D4ED8">+ canAccessClinicalData()</text>
  <text x="30" y="144" font-size="10.5" fill="#1D4ED8">+ previewPermissions(role)</text>
  <text x="30" y="160" font-size="10.5" fill="#1D4ED8">+ deactivate(reason)</text>

  <rect x="255" y="20" width="225" height="158" rx="6" fill="#FFFFFF" stroke="#1D4ED8" stroke-width="1.5"/>
  <rect x="255" y="20" width="225" height="30" rx="6" fill="#DBEAFE" stroke="#1D4ED8"/>
  <text x="265" y="39" font-size="12" font-weight="700" fill="#1E3A8A">FormVersion &lt;&lt;Aggregate&gt;&gt;</text>
  <text x="265" y="68" font-size="10.5" fill="#334155">- id, versionNo, status, rowVersion</text>
  <text x="265" y="84" font-size="10.5" fill="#334155">- sections[1..8], fields[]</text>
  <line x1="255" y1="94" x2="480" y2="94" stroke="#E2E8F0"/>
  <text x="265" y="112" font-size="10.5" fill="#1D4ED8">+ assertDraftEditable() [K4]</text>
  <text x="265" y="128" font-size="10.5" fill="#1D4ED8">+ renderPreview()</text>
  <text x="265" y="144" font-size="10.5" fill="#1D4ED8">+ diffAgainst(base)</text>
  <text x="265" y="160" font-size="10.5" fill="#1D4ED8">+ publish(admin, expectedRV)</text>

  <rect x="505" y="20" width="205" height="158" rx="6" fill="#FFFFFF" stroke="#1D4ED8" stroke-width="1.5"/>
  <rect x="505" y="20" width="205" height="30" rx="6" fill="#DBEAFE" stroke="#1D4ED8"/>
  <text x="515" y="39" font-size="12" font-weight="700" fill="#1E3A8A">Patient &lt;&lt;Aggregate&gt;&gt;</text>
  <text x="515" y="68" font-size="10.5" fill="#334155">- id, patientCode (BN-xxxxx)</text>
  <text x="515" y="84" font-size="10.5" fill="#334155">- sex, birthDate|Year|Age</text>
  <line x1="505" y1="94" x2="710" y2="94" stroke="#E2E8F0"/>
  <text x="515" y="112" font-size="10.5" fill="#1D4ED8">+ calculateAgeAt(visitDate)</text>
  <text x="515" y="128" font-size="10.5" fill="#1D4ED8">+ updateDemographics()</text>
  <text x="515" y="144" font-size="10.5" fill="#1D4ED8">+ openVisit(publishedVer)</text>

  <rect x="735" y="20" width="205" height="158" rx="6" fill="#FFFFFF" stroke="#1D4ED8" stroke-width="1.5"/>
  <rect x="735" y="20" width="205" height="30" rx="6" fill="#DBEAFE" stroke="#1D4ED8"/>
  <text x="745" y="39" font-size="12" font-weight="700" fill="#1E3A8A">Visit &lt;&lt;Aggregate&gt;&gt;</text>
  <text x="745" y="68" font-size="10.5" fill="#334155">- id, visitCode, status, rowVersion</text>
  <text x="745" y="84" font-size="10.5" fill="#334155">- formVersionId, revisionNo</text>
  <line x1="735" y1="94" x2="940" y2="94" stroke="#E2E8F0"/>
  <text x="745" y="112" font-size="10.5" fill="#1D4ED8">+ saveDraft(payload, rv)</text>
  <text x="745" y="128" font-size="10.5" fill="#1D4ED8">+ buildReviewSummary()</text>
  <text x="745" y="144" font-size="10.5" fill="#1D4ED8">+ confirm() / createRevision()</text>
  <text x="745" y="160" font-size="10.5" fill="#1D4ED8">+ exportAiInput()</text>

  <!-- Entities & Value Objects -->
  <rect x="20" y="210" width="295" height="168" rx="6" fill="#EFF6FF" stroke="#2563EB"/>
  <text x="32" y="232" font-size="12" font-weight="700" fill="#1E3A8A">Thực thể con gắn Visit &amp; Catalog (15 lớp)</text>
  <text x="32" y="254" font-size="11" fill="#334155">• UserSession, AuditLog (IAM &amp; Kiểm toán)</text>
  <text x="32" y="274" font-size="11" fill="#334155">• FormTemplate, FormSection, FormField</text>
  <text x="32" y="294" font-size="11" fill="#334155">• FieldDefinition, FieldOption, FieldAiModule</text>
  <text x="32" y="314" font-size="11" fill="#334155">• VisitRevision (append-only snapshot)</text>
  <text x="32" y="334" font-size="11" fill="#334155">• VisitValue, VisitValueOption (CR-W1-01)</text>
  <text x="32" y="354" font-size="11" fill="#334155">• OrthostaticBp, Medication, Allergy, LabResult</text>

  <rect x="340" y="210" width="600" height="168" rx="6" fill="#FFFFFF" stroke="#1D4ED8" stroke-dasharray="6,4"/>
  <text x="354" y="232" font-size="12" font-weight="700" fill="#1E3A8A">3 Value Object Tính động (Không lưu bảng DB — Xuất trực tiếp qua API)</text>
  <rect x="354" y="246" width="184" height="116" rx="5" fill="#EFF6FF" stroke="#1D4ED8"/>
  <text x="362" y="266" font-size="11.5" font-weight="700" fill="#1E3A8A">AiInputPayload</text>
  <text x="362" y="284" font-size="10.5" fill="#334155">values: map&lt;code, val&gt;</text>
  <text x="362" y="300" font-size="10.5" fill="#334155">4 mảng lặp lâm sàng</text>
  <text x="362" y="316" font-size="10.5" fill="#334155">modules[4] readiness</text>
  <text x="362" y="336" font-size="10" fill="#1D4ED8">Bỏ ô trống, giữ 0/false</text>

  <rect x="550" y="246" width="184" height="116" rx="5" fill="#EFF6FF" stroke="#1D4ED8"/>
  <text x="558" y="266" font-size="11.5" font-weight="700" fill="#1E3A8A">VisitReviewResponse</text>
  <text x="558" y="284" font-size="10.5" fill="#334155">readinessTier, canConfirm</text>
  <text x="558" y="300" font-size="10.5" fill="#334155">sections[8] counts</text>
  <text x="558" y="316" font-size="10.5" fill="#334155">tier3ConfirmErrors[]</text>
  <text x="558" y="336" font-size="10" fill="#1D4ED8">tier4AiModules[] (K1)</text>

  <rect x="746" y="246" width="180" height="116" rx="5" fill="#EFF6FF" stroke="#1D4ED8"/>
  <text x="754" y="266" font-size="11.5" font-weight="700" fill="#1E3A8A">FormVersionDiff</text>
  <text x="754" y="284" font-size="10.5" fill="#334155">target vs base version</text>
  <text x="754" y="300" font-size="10.5" fill="#166534">+ addedFields[]</text>
  <text x="754" y="316" font-size="10.5" fill="#92400E">~ modifiedFields[]</text>
  <text x="754" y="332" font-size="10.5" fill="#991B1B">- removedFields[]</text>
</svg>"""


def svg_sequence(title: str, actors: list[str], steps: list[tuple[int, int, str, str]]) -> str:
    width = 920
    col_x = [80 + i * (760 // (len(actors) - 1)) for i in range(len(actors))]
    height = 100 + len(steps) * 44
    parts = [
        f'<svg viewBox="0 0 {width} {height}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="{html.escape(title)}">',
        f'<rect x="0" y="0" width="{width}" height="{height}" rx="10" fill="#F8FAFC"/>',
    ]
    for i, act in enumerate(actors):
        x = col_x[i]
        parts.append(f'<line x1="{x}" y1="54" x2="{x}" y2="{height - 20}" stroke="#93C5FD" stroke-width="1.5" stroke-dasharray="4,4"/>')
        parts.append(f'<rect x="{x - 68}" y="16" width="136" height="36" rx="6" fill="#DBEAFE" stroke="#1D4ED8" stroke-width="1.5"/>')
        parts.append(f'<text x="{x}" y="38" text-anchor="middle" font-size="11.5" font-weight="700" fill="#1E3A8A">{html.escape(act)}</text>')
    for idx, (frm, to, label, style) in enumerate(steps):
        y = 86 + idx * 44
        x1, x2 = col_x[frm], col_x[to]
        color = "#166534" if style == "ok" else ("#B91C1C" if style == "err" else "#1D4ED8")
        dash = ' stroke-dasharray="5,4"' if style in ("ret", "err") else ""
        parts.append(f'<line x1="{x1}" y1="{y}" x2="{x2}" y2="{y}" stroke="{color}" stroke-width="1.8"{dash}/>')
        if x2 > x1:
            parts.append(f'<polygon points="{x2 - 8},{y - 4} {x2 - 8},{y + 4} {x2},{y}" fill="{color}"/>')
        else:
            parts.append(f'<polygon points="{x2 + 8},{y - 4} {x2 + 8},{y + 4} {x2},{y}" fill="{color}"/>')
        mx = (x1 + x2) / 2
        parts.append(f'<rect x="{mx - 190}" y="{y - 21}" width="380" height="17" rx="3" fill="#FFFFFF" fill-opacity="0.92"/>')
        parts.append(f'<text x="{mx}" y="{y - 9}" text-anchor="middle" font-size="11" font-weight="600" fill="{color}">{idx + 1}. {html.escape(label)}</text>')
    parts.append("</svg>")
    return "\n".join(parts)


def build_arch_docs_html(mermaid_blocks: list[str], operation_count: int) -> str:
    seq1 = svg_sequence(
        "Sequence 1: Luồng Bác sĩ",
        ["Bác sĩ (UI)", "API & RBAC", "VisitService", "PostgreSQL"],
        [
            (0, 1, "POST /patients/{id}/visits [createVisit] (Bearer JWT)", "req"),
            (1, 3, "Kiểm role=doctor (K8) · Gắn cứng form_version published (K3)", "req"),
            (3, 0, "201 Created (Visit draft, ETag: \"1\") + GET /visits/{id}/form", "ret"),
            (0, 1, "PUT /visits/{id}/draft [saveVisitDraft] (If-Match: \"1\")", "req"),
            (1, 2, "Validate K2/K6/K7 -> 422 nếu sai miền, 409 nếu lệch ETag", "err"),
            (2, 3, "BEGIN; UPSERT visit_value + 4 bảng lặp; row_version=2; COMMIT", "ok"),
            (0, 2, "GET /visits/{id}/review -> Tách Tầng 3 và Tầng 4 AI (K1)", "req"),
            (0, 3, "POST /visits/{id}/confirm (If-Match) -> visit_revision + audit_log", "ok"),
            (0, 1, "GET /visits/{id}/ai-input -> 200 AiInputPayload (draft trả 409)", "ret"),
        ],
    )
    seq2 = svg_sequence(
        "Sequence 2: Luồng Admin Tài khoản",
        ["Admin (UI)", "API & RBAC", "UserAdminSvc", "PostgreSQL"],
        [
            (0, 1, "POST /admin/users/permission-preview (role=doctor|admin)", "req"),
            (1, 2, "Kiểm role=admin (doctor gọi trả 403) · Đối chiếu ranh giới K8", "req"),
            (2, 0, "200 OK (grantedPermissions[], deniedPermissions[], 0 ghi DB)", "ret"),
            (0, 2, "POST /admin/users [createUser] (username, role, reason)", "req"),
            (2, 3, "Kiểm trùng username (409) · Băm mật khẩu · INSERT app_user + audit_log", "ok"),
            (3, 0, "201 Created (oneTimeSetupCode trả đúng 1 lần, 0 passwordHash)", "ret"),
            (0, 2, "PATCH /admin/users/{id} (If-Match C4, isActive/resetPassword, reason)", "req"),
            (2, 3, "Chặn khóa admin cuối (409) · Thu hồi user_session · Tăng row_version", "ok"),
        ],
    )
    seq3 = svg_sequence(
        "Sequence 3: Luồng Admin Form Version",
        ["Admin (UI)", "API & RBAC", "FormVerSvc", "PostgreSQL"],
        [
            (0, 2, "POST /admin/forms/{id}/versions [createFormVersionDraft]", "req"),
            (2, 3, "Chặn nếu đã có draft (409) · Deep clone 8 sections + 121 fields", "ok"),
            (0, 2, "PATCH /admin/form-versions/{verId} (If-Match: \"1\")", "req"),
            (2, 3, "Trigger K4 chặn sửa bản published/retired -> 409 FORM_VERSION_IMMUTABLE", "err"),
            (2, 3, "Bản draft hợp lệ -> cập nhật cấu trúc + audit_log (row_version=2)", "ok"),
            (0, 2, "GET /preview (isPreviewOnly=true) & GET /diff?baseVersionId=...", "ret"),
            (0, 2, "POST /admin/form-versions/{verId}/publish (If-Match: \"2\")", "req"),
            (2, 3, "BEGIN; retire bản cũ; publish bản mới; audit_log; COMMIT (lượt cũ giữ v cũ)", "ok"),
        ],
    )

    def mmd_details(idx: int, label: str) -> str:
        if idx >= len(mermaid_blocks):
            return ""
        return (
            f'<details class="mmd-box"><summary>Xem mã nguồn Mermaid ({html.escape(label)})</summary>'
            f'<pre class="mono">{html.escape(mermaid_blocks[idx])}</pre></details>'
        )

    return f"""<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tổng quan Kiến trúc &amp; Sơ đồ UML — Hệ thống Suy tim MVP</title>
  <link rel="icon" type="image/svg+xml" href="{FAVICON_DATA_URI}">
  <style>
    :root {{
      --nav-bg:#0F172A; --navy:#1E3A8A; --primary:#1D4ED8; --focus:#2563EB;
      --soft:#EFF6FF; --badge:#DBEAFE; --border:#E2E8F0; --ink:#0F172A; --body:#334155; --muted:#475569; --canvas:#F8FAFC;
    }}
    * {{ box-sizing:border-box; }}
    html,body {{ margin:0; padding:0; background:var(--canvas); color:var(--body); font-family:'Inter','Segoe UI',system-ui,sans-serif; font-size:14px; line-height:1.5; overflow-x:clip; }}
    .mono {{ font-family:'JetBrains Mono','Cascadia Mono',ui-monospace,monospace; font-size:12px; }}
    .top {{ background:var(--nav-bg); color:#FFF; padding:16px 20px; border-bottom:3px solid var(--focus); }}
    .top__inner {{ max-width:1160px; margin:0 auto; display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap; }}
    .top__title {{ margin:0; font-size:19px; font-weight:700; color:#FFF; }}
    .top__sub {{ margin:4px 0 0; font-size:12.5px; color:#CBD5E1; }}
    .top__nav {{ display:flex; gap:8px; flex-wrap:wrap; }}
    .nav-link {{ display:inline-flex; align-items:center; padding:6px 12px; border-radius:6px; background:#1E293B; color:#FFF; border:1px solid #334155; text-decoration:none; font-size:12.5px; font-weight:600; }}
    .nav-link:hover {{ background:var(--navy); border-color:var(--focus); }}
    .nav-link--primary {{ background:var(--primary); border-color:var(--primary); }}
    .wrap {{ max-width:1160px; margin:0 auto; padding:20px 16px 48px; }}
    .toc {{ display:flex; gap:8px; flex-wrap:wrap; margin-bottom:18px; }}
    .toc a {{ padding:5px 10px; border-radius:6px; background:#FFF; border:1px solid var(--border); color:var(--navy); text-decoration:none; font-size:12.5px; font-weight:600; }}
    .toc a:hover {{ background:var(--soft); border-color:var(--focus); }}
    .card {{ background:#FFF; border:1px solid var(--border); border-radius:8px; padding:18px; margin-bottom:18px; }}
    .card h2 {{ margin:0 0 6px; font-size:17px; color:var(--ink); }}
    .card p {{ margin:0 0 12px; font-size:13px; color:var(--muted); }}
    .svg-wrap {{ width:100%; overflow-x:auto; border:1px solid var(--border); border-radius:8px; background:#F8FAFC; padding:8px; }}
    .svg-wrap svg {{ display:block; width:100%; min-width:640px; height:auto; }}
    .mmd-box {{ margin-top:10px; border:1px solid var(--border); border-radius:6px; background:#F8FAFC; padding:8px 12px; }}
    .mmd-box summary {{ cursor:pointer; font-size:12.5px; font-weight:600; color:var(--navy); }}
    .mmd-box pre {{ margin:10px 0 0; overflow-x:auto; white-space:pre; background:#0F172A; color:#E2E8F0; padding:12px; border-radius:6px; }}
    .tbl-wrap {{ width:100%; overflow-x:auto; }}
    table {{ width:100%; border-collapse:collapse; font-size:13px; }}
    th {{ background:#F1F5F9; color:var(--muted); text-align:left; padding:9px 12px; border-bottom:1px solid #CBD5E1; }}
    td {{ padding:9px 12px; border-bottom:1px solid var(--border); vertical-align:top; }}
    @media (max-width:400px) {{ .wrap {{ padding:14px 10px 36px; }} .card {{ padding:12px; }} }}
  </style>
</head>
<body>
  <header class="top">
    <div class="top__inner">
      <div>
        <h1 class="top__title">Kiến trúc Hệ thống &amp; Bộ Sơ đồ UML (Clinical Blue)</h1>
        <p class="top__sub">Hệ thống Thu thập &amp; Xác nhận Dữ liệu Lâm sàng Suy tim Trước AI (MVP · 19 Bảng · {operation_count} API · 121 Trường)</p>
      </div>
      <nav class="top__nav" aria-label="Điều hướng tài liệu">
        <a class="nav-link nav-link--primary" href="../">Mở ứng dụng Web MVP</a>
      </nav>
    </div>
  </header>
  <main class="wrap">
    <nav class="toc" aria-label="Mục lục sơ đồ">
      <a href="#layered">1. Kiến trúc phân lớp</a>
      <a href="#erd">2. ERD 19 bảng 3NF</a>
      <a href="#class">3. UML Class Diagram</a>
      <a href="#seq1">4. Sequence 1: Bác sĩ</a>
      <a href="#seq2">5. Sequence 2: Admin Tài khoản</a>
      <a href="#seq3">6. Sequence 3: Admin Biểu mẫu</a>
      <a href="#rules">7. Chốt kiến trúc K1–K10</a>
    </nav>

    <section class="card" id="layered">
      <h2>1. Kiến trúc Phân lớp Tổng thể (Modular Monolith)</h2>
      <p>Tách bạch rõ ràng giao diện Web SPA 8 màn hình, tầng API Gateway &amp; RBAC <span class="mono">/api/v1</span>, tầng dịch vụ miền nghiệp vụ, CSDL PostgreSQL 19 bảng và hợp đồng chỉ đọc <span class="mono">AiInputPayload</span> cho giai đoạn tích hợp AI sau.</p>
      <div class="svg-wrap">{svg_layered_architecture(operation_count)}</div>
      {mmd_details(0, "Kiến trúc phân lớp")}
    </section>

    <section class="card" id="erd">
      <h2>2. Sơ đồ Thực thể Liên kết (ERD — 19 Bảng Chuẩn 3NF &amp; 10 Enum)</h2>
      <p>Bao gồm đầy đủ 3 nhóm thực thể: IAM &amp; Kiểm toán, Danh mục Biểu mẫu bất biến, và Hồ sơ Bệnh nhân + Lượt khám + 4 bảng lặp độc lập (huyết áp tư thế, thuốc, dị ứng/ADR, xét nghiệm cận lâm sàng) cùng <span class="mono">visit_revision</span> và <span class="mono">visit_value_option</span>.</p>
      <div class="svg-wrap">{svg_erd_19_tables()}</div>
      {mmd_details(1, "ERD 19 bảng")}
    </section>

    <section class="card" id="class">
      <h2>3. Biểu đồ Lớp Miền Nghiệp vụ (UML Class Diagram)</h2>
      <p>Phân định rõ 4 Aggregate Root (<span class="mono">AppUser</span>, <span class="mono">FormVersion</span>, <span class="mono">Patient</span>, <span class="mono">Visit</span>), 15 thực thể con và 3 Value Object tính động (<span class="mono">AiInputPayload</span>, <span class="mono">VisitReviewResponse</span>, <span class="mono">FormVersionDiffResponse</span>).</p>
      <div class="svg-wrap">{svg_class_diagram()}</div>
      {mmd_details(2, "UML Class Diagram")}
    </section>

    <section class="card" id="seq1">
      <h2>4. Sequence 1 — Luồng Bác sĩ: Tạo lượt → Lưu nháp → Xem lại → Xác nhận → AiInputPayload</h2>
      <p>Bảo đảm K1 (Tầng 4 không chặn xác nhận), K2 (3 trạng thái bảo toàn số 0/false), K3 (gắn cứng version), K5 (bản chụp revision) và kiểm soát đồng thời <span class="mono">If-Match</span>.</p>
      <div class="svg-wrap">{seq1}</div>
      {mmd_details(3, "Sequence 1")}
    </section>

    <section class="card" id="seq2">
      <h2>5. Sequence 2 — Luồng Quản trị: Xem trước quyền → Tạo &amp; Cập nhật tài khoản</h2>
      <p>Bắt buộc qua bước đối chiếu quyền 2 cột, trả mã kích hoạt một lần duy nhất, chặn khóa Quản trị viên cuối cùng, thu hồi phiên tức thì và kiểm soát đồng thời <span class="mono">app_user.row_version</span> (C4).</p>
      <div class="svg-wrap">{seq2}</div>
      {mmd_details(4, "Sequence 2")}
    </section>

    <section class="card" id="seq3">
      <h2>6. Sequence 3 — Luồng Quản trị: Tạo bản nháp Form → Sửa → Xem trước → Diff → Phát hành</h2>
      <p>Khóa bất biến tuyệt đối phiên bản <span class="mono">published</span>/<span class="mono">retired</span> ở cả tầng API (409) và Trigger DB (K4); phát hành phiên bản mới không làm thay đổi cấu trúc lượt khám lịch sử.</p>
      <div class="svg-wrap">{seq3}</div>
      {mmd_details(5, "Sequence 3")}
    </section>

    <section class="card" id="rules">
      <h2>7. Tóm tắt 10 Chốt Kiến trúc Bắt buộc (K1–K10)</h2>
      <div class="tbl-wrap">
        <table>
          <thead><tr><th>Chốt</th><th>Quy tắc cốt lõi</th><th>Cơ chế bảo vệ</th></tr></thead>
          <tbody>
            <tr><td><strong>K1</strong></td><td>Tách 4 tầng điều kiện (<span class="mono">patient_created</span>, <span class="mono">draft_saved</span>, <span class="mono">confirmed</span>, <span class="mono">ai_ready</span>)</td><td>Tầng 4 chỉ đối chiếu độ sẵn sàng cho 4 module AI, không chặn xác nhận lượt khám.</td></tr>
            <tr><td><strong>K2</strong></td><td>3 trạng thái câu trả lời (Chưa điền / Chưa rõ / Đã trả lời)</td><td>Ô trống không tạo bản ghi; <span class="mono">unknown</span> khóa các cột giá trị về null; giữ nguyên số <span class="mono">0</span> và <span class="mono">false</span>.</td></tr>
            <tr><td><strong>K3</strong></td><td>Biểu mẫu theo metadata &amp; gắn cứng phiên bản</td><td>Mỗi lượt khám khóa <span class="mono">form_version_id</span> lúc tạo và bắt đầu với dữ liệu trắng.</td></tr>
            <tr><td><strong>K4</strong></td><td>Phiên bản biểu mẫu đã phát hành là bất biến</td><td>Chặn 409 ở cả API và DB trigger; mọi chỉnh sửa đi qua bản nháp mới + Diff.</td></tr>
            <tr><td><strong>K5</strong></td><td>Lượt khám đã xác nhận là chỉ đọc</td><td>Chỉnh sửa sau xác nhận đi qua <span class="mono">visit_revision</span> kèm lý do, bảo toàn bản chụp cũ.</td></tr>
            <tr><td><strong>K6</strong></td><td>4 bảng lặp độc lập</td><td>Tách riêng HA tư thế, thuốc, dị ứng/ADR và kết quả cận lâm sàng có thời điểm.</td></tr>
            <tr><td><strong>K7</strong></td><td>Tách chỉ số cận lâm sàng &amp; đơn vị chuẩn</td><td>Tách <span class="mono">cls_bnp</span> ≠ <span class="mono">cls_nt_probnp</span>, <span class="mono">cls_creatinin</span> ≠ <span class="mono">cls_egfr</span>, <span class="mono">cls_lvef</span> ≠ kết luận siêu âm.</td></tr>
            <tr><td><strong>K8</strong></td><td>Tách quyền RBAC &amp; bảo mật nhật ký</td><td>Admin bị chặn 403 trên hồ sơ/lượt khám; nhật ký kiểm toán không chứa bệnh án hay mật khẩu.</td></tr>
            <tr><td><strong>K9</strong></td><td>Thuần phạm vi MVP, không chạy AI giả</td><td>Chỉ cung cấp hợp đồng dữ liệu đầu ra <span class="mono">AiInputPayload</span> cho lượt khám đã xác nhận.</td></tr>
            <tr><td><strong>K10</strong></td><td>Mã bệnh nhân bất biến <span class="mono">BN-\\d{{5}}</span></td><td>Máy chủ sinh duy nhất, khóa nội bộ dùng UUID, không tự bịa ngày sinh 01/01.</td></tr>
          </tbody>
        </table>
      </div>
    </section>
  </main>
</body>
</html>
"""


def build_pages(web_src: Path, openapi_path: Path, arch_md_path: Path, out_dir: Path) -> None:
    # Validate the resolved target before removing a previous generated bundle.
    if any(p.is_symlink() or p.is_junction() for p in (out_dir, *out_dir.parents)):
        raise ValueError("Thư mục build không được đi qua symlink hoặc junction.")
    out_dir = out_dir.resolve()
    if out_dir == Path(out_dir.anchor):
        raise ValueError("Không được dùng thư mục gốc ổ đĩa làm đích build.")
    repo_root = SUBMISSION_ROOT.parents[1]
    protected = (repo_root, web_src, openapi_path, arch_md_path, Path.home())
    if any(out_dir == p.resolve() or out_dir in p.resolve().parents for p in protected):
        raise ValueError("Thư mục build không được chứa mã nguồn hoặc thư mục người dùng.")
    source_dirs = (web_src, openapi_path.parent, arch_md_path.parent, repo_root / ".git")
    if any(out_dir == p.resolve() or p.resolve() in out_dir.parents for p in source_dirs):
        raise ValueError("Thư mục build không được nằm trong nguồn hoặc metadata Git.")
    if not web_src.is_dir():
        raise FileNotFoundError(f"Không tìm thấy thư mục nguồn frontend: {web_src}")
    if not openapi_path.is_file():
        raise FileNotFoundError(f"Không tìm thấy tệp OpenAPI: {openapi_path}")

    if out_dir.exists():
        if not out_dir.is_dir():
            raise ValueError("Đích build đã tồn tại nhưng không phải thư mục.")
        if any(out_dir.iterdir()):
            try:
                generated_bundle = (
                    (out_dir / ".nojekyll").is_file()
                    and (out_dir / "config.js").read_text(encoding="utf-8") == STATIC_CONFIG_JS
                    and "Suytim-CDSS" in (out_dir / "index.html").read_text(encoding="utf-8")
                )
            except (OSError, UnicodeError):
                generated_bundle = False
            if not generated_bundle:
                raise ValueError("Đích build có dữ liệu khác gói tĩnh Suytim-CDSS; từ chối xóa.")
        shutil.rmtree(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    (out_dir / "docs").mkdir(parents=True, exist_ok=True)

    # 1. Copy frontend assets
    for name in WEB_ASSETS:
        src_file = web_src / name
        if not src_file.is_file():
            raise FileNotFoundError(f"Thiếu tệp nguồn bắt buộc: {src_file}")
        shutil.copy2(src_file, out_dir / name)

    # Load the browser-only adapter only in the generated offline site.
    index_path = out_dir / "index.html"
    index = index_path.read_text(encoding="utf-8")
    config_tag = '<script src="./config.js"></script>'
    static_tag = '<script src="./static-runtime.js?v=20261123-admin-password"></script>'
    if index.count(config_tag) != 1:
        raise ValueError("Không tìm thấy thẻ cấu hình frontend trong index.html.")
    index_path.write_text(index.replace(config_tag, f"{config_tag}\n  {static_tag}"), encoding="utf-8", newline="\n")

    # 2. Write static mode config.js & .nojekyll
    (out_dir / "config.js").write_text(STATIC_CONFIG_JS, encoding="utf-8", newline="\n")
    (out_dir / ".nojekyll").write_text("", encoding="utf-8", newline="\n")

    # Read the backend contract only to count operations in the architecture page.
    spec = yaml.safe_load(openapi_path.read_text(encoding="utf-8"))

    # 4. Generate static Architecture & UML page (embedded Clinical Blue SVGs + Mermaid source)
    mermaid_blocks = extract_mermaid_blocks(arch_md_path)
    operation_count = sum(
        1 for path_item in spec.get("paths", {}).values()
        for method in ("get", "post", "put", "patch", "delete")
        if isinstance(path_item, dict) and isinstance(path_item.get(method), dict)
    )
    (out_dir / "docs" / "index.html").write_text(build_arch_docs_html(mermaid_blocks, operation_count), encoding="utf-8", newline="\n")

    print(f"[build_pages] Thành công -> {out_dir}")
    print(f"  - Web assets : {len(WEB_ASSETS)} tệp + config.js (mode=static) + .nojekyll")
    print(f"  - Kiến trúc  : docs/index.html (6 SVG Clinical Blue + {len(mermaid_blocks)} khối Mermaid)")


def main() -> int:
    parser = argparse.ArgumentParser(description="Build static GitHub Pages bundle for Suy tim MVP.")
    parser.add_argument("--web-src", type=Path, default=DEFAULT_WEB_SRC, help="Thư mục nguồn web")
    parser.add_argument("--openapi", type=Path, default=DEFAULT_OPENAPI, help="Đường dẫn openapi.yaml")
    parser.add_argument("--arch-md", type=Path, default=DEFAULT_ARCH_MD, help="Đường dẫn architecture-uml.md")
    parser.add_argument("--out", type=Path, default=DEFAULT_OUT, help="Thư mục đích dist-pages")
    args = parser.parse_args()
    build_pages(args.web_src, args.openapi, args.arch_md, args.out)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
