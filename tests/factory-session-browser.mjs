import {resizeStudio} from './browser-viewport.mjs';
import assert from 'node:assert/strict';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {chromium} from 'playwright';
import {SESSION_TEMPLATES} from '../dist/content.js';
import {COMPOSITION_TEMPLATES} from '../dist/studio-compositions.js';

const dir='artifacts/factory-sessions';
await mkdir(dir,{recursive:true});
const songs=SESSION_TEMPLATES.map(({id,name})=>[id,name]);
const selection=process.env.FACTORY_SONG;
if(selection&&!songs.some(([kind])=>kind===selection))throw Error('Unknown FACTORY_SONG: '+selection);
const selected=songs.filter(([kind])=>!selection||kind===selection);
const stage=(kind,message)=>console.log('['+kind+'] '+message);
async function deadline(promise,ms,label){
 let timer;
 try{return await Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error(label+' exceeded '+ms/1000+' seconds')),ms);})]);}
 finally{clearTimeout(timer);}
}
const report=[];
const sessionTab=(page,tab)=>page.locator('[data-session-tab="'+tab+'"]').click();
async function save(page,path){
 await page.locator('#projectMenuBtn').click();
 const pending=page.waitForEvent('download');
 await page.locator('#saveProject').click();
 await (await pending).saveAs(path);
 return JSON.parse(await readFile(path,'utf8'));
}
// Compare musical content, not optional fields that import normalises.
const score=p=>({name:p.name,bpm:p.bpm,bars:p.bars,sections:p.sections,fullSong:p.fullSong,
 tracks:p.tracks.map(t=>({id:t.id,type:t.type,name:t.name,volume:t.volume,pan:t.pan,
 inserts:t.inserts,clips:t.clips.map(c=>({id:c.id,name:c.name,start:c.start,length:c.length,patternSteps:c.patternSteps,
 notes:c.notes?.map(n=>[n.id,n.step,n.midi,n.len,n.velocity,!!n.muted]),
 pattern:c.pattern?Object.fromEntries(Object.entries(c.pattern).filter(([,row])=>row.some(Boolean))):undefined}))}))});
