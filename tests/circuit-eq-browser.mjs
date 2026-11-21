import assert from 'node:assert/strict';import {mkdir} from 'node:fs/promises';import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true});await mkdir('artifacts/circuit-eq',{recursive:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:960}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8765/');await page.locator('[data-session-tab="create"]').click();await page.locator('#libraryNew').click();await page.locator('#modal').waitFor({state:'hidden'});
 await page.locator('[data-view="mixer"]').click();await page.locator('#mixerView [data-mixer-track]').first().locator('[data-add-insert-track]').click();
 await page.locator('#pluginSearch').fill('CIRCUIT EQ');await page.locator('[data-picker-load="circuiteq"]').click();await page.locator('#modal').waitFor({state:'hidden'});
 const face=page.locator('#pluginFloat .circuit-eq-hardware');await face.waitFor();assert.equal(await face.locator('[data-param]').count(),9);assert.equal(await face.locator('[data-circuit-band]').count(),4);
 const path=face.locator('.eq-response'),before=await path.getAttribute('points');await face.locator('[data-param="circuiteq.presence"]').evaluate(el=>{el.value='6';el.dispatchEvent(new Event('input',{bubbles:true}));});
 await page.waitForFunction(p=>document.querySelector('#pluginFloat .eq-response').getAttribute('points')!==p,before);
 const point=face.locator('[data-eq-band="2"]');await point.focus();await page.keyboard.press('ArrowUp');assert.equal(await face.locator('[data-param="circuiteq.presence"]').inputValue(),'6.5');assert.equal(await point.evaluate(el=>document.activeElement===el),true);
 const originalPoint=await point.elementHandle();
 // Repeated edits and the asynchronous state watcher must preserve node identity.
 await page.keyboard.press('ArrowUp');await page.keyboard.press('ArrowUp');
 assert.equal(await face.locator('[data-param="circuiteq.presence"]').inputValue(),'7.5');
 await page.waitForFunction(el=>el.isConnected&&document.activeElement===el,originalPoint);
 await page.keyboard.press('ArrowDown');assert.equal(await face.locator('[data-param="circuiteq.presence"]').inputValue(),'7');
 assert.equal(await originalPoint.evaluate(el=>el.isConnected&&document.activeElement===el),true);
 await originalPoint.dispose();
 assert.equal(await face.locator('[data-circuit-q="2"]').textContent(),'AUTO Q 1.90');
 await page.screenshot({path:'artifacts/circuit-eq/track.png'});await page.locator('#pluginFloat [data-float-close]').click();
 await page.locator('#mixerView .mixer-master [data-add-insert-track="master"]').click();await page.locator('#pluginSearch').fill('CIRCUIT EQ');await page.locator('[data-picker-load="circuiteq"]').click();await page.locator('#modal').waitFor({state:'hidden'});
 const master=page.locator('#masteringView .circuit-eq-hardware');await master.waitFor();assert.equal(await master.locator('[data-master-param]').count(),9);
 const masterBefore=await master.locator('.eq-response').getAttribute('points');await master.locator('[data-master-param="circuiteq.low"]').evaluate(el=>{el.value='-4';el.dispatchEvent(new Event('input',{bubbles:true}));});
 await page.waitForFunction(p=>document.querySelector('#masteringView .eq-response').getAttribute('points')!==p,masterBefore);
 await page.screenshot({path:'artifacts/circuit-eq/master.png'});await page.setViewportSize({width:390,height:844});await master.scrollIntoViewIfNeeded();assert.ok((await master.boundingBox()).width<=390);
 await page.screenshot({path:'artifacts/circuit-eq/mobile.png'});assert.deepEqual(errors,[]);console.log('PASS: 9 original controls, four banks, graph/knob synchronization, keyboard and master/mobile');
}finally{await browser.close();}
