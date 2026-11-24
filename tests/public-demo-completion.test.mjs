import test from 'node:test';
import assert from 'node:assert/strict';
import {BEAT_DEMOS,createBeatDemoSession} from '../dist/beat-demo-sessions.js';
import {NEW_GENRE_DEMOS,createGenreDemoSession} from '../dist/genre-demo-sessions.js';
import {VOCAL_DEMOS,createVocalDemoSession} from '../dist/vocal-demo-sessions.js';
import {completePublicDemoVocals} from '../dist/public-demo-completion.js';
import {mixPublicDemoInstruments} from '../dist/demo-instrument-mix.js';
import {balancePublicDemo} from '../dist/demo-gain-staging.js';
import {routePublicDemoGroups} from '../dist/demo-group-buses.js';
import {masterPublicDemo} from '../dist/demo-mastering.js';
import {EFFECTS,INSTRUMENTS} from '../dist/plugins.js';

for(const kind of Object.keys(BEAT_DEMOS)){
 test('complete public demo: '+kind+' includes instrumental score, lead, backing, adlibs, mix and master',()=>{
  const project=createBeatDemoSession(kind);project.publicDemo=true;
  const original=project.tracks.map(t=>({id:t.id,notes:JSON.stringify(t.clips),fx:JSON.stringify(t.effects)}));
  completePublicDemoVocals(project);
  assert.equal(project.demoVocalType,'synthetic-formant');
  assert.equal(project.tracks.filter(t=>t.type==='wlvox').length,3);
  assert.equal(project.tracks.filter(t=>t.type==='audio').length,3,'recording-ready human voice tracks remain separate');
  assert(project.tracks.some(t=>t.type==='drums'&&t.clips.length));
  for(const [i,track] of project.tracks.slice(-3).entries()){
   assert(INSTRUMENTS[track.type]);
   assert(track.name.includes('SYNTHÉTIQUE'));
   assert(track.clips.some(c=>c.notes.length),'missing audible vocal notes for '+track.name);
   assert(track.inserts.filter(Boolean).length>=2);
   for(const id of track.inserts.filter(Boolean))assert(EFFECTS[id.split('__')[0]]&&track.effects[id]?.enabled);
   for(const clip of track.clips){
    assert(clip.start>=0&&clip.start+clip.length<=project.bars,'vocal clip exceeds song');
    assert(clip.notes.every(n=>n.step>=0&&n.step+n.len<=clip.length*16&&n.velocity>0));
   }
   assert(i<3);
  }
  for(let i=0;i<original.length;i++){
   assert.equal(project.tracks[i].id,original[i].id);
   assert.equal(JSON.stringify(project.tracks[i].clips),original[i].notes,'original instrument notes changed');
   assert.equal(JSON.stringify(project.tracks[i].effects),original[i].fx,'original insert state changed');
  }
  const count=project.tracks.length;
  completePublicDemoVocals(project);assert.equal(project.tracks.length,count,'double-installs vocal tracks');
  balancePublicDemo(project);mixPublicDemoInstruments(project);
  routePublicDemoGroups(project);masterPublicDemo(project,kind);
  assert(project.tracks.some(t=>t.type==='bus'&&t.name==='VOCAL BUS'));
  assert(project.mastering&&!project.mastering.bypass);
  assert(project.mastering.inserts.includes('peak'));
  assert(project.mastering.peak.enabled);
 });
}
test('already complete Rock, Pop, Rumba keep original synthetic vocals and mastering',()=>{
 for(const kind of Object.keys(NEW_GENRE_DEMOS)){
  const project=createGenreDemoSession(kind);project.publicDemo=true;
  const original=JSON.stringify(project);
  completePublicDemoVocals(project);
  assert.equal(JSON.stringify(project),original);
  assert.equal(project.tracks.filter(t=>t.type==='wlvox'&&t.clips.length).length,3);
  assert(project.mastering&&!project.mastering.bypass);
 }
});
test('licensed Trap, Afro and R&B voice demo sessions retain their independent audio media loader',()=>{
 for(const kind of Object.keys(VOCAL_DEMOS)){
  const project=createVocalDemoSession(kind);project.publicDemo=true;
  const before=JSON.stringify(project);
  completePublicDemoVocals(project);
  assert.equal(JSON.stringify(project),before);
  assert.equal(project.tracks.filter(t=>t.type==='audio').length,3);
  assert.equal(project.vocalDemo,true);
 }
});
test('completion refuses invalid arrangements and leaves foreign projects unchanged',()=>{
 const project=createBeatDemoSession('drill');
 const original=JSON.stringify(project);
 completePublicDemoVocals(project);assert.equal(JSON.stringify(project),original);
 project.publicDemo=true;project.bars=0;
 assert.throws(()=>completePublicDemoVocals(project),/invalide/);
});
