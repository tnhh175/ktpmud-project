'use strict';
// WEB_MVP_ROOT may point to the unpatched checkout to verify a negative baseline.
// NODE_PATH must include Playwright; BROWSER_BIN may point to installed Chrome.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const os = require('node:os');
const { chromium } = require('playwright');

const root = path.resolve(process.env.WEB_MVP_ROOT || path.join(__dirname, '../web-mvp'));
const output = path.resolve(process.env.QA_OUTPUT_DIR || path.join(os.tmpdir(),'suytim-six-bugs-qa'));
const visitId = '20000000-0000-4000-8000-000000000202';
const otherVisitId = '20000000-0000-4000-8000-000000000203';
const server = http.createServer((req, res) => {
  const name = new URL(req.url, 'http://localhost').pathname.slice(1) || 'index.html';
  const file = path.resolve(root, name);
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    res.writeHead(404); return res.end();
  }
  res.setHeader('Content-Type', ({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json'})[path.extname(file)] || 'text/plain');
  res.end(fs.readFileSync(file));
});
const deferred = () => { let resolve, reject; const promise = new Promise((yes, no) => {resolve=yes; reject=no;}); return {promise,resolve,reject}; };
let browser;
let base;
let passed = 0;
let failed = 0;

async function mockApi(page, saveGate) {
  await page.route('**/api/v1/**', async route => {
    const req = route.request();
    const suffix = new URL(req.url()).pathname.replace('/api/v1', '');
    const payload = req.postDataJSON();
    if (suffix.endsWith('/draft') && req.method() === 'PUT' && saveGate) {
      saveGate.calls.push({payload, ifMatch:req.headers()['if-match'], suffix});
      const slot = deferred();
      saveGate.pending.push(slot);
      await page.evaluate(() => { window.__qaApiSaveCount = (window.__qaApiSaveCount || 0) + 1; });
      saveGate.entered.resolve();
      const decision = await slot.promise;
      if (decision.reject) return route.fulfill({status:decision.status || 422,json:{code:'VALIDATION_ERROR',detail:'QA rejected save',errors:[]}});
    }
    const result = await page.evaluate(async ({suffix, payload, method, ifMatch}) => {
      const runtime = window.StaticRuntime;
      try {
        let value;
        if (suffix === '/auth/login') value = await runtime.login(payload);
        else if (suffix === '/auth/me') value = await runtime.getCurrentUser();
        else if (suffix === '/patients') value = await runtime.listPatients({});
        else if (/^\/patients\/[^/]+$/.test(suffix)) value = await runtime.getPatient(suffix.split('/')[2]);
        else if (/^\/visits\/[^/]+\/form$/.test(suffix)) value = await runtime.getVisitForm(suffix.split('/')[2]);
        else if (/^\/visits\/[^/]+\/draft$/.test(suffix)) value = await runtime.saveVisitDraft(suffix.split('/')[2], payload, ifMatch ? ifMatch.replaceAll('"','') : payload.rowVersion);
        else if (/^\/visits\/[^/]+$/.test(suffix) && method === 'GET') value = await runtime.getVisit(suffix.split('/')[2]);
        else throw new Error('Unexpected mock endpoint: ' + suffix);
        return {status:200,value};
      } catch (err) { return {status:err.status || 500,value:err.problem || {detail:err.message}}; }
    }, {suffix,payload,method:req.method(),ifMatch:req.headers()['if-match']});
    await route.fulfill({status:result.status,json:result.value});
  });
}

async function setup(mode, saveGate) {
  const context = await browser.newContext({timezoneId:'Asia/Ho_Chi_Minh'});
  const page = await context.newPage();
  const pageErrors = [];
  page.on('pageerror', err => pageErrors.push(err.message));
  await page.route('**/config.js', route => route.fulfill({contentType:'text/javascript',body:`window.APP_CONFIG={mode:'${mode}',apiBase:'/api/v1'};`}));
  if (mode === 'api') await mockApi(page, saveGate);
  await page.goto(base);
  await page.locator('#login-username').fill('doctor');
  await page.locator('#login-password').fill('Doctor@2026');
  await page.locator('#btn-login-submit').click();
  await page.waitForURL('**/#/patients');
  const open = async id => {
    await page.evaluate(value => {location.hash = '#/visits/' + value;}, id);
    await page.locator('[data-enc-section]').first().waitFor();
  };
  await open(visitId);
  return {context,page,pageErrors,open,mode};
}

async function installStaticGate(page) {
  await page.evaluate(() => {
    const original = window.StaticRuntime.saveVisitDraft.bind(window.StaticRuntime);
    window.__qaSave = {calls:[],pending:[]};
    window.StaticRuntime.saveVisitDraft = function (id,payload,version) {
      const snapshot = structuredClone(payload);
      window.__qaSave.calls.push({id,payload:snapshot,version});
      return new Promise((resolve,reject) => {
        window.__qaSave.pending.push({resolve:() => original(id,snapshot,version).then(resolve,reject),reject});
      });
    };
  });
  return {
    waitCall: async n => page.waitForFunction(count => window.__qaSave.calls.length >= count, n),
    count: () => page.evaluate(() => window.__qaSave.calls.length),
    calls: () => page.evaluate(() => window.__qaSave.calls),
    release: async (reject=false) => page.evaluate(shouldReject => {
      const item = window.__qaSave.pending.shift();
      if (!item) throw new Error('No pending save');
      if (shouldReject) item.reject({status:422,detail:'QA rejected save',errors:[]});
      else item.resolve();
    },reject)
  };
}

async function installGate(mode, page, apiGate) {
  if (mode === 'static') return installStaticGate(page);
  return {
    waitCall: async n => page.waitForFunction(count => window.__qaApiSaveCount >= count, n),
    count: async () => apiGate.calls.length,
    calls: async () => apiGate.calls,
    release: async (reject=false) => { const slot=apiGate.pending.shift(); if (!slot) throw new Error('No pending API save'); slot.resolve({reject}); }
  };
}

async function run(name, mode, fn, usesGate=false) {
  if (process.env.QA_SCENARIO && process.env.QA_SCENARIO !== name) return;
  if (process.env.QA_MODE && process.env.QA_MODE !== mode) return;
  const apiGate = usesGate && mode === 'api' ? {calls:[],pending:[],entered:deferred()} : null;
  let env;
  try {
    env = await setup(mode,apiGate);
    const gate = usesGate ? await installGate(mode,env.page,apiGate) : null;
    await fn(env,gate);
    assert.deepEqual(env.pageErrors,[], 'no browser page error');
    passed++;
    console.log(`PASS ${mode} ${name}`);
  } catch (err) {
    failed++;
    fs.mkdirSync(output,{recursive:true});
    const shot = path.join(output,`FAIL-${mode}-${name.replace(/[^a-z0-9]+/gi,'-')}.png`);
    if (env) await env.page.screenshot({path:shot,fullPage:true}).catch(()=>{});
    console.error(`FAIL ${mode} ${name}: ${err.stack || err}; screenshot=${shot}`);
  } finally { if (env) await env.context.close(); }
}

async function markAndBadge({page,mode}) {
  const note = page.locator('#enc-clinical-note');
  await note.fill('QA dirty now');
  assert.match(await page.locator('.encounter-footer__status .badge').innerText(),/chưa lưu/i);
  if (process.env.QA_CAPTURE_PASS && mode === 'static') {
    fs.mkdirSync(output,{recursive:true});
    await page.screenshot({path:path.join(output,'PASS-dirty-badge.png'),fullPage:true});
  }
  assert.equal(await note.inputValue(),'QA dirty now');
  assert(await note.evaluate(el => el === document.activeElement && el.isConnected), 'input node/focus preserved');
  const form = await page.evaluate(id => window.StaticRuntime.getVisitForm(id),visitId);
  const weight = form.fieldDefinitions.find(fd => fd.code === 'can_nang_kg');
  const section = form.sections.find(s => s.fields.some(f => f.fieldDefinitionId === weight.id));
  await page.locator(`[data-enc-section="${section.sectionCode}"]`).click();
  const num = page.locator(`[data-enc-num="${weight.id}"]`);
  await num.fill('0');
  assert.equal(await num.inputValue(),'0');
  assert.match(await page.locator('.encounter-footer__status .badge').innerText(),/chưa lưu/i);
  await num.fill('68.5');
  assert.equal(await num.inputValue(),'68.5');
  assert(await num.evaluate(el => el === document.activeElement && el.isConnected));
  await num.fill('');
  assert.equal(await num.inputValue(),'');
  assert.match(await page.locator('.encounter-footer__status .badge').innerText(),/chưa lưu/i);
}

async function savePendingEdit({page,mode},gate) {
  const note = page.locator('#enc-clinical-note');
  await note.fill('before save');
  await page.locator('[data-action="save-draft"]').click();
  await gate.waitCall(1);
  await note.fill('after save');
  await page.keyboard.press('Control+s');
  assert.equal(await gate.count(),1,'duplicate save/keyboard shortcut must not issue concurrent write');
  await gate.release();
  await gate.waitCall(2);
  const calls = await gate.calls();
  assert.equal(calls[0].payload.clinicalNote,'before save');
  assert.equal(calls[1].payload.clinicalNote,'after save');
  assert.equal(await page.locator('#enc-clinical-note').inputValue(),'after save');
  if (process.env.QA_CAPTURE_PASS && mode === 'static') {
    fs.mkdirSync(output,{recursive:true});
    await page.screenshot({path:path.join(output,'PASS-pending-edit-kept.png'),fullPage:true});
  }
  await gate.release();
  await page.waitForFunction(() => !document.querySelector('[data-action="save-draft"]').disabled);
  const stored = await page.evaluate(id => window.StaticRuntime.getVisit(id),visitId);
  assert.equal(stored.visit.clinicalNote,'after save');
}

async function pendingEditSurvivesFirstResponse({page},gate) {
  const note=page.locator('#enc-clinical-note');
  await note.fill('sent version');
  await page.locator('[data-action="save-draft"]').click();
  await gate.waitCall(1);
  await note.fill('newer unsent version');
  await gate.release();
  await page.waitForFunction(() => !document.querySelector('[data-action="save-draft"]').disabled);
  assert.equal(await note.inputValue(),'newer unsent version');
  assert.match(await page.locator('.encounter-footer__status .badge').innerText(),/chưa lưu/i);
  const stored=await page.evaluate(id => window.StaticRuntime.getVisit(id),visitId);
  assert.equal(stored.visit.clinicalNote,'sent version');
}

async function saveRejectedEdit({page},gate) {
  const note = page.locator('#enc-clinical-note');
  await note.fill('before rejected save');
  await page.locator('[data-action="save-draft"]').click();
  await gate.waitCall(1);
  await note.fill('after rejected save');
  await gate.release(true);
  await page.waitForFunction(() => !document.querySelector('[data-action="save-draft"]').disabled);
  assert.equal(await page.locator('#enc-clinical-note').inputValue(),'after rejected save');
  assert.match(await page.locator('.encounter-footer__status .badge').innerText(),/chưa lưu/i);
}

async function saveAndLeaveWithNewEdit({page,open},gate) {
  await page.locator('#enc-clinical-note').fill('first version');
  await page.goBack({waitUntil:'domcontentloaded'});
  await page.locator('[data-action="save-and-leave"]').click();
  await gate.waitCall(1);
  await page.locator('#enc-clinical-note').fill('second version');
  await gate.release();
  await page.locator('[data-action="save-and-leave"]').waitFor();
  assert.match(page.url(),new RegExp(visitId),'must stay when newer edits remain');
  assert.equal(await page.locator('#enc-clinical-note').inputValue(),'second version');
  await page.locator('[data-action="save-and-leave"]').click();
  await gate.waitCall(2);
  await gate.release();
  await page.waitForURL('**/#/patients');
  await open(visitId);
  assert.equal(await page.locator('#enc-clinical-note').inputValue(),'second version');
}

async function failedSaveAndLeave({page},gate) {
  await page.locator('#enc-clinical-note').fill('must not leave');
  await page.goBack({waitUntil:'domcontentloaded'});
  await page.locator('[data-action="save-and-leave"]').click();
  await gate.waitCall(1);
  await gate.release(true);
  await page.waitForFunction(() => !document.querySelector('[data-action="save-draft"]').disabled);
  assert.match(page.url(),new RegExp(visitId));
  assert.equal(await page.locator('#enc-clinical-note').inputValue(),'must not leave');
  assert.match(await page.locator('.encounter-footer__status .badge').innerText(),/chưa lưu/i);
}

async function staleSaveOtherVisit({page,open},gate) {
  await page.locator('#enc-clinical-note').fill('save older visit');
  await page.locator('[data-action="save-draft"]').click();
  await gate.waitCall(1);
  await page.evaluate(id => { location.hash = '#/visits/' + id; },otherVisitId);
  await page.locator('[data-action="discard-and-leave"]').click();
  await page.waitForURL(`**/#/visits/${otherVisitId}`);
  await page.locator('#enc-clinical-note').waitFor();
  const otherNote = await page.locator('#enc-clinical-note').inputValue();
  await gate.release();
  await page.waitForFunction(id => location.hash === '#/visits/' + id && document.querySelector('#enc-clinical-note'),otherVisitId);
  assert.equal(await page.locator('#enc-clinical-note').inputValue(),otherNote);
  assert.match(page.url(),new RegExp(otherVisitId));
}

async function historyGuard({page,open}) {
  await page.locator('#enc-clinical-note').fill('QA back guard');
  await page.goBack({waitUntil:'domcontentloaded'});
  await page.locator('#modal-title').getByText(/chưa lưu/i).waitFor();
  assert.match(page.url(),new RegExp(visitId));
  await page.locator('[data-action="close-modal"]').last().click();
  assert.equal(await page.locator('#enc-clinical-note').inputValue(),'QA back guard');
  await page.goBack({waitUntil:'domcontentloaded'});
  await page.locator('[data-action="discard-and-leave"]').click();
  await page.waitForURL('**/#/patients');
  await page.goForward({waitUntil:'domcontentloaded'});
  await page.locator('#enc-clinical-note').waitFor();
  assert.equal(await page.locator('#enc-clinical-note').inputValue(),'');
  await page.locator('#enc-clinical-note').fill('QA forward guard');
  await page.goBack({waitUntil:'domcontentloaded'});
  await page.locator('[data-action="save-and-leave"]').click();
  await page.waitForURL('**/#/patients');
  await open(visitId);
  assert.equal(await page.locator('#enc-clinical-note').inputValue(),'QA forward guard');
}

async function dirtyForwardGuard({page}) {
  await page.locator('button:has-text("Về hồ sơ")').click();
  await page.waitForURL('**/#/patients/*');
  await page.goBack({waitUntil:'domcontentloaded'});
  await page.locator('#enc-clinical-note').waitFor();
  await page.locator('#enc-clinical-note').fill('QA dirty forward');
  await page.goForward({waitUntil:'domcontentloaded'});
  await page.locator('[data-action="discard-and-leave"]').waitFor();
  assert.match(page.url(),new RegExp(visitId));
  await page.locator('[data-action="close-modal"]').last().click();
  assert.equal(await page.locator('#enc-clinical-note').inputValue(),'QA dirty forward');
  await page.goForward({waitUntil:'domcontentloaded'});
  await page.locator('[data-action="discard-and-leave"]').click();
  await page.waitForURL('**/#/patients/*');
}

async function ctrlSWhileNextVisitLoads({page}) {
  const next = await page.evaluate(async id => {
    const current=await window.StaticRuntime.getVisit(id);
    return window.StaticRuntime.createVisit(current.visit.patientId,{visitDate:'2026-11-22T09:00:00Z'});
  },visitId);
  const entered=deferred();const release=deferred();
  let saveRequests=0;
  await page.route(`**/api/v1/visits/${next.id}`,async route=>{entered.resolve();await release.promise;await route.fallback();});
  await page.route('**/api/v1/visits/*/draft',async route=>{saveRequests++;await route.fallback();});
  await page.evaluate(id => {location.hash = '#/visits/' + id;},next.id);
  await entered.promise;
  await page.keyboard.press('Control+s');
  assert.equal(saveRequests,0,'Ctrl+S during the next visit load must not write the previous visit');
  release.resolve();
  await page.waitForFunction(id => location.hash === '#/visits/' + id && document.querySelector('#enc-clinical-note') && !document.querySelector('[data-action="save-draft"]').disabled,next.id);
  await page.locator('#enc-clinical-note').fill('new visit note');
  await page.keyboard.press('Control+s');
  await page.waitForFunction(() => !document.querySelector('[data-action="save-draft"]').disabled);
  assert.equal(saveRequests,1);
  const old = await page.evaluate(id => window.StaticRuntime.getVisit(id),visitId);
  const newer = await page.evaluate(id => window.StaticRuntime.getVisit(id),next.id);
  assert.notEqual(old.visit.clinicalNote,'new visit note');
  assert.equal(newer.visit.clinicalNote,'new visit note');
}

async function timestampRoundtrip({page}) {
  await page.locator('[data-enc-section="sinh_ton_kham"]').click();
  const bp = page.locator('[data-enc-bp-field="0:measuredAt"]');
  const local = '2026-11-19T16:20';
  await bp.fill(local);
  await page.locator('[data-enc-filter="unfilled"]').click();
  await page.locator('[data-enc-filter="all"]').click();
  assert.equal(await page.locator('[data-enc-bp-field="0:measuredAt"]').inputValue(),local);
  await page.locator('[data-enc-bp-field="0:measuredAt"]').fill('');
  await page.locator('[data-enc-filter="unfilled"]').click();
  await page.locator('[data-enc-filter="all"]').click();
  assert.equal(await page.locator('[data-enc-bp-field="0:measuredAt"]').inputValue(),'');
  await page.locator('[data-enc-section="can_lam_sang"]').click();
  await page.locator('[data-enc-add-lab]').click();
  const lab = page.locator('[data-enc-lab-field="0:measuredAt"]');
  await lab.fill(local);
  await page.locator('[data-enc-filter="unfilled"]').click();
  await page.locator('[data-enc-filter="all"]').click();
  assert.equal(await page.locator('[data-enc-lab-field="0:measuredAt"]').inputValue(),local);
  await page.locator('[data-enc-lab-field="0:measuredAt"]').fill('');
  await page.locator('[data-enc-filter="unfilled"]').click();
  await page.locator('[data-enc-filter="all"]').click();
  assert.equal(await page.locator('[data-enc-lab-field="0:measuredAt"]').inputValue(),'');
  await page.locator('[data-action="save-draft"]').click();
  await page.waitForFunction(() => !document.querySelector('[data-action="save-draft"]').disabled);
  assert.match(await page.locator('.encounter-footer__status .badge').innerText(),/chưa lưu/i,'invalid blank timestamp must not be saved');
}

async function validTimezoneRoundtrip({page}) {
  const local = '2026-11-19T16:20';
  const iso = '2026-11-19T09:20:00.000Z';
  await page.locator('[data-enc-section="sinh_ton_kham"]').click();
  await page.locator('[data-enc-bp-field="0:measuredAt"]').fill(local);
  await page.locator('[data-enc-section="can_lam_sang"]').click();
  await page.locator('[data-enc-add-lab]').click();
  const labCode = page.locator('[data-enc-lab-field="0:labCode"]');
  const selected = await labCode.locator('option:not([value=""])').first().getAttribute('value');
  assert(selected,'at least one lab definition');
  await labCode.selectOption(selected);
  if (await page.locator('[data-enc-lab-field="0:valueNum"]').count()) await page.locator('[data-enc-lab-field="0:valueNum"]').fill('12.5');
  else await page.locator('[data-enc-lab-field="0:valueText"]').fill('QA result');
  await page.locator('[data-enc-lab-field="0:measuredAt"]').fill(local);
  await page.locator('[data-action="save-draft"]').click();
  await page.waitForFunction(() => !document.querySelector('[data-action="save-draft"]').disabled);
  assert.doesNotMatch(await page.locator('.encounter-footer__status .badge').innerText(),/chưa lưu/i);
  const stored = await page.evaluate(id => window.StaticRuntime.getVisit(id),visitId);
  assert.equal(stored.orthostaticBp[0].measuredAt,iso);
  assert.equal(stored.labResults[0].measuredAt,iso);
  await page.locator('[data-enc-filter="unfilled"]').click();
  await page.locator('[data-enc-filter="all"]').click();
  assert.equal(await page.locator('[data-enc-lab-field="0:measuredAt"]').inputValue(),local);
}

async function invalidTimestampRejected({page}) {
  const result = await page.evaluate(async id => {
    const runtime = window.StaticRuntime;
    const before = await runtime.getVisit(id);
    const form = await runtime.getVisitForm(id);
    const labDef = form.fieldDefinitions.find(fd => fd.code === 'cls_ecg_ket_luan' && fd.storageLevel === 'lab_result');
    if (!labDef) throw new Error('Expected seeded ECG lab definition');
    const payload = {
      rowVersion:before.visit.rowVersion,
      clinicalNote:before.visit.clinicalNote,
      infoSource:before.visit.infoSource,
      values:before.values,
      orthostaticBp:before.orthostaticBp,
      medications:before.medications,
      allergies:before.allergies,
      labResults:before.labResults
    };
    async function attempt(change) {
      const bad=structuredClone(payload);
      change(bad);
      try {
        await runtime.saveVisitDraft(id,bad,before.visit.rowVersion);
        return {status:200,errors:[]};
      } catch (err) {
        return {status:err.status,errors:err.errors || (err.problem && err.problem.errors) || []};
      }
    }
    const bp=await attempt(p => {p.orthostaticBp[0].measuredAt='not-a-date';});
    const afterBp=await runtime.getVisit(id);
    const lab=await attempt(p => {p.labResults=[{labCode:labDef.code,valueText:'QA ECG finding',measuredAt:'not-a-date'}];});
    const afterLab=await runtime.getVisit(id);
    return {before,afterBp,afterLab,bp,lab,labCode:labDef.code};
  },visitId);
  assert.equal(result.bp.status,422,'invalid BP timestamp must be rejected');
  assert(result.bp.errors.some(e => e.fieldCode === 'thoi_diem_do_ha' && e.sectionCode === 'sinh_ton_kham'),'BP field error must name timestamp and section');
  assert.deepEqual(result.afterBp,result.before,'BP rejection must preserve persisted visit and rowVersion');
  assert.equal(result.lab.status,422,'invalid lab timestamp must be rejected');
  assert(result.lab.errors.some(e => e.fieldCode === result.labCode && e.sectionCode === 'can_lam_sang'),'lab field error must name chosen lab and section');
  assert.deepEqual(result.afterLab,result.before,'lab rejection must preserve persisted visit and rowVersion');
}

async function beforeUnload({page}) {
  await page.locator('#enc-clinical-note').fill('QA beforeunload');
  const dialogSeen = deferred();
  page.once('dialog', async dialog => { dialogSeen.resolve(dialog.type()); await dialog.dismiss(); });
  page.evaluate(() => location.reload()).catch(()=>{});
  assert.equal(await dialogSeen.promise,'beforeunload');
  assert.equal(await page.locator('#enc-clinical-note').inputValue(),'QA beforeunload');
  await page.locator('[data-action="save-draft"]').click();
  await page.waitForFunction(() => !document.querySelector('[data-action="save-draft"]').disabled);
  await page.reload();
  await page.locator('#enc-clinical-note').waitFor();
  assert.equal(await page.locator('#enc-clinical-note').inputValue(),'QA beforeunload');
}

(async () => {
  await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
  base = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({headless:true,...(process.env.BROWSER_BIN ? {executablePath:process.env.BROWSER_BIN} : {})});
  try {
    for (const mode of ['static','api']) {
      await run('dirty-badge-input',mode,markAndBadge);
      await run('save-pending-edit',mode,savePendingEdit,true);
      await run('save-pending-preserves-newer',mode,pendingEditSurvivesFirstResponse,true);
      await run('save-rejected-edit',mode,saveRejectedEdit,true);
      await run('save-and-leave-new-edit',mode,saveAndLeaveWithNewEdit,true);
      await run('save-and-leave-failure',mode,failedSaveAndLeave,true);
      await run('stale-save-other-visit',mode,staleSaveOtherVisit,true);
      await run('history-back-forward',mode,historyGuard);
      await run('history-dirty-forward',mode,dirtyForwardGuard);
      await run('timestamp-clear-roundtrip',mode,timestampRoundtrip);
      await run('timezone-valid-roundtrip',mode,validTimezoneRoundtrip);
      await run('invalid-timestamp-rejected',mode,invalidTimestampRejected);
      await run('beforeunload',mode,beforeUnload);
      if (mode === 'api') await run('ctrl-s-next-visit-loading',mode,ctrlSWhileNextVisitLoads);
    }
    console.log(`RESULT pass=${passed} fail=${failed}`);
    if (failed) process.exitCode=1;
  } finally {await browser.close(); await new Promise(resolve => server.close(resolve));}
})().catch(err => {console.error(err);process.exitCode=1;server.close();});
