import test from 'node:test';
import assert from 'node:assert/strict';
import {groupRecordingChunks,journalBacklogExceeded,MAX_JOURNAL_BACKLOG_SECONDS} from '../dist/recording-recovery.js';

test('recovery merges multiple stereo PCM blocks without altering sample order',()=>{
 const blocks=[
   {length:3,channels:[Float32Array.from([.1,.2,.3]),Float32Array.from([.4,.5,.6])]},
   {length:2,channels:[Float32Array.from([.7,.8]),Float32Array.from([.9,1])]}
 ];
 const output=groupRecordingChunks(blocks,2);
 assert.equal(output.numberOfChannels,2);
 assert.equal(output.length,5);
 assert.deepEqual([...output.getChannelData(0)],[...Float32Array.from([.1,.2,.3,.7,.8])]);
 assert.deepEqual([...output.getChannelData(1)],[...Float32Array.from([.4,.5,.6,.9,1])]);
});
test('recovery rejects empty or mismatched blocks',()=>{
 assert.throws(()=>groupRecordingChunks([],1),/Aucune donnée/);
 assert.throws(()=>groupRecordingChunks([{length:2,channels:[Float32Array.from([1])]}],1),/incomplet/);
 assert.throws(()=>groupRecordingChunks([{length:1,channels:[Float32Array.of(1)]}],2),/incompatible/);
});

test('journal throttles memory to twelve seconds of pending PCM',()=>{
 const rate=48000,max=rate*MAX_JOURNAL_BACKLOG_SECONDS;
 assert.equal(journalBacklogExceeded(max-4096,4096,rate),false);
 assert.equal(journalBacklogExceeded(max-4096,4097,rate),true);
 assert.equal(journalBacklogExceeded(0,max+1,rate),true);
 assert.equal(journalBacklogExceeded(rate,rate,rate),false);
});
