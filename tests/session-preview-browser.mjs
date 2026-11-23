import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';
import {emptyProject} from '../dist/audio.js';
import {createContentTrack,SESSION_TEMPLATES} from '../dist/content.js';
import {encodeWav} from '../dist/wav.js';
import {resizeStudio} from './browser-viewport.mjs';
const folder='artifacts/session-preview';await mkdir(folder,{recursive:true});
const browser=await chromium.launch({headless:true});let page,current='boot';const errors=[];
try{
 page=await browser.newPage({viewport:{width:1440,height:960}});page.setDefaultTimeout(30000);page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8765/');await page.locator('html[data-app-ready="true"]').waitFor({state:'attached'});
 const project=emptyProject();project.name='Projet à conserver';project.bpm=97;project.swing=17;project.masterVolume=-18;project.sections=[{name:'INTRO USER',start:0,length:4},{name:'COUPLET USER',start:4,length:12}];
 const instrument=createContentTrack('wltitan');instrument.id='usertrack';instrument.clips=[{id:'userclip',name:'Mon motif',start:1,length:1,patternSteps:16,notes:[{id:'usernote',midi:48,step:2,len:4,velocity:.63}]}];
 const audio=project.tracks[0];audio.id='useraudio';audio.clips=[{id:'audioclip',name:'Mon audio',start:0,length:1,audioId:'assetpreview'}];project.tracks.unshift(instrument);
 const data=Float32Array.from({length:4000},(_,i)=>.12*Math.sin(i*2*Math.PI*220/8000));const wav=Buffer.from(encodeWav({numberOfChannels:1,length:data.length,sampleRate:8000,getChannelData:()=>data}));
 const upload=async state=>{
  await page.locator('#projectInput').setInputFiles({name:'user.chayah',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(state))});
  await page.waitForFunction(name=>document.querySelector('#projectName').value===name,state.project.name);await page.locator('#modal').waitFor({state:'hidden'});
 };
 await upload({format:'chayah-studio',project,masterVolume:-18,assets:[{id:'assetpreview',name:'mine.wav',data:wav.toString('base64')}]});
 const save=async()=>{await page.locator('#projectMenuBtn').click();const pending=page.waitForEvent('download');await page.locator('#saveProject').click();return JSON.parse(await readFile(await(await pending).path(),'utf8'));};
 await page.locator('[data-seek-section="4"]').click();await page.waitForFunction(()=>document.querySelector('#positionDisplay').textContent.startsWith('005'));
 const before=await save(),undoBefore=await page.locator('#undo').isEnabled(),cursorBefore=await page.locator('#positionDisplay').textContent();
 // Observe the actual production renderer and buffer sources, while retaining its DSP.
 await page.evaluate(async()=>{
  const {AudioEngine}=await import('/audio.js?v=0.14.0'),render=AudioEngine.prototype.renderRange,start=AudioBufferSourceNode.prototype.start;
  window.sessionPreviewQA={metrics:[],attempts:0,completed:0,sources:[],hold:false,fail:false};
  AudioEngine.prototype.renderRange=async function(options){
   const q=window.sessionPreviewQA;if(!options.project?.demo)return render.call(this,options);q.attempts++;
   try{
    if(q.hold)await new Promise(resolve=>{q.release=resolve;});
    if(q.fail)throw Error('Source QA indisponible');
    const b=await render.call(this,options);let peak=0,energy=0;
    for(let ch=0;ch<b.numberOfChannels;ch++)for(const x of b.getChannelData(ch)){if(!Number.isFinite(x))throw Error('Invalid preview PCM');peak=Math.max(peak,Math.abs(x));energy+=x*x;}
    q.metrics.push({name:options.project.name,startBar:options.startBar,endBar:options.endBar,seconds:b.duration,rate:b.sampleRate,channels:b.numberOfChannels,peak,rms:Math.sqrt(energy/(b.length*b.numberOfChannels))});return b;
   }finally{q.completed++;}
  };
  AudioBufferSourceNode.prototype.start=function(...args){
   if(this.context instanceof AudioContext&&this.buffer?.duration>6&&this.buffer?.duration<13){const entry={ended:false};window.sessionPreviewQA.sources.push(entry);this.addEventListener('ended',()=>entry.ended=true,{once:true});}
   return start.apply(this,args);
  };
 });
 const open=async()=>{await page.locator('#projectMenuBtn').click();await page.locator('#factorySessions').click();};
 await open();assert.equal(await page.locator('[data-session-preview]').count(),SESSION_TEMPLATES.length);
 const assertCards=async()=>{
  const cards=await page.locator('.session-card').evaluateAll(nodes=>nodes.map(card=>{
   const r=card.getBoundingClientRect();return {name:card.querySelector('h3').textContent,overflow:card.scrollHeight-card.clientHeight,actions:[...card.querySelectorAll('.content-card-actions button')].map(button=>{const b=button.getBoundingClientRect();return {left:b.left-r.left,right:r.right-b.right,top:b.top-r.top,bottom:r.bottom-b.bottom};})};
  }));
  for(const card of cards){assert.ok(card.overflow<=1,card.name+' has clipped content');assert.equal(card.actions.length,3);assert.ok(card.actions.every(b=>b.left>=0&&b.right>=-1&&b.top>=0&&b.bottom>=-1),card.name+' hides an action');}
 };
 await assertCards();
 const panel=page.locator('.session-preview-panel'),button=id=>page.locator('[data-session-preview="'+id+'"]');
 const playing=async name=>page.waitForFunction(name=>document.querySelector('.session-preview-panel')?.dataset.state==='playing'&&document.querySelector('[data-session-preview-status]').textContent.includes(name),name,{timeout:90000});
 const stop=async()=>{await page.locator('[data-session-preview-stop]').click();await page.waitForFunction(()=>document.querySelector('.session-preview-panel').dataset.state==='idle');await page.waitForFunction(()=>window.sessionPreviewQA.sources.every(s=>s.ended));};
 for(const [i,t] of SESSION_TEMPLATES.entries()){
  current=t.id;if(i===0)await button(t.id).press('Enter');else await button(t.id).click();await playing(t.name);
  assert.equal(await page.locator('[data-session-preview][aria-pressed="true"]').count(),1);
  await page.waitForFunction(()=>document.querySelector('[data-session-preview-progress]').value>0);
  if(i===SESSION_TEMPLATES.length-1){await page.waitForFunction(()=>document.querySelector('.session-preview-panel').dataset.state==='idle',null,{timeout:20000});}
  else await stop();
 }
 const metrics=await page.evaluate(()=>window.sessionPreviewQA.metrics);assert.equal(metrics.length,9);
 for(const [i,m] of metrics.entries()){
  assert.equal(m.name,SESSION_TEMPLATES[i].name);assert.equal(m.endBar-m.startBar,4);assert.equal(m.channels,2);assert.equal(m.rate,44100);
  assert.ok(Math.abs(m.seconds-4*240/SESSION_TEMPLATES[i].bpm)<.02);assert.ok(m.peak>.02&&m.peak<.999);assert.ok(m.rms>.002);
 }
 // The last two auditions remain in the small PCM cache.
 current='cache and replacement';await button('kin').click();await playing('Kin après minuit');await stop();assert.equal(await page.evaluate(()=>window.sessionPreviewQA.metrics.length),9);
 await button('lumiere').click();await playing('Lumière en ville');await button('kin').click();await playing('Kin après minuit');
 await page.waitForFunction(()=>window.sessionPreviewQA.sources.filter(s=>!s.ended).length===1);await stop();
 // Deterministically hold preparation, then cancel before the real renderer resumes.
 const hold=async()=>page.evaluate(()=>{window.sessionPreviewQA.hold=true;window.sessionPreviewQA.release=null;});
 const release=async()=>{const count=await page.evaluate(()=>{const q=window.sessionPreviewQA;q.hold=false;q.release();return q.attempts;});await page.waitForFunction(n=>window.sessionPreviewQA.completed>=n,count);};
 const prepare=async id=>{await hold();await button(id).click();await page.waitForFunction(()=>typeof window.sessionPreviewQA.release==='function');assert.equal(await panel.getAttribute('data-state'),'preparing');};
 current='cancel preparation';const sourceCount=await page.evaluate(()=>window.sessionPreviewQA.sources.length);
 await prepare('nocturne');await stop();await release();assert.equal(await page.evaluate(()=>window.sessionPreviewQA.sources.length),sourceCount);
 current='search cancellation';await prepare('soleil');await page.locator('#bankSearch').fill('Kin après');await release();assert.equal(await page.locator('[data-session-preview]').count(),1);assert.equal(await panel.getAttribute('data-state'),'idle');assert.equal(await page.evaluate(()=>window.sessionPreviewQA.sources.length),sourceCount);await page.locator('#bankSearch').fill('');
 current='leave library';await prepare('brume');await page.locator('[data-view="arrange"]').click();await release();assert.equal(await page.evaluate(()=>window.sessionPreviewQA.sources.length),sourceCount);await open();
 current='open confirmation';await prepare('rives');await page.locator('[data-session-load="soleil"]').click();await page.locator('#confirmTemplate').waitFor();await page.locator('#cancelTemplate').click();await release();assert.equal(await page.evaluate(()=>window.sessionPreviewQA.sources.length),sourceCount);
 current='visible error';await page.evaluate(()=>window.sessionPreviewQA.fail=true);await button('nocturne').click();await page.waitForFunction(()=>document.querySelector('.session-preview-panel').dataset.state==='error');assert.match(await page.locator('[data-session-preview-status]').textContent(),/Source QA indisponible/);await page.evaluate(()=>window.sessionPreviewQA.fail=false);
 current='themes and mobile';
 for(const theme of ['forest','graphite','slate','light']){
  await resizeStudio(page,{width:1440,height:960});await page.locator('.top-actions [data-studio-theme]').selectOption(theme);
  await button('kin').click();await playing('Kin après minuit');await resizeStudio(page,{width:390,height:844});
  assert.equal(await panel.getAttribute('data-state'),'playing','audition survives a viewport reflow');
  await assertCards();
  const rects=await page.locator('.session-preview-panel,.session-preview-panel button,.session-card [data-session-preview]').evaluateAll(nodes=>nodes.map(n=>{const r=n.getBoundingClientRect();return {x:r.x,right:r.right,width:r.width};}));
  assert.ok(rects.every(r=>r.width>0&&r.x>=0&&r.right<=391));await page.screenshot({path:folder+'/mobile-'+theme+'.png'});await stop();
 }
 await resizeStudio(page,{width:1440,height:960});await assertCards();await page.screenshot({path:folder+'/desktop.png'});
 current='project preservation';const after=await save();assert.deepEqual(after.project,before.project);assert.deepEqual(after.assets,before.assets);assert.equal(after.masterVolume,-18);assert.equal(await page.locator('#undo').isEnabled(),undoBefore);assert.equal(await page.locator('#positionDisplay').textContent(),cursorBefore);
 current='transport cancellation';await button('kin').click();await playing('Kin après minuit');await page.locator('#play').click();await page.waitForFunction(()=>document.querySelector('#play').getAttribute('aria-label')==='Pause');assert.equal(await panel.getAttribute('data-state'),'idle');await page.locator('#stop').click();
 // Simulate a pending permission request: no physical microphone is requested.
 current='pending microphone guard';await button('kin').click();await playing('Kin après minuit');
 await page.evaluate(()=>{const q=window.sessionPreviewQA;q.getUserMedia=navigator.mediaDevices.getUserMedia;navigator.mediaDevices.getUserMedia=()=>new Promise((_,reject)=>{q.rejectMic=reject;});});
 await page.locator('#record').click();await page.waitForFunction(()=>typeof window.sessionPreviewQA.rejectMic==='function');assert.equal(await panel.getAttribute('data-state'),'idle');
 const attempts=await page.evaluate(()=>window.sessionPreviewQA.attempts);await button('nocturne').click();assert.match(await page.locator('#toast').textContent(),/Termine la prise/);assert.equal(await page.evaluate(()=>window.sessionPreviewQA.attempts),attempts);
 await page.evaluate(()=>{const q=window.sessionPreviewQA;q.rejectMic(new DOMException('QA permission denied','NotAllowedError'));navigator.mediaDevices.getUserMedia=q.getUserMedia;});await page.waitForFunction(()=>!document.querySelector('#record').disabled);
 current='project change';await prepare('soleil');const portable=structuredClone(before);portable.project.name='Autre copie du projet';await upload(portable);await release();assert.equal(await page.evaluate(()=>window.sessionPreviewQA.sources.length),await page.evaluate(()=>window.sessionPreviewQA.sources.filter(s=>s.ended).length));
 const reopened=await save();assert.deepEqual(reopened.project.tracks,before.project.tracks);assert.deepEqual(reopened.assets,before.assets);
 await writeFile(folder+'/report.json',JSON.stringify(metrics,null,2)+'\n');assert.deepEqual(errors,[]);
 console.log('PASS: 9 real four-bar stereo auditions, cache, natural end, cancellation races, keyboard, transport/mic guards, 4 mobile themes, unchanged project/history/media and project switch');
}catch(error){console.error('Session preview failed at',current,errors);await page?.screenshot({path:folder+'/failure.png',fullPage:true}).catch(()=>{});throw error;}finally{await browser.close();}
