import assert from 'node:assert/strict';import {mkdir} from 'node:fs/promises';import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true});await mkdir('artifacts/circuit-bus',{recursive:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:960}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8765/');await page.locator('[data-session-tab="create"]').click();await page.locator('#libraryNew').click();await page.locator('#modal').waitFor({state:'hidden'});
 await page.locator('[data-view="mixer"]').click();await page.locator('#mixerView [data-mixer-track]').first().locator('[data-add-insert-track]').click();
 await page.locator('#pluginSearch').fill('CIRCUIT BUS');await page.locator('[data-picker-load="circuitbus"]').click();await page.locator('#modal').waitFor({state:'hidden'});
 const face=page.locator('#pluginFloat .circuit-bus-hardware');await face.waitFor();assert.equal(await face.locator('[data-param]').count(),7);
 await face.locator('[data-param="circuitbus.mix"]').evaluate(el=>{el.value='.35';el.dispatchEvent(new Event('input',{bubbles:true}));});
 await page.waitForFunction(()=>document.querySelector('#pluginFloat [data-bus-mix]').textContent==='65% DRY / 35% WET');
 await page.screenshot({path:'artifacts/circuit-bus/track.png'});await page.locator('#pluginFloat [data-float-close]').click();
 await page.locator('#mixerView .mixer-master [data-add-insert-track="master"]').click();await page.locator('#pluginSearch').fill('CIRCUIT BUS');await page.locator('[data-picker-load="circuitbus"]').click();await page.locator('#modal').waitFor({state:'hidden'});
 const master=page.locator('#masteringView .circuit-bus-hardware');await master.waitFor();assert.equal(await master.locator('[data-master-param]').count(),7);
 await page.screenshot({path:'artifacts/circuit-bus/master.png'});
 const measured=await page.evaluate(async()=>{
  const {createStudioEffects}=await import('/studio-pack-audio.js');const {mountCircuitBus,updateCircuitBusFaces}=await import('/circuit-bus-face.js');
  const ctx=new AudioContext();await ctx.resume();const scope={nodes:[],oscillators:[],node(kind,...args){const n=ctx[kind](...args);this.nodes.push(n);return n;}};
  const stage=createStudioEffects(ctx,scope,['circuitbus']).circuitbus;stage.comp.threshold.value=-30;stage.comp.ratio.value=8;stage.comp.attack.value=.001;stage.comp.release.value=.1;stage.wet.gain.value=1;stage.dry.gain.value=0;
  const tone=ctx.createOscillator(),mute=ctx.createGain();mute.gain.value=0;tone.connect(stage.input);stage.output.connect(mute);mute.connect(ctx.destination);
  const root=document.createElement('div');root.innerHTML='<div class="plugin-window-params">'+['threshold','ratio','knee','attack','release','mix','output'].map(k=>'<div class="param"><input data-param="circuitbus.'+k+'"></div>').join('')+'</div>';document.body.append(root);
  const state={enabled:true,mix:.35};mountCircuitBus(root,{state:()=>state,getReduction:()=>stage.comp.reduction});tone.start();await new Promise(r=>setTimeout(r,350));updateCircuitBusFaces(root);
  const result={gr:parseFloat(root.querySelector('[data-bus-gr]').textContent),native:stage.comp.reduction,active:root.querySelector('[data-bus-status]').textContent};state.enabled=false;updateCircuitBusFaces(root);result.bypass=root.querySelector('[data-bus-status]').textContent;result.bypassGr=root.querySelector('[data-bus-gr]').textContent;
  root.remove();tone.stop();await ctx.close();return result;
 });
 assert.ok(measured.gr<-.1,JSON.stringify(measured));assert.ok(Math.abs(measured.gr-measured.native)<.15);assert.equal(measured.active,'COMPRESSING');assert.equal(measured.bypass,'BYPASS');assert.equal(measured.bypassGr,'0.0 dB');
 await page.setViewportSize({width:390,height:844});await master.scrollIntoViewIfNeeded();assert.ok((await master.boundingBox()).width<=390);
 await page.screenshot({path:'artifacts/circuit-bus/mobile.png'});assert.deepEqual(errors,[]);console.log('PASS: CIRCUIT BUS native controls, blend, live compressor reduction, bypass and mobile',measured);
}finally{await browser.close();}
