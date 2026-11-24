import test from 'node:test';
import assert from 'node:assert/strict';
import {STUDIO_PACKS,STUDIO_EFFECTS,STUDIO_PRESETS} from '../dist/studio-packs.js';
import {EFFECTS,ensurePlugins} from '../dist/plugins.js';
import {VOX_STUDIORACKS,planVoxStudioRack,applyVoxStudioRack} from '../dist/vox-studioracks.js';

const track=()=>{const t={id:'voice-fx-qa',type:'audio',name:'Lead vocal',clips:[]};ensurePlugins(t);return t;};
test('VOX SHIFT and VOX FORMANT COLOR are real native effects with independent factory presets',()=>{
 assert.deepEqual(STUDIO_PACKS.voicefx.modules,['voxshift','voxformant']);
 for(const id of STUDIO_PACKS.voicefx.modules){
  assert.deepEqual(EFFECTS[id],STUDIO_EFFECTS[id]);
  assert(STUDIO_PRESETS[id].length>=5);
  assert.equal(EFFECTS[id].defaultEnabled,false);
  for(const control of EFFECTS[id].controls){
   assert(Number.isFinite(control.default)&&control.default>=control.min&&control.default<=control.max);
  }
 }
 assert.equal(EFFECTS.voxshift.controls.find(c=>c.key==='semitones').max,12);
 assert.equal(EFFECTS.voxformant.controls.find(c=>c.key==='shift').max,6);
});
test('futurist lead and baby voice racks install unique editable effects and exact parameters',()=>{
 for(const id of ['futuristLead','babyVoice','babyAdlibs']){
  const t=track(),original=structuredClone(t);
  const plan=planVoxStudioRack(t,id);
  assert(plan.canApply);
  assert.deepEqual(t,original,'preview must never modify voice');
  assert(plan.stages.some(s=>s.id==='voxshift'),id+' lacks actual transposition effect');
  assert.equal(new Set(plan.stages.map(s=>s.id)).size,plan.stages.length);
  const added=applyVoxStudioRack(t,id);
  assert.equal(added.length,plan.stages.length);
  assert.equal(t.voxStudioRack.preset,id);
  for(let i=0;i<added.length;i++){
   const state=t.effects[added[i].id],expected=plan.stages[i];
   assert.equal(added[i].id,expected.id);
   assert.equal(state.enabled,true);
   for(const [key,value] of Object.entries(expected.values))assert.equal(state[key],value);
  }
  const restored=JSON.parse(JSON.stringify(t));
  assert.deepEqual(restored.voxStudioRack,t.voxStudioRack);
  assert.deepEqual(restored.inserts,t.inserts);
  assert.equal(restored.effects.voxshift.semitones,t.effects.voxshift.semitones);
 }
});
