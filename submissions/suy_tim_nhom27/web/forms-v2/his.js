// Dev B: Excel preview is read-only; only commit writes the selected records.
import { missing, esc, fmt, displayDate, request, api, requireSignIn } from './api.js';
import { state, isAdmin, runAction, lockBusyUI, navigate } from './router.js';
import { icon, button, heading, notice, messageBox, shell, modal } from './shell.js';
import { openVisit } from './encounter.js';

const statusLabels = {fill:'Bổ sung vào ô trống', conflict:'Cần chọn cách xử lý', unchanged:'Không thay đổi',
  source_null:'Nguồn trống, giữ hiện có', unmapped:'Chưa ánh xạ', error:'Lỗi', raw_pending:'Giữ trong dữ liệu HIS gốc'};
const metadataLabels = {admitted_at:'Thời điểm tiếp nhận', ended_at:'Thời điểm kết thúc', department:'Khoa/phòng',
  primary_diagnosis_code:'Mã bệnh chính ICD-10', secondary_diagnosis_codes:'Mã bệnh kèm theo ICD-10'};
const routes = ['import', 'import-preview', 'import-result'];
let actionFlight = null;

function formatImportCell(field, value) {
  if (value == null) return missing;
  if ((field?.code === '@metadata:admitted_at' || field?.code === '@metadata:ended_at') && typeof value === 'string') {
    return displayDate(value);
  }
  if (typeof value === 'object' && !Array.isArray(value)) {
    const parts = Object.values(value).filter(v => v != null).map(v => fmt(v));
    return parts.length ? parts.join(' · ') : missing;
  }
  return fmt(value);
}

function shortOption(text, max = 64) {
  const s = String(text ?? '');
  return s.length > max ? s.slice(0, max - 1) + '…' : s;
}

function freshImport(generation = 0) {
  return {stage:0, fileGeneration:generation, reading:false, filename:null, content_base64:null,
    preview:null, decisions:{}, commitBody:null, result:null};
}

function importState() {
  state.import ||= freshImport();
  state.import.decisions ||= {};
  return state.import;
}

function setStage(stage) {
  const im = importState();
  im.stage = stage;
  state.route = routes[stage];
  if (typeof history !== 'undefined') history.replaceState(null, '', '#' + state.route);
}

function redirectToPatients() {
  navigate('patients').catch(err => { if (!requireSignIn(err)) notice(err.message); });
}

export function showImport(stage = 0) {
  if (isAdmin()) { redirectToPatients(); return; }
  const im = importState();
  let next = [0,1,2].includes(stage) ? stage : 0;
  if (next === 1 && !im.preview) next = 0;
  if (next === 2 && !im.result) next = im.preview ? 1 : 0;
  setStage(next);
  renderImport();
}

function steps(stage) {
  return `<ol class="steps" aria-label="Tiến trình nhập HIS">${['Chọn file','Đối chiếu','Kết quả'].map((label, i) =>
    `<li class="${stage === i ? 'active' : stage > i ? 'done' : ''}" ${stage === i ? 'aria-current="step"' : ''}><b>${stage > i ? icon('check') : i + 1}</b>${label}</li>`).join('')}</ol>`;
}

function fileContent(im) {
  return `<div class="import-layout"><section class="card"><div class="card-top"><h2>Chọn file Excel</h2><span class="tag outline">.xlsx</span></div>
    <div class="dropzone" id="dropzone"><div class="upload-icon">${icon('upload')}</div><h3 id="file-name">${esc(im.filename || 'Chọn file HIS cần nhập')}</h3><p>Định dạng .xlsx · tối đa 4 MiB</p>
      <label><input class="file-input" type="file" id="his-file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"><span class="button">${icon('file')}Chọn file từ máy</span></label></div>
    <p id="file-read-status" class="hint" role="status">${im.reading ? 'Đang đọc file…' : im.filename ? 'File đã sẵn sàng: ' + esc(im.filename) : ''}</p>
    <div class="import-bottom">${button('Tải mẫu HIS — 2 ca', 'data-import="template"', false, 'download')}
      <button class="button primary" id="preview-button" data-import="auto-preview" ${im.reading || !im.content_base64 ? 'disabled' : ''}>Đọc file và đối chiếu ${icon('arrow')}</button></div>
    <p class="hint section-rule">Chỉ bước xác nhận mới ghi dữ liệu lên máy chủ.</p></section>
    <aside class="stack"><section class="card"><h2>Trước khi nhập</h2><ul class="guide-list">
      <li>${icon('file')}<div><strong>Giữ cấu trúc HIS</strong>Sheet3, 42 cột theo file mẫu. Hệ thống tự nhận diện trường.</div></li>
      <li>${icon('patients')}<div><strong>Đối chiếu đúng hồ sơ</strong>Kiểm tra mã nguồn và lượt khám trước khi xác nhận.</div></li>
      <li>${icon('shield')}<div><strong>Giữ dữ liệu đang có</strong>Ô trống trong file không xóa giá trị đã lưu.</div></li>
    </ul></section><div class="notice">${icon('info')}<div>Tối đa 500 cột, 1.000 dòng dữ liệu mỗi sheet và 100 bản ghi mỗi lần nhập.</div></div></aside></div>`;
}

