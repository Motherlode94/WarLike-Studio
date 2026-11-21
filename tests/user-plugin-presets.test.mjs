import test from 'node:test';import assert from 'node:assert/strict';
import {capturePreset,storePreset,userPresets,removePreset,applyUserPreset} from '../dist/user-plugin-presets.js';
import {filterPresetChoices} from '../dist/plugin-picker.js';
const def={name:'EQ test',controls:[{key:'gain',min:-12,max:12,default:0}]};
const storage=()=>{const data=new Map();return {getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};};
test('portable user bank is plugin scoped and persists across callers',()=>{const s=storage(),p=capturePreset('eq',def,{gain:3},'Voix claire');storePreset(s,p,'eq',def);let state={enabled:false};applyUserPreset(state,userPresets(s,'eq',def)[0],'eq',def);assert.deepEqual(state,{enabled:false,gain:3});assert.deepEqual(userPresets(s,'other',def),[]);assert.throws(()=>storePreset(s,{...p,values:{gain:99}},'eq',def));assert.throws(()=>storePreset(s,p,'other',def));removePreset(s,'eq',p.name);assert.deepEqual(userPresets(s,'eq',def),[]);});
test('preset search filters by name, source and plugin',()=>{const banks={eq:[{name:'Voix claire',source:'user'},{name:'Flat',source:'factory'}]};assert.equal(filterPresetChoices({eq:def},banks,{query:'voix EQ',source:'user'}).length,1);assert.equal(filterPresetChoices({eq:def},banks,{query:'voix',source:'factory'}).length,0);});
