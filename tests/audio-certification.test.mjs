import test from 'node:test';
import assert from 'node:assert/strict';
import {auditRouting,measureAudio,verifyWav32} from '../dist/audio-certification.js';
import {encodeWav} from '../dist/wav.js';
const buffer=(...channels)=>({numberOfChannels:channels.length,length:channels[0].length,sampleRate:44100,getChannelData:i=>Float32Array.from(channels[i])});
test('known peak RMS and float WAV roundtrip',()=>{const b=buffer([.5,-.5],[.5,-.5]);const m=measureAudio(b);assert.ok(Math.abs(m.peakDb+6.0206)<.001);assert.equal(m.peakDb,m.rmsDb);const wav=encodeWav(b,{bits:32});assert.ok(verifyWav32(wav,b));new DataView(wav).setFloat32(44,0,true);assert.equal(verifyWav32(wav,b),false);});
test('detect nonfinite and clipping',()=>{const m=measureAudio(buffer([NaN,1.2,0]));assert.equal(m.invalid,1);assert.equal(m.clipped,1);});
test('routing cycles and missing destinations',()=>{const p={tracks:[{id:'a',output:'b'},{id:'b',type:'bus',output:'master'}]};assert.deepEqual(auditRouting(p),[]);p.tracks[1].output='missing';assert.ok(auditRouting(p).length);p.tracks[0].type='bus';p.tracks[1].output='a';assert.ok(auditRouting(p).some(x=>x.includes('Boucle')));});
