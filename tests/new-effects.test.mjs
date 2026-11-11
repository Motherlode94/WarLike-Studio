import test from 'node:test';
import assert from 'node:assert/strict';
import {EFFECTS,ensurePlugins,placeInsert} from '../dist/plugins.js';
import {PACK_PRESETS,packTail} from '../dist/packs.js';
import {filterPluginChoices} from '../dist/plugin-picker.js';
const names=['tilteq','notch','slap','phase','ring'];
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
test('PHASE and RING build distinct graphs, bypass correctly and release oscillators',async()=>{
 const {createPackProcessors,syncPackProcessors}=await import('../dist/pack-audio.js');
 const param=()=>({value:0,setValueAtTime(v){this.value=v},setTargetAtTime(v){this.value=v}});
 let started=0,stopped=0;const node=()=>({gain:param(),frequency:param(),Q:param(),connections:[],connect(to){this.connections.push(to)},disconnect(){this.connections=[]},start(){started++},stop(){stopped++}});
 const ctx={createGain:node,createBiquadFilter:node,createOscillator:node};
 const rack=createPackProcessors(ctx,node(),node(),{detached:true,types:['phase','ring']}),t={type:'audio',clips:[]};ensurePlugins(t);
 Object.assign(t.effects.phase,{enabled:true,frequency:600,rate:.3,depth:.6,mix:.5});Object.assign(t.effects.ring,{enabled:true,frequency:80,mix:.25,output:0});syncPackProcessors(rack,t.effects,120,0,true);
 assert.equal(rack.modules.phase.filters.length,4);assert.ok(rack.modules.phase.filters.every(f=>f.type==='allpass'));assert.equal(rack.modules.ring.amp.gain.value,0);assert.equal(rack.modules.ring.carrier.frequency.value,80);assert.equal(rack.modules.phase.blend.wet.gain.value,.5);
 t.effects.phase.enabled=false;t.effects.ring.enabled=false;syncPackProcessors(rack,t.effects,120,0,true);for(const id of ['phase','ring']){assert.equal(rack.modules[id].blend.wet.gain.value,0);assert.equal(rack.modules[id].blend.dry.gain.value,1)}rack.dispose();assert.equal(started,2);assert.equal(stopped,2);
});
