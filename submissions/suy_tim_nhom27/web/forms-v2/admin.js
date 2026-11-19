// Dev B: catalog changes apply to new visits; historical visits retain their snapshot.
import { types, groupsDefault, esc, api, requireSignIn } from './api.js';
import { state, isAdmin, loadFields, navigate, runAction } from './router.js';
import { icon, button, heading, notice, messageBox, shell, modal } from './shell.js';
import { fieldWidget } from './encounter.js';

const reservedCodes = new Set(['id', 'patient_id', 'visit_id', 'role', 'owner_id', 'revision', 'external_id',
  'his_huyet_ap_cao', 'his_huyet_ap_thap', 'his_nhiet_do']);

function fieldRows(fields) {
  if (!fields.length) return '<tr><td colspan="7" class="empty">Không tìm thấy trường phù hợp.</td></tr>';
  const roles = {measured_input:'Số đo / thu thập', recorded_input:'Nhập liệu', derived:'Giá trị tính', calculated:'Giá trị tính', ai_output:'Đầu ra AI chưa triển khai', module_linked:'Liên kết module'};
  return fields.map(f => `<tr><td><strong>${esc(f.label)}</strong><small>${esc(f.code)}</small></td><td>${esc(f.group)}</td>
    <td>${esc(types[f.type] || f.type)}${f.unit ? ' · ' + esc(f.unit) : ''}</td><td>${esc(f.version)}</td>
    <td><span class="tag neutral">${esc(roles[f.data_role || f.value_role] || (f.code === 'bmi' ? 'Giá trị tính' : 'Nhập liệu'))}</span></td>
    <td><span class="tag outline">${!f.active ? 'Ngừng dùng' : f.type === 'unavailable' ? 'Chưa đặc tả' : 'Đang dùng'}</span></td>
    <td>${f.code === 'bmi' ? '<span class="small muted">Chỉ xem</span>' : `<button class="button" type="button" data-edit-field="${esc(f.code)}" ${f.type === 'unavailable' ? 'disabled' : ''}>Sửa định nghĩa</button>`}</td></tr>`).join('');
}

function redirectToPatients() {
  navigate('patients').catch(err => { if (!requireSignIn(err)) notice(err.message); });
}

export function renderAdminFields() {
  if (!isAdmin()) { redirectToPatients(); return; }
  shell(heading('Biểu mẫu', 'Quản lý định nghĩa trường cho các lượt khám mới.', button('Thêm trường', 'data-admin-action="new-field"', true, 'plus')) + messageBox() +
    `<div class="notice">${icon('info')}<div>Định nghĩa sửa ở đây áp dụng cho lượt mới. Lượt đã tạo giữ bản mẫu và nhãn đã ghim.</div></div>
    <section class="card"><div class="card-top"><h2>Danh mục trường</h2><span class="tag outline">Admin · v${esc(state.catalog)}</span></div>
      <div class="toolbar"><label class="search">${icon('search')}<input type="search" id="field-search" aria-label="Tìm nhanh theo tên, mã hoặc nhóm" placeholder="Tìm theo tên trường, mã hoặc nhóm…" autocomplete="off"></label><span class="muted small" id="field-count">${esc(state.fields.length)} trường</span></div>
      <div class="table-scroll"><table><thead><tr><th>Tên trường / mã</th><th>Nhóm</th><th>Kiểu / đơn vị</th><th>Phiên bản</th><th>Nguồn giá trị</th><th>Trạng thái</th><th></th></tr></thead>
      <tbody id="field-rows">${fieldRows(state.fields)}</tbody></table></div></section>`, {active:'fields', breadcrumb:'Biểu mẫu', page:'fields'});
  const main = document.getElementById('main');
  if (!main) return;
  main.querySelector('#field-search')?.addEventListener('input', e => {
    e.stopPropagation();
    const query = e.target.value.trim().toLocaleLowerCase('vi-VN');
    const filtered = state.fields.filter(f =>
      [f.code, f.label, f.group].join(' ').toLocaleLowerCase('vi-VN').includes(query));
    const tbody = main.querySelector('#field-rows'), count = main.querySelector('#field-count');
    if (tbody) tbody.innerHTML = fieldRows(filtered);
    if (count) count.textContent = query ? `${filtered.length} / ${state.fields.length} trường` : `${state.fields.length} trường`;
  });
  main.addEventListener('click', async e => {
    const el = e.target.closest('[data-edit-field],[data-admin-action],[data-field-action]');
    if (!el) return;
    e.preventDefault(); e.stopPropagation();
    if (el.disabled || state.busy) return;
    try { await runAction(async () => openFieldModal(el.dataset.editField || null)); }
    catch (error) { if (!requireSignIn(error)) notice(error.message); }
  });
}

