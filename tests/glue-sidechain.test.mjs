import test from 'node:test';
import assert from 'node:assert/strict';
import {StereoCompressor} from '../dist/compressor-dsp.js';
import {keySourceOptions} from '../dist/sidechain-ui.js';
import {EFFECTS} from '../dist/plugins.js';
import {readFile} from 'node:fs/promises';

test('the detector follows the key when one is supplied, the input otherwise',()=>{
  const run=key=>{const c=new StereoCompressor(48000);let out=0;for(let i=0;i<4800;i++){if(key!==undefined)c.key=key;c.process(.2,.2,-30,8,0,.001,.1);out=c.left;}return out;};
  const internal=run(),silentKey=run(0),loudKey=run(.9);
  assert.ok(internal<.2*.5,'loud input compresses itself');
  assert.ok(Math.abs(silentKey-.2)<1e-6,'silent key: no gain reduction');
  assert.ok(loudKey<internal,'loud key ducks harder than the input alone');
});

test('Key Input lists other tracks and refuses feedback loops',()=>{
  const project={tracks:[{id:'bass',output:'bus',sends:[]},{id:'kick',output:'master',sends:[]},{id:'bus',type:'bus',output:'master',sends:[]}]};
  const ids=keySourceOptions(project,'bass').map(t=>t.id);
  assert.ok(ids.includes('kick'));assert.ok(!ids.includes('bass'),'not itself');
  assert.ok(!ids.includes('bus'),'the bus it feeds would create a loop');
});

test('GLUE key filters default to off and the key is only wired with a source',async()=>{
  const c=k=>EFFECTS.glue.controls.find(x=>x.key===k);
  assert.equal(c('keyHpf').default,20);assert.equal(c('keyLpf').default,20000);
  const src=await readFile(new URL('../dist/audio.js',import.meta.url),'utf8');
  assert.match(src,/if\(ch\.keySource\)ch\.keyLP\.connect\(ch\.compressor,0,1\)/);
  assert.match(src,/!reaches\(p\.tracks,tr\.id,id\)/);
});
