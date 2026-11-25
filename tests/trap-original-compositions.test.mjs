import test from 'node:test';
import assert from 'node:assert/strict';
import {SESSION_TEMPLATES,createFactorySession} from '../dist/content.js';
import {COMPOSITION_TEMPLATES} from '../dist/studio-compositions.js';
import {INSTRUMENTS,EFFECTS,effectType} from '../dist/plugins.js';
import {SCALES} from '../dist/piano-model.js';
import {masteringSettings} from '../dist/mastering.js';

const ids=['trap-abyss','trap-enigma'];
const notes=(p,i,section)=>p.tracks[i].clips.filter(c=>c.start>=section.start&&c.start<section.start+section.length).flatMap(c=>c.notes||[]);
test('two original trap instrumentals appear in the existing composition catalog and open complete editable projects',()=>{
 for(const id of ids){
  const template=COMPOSITION_TEMPLATES.find(item=>item.id===id);
  assert(template,id+' missing composition template');
  assert(SESSION_TEMPLATES.some(item=>item.id===id));
  const project=createFactorySession(id,true);
  assert.equal(project.fullSong,true);
  assert.equal(project.bars,template.bars);
  assert(project.bars*240/project.bpm>=180,'Not a short loop');
  assert(project.bars*240/project.bpm<=300);
  assert.equal(project.sections.length,8);
  assert.equal(project.tracks.filter(track=>track.type==='audio').length,3);
  assert.equal(project.tracks.filter(track=>track.type==='audio').every(track=>!track.clips.length),true);
  assert(project.tracks.slice(0,6).every(track=>track.clips.length>=8),'Every instrument plays throughout the song');
  const allIds=new Set();
  for(const track of project.tracks){
   assert(!allIds.has(track.id));allIds.add(track.id);
   if(track.type==='audio')continue;
   assert(INSTRUMENTS[track.type]);
   for(const clip of track.clips){
    assert(!allIds.has(clip.id));allIds.add(clip.id);
    if(track.type==='drums'){
     assert(clip.pattern.kick?.some(Boolean),'Kick is silent');
     continue;
    }
    for(const note of clip.notes){
     assert(SCALES[project.pianoScale].includes(((note.midi-project.pianoKey)%12+12)%12),id+' out-of-key MIDI');
     assert(note.step>=0&&note.step+note.len<=clip.patternSteps, id+' note exceeds pattern');
     assert(note.velocity>0&&note.velocity<=1);
    }
   }
  }
  const [verse,hook,bridge]=[project.sections[1],project.sections[3],project.sections[4]];
  assert.notDeepEqual(notes(project,3,verse).map(({id,...rest})=>rest),notes(project,3,hook).map(({id,...rest})=>rest),'Atmosphere must develop in hook');
  assert.notDeepEqual(notes(project,2,verse).map(n=>n.midi),notes(project,2,bridge).map(n=>n.midi),'Bridge needs new harmony');
  assert(notes(project,4,hook).length>notes(project,4,bridge).length,'Hook must answer with more synth notes');
  const saved=createFactorySession(id,true);
  assert.deepEqual(project.tracks.map(t=>t.clips.map(c=>c.notes?.map(({id,...n})=>n)||c.pattern)),
   saved.tracks.map(t=>t.clips.map(c=>c.notes?.map(({id,...n})=>n)||c.pattern)),'Arrangement must be reproducible');
 }
});
test('both songs use available WarLike native effects with conservative headroom and no saturation on the master',()=>{
 for(const id of ids){
  const p=createFactorySession(id,true);
  assert(p.tracks[0].inserts.includes('vectorcomp'));
  assert(p.tracks[1].inserts.includes('sculpt'));
  assert(p.tracks[2].inserts.includes('circuiteq'));
  assert(p.tracks[3].inserts.includes('exospace'));
  assert(p.tracks[4].inserts.includes('alterecho'));
  for(const track of p.tracks.slice(0,6)){
   assert(track.volume<=-7, 'Positive track gain risks clipping');
   assert(track.inserts.filter(Boolean).length>=1,'Missing plugin rack on '+track.name);
   for(const insert of track.inserts.filter(Boolean)){
    assert(EFFECTS[effectType(insert)],'Unknown native effect '+insert);
    assert.equal(track.effects[insert].enabled,true);
   }
  }
  const master=masteringSettings(p.mastering);
  assert.equal(master.bypass,false);
  assert.equal(master.peak.enabled,true);
  assert.equal(master.peak.drive,0);
  assert.equal(master.peak.ceiling,-1.5);
  assert.equal(master.circuitcolor.mix,0);
  assert.equal(master.circuitcolor.drive,0);
  assert.equal(master.inserts.filter(Boolean).at(-1),'peak','Limiter must remain last');
 }
});
test('dark and enigmatic trap have distinct grooves, melodies, keys, and timbres',()=>{
 const [dark,mystery]=ids.map(id=>createFactorySession(id,true));
 assert.notEqual(dark.bpm,mystery.bpm);
 assert.notEqual(dark.pianoKey,mystery.pianoKey);
 assert.notDeepEqual(dark.tracks[0].clips[3].pattern,mystery.tracks[0].clips[3].pattern);
 assert.notDeepEqual(dark.tracks[2].clips.flatMap(c=>c.notes.map(n=>n.midi)).slice(0,25),
  mystery.tracks[2].clips.flatMap(c=>c.notes.map(n=>n.midi)).slice(0,25));
 assert.equal(dark.tracks[4].type,'wlvirtual');
 assert.equal(mystery.tracks[4].type,'wlspectral');
 assert.equal(mystery.tracks[5].type,'flute');
});
