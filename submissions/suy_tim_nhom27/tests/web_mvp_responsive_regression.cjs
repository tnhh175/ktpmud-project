'use strict';
// Run against a freshly built static bundle: WEB_MVP_ROOT=<bundle> node this-file.
// NODE_PATH must include Playwright; BROWSER_BIN may select an installed Chrome.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require('playwright');

const root = path.resolve(process.env.WEB_MVP_ROOT || path.join(__dirname, '../.dist-pages'));
const evidence = path.resolve(process.env.QA_OUTPUT_DIR || path.join(__dirname, '../.context-shears/responsive-qa'));
const widths = [320, 390, 768, 769, 820, 1024, 1280];
const apiPaths = ['/api/', '/api/index.html', '/openapi.yaml', '/openapi.json', '/api/openapi.yaml', '/api/openapi.json'];
const failures = [];
const results = [];
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json' };

const server = http.createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  const filename = path.resolve(root, '.' + (pathname.endsWith('/') ? pathname + 'index.html' : pathname));
  if (!(filename === root || filename.startsWith(root + path.sep)) || !fs.existsSync(filename) || !fs.statSync(filename).isFile()) {
    response.writeHead(404); response.end('Not found'); return;
  }
  response.setHeader('Content-Type', mime[path.extname(filename)] || 'text/plain; charset=utf-8');
  response.end(fs.readFileSync(filename));
});

async function check(name, fn, page) {
  try {
    const detail = await fn();
    results.push({ name, status: 'PASS', detail });
    console.log('PASS ' + name + (detail ? ' ' + JSON.stringify(detail) : ''));
  } catch (error) {
    const shot = path.join(evidence, 'FAIL-' + name.replace(/[^a-z0-9]+/gi, '-') + '.png');
    if (page) await page.screenshot({ path: shot, fullPage: true }).catch(() => {});
    failures.push({ name, error: error.stack || String(error), screenshot: page ? shot : null });
    results.push({ name, status: 'FAIL', error: String(error), screenshot: page ? shot : null });
    console.error('FAIL ' + name + ': ' + (error.stack || error));
  }
}

async function geometry(page, name, selectors) {
  const data = await page.evaluate((items) => {
    const viewport = document.documentElement.clientWidth;
    const rect = selector => {
      const element = document.querySelector(selector);
      if (!element) return null;
      const r = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return { x: r.x, right: r.right, width: r.width, height: r.height, display: style.display, visibility: style.visibility };
    };
    return { viewport, documentWidth: document.documentElement.scrollWidth, bodyWidth: document.body.scrollWidth,
      parts: Object.fromEntries(items.map(selector => [selector, rect(selector)])) };
  }, selectors);
  assert(data.documentWidth <= data.viewport + 1, `${name}: horizontal page overflow ${JSON.stringify(data)}`);
  for (const selector of selectors) {
    const part = data.parts[selector];
    assert(part && part.width > 0 && part.height > 0 && part.display !== 'none', `${name}: ${selector} unavailable ${JSON.stringify(data)}`);
    assert(part.x >= -1 && part.right <= data.viewport + 1, `${name}: ${selector} outside viewport ${JSON.stringify(data)}`);
  }
  return data;
}

async function login(page, base) {
  await page.goto(base);
  await page.locator('#login-username').fill('doctor');
  await page.locator('#login-password').fill('Doctor@2026');
  await page.locator('#btn-login-submit').click();
  await page.waitForURL('**/#/patients');
  await page.locator('.page-head__title').waitFor();
}

async function assertNoPublicDocsControls(page) {
  const exposed = await page.evaluate(() => [...document.querySelectorAll('a, button')].filter(element => {
    const target = element.getAttribute('href') || '';
    const label = [element.textContent || '', element.getAttribute('title') || '', element.getAttribute('aria-label') || ''].join(' ');
    return /(?:^|\/)api(?:\/|$)|openapi|swagger|redoc/i.test(target) || /tài liệu api|swagger|openapi|redoc/i.test(label);
  }).map(element => element.outerHTML.slice(0, 300)));
  assert.deepEqual(exposed, [], 'public UI must not expose API documentation controls');
}

async function assertNoRuntimeBar(page) {
  const exposed = await page.evaluate(() => ({
    banner: !!document.querySelector('#runtime-banner, .runtime-banner'),
    controls: [...document.querySelectorAll('a, button')].filter(element =>
      /chế độ ngoại tuyến|kiến trúc\s*&\s*sơ đồ|đặt lại dữ liệu cục bộ/i.test(element.textContent || '')
    ).map(element => element.outerHTML.slice(0, 250)),
    text: /chế độ ngoại tuyến trên trình duyệt/i.test(document.body.innerText),
  }));
  assert.deepEqual(exposed, { banner: false, controls: [], text: false },
    'the removed runtime bar must not remain in the DOM or visible UI');
}

