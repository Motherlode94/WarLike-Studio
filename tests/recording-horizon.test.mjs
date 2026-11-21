import test from 'node:test';
import assert from 'node:assert/strict';
import {recordingHorizon} from '../dist/recording-horizon.js';
test('recording extends before scheduler reaches initial endpoint',()=>{
 assert.equal(recordingHorizon(4,0),4);
 assert.ok(recordingHorizon(4,50)>4);
 assert.ok(recordingHorizon(16,400)>25);
 assert.equal(recordingHorizon(2048,32768),2048);
});
