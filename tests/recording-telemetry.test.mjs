import test from 'node:test';
import assert from 'node:assert/strict';
import {createRecordingTelemetrySummary} from '../dist/recording-telemetry.js';

test('PCM telemetry distinguishes captured samples from confirmed durable saves',()=>{
 const meter=createRecordingTelemetrySummary();
 meter.add({type:'start',takeId:'a',frames:0,sampleRate:48000,channels:2});
 meter.add({type:'progress',takeId:'a',frames:48000,sampleRate:48000});
 meter.add({type:'progress',takeId:'a',frames:100,sampleRate:48000});
 let status=meter.snapshot();
 assert.equal(status.capturedSeconds,1);
 assert.equal(status.finalizedSeconds,0);
 assert.equal(status.startedCount,1);
 meter.add({type:'finalized',takeId:'a',frames:96000,sampleRate:48000});
 status=meter.snapshot();
 assert.equal(status.capturedSeconds,2);
 assert.equal(status.finalizedSeconds,2);
 assert.equal(status.finalizedCount,1);
});
test('PCM telemetry reports incomplete takes and storage errors without false success',()=>{
 const meter=createRecordingTelemetrySummary();
 meter.add({type:'start',takeId:'b',frames:0,sampleRate:44100,channels:1});
 meter.add({type:'progress',takeId:'b',frames:44100,sampleRate:44100});
 meter.add({type:'error',takeId:'b',message:'IndexedDB quota exceeded'});
 const status=meter.snapshot();
 assert.equal(status.capturedSeconds,1);
 assert.equal(status.finalizedSeconds,0);
 assert.equal(status.finalizedCount,0);
 assert.match(status.errors[0].message,/quota/);
});
