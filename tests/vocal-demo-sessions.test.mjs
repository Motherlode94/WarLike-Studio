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

test('Trap, Afro and R&B produce genuinely distinct phrase timing and timbre',()=>{
 const kinds=['vox-trap','vox-afro','vox-rnb'];
 const signals=kinds.map(style=>synthVocalGuide({duration:5,sampleRate:22050,bpm:100,voice:0,style}).getChannelData(0));
 const rms=x=>Math.sqrt(x.reduce((a,v)=>a+v*v,0)/x.length);
 for(const signal of signals){
  assert.ok(rms(signal)>.003,'voice guide too quiet');
  assert.ok(signal.every(Number.isFinite),'non-finite synthesis');
 }
 const difference=(a,b)=>Math.sqrt(a.reduce((sum,v,i)=>sum+(v-b[i])**2,0)/a.length);
 for(let i=0;i<3;i++)for(let j=i+1;j<3;j++)
  assert.ok(difference(signals[i],signals[j])>.008,kinds[i]+' and '+kinds[j]+' sound too similar');
 const chains=kinds.map(kind=>createVocalDemoSession(kind).tracks.filter(t=>t.type==='audio')[0].inserts.filter(Boolean));
 for(let i=0;i<3;i++)for(let j=i+1;j<3;j++)
  assert.notDeepEqual(chains[i],chains[j],'each genre needs a different real DSP chain');
});
test('vocal lead is audible in verse and chorus without duplicating media',()=>{
 for(const kind of Object.keys(VOCAL_DEMOS)){
  const session=createVocalDemoSession(kind),media=createVocalDemoMedia(session);
  const voices=session.tracks.filter(t=>t.type==='audio');
  assert.equal(media.length,3);
  assert.ok(voices[0].clips.some(c=>c.start===4));
  assert.ok(voices[1].clips.some(c=>c.start===8));
  assert.ok(voices.every(t=>t.clips.some(c=>c.start===12)));
  assert.equal(new Set(voices.flatMap(t=>t.clips.map(c=>c.audioId))).size,3);
 }
});
