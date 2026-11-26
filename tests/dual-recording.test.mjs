import test from 'node:test';
import assert from 'node:assert/strict';
import {armedRecordingTracks,captureChannelMode,extractRecordedChannel,recordingInputConstraints,validateRecordingInputChannels} from '../dist/recording.js';

const track=(id,channel,armed=true)=>({id,name:id,type:'audio',recordArm:armed,recordInput:channel,clips:[]});
test('arming accepts a pair with distinct physical inputs',()=>{
 const list=armedRecordingTracks({tracks:[track('lead','1'),track('room','2'),track('bus','2',false)]});
 assert.deepEqual(list.map(x=>x.channel),['1','2']);
 assert.equal(captureChannelMode(list),'stereo');
});
test('unarmed audio track is ignored',()=>{
 assert.deepEqual(armedRecordingTracks({tracks:[track('one','1',false)]}),[]);
 assert.equal(captureChannelMode([],'stereo'),'stereo');
});
test('duplicate hardware inputs are rejected before acquiring the mic',()=>{
 assert.throws(()=>armedRecordingTracks({tracks:[track('one','1'),track('two','1')]}),/distincte/);
});
test('more than two armed inputs are rejected',()=>{
 assert.throws(()=>armedRecordingTracks({tracks:[track('one','1'),track('two','2'),track('three','1')]}),/deux pistes armées/i);
});
test('mono track takes are sample aligned from same stereo buffer',()=>{
 const samples=[[.1,.2,.3],[.4,.5,.6]];
 const buffer={numberOfChannels:2,length:3,sampleRate:48000,getChannelData:i=>Float32Array.from(samples[i])};
 const ctx={createBuffer:(_,length,sampleRate)=>{const data=new Float32Array(length);return {numberOfChannels:1,length,sampleRate,getChannelData:()=>data};}};
 const a=extractRecordedChannel(ctx,buffer,'1');
 const b=extractRecordedChannel(ctx,buffer,'2');
 assert.deepEqual([...a.getChannelData(0)],[...Float32Array.from(samples[0])]);
 assert.deepEqual([...b.getChannelData(0)],[...Float32Array.from(samples[1])]);
 assert.equal(a.length,b.length);assert.equal(a.sampleRate,b.sampleRate);
});
test('requesting nonexistent input fails, rather than silently recording silence',()=>{
 const buffer={numberOfChannels:1,length:3,sampleRate:44100,getChannelData:()=>new Float32Array(3)};
 assert.throws(()=>extractRecordedChannel({},buffer,'2'),/indisponible/);
});

test('IN 2 mono requests two physical channels even with one armed track',()=>{
 const constraints=recordingInputConstraints({deviceId:'interface-1',channel:'1'},[{channel:'2'}]);
 assert.equal(constraints.audio.channelCount.ideal,2);
 assert.deepEqual(constraints.audio.deviceId,{exact:'interface-1'});
 assert.equal(validateRecordingInputChannels({channelCount:2},[{channel:'2'}]),'2');
});

test('duo and stereo previews request the exact same two-channel constraint',()=>{
 const duo=[{channel:'1'},{channel:'2'}];
 assert.equal(recordingInputConstraints({channel:'1'},duo).audio.channelCount.ideal,2);
 assert.equal(recordingInputConstraints({channel:'stereo'}).audio.channelCount.ideal,2);
 assert.equal(validateRecordingInputChannels({channelCount:2},duo),'stereo');
});
test('missing hardware second channel is rejected rather than recording silence',()=>{
 assert.throws(()=>validateRecordingInputChannels({channelCount:1},[{channel:'2'}]),/Entrée 2 indisponible/);
 assert.throws(()=>validateRecordingInputChannels({channelCount:1},[{channel:'1'},{channel:'2'}]),/Entrée 2 indisponible/);
 assert.equal(validateRecordingInputChannels({channelCount:1},[{channel:'1'}]),'1');
});

test('S04.1 malformed or incomplete capture fails before allocating a mono take',()=>{
 const ctx={createBuffer(){throw Error('unexpected allocation');}};
 const buffer={numberOfChannels:2,length:3,sampleRate:48000,getChannelData:()=>new Float32Array(2)};
 assert.throws(()=>extractRecordedChannel(ctx,buffer,'3'),/invalide/);
 assert.throws(()=>extractRecordedChannel(ctx,buffer,'2'),/incomplet/);
 assert.throws(()=>extractRecordedChannel(ctx,{...buffer,sampleRate:NaN},'1'),/invalide/);
});
