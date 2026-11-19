'use strict';
// Comprehensive headless-Chrome regression & responsive suite for web/forms-v2.html + web/forms-v2/*.js.
// Run: node submissions/suy_tim_nhom27/tests/forms_v2_frontend_regression.cjs
// Uses a temporary local HTTP server on 127.0.0.1:8026 (closed on exit) with OpenAPI-compliant mocks
// and zero external npm dependencies (Node 22 built-in WebSocket + Chrome DevTools Protocol).

const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const crypto = require('node:crypto');
const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');

const WEB_ROOT = path.resolve(__dirname, '../web');
const PORT = 8026;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const VIEWPORTS = [
  { name: 'desktop-1280', width: 1280, height: 800, mobile: false },
  { name: 'mobile-390', width: 390, height: 844, mobile: true },
  { name: 'small-320', width: 320, height: 568, mobile: true },
];

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.json': 'application/json; charset=utf-8',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};

function findBrowser() {
  const candidates = [
    process.env.CHROME_PATH,
    path.join(process.env.ProgramFiles || 'C:\\Program Files', 'Google\\Chrome\\Application\\chrome.exe'),
    path.join(process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)', 'Google\\Chrome\\Application\\chrome.exe'),
    path.join(process.env.LocalAppData || '', 'Google\\Chrome\\Application\\chrome.exe'),
    path.join(process.env.ProgramFiles || 'C:\\Program Files', 'Microsoft\\Edge\\Application\\msedge.exe'),
    path.join(process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)', 'Microsoft\\Edge\\Application\\msedge.exe'),
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
  ].filter(Boolean);
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  throw new Error('Headless Chrome/Edge executable not found.');
}

function buildCatalog() {
  return [
    {
      code: 'tuoi', label: 'Tuổi', group: 'Thông tin nền', type: 'integer', unit: 'tuổi',
      choices: [], help: '', order: 2, active: true, version: 1,
      constraints: { minimum: 0, maximum: 120 }, data_role: 'recorded_input',
    },
    {
      code: 'gioi_tinh', label: 'Giới tính', group: 'Thông tin nền', type: 'select', unit: null,
      choices: [{ code: 'v1', label: 'Nam' }, { code: 'v2', label: 'Nữ' }],
      help: '', order: 3, active: true, version: 1, data_role: 'recorded_input',
    },
    {
      code: 'chieu_cao', label: 'Chiều cao', group: 'Thông tin nền', type: 'number', unit: 'cm',
      choices: [], help: '', order: 4, active: true, version: 1,
      constraints: { minimum: 0 }, data_role: 'measured_input',
    },
    {
      code: 'can_nang', label: 'Cân nặng (danh mục mới)', group: 'Thông tin nền', type: 'number', unit: 'kg',
      choices: [], help: '', order: 5, active: true, version: 2,
      constraints: { minimum: 0 }, data_role: 'measured_input',
    },
    {
      code: 'bmi', label: 'BMI', group: 'Thông tin nền', type: 'unavailable', unit: null,
      choices: [], help: 'Tính tự động theo cân nặng và chiều cao cùng lượt.', order: 6,
      active: true, version: 1, data_role: 'derived',
    },
    {
      code: 'kho_tho', label: 'Khó thở khi gắng sức', group: 'Triệu chứng và dấu hiệu', type: 'boolean', unit: null,
      choices: [], help: 'Phân biệt Có, Không và Chưa có dữ liệu.', order: 20, active: true, version: 1,
      data_role: 'recorded_input',
    },
    {
      code: 'ha_nam_ngoi_tam_thu', label: 'Huyết áp nằm/ngồi — tâm thu', group: 'Triệu chứng và dấu hiệu',
      type: 'number', unit: 'mmHg', choices: [], help: 'Đơn vị mmHg chỉ dùng cho trường nhập tay.',
      order: 24, active: true, version: 1, constraints: { minimum: 0 }, data_role: 'measured_input',
    },
    {
      code: 'yeu_to_nguy_co', label: 'Yếu tố nguy cơ', group: 'Tiền sử và bệnh đồng mắc',
      type: 'multiselect', unit: null,
      choices: [
        { code: 'tha', label: 'Tăng huyết áp' },
        { code: 'dtd', label: 'Đái tháo đường' },
        { code: 'rlmm', label: 'Rối loạn lipid máu' },
      ],
      help: 'Xác định rõ danh sách rỗng hay chưa có dữ liệu.', order: 30, active: true, version: 1,
      data_role: 'recorded_input',
    },
    {
      code: 'danh_sach_thuoc', label: 'Danh sách thuốc ghi nhận', group: 'Thuốc đang sử dụng',
      type: 'medications', contract_version: 2, unit: null, choices: [],
      help: 'Ghi rõ thuốc đang dùng, dự kiến hoặc đã ngừng.', order: 68, active: true, version: 1,
      data_role: 'recorded_input',
    },
    {
      code: 'bnp_ntprobnp', label: 'BNP/NT-proBNP', group: 'Cận lâm sàng và theo dõi',
      type: 'results', contract_version: 2, unit: null, choices: [],
      result_tests: [
        { code: 'BNP', label: 'BNP', units: ['pg/mL', 'ng/L'] },
        { code: 'NT_PROBNP', label: 'NT-proBNP', units: ['pg/mL'] },
      ],
      help: 'Chỉ ghi kết quả đã có.', order: 71, active: true, version: 1, data_role: 'measured_input',
    },
    {
      code: 'his_huyet_ap_cao', label: 'Huyết áp cao (HIS)', group: 'Chỉ số nguồn HIS',
      type: 'number', unit: null, choices: [], help: 'Không tự suy đơn vị từ nguồn HIS.',
      order: 90, active: true, version: 1, constraints: { minimum: 0 }, data_role: 'measured_input',
    },
    {
      code: 'ai_risk_score', label: 'Điểm nguy cơ AI', group: 'Chờ đặc tả module',
      type: 'unavailable', unit: null, choices: [], help: 'Chưa triển khai AI.',
      order: 200, active: true, version: 1, data_role: 'ai_output',
    },
    {
      code: 'truong_ngung_dung', label: 'Trường cũ ngừng dùng', group: 'Thông tin nền',
      type: 'text', unit: null, choices: [], help: 'Đã ngừng sử dụng.',
      order: 210, active: false, version: 1, data_role: 'recorded_input',
    },
  ];
}

