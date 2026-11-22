import assert from 'node:assert/strict';import {mkdir} from 'node:fs/promises';import {chromium} from 'playwright';
await mkdir('artifacts/expansion-hardware',{recursive:true});const browser=await chromium.launch({headless:true});
try{const page=await browser.newPage({viewport:{width:1440,height:960}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:8765/');await page.locator('[data-session-tab="create"]').click();await page.locator('#libraryNew').click();await page.locator('#modal').waitFor({state:'hidden'});
 const defs=await page.evaluate(async()=>Object.entries((await import('/wl-expansion.js')).EXPANSION_INSTRUMENTS).map(([id,definition])=>({...definition,id})));await page.locator('[data-view="library"]').click();await page.locator('[data-bank-tab="packs"]').click();await page.locator('#bankFilter').selectOption('wlexpansion');assert.equal(defs.length,10);assert.equal(new Set(defs.map(d=>d.id)).size,10);assert.deepEqual((await page.locator('#contentCards [data-suite-instrument]').evaluateAll(nodes=>nodes.map(n=>n.dataset.suiteInstrument))).sort(),defs.map(d=>d.id).sort());
 for(const d of defs){await page.locator('#contentCards [data-suite-instrument="'+d.id+'"]').click();const face=page.locator('#pluginFloat [data-expansion-instrument="'+d.id+'"]');await face.waitFor();assert.equal(await face.locator('[data-param]').count(),d.controls.length);assert.equal(await page.locator('#pluginFloat #suitePreset option').count(),12);
 const input=face.locator('[data-param="instrument.attack"]'),before=await face.locator('[data-expansion-envelope] path.signal').getAttribute('d');await input.evaluate(el=>{el.value='.5';el.dispatchEvent(new Event('input',{bubbles:true}));});await page.waitForFunction(({id,before})=>document.querySelector('[data-expansion-instrument="'+id+'"] [data-expansion-envelope] path.signal')?.getAttribute('d')!==before,{id:d.id,before});await page.locator('#pluginFloat #suitePreset').selectOption('10');await face.waitFor();assert.equal(await face.locator('[data-param]').count(),d.controls.length);await face.scrollIntoViewIfNeeded();await page.screenshot({path:'artifacts/expansion-hardware/'+d.id+'.png'});await page.locator('#pluginFloat [data-float-close]').click();await page.locator('[data-view="library"]').click();await page.locator('[data-bank-tab="packs"]').click();await page.locator('#bankFilter').selectOption('wlexpansion');}
 // Keep the instrument open during a real viewport transition. The host
 // intentionally rebuilds its plugin DOM in the debounced resize handler.
 await page.locator('#contentCards [data-suite-instrument="wltonewheel"]').click();
 const mobile=page.locator('#pluginFloat [data-expansion-instrument="wltonewheel"]');await mobile.waitFor();
 const desktopFace=await mobile.elementHandle();assert.ok(desktopFace);
 await page.setViewportSize({width:390,height:844});
 await page.waitForFunction(previous=>innerWidth===390&&!previous.isConnected,desktopFace);
 await desktopFace.dispose();
 await mobile.waitFor({state:'visible'});
 assert.equal(await mobile.locator('[data-param]').count(),defs.find(d=>d.id==='wltonewheel').controls.length);
 assert.equal(await page.locator('#pluginFloat #suitePreset option').count(),12);
 await page.waitForFunction(()=>{const face=document.querySelector('#pluginFloat [data-expansion-instrument="wltonewheel"]');if(!face||!face.isConnected)return false;face.scrollIntoView({block:'nearest',inline:'nearest'});const rect=face.getBoundingClientRect();return rect.width>0&&rect.width<=innerWidth;});
 await page.screenshot({path:'artifacts/expansion-hardware/mobile.png'});assert.deepEqual(errors,[]);
}finally{await browser.close();}