function definitionFrom(data) {
  const code = String(data.get('code') || '').trim();
  const label = String(data.get('label') || '').trim();
  const group = String(data.get('group') || '').trim();
  const type = String(data.get('type') || '');
  const order = Number(data.get('order'));
  if (!label) throw new Error('Tên trường không được để trống.');
  if (!group) throw new Error('Nhóm trường không được để trống.');
  if (!/^[a-z][a-z0-9_]{1,79}$/.test(code)) throw new Error('Mã trường gồm chữ thường, số hoặc gạch dưới (2–80 ký tự, bắt đầu bằng chữ thường).');
  if (reservedCodes.has(code) || code.startsWith('pending_')) throw new Error('Mã trường thuộc danh sách dành cho hệ thống.');
  if (!Number.isInteger(order) || order < 0 || order > 10000) throw new Error('Thứ tự phải là số nguyên từ 0 đến 10000.');
  const choices = ['select','multiselect'].includes(type) ? String(data.get('choices') || '').split(/\r?\n/).filter(s => s.trim()).map(line => {
    const [choiceCode, ...choiceLabel] = line.split('|');
    const c = choiceCode.trim(), l = choiceLabel.join('|').trim();
    if (!c || !l) throw new Error('Mỗi lựa chọn cần đủ mã|nhãn.');
    if (!/^[a-zA-Z0-9_-]{1,60}$/.test(c)) throw new Error('Mã lựa chọn chỉ gồm chữ không dấu, số, gạch dưới hoặc gạch nối (tối đa 60 ký tự).');
    return {code:c, label:l};
  }) : [];
  if (['select','multiselect'].includes(type) && !choices.length) throw new Error('Nhập ít nhất một lựa chọn mã|nhãn.');
  if (new Set(choices.map(c => c.code)).size !== choices.length) throw new Error('Mã lựa chọn không được trùng nhau.');
  const unit = String(data.get('unit') || '').trim() || null;
  return {code, label, group, type, unit, help:String(data.get('help') || ''), order, active:true, choices};
}

