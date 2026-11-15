import test from 'node:test';
import assert from 'node:assert/strict';
import {createGenreDemoSession} from '../dist/genre-demo-sessions.js';
import {DEMO_MIX_MASTER,validateDemoMix,makeDemoMastering} from '../dist/genre-vocal-mix-master.js';
import {reorderTrackList} from '../dist/tracks.js';
test('all original genre mix presets address real effect and master parameters',()=>{
 for(const style of ['rock','pop','rumba']){
  assert.equal(validateDemoMix(style),true);
  const m=makeDemoMastering(style);
  assert.deepEqual(m.inserts.slice(0,3),['balance','press','peak']);
  assert.equal(m.bypass,false);
  for(const key of ['balance','press','peak'])assert.equal(m[key].enabled,true);
 }
 assert.notEqual(DEMO_MIX_MASTER.pop.master.press.ratio,DEMO_MIX_MASTER.rumba.master.press.ratio);
});
test('Rock Pop Rumba include three audible voices, editable mix insert chains and 3 human recording tracks',()=>{
 for(const style of ['rock','pop','rumba']){
  const p=createGenreDemoSession(style),synth=p.tracks.filter(t=>t.type==='wlvox');
  assert.equal(synth.length,3);
  for(const t of synth){
   assert.ok(t.clips.some(c=>c.notes?.length),'Vocal synth has no score');
   assert.ok(t.inserts.includes('voxclean'));
   assert.ok(t.inserts.filter(Boolean).every(id=>t.effects[id]?.enabled));
   assert.ok(t.clips.flatMap(c=>c.notes).every(n=>n.velocity>0));
  }
  assert.ok(synth.find(t=>t.name.includes('LEAD')).inserts.includes('voxlevel'));
  assert.ok(synth.find(t=>t.name.includes('BACKS')).inserts.includes('voxdoubler'));
  assert.ok(synth.find(t=>t.name.includes('ADLIBS')).inserts.includes('alterecho'));
  assert.deepEqual(p.mastering.inserts.slice(0,3),['balance','press','peak']);
  assert.ok(p.tracks.filter(t=>t.type==='audio').every(t=>t.clips.length===0),'Mic recording tracks must stay available');
 }
});
test('freely reordering a vocal track preserves MIDI notes, effects, faders and master',()=>{
 const project=createGenreDemoSession('pop');
 const source=project.tracks.find(t=>t.type==='wlvox');
 const clips=source.clips,settings=source.effects,master=project.mastering;
 const next=reorderTrackList(project.tracks,source.id,project.tracks[1].id);
 assert.notStrictEqual(next,project.tracks);
 assert.strictEqual(next[1],source);
 assert.strictEqual(next[1].clips,clips);
 assert.strictEqual(next[1].effects,settings);
 assert.strictEqual(project.mastering,master);
 assert.deepEqual(next.map(t=>t.id).sort(),project.tracks.map(t=>t.id).sort());
});
