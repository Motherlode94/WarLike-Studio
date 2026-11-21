import test from 'node:test';
import assert from 'node:assert/strict';
import {mixPublicDemoInstruments,instrumentMixRole} from '../dist/demo-instrument-mix.js';
import {createContentTrack} from '../dist/content.js';
import {effectType,placeInsert} from '../dist/plugins.js';
const track=(type,name)=>{const t=createContentTrack(type,0);t.name=name;t.clips=[{id:'clip'}];return t;};
test('instrument roles distinguish bass, percussion and textures',()=>{
 assert.equal(instrumentMixRole(track('drums','HI-HAT ROLLS')),'hats');
 assert.equal(instrumentMixRole(track('wlvirtual','SOUL BASS')),'bass');
 assert.equal(instrumentMixRole(track('wlrompler','TEXTURE')),'texture');
});
test('factory mix preserves arrangement, master and existing effects',()=>{
 const bass=track('bass','808'), piano=track('piano','Piano'), voice=track('keys','Voice');voice.type='audio';
 placeInsert(piano,0,'aura');const old=structuredClone(piano.effects.aura);
 const p={publicDemo:true,masterVolume:-9,tracks:[bass,piano,voice]};
 const v=structuredClone(voice),clips=structuredClone(piano.clips);
 mixPublicDemoInstruments(p);
 assert.ok(bass.inserts.filter(Boolean).map(effectType).includes('vectorcomp'));
 assert.equal(bass.effects.sculpt.highpass,25);
 assert.deepEqual(piano.effects.aura,old);assert.deepEqual(piano.clips,clips);
 assert.deepEqual(voice,v);assert.equal(p.masterVolume,-9);
 const snap=structuredClone(p);mixPublicDemoInstruments(p);assert.deepEqual(p,snap);
});
test('non-public projects remain untouched',()=>{
 const p={tracks:[track('bass','Bass')]};const before=structuredClone(p);
 mixPublicDemoInstruments(p);assert.deepEqual(p,before);
});
