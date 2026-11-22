import assert from 'node:assert/strict';import {mkdir} from 'node:fs/promises';import {chromium} from 'playwright';
await mkdir('artifacts/vox-tune',{recursive:true});const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:960}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8765/');await page.locator('[data-session-tab="create"]').click();await page.locator('#libraryNew').click();await page.locator('#modal').waitFor({state:'hidden'});
 await page.locator('[data-view="mixer"]').click();await page.locator('#mixerView [data-mixer-track]').first().locator('.insert-slot.empty [data-insert-slot]').first().click();
 await page.locator('#pluginSearch').fill('VOX TUNE');await page.locator('[data-picker-load="voxtune"]').click();await page.locator('#modal').waitFor({state:'hidden'});
 const face=page.locator('#pluginFloat .vox-tune-hardware');await face.waitFor();assert.equal(await face.locator('[data-param]').count(),5);assert.equal(await face.locator('[data-vox-key]').count(),12);
 await face.locator('[data-vox-key="0"]').click();await face.locator('[data-vox-scale="1"]').click();assert.equal(await face.locator('[data-param="voxtune.key"]').inputValue(),'0');assert.equal(await face.locator('[data-param="voxtune.scale"]').inputValue(),'1');
 await page.waitForFunction(()=>document.querySelector('#pluginFloat [data-vox-key="0"]').getAttribute('aria-pressed')==='true');assert.equal(await face.locator('.in-scale').count(),7);
 await page.screenshot({path:'artifacts/vox-tune/track.png'});await page.locator('#pluginFloat [data-float-close]').click();
 await page.locator('#mixerView .mixer-master .insert-slot.empty [data-insert-slot]').first().click();await page.locator('#pluginSearch').fill('VOX TUNE');await page.locator('[data-picker-load="voxtune"]').click();await page.locator('#modal').waitFor({state:'hidden'});
 const master=page.locator('#masteringView .vox-tune-hardware');await master.waitFor();assert.equal(await master.locator('[data-master-param]').count(),5);
 await master.locator('[data-vox-key="7"]').click();assert.equal(await master.locator('[data-master-param="voxtune.key"]').inputValue(),'7');
 const measurement=await page.evaluate(async()=>{const ctx=new AudioContext();await ctx.resume();await ctx.audioWorklet.addModule('/vocal-worklet.js?v=0.14.0');const node=new AudioWorkletNode(ctx,'warlike-vocal-pitch',{outputChannelCount:[2]});const tone=ctx.createOscillator(),mute=ctx.createGain();tone.frequency.value=445;mute.gain.value=0;tone.connect(node);node.connect(mute);mute.connect(ctx.destination);const result=await new Promise((resolve,reject)=>{const timeout=setTimeout(()=>reject(Error('No voiced telemetry')),4000);node.port.onmessage=e=>{if(e.data?.type==='vox-tune-telemetry'&&e.data.frequency>0){clearTimeout(timeout);resolve(e.data);}};node.port.postMessage({type:'vox-tune-monitor',enabled:true});tone.start();});tone.stop();await ctx.close();return result;});
 assert.ok(Math.abs(measurement.frequency-445)<3,JSON.stringify(measurement));assert.equal(measurement.target,69);
 await page.screenshot({path:'artifacts/vox-tune/master.png'});await page.setViewportSize({width:390,height:844});await master.scrollIntoViewIfNeeded();assert.ok((await master.boundingBox()).width<=390);await page.screenshot({path:'artifacts/vox-tune/mobile.png'});assert.deepEqual(errors,[]);
 console.log('PASS: native keyboard, scale, actual worklet telemetry and Master',measurement);
}finally{await browser.close();}
