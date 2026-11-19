import { state, isAdmin, hasDraft, lockBusyUI, initialize } from './router.js';
import { esc, signIn, storeToken, api, requireSignIn } from './api.js';

export const icons = {
  heart:'<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/><path d="M3 12h5l2-4 4 8 2-4h5"/>',
  patients:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m20 0v-2a4 4 0 0 0-3-3.9"/><circle cx="9" cy="7" r="4"/><path d="M16 3.1a4 4 0 0 1 0 7.8"/>',
  file:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M8 13h8m-8 4h5"/>',
  upload:'<path d="M12 16V3m-5 5 5-5 5 5M4 16v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4"/>',
  download:'<path d="M12 3v13m-5-5 5 5 5-5M4 17v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"/>',
  settings:'<path d="M4 6h16M4 12h16M4 18h16"/><circle cx="8" cy="6" r="2"/><circle cx="16" cy="12" r="2"/><circle cx="10" cy="18" r="2"/>',
  palette:'<path d="M12 3a9 9 0 1 0 0 18h1a2 2 0 0 0 1.4-3.4 1.5 1.5 0 0 1 1.1-2.6H17a4 4 0 0 0 4-4c0-4.4-4-8-9-8Z"/><circle cx="7.5" cy="10" r=".5"/><circle cx="10" cy="6.5" r=".5"/><circle cx="15" cy="7" r=".5"/>',
  search:'<circle cx="10.5" cy="10.5" r="7.5"/><path d="m16 16 5 5"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  arrow:'<path d="M4 12h16m-6-6 6 6-6 6"/>',
  back:'<path d="M20 12H4m6-6-6 6 6 6"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  check:'<path d="m5 12 4 4L19 6"/>',
  shield:'<path d="m12 2 9 4v6c0 5-9 10-9 10S3 17 3 12V6Z"/><path d="m8 12 3 3 5-6"/>',
  info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v.01"/>',
  calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18"/>',
  logout:'<path d="M9 21H4V3h5m5 5 5 4-5 4m-5-4h10"/>',
  edit:'<path d="m16 3 5 5-12 12-6 1 1-6Z"/><path d="m14 5 5 5"/>',
  save:'<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h12l4 4v12a2 2 0 0 1-2 2Z"/><path d="M7 3v6h10V3M7 21v-8h10v8"/>',
  eye:'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
  history:'<path d="M3 11a9 9 0 1 1 2.6 7.4M3 3v8h8m1-4v5l4 2"/>'
};

export function icon(name) {
  return `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${icons[name] || icons.file}</svg>`;
}

export function button(label, actionAttrs = '', primary = false, iconName = '') {
  const attrs = !actionAttrs ? '' : actionAttrs.includes('=') ? actionAttrs : `data-action="${esc(actionAttrs)}"`;
  return `<button type="button" class="button${primary ? ' primary' : ''}" ${attrs}>${iconName ? icon(iconName) : ''}${esc(label)}</button>`;
}

// Titles/subtitles may already contain escaped server data from the screen modules.
export function heading(title, subtitle = '', actionsHtml = '') {
  return `<div class="page-heading"><div><h1>${title}</h1>${subtitle ? `<p>${subtitle}</p>` : ''}</div>${actionsHtml ? `<div class="row wrap">${actionsHtml}</div>` : ''}</div>`;
}

let toastTimer;
export function toast(message) {
  const target = document.getElementById('toast');
  if (!target) return;
  target.textContent = message; target.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => target.classList.remove('visible'), 3400);
}

export function messageBox(id = 'notice') {
  return `<div id="${esc(id)}" class="status" role="alert" tabindex="-1" hidden></div>`;
}

export function notice(message, kind = 'error', id = 'notice') {
  let target = document.getElementById(id);
  if (!target && id === 'notice') {
    const main = document.getElementById('main');
    if (main) { main.insertAdjacentHTML('afterbegin', messageBox()); target = document.getElementById(id); }
  }
  if (!target) return;
  target.className = 'status ' + (['error', 'warn', 'success'].includes(kind) ? kind : 'error');
  target.textContent = message; target.hidden = !message;
  if (message) target.focus();
}

