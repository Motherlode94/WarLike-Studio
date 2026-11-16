import test from 'node:test';import assert from 'node:assert/strict';
import {inspectRecordedTake} from '../dist/recording.js';
function buffer(channels,sampleRate=48000){return {numberOfChannels:channels.length,length:channels[0].length,sampleRate,getChannelData:i=>channels[i]}}
test('valid mono and stereo takes pass without altering their samples',()=>{
 const a=Float32Array.from({length:48000},(_,i)=>.2*Math.sin(2*Math.PI*i/80)),copy=a.slice();
 const mono=inspectRecordedTake(buffer([a]));assert.equal(mono.channels,1);assert.ok(Math.abs(mono.duration-1)<.00001);assert.deepEqual(mono.warnings,[]);
 const stereo=inspectRecordedTake(buffer([a,a]));assert.equal(stereo.channels,2);assert.deepEqual(a,copy);
});
test('silence warns but remains usable and clipped inputs warn',()=>{
 assert.match(inspectRecordedTake(buffer([new Float32Array(5000)])).warnings.join(' '),/silencieux/);
 const clipped=new Float32Array(10000).fill(1);
 assert.match(inspectRecordedTake(buffer([clipped])).warnings.join(' '),/écrêtage/);
});
test('corrupt or unsupported audio is rejected before WAV encoding',()=>{
 const bad=Float32Array.from([0,NaN,.2]);assert.throws(()=>inspectRecordedTake(buffer([bad])),/corrompu/);
 assert.throws(()=>inspectRecordedTake(buffer([new Float32Array(0)])),/invalide/);
 assert.throws(()=>inspectRecordedTake(buffer([new Float32Array(3)],4000)),/invalide/);
 assert.throws(()=>inspectRecordedTake(buffer([new Float32Array(3),new Float32Array(2)])),/incomplète/);
 assert.throws(()=>inspectRecordedTake(buffer(Array.from({length:3},()=>new Float32Array(3)))),/invalide/);
});
test('processing cost is bounded on longer takes',()=>{
 const audio=new Float32Array(48000*30).fill(.1),out=inspectRecordedTake(buffer([audio]));
 assert.ok(out.examinedSamples<=120000);assert.equal(out.sampled,true);
});
test('workflow checks before committing recorded clips',async()=>{
 const {readFileSync}=await import('node:fs');
 const code=readFileSync(new URL('../dist/studio-workflow.js',import.meta.url),'utf8');
 const guard=code.indexOf('const quality=inspectRecordedTake(buffer);'),mutation=code.indexOf('assets().set(item.id',guard);
 assert.ok(guard>=0&&mutation>guard);
 assert.ok(code.includes('item.quality.warnings.length'));
});
