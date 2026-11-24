import test from 'node:test';
import assert from 'node:assert/strict';
import {auditRouting,measureAudio,verifyWav32,measureCompRenderedSeams,measureStudioCompRender,compareRenderedWav,auditLiveAudioWindows} from '../dist/audio-certification.js';
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

test('R08.18 aligns the real 10 ms Studio offline render lead to both absolute comp edits',()=>{
 const bpm=120,rate=48000,startBar=3.75,range={start:4,end:5},frames=rate*4;
 const samples=new Float32Array(frames);
 const first=Math.round(((range.start-startBar)*240/bpm+.01)*rate),last=Math.round(((range.end-startBar)*240/bpm+.01)*rate);
 samples[first-1]=-.72;samples[first]=.72;
 const audio={numberOfChannels:1,sampleRate:rate,length:frames,getChannelData:()=>samples};
 const snapshot=samples.slice(),result=measureStudioCompRender(audio,{bpm,startBar,range});
 assert.deepEqual(result.seams.map(x=>x.frame),[first,last]);
 assert.deepEqual(result.seams.map(x=>x.bar),[4,5]);
 assert.equal(result.seams[0].suspectedClick,true);
 assert.equal(result.seams[1].suspectedClick,false);
 assert.deepEqual(samples,snapshot);
});
test('R08.18 rejects malformed or uninspectable ranges instead of reporting false clean audio',()=>{
 const rate=48000,audio={numberOfChannels:1,sampleRate:rate,length:rate*2,getChannelData:()=>new Float32Array(rate*2)};
 for(const options of [{bpm:0,startBar:0,range:{start:.5,end:.75}},
  {bpm:120,startBar:2,range:{start:1,end:2}},
  {bpm:120,startBar:0,range:{start:1,end:1}},
  {bpm:120,startBar:0,range:{start:0,end:.5}},
  {bpm:120,startBar:0,range:{start:.5,end:2}},
  {bpm:120,startBar:0,range:{start:.5,end:.75},scheduleLeadSeconds:-1}]){
  assert.throws(()=>measureStudioCompRender(audio,options),/invalide|hors du rendu/);
 }
});

test('R08.19 WAV parity accepts stereo rendered PCM at 16, 24 and float 32 bits without rewriting a sample',()=>{
 const channels=[Float32Array.from({length:1025},(_,i)=>Math.sin(i*.023)*.73),
  Float32Array.from({length:1025},(_,i)=>Math.cos(i*.019)*.42)];
 const b={numberOfChannels:2,length:1025,sampleRate:48000,getChannelData:i=>channels[i]};
 const before=channels.map(a=>a.slice());
 for(const bits of [16,24,32]){
  const wav=encodeWav(b,{bits}),result=compareRenderedWav(b,wav,{bits});
  assert.equal(result.valid,true,JSON.stringify(result));
  assert.equal(result.frames,1025);assert.equal(result.channels,2);
  assert.equal(result.invalid,0);assert.equal(result.clipped,0);
  assert.equal(result.mismatches,0);
  // Studio positive PCM uses (2^(bits-1)-1); its reconstruction error may
  // slightly exceed one symmetric LSB, while the quantized word stays exact.
  assert(result.maxError<= (bits===32?0:1.5/(2**(bits-1)))+1e-8);
 }
 assert.deepEqual(channels,before);
});
test('R08.19 refuses corrupted WAV headers, channel mismatches and modified PCM payloads',()=>{
 const samples=Float32Array.from([.2,-.4,.15,-.1]);
 const b={numberOfChannels:1,length:samples.length,sampleRate:44100,getChannelData:()=>samples};
 const original=encodeWav(b,{bits:24});
 for(const position of [0,20,22,24,34,40]){
  const copy=original.slice(0),view=new DataView(copy);view.setUint8(position,view.getUint8(position)^1);
  assert.throws(()=>compareRenderedWav(b,copy,{bits:24}),/WAV incompatible|En-tête WAV incompatible/);
 }
 const modified=original.slice(0),view=new DataView(modified);
 for(const offset of [44,45,46])view.setUint8(offset,255);
 const result=compareRenderedWav(b,modified,{bits:24});
 assert.equal(result.valid,false);assert(result.mismatches>0);
 // Even a single quantization-word modification must fail certification.
 const oneLsb=original.slice(0),word=new DataView(oneLsb);
 word.setUint8(44,word.getUint8(44)^1);
 const single=compareRenderedWav(b,oneLsb,{bits:24});
 assert.equal(single.valid,false);assert.equal(single.mismatches,1);
 assert.deepEqual(samples,Float32Array.from([.2,-.4,.15,-.1]));
});
test('R08.19 never certifies clipped or invalid rendered vocal samples',()=>{
 const samples=Float32Array.from([.1,1.2,-1.1,.2]),b={numberOfChannels:1,length:4,sampleRate:48000,getChannelData:()=>samples};
 const r=compareRenderedWav(b,encodeWav(b,{bits:32}),{bits:32});
 assert.equal(r.clipped,2);assert.equal(r.valid,false);
 const bad=Float32Array.from([.1,NaN,.2,.3]),invalid={...b,getChannelData:()=>bad};
 const other=compareRenderedWav(invalid,encodeWav(invalid,{bits:32}),{bits:32});
 assert.equal(other.invalid,1);assert.equal(other.valid,false);
});

test('R08.20 measures distinct real-time PCM windows without false clip detection across sample gaps',()=>{
 const rate=48000,window=Float32Array.from({length:1024},(_,i)=>Math.sin(i*2*Math.PI*440/rate)*.15);
 const snapshots=[0,.15,.30].map(time=>({time,channels:[window,window]}));
 const before=window.slice(),report=auditLiveAudioWindows(snapshots);
 assert.equal(report.status,'measured');
 assert.equal(report.invalid,0);assert.equal(report.clipped,0);assert.equal(report.gaps,0);
 assert.equal(report.longestSilentRun,0);assert(report.peak>.14&&report.peak<.16);
 assert(report.windows.every(w=>w.rmsDb>-25&&w.rmsDb< -15));
 assert.deepEqual(window,before);
});
test('R08.20 distinguishes silence, missing polling intervals, overload and invalid live audio',()=>{
 const silence=Float32Array.from([0,0,0,0]);
 const note=Float32Array.from([.2,-.2,.1,-.1]);
 const r=auditLiveAudioWindows([{time:0,channels:[silence]},{time:.2,channels:[silence]},
  {time:1.1,channels:[note]},{time:1.2,channels:[Float32Array.from([1.1,NaN,.2])]}]);
 assert.equal(r.longestSilentRun,2);
 assert.equal(r.gaps,1);
 assert.equal(r.clipped,1);
 assert.equal(r.invalid,1);
 assert.equal(r.status,'invalid');
});
test('R08.20 refuses non-monotonic timestamps, absent channels and malformed calibration',()=>{
 const window={time:1,channels:[Float32Array.from([.1,.2])]};
 for(const windows of [[],[window,window],[{time:NaN,channels:window.channels}],
  [{time:0,channels:[]}],[{time:0,channels:[new Float32Array()]}]]){
  assert.throws(()=>auditLiveAudioWindows(windows),/invalide|vide/);
 }
 assert.throws(()=>auditLiveAudioWindows([window],{clipThreshold:0}),/invalides/);
});
