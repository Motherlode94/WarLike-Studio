import test from 'node:test';
import assert from 'node:assert/strict';
import {createFactorySession} from '../dist/content.js';
import {COMPOSITION_STYLES} from '../dist/studio-compositions.js';
import {INSTRUMENTS,DRUM_VOICES} from '../dist/plugins.js';

const project=id=>createFactorySession(id,true);
const clips=(p,role)=>p.tracks[role].clips;
const notes=(p,role)=>clips(p,role).flatMap(c=>c.notes||[]);
test('organic rock, rumba and pop preserve editable song structures and native instruments',()=>{
 for(const id of ['eclats','kin','lumiere']){
  const p=project(id),spec=COMPOSITION_STYLES[id];
  assert.equal(p.bars,spec.layout.reduce((sum,[,n])=>sum+n,0));
  assert.equal(p.tracks.filter(t=>t.type==='audio').length,3);
  assert.equal(p.tracks[0].instrument.kit,id==='kin'?3:id==='eclats'?1:2);
  assert.ok(p.tracks.some(t=>t.type==='wltitan'));
  assert.ok(p.tracks.some(t=>t.type==='wlclean'));
  for(const t of p.tracks.filter(t=>t.type!=='audio')){
   assert.ok(INSTRUMENTS[t.type],t.type);
   for(const [key,value] of Object.entries(t.instrument)) {
    const c=INSTRUMENTS[t.type].controls.find(x=>x.key===key);
    if(c)assert.ok(value>=c.min&&value<=c.max,id+' '+t.name+' '+key);
   }
   for(const clip of t.clips){
    if(clip.pattern)for(const row of Object.values(clip.pattern))assert.ok(row.every(n=>n>=0&&n<=1));
    if(clip.notes)for(const n of clip.notes)assert.ok(n.step>=0&&n.step+n.len<=clip.patternSteps+.0001);
   }
  }
  assert.ok(notes(p,1).length>50,id+' requires played bass movement');
 }
});
test('rumba uses section-dependent cymbal accents and guitar counter-rhythm',()=>{
 const p=project('kin');
 const d=clips(p,0).filter(c=>c.pattern);
 assert.ok(d.some(c=>c.pattern.open.some(v=>v>.3)),'cymbal-like open hat accent');
 assert.ok(d.some(c=>c.pattern.open.every(v=>v===0)),'cymbals should not repeat every bar');
 assert.ok(notes(p,3).length>60,'lead sebene guitar');
 assert.ok(notes(p,4).length>60,'muted offbeat guitar');
 assert.deepEqual(Object.keys(d[0].pattern),Object.keys(DRUM_VOICES));
});
test('rock riff and pop bass develop independently between 4-bar phrases',()=>{
 for(const id of ['eclats','lumiere']){
  const p=project(id);
  const bass=clips(p,1).filter(c=>c.notes?.length);
  assert.ok(bass.length>5);
  const fingerprints=new Set(bass.map(c=>JSON.stringify(c.notes.map(n=>[n.step,n.midi,n.len]))));
  assert.ok(fingerprints.size>2,id+' bass must vary between sections');
 }
});
