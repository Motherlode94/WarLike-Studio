import test from 'node:test';
import assert from 'node:assert/strict';
import {auditRouting,measureAudio,verifyWav32,measureCompRenderedSeams} from '../dist/audio-certification.js';
import {encodeWav} from '../dist/wav.js';
const buffer=(...channels)=>({numberOfChannels:channels.length,length:channels[0].length,sampleRate:44100,getChannelData:i=>Float32Array.from(channels[i])});
test('known peak RMS and float WAV roundtrip',()=>{const b=buffer([.5,-.5],[.5,-.5]);const m=measureAudio(b);assert.ok(Math.abs(m.peakDb+6.0206)<.001);assert.equal(m.peakDb,m.rmsDb);const wav=encodeWav(b,{bits:32});assert.ok(verifyWav32(wav,b));new DataView(wav).setFloat32(44,0,true);assert.equal(verifyWav32(wav,b),false);});
test('detect nonfinite and clipping',()=>{const m=measureAudio(buffer([NaN,1.2,0]));assert.equal(m.invalid,1);assert.equal(m.clipped,1);});
test('routing cycles and missing destinations',()=>{const p={tracks:[{id:'a',output:'b'},{id:'b',type:'bus',output:'master'}]};assert.deepEqual(auditRouting(p),[]);p.tracks[1].output='missing';assert.ok(auditRouting(p).length);p.tracks[0].type='bus';p.tracks[1].output='a';assert.ok(auditRouting(p).some(x=>x.includes('Boucle')));});

test('R08.17: two real PCM junction windows pass for faded vocal notes and float WAV export',()=>{
 const rate=48000,length=rate*4,points=[rate,rate*2];
 const voices=Array.from({length:2},(_,ch)=>Float32Array.from({length},(_,i)=>{
  const seg=i<points[0]?0:i<points[1]?1:2,frequency=[220,330,440][seg]+ch*15;
  const from=seg===0?0:points[seg-1],to=seg<2?points[seg]:length;
  const fade=Math.min(1,(i-from)/480,(to-i)/480);
  return Math.sin(i*2*Math.PI*frequency/rate)*.28*Math.max(0,fade);
 }));
 const input={numberOfChannels:2,sampleRate:rate,length,getChannelData:i=>voices[i]};
 const snapshot=voices.map(data=>data.slice());
 const result=measureCompRenderedSeams(input,{bpm:120,seamBars:[.5,1]});
 assert.equal(result.valid,true);
 assert.deepEqual(result.seams.map(s=>s.frame),points);
 assert(result.seams.every(s=>s.channels.every(c=>c.peak<1&&!c.suspectedClick)));
 assert.deepEqual(voices,snapshot,'the audio certification must never modify PCM');
 const encoded=encodeWav(input,{bits:32});
 assert.equal(verifyWav32(encoded,input),true);
 const view=new DataView(encodeWav(input,{bits:24}));
 assert.equal(view.getUint16(20,true),1);
 assert.equal(view.getUint16(34,true),24);
 assert.equal(view.getUint32(40,true),length*2*3);
});
test('R08.17: an injected one-sample join pop is detected without creating a false general clipping verdict',()=>{
 const rate=48000,length=rate*3,data=new Float32Array(length);const seam=rate;
 data[seam-1]=-.72;data[seam]=.72;
 const input={numberOfChannels:1,sampleRate:rate,length,getChannelData:()=>data};
 const report=measureCompRenderedSeams(input,{bpm:120,seamBars:[.5,1]});
 assert.equal(report.valid,false);
 assert.equal(report.seams[0].suspectedClick,true);
 assert.equal(report.seams[0].clipped,0);
 assert.equal(report.seams[1].suspectedClick,false);
 assert(report.seams[0].channels[0].nearestJump>1.4);
});
test('R08.17: rendered audio fails on non-finite samples and clipped vocal joins',()=>{
 const rate=48000,length=rate*3,data=new Float32Array(length);data[rate+5]=NaN;data[rate*2-1]=1.2;
 const input={numberOfChannels:1,sampleRate:rate,length,getChannelData:()=>data};
 const report=measureCompRenderedSeams(input,{bpm:120,seamBars:[.5,1]});
 assert.equal(report.valid,false);
 assert(report.seams[0].invalid>=1);
 assert(report.seams[1].clipped>=1);
});
test('R08.17: invalid render, missing samples and out-of-range seams fail closed',()=>{
 const rate=48000,input={numberOfChannels:1,sampleRate:rate,length:rate*3,
  getChannelData:()=>new Float32Array(rate*3)};
 for(const config of [{bpm:0,seamBars:[.5,1]},{bpm:120,seamBars:[NaN,1]},
  {bpm:120,seamBars:[.5]},{bpm:120,seamBars:[0,1]},
  {bpm:120,seamBars:[.5,1.5]},{bpm:120,seamBars:[.5,1],windowMs:0}]){
  assert.throws(()=>measureCompRenderedSeams(input,config),/invalide|hors du rendu/i);
 }
 assert.throws(()=>measureCompRenderedSeams({...input,getChannelData:()=>new Float32Array(1)},
 {bpm:120,seamBars:[.5,1]}),/incomplets/);
});
