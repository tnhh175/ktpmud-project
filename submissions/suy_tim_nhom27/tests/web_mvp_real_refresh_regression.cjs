'use strict';
// Real PostgreSQL + FastAPI + web-mvp/api-client.js. Run with MVP_TEST_PYTHON and MVP_TEST_PG_PORT.
const assert = require('node:assert/strict');
const { execFileSync, spawn } = require('node:child_process');
const { randomBytes } = require('node:crypto');
const fs = require('node:fs');
const net = require('node:net');
const path = require('node:path');
const vm = require('node:vm');

const appRoot = path.resolve(__dirname, '..');
const python = process.env.MVP_TEST_PYTHON || 'python';
const pgPort = Number(process.env.MVP_TEST_PG_PORT || 55432);
const pgHost = process.env.MVP_TEST_PG_HOST || '127.0.0.1';
const dbName = 'suytim_refresh_' + randomBytes(6).toString('hex');
const dbUrl = `postgresql://postgres@${pgHost}:${pgPort}/${dbName}`;
const adminUrl = `postgresql://postgres@${pgHost}:${pgPort}/postgres`;
const accessKey = 'suytim_mvp_access_token';
const refreshKey = 'suytim_mvp_refresh_token';
const credentials = { username: 'admin_demo', password: 'Admin@2026!' };

const dbScript = `
import psycopg, sys
dsn, name, mode = sys.argv[1:]
with psycopg.connect(dsn, autocommit=True) as conn:
    if mode == 'create':
        conn.execute('CREATE DATABASE "' + name + '" TEMPLATE "suytim_tpl"')
    else:
        conn.execute('SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = %s AND pid <> pg_backend_pid()', (name,))
        conn.execute('DROP DATABASE IF EXISTS "' + name + '"')
`;
const serverScript = `
import os, uvicorn
from src.mvp.app import create_app
app = create_app(database_url=os.environ['DATABASE_URL'], auth_secret='real-refresh-regression-only', mount_web=False)
uvicorn.run(app, host='127.0.0.1', port=int(os.environ['MVP_PORT']), log_level='error', access_log=False)
`;

function defer() {
  let resolve;
  const promise = new Promise(r => { resolve = r; });
  return { promise, resolve };
}

function bounded(promise, label) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(`Timed out: ${label}`)), 8000);
    Promise.resolve(promise).then(
      value => { clearTimeout(timeout); resolve(value); },
      error => { clearTimeout(timeout); reject(error); }
    );
  });
}

function pythonDb(mode) {
  execFileSync(python, ['-c', dbScript, adminUrl, dbName, mode], { cwd: appRoot, stdio: 'pipe' });
}

