import { api, storeToken, logoutApi, requireSignIn } from './api.js';
import { renderAuth, renderReauthBanner, renderStartup, notice } from './shell.js';
import { openPatients, renderPatients, openCreatePatientModal } from './patients.js';
import { openPatient, renderProfile, openCreateVisitModal, openEditPatientModal, openPatientHistoryModal } from './profile.js';
import { openVisit, renderEncounter } from './encounter.js';
import { showImport, renderImport } from './his.js';
import { renderAdminFields } from './admin.js';

function savedToken() {
  try { return sessionStorage.getItem('forms_token'); } catch { return null; }
}

function newState(token = null) {
  return {
    token, actor: null, route: 'patients', page: 'patients', busy: false,
    fields: [], catalog: 0, patients: [], patient: null, overview: null, visit: null, group: null,
    dirty: {}, metadataDirty: {}, visitDirty: {}, invalid: {}, pending: null, viewMessage: '',
    import: { stage: 0, fileGeneration: 0, reading: false, filename: null, content_base64: null,
      preview: null, decisions: {}, commitBody: null, result: null },
  };
}

export const state = newState(savedToken());
export function isAdmin() { return state.actor?.role === 'admin'; }
export function hasDraft() {
  return Object.keys(state.dirty).length + Object.keys(state.invalid).length +
    Object.keys(state.metadataDirty).length + Object.keys(state.visitDirty).length > 0;
}
export function resetDraft() {
  state.dirty = {}; state.metadataDirty = {}; state.visitDirty = {}; state.invalid = {}; state.pending = null;
}
export function confirmLeave(message = 'Có thay đổi chưa lưu. Rời lượt và bỏ phần đang nhập?') {
  return !hasDraft() || globalThis.confirm(message);
}

let busyControls = null;
export function lockBusyUI() {
  const app = typeof document === 'undefined' ? null : document.getElementById('app');
  if (!state.busy || !busyControls || !app) return;
  app.querySelectorAll('button,input,select,textarea').forEach(el => {
    if (!busyControls.has(el)) busyControls.set(el, el.disabled);
    el.disabled = true;
  });
  app.setAttribute('aria-busy', 'true');
  const status = document.getElementById('busy-status');
  if (status) status.hidden = false;
}

export async function runAction(work) {
  if (state.busy) return;
  state.busy = true;
  const controls = new Map();
  busyControls = controls;
  lockBusyUI();
  try { return await work(); }
  finally {
    state.busy = false;
    for (const [el, disabled] of controls) el.disabled = disabled;
    busyControls = null;
    if (typeof document !== 'undefined') {
      document.getElementById('app')?.removeAttribute('aria-busy');
      const status = document.getElementById('busy-status');
      if (status) status.hidden = true;
    }
    drainHash();
  }
}

export async function loadFields() {
  const catalog = await api('/api/forms/fields');
  if (!Array.isArray(catalog?.fields)) throw new Error('Chưa đọc được danh mục biểu mẫu.');
  state.fields = catalog.fields; state.catalog = catalog.revision;
}
export async function loadPatients() {
  const patients = await api('/api/forms/patients');
  if (!Array.isArray(patients)) throw new Error('Chưa đọc được danh sách hồ sơ.');
  state.patients = patients;
}

function syncLocation(route, replace = true) {
  if (typeof history === 'undefined' || typeof location === 'undefined') return;
  const entry = { formsV2: true, route, patientId: state.patient?.id, visitId: state.visit?.id };
  history[replace ? 'replaceState' : 'pushState'](entry, '', '#' + route);
}

export function clearSession() {
  const busy = state.busy;
  storeToken(null);
  Object.assign(state, newState(), { busy, route: 'login', page: 'login' });
  if (typeof document !== 'undefined') {
    document.querySelectorAll('dialog').forEach(dialog => { if (dialog.open) dialog.close(); dialog.remove(); });
    const app = document.getElementById('app');
    if (app) app.hidden = false;
    syncLocation('login');
    renderAuth();
    document.getElementById('main')?.focus();
  }
}

export async function logout() {
  const openDialog = typeof document !== 'undefined' && document.querySelector('dialog[open]:not(#reauth-dialog)');
  if ((hasDraft() || openDialog) && !globalThis.confirm('Đăng xuất và bỏ thay đổi chưa lưu?')) return false;
  try { await logoutApi(); } catch {} finally { clearSession(); }
  return true;
}

