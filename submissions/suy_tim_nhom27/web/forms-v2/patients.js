// Dev A: Danh sách hồ sơ bệnh nhân, tìm kiếm theo mã và tạo hồ sơ mới.
import { missing, esc, displayDate, ageOn, api, requireSignIn } from './api.js';
import { state, isAdmin, runAction, lockBusyUI, navigate } from './router.js';
import { icon, button, heading, notice, messageBox, shell, modal } from './shell.js';

const DISPLAY_NAME_RE = /^(?:[A-Za-z0-9][A-Za-z0-9._-]*|Người bệnh giả lập [0-9]+)$/;
let openingListGen = 0;
let currentSearch = '';

export function formatDob(isoDate) {
  if (!isoDate) return missing;
  const parts = String(isoDate).split('-');
  if (parts.length !== 3) return String(isoDate);
  const [y, m, d] = parts;
  if (!y || !m || !d) return String(isoDate);
  return `${d}/${m}/${y}`;
}

export function sexLabel(sex) {
  return { male: 'Nam', female: 'Nữ', other: 'Khác' }[sex] || missing;
}

export function todayIsoDateVietnam() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function dobAndAgeText(patient) {
  if (!patient?.date_of_birth) return missing;
  const formatted = formatDob(patient.date_of_birth);
  const age = ageOn(patient.date_of_birth);
  return age === null ? formatted : `${formatted} (${age} tuổi)`;
}

function filterPatients(query) {
  const q = String(query || '').trim().toLocaleLowerCase('vi-VN');
  const list = Array.isArray(state.patients) ? state.patients : [];
  if (!q) return list;
  return list.filter(p =>
    [p.code, p.display_name, p.external_id]
      .filter(Boolean)
      .join(' ')
      .toLocaleLowerCase('vi-VN')
      .includes(q)
  );
}

function createArrowSvg() {
  if (typeof document.createElementNS !== 'function') {
    const fallback = document.createElement('span');
    fallback.setAttribute('aria-hidden', 'true');
    return fallback;
  }
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  const path = document.createElementNS(ns, 'path');
  path.setAttribute('d', 'M4 12h16m-6-6 6 6-6 6');
  svg.append(path);
  return svg;
}

function buildRowElement(patient) {
  const tr = document.createElement('tr');

  const tdId = document.createElement('td');
  const codeStrong = document.createElement('strong');
  codeStrong.textContent = patient.code || missing;
  const nameSmall = document.createElement('small');
  const subParts = [patient.display_name || missing];
  if (patient.external_id) subParts.push(`HIS: ${patient.external_id}`);
  nameSmall.textContent = subParts.join(' · ');
  tdId.append(codeStrong, nameSmall);

  const tdDemo = document.createElement('td');
  const br1 = document.createElement('br');
  const dobSmall = document.createElement('small');
  dobSmall.textContent = dobAndAgeText(patient);
  tdDemo.append(sexLabel(patient.sex), br1, dobSmall);

  const tdVisit = document.createElement('td');
  if (patient.latest_visit_at) {
    const br2 = document.createElement('br');
    const visitSmall = document.createElement('small');
    visitSmall.textContent = patient.latest_visit_external_id || 'Đã có lượt khám';
    tdVisit.append(displayDate(patient.latest_visit_at), br2, visitSmall);
  } else {
    const emptySpan = document.createElement('span');
    emptySpan.className = 'muted';
    emptySpan.textContent = 'Chưa có lượt khám';
    tdVisit.append(emptySpan);
  }

  const tdStatus = document.createElement('td');
  const tag = document.createElement('span');
  tag.className = patient.latest_visit_at ? 'tag' : 'tag neutral';
  tag.textContent = patient.latest_visit_at ? 'Đã có lượt khám' : 'Chưa có lượt khám';
  tdStatus.append(tag);

  const tdAction = document.createElement('td');
  const link = document.createElement('a');
  link.className = 'open-link';
  link.href = '#profile';
  link.dataset.patientAction = 'open';
  link.dataset.patientId = patient.id || '';
  link.setAttribute('aria-label', `Mở hồ sơ ${patient.code || ''}`);
  link.textContent = 'Mở hồ sơ ';
  link.append(createArrowSvg());
  tdAction.append(link);

  tr.append(tdId, tdDemo, tdVisit, tdStatus, tdAction);
  return tr;
}

