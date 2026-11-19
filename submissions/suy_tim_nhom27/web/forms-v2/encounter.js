// Dev B: encounter rendering uses the definition and demographics pinned to this visit.
import { missing, esc, fmt, displayDate, localDateTime, toISO, ageOn, sourceName, api, requireSignIn } from './api.js';
import { state, isAdmin, hasDraft, resetDraft, confirmLeave, runAction, lockBusyUI, navigate } from './router.js';
import { icon, button, heading, notice, messageBox, shell, modal } from './shell.js';

const visitFields = () => state.visit?.fields || [];
const currentValue = code => Object.hasOwn(state.dirty, code) ? state.dirty[code] : state.visit?.values_json?.[code];
const metadata = () => ({...state.visit?.metadata, ...state.metadataDirty});
const visitDate = () => Object.hasOwn(state.visitDirty, 'occurred_at') ? state.visitDirty.occurred_at : state.visit?.occurred_at;
const visitCode = v => v.external_id || ('Lượt ' + String(v.id).slice(0, 8));
const isSnapshotField = code => (code === 'tuoi' && Boolean(state.visit?.demographics_snapshot?.date_of_birth)) ||
  (code === 'gioi_tinh' && Boolean(state.visit?.demographics_snapshot?.sex));
let openingGeneration = 0;
let saving = null;

function formatDob(dob) {
  if (!dob) return missing;
  const parts = String(dob).split('-');
  return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : String(dob);
}

export async function openVisit(visitId) {
  const generation = ++openingGeneration;
  const visit = await api('/api/forms/visits/' + encodeURIComponent(visitId));
  if (!Array.isArray(visit.fields)) throw new Error('Chưa đọc được cấu trúc đã ghim của lượt khám. Bản nháp được giữ.');
  let patient = state.patients.find(p => p.id === visit.patient_id) ||
    (state.patient?.id === visit.patient_id ? state.patient : null);
  if (!patient) patient = (await api('/api/forms/patients/' + encodeURIComponent(visit.patient_id) + '/overview')).patient;
  if (!patient || patient.id !== visit.patient_id) throw new Error('Chưa đối chiếu được hồ sơ của lượt. Bản nháp được giữ.');
  if (generation !== openingGeneration) return;
  state.visit = visit;
  state.patient = patient;
  resetDraft();
  state.group = null;
  state.viewMessage = 'Đã tải dữ liệu';
  state.route = 'encounter';
  state.page = 'encounter';
  if (typeof history !== 'undefined') {
    history.replaceState({formsV2:true, route:'encounter', patientId:patient.id, visitId:visit.id}, '', '#encounter');
  }
  renderEncounter();
}

function bmiPanel(field) {
  return `<div class="bmi-result"><span id="bmi-label">${esc(field?.label || 'BMI')} · tự tính</span>
    <strong id="bmi-value" role="status" aria-live="polite" aria-labelledby="bmi-label">${esc(bmiText())}</strong>
    <small>kg/m² · theo số đo cùng lượt</small></div>`;
}

function sectionContent(fields) {
  const bmi = fields.find(f => f.code === 'bmi' && f.active);
  const measurements = bmi ? fields.filter(f => ['chieu_cao', 'can_nang'].includes(f.code) && supportedField(f)) : [];
  const measured = new Set(measurements.map(f => f.code));
  if (bmi) measured.add('bmi');
  const rest = fields.filter(f => !measured.has(f.code));
  const bmiBlock = bmi ? `<div class="measure-edit">${measurements.map(f => fieldWidget(f, currentValue(f.code))).join('')}${bmiPanel(bmi)}</div>
    <p class="hint">BMI = cân nặng (kg) / [chiều cao (cm) / 100]². Cần hai số đo hợp lệ lớn hơn 0 trong cùng lượt khám.</p>` : '';
  const restHtml = groupContent(rest);
  return bmiBlock + (bmiBlock && restHtml ? `<div class="section-rule">${restHtml}</div>` : restHtml);
}

function encounterContext() {
  const v = state.visit, p = v.demographics_snapshot || {}, m = metadata();
  const age = visitDate() ? ageOn(p.date_of_birth, visitDate()) : null;
  const sexLabel = {male:'Nam', female:'Nữ', other:'Khác'}[p.sex] || missing;
  return `<section class="encounter-context" aria-label="Thông tin lượt đang mở"><div class="visit-context"><div><strong>${esc(state.patient?.code || missing)} · ${esc(p.display_name || state.patient?.display_name || missing)}</strong>
    <p>${esc(visitCode(v))} · <span id="context-visit-type">${esc({new:'Khám mới', followup:'Tái khám'}[m.visit_type] || missing)}</span></p>
    <p><span id="context-occurred">Thời điểm khám: ${esc(displayDate(visitDate()))}</span><span id="context-age">${age === null ? '' : ' · ' + esc(age) + ' tuổi tại lần khám'}</span></p></div>
    <span class="tag outline">${isAdmin() ? 'Chỉ xem lâm sàng' : 'Bản mẫu đã ghim theo lượt'} · v${esc(v.catalog_revision)}</span></div>
    <details class="context-details"><summary>Thông tin hành chính và chi tiết lượt khám đã ghim</summary>
      <dl class="detail-grid"><div><dt>Ngày sinh</dt><dd>${esc(formatDob(p.date_of_birth))}</dd></div>
        <div><dt>Tuổi tại ngày khám</dt><dd id="context-snapshot-age">${age === null ? missing : esc(age + ' tuổi')}</dd></div>
        <div><dt>Giới tính</dt><dd>${esc(sexLabel)}</dd></div>
        <div><dt>Mã BHYT</dt><dd>${esc(p.insurance_number || missing)}</dd></div>
        <div><dt>Mã bệnh chính ICD-10</dt><dd>${esc(m.primary_diagnosis_code || missing)}</dd></div>
        <div><dt>Khoa / phòng</dt><dd>${esc(m.department || missing)}</dd></div>
      </dl></details></section>`;
}