function rawSource(source) {
  if (!Array.isArray(source?.columns)) return '';
  return `<details class="his-source"><summary>Dữ liệu HIS gốc · ${esc(source.sheet)} · dòng ${esc(source.row)}</summary>
    ${source.source_name ? `<p class="hint">${esc(source.source_name)}</p>` : ''}
    <div class="table-scroll"><table><thead><tr><th>Cột nguồn</th><th>Giá trị gốc</th></tr></thead><tbody>
      ${source.columns.map(c => `<tr><td>${esc(c.header)}</td><td>${esc(fmt(c.value))}</td></tr>`).join('')}
    </tbody></table></div></details>`;
}

function selectedDecision(im, record) {
  return im.decisions[record.index] ||= {selected:record.status === 'eligible', conflicts:{}};
}

function previewContent(im) {
  const plan = im.preview;
  const conflicts = plan.records.reduce((n, r) => n + (r.fields || []).filter(f => f.status === 'conflict').length, 0);
  const newPatients = plan.records.filter(r => r.target_action === 'create_patient_and_visit').length;
  const matchedPatients = plan.records.filter(r => r.target_action === 'create_visit' || r.target_action === 'update_visit').length;
  return `<div class="file-pill">${icon('file')}<div><strong>${esc(im.filename)}</strong><small>Sheet3 · đối chiếu trước khi xác nhận</small></div>${button('Đổi file', 'data-import="source"')}</div>
    <div class="import-summary"><span class="tag">${esc(plan.eligible)} dòng hợp lệ</span>${matchedPatients ? `<span class="tag">${esc(matchedPatients)} hồ sơ khớp</span>` : ''}${newPatients ? `<span class="tag neutral">${esc(newPatients)} hồ sơ mới</span>` : ''}<span class="tag ${plan.errors ? 'warn' : 'neutral'}">${esc(plan.errors)} dòng lỗi</span><span class="tag ${conflicts ? 'warn' : 'neutral'}">${esc(conflicts)} trường xung đột</span></div>
    <div class="notice">${icon('info')}<div>Xem trước chỉ đọc, chưa lưu dữ liệu. Chọn giữ hiện có hoặc nhận từ file cho từng trường xung đột của các dòng được chọn.</div></div>
    <details class="import-rules"><summary>Quy tắc nhận diện và dữ liệu chưa quy đổi</summary><p>${esc(plan.profile || missing)}</p><ul>${(plan.notes || []).map(note => `<li>${esc(note)}</li>`).join('')}</ul></details>
    ${plan.records.map(record => {
      const decision = selectedDecision(im, record);
      const action = {create_patient_and_visit:'Tạo hồ sơ và lượt khám mới', create_visit:'Tạo lượt mới trong hồ sơ đã đối chiếu', update_visit:'Cập nhật lượt đã có'}[record.target_action];
      return `<section class="card"><div class="card-top"><div><h2>Bản ghi ${esc(Number(record.index) + 1)} · Đích: ${esc(record.target_patient_code || 'Sẽ cấp mã BN khi xác nhận')}</h2>
        <p><strong>${esc(record.target_patient_name || 'Chưa có mã hiển thị đích')}</strong></p>${action ? `<span class="tag outline">${esc(action)}</span>` : ''}
        <p class="hint">Thời điểm khám đích: ${esc(displayDate(record.target_occurred_at))}</p>
        <small>Mã trong file: ${esc(record.patient_code || 'Thiếu mã hồ sơ')} / ${esc(record.visit_external_id || 'Thiếu mã lượt')}</small></div>
        <label class="check"><input type="checkbox" data-import-record="${esc(record.index)}" ${decision.selected && record.status === 'eligible' ? 'checked' : ''} ${record.status !== 'eligible' ? 'disabled' : ''}> Chọn nhập dòng này</label></div>
        ${(record.errors || []).length ? `<div class="status error" role="alert">${record.errors.map(e => `<p>${esc(e.path)} · ${esc(e.reason)}</p>`).join('')}</div>` : ''}
        <div class="table-scroll comparison"><table><thead><tr><th>Trường / nguồn</th><th>Giá trị gốc</th><th>Hiện có</th><th>Trong file (sau kiểm tra)</th><th>Xử lý</th></tr></thead><tbody>
        ${(record.fields || []).map(field => {
          const label = metadataLabels[(field.code || '').replace('@metadata:', '')] || field.label || field.code || field.source;
          const value = decision.conflicts[field.code] || '';
          const rawText = formatImportCell(field, Object.hasOwn(field, 'raw') ? field.raw : field.incoming);
          const currentText = formatImportCell(field, field.current);
          const incomingText = formatImportCell(field, field.incoming);
          const statusClass = field.status === 'fill' ? 'tag' : field.status === 'error' ? 'tag warn' : 'tag neutral';
          return `<tr><td><strong>${esc(label)}</strong><small>${esc(field.path)}</small></td><td>${esc(rawText)}</td>
            <td>${esc(currentText)}</td><td>${esc(incomingText)}</td><td>${field.status === 'conflict' ?
              `<select class="conflict-choice" data-override="${esc(record.index)}" data-code="${esc(field.code)}" aria-label="Xử lý xung đột ${esc(label)}">
                <option value="" ${!value ? 'selected' : ''}>Chọn cách xử lý…</option><option value="keep" ${value === 'keep' ? 'selected' : ''}>Giữ ${esc(shortOption(currentText))} hiện có</option><option value="override" ${value === 'override' ? 'selected' : ''}>Nhận ${esc(shortOption(incomingText))} từ file</option></select>` : `<span class="${statusClass}">${esc(statusLabels[field.status] || field.status)}</span>`}
            ${field.reason ? (field.status === 'error' ? `<p class="field-error">${esc(field.reason)}</p>` : `<div><small class="muted">${esc(field.reason)}</small></div>`) : ''}</td></tr>`;
        }).join('')}</tbody></table></div>${rawSource(record.raw_source)}</section>`;
    }).join('')}
    <div class="savebar"><div><p>Kiểm tra hồ sơ, lượt và từng xung đột trước khi xác nhận.</p><small id="import-decision-status" role="status"></small></div><div class="row">
      ${button('Quay lại', 'data-import="source"')}${button('Hủy xem trước', 'data-import="cancel"')}
      <button class="button primary" data-import="commit" id="confirm-import" ${commitReady(im) ? '' : 'disabled'}>Xác nhận nhập ${icon('check')}</button></div></div>`;
}

