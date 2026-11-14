import test from 'node:test';
import assert from 'node:assert/strict';
import {createPcmCapture} from '../dist/pcm-capture.js';

test('PCM capture merges multiple stereo worklet chunks in sample order',async()=>{
 const previous=globalThis.AudioWorkletNode;
 let instance;
 class FakeWorklet {
   constructor(){
     instance=this;
     this.port={postMessage:message=>{
       if(message.type==='stop')queueMicrotask(()=>this.port.onmessage({data:{type:'done'}}));
     },close(){}};
   }
   connect(){}
   disconnect(){}
 }
 globalThis.AudioWorkletNode=FakeWorklet;
 try {
   const ctx={sampleRate:48000,audioWorklet:{addModule:async()=>{}},destination:{},
     createBuffer:(channels,length,sampleRate)=>{
       const data=Array.from({length:channels},()=>new Float32Array(length));
       return {numberOfChannels:channels,length,sampleRate,getChannelData:i=>data[i]};
     }};
   const input={connect(){},disconnect(){}};
   const capture=await createPcmCapture(ctx,input,{channel:'stereo'});
   capture.start(0);
   for(const chunk of [
     [[.1,.2],[.3,.4]],
     [[.5],[.6]]
   ])instance.port.onmessage({data:{type:'chunk',channels:chunk.map(c=>Float32Array.from(c))}});
   assert.equal(capture.frames,3);
   const buffer=await capture.stop();
   assert.equal(buffer.length,3);
   assert.deepEqual([...buffer.getChannelData(0)],[...Float32Array.from([.1,.2,.5])]);
   assert.deepEqual([...buffer.getChannelData(1)],[...Float32Array.from([.3,.4,.6])]);
   await assert.rejects(()=>capture.stop(),/déjà terminée/);
 }finally{
   if(previous===undefined)delete globalThis.AudioWorkletNode;
   else globalThis.AudioWorkletNode=previous;
 }
});

test('PCM recorder salvages completed blocks if the audio worklet fails',async()=>{
 const previous=globalThis.AudioWorkletNode;let instance,errorReceived;
 class FaultyWorklet{
   constructor(){instance=this;this.port={postMessage(){},close(){}};}
   connect(){}disconnect(){}
 }
 globalThis.AudioWorkletNode=FaultyWorklet;
 try{
   const ctx={sampleRate:48000,audioWorklet:{addModule:async()=>{}},destination:{},
     createBuffer:(channels,length,sampleRate)=>{
       const data=Array.from({length:channels},()=>new Float32Array(length));
       return {length,numberOfChannels:channels,sampleRate,getChannelData:i=>data[i]};
     }};
   const input={connect(){},disconnect(){}};
   const capture=await createPcmCapture(ctx,input,{channel:'1',onError:e=>{errorReceived=e;}});
   capture.start(0);
   instance.port.onmessage({data:{type:'chunk',channels:[Float32Array.from([.25,.5,.75])]}});
   instance.onprocessorerror();
   assert.match(errorReceived.message,/interrompu/);
   const partial=await capture.stop();
   assert.equal(partial.length,3);
   assert.deepEqual([...partial.getChannelData(0)],[.25,.5,.75]);
 }finally{
   if(previous===undefined)delete globalThis.AudioWorkletNode;
   else globalThis.AudioWorkletNode=previous;
 }
});
