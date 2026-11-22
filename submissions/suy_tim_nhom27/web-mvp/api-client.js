'use strict';

/* ==========================================================================
   API Client Abstraction (33 OpenAPI 3.1 Operations)
   Hai adapter dùng chung một giao diện:
     - mode: 'api'    -> HTTP fetch tới /api/v1/* kèm Bearer JWT & If-Match
     - mode: 'static' -> StaticRuntime (localStorage trên trình duyệt)
   ========================================================================== */

(function (global) {
  const TOKEN_KEY = 'suytim_mvp_access_token';
  const REFRESH_KEY = 'suytim_mvp_refresh_token';
  const REQUEST_TIMEOUT_MS = 30000;

  class HttpApiError extends Error {
    constructor(status, problem) {
      const detail = (problem && (problem.detail || problem.title)) || ('Lỗi máy chủ HTTP ' + status);
      super(detail);
      this.name = 'ApiError';
      this.status = status;
      this.code = (problem && problem.code) || ('HTTP_' + status);
      this.title = (problem && problem.title) || ('Lỗi ' + status);
      this.detail = detail;
      this.errors = (problem && problem.errors) || [];
      this.currentRowVersion = problem && problem.currentRowVersion !== undefined ? problem.currentRowVersion : null;
      this.problem = problem || { status: status, title: this.title, detail: detail };
    }
  }

  function getConfig() {
    const cfg = global.APP_CONFIG || {};
    return {
      mode: cfg.mode === 'static' ? 'static' : 'api',
      apiBase: cfg.apiBase !== undefined ? String(cfg.apiBase).replace(/\/+$/, '') : '/api/v1'
    };
  }

  function buildQuery(params) {
    if (!params) return '';
    const sp = new URLSearchParams();
    Object.keys(params).forEach(function (k) {
      const v = params[k];
      if (v !== undefined && v !== null && v !== '') {
        sp.set(k, String(v));
      }
    });
    const qs = sp.toString();
    return qs ? '?' + qs : '';
  }

  function createHttpAdapter(apiBase) {
    let sessionEpoch = 0;
    let refreshOperation = null;

    function sessionChanged() {
      return new HttpApiError(0, { code: 'SESSION_CHANGED', detail: 'Phiên đăng nhập đã thay đổi. Yêu cầu cũ đã được bỏ qua.' });
    }

    function matchesSession(epoch, token, refreshToken) {
      return epoch === sessionEpoch && global.sessionStorage.getItem(TOKEN_KEY) === token && global.sessionStorage.getItem(REFRESH_KEY) === refreshToken;
    }

    function clearSession(epoch, token, refreshToken) {
      if (!matchesSession(epoch, token, refreshToken)) return;
      sessionEpoch += 1;
      global.sessionStorage.removeItem(TOKEN_KEY);
      global.sessionStorage.removeItem(REFRESH_KEY);
    }

    function refreshSession() {
      const epoch = sessionEpoch;
      const token = global.sessionStorage.getItem(TOKEN_KEY);
      const rt = global.sessionStorage.getItem(REFRESH_KEY);
      if (refreshOperation && matchesSession(refreshOperation.epoch, refreshOperation.token, refreshOperation.rt)) return refreshOperation.promise;
      if (!rt) return Promise.reject(new HttpApiError(401, { detail: 'Phiên đăng nhập đã hết hạn.' }));
      const operation = { epoch: epoch, token: token, rt: rt, promise: null };
      operation.promise = (async function () {
        try {
          const refreshed = await request('POST', '/auth/refresh', { body: { refreshToken: rt }, skipAuth: true }, true);
          if (!matchesSession(epoch, token, rt)) throw sessionChanged();
          if (!refreshed || !refreshed.accessToken) throw new HttpApiError(401, { detail: 'Không nhận được phiên đăng nhập hợp lệ.' });
          global.sessionStorage.setItem(TOKEN_KEY, refreshed.accessToken);
          if (refreshed.refreshToken) global.sessionStorage.setItem(REFRESH_KEY, refreshed.refreshToken);
          return refreshed;
        } catch (err) {
          if (epoch !== sessionEpoch) throw sessionChanged();
          if (err && (err.status === 401 || err.status === 403)) clearSession(epoch, token, rt);
          throw err;
        } finally {
          if (refreshOperation === operation) refreshOperation = null;
        }
      })();
      refreshOperation = operation;
      return operation.promise;
    }

    async function request(method, path, options, retried) {
      const opts = options || {};
      const epoch = sessionEpoch;
      const headers = { Accept: 'application/json, application/problem+json' };
      const token = opts.authToken || global.sessionStorage.getItem(TOKEN_KEY);
      const rt = global.sessionStorage.getItem(REFRESH_KEY);
      if (token && (!opts.skipAuth || opts.authToken)) {
        headers.Authorization = 'Bearer ' + token;
      }
      if (opts.ifMatch !== undefined && opts.ifMatch !== null) {
        headers['If-Match'] = '"' + String(opts.ifMatch).replace(/^"|"$/g, '') + '"';
      }
      let bodyStr;
      if (opts.body !== undefined) {
        headers['Content-Type'] = 'application/json';
        bodyStr = JSON.stringify(opts.body);
      }

      let res;
      const controller = typeof global.AbortController === 'function' ? new global.AbortController() : null;
      let timedOut = false;
      const timeoutId = controller ? global.setTimeout(function () {
        timedOut = true;
        controller.abort();
      }, REQUEST_TIMEOUT_MS) : null;
      try {
        res = await fetch(apiBase + path, { method: method, headers: headers, body: bodyStr, signal: controller ? controller.signal : undefined });
      } catch (_netErr) {
        if (timedOut || (_netErr && _netErr.name === 'AbortError')) {
          throw new HttpApiError(0, {
            status: 0,
            code: 'REQUEST_TIMEOUT',
            title: 'Yêu cầu quá thời gian chờ',
            detail: 'Máy chủ chưa phản hồi sau 30 giây. Dữ liệu chưa được xác nhận, hãy tải lại để kiểm tra rồi thử lại.'
          });
        }
        throw new HttpApiError(0, {
          status: 0,
          code: 'NETWORK_ERROR',
          title: 'Không thể kết nối máy chủ',
          detail: 'Không thể kết nối máy chủ — kiểm tra mạng và thử lại.'
        });
      } finally {
        if (timeoutId !== null) global.clearTimeout(timeoutId);
      }

      if (!opts.skipAuth && epoch !== sessionEpoch) throw sessionChanged();
      if (res.status === 401 && !opts.skipAuth) {
        if (!retried) {
          if (token !== global.sessionStorage.getItem(TOKEN_KEY)) return request(method, path, options, true);
          if (rt) {
            await refreshSession();
            if (epoch !== sessionEpoch) throw sessionChanged();
            return request(method, path, options, true);
          }
        }
      }

      if (res.status === 204) return null;

      let data = null;
      const ctype = res.headers.get('content-type') || '';
      if (ctype.indexOf('json') >= 0) {
        try {
          data = await res.json();
        } catch (_e) {
          data = null;
        }
      }

      if (!opts.skipAuth && epoch !== sessionEpoch) throw sessionChanged();
      if (res.status === 401 && !opts.skipAuth) clearSession(epoch, token, rt);
      if (!res.ok) {
        throw new HttpApiError(res.status, data || { status: res.status, title: res.statusText, detail: 'Yêu cầu thất bại (HTTP ' + res.status + ').' });
      }
      if (!opts.skipAuth && epoch !== sessionEpoch) throw sessionChanged();
      return data;
    }

    return {
      /* Auth */
      async login(payload) {
        const epoch = ++sessionEpoch;
        const res = await request('POST', '/auth/login', { body: payload, skipAuth: true });
        if (epoch !== sessionEpoch) throw sessionChanged();
        sessionEpoch += 1;
        if (res && res.accessToken) global.sessionStorage.setItem(TOKEN_KEY, res.accessToken);
        if (res && res.refreshToken) global.sessionStorage.setItem(REFRESH_KEY, res.refreshToken);
        return res;
      },
      async refreshToken() {
        return refreshSession();
      },
      async logout() {
        const token = global.sessionStorage.getItem(TOKEN_KEY);
        const rt = global.sessionStorage.getItem(REFRESH_KEY);
        sessionEpoch += 1;
        global.sessionStorage.removeItem(TOKEN_KEY);
        global.sessionStorage.removeItem(REFRESH_KEY);
        await request('POST', '/auth/logout', { body: rt ? { refreshToken: rt } : {}, authToken: token, skipAuth: true });
        return null;
      },
      getCurrentUser() { return request('GET', '/auth/me'); },

      /* Patients */
      listPatients(params) { return request('GET', '/patients' + buildQuery(params)); },
      createPatient(payload) { return request('POST', '/patients', { body: payload }); },
      getPatient(patientId) { return request('GET', '/patients/' + encodeURIComponent(patientId)); },
      updatePatient(patientId, payload, rowVersion) {
        return request('PATCH', '/patients/' + encodeURIComponent(patientId), { body: payload, ifMatch: rowVersion });
      },

      /* Visits */
      listPatientVisits(patientId, params) {
        return request('GET', '/patients/' + encodeURIComponent(patientId) + '/visits' + buildQuery(params));
      },
      createVisit(patientId, payload) {
        return request('POST', '/patients/' + encodeURIComponent(patientId) + '/visits', { body: payload });
      },
      getVisit(visitId) { return request('GET', '/visits/' + encodeURIComponent(visitId)); },
      getVisitForm(visitId) { return request('GET', '/visits/' + encodeURIComponent(visitId) + '/form'); },
      saveVisitDraft(visitId, payload, rowVersion) {
        return request('PUT', '/visits/' + encodeURIComponent(visitId) + '/draft', { body: payload, ifMatch: rowVersion });
      },
      getVisitReview(visitId) { return request('GET', '/visits/' + encodeURIComponent(visitId) + '/review'); },
      confirmVisit(visitId, payload, rowVersion) {
        return request('POST', '/visits/' + encodeURIComponent(visitId) + '/confirm', { body: payload, ifMatch: rowVersion });
      },
      createVisitRevision(visitId, payload, rowVersion) {
        return request('POST', '/visits/' + encodeURIComponent(visitId) + '/revisions', { body: payload, ifMatch: rowVersion });
      },
      getVisitAiInput(visitId) { return request('GET', '/visits/' + encodeURIComponent(visitId) + '/ai-input'); },

      /* Admin Users */
      listUsers(params) { return request('GET', '/admin/users' + buildQuery(params)); },
      createUser(payload) { return request('POST', '/admin/users', { body: payload }); },
      getUser(userId) { return request('GET', '/admin/users/' + encodeURIComponent(userId)); },
      updateUser(userId, payload, rowVersion) {
        return request('PATCH', '/admin/users/' + encodeURIComponent(userId), { body: payload, ifMatch: rowVersion });
      },
      previewUserPermissions(payload) { return request('POST', '/admin/users/permission-preview', { body: payload }); },

      /* Admin Forms */
      listFieldDefinitions(params) { return request('GET', '/admin/field-definitions' + buildQuery(params)); },
      listForms() { return request('GET', '/admin/forms'); },
      listFormVersions(formId, params) {
        return request('GET', '/admin/forms/' + encodeURIComponent(formId) + '/versions' + buildQuery(params));
      },
      createFormVersionDraft(formId, payload) {
        return request('POST', '/admin/forms/' + encodeURIComponent(formId) + '/versions', { body: payload });
      },
      getFormVersion(versionId) { return request('GET', '/admin/form-versions/' + encodeURIComponent(versionId)); },
      updateFormVersion(versionId, payload, rowVersion) {
        return request('PATCH', '/admin/form-versions/' + encodeURIComponent(versionId), { body: payload, ifMatch: rowVersion });
      },
      previewFormVersion(versionId) { return request('GET', '/admin/form-versions/' + encodeURIComponent(versionId) + '/preview'); },
      diffFormVersion(versionId, baseVersionId) {
        return request('GET', '/admin/form-versions/' + encodeURIComponent(versionId) + '/diff' + buildQuery({ baseVersionId: baseVersionId }));
      },
      publishFormVersion(versionId, payload, rowVersion) {
        return request('POST', '/admin/form-versions/' + encodeURIComponent(versionId) + '/publish', { body: payload, ifMatch: rowVersion });
      },
      deleteFormVersionDraft(versionId, rowVersion) {
        return request('DELETE', '/admin/form-versions/' + encodeURIComponent(versionId), { ifMatch: rowVersion });
      },

      /* Admin Audit Logs */
      listAuditLogs(params) { return request('GET', '/admin/audit-logs' + buildQuery(params)); }
    };
  }

  function createClient() {
    const cfg = getConfig();
    const adapter = cfg.mode === 'static' ? global.StaticRuntime : createHttpAdapter(cfg.apiBase);
    return {
      mode: cfg.mode,
      apiBase: cfg.apiBase,
      isStatic: cfg.mode === 'static',
      hasStoredToken: function () {
        if (cfg.mode === 'static') {
          return Boolean(global.sessionStorage.getItem('suytim_mvp_static_session_v1'));
        }
        return Boolean(global.sessionStorage.getItem(TOKEN_KEY));
      },
      resetLocalData: cfg.mode === 'static' && global.StaticRuntime ? global.StaticRuntime.resetLocalData : null,
      login: function (p) { return adapter.login(p); },
      refreshToken: function () { return adapter.refreshToken(); },
      logout: function () { return adapter.logout(); },
      getCurrentUser: function () { return adapter.getCurrentUser(); },
      listPatients: function (p) { return adapter.listPatients(p); },
      createPatient: function (p) { return adapter.createPatient(p); },
      getPatient: function (id) { return adapter.getPatient(id); },
      updatePatient: function (id, p, rv) { return adapter.updatePatient(id, p, rv); },
      listPatientVisits: function (id, p) { return adapter.listPatientVisits(id, p); },
      createVisit: function (id, p) { return adapter.createVisit(id, p); },
      getVisit: function (id) { return adapter.getVisit(id); },
      getVisitForm: function (id) { return adapter.getVisitForm(id); },
      saveVisitDraft: function (id, p, rv) { return adapter.saveVisitDraft(id, p, rv); },
      getVisitReview: function (id) { return adapter.getVisitReview(id); },
      confirmVisit: function (id, p, rv) { return adapter.confirmVisit(id, p, rv); },
      createVisitRevision: function (id, p, rv) { return adapter.createVisitRevision(id, p, rv); },
      getVisitAiInput: function (id) { return adapter.getVisitAiInput(id); },
      listUsers: function (p) { return adapter.listUsers(p); },
      createUser: function (p) { return adapter.createUser(p); },
      getUser: function (id) { return adapter.getUser(id); },
      updateUser: function (id, p, rv) { return adapter.updateUser(id, p, rv); },
      previewUserPermissions: function (p) { return adapter.previewUserPermissions(p); },
      listFieldDefinitions: function (p) { return adapter.listFieldDefinitions(p); },
      listForms: function () { return adapter.listForms(); },
      listFormVersions: function (id, p) { return adapter.listFormVersions(id, p); },
      createFormVersionDraft: function (id, p) { return adapter.createFormVersionDraft(id, p); },
      getFormVersion: function (id) { return adapter.getFormVersion(id); },
      updateFormVersion: function (id, p, rv) { return adapter.updateFormVersion(id, p, rv); },
      previewFormVersion: function (id) { return adapter.previewFormVersion(id); },
      diffFormVersion: function (id, baseId) { return adapter.diffFormVersion(id, baseId); },
      publishFormVersion: function (id, p, rv) { return adapter.publishFormVersion(id, p, rv); },
      deleteFormVersionDraft: function (id, rv) { return adapter.deleteFormVersionDraft(id, rv); },
      listAuditLogs: function (p) { return adapter.listAuditLogs(p); }
    };
  }

  global.ApiClient = createClient();
})(typeof window !== 'undefined' ? window : globalThis);
