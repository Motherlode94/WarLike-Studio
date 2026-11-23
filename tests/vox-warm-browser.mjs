import {chooseFolderPreset} from './preset-picker-helpers.mjs';
import assert from 'node:assert/strict';import {mkdir} from 'node:fs/promises';import {chromium} from 'playwright';
await mkdir('artifacts/vox-warm',{recursive:true});const browser=await chromium.launch({headless:true});try{
 const page=await browser.newPage({viewport:{width:1440,height:960}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8765/');await page.locator('[data-session-tab="create"]').click();await page.locator('#libraryNew').click();await page.locator('#modal').waitFor({state:'hidden'});
 await page.locator('[data-view="mixer"]').click();await page.locator('#mixerView [data-mixer-track]').first().locator('.insert-slot.empty [data-insert-slot]').first().click();
 await page.locator('#pluginSearch').fill('VOX WARM');await page.locator('[data-picker-load="voxwarm"]').click();await page.locator('#modal').waitFor({state:'hidden'});
 const face=page.locator('#pluginFloat .vox-warm-hardware');await face.waitFor();assert.equal(await face.locator('[data-param]').count(),5);
 await face.locator('[data-param="voxwarm.drive"]').evaluate((el,v)=>{el.value=v;el.dispatchEvent(new Event('input',{bubbles:true}));},'12');
 await page.waitForFunction(({selector,value})=>document.querySelector('#pluginFloat '+selector)?.textContent===value,{selector:'[data-warm-drive]',value:'DRIVE 12.0 dB'});
 const previous=await face.locator('[data-warm-curve]').getAttribute('d');await face.locator('[data-param="voxwarm.bias"]').evaluate(el=>{el.value='-.5';el.dispatchEvent(new Event('input',{bubbles:true}));});await page.waitForFunction(p=>document.querySelector('#pluginFloat [data-warm-curve]').getAttribute('d')!==p,previous);
 await page.screenshot({path:'artifacts/vox-warm/track.png'});await page.locator('#pluginFloat [data-float-close]').click();
 await page.locator('#mixerView .mixer-master .insert-slot.empty [data-insert-slot]').first().click();await page.locator('#pickerBundle').selectOption('VOX LAB');await page.locator('#pickerMode').selectOption('presets');await chooseFolderPreset(page.locator('[data-picker-preset="voxwarm"]').first());await page.locator('#modal').waitFor({state:'hidden'});
 const master=page.locator('#masteringView .vox-warm-hardware');await master.waitFor();assert.equal(await master.locator('[data-master-param]').count(),5);
 assert.equal(await master.locator('.vox-master-presets optgroup[label="Usine"] option').count(),5);
 await master.locator('.vox-master-presets select').selectOption('1');await master.locator('.vox-master-presets input').fill('QA vox-warm');await master.locator('[data-vox-save]').click();
 assert.ok((await master.locator('.vox-master-presets select').innerText()).includes('QA vox-warm'));
 await page.screenshot({path:'artifacts/vox-warm/master.png'});await page.setViewportSize({width:390,height:844});await master.scrollIntoViewIfNeeded();assert.ok((await master.boundingBox()).width<=390);await page.screenshot({path:'artifacts/vox-warm/mobile.png'});assert.deepEqual(errors,[]);
 console.log('PASS VOX WARM: native controls, reactive display, master presets and mobile');
}finally{await browser.close();}
