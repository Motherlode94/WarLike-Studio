import test from 'node:test';
import assert from 'node:assert/strict';
import {INSTRUMENTS,EFFECTS,pluginDefaults,ensurePlugins,placeInsert,INSERT_COUNT} from '../dist/plugins.js';
import {FACTORY_PRESETS} from '../dist/bundle.js';

test('every registered instrument and effect has a factory preset bank',()=>{
  assert.equal(Object.keys(INSTRUMENTS).length,31);
  assert.equal(Object.keys(EFFECTS).length,38);
  for(const id of [...Object.keys(INSTRUMENTS),...Object.keys(EFFECTS)]){
    assert.ok(Array.isArray(FACTORY_PRESETS[id]),id+' is missing factory presets');
    assert.ok(FACTORY_PRESETS[id].length>0,id+' has an empty factory preset bank');
  }
});

test('every effect control has a finite default within its declared bounds',()=>{
  for(const [id,definition] of Object.entries(EFFECTS)){
    const keys=new Set();
    for(const control of definition.controls){
      assert.ok(!keys.has(control.key),id+' duplicates '+control.key);
      keys.add(control.key);
      for(const key of ['min','max','step','default'])assert.ok(Number.isFinite(control[key]),id+'.'+control.key+' '+key);
      assert.ok(control.min<=control.default&&control.default<=control.max,id+'.'+control.key+' default out of range');
      assert.ok(control.step>0,id+'.'+control.key+' step must be positive');
    }
  }
});

test('every effect can be inserted, persisted and bypassed without corrupting its track',()=>{
  for(const id of Object.keys(EFFECTS)){
    const track={type:'keys',clips:[{id:'original-clip',notes:[]}],...pluginDefaults('keys')};
    ensurePlugins(track);
    placeInsert(track,0,id);
    assert.equal(track.inserts.length,INSERT_COUNT);
    assert.equal(track.inserts[0],id);
    assert.equal(track.effects[id].enabled,true);
    track.effects[id].enabled=false;
    ensurePlugins(track);
    assert.equal(track.effects[id].enabled,false);
    assert.equal(track.clips[0].id,'original-clip');
  }
});
