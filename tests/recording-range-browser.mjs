import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';
import {emptyProject} from '../dist/audio.js';
import {encodeWav} from '../dist/wav.js';
import {resizeStudio} from './browser-viewport.mjs';
const folder='artifacts/recording-range';await mkdir(folder,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--autoplay-policy=no-user-gesture-required']});let page,phase='boot';const errors=[];
try{
 page=await browser.newPage({viewport:{width:1440,height:960}});page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8765/');await page.locator('html[data-app-ready=true]').waitFor({state:'attached'});
 const project=emptyProject();project.name='Plage QA';project.bpm=240;project.recording={gainDb:0,autoLevel:false,countInBars:0};project.audioSetup={channel:'stereo',monitor:false,latencyMs:0,keepTakes:true};
 project.sections=[{name:'INTRO',start:0,length:4},{name:'REFRAIN',start:4,length:1},{name:'PONT',start:8,length:4}];
 project.tracks[0].id='inputone';project.tracks[0].recordArm=true;project.tracks[0].recordInput='1';project.tracks[0].clips=[{id:'oldclip',name:'Original à garder',start:0,length:1,audioId:'oldasset'}];
 project.tracks.push({...structuredClone(project.tracks[0]),id:'inputtwo',name:'IN 2',recordInput:'2',clips:[]});
 const samples=Float32Array.from({length:8000},(_,i)=>.05*Math.sin(i*2*Math.PI*330/8000)),wav=Buffer.from(encodeWav({numberOfChannels:1,length:samples.length,sampleRate:8000,getChannelData:()=>samples}));
 await page.locator('#projectInput').setInputFiles({name:'range.chayah',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({format:'chayah-studio',project,masterVolume:0,assets:[{id:'oldasset',name:'original.wav',data:wav.toString('base64')}]}))});
 await page.waitForFunction(()=>/Projet importé et sauvegardé|Ouverture impossible/.test(document.querySelector('#toast').textContent));assert.equal(await page.locator('#toast').textContent(),'Projet importé et sauvegardé.');await page.locator('#modal').waitFor({state:'hidden'});
 await page.evaluate(async()=>{
  const qa=window.rangeQA={starts:[],sources:[],calls:0},send=MessagePort.prototype.postMessage;
  const {AudioEngine}=await import('/audio.js?v=0.14.0'),play=AudioEngine.prototype.play;
  AudioEngine.prototype.play=async function(options){qa.engine=this;return play.call(this,options);};
  MessagePort.prototype.postMessage=function(data,...args){if(data?.type==='start'&&Number.isFinite(data.time))qa.starts.push({time:data.time,endTime:data.endTime??null,rate:qa.engine.ctx.sampleRate});return send.call(this,data,...args);};
  navigator.mediaDevices.getUserMedia=async()=>{qa.calls++;const ctx=new AudioContext(),destination=ctx.createMediaStreamDestination(),merger=ctx.createChannelMerger(2);destination.channelCount=2;merger.connect(destination);
   for(const [i,hz] of [220,440].entries()){const source=ctx.createOscillator(),gain=ctx.createGain();source.frequency.value=hz;gain.gain.value=.1;source.connect(gain);gain.connect(merger,0,i);source.start();}
   await ctx.resume();qa.sources.push({ctx,stream:destination.stream});return destination.stream;};
 });
 const save=async()=>{await page.locator('#projectMenuBtn').click();const pending=page.waitForEvent('download');await page.locator('#saveProject').click();return JSON.parse(await readFile(await(await pending).path(),'utf8'));};
 const ready=async()=>{await page.waitForFunction(()=>!document.querySelector('#record').classList.contains('recording')&&!document.querySelector('#record').disabled);assert.ok(await page.evaluate(()=>window.rangeQA.sources.every(s=>s.stream.getTracks().every(t=>t.readyState==='ended'))));};
 const begin=async()=>{const count=await page.evaluate(()=>window.rangeQA.starts.length);await page.locator('#record').click();await page.waitForFunction(n=>window.rangeQA.starts.length>n,count);};
 const openRange=async()=>{await page.locator('#recordRangeIndicator').click();await page.locator('#modal').waitFor({state:'visible'});await page.locator('#recordRangeEnabled').waitFor({state:'visible'});};
 const before=await save();
 phase='configure section';await page.locator('#recordSettings').click();await page.locator('#recordRangeEnabled').check();await page.locator('#recordRangeSection').selectOption('1');
 assert.equal(await page.locator('#recordRangeStart').inputValue(),'5');assert.equal(await page.locator('#recordRangeEnd').inputValue(),'6');await page.locator('#saveAudioSetup').click();await page.locator('#modal').waitFor({state:'hidden'});await page.locator('#recordRangeIndicator').waitFor({state:'visible'});
 await page.locator('[data-seek-section="8"]').click();await page.waitForFunction(()=>document.querySelector('#positionDisplay').textContent.startsWith('009'));
 phase='cancel count-in';await page.locator('#recordCountIn').selectOption('1');await begin();await page.locator('#recordCountInStatus').waitFor({state:'visible'});await page.locator('#stop').click();await ready();await page.waitForFunction(()=>document.querySelector('#positionDisplay').textContent.startsWith('009'));
 const cancelled=await save();assert.equal(cancelled.assets.length,1);assert.deepEqual(cancelled.project.tracks.map(t=>t.clips),before.project.tracks.map(t=>t.clips));assert.equal(cancelled.project.bars,16);
 phase='automatic frame stop during UI stall';await begin();
 const first=await page.evaluate(()=>window.rangeQA.starts.at(-1));assert.ok(Math.abs(first.endTime-first.time-1)<1e-9);
 await page.waitForFunction(()=>window.rangeQA.engine.ctx.currentTime>=window.rangeQA.starts.at(-1).endTime-.12);
 await page.evaluate(()=>{const until=performance.now()+450;while(performance.now()<until){/* emulate a blocked UI, while AudioWorklet keeps running */}});
 await ready();await page.waitForFunction(()=>document.querySelector('#toast').textContent.includes('2 prise(s) PCM enregistrée(s) et sauvegardée(s)'));
 const bounded=await save(),takes=bounded.project.tracks.map(t=>t.clips.findLast(c=>c.recorded));assert.ok(takes.every(Boolean));assert.ok(takes.every(c=>c.start===4&&c.start+c.length<=5+1e-8));assert.equal(bounded.project.bars,16);
 const expected=Math.round(first.endTime*first.rate)-Math.round(first.time*first.rate);
 const metrics=await page.evaluate(async state=>{const ctx=new AudioContext(),out=[];try{for(const track of state.project.tracks){const clip=track.clips.findLast(c=>c.recorded),asset=state.assets.find(a=>a.id===clip.audioId),raw=Uint8Array.from(atob(asset.data),c=>c.charCodeAt(0));const b=await ctx.decodeAudioData(raw.buffer),pcm=b.getChannelData(0);let energy=0;for(const v of pcm){if(!Number.isFinite(v))throw Error('Nonfinite PCM');energy+=v*v;}out.push({rate:b.sampleRate,frames:b.length,channels:b.numberOfChannels,rms:Math.sqrt(energy/b.length)});}}finally{await ctx.close();}return out;},bounded);
 assert.ok(metrics.every(m=>m.frames===expected&&m.rate===first.rate&&m.channels===1&&m.rms>.03));assert.equal(bounded.assets.find(a=>a.id==='oldasset').data,before.assets[0].data);assert.deepEqual(bounded.project.tracks[0].clips.find(c=>c.id==='oldclip'),before.project.tracks[0].clips[0]);
 phase='second take preserves old media';await page.locator('#recordCountIn').selectOption('0');await begin();await ready();const repeated=await save();
 for(const a of bounded.assets)assert.equal(repeated.assets.find(b=>b.id===a.id)?.data,a.data);
 assert.ok(repeated.project.tracks.every(t=>t.playlists.some(l=>l.clips.some(c=>takes.some(old=>old.id===c.id)))));
 phase='manual early stop';await begin();await page.waitForFunction(()=>window.rangeQA.engine.ctx.currentTime>=window.rangeQA.starts.at(-1).time+.25);await page.locator('#stop').click();await ready();const partial=await save();
 for(const track of partial.project.tracks){const clip=track.clips.findLast(c=>c.recorded);assert.ok(clip.start===4&&clip.length>.1&&clip.length<.8);}
 phase='invalid range';await openRange();await page.locator('#recordRangeEnd').fill('4');await page.locator('#saveAudioSetup').click();assert.equal(await page.locator('#modal').isVisible(),true);assert.match(await page.locator('#toast').textContent(),/Plage de prise invalide/);await page.locator('#closeModal').click();
 phase='latency stays inside range';await openRange();await page.locator('#recordLatency').fill('25');await page.locator('#saveAudioSetup').click();await page.locator('#modal').waitFor({state:'hidden'});await begin();await ready();const compensated=await save();
 for(const track of compensated.project.tracks){const clip=track.clips.findLast(c=>c.recorded);assert.equal(clip.start,4);assert.ok(Math.abs(clip.sourceOffset-.025)<1e-8);assert.ok(clip.start+clip.length<=5+1e-8);}
 phase='disabled range compatibility';await openRange();await page.locator('#recordRangeEnabled').uncheck();await page.locator('#recordLatency').fill('0');await page.locator('#saveAudioSetup').click();await page.locator('#modal').waitFor({state:'hidden'});await page.locator('#undo').click();await page.locator('#recordRangeIndicator').waitFor({state:'visible'});await page.locator('#redo').click();await page.locator('#recordRangeIndicator').waitFor({state:'hidden'});
 await begin();assert.equal(await page.evaluate(()=>window.rangeQA.starts.at(-1).endTime),null);await page.waitForFunction(()=>window.rangeQA.engine.ctx.currentTime>=window.rangeQA.starts.at(-1).time+1.2);assert.equal(await page.locator('#record').getAttribute('class').then(s=>s.includes('recording')),true);await page.locator('#stop').click();await ready();
 phase='range persistence';await page.locator('#recordSettings').click();await page.locator('#recordRangeEnabled').check();await page.locator('#saveAudioSetup').click();await page.locator('#modal').waitFor({state:'hidden'});const portable=await save();assert.deepEqual(portable.project.recording.range,{enabled:true,start:4,end:5});await page.locator('#saveStatus').getByText('Enregistré sur cet appareil').waitFor({state:'visible'});
 await page.reload();await page.locator('[data-project-open]').first().click();await page.locator('#modal').waitFor({state:'hidden'});await page.locator('#recordRangeIndicator').waitFor({state:'visible'});
 phase='four mobile themes';for(const theme of ['forest','graphite','slate','light']){
  await resizeStudio(page,{width:1440,height:960});await page.locator('.top-actions [data-studio-theme]').selectOption(theme);await page.screenshot({path:folder+'/desktop-'+theme+'.png'});await resizeStudio(page,{width:390,height:844});
  for(const id of ['recordCountIn','recordRangeIndicator']){const r=await page.locator('#'+id).boundingBox();assert.ok(r&&r.x>=0&&r.x+r.width<=391&&r.y>=0&&r.y+r.height<=845);}
  await openRange();await page.locator('#recordRangeStart').scrollIntoViewIfNeeded();const box=await page.locator('.recording-range-settings').boundingBox();assert.ok(box&&box.x>=0&&box.x+box.width<=391);await page.screenshot({path:folder+'/mobile-settings-'+theme+'.png'});await page.locator('#closeModal').click();
 }
 await writeFile(folder+'/report.json',JSON.stringify({first,expectedFrames:expected,metrics,stalledUI:true,oldAudioPreserved:true,themes:4},null,2));assert.deepEqual(errors,[]);
 console.log('PASS: native frame-bounded stereo range during UI stall, section picker, count-in cancellation/cursor restore, automatic/manual stop, prior takes/media, latency bounds, disabled compatibility, undo, persistence and four themes');
}catch(error){console.error('Recording range failed at',phase,errors);await page?.screenshot({path:folder+'/failure.png',fullPage:true}).catch(()=>{});throw error;}finally{await browser.close();}