export function renderEncounter() {
  if (!state.visit) { navigate('patients').catch(err => { if (!requireSignIn(err)) notice(err.message); }); return; }
  const groups = [...new Set(visitFields().map(f => f.group))];
  if (!groups.includes('Thông tin nền')) groups.unshift('Thông tin nền');
  state.group = groups.includes(state.group) ? state.group : groups[0];
  const actions = button('Về hồ sơ', 'data-visit-action="profile"', false, 'back') +
    button('Lịch sử chỉnh sửa', 'data-visit-action="history"', false, 'history') +
    button('Tải lại', 'data-visit-action="reload"');
  shell(heading('Lượt khám', 'Ghi nhận theo từng nhóm, theo dõi trạng thái lưu.', actions) + messageBox() + encounterContext() +
    (isAdmin() ? `<div class="notice">${icon('info')}<div>Admin chỉ xem dữ liệu lâm sàng và lịch sử. Các ô nhập được khóa.</div></div>` : '') + hisVisitSources() +
    `<div id="encounter" class="form-layout"><nav class="group-nav" aria-label="Nhóm biểu mẫu">
      <div class="field compact-groups"><label for="group-select">Nhóm biểu mẫu</label><select id="group-select" data-group-select>${groups.map(g => `<option value="${esc(g)}" ${g === state.group ? 'selected' : ''}>${esc(g)} · ${esc(groupStatus(g))}</option>`).join('')}</select></div>
      ${groups.map(g => `<a href="#encounter" data-group="${esc(g)}" class="${g === state.group ? 'active' : ''}" ${g === state.group ? 'aria-current="true"' : ''}><span class="group-name">${esc(g)}</span><span class="group-meta" data-group-count="${esc(g)}">${esc(groupStatus(g))}</span></a>`).join('')}
    </nav><div><form id="encounter-form" class="stack" novalidate>
      <section class="card form-section"><div class="card-top"><h2 tabindex="-1">${esc(state.group)}</h2><span class="tag outline" data-group-count="${esc(state.group)}">${esc(groupStatus(state.group))}</span></div>
        ${sectionContent(visitFields().filter(f => f.group === state.group))}
      </section>${state.group === 'Thông tin nền' ? `<section class="card form-section" id="visit-details" aria-labelledby="visit-details-heading"><div class="card-top"><h2 id="visit-details-heading">Thông tin lượt khám</h2></div>${metadataFields(isAdmin())}</section>` : ''}
      <details class="technical-details"><summary>Chi tiết biểu mẫu</summary><p>Phiên bản v${esc(state.visit.catalog_revision)}. “Đã tải” chỉ cho biết dữ liệu đã được đọc, chưa xác nhận đã nhập đủ thông tin.</p></details>
    </form>${!isAdmin() ? `<div class="savebar"><div><p id="save-status" role="status">${esc(hasDraft() ? 'Có thay đổi chưa lưu' + (Object.keys(state.invalid).length ? ' · Có lỗi cần sửa' : '') : state.viewMessage || 'Chưa có thay đổi')}</p><small>Lưu thông tin đã nhập cho lượt khám này.</small></div><div class="row">
      ${button('Hoàn tác', 'data-visit-action="reset"')}${button('Lưu thay đổi', 'data-visit-action="save"', true, 'save')}</div></div>` : ''}</div></div>`,
    {active:'patients', breadcrumb:'Hồ sơ / ' + (state.patient?.code || '') + ' / Lượt khám', page:'encounter'});
  const main = document.getElementById('main');
  if (!main) return;
  main.addEventListener('click', handleEncounterClick);
  main.addEventListener('input', localInput);
  main.addEventListener('change', localChange);
  main.querySelector('#encounter-form')?.addEventListener('submit', e => e.preventDefault());
  lockBusyUI();
}

function localInput(e) {
  if (!e.target.matches('[data-field],[data-repeat],[data-metadata],[data-visit-field]')) return;
  e.stopPropagation();
  handleEncounterInput(e);
  if (e.target.dataset.metadata === 'visit_type') {
    const label = document.getElementById('context-visit-type');
    if (label) label.textContent = {new:'Khám mới', followup:'Tái khám'}[metadata().visit_type] || missing;
  }
}

function localChange(e) {
  const el = e.target;
  if (Object.hasOwn(el.dataset, 'groupSelect')) {
    e.stopPropagation(); state.group = el.value; renderEncounter();
    document.querySelector('.form-section h2')?.focus();
    return;
  }
  if (el.dataset.multiKnown) {
    e.stopPropagation();
    if (isAdmin()) return;
    const field = visitFields().find(f => f.code === el.dataset.multiKnown);
    if (!field || field.type !== 'multiselect' || !supportedField(field)) return;
    setInvalid(field.code, '');
    dirty(field.code, el.checked ? [] : null);
    renderEncounter(); return;
  }
  localInput(e);
}

