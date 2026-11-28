import {resizeStudio} from './browser-viewport.mjs';
import assert from 'node:assert/strict';import {mkdir} from 'node:fs/promises';import {chromium} from 'playwright';
await mkdir('artifacts/vox-level',{recursive:true});const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:960}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8765/');await page.locator('[data-session-tab="create"]').click();await page.locator('#libraryNew').click();await page.locator('#modal').waitFor({state:'hidden'});
 await page.locator('[data-view="mixer"]').click();await page.locator('#mixerView [data-mixer-track]').first().locator('.insert-slot.empty [data-insert-slot]').first().click();
 await page.locator('#pluginSearch').fill('VOX LEVEL');await page.locator('[data-picker-load="voxlevel"]').click();await page.locator('#modal').waitFor({state:'hidden'});
 const face=page.locator('#pluginFloat .vox-level-hardware');await face.waitFor();assert.equal(await face.locator('[data-param]').count(),6);assert.equal(await face.locator('[data-vox-stage]').count(),2);
 await face.locator('[data-param="voxlevel.mix"]').evaluate(el=>{el.value='.4';el.dispatchEvent(new Event('input',{bubbles:true}));});
 await page.waitForFunction(()=>document.querySelector('#pluginFloat [data-vox-mix]').textContent==='60% DRY / 40% WET');
 await page.screenshot({path:'artifacts/vox-level/track.png'});await page.locator('#pluginFloat [data-float-close]').click();
 await page.locator('#mixerView .mixer-master .insert-slot.empty [data-insert-slot]').first().click();await page.locator('#pluginSearch').fill('VOX LEVEL');await page.locator('[data-picker-load="voxlevel"]').click();await page.locator('#modal').waitFor({state:'hidden'});
 const master=page.locator('#masteringView .vox-level-hardware');await master.waitFor();assert.equal(await master.locator('[data-master-param]').count(),6);
 const metrics=await page.evaluate(async()=>{
  const {prepareStudioContext,createStudioEffects}=await import('/studio-pack-audio.js');const {mountVoxLevel,updateVoxLevelFaces}=await import('/vox-level-face.js');
  const ctx=new AudioContext();await ctx.resume();const scope={nodes:[],oscillators:[],node(kind,...args){const n=ctx[kind](...args);this.nodes.push(n);return n;}};
  await prepareStudioContext(ctx);const stage=createStudioEffects(ctx,scope,['voxlevel']).voxlevel;
  stage.comp.threshold.value=-12;stage.comp.ratio.value=6;stage.comp.attack.value=.002;stage.comp.release.value=.08;stage.comp.knee.value=3;
  stage.second.threshold.value=-35;stage.second.ratio.value=4;stage.second.attack.value=.025;stage.second.release.value=.24;stage.second.knee.value=12;
  stage.wet.gain.value=1;stage.dry.gain.value=0;
  const tone=ctx.createOscillator(),mute=ctx.createGain();mute.gain.value=0;tone.connect(stage.input);stage.output.connect(mute);mute.connect(ctx.destination);
  const root=document.createElement('div');root.innerHTML='<div class="plugin-window-params">'+['peakThreshold','levelThreshold','ratio','release','mix','output'].map(k=>'<div class="param"><input data-param="voxlevel.'+k+'"></div>').join('')+'</div>';document.body.append(root);
  const state={enabled:true,mix:1};mountVoxLevel(root,{state:()=>state,getStage:()=>stage});tone.start();await new Promise(r=>setTimeout(r,600));updateVoxLevelFaces(root);
  const read=id=>parseFloat(root.querySelector('[data-vox-stage="'+id+'"] output').textContent);
  const result={peak:read('peak'),phrase:read('phrase'),nativePeak:stage.comp.reduction,nativePhrase:stage.second.reduction,total:parseFloat(root.querySelector('[data-vox-total]').textContent)};
  state.enabled=false;updateVoxLevelFaces(root);result.bypass=root.querySelector('[data-vox-status]').textContent;result.bypassPeak=read('peak');result.bypassPhrase=read('phrase');
  root.remove();tone.stop();await ctx.close();return result;
 });
 assert.ok(metrics.peak<-.1&&metrics.phrase<-.1,JSON.stringify(metrics));assert.ok(Math.abs(metrics.peak-metrics.nativePeak)<.2);assert.ok(Math.abs(metrics.phrase-metrics.nativePhrase)<.2);assert.ok(Math.abs(metrics.total-metrics.peak-metrics.phrase)<.16);assert.equal(metrics.bypass,'BYPASS');assert.equal(metrics.bypassPeak,0);assert.equal(metrics.bypassPhrase,0);
 await page.screenshot({path:'artifacts/vox-level/master.png'});await resizeStudio(page,{width:390,height:844});await master.waitFor({state:'visible'});await master.scrollIntoViewIfNeeded();assert.ok((await master.boundingBox()).width<=390);await page.screenshot({path:'artifacts/vox-level/mobile.png'});
 assert.deepEqual(errors,[]);console.log('PASS: six native controls and two actual compressor stages, bypass, master and mobile',metrics);
}finally{await browser.close();}
