import test from 'node:test';
import assert from 'node:assert/strict';
import {groupRecordingChunks,journalBacklogExceeded} from '../dist/recording-recovery.js';
import {wavFloatHeader,encodeFloatGroup} from '../dist/recording-wav-stream.js';
import {createRecordingSignalDiagnostics} from '../dist/recording-signal-diagnostics.js';
import {compareRenderedWav} from '../dist/audio-certification.js';

// Evening record gate: two channels, order, diagnostics and independently
// decoded WAV float export, without a physical microphone.
test('release QA recording: stereo vocal capture survives chunk recovery and WAV encoding',()=>{
 const rate=48000,length=2400;
 const input=[
  Float32Array.from({length},(_,i)=>Math.sin(2*Math.PI*220*i/rate)*.2),
  Float32Array.from({length},(_,i)=>Math.cos(2*Math.PI*330*i/rate)*.18)
 ];
 const blocks=[0,801,1599,length].slice(1).map((end,j)=>{
  const start=[0,801,1599][j];
  return {length:end-start,channels:input.map(ch=>ch.slice(start,end))};
 });
 const diagnostics=createRecordingSignalDiagnostics({sampleRate:rate,channels:2});
 for(const block of blocks)assert.equal(diagnostics.add(block.channels),true);
 const report=diagnostics.snapshot();
 assert.equal(report.invalidBlocks,0);
 assert(report.channelStats.every(ch=>ch.frames===length&&ch.clippedFrames===0&&ch.invalidSamples===0));
 const restored=groupRecordingChunks(blocks,2);
 assert.equal(restored.length,length);
 for(let ch=0;ch<2;ch++)assert.deepEqual(restored.getChannelData(ch),input[ch]);
 const header=wavFloatHeader({sampleRate:rate,channels:2,frames:length});
 const bytes=new Uint8Array(44+length*2*4);
 bytes.set(new Uint8Array(header));
 let offset=44;
 for(const block of blocks){const encoded=new Uint8Array(encodeFloatGroup(block,2));bytes.set(encoded,offset);offset+=encoded.byteLength;}
 const parity=compareRenderedWav({...restored,sampleRate:rate},bytes.buffer,{bits:32});
 assert.equal(parity.valid,true,JSON.stringify(parity));
 assert.equal(parity.mismatches,0);
 assert.equal(parity.clipped,0);
});
test('release QA recording: refuses corrupted PCM capture and journal overflow',()=>{
 const rate=48000;
 assert.equal(journalBacklogExceeded(rate*11,rate*2,rate),true);
 const diagnostic=createRecordingSignalDiagnostics({sampleRate:rate,channels:1});
 assert.equal(diagnostic.add([Float32Array.from([.1,NaN,1.1,0])]),true);
 const report=diagnostic.snapshot().channelStats[0];
 assert.equal(report.invalidSamples,1);
 assert.equal(report.clippedFrames,1);
 assert.throws(()=>groupRecordingChunks([{length:2,channels:[Float32Array.from([.1])]}],1),/incomplet/);
});
