import test from 'node:test';import assert from 'node:assert/strict';
import {contextPosition,action,group} from '../dist/context-menus.js';
test('context menus clamp to viewport edges',()=>{assert.deepEqual(contextPosition(790,590,210,200,800,600),{left:586,top:396});assert.deepEqual(contextPosition(-10,-10,200,100,400,600),{left:4,top:4});});
test('disabled context groups cannot offer unavailable commands',()=>{const a=action('a','A',()=>{},true),b=action('b','B',()=>{});assert.equal(group('g','G',[a]).disabled,true);assert.equal(group('g','G',[a,b]).disabled,false);});
