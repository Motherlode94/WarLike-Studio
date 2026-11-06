import test from 'node:test';
import assert from 'node:assert/strict';
import {EFFECTS,ensurePlugins,placeInsert} from '../dist/plugins.js';
import {PACK_PRESETS,packTail} from '../dist/packs.js';
import {filterPluginChoices} from '../dist/plugin-picker.js';
const names=['tilteq','notch','slap'];
test('three new effects have valid controls and presets',()=>{
 for(const id of names){
  const def=EFFECTS[id];
  assert.ok(def?.controls.length>=3,id+' definition missing');
  const keys=new Set();
  for(const c of def.controls){
   assert.ok(!keys.has(c.key),'duplicate control '+id+'.'+c.key);keys.add(c.key);
   assert.ok(c.min<=c.default&&c.default<=c.max,'invalid default for '+id+'.'+c.key);
  }
  assert.ok(PACK_PRESETS[id]?.length>=3,'presets missing for '+id);
  for(const [name,values] of PACK_PRESETS[id])for(const [key,value] of Object.entries(values)){
   const c=def.controls.find(c=>c.key===key);
   assert.ok(c,name+' unknown parameter '+key);
   assert.ok(Number.isFinite(value)&&value>=c.min&&value<=c.max,name+' outside range '+key);
  }
 }
});
test('new effects are discoverable and can be inserted independently',()=>{
 const track={id:'qa',type:'audio',clips:[]};ensurePlugins(track);
 for(let i=0;i<names.length;i++){
  placeInsert(track,i,names[i]);
  assert.equal(track.inserts[i],names[i]);
  assert.equal(track.effects[names[i]].enabled,true);
 }
 assert.deepEqual(filterPluginChoices(EFFECTS,{query:'TILT EQ'}).map(([id])=>id),['tilteq']);
 assert.deepEqual(filterPluginChoices(EFFECTS,{query:'NOTCH'}).map(([id])=>id),['notch']);
 assert.deepEqual(filterPluginChoices(EFFECTS,{query:'SLAP'}).map(([id])=>id),['slap']);
});
test('slapback tail increases bounce duration during export',()=>{
 const a={effects:{slap:{enabled:true,time:240,feedback:.6,mix:.5}}};
 const project={bpm:120,tracks:[a],mastering:{}};
 assert.ok(packTail(project)>=3.2,'delay needs enough export tail');
});
