import test from 'node:test';
import assert from 'node:assert/strict';
import {BEAT_DEMOS,createBeatDemoSession} from '../dist/beat-demo-sessions.js';
import {NEW_GENRE_DEMOS,createGenreDemoSession} from '../dist/genre-demo-sessions.js';
import {VOCAL_DEMOS,createVocalDemoSession} from '../dist/vocal-demo-sessions.js';
import {completePublicDemoVocals} from '../dist/public-demo-completion.js';
import {extendPublicDemoArrangement} from '../dist/public-demo-arrangements.js';
import {balancePublicDemo} from '../dist/demo-gain-staging.js';
import {mixPublicDemoInstruments} from '../dist/demo-instrument-mix.js';
import {routePublicDemoGroups} from '../dist/demo-group-buses.js';
import {masterPublicDemo} from '../dist/demo-mastering.js';
import {masteringSettings,MASTER_MODULES} from '../dist/mastering.js';
import {synthVocalGuide} from '../dist/vocal-guide-audio.js';
import {measureAudio,verifyWav32,auditRouting} from '../dist/audio-certification.js';
import {encodeWav} from '../dist/wav.js';

const builds=[
 ...Object.keys(BEAT_DEMOS).map(id=>[id,()=>createBeatDemoSession(id)]),
 ...Object.keys(NEW_GENRE_DEMOS).map(id=>[id,()=>createGenreDemoSession(id)]),
 ...Object.keys(VOCAL_DEMOS).map(id=>[id,()=>createVocalDemoSession(id)])
];
test('final demo release: 10 public projects preserve real routed mix and bounded active mastering stages',()=>{
 assert.equal(builds.length,10);
 for(const [id,build] of builds){
  const project=build();project.publicDemo=true;
  if(id==='trap808')extendPublicDemoArrangement(project,id);
  completePublicDemoVocals(project);
  balancePublicDemo(project);mixPublicDemoInstruments(project);
  routePublicDemoGroups(project);masterPublicDemo(project,id);
  const master=masteringSettings(project.mastering);
  assert.equal(master.bypass,false,id+' bypassed master');
  assert(master.inserts.filter(Boolean).length>=3,id+' incomplete mastering chain');
  assert.equal(new Set(master.inserts.filter(Boolean)).size,master.inserts.filter(Boolean).length);
  assert.equal(master.inserts.filter(Boolean).at(-1),'peak',id+' output must terminate in the peak limiter');
  assert.equal(master.peak.enabled,true,id+' missing limiter');
  assert(master.peak.ceiling<=-.1&&master.peak.ceiling>=-12,id+' unsafe output ceiling');
  for(const effect of master.inserts.filter(Boolean)){
   const state=master[effect],def=MASTER_MODULES[effect];
   assert(def&&state?.enabled,id+' missing active mastering module '+effect);
   for(const control of def.controls){
    assert(Number.isFinite(state[control.key])&&state[control.key]>=control.min&&state[control.key]<=control.max,
     id+' invalid master '+effect+'.'+control.key);
   }
  }
  assert.deepEqual(auditRouting(project),[],id+' invalid production graph');
  if(!id.startsWith('vox-')){
   assert.equal(project.tracks.filter(track=>track.type==='wlvox'&&track.clips.length).length,3,
    id+' missing lead/backing/response arrangements');
  }else{
   assert.equal(project.vocalDemo,true,id+' human-recorded asset loader missing');
  }
 }
});
test('final demo release: synthetic voice PCM probe is audible, finite and WAV-exportable in 16/24/32-bit',()=>{
 // PCM probe covers the shared vocal guide/codec path, not a complete browser
 // render of every full song. Hardware monitoring still requires manual QA.
 for(const style of ['vox-trap','vox-afro','vox-rnb']){
  const wavBuffer=synthVocalGuide({duration:.75,sampleRate:22050,voice:0,bpm:120,style});
  const report=measureAudio(wavBuffer);
  assert.equal(report.invalid,0,style+' invalid generated samples');
  assert(report.peakDb>-45&&report.peakDb<=0,style+' silent or clipped guide');
  assert.equal(report.clipped,0,style+' PCM clipping');
  const output32=encodeWav(wavBuffer,{bits:32});
  assert.equal(verifyWav32(output32,wavBuffer),true,style+' float WAV PCM mismatch');
  for(const bits of [16,24]){
   const data=new DataView(encodeWav(wavBuffer,{bits}));
   assert.equal(data.getUint16(34,true),bits);
   assert.equal(data.getUint32(40,true),wavBuffer.length*wavBuffer.numberOfChannels*(bits/8));
  }
 }
});
