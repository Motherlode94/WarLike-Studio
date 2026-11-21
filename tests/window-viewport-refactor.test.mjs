import test from 'node:test';
import assert from 'node:assert/strict';
import {constrainWindow} from '../dist/windows.js';
test('entire floating window remains visible',()=>assert.deepEqual(constrainWindow(900,900,400,300,1000,700),{x:592,y:392}));
test('oversized window anchors to safe margin',()=>assert.deepEqual(constrainWindow(90,90,800,800,320,480),{x:8,y:8}));
