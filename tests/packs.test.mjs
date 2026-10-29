import test from 'node:test';
import assert from 'node:assert/strict';
import {EFFECT_PACKS,PACK_EFFECTS,gateControl,deessControl,gain,relayTimes,packTail} from '../dist/packs.js';
import {FACTORY_PRESETS,exportRack,importRack} from '../dist/bundle.js';
import {createFactorySession} from '../dist/content.js';

test('two original packs expose six processors and thirty complete presets',()=>{
  assert.equal(Object.keys(EFFECT_PACKS).length,2);assert.equal(Object.keys(PACK_EFFECTS).length,6);
  for(const pack of Object.values(EFFECT_PACKS))for(const id of pack.modules){assert.ok(PACK_EFFECTS[id]);assert.equal(FACTORY_PRESETS[id].length,5);for(const preset of FACTORY_PRESETS[id])for(const c of PACK_EFFECTS[id].controls)assert.ok(preset.values[c.key]>=c.min&&preset.values[c.key]<=c.max);}
});
test('envelope curves stay bounded, preserve quiet sibilants and obey maximum attenuation',()=>{
  assert.equal(gateControl(0,36),gain(-36));assert.equal(gateControl(.5,36),1);assert.equal(gateControl(0,0),1);
  assert.ok(deessControl(1/64,12)===0);assert.ok(deessControl(1,18,0)===0);
  let last=1;for(let i=0;i<=1000;i++){const value=1+deessControl(i/1000,9);assert.ok(value>=gain(-9)-1e-10&&value<=1);assert.ok(value<=last+1e-10);last=value;}
});
test('old racks retain their sound with every added pack module bypassed',()=>{
  const source=createFactorySession().tracks[0],rack=exportRack(source);for(const key of Object.keys(PACK_EFFECTS))delete rack.effects[key];
  const destination=createFactorySession().tracks[0];for(const key of Object.keys(PACK_EFFECTS))destination.effects[key].enabled=true;
  importRack(destination,rack);for(const key of Object.keys(PACK_EFFECTS))assert.equal(destination.effects[key].enabled,false);
  assert.deepEqual(destination.instrument,rack.instrument);assert.deepEqual(destination.effects.color,rack.effects.color);
});
test('tempo echo times and bounded export tails follow tempo and feedback',()=>{
  assert.deepEqual(relayTimes(120,.5),[.25,.375]);assert.deepEqual(relayTimes(60,2),[2,3]);
  const project=createFactorySession();assert.equal(packTail(project),4.5);Object.assign(project.tracks[0].effects.relay,{enabled:true,mix:.5,beats:2,feedback:.7});project.bpm=40;assert.equal(packTail(project),20);
  project.tracks[0].effects.relay.mix=0;assert.equal(packTail(project),4.5);
});
