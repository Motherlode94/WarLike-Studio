import test from 'node:test';
import assert from 'node:assert/strict';
import {SESSION_TEMPLATES,createFactorySession} from '../dist/content.js';
import {COMPOSITION_TEMPLATES,COMPOSITION_STYLES} from '../dist/studio-compositions.js';
import {INSTRUMENTS} from '../dist/plugins.js';
import {SCALES} from '../dist/piano-model.js';
const songs=['etoiles-interdites','derriere-les-murs','un-dernier-soleil','au-bord-du-ciel','promesses-de-pluie'];
const previewSignature=project=>project.tracks.filter(t=>t.type!=='audio').map(t=>({type:t.type,clips:t.clips.map(c=>({start:c.start,pattern:c.pattern,notes:c.notes?.map(({id,...note})=>note)}))}));
test('five new original 2000s French pop and R&B works are full editable Studio sessions',()=>{
 const signatures=[];
 for(const id of songs){
  const meta=COMPOSITION_TEMPLATES.find(t=>t.id===id);
  assert(meta, id+' missing template');assert(SESSION_TEMPLATES.some(t=>t.id===id));
  const spec=COMPOSITION_STYLES[id];assert(spec?.flavor>=1&&spec.flavor<=5);
  const project=createFactorySession(id,true);
  assert.equal(project.fullSong,true);
  assert.equal(project.bars,meta.bars);
  assert(project.bars*240/project.bpm>=180&&project.bars*240/project.bpm<=290);
  assert.equal(project.sections.length,8);
  assert.deepEqual(project.sections.map(s=>s.name),['INTRO','COUPLET A','MONTÉE','REFRAIN A','PONT','COUPLET B','REFRAIN B','OUTRO']);
  assert.equal(project.tracks.length,9);
  assert.deepEqual(project.tracks.slice(-3).map(t=>t.name),['LEAD VOX','BACKS','ADLIBS']);
  assert(project.tracks.slice(-3).every(t=>t.type==='audio'&&t.clips.length===0));
  for(const track of project.tracks.slice(0,6)){
   assert(INSTRUMENTS[track.type],id+' has unknown instrument '+track.type);
   assert(track.clips.length>=8,id+' must contain music on multiple sections');
   for(const control of INSTRUMENTS[track.type].controls){
    const value=track.instrument[control.key];
    assert(Number.isFinite(value)&&value>=control.min&&value<=control.max,id+' '+track.type+' '+control.key+'='+value);
   }
   for(const clip of track.clips){
    assert(clip.start>=0&&clip.start+clip.length<=project.bars,id+' clip bounds');
    for(const note of clip.notes||[]){
     assert(note.step>=0&&note.len>0&&note.step+note.len<=clip.patternSteps+1e-8,id+' note bounds');
     assert(note.velocity>0&&note.velocity<=1,id+' velocity bounds');
     assert(SCALES[project.pianoScale].includes(((note.midi-project.pianoKey)%12+12)%12),id+' out-of-key note '+note.midi);
    }
   }
  }
  const instrumental=project.tracks[0].clips.map(c=>c.pattern?.kick?.join(',')||'').join('|');
  assert(instrumental.length>30);
  const sig=JSON.stringify(previewSignature(project));
  assert(!signatures.includes(sig),'all five arrangements must differ');
  signatures.push(sig);
  const second=createFactorySession(id,true);
  assert.deepEqual(previewSignature(project),previewSignature(second),'deterministic scores');
  const verse=project.sections[1],hook=project.sections[3],bridge=project.sections[4];
  const part=(i,section)=>project.tracks[i].clips.filter(c=>c.start>=section.start&&c.start<section.start+section.length).flatMap(c=>c.notes||[]).map(n=>[n.step,n.midi,n.len]);
  assert.notDeepEqual(part(3,verse),part(3,hook),id+' needs distinct chorus melody');
  assert.notDeepEqual(part(2,verse),part(2,bridge),id+' needs distinct bridge harmony');
 }
});
test('distinct musical directions rather than five copies of the same instrumentation',()=>{
 const records=songs.map(id=>createFactorySession(id,true));
 assert.equal(new Set(records.map(p=>p.bpm)).size,5);
 assert(new Set(records.map(p=>p.tracks.slice(0,6).map(t=>t.type).join('/'))).size>=4);
 assert(records.some(p=>p.tracks.some(t=>t.type==='violin')));
 assert(records.some(p=>p.tracks.some(t=>t.type==='flute')));
 assert(records.some(p=>p.tracks.some(t=>t.type==='wlrompler')));
});