function brand(href = '#patients') {
  return `<a href="${href}" class="brand">${icon('heart')}<span>Suy tim<small>Quản lý hồ sơ bệnh nhân</small></span></a>`;
}

export function shell(contentHtml, options = 'patients', maybeBreadcrumb = 'Hồ sơ bệnh nhân') {
  const { active = 'patients', breadcrumb = 'Hồ sơ bệnh nhân', page = active } =
    typeof options === 'string' ? { active: options, breadcrumb: maybeBreadcrumb } : options || {};
  const role = isAdmin() ? 'Quản trị viên' : 'Bác sĩ';
  const name = state.actor?.display_name || state.actor?.username || '';
  const nav = (route, label, image) => `<a class="nav-item${active === route ? ' active' : ''}" href="#${route}" data-nav="${route}" ${active === route ? 'aria-current="page"' : ''}>${icon(image)}${label}</a>`;
  const app = document.getElementById('app');
  state.page = page; state.route = page;
  if (typeof history !== 'undefined') {
    history.replaceState({ formsV2: true, route: page, patientId: state.patient?.id, visitId: state.visit?.id }, '', '#' + page);
  }
  app.hidden = false;
  app.innerHTML = `<aside class="sidebar">${brand()}
    <nav aria-label="Điều hướng chính">${nav('patients', 'Hồ sơ bệnh nhân', 'patients')}
      ${isAdmin() ? nav('fields', 'Biểu mẫu', 'settings') : nav('import', 'Nhập file HIS', 'upload')}
    </nav>
    <div class="sidebar-foot"><div class="row account-identity"><div class="avatar">${isAdmin() ? 'AD' : 'BS'}</div>
      <div><strong class="small">${esc(name)}</strong><div class="small muted">${role}</div></div></div>
      ${button('Đăng xuất', 'logout', false, 'logout')}</div>
    </aside><div class="workspace"><header class="topbar">
      <div class="breadcrumb">Suy tim <span>/ ${esc(breadcrumb)}</span></div>
      <div class="topbar-account"><span class="account-badge"><strong>${esc(name)}</strong><span>${role}</span></span>
        ${button('Đăng xuất', 'logout', false, 'logout')}</div>
    </header><main id="main" class="main" tabindex="-1" data-page="${esc(page)}">
      <div id="busy-status" class="busy-status" role="status" hidden>Đang tải…</div>
      ${/\bid\s*=\s*["']notice["']/.test(contentHtml) ? '' : messageBox()}${contentHtml}
    </main></div>`;
  lockBusyUI();
}

