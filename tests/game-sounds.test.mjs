import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {GAME_SOUNDS,GAME_SOUND_CATEGORIES,gameSound,filterGameSounds,renderGameSound,gameSoundWav,gameSoundFiles,gameSoundPack} from '../dist/game-sounds.js';
test('24 original game sounds cover six usable categories with unique names and paths',()=>{
 assert.equal(GAME_SOUNDS.length,24);assert.equal(new Set(GAME_SOUNDS.map(s=>s.id)).size,24);
 for(const category of Object.keys(GAME_SOUND_CATEGORIES))assert.equal(filterGameSounds('',category).length,4);
 assert.equal(filterGameSounds('metal','impact')[0].id,'hit-metal');
 assert.equal(filterGameSounds('mEtAL Impacts').length,1);assert.equal(filterGameSounds('laser').length,2);
 assert.equal(filterGameSounds('no-such-sound').length,0);
 assert.ok(GAME_SOUNDS.every(s=>s.loop===false&&s.duration<=4&&/^[a-z-]+$/.test(s.id)));
});
test('all sound designs render finite, audible and bounded mono PCM at both sample rates',()=>{
 const hashes=new Set();
 for(const s of GAME_SOUNDS)for(const rate of [44100,48000]){
  const rendered=renderGameSound(s.id,rate),data=rendered.getChannelData(0);
  let sum=0,energy=0,peak=0;for(const v of data){assert.ok(Number.isFinite(v));sum+=v;energy+=v*v;peak=Math.max(peak,Math.abs(v));}
  assert.equal(data.length,Math.round(rate*s.duration));assert.equal(rendered.numberOfChannels,1);
  assert.ok(peak>.64&&peak<.66,s.id+' must keep peak headroom');
  assert.ok(Math.sqrt(energy/data.length)>.005,s.id+' must be audible');assert.ok(Math.abs(sum/data.length)<.001,s.id+' DC offset');
  assert.ok(data[0]===0);assert.ok(data.at(-1)===0);
  if(rate===48000)hashes.add(createHash('sha256').update(new Uint8Array(data.buffer)).digest('hex'));
 }
 assert.equal(hashes.size,24,'each design has distinct audio');
});
test('generation is deterministic and independent; invalid IDs and rates fail before rendering',()=>{
 const a=renderGameSound('rain').getChannelData(0),b=renderGameSound('rain').getChannelData(0);
 assert.deepEqual(a,b);a[100]=42;assert.notEqual(b[100],42);
 assert.throws(()=>gameSound('__proto__'));assert.throws(()=>renderGameSound('missing'));
 for(const rate of [NaN,Infinity,0,44101,96000])assert.throws(()=>renderGameSound('wind',rate));
 assert.throws(()=>gameSoundFiles('no-such-sound'));
});
test('exported WAVs independently decode to mono PCM 24-bit 48 kHz matching the design',()=>{
 for(const s of GAME_SOUNDS){
  const bytes=gameSoundWav(s.id),v=new DataView(bytes),text=(at,n)=>String.fromCharCode(...new Uint8Array(bytes,at,n));
  assert.equal(text(0,4),'RIFF');assert.equal(text(8,4),'WAVE');assert.equal(text(36,4),'data');
  assert.equal(v.getUint16(20,true),1);assert.equal(v.getUint16(22,true),1);assert.equal(v.getUint32(24,true),48000);assert.equal(v.getUint16(34,true),24);
  const expected=renderGameSound(s.id).getChannelData(0);assert.equal(v.getUint32(40,true),expected.length*3);assert.equal(bytes.byteLength,44+expected.length*3);
  for(let i=0;i<expected.length;i+=173){const p=44+i*3;let x=v.getUint8(p)|(v.getUint8(p+1)<<8)|(v.getUint8(p+2)<<16);if(x&0x800000)x-=0x1000000;assert.ok(Math.abs(x/8388608-expected[i])<2/8388608);}
 }
});
test('filtered packs contain real WAVs and a manifest documenting their exact paths and durations',async()=>{
 const files=gameSoundFiles('','movement'),manifest=JSON.parse(new TextDecoder().decode(files.find(f=>f.name==='manifest.json').data));
 assert.equal(manifest.sounds.length,4);assert.equal(files.length,6);
 for(const sound of manifest.sounds){assert.equal(sound.category,'movement');assert.equal(sound.loop,false);assert.deepEqual(files.find(f=>f.name===sound.file).data,gameSoundWav(sound.id));}
 const packed=new Uint8Array(await gameSoundPack('','movement').arrayBuffer());
 const view=new DataView(packed.buffer);assert.equal(view.getUint32(0,true),0x04034b50);
 assert.equal(view.getUint32(packed.length-22,true),0x06054b50);assert.equal(view.getUint16(packed.length-12,true),6);
});
