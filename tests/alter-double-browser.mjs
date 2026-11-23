import {chooseFolderPreset} from './preset-picker-helpers.mjs';
import assert from 'node:assert/strict';import {mkdir} from 'node:fs/promises';import {chromium} from 'playwright';
await mkdir('artifacts/alter-double',{recursive:true});const browser=await chromium.launch({headless:true});try{
 const page=await browser.newPage({viewport:{width:1440,height:960}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8765/');await page.locator('[data-session-tab="create"]').click();await page.locator('#libraryNew').click();await page.locator('#modal').waitFor({state:'hidden'});
 await page.locator('[data-view="mixer"]').click();await page.locator('#mixerView [data-mixer-track]').first().locator('.insert-slot.empty [data-insert-slot]').first().click();
 await page.locator('#pluginSearch').fill('ALTER DOUBLE');await page.locator('[data-picker-load="alterdouble"]').click();await page.locator('#modal').waitFor({state:'hidden'});
 const face=page.locator('#pluginFloat .alter-double-hardware');await face.waitFor();assert.equal(await face.locator('[data-param]').count(),6);
 await face.locator('[data-param="alterdouble.depth"]').evaluate(el=>{el.value='2';el.dispatchEvent(new Event('input',{bubbles:true}));});
 await face.locator('[data-param="alterdouble.rate"]').evaluate(el=>{el.value='.25';el.dispatchEvent(new Event('input',{bubbles:true}));});
 await face.locator('[data-param="alterdouble.delay"]').evaluate((el,v)=>{el.value=v;el.dispatchEvent(new Event('input',{bubbles:true}));},'30');
 await page.waitForFunction(({selector,value})=>document.querySelector('#pluginFloat '+selector)?.textContent===value,{selector:'[data-alter-left]',value:'30.0 ms ± 2.0 · 0.25 Hz'});
 await face.locator('[data-param="alterdouble.width"]').evaluate(el=>{el.value='.5';el.dispatchEvent(new Event('input',{bubbles:true}));});await page.waitForFunction(()=>document.querySelector('#pluginFloat [data-alter-width]').textContent==='WIDTH 50%');
 assert.equal(await face.locator('[data-alter-l]').getAttribute('cx'),'107.5');
 const metrics=await page.evaluate(async()=>{const {createStudioEffects,syncStudioEffect}=await import('/studio-pack-audio.js');const sr=48000,ctx=new OfflineAudioContext(2,sr/2,sr),scope={oscillators:[],node:(kind,...args)=>ctx[kind](...args)},m=createStudioEffects(ctx,scope,['alterdouble']).alterdouble;syncStudioEffect(ctx,'alterdouble',m,{enabled:true,delay:18,depth:0,rate:.23,focus:250,width:1,mix:1},120,0,true,2);const b=ctx.createBuffer(1,4096,sr);b.getChannelData(0)[0]=1;const src=ctx.createBufferSource();src.buffer=b;src.connect(m.input);m.output.connect(ctx.destination);src.start();const out=await ctx.startRendering();const peak=c=>{const v=out.getChannelData(c);let index=0;for(let i=1;i<v.length;i++)if(Math.abs(v[i])>Math.abs(v[index]))index=i;return {index,peak:Math.abs(v[index])};};return {left:peak(0),right:peak(1)};});assert.ok(metrics.left.peak>.05&&metrics.right.peak>.05,JSON.stringify(metrics));assert.ok(Math.abs(metrics.left.index-864)<=1&&Math.abs(metrics.right.index-1152)<=1,JSON.stringify(metrics));
 await page.screenshot({path:'artifacts/alter-double/track.png'});await page.locator('#pluginFloat [data-float-close]').click();
 await page.locator('#mixerView .mixer-master .insert-slot.empty [data-insert-slot]').first().click();await page.locator('#pickerBundle').selectOption('ALTER');await page.locator('#pickerMode').selectOption('presets');await chooseFolderPreset(page.locator('[data-picker-preset="alterdouble"]').first());await page.locator('#modal').waitFor({state:'hidden'});
 const master=page.locator('#masteringView .alter-double-hardware');await master.waitFor();assert.equal(await master.locator('[data-master-param]').count(),6);
 assert.equal(await master.locator('.alter-pro-presets optgroup[label="Usine"] option').count(),5);
 await master.locator('.alter-pro-presets select').selectOption('1');await master.locator('.alter-pro-presets input').fill('QA alter-double');await master.locator('[data-alter-save]').click();
 assert.ok((await master.locator('.alter-pro-presets select').innerText()).includes('QA alter-double'));
 await page.screenshot({path:'artifacts/alter-double/master.png'});await page.setViewportSize({width:390,height:844});await master.scrollIntoViewIfNeeded();assert.ok((await master.boundingBox()).width<=390);await page.screenshot({path:'artifacts/alter-double/mobile.png'});assert.deepEqual(errors,[]);
 console.log('PASS ALTER DOUBLE: native controls, reactive display, master presets and mobile');
}finally{await browser.close();}