async function desktopVerticalMetrics(page) {
  return page.evaluate(() => {
    const box = selector => {
      const element = document.querySelector(selector);
      if (!element) return null;
      const r = element.getBoundingClientRect();
      return { top: r.top, bottom: r.bottom, height: r.height,
        scrollHeight: element.scrollHeight };
    };
    return { viewportHeight: innerHeight, scrollY, documentHeight: document.documentElement.scrollHeight,
      bodyHeight: document.body.scrollHeight, appRoot: box('.app-root'), shell: box('.shell'),
      sidebar: box('.sidebar'), main: box('.main-area') };
  });
}

async function checkDesktopVertical(browser, base, width, height, outputPrefix) {
  const context = await browser.newContext({ viewport: { width, height } });
  const page = await context.newPage();
  try {
    await page.goto(base);
    await page.locator('#login-username').waitFor();
    const loginMetrics = await desktopVerticalMetrics(page);
    await login(page, base);
    await page.evaluate(() => scrollTo(0, 0));
    const top = await desktopVerticalMetrics(page);
    await page.screenshot({ path: path.join(evidence, `${outputPrefix}-${width}x${height}-top.png`), fullPage: true });
    await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
    const bottom = await desktopVerticalMetrics(page);
    await page.screenshot({ path: path.join(evidence, `${outputPrefix}-${width}x${height}-bottom.png`), fullPage: false });
    const metrics = { login: loginMetrics, top, bottom };
    fs.writeFileSync(path.join(evidence, `${outputPrefix}-${width}x${height}-metrics.json`), JSON.stringify(metrics, null, 2));
    assert(loginMetrics.documentHeight <= height + 1,
      `login has avoidable vertical overflow: ${JSON.stringify(loginMetrics)}`);
    await assertNoRuntimeBar(page);
    assert(top.shell && top.sidebar && top.main, `desktop shell missing: ${JSON.stringify(top)}`);
    assert(Math.abs(top.shell.top) <= 1, `shell must start at viewport top: ${JSON.stringify(top)}`);
    assert(top.sidebar.height >= height - 1, `sidebar must fill viewport: ${JSON.stringify(top)}`);
    assert(bottom.sidebar.bottom >= height - 1,
      `sidebar leaves a bottom gap after scroll: ${JSON.stringify(bottom)}`);
    if (top.main.scrollHeight <= height + 1) {
      assert(top.documentHeight <= height + 1,
        `short desktop page has avoidable vertical scroll: ${JSON.stringify(top)}`);
    }
    return metrics;
  } finally { await context.close(); }
}

async function checkAdminNoBar(browser, base) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  try {
    await page.goto(base);
    await page.locator('#login-username').fill('admin');
    await page.locator('#login-password').fill('Admin@2026');
    await page.locator('#btn-login-submit').click();
    await page.waitForURL('**/#/admin/users');
    await page.locator('.page-head__title').waitFor();
    await assertNoRuntimeBar(page);
    await assertNoPublicDocsControls(page);
    return geometry(page, 'admin', ['.main-area', '.workspace', '.page-head__title']);
  } finally { await context.close(); }
}

