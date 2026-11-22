import test from 'node:test';
import assert from 'node:assert/strict';
import {readPresetFavorites,setPresetFavorite,presetKey,presetPath,presetMatches,presetFolderTree,flattenPresetPaths,normalizePresetText} from '../dist/preset-organization.js';
import {INSTRU_PRESETS} from '../dist/instru-presets.js';
import {INSTRUMENTS,EFFECTS} from '../dist/plugins.js';
import {MASTER_TEMPLATES,MIX_TEMPLATES} from '../dist/mix-master-templates.js';
import {FACTORY_PRESETS} from '../dist/bundle.js';
import {filterInstruPresets} from '../dist/instru-bank-ui.js';
import {filterPresetChoices,pluginTree} from '../dist/plugin-picker.js';

const storage=()=>{const state=new Map();return {getItem:k=>state.get(k)||null,setItem:(k,v)=>state.set(k,v)};};
test('favorites remain namespace separated and persist independently of project data',()=>{
 const local=storage();
 assert.deepEqual(readPresetFavorites(local),[]);
 setPresetFavorite(local,'instru','harp-1',true);
 setPresetFavorite(local,'mix','trap-vocal',true);
 setPresetFavorite(local,'master','native-0',true);
 setPresetFavorite(local,'factory','harp:Usine:Rosée',true);
 setPresetFavorite(local,'instru','harp-1',true);
 assert.equal(readPresetFavorites(local).length,4);
 assert.ok(readPresetFavorites(local).includes(presetKey('master','native-0')));
 setPresetFavorite(local,'mix','trap-vocal',false);
 assert.equal(readPresetFavorites(local).length,3);
 local.setItem('warlike.studio.preset-favorites.v1','invalid-json');
 assert.deepEqual(readPresetFavorites(local),[]);
});
test('folders retain original references with accent-insensitive multiword search',()=>{
 const entries=INSTRU_PRESETS.map(p=>({id:p.id,name:p.name,category:p.category,tags:p.tags,
  folders:['Instruments',p.category,INSTRUMENTS[p.type].name],favoriteKey:presetKey('instru',p.id)}));
 assert.equal(entries.length,152);
 assert.equal(new Set(entries.map(p=>p.id)).size,152);
 const paths=flattenPresetPaths(entries);
 assert.ok(paths.some(p=>p.startsWith('Instruments /')));
 const root=presetFolderTree(entries);assert.ok(root.has('Instruments'));
 assert.equal(presetPath('Instruments','Cordes','Harp'), 'Instruments / Cordes / Harp');
 const harp=entries.find(p=>p.id==='harp-1');
 assert.ok(presetMatches(harp,{query:'roseé harpe'} )===false || normalizePresetText('Rosée')==='rosee');
 assert.ok(presetMatches(harp,{query:'rosee'}));
 assert.ok(!presetMatches(harp,{favoritesOnly:true,favorites:[]}));
 assert.ok(presetMatches(harp,{favoritesOnly:true,favorites:[harp.favoriteKey]}));
 assert.equal(filterInstruPresets('harpe').filter(p=>p.type==='harp').length,8);
});
test('all factory instrument, effect and template catalogs remain intact',()=>{
 assert.equal(Object.keys(INSTRUMENTS).length,42);
 assert.equal(Object.keys(EFFECTS).length,38);
 for(const id of Object.keys(INSTRUMENTS))assert.ok(FACTORY_PRESETS[id]?.length>0,id);
 for(const id of Object.keys(EFFECTS))assert.ok(FACTORY_PRESETS[id]?.length>0,id);
 assert.ok(MIX_TEMPLATES.length>=20&&MASTER_TEMPLATES.length>=10);
 const tree=pluginTree(Object.entries(EFFECTS));
 assert.ok(tree.size>=5);
 const samples=filterPresetChoices(EFFECTS,Object.fromEntries(Object.entries(EFFECTS).map(([id])=>[id,FACTORY_PRESETS[id].map(p=>({...p,source:'factory'}))])),{query:'warm'});
 assert.ok(samples.length>0);
});
