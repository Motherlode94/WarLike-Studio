import {HARDI_VOCAL_EFFECTS} from './hardi-vocal.js';
const db=x=>10**(x/20);
export function createHardiVocalEffects(ctx,scope,types=null){
 const node=(kind,...args)=>scope.node(kind,...args),modules={};
 for(const id of Object.keys(HARDI_VOCAL_EFFECTS)){
  if(types&&!types.includes(id))continue;
  const m=modules[id]={input:node('createGain'),output:node('createGain')};
  m.dry=node('createGain');m.wet=node('createGain');
  m.input.connect(m.dry);m.dry.connect(m.output);m.wet.connect(m.output);
  if(id==='hardivoice'){
   m.hp=node('createBiquadFilter');m.hp.type='highpass';
   m.body=node('createBiquadFilter');m.body.type='peaking';m.body.frequency.value=280;m.body.Q.value=.7;
   m.presence=node('createBiquadFilter');m.presence.type='peaking';m.presence.frequency.value=3200;m.presence.Q.value=.9;
   m.air=node('createBiquadFilter');m.air.type='highshelf';m.air.frequency.value=9200;
   m.input.connect(m.hp);m.hp.connect(m.body);m.body.connect(m.presence);m.presence.connect(m.air);m.air.connect(m.wet);
  }else if(id==='hardivocalcomp'){
   m.comp=node('createDynamicsCompressor');m.outputGain=node('createGain');
   m.input.connect(m.comp);m.comp.connect(m.outputGain);m.outputGain.connect(m.wet);
  }else if(id==='hardideess'){
   // Complementary first-order low/high splits; compress only upper band.
   m.low=node('createBiquadFilter');m.high=node('createBiquadFilter');m.low.type='lowpass';m.high.type='highpass';
   m.low.Q.value=m.high.Q.value=.5;
   m.comp=node('createDynamicsCompressor');m.sum=node('createGain');
   m.input.connect(m.low);m.input.connect(m.high);
   m.high.connect(m.comp);m.low.connect(m.sum);m.comp.connect(m.sum);m.sum.connect(m.wet);
  }else if(id==='hardidoubler'){
   m.voices=[];
   const wetSum=node('createGain');wetSum.gain.value=.5;wetSum.connect(m.wet);
   for(const sign of [-1,1]){
    const delay=node('createDelay',.12),tone=node('createBiquadFilter'),pan=node('createStereoPanner');
    tone.type='lowpass';m.input.connect(delay);delay.connect(tone);tone.connect(pan);pan.connect(wetSum);
    m.voices.push({delay,tone,pan,sign});
   }
  }
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
  set(m.low.frequency,f);set(m.high.frequency,f);
  set(m.comp.threshold,s.threshold);set(m.comp.ratio,s.ratio);
  set(m.comp.attack,.001);set(m.comp.release,.075);set(m.comp.knee,2);
 }
 if(id==='hardidoubler')for(const v of m.voices){
  set(v.delay.delayTime,(s.delay+v.sign*2)/1000);
  set(v.tone.frequency,Math.min(s.tone,m.input.context.sampleRate*.45));
  set(v.pan.pan,v.sign*s.width);
 }
}
