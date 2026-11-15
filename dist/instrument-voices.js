// Five voice architectures. Existing instrument IDs and saved parameter names stay valid.
import {INSTRUMENTS} from './plugins.js?v=0.14.0';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export function voiceSettings(type,values={}){return Object.fromEntries(INSTRUMENTS[type].controls.map(c=>[c.key,Number.isFinite(values[c.key])?clamp(values[c.key],c.min,c.max):c.default]));}
// Fractional-delay Karplus–Strong string; the damping filter's delay is compensated.
export function pluckedString(sampleRate,hz,decay,brightness){
 const weight=clamp(1-brightness/(sampleRate*.5),.08,.48),delay=Math.max(2,sampleRate/hz-weight),size=Math.ceil(delay)+2;
 const ring=new Float32Array(size),data=new Float32Array(Math.ceil(sampleRate*Math.min(5,decay*2+.1)));
 const feedback=Math.exp(-6.9078/(hz*Math.max(.04,decay))),excitation=Math.ceil(delay);let seed=7919,previous=0,mean=0;
 for(let i=0;i<excitation;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;ring[i]=seed/2147483648-1;mean+=ring[i]/excitation;}
 for(let i=0;i<excitation;i++)ring[i]-=mean;
 for(let i=0;i<data.length;i++){
  const write=i%size;let value;
  if(i<excitation)value=ring[i];
  else{const read=(write-delay+size)%size,index=Math.floor(read),fraction=read-index,raw=ring[index]*(1-fraction)+ring[(index+1)%size]*fraction;value=((1-weight)*raw+weight*previous)*feedback;previous=raw;}
  ring[write]=value;data[i]=value*Math.min(1,i/(sampleRate*.0015))*Math.min(1,(data.length-i)/(sampleRate*.01));
 }
 return data;
}
const stringCaches=new WeakMap();
function stringBuffer(ctx,hz,p){let cache=stringCaches.get(ctx);if(!cache)stringCaches.set(ctx,cache=new Map());const key=[hz,p.decay,p.brightness].join(':');if(cache.has(key))return cache.get(key);const data=pluckedString(ctx.sampleRate,hz,p.decay,p.brightness),buffer=ctx.createBuffer(1,data.length,ctx.sampleRate);buffer.copyToChannel(data,0);if(cache.size>=32)cache.delete(cache.keys().next().value);cache.set(key,buffer);return buffer;}
export function instrumentVoice(ctx,out,type,midi,t,duration,values,velocity,scope,remember){
 const p=voiceSettings(type,values),v=clamp(Number.isFinite(velocity)?velocity:1,0,1);if(!v)return;
 const node=scope.node,hz=440*2**((clamp(Number.isFinite(midi)?midi:60,0,127)-69)/12);t=Math.max(t,ctx.currentTime);duration=clamp(Number.isFinite(duration)?duration:.5,.01,120);
 const release=p.release??.045,end=t+duration+release+.025;
 function source(s,stop=end){scope.watch(s);remember?.(s);s.start(t);s.stop(stop);return s;}
 function osc(wave,ratio=1,detune=0){const o=node('createOscillator');o.type=wave;o.frequency.setValueAtTime(hz*ratio,t);o.detune.value=detune;return o;}
 function envelope(level,attack,decay,sustain){const g=node('createGain'),a=Math.min(attack,duration),d=Math.min(duration,a+decay);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(level,t+a);g.gain.exponentialRampToValueAtTime(Math.max(.00001,level*sustain),t+Math.max(a+.0001,d));g.gain.setValueAtTime(Math.max(.00001,level*sustain),t+Math.max(duration,d));g.gain.exponentialRampToValueAtTime(.00001,end);return g;}
 if(type==='pluck'){
  const s=node('createBufferSource'),g=node('createGain');s.buffer=stringBuffer(ctx,hz,p);g.gain.setValueAtTime(p.body*1.5*v,t);g.gain.setValueAtTime(p.body*1.5*v,t+duration);g.gain.exponentialRampToValueAtTime(.00001,end);s.connect(g);g.connect(out);source(s,Math.min(end,t+s.buffer.duration));return;
 }
 if(type==='keys'){
  // FM tines: velocity changes the metallic attack as well as loudness.
  const env=envelope(.24*v**1.25,p.attack,.7,.3),carrier=osc('sine'),mod=osc('sine',2+p.detune*.002),index=node('createGain');
  index.gain.setValueAtTime(hz*(1+v*4),t);index.gain.exponentialRampToValueAtTime(hz*.3,t+.45);index.gain.exponentialRampToValueAtTime(hz*.05,t+1.2);mod.connect(index);index.connect(carrier.frequency);carrier.connect(env);env.connect(out);source(mod);source(carrier);
  const tine=osc('sine',7),strike=envelope(.018*v*v,.002,.07,.0005);tine.connect(strike);strike.connect(out);source(tine);return;
 }
 if(type==='bass'){
  const env=envelope(p.body*v*.85,.006,.16,.56),sub=osc('sine');sub.frequency.setValueAtTime(hz*1.6,t);sub.frequency.exponentialRampToValueAtTime(hz,t+.035);sub.connect(env);env.connect(out);source(sub);
  if(p.harmonics){const harmonic=osc('triangle',2),level=node('createGain');level.gain.value=p.harmonics*.6;harmonic.connect(level);level.connect(env);source(harmonic);}return;
 }
 if(type==='lead'){
  const env=envelope(.095*v,.006,.15,.62),filter=node('createBiquadFilter');filter.type='lowpass';filter.Q.value=2.4;const cutoff=Math.min(ctx.sampleRate*.42,p.cutoff);filter.frequency.setValueAtTime(Math.min(ctx.sampleRate*.44,cutoff*(1+v)),t);filter.frequency.exponentialRampToValueAtTime(Math.max(100,cutoff*.42),t+.22);env.connect(filter);filter.connect(out);
  for(const [wave,detune,gain] of [['sawtooth',-p.detune/2,1],['square',p.detune/2,.28]]){const o=osc(wave,1,detune),g=node('createGain');g.gain.value=gain;o.connect(g);g.connect(env);source(o);}return;
 }
 // HALO: stereo ensemble with slow spectral motion and independent detuned voices.
 const env=envelope(.065*v,p.attack,.9,.8),filter=node('createBiquadFilter');filter.type='lowpass';filter.frequency.value=1800;filter.Q.value=.5;env.connect(filter);filter.connect(out);
 const lfo=osc('sine');lfo.frequency.value=.28;const motion=node('createGain');motion.gain.value=650;lfo.connect(motion);motion.connect(filter.frequency);source(lfo);
 for(const [wave,ratio,detune,pan,gain] of [['sawtooth',1,-p.width,-.8,.55],['triangle',1,p.width,.8,.7],['sine',2,0,0,.15]]){const o=osc(wave,ratio,detune),g=node('createGain'),stereo=node('createStereoPanner');g.gain.value=gain;stereo.pan.value=pan;o.connect(g);g.connect(stereo);stereo.connect(env);source(o);}
}
