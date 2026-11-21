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

import {canTransferClip,transferClip} from '../dist/arrangement-layout.js';
test('vertical audio transfer preserves identity, gain, fades and active playlists',()=>{
 const clip={id:'clip1',audioId:'asset',start:40,length:4,sourceOffset:1,fadeIn:.2,gainDb:-2};
 const a={id:'a',type:'audio',clips:[clip],activePlaylist:'a1',playlists:[{id:'a1',clips:[clip]}]};
 const b={id:'b',type:'audio',clips:[],activePlaylist:'b1',playlists:[{id:'b1',clips:[]}]};
 assert.ok(transferClip({},a,b,clip));assert.deepEqual(a.clips,[]);assert.equal(b.clips[0],clip);assert.equal(b.playlists[0].clips[0].fadeIn,.2);assert.deepEqual(a.playlists[0].clips,[]);
});
test('incompatible, grouped, frozen and bus destinations are rejected',()=>{
 const c={id:'c',audioId:'asset',groupId:'g'},a={type:'audio',clips:[c]},b={type:'audio',clips:[]};
 assert.equal(canTransferClip(a,b,c),false);delete c.groupId;
 assert.equal(canTransferClip(a,{type:'bus',clips:[]},c),false);
 assert.equal(canTransferClip(a,{type:'piano',clips:[]},c),false);
 assert.equal(canTransferClip(a,{...b,frozenTrack:{}},c),false);
 assert.deepEqual(a.clips,[c]);
});
test('moving a pattern occurrence materializes its source channel without altering the shared pattern',()=>{
 const c={id:'c',patternId:'pat',start:4,length:4,notes:[]};
 const a={id:'a',type:'piano',clips:[c]},b={id:'b',type:'keys',clips:[]};
 const pat={id:'pat',bars:4,channels:{a:{notes:[{midi:60,step:0,len:4}]},b:{notes:[{midi:72,step:0,len:4}]}}};
 const before=structuredClone(pat);
 assert.ok(transferClip({patterns:[pat]},a,b,c));assert.equal(c.patternId,undefined);assert.equal(c.notes[0].midi,60);assert.equal(c.patternSteps,64);assert.deepEqual(pat,before);
});
