import test from 'node:test';
import assert from 'node:assert/strict';
import {EFFECTS,formatParam} from '../dist/plugins.js';
import {effectFace,effectReadout,effectDialFraction} from '../dist/effect-face-model.js';

test('R08.3g.5: every native effect has a deterministic independent panel preserving all its controls',()=>{
 const source=JSON.stringify(EFFECTS),definitions=Object.entries(EFFECTS),kinds=new Set();
 assert.equal(definitions.length,38,'Studio must preserve 38 effects');
 let total=0;
 for(const [id,def] of definitions){
  const panel=effectFace(id,def);assert.ok(panel,id+' missing face');
  assert.ok(panel.kind&&panel.label&&panel.focus.length>=1&&panel.focus.length<=2,id);
  const keys=def.controls.map(c=>c.key),covered=panel.groups.flatMap(g=>g.keys);
  assert.deepEqual(covered.slice().sort(),keys.slice().sort(),id+' lost control');
  assert.equal(new Set(covered).size,keys.length,id+' duplicated control');
  assert.ok(panel.focus.every(k=>keys.includes(k)),id+' invalid readout');
  assert.ok(panel.groups.every(g=>g.name&&g.keys.length),id+' empty group');
  for(const c of def.controls){
   assert.equal(effectReadout(c,c.default,formatParam),formatParam(c,c.default),id+' output');
   assert.ok(effectDialFraction(c,c.min)>=0&&effectDialFraction(c,c.max)<=1,id+' dial range');
  }
  kinds.add(panel.kind);total+=keys.length;
 }
 assert.ok(kinds.size>=6,'Panels must use different audio processor families');
 assert.equal(source,JSON.stringify(EFFECTS),'Presentation must not mutate the DSP registry');
});
test('readouts are real control values, not fake signal meters',()=>{
 const c=EFFECTS.glue.controls.find(c=>c.key==='threshold');
 assert.equal(effectReadout(c,-12,formatParam),formatParam(c,-12));
 assert.equal(effectDialFraction(c,c.min),0);
 assert.equal(effectDialFraction(c,c.max),1);
 assert.equal(effectFace('__proto__',null),null);
 assert.notEqual(effectFace('prism',EFFECTS.prism).kind,effectFace('glue',EFFECTS.glue).kind);
});