for(const [kind,name] of selected){
 const newComposition=COMPOSITION_TEMPLATES.some(t=>t.id===kind),expectedMaster=0;
 stage(kind,'Launching isolated Chromium');
 const browser=await chromium.launch({headless:true});
 try{
  const context=await browser.newContext({viewport:{width:1440,height:960},acceptDownloads:true});
  try{
   const page=await context.newPage(),errors=[];
   page.setDefaultTimeout(30000);
   page.on('pageerror',e=>{errors.push(e.message);console.error('['+kind+'] pageerror:',e.message);});
   page.on('crash',()=>console.error('['+kind+'] renderer crashed'));
   await page.goto('http://127.0.0.1:8765/',{waitUntil:'load'});
   await sessionTab(page,'create');
   await page.locator('#libraryNew').click();
   await page.locator('#modal').waitFor({state:'hidden'});
   await page.locator('#projectMenuBtn').click();
   await page.locator('#factorySessions').click();
   await page.locator('[data-session-load="'+kind+'"]').click();
   if(newComposition){
    const expected=COMPOSITION_TEMPLATES.find(t=>t.id===kind).bars;assert.match(await page.locator('#modalBody').textContent(),new RegExp(expected+' mesures'));
   }
   await page.locator('#confirmTemplate').click();
   await page.locator('#modal').waitFor({state:'hidden'});
   assert.equal(await page.locator('#projectName').inputValue(),name);
   await page.waitForFunction(()=>document.getElementById('saveStatus').textContent==='Enregistré sur cet appareil');
   stage(kind,'Local save complete; downloading project');
   const before=await save(page,dir+'/'+kind+'.chayah');
   assert.equal(before.project.fullSong,true);
   assert.equal(before.masterVolume,expectedMaster);
   assert.equal(before.project.tracks.length,9);
   const seconds=before.project.bars*240/before.project.bpm;
   assert.ok(seconds>=180&&seconds<=300);
   // Cold reload must reopen the same local session, not a default/short demo.
   stage(kind,'Cold reload and score comparison');
   await page.reload({waitUntil:'load'});
   await sessionTab(page,'open');
   await page.locator('[data-project-open]').first().click();
   await page.locator('#modal').waitFor({state:'hidden'});
   const reopened=await save(page,dir+'/'+kind+'-reopened.chayah');
   assert.deepEqual(score(reopened.project),score(before.project));
   assert.equal(reopened.masterVolume,before.masterVolume);
   // Legacy R05.2f UUIDs with hyphens were rejected by the former validator.
   stage(kind,'Legacy portable project import');
   const portable=structuredClone(before);
   portable.project.tracks[0].clips[0].id='12345678-1234-4abc-8def-123456789abc';
   const legacy=dir+'/'+kind+'-legacy.chayah';
   await writeFile(legacy,JSON.stringify(portable));
   await page.locator('#projectInput').setInputFiles(legacy);
   await page.waitForFunction(()=>document.getElementById('toast').textContent.includes('Projet importé et sauvegardé.'));
   const imported=await save(page,dir+'/'+kind+'-imported.chayah');
   assert.deepEqual(score(imported.project),score(portable.project));
   assert.equal(imported.masterVolume,expectedMaster);
   stage(kind,'Live transport');
   await page.locator('#modeSong').click();
   await page.locator('#play').click();
   await page.waitForFunction(()=>document.getElementById('play').getAttribute('aria-label')==='Pause',null,{timeout:90000});
   const initial=await page.locator('#secondsDisplay').textContent();
   await page.waitForFunction(s=>document.getElementById('secondsDisplay').textContent!==s,initial);
   await page.locator('#stop').click();
   await page.screenshot({path:dir+'/'+kind+'.png'});
   if(newComposition){
    await page.locator('[data-view="library"]').click();await page.locator('[data-bank-tab="sessions"]').click();
    assert.equal(await page.locator('[data-session-load]').count(),SESSION_TEMPLATES.length);
    const card=page.locator('.session-card').filter({has:page.locator('[data-session-load="'+kind+'"]')});
    for(const size of [{width:390,height:844},{width:1440,height:960},{width:390,height:844}]){
     await resizeStudio(page,size);await card.waitFor({state:'visible'});await card.scrollIntoViewIfNeeded();
     assert.ok(await card.evaluate(n=>{const r=n.getBoundingClientRect();return n.isConnected&&r.width>0&&r.left>=0&&r.right<=innerWidth+1;}),kind+' session card exceeds viewport after reflow');
    }
    await card.screenshot({path:dir+'/'+kind+'-mobile-card.png'});
   }
   // Render the complete reopened musical score using the production WAV exporter.
   stage(kind,'Full stereo WAV export and decode');
   // Close the live audio/UI page before rendering: its audio graph, sample cache
   // and DOM must not compete with the offline context for memory or CPU.
   const renderPage=await context.newPage();
   await renderPage.goto('http://127.0.0.1:8765/_factory-audio-qa.html',{waitUntil:'load'});
   await page.close();
   const metrics=await deadline(renderPage.evaluate(async p=>{
    const {AudioEngine}=await import('/audio.js');
    const {measureFactorySectionAudio}=await import('/factory-musicality-qa.js');
    const {auditContinuousPCM}=await import('/audio-certification.js');
    const engine=new AudioEngine(()=>p,()=>new Map());
    const start=performance.now();
    let renderMs=0;const render=engine.renderRange.bind(engine);
    engine.renderRange=async options=>{const pcm=await render(options);renderMs=performance.now()-start;return pcm;};
    const wav=await engine.exportWav({sampleRate:44100,bits:24,tail:false});
    const encodeMs=performance.now()-start-renderMs;
    if(p.fullSong&&[6,7].includes(p.demoRevision)){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([wav],{type:'audio/wav'}));a.download='composition.wav';a.dataset.compositionWav='';a.textContent='WAV complet';document.body.append(a);}
    const header=new DataView(wav),decoder=new AudioContext({sampleRate:44100});
    try{
     const b=await decoder.decodeAudioData(wav.slice(0));
     let peak=0,energy=0;
     const sections=p.sections.map(s=>({name:s.name,start:Math.round(s.start*240/p.bpm*b.sampleRate),end:Math.round((s.start+s.length)*240/p.bpm*b.sampleRate),energy:0}));
     for(let ch=0;ch<b.numberOfChannels;ch++){
      const data=b.getChannelData(ch);
      for(let i=0;i<data.length;i++){const x=data[i];if(!Number.isFinite(x))throw Error('Nonfinite PCM');peak=Math.max(peak,Math.abs(x));energy+=x*x;}
      for(const s of sections)for(let i=s.start;i<Math.min(data.length,s.end);i++)s.energy+=data[i]*data[i];
     }
     const musicality=measureFactorySectionAudio(b,p);
     const pcmDiagnostics=auditContinuousPCM(b,{maxCandidates:8});
     return {renderMs,encodeMs,sampleRate:b.sampleRate,channels:b.numberOfChannels,frames:b.length,bits:header.getUint16(34,true),peak,rms:Math.sqrt(energy/(b.length*b.numberOfChannels)),sections:sections.map(s=>({name:s.name,rms:Math.sqrt(s.energy/((s.end-s.start)*b.numberOfChannels))})),musicality,pcmDiagnostics};
    }finally{await decoder.close();}
   },imported.project),540000,kind+' full WAV render');
   if(newComposition){const pending=renderPage.waitForEvent('download');await renderPage.locator('[data-composition-wav]').click();await(await pending).saveAs(dir+'/'+kind+'-full.wav');}
   stage(kind,'WAV decoded; checking metrics');
   report.push({kind,seconds,...metrics});
   await writeFile(dir+'/report.json',JSON.stringify(report,null,2)+'\n');
   assert.equal(metrics.pcmDiagnostics.invalid,0,kind+' invalid PCM');
   assert.equal(metrics.pcmDiagnostics.overRange,0,kind+' over-range PCM');
   assert.equal(metrics.pcmDiagnostics.channels.length,2);
   assert.equal(metrics.channels,2);assert.equal(metrics.bits,24);assert.equal(metrics.sampleRate,44100);
   assert.equal(metrics.musicality.passed,true,kind+' PCM failures: '+metrics.musicality.problems.join(', '));
   assert.equal(metrics.musicality.sections.length,before.project.sections.length,kind+' missing section measurements');
   assert.ok(Math.abs(metrics.frames/44100-seconds)<.03,'incorrect WAV duration');
   assert.ok(metrics.peak>.02&&metrics.peak<.999,'silent or clipped WAV');
   assert.ok(metrics.rms>.002,'silent mix');
   if(newComposition){
    assert.ok(metrics.rms>.02&&metrics.rms<.35,'composition mix level is too low or excessive');
    assert.ok(metrics.peak>.2&&metrics.peak<.95,'composition peak headroom outside target');
    for(const section of metrics.sections)assert.ok(section.rms>.005,'composition section too quiet: '+section.name);
   }
   for(const section of metrics.sections)assert.ok(section.rms>.0005,kind+' silent '+section.name);
   assert.deepEqual(errors,[]);
  }finally{await deadline(context.close(),15000,kind+' context cleanup');}
 }finally{await deadline(browser.close(),15000,kind+' browser cleanup');}
 stage(kind,'PASS');
}
console.log('PASS: full factory arrangements, local reopen, legacy portable import, live transport and full stereo WAV',JSON.stringify(report));