function createMockBackend() {
  let catalogRevision = 4;
  let catalog = buildCatalog();

  const pinnedFieldsV1 = catalog.map(f =>
    f.code === 'can_nang' ? { ...f, label: 'Cân nặng (ghim v1)', version: 1 } : structuredClone(f)
  );

  const users = {
    doctor_demo: {
      password: 'doc-password-123',
      actor: {
        user_id: 'u-doctor-1',
        username: 'doctor_demo',
        display_name: 'BS Giả Lập 01',
        role: 'doctor',
        permissions: ['clinical:write', 'import:excel'],
      },
    },
    admin_demo: {
      password: 'adm-password-123',
      actor: {
        user_id: 'u-admin-1',
        username: 'admin_demo',
        display_name: 'Quản trị Giả Lập',
        role: 'admin',
        permissions: ['catalog:write', 'clinical:read'],
      },
    },
    doctor_other: {
      password: 'other-password-123',
      actor: {
        user_id: 'u-doctor-2',
        username: 'doctor_other',
        display_name: 'BS Khác',
        role: 'doctor',
        permissions: ['clinical:write'],
      },
    },
  };

  const activeTokens = new Map();
  let tokenCounter = 0;

  const patients = [
    {
      id: '11111111-1111-4111-8111-111111111111',
      code: 'BN-00001',
      external_id: '000SYN01',
      display_name: 'DEMO-001',
      owner_id: 'u-doctor-1',
      date_of_birth: '1970-03-15',
      sex: 'female',
      insurance_number: '001234567890',
      demographic_revision: 2,
      created_at: '2025-01-10T02:00:00Z',
      updated_at: '2026-11-18T08:00:00Z',
      latest_visit_at: '2026-11-19T02:00:00Z',
      latest_visit_external_id: 'LK-2026-03',
    },
    {
      id: '22222222-2222-4222-8222-222222222222',
      code: 'BN-00002',
      external_id: null,
      display_name: 'Người bệnh giả lập 00002',
      owner_id: 'u-doctor-1',
      date_of_birth: null,
      sex: null,
      insurance_number: null,
      demographic_revision: 0,
      created_at: '2024-05-05T03:00:00Z',
      updated_at: '2024-05-05T03:00:00Z',
      latest_visit_at: null,
      latest_visit_external_id: null,
    },
  ];

  const patientHistories = {
    '11111111-1111-4111-8111-111111111111': [
      {
        revision: 2,
        username: 'doctor_demo',
        created_at: '2026-11-18T08:00:00Z',
        before_json: {
          display_name: 'DEMO-001-OLD',
          date_of_birth: '1970-03-15',
          sex: 'female',
          insurance_number: '001234567890',
          external_id: '000SYN01',
        },
        after_json: {
          display_name: 'DEMO-001',
          date_of_birth: '1970-03-15',
          sex: 'female',
          insurance_number: '001234567890',
          external_id: '000SYN01',
        },
      },
    ],
  };

  const his42Columns = Array.from({ length: 42 }, (_, i) => ({
    header: i === 0 ? 'MA_BN' : i === 1 ? 'MA_LK' : i === 2 ? 'CHIEU_CAO_CM' : i === 3 ? 'CAN_NANG_KG' : `COT_HIS_${String(i + 1).padStart(2, '0')}`,
    value: i === 0 ? '000SYN01' : i === 1 ? 'HIS:Sheet3:v1:20261119:VERY_LONG_IDENTIFIER_CODE_0001' : i === 2 ? 168 : i === 3 ? 85 : `Gia tri cot ${i + 1}`,
  }));

  const visits = new Map();
  function calcBmi(values) {
    const h = values?.chieu_cao;
    const w = values?.can_nang;
    if (typeof h === 'number' && typeof w === 'number' && h > 0 && w > 0) {
      return Number((w / ((h / 100) ** 2)).toFixed(2));
    }
    return null;
  }

  const visitLatest = {
    id: 'aaaaaaa3-aaaa-4aaa-8aaa-aaaaaaaaaaa3',
    patient_id: '11111111-1111-4111-8111-111111111111',
    external_id: 'LK-2026-03',
    occurred_at: '2026-11-19T02:00:00Z',
    revision: 2,
    catalog_revision: 1,
    demographics_snapshot: {
      display_name: 'DEMO-001',
      date_of_birth: '1970-03-15',
      sex: 'female',
      insurance_number: '001234567890',
    },
    values_json: {
      tuoi: 55,
      gioi_tinh: 'v2',
      chieu_cao: 168,
      can_nang: 86,
      bmi: null,
      kho_tho: null,
      ha_nam_ngoi_tam_thu: 130,
      yeu_to_nguy_co: null,
      danh_sach_thuoc: [
        {
          name: 'Bisoprolol',
          ingredient: 'Bisoprolol fumarate',
          dose: '5 mg/ngày',
          strength: '5 mg',
          dose_value: 5,
          dose_unit: 'mg',
          route: 'Uống',
          frequency: '1 lần/ngày',
          start_date: '2026-10-01',
          end_date: null,
          observed_at: '2026-11-19T02:00:00Z',
          status: 'current',
          category: 'prescription',
          source: 'Đơn ngoại trú',
        },
      ],
      bnp_ntprobnp: [
        {
          test_code: null,
          name: 'NT-proBNP phòng xét nghiệm',
          value: 420,
          unit: 'pg/mL',
          observed_at: '2026-11-18T03:30:00Z',
          source: 'Phiếu XN 01',
        },
      ],
      his_huyet_ap_cao: 135,
      ai_risk_score: null,
      truong_ngung_dung: 'Giá trị lưu cũ',
    },
    sources_json: {
      chieu_cao: { kind: 'manual' },
      can_nang: { kind: 'excel', source_name: 'his-two-cases.xlsx', location: 'Sheet3!D2' },
    },
    metadata: {
      visit_type: 'followup',
      reason: 'Tái khám định kỳ suy tim',
      primary_diagnosis_code: 'I50.9',
      secondary_diagnosis_codes: ['I10'],
      department: 'Nội Tim mạch',
      allergy_status: 'known',
      allergy_details: 'Dị ứng penicillin (phát ban)',
      his_source_rows: [
        { sheet: 'Sheet3', row: 2, source_name: 'his-two-cases.xlsx', columns: his42Columns },
      ],
    },
    fields: structuredClone(pinnedFieldsV1),
  };

  const visitMed = {
    ...structuredClone(visitLatest),
    id: 'aaaaaaa2-aaaa-4aaa-8aaa-aaaaaaaaaaa2',
    external_id: 'LK-2026-02',
    occurred_at: '2026-10-15T02:00:00Z',
    revision: 1,
    metadata: { visit_type: 'followup', reason: 'Cập nhật đơn thuốc' },
  };

  const visitDisease = {
    ...structuredClone(visitLatest),
    id: 'aaaaaaa1-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
    external_id: 'LK-2026-01',
    occurred_at: '2026-09-10T02:00:00Z',
    revision: 1,
    metadata: {
      visit_type: 'new',
      primary_diagnosis_code: 'I50.0',
      secondary_diagnosis_codes: ['I10', 'E11'],
      reason: 'Khó thở tăng dần khi gắng sức',
      hpi: 'Khởi phát cách nhập viện 2 tuần',
    },
  };

  const visitUndated = {
    ...structuredClone(visitLatest),
    id: 'aaaaaaa0-aaaa-4aaa-8aaa-aaaaaaaaaaa0',
    external_id: 'LK-UNDATED',
    occurred_at: null,
    revision: 0,
    values_json: { chieu_cao: null, can_nang: null, bmi: null },
    metadata: { visit_type: null, reason: null },
  };

  for (const v of [visitLatest, visitMed, visitDisease, visitUndated]) {
    visits.set(v.id, v);
  }

  const visitHistories = {
    [visitLatest.id]: [
      {
        revision: 2,
        username: 'doctor_demo',
        created_at: '2026-11-19T02:30:00Z',
        occurred_at: '2026-11-19T02:00:00Z',
        metadata_json: visitLatest.metadata,
        values_json: { chieu_cao: 168, can_nang: 86 },
        sources_json: {
          chieu_cao: { kind: 'manual' },
          can_nang: { kind: 'excel', source_name: 'his-two-cases.xlsx', location: 'Sheet3!D2' },
        },
        definitions_json: Object.fromEntries(pinnedFieldsV1.map(f => [f.code, f])),
      },
    ],
  };

  const importHistory = [];
  const requestLog = [];
  const static404s = [];
  const faults = {
    nextVisitPatch: null, // { status, body } or 'drop'
    nextTokenUserOverride: null, // overrides /me user_id once to test wrong-account reauth
    nextLogoutStatus: null, // e.g. 503 to verify logout always clears local session
  };

  function presentVisit(v) {
    return {
      ...structuredClone(v),
      derived_values: { bmi: calcBmi(v.values_json) },
    };
  }

  function authActor(req) {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return null;
    const token = auth.slice(7);
    return activeTokens.get(token) || null;
  }

  function sendJson(res, status, data) {
    const payload = JSON.stringify(data);
    res.writeHead(status, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    });
    res.end(payload);
  }

  async function readBody(req) {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const raw = Buffer.concat(chunks).toString('utf8');
    return raw ? JSON.parse(raw) : null;
  }

  async function handleRequest(req, res) {
    const url = new URL(req.url, BASE_URL);
    const pathname = url.pathname;
    const method = req.method;

    // Serve API routes
    if (pathname.startsWith('/api/')) {
      const body = ['POST', 'PATCH', 'PUT'].includes(method) ? await readBody(req) : null;
      requestLog.push({ method, pathname, body, hasAuth: Boolean(req.headers.authorization) });

      // Auth endpoints
      if (pathname === '/api/v1/auth/token' && method === 'POST') {
        const entry = users[body?.username];
        if (!entry || entry.password !== body?.password) {
          return sendJson(res, 401, { detail: 'Sai tên đăng nhập hoặc mật khẩu.' });
        }
        const token = `tok_${entry.actor.role}_${++tokenCounter}`;
        activeTokens.set(token, entry.actor);
        return sendJson(res, 200, { access_token: token, token_type: 'bearer', expires_in: 3600 });
      }

      const actor = authActor(req);
      if (pathname === '/api/v1/auth/me' && method === 'GET') {
        if (!actor) return sendJson(res, 401, { detail: 'Phiên đăng nhập đã hết hiệu lực.' });
        if (faults.nextTokenUserOverride) {
          const overridden = faults.nextTokenUserOverride;
          faults.nextTokenUserOverride = null;
          return sendJson(res, 200, { ...actor, ...overridden });
        }
        return sendJson(res, 200, actor);
      }

      if (pathname === '/api/v1/auth/logout' && method === 'POST') {
        if (faults.nextLogoutStatus) {
          const code = faults.nextLogoutStatus;
          faults.nextLogoutStatus = null;
          return sendJson(res, code, { detail: 'Logout endpoint unavailable' });
        }
        const auth = req.headers.authorization || '';
        if (auth.startsWith('Bearer ')) activeTokens.delete(auth.slice(7));
        return sendJson(res, 200, { status: 'revoked' });
      }

      if (!actor) return sendJson(res, 401, { detail: 'Chưa đăng nhập hoặc phiên hết hạn.' });

      // Fields catalog
      if (pathname === '/api/forms/fields' && method === 'GET') {
        return sendJson(res, 200, { revision: catalogRevision, fields: catalog });
      }
      if (pathname === '/api/forms/fields' && method === 'POST') {
        if (actor.role !== 'admin') return sendJson(res, 403, { detail: 'Chỉ Admin được chỉnh biểu mẫu.' });
        const created = { ...body, version: 1, active: body.active !== false };
        catalog.push(created);
        catalogRevision += 1;
        return sendJson(res, 201, created);
      }
      const fieldMatch = pathname.match(/^\/api\/forms\/fields\/([^/]+)$/);
      if (fieldMatch && method === 'PATCH') {
        if (actor.role !== 'admin') return sendJson(res, 403, { detail: 'Chỉ Admin được chỉnh biểu mẫu.' });
        const code = decodeURIComponent(fieldMatch[1]);
        const target = catalog.find(f => f.code === code);
        if (!target) return sendJson(res, 404, { detail: 'Không tìm thấy trường.' });
        if (body.expected_version !== target.version) {
          return sendJson(res, 409, { detail: 'Phiên bản trường đã thay đổi.' });
        }
        Object.assign(target, {
          label: body.label,
          group: body.group,
          help: body.help,
          order: body.order,
          active: body.active,
          version: target.version + 1,
        });
        catalogRevision += 1;
        return sendJson(res, 200, target);
      }

      // Patients
      if (pathname === '/api/forms/patients' && method === 'GET') {
        return sendJson(res, 200, patients);
      }
      if (pathname === '/api/forms/patients' && method === 'POST') {
        if (actor.role !== 'doctor') return sendJson(res, 403, { detail: 'Admin không có quyền tạo hồ sơ.' });
        if (body.external_id && patients.some(p => p.external_id === body.external_id)) {
          return sendJson(res, 409, { detail: 'Mã nguồn HIS đã tồn tại.' });
        }
        const nextNum = patients.length + 1;
        const code = `BN-${String(nextNum).padStart(5, '0')}`;
        const created = {
          id: body.id || crypto.randomUUID(),
          code,
          external_id: body.external_id ?? null,
          display_name: body.display_name || code,
          owner_id: actor.user_id,
          date_of_birth: body.date_of_birth ?? null,
          sex: body.sex ?? null,
          insurance_number: body.insurance_number ?? null,
          demographic_revision: 0,
          created_at: '2026-11-19T09:00:00Z',
          updated_at: '2026-11-19T09:00:00Z',
          latest_visit_at: null,
          latest_visit_external_id: null,
        };
        patients.unshift(created);
        return sendJson(res, 201, created);
      }

      const overviewMatch = pathname.match(/^\/api\/forms\/patients\/([^/]+)\/overview$/);
      if (overviewMatch && method === 'GET') {
        const pid = decodeURIComponent(overviewMatch[1]);
        const p = patients.find(item => item.id === pid);
        if (!p) return sendJson(res, 404, { detail: 'Không tìm thấy hồ sơ.' });
        const pVisits = [...visits.values()].filter(v => v.patient_id === pid).map(presentVisit);
        const dated = pVisits.filter(v => v.occurred_at).sort((a, b) => new Date(b.occurred_at) - new Date(a.occurred_at));
        const latest = dated[0] || null;
        const summary = pid === '11111111-1111-4111-8111-111111111111'
          ? {
              disease: presentVisit(visitDisease),
              medications: presentVisit(visitMed),
              allergy: presentVisit(visitLatest),
            }
          : { disease: latest, medications: latest, allergy: latest };
        return sendJson(res, 200, {
          patient: p,
          latest_visit: latest,
          visits: pVisits,
          summary_visits: summary,
        });
      }

      const pHistMatch = pathname.match(/^\/api\/forms\/patients\/([^/]+)\/history$/);
      if (pHistMatch && method === 'GET') {
        const pid = decodeURIComponent(pHistMatch[1]);
        return sendJson(res, 200, patientHistories[pid] || []);
      }

      const pVisitsMatch = pathname.match(/^\/api\/forms\/patients\/([^/]+)\/visits$/);
      if (pVisitsMatch && method === 'POST') {
        if (actor.role !== 'doctor') return sendJson(res, 403, { detail: 'Admin không có quyền mở lượt mới.' });
        const pid = decodeURIComponent(pVisitsMatch[1]);
        const p = patients.find(item => item.id === pid);
        if (!p) return sendJson(res, 404, { detail: 'Không tìm thấy hồ sơ.' });
        const emptyValues = Object.fromEntries(catalog.map(f => [f.code, null]));
        const created = {
          id: body.id || crypto.randomUUID(),
          patient_id: pid,
          external_id: body.external_id ?? null,
          occurred_at: body.occurred_at ?? null,
          revision: 0,
          catalog_revision: catalogRevision,
          demographics_snapshot: {
            display_name: p.display_name,
            date_of_birth: p.date_of_birth,
            sex: p.sex,
            insurance_number: p.insurance_number,
          },
          values_json: emptyValues,
          sources_json: {},
          metadata: body.metadata || {},
          fields: structuredClone(catalog),
        };
        visits.set(created.id, created);
        return sendJson(res, 201, presentVisit(created));
      }

      const patientPatchMatch = pathname.match(/^\/api\/forms\/patients\/([^/]+)$/);
      if (patientPatchMatch && method === 'PATCH') {
        const pid = decodeURIComponent(patientPatchMatch[1]);
        const p = patients.find(item => item.id === pid);
        if (!p) return sendJson(res, 404, { detail: 'Không tìm thấy hồ sơ.' });
        if (body.expected_revision !== p.demographic_revision) {
          return sendJson(res, 409, { detail: 'Thông tin hành chính đã đổi.' });
        }
        const before = {
          display_name: p.display_name,
          date_of_birth: p.date_of_birth,
          sex: p.sex,
          insurance_number: p.insurance_number,
          external_id: p.external_id,
        };
        Object.assign(p, {
          display_name: body.display_name,
          date_of_birth: body.date_of_birth,
          sex: body.sex,
          insurance_number: body.insurance_number,
          external_id: body.external_id,
          demographic_revision: p.demographic_revision + 1,
          updated_at: '2026-11-19T09:30:00Z',
        });
        (patientHistories[pid] ||= []).unshift({
          revision: p.demographic_revision,
          username: actor.username,
          created_at: p.updated_at,
          before_json: before,
          after_json: {
            display_name: p.display_name,
            date_of_birth: p.date_of_birth,
            sex: p.sex,
            insurance_number: p.insurance_number,
            external_id: p.external_id,
          },
        });
        return sendJson(res, 200, p);
      }

      // Visits
      const visitHistMatch = pathname.match(/^\/api\/forms\/visits\/([^/]+)\/history$/);
      if (visitHistMatch && method === 'GET') {
        const vid = decodeURIComponent(visitHistMatch[1]);
        return sendJson(res, 200, visitHistories[vid] || []);
      }

      const visitMatch = pathname.match(/^\/api\/forms\/visits\/([^/]+)$/);
      if (visitMatch && method === 'GET') {
        const vid = decodeURIComponent(visitMatch[1]);
        const v = visits.get(vid);
        if (!v) return sendJson(res, 404, { detail: 'Không tìm thấy lượt khám.' });
        return sendJson(res, 200, presentVisit(v));
      }
      if (visitMatch && method === 'PATCH') {
        if (actor.role !== 'doctor') return sendJson(res, 403, { detail: 'Admin không có quyền lưu lượt khám.' });
        if (faults.nextVisitPatch) {
          const f = faults.nextVisitPatch;
          faults.nextVisitPatch = null;
          if (f === 'drop') {
            res.destroy();
            return;
          }
          return sendJson(res, f.status, f.body);
        }
        const vid = decodeURIComponent(visitMatch[1]);
        const v = visits.get(vid);
        if (!v) return sendJson(res, 404, { detail: 'Không tìm thấy lượt khám.' });
        if (body.expected_revision !== v.revision) {
          return sendJson(res, 409, { detail: 'Lượt khám đã được cập nhật bởi phiên khác.' });
        }
        v.values_json = { ...v.values_json, ...(body.values || {}) };
        v.metadata = { ...v.metadata, ...(body.metadata || {}) };
        if (Object.hasOwn(body, 'occurred_at')) v.occurred_at = body.occurred_at;
        v.revision += 1;
        return sendJson(res, 200, { revision: v.revision });
      }

      // HIS Imports
      if (pathname === '/api/forms/imports/template.xlsx' && method === 'GET') {
        if (actor.role !== 'doctor') return sendJson(res, 403, { detail: 'Chỉ Bác sĩ được tải mẫu nhập HIS.' });
        const minimalBytes = Buffer.from('PK\x03\x04dummy-his-template-xlsx', 'binary');
        res.writeHead(200, {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': 'attachment; filename="his-two-cases.xlsx"',
        });
        res.end(minimalBytes);
        return;
      }

      if (pathname === '/api/forms/imports/excel/auto-preview' && method === 'POST') {
        if (actor.role !== 'doctor') return sendJson(res, 403, { detail: 'Chỉ Bác sĩ được nhập HIS.' });
        return sendJson(res, 200, {
          preview_token: 'hmac-preview-token-v1',
          catalog_revision: catalogRevision,
          profile: 'his_sheet3_v1',
          notes: [
            'Nhận diện tự động Sheet3 gồm 42 cột chuẩn HIS.',
            'Các cột chưa xác nhận đơn vị giữ trong dữ liệu HIS gốc (raw_pending).',
          ],
          source_identity: { sheet: 'Sheet3', rows: 3 },
          eligible: 2,
          errors: 1,
          business_writes: false,
          records: [
            {
              index: 0,
              status: 'eligible',
              target_action: 'update_visit',
              target_patient_code: 'BN-00001',
              target_patient_name: 'DEMO-001',
              target_occurred_at: '2026-11-19T02:00:00Z',
              patient_code: '000SYN01',
              visit_external_id: 'LK-2026-03',
              visit_id: visitLatest.id,
              errors: [],
              fields: [
                {
                  code: 'chieu_cao', label: 'Chiều cao', path: 'Sheet3!C2',
                  raw: 168, current: 168, incoming: 168, status: 'unchanged',
                },
                {
                  code: 'can_nang', label: 'Cân nặng', path: 'Sheet3!D2',
                  raw: 85, current: 86, incoming: 85, status: 'conflict',
                },
                {
                  code: 'ha_nam_ngoi_tam_thu', label: 'Huyết áp nằm/ngồi — tâm thu', path: 'Sheet3!E2',
                  raw: 140, current: 130, incoming: 140, status: 'conflict',
                },
                {
                  code: 'kho_tho', label: 'Khó thở khi gắng sức', path: 'Sheet3!F2',
                  raw: null, current: false, incoming: null, status: 'source_null',
                },
                {
                  code: 'his_nhiet_do', label: 'Nhiệt độ nguồn HIS', path: 'Sheet3!G2',
                  raw: '37.2', current: null, incoming: null, status: 'raw_pending',
                  reason: 'Chưa xác nhận đơn vị; giữ trong dữ liệu gốc.',
                },
              ],
              raw_source: {
                sheet: 'Sheet3',
                row: 2,
                source_name: body.filename,
                columns: his42Columns,
              },
            },
            {
              index: 1,
              status: 'eligible',
              target_action: 'create_patient_and_visit',
              target_patient_code: null,
              target_patient_name: 'Người bệnh giả lập mới',
              target_occurred_at: '2026-11-19T04:00:00Z',
              patient_code: 'SYN-NEW-02',
              visit_external_id: 'LK-HIS-02',
              errors: [],
              fields: [
                {
                  code: 'chieu_cao', label: 'Chiều cao', path: 'Sheet3!C3',
                  raw: 170, current: null, incoming: 170, status: 'fill',
                },
              ],
              raw_source: { sheet: 'Sheet3', row: 3, source_name: body.filename, columns: his42Columns.slice(0, 6) },
            },
            {
              index: 2,
              status: 'error',
              target_action: null,
              target_patient_code: null,
              target_patient_name: null,
              target_occurred_at: null,
              patient_code: '',
              visit_external_id: 'LK-BAD-03',
              errors: [{ path: 'Sheet3!A4', reason: 'Thiếu mã hồ sơ nguồn.' }],
              fields: [],
            },
          ],
        });
      }

      if (pathname === '/api/forms/imports/commit' && method === 'POST') {
        if (actor.role !== 'doctor') return sendJson(res, 403, { detail: 'Chỉ Bác sĩ được xác nhận nhập HIS.' });
        if (body.preview_token !== 'hmac-preview-token-v1') {
          return sendJson(res, 400, { detail: 'preview_token không hợp lệ.' });
        }
        const result = {
          batch_id: 'batch-0001',
          written_records: body.records.length,
          written_fields: 3,
          skipped_fields: 1,
          unselected_records: 1,
          replayed: false,
          source_name: 'his-two-cases.xlsx',
          mapping_version: 'his_sheet3_v1',
          records: [
            {
              index: 0,
              patient_code: '000SYN01',
              target_patient_code: 'BN-00001',
              target_patient_name: 'DEMO-001',
              target_occurred_at: '2026-11-19T02:00:00Z',
              visit_external_id: 'LK-2026-03',
              visit_id: visitLatest.id,
              written_fields: 2,
              revision: visitLatest.revision + 1,
              skipped: [{ field: 'can_nang', reason: 'keep' }],
            },
            {
              index: 1,
              patient_code: 'SYN-NEW-02',
              target_patient_code: 'BN-00003',
              target_patient_name: 'Người bệnh giả lập mới',
              target_occurred_at: '2026-11-19T04:00:00Z',
              visit_external_id: 'LK-HIS-02',
              visit_id: visitLatest.id,
              written_fields: 1,
              revision: 1,
              skipped: [],
            },
          ],
          unselected: [
            { index: 2, status: 'error', errors: [{ path: 'Sheet3!A4', reason: 'Thiếu mã hồ sơ nguồn.' }] },
          ],
        };
        importHistory.unshift({
          id: 'imp-hist-1',
          source_kind: 'excel',
          mapping: { sheet: 'Sheet3', profile: 'his_sheet3_v1' },
          mapping_version: 'his_sheet3_v1',
          result,
          created_at: '2026-11-19T09:40:00Z',
        });
        return sendJson(res, 200, result);
      }

      if (pathname === '/api/forms/imports/history' && method === 'GET') {
        return sendJson(res, 200, importHistory);
      }

      return sendJson(res, 404, { detail: `Mock route not found: ${method} ${pathname}` });
    }

    // Serve static files from WEB_ROOT with real forms-v2 security & CSP headers (matching src/gateway/main.py)
    const safeRel = pathname === '/' ? '/forms-v2.html' : pathname;
    const resolved = path.resolve(WEB_ROOT, '.' + safeRel);
    if (!resolved.startsWith(WEB_ROOT) || !fs.existsSync(resolved) || fs.statSync(resolved).isDirectory()) {
      if (pathname !== '/favicon.ico') static404s.push(pathname);
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not Found');
      return;
    }
    const ext = path.extname(resolved).toLowerCase();
    const headers = {
      'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
    };
    if (safeRel === '/forms-v2.html' || safeRel.startsWith('/forms-v2/')) {
      headers['Content-Security-Policy'] =
        "default-src 'self'; script-src 'self'; style-src 'self'; font-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'";
      headers['X-Content-Type-Options'] = 'nosniff';
      headers['Referrer-Policy'] = 'no-referrer';
      if (safeRel === '/forms-v2.html') headers['Cache-Control'] = 'no-store';
    } else {
      headers['Cache-Control'] = 'no-store';
    }
    res.writeHead(200, headers);
    fs.createReadStream(resolved).pipe(res);
  }

  return {
    handleRequest,
    requestLog,
    static404s,
    faults,
    activeTokens,
    visitLatest,
    patients,
  };
}

