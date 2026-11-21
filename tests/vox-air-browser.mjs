import assert from 'node:assert/strict';import {mkdir} from 'node:fs/promises';import {chromium} from 'playwright';
await mkdir('artifacts/vox-air',{recursive:true});const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:960}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8765/');await page.locator('[data-session-tab="create"]').click();await page.locator('#libraryNew').click();await page.locator('#modal').waitFor({state:'hidden'});
 await page.locator('[data-view="mixer"]').click();await page.locator('#mixerView [data-mixer-track]').first().locator('[data-add-insert-track]').click();
 await page.locator('#pluginSearch').fill('VOX AIR EQ');await page.locator('[data-picker-load="voxaireq"]').click();await page.locator('#modal').waitFor({state:'hidden'});
 const face=page.locator('#pluginFloat .vox-air-hardware');await face.waitFor();assert.equal(await face.locator('[data-param]').count(),7);
 const curve=face.locator('[data-air-response]'),before=await curve.getAttribute('d');
 await face.locator('[data-param="voxaireq.presence"]').evaluate(el=>{el.value='6';el.dispatchEvent(new Event('input',{bubbles:true}));});
 await page.waitForFunction(p=>document.querySelector('#pluginFloat [data-air-response]').getAttribute('d')!==p,before);
 await face.locator('[data-param="voxaireq.mix"]').evaluate(el=>{el.value='0';el.dispatchEvent(new Event('input',{bubbles:true}));});
 await page.waitForFunction(()=>document.querySelector('#pluginFloat [data-air-status]').textContent==='DRY');
 assert.ok((await curve.getAttribute('d')).split(/[ML]/).filter(Boolean).every(p=>Number(p.trim().split(' ')[1])===90));
 await page.screenshot({path:'artifacts/vox-air/track.png'});await page.locator('#pluginFloat [data-float-close]').click();
 await page.locator('#mixerView .mixer-master [data-add-insert-track="master"]').click();await page.locator('#pluginSearch').fill('VOX AIR EQ');await page.locator('[data-picker-load="voxaireq"]').click();await page.locator('#modal').waitFor({state:'hidden'});
 const master=page.locator('#masteringView .vox-air-hardware');await master.waitFor();assert.equal(await master.locator('[data-master-param]').count(),7);
 const beforeMaster=await master.locator('[data-air-response]').getAttribute('d');await master.locator('[data-master-param="voxaireq.output"]').evaluate(el=>{el.value='3';el.dispatchEvent(new Event('input',{bubbles:true}));});
 await page.waitForFunction(p=>document.querySelector('#masteringView [data-air-response]').getAttribute('d')!==p,beforeMaster);
 // Compare complex response against an actual offline render of the native processor.
 const measured=await page.evaluate(async()=>{
  const {createVoxBC,syncVoxBC}=await import('/vox-bc-audio.js');const {mixedResponseDb}=await import('/vox-air-face.js');
  const sr=48000,ctx=new OfflineAudioContext(1,sr,sr),scope={node:(kind,...args)=>ctx[kind](...args)},m=createVoxBC(ctx,scope,'voxaireq');
  const s={enabled:true,highpass:100,presenceFreq:3500,presence:6,airFreq:12000,air:3,mix:.5,output:2};syncVoxBC(ctx,'voxaireq',m,s,0,true);
  const source=ctx.createOscillator();source.frequency.value=3500;source.connect(m.input);m.output.connect(ctx.destination);source.start();
  let re=1,im=0;for(const node of [m.highpass,m.presence,m.air]){const mag=new Float32Array(1),phase=new Float32Array(1);node.getFrequencyResponse(new Float32Array([3500]),mag,phase);const r=mag[0]*Math.cos(phase[0]),i=mag[0]*Math.sin(phase[0]);[re,im]=[re*r-im*i,re*i+im*r];}
  const expected=mixedResponseDb(re,im,s.mix,s.output),buffer=(await ctx.startRendering()).getChannelData(0);let sum=0;for(let i=24000;i<48000;i++)sum+=buffer[i]**2;const actual=20*Math.log10(Math.sqrt(2*sum/24000));return {expected,actual};
 });
 assert.ok(Math.abs(measured.expected-measured.actual)<.2,JSON.stringify(measured));
 await page.screenshot({path:'artifacts/vox-air/master.png'});await page.setViewportSize({width:390,height:844});await master.scrollIntoViewIfNeeded();assert.ok((await master.boundingBox()).width<=390);await page.screenshot({path:'artifacts/vox-air/mobile.png'});
 assert.deepEqual(errors,[]);console.log('PASS: seven controls, native offline response, mix, master and mobile',measured);
}finally{await browser.close();}
