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
import {INSTRUMENTS,EFFECTS,effectType} from '../dist/plugins.js';
import {auditRouting} from '../dist/audio-certification.js';

const projects=[
 ...Object.keys(BEAT_DEMOS).map(id=>({id,build:()=>createBeatDemoSession(id)})),
 ...Object.keys(NEW_GENRE_DEMOS).map(id=>({id,build:()=>createGenreDemoSession(id)})),
 ...Object.keys(VOCAL_DEMOS).map(id=>({id,build:()=>createVocalDemoSession(id)}))
];
for(const {id,build} of projects){
 test('release demos save/reopen preserves instrument, voice, mix and master: '+id,()=>{
  const project=build();project.publicDemo=true;
  if(id==='trap808')extendPublicDemoArrangement(project,id);
  completePublicDemoVocals(project);
  balancePublicDemo(project);mixPublicDemoInstruments(project);
  routePublicDemoGroups(project);masterPublicDemo(project,id);
  const saved=JSON.stringify(project),reopened=JSON.parse(saved);
  assert.deepEqual(reopened,project,'JSON save/reopen changed content');
  assert(Number.isInteger(reopened.bars)&&reopened.bars>=16);
  assert(reopened.tracks.some(t=>INSTRUMENTS[t.type]&&t.type!=='wlvox'&&t.clips.length>0),'missing instrument performance');
  const vocalGuides=reopened.tracks.filter(t=>t.type==='wlvox'&&t.clips.length>0);
  if(id.startsWith('vox-')){
   assert.equal(vocalGuides.length,0,'recorded vocal loader must not be replaced with synthetic voices');
   assert.equal(reopened.vocalDemo,true);
   assert.equal(reopened.tracks.filter(t=>t.type==='audio').length,3);
  }else assert.equal(vocalGuides.length,3,'synthetic vocal roles missing');
  const master=reopened.mastering;
  assert(master&&!master.bypass&&master.inserts.includes('peak')&&master.peak.enabled,'master limiter inactive');
  assert.deepEqual(auditRouting(reopened),[],'invalid mix bus routing');
  for(const track of reopened.tracks){
   if(!Array.isArray(track.inserts))continue;
   const ids=track.inserts.filter(Boolean);
   assert.equal(ids.length,new Set(ids).size,'duplicate insert instance '+track.name);
   for(const instance of ids){
    const definition=EFFECTS[effectType(instance)];
    assert(definition,'missing DSP definition '+instance);
    const values=track.effects?.[instance];
    assert(values?.enabled,'disabled installed DSP '+instance);
    for(const control of definition.controls){
     const value=values[control.key];
     assert(Number.isFinite(value)&&value>=control.min&&value<=control.max,instance+'.'+control.key);
    }
   }
   for(const clip of track.clips||[]){
    assert(clip.start>=0&&clip.length>0&&clip.start+clip.length<=reopened.bars+.0001,'invalid clip bounds');
   }
  }
  const before=JSON.stringify(reopened);
  completePublicDemoVocals(reopened);
  assert.equal(JSON.stringify(reopened),before,'reopening duplicates vocal performers');
 });
}
