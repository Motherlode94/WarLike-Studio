import test from 'node:test';
import assert from 'node:assert/strict';
import {createRecordingSignalDiagnostics} from '../dist/recording-signal-diagnostics.js';

test('tracks clipping, silence and distinct peaks for two input channels',()=>{
 const d=createRecordingSignalDiagnostics({sampleRate:4,channels:2});
 d.add([Float32Array.from([0,0,1,.5]),Float32Array.from([.1,.1,.1,.1])]);
 d.add([Float32Array.from([0,0]),Float32Array.from([0,0])]);
 const result=d.snapshot();
 assert.equal(result.channelStats[0].frames,6);
 assert.equal(result.channelStats[0].clippedFrames,1);
 assert.equal(result.channelStats[1].clippedFrames,0);
 assert.equal(result.channelStats[0].longestSilenceSeconds,.5);
 assert.equal(result.channelStats[1].longestSilenceSeconds,.5);
 assert.equal(result.channelStats[0].peak,1);
 assert.ok(Math.abs(result.channelStats[1].peak-.1)<1e-6);
 assert.equal(result.invalidBlocks,0);
});

test('rejects mismatched inputs and never labels silence as a missing PCM frame',()=>{
 const d=createRecordingSignalDiagnostics({sampleRate:48000,channels:2});
 assert.equal(d.add([Float32Array.of(1),Float32Array.of(.1,.2)]),false);
 assert.equal(d.snapshot().invalidBlocks,1);
 assert.equal(d.snapshot().channelStats[0].frames,0);
 const zeros=new Float32Array(48000);
 assert.equal(d.add([zeros,zeros]),true);
 const result=d.snapshot();
 assert.equal(result.channelStats[0].longestSilenceSeconds,1);
 assert.equal(result.channelStats[0].frames,48000);
 assert.equal(result.channelStats[0].clippedFrames,0);
});
