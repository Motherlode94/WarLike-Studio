import test from 'node:test';import assert from 'node:assert/strict';import {VOX_LEVEL_BANKS,voxReduction} from '../dist/vox-level-face.js';import {MASTER_MODULES} from '../dist/mastering.js';
test('six distinct native VOX LEVEL parameters',()=>assert.deepEqual(VOX_LEVEL_BANKS.flatMap(([,k])=>k).sort(),MASTER_MODULES.voxlevel.controls.map(c=>c.key).sort()));
test('meter clamps the actual negative compressor reading',()=>{assert.equal(voxReduction(-12),12);assert.equal(voxReduction(-40),24);assert.equal(voxReduction(1),0);assert.equal(voxReduction(NaN),0);});
