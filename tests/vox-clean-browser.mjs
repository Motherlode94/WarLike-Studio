import assert from 'node:assert/strict';import {mkdir} from 'node:fs/promises';import {chromium} from 'playwright';
await mkdir('artifacts/vox-clean',{recursive:true});const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:960}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8765/');await page.locator('[data-session-tab="create"]').click();await page.locator('#libraryNew').click();await page.locator('#modal').waitFor({state:'hidden'});
 await page.locator('[data-view="mixer"]').click();await page.locator('#mixerView [data-mixer-track]').first().locator('.insert-slot.empty [data-insert-slot]').first().click();
 await page.locator('#pluginSearch').fill('VOX CLEAN');await page.locator('[data-picker-load="voxclean"]').click();await page.locator('#modal').waitFor({state:'hidden'});
 const face=page.locator('#pluginFloat .vox-clean-hardware');await face.waitFor();assert.equal(await face.locator('[data-param]').count(),6);
 const before=await face.locator('[data-clean-focus]').getAttribute('d');await face.locator('[data-param="voxclean.frequency"]').evaluate(el=>{el.value='8000';el.dispatchEvent(new Event('input',{bubbles:true}));});
 await page.waitForFunction(p=>document.querySelector('#pluginFloat [data-clean-focus]').getAttribute('d')!==p,before);
 await page.screenshot({path:'artifacts/vox-clean/track.png'});await page.locator('#pluginFloat [data-float-close]').click();
 await page.locator('#mixerView .mixer-master .insert-slot.empty [data-insert-slot]').first().click();await page.locator('#pluginSearch').fill('VOX CLEAN');await page.locator('[data-picker-load="voxclean"]').click();await page.locator('#modal').waitFor({state:'hidden'});
 const master=page.locator('#masteringView .vox-clean-hardware');await master.waitFor();assert.equal(await master.locator('[data-master-param]').count(),6);
 const metrics=await page.evaluate(async()=>{
  const {createStudioEffects}=await import('/studio-pack-audio.js');const {voxCleanCurve}=await import('/vox-clean-model.js');const {mountVoxClean,updateVoxCleanFaces}=await import('/vox-clean-face.js');
  const ctx=new AudioContext();await ctx.resume();const scope={nodes:[],oscillators:[],node(kind,...args){const n=ctx[kind](...args);this.nodes.push(n);return n;}};
  const stage=createStudioEffects(ctx,scope,['voxclean']).voxclean;stage.hp.frequency.value=80;stage.band.frequency.value=6500;stage.scale.gain.value=1/32/(10**(-36/20));stage.control.curve=voxCleanCurve(12);
  const tone=ctx.createOscillator(),mute=ctx.createGain();tone.frequency.value=6500;mute.gain.value=0;tone.connect(stage.input);stage.output.connect(mute);mute.connect(ctx.destination);
  const root=document.createElement('div');root.innerHTML='<div class="plugin-window-params">'+['highpass','frequency','threshold','range','air','output'].map(k=>'<div class="param"><input data-param="voxclean.'+k+'"></div>').join('')+'</div>';document.body.append(root);
  const state={enabled:true,highpass:80,frequency:6500,threshold:-36,range:12,air:0,output:0};mountVoxClean(root,{state:()=>state,getStage:()=>stage});tone.start();await new Promise(r=>setTimeout(r,500));updateVoxCleanFaces();
  const gr=()=>parseFloat(root.querySelector('[data-clean-gr]').textContent);const result={gr:gr(),status:root.querySelector('[data-clean-status]').textContent};
  state.enabled=false;updateVoxCleanFaces();result.bypass=gr();result.bypassStatus=root.querySelector('[data-clean-status]').textContent;
  root.remove();updateVoxCleanFaces();tone.stop();await ctx.close();return result;
 });
 assert.ok(metrics.gr<-.1&&metrics.gr>=-12.1,JSON.stringify(metrics));assert.equal(metrics.status,'DE-ESSING');assert.equal(metrics.bypass,0);assert.equal(metrics.bypassStatus,'BYPASS');
 await page.screenshot({path:'artifacts/vox-clean/master.png'});await page.setViewportSize({width:390,height:844});await master.scrollIntoViewIfNeeded();assert.ok((await master.boundingBox()).width<=390);await page.screenshot({path:'artifacts/vox-clean/mobile.png'});
 assert.deepEqual(errors,[]);console.log('PASS: VOX CLEAN native controls, detector signal, bypass, master and mobile',metrics);
}finally{await browser.close();}