function unselectedContent(rows = []) {
  return rows.length ? rows.map(r => `<div class="section-rule"><strong>Dòng ${esc(Number(r.index) + 1)}</strong><p>${r.status === 'eligible' ? 'Hợp lệ, không được chọn' : 'Chưa đủ điều kiện'}</p>
    ${(r.errors || []).map(e => `<p class="field-error">${esc(e.path)} · ${esc(e.reason)}</p>`).join('')}</div>`).join('') : '<p>Không có dòng bị bỏ lại.</p>';
}

function resultContent(result, historyView = false) {
  return `<section class="card result-card"><div class="result-mark">${icon('check')}</div><h2>${result.replayed ? 'Đã nhận diện lần nhập lặp' : 'Đã hoàn tất nhập file'}</h2>
    <p>${result.replayed ? 'Không ghi thêm dữ liệu. Kết quả lần nhập trước: ' : ''}Đã ghi ${esc(result.written_fields)} trường trong ${esc(result.written_records)} lượt; bỏ qua ${esc(result.skipped_fields)} trường.</p>
    <div class="row wrap"><span class="tag">${esc(result.written_records)} lượt khám</span><span class="tag neutral">${esc(result.unselected_records ?? 0)} dòng không được chọn</span></div>
    <p class="hint">Nguồn: ${esc(result.source_name || missing)} · Phiên bản ánh xạ: ${esc(result.mapping_version ?? missing)}</p>
    <div class="result-details"><div class="table-scroll"><table><thead><tr><th>Hồ sơ / lượt đích</th><th>Số trường ghi</th><th>Phiên bản</th><th>Bỏ qua và lý do</th><th></th></tr></thead><tbody>
      ${(result.records || []).map(r => `<tr><td><strong>${esc(r.target_patient_code || r.patient_code)}</strong>${r.target_patient_name ? `<div><small>${esc(r.target_patient_name)}</small></div>` : ''}
        <div><small>${esc(r.visit_external_id || 'Lượt đã đối chiếu')}</small></div><div><small>Thời điểm khám: ${esc(displayDate(r.target_occurred_at))}</small></div>${r.target_patient_code ? `<div><small>Mã trong file: ${esc(r.patient_code)}</small></div>` : ''}</td>
        <td>${esc(r.written_fields)}</td><td>${esc(r.revision)}</td><td>${(r.skipped || []).map(s => esc(s.field) + ': ' + esc(statusLabels[s.reason] || s.reason)).join('<br>') || 'Không có'}</td>
        <td>${r.visit_id ? button('Mở biểu mẫu', 'data-visit-id="' + esc(r.visit_id) + '"') : ''}</td></tr>`).join('')}
    </tbody></table></div><details class="section-rule"><summary>Chi tiết dòng không được ghi</summary>${unselectedContent(result.unselected)}</details></div>
    ${historyView ? '' : `<div class="row wrap">${button('Nhập file khác', 'data-import="new"', false, 'upload')}${button('Lịch sử nhập', 'data-import="history"', false, 'history')}</div>`}</section>`;
}