function buildEmptyRowElement(isFiltered) {
  const tr = document.createElement('tr');
  const td = document.createElement('td');
  td.colSpan = 5;
  td.className = 'empty';
  if (isFiltered) {
    td.append('Không tìm thấy hồ sơ khớp với mã đã nhập. ');
    const clearBtn = document.createElement('button');
    clearBtn.type = 'button';
    clearBtn.className = 'button quiet';
    clearBtn.dataset.patientAction = 'clear-search';
    clearBtn.textContent = 'Xóa tìm kiếm';
    td.append(clearBtn);
  } else {
    td.textContent = 'Chưa có hồ sơ trong phạm vi tài khoản.';
  }
  tr.append(td);
  return tr;
}

function patientRowsHtml(rows, isFiltered) {
  if (!rows.length) {
    return isFiltered
      ? '<tr><td colspan="5" class="empty">Không tìm thấy hồ sơ khớp với mã đã nhập. <button type="button" class="button quiet" data-patient-action="clear-search">Xóa tìm kiếm</button></td></tr>'
      : '<tr><td colspan="5" class="empty">Chưa có hồ sơ trong phạm vi tài khoản.</td></tr>';
  }
  return rows.map(p => {
    const sub = [p.display_name || missing, p.external_id ? `HIS: ${p.external_id}` : null]
      .filter(Boolean)
      .join(' · ');
    const visitCell = p.latest_visit_at
      ? `${esc(displayDate(p.latest_visit_at))}<br><small>${esc(p.latest_visit_external_id || 'Đã có lượt khám')}</small>`
      : '<span class="muted">Chưa có lượt khám</span>';
    const statusTag = p.latest_visit_at
      ? '<span class="tag">Đã có lượt khám</span>'
      : '<span class="tag neutral">Chưa có lượt khám</span>';
    return `<tr>
      <td><strong>${esc(p.code || missing)}</strong><small>${esc(sub)}</small></td>
      <td>${esc(sexLabel(p.sex))}<br><small>${esc(dobAndAgeText(p))}</small></td>
      <td>${visitCell}</td>
      <td>${statusTag}</td>
      <td><a class="open-link" href="#profile" data-patient-action="open" data-patient-id="${esc(p.id)}" aria-label="Mở hồ sơ ${esc(p.code || '')}">Mở hồ sơ ${icon('arrow')}</a></td>
    </tr>`;
  }).join('');
}

function renderPatientRows(tbody, rows, isFiltered) {
  if (tbody && typeof document !== 'undefined' && typeof document.createElement === 'function' && typeof tbody.replaceChildren === 'function') {
    const nodes = rows.length ? rows.map(buildRowElement) : [buildEmptyRowElement(isFiltered)];
    tbody.replaceChildren(...nodes);
    return;
  }
  if (tbody) tbody.innerHTML = patientRowsHtml(rows, isFiltered);
}

function updateCounts(total, visible, isFiltered) {
  const countText = isFiltered ? `${visible} / ${total} hồ sơ` : `${total} hồ sơ`;
  const countEl = document.getElementById('patient-count');
  if (countEl) countEl.textContent = countText;
  const footEl = document.getElementById('patient-foot-summary');
  if (footEl) footEl.textContent = total ? `Hiển thị ${visible} / ${total} hồ sơ` : '0 hồ sơ';
}

export async function openPatients() {
  const gen = ++openingListGen;
  const list = await api('/api/forms/patients');
  if (gen !== openingListGen) return;
  state.patients = Array.isArray(list) ? list : [];
  state.route = 'patients';
  currentSearch = '';
  if (typeof history !== 'undefined') history.replaceState(null, '', '#patients');
  renderPatients();
}

