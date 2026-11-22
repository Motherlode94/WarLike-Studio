import test from 'node:test';
import assert from 'node:assert/strict';
import {PluginEditHistory,capturePluginEdit,applyPluginEdit} from '../dist/plugin-edit-history.js';
import {createContentTrack} from '../dist/content.js';
import {placeInsert,EFFECTS,INSTRUMENTS,compareInsert} from '../dist/plugins.js';

test('undo and redo on one plugin preserve the independent history of another owner',()=>{
 const h=new PluginEditHistory(),a='trackA:glue',b='trackB:glue';
 h.observe(a,'glue',{gain:0},0);h.observe(b,'glue',{gain:10},0);
 h.observe(a,'glue',{gain:2},1);h.observe(b,'glue',{gain:12},2);
 const restored=h.step(a);assert.deepEqual(restored,{gain:0});restored.gain=99;
 assert.deepEqual(h.step(a,true),{gain:2});assert.deepEqual(h.step(b),{gain:10});
 assert.deepEqual(h.step(a),{gain:0},'Returned snapshots cannot mutate stored history');
});
test('a continuous gesture forms one step, new edits discard redo and history is bounded',()=>{
 const h=new PluginEditHistory(2);
 h.observe('a','v1',{gain:0},0);
 for(let i=1;i<=20;i++)h.observe('a','v1',{gain:i},1);
 assert.deepEqual(h.step('a'),{gain:0});assert.equal(h.canUndo('a'),false);
 h.observe('a','v1',{gain:3},2);assert.equal(h.canRedo('a'),false);
 h.observe('a','v1',{gain:4},3);h.observe('a','v1',{gain:5},4);
 assert.deepEqual(h.step('a'),{gain:4});assert.deepEqual(h.step('a'),{gain:3});assert.equal(h.step('a'),null);
 h.observe('a','new-instrument',{gain:9},5);assert.equal(h.canUndo('a'),false);assert.equal(h.canRedo('a'),false);
});
test('restoring an insert includes bypass and A/B state without touching clips, routing or other modules',()=>{
 const track=createContentTrack('lead');placeInsert(track,0,'glue');placeInsert(track,1,'color');
 track.output='bus1';track.clips=[{id:'clip1',start:0,length:2}];track.effects.glue.legacyField={keep:true};
 const original=structuredClone(track),before=capturePluginEdit(track,'glue',EFFECTS.glue);
 compareInsert(track,'glue','B');track.effects.glue.threshold=-5;track.effects.glue.enabled=false;
 assert(applyPluginEdit(track,'glue',EFFECTS.glue,before));
 assert.deepEqual(track.effects,original.effects);assert.deepEqual(track.instrument,original.instrument);
 assert.deepEqual(track.clips,original.clips);assert.equal(track.output,'bus1');assert.equal(track.pluginComparisons.glue,undefined);
 const h=new PluginEditHistory();h.observe('a','glue',before,0);
 compareInsert(track,'glue','B');track.effects.glue.threshold=-8;
 const after=capturePluginEdit(track,'glue',EFFECTS.glue);h.observe('a','glue',after,1);
 assert(applyPluginEdit(track,'glue',EFFECTS.glue,h.step('a')));
 assert(applyPluginEdit(track,'glue',EFFECTS.glue,h.step('a',true)));
 assert.equal(track.pluginComparisons.glue.active,'B');assert.equal(track.effects.glue.threshold,-8);
});
test('instrument restore and invalid snapshots never rewrite unrelated track data',()=>{
 const track=createContentTrack('lead');track.mute=true;track.instrument.future={keep:1};
 const before=capturePluginEdit(track,'instrument',INSTRUMENTS.lead),original=structuredClone(track);
 track.instrument.cutoff=500;
 assert(applyPluginEdit(track,'instrument',INSTRUMENTS.lead,before));assert.deepEqual(track,original);
 const broken=structuredClone(before);broken.values.cutoff=NaN;
 assert.equal(applyPluginEdit(track,'instrument',INSTRUMENTS.lead,broken),false);assert.deepEqual(track,original);
});
test('closing views or changing projects discards their transient history',()=>{
 const h=new PluginEditHistory();
 for(const key of ['a','b']){h.observe(key,'x',{v:0},0);h.observe(key,'x',{v:1},1);}
 h.forget('a');assert.equal(h.step('a'),null);assert.equal(h.canUndo('b'),true);
 h.clear();assert.equal(h.canUndo('b'),false);assert.equal(h.canRedo('b'),false);
});
