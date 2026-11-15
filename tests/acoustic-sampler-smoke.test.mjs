import test from 'node:test';
import assert from 'node:assert/strict';
import {ACOUSTIC_BANKS,ACOUSTIC_INSTRUMENTS,sampleZones} from '../dist/acoustic.js';
import {acousticVoice} from '../dist/acoustic-audio.js';
import {samplerVoice,sliceSettings} from '../dist/sampler.js';

function param(){return {value:0,setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){},cancelScheduledValues(){},setTargetAtTime(){}};}
function fakeContext(){
 const ctx={currentTime:0,sampleRate:48000,sources:[]};
 const make=kind=>{const n={kind,gain:param(),frequency:param(),Q:param(),playbackRate:{value:1},connect(){},disconnect(){},addEventListener(){},start(...args){this.startArgs=args;this.started=true;},stop(){this.stopped=true;}};
 if(kind==='source')ctx.sources.push(n);return n;};
 ctx.createGain=()=>make('gain');ctx.createBiquadFilter=()=>make('filter');ctx.createBufferSource=()=>make('source');
 ctx.createChannelSplitter=()=>make('split');ctx.createChannelMerger=()=>make('merge');
 ctx.createBuffer=(channels,length,rate)=>({numberOfChannels:channels,length,sampleRate:rate,duration:length/rate,getChannelData(){return new Float32Array(length);}});
 return ctx;
}
const sample={numberOfChannels:1,length:48000,sampleRate:48000,duration:1,getChannelData(){return new Float32Array(48000);}};
test('all 12 acoustic banks declare usable sample zones for C4 and A4',()=>{
 assert.equal(Object.keys(ACOUSTIC_INSTRUMENTS).length,12);
 for(const type of Object.keys(ACOUSTIC_INSTRUMENTS)){
  const bank=ACOUSTIC_BANKS[type];assert.ok(bank?.samples?.length>0,type+' missing manifest');
  for(const note of [60,69])for(const velocity of [.25,.9]){
   const zones=sampleZones(type,note,velocity);
   assert.ok(zones.length>0,type+' has no zone for '+note);
   for(const zone of zones){assert.ok(bank.samples.some(s=>s.file===zone.file),type+' unknown file');assert.ok(Number.isFinite(zone.rate)&&zone.rate>0,type+' invalid pitch rate');assert.ok(zone.weight>0,type+' silent zone');}
  }
 }
});
test('all 12 acoustic instruments schedule buffer sources when their samples are supplied',()=>{
 for(const type of Object.keys(ACOUSTIC_INSTRUMENTS)){
  const ctx=fakeContext(),bank=new Map(ACOUSTIC_BANKS[type].samples.map(s=>[s.file,sample]));
  const voice=acousticVoice(ctx,ctx.createGain(),type,60,.05,.3,{},.8,bank);
  assert.ok(ctx.sources.some(s=>s.started),type+' did not schedule a source');
  assert.ok(voice&&voice.end>.05,type+' voice lifecycle missing');
 }
});
test('EXO SLICE chromatic mode schedules pitched samples and obeys velocity zero',()=>{
 const ctx=fakeContext(),out=ctx.createGain();
 const source=samplerVoice(ctx,out,sample,72,.05,.3,{mode:'chromatic',root:60},{attack:.003,release:.06,output:-6},.8);
 assert.ok(source?.started);
 assert.ok(Math.abs(source.playbackRate.value-2)<1e-9,'one octave should double playback rate');
 const before=ctx.sources.length;
 samplerVoice(ctx,out,sample,60,.05,.3,{mode:'chromatic',root:60},{},0);
 assert.equal(ctx.sources.length,before,'velocity zero must not create a source');
});
test('EXO SLICE slices reject notes outside loaded slices',()=>{
 const ctx=fakeContext(),out=ctx.createGain(),raw={mode:'slices',root:60,markers:[.5]};
 assert.equal(sliceSettings(raw,1).markers.length,3);
 assert.equal(samplerVoice(ctx,out,sample,65,.05,.3,raw,{},1),undefined);
 assert.ok(samplerVoice(ctx,out,sample,61,.05,.3,raw,{},1)?.started);
});
