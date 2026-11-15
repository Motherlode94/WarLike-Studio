import test from 'node:test';
import assert from 'node:assert/strict';
import {VOXPRO_MODULES,VOXPRO_PACK,VOXPRO_STARTER_MODULES,VOXPRO_SIGNAL_ORDER} from '../dist/voxlab-pro-spec.js';
import {STUDIO_PACKS,STUDIO_EFFECTS} from '../dist/studio-packs.js';
import {EFFECTS} from '../dist/plugins.js';
test('VOX LAB PRO specifies twelve distinct processor contracts, without advertising nonexistent DSP',()=>{
 const ids=Object.keys(VOXPRO_MODULES);
 assert.equal(ids.length,12);
 assert.deepEqual(VOXPRO_PACK.modules,ids);
 assert.equal(new Set(ids).size,12);
 const allControls=['key','min','max','step','default'];
 for(const [id,e] of Object.entries(VOXPRO_MODULES)){
  assert.equal(e.pack,'voxpro');assert.ok(e.processor);assert.ok(e.description);
  assert.ok(e.controls.length>=3,id);
  assert.equal(new Set(e.controls.map(c=>c.key)).size,e.controls.length,id);
  for(const control of e.controls){
   for(const key of allControls)assert.ok(control[key]!==undefined,id+':'+key);
   assert.ok(control.min<=control.default&&control.default<=control.max,id+':'+control.key);
   assert.ok(control.step>0,id+':'+control.key);
  }
  assert.equal(Object.hasOwn(STUDIO_EFFECTS,id),['voxmicmodel','voxwarm','voxdoubler'].includes(id),id+' must be registered only when DSP is implemented');
 }
 const order=VOXPRO_SIGNAL_ORDER.flatMap(section=>section[1]);
 assert.equal(order.length,ids.length);
 assert.deepEqual(new Set(order),new Set(ids));
});
test('VOX LAB PRO starter includes only real registered Web Audio processors',()=>{
 assert.deepEqual(STUDIO_PACKS.voxpro.modules,[...VOXPRO_STARTER_MODULES,'voxmicmodel','voxwarm','voxdoubler']);
 assert.equal(VOXPRO_STARTER_MODULES.length,7);
 for(const id of VOXPRO_STARTER_MODULES){
  assert.ok(EFFECTS[id],id+' missing from the actual effect registry');
  assert.ok(EFFECTS[id].controls?.length,id+' is missing controls');
 }
});