export function modal(title, bodyHtml, onSubmit, options = {}) {
  const { submitLabel = 'Lưu', maxWidth = '520px', readOnly = false } =
    typeof options === 'string' ? { submitLabel: options } : options || {};
  const dialog = document.createElement('dialog');
  dialog.setAttribute('aria-labelledby', 'dialog-title');
  if (maxWidth) dialog.dataset.maxWidth = String(maxWidth);
  dialog.innerHTML = `<form><div class="row spread"><h2 id="dialog-title">${esc(title)}</h2>
    <button type="button" class="icon-button" data-close aria-label="Đóng">×</button></div>
    <div class="dialog-error status error" role="alert" tabindex="-1" hidden></div>${bodyHtml}
    <div class="dialog-actions">${button(readOnly ? 'Đóng' : 'Hủy', 'data-close=""')}
      ${readOnly ? '' : `<button type="submit" class="button primary">${esc(submitLabel)}</button>`}</div></form>`;
  let submitting = false;
  dialog.addEventListener('cancel', event => { if (submitting) event.preventDefault(); });
  dialog.addEventListener('close', () => dialog.remove());
  dialog.querySelectorAll('[data-close]').forEach(control => {
    control.addEventListener('click', event => { event.preventDefault(); if (!submitting) dialog.close(); });
  });
  dialog.querySelector('form').addEventListener('submit', async event => {
    event.preventDefault();
    if (submitting || readOnly) return;
    const data = new FormData(event.target);
    const controls = [...dialog.querySelectorAll('button,input,select,textarea')].map(el => [el, el.disabled]);
    const errorBox = dialog.querySelector('.dialog-error');
    errorBox.hidden = true; errorBox.textContent = '';
    submitting = true; dialog.setAttribute('aria-busy', 'true');
    controls.forEach(([el]) => { el.disabled = true; });
    try { await onSubmit(data, dialog); }
    catch (error) {
      if (!requireSignIn(error)) { errorBox.textContent = error.message; errorBox.hidden = false; errorBox.focus(); }
    } finally {
      submitting = false; dialog.removeAttribute('aria-busy');
      controls.forEach(([el, disabled]) => { el.disabled = disabled; });
    }
  });
  document.body.append(dialog); dialog.showModal();
  dialog.querySelector('input:not([disabled]),select:not([disabled]),textarea:not([disabled])')?.focus();
  return dialog;
}

function credentialsForm(actor = null) {
  const prefix = actor ? 'reauth-' : '';
  return `<form id="${prefix}login-form"><div class="field"><label for="${prefix}username">Tên đăng nhập</label>
      <input id="${prefix}username" name="username" autocomplete="username" maxlength="80" required ${actor ? `value="${esc(actor.username)}" readonly` : ''}></div>
    <div class="field"><label for="${prefix}password">Mật khẩu</label><div class="password-control">
      <input id="${prefix}password" name="password" type="password" autocomplete="current-password" maxlength="200" required>
      <button type="button" data-action="toggle-password" data-password-target="${prefix}password" aria-controls="${prefix}password" aria-pressed="false" aria-label="Hiện mật khẩu">Hiện</button>
    </div></div><button type="submit" class="button primary login-submit">${actor ? 'Đăng nhập lại' : 'Đăng nhập'}${icon('arrow')}</button></form>`;
}

export function renderAuth(options = {}) {
  const app = document.getElementById('app');
  app.hidden = false;
  state.route = 'login'; state.page = 'login';
  app.innerHTML = `<main id="main" class="login-page" tabindex="-1">
    <section class="login-story" aria-labelledby="product-title">${brand('#login')}
      <h1 id="product-title">Hồ sơ liền mạch.<br>Theo dõi qua từng lượt khám.</h1>
      <p>Tra cứu hồ sơ, ghi nhận thông tin và đối chiếu dữ liệu HIS trong cùng một nơi.</p>
      <div class="login-art"><div class="line">${icon('patients')}<strong>Hồ sơ bệnh nhân</strong><span>Mã hồ sơ ổn định</span></div>
        <div class="line">${icon('calendar')}<strong>Lượt khám</strong><span>Theo thời gian</span></div>
        <div class="line">${icon('upload')}<strong>Nhập file HIS</strong><span>Đối chiếu trước khi lưu</span></div></div>
      <span class="login-story-foot">Suy tim · Quản lý hồ sơ bệnh nhân</span></section>
    <section class="login-form-side" aria-labelledby="login-title"><div class="login-form">
      <h2 id="login-title">Đăng nhập</h2><p class="muted">Sử dụng tài khoản đã được cấp.</p>
      ${messageBox()}${credentialsForm()}
      <p class="login-role">${icon('shield')}Quyền truy cập do máy chủ xác định theo tài khoản.</p>
    </div></section></main>`;
  const form = document.getElementById('login-form');
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const submit = form.querySelector('[type="submit"]');
    if (submit.disabled) return;
    submit.disabled = true; form.setAttribute('aria-busy', 'true');
    try {
      storeToken(await signIn(form.elements.namedItem('username').value.trim(), form.elements.namedItem('password').value));
      await initialize();
    } catch (error) { notice(error.message); }
    finally { submit.disabled = false; form.removeAttribute('aria-busy'); }
  });
  if (options.message) notice(options.message, options.kind || 'error');
  lockBusyUI();
}

