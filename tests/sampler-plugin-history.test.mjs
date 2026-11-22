import test from 'node:test';
import assert from 'node:assert/strict';
import {PluginEditHistory,capturePluginEdit,applyPluginEdit} from '../dist/plugin-edit-history.js';
import {SAMPLER_INSTRUMENT,sliceSettings} from '../dist/sampler.js';
import {createContentTrack} from '../dist/content.js';
import {placeInsert,EFFECTS} from '../dist/plugins.js';

const track=()=>{
 const t=createContentTrack('sampler');
 t.sampler=sliceSettings({assetId:'sample1',markers:[0,.5,1]},1);
 t.clips=[{id:'notes1',start:0,length:2,notes:[{midi:60,step:0,len:2}]}];t.output='bus1';
 placeInsert(t,0,'glue');return t;
};
const snapshot=t=>capturePluginEdit(t,'instrument',SAMPLER_INSTRUMENT);

test('sampler settings undo in edit order before an older instrument knob adjustment',()=>{
 const t=track(),h=new PluginEditHistory(),states=[snapshot(t)];
 h.observe('sampler','sampler',states[0],0);
 const edits=[()=>t.instrument.transpose=7,()=>t.sampler.reverse=true,()=>t.sampler.root=48,
  ()=>t.sampler.mode='chromatic',()=>t.sampler.markers=[0,.25,.5,.75,1],()=>t.sampler.assetId='sample2'];
 edits.forEach((edit,i)=>{edit();states.push(snapshot(t));h.observe('sampler','sampler',states.at(-1),i+1);});
 const unrelated={clips:structuredClone(t.clips),effects:structuredClone(t.effects),output:t.output};
 for(let i=edits.length-1;i>=0;i--){
  assert(applyPluginEdit(t,'instrument',SAMPLER_INSTRUMENT,h.step('sampler')));
  assert.deepEqual(snapshot(t),states[i]);assert.deepEqual({clips:t.clips,effects:t.effects,output:t.output},unrelated);
 }
 for(let i=1;i<states.length;i++){
  assert(applyPluginEdit(t,'instrument',SAMPLER_INSTRUMENT,h.step('sampler',true)));
  assert.deepEqual(snapshot(t),states[i]);
 }
});
test('UI defaults and normalization do not add phantom sampler history steps',()=>{
 const t=createContentTrack('sampler'),h=new PluginEditHistory();
 const empty=snapshot(t);h.observe('s','sampler',empty,0);
 t.sampler=sliceSettings({},0);h.observe('s','sampler',snapshot(t),1);assert.equal(h.canUndo('s'),false);
 t.sampler={assetId:'sample1',markers:[0,.8,.4,.4,1],root:60,mode:'slices'};
 h.observe('s','sampler',snapshot(t),2);
 const captured=snapshot(t);t.sampler=sliceSettings(t.sampler,1);
 h.observe('s','sampler',snapshot(t),3);assert.deepEqual(snapshot(t),captured);
 assert.deepEqual(h.step('s'),empty,'One import creates one step despite UI normalization');
});
test('snapshots own their cuts and invalid sampler restoration is atomic',()=>{
 const t=track(),saved=snapshot(t);
 t.sampler.markers[1]=.75;assert.deepEqual(saved.sampler.markers,[0,.5,1]);
 assert(applyPluginEdit(t,'instrument',SAMPLER_INSTRUMENT,saved));
 saved.sampler.markers[1]=.2;assert.deepEqual(t.sampler.markers,[0,.5,1]);
 const before=structuredClone(t);
 for(const invalid of [null,{root:NaN},{root:128},{mode:'unknown'},{markers:[0,NaN,1]},{markers:[0,.8,.5,1]}]){
  const bad=snapshot(t);bad.values.transpose=-12;bad.sampler=invalid===null?null:{...bad.sampler,...invalid};
  assert.equal(applyPluginEdit(t,'instrument',SAMPLER_INSTRUMENT,bad),false);
  assert.deepEqual(t,before,'A rejected sampler snapshot must not apply even its valid knob changes');
 }
});
test('effect history on a sampler track cannot revert sample settings',()=>{
 const t=track(),saved=capturePluginEdit(t,'glue',EFFECTS.glue);
 assert.equal(Object.hasOwn(saved,'sampler'),false);
 t.sampler.reverse=true;t.sampler.root=42;const current=structuredClone(t.sampler);
 t.effects.glue.threshold=-5;
 assert(applyPluginEdit(t,'glue',EFFECTS.glue,saved));assert.deepEqual(t.sampler,current);
});