export function openFieldModal(code = null) {
  if (!isAdmin()) { redirectToPatients(); return; }
  const old = code === null ? null : state.fields.find(f => f.code === code);
  if (code !== null && !old) { notice('Không tìm thấy định nghĩa trường.'); return; }
  if (old?.code === 'bmi' || old?.type === 'unavailable') { notice('Trường này chỉ cho xem định nghĩa.', 'warn'); return; }
  const groups = [...new Set([...groupsDefault, ...state.fields.map(f => f.group)])];
  const content = `<div class="field-grid">
    <div class="field"><label for="def-label">Tên trường</label><input id="def-label" name="label" value="${esc(old?.label)}" maxlength="200" required></div>
    <div class="field"><label for="def-code">Mã trường ổn định</label><input id="def-code" name="code" value="${esc(old?.code)}" ${old ? 'readonly' : ''} pattern="[a-z][a-z0-9_]{1,79}" required></div>
    <div class="field"><label for="def-group">Nhóm</label><select id="def-group" name="group">${groups.map(group => `<option value="${esc(group)}" ${group === (old?.group || 'Trường bổ sung') ? 'selected' : ''}>${esc(group)}</option>`).join('')}</select></div>
    <div class="field"><label for="def-type">Kiểu dữ liệu</label><select id="def-type" name="type" ${old ? 'disabled' : ''}>
      ${Object.entries(types).filter(([type]) => !['medications','results','unavailable'].includes(type) || old?.type === type).map(([type, label]) => `<option value="${esc(type)}" ${old?.type === type ? 'selected' : ''}>${esc(label)}</option>`).join('')}</select></div>
    <div class="field"><label for="def-unit">Đơn vị đã xác định</label><input id="def-unit" name="unit" list="def-units" value="${esc(old?.unit)}" ${old ? 'readonly' : ''} maxlength="60">
      <datalist id="def-units">${[...new Set(state.fields.map(f => f.unit).filter(Boolean))].map(unit => `<option value="${esc(unit)}"></option>`).join('')}</datalist><small>Để trống khi không có đơn vị; không tự quy đổi dữ liệu cũ.</small></div>
    <div class="field"><label for="def-order">Thứ tự</label><input id="def-order" name="order" type="number" min="0" max="10000" step="1" value="${esc(old?.order ?? 1000)}" required></div>
    <div class="field full"><label for="def-help">Hướng dẫn ngắn</label><textarea id="def-help" name="help" maxlength="1000">${esc(old?.help)}</textarea></div>
    ${!old ? '<div class="field full" id="def-choices-wrap" hidden><label for="def-choices">Lựa chọn: mỗi dòng mã|nhãn</label><textarea id="def-choices" name="choices" placeholder="ma_1|Nhãn lựa chọn"></textarea></div>' : ''}
    ${old ? `<label class="check full"><input name="active" type="checkbox" ${old.active ? 'checked' : ''}> Đang sử dụng</label>` : ''}
  </div><p class="hint">Trường bổ sung không tự tham gia phân tích tự động và chỉ áp dụng cho lượt khám mới.</p><div class="row wrap"><button type="button" class="button" id="preview-field">Xem trước widget</button></div><div id="field-preview" class="card" hidden></div>`;
  const dialog = modal(old ? 'Sửa định nghĩa' : 'Thêm trường dữ liệu', content, async (data, d) => {
    if (!isAdmin()) throw new Error('Chỉ Admin được chỉnh biểu mẫu.');
    const order = Number(data.get('order'));
    if (!Number.isInteger(order) || order < 0 || order > 10000) throw new Error('Thứ tự phải là số nguyên từ 0 đến 10000.');
    let body;
    if (old) {
      const label = String(data.get('label') || '').trim();
      const group = String(data.get('group') || '').trim();
      if (!label || !group) throw new Error('Tên trường và nhóm không được để trống.');
      body = {expected_version:old.version, label, group, help:String(data.get('help') || ''), order, active:data.has('active')};
    } else {
      body = definitionFrom(data);
    }
    await api('/api/forms/fields' + (old ? '/' + encodeURIComponent(old.code) : ''), {method:old ? 'PATCH' : 'POST', body});
    // Close after a successful write so a failed catalog refresh cannot resubmit it.
    d.close();
    try {
      await loadFields();
      if (typeof window !== 'undefined' && typeof CustomEvent !== 'undefined') {
        window.dispatchEvent(new CustomEvent('forms:catalog-updated', {detail:{revision:state.catalog}}));
      }
      renderAdminFields();
      notice('Đã lưu phiên bản biểu mẫu mới.', 'success');
    } catch (error) { if (!requireSignIn(error)) notice('Đã lưu nhưng chưa tải lại danh mục. ' + error.message, 'warn'); }
  }, {submitLabel:'Lưu phiên bản mới', maxWidth:'780px'});
  if (!dialog) return;
  const typeSelect = dialog.querySelector('#def-type'), choicesWrap = dialog.querySelector('#def-choices-wrap');
  if (typeSelect && choicesWrap) {
    const syncChoices = () => { choicesWrap.hidden = !['select', 'multiselect'].includes(typeSelect.value); };
    syncChoices();
    typeSelect.addEventListener('change', syncChoices);
  }
  dialog.querySelector('#preview-field')?.addEventListener('click', e => {
    e.preventDefault(); e.stopPropagation();
    const errorBox = dialog.querySelector('.dialog-error');
    if (errorBox) { errorBox.textContent = ''; errorBox.hidden = true; }
    try {
      const data = new FormData(dialog.querySelector('form'));
      const definition = old ? {...old, label:String(data.get('label') || '').trim() || old.label, group:data.get('group'), help:data.get('help'), active:data.has('active')} : definitionFrom(data);
      const preview = dialog.querySelector('#field-preview');
      preview.hidden = false;
      preview.innerHTML = '<h3>' + esc(definition.group) + '</h3>' + fieldWidget(definition, null, true);
    } catch (error) {
      if (errorBox) { errorBox.className = 'dialog-error status error'; errorBox.textContent = error.message; errorBox.hidden = false; errorBox.focus(); }
    }
  });
  return dialog;
}