export function renderPatients() {
  const all = Array.isArray(state.patients) ? state.patients : [];
  const isFiltered = Boolean(currentSearch.trim());
  const rows = filterPatients(currentSearch);
  const headingAction = isAdmin()
    ? button('Chỉnh biểu mẫu', 'data-nav="fields"', true, 'settings')
    : button('Tạo hồ sơ', 'data-patient-action="new-patient"', true, 'plus');

  shell(
    heading('Hồ sơ bệnh nhân', 'Tìm hồ sơ, xem lượt khám và tiếp tục ghi nhận.', headingAction) +
      messageBox() +
      `<section class="card" aria-label="Danh sách hồ sơ">
        <div class="toolbar">
          <label class="search">
            ${icon('search')}
            <input id="patient-search" type="search" value="${esc(currentSearch)}" placeholder="Tìm theo mã hồ sơ hoặc mã giả lập…" aria-label="Tìm theo mã hồ sơ hoặc mã giả lập" autocomplete="off">
          </label>
          <span class="muted small" id="patient-count">${esc(isFiltered ? `${rows.length} / ${all.length} hồ sơ` : `${all.length} hồ sơ`)}</span>
        </div>
        <div class="table-scroll patient-table">
          <table>
            <thead>
              <tr>
                <th>Hồ sơ / mã giả lập</th>
                <th>Giới tính / ngày sinh</th>
                <th>Lượt khám gần nhất</th>
                <th>Trạng thái hồ sơ</th>
                <th></th>
              </tr>
            </thead>
            <tbody id="patient-rows">${typeof document !== 'undefined' && typeof document.createElement === 'function' ? '' : patientRowsHtml(rows, isFiltered)}</tbody>
          </table>
        </div>
        <div class="table-foot">
          <span>Hồ sơ sắp xếp theo lần tạo gần nhất</span>
          <span id="patient-foot-summary">${esc(all.length ? `Hiển thị ${rows.length} / ${all.length} hồ sơ` : '0 hồ sơ')}</span>
        </div>
      </section>
      <div class="legend">${icon('shield')}<span>Thông tin hiển thị theo phạm vi tài khoản được máy chủ cấp quyền.</span></div>`,
    { active: 'patients', breadcrumb: 'Hồ sơ bệnh nhân', page: 'patients' }
  );

  const main = document.getElementById('main');
  if (!main) return;
  const tbody = main.querySelector('#patient-rows');
  renderPatientRows(tbody, rows, isFiltered);

  const searchInput = main.querySelector('#patient-search');
  searchInput?.addEventListener('input', e => {
    currentSearch = e.target.value;
    const filtered = Boolean(currentSearch.trim());
    const matched = filterPatients(currentSearch);
    renderPatientRows(tbody, matched, filtered);
    updateCounts(all.length, matched.length, filtered);
  });

  main.addEventListener('click', async e => {
    const el = e.target.closest('[data-patient-action]');
    if (!el) return;
    e.preventDefault();
    e.stopPropagation();
    if (el.disabled || state.busy) return;
    const action = el.dataset.patientAction;
    if (action === 'clear-search') {
      currentSearch = '';
      if (searchInput) {
        searchInput.value = '';
        searchInput.focus();
      }
      renderPatientRows(tbody, all, false);
      updateCounts(all.length, all.length, false);
      return;
    }
    if (action === 'new-patient') {
      openCreatePatientModal();
      return;
    }
    if (action === 'open' && el.dataset.patientId) {
      const patientId = el.dataset.patientId;
      try {
        await runAction(async () => {
          await navigate('profile', { patientId });
        });
      } catch (error) {
        if (!requireSignIn(error)) notice(error.message);
      }
    }
  });

  lockBusyUI();
}

export function patientInputs(p = null) {
  const isEdit = Boolean(p?.id);
  const todayMax = todayIsoDateVietnam();
  const dob = p?.date_of_birth || '';
  const currentAge = dob ? ageOn(dob) : null;
  return `<p class="muted">Mã BN do hệ thống cấp. Dùng mã giả lập, không dùng tên người thật.</p>
    <div class="field">
      <label for="patient-name">Mã hiển thị giả lập</label>
      <input id="patient-name" name="display_name" ${isEdit ? 'required' : ''} value="${esc(p?.display_name ?? '')}" placeholder="${isEdit ? 'Ví dụ: HF-DEMO-01' : 'Ví dụ: DEMO-003 (để trống sẽ dùng mã BN)'}" pattern="[A-Za-z0-9][A-Za-z0-9._-]*|Người bệnh giả lập [0-9]+" title="Chỉ dùng chữ, số, dấu chấm, gạch dưới, gạch nối hoặc Người bệnh giả lập &lt;số&gt;" maxlength="200" autocomplete="off">
      <span class="hint">Chữ, số, dấu chấm, gạch dưới hoặc gạch nối (hoặc "Người bệnh giả lập &lt;số&gt;"). Không nhập họ tên.</span>
    </div>
    <div class="field-grid">
      <div class="field">
        <label for="patient-dob">Ngày sinh</label>
        <input id="patient-dob" name="date_of_birth" type="date" max="${esc(todayMax)}" value="${esc(dob)}">
        <span class="hint" id="patient-age">Tuổi hiện tại: ${esc(currentAge === null ? missing : `${currentAge} tuổi`)}</span>
      </div>
      <div class="field">
        <label for="patient-sex">Giới tính</label>
        <select id="patient-sex" name="sex">
          <option value="">${missing}</option>
          ${[['male', 'Nam'], ['female', 'Nữ'], ['other', 'Khác']].map(([v, label]) =>
            `<option value="${esc(v)}" ${v === p?.sex ? 'selected' : ''}>${esc(label)}</option>`
          ).join('')}
        </select>
      </div>
      <div class="field">
        <label for="patient-insurance">Mã BHYT</label>
        <input id="patient-insurance" name="insurance_number" value="${esc(p?.insurance_number ?? '')}" maxlength="100" placeholder="Nếu có" autocomplete="off">
      </div>
      <div class="field">
        <label for="external-id">Mã nguồn HIS (nếu có)</label>
        <input id="external-id" name="external_id" value="${esc(p?.external_id ?? '')}" maxlength="100" placeholder="Ví dụ: SYN-001" autocomplete="off">
      </div>
    </div>`;
}

