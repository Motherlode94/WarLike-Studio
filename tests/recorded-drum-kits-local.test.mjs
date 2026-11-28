import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {DRUM_SAMPLE_SOURCES,requiredDrumFiles,loadRecordedDrumKit} from '../dist/recorded-drum-kits.js';

const fakeContext=()=>({decodeAudioData:async bytes=>({bytes:bytes.byteLength})});

test('every drum sample used by the demos is bundled with Studio', async()=>{
  for(const file of requiredDrumFiles()){
    const location=new URL('../dist/samples/drums/pearl-master-studio/'+file,import.meta.url);
    const info=await stat(location);
    assert.ok(info.size>2048,file+' is missing or truncated');
    const header=(await readFile(location)).subarray(0,12).toString('latin1');
    assert.equal(header.slice(0,4)+header.slice(8,12),'RIFFWAVE',file+' is not a WAV file');
  }
  assert.match(await readFile(new URL('../dist/samples/drums/pearl-master-studio/CREDITS.txt',import.meta.url),'utf8'),/CC|Creative Commons Attribution 3\.0/);
});

test('the bundled copy is tried before the third-party host', async()=>{
  assert.match(DRUM_SAMPLE_SOURCES[0],/\/samples\/drums\/pearl-master-studio\/$/);
  assert.match(DRUM_SAMPLE_SOURCES.at(-1),/^https:\/\/oramics\.github\.io\//);
  const requested=[];
  await loadRecordedDrumKit(fakeContext(),{fetcher:async url=>{requested.push(url);return {ok:true,arrayBuffer:async()=>new ArrayBuffer(4096)}}});
  assert.ok(requested.length>0);
  assert.ok(requested.every(url=>!url.includes('oramics.github.io')),'no external request when the local file exists');
});

test('a missing local file falls back to the original host', async()=>{
  // Fresh module instance: the loader caches downloaded files per page.
  const {loadRecordedDrumKit:freshLoad}=await import('../dist/recorded-drum-kits.js?fallback');
  const requested=[];
  const kit=await freshLoad(fakeContext(),{fetcher:async url=>{requested.push(url);return url.startsWith('https://oramics')?{ok:true,arrayBuffer:async()=>new ArrayBuffer(4096)}:{ok:false,status:404}}});
  assert.equal(Object.keys(kit).length,requiredDrumFiles().length);
  assert.ok(requested.some(url=>url.startsWith('https://oramics.github.io/')));
});
