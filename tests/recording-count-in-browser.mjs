import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';
import {emptyProject} from '../dist/audio.js';
import {ensurePlugins} from '../dist/plugins.js';
import {resizeStudio} from './browser-viewport.mjs';
const folder='artifacts/recording-count-in';await mkdir(folder,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--autoplay-policy=no-user-gesture-required']});let page,phase='boot';const errors=[];
try{
 page=await browser.newPage({viewport:{width:1440,height:960}});page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8765/');await page.locator('html[data-app-ready=true]').waitFor({state:'attached'});
 const project=emptyProject();project.name='Décompte QA';project.bpm=120;project.recording={gainDb:0,autoLevel:false,countInBars:0};project.audioSetup={channel:'stereo',monitor:false,latencyMs:0};
 project.tracks[0].id='micone';project.tracks[0].recordArm=true;project.tracks[0].recordInput='1';
 const second={...structuredClone(project.tracks[0]),id:'mictwo',name:'IN 2',recordInput:'2'};ensurePlugins(second);project.tracks.push(second);
 project.sections=[{name:'INTRO',start:0,length:4},{name:'COUPLET',start:4,length:12}];
 await page.locator('#projectInput').setInputFiles({name:'count.chayah',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({format:'chayah-studio',project,masterVolume:0,assets:[]}))});
 await page.waitForFunction(()=>/Projet importé et sauvegardé|Ouverture impossible/.test(document.querySelector('#toast').textContent));assert.equal(await page.locator('#toast').textContent(),'Projet importé et sauvegardé.');await page.locator('#modal').waitFor({state:'hidden'});
 // Deterministic stereo input, not a physical mic. Observe the actual native
 // worklet start message and transport while retaining production capture DSP.
 await page.evaluate(async()=>{
  const qa=window.countInQA={plays:[],starts:[],sources:[],events:[]};
  const {AudioEngine}=await import('/audio.js?v=0.14.0'),play=AudioEngine.prototype.play;
  AudioEngine.prototype.play=async function(options){qa.engine=this;await play.call(this,options);qa.plays.push({requested:options?.startAt??null,when:this.playStartAt,position:this.position,rate:this.ctx.sampleRate});};
  const send=MessagePort.prototype.postMessage;MessagePort.prototype.postMessage=function(data,...args){if(data?.type==='start'&&Number.isFinite(data.time))qa.starts.push({time:data.time,postedAt:qa.engine?.ctx.currentTime});return send.call(this,data,...args);};
  navigator.mediaDevices.getUserMedia=async()=>{
   if(qa.holdInput)await new Promise(resolve=>{qa.releaseInput=resolve;});
   const ctx=new AudioContext(),destination=ctx.createMediaStreamDestination(),merger=ctx.createChannelMerger(2);destination.channelCount=2;merger.connect(destination);
   for(const [i,hz] of [220,440].entries()){const o=ctx.createOscillator(),g=ctx.createGain();o.frequency.value=hz;g.gain.value=.1;o.connect(g);g.connect(merger,0,i);o.start();}
   await ctx.resume();qa.sources.push({ctx,stream:destination.stream});return destination.stream;
  };
  window.addEventListener('warlike:recording-telemetry',e=>qa.events.push(e.detail));
 });
 const save=async()=>{await page.locator('#projectMenuBtn').click();const pending=page.waitForEvent('download');await page.locator('#saveProject').click();return JSON.parse(await readFile(await(await pending).path(),'utf8'));};
 const quiet=async()=>{await page.waitForFunction(()=>!document.querySelector('#record').classList.contains('recording')&&!document.querySelector('#record').disabled);assert.equal(await page.locator('#recordCountInStatus').isVisible(),false);assert.ok(await page.evaluate(()=>window.countInQA.sources.every(s=>s.stream.getTracks().every(t=>t.readyState==='ended'))));};
 const start=async bars=>{await page.locator('#recordCountIn').selectOption(String(bars));await page.locator('#record').click();if(bars)await page.locator('#recordCountInStatus').waitFor({state:'visible'});else await page.waitForFunction(()=>document.querySelector('#record').classList.contains('recording'));};
 await page.locator('[data-seek-section="4"]').click();const cursor=await page.locator('#positionDisplay').textContent();assert.ok(cursor.startsWith('005'));
 phase='cancel pending permission';await page.evaluate(()=>window.countInQA.holdInput=true);await page.locator('#record').click();await page.waitForFunction(()=>typeof window.countInQA.releaseInput==='function');await page.locator('#stop').click();
 await page.waitForFunction(()=>!document.querySelector('#record').disabled);await page.evaluate(()=>{const qa=window.countInQA;qa.holdInput=false;qa.releaseInput();});
 await page.waitForFunction(()=>window.countInQA.sources.length===1&&window.countInQA.sources[0].stream.getTracks().every(t=>t.readyState==='ended'));assert.equal(await page.evaluate(()=>window.countInQA.starts.length),0);await quiet();
 phase='cancel two bars';await start(2);await page.waitForFunction(()=>window.countInQA.starts.length===1);
 assert.equal(await page.locator('#positionDisplay').textContent(),cursor);assert.equal(await page.locator('#recordCountIn').isDisabled(),true);
 await page.locator('#rewind').click();await page.locator('#modeSong').click();await page.locator('[data-seek-section="0"]').click();assert.equal(await page.locator('#positionDisplay').textContent(),cursor);
 await page.locator('#stop').click();await quiet();const cancelled=await save();assert.equal(cancelled.assets.length,0);assert.ok(cancelled.project.tracks.every(t=>t.clips.length===0));
 phase='one bar stereo take';await start(1);await page.waitForFunction(()=>window.countInQA.starts.length===2);
 assert.equal(await page.locator('#positionDisplay').textContent(),cursor);await page.screenshot({path:folder+'/counting-desktop.png'});
 const timing=await page.evaluate(()=>({play:window.countInQA.plays.at(-1),capture:window.countInQA.starts.at(-1)}));
 assert.ok(Math.abs(timing.play.when-timing.capture.time)<1e-9,'transport and PCM must start on the same audio-clock instant');assert.ok(timing.capture.time-timing.capture.postedAt>1.5,'capture is scheduled before the countdown ends');
 await page.waitForFunction(()=>window.countInQA.engine.ctx.currentTime>=window.countInQA.starts.at(-1).time+.5);
 await page.locator('#stop').click();await quiet();await page.waitForFunction(()=>document.querySelector('#toast').textContent.includes('2 prise(s) PCM enregistrée(s) et sauvegardée(s)'));
 const recorded=await save();assert.equal(recorded.assets.length,2);const clips=recorded.project.tracks.map(t=>t.clips[0]);assert.equal(clips[0].start,4);assert.equal(clips[1].start,4);assert.equal(clips[0].length,clips[1].length);
 const metrics=await page.evaluate(async state=>{
  const ctx=new AudioContext(),result=[];
  try{for(const [i,a] of state.assets.entries()){
   const buffer=await ctx.decodeAudioData(Uint8Array.from(atob(a.data),c=>c.charCodeAt(0)).buffer),pcm=buffer.getChannelData(0);let energy=0;
   for(const v of pcm){if(!Number.isFinite(v))throw Error('Nonfinite PCM');energy+=v*v;}
   const amplitude=hz=>{let re=0,im=0;for(let n=0;n<pcm.length;n++){const w=2*Math.PI*hz*n/buffer.sampleRate;re+=pcm[n]*Math.cos(w);im+=pcm[n]*Math.sin(w);}return 2*Math.hypot(re,im)/pcm.length;};
   result.push({frames:buffer.length,seconds:buffer.duration,rate:buffer.sampleRate,channels:buffer.numberOfChannels,rms:Math.sqrt(energy/pcm.length),tone220:amplitude(220),tone440:amplitude(440),click850:amplitude(850),click1200:amplitude(1200)});
  }}finally{await ctx.close();}return result;
 },recorded);
 assert.equal(metrics[0].frames,metrics[1].frames);for(const m of metrics){assert.equal(m.channels,1);assert.ok(m.seconds>.3&&m.seconds<1.5,'count-in must not become leading recorded audio');assert.ok(m.rms>.03);assert.ok(m.click850<.005&&m.click1200<.005,'output count-in must not feed captured PCM');}
 assert.ok(metrics.some(m=>m.tone220>.06&&m.tone440<.01));assert.ok(metrics.some(m=>m.tone440>.06&&m.tone220<.01));
 phase='zero bars and undo';await page.locator('#recordCountIn').selectOption('0');await page.locator('#undo').click();assert.equal(await page.locator('#recordCountIn').inputValue(),'1');await page.locator('#redo').click();assert.equal(await page.locator('#recordCountIn').inputValue(),'0');
 await start(0);await page.waitForFunction(()=>window.countInQA.starts.length===3);assert.equal(await page.locator('#recordCountInStatus').isVisible(),false);assert.equal(await page.evaluate(()=>window.countInQA.plays.at(-1).requested),null);
 await page.waitForFunction(()=>window.countInQA.engine.ctx.currentTime>=window.countInQA.starts.at(-1).time+.35);await page.locator('#stop').click();await quiet();
 const zero=await save();for(const a of recorded.assets)assert.equal(zero.assets.find(b=>b.id===a.id)?.data,a.data,'an existing take must remain byte-for-byte intact');
 phase='context suspension';await start(2);await page.waitForFunction(()=>window.countInQA.starts.length===4);await page.evaluate(()=>window.countInQA.engine.ctx.suspend());await quiet();const suspended=await save();assert.equal(suspended.assets.length,zero.assets.length);
 phase='settings roundtrip';await page.locator('#recordSettings').click();await page.locator('#workflowCountIn').selectOption('2');await page.locator('#saveAudioSetup').click();await page.locator('#modal').waitFor({state:'hidden'});assert.equal(await page.locator('#recordCountIn').inputValue(),'2');
 await page.locator('#saveStatus').getByText('Enregistré sur cet appareil').waitFor({state:'visible'});await page.reload();await page.locator('[data-project-open]').first().click();await page.locator('#modal').waitFor({state:'hidden'});assert.equal(await page.locator('#recordCountIn').inputValue(),'2');
 phase='mobile themes';
 for(const theme of ['forest','graphite','slate','light']){
  await resizeStudio(page,{width:1440,height:960});await page.locator('.top-actions [data-studio-theme]').selectOption(theme);await resizeStudio(page,{width:390,height:844});
  const r=await page.locator('#recordCountIn').boundingBox();assert.ok(r&&r.x>=0&&r.x+r.width<=391&&r.y>=0&&r.y+r.height<=845);await page.screenshot({path:folder+'/mobile-'+theme+'.png'});
 }
 await writeFile(folder+'/report.json',JSON.stringify({timing,metrics,cancelledClips:0,oldTakesPreserved:true,themes:4},null,2));assert.deepEqual(errors,[]);
 console.log('PASS: audio-clock count-in, same-time stereo PCM start, cursor hold, transport guards, cancellation without takes, no click bleed, zero-bar compatibility, suspension, undo, persisted settings and four mobile themes');
}catch(error){console.error('Count-in failed at',phase,errors);await page?.screenshot({path:folder+'/failure.png',fullPage:true}).catch(()=>{});throw error;}finally{await browser.close();}
