import test from 'node:test';
import assert from 'node:assert/strict';
import {VectorLimiter,limiterLatency} from '../dist/vector-limit-dsp.js';
import {moduleLatency,masterRackLatency} from '../dist/master-rack-model.js';
import {trackLatency,compensationDelays} from '../dist/studio-model.js';

for (const rate of [44100,48000,96000]) {
 test(`VECTOR LIMIT: unity below ceiling and exact latency at ${rate} Hz`, () => {
  const limiter = new VectorLimiter(rate), input = Float32Array.from({length:rate / 4}, (_,i) => .1 * Math.sin(i * .029));
  for (let i = 0; i < input.length; i++) {
   limiter.process(input[i], -input[i] / 4);
   assert.equal(limiter.left, i < limiter.delayFrames ? 0 : input[i - limiter.delayFrames]);
   assert.equal(limiter.right, i < limiter.delayFrames ? 0 : -input[i - limiter.delayFrames] / 4);
  }
  assert.equal(limiter.safetyEvents, 0);
  assert.equal(moduleLatency('vectorlimit',rate),limiterLatency(rate));
  assert.equal(moduleLatency('peak',rate),limiterLatency(rate));
  const track={id:'a',inserts:['vectorlimit'],effects:{vectorlimit:{enabled:true}}};
  assert.equal(trackLatency(track,rate),limiterLatency(rate));
  assert.equal(compensationDelays([track,{id:'b'}],rate).get('b'),limiterLatency(rate));
  assert.equal(masterRackLatency({...track,vectorlimit:{enabled:true}},rate),limiterLatency(rate));
 });
 test(`VECTOR LIMIT: sample ceiling, transients and stereo linking at ${rate} Hz`, () => {
  const limiter = new VectorLimiter(rate), ceiling = 10 ** (-6 / 20);
  for (let i = 0; i < rate; i++) {
   const left = Math.fround(i % 599 === 0 ? -12 : 4 * Math.sin(i * .137));
   limiter.process(left, left / 4, -6, 100);
   assert.ok(Math.abs(limiter.left) <= ceiling + 1e-7);
   assert.equal(limiter.right,limiter.left / 4);
  }
  assert.equal(limiter.safetyEvents,0,'static limiting must come from anticipation, not the automation safety gain');
 });
}

test('VECTOR LIMIT: falling automated ceiling bounds already delayed audio', () => {
 const limiter = new VectorLimiter(48000);
 for (let i=0;i<48000;i++) {
  const ceiling = i < 24000 ? -.1 : -12;
  limiter.process(Math.fround(.9 * Math.sin(i * .06)),.1,ceiling,50);
  assert.ok(Math.max(Math.abs(limiter.left),Math.abs(limiter.right)) <= 10 ** (ceiling / 20) + 1e-7);
 }
});

test('VECTOR LIMIT: release changes recovery, instances stay independent and silence recovers unity', () => {
 const fast = new VectorLimiter(48000), slow = new VectorLimiter(48000), quiet = new VectorLimiter(48000);
 let fastGain, slowGain;
 for (let i=0;i<48000*4;i++) {
  const input = i < 1000 ? 4 : 0;
  fast.process(input,0,-1,20); slow.process(input,0,-1,500); quiet.process(.1,.025);
  if(i===12000){fastGain=fast.gain;slowGain=slow.gain;}
 }
 assert.ok(fastGain>slowGain+.3);assert.ok(fast.gain>.9999);assert.equal(quiet.gain,1);
 for(const input of [NaN,Infinity,-Infinity]){fast.process(input,input);assert.ok(Number.isFinite(fast.left));}
});
