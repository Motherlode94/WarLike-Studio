import test from 'node:test';
import assert from 'node:assert/strict';
import {wavFloatHeader,encodeFloatGroup} from '../dist/recording-wav-stream.js';

test('WAV float stereo interleaves correctly with a complete 44-byte header',()=>{
 const header=wavFloatHeader({sampleRate:48000,channels:2,frames:3});
 const v=new DataView(header);
 assert.equal(v.getUint32(4,true),60);
 assert.equal(v.getUint16(20,true),3);
 assert.equal(v.getUint16(22,true),2);
 assert.equal(v.getUint32(24,true),48000);
 assert.equal(v.getUint32(40,true),24);
 const group={length:3,channels:[Float32Array.from([.1,.2,.3]),Float32Array.from([.4,.5,.6])]};
 const view=new DataView(encodeFloatGroup(group,2));
 assert.deepEqual(Array.from({length:6},(_,i)=>view.getFloat32(i*4,true)),
   [...Float32Array.from([.1,.4,.2,.5,.3,.6])]);
});

test('30 and 60 minute synthetic duration headers have correct byte counts',()=>{
 for(const minutes of [30,60]){
   const frames=48000*60*minutes;
   const h=new DataView(wavFloatHeader({sampleRate:48000,channels:2,frames}));
   assert.equal(h.getUint32(40,true),frames*2*4);
   assert.equal(h.getUint32(4,true),frames*2*4+36);
 }
});

test('WAV standard 4GB limit and incomplete blocks are rejected before export',()=>{
 assert.throws(()=>wavFloatHeader({sampleRate:48000,channels:2,frames:600000000}),/limite/);
 assert.throws(()=>encodeFloatGroup({length:2,channels:[Float32Array.from([1])]},1),/incomplet/);
 assert.throws(()=>encodeFloatGroup({length:1,channels:[]},1),/incomplet/);
});
