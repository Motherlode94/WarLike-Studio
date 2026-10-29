import test from 'node:test';
import assert from 'node:assert/strict';
import {EXO_PRESETS,EXO_INSTRUMENT,exoSettings,exoArpeggiate,exoChannelMap} from '../dist/exo.js';
import {EXO_EFFECTS} from '../dist/exo-pack.js';
import {ensurePlugins,placeInsert,copyInsert} from '../dist/plugins.js';
import {applyFactoryPreset,exportRack,importRack} from '../dist/bundle.js';
import {createContentTrack,createContentClip} from '../dist/content.js';
import {trackLatency} from '../dist/studio-model.js';
import {packTail} from '../dist/packs.js';

test('EXO offers 32 distinct original patches across eight categories with bounded parameters',()=>{
 assert.equal(EXO_PRESETS.length,32);assert.equal(new Set(EXO_PRESETS.map(p=>p.name)).size,32);assert.equal(new Set(EXO_PRESETS.map(p=>p.category)).size,8);
 const sounds=new Set();for(let i=0;i<32;i++){const t=createContentTrack('exo',i);assert.equal(t.inserts.filter(Boolean).length,0);assert.equal(t.volume,-8);sounds.add(JSON.stringify(t.instrument));for(const c of EXO_INSTRUMENT.controls)assert.ok(t.instrument[c.key]>=c.min&&t.instrument[c.key]<=c.max,presetMessage(i,c));}assert.equal(sounds.size,32);assert.ok(createContentClip('exo','EXO').notes.length>0);
});
function presetMessage(i,c){return EXO_PRESETS[i].name+' '+c.key;}
test('EXO sanitization retains zero values and valid layer choices',()=>{const state=exoSettings({blend:0,waveA:99,waveB:-4,output:0,fm:NaN,arpMode:3.7});assert.equal(state.blend,0);assert.equal(state.output,0);assert.equal(state.waveA,7);assert.equal(state.waveB,0);assert.equal(state.arpMode,4);assert.equal(state.fm,.25);});
test('arpeggiator follows held chords, octaves, direction, duration and velocity',()=>{
 const notes=[60,64,67].map(midi=>({midi,step:0,len:8,velocity:.6}));
 const base={arpMode:1,arpRate:1,arpOctaves:2,arpGate:.5};const up=exoArpeggiate(notes,8,base);assert.deepEqual(up.map(n=>n.midi),[60,64,67,72,76,79,60,64]);assert.ok(up.every(n=>n.len===.5&&n.velocity===.6));
 assert.deepEqual(exoArpeggiate(notes,8,{...base,arpMode:2,arpOctaves:1}).slice(0,4).map(n=>n.midi),[67,64,60,67]);
 assert.deepEqual(exoArpeggiate(notes,8,{...base,arpMode:3,arpOctaves:1}).slice(0,6).map(n=>n.midi),[60,64,67,64,60,64]);
 assert.equal(exoArpeggiate(notes,8,{...base,arpMode:4,arpOctaves:1}).length,24);
 const ending=exoArpeggiate([{midi:60,step:2,len:.25,velocity:.5}],4,base);assert.equal(ending.length,1);assert.equal(ending[0].step,2);assert.equal(ending[0].len,.25);
 assert.equal(exoArpeggiate(notes,8,{arpMode:0}),notes);assert.equal(exoArpeggiate([{...notes[0],muted:true}],8,base).length,0);
});
test('EXO racks and repeated effects preserve independent states and empty inserts',()=>{
 const t=createContentTrack('exo',27);applyFactoryPreset(t,'exostrip',0);copyInsert(t,0,1);const id=t.inserts[1];t.effects[id].presence=-4;const restored={type:'exo'};ensurePlugins(restored);importRack(restored,exportRack(t));assert.deepEqual(exportRack(restored),exportRack(t));assert.notEqual(restored.effects[id].presence,restored.effects.exostrip.presence);assert.equal(trackLatency(restored),.012);
 const legacy={type:'audio',inserts:[]};ensurePlugins(legacy);for(const id of Object.keys(EXO_EFFECTS))assert.equal(legacy.effects[id].enabled,false);
});
test('EXO SPACE tails include repeated instances and predelay',()=>{const t={type:'audio'};ensurePlugins(t);placeInsert(t,0,'exospace');copyInsert(t,0,1);Object.assign(t.effects[t.inserts[1]],{decay:6,predelay:150,mix:.4});assert.equal(packTail({bpm:120,tracks:[t]}),6.25);});
test('EXO processors preserve stereo introduced by an upstream insert',()=>{const t={type:'audio'};ensurePlugins(t);placeInsert(t,0,'exostrip');placeInsert(t,1,'exospace');copyInsert(t,0,2);const map=exoChannelMap(t,1);assert.equal(map.exostrip,1);assert.equal(map.exospace,1);assert.equal(map[t.inserts[2]],2);assert.equal(exoChannelMap(t,2).exostrip,2);});
