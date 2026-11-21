import test from 'node:test';
import assert from 'node:assert/strict';
import {snapBar,splitClip,trimClip} from '../dist/editing.js';
const clip={id:'a',start:0,length:2,audioId:'x',sourceOffset:0};
test('invalid grid falls back to sixteenth bar',()=>assert.equal(snapBar(.24,'grid',0),.25));
test('invalid position cannot corrupt clip',()=>{assert.equal(splitClip(clip,NaN,120,'b'),null);assert.deepEqual(trimClip(clip,'right',NaN,4,120),clip);});
test('valid split preserves source offset',()=>{const [a,b]=splitClip(clip,1,120,'b');assert.equal(a.length,1);assert.equal(b.sourceOffset,2);});
