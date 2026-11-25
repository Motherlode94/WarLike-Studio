import test from 'node:test';
import assert from 'node:assert/strict';
import {HARDI_INSTRUMENTS,HARDI_EFFECTS,HARDI_PACKS,HARDI_INSTRUMENT_PRESETS,HARDI_EFFECT_PRESETS} from '../dist/hardi-suite.js';
import {INSTRUMENTS,EFFECTS,ensurePlugins,pluginDefaults} from '../dist/plugins.js';
import {presetsFor,applyFactoryPreset} from '../dist/bundle.js';
import {createFactorySession} from '../dist/content.js';
import {MASTER_MODULES,masteringSettings} from '../dist/mastering.js';
const names=Object.keys(HARDI_INSTRUMENTS),fx=Object.keys(HARDI_EFFECTS);
test('HARDI is 12 genuine registered instruments plus four distinct mix and master plugins',()=>{
 assert.equal(names.length,12);assert.equal(fx.length,4);
 assert.equal(new Set(names).size,12);
 assert.equal(new Set(fx).size,4);
 assert.deepEqual(HARDI_PACKS['hardi-instruments'].instruments,names);
 assert.deepEqual(HARDI_PACKS['hardi-mix-master'].modules,fx);
 for(const id of names){
  assert(INSTRUMENTS[id],id);assert(HARDI_INSTRUMENT_PRESETS[id].length>=3,id);
  const tr={type:id,clips:[]};ensurePlugins(tr);
  const preset=applyFactoryPreset(tr,'instrument',1);assert.equal(typeof preset,'string');
  for(const c of HARDI_INSTRUMENTS[id].controls)assert(tr.instrument[c.key]>=c.min&&tr.instrument[c.key]<=c.max,id+' '+c.key);
 }
 for(const id of fx){
  assert(EFFECTS[id],id);assert(MASTER_MODULES[id],id);
  assert(HARDI_EFFECT_PRESETS[id].length>=3,id);
  const track={type:'piano',clips:[]};ensurePlugins(track);
  applyFactoryPreset(track,id,1);
  assert(track.inserts.includes(id),id+' missing on rack');
  assert(track.effects[id].enabled===true,id+' not enabled');
  const master=masteringSettings({inserts:[id],[id]:{enabled:true}});
  assert(master[id].enabled&&master.inserts.includes(id),id+' missing on master');
 }
});
test('French pop demos use gentle HARDI mix coloring while legacy rock remains unaffected',()=>{
 for(const id of ['rnb-2005','popstar-2008','etoiles-interdites','derriere-les-murs','un-dernier-soleil','au-bord-du-ciel','promesses-de-pluie']){
  const song=createFactorySession(id,true);
  assert(song.tracks.slice(0,6).some(t=>t.inserts.includes('harditilt')),id);
  assert(song.tracks[0].inserts.includes('hardibus'),id);
  assert(song.tracks[0].effects.hardibus.mix<.3,id);
  assert(song.tracks[5].inserts.includes('hardistage'),id);
  assert(song.tracks.slice(-3).every(t=>t.type==='audio'));
 }
 assert(!createFactorySession('eclats',true).tracks.some(t=>t.inserts?.some(id=>id?.startsWith('hardi'))));
});
