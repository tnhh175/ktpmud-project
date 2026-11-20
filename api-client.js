'use strict';

/* ==========================================================================
   API Client Abstraction (32 OpenAPI 3.1 Operations)
   Hai adapter dùng chung một giao diện:
     - mode: 'api'    -> HTTP fetch tới /api/v1/* kèm Bearer JWT & If-Match
     - mode: 'static' -> StaticRuntime (localStorage trên trình duyệt)
   ========================================================================== */

(function (global) {
  const TOKEN_KEY = 'suytim_mvp_access_token';
  const REFRESH_KEY = 'suytim_mvp_refresh_token';

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
    async function request(method, path, options, retried) {
      const opts = options || {};
      const headers = { Accept: 'application/json, application/problem+json' };
      const token = global.sessionStorage.getItem(TOKEN_KEY);
      if (token && !opts.skipAuth) {
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
      try {
        res = await fetch(apiBase + path, { method: method, headers: headers, body: bodyStr });
      } catch (_netErr) {
        throw new HttpApiError(0, {
          status: 0,
          code: 'NETWORK_ERROR',
          title: 'Không thể kết nối máy chủ',
          detail: 'Không thể kết nối máy chủ — kiểm tra mạng và thử lại.'
        });
      }

      if (res.status === 401 && !opts.skipAuth && !retried) {
        const rt = global.sessionStorage.getItem(REFRESH_KEY);
        if (rt) {
          try {
            const refreshed = await request('POST', '/auth/refresh', { body: { refreshToken: rt }, skipAuth: true }, true);
            if (refreshed && refreshed.accessToken) {
              global.sessionStorage.setItem(TOKEN_KEY, refreshed.accessToken);
              if (refreshed.refreshToken) global.sessionStorage.setItem(REFRESH_KEY, refreshed.refreshToken);
              return request(method, path, options, true);
            }
          } catch (_refreshErr) {
            global.sessionStorage.removeItem(TOKEN_KEY);
            global.sessionStorage.removeItem(REFRESH_KEY);
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

      if (!res.ok) {
        throw new HttpApiError(res.status, data || { status: res.status, title: res.statusText, detail: 'Yêu cầu thất bại (HTTP ' + res.status + ').' });
      }
      return data;
    }

    return {
      /* Auth */
      async login(payload) {
        const res = await request('POST', '/auth/login', { body: payload, skipAuth: true });
        if (res && res.accessToken) global.sessionStorage.setItem(TOKEN_KEY, res.accessToken);
        if (res && res.refreshToken) global.sessionStorage.setItem(REFRESH_KEY, res.refreshToken);
        return res;
      },
      async refreshToken() {
        const rt = global.sessionStorage.getItem(REFRESH_KEY);
        const res = await request('POST', '/auth/refresh', { body: { refreshToken: rt }, skipAuth: true });
        if (res && res.accessToken) global.sessionStorage.setItem(TOKEN_KEY, res.accessToken);
        if (res && res.refreshToken) global.sessionStorage.setItem(REFRESH_KEY, res.refreshToken);
        return res;
      },
      async logout() {
        const rt = global.sessionStorage.getItem(REFRESH_KEY);
        try {
          await request('POST', '/auth/logout', { body: rt ? { refreshToken: rt } : {} });
        } finally {
          global.sessionStorage.removeItem(TOKEN_KEY);
          global.sessionStorage.removeItem(REFRESH_KEY);
        }
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
      listAuditLogs: function (p) { return adapter.listAuditLogs(p); }
    };
  }

  global.ApiClient = createClient();
})(typeof window !== 'undefined' ? window : globalThis);
