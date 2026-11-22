import assert from 'node:assert/strict';import {mkdir} from 'node:fs/promises';import {chromium} from 'playwright';
await mkdir('artifacts/vox-air',{recursive:true});const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:960}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8765/');await page.locator('[data-session-tab="create"]').click();await page.locator('#libraryNew').click();await page.locator('#modal').waitFor({state:'hidden'});
 await page.locator('[data-view="mixer"]').click();await page.locator('#mixerView [data-mixer-track]').first().locator('.insert-slot.empty [data-insert-slot]').first().click();
 await page.locator('#pluginSearch').fill('VOX AIR EQ');await page.locator('[data-picker-load="voxaireq"]').click();await page.locator('#modal').waitFor({state:'hidden'});
 const face=page.locator('#pluginFloat .vox-air-hardware');await face.waitFor();assert.equal(await face.locator('[data-param]').count(),7);
 const curve=face.locator('[data-air-response]'),before=await curve.getAttribute('d');
 await face.locator('[data-param="voxaireq.presence"]').evaluate(el=>{el.value='6';el.dispatchEvent(new Event('input',{bubbles:true}));});
 await page.waitForFunction(p=>document.querySelector('#pluginFloat [data-air-response]').getAttribute('d')!==p,before);
 await face.locator('[data-param="voxaireq.mix"]').evaluate(el=>{el.value='0';el.dispatchEvent(new Event('input',{bubbles:true}));});
 await page.waitForFunction(()=>document.querySelector('#pluginFloat [data-air-status]').textContent==='DRY');
 assert.ok((await curve.getAttribute('d')).split(/[ML]/).filter(Boolean).every(p=>Number(p.trim().split(' ')[1])===90));
 await page.screenshot({path:'artifacts/vox-air/track.png'});await page.locator('#pluginFloat [data-float-close]').click();
 await page.locator('#mixerView .mixer-master .insert-slot.empty [data-insert-slot]').first().click();await page.locator('#pluginSearch').fill('VOX AIR EQ');await page.locator('[data-picker-load="voxaireq"]').click();await page.locator('#modal').waitFor({state:'hidden'});
 const master=page.locator('#masteringView .vox-air-hardware');await master.waitFor();assert.equal(await master.locator('[data-master-param]').count(),7);
 const beforeMaster=await master.locator('[data-air-response]').getAttribute('d');await master.locator('[data-master-param="voxaireq.output"]').evaluate(el=>{el.value='3';el.dispatchEvent(new Event('input',{bubbles:true}));});
 await page.waitForFunction(p=>document.querySelector('#masteringView [data-air-response]').getAttribute('d')!==p,beforeMaster);
 // Compare complex response against an actual offline render of the native processor.
 const measured=await page.evaluate(async()=>{
  const {createVoxBC,syncVoxBC}=await import('/vox-bc-audio.js');const {mixedResponseDb,createVoxAirAnalysisFilters,voxAirComplexResponse}=await import('/vox-air-face.js');
  const sr=48000,analysis=new OfflineAudioContext(1,128,sr),filters=createVoxAirAnalysisFilters(analysis),results=[];
  const base={enabled:true,highpass:100,presenceFreq:3500,presence:6,airFreq:12000,air:3,mix:.5,output:2};
  // The production graph retains all scheduled AudioParam events. The reference
  // uses the same immediate-value analysis helper as the visible face.
  for(const [frequency,mix,enabled] of [[100,.5,true],[3500,.5,true],[12000,1,true],[3500,0,true],[3500,.5,false]]){
   const ctx=new OfflineAudioContext(1,sr,sr),scope={node:(kind,...args)=>ctx[kind](...args)},m=createVoxBC(ctx,scope,'voxaireq'),s={...base,mix,enabled};
   syncVoxBC(ctx,'voxaireq',m,s,0,true);
   const source=ctx.createOscillator();source.frequency.value=frequency;source.connect(m.input);m.output.connect(ctx.destination);source.start();
   const {m:mag,p:phase}=voxAirComplexResponse(filters,s,new Float32Array([frequency]));
   const expected=mixedResponseDb(mag[0]*Math.cos(phase[0]),mag[0]*Math.sin(phase[0]),mix,s.output,enabled);
   const buffer=(await ctx.startRendering()).getChannelData(0);let sum=0;for(let i=24000;i<48000;i++)sum+=buffer[i]**2;
   const actual=20*Math.log10(Math.sqrt(2*sum/24000));results.push({frequency,mix,enabled,expected,actual});
  }return results;
 });
 for(const result of measured)assert.ok(Math.abs(result.expected-result.actual)<.2,JSON.stringify(result));
 await page.screenshot({path:'artifacts/vox-air/master.png'});await page.setViewportSize({width:390,height:844});await master.scrollIntoViewIfNeeded();assert.ok((await master.boundingBox()).width<=390);await page.screenshot({path:'artifacts/vox-air/mobile.png'});
 assert.deepEqual(errors,[]);console.log('PASS: seven controls, native offline response, mix, master and mobile',measured);
}finally{await browser.close();}
