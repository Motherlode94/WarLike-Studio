import test from 'node:test';
import assert from 'node:assert/strict';
import {INSTRUMENTS,formatParam} from '../dist/plugins.js';
import {INSTRUMENT_FACES,instrumentFace,planInstrumentBanks,instrumentReadout,instrumentHardwareIdentity,instrumentPerformanceDeck} from '../dist/instrument-face-model.js';
import {expansionBanks} from '../dist/expansion-hardware-model.js';

test('individual presentation covers all 42 instruments and exactly their 314 original parameters',()=>{
 assert.deepEqual(Object.keys(INSTRUMENT_FACES).sort(),Object.keys(INSTRUMENTS).sort());let count=0;
 for(const [id,def]of Object.entries(INSTRUMENTS)){
  const face=instrumentFace(id),keys=def.controls.map(c=>c.key),groups=face.banks.length?face.banks.map(b=>b.keys):expansionBanks(id).map(b=>b[1]);
  assert.ok(face.family&&face.material&&face.layout&&face.motif,id);assert.deepEqual(groups.flat().sort(),keys.slice().sort(),id);
  assert.equal(new Set(groups.flat()).size,keys.length,id+' duplicate controls');assert.equal(face.focus.length,2);assert.ok(face.focus.every(k=>keys.includes(k)),id+' invalid readout');count+=keys.length;
 }
 assert.equal(count,314);assert.ok(new Set(Object.values(INSTRUMENT_FACES).map(f=>f.layout)).size>=14);
 assert.notEqual(instrumentFace('harp').layout,instrumentFace('flute').layout);
 assert.notDeepEqual(instrumentFace('wlsteel'),instrumentFace('wlcrunch'));
});
test('EXO banks preserve its separate macros, advanced controls and native selectors',()=>{
 const controls=INSTRUMENTS.exo.controls,macro=controls.slice(0,8).map(c=>c.key),selects=['waveA','waveB','arpMode'],advanced=controls.slice(8).map(c=>c.key).filter(k=>!selects.includes(k));
 const before=JSON.stringify(INSTRUMENT_FACES),plan=planInstrumentBanks('exo',[macro,advanced,selects]);assert.ok(plan);
 for(const [i,keys]of [macro,advanced,selects].entries())assert.deepEqual(plan[i].flatMap(b=>b.keys).sort(),keys.slice().sort());
 assert.equal(JSON.stringify(INSTRUMENT_FACES),before);assert.equal(planInstrumentBanks('harp',[['brightness']]),null);
 assert.equal(planInstrumentBanks('unknown',[]),null);assert.equal(instrumentFace('toString'),null);
 assert.equal(planInstrumentBanks('bass',[['body','body','release']]),null);
});
test('configured readouts use real parameter values, including native voice and kit names',()=>{
 const c=(id,key)=>INSTRUMENTS[id].controls.find(c=>c.key===key);
 assert.equal(instrumentReadout('origins',c('origins','voice'),29,formatParam),'Bansuri');
 assert.equal(instrumentReadout('wlvox',c('wlvox','vowel'),4,formatParam),'Ou');
 assert.equal(instrumentReadout('drums',c('drums','kit'),4,formatParam),'Baile');
 assert.equal(instrumentReadout('harp',c('harp','release'),.5,formatParam),'0.50 s');
 assert.equal(instrumentReadout('wlvirtual',c('wlvirtual','cutoff'),3200,formatParam),'3.2 kHz');
});

test('all 42 instruments receive unique stable hardware plates without changing their native controls',()=>{
 const before=JSON.stringify(INSTRUMENTS),seen=new Set(),chassis=new Set();
 for(const id of Object.keys(INSTRUMENTS)){
  const first=instrumentHardwareIdentity(id),second=instrumentHardwareIdentity(id);
  assert.deepEqual(first,second,id+' faceplate must remain stable');
  assert(Object.isFrozen(first));
  assert.match(first.engraving,/^[A-Z0-9]{1,8}$/);
  assert.match(first.serial,/^\d{4}$/);
  assert(!seen.has(first.variant),id+' must have an individual faceplate');
  assert(first.notches>=2&&first.notches<=6);
  seen.add(first.variant);chassis.add(first.chassis);
 }
 assert.equal(seen.size,42);
 assert.equal(chassis.size,4);
 assert.equal(JSON.stringify(INSTRUMENTS),before,'visual identities cannot alter the DSP registry');
 assert.throws(()=>instrumentHardwareIdentity('unknown'),/inconnu/);
});

test('acoustic and synth performance decks reference only real native controls',()=>{
 const ids=['piano','upright','epiano','harp','violin','cello','flute','trumpet','wlvirtual','wlrompler','wlspectral'];
 const before=JSON.stringify(INSTRUMENTS),types=new Set();
 for(const id of ids){
  const def=INSTRUMENTS[id],deck=instrumentPerformanceDeck(id,def);
  assert.ok(deck,id+' performance deck missing');
  assert(Object.isFrozen(deck)&&Object.isFrozen(deck.keys));
  assert.equal(deck.keys.length,2,id+' must place two genuine original controls');
  assert.equal(new Set(deck.keys).size,2);
  assert(deck.keys.every(key=>def.controls.some(control=>control.key===key)),id+' invalid native control');
  types.add(deck.type);
  assert.deepEqual(instrumentPerformanceDeck(id,def),deck);
 }
 assert.equal(types.size,8,'acoustic and synthesis decks should not share one generic layout');
 assert.equal(instrumentPerformanceDeck('sampler',INSTRUMENTS.sampler),null);
 assert.equal(instrumentPerformanceDeck('piano',{controls:[]}),null);
 assert.equal(JSON.stringify(INSTRUMENTS),before,'performance decks must never touch sound presets or DSP');
});
