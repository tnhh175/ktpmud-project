'use strict';

/* ==========================================================================
   API Client Abstraction (34 OpenAPI 3.1 Operations)
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
      this.quality = (problem && problem.quality) || null;
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
      if (opts.idempotencyKey) {
        headers['Idempotency-Key'] = String(opts.idempotencyKey);
      }
      let bodyStr;
      if (opts.body !== undefined) {
        headers['Content-Type'] = 'application/json';
        bodyStr = JSON.stringify(opts.body);
      }

      let res;
      const controller = typeof global.AbortController === 'function' ? new global.AbortController() : null;
      let timedOut = false;
      const timeoutMs = opts.timeoutMs || REQUEST_TIMEOUT_MS;
      const timeoutId = controller ? global.setTimeout(function () {
        timedOut = true;
        controller.abort();
      }, timeoutMs) : null;
      try {
        const fetchOpts = { method: method, headers: headers, body: bodyStr, signal: controller ? controller.signal : undefined };
        if (opts.keepalive) fetchOpts.keepalive = true;
        res = await fetch(apiBase + path, fetchOpts);
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

      if (res.status === 204) {
        if (typeof res.text === 'function') {
          try { await res.text(); } catch (_e) {}
        }
        return null;
      }

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
        await request('POST', '/auth/logout', { body: rt ? { refreshToken: rt } : {}, authToken: token, skipAuth: true, keepalive: true });
        return null;
      },
      getCurrentUser() { return request('GET', '/auth/me'); },
      changePassword(payload) { return request('POST', '/auth/change-password', { body: payload }); },
      createPasswordResetRequest(payload) {
        return request('POST', '/auth/password-reset-requests', { body: payload, skipAuth: true });
      },

      /* Patients */
      listPatients(params) { return request('GET', '/patients' + buildQuery(params)); },
      createPatient(payload) { return request('POST', '/patients', { body: payload }); },
      getPatient(patientId) { return request('GET', '/patients/' + encodeURIComponent(patientId)); },
      updatePatient(patientId, payload, rowVersion) {
        return request('PATCH', '/patients/' + encodeURIComponent(patientId), { body: payload, ifMatch: rowVersion });
      },
      listPatientRecordRequests(patientId) {
        return request('GET', '/patients/' + encodeURIComponent(patientId) + '/record-requests');
      },
      createPatientRecordRequest(patientId, payload) {
        return request('POST', '/patients/' + encodeURIComponent(patientId) + '/record-requests', { body: payload });
      },
      cancelPatientRecordRequest(patientId, requestId) {
        return request('POST', '/patients/' + encodeURIComponent(patientId) + '/record-requests/' + encodeURIComponent(requestId) + '/cancel', { body: {} });
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
      submitVisit(visitId, payload, rowVersion) {
        return request('POST', '/visits/' + encodeURIComponent(visitId) + '/submit', { body: payload || {}, ifMatch: rowVersion });
      },
      withdrawVisit(visitId, payload, rowVersion) {
        return request('POST', '/visits/' + encodeURIComponent(visitId) + '/withdraw', { body: payload || {}, ifMatch: rowVersion });
      },
      listVisitQueue(params) {
        return request('GET', '/visit-queue' + buildQuery(params));
      },
      claimVisit(visitId, payload) {
        return request('POST', '/visits/' + encodeURIComponent(visitId) + '/claim', { body: payload || {} });
      },
      listMyVisits(params) {
        return request('GET', '/my-visits' + buildQuery(params));
      },
      listNurseVisits(params) {
        return request('GET', '/nurse/visits' + buildQuery(params));
      },
      getVisitAiInput(visitId) { return request('GET', '/visits/' + encodeURIComponent(visitId) + '/ai-input'); },
      getVisitAiInputV1(visitId, params) {
        return request('GET', '/visits/' + encodeURIComponent(visitId) + '/ai-input/hf/1.0' + buildQuery(params));
      },

      /* Workflow 4-Module (hf-workflow/1.0) */
      getVisitWorkflow(visitId, params) {
        return request('GET', '/visits/' + encodeURIComponent(visitId) + '/workflow' + buildQuery(params), { timeoutMs: 10000 });
      },
      getWorkflowFields(visitId, moduleCode) {
        return request('GET', '/visits/' + encodeURIComponent(visitId) + '/workflow/' + encodeURIComponent(moduleCode || 'm1') + '/fields', { timeoutMs: 10000 });
      },
      getWorkflowRun(visitId, moduleCode, runId) {
        return request('GET', '/visits/' + encodeURIComponent(visitId) + '/workflow/' + encodeURIComponent(moduleCode) + '/runs/' + encodeURIComponent(runId), { timeoutMs: 10000 });
      },
      listWorkflowRuns(visitId, moduleCode) {
        return request('GET', '/visits/' + encodeURIComponent(visitId) + '/workflow/' + encodeURIComponent(moduleCode) + '/runs', { timeoutMs: 10000 });
      },
      getWorkflowDecision(visitId, moduleCode, decisionId) {
        return request('GET', '/visits/' + encodeURIComponent(visitId) + '/workflow/' + encodeURIComponent(moduleCode) + '/decisions/' + encodeURIComponent(decisionId), { timeoutMs: 10000 });
      },
      saveWorkflowFields(visitId, moduleCode, payload, rowVersion) {
        const rv = rowVersion !== undefined && rowVersion !== null ? rowVersion : (payload && payload.rowVersion);
        return request('PUT', '/visits/' + encodeURIComponent(visitId) + '/workflow/' + encodeURIComponent(moduleCode) + '/fields', {
          body: payload,
          ifMatch: rv,
          timeoutMs: 10000
        });
      },
      runWorkflowModule(visitId, moduleCode, payload, rowVersion, idempotencyKey) {
        const rv = rowVersion !== undefined && rowVersion !== null ? rowVersion : (payload && payload.rowVersion);
        return request('POST', '/visits/' + encodeURIComponent(visitId) + '/workflow/' + encodeURIComponent(moduleCode) + '/runs', {
          body: payload,
          ifMatch: rv,
          idempotencyKey: idempotencyKey,
          timeoutMs: 35000
        });
      },
      submitWorkflowDecision(visitId, moduleCode, payload, rowVersion, idempotencyKey) {
        const rv = rowVersion !== undefined && rowVersion !== null ? rowVersion : (payload && payload.rowVersion);
        return request('POST', '/visits/' + encodeURIComponent(visitId) + '/workflow/' + encodeURIComponent(moduleCode) + '/decision', {
          body: payload,
          ifMatch: rv,
          idempotencyKey: idempotencyKey,
          timeoutMs: 10000
        });
      },
      submitM4Confirmations(visitId, payload, rowVersion, idempotencyKey) {
        const rv = rowVersion !== undefined && rowVersion !== null ? rowVersion : (payload && payload.rowVersion);
        return request('POST', '/visits/' + encodeURIComponent(visitId) + '/workflow/m4/confirmations', {
          body: payload,
          ifMatch: rv,
          idempotencyKey: idempotencyKey,
          timeoutMs: 10000
        });
      },
      finishWorkflow(visitId, payload, rowVersion, idempotencyKey) {
        const rv = rowVersion !== undefined && rowVersion !== null ? rowVersion : (payload && payload.rowVersion);
        return request('POST', '/visits/' + encodeURIComponent(visitId) + '/workflow/finish', {
          body: payload,
          ifMatch: rv,
          idempotencyKey: idempotencyKey,
          timeoutMs: 10000
        });
      },

      /* Admin Users */
      listUsers(params) { return request('GET', '/admin/users' + buildQuery(params)); },
      createUser(payload) { return request('POST', '/admin/users', { body: payload }); },
      getUser(userId) { return request('GET', '/admin/users/' + encodeURIComponent(userId)); },
      updateUser(userId, payload, rowVersion) {
        return request('PATCH', '/admin/users/' + encodeURIComponent(userId), { body: payload, ifMatch: rowVersion });
      },
      previewUserPermissions(payload) { return request('POST', '/admin/users/permission-preview', { body: payload }); },
      listPasswordResetRequests(params) { return request('GET', '/admin/password-reset-requests' + buildQuery(params)); },
      resolvePasswordResetRequest(requestId, payload) {
        return request('POST', '/admin/password-reset-requests/' + encodeURIComponent(requestId) + '/resolve', { body: payload || {} });
      },
      rejectPasswordResetRequest(requestId, payload) {
        return request('POST', '/admin/password-reset-requests/' + encodeURIComponent(requestId) + '/reject', { body: payload });
      },

      /* Admin Patients (UI-18, administrative metadata only) */
      adminListPatients(params) { return request('GET', '/admin/patients' + buildQuery(params)); },
      adminUpdatePatientRecordStatus(patientId, payload, rowVersion) {
        return request('PATCH', '/admin/patients/' + encodeURIComponent(patientId) + '/record-status', { body: payload, ifMatch: rowVersion });
      },
      adminListPatientRecordRequests(params) { return request('GET', '/admin/patients/record-requests' + buildQuery(params)); },
      adminApprovePatientRecordRequest(requestId, payload) {
        return request('POST', '/admin/patients/record-requests/' + encodeURIComponent(requestId) + '/approve', { body: payload || {} });
      },
      adminRejectPatientRecordRequest(requestId, payload) {
        return request('POST', '/admin/patients/record-requests/' + encodeURIComponent(requestId) + '/reject', { body: payload });
      },

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
      previewFormVersionDraft(versionId, payload) {
        return request('POST', '/admin/form-versions/' + encodeURIComponent(versionId) + '/preview', { body: payload });
      },
      diffFormVersion(versionId, baseVersionId) {
        return request('GET', '/admin/form-versions/' + encodeURIComponent(versionId) + '/diff' + buildQuery({ baseVersionId: baseVersionId }));
      },
      publishFormVersion(versionId, payload, rowVersion) {
        return request('POST', '/admin/form-versions/' + encodeURIComponent(versionId) + '/publish', { body: payload, ifMatch: rowVersion });
      },
      deleteFormVersionDraft(versionId, rowVersion) {
        return request('DELETE', '/admin/form-versions/' + encodeURIComponent(versionId), { ifMatch: rowVersion });
      },

      /* Admin Care Assignments (Simplified Demo Scope, K8 compliant) */
      adminListCareDoctors() { return request('GET', '/admin/care/doctors'); },
      adminListCarePatients(params) { return request('GET', '/admin/care/patients' + buildQuery(params)); },
      adminListPatientCareAssignments(patientId) {
        return request('GET', '/admin/patients/' + encodeURIComponent(patientId) + '/care-assignments');
      },
      adminAddPatientCareAssignment(patientId, payload) {
        return request('POST', '/admin/patients/' + encodeURIComponent(patientId) + '/care-assignments', { body: payload });
      },
      adminReplacePatientCareAssignments(patientId, payload) {
        return request('PUT', '/admin/patients/' + encodeURIComponent(patientId) + '/care-assignments', { body: payload });
      },
      adminRevokePatientCareAssignment(patientId, assignmentId) {
        return request('DELETE', '/admin/patients/' + encodeURIComponent(patientId) + '/care-assignments/' + encodeURIComponent(assignmentId));
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
      changePassword: function (p) { return adapter.changePassword(p); },
      createPasswordResetRequest: function (p) { return adapter.createPasswordResetRequest(p); },
      listPatients: function (p) { return adapter.listPatients(p); },
      createPatient: function (p) { return adapter.createPatient(p); },
      getPatient: function (id) { return adapter.getPatient(id); },
      updatePatient: function (id, p, rv) { return adapter.updatePatient(id, p, rv); },
      listPatientRecordRequests: function (id) { return adapter.listPatientRecordRequests(id); },
      createPatientRecordRequest: function (id, p) { return adapter.createPatientRecordRequest(id, p); },
      cancelPatientRecordRequest: function (id, rid) { return adapter.cancelPatientRecordRequest(id, rid); },
      listPatientVisits: function (id, p) { return adapter.listPatientVisits(id, p); },
      createVisit: function (id, p) { return adapter.createVisit(id, p); },
      getVisit: function (id) { return adapter.getVisit(id); },
      getVisitForm: function (id) { return adapter.getVisitForm(id); },
      saveVisitDraft: function (id, p, rv) { return adapter.saveVisitDraft(id, p, rv); },
      getVisitReview: function (id) { return adapter.getVisitReview(id); },
      confirmVisit: function (id, p, rv) { return adapter.confirmVisit(id, p, rv); },
      createVisitRevision: function (id, p, rv) { return adapter.createVisitRevision(id, p, rv); },
      submitVisit: function (id, p, rv) {
        if (typeof adapter.submitVisit !== 'function') return Promise.reject(new HttpApiError(501, { code: 'V2_STATIC_UNSUPPORTED', detail: 'Tính năng gửi hàng chờ yêu cầu kết nối máy chủ API.' }));
        return adapter.submitVisit(id, p, rv);
      },
      withdrawVisit: function (id, p, rv) {
        if (typeof adapter.withdrawVisit !== 'function') return Promise.reject(new HttpApiError(501, { code: 'V2_STATIC_UNSUPPORTED', detail: 'Tính năng rút lượt khám yêu cầu kết nối máy chủ API.' }));
        return adapter.withdrawVisit(id, p, rv);
      },
      listVisitQueue: function (p) {
        if (typeof adapter.listVisitQueue !== 'function') return Promise.reject(new HttpApiError(501, { code: 'V2_STATIC_UNSUPPORTED', detail: 'Hàng chờ lượt khám yêu cầu kết nối máy chủ API.' }));
        return adapter.listVisitQueue(p);
      },
      claimVisit: function (id, p) {
        if (typeof adapter.claimVisit !== 'function') return Promise.reject(new HttpApiError(501, { code: 'V2_STATIC_UNSUPPORTED', detail: 'Nhận lượt khám yêu cầu kết nối máy chủ API.' }));
        return adapter.claimVisit(id, p);
      },
      listMyVisits: function (p) {
        if (typeof adapter.listMyVisits !== 'function') return Promise.reject(new HttpApiError(501, { code: 'V2_STATIC_UNSUPPORTED', detail: 'Lượt khám của tôi yêu cầu kết nối máy chủ API.' }));
        return adapter.listMyVisits(p);
      },
      listNurseVisits: function (p) {
        if (typeof adapter.listNurseVisits !== 'function') return Promise.reject(new HttpApiError(501, { code: 'V2_STATIC_UNSUPPORTED', detail: 'Danh sách lượt đã gửi yêu cầu kết nối máy chủ API.' }));
        return adapter.listNurseVisits(p);
      },
      getVisitAiInput: function (id) { return adapter.getVisitAiInput(id); },
      getVisitAiInputV1: function (id, params) { return adapter.getVisitAiInputV1(id, params); },
      getVisitWorkflow: function (id, params) {
        if (typeof adapter.getVisitWorkflow !== 'function') return Promise.reject(new HttpApiError(501, { code: 'WORKFLOW_STATIC_UNSUPPORTED', detail: 'Luồng 4 Module AI yêu cầu kết nối máy chủ API.' }));
        return adapter.getVisitWorkflow(id, params);
      },
      getWorkflowFields: function (id, mod) {
        if (typeof adapter.getWorkflowFields !== 'function') return Promise.reject(new HttpApiError(501, { code: 'WORKFLOW_STATIC_UNSUPPORTED', detail: 'Luồng 4 Module AI yêu cầu kết nối máy chủ API.' }));
        return adapter.getWorkflowFields(id, mod);
      },
      getWorkflowRun: function (id, mod, runId) {
        if (typeof adapter.getWorkflowRun !== 'function') return Promise.reject(new HttpApiError(501, { code: 'WORKFLOW_STATIC_UNSUPPORTED', detail: 'Luồng 4 Module AI yêu cầu kết nối máy chủ API.' }));
        return adapter.getWorkflowRun(id, mod, runId);
      },
      listWorkflowRuns: function (id, mod) {
        if (typeof adapter.listWorkflowRuns !== 'function') return Promise.reject(new HttpApiError(501, { code: 'WORKFLOW_STATIC_UNSUPPORTED', detail: 'Luồng 4 Module AI yêu cầu kết nối máy chủ API.' }));
        return adapter.listWorkflowRuns(id, mod);
      },
      getWorkflowDecision: function (id, mod, decId) {
        if (typeof adapter.getWorkflowDecision !== 'function') return Promise.reject(new HttpApiError(501, { code: 'WORKFLOW_STATIC_UNSUPPORTED', detail: 'Luồng 4 Module AI yêu cầu kết nối máy chủ API.' }));
        return adapter.getWorkflowDecision(id, mod, decId);
      },
      saveWorkflowFields: function (id, mod, p, rv) {
        if (typeof adapter.saveWorkflowFields !== 'function') return Promise.reject(new HttpApiError(501, { code: 'WORKFLOW_STATIC_UNSUPPORTED', detail: 'Luồng 4 Module AI yêu cầu kết nối máy chủ API.' }));
        return adapter.saveWorkflowFields(id, mod, p, rv);
      },
      runWorkflowModule: function (id, mod, p, rv, idk) {
        if (typeof adapter.runWorkflowModule !== 'function') return Promise.reject(new HttpApiError(501, { code: 'WORKFLOW_STATIC_UNSUPPORTED', detail: 'Luồng 4 Module AI yêu cầu kết nối máy chủ API.' }));
        return adapter.runWorkflowModule(id, mod, p, rv, idk);
      },
      submitWorkflowDecision: function (id, mod, p, rv, idk) {
        if (typeof adapter.submitWorkflowDecision !== 'function') return Promise.reject(new HttpApiError(501, { code: 'WORKFLOW_STATIC_UNSUPPORTED', detail: 'Luồng 4 Module AI yêu cầu kết nối máy chủ API.' }));
        return adapter.submitWorkflowDecision(id, mod, p, rv, idk);
      },
      submitM4Confirmations: function (id, p, rv, idk) {
        if (typeof adapter.submitM4Confirmations !== 'function') return Promise.reject(new HttpApiError(501, { code: 'WORKFLOW_STATIC_UNSUPPORTED', detail: 'Luồng 4 Module AI yêu cầu kết nối máy chủ API.' }));
        return adapter.submitM4Confirmations(id, p, rv, idk);
      },
      finishWorkflow: function (id, p, rv, idk) {
        if (typeof adapter.finishWorkflow !== 'function') return Promise.reject(new HttpApiError(501, { code: 'WORKFLOW_STATIC_UNSUPPORTED', detail: 'Luồng 4 Module AI yêu cầu kết nối máy chủ API.' }));
        return adapter.finishWorkflow(id, p, rv, idk);
      },
      listUsers: function (p) { return adapter.listUsers(p); },
      createUser: function (p) { return adapter.createUser(p); },
      getUser: function (id) { return adapter.getUser(id); },
      updateUser: function (id, p, rv) { return adapter.updateUser(id, p, rv); },
      previewUserPermissions: function (p) { return adapter.previewUserPermissions(p); },
      listPasswordResetRequests: function (p) { return adapter.listPasswordResetRequests(p); },
      resolvePasswordResetRequest: function (id, p) { return adapter.resolvePasswordResetRequest(id, p); },
      rejectPasswordResetRequest: function (id, p) { return adapter.rejectPasswordResetRequest(id, p); },
      adminListPatients: function (p) { return adapter.adminListPatients(p); },
      adminUpdatePatientRecordStatus: function (id, p, rv) { return adapter.adminUpdatePatientRecordStatus(id, p, rv); },
      adminListPatientRecordRequests: function (p) { return adapter.adminListPatientRecordRequests(p); },
      adminApprovePatientRecordRequest: function (id, p) { return adapter.adminApprovePatientRecordRequest(id, p); },
      adminRejectPatientRecordRequest: function (id, p) { return adapter.adminRejectPatientRecordRequest(id, p); },
      listFieldDefinitions: function (p) { return adapter.listFieldDefinitions(p); },
      listForms: function () { return adapter.listForms(); },
      listFormVersions: function (id, p) { return adapter.listFormVersions(id, p); },
      createFormVersionDraft: function (id, p) { return adapter.createFormVersionDraft(id, p); },
      getFormVersion: function (id) { return adapter.getFormVersion(id); },
      updateFormVersion: function (id, p, rv) { return adapter.updateFormVersion(id, p, rv); },
      previewFormVersion: function (id) { return adapter.previewFormVersion(id); },
      previewFormVersionDraft: function (id, p) { return adapter.previewFormVersionDraft(id, p); },
      diffFormVersion: function (id, baseId) { return adapter.diffFormVersion(id, baseId); },
      publishFormVersion: function (id, p, rv) { return adapter.publishFormVersion(id, p, rv); },
      deleteFormVersionDraft: function (id, rv) { return adapter.deleteFormVersionDraft(id, rv); },
      adminListCareDoctors: function () { return adapter.adminListCareDoctors(); },
      adminListCarePatients: function (p) { return adapter.adminListCarePatients(p); },
      adminListPatientCareAssignments: function (id) { return adapter.adminListPatientCareAssignments(id); },
      adminAddPatientCareAssignment: function (id, p) { return adapter.adminAddPatientCareAssignment(id, p); },
      adminReplacePatientCareAssignments: function (id, p) { return adapter.adminReplacePatientCareAssignments(id, p); },
      adminRevokePatientCareAssignment: function (id, aid) { return adapter.adminRevokePatientCareAssignment(id, aid); },
      listAuditLogs: function (p) { return adapter.listAuditLogs(p); }
    };
  }

  global.ApiClient = createClient();
})(typeof window !== 'undefined' ? window : globalThis);
