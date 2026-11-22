'use strict';
// Browser checks for the exported static site. API mode below uses an explicit
// HTTP adapter backed by StaticRuntime; it is not a PostgreSQL integration test.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require('playwright');

const root = path.resolve(process.env.WEB_MVP_ROOT || path.join(__dirname, '../.dist-pages'));
const evidence = path.resolve(process.env.QA_OUTPUT_DIR || path.join(__dirname, '../.context-shears/password-qa'));
const oldPassword = 'Doctor@2026';
const newPassword = 'QaDoctor@2026-Only';
const visitId = '20000000-0000-4000-8000-000000000202';
const mime = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.json':'application/json' };
const server = http.createServer((req,res) => {
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url,'http://localhost').pathname); }
  catch (_) { res.writeHead(400); res.end(); return; }
  const file = path.resolve(root,'.' + (pathname.endsWith('/') ? pathname + 'index.html' : pathname));
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    res.writeHead(404); res.end('Not found'); return;
  }
  res.setHeader('Content-Type',mime[path.extname(file)] || 'text/plain; charset=utf-8');
  res.end(fs.readFileSync(file));
});
let browser, base, pass = 0, fail = 0;

async function check(name, fn) {
  let page;
  try {
    page = await fn();
    pass++;
    console.log('PASS ' + name);
  } catch (err) {
    fail++;
    console.error('FAIL ' + name + ': ' + (err.stack || err));
    if (page) await page.screenshot({path:path.join(evidence,'FAIL-' + name.replace(/[^a-z0-9]+/gi,'-') + '.png'),fullPage:true}).catch(()=>{});
  }
}
async function freshPage(width=1280,height=800,mode='static') {
  const context = await browser.newContext({viewport:{width,height},timezoneId:'Asia/Ho_Chi_Minh'});
  const page = await context.newPage();
  const errors=[];
  page.on('pageerror', e=>errors.push(e.message));
  if (mode==='api') await page.route('**/config.js', route=>route.fulfill({contentType:'text/javascript',body:"window.APP_CONFIG={mode:'api',apiBase:'/api/v1'};"}));
  await page.goto(base);
  await page.locator('#login-username').waitFor();
  return {context,page,errors};
}
async function login(page,username='doctor',password=oldPassword) {
  await page.locator('#login-username').fill(username);
  await page.locator('#login-password').fill(password);
  await page.locator('#btn-login-submit').click();
  await page.waitForURL(username==='admin'?'**/#/admin/users':'**/#/patients');
  await page.locator(username==='admin' ? '.data-table tbody tr' : '.record-card').first().waitFor({state:'attached'});
}
function accountTrigger(page, width) {
  return page.locator(width <= 1024
    ? '.mobile-topbar [data-action="toggle-account-menu"]'
    : '.sidebar [data-action="toggle-account-menu"]');
}
async function openAccountMenu(page, width=1280) {
  const trigger=accountTrigger(page,width);
  await trigger.click();
  const menu=page.locator('#account-menu[role="menu"]');
  await menu.waitFor({state:'visible'});
  assert.equal(await trigger.getAttribute('aria-expanded'),'true');
  return {trigger,menu};
}
async function openDialog(page, width) {
  const {menu}=await openAccountMenu(page,width);
  await menu.locator('[role="menuitem"][data-action="open-change-password"]').click();
  await menu.waitFor({state:'hidden'});
  const dialog=page.getByRole('dialog',{name:'Đổi mật khẩu'});
  await dialog.waitFor();
  return dialog;
}
async function logout(page,width=1280) {
  const {menu}=await openAccountMenu(page,width);
  await menu.locator('[role="menuitem"][data-action="logout"]').click();
  await page.waitForURL('**/#/login');
}
async function fillPasswordForm(dialog,current=oldPassword,next=newPassword,confirm=next) {
  await dialog.locator('#cp-current').fill(current);
  await dialog.locator('#cp-new').fill(next);
  await dialog.locator('#cp-confirm').fill(confirm);
}
async function clickSubmit(dialog) {
  await dialog.getByRole('button',{name:'Đổi mật khẩu',exact:true}).click();
}
async function capture(page,name) {
  await page.screenshot({path:path.join(evidence,name + '.png'),fullPage:true});
}
async function isolated(name,fn,options={}) {
  await check(name,async()=>{
    const env=await freshPage(options.width || 1280,options.height || 800,options.mode || 'static');
    try { await fn(env); assert.deepEqual(env.errors,[],'browser errors'); }
    catch (err) {
      await env.page.screenshot({path:path.join(evidence,'FAIL-' + name.replace(/[^a-z0-9]+/gi,'-') + '.png'),fullPage:true}).catch(()=>{});
      throw err;
    } finally { await env.context.close(); }
  });
}
async function layout() {
  for (const [width,height] of [[320,568],[390,690],[768,800],[820,800],[1024,800],[1280,800],[1536,696]]) {
    await isolated('dialog layout ' + width + 'x' + height,async({page})=>{
      await login(page);
      const dialog=await openDialog(page,width);
      await dialog.locator('#cp-current').waitFor();
      const geometry=await page.evaluate(()=>{
        const rect=el=>{const r=el.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height};};
        return {viewport:{width:innerWidth,height:innerHeight},pageWidth:document.documentElement.scrollWidth,
          dialog:rect(document.querySelector('#modal-dialog')),
          inputs:[...document.querySelectorAll('#change-password-form input')].map(rect),
          submit:rect(document.querySelector('#change-password-form button[type="submit"]'))};
      });
      assert(geometry.pageWidth<=width+1,JSON.stringify(geometry));
      for(const box of [geometry.dialog,...geometry.inputs,geometry.submit]) {
        assert(box.width>0 && box.left>=-1 && box.right<=width+1,JSON.stringify(geometry));
      }
      assert(geometry.dialog.top>=-1 && geometry.dialog.top<height,'dialog header visible');
      await dialog.locator('#cp-current').focus();
      await page.keyboard.press('Tab');
      assert(await page.evaluate(()=>document.activeElement?.closest('#modal-dialog')!==null),'Tab remains in dialog');
      await capture(page,'dialog-' + width + 'x' + height);
      await dialog.locator('#cp-submit').scrollIntoViewIfNeeded();
      const submitViewport=await dialog.locator('#cp-submit').boundingBox();
      assert(submitViewport && submitViewport.y>=-1 && submitViewport.y+submitViewport.height<=height+1,'submit reachable on short viewport');
      await page.keyboard.press('Escape');
      await dialog.waitFor({state:'hidden'});
      assert(await accountTrigger(page,width).evaluate(el=>el===document.activeElement),'focus returns to account trigger');
    },{width,height});
  }
}
async function basicValidation() {
  await isolated('validation and visibility without request',async({page})=>{
    await login(page);
    const dialog=await openDialog(page,1280);
    let calls=0;
    await page.evaluate(()=>{const original=window.ApiClient.changePassword.bind(window.ApiClient);window.__qaChangeCalls=0;window.ApiClient.changePassword=payload=>{window.__qaChangeCalls++;return original(payload);};});
    await fillPasswordForm(dialog,oldPassword,newPassword,'different');
    await clickSubmit(dialog);
    calls=await page.evaluate(()=>window.__qaChangeCalls);
    assert.equal(calls,0,'mismatched confirmation must not call API');
    assert(await dialog.getByText(/khớp/i).count()>0,'confirmation error visible');
    await dialog.locator('#cp-confirm').fill('short');
    await dialog.locator('[data-password-toggle="cp-new"]').click();
    assert.equal(await dialog.locator('#cp-new').getAttribute('type'),'text');
    await dialog.locator('[data-password-toggle="cp-new"]').click();
    assert.equal(await dialog.locator('#cp-new').getAttribute('type'),'password');
    await fillPasswordForm(dialog,oldPassword,'short','short');
    await clickSubmit(dialog);
    assert.equal(await page.evaluate(()=>window.__qaChangeCalls),0,'weak password must not call API');
    await fillPasswordForm(dialog,oldPassword,oldPassword,oldPassword);
    await clickSubmit(dialog);
    assert.equal(await page.evaluate(()=>window.__qaChangeCalls),0,'same password must not call API');
  });
}
async function cancelPreservesEditor() {
  await isolated('cancel restores editor and dirty state',async({page})=>{
    await login(page);
    await page.evaluate(id=>{location.hash='#/visits/'+id;},visitId);
    const note=page.locator('#enc-clinical-note');
    await note.waitFor();
    await note.fill('QA cancel preserves caret');
    await note.evaluate(el=>{el.setSelectionRange(7,7);window.__qaNoteNode=el;});
    const dialog=await openDialog(page,1280);
    await fillPasswordForm(dialog);
    await page.keyboard.press('Escape');
    await dialog.waitFor({state:'hidden'});
    assert.equal(await note.inputValue(),'QA cancel preserves caret');
    assert(await note.evaluate(el=>el.isConnected&&el===window.__qaNoteNode),'editor node not replaced');
    assert.match(await page.locator('.encounter-footer__status .badge').innerText(),/chưa lưu/i);
    assert(await accountTrigger(page,1280).evaluate(el=>el===document.activeElement),'focus restored to trigger');
    assert.equal(await note.evaluate(el=>el.selectionStart),7,'caret restored');
  });
}
async function navigationGuardReplacesDialog() {
  await isolated('browser back from password dialog preserves usable editor',async({page})=>{
    await login(page);
    await page.evaluate(id=>{location.hash='#/visits/'+id;},visitId);
    const note=page.locator('#enc-clinical-note');
    await note.waitFor();
    await note.fill('QA guard after password dialog');
    await openDialog(page,1280);
    await page.goBack({waitUntil:'domcontentloaded'});
    const guard=page.getByRole('dialog',{name:/thay đổi chưa lưu/i});
    await guard.waitFor();
    await guard.getByRole('button',{name:/Ở lại nhập tiếp/i}).click();
    await guard.waitFor({state:'hidden'});
    assert.equal(await note.inputValue(),'QA guard after password dialog');
    assert.equal(await page.evaluate(()=>document.getElementById('app-root').inert),false,'app must be interactive after guard closes');
    await note.fill('QA editor still usable');
    assert.equal(await note.inputValue(),'QA editor still usable');
  });
}
async function pendingReplyAfterGuard() {
  await isolated('late password reply cannot clear unsaved guard',async({page})=>{
    await login(page);
    await page.evaluate(id=>{location.hash='#/visits/'+id;},visitId);
    const note=page.locator('#enc-clinical-note');
    await note.waitFor();
    await note.fill('QA pending password and guard');
    await page.evaluate(()=>{
      const original=window.ApiClient.changePassword.bind(window.ApiClient);
      window.ApiClient.changePassword=payload=>new Promise((resolve,reject)=>{
        window.__qaPendingPassword={
          finish:()=>original(payload).then(value=>{window.__qaPasswordFinished=true;resolve(value);},reject)
        };
      });
    });
    const dialog=await openDialog(page,1280);
    await fillPasswordForm(dialog);
    await clickSubmit(dialog);
    await page.waitForFunction(()=>Boolean(window.__qaPendingPassword));
    await page.goBack({waitUntil:'domcontentloaded'});
    const guard=page.getByRole('dialog',{name:/thay đổi chưa lưu/i});
    await guard.waitFor();
    await page.evaluate(()=>window.__qaPendingPassword.finish());
    await page.waitForFunction(()=>window.__qaPasswordFinished===true);
    assert(await guard.isVisible(),'late response must leave guard visible');
    await guard.getByRole('button',{name:/Ở lại nhập tiếp/i}).click();
    await guard.waitFor({state:'hidden'});
    assert.equal(await page.evaluate(()=>document.getElementById('app-root').inert),false);
    assert.equal(await note.inputValue(),'QA pending password and guard');
    await note.fill('QA editable after late reply');
  });
}
async function wrongThenSuccess() {
  await isolated('wrong current, retry, session and storage',async({page,context})=>{
    await login(page);
    await page.evaluate(id=>{location.hash='#/visits/'+id;},visitId);
    const note=page.locator('#enc-clinical-note');
    await note.waitFor();
    await note.fill('QA unsaved password dialog');
    const sameNode=await note.evaluate(el=>{window.__qaNoteNode=el;return el===document.activeElement;});
    assert(sameNode,'note is focused before dialog');
    let dialog=await openDialog(page,1280);
    await fillPasswordForm(dialog,'wrong-current',newPassword);
    await clickSubmit(dialog);
    await dialog.getByText(/mật khẩu hiện tại|không đúng/i).first().waitFor();
    assert.equal(page.url().split('#')[1],'/visits/'+visitId,'422 keeps current route');
    assert.equal(await note.inputValue(),'QA unsaved password dialog');
    await fillPasswordForm(dialog,oldPassword,newPassword);
    await clickSubmit(dialog);
    await dialog.waitFor({state:'hidden'});
    assert.equal(await note.inputValue(),'QA unsaved password dialog');
    assert(await note.evaluate(el=>el.isConnected && el===window.__qaNoteNode),'note DOM node preserved');
    assert(await page.locator('.encounter-footer__status .badge').innerText().then(s=>/chưa lưu/i.test(s)),'dirty badge preserved');
    const store=await page.evaluate(()=>({local:Object.values(localStorage).join(' '),session:Object.values(sessionStorage).join(' ')}));
    assert(!JSON.stringify(store).includes(newPassword),'new password absent from browser storage');
    assert(await page.evaluate(()=>window.ApiClient.hasStoredToken()),'current session retained');
    await page.locator('[data-action="save-draft"]').click();
    await page.waitForFunction(()=>/Đã lưu nháp/.test(document.querySelector('.encounter-footer__status .badge')?.textContent||''));
    await page.reload();
    await page.locator('#enc-clinical-note').waitFor();
    assert.equal(await page.locator('#enc-clinical-note').inputValue(),'QA unsaved password dialog','save after password change persists');
    await logout(page);
    await page.locator('#login-username').fill('doctor');
    await page.locator('#login-password').fill(oldPassword);
    await page.locator('#btn-login-submit').click();
    await page.getByRole('alert').waitFor();
    assert.equal(new URL(page.url()).hash,'#/login','old password rejected');
    await login(page,'doctor',newPassword);
    await page.locator('.page-head__title').waitFor();
    const audit=await page.evaluate(()=>Object.values(localStorage).join(' '));
    assert(!audit.includes(newPassword),'audit and database storage contain no new plaintext');
    await logout(page);
    await login(page,'bs.lan',oldPassword);
  });
}
async function otherSession() {
  await isolated('other doctor session invalidated',async({page,context})=>{
    await login(page);
    const second=await context.newPage();
    await second.goto(base);
    await second.locator('#login-username').fill('doctor');
    await second.locator('#login-password').fill(oldPassword);
    await second.locator('#btn-login-submit').click();
    await second.waitForURL('**/#/patients');
    const dialog=await openDialog(page,1280);
    await fillPasswordForm(dialog);
    await clickSubmit(dialog);
    await dialog.waitFor({state:'hidden'});
    await second.reload();
    await second.locator('#login-username').waitFor();
    assert.equal(await second.evaluate(()=>window.ApiClient.hasStoredToken()),false,'old tab session cleared');
    assert(await page.evaluate(()=>window.ApiClient.hasStoredToken()),'changing session remains active');
  });
}
async function concurrentStaticChanges() {
  await isolated('concurrent static changes keep winning session',async({page})=>{
    await login(page);
    const outcome=await page.evaluate(async({oldPassword})=>{
      const real=crypto.subtle.deriveBits.bind(crypto.subtle);
      const waiting=[];
      const candidates=['QaConcurrentFirst@2026','QaConcurrentSecond@2026'];
      crypto.subtle.deriveBits=async function(...args) {
        const bits=await real(...args);
        return new Promise(resolve=>{
          waiting.push(()=>resolve(bits));
          if(waiting.length===2) { waiting[0](); waiting[1](); }
        });
      };
      let results;
      try {
        results=await Promise.allSettled(candidates.map(newPassword=>window.ApiClient.changePassword({currentPassword:oldPassword,newPassword})));
      } finally { crypto.subtle.deriveBits=real; }
      let current;
      try { current={ok:true,username:(await window.ApiClient.getCurrentUser()).username}; }
      catch(e) { current={ok:false,status:e.status,code:e.code}; }
      return {results:results.map(r=>({status:r.status,code:r.reason?.code})),current,candidates};
    },{oldPassword});
    assert.deepEqual(outcome.results.map(r=>r.status).sort(),['fulfilled','rejected']);
    assert.equal(outcome.results.find(r=>r.status==='rejected').code,'CURRENT_PASSWORD_INCORRECT');
    assert.deepEqual(outcome.current,{ok:true,username:'doctor'},'losing request must not clear winning session');
    const winner=outcome.results.findIndex(r=>r.status==='fulfilled');
    await logout(page);
    await login(page,'doctor',outcome.candidates[winner]);
  });
}
async function concurrentReadDuringChange() {
  await isolated('concurrent auth read cannot revoke changed session',async({page})=>{
    await login(page);
    const outcome=await page.evaluate(async({oldPassword,newPassword})=>{
      const real=crypto.subtle.deriveBits.bind(crypto.subtle);
      let concurrentRead;
      crypto.subtle.deriveBits=async function(...args) {
        const bits=await real(...args);
        return new Promise(resolve=>{
          resolve(bits);
          queueMicrotask(()=>{
            concurrentRead=window.ApiClient.getCurrentUser().then(
              user=>({ok:true,username:user.username}),
              e=>({ok:false,status:e.status,code:e.code})
            );
          });
        });
      };
      let changed;
      try { changed=await window.ApiClient.changePassword({currentPassword:oldPassword,newPassword}); }
      finally { crypto.subtle.deriveBits=real; }
      const during=await concurrentRead;
      let after;
      try { after={ok:true,username:(await window.ApiClient.getCurrentUser()).username}; }
      catch(e) { after={ok:false,status:e.status,code:e.code}; }
      return {changed:changed.username,during,after,token:window.ApiClient.hasStoredToken()};
    },{oldPassword,newPassword});
    assert.equal(outcome.changed,'doctor');
    assert.deepEqual(outcome.during,{ok:true,username:'doctor'},'concurrent auth read must succeed');
    assert.deepEqual(outcome.after,{ok:true,username:'doctor'},'new session stays active');
    assert.equal(outcome.token,true);
  });
}
async function adminDenied() {
  await isolated('admin has no control and direct call denied',async({page})=>{
    await login(page,'admin','Admin@2026');
    const {menu}=await openAccountMenu(page,1280);
    assert.equal(await menu.locator('[role="menuitem"][data-action="open-change-password"]').count(),0);
    assert.equal(await menu.locator('[role="menuitem"][data-action="logout"]').count(),1);
    const result=await page.evaluate(async(nextPassword)=>{
      try { await window.ApiClient.changePassword({currentPassword:'Admin@2026',newPassword:nextPassword}); return {ok:true}; }
      catch(e) { return {ok:false,status:e.status,code:e.code}; }
    },newPassword);
    assert.equal(result.ok,false);
    assert.equal(result.status,403);
  });
}
async function apiAdapterWire() {
  await isolated('mock HTTP adapter wire and pending submission',async({page})=>{
    const requests=[];
    let release;
    const gate=new Promise(resolve=>{release=resolve;});
    await page.route('**/api/v1/**',async route=>{
      const request=route.request();
      const endpoint=new URL(request.url()).pathname.replace('/api/v1','');
      const method=request.method();
      const payload=request.postData() ? request.postDataJSON() : null;
      if(endpoint==='/auth/change-password') {
        requests.push({method,url:request.url(),payload,authorization:request.headers().authorization});
        await gate;
      }
      const result=await page.evaluate(async({endpoint,payload})=>{
        try {
          const runtime=window.StaticRuntime;
          let value;
          if(endpoint==='/auth/login') value=await runtime.login(payload);
          else if(endpoint==='/auth/me') value=await runtime.getCurrentUser();
          else if(endpoint==='/patients') value=await runtime.listPatients({});
          else if(endpoint==='/auth/change-password') value=await runtime.changePassword(payload);
          else if(endpoint==='/auth/logout') value=await runtime.logout();
          else throw new Error('Unexpected mocked endpoint '+endpoint);
          return {status:200,body:value};
        } catch(e) { return {status:e.status||500,body:e.problem||{detail:e.message}}; }
      },{endpoint,payload});
      await route.fulfill({status:result.status,json:result.body||{}});
    });
    await login(page);
    const before=await page.evaluate(()=>sessionStorage.getItem('suytim_mvp_access_token'));
    assert(before,'HTTP access token stored');
    const dialog=await openDialog(page,1280);
    await fillPasswordForm(dialog);
    const requestPromise=page.waitForRequest(r=>new URL(r.url()).pathname==='/api/v1/auth/change-password');
    await clickSubmit(dialog);
    await requestPromise;
    assert.equal(requests.length,1,'one request while pending');
    assert.equal(requests[0].method,'POST');
    assert.deepEqual(Object.keys(requests[0].payload).sort(),['currentPassword','newPassword']);
    assert.equal(requests[0].payload.currentPassword,oldPassword);
    assert.equal(requests[0].payload.newPassword,newPassword);
    assert.match(requests[0].authorization||'',/^Bearer /);
    assert(await dialog.getByRole('button',{name:/đang đổi|đổi mật khẩu/i}).first().isDisabled(),'submit disabled pending');
    await page.keyboard.press('Enter');
    assert.equal(requests.length,1,'Enter during pending does not submit twice');
    release();
    await dialog.waitFor({state:'hidden'});
    assert.equal(await page.evaluate(()=>sessionStorage.getItem('suytim_mvp_access_token')),before,'successful change keeps HTTP session');
  },{mode:'api'});
}

(async()=>{
  fs.mkdirSync(evidence,{recursive:true});
  assert(fs.existsSync(path.join(root,'index.html')),'built site missing: '+root);
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  base='http://127.0.0.1:'+server.address().port+'/';
  browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_BIN || undefined});
  try {
    await layout();
    await basicValidation();
    await cancelPreservesEditor();
    await navigationGuardReplacesDialog();
    await pendingReplyAfterGuard();
    await wrongThenSuccess();
    await otherSession();
    await concurrentStaticChanges();
    await concurrentReadDuringChange();
    await adminDenied();
    await apiAdapterWire();
  } finally {
    await browser.close();
    await new Promise(resolve=>server.close(resolve));
  }
  console.log(`RESULT pass=${pass} fail=${fail}`);
  if(fail) process.exitCode=1;
})().catch(err=>{console.error(err.stack||err);process.exitCode=1;server.close();});
