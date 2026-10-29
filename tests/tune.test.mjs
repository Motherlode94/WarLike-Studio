import test from 'node:test';
import assert from 'node:assert/strict';
import {tuneAudio,detectPitch,targetNote} from '../dist/tune-dsp.js';

const tone=(f,sr=44100)=>Float32Array.from({length:sr},(_,i)=>.25*Math.sin(2*Math.PI*f*i/sr)+.06*Math.sin(4*Math.PI*f*i/sr));
test('snaps only to the requested scale',()=>{
  assert.equal(targetNote(68.4,9,'minor'),69);
  assert.equal(targetNote(61.4,0,'major'),62);
  assert.equal(targetNote(61.4,0,'chromatic'),61);
  assert.equal(targetNote(70,9,'minor'),69);
});
for(const [source,target,sr] of [[215,220,44100],[258,261.625565,44100],[321,329.627557,44100],[430,440,44100],[865,880,48000]]){
  test(`corrects ${source} Hz to ${target.toFixed(2)} Hz at ${sr} Hz`,()=>{
    const input=tone(source,sr),{channels,report}=tuneAudio([input],sr,{key:9,scale:'minor',speed:0,amount:1,mix:1});
    const detected=detectPitch(channels[0].slice(Math.floor(sr*.5),Math.floor(sr*.5)+4096),sr);
    assert.ok(detected,'output pitch must be measurable');
    assert.ok(Math.abs(1200*Math.log2(detected.frequency/target))<6,`output ${detected.frequency} Hz must be within 6 cents`);
    assert.equal(channels[0].length,input.length,'duration must be preserved');
    assert.ok(report.voicedFrames>20);
    assert.ok(channels[0].every(x=>Number.isFinite(x)&&Math.abs(x)<1));
  });
}
test('dry mix preserves the original samples',()=>{
  const input=tone(430),{channels}=tuneAudio([input],44100,{mix:0});assert.deepEqual(channels[0],input);
});
test('silence remains silent and unvoiced',()=>{
  const {channels,report}=tuneAudio([new Float32Array(8000)],44100);assert.equal(report.voicedFrames,0);assert.ok(channels[0].every(x=>x===0));
});
test('stereo channels keep their relative balance',()=>{
  const left=tone(430),right=left.map(x=>x*.5),{channels}=tuneAudio([left,right],44100,{speed:0});
  assert.equal(channels.length,2);for(let i=0;i<left.length;i+=97)assert.ok(Math.abs(channels[0][i]*.5-channels[1][i])<1e-6);
});
test('quiet vocal takes can be analyzed without baking a gain boost into TUNE',()=>{
  const input=tone(430).map(x=>x*.01),{channels,report}=tuneAudio([input],44100,{speed:0});
  assert.ok(report.voicedFrames>20);const boosted=channels[0].slice(22050,26146).map(x=>x*100),detected=detectPitch(boosted,44100);
  assert.ok(Math.abs(1200*Math.log2(detected.frequency/440))<6);assert.ok(channels[0].every(x=>Math.abs(x)<.01));
});
