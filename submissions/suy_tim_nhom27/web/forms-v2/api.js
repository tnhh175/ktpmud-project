import { state } from './router.js';
import { renderReauthBanner } from './shell.js';

export const missing = 'Chưa có dữ liệu';
export const types = {
  integer: 'Số nguyên', number: 'Số', boolean: 'Có / Không',
  select: 'Một lựa chọn', multiselect: 'Nhiều lựa chọn', text: 'Văn bản',
  textarea: 'Văn bản dài', date: 'Ngày', datetime: 'Thời điểm',
  medications: 'Danh sách thuốc', results: 'Kết quả đã có', unavailable: 'Chưa đủ đặc tả',
};
export const groupsDefault = [
  'Thông tin nền', 'Triệu chứng và dấu hiệu', 'Lão khoa và hỗ trợ',
  'Tiền sử và bệnh đồng mắc', 'Thuốc đang sử dụng',
  'Cận lâm sàng và theo dõi', 'Chờ đặc tả module', 'Trường bổ sung',
];

export function esc(v) {
  return String(v ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

export function fmt(v) {
  if (v == null) return missing;
  if (typeof v === 'boolean') return v ? 'Có' : 'Không';
  if (Array.isArray(v)) return v.length ? v.map(fmt).join('; ') : 'Không có mục';
  if (typeof v === 'object') return Object.values(v).filter(x => x != null).map(fmt).join(' · ');
  return String(v);
}

export function displayDate(value) {
  if (!value) return missing;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? missing : date.toLocaleString('vi-VN');
}

export function localDateTime(value) {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' :
    new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

export function toISO(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error('Ngày giờ không hợp lệ.');
  return date.toISOString();
}

export function ageOn(dob, on = new Date()) {
  if (!dob || !/^\d{4}-\d{2}-\d{2}$/.test(String(dob))) return null;
  const born = String(dob).split('-').map(Number), when = new Date(on);
  const check = new Date(String(dob) + 'T00:00:00Z');
  if (Number.isNaN(when.getTime()) || Number.isNaN(check.getTime()) ||
      check.toISOString().slice(0, 10) !== String(dob)) return null;
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(when);
  const part = key => Number(parts.find(p => p.type === key)?.value);
  let age = part('year') - born[0];
  if (part('month') < born[1] || (part('month') === born[1] && part('day') < born[2])) age--;
  return age >= 0 ? age : null;
}

export function sourceName(s) {
  return { manual: 'Nhập tay', excel: 'Nhập file Excel', import: 'Nhập file', system: 'Hệ thống' }[s] || s || missing;
}

export function storeToken(token) {
  state.token = token || null;
  try {
    if (token) sessionStorage.setItem('forms_token', token);
    else sessionStorage.removeItem('forms_token');
  } catch { /* The in-memory session also works when browser storage is unavailable. */ }
}

export async function request(path, { method = 'GET', body, token = state.token } = {}) {
  let response;
  try {
    response = await fetch(path, {
      method,
      headers: {
        ...(token ? { Authorization: 'Bearer ' + token } : {}),
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new Error('Không kết nối được máy chủ. Vui lòng thử lại.');
  }
  if (!response.ok) {
    const detail = (await response.json().catch(() => null))?.detail;
    const fallback = {
      401: 'Phiên đăng nhập đã hết hiệu lực. Vui lòng đăng nhập lại.',
      403: 'Tài khoản chưa có quyền thực hiện thao tác này.',
      409: 'Dữ liệu đã thay đổi hoặc trùng mã. Vui lòng đối chiếu trước khi thử lại.',
      413: 'Dữ liệu gửi lên vượt giới hạn cho phép.',
      422: 'Dữ liệu chưa hợp lệ. Vui lòng kiểm tra các trường đã nhập.',
      503: 'Máy chủ chưa sẵn sàng. Vui lòng thử lại.',
    };
    const validation = Array.isArray(detail) ? detail.map(item => item.msg || '').filter(Boolean).join('; ') : '';
    const message = typeof detail === 'string' ? detail : detail?.fields ?
      Object.values(detail.fields).map(fmt).join('; ') : validation || fallback[response.status] || 'Yêu cầu chưa được máy chủ chấp nhận.';
    const error = new Error(message);
    error.status = response.status;
    error.detail = detail;
    throw error;
  }
  return response;
}

export async function api(path, options = {}) {
  const response = await request(path, options);
  if (response.status === 204) return null;
  return response.json().catch(() => {
    throw new Error('Máy chủ chưa trả dữ liệu hợp lệ. Vui lòng thử lại.');
  });
}

export async function signIn(username, password) {
  const result = await api('/api/v1/auth/token', { method: 'POST', body: { username, password }, token: null });
  if (!result?.access_token) throw new Error('Máy chủ chưa trả phiên đăng nhập hợp lệ.');
  return result.access_token;
}

export async function logoutApi() {
  if (!state.token) return;
  try { await request('/api/v1/auth/logout', { method: 'POST' }); }
  catch (error) { if (error.status !== 401) throw error; }
}

export function requireSignIn(error) {
  if (error?.status !== 401 || !state.actor) return false;
  const previousActor = state.actor;
  storeToken(null);
  renderReauthBanner(previousActor);
  return true;
}
