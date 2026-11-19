// Dev A: Chi tiết hồ sơ bệnh nhân, provenance theo dõi, dòng thời gian lượt khám và hành chính.
import { missing, esc, fmt, displayDate, toISO, ageOn, api, requireSignIn } from './api.js';
import { state, isAdmin, resetDraft, confirmLeave, runAction, lockBusyUI, navigate } from './router.js';
import { icon, button, heading, notice, messageBox, shell, modal } from './shell.js';
import { patientInputs, patientBody, bindPatientAge, formatDob, sexLabel } from './patients.js';

let openingPatientGen = 0;

function visitCode(v) {
  return v?.external_id || ('Lượt ' + String(v?.id || '').slice(0, 8));
}

function vietnamDateIso(isoTimestamp) {
  if (!isoTimestamp) return null;
  const d = new Date(isoTimestamp);
  if (Number.isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

const repeatLabels = {
  test_code: 'Loại xét nghiệm',
  name: 'Tên',
  ingredient: 'Hoạt chất',
  dose: 'Liều ghi nhận ban đầu',
  strength: 'Hàm lượng ghi nhận',
  dose_value: 'Liều mỗi lần',
  dose_unit: 'Đơn vị liều',
  route: 'Đường dùng',
  frequency: 'Tần suất ghi nhận',
  start_date: 'Ngày bắt đầu',
  end_date: 'Ngày kết thúc',
  status: 'Trạng thái thuốc',
  category: 'Nhóm thuốc/sản phẩm',
  source: 'Nguồn kết quả/thông tin',
  observed_at: 'Thời điểm thực hiện/ghi nhận theo nguồn',
  value: 'Giá trị',
  unit: 'Đơn vị',
};

const repeatOptions = {
  status: [
    { code: 'current', label: 'Đang sử dụng' },
    { code: 'planned', label: 'Dự kiến' },
    { code: 'stopped', label: 'Đã ngừng' },
  ],
  category: [
    { code: 'prescription', label: 'Thuốc kê đơn' },
    { code: 'otc', label: 'Thuốc không kê đơn (OTC)' },
    { code: 'supplement', label: 'Thực phẩm bổ sung/TPCN' },
    { code: 'traditional', label: 'Y học cổ truyền' },
  ],
};

const medicationTimingColumns = new Set([
  'start_date',
  'end_date',
  'observed_at',
  'status',
  'category',
  'source',
]);

function repeatColumns(f) {
  if (f?.type === 'medications') {
    return [
      'name',
      'ingredient',
      'dose',
      ...(f.contract_version >= 2 ? ['strength', 'dose_value', 'dose_unit'] : []),
      'route',
      'frequency',
      'observed_at',
      ...(f.contract_version >= 2 ? ['start_date', 'end_date', 'status', 'category', 'source'] : []),
    ];
  }
  return [
    ...(f?.contract_version >= 2 ? ['test_code'] : []),
    'name',
    'value',
    'unit',
    'observed_at',
    ...(f?.contract_version >= 2 ? ['source'] : []),
  ];
}

function repeatValueLabel(f, column, value, row) {
  if (value == null) return missing;
  if (column === 'observed_at') return displayDate(value);
  if (column === 'start_date' || column === 'end_date') return formatDob(value);
  if (column === 'test_code') {
    return f?.result_tests?.find(t => String(t.code) === String(value))?.label || fmt(value);
  }
  return repeatOptions[column]?.find(c => String(c.code) === String(value))?.label || fmt(value);
}

function medicationValueContent(field, row, index) {
  const keys = [...new Set([...repeatColumns(field), ...Object.keys(row || {})])]
    .filter(key => key !== 'name' && Object.hasOwn(row || {}, key));
  const detail = key =>
    `<div><dt>${esc(repeatLabels[key] || key)}</dt><dd>${esc(repeatValueLabel(field, key, row[key], row))}</dd></div>`;
  return `<div class="repeat-card med-card">
    <strong>${index + 1}. ${esc(row?.name || missing)}</strong>
    <div class="med-columns">
      <dl class="facts">${keys.filter(key => !medicationTimingColumns.has(key)).map(detail).join('')}</dl>
      <dl class="facts">${keys.filter(key => medicationTimingColumns.has(key)).map(detail).join('')}</dl>
    </div>
  </div>`;
}

export function valueContent(f, value) {
  if (value == null) return missing;
  if (f?.type === 'boolean') return value ? 'Có' : 'Không';
  if (['select', 'multiselect'].includes(f?.type)) {
    const label = v => f.choices?.find(c => String(c.code) === String(v))?.label || v;
    return esc(Array.isArray(value) ? (value.length ? value.map(label).join(', ') : 'Không có mục') : label(value));
  }
  if (f?.type === 'medications') {
    if (!Array.isArray(value)) return esc(fmt(value));
    return value.length
      ? `<div class="repeat-items">${value.map((row, index) => medicationValueContent(f, row, index)).join('')}</div>`
      : 'Không có mục';
  }
  if (f?.type === 'results') {
    if (!Array.isArray(value)) return esc(fmt(value));
    return value.length
      ? `<div class="repeat-items">${value.map((r, i) => {
          const title = r?.name || f.result_tests?.find(t => t.code === r?.test_code)?.label || missing;
          const entries = Object.entries(r || {}).filter(([key]) => key !== 'name');
          return `<div class="repeat-card"><strong>${i + 1}. ${esc(title)}</strong><dl class="facts">${entries
            .map(([key, v]) => `<div><dt>${esc(repeatLabels[key] || key)}</dt><dd>${esc(repeatValueLabel(f, key, v, r))}</dd></div>`)
            .join('')}</dl></div>`;
        }).join('')}</div>`
      : 'Không có mục';
  }
  if (f?.type === 'date') return esc(formatDob(value));
  return esc(f?.type === 'datetime' ? displayDate(value) : fmt(value)) + (f?.unit && value !== null ? ' ' + esc(f.unit) : '');
}

function formatMetric(value) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '—';
  return Number.isInteger(value)
    ? String(value)
    : value.toLocaleString('vi-VN', { maximumFractionDigits: 2 });
}

function renderProvenance(visit) {
  if (!visit) return '';
  return `<p class="source">${icon('clock')}<span>Nguồn: ${esc(visitCode(visit))} · ${esc(displayDate(visit.occurred_at))}</span></p>`;
}

function renderMonitoringCard(overview) {
  const latest = overview?.latest_visit || null;
  const summaries = overview?.summary_visits || {};
  const pick = key => (Object.hasOwn(summaries, key) ? summaries[key] : latest);
  const disease = pick('disease');
  const med = pick('medications');
  const allergy = pick('allergy');

  const dm = disease?.metadata || {};
  const secondaryText = Array.isArray(dm.secondary_diagnosis_codes) && dm.secondary_diagnosis_codes.length
    ? dm.secondary_diagnosis_codes.join(', ')
    : missing;

  const height = latest?.values_json?.chieu_cao;
  const weight = latest?.values_json?.can_nang;
  const computedBmi = latest?.derived_values?.bmi ??
    (typeof height === 'number' && typeof weight === 'number' && height > 0 && weight > 0
      ? weight / (height / 100) ** 2
      : null);

  const medFields = med
    ? (med.fields || []).filter(f => f.type === 'medications' && med.values_json?.[f.code] != null)
    : [];

  const am = allergy?.metadata || {};
  const allergyText = {
    unknown: 'Chưa hỏi/chưa biết',
    none: 'Đã xác nhận không có',
    known: am.allergy_details ? `Đã ghi nhận: ${am.allergy_details}` : 'Đã ghi nhận, chưa có mô tả',
  }[am.allergy_status] || 'Chưa có dữ liệu. Cần ghi nhận riêng, không mặc định là không có dị ứng.';

  return `<section class="card">
    <div class="card-top">
      <h2>Thông tin theo dõi</h2>
      <span class="tag outline">${latest ? 'Lượt gần nhất' : 'Chưa có lượt có thời điểm'}</span>
    </div>
    ${disease ? renderProvenance(disease) : ''}
    ${disease
      ? `<dl class="detail-grid">
          <div><dt>Chẩn đoán chính (ICD-10)</dt><dd class="${dm.primary_diagnosis_code ? '' : 'muted'}">${esc(dm.primary_diagnosis_code || missing)}</dd></div>
          <div><dt>Bệnh kèm theo (ICD-10)</dt><dd class="${secondaryText === missing ? 'muted' : ''}">${esc(secondaryText)}</dd></div>
          <div><dt>Lý do khám</dt><dd class="${dm.reason ? '' : 'muted'}">${esc(dm.reason || missing)}</dd></div>
        </dl>${dm.hpi ? `<p class="hint"><strong>Bệnh sử / diễn biến:</strong> ${esc(dm.hpi)}</p>` : ''}`
      : '<p class="muted small">Chưa có thông tin bệnh đã ghi nhận.</p>'}
    <div class="section-rule">
      <h3>Số đo đã ghi nhận</h3>
      ${latest
        ? `${renderProvenance(latest)}
          <div class="measure-strip">
            <div class="measure"><span>Chiều cao</span><strong>${esc(height != null ? formatMetric(height) : '—')}</strong><small>${height != null ? 'cm' : 'Chưa có dữ liệu'}</small></div>
            <div class="measure"><span>Cân nặng</span><strong>${esc(weight != null ? formatMetric(weight) : '—')}</strong><small>${weight != null ? 'kg' : 'Chưa có dữ liệu'}</small></div>
            <div class="measure"><span>BMI · giá trị tính</span><strong>${esc(computedBmi != null ? Number(computedBmi).toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—')}</strong><small>${computedBmi != null ? 'kg/m²' : 'Chưa tính được'}</small></div>
          </div>
          <p class="hint">BMI tính từ chiều cao và cân nặng trong cùng lượt khám gần nhất.</p>`
        : '<p class="muted small">Chưa có lượt khám có thời điểm để tổng hợp số đo.</p>'}
    </div>
    <div class="section-rule">
      <h3>Thuốc đang ghi nhận</h3>
      ${med ? renderProvenance(med) : ''}
      ${medFields.length
        ? medFields.map(f => {
            const rendered = valueContent(f, med.values_json[f.code]);
            return rendered.startsWith('<') ? rendered : `<p class="small">${rendered}</p>`;
          }).join('')
        : '<p class="muted small">Chưa có dữ liệu thuốc.</p>'}
      <p class="hint">Cần đối chiếu lại thuốc khi tái khám.</p>
    </div>
    <div class="section-rule">
      <h3>Dị ứng / phản ứng có hại</h3>
      ${allergy ? renderProvenance(allergy) : ''}
      <p class="${am.allergy_status === 'known' ? '' : 'muted small'}">${am.allergy_status === 'known' ? '<span class="tag warn">Đã ghi nhận dị ứng</span> ' : ''}${esc(allergyText)}</p>
    </div>
  </section>`;
}

function sortVisits(visits) {
  return [...(visits || [])].sort((a, b) => {
    const ta = a?.occurred_at ? new Date(a.occurred_at).getTime() : NaN;
    const tb = b?.occurred_at ? new Date(b.occurred_at).getTime() : NaN;
    const validA = Number.isFinite(ta);
    const validB = Number.isFinite(tb);
    if (validA !== validB) return validB ? 1 : -1;
    if (validA && validB && tb !== ta) return tb - ta;
    return 0;
  });
}

export async function openPatient(patientId) {
  if (!patientId) {
    await navigate('patients');
    return;
  }
  const gen = ++openingPatientGen;
  const data = await api('/api/forms/patients/' + encodeURIComponent(patientId) + '/overview');
  if (gen !== openingPatientGen) return;
  if (!data?.patient) throw new Error('Không đọc được dữ liệu hồ sơ từ máy chủ.');

  state.overview = data;
  state.patient = data.patient;
  state.visit = null;
  resetDraft();
  state.route = 'profile';

  if (Array.isArray(state.patients)) {
    const idx = state.patients.findIndex(item => item.id === data.patient.id);
    if (idx >= 0) {
      state.patients[idx] = {
        ...state.patients[idx],
        ...data.patient,
        latest_visit_at: data.latest_visit?.occurred_at ?? state.patients[idx].latest_visit_at ?? null,
        latest_visit_external_id: data.latest_visit?.external_id ?? state.patients[idx].latest_visit_external_id ?? null,
      };
    }
  }

  if (typeof history !== 'undefined') history.replaceState(null, '', '#profile');
  renderProfile();
}

export function renderProfile() {
  if (!state.patient) {
    void navigate('patients');
    return;
  }
  const p = state.patient;
  const overview = state.overview?.patient?.id === p.id
    ? state.overview
    : { patient: p, latest_visit: null, visits: [], summary_visits: {} };
  const visits = sortVisits(overview.visits);
  const age = ageOn(p.date_of_birth);
  const dobText = p.date_of_birth
    ? `${formatDob(p.date_of_birth)}${age === null ? '' : ` (${age} tuổi)`}`
    : missing;

  const headingActions = button('Về danh sách', 'data-profile-action="back-patients"', false, 'back') +
    (!isAdmin() ? button('Mở lượt mới', 'data-profile-action="new-visit"', true, 'plus') : '');
  const subtitle = `Mã hiển thị: ${p.display_name || p.code || missing}${p.external_id ? ' · Mã nguồn HIS: ' + p.external_id : ''}`;

  const timelineHtml = visits.length
    ? `<ol class="timeline">${visits.map(v => {
        const typeLabel = { new: 'Khám mới', followup: 'Tái khám' }[v.metadata?.visit_type] || 'Chưa phân loại';
        const dateLabel = v.occurred_at ? displayDate(v.occurred_at) : 'Chưa có thời điểm khám';
        const revLabel = `v${v.catalog_revision ?? '?'} · Lần lưu ${v.revision ?? 0}`;
        return `<li>
          <div class="date">${esc(dateLabel)}</div>
          <strong>${esc(visitCode(v))}</strong>
          <p>${esc(typeLabel)} <span class="tag ${v.revision > 0 ? '' : 'neutral'}">${esc(revLabel)}</span></p>
          <button type="button" class="button" data-visit-id="${esc(v.id)}">${isAdmin() ? 'Xem lượt khám' : 'Mở lượt khám'} ${icon('arrow')}</button>
        </li>`;
      }).join('')}</ol>`
    : `<p class="muted small">Chưa có lượt khám.${isAdmin() ? '' : ' Nhấn "Mở lượt mới" để bắt đầu ghi nhận.'}</p>`;

  shell(
    heading(esc(p.code || missing), esc(subtitle), headingActions) +
      messageBox() +
      `<div class="profile-layout">
        <div class="stack">
          <section class="card">
            <div class="card-top">
              <div class="identity">
                <span class="identity-icon">${icon('patients')}</span>
                <div>
                  <h2>Thông tin hành chính</h2>
                  <small class="muted">Mã hồ sơ giữ ổn định qua các lượt khám</small>
                </div>
              </div>
              <button type="button" class="icon-button" data-profile-action="edit-patient" aria-label="Chỉnh thông tin hành chính" title="Chỉnh thông tin hành chính">${icon('edit')}</button>
            </div>
            <dl class="detail-grid">
              <div><dt>Mã hiển thị giả lập</dt><dd>${esc(p.display_name || missing)}</dd></div>
              <div><dt>Ngày sinh</dt><dd class="${p.date_of_birth ? '' : 'muted'}">${esc(dobText)}</dd></div>
              <div><dt>Giới tính</dt><dd class="${p.sex ? '' : 'muted'}">${esc(sexLabel(p.sex))}</dd></div>
              <div><dt>Mã BHYT</dt><dd class="${p.insurance_number ? '' : 'muted'}">${esc(p.insurance_number || missing)}</dd></div>
              <div><dt>Mã nguồn HIS</dt><dd class="${p.external_id ? '' : 'muted'}">${esc(p.external_id || missing)}</dd></div>
              <div><dt>Ngày tạo hồ sơ</dt><dd>${esc(displayDate(p.created_at))}</dd></div>
            </dl>
            <p class="hint">Sửa hành chính lần ${esc(p.demographic_revision ?? 0)} · Cập nhật: ${esc(displayDate(p.updated_at))}</p>
          </section>
          ${renderMonitoringCard(overview)}
        </div>
        <aside class="stack">
          <section class="card">
            <div class="card-top">
              <h2>Lượt khám</h2>
              <span class="tag neutral">${esc(visits.length)}</span>
            </div>
            ${timelineHtml}
          </section>
          <section class="card">
            <h3>Lịch sử hồ sơ</h3>
            <p class="muted small">Xem ai đã sửa thông tin hành chính và thời điểm cập nhật.</p>
            ${button('Xem lịch sử', 'data-profile-action="patient-history"', false, 'history')}
          </section>
        </aside>
      </div>`,
    {
      active: 'patients',
      breadcrumb: `Hồ sơ bệnh nhân / ${p.code || ''}`,
      page: 'profile',
    }
  );

  const main = document.getElementById('main');
  if (!main) return;
  main.addEventListener('click', async e => {
    const el = e.target.closest('[data-profile-action],[data-visit-id]');
    if (!el) return;
    e.preventDefault();
    e.stopPropagation();
    if (el.disabled || state.busy) return;
    try {
      await runAction(async () => {
        if (el.dataset.visitId) {
          await navigate('encounter', { visitId: el.dataset.visitId });
          return;
        }
        switch (el.dataset.profileAction) {
          case 'back-patients':
            await navigate('patients');
            break;
          case 'new-visit':
            openCreateVisitModal();
            break;
          case 'edit-patient':
            if (confirmLeave()) openEditPatientModal();
            break;
          case 'patient-history':
            if (confirmLeave()) await openPatientHistoryModal();
            break;
        }
      });
    } catch (error) {
      if (!requireSignIn(error)) notice(error.message);
    }
  });

  lockBusyUI();
}

export function openEditPatientModal() {
  if (!state.patient) return null;
  const p = state.patient;
  let mutationId = crypto.randomUUID();
  const dialog = modal(
    'Chỉnh thông tin hành chính',
    patientInputs(p),
    async (data, d) => {
      const dobEl = d.querySelector('#patient-dob');
      const body = patientBody(data, { requireDisplayName: true, dobEl });
      try {
        await api('/api/forms/patients/' + encodeURIComponent(p.id), {
          method: 'PATCH',
          body: {
            expected_revision: p.demographic_revision,
            mutation_id: mutationId,
            ...body,
          },
        });
      } catch (err) {
        if (err.status === 409 && /Mã lần lưu/.test(err.message || '')) {
          mutationId = crypto.randomUUID();
        }
        throw err;
      }
      d.close();
      try {
        await openPatient(p.id);
        notice('Đã lưu thông tin hành chính và lịch sử thay đổi.', 'success');
      } catch (err) {
        if (!requireSignIn(err)) notice('Đã lưu nhưng chưa tải lại được hồ sơ: ' + err.message, 'warn');
      }
    },
    { submitLabel: 'Lưu thay đổi', maxWidth: '560px' }
  );
  if (dialog) bindPatientAge(dialog);
  return dialog;
}

export async function openPatientHistoryModal() {
  if (!state.patient) return null;
  const patientId = state.patient.id;
  const patientCode = state.patient.code || '';
  const rows = await api('/api/forms/patients/' + encodeURIComponent(patientId) + '/history');
  if (state.patient?.id !== patientId) return null;

  const labels = {
    display_name: 'Mã hiển thị giả lập',
    date_of_birth: 'Ngày sinh',
    sex: 'Giới tính',
    insurance_number: 'Mã BHYT',
    external_id: 'Mã nguồn HIS',
  };
  const formatFieldVal = (key, val) => {
    if (val == null) return missing;
    if (key === 'sex') return sexLabel(val);
    if (key === 'date_of_birth') return formatDob(val);
    return fmt(val);
  };

  const body = Array.isArray(rows) && rows.length
    ? rows.map((h, idx) => `<details ${idx === 0 ? 'open' : ''}>
        <summary>Lần chỉnh ${esc(h.revision)}${h.username ? ' · ' + esc(h.username) : ''} · ${esc(displayDate(h.created_at))}</summary>
        <div class="table-scroll">
          <table>
            <thead><tr><th>Thông tin</th><th>Trước</th><th>Sau</th></tr></thead>
            <tbody>
              ${Object.entries(labels).map(([key, label]) => `<tr>
                <td>${esc(label)}</td>
                <td>${esc(formatFieldVal(key, h.before_json?.[key]))}</td>
                <td>${esc(formatFieldVal(key, h.after_json?.[key]))}</td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </details>`).join('')
    : '<div class="empty">Chưa có thay đổi hành chính nào được ghi nhận.</div>';

  return modal(`Lịch sử hành chính · ${patientCode}`, body, async () => {}, {
    readOnly: true,
    maxWidth: '860px',
  });
}

export function openCreateVisitModal() {
  if (isAdmin()) {
    notice('Quản trị viên không có quyền mở lượt khám mới.', 'warn');
    return null;
  }
  if (!state.patient) return null;
  const patientId = state.patient.id;
  const patientDob = state.patient.date_of_birth || null;
  let visitId = crypto.randomUUID();

  const content = `<div class="field-grid">
      <div class="field">
        <label for="visit-code">Mã lượt nguồn (nếu có)</label>
        <input id="visit-code" name="external_id" maxlength="100" placeholder="Ví dụ: LK-2026-01" autocomplete="off">
      </div>
      <div class="field">
        <label for="new-visit-type">Loại khám</label>
        <select id="new-visit-type" name="visit_type">
          <option value="">${missing}</option>
          <option value="new">Khám mới</option>
          <option value="followup">Tái khám</option>
        </select>
      </div>
      <div class="field full">
        <label for="occurred">Thời điểm khám</label>
        <input id="occurred" name="occurred_at" type="datetime-local" step="60">
        <span class="hint">Để trống khi chưa rõ; không dùng thời điểm mở màn hình.</span>
      </div>
      <div class="field full">
        <label for="new-reason">Lý do khám</label>
        <input id="new-reason" name="reason" maxlength="5000" placeholder="Nếu có">
      </div>
    </div>`;

  return modal(
    'Mở lượt mới',
    content,
    async (data, d) => {
      const occurredEl = d.querySelector('#occurred');
      if (occurredEl?.validity?.badInput) {
        throw new Error('Thời điểm khám không hợp lệ.');
      }
      const occurredAt = toISO(data.get('occurred_at'));
      if (occurredAt && patientDob) {
        const visitDay = vietnamDateIso(occurredAt);
        if (visitDay && visitDay < patientDob) {
          throw new Error('Thời điểm khám không được trước ngày sinh đã biết.');
        }
      }
      const trimOrNull = key => {
        const v = data.get(key);
        if (v == null) return null;
        const s = String(v).trim();
        return s === '' ? null : s;
      };
      let created;
      try {
        created = await api('/api/forms/patients/' + encodeURIComponent(patientId) + '/visits', {
          method: 'POST',
          body: {
            id: visitId,
            external_id: trimOrNull('external_id'),
            occurred_at: occurredAt,
            metadata: {
              visit_type: data.get('visit_type') || null,
              reason: trimOrNull('reason'),
            },
          },
        });
      } catch (err) {
        if (err.status === 409 && /Mã yêu cầu/.test(err.message || '')) {
          visitId = crypto.randomUUID();
        }
        throw err;
      }
      d.close();
      try {
        await navigate('encounter', { visitId: created.id });
      } catch (err) {
        if (!requireSignIn(err)) {
          await openPatient(patientId).catch(() => {});
          notice('Đã mở lượt mới nhưng chưa tải được biểu mẫu: ' + err.message, 'warn');
        }
      }
    },
    { submitLabel: 'Mở lượt khám', maxWidth: '540px' }
  );
}

export { openCreateVisitModal as openNewVisitModal };
