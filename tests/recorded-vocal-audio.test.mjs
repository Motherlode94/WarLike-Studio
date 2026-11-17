import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createVocalDemoSession} from '../dist/vocal-demo-sessions.js';
import {createFactorySession} from '../dist/content.js';
import {audioAssetIds} from '../dist/studio-model.js';
import {createRecordedVocalDemoMedia,RECORDED_VOCAL_KINDS} from '../dist/recorded-vocal-audio.js';
const fetcher=async url=>{try{const bytes=await readFile(url);return {ok:true,json:async()=>JSON.parse(bytes),arrayBuffer:async()=>bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength)}}catch{return {ok:false}}};
const withoutIds=value=>JSON.parse(JSON.stringify(value,(key,v)=>key==='id'?undefined:v));
test('human demo recordings have attribution, integrity hashes and three different musical sections',async()=>{
 const manifest=JSON.parse(await readFile(new URL('../dist/samples/vocals/manifest.json',import.meta.url)));
 const hashes=new Set();
 for(const kind of RECORDED_VOCAL_KINDS){
  const definition=manifest[kind];assert.equal(definition.license,'CC BY 3.0');assert.equal(definition.language,'en');assert.equal(definition.humanRecording,true);
  assert.match(definition.url,/^https:\/\/ccmixter.org\/files\//);assert.ok(definition.artist.length>5);
  for(const part of definition.parts){const bytes=await readFile(new URL('../dist/samples/vocals/'+part.file,import.meta.url));assert.equal(bytes.length,part.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),part.sha256);hashes.add(part.sha256);assert.ok(part.rms>.02&&part.peak<.9);assert.ok(Math.abs(part.seconds-960/definition.targetBpm)<.001);}
 }
 assert.equal(hashes.size,9,'Do not repeat a single generated loop as different takes');
});
test('recorded voices resolve to persisted media, preserve backing scores and survive project JSON round trip',async()=>{
 for(const [kind,template] of [['vox-trap','nocturne'],['vox-afro','soleil'],['vox-rnb','brume']]){
  const project=createVocalDemoSession(kind),before=withoutIds(createFactorySession(template).tracks.filter(t=>t.type!=='audio'));
  const media=await createRecordedVocalDemoMedia(project,{fetcher});
  assert.deepEqual(withoutIds(project.tracks.filter(t=>t.type!=='audio')),before);
  const voices=project.tracks.filter(t=>t.type==='audio');assert.ok(voices.flatMap(t=>t.clips).every(c=>/^[a-z0-9]+$/i.test(c.id)));assert.deepEqual(voices[0].clips.map(c=>c.start),[4,8,12]);assert.equal(new Set(voices[0].clips.map(c=>c.audioId)).size,3);
  assert.deepEqual([...audioAssetIds(project)].sort(),media.map(a=>a.id).sort());
  assert.equal(project.vocalDemoInfo.hasRecordedVoice,true);assert.equal(project.vocalDemoInfo.hasSyntheticGuides,false);assert.equal(project.demoRevision,6);
  assert.ok(voices.every(t=>t.inserts.filter(Boolean).length>=3&&t.recordArm===false));
  assert.match(voices[1].name,/DOUBLURE TRAITÉE/);assert.match(voices[2].name,/RÉPONSES DÉRIVÉES/);
  const saved=JSON.parse(JSON.stringify({project,assets:media.map(a=>({...a,data:Buffer.from(a.data).toString('base64')}))}));
  assert.deepEqual(saved.project,project);assert.ok(saved.assets.every(a=>Buffer.from(a.data,'base64').length>4096));assert.equal(saved.project.vocalDemoInfo.credits[0].license,'CC BY 3.0');
 }
});
test('a missing vocal download leaves the project unmodified and never substitutes a synthetic voice',async()=>{
 const project=createVocalDemoSession('vox-trap'),before=JSON.stringify(project);
 await assert.rejects(createRecordedVocalDemoMedia(project,{fetcher:async url=>String(url).endsWith('verse-b.mp3')?{ok:false}:fetcher(url)}),/indisponible/);
 assert.equal(JSON.stringify(project),before);
});
test('recorded clips cannot replace an existing take or load into a mismatched tempo',async()=>{
 const project=createVocalDemoSession('vox-afro');project.tracks.find(t=>t.type==='audio').clips.push({id:'my-take',audioId:'user',start:0,length:2});
 const before=JSON.stringify(project);await assert.rejects(createRecordedVocalDemoMedia(project,{fetcher}),/nouvelle session/);assert.equal(JSON.stringify(project),before);
 const mismatched=createVocalDemoSession('vox-rnb');mismatched.bpm=120;await assert.rejects(createRecordedVocalDemoMedia(mismatched,{fetcher}),/incompatible/);
});
