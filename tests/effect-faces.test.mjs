import test from 'node:test';
import assert from 'node:assert/strict';
import {EFFECTS,formatParam} from '../dist/plugins.js';
import {effectFace,effectReadout,effectDialFraction,effectHardwareIdentity} from '../dist/effect-face-model.js';

test('R08.3g.5: every native effect has a deterministic independent panel preserving all its controls',()=>{
 const source=JSON.stringify(EFFECTS),definitions=Object.entries(EFFECTS),kinds=new Set();
 assert.equal(definitions.length,48,'Studio must register 44 effects');
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

test('each of 40 native effects gets a stable individual engraved hardware identity',()=>{
 const before=JSON.stringify(EFFECTS),identities=new Map(),housings=new Set();
 for(const [id,definition] of Object.entries(EFFECTS)){
  const a=effectHardwareIdentity(id,definition),b=effectHardwareIdentity(id,definition);
  assert.deepEqual(a,b,id+' non-deterministic visual identity');
  assert(Object.isFrozen(a),id+' mutable hardware identity');
  assert.match(a.engraving,/^[A-Z0-9]{1,6}$/);
  assert.match(a.serial,/^\d{4}$/);
  assert.match(a.accent,/^hsl\(\d+ 68% 75%\)$/);
  assert(!identities.has(a.variant),id+' duplicates a hardware variant');
  identities.set(a.variant,id);housings.add(a.geometry);
 }
 assert.equal(identities.size,48);
 assert.equal(housings.size,4,'all four native housing styles must be represented');
 assert.equal(JSON.stringify(EFFECTS),before,'visual identities must not modify the DSP registry');
 assert.throws(()=>effectHardwareIdentity('unknown',null),/invalide/);
});
