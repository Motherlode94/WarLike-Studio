import {createVoiceShift} from './voice-shift-audio.js';
import {createCompressor} from './compressor-audio.js';
import {createVectorLimiter,syncVectorLimiter} from './vector-limit-audio.js';
import {alterFilterRate} from './alter-filter-model.js';
import {alterEchoSeconds,alterEchoCurve} from './alter-echo-model.js';
import {alterDoubleVoice} from './alter-double-model.js';
import {doublerVoice} from './vox-doubler-model.js';
import {voxWarmCurve} from './vox-warm-model.js';
import {micColorGains} from './vox-mic-model.js';
import {voxCleanCurve} from './vox-clean-model.js';
import {circuitColorCurve} from './circuit-color-model.js';
import {STUDIO_EFFECTS} from './studio-packs.js?v=0.14.0';
import {createVoxBC,syncVoxBC} from './vox-bc-audio.js?v=0.14.0';
const db=x=>10**(x/20),curve=fn=>Float32Array.from({length:4097},(_,i)=>fn(i/2048-1)),prepared=new WeakMap();
export async function prepareStudioContext(ctx){if(!ctx.audioWorklet)return;if(!prepared.has(ctx)){const task=Promise.all([
 ctx.audioWorklet.addModule(new URL('./vocal-worklet.js?v=0.14.0',import.meta.url)),
 ctx.audioWorklet.addModule(new URL('./voice-shift-worklet.js',import.meta.url)),
 ctx.audioWorklet.addModule(new URL('./vector-limit-worklet.js',import.meta.url)),
 ctx.audioWorklet.addModule(new URL('./compressor-worklet.js',import.meta.url))
 ]).catch(error=>{prepared.delete(ctx);throw error;});prepared.set(ctx,task);}await prepared.get(ctx);}
