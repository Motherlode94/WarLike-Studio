import test from 'node:test';
import assert from 'node:assert/strict';
import {measureChannels,normalisationGain,recordingSettings,createRecordingGraph,clampClipGain} from '../dist/recording.js';
import {AudioEngine,dbGain} from '../dist/audio.js';
import {dragRangeValue,clampRangeValue} from '../dist/controls.js';

test('quiet takes reach the target without changing original samples',()=>{
  const input=Float32Array.from({length:1000},(_,i)=>.01*Math.sin(2*Math.PI*i/100)),original=input.slice(),levels=measureChannels([input]),result=normalisationGain(levels);
  assert.ok(Math.abs(result.gainDb-30)<1e-5); // 34 dB would be needed: capped.
  assert.equal(result.limited,true);assert.deepEqual(input,original);
  const normal=normalisationGain(measureChannels([new Float32Array([-.1,.1])]));
  assert.ok(Math.abs(20*Math.log10(.1*dbGain(normal.gainDb))-(-6))<1e-6);
});
test('silence and very low noise are not amplified',()=>{
  for(const input of [new Float32Array(10),new Float32Array([1e-5,-1e-5])]){const r=normalisationGain(measureChannels([input]));assert.equal(r.silent,true);assert.equal(r.gainDb,0);}
});
test('stereo normalization uses the loudest channel',()=>{
  const levels=measureChannels([new Float32Array([.01]),new Float32Array([-.4])]);
  const {gainDb}=normalisationGain(levels);assert.ok(Math.abs(.4*dbGain(gainDb)-dbGain(-6))<1e-6);
});
test('recording and old clip settings have bounded, compatible defaults',()=>{
  assert.deepEqual(recordingSettings(),{gainDb:0,autoLevel:true});assert.deepEqual(recordingSettings({gainDb:100,autoLevel:false}),{gainDb:24,autoLevel:false});assert.equal(clampClipGain(undefined),0);assert.equal(clampClipGain(200),36);assert.equal(clampClipGain(-100),-24);
});
test('microphone gain feeds the recording stream and never the speakers',()=>{
  const connections=[],stopped=[];const node=name=>({name,connect(dest){connections.push([name,dest.name]);},disconnect(){},gain:{value:0,setTargetAtTime(v){this.value=v;}}});
  const source=node('mic'),gain=node('gain'),analyser=node('analyser'),destination=node('recorder');destination.stream={getTracks:()=>[{stop:()=>stopped.push('output')}]};const stream={getTracks:()=>[{stop:()=>stopped.push('input')}]};
  const ctx={currentTime:0,destination:{name:'speakers'},createMediaStreamSource:()=>source,createGain:()=>gain,createAnalyser:()=>analyser,createMediaStreamDestination:()=>destination};
  const graph=createRecordingGraph(ctx,stream,12);assert.ok(Math.abs(gain.gain.value-dbGain(12))<1e-9);assert.equal(graph.stream,destination.stream);assert.deepEqual(connections,[['mic','gain'],['gain','analyser'],['analyser','recorder']]);graph.setGain(6);assert.equal(gain.gain.value,dbGain(6));graph.dispose();graph.dispose();assert.deepEqual(stopped,['input','output']);
});
test('clip gain reaches normal playback, mid-clip resume and WAV scheduling',()=>{
  const clip={id:'clip1',start:0,length:2,audioId:'audio1',gainDb:18},project={bpm:120,bars:4,swing:0,tracks:[{id:'track1',clips:[clip]}]},assets=new Map([['audio1',{buffer:{duration:4}}]]),engine=new AudioEngine(()=>project,()=>assets),input={};
  const calls=[];engine.audioVoice=(...args)=>calls.push(args);engine.channels=new Map([['track1',{input}]]);engine.ctx={};engine.startTime=0;
  engine.scheduleStep({},engine.channels,0,0,true);engine.scheduleStep({},engine.channels,0,0,false);engine.schedulePartialAudio(4);
  assert.equal(calls.length,3);assert.ok(calls.every(args=>args[7]===18&&args[8]==='clip1'));
});
test('mouse knobs have no click jump, vertical drag, shift precision and limits',()=>{
  assert.equal(dragRangeValue(.5,0,0,0,1,.001),.5);assert.equal(dragRangeValue(.5,0,-90,0,1,.001),1);assert.equal(dragRangeValue(.5,0,-90,0,1,.001,true),.55);assert.equal(dragRangeValue(.5,0,900,0,1,.001),0);assert.equal(clampRangeValue(.126,0,1,.01),.13);
});
test('takes starting between grid lines play and export with the correct gain',()=>{
  const clip={id:'clip1',start:4.5/16,length:1,audioId:'audio1',gainDb:12},project={bpm:120,bars:4,swing:0,tracks:[{id:'track1',clips:[clip]}]},engine=new AudioEngine(()=>project,()=>new Map([['audio1',{buffer:{duration:4}}]]));
  const calls=[];engine.audioVoice=(...args)=>calls.push(args);engine.channels=new Map([['track1',{input:{}}]]);engine.ctx={};engine.startTime=0;
  engine.scheduleStep({},engine.channels,4,1,false);assert.equal(calls.length,1);assert.equal(calls[0][3],1.0625);assert.equal(calls[0][7],12);
  engine.schedulePartialAudio(4.2);assert.equal(calls.length,2);assert.equal(calls[1][3],4.5*.125);
});