async function freePort() {
  const server = net.createServer();
  await new Promise((resolve, reject) => server.once('error', reject).listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  await new Promise(resolve => server.close(resolve));
  return port;
}

async function ready(base, child) {
  for (let i = 0; i < 100; i++) {
    if (child.exitCode !== null) throw new Error('FastAPI exited before health check');
    try {
      const res = await fetch(base + '/health');
      if (res.ok) return;
    } catch (_) { /* startup only */ }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error('FastAPI health check timed out');
}

function createClient(base) {
  const values = new Map();
  const storage = {
    getItem: key => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: key => values.delete(key)
  };
  const hooks = { before: null, after: null, refreshCalls: 0 };
  const proxyFetch = async (url, options) => {
    const pathname = new URL(url).pathname;
    if (pathname.endsWith('/auth/refresh')) hooks.refreshCalls++;
    if (hooks.before) await hooks.before(pathname, options);
    const response = await fetch(url, options);
    if (hooks.after) await hooks.after(pathname, options, response);
    return response;
  };
  const window = {
    APP_CONFIG: { mode: 'api', apiBase: base + '/api/v1' },
    sessionStorage: storage,
    AbortController, setTimeout, clearTimeout, URLSearchParams
  };
  vm.runInNewContext(fs.readFileSync(path.join(appRoot, 'web-mvp', 'api-client.js'), 'utf8'), {
    window, fetch: proxyFetch, AbortController, URLSearchParams, setTimeout, clearTimeout
  }, { filename: 'api-client.js' });
  return { client: window.ApiClient, storage, hooks };
}

async function run(base) {
  const { client, storage, hooks } = createClient(base);
  const login = await client.login(credentials);
  assert.equal(login.user.username, 'admin_demo');
  const oldRefresh = storage.getItem(refreshKey);
  storage.setItem(accessKey, 'invalid-access-for-rotation-test');

  // Hold both genuine backend 401 responses. Both callers must share one rotation.
  const both401 = defer();
  const release401 = defer();
  let held401 = 0;
  hooks.after = async (pathname, _options, response) => {
    if (pathname.endsWith('/auth/me') && response.status === 401) {
      held401++;
      if (held401 === 2) both401.resolve();
      await release401.promise;
    }
  };
  const first = client.getCurrentUser();
  const second = client.getCurrentUser();
  await bounded(both401.promise, 'two backend 401 responses');
  release401.resolve();
  const users = await bounded(Promise.all([first, second]), 'shared refresh and replay');
  hooks.after = null;
  assert.deepEqual(users.map(user => user.username), ['admin_demo', 'admin_demo']);
  assert.equal(hooks.refreshCalls, 1, 'one backend refresh for concurrent 401 responses');
  assert.notEqual(storage.getItem(refreshKey), oldRefresh, 'refresh token rotates');
  assert.notEqual(storage.getItem(accessKey), 'invalid-access-for-rotation-test');
  const reused = await fetch(base + '/api/v1/auth/refresh', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: oldRefresh })
  });
  assert.equal(reused.status, 401, 'backend rejects the consumed refresh token');

  // A network failure while rotating must preserve the current pair for retry.
  const retryRefresh = storage.getItem(refreshKey);
  storage.setItem(accessKey, 'invalid-access-for-network-test');
  hooks.before = async pathname => {
    if (pathname.endsWith('/auth/refresh')) throw new Error('synthetic network outage');
  };
  await assert.rejects(client.getCurrentUser(), error => error.status === 0 && error.code === 'NETWORK_ERROR');
  assert.equal(storage.getItem(refreshKey), retryRefresh);
  assert.equal(storage.getItem(accessKey), 'invalid-access-for-network-test');
  hooks.before = null;

  // A genuine invalid refresh response clears only the session that attempted it.
  storage.setItem(refreshKey, 'invalid-refresh-for-401-test');
  await assert.rejects(client.getCurrentUser(), error => error.status === 401);
  assert.equal(storage.getItem(refreshKey), null);
  assert.equal(storage.getItem(accessKey), null);

  // Logout during a delayed login cannot restore its response into storage.
  await client.login(credentials);
  const loginSeen = defer();
  const releaseLogin = defer();
  hooks.after = async (pathname, _options, response) => {
    if (pathname.endsWith('/auth/login') && response.ok) {
      loginSeen.resolve();
      await releaseLogin.promise;
    }
  };
  const lateLogin = client.login(credentials);
  await bounded(loginSeen.promise, 'delayed login response');
  await client.logout();
  releaseLogin.resolve();
  await assert.rejects(lateLogin, error => error.code === 'SESSION_CHANGED');
  assert.equal(storage.getItem(accessKey), null);
  assert.equal(storage.getItem(refreshKey), null);
  hooks.after = null;

  // A delayed logout completion cannot erase a newer login.
  await client.login(credentials);
  const logoutSeen = defer();
  const releaseLogout = defer();
  hooks.after = async (pathname, _options, response) => {
    if (pathname.endsWith('/auth/logout') && response.status === 204) {
      logoutSeen.resolve();
      await releaseLogout.promise;
    }
  };
  const lateLogout = client.logout();
  await bounded(logoutSeen.promise, 'delayed logout response');
  const newer = await client.login(credentials);
  releaseLogout.resolve();
  await bounded(lateLogout, 'late logout completion');
  assert.equal(storage.getItem(accessKey), newer.accessToken);
  assert.equal(storage.getItem(refreshKey), newer.refreshToken);
  assert.equal((await client.getCurrentUser()).username, 'admin_demo');
  hooks.after = null;

  // An old request's 401 after a new login must not rotate or clear the new pair.
  storage.setItem(accessKey, 'invalid-access-for-late-401');
  const staleSeen = defer();
  const releaseStale = defer();
  hooks.after = async (pathname, _options, response) => {
    if (pathname.endsWith('/auth/me') && response.status === 401) {
      staleSeen.resolve();
      await releaseStale.promise;
    }
  };
  const staleRequest = client.getCurrentUser();
  await bounded(staleSeen.promise, 'old request 401');
  const newest = await client.login(credentials);
  const refreshCount = hooks.refreshCalls;
  releaseStale.resolve();
  await assert.rejects(staleRequest, error => error.code === 'SESSION_CHANGED');
  assert.equal(hooks.refreshCalls, refreshCount);
  assert.equal(storage.getItem(accessKey), newest.accessToken);
  assert.equal(storage.getItem(refreshKey), newest.refreshToken);
  hooks.after = null;
  await client.logout();
  console.log('PASS real backend refresh rotation, concurrent 401, network/401 failure, late login/logout/401');
}

(async () => {
  let child;
  let created = false;
  try {
    pythonDb('create');
    created = true;
    const port = await freePort();
    const base = `http://127.0.0.1:${port}`;
    child = spawn(python, ['-c', serverScript], {
      cwd: appRoot,
      env: { ...process.env, DATABASE_URL: dbUrl, MVP_PORT: String(port) },
      stdio: 'ignore', windowsHide: true
    });
    await ready(base, child);
    await run(base);
  } finally {
    if (child && child.exitCode === null) {
      await new Promise(resolve => { child.once('exit', resolve); child.kill(); });
    }
    if (created) pythonDb('drop');
  }
})().catch(error => {
  console.error(error.stack || String(error));
  process.exitCode = 1;
});
