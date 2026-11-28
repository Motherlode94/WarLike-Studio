import test from 'node:test';import assert from 'node:assert/strict';
import {voiceShiftFrames,voiceShiftLatency} from '../dist/voice-shift-timing.js';
import {effectLatency} from '../dist/dynamics-timing.js';
import {trackLatency,compensationDelays,routingLatency} from '../dist/studio-model.js';
import {moduleLatency} from '../dist/master-rack-model.js';
import {automationParameters} from '../dist/studio-workflow.js';
import {ensurePlugins,placeInsert,EFFECTS} from '../dist/plugins.js';
for(const rate of [44100,48000,96000])test('VOX SHIFT shares its exact center delay with tracks and rack at '+rate,()=>{
 const expected=Math.round(Math.max(512,Math.round(rate*.045))*2.5)/rate;
 assert.equal(voiceShiftLatency(rate),expected);assert.equal(effectLatency('voxshift__copy',rate),expected);assert.equal(moduleLatency('voxshift',rate),expected);
 const shifted={id:'a',type:'audio',inserts:['voxshift'],effects:{voxshift:{enabled:true}}},dry={id:'b',type:'audio',inserts:[],effects:{}};
 assert.equal(trackLatency(shifted,rate),expected);assert.equal(compensationDelays([shifted,dry],rate).get('b'),expected);assert.equal(routingLatency([shifted,dry],rate),expected);
 assert.equal(voiceShiftFrames(rate),expected*rate);
});
test('UI offers actual parameters for every EXO, HARDI and ELIANA family and instance',()=>{
 for(const id of Object.keys(EFFECTS).filter(id=>/^(exo|hardi|eliana)/.test(id))){const tr={id:'test',type:'audio',clips:[],volume:0,pan:0};ensurePlugins(tr);placeInsert(tr,0,id);const rows=automationParameters(tr).filter(x=>x.key.startsWith(id+':'));assert.ok(rows.length>0,id);for(const row of rows)assert.ok(Number.isFinite(row.value),row.key);}
});
test('unsupported curve and impulse rebuilds are not advertised as AudioParam automation',()=>{
 const tr={id:'test',type:'audio',clips:[],volume:0,pan:0};ensurePlugins(tr);placeInsert(tr,0,'exospace');placeInsert(tr,1,'harditape');const keys=automationParameters(tr).map(r=>r.key);assert.ok(!keys.includes('exospace:decay'));assert.ok(!keys.includes('harditape:drive'));assert.ok(keys.includes('exospace:mix'));assert.ok(keys.includes('harditape:tone'));
});
