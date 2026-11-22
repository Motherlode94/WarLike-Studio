import test from 'node:test';
import assert from 'node:assert/strict';
import {INSTRU_PRESETS,INSTRU_CATEGORIES,instruValues,applyInstruPreset,instruPhrase,findInstruPreset} from '../dist/instru-presets.js';
import {filterInstruPresets} from '../dist/instru-bank-ui.js';
import {INSTRUMENTS,pluginDefaults,placeInsert} from '../dist/plugins.js';
import {FACTORY_PRESETS} from '../dist/bundle.js';
import {createContentTrack} from '../dist/content.js';

test('Instru bank contains 152 original sounds on 41 engines and valid full parameter states',()=>{
 assert.equal(INSTRU_PRESETS.length,152);assert.equal(new Set(INSTRU_PRESETS.map(p=>p.id)).size,152);
 assert.deepEqual(new Set(INSTRU_PRESETS.map(p=>p.type)),new Set(Object.keys(INSTRUMENTS).filter(t=>t!=='sampler')));
 assert.equal(INSTRU_PRESETS.filter(p=>p.type==='harp').length,8);assert.equal(INSTRU_PRESETS.filter(p=>p.type==='flute').length,8);
 assert.equal(INSTRU_PRESETS.filter(p=>p.type==='wlvirtual').length,12);assert.equal(INSTRU_PRESETS.filter(p=>p.category==='Guitares'&&p.type!=='strum').length,42);
 assert.equal(INSTRU_CATEGORIES.length,9);
 for(const p of INSTRU_PRESETS){
  const def=INSTRUMENTS[p.type];assert.ok(p.description&&p.tags&&p.name);
  assert.deepEqual(Object.keys(instruValues(p.id)),def.controls.map(c=>c.key));
  for(const [key,value]of Object.entries(p.values)){
   const c=def.controls.find(c=>c.key===key);assert.ok(c,p.id+'.'+key);
   assert.ok(Number.isFinite(value)&&value>=c.min&&value<=c.max,p.id+'.'+key+' out of range');
   assert.ok(Math.abs((value-c.min)/c.step-Math.round((value-c.min)/c.step))<1e-6,p.id+'.'+key+' off control grid');
  }
 }
});
test('applying every Instru patch preserves notes, FX, routing and all pre-existing factory presets',()=>{
 const factory=JSON.stringify(FACTORY_PRESETS);
 for(const p of INSTRU_PRESETS){
  const track=createContentTrack(p.type);track.clips=[{id:'test',notes:[{midi:64,len:8,step:0,velocity:.5}]}];track.output='busone';track.sends=[{target:'auxone',gainDb:-18}];placeInsert(track,0,'glue');
  for(const c of INSTRUMENTS[p.type].controls)track.instrument[c.key]=c.max;
  const {instrument,...before}=structuredClone(track);applyInstruPreset(track,p.id);const {instrument:after,...rest}=track;
  assert.deepEqual(after,instruValues(p.id));assert.deepEqual(rest,before);
  const copy=instruValues(p.id);copy[Object.keys(copy)[0]]=999999;assert.notDeepEqual(instruValues(p.id),copy);
 }
 assert.equal(JSON.stringify(FACTORY_PRESETS),factory);
 const track=createContentTrack('sampler'),before=structuredClone(track);assert.throws(()=>applyInstruPreset(track,'harp-1'),/piste/);assert.deepEqual(track,before);
 assert.throws(()=>instruValues('missing'));assert.equal(findInstruPreset('toString'),null);
});
test('sounds have distinct synthesis settings, not gain-only aliases, with playable audition phrases',()=>{
 for(const type of new Set(INSTRU_PRESETS.map(p=>p.type))){
  const patches=INSTRU_PRESETS.filter(p=>p.type===type),keys=Object.keys(pluginDefaults(type).instrument).filter(k=>k!=='output'),signatures=patches.map(p=>JSON.stringify(keys.map(k=>instruValues(p.id)[k])));
  assert.equal(new Set(signatures).size,patches.length,type+' has duplicate sound settings');
 }
 for(const p of INSTRU_PRESETS){
  const notes=instruPhrase(p.id);assert.ok(notes.length);
  for(const n of notes)assert.ok(n.midi>=0&&n.midi<=127&&n.step>=0&&n.len>0&&n.step+n.len<=32&&n.velocity>0&&n.velocity<=1,p.id);
 }
 assert.ok(instruPhrase('exo-3').length>10,'EXO arp must be expanded for the audition and score');
});
test('bank search handles accents, multiword queries, instrument names and categories',()=>{
 assert.equal(filterInstruPresets('flute').filter(p=>p.type==='flute').length,8);
 assert.equal(filterInstruPresets('harpe').filter(p=>p.type==='harp').length,8);
 assert.equal(filterInstruPresets('wl vanguard').length,12);
 assert.ok(filterInstruPresets('supersaw').length);assert.ok(filterInstruPresets('pluck').length);
 assert.ok(filterInstruPresets('','Guitares').every(p=>p.category==='Guitares'));assert.equal(filterInstruPresets('notexistingsound').length,0);
});
