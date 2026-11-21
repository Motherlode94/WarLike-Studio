import assert from 'node:assert/strict';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {chromium} from 'playwright';

const dir='artifacts/factory-sessions';
await mkdir(dir,{recursive:true});
const browser=await chromium.launch({headless:true});
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
try{
 for(const [kind,name] of [['nocturne','Nocturne Trap'],['soleil','Soleil Afro'],['brume','Brume R&B']]){
  const context=await browser.newContext({viewport:{width:1440,height:960},acceptDownloads:true});
  try{
   const page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.goto('http://127.0.0.1:8765/',{waitUntil:'load'});
   await sessionTab(page,'create');
   await page.locator('#libraryNew').click();
   await page.locator('#modal').waitFor({state:'hidden'});
   await page.locator('#projectMenuBtn').click();
   await page.locator('#factorySessions').click();
   await page.locator('[data-session-load="'+kind+'"]').click();
   await page.locator('#confirmTemplate').click();
   await page.locator('#modal').waitFor({state:'hidden'});
   assert.equal(await page.locator('#projectName').inputValue(),name);
   await page.waitForFunction(()=>document.getElementById('saveStatus').textContent==='Enregistré sur cet appareil');
   const before=await save(page,dir+'/'+kind+'.chayah');
   assert.equal(before.project.fullSong,true);
   assert.equal(before.masterVolume,-9);
   assert.equal(before.project.tracks.length,9);
   const seconds=before.project.bars*240/before.project.bpm;
   assert.ok(seconds>=180&&seconds<=300);
   // Cold reload must reopen the same local session, not a default/short demo.
   await page.reload({waitUntil:'load'});
   await sessionTab(page,'open');
   await page.locator('[data-project-open]').first().click();
   await page.locator('#modal').waitFor({state:'hidden'});
   const reopened=await save(page,dir+'/'+kind+'-reopened.chayah');
   assert.deepEqual(score(reopened.project),score(before.project));
   assert.equal(reopened.masterVolume,before.masterVolume);
   // Legacy R05.2f UUIDs with hyphens were rejected by the former validator.
   const portable=structuredClone(before);
   portable.project.tracks[0].clips[0].id='12345678-1234-4abc-8def-123456789abc';
   const legacy=dir+'/'+kind+'-legacy.chayah';
   await writeFile(legacy,JSON.stringify(portable));
   await page.locator('#projectInput').setInputFiles(legacy);
   await page.waitForFunction(()=>document.getElementById('toast').textContent.includes('Projet importé et sauvegardé.'));
   const imported=await save(page,dir+'/'+kind+'-imported.chayah');
   assert.deepEqual(score(imported.project),score(portable.project));
   assert.equal(imported.masterVolume,-9);
   await page.locator('#modeSong').click();
   await page.locator('#play').click();
   await page.waitForFunction(()=>document.getElementById('play').getAttribute('aria-label')==='Pause',null,{timeout:90000});
   const initial=await page.locator('#secondsDisplay').textContent();
   await page.waitForFunction(s=>document.getElementById('secondsDisplay').textContent!==s,initial);
   await page.locator('#stop').click();
   await page.screenshot({path:dir+'/'+kind+'.png'});
   // Render the complete reopened musical score using the production WAV exporter.
   const metrics=await page.evaluate(async p=>{
    const {AudioEngine}=await import('/audio.js');
    const engine=new AudioEngine(()=>p,()=>new Map());
    const wav=await engine.exportWav({sampleRate:44100,bits:24,tail:false});
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
     return {sampleRate:b.sampleRate,channels:b.numberOfChannels,frames:b.length,bits:header.getUint16(34,true),peak,rms:Math.sqrt(energy/(b.length*b.numberOfChannels)),sections:sections.map(s=>({name:s.name,rms:Math.sqrt(s.energy/((s.end-s.start)*b.numberOfChannels))}))};
    }finally{await decoder.close();}
   },imported.project);
   report.push({kind,seconds,...metrics});
   await writeFile(dir+'/report.json',JSON.stringify(report,null,2)+'\n');
   assert.equal(metrics.channels,2);assert.equal(metrics.bits,24);assert.equal(metrics.sampleRate,44100);
   assert.ok(Math.abs(metrics.frames/44100-seconds)<.03,'incorrect WAV duration');
   assert.ok(metrics.peak>.02&&metrics.peak<.999,'silent or clipped WAV');
   assert.ok(metrics.rms>.002,'silent mix');
   for(const section of metrics.sections)assert.ok(section.rms>.0005,kind+' silent '+section.name);
   assert.deepEqual(errors,[]);
  }finally{await context.close();}
 }
 console.log('PASS: full factory arrangements, local reopen, legacy portable import, live transport and full stereo WAV',JSON.stringify(report));
}finally{await browser.close();}
