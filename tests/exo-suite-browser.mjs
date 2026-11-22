import assert from 'node:assert/strict';import {mkdir} from 'node:fs/promises';import {chromium} from 'playwright';
await mkdir('artifacts/exo-suite',{recursive:true});const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:960}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8765/');await page.locator('[data-session-tab="create"]').click();await page.locator('#libraryNew').click();await page.locator('#modal').waitFor({state:'hidden'});
 const ids=['exostrip','exofocus','exoair','exospace'];
 for(const id of ids){
  await page.locator('#openMastering').click();await page.locator('#masteringView [data-add-insert-track="master"]').click();
  await page.locator('#pickerBundle').selectOption('EXO');await page.locator('#pickerMode').selectOption('presets');assert.equal(await page.locator('[data-picker-preset^="vector"]').count(),0);
  await page.locator('[data-picker-preset="'+id+'"]').first().click();await page.locator('#modal').waitFor({state:'hidden'});
 }
 const master=page.locator('#masteringView');
 for(const [id,count] of [['exostrip',10],['exofocus',7],['exoair',4],['exospace',6]]){
  const module=master.locator('.master-module').filter({has:page.locator('[data-master-power="'+id+'"]')});
  assert.equal(await module.locator('[data-master-param]').count(),count);assert.ok(await module.locator('.exo-suite-presets').isVisible());
 }
 const ambience=master.locator('.exo-space-hardware');
 await ambience.locator('.exo-suite-presets select').selectOption('1');assert.equal(await ambience.locator('[data-master-param="exospace.predelay"]').inputValue(),'45');
 await ambience.locator('.exo-suite-presets input').fill('Suite QA');await ambience.locator('[data-exo-space-save]').click();
 assert.ok((await ambience.locator('.exo-suite-presets select').innerText()).includes('Suite QA'));
 const bank=await page.evaluate(()=>JSON.parse(localStorage.getItem('warlike.plugin.user-presets.v1')));assert.ok(bank.some(p=>p.name==='Suite QA'&&p.plugin==='exospace'&&p.values.predelay===45));
 for(const theme of ['forest','graphite','slate','light']){await page.locator('.top-actions [data-studio-theme]').selectOption(theme);await page.screenshot({path:'artifacts/exo-suite/'+theme+'.png'});}
 await page.locator('#projectMenuBtn').click();const pending=page.waitForEvent('download');await page.locator('#saveProject').click();const file=await pending;await file.saveAs('artifacts/exo-suite/chain.chayah');
 const {readFile}=await import('node:fs/promises');const saved=JSON.parse(await readFile('artifacts/exo-suite/chain.chayah','utf8'));
 assert.deepEqual(saved.project.mastering.inserts.filter(Boolean),ids);assert.equal(saved.project.mastering.exospace.predelay,45);
 // Mastering rebuilds its hardware on resize; reacquire the live EXO panel.
 await page.setViewportSize({width:390,height:844});
 await page.waitForFunction(()=>{
  const face=document.querySelector('#masteringView .exo-space-hardware');
  if(!face?.isConnected)return false;
  face.scrollIntoView({block:'nearest',inline:'nearest'});
  const rect=face.getBoundingClientRect();
  return rect.width>0&&rect.width<=innerWidth;
 });
 await ambience.waitFor({state:'visible'});
 // The browser-side layout assertion above reads a live DOM node. Do not
 // measure an ElementHandle that may be replaced by a debounced Mastering rerender.
 assert.equal(await ambience.locator('[data-master-param="exospace.predelay"]').inputValue(),'45');
 await page.screenshot({path:'artifacts/exo-suite/mobile.png'});
 await page.setViewportSize({width:1440,height:960});
 await page.locator('[data-view="mixer"]').click();await page.locator('#mixerView [data-mixer-track]').first().locator('.insert-slot.empty [data-insert-slot]').first().click();
 await page.locator('#pickerBundle').selectOption('EXO');await page.locator('#pickerMode').selectOption('presets');await page.locator('#pluginSearch').fill('Suite QA');
 await page.locator('[data-picker-preset="exospace"]').click();await page.locator('#modal').waitFor({state:'hidden'});
 const track=page.locator('#pluginFloat .exo-space-hardware');await track.waitFor();assert.equal(await track.locator('[data-param="exospace.predelay"]').inputValue(),'45');
 assert.deepEqual(errors,[]);console.log('PASS: four live EXO surfaces, factory picker, user preset, chain order, project persistence, four themes and mobile');
}finally{await browser.close();}
