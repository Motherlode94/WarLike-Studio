import test from 'node:test';
import assert from 'node:assert/strict';
import {SESSION_TEMPLATES,createFactorySession} from '../dist/content.js';
import {COMPOSITION_TEMPLATES,COMPOSITION_STYLES} from '../dist/studio-compositions.js';
import {INSTRUMENTS,EFFECTS,effectType} from '../dist/plugins.js';
import {SCALES} from '../dist/piano-model.js';
const ids=['rnb-2005','popstar-2008'];
const sum=project=>project.tracks.map(t=>({type:t.type,notes:t.clips.map(c=>c.notes?.map(({id,...note})=>note)||c.pattern)}));
test('two fully editable original French R&B/pop-star instrumentals belong to the regular catalog',()=>{
 for(const id of ids){
  const template=COMPOSITION_TEMPLATES.find(t=>t.id===id),spec=COMPOSITION_STYLES[id];
  assert(template&&spec);
  assert(SESSION_TEMPLATES.some(t=>t.id===id));
  const p=createFactorySession(id,true);
  assert.equal(p.fullSong,true);
  assert.equal(p.bars,template.bars);
  assert(p.bars*240/p.bpm>=180&&p.bars*240/p.bpm<=270);
  assert.equal(p.sections.length,8);
  assert.equal(p.tracks.filter(t=>t.type==='audio').length,3);
  assert(p.tracks.filter(t=>t.type==='audio').every(t=>t.clips.length===0));
  assert.equal(p.tracks[0].instrument.kit,2);
  assert.equal(p.tracks[1].type,'wltitan');
  assert(p.tracks.every(t=>t.type==='audio'||INSTRUMENTS[t.type]));
  for(const t of p.tracks.filter(t=>t.type!=='audio')){
   assert(t.clips.length>=8);
   for(const c of t.clips){
    for(const n of c.notes||[]){
     assert(SCALES[p.pianoScale].includes(((n.midi-p.pianoKey)%12+12)%12),id+' out-of-key note '+n.midi);
     assert(n.step>=0&&n.len>0&&n.step+n.len<=c.patternSteps,id+' note exceeds clip');
     assert(n.velocity>0&&n.velocity<=1);
    }
   }
  }
  assert.deepEqual(sum(p),sum(createFactorySession(id,true)),'scores should be repeatable');
  const verse=p.sections[1],chorus=p.sections[3],bridge=p.sections[4];
  const phrase=(role,section)=>p.tracks[role].clips.filter(c=>c.start>=section.start&&c.start<section.start+section.length).flatMap(c=>c.notes||[]).map(n=>[n.step,n.midi,n.velocity]);
  assert.notDeepEqual(phrase(3,verse),phrase(3,chorus),'refrain needs melodic growth');
  assert.notDeepEqual(phrase(2,verse),phrase(2,bridge),'bridge must have its own chords');
  assert(p.tracks[0].clips.find(c=>c.start===chorus.start).pattern.kick.some(Boolean));
 }
});
test('French R&B and French pop-star arrangements have separate harmony, groove and timbre',()=>{
 const [rnb,pop]=ids.map(id=>createFactorySession(id,true));
 assert.notEqual(rnb.bpm,pop.bpm);
 assert.notEqual(rnb.pianoKey,pop.pianoKey);
 assert.notDeepEqual(rnb.tracks[0].clips[3].pattern,pop.tracks[0].clips[3].pattern);
 assert.equal(rnb.tracks[2].type,'epiano');
 assert.equal(pop.tracks[2].type,'piano');
 assert.equal(rnb.tracks[3].type,'wlmuted');
 assert.equal(pop.tracks[3].type,'wlclean');
 assert.equal(rnb.tracks[4].type,'violin');
 assert.equal(pop.tracks[4].type,'wlsteel');
});