export function renderLogin(options = {}) { return renderAuth(options); }

export function renderReauthBanner(previousActor) {
  if (document.getElementById('reauth-dialog')) return;
  const app = document.getElementById('app');
  const suspendedFocus = document.activeElement;
  const suspendedDialog = [...document.querySelectorAll('dialog[open]')].at(-1) || null;
  const appWasHidden = app.hidden;
  if (suspendedDialog) suspendedDialog.hidden = true;
  app.hidden = true;
  const dialog = document.createElement('dialog');
  dialog.id = 'reauth-dialog'; dialog.className = 'reauth-dialog';
  dialog.setAttribute('aria-labelledby', 'reauth-title');
  dialog.setAttribute('aria-describedby', 'reauth-description');
  dialog.innerHTML = `<h2 id="reauth-title">Đăng nhập lại</h2>
    <p id="reauth-description">Phiên đăng nhập đã hết hiệu lực. ${hasDraft() ? 'Bản nháp được giữ trong tab này. ' : ''}Nhập mật khẩu của tài khoản đang dùng để tiếp tục.</p>
    ${messageBox('reauth-notice')}${credentialsForm(previousActor)}
    ${button('Đăng xuất', 'logout', false, 'logout')}`;
  dialog.addEventListener('cancel', event => event.preventDefault());
  const form = dialog.querySelector('form');
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const submit = form.querySelector('[type="submit"]'), signOut = dialog.querySelector('[data-action="logout"]');
    if (submit.disabled) return;
    submit.disabled = true; signOut.disabled = true; form.setAttribute('aria-busy', 'true');
    try {
      const token = await signIn(previousActor.username, form.elements.namedItem('password').value);
      const actor = await api('/api/v1/auth/me', { token });
      if (!actor.user_id || actor.user_id !== previousActor.user_id || actor.role !== previousActor.role) {
        throw new Error('Tài khoản đã thay đổi. Đăng xuất để mở phiên mới.');
      }
      storeToken(token); state.actor = actor;
      dialog.close(); dialog.remove(); app.hidden = appWasHidden;
      if (suspendedDialog?.isConnected) suspendedDialog.hidden = false;
      if (suspendedFocus?.isConnected && !suspendedFocus.disabled) suspendedFocus.focus();
      else (suspendedDialog?.querySelector('input,select,textarea') || document.getElementById('main'))?.focus();
      if (!suspendedDialog) notice(hasDraft() ? 'Đã đăng nhập lại. Chọn Lưu để gửi bản nháp.' : 'Đã đăng nhập lại.', 'success');
    } catch (error) { notice(error.message, 'error', 'reauth-notice'); }
    finally { submit.disabled = false; signOut.disabled = false; form.removeAttribute('aria-busy'); }
  });
  document.body.append(dialog); dialog.showModal();
  form.elements.namedItem('password').focus();
}

export function renderStartup(error = null) {
  const app = document.getElementById('app');
  app.hidden = false;
  app.innerHTML = `<main id="main" class="startup-page" tabindex="-1"><section class="card startup-card" aria-labelledby="startup-title">
    <h1 id="startup-title">${error ? 'Chưa tải được hồ sơ' : 'Đang tải hồ sơ…'}</h1>
    ${error ? `<p>Phiên đăng nhập vẫn được giữ. Thử tải lại hoặc đăng xuất.</p>${messageBox()}
      <div class="actions">${button('Thử lại', 'retry-startup', true)}${button('Đăng xuất', 'logout')}</div>` : '<p role="status">Đang kết nối với máy chủ.</p>'}
    </section></main>`;
  lockBusyUI();
  if (error) notice(error.message);
}
