import assert from 'node:assert/strict';import {mkdir} from 'node:fs/promises';import {chromium} from 'playwright';
await mkdir('artifacts/vox-doubler',{recursive:true});const browser=await chromium.launch({headless:true});try{
 const page=await browser.newPage({viewport:{width:1440,height:960}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8765/');await page.locator('[data-session-tab="create"]').click();await page.locator('#libraryNew').click();await page.locator('#modal').waitFor({state:'hidden'});
 await page.locator('[data-view="mixer"]').click();await page.locator('#mixerView [data-mixer-track]').first().locator('[data-add-insert-track]').click();
 await page.locator('#pluginSearch').fill('VOX DOUBLER');await page.locator('[data-picker-load="voxdoubler"]').click();await page.locator('#modal').waitFor({state:'hidden'});
 const face=page.locator('#pluginFloat .vox-doubler-hardware');await face.waitFor();assert.equal(await face.locator('[data-param]').count(),5);
 await face.locator('[data-param="voxdoubler.delay"]').evaluate((el,v)=>{el.value=v;el.dispatchEvent(new Event('input',{bubbles:true}));},'30');
 await page.waitForFunction(({selector,value})=>document.querySelector('#pluginFloat '+selector)?.textContent===value,{selector:'[data-double-l]',value:'30.0 ms'});
 assert.equal(await face.locator('[data-double-r]').textContent(),'33.0 ms');
 await face.locator('[data-param="voxdoubler.width"]').evaluate(el=>{el.value='1';el.dispatchEvent(new Event('input',{bubbles:true}));});await page.waitForFunction(()=>document.querySelector('#pluginFloat [data-double-width]').textContent==='WIDTH 100%');
 assert.equal(await face.locator('[data-double-left]').getAttribute('cx'),'34');assert.equal(await face.locator('[data-double-right]').getAttribute('cx'),'326');
 const metrics=await page.evaluate(async()=>{const {createStudioEffects,syncStudioEffect}=await import('/studio-pack-audio.js');const {doublerLayout}=await import('/vox-doubler-model.js');const ctx=new OfflineAudioContext(2,12000,48000),scope={oscillators:[],node:(kind,...args)=>ctx[kind](...args)};const m=createStudioEffects(ctx,scope,['voxdoubler']).voxdoubler;
 const state={enabled:true,delay:24,detune:0,voices:2,width:1,mix:1};syncStudioEffect(ctx,'voxdoubler',m,state,120,0,true,2);
 const input=ctx.createBuffer(1,128,48000);input.getChannelData(0)[0]=1;const source=ctx.createBufferSource();source.buffer=input;source.connect(m.input);m.output.connect(ctx.destination);source.start();const out=await ctx.startRendering();
 const peakIndex=channel=>{const a=out.getChannelData(channel);let index=0;for(let i=1;i<a.length;i++)if(Math.abs(a[i])>Math.abs(a[index]))index=i;return {index,peak:Math.abs(a[index])};};
 return {left:peakIndex(0),right:peakIndex(1),expected:doublerLayout(state).voices.map(v=>v.base*48000)};
 });assert.ok(metrics.left.peak>.1&&metrics.right.peak>.1,JSON.stringify(metrics));assert.ok(Math.abs(metrics.left.index-metrics.expected[0])<=1,JSON.stringify(metrics));assert.ok(Math.abs(metrics.right.index-metrics.expected[1])<=1,JSON.stringify(metrics));
 await page.screenshot({path:'artifacts/vox-doubler/track.png'});await page.locator('#pluginFloat [data-float-close]').click();
 await page.locator('#mixerView .mixer-master [data-add-insert-track="master"]').click();await page.locator('#pickerBundle').selectOption('VOX LAB');await page.locator('#pickerMode').selectOption('presets');await page.locator('[data-picker-preset="voxdoubler"]').first().click();await page.locator('#modal').waitFor({state:'hidden'});
 const master=page.locator('#masteringView .vox-doubler-hardware');await master.waitFor();assert.equal(await master.locator('[data-master-param]').count(),5);
 assert.equal(await master.locator('.vox-master-presets optgroup[label="Usine"] option').count(),5);
 await master.locator('.vox-master-presets select').selectOption('1');await master.locator('.vox-master-presets input').fill('QA vox-doubler');await master.locator('[data-vox-save]').click();
 assert.ok((await master.locator('.vox-master-presets select').innerText()).includes('QA vox-doubler'));
 await page.screenshot({path:'artifacts/vox-doubler/master.png'});await page.setViewportSize({width:390,height:844});await master.scrollIntoViewIfNeeded();assert.ok((await master.boundingBox()).width<=390);await page.screenshot({path:'artifacts/vox-doubler/mobile.png'});assert.deepEqual(errors,[]);
 console.log('PASS VOX DOUBLER: native controls, reactive display, master presets and mobile');
}finally{await browser.close();}
