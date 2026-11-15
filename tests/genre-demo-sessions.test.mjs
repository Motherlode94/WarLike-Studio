import test from 'node:test';
import assert from 'node:assert/strict';
import {createGenreDemoSession,NEW_GENRE_DEMOS} from '../dist/genre-demo-sessions.js';
import {createFactorySession} from '../dist/content.js';
import {EFFECTS,INSTRUMENTS,ensurePlugins} from '../dist/plugins.js';

test('existing Trap/Afro/R&B demos are unchanged and new genres are separate',()=>{
 assert.deepEqual(Object.keys(NEW_GENRE_DEMOS),['rock','pop','rumba']);
 for(const style of ['nocturne','soleil','brume']){
  const original=createFactorySession(style);
  assert.equal(original.tracks.length,9);
  assert.equal(original.tracks.filter(t=>t.type==='audio').length,3);
  assert.equal(original.tracks[0].clips.length,4);
  assert.equal(original.bars,16);
 }
});
test('Rock, Pop and Rumba are playable 16-bar arrangements with distinct WL instruments and real effects',()=>{
 const expected={
  rock:['wlcrunch','wlclean','wlsteel','wlvirtual','wljazz'],
  pop:['piano','wlclean','wlmuted','wlrompler','wlsteel'],
  rumba:['wlnylon','wlclean','wlmuted','wlsteel','wljazz']
 };
 const bpm={rock:126,pop:112,rumba:102};
 for(const style of Object.keys(expected)){
  const p=createGenreDemoSession(style);
  assert.equal(p.bpm,bpm[style]);
  assert.equal(p.bars,16);assert.ok(p.masterVolume<=-9);
  assert.equal(p.tracks.length,style==='rock'?10:9);assert.equal(p.tracks.filter(t=>t.type==='audio').length,3);
  assert.deepEqual(p.tracks.slice(1,6).map(t=>t.type),expected[style]);
  assert.ok(p.tracks.some(t=>t.inserts.some(Boolean)),'new plug DSP inserts absent');
  for(const t of p.tracks){
   ensurePlugins(t);
   assert.equal(t.inserts.length,12);
   for(const id of t.inserts.filter(Boolean)){
    assert.ok(EFFECTS[id],style+':'+id+' unavailable');
    assert.equal(t.effects[id].enabled,true);
   }
   if(t.type==='audio'){assert.equal(t.clips.length,0);continue;}
   assert.ok(INSTRUMENTS[t.type],t.type);
   assert.ok(t.clips.length>=3,style+':'+t.name+' no score');
   for(const clip of t.clips){
    assert.ok(clip.start>=0&&clip.start+clip.length<=16);
    if(t.type==='drums'){
     assert.equal(clip.patternSteps,64);
     assert.ok(Object.values(clip.pattern).some(row=>row.some(v=>v>0)));
    }else{
     assert.ok(clip.notes.length>=4);
     for(const n of clip.notes){
      assert.ok(Number.isFinite(n.midi)&&n.midi>=0&&n.midi<=127);
      assert.ok(n.step>=0&&n.step+n.len<=64+.00001);
      assert.ok(n.velocity>0&&n.velocity<=1);
     }
    }
   }
  }
 }
});
test('new demo instances do not leak project state across launches',()=>{
 const a=createGenreDemoSession('rock'),b=createGenreDemoSession('rock');
 a.tracks[1].instrument.brightness=111;
 a.tracks[1].clips[0].notes[0].midi=12;
 assert.notEqual(b.tracks[1].instrument.brightness,111);
 assert.notEqual(b.tracks[1].clips[0].notes[0].midi,12);
 assert.notEqual(a.tracks[1].id,b.tracks[1].id);
});

test('Pop and Rumba are warm organic arrangements, not synthetic demos',()=>{
 const pop=createGenreDemoSession('pop'),rumba=createGenreDemoSession('rumba');
 assert.ok(pop.tracks.some(t=>t.type==='piano'));
 assert.ok(pop.tracks.some(t=>t.type==='wlsteel'));
 assert.ok(!pop.tracks.some(t=>t.type==='wlspectral'||t.type==='wlvirtual'));
 assert.deepEqual(rumba.tracks.slice(1,6).map(t=>t.type),['wlnylon','wlclean','wlmuted','wlsteel','wljazz']);
 assert.ok(!rumba.tracks.some(t=>t.type==='wlrompler'));
 assert.equal(rumba.demoRevision,2);
 assert.equal(pop.demoRevision,2);
 assert.ok(rumba.tracks[2].clips[0].notes.length>=20,'sebene melodic movement');
 assert.ok(pop.tracks[2].clips[3].notes.length>=20,'Pop refrain melodic hook');
});
