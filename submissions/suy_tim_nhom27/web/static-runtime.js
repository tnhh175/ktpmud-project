'use strict';

/* ==========================================================================
   Static Browser Runtime (Chế độ ngoại tuyến trên trình duyệt — localStorage)
   Thực thi đầy đủ luật nghiệp vụ K1–K10 theo OpenAPI 3.1.0 & CSDL 19 bảng.
   ========================================================================== */

(function (global) {
  const STORAGE_KEY = 'suytim_mvp_static_db_v1';
  const SESSION_KEY = 'suytim_mvp_static_session_v1';
  const CACHE_VERSION = 2;
  let authEpoch = 0;

  function credentialStamp(user) {
    return JSON.stringify([user.credentialVersion || 0, user.passwordSecret, user.passwordVerifier, user.role, user.isActive]);
  }

  async function derivePassword(password, salt, iterations) {
    const key = await global.crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
    const bits = await global.crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: new Uint8Array(salt), iterations: iterations }, key, 256);
    return Array.from(new Uint8Array(bits));
  }

  async function verifyPassword(user, password) {
    if (!user.passwordVerifier) return user.passwordSecret === password;
    const verifier = user.passwordVerifier;
    const hash = await derivePassword(password, verifier.salt, verifier.iterations);
    return hash.length === verifier.hash.length && hash.every(function (byte, index) { return byte === verifier.hash[index]; });
  }

  class StaticApiError extends Error {
    constructor(status, code, title, detail, extra) {
      super(detail || title || 'Lỗi nghiệp vụ');
      this.name = 'ApiError';
      this.status = status;
      this.code = code;
      this.title = title;
      this.detail = detail;
      this.errors = (extra && extra.errors) || [];
      this.quality = (extra && extra.quality) || null;
      this.currentRowVersion = extra && extra.currentRowVersion !== undefined ? extra.currentRowVersion : null;
      this.problem = Object.assign({
        type: 'https://errors.suytim.local/' + String(code || 'error').toLowerCase(),
        title: title,
        status: status,
        detail: detail,
        code: code,
        correlationId: 'req-' + Date.now().toString(36)
      }, extra || {});
    }
  }

  function clone(v) {
    return JSON.parse(JSON.stringify(v));
  }

  function makeUuid() {
    if (global.crypto && typeof global.crypto.randomUUID === 'function') {
      return global.crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  function parseIfMatch(headerVal, bodyRowVersion) {
    if (headerVal !== undefined && headerVal !== null && String(headerVal).trim() !== '') {
      const m = String(headerVal).trim().match(/^(?:W\/)?"?(\d+)"?$/);
      if (m) return Number(m[1]);
    }
    if (bodyRowVersion !== undefined && bodyRowVersion !== null) {
      return Number(bodyRowVersion);
    }
    return null;
  }

  function sanitizeUser(u) {
    return {
      id: u.id,
      username: u.username,
      fullName: u.fullName,
      role: u.role,
      isActive: Boolean(u.isActive),
      lastLoginAt: u.lastLoginAt || null,
      rowVersion: u.rowVersion || 1,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt
    };
  }

  function computeAge(patient, visitDateIso) {
    const ref = visitDateIso ? new Date(visitDateIso) : new Date();
    const refYear = isNaN(ref.getTime()) ? new Date().getFullYear() : ref.getFullYear();
    if (patient.birthDate) {
      const bd = new Date(patient.birthDate + 'T00:00:00Z');
      if (!isNaN(bd.getTime())) {
        let age = ref.getUTCFullYear() - bd.getUTCFullYear();
        const mDiff = ref.getUTCMonth() - bd.getUTCMonth();
        if (mDiff < 0 || (mDiff === 0 && ref.getUTCDate() < bd.getUTCDate())) {
          age -= 1;
        }
        return Math.max(0, Math.min(120, age));
      }
    }
    if (patient.birthYear != null) {
      return Math.max(0, Math.min(120, refYear - Number(patient.birthYear)));
    }
    if (patient.declaredAge != null) {
      return Math.max(0, Math.min(120, Number(patient.declaredAge)));
    }
    return null;
  }

  function computeBmi(heightCm, weightKg) {
    if (typeof heightCm !== 'number' || typeof weightKg !== 'number') return null;
    if (!isFinite(heightCm) || !isFinite(weightKg) || heightCm <= 0 || weightKg <= 0) return null;
    const hM = heightCm / 100;
    return Math.round((weightKg / (hM * hM)) * 100) / 100;
  }

  function paginate(list, page, pageSize) {
    const p = Math.max(1, Number(page) || 1);
    const ps = Math.max(1, Math.min(100, Number(pageSize) || 20));
    const totalItems = list.length;
    const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / ps);
    const start = (p - 1) * ps;
    return {
      items: list.slice(start, start + ps),
      pagination: {
        page: p,
        pageSize: ps,
        totalItems: totalItems,
        totalPages: totalPages
      }
    };
  }

  function buildInitialDb(catalog) {
    const now = '2026-11-19T08:30:00Z';
    const docId = '3259a713-567a-585f-ad0e-fc200f0ed954';
    const doc2Id = '4259a713-567a-585f-ad0e-fc200f0ed955';
    const doc3Id = '5259a713-567a-585f-ad0e-fc200f0ed956';
    const admId = 'fb65ae24-3f49-5dc1-8b5a-b08957ac449e';

    const users = [
      {
        id: docId,
        username: 'doctor',
        passwordSecret: 'Doctor@2026',
        fullName: 'BS. Nguyễn Quang Minh',
        role: 'doctor',
        isActive: true,
        lastLoginAt: '2026-11-19T08:15:00Z',
        rowVersion: 1,
        createdAt: '2026-10-01T08:00:00Z',
        updatedAt: '2026-11-19T08:15:00Z'
      },
      {
        id: admId,
        username: 'admin',
        passwordSecret: 'Admin@2026',
        fullName: 'Trần Thu Hà',
        role: 'admin',
        isActive: true,
        lastLoginAt: '2026-11-19T08:00:00Z',
        rowVersion: 1,
        createdAt: '2026-10-01T08:00:00Z',
        updatedAt: '2026-11-19T08:00:00Z'
      },
      {
        id: doc2Id,
        username: 'bs.lan',
        passwordSecret: 'Doctor@2026',
        fullName: 'BS. Phạm Thúy Lan',
        role: 'doctor',
        isActive: true,
        lastLoginAt: '2026-11-18T14:20:00Z',
        rowVersion: 1,
        createdAt: '2026-10-05T08:00:00Z',
        updatedAt: '2026-11-18T14:20:00Z'
      },
      {
        id: doc3Id,
        username: 'bs.hung',
        passwordSecret: 'Doctor@2026',
        fullName: 'BS. Lê Quốc Hùng',
        role: 'doctor',
        isActive: false,
        lastLoginAt: '2026-10-25T10:00:00Z',
        rowVersion: 2,
        createdAt: '2026-10-05T08:00:00Z',
        updatedAt: '2026-11-10T09:00:00Z'
      }
    ];

    const fieldDefs = clone(catalog.fields || []);
    const fieldByCode = {};
    fieldDefs.forEach(function (f) {
      fieldByCode[f.code] = f;
    });

    const template = clone(catalog.formTemplate);
    const v10Id = '9965b491-5b78-5865-9220-53f7bc2c29fe';
    const v11Id = 'aa65b491-5b78-5865-9220-53f7bc2c29ff';

    const draftOverrides = clone(catalog.draftVersionOverrides || {});
    const extraVisibleInV11 = {
      so_lan_cap_cuu_nhap_vien: true,
      muc_tieu_dieu_tri: true,
      lao_khoa_frailty: true,
      lao_khoa_adl_iadl: true,
      lao_khoa_chuc_nang_nhan_thuc: true,
      lao_khoa_nguy_co_te_nga: true,
      lao_khoa_kha_nang_nuot: true,
      cls_chuc_nang_gan: true,
      chan_doan_kieu_hinh_ef: true
    };
    (draftOverrides.visibleCodes || []).forEach(function (c) { extraVisibleInV11[c] = true; });
    const retiredInV11 = {
      cls_don_vi: true,
      cls_thoi_diem: true,
      cls_ecg_thoi_diem: true,
      cls_sieu_am_tim_thoi_diem: true,
      cls_xquang_thoi_diem: true,
      thuoc_ghi_nhan: true,
      di_ung_adr: true
    };
    (draftOverrides.hiddenCodes || []).forEach(function (c) { retiredInV11[c] = true; });

    function buildVersionSections(versionId, versionNo) {
      const secList = [];
      (catalog.sections || []).forEach(function (sec) {
        const secId = versionNo === 1 ? sec.id : makeUuid();
        const secFields = [];
        let order = 1;
        fieldDefs.forEach(function (fd) {
          if (fd.sectionCode !== sec.sectionCode) return;
          const isV11Only = fd.sourceRef === 'G1 24/11/2026';
          if (versionNo === 1 && isV11Only) return;
          if (versionNo >= 2 && retiredInV11[fd.code]) return;
          const visible = fd.scopeStatus === 'mvp' || (versionNo >= 2 && Boolean(extraVisibleInV11[fd.code]));
          secFields.push({
            id: makeUuid(),
            formVersionId: versionId,
            formSectionId: secId,
            fieldDefinitionId: fd.id,
            fieldCode: fd.code,
            displayOrder: order++,
            requiredForConfirm: false,
            isVisible: visible,
            isReadonly: Boolean(fd.isCalculated),
            customLabelVi: null,
            customHelpText: null
          });
        });
        secList.push({
          id: secId,
          formVersionId: versionId,
          sectionCode: sec.sectionCode,
          titleVi: sec.titleVi,
          description: sec.description,
          displayOrder: sec.displayOrder,
          fields: secFields
        });
      });
      return secList;
    }

    const formVersions = [
      {
        id: v10Id,
        formTemplateId: template.id,
        versionNo: 1,
        versionLabel: 'v1.0',
        status: 'retired',
        basedOnVersionId: null,
        changeNote: 'Phiên bản khởi tạo 95 trường MVP chuẩn hóa từ bảng truy vết.',
        createdBy: admId,
        createdAt: '2026-10-01T08:00:00Z',
        publishedAt: '2026-10-01T08:15:00Z',
        publishedBy: admId,
        rowVersion: 2,
        definitionOverrides: {},
        sections: buildVersionSections(v10Id, 1)
      },
      {
        id: v11Id,
        formTemplateId: template.id,
        versionNo: 2,
        versionLabel: 'v1.1',
        status: 'published',
        basedOnVersionId: v10Id,
        changeNote: 'Phiên bản v1.1 theo G1 24/11/2026: sinh tồn/nhân trắc, ICD-10, 6 CLS mới, dị ứng cản quang tri-state và kiểu hình HFmrEF.',
        createdBy: admId,
        createdAt: '2026-11-01T08:00:00Z',
        publishedAt: '2026-11-01T09:00:00Z',
        publishedBy: admId,
        rowVersion: 2,
        definitionOverrides: clone(draftOverrides),
        sections: buildVersionSections(v11Id, 2)
      }
    ];

    const p1Id = '10000000-0000-4000-8000-000000000101';
    const p2Id = '10000000-0000-4000-8000-000000000102';
    const p3Id = '10000000-0000-4000-8000-000000000103';

    const patients = [
      {
        id: p1Id,
        patientCode: 'BN-00101',
        externalPatientCode: 'HS-TM-2026-01',
        fullName: 'Nguyễn Minh An',
        sex: 'female',
        birthDate: '1952-03-15',
        birthYear: null,
        declaredAge: null,
        rowVersion: 1,
        createdBy: docId,
        createdAt: '2026-11-05T08:00:00Z',
        updatedAt: '2026-11-05T08:00:00Z'
      },
      {
        id: p2Id,
        patientCode: 'BN-00102',
        externalPatientCode: null,
        fullName: 'Trần Văn Bình',
        sex: 'male',
        birthDate: null,
        birthYear: 1948,
        declaredAge: null,
        rowVersion: 1,
        createdBy: docId,
        createdAt: '2026-10-12T09:10:00Z',
        updatedAt: '2026-10-12T09:10:00Z'
      },
      {
        id: p3Id,
        patientCode: 'BN-00103',
        externalPatientCode: null,
        fullName: 'Lê Thị Cúc',
        sex: 'female',
        birthDate: null,
        birthYear: null,
        declaredAge: 79,
        rowVersion: 1,
        createdBy: docId,
        createdAt: '2026-11-18T10:30:00Z',
        updatedAt: '2026-11-18T10:30:00Z'
      }
    ];

    function makeVal(visitId, code, state, typedVal, unit, optCode) {
      const fd = fieldByCode[code];
      if (!fd) return null;
      const base = {
        visitId: visitId,
        fieldDefinitionId: fd.id,
        fieldCode: fd.code,
        valueState: state,
        valueNum: null,
        valueText: null,
        valueBool: null,
        valueDate: null,
        fieldOptionId: null,
        selectedOptions: [],
        unit: null,
        updatedAt: now
      };
      if (state === 'unknown') return base;
      if (fd.dataType === 'boolean') base.valueBool = Boolean(typedVal);
      else if (fd.dataType === 'number' || fd.dataType === 'integer') {
        base.valueNum = Number(typedVal);
        base.unit = unit || fd.canonicalUnit || null;
      } else if (fd.dataType === 'text') {
        base.valueText = String(typedVal);
      } else if (fd.dataType === 'date') {
        base.valueDate = String(typedVal);
      } else if (fd.dataType === 'single_choice') {
        const opt = (fd.options || []).find(function (o) { return o.optionCode === optCode; });
        if (opt) base.fieldOptionId = opt.id;
      } else if (fd.dataType === 'multi_choice' && Array.isArray(optCode)) {
        base.selectedOptions = optCode.map(function (oc) {
          const opt = (fd.options || []).find(function (o) { return o.optionCode === oc; });
          return opt ? { visitId: visitId, fieldDefinitionId: fd.id, fieldOptionId: opt.id } : null;
        }).filter(Boolean);
      }
      return base;
    }

    const v1VisitId = '20000000-0000-4000-8000-000000000201';
    const v2VisitId = '20000000-0000-4000-8000-000000000202';
    const v3VisitId = '20000000-0000-4000-8000-000000000203';

    const v1Values = [
      makeVal(v1VisitId, 'chieu_cao_cm', 'answered', 156, 'cm'),
      makeVal(v1VisitId, 'can_nang_kg', 'answered', 54.5, 'kg'),
      makeVal(v1VisitId, 'kho_tho_khi_gang_suc', 'answered', true),
      makeVal(v1VisitId, 'kho_tho_khi_nam', 'answered', false),
      makeVal(v1VisitId, 'phu_hai_chi_duoi', 'answered', true),
      makeVal(v1VisitId, 'lu_lan_sang', 'answered', false),
      makeVal(v1VisitId, 'nyha_hien_tai', 'answered', null, null, 'nyha_ii'),
      makeVal(v1VisitId, 'so_lan_cap_cuu_nhap_vien', 'answered', 0, 'lần'),
      makeVal(v1VisitId, 'mach', 'answered', 78, 'lần/phút'),
      makeVal(v1VisitId, 'nhip_tho', 'answered', 18, 'lần/phút'),
      makeVal(v1VisitId, 'spo2', 'answered', 96, '%'),
      makeVal(v1VisitId, 'ran_am_phoi', 'answered', false),
      makeVal(v1VisitId, 'ts_tang_huyet_ap', 'answered', true),
      makeVal(v1VisitId, 'ts_dai_thao_duong', 'answered', true),
      makeVal(v1VisitId, 'ts_hoa_tri_thuoc_doc_tim', 'unknown')
    ].filter(Boolean);

    const v1Bp = [
      {
        id: '30000000-0000-4000-8000-000000000301',
        visitId: v1VisitId,
        position: 'sitting',
        minuteAfter: 0,
        systolic: 128,
        diastolic: 76,
        heartRate: 78,
        measuredAt: '2026-11-10T09:10:00Z',
        note: 'Nghỉ 5 phút trước đo',
        createdAt: '2026-11-10T09:10:00Z'
      },
      {
        id: '30000000-0000-4000-8000-000000000302',
        visitId: v1VisitId,
        position: 'standing',
        minuteAfter: 3,
        systolic: 118,
        diastolic: 72,
        heartRate: 84,
        measuredAt: '2026-11-10T09:13:00Z',
        note: 'Không chóng mặt khi đứng',
        createdAt: '2026-11-10T09:13:00Z'
      }
    ];

    const v1Meds = [
      {
        id: '40000000-0000-4000-8000-000000000401',
        visitId: v1VisitId,
        medicationGroup: 'prescribed',
        drugName: 'Sacubitril/Valsartan',
        activeIngredient: 'Sacubitril + Valsartan',
        strength: '50mg',
        dose: 50,
        unit: 'mg',
        frequency: '2 lần/ngày',
        route: 'oral',
        status: 'active',
        startedAt: '2026-08-01',
        note: 'Uống đều buổi sáng và tối',
        createdAt: '2026-11-10T09:15:00Z'
      },
      {
        id: '40000000-0000-4000-8000-000000000402',
        visitId: v1VisitId,
        medicationGroup: 'prescribed',
        drugName: 'Bisoprolol',
        activeIngredient: 'Bisoprolol fumarate',
        strength: '2.5mg',
        dose: 2.5,
        unit: 'mg',
        frequency: '1 lần/ngày',
        route: 'oral',
        status: 'active',
        startedAt: '2026-08-01',
        note: null,
        createdAt: '2026-11-10T09:15:00Z'
      }
    ];

    const v1Allergies = [
      {
        id: '50000000-0000-4000-8000-000000000501',
        visitId: v1VisitId,
        kind: 'allergy',
        agentCategory: 'contrast_media',
        allergen: 'Thuốc cản quang chứa iod',
        reaction: 'Mày đay nhẹ sau chụp mạch năm 2023',
        severity: 'moderate',
        recordedAt: '2026-11-10T09:16:00Z',
        note: null,
        createdAt: '2026-11-10T09:16:00Z'
      }
    ];

    const v1Labs = [
      {
        id: '60000000-0000-4000-8000-000000000601',
        visitId: v1VisitId,
        labCode: 'cls_nt_probnp',
        labSubtype: null,
        valueNum: 1240,
        valueText: null,
        unit: 'pg/mL',
        measuredAt: '2026-11-10T08:30:00Z',
        note: 'Mẫu máu tĩnh mạch sáng sớm',
        createdAt: '2026-11-10T09:18:00Z'
      },
      {
        id: '60000000-0000-4000-8000-000000000602',
        visitId: v1VisitId,
        labCode: 'cls_lvef',
        labSubtype: null,
        valueNum: 38,
        valueText: null,
        unit: '%',
        measuredAt: '2026-11-10T08:50:00Z',
        note: 'Siêu âm tim Simpson 2 bình diện',
        createdAt: '2026-11-10T09:18:00Z'
      },
      {
        id: '60000000-0000-4000-8000-000000000603',
        visitId: v1VisitId,
        labCode: 'cls_creatinin',
        labSubtype: null,
        valueNum: 112,
        valueText: null,
        unit: 'umol/L',
        measuredAt: '2026-11-10T08:30:00Z',
        note: null,
        createdAt: '2026-11-10T09:18:00Z'
      },
      {
        id: '60000000-0000-4000-8000-000000000604',
        visitId: v1VisitId,
        labCode: 'cls_egfr',
        labSubtype: null,
        valueNum: 46,
        valueText: null,
        unit: 'mL/phút/1.73m²',
        measuredAt: '2026-11-10T08:30:00Z',
        note: 'CKD-EPI 2021',
        createdAt: '2026-11-10T09:18:00Z'
      },
      {
        id: '60000000-0000-4000-8000-000000000605',
        visitId: v1VisitId,
        labCode: 'cls_kali',
        labSubtype: null,
        valueNum: 4.3,
        valueText: null,
        unit: 'mmol/L',
        measuredAt: '2026-11-10T08:30:00Z',
        note: null,
        createdAt: '2026-11-10T09:18:00Z'
      }
    ];

    const v2Values = [
      makeVal(v2VisitId, 'chieu_cao_cm', 'answered', 156, 'cm'),
      makeVal(v2VisitId, 'can_nang_kg', 'answered', 55.2, 'kg'),
      makeVal(v2VisitId, 'kho_tho_khi_gang_suc', 'answered', true),
      makeVal(v2VisitId, 'kho_tho_khi_nam', 'unknown'),
      makeVal(v2VisitId, 'so_lan_cap_cuu_nhap_vien', 'answered', 0, 'lần'),
      makeVal(v2VisitId, 'mach', 'answered', 82, 'lần/phút'),
      makeVal(v2VisitId, 'spo2', 'answered', 95, '%'),
      makeVal(v2VisitId, 'ts_tang_huyet_ap', 'answered', true)
    ].filter(Boolean);

    const v2Bp = [
      {
        id: '30000000-0000-4000-8000-000000000311',
        visitId: v2VisitId,
        position: 'sitting',
        minuteAfter: 0,
        systolic: 124,
        diastolic: 74,
        heartRate: 82,
        measuredAt: '2026-11-19T09:20:00Z',
        note: null,
        createdAt: '2026-11-19T09:20:00Z'
      }
    ];

    const v3Values = [
      makeVal(v3VisitId, 'chieu_cao_cm', 'answered', 165, 'cm'),
      makeVal(v3VisitId, 'can_nang_kg', 'answered', 62, 'kg'),
      makeVal(v3VisitId, 'kho_tho_khi_gang_suc', 'answered', true),
      makeVal(v3VisitId, 'mach', 'answered', 72, 'lần/phút'),
      makeVal(v3VisitId, 'spo2', 'answered', 97, '%')
    ].filter(Boolean);

    const visits = [
      {
        id: v1VisitId,
        visitCode: 'LK-20261110-01',
        externalVisitCode: null,
        patientId: p1Id,
        formVersionId: v11Id,
        visitDate: '2026-11-10T09:00:00Z',
        visitType: 'follow_up',
        chiefComplaint: 'Tái khám định kỳ suy tim, còn khó thở nhẹ khi đi bộ nhanh',
        clinicalNote: 'Người bệnh tuân thủ thuốc tốt, dung nạp liều ARNI hiện tại.',
        infoSource: 'Người bệnh và người nhà đi cùng',
        status: 'confirmed',
        currentRevisionNo: 1,
        createdBy: docId,
        createdAt: '2026-11-10T09:00:00Z',
        updatedAt: '2026-11-10T09:30:00Z',
        confirmedAt: '2026-11-10T09:30:00Z',
        confirmedBy: docId,
        confirmNote: 'Đã rà soát đầy đủ sinh hiệu và cận lâm sàng lượt tái khám.',
        rowVersion: 2,
        values: v1Values,
        orthostaticBp: v1Bp,
        medications: v1Meds,
        allergies: v1Allergies,
        labResults: v1Labs,
        revisions: [
          {
            id: '70000000-0000-4000-8000-000000000701',
            visitId: v1VisitId,
            revisionNo: 1,
            formVersionId: v11Id,
            revisionType: 'confirmed_snapshot',
            changeReason: 'Xác nhận dữ liệu lượt khám lần đầu',
            snapshotData: {
              valueCount: v1Values.length,
              bpCount: v1Bp.length,
              medicationCount: v1Meds.length,
              allergyCount: v1Allergies.length,
              labCount: v1Labs.length
            },
            createdBy: docId,
            createdAt: '2026-11-10T09:30:00Z'
          }
        ]
      },
      {
        id: v2VisitId,
        visitCode: 'LK-20261119-01',
        externalVisitCode: null,
        patientId: p1Id,
        formVersionId: v11Id,
        visitDate: '2026-11-19T09:15:00Z',
        visitType: 'follow_up',
        chiefComplaint: 'Tái khám theo dõi điện giải và cân nặng sau 9 ngày',
        clinicalNote: null,
        infoSource: 'Người bệnh trực tiếp',
        status: 'draft',
        currentRevisionNo: 1,
        createdBy: docId,
        createdAt: '2026-11-19T09:15:00Z',
        updatedAt: '2026-11-19T09:25:00Z',
        confirmedAt: null,
        confirmedBy: null,
        confirmNote: null,
        rowVersion: 1,
        values: v2Values,
        orthostaticBp: v2Bp,
        medications: [],
        allergies: [],
        labResults: [],
        revisions: []
      },
      {
        id: v3VisitId,
        visitCode: 'LK-20261015-01',
        externalVisitCode: null,
        patientId: p2Id,
        formVersionId: v10Id,
        visitDate: '2026-10-15T10:00:00Z',
        visitType: 'outpatient_new',
        chiefComplaint: 'Khám lần đầu vì khó thở gắng sức tăng dần',
        clinicalNote: 'Hồ sơ gắn phiên bản biểu mẫu v1.0 lúc tạo lượt.',
        infoSource: 'Người nhà và giấy tờ cũ mang theo',
        status: 'confirmed',
        currentRevisionNo: 1,
        createdBy: docId,
        createdAt: '2026-10-15T10:00:00Z',
        updatedAt: '2026-10-15T10:40:00Z',
        confirmedAt: '2026-10-15T10:40:00Z',
        confirmedBy: docId,
        confirmNote: 'Xác nhận lượt khám ban đầu (v1.0).',
        rowVersion: 2,
        values: v3Values,
        orthostaticBp: [],
        medications: [],
        allergies: [],
        labResults: [],
        revisions: [
          {
            id: '70000000-0000-4000-8000-000000000702',
            visitId: v3VisitId,
            revisionNo: 1,
            formVersionId: v10Id,
            revisionType: 'confirmed_snapshot',
            changeReason: 'Xác nhận dữ liệu lượt khám lần đầu',
            snapshotData: { valueCount: v3Values.length },
            createdBy: docId,
            createdAt: '2026-10-15T10:40:00Z'
          }
        ]
      }
    ];

    const auditLogs = [
      {
        id: '80000000-0000-4000-8000-000000000801',
        actorUserId: admId,
        actorUsername: 'admin',
        actorRole: 'admin',
        action: 'form_version_publish',
        entityType: 'form_version',
        entityId: v11Id,
        occurredAt: '2026-11-01T09:00:00Z',
        ip: '127.0.0.1',
        requestId: 'req-init-001',
        outcome: 'success',
        detail: { versionNo: 2, versionLabel: 'v1.1', retiredVersionId: v10Id }
      },
      {
        id: '80000000-0000-4000-8000-000000000802',
        actorUserId: docId,
        actorUsername: 'doctor',
        actorRole: 'doctor',
        action: 'patient_create',
        entityType: 'patient',
        entityId: p1Id,
        occurredAt: '2026-11-05T08:00:00Z',
        ip: '127.0.0.1',
        requestId: 'req-init-002',
        outcome: 'success',
        detail: { patientCode: 'BN-00101' }
      },
      {
        id: '80000000-0000-4000-8000-000000000803',
        actorUserId: docId,
        actorUsername: 'doctor',
        actorRole: 'doctor',
        action: 'visit_confirm',
        entityType: 'visit',
        entityId: v1VisitId,
        occurredAt: '2026-11-10T09:30:00Z',
        ip: '127.0.0.1',
        requestId: 'req-init-003',
        outcome: 'success',
        detail: { visitCode: 'LK-20261110-01', formVersionId: v11Id, revisionNo: 1 }
      },
      {
        id: '80000000-0000-4000-8000-000000000804',
        actorUserId: admId,
        actorUsername: 'admin',
        actorRole: 'admin',
        action: 'user_update',
        entityType: 'app_user',
        entityId: doc3Id,
        occurredAt: '2026-11-10T09:00:00Z',
        ip: '127.0.0.1',
        requestId: 'req-init-004',
        outcome: 'success',
        detail: { targetUsername: 'bs.hung', isActive: false, reason: 'Tạm ngưng công tác định kỳ' }
      }
    ];

    const careAssignments = [
      {
        id: '90000000-0000-4000-8000-000000000901',
        patientId: p1Id,
        doctorUserId: docId,
        assignedAt: '2026-11-05T08:00:00Z',
        assignedBy: docId,
        reason: 'Phân công mặc định cho bác sĩ tạo hồ sơ.',
        revokedAt: null,
        revokedBy: null
      },
      {
        id: '90000000-0000-4000-8000-000000000902',
        patientId: p2Id,
        doctorUserId: docId,
        assignedAt: '2026-10-12T09:10:00Z',
        assignedBy: docId,
        reason: 'Phân công mặc định cho bác sĩ tạo hồ sơ.',
        revokedAt: null,
        revokedBy: null
      },
      {
        id: '90000000-0000-4000-8000-000000000903',
        patientId: p3Id,
        doctorUserId: docId,
        assignedAt: '2026-11-18T10:30:00Z',
        assignedBy: docId,
        reason: 'Phân công mặc định cho bác sĩ tạo hồ sơ.',
        revokedAt: null,
        revokedBy: null
      }
    ];

    return {
      cacheVersion: CACHE_VERSION,
      schemaVersion: catalog.schemaVersion || '1.1.0',
      nextPatientSeq: 104,
      nextVisitSeq: 2,
      formTemplate: template,
      aiModules: clone(catalog.aiModules || []),
      fieldDefinitions: fieldDefs,
      formVersions: formVersions,
      users: users,
      patients: patients,
      visits: visits,
      careAssignments: careAssignments,
      auditLogs: auditLogs
    };
  }

  function applyDefinitionOverrides(definitions, overrides) {
    const ov = overrides || {};
    return (definitions || []).map(function (orig) {
      const def = clone(orig);
      const override = ov[def.code] || {};
      if (def.code === 'di_ung_thuoc_can_quang' && override.storageLevel === 'visit_value') {
        def.storageLevel = 'visit_value';
        def.repeatGroup = null;
        def.memberPath = null;
      }
      const extras = Array.isArray(override.extraOptions) ? override.extraOptions : [];
      if (def.code === 'chan_doan_kieu_hinh_ef') {
        const allowHfmref = extras.some(function (o) { return o && o.optionCode === 'hfmref'; });
        if (!allowHfmref) {
          def.options = (def.options || []).filter(function (o) { return o && o.optionCode !== 'hfmref'; });
        }
      }
      if (extras.length > 0) {
        def.options = Array.isArray(def.options) ? def.options : [];
        extras.forEach(function (opt) {
          if (!def.options.some(function (o) { return o && o.optionCode === opt.optionCode; })) {
            def.options.push(Object.assign({}, opt, { fieldDefinitionId: def.id }));
          }
        });
      }
      return def;
    });
  }

  function getEffectiveDefinitions(db, formVersion) {
    const overrides = formVersion && formVersion.definitionOverrides ? formVersion.definitionOverrides : {};
    return applyDefinitionOverrides(db.fieldDefinitions || [], overrides);
  }

  function migrateStoredDb(stored, catalog) {
    const catalogFields = clone(catalog.fields || []);
    const draftOverrides = clone(catalog.draftVersionOverrides || {});
    const hiddenSet = {};
    (draftOverrides.hiddenCodes || []).forEach(function (c) { hiddenSet[c] = true; });
    const visibleSet = { cls_chuc_nang_gan: true, chan_doan_kieu_hinh_ef: true };
    (draftOverrides.visibleCodes || []).forEach(function (c) { visibleSet[c] = true; });

    stored.fieldDefinitions = catalogFields;
    stored.aiModules = clone(catalog.aiModules || stored.aiModules || []);
    stored.schemaVersion = catalog.schemaVersion || '1.1.0';

    (stored.formVersions || []).forEach(function (fv) {
      const isV10 = Number(fv.versionNo) === 1 || fv.versionLabel === 'v1.0';
      if (isV10) {
        if (!fv.definitionOverrides) fv.definitionOverrides = {};
        return;
      }
      // v1.1+ receives draftVersionOverrides (di_ung_thuoc_can_quang visit_value, hfmref, CLS placement cleanup)
      fv.definitionOverrides = Object.assign({}, clone(draftOverrides), fv.definitionOverrides || {});
      if (draftOverrides.di_ung_thuoc_can_quang) {
        fv.definitionOverrides.di_ung_thuoc_can_quang = clone(draftOverrides.di_ung_thuoc_can_quang);
      }
      if (draftOverrides.chan_doan_kieu_hinh_ef) {
        fv.definitionOverrides.chan_doan_kieu_hinh_ef = clone(draftOverrides.chan_doan_kieu_hinh_ef);
      }
      const existingByCode = {};
      (fv.sections || []).forEach(function (sec) {
        sec.fields = (sec.fields || []).filter(function (ff) {
          if (hiddenSet[ff.fieldCode]) return false;
          existingByCode[ff.fieldCode] = ff;
          return true;
        });
      });
      // Add any missing v1.1 placements while preserving existing placements & custom labels
      (fv.sections || []).forEach(function (sec) {
        let maxOrder = (sec.fields || []).reduce(function (m, f) { return Math.max(m, Number(f.displayOrder) || 0); }, 0);
        catalogFields.forEach(function (fd) {
          if (fd.sectionCode !== sec.sectionCode) return;
          if (hiddenSet[fd.code]) return;
          if (existingByCode[fd.code]) return;
          sec.fields.push({
            id: makeUuid(),
            formVersionId: fv.id,
            formSectionId: sec.id,
            fieldDefinitionId: fd.id,
            fieldCode: fd.code,
            displayOrder: ++maxOrder,
            requiredForConfirm: false,
            isVisible: fd.scopeStatus === 'mvp' || Boolean(visibleSet[fd.code]),
            isReadonly: Boolean(fd.isCalculated),
            customLabelVi: null,
            customHelpText: null
          });
        });
      });
    });

    // Backfill creator assignments when missing
    if (!Array.isArray(stored.careAssignments)) {
      stored.careAssignments = [];
      const seenPair = {};
      (stored.patients || []).forEach(function (pt) {
        const k = pt.id + ':' + pt.createdBy;
        seenPair[k] = true;
        stored.careAssignments.push({
          id: makeUuid(),
          patientId: pt.id,
          doctorUserId: pt.createdBy,
          assignedAt: pt.createdAt || new Date().toISOString(),
          assignedBy: pt.createdBy,
          reason: 'G1 legacy patient creator',
          revokedAt: null,
          revokedBy: null
        });
      });
      (stored.visits || []).forEach(function (v) {
        const pt = (stored.patients || []).find(function (p) { return p.id === v.patientId; });
        const doc = (stored.users || []).find(function (u) { return u.id === v.createdBy && u.role === 'doctor'; });
        const k = v.patientId + ':' + v.createdBy;
        if (pt && doc && !seenPair[k]) {
          seenPair[k] = true;
          stored.careAssignments.push({
            id: makeUuid(),
            patientId: v.patientId,
            doctorUserId: v.createdBy,
            assignedAt: v.createdAt || new Date().toISOString(),
            assignedBy: pt.createdBy,
            reason: 'G1 legacy visit creator',
            revokedAt: null,
            revokedBy: null
          });
        }
      });
    }

    stored.cacheVersion = CACHE_VERSION;
    return stored;
  }

  let catalogCache = null;

  async function ensureCatalog() {
    if (catalogCache) return catalogCache;
    const res = await fetch('./catalog-seed.json');
    if (!res.ok) {
      throw new StaticApiError(500, 'CATALOG_LOAD_FAILED', 'Không thể nạp từ điển trường', 'Không nạp được tệp ./catalog-seed.json (HTTP ' + res.status + ').');
    }
    catalogCache = await res.json();
    return catalogCache;
  }

  function readStoredDb() {
    const raw = global.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.fieldDefinitions) && parsed.fieldDefinitions.length >= 1) {
          return parsed;
        }
      } catch (_e) {
        // Re-seed if corrupted
      }
    }
    return null;
  }

  async function loadDb() {
    const stored = readStoredDb();
    const cat = await ensureCatalog();
    const expectedDefCount = Array.isArray(cat.fields) ? cat.fields.length : 159;
    if (stored) {
      const needsMigration = stored.cacheVersion !== CACHE_VERSION ||
        !Array.isArray(stored.fieldDefinitions) ||
        stored.fieldDefinitions.length < expectedDefCount ||
        !Array.isArray(stored.careAssignments);
      if (needsMigration) {
        migrateStoredDb(stored, cat);
        saveDb(stored);
      }
      return stored;
    }
    const db = buildInitialDb(cat);
    saveDb(db);
    return db;
  }

  function saveDb(db) {
    global.localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  }

  function getSession() {
    const raw = global.sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (_e) {
      return null;
    }
  }

  function setSession(sess) {
    if (!sess) global.sessionStorage.removeItem(SESSION_KEY);
    else global.sessionStorage.setItem(SESSION_KEY, JSON.stringify(sess));
  }

  function appendAudit(db, actor, action, entityType, entityId, outcome, detail) {
    // K8: Never include passwords or clinical field payloads in audit detail
    const cleanDetail = {};
    if (detail && typeof detail === 'object') {
      Object.keys(detail).forEach(function (k) {
        const lk = k.toLowerCase();
        if (lk.indexOf('password') >= 0 || lk.indexOf('secret') >= 0 || lk === 'values' || lk === 'snapshotdata') return;
        cleanDetail[k] = detail[k];
      });
    }
    db.auditLogs.unshift({
      id: makeUuid(),
      actorUserId: actor ? actor.id : null,
      actorUsername: actor ? actor.username : null,
      actorRole: actor ? actor.role : null,
      action: action,
      entityType: entityType,
      entityId: entityId || null,
      occurredAt: new Date().toISOString(),
      ip: '127.0.0.1',
      requestId: 'req-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6),
      outcome: outcome || 'success',
      detail: cleanDetail
    });
  }

  function requireAuth(db, allowedRoles, entityTypeForAudit) {
    // An async caller may have loaded this object before credentials were changed.
    const stored = readStoredDb();
    if (!stored) {
      throw new StaticApiError(401, 'UNAUTHORIZED', 'Chưa xác thực', 'Dữ liệu đăng nhập đã thay đổi. Vui lòng đăng nhập lại.');
    }
    Object.assign(db, stored);
    const sess = getSession();
    if (!sess || !sess.userId) {
      throw new StaticApiError(401, 'UNAUTHORIZED', 'Chưa xác thực', 'Phiên đăng nhập chưa khởi tạo hoặc đã hết hạn. Vui lòng đăng nhập lại.');
    }
    const user = db.users.find(function (u) { return u.id === sess.userId; });
    if (user && (sess.credentialVersion || 0) !== (user.credentialVersion || 0)) {
      setSession(null);
      throw new StaticApiError(401, 'UNAUTHORIZED', 'Phiên đăng nhập đã hết hạn', 'Mật khẩu đã thay đổi. Vui lòng đăng nhập lại.');
    }
    if (!user || !user.isActive) {
      setSession(null);
      throw new StaticApiError(403, 'ACCOUNT_LOCKED', 'Tài khoản không khả dụng', 'Tài khoản đã bị khóa hoặc không tồn tại.');
    }
    if (allowedRoles && allowedRoles.indexOf(user.role) === -1) {
      const isAdminBlockedClinical = user.role === 'admin' && allowedRoles.indexOf('doctor') >= 0;
      appendAudit(db, user, 'login', entityTypeForAudit || 'patient', null, 'denied', {
        reason: isAdminBlockedClinical ? 'CLINICAL_DATA_SEPARATION_ENFORCED' : 'RBAC_ROLE_FORBIDDEN',
        requiredRoles: allowedRoles
      });
      saveDb(db);
      throw new StaticApiError(
        403,
        isAdminBlockedClinical ? 'CLINICAL_DATA_SEPARATION_ENFORCED' : 'RBAC_ROLE_FORBIDDEN',
        'Không đủ quyền truy cập',
        isAdminBlockedClinical
          ? 'Tài khoản Quản trị viên (admin) bị tách biệt hoàn toàn khỏi quyền đọc và chỉnh sửa bệnh án lâm sàng.'
          : 'Tài khoản hiện tại không có quyền thực hiện chức năng quản trị này.'
      );
    }
    return user;
  }

  function findFieldDefMap(db, formVersion) {
    const defs = formVersion ? getEffectiveDefinitions(db, formVersion) : (db.fieldDefinitions || []);
    const m = {};
    defs.forEach(function (fd) {
      m[fd.id] = fd;
      m[fd.code] = fd;
    });
    return m;
  }

  function isAssignmentActive(a) {
    return Boolean(a && !a.revokedAt);
  }

  function resolvePatientAccess(db, patientId, doctorUserId) {
    const found = (db.careAssignments || []).find(function (a) {
      return a.patientId === patientId && a.doctorUserId === doctorUserId && isAssignmentActive(a);
    });
    if (!found) return null;
    return {
      assignmentId: found.id,
      assignedAt: found.assignedAt || found.validFrom,
      assignedBy: found.assignedBy
    };
  }

  function requirePatientAccess(db, patientId, actor) {
    const pt = db.patients.find(function (p) { return p.id === patientId; });
    if (!pt) {
      throw new StaticApiError(404, 'RESOURCE_NOT_FOUND', 'Không tìm thấy hồ sơ', 'Không tìm thấy hồ sơ yêu cầu.');
    }
    const access = resolvePatientAccess(db, patientId, actor.id);
    if (!access) {
      throw new StaticApiError(404, 'RESOURCE_NOT_FOUND', 'Không tìm thấy hồ sơ', 'Không tìm thấy hồ sơ yêu cầu.');
    }
    return { patient: pt, access: access };
  }

  function findUserName(db, userId) {
    if (!userId) return null;
    const u = (db.users || []).find(function (x) { return x.id === userId; });
    return u ? u.fullName : null;
  }

  function formatAssignment(db, a) {
    return {
      id: a.id,
      patientId: a.patientId,
      doctorUserId: a.doctorUserId,
      doctorName: findUserName(db, a.doctorUserId) || 'Bác sĩ',
      assignedAt: a.assignedAt || a.validFrom,
      assignedBy: a.assignedBy,
      assignedByName: findUserName(db, a.assignedBy) || 'Hệ thống',
      reason: a.reason || null,
      revokedAt: a.revokedAt || null,
      revokedBy: a.revokedBy || null,
      revokedByName: a.revokedBy ? (findUserName(db, a.revokedBy) || 'Quản trị viên') : null
    };
  }

  function formatPatientOut(db, pt, access) {
    const out = clone(pt);
    out.access = access || null;
    out.updatedBy = pt.updatedBy || pt.createdBy;
    out.updatedByName = findUserName(db, out.updatedBy);
    return out;
  }

  function validateVisitPayload(db, visit, payload) {
    const errors = [];
    const formVer = db.formVersions.find(function (fv) { return fv.id === visit.formVersionId; });
    const effectiveDefs = getEffectiveDefinitions(db, formVer);
    const defMap = findFieldDefMap(db, formVer);
    const values = Array.isArray(payload.values) ? payload.values : [];

    values.forEach(function (v) {
      const fd = defMap[v.fieldDefinitionId] || defMap[v.fieldCode];
      if (!fd) {
        errors.push({ fieldCode: v.fieldCode || 'unknown', sectionCode: 'ghi_chu', message: 'Mã trường không tồn tại trong danh mục.', rejectedValue: null });
        return;
      }
      if (v.valueState !== 'answered' && v.valueState !== 'unknown') {
        errors.push({ fieldCode: fd.code, sectionCode: fd.sectionCode, message: 'Trạng thái giá trị chỉ chấp nhận answered hoặc unknown.', rejectedValue: v.valueState });
        return;
      }
      if (v.valueState === 'unknown') {
        return;
      }
      if (fd.dataType === 'number' || fd.dataType === 'integer') {
        if (v.valueNum === null || v.valueNum === undefined || v.valueNum === '' || isNaN(Number(v.valueNum))) {
          errors.push({ fieldCode: fd.code, sectionCode: fd.sectionCode, message: fd.labelVi + ': giá trị phải là số hợp lệ.', rejectedValue: v.valueNum });
          return;
        }
        const num = Number(v.valueNum);
        if (fd.dataType === 'integer' && !Number.isInteger(num)) {
          errors.push({ fieldCode: fd.code, sectionCode: fd.sectionCode, message: fd.labelVi + ': phải là số nguyên.', rejectedValue: num });
        }
        if (fd.minValue !== null && fd.minValue !== undefined && num < fd.minValue) {
          errors.push({ fieldCode: fd.code, sectionCode: fd.sectionCode, message: fd.labelVi + ' không được nhỏ hơn ' + fd.minValue + (fd.canonicalUnit ? ' ' + fd.canonicalUnit : '') + '.', rejectedValue: num });
        }
        if (fd.maxValue !== null && fd.maxValue !== undefined && num > fd.maxValue) {
          errors.push({ fieldCode: fd.code, sectionCode: fd.sectionCode, message: fd.labelVi + ' không được vượt quá ' + fd.maxValue + (fd.canonicalUnit ? ' ' + fd.canonicalUnit : '') + '.', rejectedValue: num });
        }
      } else if (fd.dataType === 'boolean') {
        if (typeof v.valueBool !== 'boolean') {
          errors.push({ fieldCode: fd.code, sectionCode: fd.sectionCode, message: fd.labelVi + ': phải chọn Có hoặc Không.', rejectedValue: v.valueBool });
        }
      } else if (fd.dataType === 'single_choice') {
        const validOpt = (fd.options || []).some(function (o) { return o.id === v.fieldOptionId; });
        if (!validOpt) {
          errors.push({ fieldCode: fd.code, sectionCode: fd.sectionCode, message: fd.labelVi + ': lựa chọn không nằm trong danh mục hợp lệ.', rejectedValue: v.fieldOptionId });
        }
      } else if (fd.dataType === 'multi_choice') {
        if (!Array.isArray(v.selectedOptions) || v.selectedOptions.length === 0) {
          errors.push({ fieldCode: fd.code, sectionCode: fd.sectionCode, message: fd.labelVi + ': cần chọn ít nhất một mục hoặc chọn Chưa rõ.', rejectedValue: null });
        }
      }
    });

    // Synchronize contrast media allergy tri-state for v1.1 (storageLevel='visit_value')
    const contrastDef = effectiveDefs.find(function (f) { return f.code === 'di_ung_thuoc_can_quang' && f.storageLevel === 'visit_value'; });
    if (contrastDef) {
      const answer = values.find(function (v) { return v.fieldDefinitionId === contrastDef.id || v.fieldCode === contrastDef.code; });
      const allergies = Array.isArray(payload.allergies) ? payload.allergies : [];
      const hasContrast = allergies.some(function (a) { return a && a.agentCategory === 'contrast_media'; });
      const allergyState = payload.allergyListState !== undefined ? payload.allergyListState : (allergies.length > 0 ? 'known' : 'unknown');
      const positive = Boolean(answer && answer.valueState === 'answered' && answer.valueBool === true);
      if (hasContrast && !answer) {
        values.push({
          fieldDefinitionId: contrastDef.id,
          fieldCode: contrastDef.code,
          valueState: 'answered',
          valueBool: true,
          valueNum: null,
          valueText: null,
          valueDate: null,
          fieldOptionId: null,
          selectedOptions: [],
          unit: null
        });
      } else if ((hasContrast && !positive) || (positive && allergyState === 'none')) {
        errors.push({
          fieldCode: contrastDef.code,
          sectionCode: 'thuoc_di_ung',
          message: 'Trạng thái dị ứng cản quang mâu thuẫn với danh sách dị ứng; hãy rà lại cả câu trả lời và các dòng tác nhân.',
          rejectedValue: null
        });
      }
    }

    // List-state consistency checks (known requires rows; none/unknown must have 0 rows)
    [
      ['medication', 'medicationListState', payload.medications || [], 'thuoc_di_ung'],
      ['allergy', 'allergyListState', payload.allergies || [], 'thuoc_di_ung'],
      ['diagnosis', 'diagnosisListState', payload.diagnoses || [], 'benh_su_dong_mac']
    ].forEach(function (spec) {
      const rawState = payload[spec[1]];
      if (rawState !== undefined && rawState !== null) {
        const hasRows = spec[2].length > 0;
        if ((rawState === 'known') !== hasRows) {
          errors.push({
            fieldCode: spec[0] + '_list_state',
            sectionCode: spec[3],
            message: 'Trạng thái danh sách "Có" cần có ít nhất 1 dòng; "Không có" / "Chưa rõ" không được kèm dòng dữ liệu.',
            rejectedValue: rawState
          });
        }
      }
    });

    // Diagnoses ICD-10 checks
    if (Array.isArray(payload.diagnoses) && payload.diagnoses.length > 0) {
      const seenIcd = {};
      let primaryCount = 0;
      payload.diagnoses.forEach(function (d, idx) {
        const code = String((d && d.code) || '').trim().toUpperCase();
        const disp = String((d && d.display) || '').trim();
        if (!/^[A-Z]\d{2}(?:\.[A-Z0-9]{1,4})?$/.test(code)) {
          errors.push({ fieldCode: 'icd_code', sectionCode: 'benh_su_dong_mac', message: 'ICD #' + (idx + 1) + ': mã ICD-10 không đúng định dạng.', rejectedValue: code });
        }
        if (seenIcd[code]) {
          errors.push({ fieldCode: 'icd_code', sectionCode: 'benh_su_dong_mac', message: 'Mã ICD-10 bị trùng: ' + code, rejectedValue: code });
        }
        seenIcd[code] = true;
        if (!disp) {
          errors.push({ fieldCode: 'icd_display', sectionCode: 'benh_su_dong_mac', message: 'ICD #' + (idx + 1) + ': bắt buộc nhập tên bệnh.', rejectedValue: disp });
        }
        if (d.role === 'primary') primaryCount += 1;
      });
      if (primaryCount > 1) {
        errors.push({ fieldCode: 'icd_role', sectionCode: 'benh_su_dong_mac', message: 'Chỉ được phép có tối đa 1 chẩn đoán chính.', rejectedValue: primaryCount });
      }
    }

    (payload.orthostaticBp || []).forEach(function (bp, idx) {
      const sys = Number(bp.systolic);
      const dia = Number(bp.diastolic);
      if (!isFinite(sys) || sys < 40 || sys > 300) {
        errors.push({ fieldCode: 'huyet_ap_tam_thu', sectionCode: 'sinh_ton_kham', message: 'Lần đo HA #' + (idx + 1) + ': Tâm thu phải nằm trong 40–300 mmHg.', rejectedValue: bp.systolic });
      }
      if (!isFinite(dia) || dia < 20 || dia > 200) {
        errors.push({ fieldCode: 'huyet_ap_tam_truong', sectionCode: 'sinh_ton_kham', message: 'Lần đo HA #' + (idx + 1) + ': Tâm trương phải nằm trong 20–200 mmHg.', rejectedValue: bp.diastolic });
      }
      if (isFinite(sys) && isFinite(dia) && dia >= sys) {
        errors.push({ fieldCode: 'huyet_ap_tam_thu', sectionCode: 'sinh_ton_kham', message: 'Lần đo HA #' + (idx + 1) + ': Huyết áp tâm trương (' + dia + ') phải nhỏ hơn tâm thu (' + sys + ').', rejectedValue: dia });
      }
      if (bp.heartRate !== null && bp.heartRate !== undefined && bp.heartRate !== '') {
        const hr = Number(bp.heartRate);
        if (!isFinite(hr) || hr < 20 || hr > 300) {
          errors.push({ fieldCode: 'mach', sectionCode: 'sinh_ton_kham', message: 'Lần đo HA #' + (idx + 1) + ': Nhịp tim phải nằm trong 20–300 lần/phút.', rejectedValue: bp.heartRate });
        }
      }
      if (!bp.measuredAt || !Number.isFinite(Date.parse(bp.measuredAt))) {
        errors.push({ fieldCode: 'thoi_diem_do_ha', sectionCode: 'sinh_ton_kham', message: 'Lần đo HA #' + (idx + 1) + ': bắt buộc có thời điểm đo.', rejectedValue: null });
      }
    });

    (payload.medications || []).forEach(function (med, idx) {
      if (med.medicationGroup !== 'prescribed' && med.medicationGroup !== 'otc_supplement_tcm') {
        errors.push({ fieldCode: 'thuoc_ghi_nhan', sectionCode: 'thuoc_di_ung', message: 'Thuốc #' + (idx + 1) + ': phân nhóm thuốc không hợp lệ.', rejectedValue: med.medicationGroup });
      }
      if (!med.drugName || !String(med.drugName).trim()) {
        errors.push({ fieldCode: 'thuoc_ghi_nhan', sectionCode: 'thuoc_di_ung', message: 'Bản ghi thuốc #' + (idx + 1) + ': bắt buộc nhập tên thuốc.', rejectedValue: null });
      }
      if (med.dose !== null && med.dose !== undefined && med.dose !== '' && Number(med.dose) <= 0) {
        errors.push({ fieldCode: 'thuoc_ghi_nhan', sectionCode: 'thuoc_di_ung', message: 'Bản ghi thuốc #' + (idx + 1) + ': liều dùng phải lớn hơn 0.', rejectedValue: med.dose });
      }
    });

    (payload.allergies || []).forEach(function (alg, idx) {
      if (!alg.allergen || !String(alg.allergen).trim()) {
        errors.push({ fieldCode: 'di_ung_adr', sectionCode: 'thuoc_di_ung', message: 'Bản ghi dị ứng #' + (idx + 1) + ': bắt buộc nhập tác nhân gây dị ứng/ADR.', rejectedValue: null });
      }
    });

    (payload.labResults || []).forEach(function (lab, idx) {
      const fd = defMap[lab.labCode];
      if (!fd || fd.storageLevel !== 'lab_result') {
        errors.push({ fieldCode: lab.labCode || 'can_lam_sang', sectionCode: 'can_lam_sang', message: 'Kết quả CLS #' + (idx + 1) + ': vui lòng chọn loại xét nghiệm / thăm dò.', rejectedValue: lab.labCode });
        return;
      }
      if (!lab.measuredAt || !Number.isFinite(Date.parse(lab.measuredAt))) {
        errors.push({ fieldCode: fd.code, sectionCode: 'can_lam_sang', message: fd.labelVi + ' (#' + (idx + 1) + '): bắt buộc nhập thời điểm lấy mẫu/thực hiện.', rejectedValue: null });
      }
      if (fd.dataType === 'number' || fd.dataType === 'integer') {
        if (lab.valueNum === null || lab.valueNum === undefined || lab.valueNum === '' || isNaN(Number(lab.valueNum))) {
          errors.push({ fieldCode: fd.code, sectionCode: 'can_lam_sang', message: fd.labelVi + ' (#' + (idx + 1) + '): bắt buộc nhập giá trị số hợp lệ.', rejectedValue: lab.valueNum });
        } else {
          const n = Number(lab.valueNum);
          if (fd.minValue !== null && fd.minValue !== undefined && n < fd.minValue) {
            errors.push({ fieldCode: fd.code, sectionCode: 'can_lam_sang', message: fd.labelVi + ' không được nhỏ hơn ' + fd.minValue + (fd.canonicalUnit ? ' ' + fd.canonicalUnit : '') + '.', rejectedValue: n });
          }
          if (fd.maxValue !== null && fd.maxValue !== undefined && n > fd.maxValue) {
            errors.push({ fieldCode: fd.code, sectionCode: 'can_lam_sang', message: fd.labelVi + ' không được vượt quá ' + fd.maxValue + (fd.canonicalUnit ? ' ' + fd.canonicalUnit : '') + '.', rejectedValue: n });
          }
        }
      }
    });

    return errors;
  }

  function buildVisitReview(db, visit) {
    const formVer = db.formVersions.find(function (fv) { return fv.id === visit.formVersionId; });
    const defMap = findFieldDefMap(db, formVer);
    const valByDefId = {};
    (visit.values || []).forEach(function (v) { valByDefId[v.fieldDefinitionId] = v; });

    const validationErrors = validateVisitPayload(db, visit, visit);
    const errCountBySection = {};
    validationErrors.forEach(function (e) {
      const sc = e.sectionCode || 'ghi_chu';
      errCountBySection[sc] = (errCountBySection[sc] || 0) + 1;
    });

    const tier3ConfirmErrors = clone(validationErrors);
    const sections = [];
    let totalAnswered = 0;
    let totalUnfilled = 0;
    let totalUnknown = 0;

    function isFieldSatisfied(fd) {
      if (fd.storageLevel === 'patient') return true;
      if (fd.storageLevel === 'computed') {
        if (fd.code === 'bmi') {
          const h = (visit.values || []).find(function (x) { return x.fieldCode === 'chieu_cao_cm' && x.valueState === 'answered'; });
          const w = (visit.values || []).find(function (x) { return x.fieldCode === 'can_nang_kg' && x.valueState === 'answered'; });
          return Boolean(h && w);
        }
        if (fd.code === 'so_luong_thuoc_dong_thoi') return (visit.medications || []).length > 0;
        if (fd.code === 'luot_tuoi') {
          const pt = db.patients.find(function (p) { return p.id === visit.patientId; });
          return pt ? computeAge(pt, visit.visitDate) !== null : false;
        }
        return false;
      }
      if (fd.storageLevel === 'orthostatic_bp') return (visit.orthostaticBp || []).length > 0;
      if (fd.storageLevel === 'medication') return (visit.medications || []).length > 0 || visit.medicationListState === 'none';
      if (fd.storageLevel === 'allergy') {
        if (fd.code === 'di_ung_thuoc_can_quang') {
          return (visit.allergies || []).some(function (a) { return a.agentCategory === 'contrast_media'; });
        }
        return (visit.allergies || []).length > 0 || visit.allergyListState === 'none';
      }
      if (fd.storageLevel === 'lab_result') {
        return (visit.labResults || []).some(function (l) {
          return l.labCode === fd.code || fd.code === 'cls_don_vi' || fd.code === 'cls_thoi_diem';
        });
      }
      const val = valByDefId[fd.id];
      return Boolean(val && val.valueState === 'answered');
    }

    (formVer ? formVer.sections : []).forEach(function (sec) {
      let ans = 0;
      let unf = 0;
      let unk = 0;
      (sec.fields || []).forEach(function (ff) {
        if (!ff.isVisible) return;
        const fd = defMap[ff.fieldDefinitionId];
        if (!fd) return;
        if (fd.storageLevel === 'visit_value') {
          const val = valByDefId[fd.id];
          if (!val) {
            unf += 1;
            if (ff.requiredForConfirm) {
              tier3ConfirmErrors.push({
                fieldCode: fd.code,
                sectionCode: sec.sectionCode,
                message: (ff.customLabelVi || fd.labelVi) + ' là trường bắt buộc khi xác nhận lượt khám (Tầng 3).',
                rejectedValue: null
              });
            }
          } else if (val.valueState === 'unknown') {
            unk += 1;
          } else {
            ans += 1;
          }
        } else if (isFieldSatisfied(fd)) {
          ans += 1;
        } else {
          unf += 1;
        }
      });
      totalAnswered += ans;
      totalUnfilled += unf;
      totalUnknown += unk;
      sections.push({
        sectionCode: sec.sectionCode,
        titleVi: sec.titleVi,
        answeredCount: ans,
        unfilledCount: unf,
        unknownCount: unk,
        errorCount: errCountBySection[sec.sectionCode] || 0
      });
    });

    // Tier 4 AI module readiness (informational only — NEVER blocks confirmVisit per K1!)
    const moduleRequiredMap = {
      ai_diagnosis: ['kho_tho_khi_gang_suc', 'chieu_cao_cm', 'can_nang_kg', 'mach', 'spo2', 'cls_nt_probnp', 'cls_lvef'],
      ai_lab_test: ['kho_tho_khi_gang_suc', 'ts_dai_thao_duong', 'ts_benh_than_man', 'cls_creatinin', 'cls_kali'],
      ai_treatment: ['nyha_hien_tai', 'cls_lvef', 'cls_egfr', 'cls_kali', 'huyet_ap_tam_thu'],
      ai_medsafety: ['thuoc_ghi_nhan', 'di_ung_adr', 'cls_creatinin', 'cls_kali', 'cls_natri']
    };

    const tier4AiModules = ['ai_diagnosis', 'ai_lab_test', 'ai_treatment', 'ai_medsafety'].map(function (modCode) {
      const contrastOverride = ((formVer && formVer.definitionOverrides) || {}).di_ung_thuoc_can_quang;
      if (contrastOverride && contrastOverride.storageLevel === 'visit_value') {
        // HF quality is evaluated by the server; static mode cannot export this contract.
        return {
          aiModuleCode: modCode,
          ready: false,
          missingFieldCodes: [],
          issues: [{ issueCode: 'STATIC_EXPORT_UNAVAILABLE', fieldCode: null,
            messageVi: 'Bản demo tĩnh chưa đánh giá được chất lượng JSON HF; dùng bản có máy chủ để kiểm tra và xuất AI.' }]
        };
      }
      const reqCodes = moduleRequiredMap[modCode] || [];
      const missing = [];
      reqCodes.forEach(function (code) {
        const fd = defMap[code];
        if (!fd || !isFieldSatisfied(fd)) {
          missing.push(code);
        }
      });
      return {
        aiModuleCode: modCode,
        ready: missing.length === 0,
        missingFieldCodes: missing,
        issues: []
      };
    });

    return {
      visitId: visit.id,
      formVersionId: visit.formVersionId,
      rowVersion: visit.rowVersion,
      readinessTier: visit.status === 'confirmed'
        ? (tier4AiModules.every(function (m) { return m.ready; }) ? 'ai_ready' : 'confirmed')
        : 'draft_saved',
      canConfirm: tier3ConfirmErrors.length === 0,
      totalAnswered: totalAnswered,
      totalUnfilled: totalUnfilled,
      totalUnknown: totalUnknown,
      totalErrors: tier3ConfirmErrors.length,
      sections: sections,
      tier3ConfirmErrors: tier3ConfirmErrors,
      tier4AiModules: tier4AiModules
    };
  }

  function buildAiInputPayload(db, visit) {
    const pt = db.patients.find(function (p) { return p.id === visit.patientId; });
    const defMap = findFieldDefMap(db);
    const valuesMap = {};

    (visit.values || []).forEach(function (v) {
      const fd = defMap[v.fieldDefinitionId] || defMap[v.fieldCode];
      if (!fd) return;
      if (v.valueState === 'unknown') {
        valuesMap[fd.code] = { state: 'unknown', value: null, unit: null };
        return;
      }
      let outVal = null;
      if (fd.dataType === 'boolean') outVal = v.valueBool;
      else if (fd.dataType === 'number' || fd.dataType === 'integer') outVal = v.valueNum;
      else if (fd.dataType === 'text') outVal = v.valueText;
      else if (fd.dataType === 'date') outVal = v.valueDate;
      else if (fd.dataType === 'single_choice') {
        const opt = (fd.options || []).find(function (o) { return o.id === v.fieldOptionId; });
        outVal = opt ? opt.optionCode : v.fieldOptionId;
      } else if (fd.dataType === 'multi_choice') {
        outVal = (v.selectedOptions || []).map(function (so) {
          const opt = (fd.options || []).find(function (o) { return o.id === so.fieldOptionId; });
          return opt ? opt.optionCode : so.fieldOptionId;
        });
      }
      valuesMap[fd.code] = {
        state: 'answered',
        value: outVal,
        unit: v.unit || fd.canonicalUnit || null
      };
    });

    // Computed fields in same visit
    if (pt) {
      const age = computeAge(pt, visit.visitDate);
      if (age !== null) {
        valuesMap.luot_tuoi = { state: 'answered', value: age, unit: 'tuổi' };
      }
      valuesMap.bn_gioi_tinh = { state: pt.sex === 'unknown' ? 'unknown' : 'answered', value: pt.sex === 'unknown' ? null : pt.sex, unit: null };
    }
    if (valuesMap.chieu_cao_cm && valuesMap.chieu_cao_cm.state === 'answered' &&
        valuesMap.can_nang_kg && valuesMap.can_nang_kg.state === 'answered') {
      const bmi = computeBmi(valuesMap.chieu_cao_cm.value, valuesMap.can_nang_kg.value);
      if (bmi !== null) {
        valuesMap.bmi = { state: 'answered', value: bmi, unit: 'kg/m²' };
      }
    }
    const activeMedCount = (visit.medications || []).filter(function (m) { return m.status === 'active'; }).length;
    if ((visit.medications || []).length > 0) {
      valuesMap.so_luong_thuoc_dong_thoi = { state: 'answered', value: activeMedCount, unit: 'thuốc' };
    }

    const review = buildVisitReview(db, visit);
    return {
      visitId: visit.id,
      patientCode: pt ? pt.patientCode : 'BN-00000',
      formVersionId: visit.formVersionId,
      revisionNo: visit.currentRevisionNo,
      confirmedAt: visit.confirmedAt,
      confirmedBy: visit.confirmedBy,
      values: valuesMap,
      orthostaticBp: clone(visit.orthostaticBp || []),
      medications: clone(visit.medications || []),
      allergies: clone(visit.allergies || []),
      labResults: clone(visit.labResults || []),
      modules: review.tier4AiModules
    };
  }

  function stripVisitArrays(v, db) {
    const updatedById = v.updatedBy || v.createdBy;
    return {
      id: v.id,
      visitCode: v.visitCode,
      performedBy: v.createdBy,
      performedByName: db ? findUserName(db, v.createdBy) : null,
      updatedBy: updatedById,
      updatedByName: db ? findUserName(db, updatedById) : null,
      externalVisitCode: v.externalVisitCode || null,
      patientId: v.patientId,
      formVersionId: v.formVersionId,
      visitDate: v.visitDate,
      visitType: v.visitType,
      chiefComplaint: v.chiefComplaint || null,
      clinicalNote: v.clinicalNote || null,
      infoSource: v.infoSource || null,
      medicationListState: v.medicationListState || ((v.medications && v.medications.length > 0) ? 'known' : 'unknown'),
      allergyListState: v.allergyListState || ((v.allergies && v.allergies.length > 0) ? 'known' : 'unknown'),
      diagnosisListState: v.diagnosisListState || ((v.diagnoses && v.diagnoses.length > 0) ? 'known' : 'unknown'),
      status: v.status,
      currentRevisionNo: v.currentRevisionNo,
      createdBy: v.createdBy,
      createdAt: v.createdAt,
      updatedAt: v.updatedAt,
      confirmedAt: v.confirmedAt || null,
      confirmedBy: v.confirmedBy || null,
      confirmNote: v.confirmNote || null,
      rowVersion: v.rowVersion
    };
  }

  function formatVersionSummary(db, fv) {
    const count = db.visits.filter(function (v) { return v.formVersionId === fv.id; }).length;
    return {
      id: fv.id,
      formTemplateId: fv.formTemplateId,
      versionNo: fv.versionNo,
      versionLabel: fv.versionLabel,
      status: fv.status,
      basedOnVersionId: fv.basedOnVersionId || null,
      changeNote: fv.changeNote || null,
      createdBy: fv.createdBy,
      createdAt: fv.createdAt,
      publishedAt: fv.publishedAt || null,
      publishedBy: fv.publishedBy || null,
      rowVersion: fv.rowVersion,
      visitCount: count
    };
  }

  function permissionMatrixForRole(role) {
    if (role === 'doctor') {
      return {
        role: 'doctor',
        clinicalDataAccessAllowed: true,
        separationNoticeVi: 'Vai trò Bác sĩ (doctor) được phép quản lý hồ sơ bệnh nhân, nhập và xác nhận dữ liệu lượt khám; không có quyền truy cập phân hệ Quản trị tài khoản, Biểu mẫu hay Nhật ký hệ thống.',
        grantedPermissions: [
          { code: 'patients:read_write', labelVi: 'Tìm kiếm, tạo mới và cập nhật hành chính hồ sơ bệnh nhân (BN-xxxxx)', category: 'clinical' },
          { code: 'visits:draft', labelVi: 'Tạo lượt khám, nhập dữ liệu 8 nhóm + 4 bảng lặp và lưu nháp', category: 'clinical' },
          { code: 'visits:confirm', labelVi: 'Xem lại dữ liệu lượt khám và xác nhận lượt khám (Tầng 3)', category: 'clinical' },
          { code: 'visits:revise', labelVi: 'Tạo bản sửa mới (visit_revision) kèm lý do sau khi xác nhận', category: 'clinical' },
          { code: 'visits:ai_input_export', labelVi: 'Xuất gói dữ liệu chuẩn AiInputPayload của lượt khám đã xác nhận', category: 'clinical' }
        ],
        deniedPermissions: [
          { code: 'admin_users:manage', labelVi: 'Tạo, phân quyền, khóa/mở hoặc đặt lại mật khẩu tài khoản hệ thống', category: 'administration' },
          { code: 'admin_forms:manage', labelVi: 'Tạo bản nháp, chỉnh sửa cấu trúc và phát hành phiên bản biểu mẫu', category: 'administration' },
          { code: 'admin_audit:read', labelVi: 'Tra cứu nhật ký kiểm toán hệ thống toàn cục', category: 'audit' }
        ]
      };
    }
    return {
      role: 'admin',
      clinicalDataAccessAllowed: false,
      separationNoticeVi: 'Vai trò Quản trị viên (admin) bị tách biệt hoàn toàn khỏi quyền đọc và chỉnh sửa bệnh án lâm sàng (K8). Mọi truy cập vào hồ sơ bệnh nhân hoặc lượt khám đều bị chặn 403.',
      grantedPermissions: [
        { code: 'admin_users:manage', labelVi: 'Quản lý tài khoản hệ thống, xem trước quyền, khóa/mở và đặt lại mật khẩu', category: 'administration' },
        { code: 'admin_forms:manage', labelVi: 'Quản lý vòng đời phiên bản biểu mẫu (Bản nháp, Xem trước, Diff, Phát hành)', category: 'administration' },
        { code: 'admin_audit:read', labelVi: 'Tra cứu nhật ký kiểm toán hệ thống (chỉ siêu dữ liệu, che giấu PHI và mật khẩu)', category: 'audit' }
      ],
      deniedPermissions: [
        { code: 'patients:read_write', labelVi: 'Đọc hoặc sửa hồ sơ bệnh nhân lâm sàng (bị chặn 403 theo chốt K8)', category: 'clinical' },
        { code: 'visits:draft', labelVi: 'Đọc chi tiết, nhập liệu hoặc lưu nháp lượt khám bệnh nhân', category: 'clinical' },
        { code: 'visits:confirm', labelVi: 'Xác nhận dữ liệu lượt khám hoặc xuất dữ liệu lâm sàng', category: 'clinical' }
      ]
    };
  }

  const StaticRuntime = {
    ApiError: StaticApiError,

    async resetLocalData() {
      authEpoch += 1;
      global.localStorage.removeItem(STORAGE_KEY);
      setSession(null);
      await loadDb();
    },

    /* ---------------- M1: Auth ---------------- */
    async login(payload) {
      const epoch = ++authEpoch;
      let db = await loadDb();
      const uname = String((payload && payload.username) || '').trim();
      const pwd = String((payload && payload.password) || '');
      if (!uname || !pwd) {
        throw new StaticApiError(422, 'VALIDATION_ERROR', 'Thiếu thông tin đăng nhập', 'Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.');
      }
      let user = db.users.find(function (u) { return u.username.toLowerCase() === uname.toLowerCase(); });
      const stamp = user && credentialStamp(user);
      const valid = user && await verifyPassword(user, pwd);
      db = readStoredDb();
      if (!db) throw new StaticApiError(401, 'UNAUTHORIZED', 'Thông tin đăng nhập đã thay đổi', 'Vui lòng đăng nhập lại.');
      user = db.users.find(function (u) { return u.username.toLowerCase() === uname.toLowerCase(); });
      if (epoch !== authEpoch) throw new StaticApiError(401, 'UNAUTHORIZED', 'Phiên đăng nhập đã thay đổi', 'Vui lòng đăng nhập lại.');
      if (!valid || !user || credentialStamp(user) !== stamp) {
        appendAudit(db, user || null, 'login_failed', 'user_session', null, 'failure', { attemptedUsername: uname });
        saveDb(db);
        throw new StaticApiError(401, 'INVALID_CREDENTIALS', 'Đăng nhập thất bại', 'Sai tên đăng nhập hoặc mật khẩu.');
      }
      if (!user.isActive) {
        appendAudit(db, user, 'login_failed', 'user_session', user.id, 'denied', { reason: 'ACCOUNT_LOCKED' });
        saveDb(db);
        throw new StaticApiError(403, 'ACCOUNT_LOCKED', 'Tài khoản đã bị tạm khóa', 'Tài khoản đã bị tạm khóa — vui lòng liên hệ Quản trị viên.');
      }
      const nowIso = new Date().toISOString();
      user.lastLoginAt = nowIso;
      user.updatedAt = nowIso;
      const accessToken = 'static-jwt-' + makeUuid();
      const refreshToken = 'static-rt-' + makeUuid();
      setSession({ userId: user.id, role: user.role, accessToken: accessToken, refreshToken: refreshToken, credentialVersion: user.credentialVersion || 0 });
      appendAudit(db, user, 'login', 'user_session', user.id, 'success', { role: user.role });
      saveDb(db);
      return {
        accessToken: accessToken,
        refreshToken: refreshToken,
        tokenType: 'Bearer',
        expiresIn: 900,
        user: sanitizeUser(user)
      };
    },

    async refreshToken() {
      const db = await loadDb();
      const user = requireAuth(db, ['doctor', 'admin'], 'user_session');
      const sess = getSession();
      sess.accessToken = 'static-jwt-' + makeUuid();
      setSession(sess);
      return {
        accessToken: sess.accessToken,
        refreshToken: sess.refreshToken,
        tokenType: 'Bearer',
        expiresIn: 900,
        user: sanitizeUser(user)
      };
    },

    async logout() {
      const epoch = ++authEpoch;
      const sess = getSession();
      await loadDb();
      const db = readStoredDb();
      if (db && sess && sess.userId) {
        const user = db.users.find(function (u) { return u.id === sess.userId; });
        if (user) {
          appendAudit(db, user, 'logout', 'user_session', user.id, 'success', {});
          saveDb(db);
        }
      }
      if (epoch === authEpoch) setSession(null);
      return null;
    },

    async getCurrentUser() {
      const db = await loadDb();
      const user = requireAuth(db, ['doctor', 'admin'], 'user_session');
      return sanitizeUser(user);
    },

    async changePassword(payload) {
      let db = await loadDb();
      let user = requireAuth(db, ['doctor', 'admin'], 'user_session');
      const session = getSession();
      const epoch = authEpoch;
      const stamp = credentialStamp(user);
      const current = payload && payload.currentPassword;
      const next = payload && payload.newPassword;
      function invalid(field, message, code) {
        return new StaticApiError(422, code || 'FIELD_VALIDATION_FAILED', 'Chưa đổi được mật khẩu', message, { errors: [{ fieldCode: field, message: message }] });
      }
      if (typeof current !== 'string' || Array.from(current).length < 1 || Array.from(current).length > 128) {
        throw invalid('currentPassword', 'Mật khẩu hiện tại phải có từ 1 đến 128 ký tự.');
      }
      if (typeof next !== 'string' || Array.from(next).length < 8 || Array.from(next).length > 128 || next === current) {
        throw invalid('newPassword', 'Mật khẩu mới phải có từ 8 đến 128 ký tự và khác mật khẩu hiện tại.');
      }
      const valid = await verifyPassword(user, current);
      const salt = Array.from(global.crypto.getRandomValues(new Uint8Array(16)));
      const hash = valid ? await derivePassword(next, salt, 600000) : null;
      // Read and commit without yielding so a stale attempt cannot clear a newer session.
      db = readStoredDb();
      if (!db) throw invalid('currentPassword', 'Thông tin đăng nhập đã thay đổi. Vui lòng thử lại.', 'CURRENT_PASSWORD_INCORRECT');
      user = requireAuth(db, ['doctor', 'admin'], 'user_session');
      const activeSession = getSession();
      if (epoch !== authEpoch || user.id !== session.userId || activeSession.accessToken !== session.accessToken || credentialStamp(user) !== stamp) {
        throw invalid('currentPassword', 'Thông tin đăng nhập đã thay đổi. Vui lòng thử lại.', 'CURRENT_PASSWORD_INCORRECT');
      }
      if (!valid) throw invalid('currentPassword', 'Mật khẩu hiện tại chưa đúng.', 'CURRENT_PASSWORD_INCORRECT');
      user.passwordVerifier = { salt: salt, hash: hash, iterations: 600000 };
      delete user.passwordSecret;
      user.credentialVersion = (user.credentialVersion || 0) + 1;
      user.rowVersion = (user.rowVersion || 1) + 1;
      user.updatedAt = new Date().toISOString();
      activeSession.credentialVersion = user.credentialVersion;
      appendAudit(db, user, 'user_update', 'app_user', user.id, 'success', { event: 'password_changed' });
      saveDb(db);
      setSession(activeSession);
      return sanitizeUser(user);
    },

    /* ---------------- M2 & M3: Patients ---------------- */
    async listPatients(params) {
      const db = await loadDb();
      const actor = requireAuth(db, ['doctor'], 'patient');
      const opts = params || {};
      const q = String(opts.q || '').trim().toLowerCase();
      const statusFilter = opts.latestVisitStatus || '';

      let items = db.patients.map(function (pt) {
        const access = resolvePatientAccess(db, pt.id, actor.id);
        if (!access) return null;
        const pVisits = db.visits
          .filter(function (v) { return v.patientId === pt.id; })
          .sort(function (a, b) { return new Date(b.visitDate) - new Date(a.visitDate); });
        const latest = pVisits[0] || null;
        return {
          patient: formatPatientOut(db, pt, access),
          visitCount: pVisits.length,
          latestVisitId: latest ? latest.id : null,
          latestVisitCode: latest ? latest.visitCode : null,
          latestVisitDate: latest ? latest.visitDate : null,
          latestVisitStatus: latest ? latest.status : 'none'
        };
      }).filter(Boolean);

      if (q) {
        items = items.filter(function (item) {
          return item.patient.patientCode.toLowerCase().indexOf(q) >= 0 ||
            item.patient.fullName.toLowerCase().indexOf(q) >= 0 ||
            (item.patient.externalPatientCode && item.patient.externalPatientCode.toLowerCase().indexOf(q) >= 0);
        });
      }
      if (statusFilter && ['draft', 'confirmed', 'none'].indexOf(statusFilter) >= 0) {
        items = items.filter(function (item) { return item.latestVisitStatus === statusFilter; });
      }
      items.sort(function (a, b) {
        return new Date(b.patient.updatedAt) - new Date(a.patient.updatedAt);
      });
      return paginate(items, opts.page, opts.pageSize || 50);
    },

    async createPatient(payload) {
      const db = await loadDb();
      const actor = requireAuth(db, ['doctor'], 'patient');
      const errors = [];
      const fullName = String((payload && payload.fullName) || '').trim();
      const sex = payload && payload.sex;
      if (fullName.length < 2) {
        errors.push({ fieldCode: 'fullName', sectionCode: 'hanh_chinh', message: 'Họ tên / ký hiệu hồ sơ phải có ít nhất 2 ký tự.', rejectedValue: fullName });
      }
      if (['male', 'female', 'unknown'].indexOf(sex) === -1) {
        errors.push({ fieldCode: 'sex', sectionCode: 'hanh_chinh', message: 'Giới tính phải là Nam, Nữ hoặc Chưa rõ.', rejectedValue: sex });
      }
      const birthDate = payload.birthDate || null;
      const birthYear = payload.birthYear !== null && payload.birthYear !== undefined && payload.birthYear !== '' ? Number(payload.birthYear) : null;
      const declaredAge = payload.declaredAge !== null && payload.declaredAge !== undefined && payload.declaredAge !== '' ? Number(payload.declaredAge) : null;
      const birthKinds = [birthDate, birthYear, declaredAge].filter(function (x) { return x !== null; }).length;
      if (birthKinds > 1) {
        errors.push({ fieldCode: 'birthDate', sectionCode: 'hanh_chinh', message: 'Chỉ chọn một mức độ chính xác cho ngày sinh / năm sinh / tuổi ước lượng.', rejectedValue: null });
      }
      if (birthYear !== null && (!Number.isInteger(birthYear) || birthYear < 1900 || birthYear > 2100)) {
        errors.push({ fieldCode: 'birthYear', sectionCode: 'hanh_chinh', message: 'Năm sinh phải là số nguyên từ 1900 đến 2100.', rejectedValue: birthYear });
      }
      if (declaredAge !== null && (!Number.isInteger(declaredAge) || declaredAge < 0 || declaredAge > 120)) {
        errors.push({ fieldCode: 'declaredAge', sectionCode: 'hanh_chinh', message: 'Tuổi ước lượng phải là số nguyên từ 0 đến 120.', rejectedValue: declaredAge });
      }
      if (errors.length > 0) {
        throw new StaticApiError(422, 'FIELD_VALIDATION_FAILED', 'Dữ liệu hành chính không hợp lệ', errors[0].message, { errors: errors });
      }

      const seq = db.nextPatientSeq || 104;
      db.nextPatientSeq = seq + 1;
      const patientCode = 'BN-' + String(seq).padStart(5, '0');
      const nowIso = new Date().toISOString();
      const pt = {
        id: makeUuid(),
        patientCode: patientCode,
        externalPatientCode: payload.externalPatientCode ? String(payload.externalPatientCode).trim() : null,
        fullName: fullName,
        sex: sex,
        birthDate: birthDate,
        birthYear: birthYear,
        declaredAge: declaredAge,
        rowVersion: 1,
        createdBy: actor.id,
        createdAt: nowIso,
        updatedAt: nowIso
      };
      db.patients.unshift(pt);
      const assignmentId = makeUuid();
      db.careAssignments = db.careAssignments || [];
      db.careAssignments.unshift({
        id: assignmentId,
        patientId: pt.id,
        doctorUserId: actor.id,
        assignedAt: nowIso,
        assignedBy: actor.id,
        reason: 'Phân công mặc định cho bác sĩ tạo hồ sơ.',
        revokedAt: null,
        revokedBy: null
      });
      appendAudit(db, actor, 'patient_create', 'patient', pt.id, 'success', { patientCode: pt.patientCode });
      saveDb(db);
      return formatPatientOut(db, pt, { assignmentId: assignmentId, assignedAt: nowIso, assignedBy: actor.id });
    },

    async getPatient(patientId) {
      const db = await loadDb();
      const actor = requireAuth(db, ['doctor'], 'patient');
      const check = requirePatientAccess(db, patientId, actor);
      const pt = check.patient;
      const pVisits = db.visits
        .filter(function (v) { return v.patientId === pt.id; })
        .sort(function (a, b) { return new Date(b.visitDate) - new Date(a.visitDate); });
      const refVisit = pVisits.find(function (v) { return v.status === 'confirmed'; }) || pVisits[0] || null;
      let latestVisitSummary = null;
      if (refVisit) {
        const hVal = (refVisit.values || []).find(function (v) { return v.fieldCode === 'chieu_cao_cm' && v.valueState === 'answered'; });
        const wVal = (refVisit.values || []).find(function (v) { return v.fieldCode === 'can_nang_kg' && v.valueState === 'answered'; });
        const heightCm = hVal ? hVal.valueNum : null;
        const weightKg = wVal ? wVal.valueNum : null;
        const fv = db.formVersions.find(function (f) { return f.id === refVisit.formVersionId; });
        latestVisitSummary = {
          sourceVisitId: refVisit.id,
          sourceVisitCode: refVisit.visitCode,
          sourceVisitDate: refVisit.visitDate,
          sourceVisitStatus: refVisit.status,
          sourceFormVersionId: refVisit.formVersionId,
          sourceFormVersionLabel: fv ? fv.versionLabel : 'v1',
          sourceRowVersion: refVisit.rowVersion,
          heightCm: heightCm,
          weightKg: weightKg,
          bmi: computeBmi(heightCm, weightKg),
          latestBp: (refVisit.orthostaticBp && refVisit.orthostaticBp[0]) ? clone(refVisit.orthostaticBp[0]) : null,
          recordedMedications: clone(refVisit.medications || []),
          recordedAllergies: clone(refVisit.allergies || [])
        };
      }
      return {
        patient: formatPatientOut(db, pt, check.access),
        latestVisitSummary: latestVisitSummary
      };
    },

    async updatePatient(patientId, payload, ifMatch) {
      const db = await loadDb();
      const actor = requireAuth(db, ['doctor'], 'patient');
      const check = requirePatientAccess(db, patientId, actor);
      const pt = check.patient;
      const expected = parseIfMatch(ifMatch, payload && payload.rowVersion);
      if (expected === null || expected !== pt.rowVersion) {
        throw new StaticApiError(409, 'CONCURRENCY_ROW_VERSION_MISMATCH', 'Xung đột phiên bản dữ liệu (409)', 'Hồ sơ bệnh nhân đã được cập nhật ở phiên khác (rowVersion hiện tại: ' + pt.rowVersion + '). Vui lòng tải lại trước khi lưu.', { currentRowVersion: pt.rowVersion });
      }
      if (payload.fullName !== undefined) {
        const fn = String(payload.fullName).trim();
        if (fn.length < 2) {
          throw new StaticApiError(422, 'FIELD_VALIDATION_FAILED', 'Tên hồ sơ không hợp lệ', 'Họ tên phải có ít nhất 2 ký tự.', { errors: [{ fieldCode: 'fullName', sectionCode: 'hanh_chinh', message: 'Họ tên tối thiểu 2 ký tự.', rejectedValue: fn }] });
        }
        pt.fullName = fn;
      }
      if (payload.sex !== undefined) pt.sex = payload.sex;
      if (payload.birthDate !== undefined) pt.birthDate = payload.birthDate || null;
      if (payload.birthYear !== undefined) pt.birthYear = payload.birthYear === null || payload.birthYear === '' ? null : Number(payload.birthYear);
      if (payload.declaredAge !== undefined) pt.declaredAge = payload.declaredAge === null || payload.declaredAge === '' ? null : Number(payload.declaredAge);
      if (payload.externalPatientCode !== undefined) pt.externalPatientCode = payload.externalPatientCode ? String(payload.externalPatientCode).trim() : null;
      pt.rowVersion += 1;
      pt.updatedBy = actor.id;
      pt.updatedAt = new Date().toISOString();
      saveDb(db);
      return formatPatientOut(db, pt, check.access);
    },

    /* ---------------- M3, M4 & M5: Visits ---------------- */
    async listPatientVisits(patientId, params) {
      const db = await loadDb();
      const actor = requireAuth(db, ['doctor'], 'visit');
      requirePatientAccess(db, patientId, actor);
      const opts = params || {};
      let items = db.visits
        .filter(function (v) { return v.patientId === patientId; })
        .map(function (v) {
          const item = stripVisitArrays(v, db);
          const fv = db.formVersions.find(function (f) { return f.id === v.formVersionId; });
          item.formVersionLabel = fv ? fv.versionLabel : 'v1';
          return item;
        });
      if (opts.status) {
        items = items.filter(function (v) { return v.status === opts.status; });
      }
      items.sort(function (a, b) { return new Date(b.visitDate) - new Date(a.visitDate); });
      return paginate(items, opts.page, opts.pageSize || 50);
    },

    async createVisit(patientId, payload) {
      const db = await loadDb();
      const actor = requireAuth(db, ['doctor'], 'visit');
      const pt = requirePatientAccess(db, patientId, actor).patient;
      const published = db.formVersions.find(function (fv) { return fv.status === 'published'; });
      if (!published) {
        throw new StaticApiError(409, 'NO_PUBLISHED_FORM_VERSION', 'Chưa có phiên bản biểu mẫu phát hành', 'Vui lòng yêu cầu Quản trị viên phát hành một phiên bản biểu mẫu.');
      }
      const visitDate = (payload && payload.visitDate) || new Date().toISOString();
      const seq = db.nextVisitSeq || 2;
      db.nextVisitSeq = seq + 1;
      const dPart = visitDate.slice(0, 10).replace(/-/g, '');
      const visitCode = 'LK-' + dPart + '-' + String(seq).padStart(2, '0');
      const nowIso = new Date().toISOString();
      const visit = {
        id: makeUuid(),
        visitCode: visitCode,
        externalVisitCode: (payload && payload.externalVisitCode) || null,
        patientId: pt.id,
        formVersionId: published.id,
        visitDate: visitDate,
        visitType: (payload && payload.visitType) || 'outpatient_new',
        chiefComplaint: (payload && payload.chiefComplaint) || null,
        clinicalNote: null,
        infoSource: null,
        status: 'draft',
        currentRevisionNo: 1,
        createdBy: actor.id,
        createdAt: nowIso,
        updatedAt: nowIso,
        confirmedAt: null,
        confirmedBy: null,
        confirmNote: null,
        rowVersion: 1,
        values: [],
        orthostaticBp: [],
        medications: [],
        allergies: [],
        labResults: [],
        revisions: []
      };
      db.visits.unshift(visit);
      pt.updatedAt = nowIso;
      saveDb(db);
      return stripVisitArrays(visit, db);
    },

    async getVisit(visitId) {
      const db = await loadDb();
      const actor = requireAuth(db, ['doctor'], 'visit');
      const visit = db.visits.find(function (v) { return v.id === visitId; });
      if (!visit) {
        throw new StaticApiError(404, 'RESOURCE_NOT_FOUND', 'Không tìm thấy hồ sơ', 'Không tìm thấy hồ sơ yêu cầu.');
      }
      const check = requirePatientAccess(db, visit.patientId, actor);
      return {
        access: check.access,
        visit: stripVisitArrays(visit, db),
        values: clone(visit.values || []),
        orthostaticBp: clone(visit.orthostaticBp || []),
        medications: clone(visit.medications || []),
        allergies: clone(visit.allergies || []),
        labResults: clone(visit.labResults || []),
        diagnoses: clone(visit.diagnoses || []),
        revisions: clone(visit.revisions || [])
      };
    },

    async getVisitForm(visitId) {
      const db = await loadDb();
      const actor = requireAuth(db, ['doctor'], 'visit');
      const visit = db.visits.find(function (v) { return v.id === visitId; });
      if (!visit) {
        throw new StaticApiError(404, 'RESOURCE_NOT_FOUND', 'Không tìm thấy hồ sơ', 'Không tìm thấy hồ sơ yêu cầu.');
      }
      requirePatientAccess(db, visit.patientId, actor);
      const fv = db.formVersions.find(function (f) { return f.id === visit.formVersionId; });
      if (!fv) {
        throw new StaticApiError(404, 'FORM_VERSION_NOT_FOUND', 'Không tìm thấy phiên bản biểu mẫu', 'Phiên bản biểu mẫu gắn với lượt khám không tồn tại.');
      }
      return {
        visitId: visit.id,
        formVersion: formatVersionSummary(db, fv),
        sections: clone(fv.sections || []),
        fieldDefinitions: getEffectiveDefinitions(db, fv)
      };
    },

    async saveVisitDraft(visitId, payload, ifMatch) {
      const db = await loadDb();
      const actor = requireAuth(db, ['doctor'], 'visit');
      const visit = db.visits.find(function (v) { return v.id === visitId; });
      if (!visit) {
        throw new StaticApiError(404, 'RESOURCE_NOT_FOUND', 'Không tìm thấy hồ sơ', 'Không tìm thấy hồ sơ yêu cầu.');
      }
      requirePatientAccess(db, visit.patientId, actor);
      if (visit.status === 'confirmed') {
        throw new StaticApiError(409, 'VISIT_ALREADY_CONFIRMED', 'Lượt khám đã xác nhận (Chỉ đọc)', 'Không thể lưu đè trực tiếp lượt khám đã xác nhận. Hãy sử dụng "Tạo bản sửa mới (revision)" kèm lý do.', { currentRowVersion: visit.rowVersion });
      }
      const expected = parseIfMatch(ifMatch, payload && payload.rowVersion);
      if (expected === null || expected !== visit.rowVersion) {
        throw new StaticApiError(409, 'CONCURRENCY_ROW_VERSION_MISMATCH', 'Xung đột sửa đồng thời (409)', 'Lượt khám này đã được cập nhật lên phiên bản dữ liệu r' + visit.rowVersion + ' ở một phiên khác. Hệ thống không ghi đè âm thầm.', { currentRowVersion: visit.rowVersion });
      }

      const workPayload = clone(payload || {});
      const errors = validateVisitPayload(db, visit, workPayload);
      if (errors.length > 0) {
        throw new StaticApiError(
          422,
          'FIELD_VALIDATION_FAILED',
          'Dữ liệu trường không hợp lệ',
          'Phát hiện ' + errors.length + ' trường vượt miền kỹ thuật hoặc sai định dạng. Các trường hợp lệ khác vẫn được giữ nguyên.',
          { errors: errors, currentRowVersion: visit.rowVersion }
        );
      }

      const nowIso = new Date().toISOString();
      const formVer = db.formVersions.find(function (fv) { return fv.id === visit.formVersionId; });
      const defMap = findFieldDefMap(db, formVer);
      visit.clinicalNote = workPayload.clinicalNote !== undefined ? (workPayload.clinicalNote || null) : visit.clinicalNote;
      visit.infoSource = workPayload.infoSource !== undefined ? (workPayload.infoSource || null) : visit.infoSource;
      if (workPayload.medicationListState !== undefined) visit.medicationListState = workPayload.medicationListState;
      if (workPayload.allergyListState !== undefined) visit.allergyListState = workPayload.allergyListState;
      if (workPayload.diagnosisListState !== undefined) visit.diagnosisListState = workPayload.diagnosisListState;
      if (Array.isArray(workPayload.diagnoses)) {
        visit.diagnoses = workPayload.diagnoses.map(function (d) {
          return {
            id: d.id || makeUuid(),
            code: String(d.code || '').trim().toUpperCase(),
            display: String(d.display || '').trim(),
            role: d.role === 'primary' ? 'primary' : 'secondary'
          };
        });
      }

      // Enforce K2: normalize visit_value (omit unfilled, unknown -> all value cols null)
      visit.values = (workPayload.values || []).map(function (v) {
        const fd = defMap[v.fieldDefinitionId] || defMap[v.fieldCode];
        if (!fd) return null;
        if (v.valueState === 'unknown') {
          return {
            visitId: visit.id,
            fieldDefinitionId: fd.id,
            fieldCode: fd.code,
            valueState: 'unknown',
            valueNum: null,
            valueText: null,
            valueBool: null,
            valueDate: null,
            fieldOptionId: null,
            selectedOptions: [],
            unit: null,
            updatedAt: nowIso
          };
        }
        return {
          visitId: visit.id,
          fieldDefinitionId: fd.id,
          fieldCode: fd.code,
          valueState: 'answered',
          valueNum: (fd.dataType === 'number' || fd.dataType === 'integer') ? Number(v.valueNum) : null,
          valueText: fd.dataType === 'text' ? String(v.valueText || '') : null,
          valueBool: fd.dataType === 'boolean' ? Boolean(v.valueBool) : null,
          valueDate: fd.dataType === 'date' ? String(v.valueDate || '') : null,
          fieldOptionId: fd.dataType === 'single_choice' ? v.fieldOptionId : null,
          selectedOptions: fd.dataType === 'multi_choice' ? (v.selectedOptions || []).map(function (so) {
            return { visitId: visit.id, fieldDefinitionId: fd.id, fieldOptionId: so.fieldOptionId };
          }) : [],
          unit: (fd.dataType === 'number' || fd.dataType === 'integer') ? (v.unit || fd.canonicalUnit || null) : null,
          updatedAt: nowIso
        };
      }).filter(Boolean);

      visit.orthostaticBp = (workPayload.orthostaticBp || []).map(function (bp) {
        return {
          id: bp.id || makeUuid(),
          visitId: visit.id,
          position: bp.position || 'sitting',
          minuteAfter: bp.minuteAfter !== null && bp.minuteAfter !== undefined && bp.minuteAfter !== '' ? Number(bp.minuteAfter) : null,
          systolic: Number(bp.systolic),
          diastolic: Number(bp.diastolic),
          heartRate: bp.heartRate !== null && bp.heartRate !== undefined && bp.heartRate !== '' ? Number(bp.heartRate) : null,
          measuredAt: bp.measuredAt,
          note: bp.note || null,
          createdAt: bp.createdAt || nowIso
        };
      });

      visit.medications = (workPayload.medications || []).map(function (m) {
        return {
          id: m.id || makeUuid(),
          visitId: visit.id,
          medicationGroup: m.medicationGroup || 'prescribed',
          drugName: String(m.drugName).trim(),
          activeIngredient: m.activeIngredient || null,
          strength: m.strength || null,
          dose: m.dose !== null && m.dose !== undefined && m.dose !== '' ? Number(m.dose) : null,
          unit: m.unit || null,
          frequency: m.frequency || null,
          route: m.route || null,
          status: m.status || 'active',
          startedAt: m.startedAt || null,
          note: m.note || null,
          createdAt: m.createdAt || nowIso
        };
      });

      visit.allergies = (workPayload.allergies || []).map(function (a) {
        return {
          id: a.id || makeUuid(),
          visitId: visit.id,
          kind: a.kind || 'allergy',
          agentCategory: a.agentCategory || 'therapeutic_drug',
          allergen: String(a.allergen).trim(),
          reaction: a.reaction || null,
          severity: a.severity || 'unknown',
          recordedAt: a.recordedAt || nowIso,
          note: a.note || null,
          createdAt: a.createdAt || nowIso
        };
      });

      visit.labResults = (workPayload.labResults || []).map(function (l) {
        const fd = defMap[l.labCode];
        return {
          id: l.id || makeUuid(),
          visitId: visit.id,
          labCode: l.labCode,
          labSubtype: l.labSubtype || null,
          valueNum: (l.valueNum !== null && l.valueNum !== undefined && l.valueNum !== '') ? Number(l.valueNum) : null,
          valueText: l.valueText || null,
          unit: l.unit || (fd ? fd.canonicalUnit : null) || null,
          measuredAt: l.measuredAt,
          note: l.note || null,
          createdAt: l.createdAt || nowIso
        };
      });

      visit.rowVersion += 1;
      visit.updatedBy = actor.id;
      visit.updatedAt = nowIso;
      saveDb(db);

      return {
        visit: stripVisitArrays(visit, db),
        values: clone(visit.values),
        orthostaticBp: clone(visit.orthostaticBp),
        medications: clone(visit.medications),
        allergies: clone(visit.allergies),
        labResults: clone(visit.labResults),
        diagnoses: clone(visit.diagnoses || []),
        revisions: clone(visit.revisions || [])
      };
    },

    async getVisitReview(visitId) {
      const db = await loadDb();
      const actor = requireAuth(db, ['doctor'], 'visit');
      const visit = db.visits.find(function (v) { return v.id === visitId; });
      if (!visit) {
        throw new StaticApiError(404, 'RESOURCE_NOT_FOUND', 'Không tìm thấy hồ sơ', 'Không tìm thấy hồ sơ yêu cầu.');
      }
      requirePatientAccess(db, visit.patientId, actor);
      return buildVisitReview(db, visit);
    },

    async confirmVisit(visitId, payload, ifMatch) {
      const db = await loadDb();
      const actor = requireAuth(db, ['doctor'], 'visit');
      const visit = db.visits.find(function (v) { return v.id === visitId; });
      if (!visit) {
        throw new StaticApiError(404, 'RESOURCE_NOT_FOUND', 'Không tìm thấy hồ sơ', 'Không tìm thấy hồ sơ yêu cầu.');
      }
      requirePatientAccess(db, visit.patientId, actor);
      if (visit.status === 'confirmed') {
        throw new StaticApiError(409, 'VISIT_ALREADY_CONFIRMED', 'Lượt khám đã được xác nhận', 'Lượt khám này đã ở trạng thái đã xác nhận.', { currentRowVersion: visit.rowVersion });
      }
      const expected = parseIfMatch(ifMatch, payload && payload.rowVersion);
      if (expected === null || expected !== visit.rowVersion) {
        throw new StaticApiError(409, 'CONCURRENCY_ROW_VERSION_MISMATCH', 'Xung đột phiên bản (409)', 'Dữ liệu lượt khám đã thay đổi ở phiên khác (rowVersion hiện tại: ' + visit.rowVersion + ').', { currentRowVersion: visit.rowVersion });
      }
      const review = buildVisitReview(db, visit);
      if (!review.canConfirm) {
        throw new StaticApiError(422, 'TIER3_CONFIRM_REQUIREMENTS_UNMET', 'Chưa đạt điều kiện xác nhận Tầng 3', 'Còn ' + review.tier3ConfirmErrors.length + ' lỗi hoặc trường bắt buộc chưa hoàn thiện.', { errors: review.tier3ConfirmErrors, currentRowVersion: visit.rowVersion });
      }

      const nowIso = new Date().toISOString();
      visit.status = 'confirmed';
      visit.confirmedAt = nowIso;
      visit.confirmedBy = actor.id;
      visit.confirmNote = (payload && payload.confirmNote) || null;
      visit.rowVersion += 1;
      visit.updatedBy = actor.id;
      visit.updatedAt = nowIso;
      const revNo = (visit.revisions || []).length + 1;
      visit.currentRevisionNo = revNo;
      const snapshot = buildAiInputPayload(db, visit);
      visit.revisions = visit.revisions || [];
      visit.revisions.push({
        id: makeUuid(),
        visitId: visit.id,
        revisionNo: revNo,
        formVersionId: visit.formVersionId,
        revisionType: 'confirmed_snapshot',
        changeReason: visit.confirmNote || 'Xác nhận dữ liệu lượt khám',
        snapshotData: snapshot,
        createdBy: actor.id,
        createdAt: nowIso
      });

      appendAudit(db, actor, 'visit_confirm', 'visit', visit.id, 'success', {
        visitCode: visit.visitCode,
        formVersionId: visit.formVersionId,
        revisionNo: revNo
      });
      saveDb(db);
      return stripVisitArrays(visit, db);
    },

    async createVisitRevision(visitId, payload, ifMatch) {
      const db = await loadDb();
      const actor = requireAuth(db, ['doctor'], 'visit_revision');
      const visit = db.visits.find(function (v) { return v.id === visitId; });
      if (!visit) {
        throw new StaticApiError(404, 'RESOURCE_NOT_FOUND', 'Không tìm thấy hồ sơ', 'Không tìm thấy hồ sơ yêu cầu.');
      }
      requirePatientAccess(db, visit.patientId, actor);
      if (visit.status !== 'confirmed') {
        throw new StaticApiError(409, 'VISIT_NOT_CONFIRMED', 'Lượt khám đang ở trạng thái nháp', 'Chỉ tạo bản sửa mới (revision) đối với lượt khám đã xác nhận.', { currentRowVersion: visit.rowVersion });
      }
      const expected = parseIfMatch(ifMatch, payload && payload.rowVersion);
      if (expected === null || expected !== visit.rowVersion) {
        throw new StaticApiError(409, 'CONCURRENCY_ROW_VERSION_MISMATCH', 'Xung đột phiên bản (409)', 'Lượt khám đã thay đổi ở phiên khác.', { currentRowVersion: visit.rowVersion });
      }
      const reason = String((payload && payload.changeReason) || '').trim();
      if (reason.length < 5) {
        throw new StaticApiError(422, 'CHANGE_REASON_REQUIRED', 'Thiếu lý do sửa sau xác nhận', 'Vui lòng nhập lý do chỉnh sửa ít nhất 5 ký tự để lưu vết kiểm toán.', { errors: [{ fieldCode: 'changeReason', sectionCode: 'ghi_chu', message: 'Lý do sửa tối thiểu 5 ký tự.', rejectedValue: reason }] });
      }

      const nowIso = new Date().toISOString();
      const prevSnapshot = buildAiInputPayload(db, visit);
      const nextRevNo = (visit.revisions || []).length + 1;
      const rev = {
        id: makeUuid(),
        visitId: visit.id,
        revisionNo: nextRevNo,
        formVersionId: visit.formVersionId,
        revisionType: 'post_confirm_amendment',
        changeReason: reason,
        snapshotData: prevSnapshot,
        createdBy: actor.id,
        createdAt: nowIso
      };
      visit.revisions = visit.revisions || [];
      visit.revisions.push(rev);
      visit.currentRevisionNo = nextRevNo;
      visit.status = 'draft';
      visit.confirmedAt = null;
      visit.confirmedBy = null;
      visit.confirmNote = null;
      visit.rowVersion += 1;
      visit.updatedBy = actor.id;
      visit.updatedAt = nowIso;

      appendAudit(db, actor, 'visit_confirm', 'visit_revision', rev.id, 'success', {
        visitCode: visit.visitCode,
        revisionNo: nextRevNo,
        revisionType: 'post_confirm_amendment',
        reason: reason
      });
      saveDb(db);
      return clone(rev);
    },

    async getVisitAiInput(visitId) {
      const db = await loadDb();
      const actor = requireAuth(db, ['doctor'], 'visit');
      const visit = db.visits.find(function (v) { return v.id === visitId; });
      if (!visit) {
        throw new StaticApiError(404, 'RESOURCE_NOT_FOUND', 'Không tìm thấy hồ sơ', 'Không tìm thấy hồ sơ yêu cầu.');
      }
      requirePatientAccess(db, visit.patientId, actor);
      if (visit.status !== 'confirmed') {
        throw new StaticApiError(409, 'VISIT_NOT_CONFIRMED_FOR_AI_INPUT', 'Chưa xác nhận lượt khám', 'Chỉ xuất hợp đồng AiInputPayload cho lượt khám đã ở trạng thái confirmed.');
      }
      return buildAiInputPayload(db, visit);
    },

    async getVisitAiInputV1(visitId) {
      const db = await loadDb();
      const actor = requireAuth(db, ['doctor'], 'visit');
      const visit = db.visits.find(function (v) { return v.id === visitId; });
      if (!visit) {
        throw new StaticApiError(404, 'RESOURCE_NOT_FOUND', 'Không tìm thấy hồ sơ', 'Không tìm thấy hồ sơ yêu cầu.');
      }
      requirePatientAccess(db, visit.patientId, actor);
      // Block hf-ai-input/1.0 export in static mode — never emit unprotected payload under ai-pseudonym-v1.
      throw new StaticApiError(
        501,
        'AI_EXPORT_STATIC_UNSUPPORTED',
        'Không hỗ trợ xuất JSON cho AI ở chế độ tĩnh',
        'Chế độ demo tĩnh không hỗ trợ xuất JSON cho AI (hf-ai-input/1.0); dùng bản có máy chủ để bảo đảm ẩn danh HMAC và bản chụp bất biến.'
      );
    },

    /* ---------------- M6: Admin Users ---------------- */
    async listUsers(params) {
      const db = await loadDb();
      requireAuth(db, ['admin'], 'app_user');
      const opts = params || {};
      const q = String(opts.q || '').trim().toLowerCase();
      let items = db.users.map(sanitizeUser);
      if (q) {
        items = items.filter(function (u) {
          return u.username.toLowerCase().indexOf(q) >= 0 || u.fullName.toLowerCase().indexOf(q) >= 0;
        });
      }
      if (opts.role) {
        items = items.filter(function (u) { return u.role === opts.role; });
      }
      if (opts.isActive !== undefined && opts.isActive !== null && opts.isActive !== '') {
        const want = String(opts.isActive) === 'true' || opts.isActive === true;
        items = items.filter(function (u) { return u.isActive === want; });
      }
      return paginate(items, opts.page, opts.pageSize || 50);
    },

    async previewUserPermissions(payload) {
      const db = await loadDb();
      requireAuth(db, ['admin'], 'app_user');
      const role = payload && payload.role;
      if (role !== 'doctor' && role !== 'admin') {
        throw new StaticApiError(422, 'VALIDATION_ERROR', 'Vai trò không hợp lệ', 'Vai trò chỉ nhận doctor hoặc admin.');
      }
      return permissionMatrixForRole(role);
    },

    async createUser(payload) {
      const db = await loadDb();
      const actor = requireAuth(db, ['admin'], 'app_user');
      const uname = String((payload && payload.username) || '').trim();
      const fullName = String((payload && payload.fullName) || '').trim();
      const role = payload && payload.role;
      const reason = String((payload && payload.reason) || '').trim();
      const errors = [];
      if (!/^[a-zA-Z0-9._-]{3,64}$/.test(uname)) {
        errors.push({ fieldCode: 'username', sectionCode: 'hanh_chinh', message: 'Tên đăng nhập dài 3–64 ký tự, chỉ gồm chữ, số và . _ -', rejectedValue: uname });
      }
      if (!fullName) {
        errors.push({ fieldCode: 'fullName', sectionCode: 'hanh_chinh', message: 'Họ tên hiển thị không được để trống.', rejectedValue: fullName });
      }
      if (role !== 'doctor' && role !== 'admin') {
        errors.push({ fieldCode: 'role', sectionCode: 'hanh_chinh', message: 'Vai trò không hợp lệ.', rejectedValue: role });
      }
      if (reason.length < 3) {
        errors.push({ fieldCode: 'reason', sectionCode: 'hanh_chinh', message: 'Vui lòng nhập lý do tạo tài khoản (tối thiểu 3 ký tự).', rejectedValue: reason });
      }
      if (errors.length > 0) {
        throw new StaticApiError(422, 'FIELD_VALIDATION_FAILED', 'Thông tin tài khoản chưa hợp lệ', errors[0].message, { errors: errors });
      }
      if (db.users.some(function (u) { return u.username.toLowerCase() === uname.toLowerCase(); })) {
        throw new StaticApiError(409, 'DUPLICATE_USERNAME', 'Tên đăng nhập đã tồn tại', 'Tên đăng nhập "' + uname + '" đã được sử dụng.');
      }
      const nowIso = new Date().toISOString();
      const oneTimeSetupCode = 'OTP-' + Math.random().toString(36).slice(2, 6).toUpperCase() + '-' + Math.random().toString(36).slice(2, 6).toUpperCase();
      const setupExpiresAt = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
      const newUser = {
        id: makeUuid(),
        username: uname,
        passwordSecret: oneTimeSetupCode,
        fullName: fullName,
        role: role,
        isActive: payload.isActive !== undefined ? Boolean(payload.isActive) : true,
        lastLoginAt: null,
        rowVersion: 1,
        createdAt: nowIso,
        updatedAt: nowIso
      };
      db.users.unshift(newUser);
      appendAudit(db, actor, 'user_create', 'app_user', newUser.id, 'success', {
        username: newUser.username,
        role: newUser.role,
        isActive: newUser.isActive,
        reason: reason
      });
      saveDb(db);
      return {
        user: sanitizeUser(newUser),
        oneTimeSetupCode: oneTimeSetupCode,
        setupExpiresAt: setupExpiresAt
      };
    },

    async getUser(userId) {
      const db = await loadDb();
      requireAuth(db, ['admin'], 'app_user');
      const u = db.users.find(function (x) { return x.id === userId; });
      if (!u) {
        throw new StaticApiError(404, 'RESOURCE_NOT_FOUND', 'Không tìm thấy tài khoản', 'Tài khoản không tồn tại.');
      }
      return sanitizeUser(u);
    },

    async updateUser(userId, payload, ifMatch) {
      const db = await loadDb();
      const actor = requireAuth(db, ['admin'], 'app_user');
      const u = db.users.find(function (x) { return x.id === userId; });
      if (!u) {
        throw new StaticApiError(404, 'RESOURCE_NOT_FOUND', 'Không tìm thấy tài khoản', 'Tài khoản không tồn tại.');
      }
      const expected = parseIfMatch(ifMatch, payload && payload.rowVersion);
      if (expected === null || expected !== (u.rowVersion || 1)) {
        throw new StaticApiError(409, 'CONCURRENCY_ROW_VERSION_MISMATCH', 'Xung đột phiên bản tài khoản (409)', 'Tài khoản đã được cập nhật ở phiên khác (rowVersion hiện tại: ' + (u.rowVersion || 1) + ').', { currentRowVersion: u.rowVersion || 1 });
      }
      const reason = String((payload && payload.reason) || '').trim();
      if (reason.length < 3) {
        throw new StaticApiError(422, 'REASON_REQUIRED', 'Thiếu lý do thao tác', 'Bắt buộc nhập lý do thay đổi tối thiểu 3 ký tự để ghi nhật ký hệ thống.');
      }
      const nextRole = payload.role !== undefined ? payload.role : u.role;
      const nextActive = payload.isActive !== undefined ? Boolean(payload.isActive) : u.isActive;
      const activeAdmins = db.users.filter(function (x) { return x.role === 'admin' && x.isActive; });
      if (u.role === 'admin' && u.isActive && (!nextActive || nextRole !== 'admin') && activeAdmins.length <= 1) {
        throw new StaticApiError(409, 'LAST_ACTIVE_ADMIN', 'Không thể khóa Quản trị viên cuối cùng', 'Hệ thống phải duy trì ít nhất một tài khoản Quản trị viên đang hoạt động.');
      }

      const diff = {};
      if (payload.fullName !== undefined && payload.fullName !== u.fullName) {
        diff.fullName = { from: u.fullName, to: payload.fullName };
        u.fullName = String(payload.fullName).trim();
      }
      if (nextRole !== u.role) {
        diff.role = { from: u.role, to: nextRole };
        u.role = nextRole;
      }
      if (nextActive !== u.isActive) {
        diff.isActive = { from: u.isActive, to: nextActive };
        u.isActive = nextActive;
      }
      let oneTimeSetupCode = null;
      if (payload.resetPassword) {
        oneTimeSetupCode = 'RST-' + Math.random().toString(36).slice(2, 6).toUpperCase() + '-' + Math.random().toString(36).slice(2, 6).toUpperCase();
        u.passwordSecret = oneTimeSetupCode;
        delete u.passwordVerifier;
        u.credentialVersion = (u.credentialVersion || 0) + 1;
        diff.resetPassword = true;
      }
      u.rowVersion = (u.rowVersion || 1) + 1;
      u.updatedAt = new Date().toISOString();

      appendAudit(db, actor, 'user_update', 'app_user', u.id, 'success', {
        targetUsername: u.username,
        diff: diff,
        reason: reason
      });
      saveDb(db);
      return {
        user: sanitizeUser(u),
        oneTimeSetupCode: oneTimeSetupCode
      };
    },

    /* ---------------- M7: Admin Forms ---------------- */
    async listFieldDefinitions(params) {
      const db = await loadDb();
      requireAuth(db, ['admin'], 'field_definition');
      const opts = params || {};
      const q = String(opts.q || '').trim().toLowerCase();
      let items = clone(db.fieldDefinitions || []);
      if (opts.sectionCode) {
        items = items.filter(function (f) { return f.sectionCode === opts.sectionCode; });
      }
      if (opts.scopeStatus) {
        items = items.filter(function (f) { return f.scopeStatus === opts.scopeStatus; });
      }
      if (opts.dataType) {
        items = items.filter(function (f) { return f.dataType === opts.dataType; });
      }
      if (q) {
        items = items.filter(function (f) {
          return f.code.toLowerCase().indexOf(q) >= 0 || f.labelVi.toLowerCase().indexOf(q) >= 0;
        });
      }
      return { items: items, total: items.length };
    },

    async listForms() {
      const db = await loadDb();
      requireAuth(db, ['admin'], 'form_template');
      return { items: [clone(db.formTemplate)] };
    },

    async listFormVersions(formId, params) {
      const db = await loadDb();
      requireAuth(db, ['admin'], 'form_version');
      const opts = params || {};
      let items = db.formVersions
        .filter(function (fv) { return !formId || fv.formTemplateId === formId; })
        .map(function (fv) { return formatVersionSummary(db, fv); });
      if (opts.status) {
        items = items.filter(function (fv) { return fv.status === opts.status; });
      }
      items.sort(function (a, b) { return b.versionNo - a.versionNo; });
      return { items: items };
    },

    async createFormVersionDraft(formId, payload) {
      const db = await loadDb();
      const actor = requireAuth(db, ['admin'], 'form_version');
      if (db.formVersions.some(function (fv) { return fv.formTemplateId === formId && fv.status === 'draft'; })) {
        throw new StaticApiError(409, 'DRAFT_ALREADY_EXISTS', 'Đã có bản nháp biểu mẫu', 'Biểu mẫu này đang có sẵn một bản nháp chưa phát hành. Vui lòng chỉnh sửa hoặc phát hành bản nháp hiện có.');
      }
      const base = db.formVersions.find(function (fv) { return fv.id === payload.basedOnVersionId; });
      if (!base) {
        throw new StaticApiError(404, 'RESOURCE_NOT_FOUND', 'Không tìm thấy phiên bản gốc', 'Phiên bản biểu mẫu gốc không tồn tại.');
      }
      const maxNo = db.formVersions.reduce(function (acc, fv) { return Math.max(acc, fv.versionNo); }, 0);
      const nextNo = maxNo + 1;
      const newVerId = makeUuid();
      const newSections = (base.sections || []).map(function (sec) {
        const newSecId = makeUuid();
        return {
          id: newSecId,
          formVersionId: newVerId,
          sectionCode: sec.sectionCode,
          titleVi: sec.titleVi,
          description: sec.description,
          displayOrder: sec.displayOrder,
          fields: (sec.fields || []).map(function (ff) {
            return {
              id: makeUuid(),
              formVersionId: newVerId,
              formSectionId: newSecId,
              fieldDefinitionId: ff.fieldDefinitionId,
              fieldCode: ff.fieldCode,
              displayOrder: ff.displayOrder,
              requiredForConfirm: Boolean(ff.requiredForConfirm),
              isVisible: Boolean(ff.isVisible),
              isReadonly: Boolean(ff.isReadonly),
              customLabelVi: ff.customLabelVi || null,
              customHelpText: ff.customHelpText || null
            };
          })
        };
      });
      const draft = {
        id: newVerId,
        formTemplateId: formId,
        versionNo: nextNo,
        versionLabel: 'v1.' + (nextNo - 1),
        status: 'draft',
        basedOnVersionId: base.id,
        changeNote: (payload && payload.changeNote) || ('Bản nháp tạo từ ' + base.versionLabel),
        createdBy: actor.id,
        createdAt: new Date().toISOString(),
        publishedAt: null,
        publishedBy: null,
        rowVersion: 1,
        definitionOverrides: clone(base.definitionOverrides || {}),
        sections: newSections
      };
      db.formVersions.unshift(draft);
      appendAudit(db, actor, 'form_version_create', 'form_version', draft.id, 'success', {
        versionNo: draft.versionNo,
        versionLabel: draft.versionLabel,
        basedOnVersionId: base.id
      });
      saveDb(db);
      return formatVersionSummary(db, draft);
    },

    async getFormVersion(versionId) {
      const db = await loadDb();
      requireAuth(db, ['admin'], 'form_version');
      const fv = db.formVersions.find(function (x) { return x.id === versionId; });
      if (!fv) {
        throw new StaticApiError(404, 'RESOURCE_NOT_FOUND', 'Không tìm thấy phiên bản biểu mẫu', 'Phiên bản biểu mẫu không tồn tại.');
      }
      return {
        formVersion: formatVersionSummary(db, fv),
        sections: clone(fv.sections || []),
        fieldDefinitions: getEffectiveDefinitions(db, fv)
      };
    },

    async updateFormVersion(versionId, payload, ifMatch) {
      const db = await loadDb();
      const actor = requireAuth(db, ['admin'], 'form_version');
      const fv = db.formVersions.find(function (x) { return x.id === versionId; });
      if (!fv) {
        throw new StaticApiError(404, 'RESOURCE_NOT_FOUND', 'Không tìm thấy phiên bản biểu mẫu', 'Phiên bản biểu mẫu không tồn tại.');
      }
      // K4 immutability guard
      const hasVisits = db.visits.some(function (v) { return v.formVersionId === fv.id; });
      if (fv.status !== 'draft' || hasVisits) {
        throw new StaticApiError(409, 'FORM_VERSION_IMMUTABLE', 'Phiên bản biểu mẫu đã khóa bất biến (K4)', 'Phiên bản đã phát hành hoặc đã có lượt khám sử dụng không thể chỉnh sửa tại chỗ. Hãy tạo bản nháp phiên bản mới.', { currentRowVersion: fv.rowVersion });
      }
      const expected = parseIfMatch(ifMatch, payload && payload.rowVersion);
      if (expected === null || expected !== fv.rowVersion) {
        throw new StaticApiError(409, 'CONCURRENCY_ROW_VERSION_MISMATCH', 'Xung đột phiên bản biểu mẫu (409)', 'Bản nháp biểu mẫu đã được cập nhật ở phiên khác.', { currentRowVersion: fv.rowVersion });
      }
      if (!Array.isArray(payload.sections) || payload.sections.length === 0) {
        throw new StaticApiError(422, 'INVALID_SECTIONS', 'Cấu trúc nhóm biểu mẫu không hợp lệ', 'Bản nháp biểu mẫu phải có danh sách nhóm hợp lệ.');
      }
      if (payload.changeNote !== undefined) {
        fv.changeNote = payload.changeNote;
      }
      fv.sections = clone(payload.sections);
      fv.rowVersion += 1;
      appendAudit(db, actor, 'form_version_update', 'form_version', fv.id, 'success', {
        versionLabel: fv.versionLabel,
        rowVersion: fv.rowVersion
      });
      saveDb(db);
      return {
        formVersion: formatVersionSummary(db, fv),
        sections: clone(fv.sections),
        fieldDefinitions: getEffectiveDefinitions(db, fv)
      };
    },

    async previewFormVersion(versionId) {
      const db = await loadDb();
      requireAuth(db, ['admin'], 'form_version');
      const fv = db.formVersions.find(function (x) { return x.id === versionId; });
      if (!fv) {
        throw new StaticApiError(404, 'RESOURCE_NOT_FOUND', 'Không tìm thấy phiên bản biểu mẫu', 'Phiên bản biểu mẫu không tồn tại.');
      }
      return {
        isPreviewOnly: true,
        previewBannerVi: 'Chế độ xem trước góc nhìn Bác sĩ cho ' + fv.versionLabel + ' — mọi thao tác nhập thử không được lưu vào hồ sơ bệnh án.',
        formVersion: formatVersionSummary(db, fv),
        sections: clone(fv.sections || []),
        fieldDefinitions: getEffectiveDefinitions(db, fv)
      };
    },

    async previewFormVersionDraft(versionId, payload) {
      const db = await loadDb();
      requireAuth(db, ['admin'], 'form_version');
      const fv = db.formVersions.find(function (x) { return x.id === versionId; });
      if (!fv) {
        throw new StaticApiError(404, 'RESOURCE_NOT_FOUND', 'Không tìm thấy phiên bản biểu mẫu', 'Phiên bản biểu mẫu không tồn tại.');
      }
      if (fv.status !== 'draft') {
        throw new StaticApiError(409, 'FORM_VERSION_NOT_DRAFT', 'Chỉ xem trước trạng thái chưa lưu cho bản nháp', 'Phiên bản này không còn ở trạng thái bản nháp.', { currentRowVersion: fv.rowVersion });
      }
      if (payload && payload.rowVersion !== undefined && payload.rowVersion !== null && Number(payload.rowVersion) !== fv.rowVersion) {
        throw new StaticApiError(409, 'CONCURRENCY_ROW_VERSION_MISMATCH', 'Xung đột phiên bản bản nháp (409)', 'Bản nháp đã được cập nhật ở phiên khác.', { currentRowVersion: fv.rowVersion });
      }
      if (!payload || !Array.isArray(payload.sections) || payload.sections.length === 0) {
        throw new StaticApiError(422, 'INVALID_SECTIONS', 'Cấu trúc nhóm biểu mẫu không hợp lệ', 'Bản nháp xem trước phải có danh sách nhóm hợp lệ.');
      }
      return {
        isPreviewOnly: true,
        previewBannerVi: 'Chế độ xem trước góc nhìn Bác sĩ cho ' + fv.versionLabel + ' (trạng thái đang chỉnh sửa, chưa lưu nháp) — không ghi dữ liệu xuống CSDL.',
        formVersion: formatVersionSummary(db, fv),
        sections: clone(payload.sections),
        fieldDefinitions: getEffectiveDefinitions(db, fv)
      };
    },

    async diffFormVersion(versionId, baseVersionId) {
      const db = await loadDb();
      requireAuth(db, ['admin'], 'form_version');
      const target = db.formVersions.find(function (x) { return x.id === versionId; });
      const base = db.formVersions.find(function (x) { return x.id === baseVersionId; });
      if (!target || !base) {
        throw new StaticApiError(404, 'RESOURCE_NOT_FOUND', 'Không tìm thấy phiên bản đối chiếu', 'Một trong hai phiên bản biểu mẫu cần so sánh không tồn tại.');
      }
      const defMap = findFieldDefMap(db);
      function indexFields(ver) {
        const out = {};
        (ver.sections || []).forEach(function (sec) {
          (sec.fields || []).forEach(function (ff) {
            const fd = defMap[ff.fieldDefinitionId] || defMap[ff.fieldCode];
            if (!fd) return;
            out[fd.code] = {
              fieldCode: fd.code,
              labelVi: ff.customLabelVi || fd.labelVi,
              helpText: ff.customHelpText || fd.helpText || '',
              sectionCode: sec.sectionCode,
              displayOrder: ff.displayOrder,
              requiredForConfirm: Boolean(ff.requiredForConfirm),
              isVisible: Boolean(ff.isVisible),
              isReadonly: Boolean(ff.isReadonly)
            };
          });
        });
        return out;
      }

      const baseMap = indexFields(base);
      const targetMap = indexFields(target);
      const addedFields = [];
      const modifiedFields = [];
      const removedFields = [];

      Object.keys(targetMap).forEach(function (code) {
        const cur = targetMap[code];
        const prev = baseMap[code];
        if (!prev || (!prev.isVisible && cur.isVisible)) {
          if (cur.isVisible) {
            addedFields.push({
              changeType: 'added',
              fieldCode: cur.fieldCode,
              labelVi: cur.labelVi,
              sectionCode: cur.sectionCode,
              previousAttributeSummary: prev ? 'Ẩn ở phiên bản gốc' : null,
              currentAttributeSummary: 'Hiển thị ở nhóm ' + cur.sectionCode + (cur.requiredForConfirm ? ' · Bắt buộc Tầng 3' : '')
            });
          }
          return;
        }
        if (prev.isVisible && !cur.isVisible) {
          removedFields.push({
            changeType: 'removed',
            fieldCode: cur.fieldCode,
            labelVi: prev.labelVi,
            sectionCode: prev.sectionCode,
            previousAttributeSummary: 'Hiển thị ở nhóm ' + prev.sectionCode,
            currentAttributeSummary: 'Ngừng hiển thị cho lượt khám mới (giữ nguyên dữ liệu lượt cũ)'
          });
          return;
        }
        const diffs = [];
        if (prev.labelVi !== cur.labelVi) diffs.push('Nhãn: "' + prev.labelVi + '" → "' + cur.labelVi + '"');
        if (prev.helpText !== cur.helpText) diffs.push('Cập nhật mô tả trợ giúp');
        if (prev.requiredForConfirm !== cur.requiredForConfirm) diffs.push('Bắt buộc Tầng 3: ' + (prev.requiredForConfirm ? 'Có' : 'Không') + ' → ' + (cur.requiredForConfirm ? 'Có' : 'Không'));
        if (prev.sectionCode !== cur.sectionCode) diffs.push('Chuyển nhóm: ' + prev.sectionCode + ' → ' + cur.sectionCode);
        if (prev.displayOrder !== cur.displayOrder) diffs.push('Thứ tự: #' + prev.displayOrder + ' → #' + cur.displayOrder);
        if (diffs.length > 0) {
          modifiedFields.push({
            changeType: 'modified',
            fieldCode: cur.fieldCode,
            labelVi: cur.labelVi,
            sectionCode: cur.sectionCode,
            previousAttributeSummary: 'Nhóm ' + prev.sectionCode + ' · #' + prev.displayOrder,
            currentAttributeSummary: diffs.join(' · ')
          });
        }
      });

      Object.keys(baseMap).forEach(function (code) {
        if (!targetMap[code] && baseMap[code].isVisible) {
          removedFields.push({
            changeType: 'removed',
            fieldCode: code,
            labelVi: baseMap[code].labelVi,
            sectionCode: baseMap[code].sectionCode,
            previousAttributeSummary: 'Hiển thị ở nhóm ' + baseMap[code].sectionCode,
            currentAttributeSummary: 'Đã gỡ khỏi bản nháp mới'
          });
        }
      });

      return {
        targetVersionId: target.id,
        baseVersionId: base.id,
        hasChanges: addedFields.length + modifiedFields.length + removedFields.length > 0,
        addedFields: addedFields,
        modifiedFields: modifiedFields,
        removedFields: removedFields
      };
    },

    async publishFormVersion(versionId, payload, ifMatch) {
      const db = await loadDb();
      const actor = requireAuth(db, ['admin'], 'form_version');
      const fv = db.formVersions.find(function (x) { return x.id === versionId; });
      if (!fv) {
        throw new StaticApiError(404, 'RESOURCE_NOT_FOUND', 'Không tìm thấy phiên bản biểu mẫu', 'Phiên bản biểu mẫu không tồn tại.');
      }
      if (fv.status !== 'draft') {
        throw new StaticApiError(409, 'FORM_VERSION_NOT_DRAFT', 'Chỉ phát hành được bản nháp', 'Phiên bản này đã phát hành hoặc đã lưu trữ.', { currentRowVersion: fv.rowVersion });
      }
      const expected = parseIfMatch(ifMatch, payload && payload.rowVersion);
      if (expected === null || expected !== fv.rowVersion) {
        throw new StaticApiError(409, 'CONCURRENCY_ROW_VERSION_MISMATCH', 'Xung đột phiên bản (409)', 'Bản nháp đã thay đổi ở phiên khác.', { currentRowVersion: fv.rowVersion });
      }
      const visibleCount = (fv.sections || []).reduce(function (acc, s) {
        return acc + (s.fields || []).filter(function (f) { return f.isVisible; }).length;
      }, 0);
      if (visibleCount === 0) {
        throw new StaticApiError(422, 'EMPTY_FORM_VERSION', 'Bản nháp chưa có trường hiển thị', 'Cần có ít nhất một trường hiển thị trước khi phát hành.');
      }

      let retiredId = null;
      db.formVersions.forEach(function (other) {
        if (other.formTemplateId === fv.formTemplateId && other.status === 'published') {
          other.status = 'retired';
          other.rowVersion += 1;
          retiredId = other.id;
        }
      });
      const nowIso = new Date().toISOString();
      fv.status = 'published';
      fv.publishedAt = nowIso;
      fv.publishedBy = actor.id;
      if (payload && payload.changeNote) fv.changeNote = payload.changeNote;
      fv.rowVersion += 1;

      appendAudit(db, actor, 'form_version_publish', 'form_version', fv.id, 'success', {
        versionNo: fv.versionNo,
        versionLabel: fv.versionLabel,
        retiredVersionId: retiredId
      });
      saveDb(db);
      return formatVersionSummary(db, fv);
    },

    async deleteFormVersionDraft(versionId, ifMatch) {
      const db = await loadDb();
      const actor = requireAuth(db, ['admin'], 'form_version');
      const idx = db.formVersions.findIndex(function (x) { return x.id === versionId; });
      if (idx === -1) {
        throw new StaticApiError(404, 'RESOURCE_NOT_FOUND', 'Không tìm thấy phiên bản biểu mẫu', 'Phiên bản biểu mẫu không tồn tại.');
      }
      const fv = db.formVersions[idx];
      if (fv.status !== 'draft') {
        throw new StaticApiError(409, 'FORM_VERSION_NOT_DRAFT', 'Không thể xóa phiên bản đã phát hành', 'Chỉ được xóa bản nháp chưa phát hành và chưa gắn lượt khám nào.', { currentRowVersion: fv.rowVersion });
      }
      const usedCount = db.visits.filter(function (v) { return v.formVersionId === fv.id; }).length;
      if (usedCount > 0) {
        throw new StaticApiError(409, 'FORM_VERSION_IN_USE', 'Bản nháp đang có lượt khám sử dụng', 'Không thể xóa phiên bản đã có lượt khám gắn kèm.');
      }
      const expected = parseIfMatch(ifMatch, fv.rowVersion);
      if (expected !== null && expected !== fv.rowVersion) {
        throw new StaticApiError(409, 'CONCURRENCY_ROW_VERSION_MISMATCH', 'Xung đột phiên bản (409)', 'Bản nháp đã thay đổi ở phiên khác.', { currentRowVersion: fv.rowVersion });
      }
      db.formVersions.splice(idx, 1);
      appendAudit(db, actor, 'form_version_update', 'form_version', fv.id, 'success', {
        deletedDraft: true,
        versionLabel: fv.versionLabel
      });
      saveDb(db);
      return { deleted: true, versionId: fv.id, versionLabel: fv.versionLabel };
    },

    /* ---------------- Admin Care Assignments (Simplified Demo Scope) ---------------- */
    async adminListCareDoctors() {
      const db = await loadDb();
      requireAuth(db, ['admin'], 'care_assignment');
      const items = (db.users || [])
        .filter(function (u) { return u.role === 'doctor' && u.isActive; })
        .sort(function (a, b) { return String(a.fullName || '').localeCompare(String(b.fullName || '')); })
        .map(function (u) { return { id: u.id, username: u.username, fullName: u.fullName }; });
      return { items: items };
    },

    async adminListCarePatients(params) {
      const db = await loadDb();
      requireAuth(db, ['admin'], 'care_assignment');
      const opts = params || {};
      const q = String(opts.q || '').trim().toLowerCase();
      let items = (db.patients || []).map(function (pt) {
        const docs = (db.careAssignments || [])
          .filter(function (a) { return a.patientId === pt.id && isAssignmentActive(a); })
          .map(function (a) {
            return { id: a.doctorUserId, fullName: findUserName(db, a.doctorUserId) || 'Bác sĩ' };
          })
          .sort(function (a, b) { return String(a.fullName).localeCompare(String(b.fullName)); });
        return {
          id: pt.id,
          patientCode: pt.patientCode,
          fullName: pt.fullName,
          assignedDoctors: docs
        };
      });
      if (q) {
        items = items.filter(function (p) {
          return p.patientCode.toLowerCase().indexOf(q) >= 0 || p.fullName.toLowerCase().indexOf(q) >= 0;
        });
      }
      items.sort(function (a, b) { return a.patientCode.localeCompare(b.patientCode); });
      return paginate(items, opts.page, opts.pageSize || 20);
    },

    async adminListPatientCareAssignments(patientId) {
      const db = await loadDb();
      requireAuth(db, ['admin'], 'care_assignment');
      const pt = (db.patients || []).find(function (p) { return p.id === patientId; });
      if (!pt) throw new StaticApiError(404, 'RESOURCE_NOT_FOUND', 'Không tìm thấy hồ sơ', 'Không tìm thấy hồ sơ yêu cầu.');
      const items = (db.careAssignments || [])
        .filter(function (a) { return a.patientId === patientId; })
        .sort(function (a, b) { return Date.parse(b.assignedAt || b.validFrom || 0) - Date.parse(a.assignedAt || a.validFrom || 0); })
        .map(function (a) { return formatAssignment(db, a); });
      return { items: items };
    },

    async adminAddPatientCareAssignment(patientId, payload) {
      const db = await loadDb();
      const actor = requireAuth(db, ['admin'], 'care_assignment');
      const pt = (db.patients || []).find(function (p) { return p.id === patientId; });
      if (!pt) throw new StaticApiError(404, 'RESOURCE_NOT_FOUND', 'Không tìm thấy hồ sơ', 'Không tìm thấy hồ sơ yêu cầu.');
      const doctorId = payload && payload.doctorUserId;
      const doc = (db.users || []).find(function (u) { return u.id === doctorId && u.role === 'doctor' && u.isActive; });
      if (!doc) {
        throw new StaticApiError(422, 'CARE_DOCTOR_INVALID', 'Bác sĩ không hợp lệ', 'Cần chọn bác sĩ đang hoạt động.');
      }
      db.careAssignments = db.careAssignments || [];
      if (db.careAssignments.some(function (a) { return a.patientId === patientId && a.doctorUserId === doctorId && isAssignmentActive(a); })) {
        throw new StaticApiError(409, 'CARE_ASSIGNMENT_CONFLICT', 'Đã phân công bác sĩ này', 'Bác sĩ đã được phân công cho hồ sơ này.');
      }
      const reason = payload && payload.reason ? String(payload.reason).trim() || null : null;
      const rec = {
        id: makeUuid(),
        patientId: patientId,
        doctorUserId: doc.id,
        assignedAt: new Date().toISOString(),
        assignedBy: actor.id,
        reason: reason,
        revokedAt: null,
        revokedBy: null
      };
      db.careAssignments.unshift(rec);
      appendAudit(db, actor, 'care_assignment_add', 'patient', patientId, 'success', { assignmentId: rec.id, doctorUserId: doc.id });
      saveDb(db);
      return formatAssignment(db, rec);
    },

    async adminReplacePatientCareAssignments(patientId, payload) {
      const db = await loadDb();
      const actor = requireAuth(db, ['admin'], 'care_assignment');
      const pt = (db.patients || []).find(function (p) { return p.id === patientId; });
      if (!pt) throw new StaticApiError(404, 'RESOURCE_NOT_FOUND', 'Không tìm thấy hồ sơ', 'Không tìm thấy hồ sơ yêu cầu.');
      const ids = Array.isArray(payload && payload.doctorUserIds) ? payload.doctorUserIds : [];
      const seen = {};
      ids.forEach(function (id) {
        if (seen[id]) throw new StaticApiError(422, 'FIELD_VALIDATION_FAILED', 'Trùng bác sĩ', 'Danh sách bác sĩ không được chứa ID trùng.');
        seen[id] = true;
        const doc = (db.users || []).find(function (u) { return u.id === id && u.role === 'doctor' && u.isActive; });
        if (!doc) throw new StaticApiError(422, 'CARE_DOCTOR_INVALID', 'Bác sĩ không hợp lệ', 'Cần chọn bác sĩ đang hoạt động.');
      });
      const reason = payload && payload.reason ? String(payload.reason).trim() || null : null;
      const nowIso = new Date().toISOString();
      db.careAssignments = db.careAssignments || [];
      const currentActive = {};
      db.careAssignments.forEach(function (a) {
        if (a.patientId === patientId && isAssignmentActive(a)) {
          currentActive[a.doctorUserId] = a;
          if (!seen[a.doctorUserId]) {
            a.revokedAt = nowIso;
            a.revokedBy = actor.id;
            appendAudit(db, actor, 'care_assignment_revoke', 'patient', patientId, 'success', { assignmentId: a.id, doctorUserId: a.doctorUserId });
          }
        }
      });
      ids.forEach(function (id) {
        if (!currentActive[id]) {
          const rec = {
            id: makeUuid(),
            patientId: patientId,
            doctorUserId: id,
            assignedAt: nowIso,
            assignedBy: actor.id,
            reason: reason,
            revokedAt: null,
            revokedBy: null
          };
          db.careAssignments.unshift(rec);
          appendAudit(db, actor, 'care_assignment_add', 'patient', patientId, 'success', { assignmentId: rec.id, doctorUserId: id });
        }
      });
      saveDb(db);
      const items = db.careAssignments
        .filter(function (a) { return a.patientId === patientId; })
        .sort(function (a, b) { return Date.parse(b.assignedAt || b.validFrom || 0) - Date.parse(a.assignedAt || a.validFrom || 0); })
        .map(function (a) { return formatAssignment(db, a); });
      return { items: items };
    },

    async adminRevokePatientCareAssignment(patientId, assignmentId) {
      const db = await loadDb();
      const actor = requireAuth(db, ['admin'], 'care_assignment');
      const pt = (db.patients || []).find(function (p) { return p.id === patientId; });
      if (!pt) throw new StaticApiError(404, 'RESOURCE_NOT_FOUND', 'Không tìm thấy hồ sơ', 'Không tìm thấy hồ sơ yêu cầu.');
      const rec = (db.careAssignments || []).find(function (a) { return a.id === assignmentId && a.patientId === patientId; });
      if (!rec) throw new StaticApiError(404, 'RESOURCE_NOT_FOUND', 'Không tìm thấy phân công', 'Không tìm thấy hồ sơ yêu cầu.');
      if (!rec.revokedAt) {
        rec.revokedAt = new Date().toISOString();
        rec.revokedBy = actor.id;
        appendAudit(db, actor, 'care_assignment_revoke', 'patient', patientId, 'success', { assignmentId: rec.id });
        saveDb(db);
      }
      return null;
    },

    /* ---------------- M8: Admin Audit Logs ---------------- */
    async listAuditLogs(params) {
      const db = await loadDb();
      requireAuth(db, ['admin'], 'audit_log');
      const opts = params || {};
      const q = String(opts.q || '').trim().toLowerCase();
      let items = clone(db.auditLogs || []);
      if (opts.actorUserId) {
        items = items.filter(function (a) { return a.actorUserId === opts.actorUserId; });
      }
      if (opts.action) {
        items = items.filter(function (a) { return a.action === opts.action; });
      }
      if (opts.entityType) {
        items = items.filter(function (a) { return a.entityType === opts.entityType; });
      }
      if (opts.entityId) {
        items = items.filter(function (a) { return a.entityId === opts.entityId; });
      }
      if (opts.fromDate) {
        const fromT = new Date(opts.fromDate).getTime();
        if (!isNaN(fromT)) items = items.filter(function (a) { return new Date(a.occurredAt).getTime() >= fromT; });
      }
      if (opts.toDate) {
        const toT = new Date(opts.toDate).getTime();
        if (!isNaN(toT)) items = items.filter(function (a) { return new Date(a.occurredAt).getTime() <= toT; });
      }
      if (q) {
        items = items.filter(function (a) {
          return (a.actorUsername && a.actorUsername.toLowerCase().indexOf(q) >= 0) ||
            (a.requestId && a.requestId.toLowerCase().indexOf(q) >= 0) ||
            (a.entityType && a.entityType.toLowerCase().indexOf(q) >= 0) ||
            (a.detail && JSON.stringify(a.detail).toLowerCase().indexOf(q) >= 0);
        });
      }
      return paginate(items, opts.page, opts.pageSize || 50);
    }
  };

  global.StaticRuntime = StaticRuntime;
})(typeof window !== 'undefined' ? window : globalThis);
