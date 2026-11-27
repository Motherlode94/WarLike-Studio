import {selectMasterModule,closeMasterRack} from './master-rack-helpers.mjs';
import {chooseFolderPreset} from './preset-picker-helpers.mjs';
import assert from 'node:assert/strict';import {mkdir} from 'node:fs/promises';import {chromium} from 'playwright';
await mkdir('artifacts/circuit-suite',{recursive:true});const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:960}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8765/');await page.locator('[data-session-tab="create"]').click();await page.locator('#libraryNew').click();await page.locator('#modal').waitFor({state:'hidden'});
 const ids=['circuiteq','circuitbus','circuitcolor'];
 for(const id of ids){
  await page.locator('#openMastering').click();await page.locator('#masteringView [data-add-insert-track="master"]').click();
  await page.locator('#pickerBundle').selectOption('CIRCUIT');await page.locator('#pickerMode').selectOption('presets');assert.equal(await page.locator('[data-picker-preset^="vector"]').count(),0);
  await chooseFolderPreset(page.locator('[data-picker-preset="'+id+'"]').first());await page.locator('#modal').waitFor({state:'hidden'});
 }
 const master=page.locator('#masteringView');
 for(const [id,count] of [['circuiteq',9],['circuitbus',7],['circuitcolor',5]]){
  await selectMasterModule(page,id);
  const module=master.locator('.master-module').filter({has:page.locator('[data-master-power="'+id+'"]')});
  assert.equal(await module.locator('[data-master-param]').count(),count);assert.ok(await module.locator('.circuit-master-presets').isVisible());
 }
 const color=master.locator('.circuit-color-hardware');
 await color.locator('.circuit-master-presets select').selectOption('1');assert.equal(await color.locator('[data-master-param="circuitcolor.drive"]').inputValue(),'8');
 await color.locator('.circuit-master-presets input').fill('Suite QA');await color.locator('[data-circuit-save]').click();
 assert.ok((await color.locator('.circuit-master-presets select').innerText()).includes('Suite QA'));
 const bank=await page.evaluate(()=>JSON.parse(localStorage.getItem('warlike.plugin.user-presets.v1')));assert.ok(bank.some(p=>p.name==='Suite QA'&&p.plugin==='circuitcolor'&&p.values.drive===8));
 for(const theme of ['forest','graphite','slate','light']){await page.locator('.top-actions [data-studio-theme]').selectOption(theme);await page.screenshot({path:'artifacts/circuit-suite/'+theme+'.png'});}
 await page.locator('#projectMenuBtn').click();const pending=page.waitForEvent('download');await page.locator('#saveProject').click();const file=await pending;await file.saveAs('artifacts/circuit-suite/chain.chayah');
 const {readFile}=await import('node:fs/promises');const saved=JSON.parse(await readFile('artifacts/circuit-suite/chain.chayah','utf8'));
 assert.deepEqual(saved.project.mastering.inserts.filter(Boolean),ids);assert.equal(saved.project.mastering.circuitcolor.drive,8);
 await page.setViewportSize({width:390,height:844});await color.scrollIntoViewIfNeeded();assert.ok((await color.boundingBox()).width<=390);await page.screenshot({path:'artifacts/circuit-suite/mobile.png'});
 assert.deepEqual(errors,[]);console.log('PASS: three live CIRCUIT surfaces, factory picker, user preset, chain order, project persistence, four themes and mobile');
}finally{await browser.close();}
