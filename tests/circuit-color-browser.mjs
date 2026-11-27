import {resizeStudio} from './browser-viewport.mjs';
import assert from 'node:assert/strict';import {mkdir} from 'node:fs/promises';import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true});await mkdir('artifacts/circuit-color',{recursive:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:960}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8765/');await page.locator('[data-session-tab="create"]').click();await page.locator('#libraryNew').click();await page.locator('#modal').waitFor({state:'hidden'});
 await page.locator('[data-view="mixer"]').click();await page.locator('#mixerView [data-mixer-track]').first().locator('.insert-slot.empty [data-insert-slot]').first().click();
 await page.locator('#pluginSearch').fill('CIRCUIT COLOR');await page.locator('[data-picker-load="circuitcolor"]').click();await page.locator('#modal').waitFor({state:'hidden'});
 const face=page.locator('#pluginFloat .circuit-color-hardware');await face.waitFor();assert.equal(await face.locator('[data-param]').count(),5);
 const curve=face.locator('[data-color-transfer]'),before=await curve.getAttribute('d');
 await face.locator('[data-param="circuitcolor.drive"]').evaluate(el=>{el.value='18';el.dispatchEvent(new Event('input',{bubbles:true}));});
 await page.waitForFunction(p=>document.querySelector('#pluginFloat [data-color-transfer]').getAttribute('d')!==p,before);
 const driven=await curve.getAttribute('d');await face.locator('[data-param="circuitcolor.bias"]').evaluate(el=>{el.value='.8';el.dispatchEvent(new Event('input',{bubbles:true}));});
 await page.waitForFunction(p=>document.querySelector('#pluginFloat [data-color-transfer]').getAttribute('d')!==p,driven);assert.equal(await face.locator('[data-color-bias]').textContent(),'BIAS 80%');
 await page.screenshot({path:'artifacts/circuit-color/track.png'});await page.locator('#pluginFloat [data-float-close]').click();
 await page.locator('#mixerView .mixer-master .insert-slot.empty [data-insert-slot]').first().click();await page.locator('#pluginSearch').fill('CIRCUIT COLOR');await page.locator('[data-picker-load="circuitcolor"]').click();await page.locator('#modal').waitFor({state:'hidden'});
 const master=page.locator('#masteringView .circuit-color-hardware');await master.waitFor();assert.equal(await master.locator('[data-master-param]').count(),5);
 await master.locator('[data-master-param="circuitcolor.mix"]').evaluate(el=>{el.value='0';el.dispatchEvent(new Event('input',{bubbles:true}));});await page.waitForFunction(()=>document.querySelector('#masteringView [data-color-status]').textContent==='DRY');
 await page.screenshot({path:'artifacts/circuit-color/master.png'});await resizeStudio(page,{width:390,height:844});await master.waitFor({state:'visible'});await master.scrollIntoViewIfNeeded();assert.ok((await master.boundingBox()).width<=390);await page.screenshot({path:'artifacts/circuit-color/mobile.png'});
 assert.deepEqual(errors,[]);console.log('PASS: CIRCUIT COLOR native controls, reactive transfer and bias, dry status, master and mobile');
}finally{await browser.close();}
