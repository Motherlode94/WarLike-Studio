import {chooseFolderPreset} from './preset-picker-helpers.mjs';
import assert from 'node:assert/strict';import {mkdir} from 'node:fs/promises';import {chromium} from 'playwright';
await mkdir('artifacts/exo-air',{recursive:true});const browser=await chromium.launch({headless:true});try{
 const page=await browser.newPage({viewport:{width:1440,height:960}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8765/');await page.locator('[data-session-tab="create"]').click();await page.locator('#libraryNew').click();await page.locator('#modal').waitFor({state:'hidden'});
 await page.locator('[data-view="mixer"]').click();await page.locator('#mixerView [data-mixer-track]').first().locator('.insert-slot.empty [data-insert-slot]').first().click();
 await page.locator('#pluginSearch').fill('EXO AIR');await page.locator('[data-picker-load="exoair"]').click();await page.locator('#modal').waitFor({state:'hidden'});
 const face=page.locator('#pluginFloat .exo-air-hardware');await face.waitFor();assert.equal(await face.locator('[data-param]').count(),4);
 await face.locator('[data-param="exoair.frequency"]').evaluate((el,v)=>{el.value=v;el.dispatchEvent(new Event('input',{bubbles:true}));},'5500');
 await page.waitForFunction(({selector,value})=>document.querySelector('#pluginFloat '+selector)?.textContent===value,{selector:'[data-exo-air-freq]',value:'HP 5500 Hz'});
 const previous=await face.locator('[data-exo-air-curve]').getAttribute('d');
 await face.locator('[data-param="exoair.drive"]').evaluate(el=>{el.value='12';el.dispatchEvent(new Event('input',{bubbles:true}));});await page.waitForFunction(p=>document.querySelector('#pluginFloat [data-exo-air-curve]').getAttribute('d')!==p,previous);
 await face.locator('[data-param="exoair.mix"]').evaluate(el=>{el.value='1';el.dispatchEvent(new Event('input',{bubbles:true}));});await page.waitForFunction(()=>document.querySelector('#pluginFloat [data-exo-air-send]').textContent==='HARMONIC SEND 35.0%');
 const measurements=await page.evaluate(async()=>{const {createExoEffects,syncExoEffect}=await import('/exo-audio.js');const sr=48000;
 async function render(patch,freq=3000,amp=.4){const ctx=new OfflineAudioContext(1,sr,sr),scope={node:(kind,...args)=>ctx[kind](...args)},m=createExoEffects(ctx,scope,['exoair']).exoair;const s={enabled:true,frequency:2000,drive:18,mix:1,output:0,...patch};syncExoEffect(ctx,'exoair',m,s,0,true,1);const osc=ctx.createOscillator(),gain=ctx.createGain();osc.frequency.value=freq;gain.gain.value=amp;osc.connect(gain);gain.connect(m.input);m.output.connect(ctx.destination);osc.start();const out=(await ctx.startRendering()).getChannelData(0);let sum=0,re=0,im=0;for(let i=24000;i<sr;i++){sum+=out[i]**2;re+=out[i]*Math.cos(2*Math.PI*freq*3*i/sr);im+=out[i]*Math.sin(2*Math.PI*freq*3*i/sr);}return {rms:Math.sqrt(sum/24000),third:2*Math.hypot(re,im)/24000,oversample:m.shaper.oversample};}
 return {wet:await render({}),dry:await render({enabled:false}),zero:await render({mix:0}),bass:await render({frequency:4500},100,.2),bassDry:await render({enabled:false},100,.2),trim:await render({mix:0,output:-6}),bypassTrim:await render({enabled:false,output:-6})};});
 assert.equal(measurements.wet.oversample,'2x');assert.ok(measurements.wet.third>measurements.dry.third+.003,JSON.stringify(measurements));assert.ok(Math.abs(measurements.bass.rms/measurements.bassDry.rms-1)<.01,JSON.stringify(measurements));assert.ok(Math.abs(measurements.zero.rms/measurements.dry.rms-1)<1e-5,JSON.stringify(measurements));assert.ok(Math.abs(20*Math.log10(measurements.trim.rms/measurements.dry.rms)+6)<.05,JSON.stringify(measurements));assert.ok(Math.abs(measurements.bypassTrim.rms/measurements.dry.rms-1)<1e-5,JSON.stringify(measurements));
 await page.screenshot({path:'artifacts/exo-air/track.png'});await page.locator('#pluginFloat [data-float-close]').click();
 await page.locator('#mixerView .mixer-master .insert-slot.empty [data-insert-slot]').first().click();await page.locator('#pickerBundle').selectOption('EXO');await page.locator('#pickerMode').selectOption('presets');await chooseFolderPreset(page.locator('[data-picker-preset="exoair"]').first());await page.locator('#modal').waitFor({state:'hidden'});
 const master=page.locator('#masteringView .exo-air-hardware');await master.waitFor();assert.equal(await master.locator('[data-master-param]').count(),4);
 assert.equal(await master.locator('.exo-air-presets optgroup[label="Usine"] option').count(),5);
 await master.locator('.exo-air-presets select').selectOption('1');await master.locator('.exo-air-presets input').fill('QA exo-air');await master.locator('[data-exo-air-save]').click();
 assert.ok((await master.locator('.exo-air-presets select').innerText()).includes('QA exo-air'));
 await page.screenshot({path:'artifacts/exo-air/master.png'});await page.setViewportSize({width:390,height:844});await master.scrollIntoViewIfNeeded();assert.ok((await master.boundingBox()).width<=390);await page.screenshot({path:'artifacts/exo-air/mobile.png'});assert.deepEqual(errors,[]);
 console.log('PASS EXO AIR: native controls, reactive display, master presets and mobile');
}finally{await browser.close();}
