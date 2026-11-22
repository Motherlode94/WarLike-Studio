import assert from 'node:assert/strict';import {mkdir} from 'node:fs/promises';import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true});await mkdir('artifacts/vector-limit',{recursive:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:960}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8765/');await page.locator('[data-session-tab="create"]').click();await page.locator('#libraryNew').click();await page.locator('#modal').waitFor({state:'hidden'});
 await page.locator('[data-view="mixer"]').click();await page.locator('#mixerView [data-mixer-track]').first().locator('.insert-slot.empty [data-insert-slot]').first().click();
 await page.locator('#pluginSearch').fill('VECTOR LIMIT');await page.locator('[data-picker-load="vectorlimit"]').click();await page.locator('#modal').waitFor({state:'hidden'});
 const face=page.locator('#pluginFloat .vector-limit-hardware');await face.waitFor();assert.equal(await face.locator('[data-param]').count(),3);
 const line=face.locator('[data-limit-ceiling-line]'),before=await line.getAttribute('d');await face.locator('[data-param="vectorlimit.ceiling"]').evaluate(el=>{el.value='-6';el.dispatchEvent(new Event('input',{bubbles:true}));});
 await page.waitForFunction(p=>document.querySelector('#pluginFloat [data-limit-ceiling-line]').getAttribute('d')!==p,before);
 assert.equal(await face.locator('[data-limit-ceiling]').textContent(),'-6.0 dBFS');
 await page.screenshot({path:'artifacts/vector-limit/track.png'});await page.locator('#pluginFloat [data-float-close]').click();
 await page.locator('#mixerView .mixer-master .insert-slot.empty [data-insert-slot]').first().click();await page.locator('#pluginSearch').fill('VECTOR LIMIT');await page.locator('[data-picker-load="vectorlimit"]').click();await page.locator('#modal').waitFor({state:'hidden'});
 const master=page.locator('#masteringView .vector-limit-hardware');await master.waitFor();assert.equal(await master.locator('[data-master-param]').count(),3);
 await page.screenshot({path:'artifacts/vector-limit/master.png'});
 // Actual stereo Web Audio signal through the native limiter; no emulated meter values.
 const metrics=await page.evaluate(async()=>{
  const {createStudioEffects}=await import('/studio-pack-audio.js');
  const {mountVectorLimit,updateVectorLimitFaces}=await import('/vector-limit-face.js');
  const ctx=new AudioContext();await ctx.resume();const scope={nodes:[],oscillators:[],node(kind,...args){const n=ctx[kind](...args);this.nodes.push(n);return n;}};
  const stage=createStudioEffects(ctx,scope,['vectorlimit']).vectorlimit;
  const g=10**(-6/20);stage.comp.threshold.value=-6;stage.scaleIn.gain.value=1/g;stage.scaleOut.gain.value=g;
  const tone=ctx.createOscillator(),gain=ctx.createGain(),mute=ctx.createGain();gain.gain.value=.95;mute.gain.value=0;tone.connect(gain);gain.connect(stage.input);stage.output.connect(mute);mute.connect(ctx.destination);
  const root=document.createElement('div');root.innerHTML='<div class="plugin-window-params">'+['drive','ceiling','release'].map(k=>'<div class="param"><input data-param="vectorlimit.'+k+'"></div>').join('')+'</div>';document.body.append(root);
  const state={enabled:true,ceiling:-6};mountVectorLimit(root,{state:()=>state,getStage:()=>stage});tone.start();
  await new Promise(r=>setTimeout(r,350));updateVectorLimitFaces();
  const val=k=>parseFloat(root.querySelector('[data-limit-meter="'+k+'"] output').textContent);
  const result={input:val('in'),output:val('out'),gr:val('gr')};
  state.enabled=false;updateVectorLimitFaces();result.bypass=root.querySelector('[data-limit-status]').textContent;
  root.remove();updateVectorLimitFaces();tone.stop();await ctx.close();return result;
 });
 assert.ok(metrics.input>-6,JSON.stringify(metrics));assert.ok(metrics.output<=-5.8&&metrics.output>-40,JSON.stringify(metrics));assert.ok(metrics.gr<-.1,JSON.stringify(metrics));assert.equal(metrics.bypass,'BYPASS');
 await page.setViewportSize({width:390,height:844});await master.scrollIntoViewIfNeeded();assert.ok((await master.boundingBox()).width<=390);await page.screenshot({path:'artifacts/vector-limit/mobile.png'});
 assert.deepEqual(errors,[]);console.log('PASS: native limiter controls and sampled input/output, reduction, bypass, master and mobile',metrics);
}finally{await browser.close();}