export function renderImport() {
  if (isAdmin()) { redirectToPatients(); return; }
  const im = importState();
  if (im.stage === 1 && !im.preview || im.stage === 2 && !im.result) setStage(0);
  const content = im.stage === 1 ? previewContent(im) : im.stage === 2 ? resultContent(im.result) : fileContent(im);
  shell(heading('Nhập file HIS', 'Tự nhận diện trường, kiểm tra đối chiếu rồi xác nhận.', button('Lịch sử nhập', 'data-import="history"', false, 'history')) +
    messageBox() + steps(im.stage) + content, {active:'import', breadcrumb:'Nhập file HIS', page:routes[im.stage]});
  const main = document.getElementById('main');
  if (!main) return;
  main.addEventListener('click', onImportClick);
  main.addEventListener('change', onImportChange);
  if (im.stage === 0) {
    const drop = main.querySelector('#dropzone');
    drop?.addEventListener('dragover', e => { e.preventDefault(); if (!state.busy) drop.classList.add('dragover'); });
    drop?.addEventListener('dragleave', () => drop.classList.remove('dragover'));
    drop?.addEventListener('drop', e => {
      e.preventDefault(); drop.classList.remove('dragover');
      if (state.busy) return;
      if (e.dataTransfer.files.length !== 1) { notice('Chọn một file .xlsx cho mỗi lần nhập.'); return; }
      void readImportFile(e.dataTransfer.files[0]);
    });
  }
  if (im.stage === 1) updateCommitUI();
  lockBusyUI();
}

function onImportChange(e) {
  const el = e.target, im = importState();
  if (el.id === 'his-file') {
    e.stopPropagation(); if (!state.busy) void readImportFile(el.files[0]); return;
  }
  if (Object.hasOwn(el.dataset, 'importRecord')) {
    e.stopPropagation(); if (state.busy) return;
    const record = im.preview?.records.find(r => String(r.index) === el.dataset.importRecord);
    if (!record || record.status !== 'eligible') return;
    selectedDecision(im, record).selected = el.checked;
    im.commitBody = null; updateCommitUI();
  }
  if (Object.hasOwn(el.dataset, 'override')) {
    e.stopPropagation(); if (state.busy) return;
    const record = im.preview?.records.find(r => String(r.index) === el.dataset.override);
    if (!record || !(record.fields || []).some(f => f.code === el.dataset.code && f.status === 'conflict')) return;
    selectedDecision(im, record).conflicts[el.dataset.code] = ['keep','override'].includes(el.value) ? el.value : '';
    im.commitBody = null; updateCommitUI();
  }
}

