'use strict';

/* ==========================================================================
   Hệ thống Thu thập & Xác nhận Dữ liệu Lâm sàng Suy tim — Web SPA (M1–M8)
   Tone Xanh Dương Y Tế (Clinical Blue) · Kết nối qua ApiClient (API / Static)
   ========================================================================== */

(function (global) {
  const api = global.ApiClient;

  /* ------------------------------------------------------------------------
     Inline SVG Icons (100% vector, zero external icon fonts or CDNs)
     ------------------------------------------------------------------------ */
  const ICONS = {
    heart: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/><path d="M3.22 12H9.5l1.5-3 2 6 1.5-3h6.28"/></svg>',
    users: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    userPlus: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>',
    fileText: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
    checkCircle: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
    shield: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
    layers: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>',
    list: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>',
    search: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
    eye: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',
    eyeOff: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>',
    alert: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
    lock: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>',
    unlock: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>',
    key: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6"/><path d="m15.5 7.5 3 3L22 7l-3-3"/></svg>',
    plus: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
    trash: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',
    arrowLeft: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>',
    arrowRight: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>',
    up: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="18 15 12 9 6 15"/></svg>',
    down: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>',
    save: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>',
    logout: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>',
    menu: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>',
    clock: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
    x: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
    code: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>',
    refresh: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>',
    panelLeft: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/></svg>',
    download: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
    play: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="6 4 20 12 6 20 6 4"/></svg>',
    edit: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
    history: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><polyline points="3 3 3 8 8 8"/><polyline points="12 7 12 12 15 14"/></svg>'
  };

  /* ------------------------------------------------------------------------
     Utility helpers
     ------------------------------------------------------------------------ */
  function esc(val) {
    return String(val == null ? '' : val)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function clone(v) {
    return JSON.parse(JSON.stringify(v));
  }

  function formatDateTime(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return String(iso);
    const pad = function (n) { return String(n).padStart(2, '0'); };
    return pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear() + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  }

  function formatDateOnly(iso) {
    if (!iso) return '—';
    const s = String(iso).slice(0, 10);
    const parts = s.split('-');
    if (parts.length === 3) return parts[2] + '/' + parts[1] + '/' + parts[0];
    return s;
  }

  function toDatetimeLocal(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 16);
  }

  function fromDatetimeLocal(val) {
    if (!val) return null;
    const parts = String(val).match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,3})?)?$/);
    if (!parts) return null;
    const d = new Date(val);
    if (isNaN(d.getTime()) || d.getFullYear() !== Number(parts[1]) || d.getMonth() + 1 !== Number(parts[2]) || d.getDate() !== Number(parts[3]) || d.getHours() !== Number(parts[4]) || d.getMinutes() !== Number(parts[5]) || d.getSeconds() !== Number(parts[6] || 0)) return null;
    return d.toISOString();
  }

  function formatSex(sex) {
    if (sex === 'male') return 'Nam';
    if (sex === 'female') return 'Nữ';
    return 'Chưa rõ';
  }

  function formatBirthPrecision(pt) {
    if (!pt) return '—';
    if (pt.birthDate) {
      const yr = Number(String(pt.birthDate).slice(0, 4));
      const age = isFinite(yr) ? (new Date().getFullYear() - yr) : null;
      return formatDateOnly(pt.birthDate) + (age !== null ? ' (' + age + ' tuổi)' : '');
    }
    if (pt.birthYear != null) return 'Năm sinh ' + pt.birthYear + ' (chỉ ghi năm)';
    if (pt.declaredAge != null) return 'Tuổi ước lượng: ' + pt.declaredAge + ' (chưa rõ ngày sinh)';
    return 'Chưa có thông tin ngày sinh';
  }

  function formatVisitType(vt) {
    if (vt === 'outpatient_new') return 'Khám mới';
    if (vt === 'follow_up') return 'Tái khám';
    if (vt === 'acute_inpatient') return 'Đợt cấp / Nhập viện';
    return vt || '—';
  }

  function formatBpPosition(pos) {
    if (pos === 'supine') return 'Nằm';
    if (pos === 'sitting') return 'Ngồi';
    if (pos === 'standing') return 'Đứng';
    return pos || '—';
  }

  function formatAuditAction(act) {
    const map = {
      login: 'Đăng nhập',
      logout: 'Đăng xuất',
      login_failed: 'Đăng nhập thất bại',
      user_create: 'Tạo tài khoản',
      user_update: 'Cập nhật tài khoản / Quyền',
      form_version_create: 'Tạo bản nháp biểu mẫu',
      form_version_update: 'Cập nhật bản nháp biểu mẫu',
      form_version_delete: 'Xóa bản nháp biểu mẫu',
      form_version_publish: 'Phát hành phiên bản biểu mẫu',
      patient_create: 'Tạo hồ sơ bệnh nhân',
      visit_confirm: 'Xác nhận lượt khám / Bản sửa',
      ai_input_export: 'Xuất JSON đầu vào AI',
      care_assignment_add: 'Phân công bác sĩ phụ trách',
      care_assignment_revoke: 'Thu hồi phân công bác sĩ'
    };
    return map[act] || act;
  }

  function formatAuditEntity(ent) {
    const map = {
      user_session: 'Phiên đăng nhập',
      form_version: 'Phiên bản biểu mẫu',
      app_user: 'Tài khoản người dùng',
      patient: 'Hồ sơ bệnh nhân',
      visit: 'Lượt khám',
      visit_revision: 'Bản sửa lượt khám',
      care_assignment: 'Phân công phụ trách',
      audit_log: 'Nhật ký hệ thống'
    };
    return map[ent] || ent || '—';
  }

  const NOT_FOUND_OR_NO_ACCESS_MSG = 'Không tìm thấy hoặc bạn không có quyền với hồ sơ này.';

  function formatClinicalError(err, fallback) {
    if (err && err.status === 404) return NOT_FOUND_OR_NO_ACCESS_MSG;
    return (err && err.detail) || fallback || 'Đã xảy ra lỗi khi tải dữ liệu.';
  }

  function isAssignmentActiveNow(a) {
    if (!a || a.revokedAt) return false;
    return true;
  }

  function renderAssignedDoctorsBadges(doctors, access, currentUser) {
    const list = Array.isArray(doctors) ? doctors : [];
    if (list.length > 0) {
      return '<div class="assigned-doctors-list">' + list.map(function (d) {
        const name = typeof d === 'string' ? d : (d.fullName || d.doctorName || d.username || 'Bác sĩ');
        return '<span class="badge badge--blue badge--xs">' + esc(name) + '</span>';
      }).join('') + '</div>';
    }
    if (access && (access.assignmentId || access.assignedAt)) {
      const label = currentUser && currentUser.fullName ? currentUser.fullName : 'Được phân công';
      return '<div class="assigned-doctors-list"><span class="badge badge--blue badge--xs">' + esc(label) + '</span>' +
        (access.assignedAt ? '<span class="cell-sub tabular">Từ ' + esc(formatDateOnly(access.assignedAt)) + '</span>' : '') + '</div>';
    }
    return '<span class="badge badge--neutral">Chưa phân công</span>';
  }

  function formatDataTypeVi(dt) {
    const map = {
      boolean: 'Có / Không / Chưa rõ',
      number: 'Số thập phân',
      integer: 'Số nguyên',
      text: 'Văn bản',
      date: 'Ngày tháng',
      single_choice: 'Chọn một giá trị',
      multi_choice: 'Chọn nhiều giá trị'
    };
    return map[dt] || dt || '—';
  }

  function formatScopeVi(scope) {
    if (scope === 'mvp') return 'Chính thức';
    if (scope === 'can_xac_nhan') return 'Chờ xác nhận chuyên môn';
    return scope || '—';
  }

  function formatStorageLevelVi(lvl) {
    const map = {
      patient: 'Hồ sơ bệnh nhân',
      visit: 'Siêu dữ liệu lượt khám (Hệ thống)',
      visit_value: 'Trường dữ liệu lượt khám',
      computed: 'Tự tính toán',
      orthostatic_bp: 'Bảng đo huyết áp theo tư thế',
      medication: 'Danh sách thuốc hiện dùng',
      allergy: 'Danh sách dị ứng / ADR',
      lab_result: 'Danh sách kết quả cận lâm sàng',
      diagnosis: 'Danh sách chẩn đoán ICD-10'
    };
    return map[lvl] || lvl || '—';
  }

  const AI_MODULE_ORDER = ['ai_diagnosis', 'ai_lab_test', 'ai_treatment', 'ai_medsafety'];

  function formatAiModuleLabel(code) {
    const map = {
      ai_diagnosis: 'Module 1: Hỗ trợ Chẩn đoán Suy tim',
      ai_lab_test: 'Module 2: Hỗ trợ Chỉ định Cận lâm sàng',
      ai_treatment: 'Module 3: Hỗ trợ Định hướng Điều trị',
      ai_medsafety: 'Module 4: Hỗ trợ An toàn Thuốc (MedSafety)',
      hf_diagnosis: 'Module 1: Hỗ trợ Chẩn đoán Suy tim',
      hf_lab_test: 'Module 2: Hỗ trợ Chỉ định Cận lâm sàng',
      hf_lab: 'Module 2: Hỗ trợ Chỉ định Cận lâm sàng',
      hf_gdmt: 'Module 3: Hỗ trợ Định hướng Điều trị (GDMT)',
      hf_treatment: 'Module 3: Hỗ trợ Định hướng Điều trị',
      hf_medsafety: 'Module 4: Hỗ trợ An toàn Thuốc (MedSafety)'
    };
    return map[code] || code;
  }

  function formatAiModuleShortLabel(code) {
    const map = {
      ai_diagnosis: 'Module 1',
      ai_lab_test: 'Module 2',
      ai_treatment: 'Module 3',
      ai_medsafety: 'Module 4',
      hf_diagnosis: 'Module 1',
      hf_lab_test: 'Module 2',
      hf_lab: 'Module 2',
      hf_gdmt: 'Module 3',
      hf_treatment: 'Module 3',
      hf_medsafety: 'Module 4'
    };
    return map[code] || code;
  }

  const AI_ACTIONABLE_ISSUE_CODES = {
    MISSING_VALUE: true,
    LIST_UNKNOWN: true,
    LAB_MISSING: true,
    TIME_MISSING: true,
    UNIT_UNSUPPORTED: true,
    UNIT_OR_TYPE_UNSUPPORTED: true
  };

  const AI_FIELD_CODE_ALIASES = {
    medicationListState: 'medication_list_state',
    allergyListState: 'allergy_list_state',
    diagnosisListState: 'diagnosis_list_state',
    medications: 'thuoc_drugname',
    allergies: 'diung_allergen',
    diagnoses: 'icd_code',
    age: 'luot_tuoi',
    sex: 'bn_gioi_tinh'
  };

  const AI_ISSUE_DISPLAY_LABELS = {
    KHO_THO_NANG: 'Mức độ khó thở (thang 0–3)',
    PHU_CHI_DUOI: 'Phù chi dưới (thang 0–2)',
    BIEN_THIEN_CAN_NANG_7NGAY: 'Biến thiên cân nặng 7 ngày',
    TRIEU_CHUNG_KHONG_DIEN_HINH: 'Triệu chứng không điển hình',
    DANH_GIA_SUY_YEU_FRAILTY: 'Đánh giá suy yếu (CFS)',
    E_OVER_A_RATIO: 'Tỉ lệ E/A',
    EGFR_CKD_EPI: 'eGFR (CKD-EPI)',
    ECG_12_CHUYEN_DAO: 'Điện tâm đồ 12 chuyển đạo (ECG)',
    XQUANG_NGUC_THANG: 'X-quang ngực thẳng',
    KHOA_PHONG: 'Khoa / Phòng khám',
    THOI_GIAN_KHAM: 'Thời điểm khám',
    BAC_SI_KHAM: 'Bác sĩ khám',
    HA_TAM_THU: 'Huyết áp tâm thu',
    HA_TAM_TRUONG: 'Huyết áp tâm trương',
    TAN_SO_TIM: 'Tần số tim / Mạch',
    SPO2: 'Độ bão hòa oxy máu ngoại vi (SpO₂)',
    CHIEU_CAO: 'Chiều cao',
    CAN_NANG: 'Cân nặng hiện tại',
    BMI: 'Chỉ số khối cơ thể (BMI)',
    TUOI: 'Tuổi tại thời điểm khám',
    GIOI_TINH: 'Giới tính sinh học',
    TINH_MACH_CO_NOI: 'Tĩnh mạch cổ nổi',
    RAN_AM_PHOI: 'Ran ẩm ở phổi',
    NT_PROBNP: 'Xét nghiệm NT-proBNP',
    BNP: 'Xét nghiệm BNP',
    EF_SIEU_AM_TIM: 'Phân suất tống máu thất trái (LVEF)',
    CREATININE_MAU: 'Creatinin huyết thanh',
    KALI_MAU: 'Kali máu (K+)',
    DANH_MUC_THUOC_DANG_DUNG: 'Danh sách thuốc đang dùng',
    TIEN_SU_DI_UNG: 'Tiền sử dị ứng / ADR',
    BENH_DONG_MAC_ICD10: 'Chẩn đoán bệnh đồng mắc (ICD-10)',
    medications: 'Danh sách thuốc đang dùng',
    allergies: 'Tiền sử dị ứng / ADR',
    diagnoses: 'Chẩn đoán bệnh đồng mắc (ICD-10)',
    medicationListState: 'Trạng thái danh sách thuốc đang dùng',
    medication_list_state: 'Trạng thái danh sách thuốc đang dùng',
    allergyListState: 'Trạng thái danh sách dị ứng / ADR',
    allergy_list_state: 'Trạng thái danh sách dị ứng / ADR',
    diagnosisListState: 'Trạng thái danh sách chẩn đoán ICD-10',
    diagnosis_list_state: 'Trạng thái danh sách chẩn đoán ICD-10',
    icd_code: 'Mã chẩn đoán ICD-10',
    icd_display: 'Tên chẩn đoán ICD-10',
    thuoc_ghi_nhan: 'Danh sách thuốc đang dùng',
    di_ung_adr: 'Tiền sử dị ứng / ADR',
    cls_don_vi: 'Đơn vị xét nghiệm',
    cls_thoi_diem: 'Thời điểm xét nghiệm',
    cls_ecg_thoi_diem: 'Thời điểm điện tâm đồ (ECG)',
    cls_sieu_am_tim_thoi_diem: 'Thời điểm siêu âm tim',
    cls_xquang_thoi_diem: 'Thời điểm X-quang ngực',
    kho_tho_nang: 'Mức độ khó thở (0–3)',
    phu_chi_duoi_muc_do: 'Mức độ phù chi dưới (0–2)',
    bien_thien_can_nang_7ngay: 'Biến thiên cân nặng 7 ngày (kg)',
    trieu_chung_khong_dien_hinh: 'Triệu chứng không điển hình nổi bật',
    danh_gia_suy_yeu_frailty: 'Điểm suy yếu CFS (1–9)',
    e_over_a_ratio: 'Tỉ lệ E/A (Doppler)',
    egfr_ckd_epi: 'eGFR kèm công thức',
    egfr_formula: 'Công thức tính eGFR',
    ecg_12_chuyen_dao: 'ECG 12 chuyển đạo có cấu trúc',
    xquang_nguc_thang: 'X-quang ngực thẳng có cấu trúc',
    bat_thuong_cau_truc_tim: 'Xác nhận bất thường cấu trúc/chức năng tim',
    selected_medications: 'Phương án đơn thuốc đã chọn ở Module 3',
    age: 'Tuổi tại lượt khám',
    sex: 'Giới tính',
    tinh_mach_co_noi: 'Tĩnh mạch cổ nổi',
    ran_am_phoi: 'Ran ẩm ở phổi',
    cls_nt_probnp: 'Xét nghiệm NT-proBNP',
    cls_bnp: 'Xét nghiệm BNP',
    cls_lvef: 'Phân suất tống máu thất trái (LVEF)',
    cls_creatinin: 'Creatinin huyết thanh',
    cls_kali: 'Kali máu (K+)',
    cls_natri: 'Natri máu (Na+)',
    cls_chuc_nang_gan: 'Chức năng gan (AST/ALT)',
    spo2: 'Độ bão hòa oxy máu (SpO₂)',
    mach: 'Mạch / Tần số tim',
    can_nang_kg: 'Cân nặng hiện tại',
    tang_huyet_ap: 'Tiền sử Tăng huyết áp',
    dai_thao_duong: 'Tiền sử Đái tháo đường',
    copd: 'Tiền sử COPD / bệnh phổi mạn',
    thieu_mau: 'Tiền sử Thiếu máu',
    nyha_hien_tai: 'Phân độ NYHA hiện tại',
    tinh_trang_worsening_decompensated: 'Tình trạng nặng lên / mất bù',
    tinh_trang_sung_huyet: 'Tình trạng sung huyết',
    giam_tuoi_mau_ngoai_vi: 'Giảm tưới máu ngoại vi',
    kha_nang_hop_tac_xet_nghiem: 'Khả năng hợp tác xét nghiệm',
    di_ung_thuoc_can_quang: 'Dị ứng thuốc cản quang',
    ts_thiet_bi_cay_ghep_chong_chi_dinh_mri: 'Thiết bị cấy ghép chống chỉ định MRI',
    kha_nang_gang_suc_tham_do_xam_lan: 'Khả năng gắng sức / thăm dò xâm lấn',
    muc_tieu_dieu_tri: 'Mục tiêu điều trị',
    xh_kha_nang_chi_tra: 'Khả năng chi trả',
    kha_nang_thuc_hien_xet_nghiem: 'Khả năng thực hiện xét nghiệm'
  };

  /* ------------------------------------------------------------------------
     Workflow 4-Module (hf-workflow/1.0) & Form v1.2 9-Field Specifications
     ------------------------------------------------------------------------ */
  const WF_SIMULATION_LABEL = 'Kết quả AI mô phỏng — chỉ để kiểm thử, không dùng cho lâm sàng';
  const WF_EXP_TAG_FULL = 'Thang thử nghiệm · chờ bác sĩ duyệt';
  const WF_MODULE_ORDER = ['m1', 'm2', 'm3', 'm4'];
  const WF_MODULE_META = {
    m1: { num: 1, full: 'M1 · Chẩn đoán (Diagnosis)', short: 'M1 Chẩn đoán', next: 'm2', nextNum: 2 },
    m2: { num: 2, full: 'M2 · Cận lâm sàng (Lab/Test)', short: 'M2 Xét nghiệm', next: 'm3', nextNum: 3 },
    m3: { num: 3, full: 'M3 · Điều trị (Treatment)', short: 'M3 Điều trị', next: 'm4', nextNum: 4 },
    m4: { num: 4, full: 'M4 · An toàn thuốc (MedSafety)', short: 'M4 An toàn thuốc', next: null, nextNum: null }
  };

  const V12_NINE_FIELD_CODES = [
    'kho_tho_nang',
    'phu_chi_duoi_muc_do',
    'bien_thien_can_nang_7ngay',
    'trieu_chung_khong_dien_hinh',
    'danh_gia_suy_yeu_frailty',
    'e_over_a_ratio',
    'egfr_ckd_epi',
    'ecg_12_chuyen_dao',
    'xquang_nguc_thang'
  ];

  const V12_SCALE_SPECS = {
    kho_tho_nang: {
      label: 'Mức độ khó thở (0–3)',
      sectionCode: 'trieu_chung_dien_bien',
      options: [
        { value: 0, title: '0 — Không khó thở', desc: 'Không có triệu chứng khó thở' },
        { value: 1, title: '1 — Khi gắng sức nặng', desc: 'Như leo từ hai tầng trở lên' },
        { value: 2, title: '2 — Khi gắng sức nhẹ hoặc sinh hoạt thường', desc: 'Đi bộ đoạn ngắn hoặc sinh hoạt hằng ngày' },
        { value: 3, title: '3 — Khi nghỉ hoặc phải ngồi dậy để thở', desc: 'Khó thở ngay cả lúc nghỉ ngơi' }
      ]
    },
    phu_chi_duoi_muc_do: {
      label: 'Mức độ phù chi dưới (0–2)',
      sectionCode: 'trieu_chung_dien_bien',
      options: [
        { value: 0, title: '0 — Không phù', desc: 'Không ghi nhận phù chi dưới' },
        { value: 1, title: '1 — Phù mắt cá / 1/3 dưới cẳng chân, ấn lõm nông', desc: 'Khu trú vùng cổ chân hoặc 1/3 dưới cẳng chân' },
        { value: 2, title: '2 — Phù rõ vượt 1/3 dưới cẳng chân', desc: 'Gồm quá gối, ấn lõm sâu hoặc phù toàn thân' }
      ]
    },
    trieu_chung_khong_dien_hinh: {
      label: 'Triệu chứng không điển hình nổi bật',
      sectionCode: 'trieu_chung_dien_bien',
      help: 'Nếu có cả hai triệu chứng, chọn 1 và giữ ghi chú trong hồ sơ.',
      hasNoteOnNonZero: true,
      options: [
        { value: 0, title: '0 — Không', desc: 'Không có triệu chứng không điển hình nổi bật' },
        { value: 1, title: '1 — Lơ mơ / lú lẫn / sảng', desc: 'Ưu tiên chọn mức này nếu có cả hai triệu chứng' },
        { value: 2, title: '2 — Chán ăn / sụt ăn', desc: 'Giảm ăn uống rõ rệt không giải thích được' }
      ]
    }
  };

  const V12_CFS_LEVELS = [
    { value: 1, desc: 'Rất khỏe, vận động tốt' },
    { value: 2, desc: 'Khỏe, chưa hoạt động đều như mức 1' },
    { value: 3, desc: 'Quản lý bệnh tốt, sinh hoạt độc lập' },
    { value: 4, desc: 'Dễ tổn thương, triệu chứng hạn chế hoạt động' },
    { value: 5, desc: 'Suy yếu nhẹ, cần giúp việc phức tạp' },
    { value: 6, desc: 'Suy yếu vừa, cần giúp hoạt động thường ngày' },
    { value: 7, desc: 'Suy yếu nặng, phụ thuộc chăm sóc cá nhân' },
    { value: 8, desc: 'Suy yếu rất nặng, phụ thuộc hoàn toàn' },
    { value: 9, desc: 'Bệnh giai đoạn cuối' }
  ];

  const V12_ECG_RHYTHMS = [
    { value: 'sinus', label: 'Xoang' },
    { value: 'atrial_fibrillation', label: 'Rung nhĩ' },
    { value: 'atrial_flutter', label: 'Cuồng nhĩ' },
    { value: 'paced', label: 'Nhịp máy' },
    { value: 'other', label: 'Khác' },
    { value: 'unknown', label: 'Chưa rõ' }
  ];

  const V12_EGFR_FORMULAS = [
    { value: 'CKD-EPI 2021', label: 'CKD-EPI 2021' },
    { value: 'MDRD', label: 'MDRD' },
    { value: 'Cockcroft-Gault', label: 'Cockcroft-Gault' },
    { value: 'Không rõ', label: 'Không rõ' }
  ];

  const WF_M1_PROB_LEVELS = [
    { value: 'Không phù hợp', stage: null },
    { value: 'Có nguy cơ – Stage A', stage: 'A' },
    { value: 'Pre-HF – Stage B', stage: 'B' },
    { value: 'Nghi ngờ suy tim', stage: null },
    { value: 'Suy tim có triệu chứng – Stage C', stage: 'C' },
    { value: 'Suy tim tiến triển – Stage D', stage: 'D' },
    { value: 'Chưa đủ dữ liệu để kết luận', stage: null }
  ];

  const WF_M1_PHENOTYPES = ['HFrEF', 'HFmrEF', 'HFpEF', 'HFimpEF', 'Chưa phân loại do thiếu EF', 'Không áp dụng'];
  const WF_M1_CONTEXTS = [
    'Suy tim mới khởi phát',
    'Suy tim cấp hoặc mạn tính',
    'Worsening HF',
    'Decompensated HF',
    'Suy tim cải thiện/thuyên giảm',
    'Suy tim tiến triển/kháng trị'
  ];
  const WF_M1_RISK_KEYS = [
    { key: 'nhap_vien', label: 'Nguy cơ nhập viện' },
    { key: 'tu_vong', label: 'Nguy cơ tử vong' },
    { key: 'te_nga', label: 'Nguy cơ té ngã' },
    { key: 'sang', label: 'Nguy cơ sảng' },
    { key: 'suy_giam_chuc_nang', label: 'Suy giảm chức năng' },
    { key: 'mat_tu_cham_soc', label: 'Mất khả năng tự chăm sóc' }
  ];
  const WF_M1_MIMICS = [
    'Quá tải dịch do bệnh thận',
    'COPD/bệnh phổi khác',
    'Thiếu máu',
    'Béo phì',
    'Giảm thể lực',
    'Suy dinh dưỡng/sarcopenia',
    'Bệnh tuyến giáp'
  ];
  const WF_M1_EMERGENCIES = [
    'Phù phổi cấp',
    'Sốc tim',
    'Tụt huyết áp',
    'Giảm SpO₂',
    'Rối loạn nhịp nguy hiểm',
    'Hội chứng vành cấp',
    'Thiểu niệu hoặc giảm tưới máu'
  ];

  const WF_M2_TESTS = [
    { key: 'bnp_ntprobnp', dd: 121, label: 'BNP hoặc NT-proBNP' },
    { key: 'ecg', dd: 122, label: 'ECG 12 chuyển đạo' },
    { key: 'sieu_am_tim', dd: 123, label: 'Siêu âm tim' },
    { key: 'xquang', dd: 124, label: 'X-quang tim phổi' },
    { key: 'cong_thuc_mau', dd: 125, label: 'Công thức máu' },
    { key: 'ure_creatinin_egfr', dd: 126, label: 'Urê, creatinin, eGFR' },
    { key: 'kali_natri', dd: 127, label: 'Kali, natri' },
    { key: 'chuc_nang_gan', dd: 128, label: 'Chức năng gan' },
    { key: 'duong_huyet_hba1c', dd: 129, label: 'Đường huyết/HbA1c' },
    { key: 'tsh', dd: 130, label: 'TSH' },
    { key: 'ferritin_tsat', dd: 131, label: 'Ferritin và TSAT' },
    { key: 'uacr', dd: 132, label: 'UACR' },
    { key: 'danh_gia_mach_vanh', dd: 133, label: 'Đánh giá bệnh mạch vành' },
    { key: 'doppler_van_tim', dd: 134, label: 'Siêu âm Doppler van tim' },
    { key: 'holter_ecg', dd: 135, label: 'Holter ECG' },
    { key: 'mri_tim', dd: 136, label: 'MRI tim' },
    { key: 'xet_nghiem_amyloidosis', dd: 137, label: 'Xét nghiệm amyloidosis' },
    { key: 'danh_gia_benh_co_tim', dd: 138, label: 'Đánh giá bệnh cơ tim' },
    { key: 'suy_tim_cung_luong_cao', dd: 139, label: 'Nguyên nhân suy tim cung lượng cao' },
    { key: 'danh_gia_benh_than', dd: 140, label: 'Đánh giá bệnh thận' },
    { key: 'danh_gia_benh_phoi', dd: 141, label: 'Đánh giá bệnh phổi' },
    { key: 'danh_gia_thieu_mau', dd: 142, label: 'Đánh giá thiếu máu' },
    { key: 'dinh_duong', dd: 143, label: 'Đánh giá suy dinh dưỡng' },
    { key: 'tuyen_giap', dd: 144, label: 'Đánh giá tuyến giáp' },
    { key: 'gang_suc_tham_do_huyet_dong', dd: 145, label: 'Gắng sức/thăm dò huyết động' }
  ];
  const WF_M2_CLASSIFICATIONS = ['Phù hợp với suy tim', 'Chưa đủ bằng chứng', 'Nghi ngờ bệnh giả suy tim', 'Cần xét nghiệm bổ sung', 'Cần hội chẩn chuyên khoa'];
  const WF_M2_PRIORITIES = ['Cấp cứu', 'Trong 24 giờ', 'Trong đợt khám hiện tại', 'Theo dõi định kỳ'];

  const WF_M3_DRUG_GROUPS = [
    { key: 'ARNI_ACEI_ARB', label: 'ARNI / ACEI / ARB' },
    { key: 'beta_blocker', label: 'Chẹn beta giao cảm' },
    { key: 'MRA', label: 'Kháng Aldosterone (MRA)' },
    { key: 'SGLT2i', label: 'Ức chế SGLT2 (SGLT2i)' },
    { key: 'loop_diuretic', label: 'Lợi tiểu quai' }
  ];
  const WF_M3_REC_LEVELS = ['Khuyến nghị', 'Cân nhắc', 'Không khuyến nghị', 'Chống chỉ định'];
  const WF_M3_KHUYEN_NGHI_KEYS = [
    { key: 'dieu_tri_stage_a', label: 'Điều trị Stage A (DD #173)' },
    { key: 'dieu_tri_stage_b', label: 'Điều trị Stage B (DD #174)' },
    { key: 'dieu_tri_stage_c', label: 'Điều trị Stage C (DD #175)' },
    { key: 'ca_the_hoa_nguoi_cao_tuoi', label: 'Cá thể hóa người cao tuổi (DD #176)' },
    { key: 'xu_tri_worsening_hf', label: 'Xử trí Worsening HF (DD #177)' },
    { key: 'xu_tri_decompensated_hf', label: 'Xử trí Decompensated HF (DD #178)' },
    { key: 'dieu_tri_stage_d', label: 'Điều trị Stage D (DD #179)' }
  ];

  const WF_TIMED_LAB_CODES = ['cls_bnp', 'cls_nt_probnp', 'cls_lvef', 'cls_creatinin', 'cls_kali'];
  const WF_LIST_CODES = ['diagnoses', 'medications', 'allergies'];
  const WF_CONTRACT_UNITS = {
    cls_nt_probnp: 'pg/mL',
    cls_bnp: 'pg/mL',
    cls_lvef: '%',
    cls_creatinin: 'umol/L',
    cls_kali: 'mmol/L',
    cls_natri: 'mmol/L',
    spo2: '%',
    mach: 'l/ph',
    can_nang_kg: 'kg',
    bien_thien_can_nang_7ngay: 'kg',
    e_over_a_ratio: 'ratio',
    egfr_ckd_epi: 'mL/min/1.73m2'
  };
  const WF_MED_CLASSES = ['MRA', 'ACEI', 'ARB', 'ARNI', 'NSAID', 'digoxin', 'amiodarone', 'loop_diuretic', 'beta_blocker', 'SGLT2i', 'other'];
  const WF_MED_UNITS = ['mg', 'g', 'mcg', 'mL', 'IU', 'tablet'];
  const WF_MED_ROUTES = ['oral', 'iv', 'im', 'sc', 'inhaled', 'topical', 'other'];
  const WF_MED_FREQS = [
    { value: 'once_daily', label: '1 lần/ngày' },
    { value: 'twice_daily', label: '2 lần/ngày' },
    { value: 'three_times_daily', label: '3 lần/ngày' },
    { value: 'as_needed', label: 'Khi cần' },
    { value: 'unknown', label: 'Chưa rõ' }
  ];
  const WF_RECENT_TEST_FIELDS = [
    { testKey: 'bnp_ntprobnp', label: 'BNP / NT-proBNP', fieldCodes: ['cls_nt_probnp', 'cls_bnp'] },
    { testKey: 'sieu_am_tim', label: 'Siêu âm tim (LVEF)', fieldCodes: ['cls_lvef'] },
    { testKey: 'ecg', label: 'ECG 12 chuyển đạo', fieldCodes: ['ecg_12_chuyen_dao'] },
    { testKey: 'xquang', label: 'X-quang ngực thẳng', fieldCodes: ['xquang_nguc_thang'] }
  ];
  const WF_CANONICAL_TO_FORM = {
    age: 'luot_tuoi',
    sex: 'bn_gioi_tinh',
    tang_huyet_ap: 'ts_tang_huyet_ap',
    dai_thao_duong: 'ts_dai_thao_duong',
    copd: 'ts_copd',
    thieu_mau: 'ts_thieu_mau'
  };
  const V12_STRUCTURED_ANSWER_CODES = V12_NINE_FIELD_CODES
    .concat(['egfr_formula', 'bat_thuong_cau_truc_tim'])
    .concat(WF_TIMED_LAB_CODES)
    .concat(WF_LIST_CODES);

  function isV12StructuredAnswerCode(code) {
    return V12_STRUCTURED_ANSWER_CODES.indexOf(code) >= 0;
  }

  function isTimedLabCode(code) {
    return WF_TIMED_LAB_CODES.indexOf(code) >= 0;
  }

  function isStructuredListCode(code) {
    return WF_LIST_CODES.indexOf(code) >= 0;
  }

  function getFieldMetaFromApi(fieldMetadata, code) {
    if (!fieldMetadata || !code) return null;
    if (fieldMetadata[code]) return fieldMetadata[code];
    const keys = Object.keys(fieldMetadata);
    for (let i = 0; i < keys.length; i++) {
      const m = fieldMetadata[keys[i]];
      if (m && m.fieldCode === code) return m;
    }
    return null;
  }

  function resolveFormFieldCode(fieldMetadata, rawCode) {
    if (!rawCode) return '';
    if (fieldMetadata && fieldMetadata[rawCode] && fieldMetadata[rawCode].fieldCode) {
      return fieldMetadata[rawCode].fieldCode;
    }
    if (WF_CANONICAL_TO_FORM[rawCode]) return WF_CANONICAL_TO_FORM[rawCode];
    return AI_FIELD_CODE_ALIASES[rawCode] || rawCode;
  }

  function makeUnknownAnswer() {
    return { value_state: 'unknown', value: null };
  }

  function cleanAnswerForDraft(code, rawAns) {
    if (!rawAns || typeof rawAns !== 'object') return null;
    if (rawAns.value_state === 'unknown') {
      return { value_state: 'unknown', value: null };
    }
    const ans = clone(rawAns);
    delete ans.ownerModule;
    if (ans.measuredAt === null || ans.measuredAt === undefined || String(ans.measuredAt).trim() === '') {
      delete ans.measuredAt;
    }
    if (ans.unit === null || ans.unit === undefined || String(ans.unit).trim() === '') {
      delete ans.unit;
    }
    if (isTimedLabCode(code)) {
      ans.unit = WF_CONTRACT_UNITS[code] || ans.unit;
    } else if (code === 'bien_thien_can_nang_7ngay') {
      ans.unit = 'kg';
    } else if (code === 'e_over_a_ratio') {
      ans.unit = 'ratio';
    } else if (code === 'egfr_ckd_epi') {
      ans.unit = 'mL/min/1.73m2';
    } else if (code === 'diagnoses' && Array.isArray(ans.value)) {
      ans.value = ans.value.map(function (x) {
        const s = typeof x === 'string' ? x : (x && x.code ? x.code : '');
        return String(s || '').trim().toUpperCase();
      }).filter(Boolean);
    } else if (code === 'medications' && Array.isArray(ans.value)) {
      ans.value = ans.value.map(function (m, idx) {
        if (!m || typeof m !== 'object') return null;
        if (m.ingredientCode) return clone(m);
        const row = {
          id: String(m.id || ('med-' + (idx + 1))),
          ingredient: String(m.ingredient || '').trim()
        };
        if (m.class) row.class = m.class;
        if (m.dose !== null && m.dose !== undefined && m.dose !== '') row.dose = Number(m.dose);
        if (m.unit) row.unit = m.unit;
        if (m.route) row.route = m.route;
        if (m.frequency) row.frequency = m.frequency;
        if (m.detail_state) row.detail_state = m.detail_state;
        return row;
      }).filter(Boolean);
    } else if (code === 'allergies' && Array.isArray(ans.value)) {
      ans.value = ans.value.map(function (a, idx) {
        if (!a || typeof a !== 'object') return null;
        return {
          id: String(a.id || ('alg-' + (idx + 1))),
          ingredient: String(a.ingredient || '').trim()
        };
      }).filter(Boolean);
    }
    return ans;
  }

  function isFormV12(formVersion, fieldDefs) {
    if (formVersion) {
      const lbl = String(formVersion.versionLabel || '').toLowerCase();
      if (lbl.indexOf('1.2') >= 0 || Number(formVersion.versionNo) >= 3) return true;
    }
    if (Array.isArray(fieldDefs)) {
      return fieldDefs.some(function (fd) { return fd && V12_NINE_FIELD_CODES.indexOf(fd.code) >= 0; });
    }
    return false;
  }

  function isV12NineField(code) {
    return V12_NINE_FIELD_CODES.indexOf(code) >= 0;
  }

  function makeDefaultEcgValue() {
    return { rhythm: 'unknown', rate: null, qrs_ms: null, qtc_ms: null, lbbb: null, pathological_q: null };
  }

  function makeDefaultXrayValue() {
    return { ctr: null, pulmonary_congestion: null, pleural_effusion: null };
  }

  function parseStructuredJsonVal(rawVal, fallbackMaker) {
    const base = fallbackMaker();
    if (!rawVal) return base;
    let obj = null;
    if (typeof rawVal === 'object' && !Array.isArray(rawVal)) {
      obj = rawVal;
    } else if (typeof rawVal === 'string') {
      try {
        const parsed = JSON.parse(rawVal);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) obj = parsed;
      } catch (_e) {}
    }
    if (!obj) return base;
    return Object.assign(base, obj);
  }

  function computeCkdEpi2021(creatinineVal, unit, age, sex) {
    if (creatinineVal === null || creatinineVal === undefined || creatinineVal === '' || !isFinite(Number(creatinineVal))) return null;
    if (age === null || age === undefined || !isFinite(Number(age)) || Number(age) < 1) return null;
    if (sex !== 'male' && sex !== 'female') return null;
    if (!unit || typeof unit !== 'string') return null;
    const rawNum = Number(creatinineVal);
    if (rawNum <= 0) return null;
    // F6: Convert strictly by explicit unit; NEVER guess unit from numeric threshold!
    const u = unit.trim().toLowerCase();
    let scrMgDl = null;
    if (u === 'mg/dl') {
      scrMgDl = rawNum;
    } else if (u === 'umol/l' || u === 'µmol/l' || u === 'μmol/l') {
      scrMgDl = rawNum / 88.4;
    } else {
      return null;
    }
    const isFemale = sex === 'female';
    const kappa = isFemale ? 0.7 : 0.9;
    const alpha = isFemale ? -0.241 : -0.302;
    const ratio = scrMgDl / kappa;
    const egfr = 142 * Math.pow(Math.min(ratio, 1), alpha) * Math.pow(Math.max(ratio, 1), -1.200) * Math.pow(0.9938, Number(age)) * (isFemale ? 1.012 : 1.0);
    if (!isFinite(egfr)) return null;
    return Math.max(1, Math.min(200, Math.round(egfr)));
  }

  function hasExactDecimalStep(num, step) {
    if (typeof num !== 'number' || !isFinite(num)) return false;
    const factor = Math.round(1 / step);
    const scaled = num * factor;
    return Math.abs(scaled - Math.round(scaled)) < 1e-6;
  }

  function validateV12CompactField(code, entry) {
    if (!entry || entry.value_state === 'unknown') return '';
    const v = entry.value;
    if (code === 'kho_tho_nang') {
      if (!Number.isInteger(v) || v < 0 || v > 3) return 'Giá trị khó thở phải là số nguyên 0–3.';
    } else if (code === 'phu_chi_duoi_muc_do') {
      if (!Number.isInteger(v) || v < 0 || v > 2) return 'Giá trị phù chi dưới phải là số nguyên 0–2.';
    } else if (code === 'trieu_chung_khong_dien_hinh') {
      if (!Number.isInteger(v) || v < 0 || v > 2) return 'Giá trị triệu chứng không điển hình phải là số nguyên 0–2.';
    } else if (code === 'danh_gia_suy_yeu_frailty') {
      if (!Number.isInteger(v) || v < 1 || v > 9) return 'Điểm suy yếu CFS phải là số nguyên 1–9.';
    } else if (code === 'bien_thien_can_nang_7ngay') {
      if (typeof v !== 'number' || !isFinite(v) || v < -20 || v > 20 || !hasExactDecimalStep(v, 0.1)) {
        return 'Biến thiên cân nặng 7 ngày phải nằm trong −20.0 đến +20.0 kg (bước 0.1).';
      }
    } else if (code === 'e_over_a_ratio') {
      if (v === 'not_measurable_af') return '';
      if (typeof v !== 'number' || !isFinite(v) || v < 0.2 || v > 5.0 || !hasExactDecimalStep(v, 0.01)) {
        return 'Tỉ lệ E/A phải nằm trong 0.20 đến 5.00 (bước 0.01) hoặc chọn Không đo được (rung nhĩ).';
      }
    } else if (code === 'egfr_ckd_epi') {
      if (typeof v !== 'number' || !isFinite(v) || !Number.isInteger(v) || v < 1 || v > 200) {
        return 'eGFR phải là số nguyên từ 1 đến 200 mL/phút/1.73m².';
      }
    } else if (code === 'ecg_12_chuyen_dao') {
      if (!v || typeof v !== 'object') return 'Dữ liệu ECG phải là nhóm cấu trúc hợp lệ.';
      const validRhythms = ['sinus', 'atrial_fibrillation', 'atrial_flutter', 'paced', 'other', 'unknown'];
      if (validRhythms.indexOf(v.rhythm) < 0) return 'Nhịp tim ECG không hợp lệ.';
      if (v.rate !== null && v.rate !== undefined && (!Number.isInteger(v.rate) || v.rate < 20 || v.rate > 250)) {
        return 'Tần số tim ECG phải là số nguyên 20–250 l/ph.';
      }
      if (v.qrs_ms !== null && v.qrs_ms !== undefined && (!Number.isInteger(v.qrs_ms) || v.qrs_ms < 40 || v.qrs_ms > 300)) {
        return 'Khoảng QRS phải là số nguyên 40–300 ms.';
      }
      if (v.qtc_ms !== null && v.qtc_ms !== undefined && (!Number.isInteger(v.qtc_ms) || v.qtc_ms < 200 || v.qtc_ms > 700)) {
        return 'Khoảng QTc phải là số nguyên 200–700 ms.';
      }
      const allEmptyEcg = Object.keys(v).every(function (k) { return v[k] === null || v[k] === undefined || v[k] === 'unknown'; });
      if (allEmptyEcg) return 'Cần nhập ít nhất một chỉ số ECG, hoặc bấm "Chưa rõ toàn bộ ECG".';
    } else if (code === 'xquang_nguc_thang') {
      if (!v || typeof v !== 'object') return 'Dữ liệu X-quang phải là nhóm cấu trúc hợp lệ.';
      if (v.ctr !== null && v.ctr !== undefined && (typeof v.ctr !== 'number' || !isFinite(v.ctr) || v.ctr < 0.3 || v.ctr > 0.8 || !hasExactDecimalStep(v.ctr, 0.01))) {
        return 'Chỉ số tim/ngực (CTR) phải nằm trong 0.30 đến 0.80 (bước 0.01).';
      }
      const allEmptyXr = Object.keys(v).every(function (k) { return v[k] === null || v[k] === undefined || v[k] === 'unknown'; });
      if (allEmptyXr) return 'Cần nhập ít nhất một chỉ số X-quang, hoặc bấm "Chưa rõ toàn bộ X-quang".';
    } else if (isTimedLabCode(code)) {
      if (typeof v !== 'number' || !isFinite(v)) return 'Giá trị xét nghiệm phải là số hợp lệ.';
      if (!entry.measuredAt) return 'Vui lòng nhập thời điểm đo (ngày giờ) cho xét nghiệm này.';
    }
    return '';
  }

  function makeIdempotencyKey(prefix) {
    if (global.crypto && typeof global.crypto.randomUUID === 'function') {
      return prefix + '-' + global.crypto.randomUUID();
    }
    return prefix + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
  }

  const AI_ISSUE_REASON_VI = {
    MISSING_VALUE: 'Chưa nhập giá trị',
    LIST_UNKNOWN: 'Chưa xác nhận trạng thái danh sách (Có / Không có)',
    LAB_MISSING: 'Chưa có kết quả cận lâm sàng hợp lệ',
    TIME_MISSING: 'Thiếu thời điểm thực hiện / lấy mẫu',
    UNIT_UNSUPPORTED: 'Đơn vị kết quả chưa đúng chuẩn',
    UNIT_OR_TYPE_UNSUPPORTED: 'Kiểu dữ liệu hoặc đơn vị chưa tương thích',
    NOT_COLLECTED: 'Biểu mẫu hiện chưa thu thập biến này',
    CATALOG_UNVERIFIED: 'Chưa đối chiếu danh mục chuẩn bệnh viện',
    CODE_UNMAPPED: 'Chưa có mã chuẩn hóa (ATC / ICD-10)',
    DRUG_STRUCTURE_UNSUPPORTED: 'Chưa đủ cấu trúc thuốc để kiểm tra tương tác (DDI)',
    FREE_TEXT_WITHHELD: 'Văn bản tự do được giữ trong hồ sơ, chưa xuất AI',
    STATIC_EXPORT_UNAVAILABLE: 'Chế độ demo tĩnh không hỗ trợ xuất JSON AI'
  };

  function formatAiIssueReasonVi(issueCode, fallbackMessageVi) {
    if (issueCode && AI_ISSUE_REASON_VI[issueCode]) return AI_ISSUE_REASON_VI[issueCode];
    return fallbackMessageVi || issueCode || 'Thiếu hoặc chưa hợp lệ';
  }

  function resolveEditableFormField(formRes, rawFieldCode) {
    if (!rawFieldCode || !formRes) return null;
    const canonicalCode = AI_FIELD_CODE_ALIASES[rawFieldCode] || rawFieldCode;
    const sections = formRes.sections || [];
    const defs = formRes.fieldDefinitions || [];
    const defById = {};
    const defByCode = {};
    defs.forEach(function (fd) {
      defById[fd.id] = fd;
      defByCode[fd.code] = fd;
    });
    for (let i = 0; i < sections.length; i++) {
      const sec = sections[i];
      const fields = sec.fields || [];
      for (let j = 0; j < fields.length; j++) {
        const ff = fields[j];
        const fd = defById[ff.fieldDefinitionId] || defByCode[ff.fieldCode];
        const code = (fd && fd.code) || ff.fieldCode;
        if (code !== canonicalCode && ff.fieldCode !== canonicalCode) continue;
        if (!ff.isVisible || !fd) return null;
        const flags = getFieldMetaFlags(ff, fd);
        if (flags.readonlyInput) return null;
        if (fd.storageLevel === 'visit' && !flags.isListStateField && !flags.isVisitNote) return null;
        return {
          fieldCode: code,
          sectionCode: sec.sectionCode || resolveFieldSectionCode(formRes, code),
          fd: fd,
          ff: ff
        };
      }
    }
    return null;
  }

  function resolveAiIssueDisplayLabel(iss, defByCode, editableTarget) {
    if (editableTarget && editableTarget.ff && editableTarget.ff.customLabelVi && String(editableTarget.ff.customLabelVi).trim()) {
      return String(editableTarget.ff.customLabelVi).trim();
    }
    const raw = (iss && iss.fieldCode) ? String(iss.fieldCode) : '';
    const canonical = AI_FIELD_CODE_ALIASES[raw] || raw;
    if (raw && AI_ISSUE_DISPLAY_LABELS[raw]) return AI_ISSUE_DISPLAY_LABELS[raw];
    if (raw && defByCode && defByCode[raw] && defByCode[raw].labelVi) return defByCode[raw].labelVi;
    if (canonical && defByCode && defByCode[canonical] && defByCode[canonical].labelVi) return defByCode[canonical].labelVi;
    if (canonical && AI_ISSUE_DISPLAY_LABELS[canonical]) return AI_ISSUE_DISPLAY_LABELS[canonical];
    const p = (iss && iss.path) ? String(iss.path) : '';
    const pathTail = p ? p.split('.').pop() : '';
    if (pathTail && AI_ISSUE_DISPLAY_LABELS[pathTail]) return AI_ISSUE_DISPLAY_LABELS[pathTail];
    return raw || p || 'Trường dữ liệu';
  }

  function classifyAndGroupAiQualityIssues(issues, formRes) {
    const list = Array.isArray(issues) ? issues : [];
    const defByCode = {};
    ((formRes && formRes.fieldDefinitions) || []).forEach(function (fd) {
      defByCode[fd.code] = fd;
    });
    const actionableMap = {};
    const systemMap = {};
    const actionable = [];
    const system = [];

    list.forEach(function (iss) {
      if (!iss) return;
      const issueCode = String(iss.issueCode || '');
      const rawFieldCode = String(iss.fieldCode || '');
      const editableTarget = AI_ACTIONABLE_ISSUE_CODES[issueCode]
        ? resolveEditableFormField(formRes, rawFieldCode)
        : null;
      const isActionable = Boolean(editableTarget);
      const canonicalCode = editableTarget
        ? editableTarget.fieldCode
        : (AI_FIELD_CODE_ALIASES[rawFieldCode] || rawFieldCode);
      const dedupFieldKey = canonicalCode || rawFieldCode || String(iss.path || '');
      const dedupKey = issueCode + '::' + dedupFieldKey;
      const map = isActionable ? actionableMap : systemMap;
      const bucketArr = isActionable ? actionable : system;

      let entry = map[dedupKey];
      if (!entry) {
        entry = {
          key: dedupKey,
          bucket: isActionable ? 'actionable' : 'system',
          issueCode: issueCode,
          rawFieldCode: rawFieldCode,
          jumpFieldCode: editableTarget ? editableTarget.fieldCode : '',
          sectionCode: editableTarget ? editableTarget.sectionCode : '',
          labelVi: resolveAiIssueDisplayLabel(iss, defByCode, editableTarget),
          techCode: rawFieldCode || String(iss.path || ''),
          reasonVi: formatAiIssueReasonVi(issueCode, iss.messageVi),
          severity: iss.severity || 'error',
          modules: []
        };
        map[dedupKey] = entry;
        bucketArr.push(entry);
      }
      if (iss.module && entry.modules.indexOf(iss.module) < 0) {
        entry.modules.push(iss.module);
      }
    });

    function sortModules(arr) {
      arr.forEach(function (entry) {
        entry.modules.sort(function (a, b) {
          const ia = AI_MODULE_ORDER.indexOf(a);
          const ib = AI_MODULE_ORDER.indexOf(b);
          if (ia >= 0 && ib >= 0) return ia - ib;
          if (ia >= 0) return -1;
          if (ib >= 0) return 1;
          return String(a).localeCompare(String(b));
        });
      });
    }
    sortModules(actionable);
    sortModules(system);

    return {
      actionable: actionable,
      system: system,
      totalRaw: list.length,
      totalGrouped: actionable.length + system.length
    };
  }

  function getInitials(name) {
    const parts = String(name || 'U').trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[parts.length - 2][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  function computeAge(pt, visitDateIso) {
    if (!pt) return null;
    const ref = visitDateIso ? new Date(visitDateIso) : new Date();
    const refYear = isNaN(ref.getTime()) ? new Date().getFullYear() : ref.getFullYear();
    if (pt.birthDate) {
      const bd = new Date(pt.birthDate + 'T00:00:00Z');
      if (!isNaN(bd.getTime())) {
        let age = ref.getUTCFullYear() - bd.getUTCFullYear();
        const md = ref.getUTCMonth() - bd.getUTCMonth();
        if (md < 0 || (md === 0 && ref.getUTCDate() < bd.getUTCDate())) age -= 1;
        return Math.max(0, Math.min(120, age));
      }
    }
    if (pt.birthYear != null) return Math.max(0, Math.min(120, refYear - Number(pt.birthYear)));
    if (pt.declaredAge != null) return Math.max(0, Math.min(120, Number(pt.declaredAge)));
    return null;
  }

  function computeBmi(h, w) {
    if (typeof h !== 'number' || typeof w !== 'number' || !isFinite(h) || !isFinite(w) || h <= 0 || w <= 0) return null;
    const m = h / 100;
    return Math.round((w / (m * m)) * 100) / 100;
  }

  const TOAST_DURATION_MS = 4000;
  const TOAST_MAX_VISIBLE = 3;

  function dismissToastEl(el) {
    if (!el || el._dismissed) return;
    el._dismissed = true;
    if (el._toastTimer) {
      clearTimeout(el._toastTimer);
      el._toastTimer = null;
    }
    el.classList.add('toast--leaving');
    setTimeout(function () {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 160);
  }

  function toast(msg, kind) {
    const region = document.getElementById('toast-region');
    if (!region) return;
    const text = String(msg || '').trim();
    if (!text) return;

    // Deduplicate identical active message (refresh timer instead of stacking)
    const existing = Array.prototype.slice.call(region.children).find(function (child) {
      return !child._dismissed && child.getAttribute('data-toast-msg') === text;
    });
    if (existing) {
      if (existing._toastTimer) clearTimeout(existing._toastTimer);
      existing._toastTimer = setTimeout(function () { dismissToastEl(existing); }, TOAST_DURATION_MS);
      return;
    }

    // Cap visible toasts at TOAST_MAX_VISIBLE (evict oldest)
    while (region.children.length >= TOAST_MAX_VISIBLE) {
      const oldest = region.firstElementChild;
      if (oldest._toastTimer) clearTimeout(oldest._toastTimer);
      region.removeChild(oldest);
    }

    const el = document.createElement('div');
    el.className = 'toast' + (kind ? ' toast--' + kind : '');
    el.setAttribute('data-toast-msg', text);
    const span = document.createElement('span');
    span.className = 'toast__text';
    span.textContent = text;
    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'toast__close';
    closeBtn.setAttribute('aria-label', 'Đóng thông báo');
    closeBtn.textContent = '×';
    closeBtn.addEventListener('click', function () { dismissToastEl(el); });
    el.appendChild(span);
    el.appendChild(closeBtn);
    region.appendChild(el);
    el._toastTimer = setTimeout(function () { dismissToastEl(el); }, TOAST_DURATION_MS);
  }

  /* ------------------------------------------------------------------------
     Review Summary Collapse Persistence (Session-Scoped)
     ------------------------------------------------------------------------ */
  const REVIEW_SUMMARY_COLLAPSED_LIMIT = 8;
  const REVIEW_SUMMARY_STORAGE_KEY = 'suytim_review_summary_expanded';

  function getReviewSummaryExpanded() {
    try {
      return global.sessionStorage.getItem(REVIEW_SUMMARY_STORAGE_KEY) === '1';
    } catch (_e) {
      return false;
    }
  }

  function setReviewSummaryExpanded(expanded) {
    try {
      global.sessionStorage.setItem(REVIEW_SUMMARY_STORAGE_KEY, expanded ? '1' : '0');
    } catch (_e) {}
  }

  /* ------------------------------------------------------------------------
     Application State Store
     ------------------------------------------------------------------------ */
  const state = {
    user: null,
    screen: 'login',
    loading: false,
    mobileMenuOpen: false,
    sidebarCollapsed: (function () { try { return global.localStorage.getItem('suytim_sidebar_collapsed') === '1'; } catch (_e) { return false; } })(),
    forbiddenReason: '',

    // M1 Login
    login: { username: '', password: '', showPassword: false, error: '', submitting: false },

    // M2 Patients
    patients: { items: [], q: '', status: '', loading: false, error: '' },

    // M3 Patient Profile
    profile: { patientId: null, patient: null, latestVisitSummary: null, visits: [], careAssignments: [], careDoctors: [], careLoading: false, careError: '', loading: false, error: '' },

    // M4 Encounter
    encounter: {
      visitId: null,
      access: null,
      patient: null,
      visit: null,
      formStructure: null,
      isV12: false,
      defById: {},
      defByCode: {},
      valuesByDefId: {}, // { fieldDefinitionId: VisitValue (scalar or structured .answer) }
      workflowSummary: null,    // detail.workflow from GET /visits/{id} & PUT /draft
      fieldMetadata: {},        // detail.fieldMetadata from GET /visits/{id} & PUT /draft
      savedUnknownCodes: {},    // { fieldCode: true } fields currently saved on server as unknown
      unlockedUnknownCodes: {}, // { fieldCode: true } fields unlocked on UI after toggling off saved Chưa rõ
      moduleFilter: 'all',      // all | m1 | m2 | m3 | m4
      pendingModuleFilter: null,
      expandedMissingMod: null, // m1..m4 | null
      runningModule: null,      // m1..m4 | null when running directly from form bar
      weightCalcOpen: false,
      weightPrev7d: '',
      atypicalNote: '',
      orthostaticBp: [],
      medications: [],
      allergies: [],
      labResults: [],
      diagnoses: [],
      medicationListState: 'unknown',
      allergyListState: 'unknown',
      diagnosisListState: 'unknown',
      supportsListStates: false,
      revisions: [],
      clinicalNote: '',
      infoSource: '',
      activeSectionCode: 'hanh_chinh',
      fieldSearch: '',
      fieldFilter: 'all', // all | unfilled | error
      fieldErrors: {},    // { fieldCode: message }
      errorList: [],
      conflictError: null,
      dirty: false,
      editVersion: 0,
      loadGeneration: 0,
      savePromise: null,
      saveQueued: false,
      savingVersion: null,
      lastSavedAt: null,
      autoPulseSourceIndex: null,
      highlightFieldCode: null,
      scrollToSectionCode: null,
      saving: false,
      loading: false,
      error: ''
    },

    // M5 Review
    review: {
      visitId: null,
      access: null,
      visit: null,
      visitDetail: null,
      formRes: null,
      patient: null,
      formVersion: null,
      revisions: [],
      data: null,
      confirmNote: '',
      aiInputPayload: null,
      showAiPayload: false,
      aiExportV1: null,
      aiExportQuality: null,
      aiExportError: '',
      aiExportLoading: false,
      aiExportIsDiagnostic: false,
      aiQualityExpanded: { actionable: false, system: false },
      confirming: false,
      confirmError: '',
      loading: false,
      error: ''
    },

    // Workflow 4-Module (hf-workflow/1.0 — Results & Decisions Only)
    workflow: {
      visitId: null,
      loading: false,
      error: '',
      errorStatus: null,
      errorCode: '',
      bannerError: '',
      bannerErrorStatus: null,
      bannerErrorCode: '',
      bannerErrorFields: [],
      visit: null,
      patient: null,
      formRes: null,
      visitDetail: null,
      data: null,           // workflowState or pharmacist m4ReadView
      isPharmacistView: false,
      activeModule: 'm1',
      preferredModuleOnLoad: null,
      manualModeModule: null,
      manualDraft: null,
      manualReason: '',
      manualReasonError: '',
      manualM4Alerts: [],
      manualM4Confirmations: {},
      selectedPrescription: { value_state: 'answered', listState: 'none', items: [] },
      historyOpen: {},      // { m1: bool, ... }
      historyRuns: {},      // { m1: [moduleRun, ...] }
      historySelectedRun: {}, // { m1: runId }
      runCache: {},         // { runId: moduleRun }
      decisionCache: {},    // { decisionId: effectiveDecision }
      expandedUpstream: {}, // { m1: bool }
      runningModule: null,
      submittingAction: false,
      savingFields: false,  // used only for saving M2 recentTestEvidence decision
      fieldValues: {},      // read-only mirror for medication labels / summaries
      fieldMetadata: {},
      observations: [],     // workflow observations with measuredAt for M2 recentTestEvidence
      recentTestEvidence: {}, // { testKey: { id, fieldCode, measuredAt, doctorConfirmedReuse } }
      recentTestEvidenceDirty: false,
      m4ProjectionOutput: null, // hydrated from GET /workflow?module=m4
      fieldErrors: {},
      m4Decisions: {},      // { alertId: { quyet_dinh, ly_do, error } }
      m4Saving: false,
      lastRunErrors: {}     // { m1: runError }
    },

    // M6 Admin Users
    adminUsers: { items: [], q: '', role: '', isActive: '', loading: false, error: '' },

    // M7 Admin Forms
    adminForms: {
      template: null,
      versions: [],
      selectedVersionId: null,
      versionDetail: null,
      draftSections: null, // mutable copy for Tab 1 editing
      draftDirty: false,
      selectedSectionCode: 'hanh_chinh',
      selectedFieldDefId: null,
      fieldSearch: '',
      activeTab: 'editor', // editor | preview | diff
      previewData: null,
      previewError: '',
      previewValues: {},
      previewWeightCalcOpen: false,
      previewWeightPrev7d: '',
      previewAtypicalNote: '',
      previewBp: [],
      previewAutoPulseSourceIndex: null,
      previewMeds: [],
      previewAllergies: [],
      previewLabs: [],
      previewDiagnoses: [],
      previewMedicationListState: 'unknown',
      previewAllergyListState: 'unknown',
      previewDiagnosisListState: 'unknown',
      previewInfoSource: '',
      previewClinicalNote: '',
      previewSectionCode: 'hanh_chinh',
      previewSearch: '',
      diffBaseVersionId: null,
      diffData: null,
      publishNote: '',
      allDefinitions: [],
      loading: false,
      error: ''
    },

    // M8 Admin Audit
    adminAudit: {
      items: [],
      q: '',
      action: '',
      entityType: '',
      fromDate: '',
      toDate: '',
      selectedLogId: null,
      loading: false,
      error: ''
    },

    // M9 Admin Care Coordination (K8 compliant)
    adminCare: {
      q: '',
      patients: [],
      selectedPatientId: null,
      selectedPatient: null,
      assignments: [],
      doctors: [],
      loading: false,
      assignmentsLoading: false,
      error: ''
    },

    // Modal state
    modal: null
  };

  // Search results replace the SPA root, so direct reloads used to discard focus
  // after every character. Debounce and ignore stale responses instead.
  const liveSearch = {
    patients: { timer: null, sequence: 0 },
    users: { timer: null, sequence: 0 },
    audit: { timer: null, sequence: 0 },
    adminCare: { timer: null, sequence: 0 }
  };

  function captureInputFocus(input) {
    if (!input || !input.id) return null;
    return { id: input.id, start: input.selectionStart, end: input.selectionEnd };
  }

  function restoreInputFocus(snapshot) {
    if (!snapshot) return;
    const input = document.getElementById(snapshot.id);
    if (!input) return;
    input.focus();
    if (typeof input.setSelectionRange === 'function' && snapshot.start !== null && snapshot.end !== null) {
      input.setSelectionRange(snapshot.start, snapshot.end);
    }
  }

  function scheduleLiveSearch(kind, input) {
    const tracker = liveSearch[kind];
    if (!tracker) return;
    global.clearTimeout(tracker.timer);
    const sequence = ++tracker.sequence;
    const focus = captureInputFocus(input);
    tracker.timer = global.setTimeout(function () {
      const options = { liveSearchSequence: sequence, restoreFocus: focus };
      if (kind === 'patients') loadPatients(options);
      else if (kind === 'users') loadAdminUsers(options);
      else if (kind === 'audit') loadAdminAudit(options);
      else if (kind === 'adminCare') loadAdminCare(options);
    }, 180);
  }

  function isCurrentLiveSearch(kind, options) {
    return !options || !options.liveSearchSequence || liveSearch[kind].sequence === options.liveSearchSequence;
  }

  function refreshLiveBmi(formTarget) {
    const heightDef = Object.values(formTarget.defById).find(function (fd) { return fd.code === 'chieu_cao_cm'; });
    const weightDef = Object.values(formTarget.defById).find(function (fd) { return fd.code === 'can_nang_kg'; });
    const height = heightDef && formTarget.valuesByDefId[heightDef.id] ? Number(formTarget.valuesByDefId[heightDef.id].valueNum) : null;
    const weight = weightDef && formTarget.valuesByDefId[weightDef.id] ? Number(formTarget.valuesByDefId[weightDef.id].valueNum) : null;
    const value = computeBmi(height, weight);
    const output = document.querySelector('[data-field-code="bmi"] .bmi-card__value');
    if (output) output.textContent = value !== null ? value + ' kg/m²' : 'Chưa đủ dữ liệu';
  }

  function refreshNumericInput(input) {
    // Keep the native input (and its caret) intact, including when clearing or
    // entering zero. Only update the decorations that used to require render().
    input.classList.toggle('input--unfilled', input.value === '');
    const field = input.closest('.field');
    if (!field) return;
    const zeroChip = field.querySelector('.zero-chip');
    const isZero = input.value !== '' && Number(input.value) === 0;
    if (isZero && !zeroChip) {
      const chip = document.createElement('span');
      chip.className = 'zero-chip';
      chip.textContent = 'Đã nhập: 0 (khác với để trống)';
      field.querySelector('.input-row-unknown').after(chip);
    } else if (!isZero && zeroChip) {
      zeroChip.remove();
    }
  }

  function syncHeartRateFromBp(formTarget, heartRate, sourceIndex) {
    const pulseDef = Object.values(formTarget.defById).find(function (fd) { return fd.code === 'mach'; });
    if (!pulseDef || heartRate === null || heartRate === undefined || heartRate === '') return;
    const existing = formTarget.valuesByDefId[pulseDef.id];
    const autoSourceIndex = formTarget.getAutoPulseSourceIndex();
    const hasManualPulse = existing && existing.valueState === 'answered' && existing.valueNum !== null && existing.valueNum !== undefined && autoSourceIndex === null;
    if (hasManualPulse) return;
    if (sourceIndex === undefined || sourceIndex === null || sourceIndex !== formTarget.orthostaticBp.length - 1) return;
    const value = makeEmptyVisitValue(formTarget.visitId, pulseDef, 'answered');
    value.valueNum = Number(heartRate);
    value.unit = pulseDef.canonicalUnit || null;
    formTarget.valuesByDefId[pulseDef.id] = value;
    formTarget.setAutoPulseSourceIndex(sourceIndex);
    const input = document.querySelector('input[' + formTarget.numberInputAttribute + '="' + pulseDef.id + '"]');
    if (input && document.activeElement !== input) input.value = String(value.valueNum);
  }

  function clearAutoPulseValue(formTarget) {
    const pulseDef = Object.values(formTarget.defById).find(function (fd) { return fd.code === 'mach'; });
    if (!pulseDef || formTarget.getAutoPulseSourceIndex() === null) return;
    delete formTarget.valuesByDefId[pulseDef.id];
    formTarget.setAutoPulseSourceIndex(null);
  }

  function renderPreservingEditorScroll() {
    const positions = Array.prototype.map.call(document.querySelectorAll('.editor-pane__scroll'), function (el) {
      return el.scrollTop;
    });
    render();
    global.requestAnimationFrame(function () {
      Array.prototype.forEach.call(document.querySelectorAll('.editor-pane__scroll'), function (el, index) {
        el.scrollTop = positions[index] || 0;
      });
    });
  }

  /* ------------------------------------------------------------------------
     Hash Router & Guarded Navigation
     ------------------------------------------------------------------------ */
  let activeRouteHash = global.location.hash;
  let activeRouteIndex = Number.isInteger((global.history.state || {}).suytimRouteIndex) ? global.history.state.suytimRouteIndex : 0;
  let restoringRoute = null;
  let allowedRouteHash = null;
  global.history.replaceState(Object.assign({}, global.history.state, { suytimRouteIndex: activeRouteIndex }), '', global.location.href);

  function navigate(hash, skipDirtyGuard) {
    closeAccountMenu(false);
    if (!skipDirtyGuard && state.screen === 'encounter' && state.encounter.dirty && hash !== global.location.hash) {
      openUnsavedGuardModal(hash);
      return;
    }
    if (global.location.hash === hash) {
      if (state.screen === 'encounter' && state.encounter.dirty && !skipDirtyGuard) return;
      handleRoute();
    } else {
      activeRouteIndex += 1;
      activeRouteHash = hash;
      global.history.pushState({ suytimRouteIndex: activeRouteIndex }, '', hash);
      handleRoute();
    }
  }

  function leaveGuardedRoute(modal) {
    if (Number.isInteger(modal.targetHistoryIndex) && modal.targetHistoryIndex !== activeRouteIndex) {
      allowedRouteHash = modal.targetHash;
      global.history.go(modal.targetHistoryIndex - activeRouteIndex);
    } else {
      navigate(modal.targetHash, true);
    }
  }

  function onHashChange() {
    closeAccountMenu(false);
    const hash = global.location.hash;
    let index = (global.history.state || {}).suytimRouteIndex;
    if (!Number.isInteger(index)) {
      index = activeRouteIndex + 1;
      global.history.replaceState(Object.assign({}, global.history.state, { suytimRouteIndex: index }), '', global.location.href);
    }
    if (restoringRoute) {
      if (hash === activeRouteHash && index === activeRouteIndex) {
        const destination = restoringRoute;
        restoringRoute = null;
        openUnsavedGuardModal(destination.hash, destination.index);
      } else {
        global.history.go(activeRouteIndex - index);
      }
      return;
    }
    if (hash === activeRouteHash && index === activeRouteIndex) return;
    const allowed = allowedRouteHash === hash;
    allowedRouteHash = null;
    if (!allowed && state.screen === 'encounter' && state.encounter.dirty) {
      restoringRoute = { hash: hash, index: index };
      global.history.go(activeRouteIndex - index);
      return;
    }
    activeRouteHash = hash;
    activeRouteIndex = index;
    handleRoute();
  }

  async function handleRoute() {
    const raw = (global.location.hash || '#/login').replace(/^#/, '');
    const parts = raw.split('/').filter(Boolean);
    state.mobileMenuOpen = false;

    if (!state.user) {
      state.screen = 'login';
      render();
      return;
    }

    const role = state.user.role;
    const head = parts[0] || '';

    const isWorkflowRoute = head === 'visits' && parts.length === 3 && parts[2] === 'workflow';

    // Enforce K8 role separation on routes
    if (head === 'login' || head === '') {
      if (role === 'pharmacist') {
        state.screen = 'workflow';
        state.workflow.error = 'Tài khoản Dược sĩ chỉ xem được Module 4: An toàn thuốc khi mở trực tiếp đường dẫn lượt khám (#/visits/:visitId/workflow).';
        state.workflow.isPharmacistView = true;
        render();
        return;
      }
      const target = role === 'admin' ? '#/admin/users' : '#/patients';
      global.location.hash = target;
      return;
    }

    if ((head === 'patients' || head === 'visits') && role !== 'doctor') {
      if (role === 'pharmacist' && isWorkflowRoute) {
        state.screen = 'workflow';
        await loadWorkflow(parts[1]);
        return;
      }
      state.screen = 'forbidden';
      state.forbiddenReason = role === 'pharmacist'
        ? 'Tài khoản Dược sĩ chỉ có quyền xem Module 4 (An toàn thuốc) trên tuyến #/visits/:visitId/workflow.'
        : 'Tài khoản Quản trị viên (admin) không có quyền truy cập hồ sơ bệnh nhân hoặc dữ liệu lượt khám lâm sàng theo nguyên tắc tách quyền K8.';
      if (role === 'admin') {
        try { await api.listPatients({}); } catch (_ignored) {}
      }
      render();
      return;
    }

    if (head === 'admin' && role !== 'admin') {
      state.screen = 'forbidden';
      state.forbiddenReason = role === 'pharmacist'
        ? 'Tài khoản Dược sĩ không có quyền truy cập phân hệ Quản trị.'
        : 'Tài khoản Bác sĩ không có quyền truy cập phân hệ Quản trị tài khoản, Biểu mẫu hay Nhật ký hệ thống.';
      try { await api.listUsers({}); } catch (_ignored) {}
      render();
      return;
    }

    if (head === 'patients' && parts.length === 1) {
      state.screen = 'patients';
      await loadPatients();
      return;
    }
    if (head === 'patients' && parts.length >= 2) {
      state.screen = 'profile';
      await loadProfile(parts[1]);
      return;
    }
    if (head === 'visits' && parts.length === 2) {
      state.screen = 'encounter';
      await loadEncounter(parts[1]);
      return;
    }
    if (head === 'visits' && parts.length === 3 && parts[2] === 'review') {
      state.screen = 'review';
      await loadReview(parts[1]);
      return;
    }
    if (isWorkflowRoute) {
      state.screen = 'workflow';
      await loadWorkflow(parts[1]);
      return;
    }
    if (head === 'admin' && parts[1] === 'users') {
      state.screen = 'admin-accounts';
      await loadAdminUsers();
      return;
    }
    if (head === 'admin' && parts[1] === 'forms') {
      state.screen = 'admin-forms';
      await loadAdminForms();
      return;
    }
    if (head === 'admin' && parts[1] === 'audit') {
      state.screen = 'admin-audit';
      await loadAdminAudit();
      return;
    }
    if (head === 'admin' && parts[1] === 'care') {
      state.screen = 'admin-care';
      await loadAdminCare();
      return;
    }

    global.location.hash = role === 'admin' ? '#/admin/users' : '#/patients';
  }

  /* ------------------------------------------------------------------------
     Data Loaders (All wired through ApiClient)
     ------------------------------------------------------------------------ */
  function handleAuthOrError(err, fallbackMsg) {
    if (err && err.status === 401) {
      state.user = null;
      state.login.error = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
      state.screen = 'login';
      render();
      return;
    }
    if (err && err.status === 403) {
      state.screen = 'forbidden';
      state.forbiddenReason = err.detail || 'Bạn không có quyền truy cập tài nguyên này.';
      render();
      return;
    }
    toast((err && err.detail) || fallbackMsg || 'Đã xảy ra lỗi khi tải dữ liệu.', 'error');
  }

  async function loadPatients(options) {
    const opts = options || null;
    state.patients.loading = true;
    state.patients.error = '';
    if (!opts) render();
    try {
      const res = await api.listPatients({
        q: state.patients.q,
        latestVisitStatus: state.patients.status,
        pageSize: 50
      });
      if (!isCurrentLiveSearch('patients', opts)) return;
      state.patients.items = (res && res.items) || [];
    } catch (err) {
      state.patients.error = (err && err.detail) || 'Không tải được danh sách hồ sơ bệnh nhân.';
      if (err && (err.status === 401 || err.status === 403)) return handleAuthOrError(err);
    } finally {
      if (!isCurrentLiveSearch('patients', opts)) return;
      state.patients.loading = false;
      render();
      restoreInputFocus(opts && opts.restoreFocus);
    }
  }

  function syncCachedPatientVisitStatus(visit) {
    if (!visit || !visit.patientId) return;
    state.patients.items = state.patients.items.map(function (item) {
      if (item.patient.id !== visit.patientId || item.latestVisitId !== visit.id) return item;
      return Object.assign({}, item, { latestVisitStatus: visit.status });
    }).filter(function (item) {
      return !state.patients.status || item.latestVisitStatus === state.patients.status;
    });
  }

  async function loadProfile(patientId) {
    state.profile.patientId = patientId;
    state.profile.loading = true;
    state.profile.error = '';
    render();
    try {
      const [ptRes, visRes] = await Promise.all([
        api.getPatient(patientId),
        api.listPatientVisits(patientId, { pageSize: 50 })
      ]);
      state.profile.patient = ptRes.patient;
      state.profile.latestVisitSummary = ptRes.latestVisitSummary || null;
      state.profile.visits = (visRes && visRes.items) || [];
    } catch (err) {
      state.profile.patient = null;
      state.profile.error = formatClinicalError(err, 'Không tải được hồ sơ bệnh nhân.');
      if (err && (err.status === 401 || err.status === 403)) return handleAuthOrError(err);
    } finally {
      state.profile.loading = false;
      render();
    }
  }

  function hydrateEncounterValuesFromDetail(enc, detail) {
    enc.valuesByDefId = {};
    enc.savedUnknownCodes = {};
    enc.unlockedUnknownCodes = {};
    const visitId = detail && detail.visit ? detail.visit.id : enc.visitId;
    (detail && detail.values ? detail.values : []).forEach(function (v) {
      if (!v) return;
      const fd = enc.defById[v.fieldDefinitionId] || enc.defByCode[v.fieldCode];
      if (!fd) {
        enc.valuesByDefId[v.fieldDefinitionId] = clone(v);
        return;
      }
      if (enc.isV12 && isV12StructuredAnswerCode(fd.code)) {
        const ans = (v.answer && typeof v.answer === 'object')
          ? clone(v.answer)
          : visitValueToCompact(fd.code, v, fd);
        if (ans) {
          enc.valuesByDefId[fd.id] = {
            visitId: visitId,
            fieldDefinitionId: fd.id,
            fieldCode: fd.code,
            valueState: ans.value_state,
            answer: ans
          };
          if (ans.value_state === 'unknown') enc.savedUnknownCodes[fd.code] = true;
        }
        return;
      }
      const copy = clone(v);
      if (copy.answer && typeof copy.answer === 'object') {
        const ans = copy.answer;
        copy.valueState = ans.value_state || copy.valueState || 'unknown';
        if (copy.valueState === 'answered') {
          if (fd.dataType === 'boolean' && copy.valueBool == null) {
            copy.valueBool = Boolean(ans.value);
          } else if ((fd.dataType === 'number' || fd.dataType === 'integer') && copy.valueNum == null && ans.value !== null && ans.value !== undefined) {
            copy.valueNum = Number(ans.value);
            copy.unit = ans.unit || copy.unit || fd.canonicalUnit || null;
          } else if (fd.dataType === 'text' && copy.valueText == null && ans.value !== null && ans.value !== undefined) {
            copy.valueText = String(ans.value);
          }
        }
        delete copy.answer;
      }
      enc.valuesByDefId[fd.id] = copy;
      if (copy.valueState === 'unknown') enc.savedUnknownCodes[fd.code] = true;
    });

    if (enc.isV12 && detail) {
      // Fallback hydration for the 5 timed labs from unambiguous single legacy labResults row
      WF_TIMED_LAB_CODES.forEach(function (labCode) {
        const fd = enc.defByCode[labCode];
        if (!fd || enc.valuesByDefId[fd.id]) return;
        const rows = (detail.labResults || []).filter(function (r) {
          return r && r.labCode === labCode && r.valueNum !== null && r.valueNum !== undefined;
        });
        if (rows.length === 1) {
          const r = rows[0];
          const ans = {
            value_state: 'answered',
            value: Number(r.valueNum),
            unit: r.unit || WF_CONTRACT_UNITS[labCode] || fd.canonicalUnit || null
          };
          if (r.measuredAt) ans.measuredAt = r.measuredAt;
          enc.valuesByDefId[fd.id] = {
            visitId: visitId,
            fieldDefinitionId: fd.id,
            fieldCode: labCode,
            valueState: 'answered',
            answer: ans
          };
        }
      });

      // Fallback hydration for structured lists from legacy tables when visit_value.answer is absent
      const dxDef = enc.defByCode.diagnoses;
      if (dxDef && !enc.valuesByDefId[dxDef.id]) {
        const legacyDx = detail.diagnoses || [];
        if (legacyDx.length > 0 || (detail.visit && detail.visit.diagnosisListState === 'none')) {
          enc.valuesByDefId[dxDef.id] = {
            visitId: visitId,
            fieldDefinitionId: dxDef.id,
            fieldCode: 'diagnoses',
            valueState: 'answered',
            answer: { value_state: 'answered', value: legacyDx.map(function (d) { return d.code; }).filter(Boolean) }
          };
        }
      }
      const medDef = enc.defByCode.medications;
      if (medDef && !enc.valuesByDefId[medDef.id]) {
        const legacyMeds = (detail.medications || []).filter(function (m) { return m && m.status === 'active'; });
        if (legacyMeds.length > 0 || (detail.visit && detail.visit.medicationListState === 'none')) {
          enc.valuesByDefId[medDef.id] = {
            visitId: visitId,
            fieldDefinitionId: medDef.id,
            fieldCode: 'medications',
            valueState: 'answered',
            answer: {
              value_state: 'answered',
              value: legacyMeds.map(function (m, idx) {
                return {
                  id: m.id || ('med-' + (idx + 1)),
                  ingredient: m.activeIngredient || m.drugName || '',
                  class: null,
                  dose: m.dose != null ? Number(m.dose) : null,
                  unit: m.unit || null,
                  route: m.route === 'subcutaneous' ? 'sc' : (m.route || null),
                  frequency: m.frequency || null
                };
              })
            }
          };
        }
      }
      const algDef = enc.defByCode.allergies;
      if (algDef && !enc.valuesByDefId[algDef.id]) {
        const legacyAlgs = detail.allergies || [];
        if (legacyAlgs.length > 0 || (detail.visit && detail.visit.allergyListState === 'none')) {
          enc.valuesByDefId[algDef.id] = {
            visitId: visitId,
            fieldDefinitionId: algDef.id,
            fieldCode: 'allergies',
            valueState: 'answered',
            answer: {
              value_state: 'answered',
              value: legacyAlgs.map(function (a, idx) {
                return { id: a.id || ('alg-' + (idx + 1)), ingredient: a.atcCode || a.allergen || '' };
              })
            }
          };
        }
      }
    }
  }

  async function loadEncounter(visitId) {
    const enc = state.encounter;
    const generation = ++enc.loadGeneration;
    enc.visitId = visitId;
    enc.access = null;
    enc.savePromise = null;
    enc.saveQueued = false;
    enc.saving = false;
    enc.runningModule = null;
    enc.expandedMissingMod = null;
    enc.loading = true;
    enc.error = '';
    enc.conflictError = null;
    enc.fieldErrors = {};
    enc.errorList = [];
    render();
    try {
      const [detail, formRes] = await Promise.all([
        api.getVisit(visitId),
        api.getVisitForm(visitId)
      ]);
      const ptRes = await api.getPatient(detail.visit.patientId);
      if (generation !== enc.loadGeneration || enc.visitId !== visitId || state.screen !== 'encounter') return;
      enc.patient = ptRes.patient;
      enc.access = detail.access || (ptRes.patient && ptRes.patient.access) || null;
      enc.visit = detail.visit;
      enc.formStructure = formRes;
      enc.isV12 = isFormV12(formRes.formVersion, formRes.fieldDefinitions);
      enc.defById = {};
      enc.defByCode = {};
      (formRes.fieldDefinitions || []).forEach(function (fd) {
        enc.defById[fd.id] = fd;
        enc.defByCode[fd.code] = fd;
      });
      enc.workflowSummary = detail.workflow || null;
      enc.fieldMetadata = detail.fieldMetadata || {};
      if (enc.pendingModuleFilter) {
        enc.moduleFilter = enc.pendingModuleFilter;
        enc.pendingModuleFilter = null;
      } else {
        enc.moduleFilter = 'all';
      }
      enc.orthostaticBp = clone(detail.orthostaticBp || []);
      enc.medications = clone(detail.medications || []);
      enc.allergies = clone(detail.allergies || []);
      enc.labResults = clone(detail.labResults || []);
      enc.diagnoses = clone(detail.diagnoses || []);
      hydrateEncounterValuesFromDetail(enc, detail);
      const hasV11Features = Boolean(
        (formRes.formVersion && Number(formRes.formVersion.versionNo) >= 2) ||
        (formRes.fieldDefinitions || []).some(function (fd) {
          return fd.repeatGroup === 'diagnoses' || fd.storageLevel === 'diagnosis' || fd.code === 'nhiet_do';
        })
      );
      enc.supportsListStates = Boolean(
        hasV11Features ||
        detail.visit.medicationListState !== undefined ||
        detail.visit.allergyListState !== undefined ||
        detail.visit.diagnosisListState !== undefined ||
        detail.diagnoses !== undefined
      );
      enc.medicationListState = detail.visit.medicationListState || (enc.medications.length > 0 ? 'known' : 'unknown');
      enc.allergyListState = detail.visit.allergyListState || (enc.allergies.length > 0 ? 'known' : 'unknown');
      enc.diagnosisListState = detail.visit.diagnosisListState || (enc.diagnoses.length > 0 ? 'known' : 'unknown');
      enc.revisions = clone(detail.revisions || []);
      enc.autoPulseSourceIndex = null;
      enc.clinicalNote = detail.visit.clinicalNote || '';
      enc.infoSource = detail.visit.infoSource || '';
      enc.dirty = false;
      enc.editVersion = 0;
      enc.lastSavedAt = detail.visit.updatedAt;
      if (formRes.sections && formRes.sections.length > 0 && !formRes.sections.some(function (s) { return s.sectionCode === enc.activeSectionCode; })) {
        enc.activeSectionCode = formRes.sections[0].sectionCode;
      }
    } catch (err) {
      if (generation !== enc.loadGeneration || enc.visitId !== visitId || state.screen !== 'encounter') return;
      enc.visit = null;
      enc.formStructure = null;
      enc.error = formatClinicalError(err, 'Không tải được biểu mẫu lượt khám.');
      if (err && (err.status === 401 || err.status === 403)) return handleAuthOrError(err);
    } finally {
      if (generation !== enc.loadGeneration || enc.visitId !== visitId || state.screen !== 'encounter') return;
      enc.loading = false;
      render();
      if (enc.highlightFieldCode) {
        const code = resolveFormFieldCode(enc.fieldMetadata, enc.highlightFieldCode);
        enc.highlightFieldCode = null;
        setTimeout(function () {
          if (!findTargetElementForField(code) && enc.moduleFilter !== 'all') {
            enc.moduleFilter = 'all';
            render();
            setTimeout(function () { scrollToAndPulseField(code); }, 40);
          } else {
            scrollToAndPulseField(code);
          }
        }, 80);
      } else if (enc.scrollToSectionCode) {
        const secCode = enc.scrollToSectionCode;
        enc.scrollToSectionCode = null;
        setTimeout(function () { scrollToSectionBlock('encounter', secCode, false); }, 80);
      }
    }
  }

  async function loadReview(visitId) {
    const rev = state.review;
    rev.visitId = visitId;
    rev.access = null;
    rev.confirming = false;
    rev.confirmError = '';
    rev.loading = true;
    rev.error = '';
    rev.aiInputPayload = null;
    rev.showAiPayload = false;
    rev.aiExportV1 = null;
    rev.aiExportQuality = null;
    rev.aiExportError = '';
    rev.aiExportLoading = false;
    rev.aiExportIsDiagnostic = false;
    rev.aiQualityExpanded = { actionable: false, system: false };
    render();
    try {
      const [visitDetail, formRes, reviewRes] = await Promise.all([
        api.getVisit(visitId),
        api.getVisitForm(visitId),
        api.getVisitReview(visitId)
      ]);
      const ptRes = await api.getPatient(visitDetail.visit.patientId);
      rev.visit = visitDetail.visit;
      rev.access = visitDetail.access || (ptRes.patient && ptRes.patient.access) || null;
      rev.visitDetail = visitDetail;
      rev.formRes = formRes;
      rev.revisions = visitDetail.revisions || [];
      rev.patient = ptRes.patient;
      rev.formVersion = formRes.formVersion;
      rev.data = reviewRes;
    } catch (err) {
      rev.visit = null;
      rev.data = null;
      rev.error = formatClinicalError(err, 'Không tải được kết quả rà soát lượt khám.');
      if (err && (err.status === 401 || err.status === 403)) return handleAuthOrError(err);
    } finally {
      rev.loading = false;
      render();
    }
  }

  async function loadAdminUsers(options) {
    const opts = options || null;
    const au = state.adminUsers;
    au.loading = true;
    au.error = '';
    if (!opts) render();
    try {
      const res = await api.listUsers({
        q: au.q,
        role: au.role,
        isActive: au.isActive,
        pageSize: 50
      });
      if (!isCurrentLiveSearch('users', opts)) return;
      au.items = (res && res.items) || [];
    } catch (err) {
      au.error = (err && err.detail) || 'Không tải được danh sách tài khoản.';
      if (err && (err.status === 401 || err.status === 403)) return handleAuthOrError(err);
    } finally {
      if (!isCurrentLiveSearch('users', opts)) return;
      au.loading = false;
      render();
      restoreInputFocus(opts && opts.restoreFocus);
    }
  }

  async function loadAdminForms(keepVersionId) {
    const af = state.adminForms;
    af.loading = true;
    af.error = '';
    render();
    try {
      const [formsRes, defsRes] = await Promise.all([
        api.listForms(),
        api.listFieldDefinitions({})
      ]);
      af.allDefinitions = (defsRes && defsRes.items) || [];
      af.template = (formsRes && formsRes.items && formsRes.items[0]) || null;
      if (af.template) {
        const verRes = await api.listFormVersions(af.template.id, {});
        af.versions = (verRes && verRes.items) || [];
        const chosenId = keepVersionId || af.selectedVersionId ||
          (af.versions.find(function (v) { return v.status === 'draft'; }) ||
           af.versions.find(function (v) { return v.status === 'published'; }) ||
           af.versions[0] || {}).id;
        if (chosenId) {
          await selectAdminFormVersion(chosenId, true);
        }
      }
    } catch (err) {
      af.error = (err && err.detail) || 'Không tải được danh sách phiên bản biểu mẫu.';
      if (err && (err.status === 401 || err.status === 403)) return handleAuthOrError(err);
    } finally {
      af.loading = false;
      render();
    }
  }

  async function selectAdminFormVersion(versionId, skipLoadingWrap) {
    const af = state.adminForms;
    af.selectedVersionId = versionId;
    if (!skipLoadingWrap) {
      af.loading = true;
      render();
    }
    try {
      const detail = await api.getFormVersion(versionId);
      af.versionDetail = detail;
      af.draftSections = clone(detail.sections || []);
      af.draftDirty = false;
      if (af.draftSections.length > 0 && !af.draftSections.some(function (s) { return s.sectionCode === af.selectedSectionCode; })) {
        af.selectedSectionCode = af.draftSections[0].sectionCode;
      }
      const curSec = af.draftSections.find(function (s) { return s.sectionCode === af.selectedSectionCode; });
      if (curSec && curSec.fields && curSec.fields.length > 0) {
        af.selectedFieldDefId = curSec.fields[0].fieldDefinitionId;
      } else {
        af.selectedFieldDefId = null;
      }
      const published = af.versions.find(function (v) { return v.status === 'published' && v.id !== versionId; }) ||
        af.versions.find(function (v) { return v.id !== versionId; }) ||
        af.versions[0];
      af.diffBaseVersionId = detail.formVersion.basedOnVersionId || (published ? published.id : versionId);
      af.previewData = null;
      af.previewError = '';
      af.previewValues = {};
      af.previewBp = [];
      af.previewAutoPulseSourceIndex = null;
      af.previewMeds = [];
      af.previewAllergies = [];
      af.previewLabs = [];
      af.previewDiagnoses = [];
      af.previewMedicationListState = 'unknown';
      af.previewAllergyListState = 'unknown';
      af.previewDiagnosisListState = 'unknown';
      af.previewInfoSource = '';
      af.previewClinicalNote = '';
      af.diffData = null;
      if (af.activeTab === 'preview') {
        af.previewData = await api.previewFormVersion(versionId);
      } else if (af.activeTab === 'diff' && af.diffBaseVersionId) {
        af.diffData = await api.diffFormVersion(versionId, af.diffBaseVersionId);
      }
    } catch (err) {
      toast((err && err.detail) || 'Không tải được chi tiết phiên bản biểu mẫu.', 'error');
    } finally {
      if (!skipLoadingWrap) {
        af.loading = false;
        render();
      }
    }
  }

  async function loadAdminAudit(options) {
    const opts = options || null;
    const aa = state.adminAudit;
    aa.loading = true;
    aa.error = '';
    if (!opts) render();
    try {
      const res = await api.listAuditLogs({
        q: aa.q,
        action: aa.action,
        entityType: aa.entityType,
        fromDate: aa.fromDate ? aa.fromDate + 'T00:00:00Z' : '',
        toDate: aa.toDate ? aa.toDate + 'T23:59:59Z' : '',
        pageSize: 50
      });
      if (!isCurrentLiveSearch('audit', opts)) return;
      aa.items = (res && res.items) || [];
    } catch (err) {
      aa.error = (err && err.detail) || 'Không tải được nhật ký hệ thống.';
      if (err && (err.status === 401 || err.status === 403)) return handleAuthOrError(err);
    } finally {
      if (!isCurrentLiveSearch('audit', opts)) return;
      aa.loading = false;
      render();
      restoreInputFocus(opts && opts.restoreFocus);
    }
  }

  async function loadAdminCare(options) {
    const opts = options || null;
    const ac = state.adminCare;
    ac.loading = true;
    ac.error = '';
    if (!opts) render();
    try {
      const [ptRes, docRes] = await Promise.all([
        api.adminListCarePatients({ q: ac.q, page: 1, pageSize: 50 }),
        api.adminListCareDoctors()
      ]);
      if (!isCurrentLiveSearch('adminCare', opts)) return;
      ac.patients = (ptRes && ptRes.items) || [];
      ac.doctors = (docRes && docRes.items) || [];
      const keep = ac.patients.find(function (p) { return p.id === ac.selectedPatientId; }) || ac.patients[0] || null;
      if (keep) {
        ac.selectedPatientId = keep.id;
        ac.selectedPatient = keep;
        const caRes = await api.adminListPatientCareAssignments(keep.id);
        ac.assignments = (caRes && caRes.items) || [];
      } else {
        ac.selectedPatientId = null;
        ac.selectedPatient = null;
        ac.assignments = [];
      }
    } catch (err) {
      ac.error = (err && err.detail) || 'Không tải được dữ liệu phân công bác sĩ.';
      if (err && (err.status === 401 || err.status === 403)) return handleAuthOrError(err);
    } finally {
      if (!isCurrentLiveSearch('adminCare', opts)) return;
      ac.loading = false;
      render();
      restoreInputFocus(opts && opts.restoreFocus);
    }
  }

  async function selectAdminCarePatient(patientId) {
    const ac = state.adminCare;
    ac.selectedPatientId = patientId;
    ac.selectedPatient = ac.patients.find(function (p) { return p.id === patientId; }) || null;
    ac.assignmentsLoading = true;
    render();
    try {
      const caRes = await api.adminListPatientCareAssignments(patientId);
      ac.assignments = (caRes && caRes.items) || [];
    } catch (err) {
      toast((err && err.detail) || 'Không tải được danh sách phân công.', 'error');
    } finally {
      ac.assignmentsLoading = false;
      render();
    }
  }

  /* ------------------------------------------------------------------------
     Screen Renderers (M1 – M8 + 403 Forbidden)
     ------------------------------------------------------------------------ */
  function renderLogin() {
    const lf = state.login;
    return (
      '<div class="login-layout" id="main-workspace">' +
        '<aside class="login-brand">' +
          '<div class="brand-mark">' +
            '<div class="brand-mark__icon">' + ICONS.heart + '</div>' +
            '<div>' +
              '<div class="brand-mark__name">HFCARE</div>' +
              '<div class="brand-mark__sub">Thu thập &amp; Xác nhận Dữ liệu Trước AI</div>' +
            '</div>' +
          '</div>' +
          '<div class="login-brand__hero">' +
            '<h1 class="login-brand__title">Hệ thống Thu thập Dữ liệu Lâm sàng Suy tim</h1>' +
            '<p class="login-brand__lead">Hỗ trợ ghi nhận, rà soát và xác nhận thông tin khám suy tim rõ ràng, đầy đủ trước khi kết nối các công cụ hỗ trợ quyết định lâm sàng.</p>' +
            '<div class="login-audience">' +
              '<div class="login-audience__item"><span class="login-audience__dot"></span><span><strong>Bác sĩ lâm sàng:</strong> Quản lý hồ sơ, ghi nhận lượt khám, theo dõi sinh hiệu, thuốc, cận lâm sàng và xác nhận dữ liệu.</span></div>' +
              '<div class="login-audience__item"><span class="login-audience__dot"></span><span><strong>Quản trị viên bệnh viện:</strong> Quản lý tài khoản, cập nhật biểu mẫu khám theo phiên bản và tra cứu nhật ký hoạt động.</span></div>' +
            '</div>' +
          '</div>' +
          '<div class="login-brand__spacer" aria-hidden="true"></div>' +
        '</aside>' +
        '<main class="login-panel">' +
          '<div class="login-card">' +
            '<h2 class="login-card__title">Đăng nhập</h2>' +
            '<p class="login-card__sub">Dành cho Bác sĩ và Quản trị viên.</p>' +
            (lf.error ? (
              '<div class="banner banner--error" role="alert">' +
                '<div class="banner__main">' + ICONS.alert + '<div><p class="banner__desc">' + esc(lf.error) + '</p></div></div>' +
              '</div>'
            ) : '') +
            '<form class="login-form" id="login-form" novalidate>' +
              '<div class="field">' +
                '<label class="field__label" for="login-username">Tên đăng nhập</label>' +
                '<input id="login-username" name="username" type="text" class="input" autocomplete="username" placeholder="Nhập tên đăng nhập" value="' + esc(lf.username) + '" required>' +
              '</div>' +
              '<div class="field">' +
                '<label class="field__label" for="login-password">Mật khẩu</label>' +
                '<div class="password-wrap">' +
                  '<input id="login-password" name="password" type="' + (lf.showPassword ? 'text' : 'password') + '" class="input" autocomplete="current-password" placeholder="Nhập mật khẩu" value="' + esc(lf.password) + '" required>' +
                  '<button type="button" class="password-toggle" id="btn-toggle-pw" aria-label="' + (lf.showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu') + '" aria-pressed="' + (lf.showPassword ? 'true' : 'false') + '">' +
                    (lf.showPassword ? ICONS.eyeOff : ICONS.eye) +
                  '</button>' +
                '</div>' +
              '</div>' +
              '<button type="submit" class="btn btn--primary btn--full' + (lf.submitting ? ' is-loading' : '') + '" id="btn-login-submit"' + (lf.submitting ? ' disabled' : '') + '>' +
                (lf.submitting ? 'Đang xác thực...' : 'Đăng nhập') +
              '</button>' +
            '</form>' +
          '</div>' +
        '</main>' +
      '</div>'
    );
  }

  function renderShell(breadcrumbsHtml, workspaceHtml) {
    const u = state.user;
    const isAdmin = u.role === 'admin';
    const isPharmacist = u.role === 'pharmacist';
    const collapsed = Boolean(state.sidebarCollapsed);
    const navItems = isAdmin
      ? [
          { id: 'admin-accounts', hash: '#/admin/users', label: 'Tài khoản & Quyền', icon: ICONS.users },
          { id: 'admin-care', hash: '#/admin/care', label: 'Phân công bác sĩ', icon: ICONS.shield },
          { id: 'admin-forms', hash: '#/admin/forms', label: 'Biểu mẫu & Phiên bản', icon: ICONS.layers },
          { id: 'admin-audit', hash: '#/admin/audit', label: 'Nhật ký hệ thống', icon: ICONS.list }
        ]
      : (isPharmacist
          ? [
              { id: 'workflow', hash: state.workflow.visitId ? ('#/visits/' + state.workflow.visitId + '/workflow') : '#/login', label: 'An toàn thuốc (M4)', icon: ICONS.shield }
            ]
          : [
              { id: 'patients', hash: '#/patients', label: 'Bệnh nhân của tôi', icon: ICONS.fileText }
            ]);

    const navHtml = navItems.map(function (item) {
      const active = state.screen === item.id || (!isAdmin && !isPharmacist && ['profile', 'encounter', 'review', 'workflow'].indexOf(state.screen) >= 0 && item.id === 'patients');
      return '<button type="button" class="nav-item' + (active ? ' is-active' : '') + '" data-nav="' + item.hash + '" title="' + esc(item.label) + '">' + item.icon + '<span class="nav-item__label">' + esc(item.label) + '</span></button>';
    }).join('');

    const roleLabel = isAdmin ? 'Quản trị viên' : (isPharmacist ? 'Dược sĩ (chỉ xem M4)' : 'Bác sĩ lâm sàng');

    return (
      '<div class="shell' + (collapsed ? ' is-sidebar-collapsed' : '') + '">' +
        '<aside class="sidebar" aria-label="Thanh điều hướng chính">' +
          '<div class="sidebar__top">' +
            '<div class="sidebar__brand-row">' +
              '<div class="brand-mark">' +
                '<div class="brand-mark__icon">' + ICONS.heart + '</div>' +
                '<div class="brand-mark__text">' +
                  '<div class="brand-mark__name">HFCARE</div>' +
                  '<div class="brand-mark__sub">Thu thập &amp; Xác nhận Dữ liệu</div>' +
                '</div>' +
              '</div>' +
            '</div>' +
            '<span class="sidebar__role-tag">' + ICONS.shield + ' <span class="sidebar__role-text">' + esc(roleLabel) + '</span></span>' +
            '<nav class="sidebar__nav">' + navHtml + '</nav>' +
          '</div>' +
          '<div class="sidebar__user">' +
            '<button type="button" class="user-chip" data-action="toggle-account-menu" aria-label="Tài khoản: ' + esc(u.fullName) + '" aria-haspopup="menu" aria-expanded="false" aria-controls="account-menu" title="' + esc(u.fullName + ' (' + roleLabel + ')') + '">' +
              '<span class="user-chip__avatar">' + esc(getInitials(u.fullName)) + '</span>' +
              '<span class="user-chip__meta">' +
                '<span class="user-chip__name">' + esc(u.fullName) + '</span>' +
                '<span class="user-chip__role">' + esc(roleLabel) + '</span>' +
              '</span>' +
            '</button>' +
          '</div>' +
        '</aside>' +
        '<div class="main-area">' +
          '<div class="mobile-topbar">' +
            '<div class="brand-mark">' +
              '<div class="brand-mark__icon">' + ICONS.heart + '</div>' +
              '<div><div class="brand-mark__name">HFCARE</div><div class="brand-mark__sub">' + esc(roleLabel) + '</div></div>' +
            '</div>' +
            '<div class="mobile-topbar__actions">' +
              '<button type="button" class="mobile-menu-btn mobile-account-btn" data-action="toggle-account-menu" aria-label="Tài khoản: ' + esc(u.fullName) + '" aria-haspopup="menu" aria-expanded="false" aria-controls="account-menu"><span class="user-chip__avatar">' + esc(getInitials(u.fullName)) + '</span></button>' +
              '<button type="button" class="mobile-menu-btn" data-action="toggle-mobile-menu" aria-controls="mobile-navigation" aria-expanded="' + (state.mobileMenuOpen ? 'true' : 'false') + '">' + ICONS.menu + ' Menu</button>' +
            '</div>' +
          '</div>' +
          '<div id="mobile-navigation" class="mobile-drawer' + (state.mobileMenuOpen ? ' is-open' : '') + '">' +
            '<nav class="sidebar__nav">' + navHtml + '</nav>' +
          '</div>' +
          '<header class="topbar">' +
            '<div class="topbar__left">' +
              '<button type="button" class="icon-btn topbar__sidebar-btn" data-action="toggle-sidebar" title="' + (collapsed ? 'Mở rộng thanh chức năng' : 'Thu gọn thanh chức năng') + '" aria-label="' + (collapsed ? 'Mở rộng thanh chức năng' : 'Thu gọn thanh chức năng') + '" aria-expanded="' + (!collapsed ? 'true' : 'false') + '">' + ICONS.panelLeft + '</button>' +
              '<nav class="breadcrumbs" aria-label="Đường dẫn">' + breadcrumbsHtml + '</nav>' +
            '</div>' +
            '<div class="topbar__right">' +
              '<span class="badge badge--blue topbar__user">' + esc(u.fullName) + '</span>' +
            '</div>' +
          '</header>' +
          '<main class="workspace" id="main-workspace">' + workspaceHtml + '</main>' +
        '</div>' +
        '<div id="account-menu" class="account-menu" role="menu" aria-label="Tài khoản" hidden>' +
          '<button type="button" class="account-menu__item" role="menuitem" tabindex="-1" data-action="open-change-password">' + ICONS.key + '<span>Đổi mật khẩu</span></button>' +
          '<button type="button" class="account-menu__item" role="menuitem" tabindex="-1" data-action="logout">' + ICONS.logout + '<span>Đăng xuất</span></button>' +
        '</div>' +
      '</div>'
    );
  }

  function setMobileMenuOpen(open) {
    state.mobileMenuOpen = open;
    const drawer = document.getElementById('mobile-navigation');
    const button = document.querySelector('[data-action="toggle-mobile-menu"]');
    if (drawer) drawer.classList.toggle('is-open', open);
    if (button) button.setAttribute('aria-expanded', String(open));
  }

  let accountMenuTrigger = null;
  let accountMenuScroll = null;

  function visibleAccountTrigger(preferred) {
    if (preferred && preferred.isConnected && preferred.getClientRects().length) return preferred;
    return Array.from(document.querySelectorAll('[data-action="toggle-account-menu"]')).find(function (button) { return button.getClientRects().length; });
  }

  function closeAccountMenu(returnFocus) {
    const menu = document.getElementById('account-menu');
    if (!menu || menu.hidden) return;
    menu.hidden = true;
    document.querySelectorAll('[data-action="toggle-account-menu"]').forEach(function (button) { button.setAttribute('aria-expanded', 'false'); });
    if (returnFocus) {
      const trigger = visibleAccountTrigger(accountMenuTrigger);
      if (trigger) trigger.focus();
    }
    accountMenuTrigger = null;
    accountMenuScroll = null;
  }

  function openAccountMenu(trigger, lastItem) {
    const menu = document.getElementById('account-menu');
    if (!menu) return;
    closeAccountMenu(false);
    setMobileMenuOpen(false);
    accountMenuTrigger = trigger;
    accountMenuScroll = { x: global.scrollX, y: global.scrollY };
    menu.style.left = '8px';
    menu.style.top = '8px';
    menu.hidden = false;
    trigger.setAttribute('aria-expanded', 'true');
    const rect = trigger.getBoundingClientRect();
    const mobile = Boolean(trigger.closest('.mobile-topbar'));
    const bounds = menu.getBoundingClientRect();
    const left = mobile ? rect.right - bounds.width : rect.left;
    const top = mobile ? rect.bottom + 8 : rect.top - bounds.height - 8;
    menu.style.left = Math.max(8, Math.min(left, global.innerWidth - bounds.width - 8)) + 'px';
    menu.style.top = Math.max(8, Math.min(top, global.innerHeight - bounds.height - 8)) + 'px';
    const items = menu.querySelectorAll('[role="menuitem"]');
    items[lastItem ? items.length - 1 : 0].focus({ preventScroll: true });
  }

  function renderForbidden() {
    const homeHash = state.user && state.user.role === 'admin' ? '#/admin/users' : '#/patients';
    const content =
      '<div class="forbidden-box">' +
        '<span class="badge badge--error">HTTP 403 · Từ chối truy cập</span>' +
        '<h1 class="page-head__title" style="margin-top:10px;">Không có quyền truy cập khu vực này</h1>' +
        '<p class="page-head__sub" style="margin-top:8px;">' + esc(state.forbiddenReason || 'Tài khoản hiện tại không được cấp quyền truy cập tài nguyên yêu cầu.') + '</p>' +
        '<p class="field__help" style="margin-top:10px;">Sự kiện từ chối truy cập đã được ghi nhận vào nhật ký kiểm toán hệ thống theo chính sách tách quyền lâm sàng và quản trị.</p>' +
        '<div style="margin-top:16px;">' +
          '<button type="button" class="btn btn--primary" data-nav="' + homeHash + '">' + ICONS.arrowLeft + ' Quay về không gian làm việc của bạn</button>' +
        '</div>' +
      '</div>';
    return renderShell('<span class="breadcrumbs__current">Thiếu quyền truy cập (403)</span>', content);
  }

  /* ------------------------------------------------------------------------
     M2: Patient List
     ------------------------------------------------------------------------ */
  function renderPatients() {
    const ps = state.patients;
    const statusBadge = function (st, visitId) {
      if (st === 'confirmed') return '<span class="badge badge--success">Đã xác nhận</span>';
      if (st === 'draft') {
        if (visitId) return '<button type="button" class="badge badge--warn badge--link" data-nav="#/visits/' + esc(visitId) + '">Có lượt nháp</button>';
        return '<span class="badge badge--warn">Có lượt nháp</span>';
      }
      return '<span class="badge badge--neutral">Chưa có lượt</span>';
    };

    const filterBtns = [
      { v: '', label: 'Tất cả' },
      { v: 'draft', label: 'Có lượt nháp' },
      { v: 'confirmed', label: 'Đã xác nhận' },
      { v: 'none', label: 'Chưa có lượt' }
    ].map(function (f) {
      return '<button type="button" class="filter-pill' + (ps.status === f.v ? ' is-active' : '') + '" data-patient-status="' + f.v + '">' + esc(f.label) + '</button>';
    }).join('');

    let listHtml = '';
    if (ps.loading) {
      listHtml = '<div class="skeleton-stack"><div class="skeleton-bar"></div><div class="skeleton-card"></div><div class="skeleton-card"></div></div>';
    } else if (ps.error) {
      listHtml = '<div class="banner banner--error"><div class="banner__main">' + ICONS.alert + '<div><p class="banner__title">Không tải được danh sách</p><p class="banner__desc">' + esc(ps.error) + '</p></div></div><button type="button" class="btn btn--secondary btn--sm" data-action="reload-patients">Thử lại</button></div>';
    } else if (ps.items.length === 0) {
      const hasFilters = Boolean((ps.q && ps.q.trim()) || ps.status);
      listHtml =
        '<div class="empty-state" data-empty-patients="true">' +
          '<h3 class="empty-state__title">' + (hasFilters ? 'Không có bệnh nhân nào khớp điều kiện lọc' : 'Chưa có bệnh nhân nào được phân công cho bạn') + '</h3>' +
          '<p class="empty-state__desc">' + (hasFilters
            ? 'Danh sách "Bệnh nhân của tôi" chỉ hiển thị các hồ sơ bạn được phân công phụ trách. Hãy thử xóa từ khóa tìm kiếm hoặc đổi bộ lọc.'
            : 'Bạn chỉ nhìn thấy hồ sơ bệnh nhân được phân công phụ trách. Bạn có thể tạo hồ sơ mới (hệ thống tự phân công bạn phụ trách) hoặc liên hệ Quản trị viên để được phân công vào hồ sơ hiện có.') + '</p>' +
          '<div class="empty-state__actions">' +
            '<button type="button" class="btn btn--primary" data-action="open-create-patient">' + ICONS.plus + ' Tạo hồ sơ bệnh nhân</button>' +
          '</div>' +
        '</div>';
    } else {
      const rows = ps.items.map(function (it) {
        const pt = it.patient;
        const doctors = pt.assignedDoctors || it.assignedDoctors || [];
        return (
          '<tr>' +
            '<td><div class="cell-primary mono">' + esc(pt.patientCode) + '</div><div class="cell-sub">' + esc(pt.fullName) + '</div></td>' +
            '<td>' + renderAssignedDoctorsBadges(doctors, pt.access, state.user) + '</td>' +
            '<td><div>' + esc(formatSex(pt.sex)) + '</div><div class="cell-sub">' + esc(formatBirthPrecision(pt)) + '</div></td>' +
            '<td>' + (it.visitCount > 0 ? ('<div class="tabular">' + esc(formatDateTime(it.latestVisitDate)) + '</div><div class="cell-sub">' + it.visitCount + ' lượt khám</div>') : '<span class="cell-sub">Chưa ghi nhận</span>') + '</td>' +
            '<td>' + statusBadge(it.latestVisitStatus, it.latestVisitId) + '</td>' +
            '<td style="text-align:right;"><button type="button" class="btn btn--secondary btn--sm" data-nav="#/patients/' + esc(pt.id) + '">Mở hồ sơ ' + ICONS.arrowRight + '</button></td>' +
          '</tr>'
        );
      }).join('');

      const cards = ps.items.map(function (it) {
        const pt = it.patient;
        const doctors = pt.assignedDoctors || it.assignedDoctors || [];
        return (
          '<article class="record-card">' +
            '<div class="record-card__top">' +
              '<div><div class="cell-primary mono">' + esc(pt.patientCode) + '</div><div class="cell-sub">' + esc(pt.fullName) + '</div></div>' +
              statusBadge(it.latestVisitStatus, it.latestVisitId) +
            '</div>' +
            '<div style="margin-bottom:8px;"><span class="record-card__label">Bác sĩ phụ trách</span>' + renderAssignedDoctorsBadges(doctors, pt.access, state.user) + '</div>' +
            '<div class="record-card__meta">' +
              '<div><span class="record-card__label">Giới tính &amp; Tuổi</span>' + esc(formatSex(pt.sex) + ' · ' + formatBirthPrecision(pt)) + '</div>' +
              '<div><span class="record-card__label">Lượt khám gần nhất</span>' + (it.visitCount > 0 ? esc(formatDateTime(it.latestVisitDate) + ' (' + it.visitCount + ' lượt)') : 'Chưa có lượt') + '</div>' +
            '</div>' +
            '<div><button type="button" class="btn btn--secondary btn--sm btn--full" data-nav="#/patients/' + esc(pt.id) + '">Mở hồ sơ ' + ICONS.arrowRight + '</button></div>' +
          '</article>'
        );
      }).join('');

      listHtml =
        '<div class="card">' +
          '<div class="table-wrap"><table class="data-table"><thead><tr><th>Mã hồ sơ &amp; Tên</th><th>Bác sĩ phụ trách</th><th>Giới tính &amp; Độ chính xác tuổi</th><th>Lượt khám gần nhất</th><th>Trạng thái</th><th style="text-align:right;">Thao tác</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
        '</div>' +
        '<div class="mobile-cards">' + cards + '</div>';
    }

    const body =
      '<div class="page-head">' +
        '<div><h1 class="page-head__title">Bệnh nhân của tôi</h1><p class="page-head__sub">Danh sách hồ sơ bệnh nhân bạn được phân công phụ trách.</p></div>' +
        '<div class="page-head__actions">' +
          '<button type="button" class="btn btn--primary" data-action="open-create-patient">' + ICONS.plus + ' Tạo hồ sơ bệnh nhân</button>' +
        '</div>' +
      '</div>' +
      '<div class="toolbar">' +
        '<div class="search-box"><span class="search-box__icon">' + ICONS.search + '</span><input type="search" class="input" id="patient-search" placeholder="Tìm theo mã BN-xxxxx hoặc tên hồ sơ..." value="' + esc(ps.q) + '"></div>' +
        '<div class="filter-pills" role="group" aria-label="Lọc theo trạng thái lượt khám">' + filterBtns + '</div>' +
      '</div>' +
      listHtml;

    return renderShell('<span class="breadcrumbs__current">Bệnh nhân của tôi</span>', body);
  }

  /* ------------------------------------------------------------------------
     M3: Patient Profile & Visit Timeline
     ------------------------------------------------------------------------ */
  function renderProfile() {
    const pr = state.profile;
    if (pr.loading) {
      return renderShell('<button type="button" class="breadcrumbs__link" data-nav="#/patients">Hồ sơ bệnh nhân</button><span>/</span><span class="breadcrumbs__current">Đang tải...</span>', '<div class="skeleton-stack"><div class="skeleton-bar"></div><div class="skeleton-card"></div><div class="skeleton-card"></div></div>');
    }
    if (pr.error || !pr.patient) {
      return renderShell('<button type="button" class="breadcrumbs__link" data-nav="#/patients">Hồ sơ bệnh nhân</button>', '<div class="banner banner--error" role="alert"><div class="banner__main">' + ICONS.alert + '<div><p class="banner__desc">' + esc(pr.error || NOT_FOUND_OR_NO_ACCESS_MSG) + '</p></div></div><button type="button" class="btn btn--secondary btn--sm" data-nav="#/patients">Quay lại danh sách</button></div>');
    }

    const pt = pr.patient;
    const sum = pr.latestVisitSummary;
    const assignedDocs = pt.assignedDoctors || [];
    const lastEditorName = pt.updatedByName || pt.lastEditedByName || '';

    const assignedBoxHtml =
      '<section class="card" data-assigned-doctors-box="true">' +
        '<div class="card__header">' +
          '<div><h2 class="card__title">Bác sĩ phụ trách hồ sơ</h2><p class="card__subtitle">Hồ sơ được phân công phụ trách cho bác sĩ (do Quản trị viên điều phối).</p></div>' +
        '</div>' +
        '<div class="card__body">' +
          renderAssignedDoctorsBadges(assignedDocs, pt.access, state.user) +
        '</div>' +
      '</section>';

    let summaryBody = '';
    if (!sum) {
      summaryBody =
        '<div class="empty-state">' +
          '<h4 class="empty-state__title">Bệnh nhân chưa có lượt khám nào</h4>' +
          '<p class="empty-state__desc">Hệ thống không suy diễn hoặc điền sẵn dữ liệu nền. Hãy tạo lượt khám đầu tiên để bắt đầu thu thập dữ liệu lâm sàng.</p>' +
          '<button type="button" class="btn btn--primary btn--sm" data-action="open-create-visit">' + ICONS.plus + ' Tạo lượt khám đầu tiên</button>' +
        '</div>';
    } else {
      const medsHtml = (sum.recordedMedications && sum.recordedMedications.length > 0)
        ? sum.recordedMedications.map(function (m) {
            return '<div class="cell-sub"><strong>' + esc(m.drugName) + '</strong>' + (m.dose ? ' · ' + esc(m.dose) + ' ' + esc(m.unit || '') : '') + (m.frequency ? ' · ' + esc(m.frequency) : '') + '</div>';
          }).join('')
        : '<div class="cell-sub">Chưa có ghi nhận thuốc từ lượt khám tham chiếu (không suy thành không dùng thuốc).</div>';

      const algHtml = (sum.recordedAllergies && sum.recordedAllergies.length > 0)
        ? sum.recordedAllergies.map(function (a) {
            return '<div class="cell-sub"><strong>' + esc(a.allergen) + '</strong>' + (a.reaction ? ' — ' + esc(a.reaction) : '') + '</div>';
          }).join('')
        : '<div class="cell-sub">Chưa có ghi nhận dị ứng/ADR từ lượt khám tham chiếu (không suy thành không dị ứng).</div>';

      summaryBody =
        '<div class="source-strip">' + ICONS.clock + '<span>Nguồn tham chiếu: <strong class="mono">' + esc(sum.sourceVisitCode || sum.sourceVisitId.slice(0, 8)) + '</strong> · ' + esc(formatDateTime(sum.sourceVisitDate)) + ' (' + (sum.sourceVisitStatus === 'confirmed' ? 'Đã xác nhận' : 'Bản nháp') + ' · Biểu mẫu ' + esc(sum.sourceFormVersionLabel || 'v1') + ')</span></div>' +
        '<div class="metric-row">' +
          '<div class="metric-box"><div class="metric-box__label">Chiều cao / Cân nặng</div><div class="metric-box__val">' + (sum.heightCm != null ? esc(sum.heightCm) + '<span class="metric-box__unit">cm</span>' : '—') + ' / ' + (sum.weightKg != null ? esc(sum.weightKg) + '<span class="metric-box__unit">kg</span>' : '—') + '</div></div>' +
          '<div class="metric-box metric-box--blue"><div class="metric-box__label">BMI (cùng lượt)</div><div class="metric-box__val">' + (sum.bmi != null ? esc(sum.bmi) + '<span class="metric-box__unit">kg/m²</span>' : '—') + '</div></div>' +
          '<div class="metric-box"><div class="metric-box__label">Huyết áp gần nhất</div><div class="metric-box__val">' + (sum.latestBp ? esc(sum.latestBp.systolic + '/' + sum.latestBp.diastolic) + '<span class="metric-box__unit">mmHg (' + esc(formatBpPosition(sum.latestBp.position)) + ')</span>' : '—') + '</div></div>' +
        '</div>' +
        '<div class="form-grid-2">' +
          '<div><div class="kv-item__label">Thuốc đã ghi nhận ở lượt tham chiếu</div>' + medsHtml + '</div>' +
          '<div><div class="kv-item__label">Dị ứng / ADR đã ghi nhận</div>' + algHtml + '</div>' +
        '</div>';
    }

      const timelineHtml = pr.visits.length === 0
      ? '<p class="field__help">Chưa có lượt khám nào được tạo cho hồ sơ này.</p>'
      : '<div class="timeline">' + pr.visits.map(function (v) {
          const isConf = v.status === 'confirmed';
          const perfDoc = v.performedByName || v.performingDoctorName || v.createdByName || '';
          const lastEd = v.updatedByName || v.lastEditedByName || '';
          return (
            '<div class="timeline-item ' + (isConf ? 'timeline-item--confirmed' : 'timeline-item--draft') + '">' +
              '<div class="timeline-item__top">' +
                '<div><div class="cell-primary mono">' + esc(v.visitCode) + '</div><div class="cell-sub tabular">' + esc(formatDateTime(v.visitDate)) + ' · ' + esc(formatVisitType(v.visitType)) + '</div></div>' +
                (isConf ? '<span class="badge badge--success">Đã xác nhận</span>' : '<span class="badge badge--warn">Bản nháp</span>') +
              '</div>' +
              (v.chiefComplaint ? '<div class="cell-sub">' + esc(v.chiefComplaint) + '</div>' : '') +
              (perfDoc || lastEd ? (
                '<div class="cell-sub" data-visit-actors="true">' +
                  (perfDoc ? 'Bác sĩ thực hiện: <strong>' + esc(perfDoc) + '</strong>' : '') +
                  (perfDoc && lastEd ? ' · ' : '') +
                  (lastEd ? 'Chỉnh sửa gần nhất: <strong>' + esc(lastEd) + '</strong>' : '') +
                '</div>'
              ) : '') +
              '<div class="field__meta-row">' +
                '<span class="badge badge--blue">Biểu mẫu ' + esc(v.formVersionLabel || 'v1') + (v.currentRevisionNo > 1 ? ' · Bản sửa #' + esc(v.currentRevisionNo) : '') + '</span>' +
                '<div style="display:flex;gap:6px;flex-wrap:wrap;">' +
                  '<button type="button" class="btn ' + (isConf ? 'btn--secondary' : 'btn--primary') + ' btn--sm" data-nav="#/visits/' + esc(v.id) + '">' + (isConf ? 'Xem lượt khám' : 'Tiếp tục nhập') + '</button>' +
                  '<button type="button" class="btn btn--ghost btn--sm" data-nav="#/visits/' + esc(v.id) + '/review">Xem lại</button>' +
                '</div>' +
              '</div>' +
            '</div>'
          );
        }).join('') + '</div>';

      const body =
      '<div class="page-head">' +
        '<div><h1 class="page-head__title"><span class="mono">' + esc(pt.patientCode) + '</span> · ' + esc(pt.fullName) + '</h1><p class="page-head__sub">Thông tin hành chính, bác sĩ phụ trách và danh sách các lượt khám theo thời gian.</p></div>' +
        '<div class="page-head__actions">' +
          '<button type="button" class="btn btn--secondary" data-nav="#/patients">' + ICONS.arrowLeft + ' Về danh sách</button>' +
          '<button type="button" class="btn btn--primary" data-action="open-create-visit">' + ICONS.plus + ' Tạo lượt khám mới</button>' +
        '</div>' +
      '</div>' +
      '<div class="profile-grid">' +
        '<div class="profile-col">' +
          '<section class="card">' +
            '<div class="card__header"><div><h2 class="card__title">Thông tin hành chính</h2></div><button type="button" class="btn btn--secondary btn--sm" data-action="open-edit-patient">Sửa hành chính</button></div>' +
            '<div class="card__body"><div class="kv-grid">' +
              '<div><div class="kv-item__label">Mã hồ sơ</div><div class="kv-item__value mono">' + esc(pt.patientCode) + '</div></div>' +
              '<div><div class="kv-item__label">Họ tên / Ký hiệu</div><div class="kv-item__value">' + esc(pt.fullName) + '</div></div>' +
              '<div><div class="kv-item__label">Giới tính</div><div class="kv-item__value">' + esc(formatSex(pt.sex)) + '</div></div>' +
              '<div><div class="kv-item__label">Ngày sinh / Tuổi</div><div class="kv-item__value">' + esc(formatBirthPrecision(pt)) + '</div></div>' +
              '<div><div class="kv-item__label">Mã CCCD</div><div class="kv-item__value mono">' + esc(pt.externalPatientCode || 'Chưa ghi nhận') + '</div></div>' +
              '<div><div class="kv-item__label">Cập nhật gần nhất</div><div class="kv-item__value tabular">' + esc(formatDateTime(pt.updatedAt)) + (lastEditorName ? ' · ' + esc(lastEditorName) : '') + '</div></div>' +
            '</div></div>' +
          '</section>' +
          assignedBoxHtml +
          '<section class="card">' +
            '<div class="card__header"><div><h2 class="card__title">Tóm tắt lượt đã xác nhận gần nhất (chỉ tham chiếu)</h2><p class="card__subtitle">Dữ liệu chỉ để đối chiếu, không tự sao chép sang lượt khám mới.</p></div></div>' +
            '<div class="card__body">' + summaryBody + '</div>' +
          '</section>' +
        '</div>' +
        '<div class="profile-col">' +
          '<section class="card">' +
            '<div class="card__header"><div><h2 class="card__title">Dòng thời gian lượt khám</h2><p class="card__subtitle">' + pr.visits.length + ' lượt khám (mới nhất lên đầu)</p></div></div>' +
            '<div class="card__body">' + timelineHtml + '</div>' +
          '</section>' +
        '</div>' +
      '</div>';

    const crumbs = '<button type="button" class="breadcrumbs__link" data-nav="#/patients">Hồ sơ bệnh nhân</button><span>/</span><span class="breadcrumbs__current mono">' + esc(pt.patientCode) + '</span>';
    return renderShell(crumbs, body);
  }

  /* ------------------------------------------------------------------------
     Shared Metadata-Driven Clinical Form Renderer (Used by M4, M7 Preview & Editor)
     Single source of truth: renders strictly from the form version bundle
     (sections, field placements, customLabelVi, customHelpText, isVisible,
     requiredForConfirm, displayOrder, repeatGroup, memberPath, system/computed).
     ------------------------------------------------------------------------ */
  function isValidMedRow(m) {
    return Boolean(m && m.drugName && String(m.drugName).trim());
  }

  function isValidAllergyRow(a) {
    return Boolean(a && a.allergen && String(a.allergen).trim());
  }

  function isValidDiagnosisRow(d) {
    return Boolean(d && ((d.code && String(d.code).trim()) || (d.display && String(d.display).trim())));
  }

  function isValidIcd10Format(code) {
    const c = String(code || '').trim();
    if (!c) return true;
    return /^[A-Za-z]\d{2}(?:\.[A-Za-z0-9]{1,4})?$/.test(c);
  }

  function isValidLabRow(l, defByCode) {
    if (!l || !l.labCode) return false;
    const fd = defByCode && defByCode[l.labCode];
    if (fd && (fd.dataType === 'number' || fd.dataType === 'integer')) {
      return l.valueNum !== null && l.valueNum !== undefined && l.valueNum !== '' && !isNaN(Number(l.valueNum));
    }
    return Boolean(l.valueText && String(l.valueText).trim());
  }

  function getFieldLabel(ff, fd) {
    const custom = ff && ff.customLabelVi && String(ff.customLabelVi).trim();
    return custom || (fd && fd.labelVi) || (ff && ff.fieldCode) || '';
  }

  function sanitizeDoctorHelpText(text) {
    if (!text) return '';
    const s = String(text).trim();
    if (!s) return '';
    if (/\b(TL0[1-9]|Q-AI-\d+|Q-PM-\d+|CR-W\d+-\d+|STT\s*\d+|visit_[a-z_]+|field_definition|value_state|bảng\s+patient|NULL|G1\s+\d{1,2}\/\d{1,2}\/\d{4}|Biểu mẫu suy tim\s+\d{1,2}\/\d{1,2}\/\d{4})\b/i.test(s)) {
      return '';
    }
    return s;
  }

  function joinUniqueHelpTexts(entries) {
    const seen = {};
    const out = [];
    (entries || []).forEach(function (e) {
      const h = getFieldHelpText(e.ff, e.fd);
      if (h && !seen[h]) {
        seen[h] = true;
        out.push(h);
      }
    });
    return out.join(' · ');
  }

  function getFieldHelpText(ff, fd) {
    const custom = ff && ff.customHelpText && String(ff.customHelpText).trim();
    if (custom) return sanitizeDoctorHelpText(custom);
    return sanitizeDoctorHelpText(fd && fd.helpText);
  }

  function getFieldMetaFlags(ff, fd) {
    const computed = Boolean(fd && (fd.computed || fd.isCalculated || fd.storageLevel === 'computed'));
    const isVisitNote = Boolean(fd && (fd.code === 'info_source' || fd.code === 'clinical_note' || fd.memberPath === 'infoSource' || fd.memberPath === 'clinicalNote'));
    const isListStateField = Boolean(fd && (
      fd.code === 'medication_list_state' || fd.code === 'allergy_list_state' || fd.code === 'diagnosis_list_state' ||
      fd.memberPath === 'medicationListState' || fd.memberPath === 'allergyListState' || fd.memberPath === 'diagnosisListState'
    ));
    const isVisitSystem = Boolean(isVisitNote || isListStateField || (fd && fd.storageLevel === 'visit'));
    const isPatientSystem = Boolean(fd && fd.storageLevel === 'patient');
    const system = Boolean((fd && fd.system) || computed || isVisitSystem || isPatientSystem);
    const locked = Boolean((fd && fd.locked) || system || computed);
    const readonlyInput = Boolean((ff && ff.isReadonly) || computed || isPatientSystem);
    return {
      computed: computed,
      system: system,
      locked: locked,
      readonlyInput: readonlyInput,
      isVisitNote: isVisitNote,
      isListStateField: isListStateField,
      isVisitSystem: isVisitSystem,
      isPatientSystem: isPatientSystem
    };
  }

  function getFieldRepeatInfo(fd) {
    if (!fd) return null;
    if (fd.repeatGroup) {
      return { group: fd.repeatGroup, memberPath: fd.memberPath || null };
    }
    if (fd.storageLevel === 'orthostatic_bp') {
      const bpMap = {
        huyet_ap_tam_thu: 'systolic',
        huyet_ap_tam_truong: 'diastolic',
        thoi_diem_do_ha: 'measuredAt',
        tu_the_do_ha: 'position',
        nhip_tim_do_ha: 'heartRate',
        phut_sau_doi_tu_the: 'minuteAfter'
      };
      return { group: 'orthostaticBp', memberPath: bpMap[fd.code] || fd.memberPath || null };
    }
    if (fd.storageLevel === 'medication') {
      if (fd.code === 'thuoc_ghi_nhan') return { group: 'medications', memberPath: 'drugName' };
      return null;
    }
    if (fd.storageLevel === 'allergy') {
      if (fd.code === 'di_ung_adr') return { group: 'allergies', memberPath: 'allergen' };
      // di_ung_thuoc_can_quang is a standalone boolean scalar field (do not swallow!)
      return null;
    }
    if (fd.storageLevel === 'lab_result') {
      return { group: 'labResults', memberPath: fd.memberPath || null };
    }
    if (fd.storageLevel === 'diagnosis') {
      const dxMap = { icd_code: 'code', icd_display: 'display', icd_role: 'role' };
      return { group: 'diagnoses', memberPath: dxMap[fd.code] || fd.memberPath || null };
    }
    return null;
  }

  function isLabMetadataColumnCode(fd) {
    if (!fd) return false;
    if (fd.memberPath && ['unit', 'measuredAt', 'labSubtype'].indexOf(fd.memberPath) >= 0) return true;
    return ['cls_don_vi', 'cls_thoi_diem', 'cls_ecg_thoi_diem', 'cls_sieu_am_tim_thoi_diem', 'cls_xquang_thoi_diem', 'cls_troponin_loai'].indexOf(fd.code) >= 0;
  }

  function sortByDisplayOrder(list) {
    return (list || []).slice().sort(function (a, b) {
      return (Number(a.displayOrder) || 0) - (Number(b.displayOrder) || 0);
    });
  }

  function hasVisitNotesPlacements(sections, defById) {
    return (sections || []).some(function (sec) {
      return (sec.fields || []).some(function (ff) {
        const fd = defById && defById[ff.fieldDefinitionId];
        const code = (fd && fd.code) || ff.fieldCode;
        return code === 'info_source' || code === 'clinical_note' || (fd && (fd.memberPath === 'infoSource' || fd.memberPath === 'clinicalNote'));
      });
    });
  }

  function buildVirtualVisitNoteFields(section) {
    return [
      {
        id: 'virtual-info_source',
        formSectionId: section.id,
        fieldDefinitionId: 'virtual-def-info_source',
        fieldCode: 'info_source',
        displayOrder: 901,
        requiredForConfirm: false,
        isVisible: true,
        isReadonly: false,
        customLabelVi: null,
        customHelpText: null,
        _virtualSystem: true,
        _virtualDef: {
          id: 'virtual-def-info_source',
          code: 'info_source',
          labelVi: 'Nguồn cung cấp thông tin lâm sàng',
          sectionCode: 'ghi_chu',
          dataType: 'text',
          canonicalUnit: null,
          scopeStatus: 'mvp',
          storageLevel: 'visit',
          isCalculated: false,
          system: true,
          computed: false,
          locked: true,
          memberPath: 'infoSource',
          helpText: 'Người bệnh / Người nhà / Giấy tờ mang theo',
          sourceRef: 'Siêu dữ liệu lượt khám (visit.info_source)'
        }
      },
      {
        id: 'virtual-clinical_note',
        formSectionId: section.id,
        fieldDefinitionId: 'virtual-def-clinical_note',
        fieldCode: 'clinical_note',
        displayOrder: 902,
        requiredForConfirm: false,
        isVisible: true,
        isReadonly: false,
        customLabelVi: null,
        customHelpText: null,
        _virtualSystem: true,
        _virtualDef: {
          id: 'virtual-def-clinical_note',
          code: 'clinical_note',
          labelVi: 'Ghi chú lâm sàng bổ sung của bác sĩ',
          sectionCode: 'ghi_chu',
          dataType: 'text',
          canonicalUnit: null,
          scopeStatus: 'mvp',
          storageLevel: 'visit',
          isCalculated: false,
          system: true,
          computed: false,
          locked: true,
          memberPath: 'clinicalNote',
          helpText: 'Ghi nhận bối cảnh đặc biệt hoặc điểm cần lưu ý ở lần tái khám sau.',
          sourceRef: 'Siêu dữ liệu lượt khám (visit.clinical_note)'
        }
      }
    ];
  }

  function isV11Bundle(formVersion, sections, defById) {
    if (formVersion && Number(formVersion.versionNo) >= 2) return true;
    const allDefs = Object.values(defById || {});
    if (allDefs.some(function (fd) { return fd.repeatGroup === 'diagnoses' || fd.storageLevel === 'diagnosis' || fd.code === 'nhiet_do'; })) {
      return true;
    }
    return (sections || []).some(function (sec) {
      return (sec.fields || []).some(function (ff) {
        return ff.fieldCode === 'nhiet_do' || ff.fieldCode === 'icd_code' || ff.fieldCode === 'ts_thuoc_la';
      });
    });
  }

  function visitValueToCompact(code, vv, fd) {
    if (!vv) return null;
    if (vv.answer && typeof vv.answer === 'object' && vv.answer.value_state) {
      return clone(vv.answer);
    }
    const vs = vv.value_state || vv.valueState;
    if (vs === 'unknown') {
      const unit = code === 'bien_thien_can_nang_7ngay' ? 'kg' : (code === 'e_over_a_ratio' ? 'ratio' : (code === 'egfr_ckd_epi' ? 'mL/min/1.73m2' : null));
      const res = { value_state: 'unknown', value: null };
      if (unit) res.unit = unit;
      return res;
    }
    if (vs !== 'answered') return null;

    if (V12_SCALE_SPECS[code] || code === 'danh_gia_suy_yeu_frailty') {
      let num = null;
      if (vv.value !== undefined && vv.value !== null && !isNaN(Number(vv.value))) {
        num = Number(vv.value);
      } else if (vv.valueNum !== null && vv.valueNum !== undefined && !isNaN(Number(vv.valueNum))) {
        num = Number(vv.valueNum);
      } else if (vv.fieldOptionId && fd && Array.isArray(fd.options)) {
        const opt = fd.options.find(function (o) { return o.id === vv.fieldOptionId; });
        if (opt) {
          const m = String(opt.code || opt.value || opt.labelVi || '').match(/-?\d+/);
          if (m) num = Number(m[0]);
        }
      } else if (vv.valueText !== null && vv.valueText !== undefined && vv.valueText !== '') {
        const parsed = Number(vv.valueText);
        if (!isNaN(parsed)) num = parsed;
      }
      return num === null ? null : { value_state: 'answered', value: num };
    }

    if (code === 'bien_thien_can_nang_7ngay') {
      const raw = vv.value !== undefined ? vv.value : (vv.valueNum !== null && vv.valueNum !== undefined ? vv.valueNum : vv.valueText);
      if (raw === null || raw === undefined || raw === '') return null;
      return { value_state: 'answered', value: Number(raw), unit: 'kg' };
    }

    if (code === 'e_over_a_ratio') {
      if (vv.value === 'not_measurable_af' || vv.valueText === 'not_measurable_af') {
        return { value_state: 'answered', value: 'not_measurable_af', unit: 'ratio', measuredAt: vv.measuredAt || null };
      }
      const raw = vv.value !== undefined ? vv.value : (vv.valueNum !== null && vv.valueNum !== undefined ? vv.valueNum : vv.valueText);
      if (raw === null || raw === undefined || raw === '') return null;
      return { value_state: 'answered', value: Number(raw), unit: 'ratio', measuredAt: vv.measuredAt || null };
    }

    if (code === 'egfr_ckd_epi') {
      const raw = vv.value !== undefined ? vv.value : (vv.valueNum !== null && vv.valueNum !== undefined ? vv.valueNum : vv.valueText);
      if (raw === null || raw === undefined || raw === '') return null;
      return { value_state: 'answered', value: Number(raw), unit: 'mL/min/1.73m2', measuredAt: vv.measuredAt || null };
    }

    if (code === 'egfr_formula') {
      let txt = vv.value !== undefined ? vv.value : vv.valueText;
      if (!txt && vv.fieldOptionId && fd && Array.isArray(fd.options)) {
        const opt = fd.options.find(function (o) { return o.id === vv.fieldOptionId; });
        if (opt) txt = opt.labelVi || opt.code;
      }
      return txt ? { value_state: 'answered', value: String(txt) } : null;
    }

    if (code === 'ecg_12_chuyen_dao') {
      const raw = vv.value !== undefined ? vv.value : (vv.valueJson || vv.valueObject || vv.valueText);
      return { value_state: 'answered', value: parseStructuredJsonVal(raw, makeDefaultEcgValue), measuredAt: vv.measuredAt || null };
    }

    if (code === 'xquang_nguc_thang') {
      const raw = vv.value !== undefined ? vv.value : (vv.valueJson || vv.valueObject || vv.valueText);
      return { value_state: 'answered', value: parseStructuredJsonVal(raw, makeDefaultXrayValue), measuredAt: vv.measuredAt || null };
    }

    if (vv.value !== undefined) return { value_state: 'answered', value: vv.value, unit: vv.unit || null, measuredAt: vv.measuredAt || null };
    if (vv.valueBool !== null && vv.valueBool !== undefined) return { value_state: 'answered', value: Boolean(vv.valueBool) };
    if (vv.valueNum !== null && vv.valueNum !== undefined) return { value_state: 'answered', value: Number(vv.valueNum), unit: vv.unit || (fd && fd.canonicalUnit) || null };
    if (vv.valueText !== null && vv.valueText !== undefined && vv.valueText !== '') return { value_state: 'answered', value: vv.valueText };
    return null;
  }

  function compactToVisitValue(visitId, fd, compact) {
    if (!fd || !compact) return null;
    if (isV12StructuredAnswerCode(fd.code)) {
      const ans = clone(compact);
      if (ans && typeof ans === 'object') delete ans.ownerModule;
      return {
        visitId: visitId,
        fieldDefinitionId: fd.id,
        fieldCode: fd.code,
        valueState: ans ? ans.value_state : 'unknown',
        answer: ans
      };
    }
    if (compact.value_state === 'unknown') {
      return makeEmptyVisitValue(visitId, fd, 'unknown');
    }
    const item = makeEmptyVisitValue(visitId, fd, 'answered');
    const v = compact.value;
    if (fd.dataType === 'single_choice' && Array.isArray(fd.options) && fd.options.length > 0) {
      const match = fd.options.find(function (o) {
        return String(o.code) === String(v) || String(o.labelVi) === String(v) || String(o.code).replace(/^[a-z_]+_/, '') === String(v);
      });
      if (match) item.fieldOptionId = match.id;
      if (typeof v === 'number' && isFinite(v)) item.valueNum = v;
      else if (v !== null && v !== undefined) item.valueText = String(v);
      return item;
    }
    if (typeof v === 'boolean') {
      item.valueBool = v;
    } else if (typeof v === 'number' && isFinite(v)) {
      item.valueNum = v;
      item.unit = compact.unit || fd.canonicalUnit || null;
    } else if (v !== null && v !== undefined) {
      item.valueText = String(v);
    }
    return item;
  }

  function getEncounterCreatinineForEgfr(ctx) {
    if (ctx.creatinineInfo) return ctx.creatinineInfo;
    const def = ctx.defByCode && ctx.defByCode.cls_creatinin;
    const vv = def && ctx.valuesByDefId && ctx.valuesByDefId[def.id];
    if (vv && vv.answer && vv.answer.value_state === 'answered' && vv.answer.value !== null && vv.answer.value !== undefined) {
      return { value: Number(vv.answer.value), unit: vv.answer.unit || 'umol/L' };
    }
    const labs = ctx.labResults || [];
    for (let i = labs.length - 1; i >= 0; i--) {
      if (labs[i] && labs[i].labCode === 'cls_creatinin' && labs[i].valueNum !== null && labs[i].valueNum !== undefined && labs[i].valueNum !== '') {
        return { value: Number(labs[i].valueNum), unit: labs[i].unit || 'umol/L' };
      }
    }
    if (vv && vv.valueState === 'answered' && vv.valueNum !== null && vv.valueNum !== undefined) {
      return { value: Number(vv.valueNum), unit: vv.unit || def.canonicalUnit || 'umol/L' };
    }
    return null;
  }

  function getEncounterCurrentWeight(ctx) {
    if (ctx.currentWeightKg !== undefined && ctx.currentWeightKg !== null) return Number(ctx.currentWeightKg);
    const def = ctx.defByCode && ctx.defByCode.can_nang_kg;
    const vv = def && ctx.valuesByDefId && ctx.valuesByDefId[def.id];
    if (vv && vv.valueState === 'answered' && vv.valueNum !== null && vv.valueNum !== undefined) {
      return Number(vv.valueNum);
    }
    if (vv && vv.answer && vv.answer.value_state === 'answered' && vv.answer.value !== null && vv.answer.value !== undefined) {
      return Number(vv.answer.value);
    }
    return null;
  }

  function renderV12FieldControl(code, opts) {
    const scope = opts.scope || 'enc';
    const isPrev = scope === 'prev';
    const ro = Boolean(opts.readonly);
    const label = opts.label || AI_ISSUE_DISPLAY_LABELS[code] || code;
    const reqTag = opts.reqTag || '';
    const modBadgesHtml = opts.modBadgesHtml || '';
    const extraClass = opts.extraClass || '';
    const errMsg = opts.errMsg || '';
    const rawHelp = opts.helpText || '';
    const helpText = rawHelp.toLowerCase() === 'thang thử nghiệm, chờ bác sĩ duyệt' ? '' : rawHelp;
    const compact = opts.compactValue || null;
    const isUnlockedUnknown = Boolean(opts.unlockedUnknown);
    const isUnknown = Boolean(compact && compact.value_state === 'unknown' && !isUnlockedUnknown);
    const isAnswered = Boolean(compact && compact.value_state === 'answered');
    const expBadge = '<span class="badge badge--warn badge--xs wf-exp-tag" title="' + esc(WF_EXP_TAG_FULL) + '">Thang thử nghiệm · chờ bác sĩ duyệt</span>';
    const scopeAttr = ' data-v12-scope="' + esc(scope) + '" data-v12-code="' + esc(code) + '"';
    const unlockNoticeHtml = isUnlockedUnknown
      ? '<p class="field__help v12-unlock-hint">Đã mở khóa từ "Chưa rõ" — nhập giá trị mới để thay thế, hoặc giữ trống nếu muốn giữ nguyên "Chưa rõ".</p>'
      : '';

    // 1, 2, 4: Ordinal radio-card scales (kho_tho_nang, phu_chi_duoi_muc_do, trieu_chung_khong_dien_hinh)
    if (V12_SCALE_SPECS[code]) {
      const spec = V12_SCALE_SPECS[code];
      const curVal = isAnswered ? Number(compact.value) : null;
      const statusText = isUnknown ? 'Chưa rõ' : (curVal !== null ? ('Đã chọn mức ' + curVal) : (isUnlockedUnknown ? 'Đang mở khóa' : 'Chưa điền'));
      const cardsHtml = spec.options.map(function (o) {
        const selected = curVal === o.value;
        return (
          '<button type="button" class="scale-card' + (selected ? ' is-selected' : '') + (isUnknown ? ' is-muted' : '') + '" ' +
            'role="radio" aria-checked="' + (selected ? 'true' : 'false') + '" ' +
            'data-v12-scale-opt="' + esc(o.value) + '"' + scopeAttr + (ro || isUnknown ? ' disabled' : '') + '>' +
            '<span class="scale-card__title">' + esc(o.title) + '</span>' +
            '<span class="scale-card__desc">' + esc(o.desc) + '</span>' +
          '</button>'
        );
      }).join('');
      const noteVal = isPrev ? (state.adminForms.previewAtypicalNote || '') : (state.encounter.atypicalNote || '');
      const extraNoteHtml = (spec.hasNoteOnNonZero && curVal !== null && curVal > 0 && !isUnknown)
        ? (
          '<div class="wf-inline-subnote">' +
            '<label class="field__help" for="v12-atypical-note-' + esc(scope) + '">Ghi chú triệu chứng không điển hình (tùy chọn):</label>' +
            '<input id="v12-atypical-note-' + esc(scope) + '" type="text" class="input" data-v12-atypical-note="' + esc(scope) + '" placeholder="Ghi nhận thêm nếu có cả hai triệu chứng..." value="' + esc(noteVal) + '"' + (ro ? ' disabled' : '') + '>' +
          '</div>'
        )
        : '';
      return (
        '<div class="field field--span-2 v12-field' + extraClass + (!compact ? ' v12-field--unfilled' : '') + (errMsg ? ' v12-field--error' : '') + '" data-field-code="' + esc(code) + '">' +
          '<div class="field__label-row">' +
            '<span class="field__label">' + esc(label) + ' ' + reqTag + ' ' + modBadgesHtml + ' ' + expBadge + '</span>' +
            '<div class="v12-field__head-actions">' +
              '<span class="tristate__status">' + esc(statusText) + ((curVal !== null && !ro) ? ' · <button type="button" class="tristate__clear" data-v12-clear="1"' + scopeAttr + '>Xóa chọn</button>' : '') + '</span>' +
              '<button type="button" class="unknown-toggle unknown-toggle--sm' + (isUnknown ? ' is-active' : '') + '" data-v12-unknown="1"' + scopeAttr + ' aria-pressed="' + (isUnknown ? 'true' : 'false') + '"' + (ro ? ' disabled' : '') + '>Chưa rõ</button>' +
            '</div>' +
          '</div>' +
          '<div class="scale-card-grid scale-card-grid--' + spec.options.length + '" role="radiogroup" aria-label="' + esc(label) + '">' + cardsHtml + '</div>' +
          extraNoteHtml +
          unlockNoticeHtml +
          (spec.help ? '<p class="field__help">' + esc(spec.help) + '</p>' : '') +
          (helpText && helpText !== spec.help ? '<p class="field__help">' + esc(helpText) + '</p>' : '') +
          (errMsg ? '<p class="field__error">' + ICONS.alert + ' ' + esc(errMsg) + '</p>' : '') +
        '</div>'
      );
    }

    // 5: Clinical Frailty Scale CFS 1-9
    if (code === 'danh_gia_suy_yeu_frailty') {
      const curVal = isAnswered ? Number(compact.value) : null;
      const statusText = isUnknown ? 'Chưa rõ' : (curVal !== null ? ('CFS mức ' + curVal) : (isUnlockedUnknown ? 'Đang mở khóa' : 'Chưa điền'));
      const cfsCards = V12_CFS_LEVELS.map(function (lv) {
        const selected = curVal === lv.value;
        return (
          '<button type="button" class="cfs-card' + (selected ? ' is-selected' : '') + (isUnknown ? ' is-muted' : '') + '" ' +
            'role="radio" aria-checked="' + (selected ? 'true' : 'false') + '" ' +
            'data-v12-scale-opt="' + esc(lv.value) + '"' + scopeAttr + (ro || isUnknown ? ' disabled' : '') + '>' +
            '<span class="cfs-card__num">' + esc(lv.value) + '</span>' +
            '<span class="cfs-card__desc">' + esc(lv.desc) + '</span>' +
          '</button>'
        );
      }).join('');
      return (
        '<div class="field field--span-2 v12-field' + extraClass + (!compact ? ' v12-field--unfilled' : '') + (errMsg ? ' v12-field--error' : '') + '" data-field-code="' + esc(code) + '">' +
          '<div class="field__label-row">' +
            '<span class="field__label">' + esc(label) + ' ' + reqTag + ' ' + modBadgesHtml + ' ' + expBadge + '</span>' +
            '<div class="v12-field__head-actions">' +
              '<span class="tristate__status">' + esc(statusText) + ((curVal !== null && !ro) ? ' · <button type="button" class="tristate__clear" data-v12-clear="1"' + scopeAttr + '>Xóa chọn</button>' : '') + '</span>' +
              '<button type="button" class="unknown-toggle unknown-toggle--sm' + (isUnknown ? ' is-active' : '') + '" data-v12-unknown="1"' + scopeAttr + ' aria-pressed="' + (isUnknown ? 'true' : 'false') + '"' + (ro ? ' disabled' : '') + '>Chưa rõ</button>' +
            '</div>' +
          '</div>' +
          '<div class="cfs-grid" role="radiogroup" aria-label="' + esc(label) + '">' + cfsCards + '</div>' +
          unlockNoticeHtml +
          '<p class="field__help">' + esc(helpText || 'Thang Clinical Frailty Scale (1–9); không tự suy ra từ tuổi bệnh nhân.') + '</p>' +
          (errMsg ? '<p class="field__error">' + ICONS.alert + ' ' + esc(errMsg) + '</p>' : '') +
        '</div>'
      );
    }

    // 3: Weight delta 7 days (-20.0 .. +20.0 kg, step 0.1) + optional calculator
    if (code === 'bien_thien_can_nang_7ngay') {
      const hasNum = isAnswered && compact.value !== null && compact.value !== undefined;
      const numVal = hasNum ? Number(compact.value) : null;
      const numStr = hasNum ? String(numVal) : '';
      const isZero = hasNum && numVal === 0;
      const calcOpen = isPrev ? Boolean(state.adminForms.previewWeightCalcOpen) : Boolean(state.encounter.weightCalcOpen);
      const prevStr = isPrev ? (state.adminForms.previewWeightPrev7d || '') : (state.encounter.weightPrev7d || '');
      const curW = opts.currentWeightKg !== undefined && opts.currentWeightKg !== null ? Number(opts.currentWeightKg) : null;
      const prevW = prevStr !== '' && isFinite(Number(prevStr)) ? Number(prevStr) : null;
      const calcDelta = (curW !== null && prevW !== null) ? Math.round((curW - prevW) * 10) / 10 : null;
      const signedDelta = calcDelta !== null ? ((calcDelta > 0 ? '+' : '') + calcDelta.toFixed(1)) : '';
      const cls = 'input' + (!compact ? ' input--unfilled' : '') + (isUnknown ? ' input--unknown' : '') + (errMsg ? ' input--error' : '');
      return (
        '<div class="field v12-field' + extraClass + (errMsg ? ' v12-field--error' : '') + '" data-field-code="' + esc(code) + '">' +
          '<div class="field__label-row"><label class="field__label">' + esc(label) + ' ' + reqTag + ' ' + modBadgesHtml + ' ' + expBadge + '</label></div>' +
          '<div class="input-row-unknown">' +
            '<div class="input-unit-wrap">' +
              '<input type="number" class="' + cls + '" min="-20" max="20" step="0.1" data-v12-num="bien_thien_can_nang_7ngay"' + scopeAttr + ' placeholder="' + (isUnknown ? 'Chưa rõ' : '−20.0 đến +20.0') + '" value="' + esc(numStr) + '"' + (ro || isUnknown ? ' disabled' : '') + '>' +
              '<span class="input-unit-wrap__unit">kg</span>' +
            '</div>' +
            '<button type="button" class="unknown-toggle' + (isUnknown ? ' is-active' : '') + '" data-v12-unknown="1"' + scopeAttr + ' aria-pressed="' + (isUnknown ? 'true' : 'false') + '"' + (ro ? ' disabled' : '') + '>Chưa rõ</button>' +
          '</div>' +
          (isZero ? '<span class="zero-chip">Đã nhập: 0 (khác với để trống)</span>' : '') +
          unlockNoticeHtml +
          '<div class="v12-helper-row">' +
            '<button type="button" class="btn btn--ghost btn--xs" data-v12-toggle-wcalc="' + esc(scope) + '"' + (ro || isUnknown ? ' disabled' : '') + '>' + (calcOpen ? 'Ẩn bộ tính từ cân nặng 7 ngày trước' : 'Tính từ cân nặng 7 ngày trước') + '</button>' +
            '<span class="field__help">' + esc(helpText || 'Khoảng: −20.0 đến +20.0 kg (bước 0.1; âm là giảm, dương là tăng).') + '</span>' +
          '</div>' +
          (calcOpen && !isUnknown ? (
            '<div class="v12-calc-box" data-v12-wcalc-box="' + esc(scope) + '">' +
              '<div class="v12-calc-box__row">' +
                '<label class="field__help" for="v12-prev7d-' + esc(scope) + '">Cân nặng 7 ngày trước (kg):</label>' +
                '<input id="v12-prev7d-' + esc(scope) + '" type="number" step="0.1" min="20" max="250" class="input input--sm" data-v12-wprev="' + esc(scope) + '" value="' + esc(prevStr) + '" placeholder="VD: 62.0"' + (ro ? ' disabled' : '') + '>' +
              '</div>' +
              (curW === null
                ? '<p class="field__help v12-calc-box__warn">Cần nhập cân nặng hiện tại để tự tính</p>'
                : (calcDelta !== null
                    ? '<div class="v12-calc-box__preview"><span>Hiện tại ' + esc(curW) + ' − 7 ngày trước ' + esc(prevW) + ' = <strong>' + esc(signedDelta) + ' kg</strong></span>' +
                      '<button type="button" class="btn btn--secondary btn--xs" data-v12-apply-wdelta="' + esc(calcDelta) + '"' + scopeAttr + (ro ? ' disabled' : '') + '>Áp dụng (' + esc(signedDelta) + ' kg)</button></div>'
                    : '<p class="field__help">Cân nặng hiện tại: <strong>' + esc(curW) + ' kg</strong> — nhập cân nặng 7 ngày trước để tính gợi ý.</p>')) +
            '</div>'
          ) : '') +
          (errMsg ? '<p class="field__error">' + ICONS.alert + ' ' + esc(errMsg) + '</p>' : '') +
        '</div>'
      );
    }

    // 6: E/A Ratio (0.20..5.00 step 0.01) + Not measurable (AF) pill + Unknown
    if (code === 'e_over_a_ratio') {
      const isAf = isAnswered && compact.value === 'not_measurable_af';
      const hasNum = isAnswered && !isAf && compact.value !== null && compact.value !== undefined;
      const numStr = hasNum ? String(compact.value) : '';
      const cls = 'input' + (!compact ? ' input--unfilled' : '') + (isUnknown ? ' input--unknown' : '') + (isAf ? ' input--af-sentinel' : '') + (errMsg ? ' input--error' : '');
      return (
        '<div class="field v12-field' + extraClass + (errMsg ? ' v12-field--error' : '') + '" data-field-code="' + esc(code) + '">' +
          '<div class="field__label-row"><label class="field__label">' + esc(label) + ' ' + reqTag + ' ' + modBadgesHtml + ' ' + expBadge + '</label></div>' +
          '<div class="input-row-unknown input-row-unknown--wrap">' +
            '<div class="input-unit-wrap">' +
              '<input type="number" class="' + cls + '" min="0.20" max="5.00" step="0.01" data-v12-num="e_over_a_ratio"' + scopeAttr + ' placeholder="' + (isUnknown ? 'Chưa rõ' : (isAf ? 'Không đo được (rung nhĩ)' : '0.20 – 5.00')) + '" value="' + esc(numStr) + '"' + (ro || isUnknown || isAf ? ' disabled' : '') + '>' +
              '<span class="input-unit-wrap__unit">tỉ lệ</span>' +
            '</div>' +
            '<button type="button" class="v12-sentinel-pill' + (isAf ? ' is-active' : '') + '" data-v12-ea-af="1"' + scopeAttr + ' aria-pressed="' + (isAf ? 'true' : 'false') + '"' + (ro ? ' disabled' : '') + '>Không đo được (rung nhĩ)</button>' +
            '<button type="button" class="unknown-toggle' + (isUnknown ? ' is-active' : '') + '" data-v12-unknown="1"' + scopeAttr + ' aria-pressed="' + (isUnknown ? 'true' : 'false') + '"' + (ro ? ' disabled' : '') + '>Chưa rõ</button>' +
          '</div>' +
          unlockNoticeHtml +
          (isAf ? '<p class="field__help v12-sentinel-note">Đã ghi nhận có lý do (<code>not_measurable_af</code>) — phân biệt hoàn toàn với trạng thái Chưa rõ.</p>' : '<p class="field__help">' + esc(helpText || 'Khoảng hợp lệ: 0.20 đến 5.00 (bước 0.01). Không đồng nhất với E/e′.') + '</p>') +
          (errMsg ? '<p class="field__error">' + ICONS.alert + ' ' + esc(errMsg) + '</p>' : '') +
        '</div>'
      );
    }

    // 7: eGFR (1..200 mL/min/1.73m2, step 1) + formula + CKD-EPI 2021 suggestion
    if (code === 'egfr_ckd_epi') {
      const hasNum = isAnswered && compact.value !== null && compact.value !== undefined;
      const numStr = hasNum ? String(compact.value) : '';
      const formulaCompact = opts.egfrFormulaCompact || null;
      const curFormula = (formulaCompact && formulaCompact.value_state === 'answered' && formulaCompact.value) ? String(formulaCompact.value) : '';
      const creat = opts.creatinineInfo || null;
      const suggested = creat ? computeCkdEpi2021(creat.value, creat.unit, opts.patientAge, opts.patientSex) : null;
      const cls = 'input' + (!compact ? ' input--unfilled' : '') + (isUnknown ? ' input--unknown' : '') + (errMsg ? ' input--error' : '');
      return (
        '<div class="field field--span-2 v12-field' + extraClass + (errMsg ? ' v12-field--error' : '') + '" data-field-code="' + esc(code) + '">' +
          '<div class="field__label-row"><label class="field__label">' + esc(label) + ' ' + reqTag + ' ' + modBadgesHtml + ' ' + expBadge + '</label></div>' +
          '<div class="v12-egfr-row">' +
            '<div class="input-unit-wrap">' +
              '<input type="number" class="' + cls + '" min="1" max="200" step="1" data-v12-num="egfr_ckd_epi"' + scopeAttr + ' placeholder="' + (isUnknown ? 'Chưa rõ' : '1 – 200') + '" value="' + esc(numStr) + '"' + (ro || isUnknown ? ' disabled' : '') + '>' +
              '<span class="input-unit-wrap__unit">mL/phút/1.73m²</span>' +
            '</div>' +
            '<select class="select v12-egfr-formula" aria-label="Công thức tính eGFR" data-v12-egfr-formula="1"' + scopeAttr + (ro || isUnknown ? ' disabled' : '') + '>' +
              '<option value="">-- Công thức eGFR --</option>' +
              V12_EGFR_FORMULAS.map(function (f) {
                return '<option value="' + esc(f.value) + '"' + (curFormula === f.value ? ' selected' : '') + '>' + esc(f.label) + '</option>';
              }).join('') +
            '</select>' +
            '<button type="button" class="unknown-toggle' + (isUnknown ? ' is-active' : '') + '" data-v12-unknown="1"' + scopeAttr + ' aria-pressed="' + (isUnknown ? 'true' : 'false') + '"' + (ro ? ' disabled' : '') + '>Chưa rõ</button>' +
          '</div>' +
          unlockNoticeHtml +
          (suggested !== null && !isUnknown ? (
            '<div class="v12-suggestion-strip">' +
              '<span>Gợi ý CKD-EPI 2021 từ Creatinin (' + esc(creat.value) + ' ' + esc(creat.unit || 'umol/L') + '), ' + esc(opts.patientAge) + ' tuổi, ' + esc(formatSex(opts.patientSex)) + ': <strong>' + esc(suggested) + ' mL/phút/1.73m²</strong></span>' +
              '<button type="button" class="btn btn--secondary btn--sm" data-v12-apply-egfr="' + esc(suggested) + '"' + scopeAttr + (ro ? ' disabled' : '') + '>Dùng giá trị gợi ý (CKD-EPI 2021)</button>' +
            '</div>'
          ) : '') +
          '<p class="field__help">' + esc(helpText || 'Số nguyên 1–200 mL/phút/1.73m². Chỉ giá trị theo CKD-EPI 2021 được dùng trực tiếp cho tính toán lọc cầu thận chuẩn.') + '</p>' +
          (errMsg ? '<p class="field__error">' + ICONS.alert + ' ' + esc(errMsg) + '</p>' : '') +
        '</div>'
      );
    }

    // 8: Structured ECG (1 object with 6 sub-keys + optional measuredAt + whole-group Unknown)
    if (code === 'ecg_12_chuyen_dao') {
      const ecg = isAnswered ? parseStructuredJsonVal(compact.value, makeDefaultEcgValue) : makeDefaultEcgValue();
      const ecgMeasuredLocal = (isAnswered && compact.measuredAt) ? toDatetimeLocal(compact.measuredAt) : '';
      const renderEcgNum = function (subKey, subLabel, min, max, unit) {
        const subVal = isAnswered ? ecg[subKey] : null;
        const subUnk = isAnswered && subVal === null;
        const strVal = (subVal !== null && subVal !== undefined) ? String(subVal) : '';
        return (
          '<div class="wf-struct-item">' +
            '<label class="wf-struct-item__label">' + esc(subLabel) + ' <span class="field__help">(' + min + '–' + max + ' ' + esc(unit) + ')</span></label>' +
            '<div class="input-row-unknown">' +
              '<div class="input-unit-wrap">' +
                '<input type="number" class="input' + (subUnk ? ' input--unknown' : '') + '" min="' + min + '" max="' + max + '" step="1" data-v12-struct-num="' + esc(subKey) + '"' + scopeAttr + ' placeholder="' + (subUnk ? 'Chưa rõ' : (min + '–' + max)) + '" value="' + esc(strVal) + '"' + (ro || isUnknown ? ' disabled' : '') + '>' +
                '<span class="input-unit-wrap__unit">' + esc(unit) + '</span>' +
              '</div>' +
              '<button type="button" class="unknown-toggle unknown-toggle--sm' + (subUnk ? ' is-active' : '') + '" data-v12-struct-subunk="' + esc(subKey) + '"' + scopeAttr + (ro || isUnknown ? ' disabled' : '') + '>Chưa rõ</button>' +
            '</div>' +
          '</div>'
        );
      };
      const renderEcgTri = function (subKey, subLabel) {
        const subVal = isAnswered ? ecg[subKey] : undefined;
        const cur = subVal === true ? 'yes' : (subVal === false ? 'no' : (isAnswered && subVal === null ? 'unknown' : 'unfilled'));
        return (
          '<div class="wf-struct-item">' +
            '<span class="wf-struct-item__label">' + esc(subLabel) + '</span>' +
            '<div class="tristate__group" role="group" aria-label="' + esc(subLabel) + '">' +
              '<button type="button" class="tristate__btn' + (cur === 'unknown' ? ' is-unknown' : '') + '" data-v12-struct-tri="' + esc(subKey) + ':unknown"' + scopeAttr + (ro || isUnknown ? ' disabled' : '') + '>Chưa rõ</button>' +
              '<button type="button" class="tristate__btn' + (cur === 'yes' ? ' is-yes' : '') + '" data-v12-struct-tri="' + esc(subKey) + ':yes"' + scopeAttr + (ro || isUnknown ? ' disabled' : '') + '>Có</button>' +
              '<button type="button" class="tristate__btn' + (cur === 'no' ? ' is-no' : '') + '" data-v12-struct-tri="' + esc(subKey) + ':no"' + scopeAttr + (ro || isUnknown ? ' disabled' : '') + '>Không</button>' +
            '</div>' +
          '</div>'
        );
      };
      return (
        '<div class="field field--span-2 v12-field wf-struct-group' + extraClass + (isUnknown ? ' is-group-unknown' : '') + (errMsg ? ' v12-field--error' : '') + '" data-field-code="' + esc(code) + '">' +
          '<div class="field__label-row">' +
            '<span class="field__label">' + esc(label) + ' ' + reqTag + ' ' + modBadgesHtml + ' ' + expBadge + '</span>' +
            '<button type="button" class="unknown-toggle unknown-toggle--sm' + (isUnknown ? ' is-active unknown-toggle--group-active' : '') + '" data-v12-unknown="1"' + scopeAttr + ' aria-pressed="' + (isUnknown ? 'true' : 'false') + '"' + (ro ? ' disabled' : '') + '>' + (isUnknown ? '✓ Chưa rõ toàn bộ ECG' : 'Chưa rõ toàn bộ ECG') + '</button>' +
          '</div>' +
          (isUnknown ? '<div class="wf-struct-unknown-banner" role="status">' + ICONS.lock + ' <span>Đang chọn Chưa rõ toàn bộ — bấm lại để nhập</span></div>' : '') +
          unlockNoticeHtml +
          '<div class="wf-struct-grid">' +
            '<div class="wf-struct-item">' +
              '<label class="wf-struct-item__label">Nhịp tim (rhythm)</label>' +
              '<select class="select' + (isUnknown ? ' input--unknown' : '') + '" data-v12-struct-sel="rhythm"' + scopeAttr + (ro || isUnknown ? ' disabled' : '') + '>' +
                '<option value="">-- Chọn nhịp tim --</option>' +
                V12_ECG_RHYTHMS.map(function (r) {
                  return '<option value="' + esc(r.value) + '"' + (isAnswered && ecg.rhythm === r.value ? ' selected' : '') + '>' + esc(r.label) + '</option>';
                }).join('') +
              '</select>' +
            '</div>' +
            renderEcgNum('rate', 'Tần số tim', 20, 250, 'l/ph') +
            renderEcgNum('qrs_ms', 'Khoảng QRS', 40, 300, 'ms') +
            renderEcgNum('qtc_ms', 'Khoảng QTc', 200, 700, 'ms') +
            renderEcgTri('lbbb', 'Block nhánh trái (LBBB)') +
            renderEcgTri('pathological_q', 'Sóng Q bệnh lý') +
          '</div>' +
          '<div class="wf-measured-row">' +
            '<label class="field__help" for="v12-mat-ecg-' + esc(scope) + '">Thời điểm đo ECG (tùy chọn):</label>' +
            '<input id="v12-mat-ecg-' + esc(scope) + '" type="datetime-local" class="input input--sm" data-v12-struct-measured-at="1"' + scopeAttr + ' value="' + esc(ecgMeasuredLocal) + '"' + (ro || isUnknown ? ' disabled' : '') + '>' +
          '</div>' +
          (helpText ? '<p class="field__help">' + esc(helpText) + '</p>' : '') +
          (errMsg ? '<p class="field__error">' + ICONS.alert + ' ' + esc(errMsg) + '</p>' : '') +
        '</div>'
      );
    }

    // 9: Structured Chest X-ray (1 object with 3 sub-keys + optional measuredAt + whole-group Unknown)
    if (code === 'xquang_nguc_thang') {
      const xr = isAnswered ? parseStructuredJsonVal(compact.value, makeDefaultXrayValue) : makeDefaultXrayValue();
      const xrMeasuredLocal = (isAnswered && compact.measuredAt) ? toDatetimeLocal(compact.measuredAt) : '';
      const ctrVal = isAnswered ? xr.ctr : null;
      const ctrUnk = isAnswered && ctrVal === null;
      const ctrStr = (ctrVal !== null && ctrVal !== undefined) ? String(ctrVal) : '';
      const ctrHigh = ctrVal !== null && Number(ctrVal) > 0.5;
      const renderXrTri = function (subKey, subLabel) {
        const subVal = isAnswered ? xr[subKey] : undefined;
        const cur = subVal === true ? 'yes' : (subVal === false ? 'no' : (isAnswered && subVal === null ? 'unknown' : 'unfilled'));
        return (
          '<div class="wf-struct-item">' +
            '<span class="wf-struct-item__label">' + esc(subLabel) + '</span>' +
            '<div class="tristate__group" role="group" aria-label="' + esc(subLabel) + '">' +
              '<button type="button" class="tristate__btn' + (cur === 'unknown' ? ' is-unknown' : '') + '" data-v12-struct-tri="' + esc(subKey) + ':unknown"' + scopeAttr + (ro || isUnknown ? ' disabled' : '') + '>Chưa rõ</button>' +
              '<button type="button" class="tristate__btn' + (cur === 'yes' ? ' is-yes' : '') + '" data-v12-struct-tri="' + esc(subKey) + ':yes"' + scopeAttr + (ro || isUnknown ? ' disabled' : '') + '>Có</button>' +
              '<button type="button" class="tristate__btn' + (cur === 'no' ? ' is-no' : '') + '" data-v12-struct-tri="' + esc(subKey) + ':no"' + scopeAttr + (ro || isUnknown ? ' disabled' : '') + '>Không</button>' +
            '</div>' +
          '</div>'
        );
      };
      return (
        '<div class="field field--span-2 v12-field wf-struct-group' + extraClass + (isUnknown ? ' is-group-unknown' : '') + (errMsg ? ' v12-field--error' : '') + '" data-field-code="' + esc(code) + '">' +
          '<div class="field__label-row">' +
            '<span class="field__label">' + esc(label) + ' ' + reqTag + ' ' + modBadgesHtml + ' ' + expBadge + '</span>' +
            '<button type="button" class="unknown-toggle unknown-toggle--sm' + (isUnknown ? ' is-active unknown-toggle--group-active' : '') + '" data-v12-unknown="1"' + scopeAttr + ' aria-pressed="' + (isUnknown ? 'true' : 'false') + '"' + (ro ? ' disabled' : '') + '>' + (isUnknown ? '✓ Chưa rõ toàn bộ X-quang' : 'Chưa rõ toàn bộ X-quang') + '</button>' +
          '</div>' +
          (isUnknown ? '<div class="wf-struct-unknown-banner" role="status">' + ICONS.lock + ' <span>Đang chọn Chưa rõ toàn bộ — bấm lại để nhập</span></div>' : '') +
          unlockNoticeHtml +
          '<div class="wf-struct-grid wf-struct-grid--xray">' +
            '<div class="wf-struct-item">' +
              '<label class="wf-struct-item__label">Chỉ số tim/ngực — CTR <span class="field__help">(0.30–0.80, bước 0.01)</span></label>' +
              '<div class="input-row-unknown">' +
                '<input type="number" class="input' + (ctrUnk ? ' input--unknown' : '') + '" min="0.30" max="0.80" step="0.01" data-v12-struct-num="ctr"' + scopeAttr + ' placeholder="' + (ctrUnk ? 'Chưa rõ' : '0.30 – 0.80') + '" value="' + esc(ctrStr) + '"' + (ro || isUnknown ? ' disabled' : '') + '>' +
                '<button type="button" class="unknown-toggle unknown-toggle--sm' + (ctrUnk ? ' is-active' : '') + '" data-v12-struct-subunk="ctr"' + scopeAttr + (ro || isUnknown ? ' disabled' : '') + '>Chưa rõ</button>' +
              '</div>' +
              (ctrHigh ? '<span class="badge badge--warn badge--xs" style="margin-top:4px;">CTR &gt; 0.50 (gợi ý bóng tim to)</span>' : '') +
            '</div>' +
            renderXrTri('pulmonary_congestion', 'Sung huyết phổi / đường Kerley B') +
            renderXrTri('pleural_effusion', 'Tràn dịch màng phổi') +
          '</div>' +
          '<div class="wf-measured-row">' +
            '<label class="field__help" for="v12-mat-xr-' + esc(scope) + '">Thời điểm chụp X-quang (tùy chọn):</label>' +
            '<input id="v12-mat-xr-' + esc(scope) + '" type="datetime-local" class="input input--sm" data-v12-struct-measured-at="1"' + scopeAttr + ' value="' + esc(xrMeasuredLocal) + '"' + (ro || isUnknown ? ' disabled' : '') + '>' +
          '</div>' +
          (helpText ? '<p class="field__help">' + esc(helpText) + '</p>' : '') +
          (errMsg ? '<p class="field__error">' + ICONS.alert + ' ' + esc(errMsg) + '</p>' : '') +
        '</div>'
      );
    }

    return '';
  }

  function renderClinicalSectionForm(ctx) {
    // ctx: { mode: 'encounter'|'preview', readonly, sections, defById, defByCode, valuesByDefId,
    //        orthostaticBp, medications, allergies, labResults, diagnoses,
    //        medicationListState, allergyListState, diagnosisListState, supportsListStates,
    //        formVersion, patient, visit, clinicalNote, infoSource,
    //        activeSectionCode, search, filter, fieldErrors }
    const allSections = sortByDisplayOrder(ctx.sections || []);
    if (allSections.length === 0) return '<p class="field__help">Chưa có nhóm biểu mẫu nào.</p>';

    const q = String(ctx.search || '').trim().toLowerCase();
    const filter = ctx.filter || 'all';
    const ro = Boolean(ctx.readonly);
    const prefix = ctx.mode === 'preview' ? 'prev-' : 'enc-';
    const isPreview = ctx.mode === 'preview';
    const isV12Mode = Boolean(!isPreview && ctx.isV12);
    const modFilter = isV12Mode ? (ctx.moduleFilter || 'all') : 'all';
    const fieldMetaMap = isV12Mode ? (ctx.fieldMetadata || {}) : {};
    const unlockedUnknowns = isV12Mode ? (ctx.unlockedUnknownCodes || {}) : {};
    const showListStates = Boolean(ctx.supportsListStates || isV11Bundle(ctx.formVersion, allSections, ctx.defById));
    const bundleHasVisitNotes = hasVisitNotesPlacements(allSections, ctx.defById);

    const missingSetForMod = {};
    if (isV12Mode && modFilter !== 'all' && ctx.workflowSummary && ctx.workflowSummary.modules && ctx.workflowSummary.modules[modFilter]) {
      (ctx.workflowSummary.modules[modFilter].missingFieldCodes || []).forEach(function (fc) {
        const resolved = resolveFormFieldCode(fieldMetaMap, fc);
        missingSetForMod[resolved] = true;
        missingSetForMod[fc] = true;
      });
    }

    function fieldMatchesModuleFilter(code) {
      if (!isV12Mode || modFilter === 'all') return true;
      if (missingSetForMod[code]) return true;
      const meta = getFieldMetaFromApi(fieldMetaMap, code);
      if (meta && meta.input && Array.isArray(meta.modules) && meta.modules.indexOf(modFilter) >= 0) return true;
      if (code === 'egfr_ckd_epi') {
        const fMeta = getFieldMetaFromApi(fieldMetaMap, 'egfr_formula');
        if (fMeta && fMeta.input && Array.isArray(fMeta.modules) && fMeta.modules.indexOf(modFilter) >= 0) return true;
      }
      return false;
    }

    function renderFieldModuleBadges(code) {
      if (!isV12Mode) return '';
      const meta = getFieldMetaFromApi(fieldMetaMap, code);
      if (!meta || !meta.input || !Array.isArray(meta.modules) || meta.modules.length === 0) return '';
      const tags = meta.modules.map(function (m) {
        const isFiltered = modFilter === m;
        return '<span class="mod-tag mod-tag--' + esc(m) + (isFiltered ? ' is-filtered' : '') + '">' + esc(m.toUpperCase()) + '</span>';
      }).join('');
      const missingBadge = (modFilter !== 'all' && missingSetForMod[code])
        ? '<span class="badge badge--warn badge--xs">Thiếu cho ' + esc(modFilter.toUpperCase()) + '</span>'
        : '';
      return '<span class="mod-tag-group">' + tags + missingBadge + '</span>';
    }

    function getModHighlightClass(code) {
      if (!isV12Mode || modFilter === 'all') return '';
      if (missingSetForMod[code]) return ' field--mod-highlight field--mod-missing';
      const meta = getFieldMetaFromApi(fieldMetaMap, code);
      if (meta && meta.input && Array.isArray(meta.modules) && meta.modules.indexOf(modFilter) >= 0) {
        return ' field--mod-highlight';
      }
      return '';
    }

    function renderV12TimedLabField(ff, fd) {
      const code = fd.code;
      const label = getFieldLabel(ff, fd);
      const helpText = getFieldHelpText(ff, fd);
      const val = ctx.valuesByDefId[fd.id] || null;
      const compact = (val && val.answer && typeof val.answer === 'object') ? val.answer : visitValueToCompact(code, val, fd);
      const isUnlocked = Boolean(unlockedUnknowns[code]);
      const isUnknown = Boolean(compact && compact.value_state === 'unknown' && !isUnlocked);
      const isAnswered = Boolean(compact && compact.value_state === 'answered');
      const unit = WF_CONTRACT_UNITS[code] || fd.canonicalUnit || '';
      const numStr = (isAnswered && compact.value !== null && compact.value !== undefined) ? String(compact.value) : '';
      const measuredLocal = (isAnswered && compact.measuredAt) ? toDatetimeLocal(compact.measuredAt) : '';
      const errMsg = (ctx.fieldErrors && ctx.fieldErrors[code]) || '';
      const flags = getFieldMetaFlags(ff, fd);
      const isReadonly = ro || flags.readonlyInput;
      const reqTag = ff.requiredForConfirm ? '<span class="badge badge--warn badge--xs">Bắt buộc</span>' : '';
      const modBadgesHtml = renderFieldModuleBadges(code);
      const modCls = getModHighlightClass(code);
      const cls = 'input' + (!compact ? ' input--unfilled' : '') + (isUnknown ? ' input--unknown' : '') + (errMsg ? ' input--error' : '');
      const needsTime = isAnswered && !measuredLocal;
      return (
        '<div class="field v12-timed-lab' + modCls + (errMsg ? ' v12-field--error' : '') + '" data-field-code="' + esc(code) + '">' +
          '<div class="field__label-row"><label class="field__label">' + esc(label) + ' ' + reqTag + ' ' + modBadgesHtml + '</label></div>' +
          '<div class="input-row-unknown">' +
            '<div class="input-unit-wrap">' +
              '<input type="number" step="any" class="' + cls + '" data-enc-v12lab-num="' + esc(code) + '" data-enc-v12lab-unit="' + esc(unit) + '" placeholder="' + (isUnknown ? 'Chưa rõ' : 'Nhập số...') + '" value="' + esc(numStr) + '"' + (isReadonly || isUnknown ? ' disabled' : '') + '>' +
              (unit ? '<span class="input-unit-wrap__unit">' + esc(unit) + '</span>' : '') +
            '</div>' +
            '<button type="button" class="unknown-toggle' + (isUnknown ? ' is-active' : '') + '" data-enc-v12lab-unknown="' + esc(code) + '" aria-pressed="' + (isUnknown ? 'true' : 'false') + '"' + (isReadonly ? ' disabled' : '') + '>Chưa rõ</button>' +
          '</div>' +
          (isUnlocked ? '<p class="field__help v12-unlock-hint">Đã mở khóa từ "Chưa rõ" — nhập giá trị mới để thay thế, hoặc giữ trống nếu muốn giữ nguyên "Chưa rõ".</p>' : '') +
          '<div class="wf-measured-row">' +
            '<label class="field__help" for="enc-mat-' + esc(code) + '">Thời điểm đo (bắt buộc khi nhập số):</label>' +
            '<input id="enc-mat-' + esc(code) + '" type="datetime-local" class="input input--sm' + (needsTime ? ' input--error' : '') + '" data-enc-v12lab-time="' + esc(code) + '" value="' + esc(measuredLocal) + '"' + (isReadonly || isUnknown ? ' disabled' : '') + '>' +
          '</div>' +
          (helpText ? '<p class="field__help">' + esc(helpText) + '</p>' : '') +
          (errMsg ? '<p class="field__error">' + ICONS.alert + ' ' + esc(errMsg) + '</p>' : '') +
        '</div>'
      );
    }

    function renderV12StructuredListField(ff, fd) {
      const code = fd.code;
      const label = getFieldLabel(ff, fd);
      const helpText = getFieldHelpText(ff, fd);
      const val = ctx.valuesByDefId[fd.id] || null;
      const compact = (val && val.answer && typeof val.answer === 'object') ? val.answer : null;
      const isUnlocked = Boolean(unlockedUnknowns[code]);
      const isUnknown = Boolean(compact && compact.value_state === 'unknown' && !isUnlocked);
      const isAnswered = Boolean(compact && compact.value_state === 'answered');
      const items = (isAnswered && Array.isArray(compact.value)) ? compact.value : [];
      const curListState = isUnknown ? 'unknown' : (isAnswered ? (items.length > 0 ? 'known' : 'none') : 'unfilled');
      const errMsg = (ctx.fieldErrors && ctx.fieldErrors[code]) || '';
      const flags = getFieldMetaFlags(ff, fd);
      const canEditList = !(ro || flags.readonlyInput);
      const modBadgesHtml = renderFieldModuleBadges(code);
      const modCls = getModHighlightClass(code);
      const stateBadge = curListState === 'unknown'
        ? '<span class="badge badge--info badge--xs">Chưa rõ</span>'
        : (curListState === 'none'
            ? '<span class="badge badge--success badge--xs">Đã xác nhận: Không có (0)</span>'
            : (curListState === 'known'
                ? '<span class="badge badge--success badge--xs">Có (' + items.length + ')</span>'
                : '<span class="badge badge--warn badge--xs">Chưa xử lý</span>'));
      let rowsHtml = '';
      if (curListState === 'known' && items.length > 0) {
        if (code === 'diagnoses') {
          rowsHtml = '<div class="wf-list-editor">' + items.map(function (dx, idx) {
            const dxCode = typeof dx === 'string' ? dx : (dx && dx.code ? dx.code : '');
            return (
              '<div class="wf-list-row wf-list-row--dx">' +
                '<input type="text" class="input input--sm mono" data-enc-v12list-item="diagnoses:' + idx + ':code" value="' + esc(dxCode) + '" placeholder="Mã ICD-10 (VD: I10, E11, I50.9)"' + (!canEditList ? ' disabled' : '') + '>' +
                (canEditList ? '<button type="button" class="btn btn--ghost btn--xs" data-enc-v12list-remove="diagnoses:' + idx + '" aria-label="Xóa chẩn đoán">' + ICONS.trash + '</button>' : '') +
              '</div>'
            );
          }).join('') + '</div>';
        } else if (code === 'medications') {
          rowsHtml = '<div class="wf-list-editor">' + items.map(function (med, idx) {
            const m = (med && typeof med === 'object') ? med : { id: 'med-' + (idx + 1), ingredient: String(med || '') };
            const ingVal = m.ingredient || m.ingredientCode || m.activeIngredient || '';
            const clsVal = m.class || '';
            const doseVal = m.dose != null ? m.dose : '';
            const unitVal = m.unit || m.doseUnit || '';
            const routeVal = m.route || '';
            const freqVal = m.frequency || '';
            return (
              '<div class="wf-list-row wf-list-row--med">' +
                '<input type="text" class="input input--sm" data-enc-v12list-item="medications:' + idx + ':ingredient" value="' + esc(ingVal) + '" placeholder="Hoạt chất (VD: spironolactone)"' + (!canEditList ? ' disabled' : '') + '>' +
                '<select class="select input--sm" data-enc-v12list-item="medications:' + idx + ':class"' + (!canEditList ? ' disabled' : '') + '>' +
                  '<option value="">-- Nhóm thuốc --</option>' +
                  WF_MED_CLASSES.map(function (c) { return '<option value="' + esc(c) + '"' + (clsVal === c ? ' selected' : '') + '>' + esc(c) + '</option>'; }).join('') +
                '</select>' +
                '<input type="number" step="any" min="0" class="input input--sm" data-enc-v12list-item="medications:' + idx + ':dose" value="' + esc(doseVal) + '" placeholder="Liều"' + (!canEditList ? ' disabled' : '') + '>' +
                '<select class="select input--sm" data-enc-v12list-item="medications:' + idx + ':unit"' + (!canEditList ? ' disabled' : '') + '>' +
                  '<option value="">Đơn vị</option>' +
                  WF_MED_UNITS.map(function (u) { return '<option value="' + esc(u) + '"' + (unitVal === u ? ' selected' : '') + '>' + esc(u) + '</option>'; }).join('') +
                '</select>' +
                '<select class="select input--sm" data-enc-v12list-item="medications:' + idx + ':route"' + (!canEditList ? ' disabled' : '') + '>' +
                  '<option value="">Đường dùng</option>' +
                  WF_MED_ROUTES.map(function (r) { return '<option value="' + esc(r) + '"' + (routeVal === r ? ' selected' : '') + '>' + esc(r) + '</option>'; }).join('') +
                '</select>' +
                '<select class="select input--sm" data-enc-v12list-item="medications:' + idx + ':frequency"' + (!canEditList ? ' disabled' : '') + '>' +
                  '<option value="">Tần suất</option>' +
                  WF_MED_FREQS.map(function (f) { return '<option value="' + esc(f.value) + '"' + (freqVal === f.value ? ' selected' : '') + '>' + esc(f.label) + '</option>'; }).join('') +
                '</select>' +
                (canEditList ? '<button type="button" class="btn btn--ghost btn--xs" data-enc-v12list-remove="medications:' + idx + '" aria-label="Xóa thuốc">' + ICONS.trash + '</button>' : '') +
              '</div>'
            );
          }).join('') + '</div>';
        } else if (code === 'allergies') {
          rowsHtml = '<div class="wf-list-editor">' + items.map(function (alg, idx) {
            const a = (alg && typeof alg === 'object') ? alg : { id: 'alg-' + (idx + 1), ingredient: String(alg || '') };
            return (
              '<div class="wf-list-row wf-list-row--dx">' +
                '<input type="text" class="input input--sm" data-enc-v12list-item="allergies:' + idx + ':ingredient" value="' + esc(a.ingredient || a.allergen || '') + '" placeholder="Tác nhân dị ứng (VD: aspirin, contrast_media)"' + (!canEditList ? ' disabled' : '') + '>' +
                (canEditList ? '<button type="button" class="btn btn--ghost btn--xs" data-enc-v12list-remove="allergies:' + idx + '" aria-label="Xóa dị ứng">' + ICONS.trash + '</button>' : '') +
              '</div>'
            );
          }).join('') + '</div>';
        }
      } else if (curListState === 'none') {
        rowsHtml = '<p class="field__help">Đã xác nhận không có mục nào (<code>[]</code>).</p>';
      } else if (curListState === 'unknown') {
        rowsHtml = '<p class="field__help">Đang ở trạng thái <strong>Chưa rõ</strong> (khác với xác nhận không có).</p>';
      } else {
        rowsHtml = '<p class="field__help">Thêm dòng có cấu trúc hoặc bấm "Xác nhận không có" / "Chưa rõ".</p>';
      }
      return (
        '<div class="field field--span-2 wf-list-summary-field' + modCls + (errMsg ? ' v12-field--error' : '') + '" data-field-code="' + esc(code) + '">' +
          '<div class="field__label-row">' +
            '<span class="field__label">' + esc(label) + ' ' + stateBadge + ' ' + modBadgesHtml + '</span>' +
            (canEditList ? (
              '<div class="list-state-bar__group" role="group" aria-label="' + esc(label) + '">' +
                '<button type="button" class="btn btn--secondary btn--xs" data-enc-v12list-add="' + esc(code) + '">' + ICONS.plus + ' Thêm dòng</button>' +
                '<button type="button" class="list-state-btn' + (curListState === 'none' ? ' is-none' : '') + '" data-enc-v12list-state="' + esc(code) + ':none">Xác nhận không có</button>' +
                '<button type="button" class="list-state-btn' + (curListState === 'unknown' ? ' is-unknown' : '') + '" data-enc-v12list-state="' + esc(code) + ':unknown">Chưa rõ</button>' +
              '</div>'
            ) : '') +
          '</div>' +
          rowsHtml +
          (helpText ? '<p class="field__help">' + esc(helpText) + '</p>' : '') +
          (errMsg ? '<p class="field__error">' + ICONS.alert + ' ' + esc(errMsg) + '</p>' : '') +
        '</div>'
      );
    }

    function renderListStateBar(kind, currentVal, titleLabel, barReadonly) {
      if (!showListStates) return '';
      const cur = currentVal || 'unknown';
      const isDisabled = Boolean(ro || barReadonly);
      const labels = {
        known: 'Có',
        none: 'Không có',
        unknown: 'Chưa rõ'
      };
      return (
        '<div class="list-state-bar" data-list-state-kind="' + esc(kind) + '">' +
          '<span class="list-state-bar__label">' + esc(titleLabel) + ':</span>' +
          '<div class="list-state-bar__group" role="group" aria-label="' + esc(titleLabel) + '">' +
            ['known', 'none', 'unknown'].map(function (st) {
              const activeCls = cur === st ? (' is-' + st) : '';
              return '<button type="button" class="list-state-btn' + activeCls + '" data-' + prefix + 'list-state="' + esc(kind) + ':' + st + '" aria-pressed="' + (cur === st ? 'true' : 'false') + '"' + (isDisabled ? ' disabled' : '') + '>' + esc(labels[st]) + '</button>';
            }).join('') +
          '</div>' +
        '</div>'
      );
    }

    function renderSingleField(ff) {
      const fd = ctx.defById[ff.fieldDefinitionId] || ff._virtualDef;
      if (!fd) return '';
      const label = getFieldLabel(ff, fd);
      const helpText = getFieldHelpText(ff, fd);
      const customHelp = ff.customHelpText && String(ff.customHelpText).trim() ? sanitizeDoctorHelpText(ff.customHelpText) : '';
      const val = ctx.valuesByDefId[fd.id] || null;
      const errMsg = (ctx.fieldErrors && ctx.fieldErrors[fd.code]) || '';
      const flags = getFieldMetaFlags(ff, fd);
      const isReadonly = ro || flags.readonlyInput;
      const reqTag = ff.requiredForConfirm ? '<span class="badge badge--warn badge--xs">Bắt buộc</span>' : '';
      const modBadgesHtml = renderFieldModuleBadges(fd.code);
      const modCls = getModHighlightClass(fd.code);
      const isUnlocked = Boolean(unlockedUnknowns[fd.code]);

      // Form v1.2: Structured list widgets (diagnoses, medications, allergies)
      if (isV12Mode && isStructuredListCode(fd.code)) {
        return renderV12StructuredListField(ff, fd);
      }

      // Form v1.2: 9 experimental manual-entry widgets
      if (isV12NineField(fd.code)) {
        const formulaDef = ctx.defByCode && ctx.defByCode.egfr_formula;
        const formulaVal = formulaDef ? ctx.valuesByDefId[formulaDef.id] : null;
        const compactVal = (val && val.answer && typeof val.answer === 'object')
          ? val.answer
          : visitValueToCompact(fd.code, val, fd);
        const formulaCompact = (formulaVal && formulaVal.answer && typeof formulaVal.answer === 'object')
          ? formulaVal.answer
          : (formulaDef ? visitValueToCompact('egfr_formula', formulaVal, formulaDef) : null);
        return renderV12FieldControl(fd.code, {
          scope: isPreview ? 'prev' : 'enc',
          label: label,
          helpText: helpText,
          reqTag: reqTag,
          modBadgesHtml: modBadgesHtml,
          extraClass: modCls,
          unlockedUnknown: isUnlocked,
          readonly: isReadonly,
          errMsg: errMsg,
          compactValue: compactVal,
          egfrFormulaCompact: formulaCompact,
          currentWeightKg: getEncounterCurrentWeight(ctx),
          creatinineInfo: getEncounterCreatinineForEgfr(ctx),
          patientAge: ctx.patient ? computeAge(ctx.patient, ctx.visit && ctx.visit.visitDate) : null,
          patientSex: ctx.patient ? ctx.patient.sex : null
        });
      }
      if (fd.code === 'egfr_formula' && ctx.defByCode && ctx.defByCode.egfr_ckd_epi) {
        return ''; // Rendered inline inside egfr_ckd_epi composite widget
      }

      // List-state system fields (medication_list_state, allergy_list_state, diagnosis_list_state)
      if (flags.isListStateField) {
        if (isV12Mode) return ''; // Replaced by structured list widgets in v1.2
        const kind = (fd.code === 'medication_list_state' || fd.memberPath === 'medicationListState')
          ? 'medications'
          : ((fd.code === 'allergy_list_state' || fd.memberPath === 'allergyListState') ? 'allergies' : 'diagnoses');
        const curVal = kind === 'medications'
          ? (ctx.medicationListState || ((ctx.medications || []).length > 0 ? 'known' : 'unknown'))
          : (kind === 'allergies'
              ? (ctx.allergyListState || ((ctx.allergies || []).length > 0 ? 'known' : 'unknown'))
              : (ctx.diagnosisListState || ((ctx.diagnoses || []).length > 0 ? 'known' : 'unknown')));
        const lsErr = errMsg || (ctx.fieldErrors && ctx.fieldErrors[fd.memberPath || '']) || '';
        const labels = { known: 'Có', none: 'Không có', unknown: 'Chưa rõ' };
        return (
          '<div class="field field--span-2" data-field-code="' + esc(fd.code) + '" data-repeat-codes="' + esc(fd.code + (fd.memberPath ? ',' + fd.memberPath : '')) + '">' +
            '<div class="list-state-bar" style="margin-bottom:0;" data-list-state-kind="' + esc(kind) + '">' +
              '<span class="list-state-bar__label">' + esc(label) + ' ' + reqTag + '</span>' +
              '<div class="list-state-bar__group" role="group" aria-label="' + esc(label) + '">' +
                ['known', 'none', 'unknown'].map(function (st) {
                  const activeCls = curVal === st ? (' is-' + st) : '';
                  return '<button type="button" class="list-state-btn' + activeCls + '" data-' + prefix + 'list-state="' + esc(kind) + ':' + st + '" aria-pressed="' + (curVal === st ? 'true' : 'false') + '"' + (isReadonly ? ' disabled' : '') + '>' + esc(labels[st]) + '</button>';
                }).join('') +
              '</div>' +
            '</div>' +
            (helpText ? '<p class="field__help">' + esc(helpText) + '</p>' : '') +
            (lsErr ? '<p class="field__error">' + ICONS.alert + ' ' + esc(lsErr) + '</p>' : '') +
          '</div>'
        );
      }

      // Visit-level system note fields (info_source, clinical_note)
      if (flags.isVisitNote) {
        const metaKey = fd.memberPath || (fd.code === 'info_source' ? 'infoSource' : 'clinicalNote');
        const isNote = metaKey === 'clinicalNote' || fd.code === 'clinical_note';
        const domId = prefix + (isNote ? 'clinical-note' : 'info-source');
        const curText = isNote ? (ctx.clinicalNote || '') : (ctx.infoSource || '');
        const ph = isNote
          ? 'Ghi nhận bối cảnh đặc biệt hoặc điểm cần lưu ý ở lần tái khám sau...'
          : 'Người bệnh / Người nhà / Giấy tờ mang theo';
        return (
          '<div class="field' + (isNote ? ' field--span-2' : '') + '" data-field-code="' + esc(fd.code) + '">' +
            '<div class="field__label-row"><label class="field__label" for="' + esc(domId) + '">' + esc(label) + ' ' + reqTag + '</label></div>' +
            (isNote
              ? '<textarea id="' + esc(domId) + '" class="textarea' + (errMsg ? ' input--error' : '') + '" data-' + prefix + 'visit-meta="' + esc(metaKey) + '" placeholder="' + esc(ph) + '"' + (isReadonly ? ' disabled' : '') + '>' + esc(curText) + '</textarea>'
              : '<input id="' + esc(domId) + '" type="text" class="input' + (errMsg ? ' input--error' : '') + '" data-' + prefix + 'visit-meta="' + esc(metaKey) + '" placeholder="' + esc(ph) + '" value="' + esc(curText) + '"' + (isReadonly ? ' disabled' : '') + '>') +
            (helpText ? '<p class="field__help">' + esc(helpText) + '</p>' : '') +
            (errMsg ? '<p class="field__error">' + ICONS.alert + ' ' + esc(errMsg) + '</p>' : '') +
          '</div>'
        );
      }

      // Special computed / patient cards
      if (fd.code === 'bmi') {
        const hDef = Object.values(ctx.defById).find(function (x) { return x.code === 'chieu_cao_cm'; });
        const wDef = Object.values(ctx.defById).find(function (x) { return x.code === 'can_nang_kg'; });
        const hVal = hDef && ctx.valuesByDefId[hDef.id] && ctx.valuesByDefId[hDef.id].valueState === 'answered' ? Number(ctx.valuesByDefId[hDef.id].valueNum) : null;
        const wVal = wDef && ctx.valuesByDefId[wDef.id] && ctx.valuesByDefId[wDef.id].valueState === 'answered' ? Number(ctx.valuesByDefId[wDef.id].valueNum) : null;
        const bmi = computeBmi(hVal, wVal);
        return (
          '<div class="bmi-card" data-field-code="bmi">' +
            '<div class="bmi-card__label"><span>' + esc(label) + '</span><span class="badge badge--blue badge--xs">Tự tính</span></div>' +
            '<div class="bmi-card__value">' + (bmi !== null ? esc(bmi) + ' kg/m²' : 'Chưa đủ dữ liệu') + '</div>' +
            '<div class="bmi-card__note">' + esc(customHelp || 'Tự tính từ chiều cao và cân nặng của lượt khám này.') + '</div>' +
          '</div>'
        );
      }

      if (fd.code === 'luot_tuoi') {
        const age = ctx.patient ? computeAge(ctx.patient, ctx.visit && ctx.visit.visitDate) : null;
        if (isPreview) {
          return (
            '<div class="bmi-card" data-field-code="luot_tuoi">' +
              '<div class="bmi-card__label"><span>' + esc(label) + '</span><span class="badge badge--blue badge--xs">Tự tính</span></div>' +
              '<div class="bmi-card__value bmi-card__value--muted">Chưa có dữ liệu</div>' +
              '<div class="bmi-card__note">' + esc(customHelp || 'Lấy theo ngày sinh / năm sinh trong hồ sơ bệnh nhân khi mở lượt khám thật.') + '</div>' +
            '</div>'
          );
        }
        return (
          '<div class="bmi-card' + modCls + '" data-field-code="luot_tuoi">' +
            '<div class="bmi-card__label"><span>' + esc(label) + ' ' + modBadgesHtml + '</span><span class="badge badge--blue badge--xs">Tự tính</span></div>' +
            '<div class="bmi-card__value">' + (age !== null ? esc(age) + ' tuổi' : 'Chưa ghi nhận') + '</div>' +
            '<div class="bmi-card__note">' + esc(customHelp || (ctx.patient ? formatBirthPrecision(ctx.patient) : 'Lấy từ hồ sơ hành chính')) +
              (ctx.visit && ctx.visit.patientId ? ' · <button type="button" class="breadcrumbs__link" data-nav="#/patients/' + esc(ctx.visit.patientId) + '">Mở hồ sơ bệnh nhân ↗</button>' : '') +
            '</div>' +
          '</div>'
        );
      }

      if (fd.code === 'bn_gioi_tinh') {
        if (isPreview) {
          return (
            '<div class="bmi-card" data-field-code="bn_gioi_tinh">' +
              '<div class="bmi-card__label"><span>' + esc(label) + '</span><span class="badge badge--info badge--xs">Trường hệ thống</span></div>' +
              '<div class="bmi-card__value bmi-card__value--muted">Chưa có dữ liệu</div>' +
              '<div class="bmi-card__note">' + esc(customHelp || 'Đồng bộ từ hồ sơ hành chính bệnh nhân.') + '</div>' +
            '</div>'
          );
        }
        return (
          '<div class="bmi-card' + modCls + '" data-field-code="bn_gioi_tinh">' +
            '<div class="bmi-card__label"><span>' + esc(label) + ' ' + modBadgesHtml + '</span><span class="badge badge--info badge--xs">Trường hệ thống</span></div>' +
            '<div class="bmi-card__value bmi-card__value--sm">' + esc(ctx.patient ? formatSex(ctx.patient.sex) : 'Chưa ghi nhận') + '</div>' +
            '<div class="bmi-card__note">' + esc(customHelp || 'Đồng bộ từ hồ sơ hành chính bệnh nhân.') +
              (ctx.visit && ctx.visit.patientId ? ' · <button type="button" class="breadcrumbs__link" data-nav="#/patients/' + esc(ctx.visit.patientId) + '">Mở hồ sơ bệnh nhân ↗</button>' : '') +
            '</div>' +
          '</div>'
        );
      }

      if (fd.code === 'so_luong_thuoc_dong_thoi') {
        let valLabel = '';
        if (isV12Mode && ctx.defByCode && ctx.defByCode.medications && ctx.valuesByDefId[ctx.defByCode.medications.id]) {
          const mv = ctx.valuesByDefId[ctx.defByCode.medications.id];
          const mans = mv && mv.answer;
          if (mans && mans.value_state === 'unknown') valLabel = 'Chưa rõ';
          else if (mans && mans.value_state === 'answered' && Array.isArray(mans.value)) {
            valLabel = mans.value.length === 0 ? '0 thuốc (đã xác nhận không dùng)' : (mans.value.length + ' thuốc đang dùng');
          }
        }
        if (!valLabel) {
          const allMeds = ctx.medications || [];
          const validActiveCount = allMeds.filter(function (m) { return isValidMedRow(m) && m.status === 'active'; }).length;
          const validTotalCount = allMeds.filter(isValidMedRow).length;
          valLabel = validTotalCount === 0
            ? (ctx.medicationListState === 'none' ? '0 thuốc (đã xác nhận không dùng)' : 'Chưa ghi nhận thuốc')
            : (validActiveCount + ' thuốc đang dùng');
        }
        return (
          '<div class="bmi-card" data-field-code="so_luong_thuoc_dong_thoi">' +
            '<div class="bmi-card__label"><span>' + esc(label) + '</span><span class="badge badge--blue badge--xs">Tự tính</span></div>' +
            '<div class="bmi-card__value bmi-card__value--sm">' + esc(valLabel) + '</div>' +
            '<div class="bmi-card__note">' + esc(customHelp || 'Chỉ đếm bản ghi thuốc đã nhập tên và ở trạng thái Đang dùng.') + '</div>' +
          '</div>'
        );
      }

      if (flags.computed) {
        return (
          '<div class="bmi-card" data-field-code="' + esc(fd.code) + '">' +
            '<div class="bmi-card__label"><span>' + esc(label) + '</span><span class="badge badge--blue badge--xs">Tự tính</span></div>' +
            '<div class="bmi-card__value bmi-card__value--muted">Tự tính khi có đủ dữ liệu</div>' +
            (helpText ? '<div class="bmi-card__note">' + esc(helpText) + '</div>' : '') +
          '</div>'
        );
      }

      // Tri-state boolean (Chưa điền vs Chưa rõ vs Có vs Không) — strictly by fd.dataType === 'boolean'
      if (fd.dataType === 'boolean') {
        let effectiveVal = val;
        if (effectiveVal && effectiveVal.answer && typeof effectiveVal.answer === 'object') {
          effectiveVal = effectiveVal.answer.value_state === 'unknown'
            ? { valueState: 'unknown', valueBool: null }
            : (effectiveVal.answer.value_state === 'answered' ? { valueState: 'answered', valueBool: Boolean(effectiveVal.answer.value) } : null);
        }
        if (!effectiveVal && fd.code === 'di_ung_thuoc_can_quang' && fd.storageLevel === 'allergy') {
          if ((ctx.allergies || []).some(function (a) { return a && a.agentCategory === 'contrast_media'; })) {
            effectiveVal = { valueState: 'answered', valueBool: true };
          }
        }
        const curState = !effectiveVal ? 'unfilled' : (effectiveVal.valueState === 'unknown' ? (isUnlocked ? 'unfilled' : 'unknown') : (effectiveVal.valueBool ? 'yes' : 'no'));
        const statusText = curState === 'unfilled' ? (isUnlocked ? 'Đang mở khóa' : 'Chưa điền') : (curState === 'unknown' ? 'Chưa rõ' : (curState === 'yes' ? 'Có' : 'Không'));
        const boolHelp = helpText && helpText.toLowerCase() === 'thang thử nghiệm, chờ bác sĩ duyệt' ? '' : helpText;
        return (
          '<div class="tristate' + modCls + (curState === 'unfilled' ? ' tristate--unfilled' : '') + (errMsg ? ' tristate--error' : '') + '" data-field-code="' + esc(fd.code) + '">' +
            '<div class="tristate__head">' +
              '<span class="field__label">' + esc(label) + ' ' + reqTag + ' ' + modBadgesHtml + '</span>' +
              '<span class="tristate__status">' + esc(statusText) + (curState !== 'unfilled' && !isReadonly ? ' · <button type="button" class="tristate__clear" data-' + prefix + 'tristate="' + esc(fd.id) + '" data-val="clear">Xóa chọn</button>' : '') + '</span>' +
            '</div>' +
            '<div class="tristate__group" role="group" aria-label="' + esc(label) + '">' +
              '<button type="button" class="tristate__btn' + (curState === 'unknown' ? ' is-unknown' : '') + '" data-' + prefix + 'tristate="' + esc(fd.id) + '" data-val="unknown"' + (isReadonly ? ' disabled' : '') + '>Chưa rõ</button>' +
              '<button type="button" class="tristate__btn' + (curState === 'yes' ? ' is-yes' : '') + '" data-' + prefix + 'tristate="' + esc(fd.id) + '" data-val="yes"' + (isReadonly ? ' disabled' : '') + '>Có</button>' +
              '<button type="button" class="tristate__btn' + (curState === 'no' ? ' is-no' : '') + '" data-' + prefix + 'tristate="' + esc(fd.id) + '" data-val="no"' + (isReadonly ? ' disabled' : '') + '>Không</button>' +
            '</div>' +
            (boolHelp ? '<p class="field__help">' + esc(boolHelp) + '</p>' : '') +
            (errMsg ? '<p class="field__error">' + ICONS.alert + ' ' + esc(errMsg) + '</p>' : '') +
          '</div>'
        );
      }

      // Numeric / Integer
      if (fd.dataType === 'number' || fd.dataType === 'integer') {
        const isUnknown = Boolean(val && val.valueState === 'unknown' && !isUnlocked);
        const hasNum = val && val.valueState === 'answered' && val.valueNum !== null && val.valueNum !== undefined;
        const numStr = hasNum ? String(val.valueNum) : '';
        const isZero = hasNum && Number(val.valueNum) === 0;
        const cls = 'input' + (!val ? ' input--unfilled' : '') + (isUnknown ? ' input--unknown' : '') + (errMsg ? ' input--error' : '');
        const inputEl =
          '<input type="number" class="' + cls + '" step="' + (fd.dataType === 'integer' ? '1' : 'any') + '" ' +
            'data-' + prefix + 'num="' + esc(fd.id) + '" ' +
            'placeholder="' + (isUnknown ? 'Chưa rõ' : 'Nhập số...') + '" ' +
            'value="' + esc(numStr) + '"' + (isReadonly || isUnknown ? ' disabled' : '') + '>';
        return (
          '<div class="field' + modCls + '" data-field-code="' + esc(fd.code) + '">' +
            '<div class="field__label-row"><label class="field__label">' + esc(label) + ' ' + reqTag + ' ' + modBadgesHtml + '</label></div>' +
            '<div class="input-row-unknown">' +
              (fd.canonicalUnit ? ('<div class="input-unit-wrap">' + inputEl + '<span class="input-unit-wrap__unit">' + esc(fd.canonicalUnit) + '</span></div>') : inputEl) +
              '<button type="button" class="unknown-toggle' + (isUnknown ? ' is-active' : '') + '" data-' + prefix + 'toggle-unknown="' + esc(fd.id) + '"' + (isReadonly ? ' disabled' : '') + '>Chưa rõ</button>' +
            '</div>' +
            (isUnlocked ? '<p class="field__help v12-unlock-hint">Đã mở khóa từ "Chưa rõ" — nhập giá trị mới để thay thế, hoặc giữ trống để giữ "Chưa rõ".</p>' : '') +
            (isZero ? '<span class="zero-chip">Đã nhập: 0 (khác với để trống)</span>' : '') +
            (helpText ? '<p class="field__help">' + esc(helpText) + '</p>' : '') +
            (errMsg ? '<p class="field__error">' + ICONS.alert + ' ' + esc(errMsg) + '</p>' : '') +
          '</div>'
        );
      }

      // Single Choice
      if (fd.dataType === 'single_choice') {
        const isUnknown = Boolean(val && val.valueState === 'unknown' && !isUnlocked);
        const selId = val && val.valueState === 'answered' ? (val.fieldOptionId || '') : '';
        const cls = 'select' + (!val ? ' input--unfilled' : '') + (isUnknown ? ' input--unknown' : '') + (errMsg ? ' input--error' : '');
        const activeOpts = (fd.options || []).filter(function (o) { return o.isActive !== false; });
        const opts = '<option value="">-- Chưa chọn --</option>' + activeOpts.map(function (o) {
          return '<option value="' + esc(o.id) + '"' + (selId === o.id ? ' selected' : '') + '>' + esc(o.labelVi) + '</option>';
        }).join('');
        return (
          '<div class="field' + modCls + '" data-field-code="' + esc(fd.code) + '">' +
            '<div class="field__label-row"><label class="field__label">' + esc(label) + ' ' + reqTag + ' ' + modBadgesHtml + '</label></div>' +
            '<div class="input-row-unknown">' +
              '<select class="' + cls + '" data-' + prefix + 'select="' + esc(fd.id) + '"' + (isReadonly || isUnknown ? ' disabled' : '') + '>' + opts + '</select>' +
              '<button type="button" class="unknown-toggle' + (isUnknown ? ' is-active' : '') + '" data-' + prefix + 'toggle-unknown="' + esc(fd.id) + '"' + (isReadonly ? ' disabled' : '') + '>Chưa rõ</button>' +
            '</div>' +
            (isUnlocked ? '<p class="field__help v12-unlock-hint">Đã mở khóa từ "Chưa rõ" — chọn giá trị mới để thay thế.</p>' : '') +
            (helpText ? '<p class="field__help">' + esc(helpText) + '</p>' : '') +
            (errMsg ? '<p class="field__error">' + ICONS.alert + ' ' + esc(errMsg) + '</p>' : '') +
          '</div>'
        );
      }

      // Multi Choice
      if (fd.dataType === 'multi_choice') {
        const isUnknown = Boolean(val && val.valueState === 'unknown' && !isUnlocked);
        const chosenSet = {};
        if (val && val.valueState === 'answered' && Array.isArray(val.selectedOptions)) {
          val.selectedOptions.forEach(function (so) { chosenSet[so.fieldOptionId] = true; });
        }
        const activeOpts = (fd.options || []).filter(function (o) { return o.isActive !== false; });
        const checks = activeOpts.map(function (o) {
          return (
            '<label class="choice-row">' +
              '<input type="checkbox" data-' + prefix + 'multi="' + esc(fd.id) + '" value="' + esc(o.id) + '"' + (chosenSet[o.id] ? ' checked' : '') + (isReadonly || isUnknown ? ' disabled' : '') + '>' +
              '<span>' + esc(o.labelVi) + '</span>' +
            '</label>'
          );
        }).join('');
        return (
          '<div class="field' + modCls + '" data-field-code="' + esc(fd.code) + '">' +
            '<div class="field__label-row"><span class="field__label">' + esc(label) + ' ' + reqTag + ' ' + modBadgesHtml + '</span><button type="button" class="unknown-toggle unknown-toggle--sm' + (isUnknown ? ' is-active' : '') + '" data-' + prefix + 'toggle-unknown="' + esc(fd.id) + '"' + (isReadonly ? ' disabled' : '') + '>Chưa rõ</button></div>' +
            '<div class="multi-choice-box' + (!val ? ' multi-choice-box--unfilled' : '') + '">' + checks + '</div>' +
            (helpText ? '<p class="field__help">' + esc(helpText) + '</p>' : '') +
            (errMsg ? '<p class="field__error">' + ICONS.alert + ' ' + esc(errMsg) + '</p>' : '') +
          '</div>'
        );
      }

      // Text / Date (strictly text input for dataType === 'text', never boolean!)
      const isUnknown = Boolean(val && val.valueState === 'unknown' && !isUnlocked);
      const txtVal = val && val.valueState === 'answered' ? (fd.dataType === 'date' ? (val.valueDate || '') : (val.valueText || '')) : '';
      const cls = 'input' + (!val ? ' input--unfilled' : '') + (isUnknown ? ' input--unknown' : '') + (errMsg ? ' input--error' : '');
      const isNoteField = /_ghi_chu$/.test(fd.code);
      return (
        '<div class="field' + modCls + '" data-field-code="' + esc(fd.code) + '">' +
          '<div class="field__label-row"><label class="field__label">' + esc(label) + ' ' + reqTag + '</label></div>' +
          '<div class="input-row-unknown">' +
            '<input type="' + (fd.dataType === 'date' ? 'date' : 'text') + '" class="' + cls + '" data-' + prefix + 'text="' + esc(fd.id) + '" placeholder="' + (isUnknown ? 'Chưa rõ' : (isNoteField ? 'Ghi chú chi tiết (tùy chọn)...' : 'Nhập thông tin...')) + '" value="' + esc(txtVal) + '"' + (isReadonly || isUnknown ? ' disabled' : '') + '>' +
            '<button type="button" class="unknown-toggle' + (isUnknown ? ' is-active' : '') + '" data-' + prefix + 'toggle-unknown="' + esc(fd.id) + '"' + (isReadonly ? ' disabled' : '') + '>Chưa rõ</button>' +
          '</div>' +
          (helpText ? '<p class="field__help">' + esc(helpText) + '</p>' : '') +
          (errMsg ? '<p class="field__error">' + ICONS.alert + ' ' + esc(errMsg) + '</p>' : '') +
        '</div>'
      );
    }

    function renderOrthostaticBpBlock(entries, allBpEntriesInSec) {
      const bps = ctx.orthostaticBp || [];
      const hasAnyErr = entries.some(function (e) { return Boolean(ctx.fieldErrors && ctx.fieldErrors[e.fd.code]); });
      if (filter === 'error' && !hasAnyErr) return '';
      if (filter === 'unfilled' && bps.length > 0 && !q) return '';
      if (q) {
        const hit = 'huyết áp tư thế nhịp tim'.indexOf(q) >= 0 || entries.some(function (e) {
          return getFieldLabel(e.ff, e.fd).toLowerCase().indexOf(q) >= 0 || e.fd.code.toLowerCase().indexOf(q) >= 0;
        });
        if (!hit) return '';
      }

      const configuredMembers = {};
      allBpEntriesInSec.forEach(function (e) {
        if (e.rep.memberPath) configuredMembers[e.rep.memberPath] = true;
      });
      const visibleCols = entries.slice();
      const allBpReadonly = visibleCols.length > 0 && visibleCols.every(function (e) { return Boolean(e.ff.isReadonly); });
      const blockRo = ro || allBpReadonly;
      // For v1.0 bundles that do not declare heartRate / minuteAfter placements, preserve supplementary columns
      const extraCols = [];
      if (!configuredMembers.heartRate) {
        extraCols.push({ memberPath: 'heartRate', label: 'Nhịp tim (lần/phút)', required: false, readonly: blockRo, code: 'mach', help: '' });
      }
      if (!configuredMembers.minuteAfter) {
        extraCols.push({ memberPath: 'minuteAfter', label: 'Phút sau đổi tư thế', required: false, readonly: blockRo, code: 'minuteAfter', help: '' });
      }
      const columns = visibleCols.map(function (e) {
        return {
          memberPath: e.rep.memberPath || e.fd.code,
          label: getFieldLabel(e.ff, e.fd),
          required: Boolean(e.ff.requiredForConfirm),
          readonly: Boolean(ro || e.ff.isReadonly),
          code: e.fd.code,
          unit: e.fd.canonicalUnit || '',
          help: getFieldHelpText(e.ff, e.fd)
        };
      }).concat(extraCols);

      const repeatCodes = entries.map(function (e) { return e.fd.code; }).concat(['huyet_ap_tam_thu', 'huyet_ap_tam_truong', 'thoi_diem_do_ha', 'tu_the_do_ha', 'ha_nhip_tim', 'ha_phut_sau_doi_tu_the', 'orthostaticBp']).join(',');
      const anyRequired = entries.some(function (e) { return e.ff.requiredForConfirm; });
      const blockErrors = entries.map(function (e) {
        return ctx.fieldErrors && ctx.fieldErrors[e.fd.code] ? (getFieldLabel(e.ff, e.fd) + ': ' + ctx.fieldErrors[e.fd.code]) : '';
      }).filter(Boolean);

      function renderBpColumn(col, bp, idx) {
        const colRo = Boolean(ro || col.readonly);
        const reqBadge = col.required ? ' <span class="badge badge--warn badge--xs">Bắt buộc</span>' : '';
        const lbl = esc(col.label) + (col.unit && col.label.indexOf(col.unit) === -1 ? ' (' + esc(col.unit) + ')' : '') + reqBadge;
        const helpHtml = col.help ? '<p class="field__help">' + esc(col.help) + '</p>' : '';
        if (col.memberPath === 'position') {
          return (
            '<div class="field" data-field-code="' + esc(col.code) + '"><label class="field__label">' + lbl + '</label>' +
              '<select class="select" data-' + prefix + 'bp-field="' + idx + ':position"' + (colRo ? ' disabled' : '') + '>' +
                '<option value="supine"' + (bp.position === 'supine' ? ' selected' : '') + '>Nằm</option>' +
                '<option value="sitting"' + (bp.position === 'sitting' ? ' selected' : '') + '>Ngồi</option>' +
                '<option value="standing"' + (bp.position === 'standing' ? ' selected' : '') + '>Đứng</option>' +
              '</select>' + helpHtml +
            '</div>'
          );
        }
        if (col.memberPath === 'measuredAt') {
          return (
            '<div class="field" data-field-code="' + esc(col.code) + '"><label class="field__label">' + lbl + '</label>' +
              '<input type="datetime-local" class="input" data-' + prefix + 'bp-field="' + idx + ':measuredAt" value="' + esc(toDatetimeLocal(bp.measuredAt)) + '"' + (colRo ? ' disabled' : '') + '>' + helpHtml +
            '</div>'
          );
        }
        const val = bp[col.memberPath] != null ? bp[col.memberPath] : '';
        return (
          '<div class="field" data-field-code="' + esc(col.code) + '"><label class="field__label">' + lbl + '</label>' +
            '<input type="number" class="input" data-' + prefix + 'bp-field="' + idx + ':' + esc(col.memberPath) + '" value="' + esc(val) + '"' + (colRo ? ' disabled' : '') + '>' + helpHtml +
          '</div>'
        );
      }

      return (
        '<div class="section-chunk" data-repeat-group="orthostaticBp" data-repeat-codes="' + esc(repeatCodes) + '" data-field-code="' + esc(entries[0].fd.code) + '">' +
          '<div class="sub-heading">Huyết áp theo tư thế' + (anyRequired ? '<span class="sub-heading__meta"><span class="badge badge--warn badge--xs">Có cột bắt buộc</span></span>' : '') + '</div>' +
          (blockErrors.length > 0 ? '<p class="field__error" style="margin-bottom:8px;">' + ICONS.alert + ' ' + esc(blockErrors.join(' · ')) + '</p>' : '') +
          '<div class="repeat-list">' +
            (bps.length === 0 ? '<p class="field__help">Chưa có lần đo huyết áp nào trong lượt khám này.</p>' : bps.map(function (bp, idx) {
              return (
                '<div class="repeat-card">' +
                  '<div class="repeat-card__head">' +
                    '<span class="repeat-card__title">Lần đo huyết áp #' + (idx + 1) + '</span>' +
                    (!blockRo ? '<button type="button" class="btn btn--danger-outline btn--sm" data-' + prefix + 'remove-bp="' + idx + '">' + ICONS.trash + ' Xóa</button>' : '') +
                  '</div>' +
                  '<div class="form-grid-3">' +
                    columns.map(function (col) { return renderBpColumn(col, bp, idx); }).join('') +
                  '</div>' +
                '</div>'
              );
            }).join('')) +
            (!blockRo ? '<div><button type="button" class="btn btn--secondary btn--sm" data-' + prefix + 'add-bp="1">' + ICONS.plus + ' Thêm lần đo huyết áp</button></div>' : '') +
          '</div>' +
        '</div>'
      );
    }

    function renderMedicationsBlock(entries) {
      const meds = ctx.medications || [];
      const listState = ctx.medicationListState || (meds.length > 0 ? 'known' : 'unknown');
      const primary = entries[0];
      const headingLabel = entries.length === 1 ? getFieldLabel(primary.ff, primary.fd) : 'Thuốc hiện đang sử dụng';
      const anyRequired = entries.some(function (e) { return e.ff.requiredForConfirm; });
      const helpText = joinUniqueHelpTexts(entries);
      const hasAnyErr = entries.some(function (e) { return Boolean(ctx.fieldErrors && ctx.fieldErrors[e.fd.code]); }) || Boolean(ctx.fieldErrors && ctx.fieldErrors.medicationListState);

      if (filter === 'error' && !hasAnyErr) return '';
      if (filter === 'unfilled' && (meds.some(isValidMedRow) || listState === 'none') && !q) return '';
      if (q) {
        const hit = ('thuốc kê đơn hoạt chất ' + headingLabel.toLowerCase()).indexOf(q) >= 0 || entries.some(function (e) {
          return getFieldLabel(e.ff, e.fd).toLowerCase().indexOf(q) >= 0 || e.fd.code.toLowerCase().indexOf(q) >= 0;
        });
        if (!hit) return '';
      }

      const defaultMedCols = [
        { path: 'drugName', label: 'Tên thuốc *' },
        { path: 'medicationGroup', label: 'Nhóm thuốc *' },
        { path: 'status', label: 'Trạng thái dùng' },
        { path: 'dose', label: 'Liều dùng' },
        { path: 'unit', label: 'Đơn vị' },
        { path: 'frequency', label: 'Tần suất' },
        { path: 'route', label: 'Đường dùng' },
        { path: 'activeIngredient', label: 'Hoạt chất' },
        { path: 'startedAt', label: 'Ngày bắt đầu' }
      ];
      const isGranular = entries.length > 1;
      const cols = isGranular
        ? entries.map(function (e) {
            return {
              path: e.rep.memberPath || e.fd.code,
              label: getFieldLabel(e.ff, e.fd),
              required: Boolean(e.ff.requiredForConfirm),
              readonly: Boolean(ro || e.ff.isReadonly),
              code: e.fd.code
            };
          })
        : defaultMedCols.map(function (c) {
            return {
              path: c.path,
              label: c.path === 'drugName' && primary.ff.customLabelVi ? primary.ff.customLabelVi : c.label,
              required: c.path === 'drugName' && Boolean(primary.ff.requiredForConfirm),
              readonly: Boolean(ro || primary.ff.isReadonly),
              code: primary.fd.code
            };
          });
      const blockRo = ro || (cols.length > 0 && cols.every(function (c) { return c.readonly; }));
      const canMutateRows = !blockRo && !cols.some(function (c) { return c.path === 'drugName' && c.readonly; });

      function renderMedCol(col, m, idx) {
        const colRo = Boolean(ro || col.readonly);
        const isMedGroup = col.path === 'medicationGroup';
        const displayLabel = isMedGroup && col.label.indexOf('*') === -1 ? (col.label + ' *') : col.label;
        const reqBadge = (col.required || isMedGroup) ? ' <span class="badge badge--warn badge--xs">Bắt buộc</span>' : '';
        const lbl = esc(displayLabel) + reqBadge;
        if (isMedGroup) {
          const missingGroup = !m.medicationGroup;
          return '<div class="field" data-field-code="' + esc(col.code || 'thuoc_nhom') + '"><label class="field__label">' + lbl + '</label><select class="select' + (missingGroup && !colRo ? ' input--error' : '') + '" data-' + prefix + 'med-field="' + idx + ':medicationGroup" required' + (colRo ? ' disabled' : '') + '>' +
            '<option value=""' + (missingGroup ? ' selected' : '') + '>-- Chọn nhóm thuốc (bắt buộc) --</option>' +
            '<option value="prescribed"' + (m.medicationGroup === 'prescribed' ? ' selected' : '') + '>Thuốc kê đơn</option>' +
            '<option value="otc_supplement_tcm"' + (m.medicationGroup === 'otc_supplement_tcm' ? ' selected' : '') + '>Thuốc không kê đơn / TPCN / YHCT</option>' +
          '</select>' +
          (missingGroup && !colRo ? '<p class="field__error" data-med-group-required="true">' + ICONS.alert + ' Bắt buộc chọn nhóm thuốc trước khi lưu nháp.</p>' : '') +
          '</div>';
        }
        if (col.path === 'status') {
          return '<div class="field"><label class="field__label">' + lbl + '</label><select class="select" data-' + prefix + 'med-field="' + idx + ':status"' + (colRo ? ' disabled' : '') + '>' +
            '<option value=""' + (!m.status ? ' selected' : '') + '>-- Chưa chọn --</option>' +
            '<option value="active"' + (m.status === 'active' ? ' selected' : '') + '>Đang dùng</option>' +
            '<option value="stopped"' + (m.status === 'stopped' ? ' selected' : '') + '>Đã ngưng</option>' +
            '<option value="proposed"' + (m.status === 'proposed' ? ' selected' : '') + '>Dự kiến</option>' +
          '</select></div>';
        }
        if (col.path === 'route') {
          return '<div class="field"><label class="field__label">' + lbl + '</label><select class="select" data-' + prefix + 'med-field="' + idx + ':route"' + (colRo ? ' disabled' : '') + '>' +
            '<option value=""' + (!m.route ? ' selected' : '') + '>-- Chưa chọn --</option>' +
            '<option value="oral"' + (m.route === 'oral' ? ' selected' : '') + '>Uống</option>' +
            '<option value="iv"' + (m.route === 'iv' ? ' selected' : '') + '>Tĩnh mạch</option>' +
            '<option value="subcutaneous"' + (m.route === 'subcutaneous' ? ' selected' : '') + '>Tiêm dưới da</option>' +
            '<option value="inhaled"' + (m.route === 'inhaled' ? ' selected' : '') + '>Hít / Xịt</option>' +
            '<option value="other"' + (m.route === 'other' ? ' selected' : '') + '>Khác</option>' +
          '</select></div>';
        }
        if (col.path === 'dose') {
          return '<div class="field"><label class="field__label">' + lbl + '</label><input type="number" step="any" class="input" data-' + prefix + 'med-field="' + idx + ':dose" value="' + esc(m.dose != null ? m.dose : '') + '"' + (colRo ? ' disabled' : '') + '></div>';
        }
        if (col.path === 'startedAt') {
          return '<div class="field"><label class="field__label">' + lbl + '</label><input type="date" class="input" data-' + prefix + 'med-field="' + idx + ':startedAt" value="' + esc(m.startedAt || '') + '"' + (colRo ? ' disabled' : '') + '></div>';
        }
        const phMap = { drugName: 'VD: Sacubitril/Valsartan', unit: 'mg, viên...', frequency: '1 lần/ngày', activeIngredient: 'VD: Bisoprolol', strength: 'VD: 50mg', note: 'Ghi chú...' };
        return '<div class="field"><label class="field__label">' + lbl + '</label><input type="text" class="input" data-' + prefix + 'med-field="' + idx + ':' + esc(col.path) + '" value="' + esc(m[col.path] || '') + '" placeholder="' + esc(phMap[col.path] || '') + '"' + (colRo ? ' disabled' : '') + '></div>';
      }

      const repeatCodes = entries.map(function (e) { return e.fd.code; }).concat(['thuoc_ghi_nhan', 'thuoc_muc_do_tuan_thu', 'so_luong_thuoc_dong_thoi', 'co_da_thuoc', 'medication_list_state', 'medicationListState', 'medications']).join(',');
      const errText = (ctx.fieldErrors && (ctx.fieldErrors.thuoc_ghi_nhan || ctx.fieldErrors.medication_list_state || ctx.fieldErrors.medicationListState || ctx.fieldErrors.medications)) || '';
      const hasExplicitListStateField = (ctx.sections || []).some(function (s) {
        return (s.fields || []).some(function (f) { return f.isVisible && f.fieldCode === 'medication_list_state'; });
      });
      const emptyMsg = showListStates && listState === 'none'
        ? 'Bác sĩ đã xác nhận người bệnh hiện KHÔNG sử dụng thuốc nào.'
        : (showListStates && listState === 'known'
            ? 'Đã chọn "Có dùng thuốc" — vui lòng bấm "+ Thêm thuốc đang dùng" để ghi nhận ít nhất 1 dòng.'
            : 'Chưa ghi nhận thuốc nào trong lượt khám này (không suy thành không dùng thuốc).');

      return (
        '<div class="section-chunk" data-repeat-group="medications" data-repeat-codes="' + esc(repeatCodes) + '" data-field-code="' + esc(primary.fd.code) + '">' +
          '<div class="sub-heading">' + esc(headingLabel) + (anyRequired ? '<span class="sub-heading__meta"><span class="badge badge--warn badge--xs">Bắt buộc</span></span>' : '') + '</div>' +
          (helpText ? '<p class="field__help" style="margin-bottom:8px;">' + esc(helpText) + '</p>' : '') +
          (!hasExplicitListStateField ? renderListStateBar('medications', listState, 'Trạng thái danh sách thuốc', blockRo) : '') +
          (errText ? '<p class="field__error" style="margin-bottom:8px;">' + ICONS.alert + ' ' + esc(errText) + '</p>' : '') +
          '<div class="repeat-list">' +
            (meds.length === 0 ? '<p class="field__help">' + esc(emptyMsg) + '</p>' : meds.map(function (m, idx) {
              const incomplete = !isValidMedRow(m) || !m.medicationGroup;
              return (
                '<div class="repeat-card' + (incomplete ? ' repeat-card--incomplete' : '') + '">' +
                  '<div class="repeat-card__head">' +
                    '<span class="repeat-card__title">Thuốc #' + (idx + 1) + (m.drugName ? ' — ' + esc(m.drugName) : '') + (incomplete ? ' <span class="badge badge--warn badge--xs">Chưa hoàn tất</span>' : '') + '</span>' +
                    (canMutateRows ? '<button type="button" class="btn btn--danger-outline btn--sm" data-' + prefix + 'remove-med="' + idx + '">' + ICONS.trash + ' Xóa</button>' : '') +
                  '</div>' +
                  '<div class="form-grid-3">' +
                    cols.map(function (col) { return renderMedCol(col, m, idx); }).join('') +
                  '</div>' +
                '</div>'
              );
            }).join('')) +
            (canMutateRows && (!showListStates || listState !== 'none') ? '<div><button type="button" class="btn btn--secondary btn--sm" data-' + prefix + 'add-med="1">' + ICONS.plus + ' Thêm thuốc đang dùng</button></div>' : '') +
          '</div>' +
        '</div>'
      );
    }

    function renderAllergiesBlock(entries) {
      const algs = ctx.allergies || [];
      const listState = ctx.allergyListState || (algs.length > 0 ? 'known' : 'unknown');
      const primary = entries[0];
      const headingLabel = entries.length === 1 ? getFieldLabel(primary.ff, primary.fd) : 'Tiền sử Dị ứng / Phản ứng có hại thuốc (ADR)';
      const anyRequired = entries.some(function (e) { return e.ff.requiredForConfirm; });
      const helpText = joinUniqueHelpTexts(entries);
      const hasAnyErr = entries.some(function (e) { return Boolean(ctx.fieldErrors && ctx.fieldErrors[e.fd.code]); }) || Boolean(ctx.fieldErrors && ctx.fieldErrors.allergyListState);

      if (filter === 'error' && !hasAnyErr) return '';
      if (filter === 'unfilled' && (algs.some(isValidAllergyRow) || listState === 'none') && !q) return '';
      if (q) {
        const hit = ('dị ứng adr phản ứng ' + headingLabel.toLowerCase()).indexOf(q) >= 0 || entries.some(function (e) {
          return getFieldLabel(e.ff, e.fd).toLowerCase().indexOf(q) >= 0 || e.fd.code.toLowerCase().indexOf(q) >= 0;
        });
        if (!hit) return '';
      }

      const defaultAlgCols = [
        { path: 'allergen', label: 'Tác nhân *' },
        { path: 'kind', label: 'Loại phản ứng' },
        { path: 'agentCategory', label: 'Nhóm tác nhân' },
        { path: 'severity', label: 'Mức độ' },
        { path: 'reaction', label: 'Biểu hiện lâm sàng', span2: true }
      ];
      const isGranular = entries.length > 1;
      const cols = isGranular
        ? entries.map(function (e) {
            return {
              path: e.rep.memberPath || e.fd.code,
              label: getFieldLabel(e.ff, e.fd),
              required: Boolean(e.ff.requiredForConfirm),
              readonly: Boolean(ro || e.ff.isReadonly),
              span2: e.rep.memberPath === 'reaction'
            };
          })
        : defaultAlgCols.map(function (c) {
            return {
              path: c.path,
              label: c.path === 'allergen' && primary.ff.customLabelVi ? primary.ff.customLabelVi : c.label,
              required: c.path === 'allergen' && Boolean(primary.ff.requiredForConfirm),
              readonly: Boolean(ro || primary.ff.isReadonly),
              span2: Boolean(c.span2)
            };
          });
      const blockRo = ro || (cols.length > 0 && cols.every(function (c) { return c.readonly; }));
      const canMutateRows = !blockRo && !cols.some(function (c) { return c.path === 'allergen' && c.readonly; });

      function renderAlgCol(col, a, idx) {
        const colRo = Boolean(ro || col.readonly);
        const reqBadge = col.required ? ' <span class="badge badge--warn badge--xs">Bắt buộc</span>' : '';
        const lbl = esc(col.label) + reqBadge;
        const wrapCls = 'field' + (col.span2 ? ' field--span-2' : '');
        if (col.path === 'kind') {
          return '<div class="' + wrapCls + '"><label class="field__label">' + lbl + '</label><select class="select" data-' + prefix + 'allergy-field="' + idx + ':kind"' + (colRo ? ' disabled' : '') + '>' +
            '<option value="allergy"' + (a.kind === 'allergy' ? ' selected' : '') + '>Dị ứng</option>' +
            '<option value="adr"' + (a.kind === 'adr' ? ' selected' : '') + '>Phản ứng có hại (ADR)</option>' +
            '<option value="intolerance"' + (a.kind === 'intolerance' ? ' selected' : '') + '>Không dung nạp</option>' +
          '</select></div>';
        }
        if (col.path === 'agentCategory') {
          return '<div class="' + wrapCls + '"><label class="field__label">' + lbl + '</label><select class="select" data-' + prefix + 'allergy-field="' + idx + ':agentCategory"' + (colRo ? ' disabled' : '') + '>' +
            '<option value="therapeutic_drug"' + (a.agentCategory === 'therapeutic_drug' ? ' selected' : '') + '>Thuốc điều trị</option>' +
            '<option value="contrast_media"' + (a.agentCategory === 'contrast_media' ? ' selected' : '') + '>Thuốc cản quang</option>' +
            '<option value="other"' + (a.agentCategory === 'other' ? ' selected' : '') + '>Khác</option>' +
          '</select></div>';
        }
        if (col.path === 'severity') {
          return '<div class="' + wrapCls + '"><label class="field__label">' + lbl + '</label><select class="select" data-' + prefix + 'allergy-field="' + idx + ':severity"' + (colRo ? ' disabled' : '') + '>' +
            '<option value="unknown"' + (a.severity === 'unknown' ? ' selected' : '') + '>Chưa rõ</option>' +
            '<option value="mild"' + (a.severity === 'mild' ? ' selected' : '') + '>Nhẹ</option>' +
            '<option value="moderate"' + (a.severity === 'moderate' ? ' selected' : '') + '>Trung bình</option>' +
            '<option value="severe"' + (a.severity === 'severe' ? ' selected' : '') + '>Nặng</option>' +
          '</select></div>';
        }
        if (col.path === 'recordedAt') {
          return '<div class="' + wrapCls + '"><label class="field__label">' + lbl + '</label><input type="datetime-local" class="input" data-' + prefix + 'allergy-field="' + idx + ':recordedAt" value="' + esc(toDatetimeLocal(a.recordedAt)) + '"' + (colRo ? ' disabled' : '') + '></div>';
        }
        const ph = col.path === 'allergen' ? 'VD: Thuốc cản quang iod, Penicillin' : 'VD: Mày đay, phù mạch, ho khan...';
        return '<div class="' + wrapCls + '"><label class="field__label">' + lbl + '</label><input type="text" class="input" data-' + prefix + 'allergy-field="' + idx + ':' + esc(col.path) + '" value="' + esc(a[col.path] || '') + '" placeholder="' + esc(ph) + '"' + (colRo ? ' disabled' : '') + '></div>';
      }

      const repeatCodes = entries.map(function (e) { return e.fd.code; }).concat(['di_ung_adr', 'allergy_list_state', 'allergyListState', 'allergies']).join(',');
      const errText = (ctx.fieldErrors && (ctx.fieldErrors.di_ung_adr || ctx.fieldErrors.allergy_list_state || ctx.fieldErrors.allergyListState || ctx.fieldErrors.allergies)) || '';
      const hasExplicitListStateField = (ctx.sections || []).some(function (s) {
        return (s.fields || []).some(function (f) { return f.isVisible && f.fieldCode === 'allergy_list_state'; });
      });
      const emptyMsg = showListStates && listState === 'none'
        ? 'Bác sĩ đã xác nhận người bệnh KHÔNG có tiền sử dị ứng / ADR thuốc.'
        : (showListStates && listState === 'known'
            ? 'Đã chọn "Có dị ứng / ADR" — vui lòng bấm "+ Thêm bản ghi dị ứng / ADR" để ghi nhận ít nhất 1 dòng.'
            : 'Chưa ghi nhận dị ứng hoặc ADR nào (không suy thành không dị ứng).');

      return (
        '<div class="section-chunk" data-repeat-group="allergies" data-repeat-codes="' + esc(repeatCodes) + '" data-field-code="' + esc(primary.fd.code) + '">' +
          '<div class="sub-heading">' + esc(headingLabel) + (anyRequired ? '<span class="sub-heading__meta"><span class="badge badge--warn badge--xs">Bắt buộc</span></span>' : '') + '</div>' +
          (helpText ? '<p class="field__help" style="margin-bottom:8px;">' + esc(helpText) + '</p>' : '') +
          (!hasExplicitListStateField ? renderListStateBar('allergies', listState, 'Trạng thái danh sách dị ứng / ADR', blockRo) : '') +
          (errText ? '<p class="field__error" style="margin-bottom:8px;">' + ICONS.alert + ' ' + esc(errText) + '</p>' : '') +
          '<div class="repeat-list">' +
            (algs.length === 0 ? '<p class="field__help">' + esc(emptyMsg) + '</p>' : algs.map(function (a, idx) {
              const incomplete = !isValidAllergyRow(a);
              return (
                '<div class="repeat-card' + (incomplete ? ' repeat-card--incomplete' : '') + '">' +
                  '<div class="repeat-card__head">' +
                    '<span class="repeat-card__title">Dị ứng / ADR #' + (idx + 1) + (a.allergen ? ' — ' + esc(a.allergen) : '') + (incomplete ? ' <span class="badge badge--warn badge--xs">Chưa hoàn tất</span>' : '') + '</span>' +
                    (canMutateRows ? '<button type="button" class="btn btn--danger-outline btn--sm" data-' + prefix + 'remove-allergy="' + idx + '">' + ICONS.trash + ' Xóa</button>' : '') +
                  '</div>' +
                  '<div class="form-grid-3">' +
                    cols.map(function (col) { return renderAlgCol(col, a, idx); }).join('') +
                  '</div>' +
                '</div>'
              );
            }).join('')) +
            (canMutateRows && (!showListStates || listState !== 'none') ? '<div><button type="button" class="btn btn--secondary btn--sm" data-' + prefix + 'add-allergy="1">' + ICONS.plus + ' Thêm bản ghi dị ứng / ADR</button></div>' : '') +
          '</div>' +
        '</div>'
      );
    }

    function renderDiagnosesBlock(entries) {
      const dxs = ctx.diagnoses || [];
      const listState = ctx.diagnosisListState || (dxs.length > 0 ? 'known' : 'unknown');
      const anyRequired = entries.some(function (e) { return e.ff.requiredForConfirm; });
      const helpText = joinUniqueHelpTexts(entries);
      const hasAnyErr = entries.some(function (e) { return Boolean(ctx.fieldErrors && ctx.fieldErrors[e.fd.code]); }) || Boolean(ctx.fieldErrors && (ctx.fieldErrors.diagnoses || ctx.fieldErrors.diagnosisListState));

      if (filter === 'error' && !hasAnyErr) return '';
      if (filter === 'unfilled' && (dxs.some(isValidDiagnosisRow) || listState === 'none') && !q) return '';
      if (q) {
        const hit = 'icd chẩn đoán chính phụ mã bệnh'.indexOf(q) >= 0 || entries.some(function (e) {
          return getFieldLabel(e.ff, e.fd).toLowerCase().indexOf(q) >= 0 || e.fd.code.toLowerCase().indexOf(q) >= 0;
        });
        if (!hit) return '';
      }

      const cols = entries.map(function (e) {
        return {
          path: e.rep.memberPath || (e.fd.code === 'icd_code' ? 'code' : (e.fd.code === 'icd_display' ? 'display' : 'role')),
          label: getFieldLabel(e.ff, e.fd),
          required: Boolean(e.ff.requiredForConfirm),
          readonly: Boolean(ro || e.ff.isReadonly),
          code: e.fd.code
        };
      });
      const blockRo = ro || (cols.length > 0 && cols.every(function (c) { return c.readonly; }));
      const canMutateRows = !blockRo && !cols.some(function (c) { return c.path === 'code' && c.readonly; });
      const hasPrimary = dxs.some(function (d) { return d && d.role === 'primary'; });
      const repeatCodes = entries.map(function (e) { return e.fd.code; }).concat(['diagnosis_list_state', 'diagnosisListState', 'diagnoses']).join(',');
      const errText = (ctx.fieldErrors && (ctx.fieldErrors.diagnoses || ctx.fieldErrors.icd_code || ctx.fieldErrors.icd_display || ctx.fieldErrors.icd_role || ctx.fieldErrors.diagnosis_list_state || ctx.fieldErrors.diagnosisListState)) || '';
      const hasExplicitListStateField = (ctx.sections || []).some(function (s) {
        return (s.fields || []).some(function (f) { return f.isVisible && f.fieldCode === 'diagnosis_list_state'; });
      });
      const emptyMsg = listState === 'none'
        ? 'Bác sĩ đã xác nhận chưa có mã chẩn đoán ICD ghi nhận.'
        : (listState === 'known'
            ? 'Đã chọn "Có mã ICD" — vui lòng bấm "+ Thêm ICD chính" hoặc "+ Thêm ICD phụ".'
            : 'Chưa ghi nhận mã chẩn đoán ICD-10 (tối đa 1 ICD chính, nhiều ICD phụ).');

      function renderDxCol(col, d, idx) {
        const colRo = Boolean(ro || col.readonly);
        const reqBadge = col.required ? ' <span class="badge badge--warn badge--xs">Bắt buộc</span>' : '';
        const lbl = esc(col.label) + reqBadge;
        if (col.path === 'role') {
          return (
            '<div class="field" data-field-code="' + esc(col.code) + '"><label class="field__label">' + lbl + '</label>' +
              '<select class="select" data-' + prefix + 'dx-field="' + idx + ':role"' + (colRo ? ' disabled' : '') + '>' +
                '<option value="primary"' + (d.role === 'primary' ? ' selected' : '') + '>ICD chính</option>' +
                '<option value="secondary"' + (d.role !== 'primary' ? ' selected' : '') + '>ICD phụ</option>' +
              '</select>' +
            '</div>'
          );
        }
        if (col.path === 'code') {
          const badFmt = d.code && !isValidIcd10Format(d.code);
          const unverified = d.verified === false || d.catalogStatus === 'unverified';
          return (
            '<div class="field" data-field-code="' + esc(col.code) + '"><label class="field__label">' + lbl + '</label>' +
              '<input type="text" class="input mono' + (badFmt ? ' input--error' : '') + '" data-' + prefix + 'dx-field="' + idx + ':code" value="' + esc(d.code || '') + '" placeholder="VD: I50.9, E11.9"' + (colRo ? ' disabled' : '') + '>' +
              (badFmt ? '<p class="field__error">' + ICONS.alert + ' Định dạng ICD-10: 1 chữ + 2 số, tùy chọn dấu chấm + 1–4 ký tự (VD: I50.9).</p>' : '') +
              (unverified ? '<span class="badge badge--warn badge--xs">Chưa xác minh trong danh mục bệnh viện</span>' : '') +
            '</div>'
          );
        }
        return (
          '<div class="field" data-field-code="' + esc(col.code) + '"><label class="field__label">' + lbl + '</label>' +
            '<input type="text" class="input" data-' + prefix + 'dx-field="' + idx + ':display" value="' + esc(d.display || '') + '" placeholder="VD: Suy tim không đặc hiệu"' + (colRo ? ' disabled' : '') + '>' +
          '</div>'
        );
      }

      return (
        '<div class="section-chunk" data-repeat-group="diagnoses" data-repeat-codes="' + esc(repeatCodes) + '" data-field-code="icd_code">' +
          '<div class="sub-heading">Chẩn đoán ICD-10 (ICD chính &amp; các ICD phụ)' + (anyRequired ? '<span class="sub-heading__meta"><span class="badge badge--warn badge--xs">Bắt buộc</span></span>' : '') + '</div>' +
          (helpText ? '<p class="field__help" style="margin-bottom:8px;">' + esc(helpText) + '</p>' : '') +
          (!hasExplicitListStateField ? renderListStateBar('diagnoses', listState, 'Trạng thái danh sách chẩn đoán ICD-10', blockRo) : '') +
          (errText ? '<p class="field__error" style="margin-bottom:8px;">' + ICONS.alert + ' ' + esc(errText) + '</p>' : '') +
          '<div class="repeat-list">' +
            (dxs.length === 0 ? '<p class="field__help">' + esc(emptyMsg) + '</p>' : dxs.map(function (d, idx) {
              const incomplete = !isValidDiagnosisRow(d);
              const isPrimary = d.role === 'primary';
              return (
                '<div class="repeat-card' + (incomplete ? ' repeat-card--incomplete' : '') + '">' +
                  '<div class="repeat-card__head">' +
                    '<span class="repeat-card__title">' +
                      '<span class="badge ' + (isPrimary ? 'badge--blue' : 'badge--neutral') + ' badge--xs">' + (isPrimary ? 'ICD chính' : 'ICD phụ') + '</span> ' +
                      (d.code ? '<span class="mono">' + esc(d.code) + '</span>' : 'Chẩn đoán #' + (idx + 1)) +
                      (d.display ? ' — ' + esc(d.display) : '') +
                      (incomplete ? ' <span class="badge badge--warn badge--xs">Chưa hoàn tất</span>' : '') +
                    '</span>' +
                    (canMutateRows ? '<button type="button" class="btn btn--danger-outline btn--sm" data-' + prefix + 'remove-dx="' + idx + '">' + ICONS.trash + ' Xóa</button>' : '') +
                  '</div>' +
                  '<div class="form-grid-3">' +
                    cols.map(function (col) { return renderDxCol(col, d, idx); }).join('') +
                  '</div>' +
                '</div>'
              );
            }).join('')) +
            (canMutateRows && listState !== 'none' ? (
              '<div style="display:flex;gap:8px;flex-wrap:wrap;">' +
                (!hasPrimary ? '<button type="button" class="btn btn--secondary btn--sm" data-' + prefix + 'add-dx="primary">' + ICONS.plus + ' Thêm ICD chính</button>' : '') +
                '<button type="button" class="btn btn--secondary btn--sm" data-' + prefix + 'add-dx="secondary">' + ICONS.plus + ' Thêm ICD phụ</button>' +
              '</div>'
            ) : '') +
          '</div>' +
        '</div>'
      );
    }

    function renderLabsBlock(visibleLabEntries) {
      const labs = ctx.labResults || [];
      // Dropdown options come STRICTLY from visible placements in THIS form version's section (respecting displayOrder & customLabelVi)
      const selectableLabs = visibleLabEntries.filter(function (e) { return !isLabMetadataColumnCode(e.fd); });
      if (selectableLabs.length === 0) return '';

      const metaByCode = {};
      visibleLabEntries.forEach(function (e) {
        if (isLabMetadataColumnCode(e.fd)) metaByCode[e.fd.code] = e;
      });
      const selectableByCode = {};
      selectableLabs.forEach(function (e) { selectableByCode[e.fd.code] = e; });

      const hasAnyErr = visibleLabEntries.some(function (e) { return Boolean(ctx.fieldErrors && ctx.fieldErrors[e.fd.code]); }) || Boolean(ctx.fieldErrors && ctx.fieldErrors.can_lam_sang);
      if (filter === 'error' && !hasAnyErr) return '';
      if (filter === 'unfilled' && labs.some(function (l) { return isValidLabRow(l, ctx.defByCode); }) && !q) return '';
      if (q) {
        const hit = 'cận lâm sàng xét nghiệm bnp creatinin siêu âm ecg'.indexOf(q) >= 0 || selectableLabs.some(function (e) {
          return getFieldLabel(e.ff, e.fd).toLowerCase().indexOf(q) >= 0 || e.fd.code.toLowerCase().indexOf(q) >= 0;
        });
        if (!hit) return '';
      }

      const unitMeta = metaByCode.cls_result_unit || metaByCode.cls_don_vi;
      const timeMeta = metaByCode.cls_result_measured_at || metaByCode.cls_thoi_diem;
      const troponinTypeMeta = metaByCode.cls_troponin_loai;
      const unitColLabel = unitMeta ? getFieldLabel(unitMeta.ff, unitMeta.fd) : 'Đơn vị';
      const timeColLabel = timeMeta ? getFieldLabel(timeMeta.ff, timeMeta.fd) : 'Thời điểm lấy mẫu / thực hiện *';
      const requiredLabs = selectableLabs.filter(function (e) { return e.ff.requiredForConfirm; });
      const allLabsReadonly = selectableLabs.every(function (e) { return Boolean(e.ff.isReadonly); });
      const blockRo = ro || allLabsReadonly;
      const repeatCodes = visibleLabEntries.map(function (e) { return e.fd.code; }).concat([
        'cls_don_vi', 'cls_thoi_diem', 'cls_ecg_thoi_diem', 'cls_sieu_am_tim_thoi_diem',
        'cls_xquang_thoi_diem', 'cls_troponin_loai', 'cls_result_unit', 'cls_result_measured_at',
        'thay_doi_bnp_ntprobnp_ef', 'can_lam_sang'
      ]).join(',');

      return (
        '<div class="section-chunk" data-repeat-group="labResults" data-repeat-codes="' + esc(repeatCodes) + '" data-field-code="can_lam_sang">' +
          '<div class="sub-heading">Kết quả Cận lâm sàng đã có' + (requiredLabs.length > 0 ? '<span class="sub-heading__meta"><span class="badge badge--warn badge--xs">Có ' + requiredLabs.length + ' xét nghiệm bắt buộc</span></span>' : '') + '</div>' +
          (requiredLabs.length > 0 ? '<p class="field__help" style="margin-bottom:8px;">Bắt buộc khi xác nhận: ' + esc(requiredLabs.map(function (e) { return getFieldLabel(e.ff, e.fd); }).join(', ')) + '.</p>' : '') +
          '<div class="repeat-list">' +
            (labs.length === 0 ? '<p class="field__help">Chưa có kết quả cận lâm sàng nào được ghi nhận trong lượt khám này.</p>' : labs.map(function (lab, idx) {
              const curEntry = lab.labCode ? selectableByCode[lab.labCode] : null;
              const curDef = curEntry ? curEntry.fd : (lab.labCode ? ctx.defByCode[lab.labCode] : null);
              const curLabel = curEntry ? getFieldLabel(curEntry.ff, curEntry.fd) : (curDef ? curDef.labelVi : (lab.labCode || ''));
              const curHelp = curEntry ? getFieldHelpText(curEntry.ff, curEntry.fd) : '';
              const isNumericLab = curDef && (curDef.dataType === 'number' || curDef.dataType === 'integer');
              const isCbcPanel = curDef && curDef.code === 'cls_cong_thuc_mau';
              const incomplete = !isValidLabRow(lab, ctx.defByCode);
              const rowErr = (lab.labCode && ctx.fieldErrors && ctx.fieldErrors[lab.labCode]) || '';
              const rowRo = Boolean(blockRo || (curEntry && curEntry.ff.isReadonly));
              const unitRo = Boolean(rowRo || (unitMeta && unitMeta.ff.isReadonly));
              const timeRo = Boolean(rowRo || (timeMeta && timeMeta.ff.isReadonly));
              const subtypeRo = Boolean(rowRo || (troponinTypeMeta && troponinTypeMeta.ff.isReadonly));

              let optHtml = '<option value="">-- Chọn loại xét nghiệm / thăm dò --</option>' + selectableLabs.map(function (e) {
                const optLabel = getFieldLabel(e.ff, e.fd) + (e.ff.requiredForConfirm ? ' *' : '');
                return '<option value="' + esc(e.fd.code) + '"' + (e.fd.code === lab.labCode ? ' selected' : '') + '>' + esc(optLabel) + '</option>';
              }).join('');
              // Preserve historical saved row code if that lab was hidden in a later edit
              if (lab.labCode && !curEntry && curDef) {
                optHtml += '<option value="' + esc(curDef.code) + '" selected>' + esc(curDef.labelVi) + ' (đã ẩn)</option>';
              }

              const showTroponinSubtype = curDef && curDef.code === 'cls_troponin' && troponinTypeMeta && troponinTypeMeta.fd && (troponinTypeMeta.fd.options || []).length > 0;
              const subtypeFieldHtml = showTroponinSubtype
                ? (
                    '<div class="field" data-field-code="cls_troponin_loai"><label class="field__label">' + esc(getFieldLabel(troponinTypeMeta.ff, troponinTypeMeta.fd)) + '</label>' +
                      '<select class="select" data-' + prefix + 'lab-field="' + idx + ':labSubtype"' + (subtypeRo ? ' disabled' : '') + '>' +
                        '<option value="">-- Chọn loại Troponin --</option>' +
                        (troponinTypeMeta.fd.options || []).map(function (o) {
                          return '<option value="' + esc(o.optionCode) + '"' + (lab.labSubtype === o.optionCode ? ' selected' : '') + '>' + esc(o.labelVi) + '</option>';
                        }).join('') +
                      '</select>' +
                    '</div>' +
                    '<div class="field"><label class="field__label">Ghi chú nguồn / mẫu xét nghiệm</label><input type="text" class="input" data-' + prefix + 'lab-field="' + idx + ':note" value="' + esc(lab.note || '') + '"' + (rowRo ? ' disabled' : '') + '></div>'
                  )
                : '<div class="field field--span-2"><label class="field__label">Ghi chú nguồn / loại phụ (VD: hs-TnT)</label><input type="text" class="input" data-' + prefix + 'lab-field="' + idx + ':note" value="' + esc(lab.note || '') + '"' + (rowRo ? ' disabled' : '') + '></div>';

              return (
                '<div class="repeat-card' + (incomplete ? ' repeat-card--incomplete' : '') + '" data-field-code="' + esc(lab.labCode || 'can_lam_sang') + '">' +
                  '<div class="repeat-card__head">' +
                    '<span class="repeat-card__title">Cận lâm sàng #' + (idx + 1) + (curLabel ? ' — ' + esc(curLabel) : '') + (incomplete ? ' <span class="badge badge--warn badge--xs">Chưa hoàn tất</span>' : '') + '</span>' +
                    (!rowRo ? '<button type="button" class="btn btn--danger-outline btn--sm" data-' + prefix + 'remove-lab="' + idx + '">' + ICONS.trash + ' Xóa</button>' : '') +
                  '</div>' +
                  '<div class="form-grid-3">' +
                    '<div class="field"><label class="field__label">Loại xét nghiệm / thăm dò *</label><select class="select" data-' + prefix + 'lab-field="' + idx + ':labCode"' + (rowRo ? ' disabled' : '') + '>' + optHtml + '</select></div>' +
                    (!curDef
                      ? '<div class="field field--span-2"><label class="field__label">Giá trị kết quả</label><input type="text" class="input" placeholder="Vui lòng chọn loại xét nghiệm trước..." disabled></div>'
                      : (isNumericLab
                        ? ('<div class="field"><label class="field__label">Giá trị số *</label><input type="number" step="any" class="input" data-' + prefix + 'lab-field="' + idx + ':valueNum" value="' + esc(lab.valueNum != null ? lab.valueNum : '') + '"' + (rowRo ? ' disabled' : '') + '></div>' +
                           '<div class="field"><label class="field__label">' + esc(unitColLabel) + '</label><input type="text" class="input" data-' + prefix + 'lab-field="' + idx + ':unit" value="' + esc(lab.unit || (curDef && curDef.canonicalUnit) || '') + '"' + (unitRo ? ' disabled' : '') + '></div>')
                        : (isCbcPanel
                            ? '<div class="field field--span-2"><label class="field__label">Kết quả công thức máu (các chỉ số kèm đơn vị) *</label><textarea class="textarea" data-' + prefix + 'lab-field="' + idx + ':valueText" placeholder="VD: Hb 118 g/L, Hct 36%, WBC 7.2 G/L, PLT 230 G/L..."' + (rowRo ? ' disabled' : '') + '>' + esc(lab.valueText || '') + '</textarea></div>'
                            : '<div class="field field--span-2"><label class="field__label">Kết quả / Kết luận mô tả *</label><input type="text" class="input" data-' + prefix + 'lab-field="' + idx + ':valueText" value="' + esc(lab.valueText || '') + '" placeholder="Nhập kết quả đọc ECG / X-quang / Siêu âm tim / chức năng gan..."' + (rowRo ? ' disabled' : '') + '></div>'))) +
                    '<div class="field"><label class="field__label">' + esc(timeColLabel) + '</label><input type="datetime-local" class="input" data-' + prefix + 'lab-field="' + idx + ':measuredAt" value="' + esc(lab.measuredAt ? toDatetimeLocal(lab.measuredAt) : '') + '"' + (timeRo ? ' disabled' : '') + '></div>' +
                    subtypeFieldHtml +
                  '</div>' +
                  (curHelp ? '<p class="field__help">' + esc(curHelp) + '</p>' : '') +
                  (rowErr ? '<p class="field__error">' + ICONS.alert + ' ' + esc(rowErr) + '</p>' : '') +
                '</div>'
              );
            }).join('')) +
            (!blockRo ? '<div><button type="button" class="btn btn--secondary btn--sm" data-' + prefix + 'add-lab="1">' + ICONS.plus + ' Thêm kết quả cận lâm sàng</button></div>' : '') +
          '</div>' +
        '</div>'
      );
    }

    function renderOneSection(section) {
      const sortedFields = sortByDisplayOrder(section.fields || []);
      const allEntries = sortedFields.map(function (ff) {
        const fd = ctx.defById[ff.fieldDefinitionId];
        return fd ? { ff: ff, fd: fd, rep: getFieldRepeatInfo(fd) } : null;
      }).filter(Boolean);

      // Collect visible repeating entries per group (preserving displayOrder)
      const visibleByGroup = {};
      const allByGroup = {};
      allEntries.forEach(function (entry) {
        if (!entry.rep) return;
        const g = entry.rep.group;
        allByGroup[g] = allByGroup[g] || [];
        allByGroup[g].push(entry);
        if (entry.ff.isVisible) {
          visibleByGroup[g] = visibleByGroup[g] || [];
          visibleByGroup[g].push(entry);
        }
      });

      // Walk placements in exact displayOrder so scalar chunks & repeating blocks stay synchronized with Editor
      const chunks = [];
      let pendingScalars = [];
      const emittedGroups = {};

      function flushScalars() {
        if (pendingScalars.length === 0) return;
        const cardsHtml = pendingScalars.map(function (e) { return renderSingleField(e.ff); }).join('');
        if (cardsHtml) {
          chunks.push('<div class="section-chunk"><div class="form-grid-2">' + cardsHtml + '</div></div>');
        }
        pendingScalars = [];
      }

      allEntries.forEach(function (entry) {
        if (!entry.ff.isVisible) return;
        if (entry.rep) {
          const g = entry.rep.group;
          if (emittedGroups[g]) return;
          emittedGroups[g] = true;
          flushScalars();

          // In v1.2, diagnoses/medications/allergies are edited via their single structured widgets
          if (isV12Mode && isStructuredListCode(g) && ctx.defByCode && ctx.defByCode[g]) {
            return;
          }

          if (g === 'labResults' && isV12Mode) {
            const visLabs = visibleByGroup[g] || [];
            const timedEntries = visLabs.filter(function (e) { return isTimedLabCode(e.fd.code); });
            const otherEntries = visLabs.filter(function (e) { return !isTimedLabCode(e.fd.code); });
            const timedCards = timedEntries.filter(function (e) {
              if (!fieldMatchesModuleFilter(e.fd.code)) return false;
              const lbl = getFieldLabel(e.ff, e.fd).toLowerCase();
              if (q && lbl.indexOf(q) === -1 && e.fd.code.toLowerCase().indexOf(q) === -1) return false;
              const val = ctx.valuesByDefId[e.fd.id];
              const errMsg = ctx.fieldErrors && ctx.fieldErrors[e.fd.code];
              if (filter === 'unfilled' && val) return false;
              if (filter === 'error' && !errMsg) return false;
              return true;
            }).map(function (e) {
              return renderV12TimedLabField(e.ff, e.fd);
            }).join('');
            if (timedCards) {
              chunks.push(
                '<div class="section-chunk" data-v12-timed-labs="1">' +
                  '<div class="sub-heading">Xét nghiệm / Thăm dò định lượng chính (có thời điểm đo &amp; Chưa rõ)</div>' +
                  '<div class="form-grid-2">' + timedCards + '</div>' +
                '</div>'
              );
            }
            const showOtherLabs = modFilter === 'all' || otherEntries.some(function (e) { return fieldMatchesModuleFilter(e.fd.code); });
            if (showOtherLabs && otherEntries.length > 0) {
              const otherHtml = renderLabsBlock(otherEntries);
              if (otherHtml) chunks.push(otherHtml);
            }
            return;
          }

          if (modFilter !== 'all') {
            const grpMatch = (visibleByGroup[g] || []).some(function (e) { return fieldMatchesModuleFilter(e.fd.code); });
            if (!grpMatch) return;
          }

          let blockHtml = '';
          if (g === 'orthostaticBp') blockHtml = renderOrthostaticBpBlock(visibleByGroup[g] || [], allByGroup[g] || []);
          else if (g === 'medications') blockHtml = renderMedicationsBlock(visibleByGroup[g] || []);
          else if (g === 'allergies') blockHtml = renderAllergiesBlock(visibleByGroup[g] || []);
          else if (g === 'diagnoses') blockHtml = renderDiagnosesBlock(visibleByGroup[g] || []);
          else if (g === 'labResults') blockHtml = renderLabsBlock(visibleByGroup[g] || []);
          if (blockHtml) chunks.push(blockHtml);
          return;
        }

        // Module filter (D4) using API fieldMetadata
        if (!fieldMatchesModuleFilter(entry.fd.code)) return;

        // Scalar / computed / patient / visit field filtering
        const lbl = getFieldLabel(entry.ff, entry.fd).toLowerCase();
        if (q && lbl.indexOf(q) === -1 && entry.fd.code.toLowerCase().indexOf(q) === -1) return;
        const val = ctx.valuesByDefId[entry.fd.id];
        const errMsg = ctx.fieldErrors && ctx.fieldErrors[entry.fd.code];
        const flags = getFieldMetaFlags(entry.ff, entry.fd);
        if (filter === 'unfilled') {
          if (flags.isVisitSystem) {
            const metaText = (entry.fd.memberPath === 'clinicalNote' || entry.fd.code === 'clinical_note') ? ctx.clinicalNote : ctx.infoSource;
            if (metaText && String(metaText).trim()) return;
          } else if (entry.fd.storageLevel === 'visit_value' || entry.fd.code === 'di_ung_thuoc_can_quang') {
            if (val) return;
          }
        }
        if (filter === 'error' && !errMsg) return;
        pendingScalars.push(entry);
      });

      // Legacy v1.0 fallback: if Nhóm 8 does not yet carry info_source / clinical_note placements,
      // render them identically in BOTH Preview and Encounter so all 3 screens stay synchronized!
      if (section.sectionCode === 'ghi_chu' && !bundleHasVisitNotes && modFilter === 'all') {
        const showNotes = filter === 'all' || (filter === 'unfilled' && (!ctx.infoSource || !ctx.clinicalNote));
        const matchQ = !q || 'nguồn cung cấp thông tin lâm sàng ghi chú bác sĩ info_source clinical_note'.indexOf(q) >= 0;
        if (showNotes && matchQ) {
          buildVirtualVisitNoteFields(section).forEach(function (vff) {
            pendingScalars.push({ ff: vff, fd: vff._virtualDef, rep: null });
          });
        }
      }

      flushScalars();

      if ((q || filter !== 'all' || modFilter !== 'all') && chunks.length === 0) {
        return '';
      }

      const secDomId = prefix + 'sec-' + section.sectionCode;
      return (
        '<section class="card clinical-section" id="' + esc(secDomId) + '" data-section-block="' + esc(section.sectionCode) + '">' +
          '<div class="card__header">' +
            '<div><h2 class="card__title">' + String(section.displayOrder).padStart(2, '0') + '. ' + esc(section.titleVi) + '</h2></div>' +
          '</div>' +
          '<div class="card__body">' +
            (chunks.length > 0 ? chunks.join('') : '<p class="field__help">Không có trường hiển thị nào trong nhóm này.</p>') +
          '</div>' +
        '</section>'
      );
    }

    const renderedAll = allSections.map(renderOneSection).filter(Boolean).join('');
    if (!renderedAll) {
      return '<div class="empty-state"><h3 class="empty-state__title">Không tìm thấy trường dữ liệu phù hợp</h3><p class="empty-state__desc">Thử xóa từ khóa tìm kiếm hoặc chọn lại bộ lọc "Tất cả".</p></div>';
    }
    return '<div class="sections-stack">' + renderedAll + '</div>';
  }

  /* ------------------------------------------------------------------------
     M4: Encounter Multi-Group Form
     ------------------------------------------------------------------------ */
  function countSectionProgress(sec, defById, valuesByDefId, enc, defByCode) {
    let filled = 0;
    let total = 0;
    let hasErr = false;
    const seenGroups = {};
    let hasVisitNoteInSec = false;

    (sec.fields || []).forEach(function (ff) {
      if (!ff.isVisible) return;
      const fd = defById[ff.fieldDefinitionId];
      if (!fd) return;
      if (enc.fieldErrors && enc.fieldErrors[fd.code]) hasErr = true;
      const rep = getFieldRepeatInfo(fd);
      if (rep) {
        if (enc.isV12 && isTimedLabCode(fd.code)) {
          total += 1;
          if (valuesByDefId[fd.id]) filled += 1;
          return;
        }
        if (enc.isV12 && (rep.group === 'medications' || rep.group === 'allergies' || rep.group === 'diagnoses')) {
          return;
        }
        if (rep.group === 'labResults' && isLabMetadataColumnCode(fd)) return;
        seenGroups[rep.group] = true;
        return;
      }
      const flags = getFieldMetaFlags(ff, fd);
      if (flags.isListStateField) {
        return;
      }
      if (flags.isVisitNote) {
        hasVisitNoteInSec = true;
        total += 1;
        const txt = (fd.memberPath === 'clinicalNote' || fd.code === 'clinical_note') ? enc.clinicalNote : enc.infoSource;
        if (txt && String(txt).trim()) filled += 1;
        return;
      }
      if (fd.storageLevel === 'visit_value' || fd.code === 'di_ung_thuoc_can_quang' || fd.code === 'thuoc_muc_do_tuan_thu') {
        total += 1;
        if (valuesByDefId[fd.id]) filled += 1;
      }
    });

    if (sec.sectionCode === 'ghi_chu' && !hasVisitNoteInSec && !hasVisitNotesPlacements((enc.formStructure && enc.formStructure.sections) || [], defById)) {
      total += 2;
      if (enc.infoSource && String(enc.infoSource).trim()) filled += 1;
      if (enc.clinicalNote && String(enc.clinicalNote).trim()) filled += 1;
    }
    if (seenGroups.orthostaticBp) {
      total += 1;
      if ((enc.orthostaticBp || []).some(function (b) { return b && b.systolic != null && b.diastolic != null; })) filled += 1;
    }
    if (seenGroups.medications) {
      total += 1;
      if ((enc.medications || []).some(isValidMedRow) || enc.medicationListState === 'none') filled += 1;
    }
    if (seenGroups.allergies) {
      total += 1;
      if ((enc.allergies || []).some(isValidAllergyRow) || enc.allergyListState === 'none') filled += 1;
    }
    if (seenGroups.diagnoses) {
      total += 1;
      if ((enc.diagnoses || []).some(isValidDiagnosisRow) || enc.diagnosisListState === 'none') filled += 1;
    }
    if (seenGroups.labResults) {
      total += 1;
      if ((enc.labResults || []).some(function (l) { return isValidLabRow(l, defByCode || enc.defByCode); })) filled += 1;
    }
    return { filled: filled, total: total, hasErr: hasErr };
  }

  function renderEncounterWorkflowBar(enc) {
    if (!enc.isV12 || !enc.workflowSummary || !enc.workflowSummary.modules) return '';
    const wfSum = enc.workflowSummary;
    const isConf = Boolean(enc.visit && enc.visit.status === 'confirmed');
    const modules = wfSum.modules || {};
    const fieldMeta = enc.fieldMetadata || {};

    const cardsHtml = WF_MODULE_ORDER.map(function (mod) {
      const meta = WF_MODULE_META[mod];
      const ms = modules[mod] || { state: 'locked', attemptCount: 0, missingFieldCodes: [], missingDecisionCodes: [], availableActions: [] };
      const isRunning = Boolean(ms.isRunning || enc.runningModule === mod);
      const st = isRunning ? 'running' : (ms.state || 'locked');
      const actions = Array.isArray(ms.availableActions) ? ms.availableActions : [];
      const missingFields = Array.isArray(ms.missingFieldCodes) ? ms.missingFieldCodes : [];
      const missingDecisions = Array.isArray(ms.missingDecisionCodes) ? ms.missingDecisionCodes : [];

      let icon = ICONS.lock;
      let statusLabel = 'Đã khóa';
      if (st === 'locked') {
        icon = ICONS.lock;
        statusLabel = 'Đã khóa';
      } else if (st === 'needs_input') {
        icon = ICONS.alert;
        statusLabel = 'Cần nhập';
      } else if (st === 'ready') {
        icon = ICONS.play;
        statusLabel = 'Sẵn sàng chạy';
      } else if (st === 'running') {
        icon = '<span class="wf-spinner" aria-hidden="true"></span>';
        statusLabel = 'Đang chạy...';
      } else if (st === 'ran') {
        icon = ICONS.clock;
        statusLabel = 'Chờ duyệt (Lần #' + (ms.attemptCount || 1) + ')';
      } else if (st === 'accepted') {
        icon = ICONS.checkCircle;
        statusLabel = ms.decisionSource === 'manual' ? 'Đã chốt · Tự nhập' : 'Đã chốt · AI';
      } else if (st === 'stale') {
        icon = ICONS.refresh;
        statusLabel = 'Cần chạy lại';
      }

      const canRun = !isConf && !isRunning && !enc.runningModule && (actions.indexOf('run') >= 0 || actions.indexOf('rerun') >= 0);
      const isRerun = actions.indexOf('rerun') >= 0 || (ms.attemptCount > 0 && actions.indexOf('run') >= 0);
      const hasResult = ms.attemptCount > 0 || st === 'ran' || st === 'accepted' || st === 'stale';
      const isExpMissing = enc.expandedMissingMod === mod && missingFields.length > 0;

      const missingBtnHtml = missingFields.length > 0
        ? '<button type="button" class="enc-wf-missing-btn' + (isExpMissing ? ' is-open' : '') + '" data-enc-wf-missing-mod="' + esc(mod) + '" title="Bấm để xem và nhảy tới ô còn thiếu">' +
            'Còn thiếu ' + missingFields.length + ' trường ↗' +
          '</button>'
        : (missingDecisions.length > 0
            ? '<span class="enc-wf-card__note">Chờ chọn đơn thuốc M3</span>'
            : '');

      const runBtnHtml = isRunning
        ? '<button type="button" class="btn btn--primary btn--xs is-loading" disabled>Đang chạy Module ' + meta.num + '...</button>'
        : (canRun
            ? '<button type="button" class="btn btn--primary btn--xs" data-enc-wf-run="' + esc(mod) + '"' + (enc.saving ? ' disabled' : '') + '>' +
                (isRerun ? ICONS.refresh : ICONS.play) + ' ' + (isRerun ? ('Chạy lại Module ' + meta.num) : ('Chạy Module ' + meta.num)) +
              '</button>'
            : '');

      const viewBtnHtml = hasResult
        ? '<button type="button" class="btn btn--secondary btn--xs" data-enc-wf-view="' + esc(mod) + '">Xem kết quả Module ' + meta.num + '</button>'
        : '';

      return (
        '<div class="enc-wf-card enc-wf-card--' + esc(st) + '" data-enc-wf-module="' + esc(mod) + '" data-enc-wf-state="' + esc(st) + '">' +
          '<div class="enc-wf-card__top">' +
            '<span class="enc-wf-card__icon">' + icon + '</span>' +
            '<span class="enc-wf-card__title">' + esc(meta.short) + '</span>' +
            '<span class="enc-wf-card__status">' + esc(statusLabel) + '</span>' +
          '</div>' +
          '<div class="enc-wf-card__actions">' +
            missingBtnHtml +
            runBtnHtml +
            viewBtnHtml +
          '</div>' +
        '</div>'
      );
    }).join('');

    let missingDrawerHtml = '';
    if (enc.expandedMissingMod && modules[enc.expandedMissingMod]) {
      const mMod = enc.expandedMissingMod;
      const mMeta = WF_MODULE_META[mMod] || { num: 1 };
      const mList = modules[mMod].missingFieldCodes || [];
      if (mList.length > 0) {
        missingDrawerHtml =
          '<div class="enc-wf-missing-drawer" data-enc-wf-missing-drawer="' + esc(mMod) + '">' +
            '<div class="enc-wf-missing-drawer__head">' +
              '<span><strong>Module ' + mMeta.num + '</strong> còn thiếu ' + mList.length + ' trường (bấm để nhảy tới ô nhập):</span>' +
              '<button type="button" class="btn btn--ghost btn--xs" data-enc-wf-close-missing="1">Đóng</button>' +
            '</div>' +
            '<div class="ai-missing-chips">' +
              mList.map(function (fc) {
                const resolved = resolveFormFieldCode(fieldMeta, fc);
                const fd = enc.defByCode[resolved] || enc.defByCode[fc];
                const lbl = (fd && fd.labelVi) || AI_ISSUE_DISPLAY_LABELS[resolved] || AI_ISSUE_DISPLAY_LABELS[fc] || resolved;
                return '<button type="button" class="jump-chip jump-chip--info ai-missing-chip" data-enc-wf-jump-missing="' + esc(mMod + ':' + resolved) + '">' + esc(lbl) + ' ↗</button>';
              }).join('') +
            '</div>' +
          '</div>';
      }
    }

    return (
      '<section class="enc-wf-bar" role="region" aria-label="Tiến trình 4 Module">' +
        '<div class="enc-wf-bar__head">' +
          '<div class="enc-wf-bar__title">' +
            '<strong>Tiến trình 4 Module</strong>' +
            (wfSum.completed ? '<span class="badge badge--success badge--xs">Đã hoàn tất workflow</span>' : '') +
            (enc.dirty ? '<span class="badge badge--warn badge--xs">Chưa lưu thay đổi mới nhất</span>' : '') +
          '</div>' +
          '<button type="button" class="btn btn--ghost btn--xs" data-nav="#/visits/' + esc(enc.visit.id) + '/workflow">Mở màn kết quả &amp; quyết định ' + ICONS.arrowRight + '</button>' +
        '</div>' +
        '<div class="enc-wf-bar__grid">' + cardsHtml + '</div>' +
        missingDrawerHtml +
      '</section>'
    );
  }

  async function encRunModuleFromForm(mod) {
    const enc = state.encounter;
    if (!enc.visit || !enc.isV12 || enc.runningModule || enc.saving) return;
    if (enc.visit.status === 'confirmed') return;
    if (enc.dirty) {
      const savedOk = await saveEncounterDraft();
      if (!savedOk || enc.dirty) return;
    }
    const wfSum = enc.workflowSummary;
    const ms = wfSum && wfSum.modules && wfSum.modules[mod];
    const actions = (ms && Array.isArray(ms.availableActions)) ? ms.availableActions : [];
    if (!wfSum || (actions.indexOf('run') < 0 && actions.indexOf('rerun') < 0)) {
      toast('Module ' + wfFormatModuleTitle(mod) + ' chưa sẵn sàng chạy — kiểm tra các trường còn thiếu.', 'warn');
      render();
      return;
    }
    enc.runningModule = mod;
    render();
    try {
      const payload = { module: mod, rowVersion: wfSum.rowVersion };
      const receipt = await api.runWorkflowModule(enc.visit.id, mod, payload, wfSum.rowVersion, makeIdempotencyKey('wf-run-' + mod));
      toast('Đã chạy ' + wfFormatModuleTitle(mod) + (receipt && receipt.attempt ? (' (Lần #' + receipt.attempt + ')') : '') + '.', 'success');
      state.workflow.preferredModuleOnLoad = mod;
      enc.runningModule = null;
      navigate('#/visits/' + enc.visit.id + '/workflow', true);
    } catch (err) {
      enc.runningModule = null;
      if (err && err.status === 401) return handleAuthOrError(err);
      if (err && err.status === 409) {
        toast((err && err.detail) || 'Trạng thái workflow đã thay đổi (409). Đang tải lại...', 'warn');
        await loadEncounter(enc.visit.id);
        return;
      }
      if (err && err.status === 422) {
        const errs = Array.isArray(err.errors) ? err.errors : [];
        if (errs.length > 0) {
          enc.errorList = errs.map(function (e) {
            return Object.assign({}, e, { fieldCode: resolveFormFieldCode(enc.fieldMetadata, e.fieldCode) });
          });
          enc.fieldErrors = {};
          enc.errorList.forEach(function (e) { enc.fieldErrors[e.fieldCode] = e.message; });
        }
        toast((err && err.detail) || 'Chưa đủ dữ liệu hợp lệ để chạy ' + wfFormatModuleTitle(mod) + '.', 'error');
      } else {
        toast((err && err.detail) || 'Không thể chạy ' + wfFormatModuleTitle(mod) + '. Vui lòng thử lại.', 'error');
      }
      render();
    }
  }

  function renderEncounter() {
    const enc = state.encounter;
    if (enc.loading) {
      return renderShell('<span class="breadcrumbs__current">Đang tải lượt khám...</span>', '<div class="skeleton-stack"><div class="skeleton-bar"></div><div class="skeleton-card"></div><div class="skeleton-card"></div></div>');
    }
    if (enc.error || !enc.visit || !enc.formStructure) {
      return renderShell('<button type="button" class="breadcrumbs__link" data-nav="#/patients">Hồ sơ bệnh nhân</button>', '<div class="banner banner--error" role="alert"><div class="banner__main">' + ICONS.alert + '<div><p class="banner__desc">' + esc(enc.error || NOT_FOUND_OR_NO_ACCESS_MSG) + '</p></div></div><button type="button" class="btn btn--secondary btn--sm" data-nav="#/patients">Quay lại</button></div>');
    }

    const v = enc.visit;
    const pt = enc.patient;
    const isConf = v.status === 'confirmed';
    const sections = sortByDisplayOrder(enc.formStructure.sections || []);

    const railHtml = sections.map(function (sec) {
      const p = countSectionProgress(sec, enc.defById, enc.valuesByDefId, enc, enc.defByCode);
      return (
        '<button type="button" class="rail-btn' + (sec.sectionCode === enc.activeSectionCode ? ' is-active' : '') + '" data-enc-section="' + esc(sec.sectionCode) + '">' +
          '<span><span class="rail-btn__num">' + String(sec.displayOrder).padStart(2, '0') + '</span>' + esc(sec.titleVi) + '</span>' +
          '<span class="rail-btn__counts">' + (p.hasErr ? '<span class="err-dot" title="Có lỗi trường"></span>' : '') + p.filled + '/' + p.total + '</span>' +
        '</button>'
      );
    }).join('');

    const confirmedBanner = isConf ? (
      '<div class="banner banner--success">' +
        '<div class="banner__main">' + ICONS.checkCircle +
          '<div><p class="banner__title">Lượt khám đã xác nhận (Chế độ chỉ đọc)</p>' +
          '<p class="banner__desc">Xác nhận lúc ' + esc(formatDateTime(v.confirmedAt)) + (v.currentRevisionNo > 1 ? ' · Bản sửa #' + esc(v.currentRevisionNo) : '') + '. Để bổ sung hoặc chỉnh sửa, hãy tạo bản sửa mới giữ nguyên lịch sử.</p></div>' +
        '</div>' +
        '<div class="banner__actions">' +
          '<button type="button" class="btn btn--secondary btn--sm" data-nav="#/visits/' + esc(v.id) + '/review">Xem lại &amp; Xuất dữ liệu</button>' +
          '<button type="button" class="btn btn--primary btn--sm" data-action="open-create-revision">Tạo bản sửa mới</button>' +
        '</div>' +
      '</div>'
    ) : '';

    const conflictBanner = enc.conflictError ? (
      '<div class="banner banner--error" role="alert">' +
        '<div class="banner__main">' + ICONS.alert +
          '<div><p class="banner__title">Xung đột sửa đồng thời (HTTP 409)</p><p class="banner__desc">' + esc(enc.conflictError) + '</p></div>' +
        '</div>' +
        '<div class="banner__actions"><button type="button" class="btn btn--danger btn--sm" data-action="reload-encounter">' + ICONS.refresh + ' Tải lại bản mới nhất</button></div>' +
      '</div>'
    ) : '';

    const errBanner = enc.errorList.length > 0 ? (
      '<div class="banner banner--error" role="alert">' +
        '<div class="banner__main">' + ICONS.alert +
          '<div><p class="banner__title">Phát hiện ' + enc.errorList.length + ' lỗi cần kiểm tra — các trường hợp lệ vẫn được giữ nguyên</p>' +
          '<div class="jump-list">' + enc.errorList.map(function (e) {
            const fd = enc.defByCode[e.fieldCode];
            const fLabel = (fd && fd.labelVi) || e.fieldCode;
            const secCode = e.sectionCode || resolveFieldSectionCode(enc.formStructure, e.fieldCode);
            return '<button type="button" class="jump-chip jump-chip--error" data-jump-field="' + esc(secCode + ':' + e.fieldCode) + '">' + esc(fLabel + ': ' + e.message) + '</button>';
          }).join('') + '</div></div>' +
        '</div>' +
      '</div>'
    ) : '';

    const sectionCard = renderClinicalSectionForm({
      mode: 'encounter',
      readonly: isConf,
      isV12: enc.isV12,
      workflowSummary: enc.workflowSummary,
      fieldMetadata: enc.fieldMetadata,
      moduleFilter: enc.moduleFilter,
      unlockedUnknownCodes: enc.unlockedUnknownCodes,
      sections: enc.formStructure.sections,
      defById: enc.defById,
      defByCode: enc.defByCode,
      valuesByDefId: enc.valuesByDefId,
      orthostaticBp: enc.orthostaticBp,
      medications: enc.medications,
      allergies: enc.allergies,
      labResults: enc.labResults,
      diagnoses: enc.diagnoses,
      medicationListState: enc.medicationListState,
      allergyListState: enc.allergyListState,
      diagnosisListState: enc.diagnosisListState,
      supportsListStates: enc.supportsListStates,
      formVersion: enc.formStructure.formVersion,
      patient: pt,
      visit: v,
      clinicalNote: enc.clinicalNote,
      infoSource: enc.infoSource,
      activeSectionCode: enc.activeSectionCode,
      search: enc.fieldSearch,
      filter: enc.fieldFilter,
      fieldErrors: enc.fieldErrors
    });

    const footerBar = isConf ? '' : (
      '<div class="encounter-footer">' +
        '<div class="encounter-footer__status">' +
          (enc.dirty
            ? '<span class="badge badge--warn">Có thay đổi chưa lưu</span>'
            : '<span class="badge badge--success">Đã lưu nháp · ' + esc(formatDateTime(enc.lastSavedAt)) + '</span>') +
          '<span class="field__help">Phím tắt: <span class="kbd">/</span> tìm trường · <span class="kbd">Ctrl+S</span> lưu nháp</span>' +
        '</div>' +
        '<div class="encounter-footer__actions">' +
          '<button type="button" class="btn btn--secondary' + (enc.saving ? ' is-loading' : '') + '" data-action="save-draft"' + (enc.saving ? ' disabled' : '') + '>' + (enc.saving ? '' : ICONS.save) + (enc.saving ? 'Đang lưu...' : ' Lưu nháp') + '</button>' +
          '<button type="button" class="btn btn--primary" data-action="go-review">Xem lại &amp; Xác nhận ' + ICONS.arrowRight + '</button>' +
        '</div>' +
      '</div>'
    );

    const perfDoctorName = v.performedByName || v.performingDoctorName || v.createdByName || '';
    const lastEditorName = v.updatedByName || v.lastEditedByName || '';
    const hasModMeta = enc.isV12 && enc.fieldMetadata && Object.keys(enc.fieldMetadata).length > 0;
    const modFilterBarHtml = hasModMeta ? (
      '<div class="enc-mod-filter-bar" role="group" aria-label="Hiện trường cần cho">' +
        '<span class="enc-mod-filter-bar__label">Hiện trường cần cho:</span>' +
        ['m1', 'm2', 'm3', 'm4', 'all'].map(function (mf) {
          const lbl = mf === 'all' ? 'Tất cả' : mf.toUpperCase();
          return '<button type="button" class="filter-pill' + (enc.moduleFilter === mf ? ' is-active' : '') + '" data-enc-mod-filter="' + esc(mf) + '" aria-pressed="' + (enc.moduleFilter === mf ? 'true' : 'false') + '">' + esc(lbl) + '</button>';
        }).join('') +
      '</div>'
    ) : '';

    const body =
      '<div class="encounter-sticky-head">' +
        '<div>' +
          '<div class="encounter-sticky-head__id">' +
            '<span class="mono">' + esc(pt ? pt.patientCode : '') + '</span>' +
            '<span>' + esc(pt ? pt.fullName : '') + '</span>' +
            '<span class="badge badge--blue mono">' + esc(v.visitCode) + '</span>' +
            (isConf ? '<span class="badge badge--success">Đã xác nhận</span>' : '<span class="badge badge--warn">Bản nháp</span>') +
          '</div>' +
          '<div class="encounter-sticky-head__meta">' +
            '<span class="tabular">' + esc(formatDateTime(v.visitDate)) + ' · ' + esc(formatVisitType(v.visitType)) + '</span>' +
            (perfDoctorName ? ' · <span data-visit-performer="true">Bác sĩ thực hiện: <strong>' + esc(perfDoctorName) + '</strong></span>' : '') +
            (lastEditorName ? ' · <span data-visit-last-editor="true">Chỉnh sửa gần nhất: <strong>' + esc(lastEditorName) + '</strong></span>' : '') +
          '</div>' +
        '</div>' +
        '<div class="encounter-sticky-head__right">' +
          (enc.isV12
            ? '<button type="button" class="btn btn--navy btn--sm" data-nav="#/visits/' + esc(v.id) + '/workflow">Luồng 4 Module AI ' + ICONS.arrowRight + '</button>'
            : '<span class="badge badge--neutral" title="Biểu mẫu cũ — chỉ hỗ trợ luồng AI ở v1.2">Biểu mẫu cũ — chỉ hỗ trợ luồng AI ở v1.2</span>') +
          '<button type="button" class="btn btn--secondary btn--sm" data-nav="#/patients/' + esc(v.patientId) + '">' + ICONS.arrowLeft + ' Về hồ sơ</button>' +
        '</div>' +
      '</div>' +
      renderEncounterWorkflowBar(enc) +
      confirmedBanner + conflictBanner + errBanner +
      '<div class="encounter-layout">' +
        '<aside class="group-rail" aria-label="Mục lục 8 nhóm biểu mẫu">' +
          '<div class="group-rail__title">Mục lục 8 nhóm</div>' +
          railHtml +
        '</aside>' +
        '<div class="form-canvas">' +
          '<div class="form-filter-bar">' +
            '<div class="search-box"><span class="search-box__icon">' + ICONS.search + '</span><input type="search" id="enc-field-search" class="input" placeholder="Tìm nhanh trường dữ liệu [phím /]..." value="' + esc(enc.fieldSearch) + '"></div>' +
            '<div class="filter-pills">' +
              '<button type="button" class="filter-pill' + (enc.fieldFilter === 'all' ? ' is-active' : '') + '" data-enc-filter="all">Tất cả</button>' +
              '<button type="button" class="filter-pill' + (enc.fieldFilter === 'unfilled' ? ' is-active' : '') + '" data-enc-filter="unfilled">Chưa điền</button>' +
              '<button type="button" class="filter-pill' + (enc.fieldFilter === 'error' ? ' is-active' : '') + '" data-enc-filter="error">Cần kiểm tra (' + enc.errorList.length + ')</button>' +
            '</div>' +
          '</div>' +
          modFilterBarHtml +
          sectionCard +
          footerBar +
        '</div>' +
      '</div>';

    const crumbs =
      '<button type="button" class="breadcrumbs__link" data-nav="#/patients">Hồ sơ bệnh nhân</button><span>/</span>' +
      '<button type="button" class="breadcrumbs__link mono" data-nav="#/patients/' + esc(v.patientId) + '">' + esc(pt ? pt.patientCode : 'BN') + '</button><span>/</span>' +
      '<span class="breadcrumbs__current mono">' + esc(v.visitCode) + '</span>';
    return renderShell(crumbs, body);
  }

  /* ------------------------------------------------------------------------
     M5: Review & Confirm + Tier 4 Readiness + AiInputPayload Contract
     ------------------------------------------------------------------------ */
  function renderReview() {
    const rev = state.review;
    if (rev.loading) {
      return renderShell('<span class="breadcrumbs__current">Đang tổng hợp dữ liệu rà soát...</span>', '<div class="skeleton-stack"><div class="skeleton-bar"></div><div class="skeleton-card"></div></div>');
    }
    if (rev.error || !rev.data || !rev.visit) {
      return renderShell('<button type="button" class="breadcrumbs__link" data-nav="#/patients">Hồ sơ bệnh nhân</button>', '<div class="banner banner--error" role="alert"><div class="banner__main">' + ICONS.alert + '<div><p class="banner__desc">' + esc(rev.error || NOT_FOUND_OR_NO_ACCESS_MSG) + '</p></div></div><button type="button" class="btn btn--secondary btn--sm" data-nav="#/patients">Quay lại danh sách</button></div>');
    }

    const r = rev.data;
    const v = rev.visit;
    const pt = rev.patient;
    const fv = rev.formVersion;
    const isConf = v.status === 'confirmed';

    const defById = {};
    const defByCode = {};
    ((rev.formRes && rev.formRes.fieldDefinitions) || []).forEach(function (fd) {
      defById[fd.id] = fd;
      defByCode[fd.code] = fd;
    });

    // BS-05: Build concise summary of entered clinical values so doctor can double-check before confirming
    const summaryItems = [];
    if (rev.visitDetail) {
      (rev.visitDetail.values || []).forEach(function (vv) {
        const fd = defById[vv.fieldDefinitionId];
        if (!fd) return;
        let disp = '';
        if (vv.valueState === 'unknown') {
          disp = 'Chưa rõ';
        } else if (fd.dataType === 'boolean') {
          disp = vv.valueBool ? 'Có' : 'Không';
        } else if (fd.dataType === 'number' || fd.dataType === 'integer') {
          if (vv.valueNum !== null && vv.valueNum !== undefined) disp = String(vv.valueNum) + (fd.canonicalUnit ? ' ' + fd.canonicalUnit : '');
        } else if (fd.dataType === 'single_choice') {
          const opt = (fd.options || []).find(function (o) { return o.id === vv.fieldOptionId; });
          disp = opt ? opt.labelVi : '';
        } else if (fd.dataType === 'multi_choice') {
          const ids = (vv.selectedOptions || []).map(function (so) { return so.fieldOptionId; });
          disp = (fd.options || []).filter(function (o) { return ids.indexOf(o.id) >= 0; }).map(function (o) { return o.labelVi; }).join(', ');
        } else if (fd.dataType === 'date') {
          disp = vv.valueDate || '';
        } else {
          disp = vv.valueText || '';
        }
        if (disp) summaryItems.push({ label: fd.labelVi, value: disp });
      });
      const validBps = (rev.visitDetail.orthostaticBp || []).filter(function (b) { return b && b.systolic != null && b.diastolic != null; });
      if (validBps.length > 0) {
        summaryItems.push({
          label: 'Huyết áp theo tư thế',
          value: validBps.map(function (b) { return formatBpPosition(b.position) + ': ' + b.systolic + '/' + b.diastolic + ' mmHg' + (b.heartRate != null ? ' (nhịp ' + b.heartRate + ')' : ''); }).join(' · ')
        });
      }
      const validMeds = (rev.visitDetail.medications || []).filter(isValidMedRow);
      if (validMeds.length > 0) {
        summaryItems.push({
          label: 'Thuốc đã ghi nhận (' + validMeds.length + ')',
          value: validMeds.map(function (m) { return m.drugName + (m.dose ? ' ' + m.dose + (m.unit || '') : ''); }).join(', ')
        });
      } else if (v.medicationListState === 'none') {
        summaryItems.push({ label: 'Danh sách thuốc', value: 'Đã xác nhận không dùng thuốc' });
      }
      const validAlgs = (rev.visitDetail.allergies || []).filter(isValidAllergyRow);
      if (validAlgs.length > 0) {
        summaryItems.push({
          label: 'Dị ứng / ADR (' + validAlgs.length + ')',
          value: validAlgs.map(function (a) { return a.allergen + (a.reaction ? ' (' + a.reaction + ')' : ''); }).join(', ')
        });
      } else if (v.allergyListState === 'none') {
        summaryItems.push({ label: 'Dị ứng / ADR', value: 'Đã xác nhận không có dị ứng / ADR' });
      }
      const validDxs = (rev.visitDetail.diagnoses || []).filter(isValidDiagnosisRow);
      if (validDxs.length > 0) {
        summaryItems.push({
          label: 'Chẩn đoán ICD-10 (' + validDxs.length + ')',
          value: validDxs.map(function (d) {
            return (d.role === 'primary' ? '[Chính] ' : '[Phụ] ') + (d.code || '') + (d.display ? ' - ' + d.display : '');
          }).join(' · ')
        });
      } else if (v.diagnosisListState === 'none') {
        summaryItems.push({ label: 'Chẩn đoán ICD-10', value: 'Đã xác nhận chưa có mã ICD' });
      }
      const validLabs = (rev.visitDetail.labResults || []).filter(function (l) { return isValidLabRow(l, defByCode); });
      if (validLabs.length > 0) {
        summaryItems.push({
          label: 'Kết quả cận lâm sàng (' + validLabs.length + ')',
          value: validLabs.map(function (l) {
            const fd = defByCode[l.labCode];
            const valText = l.valueNum != null ? (l.valueNum + (l.unit ? ' ' + l.unit : '')) : (l.valueText || '');
            return ((fd && fd.labelVi) || l.labCode) + ': ' + valText;
          }).join(' · ')
        });
      }
      if (v.infoSource && String(v.infoSource).trim()) {
        summaryItems.push({ label: 'Nguồn cung cấp thông tin lâm sàng', value: v.infoSource });
      }
      if (v.clinicalNote && String(v.clinicalNote).trim()) {
        summaryItems.push({ label: 'Ghi chú lâm sàng bổ sung', value: v.clinicalNote });
      }
    }

    const summaryCollapsible = summaryItems.length > REVIEW_SUMMARY_COLLAPSED_LIMIT;
    const summaryExpanded = !summaryCollapsible || getReviewSummaryExpanded();
    const visibleSummaryItems = summaryExpanded ? summaryItems : summaryItems.slice(0, REVIEW_SUMMARY_COLLAPSED_LIMIT);
    const hiddenSummaryCount = Math.max(0, summaryItems.length - REVIEW_SUMMARY_COLLAPSED_LIMIT);
    const summaryToggleLabel = summaryExpanded ? 'Thu gọn' : ('Xem thêm (' + hiddenSummaryCount + ')');

    const enteredSummaryHtml =
      '<section class="card" id="review-recorded-summary" data-summary-expanded="' + (summaryExpanded ? 'true' : 'false') + '" style="margin-top:16px;">' +
        '<div class="card__header">' +
          '<div><h2 class="card__title">Tóm tắt các giá trị đã ghi nhận (' + summaryItems.length + ')</h2><p class="card__subtitle">Rà nhanh các thông tin đã điền trước khi xác nhận lượt khám.</p></div>' +
          (summaryCollapsible
            ? '<div class="summary-card__actions">' +
                '<button type="button" class="btn btn--secondary btn--sm" data-action="toggle-review-summary" aria-expanded="' + (summaryExpanded ? 'true' : 'false') + '" aria-controls="review-summary-grid">' +
                  (summaryExpanded ? ICONS.up : ICONS.down) + ' ' + esc(summaryToggleLabel) +
                '</button>' +
              '</div>'
            : '') +
        '</div>' +
        '<div class="card__body">' +
          (summaryItems.length === 0
            ? '<p class="field__help">Chưa có giá trị lâm sàng nào được nhập trong lượt khám này.</p>'
            : '<div id="review-summary-grid" class="kv-grid kv-grid--summary">' + visibleSummaryItems.map(function (it) {
                return '<div><div class="kv-item__label">' + esc(it.label) + '</div><div class="kv-item__value">' + esc(it.value) + '</div></div>';
              }).join('') + '</div>' +
              (summaryCollapsible
                ? '<div class="summary-collapse-bar">' +
                    '<span class="summary-collapse-bar__meta">' +
                      (summaryExpanded
                        ? ('Đang hiển thị đầy đủ ' + summaryItems.length + '/' + summaryItems.length + ' mục đã ghi nhận.')
                        : ('Đang hiển thị ' + visibleSummaryItems.length + '/' + summaryItems.length + ' mục đầu để dễ xem thẻ độ sẵn sàng AI bên dưới.')) +
                    '</span>' +
                    '<button type="button" class="btn btn--secondary btn--sm" data-action="toggle-review-summary" aria-expanded="' + (summaryExpanded ? 'true' : 'false') + '" aria-controls="review-summary-grid">' +
                      (summaryExpanded ? ICONS.up : ICONS.down) + ' ' + esc(summaryToggleLabel) +
                    '</button>' +
                  '</div>'
                : '')) +
        '</div>' +
      '</section>';

    const secRows = (r.sections || []).map(function (s, idx) {
      return (
        '<tr>' +
          '<td><strong>' + String(idx + 1).padStart(2, '0') + '. ' + esc(s.titleVi) + '</strong></td>' +
          '<td class="tabular">' + s.answeredCount + '</td>' +
          '<td class="tabular">' + s.unfilledCount + '</td>' +
          '<td class="tabular">' + s.unknownCount + '</td>' +
          '<td class="tabular">' + (s.errorCount > 0 ? '<span class="badge badge--error">' + s.errorCount + ' lỗi</span>' : '<span class="badge badge--success">0 lỗi</span>') + '</td>' +
          '<td style="text-align:right;"><button type="button" class="btn btn--secondary btn--sm" data-review-open-sec="' + esc(s.sectionCode) + '">Mở nhóm</button></td>' +
        '</tr>'
      );
    }).join('');

    const secCards = (r.sections || []).map(function (s, idx) {
      return (
        '<article class="record-card">' +
          '<div class="record-card__top"><strong>' + String(idx + 1).padStart(2, '0') + '. ' + esc(s.titleVi) + '</strong>' + (s.errorCount > 0 ? '<span class="badge badge--error">' + s.errorCount + ' lỗi</span>' : '<span class="badge badge--success">0 lỗi</span>') + '</div>' +
          '<div class="record-card__meta">' +
            '<div><span class="record-card__label">Đã nhập / Chưa điền</span>' + s.answeredCount + ' / ' + s.unfilledCount + '</div>' +
            '<div><span class="record-card__label">Đã chọn Chưa rõ</span>' + s.unknownCount + '</div>' +
          '</div>' +
          '<button type="button" class="btn btn--secondary btn--sm btn--full" data-review-open-sec="' + esc(s.sectionCode) + '">Mở nhóm trên biểu mẫu</button>' +
        '</article>'
      );
    }).join('');

    const tier3Box = r.tier3ConfirmErrors.length > 0 ? (
      '<div class="banner banner--error">' +
        '<div class="banner__main">' + ICONS.alert +
          '<div><p class="banner__title">Còn ' + r.tier3ConfirmErrors.length + ' lỗi cần sửa trước khi xác nhận lượt khám</p>' +
          '<div class="jump-list">' + r.tier3ConfirmErrors.map(function (e) {
            const fd = defByCode[e.fieldCode];
            const fLabel = (fd && fd.labelVi) || e.fieldCode;
            return '<button type="button" class="jump-chip jump-chip--error" data-review-jump="' + esc((e.sectionCode || 'hanh_chinh') + ':' + e.fieldCode) + '">' + esc(fLabel + ': ' + e.message) + '</button>';
          }).join('') + '</div></div>' +
        '</div>' +
      '</div>'
    ) : (
      '<div class="banner banner--success">' +
        '<div class="banner__main">' + ICONS.checkCircle + '<div><p class="banner__title">Đủ điều kiện xác nhận dữ liệu đã ghi nhận</p><p class="banner__desc">Không phát hiện lỗi định dạng hoặc trường bắt buộc bị thiếu. Hiện có <strong>' + r.totalAnswered + ' trường đã nhập</strong>, <strong>' + r.totalUnknown + ' trường chọn "Chưa rõ"</strong> và <strong>' + r.totalUnfilled + ' trường bỏ trống</strong> (xác nhận chỉ chốt phần dữ liệu hiện có, không đồng nghĩa đủ biến cho AI).</p></div></div>' +
      '</div>'
    );

    const AI_FALLBACK_FIELD_LABELS = {
      thuoc_ghi_nhan: 'Danh sách thuốc đang dùng',
      di_ung_adr: 'Tiền sử dị ứng / ADR',
      cls_don_vi: 'Đơn vị xét nghiệm',
      cls_thoi_diem: 'Thời điểm xét nghiệm',
      cls_ecg_thoi_diem: 'Thời điểm điện tâm đồ (ECG)',
      cls_sieu_am_tim_thoi_diem: 'Thời điểm siêu âm tim',
      cls_xquang_thoi_diem: 'Thời điểm X-quang ngực'
    };

    const tier4Cards = (r.tier4AiModules || []).map(function (m) {
      const missingCodes = Array.isArray(m.missingFieldCodes) ? m.missingFieldCodes : [];
      const isReady = Boolean(m.ready);
      const reasonCodes = new Set();
      const nonMissingIssues = (m.issues || []).filter(function (issue) {
        if (missingCodes.includes(issue.fieldCode) || reasonCodes.has(issue.issueCode)) return false;
        reasonCodes.add(issue.issueCode);
        return true;
      });
      const reasons = nonMissingIssues.map(function (issue) { return issue.messageVi; });
      const hasActionableNonMissing = nonMissingIssues.some(function (issue) {
        return Boolean(AI_ACTIONABLE_ISSUE_CODES[issue.issueCode]);
      });
      const missingChipsHtml = missingCodes.map(function (code) {
        const label = (defByCode[code] && defByCode[code].labelVi) || AI_ISSUE_DISPLAY_LABELS[code] || AI_FALLBACK_FIELD_LABELS[code] || code;
        const secCode = resolveFieldSectionCode(rev.formRes, code);
        return (
          '<button type="button" class="jump-chip jump-chip--info ai-missing-chip" data-review-jump="' + esc(secCode + ':' + code) + '" data-ai-missing-field="' + esc(code) + '" title="' + esc('Đi tới trường ' + label + ' trên biểu mẫu lượt khám') + '">' +
            esc(label) +
          '</button>'
        );
      }).join('');
      const firstCode = !isReady ? missingCodes[0] : '';
      const firstSec = firstCode ? resolveFieldSectionCode(rev.formRes, firstCode) : '';
      const firstLabel = firstCode ? ((defByCode[firstCode] && defByCode[firstCode].labelVi) || AI_ISSUE_DISPLAY_LABELS[firstCode] || AI_FALLBACK_FIELD_LABELS[firstCode] || firstCode) : '';
      return (
        '<div class="card ai-module-card ' + (isReady ? 'ai-module-card--ready' : 'ai-module-card--missing') + '" data-ai-readiness-module="' + esc(m.aiModuleCode) + '">' +
          '<div class="ai-module-card__body">' +
            '<div class="version-card__top">' +
              '<strong>' + esc(formatAiModuleLabel(m.aiModuleCode)) + '</strong>' +
              (isReady ? '<span class="badge badge--success">Đủ biến dự kiến</span>' : '<span class="badge badge--info">' + (missingCodes.length ? 'Thiếu ' + missingCodes.length + ' trường' : 'Chưa sẵn sàng') + '</span>') +
            '</div>' +
            (isReady
              ? '<div class="cell-sub">Đáp ứng bộ biến dự kiến cho module này.</div>'
              : (missingCodes.length ? '<div class="ai-missing-block">' +
                  '<div class="ai-missing-block__label">Còn thiếu (bấm vào từng trường để đi tới biểu mẫu):</div>' +
                  '<div class="ai-missing-chips">' + missingChipsHtml + '</div>' +
                '</div>' : '') +
                (reasons.length ? '<div class="ai-readiness-note ' + (hasActionableNonMissing ? 'ai-readiness-note--actionable' : 'ai-readiness-note--system') + '">Chưa sẵn sàng vì: ' + esc(reasons.join(' ')) + '</div>' :
                  (!missingCodes.length ? '<div class="ai-readiness-note ai-readiness-note--system">Chưa sẵn sàng vì: Cần kiểm tra chất lượng dữ liệu xuất AI.</div>' : ''))) +
          '</div>' +
          (!isReady && firstCode
            ? '<div class="ai-module-card__footer">' +
                '<button type="button" class="btn btn--secondary btn--sm ai-module-card__first-btn" data-review-jump="' + esc(firstSec + ':' + firstCode) + '" data-ai-module-first-missing="' + esc(m.aiModuleCode) + '" title="' + esc('Đi tới trường thiếu đầu tiên: ' + firstLabel) + '">' +
                  'Đi tới trường thiếu đầu tiên ' + ICONS.arrowRight +
                '</button>' +
              '</div>'
            : '') +
        '</div>'
      );
    }).join('');

    const revisionsHtml = (rev.revisions || []).length > 0 ? (
      '<section class="card" style="margin-top:16px;">' +
        '<div class="card__header"><div><h2 class="card__title">Lịch sử xác nhận &amp; Bản sửa</h2><p class="card__subtitle">Mọi lần xác nhận và chỉnh sửa sau xác nhận được lưu nối tiếp, giữ nguyên lịch sử.</p></div></div>' +
        '<div class="card__body"><div class="timeline">' + rev.revisions.map(function (rv) {
          return (
            '<div class="timeline-item timeline-item--confirmed">' +
              '<div class="timeline-item__top">' +
                '<strong>Bản sửa #' + esc(rv.revisionNo) + ' · ' + (rv.revisionType === 'confirmed_snapshot' ? 'Bản chụp đã xác nhận' : 'Mở bản sửa sau xác nhận') + '</strong>' +
                '<span class="cell-sub tabular">' + esc(formatDateTime(rv.createdAt)) + '</span>' +
              '</div>' +
              '<div class="cell-sub">Lý do: ' + esc(rv.changeReason) + '</div>' +
            '</div>'
          );
        }).join('') + '</div></div>' +
      '</section>'
    ) : '';

    const isDoctor = Boolean(state.user && state.user.role === 'doctor');

    function renderAiQualityPanel() {
      const q = rev.aiExportQuality;
      const errMsg = rev.aiExportError;
      if (!q && !errMsg) return '';
      const isReady = Boolean(q && q.status === 'ready');
      const modules = (q && Array.isArray(q.modules)) ? q.modules : [];
      const issues = (q && Array.isArray(q.issues)) ? q.issues : [];

      const statusBanner = !q
        ? '<div class="banner banner--error" style="margin-bottom:0;" role="alert"><div class="banner__main">' + ICONS.alert + '<div><p class="banner__title">Không thể xuất JSON cho AI</p><p class="banner__desc">' + esc(errMsg) + '</p></div></div></div>'
        : (isReady
            ? '<div class="banner banner--success" style="margin-bottom:0;"><div class="banner__main">' + ICONS.checkCircle + '<div><p class="banner__title">Sẵn sàng gửi AI (hf-ai-input/1.0)</p><p class="banner__desc">Tất cả module kiểm tra đạt chất lượng. Tệp JSON ẩn danh đã được chuẩn bị để tải xuống.</p></div></div></div>'
            : '<div class="banner banner--error" style="margin-bottom:0;" role="alert"><div class="banner__main">' + ICONS.alert + '<div><p class="banner__title">Bị chặn (Blocked) — Chưa đủ điều kiện gửi AI</p><p class="banner__desc">' + esc(errMsg || ('Phát hiện ' + issues.length + ' vấn đề chất lượng dữ liệu theo hợp đồng hf-ai-input/1.0. Gói này KHÔNG được coi là sẵn sàng gửi AI.')) + '</p></div></div>' +
                '<div class="banner__actions"><button type="button" class="btn btn--secondary btn--sm" data-action="export-ai-json-diagnostic">' + ICONS.download + ' Tải gói chẩn đoán (diagnostic)</button></div>' +
              '</div>');

      const modCardsHtml = modules.length > 0 ? (
        '<div class="ai-quality-modules">' + modules.map(function (m) {
          const mReady = m.status === 'ready';
          const count = Number(m.issueCount || 0);
          return (
            '<div class="ai-quality-card ' + (mReady ? 'ai-quality-card--ready' : 'ai-quality-card--blocked') + '" data-ai-module-status="' + esc(m.status || 'blocked') + '">' +
              '<div class="version-card__top">' +
                '<strong>' + esc(formatAiModuleLabel(m.module)) + '</strong>' +
                (mReady
                  ? '<span class="badge badge--success">Sẵn sàng (ready)</span>'
                  : '<span class="badge badge--error">Bị chặn (blocked' + (count > 0 ? ' · ' + count : '') + ')</span>') +
              '</div>' +
            '</div>'
          );
        }).join('') + '</div>'
      ) : '';

      const grouped = classifyAndGroupAiQualityIssues(issues, rev.formRes);
      const expandedState = rev.aiQualityExpanded || { actionable: false, system: false };

      function renderModuleChip(mods) {
        if (!mods || mods.length === 0) return '';
        const shortText = mods.map(formatAiModuleShortLabel).join(' · ');
        const fullTitle = mods.map(formatAiModuleLabel).join(' | ');
        return '<span class="ai-quality-mod-chip" title="' + esc(fullTitle) + '">' + esc(shortText) + '</span>';
      }

      function renderGroupedIssueRows(items, isActionable) {
        return '<div class="ai-issue-list">' + items.map(function (item) {
          const modChip = renderModuleChip(item.modules);
          const techParts = [];
          if (item.techCode) techParts.push(item.techCode);
          if (item.issueCode) techParts.push(item.issueCode);
          const techLine = techParts.length > 0
            ? '<div class="ai-issue-row__tech mono">' + esc(techParts.join(' · ')) + '</div>'
            : '';
          if (isActionable) {
            return (
              '<div class="ai-issue-row ai-issue-row--actionable" data-ai-issue-bucket="actionable" data-ai-issue-code="' + esc(item.issueCode) + '">' +
                '<div class="ai-issue-row__main">' +
                  '<div class="ai-issue-row__top">' +
                    '<strong class="ai-issue-row__label">' + esc(item.labelVi) + '</strong>' +
                    '<span class="ai-issue-row__reason">' + esc(item.reasonVi) + '</span>' +
                    modChip +
                  '</div>' +
                  techLine +
                '</div>' +
                '<button type="button" class="ai-issue-jump-btn" data-ai-issue-jump="' + esc(item.jumpFieldCode) + '">Mở ô →</button>' +
              '</div>'
            );
          }
          return (
            '<div class="ai-issue-row ai-issue-row--system" data-ai-issue-bucket="system" data-ai-issue-code="' + esc(item.issueCode) + '">' +
              '<div class="ai-issue-row__main">' +
                '<div class="ai-issue-row__top">' +
                  '<strong class="ai-issue-row__label">' + esc(item.labelVi) + '</strong>' +
                  '<span class="ai-issue-row__reason">' + esc(item.reasonVi) + '</span>' +
                  modChip +
                '</div>' +
                techLine +
              '</div>' +
            '</div>'
          );
        }).join('') + '</div>';
      }

      let issueListHtml = '';
      if (issues.length > 0) {
        const actionableCount = grouped.actionable.length;
        const systemCount = grouped.system.length;
        const actionableExpanded = Boolean(expandedState.actionable);
        const systemExpanded = Boolean(expandedState.system);

        const actionableHtml = actionableCount === 0
          ? (
              '<div class="ai-quality-ok-strip" data-ai-quality-group="actionable" data-ai-quality-count="0">' +
                '<span class="ai-quality-ok-strip__icon">' + ICONS.checkCircle + '</span>' +
                '<span>Không có trường nào bác sĩ cần điền thêm</span>' +
              '</div>'
            )
          : (
              '<div class="ai-quality-group ai-quality-group--actionable" data-ai-quality-group="actionable" data-ai-quality-count="' + actionableCount + '">' +
                '<button type="button" class="ai-quality-group__toggle" data-action="toggle-ai-quality-group" data-ai-quality-group="actionable" aria-expanded="' + (actionableExpanded ? 'true' : 'false') + '" aria-controls="ai-quality-list-actionable">' +
                  '<div class="ai-quality-group__head-main">' +
                    '<div class="ai-quality-group__title-row">' +
                      '<span class="ai-quality-group__dot ai-quality-group__dot--actionable" aria-hidden="true"></span>' +
                      '<span class="ai-quality-group__title">Có trường nhưng chưa điền (' + actionableCount + ')</span>' +
                    '</div>' +
                  '</div>' +
                  '<span class="ai-quality-group__chevron" aria-hidden="true">' + ICONS.down + '</span>' +
                '</button>' +
                '<div id="ai-quality-list-actionable" class="ai-quality-group__body"' + (actionableExpanded ? '' : ' hidden') + '>' +
                  renderGroupedIssueRows(grouped.actionable, true) +
                '</div>' +
              '</div>'
            );

        const systemHtml = systemCount === 0
          ? ''
          : (
              '<div class="ai-quality-group ai-quality-group--system" data-ai-quality-group="system" data-ai-quality-count="' + systemCount + '">' +
                '<button type="button" class="ai-quality-group__toggle" data-action="toggle-ai-quality-group" data-ai-quality-group="system" aria-expanded="' + (systemExpanded ? 'true' : 'false') + '" aria-controls="ai-quality-list-system">' +
                  '<div class="ai-quality-group__head-main">' +
                    '<div class="ai-quality-group__title-row">' +
                      '<span class="ai-quality-group__dot ai-quality-group__dot--system" aria-hidden="true"></span>' +
                      '<span class="ai-quality-group__title">Chưa có trường trong biểu mẫu / giới hạn hệ thống (' + systemCount + ')</span>' +
                    '</div>' +
                    '<span class="ai-quality-group__explain">Không phải do bác sĩ nhập thiếu: biểu mẫu hiện chưa có trường này hoặc chưa có danh mục chuẩn của bệnh viện.</span>' +
                  '</div>' +
                  '<span class="ai-quality-group__chevron" aria-hidden="true">' + ICONS.down + '</span>' +
                '</button>' +
                '<div id="ai-quality-list-system" class="ai-quality-group__body"' + (systemExpanded ? '' : ' hidden') + '>' +
                  renderGroupedIssueRows(grouped.system, false) +
                '</div>' +
              '</div>'
            );

        issueListHtml = '<div class="ai-quality-groups">' + actionableHtml + systemHtml + '</div>';
      }

      const payloadHtml = rev.aiExportV1 ? (
        '<div>' +
          '<div class="field__meta-row" style="margin-bottom:8px;">' +
            '<strong>' + (rev.aiExportIsDiagnostic ? 'Gói chẩn đoán JSON (diagnostic — KHÔNG dùng gửi AI)' : 'Gói JSON đầu vào AI (hf-ai-input/1.0)') + '</strong>' +
            '<div style="display:flex;gap:6px;flex-wrap:wrap;">' +
              '<button type="button" class="btn btn--secondary btn--sm" data-action="download-ai-json-v1">' + ICONS.download + ' Tải tệp .json</button>' +
              '<button type="button" class="btn btn--secondary btn--sm" data-action="copy-ai-json-v1">Sao chép JSON</button>' +
            '</div>' +
          '</div>' +
          '<pre class="json-viewer">' + esc(JSON.stringify(rev.aiExportV1, null, 2)) + '</pre>' +
        '</div>'
      ) : '';

      return (
        '<div class="ai-quality-panel ' + (q ? (isReady ? 'ai-quality-panel--ready' : 'ai-quality-panel--blocked') : 'ai-quality-panel--blocked') + '" data-ai-quality-status="' + esc(q ? (q.status || 'blocked') : 'error') + '">' +
          statusBanner + modCardsHtml + issueListHtml + payloadHtml +
        '</div>'
      );
    }

    const gateHtml = !isConf ? (
      '<section class="confirm-gate">' +
        '<div class="banner banner--blue" style="margin-bottom:0;">' +
          '<div class="banner__main">' + ICONS.shield + '<div><p class="banner__title">Ranh giới chuyên môn khi xác nhận</p><p class="banner__desc">Xác nhận này chốt dữ liệu lâm sàng bác sĩ đã ghi nhận cho lượt khám để lưu trữ chuẩn hóa. <strong>Đây không phải là xác nhận chẩn đoán cuối cùng hay y lệnh điều trị.</strong></p></div></div>' +
        '</div>' +
        (rev.confirmError ? '<div class="banner banner--error" style="margin-bottom:0;"><div class="banner__main">' + ICONS.alert + '<div><p class="banner__title">Chưa xác nhận được lượt khám</p><p class="banner__desc">' + esc(rev.confirmError) + '</p></div></div></div>' : '') +
        '<div class="kv-grid">' +
          '<div><div class="kv-item__label">Người xác nhận</div><div class="kv-item__value">' + esc(state.user.fullName) + '</div></div>' +
          '<div><div class="kv-item__label">Biểu mẫu áp dụng</div><div class="kv-item__value">' + esc(fv ? fv.versionLabel : 'v1') + '</div></div>' +
          '<div><div class="kv-item__label">Bản sửa hiện tại</div><div class="kv-item__value">Bản sửa #' + esc(v.currentRevisionNo) + '</div></div>' +
        '</div>' +
        '<div class="field"><label class="field__label" for="confirm-note-input">Ghi chú xác nhận (không bắt buộc)</label><input id="confirm-note-input" type="text" class="input" placeholder="VD: Đã đối chiếu kết quả sinh hiệu và cận lâm sàng lượt tái khám" value="' + esc(rev.confirmNote) + '"></div>' +
        '<div style="display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap;">' +
          '<button type="button" class="btn btn--secondary" data-nav="#/visits/' + esc(v.id) + '">' + ICONS.arrowLeft + ' Quay lại chỉnh sửa</button>' +
          '<button type="button" class="btn btn--primary' + (rev.confirming ? ' is-loading' : '') + '" data-action="confirm-visit"' + (!r.canConfirm || rev.confirming ? ' disabled' : '') + '>' + (rev.confirming ? '' : ICONS.checkCircle) + (rev.confirming ? 'Đang xác nhận...' : ' Xác nhận dữ liệu lượt khám') + '</button>' +
        '</div>' +
      '</section>'
    ) : (
      '<section class="confirm-gate">' +
        '<div class="banner banner--success" style="margin-bottom:0;">' +
          '<div class="banner__main">' + ICONS.checkCircle + '<div><p class="banner__title">Lượt khám đã xác nhận (Chế độ chỉ đọc)</p><p class="banner__desc">Xác nhận lúc ' + esc(formatDateTime(v.confirmedAt)) + ' · Biểu mẫu ' + esc(fv ? fv.versionLabel : 'v1') + ' · Bản sửa #' + esc(v.currentRevisionNo) + (v.confirmNote ? ' · Ghi chú: ' + esc(v.confirmNote) : '') + '</p></div></div>' +
        '</div>' +
        '<div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:space-between;align-items:center;">' +
          '<button type="button" class="btn btn--secondary" data-nav="#/visits/' + esc(v.id) + '">Xem biểu mẫu chỉ đọc</button>' +
          '<div style="display:flex;gap:8px;flex-wrap:wrap;">' +
            (isDoctor ? '<button type="button" class="btn btn--navy' + (rev.aiExportLoading ? ' is-loading' : '') + '" data-action="export-ai-json-v1"' + (rev.aiExportLoading ? ' disabled' : '') + '>' + (rev.aiExportLoading ? '' : ICONS.download) + (rev.aiExportLoading ? 'Đang kiểm tra & xuất...' : ' Xuất JSON cho AI') + '</button>' : '') +
            (isDoctor ? '<button type="button" class="btn btn--secondary" data-action="load-ai-payload">' + ICONS.code + ' Xem gói chuẩn cũ</button>' : '') +
            '<button type="button" class="btn btn--primary" data-action="open-create-revision">Tạo bản sửa mới</button>' +
          '</div>' +
        '</div>' +
        renderAiQualityPanel() +
        (rev.showAiPayload && rev.aiInputPayload ? (
          '<div>' +
            '<div class="field__meta-row" style="margin-bottom:8px;"><strong>Gói dữ liệu chuẩn hóa JSON (phiên bản cũ)</strong><button type="button" class="btn btn--secondary btn--sm" data-action="copy-ai-payload">Sao chép JSON</button></div>' +
            '<pre class="json-viewer">' + esc(JSON.stringify(rev.aiInputPayload, null, 2)) + '</pre>' +
          '</div>'
        ) : '') +
      '</section>'
    );

    const perfDoctorName = v.performedByName || v.performingDoctorName || v.createdByName || '';
    const lastEditorName = v.updatedByName || v.lastEditedByName || '';

    const body =
      '<div class="page-head">' +
        '<div><h1 class="page-head__title">Xem lại &amp; Xác nhận dữ liệu lượt khám</h1><p class="page-head__sub"><span class="mono">' + esc(pt ? pt.patientCode : '') + '</span> · ' + esc(pt ? pt.fullName : '') + ' · <span class="mono">' + esc(v.visitCode) + '</span>' +
          (perfDoctorName ? ' · Bác sĩ thực hiện: <strong>' + esc(perfDoctorName) + '</strong>' : '') +
          (lastEditorName ? ' · Chỉnh sửa gần nhất: <strong>' + esc(lastEditorName) + '</strong>' : '') +
        '</p></div>' +
        '<div class="page-head__actions">' +
          '<button type="button" class="btn btn--secondary" data-action="scroll-to-ai-readiness">' + ICONS.down + ' Tới phần độ sẵn sàng AI</button>' +
          '<button type="button" class="btn btn--secondary" data-nav="#/visits/' + esc(v.id) + '">' + ICONS.arrowLeft + ' Về biểu mẫu lượt khám</button>' +
        '</div>' +
      '</div>' +
      '<div class="stats-4">' +
        '<div class="stat-card stat-card--blue"><div class="stat-card__label">Đã nhập</div><div class="stat-card__num">' + r.totalAnswered + '</div></div>' +
        '<div class="stat-card stat-card--muted"><div class="stat-card__label">Chưa điền</div><div class="stat-card__num">' + r.totalUnfilled + '</div></div>' +
        '<div class="stat-card stat-card--info"><div class="stat-card__label">Đã chọn "Chưa rõ"</div><div class="stat-card__num">' + r.totalUnknown + '</div></div>' +
        '<div class="stat-card stat-card--error"><div class="stat-card__label">Cần kiểm tra</div><div class="stat-card__num">' + r.totalErrors + '</div></div>' +
      '</div>' +
      tier3Box +
      '<section class="card">' +
        '<div class="card__header"><div><h2 class="card__title">Tổng hợp rà soát theo 8 nhóm biểu mẫu</h2><p class="card__subtitle">Bấm "Mở nhóm" để quay lại chỉnh sửa trực tiếp từng nhóm trên biểu mẫu.</p></div></div>' +
        '<div class="table-wrap"><table class="data-table"><thead><tr><th>Nhóm biểu mẫu</th><th>Đã nhập</th><th>Chưa điền</th><th>Chưa rõ</th><th>Lỗi kiểm tra</th><th style="text-align:right;">Thao tác</th></tr></thead><tbody>' + secRows + '</tbody></table></div>' +
      '</section>' +
      '<div class="mobile-cards" style="margin-top:12px;">' + secCards + '</div>' +
      enteredSummaryHtml +
      '<section class="card" id="review-ai-readiness" style="margin-top:16px;">' +
        '<div class="card__header"><div><h2 class="card__title">Đối chiếu độ sẵn sàng dữ liệu cho 4 Module AI (Danh sách dự kiến, chờ nhóm AI xác nhận)</h2><p class="card__subtitle">Chỉ mang tính tham khảo đối chiếu — <strong>không chặn xác nhận lượt khám</strong> và không chạy dự đoán AI trong phạm vi hệ thống thu thập dữ liệu.</p></div>' +
        (isFormV12(fv, rev.formRes && rev.formRes.fieldDefinitions)
          ? '<button type="button" class="btn btn--primary btn--sm" data-nav="#/visits/' + esc(v.id) + '/workflow">Chạy luồng 4 Module theo từng bước ' + ICONS.arrowRight + '</button>'
          : '') +
        '</div>' +
        '<div class="card__body"><div class="ai-module-grid">' + tier4Cards + '</div></div>' +
      '</section>' +
      gateHtml + revisionsHtml;

    const crumbs =
      '<button type="button" class="breadcrumbs__link" data-nav="#/patients">Hồ sơ bệnh nhân</button><span>/</span>' +
      '<button type="button" class="breadcrumbs__link mono" data-nav="#/patients/' + esc(v.patientId) + '">' + esc(pt ? pt.patientCode : 'BN') + '</button><span>/</span>' +
      '<button type="button" class="breadcrumbs__link mono" data-nav="#/visits/' + esc(v.id) + '">' + esc(v.visitCode) + '</button><span>/</span>' +
      '<span class="breadcrumbs__current">Xem lại &amp; Xác nhận</span>';
    return renderShell(crumbs, body);
  }

  /* ------------------------------------------------------------------------
     Workflow 4-Module AI (hf-workflow/1.0): Loader, Actions & Renderer
     ------------------------------------------------------------------------ */
  function wfFormatModuleTitle(modCode) {
    if (!modCode) return '';
    const norm = String(modCode).trim().toLowerCase();
    const m = WF_MODULE_META[norm];
    return m ? ('Module ' + m.num) : String(modCode).trim();
  }

  function wfFormatStateInfo(st, ms) {
    if (st === 'locked') return { label: 'Đã khóa', badgeCls: 'neutral' };
    if (st === 'needs_input') return { label: 'Cần nhập', badgeCls: 'warn' };
    if (st === 'ready') return { label: 'Sẵn sàng chạy', badgeCls: 'info' };
    if (st === 'running') return { label: 'Đang chạy...', badgeCls: 'info' };
    if (st === 'ran') return { label: 'Chờ duyệt', badgeCls: 'blue' };
    if (st === 'accepted') {
      return {
        label: (ms && ms.decisionSource === 'manual') ? 'Đã chốt · Tự nhập' : 'Đã chốt',
        badgeCls: 'success'
      };
    }
    if (st === 'stale') return { label: 'Cần chạy lại', badgeCls: 'error' };
    return { label: String(st || 'Chưa xác định'), badgeCls: 'neutral' };
  }

  function wfBuildMedicationLabelMap(wf) {
    const map = {};
    function registerList(list) {
      if (!Array.isArray(list)) return;
      list.forEach(function (d) {
        if (!d || typeof d !== 'object') return;
        const id = d.id != null ? String(d.id).trim() : '';
        if (!id) return;
        const name = String(d.display || d.drugName || d.ingredient || d.activeIngredient || d.ingredientCode || '').trim();
        if (!name) return;
        const hasDose = d.dose !== null && d.dose !== undefined && String(d.dose).trim() !== '';
        const unit = String(d.unit || d.doseUnit || '').trim();
        const label = hasDose ? (name + ' ' + String(d.dose).trim() + (unit ? (' ' + unit) : '')) : name;
        if (!map[id] || (hasDose && map[id].indexOf(String(d.dose).trim()) < 0)) {
          map[id] = label;
        }
      });
    }
    if (!wf) return map;
    // Priority: visit medications -> M4 run snapshot -> workflow fields -> M3 effective decision -> active selectedPrescription
    if (wf.visitDetail && Array.isArray(wf.visitDetail.medications)) registerList(wf.visitDetail.medications);
    const m4ms = wf.data && wf.data.modules && wf.data.modules.m4;
    const m4Run = m4ms && m4ms.latestRunId && wf.runCache && wf.runCache[m4ms.latestRunId];
    if (m4Run && m4Run.inputSnapshot) {
      const snapFields = m4Run.inputSnapshot.fields || {};
      if (snapFields.medications && Array.isArray(snapFields.medications.value)) registerList(snapFields.medications.value);
      if (snapFields.selected_medications && Array.isArray(snapFields.selected_medications.value)) registerList(snapFields.selected_medications.value);
      if (m4Run.inputSnapshot.selectedPrescription && Array.isArray(m4Run.inputSnapshot.selectedPrescription.items)) {
        registerList(m4Run.inputSnapshot.selectedPrescription.items);
      }
    }
    if (wf.fieldValues) {
      if (wf.fieldValues.medications && Array.isArray(wf.fieldValues.medications.value)) registerList(wf.fieldValues.medications.value);
      if (wf.fieldValues.selected_medications && Array.isArray(wf.fieldValues.selected_medications.value)) registerList(wf.fieldValues.selected_medications.value);
    }
    const m3ms = wf.data && wf.data.modules && wf.data.modules.m3;
    const m3Dec = m3ms && m3ms.effectiveDecisionId && wf.decisionCache && wf.decisionCache[m3ms.effectiveDecisionId];
    if (m3Dec && m3Dec.selectedPrescription && Array.isArray(m3Dec.selectedPrescription.items)) {
      registerList(m3Dec.selectedPrescription.items);
    }
    if (wf.selectedPrescription && Array.isArray(wf.selectedPrescription.items)) {
      registerList(wf.selectedPrescription.items);
    }
    // Support future pharmacist payload if backend includes medications/selectedPrescription
    if (wf.data) {
      if (Array.isArray(wf.data.medications)) registerList(wf.data.medications);
      if (wf.data.selectedPrescription && Array.isArray(wf.data.selectedPrescription.items)) registerList(wf.data.selectedPrescription.items);
    }
    return map;
  }

  function wfFormatFollowupItemHtml(f) {
    if (typeof f === 'string') {
      const s = f.trim();
      return s ? ('<li>' + esc(s) + '</li>') : '';
    }
    if (f && typeof f === 'object') {
      const hm = String(f.hang_muc || '').trim();
      const td = String(f.thoi_diem || '').trim();
      const ld = String(f.ly_do || '').trim();
      if (!hm && !td && !ld) return '';
      let html = '';
      if (hm) html += '<strong>' + esc(hm) + '</strong>';
      if (td) html += (html ? ' ' : '') + '(' + esc(td) + ')';
      if (ld) html += (html ? ': ' : '') + esc(ld);
      return '<li>' + html + '</li>';
    }
    return '';
  }

  function wfHydrateFieldValuesFromVisit(wf) {
    const map = {};
    const detail = wf.visitDetail;
    const formRes = wf.formRes;
    const pt = wf.patient;
    const v = wf.visit;
    const defById = {};
    const defByCode = {};
    ((formRes && formRes.fieldDefinitions) || []).forEach(function (fd) {
      defById[fd.id] = fd;
      defByCode[fd.code] = fd;
    });

    if (pt) {
      const age = computeAge(pt, v && v.visitDate);
      if (age !== null) map.age = { value_state: 'answered', value: age };
      if (pt.sex === 'male' || pt.sex === 'female') map.sex = { value_state: 'answered', value: pt.sex };
    }

    if (detail) {
      (detail.values || []).forEach(function (vv) {
        const fd = defById[vv.fieldDefinitionId] || defByCode[vv.fieldCode];
        const code = (fd && fd.code) || vv.fieldCode;
        if (!code) return;
        const c = visitValueToCompact(code, vv, fd);
        if (c) map[code] = c;
      });
      (detail.labResults || []).forEach(function (lr) {
        if (!lr || !lr.labCode) return;
        if (lr.valueNum !== null && lr.valueNum !== undefined) {
          map[lr.labCode] = { value_state: 'answered', value: Number(lr.valueNum), unit: lr.unit || null, measuredAt: lr.measuredAt || null };
        }
      });
      // List states for diagnoses, medications, allergies
      const dxState = (v && v.diagnosisListState) || ((detail.diagnoses || []).length > 0 ? 'known' : 'unknown');
      if (dxState === 'known' || dxState === 'none') {
        map.diagnoses = { value_state: 'answered', value: (detail.diagnoses || []).map(function (d) { return d.code; }).filter(Boolean) };
      } else {
        map.diagnoses = { value_state: 'unknown', value: null };
      }
      const medState = (v && v.medicationListState) || ((detail.medications || []).length > 0 ? 'known' : 'unknown');
      if (medState === 'known' || medState === 'none') {
        map.medications = { value_state: 'answered', value: clone(detail.medications || []) };
      } else {
        map.medications = { value_state: 'unknown', value: null };
      }
      const algState = (v && v.allergyListState) || ((detail.allergies || []).length > 0 ? 'known' : 'unknown');
      if (algState === 'known' || algState === 'none') {
        map.allergies = { value_state: 'answered', value: clone(detail.allergies || []) };
      } else {
        map.allergies = { value_state: 'unknown', value: null };
      }
    }

    // Also overlay fields from workflow response if backend includes them or from latest run snapshot
    if (wf.data && wf.data.fields && typeof wf.data.fields === 'object') {
      Object.keys(wf.data.fields).forEach(function (k) {
        map[k] = clone(wf.data.fields[k]);
      });
    }
    WF_MODULE_ORDER.forEach(function (mod) {
      const ms = wf.data && wf.data.modules && wf.data.modules[mod];
      const run = ms && ms.latestRunId && wf.runCache[ms.latestRunId];
      if (run && run.inputSnapshot && run.inputSnapshot.fields) {
        Object.keys(run.inputSnapshot.fields).forEach(function (k) {
          if (!map[k]) map[k] = clone(run.inputSnapshot.fields[k]);
        });
      }
    });

    wf.fieldValues = map;
  }

  function wfSyncM4DraftFromOutput(wf, output, keepExisting) {
    if (!output || !Array.isArray(output.canh_bao)) return;
    const savedByAlert = {};
    (output.xac_nhan_bac_si || []).forEach(function (c) {
      if (c && c.alertId) savedByAlert[c.alertId] = c;
    });
    const next = {};
    output.canh_bao.forEach(function (al) {
      const existing = keepExisting && wf.m4Decisions[al.id];
      const saved = savedByAlert[al.id];
      if (existing && (existing.quyet_dinh || existing.ly_do)) {
        next[al.id] = existing;
      } else if (saved) {
        next[al.id] = { quyet_dinh: saved.quyet_dinh || '', ly_do: saved.ly_do || '', error: '' };
      } else {
        next[al.id] = { quyet_dinh: '', ly_do: '', error: '' };
      }
    });
    wf.m4Decisions = next;
  }

  function wfUpsertHistoryRun(wf, mod, run) {
    if (!run || !run.id) return;
    wf.runCache[run.id] = run;
    const list = (wf.historyRuns[mod] || []).filter(function (r) { return r && r.id !== run.id; });
    list.push(run);
    list.sort(function (a, b) { return (b.attempt || 0) - (a.attempt || 0); });
    wf.historyRuns[mod] = list;
  }

  async function wfHydrateModuleArtifacts(wf) {
    if (!wf.data || wf.isPharmacistView || !wf.data.modules) return;
    const tasks = [];
    WF_MODULE_ORDER.forEach(function (mod) {
      const ms = wf.data.modules[mod];
      if (!ms) return;
      // BUG-09: Proactively fetch full run history list (GET /workflow/{mod}/runs) when attempts exist
      if (ms.attemptCount > 0) {
        tasks.push(
          api.listWorkflowRuns(wf.visitId, mod)
            .then(function (res) {
              const list = Array.isArray(res) ? res : ((res && Array.isArray(res.items)) ? res.items : ((res && Array.isArray(res.runs)) ? res.runs : null));
              if (list && list.length > 0) {
                list.forEach(function (r) { wfUpsertHistoryRun(wf, mod, r); });
              }
            })
            .catch(function () {})
        );
      }
      if (ms.latestRunId) {
        if (wf.runCache[ms.latestRunId]) {
          wfUpsertHistoryRun(wf, mod, wf.runCache[ms.latestRunId]);
        } else {
          tasks.push(
            api.getWorkflowRun(wf.visitId, mod, ms.latestRunId)
              .then(function (run) { wfUpsertHistoryRun(wf, mod, run); })
              .catch(function () {})
          );
        }
      }
      if (ms.effectiveDecisionId && !wf.decisionCache[ms.effectiveDecisionId]) {
        tasks.push(
          api.getWorkflowDecision(wf.visitId, mod, ms.effectiveDecisionId)
            .then(function (dec) {
              if (dec && dec.id) wf.decisionCache[dec.id] = dec;
            })
            .catch(function () {})
        );
      }
    });
    // F3 / BUG-10: Fetch GET /workflow?module=m4 projection for assigned doctor so saved M4 confirmations survive reload
    const m4ms = wf.data.modules.m4;
    if (m4ms && (m4ms.state === 'ran' || m4ms.state === 'accepted' || m4ms.state === 'stale')) {
      tasks.push(
        api.getVisitWorkflow(wf.visitId, { module: 'm4' })
          .then(function (m4View) {
            wf.m4ProjectionOutput = (m4View && m4View.output) ? m4View.output : null;
          })
          .catch(function () {})
      );
    } else {
      wf.m4ProjectionOutput = null;
    }
    if (tasks.length > 0) await Promise.all(tasks);
  }

  async function loadWorkflow(visitId, opts) {
    const o = opts || {};
    const wf = state.workflow;
    const isSameVisit = wf.visitId === visitId;
    wf.visitId = visitId;
    wf.loading = !o.silent;
    wf.error = '';
    wf.errorStatus = null;
    wf.errorCode = '';
    if (!o.keepBanner) {
      wf.bannerError = '';
      wf.bannerErrorStatus = null;
      wf.bannerErrorCode = '';
      wf.bannerErrorFields = [];
    }
    if (!isSameVisit) {
      wf.data = null;
      wf.visit = null;
      wf.patient = null;
      wf.formRes = null;
      wf.visitDetail = null;
      wf.activeModule = 'm1';
      wf.manualModeModule = null;
      wf.manualDraft = null;
      wf.manualReason = '';
      wf.manualReasonError = '';
      wf.historyOpen = {};
      wf.historyRuns = {};
      wf.historySelectedRun = {};
      wf.runCache = {};
      wf.decisionCache = {};
      wf.expandedUpstream = {};
      wf.fieldValues = {};
      wf.fieldMetadata = {};
      wf.observations = [];
      wf.recentTestEvidence = {};
      wf.recentTestEvidenceDirty = false;
      wf.m4ProjectionOutput = null;
      wf.fieldErrors = {};
      wf.m4Decisions = {};
      wf.lastRunErrors = {};
      wf.selectedPrescription = { value_state: 'answered', listState: 'none', items: [] };
    }
    wf.isPharmacistView = Boolean(state.user && state.user.role === 'pharmacist');
    if (!o.silent) render();

    try {
      if (wf.isPharmacistView) {
        const res = await api.getVisitWorkflow(visitId, { module: 'm4' });
        wf.data = res;
        wf.activeModule = 'm4';
        if (res && res.output) wfSyncM4DraftFromOutput(wf, res.output, false);
      } else {
        const [wfRes, fieldsRes, visitDetail, formRes] = await Promise.all([
          api.getVisitWorkflow(visitId),
          api.getWorkflowFields(visitId, 'm2').catch(function () { return null; }),
          api.getVisit(visitId).catch(function () { return null; }),
          api.getVisitForm(visitId).catch(function () { return null; })
        ]);
        wf.data = wfRes;
        if (fieldsRes) {
          if (fieldsRes.fields && typeof fieldsRes.fields === 'object') {
            wf.data = Object.assign({}, wfRes, { fields: fieldsRes.fields });
          }
          if (Array.isArray(fieldsRes.observations)) {
            wf.observations = clone(fieldsRes.observations);
          }
          if (fieldsRes.recentTestEvidence && typeof fieldsRes.recentTestEvidence === 'object' && !wf.recentTestEvidenceDirty) {
            wf.recentTestEvidence = clone(fieldsRes.recentTestEvidence);
          }
          if (fieldsRes.fieldMetadata && typeof fieldsRes.fieldMetadata === 'object') {
            wf.fieldMetadata = clone(fieldsRes.fieldMetadata);
          }
        }
        if (visitDetail) {
          wf.visitDetail = visitDetail;
          wf.visit = visitDetail.visit || null;
          if (visitDetail.fieldMetadata && typeof visitDetail.fieldMetadata === 'object') {
            wf.fieldMetadata = clone(visitDetail.fieldMetadata);
          }
        }
        if (formRes) wf.formRes = formRes;
        if (wf.visit && wf.visit.patientId && (!wf.patient || wf.patient.id !== wf.visit.patientId)) {
          try {
            const ptRes = await api.getPatient(wf.visit.patientId);
            wf.patient = ptRes && ptRes.patient ? ptRes.patient : null;
          } catch (_e) {}
        }
        await wfHydrateModuleArtifacts(wf);
        wfHydrateFieldValuesFromVisit(wf);

        // Hydrate M3 selectedPrescription from effective M3 decision if present
        const m3ms = wf.data && wf.data.modules && wf.data.modules.m3;
        const m3dec = m3ms && m3ms.effectiveDecisionId && wf.decisionCache[m3ms.effectiveDecisionId];
        if (m3dec && m3dec.selectedPrescription && !o.keepPrescription) {
          wf.selectedPrescription = clone(m3dec.selectedPrescription);
        }

        // Hydrate M4 confirmations from GET /workflow?module=m4 projection first, then decision/run
        const m4ms = wf.data && wf.data.modules && wf.data.modules.m4;
        const m4dec = m4ms && m4ms.effectiveDecisionId && wf.decisionCache[m4ms.effectiveDecisionId];
        const m4run = m4ms && m4ms.latestRunId && wf.runCache[m4ms.latestRunId];
        const m4Out = wf.m4ProjectionOutput || (m4dec && m4dec.output) || (m4run && m4run.output) || null;
        if (m4Out) wfSyncM4DraftFromOutput(wf, m4Out, Boolean(o.keepM4Draft));

        if (wf.preferredModuleOnLoad && wf.data && wf.data.modules && wf.data.modules[wf.preferredModuleOnLoad] && wf.data.modules[wf.preferredModuleOnLoad].state !== 'locked') {
          wf.activeModule = wf.preferredModuleOnLoad;
          wf.preferredModuleOnLoad = null;
        } else if (!o.keepModule && wf.data && wf.data.modules) {
          const preferred = WF_MODULE_ORDER.find(function (m) {
            const st = wf.data.modules[m] && wf.data.modules[m].state;
            return st && st !== 'locked' && st !== 'accepted';
          });
          wf.activeModule = preferred || (wf.data.modules.m4 && wf.data.modules.m4.state !== 'locked' ? 'm4' : 'm1');
        }
      }
    } catch (err) {
      wf.errorStatus = (err && err.status) || 0;
      wf.errorCode = (err && err.code) || '';
      if (err && err.status === 401) return handleAuthOrError(err);
      if (err && err.status === 403) {
        wf.error = 'Bạn không có quyền thực hiện thao tác này trên luồng 4 Module AI.';
      } else if (err && err.status === 404) {
        wf.error = NOT_FOUND_OR_NO_ACCESS_MSG;
      } else if (err && err.status === 0) {
        wf.error = 'Không thể kết nối máy chủ — dữ liệu chưa được chạy hoặc chốt. Kiểm tra mạng và thử lại.';
      } else {
        wf.error = (err && err.detail) || 'Không tải được trạng thái luồng 4 Module AI.';
      }
    } finally {
      wf.loading = false;
      render();
    }
  }

  function wfGetEffectiveOrLatestOutput(wf, mod) {
    if (wf.isPharmacistView) {
      return {
        output: wf.data ? wf.data.output : null,
        source: 'ai',
        attempt: null,
        engine: 'mock-rules',
        rulesVersion: 'mock-1.1',
        timestamp: null,
        runId: null,
        decisionId: null
      };
    }
    const ms = wf.data && wf.data.modules && wf.data.modules[mod];
    if (!ms) return null;
    const dec = ms.effectiveDecisionId ? wf.decisionCache[ms.effectiveDecisionId] : null;
    const latestRun = ms.latestRunId ? wf.runCache[ms.latestRunId] : null;
    const selRunId = wf.historySelectedRun[mod];
    const viewingRun = selRunId && wf.runCache[selRunId] ? wf.runCache[selRunId] : null;
    if (viewingRun && viewingRun.output) {
      return {
        output: viewingRun.output,
        source: 'ai',
        attempt: viewingRun.attempt,
        engine: viewingRun.engine || (wf.data && wf.data.engine) || 'mock-rules',
        rulesVersion: viewingRun.rulesVersion || (viewingRun.output && viewingRun.output.rulesVersion) || 'mock-1.1',
        timestamp: viewingRun.finishedAt || viewingRun.startedAt,
        runId: viewingRun.id,
        decisionId: null,
        isHistoryPreview: viewingRun.id !== ms.latestRunId
      };
    }
    if (ms.state === 'accepted' && dec && dec.output) {
      return {
        output: dec.output,
        source: dec.source || ms.decisionSource || 'ai',
        attempt: (latestRun && latestRun.attempt) || ms.attemptCount || 1,
        engine: (latestRun && latestRun.engine) || (wf.data && wf.data.engine) || 'mock-rules',
        rulesVersion: (latestRun && latestRun.rulesVersion) || (dec.output && dec.output.rulesVersion) || 'mock-1.1',
        timestamp: dec.decidedAt,
        runId: dec.runId || ms.latestRunId,
        decisionId: dec.id,
        manualReason: dec.manualReason || null
      };
    }
    if (latestRun && latestRun.output) {
      return {
        output: latestRun.output,
        source: 'ai',
        attempt: latestRun.attempt || ms.attemptCount || 1,
        engine: latestRun.engine || (wf.data && wf.data.engine) || 'mock-rules',
        rulesVersion: latestRun.rulesVersion || (latestRun.output && latestRun.output.rulesVersion) || 'mock-1.1',
        timestamp: latestRun.finishedAt || latestRun.startedAt,
        runId: latestRun.id,
        decisionId: null
      };
    }
    return null;
  }

  function wfApplyApiErrorBanner(err, mod) {
    const wf = state.workflow;
    const meta = WF_MODULE_META[mod] || { num: 1 };
    const status = (err && err.status) || 0;
    const code = (err && err.code) || '';
    wf.bannerErrorStatus = status;
    wf.bannerErrorCode = code;
    wf.bannerErrorFields = [];
    if (status === 401) {
      handleAuthOrError(err);
      return;
    }
    if (status === 403) {
      wf.bannerError = 'Bạn không có quyền thực hiện thao tác này trên luồng 4 Module AI.';
    } else if (status === 409) {
      if (code === 'WORKFLOW_UPSTREAM_NOT_ACCEPTED') {
        const prevNum = Math.max(1, meta.num - 1);
        wf.bannerError = 'Không thể chạy Module ' + meta.num + ': Module ' + prevNum + ' chưa được chốt hoặc đang ở trạng thái cần chạy lại. Vui lòng hoàn tất Module ' + prevNum + ' trước.';
      } else if (code === 'CONCURRENCY_ROW_VERSION_MISMATCH' || code === 'WORKFLOW_RESULT_STALE' || code === 'INPUT_CHANGED_DURING_RUN') {
        wf.bannerError = 'Lượt khám vừa được cập nhật ở phiên khác (HTTP 409). Hãy tải lại dữ liệu mới nhất trước khi tiếp tục.';
      } else {
        wf.bannerError = (err && err.detail) || ('Xung đột trạng thái workflow (HTTP 409) tại Module ' + meta.num + '.');
      }
    } else if (status === 422) {
      const errs = Array.isArray(err && err.errors) ? err.errors : [];
      wf.bannerErrorFields = errs;
      errs.forEach(function (e) {
        if (e && e.fieldCode) wf.fieldErrors[e.fieldCode] = e.message || 'Giá trị chưa hợp lệ';
      });
      wf.bannerError = errs.length > 0
        ? ('Chưa thể chạy Module ' + meta.num + ': phát hiện ' + errs.length + ' trường thiếu hoặc ngoài khoảng hợp lệ. Bấm vào từng mục bên dưới để nhảy tới ô cần sửa.')
        : ((err && err.detail) || ('Dữ liệu chưa hợp lệ (HTTP 422) tại Module ' + meta.num + '.'));
    } else if (status === 0 || status === 503 || status === 504) {
      wf.bannerError = 'Không thể kết nối máy chủ — dữ liệu chưa được chạy hoặc chốt. Kiểm tra mạng và thử lại.';
    } else {
      wf.bannerError = (err && err.detail) || 'Đã xảy ra lỗi khi xử lý yêu cầu workflow.';
    }
  }

  async function wfSaveRecentTestEvidence(opts) {
    const wf = state.workflow;
    if (!wf.data || wf.savingFields || wf.runningModule) return false;
    if (!wf.recentTestEvidenceDirty) return true;
    wf.savingFields = true;
    wf.bannerError = '';
    wf.bannerErrorFields = [];
    render();
    try {
      const payload = {
        module: 'm2',
        rowVersion: wf.data.rowVersion,
        fields: {},
        recentTestEvidence: clone(wf.recentTestEvidence || {})
      };
      const res = await api.saveWorkflowFields(wf.visitId, 'm2', payload, wf.data.rowVersion);
      wf.recentTestEvidenceDirty = false;
      const inv = (res && Array.isArray(res.invalidatedModules) && res.invalidatedModules.length > 0) ? res.invalidatedModules : [];
      if (!opts || !opts.quiet) {
        toast(
          inv.length > 0
            ? ('Đã lưu xác nhận dùng lại xét nghiệm. Các bước cần chạy lại: ' + inv.map(wfFormatModuleTitle).join(', ') + '.')
            : 'Đã lưu xác nhận dùng lại xét nghiệm gần đây.',
          inv.length > 0 ? 'warn' : 'success'
        );
      }
      await loadWorkflow(wf.visitId, { silent: true, keepModule: true, keepPrescription: true, keepM4Draft: true });
      return true;
    } catch (err) {
      wfApplyApiErrorBanner(err, 'm2');
      render();
      return false;
    } finally {
      wf.savingFields = false;
      render();
    }
  }

  async function wfRunModule(mod) {
    const wf = state.workflow;
    if (!wf.data || wf.runningModule || wf.submittingAction) return;
    if (mod === 'm2' && wf.recentTestEvidenceDirty) {
      const savedOk = await wfSaveRecentTestEvidence({ quiet: true });
      if (!savedOk) return;
    }
    wf.runningModule = mod;
    wf.bannerError = '';
    wf.bannerErrorFields = [];
    render();
    try {
      const payload = { module: mod, rowVersion: wf.data.rowVersion };
      const receipt = await api.runWorkflowModule(wf.visitId, mod, payload, wf.data.rowVersion, makeIdempotencyKey('wf-run-' + mod));
      wf.manualModeModule = null;
      delete wf.historySelectedRun[mod];
      delete wf.lastRunErrors[mod];
      if (receipt && receipt.runId) {
        try {
          const fullRun = await api.getWorkflowRun(wf.visitId, mod, receipt.runId);
          wfUpsertHistoryRun(wf, mod, fullRun);
        } catch (_e) {}
      }
      toast('Đã chạy ' + wfFormatModuleTitle(mod) + (receipt && receipt.attempt ? (' (Lần #' + receipt.attempt + ')') : '') + '.', 'success');
      await loadWorkflow(wf.visitId, { silent: true, keepModule: true, keepPrescription: true });
    } catch (err) {
      wfApplyApiErrorBanner(err, mod);
      if (err && (err.status === 503 || err.status === 504)) {
        wf.lastRunErrors[mod] = { code: err.code || 'ENGINE_UNAVAILABLE', detail: err.detail || 'Lỗi chạy mô phỏng.' };
      }
      render();
    } finally {
      wf.runningModule = null;
      render();
    }
  }

  function wfBuildManualSkeleton(mod, baseOutput) {
    if (baseOutput) {
      const copy = clone(baseOutput);
      delete copy.engine;
      delete copy.rulesVersion;
      delete copy.displayLabel;
      delete copy.clinicalUse;
      delete copy.author;
      return copy;
    }
    if (mod === 'm1') {
      return {
        stage: null,
        xac_suat_suy_tim: { muc: 'Chưa đủ dữ liệu để kết luận', xac_suat: null },
        kieu_hinh_ef: 'Chưa phân loại do thiếu EF',
        benh_canh: null,
        xep_hang_nguyen_nhan: [],
        canh_bao_gia_suy_tim: [],
        frailty_dung_nap: 'Bác sĩ tự đánh giá lâm sàng',
        du_bao_nguy_co: { nhap_vien: null, tu_vong: null, te_nga: null, sang: null, suy_giam_chuc_nang: null, mat_tu_cham_soc: null },
        canh_bao_cap_cuu: [],
        dataGaps: []
      };
    }
    if (mod === 'm2') {
      const goiY = {};
      WF_M2_TESTS.forEach(function (t) {
        goiY[t.key] = { trang_thai: 'Không đề xuất', ly_do: 'Bác sĩ tự đánh giá chỉ định' };
      });
      return {
        goi_y_chi_dinh: goiY,
        phan_loai_ket_qua: 'Chưa đủ bằng chứng',
        muc_uu_tien: 'Trong đợt khám hiện tại',
        loi_ich_nguy_co: 'Bác sĩ tự cân nhắc lợi ích và nguy cơ cận lâm sàng.',
        canh_bao_xam_lan: 'Không chỉ định thăm dò xâm lấn chỉ dựa trên tuổi đơn thuần.',
        khoa_trung_lap: [],
        dataGaps: []
      };
    }
    if (mod === 'm3') {
      const khuyenNghi = {};
      WF_M3_KHUYEN_NGHI_KEYS.forEach(function (k) {
        khuyenNghi[k.key] = { ap_dung: 'chua_ro', noi_dung: 'Bác sĩ tự đánh giá', ly_do: 'Nhập tay theo bối cảnh lâm sàng' };
      });
      const nhomThuoc = {};
      WF_M3_DRUG_GROUPS.forEach(function (g) {
        nhomThuoc[g.key] = { muc: 'Cân nhắc', ly_do: 'Bác sĩ tự đánh giá' };
      });
      return {
        stage: null,
        kieu_hinh_ef: 'Chưa phân loại do thiếu EF',
        dinh_huong: 'Bác sĩ tự nhập định hướng điều trị',
        khuyen_nghi: khuyenNghi,
        nhom_thuoc: nhomThuoc,
        ke_hoach_do_lieu: 'Theo dõi và dò liều theo đánh giá bác sĩ.',
        ke_hoach_theo_doi: [{ hang_muc: 'Tái khám lâm sàng & điện giải/creatinin', thoi_diem: 'Theo lịch bác sĩ chọn', ly_do: 'Đánh giá dung nạp điều trị' }],
        don_thuoc_de_xuat: { items: [], ghi_chu: 'Bác sĩ tự quyết định phương án đơn thuốc.' },
        dataGaps: []
      };
    }
    return {
      canh_bao: [],
      de_xuat_chinh_lieu: [],
      don_gian_hoa_phac_do: [],
      giam_ngung_thuoc: [],
      ke_hoach_theo_doi: [],
      xac_nhan_bac_si: [],
      coverage: 'incomplete',
      dataGaps: ['Đánh giá an toàn thuốc do bác sĩ tự nhập'],
      auto_change_medication: false
    };
  }

  function wfOpenManualOverride(mod) {
    const wf = state.workflow;
    wf.manualModeModule = mod;
    wf.editingModule = null;
    wf.manualReason = '';
    wf.manualReasonError = '';
    const latest = wfGetEffectiveOrLatestOutput(wf, mod);
    const skeleton = wfBuildManualSkeleton(mod, null);
    if (mod === 'm4' && latest && latest.output && Array.isArray(latest.output.canh_bao)) {
      skeleton.canh_bao = clone(latest.output.canh_bao);
      wfSyncM4DraftFromOutput(wf, latest.output, true);
    }
    wf.manualDraft = skeleton;
    render();
  }

  function wfPrefillManualFromAi(mod) {
    const wf = state.workflow;
    const ms = wf.data && wf.data.modules && wf.data.modules[mod];
    const run = ms && ms.latestRunId ? wf.runCache[ms.latestRunId] : null;
    if (!run || !run.output) {
      toast('Chưa có kết quả AI gần nhất để điền sẵn.', 'warn');
      return;
    }
    wf.manualDraft = wfBuildManualSkeleton(mod, run.output);
    if (mod === 'm4') wfSyncM4DraftFromOutput(wf, run.output, true);
    toast('Đã điền sẵn từ kết quả AI lần #' + (run.attempt || ms.attemptCount || 1) + ' — hãy chỉnh sửa các mục cần thay đổi.', 'info');
    render();
  }

  function wfSanitizePrescription(sp) {
    const raw = sp || { value_state: 'answered', listState: 'none', items: [] };
    const items = Array.isArray(raw.items) ? raw.items.map(function (it, idx) {
      const dNum = (it.dose === null || it.dose === undefined || it.dose === '') ? null : Number(it.dose);
      const tpdNum = (it.timesPerDay === null || it.timesPerDay === undefined || it.timesPerDay === '') ? null : Number(it.timesPerDay);
      const doseValid = dNum !== null && isFinite(dNum) && dNum > 0;
      const hasFullDetail = doseValid && Boolean(it.doseUnit) && tpdNum !== null && isFinite(tpdNum) && tpdNum > 0 && Boolean(it.route);
      return {
        id: it.id || ('rx-' + (idx + 1)),
        ingredientCode: String(it.ingredientCode || it.display || ('drug_' + (idx + 1))).trim(),
        atcCode: it.atcCode || null,
        display: String(it.display || it.ingredientCode || ('Thuốc ' + (idx + 1))).trim(),
        detailState: hasFullDetail ? 'answered' : 'unknown',
        dose: doseValid ? dNum : null,
        doseUnit: it.doseUnit || null,
        timesPerDay: (tpdNum !== null && isFinite(tpdNum) && tpdNum > 0) ? tpdNum : null,
        route: it.route || null,
        action: it.action || 'start',
        replacesMedicationId: it.replacesMedicationId || null,
        therapeuticGroup: it.therapeuticGroup || 'other'
      };
    }) : [];
    return {
      value_state: 'answered',
      listState: items.length > 0 ? 'known' : 'none',
      items: items
    };
  }

  function wfValidateM4Confirmations(alerts, decisionsMap, opts) {
    const requireAllSerious = Boolean(opts && opts.requireAllSerious);
    const list = [];
    let hasError = false;
    (alerts || []).forEach(function (al) {
      const d = decisionsMap[al.id] || { quyet_dinh: '', ly_do: '', error: '' };
      d.error = '';
      const qd = d.quyet_dinh;
      const reason = String(d.ly_do || '').trim();
      if (al.muc_do === 'Nghiêm trọng') {
        if (!qd) {
          // BUG-11: Only require ALL serious alerts simultaneously on manual override submit;
          // partial incremental confirmation saves skip untouched alerts so doctor can confirm one-by-one.
          if (requireAllSerious || reason) {
            d.error = 'Cảnh báo mức Nghiêm trọng bắt buộc chọn Đồng ý hoặc Không đồng ý.';
            hasError = true;
          }
        } else if (!reason) {
          d.error = 'Vui lòng nhập lý do khi chọn "Không đồng ý" hoặc với cảnh báo mức Nghiêm trọng.';
          hasError = true;
        } else {
          list.push({ alertId: al.id, quyet_dinh: qd, ly_do: reason });
        }
      } else if (qd) {
        if (qd === 'Không đồng ý' && !reason) {
          d.error = 'Vui lòng nhập lý do khi chọn "Không đồng ý" hoặc với cảnh báo mức Nghiêm trọng.';
          hasError = true;
        } else {
          const item = { alertId: al.id, quyet_dinh: qd };
          if (reason) item.ly_do = reason;
          list.push(item);
        }
      }
      decisionsMap[al.id] = d;
    });
    return { valid: !hasError, confirmations: list };
  }

  async function wfSaveM4Confirmations() {
    const wf = state.workflow;
    if (!wf.data || wf.m4Saving || wf.runningModule) return;
    const m4ms = wf.data.modules && wf.data.modules.m4;
    const run = m4ms && m4ms.latestRunId ? wf.runCache[m4ms.latestRunId] : null;
    const alerts = (run && run.output && run.output.canh_bao) || [];
    // BUG-11: Allow partial confirmation saves when >= 2 Serious alerts exist
    const check = wfValidateM4Confirmations(alerts, wf.m4Decisions, { requireAllSerious: false });
    if (!check.valid || check.confirmations.length === 0) {
      if (check.confirmations.length === 0 && check.valid) {
        toast('Chọn ít nhất một quyết định Đồng ý / Không đồng ý trước khi lưu xác nhận.', 'warn');
      }
      render();
      return;
    }
    wf.m4Saving = true;
    wf.bannerError = '';
    render();
    try {
      const payload = {
        module: 'm4',
        rowVersion: wf.data.rowVersion,
        outputRef: m4ms.latestRunId,
        confirmations: check.confirmations
      };
      await api.submitM4Confirmations(wf.visitId, payload, wf.data.rowVersion, makeIdempotencyKey('m4-conf'));
      toast('Đã lưu xác nhận cảnh báo Module 4.', 'success');
      // F3: Reload fresh projection from GET /workflow?module=m4 without stale local cache
      await loadWorkflow(wf.visitId, { silent: true, keepModule: true, keepM4Draft: false });
    } catch (err) {
      wfApplyApiErrorBanner(err, 'm4');
      render();
    } finally {
      wf.m4Saving = false;
      render();
    }
  }

  async function wfSubmitDecisionAi(mod, intent) {
    const wf = state.workflow;
    if (!wf.data || wf.submittingAction || wf.runningModule) return;
    const ms = wf.data.modules && wf.data.modules[mod];
    if (!ms || !ms.latestRunId) return;
    wf.submittingAction = true;
    wf.bannerError = '';
    wf.bannerErrorFields = [];
    render();
    try {
      const payload = {
        module: mod,
        source: 'ai',
        runId: ms.latestRunId,
        rowVersion: wf.data.rowVersion
      };
      if (mod === 'm3') {
        payload.selectedPrescription = wfSanitizePrescription(wf.selectedPrescription);
      }
      if (intent) payload.intent = intent;
      const receipt = await api.submitWorkflowDecision(wf.visitId, mod, payload, wf.data.rowVersion, makeIdempotencyKey('dec-ai-' + mod));
      wf.editingModule = null;
      wf.manualModeModule = null;
      const meta = WF_MODULE_META[mod];
      if (intent === 'finish_workflow') {
        toast('Đã hoàn tất luồng 4 Module AI cho lượt khám ' + ((wf.visit && wf.visit.visitCode) || wf.visitId) + '.', 'success');
      } else if (meta && meta.next && (receipt && receipt.nextModule ? receipt.nextModule : meta.next)) {
        // U3: Switch view to next module ONLY — NEVER auto-run downstream module!
        wf.activeModule = (receipt && receipt.nextModule) || meta.next;
        toast('Đã chốt kết quả AI cho ' + wfFormatModuleTitle(mod) + '. Chuyển sang ' + wfFormatModuleTitle(wf.activeModule) + '.', 'success');
      } else {
        toast('Đã chọn sử dụng kết quả AI cho ' + wfFormatModuleTitle(mod) + '.', 'success');
      }
      await loadWorkflow(wf.visitId, { silent: true, keepModule: true, keepPrescription: true });
    } catch (err) {
      wfApplyApiErrorBanner(err, mod);
      render();
    } finally {
      wf.submittingAction = false;
      render();
    }
  }

  async function wfSubmitDecisionManual(mod) {
    const wf = state.workflow;
    if (!wf.data || wf.submittingAction || wf.runningModule || !wf.manualDraft) return;
    const trimmedReason = String(wf.manualReason || '').trim();
    if (!trimmedReason) {
      wf.manualReasonError = 'Vui lòng nhập lý do tự nhập / điều chỉnh so với kết quả AI.';
      render();
      return;
    }
    wf.manualReasonError = '';
    const output = clone(wf.manualDraft);
    if (mod === 'm3' && Array.isArray(output.ke_hoach_theo_doi)) {
      output.ke_hoach_theo_doi = output.ke_hoach_theo_doi.map(function (f) {
        if (typeof f === 'string') return f.trim();
        if (f && typeof f === 'object') {
          const hm = String(f.hang_muc || '').trim();
          const td = String(f.thoi_diem || '').trim();
          const ld = String(f.ly_do || '').trim();
          if (!hm && !td && !ld) return '';
          return (hm ? hm : '') + (td ? ((hm ? ' ' : '') + '(' + td + ')') : '') + (ld ? (((hm || td) ? ': ' : '') + ld) : '');
        }
        return '';
      }).filter(Boolean);
      if (output.ke_hoach_theo_doi.length === 0) {
        output.ke_hoach_theo_doi = ['Tái khám lâm sàng & điện giải/creatinin theo lịch bác sĩ'];
      }
    }
    if (mod === 'm4') {
      const check = wfValidateM4Confirmations(output.canh_bao || [], wf.m4Decisions, { requireAllSerious: true });
      if (!check.valid) {
        render();
        return;
      }
      output.xac_nhan_bac_si = check.confirmations;
      output.auto_change_medication = false;
    }
    wf.submittingAction = true;
    wf.bannerError = '';
    wf.bannerErrorFields = [];
    render();
    try {
      const payload = {
        module: mod,
        source: 'manual',
        output: output,
        rowVersion: wf.data.rowVersion,
        manualReason: trimmedReason
      };
      if (mod === 'm3') {
        payload.selectedPrescription = wfSanitizePrescription(wf.selectedPrescription);
      }
      if (mod === 'm4') {
        payload.intent = 'finish_workflow';
      }
      const receipt = await api.submitWorkflowDecision(wf.visitId, mod, payload, wf.data.rowVersion, makeIdempotencyKey('dec-manual-' + mod));
      wf.manualModeModule = null;
      wf.manualDraft = null;
      wf.manualReason = '';
      const meta = WF_MODULE_META[mod];
      if (mod === 'm4') {
        toast('Đã hoàn tất luồng 4 Module AI (nguồn Tự nhập) cho lượt khám ' + ((wf.visit && wf.visit.visitCode) || wf.visitId) + '.', 'success');
      } else if (meta && meta.next) {
        // U3: Never auto-run downstream module!
        wf.activeModule = (receipt && receipt.nextModule) || meta.next;
        toast('Đã lưu kết quả tự nhập cho ' + wfFormatModuleTitle(mod) + '. Chuyển sang ' + wfFormatModuleTitle(wf.activeModule) + '.', 'success');
      }
      await loadWorkflow(wf.visitId, { silent: true, keepModule: true, keepPrescription: true });
    } catch (err) {
      wfApplyApiErrorBanner(err, mod);
      render();
    } finally {
      wf.submittingAction = false;
      render();
    }
  }

  async function wfFinishWorkflow() {
    const wf = state.workflow;
    if (!wf.data || wf.submittingAction || wf.runningModule) return;
    const m4ms = wf.data.modules && wf.data.modules.m4;
    if (!m4ms) return;
    if (m4ms.state === 'ran') {
      await wfSubmitDecisionAi('m4', 'finish_workflow');
      return;
    }
    wf.submittingAction = true;
    wf.bannerError = '';
    render();
    try {
      await api.finishWorkflow(wf.visitId, { rowVersion: wf.data.rowVersion }, wf.data.rowVersion, makeIdempotencyKey('wf-finish'));
      toast('Đã hoàn tất luồng 4 Module AI cho lượt khám ' + ((wf.visit && wf.visit.visitCode) || wf.visitId) + '.', 'success');
      await loadWorkflow(wf.visitId, { silent: true, keepModule: true });
    } catch (err) {
      wfApplyApiErrorBanner(err, 'm4');
      render();
    } finally {
      wf.submittingAction = false;
      render();
    }
  }

  function wfOpenFormForModule(mod, fieldCode) {
    const wf = state.workflow;
    if (!wf.visitId) return;
    state.encounter.pendingModuleFilter = mod || 'all';
    if (fieldCode) {
      const resolved = resolveFormFieldCode(wf.fieldMetadata, fieldCode);
      state.encounter.highlightFieldCode = resolved;
    } else {
      state.encounter.highlightFieldCode = null;
    }
    navigate('#/visits/' + wf.visitId, true);
  }

  async function wfProceedEditToForm(mod) {
    const wf = state.workflow;
    const ms = wf.data && wf.data.modules && wf.data.modules[mod];
    // For a 'ran' module, entering explicit edit mode allows immediate rerun on return even without changing values
    if (ms && ms.state === 'ran' && wf.data && wf.data.rowVersion) {
      try {
        await api.saveWorkflowFields(wf.visitId, mod, {
          module: mod,
          rowVersion: wf.data.rowVersion,
          fields: {},
          editing: true
        }, wf.data.rowVersion);
      } catch (_ignored) {}
    }
    wf.manualModeModule = null;
    wfOpenFormForModule(mod, null);
  }

  function wfRequestEdit(mod) {
    const wf = state.workflow;
    if (!wf.data || !wf.data.modules) return;
    const ms = wf.data.modules[mod];
    const idx = WF_MODULE_ORDER.indexOf(mod);
    const affected = [];
    for (let i = idx + 1; i < WF_MODULE_ORDER.length; i++) {
      const dm = WF_MODULE_ORDER[i];
      const dms = wf.data.modules[dm];
      if (dms && (dms.state === 'ran' || dms.state === 'accepted' || dms.state === 'stale' || dms.attemptCount > 0)) {
        affected.push(wfFormatModuleTitle(dm));
      }
    }
    if (ms && ms.state === 'accepted' && affected.length > 0) {
      openModal({ type: 'wf-edit-confirm', module: mod, downstreamNames: affected });
      return;
    }
    wfProceedEditToForm(mod);
  }

  function renderWorkflowStepper(wf) {
    const isPharm = wf.isPharmacistView;
    const modules = (wf.data && wf.data.modules) || {};
    const items = WF_MODULE_ORDER.map(function (mod, idx) {
      const meta = WF_MODULE_META[mod];
      const isCurrent = wf.activeModule === mod;
      if (isPharm && mod !== 'm4') {
        return (
          '<button type="button" class="wf-step wf-step--restricted" disabled title="Giới hạn theo vai trò Dược sĩ">' +
            '<div class="wf-step__head">' +
              '<span class="wf-step__icon">' + ICONS.lock + '</span>' +
              '<span class="wf-step__title"><span class="wf-step__full">' + esc(meta.full) + '</span><span class="wf-step__short">' + esc(meta.short) + '</span></span>' +
            '</div>' +
            '<div class="wf-step__status">Giới hạn theo vai trò</div>' +
          '</button>'
        );
      }
      const ms = isPharm ? { state: wf.data ? wf.data.state : 'locked', attemptCount: 0, missingFieldCodes: [], decisionSource: null } : (modules[mod] || { state: 'locked', attemptCount: 0, missingFieldCodes: [] });
      const isRunning = Boolean(ms.isRunning || wf.runningModule === mod);
      const st = isRunning ? 'running' : (ms.state || 'locked');
      let icon = ICONS.lock;
      let label = 'Đã khóa';
      let extraPill = '';
      let titleAttr = '';
      if (st === 'locked') {
        icon = ICONS.lock;
        label = 'Đã khóa';
        titleAttr = 'Hoàn tất và chốt Module ' + Math.max(1, meta.num - 1) + ' trước để mở bước này';
      } else if (st === 'needs_input') {
        icon = ICONS.alert;
        const mc = (ms.missingFieldCodes || []).length;
        label = mc > 0 ? ('Cần nhập (thiếu ' + mc + ')') : 'Cần nhập';
      } else if (st === 'ready') {
        icon = ICONS.play;
        label = 'Sẵn sàng chạy';
      } else if (st === 'running') {
        icon = '<span class="wf-spinner" aria-hidden="true"></span>';
        label = 'Đang chạy...';
      } else if (st === 'ran') {
        icon = ICONS.clock;
        label = 'Chờ duyệt (Lần #' + (ms.attemptCount || 1) + ')';
      } else if (st === 'accepted') {
        icon = ICONS.checkCircle;
        if (ms.decisionSource === 'manual') {
          label = 'Đã chốt · Tự nhập';
          extraPill = '<span class="badge badge--blue badge--xs">Tự nhập</span>';
        } else {
          label = 'Đã chốt · AI';
        }
      } else if (st === 'stale') {
        icon = ICONS.refresh;
        label = 'Cần chạy lại';
      }
      const disabled = st === 'locked' || Boolean(wf.runningModule);
      return (
        '<button type="button" class="wf-step wf-step--' + esc(st) + (isCurrent ? ' is-current' : '') + '" ' +
          'data-wf-select-module="' + esc(mod) + '" ' +
          (isCurrent ? 'aria-current="step" ' : '') +
          (titleAttr ? ('title="' + esc(titleAttr) + '" ') : '') +
          (disabled ? 'disabled' : '') + '>' +
          '<div class="wf-step__head">' +
            '<span class="wf-step__icon">' + icon + '</span>' +
            '<span class="wf-step__title"><span class="wf-step__full">' + esc(meta.full) + '</span><span class="wf-step__short">' + esc(meta.short) + '</span></span>' +
          '</div>' +
          '<div class="wf-step__status"><span>' + esc(label) + '</span>' + extraPill + '</div>' +
        '</button>' +
        (idx < 3 ? '<span class="wf-stepper__arrow" aria-hidden="true">' + ICONS.arrowRight + '</span>' : '')
      );
    }).join('');
    return '<nav class="wf-stepper" aria-label="Tiến trình 4 Module AI">' + items + '</nav>';
  }

  function wfSummarizeOutputOneLine(mod, output) {
    if (!output) return 'Chưa có tóm tắt đầu ra.';
    if (mod === 'm1') {
      const muc = output.xac_suat_suy_tim && output.xac_suat_suy_tim.muc ? output.xac_suat_suy_tim.muc : 'Chưa kết luận';
      const ef = output.kieu_hinh_ef || '—';
      const ctx = output.benh_canh ? (' · ' + output.benh_canh) : '';
      return muc + ' · ' + ef + ctx;
    }
    if (mod === 'm2') {
      return (output.phan_loai_ket_qua || '—') + ' · Ưu tiên: ' + (output.muc_uu_tien || '—');
    }
    if (mod === 'm3') {
      return (output.dinh_huong || ('Stage ' + (output.stage || '—') + ' · ' + (output.kieu_hinh_ef || '—')));
    }
    if (mod === 'm4') {
      const n = (output.canh_bao || []).length;
      return n > 0 ? (n + ' cảnh báo an toàn thuốc') : 'Không có cảnh báo trong phạm vi luật mock';
    }
    return 'Đã chốt';
  }

  function renderUpstreamSummaryStack(wf) {
    if (wf.isPharmacistView || !wf.data || !wf.data.modules) return '';
    const curIdx = WF_MODULE_ORDER.indexOf(wf.activeModule);
    if (curIdx <= 0) return '';
    const rows = [];
    for (let i = 0; i < curIdx; i++) {
      const mod = WF_MODULE_ORDER[i];
      const ms = wf.data.modules[mod];
      if (!ms || (ms.state !== 'accepted' && ms.state !== 'stale' && ms.state !== 'ran')) continue;
      const meta = WF_MODULE_META[mod];
      const outInfo = wfGetEffectiveOrLatestOutput(wf, mod);
      const isExp = Boolean(wf.expandedUpstream[mod]);
      const canEdit = Array.isArray(ms.availableActions) && ms.availableActions.indexOf('edit') >= 0 && !wf.runningModule;
      const srcBadge = ms.state === 'stale'
        ? '<span class="badge badge--error badge--xs">Cần chạy lại</span>'
        : (ms.decisionSource === 'manual'
            ? '<span class="badge badge--blue badge--xs">Đã chốt · Tự nhập</span>'
            : '<span class="badge badge--success badge--xs">Đã chốt · AI</span>');
      rows.push(
        '<div class="wf-upstream-card" data-wf-upstream="' + esc(mod) + '">' +
          '<div class="wf-upstream-card__row">' +
            '<div class="wf-upstream-card__main">' +
              '<strong>' + esc(meta.short) + '</strong> ' + srcBadge +
              '<span class="wf-upstream-card__summary">' + esc(wfSummarizeOutputOneLine(mod, outInfo && outInfo.output)) + '</span>' +
            '</div>' +
            '<div class="wf-upstream-card__actions">' +
              '<button type="button" class="btn btn--ghost btn--xs" data-wf-toggle-upstream="' + esc(mod) + '">' + (isExp ? 'Thu gọn' : 'Xem') + '</button>' +
              (canEdit ? '<button type="button" class="btn btn--secondary btn--xs" data-wf-edit-module="' + esc(mod) + '">' + ICONS.edit + ' Chỉnh sửa</button>' : '') +
            '</div>' +
          '</div>' +
          (isExp && outInfo && outInfo.output ? '<div class="wf-upstream-card__detail">' + renderModuleOutputBody(mod, outInfo.output, wf, true) + '</div>' : '') +
        '</div>'
      );
    }
    if (rows.length === 0) return '';
    return '<div class="wf-upstream-stack" aria-label="Tóm tắt các bước trước">' + rows.join('') + '</div>';
  }

  function renderM2RecentTestEvidenceBox(wf, isReadonly) {
    const obsList = Array.isArray(wf.observations) ? wf.observations : [];
    const rows = [];
    WF_RECENT_TEST_FIELDS.forEach(function (spec) {
      const match = obsList.find(function (o) {
        return o && spec.fieldCodes.indexOf(o.fieldCode) >= 0 && o.answer && o.answer.value_state === 'answered' && o.answer.measuredAt;
      });
      if (!match) return;
      const ev = wf.recentTestEvidence && wf.recentTestEvidence[spec.testKey];
      const checked = Boolean(ev && ev.doctorConfirmedReuse && ev.id === match.id);
      const valSummary = typeof match.answer.value === 'object'
        ? 'Dữ liệu có cấu trúc'
        : (String(match.answer.value) + (match.answer.unit ? (' ' + match.answer.unit) : ''));
      rows.push(
        '<label class="choice-row wf-reuse-row">' +
          '<input type="checkbox" data-wf-reuse-test="' + esc(spec.testKey) + '" data-wf-reuse-obs="' + esc(match.id) + '" data-wf-reuse-field="' + esc(match.fieldCode) + '" data-wf-reuse-time="' + esc(match.answer.measuredAt) + '"' + (checked ? ' checked' : '') + (isReadonly ? ' disabled' : '') + '>' +
          '<span><strong>' + esc(spec.label) + '</strong> (' + esc(valSummary) + ' · đo lúc <span class="tabular">' + esc(formatDateTime(match.answer.measuredAt)) + '</span>) — Bác sĩ xác nhận dùng lại kết quả gần đây</span>' +
        '</label>'
      );
    });
    return (
      '<div class="wf-reuse-box" data-wf-recent-evidence="1">' +
        '<div class="wf-reuse-box__head">' +
          '<h4>Xác nhận dùng lại xét nghiệm gần đây (cửa sổ 30 ngày)</h4>' +
          (!isReadonly && wf.recentTestEvidenceDirty
            ? '<button type="button" class="btn btn--secondary btn--xs' + (wf.savingFields ? ' is-loading' : '') + '" data-wf-save-evidence="1"' + (wf.savingFields ? ' disabled' : '') + '>' + (wf.savingFields ? 'Đang lưu...' : 'Lưu xác nhận dùng lại') + '</button>'
            : '') +
        '</div>' +
        (rows.length === 0
          ? '<p class="field__help">Chưa có quan sát cận lâm sàng nào kèm thời điểm đo hợp lệ để xác nhận dùng lại.</p>'
          : '<div class="wf-reuse-list">' + rows.join('') + '</div>') +
      '</div>'
    );
  }

  function renderM3SelectedPrescriptionBox(wf, isReadonly) {
    const sp = wf.selectedPrescription || { value_state: 'answered', listState: 'none', items: [] };
    const items = Array.isArray(sp.items) ? sp.items : [];
    const listState = items.length > 0 ? 'known' : (sp.listState || 'none');
    return (
      '<div class="wf-rx-box">' +
        '<div class="wf-rx-box__head">' +
          '<div><strong>Phương án đơn thuốc bác sĩ chọn cho Module 3 (chuyển sang Module 4)</strong><p class="field__help">Độc lập với khuyến nghị AI; chỉ lưu trong workflow thử nghiệm, không tự ghi vào đơn thuốc thật.</p></div>' +
          '<div class="list-state-bar__group">' +
            '<button type="button" class="list-state-btn' + (listState === 'none' ? ' is-none' : '') + '" data-wf-rx-mode="none"' + (isReadonly ? ' disabled' : '') + '>Không kê đơn mới</button>' +
            '<button type="button" class="list-state-btn' + (listState === 'known' ? ' is-known' : '') + '" data-wf-rx-mode="known"' + (isReadonly ? ' disabled' : '') + '>Có thuốc mới (' + items.length + ')</button>' +
          '</div>' +
        '</div>' +
        (listState === 'known' ? (
          '<div class="wf-rx-list">' +
            items.map(function (it, idx) {
              return (
                '<div class="wf-rx-row">' +
                  '<input type="text" class="input input--sm" data-wf-rx-field="' + idx + ':display" placeholder="Tên thuốc / hoạt chất" value="' + esc(it.display || '') + '"' + (isReadonly ? ' disabled' : '') + '>' +
                  '<input type="text" class="input input--sm" data-wf-rx-field="' + idx + ':ingredientCode" placeholder="Mã hoạt chất (VD: amiodarone)" value="' + esc(it.ingredientCode || '') + '"' + (isReadonly ? ' disabled' : '') + '>' +
                  '<input type="number" step="any" class="input input--sm" data-wf-rx-field="' + idx + ':dose" placeholder="Liều" value="' + esc(it.dose != null ? it.dose : '') + '"' + (isReadonly ? ' disabled' : '') + '>' +
                  '<select class="select input--sm" data-wf-rx-field="' + idx + ':therapeuticGroup"' + (isReadonly ? ' disabled' : '') + '>' +
                    ['raas', 'beta_blocker', 'mra', 'sglt2i', 'loop_diuretic', 'other'].map(function (g) {
                      return '<option value="' + g + '"' + (it.therapeuticGroup === g ? ' selected' : '') + '>' + g + '</option>';
                    }).join('') +
                  '</select>' +
                  (!isReadonly ? '<button type="button" class="btn btn--ghost btn--xs" data-wf-rx-remove="' + idx + '" aria-label="Xóa dòng thuốc">' + ICONS.trash + '</button>' : '') +
                '</div>'
              );
            }).join('') +
            (!isReadonly ? '<button type="button" class="btn btn--secondary btn--xs" data-wf-rx-add="1">' + ICONS.plus + ' Thêm thuốc vào phương án</button>' : '') +
          '</div>'
        ) : '') +
      '</div>'
    );
  }

  function renderRiskChip(val) {
    if (val === 'Thấp') return '<span class="badge badge--success">Thấp</span>';
    if (val === 'Trung bình') return '<span class="badge badge--warn">Trung bình</span>';
    if (val === 'Cao') return '<span class="badge badge--error">Cao</span>';
    return '<span class="badge badge--neutral">Chưa đủ dữ liệu</span>';
  }

  function renderM4AlertCard(al, wf, canConfirm, isManualForm) {
    const sevCls = al.muc_do === 'Nghiêm trọng' ? 'error' : (al.muc_do === 'Quan trọng' ? 'warn' : 'info');
    const dec = (wf.m4Decisions && wf.m4Decisions[al.id]) || { quyet_dinh: '', ly_do: '', error: '' };
    const isSerious = al.muc_do === 'Nghiêm trọng';
    const isDisagree = dec.quyet_dinh === 'Không đồng ý';
    const reasonRequired = isSerious || isDisagree;
    const controlsEnabled = Boolean(canConfirm || isManualForm);
    const medLabelMap = wfBuildMedicationLabelMap(wf);
    return (
      '<article class="wf-alert-card wf-alert-card--' + sevCls + '" data-wf-alert-id="' + esc(al.id) + '">' +
        '<div class="wf-alert-card__info">' +
          '<div class="wf-alert-card__head">' +
            '<span class="badge badge--' + sevCls + '">' + esc(al.muc_do) + '</span>' +
            '<strong>' + esc(al.loai) + '</strong>' +
            '<span class="badge badge--neutral badge--xs mono">DD #' + esc(al.ddCode || '—') + '</span>' +
          '</div>' +
          '<p class="wf-alert-card__desc">' + esc(al.noi_dung) + '</p>' +
          '<p class="wf-alert-card__action"><strong>Đề xuất:</strong> ' + esc(al.hanh_dong_de_xuat || 'Bác sĩ rà soát') + '</p>' +
          (Array.isArray(al.thuoc_lien_quan) && al.thuoc_lien_quan.length > 0
            ? '<div class="wf-chip-list"><span class="field__help">Thuốc liên quan:</span>' + al.thuoc_lien_quan.map(function (id) {
                const resolved = medLabelMap[String(id)] || 'Thuốc không xác định';
                return '<span class="code-chip">' + esc(resolved) + '</span>';
              }).join('') + '</div>'
            : '') +
        '</div>' +
        '<div class="wf-alert-card__decision">' +
          (wf.isPharmacistView ? (
            '<div class="wf-alert-readonly">' +
              '<span class="field__help">Quyết định bác sĩ:</span> ' +
              (dec.quyet_dinh ? ('<strong>' + esc(dec.quyet_dinh) + '</strong>' + (dec.ly_do ? (' — ' + esc(dec.ly_do)) : '')) : '<span class="cell-sub">Chưa ghi nhận</span>') +
            '</div>'
          ) : (
            '<div class="wf-yn-group" role="group" aria-label="Xác nhận cảnh báo ' + esc(al.loai) + '">' +
              '<button type="button" class="wf-yn-btn' + (dec.quyet_dinh === 'Đồng ý' ? ' is-agree' : '') + '" data-wf-m4-choice="' + esc(al.id) + ':Đồng ý"' + (!controlsEnabled ? ' disabled' : '') + '>Đồng ý</button>' +
              '<button type="button" class="wf-yn-btn' + (dec.quyet_dinh === 'Không đồng ý' ? ' is-disagree' : '') + '" data-wf-m4-choice="' + esc(al.id) + ':Không đồng ý"' + (!controlsEnabled ? ' disabled' : '') + '>Không đồng ý</button>' +
            '</div>' +
            '<label class="field__help" for="wf-m4-reason-' + esc(al.id) + '">' + (reasonRequired ? 'Lý do xác nhận (bắt buộc)' : 'Lý do (tùy chọn)') + '</label>' +
            '<input id="wf-m4-reason-' + esc(al.id) + '" type="text" class="input input--sm' + (dec.error ? ' input--error' : '') + '" data-wf-m4-reason="' + esc(al.id) + '" value="' + esc(dec.ly_do || '') + '" placeholder="' + (reasonRequired ? 'Nhập lý do xác nhận...' : 'Ghi chú tùy chọn...') + '"' + (!controlsEnabled ? ' disabled' : '') + '>' +
            (dec.error ? '<p class="field__error">' + ICONS.alert + ' ' + esc(dec.error) + '</p>' : '')
          )) +
        '</div>' +
      '</article>'
    );
  }

  function renderModuleOutputBody(mod, output, wf, readonlyPreview) {
    if (!output) return '<p class="field__help">Chưa có dữ liệu kết quả.</p>';
    const gapsHtml = Array.isArray(output.dataGaps) && output.dataGaps.length > 0
      ? '<div class="wf-gaps-box"><strong>Khoảng trống dữ liệu (dataGaps):</strong><ul>' + output.dataGaps.map(function (g) { return '<li>' + esc(g) + '</li>'; }).join('') + '</ul></div>'
      : '';

    if (mod === 'm1') {
      const prob = output.xac_suat_suy_tim || {};
      const pctText = (prob.xac_suat !== null && prob.xac_suat !== undefined) ? (Math.round(Number(prob.xac_suat) * 100) + '%') : 'Chưa ước tính';
      const risks = output.du_bao_nguy_co || {};
      return (
        (Array.isArray(output.canh_bao_cap_cuu) && output.canh_bao_cap_cuu.length > 0 ? (
          '<div class="banner banner--error" role="alert"><div class="banner__main">' + ICONS.alert + '<div><p class="banner__title">Cảnh báo cấp cứu cần bác sĩ đánh giá ngay</p><div class="wf-chip-list">' +
            output.canh_bao_cap_cuu.map(function (c) { return '<span class="badge badge--error">' + esc(c) + '</span>'; }).join('') +
          '</div></div></div></div>'
        ) : '') +
        '<div class="wf-kpi-3">' +
          '<div class="wf-kpi-card"><div class="wf-kpi-card__label">Xác suất / Giai đoạn suy tim</div><div class="wf-kpi-card__val">' + esc(prob.muc || '—') + '</div><div class="wf-kpi-card__sub">Xác suất mô phỏng: <strong>' + esc(pctText) + '</strong>' + (output.stage ? (' · Stage ' + esc(output.stage)) : '') + '</div></div>' +
          '<div class="wf-kpi-card"><div class="wf-kpi-card__label">Kiểu hình EF nghi ngờ</div><div class="wf-kpi-card__val">' + esc(output.kieu_hinh_ef || '—') + '</div><div class="wf-kpi-card__sub">Không tự suy kiểu hình khi thiếu EF</div></div>' +
          '<div class="wf-kpi-card"><div class="wf-kpi-card__label">Bệnh cảnh lâm sàng</div><div class="wf-kpi-card__val">' + esc(output.benh_canh || 'Chưa xác định') + '</div><div class="wf-kpi-card__sub">Frailty/dung nạp: ' + esc(output.frailty_dung_nap || '—') + '</div></div>' +
        '</div>' +
        (Array.isArray(output.canh_bao_gia_suy_tim) && output.canh_bao_gia_suy_tim.length > 0 ? (
          '<div class="wf-subblock"><h4>Cảnh báo giả suy tim cần loại trừ</h4><div class="wf-chip-list">' +
            output.canh_bao_gia_suy_tim.map(function (m) { return '<span class="badge badge--warn">' + esc(m) + '</span>'; }).join('') +
          '</div></div>'
        ) : '') +
        (Array.isArray(output.xep_hang_nguyen_nhan) && output.xep_hang_nguyen_nhan.length > 0 ? (
          '<div class="wf-subblock"><h4>Xếp hạng nguyên nhân nghi ngờ</h4><ol class="wf-ranked-list">' +
            output.xep_hang_nguyen_nhan.map(function (x) { return '<li><strong>' + esc(x.code) + '</strong> — ' + esc(x.ly_do) + '</li>'; }).join('') +
          '</ol></div>'
        ) : '') +
        '<div class="wf-subblock"><h4>Dự báo 6 nhóm nguy cơ (mô phỏng chưa hiệu chuẩn)</h4><div class="wf-risk-grid">' +
          WF_M1_RISK_KEYS.map(function (rk) {
            return '<div class="wf-risk-item"><span>' + esc(rk.label) + '</span>' + renderRiskChip(risks[rk.key]) + '</div>';
          }).join('') +
        '</div></div>' +
        gapsHtml
      );
    }

    if (mod === 'm2') {
      const goiY = output.goi_y_chi_dinh || {};
      const proposed = [];
      const recent = [];
      const notProposed = [];
      WF_M2_TESTS.forEach(function (t) {
        const entry = goiY[t.key];
        if (!entry) return;
        const row = Object.assign({ label: t.label, dd: t.dd, key: t.key }, entry);
        if (entry.trang_thai === 'Đề xuất') proposed.push(row);
        else if (entry.trang_thai === 'Đã có kết quả gần đây') recent.push(row);
        else notProposed.push(row);
      });
      const prioCls = output.muc_uu_tien === 'Cấp cứu' ? 'error' : (output.muc_uu_tien === 'Trong 24 giờ' ? 'warn' : 'info');
      const renderRows = function (arr, badgeCls) {
        if (arr.length === 0) return '<p class="field__help">Không có mục nào.</p>';
        return '<div class="wf-m2-list">' + arr.map(function (r) {
          return (
            '<div class="wf-m2-row">' +
              '<div><strong>' + esc(r.label) + '</strong> <span class="cell-sub mono">(DD #' + r.dd + ')</span><div class="cell-sub">' + esc(r.ly_do) + '</div>' +
              (Array.isArray(r.evidenceObservationIds) && r.evidenceObservationIds.length > 0 ? '<div class="cell-sub mono">Bằng chứng: ' + esc(r.evidenceObservationIds.join(', ')) + '</div>' : '') +
              '</div>' +
              '<span class="badge badge--' + badgeCls + '">' + esc(r.trang_thai) + '</span>' +
            '</div>'
          );
        }).join('') + '</div>';
      };
      return (
        '<div class="wf-kpi-3">' +
          '<div class="wf-kpi-card"><div class="wf-kpi-card__label">Phân loại kết quả</div><div class="wf-kpi-card__val">' + esc(output.phan_loai_ket_qua || '—') + '</div></div>' +
          '<div class="wf-kpi-card"><div class="wf-kpi-card__label">Mức ưu tiên</div><div class="wf-kpi-card__val"><span class="badge badge--' + prioCls + '">' + esc(output.muc_uu_tien || '—') + '</span></div></div>' +
          '<div class="wf-kpi-card"><div class="wf-kpi-card__label">Cân nhắc lợi ích / nguy cơ</div><div class="wf-kpi-card__sub">' + esc(output.loi_ich_nguy_co || '—') + '</div></div>' +
        '</div>' +
        '<div class="banner banner--info"><div class="banner__main">' + ICONS.shield + '<div><p class="banner__title">Lưu ý thủ thuật xâm lấn</p><p class="banner__desc">' + esc(output.canh_bao_xam_lan || 'Không chỉ định thăm dò xâm lấn chỉ dựa trên tuổi đơn thuần.') + '</p></div></div></div>' +
        '<div class="wf-subblock"><h4>Đề xuất thực hiện (' + proposed.length + ')</h4>' + renderRows(proposed, 'info') + '</div>' +
        '<div class="wf-subblock"><h4>Đã có kết quả gần đây — khóa trùng lặp (' + recent.length + ')</h4>' + renderRows(recent, 'success') + '</div>' +
        '<details class="wf-details"><summary>Không đề xuất (' + notProposed.length + ' mục DD #121–145)</summary>' + renderRows(notProposed, 'neutral') + '</details>' +
        gapsHtml
      );
    }

    if (mod === 'm3') {
      const nhom = output.nhom_thuoc || {};
      const badgeForMuc = function (muc) {
        if (muc === 'Khuyến nghị') return 'success';
        if (muc === 'Cân nhắc') return 'info';
        if (muc === 'Không khuyến nghị') return 'warn';
        if (muc === 'Chống chỉ định') return 'error';
        return 'neutral';
      };
      return (
        (output.canh_bao ? '<div class="banner banner--warn"><div class="banner__main">' + ICONS.alert + '<div><p class="banner__desc"><strong>' + esc(output.canh_bao) + '</strong></p></div></div></div>' : '') +
        '<div class="wf-kpi-3">' +
          '<div class="wf-kpi-card"><div class="wf-kpi-card__label">Giai đoạn &amp; Kiểu hình EF</div><div class="wf-kpi-card__val">Stage ' + esc(output.stage || '—') + ' · ' + esc(output.kieu_hinh_ef || '—') + '</div></div>' +
          '<div class="wf-kpi-card"><div class="wf-kpi-card__label">Định hướng tổng quan</div><div class="wf-kpi-card__sub">' + esc(output.dinh_huong || '—') + '</div></div>' +
          '<div class="wf-kpi-card"><div class="wf-kpi-card__label">Kế hoạch dò liều</div><div class="wf-kpi-card__sub">' + esc(output.ke_hoach_do_lieu || '—') + '</div></div>' +
        '</div>' +
        '<div class="wf-subblock"><h4>5 Nhóm thuốc nền tảng</h4><div class="wf-drug-grid">' +
          WF_M3_DRUG_GROUPS.map(function (g) {
            const info = nhom[g.key] || { muc: 'Cân nhắc', ly_do: '—' };
            return (
              '<div class="wf-drug-card">' +
                '<div class="wf-drug-card__head"><strong>' + esc(g.label) + '</strong><span class="badge badge--' + badgeForMuc(info.muc) + '">' + esc(info.muc) + '</span></div>' +
                '<p class="wf-drug-card__reason">' + esc(info.ly_do) + '</p>' +
              '</div>'
            );
          }).join('') +
        '</div></div>' +
        (Array.isArray(output.ca_the_hoa) && output.ca_the_hoa.length > 0 ? (
          '<div class="wf-subblock"><h4>Cá thể hóa người cao tuổi</h4><div class="wf-chip-list">' +
            output.ca_the_hoa.map(function (c) { return '<span class="badge badge--blue">' + esc(c) + '</span>'; }).join('') +
          '</div></div>'
        ) : '') +
        (function () {
          const rawFollowups = Array.isArray(output.ke_hoach_theo_doi) ? output.ke_hoach_theo_doi : [];
          const followupHtmlItems = rawFollowups.map(wfFormatFollowupItemHtml).filter(Boolean);
          return (
            '<div class="wf-subblock"><h4>Kế hoạch theo dõi</h4>' +
              (followupHtmlItems.length > 0
                ? ('<ul class="wf-bullet-list">' + followupHtmlItems.join('') + '</ul>')
                : '<p class="field__help">Chưa có kế hoạch theo dõi</p>') +
            '</div>'
          );
        })() +
        gapsHtml
      );
    }

    if (mod === 'm4') {
      const alerts = Array.isArray(output.canh_bao) ? output.canh_bao : [];
      const nSer = alerts.filter(function (a) { return a.muc_do === 'Nghiêm trọng'; }).length;
      const nImp = alerts.filter(function (a) { return a.muc_do === 'Quan trọng'; }).length;
      const nMon = alerts.filter(function (a) { return a.muc_do === 'Theo dõi'; }).length;
      const m4ms = wf.data && wf.data.modules && wf.data.modules.m4;
      const actions = (m4ms && Array.isArray(m4ms.availableActions)) ? m4ms.availableActions : [];
      const canConfirm = !readonlyPreview && !wf.isPharmacistView && actions.indexOf('confirm_m4') >= 0 && !wf.runningModule;
      return (
        '<div class="banner banner--info"><div class="banner__main">' + ICONS.shield + '<div><p class="banner__desc"><strong>AI chỉ đưa ra cảnh báo tham khảo, không tự ngừng hoặc đổi thuốc.</strong> Bác sĩ cần xác nhận tất cả cảnh báo mức Nghiêm trọng trước khi hoàn tất workflow.</p></div></div></div>' +
        '<div class="wf-m4-counters">' +
          '<span class="badge badge--error">' + nSer + ' Nghiêm trọng</span>' +
          '<span class="badge badge--warn">' + nImp + ' Quan trọng</span>' +
          '<span class="badge badge--info">' + nMon + ' Theo dõi</span>' +
          '<span class="badge badge--neutral">Độ bao phủ: ' + esc(output.coverage === 'complete' ? 'Đầy đủ' : 'Chưa đầy đủ (incomplete)') + '</span>' +
        '</div>' +
        (alerts.length === 0
          ? '<p class="field__help">Không phát sinh cảnh báo trong bộ luật mock hiện hành (không đồng nghĩa an toàn tuyệt đối khi độ bao phủ chưa đầy đủ).</p>'
          : (
            '<div class="wf-alert-stack">' +
              alerts.map(function (al) { return renderM4AlertCard(al, wf, canConfirm, false); }).join('') +
            '</div>'
          )) +
        // BUG-12b (D5): Confirmation button strictly follows API availableActions ('confirm_m4'), never independently hidden
        (canConfirm ? (
          '<div class="wf-m4-save-row">' +
            '<button type="button" class="btn btn--secondary' + (wf.m4Saving ? ' is-loading' : '') + '" data-wf-save-m4-confirmations="1"' + (wf.m4Saving ? ' disabled' : '') + '>' + (wf.m4Saving ? 'Đang lưu xác nhận...' : 'Lưu xác nhận cảnh báo M4') + '</button>' +
          '</div>'
        ) : '') +
        gapsHtml
      );
    }
    return '';
  }

  function renderManualOverrideForm(wf, mod) {
    const draft = wf.manualDraft;
    if (!draft) return '';
    const meta = WF_MODULE_META[mod];
    const isM4 = mod === 'm4';
    let fieldsHtml = '';
    if (mod === 'm1') {
      fieldsHtml =
        '<div class="form-grid">' +
          '<div class="field"><label class="field__label" for="wf-man-m1-muc">Phân loại suy tim</label>' +
            '<select id="wf-man-m1-muc" class="select" data-wf-man="xac_suat_suy_tim.muc">' +
              WF_M1_PROB_LEVELS.map(function (p) {
                return '<option value="' + esc(p.value) + '"' + (draft.xac_suat_suy_tim && draft.xac_suat_suy_tim.muc === p.value ? ' selected' : '') + '>' + esc(p.value) + '</option>';
              }).join('') +
            '</select></div>' +
          '<div class="field"><label class="field__label" for="wf-man-m1-stage">Stage (A/B/C/D)</label>' +
            '<select id="wf-man-m1-stage" class="select" data-wf-man="stage">' +
              ['', 'A', 'B', 'C', 'D'].map(function (s) {
                return '<option value="' + s + '"' + ((draft.stage || '') === s ? ' selected' : '') + '>' + (s ? ('Stage ' + s) : 'Không / Chưa xác định (null)') + '</option>';
              }).join('') +
            '</select></div>' +
          '<div class="field"><label class="field__label" for="wf-man-m1-ef">Kiểu hình EF</label>' +
            '<select id="wf-man-m1-ef" class="select" data-wf-man="kieu_hinh_ef">' +
              WF_M1_PHENOTYPES.map(function (p) {
                return '<option value="' + esc(p) + '"' + (draft.kieu_hinh_ef === p ? ' selected' : '') + '>' + esc(p) + '</option>';
              }).join('') +
            '</select></div>' +
          '<div class="field"><label class="field__label" for="wf-man-m1-ctx">Bệnh cảnh lâm sàng</label>' +
            '<select id="wf-man-m1-ctx" class="select" data-wf-man="benh_canh">' +
              '<option value="">-- Chưa xác định (null) --</option>' +
              WF_M1_CONTEXTS.map(function (c) {
                return '<option value="' + esc(c) + '"' + (draft.benh_canh === c ? ' selected' : '') + '>' + esc(c) + '</option>';
              }).join('') +
            '</select></div>' +
          '<div class="field field--span-2"><label class="field__label" for="wf-man-m1-frailty">Đánh giá Frailty / dung nạp</label>' +
            '<input id="wf-man-m1-frailty" type="text" class="input" data-wf-man="frailty_dung_nap" value="' + esc(draft.frailty_dung_nap || '') + '"></div>' +
        '</div>' +
        '<div class="wf-subblock"><h4>Dự báo 6 nhóm nguy cơ (để trống = Chưa đủ dữ liệu)</h4><div class="wf-risk-grid">' +
          WF_M1_RISK_KEYS.map(function (rk) {
            const cur = (draft.du_bao_nguy_co && draft.du_bao_nguy_co[rk.key]) || '';
            return (
              '<div class="field"><label class="field__help">' + esc(rk.label) + '</label>' +
                '<select class="select input--sm" data-wf-man="du_bao_nguy_co.' + esc(rk.key) + '">' +
                  '<option value=""' + (!cur ? ' selected' : '') + '>Chưa đủ dữ liệu (null)</option>' +
                  '<option value="Thấp"' + (cur === 'Thấp' ? ' selected' : '') + '>Thấp</option>' +
                  '<option value="Trung bình"' + (cur === 'Trung bình' ? ' selected' : '') + '>Trung bình</option>' +
                  '<option value="Cao"' + (cur === 'Cao' ? ' selected' : '') + '>Cao</option>' +
                '</select></div>'
            );
          }).join('') +
        '</div></div>';
    } else if (mod === 'm2') {
      const goiY = draft.goi_y_chi_dinh || {};
      fieldsHtml =
        '<div class="wf-form-grid">' +
          '<div class="field"><label class="field__label" for="wf-man-m2-cls">Phân loại kết quả</label>' +
            '<select id="wf-man-m2-cls" class="select" data-wf-man="phan_loai_ket_qua">' +
              WF_M2_CLASSIFICATIONS.map(function (c) { return '<option value="' + esc(c) + '"' + (draft.phan_loai_ket_qua === c ? ' selected' : '') + '>' + esc(c) + '</option>'; }).join('') +
            '</select></div>' +
          '<div class="field"><label class="field__label" for="wf-man-m2-prio">Mức ưu tiên</label>' +
            '<select id="wf-man-m2-prio" class="select" data-wf-man="muc_uu_tien">' +
              WF_M2_PRIORITIES.map(function (p) { return '<option value="' + esc(p) + '"' + (draft.muc_uu_tien === p ? ' selected' : '') + '>' + esc(p) + '</option>'; }).join('') +
            '</select></div>' +
          '<div class="field field--span-2"><label class="field__label" for="wf-man-m2-br">Cân nhắc lợi ích / nguy cơ</label>' +
            '<input id="wf-man-m2-br" type="text" class="input" data-wf-man="loi_ich_nguy_co" value="' + esc(draft.loi_ich_nguy_co || '') + '"></div>' +
          '<div class="field field--span-2"><label class="field__label" for="wf-man-m2-inv">Cảnh báo thủ thuật xâm lấn</label>' +
            '<input id="wf-man-m2-inv" type="text" class="input" data-wf-man="canh_bao_xam_lan" value="' + esc(draft.canh_bao_xam_lan || '') + '"></div>' +
        '</div>' +
        '<div class="wf-subblock"><h4>Chỉnh sửa 25 mục chỉ định cận lâm sàng (DD #121–145)</h4>' +
          '<div class="wf-man-m2-tests">' +
            WF_M2_TESTS.map(function (t) {
              const cur = goiY[t.key] || { trang_thai: 'Không đề xuất', ly_do: '' };
              return (
                '<div class="wf-man-m2-row">' +
                  '<span class="wf-man-m2-label"><strong>' + esc(t.label) + '</strong> <span class="cell-sub mono">#' + t.dd + '</span></span>' +
                  '<select class="select input--sm" data-wf-man="goi_y_chi_dinh.' + esc(t.key) + '.trang_thai">' +
                    ['Đề xuất', 'Không đề xuất', 'Đã có kết quả gần đây'].map(function (st) {
                      return '<option value="' + esc(st) + '"' + (cur.trang_thai === st ? ' selected' : '') + '>' + esc(st) + '</option>';
                    }).join('') +
                  '</select>' +
                  '<input type="text" class="input input--sm" data-wf-man="goi_y_chi_dinh.' + esc(t.key) + '.ly_do" value="' + esc(cur.ly_do || '') + '" placeholder="Lý do chỉ định...">' +
                '</div>'
              );
            }).join('') +
          '</div>' +
        '</div>' +
        '<div class="field"><label class="field__label">Khoảng trống dữ liệu (mỗi dòng 1 mục)</label>' +
          '<textarea class="textarea" rows="2" data-wf-man-lines="dataGaps">' + esc((draft.dataGaps || []).join('\n')) + '</textarea></div>';
    } else if (mod === 'm3') {
      const khuyenNghi = draft.khuyen_nghi || {};
      const followups = Array.isArray(draft.ke_hoach_theo_doi) ? draft.ke_hoach_theo_doi : [];
      fieldsHtml =
        '<div class="wf-form-grid">' +
          '<div class="field"><label class="field__label">Stage</label>' +
            '<select class="select" data-wf-man="stage">' +
              ['', 'A', 'B', 'C', 'D'].map(function (s) { return '<option value="' + s + '"' + ((draft.stage || '') === s ? ' selected' : '') + '>' + (s ? ('Stage ' + s) : 'Chưa xác định (null)') + '</option>'; }).join('') +
            '</select></div>' +
          '<div class="field"><label class="field__label">Kiểu hình EF</label>' +
            '<select class="select" data-wf-man="kieu_hinh_ef">' +
              WF_M1_PHENOTYPES.map(function (p) { return '<option value="' + esc(p) + '"' + (draft.kieu_hinh_ef === p ? ' selected' : '') + '>' + esc(p) + '</option>'; }).join('') +
            '</select></div>' +
          '<div class="field field--span-2"><label class="field__label">Định hướng điều trị tổng quan</label>' +
            '<input type="text" class="input" data-wf-man="dinh_huong" value="' + esc(draft.dinh_huong || '') + '"></div>' +
          '<div class="field field--span-2"><label class="field__label">Kế hoạch dò liều</label>' +
            '<input type="text" class="input" data-wf-man="ke_hoach_do_lieu" value="' + esc(draft.ke_hoach_do_lieu || '') + '"></div>' +
        '</div>' +
        '<div class="wf-subblock"><h4>5 Nhóm thuốc nền tảng</h4><div class="wf-drug-grid">' +
          WF_M3_DRUG_GROUPS.map(function (g) {
            const cur = (draft.nhom_thuoc && draft.nhom_thuoc[g.key]) || { muc: 'Cân nhắc', ly_do: '' };
            return (
              '<div class="wf-drug-card">' +
                '<strong>' + esc(g.label) + '</strong>' +
                '<select class="select input--sm" data-wf-man="nhom_thuoc.' + esc(g.key) + '.muc">' +
                  WF_M3_REC_LEVELS.map(function (lv) { return '<option value="' + esc(lv) + '"' + (cur.muc === lv ? ' selected' : '') + '>' + esc(lv) + '</option>'; }).join('') +
                '</select>' +
                '<input type="text" class="input input--sm" data-wf-man="nhom_thuoc.' + esc(g.key) + '.ly_do" value="' + esc(cur.ly_do || '') + '" placeholder="Lý do...">' +
              '</div>'
            );
          }).join('') +
        '</div></div>' +
        '<div class="wf-subblock"><h4>7 Nhóm khuyến nghị (DD #173–179)</h4><div class="wf-man-m2-tests">' +
          WF_M3_KHUYEN_NGHI_KEYS.map(function (k) {
            const cur = khuyenNghi[k.key] || { ap_dung: 'chua_ro', noi_dung: '', ly_do: '' };
            return (
              '<div class="wf-man-m3-rec-row">' +
                '<strong>' + esc(k.label) + '</strong>' +
                '<select class="select input--sm" data-wf-man="khuyen_nghi.' + esc(k.key) + '.ap_dung">' +
                  [['co', 'Áp dụng'], ['khong', 'Không áp dụng'], ['chua_ro', 'Chưa rõ']].map(function (o) {
                    return '<option value="' + o[0] + '"' + (cur.ap_dung === o[0] ? ' selected' : '') + '>' + o[1] + '</option>';
                  }).join('') +
                '</select>' +
                '<input type="text" class="input input--sm" data-wf-man="khuyen_nghi.' + esc(k.key) + '.noi_dung" value="' + esc(cur.noi_dung || '') + '" placeholder="Nội dung...">' +
                '<input type="text" class="input input--sm" data-wf-man="khuyen_nghi.' + esc(k.key) + '.ly_do" value="' + esc(cur.ly_do || '') + '" placeholder="Lý do...">' +
              '</div>'
            );
          }).join('') +
        '</div></div>' +
        '<div class="wf-subblock"><h4>Kế hoạch theo dõi (DD #180) <button type="button" class="btn btn--secondary btn--xs" data-wf-man-add-followup="1">' + ICONS.plus + ' Thêm lịch theo dõi</button></h4>' +
          '<div class="wf-list-editor">' + followups.map(function (f, idx) {
            const isStr = typeof f === 'string';
            const hm = isStr ? f : (f && f.hang_muc ? f.hang_muc : '');
            const td = isStr ? '' : (f && f.thoi_diem ? f.thoi_diem : '');
            const ld = isStr ? '' : (f && f.ly_do ? f.ly_do : '');
            return (
              '<div class="wf-man-m3-rec-row">' +
                '<input type="text" class="input input--sm" data-wf-man-followup="' + idx + ':hang_muc" value="' + esc(hm) + '" placeholder="Nội dung theo dõi">' +
                '<input type="text" class="input input--sm" data-wf-man-followup="' + idx + ':thoi_diem" value="' + esc(td) + '" placeholder="Thời điểm (tùy chọn)">' +
                '<input type="text" class="input input--sm" data-wf-man-followup="' + idx + ':ly_do" value="' + esc(ld) + '" placeholder="Lý do (tùy chọn)">' +
                (followups.length > 1 ? '<button type="button" class="btn btn--ghost btn--xs" data-wf-man-rm-followup="' + idx + '">' + ICONS.trash + '</button>' : '') +
              '</div>'
            );
          }).join('') + '</div>' +
        '</div>' +
        renderM3SelectedPrescriptionBox(wf, false);
    } else if (mod === 'm4') {
      const alerts = Array.isArray(draft.canh_bao) ? draft.canh_bao : [];
      fieldsHtml =
        '<div class="wf-subblock"><h4>Danh sách cảnh báo an toàn thuốc <button type="button" class="btn btn--secondary btn--xs" data-wf-man-m4-add-alert="1">' + ICONS.plus + ' Thêm cảnh báo</button></h4>' +
        (alerts.length === 0
          ? '<p class="field__help">Không có cảnh báo trong bản tự nhập hiện tại.</p>'
          : '<div class="wf-alert-stack">' + alerts.map(function (al, idx) {
              return (
                '<div class="wf-man-m4-alert-wrap">' +
                  '<div class="wf-man-m4-alert-edit">' +
                    '<input type="text" class="input input--sm" data-wf-man-m4-alert="' + idx + ':loai" value="' + esc(al.loai || '') + '" placeholder="Loại cảnh báo">' +
                    '<select class="select input--sm" data-wf-man-m4-alert="' + idx + ':muc_do">' +
                      ['Nghiêm trọng', 'Quan trọng', 'Theo dõi'].map(function (lv) { return '<option value="' + esc(lv) + '"' + (al.muc_do === lv ? ' selected' : '') + '>' + esc(lv) + '</option>'; }).join('') +
                    '</select>' +
                    '<input type="text" class="input input--sm" data-wf-man-m4-alert="' + idx + ':noi_dung" value="' + esc(al.noi_dung || '') + '" placeholder="Nội dung cảnh báo">' +
                    '<input type="text" class="input input--sm" data-wf-man-m4-alert="' + idx + ':hanh_dong_de_xuat" value="' + esc(al.hanh_dong_de_xuat || '') + '" placeholder="Hành động đề xuất">' +
                    '<button type="button" class="btn btn--ghost btn--xs" data-wf-man-m4-rm-alert="' + idx + '" aria-label="Xóa cảnh báo">' + ICONS.trash + '</button>' +
                  '</div>' +
                  renderM4AlertCard(al, wf, true, true) +
                '</div>'
              );
            }).join('') + '</div>') +
        '</div>' +
        '<div class="wf-form-grid" style="margin-top:12px;">' +
          '<div class="field"><label class="field__label">Đề xuất chỉnh liều (mỗi dòng 1 mục)</label><textarea class="textarea" rows="2" data-wf-man-lines="de_xuat_chinh_lieu">' + esc((draft.de_xuat_chinh_lieu || []).join('\n')) + '</textarea></div>' +
          '<div class="field"><label class="field__label">Đơn giản hóa phác đồ (mỗi dòng 1 mục)</label><textarea class="textarea" rows="2" data-wf-man-lines="don_gian_hoa_phac_do">' + esc((draft.don_gian_hoa_phac_do || []).join('\n')) + '</textarea></div>' +
          '<div class="field"><label class="field__label">Giảm / ngừng thuốc cần cân nhắc</label><textarea class="textarea" rows="2" data-wf-man-lines="giam_ngung_thuoc">' + esc((draft.giam_ngung_thuoc || []).join('\n')) + '</textarea></div>' +
          '<div class="field"><label class="field__label">Độ bao phủ &amp; Khoảng trống dữ liệu</label>' +
            '<select class="select input--sm" data-wf-man="coverage" style="margin-bottom:6px;"><option value="incomplete"' + (draft.coverage !== 'complete' ? ' selected' : '') + '>Chưa đầy đủ (incomplete)</option><option value="complete"' + (draft.coverage === 'complete' ? ' selected' : '') + '>Đầy đủ (complete)</option></select>' +
            '<textarea class="textarea" rows="2" data-wf-man-lines="dataGaps">' + esc((draft.dataGaps || []).join('\n')) + '</textarea></div>' +
        '</div>';
    }

    return (
      '<section class="wf-manual-panel" aria-label="Biểu mẫu tự nhập kết quả">' +
        '<div class="wf-manual-panel__head">' +
          '<div><h3>Tự nhập kết quả Module ' + meta.num + ' (thay cho kết quả AI)</h3><p class="field__help">Biểu mẫu giữ nguyên cấu trúc schema của AI. Lịch sử các lần chạy AI trước vẫn được bảo toàn.</p></div>' +
          '<button type="button" class="btn btn--secondary btn--sm" data-wf-prefill-manual="' + esc(mod) + '">Điền sẵn từ kết quả AI</button>' +
        '</div>' +
        fieldsHtml +
        '<div class="field" style="margin-top:14px;">' +
          '<label class="field__label" for="wf-manual-reason">Lý do tự nhập / điều chỉnh so với AI <span class="badge badge--warn badge--xs">Bắt buộc</span></label>' +
          '<textarea id="wf-manual-reason" class="textarea' + (wf.manualReasonError ? ' input--error' : '') + '" data-wf-manual-reason="1" placeholder="Ghi rõ căn cứ lâm sàng hoặc lý do điều chỉnh so với kết quả AI...">' + esc(wf.manualReason) + '</textarea>' +
          (wf.manualReasonError ? '<p class="field__error">' + ICONS.alert + ' ' + esc(wf.manualReasonError) + '</p>' : '') +
        '</div>' +
        '<div class="wf-manual-panel__foot">' +
          '<button type="button" class="btn btn--ghost" data-wf-cancel-manual="1"' + (wf.submittingAction ? ' disabled' : '') + '>Quay lại kết quả AI</button>' +
          '<button type="button" class="btn btn--primary' + (wf.submittingAction ? ' is-loading' : '') + '" data-wf-submit-manual="' + esc(mod) + '"' + (wf.submittingAction ? ' disabled' : '') + '>' +
            (wf.submittingAction ? 'Đang lưu...' : (isM4 ? 'Lưu và hoàn tất workflow' : 'Lưu và tiếp tục')) +
          '</button>' +
        '</div>' +
      '</section>'
    );
  }

  function renderWorkflow() {
    const wf = state.workflow;
    if (wf.loading) {
      return renderShell('<span class="breadcrumbs__current">Đang tải luồng 4 Module AI...</span>', '<div class="skeleton-stack"><div class="skeleton-bar"></div><div class="skeleton-card"></div></div>');
    }
    if (wf.error || !wf.data) {
      const backBtn = wf.isPharmacistView
        ? ''
        : '<button type="button" class="btn btn--secondary btn--sm" data-nav="#/patients">Quay lại danh sách</button>';
      const retryBtn = wf.errorStatus === 0 && wf.visitId
        ? '<button type="button" class="btn btn--primary btn--sm" data-wf-reload="1">Thử lại</button>'
        : '';
      return renderShell(
        '<span class="breadcrumbs__current">Luồng 4 Module AI</span>',
        '<div class="banner banner--error" role="alert"><div class="banner__main">' + ICONS.alert + '<div><p class="banner__desc">' + esc(wf.error || NOT_FOUND_OR_NO_ACCESS_MSG) + '</p></div></div><div style="display:flex;gap:8px;">' + retryBtn + backBtn + '</div></div>'
      );
    }

    const v = wf.visit;
    const pt = wf.patient;
    const isPharm = wf.isPharmacistView;
    const mod = isPharm ? 'm4' : wf.activeModule;
    const meta = WF_MODULE_META[mod] || WF_MODULE_META.m1;
    const ms = isPharm
      ? { module: 'm4', state: wf.data.state || 'locked', attemptCount: 0, availableActions: [], missingFieldCodes: [], staleReasons: [], staleChangedAt: null, staleChangedModule: null }
      : ((wf.data.modules && wf.data.modules[mod]) || { module: mod, state: 'locked', attemptCount: 0, availableActions: [], missingFieldCodes: [], staleReasons: [] });

    const isRunning = Boolean(ms.isRunning || wf.runningModule === mod);
    const isManual = !isPharm && wf.manualModeModule === mod;
    const actions = Array.isArray(ms.availableActions) ? ms.availableActions : [];
    const hasAction = function (act) { return !isPharm && !isRunning && !wf.submittingAction && !wf.savingFields && actions.indexOf(act) >= 0; };

    const stickyHead =
      '<div class="encounter-sticky-head">' +
        '<div>' +
          '<div class="encounter-sticky-head__id">' +
            (pt ? ('<span class="mono">' + esc(pt.patientCode) + '</span><span>' + esc(pt.fullName) + '</span>') : '<span>Lượt khám</span>') +
            '<span class="badge badge--blue mono">' + esc((v && v.visitCode) || wf.visitId) + '</span>' +
            '<span class="badge badge--info">v1.2 · Luồng 4 Module</span>' +
            (wf.data.completed ? '<span class="badge badge--success">Đã hoàn tất workflow</span>' : '') +
          '</div>' +
          '<div class="encounter-sticky-head__meta">' +
            (v ? ('<span class="tabular">' + esc(formatDateTime(v.visitDate)) + ' · ' + esc(formatVisitType(v.visitType)) + '</span>') : '') +
          '</div>' +
        '</div>' +
        '<div class="encounter-sticky-head__right">' +
          (!isPharm ? '<button type="button" class="btn btn--secondary btn--sm" data-nav="#/visits/' + esc(wf.visitId) + '">' + ICONS.arrowLeft + ' Về biểu mẫu 8 nhóm</button>' : '') +
          (!isPharm ? '<button type="button" class="btn btn--secondary btn--sm" data-nav="#/visits/' + esc(wf.visitId) + '/review">Về Xem lại &amp; Xác nhận</button>' : '') +
        '</div>' +
      '</div>';

    const pharmacistBanner = isPharm
      ? '<div class="banner banner--info" role="status"><div class="banner__main">' + ICONS.shield + '<div><p class="banner__title">Chế độ Dược sĩ (chỉ xem)</p><p class="banner__desc">Chế độ Dược sĩ (chỉ xem) — Bạn chỉ có quyền xem Module 4: An toàn thuốc (MedSafety) và danh sách thuốc liên quan.</p></div></div></div>'
      : '';

    const errorBanner = wf.bannerError ? (
      '<div class="banner banner--error wf-error-banner" role="alert">' +
        '<div class="banner__main">' + ICONS.alert + '<div>' +
          '<p class="banner__desc">' + esc(wf.bannerError) + '</p>' +
          (wf.bannerErrorFields.length > 0 ? (
            '<div class="ai-missing-chips" style="margin-top:8px;">' +
              wf.bannerErrorFields.map(function (ef) {
                const resolved = resolveFormFieldCode(wf.fieldMetadata, ef.fieldCode);
                const lbl = AI_ISSUE_DISPLAY_LABELS[resolved] || AI_ISSUE_DISPLAY_LABELS[ef.fieldCode] || resolved;
                return '<button type="button" class="jump-chip jump-chip--info ai-missing-chip" data-wf-open-form="' + esc(mod + ':' + resolved) + '">' + esc(lbl) + ' ↗</button>';
              }).join('') +
            '</div>'
          ) : '') +
        '</div></div>' +
        ((wf.bannerErrorStatus === 409 || wf.bannerErrorStatus === 0 || wf.bannerErrorStatus === 503 || wf.bannerErrorStatus === 504)
          ? '<button type="button" class="btn btn--secondary btn--sm" data-wf-reload="1">' + ICONS.refresh + ' Đồng bộ lại trạng thái</button>'
          : '') +
      '</div>'
    ) : '';

    // Stale banner (uses staleChangedModule and staleChangedAt directly from API, with clean Vietnamese fallback if null)
    let staleBanner = '';
    if (ms.state === 'stale') {
      const changedModTitle = ms.staleChangedModule ? wfFormatModuleTitle(ms.staleChangedModule) : '';
      const changedAtFmt = ms.staleChangedAt ? formatDateTime(ms.staleChangedAt) : '';
      const hasValidTime = Boolean(changedAtFmt && changedAtFmt !== '—');
      let staleDetailHtml = '';
      if (changedModTitle && hasValidTime) {
        staleDetailHtml = 'Dữ liệu ở <strong>' + esc(changedModTitle) + '</strong> đã thay đổi lúc <strong class="tabular">' + esc(changedAtFmt) + '</strong>.';
      } else if (changedModTitle) {
        staleDetailHtml = 'Dữ liệu ở <strong>' + esc(changedModTitle) + '</strong> đã thay đổi.';
      } else if (hasValidTime) {
        staleDetailHtml = 'Dữ liệu bước trước đã thay đổi lúc <strong class="tabular">' + esc(changedAtFmt) + '</strong>.';
      } else {
        staleDetailHtml = 'Dữ liệu bước trước đã thay đổi.';
      }
      staleBanner =
        '<div class="banner banner--error wf-stale-banner" role="alert">' +
          '<div class="banner__main">' + ICONS.refresh + '<div>' +
            '<p class="banner__title">Cần chạy lại ' + esc(wfFormatModuleTitle(mod)) + '</p>' +
            '<p class="banner__desc">Cần chạy lại ' + esc(wfFormatModuleTitle(mod)) + ' — ' + staleDetailHtml + ' Kết quả bên dưới thuộc lần chạy trước và có thể không còn phù hợp. Hệ thống không tự chạy lại.</p>' +
            (Array.isArray(ms.staleReasons) && ms.staleReasons.length > 0 ? '<p class="field__help" style="margin-top:4px;">Nguyên nhân: ' + esc(ms.staleReasons.join('; ')) + '</p>' : '') +
          '</div></div>' +
        '</div>';
    }

    // D5: Results & Decisions ONLY — Missing fields redirect to the 8-group form (filter to mod & focus exact field)
    const missingCodes = (Array.isArray(ms.missingFieldCodes) ? ms.missingFieldCodes : []).filter(function (fc) { return fc !== 'selected_medications'; });
    const firstMissingResolved = missingCodes.length > 0 ? resolveFormFieldCode(wf.fieldMetadata, missingCodes[0]) : '';
    const missingBanner = (!isPharm && missingCodes.length > 0) ? (
      '<div class="ai-missing-block wf-missing-banner">' +
        '<div class="wf-missing-banner__head">' +
          '<div class="ai-missing-block__title">' + ICONS.alert + ' Còn thiếu ' + missingCodes.length + ' trường để bật nút "Chạy Module ' + meta.num + '":</div>' +
          '<button type="button" class="btn btn--primary btn--sm" data-wf-open-form="' + esc(mod + ':' + firstMissingResolved) + '">Nhập trong biểu mẫu ↗</button>' +
        '</div>' +
        '<div class="ai-missing-chips">' +
          missingCodes.map(function (fc) {
            const resolved = resolveFormFieldCode(wf.fieldMetadata, fc);
            const fd = wf.formRes && Array.isArray(wf.formRes.fieldDefinitions)
              ? wf.formRes.fieldDefinitions.find(function (d) { return d.code === resolved || d.code === fc; })
              : null;
            const lbl = (fd && fd.labelVi) || AI_ISSUE_DISPLAY_LABELS[resolved] || AI_ISSUE_DISPLAY_LABELS[fc] || resolved;
            return '<button type="button" class="jump-chip jump-chip--info ai-missing-chip" data-wf-open-form="' + esc(mod + ':' + resolved) + '">' + esc(lbl) + ' ↗</button>';
          }).join('') +
        '</div>' +
      '</div>'
    ) : '';

    // D5: Decision-only guidance when awaiting run (no input fields rendered on workflow screen)
    const preRunHintHtml = (!isPharm && !isManual && (ms.state === 'needs_input' || ms.state === 'ready')) ? (
      '<div class="wf-decision-hint">' +
        '<div class="wf-decision-hint__text">' +
          (ms.state === 'ready'
            ? '<strong>Dữ liệu đầu vào cho Module ' + meta.num + ' đã đủ.</strong> Bấm <em>' + (ms.attemptCount > 0 ? ('Chạy lại Module ' + meta.num) : ('Chạy Module ' + meta.num)) + '</em> bên dưới để xem kết quả, hoặc mở biểu mẫu nếu cần bổ sung.'
            : 'Mọi dữ liệu lâm sàng được nhập tại <strong>Biểu mẫu 8 nhóm</strong>. Hoàn thiện các trường còn thiếu rồi bấm Chạy Module ' + meta.num + '.') +
        '</div>' +
        '<button type="button" class="btn btn--secondary btn--sm" data-wf-open-form="' + esc(mod + (firstMissingResolved ? (':' + firstMissingResolved) : '')) + '">' +
          (missingCodes.length > 0 ? 'Nhập trong biểu mẫu ↗' : ('Mở biểu mẫu (lọc ' + esc(mod.toUpperCase()) + ') ↗')) +
        '</button>' +
      '</div>'
    ) : '';

    // M2 decision control: Confirm reuse of recent lab/imaging tests
    const m2EvidenceHtml = (!isPharm && !isManual && mod === 'm2' && ms.state !== 'locked')
      ? renderM2RecentTestEvidenceBox(wf, isRunning)
      : '';

    // Output panel (visible when ran / accepted / stale, or pharmacist M4 view)
    const outInfo = wfGetEffectiveOrLatestOutput(wf, mod);
    const showOutputPanel = !isManual && ((isPharm && wf.data.output) || (!isPharm && outInfo && outInfo.output && (ms.state === 'ran' || ms.state === 'accepted' || ms.state === 'stale')));
    const histRuns = wf.historyRuns[mod] || [];
    const failedCount = (typeof ms.succeededAttemptCount === 'number' && ms.attemptCount > ms.succeededAttemptCount) ? (ms.attemptCount - ms.succeededAttemptCount) : 0;
    const stateInfo = wfFormatStateInfo(isRunning ? 'running' : ms.state, ms);
    const outputPanelHtml = showOutputPanel ? (
      '<section class="wf-output-panel' + (ms.state === 'stale' ? ' wf-output-panel--stale' : '') + '" aria-label="Kết quả Module ' + meta.num + '">' +
        '<div class="wf-sim-banner" role="note">' +
          '<div class="wf-sim-banner__left">' + ICONS.alert + ' <strong>' + esc((wf.data && wf.data.simulationLabel) || WF_SIMULATION_LABEL) + '</strong></div>' +
          '<div class="wf-sim-banner__right mono">Engine: ' + esc(outInfo.engine || 'mock-rules') + ' · Luật: ' + esc(outInfo.rulesVersion || 'mock-1.1') + '</div>' +
        '</div>' +
        '<div class="wf-meta-strip">' +
          '<div class="wf-meta-strip__left">' +
            (ms.state === 'stale' ? '<span class="badge badge--error">Cần chạy lại</span>' : '') +
            (outInfo.attempt ? '<span class="badge badge--neutral tabular">Lần chạy #' + esc(outInfo.attempt) + '</span>' : '') +
            (failedCount > 0 ? '<span class="badge badge--warn tabular">Tổng ' + esc(ms.attemptCount) + ' lần (' + esc(failedCount) + ' thất bại)</span>' : '') +
            (outInfo.source === 'manual' ? '<span class="badge badge--blue">Nguồn: Tự nhập</span>' : '<span class="badge badge--info">Nguồn: AI</span>') +
            (outInfo.timestamp ? '<span class="cell-sub tabular">Thời điểm: ' + esc(formatDateTime(outInfo.timestamp)) + '</span>' : '') +
          '</div>' +
          (!isPharm && ms.attemptCount > 0 ? (
            '<button type="button" class="btn btn--ghost btn--sm" data-wf-toggle-history="' + esc(mod) + '">' + ICONS.history + ' ' +
              (wf.historyOpen[mod] ? 'Thu gọn lịch sử' : ('Xem lịch sử các lần chạy (' + esc(ms.attemptCount) + ')')) +
            '</button>'
          ) : '') +
        '</div>' +
        (!isPharm && wf.historyOpen[mod] ? (
          '<div class="wf-history-drawer">' +
            '<strong>Lịch sử các lần chạy Module ' + meta.num + '</strong>' +
            (histRuns.length === 0
              ? '<p class="field__help">Đang có ' + esc(ms.attemptCount) + ' lần chạy được ghi nhận trên máy chủ.</p>'
              : '<div class="wf-history-list">' + histRuns.map(function (r) {
                  const isLatest = r.id === ms.latestRunId;
                  const isSel = (wf.historySelectedRun[mod] || ms.latestRunId) === r.id;
                  return (
                    '<div class="wf-history-item' + (isSel ? ' is-selected' : '') + '">' +
                      '<div><strong>Lần #' + esc(r.attempt) + '</strong> · <span class="tabular">' + esc(formatDateTime(r.finishedAt || r.startedAt)) + '</span> · ' +
                        (r.status === 'failed' ? '<span class="badge badge--error badge--xs">Thất bại</span>' : '<span class="badge badge--info badge--xs">AI</span>') + ' ' +
                        (isLatest ? '<span class="badge badge--success badge--xs">Mới nhất</span>' : '<span class="badge badge--neutral badge--xs">Bản cũ</span>') +
                      '</div>' +
                      (r.output ? '<button type="button" class="btn btn--ghost btn--xs" data-wf-view-run="' + esc(mod) + ':' + esc(r.id) + '">Xem chi tiết</button>' : '') +
                    '</div>'
                  );
                }).join('') + '</div>') +
          '</div>'
        ) : '') +
        '<div class="wf-output-body">' +
          renderModuleOutputBody(mod, outInfo.output, wf, false) +
          (mod === 'm3' && !isPharm && (hasAction('continue_next') || hasAction('accept_ai')) ? renderM3SelectedPrescriptionBox(wf, false) : '') +
        '</div>' +
      '</section>'
    ) : (isPharm && !wf.data.output ? '<div class="empty-state"><h3 class="empty-state__title">Module 4 chưa có kết quả</h3><p class="empty-state__desc">Trạng thái hiện tại: <strong>' + esc(stateInfo.label) + '</strong>. Bác sĩ chưa chạy Module 4 cho lượt khám này.</p></div>' : '');

    const manualFormHtml = isManual ? renderManualOverrideForm(wf, mod) : '';

    // Action Bar strictly driven by `availableActions` from API (never inferred!)
    let actionBarHtml = '';
    if (!isPharm && !isManual && ms.state !== 'locked') {
      const btns = [];
      let statusNote = '';
      if (isRunning) {
        statusNote = 'Đang chạy mô phỏng... các nút tạm khóa để tránh bấm 2 lần.';
        btns.push('<button type="button" class="btn btn--primary is-loading" disabled>Đang chạy Module ' + meta.num + '...</button>');
      } else {
        if (hasAction('edit')) {
          btns.push('<button type="button" class="btn btn--secondary" data-wf-action="edit" data-wf-module="' + esc(mod) + '">' + ICONS.edit + ' Chỉnh sửa</button>');
        }
        if (hasAction('run')) {
          btns.push('<button type="button" class="btn btn--primary" data-wf-action="run" data-wf-module="' + esc(mod) + '">' + ICONS.play + ' Chạy Module ' + meta.num + '</button>');
        } else if (ms.state === 'needs_input' && !hasAction('rerun')) {
          const tip = 'Còn thiếu ' + missingCodes.length + ' trường bắt buộc cho Module ' + meta.num + ' — nhập trong biểu mẫu 8 nhóm để bật nút này.';
          btns.push('<button type="button" class="btn btn--primary" data-wf-disabled-action="run" disabled title="' + esc(tip) + '">' + ICONS.play + ' Chạy Module ' + meta.num + '</button>');
          statusNote = tip;
        }
        if (hasAction('rerun')) {
          btns.push('<button type="button" class="btn btn--primary" data-wf-action="rerun" data-wf-module="' + esc(mod) + '">' + ICONS.refresh + ' Chạy lại Module ' + meta.num + '</button>');
        }
        if (hasAction('continue_next') && meta.nextNum) {
          btns.push('<button type="button" class="btn btn--primary" data-wf-action="continue_next" data-wf-module="' + esc(mod) + '">Tiếp tục sang Module ' + meta.nextNum + ' ' + ICONS.arrowRight + '</button>');
        }
        if (hasAction('accept_ai')) {
          btns.push('<button type="button" class="btn btn--primary" data-wf-action="accept_ai" data-wf-module="' + esc(mod) + '">' + ICONS.checkCircle + ' Sử dụng kết quả AI</button>');
        }
        if (hasAction('manual_override')) {
          const manLabel = mod === 'm4' ? 'Tự nhập đánh giá an toàn và hoàn tất' : 'Tự nhập chẩn đoán và tiếp tục';
          btns.push('<button type="button" class="btn btn--navy" data-wf-action="manual_override" data-wf-module="' + esc(mod) + '">' + ICONS.edit + ' ' + esc(manLabel) + '</button>');
        }
        if (mod === 'm4') {
          if (hasAction('complete')) {
            btns.push('<button type="button" class="btn btn--primary" data-wf-action="complete" data-wf-module="m4">' + ICONS.checkCircle + ' Hoàn tất workflow</button>');
          } else if (ms.state === 'ran' || (ms.state === 'accepted' && !wf.data.completed)) {
            const pendingCount = (wf.data.pendingSeriousAlertIds || []).length;
            const cTip = 'Chưa thể hoàn tất workflow: còn ' + (pendingCount || 1) + ' cảnh báo mức Nghiêm trọng chưa có quyết định hoặc thiếu lý do.';
            btns.push('<button type="button" class="btn btn--primary" data-wf-disabled-action="complete" disabled title="' + esc(cTip) + '">' + ICONS.checkCircle + ' Hoàn tất workflow</button>');
            statusNote = cTip;
          }
        }
      }
      if (btns.length > 0) {
        actionBarHtml =
          '<div class="wf-action-bar" role="region" aria-label="Thanh hành động Module ' + meta.num + '">' +
            '<div class="wf-action-bar__status">' + esc(statusNote || ('Trạng thái: ' + stateInfo.label + (ms.attemptCount ? (' · Lần chạy #' + ms.attemptCount) : ''))) + '</div>' +
            '<div class="wf-action-bar__btns">' + btns.join('') + '</div>' +
          '</div>';
      }
    }

    const stageCard =
      '<section class="card wf-stage-card" data-wf-active-module="' + esc(mod) + '" data-wf-state="' + esc(ms.state) + '">' +
        '<div class="card__header wf-stage-card__head">' +
          '<div>' +
            '<h2 class="card__title">' + esc(meta.full) + '</h2>' +
            '<p class="card__subtitle">Màn xem kết quả và quyết định theo từng bước — không chạy chuỗi tự động.</p>' +
          '</div>' +
          '<div class="wf-stage-card__badges">' +
            '<span class="badge badge--' + esc(stateInfo.badgeCls) + '">' + esc(stateInfo.label) + '</span>' +
            (ms.attemptCount > 0 ? '<span class="badge badge--neutral tabular">Lần chạy #' + esc(ms.attemptCount) + '</span>' : '') +
          '</div>' +
        '</div>' +
        '<div class="card__body wf-stage-card__body">' +
          errorBanner +
          staleBanner +
          missingBanner +
          preRunHintHtml +
          m2EvidenceHtml +
          outputPanelHtml +
          manualFormHtml +
        '</div>' +
        actionBarHtml +
      '</section>';

    const body = stickyHead + pharmacistBanner + renderWorkflowStepper(wf) + renderUpstreamSummaryStack(wf) + stageCard;
    const crumbs = isPharm
      ? '<span class="breadcrumbs__current">Module 4 · An toàn thuốc (Chế độ Dược sĩ)</span>'
      : (
        '<button type="button" class="breadcrumbs__link" data-nav="#/patients">Hồ sơ bệnh nhân</button><span>/</span>' +
        (pt ? '<button type="button" class="breadcrumbs__link mono" data-nav="#/patients/' + esc(pt.id) + '">' + esc(pt.patientCode) + '</button><span>/</span>' : '') +
        '<button type="button" class="breadcrumbs__link mono" data-nav="#/visits/' + esc(wf.visitId) + '">' + esc((v && v.visitCode) || wf.visitId) + '</button><span>/</span>' +
        '<span class="breadcrumbs__current">Luồng 4 Module AI</span>'
      );
    return renderShell(crumbs, body);
  }

  /* ------------------------------------------------------------------------
     M6: Admin Accounts & Two-Step Permission Review
     ------------------------------------------------------------------------ */
  function renderAdminUsers() {
    const au = state.adminUsers;
    let listHtml = '';
    if (au.loading) {
      listHtml = '<div class="skeleton-stack"><div class="skeleton-bar"></div><div class="skeleton-card"></div></div>';
    } else if (au.error) {
      listHtml = '<div class="banner banner--error"><div class="banner__main">' + ICONS.alert + '<div><p class="banner__desc">' + esc(au.error) + '</p></div></div></div>';
    } else if (au.items.length === 0) {
      listHtml = '<div class="empty-state"><h3 class="empty-state__title">Không có tài khoản nào khớp bộ lọc</h3><p class="empty-state__desc">Thử xóa bộ lọc hoặc tạo tài khoản mới.</p></div>';
    } else {
      const rows = au.items.map(function (u) {
        const isAdm = u.role === 'admin';
        return (
          '<tr>' +
            '<td class="mono cell-primary">' + esc(u.username) + '</td>' +
            '<td>' + esc(u.fullName) + '</td>' +
            '<td>' + (isAdm ? '<span class="badge badge--blue">Quản trị viên</span>' : '<span class="badge badge--info">Bác sĩ</span>') + '</td>' +
            '<td><span class="cell-sub">' + (isAdm ? 'Quản lý tài khoản, biểu mẫu, nhật ký (không xem hồ sơ bệnh án)' : 'Xem/tạo hồ sơ bệnh nhân, nhập và xác nhận lượt khám') + '</span></td>' +
            '<td>' + (u.isActive ? '<span class="badge badge--success">Đang hoạt động</span>' : '<span class="badge badge--error">Đã khóa</span>') + '</td>' +
            '<td class="tabular cell-sub">' + esc(formatDateTime(u.lastLoginAt)) + '</td>' +
            '<td style="text-align:right;white-space:nowrap;">' +
              '<button type="button" class="btn btn--secondary btn--sm" data-admin-edit-user="' + esc(u.id) + '">Sửa quyền</button> ' +
              '<button type="button" class="btn btn--ghost btn--sm" data-admin-reset-pw="' + esc(u.id) + '">Đặt lại MK</button> ' +
              '<button type="button" class="btn ' + (u.isActive ? 'btn--danger-outline' : 'btn--secondary') + ' btn--sm" data-admin-toggle-lock="' + esc(u.id) + '">' + (u.isActive ? 'Khóa' : 'Mở khóa') + '</button>' +
            '</td>' +
          '</tr>'
        );
      }).join('');

      const cards = au.items.map(function (u) {
        const isAdm = u.role === 'admin';
        return (
          '<article class="record-card">' +
            '<div class="record-card__top">' +
              '<div><div class="cell-primary mono">' + esc(u.username) + '</div><div class="cell-sub">' + esc(u.fullName) + '</div></div>' +
              (u.isActive ? '<span class="badge badge--success">Đang hoạt động</span>' : '<span class="badge badge--error">Đã khóa</span>') +
            '</div>' +
            '<div class="record-card__meta">' +
              '<div><span class="record-card__label">Vai trò</span>' + (isAdm ? 'Quản trị viên' : 'Bác sĩ') + '</div>' +
              '<div><span class="record-card__label">Đăng nhập gần nhất</span>' + esc(formatDateTime(u.lastLoginAt)) + '</div>' +
            '</div>' +
            '<div style="display:flex;gap:6px;flex-wrap:wrap;">' +
              '<button type="button" class="btn btn--secondary btn--sm" data-admin-edit-user="' + esc(u.id) + '">Sửa quyền</button>' +
              '<button type="button" class="btn btn--ghost btn--sm" data-admin-reset-pw="' + esc(u.id) + '">Đặt lại MK</button>' +
              '<button type="button" class="btn ' + (u.isActive ? 'btn--danger-outline' : 'btn--secondary') + ' btn--sm" data-admin-toggle-lock="' + esc(u.id) + '">' + (u.isActive ? 'Khóa' : 'Mở khóa') + '</button>' +
            '</div>' +
          '</article>'
        );
      }).join('');

      listHtml =
        '<div class="card"><div class="table-wrap"><table class="data-table"><thead><tr><th>Tên đăng nhập</th><th>Họ tên hiển thị</th><th>Vai trò</th><th>Phạm vi quyền</th><th>Trạng thái</th><th>Đăng nhập gần nhất</th><th style="text-align:right;">Thao tác</th></tr></thead><tbody>' + rows + '</tbody></table></div></div>' +
        '<div class="mobile-cards">' + cards + '</div>';
    }

    const body =
      '<div class="page-head">' +
        '<div><h1 class="page-head__title">Quản lý tài khoản &amp; Phạm vi quyền</h1><p class="page-head__sub">Quản lý tài khoản bác sĩ, quản trị viên và phạm vi quyền tương ứng.</p></div>' +
        '<div class="page-head__actions"><button type="button" class="btn btn--primary" data-action="open-create-user">' + ICONS.userPlus + ' Tạo tài khoản mới</button></div>' +
      '</div>' +
      '<div class="toolbar">' +
        '<div class="search-box"><span class="search-box__icon">' + ICONS.search + '</span><input type="search" id="admin-user-search" class="input" placeholder="Tìm tên đăng nhập hoặc họ tên..." value="' + esc(au.q) + '"></div>' +
        '<div class="filter-pills">' +
          '<select class="select" id="admin-user-role-filter" style="width:auto;min-height:36px;">' +
            '<option value="">Tất cả vai trò</option>' +
            '<option value="doctor"' + (au.role === 'doctor' ? ' selected' : '') + '>Bác sĩ</option>' +
            '<option value="admin"' + (au.role === 'admin' ? ' selected' : '') + '>Quản trị viên</option>' +
          '</select>' +
          '<select class="select" id="admin-user-active-filter" style="width:auto;min-height:36px;">' +
            '<option value="">Tất cả trạng thái</option>' +
            '<option value="true"' + (au.isActive === 'true' ? ' selected' : '') + '>Đang hoạt động</option>' +
            '<option value="false"' + (au.isActive === 'false' ? ' selected' : '') + '>Đã khóa</option>' +
          '</select>' +
        '</div>' +
      '</div>' +
      listHtml;

    return renderShell('<span class="breadcrumbs__current">Tài khoản &amp; Quyền</span>', body);
  }

  /* ------------------------------------------------------------------------
     M7: Admin Form Versions, 3-Pane Editor, Doctor Preview, Diff & Publish
     ------------------------------------------------------------------------ */
  function renderAdminForms() {
    const af = state.adminForms;
    if (af.loading && !af.versionDetail) {
      return renderShell('<span class="breadcrumbs__current">Biểu mẫu &amp; Phiên bản</span>', '<div class="skeleton-stack"><div class="skeleton-bar"></div><div class="skeleton-card"></div></div>');
    }

    const existingDraft = af.versions.find(function (v) { return v.status === 'draft'; }) || null;
    const formatVerStatus = function (st) {
      if (st === 'published') return 'Đang dùng';
      if (st === 'draft') return 'Bản nháp';
      return 'Đã lưu trữ';
    };
    const verCards = af.versions.map(function (v) {
      const sel = v.id === af.selectedVersionId;
      const badge = v.status === 'published'
        ? '<span class="badge badge--success">Đang dùng</span>'
        : (v.status === 'draft' ? '<span class="badge badge--warn">Bản nháp</span>' : '<span class="badge badge--info">Đã lưu trữ</span>');
      return (
        '<button type="button" class="version-card' + (sel ? ' is-selected' : '') + '" data-select-version="' + esc(v.id) + '">' +
          '<div class="version-card__top"><strong class="mono" style="font-size:16px;">' + esc(v.versionLabel) + '</strong>' + badge + '</div>' +
          '<div class="cell-sub">' + esc(v.changeNote || 'Phiên bản biểu mẫu lâm sàng') + '</div>' +
          '<div class="cell-sub tabular">Gắn ' + esc(v.visitCount || 0) + ' lượt khám</div>' +
        '</button>'
      );
    }).join('');

    let workspaceHtml = '';
    if (af.versionDetail) {
      const fv = af.versionDetail.formVersion;
      const isDraft = fv.status === 'draft';
      const defMap = {};
      (af.versionDetail.fieldDefinitions || []).forEach(function (fd) { defMap[fd.id] = fd; });
      const defByCode = {};
      (af.versionDetail.fieldDefinitions || []).forEach(function (fd) { defByCode[fd.code] = fd; });

      const lockBanner = !isDraft ? (
        '<div class="banner banner--info">' +
          '<div class="banner__main">' + ICONS.lock + '<div><p class="banner__title">Phiên bản ' + esc(fv.versionLabel) + ' đã khóa</p><p class="banner__desc">Phiên bản đã phát hành hoặc đã có lượt khám sử dụng không thể chỉnh sửa trực tiếp. Mọi thay đổi cần thực hiện trên bản nháp phiên bản mới.</p></div></div>' +
          '<div class="banner__actions">' +
            (existingDraft
              ? '<button type="button" class="btn btn--primary btn--sm" data-action="continue-form-draft" data-draft-id="' + esc(existingDraft.id) + '">Tiếp tục chỉnh bản nháp (' + esc(existingDraft.versionLabel) + ')</button>'
              : '<button type="button" class="btn btn--primary btn--sm" data-action="create-form-draft">' + ICONS.plus + ' Tạo bản nháp mới từ ' + esc(fv.versionLabel) + '</button>') +
          '</div>' +
        '</div>'
      ) : (
        '<div class="banner banner--warn">' +
          '<div class="banner__main">' + ICONS.layers + '<div><p class="banner__title">Đang chỉnh sửa Bản nháp ' + esc(fv.versionLabel) + (af.draftDirty ? ' (có thay đổi chưa lưu)' : '') + '</p><p class="banner__desc">Chỉnh sửa cấu trúc nhóm và trường dữ liệu, xem trước góc nhìn Bác sĩ, so sánh thay đổi rồi phát hành.</p></div></div>' +
          '<div class="banner__actions">' +
            '<button type="button" class="btn btn--secondary btn--sm" data-action="cancel-form-draft-edits"' + (!af.draftDirty ? ' disabled title="Chưa có thay đổi chưa lưu"' : '') + '>Hủy chỉnh sửa</button>' +
            '<button type="button" class="btn btn--danger-outline btn--sm" data-action="confirm-delete-form-draft">' + ICONS.trash + ' Xóa bản nháp</button>' +
            '<button type="button" class="btn btn--primary btn--sm" data-action="save-form-draft"' + (!af.draftDirty ? ' disabled' : '') + '>' + ICONS.save + ' Lưu bản nháp</button>' +
          '</div>' +
        '</div>'
      );

      let tabBody = '';
      if (af.activeTab === 'editor') {
        const secs = af.draftSections || [];
        const activeSec = secs.find(function (s) { return s.sectionCode === af.selectedSectionCode; }) || secs[0];
        const editorHasVisitNotes = hasVisitNotesPlacements(secs, defMap);

        function getEditorSectionFields(sec) {
          const base = (sec && sec.fields) ? sec.fields.slice() : [];
          if (sec && sec.sectionCode === 'ghi_chu' && !editorHasVisitNotes) {
            return base.concat(buildVirtualVisitNoteFields(sec));
          }
          return base;
        }

        const secListHtml = secs.map(function (s, idx) {
          const sFields = getEditorSectionFields(s);
          const visCount = sFields.filter(function (f) { return f.isVisible; }).length;
          return (
            '<div class="editor-item' + (activeSec && s.sectionCode === activeSec.sectionCode ? ' is-selected' : '') + '" data-ed-section="' + esc(s.sectionCode) + '">' +
              '<div class="editor-item__text"><div class="editor-item__name">' + String(idx + 1).padStart(2, '0') + '. ' + esc(s.titleVi) + '</div><div class="editor-item__sub">' + visCount + '/' + sFields.length + ' trường hiển thị</div></div>' +
            '</div>'
          );
        }).join('');

        const realFieldsInSec = activeSec ? (activeSec.fields || []) : [];
        const fieldsInSec = activeSec ? getEditorSectionFields(activeSec) : [];
        const fq = String(af.fieldSearch || '').trim().toLowerCase();
        const filteredFields = fieldsInSec.map(function (ff, origIdx) {
          return { ff: ff, origIdx: origIdx };
        }).filter(function (entry) {
          if (!fq) return true;
          const fd = defMap[entry.ff.fieldDefinitionId] || entry.ff._virtualDef || {};
          const lbl = String(entry.ff.customLabelVi || fd.labelVi || '').toLowerCase();
          const code = String(fd.code || entry.ff.fieldCode || '').toLowerCase();
          return lbl.indexOf(fq) >= 0 || code.indexOf(fq) >= 0;
        });

        const fieldListHtml = filteredFields.length === 0
          ? '<p class="field__help" style="padding:10px;">Không tìm thấy trường nào khớp từ khóa.</p>'
          : filteredFields.map(function (entry) {
              const ff = entry.ff;
              const idx = entry.origIdx;
              const fd = defMap[ff.fieldDefinitionId] || ff._virtualDef || {};
              const flags = getFieldMetaFlags(ff, fd);
              const sel = ff.fieldDefinitionId === af.selectedFieldDefId;
              const badges = [];
              if (flags.computed) badges.push('<span class="badge badge--blue badge--xs">Tự tính</span>');
              if (flags.system) badges.push('<span class="badge badge--info badge--xs">Trường hệ thống</span>');
              return (
                '<div class="editor-item' + (sel ? ' is-selected' : '') + (!ff.isVisible ? ' is-hidden-field' : '') + '" data-ed-field="' + esc(ff.fieldDefinitionId) + '" data-ed-field-code="' + esc(fd.code || ff.fieldCode || '') + '">' +
                  '<div class="editor-item__text">' +
                    '<div class="editor-item__name">' + esc(getFieldLabel(ff, fd)) + '</div>' +
                    '<div class="editor-item__sub">' + esc(formatDataTypeVi(fd.dataType)) + (!ff.isVisible ? ' · Đang ẩn' : '') + (ff.requiredForConfirm ? ' · Bắt buộc xác nhận' : '') + '</div>' +
                    (badges.length > 0 ? '<div class="editor-item__badges">' + badges.join('') + '</div>' : '') +
                  '</div>' +
                  (isDraft && !fq && !ff._virtualSystem ? (
                    '<div class="order-btns">' +
                      '<button type="button" class="icon-btn" title="Lên (Alt+↑)" data-move-field="' + idx + ':-1"' + (idx === 0 ? ' disabled' : '') + '>' + ICONS.up + '</button>' +
                      '<button type="button" class="icon-btn" title="Xuống (Alt+↓)" data-move-field="' + idx + ':1"' + (idx >= realFieldsInSec.length - 1 ? ' disabled' : '') + '>' + ICONS.down + '</button>' +
                    '</div>'
                  ) : '') +
                '</div>'
              );
            }).join('');

        const activeFF = fieldsInSec.find(function (ff) { return ff.fieldDefinitionId === af.selectedFieldDefId; }) || (filteredFields[0] && filteredFields[0].ff) || fieldsInSec[0];
        const activeFD = activeFF ? (defMap[activeFF.fieldDefinitionId] || activeFF._virtualDef || {}) : null;
        const activeFlags = activeFF && activeFD ? getFieldMetaFlags(activeFF, activeFD) : null;
        const canEditPlacement = Boolean(isDraft && activeFF && !activeFF._virtualSystem);
        const lockRequiredProp = Boolean(!canEditPlacement || (activeFlags && (activeFlags.computed || activeFlags.readonlyInput)));

        let systemExplainHtml = '';
        if (activeFF && activeFD && activeFlags && (activeFlags.computed || activeFlags.system)) {
          let explainText = '';
          if (activeFD.code === 'bmi') {
            explainText = 'Tự động tính BMI (kg/m²) từ Chiều cao và Cân nặng của cùng lượt khám. Bác sĩ không nhập trực tiếp; khóa kiểu dữ liệu, đường lưu và công thức tính.';
          } else if (activeFlags.computed) {
            explainText = 'Trường hệ thống tự tính toán, hiển thị chỉ đọc ở màn Bác sĩ. Khóa kiểu nhập, mức lưu trữ, công thức và tùy chọn bắt buộc nhập.';
          } else if (activeFlags.isListStateField) {
            explainText = 'Trường hệ thống xác nhận trạng thái cấp danh sách (Có / Không có / Chưa rõ), lưu trực tiếp trên lượt khám để phân biệt "Đã xác nhận không có" với "Chưa rõ". Khóa mã trường, kiểu dữ liệu và đường lưu; Quản trị viên được sửa nhãn, hướng dẫn, thứ tự và hiển thị.';
          } else if (activeFlags.isVisitNote) {
            explainText = activeFF._virtualSystem
              ? 'Trường siêu dữ liệu mặc định của lượt khám trên phiên bản v1.0 (lưu ở visit.infoSource / visit.clinicalNote). Phiên bản v1.1 đưa 2 trường này vào cấu hình để Quản trị viên tùy chỉnh nhãn, hướng dẫn, hiển thị và thứ tự.'
              : 'Trường hệ thống của lượt khám (lưu ở visit.infoSource / visit.clinicalNote). Khóa mã trường, kiểu dữ liệu và đường lưu; Quản trị viên được sửa nhãn hiển thị, hướng dẫn, thứ tự, hiển thị và bắt buộc.';
          } else if (activeFlags.isPatientSystem) {
            explainText = 'Trường hệ thống đồng bộ từ hồ sơ hành chính bệnh nhân, chỉ đọc trên màn lượt khám. Khóa kiểu nhập, đường lưu và tùy chọn bắt buộc nhập.';
          } else {
            explainText = 'Trường hệ thống (khóa mã trường, kiểu dữ liệu và mức lưu trữ). Quản trị viên chỉ chỉnh các thuộc tính hiển thị được phép.';
          }
          systemExplainHtml =
            '<div class="editor-system-note" data-system-field-note="' + esc(activeFD.code || '') + '">' +
              '<div class="editor-system-note__head">' +
                (activeFlags.computed ? '<span class="badge badge--blue badge--xs">Tự tính</span>' : '') +
                '<span class="badge badge--info badge--xs">Trường hệ thống</span>' +
                (activeFlags.locked ? '<span class="badge badge--neutral badge--xs">Khóa thuộc tính hệ thống</span>' : '') +
              '</div>' +
              '<div>' + esc(explainText) + '</div>' +
            '</div>';
        }

        const defaultHelpPlaceholder = activeFD ? sanitizeDoctorHelpText(activeFD.helpText) : '';
        const propHtml = !activeFF || !activeFD ? '<p class="field__help">Chọn một trường ở cột giữa để xem hoặc cấu hình thuộc tính.</p>' : (
          systemExplainHtml +
          '<div class="field"><label class="field__label">Nhãn hiển thị tiếng Việt</label><input class="input" data-ed-prop="customLabelVi" value="' + esc(activeFF.customLabelVi || activeFD.labelVi) + '"' + (!canEditPlacement ? ' disabled' : '') + '></div>' +
          '<div class="field"><label class="field__label">Kiểu nhập liệu (khóa hệ thống)</label><input class="input" value="' + esc(formatDataTypeVi(activeFD.dataType) + (activeFD.canonicalUnit ? ' · Đơn vị: ' + activeFD.canonicalUnit : '')) + '" disabled></div>' +
          '<div class="field"><label class="field__label">Ghi chú hướng dẫn bác sĩ (tùy chọn)</label><textarea class="textarea" data-ed-prop="customHelpText" placeholder="' + esc(defaultHelpPlaceholder || 'Nhập hướng dẫn lâm sàng hiển thị cho bác sĩ...') + '"' + (!canEditPlacement ? ' disabled' : '') + '>' + esc(activeFF.customHelpText || '') + '</textarea></div>' +
          '<label class="choice-row"><input type="checkbox" data-ed-prop="isVisible"' + (activeFF.isVisible ? ' checked' : '') + (!canEditPlacement ? ' disabled' : '') + '><span><strong>Hiển thị trường này cho lượt khám mới</strong><div class="cell-sub">Tắt để ngừng dùng ở lượt mới mà không làm mất dữ liệu lượt cũ.</div></span></label>' +
          '<label class="choice-row"><input type="checkbox" data-ed-prop="requiredForConfirm"' + (activeFF.requiredForConfirm ? ' checked' : '') + (lockRequiredProp ? ' disabled' : '') + '><span><strong>Bắt buộc khi xác nhận lượt khám</strong><div class="cell-sub">' + (activeFlags && (activeFlags.computed || activeFlags.readonlyInput) ? 'Khóa: không áp dụng bắt buộc nhập tay cho trường tự tính / chỉ đọc.' : 'Lưu nháp vẫn cho phép bỏ trống; chỉ yêu cầu khi bấm Xác nhận.') + '</div></span></label>' +
          '<details class="details-tech">' +
            '<summary>Thông tin kỹ thuật (mã trường &amp; nguồn)</summary>' +
            '<div class="details-tech__body">' +
              '<div class="field"><label class="field__label">Mã chuẩn hóa (field_definition.code)</label><input class="input mono" value="' + esc(activeFD.code) + '" disabled></div>' +
              '<div class="field"><label class="field__label">Mức lưu trữ &amp; Phạm vi</label><input class="input" value="' + esc(formatStorageLevelVi(activeFD.storageLevel) + ' · ' + formatScopeVi(activeFD.scopeStatus)) + '" disabled></div>' +
              (activeFD.repeatGroup ? '<div class="field"><label class="field__label">Nhóm lặp &amp; Cột (repeatGroup / memberPath)</label><input class="input mono" value="' + esc(activeFD.repeatGroup + (activeFD.memberPath ? '.' + activeFD.memberPath : '')) + '" disabled></div>' : '') +
            '</div>' +
          '</details>'
        );

        tabBody =
          '<div class="editor-3pane">' +
            '<div class="editor-pane"><div class="editor-pane__head"><h3 class="editor-pane__title">1. Nhóm biểu mẫu (' + secs.length + ')</h3></div><div class="editor-pane__scroll">' + secListHtml + '</div></div>' +
            '<div class="editor-pane">' +
              '<div class="editor-pane__head"><h3 class="editor-pane__title">2. Trường trong nhóm (' + filteredFields.length + '/' + fieldsInSec.length + ')</h3><span class="kbd">Alt+↑/↓</span></div>' +
              '<div class="editor-pane__search"><input type="search" id="admin-form-field-search" class="input" placeholder="Tìm trường theo tên hoặc mã..." value="' + esc(af.fieldSearch) + '"></div>' +
              '<div class="editor-pane__scroll">' + fieldListHtml + '</div>' +
            '</div>' +
            '<div class="editor-pane"><div class="editor-pane__head"><h3 class="editor-pane__title">3. Thuộc tính trường</h3></div><div class="editor-pane__scroll" style="gap:10px;">' + propHtml + '</div></div>' +
          '</div>';
      } else if (af.activeTab === 'preview') {
        const pd = af.previewData;
        if (af.previewError) {
          tabBody = '<div class="banner banner--error" role="alert"><div class="banner__main">' + ICONS.alert + '<div><p class="banner__title">Không thể dựng bản xem trước</p><p class="banner__desc">' + esc(af.previewError) + '</p></div></div></div>';
        } else if (!pd) {
          tabBody = '<div class="skeleton-stack"><div class="skeleton-bar"></div><div class="skeleton-card"></div></div>';
        } else {
          const pDefById = {};
          const pDefByCode = {};
          (pd.fieldDefinitions || []).forEach(function (fd) { pDefById[fd.id] = fd; pDefByCode[fd.code] = fd; });
          const pSections = sortByDisplayOrder(pd.sections || []);
          const pRail = pSections.map(function (s) {
            return '<button type="button" class="rail-btn' + (s.sectionCode === af.previewSectionCode ? ' is-active' : '') + '" data-prev-section="' + esc(s.sectionCode) + '"><span><span class="rail-btn__num">' + String(s.displayOrder).padStart(2, '0') + '</span>' + esc(s.titleVi) + '</span></button>';
          }).join('');

          tabBody =
            '<div class="banner banner--blue"><div class="banner__main">' + ICONS.eye + '<div><p class="banner__title">' + esc(pd.previewBannerVi) + '</p>' +
              (af.draftDirty ? '<p class="banner__desc">Đang xem trước trạng thái đang chỉnh sửa (chưa lưu xuống CSDL). Quay lại tab "Chỉnh sửa biểu mẫu" để Lưu hoặc Hủy chỉnh sửa.</p>' : '') +
            '</div></div></div>' +
            '<div class="encounter-layout">' +
              '<aside class="group-rail"><div class="group-rail__title">Mục lục 8 nhóm</div>' + pRail + '</aside>' +
              '<div class="form-canvas">' +
                renderClinicalSectionForm({
                  mode: 'preview',
                  readonly: false,
                  sections: pSections,
                  defById: pDefById,
                  defByCode: pDefByCode,
                  valuesByDefId: af.previewValues,
                  orthostaticBp: af.previewBp,
                  medications: af.previewMeds,
                  allergies: af.previewAllergies,
                  labResults: af.previewLabs,
                  diagnoses: af.previewDiagnoses,
                  medicationListState: af.previewMedicationListState,
                  allergyListState: af.previewAllergyListState,
                  diagnosisListState: af.previewDiagnosisListState,
                  supportsListStates: isV11Bundle(pd.formVersion, pSections, pDefById),
                  formVersion: pd.formVersion,
                  clinicalNote: af.previewClinicalNote,
                  infoSource: af.previewInfoSource,
                  patient: null,
                  visit: null,
                  activeSectionCode: af.previewSectionCode,
                  search: af.previewSearch,
                  filter: 'all',
                  fieldErrors: {}
                }) +
              '</div>' +
            '</div>';
        }
      } else if (af.activeTab === 'diff') {
        const baseOpts = af.versions.map(function (v) {
          return '<option value="' + esc(v.id) + '"' + (v.id === af.diffBaseVersionId ? ' selected' : '') + '>' + esc(v.versionLabel + ' (' + formatVerStatus(v.status) + ')') + '</option>';
        }).join('');
        const dd = af.diffData;
        const unsavedDiffWarn = af.draftDirty
          ? '<div class="banner banner--warn"><div class="banner__main">' + ICONS.alert + '<div><p class="banner__title">Có chỉnh sửa chưa lưu trên bản nháp</p><p class="banner__desc">Bảng so sánh dưới đây phản ánh bản nháp đã lưu trên máy chủ. Bấm "Lưu bản nháp" ở thanh trên để cập nhật thay đổi mới nhất trước khi phát hành.</p></div></div></div>'
          : '';
        let diffContent = '<div class="skeleton-stack"><div class="skeleton-bar"></div></div>';
        if (dd) {
          if (!dd.hasChanges) {
            diffContent = '<div class="empty-state"><h3 class="empty-state__title">Chưa có thay đổi cấu trúc so với phiên bản đối chiếu</h3><p class="empty-state__desc">Chỉnh sửa nhãn, bật/tắt trường hoặc thay đổi thứ tự ở tab "Chỉnh sửa bản nháp" và lưu nháp để xem đối chiếu thay đổi.</p></div>';
          } else {
            diffContent =
              '<div class="diff-list">' +
                (dd.addedFields || []).map(function (item) {
                  return '<div class="diff-row diff-row--added"><strong>+ Thêm mới / Bật hiển thị: ' + esc(item.labelVi) + '</strong><span class="cell-sub">' + esc(item.currentAttributeSummary || '') + '</span></div>';
                }).join('') +
                (dd.modifiedFields || []).map(function (item) {
                  return '<div class="diff-row diff-row--changed"><strong>~ Chỉnh sửa: ' + esc(item.labelVi) + '</strong><span class="cell-sub">' + esc(item.currentAttributeSummary || '') + '</span></div>';
                }).join('') +
                (dd.removedFields || []).map(function (item) {
                  return '<div class="diff-row diff-row--removed"><strong>- Ngừng dùng cho lượt mới: ' + esc(item.labelVi) + '</strong><span class="cell-sub">' + esc(item.currentAttributeSummary || '') + '</span></div>';
                }).join('') +
              '</div>';
          }
        }

        const pubGate = isDraft ? (
          '<section class="confirm-gate">' +
            '<div class="banner banner--info" style="margin-bottom:0;"><div class="banner__main">' + ICONS.shield + '<div><p class="banner__title">Tác động khi phát hành phiên bản ' + esc(fv.versionLabel) + '</p><p class="banner__desc">Phiên bản mới chỉ áp dụng cho các lượt khám tạo <strong>sau thời điểm phát hành</strong>. Phiên bản đang dùng trước đó chuyển sang Đã lưu trữ; toàn bộ lượt khám cũ giữ nguyên cấu trúc cũ và không mất dữ liệu.</p></div></div></div>' +
            '<div class="field"><label class="field__label" for="publish-note-input">Ghi chú phát hành</label><input id="publish-note-input" type="text" class="input" placeholder="VD: Bổ sung trường đánh giá khả năng nuốt theo khuyến cáo lâm sàng" value="' + esc(af.publishNote) + '"></div>' +
            '<div style="display:flex;justify-content:flex-end;"><button type="button" class="btn btn--primary" data-action="publish-form-version">' + ICONS.checkCircle + ' Phát hành phiên bản ' + esc(fv.versionLabel) + '</button></div>' +
          '</section>'
        ) : '';

        tabBody =
          unsavedDiffWarn +
          '<div class="toolbar">' +
            '<div class="field" style="max-width:340px;width:100%;"><label class="field__label" for="diff-base-select">So sánh ' + esc(fv.versionLabel) + ' với phiên bản gốc:</label><select id="diff-base-select" class="select">' + baseOpts + '</select></div>' +
          '</div>' +
          diffContent + pubGate;
      }

      workspaceHtml =
        lockBanner +
        '<div class="tabs" role="tablist">' +
          '<button type="button" class="tab-btn' + (af.activeTab === 'editor' ? ' is-active' : '') + '" data-form-tab="editor">Chỉnh sửa biểu mẫu</button>' +
          '<button type="button" class="tab-btn' + (af.activeTab === 'preview' ? ' is-active' : '') + '" data-form-tab="preview">Xem trước góc nhìn Bác sĩ</button>' +
          '<button type="button" class="tab-btn' + (af.activeTab === 'diff' ? ' is-active' : '') + '" data-form-tab="diff">So sánh thay đổi &amp; Phát hành</button>' +
        '</div>' +
        tabBody;
    }

    const body =
      '<div class="page-head">' +
        '<div><h1 class="page-head__title">Quản lý biểu mẫu &amp; Phiên bản</h1><p class="page-head__sub">' + esc(af.template ? af.template.name : 'Biểu mẫu lâm sàng suy tim') + ' · Danh mục chuẩn ' + af.allDefinitions.length + ' trường.</p></div>' +
      '</div>' +
      '<div class="version-cards">' + verCards + '</div>' +
      workspaceHtml;

    return renderShell('<span class="breadcrumbs__current">Biểu mẫu &amp; Phiên bản</span>', body);
  }

  /* ------------------------------------------------------------------------
     M8: Admin Audit Log
     ------------------------------------------------------------------------ */
  function renderAdminAudit() {
    const aa = state.adminAudit;
    const outcomeBadge = function (o) {
      if (o === 'success') return '<span class="badge badge--success">Thành công</span>';
      if (o === 'denied') return '<span class="badge badge--error">Từ chối</span>';
      return '<span class="badge badge--warn">Thất bại</span>';
    };
    const roleVi = function (r) {
      if (r === 'admin') return 'Quản trị viên';
      if (r === 'doctor') return 'Bác sĩ';
      return r || '—';
    };

    let listHtml = '';
    if (aa.loading) {
      listHtml = '<div class="skeleton-stack"><div class="skeleton-bar"></div><div class="skeleton-card"></div></div>';
    } else if (aa.items.length === 0) {
      listHtml = '<div class="empty-state"><h3 class="empty-state__title">Không có bản ghi nhật ký nào khớp bộ lọc</h3><p class="empty-state__desc">Thử mở rộng khoảng thời gian hoặc đặt lại điều kiện tìm kiếm.</p></div>';
    } else {
      const rows = aa.items.map(function (l) {
        return (
          '<tr>' +
            '<td class="tabular">' + esc(formatDateTime(l.occurredAt)) + '</td>' +
            '<td><div class="cell-primary mono">' + esc(l.actorUsername || 'Ẩn danh') + '</div><div class="cell-sub">' + esc(roleVi(l.actorRole)) + '</div></td>' +
            '<td>' + esc(formatAuditAction(l.action)) + '</td>' +
            '<td>' + esc(formatAuditEntity(l.entityType)) + '</td>' +
            '<td>' + outcomeBadge(l.outcome) + '</td>' +
            '<td style="text-align:right;"><button type="button" class="btn btn--secondary btn--sm" data-audit-select="' + esc(l.id) + '">Xem chi tiết</button></td>' +
          '</tr>'
        );
      }).join('');

      const cards = aa.items.map(function (l) {
        return (
          '<article class="record-card">' +
            '<div class="record-card__top"><div><div class="cell-primary">' + esc(formatAuditAction(l.action)) + '</div><div class="cell-sub tabular">' + esc(formatDateTime(l.occurredAt)) + '</div></div>' + outcomeBadge(l.outcome) + '</div>' +
            '<div class="record-card__meta">' +
              '<div><span class="record-card__label">Người thực hiện</span><span class="mono">' + esc(l.actorUsername || 'Ẩn danh') + '</span></div>' +
              '<div><span class="record-card__label">Đối tượng</span>' + esc(formatAuditEntity(l.entityType)) + '</div>' +
            '</div>' +
            '<button type="button" class="btn btn--secondary btn--sm btn--full" data-audit-select="' + esc(l.id) + '">Xem chi tiết</button>' +
          '</article>'
        );
      }).join('');

      listHtml =
        '<div class="card"><div class="table-wrap"><table class="data-table"><thead><tr><th>Thời điểm</th><th>Người thực hiện</th><th>Hành động</th><th>Đối tượng</th><th>Kết quả</th><th style="text-align:right;">Chi tiết</th></tr></thead><tbody>' + rows + '</tbody></table></div></div>' +
        '<div class="mobile-cards">' + cards + '</div>';
    }

    const body =
      '<div class="page-head">' +
        '<div><h1 class="page-head__title">Tra cứu nhật ký hệ thống</h1><p class="page-head__sub">Theo dõi sự kiện đăng nhập, phân quyền, phát hành biểu mẫu và xác nhận lượt khám.</p></div>' +
      '</div>' +
      '<div class="audit-filters">' +
        '<input type="search" id="audit-q" class="input" placeholder="Tìm người thực hiện hoặc mã yêu cầu..." value="' + esc(aa.q) + '">' +
        '<select id="audit-action" class="select">' +
          '<option value="">Tất cả hành động</option>' +
          ['login', 'logout', 'login_failed', 'user_create', 'user_update', 'form_version_create', 'form_version_update', 'form_version_delete', 'form_version_publish', 'patient_create', 'visit_confirm', 'ai_input_export', 'care_assignment_add', 'care_assignment_revoke'].map(function (a) {
            return '<option value="' + a + '"' + (aa.action === a ? ' selected' : '') + '>' + esc(formatAuditAction(a)) + '</option>';
          }).join('') +
        '</select>' +
        '<select id="audit-entity" class="select">' +
          '<option value="">Tất cả đối tượng</option>' +
          ['app_user', 'user_session', 'patient', 'visit', 'visit_revision', 'form_version', 'care_assignment'].map(function (e) {
            return '<option value="' + e + '"' + (aa.entityType === e ? ' selected' : '') + '>' + esc(formatAuditEntity(e)) + '</option>';
          }).join('') +
        '</select>' +
        '<input type="date" id="audit-from" class="input" aria-label="Từ ngày" value="' + esc(aa.fromDate) + '">' +
        '<input type="date" id="audit-to" class="input" aria-label="Đến ngày" value="' + esc(aa.toDate) + '">' +
      '</div>' +
      listHtml;

    return renderShell('<span class="breadcrumbs__current">Nhật ký hệ thống</span>', body);
  }

  /* ------------------------------------------------------------------------
     M9: Admin Care Coordination (Multi-doctor assignment + history, K8 compliant)
     ------------------------------------------------------------------------ */
  function renderAdminCare() {
    const ac = state.adminCare;
    let contentHtml = '';

    if (ac.error) {
      contentHtml = '<div class="banner banner--error" role="alert"><div class="banner__main">' + ICONS.alert + '<div><p class="banner__desc">' + esc(ac.error) + '</p></div></div></div>';
    } else if (ac.loading) {
      contentHtml = '<div class="skeleton-stack"><div class="skeleton-bar"></div><div class="skeleton-card"></div></div>';
    } else {
      const ptListHtml = ac.patients.length === 0
        ? '<div class="empty-state"><h3 class="empty-state__title">Không tìm thấy hồ sơ nào</h3><p class="empty-state__desc">Thử thay đổi từ khóa mã hoặc tên bệnh nhân.</p></div>'
        : '<div class="care-admin-list">' + ac.patients.map(function (p) {
            const sel = p.id === ac.selectedPatientId;
            const docs = p.assignedDoctors || (p.primaryDoctorName ? [p.primaryDoctorName] : []);
            return (
              '<button type="button" class="care-patient-item' + (sel ? ' is-selected' : '') + '" data-admin-care-patient="' + esc(p.id) + '">' +
                '<div class="care-patient-item__top">' +
                  '<strong class="mono">' + esc(p.patientCode) + '</strong>' +
                  '<span class="badge ' + (docs.length > 0 ? 'badge--blue' : 'badge--warn') + ' badge--xs">' + (docs.length > 0 ? (docs.length + ' bác sĩ') : 'Chưa phân công') + '</span>' +
                '</div>' +
                '<div class="cell-sub">' + esc(p.fullName) + '</div>' +
                (docs.length > 0 ? '<div style="margin-top:4px;">' + renderAssignedDoctorsBadges(docs) + '</div>' : '') +
              '</button>'
            );
          }).join('') + '</div>';

      let detailHtml = '<div class="empty-state"><h3 class="empty-state__title">Chọn một bệnh nhân ở danh sách bên trái</h3><p class="empty-state__desc">Quản trị viên chỉ xem mã và tên hồ sơ để phân công nhiều bác sĩ phụ trách và xem lịch sử phân công, không xem dữ liệu lâm sàng.</p></div>';
      if (ac.selectedPatient) {
        const sp = ac.selectedPatient;
        const activeList = (ac.assignments || []).filter(isAssignmentActiveNow);
        const historyList = (ac.assignments || []).filter(function (a) { return !isAssignmentActiveNow(a); });

        const renderAdminRow = function (a, allowRevoke) {
          const active = isAssignmentActiveNow(a);
          const stBadge = a.revokedAt
            ? '<span class="badge badge--neutral badge--xs">Đã thu hồi</span>'
            : '<span class="badge badge--success badge--xs">Đang phụ trách</span>';
          const assignedByText = a.assignedByName ? (' · Phân công bởi ' + a.assignedByName) : '';
          const revokedText = a.revokedAt ? (' · Thu hồi lúc ' + formatDateTime(a.revokedAt) + (a.revokedByName ? (' bởi ' + a.revokedByName) : '')) : '';
          return (
            '<div class="care-row' + (!active ? ' care-row--inactive' : '') + '">' +
              '<div class="care-row__main">' +
                '<div class="care-row__top"><strong>' + esc(a.doctorName || 'Bác sĩ') + '</strong>' + stBadge + '</div>' +
                '<div class="cell-sub tabular">Từ ' + esc(formatDateTime(a.assignedAt || a.validFrom)) + esc(assignedByText) + esc(revokedText) + '</div>' +
                (a.note || a.reason ? '<div class="cell-sub">Ghi chú: ' + esc(a.note || a.reason) + '</div>' : '') +
              '</div>' +
              (allowRevoke && active ? '<button type="button" class="btn btn--danger-outline btn--sm" data-admin-revoke-assignment="' + esc(a.id) + '">Thu hồi</button>' : '') +
            '</div>'
          );
        };

        detailHtml =
          '<div class="card">' +
            '<div class="card__header">' +
              '<div><h2 class="card__title"><span class="mono">' + esc(sp.patientCode) + '</span> · ' + esc(sp.fullName) + '</h2><p class="card__subtitle">Đang phân công cho <strong>' + activeList.length + '</strong> bác sĩ (không hiển thị dữ liệu lâm sàng theo K8).</p></div>' +
              '<div class="care-box__actions">' +
                '<button type="button" class="btn btn--secondary btn--sm" data-action="admin-open-replace-assignments">' + ICONS.users + ' Chọn nhiều bác sĩ</button>' +
                '<button type="button" class="btn btn--primary btn--sm" data-action="admin-open-add-assignment">' + ICONS.userPlus + ' Thêm bác sĩ phụ trách</button>' +
              '</div>' +
            '</div>' +
            '<div class="card__body">' +
              (ac.assignmentsLoading
                ? '<div class="skeleton-stack"><div class="skeleton-bar"></div></div>'
                : (activeList.length === 0
                    ? '<p class="field__help">Hồ sơ này chưa có bác sĩ nào được phân công.</p>'
                    : '<div class="care-list">' + activeList.map(function (a) { return renderAdminRow(a, true); }).join('') + '</div>') +
                  '<div style="margin-top:16px;" data-assignment-history="true">' +
                    '<div class="sub-heading">Lịch sử phân công (' + (ac.assignments || []).length + ')</div>' +
                    (historyList.length === 0
                      ? '<p class="field__help">Chưa có lượt thu hồi phân công nào trước đó.</p>'
                      : '<div class="care-list">' + historyList.map(function (a) { return renderAdminRow(a, false); }).join('') + '</div>') +
                  '</div>') +
            '</div>' +
          '</div>';
      }

      contentHtml =
        '<div class="toolbar">' +
          '<div class="search-box"><span class="search-box__icon">' + ICONS.search + '</span><input type="search" id="admin-care-search" class="input" placeholder="Tìm theo mã BN-xxxxx hoặc tên bệnh nhân..." value="' + esc(ac.q) + '"></div>' +
        '</div>' +
        '<div class="care-admin-grid">' +
          '<div class="card"><div class="card__header"><div><h2 class="card__title">Danh mục bệnh nhân (' + ac.patients.length + ')</h2><p class="card__subtitle">Chỉ mã hồ sơ, tên bệnh nhân và bác sĩ phụ trách.</p></div></div><div class="card__body" style="padding:10px;">' + ptListHtml + '</div></div>' +
          '<div>' + detailHtml + '</div>' +
        '</div>';
    }

    const body =
      '<div class="page-head">' +
        '<div><h1 class="page-head__title">Phân công bác sĩ phụ trách</h1><p class="page-head__sub">Thêm hoặc thu hồi nhiều bác sĩ phụ trách cho từng hồ sơ và theo dõi lịch sử phân công. Quản trị viên chỉ thấy mã và tên hồ sơ, không thấy dữ liệu lâm sàng (K8).</p></div>' +
      '</div>' +
      contentHtml;

    return renderShell('<span class="breadcrumbs__current">Phân công bác sĩ</span>', body);
  }

  /* ------------------------------------------------------------------------
     Modals (Create/Edit Patient, Create Visit, Create Revision, Unsaved Guard,
             Admin 2-Step User Permission Modal, Lock/Reset Password, Setup Code)
     ------------------------------------------------------------------------ */
  function openModal(modalObj) {
    if (state.modal && state.modal.type === 'change-password') {
      document.querySelectorAll('#change-password-form input').forEach(function (input) { input.value = ''; });
      document.getElementById('app-root').inert = false;
    }
    state.modal = modalObj;
    renderModal();
  }

  function closeModal() {
    const m = state.modal;
    if (m && m.type === 'change-password' && m.pending) return;
    if (m && m.type === 'change-password') {
      document.querySelectorAll('#change-password-form input').forEach(function (input) { input.value = ''; });
      document.getElementById('app-root').inert = false;
    }
    state.modal = null;
    renderModal();
    if (m && m.type === 'change-password') {
      const trigger = visibleAccountTrigger(m.returnFocus);
      if (trigger) trigger.focus();
    }
  }

  function renderModal() {
    const backdrop = document.getElementById('modal-backdrop');
    const dialog = document.getElementById('modal-dialog');
    if (!backdrop || !dialog) return;
    const m = state.modal;
    if (!m) {
      backdrop.hidden = true;
      dialog.innerHTML = '';
      return;
    }
    backdrop.hidden = false;
    if (m.type === 'change-password' && document.getElementById('change-password-form')) return;
    let html = '';

    if (m.type === 'change-password') {
      const fields = [
        { id: 'cp-current', name: 'currentPassword', label: 'Mật khẩu hiện tại', min: 1, autocomplete: 'current-password' },
        { id: 'cp-new', name: 'newPassword', label: 'Mật khẩu mới', min: 8, autocomplete: 'new-password' },
        { id: 'cp-confirm', name: 'confirmPassword', label: 'Xác nhận mật khẩu mới', min: 8, autocomplete: 'new-password' }
      ];
      html = '<form id="change-password-form" class="change-password-form" novalidate>' +
        '<div class="modal__head"><h2 class="modal__title" id="modal-title">Đổi mật khẩu</h2><button type="button" class="icon-btn" data-action="close-modal" aria-label="Đóng">' + ICONS.x + '</button></div>' +
        '<div class="modal__body"><p class="field__help" id="cp-help">Mật khẩu mới có từ 8 đến 128 ký tự và khác mật khẩu hiện tại. ' +
          (api.isStatic ? 'Thay đổi chỉ áp dụng trên trình duyệt này. Các tab khác của tài khoản sẽ cần đăng nhập lại.' : 'Các phiên đăng nhập khác sẽ kết thúc sau khi đổi.') + '</p>' +
        '<p class="field__error" id="cp-error" role="alert" hidden></p>' +
        fields.map(function (field) {
          return '<div class="field"><label class="field__label" for="' + field.id + '">' + field.label + '</label>' +
            '<div class="password-wrap"><input class="input" type="password" id="' + field.id + '" name="' + field.name + '" autocomplete="' + field.autocomplete + '" minlength="' + field.min + '" maxlength="256" required aria-describedby="cp-help cp-error">' +
            '<button type="button" class="password-toggle" data-password-toggle="' + field.id + '" aria-controls="' + field.id + '" aria-label="Hiện ' + field.label.toLowerCase() + '" aria-pressed="false">' + ICONS.eye + '</button></div></div>';
        }).join('') + '</div>' +
        '<div class="modal__foot"><button type="button" class="btn btn--secondary" data-action="close-modal">Hủy</button><button type="submit" class="btn btn--primary" id="cp-submit">Đổi mật khẩu</button></div></form>';
    }

    if (m.type === 'patient-form') {
      const isEdit = Boolean(m.patientId);
      const d = m.data;
      html =
        '<div class="modal__head"><h2 class="modal__title" id="modal-title">' + (isEdit ? 'Cập nhật hành chính hồ sơ ' + esc(d.patientCode) : 'Tạo hồ sơ bệnh nhân mới') + '</h2><button type="button" class="icon-btn" data-action="close-modal" aria-label="Đóng">' + ICONS.x + '</button></div>' +
        '<div class="modal__body">' +
          (m.error ? '<div class="banner banner--error"><div class="banner__main">' + ICONS.alert + '<div><p class="banner__desc">' + esc(m.error) + '</p></div></div></div>' : '') +
          '<div class="field"><label class="field__label" for="mf-fullname">Họ tên / Ký hiệu hồ sơ *</label><input id="mf-fullname" class="input" value="' + esc(d.fullName) + '" placeholder="VD: Nguyễn Minh An"></div>' +
          '<div class="field"><label class="field__label" for="mf-sex">Giới tính *</label><select id="mf-sex" class="select">' +
            '<option value=""' + (!d.sex ? ' selected' : '') + '>-- Chưa chọn --</option>' +
            '<option value="female"' + (d.sex === 'female' ? ' selected' : '') + '>Nữ</option>' +
            '<option value="male"' + (d.sex === 'male' ? ' selected' : '') + '>Nam</option>' +
            '<option value="unknown"' + (d.sex === 'unknown' ? ' selected' : '') + '>Chưa rõ</option>' +
          '</select></div>' +
          '<div class="field"><label class="field__label">Độ chính xác ngày sinh / tuổi</label><div class="radio-group">' +
            '<label class="choice-row"><input type="radio" name="mf-bmode" value="date"' + (d.birthMode === 'date' ? ' checked' : '') + '><span>Ngày sinh đầy đủ (dd/mm/yyyy)</span></label>' +
            '<label class="choice-row"><input type="radio" name="mf-bmode" value="year"' + (d.birthMode === 'year' ? ' checked' : '') + '><span>Chỉ biết năm sinh (không tự tạo 01/01)</span></label>' +
            '<label class="choice-row"><input type="radio" name="mf-bmode" value="age"' + (d.birthMode === 'age' ? ' checked' : '') + '><span>Chỉ biết tuổi ước lượng</span></label>' +
            '<label class="choice-row"><input type="radio" name="mf-bmode" value="none"' + (d.birthMode === 'none' ? ' checked' : '') + '><span>Chưa có thông tin</span></label>' +
          '</div></div>' +
          (d.birthMode === 'date' ? '<div class="field"><label class="field__label" for="mf-birthdate">Ngày sinh</label><input id="mf-birthdate" type="date" class="input" value="' + esc(d.birthDate) + '"></div>' : '') +
          (d.birthMode === 'year' ? '<div class="field"><label class="field__label" for="mf-birthyear">Năm sinh (YYYY)</label><input id="mf-birthyear" type="number" class="input" min="1900" max="2100" value="' + esc(d.birthYear) + '" placeholder="VD: 1948"></div>' : '') +
          (d.birthMode === 'age' ? '<div class="field"><label class="field__label" for="mf-age">Tuổi ước lượng</label><input id="mf-age" type="number" class="input" min="0" max="120" value="' + esc(d.declaredAge) + '" placeholder="VD: 79"></div>' : '') +
          '<div class="field"><label class="field__label" for="mf-extcode">Mã CCCD (không bắt buộc)</label><input id="mf-extcode" class="input" value="' + esc(d.externalPatientCode) + '" placeholder="Nhập số CCCD nếu có"></div>' +
          '<p class="field__help">Mã hồ sơ <span class="mono">BN-xxxxx</span> sẽ được hệ thống cấp tự động và duy nhất.</p>' +
        '</div>' +
        '<div class="modal__foot">' +
          '<button type="button" class="btn btn--secondary" data-action="close-modal">Hủy</button>' +
          '<button type="button" class="btn btn--primary" data-action="submit-patient-form">' + (isEdit ? 'Lưu thay đổi' : 'Tạo hồ sơ bệnh nhân') + '</button>' +
        '</div>';
    }

    if (m.type === 'create-visit') {
      const d = m.data;
      html =
        '<div class="modal__head"><h2 class="modal__title" id="modal-title">Tạo lượt khám mới</h2><button type="button" class="icon-btn" data-action="close-modal" aria-label="Đóng">' + ICONS.x + '</button></div>' +
        '<div class="modal__body">' +
          '<div class="banner banner--blue" style="margin-bottom:0;"><div class="banner__main">' + ICONS.shield + '<div><p class="banner__desc">Lượt khám mới áp dụng phiên bản biểu mẫu <strong>Đang dùng</strong> hiện hành với các ô dữ liệu trống; hệ thống không tự sao chép sinh hiệu, thuốc hay cận lâm sàng từ lượt cũ.</p></div></div></div>' +
          (m.error ? '<div class="banner banner--error"><div class="banner__main">' + ICONS.alert + '<div><p class="banner__desc">' + esc(m.error) + '</p></div></div></div>' : '') +
          '<div class="field"><label class="field__label" for="mv-date">Thời điểm khám *</label><input id="mv-date" type="datetime-local" class="input" value="' + esc(d.visitDateLocal) + '"></div>' +
          '<div class="field"><label class="field__label" for="mv-type">Loại lượt khám *</label><select id="mv-type" class="select">' +
            '<option value=""' + (!d.visitType ? ' selected' : '') + '>-- Chưa chọn --</option>' +
            '<option value="outpatient_new"' + (d.visitType === 'outpatient_new' ? ' selected' : '') + '>Khám mới</option>' +
            '<option value="follow_up"' + (d.visitType === 'follow_up' ? ' selected' : '') + '>Tái khám</option>' +
            '<option value="acute_inpatient"' + (d.visitType === 'acute_inpatient' ? ' selected' : '') + '>Đợt cấp / Nhập viện</option>' +
          '</select></div>' +
          '<div class="field"><label class="field__label" for="mv-reason">Lý do khám ngắn gọn (tùy chọn)</label><textarea id="mv-reason" class="textarea" placeholder="VD: Khó thở khi gắng sức tăng nhẹ 1 tuần nay">' + esc(d.chiefComplaint) + '</textarea></div>' +
        '</div>' +
        '<div class="modal__foot">' +
          '<button type="button" class="btn btn--secondary" data-action="close-modal">Hủy</button>' +
          '<button type="button" class="btn btn--primary" data-action="submit-create-visit">Tạo lượt khám &amp; Mở biểu mẫu</button>' +
        '</div>';
    }

    if (m.type === 'create-revision') {
      html =
        '<div class="modal__head"><h2 class="modal__title" id="modal-title">Tạo bản sửa mới sau xác nhận</h2><button type="button" class="icon-btn" data-action="close-modal" aria-label="Đóng">' + ICONS.x + '</button></div>' +
        '<div class="modal__body">' +
          '<div class="banner banner--info" style="margin-bottom:0;"><div class="banner__main">' + ICONS.shield + '<div><p class="banner__desc">Bản đã xác nhận trước đó được giữ nguyên trong lịch sử. Thao tác này mở bản sửa mới kèm lý do chỉnh sửa.</p></div></div></div>' +
          (m.error ? '<div class="banner banner--error"><div class="banner__main">' + ICONS.alert + '<div><p class="banner__desc">' + esc(m.error) + '</p></div></div></div>' : '') +
          '<div class="field"><label class="field__label" for="mr-reason">Lý do chỉnh sửa / bổ sung kết quả *</label><textarea id="mr-reason" class="textarea" placeholder="VD: Bổ sung kết quả NT-proBNP vừa trả từ khoa xét nghiệm (tối thiểu 5 ký tự)">' + esc(m.reason || '') + '</textarea></div>' +
        '</div>' +
        '<div class="modal__foot">' +
          '<button type="button" class="btn btn--secondary" data-action="close-modal">Hủy</button>' +
          '<button type="button" class="btn btn--primary" data-action="submit-create-revision">Mở bản sửa mới</button>' +
        '</div>';
    }

    if (m.type === 'unsaved-guard') {
      html =
        '<div class="modal__head"><h2 class="modal__title" id="modal-title">Có thay đổi chưa lưu nháp</h2><button type="button" class="icon-btn" data-action="close-modal" aria-label="Đóng">' + ICONS.x + '</button></div>' +
        '<div class="modal__body"><p>Biểu mẫu lượt khám hiện có dữ liệu bạn vừa chỉnh sửa nhưng chưa bấm Lưu nháp. Bạn muốn xử lý thế nào?</p></div>' +
        '<div class="modal__foot">' +
          '<button type="button" class="btn btn--secondary" data-action="close-modal">Ở lại nhập tiếp</button>' +
          '<button type="button" class="btn btn--danger-outline" data-action="discard-and-leave">Rời đi không lưu</button>' +
          '<button type="button" class="btn btn--primary" data-action="save-and-leave">Lưu nháp rồi rời đi</button>' +
        '</div>';
    }

    if (m.type === 'admin-user-form') {
      const isEdit = Boolean(m.userId);
      const d = m.data;
      if (m.step === 1) {
        html =
          '<div class="modal__head"><h2 class="modal__title" id="modal-title">' + (isEdit ? 'Bước 1/2 · Sửa tài khoản ' + esc(d.username) : 'Bước 1/2 · Tạo tài khoản mới') + '</h2><button type="button" class="icon-btn" data-action="close-modal" aria-label="Đóng">' + ICONS.x + '</button></div>' +
          '<div class="modal__body">' +
            (m.error ? '<div class="banner banner--error"><div class="banner__main">' + ICONS.alert + '<div><p class="banner__desc">' + esc(m.error) + '</p></div></div></div>' : '') +
            '<div class="field"><label class="field__label" for="mu-username">Tên đăng nhập (duy nhất) *</label><input id="mu-username" class="input mono" value="' + esc(d.username) + '" placeholder="VD: bs.tuan"' + (isEdit ? ' disabled' : '') + '></div>' +
            '<div class="field"><label class="field__label" for="mu-fullname">Họ tên hiển thị *</label><input id="mu-fullname" class="input" value="' + esc(d.fullName) + '" placeholder="VD: BS. Đỗ Văn Tuấn"></div>' +
            '<div class="field"><label class="field__label" for="mu-role">Vai trò hệ thống *</label><select id="mu-role" class="select">' +
              '<option value="doctor"' + (d.role === 'doctor' ? ' selected' : '') + '>Bác sĩ (lâm sàng)</option>' +
              '<option value="admin"' + (d.role === 'admin' ? ' selected' : '') + '>Quản trị viên (tách biệt khỏi bệnh án)</option>' +
            '</select></div>' +
            '<div class="field"><label class="field__label" for="mu-reason">Lý do tạo / cập nhật (ghi vào Nhật ký hệ thống) *</label><input id="mu-reason" class="input" value="' + esc(d.reason) + '" placeholder="VD: Cấp tài khoản bác sĩ khoa Tim mạch mới tiếp nhận"></div>' +
          '</div>' +
          '<div class="modal__foot">' +
            '<button type="button" class="btn btn--secondary" data-action="close-modal">Hủy</button>' +
            '<button type="button" class="btn btn--primary" data-action="admin-user-preview-step">Tiếp tục: Xem lại quyền ' + ICONS.arrowRight + '</button>' +
          '</div>';
      } else {
        const pv = m.preview;
        html =
          '<div class="modal__head"><h2 class="modal__title" id="modal-title">Bước 2/2 · Xem lại phạm vi quyền trước khi lưu</h2><button type="button" class="icon-btn" data-action="close-modal" aria-label="Đóng">' + ICONS.x + '</button></div>' +
          '<div class="modal__body">' +
            (m.error ? '<div class="banner banner--error"><div class="banner__main">' + ICONS.alert + '<div><p class="banner__desc">' + esc(m.error) + '</p></div></div></div>' : '') +
            '<div class="banner banner--blue" style="margin-bottom:0;"><div class="banner__main">' + ICONS.shield + '<div><p class="banner__title">Tài khoản: <span class="mono">' + esc(d.username) + '</span> · ' + esc(d.fullName) + ' (' + (d.role === 'admin' ? 'Quản trị viên' : 'Bác sĩ') + ')</p><p class="banner__desc">' + esc(pv.separationNoticeVi) + '</p></div></div></div>' +
            '<div class="perm-compare">' +
              '<div class="perm-box perm-box--grant"><strong>Quyền được cấp</strong><ul>' + (pv.grantedPermissions || []).map(function (p) { return '<li>' + esc(p.labelVi) + '</li>'; }).join('') + '</ul></div>' +
              '<div class="perm-box perm-box--deny"><strong>Quyền không được cấp</strong><ul>' + (pv.deniedPermissions || []).map(function (p) { return '<li>' + esc(p.labelVi) + '</li>'; }).join('') + '</ul></div>' +
            '</div>' +
          '</div>' +
          '<div class="modal__foot">' +
            '<button type="button" class="btn btn--secondary" data-action="admin-user-back-step">' + ICONS.arrowLeft + ' Quay lại</button>' +
            '<button type="button" class="btn btn--primary" data-action="admin-user-confirm-save">' + ICONS.checkCircle + ' Xác nhận &amp; Lưu tài khoản</button>' +
          '</div>';
      }
    }

    if (m.type === 'admin-user-action') {
      html =
        '<div class="modal__head"><h2 class="modal__title" id="modal-title">' + esc(m.title) + '</h2><button type="button" class="icon-btn" data-action="close-modal" aria-label="Đóng">' + ICONS.x + '</button></div>' +
        '<div class="modal__body">' +
          '<p>' + esc(m.desc) + '</p>' +
          (m.error ? '<div class="banner banner--error"><div class="banner__main">' + ICONS.alert + '<div><p class="banner__desc">' + esc(m.error) + '</p></div></div></div>' : '') +
          '<div class="field"><label class="field__label" for="mua-reason">Lý do thao tác (ghi nhật ký kiểm toán) *</label><input id="mua-reason" class="input" value="' + esc(m.reason || '') + '" placeholder="Nhập lý do tối thiểu 3 ký tự..."></div>' +
        '</div>' +
        '<div class="modal__foot">' +
          '<button type="button" class="btn btn--secondary" data-action="close-modal">Hủy</button>' +
          '<button type="button" class="btn btn--primary" data-action="submit-admin-user-action">Xác nhận thực hiện</button>' +
        '</div>';
    }

    if (m.type === 'setup-code') {
      html =
        '<div class="modal__head"><h2 class="modal__title" id="modal-title">Mã thiết lập mật khẩu một lần</h2><button type="button" class="icon-btn" data-action="close-modal" aria-label="Đóng">' + ICONS.x + '</button></div>' +
        '<div class="modal__body">' +
          '<div class="banner banner--success" style="margin-bottom:0;"><div class="banner__main">' + ICONS.key + '<div><p class="banner__title">' + esc(m.title) + '</p><p class="banner__desc">Mã kích hoạt dưới đây chỉ hiển thị duy nhất một lần và hết hạn sau 24 giờ.</p></div></div></div>' +
          '<div class="bmi-card"><div class="bmi-card__label">Tài khoản: <span class="mono">' + esc(m.username) + '</span></div><div class="bmi-card__value mono" style="font-size:20px;">' + esc(m.code) + '</div></div>' +
        '</div>' +
        '<div class="modal__foot"><button type="button" class="btn btn--primary" data-action="close-modal">Đã ghi nhận</button></div>';
    }

    if (m.type === 'audit-detail' && m.log) {
      const lg = m.log;
      const outBadge = lg.outcome === 'success'
        ? '<span class="badge badge--success">Thành công</span>'
        : (lg.outcome === 'denied' ? '<span class="badge badge--error">Từ chối</span>' : '<span class="badge badge--warn">Thất bại</span>');
      const rVi = lg.actorRole === 'admin' ? 'Quản trị viên' : (lg.actorRole === 'doctor' ? 'Bác sĩ' : (lg.actorRole || '—'));
      html =
        '<div class="modal__head"><h2 class="modal__title" id="modal-title">Chi tiết bản ghi nhật ký</h2><button type="button" class="icon-btn" data-action="close-modal" aria-label="Đóng">' + ICONS.x + '</button></div>' +
        '<div class="modal__body">' +
          '<div class="kv-grid">' +
            '<div><div class="kv-item__label">Thời điểm</div><div class="kv-item__value tabular">' + esc(formatDateTime(lg.occurredAt)) + '</div></div>' +
            '<div><div class="kv-item__label">Kết quả</div><div class="kv-item__value">' + outBadge + '</div></div>' +
            '<div><div class="kv-item__label">Người thực hiện</div><div class="kv-item__value mono">' + esc(lg.actorUsername || 'Ẩn danh') + '</div></div>' +
            '<div><div class="kv-item__label">Vai trò</div><div class="kv-item__value">' + esc(rVi) + '</div></div>' +
            '<div><div class="kv-item__label">Hành động</div><div class="kv-item__value">' + esc(formatAuditAction(lg.action)) + '</div></div>' +
            '<div><div class="kv-item__label">Đối tượng</div><div class="kv-item__value">' + esc(formatAuditEntity(lg.entityType)) + '</div></div>' +
          '</div>' +
          '<details class="details-tech">' +
            '<summary>Thông tin kỹ thuật (mã phiên, đối tượng &amp; JSON)</summary>' +
            '<div class="details-tech__body">' +
              '<div class="kv-grid">' +
                '<div><div class="kv-item__label">Mã yêu cầu</div><div class="kv-item__value mono">' + esc(lg.requestId || lg.id || '—') + '</div></div>' +
                '<div><div class="kv-item__label">Mã đối tượng</div><div class="kv-item__value mono">' + esc(lg.entityId || '—') + '</div></div>' +
                '<div><div class="kv-item__label">Địa chỉ phiên</div><div class="kv-item__value mono">' + esc(lg.ip || '—') + '</div></div>' +
              '</div>' +
              '<pre class="json-viewer" style="max-height:200px;">' + esc(JSON.stringify(lg.detail || {}, null, 2)) + '</pre>' +
            '</div>' +
          '</details>' +
          '<p class="field__help">Nội dung bệnh án chi tiết và mật khẩu không được lưu trong nhật ký hệ thống.</p>' +
        '</div>' +
        '<div class="modal__foot"><button type="button" class="btn btn--primary" data-action="close-modal">Đóng</button></div>';
    }

    if (m.type === 'discard-form-draft') {
      html =
        '<div class="modal__head"><h2 class="modal__title" id="modal-title">Hủy các chỉnh sửa chưa lưu?</h2><button type="button" class="icon-btn" data-action="close-modal" aria-label="Đóng">' + ICONS.x + '</button></div>' +
        '<div class="modal__body"><p>Mọi thay đổi bạn vừa thực hiện trên bản nháp <strong>' + esc(m.versionLabel || '') + '</strong> nhưng chưa bấm Lưu sẽ được khôi phục về lần lưu gần nhất.</p></div>' +
        '<div class="modal__foot">' +
          '<button type="button" class="btn btn--secondary" data-action="close-modal">Quay lại chỉnh tiếp</button>' +
          '<button type="button" class="btn btn--danger" data-action="do-discard-form-draft">Hủy chỉnh sửa</button>' +
        '</div>';
    }

    if (m.type === 'delete-form-draft') {
      html =
        '<div class="modal__head"><h2 class="modal__title" id="modal-title">Xóa bản nháp ' + esc(m.versionLabel || '') + '?</h2><button type="button" class="icon-btn" data-action="close-modal" aria-label="Đóng">' + ICONS.x + '</button></div>' +
        '<div class="modal__body">' +
          '<div class="banner banner--error" style="margin-bottom:0;"><div class="banner__main">' + ICONS.alert + '<div><p class="banner__desc">Bản nháp chưa phát hành này sẽ bị xóa vĩnh viễn. Các phiên bản đã phát hành và dữ liệu lượt khám hiện có không bị ảnh hưởng.</p></div></div></div>' +
          (m.error ? '<div class="banner banner--error"><div class="banner__main">' + ICONS.alert + '<div><p class="banner__desc">' + esc(m.error) + '</p></div></div></div>' : '') +
        '</div>' +
        '<div class="modal__foot">' +
          '<button type="button" class="btn btn--secondary" data-action="close-modal">Hủy</button>' +
          '<button type="button" class="btn btn--danger" data-action="do-delete-form-draft">' + ICONS.trash + ' Xác nhận xóa bản nháp</button>' +
        '</div>';
    }

    if (m.type === 'admin-add-care-assignment') {
      const assignedIds = {};
      (m.activeDoctorIds || []).forEach(function (id) { assignedIds[id] = true; });
      const availDocs = (m.doctors || []).filter(function (d) { return !assignedIds[d.id]; });
      const opts = '<option value="">-- Chọn bác sĩ đang hoạt động --</option>' + availDocs.map(function (d) {
        return '<option value="' + esc(d.id) + '"' + (m.doctorUserId === d.id ? ' selected' : '') + '>' + esc(d.fullName + ' (' + d.username + ')') + '</option>';
      }).join('');
      html =
        '<div class="modal__head"><h2 class="modal__title" id="modal-title">Thêm bác sĩ phụ trách · ' + esc(m.patientCode || '') + '</h2><button type="button" class="icon-btn" data-action="close-modal" aria-label="Đóng">' + ICONS.x + '</button></div>' +
        '<div class="modal__body">' +
          '<div class="banner banner--info" style="margin-bottom:0;"><div class="banner__main">' + ICONS.shield + '<div><p class="banner__desc">Bệnh nhân <strong>' + esc(m.patientName || '') + '</strong> (<span class="mono">' + esc(m.patientCode || '') + '</span>) có thể được phân công cho nhiều bác sĩ cùng phụ trách. Lịch sử phân công sẽ được lưu vết.</p></div></div></div>' +
          (m.error ? '<div class="banner banner--error" role="alert"><div class="banner__main">' + ICONS.alert + '<div><p class="banner__desc">' + esc(m.error) + '</p></div></div></div>' : '') +
          (availDocs.length === 0
            ? '<p class="field__help">Tất cả bác sĩ đang hoạt động đã được phân công cho hồ sơ này.</p>'
            : (
                '<div class="field"><label class="field__label" for="aca-doctor">Bác sĩ phụ trách *</label><select id="aca-doctor" class="select">' + opts + '</select></div>' +
                '<div class="field"><label class="field__label" for="aca-reason">Ghi chú / Lý do phân công (tùy chọn)</label><input id="aca-reason" class="input" value="' + esc(m.reason || '') + '" placeholder="VD: Phân công theo dõi tái khám tim mạch"></div>'
              )) +
        '</div>' +
        '<div class="modal__foot">' +
          '<button type="button" class="btn btn--secondary" data-action="close-modal">Hủy</button>' +
          (availDocs.length > 0 ? '<button type="button" class="btn btn--primary" data-action="submit-admin-add-assignment">' + ICONS.checkCircle + ' Xác nhận phân công</button>' : '') +
        '</div>';
    }

    if (m.type === 'admin-replace-care-assignments') {
      const checkedMap = {};
      (m.selectedDoctorIds || []).forEach(function (id) { checkedMap[id] = true; });
      const checks = (m.doctors || []).map(function (d) {
        return (
          '<label class="choice-row">' +
            '<input type="checkbox" name="acr-doctor" value="' + esc(d.id) + '"' + (checkedMap[d.id] ? ' checked' : '') + '>' +
            '<span><strong>' + esc(d.fullName) + '</strong> <span class="cell-sub mono">(' + esc(d.username) + ')</span></span>' +
          '</label>'
        );
      }).join('');
      html =
        '<div class="modal__head"><h2 class="modal__title" id="modal-title">Cập nhật danh sách bác sĩ · ' + esc(m.patientCode || '') + '</h2><button type="button" class="icon-btn" data-action="close-modal" aria-label="Đóng">' + ICONS.x + '</button></div>' +
        '<div class="modal__body">' +
          '<div class="banner banner--info" style="margin-bottom:0;"><div class="banner__main">' + ICONS.shield + '<div><p class="banner__desc">Chọn các bác sĩ được phân công cho <strong>' + esc(m.patientName || '') + '</strong>. Bỏ chọn sẽ thu hồi quyền và ghi vào lịch sử phân công.</p></div></div></div>' +
          (m.error ? '<div class="banner banner--error" role="alert"><div class="banner__main">' + ICONS.alert + '<div><p class="banner__desc">' + esc(m.error) + '</p></div></div></div>' : '') +
          '<div class="radio-group">' + (checks || '<p class="field__help">Chưa có bác sĩ đang hoạt động nào.</p>') + '</div>' +
          '<div class="field"><label class="field__label" for="acr-reason">Ghi chú thay đổi (tùy chọn)</label><input id="acr-reason" class="input" value="' + esc(m.reason || '') + '" placeholder="VD: Cập nhật nhóm bác sĩ phụ trách tim mạch"></div>' +
        '</div>' +
        '<div class="modal__foot">' +
          '<button type="button" class="btn btn--secondary" data-action="close-modal">Hủy</button>' +
          '<button type="button" class="btn btn--primary" data-action="submit-admin-replace-assignments">' + ICONS.checkCircle + ' Lưu phân công</button>' +
        '</div>';
    }

    if (m.type === 'wf-edit-confirm') {
      const mTitle = wfFormatModuleTitle(m.module);
      const affectedStr = (m.downstreamNames || []).join(', ');
      html =
        '<div class="modal__head"><h2 class="modal__title" id="modal-title">Chỉnh sửa dữ liệu ' + esc(mTitle) + '?</h2><button type="button" class="icon-btn" data-action="close-modal" aria-label="Đóng">' + ICONS.x + '</button></div>' +
        '<div class="modal__body">' +
          '<div class="banner banner--warn" style="margin-bottom:0;"><div class="banner__main">' + ICONS.alert + '<div><p class="banner__desc">Hệ thống sẽ mở lại <strong>Biểu mẫu khám bệnh</strong> và lọc sẵn các trường của <strong>' + esc(mTitle) + '</strong>. Khi bạn lưu thay đổi, các bước phía sau đã chạy (<strong>' + esc(affectedStr) + '</strong>) sẽ được gắn nhãn <strong>"Cần chạy lại"</strong> và không tự chạy lại.</p></div></div></div>' +
        '</div>' +
        '<div class="modal__foot">' +
          '<button type="button" class="btn btn--secondary" data-action="close-modal">Hủy</button>' +
          '<button type="button" class="btn btn--primary" data-wf-confirm-edit="' + esc(m.module) + '">Mở biểu mẫu để sửa</button>' +
        '</div>';
    }

    dialog.innerHTML = html;
    if (m.type === 'change-password') {
      document.getElementById('app-root').inert = true;
      document.getElementById('cp-current').focus();
    }
  }

  function passwordFormError(message, fieldId) {
    const error = document.getElementById('cp-error');
    if (error) { error.textContent = message; error.hidden = !message; }
    document.querySelectorAll('#change-password-form input').forEach(function (input) {
      input.setAttribute('aria-invalid', String(input.id === fieldId));
    });
    const input = document.getElementById(fieldId);
    if (input) input.focus();
  }

  async function submitPasswordChange() {
    const m = state.modal;
    if (!m || m.type !== 'change-password' || m.pending) return;
    const current = document.getElementById('cp-current').value;
    const next = document.getElementById('cp-new').value;
    const confirm = document.getElementById('cp-confirm').value;
    if (Array.from(current).length < 1 || Array.from(current).length > 128) {
      passwordFormError('Nhập mật khẩu hiện tại, tối đa 128 ký tự.', 'cp-current'); return;
    }
    if (Array.from(next).length < 8 || Array.from(next).length > 128 || next === current) {
      passwordFormError('Mật khẩu mới phải có từ 8 đến 128 ký tự và khác mật khẩu hiện tại.', 'cp-new'); return;
    }
    if (next !== confirm) {
      passwordFormError('Xác nhận mật khẩu mới chưa khớp.', 'cp-confirm'); return;
    }
    const actor = state.user;
    const form = document.getElementById('change-password-form');
    const submit = document.getElementById('cp-submit');
    passwordFormError('', '');
    m.pending = true;
    form.setAttribute('aria-busy', 'true');
    form.querySelectorAll('input, button').forEach(function (control) { control.disabled = true; });
    submit.textContent = 'Đang đổi mật khẩu…';
    try {
      const updated = await api.changePassword({ currentPassword: current, newPassword: next });
      if (state.user !== actor) return;
      state.user = updated;
      m.pending = false;
      if (state.modal === m) closeModal();
      toast('Đã đổi mật khẩu', 'success');
    } catch (err) {
      if (state.user !== actor) return;
      m.pending = false;
      if (state.modal !== m) {
        toast('Chưa đổi được mật khẩu. Vui lòng thử lại.', 'error');
        return;
      }
      form.removeAttribute('aria-busy');
      form.querySelectorAll('input, button').forEach(function (control) { control.disabled = false; });
      submit.textContent = 'Đổi mật khẩu';
      const code = err && (err.code || (err.problem && err.problem.code));
      if (code === 'CURRENT_PASSWORD_INCORRECT') passwordFormError('Mật khẩu hiện tại chưa đúng. Vui lòng nhập lại.', 'cp-current');
      else if (err && err.status === 422) passwordFormError('Mật khẩu mới chưa hợp lệ. Hãy dùng từ 8 đến 128 ký tự và khác mật khẩu hiện tại.', 'cp-new');
      else passwordFormError('Chưa đổi được mật khẩu. Vui lòng thử lại.', '');
    }
  }

  /* ------------------------------------------------------------------------
     Continuous Scroll TOC & Scrollspy (UI-06)
     ------------------------------------------------------------------------ */
  let activeScrollSpyCleanup = null;
  let scrollSpyLockUntil = 0;

  function setRailActiveButton(mode, sectionCode) {
    const attr = mode === 'preview' ? 'data-prev-section' : 'data-enc-section';
    const buttons = document.querySelectorAll('[' + attr + ']');
    buttons.forEach(function (btn) {
      btn.classList.toggle('is-active', btn.getAttribute(attr) === sectionCode);
    });
    if (mode === 'preview') state.adminForms.previewSectionCode = sectionCode;
    else state.encounter.activeSectionCode = sectionCode;
  }

  function scrollToSectionBlock(mode, sectionCode, smooth) {
    const prefix = mode === 'preview' ? 'prev-' : 'enc-';
    const targetEl = document.getElementById(prefix + 'sec-' + sectionCode);
    scrollSpyLockUntil = Date.now() + (smooth === false ? 100 : 700);
    setRailActiveButton(mode, sectionCode);
    if (targetEl) {
      targetEl.scrollIntoView({ behavior: smooth === false ? 'auto' : 'smooth', block: 'start' });
    }
  }

  function setupSectionScrollSpy() {
    if (activeScrollSpyCleanup) {
      activeScrollSpyCleanup();
      activeScrollSpyCleanup = null;
    }
    const isEnc = state.screen === 'encounter';
    const isPrev = state.screen === 'admin-forms' && state.adminForms.activeTab === 'preview';
    if (!isEnc && !isPrev) return;

    const mode = isPrev ? 'preview' : 'encounter';
    const blocks = Array.prototype.slice.call(document.querySelectorAll('[data-section-block]'));
    if (blocks.length === 0) return;

    let rafPending = false;
    function updateActiveFromScroll() {
      rafPending = false;
      if (Date.now() < scrollSpyLockUntil) return;
      const offset = 150;
      let currentCode = blocks[0].getAttribute('data-section-block');
      for (let i = 0; i < blocks.length; i++) {
        const rect = blocks[i].getBoundingClientRect();
        if (rect.top <= offset) {
          currentCode = blocks[i].getAttribute('data-section-block');
        } else {
          break;
        }
      }
      if (currentCode) setRailActiveButton(mode, currentCode);
    }

    function onScroll() {
      if (rafPending) return;
      rafPending = true;
      global.requestAnimationFrame(updateActiveFromScroll);
    }

    global.addEventListener('scroll', onScroll, { passive: true });
    activeScrollSpyCleanup = function () {
      global.removeEventListener('scroll', onScroll);
    };
  }

  /* ------------------------------------------------------------------------
     Main Render Dispatcher
     ------------------------------------------------------------------------ */
  function render() {
    const root = document.getElementById('app-root');
    if (!root) return;
    closeAccountMenu(false);
    let html = '';
    if (state.screen === 'login') html = renderLogin();
    else if (state.screen === 'forbidden') html = renderForbidden();
    else if (state.screen === 'patients') html = renderPatients();
    else if (state.screen === 'profile') html = renderProfile();
    else if (state.screen === 'encounter') html = renderEncounter();
    else if (state.screen === 'review') html = renderReview();
    else if (state.screen === 'workflow') html = renderWorkflow();
    else if (state.screen === 'admin-accounts') html = renderAdminUsers();
    else if (state.screen === 'admin-care') html = renderAdminCare();
    else if (state.screen === 'admin-forms') html = renderAdminForms();
    else if (state.screen === 'admin-audit') html = renderAdminAudit();
    else html = renderLogin();
    root.innerHTML = html;
    renderModal();
    setupSectionScrollSpy();
  }

  /* ------------------------------------------------------------------------
     Encounter & Preview Mutation Helpers
     ------------------------------------------------------------------------ */
  function refreshEncounterSaveStatus() {
    const enc = state.encounter;
    if (state.screen !== 'encounter') return;
    const badge = document.querySelector('.encounter-footer__status .badge');
    if (badge) {
      badge.className = 'badge ' + (enc.dirty ? 'badge--warn' : 'badge--success');
      badge.textContent = enc.dirty ? 'Có thay đổi chưa lưu' : 'Đã lưu nháp · ' + formatDateTime(enc.lastSavedAt);
    }
    document.querySelectorAll('[data-action="save-draft"]').forEach(function (button) {
      if (button.disabled !== enc.saving) {
        button.disabled = enc.saving;
        button.classList.toggle('is-loading', enc.saving);
        button.innerHTML = enc.saving ? 'Đang lưu...' : ICONS.save + ' Lưu nháp';
      }
    });
  }

  function markEncounterDirty() {
    state.encounter.editVersion += 1;
    state.encounter.dirty = true;
    refreshEncounterSaveStatus();
  }

  function getFormTarget(isPreview) {
    if (isPreview) {
      return {
        isPreview: true,
        valuesByDefId: state.adminForms.previewValues,
        defById: (function () {
          const m = {};
          ((state.adminForms.previewData && state.adminForms.previewData.fieldDefinitions) || []).forEach(function (fd) { m[fd.id] = fd; });
          return m;
        })(),
        visitId: 'preview',
        orthostaticBp: state.adminForms.previewBp,
        medications: state.adminForms.previewMeds,
        allergies: state.adminForms.previewAllergies,
        labResults: state.adminForms.previewLabs,
        diagnoses: state.adminForms.previewDiagnoses,
        setListState: function (kind, val) {
          if (kind === 'medications') state.adminForms.previewMedicationListState = val;
          else if (kind === 'allergies') state.adminForms.previewAllergyListState = val;
          else if (kind === 'diagnoses') state.adminForms.previewDiagnosisListState = val;
        },
        numberInputAttribute: 'data-prev-num',
        getAutoPulseSourceIndex: function () { return state.adminForms.previewAutoPulseSourceIndex; },
        setAutoPulseSourceIndex: function (index) { state.adminForms.previewAutoPulseSourceIndex = index; },
        markDirty: function () {}
      };
    }
    return {
      isPreview: false,
      valuesByDefId: state.encounter.valuesByDefId,
      defById: state.encounter.defById,
      visitId: state.encounter.visitId,
      orthostaticBp: state.encounter.orthostaticBp,
      medications: state.encounter.medications,
      allergies: state.encounter.allergies,
      labResults: state.encounter.labResults,
      diagnoses: state.encounter.diagnoses,
      setListState: function (kind, val) {
        if (kind === 'medications') state.encounter.medicationListState = val;
        else if (kind === 'allergies') state.encounter.allergyListState = val;
        else if (kind === 'diagnoses') state.encounter.diagnosisListState = val;
      },
      numberInputAttribute: 'data-enc-num',
      getAutoPulseSourceIndex: function () { return state.encounter.autoPulseSourceIndex; },
      setAutoPulseSourceIndex: function (index) { state.encounter.autoPulseSourceIndex = index; },
      markDirty: markEncounterDirty
    };
  }

  function makeEmptyVisitValue(visitId, fd, valueState) {
    return {
      visitId: visitId,
      fieldDefinitionId: fd.id,
      fieldCode: fd.code,
      valueState: valueState,
      valueNum: null,
      valueText: null,
      valueBool: null,
      valueDate: null,
      fieldOptionId: null,
      selectedOptions: [],
      unit: null
    };
  }

  function buildDraftSavePayload() {
    const enc = state.encounter;
    const values = [];
    const hasAnswerList = { diagnoses: false, medications: false, allergies: false };
    const answerTimedLabs = {};

    Object.keys(enc.valuesByDefId).forEach(function (k) {
      const v = enc.valuesByDefId[k];
      if (!v) return;
      const fd = enc.defById[v.fieldDefinitionId] || enc.defByCode[v.fieldCode];
      if (!fd) return;
      if (fd.storageLevel === 'computed' || fd.storageLevel === 'patient' || fd.storageLevel === 'visit') return;

      if (enc.isV12 && isV12StructuredAnswerCode(fd.code)) {
        const rawAns = (v.answer && typeof v.answer === 'object') ? v.answer : visitValueToCompact(fd.code, v, fd);
        const cleaned = cleanAnswerForDraft(fd.code, rawAns);
        if (!cleaned) return;
        values.push({
          fieldDefinitionId: fd.id,
          fieldCode: fd.code,
          answer: cleaned
        });
        if (isStructuredListCode(fd.code)) hasAnswerList[fd.code] = true;
        if (isTimedLabCode(fd.code)) answerTimedLabs[fd.code] = true;
        return;
      }

      if (fd.storageLevel === 'visit_value') {
        const scalar = clone(v);
        delete scalar.answer;
        delete scalar.updatedAt;
        if (scalar.valueState === 'unknown') {
          scalar.valueNum = null;
          scalar.valueText = null;
          scalar.valueBool = null;
          scalar.valueDate = null;
          scalar.fieldOptionId = null;
          scalar.selectedOptions = [];
          scalar.unit = null;
        }
        values.push(scalar);
      }
    });

    const payload = {
      rowVersion: enc.visit.rowVersion,
      clinicalNote: enc.clinicalNote || null,
      infoSource: enc.infoSource || null,
      values: values,
      orthostaticBp: enc.orthostaticBp,
      labResults: enc.isV12
        ? (enc.labResults || []).filter(function (lr) { return !lr || !answerTimedLabs[lr.labCode]; })
        : enc.labResults
    };
    if (!hasAnswerList.medications) {
      payload.medications = enc.medications;
      if (enc.supportsListStates) {
        payload.medicationListState = enc.medicationListState || (enc.medications.length > 0 ? 'known' : 'unknown');
      }
    }
    if (!hasAnswerList.allergies) {
      payload.allergies = enc.allergies;
      if (enc.supportsListStates) {
        payload.allergyListState = enc.allergyListState || (enc.allergies.length > 0 ? 'known' : 'unknown');
      }
    }
    if (!hasAnswerList.diagnoses && enc.supportsListStates) {
      payload.diagnosisListState = enc.diagnosisListState || (enc.diagnoses.length > 0 ? 'known' : 'unknown');
      payload.diagnoses = (enc.diagnoses || []).map(function (d) {
        return {
          code: String(d.code || '').trim().toUpperCase(),
          display: String(d.display || '').trim(),
          role: d.role === 'primary' ? 'primary' : 'secondary'
        };
      });
    }
    return payload;
  }

  function saveEncounterDraft() {
    const enc = state.encounter;
    if (state.screen !== 'encounter' || enc.loading || !enc.visit || enc.visit.id !== enc.visitId || enc.visit.status === 'confirmed') return Promise.resolve(false);
    if (enc.savePromise) {
      if (enc.editVersion !== enc.savingVersion) enc.saveQueued = true;
      return enc.savePromise;
    }
    const visitId = enc.visit.id;
    const generation = enc.loadGeneration;
    function isCurrent() {
      return enc.visitId === visitId && enc.loadGeneration === generation && state.screen === 'encounter';
    }
    enc.savePromise = (async function () {
      let ok;
      do {
        enc.saveQueued = false;
        ok = await saveEncounterSnapshot(enc, isCurrent);
      } while (ok && isCurrent() && enc.saveQueued && enc.dirty);
      return ok && isCurrent();
    })().finally(function () {
      if (isCurrent()) enc.savePromise = null;
    });
    return enc.savePromise;
  }

  async function saveEncounterSnapshot(enc, isCurrent) {
    const version = enc.editVersion;
    const payload = clone(buildDraftSavePayload());

    // Client-side validation for structured v1.2 values & timed labs before PUT /draft
    const localErrors = [];
    (payload.values || []).forEach(function (item) {
      if (!item || !item.answer || !item.fieldCode) return;
      const msg = validateV12CompactField(item.fieldCode, item.answer);
      if (msg) localErrors.push({ fieldCode: item.fieldCode, message: msg });
    });
    if (localErrors.length > 0) {
      enc.errorList = localErrors;
      enc.fieldErrors = {};
      localErrors.forEach(function (e) { enc.fieldErrors[e.fieldCode] = e.message; });
      render();
      toast('Còn ' + localErrors.length + ' lỗi cần sửa trước khi lưu nháp.', 'error');
      return false;
    }

    enc.savingVersion = version;
    enc.saving = true;
    enc.conflictError = null;
    enc.fieldErrors = {};
    enc.errorList = [];
    refreshEncounterSaveStatus();
    try {
      const res = await api.saveVisitDraft(enc.visit.id, payload, payload.rowVersion);
      if (!isCurrent()) return false;
      if (!res || !res.visit || res.visit.id !== enc.visitId) throw new Error('Phản hồi lưu nháp không khớp lượt khám.');
      enc.visit = res.visit;
      if (res.workflow !== undefined) enc.workflowSummary = res.workflow;
      if (res.fieldMetadata !== undefined) enc.fieldMetadata = res.fieldMetadata;
      if (enc.editVersion === version) {
        enc.orthostaticBp = clone(res.orthostaticBp || []);
        enc.medications = clone(res.medications || []);
        enc.allergies = clone(res.allergies || []);
        enc.labResults = clone(res.labResults || []);
        if (res.diagnoses !== undefined) enc.diagnoses = clone(res.diagnoses || []);
        if (res.visit && res.visit.medicationListState !== undefined) enc.medicationListState = res.visit.medicationListState;
        if (res.visit && res.visit.allergyListState !== undefined) enc.allergyListState = res.visit.allergyListState;
        if (res.visit && res.visit.diagnosisListState !== undefined) enc.diagnosisListState = res.visit.diagnosisListState;
        hydrateEncounterValuesFromDetail(enc, res);
        enc.dirty = false;
      }
      enc.revisions = clone(res.revisions || []);
      enc.lastSavedAt = res.visit.updatedAt;
      enc.saving = false;
      if (enc.editVersion === version) render();
      toast('Đã lưu nháp lượt khám thành công.', 'success');
      return true;
    } catch (err) {
      if (!isCurrent()) return false;
      enc.saving = false;
      if (err && err.status === 422) {
        enc.errorList = (err.errors || []).map(function (e) {
          return Object.assign({}, e, { fieldCode: resolveFormFieldCode(enc.fieldMetadata, e.fieldCode) });
        });
        enc.fieldErrors = {};
        enc.errorList.forEach(function (e) { enc.fieldErrors[e.fieldCode] = e.message; });
        toast(enc.errorList.length > 0 ? ('Còn ' + enc.errorList.length + ' lỗi kỹ thuật cần sửa trước khi lưu.') : ((err && err.detail) || 'Dữ liệu chưa hợp lệ.'), 'error');
      } else if (err && err.status === 409) {
        enc.conflictError = err.detail || 'Phát hiện xung đột phiên bản dữ liệu (409).';
        toast('Xung đột phiên bản dữ liệu (409) — không ghi đè âm thầm.', 'warn');
      } else if (err && err.status === 404) {
        toast(NOT_FOUND_OR_NO_ACCESS_MSG, 'error');
      } else {
        handleAuthOrError(err, 'Không thể lưu nháp lượt khám.');
      }
      if (isCurrent()) render();
      return false;
    } finally {
      if (isCurrent()) {
        enc.saving = false;
        refreshEncounterSaveStatus();
      }
    }
  }

  function triggerJsonDownload(filename, dataObj) {
    const text = JSON.stringify(dataObj, null, 2);
    const blob = new Blob([text], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(function () {
      if (a.parentNode) a.parentNode.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  }

  function resolveFieldSectionCode(formRes, fieldCode) {
    if (!fieldCode) return 'hanh_chinh';
    const canonicalCode = AI_FIELD_CODE_ALIASES[fieldCode] || fieldCode;
    const sections = (formRes && formRes.sections) || [];
    const defs = (formRes && formRes.fieldDefinitions) || [];
    const defById = {};
    const defByCode = {};
    defs.forEach(function (fd) { defById[fd.id] = fd; defByCode[fd.code] = fd; });
    for (let i = 0; i < sections.length; i++) {
      const sec = sections[i];
      const hit = (sec.fields || []).some(function (ff) {
        const fd = defById[ff.fieldDefinitionId];
        return ff.fieldCode === fieldCode || ff.fieldCode === canonicalCode || (fd && (fd.code === fieldCode || fd.code === canonicalCode));
      });
      if (hit) return sec.sectionCode;
    }
    if (defByCode[fieldCode] && defByCode[fieldCode].sectionCode) return defByCode[fieldCode].sectionCode;
    if (defByCode[canonicalCode] && defByCode[canonicalCode].sectionCode) return defByCode[canonicalCode].sectionCode;
    if (/^icd_|^diagnos/i.test(canonicalCode)) return 'benh_su_dong_mac';
    if (/^thuoc_|medication|co_da_thuoc|so_luong_thuoc/i.test(canonicalCode)) return 'thuoc_di_ung';
    if (/^di_ung_|^diung_|allergy/i.test(canonicalCode)) return 'thuoc_di_ung';
    if (/^cls_|lab|bnp|ntprobnp/i.test(canonicalCode)) return 'can_lam_sang';
    if (/huyet_ap|^ha_|bp/i.test(canonicalCode)) return 'sinh_ton_kham';
    if (/info_source|clinical_note/i.test(canonicalCode)) return 'ghi_chu';
    return 'hanh_chinh';
  }

  function findTargetElementForField(fieldCode) {
    if (!fieldCode) return null;
    const resolved = resolveFormFieldCode(state.encounter.fieldMetadata, fieldCode);
    const canonicalCode = AI_FIELD_CODE_ALIASES[resolved] || resolved;
    const candidates = [resolved, fieldCode, canonicalCode].filter(function (c, i, arr) { return c && arr.indexOf(c) === i; });
    for (let i = 0; i < candidates.length; i++) {
      const el = document.querySelector('[data-field-code="' + CSS.escape(candidates[i]) + '"]');
      if (el) return el;
    }
    const repeatBlocks = document.querySelectorAll('[data-repeat-codes]');
    for (let i = 0; i < repeatBlocks.length; i++) {
      const codes = String(repeatBlocks[i].getAttribute('data-repeat-codes') || '').split(',');
      if (candidates.some(function (c) { return codes.indexOf(c) >= 0; })) return repeatBlocks[i];
    }
    let repeatGroup = null;
    if (/^thuoc_|medication|co_da_thuoc|so_luong_thuoc/i.test(canonicalCode)) repeatGroup = 'medications';
    else if (/^di_ung_|^diung_|allergy/i.test(canonicalCode)) repeatGroup = 'allergies';
    else if (/^cls_|lab|bnp|ntprobnp/i.test(canonicalCode)) repeatGroup = 'labResults';
    else if (/^icd_|^diagnos/i.test(canonicalCode)) repeatGroup = 'diagnoses';
    else if (/huyet_ap|^ha_/i.test(canonicalCode)) repeatGroup = 'orthostaticBp';
    if (repeatGroup) {
      const el = document.querySelector('[data-repeat-group="' + repeatGroup + '"]');
      if (el) return el;
    }
    const secCode = resolveFieldSectionCode(state.encounter.formStructure, canonicalCode);
    if (secCode) {
      const el = document.getElementById('enc-sec-' + secCode);
      if (el) return el;
    }
    return null;
  }

  function scrollToAndPulseField(fieldCode) {
    if (!fieldCode) return;
    const el = findTargetElementForField(fieldCode);
    if (!el) return;
    const secCode = resolveFieldSectionCode(state.encounter.formStructure, fieldCode);
    if (secCode) {
      scrollSpyLockUntil = Date.now() + 800;
      setRailActiveButton('encounter', secCode);
    }
    if (typeof el.scrollIntoView === 'function') {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    if (el.classList) {
      el.classList.remove('field--highlight');
      try { void el.offsetWidth; } catch (_e) {}
      el.classList.add('field--highlight');
    }
    const isReadonlyVisit = Boolean(state.encounter.visit && state.encounter.visit.status === 'confirmed');
    if (!isReadonlyVisit && typeof el.querySelector === 'function') {
      const focusable =
        el.querySelector('input:not(:disabled):not([readonly]), select:not(:disabled), textarea:not(:disabled):not([readonly])') ||
        el.querySelector('.tristate__btn:not(:disabled)') ||
        el.querySelector('button:not(:disabled):not(.tristate__clear)') ||
        el.querySelector('button:not(:disabled)');
      if (focusable && typeof focusable.focus === 'function') {
        try { focusable.focus({ preventScroll: true }); } catch (_e) {}
      }
    }
    setTimeout(function () {
      if (el.classList) el.classList.remove('field--highlight');
    }, 2000);
  }

  function openUnsavedGuardModal(targetHash, targetHistoryIndex) {
    openModal({ type: 'unsaved-guard', targetHash: targetHash, targetHistoryIndex: targetHistoryIndex });
  }

  /* ------------------------------------------------------------------------
     Admin Form Draft Reordering Helper (supports Alt+Up / Alt+Down)
     ------------------------------------------------------------------------ */
  function moveDraftField(idx, delta) {
    const af = state.adminForms;
    if (!af.versionDetail || af.versionDetail.formVersion.status !== 'draft') return;
    const sec = (af.draftSections || []).find(function (s) { return s.sectionCode === af.selectedSectionCode; });
    if (!sec || !sec.fields) return;
    const targetIdx = idx + delta;
    if (targetIdx < 0 || targetIdx >= sec.fields.length) return;
    const tmp = sec.fields[idx];
    sec.fields[idx] = sec.fields[targetIdx];
    sec.fields[targetIdx] = tmp;
    sec.fields.forEach(function (f, i) { f.displayOrder = i + 1; });
    af.draftDirty = true;
    render();
  }

  /* ------------------------------------------------------------------------
     Encounter v1.2 & D7 Unlock-Unknown Helpers (G2/C8)
     ------------------------------------------------------------------------ */
  function focusUnlockedFieldInput(code) {
    setTimeout(function () {
      const box = document.querySelector('[data-field-code="' + CSS.escape(code) + '"]');
      if (!box) return;
      const focusable = box.querySelector('input:not(:disabled):not([readonly]), select:not(:disabled), textarea:not(:disabled):not([readonly])');
      if (focusable && typeof focusable.focus === 'function') {
        try { focusable.focus({ preventScroll: true }); } catch (_e) {}
      }
    }, 20);
  }

  function encApplyV12Answer(scope, code, compact) {
    const isPrev = scope === 'prev';
    const ft = getFormTarget(isPrev);
    const fd = Object.values(ft.defById).find(function (d) { return d.code === code; });
    if (!fd) return;
    if (!isPrev) {
      delete state.encounter.unlockedUnknownCodes[code];
      delete state.encounter.fieldErrors[code];
    }
    if (!compact) {
      delete ft.valuesByDefId[fd.id];
    } else {
      ft.valuesByDefId[fd.id] = compactToVisitValue(ft.visitId, fd, compact);
    }
    ft.markDirty();
  }

  function encReadV12Answer(scope, code) {
    const ft = getFormTarget(scope === 'prev');
    const fd = Object.values(ft.defById).find(function (d) { return d.code === code; });
    return fd ? visitValueToCompact(code, ft.valuesByDefId[fd.id], fd) : null;
  }

  function encRefreshWeightCalcPreview(scope, boxEl) {
    const isPrev = scope === 'prev';
    const box = boxEl || document.querySelector('.v12-calc-box[data-v12-wcalc-box="' + CSS.escape(scope) + '"]') || document.querySelector('.v12-calc-box');
    if (!box) return;
    const ft = getFormTarget(isPrev);
    const curW = getEncounterCurrentWeight({ defByCode: ft.defByCode || state.encounter.defByCode, valuesByDefId: ft.valuesByDefId });
    const prevStr = isPrev ? state.adminForms.previewWeightPrev7d : state.encounter.weightPrev7d;
    const prevW = prevStr !== '' && prevStr != null && isFinite(Number(prevStr)) ? Number(prevStr) : null;
    const oldWarn = box.querySelector('.v12-calc-box__warn');
    const oldPreview = box.querySelector('.v12-calc-box__preview');
    if (curW === null) {
      if (oldPreview) oldPreview.remove();
      let warn = oldWarn;
      if (!warn) {
        warn = document.createElement('p');
        warn.className = 'v12-calc-box__warn';
        box.appendChild(warn);
      }
      warn.innerHTML = ICONS.alert + ' Cần nhập cân nặng hiện tại để tự tính';
      return;
    }
    if (oldWarn) oldWarn.remove();
    if (prevW !== null) {
      const delta = Math.round((curW - prevW) * 10) / 10;
      const signed = (delta > 0 ? '+' : '') + delta.toFixed(1);
      let preview = oldPreview;
      if (!preview) {
        preview = document.createElement('div');
        preview.className = 'v12-calc-box__preview';
        box.appendChild(preview);
      }
      preview.innerHTML =
        '<span>Hiện tại ' + esc(curW) + ' − 7 ngày trước ' + esc(prevW) + ' = <strong>' + esc(signed) + ' kg</strong></span>' +
        '<button type="button" class="btn btn--secondary btn--xs" data-v12-apply-wdelta="' + esc(delta) + '" data-v12-scope="' + esc(scope) + '" data-v12-code="bien_thien_can_nang_7ngay">Áp dụng (' + esc(signed) + ' kg)</button>';
    } else if (oldPreview) {
      oldPreview.remove();
    }
  }

  function encApplyTimedLabMeasuredAt(t) {
    const code = t.getAttribute('data-enc-v12lab-time');
    if (!code) return;
    const enc = state.encounter;
    const fd = enc.defByCode[code];
    if (!fd) return;
    const iso = t.value ? fromDatetimeLocal(t.value) : null;
    const unit = WF_CONTRACT_UNITS[code] || fd.canonicalUnit || null;
    const curVal = enc.valuesByDefId[fd.id];
    const curAns = (curVal && curVal.answer && typeof curVal.answer === 'object') ? clone(curVal.answer) : null;
    if (!enc.pendingMeasuredAt) enc.pendingMeasuredAt = {};
    if (curAns && curAns.value_state === 'answered') {
      if (iso) curAns.measuredAt = iso;
      else delete curAns.measuredAt;
      if (unit && !curAns.unit) curAns.unit = unit;
      delete enc.unlockedUnknownCodes[code];
      enc.valuesByDefId[fd.id] = {
        visitId: enc.visit && enc.visit.id,
        fieldDefinitionId: fd.id,
        fieldCode: code,
        valueState: 'answered',
        answer: curAns
      };
      delete enc.fieldErrors[code];
      markEncounterDirty();
      t.classList.toggle('input--error', !iso);
    } else {
      if (iso) enc.pendingMeasuredAt[code] = iso;
      else delete enc.pendingMeasuredAt[code];
      t.classList.remove('input--error');
    }
  }

  function encUpdateV12ListItem(t, trimVal) {
    const attr = t.getAttribute('data-enc-v12list-item');
    if (!attr) return;
    const parts = attr.split(':');
    const code = parts[0];
    const idx = Number(parts[1]);
    const prop = parts[2];
    const enc = state.encounter;
    const fd = enc.defByCode[code];
    if (!fd) return;
    const cur = visitValueToCompact(code, enc.valuesByDefId[fd.id], fd);
    const items = (cur && cur.value_state === 'answered' && Array.isArray(cur.value)) ? clone(cur.value) : [];
    const raw = trimVal ? String(t.value || '').trim() : String(t.value || '');
    if (code === 'diagnoses') {
      items[idx] = raw.toUpperCase();
    } else if (code === 'medications') {
      const row = (items[idx] && typeof items[idx] === 'object') ? items[idx] : { id: 'med-' + (idx + 1), ingredient: '', class: null, dose: null, unit: null, route: null, frequency: null };
      if (prop === 'dose') row.dose = t.value === '' ? null : Number(t.value);
      else if (prop === 'ingredient') row.ingredient = raw;
      else row[prop] = t.value === '' ? null : t.value;
      items[idx] = row;
    } else if (code === 'allergies') {
      const row = (items[idx] && typeof items[idx] === 'object') ? items[idx] : { id: 'alg-' + (idx + 1), ingredient: '' };
      row.ingredient = raw;
      items[idx] = row;
    }
    encApplyV12Answer('enc', code, { value_state: 'answered', value: items });
  }

  /* ------------------------------------------------------------------------
     Global Event Delegation (Clicks, Inputs, Changes, Submits, Shortcuts)
     ------------------------------------------------------------------------ */
  document.addEventListener('submit', async function (ev) {
    if (ev.target && ev.target.id === 'change-password-form') {
      ev.preventDefault();
      await submitPasswordChange();
      return;
    }
    if (ev.target && ev.target.id === 'login-form') {
      ev.preventDefault();
      const lf = state.login;
      const uEl = document.getElementById('login-username');
      const pEl = document.getElementById('login-password');
      lf.username = uEl ? uEl.value.trim() : lf.username;
      lf.password = pEl ? pEl.value : lf.password;
      lf.error = '';
      lf.submitting = true;
      render();
      try {
        const res = await api.login({ username: lf.username, password: lf.password });
        state.user = res.user;
        lf.password = '';
        lf.submitting = false;
        toast('Đăng nhập thành công: ' + res.user.fullName, 'success');
        navigate(res.user.role === 'admin' ? '#/admin/users' : '#/patients', true);
      } catch (err) {
        lf.submitting = false;
        lf.error = (err && err.detail) || 'Đăng nhập thất bại. Vui lòng thử lại.';
        render();
      }
    }
  });

  document.addEventListener('click', async function (ev) {
    const target = ev.target.closest('button, a, [data-ed-section], [data-ed-field]');
    if (!target) return;

    const passwordToggle = target.getAttribute('data-password-toggle');
    if (passwordToggle) {
      const input = document.getElementById(passwordToggle);
      if (input) {
        const start = input.selectionStart;
        const end = input.selectionEnd;
        input.type = input.type === 'password' ? 'text' : 'password';
        const visible = input.type === 'text';
        target.setAttribute('aria-pressed', String(visible));
        target.setAttribute('aria-label', (visible ? 'Ẩn ' : 'Hiện ') + document.querySelector('label[for="' + passwordToggle + '"]').textContent.toLowerCase());
        input.focus();
        input.setSelectionRange(start, end);
      }
      return;
    }

    // Login password toggle
    if (target.id === 'btn-toggle-pw') {
      state.login.showPassword = !state.login.showPassword;
      render();
      return;
    }

    // Navigation button
    const navHash = target.getAttribute('data-nav');
    if (navHash) {
      ev.preventDefault();
      navigate(navHash);
      return;
    }

    // ---- Form v1.2 9-Field Widget Click Handlers (G2: single-form draft only) ----
    const v12Scope = target.getAttribute('data-v12-scope');
    const v12Code = target.getAttribute('data-v12-code');
    if (v12Scope && v12Code) {
      const isPrev = v12Scope === 'prev';
      if (target.hasAttribute('data-v12-scale-opt')) {
        const valNum = Number(target.getAttribute('data-v12-scale-opt'));
        encApplyV12Answer(v12Scope, v12Code, { value_state: 'answered', value: valNum });
        render();
        return;
      }
      if (target.hasAttribute('data-v12-clear')) {
        encApplyV12Answer(v12Scope, v12Code, null);
        render();
        return;
      }
      if (target.hasAttribute('data-v12-unknown')) {
        const cur = encReadV12Answer(v12Scope, v12Code);
        const isUnlocked = !isPrev && Boolean(state.encounter.unlockedUnknownCodes[v12Code]);
        const isSavedUnk = !isPrev && Boolean(state.encounter.savedUnknownCodes[v12Code]);
        if (isUnlocked) {
          // Clicking "Chưa rõ" again while unlocked re-locks to saved unknown
          delete state.encounter.unlockedUnknownCodes[v12Code];
          render();
          return;
        }
        if (cur && cur.value_state === 'unknown') {
          // D7: If saved as unknown on server, toggling off only unlocks input without snapping back or wiping saved value
          if (isSavedUnk) {
            state.encounter.unlockedUnknownCodes[v12Code] = true;
            render();
            focusUnlockedFieldInput(v12Code);
            return;
          }
          encApplyV12Answer(v12Scope, v12Code, null);
          render();
          focusUnlockedFieldInput(v12Code);
          return;
        }
        const unk = makeUnknownAnswer(v12Code, null);
        encApplyV12Answer(v12Scope, v12Code, unk);
        render();
        return;
      }
      if (target.hasAttribute('data-v12-ea-af')) {
        const cur = encReadV12Answer(v12Scope, 'e_over_a_ratio');
        if (cur && cur.value_state === 'answered' && cur.value === 'not_measurable_af') {
          encApplyV12Answer(v12Scope, 'e_over_a_ratio', null);
        } else {
          encApplyV12Answer(v12Scope, 'e_over_a_ratio', { value_state: 'answered', value: 'not_measurable_af', unit: 'ratio' });
        }
        render();
        return;
      }
      if (target.hasAttribute('data-v12-apply-wdelta')) {
        const delta = Number(target.getAttribute('data-v12-apply-wdelta'));
        if (isFinite(delta)) {
          encApplyV12Answer(v12Scope, 'bien_thien_can_nang_7ngay', { value_state: 'answered', value: delta, unit: 'kg' });
          render();
        }
        return;
      }
      if (target.hasAttribute('data-v12-apply-egfr')) {
        const egfrNum = Number(target.getAttribute('data-v12-apply-egfr'));
        if (isFinite(egfrNum)) {
          encApplyV12Answer(v12Scope, 'egfr_ckd_epi', { value_state: 'answered', value: egfrNum, unit: 'mL/min/1.73m2' });
          encApplyV12Answer(v12Scope, 'egfr_formula', { value_state: 'answered', value: 'CKD-EPI 2021' });
          render();
        }
        return;
      }
      if (target.hasAttribute('data-v12-struct-subunk')) {
        const subKey = target.getAttribute('data-v12-struct-subunk');
        const maker = v12Code === 'ecg_12_chuyen_dao' ? makeDefaultEcgValue : makeDefaultXrayValue;
        const cur = encReadV12Answer(v12Scope, v12Code);
        const obj = (cur && cur.value_state === 'answered' && cur.value && typeof cur.value === 'object') ? clone(cur.value) : maker();
        obj[subKey] = null;
        const nextAns = { value_state: 'answered', value: obj };
        if (cur && cur.measuredAt) nextAns.measuredAt = cur.measuredAt;
        encApplyV12Answer(v12Scope, v12Code, nextAns);
        render();
        return;
      }
      if (target.hasAttribute('data-v12-struct-tri')) {
        const parts = target.getAttribute('data-v12-struct-tri').split(':');
        const subKey = parts[0];
        const triVal = parts[1];
        const maker = v12Code === 'ecg_12_chuyen_dao' ? makeDefaultEcgValue : makeDefaultXrayValue;
        const cur = encReadV12Answer(v12Scope, v12Code);
        const obj = (cur && cur.value_state === 'answered' && cur.value && typeof cur.value === 'object') ? clone(cur.value) : maker();
        obj[subKey] = triVal === 'yes' ? true : (triVal === 'no' ? false : null);
        const nextAns = { value_state: 'answered', value: obj };
        if (cur && cur.measuredAt) nextAns.measuredAt = cur.measuredAt;
        encApplyV12Answer(v12Scope, v12Code, nextAns);
        render();
        return;
      }
    }

    // D7: Weight delta calculator toggle (lives on state.encounter / state.adminForms)
    const wCalcScope = target.getAttribute('data-v12-toggle-wcalc');
    if (wCalcScope) {
      if (wCalcScope === 'prev') {
        state.adminForms.previewWeightCalcOpen = !state.adminForms.previewWeightCalcOpen;
      } else {
        state.encounter.weightCalcOpen = !state.encounter.weightCalcOpen;
      }
      render();
      return;
    }

    // ---- Encounter v1.2 Timed Labs & Structured Lists Click Handlers ----
    const encLabUnk = target.getAttribute('data-enc-v12lab-unknown');
    if (encLabUnk) {
      const enc = state.encounter;
      const fd = enc.defByCode[encLabUnk];
      if (fd) {
        const cur = visitValueToCompact(encLabUnk, enc.valuesByDefId[fd.id], fd);
        const isUnlocked = Boolean(enc.unlockedUnknownCodes[encLabUnk]);
        const isSavedUnk = Boolean(enc.savedUnknownCodes[encLabUnk]);
        if (isUnlocked) {
          delete enc.unlockedUnknownCodes[encLabUnk];
          render();
        } else if (cur && cur.value_state === 'unknown') {
          if (isSavedUnk) {
            enc.unlockedUnknownCodes[encLabUnk] = true;
            render();
            focusUnlockedFieldInput(encLabUnk);
          } else {
            encApplyV12Answer('enc', encLabUnk, null);
            render();
            focusUnlockedFieldInput(encLabUnk);
          }
        } else {
          encApplyV12Answer('enc', encLabUnk, makeUnknownAnswer(encLabUnk, fd.canonicalUnit));
          render();
        }
      }
      return;
    }

    const encListAdd = target.getAttribute('data-enc-v12list-add');
    if (encListAdd) {
      const enc = state.encounter;
      const fd = enc.defByCode[encListAdd];
      if (fd) {
        const cur = visitValueToCompact(encListAdd, enc.valuesByDefId[fd.id], fd);
        const items = (cur && cur.value_state === 'answered' && Array.isArray(cur.value)) ? clone(cur.value) : [];
        if (encListAdd === 'diagnoses') {
          items.push('');
        } else if (encListAdd === 'medications') {
          items.push({ id: 'med-' + Date.now().toString(36) + '-' + items.length, ingredient: '', class: null, dose: null, unit: null, route: null, frequency: null });
        } else if (encListAdd === 'allergies') {
          items.push({ id: 'alg-' + Date.now().toString(36) + '-' + items.length, ingredient: '' });
        }
        encApplyV12Answer('enc', encListAdd, { value_state: 'answered', value: items });
        render();
      }
      return;
    }

    const encListRm = target.getAttribute('data-enc-v12list-remove');
    if (encListRm) {
      const parts = encListRm.split(':');
      const code = parts[0];
      const idx = Number(parts[1]);
      const enc = state.encounter;
      const fd = enc.defByCode[code];
      if (fd) {
        const cur = visitValueToCompact(code, enc.valuesByDefId[fd.id], fd);
        const items = (cur && cur.value_state === 'answered' && Array.isArray(cur.value)) ? clone(cur.value) : [];
        if (idx >= 0 && idx < items.length) items.splice(idx, 1);
        encApplyV12Answer('enc', code, { value_state: 'answered', value: items });
        render();
      }
      return;
    }

    const encListSt = target.getAttribute('data-enc-v12list-state');
    if (encListSt) {
      const parts = encListSt.split(':');
      const code = parts[0];
      const st = parts[1];
      const enc = state.encounter;
      const fd = enc.defByCode[code];
      if (fd) {
        if (st === 'none') {
          encApplyV12Answer('enc', code, { value_state: 'answered', value: [] });
          render();
        } else if (st === 'unknown') {
          const cur = visitValueToCompact(code, enc.valuesByDefId[fd.id], fd);
          if (enc.unlockedUnknownCodes[code]) {
            delete enc.unlockedUnknownCodes[code];
            render();
          } else if (cur && cur.value_state === 'unknown' && enc.savedUnknownCodes[code]) {
            enc.unlockedUnknownCodes[code] = true;
            render();
          } else if (cur && cur.value_state === 'unknown') {
            encApplyV12Answer('enc', code, null);
            render();
          } else {
            encApplyV12Answer('enc', code, { value_state: 'unknown', value: null });
            render();
          }
        }
      }
      return;
    }

    // ---- Encounter 4-Module Pinned Progress Bar & Module Filter Click Handlers (D3, D4) ----
    const encWfRun = target.getAttribute('data-enc-wf-run');
    if (encWfRun) {
      await encRunModuleFromForm(encWfRun);
      return;
    }

    const encWfView = target.getAttribute('data-enc-wf-view');
    if (encWfView && state.encounter.visit) {
      state.workflow.preferredModuleOnLoad = encWfView;
      navigate('#/visits/' + state.encounter.visit.id + '/workflow');
      return;
    }

    const encWfMissMod = target.getAttribute('data-enc-wf-missing-mod');
    if (encWfMissMod) {
      const enc = state.encounter;
      const opening = enc.expandedMissingMod !== encWfMissMod;
      enc.expandedMissingMod = opening ? encWfMissMod : null;
      if (opening) {
        enc.fieldSearch = '';
        enc.fieldFilter = 'all';
        if (enc.moduleFilter !== 'all' && enc.moduleFilter !== encWfMissMod) {
          enc.moduleFilter = encWfMissMod;
        }
      }
      render();
      if (opening) {
        const ms = enc.workflowSummary && enc.workflowSummary.modules && enc.workflowSummary.modules[encWfMissMod];
        const missingList = (ms && Array.isArray(ms.missingFieldCodes)) ? ms.missingFieldCodes : [];
        if (missingList.length > 0) {
          const firstCode = resolveFormFieldCode(enc.fieldMetadata, missingList[0]);
          setTimeout(function () { scrollToAndPulseField(firstCode); }, 40);
        }
      }
      return;
    }

    if (target.hasAttribute('data-enc-wf-close-missing')) {
      state.encounter.expandedMissingMod = null;
      render();
      return;
    }

    const encWfJumpMissing = target.getAttribute('data-enc-wf-jump-missing');
    if (encWfJumpMissing) {
      const parts = encWfJumpMissing.split(':');
      const mMod = parts[0];
      const fieldCode = parts[1];
      const enc = state.encounter;
      enc.fieldSearch = '';
      enc.fieldFilter = 'all';
      if (enc.moduleFilter !== 'all' && enc.moduleFilter !== mMod) {
        enc.moduleFilter = mMod;
      }
      render();
      if (fieldCode) {
        setTimeout(function () { scrollToAndPulseField(fieldCode); }, 40);
      }
      return;
    }

    const encModFilter = target.getAttribute('data-enc-mod-filter');
    if (encModFilter) {
      state.encounter.moduleFilter = encModFilter;
      render();
      return;
    }

    // ---- Workflow 4-Module Click Handlers (D5: Results & Decisions Only) ----
    const wfSelMod = target.getAttribute('data-wf-select-module');
    if (wfSelMod) {
      const wf = state.workflow;
      if (!wf.runningModule && !wf.isPharmacistView && wf.data && wf.data.modules && wf.data.modules[wfSelMod] && wf.data.modules[wfSelMod].state !== 'locked') {
        wf.activeModule = wfSelMod;
        wf.manualModeModule = null;
        wf.bannerError = '';
        wf.bannerErrorFields = [];
        render();
      }
      return;
    }

    const wfOpenFormAttr = target.getAttribute('data-wf-open-form');
    if (wfOpenFormAttr) {
      const idxColon = wfOpenFormAttr.indexOf(':');
      const mod = idxColon >= 0 ? wfOpenFormAttr.slice(0, idxColon) : wfOpenFormAttr;
      const fieldCode = idxColon >= 0 ? wfOpenFormAttr.slice(idxColon + 1) : null;
      wfOpenFormForModule(mod, fieldCode || null);
      return;
    }

    if (target.hasAttribute('data-wf-save-evidence')) {
      await wfSaveRecentTestEvidence();
      return;
    }

    const wfAction = target.getAttribute('data-wf-action');
    if (wfAction) {
      const mod = target.getAttribute('data-wf-module') || state.workflow.activeModule;
      if (wfAction === 'run' || wfAction === 'rerun') { await wfRunModule(mod); return; }
      if (wfAction === 'edit') { await wfRequestEdit(mod); return; }
      if (wfAction === 'continue_next') { await wfSubmitDecisionAi(mod, 'accept'); return; }
      if (wfAction === 'accept_ai') { await wfSubmitDecisionAi(mod, 'accept'); return; }
      if (wfAction === 'manual_override') { wfOpenManualOverride(mod); return; }
      if (wfAction === 'complete') { await wfFinishWorkflow(); return; }
      return;
    }

    const wfEditMod = target.getAttribute('data-wf-edit-module');
    if (wfEditMod) {
      await wfRequestEdit(wfEditMod);
      return;
    }
    const wfConfirmEdit = target.getAttribute('data-wf-confirm-edit');
    if (wfConfirmEdit) {
      closeModal();
      await wfProceedEditToForm(wfConfirmEdit);
      return;
    }
    const wfUpMod = target.getAttribute('data-wf-toggle-upstream');
    if (wfUpMod) {
      state.workflow.expandedUpstream[wfUpMod] = !state.workflow.expandedUpstream[wfUpMod];
      render();
      return;
    }
    const wfHistMod = target.getAttribute('data-wf-toggle-history');
    if (wfHistMod) {
      const wf = state.workflow;
      wf.historyOpen[wfHistMod] = !wf.historyOpen[wfHistMod];
      render();
      if (wf.historyOpen[wfHistMod]) {
        try {
          const res = await api.listWorkflowRuns(wf.visitId, wfHistMod);
          const list = Array.isArray(res) ? res : ((res && Array.isArray(res.items)) ? res.items : ((res && Array.isArray(res.runs)) ? res.runs : null));
          if (list) {
            list.forEach(function (r) { if (r && r.id) wf.runCache[r.id] = r; });
            wf.historyRuns[wfHistMod] = list.slice().sort(function (a, b) { return (b.attempt || 0) - (a.attempt || 0); });
            render();
          }
        } catch (_ignored) {}
      }
      return;
    }
    const wfViewRun = target.getAttribute('data-wf-view-run');
    if (wfViewRun) {
      const parts = wfViewRun.split(':');
      const mod = parts[0];
      const runId = parts[1];
      const wf = state.workflow;
      if (!wf.runCache[runId]) {
        try {
          const fullRun = await api.getWorkflowRun(wf.visitId, mod, runId);
          if (fullRun && fullRun.id) wf.runCache[fullRun.id] = fullRun;
        } catch (_e) {}
      }
      wf.historySelectedRun[mod] = runId;
      render();
      return;
    }
    if (target.hasAttribute('data-wf-reload')) {
      await loadWorkflow(state.workflow.visitId, { keepModule: true });
      return;
    }
    const wfPrefillMod = target.getAttribute('data-wf-prefill-manual');
    if (wfPrefillMod) {
      wfPrefillManualFromAi(wfPrefillMod);
      return;
    }
    if (target.hasAttribute('data-wf-cancel-manual')) {
      state.workflow.manualModeModule = null;
      state.workflow.manualReasonError = '';
      render();
      return;
    }
    const wfSubmitManMod = target.getAttribute('data-wf-submit-manual');
    if (wfSubmitManMod) {
      await wfSubmitDecisionManual(wfSubmitManMod);
      return;
    }
    const wfM4Choice = target.getAttribute('data-wf-m4-choice');
    if (wfM4Choice) {
      const idxColon = wfM4Choice.indexOf(':');
      const alertId = wfM4Choice.slice(0, idxColon);
      const choice = wfM4Choice.slice(idxColon + 1);
      const wf = state.workflow;
      const cur = wf.m4Decisions[alertId] || { quyet_dinh: '', ly_do: '', error: '' };
      cur.quyet_dinh = choice;
      cur.error = '';
      wf.m4Decisions[alertId] = cur;
      render();
      return;
    }
    if (target.hasAttribute('data-wf-save-m4-confirmations')) {
      await wfSaveM4Confirmations();
      return;
    }
    // F4: Manual override dynamic row actions (M3 followups & M4 alerts)
    if (target.hasAttribute('data-wf-man-add-followup') && state.workflow.manualDraft) {
      if (!Array.isArray(state.workflow.manualDraft.ke_hoach_theo_doi)) state.workflow.manualDraft.ke_hoach_theo_doi = [];
      state.workflow.manualDraft.ke_hoach_theo_doi.push({ hang_muc: '', thoi_diem: '', ly_do: '' });
      render();
      return;
    }
    if (target.hasAttribute('data-wf-man-rm-followup') && state.workflow.manualDraft) {
      const idx = Number(target.getAttribute('data-wf-man-rm-followup'));
      if (Array.isArray(state.workflow.manualDraft.ke_hoach_theo_doi)) {
        state.workflow.manualDraft.ke_hoach_theo_doi.splice(idx, 1);
      }
      render();
      return;
    }
    if (target.hasAttribute('data-wf-man-m4-add-alert') && state.workflow.manualDraft) {
      if (!Array.isArray(state.workflow.manualDraft.canh_bao)) state.workflow.manualDraft.canh_bao = [];
      const idx = state.workflow.manualDraft.canh_bao.length;
      state.workflow.manualDraft.canh_bao.push({
        id: 'manual-al-' + Date.now().toString(36) + '-' + idx,
        ddCode: 204,
        muc_do: 'Quan trọng',
        loai: 'Cảnh báo an toàn thuốc',
        noi_dung: '',
        hanh_dong_de_xuat: 'Bác sĩ rà soát và theo dõi',
        thuoc_lien_quan: ['manual-drug'],
        auto_change_medication: false
      });
      render();
      return;
    }
    if (target.hasAttribute('data-wf-man-m4-rm-alert') && state.workflow.manualDraft) {
      const idx = Number(target.getAttribute('data-wf-man-m4-rm-alert'));
      if (Array.isArray(state.workflow.manualDraft.canh_bao)) {
        const removed = state.workflow.manualDraft.canh_bao.splice(idx, 1)[0];
        if (removed && removed.id) delete state.workflow.m4Decisions[removed.id];
      }
      render();
      return;
    }
    const wfRxMode = target.getAttribute('data-wf-rx-mode');
    if (wfRxMode) {
      const wf = state.workflow;
      if (wfRxMode === 'none') {
        wf.selectedPrescription = { value_state: 'answered', listState: 'none', items: [] };
      } else {
        const items = (wf.selectedPrescription && Array.isArray(wf.selectedPrescription.items) && wf.selectedPrescription.items.length > 0)
          ? wf.selectedPrescription.items
          : [{ id: 'rx-' + Date.now().toString(36), ingredientCode: '', atcCode: null, display: '', detailState: 'unknown', dose: null, doseUnit: null, timesPerDay: null, route: null, action: 'start', replacesMedicationId: null, therapeuticGroup: 'other' }];
        wf.selectedPrescription = { value_state: 'answered', listState: 'known', items: items };
      }
      render();
      return;
    }
    if (target.hasAttribute('data-wf-rx-add')) {
      const wf = state.workflow;
      wf.selectedPrescription.listState = 'known';
      wf.selectedPrescription.items.push({ id: 'rx-' + Date.now().toString(36) + '-' + wf.selectedPrescription.items.length, ingredientCode: '', atcCode: null, display: '', detailState: 'unknown', dose: null, doseUnit: null, timesPerDay: null, route: null, action: 'start', replacesMedicationId: null, therapeuticGroup: 'other' });
      render();
      return;
    }
    if (target.hasAttribute('data-wf-rx-remove')) {
      const idx = Number(target.getAttribute('data-wf-rx-remove'));
      state.workflow.selectedPrescription.items.splice(idx, 1);
      if (state.workflow.selectedPrescription.items.length === 0) state.workflow.selectedPrescription.listState = 'none';
      render();
      return;
    }

    // Patient status filter
    const pStatus = target.getAttribute('data-patient-status');
    if (pStatus !== null) {
      state.patients.status = pStatus;
      await loadPatients();
      return;
    }

    // Encounter section rail (UI-06: smooth scroll to section without full re-render)
    const encSec = target.getAttribute('data-enc-section');
    if (encSec) {
      const targetMissing = !document.getElementById('enc-sec-' + encSec);
      if (state.encounter.fieldSearch || state.encounter.fieldFilter !== 'all' || (targetMissing && state.encounter.moduleFilter !== 'all')) {
        state.encounter.activeSectionCode = encSec;
        state.encounter.fieldSearch = '';
        state.encounter.fieldFilter = 'all';
        if (targetMissing) state.encounter.moduleFilter = 'all';
        render();
        setTimeout(function () { scrollToSectionBlock('encounter', encSec, true); }, 30);
      } else {
        scrollToSectionBlock('encounter', encSec, true);
      }
      return;
    }

    // Encounter filter pill
    const encFilter = target.getAttribute('data-enc-filter');
    if (encFilter) {
      state.encounter.fieldFilter = encFilter;
      render();
      return;
    }

    // Preview section rail (UI-06: smooth scroll to section without full re-render)
    const prevSec = target.getAttribute('data-prev-section');
    if (prevSec) {
      scrollToSectionBlock('preview', prevSec, true);
      return;
    }

    // Jump to field on M4
    const jumpSpec = target.getAttribute('data-jump-field');
    if (jumpSpec) {
      const parts = jumpSpec.split(':');
      state.encounter.activeSectionCode = parts[0];
      state.encounter.fieldFilter = 'all';
      state.encounter.fieldSearch = '';
      render();
      setTimeout(function () { scrollToAndPulseField(parts[1]); }, 40);
      return;
    }

    // M5 open section on M4
    const revOpenSec = target.getAttribute('data-review-open-sec');
    if (revOpenSec) {
      state.encounter.activeSectionCode = revOpenSec;
      state.encounter.scrollToSectionCode = revOpenSec;
      navigate('#/visits/' + state.review.visitId, true);
      return;
    }

    // M5 jump to field on M4
    const revJump = target.getAttribute('data-review-jump');
    if (revJump) {
      const parts = revJump.split(':');
      state.encounter.activeSectionCode = parts[0];
      state.encounter.fieldFilter = 'all';
      state.encounter.fieldSearch = '';
      state.encounter.highlightFieldCode = parts[1];
      navigate('#/visits/' + state.review.visitId, true);
      return;
    }

    // M5 AI issue jump to field on M4
    const aiIssueCode = target.getAttribute('data-ai-issue-jump');
    if (aiIssueCode !== null && state.review.visit) {
      if (aiIssueCode) {
        const secCode = resolveFieldSectionCode(state.review.formRes, aiIssueCode);
        state.encounter.activeSectionCode = secCode;
        state.encounter.fieldFilter = 'all';
        state.encounter.fieldSearch = '';
        state.encounter.highlightFieldCode = aiIssueCode;
        navigate('#/visits/' + state.review.visitId, true);
      }
      return;
    }

    // List-state selector (known | none | unknown) for medications, allergies, diagnoses
    const listStateAttr = target.getAttribute('data-enc-list-state') || target.getAttribute('data-prev-list-state');
    if (listStateAttr) {
      const isPrev = target.hasAttribute('data-prev-list-state');
      const ft = getFormTarget(isPrev);
      const parts = listStateAttr.split(':');
      const kind = parts[0];
      const nextState = parts[1];
      ft.setListState(kind, nextState);
      if (nextState === 'none' || nextState === 'unknown') {
        if (kind === 'medications') ft.medications.length = 0;
        else if (kind === 'allergies') ft.allergies.length = 0;
        else if (kind === 'diagnoses') ft.diagnoses.length = 0;
      }
      ft.markDirty();
      render();
      return;
    }

    // Tri-state buttons (Encounter or Preview)
    const encTri = target.getAttribute('data-enc-tristate') || target.getAttribute('data-prev-tristate');
    if (encTri) {
      const isPrev = target.hasAttribute('data-prev-tristate');
      const ft = getFormTarget(isPrev);
      const fd = ft.defById[encTri];
      const val = target.getAttribute('data-val');
      if (fd) {
        if (!isPrev) {
          delete state.encounter.unlockedUnknownCodes[fd.code];
          delete state.encounter.fieldErrors[fd.code];
        }
        if (val === 'clear') {
          delete ft.valuesByDefId[fd.id];
        } else if (val === 'unknown') {
          ft.valuesByDefId[fd.id] = makeEmptyVisitValue(ft.visitId, fd, 'unknown');
        } else {
          const item = makeEmptyVisitValue(ft.visitId, fd, 'answered');
          item.valueBool = (val === 'yes');
          ft.valuesByDefId[fd.id] = item;
        }
        // Sync contrast media allergy row when backend stores di_ung_thuoc_can_quang under storageLevel='allergy'
        if (fd.code === 'di_ung_thuoc_can_quang' && fd.storageLevel === 'allergy') {
          if (val === 'yes') {
            const hasContrast = (ft.allergies || []).some(function (a) { return a && a.agentCategory === 'contrast_media'; });
            if (!hasContrast) {
              ft.setListState('allergies', 'known');
              ft.allergies.push({
                kind: 'allergy',
                agentCategory: 'contrast_media',
                allergen: 'Thuốc cản quang',
                reaction: '',
                severity: 'unknown',
                recordedAt: new Date().toISOString(),
                note: null,
                _autoContrast: true
              });
            }
          } else {
            for (let i = ft.allergies.length - 1; i >= 0; i--) {
              if (ft.allergies[i] && ft.allergies[i]._autoContrast) ft.allergies.splice(i, 1);
            }
            if (ft.allergies.length === 0) ft.setListState('allergies', 'unknown');
          }
        }
        ft.markDirty();
        render();
      }
      return;
    }

    // Unknown toggle for non-boolean fields (D7: unlock without snapping back when saved as unknown)
    const unkId = target.getAttribute('data-enc-toggle-unknown') || target.getAttribute('data-prev-toggle-unknown');
    if (unkId) {
      const isPrev = target.hasAttribute('data-prev-toggle-unknown');
      const ft = getFormTarget(isPrev);
      const fd = ft.defById[unkId];
      if (fd) {
        const cur = ft.valuesByDefId[fd.id];
        const isUnlocked = !isPrev && Boolean(state.encounter.unlockedUnknownCodes[fd.code]);
        const isSavedUnk = !isPrev && Boolean(state.encounter.savedUnknownCodes[fd.code]);
        if (isUnlocked) {
          delete state.encounter.unlockedUnknownCodes[fd.code];
          render();
          return;
        }
        if (cur && cur.valueState === 'unknown') {
          if (isSavedUnk) {
            state.encounter.unlockedUnknownCodes[fd.code] = true;
            render();
            focusUnlockedFieldInput(fd.code);
            return;
          }
          delete ft.valuesByDefId[fd.id];
          if (fd.code === 'mach') ft.setAutoPulseSourceIndex(null);
          ft.markDirty();
          render();
          if (!isPrev) focusUnlockedFieldInput(fd.code);
          return;
        }
        if (!isPrev) delete state.encounter.unlockedUnknownCodes[fd.code];
        ft.valuesByDefId[fd.id] = makeEmptyVisitValue(ft.visitId, fd, 'unknown');
        if (fd.code === 'mach') ft.setAutoPulseSourceIndex(null);
        ft.markDirty();
        render();
      }
      return;
    }

    // Repeating table Add/Remove (BP, Med, Allergy, Lab) for Encounter & Preview
    if (target.hasAttribute('data-enc-add-bp') || target.hasAttribute('data-prev-add-bp')) {
      const ft = getFormTarget(target.hasAttribute('data-prev-add-bp'));
      const bp = { position: 'sitting', minuteAfter: 0, systolic: 120, diastolic: 75, heartRate: 76, measuredAt: new Date().toISOString(), note: null };
      ft.orthostaticBp.push(bp);
      syncHeartRateFromBp(ft, bp.heartRate, ft.orthostaticBp.length - 1);
      ft.markDirty();
      render();
      return;
    }
    if (target.hasAttribute('data-enc-remove-bp') || target.hasAttribute('data-prev-remove-bp')) {
      const isPrev = target.hasAttribute('data-prev-remove-bp');
      const idx = Number(target.getAttribute(isPrev ? 'data-prev-remove-bp' : 'data-enc-remove-bp'));
      const ft = getFormTarget(isPrev);
      const autoSourceIndex = ft.getAutoPulseSourceIndex();
      ft.orthostaticBp.splice(idx, 1);
      if (autoSourceIndex === idx) {
        if (ft.orthostaticBp.length === 0) clearAutoPulseValue(ft);
        else {
          const newestIndex = ft.orthostaticBp.length - 1;
          syncHeartRateFromBp(ft, ft.orthostaticBp[newestIndex].heartRate, newestIndex);
        }
      } else if (autoSourceIndex !== null && autoSourceIndex > idx) {
        ft.setAutoPulseSourceIndex(autoSourceIndex - 1);
      }
      ft.markDirty();
      render();
      return;
    }

    if (target.hasAttribute('data-enc-add-med') || target.hasAttribute('data-prev-add-med')) {
      const ft = getFormTarget(target.hasAttribute('data-prev-add-med'));
      ft.setListState('medications', 'known');
      ft.medications.push({ medicationGroup: '', drugName: '', activeIngredient: '', dose: null, unit: '', frequency: '', route: '', status: '', startedAt: null, note: null });
      ft.markDirty();
      render();
      return;
    }
    if (target.hasAttribute('data-enc-remove-med') || target.hasAttribute('data-prev-remove-med')) {
      const isPrev = target.hasAttribute('data-prev-remove-med');
      const idx = Number(target.getAttribute(isPrev ? 'data-prev-remove-med' : 'data-enc-remove-med'));
      const ft = getFormTarget(isPrev);
      ft.medications.splice(idx, 1);
      if (ft.medications.length === 0) ft.setListState('medications', 'unknown');
      ft.markDirty();
      render();
      return;
    }

    if (target.hasAttribute('data-enc-add-allergy') || target.hasAttribute('data-prev-add-allergy')) {
      const ft = getFormTarget(target.hasAttribute('data-prev-add-allergy'));
      ft.setListState('allergies', 'known');
      ft.allergies.push({ kind: 'allergy', agentCategory: 'therapeutic_drug', allergen: '', reaction: '', severity: 'unknown', recordedAt: new Date().toISOString(), note: null });
      ft.markDirty();
      render();
      return;
    }
    if (target.hasAttribute('data-enc-remove-allergy') || target.hasAttribute('data-prev-remove-allergy')) {
      const isPrev = target.hasAttribute('data-prev-remove-allergy');
      const idx = Number(target.getAttribute(isPrev ? 'data-prev-remove-allergy' : 'data-enc-remove-allergy'));
      const ft = getFormTarget(isPrev);
      ft.allergies.splice(idx, 1);
      if (ft.allergies.length === 0) ft.setListState('allergies', 'unknown');
      ft.markDirty();
      render();
      return;
    }

    if (target.hasAttribute('data-enc-add-dx') || target.hasAttribute('data-prev-add-dx')) {
      const isPrev = target.hasAttribute('data-prev-add-dx');
      const reqRole = target.getAttribute(isPrev ? 'data-prev-add-dx' : 'data-enc-add-dx');
      const ft = getFormTarget(isPrev);
      ft.setListState('diagnoses', 'known');
      const hasPrimary = ft.diagnoses.some(function (d) { return d && d.role === 'primary'; });
      const role = reqRole === 'primary' && !hasPrimary ? 'primary' : 'secondary';
      ft.diagnoses.push({ code: '', display: '', role: role });
      ft.markDirty();
      render();
      return;
    }
    if (target.hasAttribute('data-enc-remove-dx') || target.hasAttribute('data-prev-remove-dx')) {
      const isPrev = target.hasAttribute('data-prev-remove-dx');
      const idx = Number(target.getAttribute(isPrev ? 'data-prev-remove-dx' : 'data-enc-remove-dx'));
      const ft = getFormTarget(isPrev);
      ft.diagnoses.splice(idx, 1);
      if (ft.diagnoses.length === 0) ft.setListState('diagnoses', 'unknown');
      ft.markDirty();
      render();
      return;
    }

    if (target.hasAttribute('data-enc-add-lab') || target.hasAttribute('data-prev-add-lab')) {
      const ft = getFormTarget(target.hasAttribute('data-prev-add-lab'));
      ft.labResults.push({ labCode: '', labSubtype: null, valueNum: null, valueText: null, unit: '', measuredAt: '', note: null });
      ft.markDirty();
      render();
      return;
    }
    if (target.hasAttribute('data-enc-remove-lab') || target.hasAttribute('data-prev-remove-lab')) {
      const isPrev = target.hasAttribute('data-prev-remove-lab');
      const idx = Number(target.getAttribute(isPrev ? 'data-prev-remove-lab' : 'data-enc-remove-lab'));
      const ft = getFormTarget(isPrev);
      ft.labResults.splice(idx, 1);
      ft.markDirty();
      render();
      return;
    }

    // M6 Admin User row actions
    const editUid = target.getAttribute('data-admin-edit-user');
    if (editUid) {
      const u = state.adminUsers.items.find(function (x) { return x.id === editUid; });
      if (u) {
        openModal({
          type: 'admin-user-form',
          userId: u.id,
          rowVersion: u.rowVersion || 1,
          step: 1,
          data: { username: u.username, fullName: u.fullName, role: u.role, isActive: u.isActive, reason: '' },
          preview: null,
          error: ''
        });
      }
      return;
    }
    const resetUid = target.getAttribute('data-admin-reset-pw');
    if (resetUid) {
      const u = state.adminUsers.items.find(function (x) { return x.id === resetUid; });
      if (u) {
        openModal({
          type: 'admin-user-action',
          kind: 'reset-pw',
          user: u,
          title: 'Đặt lại mật khẩu tài khoản ' + u.username,
          desc: 'Hệ thống sẽ sinh mã thiết lập mật khẩu một lần (hết hạn sau 24 giờ) và thu hồi phiên đăng nhập cũ.',
          reason: '',
          error: ''
        });
      }
      return;
    }
    const lockUid = target.getAttribute('data-admin-toggle-lock');
    if (lockUid) {
      const u = state.adminUsers.items.find(function (x) { return x.id === lockUid; });
      if (u) {
        openModal({
          type: 'admin-user-action',
          kind: 'toggle-lock',
          user: u,
          title: (u.isActive ? 'Khóa tài khoản ' : 'Mở khóa tài khoản ') + u.username,
          desc: u.isActive ? 'Tài khoản bị khóa sẽ không thể đăng nhập và mọi phiên hiện tại bị thu hồi ngay.' : 'Khôi phục quyền đăng nhập cho tài khoản này.',
          reason: '',
          error: ''
        });
      }
      return;
    }

    // M7 Form Version Selection, Tabs, Editor Panes, Reordering
    const selVerId = target.getAttribute('data-select-version');
    if (selVerId) {
      await selectAdminFormVersion(selVerId);
      return;
    }
    const formTab = target.getAttribute('data-form-tab');
    if (formTab) {
      const af = state.adminForms;
      // Never auto-PATCH when switching to Preview (or Diff)!
      af.activeTab = formTab;
      af.previewError = '';
      if (formTab === 'preview') af.previewData = null;
      render();
      if (formTab === 'preview' && af.selectedVersionId) {
        const fv = af.versionDetail && af.versionDetail.formVersion;
        const isDirtyDraft = Boolean(af.draftDirty && fv && fv.status === 'draft');
        try {
          if (isDirtyDraft) {
            try {
              af.previewData = await api.previewFormVersionDraft(fv.id, {
                rowVersion: fv.rowVersion,
                changeNote: fv.changeNote,
                sections: af.draftSections
              });
            } catch (postErr) {
              if (postErr && postErr.status === 405) {
                af.previewData = {
                  isPreviewOnly: true,
                  previewBannerVi: 'Chế độ xem trước góc nhìn Bác sĩ cho ' + fv.versionLabel + ' (trạng thái đang chỉnh sửa, chưa lưu nháp) — mọi thao tác nhập thử không được lưu vào hồ sơ bệnh án.',
                  formVersion: fv,
                  sections: clone(af.draftSections || []),
                  fieldDefinitions: clone((af.versionDetail && af.versionDetail.fieldDefinitions) || [])
                };
              } else {
                throw postErr;
              }
            }
          } else {
            af.previewData = await api.previewFormVersion(af.selectedVersionId);
          }
        } catch (err) {
          af.previewError = (err && err.detail) || 'Không thể tải bản xem trước biểu mẫu.';
          if (err && (err.status === 401 || err.status === 403)) return handleAuthOrError(err);
        }
        render();
      } else if (formTab === 'diff' && af.selectedVersionId && af.diffBaseVersionId) {
        try {
          af.diffData = await api.diffFormVersion(af.selectedVersionId, af.diffBaseVersionId);
        } catch (err) {
          handleAuthOrError(err, 'Không thể tải bảng so sánh phiên bản.');
        }
        render();
      }
      return;
    }
    const moveSpec = target.getAttribute('data-move-field');
    if (moveSpec) {
      ev.stopPropagation();
      const parts = moveSpec.split(':');
      moveDraftField(Number(parts[0]), Number(parts[1]));
      return;
    }
    const edSec = target.getAttribute('data-ed-section');
    if (edSec) {
      const af = state.adminForms;
      af.selectedSectionCode = edSec;
      const s = (af.draftSections || []).find(function (x) { return x.sectionCode === edSec; });
      af.selectedFieldDefId = (s && s.fields && s.fields[0]) ? s.fields[0].fieldDefinitionId : null;
      render();
      return;
    }
    const edField = target.getAttribute('data-ed-field');
    if (edField) {
      state.adminForms.selectedFieldDefId = edField;
      renderPreservingEditorScroll();
      return;
    }

    // M8 Audit select -> open modal detail (UI-08)
    const auditSel = target.getAttribute('data-audit-select');
    if (auditSel) {
      const logItem = state.adminAudit.items.find(function (l) { return l.id === auditSel; });
      if (logItem) {
        state.adminAudit.selectedLogId = auditSel;
        openModal({ type: 'audit-detail', log: logItem });
      }
      return;
    }

    // M9 Admin Care patient selection & assignment revoke
    const adminCarePtId = target.getAttribute('data-admin-care-patient');
    if (adminCarePtId) {
      await selectAdminCarePatient(adminCarePtId);
      return;
    }
    const adminRevokeId = target.getAttribute('data-admin-revoke-assignment');
    if (adminRevokeId && state.adminCare.selectedPatientId) {
      try {
        await api.adminRevokePatientCareAssignment(state.adminCare.selectedPatientId, adminRevokeId);
        toast('Đã thu hồi phân công bác sĩ.', 'success');
        await loadAdminCare();
      } catch (err) {
        handleAuthOrError(err, 'Không thể thu hồi phân công bác sĩ.');
      }
      return;
    }

    // Named actions
    const action = target.getAttribute('data-action');
    if (!action) return;

    if (action === 'admin-open-add-assignment' && state.adminCare.selectedPatient) {
      const sp = state.adminCare.selectedPatient;
      const activeIds = (state.adminCare.assignments || []).filter(isAssignmentActiveNow).map(function (a) { return a.doctorUserId; });
      openModal({
        type: 'admin-add-care-assignment',
        patientId: sp.id,
        patientCode: sp.patientCode,
        patientName: sp.fullName,
        doctors: state.adminCare.doctors || [],
        activeDoctorIds: activeIds,
        doctorUserId: '',
        reason: '',
        error: ''
      });
      return;
    }
    if (action === 'submit-admin-add-assignment' && state.modal && state.modal.type === 'admin-add-care-assignment') {
      const m = state.modal;
      const doctorId = (document.getElementById('aca-doctor') || {}).value || '';
      const reason = ((document.getElementById('aca-reason') || {}).value || '').trim();
      m.doctorUserId = doctorId;
      m.reason = reason;
      if (!doctorId) {
        m.error = 'Vui lòng chọn bác sĩ phụ trách.';
        renderModal();
        return;
      }
      try {
        const body = reason ? { doctorUserId: doctorId, reason: reason } : { doctorUserId: doctorId };
        await api.adminAddPatientCareAssignment(m.patientId, body);
        closeModal();
        toast('Đã phân công bác sĩ phụ trách cho hồ sơ ' + m.patientCode + '.', 'success');
        await loadAdminCare();
      } catch (err) {
        m.error = (err && err.detail) || 'Không thể thêm phân công bác sĩ.';
        renderModal();
      }
      return;
    }
    if (action === 'admin-open-replace-assignments' && state.adminCare.selectedPatient) {
      const sp = state.adminCare.selectedPatient;
      const activeIds = (state.adminCare.assignments || []).filter(isAssignmentActiveNow).map(function (a) { return a.doctorUserId; });
      openModal({
        type: 'admin-replace-care-assignments',
        patientId: sp.id,
        patientCode: sp.patientCode,
        patientName: sp.fullName,
        doctors: state.adminCare.doctors || [],
        selectedDoctorIds: activeIds,
        reason: '',
        error: ''
      });
      return;
    }
    if (action === 'submit-admin-replace-assignments' && state.modal && state.modal.type === 'admin-replace-care-assignments') {
      const m = state.modal;
      const checkedBoxes = Array.prototype.slice.call(document.querySelectorAll('input[name="acr-doctor"]:checked'));
      const doctorUserIds = checkedBoxes.map(function (cb) { return cb.value; });
      const reason = ((document.getElementById('acr-reason') || {}).value || '').trim();
      m.selectedDoctorIds = doctorUserIds;
      m.reason = reason;
      try {
        const body = reason ? { doctorUserIds: doctorUserIds, reason: reason } : { doctorUserIds: doctorUserIds };
        await api.adminReplacePatientCareAssignments(m.patientId, body);
        closeModal();
        toast('Đã cập nhật danh sách bác sĩ phụ trách cho hồ sơ ' + m.patientCode + '.', 'success');
        await loadAdminCare();
      } catch (err) {
        m.error = (err && err.detail) || 'Không thể cập nhật danh sách phân công.';
        renderModal();
      }
      return;
    }

    if (action === 'toggle-account-menu') {
      const menu = document.getElementById('account-menu');
      if (menu && !menu.hidden && accountMenuTrigger === target) closeAccountMenu(false);
      else openAccountMenu(target, false);
      return;
    }

    if (action === 'open-change-password' && state.user) {
      const trigger = visibleAccountTrigger(accountMenuTrigger);
      closeAccountMenu(false);
      setMobileMenuOpen(false);
      openModal({ type: 'change-password', pending: false, returnFocus: trigger });
      return;
    }

    if (action === 'toggle-sidebar') {
      closeAccountMenu(false);
      state.sidebarCollapsed = !state.sidebarCollapsed;
      try { global.localStorage.setItem('suytim_sidebar_collapsed', state.sidebarCollapsed ? '1' : '0'); } catch (_e) {}
      const shellEl = document.querySelector('.shell');
      if (shellEl) {
        shellEl.classList.toggle('is-sidebar-collapsed', state.sidebarCollapsed);
        const btns = document.querySelectorAll('[data-action="toggle-sidebar"]');
        btns.forEach(function (b) {
          const tip = state.sidebarCollapsed ? 'Mở rộng thanh chức năng' : 'Thu gọn thanh chức năng';
          b.setAttribute('title', tip);
          b.setAttribute('aria-label', tip);
          b.setAttribute('aria-expanded', state.sidebarCollapsed ? 'false' : 'true');
        });
      } else {
        render();
      }
      return;
    }
    if (action === 'toggle-mobile-menu') {
      closeAccountMenu(false);
      setMobileMenuOpen(!state.mobileMenuOpen);
      return;
    }
    if (action === 'logout') {
      if (state.loggingOut) return;
      state.loggingOut = true;
      closeAccountMenu(false);
      try { await api.logout(); } catch (_ignored) {}
      state.loggingOut = false;
      state.user = null;
      state.encounter.dirty = false;
      state.login.error = '';
      toast('Đã đăng xuất an toàn.', 'success');
      navigate('#/login', true);
      return;
    }
    if (action === 'close-modal') {
      closeModal();
      return;
    }
    if (action === 'reload-patients') {
      await loadPatients();
      return;
    }
    if (action === 'reload-encounter') {
      await loadEncounter(state.encounter.visitId);
      return;
    }
    if (action === 'open-create-patient') {
      openModal({
        type: 'patient-form',
        patientId: null,
        data: { fullName: '', sex: '', birthMode: 'date', birthDate: '', birthYear: '', declaredAge: '', externalPatientCode: '' },
        error: ''
      });
      return;
    }
    if (action === 'open-edit-patient' && state.profile.patient) {
      const pt = state.profile.patient;
      const bm = pt.birthDate ? 'date' : (pt.birthYear != null ? 'year' : (pt.declaredAge != null ? 'age' : 'none'));
      openModal({
        type: 'patient-form',
        patientId: pt.id,
        rowVersion: pt.rowVersion,
        data: {
          patientCode: pt.patientCode,
          fullName: pt.fullName,
          sex: pt.sex,
          birthMode: bm,
          birthDate: pt.birthDate || '',
          birthYear: pt.birthYear != null ? String(pt.birthYear) : '',
          declaredAge: pt.declaredAge != null ? String(pt.declaredAge) : '',
          externalPatientCode: pt.externalPatientCode || ''
        },
        error: ''
      });
      return;
    }
    if (action === 'submit-patient-form' && state.modal && state.modal.type === 'patient-form') {
      const m = state.modal;
      const d = m.data;
      const fullNameVal = ((document.getElementById('mf-fullname') || {}).value || '').trim();
      const sexVal = (document.getElementById('mf-sex') || {}).value || '';
      d.fullName = fullNameVal;
      d.sex = sexVal;
      d.externalPatientCode = ((document.getElementById('mf-extcode') || {}).value || '').trim();
      if (!fullNameVal) {
        m.error = 'Vui lòng nhập họ tên hoặc ký hiệu hồ sơ bệnh nhân.';
        renderModal();
        return;
      }
      if (!sexVal) {
        m.error = 'Vui lòng chọn giới tính (Nam, Nữ hoặc Chưa rõ).';
        renderModal();
        return;
      }
      const payload = {
        fullName: fullNameVal,
        sex: sexVal,
        birthDate: d.birthMode === 'date' ? ((document.getElementById('mf-birthdate') || {}).value || null) : null,
        birthYear: d.birthMode === 'year' && (document.getElementById('mf-birthyear') || {}).value ? Number(document.getElementById('mf-birthyear').value) : null,
        declaredAge: d.birthMode === 'age' && (document.getElementById('mf-age') || {}).value ? Number(document.getElementById('mf-age').value) : null,
        externalPatientCode: d.externalPatientCode || null
      };
      try {
        if (m.patientId) {
          payload.rowVersion = m.rowVersion;
          await api.updatePatient(m.patientId, payload, m.rowVersion);
          closeModal();
          toast('Đã cập nhật hành chính hồ sơ.', 'success');
          await loadProfile(m.patientId);
        } else {
          const created = await api.createPatient(payload);
          closeModal();
          toast('Đã tạo hồ sơ ' + created.patientCode + '.', 'success');
          navigate('#/patients/' + created.id, true);
        }
      } catch (err) {
        m.error = (err && err.detail) || 'Không thể lưu hồ sơ bệnh nhân.';
        renderModal();
      }
      return;
    }
    if (action === 'open-create-visit' && state.profile.patient) {
      const suggestedType = (state.profile.visits || []).length === 0 ? 'outpatient_new' : '';
      openModal({
        type: 'create-visit',
        patientId: state.profile.patient.id,
        data: { visitDateLocal: toDatetimeLocal(new Date().toISOString()), visitType: suggestedType, chiefComplaint: '' },
        error: ''
      });
      return;
    }
    if (action === 'submit-create-visit' && state.modal && state.modal.type === 'create-visit') {
      const m = state.modal;
      const dtLocal = (document.getElementById('mv-date') || {}).value;
      const vt = (document.getElementById('mv-type') || {}).value || '';
      const cc = ((document.getElementById('mv-reason') || {}).value || '').trim() || null;
      m.data.visitDateLocal = dtLocal;
      m.data.visitType = vt;
      m.data.chiefComplaint = cc || '';
      if (!vt) {
        m.error = 'Vui lòng chọn loại lượt khám (Khám mới, Tái khám hoặc Đợt cấp / Nhập viện).';
        renderModal();
        return;
      }
      try {
        const created = await api.createVisit(m.patientId, {
          visitDate: fromDatetimeLocal(dtLocal),
          visitType: vt,
          chiefComplaint: cc
        });
        closeModal();
        toast('Đã tạo lượt khám ' + created.visitCode + '.', 'success');
        navigate('#/visits/' + created.id, true);
      } catch (err) {
        m.error = (err && err.detail) || 'Không thể tạo lượt khám mới.';
        renderModal();
      }
      return;
    }
    if (action === 'save-draft') {
      await saveEncounterDraft();
      return;
    }
    if (action === 'go-review') {
      const visitId = state.encounter.visitId;
      const generation = state.encounter.loadGeneration;
      if (state.encounter.dirty) {
        const ok = await saveEncounterDraft();
        if (!ok || state.encounter.dirty) return;
      }
      if (state.encounter.visitId !== visitId || state.encounter.loadGeneration !== generation) return;
      navigate('#/visits/' + state.encounter.visitId + '/review', true);
      return;
    }
    if (action === 'discard-and-leave' && state.modal && state.modal.type === 'unsaved-guard') {
      const destination = state.modal;
      state.encounter.dirty = false;
      closeModal();
      leaveGuardedRoute(destination);
      return;
    }
    if (action === 'save-and-leave' && state.modal && state.modal.type === 'unsaved-guard') {
      const destination = state.modal;
      closeModal();
      const ok = await saveEncounterDraft();
      if (ok && !state.encounter.dirty) leaveGuardedRoute(destination);
      else if (ok) openModal(destination);
      return;
    }
    if (action === 'confirm-visit' && state.review.visit) {
      const rev = state.review;
      const noteEl = document.getElementById('confirm-note-input');
      rev.confirmNote = noteEl ? noteEl.value.trim() : rev.confirmNote;
      rev.confirming = true;
      rev.confirmError = '';
      render();
      try {
        const confirmedVisit = await api.confirmVisit(rev.visit.id, { rowVersion: rev.visit.rowVersion, confirmNote: rev.confirmNote || null }, rev.visit.rowVersion);
        syncCachedPatientVisitStatus(confirmedVisit);
        toast('Đã xác nhận dữ liệu lượt khám thành công.', 'success');
        await loadReview(rev.visit.id);
      } catch (err) {
        rev.confirmError = (err && err.detail) || 'Không thể xác nhận lượt khám.';
        if (err && (err.status === 401 || err.status === 403)) handleAuthOrError(err, rev.confirmError);
        else toast(rev.confirmError, 'error');
      } finally {
        rev.confirming = false;
        if (state.screen === 'review' && state.review.visitId === rev.visitId) render();
      }
      return;
    }
    if (action === 'toggle-review-summary') {
      const nextExpanded = !getReviewSummaryExpanded();
      setReviewSummaryExpanded(nextExpanded);
      render();
      return;
    }
    if (action === 'toggle-ai-quality-group') {
      const grp = target.getAttribute('data-ai-quality-group');
      if (grp === 'actionable' || grp === 'system') {
        if (!state.review.aiQualityExpanded) {
          state.review.aiQualityExpanded = { actionable: false, system: false };
        }
        state.review.aiQualityExpanded[grp] = !state.review.aiQualityExpanded[grp];
        render();
      }
      return;
    }
    if (action === 'scroll-to-ai-readiness') {
      const aiSec = document.getElementById('review-ai-readiness');
      if (aiSec && typeof aiSec.scrollIntoView === 'function') {
        aiSec.scrollIntoView({ behavior: 'smooth', block: 'start' });
        if (aiSec.classList) {
          aiSec.classList.remove('field--highlight');
          try { void aiSec.offsetWidth; } catch (_e) {}
          aiSec.classList.add('field--highlight');
          setTimeout(function () { aiSec.classList.remove('field--highlight'); }, 2000);
        }
      }
      return;
    }
    if ((action === 'export-ai-json-v1' || action === 'export-ai-json-diagnostic') && state.review.visit) {
      const rev = state.review;
      const v = rev.visit;
      const isDiag = action === 'export-ai-json-diagnostic';
      rev.aiExportLoading = true;
      rev.aiExportError = '';
      render();
      try {
        const res = await api.getVisitAiInputV1(v.id, isDiag ? { diagnostic: true } : {});
        rev.aiExportV1 = res;
        rev.aiExportQuality = (res && res.quality) || null;
        rev.aiQualityExpanded = { actionable: false, system: false };
        rev.aiExportIsDiagnostic = isDiag;
        const isReady = Boolean(rev.aiExportQuality && rev.aiExportQuality.status === 'ready');
        const fname = 'hf-ai-input-' + String(v.visitCode || v.id).replace(/[^a-zA-Z0-9_-]/g, '_') + '-r' + (v.currentRevisionNo || 1) + (isDiag ? '-diagnostic' : '') + '.json';
        triggerJsonDownload(fname, res);
        toast(isReady ? 'Đã xuất và tải xuống tệp JSON sẵn sàng gửi AI.' : 'Đã tải xuống tệp JSON chẩn đoán (trạng thái blocked — không dùng gửi AI).', isReady ? 'success' : 'warn');
      } catch (err) {
        const q = (err && (err.quality || (err.problem && err.problem.quality))) || null;
        rev.aiExportV1 = null;
        rev.aiExportIsDiagnostic = false;
        rev.aiExportQuality = q;
        rev.aiQualityExpanded = { actionable: false, system: false };
        if (err && err.status === 422 && q) {
          rev.aiExportError = err.detail || 'Dữ liệu chưa sẵn sàng xuất cho AI (blocked).';
          toast('Chưa thể xuất gói gửi AI — kiểm tra các mục bị chặn bên dưới.', 'warn');
        } else if (err && (err.status === 501 || err.code === 'AI_EXPORT_STATIC_UNSUPPORTED')) {
          rev.aiExportError = err.detail || 'Chế độ demo tĩnh không hỗ trợ xuất JSON cho AI; dùng bản có máy chủ.';
          toast(rev.aiExportError, 'warn');
        } else if (err && err.status === 503) {
          rev.aiExportError = err.detail || 'Máy chủ chưa cấu hình khóa ẩn danh HMAC (HF_AI_HMAC_SECRET / HF_AI_KEY_VERSION).';
          toast(rev.aiExportError, 'error');
        } else if (err && err.status === 409) {
          rev.aiExportError = err.detail || 'Lượt khám chưa được xác nhận nên chưa thể xuất JSON cho AI.';
          toast(rev.aiExportError, 'warn');
        } else if (err && err.status === 404) {
          rev.aiExportError = NOT_FOUND_OR_NO_ACCESS_MSG;
          toast(NOT_FOUND_OR_NO_ACCESS_MSG, 'error');
        } else {
          rev.aiExportError = (err && err.detail) || 'Không thể xuất gói JSON cho AI.';
          handleAuthOrError(err, rev.aiExportError);
        }
      } finally {
        rev.aiExportLoading = false;
        if (state.screen === 'review' && state.review.visitId === rev.visitId) render();
      }
      return;
    }
    if (action === 'download-ai-json-v1' && state.review.aiExportV1 && state.review.visit) {
      const v = state.review.visit;
      const fname = 'hf-ai-input-' + String(v.visitCode || v.id).replace(/[^a-zA-Z0-9_-]/g, '_') + '-r' + (v.currentRevisionNo || 1) + (state.review.aiExportIsDiagnostic ? '-diagnostic' : '') + '.json';
      triggerJsonDownload(fname, state.review.aiExportV1);
      toast('Đã tải xuống tệp ' + fname, 'success');
      return;
    }
    if (action === 'copy-ai-json-v1' && state.review.aiExportV1) {
      try {
        await navigator.clipboard.writeText(JSON.stringify(state.review.aiExportV1, null, 2));
        toast('Đã sao chép JSON hf-ai-input/1.0 vào bộ nhớ tạm.', 'success');
      } catch (_e) {
        toast('Trình duyệt không cho phép sao chép tự động.', 'warn');
      }
      return;
    }
    if (action === 'load-ai-payload' && state.review.visit) {
      try {
        state.review.aiInputPayload = await api.getVisitAiInput(state.review.visit.id);
        state.review.showAiPayload = true;
        render();
      } catch (err) {
        handleAuthOrError(err, 'Không thể xuất gói dữ liệu chuẩn AiInputPayload.');
      }
      return;
    }
    if (action === 'copy-ai-payload' && state.review.aiInputPayload) {
      try {
        await navigator.clipboard.writeText(JSON.stringify(state.review.aiInputPayload, null, 2));
        toast('Đã sao chép JSON AiInputPayload vào bộ nhớ tạm.', 'success');
      } catch (_e) {
        toast('Trình duyệt không cho phép sao chép tự động.', 'warn');
      }
      return;
    }
    if (action === 'open-create-revision') {
      const v = state.screen === 'review' ? state.review.visit : state.encounter.visit;
      if (v) {
        openModal({ type: 'create-revision', visitId: v.id, rowVersion: v.rowVersion, reason: '', error: '' });
      }
      return;
    }
    if (action === 'submit-create-revision' && state.modal && state.modal.type === 'create-revision') {
      const m = state.modal;
      const reason = ((document.getElementById('mr-reason') || {}).value || '').trim();
      m.reason = reason;
      try {
        await api.createVisitRevision(m.visitId, { rowVersion: m.rowVersion, changeReason: reason }, m.rowVersion);
        const currentVisit = state.review.visit && state.review.visit.id === m.visitId ? state.review.visit : state.encounter.visit;
        if (currentVisit) syncCachedPatientVisitStatus(Object.assign({}, currentVisit, { status: 'draft' }));
        closeModal();
        toast('Đã mở bản sửa mới, giữ nguyên lịch sử xác nhận trước đó.', 'success');
        navigate('#/visits/' + m.visitId, true);
      } catch (err) {
        m.error = (err && err.detail) || 'Không thể tạo bản sửa mới.';
        renderModal();
      }
      return;
    }

    // M6 Admin Users modal handlers
    if (action === 'open-create-user') {
      openModal({
        type: 'admin-user-form',
        userId: null,
        step: 1,
        data: { username: '', fullName: '', role: 'doctor', isActive: true, reason: '' },
        preview: null,
        error: ''
      });
      return;
    }
    if (action === 'admin-user-preview-step' && state.modal && state.modal.type === 'admin-user-form') {
      const m = state.modal;
      const uEl = document.getElementById('mu-username');
      if (uEl && !m.userId) m.data.username = uEl.value.trim();
      m.data.fullName = ((document.getElementById('mu-fullname') || {}).value || '').trim();
      m.data.role = (document.getElementById('mu-role') || {}).value || 'doctor';
      m.data.reason = ((document.getElementById('mu-reason') || {}).value || '').trim();
      if (!m.data.username || !m.data.fullName || m.data.reason.length < 3) {
        m.error = 'Vui lòng nhập đầy đủ Tên đăng nhập, Họ tên và Lý do (tối thiểu 3 ký tự).';
        renderModal();
        return;
      }
      m.error = '';
      try {
        m.preview = await api.previewUserPermissions({ role: m.data.role, targetUserId: m.userId || null });
        m.step = 2;
        renderModal();
      } catch (err) {
        m.error = (err && err.detail) || 'Không thể xem trước phạm vi quyền.';
        renderModal();
      }
      return;
    }
    if (action === 'admin-user-back-step' && state.modal && state.modal.type === 'admin-user-form') {
      state.modal.step = 1;
      state.modal.error = '';
      renderModal();
      return;
    }
    if (action === 'admin-user-confirm-save' && state.modal && state.modal.type === 'admin-user-form') {
      const m = state.modal;
      try {
        if (m.userId) {
          await api.updateUser(m.userId, {
            rowVersion: m.rowVersion,
            fullName: m.data.fullName,
            role: m.data.role,
            reason: m.data.reason
          }, m.rowVersion);
          closeModal();
          toast('Đã cập nhật tài khoản và ghi nhận nhật ký hệ thống.', 'success');
          await loadAdminUsers();
        } else {
          const created = await api.createUser({
            username: m.data.username,
            fullName: m.data.fullName,
            role: m.data.role,
            isActive: true,
            reason: m.data.reason
          });
          await loadAdminUsers();
          openModal({
            type: 'setup-code',
            title: 'Đã tạo tài khoản ' + created.user.username,
            username: created.user.username,
            code: created.oneTimeSetupCode
          });
        }
      } catch (err) {
        m.error = (err && err.detail) || 'Không thể lưu tài khoản.';
        renderModal();
      }
      return;
    }
    if (action === 'submit-admin-user-action' && state.modal && state.modal.type === 'admin-user-action') {
      const m = state.modal;
      const reason = ((document.getElementById('mua-reason') || {}).value || '').trim();
      m.reason = reason;
      try {
        const payload = { rowVersion: m.user.rowVersion || 1, reason: reason };
        if (m.kind === 'toggle-lock') payload.isActive = !m.user.isActive;
        if (m.kind === 'reset-pw') payload.resetPassword = true;
        const res = await api.updateUser(m.user.id, payload, m.user.rowVersion || 1);
        await loadAdminUsers();
        if (res && res.oneTimeSetupCode) {
          openModal({
            type: 'setup-code',
            title: 'Đã đặt lại mật khẩu cho ' + m.user.username,
            username: m.user.username,
            code: res.oneTimeSetupCode
          });
        } else {
          closeModal();
          toast('Đã cập nhật trạng thái tài khoản ' + m.user.username + '.', 'success');
        }
      } catch (err) {
        m.error = (err && err.detail) || 'Thao tác không thành công.';
        renderModal();
      }
      return;
    }

    // M7 Admin Forms actions
    if (action === 'continue-form-draft') {
      const draftId = target.getAttribute('data-draft-id');
      if (draftId) {
        state.adminForms.activeTab = 'editor';
        await selectAdminFormVersion(draftId);
      }
      return;
    }
    if (action === 'create-form-draft' && state.adminForms.template && state.adminForms.versionDetail) {
      try {
        const baseVer = state.adminForms.versionDetail.formVersion;
        const created = await api.createFormVersionDraft(state.adminForms.template.id, {
          basedOnVersionId: baseVer.id,
          changeNote: 'Bản nháp tạo từ ' + baseVer.versionLabel
        });
        toast('Đã tạo bản nháp ' + created.versionLabel + '.', 'success');
        state.adminForms.activeTab = 'editor';
        await loadAdminForms(created.id);
      } catch (err) {
        handleAuthOrError(err, 'Không thể tạo bản nháp biểu mẫu.');
      }
      return;
    }
    if (action === 'cancel-form-draft-edits' && state.adminForms.versionDetail) {
      const af = state.adminForms;
      const fv = af.versionDetail.formVersion;
      if (af.draftDirty) {
        openModal({ type: 'discard-form-draft', versionLabel: fv.versionLabel });
      } else {
        af.draftSections = clone(af.versionDetail.sections || []);
        af.draftDirty = false;
        render();
      }
      return;
    }
    if (action === 'do-discard-form-draft' && state.adminForms.versionDetail) {
      const af = state.adminForms;
      af.draftSections = clone(af.versionDetail.sections || []);
      af.draftDirty = false;
      af.previewData = null;
      af.previewError = '';
      closeModal();
      toast('Đã hủy các chỉnh sửa chưa lưu trên bản nháp.', 'info');
      render();
      return;
    }
    if (action === 'confirm-delete-form-draft' && state.adminForms.versionDetail) {
      const fv = state.adminForms.versionDetail.formVersion;
      if (fv.status !== 'draft') {
        toast('Chỉ có thể xóa phiên bản ở trạng thái Bản nháp.', 'warn');
        return;
      }
      openModal({ type: 'delete-form-draft', versionId: fv.id, versionLabel: fv.versionLabel, rowVersion: fv.rowVersion, error: '' });
      return;
    }
    if (action === 'do-delete-form-draft' && state.modal && state.modal.type === 'delete-form-draft') {
      const m = state.modal;
      try {
        await api.deleteFormVersionDraft(m.versionId, m.rowVersion);
        closeModal();
        state.adminForms.selectedVersionId = null;
        state.adminForms.versionDetail = null;
        state.adminForms.draftDirty = false;
        toast('Đã xóa bản nháp ' + m.versionLabel + '.', 'success');
        await loadAdminForms();
      } catch (err) {
        m.error = (err && err.detail) || 'Không thể xóa bản nháp biểu mẫu.';
        renderModal();
      }
      return;
    }
    if (action === 'save-form-draft' && state.adminForms.versionDetail) {
      const af = state.adminForms;
      const fv = af.versionDetail.formVersion;
      try {
        const updated = await api.updateFormVersion(fv.id, {
          rowVersion: fv.rowVersion,
          changeNote: fv.changeNote,
          sections: af.draftSections
        }, fv.rowVersion);
        af.versionDetail = updated;
        af.draftSections = clone(updated.sections || []);
        af.draftDirty = false;
        toast('Đã lưu bản nháp ' + updated.formVersion.versionLabel + '.', 'success');
        await loadAdminForms(fv.id);
      } catch (err) {
        handleAuthOrError(err, 'Không thể lưu bản nháp biểu mẫu.');
      }
      return;
    }
    if (action === 'publish-form-version' && state.adminForms.versionDetail) {
      const af = state.adminForms;
      const fv = af.versionDetail.formVersion;
      const noteEl = document.getElementById('publish-note-input');
      af.publishNote = noteEl ? noteEl.value.trim() : af.publishNote;
      try {
        if (af.draftDirty) {
          const saved = await api.updateFormVersion(fv.id, { rowVersion: fv.rowVersion, sections: af.draftSections }, fv.rowVersion);
          af.versionDetail = saved;
          af.draftDirty = false;
        }
        const curVer = af.versionDetail.formVersion;
        await api.publishFormVersion(curVer.id, { rowVersion: curVer.rowVersion, changeNote: af.publishNote || curVer.changeNote }, curVer.rowVersion);
        af.publishNote = '';
        toast('Đã phát hành phiên bản ' + curVer.versionLabel + ' cho các lượt khám mới.', 'success');
        await loadAdminForms(curVer.id);
      } catch (err) {
        handleAuthOrError(err, 'Không thể phát hành phiên bản biểu mẫu.');
      }
      return;
    }

  });

  // Live Input / Change listeners
  document.addEventListener('input', function (ev) {
    const t = ev.target;
    if (!t) return;

    if (t.id === 'login-username') { state.login.username = t.value; return; }
    if (t.id === 'login-password') { state.login.password = t.value; return; }

    if (t.id === 'patient-search') {
      state.patients.q = t.value;
      scheduleLiveSearch('patients', t);
      return;
    }
    if (t.id === 'enc-field-search') {
      state.encounter.fieldSearch = t.value;
      render();
      const restored = document.getElementById('enc-field-search');
      if (restored) { restored.focus(); restored.setSelectionRange(t.value.length, t.value.length); }
      return;
    }
    if (t.id === 'confirm-note-input') { state.review.confirmNote = t.value; return; }
    if (t.id === 'publish-note-input') { state.adminForms.publishNote = t.value; return; }

    // ---- Form v1.2 Live Inputs (never re-render numeric inputs while typing!) ----
    const v12NumCode = t.getAttribute('data-v12-num');
    if (v12NumCode) {
      const scope = t.getAttribute('data-v12-scope') || 'enc';
      const isPrev = scope === 'prev';
      const unit = v12NumCode === 'bien_thien_can_nang_7ngay' ? 'kg' : (v12NumCode === 'e_over_a_ratio' ? 'ratio' : (v12NumCode === 'egfr_ckd_epi' ? 'mL/min/1.73m2' : null));
      const compact = t.value === '' ? null : { value_state: 'answered', value: Number(t.value) };
      if (compact && unit) compact.unit = unit;
      const errMsg = compact ? validateV12CompactField(v12NumCode, compact) : '';
      if (!compact && !isPrev && state.encounter.savedUnknownCodes[v12NumCode] && state.encounter.unlockedUnknownCodes[v12NumCode]) {
        // D7: Left blank while unlocked from saved unknown -> preserve saved unknown value
        delete state.encounter.fieldErrors[v12NumCode];
      } else {
        encApplyV12Answer(scope, v12NumCode, compact);
        if (!isPrev) {
          if (errMsg) state.encounter.fieldErrors[v12NumCode] = errMsg;
          else delete state.encounter.fieldErrors[v12NumCode];
        }
      }
      refreshNumericInput(t);
      t.classList.toggle('input--error', Boolean(errMsg));
      const fBox = t.closest('.field');
      if (fBox) {
        let errEl = fBox.querySelector('.field__error');
        if (errMsg) {
          if (!errEl) { errEl = document.createElement('p'); errEl.className = 'field__error'; fBox.appendChild(errEl); }
          errEl.innerHTML = ICONS.alert + ' ' + esc(errMsg);
        } else if (errEl) {
          errEl.remove();
        }
      }
      return;
    }

    const v12StructNum = t.getAttribute('data-v12-struct-num');
    if (v12StructNum) {
      const scope = t.getAttribute('data-v12-scope') || 'enc';
      const isPrev = scope === 'prev';
      const code = t.getAttribute('data-v12-code');
      const maker = code === 'ecg_12_chuyen_dao' ? makeDefaultEcgValue : makeDefaultXrayValue;
      const cur = encReadV12Answer(scope, code);
      const obj = (cur && cur.value_state === 'answered' && cur.value && typeof cur.value === 'object') ? clone(cur.value) : maker();
      obj[v12StructNum] = t.value === '' ? null : Number(t.value);
      const compact = { value_state: 'answered', value: obj };
      if (cur && cur.measuredAt) compact.measuredAt = cur.measuredAt;
      const errMsg = validateV12CompactField(code, compact);
      encApplyV12Answer(scope, code, compact);
      if (!isPrev) {
        if (errMsg) state.encounter.fieldErrors[code] = errMsg;
        else delete state.encounter.fieldErrors[code];
      }
      t.classList.remove('input--unknown');
      t.classList.toggle('input--error', Boolean(errMsg));
      const fBox = t.closest('.v12-field');
      if (fBox) {
        let errEl = fBox.querySelector('.field__error');
        if (errMsg) {
          if (!errEl) { errEl = document.createElement('p'); errEl.className = 'field__error'; fBox.appendChild(errEl); }
          errEl.innerHTML = ICONS.alert + ' ' + esc(errMsg);
        } else if (errEl) {
          errEl.remove();
        }
      }
      return;
    }

    if (t.hasAttribute('data-v12-struct-measured-at')) {
      const scope = t.getAttribute('data-v12-scope') || 'enc';
      const code = t.getAttribute('data-v12-code');
      const iso = t.value ? fromDatetimeLocal(t.value) : null;
      const cur = encReadV12Answer(scope, code);
      if (cur && cur.value_state === 'answered' && cur.value && typeof cur.value === 'object') {
        const nextAns = clone(cur);
        if (iso) nextAns.measuredAt = iso;
        else delete nextAns.measuredAt;
        encApplyV12Answer(scope, code, nextAns);
      }
      return;
    }

    const v12WPrevScope = t.getAttribute('data-v12-wprev');
    if (v12WPrevScope) {
      if (v12WPrevScope === 'prev') state.adminForms.previewWeightPrev7d = t.value;
      else state.encounter.weightPrev7d = t.value;
      encRefreshWeightCalcPreview(v12WPrevScope, t.closest('.v12-calc-box'));
      return;
    }

    const v12AtypScope = t.getAttribute('data-v12-atypical-note');
    if (v12AtypScope) {
      if (v12AtypScope === 'prev') state.adminForms.previewAtypicalNote = t.value;
      else state.encounter.atypicalNote = t.value;
      return;
    }

    // ---- Encounter v1.2 Timed Labs & Structured Lists Live Inputs ----
    const encLabNum = t.getAttribute('data-enc-v12lab-num');
    if (encLabNum) {
      const enc = state.encounter;
      const fd = enc.defByCode[encLabNum];
      if (!fd) return;
      const unit = WF_CONTRACT_UNITS[encLabNum] || t.getAttribute('data-enc-v12lab-unit') || fd.canonicalUnit || null;
      const prevAns = visitValueToCompact(encLabNum, enc.valuesByDefId[fd.id], fd);
      const pendingMat = enc.pendingMeasuredAt && enc.pendingMeasuredAt[encLabNum];
      const existingMat = (prevAns && prevAns.measuredAt) || pendingMat || null;
      if (t.value === '') {
        if (enc.savedUnknownCodes[encLabNum] && enc.unlockedUnknownCodes[encLabNum]) {
          // D7: preserve saved unknown when unlocked input stays blank
          delete enc.fieldErrors[encLabNum];
        } else {
          encApplyV12Answer('enc', encLabNum, null);
        }
      } else {
        const entry = { value_state: 'answered', value: Number(t.value) };
        if (unit) entry.unit = unit;
        if (existingMat) entry.measuredAt = existingMat;
        if (enc.pendingMeasuredAt) delete enc.pendingMeasuredAt[encLabNum];
        encApplyV12Answer('enc', encLabNum, entry);
        const matEl = document.getElementById('enc-mat-' + encLabNum);
        if (matEl) matEl.classList.toggle('input--error', !entry.measuredAt);
      }
      refreshNumericInput(t);
      return;
    }

    if (t.hasAttribute('data-enc-v12lab-time')) {
      encApplyTimedLabMeasuredAt(t);
      return;
    }

    if (t.hasAttribute('data-enc-v12list-item')) {
      encUpdateV12ListItem(t, false);
      return;
    }

    const wfM4ReasonId = t.getAttribute('data-wf-m4-reason');
    if (wfM4ReasonId) {
      const cur = state.workflow.m4Decisions[wfM4ReasonId] || { quyet_dinh: '', ly_do: '', error: '' };
      cur.ly_do = t.value;
      cur.error = '';
      state.workflow.m4Decisions[wfM4ReasonId] = cur;
      t.classList.remove('input--error');
      return;
    }

    if (t.hasAttribute('data-wf-manual-reason')) {
      state.workflow.manualReason = t.value;
      if (t.value.trim().length > 0) {
        state.workflow.manualReasonError = '';
        t.classList.remove('input--error');
      }
      return;
    }

    const wfManPath = t.getAttribute('data-wf-man');
    if (wfManPath && state.workflow.manualDraft) {
      const segs = wfManPath.split('.');
      let obj = state.workflow.manualDraft;
      for (let i = 0; i < segs.length - 1; i++) {
        if (!obj[segs[i]] || typeof obj[segs[i]] !== 'object') obj[segs[i]] = {};
        obj = obj[segs[i]];
      }
      const last = segs[segs.length - 1];
      obj[last] = t.value === '' ? null : t.value;
      return;
    }

    // F4: Manual override multiline arrays, M3 followups, and M4 alert editors
    const wfManLines = t.getAttribute('data-wf-man-lines');
    if (wfManLines && state.workflow.manualDraft) {
      state.workflow.manualDraft[wfManLines] = String(t.value || '').split(/\r?\n/).map(function (s) { return s.trim(); }).filter(Boolean);
      return;
    }
    const wfManFollow = t.getAttribute('data-wf-man-followup');
    if (wfManFollow && state.workflow.manualDraft && Array.isArray(state.workflow.manualDraft.ke_hoach_theo_doi)) {
      const parts = wfManFollow.split(':');
      const fIdx = Number(parts[0]);
      let row = state.workflow.manualDraft.ke_hoach_theo_doi[fIdx];
      if (typeof row === 'string') {
        row = { hang_muc: row, thoi_diem: '', ly_do: '' };
        state.workflow.manualDraft.ke_hoach_theo_doi[fIdx] = row;
      }
      if (row && typeof row === 'object') row[parts[1]] = t.value;
      return;
    }
    const wfManM4Al = t.getAttribute('data-wf-man-m4-alert');
    if (wfManM4Al && state.workflow.manualDraft && Array.isArray(state.workflow.manualDraft.canh_bao)) {
      const parts = wfManM4Al.split(':');
      const row = state.workflow.manualDraft.canh_bao[Number(parts[0])];
      if (row) row[parts[1]] = t.value;
      return;
    }

    const wfRxField = t.getAttribute('data-wf-rx-field');
    if (wfRxField && state.workflow.selectedPrescription) {
      const parts = wfRxField.split(':');
      const row = state.workflow.selectedPrescription.items[Number(parts[0])];
      if (row) {
        const k = parts[1];
        row[k] = (k === 'dose' || k === 'timesPerDay') ? (t.value === '' ? null : Number(t.value)) : t.value;
        if (k === 'display' && !row.ingredientCode) row.ingredientCode = String(t.value || '').trim().toLowerCase().replace(/\s+/g, '_');
      }
      return;
    }

    if (t.id === 'admin-user-search') { state.adminUsers.q = t.value; scheduleLiveSearch('users', t); return; }
    if (t.id === 'admin-care-search') { state.adminCare.q = t.value; scheduleLiveSearch('adminCare', t); return; }
    if (t.id === 'audit-q') { state.adminAudit.q = t.value; scheduleLiveSearch('audit', t); return; }
    if (t.id === 'admin-form-field-search') {
      const snap = captureInputFocus(t);
      state.adminForms.fieldSearch = t.value;
      renderPreservingEditorScroll();
      restoreInputFocus(snap);
      return;
    }

    // Visit metadata fields (infoSource, clinicalNote) for Encounter & Preview
    const vmKey = t.getAttribute('data-enc-visit-meta');
    if (vmKey) {
      state.encounter[vmKey] = t.value;
      markEncounterDirty();
      return;
    }
    const prevVmKey = t.getAttribute('data-prev-visit-meta');
    if (prevVmKey) {
      if (prevVmKey === 'infoSource') state.adminForms.previewInfoSource = t.value;
      else if (prevVmKey === 'clinicalNote') state.adminForms.previewClinicalNote = t.value;
      return;
    }

    // Numeric field (Encounter / Preview)
    const numId = t.getAttribute('data-enc-num') || t.getAttribute('data-prev-num');
    if (numId) {
      const isPrev = t.hasAttribute('data-prev-num');
      const ft = getFormTarget(isPrev);
      const fd = ft.defById[numId];
      if (!fd) return;
      if (t.value === '') {
        if (!isPrev && state.encounter.savedUnknownCodes[fd.code] && state.encounter.unlockedUnknownCodes[fd.code]) {
          // D7: keep saved unknown intact when unlocked field left blank
        } else {
          delete ft.valuesByDefId[fd.id];
          if (fd.code === 'mach') ft.setAutoPulseSourceIndex(null);
          ft.markDirty();
        }
      } else {
        if (!isPrev) delete state.encounter.unlockedUnknownCodes[fd.code];
        const item = makeEmptyVisitValue(ft.visitId, fd, 'answered');
        item.valueNum = Number(t.value);
        item.unit = fd.canonicalUnit || null;
        ft.valuesByDefId[fd.id] = item;
        if (fd.code === 'mach') ft.setAutoPulseSourceIndex(null);
        ft.markDirty();
      }
      // Do not rebuild number inputs while typing: replacement resets the native
      // caret for number fields and reverses subsequent digits/backspaces.
      refreshNumericInput(t);
      if (fd.code === 'chieu_cao_cm' || fd.code === 'can_nang_kg') refreshLiveBmi(ft);
      if (fd.code === 'can_nang_kg') {
        if (isPrev && state.adminForms.previewWeightCalcOpen) encRefreshWeightCalcPreview('prev');
        if (!isPrev && state.encounter.weightCalcOpen) encRefreshWeightCalcPreview('enc');
      }
      return;
    }

    // Text / Date field
    const txtId = t.getAttribute('data-enc-text') || t.getAttribute('data-prev-text');
    if (txtId) {
      const isPrev = t.hasAttribute('data-prev-text');
      const ft = getFormTarget(isPrev);
      const fd = ft.defById[txtId];
      if (!fd) return;
      if (t.value === '') {
        if (!isPrev && state.encounter.savedUnknownCodes[fd.code] && state.encounter.unlockedUnknownCodes[fd.code]) {
          // D7: keep saved unknown intact when unlocked field left blank
        } else {
          delete ft.valuesByDefId[fd.id];
          ft.markDirty();
        }
      } else {
        if (!isPrev) delete state.encounter.unlockedUnknownCodes[fd.code];
        const item = makeEmptyVisitValue(ft.visitId, fd, 'answered');
        if (fd.dataType === 'date') item.valueDate = t.value;
        else item.valueText = t.value;
        ft.valuesByDefId[fd.id] = item;
        ft.markDirty();
      }
      return;
    }

    // Repeating table inputs (BP / Med / Allergy / Lab)
    const bpAttr = t.getAttribute('data-enc-bp-field') || t.getAttribute('data-prev-bp-field');
    if (bpAttr) {
      const ft = getFormTarget(t.hasAttribute('data-prev-bp-field'));
      const parts = bpAttr.split(':');
      const row = ft.orthostaticBp[Number(parts[0])];
      if (row) {
        const k = parts[1];
        row[k] = k === 'measuredAt' ? fromDatetimeLocal(t.value) : (['systolic', 'diastolic', 'heartRate', 'minuteAfter'].indexOf(k) >= 0 ? (t.value === '' ? null : Number(t.value)) : t.value);
        if (k === 'heartRate') syncHeartRateFromBp(ft, row[k], Number(parts[0]));
        ft.markDirty();
      }
      return;
    }

    const medAttr = t.getAttribute('data-enc-med-field') || t.getAttribute('data-prev-med-field');
    if (medAttr) {
      const ft = getFormTarget(t.hasAttribute('data-prev-med-field'));
      const parts = medAttr.split(':');
      const row = ft.medications[Number(parts[0])];
      if (row) {
        const k = parts[1];
        row[k] = k === 'dose' ? (t.value === '' ? null : Number(t.value)) : t.value;
        ft.markDirty();
        const card = t.closest('.repeat-card');
        if (card) card.classList.toggle('repeat-card--incomplete', !isValidMedRow(row));
      }
      return;
    }

    const algAttr = t.getAttribute('data-enc-allergy-field') || t.getAttribute('data-prev-allergy-field');
    if (algAttr) {
      const ft = getFormTarget(t.hasAttribute('data-prev-allergy-field'));
      const parts = algAttr.split(':');
      const row = ft.allergies[Number(parts[0])];
      if (row) {
        const k = parts[1];
        row[k] = k === 'recordedAt' ? fromDatetimeLocal(t.value) : t.value;
        ft.markDirty();
        const card = t.closest('.repeat-card');
        if (card) card.classList.toggle('repeat-card--incomplete', !isValidAllergyRow(row));
      }
      return;
    }

    const dxAttr = t.getAttribute('data-enc-dx-field') || t.getAttribute('data-prev-dx-field');
    if (dxAttr) {
      const isPrev = t.hasAttribute('data-prev-dx-field');
      const ft = getFormTarget(isPrev);
      const parts = dxAttr.split(':');
      const idx = Number(parts[0]);
      const row = ft.diagnoses[idx];
      if (row) {
        const k = parts[1];
        row[k] = k === 'code' ? t.value.toUpperCase() : t.value;
        ft.markDirty();
        const card = t.closest('.repeat-card');
        if (card) card.classList.toggle('repeat-card--incomplete', !isValidDiagnosisRow(row));
      }
      return;
    }

    const labAttr = t.getAttribute('data-enc-lab-field') || t.getAttribute('data-prev-lab-field');
    if (labAttr) {
      const ft = getFormTarget(t.hasAttribute('data-prev-lab-field'));
      const parts = labAttr.split(':');
      const row = ft.labResults[Number(parts[0])];
      if (row) {
        const k = parts[1];
        row[k] = k === 'measuredAt' ? fromDatetimeLocal(t.value) : (k === 'valueNum' ? (t.value === '' ? null : Number(t.value)) : t.value);
        ft.markDirty();
        const card = t.closest('.repeat-card');
        if (card) {
          const defByCode = {};
          Object.values(ft.defById || {}).forEach(function (fd) { defByCode[fd.code] = fd; });
          card.classList.toggle('repeat-card--incomplete', !isValidLabRow(row, defByCode));
        }
      }
      return;
    }

    // M7 Admin Form property text inputs
    const edProp = t.getAttribute('data-ed-prop');
    if (edProp && (edProp === 'customLabelVi' || edProp === 'customHelpText')) {
      const af = state.adminForms;
      const sec = (af.draftSections || []).find(function (s) { return s.sectionCode === af.selectedSectionCode; });
      const ff = sec && (sec.fields || []).find(function (f) { return f.fieldDefinitionId === af.selectedFieldDefId; });
      if (ff && !ff._virtualSystem) {
        ff[edProp] = t.value;
        af.draftDirty = true;
        if (edProp === 'customLabelVi') {
          const selName = document.querySelector('[data-ed-field="' + CSS.escape(ff.fieldDefinitionId) + '"] .editor-item__name');
          const fd = ((af.versionDetail && af.versionDetail.fieldDefinitions) || []).find(function (d) { return d.id === ff.fieldDefinitionId; });
          if (selName) selName.textContent = getFieldLabel(ff, fd);
        }
        const saveBtn = document.querySelector('[data-action="save-form-draft"]');
        if (saveBtn) saveBtn.disabled = false;
        const cancelBtn = document.querySelector('[data-action="cancel-form-draft-edits"]');
        if (cancelBtn) cancelBtn.disabled = false;
      }
    }
  });

  document.addEventListener('change', async function (ev) {
    const t = ev.target;
    if (!t) return;

    // Patient modal birth mode radio
    if (t.name === 'mf-bmode' && state.modal && state.modal.type === 'patient-form') {
      state.modal.data.fullName = (document.getElementById('mf-fullname') || {}).value || state.modal.data.fullName;
      state.modal.data.sex = (document.getElementById('mf-sex') || {}).value || state.modal.data.sex;
      state.modal.data.externalPatientCode = (document.getElementById('mf-extcode') || {}).value || state.modal.data.externalPatientCode;
      state.modal.data.birthMode = t.value;
      renderModal();
      return;
    }

    // Form v1.2 eGFR formula select & structured ECG/X-ray controls (G2: single-form draft only)
    if (t.hasAttribute('data-v12-egfr-formula')) {
      const scope = t.getAttribute('data-v12-scope') || 'enc';
      const compact = t.value ? { value_state: 'answered', value: t.value } : null;
      encApplyV12Answer(scope, 'egfr_formula', compact);
      return;
    }

    const v12StructSel = t.getAttribute('data-v12-struct-sel');
    if (v12StructSel) {
      const scope = t.getAttribute('data-v12-scope') || 'enc';
      const code = t.getAttribute('data-v12-code');
      const maker = code === 'ecg_12_chuyen_dao' ? makeDefaultEcgValue : makeDefaultXrayValue;
      const cur = encReadV12Answer(scope, code);
      const obj = (cur && cur.value_state === 'answered' && cur.value && typeof cur.value === 'object') ? clone(cur.value) : maker();
      obj[v12StructSel] = t.value || 'unknown';
      const compact = { value_state: 'answered', value: obj };
      if (cur && cur.measuredAt) compact.measuredAt = cur.measuredAt;
      encApplyV12Answer(scope, code, compact);
      return;
    }

    if (t.hasAttribute('data-v12-struct-measured-at')) {
      const scope = t.getAttribute('data-v12-scope') || 'enc';
      const code = t.getAttribute('data-v12-code');
      const iso = t.value ? fromDatetimeLocal(t.value) : null;
      const cur = encReadV12Answer(scope, code);
      if (cur && cur.value_state === 'answered' && cur.value && typeof cur.value === 'object') {
        const nextAns = clone(cur);
        if (iso) nextAns.measuredAt = iso;
        else delete nextAns.measuredAt;
        encApplyV12Answer(scope, code, nextAns);
      }
      return;
    }

    if (t.hasAttribute('data-enc-v12lab-time')) {
      encApplyTimedLabMeasuredAt(t);
      return;
    }

    if (t.hasAttribute('data-enc-v12list-item')) {
      encUpdateV12ListItem(t, true);
      return;
    }

    // M2 recentTestEvidence doctorConfirmedReuse checkbox (kept on workflow screen)
    const wfReuseKey = t.getAttribute('data-wf-reuse-test');
    if (wfReuseKey) {
      const wf = state.workflow;
      if (!wf.recentTestEvidence || typeof wf.recentTestEvidence !== 'object') wf.recentTestEvidence = {};
      if (t.checked) {
        wf.recentTestEvidence[wfReuseKey] = {
          id: t.getAttribute('data-wf-reuse-obs') || '',
          fieldCode: t.getAttribute('data-wf-reuse-field') || '',
          measuredAt: t.getAttribute('data-wf-reuse-time') || '',
          doctorConfirmedReuse: true
        };
      } else {
        delete wf.recentTestEvidence[wfReuseKey];
      }
      wf.recentTestEvidenceDirty = true;
      render();
      return;
    }

    const wfManM4Chg = t.getAttribute('data-wf-man-m4-alert');
    if (wfManM4Chg && state.workflow.manualDraft && Array.isArray(state.workflow.manualDraft.canh_bao)) {
      const parts = wfManM4Chg.split(':');
      const row = state.workflow.manualDraft.canh_bao[Number(parts[0])];
      if (row) {
        row[parts[1]] = t.value;
        if (parts[1] === 'muc_do') render();
      }
      return;
    }

    const wfManSelPath = t.getAttribute('data-wf-man');
    if (wfManSelPath && state.workflow.manualDraft) {
      const segs = wfManSelPath.split('.');
      let obj = state.workflow.manualDraft;
      for (let i = 0; i < segs.length - 1; i++) {
        if (!obj[segs[i]] || typeof obj[segs[i]] !== 'object') obj[segs[i]] = {};
        obj = obj[segs[i]];
      }
      const last = segs[segs.length - 1];
      obj[last] = t.value === '' ? null : t.value;
      if (wfManSelPath === 'xac_suat_suy_tim.muc') {
        const found = WF_M1_PROB_LEVELS.find(function (p) { return p.value === t.value; });
        if (found) state.workflow.manualDraft.stage = found.stage;
        render();
      }
      return;
    }

    // BUG-04: Coerce dose and timesPerDay to numbers on change as well as input
    const wfRxSel = t.getAttribute('data-wf-rx-field');
    if (wfRxSel && state.workflow.selectedPrescription) {
      const parts = wfRxSel.split(':');
      const row = state.workflow.selectedPrescription.items[Number(parts[0])];
      if (row) {
        const k = parts[1];
        row[k] = (k === 'dose' || k === 'timesPerDay') ? (t.value === '' ? null : Number(t.value)) : t.value;
      }
      return;
    }

    // Single choice select
    const selId = t.getAttribute('data-enc-select') || t.getAttribute('data-prev-select');
    if (selId) {
      const isPrev = t.hasAttribute('data-prev-select');
      const ft = getFormTarget(isPrev);
      const fd = ft.defById[selId];
      if (!fd) return;
      if (!t.value) {
        if (!isPrev && state.encounter.savedUnknownCodes[fd.code] && state.encounter.unlockedUnknownCodes[fd.code]) {
          // D7: preserve saved unknown when unlocked select stays blank
        } else {
          delete ft.valuesByDefId[fd.id];
          ft.markDirty();
        }
      } else {
        if (!isPrev) delete state.encounter.unlockedUnknownCodes[fd.code];
        const item = makeEmptyVisitValue(ft.visitId, fd, 'answered');
        item.fieldOptionId = t.value;
        ft.valuesByDefId[fd.id] = item;
        ft.markDirty();
      }
      t.classList.toggle('input--unfilled', !t.value);
      return;
    }

    // Multi choice checkbox
    const multiId = t.getAttribute('data-enc-multi') || t.getAttribute('data-prev-multi');
    if (multiId) {
      const isPrev = t.hasAttribute('data-prev-multi');
      const ft = getFormTarget(isPrev);
      const fd = ft.defById[multiId];
      if (!fd) return;
      const cur = ft.valuesByDefId[fd.id];
      let opts = (cur && cur.valueState === 'answered' && Array.isArray(cur.selectedOptions)) ? clone(cur.selectedOptions) : [];
      if (t.checked) {
        if (!isPrev) delete state.encounter.unlockedUnknownCodes[fd.code];
        if (!opts.some(function (o) { return o.fieldOptionId === t.value; })) {
          opts.push({ visitId: ft.visitId, fieldDefinitionId: fd.id, fieldOptionId: t.value });
        }
      } else {
        opts = opts.filter(function (o) { return o.fieldOptionId !== t.value; });
      }
      if (opts.length === 0) {
        if (!isPrev && state.encounter.savedUnknownCodes[fd.code] && state.encounter.unlockedUnknownCodes[fd.code]) {
          // D7: preserve saved unknown
        } else {
          delete ft.valuesByDefId[fd.id];
          ft.markDirty();
        }
      } else {
        const item = makeEmptyVisitValue(ft.visitId, fd, 'answered');
        item.selectedOptions = opts;
        ft.valuesByDefId[fd.id] = item;
        ft.markDirty();
      }
      const choices = t.closest('.multi-choice-box');
      if (choices) choices.classList.toggle('multi-choice-box--unfilled', opts.length === 0);
      return;
    }

    // Diagnosis role/code change enforces at most 1 primary ICD and updates format feedback
    const dxAttr = t.getAttribute('data-enc-dx-field') || t.getAttribute('data-prev-dx-field');
    if (dxAttr) {
      const isPrev = t.hasAttribute('data-prev-dx-field');
      const ft = getFormTarget(isPrev);
      const parts = dxAttr.split(':');
      const idx = Number(parts[0]);
      const k = parts[1];
      const row = ft.diagnoses[idx];
      if (row) {
        if (k === 'role') {
          const nextRole = t.value === 'primary' ? 'primary' : 'secondary';
          if (nextRole === 'primary') {
            ft.diagnoses.forEach(function (d, i) {
              if (i !== idx && d && d.role === 'primary') d.role = 'secondary';
            });
          }
          row.role = nextRole;
          ft.markDirty();
          render();
        } else if (k === 'code') {
          row.code = String(t.value || '').trim().toUpperCase();
          ft.markDirty();
          render();
        }
      }
      return;
    }

    // Lab code change updates default unit & re-renders numeric vs text input
    const labAttr = t.getAttribute('data-enc-lab-field') || t.getAttribute('data-prev-lab-field');
    if (labAttr && labAttr.endsWith(':labCode')) {
      const isPrev = t.hasAttribute('data-prev-lab-field');
      const ft = getFormTarget(isPrev);
      const idx = Number(labAttr.split(':')[0]);
      const row = ft.labResults[idx];
      if (row) {
        row.labCode = t.value;
        const fd = Object.values(ft.defById).find(function (x) { return x.code === t.value; });
        row.unit = fd && fd.canonicalUnit ? fd.canonicalUnit : null;
        ft.markDirty();
        render();
      }
      return;
    }

    // Med status or medicationGroup change updates active count card / required indicator
    const medAttr = t.getAttribute('data-enc-med-field') || t.getAttribute('data-prev-med-field');
    if (medAttr && (medAttr.endsWith(':status') || medAttr.endsWith(':medicationGroup'))) {
      render();
      return;
    }

    // M6 filters
    if (t.id === 'admin-user-role-filter') { state.adminUsers.role = t.value; await loadAdminUsers(); return; }
    if (t.id === 'admin-user-active-filter') { state.adminUsers.isActive = t.value; await loadAdminUsers(); return; }

    // M7 Form property checkboxes
    const edProp = t.getAttribute('data-ed-prop');
    if (edProp && (edProp === 'isVisible' || edProp === 'requiredForConfirm')) {
      const af = state.adminForms;
      const sec = (af.draftSections || []).find(function (s) { return s.sectionCode === af.selectedSectionCode; });
      const ff = sec && (sec.fields || []).find(function (f) { return f.fieldDefinitionId === af.selectedFieldDefId; });
      if (ff && !ff._virtualSystem) {
        const fd = ((af.versionDetail && af.versionDetail.fieldDefinitions) || []).find(function (d) { return d.id === ff.fieldDefinitionId; });
        const flags = getFieldMetaFlags(ff, fd);
        if (edProp === 'requiredForConfirm' && (flags.computed || flags.readonlyInput)) return;
        ff[edProp] = Boolean(t.checked);
        af.draftDirty = true;
        render();
      }
      return;
    }

    // M7 Diff base version selector
    if (t.id === 'diff-base-select') {
      const af = state.adminForms;
      af.diffBaseVersionId = t.value;
      af.diffData = await api.diffFormVersion(af.selectedVersionId, af.diffBaseVersionId);
      render();
      return;
    }

    // M8 Audit filters
    if (t.id === 'audit-action') { state.adminAudit.action = t.value; await loadAdminAudit(); return; }
    if (t.id === 'audit-entity') { state.adminAudit.entityType = t.value; await loadAdminAudit(); return; }
    if (t.id === 'audit-from') { state.adminAudit.fromDate = t.value; await loadAdminAudit(); return; }
    if (t.id === 'audit-to') { state.adminAudit.toDate = t.value; await loadAdminAudit(); return; }
  });

  // A4-fix #2 / A5: Prevent mouse wheel from accidentally changing focused number inputs in encounter form & workflow
  document.addEventListener('wheel', function (ev) {
    const active = document.activeElement;
    if (!active || active.tagName !== 'INPUT' || active.type !== 'number') return;
    const inClinical = state.screen === 'workflow' || state.screen === 'encounter' || Boolean(active.closest && active.closest('.wf-stage-card, .v12-field, .clinical-section'));
    if (!inClinical) return;
    if (ev.target === active || (active.contains && active.contains(ev.target))) {
      active.blur();
    }
  }, { passive: true, capture: true });

  document.addEventListener('pointerdown', function (ev) {
    if (!ev.target.closest('#account-menu, [data-action="toggle-account-menu"]')) closeAccountMenu(false);
  });
  document.addEventListener('focusin', function (ev) {
    if (!ev.target.closest('#account-menu, [data-action="toggle-account-menu"]')) closeAccountMenu(false);
  });
  global.addEventListener('resize', function () {
    const menu = document.getElementById('account-menu');
    closeAccountMenu(Boolean(menu && menu.contains(document.activeElement)));
  });
  document.addEventListener('scroll', function (ev) {
    const menu = document.getElementById('account-menu');
    if (ev.target === document && accountMenuScroll && global.scrollX === accountMenuScroll.x && global.scrollY === accountMenuScroll.y) return;
    if (menu && !menu.contains(ev.target)) closeAccountMenu(menu.contains(document.activeElement));
  }, { capture: true, passive: true });

  global.matchMedia('(max-width: 1024px)').addEventListener('change', function (ev) {
    const active = document.activeElement;
    const inNavigation = active && active.closest('.mobile-topbar, .mobile-drawer, .sidebar, .topbar__sidebar-btn');
    setMobileMenuOpen(false);
    if (inNavigation) {
      const button = document.querySelector(ev.matches ? '[data-action="toggle-mobile-menu"]' : '[data-action="toggle-sidebar"]');
      if (button) button.focus();
    }
  });

  // Keyboard shortcuts (/, Ctrl+S, Escape, Alt+ArrowUp/Down)
  document.addEventListener('keydown', function (ev) {
    const accountTrigger = ev.target.closest('[data-action="toggle-account-menu"]');
    const accountMenu = document.getElementById('account-menu');
    if (accountTrigger && (ev.key === 'ArrowDown' || ev.key === 'ArrowUp')) {
      ev.preventDefault();
      openAccountMenu(accountTrigger, ev.key === 'ArrowUp');
      return;
    }
    if (accountMenu && !accountMenu.hidden && accountMenu.contains(ev.target)) {
      const items = Array.from(accountMenu.querySelectorAll('[role="menuitem"]'));
      const index = items.indexOf(document.activeElement);
      if (['ArrowDown', 'ArrowUp', 'Home', 'End'].indexOf(ev.key) >= 0) {
        ev.preventDefault();
        const next = ev.key === 'Home' ? 0 : ev.key === 'End' ? items.length - 1 : (index + (ev.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
        items[next].focus();
        return;
      }
      if (ev.key === 'Escape') { ev.preventDefault(); closeAccountMenu(true); return; }
      if (ev.key === 'Tab') closeAccountMenu(true);
    }
    if (state.modal && state.modal.type === 'change-password') {
      if (ev.key === 'Escape') { ev.preventDefault(); closeModal(); }
      if (ev.key === 'Tab') {
        const controls = Array.from(document.querySelectorAll('#change-password-form input:not(:disabled), #change-password-form button:not(:disabled)'));
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (!first) ev.preventDefault();
        else if (ev.shiftKey && document.activeElement === first) { ev.preventDefault(); last.focus(); }
        else if (!ev.shiftKey && document.activeElement === last) { ev.preventDefault(); first.focus(); }
      }
      return;
    }
    if (ev.key === 'Escape' && state.modal) {
      closeModal();
      return;
    }
    if (ev.key === 'Escape' && state.mobileMenuOpen) {
      setMobileMenuOpen(false);
      const button = document.querySelector('[data-action="toggle-mobile-menu"]');
      if (button) button.focus();
      return;
    }
    if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 's' && state.screen === 'encounter') {
      ev.preventDefault();
      saveEncounterDraft();
      return;
    }
    if (ev.key === '/' && state.screen === 'encounter' && !/INPUT|TEXTAREA|SELECT/.test((document.activeElement || {}).tagName || '')) {
      const sEl = document.getElementById('enc-field-search');
      if (sEl) { ev.preventDefault(); sEl.focus(); }
      return;
    }
    if (ev.altKey && (ev.key === 'ArrowUp' || ev.key === 'ArrowDown') && state.screen === 'admin-forms' && state.adminForms.activeTab === 'editor') {
      const af = state.adminForms;
      const sec = (af.draftSections || []).find(function (s) { return s.sectionCode === af.selectedSectionCode; });
      if (sec && sec.fields) {
        const idx = sec.fields.findIndex(function (f) { return f.fieldDefinitionId === af.selectedFieldDefId; });
        if (idx >= 0) {
          ev.preventDefault();
          moveDraftField(idx, ev.key === 'ArrowUp' ? -1 : 1);
        }
      }
    }
  });

  global.addEventListener('hashchange', onHashChange);
  global.addEventListener('beforeunload', function (ev) {
    if (state.screen !== 'encounter' || !state.encounter.dirty) return;
    ev.preventDefault();
    ev.returnValue = '';
  });

  /* ------------------------------------------------------------------------
     Boot
     ------------------------------------------------------------------------ */
  async function boot() {
    if (api.hasStoredToken()) {
      try {
        state.user = await api.getCurrentUser();
      } catch (_e) {
        state.user = null;
      }
    }
    await handleRoute();
  }

  boot();
})(typeof window !== 'undefined' ? window : globalThis);
