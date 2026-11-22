import {EXPANSION_INSTRUMENTS} from './wl-expansion.js';
import {pluckedString} from './instrument-voices.js';
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),db=x=>10**(x/20),tau=2*Math.PI;
export function expansionSettings(type,values={}){const def=EXPANSION_INSTRUMENTS[type];if(!def)return null;return Object.fromEntries(def.controls.map(c=>[c.key,clamp(Number.isFinite(values[c.key])?values[c.key]:c.default,c.min,c.max)]));}
// One-second periodic, deterministic grain cloud. No external samples required.
// Circular overlap-add avoids discontinuities at the loop boundary.
export function grainCloud(rate,hz,p){
 const n=rate|0,data=new Float32Array(n),size=Math.max(8,Math.round(p.grain*rate)),count=Math.max(1,Math.round(p.density));
 for(let g=0;g<count;g++){const seed=(Math.sin((g+1)*91.731)*43758.5453)%1,noise=seed-Math.floor(seed),offset=Math.floor(g*n/count+noise*p.scatter*n/count),f=hz*2**((noise-.5)*p.scatter*.8),phase=noise*tau;for(let i=0;i<size;i++){const x=i/rate,win=.5-.5*Math.cos(tau*i/(size-1));data[(offset+i)%n]+=win*(Math.sin(tau*f*x+phase)+.25*Math.sin(tau*f*2*x)) / Math.max(2,count*p.grain*1.5);}}
 return data;
}
export function expansionVoice(ctx,out,type,midi,time,length,values={},velocity=1,scope,remember){
 const p=expansionSettings(type,values);if(!p)return false;const vel=clamp(velocity,0,1);if(!vel)return true;
 const t=Math.max(ctx.currentTime,time),duration=clamp(length,.025,30),end=t+duration+p.release+.025,hz=440*2**((clamp(midi,0,127)-69)/12),ny=ctx.sampleRate*.45,node=scope.node;
 const env=node('createGain'),peak=db(p.output)*vel*.55,a=Math.min(duration*.8,p.attack);
 env.gain.setValueAtTime(0,t);env.gain.linearRampToValueAtTime(peak,t+a);env.gain.setValueAtTime(peak,t+duration);env.gain.exponentialRampToValueAtTime(.00001,end);env.connect(out);
 const play=(src,stop=end)=>{scope.watch(src);remember?.(src);src.start(t);src.stop(stop);};
 function osc(freq,amp,wave='sine',pan=0,decay=0,dest=env,cents=0){if(freq>=ny||amp<=0)return null;const o=node('createOscillator'),g=node('createGain'),st=node('createStereoPanner');o.type=wave;o.frequency.value=Math.max(8,freq);o.detune.value=cents;g.gain.setValueAtTime(amp,t);if(decay>0)g.gain.exponentialRampToValueAtTime(.00001,Math.min(end,t+decay));st.pan.value=pan;o.connect(g);g.connect(st);st.connect(dest);play(o);return o;}
 function buffer(data,dest=env,loop=false){const b=ctx.createBuffer(1,data.length,ctx.sampleRate);b.copyToChannel(data,0);const src=node('createBufferSource');src.buffer=b;src.loop=loop;src.connect(dest);play(src,loop?end:Math.min(end,t+b.duration));}
 function lowpass(freq,dest=env){const f=node('createBiquadFilter');f.type='lowpass';f.frequency.value=clamp(freq,40,ny);f.Q.value=.6;f.connect(dest);return f;}
 if(type==='wltitan'){
  const data=pluckedString(ctx.sampleRate,hz,Math.max(.2,2.8*(1-p.damping)),p.brightness),delay=Math.max(1,Math.round(ctx.sampleRate/hz*p.pickup));for(let i=data.length-1;i>=delay;i--)data[i]=(data[i]-.75*data[i-delay])*.6;
  buffer(data,lowpass(p.brightness));
 }else if(type==='wlabyss'){
  const sh=node('createWaveShaper'),k=1+8*p.drive;sh.curve=Float32Array.from({length:2049},(_,i)=>Math.tanh((i/1024-1)*k)/Math.tanh(k));sh.oversample='2x';sh.connect(env);
  const o=osc(hz,.8,'sine',0,0,sh);if(o){o.frequency.setValueAtTime(Math.min(ny,hz*2**(p.drop/12)),t);o.frequency.exponentialRampToValueAtTime(hz,t+Math.min(duration,p.time));}
 }else if(type==='wlimperial'){
  const f=lowpass(7200);osc(hz,.24*p.strings,'sawtooth',-p.width,0,f,-9);osc(hz,.24*p.strings,'sawtooth',p.width,0,f,9);osc(hz*2,.12*p.strings,'triangle',0,0,f);
  const brass=lowpass(4800);brass.frequency.setValueAtTime(900,t);brass.frequency.exponentialRampToValueAtTime(4800,t+Math.min(duration,.18));osc(hz,.25*p.brass,'sawtooth',0,0,brass);osc(hz*2,.1*p.brass,'square',0,0,brass);
 }else if(type==='wltonewheel'){
  for(const [ratio,amp] of [[.5,p.sub],[1,p.fundamental],[2,p.octave],[3,p.third],[4,p.high]])osc(hz*ratio,amp*.18);
  osc(hz*3,p.percussion*.18,'sine',0,.18);
 }else if(type==='wlmbira'){
  for(const [i,ratio] of [1,2.76,5.41,8.93].entries())osc(hz*ratio,i===0?.7:.25*p.metal/i,'sine',i%2?.1:-.1,p.decay/(1+i*.75));
  osc(hz*2.03,p.buzz*.13,'triangle',0,.08);
 }else if(type==='wlngoma'){
  for(const [i,ratio] of [1,1.59,2.14,2.92].entries()){const o=osc(hz*.5*ratio,(i===0?.65:.27*p.skin/i),'sine',0,p.decay/(1+i*.8));if(o){o.frequency.setValueAtTime(hz*.5*ratio*(1+p.strike*.2),t);o.frequency.exponentialRampToValueAtTime(hz*.5*ratio,t+.035);}}
  const n=Math.round(ctx.sampleRate*.045),data=Float32Array.from({length:n},(_,i)=>Math.sin(i*127.1+Math.sin(i*37.4))*p.strike*.17*Math.exp(-i/n*8));buffer(data);
 }else if(type==='wlkora'){
  const data=pluckedString(ctx.sampleRate,hz,p.decay,8500),d=Math.max(1,Math.round(ctx.sampleRate/hz*p.pluck));for(let i=data.length-1;i>=d;i--)data[i]=(data[i]-.45*data[i-d])*.65;buffer(data,lowpass(9800));
  osc(hz*2,.12*p.resonance,'sine',-.25,p.decay);osc(hz*3,.08*p.resonance,'sine',.25,p.decay*.7);
 }else if(type==='wlchoir'){
  const mix=node('createGain'),first=node('createBiquadFilter'),second=node('createBiquadFilter'),body=lowpass(4000);first.type=second.type='bandpass';first.frequency.value=800-350*p.vowel;second.frequency.value=1450-650*p.vowel;first.Q.value=3;second.Q.value=4;mix.connect(first);mix.connect(second);first.connect(body);second.connect(body);
  osc(hz,.33,'sawtooth',-p.width,0,mix,-p.spread);osc(hz,.33,'sawtooth',p.width,0,mix,p.spread);osc(hz,.28,'triangle',0,0,mix);
 }else if(type==='wldrift'){
  buffer(grainCloud(ctx.sampleRate,hz,p),env,true);
 }else if(type==='wlmatrix'){
  const carrier=osc(hz,.75);if(carrier){for(const [ratio,index] of [[p.ratioA,p.indexA],[p.ratioB,p.indexB]]){if(hz*ratio>=ny||index===0)continue;const mod=node('createOscillator'),g=node('createGain');mod.frequency.value=hz*ratio;g.gain.setValueAtTime(hz*index,t);g.gain.exponentialRampToValueAtTime(.001,t+Math.min(duration,p.decay));mod.connect(g);g.connect(carrier.frequency);play(mod);}}
 }
 return true;
}
