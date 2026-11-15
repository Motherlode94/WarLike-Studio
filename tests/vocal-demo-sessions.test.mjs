import test from 'node:test';
import assert from 'node:assert/strict';
import {createVocalDemoSession,VOCAL_DEMOS} from '../dist/vocal-demo-sessions.js';
import {createVocalDemoMedia,synthVocalGuide} from '../dist/vocal-guide-audio.js';
import {readFileSync} from 'node:fs';

test('three recording-ready vocal sessions have editable native WarLike mixer inserts',()=>{
 for(const key of Object.keys(VOCAL_DEMOS)){
   const session=createVocalDemoSession(key);
   const vocalTracks=session.tracks.filter(track=>track.type==='audio');
   assert.equal(session.bars,16);
   assert.equal(vocalTracks.length,3);
   assert.equal(session.vocalDemoInfo.pluginMix,true);
   assert.equal(session.vocalDemoInfo.hasRecordedVoice,false);
   assert.ok(vocalTracks.every(track=>track.inserts.filter(Boolean).length>=3),key);
   assert.ok(vocalTracks.every(track=>track.inserts.every(insert=>!insert||track.effects[insert]?.enabled)),key);
   assert.ok(vocalTracks.every(track=>track.clips.length===0),'guide assets only on explicit media creation');
   assert.notEqual(vocalTracks[0].pan,vocalTracks[1].pan);
 }
});

test('original synthetic vowel clips are persisted in the demo and have valid WAV headers',()=>{
 const session=createVocalDemoSession('vox-rnb');
 const media=createVocalDemoMedia(session);
 assert.equal(media.length,3);
 for(const [index,audio] of media.entries()){
   assert.ok(audio.data instanceof ArrayBuffer);
   const wav=new DataView(audio.data);
   assert.equal(wav.getUint32(0,true),0x46464952);
   assert.equal(wav.getUint16(20,true),1); // PCM 16
   assert.equal(wav.getUint16(22,true),1); // mono
   assert.equal(wav.getUint32(24,true),22050);
   const clip=session.tracks.filter(t=>t.type==='audio')[index].clips[0];
   assert.equal(clip.audioId,audio.id);
   assert.equal(clip.start,12);
   assert.ok(clip.length>0);
 }
 assert.equal(session.vocalDemoInfo.hasSyntheticGuides,true);
 assert.equal(session.vocalDemoInfo.hasRecordedVoice,false);
});

test('vowel guide synthesis is non-silent, finite and time-bounded',()=>{
 const buffer=synthVocalGuide({duration:1.5,sampleRate:22050,voice:0,bpm:130});
 const data=buffer.getChannelData(0);
 assert.equal(data.length,Math.floor(22050*1.5));
 assert.ok(data.some(value=>Math.abs(value)>.01));
 assert.ok(data.every(Number.isFinite));
 assert.throws(()=>synthVocalGuide({duration:100}),/Durée/);
});

test('public studio demo toolbar exposes all three voice-mix options',()=>{
 const html=readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');
 for(const key of Object.keys(VOCAL_DEMOS))assert.match(html,new RegExp('data-public-demo="'+key+'"'));
});
