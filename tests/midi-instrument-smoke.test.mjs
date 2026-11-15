import test from 'node:test';
import assert from 'node:assert/strict';
import {INSTRUMENTS,pluginDefaults} from '../dist/plugins.js';
import {AudioEngine,midiHz} from '../dist/audio.js';
import {voiceSettings} from '../dist/instrument-voices.js';

function parameter(value=0){return {value,setValueAtTime(v){this.value=v;},linearRampToValueAtTime(v){this.value=v;},exponentialRampToValueAtTime(v){this.value=v;},setTargetAtTime(v){this.value=v;}};}
function context(){
 const ctx={currentTime:0,sampleRate:48000,sources:[]};
 const node=kind=>{const n={kind,connect(){},disconnect(){},addEventListener(){},start(){this.started=true;},stop(){this.stopped=true;}};
 for(const k of ['gain','frequency','detune','Q','pan','delayTime'])n[k]=parameter();
 if(kind==='createOscillator'||kind==='createBufferSource')ctx.sources.push(n);
 return n;};
 for(const kind of ['createOscillator','createGain','createBiquadFilter','createBufferSource','createStereoPanner','createDelay','createWaveShaper'])ctx[kind]=()=>node(kind);
 ctx.createBuffer=(channels,length,rate)=>{const data=new Float32Array(length);return {duration:length/rate,length,sampleRate:rate,numberOfChannels:channels,copyToChannel(values){data.set(values);},getChannelData(){return data;}};};
 return ctx;
}
test('phase 3: all 20 instrument definitions have finite MIDI-safe controls',()=>{
 assert.equal(Object.keys(INSTRUMENTS).length,20);
 for(const [id,def] of Object.entries(INSTRUMENTS)){
  const keys=new Set();
  for(const control of def.controls){assert.ok(!keys.has(control.key),id+' duplicated '+control.key);keys.add(control.key);assert.ok([control.min,control.max,control.default].every(Number.isFinite),id+' invalid '+control.key);assert.ok(control.default>=control.min&&control.default<=control.max,id+' out-of-range '+control.key);}
  const defaults=pluginDefaults(id);assert.ok(defaults.instrument,id+' has no state');
 }
 assert.ok(Math.abs(midiHz(69)-440)<1e-9);
 assert.ok(Math.abs(midiHz(60)-261.625565)<.001);
});
test('phase 3: all procedural pitched instruments schedule a sound source',()=>{
 const engine=new AudioEngine(()=>({masterVolume:0}),()=>new Map());
 for(const type of ['bass','keys','lead','pad','pluck','exo']){
  const ctx=context(),out=ctx.createGain();
  engine.synth(ctx,out,type,60,.01,.3,false,pluginDefaults(type).instrument,.8);
  assert.ok(ctx.sources.some(s=>s.started),type+' scheduled no source');
 }
});
test('phase 3: velocity zero silences procedural pitched voices',()=>{
 const engine=new AudioEngine(()=>({masterVolume:0}),()=>new Map());
 for(const type of ['bass','keys','lead','pad','pluck']){
  const ctx=context();engine.synth(ctx,ctx.createGain(),type,60,.01,.3,false,voiceSettings(type),0);
  assert.equal(ctx.sources.filter(s=>s.started).length,0,type+' ignores zero velocity');
 }
});
test('phase 3: drum kick schedules a playable source without undefined MIDI variables',()=>{
 const ctx=context(),engine=new AudioEngine(()=>({masterVolume:0}),()=>new Map());
 engine.drum(ctx,ctx.createGain(),'kick',.01,false,{punch:.8,decay:.3},.7);
 assert.ok(ctx.sources.some(s=>s.started),'kick source missing');
});