class CDPClient {
  constructor(ws) {
    this.ws = ws;
    this.nextId = 1;
    this.pending = new Map();
    this.exceptions = [];
    this.consoleErrors = [];
    this.cspViolations = [];
    this.dialogs = [];
    this.dialogAccept = true;

    ws.addEventListener('message', event => {
      const msg = JSON.parse(String(event.data));
      if (msg.id) {
        const entry = this.pending.get(msg.id);
        if (entry) {
          this.pending.delete(msg.id);
          if (msg.error) entry.reject(new Error(`${entry.method}: ${msg.error.message}`));
          else entry.resolve(msg.result);
        }
        return;
      }
      if (msg.method === 'Runtime.exceptionThrown') {
        const d = msg.params?.exceptionDetails;
        this.exceptions.push(d?.exception?.description || d?.text || JSON.stringify(d));
      } else if (msg.method === 'Log.entryAdded') {
        const entry = msg.params?.entry || {};
        const txt = entry.text || '';
        if (/Content Security Policy|Refused to (apply inline style|execute inline script|load)/i.test(txt)) {
          this.cspViolations.push(txt);
        } else if (entry.level === 'error') {
          // Ignore expected HTTP 401/409/422/503 resource errors caused by deliberate fault tests
          if (!/status of (401|403|409|422|503)|ERR_EMPTY_RESPONSE|ERR_CONNECTION_RESET|Failed to load resource/.test(txt)) {
            this.consoleErrors.push(txt);
          }
        }
      } else if (msg.method === 'Runtime.consoleAPICalled') {
        const txt = (msg.params?.args || []).map(a => a.value ?? a.description ?? '').join(' ');
        if (/Content Security Policy|Refused to (apply inline style|execute inline script|load)/i.test(txt)) {
          this.cspViolations.push(txt);
        } else if (msg.params?.type === 'error') {
          this.consoleErrors.push(txt);
        }
      } else if (msg.method === 'Page.javascriptDialogOpening') {
        this.dialogs.push({ type: msg.params.type, message: msg.params.message });
        this.send('Page.handleJavaScriptDialog', { accept: this.dialogAccept }).catch(() => {});
      }
    });
  }

