import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:1280,height:800}});
 const errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 await page.goto('http://127.0.0.1:8765/',{waitUntil:'load'});
 const details=await page.evaluate(async()=>{
   const {AudioEngine}=await import('./audio.js');
   const {createVocalDemoSession}=await import('./vocal-demo-sessions.js');
   const {createVocalDemoMedia}=await import('./vocal-guide-audio.js');
   const output=[];
   const context=new AudioContext();
   for(const kind of ['vox-trap','vox-afro','vox-rnb']){
     const project=createVocalDemoSession(kind);
     const sources=createVocalDemoMedia(project);
     const assets=new Map();
     for(const source of sources){
       const buffer=await context.decodeAudioData(source.data.slice(0));
       const data=buffer.getChannelData(0);
       let peak=0,energy=0;
       for(const x of data){peak=Math.max(peak,Math.abs(x));energy+=x*x;}
       assets.set(source.id,{...source,buffer});
       source.peak=peak;source.rms=Math.sqrt(energy/data.length);
     }
     project.tracks=project.tracks.filter(t=>t.type==='audio'&&t.name.startsWith('LEAD'));
     project.masterVolume=0;
     const renderer=new AudioEngine(()=>project,()=>assets);
     const rendered=await renderer.renderRange({sampleRate:44100,startBar:4,endBar:5,tail:false});
     const pcm=rendered.getChannelData(0);
     let peak=0,energy=0;
     for(const x of pcm){peak=Math.max(peak,Math.abs(x));energy+=x*x;}
     output.push({kind,clips:project.tracks.filter(t=>t.type==='audio').map(t=>t.clips.length),
       inputPeak:sources[0].peak,inputRms:sources[0].rms,renderPeak:peak,renderRms:Math.sqrt(energy/pcm.length),assets:assets.size});
   }
   await context.close();
   return output;
 });
 console.log('VOX AUDIBILITY:',JSON.stringify(details));
 for(const result of details){
   assert.ok(result.assets===3,result.kind+' has missing WAV assets');
   assert.ok(result.clips[0]>=3,result.kind+' has no lead vocal in both verses and chorus');
   assert.ok(result.inputRms>.01,result.kind+' synthetic vocal WAV is virtually inaudible');
   assert.ok(result.renderRms>.006,result.kind+' lead through WarLike FX is inaudible in the rendered verse');
 }
 assert.deepEqual(errors,[]);
 console.log('PASS: all three vocal genres have audible verse lead WAV through native WarLike mixer');
}finally{await browser.close();}
