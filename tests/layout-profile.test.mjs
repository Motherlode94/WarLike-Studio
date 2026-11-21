import test from 'node:test';
import assert from 'node:assert/strict';
import {layoutProfile} from '../dist/reference-workspace.js';
test('layout profiles have safe default and explicit FL opt-in',()=>{assert.equal(layoutProfile('fl'),'fl');for(const value of ['pt',null,undefined,'unknown'])assert.equal(layoutProfile(value),'pt');});
