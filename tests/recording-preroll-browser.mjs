import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';
import {emptyProject} from '../dist/audio.js';
import {encodeWav} from '../dist/wav.js';
import {resizeStudio} from './browser-viewport.mjs';
const folder='artifacts/recording-preroll';await mkdir(folder,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--autoplay-policy=no-user-gesture-required']});let page,phase='boot';const errors=[];
try{
 page=await browser.newPage({viewport:{width:1440,height:960}});page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8765/');await page.locator('html[data-app-ready=true]').waitFor({state:'attached'});
 const project=emptyProject();project.name='Prélecture QA';project.bpm=240;project.recording={gainDb:0,autoLevel:false,countInBars:0};project.audioSetup={channel:'stereo',monitor:false,latencyMs:0,keepTakes:true};
 project.sections=[{name:'INTRO',start:0,length:1},{name:'REFRAIN',start:4,length:1},{name:'PONT',start:8,length:4}];
 project.tracks[0].id='inputone';project.tracks[0].recordArm=true;project.tracks[0].recordInput='1';project.tracks[0].clips=[{id:'oldclip',name:'Original à garder',start:0,length:1,audioId:'oldasset'}];
 project.tracks.push({...structuredClone(project.tracks[0]),id:'inputtwo',name:'IN 2',recordInput:'2',clips:[]});
 project.tracks.push({...structuredClone(project.tracks[0]),id:'backing',name:'Accompagnement',recordArm:false,clips:[{id:'backclip',name:'Contexte musical',start:2,length:3,audioId:'backasset'}]});
 const tone=(hz,seconds)=>{const samples=Float32Array.from({length:8000*seconds},(_,i)=>.1*Math.sin(i*2*Math.PI*hz/8000));return Buffer.from(encodeWav({numberOfChannels:1,length:samples.length,sampleRate:8000,getChannelData:()=>samples})).toString('base64');};
 await page.locator('#projectInput').setInputFiles({name:'preroll.chayah',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({format:'chayah-studio',project,masterVolume:0,assets:[{id:'oldasset',name:'original.wav',data:tone(330,1)},{id:'backasset',name:'contexte.wav',data:tone(880,3)}]}))});
 await page.waitForFunction(()=>/Projet importé et sauvegardé|Ouverture impossible/.test(document.querySelector('#toast').textContent));assert.equal(await page.locator('#toast').textContent(),'Projet importé et sauvegardé.');await page.locator('#modal').waitFor({state:'hidden'});
 await page.evaluate(async()=>{
  const qa=window.preRollQA={starts:[],plays:[],sources:[]};
  const {AudioEngine}=await import('/audio.js?v=0.14.0'),init=AudioEngine.prototype.init,play=AudioEngine.prototype.play;
  AudioEngine.prototype.init=async function(){qa.engine=this;return init.call(this);};
  AudioEngine.prototype.play=async function(options){await play.call(this,options);qa.plays.push({when:this.playStartAt,position:this.position,requested:options?.startAt??null});};
  const send=MessagePort.prototype.postMessage;MessagePort.prototype.postMessage=function(data,...args){if(data?.type==='start'&&Number.isFinite(data.time)){
   qa.starts.push({time:data.time,endTime:data.endTime??null,rate:qa.engine.ctx.sampleRate,postedAt:qa.engine.ctx.currentTime});
   // Native automation changes both input tones exactly at punch-in. The
   // pre-roll tones and the audible backing must not leak into recorded PCM.
   qa.sources.at(-1).voices.forEach((o,i)=>o.frequency.setValueAtTime([220,440][i],data.time));
  }return send.call(this,data,...args);};
  navigator.mediaDevices.getUserMedia=async()=>{
   const ctx=qa.engine.ctx,destination=ctx.createMediaStreamDestination(),merger=ctx.createChannelMerger(2),voices=[];destination.channelCount=2;merger.connect(destination);
   for(const [i,hz] of [700,1100].entries()){const o=ctx.createOscillator(),g=ctx.createGain();o.frequency.value=hz;g.gain.value=.1;o.connect(g);g.connect(merger,0,i);o.start();voices.push(o);}
   const stream=destination.stream;stream.getAudioTracks()[0].addEventListener('ended',()=>voices.forEach(o=>o.stop()),{once:true});qa.sources.push({stream,voices});return stream;
  };
 });
 const save=async()=>{await page.locator('#projectMenuBtn').click();const pending=page.waitForEvent('download');await page.locator('#saveProject').click();return JSON.parse(await readFile(await(await pending).path(),'utf8'));};
 const ready=async()=>{await page.waitForFunction(()=>!document.querySelector('#record').classList.contains('recording')&&!document.querySelector('#record').disabled);assert.equal(await page.locator('#recordCountInStatus').isVisible(),false);assert.ok(await page.evaluate(()=>window.preRollQA.sources.every(s=>s.stream.getTracks().every(t=>t.readyState==='ended'))));};
 const begin=async()=>{const count=await page.evaluate(()=>window.preRollQA.starts.length);await page.locator('#record').click();await page.waitForFunction(n=>window.preRollQA.starts.length>n,count);};
 const open=async()=>{await page.locator('#recordSettings').click();await page.locator('#modal').waitFor({state:'visible'});await page.locator('#recordPreRoll').waitFor({state:'visible'});};
 const apply=async()=>{await page.locator('#saveAudioSetup').click();await page.locator('#modal').waitFor({state:'hidden'});};
 const before=await save();
 phase='configure pre-roll';await open();await page.locator('#recordRangeEnabled').check();await page.locator('#recordRangeSection').selectOption('1');await page.locator('#recordPreRoll').selectOption('2');await apply();
 await page.locator('[data-seek-section="8"]').click();await page.waitForFunction(()=>document.querySelector('#positionDisplay').textContent.startsWith('009'));
 phase='cancel during pre-roll';await begin();await page.waitForFunction(()=>document.querySelector('#recordCountInStatus').textContent.startsWith('Prélecture'));await page.locator('#stop').click();await ready();assert.ok((await page.locator('#positionDisplay').textContent()).startsWith('009'));
 const cancelled=await save();assert.deepEqual(cancelled.assets,before.assets);assert.deepEqual(cancelled.project.tracks,before.project.tracks);
 phase='count-in then audible pre-roll';await page.locator('#recordCountIn').selectOption('1');await begin();await page.waitForFunction(()=>document.querySelector('#recordCountInStatus').textContent.startsWith('Décompte'));
 const timing=await page.evaluate(()=>({play:window.preRollQA.plays.at(-1),capture:window.preRollQA.starts.at(-1)}));assert.equal(timing.play.position,32);assert.ok(Math.abs(timing.capture.time-timing.play.when-2)<1e-8);assert.ok(timing.capture.time-timing.capture.postedAt>2.5);
 await page.waitForFunction(()=>window.preRollQA.engine.ctx.currentTime>=window.preRollQA.plays.at(-1).when+.3);
 assert.match(await page.locator('#recordCountInStatus').textContent(),/^Prélecture/);
 const backingRms=await page.evaluate(()=>{const a=window.preRollQA.engine.masterAnalyser,pcm=new Float32Array(a.fftSize);a.getFloatTimeDomainData(pcm);return Math.sqrt(pcm.reduce((sum,v)=>sum+v*v,0)/pcm.length);});assert.ok(backingRms>.015,'the backing really plays during pre-roll');
 const transport=await page.locator('.transport').boundingBox();
 for(const id of ['recordCountIn','recordCountInStatus','recordRangeIndicator']){const box=await page.locator('#'+id).boundingBox();assert.ok(box&&box.y>=transport.y&&box.y+box.height<=transport.y+transport.height,'active '+id+' fits the transport');}
 await page.screenshot({path:folder+'/preroll-desktop.png'});
 await resizeStudio(page,{width:390,height:844});
 const mobileTransport=await page.locator('.transport').boundingBox();for(const id of ['recordCountIn','recordCountInStatus','recordRangeIndicator']){const box=await page.locator('#'+id).boundingBox();assert.ok(box&&box.x>=0&&box.x+box.width<=391&&box.y>=mobileTransport.y&&box.y+box.height<=mobileTransport.y+mobileTransport.height,'active mobile '+id+' fits the transport');}
 await page.screenshot({path:folder+'/preroll-mobile.png'});await resizeStudio(page,{width:1440,height:960});
 phase='capture begins during UI stall';await page.waitForFunction(()=>window.preRollQA.engine.ctx.currentTime>=window.preRollQA.starts.at(-1).time-.1);await page.evaluate(()=>{const until=performance.now()+500;while(performance.now()<until){/* UI observer cannot schedule the punch-in. */}});await ready();
 const bounded=await save(),expectedFrames=Math.round(timing.capture.endTime*timing.capture.rate)-Math.round(timing.capture.time*timing.capture.rate);
 const metrics=await page.evaluate(async state=>{const ctx=new AudioContext(),result=[];try{for(const track of state.project.tracks.filter(t=>t.recordArm)){
  const clip=track.clips.findLast(c=>c.recorded),asset=state.assets.find(a=>a.id===clip.audioId),b=await ctx.decodeAudioData(Uint8Array.from(atob(asset.data),c=>c.charCodeAt(0)).buffer),pcm=b.getChannelData(0);
  const amplitude=hz=>{let re=0,im=0;for(let n=0;n<pcm.length;n++){const w=2*Math.PI*hz*n/b.sampleRate;re+=pcm[n]*Math.cos(w);im+=pcm[n]*Math.sin(w);}return 2*Math.hypot(re,im)/pcm.length;};
  result.push({start:clip.start,length:clip.length,frames:b.length,rate:b.sampleRate,channels:b.numberOfChannels,tone220:amplitude(220),tone440:amplitude(440),before700:amplitude(700),before1100:amplitude(1100),backing880:amplitude(880)});
 }}finally{await ctx.close();}return result;},bounded);
 assert.equal(metrics.length,2);for(const m of metrics){assert.equal(m.frames,expectedFrames);assert.equal(m.channels,1);assert.equal(m.start,4);assert.ok(m.start+m.length<=5+1e-8);assert.ok(m.before700<.005&&m.before1100<.005&&m.backing880<.005);}assert.ok(metrics.some(m=>m.tone220>.06&&m.tone440<.005));assert.ok(metrics.some(m=>m.tone440>.06&&m.tone220<.005));
 for(const a of before.assets)assert.equal(bounded.assets.find(b=>b.id===a.id)?.data,a.data);assert.deepEqual(bounded.project.tracks[0].clips.find(c=>c.id==='oldclip'),before.project.tracks[0].clips[0]);
 phase='manual stop while pre-roll UI observer is late';await page.locator('#recordCountIn').selectOption('0');await begin();await page.waitForFunction(()=>window.preRollQA.engine.ctx.currentTime>=window.preRollQA.starts.at(-1).time-.1);await page.evaluate(()=>{const until=performance.now()+400;while(performance.now()<until){}document.querySelector('#stop').click();});await ready();const partial=await save();for(const t of partial.project.tracks.filter(t=>t.recordArm)){const c=t.clips.findLast(c=>c.recorded);assert.equal(c.start,4);assert.ok(c.length>.1&&c.length<.8);}for(const a of bounded.assets)assert.equal(partial.assets.find(b=>b.id===a.id)?.data,a.data);
 phase='suspended pre-roll';await begin();await page.waitForFunction(()=>document.querySelector('#recordCountInStatus').textContent.startsWith('Prélecture'));await page.evaluate(()=>window.preRollQA.engine.ctx.suspend());await ready();assert.deepEqual((await save()).assets,partial.assets);
 phase='start of song clamps pre-roll';await open();await page.locator('#recordRangeSection').selectOption('0');await page.locator('#recordPreRoll').selectOption('4');await apply();await begin();const atOrigin=await page.evaluate(()=>({play:window.preRollQA.plays.at(-1),capture:window.preRollQA.starts.at(-1)}));assert.equal(atOrigin.play.position,0);assert.ok(Math.abs(atOrigin.capture.time-atOrigin.play.when)<1e-8);assert.equal(await page.locator('#recordCountInStatus').isVisible(),false);await ready();
 phase='disabled range and undo';await open();await page.locator('#recordRangeSection').selectOption('1');await page.locator('#recordPreRoll').selectOption('2');await page.locator('#recordRangeEnabled').uncheck();assert.equal(await page.locator('#recordPreRoll').isDisabled(),true);await apply();await page.locator('#undo').click();await open();assert.equal(await page.locator('#recordPreRoll').inputValue(),'4');await page.locator('#closeModal').click();await page.locator('#redo').click();await begin();const free=await page.evaluate(()=>({play:window.preRollQA.plays.at(-1),capture:window.preRollQA.starts.at(-1)}));assert.equal(free.capture.endTime,null);assert.ok(Math.abs(free.capture.time-free.play.when)<1e-8);await page.waitForFunction(()=>window.preRollQA.engine.ctx.currentTime>=window.preRollQA.starts.at(-1).time+.25);await page.locator('#stop').click();await ready();
 phase='saved settings and four themes';await open();await page.locator('#recordRangeEnabled').check();await apply();const portable=await save();assert.deepEqual(portable.project.recording.range,{enabled:true,start:4,end:5,preRollBars:2});await page.locator('#saveStatus').getByText('Enregistré sur cet appareil').waitFor({state:'visible'});await page.reload();await page.locator('[data-project-open]').first().click();await page.locator('#modal').waitFor({state:'hidden'});
 for(const theme of ['forest','graphite','slate','light']){await resizeStudio(page,{width:1440,height:960});await page.locator('.top-actions [data-studio-theme]').selectOption(theme);await resizeStudio(page,{width:390,height:844});await open();assert.equal(await page.locator('#recordPreRoll').inputValue(),'2');await page.locator('#recordPreRoll').scrollIntoViewIfNeeded();const box=await page.locator('.recording-range-settings').boundingBox();assert.ok(box&&box.x>=0&&box.x+box.width<=391);await page.screenshot({path:folder+'/mobile-settings-'+theme+'.png'});await page.locator('#closeModal').click();}
 await writeFile(folder+'/report.json',JSON.stringify({timing,backingRms,expectedFrames,metrics,stalledUIAtPunchIn:true,oldAudioPreserved:true,cancelledClips:0,themes:4},null,2));assert.deepEqual(errors,[]);
 console.log('PASS: audible pre-roll, native punch-in during UI stall, no pre-roll/backing in stereo capture, cancellation/cursor restore, manual stop, suspension, origin clamp, disabled range, undo, persistence and four mobile themes');
}catch(error){console.error('Recording pre-roll failed at',phase,errors);await page?.screenshot({path:folder+'/failure.png',fullPage:true}).catch(()=>{});throw error;}finally{await browser.close();}
