import test from 'node:test';
import assert from 'node:assert/strict';
import {emptyProject} from '../dist/audio.js';
import {createContentTrack,createFactorySession} from '../dist/content.js';
import {ensurePlugins,placeInsert,moveInsert} from '../dist/plugins.js';
import {exportRack,importRack} from '../dist/bundle.js';
import {masteringSettings,applyMasterPreset} from '../dist/mastering.js';

test('new tracks and empty sessions have no placed or enabled effects',()=>{
  const p=emptyProject();assert.equal(p.demo,undefined);assert.deepEqual(p.tracks.map(t=>t.type),['audio']);assert.ok(p.tracks.every(t=>t.clips.length===0));
  for(const t of [...p.tracks,createContentTrack('keys'),{type:'audio'}]){ensurePlugins(t);assert.ok(t.inserts.every(id=>id===null));assert.ok(Object.values(t.effects).every(e=>e.enabled===false));}
  assert.ok(masteringSettings(p.mastering).inserts.every(id=>id===null));
  assert.ok(createFactorySession().tracks.some(t=>t.inserts.some(Boolean)));
});
test('insert removal, bypass, replacement and reordering retain independent controls',()=>{
  const t={type:'audio'};ensurePlugins(t);placeInsert(t,2,'color');t.effects.color.drive=.6;
  t.effects.color.enabled=false;ensurePlugins(t);assert.equal(t.inserts[2],'color');assert.equal(t.effects.color.drive,.6);
  moveInsert(t,2,0);assert.equal(t.inserts[0],'color');assert.equal(t.effects.color.enabled,false);
  placeInsert(t,0,'prism');assert.equal(t.effects.color.enabled,false);assert.equal(t.effects.prism.enabled,true);
  const duplicate=placeInsert(t,1,'prism');assert.notEqual(duplicate,'prism');assert.notEqual(t.effects[duplicate],t.effects.prism);placeInsert(t,1,null);assert.throws(()=>placeInsert(t,-1,'color'));
  placeInsert(t,0,null);assert.equal(t.effects.prism.enabled,false);ensurePlugins(t);assert.ok(t.inserts.every(id=>id===null));
  placeInsert(t,4,'color');assert.equal(t.effects.color.drive,.6);
});
test('rack round trips preserve empty positions, order and bypass without installing missing modules',()=>{
  const t={type:'audio'};ensurePlugins(t);placeInsert(t,5,'glue');placeInsert(t,0,'prism');t.effects.glue.enabled=false;
  const saved=exportRack(t),target={type:'audio'};importRack(target,saved);assert.deepEqual(exportRack(target),saved);
  delete saved.effects.color;importRack(target,saved);assert.equal(target.effects.color.enabled,false);assert.equal(target.inserts.includes('color'),false);
});
test('legacy active effects migrate in their audio order, and malformed slots cannot activate hidden modules',()=>{
  const t={type:'audio',effects:{echo:{enabled:true,mix:.2},color:{enabled:true,drive:.4},hush:{enabled:true,threshold:-30}}};ensurePlugins(t);
  assert.deepEqual(t.inserts.filter(Boolean),['hush','color','echo']);assert.equal(t.effects.color.drive,.4);
  t.inserts=['echo','echo','unknown'];ensurePlugins(t);assert.deepEqual(t.inserts.filter(Boolean),['echo']);assert.equal(t.effects.color.enabled,false);
});
test('master insert order and bypass survive settings and preset normalization',()=>{
  let state=masteringSettings({inserts:['peak',null,'press'],peak:{enabled:true},press:{enabled:false},balance:{enabled:true}});
  assert.deepEqual(state.inserts,['peak',null,'press',...Array(9).fill(null)]);assert.equal(state.balance.enabled,false);assert.equal(state.press.enabled,false);
  assert.deepEqual(masteringSettings(state),state);
  const p={};applyMasterPreset(p,2);assert.deepEqual(p.mastering.inserts,['balance','press','peak',...Array(9).fill(null)]);applyMasterPreset(p,0);assert.deepEqual(p.mastering.inserts,Array(12).fill(null));
});