export async function handleEncounterClick(e) {
  const el = e.target.closest('[data-visit-action],[data-visit-id],[data-group],[data-add-item],[data-remove-item],[data-empty-list],[data-null-list]');
  if (!el) return;
  e.preventDefault(); e.stopPropagation();
  if (el.disabled || state.busy) return;
  try {
    await runAction(async () => {
      if (el.dataset.group) {
        state.group = el.dataset.group; renderEncounter();
        document.querySelector('.form-section h2')?.focus();
        return;
      }
      if (el.dataset.visitId) {
        if (confirmLeave()) return openVisit(el.dataset.visitId);
        return;
      }
      for (const action of ['addItem', 'removeItem', 'emptyList', 'nullList']) {
        if (!Object.hasOwn(el.dataset, action)) continue;
        if (isAdmin()) return;
        const code = el.dataset[action], field = visitFields().find(f => f.code === code);
        if (!field || !supportedField(field) || !['medications','results'].includes(field.type)) return;
        const rows = structuredClone(currentValue(code)) || [];
        if (action === 'addItem') rows.push({name:null});
        if (action === 'removeItem') {
          const removed = Number(el.dataset.index);
          if (!Number.isInteger(removed) || removed < 0 || removed >= rows.length) return;
          rows.splice(removed, 1);
          const next = {};
          for (const [key, value] of Object.entries(state.invalid)) {
            const parts = key.split(':');
            if (parts[0] === code && parts.length > 1) {
              if (Number(parts[1]) === removed) continue;
              if (Number(parts[1]) > removed) parts[1] = String(Number(parts[1]) - 1);
            }
            next[parts.join(':')] = value;
          }
          state.invalid = next;
        }
        if (action === 'emptyList' || action === 'nullList') {
          rows.length = 0;
          for (const key of Object.keys(state.invalid)) if (key === code || key.startsWith(code + ':')) delete state.invalid[key];
        }
        dirty(code, action === 'nullList' ? null : rows);
        renderEncounter(); return;
      }
      switch (el.dataset.visitAction) {
        case 'save': return saveEncounter();
        case 'history': return openVisitHistoryModal();
        case 'reload':
          if (confirmLeave('Tải dữ liệu mới nhất và bỏ thay đổi chưa lưu?')) return openVisit(state.visit.id);
          return;
        case 'reset':
          if (!isAdmin() && confirmLeave('Hoàn tác và bỏ thay đổi chưa lưu của lượt này?')) { resetDraft(); renderEncounter(); }
          return;
        case 'profile': return navigate('profile', {patientId:state.patient?.id});
      }
    });
  } catch (error) { if (!requireSignIn(error)) notice(error.message); }
}

export async function saveEncounter() {
  if (isAdmin()) throw new Error('Admin chỉ đọc dữ liệu khám.');
  if (saving) return saving;
  if (!state.visit) throw new Error('Chưa mở lượt khám.');
  if (Object.keys(state.invalid).length) { notice('Sửa giá trị không hợp lệ trước khi lưu.'); return; }
  if (!hasDraft() && !state.pending) { notice('Chưa có thay đổi cần lưu.', 'success'); return; }
  const values = Object.fromEntries(Object.entries(state.dirty).filter(([code]) => code !== 'bmi' && !isSnapshotField(code)));
  if (!state.pending && !Object.keys(values).length && !Object.keys(state.metadataDirty).length && !Object.keys(state.visitDirty).length) {
    notice('Chưa có thay đổi cần lưu.', 'success'); return;
  }
  state.pending ||= {expected_revision:state.visit.revision, catalog_revision:state.visit.catalog_revision,
    mutation_id:crypto.randomUUID(), values:structuredClone(values),
    ...(Object.keys(state.metadataDirty).length ? {metadata:structuredClone(state.metadataDirty)} : {}), ...state.visitDirty};
  const sent = state.pending, visitId = state.visit.id, patientId = state.visit.patient_id;
  saving = (async () => {
    const status = document.getElementById('save-status');
    if (status) status.textContent = 'Đang lưu…';
    try {
      const result = await api('/api/forms/visits/' + encodeURIComponent(visitId), {method:'PATCH', body:sent});
      if (state.visit?.id !== visitId || state.pending !== sent) return;
      state.visit.values_json = {...state.visit.values_json, ...sent.values};
      state.visit.metadata = {...state.visit.metadata, ...sent.metadata};
      if (Object.hasOwn(sent, 'occurred_at')) state.visit.occurred_at = sent.occurred_at;
      state.visit.revision = result.revision;
      resetDraft(); state.viewMessage = 'Đã lưu';
      if (typeof window !== 'undefined' && typeof CustomEvent !== 'undefined') {
        window.dispatchEvent(new CustomEvent('forms:visit-saved', {detail:{visitId, patientId}}));
      }
      try {
        const refreshed = await api('/api/forms/visits/' + encodeURIComponent(visitId));
        if (state.visit?.id !== visitId) return;
        if (!Array.isArray(refreshed.fields)) throw new Error('Chưa đọc được cấu trúc lượt khám.');
        state.visit = refreshed;
        renderEncounter(); notice('Đã lưu dữ liệu.', 'success');
      } catch (error) {
        renderEncounter();
        if (!requireSignIn(error)) notice('Đã lưu nhưng chưa tải lại được. ' + error.message, 'warn');
      }
    } catch (error) {
      if (status) status.textContent = 'Lưu không thành công. Bản nháp được giữ.';
      if (requireSignIn(error)) return;
      notice(error.message + (error.status === 409 ? ' Bản nháp vẫn được giữ để đối chiếu.' : ''));
      if (error.detail?.fields) for (const [code, message] of Object.entries(error.detail.fields)) setInvalid(code, String(message));
    }
  })();
  try { return await saving; } finally { saving = null; }
}

