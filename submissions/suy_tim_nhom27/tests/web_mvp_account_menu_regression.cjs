'use strict';
// Browser regression against the exported static site with synthetic accounts.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require('playwright');

const root = path.resolve(process.env.WEB_MVP_ROOT || path.join(__dirname, '../.dist-pages'));
const evidence = path.resolve(process.env.QA_OUTPUT_DIR || path.join(__dirname, '../.context-shears/account-menu-qa'));
const mime = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json'};
const server = http.createServer((request,response)=>{
  let pathname;
  try { pathname = decodeURIComponent(new URL(request.url,'http://localhost').pathname); }
  catch (_) { response.writeHead(400); response.end(); return; }
  const file = path.resolve(root,'.'+(pathname.endsWith('/') ? pathname+'index.html' : pathname));
  if (!file.startsWith(root+path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    response.writeHead(404); response.end('Not found'); return;
  }
  response.setHeader('Content-Type',mime[path.extname(file)] || 'text/plain; charset=utf-8');
  response.end(fs.readFileSync(file));
});
let browser,base,pass=0,fail=0;

async function run(name,fn,{width=1280,height=800,username='doctor',password='Doctor@2026'}={}) {
  const context=await browser.newContext({viewport:{width,height},timezoneId:'Asia/Ho_Chi_Minh'});
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  try {
    await page.goto(base);
    await page.locator('#login-username').fill(username);
    await page.locator('#login-password').fill(password);
    await page.locator('#btn-login-submit').click();
    await page.waitForURL(username==='admin'?'**/#/admin/users':'**/#/patients');
    await page.locator(username==='admin' ? '.data-table tbody tr' : '.record-card').first().waitFor({state:'attached'});
    await fn(page);
    assert.deepEqual(errors,[],'browser page errors');
    pass++;
    console.log('PASS '+name);
  } catch(error) {
    fail++;
    console.error('FAIL '+name+': '+(error.stack||error));
    await page.screenshot({path:path.join(evidence,'FAIL-'+name.replace(/[^a-z0-9]+/gi,'-')+'.png'),fullPage:true}).catch(()=>{});
  } finally { await context.close(); }
}
function trigger(page,width) {
  return page.locator(width<=1024
    ? '.mobile-topbar [data-action="toggle-account-menu"]'
    : '.sidebar [data-action="toggle-account-menu"]');
}
function menu(page) { return page.locator('#account-menu[role="menu"]'); }
async function open(page,width) {
  const button=trigger(page,width);
  assert.equal(await button.getAttribute('aria-haspopup'),'menu');
  assert.equal(await button.getAttribute('aria-controls'),'account-menu');
  assert.equal(await button.getAttribute('aria-expanded'),'false');
  await button.click();
  await menu(page).waitFor({state:'visible'});
  assert.equal(await button.getAttribute('aria-expanded'),'true');
  return button;
}
async function closed(page,width) {
  await menu(page).waitFor({state:'hidden'});
  assert.equal(await trigger(page,width).getAttribute('aria-expanded'),'false');
}
async function assertBounds(page,width,height) {
  const boxes=await page.evaluate(()=>{
    const box=element=>{const r=element.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height};};
    return {scrollWidth:document.documentElement.scrollWidth, menu:box(document.querySelector('#account-menu')),
      items:[...document.querySelectorAll('#account-menu [role="menuitem"]')].map(box)};
  });
  assert(boxes.scrollWidth<=width+1,JSON.stringify(boxes));
  for(const box of [boxes.menu,...boxes.items]) {
    assert(box.width>0 && box.height>0 && box.left>=-1 && box.right<=width+1 && box.top>=-1 && box.bottom<=height+1,JSON.stringify(boxes));
  }
}

