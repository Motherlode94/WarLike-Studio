import test from 'node:test';
import assert from 'node:assert/strict';
import {arrangementShift,arrangementWidth} from '../dist/arrangement-layout.js';
test('clips cross initial session boundary without losing length or group spacing',()=>{
 assert.deepEqual(arrangementShift([{start:12,length:4},{start:8,length:2}],64,16),{shift:64,bars:80});
 assert.deepEqual(arrangementShift([{start:1,length:2}],-8,16),{shift:-1,bars:16});
 assert.deepEqual(arrangementShift([{start:12,length:4}],9999,16),{shift:2032,bars:2048});
});
test('long sessions scroll instead of compressing all bars into viewport',()=>{
 assert.ok(arrangementWidth(1000,1,128)>1000);
 assert.ok(arrangementWidth(1000,1,256)>arrangementWidth(1000,1,128));
});
