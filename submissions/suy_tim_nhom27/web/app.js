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
    download: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>'
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
    cls_xquang_thoi_diem: 'Thời điểm X-quang ngực'
  };

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

  function toast(msg, kind) {
    const region = document.getElementById('toast-region');
    if (!region) return;
    const el = document.createElement('div');
    el.className = 'toast' + (kind ? ' toast--' + kind : '');
    el.textContent = msg;
    region.appendChild(el);
    setTimeout(function () {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 3600);
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
      defById: {},
      defByCode: {},
      valuesByDefId: {}, // { fieldDefinitionId: VisitValue }
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

    // Enforce K8 role separation on routes
    if (head === 'login' || head === '') {
      const target = role === 'admin' ? '#/admin/users' : '#/patients';
      global.location.hash = target;
      return;
    }

    if ((head === 'patients' || head === 'visits') && role !== 'doctor') {
      state.screen = 'forbidden';
      state.forbiddenReason = 'Tài khoản Quản trị viên (admin) không có quyền truy cập hồ sơ bệnh nhân hoặc dữ liệu lượt khám lâm sàng theo nguyên tắc tách quyền K8.';
      // Also trigger audit log denial on backend/runtime
      try { await api.listPatients({}); } catch (_ignored) {}
      render();
      return;
    }

    if (head === 'admin' && role !== 'admin') {
      state.screen = 'forbidden';
      state.forbiddenReason = 'Tài khoản Bác sĩ không có quyền truy cập phân hệ Quản trị tài khoản, Biểu mẫu hay Nhật ký hệ thống.';
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

  async function loadEncounter(visitId) {
    const enc = state.encounter;
    const generation = ++enc.loadGeneration;
    enc.visitId = visitId;
    enc.access = null;
    enc.savePromise = null;
    enc.saveQueued = false;
    enc.saving = false;
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
      enc.defById = {};
      enc.defByCode = {};
      (formRes.fieldDefinitions || []).forEach(function (fd) {
        enc.defById[fd.id] = fd;
        enc.defByCode[fd.code] = fd;
      });
      enc.valuesByDefId = {};
      (detail.values || []).forEach(function (v) {
        enc.valuesByDefId[v.fieldDefinitionId] = clone(v);
      });
      enc.orthostaticBp = clone(detail.orthostaticBp || []);
      enc.medications = clone(detail.medications || []);
      enc.allergies = clone(detail.allergies || []);
      enc.labResults = clone(detail.labResults || []);
      enc.diagnoses = clone(detail.diagnoses || []);
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
        const code = enc.highlightFieldCode;
        enc.highlightFieldCode = null;
        setTimeout(function () { scrollToAndPulseField(code); }, 80);
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
    const collapsed = Boolean(state.sidebarCollapsed);
    const navItems = isAdmin
      ? [
          { id: 'admin-accounts', hash: '#/admin/users', label: 'Tài khoản & Quyền', icon: ICONS.users },
          { id: 'admin-care', hash: '#/admin/care', label: 'Phân công bác sĩ', icon: ICONS.shield },
          { id: 'admin-forms', hash: '#/admin/forms', label: 'Biểu mẫu & Phiên bản', icon: ICONS.layers },
          { id: 'admin-audit', hash: '#/admin/audit', label: 'Nhật ký hệ thống', icon: ICONS.list }
        ]
      : [
          { id: 'patients', hash: '#/patients', label: 'Bệnh nhân của tôi', icon: ICONS.fileText }
        ];

    const navHtml = navItems.map(function (item) {
      const active = state.screen === item.id || (!isAdmin && ['profile', 'encounter', 'review'].indexOf(state.screen) >= 0 && item.id === 'patients');
      return '<button type="button" class="nav-item' + (active ? ' is-active' : '') + '" data-nav="' + item.hash + '" title="' + esc(item.label) + '">' + item.icon + '<span class="nav-item__label">' + esc(item.label) + '</span></button>';
    }).join('');

    const roleLabel = isAdmin ? 'Quản trị viên' : 'Bác sĩ lâm sàng';

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
    if (/\b(TL0[1-9]|Q-AI-\d+|Q-PM-\d+|CR-W\d+-\d+|STT\s*\d+|visit_[a-z_]+|field_definition|value_state|bảng\s+patient|NULL|G1\s+\d{1,2}\/\d{1,2}\/\d{4})\b/i.test(s)) {
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
    const showListStates = Boolean(ctx.supportsListStates || isV11Bundle(ctx.formVersion, allSections, ctx.defById));
    const bundleHasVisitNotes = hasVisitNotesPlacements(allSections, ctx.defById);

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

      // List-state system fields (medication_list_state, allergy_list_state, diagnosis_list_state)
      if (flags.isListStateField) {
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
          '<div class="bmi-card" data-field-code="luot_tuoi">' +
            '<div class="bmi-card__label"><span>' + esc(label) + '</span><span class="badge badge--blue badge--xs">Tự tính</span></div>' +
            '<div class="bmi-card__value">' + (age !== null ? esc(age) + ' tuổi' : 'Chưa ghi nhận') + '</div>' +
            '<div class="bmi-card__note">' + esc(customHelp || (ctx.patient ? formatBirthPrecision(ctx.patient) : 'Lấy từ hồ sơ hành chính')) + '</div>' +
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
          '<div class="bmi-card" data-field-code="bn_gioi_tinh">' +
            '<div class="bmi-card__label"><span>' + esc(label) + '</span><span class="badge badge--info badge--xs">Trường hệ thống</span></div>' +
            '<div class="bmi-card__value bmi-card__value--sm">' + esc(ctx.patient ? formatSex(ctx.patient.sex) : 'Chưa ghi nhận') + '</div>' +
            '<div class="bmi-card__note">' + esc(customHelp || 'Đồng bộ từ hồ sơ hành chính bệnh nhân.') + '</div>' +
          '</div>'
        );
      }

      if (fd.code === 'so_luong_thuoc_dong_thoi') {
        const allMeds = ctx.medications || [];
        const validActiveCount = allMeds.filter(function (m) { return isValidMedRow(m) && m.status === 'active'; }).length;
        const validTotalCount = allMeds.filter(isValidMedRow).length;
        const valLabel = validTotalCount === 0
          ? (ctx.medicationListState === 'none' ? '0 thuốc (đã xác nhận không dùng)' : 'Chưa ghi nhận thuốc')
          : (validActiveCount + ' thuốc đang dùng');
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

      // Tri-state boolean (Chưa điền vs Chưa rõ vs Có vs Không)
      if (fd.dataType === 'boolean') {
        let effectiveVal = val;
        if (!effectiveVal && fd.code === 'di_ung_thuoc_can_quang' && fd.storageLevel === 'allergy') {
          if ((ctx.allergies || []).some(function (a) { return a && a.agentCategory === 'contrast_media'; })) {
            effectiveVal = { valueState: 'answered', valueBool: true };
          }
        }
        const curState = !effectiveVal ? 'unfilled' : (effectiveVal.valueState === 'unknown' ? 'unknown' : (effectiveVal.valueBool ? 'yes' : 'no'));
        const statusText = curState === 'unfilled' ? 'Chưa điền' : (curState === 'unknown' ? 'Chưa rõ' : (curState === 'yes' ? 'Có' : 'Không'));
        return (
          '<div class="tristate' + (curState === 'unfilled' ? ' tristate--unfilled' : '') + (errMsg ? ' tristate--error' : '') + '" data-field-code="' + esc(fd.code) + '">' +
            '<div class="tristate__head">' +
              '<span class="field__label">' + esc(label) + ' ' + reqTag + '</span>' +
              '<span class="tristate__status">' + esc(statusText) + (curState !== 'unfilled' && !isReadonly ? ' · <button type="button" class="tristate__clear" data-' + prefix + 'tristate="' + esc(fd.id) + '" data-val="clear">Xóa chọn</button>' : '') + '</span>' +
            '</div>' +
            '<div class="tristate__group" role="group" aria-label="' + esc(label) + '">' +
              '<button type="button" class="tristate__btn' + (curState === 'unknown' ? ' is-unknown' : '') + '" data-' + prefix + 'tristate="' + esc(fd.id) + '" data-val="unknown"' + (isReadonly ? ' disabled' : '') + '>Chưa rõ</button>' +
              '<button type="button" class="tristate__btn' + (curState === 'yes' ? ' is-yes' : '') + '" data-' + prefix + 'tristate="' + esc(fd.id) + '" data-val="yes"' + (isReadonly ? ' disabled' : '') + '>Có</button>' +
              '<button type="button" class="tristate__btn' + (curState === 'no' ? ' is-no' : '') + '" data-' + prefix + 'tristate="' + esc(fd.id) + '" data-val="no"' + (isReadonly ? ' disabled' : '') + '>Không</button>' +
            '</div>' +
            (helpText ? '<p class="field__help">' + esc(helpText) + '</p>' : '') +
            (errMsg ? '<p class="field__error">' + ICONS.alert + ' ' + esc(errMsg) + '</p>' : '') +
          '</div>'
        );
      }

      // Numeric / Integer
      if (fd.dataType === 'number' || fd.dataType === 'integer') {
        const isUnknown = val && val.valueState === 'unknown';
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
          '<div class="field" data-field-code="' + esc(fd.code) + '">' +
            '<div class="field__label-row"><label class="field__label">' + esc(label) + ' ' + reqTag + '</label></div>' +
            '<div class="input-row-unknown">' +
              (fd.canonicalUnit ? ('<div class="input-unit-wrap">' + inputEl + '<span class="input-unit-wrap__unit">' + esc(fd.canonicalUnit) + '</span></div>') : inputEl) +
              '<button type="button" class="unknown-toggle' + (isUnknown ? ' is-active' : '') + '" data-' + prefix + 'toggle-unknown="' + esc(fd.id) + '"' + (isReadonly ? ' disabled' : '') + '>Chưa rõ</button>' +
            '</div>' +
            (isZero ? '<span class="zero-chip">Đã nhập: 0 (khác với để trống)</span>' : '') +
            (helpText ? '<p class="field__help">' + esc(helpText) + '</p>' : '') +
            (errMsg ? '<p class="field__error">' + ICONS.alert + ' ' + esc(errMsg) + '</p>' : '') +
          '</div>'
        );
      }

      // Single Choice
      if (fd.dataType === 'single_choice') {
        const isUnknown = val && val.valueState === 'unknown';
        const selId = val && val.valueState === 'answered' ? (val.fieldOptionId || '') : '';
        const cls = 'select' + (!val ? ' input--unfilled' : '') + (isUnknown ? ' input--unknown' : '') + (errMsg ? ' input--error' : '');
        const activeOpts = (fd.options || []).filter(function (o) { return o.isActive !== false; });
        const opts = '<option value="">-- Chưa chọn --</option>' + activeOpts.map(function (o) {
          return '<option value="' + esc(o.id) + '"' + (selId === o.id ? ' selected' : '') + '>' + esc(o.labelVi) + '</option>';
        }).join('');
        return (
          '<div class="field" data-field-code="' + esc(fd.code) + '">' +
            '<div class="field__label-row"><label class="field__label">' + esc(label) + ' ' + reqTag + '</label></div>' +
            '<div class="input-row-unknown">' +
              '<select class="' + cls + '" data-' + prefix + 'select="' + esc(fd.id) + '"' + (isReadonly || isUnknown ? ' disabled' : '') + '>' + opts + '</select>' +
              '<button type="button" class="unknown-toggle' + (isUnknown ? ' is-active' : '') + '" data-' + prefix + 'toggle-unknown="' + esc(fd.id) + '"' + (isReadonly ? ' disabled' : '') + '>Chưa rõ</button>' +
            '</div>' +
            (helpText ? '<p class="field__help">' + esc(helpText) + '</p>' : '') +
            (errMsg ? '<p class="field__error">' + ICONS.alert + ' ' + esc(errMsg) + '</p>' : '') +
          '</div>'
        );
      }

      // Multi Choice
      if (fd.dataType === 'multi_choice') {
        const isUnknown = val && val.valueState === 'unknown';
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
          '<div class="field" data-field-code="' + esc(fd.code) + '">' +
            '<div class="field__label-row"><span class="field__label">' + esc(label) + ' ' + reqTag + '</span><button type="button" class="unknown-toggle unknown-toggle--sm' + (isUnknown ? ' is-active' : '') + '" data-' + prefix + 'toggle-unknown="' + esc(fd.id) + '"' + (isReadonly ? ' disabled' : '') + '>Chưa rõ</button></div>' +
            '<div class="multi-choice-box' + (!val ? ' multi-choice-box--unfilled' : '') + '">' + checks + '</div>' +
            (helpText ? '<p class="field__help">' + esc(helpText) + '</p>' : '') +
            (errMsg ? '<p class="field__error">' + ICONS.alert + ' ' + esc(errMsg) + '</p>' : '') +
          '</div>'
        );
      }

      // Text / Date
      const isUnknown = val && val.valueState === 'unknown';
      const txtVal = val && val.valueState === 'answered' ? (fd.dataType === 'date' ? (val.valueDate || '') : (val.valueText || '')) : '';
      const cls = 'input' + (!val ? ' input--unfilled' : '') + (isUnknown ? ' input--unknown' : '') + (errMsg ? ' input--error' : '');
      const isNoteField = /_ghi_chu$/.test(fd.code);
      return (
        '<div class="field" data-field-code="' + esc(fd.code) + '">' +
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
          let blockHtml = '';
          if (g === 'orthostaticBp') blockHtml = renderOrthostaticBpBlock(visibleByGroup[g] || [], allByGroup[g] || []);
          else if (g === 'medications') blockHtml = renderMedicationsBlock(visibleByGroup[g] || []);
          else if (g === 'allergies') blockHtml = renderAllergiesBlock(visibleByGroup[g] || []);
          else if (g === 'diagnoses') blockHtml = renderDiagnosesBlock(visibleByGroup[g] || []);
          else if (g === 'labResults') blockHtml = renderLabsBlock(visibleByGroup[g] || []);
          if (blockHtml) chunks.push(blockHtml);
          return;
        }

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
      if (section.sectionCode === 'ghi_chu' && !bundleHasVisitNotes) {
        const showNotes = filter === 'all' || (filter === 'unfilled' && (!ctx.infoSource || !ctx.clinicalNote));
        const matchQ = !q || 'nguồn cung cấp thông tin lâm sàng ghi chú bác sĩ info_source clinical_note'.indexOf(q) >= 0;
        if (showNotes && matchQ) {
          buildVirtualVisitNoteFields(section).forEach(function (vff) {
            pendingScalars.push({ ff: vff, fd: vff._virtualDef, rep: null });
          });
        }
      }

      flushScalars();

      if ((q || filter !== 'all') && chunks.length === 0) {
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
          '<button type="button" class="btn btn--secondary btn--sm" data-nav="#/patients/' + esc(v.patientId) + '">' + ICONS.arrowLeft + ' Về hồ sơ</button>' +
        '</div>' +
      '</div>' +
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
        '<div class="card__header"><div><h2 class="card__title">Đối chiếu độ sẵn sàng dữ liệu cho 4 Module AI (Danh sách dự kiến, chờ nhóm AI xác nhận)</h2><p class="card__subtitle">Chỉ mang tính tham khảo đối chiếu — <strong>không chặn xác nhận lượt khám</strong> và không chạy dự đoán AI trong phạm vi hệ thống thu thập dữ liệu.</p></div></div>' +
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
              '<div class="field"><label class="field__label">Nguồn tham chiếu chuyên môn</label><input class="input" value="' + esc(activeFD.sourceRef || '—') + '" disabled></div>' +
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
    const values = Object.keys(enc.valuesByDefId).map(function (k) { return enc.valuesByDefId[k]; }).filter(function (v) {
      if (!v) return false;
      const fd = enc.defById[v.fieldDefinitionId] || enc.defByCode[v.fieldCode];
      return !fd || fd.storageLevel === 'visit_value';
    });
    const payload = {
      rowVersion: enc.visit.rowVersion,
      clinicalNote: enc.clinicalNote || null,
      infoSource: enc.infoSource || null,
      values: values,
      orthostaticBp: enc.orthostaticBp,
      medications: enc.medications,
      allergies: enc.allergies,
      labResults: enc.labResults
    };
    if (enc.supportsListStates) {
      payload.medicationListState = enc.medicationListState || (enc.medications.length > 0 ? 'known' : 'unknown');
      payload.allergyListState = enc.allergyListState || (enc.allergies.length > 0 ? 'known' : 'unknown');
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
      if (enc.editVersion === version) {
        enc.valuesByDefId = {};
        (res.values || []).forEach(function (v) { enc.valuesByDefId[v.fieldDefinitionId] = clone(v); });
        enc.orthostaticBp = clone(res.orthostaticBp || []);
        enc.medications = clone(res.medications || []);
        enc.allergies = clone(res.allergies || []);
        enc.labResults = clone(res.labResults || []);
        if (res.diagnoses !== undefined) enc.diagnoses = clone(res.diagnoses || []);
        if (res.visit && res.visit.medicationListState !== undefined) enc.medicationListState = res.visit.medicationListState;
        if (res.visit && res.visit.allergyListState !== undefined) enc.allergyListState = res.visit.allergyListState;
        if (res.visit && res.visit.diagnosisListState !== undefined) enc.diagnosisListState = res.visit.diagnosisListState;
        enc.dirty = false;
      }
      enc.revisions = clone(res.revisions || []);
      enc.lastSavedAt = res.visit.updatedAt;
      if (enc.editVersion === version) render();
      toast('Đã lưu nháp lượt khám thành công.', 'success');
      return true;
    } catch (err) {
      if (!isCurrent()) return false;
      if (err && err.status === 422) {
        enc.errorList = err.errors || [];
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
    const canonicalCode = AI_FIELD_CODE_ALIASES[fieldCode] || fieldCode;
    let el = document.querySelector('[data-field-code="' + CSS.escape(fieldCode) + '"]');
    if (!el && canonicalCode !== fieldCode) {
      el = document.querySelector('[data-field-code="' + CSS.escape(canonicalCode) + '"]');
    }
    if (el) return el;
    const repeatBlocks = document.querySelectorAll('[data-repeat-codes]');
    for (let i = 0; i < repeatBlocks.length; i++) {
      const codes = String(repeatBlocks[i].getAttribute('data-repeat-codes') || '').split(',');
      if (codes.indexOf(fieldCode) >= 0 || codes.indexOf(canonicalCode) >= 0) return repeatBlocks[i];
    }
    let repeatGroup = null;
    if (/^thuoc_|medication|co_da_thuoc|so_luong_thuoc/i.test(canonicalCode)) repeatGroup = 'medications';
    else if (/^di_ung_|^diung_|allergy/i.test(canonicalCode)) repeatGroup = 'allergies';
    else if (/^cls_|lab|bnp|ntprobnp/i.test(canonicalCode)) repeatGroup = 'labResults';
    else if (/^icd_|^diagnos/i.test(canonicalCode)) repeatGroup = 'diagnoses';
    else if (/huyet_ap|^ha_/i.test(canonicalCode)) repeatGroup = 'orthostaticBp';
    if (repeatGroup) {
      el = document.querySelector('[data-repeat-group="' + repeatGroup + '"]');
      if (el) return el;
    }
    const secCode = resolveFieldSectionCode(state.encounter.formStructure, canonicalCode);
    if (secCode) {
      el = document.getElementById('enc-sec-' + secCode);
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
      if (state.encounter.fieldSearch || state.encounter.fieldFilter !== 'all') {
        state.encounter.activeSectionCode = encSec;
        state.encounter.fieldSearch = '';
        state.encounter.fieldFilter = 'all';
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

    // Unknown toggle for non-boolean fields
    const unkId = target.getAttribute('data-enc-toggle-unknown') || target.getAttribute('data-prev-toggle-unknown');
    if (unkId) {
      const isPrev = target.hasAttribute('data-prev-toggle-unknown');
      const ft = getFormTarget(isPrev);
      const fd = ft.defById[unkId];
      if (fd) {
        const cur = ft.valuesByDefId[fd.id];
        if (cur && cur.valueState === 'unknown') {
          delete ft.valuesByDefId[fd.id];
        } else {
          ft.valuesByDefId[fd.id] = makeEmptyVisitValue(ft.visitId, fd, 'unknown');
        }
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
        delete ft.valuesByDefId[fd.id];
      } else {
        const item = makeEmptyVisitValue(ft.visitId, fd, 'answered');
        item.valueNum = Number(t.value);
        item.unit = fd.canonicalUnit || null;
        ft.valuesByDefId[fd.id] = item;
      }
      if (fd.code === 'mach') ft.setAutoPulseSourceIndex(null);
      ft.markDirty();
      // Do not rebuild number inputs while typing: replacement resets the native
      // caret for number fields and reverses subsequent digits/backspaces.
      refreshNumericInput(t);
      if (fd.code === 'chieu_cao_cm' || fd.code === 'can_nang_kg') refreshLiveBmi(ft);
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
        delete ft.valuesByDefId[fd.id];
      } else {
        const item = makeEmptyVisitValue(ft.visitId, fd, 'answered');
        if (fd.dataType === 'date') item.valueDate = t.value;
        else item.valueText = t.value;
        ft.valuesByDefId[fd.id] = item;
      }
      ft.markDirty();
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

    // Single choice select
    const selId = t.getAttribute('data-enc-select') || t.getAttribute('data-prev-select');
    if (selId) {
      const isPrev = t.hasAttribute('data-prev-select');
      const ft = getFormTarget(isPrev);
      const fd = ft.defById[selId];
      if (!fd) return;
      if (!t.value) {
        delete ft.valuesByDefId[fd.id];
      } else {
        const item = makeEmptyVisitValue(ft.visitId, fd, 'answered');
        item.fieldOptionId = t.value;
        ft.valuesByDefId[fd.id] = item;
      }
      ft.markDirty();
      t.classList.toggle('input--unfilled', !ft.valuesByDefId[fd.id]);
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
        if (!opts.some(function (o) { return o.fieldOptionId === t.value; })) {
          opts.push({ visitId: ft.visitId, fieldDefinitionId: fd.id, fieldOptionId: t.value });
        }
      } else {
        opts = opts.filter(function (o) { return o.fieldOptionId !== t.value; });
      }
      if (opts.length === 0) {
        delete ft.valuesByDefId[fd.id];
      } else {
        const item = makeEmptyVisitValue(ft.visitId, fd, 'answered');
        item.selectedOptions = opts;
        ft.valuesByDefId[fd.id] = item;
      }
      ft.markDirty();
      const choices = t.closest('.multi-choice-box');
      if (choices) choices.classList.toggle('multi-choice-box--unfilled', !ft.valuesByDefId[fd.id]);
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
