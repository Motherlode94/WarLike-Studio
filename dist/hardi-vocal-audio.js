import {createCompressor,createDeesser} from './compressor-audio.js';
import {dynamicsLatency} from './dynamics-timing.js';
import {HARDI_VOCAL_EFFECTS} from './hardi-vocal.js';
const db=x=>10**(x/20);
export function createHardiVocalEffects(ctx,scope,types=null){
 const node=(kind,...args)=>scope.node(kind,...args),modules={};
 for(const id of Object.keys(HARDI_VOCAL_EFFECTS)){
  if(types&&!types.includes(id))continue;
  const m=modules[id]={input:node('createGain'),output:node('createGain')};
  m.dry=node('createGain');m.wet=node('createGain');
  if(['hardivocalcomp','hardideess'].includes(id)){m.dryDelay=node('createDelay',.1);m.dryDelay.delayTime.value=dynamicsLatency(ctx.sampleRate);m.input.connect(m.dryDelay);m.dryDelay.connect(m.dry);}else m.input.connect(m.dry);m.dry.connect(m.output);m.wet.connect(m.output);
  if(id==='hardivoice'){
   m.hp=node('createBiquadFilter');m.hp.type='highpass';
   m.body=node('createBiquadFilter');m.body.type='peaking';m.body.frequency.value=280;m.body.Q.value=.7;
   m.presence=node('createBiquadFilter');m.presence.type='peaking';m.presence.frequency.value=3200;m.presence.Q.value=.9;
   m.air=node('createBiquadFilter');m.air.type='highshelf';m.air.frequency.value=9200;
   m.input.connect(m.hp);m.hp.connect(m.body);m.body.connect(m.presence);m.presence.connect(m.air);m.air.connect(m.wet);
  }else if(id==='hardivocalcomp'){
   m.comp=createCompressor(ctx,scope);m.outputGain=node('createGain');
   m.bindings={threshold:[m.comp.threshold],ratio:[m.comp.ratio],attack:[[m.comp.attack,x=>x/1000]],release:[[m.comp.release,x=>x/1000]],mix:[[m.dry.gain,x=>1-x],m.wet.gain],output:[[m.outputGain.gain,db,true]]};
   m.input.connect(m.comp);m.comp.connect(m.outputGain);m.outputGain.connect(m.wet);
  }else if(id==='hardideess'){
   m.comp=createDeesser(ctx,scope);m.input.connect(m.comp);m.comp.connect(m.wet);
   m.bindings={frequency:[m.comp.frequency],threshold:[m.comp.threshold],ratio:[m.comp.ratio],mix:[[m.dry.gain,x=>1-x],m.wet.gain]};
  }else if(id==='hardidoubler'){
   m.voices=[];
   const wetSum=node('createGain');wetSum.gain.value=.5;wetSum.connect(m.wet);
   for(const sign of [-1,1]){
    const delay=node('createDelay',.12),tone=node('createBiquadFilter'),pan=node('createStereoPanner');
    tone.type='lowpass';m.input.connect(delay);delay.connect(tone);tone.connect(pan);pan.connect(wetSum);
    // Detune: a slow LFO moves each delay in opposite directions (0 = static, original sound).
    const lfo=node('createOscillator'),depth=node('createGain');lfo.frequency.value=sign>0?.43:.37;depth.gain.value=0;lfo.connect(depth);depth.connect(delay.delayTime);lfo.start(0);scope.oscillators?.push(lfo);
    m.voices.push({delay,tone,pan,sign,lfo,depth});
   }
  }
  if(id==='hardivoice')m.bindings={highpass:[m.hp.frequency],body:[m.body.gain],presence:[m.presence.gain],air:[m.air.gain],mix:[[m.dry.gain,x=>1-x],m.wet.gain]};
  if(id==='hardidoubler')m.bindings={delay:m.voices.map(v=>[v.delay.delayTime,x=>(x+v.sign*2)/1000]),width:m.voices.map(v=>[v.pan.pan,x=>x*v.sign]),tone:m.voices.map(v=>v.tone.frequency),mix:[[m.dry.gain,x=>1-x],m.wet.gain]};

 }
 return modules;
}
export function syncHardiVocalEffect(id,m,s,now=0,initial=false){
 const set=(param,v)=>initial?param.setValueAtTime(v,now):param.setTargetAtTime(v,now,.02);
 const mix=s.enabled===false?0:s.mix;
 set(m.dry.gain,1-mix);set(m.wet.gain,mix);
 if(id==='hardivoice'){
  set(m.hp.frequency,s.highpass);set(m.body.gain,s.body);
  set(m.presence.gain,s.presence);set(m.air.gain,s.air);
 }
 if(id==='hardivocalcomp'){
  set(m.comp.threshold,s.threshold);set(m.comp.ratio,s.ratio);
  set(m.comp.attack,s.attack/1000);set(m.comp.release,s.release/1000);
  set(m.comp.knee,6);set(m.outputGain.gain,db(s.output));
 }
 if(id==='hardideess'){
  const nyq=m.input.context.sampleRate*.45,f=Math.min(s.frequency,nyq);
  set(m.comp.frequency,f);
  set(m.comp.threshold,s.threshold);set(m.comp.ratio,s.ratio);
  set(m.comp.attack,.001);set(m.comp.release,.075);set(m.comp.knee,2);
 }
 if(id==='hardidoubler')for(const v of m.voices){
  set(v.delay.delayTime,(s.delay+v.sign*2)/1000);
  set(v.tone.frequency,Math.min(s.tone,m.input.context.sampleRate*.45));
  set(v.pan.pan,v.sign*s.width);
  set(v.depth.gain,s.enabled===false?0:(s.detune??0)*.0025*v.sign);
 }
}