export async function openVisitHistoryModal() {
  if (!state.visit) return;
  const visitId = state.visit.id;
  const rows = await api('/api/forms/visits/' + encodeURIComponent(visitId) + '/history');
  if (state.visit?.id !== visitId) return;
  const body = rows.length ? rows.map(h => `<details><summary>Lần lưu ${esc(h.revision)} · ${esc(h.username || missing)} · ${esc(displayDate(h.created_at))}</summary>
    <div class="table-scroll"><table><thead><tr><th>Trường lúc lưu</th><th>Giá trị</th><th>Nguồn</th></tr></thead><tbody>
      <tr><td>Thời điểm khám</td><td>${esc(displayDate(h.occurred_at))}</td><td>Thông tin lượt</td></tr>${metadataHistory(h.metadata_json || h.metadata)}
      ${Object.entries(h.values_json || {}).map(([code, value]) => `<tr><td>${esc(h.definitions_json?.[code]?.label || code)}</td>
        <td>${valueContent(h.definitions_json?.[code], value)}</td><td>${esc(sourceName(h.sources_json?.[code]?.kind))}
        <small>${esc(h.sources_json?.[code]?.source_name || h.sources_json?.[code]?.filename || '')}</small><small>${esc(h.sources_json?.[code]?.location || '')}</small></td></tr>`).join('')}
    </tbody></table></div>${(h.metadata_json?.his_source_rows || []).map(hisRawSource).join('')}</details>`).join('') : '<div class="empty">Chưa có lần lưu nào.</div>';
  return modal('Lịch sử chỉnh sửa lượt khám', body, async () => {}, {readOnly:true, maxWidth:'1000px'});
}
const repeatLabels={test_code:'Loại xét nghiệm',name:'Tên',ingredient:'Hoạt chất',dose:'Liều ghi nhận ban đầu',strength:'Hàm lượng ghi nhận',dose_value:'Liều mỗi lần',dose_unit:'Đơn vị liều',route:'Đường dùng',frequency:'Tần suất ghi nhận',start_date:'Ngày bắt đầu',end_date:'Ngày kết thúc',status:'Trạng thái thuốc',category:'Nhóm thuốc/sản phẩm',source:'Nguồn kết quả/thông tin',observed_at:'Thời điểm thực hiện/ghi nhận theo nguồn',value:'Giá trị',unit:'Đơn vị'};
const repeatOptions={status:[{code:'current',label:'Đang sử dụng'},{code:'planned',label:'Dự kiến'},{code:'stopped',label:'Đã ngừng'}],category:[{code:'prescription',label:'Thuốc kê đơn'},{code:'otc',label:'Thuốc không kê đơn (OTC)'},{code:'supplement',label:'Thực phẩm bổ sung/TPCN'},{code:'traditional',label:'Y học cổ truyền'}]};
function repeatColumns(f){return f.type==='medications'?['name','ingredient','dose',...(f.contract_version>=2?['strength','dose_value','dose_unit']:[]),'route','frequency','observed_at',...(f.contract_version>=2?['start_date','end_date','status','category','source']:[])]:[...(f.contract_version>=2?['test_code']:[]),'name','value','unit','observed_at',...(f.contract_version>=2?['source']:[])];}
function repeatChoices(f,column,row){if(column==='test_code')return f.result_tests||[];if(column==='unit'&&f.contract_version>=2){const units=f.result_tests?.find(t=>t.code===row.test_code)?.units||[];return units.length?units.map(unit=>({code:unit,label:unit})):null;}return repeatOptions[column]||null;}
function repeatOptionsHTML(choices,value,strict=false){return `<option value="">${missing}</option>${value!=null&&!choices.some(c=>String(c.code)===String(value))?`<option value="${esc(value)}" ${strict?'disabled':''} selected>Giá trị đã ghi: ${esc(value)}</option>`:''}${choices.map(c=>`<option value="${esc(c.code)}" ${value!=null&&String(value)===String(c.code)?'selected':''}>${esc(c.label)}</option>`).join('')}`;}
function repeatControl(f,row,index,column,disabled=''){const id=`f-${f.code}-${index}-${column}`,key=f.code+':'+index+':'+column,error=state.invalid[key]||'',choices=repeatChoices(f,column,row),type=['value','dose_value'].includes(column)?'number':column==='observed_at'?'datetime-local':['start_date','end_date'].includes(column)?'date':'text',attrs=`id="${esc(id)}" data-repeat="${esc(f.code)}" data-index="${index}" data-column="${column}" aria-describedby="error-${esc(id)}" aria-invalid="${error?'true':'false'}"${disabled}`,value=column==='observed_at'?localDateTime(row[column]):row[column],label=column==='name'&&f.type==='results'&&f.contract_version>=2?'Tên chỉ số/kết quả gốc':repeatLabels[column];return `<div class="field"><label for="${esc(id)}">${esc(label)}</label>${choices?`<select ${attrs}>${repeatOptionsHTML(choices,row[column],column==='unit')}</select>`:`<input ${attrs} type="${type}" ${type==='number'?'step="any"':type==='datetime-local'?'step="60"':''} ${column==='dose_value'?'min="0"':''} value="${esc(value)}" maxlength="5000">`}${column==='unit'&&choices?'<small>Chọn đơn vị đã xác nhận cho xét nghiệm này.</small>':''}${column==='unit'&&!choices&&f.contract_version>=2?'<small>Ghi đúng đơn vị của kết quả nguồn; chưa có danh mục đơn vị xác nhận.</small>':''}<div id="error-${esc(id)}" class="field-error" role="status">${esc(error)}</div></div>`;}
function repeatValueLabel(f,column,value,row){if(value==null)return missing;if(column==='observed_at')return displayDate(value);if(column==='start_date'||column==='end_date')return value;return repeatChoices(f,column,row)?.find(c=>String(c.code)===String(value))?.label||fmt(value);}
const medicationTimingColumns=new Set(['start_date','end_date','observed_at','status','category','source']);
function medicationValueContent(field,row,index){
  const keys=[...new Set([...repeatColumns(field),...Object.keys(row)])].filter(key=>key!=='name'&&Object.hasOwn(row,key));
  const detail=key=>`<div><dt>${esc(repeatLabels[key]||key)}</dt><dd>${esc(repeatValueLabel(field,key,row[key],row))}</dd></div>`;
  return `<div class="repeat-card med-card"><strong>${index+1}. ${esc(row.name||missing)}</strong>
    <div class="med-columns"><dl class="facts">${keys.filter(key=>!medicationTimingColumns.has(key)).map(detail).join('')}</dl>
    <dl class="facts">${keys.filter(key=>medicationTimingColumns.has(key)).map(detail).join('')}</dl></div></div>`;
}
export function valueContent(f,value){
  if(value==null)return missing;
  if(f?.type==='boolean')return value?'Có':'Không';
  if(['select','multiselect'].includes(f?.type)){
    const label=v=>f.choices?.find(c=>String(c.code)===String(v))?.label||v;
    return esc(Array.isArray(value)?(value.length?value.map(label).join(', '):'Không có mục'):label(value));
  }
  if(f?.type==='medications')return Array.isArray(value)&&value.length?`<div class="repeat-items">${value.map((row,index)=>medicationValueContent(f,row,index)).join('')}</div>`:'Không có mục';
  if(f?.type==='results')return Array.isArray(value)&&value.length?`<div class="repeat-items">${value.map((r,i)=>`<div class="repeat-card"><strong>${i+1}. ${esc(r.name||f.result_tests?.find(t=>t.code===r.test_code)?.label||missing)}</strong><dl class="facts">${Object.entries(r).filter(([key])=>key!=='name').map(([key,v])=>`<div><dt>${esc(repeatLabels[key]||key)}</dt><dd>${esc(repeatValueLabel(f,key,v,r))}</dd></div>`).join('')}</dl></div>`).join('')}</div>`:'Không có mục';
  return esc(f?.type==='datetime'?displayDate(value):fmt(value))+(f?.unit&&value!==null?' '+esc(f.unit):'');
}
function repeatFields(field,row,index,disabled){
  const columns=repeatColumns(field),control=column=>repeatControl(field,row,index,column,disabled);
  if(field.type!=='medications')return columns.map(control).join('');
  return `<div class="med-columns"><div>${columns.filter(column=>!medicationTimingColumns.has(column)).map(control).join('')}</div>
    <div>${columns.filter(column=>medicationTimingColumns.has(column)).map(control).join('')}</div></div>`;
}
export function currentBmi(){
  if(state.invalid.chieu_cao||state.invalid.can_nang)return null;
  const height=currentValue('chieu_cao'),weight=currentValue('can_nang');
  if(typeof height!=='number'||typeof weight!=='number'||!Number.isFinite(height)||!Number.isFinite(weight)||height<=0||weight<=0)return null;
  const bmi=weight/(height/100)**2;
  return Number.isFinite(bmi)?bmi:null;
}
export function bmiText(){
  const value=currentBmi();
  return value===null?missing:value.toLocaleString('vi-VN',{minimumFractionDigits:2,maximumFractionDigits:2});
}
function refreshBmi(){
  const output=document.getElementById('bmi-value');
  if(output)output.textContent=bmiText();
}
function bmiWidget(field){
  return `<div class="field calculated-bmi"><span class="label" id="bmi-label">${esc(field.label)} <span class="unit">kg/m²</span></span>
    <output id="bmi-value" class="readonly-value" aria-labelledby="bmi-label" aria-describedby="bmi-help" aria-live="polite">${esc(bmiText())}</output>
    <small id="bmi-help">Tính từ cân nặng (kg) ÷ [chiều cao (cm) / 100]², làm tròn 2 chữ số thập phân. Cần cả hai số đo lớn hơn 0 trong cùng lượt khám.</small></div>`;
}
function supportedField(field){return field.active&&(field.type!=='unavailable'||field.code==='bmi');}
export function fieldWidget(f,value,preview=false){const id=esc('f-'+f.code),code=esc(f.code),readOnly=preview||isAdmin(),disabled=readOnly?' disabled':'',error=Object.entries(state.invalid).filter(([key])=>key.split(':')[0]===f.code).map(([,message])=>message).join(' '),constraints=f.constraints||{};const labelTag=['medications','results'].includes(f.type)?'span':'label',fieldClasses=['medications','results'].includes(f.type)?'repeat full':f.type==='textarea'?'full':'',start=`<div class="field ${fieldClasses}"><${labelTag} ${labelTag==='label'?'for="'+id+'"':'class="label"'}>${esc(f.label)}${f.unit?' <span class="unit">'+esc(f.unit)+'</span>':''}</${labelTag}>`;let control='';
if(f.code==='bmi'&&f.active&&!preview)return bmiWidget(f);
if(f.type==='unavailable'||!f.active)return `<div class="unavailable"><strong>${esc(f.label)}</strong><p>${!f.active?'Trường đã ngừng dùng. Giá trị đã lưu: '+esc(fmt(value)):'Chưa khả dụng — '+({ai_output:'đầu ra AI chưa triển khai.',derived:'giá trị tính chưa đủ quy tắc.',calculated:'giá trị tính chưa đủ quy tắc.',module_linked:'dữ liệu liên kết module chưa có hợp đồng đầu vào.',recorded_input:'đầu vào ghi nhận chưa đủ đặc tả để nhập.',measured_input:'đầu vào đo/thu thập chưa đủ đặc tả để nhập.'}[f.data_role||f.value_role]||'chưa đủ đặc tả để nhập.')}</p><small>${esc(f.help||'Chưa có nguồn xác nhận cấu trúc.')}</small></div>`;
if(!preview&&state.visit?.demographics_snapshot){const snapshot=state.visit.demographics_snapshot;let derivedLabel,derivedValue,explanation;if(f.code==='tuoi'&&snapshot.date_of_birth){derivedLabel='Tuổi tại ngày khám';derivedValue=visitDate()?ageOn(snapshot.date_of_birth,visitDate()):null;explanation='Tính từ ngày sinh đã ghi ở lượt này; không tạo thêm giá trị nhập tay.';}if(f.code==='gioi_tinh'&&snapshot.sex){derivedLabel='Giới tính theo hành chính của lượt';derivedValue={male:'Nam',female:'Nữ',other:'Khác'}[snapshot.sex]||missing;explanation='Theo thông tin hành chính đã gắn với lượt khám.';}if(derivedLabel)return `<div class="field"><span class="label">${derivedLabel}</span><div class="readonly-value" id="derived-${code}">${esc(fmt(derivedValue))}${f.code==='tuoi'&&derivedValue!==null?' tuổi':''}</div><small>${explanation}</small>${value!=null?`<details><summary>Giá trị từng ghi riêng trong biểu mẫu</summary><p>${valueContent(f,value)}</p></details>`:''}</div>`;}

if(f.type==='boolean'||f.type==='select'){const choices=f.type==='boolean'?[{code:'true',label:'Có'},{code:'false',label:'Không'}]:(f.choices||[]);control=`<select id="${id}" data-field="${code}" aria-describedby="help-${code} error-${code}" aria-invalid="${error?'true':'false'}"${disabled}><option value="">${missing}</option>${choices.map(c=>`<option value="${esc(c.code)}" ${value!=null&&String(value)===String(c.code)?'selected':''}>${esc(c.label)}</option>`).join('')}</select>`;}
else if(f.type==='multiselect'){control=`<label class="check"><input type="checkbox" data-multi-known="${code}" ${value!=null?'checked':''}${disabled}> Đã xác định danh sách (có thể không có mục)</label><select multiple id="${id}" data-field="${code}" aria-describedby="help-${code} error-${code}" aria-invalid="${error?'true':'false'}" ${value==null?'disabled':disabled} aria-label="${esc(f.label)}">${(f.choices||[]).map(c=>`<option value="${esc(c.code)}" ${Array.isArray(value)&&value.includes(c.code)?'selected':''}>${esc(c.label)}</option>`).join('')}</select>`;}
else if(f.type==='textarea')control=`<textarea id="${id}" data-field="${code}" aria-describedby="help-${code} error-${code}" aria-invalid="${error?'true':'false'}" maxlength="5000"${disabled}>${esc(value)}</textarea>`;
else if(['medications','results'].includes(f.type)){const rows=Array.isArray(value)?value:[],itemPrefix=f.type==='medications'?'Thuốc ':'Kết quả ',hideActions=isAdmin()&&!preview;control=`<p class="muted">${value==null?missing:rows.length?rows.length+' mục đã ghi nhận':'Không có mục'}</p>${f.contract_version>=2&&f.type==='results'?'<p class="unit-note">Chỉ ghi kết quả đã có. Giữ tên chỉ số, đơn vị, thời điểm thực hiện và nguồn theo tài liệu gốc.</p>':''}<div class="repeat-items">${rows.map((row,i)=>`<fieldset class="repeat-card ${f.type==='medications'?'med-card':''}"><legend>${itemPrefix}${i+1}${row?.name?' · '+esc(row.name):''}</legend>${repeatFields(f,row,i,disabled)}${hideActions?'':`<button class="button" type="button" data-remove-item="${code}" data-index="${i}"${disabled}>Xóa mục ${i+1}</button>`}</fieldset>`).join('')}</div>${hideActions?'':`<div class="actions"><button class="button" type="button" data-add-item="${code}"${disabled}>Thêm mục</button><button class="button" type="button" data-empty-list="${code}"${disabled}>Xác nhận danh sách rỗng</button><button class="button" type="button" data-null-list="${code}"${disabled}>Chưa có dữ liệu</button></div>`}`;}
else control=`<input id="${id}" data-field="${code}" aria-describedby="help-${code} error-${code}" aria-invalid="${error?'true':'false'}" type="${['integer','number'].includes(f.type)?'number':f.type==='date'?'date':f.type==='datetime'?'datetime-local':'text'}" ${f.type==='integer'?'step="1"':f.type==='number'?'step="any"':''} ${constraints.minimum!==undefined?'min="'+esc(constraints.minimum)+'"':''} ${constraints.maximum!==undefined?'max="'+esc(constraints.maximum)+'"':''} value="${esc(f.type==='datetime'?localDateTime(value):value)}" maxlength="5000"${disabled}>`;
return start+control+`<small id="help-${code}">${esc(f.help||'')}</small><div id="error-${code}" class="field-error" role="status">${esc(error)}</div></div>`;}
function metadataFields(readonly=false){const m=metadata(),dis=readonly?' disabled':'',maxLengths={primary_diagnosis_code:30,examining_doctor:200,department:200,reason:5000,hpi:5000,allergy_details:5000,secondary_diagnosis_codes:1000},field=(key,label,type='text')=>`<div class="field${type==='textarea'?' full':''}"><label for="meta-${key}">${label}</label>${type==='textarea'?`<textarea id="meta-${key}" data-metadata="${key}" maxlength="${maxLengths[key]||5000}" aria-describedby="error-meta-${key}" aria-invalid="${state.invalid['meta-'+key]?'true':'false'}"${dis}>${esc(m[key])}</textarea>`:`<input id="meta-${key}" data-metadata="${key}" ${type==='text'?'maxlength="'+(maxLengths[key]||5000)+'"':''} aria-describedby="error-meta-${key}" aria-invalid="${state.invalid['meta-'+key]?'true':'false'}" type="${type}" value="${esc(type==='datetime-local'?localDateTime(m[key]):Array.isArray(m[key])?m[key].join(', '):m[key])}"${dis}>`}<div id="error-meta-${key}" class="field-error" role="status">${esc(state.invalid['meta-'+key]||'')}</div></div>`;return `<div class="visit-details field-grid"><div class="field"><label for="visit-occurred">Thời điểm khám</label><input id="visit-occurred" aria-describedby="error-occurred_at" aria-invalid="${state.invalid.occurred_at?'true':'false'}" data-visit-field="occurred_at" type="datetime-local" value="${esc(localDateTime(visitDate()))}"${dis}><small>Ngày khám gốc; có thể nhập bù.</small><div id="error-occurred_at" class="field-error" role="status">${esc(state.invalid.occurred_at||'')}</div></div><div class="field"><label for="meta-visit_type">Loại khám</label><select id="meta-visit_type" data-metadata="visit_type"${dis}><option value="">${missing}</option><option value="new" ${m.visit_type==='new'?'selected':''}>Khám mới</option><option value="followup" ${m.visit_type==='followup'?'selected':''}>Tái khám</option></select></div>${field('reason','Lý do khám')}${field('hpi','Bệnh sử/diễn biến ngắn','textarea')}${field('primary_diagnosis_code','Mã bệnh chính ICD-10')}${field('secondary_diagnosis_codes','Mã bệnh kèm theo ICD-10 (phân tách bằng dấu phẩy)')}${field('examining_doctor','Bác sĩ khám')}${field('department','Khoa/phòng')}${field('admitted_at','Thời điểm tiếp nhận','datetime-local')}${field('ended_at','Thời điểm kết thúc','datetime-local')}<div class="field"><label for="meta-allergy_status">Dị ứng/phản ứng có hại</label><select id="meta-allergy_status" data-metadata="allergy_status"${dis}><option value="">${missing}</option>${[['unknown','Chưa hỏi/chưa biết'],['none','Đã xác nhận không có'],['known','Đã ghi nhận']].map(([v,l])=>`<option value="${v}" ${m.allergy_status===v?'selected':''}>${l}</option>`).join('')}</select></div>${field('allergy_details','Mô tả dị ứng/phản ứng có hại','textarea')}</div>`;}
function groupDirtyCount(group){const codes=visitFields().filter(f=>f.group===group).map(f=>f.code),clinical=new Set([...Object.keys(state.dirty),...Object.keys(state.invalid)].map(c=>c.split(':')[0]).filter(c=>codes.includes(c))).size;const visitKeys=new Set([...Object.keys(state.metadataDirty).map(k=>'meta-'+k),...Object.keys(state.visitDirty),...Object.keys(state.invalid).filter(k=>k==='occurred_at'||k.startsWith('meta-'))]);return clinical+(group==='Thông tin nền'?visitKeys.size:0);}
function groupStatus(group){const n=groupDirtyCount(group),fields=visitFields().filter(f=>f.group===group),available=fields.some(supportedField)||group==='Thông tin nền';return n?n+' thay đổi chưa lưu':!available?'Chưa hỗ trợ nhập':state.viewMessage==='Đã lưu'?'Đã lưu':'Đã tải';}
function groupContent(fields){const available=fields.filter(supportedField),unavailable=fields.filter(f=>!supportedField(f));return `${available.length?`<div class="field-grid">${available.map(f=>fieldWidget(f,currentValue(f.code))).join('')}</div>`:''}${unavailable.length?`<details class="unavailable-section"><summary>${available.length?'Các mục chưa hỗ trợ nhập':'Trạng thái các mục chưa hỗ trợ'} (${unavailable.length})</summary><p class="muted">Các mục này chưa hỗ trợ nhập liệu. Thông tin dưới đây dùng để đối chiếu phạm vi và nguồn.</p><div class="unavailable-items">${unavailable.map(f=>fieldWidget(f,currentValue(f.code))).join('')}</div></details>`:''}`;}
function refreshDraftStatus(){refreshBmi();const status=document.getElementById('save-status');if(status)status.textContent=hasDraft()?'Có thay đổi chưa lưu'+(Object.keys(state.invalid).length?' · Có lỗi cần sửa':''):(state.viewMessage||'Chưa có thay đổi');document.querySelectorAll('[data-group-count]').forEach(el=>{const n=groupDirtyCount(el.dataset.groupCount);el.textContent=n?n+' thay đổi chưa lưu':groupStatus(el.dataset.groupCount);});const compact=document.getElementById('group-select');if(compact)for(const option of compact.options||[])option.textContent=option.value+' · '+groupStatus(option.value);}
function dirty(code,value){if(JSON.stringify(value)===JSON.stringify(state.visit.values_json?.[code]??null))delete state.dirty[code];else state.dirty[code]=value;state.pending=null;refreshDraftStatus();}
function setInvalid(key,message){if(message)state.invalid[key]=message;else delete state.invalid[key];const [code,index,column]=key.split(':'),el=document.getElementById('error-'+code),control=document.getElementById('f-'+code)||(code.startsWith('meta-')?document.getElementById(code):code==='occurred_at'?document.getElementById('visit-occurred'):null);if(control)control.setAttribute('aria-invalid',Object.keys(state.invalid).some(k=>k.split(':')[0]===code)?'true':'false');if(el)el.textContent=Object.entries(state.invalid).filter(([k])=>k.split(':')[0]===code).map(([,v])=>v).join(' ');if(index!==undefined&&column){const id=`f-${code}-${index}-${column}`,input=document.getElementById(id),inline=document.getElementById('error-'+id);if(input)input.setAttribute('aria-invalid',message?'true':'false');if(inline)inline.textContent=message||'';}refreshDraftStatus();}
export function numericValue(el,field){if(el.validity?.badInput||el.value!==''&&!Number.isFinite(Number(el.value)))throw new Error('Cần nhập số hợp lệ. Giá trị lỗi không được lưu thành ô trống.');if(el.value==='')return null;const n=Number(el.value),c=field.constraints||{};if(field.type==='integer'&&!Number.isInteger(n))throw new Error('Cần số nguyên.');if(c.minimum!==undefined&&n<c.minimum)throw new Error('Giá trị phải từ '+c.minimum+(field.unit?' '+field.unit:'')+' trở lên.');if(c.maximum!==undefined&&n>c.maximum)throw new Error('Giá trị không được vượt '+c.maximum+(field.unit?' '+field.unit:'')+'.');return n;}
function metadataHistory(m={}){m ||= {};const names={reason:'Lý do khám',hpi:'Bệnh sử/diễn biến',visit_type:'Loại khám',primary_diagnosis_code:'Mã bệnh chính',secondary_diagnosis_codes:'Mã bệnh kèm theo',examining_doctor:'Bác sĩ khám',department:'Khoa/phòng',admitted_at:'Tiếp nhận',ended_at:'Kết thúc',allergy_status:'Dị ứng',allergy_details:'Mô tả dị ứng'};return Object.entries(m).filter(([k])=>k!=='his_source_rows').map(([k,v])=>`<tr><td>${esc(names[k]||k)}</td><td>${esc(k==='visit_type'?({new:'Khám mới',followup:'Tái khám'}[v]||missing):k==='allergy_status'?({unknown:'Chưa hỏi/chưa biết',none:'Đã xác nhận không có',known:'Đã ghi nhận'}[v]||missing):k.endsWith('_at')?displayDate(v):fmt(v))}</td><td>Thông tin lượt</td></tr>`).join('');}
function hisRawSource(source){
  if(!source?.columns)return '';
  return `<details class="his-source"><summary>Dữ liệu HIS gốc · ${esc(source.sheet)} · dòng ${esc(source.row)}</summary>
    ${source.source_name?`<p class="muted">${esc(source.source_name)}</p>`:''}
    <div class="table-scroll"><table><thead><tr><th>Cột nguồn</th><th>Giá trị gốc</th></tr></thead><tbody>
    ${source.columns.map(column=>`<tr><td>${esc(column.header)}</td><td>${esc(fmt(column.value))}</td></tr>`).join('')}
    </tbody></table></div></details>`;
}
function hisVisitSources(){
  const rows=state.visit?.metadata?.his_source_rows||[];
  return rows.length?`<section class="card his-evidence"><h2>Dữ liệu từ file HIS</h2>${rows.map(hisRawSource).join('')}</section>`:'';
}
// Exported for shells that delegate input events; renderEncounter also binds it locally.
export function handleEncounterInput(e) {
  const el = e.target;
  if (isAdmin() || !state.visit) return;
  if (el.dataset.field) {
    const f = visitFields().find(f => f.code === el.dataset.field);
    if (!f || !supportedField(f) || f.code === 'bmi' || isSnapshotField(f.code)) return;
    state.pending = null;
    try {
      let value = el.value;
      if (['date','datetime'].includes(f.type) && el.validity?.badInput) throw new Error('Ngày giờ không hợp lệ.');
      if (['number','integer'].includes(f.type)) value = numericValue(el, f);
      else if (f.type === 'multiselect') value = [...el.selectedOptions].map(o => o.value);
      else if (value === '') value = null;
      else if (f.type === 'datetime') value = toISO(value);
      else if (f.type === 'boolean') {
        if (!['true', 'false'].includes(value)) throw new Error('Chọn Có, Không hoặc để trống.');
        value = value === 'true';
      }
      setInvalid(f.code, ''); dirty(f.code, value);
    } catch (error) { setInvalid(f.code, error.message); }
    return;
  }
  if (el.dataset.repeat) {
    const code = el.dataset.repeat, f = visitFields().find(f => f.code === code);
    const index = Number(el.dataset.index), column = el.dataset.column;
    if (!f || !supportedField(f) || !['medications','results'].includes(f.type) || !repeatColumns(f).includes(column) || !Number.isInteger(index) || index < 0) return;
    const rows = structuredClone(currentValue(code)) || [];
    if (!rows[index]) return;
    const key = code + ':' + index + ':' + column;
    state.pending = null;
    try {
      if (el.validity?.badInput) throw new Error(column === 'observed_at' || column.endsWith('_date') ? 'Ngày giờ không hợp lệ.' : 'Cần nhập giá trị hợp lệ.');
      const choices = repeatChoices(f, column, rows[index]);
      if (choices && el.value && !choices.some(c => String(c.code) === el.value)) throw new Error('Chọn một giá trị trong danh mục đã xác nhận.');
      rows[index][column] = ['value','dose_value'].includes(column) ? numericValue(el, {type:'number', constraints:column === 'dose_value' ? {minimum:0} : {}}) :
        column === 'observed_at' ? toISO(el.value) : el.value || null;
      setInvalid(code, ''); setInvalid(key, ''); dirty(code, rows);
      if (column === 'test_code') {
        const units = repeatChoices(f, 'unit', rows[index]), unit = document.getElementById(`f-${code}-${index}-unit`);
        const incompatible = units && rows[index].unit != null && !units.some(c => c.code === rows[index].unit);
        setInvalid(code + ':' + index + ':unit', incompatible ? 'Đơn vị đã ghi không thuộc xét nghiệm vừa chọn. Chọn lại đơn vị theo nguồn.' : '');
        if (unit) {
          if (unit.tagName === 'SELECT' && units) unit.innerHTML = repeatOptionsHTML(units, rows[index].unit, true);
          else if ((unit.tagName === 'SELECT') !== Boolean(units)) {
            renderEncounter();
            document.getElementById(`f-${code}-${index}-test_code`)?.focus();
          }
        }
      }
    } catch (error) { setInvalid(key, error.message); }
    return;
  }
  if (el.dataset.metadata) {
    const code = el.dataset.metadata;
    const keys = ['visit_type','reason','hpi','primary_diagnosis_code','secondary_diagnosis_codes','examining_doctor','department','admitted_at','ended_at','allergy_status','allergy_details'];
    if (!keys.includes(code)) return;
    state.pending = null;
    try {
      let value = el.value || null;
      if (code === 'secondary_diagnosis_codes') value = value ? value.split(/[,;\n]+/).map(s => s.trim()).filter(Boolean) : null;
      else if (code.endsWith('_at')) {
        if (el.validity?.badInput) throw new Error('Ngày giờ không hợp lệ.');
        value = toISO(value);
      }
      if (JSON.stringify(value) === JSON.stringify(state.visit.metadata?.[code] ?? null)) delete state.metadataDirty[code];
      else state.metadataDirty[code] = value;
      setInvalid('meta-' + code, ''); refreshDraftStatus();
    } catch (error) { setInvalid('meta-' + code, error.message); }
    return;
  }
  if (el.dataset.visitField === 'occurred_at') {
    state.pending = null;
    try {
      if (el.validity?.badInput) throw new Error('Ngày giờ không hợp lệ.');
      const value = toISO(el.value);
      if (value === (state.visit.occurred_at || null)) delete state.visitDirty.occurred_at;
      else state.visitDirty.occurred_at = value;
      setInvalid('occurred_at', '');
      const header = document.getElementById('context-occurred'), age = document.getElementById('derived-tuoi'),
        contextAge = document.getElementById('context-age'), snapshotAge = document.getElementById('context-snapshot-age');
      if (header) header.textContent = 'Thời điểm khám: ' + displayDate(value);
      const computed = value ? ageOn(state.visit.demographics_snapshot?.date_of_birth, value) : null;
      if (contextAge) contextAge.textContent = computed === null ? '' : ' · ' + computed + ' tuổi tại lần khám';
      if (age) age.textContent = computed === null ? missing : computed + ' tuổi';
      if (snapshotAge) snapshotAge.textContent = computed === null ? missing : computed + ' tuổi';
      refreshDraftStatus();
    } catch (error) { setInvalid('occurred_at', error.message); }
  }
}
