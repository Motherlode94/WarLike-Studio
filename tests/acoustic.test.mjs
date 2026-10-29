import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {ACOUSTIC_INSTRUMENTS,ACOUSTIC_BANKS,sampleZones,sampleSettings} from '../dist/acoustic.js';
import {loadAcousticBank} from '../dist/acoustic-audio.js';
import {ensurePlugins,changeInstrument,placeInsert} from '../dist/plugins.js';
import {createContentTrack,createContentClip} from '../dist/content.js';
import {exportRack,importRack} from '../dist/bundle.js';

test('twelve distinct recorded banks ship complete media and playable factory phrases',async()=>{
 assert.equal(Object.keys(ACOUSTIC_INSTRUMENTS).length,12);const hashes=new Set();let count=0;
 for(const [type,bank] of Object.entries(ACOUSTIC_BANKS)){assert.ok(bank.samples.length>=5);assert.ok(bank.range[1]>bank.range[0]);const track=createContentTrack(type);assert.equal(track.volume,-8);assert.equal(track.inserts.filter(Boolean).length,0);assert.ok(createContentClip(type,'test').notes.length);
  for(const zone of bank.samples){const data=await readFile(new URL('../dist/samples/'+zone.file,import.meta.url));assert.equal(data.length,zone.bytes);assert.ok(zone.root>=0&&zone.root<=127);assert.ok(zone.duration>.2);assert.ok(data.length>2048);if(bank.loop)assert.ok(zone.loopEnd>zone.loopStart&&zone.loopEnd<zone.duration);hashes.add(data.toString('base64'));count++;}
 }
 assert.equal(count,132);assert.equal(hashes.size,132);
});
test('piano velocity crossfades distinct recordings and transposition stays in tune',()=>{
 const bank=ACOUSTIC_BANKS.piano,root=bank.samples.find(a=>bank.samples.filter(b=>a.root===b.root).length===2).root;
 const soft=sampleZones('piano',root,.1),hard=sampleZones('piano',root,1),middle=sampleZones('piano',root,.525);
 assert.notEqual(soft[0].file,hard[0].file);assert.equal(middle.length,2);assert.ok(Math.abs(middle.reduce((n,z)=>n+z.weight*z.weight,0)-1)<1e-8);
 const zone=sampleZones('piano',root,.5,{transpose:12})[0];assert.ok(Math.abs(zone.root+12*Math.log2(zone.rate)-(root+12))<1e-8);
 for(const type of Object.keys(ACOUSTIC_INSTRUMENTS))for(const n of [0,21,60,108,127])for(const z of sampleZones(type,n,.5))assert.ok(Number.isFinite(z.rate)&&z.rate>0);
});
test('instrument controls retain zero values and sanitize imported settings',()=>{const p=sampleSettings('piano',{output:0,width:0,attack:NaN,transpose:999});assert.equal(p.width,0);assert.equal(p.output,0);assert.equal(p.transpose,24);assert.equal(p.attack,.001);});
test('changing a melodic instrument preserves notes, patterns and independent inserts',()=>{
 const tr=createContentTrack('keys');tr.clips=[createContentClip('keys','Accords')];placeInsert(tr,0,'prism');const clips=structuredClone(tr.clips),effects=structuredClone(tr.effects),inserts=[...tr.inserts];changeInstrument(tr,'piano');assert.deepEqual(tr.clips,clips);assert.deepEqual(tr.effects,effects);assert.deepEqual(tr.inserts,inserts);assert.ok(tr.instrument.dynamics);
 const rack=exportRack(tr),copy={type:'piano'};ensurePlugins(copy);importRack(copy,rack);assert.deepEqual(exportRack(copy),rack);assert.throws(()=>changeInstrument(tr,'drums'));assert.throws(()=>changeInstrument({type:'audio'},'piano'));
});
test('failed bank loads reject clearly and can be retried without a synthesized substitution',async()=>{
 const previous=globalThis.fetch;let calls=0;const ctx={sampleRate:22050,decodeAudioData:async()=>({length:8,numberOfChannels:2})};
 try{globalThis.fetch=async()=>{throw Error('offline');};await assert.rejects(loadAcousticBank(ctx,'vibes'),/Chargement.*impossible/);
  globalThis.fetch=async()=>{calls++;return {ok:true,arrayBuffer:async()=>new ArrayBuffer(8)};};const bank=await loadAcousticBank(ctx,'vibes');assert.equal(bank.size,ACOUSTIC_BANKS.vibes.samples.length);await loadAcousticBank(ctx,'vibes');assert.equal(calls,bank.size);
 }finally{globalThis.fetch=previous;}
});
