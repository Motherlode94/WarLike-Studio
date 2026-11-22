import test from 'node:test';import assert from 'node:assert/strict';import {EXPANSION_INSTRUMENTS,EXPANSION_PRESETS,EXPANSION_PACK} from '../dist/wl-expansion.js';import {INSTRUMENTS} from '../dist/plugins.js';import {FACTORY_PRESETS} from '../dist/bundle.js';import {createContentTrack,createContentClip} from '../dist/content.js';import {expansionSettings,grainCloud,expansionPCM,expansionBufferStats} from '../dist/wl-expansion-voices.js';import {pluginCategory} from '../dist/plugin-picker.js';
test('ten independently registered instruments and seventy valid factory patches',()=>{const ids=Object.keys(EXPANSION_INSTRUMENTS);assert.equal(ids.length,10);assert.deepEqual(EXPANSION_PACK.instruments,ids);for(const id of ids){const d=INSTRUMENTS[id];assert.equal(d.name,EXPANSION_INSTRUMENTS[id].name);assert.equal(pluginCategory(id,d),d.family);assert.equal(EXPANSION_PRESETS[id].length,7);assert.equal(FACTORY_PRESETS[id].length,7);for(let i=0;i<7;i++){const t=createContentTrack(id,i);assert.deepEqual(expansionSettings(id,t.instrument),t.instrument);assert.ok(createContentClip(id,'QA').notes.length>0);}}});
test('grain cloud deterministic, finite, responsive and bounded',()=>{const a={grain:.08,density:20,scatter:.45},x=grainCloud(8000,220,a);assert.deepEqual(x,grainCloud(8000,220,a));assert.ok(x.every(Number.isFinite));assert.ok(x.some(v=>Math.abs(v)>.01));assert.notDeepEqual(x,grainCloud(8000,220,{...a,density:30}));assert.notDeepEqual(x,grainCloud(8000,220,{...a,grain:.14}));});

test('four deterministic engines reuse PCM only for identical sound parameters',()=>{
 const ctx={sampleRate:8000,createBuffer(_c,n){return {length:n,copyToChannel(data){this.data=data.slice();}}}};
 for(const [id,key,value] of [['wltitan','pickup',.5],['wlkora','pluck',.5],['wlngoma','strike',.9],['wldrift','grain',.15]]){
  const p=expansionSettings(id),a=expansionPCM(ctx,id,220,p);
  assert.equal(expansionPCM(ctx,id,220,{...p,output:-20}),a);
  const b=expansionPCM(ctx,id,220,{...p,[key]:value});assert.notEqual(a,b);assert.notDeepEqual(a.data,b.data);
  if(id==='wlngoma')assert.equal(expansionPCM(ctx,id,440,p),a);else assert.notEqual(expansionPCM(ctx,id,440,p),a);
 }
 const stats=expansionBufferStats(ctx);assert.ok(stats.hits>=5);assert.ok(stats.entries<=32&&stats.bytes<=16*1024*1024);
});