const routes = new Set(['login', 'patients', 'profile', 'encounter', 'import', 'import-preview', 'import-result', 'fields']);
let navigating = false;
export async function navigate(route, params = {}) {
  route = String(route || 'patients').replace(/^#/, '');
  if (route === 'excel') route = 'import';
  if (!routes.has(route)) route = 'patients';
  if (navigating) return false;
  const previousRoute = state.route;
  if (previousRoute === 'encounter' && route !== 'encounter' && !confirmLeave()) {
    syncLocation(previousRoute); return false;
  }
  if (!state.token) {
    if (state.actor) { renderReauthBanner(state.actor); syncLocation(previousRoute); return false; }
    clearSession(); return false;
  }
  if (route === 'login') return logout();
  if (route === 'fields' && !isAdmin() || route.startsWith('import') && isAdmin()) route = 'patients';
  if (route === 'profile' && !params.patientId && !state.patient?.id) route = 'patients';
  if (route === 'encounter' && !params.visitId && !state.visit) route = 'patients';
  navigating = true;
  // Screen modules replace the current hash after loading; reserve a history entry first.
  if (!params.fromHash && !params.replace && previousRoute !== route) syncLocation(previousRoute, false);
  try {
    switch (route) {
      case 'patients':
        if (params.skipLoad && Array.isArray(state.patients)) renderPatients();
        else await openPatients();
        break;
      case 'profile': await openPatient(params.patientId || state.patient.id); break;
      case 'encounter':
        if (params.visitId) await openVisit(params.visitId);
        else renderEncounter();
        break;
      case 'import': case 'import-preview': case 'import-result':
        showImport(['import', 'import-preview', 'import-result'].indexOf(route)); break;
      case 'fields': await loadFields(); renderAdminFields(); break;
    }
    if (previousRoute === 'encounter' && state.route !== 'encounter') resetDraft();
    state.page = state.route;
    syncLocation(state.route);
    return true;
  } catch (error) {
    syncLocation(previousRoute);
    throw error;
  } finally { navigating = false; }
}

let initializing = null;
export async function initialize() {
  if (initializing) return initializing;
  if (!state.token) { clearSession(); return false; }
  const requestedRoute = typeof location === 'undefined' ? 'patients' : location.hash.slice(1) || 'patients';
  const saved = typeof history === 'undefined' ? {} : history.state || {};
  renderStartup();
  initializing = (async () => {
    try {
      const actor = await api('/api/v1/auth/me');
      if (!['admin', 'doctor'].includes(actor?.role)) {
        clearSession(); notice('Tài khoản chưa có quyền truy cập khu vực này.'); return false;
      }
      state.actor = actor;
      await loadFields();
      await navigate(requestedRoute === 'login' ? 'patients' : requestedRoute, {
        replace: true, patientId: saved.formsV2 ? saved.patientId : undefined,
        visitId: saved.formsV2 ? saved.visitId : undefined,
      });
      return true;
    } catch (error) {
      if (error.status === 401 || error.status === 403) {
        clearSession(); notice(error.message);
      } else renderStartup(error);
      return false;
    }
  })();
  try { return await initializing; } finally { initializing = null; drainHash(); }
}

async function globalClick(event) {
  if (event.defaultPrevented) return;
  const skip = event.target.closest('.skip');
  if (skip) { event.preventDefault(); document.getElementById('main')?.focus(); return; }
  const el = event.target.closest('[data-action],[data-nav]');
  if (!el || el.disabled) return;
  if (el.tagName === 'A' && (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0)) return;
  event.preventDefault();
  if (state.busy) return;
  const action = el.dataset.action;
  if (action === 'toggle-password') {
    const input = document.getElementById(el.dataset.passwordTarget || 'password');
    if (!input) return;
    const show = input.type === 'password';
    input.type = show ? 'text' : 'password'; el.textContent = show ? 'Ẩn' : 'Hiện';
    el.setAttribute('aria-pressed', String(show)); el.setAttribute('aria-label', show ? 'Ẩn mật khẩu' : 'Hiện mật khẩu');
    return;
  }
  try {
    await runAction(async () => {
      if (el.dataset.nav) return navigate(el.dataset.nav);
      switch (action) {
        case 'logout': return logout();
        case 'retry-startup': return initialize();
        case 'new-patient': return openCreatePatientModal();
        case 'new-visit': return openCreateVisitModal();
        case 'edit-admin': case 'edit-patient': return openEditPatientModal();
        case 'patient-history': return openPatientHistoryModal();
        case 'fields': case 'patients': case 'profile': case 'encounter': case 'import': return navigate(action);
      }
    });
  } catch (error) {
    if (!requireSignIn(error)) notice(error.message, 'error', document.getElementById('reauth-dialog') ? 'reauth-notice' : 'notice');
  }
}

let pendingHash = null;
function drainHash() {
  if (!pendingHash || state.busy || navigating || initializing) return;
  const next = pendingHash;
  pendingHash = null;
  queueMicrotask(() => { void hashChanged(next); });
}
async function hashChanged(entry = null) {
  const next = entry || { route: location.hash.slice(1) || 'patients', saved: history.state || {} };
  if (state.busy || navigating || initializing) { pendingHash = next; return; }
  const { route, saved } = next;
  if (route === state.route) return;
  pendingHash = null;
  try {
    await runAction(() => navigate(route, { fromHash: true,
      patientId: saved.formsV2 ? saved.patientId : undefined,
      visitId: saved.formsV2 ? saved.visitId : undefined }));
  } catch (error) { if (!requireSignIn(error)) notice(error.message); }
}

if (typeof document !== 'undefined') {
  document.addEventListener('click', globalClick);
  window.addEventListener('hashchange', () => { void hashChanged(); });
  window.addEventListener('beforeunload', event => {
    if (hasDraft()) { event.preventDefault(); event.returnValue = ''; }
  });
  void initialize();
}
