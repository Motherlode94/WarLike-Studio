import test from 'node:test';import assert from 'node:assert/strict';import {measureLoudness} from '../dist/audio-loudness.js';
const fs=48000;const make=(fn,seconds=4)=>{const x=Float32Array.from({length:fs*seconds},(_,i)=>fn(i));return {sampleRate:fs,length:x.length,numberOfChannels:2,getChannelData:()=>x};};
test('silence gates out',()=>{const m=measureLoudness(make(()=>0,1));assert.equal(m.integrated,-Infinity);assert.equal(m.truePeakDb,-Infinity);});
test('stereo 1 kHz reference and gain scaling',()=>{const tone=i=>Math.sin(2*Math.PI*1000*i/fs);const a=measureLoudness(make(i=>.1*tone(i))),b=measureLoudness(make(i=>.2*tone(i)));assert.ok(Math.abs(a.integrated+20)<.4);assert.ok(Math.abs(b.integrated-a.integrated-6.0206)<.01);assert.ok(Number.isFinite(a.shortTermMax));});
test('intersample peak detected',()=>{const m=measureLoudness(make(i=>.9*Math.sin(Math.PI*i/2+Math.PI/4),1));assert.ok(m.truePeakDb>20*Math.log10(.9/Math.sqrt(2))+1);});
