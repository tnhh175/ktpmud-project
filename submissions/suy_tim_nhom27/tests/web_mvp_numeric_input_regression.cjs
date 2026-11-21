'use strict';
// Run with Playwright installed: node submissions/suy_tim_nhom27/tests/web_mvp_numeric_input_regression.cjs
// Uses isolated browser storage, synthetic seed data and mocked HTTP; never contacts a live API.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '../web-mvp');
const visitId = '20000000-0000-4000-8000-000000000202';
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const name = url.pathname === '/' ? 'index.html' : url.pathname.slice(1);
  if (name === 'config.js') {
    res.setHeader('Content-Type', 'text/javascript');
    return res.end(`window.APP_CONFIG={mode:'${url.searchParams.get('mode') || 'static'}',apiBase:'/api/v1'};`);
  }
  const file = path.resolve(root, name);
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    res.writeHead(404);
    return res.end();
  }
  res.setHeader('Content-Type', ({'.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.json':'application/json'})[path.extname(file)] + '; charset=utf-8');
  res.end(fs.readFileSync(file));
});

async function mockApi(page) {
  await page.route('**/api/v1/**', async route => {
    const req = route.request();
    const url = new URL(req.url());
    const suffix = url.pathname.replace('/api/v1', '');
    const payload = req.postDataJSON();
    const result = await page.evaluate(async ({suffix, payload, method}) => {
      const runtime = window.StaticRuntime;
      try {
        let value;
        if (suffix === '/auth/login') value = await runtime.login(payload);
        else if (suffix === '/auth/me') value = await runtime.getCurrentUser();
        else if (suffix === '/patients') value = await runtime.listPatients({});
        else if (/^\/patients\/[^/]+$/.test(suffix)) value = await runtime.getPatient(suffix.split('/')[2]);
        else if (/^\/visits\/[^/]+\/form$/.test(suffix)) value = await runtime.getVisitForm(suffix.split('/')[2]);
        else if (/^\/visits\/[^/]+\/draft$/.test(suffix)) value = await runtime.saveVisitDraft(suffix.split('/')[2], payload, payload.rowVersion);
        else if (/^\/visits\/[^/]+$/.test(suffix) && method === 'GET') value = await runtime.getVisit(suffix.split('/')[2]);
        else throw new Error('Unexpected mock endpoint: ' + suffix);
        return {status: 200, value};
      } catch (err) { return {status: err.status || 500, value: err.problem || {detail: err.message}}; }
    }, {suffix, payload, method: req.method()});
    await route.fulfill({status: result.status, json: result.value});
  });
}

async function typeNumber(page, selector, value) {
  const input = page.locator(selector);
  await input.fill('');
  await input.evaluate(el => { window.numericInputUnderTest = el; });
  let expected = '';
  for (const digit of value) {
    await page.keyboard.type(digit);
    expected += digit;
    // Chromium exposes "68." as "68" while retaining the decimal separator in
    // its native edit buffer; the next digit must still produce "68.5".
    assert.equal(await input.inputValue(), expected.endsWith('.') ? expected.slice(0, -1) : expected, 'digits must retain their typed order');
    assert(await input.evaluate(el => el === window.numericInputUnderTest && el === document.activeElement), 'typing must preserve the focused input node');
  }
  assert.equal(await input.evaluate(el => el.classList.contains('input--unfilled')), false);
}

(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({headless: true, ...(process.env.BROWSER_BIN ? {executablePath: process.env.BROWSER_BIN} : {})});
  try {
    for (const mode of ['static', 'api']) {
      const context = await browser.newContext();
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', err => errors.push(err.message));
      if (mode === 'api') await mockApi(page);
      await page.route('**/config.js', route => route.fulfill({contentType:'text/javascript', body:`window.APP_CONFIG={mode:'${mode}',apiBase:'/api/v1'};`}));
      await page.goto(base);
      await page.locator('#login-username').fill('doctor');
      await page.locator('#login-password').fill('Doctor@2026');
      await page.locator('#btn-login-submit').click();
      await page.waitForURL('**/#/patients');
      await page.evaluate(id => { location.hash = '#/visits/' + id; }, visitId);
      await page.locator('[data-enc-section]').first().waitFor();
      const form = await page.evaluate(id => window.StaticRuntime.getVisitForm(id), visitId);
      const height = form.fieldDefinitions.find(fd => fd.code === 'chieu_cao_cm');
      const weight = form.fieldDefinitions.find(fd => fd.code === 'can_nang_kg');
      const section = form.sections.find(sec => sec.fields.some(ff => ff.fieldDefinitionId === height.id));
      await page.locator(`[data-enc-section="${section.sectionCode}"]`).click();
      const h = `[data-enc-num="${height.id}"]`;
      const w = `[data-enc-num="${weight.id}"]`;
      await typeNumber(page, h, '168');
      await typeNumber(page, w, '68.5');
      assert.equal(await page.locator(h).inputValue(), '168');
      await page.locator(w).press('Backspace');
      await page.locator(w).press('Backspace');
      assert.equal(await page.locator(w).inputValue(), '68');
      await page.locator(w).press('ArrowLeft');
      await page.keyboard.type('7');
      assert.equal(await page.locator(w).inputValue(), '678', 'editing in the middle must preserve the caret');
      await typeNumber(page, w, '68');
      assert.equal(await page.locator('[data-field-code="bmi"] .bmi-card__value').textContent(), '24.09 kg/m²');
      await typeNumber(page, w, '0');
      assert.equal(await page.locator('[data-field-code="can_nang_kg"] .zero-chip').count(), 1);
      await page.locator(w).press('Backspace');
      assert.equal(await page.locator(w).inputValue(), '');
      assert(await page.locator(w).evaluate(el => el.classList.contains('input--unfilled')));
      assert.equal(await page.locator('[data-field-code="can_nang_kg"] .zero-chip').count(), 0);
      await typeNumber(page, w, '68');
      await page.locator('[data-action="save-draft"]').click();
      await page.waitForFunction(() => !document.querySelector('[data-action="save-draft"]').disabled);
      const saved = await page.evaluate(id => window.StaticRuntime.getVisit(id), visitId);
      assert.equal(saved.values.find(v => v.fieldDefinitionId === height.id).valueNum, 168);
      assert.equal(saved.values.find(v => v.fieldDefinitionId === weight.id).valueNum, 68);
      assert.deepEqual(errors, []);
      console.log(`PASS ${mode}: sequential typing, decimals, middle editing, backspace, zero/empty, live BMI and saved values`);
      await context.close();
    }
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(err => { console.error(err); server.close(); process.exitCode = 1; });
