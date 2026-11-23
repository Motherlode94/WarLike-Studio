import test from 'node:test';
import assert from 'node:assert/strict';
import {createFactorySession,SESSION_TEMPLATES} from '../dist/content.js';
import {COMPOSITION_TEMPLATES} from '../dist/studio-compositions.js';
import {INSTRUMENTS} from '../dist/plugins.js';
import {SCALES} from '../dist/piano-model.js';
const score=p=>p.tracks.map(t=>({type:t.type,instrument:t.instrument,clips:t.clips.map(c=>({start:c.start,length:c.length,notes:c.notes?.map(({id,...n})=>n),pattern:c.pattern}))}));
test('R08.4 compositions own full forms, diatonic scores and valid native parameters',()=>{
 for(const template of COMPOSITION_TEMPLATES){
  assert.ok(SESSION_TEMPLATES.some(t=>t.id===template.id));
  const p=createFactorySession(template.id,true);assert.equal(p.bars,template.bars);assert.equal(p.fullSong,true);
  assert.ok(p.bars*240/p.bpm>=180&&p.bars*240/p.bpm<=300);
  assert.deepEqual(p.sections.map(s=>s.name),['INTRO','COUPLET A','MONTÉE','REFRAIN A','PONT','COUPLET B','REFRAIN B','OUTRO']);
  const ids=new Set();
  for(const track of p.tracks){
   assert.ok(!ids.has(track.id));ids.add(track.id);
   if(track.type==='audio'){assert.equal(track.clips.length,0);assert.equal(track.recordArm,false);continue;}
   for(const c of INSTRUMENTS[track.type].controls){const v=track.instrument[c.key];assert.ok(Number.isFinite(v)&&v>=c.min&&v<=c.max,template.id+' '+track.type+' '+c.key);}
   for(const clip of track.clips){
    assert.ok(!ids.has(clip.id));ids.add(clip.id);
    for(const n of clip.notes||[]){assert.ok(SCALES[p.pianoScale].includes(((n.midi-p.pianoKey)%12+12)%12));assert.ok(n.velocity>0&&n.velocity<=1);assert.ok(n.step>=0&&n.len>0&&n.step+n.len<=clip.patternSteps);}
   }
  }
  for(const part of p.sections)assert.ok(p.tracks.some(t=>t.clips.some(c=>c.start>=part.start&&c.start<part.start+part.length&&(c.notes?.length||Object.values(c.pattern||{}).some(row=>row.some(Boolean))))),part.name+' has no music');
  const verse=p.sections[1],hook=p.sections[3],bridge=p.sections[4];
  const notes=(role,part)=>p.tracks[role].clips.filter(c=>c.start>=part.start&&c.start<part.start+part.length).flatMap(c=>c.notes||[]).map(n=>[n.step,n.midi,n.len,n.velocity]);
  assert.notDeepEqual(notes(3,verse),notes(3,hook),'hook must change the phrase, not only the section name');
  assert.notDeepEqual(notes(2,verse),notes(2,bridge),'bridge must develop harmony');
  assert.notDeepEqual(p.tracks[0].clips.find(c=>c.start===verse.start).pattern,p.tracks[0].clips.find(c=>c.start===hook.start).pattern);
  assert.equal(p.tracks.filter(t=>t.type==='audio').length,3);
 }
});
test('new composition scores are reproducible and isolated editable copies',()=>{
 for(const {id} of COMPOSITION_TEMPLATES){
  const a=createFactorySession(id,true),b=createFactorySession(id,true);assert.deepEqual(score(a),score(b));
  a.tracks[3].clips[0].notes[0].midi=1;a.tracks[0].clips[0].pattern.kick.fill(0);
  assert.deepEqual(score(b),score(createFactorySession(id,true)));
 }
 assert.notDeepEqual(score(createFactorySession('rives',true)),score(createFactorySession('pluie',true)));
});
