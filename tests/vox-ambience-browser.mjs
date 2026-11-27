import {resizeStudio} from './browser-viewport.mjs';
import assert from 'node:assert/strict';import {mkdir} from 'node:fs/promises';import {chromium} from 'playwright';
await mkdir('artifacts/vox-ambience',{recursive:true});const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:960}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8765/');await page.locator('[data-session-tab="create"]').click();await page.locator('#libraryNew').click();await page.locator('#modal').waitFor({state:'hidden'});
 await page.locator('[data-view="mixer"]').click();await page.locator('#mixerView [data-mixer-track]').first().locator('.insert-slot.empty [data-insert-slot]').first().click();
 await page.locator('#pluginSearch').fill('VOX AMBIENCE');await page.locator('[data-picker-load="voxambience"]').click();await page.locator('#modal').waitFor({state:'hidden'});
 const face=page.locator('#pluginFloat .vox-ambience-hardware');await face.waitFor();assert.equal(await face.locator('[data-param]').count(),6);
 const before=await face.locator('[data-amb-echo="0"]').getAttribute('d');
 await face.locator('[data-param="voxambience.slap"]').evaluate(el=>{el.value='125';el.dispatchEvent(new Event('input',{bubbles:true}));});
 await page.waitForFunction(p=>document.querySelector('#pluginFloat [data-amb-echo="0"]').getAttribute('d')!==p,before);
 assert.ok((await face.locator('[data-amb-delay]').textContent()).includes('125 ms'));
 await face.locator('[data-param="voxambience.mix"]').evaluate(el=>{el.value='0';el.dispatchEvent(new Event('input',{bubbles:true}));});
 await page.waitForFunction(()=>document.querySelector('#pluginFloat [data-amb-status]').textContent==='DRY');assert.equal(await face.locator('[data-amb-send]').textContent(),'DRY 100% · FX 0%');
 await page.screenshot({path:'artifacts/vox-ambience/track.png'});await page.locator('#pluginFloat [data-float-close]').click();
 await page.locator('#mixerView .mixer-master .insert-slot.empty [data-insert-slot]').first().click();await page.locator('#pluginSearch').fill('VOX AMBIENCE');await page.locator('[data-picker-load="voxambience"]').click();await page.locator('#modal').waitFor({state:'hidden'});
 const master=page.locator('#masteringView .vox-ambience-hardware');await master.waitFor();assert.equal(await master.locator('[data-master-param]').count(),6);
 const metrics=await page.evaluate(async()=>{
  const {createVoxBC,syncVoxBC}=await import('/vox-bc-audio.js');const sr=48000;
  async function render(changes){
   const ctx=new OfflineAudioContext(2,sr/2,sr),scope={node:(kind,...args)=>ctx[kind](...args)},m=createVoxBC(ctx,scope,'voxambience');
   const s={enabled:true,slap:100,feedback:0,tone:5600,slapLevel:1,room:0,mix:.5,...changes};syncVoxBC(ctx,'voxambience',m,s,0,true);
   const buffer=ctx.createBuffer(1,128,sr);buffer.getChannelData(0)[0]=1;const source=ctx.createBufferSource();source.buffer=buffer;source.connect(m.input);m.output.connect(ctx.destination);source.start();
   const out=await ctx.startRendering(),l=out.getChannelData(0),r=out.getChannelData(1);
   const peak=(a,b)=>{let v=0;for(let i=a;i<b;i++)v=Math.max(v,Math.abs(l[i]));return v;};
   let stereo=0;for(let i=1;i<5520;i++)stereo=Math.max(stereo,Math.abs(l[i]-r[i]));
   return {dry:l[0],pre:peak(1,4799),slap:peak(4799,5200),tail:peak(5600,l.length),early:peak(1,4000),stereo,ir:m.convolver.buffer.length};
  }
  return {slap:await render({}),room:await render({slapLevel:0,room:1}),bypass:await render({enabled:false,room:1}),dry:await render({mix:0,room:1})};
 });
 assert.ok(Math.abs(metrics.slap.dry-1)<1e-5);assert.ok(metrics.slap.pre<1e-6);assert.ok(metrics.slap.slap>.01);
 assert.ok(metrics.room.early>.01&&metrics.room.stereo>.01);assert.equal(metrics.room.ir,5520);assert.ok(metrics.room.tail<1e-5);
 for(const v of [metrics.bypass,metrics.dry]){assert.ok(Math.abs(v.dry-1)<1e-5);assert.ok(Math.max(v.pre,v.slap,v.tail)<1e-6);}
 await page.screenshot({path:'artifacts/vox-ambience/master.png'});await resizeStudio(page,{width:390,height:844});await master.waitFor({state:'visible'});await master.scrollIntoViewIfNeeded();assert.ok((await master.boundingBox()).width<=390);await page.screenshot({path:'artifacts/vox-ambience/mobile.png'});
 assert.deepEqual(errors,[]);console.log('PASS: native impulse, direct path, slapback timing, stereo room, bypass and mobile',metrics);
}finally{await browser.close();}