  send(method, params = {}) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject, method });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async eval(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (res.exceptionDetails) {
      throw new Error(`Browser eval failed: ${res.exceptionDetails.exception?.description || res.exceptionDetails.text}`);
    }
    return res.result?.value;
  }

  async waitFor(expression, description, timeoutMs = 8000) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const val = await this.eval(expression);
      if (val) return val;
      await new Promise(r => setTimeout(r, 25));
    }
    throw new Error(`Timed out waiting for: ${description}`);
  }

  async setViewport({ width, height, mobile }) {
    await this.send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 1,
      mobile,
    });
    await this.eval('new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))');
  }

  async assertResponsive(screenLabel) {
    const report = {};
    for (const vp of VIEWPORTS) {
      await this.setViewport(vp);
      const metrics = await this.eval(`(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        bodyScrollWidth: document.body.scrollWidth,
        overflowing: [...document.querySelectorAll('body *')].filter(el => {
          const style = getComputedStyle(el);
          if (style.display === 'none' || style.visibility === 'hidden') return false;
          if (el.closest('.table-scroll') && el.tagName === 'TABLE') return false;
          const r = el.getBoundingClientRect();
          return r.width > 0 && r.right > document.documentElement.clientWidth + 1 && !el.closest('.table-scroll,.group-nav,.sidebar nav');
        }).slice(0, 5).map(el => el.tagName + '.' + el.className + '(r=' + Math.round(el.getBoundingClientRect().right) + ')')
      }))()`);
      assert(
        metrics.scrollWidth <= metrics.clientWidth,
        `Horizontal overflow on ${screenLabel} at ${vp.name}: scrollWidth=${metrics.scrollWidth} > clientWidth=${metrics.clientWidth} (elements: ${metrics.overflowing.join(', ')})`
      );
      report[vp.name] = `${metrics.scrollWidth}/${metrics.clientWidth}`;
    }
    await this.setViewport(VIEWPORTS[0]);
    return report;
  }

  async close() {
    try { this.ws.close(); } catch { /* ignore */ }
  }
}

async function launchBrowser() {
  const exe = findBrowser();
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'forms-v2-cdp-'));
  const proc = spawn(exe, [
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-background-networking',
    '--remote-debugging-port=0',
    `--user-data-dir=${userDataDir}`,
    'about:blank',
  ], { stdio: ['ignore', 'pipe', 'pipe'] });

  const devToolsUrl = await new Promise((resolve, reject) => {
    let stderr = '';
    const timer = setTimeout(() => reject(new Error(`Chrome startup timed out. stderr:\n${stderr}`)), 15000);
    proc.stderr.on('data', chunk => {
      stderr += chunk.toString('utf8');
      const m = stderr.match(/DevTools listening on (ws:\/\/[^\s]+)/);
      if (m) {
        clearTimeout(timer);
        resolve(m[1]);
      }
    });
    proc.on('exit', code => {
      clearTimeout(timer);
      reject(new Error(`Chrome exited early (${code}). stderr:\n${stderr}`));
    });
  });

  const port = new URL(devToolsUrl).port;
  const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  const pageTarget = targets.find(t => t.type === 'page') || targets[0];
  if (!pageTarget?.webSocketDebuggerUrl) throw new Error('No page target found in Chrome DevTools.');

  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve, { once: true });
    ws.addEventListener('error', reject, { once: true });
  });

  const cdp = new CDPClient(ws);
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('Log.enable');
  await cdp.send('DOM.enable');
  await cdp.send('Page.addScriptToEvaluateOnNewDocument', {
    source: `
      window.__cspViolations = [];
      document.addEventListener('securitypolicyviolation', event => {
        window.__cspViolations.push({
          violatedDirective: event.violatedDirective,
          effectiveDirective: event.effectiveDirective,
          blockedURI: event.blockedURI,
          sourceFile: event.sourceFile,
          lineNumber: event.lineNumber,
        });
      });
    `,
  });

  async function cleanup() {
    await cdp.close();
    try { proc.kill('SIGTERM'); } catch { /* ignore */ }
    await new Promise(resolve => {
      if (proc.exitCode !== null) return resolve();
      const t = setTimeout(() => { try { proc.kill('SIGKILL'); } catch {} resolve(); }, 3000);
      proc.once('exit', () => { clearTimeout(t); resolve(); });
    });
    try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch { /* ignore */ }
  }

  return { cdp, cleanup };
}

