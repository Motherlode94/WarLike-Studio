import test from 'node:test';
import assert from 'node:assert/strict';
import {INSTRUMENTS,EFFECTS,instrumentDefinition,ensurePlugins,changeInstrument} from '../dist/plugins.js';
import {filterPluginChoices,pluginCategory,pluginSearchText} from '../dist/plugin-picker.js';
import {AudioEngine} from '../dist/audio.js';
test('FX selection never returns instruments and instrument selection never returns FX',()=>{assert.equal(filterPluginChoices(EFFECTS).length,33);assert.equal(filterPluginChoices(INSTRUMENTS).length,20);assert.equal(filterPluginChoices(EFFECTS,{query:'GRAND'}).length,0);assert.equal(filterPluginChoices(INSTRUMENTS,{query:'GLUE'}).length,0);assert.deepEqual(filterPluginChoices(EFFECTS,{query:'reverberation'}).map(([id])=>id),['aura','exospace']);assert.deepEqual(filterPluginChoices(INSTRUMENTS,{category:'Cordes frottées'}).map(([id])=>id),['violin','cello']);assert.equal(pluginCategory('prism',EFFECTS.prism),'EQ');});
test('favorites remain scoped to the chosen kind of plugin',()=>{assert.deepEqual(filterPluginChoices(EFFECTS,{favorites:['piano','exoair'],favoritesOnly:true}).map(([id])=>id),['exoair']);assert.deepEqual(filterPluginChoices(INSTRUMENTS,{favorites:['piano','exoair'],favoritesOnly:true}).map(([id])=>id),['piano']);});
test('a new unassigned Instrument track stays silent and has no inserted plugin',()=>{const t={id:'midi',type:'instrument',clips:[{notes:[{midi:60}]}]};ensurePlugins(t);assert.deepEqual(t.instrument,{});assert.ok(t.inserts.every(id=>id===null));assert.equal(instrumentDefinition(t.type).name,'INSTRUMENT');assert.ok(!Object.keys(INSTRUMENTS).includes('instrument'));const e=new AudioEngine(()=>({tracks:[t]}),()=>new Map());assert.doesNotThrow(()=>e.synth({},null,'instrument',60,0,1));changeInstrument(t,'piano');assert.equal(t.type,'piano');assert.equal(t.clips[0].notes[0].midi,60);assert.ok(t.inserts.every(id=>id===null));});

test('new PHASE and RING processors are categorized as modulation, not synthesizers',()=>{
 assert.equal(pluginCategory('phase',EFFECTS.phase),'Modulation');
 assert.equal(pluginCategory('ring',EFFECTS.ring),'Modulation');
 const found=filterPluginChoices(EFFECTS,{category:'Modulation'});
 assert.ok(found.some(([id])=>id==='phase'));
 assert.ok(found.some(([id])=>id==='ring'));
});
test('search discovers effects from parameters, internal ID, pack and description',()=>{
 assert.ok(pluginSearchText('glue',EFFECTS.glue).includes('threshold'));
 assert.ok(filterPluginChoices(EFFECTS,{query:'threshold'}).some(([id])=>id==='glue'));
 assert.ok(filterPluginChoices(EFFECTS,{query:'glue threshold'}).some(([id])=>id==='glue'));
 assert.ok(filterPluginChoices(EFFECTS,{query:'ring'}).some(([id])=>id==='ring'));
 assert.deepEqual(filterPluginChoices(EFFECTS,{query:'this-plugin-does-not-exist'}),[]);
});
test('multiword plugin search is accent-insensitive and preserves favorites filters',()=>{
 const effect={name:'Éclat',subtitle:'Traitement spectral',description:'Brillance du son',
  controls:[{key:'tune',name:'Fréquence centrale'}]};
 const registry={test:effect};
 assert.deepEqual(filterPluginChoices(registry,{query:'frequence eclat'}).map(([id])=>id),['test']);
 assert.deepEqual(filterPluginChoices(registry,{query:'brillance tune'}).map(([id])=>id),['test']);
 assert.deepEqual(filterPluginChoices(registry,{query:'frequence',favoritesOnly:true,favorites:[]}),[]);
});