async function onImportClick(e) {
  const el = e.target.closest('[data-import],[data-import-action],[data-visit-id]');
  if (!el) return;
  e.preventDefault(); e.stopPropagation();
  if (el.disabled || state.busy) return;
  const dialog = el.closest('dialog');
  try {
    await runAction(async () => {
      if (el.dataset.visitId) {
        await openVisit(el.dataset.visitId);
        dialog?.close();
      } else await importAction(el.dataset.import || el.dataset.importAction);
    });
  } catch (error) {
    if (!requireSignIn(error)) {
      const dlgErr = dialog?.querySelector('.dialog-error');
      if (dlgErr) { dlgErr.className = 'dialog-error status error'; dlgErr.textContent = error.message; dlgErr.hidden = false; dlgErr.focus(); }
      else notice(error.message);
    }
  } finally {
    if (state.route === 'import') updateFileUI(importState());
    updateCommitUIIfVisible();
  }
}

function commitRecords(im) {
  if (!im.preview?.preview_token) throw new Error('Chưa có bản đối chiếu hợp lệ.');
  const records = [];
  for (const record of im.preview.records) {
    const decision = selectedDecision(im, record);
    if (!decision.selected || record.status !== 'eligible') continue;
    const conflicts = (record.fields || []).filter(f => f.status === 'conflict');
    if (conflicts.some(f => !['keep','override'].includes(decision.conflicts[f.code]))) {
      throw new Error('Chọn giữ hiện có hoặc nhận từ file cho mọi trường xung đột của các dòng đã chọn.');
    }
    records.push({index:record.index, override_fields:conflicts.filter(f => decision.conflicts[f.code] === 'override').map(f => f.code),
      keep_fields:conflicts.filter(f => decision.conflicts[f.code] === 'keep').map(f => f.code)});
  }
  if (!records.length) throw new Error('Chọn ít nhất một dòng hợp lệ để nhập.');
  return records;
}

function updateCommitUI() {
  const im = importState(), control = document.getElementById('confirm-import'), status = document.getElementById('import-decision-status');
  try {
    const records = commitRecords(im);
    if (control && !state.busy) control.disabled = false;
    if (status) status.textContent = records.length + ' dòng đã chọn, đã xử lý đủ xung đột.';
  } catch (error) {
    if (control && !state.busy) control.disabled = true;
    if (status) status.textContent = error.message;
  }
}

function commitReady(im) {
  try { commitRecords(im); return true; } catch { return false; }
}

function updateFileUI(im) {
  if (state.import !== im || im.stage !== 0 || !routes.includes(state.route)) return;
  const preview = document.getElementById('preview-button'), status = document.getElementById('file-read-status'), name = document.getElementById('file-name');
  if (preview) preview.disabled = Boolean(state.busy || im.reading || !im.content_base64);
  if (status) status.textContent = im.reading ? 'Đang đọc file…' : im.filename ? 'File đã sẵn sàng: ' + im.filename : '';
  if (name) name.textContent = im.filename || 'Chọn file HIS cần nhập';
}

export async function readImportFile(file) {
  if (isAdmin()) { redirectToPatients(); return; }
  const im = importState(), generation = (im.fileGeneration || 0) + 1;
  Object.assign(im, freshImport(generation));
  updateFileUI(im);
  if (!file) return;
  if (!/\.xlsx$/i.test(file.name) || file.size > 4194304) { notice('Chỉ nhận file .xlsx có dung lượng không quá 4 MiB.'); return; }
  im.reading = true; updateFileUI(im);
  try {
    const buffer = new Uint8Array(await file.arrayBuffer());
    if (state.import !== im || im.fileGeneration !== generation) return;
    if (buffer.byteLength > 4194304) throw new Error('File vượt giới hạn 4 MiB.');
    let binary = '';
    for (let start = 0; start < buffer.length; start += 32768) binary += String.fromCharCode(...buffer.subarray(start, start + 32768));
    im.filename = file.name; im.content_base64 = btoa(binary);
    if (state.route === 'import') notice('Đã đọc file. Chọn “Đọc file và đối chiếu” để tiếp tục.', 'success');
  } catch (error) {
    if (state.import === im && im.fileGeneration === generation) notice('Không đọc được file. Vui lòng chọn lại.');
  } finally {
    if (state.import === im && im.fileGeneration === generation) { im.reading = false; updateFileUI(im); }
  }
}

