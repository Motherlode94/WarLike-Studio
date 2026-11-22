import assert from 'node:assert/strict';import {mkdir,writeFile} from 'node:fs/promises';import {chromium} from 'playwright';
await mkdir('artifacts/instrument-polyphony',{recursive:true});
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage();await page.goto('http://127.0.0.1:8765/');
 const reports=await page.evaluate(async()=>{
  const {EXPANSION_INSTRUMENTS}=await import('/wl-expansion.js'),{FACTORY_PRESETS}=await import('/bundle.js'),{AudioEngine}=await import('/audio.js'),{measureInstrumentRender,expansionStressScore}=await import('/instrument-render-metrics.js'),{encodeWavBlob}=await import('/wav-export.js');
  const engine=new AudioEngine(()=>({tracks:[],masterVolume:0}),()=>new Map()),results=[];
  for(const rate of [44100,48000])for(const [id,def] of Object.entries(EXPANSION_INSTRUMENTS)){
   const patch=FACTORY_PRESETS[id][0],ctx=new OfflineAudioContext(2,rate*7,rate),bus=ctx.createGain();bus.gain.value=10**(-24/20);bus.connect(ctx.destination);
   for(const n of expansionStressScore(def.phrase))engine.synth(ctx,bus,id,n.midi,n.time,n.length,false,patch.values,n.velocity);
   const start=performance.now(),render=await ctx.startRendering(),renderMs=performance.now()-start,metrics=measureInstrumentRender(render);
   const wav=await (await encodeWavBlob(render,{bits:24})).arrayBuffer(),v=new DataView(wav);
   let maxError=0;for(let c=0;c<2;c++){const samples=render.getChannelData(c);for(let i=0;i<samples.length;i+=17){const o=44+(i*2+c)*3;let pcm=v.getUint8(o)|(v.getUint8(o+1)<<8)|(v.getUint8(o+2)<<16);if(pcm&0x800000)pcm-=0x1000000;maxError=Math.max(maxError,Math.abs(pcm/8388608-samples[i]));}}
   results.push({id,preset:patch.name,notes:32,renderMs,...metrics,wav:{riff:v.getUint32(0,false)===0x52494646,format:v.getUint16(20,true),bits:v.getUint16(34,true),rate:v.getUint32(24,true),channels:v.getUint16(22,true),bytes:wav.byteLength,dataBytes:v.getUint32(40,true),maxError}});
  }return results;
 });
 await writeFile('artifacts/instrument-polyphony/report.json',JSON.stringify(reports,null,2));assert.equal(reports.length,20);
 for(const r of reports){assert.ok(r.finite&&r.peak>1e-5&&r.clipped===0&&r.rms>1e-6,JSON.stringify(r));assert.ok(r.dc.every(x=>Math.abs(x)<.02),JSON.stringify(r));assert.ok(r.tailRms<.001,JSON.stringify(r));assert.ok(r.wav.riff&&r.wav.format===1&&r.wav.bits===24&&r.wav.rate===r.sampleRate&&r.wav.channels===2&&r.wav.dataBytes===r.frames*6&&r.wav.bytes===44+r.frames*6&&r.wav.maxError<2e-6,JSON.stringify(r));}
 const expression=await page.evaluate(async()=>{
 const {AudioEngine}=await import('/audio.js'),{FACTORY_PRESETS}=await import('/bundle.js'),{EXPANSION_INSTRUMENTS}=await import('/wl-expansion.js');
 const engine=new AudioEngine(()=>({tracks:[],masterVolume:0}),()=>new Map()),results=[];
 for(const [id,definition] of Object.entries(EXPANSION_INSTRUMENTS)){
  async function render(note){const ctx=new OfflineAudioContext(2,48000*3,48000);engine.synth(ctx,ctx.destination,id,definition.phrase==='bass'?36:60,.05,1,false,FACTORY_PRESETS[id][0].values,.6,null,note);return (await ctx.startRendering()).getChannelData(0);}
  const a=await render({}),b=await render({bend:7,vibrato:35,articulation:'staccato'});let difference=0,finite=true,peak=0;
  for(let i=0;i<a.length;i++){finite&&=Number.isFinite(b[i]);difference+=(a[i]-b[i])**2;peak=Math.max(peak,Math.abs(b[i]));}
  results.push({id,finite,peak,difference:Math.sqrt(difference/a.length)});
 }return results;
 });
 await writeFile('artifacts/instrument-polyphony/expression.json',JSON.stringify(expression,null,2));assert.equal(expression.length,10);for(const r of expression)assert.ok(r.finite&&r.peak>1e-5&&r.difference>1e-6,JSON.stringify(r));
 console.log('PASS: 20 polyphonic renders and 24-bit PCM checks');
}finally{await browser.close();}
