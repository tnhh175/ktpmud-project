'use strict';
// Deterministic HTTP adapter tests. Network replies and aborts are released by barriers.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.resolve(process.env.WEB_MVP_ROOT || path.join(__dirname,'../web-mvp'),'api-client.js'),'utf8');
const TOKEN = 'suytim_mvp_access_token';
const REFRESH = 'suytim_mvp_refresh_token';
const deferred = () => {let resolve,reject; const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return {promise,resolve,reject};};
const response = (status,body={}) => ({status,ok:status>=200&&status<300,statusText:'',headers:{get:()=> 'application/json'},json:async()=>body});
function storage(initial={}) {const values=new Map(Object.entries(initial));return {getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,String(v)),removeItem:k=>values.delete(k)};}
function harness(fetchImpl,options={}) {
  const sessionStorage=storage({[TOKEN]:'old-access',[REFRESH]:'old-refresh'});
  const timers=new Map();let nextTimer=1;
  const ctx={sessionStorage,APP_CONFIG:{mode:'api',apiBase:'/api/v1'},URLSearchParams,AbortController,
    setTimeout:(fn)=>{const id=nextTimer++;timers.set(id,fn);return id;},
    clearTimeout:id=>timers.delete(id),fetch:fetchImpl};
  vm.runInNewContext(source,ctx);
  return {api:ctx.ApiClient,storage:sessionStorage,timers,fireLatestTimeout:()=>{const [id,fn]=Array.from(timers).at(-1)||[];assert(fn,'pending timer');timers.delete(id);fn();}};
}
async function check(name,fn) {
  await fn();console.log('PASS '+name);
}
async function concurrent401() {
  const refreshEntered=deferred();const refreshGate=deferred();
  let refreshCalls=0,expiredCalls=0,freshCalls=0;
  const h=harness(async (url,opts)=>{
    if(url.endsWith('/auth/refresh')) {refreshCalls++;refreshEntered.resolve();return refreshGate.promise;}
    if(opts.headers.Authorization==='Bearer old-access') {expiredCalls++;return response(401,{code:'AUTH_TOKEN_EXPIRED'});}
    assert.equal(opts.headers.Authorization,'Bearer new-access');freshCalls++;return response(200,{id:url});
  });
  const p1=h.api.getVisit('a');const p2=h.api.getVisitForm('a');
  await refreshEntered.promise;
  assert.equal(expiredCalls,2);
  assert.equal(refreshCalls,1,'single-flight refresh before release');
  refreshGate.resolve(response(200,{accessToken:'new-access',refreshToken:'new-refresh'}));
  const results=await Promise.all([p1,p2]);
  assert.equal(results.length,2);assert.equal(freshCalls,2);
  assert.equal(h.storage.getItem(TOKEN),'new-access');
  assert.equal(h.storage.getItem(REFRESH),'new-refresh');
}
async function late401() {
  const oldLate=deferred();const firstRefresh=deferred();
  let refreshCalls=0;
  const h=harness(async (url,opts)=>{
    if(url.endsWith('/auth/refresh')) {refreshCalls++;firstRefresh.resolve();return response(200,{accessToken:'new-access',refreshToken:'new-refresh'});}
    if(opts.headers.Authorization==='Bearer old-access') {
      if(url.endsWith('/visits/late')) return oldLate.promise;
      return response(401);
    }
    return response(200,{id:url});
  });
  const late=h.api.getVisit('late');const first=h.api.getVisit('first');
  await firstRefresh.promise;await first;
  oldLate.resolve(response(401));await late;
  assert.equal(refreshCalls,1,'late 401 must reuse rotated access token');
  assert.equal(h.storage.getItem(TOKEN),'new-access');
}
async function retry401StopsAndClears() {
  let resourceCalls=0,refreshCalls=0;
  const h=harness(async (url,opts)=>{
    if(url.endsWith('/auth/refresh')) {refreshCalls++;return response(200,{accessToken:'new-access',refreshToken:'new-refresh'});}
    resourceCalls++;
    assert.equal(opts.headers.Authorization,resourceCalls===1?'Bearer old-access':'Bearer new-access');
    return response(401,{code:'AUTH_TOKEN_EXPIRED'});
  });
  const result=await Promise.allSettled([h.api.getVisit('a')]);
  assert.equal(result[0].status,'rejected');assert.equal(result[0].reason.status,401);
  assert.equal(resourceCalls,2,'one original request and one retry');
  assert.equal(refreshCalls,1,'retry must not start a second refresh');
  assert.equal(h.storage.getItem(TOKEN),null);
  assert.equal(h.storage.getItem(REFRESH),null);
}
async function refreshRejected(status,expectedCode,clear) {
  let calls=0;
  const h=harness(async (url,opts)=>{
    if(url.endsWith('/auth/refresh')) {calls++;if(status==='network') throw new Error('offline');return response(status,{code:expectedCode});}
    return response(401,{code:'AUTH_TOKEN_EXPIRED'});
  });
  const results=await Promise.allSettled([h.api.getVisit('a'),h.api.getVisitForm('a')]);
  assert.equal(calls,1);
  assert(results.every(x=>x.status==='rejected'));
  assert(results.every(x=>x.reason.code===expectedCode),JSON.stringify(results.map(x=>x.reason.code)));
  assert.equal(h.storage.getItem(TOKEN),clear?null:'old-access');
  assert.equal(h.storage.getItem(REFRESH),clear?null:'old-refresh');
}
async function refreshTimeout() {
  const entered=deferred();let calls=0;
  const h=harness(async (url,opts)=>{
    if(url.endsWith('/auth/refresh')) {
      calls++;entered.resolve();
      return new Promise((resolve,reject)=>opts.signal.addEventListener('abort',()=>reject(Object.assign(new Error('aborted'),{name:'AbortError'})),{once:true}));
    }
    return response(401,{code:'AUTH_TOKEN_EXPIRED'});
  });
  const pending=h.api.getVisit('a');
  await entered.promise;h.fireLatestTimeout();
  const result=await Promise.allSettled([pending]);
  assert.equal(calls,1);assert.equal(result[0].status,'rejected');assert.equal(result[0].reason.code,'REQUEST_TIMEOUT');
  assert.equal(h.storage.getItem(REFRESH),'old-refresh');
}
async function staleRefreshAfterNewLogin() {
  const entered=deferred();const release=deferred();let refreshCalls=0;
  const h=harness(async (url,opts)=>{
    if(url.endsWith('/auth/refresh')) {refreshCalls++;entered.resolve();return release.promise;}
    if(url.endsWith('/auth/logout')) return response(204);
    if(url.endsWith('/auth/login')) return response(200,{accessToken:'next-access',refreshToken:'next-refresh'});
    return response(401,{code:'AUTH_TOKEN_EXPIRED'});
  });
  const old=h.api.getVisit('old');await entered.promise;
  await h.api.logout();await h.api.login({username:'next',password:'x'});
  release.resolve(response(200,{accessToken:'stale-access',refreshToken:'stale-refresh'}));
  const result=await Promise.allSettled([old]);
  assert.equal(result[0].status,'rejected');assert.equal(result[0].reason.code,'SESSION_CHANGED');
  assert.equal(refreshCalls,1);assert.equal(h.storage.getItem(TOKEN),'next-access');assert.equal(h.storage.getItem(REFRESH),'next-refresh');
}
async function stale401AfterNewLogin() {
  const oldReply=deferred();const started=deferred();let refreshCalls=0;
  const h=harness(async (url,opts)=>{
    if(url.endsWith('/auth/refresh')) {refreshCalls++;return response(200,{accessToken:'bad',refreshToken:'bad'});}
    if(url.endsWith('/auth/logout')) return response(204);
    if(url.endsWith('/auth/login')) return response(200,{accessToken:'next-access',refreshToken:'next-refresh'});
    if(url.endsWith('/visits/old')) {started.resolve();return oldReply.promise;}
    return response(200,{});
  });
  const old=h.api.getVisit('old');await started.promise;
  await h.api.logout();await h.api.login({username:'next',password:'x'});
  oldReply.resolve(response(401,{code:'AUTH_TOKEN_EXPIRED'}));
  const result=await Promise.allSettled([old]);
  assert.equal(result[0].status,'rejected');assert.equal(result[0].reason.code,'SESSION_CHANGED');
  assert.equal(refreshCalls,0);assert.equal(h.storage.getItem(TOKEN),'next-access');assert.equal(h.storage.getItem(REFRESH),'next-refresh');
}

(async()=>{
  await check('parallel 401 uses one refresh and retries both',concurrent401);
  await check('late 401 retries rotated token without refresh',late401);
  await check('retry 401 stops after one refresh and clears session',retry401StopsAndClears);
  await check('refresh 401 clears only failed session',()=>refreshRejected(401,'AUTH_INVALID_CREDENTIALS',true));
  await check('refresh network error preserves tokens',()=>refreshRejected('network','NETWORK_ERROR',false));
  await check('refresh timeout preserves tokens',refreshTimeout);
  await check('stale refresh cannot overwrite logout-login',staleRefreshAfterNewLogin);
  await check('late 401 cannot refresh or clear new login',stale401AfterNewLogin);
  console.log('RESULT pass=8 fail=0');
})().catch(err=>{console.error(err);process.exitCode=1;});