export function bindPatientAge(root = document) {
  const dobInput = root.querySelector('#patient-dob');
  const ageOut = root.querySelector('#patient-age');
  if (!dobInput || !ageOut) return;
  dobInput.addEventListener('input', () => {
    if (dobInput.validity?.badInput) {
      ageOut.textContent = 'Ngày sinh không hợp lệ.';
      return;
    }
    const age = ageOn(dobInput.value);
    ageOut.textContent = `Tuổi hiện tại: ${age === null ? missing : `${age} tuổi`}`;
  });
}

export function patientBody(data, { requireDisplayName = false, dobEl = null } = {}) {
  if (dobEl?.validity?.badInput) {
    throw new Error('Ngày sinh không hợp lệ.');
  }
  const clean = key => {
    const raw = data.get(key);
    if (raw == null) return null;
    const trimmed = String(raw).trim();
    return trimmed === '' ? null : trimmed;
  };
  const body = {
    display_name: clean('display_name'),
    date_of_birth: clean('date_of_birth'),
    sex: clean('sex'),
    insurance_number: clean('insurance_number'),
    external_id: clean('external_id'),
  };
  if (requireDisplayName && !body.display_name) {
    throw new Error('Mã hiển thị giả lập không được để trống.');
  }
  if (body.display_name && !DISPLAY_NAME_RE.test(body.display_name)) {
    throw new Error('Mã hiển thị giả lập chỉ gồm chữ, số, dấu chấm, gạch dưới, gạch nối hoặc "Người bệnh giả lập <số>".');
  }
  if (body.date_of_birth && body.date_of_birth > todayIsoDateVietnam()) {
    throw new Error('Ngày sinh không được ở tương lai.');
  }
  return body;
}

export function openCreatePatientModal() {
  if (isAdmin()) {
    notice('Quản trị viên không có quyền tạo hồ sơ mới.', 'warn');
    return null;
  }
  let requestId = crypto.randomUUID();
  const dialog = modal(
    'Tạo hồ sơ',
    patientInputs(null),
    async (data, d) => {
      const dobEl = d.querySelector('#patient-dob');
      const body = patientBody(data, { requireDisplayName: false, dobEl });
      if (!body.display_name) delete body.display_name;
      let created;
      try {
        created = await api('/api/forms/patients', {
          method: 'POST',
          body: { id: requestId, ...body },
        });
      } catch (err) {
        if (err.status === 409 && /Mã yêu cầu/.test(err.message || '')) {
          requestId = crypto.randomUUID();
        }
        throw err;
      }
      if (!Array.isArray(state.patients)) state.patients = [];
      if (!state.patients.some(p => p.id === created.id)) {
        state.patients.unshift(created);
      }
      d.close();
      try {
        await navigate('profile', { patientId: created.id });
        notice('Đã tạo hồ sơ. Có thể mở lượt khám đầu tiên.', 'success');
      } catch (err) {
        if (!requireSignIn(err)) {
          renderPatients();
          notice('Đã tạo hồ sơ nhưng chưa mở được chi tiết: ' + err.message, 'warn');
        }
      }
    },
    { submitLabel: 'Tạo hồ sơ', maxWidth: '560px' }
  );
  if (dialog) bindPatientAge(dialog);
  return dialog;
}

export { openCreatePatientModal as openNewPatientModal };
