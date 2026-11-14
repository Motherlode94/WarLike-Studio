import test from 'node:test';
import assert from 'node:assert/strict';
import {encodeWav} from '../dist/wav.js';
import {planWavParts,restoreWavParts,WAV_PARTS_KIND,CLOUD_AUDIO_LIMIT,validateWavManifest} from '../dist/cloud-wav-parts.js';
import {createStudioSync} from '../dist/studio-cloud-workflow.js';
const uuid=n=>'aaaaaaaa-aaaa-4aaa-8aaa-'+String(n).padStart(12,'0');
function wav(frames=48000*60,bits=32,channels=2){
 const data=Array.from({length:channels},(_,channel)=>Float32Array.from({length:frames},(_,i)=>Math.sin(i*.013+channel)*.37));
 return encodeWav({numberOfChannels:channels,length:frames,sampleRate:48000,getChannelData:i=>data[i]},{bits});
}
test('one-minute stereo float recording survives private 12 MiB WAV parts byte for byte',async()=>{
 const original=wav(),plan=planWavParts(original),remote=new Map();
 assert.ok(original.byteLength>CLOUD_AUDIO_LIMIT);assert.equal(plan.count,2);
 for(const part of plan.parts()){
  assert.ok(part.byteLength<=CLOUD_AUDIO_LIMIT);
  assert.equal(new DataView(part).getUint16(20,true),3,'keep float PCM');
  assert.equal(new DataView(part).getUint32(4,true),part.byteLength-8);
  remote.set(uuid(remote.size+1),part);
 }
 const restored=await restoreWavParts({kind:WAV_PARTS_KIND,size:original.byteLength,dataSize:plan.dataSize,parts:[...remote.keys()]},async id=>remote.get(id));
 assert.deepEqual(new Uint8Array(restored),new Uint8Array(original));
});
test('PCM chunks preserve 24-bit stereo frame boundaries and WAV metadata',async()=>{
 const original=wav(101,24),prefix=new Uint8Array(original,0,36),payload=new Uint8Array(original,36);
 // Insert an ordinary JUNK metadata chunk ahead of the audio data.
 const data=new Uint8Array(original.byteLength+12);data.set(prefix);data.set([74,85,78,75,4,0,0,0,1,2,3,4],36);data.set(payload,48);new DataView(data.buffer).setUint32(4,data.length-8,true);
 const plan=planWavParts(data.buffer,{limit:200}),parts=[...plan.parts()];
 for(const part of parts)assert.equal(new DataView(part).getUint32(52,true)%6,0);
 const ids=parts.map((_,i)=>uuid(i+1));
 assert.deepEqual(new Uint8Array(await restoreWavParts({kind:WAV_PARTS_KIND,size:data.length,dataSize:plan.dataSize,parts:ids},async id=>parts[ids.indexOf(id)])),data);
});
test('rejects malformed, compressed and incomplete chunks before claiming a restore',async()=>{
 const original=wav(100,16),invalid=original.slice(0);new DataView(invalid).setUint16(20,17,true);
 assert.throws(()=>planWavParts(invalid),/PCM/);
 assert.throws(()=>planWavParts(original.slice(0,-1)),/incomplet/);
 assert.throws(()=>validateWavManifest({kind:WAV_PARTS_KIND,size:Infinity,dataSize:100,parts:[uuid(1)]}),/invalide/);
 const plan=planWavParts(original,{limit:200}),parts=[...plan.parts()],ids=parts.map((_,i)=>uuid(i+1));
 await assert.rejects(restoreWavParts({kind:WAV_PARTS_KIND,size:original.byteLength,dataSize:plan.dataSize,parts:ids.slice(0,-1)},async id=>parts[ids.indexOf(id)]),/incomplet/);
});
test('odd-length 8-bit PCM preserves padding and trailing metadata exactly',async()=>{
 const raw=wav(102,16,1),bytes=new Uint8Array(44+101+1+12),v=new DataView(bytes.buffer);
 bytes.set(new Uint8Array(raw,0,44));v.setUint32(4,bytes.length-8,true);v.setUint16(32,1,true);v.setUint16(34,8,true);v.setUint32(28,48000,true);v.setUint32(40,101,true);
 for(let i=0;i<101;i++)bytes[44+i]=i;
 bytes[145]=123;bytes.set([74,85,78,75,4,0,0,0,5,6,7,8],146);
 const plan=planWavParts(bytes.buffer,{limit:100}),parts=[...plan.parts()],ids=parts.map((_,i)=>uuid(i+1));
 const restored=await restoreWavParts({kind:WAV_PARTS_KIND,size:bytes.length,dataSize:101,parts:ids},async id=>parts[ids.indexOf(id)]);
 assert.deepEqual(new Uint8Array(restored),bytes);
});
test('unsupported long media fail before creating a remote project or publishing metadata',async()=>{
 let creates=0;
 const sync=createStudioSync({api:{identity:async()=>({userId:'alice',studioAccess:true}),createProject:async()=>{creates++;return {id:uuid(99),revision:1};}}});await sync.connect();
 await assert.rejects(sync.push({project:{name:'MP3 long',tracks:[]},assets:[{id:'voice',name:'long.mp3',data:new ArrayBuffer(CLOUD_AUDIO_LIMIT+1)}]}),/WAV/);
 assert.equal(creates,0);
});
test('interrupted long upload resumes completed parts and publishes only after all media arrive',async()=>{
 const original=wav(),uploads=new Map();let attempts=0,failed=false,saved=null;const progress=[];
 const api={identity:async()=>({userId:'alice',studioAccess:true}),uploadAsset:async(_project,file)=>{
  attempts++;if(attempts===2&&!failed){failed=true;throw Error('offline');}
  assert.ok(file.size<=CLOUD_AUDIO_LIMIT);const id=uuid(uploads.size+1);uploads.set(id,await file.arrayBuffer());return {id};
 },saveProject:async(_id,project,revision)=>{saved=project;return {revision:revision+1};},getProject:async()=>({project:saved,revision:3}),downloadAsset:async(_project,id)=>uploads.get(id)};
 const sync=createStudioSync({api});await sync.connect();const args={cloudId:uuid(99),revision:1,ownerId:'alice',project:{name:'Longue prise',tracks:[]},assets:[{id:'voice',name:'Voix.wav',data:original}],onProgress:value=>progress.push(value)};
 await assert.rejects(sync.push(args),/offline/);assert.equal(saved,null);assert.equal(uploads.size,1);
 const result=await sync.push(args);assert.equal(attempts,3);assert.equal(uploads.size,2);assert.equal(result.cloudAssets.voice.parts.length,2);
 const restored=await sync.fetchProject(uuid(99));assert.deepEqual(new Uint8Array(restored.media[0].data),new Uint8Array(original));assert.equal(restored.media[0].name,'Voix.wav');
 await sync.push(args);assert.equal(attempts,3,'mix-only saves must reuse all media');
 assert.deepEqual(progress.map(p=>p.part),[1,2,2]);
});
test('a copied project uploads new media instead of reusing private IDs from its source project',async()=>{
 let saved,uploads=0;
 const sync=createStudioSync({api:{identity:async()=>({userId:'alice',studioAccess:true}),createProject:async()=>({id:uuid(90),revision:1}),uploadAsset:async()=>{uploads++;return {id:uuid(2)};},saveProject:async(_id,p)=>{saved=p;return {revision:2};}}});await sync.connect();
 await sync.push({project:{name:'Copie',tracks:[],__cloudAssets:{voice:uuid(1)}},assets:[{id:'voice',name:'a.wav',data:wav(20)}]});
 assert.equal(uploads,1);assert.equal(saved.__cloudAssets.voice,uuid(2));
});
test('changing accounts during an upload prevents publication with the next user identity',async()=>{
 let release,user='alice',saves=0;
 const sync=createStudioSync({api:{identity:async()=>({userId:user,studioAccess:true}),uploadAsset:()=>new Promise(resolve=>{release=resolve;}),saveProject:async()=>{saves++;return {revision:2};}}});await sync.connect();
 const pending=sync.push({project:{name:'A',tracks:[]},assets:[{id:'voice',data:wav(20)}],cloudId:uuid(99),revision:1,ownerId:'alice'});
 await new Promise(resolve=>setImmediate(resolve));user='bob';await sync.connect();release({id:uuid(1)});
 await assert.rejects(pending,/Compte cloud modifié/);assert.equal(saves,0);
});
test('a queued new project cannot be uploaded by an account connected after it was queued',async()=>{
 let user='alice',creates=0,release;
 const sync=createStudioSync({api:{identity:async()=>({userId:user,studioAccess:true}),uploadAsset:()=>new Promise(resolve=>{release=resolve;}),createProject:async()=>{creates++;return {id:uuid(99),revision:1};}}});await sync.connect();
 const first=sync.push({project:{name:'A',tracks:[]},assets:[{id:'voice',data:wav(20)}],cloudId:uuid(99),revision:1,ownerId:'alice'});
 await new Promise(resolve=>setImmediate(resolve));
 const task=sync.push({project:{name:'Privé',tracks:[]},assets:[]});
 user='bob';await sync.connect();release({id:uuid(1)});
 await assert.rejects(first,/Compte cloud modifié/);
 await assert.rejects(task,/Compte cloud modifié/);assert.equal(creates,0);
});
