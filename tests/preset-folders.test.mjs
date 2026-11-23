import test from 'node:test';
import assert from 'node:assert/strict';
import {presetFolder,presetFolderTree,PRESET_SOURCES} from '../dist/preset-folders.js';
import {INSTRUMENTS,EFFECTS} from '../dist/plugins.js';
import {FACTORY_PRESETS} from '../dist/bundle.js';
import {filterPresetChoices,pluginBundle,pluginCategory} from '../dist/plugin-picker.js';

test('folders cover the factory catalog once without changing bank indices or data',()=>{
 const before=structuredClone(FACTORY_PRESETS);
 for(const registry of [INSTRUMENTS,EFFECTS]){
  const banks=Object.fromEntries(Object.keys(registry).map(id=>[id,(FACTORY_PRESETS[id]||[]).map((p,index)=>({...p,index,source:'factory'}))]));
  const choices=filterPresetChoices(registry,banks);
  const tree=presetFolderTree(choices,e=>[PRESET_SOURCES[e.preset.source],pluginBundle(e.id,e.def),pluginCategory(e.id,e.def),e.def.name,presetFolder(e.preset.name)]);
  const flatten=node=>[...node.entries,...[...node.children.values()].flatMap(flatten)];
  const leaves=flatten(tree);
  assert.equal(tree.count,choices.length);assert.equal(leaves.length,choices.length);
  assert.equal(new Set(leaves.map(e=>e.id+':'+e.preset.index)).size,choices.length);
  for(const e of leaves)assert.deepEqual(e.preset.values,FACTORY_PRESETS[e.id][e.preset.index].values);
 }
 assert.deepEqual(FACTORY_PRESETS,before);
});

test('explicit genre prefixes get named folders; unclassified names stay general',()=>{
 assert.equal(presetFolder('TRAP / Dark Pad'),'Trap');
 assert.equal(presetFolder('NEO SOUL / Keys'),'R&B / Neo Soul');
 assert.equal(presetFolder('R&B / Lead'),'R&B / Neo Soul');
 assert.equal(presetFolder('ALT ROCK / Guitar'),'Rock alternatif');
 assert.equal(presetFolder('Mon pad trap préféré'),'Général');
 assert.equal(presetFolder('<img src=x>'),'Général');
});

test('same-name presets remain distinct by source and processor under combined filters',()=>{
 const def=EFFECTS.glue,banks={glue:[{name:'Éclat',index:0,source:'factory'},{name:'Éclat',index:0,source:'user'}]};
 const choices=filterPresetChoices({glue:def},banks,{query:'eclat threshold'});
 const tree=presetFolderTree(choices,e=>[PRESET_SOURCES[e.preset.source],e.id]);
 assert.equal(tree.children.get('Usine').count,1);assert.equal(tree.children.get('Mes presets · cet appareil').count,1);
 assert.equal(filterPresetChoices({glue:def},banks,{query:'eclat',source:'user',favoritesOnly:true,favorites:['glue']}).length,1);
 assert.deepEqual(filterPresetChoices({glue:def},banks,{query:'eclat',source:'factory',favoritesOnly:true}),[]);
 assert.equal(presetFolderTree([],()=>[]).count,0);
});