async function downloadTemplate() {
  const response = await request('/api/forms/imports/template.xlsx');
  const url = URL.createObjectURL(await response.blob()), link = document.createElement('a');
  link.href = url; link.download = 'his-two-cases.xlsx';
  document.body.append(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function importAction(action) {
  if (isAdmin()) { await navigate('patients'); return; }
  if (actionFlight) return actionFlight;
  actionFlight = performImportAction(action);
  try { return await actionFlight; } finally { actionFlight = null; updateCommitUIIfVisible(); }
}

function updateCommitUIIfVisible() { if (state.route === 'import-preview') updateCommitUI(); }

async function performImportAction(action) {
  const im = importState();
  switch (action) {
    case 'template': return downloadTemplate();
    case 'history': return openImportHistoryModal();
    case 'resume': return renderImport();
    case 'new': case 'cancel':
      state.import = freshImport((im.fileGeneration || 0) + 1); showImport(0); return;
    case 'source': showImport(0); return;
    case 'auto-preview': {
      if (im.reading) throw new Error('File đang được đọc, vui lòng chờ.');
      if (!im.content_base64 || !im.filename) throw new Error('Chọn file .xlsx hợp lệ trước.');
      const generation = im.fileGeneration;
      const preview = await api('/api/forms/imports/excel/auto-preview', {method:'POST', body:{filename:im.filename, content_base64:im.content_base64}});
      if (state.import !== im || generation !== im.fileGeneration) return;
      im.preview = preview; im.decisions = {}; im.commitBody = null; im.result = null;
      for (const record of preview.records) selectedDecision(im, record);
      showImport(1); return;
    }
    case 'commit': {
      const records = commitRecords(im);
      im.commitBody ||= {preview_token:im.preview.preview_token, records};
      const result = await api('/api/forms/imports/commit', {method:'POST', body:im.commitBody});
      if (state.import !== im) return;
      im.result = result;
      if (typeof window !== 'undefined' && typeof CustomEvent !== 'undefined') {
        window.dispatchEvent(new CustomEvent('forms:import-committed', {detail:{batchId:result.batch_id, records:result.records || []}}));
      }
      showImport(2); return;
    }
    default: throw new Error('Thao tác nhập file không hợp lệ.');
  }
}

export async function openImportHistoryModal() {
  if (isAdmin()) { await navigate('patients'); return; }
  const rows = await api('/api/forms/imports/history');
  const content = rows.length ? rows.map(r => `<details><summary>${esc(displayDate(r.created_at))} · ${esc(r.result?.source_name || missing)} · ${esc(r.result?.written_fields ?? 0)} trường đã ghi</summary>
    ${r.result ? resultContent(r.result, true) : '<p>Chưa có chi tiết kết quả.</p>'}
    <details><summary>Thông tin nguồn đã nhập</summary><p>Nguồn: ${esc(r.source_kind)} · Phiên bản: ${esc(r.mapping_version ?? r.result?.mapping_version ?? missing)}</p>
      <p>Sheet ${esc(r.mapping?.sheet || missing)}${r.mapping?.profile ? ' · Hồ sơ nguồn: ' + esc(r.mapping.profile) : r.mapping?.header_row != null ? ' · Dòng tiêu đề ' + esc(r.mapping.header_row) : ''}</p></details></details>`).join('') : '<div class="empty">Chưa có lần nhập đã xác nhận.</div>';
  const dialog = modal('Lịch sử nhập file của tài khoản', content, async () => {}, {readOnly:true, maxWidth:'1100px'});
  dialog?.addEventListener('click', onImportClick);
  return dialog;
}
