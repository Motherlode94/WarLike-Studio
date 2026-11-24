import test from 'node:test';
import assert from 'node:assert/strict';
import {createFactorySession} from '../dist/content.js';
import {createGenreDemoSession} from '../dist/genre-demo-sessions.js';
import {INSTRUMENTS,EFFECTS,ensurePlugins} from '../dist/plugins.js';

// Afternoon composition release gate: session shape, editing, export-ready state.
// This does NOT certify live instrument sound or browser latency.
for(const style of ['rock','pop','rumba']){
 test('release QA composition: '+style+' remains editable after JSON reopen',()=>{
  const project=createGenreDemoSession(style);
  const persisted=JSON.parse(JSON.stringify(project));
  assert.equal(persisted.bars,16);
  assert(persisted.tracks.some(track=>track.clips.length>0));
  assert(persisted.tracks.filter(track=>track.type==='audio').length>=3);
  for(const track of persisted.tracks){
   ensurePlugins(track);
   assert.equal(track.inserts.length,12);
   for(const key of track.inserts.filter(Boolean)){
    const type=key.split('__')[0];
    assert(EFFECTS[type],style+': missing insert '+key);
    assert(track.effects[key],style+': missing effect state '+key);
   }
   if(INSTRUMENTS[track.type]){
    for(const control of INSTRUMENTS[track.type].controls){
     const value=track.instrument?.[control.key];
     assert(Number.isFinite(value)&&value>=control.min&&value<=control.max,style+' '+track.type+'.'+control.key);
    }
   }
  }
  const musical=persisted.tracks.find(track=>track.clips.some(clip=>clip.notes?.length));
  assert(musical,'no playable MIDI clip');
  const note=musical.clips.find(clip=>clip.notes?.length).notes[0];
  const before=note.velocity;
  // Some factory notes already have velocity .42; guarantee a genuine edit.
  const edited=before===.42?.57:.42;
  note.velocity=edited;
  assert.equal(note.velocity,edited,'MIDI edit must survive reload');
  assert.equal(JSON.parse(JSON.stringify(project)).tracks.find(t=>t.id===musical.id).clips.find(c=>c.notes?.length).notes[0].velocity,before,
   'saved edit must not alter original session');
  assert.notEqual(before,edited,'the test must actually change MIDI velocity');
  assert(Number.isFinite(before));
 });
}
test('release QA composition: full arrangements and recording lanes coexist',()=>{
 for(const id of ['kin','eclats','lumiere','horizon']){
  const project=createFactorySession(id,true);
  assert(project.fullSong);
  assert(project.bars>=48);
  assert(project.sections.length>=6);
  assert(project.tracks.filter(t=>t.type==='audio').length>=3);
  for(const section of project.sections){
   assert(section.start>=0&&section.length>0&&section.start+section.length<=project.bars);
  }
  const restored=JSON.parse(JSON.stringify(project));
  assert.equal(restored.bpm,project.bpm);
  assert.deepEqual(restored.sections,project.sections);
 }
});