async function checkWidth(browser, base, width) {
  const context = await browser.newContext({ viewport: { width, height: 800 }, timezoneId: 'Asia/Ho_Chi_Minh' });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  try {
    await check(`login-layout-${width}`, async () => {
      await page.goto(base);
      await page.locator('#login-username').waitFor();
      await assertNoRuntimeBar(page);
      await assertNoPublicDocsControls(page);
      const data = await geometry(page, 'login', ['.login-panel', '.login-card', '#btn-login-submit']);
      await page.screenshot({ path: path.join(evidence, `after-${width}-login.png`), fullPage: true });
      return data;
    }, page);
    await check(`patients-layout-${width}`, async () => {
      await login(page, base);
      await assertNoRuntimeBar(page);
      await assertNoPublicDocsControls(page);
      const selectors = ['.main-area', '.workspace', '.page-head__title', '[data-action="open-create-patient"]'];
      const data = await geometry(page, 'patients', selectors);
      const sidebar = await page.locator('.sidebar').evaluate(element => getComputedStyle(element).display);
      if (width <= 1024) {
        assert.equal(sidebar, 'none', 'narrow viewport uses mobile navigation');
        assert.equal(await page.locator('.mobile-topbar').isVisible(), true);
        assert.equal(await page.locator('#mobile-navigation').isVisible(), false, 'menu starts closed');
        assert(data.parts['.workspace'].width >= Math.min(width - 40, 280), 'main content retains usable width');
        assert.equal(await page.locator('.mobile-cards').isVisible(), true, 'narrow patient list uses cards');
        assert.equal(await page.locator('.table-wrap').isVisible(), false, 'wide table is not forced into narrow page');
      } else {
        assert.notEqual(sidebar, 'none');
        assert.equal(await page.locator('.table-wrap').isVisible(), true);
        assert.equal(await page.locator('.table-wrap').evaluate(el => getComputedStyle(el).overflowX), 'auto', 'table scrolls inside its wrapper');
      }
      await page.screenshot({ path: path.join(evidence, `after-${width}-patients.png`), fullPage: true });
      return { ...data, sidebar };
    }, page);
    if (width <= 1024) {
      await check(`menu-${width}`, async () => {
        const button = page.locator('[data-action="toggle-mobile-menu"]');
        await button.click();
        assert.equal(await button.getAttribute('aria-expanded'), 'true');
        assert.equal(await page.locator('#mobile-navigation').isVisible(), true);
        assert.equal(await page.locator('#mobile-navigation .sidebar__nav .nav-item__label').isVisible(), true);
        const data = await geometry(page, 'mobile menu', ['.mobile-topbar', '#mobile-navigation', '.workspace']);
        await page.keyboard.press('Escape');
        assert.equal(await button.getAttribute('aria-expanded'), 'false');
        assert.equal(await page.locator('#mobile-navigation').isVisible(), false);
        assert.equal(await button.evaluate(element => element === document.activeElement), true, 'Escape returns focus to Menu');
        return data;
      }, page);
    }
    if ([320, 390, 768, 820, 1280].includes(width)) {
      await check(`patient-modal-${width}`, async () => {
        await page.locator('[data-action="open-create-patient"]').first().click();
        await page.locator('#modal-dialog').waitFor({ state: 'visible' });
        const data = await geometry(page, 'patient modal', ['#modal-dialog', '#modal-title']);
        await page.screenshot({ path: path.join(evidence, `after-${width}-modal.png`), fullPage: true });
        await page.locator('#modal-dialog [data-action="close-modal"]').first().click();
        assert.equal(await page.locator('#modal-dialog').isVisible(), false);
        return data;
      }, page);
      await check(`profile-layout-${width}`, async () => {
        const patient = await page.evaluate(async () => (await window.StaticRuntime.listPatients({})).items[0].patient.id);
        await page.evaluate(id => { location.hash = '#/patients/' + id; }, patient);
        await page.locator('[data-action="open-edit-patient"]').waitFor();
        await assertNoRuntimeBar(page);
        await assertNoPublicDocsControls(page);
        const data = await geometry(page, 'profile', ['.main-area', '.workspace', '.page-head__title', '[data-action="open-edit-patient"]']);
        await page.screenshot({ path: path.join(evidence, `after-${width}-profile.png`), fullPage: true });
        return data;
      }, page);
      await check(`encounter-layout-${width}`, async () => {
        await page.evaluate(() => { location.hash = '#/visits/20000000-0000-4000-8000-000000000202'; });
        await page.locator('#enc-clinical-note').waitFor();
        await assertNoRuntimeBar(page);
        await assertNoPublicDocsControls(page);
        const data = await geometry(page, 'encounter', ['.main-area', '.workspace', '#enc-clinical-note', '.encounter-footer', '[data-action="save-draft"]']);
        await page.locator('[data-action="save-draft"]').scrollIntoViewIfNeeded();
        const save = await page.locator('[data-action="save-draft"]').boundingBox();
        assert(save && save.x >= -1 && save.x + save.width <= width + 1, 'save button remains reachable');
        await page.screenshot({ path: path.join(evidence, `after-${width}-encounter.png`), fullPage: true });
        return data;
      }, page);
    }
    if ([320, 390, 768].includes(width)) {
      await check(`narrow-reload-${width}`, async () => {
        await page.reload();
        await page.locator('#enc-clinical-note').waitFor();
        assert.equal(await page.locator('.mobile-topbar').isVisible(), true);
        return geometry(page, 'reload encounter', ['.main-area', '.workspace', '.encounter-footer']);
      }, page);
    }
    assert.deepEqual(errors, [], `browser errors at ${width}`);
  } finally { await context.close(); }
}

