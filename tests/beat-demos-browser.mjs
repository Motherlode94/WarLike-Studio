import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true});
const directory='artifacts/beat-demos';await mkdir(directory,{recursive:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:960}}),errors=[],externalKits=[];
 page.on('request',r=>{if(r.url().includes('oramics.github.io'))externalKits.push(r.url());});
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8765/',{waitUntil:'load'});
 await page.locator('#libraryNew').waitFor({state:'visible'});
 const demoButtons=page.locator('.project-public-demos [data-public-demo]');
 assert.equal(await demoButtons.count(),10,'six previous demos and four current directions are accessible');
 await page.setViewportSize({width:390,height:844});
 for(const button of await demoButtons.all()){
  const box=await button.boundingBox();assert.ok(box&&box.x>=0&&box.x+box.width<=391,'demo button exceeds mobile viewport');
 }
 await page.screenshot({path:directory+'/library-mobile.png',fullPage:true});
 await page.setViewportSize({width:1440,height:960});
 const renders=await page.evaluate(async()=>{
  const {AudioEngine}=await import('./audio.js');
  const {createBeatDemoSession}=await import('./beat-demo-sessions.js');
  const {encodeWav}=await import('./wav.js');
  const decoder=new AudioContext(),results=[];
  function stats(buffer){
   let peak=0,energy=0;for(let ch=0;ch<buffer.numberOfChannels;ch++)for(const v of buffer.getChannelData(ch)){
    if(!Number.isFinite(v))throw Error('Nonfinite audio');peak=Math.max(peak,Math.abs(v));energy+=v*v;
   }
   return {peak,rms:Math.sqrt(energy/(buffer.length*buffer.numberOfChannels))};
  }
  for(const kind of ['drill','trap808','trap-air','funk']){
   const p=createBeatDemoSession(kind),renderer=new AudioEngine(()=>p,()=>new Map());
   const buffer=await renderer.renderRange({sampleRate:44100,tail:false});
   const sections=p.sections.map(section=>{
    const pcm=buffer.getChannelData(0),start=Math.round(section.start*240/p.bpm*44100),end=Math.round((section.start+section.length)*240/p.bpm*44100);
    let energy=0;for(let i=start;i<end;i++)energy+=pcm[i]**2;
    return {name:section.name,rms:Math.sqrt(energy/(end-start))};
   });
   // Exercise the real WAV encoder and browser decoder for the complete score.
   const wav=encodeWav(buffer,{bits:24}),header=new DataView(wav);
   const decoded=await decoder.decodeAudioData(wav.slice(0));
   let sub=null;
   {
    const stem=structuredClone(p);stem.tracks=stem.tracks.filter(t=>t.type==='bass');stem.tracks[0].volume=0;stem.masterVolume=0;
    const dry=await renderer.renderRange({project:stem,startBar:12,endBar:16,sampleRate:44100,tail:false,clean:true});
    const pcm=dry.getChannelData(0),alpha=1-Math.exp(-2*Math.PI*90/44100);let low=0,energy=0;
    for(const v of pcm){low+=alpha*(v-low);energy+=low*low;}
    sub={...stats(dry),lowRms:Math.sqrt(energy/pcm.length)};
   }
   let percussion=null;
   if(kind==='funk'){percussion={};for(const voice of ['kick','tom','rim','clap','perc','hat','open','shaker']){const raw=await renderer.renderDrumWav(voice,p.tracks[0].instrument);percussion[voice]=stats(await decoder.decodeAudioData(raw));}}
   results.push({kind,percussion,...stats(buffer),sections,wav:{bytes:wav.byteLength,bits:header.getUint16(34,true),sampleRate:decoded.sampleRate,frames:decoded.length,rms:stats(decoded).rms},sub});
  }
  // Measure a real dry slide: late fundamental must be an octave above the
  // opening fundamental, with the harmonic oscillator following the same bend.
  const slideContext=new OfflineAudioContext(2,44100*2,44100);
  const slideEngine=new AudioEngine(()=>({tracks:[],masterVolume:0}),()=>new Map());
  slideEngine.synth(slideContext,slideContext.destination,'bass',33,.01,1.5,false,{body:.8,harmonics:0,release:.2},.8,null,{slide:12});
  const slideBuffer=await slideContext.startRendering(),data=slideBuffer.getChannelData(0);
  const frequency=(a,b)=>{const crossings=[];for(let i=Math.ceil(a*44100);i<b*44100;i++)if(data[i-1]<0&&data[i]>=0)crossings.push(i-1-data[i-1]/(data[i]-data[i-1]));return 44100*(crossings.length-1)/(crossings.at(-1)-crossings[0]);};
  results[0].slide={earlyHz:frequency(.2,.6),lateHz:frequency(1.44,1.55)};
  await decoder.close();return results;
 });
 await writeFile(directory+'/audio-report.json',JSON.stringify(renders,null,2)+'\n');
 assert.ok(Math.abs(renders[0].slide.earlyHz-55)<.2);
 assert.ok(Math.abs(renders[0].slide.lateHz-110)<1,'808 pitch ramp is missing from the actual audio');
 for(const r of renders){
  assert.ok(r.peak>.03&&r.peak<.9,r.kind+' missing signal or clipping: '+r.peak);
  assert.ok(r.rms>.006,r.kind+' mix virtually inaudible');
  assert.ok(r.sections.every(s=>s.rms>.003),r.kind+' has a silent section');
  assert.equal(r.wav.bits,24);assert.equal(r.wav.sampleRate,44100);assert.ok(Math.abs(r.wav.rms-r.rms)<.00001);
  if(r.percussion)for(const [voice,s] of Object.entries(r.percussion))assert.ok(s.rms>.0003&&s.peak<1,'silent/clipped baile voice '+voice);
  if(r.sub){assert.ok(r.sub.rms>.04,r.kind+' silent 808');assert.ok(r.sub.lowRms/r.sub.rms>.55,r.kind+' lacks sub energy');}
 }
 // Actual project launch, transport, portable download/import and cold reload.
 for(const [kind,bpm,name] of [['drill',142,'WARLIKE · Drill nocturne'],['trap808',140,'WARLIKE · Atlanta After Dark'],['trap-air',146,'WARLIKE · Atlanta Floating'],['funk',130,'WARLIKE · Baile Tamborzão']]){
  await page.locator('.project-public-demos [data-public-demo="'+kind+'"]').click();
  await page.locator('#modal').waitFor({state:'hidden'});
  assert.equal(await page.locator('#projectName').inputValue(),name);assert.equal(await page.locator('#bpm').inputValue(),String(bpm));
  await page.locator('#play').click();await page.waitForFunction(()=>document.getElementById('play').getAttribute('aria-label')==='Pause');
  assert.doesNotMatch(await page.locator('#toast').textContent(),/undefined/,'sample loading status needs a real instrument name');
  await page.locator('#stop').click();
  await page.screenshot({path:directory+'/'+kind+'.png',fullPage:true});
  await page.locator('#projectMenuBtn').click();
  const downloadPromise=page.waitForEvent('download');await page.locator('#saveProject').click();
  const download=await downloadPromise,path=directory+'/'+kind+'.chayah';await download.saveAs(path);
  const saved=JSON.parse(await readFile(path,'utf8'));
  assert.equal(saved.project.demoGenre,kind);assert.equal(saved.project.tracks.length,kind==='funk'?7:9);assert.equal(saved.masterVolume,-9);
  assert.ok(saved.project.tracks.some(t=>t.type==='bass'&&t.clips.length===4));
  assert.equal(saved.project.demoRevision,3);
  if(kind==='drill')assert.ok(saved.project.tracks[1].clips[1].notes.some(n=>n.slide===12));
  if(kind==='drill')assert.equal(saved.project.tracks[5].clips[1].start,4+1/32);
  if(kind==='trap808'||kind==='trap-air'){assert.ok(Math.abs(saved.project.tracks[5].clips[0].start-1/48)<1e-9);assert.ok(Math.abs(saved.project.tracks[5].clips[1].start-1/24)<1e-9);}
  await page.locator('#projectInput').setInputFiles(path);
  await page.waitForFunction(()=>document.getElementById('toast')?.textContent.includes('Projet importé et sauvegardé.'));
  await page.reload({waitUntil:'load'});await page.locator('[data-project-open]').first().waitFor({state:'visible'});
  assert.ok((await page.locator('[data-project-open]').count())>=2);
  await page.locator('[data-project-open]').first().click();await page.locator('#modal').waitFor({state:'hidden'});
  assert.equal(await page.locator('#projectName').inputValue(),name);assert.equal(await page.locator('#bpm').inputValue(),String(bpm));
  await page.locator('#projectMenuBtn').click();await page.locator('#myProjects').click();await page.locator('#libraryNew').waitFor({state:'visible'});
 }
 assert.deepEqual(errors,[]);assert.deepEqual(externalKits,[],'baile kit must work without acoustic sample downloads');
 console.log('PASS: piano-preserving drill, two Atlanta directions and baile funk complete audio, 808 sub energy, 24-bit WAV, mobile library, transport and project round-trip',JSON.stringify(renders));
}finally{await browser.close();}
