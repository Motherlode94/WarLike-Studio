import test from 'node:test';import assert from 'node:assert/strict';import {compressorCurve,reductionAngle} from '../dist/vector-comp-face.js';
test('hard knee follows unity below threshold and ratio above',()=>{assert.equal(compressorCurve(-30,-20,4,0),-30);assert.equal(compressorCurve(0,-20,4,0),-15);assert.equal(compressorCurve(0,-20,1,0),0);});
test('soft knee joins hard-knee endpoints continuously',()=>{assert.equal(compressorCurve(-26,-20,4,12),-26);assert.equal(compressorCurve(-14,-20,4,12),-18.5);assert.ok(compressorCurve(-20,-20,4,12)<-20);});
test('gain reduction needle clamps real reduction and invalid values',()=>{assert.equal(reductionAngle(0),-55);assert.equal(reductionAngle(-12),0);assert.equal(reductionAngle(-50),55);assert.equal(reductionAngle(NaN),-55);});
