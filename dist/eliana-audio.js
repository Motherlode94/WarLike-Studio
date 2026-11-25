import {ELIANA_EFFECTS} from './eliana-pack.js';
const db=x=>10**(x/20);
export function createElianaEffects(ctx,scope,types=null){
 const modules={},node=(name,...args)=>scope.node(name,...args);
 for(const id of Object.keys(ELIANA_EFFECTS)){
  if(types&&!types.includes(id))continue;
  const m=modules[id]={input:node('createGain'),output:node('createGain')};
  m.dry=node('createGain');m.wet=node('createGain');
  m.input.connect(m.dry);m.dry.connect(m.output);m.wet.connect(m.output);
  if(id==='elianaveil'){
   m.hp=node('createBiquadFilter');m.hp.type='highpass';
   m.low=node('createBiquadFilter');m.low.type='lowshelf';m.low.frequency.value=310;
   m.high=node('createBiquadFilter');m.high.type='highshelf';m.high.frequency.value=6500;
   m.input.connect(m.hp);m.hp.connect(m.low);m.low.connect(m.high);m.high.connect(m.wet);
  }
  if(id==='elianaembrace'||id==='elianaguard'){
   m.comp=node('createDynamicsCompressor');m.trim=node('createGain');
   m.input.connect(m.comp);m.comp.connect(m.trim);m.trim.connect(m.wet);
  }
  if(id==='eliananest'){
   // Stable filtered delay feedback with decay strictly below unity.
   m.delay=node('createDelay',.4);m.feedback=node('createGain');m.tone=node('createBiquadFilter');
   m.tone.type='lowpass';m.delay.connect(m.tone);m.tone.connect(m.feedback);
   m.feedback.connect(m.delay);m.input.connect(m.delay);m.tone.connect(m.wet);
  }
 }
 return modules;
}
export function syncElianaEffect(id,m,s,now=0,initial=false){
 const set=(p,v)=>initial?p.setValueAtTime(v,now):p.setTargetAtTime(v,now,.02);
 const wet=s.enabled===false?0:s.mix;set(m.dry.gain,1-wet);set(m.wet.gain,wet);
 if(id==='elianaveil'){
  set(m.hp.frequency,s.lowcut);set(m.low.gain,s.warmth);set(m.high.gain,s.air);
 }
 if(id==='elianaembrace'||id==='elianaguard'){
  set(m.comp.threshold,s.threshold);set(m.comp.ratio,s.ratio);
  set(m.comp.attack,s.attack/1000);set(m.comp.release,s.release/1000);set(m.comp.knee,8);
  set(m.trim.gain,db(id==='elianaguard'?s.ceiling:s.output));
 }
 if(id==='eliananest'){
  set(m.delay.delayTime,s.size/1000);set(m.feedback.gain,s.enabled===false?0:s.feedback);
  set(m.tone.frequency,Math.min(s.tone,m.input.context.sampleRate*.45));
 }
}