async function runSuite() {
  const backend = createMockBackend();
  const server = http.createServer((req, res) => {
    Promise.resolve(backend.handleRequest(req, res)).catch(err => {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ detail: String(err) }));
    });
  });

  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(PORT, '127.0.0.1', resolve);
  });

  const tmpFilesDir = fs.mkdtempSync(path.join(os.tmpdir(), 'forms-v2-files-'));
  const sampleXlsx = path.join(tmpFilesDir, 'his-two-cases.xlsx');
  const badJson = path.join(tmpFilesDir, 'bad-payload.json');
  fs.writeFileSync(sampleXlsx, Buffer.from('PK\x03\x04synthetic-his-xlsx-content', 'binary'));
  fs.writeFileSync(badJson, '{"not":"allowed"}', 'utf8');

  let browser = null;
  let passed = 0;
  const responsiveMatrix = {};

  async function test(name, fn) {
    await fn();
    passed += 1;
    console.log(`PASS ${name}`);
  }

  try {
    browser = await launchBrowser();
    const { cdp } = browser;
    await cdp.setViewport(VIEWPORTS[0]);

    // -------------------------------------------------------------------------
    // 1. Unified Login screen (#login) + password toggle + error handling + responsive
    // -------------------------------------------------------------------------
    await test('1. #login unified form, no role-switch, password toggle, wrong credentials, responsive', async () => {
      await cdp.send('Page.navigate', { url: `${BASE_URL}/forms-v2.html` });
      await cdp.waitFor('Boolean(document.getElementById("login-form"))', '#login-form rendered');

      const loginCheck = await cdp.eval(`(() => ({
        forms: document.querySelectorAll('form').length,
        hasRoleSwitch: Boolean(document.querySelector('#role-switch, #role-switch-mobile, [name="role"]')),
        hasDemoPreview: Boolean(document.querySelector('[data-action="demo-preview"]')),
        hasDesignTab: Boolean(document.querySelector('[href="#design"], [data-nav="design"]')),
      }))()`);
      assert.equal(loginCheck.forms, 1);
      assert.equal(loginCheck.hasRoleSwitch, false);
      assert.equal(loginCheck.hasDemoPreview, false);
      assert.equal(loginCheck.hasDesignTab, false);

      // Password toggle preserves input value
      const toggleRes = await cdp.eval(`(() => {
        const u = document.getElementById('username');
        const p = document.getElementById('password');
        const btn = document.querySelector('[data-action="toggle-password"]');
        u.value = 'doctor_demo';
        p.value = 'wrong-pass';
        btn.click();
        const afterShow = { type: p.type, value: p.value, text: btn.textContent };
        btn.click();
        const afterHide = { type: p.type, value: p.value, text: btn.textContent };
        return { afterShow, afterHide };
      })()`);
      assert.deepEqual(toggleRes.afterShow, { type: 'text', value: 'wrong-pass', text: 'Ẩn' });
      assert.deepEqual(toggleRes.afterHide, { type: 'password', value: 'wrong-pass', text: 'Hiện' });

      // Wrong password shows error & keeps values
      await cdp.eval(`document.querySelector('#login-form [type="submit"]').click()`);
      await cdp.waitFor('!document.getElementById("notice")?.hidden', 'login error notice visible');
      const errState = await cdp.eval(`({
        notice: document.getElementById('notice').textContent,
        username: document.getElementById('username').value,
        password: document.getElementById('password').value,
        submitDisabled: document.querySelector('#login-form [type="submit"]').disabled,
      })`);
      assert.match(errState.notice, /Sai tên đăng nhập/);
      assert.equal(errState.username, 'doctor_demo');
      assert.equal(errState.password, 'wrong-pass');
      assert.equal(errState.submitDisabled, false);

      responsiveMatrix['#login'] = await cdp.assertResponsive('#login');
    });

    // -------------------------------------------------------------------------
    // 2. Doctor login -> #patients, search, latest_visit vs created_at, responsive
    // -------------------------------------------------------------------------
    await test('2. Doctor login -> #patients, search filter, latest visit (not created_at), responsive', async () => {
      await cdp.eval(`(() => {
        document.getElementById('username').value = 'doctor_demo';
        document.getElementById('password').value = 'doc-password-123';
        document.querySelector('#login-form [type="submit"]').click();
      })()`);
      await cdp.waitFor('document.getElementById("main")?.dataset.page === "patients" && document.querySelectorAll("#patient-rows tr").length === 2', '#patients loaded');

      const pageInfo = await cdp.eval(`(() => {
        const navs = [...document.querySelectorAll('.sidebar nav a')].map(a => a.dataset.nav);
        const rows = [...document.querySelectorAll('#patient-rows tr')].map(tr => tr.textContent);
        return {
          navs,
          hasCreateBtn: Boolean(document.querySelector('[data-patient-action="new-patient"]')),
          hasFieldsBtn: Boolean(document.querySelector('[data-nav="fields"]')),
          rows,
          hasToken: Boolean(sessionStorage.getItem('forms_token')),
        };
      })()`);
      assert.deepEqual(pageInfo.navs, ['patients', 'import']);
      assert.equal(pageInfo.hasCreateBtn, true);
      assert.equal(pageInfo.hasFieldsBtn, false);
      assert.equal(pageInfo.hasToken, true);
      assert(pageInfo.rows[0].includes('BN-00001') && pageInfo.rows[0].includes('LK-2026-03'));
      // BN-00002 has created_at 2024-05-05 but latest_visit_at null -> must show Chưa có lượt khám and NOT 2024
      assert(pageInfo.rows[1].includes('BN-00002') && pageInfo.rows[1].includes('Chưa có lượt khám') && !pageInfo.rows[1].includes('2024'));

      // Search filtering + empty state + clear search
      await cdp.eval(`(() => {
        const s = document.getElementById('patient-search');
        s.value = 'BN-00001';
        s.dispatchEvent(new Event('input', { bubbles: true }));
      })()`);
      assert.equal(await cdp.eval('document.querySelectorAll("#patient-rows tr").length'), 1);

      await cdp.eval(`(() => {
        const s = document.getElementById('patient-search');
        s.value = 'KHONG-TON-TAI';
        s.dispatchEvent(new Event('input', { bubbles: true }));
      })()`);
      assert.match(await cdp.eval('document.getElementById("patient-rows").textContent'), /Không tìm thấy/);
      await cdp.eval(`document.querySelector('[data-patient-action="clear-search"]').click()`);
      assert.equal(await cdp.eval('document.querySelectorAll("#patient-rows tr").length'), 2);

      responsiveMatrix['#patients'] = await cdp.assertResponsive('#patients');
    });

    // -------------------------------------------------------------------------
    // 3. Create Patient Modal: synthetic display_name validation, leading zeros, responsive
    // -------------------------------------------------------------------------
    await test('3. Create patient modal: pattern validation, leading zeros retained, responsive', async () => {
      await cdp.eval(`document.querySelector('[data-patient-action="new-patient"]').click()`);
      await cdp.waitFor('Boolean(document.querySelector("dialog[open] #patient-name"))', 'create patient dialog open');

      responsiveMatrix['modal-create-patient'] = await cdp.assertResponsive('modal-create-patient');

      // Real full name with spaces rejected before fetch
      const beforePosts = backend.requestLog.filter(r => r.method === 'POST' && r.pathname === '/api/forms/patients').length;
      await cdp.eval(`(() => {
        const d = document.querySelector('dialog[open]');
        d.querySelector('#patient-name').value = 'Nguyễn Văn Thật';
        d.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      })()`);
      await cdp.waitFor('!document.querySelector("dialog[open] .dialog-error")?.hidden', 'pattern validation error shown');
      const afterBadPosts = backend.requestLog.filter(r => r.method === 'POST' && r.pathname === '/api/forms/patients').length;
      assert.equal(afterBadPosts, beforePosts, 'Invalid display_name must not hit POST /patients');

      // Valid synthetic patient with empty display_name (server assigns BN-00003) and leading zeros
      await cdp.eval(`(() => {
        const d = document.querySelector('dialog[open]');
        d.querySelector('#patient-name').value = '';
        d.querySelector('#patient-dob').value = '1980-06-15';
        d.querySelector('#patient-dob').dispatchEvent(new Event('input', { bubbles: true }));
        d.querySelector('#patient-sex').value = 'male';
        d.querySelector('#patient-insurance').value = '00112233';
        d.querySelector('#external-id').value = '000456';
        d.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      })()`);
      await cdp.waitFor('document.getElementById("main")?.dataset.page === "profile"', 'navigated to created patient #profile');

      const postReq = backend.requestLog.filter(r => r.method === 'POST' && r.pathname === '/api/forms/patients').at(-1);
      assert.equal(postReq.body.insurance_number, '00112233');
      assert.equal(postReq.body.external_id, '000456');
      assert.equal(Object.hasOwn(postReq.body, 'display_name'), false);
    });

    // -------------------------------------------------------------------------
    // 4. #profile: timeline order, summary_visits provenance, BMI strip, edit demographics & history
    // -------------------------------------------------------------------------
    await test('4. #profile: timeline order, summary_visits provenance, demographics edit & history, responsive', async () => {
      await cdp.eval(`document.querySelector('[data-profile-action="back-patients"]').click()`);
      await cdp.waitFor('document.getElementById("main")?.dataset.page === "patients"', 'back on #patients');

      await cdp.eval(`document.querySelector('[data-patient-id="11111111-1111-4111-8111-111111111111"]').click()`);
      await cdp.waitFor('document.getElementById("main")?.dataset.page === "profile" && document.querySelector("h1")?.textContent.includes("BN-00001")', 'BN-00001 #profile loaded');

      const prof = await cdp.eval(`(() => {
        const sources = [...document.querySelectorAll('.source')].map(el => el.textContent.trim());
        const measures = [...document.querySelectorAll('.measure strong')].map(el => el.textContent.trim());
        const timelineItems = [...document.querySelectorAll('.timeline li strong')].map(el => el.textContent.trim());
        const text = document.getElementById('main').textContent;
        return { sources, measures, timelineItems, text };
      })()`);

      // Separate provenance per summary_visits section: disease (LK-2026-01), latest measures (LK-2026-03), medications (LK-2026-02), allergy (LK-2026-03)
      assert(prof.sources.some(s => s.includes('LK-2026-01')), 'disease provenance missing LK-2026-01');
      assert(prof.sources.some(s => s.includes('LK-2026-02')), 'medications provenance missing LK-2026-02');
      assert(prof.sources.some(s => s.includes('LK-2026-03')), 'latest/allergy provenance missing LK-2026-03');
      assert.deepEqual(prof.measures, ['168', '86', '30,47']);
      assert.deepEqual(prof.timelineItems, ['LK-2026-03', 'LK-2026-02', 'LK-2026-01', 'LK-UNDATED']);
      assert(prof.text.includes('Chưa có thời điểm khám'));
      assert(prof.text.includes('Dị ứng penicillin'));

      // Edit demographics modal
      await cdp.eval(`document.querySelector('[data-profile-action="edit-patient"]').click()`);
      await cdp.waitFor('Boolean(document.querySelector("dialog[open] #patient-name"))', 'edit patient dialog open');
      await cdp.eval(`(() => {
        const d = document.querySelector('dialog[open]');
        d.querySelector('#patient-name').value = 'DEMO-001-UPDATED';
        d.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      })()`);
      await cdp.waitFor('!document.querySelector("dialog[open]") && document.getElementById("main").textContent.includes("DEMO-001-UPDATED")', 'demographics updated');
      const patchPat = backend.requestLog.filter(r => r.method === 'PATCH' && r.pathname.startsWith('/api/forms/patients/')).at(-1);
      assert.equal(patchPat.body.expected_revision, 2);
      assert(patchPat.body.mutation_id);

      // Patient history modal
      await cdp.eval(`document.querySelector('[data-profile-action="patient-history"]').click()`);
      await cdp.waitFor('Boolean(document.querySelector("dialog[open]")) && document.querySelector("dialog[open]").textContent.includes("DEMO-001-UPDATED")', 'patient history modal open');
      await cdp.eval(`document.querySelector('dialog[open] [data-close]').click()`);
      await cdp.waitFor('!document.querySelector("dialog[open]")', 'patient history modal closed');

      responsiveMatrix['#profile'] = await cdp.assertResponsive('#profile');
    });

    // -------------------------------------------------------------------------
    // 5. #encounter: New empty visit isolation (no carryover of height/weight/BMI)
    // -------------------------------------------------------------------------
    await test('5. New visit isolation: fresh visit does NOT copy height/weight from prior visit, BMI is Chưa có dữ liệu', async () => {
      await cdp.eval(`document.querySelector('[data-profile-action="new-visit"]').click()`);
      await cdp.waitFor('Boolean(document.querySelector("dialog[open] #visit-code"))', 'new visit dialog open');
      await cdp.eval(`(() => {
        const d = document.querySelector('dialog[open]');
        d.querySelector('#visit-code').value = 'LK-NEW-EMPTY';
        d.querySelector('#new-visit-type').value = 'followup';
        d.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      })()`);
      await cdp.waitFor('document.getElementById("main")?.dataset.page === "encounter" && document.getElementById("main").textContent.includes("LK-NEW-EMPTY")', 'new empty visit opened');

      const newVisitState = await cdp.eval(`({
        height: document.getElementById('f-chieu_cao')?.value,
        weight: document.getElementById('f-can_nang')?.value,
        bmi: document.getElementById('bmi-value')?.textContent.trim(),
      })`);
      assert.equal(newVisitState.height, '');
      assert.equal(newVisitState.weight, '');
      assert.equal(newVisitState.bmi, 'Chưa có dữ liệu');

      // Also verify medications emptyList ([]) vs nullList (null) and removeItem shifting errors
      await cdp.eval(`document.querySelector('[data-group="Thuốc đang sử dụng"]').click()`);
      await cdp.waitFor('Boolean(document.querySelector("[data-empty-list=danh_sach_thuoc]"))', 'medications list controls rendered');
      await cdp.eval(`document.querySelector('[data-empty-list="danh_sach_thuoc"]').click()`);
      await cdp.waitFor('document.getElementById("main").textContent.includes("Không có mục")', 'emptyList sets []');
      await cdp.eval(`document.querySelector('[data-visit-action="save"]').click()`);
      await cdp.waitFor('document.getElementById("notice")?.textContent.includes("Đã lưu dữ liệu")', 'saved empty medication list []');
      const emptyMedPatch = backend.requestLog.filter(r => r.method === 'PATCH' && r.pathname.includes('/visits/')).at(-1);
      assert.deepEqual(emptyMedPatch.body.values.danh_sach_thuoc, []);

      await cdp.eval(`document.querySelector('[data-null-list="danh_sach_thuoc"]').click()`);
      await cdp.waitFor('document.getElementById("main").textContent.includes("Chưa có dữ liệu")', 'nullList sets null');
      await cdp.eval(`document.querySelector('[data-visit-action="save"]').click()`);
      await cdp.waitFor('document.getElementById("notice")?.textContent.includes("Đã lưu dữ liệu")', 'saved null medication list');
      const nullMedPatch = backend.requestLog.filter(r => r.method === 'PATCH' && r.pathname.includes('/visits/')).at(-1);
      assert.equal(nullMedPatch.body.values.danh_sach_thuoc, null);
    });

    // -------------------------------------------------------------------------
    // 6. #encounter: Pinned snapshot, BMI math (30,47 -> 29,76 -> Chưa có dữ liệu),
    //    data types (null/false/0/[]), badInput block, meds 2-col vs 1-col, results v2 units,
    //    mutation_id retry + 401 re-auth keeping draft, NO bmi in PATCH, visit history provenance
    // -------------------------------------------------------------------------
    await test('6. #encounter: pinned snapshot, BMI, null/false/0/[], badInput, meds 2-col/1-col, retry & 401 re-auth, history provenance', async () => {
      // Navigate back to BN-00001 profile and open visitLatest (pinned v1)
      await cdp.eval(`document.querySelector('[data-visit-action="profile"]').click()`);
      await cdp.waitFor('document.getElementById("main")?.dataset.page === "profile"', 'returned to #profile');
      await cdp.eval(`document.querySelector('[data-visit-id="${backend.visitLatest.id}"]').click()`);
      await cdp.waitFor('document.getElementById("main")?.dataset.page === "encounter" && document.getElementById("bmi-value")?.textContent.trim() === "30,47"', 'pinned visit opened with BMI 30,47');

      // Verify pinned field label (NOT global catalog label), snapshot derived tuoi/gioi_tinh, unavailable collapsed, no obesity/AI label
      const encChecks = await cdp.eval(`(() => {
        const mainText = document.getElementById('main').textContent;
        const bmiBox = document.querySelector('.bmi-result')?.textContent || '';
        const unavailableDetails = document.querySelector('details.unavailable-section');
        return {
          hasPinnedLabel: mainText.includes('Cân nặng (ghim v1)'),
          hasGlobalLabel: mainText.includes('Cân nặng (danh mục mới)'),
          tuoiInputExists: Boolean(document.querySelector('[data-field="tuoi"]')),
          gioiTinhInputExists: Boolean(document.querySelector('[data-field="gioi_tinh"]')),
          derivedTuoi: document.getElementById('derived-tuoi')?.textContent.trim(),
          derivedSex: document.getElementById('derived-gioi_tinh')?.textContent.trim(),
          bmiText: document.getElementById('bmi-value')?.textContent.trim(),
          bmiHasClassification: /béo phì|thừa cân|gầy|khuyến nghị/i.test(bmiBox),
          unavailableCollapsed: Boolean(unavailableDetails && !unavailableDetails.open),
        };
      })()`);
      assert.equal(encChecks.hasPinnedLabel, true);
      assert.equal(encChecks.hasGlobalLabel, false);
      assert.equal(encChecks.tuoiInputExists, false);
      assert.equal(encChecks.gioiTinhInputExists, false);
      assert.equal(encChecks.derivedTuoi, '56 tuổi');
      assert.equal(encChecks.derivedSex, 'Nữ');
      assert.equal(encChecks.bmiText, '30,47');
      assert.equal(encChecks.bmiHasClassification, false);
      assert.equal(encChecks.unavailableCollapsed, true);

      // Editing occurred_at updates derived age live (DOB 1970-03-15 -> on 2025-03-14 age is 54, on 2026-11-19 age is 56)
      await cdp.eval(`(() => {
        const occ = document.getElementById('visit-occurred');
        occ.value = '2025-03-14T09:00';
        occ.dispatchEvent(new Event('input', { bubbles: true }));
      })()`);
      assert.equal(await cdp.eval('document.getElementById("derived-tuoi").textContent.trim()'), '54 tuổi');
      assert(await cdp.eval('document.getElementById("context-age").textContent.includes("54 tuổi")'));
      // Restore original occurred_at
      await cdp.eval(`(() => {
        const occ = document.getElementById('visit-occurred');
        occ.value = '2026-11-19T09:00';
        occ.dispatchEvent(new Event('input', { bubbles: true }));
      })()`);
      assert.equal(await cdp.eval('document.getElementById("derived-tuoi").textContent.trim()'), '56 tuổi');

      // BMI live update: 168 / 84 -> 29,76; cleared -> Chưa có dữ liệu
      await cdp.eval(`(() => {
        const w = document.getElementById('f-can_nang');
        w.value = '84';
        w.dispatchEvent(new Event('input', { bubbles: true }));
      })()`);
      assert.equal(await cdp.eval('document.getElementById("bmi-value").textContent.trim()'), '29,76');

      await cdp.eval(`(() => {
        const w = document.getElementById('f-can_nang');
        w.value = '';
        w.dispatchEvent(new Event('input', { bubbles: true }));
      })()`);
      assert.equal(await cdp.eval('document.getElementById("bmi-value").textContent.trim()'), 'Chưa có dữ liệu');

      // Real browser badInput test on <input type="number"> using CDP Input.insertText('e')
      await cdp.eval(`(() => {
        const h = document.getElementById('f-chieu_cao');
        h.focus();
        h.value = '';
      })()`);
      await cdp.send('Input.insertText', { text: 'e' });
      const badInputState = await cdp.eval(`(() => {
        const h = document.getElementById('f-chieu_cao');
        return {
          badInput: h.validity.badInput,
          value: h.value,
          ariaInvalid: h.getAttribute('aria-invalid'),
          errorText: document.getElementById('error-chieu_cao')?.textContent.trim(),
          bmi: document.getElementById('bmi-value')?.textContent.trim(),
        };
      })()`);
      assert.equal(badInputState.badInput, true, 'Browser should report validity.badInput=true for "e"');
      assert.equal(badInputState.ariaInvalid, 'true');
      assert(badInputState.errorText.length > 0);
      assert.equal(badInputState.bmi, 'Chưa có dữ liệu');

      // Attempt save while badInput active -> MUST be blocked (0 PATCH requests)
      const patchBeforeBad = backend.requestLog.filter(r => r.method === 'PATCH' && r.pathname.includes('/visits/')).length;
      await cdp.eval(`document.querySelector('[data-visit-action="save"]').click()`);
      await cdp.waitFor('document.getElementById("notice")?.textContent.includes("không hợp lệ")', 'save blocked notice');
      assert.equal(backend.requestLog.filter(r => r.method === 'PATCH' && r.pathname.includes('/visits/')).length, patchBeforeBad);

      // Fix chieu_cao = 168 and can_nang = 84 -> error clears, BMI = 29,76
      await cdp.eval(`(() => {
        const h = document.getElementById('f-chieu_cao');
        h.value = '168';
        h.dispatchEvent(new Event('input', { bubbles: true }));
        const w = document.getElementById('f-can_nang');
        w.value = '84';
        w.dispatchEvent(new Event('input', { bubbles: true }));
      })()`);
      assert.equal(await cdp.eval('document.getElementById("f-chieu_cao").getAttribute("aria-invalid")'), 'false');
      assert.equal(await cdp.eval('document.getElementById("bmi-value").textContent.trim()'), '29,76');

      // Verify .measure-edit is 3 columns across at desktop 1280px (matching preview 04)
      await cdp.setViewport(VIEWPORTS[0]);
      const measureTracks = await cdp.eval(`getComputedStyle(document.querySelector('.measure-edit')).gridTemplateColumns.trim().split(/\\s+/).length`);
      assert.equal(measureTracks, 3, '.measure-edit must render 3 columns horizontally at 1280px');

      responsiveMatrix['#encounter-base'] = await cdp.assertResponsive('#encounter (Thông tin nền)');

      // Group 2: Triệu chứng -> boolean false vs null, numeric 0 vs null, mmHg unit present
      await cdp.eval(`document.querySelector('[data-group="Triệu chứng và dấu hiệu"]').click()`);
      await cdp.waitFor('Boolean(document.getElementById("f-kho_tho"))', 'Triệu chứng group rendered');
      const symChecks = await cdp.eval(`(() => {
        const bpLabel = document.querySelector('label[for="f-ha_nam_ngoi_tam_thu"]')?.textContent || '';
        const kt = document.getElementById('f-kho_tho');
        kt.value = 'false';
        kt.dispatchEvent(new Event('change', { bubbles: true }));
        const bp = document.getElementById('f-ha_nam_ngoi_tam_thu');
        bp.value = '0';
        bp.dispatchEvent(new Event('input', { bubbles: true }));
        return { bpLabel };
      })()`);
      assert(symChecks.bpLabel.includes('mmHg'));

      // Group 3: Tiền sử -> multiselect known empty array []
      await cdp.eval(`document.querySelector('[data-group="Tiền sử và bệnh đồng mắc"]').click()`);
      await cdp.waitFor('Boolean(document.querySelector("[data-multi-known=yeu_to_nguy_co]"))', 'Tiền sử group rendered');
      await cdp.eval(`(() => {
        const cb = document.querySelector('[data-multi-known="yeu_to_nguy_co"]');
        cb.checked = true;
        cb.dispatchEvent(new Event('change', { bubbles: true }));
      })()`);

      // Group 4: Chỉ số nguồn HIS -> must NOT fabricate mmHg unit
      await cdp.eval(`document.querySelector('[data-group="Chỉ số nguồn HIS"]').click()`);
      await cdp.waitFor('Boolean(document.getElementById("f-his_huyet_ap_cao"))', 'HIS group rendered');
      const hisLabel = await cdp.eval('document.querySelector("label[for=f-his_huyet_ap_cao]").textContent');
      assert(!hisLabel.includes('mmHg'), 'HIS blood pressure field must not fabricate mmHg unit');

      // Group 5: Thuốc đang sử dụng -> check 2 columns at 1280px, 1 column at 390px and 320px
      await cdp.eval(`document.querySelector('[data-group="Thuốc đang sử dụng"]').click()`);
      await cdp.waitFor('Boolean(document.querySelector(".med-columns"))', 'Thuốc group rendered');

      await cdp.setViewport(VIEWPORTS[0]); // 1280px
      const medDesktop = await cdp.eval(`(() => {
        const card = document.querySelector('fieldset.repeat-card.med-card');
        const cardCs = getComputedStyle(card);
        const cols = document.querySelector('.med-columns');
        const cs = getComputedStyle(cols);
        const tracks = cs.gridTemplateColumns.trim().split(/\\s+/).length;
        const leftRect = cols.children[0].getBoundingClientRect();
        const rightRect = cols.children[1].getBoundingClientRect();
        return {
          tracks,
          sideBySide: leftRect.left < rightRect.left && Math.abs(leftRect.top - rightRect.top) < 5,
          cardBorderTop: cardCs.borderTopWidth,
          cardPaddingTop: cardCs.paddingTop,
        };
      })()`);
      assert.equal(medDesktop.tracks, 2, 'Medications must be 2 columns at 1280px');
      assert.equal(medDesktop.sideBySide, true, 'Medications columns must sit side-by-side at 1280px');
      assert.notEqual(medDesktop.cardBorderTop, '0px', 'fieldset.repeat-card.med-card must keep visible border');
      assert.notEqual(medDesktop.cardPaddingTop, '0px', 'fieldset.repeat-card.med-card must keep card padding');

      for (const mobileVp of [VIEWPORTS[1], VIEWPORTS[2]]) {
        await cdp.setViewport(mobileVp);
        const medMobile = await cdp.eval(`(() => {
          const cols = document.querySelector('.med-columns');
          const cs = getComputedStyle(cols);
          const tracks = cs.gridTemplateColumns.trim().split(/\\s+/).length;
          const leftRect = cols.children[0].getBoundingClientRect();
          const rightRect = cols.children[1].getBoundingClientRect();
          return { tracks, stacked: rightRect.top >= leftRect.bottom - 1 };
        })()`);
        assert.equal(medMobile.tracks, 1, `Medications must be 1 column at ${mobileVp.name}`);
        assert.equal(medMobile.stacked, true, `Medications columns must stack vertically at ${mobileVp.name}`);
      }
      responsiveMatrix['#encounter-meds'] = await cdp.assertResponsive('#encounter (Thuốc)');

      // Group 6: Cận lâm sàng -> results v2 selecting test_code locks unit to confirmed list
      await cdp.eval(`document.querySelector('[data-group="Cận lâm sàng và theo dõi"]').click()`);
      await cdp.waitFor('Boolean(document.getElementById("f-bnp_ntprobnp-0-test_code"))', 'Cận lâm sàng rendered');
      await cdp.eval(`(() => {
        const sel = document.getElementById('f-bnp_ntprobnp-0-test_code');
        sel.value = 'BNP';
        sel.dispatchEvent(new Event('change', { bubbles: true }));
      })()`);
      await cdp.waitFor('document.getElementById("f-bnp_ntprobnp-0-unit")?.tagName === "SELECT"', 'unit converted to SELECT for BNP');
      const labCheck = await cdp.eval(`({
        name: document.getElementById('f-bnp_ntprobnp-0-name')?.value,
        value: document.getElementById('f-bnp_ntprobnp-0-value')?.value,
        unit: document.getElementById('f-bnp_ntprobnp-0-unit')?.value,
        unitOptions: [...document.getElementById('f-bnp_ntprobnp-0-unit').options].map(o => o.value),
      })`);
      assert.equal(labCheck.name, 'NT-proBNP phòng xét nghiệm');
      assert.equal(labCheck.value, '420');
      assert.equal(labCheck.unit, 'pg/mL');
      assert.deepEqual(labCheck.unitOptions, ['', 'pg/mL', 'ng/L']);

      // Save flow: Fault 0 = 422 with detail.fields -> marks inline error and keeps draft
      backend.faults.nextVisitPatch = { status: 422, body: { detail: { fields: { can_nang: 'Lỗi kiểm tra từ máy chủ' } } } };
      await cdp.eval(`document.querySelector('[data-visit-action="save"]').click()`);
      await cdp.waitFor('document.getElementById("notice")?.textContent.includes("Lỗi kiểm tra từ máy chủ")', '422 inline field error shown');
      // Switch back to Thông tin nền to verify inline error & clear it by re-entering 84
      await cdp.eval(`document.querySelector('[data-group="Thông tin nền"]').click()`);
      await cdp.waitFor('document.getElementById("error-can_nang")?.textContent.includes("Lỗi kiểm tra từ máy chủ")', 'inline error persisted across group');
      await cdp.eval(`(() => {
        const w = document.getElementById('f-can_nang');
        w.value = '84';
        w.dispatchEvent(new Event('input', { bubbles: true }));
      })()`);
      assert.equal(await cdp.eval('document.getElementById("error-can_nang").textContent.trim()'), '');

      // Save flow: Fault 1 = 503 -> preserves draft & mutation_id
      backend.faults.nextVisitPatch = { status: 503, body: { detail: 'Tạm thời quá tải' } };
      await cdp.eval(`document.querySelector('[data-visit-action="save"]').click()`);
      await cdp.waitFor('document.getElementById("save-status")?.textContent.includes("Bản nháp được giữ")', '503 handled with draft kept');
      const firstPatch = backend.requestLog.filter(r => r.method === 'PATCH' && r.pathname.includes('/visits/')).at(-1);
      assert(firstPatch.body.mutation_id);

      // Save flow: Fault 1b = 409 conflict -> keeps draft & informs user
      backend.faults.nextVisitPatch = { status: 409, body: { detail: 'Lượt khám đã đổi phiên bản.' } };
      await cdp.eval(`document.querySelector('[data-visit-action="save"]').click()`);
      await cdp.waitFor('document.getElementById("notice")?.textContent.includes("Bản nháp vẫn được giữ")', '409 handled keeping draft');

      // Save flow: Fault 2 = 401 -> opens #reauth-dialog, hides #app, rejects different account, succeeds with same account, preserves draft & mutation_id!
      backend.faults.nextVisitPatch = { status: 401, body: { detail: 'Phiên hết hạn' } };
      await cdp.eval(`document.querySelector('[data-visit-action="save"]').click()`);
      await cdp.waitFor('Boolean(document.getElementById("reauth-dialog")?.open) && document.getElementById("app").hidden === true', '401 opened reauth-dialog and hid #app');

      // Try re-auth when /me returns a different user_id -> must reject
      backend.faults.nextTokenUserOverride = { user_id: 'u-different-999' };
      await cdp.eval(`(() => {
        document.getElementById('reauth-password').value = 'doc-password-123';
        document.querySelector('#reauth-login-form [type="submit"]').click();
      })()`);
      await cdp.waitFor('document.getElementById("reauth-notice")?.textContent.includes("Tài khoản đã thay đổi")', 'reauth rejected different account');
      assert.equal(await cdp.eval('document.getElementById("app").hidden'), true);

      // Now re-auth with same account -> closes dialog, reveals #app, draft still intact
      await cdp.eval(`(() => {
        document.getElementById('reauth-password').value = 'doc-password-123';
        document.querySelector('#reauth-login-form [type="submit"]').click();
      })()`);
      await cdp.waitFor('!document.getElementById("reauth-dialog") && document.getElementById("app").hidden === false', 'reauth succeeded');

      // Retry save -> succeeds with IDENTICAL mutation_id!
      await cdp.eval(`document.querySelector('[data-visit-action="save"]').click()`);
      await cdp.waitFor('document.getElementById("notice")?.textContent.includes("Đã lưu dữ liệu")', 'save succeeded after reauth');

      const allVisitPatches = backend.requestLog.filter(r => r.method === 'PATCH' && r.pathname.includes('/visits/'));
      const finalPatch = allVisitPatches.at(-1);
      assert.equal(finalPatch.body.mutation_id, firstPatch.body.mutation_id, 'mutation_id MUST remain identical across 503 + 409 + 401 retries');
      assert.equal(finalPatch.body.expected_revision, 2);
      assert.equal(finalPatch.body.catalog_revision, 1);
      assert.equal(Object.hasOwn(finalPatch.body.values, 'bmi'), false, 'PATCH must NEVER send bmi');
      assert.equal(Object.hasOwn(finalPatch.body.values, 'tuoi'), false, 'PATCH must NEVER send snapshot tuoi');
      assert.equal(Object.hasOwn(finalPatch.body.values, 'gioi_tinh'), false, 'PATCH must NEVER send snapshot gioi_tinh');
      assert.equal(finalPatch.body.values.can_nang, 84);
      assert.equal(finalPatch.body.values.kho_tho, false);
      assert.equal(finalPatch.body.values.ha_nam_ngoi_tam_thu, 0);
      assert.deepEqual(finalPatch.body.values.yeu_to_nguy_co, []);

      // Confirm leave guard when draft exists: cancel keeps user on #encounter; Hoàn tác clears draft
      await cdp.eval(`(() => {
        const w = document.getElementById('f-can_nang');
        w.value = '80';
        w.dispatchEvent(new Event('input', { bubbles: true }));
      })()`);
      assert.equal(await cdp.eval('document.getElementById("bmi-value").textContent.trim()'), '28,34');
      cdp.dialogAccept = false;
      const beforeDialogs = cdp.dialogs.length;
      await cdp.eval(`document.querySelector('[data-visit-action="profile"]').click()`);
      await cdp.waitFor('true', 'confirm leave canceled');
      assert(cdp.dialogs.length > beforeDialogs, 'confirmLeave must prompt when leaving dirty encounter');
      assert.equal(await cdp.eval('document.getElementById("main").dataset.page'), 'encounter');
      assert.equal(await cdp.eval('document.getElementById("f-can_nang").value'), '80');

      // Click Hoàn tác (accept confirm) -> restores saved value 84 and BMI 29,76
      cdp.dialogAccept = true;
      await cdp.eval(`document.querySelector('[data-visit-action="reset"]').click()`);
      await cdp.waitFor('document.getElementById("f-can_nang")?.value === "84" && document.getElementById("bmi-value")?.textContent.trim() === "29,76"', 'reset restored saved values');

      // Visit history modal shows provenance Nhập tay and Nhập file Excel
      await cdp.eval(`document.querySelector('[data-visit-action="history"]').click()`);
      await cdp.waitFor('Boolean(document.querySelector("dialog[open]")) && document.querySelector("dialog[open]").textContent.includes("Nhập file Excel")', 'visit history modal open');
      const histText = await cdp.eval('document.querySelector("dialog[open]").textContent');
      assert(histText.includes('Nhập tay'));
      assert(histText.includes('Nhập file Excel'));
      assert(histText.includes('his-two-cases.xlsx'));
      assert(histText.includes('Sheet3!D2'));
      await cdp.eval(`document.querySelector('dialog[open] [data-close]').click()`);
      await cdp.waitFor('!document.querySelector("dialog[open]")', 'visit history closed');
    });

    // -------------------------------------------------------------------------
    // 7. HIS 3-step flow (#import -> #import-preview -> #import-result) + history + responsive
    // -------------------------------------------------------------------------
    await test('7. HIS 3-step flow (.xlsx only, no JSON/mapping, read-only preview, keep/override lock, commit, history, responsive)', async () => {
      await cdp.eval(`document.querySelector('.sidebar [data-nav="import"]').click()`);
      await cdp.waitFor('document.getElementById("main")?.dataset.page === "import"', '#import loaded');

      const step1 = await cdp.eval(`(() => ({
        steps: [...document.querySelectorAll('.steps li')].map(li => li.textContent.replace(/^[0-9]+/, '').trim()),
        accept: document.getElementById('his-file')?.getAttribute('accept'),
        previewDisabled: document.getElementById('preview-button')?.disabled,
        hasJsonOption: /json/i.test(document.getElementById('main').textContent),
        hasMappingStep: /cấu trúc|ánh xạ/i.test([...document.querySelectorAll('.steps li')].map(li => li.textContent).join(' ')),
        hasDemoPreview: Boolean(document.querySelector('[data-action="demo-preview"]')),
      }))()`);
      assert.deepEqual(step1.steps, ['Chọn file', 'Đối chiếu', 'Kết quả']);
      assert(step1.accept.includes('.xlsx'));
      assert.equal(step1.previewDisabled, true);
      assert.equal(step1.hasJsonOption, false);
      assert.equal(step1.hasMappingStep, false);
      assert.equal(step1.hasDemoPreview, false);

      // Template download hits /api/forms/imports/template.xlsx with Bearer auth; wait for busy state to clear!
      await cdp.eval(`document.querySelector('[data-import="template"]').click()`);
      await cdp.waitFor('!document.getElementById("app")?.hasAttribute("aria-busy") && !document.getElementById("his-file")?.disabled', 'template download action finished');
      const tplReq = backend.requestLog.find(r => r.pathname === '/api/forms/imports/template.xlsx');
      assert(tplReq && tplReq.hasAuth, 'Template download must call /api/forms/imports/template.xlsx with Bearer token');

      // Upload valid .xlsx first, then replace with invalid .json to confirm prior payload is cleared immediately
      const docRoot1 = await cdp.send('DOM.getDocument', { depth: -1 });
      const fileNode1 = await cdp.send('DOM.querySelector', { nodeId: docRoot1.root.nodeId, selector: '#his-file' });
      await cdp.send('DOM.setFileInputFiles', { nodeId: fileNode1.nodeId, files: [sampleXlsx] });
      await cdp.waitFor('document.getElementById("preview-button")?.disabled === false', 'preview button enabled after valid .xlsx');

      await cdp.send('DOM.setFileInputFiles', { nodeId: fileNode1.nodeId, files: [badJson] });
      await cdp.waitFor('document.getElementById("notice")?.textContent.includes(".xlsx") && document.getElementById("preview-button")?.disabled === true', 'rejected non-xlsx file and cleared prior workbook');

      // Upload valid .xlsx again
      await cdp.send('DOM.setFileInputFiles', { nodeId: fileNode1.nodeId, files: [sampleXlsx] });
      await cdp.waitFor('document.getElementById("preview-button")?.disabled === false', 'preview button re-enabled after valid .xlsx');
      responsiveMatrix['#import'] = await cdp.assertResponsive('#import');

      // Step 2: #import-preview (read-only)
      const commitsBeforePreview = backend.requestLog.filter(r => r.pathname === '/api/forms/imports/commit').length;
      await cdp.eval(`document.getElementById('preview-button').click()`);
      await cdp.waitFor('document.getElementById("main")?.dataset.page === "import-preview"', '#import-preview loaded');
      assert.equal(backend.requestLog.filter(r => r.pathname === '/api/forms/imports/commit').length, commitsBeforePreview, 'Preview must be read-only');

      const previewInfo = await cdp.eval(`(() => ({
        text: document.getElementById('main').textContent,
        confirmDisabled: document.getElementById('confirm-import').disabled,
        conflictSelects: document.querySelectorAll('select.conflict-choice').length,
        rawSourceCols: document.querySelectorAll('.his-source tbody tr').length,
      }))()`);
      assert(previewInfo.text.includes('Đích: BN-00001'));
      assert(previewInfo.text.includes('Sẽ cấp mã BN khi xác nhận'));
      assert(previewInfo.text.includes('Mã trong file: 000SYN01 / LK-2026-03'));
      assert.equal(previewInfo.confirmDisabled, true, 'Confirm button must be locked until all conflicts decided');
      assert.equal(previewInfo.conflictSelects, 2);
      assert(previewInfo.rawSourceCols >= 42, '42 raw HIS columns should be available in details');

      // Decide only 1st conflict -> confirm MUST stay disabled
      await cdp.eval(`(() => {
        const s0 = document.querySelector('select[data-code="can_nang"]');
        s0.value = 'keep';
        s0.dispatchEvent(new Event('change', { bubbles: true }));
      })()`);
      assert.equal(await cdp.eval('document.getElementById("confirm-import").disabled'), true, 'Confirm must stay disabled with 1 unresolved conflict');

      // Decide 2nd conflict -> confirm MUST become enabled
      await cdp.eval(`(() => {
        const s1 = document.querySelector('select[data-code="ha_nam_ngoi_tam_thu"]');
        s1.value = 'override';
        s1.dispatchEvent(new Event('change', { bubbles: true }));
      })()`);
      assert.equal(await cdp.eval('document.getElementById("confirm-import").disabled'), false, 'Confirm must enable once all conflicts decided');

      responsiveMatrix['#import-preview'] = await cdp.assertResponsive('#import-preview');

      // Step 3: Commit -> #import-result
      await cdp.eval(`document.getElementById('confirm-import').click()`);
      await cdp.waitFor('document.getElementById("main")?.dataset.page === "import-result"', '#import-result loaded');

      const commitReq = backend.requestLog.filter(r => r.pathname === '/api/forms/imports/commit').at(-1);
      assert.equal(commitReq.body.preview_token, 'hmac-preview-token-v1');
      assert.deepEqual(commitReq.body.records[0], {
        index: 0,
        override_fields: ['ha_nam_ngoi_tam_thu'],
        keep_fields: ['can_nang'],
      });
      assert.deepEqual(commitReq.body.records[1], {
        index: 1,
        override_fields: [],
        keep_fields: [],
      });

      const resultText = await cdp.eval('document.getElementById("main").textContent');
      assert(resultText.includes('Đã hoàn tất nhập file'));
      assert(resultText.includes('BN-00001'));
      assert(resultText.includes('BN-00003'));
      responsiveMatrix['#import-result'] = await cdp.assertResponsive('#import-result');

      // Open import history modal
      await cdp.eval(`document.querySelector('[data-import="history"]').click()`);
      await cdp.waitFor('Boolean(document.querySelector("dialog[open]")) && document.querySelector("dialog[open]").textContent.includes("his-two-cases.xlsx")', 'import history modal open');
      await cdp.eval(`document.querySelector('dialog[open] [data-close]').click()`);
      await cdp.waitFor('!document.querySelector("dialog[open]")', 'import history closed');
    });

    // -------------------------------------------------------------------------
    // 8. Doctor RBAC: cannot open #fields -> redirected to #patients
    // -------------------------------------------------------------------------
    await test('8. Doctor RBAC: hash #fields redirects doctor back to #patients', async () => {
      await cdp.eval(`location.hash = '#fields'`);
      await cdp.waitFor('document.getElementById("main")?.dataset.page === "patients"', 'doctor redirected from #fields to #patients');
      assert.equal(await cdp.eval('location.hash'), '#patients');
    });

    // -------------------------------------------------------------------------
    // 9. Admin RBAC: read-only on all clinical screens, hidden clinical write buttons,
    //    blocked from #import, exclusive access to #fields + add/edit/preview + responsive
    // -------------------------------------------------------------------------
    await test('9. Admin RBAC: read-only clinical screens, #import blocked, #fields CRUD & widget preview, responsive', async () => {
      // Logout doctor even when /api/v1/auth/logout returns 503 -> must STILL clear forms_token and session state!
      backend.faults.nextLogoutStatus = 503;
      await cdp.eval(`document.querySelector('.sidebar-foot [data-action="logout"]').click()`);
      await cdp.waitFor('Boolean(document.getElementById("login-form"))', 'logged out to #login despite 503');
      assert.equal(await cdp.eval('sessionStorage.getItem("forms_token")'), null, 'forms_token must be cleared even when logout API fails with 503');

      // Login as admin via unified login
      await cdp.eval(`(() => {
        document.getElementById('username').value = 'admin_demo';
        document.getElementById('password').value = 'adm-password-123';
        document.querySelector('#login-form [type="submit"]').click();
      })()`);
      await cdp.waitFor('document.getElementById("main")?.dataset.page === "patients"', 'admin logged into #patients');

      const adminPatients = await cdp.eval(`(() => ({
        navs: [...document.querySelectorAll('.sidebar nav a')].map(a => a.dataset.nav),
        hasCreatePatient: Boolean(document.querySelector('[data-patient-action="new-patient"]')),
        hasEditFieldsBtn: Boolean(document.querySelector('[data-nav="fields"]')),
      }))()`);
      assert.deepEqual(adminPatients.navs, ['patients', 'fields']);
      assert.equal(adminPatients.hasCreatePatient, false);
      assert.equal(adminPatients.hasEditFieldsBtn, true);

      // Admin blocked from #import
      await cdp.eval(`location.hash = '#import'`);
      await cdp.waitFor('location.hash === "#patients" && document.getElementById("main")?.dataset.page === "patients"', 'admin blocked from #import');

      // Admin on #profile: Mở lượt mới hidden
      await cdp.eval(`document.querySelector('[data-patient-id="11111111-1111-4111-8111-111111111111"]').click()`);
      await cdp.waitFor('document.getElementById("main")?.dataset.page === "profile"', 'admin opened #profile');
      assert.equal(await cdp.eval('Boolean(document.querySelector("[data-profile-action=new-visit]"))'), false);

      // Admin on #encounter: strictly read-only, all controls disabled, no savebar, no med add/remove
      await cdp.eval(`document.querySelector('[data-visit-id="${backend.visitLatest.id}"]').click()`);
      await cdp.waitFor('document.getElementById("main")?.dataset.page === "encounter"', 'admin opened #encounter');

      const adminEncounter = await cdp.eval(`(() => {
        const formControls = [...document.querySelectorAll('#encounter-form input, #encounter-form select, #encounter-form textarea')];
        const enabledControls = formControls.filter(el => !el.disabled).map(el => el.id || el.name);
        return {
          totalControls: formControls.length,
          enabledControls,
          hasSavebar: Boolean(document.querySelector('.savebar')),
          hasSaveBtn: Boolean(document.querySelector('[data-visit-action="save"]')),
          hasReadOnlyTag: document.getElementById('main').textContent.includes('Chỉ xem lâm sàng'),
        };
      })()`);
      assert(adminEncounter.totalControls > 0);
      assert.deepEqual(adminEncounter.enabledControls, [], 'All clinical & metadata inputs must be disabled for Admin');
      assert.equal(adminEncounter.hasSavebar, false);
      assert.equal(adminEncounter.hasSaveBtn, false);
      assert.equal(adminEncounter.hasReadOnlyTag, true);

      // Admin on Medications group: add/remove/empty/null buttons hidden
      await cdp.eval(`document.querySelector('[data-group="Thuốc đang sử dụng"]').click()`);
      await cdp.waitFor('Boolean(document.querySelector(".med-columns"))', 'admin viewed Thuốc group');
      const adminMedButtons = await cdp.eval(`({
        add: document.querySelectorAll('[data-add-item]').length,
        remove: document.querySelectorAll('[data-remove-item]').length,
        empty: document.querySelectorAll('[data-empty-list]').length,
        nullBtn: document.querySelectorAll('[data-null-list]').length,
      })`);
      assert.deepEqual(adminMedButtons, { add: 0, remove: 0, empty: 0, nullBtn: 0 });

      // Admin opens #fields
      await cdp.eval(`document.querySelector('.sidebar [data-nav="fields"]').click()`);
      await cdp.waitFor('document.getElementById("main")?.dataset.page === "fields"', 'admin opened #fields');

      const fieldsInfo = await cdp.eval(`(() => {
        const rows = [...document.querySelectorAll('#field-rows tr')];
        const bmiRow = rows.find(r => r.textContent.includes('bmi'));
        const aiRow = rows.find(r => r.textContent.includes('ai_risk_score'));
        return {
          count: rows.length,
          bmiReadOnly: Boolean(bmiRow && bmiRow.textContent.includes('Chỉ xem') && !bmiRow.querySelector('[data-edit-field]')),
          aiDisabled: Boolean(aiRow && aiRow.querySelector('[data-edit-field]')?.disabled),
        };
      })()`);
      assert(fieldsInfo.count >= 10);
      assert.equal(fieldsInfo.bmiReadOnly, true);
      assert.equal(fieldsInfo.aiDisabled, true);

      // Search fields
      await cdp.eval(`(() => {
        const s = document.getElementById('field-search');
        s.value = 'kho_tho';
        s.dispatchEvent(new Event('input', { bubbles: true }));
      })()`);
      assert.equal(await cdp.eval('document.querySelectorAll("#field-rows tr").length'), 1);
      await cdp.eval(`(() => {
        const s = document.getElementById('field-search');
        s.value = '';
        s.dispatchEvent(new Event('input', { bubbles: true }));
      })()`);

      responsiveMatrix['#fields'] = await cdp.assertResponsive('#fields');

      // Add field + widget preview + POST /api/forms/fields
      await cdp.eval(`document.querySelector('[data-admin-action="new-field"]').click()`);
      await cdp.waitFor('Boolean(document.querySelector("dialog[open] #def-code"))', 'add field modal open');
      await cdp.eval(`(() => {
        const d = document.querySelector('dialog[open]');
        d.querySelector('#def-label').value = 'Nhịp thở bổ sung';
        d.querySelector('#def-code').value = 'nhip_tho_bo_sung';
        d.querySelector('#def-type').value = 'integer';
        d.querySelector('#def-type').dispatchEvent(new Event('change', { bubbles: true }));
        d.querySelector('#def-unit').value = 'lần/phút';
        d.querySelector('#def-order').value = '55';
        d.querySelector('#preview-field').click();
      })()`);
      const previewOk = await cdp.eval('!document.getElementById("field-preview").hidden && document.getElementById("field-preview").textContent.includes("Nhịp thở bổ sung")');
      assert.equal(previewOk, true, 'Widget preview must render in field modal');

      await cdp.eval(`document.querySelector('dialog[open] form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))`);
      await cdp.waitFor('!document.querySelector("dialog[open]") && document.getElementById("field-rows").textContent.includes("nhip_tho_bo_sung")', 'new field saved and rendered');

      // Edit field + PATCH /api/forms/fields/{code} with expected_version
      await cdp.eval(`document.querySelector('[data-edit-field="nhip_tho_bo_sung"]').click()`);
      await cdp.waitFor('Boolean(document.querySelector("dialog[open] #def-label"))', 'edit field modal open');
      await cdp.eval(`(() => {
        const d = document.querySelector('dialog[open]');
        d.querySelector('#def-label').value = 'Nhịp thở bổ sung (v2)';
        d.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      })()`);
      await cdp.waitFor('!document.querySelector("dialog[open]") && document.getElementById("field-rows").textContent.includes("Nhịp thở bổ sung (v2)")', 'field updated');
      const patchField = backend.requestLog.filter(r => r.method === 'PATCH' && r.pathname === '/api/forms/fields/nhip_tho_bo_sung').at(-1);
      assert.equal(patchField.body.expected_version, 1);
    });

    // -------------------------------------------------------------------------
    // 10. Zero runtime exceptions / console errors / CSP violations / broken static assets
    // -------------------------------------------------------------------------
    await test('10. Zero uncaught exceptions, console errors, CSP violations, or missing static assets across all 9 screens', async () => {
      const domCspViolations = await cdp.eval('window.__cspViolations || []');
      assert.deepEqual(cdp.cspViolations, [], `CSP console violations: ${cdp.cspViolations.join(' | ')}`);
      assert.deepEqual(domCspViolations, [], `DOM securitypolicyviolation events: ${JSON.stringify(domCspViolations)}`);
      assert.deepEqual(cdp.exceptions, [], `Uncaught page exceptions: ${cdp.exceptions.join(' | ')}`);
      assert.deepEqual(cdp.consoleErrors, [], `Console errors: ${cdp.consoleErrors.join(' | ')}`);
      assert.deepEqual(backend.static404s, [], `Missing static assets (404): ${backend.static404s.join(', ')}`);
    });

    console.log(`\nRESPONSIVE_MATRIX ${JSON.stringify(responsiveMatrix)}`);
    console.log(`${passed} forms-v2 frontend regression suites passed (0 pageerrors, 0 CSP violations, all viewports 1280/390/320 clean)`);
  } finally {
    if (browser) await browser.cleanup();
    await new Promise(resolve => server.close(resolve));
    try { fs.rmSync(tmpFilesDir, { recursive: true, force: true }); } catch { /* ignore */ }
  }
}

runSuite().catch(err => {
  console.error('FAIL', err);
  process.exitCode = 1;
});