async function resizeAndInteract(browser, base) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  try {
    await page.goto(base);
    await login(page, base);
    await page.locator('[data-action="toggle-sidebar"]').click();
    assert.equal(await page.locator('.shell').evaluate(el => el.classList.contains('is-sidebar-collapsed')), true);
    await page.setViewportSize({ width: 390, height: 800 });
    await page.locator('.mobile-topbar').waitFor({ state: 'visible' });
    const menu = page.locator('[data-action="toggle-mobile-menu"]');
    await menu.click();
    assert.equal(await page.locator('#mobile-navigation .sidebar__nav .nav-item__label').isVisible(), true, 'collapsed desktop preference must not hide mobile labels');
    await menu.click();
    await page.evaluate(() => { location.hash = '#/visits/20000000-0000-4000-8000-000000000202'; });
    const note = page.locator('#enc-clinical-note');
    await note.waitFor();
    await note.fill('QA responsive edit');
    await note.focus();
    await note.evaluate(el => el.setSelectionRange(4, 4));
    await note.evaluate(el => { window.__qaOriginalNote = el; });
    await menu.click();
    const afterMenu = await note.evaluate(el => ({ sameNode: el === window.__qaOriginalNote, connected: el.isConnected,
      focused: el === document.activeElement, caret: el.selectionStart, value: el.value }));
    assert.equal(afterMenu.sameNode && afterMenu.connected && afterMenu.caret === 4 && afterMenu.value === 'QA responsive edit', true,
      'menu must keep form node, caret and value: ' + JSON.stringify(afterMenu));
    await page.keyboard.press('Escape');
    assert.match(await page.locator('.encounter-footer__status .badge').innerText(), /chưa lưu/i);
    await page.evaluate(() => { location.hash = '#/patients'; });
    await page.locator('#modal-dialog').waitFor({ state: 'visible' });
    assert.match(await page.locator('#modal-title').innerText(), /thay đổi chưa lưu/i);
    await page.locator('#modal-dialog [data-action="close-modal"]').first().click();
    assert.equal(await note.inputValue(), 'QA responsive edit');
    await page.locator('[data-action="save-draft"]').click();
    await page.waitForFunction(() => document.querySelector('.encounter-footer__status .badge')?.textContent?.includes('Đã lưu'));
    await page.setViewportSize({ width: 1280, height: 800 });
    await geometry(page, 'desktop after resize', ['.main-area', '.workspace', '.encounter-footer']);
    await page.screenshot({ path: path.join(evidence, 'after-resize-save.png'), fullPage: true });
    await page.reload();
    await note.waitFor();
    await assertNoRuntimeBar(page);
    assert.equal(await note.inputValue(), 'QA responsive edit', 'saved draft survives wide reload');
    await geometry(page, 'desktop after reload', ['.main-area', '.workspace', '.encounter-footer']);
    return { saved: await note.inputValue(), desktopSidebarCollapsed: await page.locator('.shell').evaluate(el => el.classList.contains('is-sidebar-collapsed')) };
  } finally { await context.close(); }
}

(async () => {
  assert(fs.statSync(root).isDirectory(), `Missing built bundle: ${root}`);
  fs.mkdirSync(evidence, { recursive: true });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_BIN ? { executablePath: process.env.BROWSER_BIN } : {}) });
  try {
    for (const [width, height] of [[1280, 900], [1536, 696], [1920, 900]]) {
      await check(`desktop-vertical-${width}x${height}`, () =>
        checkDesktopVertical(browser, base, width, height, process.env.QA_OUTPUT_PREFIX || 'after'));
    }
    if (process.env.QA_ONLY_BAR !== '1') {
      await check('admin-runtime-bar-absent', () => checkAdminNoBar(browser, base));
      await check('public-api-docs-absent', async () => {
        for (const pathname of apiPaths) {
          const response = await fetch(base + pathname);
          assert.equal(response.status, 404, `${pathname} must not be public`);
        }
        const architecture = await fetch(base + '/docs/');
        assert.equal(architecture.status, 200, 'architecture page remains available');
        const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
        assert(!/href\s*=\s*["'][^"']*(?:\/api\/|openapi)/i.test(html), 'entry page must not link API docs');
        return { checked: apiPaths, architecture: architecture.status };
      });
      for (const width of widths) await checkWidth(browser, base, width);
      await check('resize-collapse-menu-dirty-save', () => resizeAndInteract(browser, base));
    }
    console.log(`RESULT pass=${results.filter(x => x.status === 'PASS').length} fail=${failures.length}`);
  } finally {
    fs.writeFileSync(path.join(evidence, 'responsive-results.json'), JSON.stringify({ root, results, failures }, null, 2));
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
  if (failures.length) process.exitCode = 1;
})().catch(error => { console.error(error); process.exitCode = 1; server.close(); });
