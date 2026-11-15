import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {encodeWav} from '../dist/wav.js';
import {wavExportInfo,wavExportChunks,encodeWavBlob,writeWav,zipWavBlobs} from '../dist/wav-export.js';
import {AudioEngine,emptyProject} from '../dist/audio.js';

const audio=(frames=70001,channels=2)=>{
  const data=Array.from({length:channels},(_,c)=>Float32Array.from({length:frames},(_,i)=>Math.sin(i*.13+c)*1.2));
  if(frames>2)data[0][2]=NaN;
  return {length:frames,numberOfChannels:channels,sampleRate:48000,getChannelData:c=>data[c]};
};

test('block WAV is byte-identical to the existing encoder across block boundaries and formats',async()=>{
  for(const bits of [16,24,32])for(const channels of [1,2]){
    const buffer=audio(70001,channels),progress=[];
    const actual=await encodeWavBlob(buffer,{bits,onProgress:p=>progress.push(p)});
    assert.equal(actual.type,'audio/wav');
    assert.deepEqual(new Uint8Array(await actual.arrayBuffer()),new Uint8Array(encodeWav(buffer,{bits})));
    assert.equal(progress.at(-1).frames,buffer.length);
    assert.equal(progress.at(-1).bytes,actual.size);
    assert.ok(progress.every((p,i)=>!i||p.frames>progress[i-1].frames));
  }
});

test('direct WAV writer applies backpressure and never receives the whole file',async()=>{
  const buffer=audio(150000),chunks=[];let active=false,max=0;
  const result=await writeWav(buffer,{async write(chunk){
    assert.equal(active,false,'writer must finish before another block is encoded');active=true;
    await new Promise(resolve=>setTimeout(resolve,1));
    max=Math.max(max,chunk.byteLength);chunks.push(chunk);active=false;
  }},{bits:24});
  assert.ok(max<=32768*2*3);
  const actual=new Blob(chunks);
  assert.equal(actual.size,result.bytes);
  assert.deepEqual(new Uint8Array(await actual.arrayBuffer()),new Uint8Array(encodeWav(buffer,{bits:24})));
});

test('encoding yields to the event loop and cancellation prevents further writes',async()=>{
  const controller=new AbortController();let writes=0,ticked=false;
  setTimeout(()=>{ticked=true;},0);
  await assert.rejects(writeWav(audio(),{async write(){writes++;if(writes===2)controller.abort();}},{signal:controller.signal}),{name:'AbortError'});
  assert.equal(writes,2);assert.equal(ticked,true);
  let reads=0;
  await assert.rejects(encodeWavBlob({...audio(1),getChannelData(){reads++;throw Error('read');}},{signal:controller.signal}),{name:'AbortError'});
  assert.equal(reads,0);
});

test('bad formats and files above RIFF limit fail before reading PCM or writing a header',async()=>{
  let reads=0,writes=0;
  const buffer={length:600000000,numberOfChannels:2,sampleRate:48000,getChannelData(){reads++;throw Error('read');}};
  await assert.rejects(writeWav(buffer,{write(){writes++;}},{bits:32}),/limite WAV/);
  assert.equal(reads,0);assert.equal(writes,0);
  for(const change of [{length:NaN},{length:-1},{numberOfChannels:0},{sampleRate:Infinity}])assert.throws(()=>wavExportInfo({...audio(1),...change}),/invalide/);
  await assert.rejects(encodeWavBlob(audio(1),{bits:8}),/Résolution/);
  await assert.rejects(encodeWavBlob({...audio(1),getChannelData:()=>new Float32Array(0)}),/incomplet/);
});

test('zero-frame export is a valid header without spurious samples',async()=>{
  const chunks=[];for await(const chunk of wavExportChunks(audio(0)))chunks.push(chunk);
  assert.equal(chunks.length,1);assert.equal(chunks[0].byteLength,44);
  assert.equal(new DataView(chunks[0]).getUint32(40,true),0);
});

test('ZIP of WAV Blobs is readable by an independent ZIP implementation with CRC validation',async()=>{
  const files=[{name:'VOIX_é_01.wav',data:await encodeWavBlob(audio(70001),{bits:24})},{name:'BUS_02.wav',data:await encodeWavBlob(audio(21),{bits:32})}];
  const zip=await zipWavBlobs(files);
  const summary=JSON.parse(execFileSync('python3',['-c',
    'import sys,io,zipfile,json; z=zipfile.ZipFile(io.BytesIO(sys.stdin.buffer.read())); assert z.testzip() is None; print(json.dumps([{ "name":i.filename,"size":len(z.read(i)),"header":z.read(i)[:4].decode()} for i in z.infolist()]))'
  ],{input:Buffer.from(await zip.arrayBuffer()),encoding:'utf8'}));
  assert.deepEqual(summary,files.map(f=>({name:f.name,size:f.data.size,header:'RIFF'})));
});

test('ZIP reads bounded slices rather than materializing each stem and supports cancellation',async()=>{
  const blob=new Blob([new Uint8Array(2200000)]);
  blob.arrayBuffer=()=>{throw Error('full stem copy');};
  const zip=await zipWavBlobs([{name:'LONG.wav',data:blob}]);assert.ok(zip.size>blob.size);
  const controller=new AbortController();controller.abort();
  await assert.rejects(zipWavBlobs([{name:'LONG.wav',data:blob}],{signal:controller.signal}),{name:'AbortError'});
});

test('export rejects missing in-range audio and invalid ranges before allocating Web Audio',async()=>{
  const project=emptyProject();project.tracks[0].clips=[{name:'Lead manquante',start:0,length:1,audioId:'missing'}];
  const engine=new AudioEngine(()=>project,()=>new Map());
  await assert.rejects(engine.exportWav({asBlob:true,endBar:1}),/Lead manquante/);
  await assert.rejects(engine.renderRange({startBar:NaN}),/invalide/);
  await assert.rejects(engine.renderRange({endBar:Infinity}),/invalide/);
  const controller=new AbortController();controller.abort();
  await assert.rejects(engine.exportWav({signal:controller.signal}),{name:'AbortError'});
});
