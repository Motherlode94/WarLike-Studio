import test from 'node:test';
import assert from 'node:assert/strict';
import {StereoDeesser} from '../dist/deesser-dsp.js';
import {effectLatency,dynamicsFrames} from '../dist/dynamics-timing.js';
import {moduleLatency} from '../dist/master-rack-model.js';
import {trackLatency} from '../dist/studio-model.js';
for(const rate of [44100,48000,96000]){
 test('complementary de-esser reconstructs under-threshold audio and automated cutoff at '+rate,()=>{
  const d=new StereoDeesser(rate),input=Float32Array.from({length:rate/2},(_,i)=>.001*(Math.sin(i*.17)+Math.sin(i*1.23)));
  let error=0,stereo=0;
  for(let i=0;i<input.length;i++){
   d.process(input[i],input[i]/4,-6,12,2,.001,.075,3500+7000*i/input.length);
   error=Math.max(error,Math.abs(d.left-(input[i-d.delayFrames]||0)));stereo=Math.max(stereo,Math.abs(d.right-d.left/4));
  }
  assert.ok(error<2e-10,{error});assert.ok(stereo<1e-10,{stereo});assert.equal(d.reduction,0);
 });
 test('de-esser attenuates sibilance while retaining low-frequency content at '+rate,()=>{
  function gain(f){const d=new StereoDeesser(rate);let input=0,output=0;for(let i=0;i<rate;i++){const x=.5*Math.sin(2*Math.PI*f*i/rate);d.process(x,x/4,-24,8,2,.001,.075,6500);if(i>rate/2){input+=x*x;output+=d.left*d.left;}}return 10*Math.log10(output/input);}
  assert.ok(gain(200)>-.1);assert.ok(gain(12000)<-5);
 });
 test('all six modules declare identical track/rack delays at '+rate,()=>{
  for(const id of ['exostrip','hardibus','hardivocalcomp','hardideess','elianaembrace','elianaguard']){
   const frames=dynamicsFrames(rate)*(id==='elianaguard'?2:1),delay=frames/rate;
   assert.equal(effectLatency(id,rate),delay);assert.equal(moduleLatency(id+'__copy',rate),delay);
   assert.equal(trackLatency({inserts:[id],effects:{[id]:{enabled:true}}},rate),delay);
   assert.equal(trackLatency({inserts:[id],effects:{[id]:{enabled:false}}},rate),0);
  }
 });
}
test('de-esser recovers from nonfinite input and repeated cutoff extremes',()=>{
 const d=new StereoDeesser(48000);
 for(let i=0;i<48000;i++){d.process(i%3?Math.sin(i*.3):NaN,i%7?Math.cos(i*.2):Infinity,-30,12,2,.001,.075,i%2?Infinity:0);assert.ok(Number.isFinite(d.left)&&Number.isFinite(d.right));}
});
