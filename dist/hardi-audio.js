import {dynamicsLatency} from './dynamics-timing.js';
import {createCompressor} from './compressor-audio.js';
import {HARDI_INSTRUMENTS,HARDI_EFFECTS} from './hardi-suite.js';
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const db=x=>10**(x/20);
const settings=(def,v)=>Object.fromEntries(def.controls.map(c=>[c.key,clamp(Number.isFinite(v?.[c.key])?v[c.key]:c.default,c.min,c.max)]));
const category={
 hardiharpa:'pluck',hardimbira:'mallet',hardicelesta:'bell',hardimallet:'mallet',hardiflute:'wind',hardireed:'reed',
 hardibrass:'brass',hardistrings:'strings',hardichoira:'choir',hardisoul:'organ',hardipulse:'pluck',hardiambient:'pad'
};
export function hardiInstrumentVoice(ctx,out,type,midi,t,duration,values={},velocity=1,scope,remember){
 const def=HARDI_INSTRUMENTS[type];if(!def)return false;
 const p=settings(def,values),vel=clamp(velocity,0,1);if(vel<=0)return true;
 t=Math.max(ctx.currentTime,t);duration=clamp(duration,.03,30);
 const hz=440*2**((clamp(midi,0,127)-69)/12),end=t+duration;
 const family=category[type],node=(kind,...args)=>scope.node(kind,...args);
 const amp=node('createGain'),filter=node('createBiquadFilter');
 amp.connect(out);filter.connect(amp);filter.type='lowpass';filter.Q.value=.6;
 filter.frequency.setValueAtTime(clamp(p.tone*(.8+vel*.3),250,ctx.sampleRate*.45),t);
 const attack=Math.min(duration*.6,p.attack),release=p.release;
 const power=db(p.output)*vel*(family==='strings'||family==='pad'||family==='choir'?.17:.25);
 amp.gain.setValueAtTime(0,t);amp.gain.linearRampToValueAtTime(power,t+Math.max(.002,attack));
 const percussive=['pluck','mallet','bell'].includes(family);
 if(percussive)amp.gain.setTargetAtTime(.0001,t+attack,Math.max(.04,Math.min(1.4,duration*.43+p.body*.22)));
 else {amp.gain.setValueAtTime(power*.77,Math.max(t+attack,end));amp.gain.setTargetAtTime(.0001,end,Math.max(.02,release/4));}
 const stop=end+Math.min(4,release*4)+.08;
 const parts={
  pluck:[['triangle',1,.68],['sine',2,.19],['sine',3,.1]],
  mallet:[['sine',1,.72],['sine',2.78,.16],['sine',5.04,.11]],
  bell:[['sine',1,.55],['sine',2.06,.25],['sine',3.91,.12]],
  wind:[['sine',1,.72],['triangle',2,.19],['sine',3,.07]],
  reed:[['sawtooth',1,.4],['triangle',1.01,.24],['sine',2,.2]],
  brass:[['sawtooth',1,.36],['sawtooth',1.005,.35],['triangle',.5,.17]],
  strings:[['sawtooth',1,.23],['sawtooth',1.004,.22],['triangle',2,.14],['sine',.5,.2]],
  choir:[['sine',1,.38],['triangle',2,.26],['sine',3,.2]],
  organ:[['sine',1,.32],['sine',2,.26],['sine',3,.18],['sine',4,.11]],
  pad:[['sawtooth',1,.21],['triangle',1.006,.22],['sine',.5,.18],['sine',2,.11]]
 }[family]||[['sawtooth',1,.3],['triangle',2,.15]];
 const toneOscillators=[];
 for(const [wave,ratio,volume] of parts){
  const o=node('createOscillator'),g=node('createGain');
  o.type=wave;o.frequency.setValueAtTime(hz*ratio,t);o.detune.value=(ratio===1?0:p.motion*8);toneOscillators.push(o);
  g.gain.value=volume*(.65+.45*p.body);o.connect(g);g.connect(filter);scope.watch(o);remember?.(o);o.start(t);o.stop(stop);
 }
 if(family==='wind'||family==='reed'||family==='strings'||family==='pad'||family==='choir'||family==='brass'){
  const lfo=node('createOscillator'),depth=node('createGain');
  lfo.frequency.value=4.7+p.motion*1.9;depth.gain.value=p.motion*4;
  // Musical vibrato is small and arrives after the attack.
  lfo.connect(depth);for(const oscillator of toneOscillators)depth.connect(oscillator.detune);
  scope.watch(lfo);remember?.(lfo);lfo.start(t);lfo.stop(stop);
 }
 return true;
}
const shaper=drive=>Float32Array.from({length:2049},(_,i)=>Math.tanh((1+drive*2.2)*(i/1024-1))/Math.tanh(1+drive*2.2));
export function createHardiEffects(ctx,scope,types=null){
 const modules={};const node=(type,...a)=>scope.node(type,...a);
 for(const id of Object.keys(HARDI_EFFECTS)){
  if(types&&!types.includes(id))continue;
  const m=modules[id]={input:node('createGain'),output:node('createGain')};
  m.dry=node('createGain');m.wet=node('createGain');m.level=node('createGain');
  if(id==='hardibus'){m.dryDelay=node('createDelay',.1);m.dryDelay.delayTime.value=dynamicsLatency(ctx.sampleRate);m.input.connect(m.dryDelay);m.dryDelay.connect(m.dry);}else m.input.connect(m.dry);m.dry.connect(m.level);m.wet.connect(m.level);m.level.connect(m.output);
  if(id==='harditilt'){
   m.low=node('createBiquadFilter');m.high=node('createBiquadFilter');
   m.low.type='lowshelf';m.high.type='highshelf';m.lowcut=node('createBiquadFilter');m.lowcut.type='highpass';m.lowcut.frequency.value=0;m.lowcut.Q.value=Math.SQRT1_2;m.highcut=node('createBiquadFilter');m.highcut.type='lowpass';m.highcut.frequency.value=ctx.sampleRate/2;m.highcut.Q.value=Math.SQRT1_2;m.input.connect(m.lowcut);m.lowcut.connect(m.low);m.low.connect(m.high);m.high.connect(m.highcut);m.highcut.connect(m.wet);
  }else if(id==='hardibus'){
   m.comp=createCompressor(ctx,scope);m.input.connect(m.comp);m.comp.connect(m.wet);
   m.bindings={threshold:[m.comp.threshold],ratio:[m.comp.ratio],attack:[[m.comp.attack,x=>x/1000]],release:[[m.comp.release,x=>x/1000]],mix:[[m.dry.gain,x=>1-x],m.wet.gain],output:[[m.level.gain,db,true]]};
  }else if(id==='hardistage'){
   m.split=node('createChannelSplitter',2);m.merge=node('createChannelMerger',2);
   m.ll=node('createGain');m.lr=node('createGain');m.rl=node('createGain');m.rr=node('createGain');
   m.input.connect(m.split);m.split.connect(m.ll,0);m.split.connect(m.lr,0);m.split.connect(m.rl,1);m.split.connect(m.rr,1);
   m.ll.connect(m.merge,0,0);m.rl.connect(m.merge,0,0);m.lr.connect(m.merge,0,1);m.rr.connect(m.merge,0,1);m.merge.connect(m.wet);
  }else if(id==='harditape'){
   m.drive=node('createGain');m.shape=node('createWaveShaper');m.shape.oversample='2x';m.tone=node('createBiquadFilter');
   m.tone.type='lowpass';m.bump=node('createBiquadFilter');m.bump.type='lowshelf';m.bump.frequency.value=90;m.bump.gain.value=0;m.input.connect(m.drive);m.drive.connect(m.shape);m.shape.connect(m.tone);m.tone.connect(m.bump);m.bump.connect(m.wet);
  }
  if(id==='harditilt')m.bindings={pivot:[m.low.frequency,m.high.frequency],tilt:[[m.low.gain,x=>-x],m.high.gain]};
  if(id==='hardistage')m.bindings={width:[[m.ll.gain,x=>(1+x)/2],[m.rr.gain,x=>(1+x)/2],[m.lr.gain,x=>(1-x)/2],[m.rl.gain,x=>(1-x)/2]]};
  if(id==='harditape')m.bindings={tone:[m.tone.frequency]};
  m.bindings={...m.bindings,mix:[[m.dry.gain,x=>1-x],m.wet.gain],output:[[m.level.gain,db,true]]};

 }
 return modules;
}
export function syncHardiEffect(id,m,s,now=0,initial=false){
 const set=(n,v)=>initial?n.setValueAtTime(v,now):n.setTargetAtTime(v,now,.02);
 const mix=s.enabled===false?0:s.mix;
 set(m.dry.gain,1-mix);set(m.wet.gain,mix);set(m.level.gain,db(s.output));
 if(id==='harditilt'){set(m.low.frequency,s.pivot);set(m.high.frequency,s.pivot);set(m.low.gain,-s.tilt);set(m.high.gain,s.tilt);set(m.lowcut.frequency,(s.lowcut??20)<=20?0:s.lowcut);set(m.highcut.frequency,(s.highcut??20000)>=19950?m.input.context.sampleRate/2:s.highcut);}
 if(id==='hardibus'){set(m.comp.threshold,s.threshold);set(m.comp.ratio,s.ratio);set(m.comp.attack,s.attack/1000);set(m.comp.release,s.release/1000);set(m.comp.knee,6);}
 if(id==='hardistage'){
  // L=(1+w)/2*L+(1-w)/2*R, R=(1-w)/2*L+(1+w)/2*R
  // Balance attenuates the opposite side only (0 = centre, exact identity).
  const a=(1+s.width)/2,b=(1-s.width)/2,bal=s.balance??0,gl=bal>0?1-bal:1,gr=bal<0?1+bal:1;set(m.ll.gain,a*gl);set(m.rl.gain,b*gl);set(m.rr.gain,a*gr);set(m.lr.gain,b*gr);
 }
 if(id==='harditape'){set(m.drive.gain,db(s.drive));m.shape.curve=shaper(s.drive/18);set(m.tone.frequency,Math.min(m.input.context.sampleRate*.45,s.tone));set(m.bump.gain,s.bump??0);}
}
