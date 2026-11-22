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
    panelLeft: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/></svg>'
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
      form_version_publish: 'Phát hành phiên bản biểu mẫu',
      patient_create: 'Tạo hồ sơ bệnh nhân',
      visit_confirm: 'Xác nhận lượt khám / Bản sửa'
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
      audit_log: 'Nhật ký hệ thống'
    };
    return map[ent] || ent || '—';
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
      visit_value: 'Trường dữ liệu lượt khám',
      computed: 'Tự tính toán',
      orthostatic_bp: 'Bảng đo huyết áp theo tư thế',
      medication: 'Danh sách thuốc hiện dùng',
      allergy: 'Danh sách dị ứng / ADR',
      lab_result: 'Danh sách kết quả cận lâm sàng'
    };
    return map[lvl] || lvl || '—';
  }

  function formatAiModuleLabel(code) {
    const map = {
      ai_diagnosis: 'Module 1: Hỗ trợ Chẩn đoán Suy tim',
      ai_lab_test: 'Module 2: Hỗ trợ Chỉ định Cận lâm sàng',
      ai_treatment: 'Module 3: Hỗ trợ Định hướng Điều trị',
      ai_medsafety: 'Module 4: Hỗ trợ An toàn Thuốc (MedSafety)'
    };
    return map[code] || code;
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
    profile: { patientId: null, patient: null, latestVisitSummary: null, visits: [], loading: false, error: '' },

    // M4 Encounter
    encounter: {
      visitId: null,
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
      previewValues: {},
      previewBp: [],
      previewAutoPulseSourceIndex: null,
      previewMeds: [],
      previewAllergies: [],
      previewLabs: [],
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

    // Modal state
    modal: null
  };

  // Search results replace the SPA root, so direct reloads used to discard focus
  // after every character. Debounce and ignore stale responses instead.
  const liveSearch = {
    patients: { timer: null, sequence: 0 },
    users: { timer: null, sequence: 0 },
    audit: { timer: null, sequence: 0 }
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
     Offline Runtime Banner (Static Mode Only)
     ------------------------------------------------------------------------ */
  function renderRuntimeBanner() {
    const el = document.getElementById('runtime-banner');
    if (!el) return;
    if (!api.isStatic) {
      el.hidden = true;
      return;
    }
    el.hidden = false;
    el.innerHTML =
      '<div class="runtime-banner__left">' +
        ICONS.shield +
        '<span class="runtime-banner__text">Chế độ ngoại tuyến trên trình duyệt: dữ liệu lưu cục bộ trên máy này</span>' +
      '</div>' +
      '<div class="runtime-banner__links">' +
        '<a class="runtime-banner__link" href="./api/">Tài liệu OpenAPI</a>' +
        '<a class="runtime-banner__link" href="./docs/">Kiến trúc &amp; Sơ đồ</a>' +
        '<button type="button" class="runtime-banner__link" data-action="confirm-reset-local">Đặt lại dữ liệu cục bộ</button>' +
      '</div>';
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
      state.profile.error = (err && err.detail) || 'Không tải được hồ sơ bệnh nhân.';
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
      enc.error = (err && err.detail) || 'Không tải được biểu mẫu lượt khám.';
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
    rev.confirming = false;
    rev.confirmError = '';
    rev.loading = true;
    rev.error = '';
    rev.aiInputPayload = null;
    rev.showAiPayload = false;
    render();
    try {
      const [visitDetail, formRes, reviewRes] = await Promise.all([
        api.getVisit(visitId),
        api.getVisitForm(visitId),
        api.getVisitReview(visitId)
      ]);
      const ptRes = await api.getPatient(visitDetail.visit.patientId);
      rev.visit = visitDetail.visit;
      rev.visitDetail = visitDetail;
      rev.formRes = formRes;
      rev.revisions = visitDetail.revisions || [];
      rev.patient = ptRes.patient;
      rev.formVersion = formRes.formVersion;
      rev.data = reviewRes;
    } catch (err) {
      rev.error = (err && err.detail) || 'Không tải được kết quả rà soát lượt khám.';
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
              '<div class="brand-mark__name">Suytim-CDSS</div>' +
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
          { id: 'admin-forms', hash: '#/admin/forms', label: 'Biểu mẫu & Phiên bản', icon: ICONS.layers },
          { id: 'admin-audit', hash: '#/admin/audit', label: 'Nhật ký hệ thống', icon: ICONS.list }
        ]
      : [
          { id: 'patients', hash: '#/patients', label: 'Hồ sơ bệnh nhân', icon: ICONS.fileText }
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
                  '<div class="brand-mark__name">Suytim-CDSS</div>' +
                  '<div class="brand-mark__sub">Thu thập &amp; Xác nhận Dữ liệu</div>' +
                '</div>' +
              '</div>' +
            '</div>' +
            '<span class="sidebar__role-tag">' + ICONS.shield + ' <span class="sidebar__role-text">' + esc(roleLabel) + '</span></span>' +
            '<nav class="sidebar__nav">' + navHtml + '</nav>' +
          '</div>' +
          '<div class="sidebar__user">' +
            '<div class="user-chip" title="' + esc(u.fullName + ' (' + roleLabel + ')') + '">' +
              '<div class="user-chip__avatar">' + esc(getInitials(u.fullName)) + '</div>' +
              '<div class="user-chip__meta">' +
                '<div class="user-chip__name">' + esc(u.fullName) + '</div>' +
                '<div class="user-chip__role mono">' + esc(u.username) + ' · ' + esc(roleLabel) + '</div>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</aside>' +
        '<div class="main-area">' +
          '<div class="mobile-topbar">' +
            '<div class="brand-mark">' +
              '<div class="brand-mark__icon">' + ICONS.heart + '</div>' +
              '<div><div class="brand-mark__name">Suytim-CDSS</div><div class="brand-mark__sub">' + esc(roleLabel) + '</div></div>' +
            '</div>' +
            '<div class="mobile-topbar__actions">' +
              '<button type="button" class="mobile-menu-btn" data-action="logout" aria-label="Đăng xuất">' + ICONS.logout + '</button>' +
              '<button type="button" class="mobile-menu-btn" data-action="toggle-mobile-menu" aria-expanded="' + (state.mobileMenuOpen ? 'true' : 'false') + '">' + ICONS.menu + ' Menu</button>' +
            '</div>' +
          '</div>' +
          '<div class="mobile-drawer' + (state.mobileMenuOpen ? ' is-open' : '') + '">' +
            '<nav class="sidebar__nav">' + navHtml + '</nav>' +
          '</div>' +
          '<header class="topbar">' +
            '<div class="topbar__left">' +
              '<button type="button" class="icon-btn topbar__sidebar-btn" data-action="toggle-sidebar" title="' + (collapsed ? 'Mở rộng thanh chức năng' : 'Thu gọn thanh chức năng') + '" aria-label="' + (collapsed ? 'Mở rộng thanh chức năng' : 'Thu gọn thanh chức năng') + '" aria-expanded="' + (!collapsed ? 'true' : 'false') + '">' + ICONS.panelLeft + '</button>' +
              '<nav class="breadcrumbs" aria-label="Đường dẫn">' + breadcrumbsHtml + '</nav>' +
            '</div>' +
            '<div class="topbar__right">' +
              '<span class="badge badge--blue topbar__user">' + esc(u.fullName) + '</span>' +
              '<button type="button" class="btn btn--secondary btn--sm topbar__logout" data-action="logout">' + ICONS.logout + '<span>Đăng xuất</span></button>' +
            '</div>' +
          '</header>' +
          '<main class="workspace" id="main-workspace">' + workspaceHtml + '</main>' +
        '</div>' +
      '</div>'
    );
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
      listHtml =
        '<div class="empty-state">' +
          '<h3 class="empty-state__title">Chưa có hồ sơ bệnh nhân nào khớp điều kiện</h3>' +
          '<p class="empty-state__desc">Bắt đầu bằng cách tạo hồ sơ bệnh nhân mới với thông tin hành chính tối thiểu (mã <span class="mono">BN-xxxxx</span> sẽ được hệ thống tự cấp duy nhất).</p>' +
          '<button type="button" class="btn btn--primary" data-action="open-create-patient">' + ICONS.plus + ' Tạo hồ sơ bệnh nhân</button>' +
        '</div>';
    } else {
      const rows = ps.items.map(function (it) {
        const pt = it.patient;
        return (
          '<tr>' +
            '<td><div class="cell-primary mono">' + esc(pt.patientCode) + '</div><div class="cell-sub">' + esc(pt.fullName) + '</div></td>' +
            '<td><div>' + esc(formatSex(pt.sex)) + '</div><div class="cell-sub">' + esc(formatBirthPrecision(pt)) + '</div></td>' +
            '<td>' + (it.visitCount > 0 ? ('<div class="tabular">' + esc(formatDateTime(it.latestVisitDate)) + '</div><div class="cell-sub">' + it.visitCount + ' lượt khám</div>') : '<span class="cell-sub">Chưa ghi nhận</span>') + '</td>' +
            '<td>' + statusBadge(it.latestVisitStatus, it.latestVisitId) + '</td>' +
            '<td style="text-align:right;"><button type="button" class="btn btn--secondary btn--sm" data-nav="#/patients/' + esc(pt.id) + '">Mở hồ sơ ' + ICONS.arrowRight + '</button></td>' +
          '</tr>'
        );
      }).join('');

      const cards = ps.items.map(function (it) {
        const pt = it.patient;
        return (
          '<article class="record-card">' +
            '<div class="record-card__top">' +
              '<div><div class="cell-primary mono">' + esc(pt.patientCode) + '</div><div class="cell-sub">' + esc(pt.fullName) + '</div></div>' +
              statusBadge(it.latestVisitStatus, it.latestVisitId) +
            '</div>' +
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
          '<div class="table-wrap"><table class="data-table"><thead><tr><th>Mã hồ sơ &amp; Tên</th><th>Giới tính &amp; Độ chính xác tuổi</th><th>Lượt khám gần nhất</th><th>Trạng thái</th><th style="text-align:right;">Thao tác</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
        '</div>' +
        '<div class="mobile-cards">' + cards + '</div>';
    }

    const body =
      '<div class="page-head">' +
        '<div><h1 class="page-head__title">Hồ sơ bệnh nhân</h1></div>' +
        '<div class="page-head__actions"><button type="button" class="btn btn--primary" data-action="open-create-patient">' + ICONS.plus + ' Tạo hồ sơ bệnh nhân</button></div>' +
      '</div>' +
      '<div class="toolbar">' +
        '<div class="search-box"><span class="search-box__icon">' + ICONS.search + '</span><input type="search" class="input" id="patient-search" placeholder="Tìm theo mã BN-xxxxx hoặc tên hồ sơ..." value="' + esc(ps.q) + '"></div>' +
        '<div class="filter-pills" role="group" aria-label="Lọc theo trạng thái lượt khám">' + filterBtns + '</div>' +
      '</div>' +
      listHtml;

    return renderShell('<span class="breadcrumbs__current">Hồ sơ bệnh nhân</span>', body);
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
      return renderShell('<button type="button" class="breadcrumbs__link" data-nav="#/patients">Hồ sơ bệnh nhân</button>', '<div class="banner banner--error"><div class="banner__main">' + ICONS.alert + '<div><p class="banner__desc">' + esc(pr.error || 'Không tìm thấy hồ sơ.') + '</p></div></div><button type="button" class="btn btn--secondary btn--sm" data-nav="#/patients">Quay lại danh sách</button></div>');
    }

    const pt = pr.patient;
    const sum = pr.latestVisitSummary;

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
          return (
            '<div class="timeline-item ' + (isConf ? 'timeline-item--confirmed' : 'timeline-item--draft') + '">' +
              '<div class="timeline-item__top">' +
                '<div><div class="cell-primary mono">' + esc(v.visitCode) + '</div><div class="cell-sub tabular">' + esc(formatDateTime(v.visitDate)) + ' · ' + esc(formatVisitType(v.visitType)) + '</div></div>' +
                (isConf ? '<span class="badge badge--success">Đã xác nhận</span>' : '<span class="badge badge--warn">Bản nháp</span>') +
              '</div>' +
              (v.chiefComplaint ? '<div class="cell-sub">' + esc(v.chiefComplaint) + '</div>' : '') +
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
        '<div><h1 class="page-head__title"><span class="mono">' + esc(pt.patientCode) + '</span> · ' + esc(pt.fullName) + '</h1><p class="page-head__sub">Thông tin hành chính và danh sách các lượt khám theo thời gian.</p></div>' +
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
              '<div><div class="kv-item__label">Cập nhật gần nhất</div><div class="kv-item__value tabular">' + esc(formatDateTime(pt.updatedAt)) + '</div></div>' +
            '</div></div>' +
          '</section>' +
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
     Shared Metadata-Driven Clinical Form Renderer (Used by BOTH M4 & M7 Preview!)
     UI-06: Continuous vertical scroll across all 8 sections + left TOC sync
     UI-07: Clean labels, hide technical codes/refs/internal Q-AI notes,
            bring height/weight/BMI into Section 01 (without changing storage!)
     ------------------------------------------------------------------------ */
  function isValidMedRow(m) {
    return Boolean(m && m.drugName && String(m.drugName).trim());
  }

  function isValidAllergyRow(a) {
    return Boolean(a && a.allergen && String(a.allergen).trim());
  }

  function isValidLabRow(l, defByCode) {
    if (!l || !l.labCode) return false;
    const fd = defByCode && defByCode[l.labCode];
    if (fd && (fd.dataType === 'number' || fd.dataType === 'integer')) {
      return l.valueNum !== null && l.valueNum !== undefined && l.valueNum !== '' && !isNaN(Number(l.valueNum));
    }
    return Boolean(l.valueText && String(l.valueText).trim());
  }

  function sanitizeDoctorHelpText(text) {
    if (!text) return '';
    let s = String(text).trim();
    // Hide internal review/source references like (TL01 Bảng 3), (Q-AI-19), (TL06 ...)
    if (/^\s*$/.test(s)) return '';
    if (/\b(TL0[1-6]|Q-AI-\d+|Q-PM-\d+|STT\s*\d+|visit_|field_definition)\b/i.test(s)) {
      return '';
    }
    return '';
  }

  function buildContinuousSections(sections, defById) {
    // UI-07: Surface chieu_cao_cm, can_nang_kg, bmi inside section 01 (hanh_chinh)
    // right alongside age & sex for quick clinical overview, without duplicating them in section 03.
    const movedCodes = { chieu_cao_cm: true, can_nang_kg: true, bmi: true };
    const liftedFields = [];
    (sections || []).forEach(function (sec) {
      if (sec.sectionCode === 'hanh_chinh') return;
      (sec.fields || []).forEach(function (ff) {
        const fd = defById[ff.fieldDefinitionId];
        if (fd && movedCodes[fd.code] && ff.isVisible) {
          liftedFields.push(ff);
        }
      });
    });
    const order = { chieu_cao_cm: 1, can_nang_kg: 2, bmi: 3 };
    liftedFields.sort(function (a, b) {
      const ca = defById[a.fieldDefinitionId] ? defById[a.fieldDefinitionId].code : '';
      const cb = defById[b.fieldDefinitionId] ? defById[b.fieldDefinitionId].code : '';
      return (order[ca] || 9) - (order[cb] || 9);
    });
    return (sections || []).map(function (sec) {
      if (sec.sectionCode === 'hanh_chinh') {
        const existingIds = {};
        (sec.fields || []).forEach(function (ff) { existingIds[ff.fieldDefinitionId] = true; });
        const merged = (sec.fields || []).slice();
        liftedFields.forEach(function (ff) {
          if (!existingIds[ff.fieldDefinitionId]) merged.push(ff);
        });
        return Object.assign({}, sec, { fields: merged });
      }
      const filtered = (sec.fields || []).filter(function (ff) {
        const fd = defById[ff.fieldDefinitionId];
        return !(fd && movedCodes[fd.code]);
      });
      return Object.assign({}, sec, { fields: filtered });
    });
  }

  function renderClinicalSectionForm(ctx) {
    // ctx: { mode: 'encounter'|'preview', readonly, sections, defById, defByCode, valuesByDefId,
    //        orthostaticBp, medications, allergies, labResults, patient, visit,
    //        clinicalNote, infoSource, activeSectionCode, search, filter, fieldErrors }
    const allSections = buildContinuousSections(ctx.sections || [], ctx.defById || {});
    if (allSections.length === 0) return '<p class="field__help">Chưa có nhóm biểu mẫu nào.</p>';

    const q = String(ctx.search || '').trim().toLowerCase();
    const filter = ctx.filter || 'all';
    const ro = Boolean(ctx.readonly);
    const prefix = ctx.mode === 'preview' ? 'prev-' : 'enc-';
    const isPreview = ctx.mode === 'preview';

    function renderSingleField(ff) {
      const fd = ctx.defById[ff.fieldDefinitionId];
      let label = ff.customLabelVi || fd.labelVi;
      if (fd.code === 'chieu_cao_cm') label = 'Chiều cao (lượt khám này)';
      if (fd.code === 'can_nang_kg') label = 'Cân nặng (lượt khám này)';
      const val = ctx.valuesByDefId[fd.id] || null;
      const errMsg = (ctx.fieldErrors && ctx.fieldErrors[fd.code]) || '';
      const isReadonly = ro || ff.isReadonly || fd.isCalculated || fd.storageLevel === 'patient';
      const reqTag = ff.requiredForConfirm ? '<span class="badge badge--warn badge--xs">Bắt buộc</span>' : '';

      // Special computed / patient cards
      if (fd.code === 'bmi') {
        const hDef = Object.values(ctx.defById).find(function (x) { return x.code === 'chieu_cao_cm'; });
        const wDef = Object.values(ctx.defById).find(function (x) { return x.code === 'can_nang_kg'; });
        const hVal = hDef && ctx.valuesByDefId[hDef.id] && ctx.valuesByDefId[hDef.id].valueState === 'answered' ? Number(ctx.valuesByDefId[hDef.id].valueNum) : null;
        const wVal = wDef && ctx.valuesByDefId[wDef.id] && ctx.valuesByDefId[wDef.id].valueState === 'answered' ? Number(ctx.valuesByDefId[wDef.id].valueNum) : null;
        const bmi = computeBmi(hVal, wVal);
        return (
          '<div class="bmi-card" data-field-code="bmi">' +
            '<div class="bmi-card__label">' + esc(label) + '</div>' +
            '<div class="bmi-card__value">' + (bmi !== null ? esc(bmi) + ' kg/m²' : 'Chưa đủ dữ liệu') + '</div>' +
            '<div class="bmi-card__note">Tự tính từ chiều cao và cân nặng của lượt khám này.</div>' +
          '</div>'
        );
      }

      if (fd.code === 'luot_tuoi') {
        const age = ctx.patient ? computeAge(ctx.patient, ctx.visit && ctx.visit.visitDate) : null;
        if (isPreview) {
          return (
            '<div class="bmi-card" data-field-code="luot_tuoi">' +
              '<div class="bmi-card__label">' + esc(label) + '</div>' +
              '<div class="bmi-card__value bmi-card__value--muted">Chưa có dữ liệu</div>' +
              '<div class="bmi-card__note">Lấy theo ngày sinh / năm sinh trong hồ sơ bệnh nhân khi mở lượt khám thật.</div>' +
            '</div>'
          );
        }
        return (
          '<div class="bmi-card" data-field-code="luot_tuoi">' +
            '<div class="bmi-card__label">' + esc(label) + '</div>' +
            '<div class="bmi-card__value">' + (age !== null ? esc(age) + ' tuổi' : 'Chưa ghi nhận') + '</div>' +
            '<div class="bmi-card__note">' + esc(ctx.patient ? formatBirthPrecision(ctx.patient) : 'Lấy từ hồ sơ hành chính') + '</div>' +
          '</div>'
        );
      }

      if (fd.code === 'bn_gioi_tinh') {
        if (isPreview) {
          return (
            '<div class="bmi-card" data-field-code="bn_gioi_tinh">' +
              '<div class="bmi-card__label">' + esc(label) + '</div>' +
              '<div class="bmi-card__value bmi-card__value--muted">Chưa có dữ liệu</div>' +
              '<div class="bmi-card__note">Đồng bộ từ hồ sơ hành chính bệnh nhân.</div>' +
            '</div>'
          );
        }
        return (
          '<div class="bmi-card" data-field-code="bn_gioi_tinh">' +
            '<div class="bmi-card__label">' + esc(label) + '</div>' +
            '<div class="bmi-card__value bmi-card__value--sm">' + esc(ctx.patient ? formatSex(ctx.patient.sex) : 'Chưa ghi nhận') + '</div>' +
            '<div class="bmi-card__note">Đồng bộ từ hồ sơ hành chính bệnh nhân.</div>' +
          '</div>'
        );
      }

      if (fd.code === 'so_luong_thuoc_dong_thoi') {
        const allMeds = ctx.medications || [];
        const validActiveCount = allMeds.filter(function (m) { return isValidMedRow(m) && m.status === 'active'; }).length;
        const validTotalCount = allMeds.filter(isValidMedRow).length;
        const valLabel = validTotalCount === 0 ? 'Chưa ghi nhận thuốc' : (validActiveCount + ' thuốc đang dùng');
        return (
          '<div class="bmi-card" data-field-code="so_luong_thuoc_dong_thoi">' +
            '<div class="bmi-card__label">' + esc(label) + '</div>' +
            '<div class="bmi-card__value bmi-card__value--sm">' + esc(valLabel) + '</div>' +
            '<div class="bmi-card__note">Chỉ đếm bản ghi thuốc đã nhập tên và ở trạng thái Đang dùng.</div>' +
          '</div>'
        );
      }

      if (fd.isCalculated) {
        return (
          '<div class="bmi-card" data-field-code="' + esc(fd.code) + '">' +
            '<div class="bmi-card__label">' + esc(label) + '</div>' +
            '<div class="bmi-card__value bmi-card__value--muted">Tự tính khi có đủ dữ liệu</div>' +
          '</div>'
        );
      }

      // Tri-state boolean (Chưa điền vs Chưa rõ vs Có vs Không)
      if (fd.dataType === 'boolean') {
        const curState = !val ? 'unfilled' : (val.valueState === 'unknown' ? 'unknown' : (val.valueBool ? 'yes' : 'no'));
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
            (isZero ? '<span class="zero-chip">Đã nhập: 0</span>' : '') +
            (errMsg ? '<p class="field__error">' + ICONS.alert + ' ' + esc(errMsg) + '</p>' : '') +
          '</div>'
        );
      }

      // Single Choice
      if (fd.dataType === 'single_choice') {
        const isUnknown = val && val.valueState === 'unknown';
        const selId = val && val.valueState === 'answered' ? (val.fieldOptionId || '') : '';
        const cls = 'select' + (!val ? ' input--unfilled' : '') + (isUnknown ? ' input--unknown' : '') + (errMsg ? ' input--error' : '');
        const opts = '<option value="">-- Chưa chọn --</option>' + (fd.options || []).map(function (o) {
          return '<option value="' + esc(o.id) + '"' + (selId === o.id ? ' selected' : '') + '>' + esc(o.labelVi) + '</option>';
        }).join('');
        return (
          '<div class="field" data-field-code="' + esc(fd.code) + '">' +
            '<div class="field__label-row"><label class="field__label">' + esc(label) + ' ' + reqTag + '</label></div>' +
            '<div class="input-row-unknown">' +
              '<select class="' + cls + '" data-' + prefix + 'select="' + esc(fd.id) + '"' + (isReadonly || isUnknown ? ' disabled' : '') + '>' + opts + '</select>' +
              '<button type="button" class="unknown-toggle' + (isUnknown ? ' is-active' : '') + '" data-' + prefix + 'toggle-unknown="' + esc(fd.id) + '"' + (isReadonly ? ' disabled' : '') + '>Chưa rõ</button>' +
            '</div>' +
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
        const checks = (fd.options || []).map(function (o) {
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
            (errMsg ? '<p class="field__error">' + ICONS.alert + ' ' + esc(errMsg) + '</p>' : '') +
          '</div>'
        );
      }

      // Text / Date
      const isUnknown = val && val.valueState === 'unknown';
      const txtVal = val && val.valueState === 'answered' ? (fd.dataType === 'date' ? (val.valueDate || '') : (val.valueText || '')) : '';
      const cls = 'input' + (!val ? ' input--unfilled' : '') + (isUnknown ? ' input--unknown' : '') + (errMsg ? ' input--error' : '');
      return (
        '<div class="field" data-field-code="' + esc(fd.code) + '">' +
          '<div class="field__label-row"><label class="field__label">' + esc(label) + ' ' + reqTag + '</label></div>' +
          '<div class="input-row-unknown">' +
            '<input type="' + (fd.dataType === 'date' ? 'date' : 'text') + '" class="' + cls + '" data-' + prefix + 'text="' + esc(fd.id) + '" placeholder="' + (isUnknown ? 'Chưa rõ' : 'Nhập thông tin...') + '" value="' + esc(txtVal) + '"' + (isReadonly || isUnknown ? ' disabled' : '') + '>' +
            '<button type="button" class="unknown-toggle' + (isUnknown ? ' is-active' : '') + '" data-' + prefix + 'toggle-unknown="' + esc(fd.id) + '"' + (isReadonly ? ' disabled' : '') + '>Chưa rõ</button>' +
          '</div>' +
          (errMsg ? '<p class="field__error">' + ICONS.alert + ' ' + esc(errMsg) + '</p>' : '') +
        '</div>'
      );
    }

    function renderOneSection(section) {
      const scalarFields = (section.fields || []).filter(function (ff) {
        if (!ff.isVisible) return false;
        const fd = ctx.defById[ff.fieldDefinitionId];
        if (!fd) return false;
        if (['orthostatic_bp', 'medication', 'allergy', 'lab_result'].indexOf(fd.storageLevel) >= 0) {
          return false;
        }
        const label = (ff.customLabelVi || fd.labelVi).toLowerCase();
        if (q && label.indexOf(q) === -1 && fd.code.toLowerCase().indexOf(q) === -1) return false;
        const val = ctx.valuesByDefId[fd.id];
        const errMsg = ctx.fieldErrors && ctx.fieldErrors[fd.code];
        if (filter === 'unfilled' && fd.storageLevel === 'visit_value' && val) return false;
        if (filter === 'error' && !errMsg) return false;
        return true;
      });

      const scalarCards = scalarFields.map(renderSingleField).join('');

      let repeatingHtml = '';
      const showRepeatForFilter = filter === 'all' || (filter === 'unfilled' && !q);

      if (section.sectionCode === 'sinh_ton_kham' && (showRepeatForFilter || !q || 'huyết áp tư thế nhịp tim'.indexOf(q) >= 0)) {
        const bps = ctx.orthostaticBp || [];
        repeatingHtml =
          '<div class="sub-heading">Huyết áp theo tư thế</div>' +
          '<div class="repeat-list">' +
            (bps.length === 0 ? '<p class="field__help">Chưa có lần đo huyết áp nào trong lượt khám này.</p>' : bps.map(function (bp, idx) {
              return (
                '<div class="repeat-card" data-field-code="huyet_ap_tam_thu">' +
                  '<div class="repeat-card__head">' +
                    '<span class="repeat-card__title">Lần đo huyết áp #' + (idx + 1) + '</span>' +
                    (!ro ? '<button type="button" class="btn btn--danger-outline btn--sm" data-' + prefix + 'remove-bp="' + idx + '">' + ICONS.trash + ' Xóa</button>' : '') +
                  '</div>' +
                  '<div class="form-grid-3">' +
                    '<div class="field"><label class="field__label">Tư thế đo</label><select class="select" data-' + prefix + 'bp-field="' + idx + ':position"' + (ro ? ' disabled' : '') + '>' +
                      '<option value="supine"' + (bp.position === 'supine' ? ' selected' : '') + '>Nằm</option>' +
                      '<option value="sitting"' + (bp.position === 'sitting' ? ' selected' : '') + '>Ngồi</option>' +
                      '<option value="standing"' + (bp.position === 'standing' ? ' selected' : '') + '>Đứng</option>' +
                    '</select></div>' +
                    '<div class="field"><label class="field__label">Tâm thu (mmHg)</label><input type="number" class="input" data-' + prefix + 'bp-field="' + idx + ':systolic" value="' + esc(bp.systolic != null ? bp.systolic : '') + '"' + (ro ? ' disabled' : '') + '></div>' +
                    '<div class="field"><label class="field__label">Tâm trương (mmHg)</label><input type="number" class="input" data-' + prefix + 'bp-field="' + idx + ':diastolic" value="' + esc(bp.diastolic != null ? bp.diastolic : '') + '"' + (ro ? ' disabled' : '') + '></div>' +
                    '<div class="field"><label class="field__label">Nhịp tim (lần/phút)</label><input type="number" class="input" data-' + prefix + 'bp-field="' + idx + ':heartRate" value="' + esc(bp.heartRate != null ? bp.heartRate : '') + '"' + (ro ? ' disabled' : '') + '></div>' +
                    '<div class="field"><label class="field__label">Phút sau đổi tư thế</label><input type="number" class="input" data-' + prefix + 'bp-field="' + idx + ':minuteAfter" value="' + esc(bp.minuteAfter != null ? bp.minuteAfter : '') + '"' + (ro ? ' disabled' : '') + '></div>' +
                    '<div class="field"><label class="field__label">Thời điểm đo</label><input type="datetime-local" class="input" data-' + prefix + 'bp-field="' + idx + ':measuredAt" value="' + esc(toDatetimeLocal(bp.measuredAt)) + '"' + (ro ? ' disabled' : '') + '></div>' +
                  '</div>' +
                '</div>'
              );
            }).join('')) +
            (!ro ? '<div><button type="button" class="btn btn--secondary btn--sm" data-' + prefix + 'add-bp="1">' + ICONS.plus + ' Thêm lần đo huyết áp</button></div>' : '') +
          '</div>';
      }

      if (section.sectionCode === 'thuoc_di_ung' && (showRepeatForFilter || !q || 'thuốc dị ứng adr'.indexOf(q) >= 0)) {
        const meds = ctx.medications || [];
        const algs = ctx.allergies || [];
        repeatingHtml =
          '<div class="sub-heading">Thuốc hiện đang sử dụng</div>' +
          '<div class="repeat-list">' +
            (meds.length === 0 ? '<p class="field__help">Chưa ghi nhận thuốc nào trong lượt khám này (không suy thành không dùng thuốc).</p>' : meds.map(function (m, idx) {
              const incomplete = !isValidMedRow(m);
              return (
                '<div class="repeat-card' + (incomplete ? ' repeat-card--incomplete' : '') + '" data-field-code="thuoc_ghi_nhan">' +
                  '<div class="repeat-card__head">' +
                    '<span class="repeat-card__title">Thuốc #' + (idx + 1) + (m.drugName ? ' — ' + esc(m.drugName) : '') + (incomplete ? ' <span class="badge badge--warn badge--xs">Chưa hoàn tất</span>' : '') + '</span>' +
                    (!ro ? '<button type="button" class="btn btn--danger-outline btn--sm" data-' + prefix + 'remove-med="' + idx + '">' + ICONS.trash + ' Xóa</button>' : '') +
                  '</div>' +
                  '<div class="form-grid-3">' +
                    '<div class="field"><label class="field__label">Tên thuốc *</label><input type="text" class="input" data-' + prefix + 'med-field="' + idx + ':drugName" value="' + esc(m.drugName || '') + '" placeholder="VD: Sacubitril/Valsartan"' + (ro ? ' disabled' : '') + '></div>' +
                    '<div class="field"><label class="field__label">Phân nhóm thuốc</label><select class="select" data-' + prefix + 'med-field="' + idx + ':medicationGroup"' + (ro ? ' disabled' : '') + '>' +
                      '<option value=""' + (!m.medicationGroup ? ' selected' : '') + '>-- Chưa chọn --</option>' +
                      '<option value="prescribed"' + (m.medicationGroup === 'prescribed' ? ' selected' : '') + '>Thuốc kê đơn</option>' +
                      '<option value="otc_supplement_tcm"' + (m.medicationGroup === 'otc_supplement_tcm' ? ' selected' : '') + '>Thuốc không kê đơn / TPCN / YHCT</option>' +
                    '</select></div>' +
                    '<div class="field"><label class="field__label">Trạng thái dùng</label><select class="select" data-' + prefix + 'med-field="' + idx + ':status"' + (ro ? ' disabled' : '') + '>' +
                      '<option value=""' + (!m.status ? ' selected' : '') + '>-- Chưa chọn --</option>' +
                      '<option value="active"' + (m.status === 'active' ? ' selected' : '') + '>Đang dùng</option>' +
                      '<option value="stopped"' + (m.status === 'stopped' ? ' selected' : '') + '>Đã ngưng</option>' +
                      '<option value="proposed"' + (m.status === 'proposed' ? ' selected' : '') + '>Dự kiến</option>' +
                    '</select></div>' +
                    '<div class="field"><label class="field__label">Liều dùng</label><input type="number" step="any" class="input" data-' + prefix + 'med-field="' + idx + ':dose" value="' + esc(m.dose != null ? m.dose : '') + '"' + (ro ? ' disabled' : '') + '></div>' +
                    '<div class="field"><label class="field__label">Đơn vị</label><input type="text" class="input" data-' + prefix + 'med-field="' + idx + ':unit" value="' + esc(m.unit || '') + '" placeholder="mg, viên..."' + (ro ? ' disabled' : '') + '></div>' +
                    '<div class="field"><label class="field__label">Tần suất</label><input type="text" class="input" data-' + prefix + 'med-field="' + idx + ':frequency" value="' + esc(m.frequency || '') + '" placeholder="1 lần/ngày"' + (ro ? ' disabled' : '') + '></div>' +
                    '<div class="field"><label class="field__label">Đường dùng</label><select class="select" data-' + prefix + 'med-field="' + idx + ':route"' + (ro ? ' disabled' : '') + '>' +
                      '<option value=""' + (!m.route ? ' selected' : '') + '>-- Chưa chọn --</option>' +
                      '<option value="oral"' + (m.route === 'oral' ? ' selected' : '') + '>Uống</option>' +
                      '<option value="iv"' + (m.route === 'iv' ? ' selected' : '') + '>Tĩnh mạch</option>' +
                      '<option value="subcutaneous"' + (m.route === 'subcutaneous' ? ' selected' : '') + '>Tiêm dưới da</option>' +
                      '<option value="inhaled"' + (m.route === 'inhaled' ? ' selected' : '') + '>Hít / Xịt</option>' +
                      '<option value="other"' + (m.route === 'other' ? ' selected' : '') + '>Khác</option>' +
                    '</select></div>' +
                    '<div class="field"><label class="field__label">Hoạt chất</label><input type="text" class="input" data-' + prefix + 'med-field="' + idx + ':activeIngredient" value="' + esc(m.activeIngredient || '') + '"' + (ro ? ' disabled' : '') + '></div>' +
                    '<div class="field"><label class="field__label">Ngày bắt đầu</label><input type="date" class="input" data-' + prefix + 'med-field="' + idx + ':startedAt" value="' + esc(m.startedAt || '') + '"' + (ro ? ' disabled' : '') + '></div>' +
                  '</div>' +
                '</div>'
              );
            }).join('')) +
            (!ro ? '<div><button type="button" class="btn btn--secondary btn--sm" data-' + prefix + 'add-med="1">' + ICONS.plus + ' Thêm thuốc đang dùng</button></div>' : '') +
          '</div>' +
          '<div class="sub-heading">Tiền sử Dị ứng / Phản ứng có hại thuốc (ADR)</div>' +
          '<div class="repeat-list">' +
            (algs.length === 0 ? '<p class="field__help">Chưa ghi nhận dị ứng hoặc ADR nào (không suy thành không dị ứng).</p>' : algs.map(function (a, idx) {
              const incomplete = !isValidAllergyRow(a);
              return (
                '<div class="repeat-card' + (incomplete ? ' repeat-card--incomplete' : '') + '" data-field-code="di_ung_adr">' +
                  '<div class="repeat-card__head">' +
                    '<span class="repeat-card__title">Dị ứng / ADR #' + (idx + 1) + (a.allergen ? ' — ' + esc(a.allergen) : '') + (incomplete ? ' <span class="badge badge--warn badge--xs">Chưa hoàn tất</span>' : '') + '</span>' +
                    (!ro ? '<button type="button" class="btn btn--danger-outline btn--sm" data-' + prefix + 'remove-allergy="' + idx + '">' + ICONS.trash + ' Xóa</button>' : '') +
                  '</div>' +
                  '<div class="form-grid-3">' +
                    '<div class="field"><label class="field__label">Tác nhân *</label><input type="text" class="input" data-' + prefix + 'allergy-field="' + idx + ':allergen" value="' + esc(a.allergen || '') + '" placeholder="VD: Thuốc cản quang iod, Penicillin"' + (ro ? ' disabled' : '') + '></div>' +
                    '<div class="field"><label class="field__label">Loại phản ứng</label><select class="select" data-' + prefix + 'allergy-field="' + idx + ':kind"' + (ro ? ' disabled' : '') + '>' +
                      '<option value="allergy"' + (a.kind === 'allergy' ? ' selected' : '') + '>Dị ứng</option>' +
                      '<option value="adr"' + (a.kind === 'adr' ? ' selected' : '') + '>Phản ứng có hại (ADR)</option>' +
                      '<option value="intolerance"' + (a.kind === 'intolerance' ? ' selected' : '') + '>Không dung nạp</option>' +
                    '</select></div>' +
                    '<div class="field"><label class="field__label">Nhóm tác nhân</label><select class="select" data-' + prefix + 'allergy-field="' + idx + ':agentCategory"' + (ro ? ' disabled' : '') + '>' +
                      '<option value="therapeutic_drug"' + (a.agentCategory === 'therapeutic_drug' ? ' selected' : '') + '>Thuốc điều trị</option>' +
                      '<option value="contrast_media"' + (a.agentCategory === 'contrast_media' ? ' selected' : '') + '>Thuốc cản quang</option>' +
                      '<option value="other"' + (a.agentCategory === 'other' ? ' selected' : '') + '>Khác</option>' +
                    '</select></div>' +
                    '<div class="field"><label class="field__label">Mức độ</label><select class="select" data-' + prefix + 'allergy-field="' + idx + ':severity"' + (ro ? ' disabled' : '') + '>' +
                      '<option value="unknown"' + (a.severity === 'unknown' ? ' selected' : '') + '>Chưa rõ</option>' +
                      '<option value="mild"' + (a.severity === 'mild' ? ' selected' : '') + '>Nhẹ</option>' +
                      '<option value="moderate"' + (a.severity === 'moderate' ? ' selected' : '') + '>Trung bình</option>' +
                      '<option value="severe"' + (a.severity === 'severe' ? ' selected' : '') + '>Nặng</option>' +
                    '</select></div>' +
                    '<div class="field field--span-2"><label class="field__label">Biểu hiện lâm sàng</label><input type="text" class="input" data-' + prefix + 'allergy-field="' + idx + ':reaction" value="' + esc(a.reaction || '') + '" placeholder="VD: Mày đay, phù mạch, ho khan..."' + (ro ? ' disabled' : '') + '></div>' +
                  '</div>' +
                '</div>'
              );
            }).join('')) +
            (!ro ? '<div><button type="button" class="btn btn--secondary btn--sm" data-' + prefix + 'add-allergy="1">' + ICONS.plus + ' Thêm bản ghi dị ứng / ADR</button></div>' : '') +
          '</div>';
      }

      if (section.sectionCode === 'can_lam_sang' && (showRepeatForFilter || !q || 'cận lâm sàng xét nghiệm bnp creatinin siêu âm ecg'.indexOf(q) >= 0)) {
        const labs = ctx.labResults || [];
        const labDefs = Object.values(ctx.defById).filter(function (fd) {
          return fd.storageLevel === 'lab_result' &&
            ['cls_don_vi', 'cls_thoi_diem', 'cls_ecg_thoi_diem', 'cls_sieu_am_tim_thoi_diem', 'cls_xquang_thoi_diem', 'cls_troponin_loai'].indexOf(fd.code) === -1;
        });
        repeatingHtml =
          '<div class="sub-heading">Kết quả Cận lâm sàng đã có</div>' +
          '<div class="repeat-list">' +
            (labs.length === 0 ? '<p class="field__help">Chưa có kết quả cận lâm sàng nào được ghi nhận trong lượt khám này.</p>' : labs.map(function (lab, idx) {
              const curDef = lab.labCode ? ctx.defByCode[lab.labCode] : null;
              const isNumericLab = curDef && (curDef.dataType === 'number' || curDef.dataType === 'integer');
              const incomplete = !isValidLabRow(lab, ctx.defByCode);
              const optHtml = '<option value="">-- Chọn loại xét nghiệm / thăm dò --</option>' + labDefs.map(function (ld) {
                return '<option value="' + esc(ld.code) + '"' + (ld.code === lab.labCode ? ' selected' : '') + '>' + esc(ld.labelVi) + '</option>';
              }).join('');
              return (
                '<div class="repeat-card' + (incomplete ? ' repeat-card--incomplete' : '') + '" data-field-code="' + esc(lab.labCode || 'can_lam_sang') + '">' +
                  '<div class="repeat-card__head">' +
                    '<span class="repeat-card__title">Cận lâm sàng #' + (idx + 1) + (curDef ? ' — ' + esc(curDef.labelVi) : '') + (incomplete ? ' <span class="badge badge--warn badge--xs">Chưa hoàn tất</span>' : '') + '</span>' +
                    (!ro ? '<button type="button" class="btn btn--danger-outline btn--sm" data-' + prefix + 'remove-lab="' + idx + '">' + ICONS.trash + ' Xóa</button>' : '') +
                  '</div>' +
                  '<div class="form-grid-3">' +
                    '<div class="field"><label class="field__label">Loại xét nghiệm / thăm dò *</label><select class="select" data-' + prefix + 'lab-field="' + idx + ':labCode"' + (ro ? ' disabled' : '') + '>' + optHtml + '</select></div>' +
                    (!curDef
                      ? '<div class="field field--span-2"><label class="field__label">Giá trị kết quả</label><input type="text" class="input" placeholder="Vui lòng chọn loại xét nghiệm trước..." disabled></div>'
                      : (isNumericLab
                        ? ('<div class="field"><label class="field__label">Giá trị số *</label><input type="number" step="any" class="input" data-' + prefix + 'lab-field="' + idx + ':valueNum" value="' + esc(lab.valueNum != null ? lab.valueNum : '') + '"' + (ro ? ' disabled' : '') + '></div>' +
                           '<div class="field"><label class="field__label">Đơn vị</label><input type="text" class="input" data-' + prefix + 'lab-field="' + idx + ':unit" value="' + esc(lab.unit || (curDef && curDef.canonicalUnit) || '') + '"' + (ro ? ' disabled' : '') + '></div>')
                        : ('<div class="field field--span-2"><label class="field__label">Kết quả / Kết luận mô tả *</label><input type="text" class="input" data-' + prefix + 'lab-field="' + idx + ':valueText" value="' + esc(lab.valueText || '') + '" placeholder="Nhập kết quả đọc ECG / X-quang / Siêu âm tim..."' + (ro ? ' disabled' : '') + '></div>'))) +
                    '<div class="field"><label class="field__label">Thời điểm lấy mẫu / thực hiện *</label><input type="datetime-local" class="input" data-' + prefix + 'lab-field="' + idx + ':measuredAt" value="' + esc(lab.measuredAt ? toDatetimeLocal(lab.measuredAt) : '') + '"' + (ro ? ' disabled' : '') + '></div>' +
                    '<div class="field field--span-2"><label class="field__label">Ghi chú nguồn / loại phụ (VD: hs-TnT)</label><input type="text" class="input" data-' + prefix + 'lab-field="' + idx + ':note" value="' + esc(lab.note || '') + '"' + (ro ? ' disabled' : '') + '></div>' +
                  '</div>' +
                '</div>'
              );
            }).join('')) +
            (!ro ? '<div><button type="button" class="btn btn--secondary btn--sm" data-' + prefix + 'add-lab="1">' + ICONS.plus + ' Thêm kết quả cận lâm sàng</button></div>' : '') +
          '</div>';
      }

      let visitNotesHtml = '';
      if (section.sectionCode === 'ghi_chu' && ctx.mode === 'encounter' && (showRepeatForFilter || !q || 'ghi chú nguồn thông tin'.indexOf(q) >= 0)) {
        visitNotesHtml =
          '<div class="sub-heading">Nguồn thông tin &amp; Ghi chú bác sĩ cho lượt khám</div>' +
          '<div class="form-grid-2">' +
            '<div class="field"><label class="field__label" for="enc-info-source">Nguồn cung cấp thông tin lâm sàng</label>' +
              '<input id="enc-info-source" type="text" class="input" data-enc-visit-meta="infoSource" placeholder="Người bệnh / Người nhà / Giấy tờ mang theo" value="' + esc(ctx.infoSource || '') + '"' + (ro ? ' disabled' : '') + '>' +
            '</div>' +
            '<div class="field"><label class="field__label" for="enc-clinical-note">Ghi chú lâm sàng bổ sung của bác sĩ</label>' +
              '<textarea id="enc-clinical-note" class="textarea" data-enc-visit-meta="clinicalNote" placeholder="Ghi nhận bối cảnh đặc biệt hoặc điểm cần lưu ý ở lần tái khám sau..."' + (ro ? ' disabled' : '') + '>' + esc(ctx.clinicalNote || '') + '</textarea>' +
            '</div>' +
          '</div>';
      }

      if ((q || filter !== 'all') && !scalarCards && !repeatingHtml && !visitNotesHtml) {
        return '';
      }

      const secDomId = prefix + 'sec-' + section.sectionCode;
      return (
        '<section class="card clinical-section" id="' + esc(secDomId) + '" data-section-block="' + esc(section.sectionCode) + '">' +
          '<div class="card__header">' +
            '<div><h2 class="card__title">' + String(section.displayOrder).padStart(2, '0') + '. ' + esc(section.titleVi) + '</h2></div>' +
          '</div>' +
          '<div class="card__body">' +
            (repeatingHtml ? repeatingHtml : '') +
            (scalarCards ? ((repeatingHtml ? '<div class="sub-heading">Các trường dữ liệu chi tiết</div>' : '') + '<div class="form-grid-2">' + scalarCards + '</div>') : (repeatingHtml || visitNotesHtml ? '' : '<p class="field__help">Không có trường nào khớp bộ lọc hiện tại trong nhóm này.</p>')) +
            visitNotesHtml +
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
    (sec.fields || []).forEach(function (ff) {
      if (!ff.isVisible) return;
      const fd = defById[ff.fieldDefinitionId];
      if (!fd) return;
      if (enc.fieldErrors && enc.fieldErrors[fd.code]) hasErr = true;
      if (fd.storageLevel === 'visit_value') {
        total += 1;
        if (valuesByDefId[fd.id]) filled += 1;
      }
    });
    if (sec.sectionCode === 'sinh_ton_kham') {
      total += 1;
      if ((enc.orthostaticBp || []).some(function (b) { return b && b.systolic != null && b.diastolic != null; })) filled += 1;
    }
    if (sec.sectionCode === 'thuoc_di_ung') {
      total += 2;
      if ((enc.medications || []).some(isValidMedRow)) filled += 1;
      if ((enc.allergies || []).some(isValidAllergyRow)) filled += 1;
    }
    if (sec.sectionCode === 'can_lam_sang') {
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
      return renderShell('<button type="button" class="breadcrumbs__link" data-nav="#/patients">Hồ sơ bệnh nhân</button>', '<div class="banner banner--error"><div class="banner__main">' + ICONS.alert + '<div><p class="banner__desc">' + esc(enc.error || 'Không tìm thấy lượt khám.') + '</p></div></div><button type="button" class="btn btn--secondary btn--sm" data-nav="#/patients">Quay lại</button></div>');
    }

    const v = enc.visit;
    const pt = enc.patient;
    const isConf = v.status === 'confirmed';
    const continuousSections = buildContinuousSections(enc.formStructure.sections || [], enc.defById);

    const railHtml = continuousSections.map(function (sec) {
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
            return '<button type="button" class="jump-chip jump-chip--error" data-jump-field="' + esc(e.sectionCode + ':' + e.fieldCode) + '">' + esc(fLabel + ': ' + e.message) + '</button>';
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
      return renderShell('<button type="button" class="breadcrumbs__link" data-nav="#/patients">Hồ sơ bệnh nhân</button>', '<div class="banner banner--error"><div class="banner__main">' + ICONS.alert + '<div><p class="banner__desc">' + esc(rev.error || 'Không có dữ liệu rà soát.') + '</p></div></div></div>');
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
      }
      const validAlgs = (rev.visitDetail.allergies || []).filter(isValidAllergyRow);
      if (validAlgs.length > 0) {
        summaryItems.push({
          label: 'Dị ứng / ADR (' + validAlgs.length + ')',
          value: validAlgs.map(function (a) { return a.allergen + (a.reaction ? ' (' + a.reaction + ')' : ''); }).join(', ')
        });
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
    }

    const enteredSummaryHtml =
      '<section class="card" style="margin-top:16px;">' +
        '<div class="card__header"><div><h2 class="card__title">Tóm tắt các giá trị đã ghi nhận (' + summaryItems.length + ')</h2><p class="card__subtitle">Rà nhanh các thông tin đã điền trước khi xác nhận lượt khám.</p></div></div>' +
        '<div class="card__body">' +
          (summaryItems.length === 0
            ? '<p class="field__help">Chưa có giá trị lâm sàng nào được nhập trong lượt khám này.</p>'
            : '<div class="kv-grid">' + summaryItems.map(function (it) {
                return '<div><div class="kv-item__label">' + esc(it.label) + '</div><div class="kv-item__value">' + esc(it.value) + '</div></div>';
              }).join('') + '</div>') +
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

    const tier4Cards = (r.tier4AiModules || []).map(function (m) {
      const missingLabels = (m.missingFieldCodes || []).map(function (code) {
        return (defByCode[code] && defByCode[code].labelVi) || code;
      });
      return (
        '<div class="card" style="padding:14px;">' +
          '<div class="version-card__top">' +
            '<strong>' + esc(formatAiModuleLabel(m.aiModuleCode)) + '</strong>' +
            (m.ready ? '<span class="badge badge--success">Đủ biến dự kiến</span>' : '<span class="badge badge--info">Thiếu ' + missingLabels.length + ' trường</span>') +
          '</div>' +
          '<div class="cell-sub" style="margin-top:6px;">' + (m.ready ? 'Đáp ứng bộ biến dự kiến cho module này.' : ('Còn thiếu: ' + esc(missingLabels.join(', ')))) + '</div>' +
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
            '<button type="button" class="btn btn--navy" data-action="load-ai-payload">' + ICONS.code + ' Xuất gói dữ liệu chuẩn</button>' +
            '<button type="button" class="btn btn--primary" data-action="open-create-revision">Tạo bản sửa mới</button>' +
          '</div>' +
        '</div>' +
        (rev.showAiPayload && rev.aiInputPayload ? (
          '<div>' +
            '<div class="field__meta-row" style="margin-bottom:8px;"><strong>Gói dữ liệu chuẩn hóa JSON</strong><button type="button" class="btn btn--secondary btn--sm" data-action="copy-ai-payload">Sao chép JSON</button></div>' +
            '<pre class="json-viewer">' + esc(JSON.stringify(rev.aiInputPayload, null, 2)) + '</pre>' +
          '</div>'
        ) : '') +
      '</section>'
    );

    const body =
      '<div class="page-head">' +
        '<div><h1 class="page-head__title">Xem lại &amp; Xác nhận dữ liệu lượt khám</h1><p class="page-head__sub"><span class="mono">' + esc(pt ? pt.patientCode : '') + '</span> · ' + esc(pt ? pt.fullName : '') + ' · <span class="mono">' + esc(v.visitCode) + '</span></p></div>' +
        '<div class="page-head__actions"><button type="button" class="btn btn--secondary" data-nav="#/visits/' + esc(v.id) + '">' + ICONS.arrowLeft + ' Về biểu mẫu lượt khám</button></div>' +
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
      '<section class="card" style="margin-top:16px;">' +
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
        const secListHtml = secs.map(function (s, idx) {
          const visCount = (s.fields || []).filter(function (f) { return f.isVisible; }).length;
          return (
            '<div class="editor-item' + (activeSec && s.sectionCode === activeSec.sectionCode ? ' is-selected' : '') + '" data-ed-section="' + esc(s.sectionCode) + '">' +
              '<div class="editor-item__text"><div class="editor-item__name">' + String(idx + 1).padStart(2, '0') + '. ' + esc(s.titleVi) + '</div><div class="editor-item__sub">' + visCount + '/' + (s.fields || []).length + ' trường hiển thị</div></div>' +
            '</div>'
          );
        }).join('');

        const fieldsInSec = activeSec ? (activeSec.fields || []) : [];
        const fq = String(af.fieldSearch || '').trim().toLowerCase();
        const filteredFields = fieldsInSec.map(function (ff, origIdx) {
          return { ff: ff, origIdx: origIdx };
        }).filter(function (entry) {
          if (!fq) return true;
          const fd = defMap[entry.ff.fieldDefinitionId] || {};
          const lbl = String(entry.ff.customLabelVi || fd.labelVi || '').toLowerCase();
          const code = String(fd.code || entry.ff.fieldCode || '').toLowerCase();
          return lbl.indexOf(fq) >= 0 || code.indexOf(fq) >= 0;
        });

        const fieldListHtml = filteredFields.length === 0
          ? '<p class="field__help" style="padding:10px;">Không tìm thấy trường nào khớp từ khóa.</p>'
          : filteredFields.map(function (entry) {
              const ff = entry.ff;
              const idx = entry.origIdx;
              const fd = defMap[ff.fieldDefinitionId] || {};
              const sel = ff.fieldDefinitionId === af.selectedFieldDefId;
              return (
                '<div class="editor-item' + (sel ? ' is-selected' : '') + (!ff.isVisible ? ' is-hidden-field' : '') + '" data-ed-field="' + esc(ff.fieldDefinitionId) + '">' +
                  '<div class="editor-item__text">' +
                    '<div class="editor-item__name">' + esc(ff.customLabelVi || fd.labelVi || ff.fieldCode) + '</div>' +
                    '<div class="editor-item__sub">' + esc(formatDataTypeVi(fd.dataType)) + (!ff.isVisible ? ' · Đang ẩn' : '') + (ff.requiredForConfirm ? ' · Bắt buộc xác nhận' : '') + '</div>' +
                  '</div>' +
                  (isDraft && !fq ? (
                    '<div class="order-btns">' +
                      '<button type="button" class="icon-btn" title="Lên (Alt+↑)" data-move-field="' + idx + ':-1"' + (idx === 0 ? ' disabled' : '') + '>' + ICONS.up + '</button>' +
                      '<button type="button" class="icon-btn" title="Xuống (Alt+↓)" data-move-field="' + idx + ':1"' + (idx === fieldsInSec.length - 1 ? ' disabled' : '') + '>' + ICONS.down + '</button>' +
                    '</div>'
                  ) : '') +
                '</div>'
              );
            }).join('');

        const activeFF = fieldsInSec.find(function (ff) { return ff.fieldDefinitionId === af.selectedFieldDefId; }) || (filteredFields[0] && filteredFields[0].ff) || fieldsInSec[0];
        const activeFD = activeFF ? (defMap[activeFF.fieldDefinitionId] || {}) : null;

        const propHtml = !activeFF || !activeFD ? '<p class="field__help">Chọn một trường ở cột giữa để xem hoặc cấu hình thuộc tính.</p>' : (
          '<div class="field"><label class="field__label">Nhãn hiển thị tiếng Việt</label><input class="input" data-ed-prop="customLabelVi" value="' + esc(activeFF.customLabelVi || activeFD.labelVi) + '"' + (!isDraft ? ' disabled' : '') + '></div>' +
          '<div class="field"><label class="field__label">Kiểu nhập liệu</label><input class="input" value="' + esc(formatDataTypeVi(activeFD.dataType) + (activeFD.canonicalUnit ? ' · Đơn vị: ' + activeFD.canonicalUnit : '')) + '" disabled></div>' +
          '<div class="field"><label class="field__label">Ghi chú hướng dẫn bác sĩ (tùy chọn)</label><textarea class="textarea" data-ed-prop="customHelpText"' + (!isDraft ? ' disabled' : '') + '>' + esc(activeFF.customHelpText || '') + '</textarea></div>' +
          '<label class="choice-row"><input type="checkbox" data-ed-prop="isVisible"' + (activeFF.isVisible ? ' checked' : '') + (!isDraft ? ' disabled' : '') + '><span><strong>Hiển thị trường này cho lượt khám mới</strong><div class="cell-sub">Tắt để ngừng dùng ở lượt mới mà không làm mất dữ liệu lượt cũ.</div></span></label>' +
          '<label class="choice-row"><input type="checkbox" data-ed-prop="requiredForConfirm"' + (activeFF.requiredForConfirm ? ' checked' : '') + (!isDraft ? ' disabled' : '') + '><span><strong>Bắt buộc khi xác nhận lượt khám</strong><div class="cell-sub">Lưu nháp vẫn cho phép bỏ trống; chỉ yêu cầu khi bấm Xác nhận.</div></span></label>' +
          '<details class="details-tech">' +
            '<summary>Thông tin kỹ thuật (mã trường &amp; nguồn)</summary>' +
            '<div class="details-tech__body">' +
              '<div class="field"><label class="field__label">Mã chuẩn hóa (field_definition.code)</label><input class="input mono" value="' + esc(activeFD.code) + '" disabled></div>' +
              '<div class="field"><label class="field__label">Mức lưu trữ &amp; Phạm vi</label><input class="input" value="' + esc(formatStorageLevelVi(activeFD.storageLevel) + ' · ' + formatScopeVi(activeFD.scopeStatus)) + '" disabled></div>' +
              '<div class="field"><label class="field__label">Nguồn tham chiếu chuyên môn</label><input class="input" value="' + esc(activeFD.sourceRef || '—') + '" disabled></div>' +
            '</div>' +
          '</details>'
        );

        tabBody =
          '<div class="editor-3pane">' +
            '<div class="editor-pane"><div class="editor-pane__head"><h3 class="editor-pane__title">1. Nhóm biểu mẫu (8)</h3></div><div class="editor-pane__scroll">' + secListHtml + '</div></div>' +
            '<div class="editor-pane">' +
              '<div class="editor-pane__head"><h3 class="editor-pane__title">2. Trường trong nhóm (' + filteredFields.length + '/' + fieldsInSec.length + ')</h3><span class="kbd">Alt+↑/↓</span></div>' +
              '<div class="editor-pane__search"><input type="search" id="admin-form-field-search" class="input" placeholder="Tìm trường theo tên hoặc mã..." value="' + esc(af.fieldSearch) + '"></div>' +
              '<div class="editor-pane__scroll">' + fieldListHtml + '</div>' +
            '</div>' +
            '<div class="editor-pane"><div class="editor-pane__head"><h3 class="editor-pane__title">3. Thuộc tính trường</h3></div><div class="editor-pane__scroll" style="gap:10px;">' + propHtml + '</div></div>' +
          '</div>';
      } else if (af.activeTab === 'preview') {
        const pd = af.previewData;
        if (!pd) {
          tabBody = '<div class="skeleton-stack"><div class="skeleton-bar"></div><div class="skeleton-card"></div></div>';
        } else {
          const pDefById = {};
          const pDefByCode = {};
          (pd.fieldDefinitions || []).forEach(function (fd) { pDefById[fd.id] = fd; pDefByCode[fd.code] = fd; });
          const pRail = (pd.sections || []).map(function (s) {
            return '<button type="button" class="rail-btn' + (s.sectionCode === af.previewSectionCode ? ' is-active' : '') + '" data-prev-section="' + esc(s.sectionCode) + '"><span><span class="rail-btn__num">' + String(s.displayOrder).padStart(2, '0') + '</span>' + esc(s.titleVi) + '</span></button>';
          }).join('');

          tabBody =
            '<div class="banner banner--blue"><div class="banner__main">' + ICONS.eye + '<div><p class="banner__title">' + esc(pd.previewBannerVi) + '</p></div></div></div>' +
            '<div class="encounter-layout">' +
              '<aside class="group-rail"><div class="group-rail__title">Mục lục 8 nhóm</div>' + pRail + '</aside>' +
              '<div class="form-canvas">' +
                renderClinicalSectionForm({
                  mode: 'preview',
                  readonly: false,
                  sections: pd.sections,
                  defById: pDefById,
                  defByCode: pDefByCode,
                  valuesByDefId: af.previewValues,
                  orthostaticBp: af.previewBp,
                  medications: af.previewMeds,
                  allergies: af.previewAllergies,
                  labResults: af.previewLabs,
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
          ['login', 'logout', 'login_failed', 'user_create', 'user_update', 'form_version_create', 'form_version_update', 'form_version_delete', 'form_version_publish', 'patient_create', 'visit_confirm'].map(function (a) {
            return '<option value="' + a + '"' + (aa.action === a ? ' selected' : '') + '>' + esc(formatAuditAction(a)) + '</option>';
          }).join('') +
        '</select>' +
        '<select id="audit-entity" class="select">' +
          '<option value="">Tất cả đối tượng</option>' +
          ['app_user', 'user_session', 'patient', 'visit', 'visit_revision', 'form_version'].map(function (e) {
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
     Modals (Create/Edit Patient, Create Visit, Create Revision, Unsaved Guard,
             Admin 2-Step User Permission Modal, Lock/Reset Password, Setup Code)
     ------------------------------------------------------------------------ */
  function openModal(modalObj) {
    state.modal = modalObj;
    renderModal();
  }

  function closeModal() {
    state.modal = null;
    renderModal();
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
    let html = '';

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

    if (m.type === 'reset-local') {
      html =
        '<div class="modal__head"><h2 class="modal__title" id="modal-title">Đặt lại dữ liệu cục bộ</h2><button type="button" class="icon-btn" data-action="close-modal" aria-label="Đóng">' + ICONS.x + '</button></div>' +
        '<div class="modal__body"><p>Thao tác này sẽ xóa toàn bộ thay đổi đã lưu trong bộ nhớ trình duyệt (localStorage) và khôi phục tập dữ liệu mẫu tổng hợp ban đầu.</p></div>' +
        '<div class="modal__foot">' +
          '<button type="button" class="btn btn--secondary" data-action="close-modal">Hủy</button>' +
          '<button type="button" class="btn btn--danger" data-action="do-reset-local">Đặt lại dữ liệu</button>' +
        '</div>';
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

    dialog.innerHTML = html;
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
    let html = '';
    if (state.screen === 'login') html = renderLogin();
    else if (state.screen === 'forbidden') html = renderForbidden();
    else if (state.screen === 'patients') html = renderPatients();
    else if (state.screen === 'profile') html = renderProfile();
    else if (state.screen === 'encounter') html = renderEncounter();
    else if (state.screen === 'review') html = renderReview();
    else if (state.screen === 'admin-accounts') html = renderAdminUsers();
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
        numberInputAttribute: 'data-prev-num',
        getAutoPulseSourceIndex: function () { return state.adminForms.previewAutoPulseSourceIndex; },
        setAutoPulseSourceIndex: function (index) { state.adminForms.previewAutoPulseSourceIndex = index; },
        markDirty: function () {}
      };
    }
    return {
      valuesByDefId: state.encounter.valuesByDefId,
      defById: state.encounter.defById,
      visitId: state.encounter.visitId,
      orthostaticBp: state.encounter.orthostaticBp,
      medications: state.encounter.medications,
      allergies: state.encounter.allergies,
      labResults: state.encounter.labResults,
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
    const values = Object.keys(enc.valuesByDefId).map(function (k) { return enc.valuesByDefId[k]; }).filter(Boolean);
    return {
      rowVersion: enc.visit.rowVersion,
      clinicalNote: enc.clinicalNote || null,
      infoSource: enc.infoSource || null,
      values: values,
      orthostaticBp: enc.orthostaticBp,
      medications: enc.medications,
      allergies: enc.allergies,
      labResults: enc.labResults
    };
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
        toast('Còn ' + enc.errorList.length + ' lỗi kỹ thuật cần sửa trước khi lưu.', 'error');
      } else if (err && err.status === 409) {
        enc.conflictError = err.detail || 'Phát hiện xung đột phiên bản dữ liệu (409).';
        toast('Xung đột phiên bản dữ liệu (409) — không ghi đè âm thầm.', 'warn');
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

  function scrollToAndPulseField(fieldCode) {
    const el = document.querySelector('[data-field-code="' + CSS.escape(fieldCode) + '"]');
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.classList.add('field--highlight');
    setTimeout(function () { el.classList.remove('field--highlight'); }, 2000);
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
      state.encounter.highlightFieldCode = parts[1];
      navigate('#/visits/' + state.review.visitId, true);
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
      ft.markDirty();
      render();
      return;
    }

    if (target.hasAttribute('data-enc-add-allergy') || target.hasAttribute('data-prev-add-allergy')) {
      const ft = getFormTarget(target.hasAttribute('data-prev-add-allergy'));
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
      if (af.draftDirty && af.versionDetail && af.versionDetail.formVersion.status === 'draft' && formTab !== 'editor') {
        try {
          const fv = af.versionDetail.formVersion;
          const saved = await api.updateFormVersion(fv.id, { rowVersion: fv.rowVersion, changeNote: fv.changeNote, sections: af.draftSections }, fv.rowVersion);
          af.versionDetail = saved;
          af.draftSections = clone(saved.sections || []);
          af.draftDirty = false;
        } catch (err) {
          handleAuthOrError(err, 'Không thể tự động lưu nháp trước khi chuyển tab.');
          return;
        }
      }
      af.activeTab = formTab;
      render();
      if (formTab === 'preview' && af.selectedVersionId) {
        af.previewData = await api.previewFormVersion(af.selectedVersionId);
        render();
      } else if (formTab === 'diff' && af.selectedVersionId && af.diffBaseVersionId) {
        af.diffData = await api.diffFormVersion(af.selectedVersionId, af.diffBaseVersionId);
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

    // Named actions
    const action = target.getAttribute('data-action');
    if (!action) return;

    if (action === 'toggle-sidebar') {
      state.sidebarCollapsed = !state.sidebarCollapsed;
      try { global.localStorage.setItem('hf_sidebar_collapsed', state.sidebarCollapsed ? '1' : '0'); } catch (_e) {}
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
      state.mobileMenuOpen = !state.mobileMenuOpen;
      render();
      return;
    }
    if (action === 'logout') {
      try { await api.logout(); } catch (_ignored) {}
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

    // Static mode reset local storage
    if (action === 'confirm-reset-local' && api.isStatic) {
      openModal({ type: 'reset-local' });
      return;
    }
    if (action === 'do-reset-local' && api.isStatic && api.resetLocalData) {
      await api.resetLocalData();
      state.user = null;
      closeModal();
      toast('Đã đặt lại dữ liệu cục bộ về trạng thái ban đầu.', 'success');
      navigate('#/login', true);
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
    if (t.id === 'audit-q') { state.adminAudit.q = t.value; scheduleLiveSearch('audit', t); return; }
    if (t.id === 'admin-form-field-search') {
      const snap = captureInputFocus(t);
      state.adminForms.fieldSearch = t.value;
      renderPreservingEditorScroll();
      restoreInputFocus(snap);
      return;
    }

    // Visit metadata fields (infoSource, clinicalNote)
    const vmKey = t.getAttribute('data-enc-visit-meta');
    if (vmKey) {
      state.encounter[vmKey] = t.value;
      markEncounterDirty();
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
        row[parts[1]] = t.value;
        ft.markDirty();
        const card = t.closest('.repeat-card');
        if (card) card.classList.toggle('repeat-card--incomplete', !isValidAllergyRow(row));
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
      if (ff) {
        ff[edProp] = t.value;
        af.draftDirty = true;
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

    // Med status change updates active count card
    const medAttr = t.getAttribute('data-enc-med-field') || t.getAttribute('data-prev-med-field');
    if (medAttr && medAttr.endsWith(':status')) {
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
      if (ff) {
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

  // Keyboard shortcuts (/, Ctrl+S, Escape, Alt+ArrowUp/Down)
  document.addEventListener('keydown', function (ev) {
    if (ev.key === 'Escape' && state.modal) {
      closeModal();
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
    renderRuntimeBanner();
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
