import {resizeStudio} from './browser-viewport.mjs';
import assert from 'node:assert/strict';import {mkdir} from 'node:fs/promises';import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true});await mkdir('artifacts/vector-comp',{recursive:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:960}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8765/');await page.locator('[data-session-tab="create"]').click();await page.locator('#libraryNew').click();await page.locator('#modal').waitFor({state:'hidden'});
 await page.locator('[data-view="mixer"]').click();await page.locator('#mixerView [data-mixer-track]').first().locator('.insert-slot.empty [data-insert-slot]').first().click();
 await page.locator('#pluginSearch').fill('VECTOR COMP');await page.locator('[data-picker-load="vectorcomp"]').click();await page.locator('#modal').waitFor({state:'hidden'});
 const face=page.locator('#pluginFloat .vector-comp-hardware');await face.waitFor({state:'visible'});assert.equal(await face.locator('[data-param]').count(),7);assert.equal(await face.locator('svg').count(),2);
 const curve=face.locator('[data-vector-curve]'),before=await curve.getAttribute('d');const threshold=face.locator('[data-param="vectorcomp.threshold"]');
 await threshold.evaluate(el=>{el.value='-40';el.dispatchEvent(new Event('input',{bubbles:true}));});
 await page.waitForFunction(before=>document.querySelector('#pluginFloat [data-vector-curve]').getAttribute('d')!==before,before);
 assert.equal(await threshold.inputValue(),'-40');await page.screenshot({path:'artifacts/vector-comp/track.png'});
 await page.locator('#pluginFloat [data-float-close]').click();await page.locator('#mixerView .mixer-master .insert-slot.empty [data-insert-slot]').first().click();await page.locator('#pluginSearch').fill('VECTOR COMP');await page.locator('[data-picker-load="vectorcomp"]').click();await page.locator('#modal').waitFor({state:'hidden'});
 const master=page.locator('#masteringView .vector-comp-hardware');await master.waitFor({state:'visible'});assert.equal(await master.locator('[data-master-param]').count(),7);await page.screenshot({path:'artifacts/vector-comp/master.png'});
 await resizeStudio(page,{width:390,height:844});await master.waitFor({state:'visible'});await master.scrollIntoViewIfNeeded();const bounds=await master.boundingBox();assert.ok(bounds.width<=390,'hardware face exceeds viewport');await page.screenshot({path:'artifacts/vector-comp/mobile.png'});
 // A separate vector face fixture verifies actual reading updates without relying on audio devices.
 const meter=await page.evaluate(async()=>{const {mountVectorComp,updateVectorCompFaces}=await import('/vector-comp-face.js');const root=document.createElement('div');root.innerHTML='<div class="plugin-window-params">'+['threshold','ratio','knee','attack','release','mix','output'].map(k=>'<div class="param"><input data-param="vectorcomp.'+k+'"></div>').join('')+'</div>';document.body.append(root);let gr=-12;mountVectorComp(root,{state:()=>({threshold:-20,ratio:4,knee:6}),getReduction:()=>gr});updateVectorCompFaces(root);const mid=root.querySelector('[data-vector-gr]').textContent;gr=0;updateVectorCompFaces(root);const zero=root.querySelector('[data-vector-gr]').textContent;root.remove();return {mid,zero};});
 assert.deepEqual(meter,{mid:'-12.0 dB',zero:'0.0 dB'});assert.deepEqual(errors,[]);console.log('PASS: VECTOR COMP track and master controls, reactive transfer, meter binding and mobile');
}finally{await browser.close();}
