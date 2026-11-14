import test from 'node:test';
import assert from 'node:assert/strict';
import {parseReaperRpp,matchReaperMedia,reaperBasename} from '../dist/reaper-rpp.js';
import {NATIVE_CHAINS,suggestNativeReplacement,nativeEffectsForNames,applyNativeChain} from '../dist/native-vocal-chains.js';

const sample=`<REAPER_PROJECT 0.1 "7.5" 1700000000
  TEMPO 100 4 4
  <TRACK {AAA}
    NAME "Lead Voice"
    VOLPAN 0.5 -0.25 0 0
    MUTESOLO 0 1 0
    <FXCHAIN
      <VST "VST3: FabFilter Pro-Q 3" pro-q.vst3 0 "" 0
      >
      <VST "VST3: Antares Auto-Tune" tune.vst3 0 "" 0
      >
    >
    <ITEM
      POSITION 2.4
      LENGTH 4.8
      NAME "Take 1"
      <SOURCE WAVE
        FILE "Audio/Lead.wav"
      >
    >
  >
  <TRACK {BBB}
    NAME "Backing"
    <ITEM
      POSITION 7.2
      LENGTH 2.4
      <SOURCE WAVE
        FILE "Audio/Backing.wav"
      >
    >
    <ITEM
      POSITION 12
      LENGTH 1
      <SOURCE MIDI
      >
    >
  >
>`;
test('RPP parser extracts tracks, fixed tempo, timed audio, FX and unsupported MIDI warnings',()=>{
 const x=parseReaperRpp(sample,{name:'My Song.rpp'});
 assert.equal(x.project.name,'My Song');
 assert.equal(x.project.bpm,100);
 assert.equal(x.project.tracks.length,2);
 assert.equal(x.project.tracks[0].volume, -6.020599913279624);
 assert.equal(x.project.tracks[0].solo,true);
 assert.equal(x.project.tracks[0].clips[0].start,1);
 assert.equal(x.project.tracks[0].clips[0].length,2);
 assert.equal(x.assets.length,2);
 assert.equal(x.fxReport.length,1);
 assert.match(x.fxReport[0].plugins[0],/FabFilter/);
 assert.ok(x.warnings.some(s=>s.includes('MIDI')));
});
test('REAPER importer refuses malformed or hostile-sized files',()=>{
 assert.throws(()=>parseReaperRpp('<TRACK>'),/incomplet|mal fermé|REAPER_PROJECT/);
 assert.throws(()=>parseReaperRpp('x'.repeat(8_000_001)),/volumineux/);
 assert.throws(()=>parseReaperRpp('<REAPER_PROJECT\n  <TRACK\n>'),/incomplet/);
});
test('media resolver requires unique uploads and never resolves arbitrary filesystem paths',()=>{
 const parsed=parseReaperRpp(sample);
 const files=[{name:'Lead.wav'},{name:'Backing.wav'}];
 const matched=matchReaperMedia(parsed.assets,files);
 assert.equal(matched.matched.length,2);
 assert.deepEqual(matched.missing,[]);
 assert.equal(reaperBasename('C:\\Somewhere\\Lead.wav'),'lead.wav');
 const missing=matchReaperMedia(parsed.assets,[files[0]]);
 assert.deepEqual(missing.missing,['Audio/Backing.wav']);
 const ambiguity=matchReaperMedia([{path:'Audio/Lead.wav',audioId:'a'}],[{name:'Lead.wav'},{name:'Lead.wav'}]);
 assert.equal(ambiguity.ambiguous.length,1);
});
test('native effect suggestions do not impersonate proprietary preset state',()=>{
 assert.equal(suggestNativeReplacement('FabFilter Pro-Q 3'),'vectoreq');
 assert.equal(suggestNativeReplacement('Antares Auto-Tune Artist'),'voxtune');
 assert.equal(suggestNativeReplacement('Soundtoys EchoBoy'),'alterecho');
 assert.equal(suggestNativeReplacement('Unrecognized plugin'),null);
 assert.ok(NATIVE_CHAINS.modern.effects.length>=5);
 assert.deepEqual(nativeEffectsForNames(['FabFilter Pro-Q 3','ReaEQ']).map(x=>x.replacement),['vectoreq']);
});
test('native chains add working effect definitions to real track state',()=>{
 const tr={id:'a',type:'audio',name:'Lead',clips:[],volume:0,pan:0};
 applyNativeChain(tr,'modern');
 assert.ok(tr.inserts.includes('voxtune'));
 assert.ok(tr.inserts.includes('vectorcomp'));
 assert.equal(tr.effects.voxtune.enabled,true);
 assert.ok(tr.inserts.filter(Boolean).length>=5);
});
