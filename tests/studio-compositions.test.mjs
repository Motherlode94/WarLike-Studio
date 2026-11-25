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
  assert.deepEqual(p.sections.map(s=>s.name),['INTRO','COUPLET A',['rnb-2005','popstar-2008'].includes(template.id)?'PRÉ-REFRAIN':'MONTÉE','REFRAIN A',template.id==='kin'?'SEBENE':'PONT','COUPLET B','REFRAIN B','OUTRO']);
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
test('Amapiano has a pitched offbeat log drum and dedicated preview groove',()=>{
 const p=createFactorySession('horizon',true),log=p.tracks[1];
 assert.equal(log.type,'wlngoma');assert.ok(log.clips.flatMap(c=>c.notes).some(n=>n.step%1!==0));
 assert.ok(new Set(log.clips.flatMap(c=>c.notes).map(n=>n.midi)).size>=5);
 assert.equal(SESSION_TEMPLATES.find(t=>t.id==='horizon').groove,'horizon-pocket');
 const first=p.sections[1],hook=p.sections[3];
 const count=part=>log.clips.filter(c=>c.start>=part.start&&c.start<part.start+part.length).reduce((n,c)=>n+c.notes.length,0)/part.length;
 assert.ok(count(hook)>count(first),'chorus log drum must develop the pocket');
});
test('alternative rock has power-chord riffs and a real half-time bridge',()=>{
 const p=createFactorySession('eclats',true);assert.equal(p.tracks[2].type,'wlcrunch');assert.equal(p.tracks[3].type,'wlclean');
 const verse=p.sections[1],bridge=p.sections[4],drum=p.tracks[0];
 const regular=drum.clips.find(c=>c.start===verse.start).pattern.clap;
 const half=drum.clips.find(c=>c.start===bridge.start).pattern.clap;
 assert.ok(regular[4]>0&&regular[12]>0);assert.equal(half[4],0);assert.ok(half[8]>0);assert.equal(half[12],0);
 const riff=p.tracks[2].clips.find(c=>c.start===verse.start).notes.filter(n=>n.step<1).map(n=>n.midi);
 assert.deepEqual(riff.map(n=>n-riff[0]),[0,7,12]);
 assert.equal(SESSION_TEMPLATES.find(t=>t.id==='eclats').groove,'eclats-backbeat');
});
test('rumba develops interlocking guitars in its dedicated sebene section',()=>{
 const p=createFactorySession('kin',true),verse=p.sections.find(s=>s.name==='COUPLET A'),sebene=p.sections.find(s=>s.name==='SEBENE');
 assert.equal(sebene.length,16);assert.equal(p.tracks[2].type,'wlnylon');assert.equal(p.tracks[3].type,'wlclean');assert.equal(p.tracks[5].type,'wlsteel');
 const density=(role,part)=>p.tracks[role].clips.filter(c=>c.start>=part.start&&c.start<part.start+part.length).flatMap(c=>c.notes).length/part.length;
 assert.ok(density(3,sebene)>density(3,verse),'sebene must develop the solo guitar');assert.ok(density(5,sebene)>0,'steel guitar must answer the solo');
 assert.ok(p.tracks[0].clips.find(c=>c.start===sebene.start).pattern.kick.some(Boolean),'sebene keeps the dance pulse');
 assert.equal(SESSION_TEMPLATES.find(t=>t.id==='kin').bridgeLabel,'SEBENE');
});
test('organic pop develops piano pulse and a clean guitar hook with a quiet bridge',()=>{
 const p=createFactorySession('lumiere',true),verse=p.sections[1],hook=p.sections[3],bridge=p.sections[4];
 assert.equal(p.tracks[2].type,'piano');assert.equal(p.tracks[3].type,'wlclean');assert.equal(p.tracks[4].type,'wlsteel');
 const density=part=>p.tracks[2].clips.filter(c=>c.start>=part.start&&c.start<part.start+part.length).flatMap(c=>c.notes).length/part.length;
 assert.ok(density(hook)>density(verse));assert.ok(density(bridge)<density(hook));
 assert.ok(p.tracks[3].clips.find(c=>c.start===hook.start).notes.length>p.tracks[3].clips.find(c=>c.start===verse.start).notes.length);
 assert.equal(SESSION_TEMPLATES.find(t=>t.id==='lumiere').groove,'lumiere-pop');
});
