import test from 'node:test';
import assert from 'node:assert/strict';
import {resizePattern,MAX_PATTERN_STEPS,patternBarOptions} from '../dist/piano-model.js';
test('128-bar patterns preserve late notes and extend drums with silence',()=>{
 const c={patternId:'p',patternSteps:64,length:4,notes:[{id:'n',step:48,midi:60,len:4}]};
 const p={patterns:[{id:'p',bars:4,channels:{a:{notes:structuredClone(c.notes)},b:{pattern:{kick:[1]}}}}],tracks:[{id:'a',clips:[c]}]};
 resizePattern(p,c,128);assert.equal(c.patternSteps,2048);assert.equal(c.length,4);assert.equal(c.notes[0].step,48);assert.equal(p.patterns[0].channels.b.pattern.kick.length,2048);assert.equal(p.patterns[0].channels.b.pattern.kick[2047],0);
 c.notes.push({id:'late',step:1900,midi:62,len:4});resizePattern({},c,128);assert.equal(c.notes[1].step,1900);
 assert.equal(MAX_PATTERN_STEPS,2048);assert.equal(patternBarOptions.length,128);
});
test('shrinking removes out-of-range notes rather than stacking them at the end',()=>{
 const c={notes:[{step:30,midi:60,len:8},{step:64,midi:62,len:4}]};resizePattern({},c,2);assert.equal(c.notes.length,1);assert.equal(c.notes[0].len,2);
});
