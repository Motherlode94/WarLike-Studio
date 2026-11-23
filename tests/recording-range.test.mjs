import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';
import {recordingRange,recordingWindow,rangePlacement} from '../dist/recording-range.js';
import {recordingSettings} from '../dist/recording.js';
import {recordingPlacement,createPcmCapture} from '../dist/pcm-capture.js';
import {AudioEngine,emptyProject} from '../dist/audio.js';
test('old projects keep unbounded capture and range settings survive normalization',()=>{
 assert.equal(recordingRange(),null);assert.equal(recordingWindow(undefined,{bars:16,bpm:120}),null);
 const range={enabled:true,start:4,end:8};assert.deepEqual(recordingSettings({range}).range,range);assert.deepEqual(recordingRange({...range,enabled:false}),{...range,enabled:false});
 for(const value of [{start:-1,end:4},{start:4,end:4},{start:0,end:Infinity},{start:0,end:2049},{start:NaN,end:4}])assert.throws(()=>recordingRange(value),/invalide/);
});
test('active ranges must fit the song and the existing twenty-minute capture limit',()=>{
 assert.equal(recordingWindow({enabled:true,start:4,end:8},{bars:16,bpm:120}).seconds,8);
 assert.equal(recordingWindow({enabled:false,start:4,end:32},{bars:16,bpm:120}),null);
 assert.throws(()=>recordingWindow({enabled:true,start:4,end:32},{bars:16,bpm:120}),/dépasse/);
 assert.throws(()=>recordingWindow({enabled:true,start:0,end:2048},{bars:2048,bpm:40}),/20 minutes/);
});
test('latency compensation stays inside both bounds without changing the source',()=>{
 const range={start:4,end:8};
 const early=rangePlacement(recordingPlacement(4,8,120,100),range,120);assert.equal(early.start,4);assert.ok(Math.abs(early.sourceOffset-.1)<1e-10);assert.ok(early.start+early.length<=8);
 const late=rangePlacement(recordingPlacement(4,8,120,-100),range,120);assert.ok(late.start>4);assert.equal(late.sourceOffset,0);assert.equal(late.start+late.length,8);
 const manual=recordingPlacement(4,.25,120,0);assert.deepEqual(rangePlacement(manual,range,120),manual);assert.equal(rangePlacement(manual,null,120),manual);
});
async function processor(mode='stereo'){
 let Processor;const messages=[];const ctx={AudioWorkletProcessor:class{constructor(){this.port={postMessage:m=>messages.push(m)};}},sampleRate:48000,currentFrame:0,registerProcessor:(name,type)=>{Processor=type;},Float32Array,Math};
 runInNewContext(await readFile(new URL('../dist/record-worklet.js',import.meta.url),'utf8'),ctx);
 return {ctx,messages,rec:new Processor({processorOptions:{channel:mode}})};
}
test('the worklet cuts stereo at exact frame bounds inside processing blocks',async()=>{
 const {ctx,rec,messages}=await processor();rec.port.onmessage({data:{type:'start',time:37/48000,endTime:301/48000}});
 for(let base=0;base<512;base+=128){ctx.currentFrame=base;const left=Float32Array.from({length:128},(_,i)=>base+i),right=Float32Array.from(left,x=>-x);const output=new Float32Array(128).fill(1);rec.process([[left,right]],[[output]]);assert.ok(output.every(v=>v===0));}
 const chunks=messages.filter(m=>m.type==='chunk');assert.equal(chunks.length,1);assert.equal(chunks[0].channels[0].length,264);assert.equal(chunks[0].channels[0][0],37);assert.equal(chunks[0].channels[0].at(-1),300);assert.equal(chunks[0].channels[1].at(-1),-300);
 assert.equal(messages.filter(m=>m.type==='done').length,1);assert.equal(messages.at(-1).reason,'range');assert.equal(messages.at(-1).frames,264);
 rec.port.onmessage({data:{type:'stop'}});assert.equal(messages.filter(m=>m.type==='done').length,1);
});
test('an exact block boundary flushes once, while manual stop preserves partial PCM',async()=>{
 const first=await processor('1');first.rec.port.onmessage({data:{type:'start',time:0,endTime:128/48000}});const input=new Float32Array(128).fill(.25);
 first.rec.process([[input]],[[new Float32Array(128)]]);first.ctx.currentFrame=128;first.rec.process([],[[new Float32Array(128)]]);assert.equal(first.messages.at(-1).frames,128);assert.equal(first.messages.at(-1).reason,'range');
 const second=await processor('2');second.rec.port.onmessage({data:{type:'start',time:0,endTime:2}});second.rec.process([[input,new Float32Array(128).fill(-.5)]],[[new Float32Array(128)]]);second.rec.port.onmessage({data:{type:'stop'}});assert.equal(second.messages.at(-1).reason,'stop');assert.equal(second.messages.at(-1).frames,128);assert.equal(second.messages[0].channels[0][0],-.5);
});
test('capture completes a bounded take once and rejects reversed or empty frame ranges',async()=>{
 const original=globalThis.AudioWorkletNode;let node,completed=0;const sent=[];
 globalThis.AudioWorkletNode=class{constructor(){node=this;this.port={postMessage:m=>sent.push(m),close(){}};}connect(){}disconnect(){}};
 try{
  const ctx={sampleRate:48000,destination:{},audioWorklet:{addModule:async()=>{}}},input={connect(){},disconnect(){}};
  const capture=await createPcmCapture(ctx,input,{retainChunks:false,onComplete:()=>completed++});
  assert.throws(()=>capture.start(1,{endTime:.5}),/invalides/);assert.throws(()=>capture.start(1,{endTime:1+1e-9}),/invalides/);
  capture.start(1,{endTime:2});assert.deepEqual(sent[0],{type:'start',time:1,endTime:2});node.port.onmessage({data:{type:'chunk',channels:[new Float32Array(12)]}});node.port.onmessage({data:{type:'done',frames:12,reason:'range'}});node.port.onmessage({data:{type:'done',reason:'range'}});
  assert.equal(completed,1);assert.equal(await capture.stop(),null);assert.equal(sent.length,1,'already completed range needs no second stop');
 }finally{if(original===undefined)delete globalThis.AudioWorkletNode;else globalThis.AudioWorkletNode=original;}
});
test('bounded recording does not extend the song or stop early at scheduler lookahead',()=>{
 const p=emptyProject(),e=new AudioEngine(()=>p,()=>new Map());e.ctx={currentTime:10};e.loop=false;e.playing=true;e.recordingTrackId=p.tracks[0].id;e.recordingEndStep=256;e.playStartAt=9;e.startTime=10.1-256*e.stepDuration;e.scheduledStep=256;
 let ended=0;e.onEnded=()=>ended++;e.scheduler();assert.equal(e.playing,true);assert.equal(p.bars,16);assert.equal(ended,0);
 e.ctx.currentTime=10.11;e.scheduler();assert.equal(e.playing,false);assert.equal(p.bars,16);assert.equal(ended,1);
});
