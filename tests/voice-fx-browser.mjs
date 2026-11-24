import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8765/');await page.locator('html[data-app-ready=true]').waitFor();
 const probe=await page.evaluate(async()=>{
  const {prepareStudioContext,createStudioEffects,syncStudioEffect}=await import('./studio-pack-audio.js');
  const {EFFECTS}=await import('./plugins.js');
  const render=async(id,values)=>{
   const ctx=new OfflineAudioContext(2,22050,44100);
   await prepareStudioContext(ctx);
   const nodes=[],oscillators=[],scope={
    nodes,oscillators,node(kind,...args){const n=ctx[kind](...args);nodes.push(n);return n;}
   };
   const effect=createStudioEffects(ctx,scope,[id])[id];
   const state={...Object.fromEntries(EFFECTS[id].controls.map(c=>[c.key,c.default])),...values,enabled:true};
   syncStudioEffect(ctx,id,effect,state,140,0,true,2);
   const osc=ctx.createOscillator();osc.type='sawtooth';osc.frequency.value=220;
   const input=ctx.createGain();input.gain.value=.14;osc.connect(input);input.connect(effect.input);effect.output.connect(ctx.destination);
   osc.start(0);osc.stop(.45);
   const pcm=await ctx.startRendering(),samples=pcm.getChannelData(0);
   let peak=0,rms=0,invalid=0;
   for(const x of samples){if(!Number.isFinite(x))invalid++;peak=Math.max(peak,Math.abs(x));rms+=x*x;}
   return {peak,rms:Math.sqrt(rms/samples.length),invalid,head:Array.from(samples.slice(4000,4032))};
  };
  const dry=await render('voxshift',{semitones:0,mix:1});
  const baby=await render('voxshift',{semitones:7,mix:1});
  const formant=await render('voxformant',{shift:4,brightness:3,mix:.8});
  return {dry,baby,formant};
 });
 assert.equal(probe.dry.invalid,0);assert.equal(probe.baby.invalid,0);assert.equal(probe.formant.invalid,0);
 assert(probe.dry.peak>.01&&probe.baby.peak>.01&&probe.formant.peak>.01,'silent plugin signal');
 assert(probe.baby.peak<1&&probe.formant.peak<1,'plugin clipping');
 assert.notDeepEqual(probe.dry.head,probe.baby.head,'pitch effect must change PCM');
 assert.deepEqual(errors,[]);
 console.log('PASS: original pitch-shifter and resonance-color plugin render finite, non-silent stereo PCM offline',JSON.stringify({dry:probe.dry.rms,baby:probe.baby.rms,formant:probe.formant.rms}));
}finally{await browser.close();}