(async()=>{
  fs.mkdirSync(evidence,{recursive:true});
  assert(fs.existsSync(path.join(root,'index.html')),'built site missing: '+root);
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  base='http://127.0.0.1:'+server.address().port+'/';
  browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_BIN||undefined});
  try {
    for(const [width,height] of [[320,568],[390,690],[768,800],[820,800],[1024,800],[1280,800],[1536,696]]) {
      await run('doctor menu bounds '+width+'x'+height,async page=>{
        assert.equal(await menu(page).isVisible(),false,'closed by default');
        assert.equal(await page.locator('.topbar [data-action="logout"],.topbar [data-action="open-change-password"],#mobile-navigation [data-action="logout"],#mobile-navigation [data-action="open-change-password"]').count(),0,'old controls removed');
        await open(page,width);
        assert.equal(await menu(page).locator('[role="menuitem"]').count(),2);
        await assertBounds(page,width,height);
        await page.screenshot({path:path.join(evidence,'account-menu-'+width+'x'+height+'.png')});
        await page.keyboard.press('Escape');
        await closed(page,width);
        assert(await trigger(page,width).evaluate(el=>el===document.activeElement),'Escape restores trigger focus');
        await page.reload();
        await trigger(page,width).waitFor();
        assert.equal(await menu(page).isVisible(),false,'reload closes menu');
      },{width,height});
    }
    await run('collapsed sidebar avatar and resize',async page=>{
      await page.locator('[data-action="toggle-sidebar"]').click();
      const button=trigger(page,1280);
      assert(await button.isVisible(),'collapsed avatar remains visible');
      await open(page,1280);
      await assertBounds(page,1280,800);
      await page.setViewportSize({width:390,height:690});
      await closed(page,390);
      await open(page,390);
      await assertBounds(page,390,690);
      await page.setViewportSize({width:1280,height:800});
      await closed(page,1280);
    });
    await run('outside click Tab scroll and route close menu',async page=>{
      await open(page,1280);
      await page.locator('#main-workspace').click({position:{x:5,y:5}});
      await closed(page,1280);
      await open(page,1280);
      await page.keyboard.press('Tab');
      await closed(page,1280);
      await page.evaluate(()=>{location.hash='#/visits/20000000-0000-4000-8000-000000000202';});
      await page.locator('#enc-clinical-note').waitFor();
      await open(page,1280);
      await page.evaluate(()=>window.scrollBy(0,100));
      await closed(page,1280);
      await open(page,1280);
      await page.evaluate(()=>{location.hash='#/patients';});
      await page.waitForURL('**/#/patients');
      await closed(page,1280);
    });
    await run('keyboard opens menu and restores focus',async page=>{
      const button=trigger(page,1280);
      await button.focus();
      await page.keyboard.press('Enter');
      await menu(page).waitFor({state:'visible'});
      assert(await menu(page).evaluate(el=>el.contains(document.activeElement)),'menu takes keyboard focus');
      await page.keyboard.press('Escape');
      await closed(page,1280);
      assert(await button.evaluate(el=>el===document.activeElement),'Escape returns focus to trigger');
      await page.keyboard.press('Space');
      await menu(page).waitFor({state:'visible'});
      await page.keyboard.press('Escape');
      await closed(page,1280);
    });
    await run('doctor password action preserves dirty editor',async page=>{
      await page.evaluate(()=>{location.hash='#/visits/20000000-0000-4000-8000-000000000202';});
      const note=page.locator('#enc-clinical-note');
      await note.waitFor();
      await note.fill('QA account menu keeps editor');
      await note.evaluate(el=>{el.setSelectionRange(8,8);window.__qaEditor=el;});
      const button=await open(page,1280);
      assert.equal(await note.inputValue(),'QA account menu keeps editor');
      assert(await note.evaluate(el=>el===window.__qaEditor),'menu toggle does not replace editor node');
      await menu(page).locator('[data-action="open-change-password"]').click();
      await closed(page,1280);
      const dialog=page.getByRole('dialog',{name:'Đổi mật khẩu'});
      await dialog.waitFor();
      await page.keyboard.press('Escape');
      await dialog.waitFor({state:'hidden'});
      assert(await button.evaluate(el=>el===document.activeElement),'dialog returns focus to account trigger');
      assert.equal(await note.inputValue(),'QA account menu keeps editor');
      assert.equal(await note.evaluate(el=>el.selectionStart),8);
      assert(await note.evaluate(el=>el===window.__qaEditor),'dialog does not replace editor node');
    });
    for(const [width,height,username,password] of [[320,568,'doctor','Doctor@2026'],[1280,800,'doctor','Doctor@2026'],[390,690,'admin','Admin@2026'],[1280,800,'admin','Admin@2026']]) {
      await run('logout '+username+' '+width,async page=>{
        await open(page,width);
        assert.equal(await menu(page).locator('[role="menuitem"][data-action="open-change-password"]').count(),username==='admin'?0:1);
        assert.equal(await menu(page).locator('[role="menuitem"][data-action="logout"]').count(),1);
        assert.notEqual(new URL(page.url()).hash,'#/login','opening chip does not log out');
        await menu(page).locator('[data-action="logout"]').click();
        await page.waitForURL('**/#/login');
      },{width,height,username,password});
    }
  } finally {
    await browser.close();
    await new Promise(resolve=>server.close(resolve));
  }
  console.log(`RESULT pass=${pass} fail=${fail}`);
  if(fail) process.exitCode=1;
})().catch(error=>{console.error(error.stack||error);process.exitCode=1;server.close();});
