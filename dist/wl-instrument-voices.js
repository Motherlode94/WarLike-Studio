import {pluckedString} from './instrument-voices.js';
import {GUITAR_VOICES,GUITAR_INSTRUMENTS,SYNTH_INSTRUMENTS} from './wl-instrument-packs.js';
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const gain=db=>10**(db/20);
const waves=['sine','triangle','sawtooth','square'];
const stringCache=new WeakMap();
function stringBuffer(ctx,hz,decay,brightness,style,pickPosition=.32,damping=.25){
 let m=stringCache.get(ctx);if(!m){m=new Map();stringCache.set(ctx,m);}
 const key=[hz.toFixed(3),decay.toFixed(3),brightness,style,pickPosition.toFixed(2),damping.toFixed(2)].join(':');
 if(m.has(key))return m.get(key);
 const data=pluckedString(ctx.sampleRate,hz,decay,brightness);
 // A physically motivated pick-position comb: short averaging at the pluck
 // point suppresses harmonics near the contact position (not just EQ).
 const period=Math.max(3,Math.round(ctx.sampleRate/hz));
 const distance=Math.max(1,Math.round(period*pickPosition));
 let low=0;
 const colour={nylon:.5,jazz:.42,steel:.13,twelve:.12,clean:.25,crunch:.29,muted:.67}[style]??.25;
 for(let i=0;i<data.length;i++){
  const x=data[i],shifted=i>=distance?data[i-distance]:0;
  const comb=x-(shifted*.46);
  low+=((1-colour*.55)*(comb-low));
  const softened=comb*(1-colour)+low*colour;
  const attack=i<period?.82:1;
  const fall=Math.exp(-Math.max(0,i-period)*damping/(ctx.sampleRate*Math.max(.09,decay)));
  data[i]=Math.max(-1,Math.min(1,softened*attack*fall));
 }
 const b=ctx.createBuffer(1,data.length,ctx.sampleRate);b.copyToChannel(data,0);
 if(m.size>72)m.delete(m.keys().next().value);m.set(key,b);return b;
}
function envelope(ctx,scope,out,t,duration,attack,release,peak,sustain=.8){
 const g=scope.node('createGain'),a=Math.min(.3,Math.max(.001,attack)),end=t+duration+release;
 g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(peak,t+a);
 g.gain.setValueAtTime(peak*sustain,t+Math.max(a+.001,duration));
 g.gain.setTargetAtTime(.00001,t+duration,Math.max(.004,release/5));
 g.connect(out);return {g,end};
}
function playSource(source,scope,remember,t,end){scope.watch(source);remember?.(source);source.start(t);source.stop(end);}
export function warlikeInstrumentVoice(ctx,out,type,midi,t,duration,values={},velocity=1,scope,remember){
 const def=GUITAR_INSTRUMENTS[type]||SYNTH_INSTRUMENTS[type];if(!def)return false;
 const p=Object.fromEntries(def.controls.map(c=>[c.key,clamp(Number.isFinite(values[c.key])?values[c.key]:c.default,c.min,c.max)]));
 const vel=clamp(velocity,0,1);if(!vel)return true;
 t=Math.max(t,ctx.currentTime);duration=clamp(duration,.03,30);
 const hz=440*2**((clamp(midi,0,127)-69)/12),nyq=ctx.sampleRate*.45;
 const safe=f=>clamp(f,35,nyq);
 if(GUITAR_VOICES[type]){
  const style=GUITAR_VOICES[type].style,muted=style==='muted',electric=['jazz','clean','crunch','muted'].includes(style);
  const decay=Math.min(p.decay*(muted?.16:style==='nylon'?.82:style==='clean'?.75:1),muted?.24:3.4);
  const env=envelope(ctx,scope,out,t,duration,p.attack,p.release,gain(p.output)*vel*.45);
  const body=scope.node('createBiquadFilter'),tone=scope.node('createBiquadFilter');
  body.type='peaking';body.frequency.value=style==='nylon'?360:style==='jazz'?280:style==='crunch'?1150:style==='muted'?1200:240;
  body.Q.value=.72;body.gain.value=(p.body-.5)*12+(electric?2:4);
  tone.type='lowpass';tone.frequency.value=safe(p.brightness*(style==='nylon'?.55:style==='jazz'?.65:style==='muted'?.65:1));
  tone.Q.value=.5;body.connect(tone);tone.connect(env.g);
  const count=style==='twelve'?2:style==='crunch'?2:1;
  for(let i=0;i<count;i++){
   const ratio=style==='twelve'&&midi<60&&i===1?2:1;
   const detuned=style==='twelve'&&i===1?1.003:style==='crunch'&&i===1?1.006:1;
   const b=stringBuffer(ctx,hz*ratio*detuned,decay,p.brightness,style,p.pickPosition,p.damping),src=scope.node('createBufferSource');
   src.buffer=b;const g=scope.node('createGain');g.gain.value=(style==='twelve'?i===0?.72:.32:1/count);
   src.connect(g);g.connect(body);playSource(src,scope,remember,t,Math.min(t+b.duration,t+duration+p.release+.04));
  }
  // Crunch is actual nonlinear processing; clean and nylon never use this circuit.
  if(style==='crunch'){
   const drive=scope.node('createWaveShaper'),low=scope.node('createBiquadFilter');drive.oversample='4x';
   const k=1+14*p.drive,curve=new Float32Array(2049);
   for(let i=0;i<curve.length;i++){const x=i/1024-1;curve[i]=Math.tanh(k*x)/Math.tanh(k);}
   drive.curve=curve;low.type='lowpass';low.frequency.value=safe(4900);
   tone.disconnect();tone.connect(drive);drive.connect(low);low.connect(env.g);
  }
  return true;
 }
 // Three distinct sound engines, not three names on the same synth preset.
 const env=envelope(ctx,scope,out,t,duration,p.attack,p.release,gain(p.output)*vel*.28);
 const filter=scope.node('createBiquadFilter');filter.type='lowpass';filter.frequency.value=safe(p.cutoff);filter.Q.value=p.resonance||.65;filter.connect(env.g);
 function osc(wave,freq,detune,level,pan=0){
  const o=scope.node('createOscillator'),g=scope.node('createGain'),st=scope.node('createStereoPanner');
  o.type=wave;o.frequency.setValueAtTime(freq,t);o.detune.value=detune;g.gain.value=level;st.pan.value=pan;
  o.connect(g);g.connect(st);st.connect(filter);playSource(o,scope,remember,t,env.end);return o;
 }
 if(type==='wlrompler'){
  osc(waves[Math.round(p.wave)],hz,0,1-p.layer,-.3);
  osc(waves[Math.round(p.texture)],hz*2,4,p.layer*.55,.3);
  filter.frequency.setTargetAtTime(safe(p.cutoff*(1+p.space*.3)),t,.25);
 }else if(type==='wlvirtual'){
  osc('sawtooth',hz,-p.detune,.38,-p.width);
  osc('sawtooth',hz,p.detune,.38,p.width);
  osc('square',hz,0,p.pulse*.2,0);
  filter.frequency.setValueAtTime(safe(p.cutoff*2),t);
  filter.frequency.setTargetAtTime(safe(p.cutoff*.65),t+.01,.14);
 }else{
  const carrier=osc('sine',hz,0,.85,-p.width*.3);
  const mod=scope.node('createOscillator'),index=scope.node('createGain');
  mod.type='sine';mod.frequency.setValueAtTime(hz*(1+p.harmonics*4),t);
  index.gain.setValueAtTime(hz*p.fm*5,t);
  index.gain.setTargetAtTime(hz*p.fm*.1,t+.03,.25);
  mod.connect(index);index.connect(carrier.frequency);playSource(mod,scope,remember,t,env.end);
  osc('triangle',hz*2,7,p.harmonics*.3,p.width*.3);
  filter.frequency.setValueAtTime(safe(p.cutoff*(1+.4*p.motion)),t);
  filter.frequency.setTargetAtTime(safe(p.cutoff*.55),t+.05,.8);
 }
 return true;
}
