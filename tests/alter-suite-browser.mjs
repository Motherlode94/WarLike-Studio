import {chooseFolderPreset} from './preset-picker-helpers.mjs';
import assert from 'node:assert/strict';import {mkdir} from 'node:fs/promises';import {chromium} from 'playwright';
await mkdir('artifacts/alter-suite',{recursive:true});const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:960}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8765/');await page.locator('[data-session-tab="create"]').click();await page.locator('#libraryNew').click();await page.locator('#modal').waitFor({state:'hidden'});
 const ids=['alterdouble','alterecho','alterfilter'];
 for(const id of ids){
  await page.locator('#openMastering').click();await page.locator('#masteringView [data-add-insert-track="master"]').click();
  await page.locator('#pickerBundle').selectOption('ALTER');await page.locator('#pickerMode').selectOption('presets');assert.equal(await page.locator('[data-picker-preset^="vector"]').count(),0);
  await chooseFolderPreset(page.locator('[data-picker-preset="'+id+'"]').first());await page.locator('#modal').waitFor({state:'hidden'});
 }
 const master=page.locator('#masteringView');
 for(const [id,count] of [['alterdouble',6],['alterecho',5],['alterfilter',5]]){
  const module=master.locator('.master-module').filter({has:page.locator('[data-master-power="'+id+'"]')});
  assert.equal(await module.locator('[data-master-param]').count(),count);assert.ok(await module.locator('.alter-pro-presets').isVisible());assert.equal(await module.locator('.alter-pro-presets optgroup[label="Usine"] option').count(),5);
 }
 const ambience=master.locator('.alter-filter-hardware');
 await ambience.locator('.alter-pro-presets select').selectOption('2');assert.equal(await ambience.locator('[data-master-param="alterfilter.cutoff"]').inputValue(),'600');
 await ambience.locator('.alter-pro-presets input').fill('Suite QA');await ambience.locator('[data-alter-save]').click();
 assert.ok((await ambience.locator('.alter-pro-presets select').innerText()).includes('Suite QA'));
 const bank=await page.evaluate(()=>JSON.parse(localStorage.getItem('warlike.plugin.user-presets.v1')));assert.ok(bank.some(p=>p.name==='Suite QA'&&p.plugin==='alterfilter'&&p.values.cutoff===600));
 for(const theme of ['forest','graphite','slate','light']){await page.locator('.top-actions [data-studio-theme]').selectOption(theme);await page.screenshot({path:'artifacts/alter-suite/'+theme+'.png'});}
 await page.locator('#projectMenuBtn').click();const pending=page.waitForEvent('download');await page.locator('#saveProject').click();const file=await pending;await file.saveAs('artifacts/alter-suite/chain.chayah');
 const {readFile}=await import('node:fs/promises');const saved=JSON.parse(await readFile('artifacts/alter-suite/chain.chayah','utf8'));
 assert.deepEqual(saved.project.mastering.inserts.filter(Boolean),ids);assert.equal(saved.project.mastering.alterfilter.cutoff,600);
 // Reopen the actual portable file in a fresh browser context (no session storage dependency).
 const fresh=await browser.newPage({viewport:{width:1440,height:960}});fresh.on('pageerror',e=>errors.push(e.message));await fresh.goto('http://127.0.0.1:8765/');await fresh.locator('html[data-app-ready="true"]').waitFor({state:'attached'});await fresh.locator('[data-session-tab="create"]').waitFor();await fresh.locator('#projectInput').setInputFiles('artifacts/alter-suite/chain.chayah');await fresh.waitForFunction(()=>/Projet importé et sauvegardé|Ouverture impossible/.test(document.getElementById('toast').textContent));assert.equal(await fresh.locator('#toast').textContent(),'Projet importé et sauvegardé.');await fresh.locator('#modal').waitFor({state:'hidden'});await fresh.locator('#openMastering').click();await fresh.locator('#masteringView .alter-filter-hardware').waitFor();assert.equal(await fresh.locator('[data-master-param="alterfilter.cutoff"]').inputValue(),'600');assert.deepEqual(await fresh.locator('#masteringView [data-master-power]').evaluateAll(nodes=>nodes.map(n=>n.dataset.masterPower).filter(id=>id.startsWith('alter'))),ids);await fresh.close();
 await page.setViewportSize({width:390,height:844});await ambience.scrollIntoViewIfNeeded();assert.ok((await ambience.boundingBox()).width<=390);await page.screenshot({path:'artifacts/alter-suite/mobile.png'});
 await page.setViewportSize({width:1440,height:960});
 await page.locator('[data-view="mixer"]').click();await page.locator('#mixerView [data-mixer-track]').first().locator('.insert-slot.empty [data-insert-slot]').first().click();
 await page.locator('#pickerBundle').selectOption('ALTER');await page.locator('#pickerMode').selectOption('presets');await page.locator('#pluginSearch').fill('Suite QA');
 await chooseFolderPreset(page.locator('[data-picker-preset="alterfilter"]'));await page.locator('#modal').waitFor({state:'hidden'});
 const track=page.locator('#pluginFloat .alter-filter-hardware');await track.waitFor();assert.equal(await track.locator('[data-param="alterfilter.cutoff"]').inputValue(),'600');
 assert.deepEqual(errors,[]);console.log('PASS: three live ALTER surfaces, factory picker, user preset, chain order, project persistence, four themes and mobile');
}finally{await browser.close();}