export function createStudioEffects(ctx,scope,types=null){const modules={},node=(kind,...args)=>scope.node(kind,...args),join=(a,b)=>a.connect(b);
 for(const id of Object.keys(STUDIO_EFFECTS)){if(types&&!types.includes(id))continue;if(id==='voxaireq'||id==='voxambience'){modules[id]=createVoxBC(ctx,scope,id);continue;}const m=modules[id]={input:node('createGain'),output:node('createGain'),bindings:{}};
  if(id==='circuiteq'||id==='vectoreq'){m.bands=[];let last=m.input;const keys=id==='circuiteq'?['low','body','presence','air']:Array.from({length:6},(_,i)=>'g'+i);keys.forEach((key,i)=>{const band=node('createBiquadFilter');band.type=id==='circuiteq'&&i===0?'lowshelf':id==='circuiteq'&&i===3?'highshelf':'peaking';join(last,band);last=band;m.bands.push(band);m.bindings[key]=[band.gain];m.bindings[id==='circuiteq'?['lowFreq','bodyFreq','presenceFreq','airFreq'][i]:'f'+i]=[band.frequency];if(id==='vectoreq')m.bindings['q'+i]=[band.Q];});m.level=node('createGain');join(last,m.level);join(m.level,m.output);m.bindings.output=[[m.level.gain,db,true]];}
  if(['circuitbus','vectorcomp','voxlevel'].includes(id)){m.comp=createCompressor(ctx,scope);m.second=id==='voxlevel'?createCompressor(ctx,scope):null;m.dryDelay=node('createDelay',.1);m.dry=node('createGain');m.wet=node('createGain');m.level=node('createGain');join(m.input,m.comp);if(m.second){join(m.comp,m.second);join(m.second,m.wet);}else join(m.comp,m.wet);join(m.input,m.dryDelay);join(m.dryDelay,m.dry);join(m.dry,m.level);join(m.wet,m.level);join(m.level,m.output);m.dryDelay.delayTime.value=m.comp.latency*(m.second?2:1);for(const key of ['threshold','ratio','knee'])m.bindings[key]=[m.comp[key]];for(const key of ['attack','release'])m.bindings[key]=[[m.comp[key],x=>x/1000]];m.bindings.output=[[m.level.gain,db,true]];m.bindings.mix=[[m.dry.gain,x=>1-x],m.wet.gain];if(m.second){m.bindings.ratio=[m.second.ratio];m.bindings.release=[[m.second.release,x=>x/1000]];}}
  if(id==='circuitcolor'){m.shaper=node('createWaveShaper');m.shaper.oversample='2x';m.dc=node('createBiquadFilter');m.dc.type='highpass';m.dc.frequency.value=20;m.tone=node('createBiquadFilter');m.tone.type='lowpass';m.tone.Q.value=.5;m.dry=node('createGain');m.wet=node('createGain');m.level=node('createGain');join(m.input,m.shaper);join(m.shaper,m.dc);join(m.dc,m.tone);join(m.tone,m.wet);join(m.input,m.dry);join(m.dry,m.level);join(m.wet,m.level);join(m.level,m.output);m.bindings={tone:[m.tone.frequency],mix:[[m.dry.gain,x=>1-x],m.wet.gain],output:[[m.level.gain,db,true]]};}
  if(id==='alterdouble'){m.hp=node('createBiquadFilter');m.hp.type='highpass';m.hp.Q.value=.5;join(m.input,m.hp);m.dry=node('createGain');m.wet=node('createGain');join(m.input,m.dry);join(m.dry,m.output);join(m.wet,m.output);m.voices=[];for(const sign of [-1,1]){const delay=node('createDelay',.1),lfo=node('createOscillator'),depth=node('createGain'),pan=node('createStereoPanner');join(m.hp,delay);join(delay,pan);join(pan,m.wet);join(lfo,depth);depth.connect(delay.delayTime);lfo.start(0);scope.oscillators.push(lfo);m.voices.push({delay,lfo,depth,pan,sign});}m.bindings.focus=[m.hp.frequency];m.bindings.mix=[[m.dry.gain,x=>1-x], [m.wet.gain,x=>x*.5]];}
  if(id==='alterecho'){m.delay=node('createDelay',6);m.feedback=node('createGain');m.tone=node('createBiquadFilter');m.tone.type='lowpass';m.duck=node('createGain');m.duck.gain.value=0;m.wet=node('createGain');m.rect=node('createWaveShaper');m.rect.curve=curve(Math.abs);m.smooth=node('createBiquadFilter');m.smooth.type='lowpass';m.smooth.frequency.value=12;m.control=node('createWaveShaper');join(m.input,m.output);join(m.input,m.delay);join(m.delay,m.feedback);join(m.feedback,m.tone);join(m.tone,m.delay);join(m.delay,m.duck);join(m.duck,m.wet);join(m.wet,m.output);join(m.input,m.rect);join(m.rect,m.smooth);join(m.smooth,m.control);m.control.connect(m.duck.gain);m.monitor=node('createAnalyser');m.monitor.fftSize=256;m.control.connect(m.monitor);m.bindings={feedback:[m.feedback.gain],tone:[m.tone.frequency],mix:[m.wet.gain]};}
  if(id==='alterfilter'){m.filter=node('createBiquadFilter');m.filter.type='lowpass';m.lfo=node('createOscillator');m.depth=node('createGain');m.dry=node('createGain');m.wet=node('createGain');join(m.input,m.filter);join(m.filter,m.wet);join(m.input,m.dry);join(m.wet,m.output);join(m.dry,m.output);join(m.lfo,m.depth);m.depth.connect(m.filter.detune);m.lfo.start(0);scope.oscillators.push(m.lfo);m.bindings={cutoff:[m.filter.frequency],q:[m.filter.Q],depth:[m.depth.gain],mix:[[m.dry.gain,x=>1-x],m.wet.gain]};}
  if(id==='vectorlimit'){const limiter=createVectorLimiter(ctx,scope);join(m.input,limiter.input);join(limiter.output,m.output);Object.assign(m,{drive:limiter.drive,scaleOut:limiter.output,limiter,bindings:limiter.bindings});Object.defineProperty(m,'reduction',{get:()=>limiter.reduction});}
  if(id==='voxtune'){if(!ctx.audioWorklet||typeof AudioWorkletNode==='undefined')throw Error('VOX TUNE demande AudioWorklet et une connexion HTTPS.');m.pitch=new AudioWorkletNode(ctx,'warlike-vocal-pitch',{numberOfInputs:1,numberOfOutputs:1,outputChannelCount:[2],channelCount:2,channelCountMode:'explicit'});scope.nodes.push(m.pitch);join(m.input,m.pitch);join(m.pitch,m.output);m.bindings=Object.fromEntries([...m.pitch.parameters].map(([key,value])=>[key,[value]]));}
  if(id==='voxshift'){
   m.pitch=createVoiceShift(ctx,scope);join(m.input,m.pitch);join(m.pitch,m.output);
   m.bindings=Object.fromEntries([...m.pitch.parameters].map(([key,value])=>[key,[value]]));
  }
  if(id==='voxformant'){
   m.dry=node('createGain');m.wet=node('createGain');m.low=node('createBiquadFilter');m.mid=node('createBiquadFilter');m.high=node('createBiquadFilter');
   m.low.type='peaking';m.low.Q.value=1.2;m.mid.type='peaking';m.mid.Q.value=1.4;m.high.type='highshelf';
   join(m.input,m.dry);join(m.dry,m.output);
   join(m.input,m.low);join(m.low,m.mid);join(m.mid,m.high);join(m.high,m.wet);join(m.wet,m.output);
  }
  if(id==='voxmicmodel'){
    m.low=node('createBiquadFilter');m.low.type='lowshelf';m.low.frequency.value=180;
    m.presence=node('createBiquadFilter');m.presence.type='peaking';m.presence.frequency.value=3200;m.presence.Q.value=.85;
    m.air=node('createBiquadFilter');m.air.type='highshelf';m.air.frequency.value=9500;
    m.dry=node('createGain');m.wet=node('createGain');
    join(m.input,m.dry);join(m.dry,m.output);
    join(m.input,m.low);join(m.low,m.presence);join(m.presence,m.air);join(m.air,m.wet);join(m.wet,m.output);
  }
  if(id==='voxwarm'){
    m.shaper=node('createWaveShaper');m.shaper.oversample='4x';
    m.dc=node('createBiquadFilter');m.dc.type='highpass';m.dc.frequency.value=24;
    m.tone=node('createBiquadFilter');m.tone.type='lowpass';m.tone.Q.value=.5;
    m.dry=node('createGain');m.wet=node('createGain');m.level=node('createGain');
    join(m.input,m.shaper);join(m.shaper,m.dc);join(m.dc,m.tone);join(m.tone,m.wet);
    join(m.input,m.dry);join(m.dry,m.output);join(m.wet,m.level);join(m.level,m.output);
  }
  if(id==='voxdoubler'){
    m.dry=node('createGain');m.wet=node('createGain');
    join(m.input,m.dry);join(m.dry,m.output);join(m.wet,m.output);
    m.voices=[];for(const sign of [-1,1]){
      const delay=node('createDelay',.15),lfo=node('createOscillator'),depth=node('createGain'),pan=node('createStereoPanner'),level=node('createGain');
      join(m.input,delay);join(delay,pan);join(pan,level);join(level,m.wet);
      join(lfo,depth);depth.connect(delay.delayTime);lfo.start(0);scope.oscillators.push(lfo);
      m.voices.push({delay,lfo,depth,pan,level,sign});
    }
  }
  if(id==='voxclean'){m.hp=node('createBiquadFilter');m.hp.type='highpass';m.hp.Q.value=.5;m.band=node('createBiquadFilter');m.band.type='bandpass';m.band.Q.value=.8;m.rect=node('createWaveShaper');m.rect.curve=curve(Math.abs);m.smooth=node('createBiquadFilter');m.smooth.type='lowpass';m.smooth.frequency.value=30;m.scale=node('createGain');m.control=node('createWaveShaper');m.correction=node('createGain');m.correction.gain.value=0;m.air=node('createBiquadFilter');m.air.type='highshelf';m.air.frequency.value=10000;m.level=node('createGain');join(m.input,m.hp);join(m.hp,m.band);join(m.hp,m.air);join(m.band,m.correction);join(m.correction,m.air);join(m.band,m.rect);join(m.rect,m.smooth);join(m.smooth,m.scale);join(m.scale,m.control);m.control.connect(m.correction.gain);join(m.air,m.level);join(m.level,m.output);m.bindings={highpass:[m.hp.frequency],frequency:[m.band.frequency],air:[m.air.gain],threshold:[[m.scale.gain,x=>1/32/db(x),true]],output:[[m.level.gain,db,true]]};}
  if(id==='voxformant')m.bindings={shift:[[m.low.frequency,x=>Math.min(ctx.sampleRate*.42,550*2**(x/12)),true],[m.mid.frequency,x=>Math.min(ctx.sampleRate*.42,1550*2**(x/12)),true],[m.high.frequency,x=>Math.min(ctx.sampleRate*.42,4200*2**(x/12)),true],[m.low.gain,x=>x*.75],[m.mid.gain,x=>x*1.15]],brightness:[m.high.gain],mix:[[m.dry.gain,x=>1-x],m.wet.gain]};
  if(id==='voxmicmodel')m.bindings={proximity:[[m.low.gain,x=>x+(m.profileOffset?.[0]||0)]],presence:[[m.presence.gain,x=>x+(m.profileOffset?.[1]||0)]],air:[[m.air.gain,x=>x+(m.profileOffset?.[2]||0)]],mix:[[m.dry.gain,x=>1-x],m.wet.gain]};
  if(id==='voxwarm')m.bindings={tone:[m.tone.frequency],mix:[[m.dry.gain,x=>1-x],m.wet.gain],output:[[m.level.gain,db,true]]};
  if(id==='voxdoubler')m.bindings={voices:m.voices.map(v=>[v.level.gain,x=>Math.min(1,x/2)/2]),width:m.voices.map(v=>[v.pan.pan,x=>x*v.sign]),mix:[[m.dry.gain,x=>1-x],m.wet.gain]};
  if(id==='alterdouble'){m.bindings.rate=m.voices.map(v=>[v.lfo.frequency,x=>x*(v.sign>0?1.17:1)]);m.bindings.width=m.voices.map(v=>[v.pan.pan,x=>x*v.sign]);}
  if(id==='voxlevel'){delete m.bindings.threshold;m.bindings.peakThreshold=[m.comp.threshold];m.bindings.levelThreshold=[m.second.threshold];}

 }
 return modules;
}
export function syncStudioEffect(ctx,id,m,s,bpm,now,initial,inputChannels=1){const set=(p,v)=>initial?p.setValueAtTime(v,now):p.setTargetAtTime(v,now,.02);m.output.channelCountMode='explicit';m.output.channelCount=inputChannels;
 if(id==='voxaireq'||id==='voxambience'){syncVoxBC(ctx,id,m,s,now,initial);return;}
 if(id==='circuiteq'||id==='vectoreq'){m.bands.forEach((band,i)=>{const g=id==='circuiteq'?['low','body','presence','air'][i]:'g'+i,f=id==='circuiteq'?['lowFreq','bodyFreq','presenceFreq','airFreq'][i]:'f'+i;set(band.frequency,Math.min(ctx.sampleRate*.45,s[f]));set(band.gain,s[g]);set(band.Q,id==='circuiteq'?.5+Math.abs(s[g])/5:s['q'+i]);});set(m.level.gain,db(s.output));}
 if(['circuitbus','vectorcomp','voxlevel'].includes(id)){set(m.comp.threshold,id==='voxlevel'?s.peakThreshold:s.threshold);set(m.comp.ratio,id==='voxlevel'?6:s.ratio);set(m.comp.attack,id==='voxlevel'?.002:s.attack/1000);set(m.comp.release,id==='voxlevel'?.08:s.release/1000);set(m.comp.knee,id==='voxlevel'?3:s.knee);if(m.second){set(m.second.threshold,s.levelThreshold);set(m.second.ratio,s.ratio);set(m.second.attack,.025);set(m.second.release,s.release/1000);set(m.second.knee,12);}set(m.dry.gain,1-s.mix);set(m.wet.gain,s.mix);set(m.level.gain,db(s.output));}
 if(id==='circuitcolor'){m.shaper.curve=circuitColorCurve(s.drive,s.bias);set(m.tone.frequency,s.tone);set(m.dry.gain,1-s.mix);set(m.wet.gain,s.mix);set(m.level.gain,db(s.output));}
 if(id==='alterdouble'){set(m.hp.frequency,s.focus);set(m.dry.gain,1-s.mix);set(m.wet.gain,s.mix*.5);for(const v of m.voices){const p=alterDoubleVoice(s,v.sign);set(v.delay.delayTime,p.delay);set(v.lfo.frequency,p.rate);set(v.depth.gain,p.depth);set(v.pan.pan,p.pan);}}
 if(id==='alterecho'){set(m.delay.delayTime,alterEchoSeconds(s.beats,bpm));set(m.feedback.gain,s.feedback);set(m.tone.frequency,s.tone);set(m.wet.gain,s.mix);m.control.curve=alterEchoCurve(s.duck);}
 if(id==='alterfilter'){set(m.filter.frequency,s.cutoff);set(m.filter.Q,s.q);set(m.lfo.frequency,alterFilterRate(bpm,s.beats));set(m.depth.gain,s.depth);set(m.dry.gain,1-s.mix);set(m.wet.gain,s.mix);}
 if(id==='vectorlimit')syncVectorLimiter(m.limiter,s,now,initial);
 if(id==='voxtune')for(const key of ['key','scale','speed','amount','mix'])set(m.pitch.parameters.get(key),s[key]);
 if(id==='voxshift')for(const key of ['semitones','mix'])set(m.pitch.parameters.get(key),s[key]);
 if(id==='voxformant'){
   const ratio=2**(s.shift/12);
   set(m.low.frequency,Math.min(ctx.sampleRate*.42,550*ratio));set(m.low.gain,s.shift*.75);
   set(m.mid.frequency,Math.min(ctx.sampleRate*.42,1550*ratio));set(m.mid.gain,s.shift*1.15);
   set(m.high.frequency,Math.min(ctx.sampleRate*.42,4200*ratio));set(m.high.gain,s.brightness);
   set(m.dry.gain,1-s.mix);set(m.wet.gain,s.mix);
 }
 if(id==='voxmicmodel'){
   const [low,presence,air]=micColorGains(s);m.profileOffset=[low-s.proximity,presence-s.presence,air-s.air];
   set(m.low.frequency,Math.min(180,ctx.sampleRate*.45));set(m.presence.frequency,Math.min(3200,ctx.sampleRate*.45));set(m.air.frequency,Math.min(9500,ctx.sampleRate*.45));
   set(m.low.gain,low);set(m.presence.gain,presence);set(m.air.gain,air);
   set(m.dry.gain,s.enabled===false?1:1-s.mix);set(m.wet.gain,s.enabled===false?0:s.mix);
 }
 if(id==='voxwarm'){
   m.shaper.curve=voxWarmCurve(s.drive,s.bias);
   set(m.tone.frequency,Math.min(s.tone,ctx.sampleRate*.45));set(m.dry.gain,s.enabled===false?1:1-s.mix);set(m.wet.gain,s.enabled===false?0:s.mix);set(m.level.gain,db(s.output));
 }
 if(id==='voxdoubler'){
   set(m.dry.gain,s.enabled===false?1:1-s.mix);set(m.wet.gain,s.enabled===false?0:s.mix);
   for(const voice of m.voices){const v=doublerVoice(s,voice.sign);set(voice.delay.delayTime,v.base);set(voice.lfo.frequency,v.rate);set(voice.depth.gain,v.depth);set(voice.pan.pan,v.pan);set(voice.level.gain,v.level);}
 }
 if(id==='voxclean'){set(m.hp.frequency,s.highpass);set(m.band.frequency,s.frequency);set(m.scale.gain,1/32/db(s.threshold));m.control.curve=voxCleanCurve(s.range);set(m.air.gain,s.air);set(m.level.gain,db(s.output));}
}
