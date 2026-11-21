import assert from 'node:assert/strict';import {mkdir} from 'node:fs/promises';import {chromium} from 'playwright';
await mkdir('artifacts/vector-suite',{recursive:true});const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:960}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8765/');await page.locator('[data-session-tab="create"]').click();await page.locator('#libraryNew').click();await page.locator('#modal').waitFor({state:'hidden'});
 const ids=['vectoreq','vectorcomp','vectorlimit'];
 for(const id of ids){
  await page.locator('#openMastering').click();await page.locator('#masteringView [data-add-insert-track="master"]').click();
  await page.locator('#pickerBundle').selectOption('VECTOR');await page.locator('#pickerMode').selectOption('presets');
  await page.locator('[data-picker-preset="'+id+'"]').first().click();await page.locator('#modal').waitFor({state:'hidden'});
 }
 const master=page.locator('#masteringView');
 for(const [id,count] of [['vectoreq',19],['vectorcomp',7],['vectorlimit',3]]){
  const module=master.locator('.master-module').filter({has:page.locator('[data-master-power="'+id+'"]')});
  assert.equal(await module.locator('[data-master-param]').count(),count);assert.ok(await module.locator('.vector-master-presets').isVisible());
 }
 const limit=master.locator('.vector-limit-hardware');
 await limit.locator('.vector-master-presets select').selectOption('1');assert.equal(await limit.locator('[data-master-param="vectorlimit.drive"]').inputValue(),'2');
 await limit.locator('.vector-master-presets input').fill('Suite QA');await limit.locator('[data-vector-save]').click();
 assert.ok((await limit.locator('.vector-master-presets select').innerText()).includes('Suite QA'));
 const bank=await page.evaluate(()=>JSON.parse(localStorage.getItem('warlike.plugin.user-presets.v1')));assert.ok(bank.some(p=>p.name==='Suite QA'&&p.plugin==='vectorlimit'&&p.values.drive===2));
 for(const theme of ['forest','graphite','slate','light']){await page.locator('.top-actions [data-studio-theme]').selectOption(theme);await page.screenshot({path:'artifacts/vector-suite/'+theme+'.png'});}
 await page.locator('#projectMenuBtn').click();const pending=page.waitForEvent('download');await page.locator('#saveProject').click();const file=await pending;await file.saveAs('artifacts/vector-suite/chain.chayah');
 const {readFile}=await import('node:fs/promises');const saved=JSON.parse(await readFile('artifacts/vector-suite/chain.chayah','utf8'));
 assert.deepEqual(saved.project.mastering.inserts.filter(Boolean),ids);assert.equal(saved.project.mastering.vectorlimit.drive,2);
 await page.setViewportSize({width:390,height:844});await limit.scrollIntoViewIfNeeded();assert.ok((await limit.boundingBox()).width<=390);await page.screenshot({path:'artifacts/vector-suite/mobile.png'});
 assert.deepEqual(errors,[]);console.log('PASS: three live VECTOR surfaces, factory picker, user preset, chain order, project persistence, four themes and mobile');
}finally{await browser.close();}
