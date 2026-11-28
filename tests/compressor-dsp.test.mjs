import {AudioEngine} from '../dist/audio.js';
import test from 'node:test';import assert from 'node:assert/strict';
import {StereoCompressor,compressorCurve} from '../dist/compressor-dsp.js';
import {compressorCurve as displayedCurve} from '../dist/vector-comp-face.js';
import {dynamicsFrames,dynamicsLatency} from '../dist/dynamics-timing.js';
import {moduleLatency} from '../dist/master-rack-model.js';
import {trackLatency} from '../dist/studio-model.js';
test('the display and DSP share the exact soft-knee transfer law',()=>{
 assert.equal(displayedCurve,compressorCurve);
 assert.equal(compressorCurve(-30,-24,4,0),-30);assert.equal(compressorCurve(-12,-24,4,0),-21);
 assert.equal(compressorCurve(-24,-24,4,6),-24.5625);
 for(const x of [-60,-27,-24,-21,0])assert.equal(compressorCurve(x,-24,1,12),x);
 const epsilon=1e-5;
 for(const x of [-27,-21]){const before=compressorCurve(x-epsilon,-24,4,6),after=compressorCurve(x+epsilon,-24,4,6),slope=(after-before)/(2*epsilon);assert.ok(Math.abs(slope-(x===-27?1:.25))<1e-5);}
});
for(const rate of [44100,48000,96000]){
 test(`unity, stereo ratio and exact compensation at ${rate} Hz`,()=>{
  const c=new StereoCompressor(rate),input=Float32Array.from({length:rate/3},(_,i)=>.01*Math.sin(i*.051));
  for(let i=0;i<input.length;i++){c.process(input[i],-input[i]/4,-18,4,6);assert.equal(c.left,i<c.delayFrames?0:input[i-c.delayFrames]);assert.ok(c.right===-c.left/4);}
  assert.equal(c.reduction,0);assert.equal(c.delayFrames,dynamicsFrames(rate));
  for(const id of ['glue','press','vectorcomp','circuitbus'])assert.equal(moduleLatency(id,rate),dynamicsLatency(rate));
  assert.equal(moduleLatency('voxlevel',rate),dynamicsLatency(rate,2));
  const t={inserts:['glue','vectorcomp','voxlevel'],effects:{glue:{enabled:true},vectorcomp:{enabled:true},voxlevel:{enabled:true}}};
  assert.ok(Math.abs(trackLatency(t,rate)-dynamicsLatency(rate,4))<1e-12);
 });
 test(`attack time is the documented 63.2 percent exponential constant at ${rate} Hz`,()=>{
  const c=new StereoCompressor(rate),attack=.02,n=Math.round(rate*attack);
  for(let i=0;i<n;i++)c.process(1,.25,-24,4,0,attack,.1);
  assert.ok(Math.abs(c.reduction+18*(1-Math.exp(-n/(rate*attack))))<1e-9);
  assert.equal(c.right,c.left/4);
 });
 test(`steady gain agrees with the curve, without automatic makeup, at ${rate} Hz`,()=>{
  for(const level of [-40,-27,-24,-21,-6]){
   const c=new StereoCompressor(rate),input=Math.fround(10**(level/20));
   for(let i=0;i<rate/4;i++)c.process(input,input/4,-24,4,6,.001,.1);
   const measured=20*Math.log10(c.left),expected=compressorCurve(20*Math.log10(input),-24,4,6);
   assert.ok(Math.abs(measured-expected)<1e-8);assert.ok(c.gain<=1);assert.equal(c.right,c.left/4);
  }
 });
}
test('release follows the smooth decoupled envelope on a lower plateau',()=>{
 const rate=48000,c=new StereoCompressor(rate),attack=.005,release=.1;
 for(let i=0;i<rate;i++)c.process(1,1,-24,4,0,attack,release);
 const n=9600,a=Math.exp(-1/(rate*attack)),r=Math.exp(-1/(rate*release));
 for(let i=0;i<n;i++)c.process(.001,.001,-24,4,0,attack,release);
 const expected=18*(a**n+(1-a)*r*(a**n-r**n)/(a-r));
 assert.ok(Math.abs(-c.reduction-expected)<1e-8);
});
test('independent instances, parameter changes, nonfinite inputs and recovery remain bounded',()=>{
 const heavy=new StereoCompressor(48000),quiet=new StereoCompressor(48000);
 for(let i=0;i<48000;i++){const input=Math.fround(Math.sin(i*.03));heavy.process(input,input/4,-40,10,6,.001,.05);quiet.process(input,input/4,0,1,0,.1,1);assert.equal(quiet.gain,1);assert.ok(heavy.gain<=1&&heavy.gain>0);}
 assert.ok(heavy.reduction<-10);assert.equal(quiet.reduction,0);
 for(let i=0;i<48000*3;i++)heavy.process(0,0,-40,10,6,.001,.05);
 assert.equal(heavy.gain,1);
 for(const x of [NaN,Infinity,-Infinity]){heavy.process(x,x);assert.ok(Number.isFinite(heavy.left));}
});

test('offline renders do not schedule muted acoustic instruments whose banks were not prepared',()=>{
 const clip=()=>({id:'phrase',start:0,length:1,notes:[{midi:60,step:0,len:4,velocity:.8}]}),p={bpm:120,bars:1,swing:0,masterVolume:0,tracks:[{id:'muted',type:'piano',mute:true,clips:[clip()]},{id:'playing',type:'keys',clips:[clip()]}]};
 const engine=new AudioEngine(()=>p,()=>new Map()),played=[];
 engine.synth=(ctx,input)=>played.push(input);engine.scheduleStep({},new Map([['muted',{input:'muted'}],['playing',{input:'playing'}]]),0,0,false);
 assert.deepEqual(played,['playing']);
});
