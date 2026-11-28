import test from 'node:test';
import assert from 'node:assert/strict';
import {AUTOMATION_MODES,READS_CURVES,startPass,writePass,finishPass,AUTOMATCH_BARS} from '../dist/automation-modes.js';
import {pointValue} from '../dist/automation.js';

const track=(points)=>({id:'t',volume:-6,automation:{mode:'touch',curves:points?{volume:points.map(p=>({...p}))}:{}}});

test('Pro Tools modes are available and all of them except off read curves',()=>{
  assert.deepEqual(AUTOMATION_MODES,['off','read','touch','latch','write']);
  for(const m of ['read','touch','latch','write'])assert.ok(READS_CURVES.has(m));assert.ok(!READS_CURVES.has('off'));
});

test('a Touch pass overwrites the old moves then glides back to the original curve',()=>{
  const t=track([{bar:0,value:-6},{bar:2,value:-12},{bar:4,value:0},{bar:8,value:-6}]);
  const pass=startPass(t,'volume',1,-3);
  writePass(t,pass,1.5,-3,-6);writePass(t,pass,3,-2,-6);
  finishPass(t,pass,3,-6,{bars:16});
  const c=t.automation.curves.volume;
  assert.ok(!c.some(p=>p.bar===2),'old point inside the pass is replaced');
  assert.equal(pointValue(c,0,0),-6,'before the pass untouched');
  assert.equal(pointValue(c,1,0),pointValue([{bar:0,value:-6},{bar:2,value:-12}],1,0),'anchor keeps the curve shape at the start');
  assert.equal(pointValue(c,3,0),-2,'held value at release');
  const back=3+AUTOMATCH_BARS;assert.equal(pointValue(c,back,0),pointValue([{bar:2,value:-12},{bar:4,value:0}],back,0),'returns to the original curve');
  assert.equal(pointValue(c,8,0),-6,'after the pass untouched');
});

test('a Latch pass keeps the last value until stop, then returns to the static level',()=>{
  const t=track(null);t.automation.mode='latch';
  const pass=startPass(t,'volume',0,-10);
  writePass(t,pass,.5,-10,-6);pass.latched=true;
  for(let bar=1;bar<=6;bar++)writePass(t,pass,bar,pass.value,-6);
  finishPass(t,pass,6,-6,{bars:16});
  const c=t.automation.curves.volume;
  assert.equal(pointValue(c,3,0),-10);assert.equal(pointValue(c,6,0),-10);
  assert.equal(pointValue(c,6+AUTOMATCH_BARS,0),-10,'no prior curve: returns to the level before the pass');
});

test('a Touch pass on a static track returns to the level held before the gesture',()=>{
  const t=track(null);t.volume=-25;// the fader already moved during the gesture
  const pass=startPass(t,'volume',2,-6);
  writePass(t,pass,2.5,-12,-25);writePass(t,pass,3,-25,-25);
  finishPass(t,pass,3,-25,{bars:16});
  assert.equal(pointValue(t.automation.curves.volume,1,0),-6,'before: original level');
  assert.equal(pointValue(t.automation.curves.volume,3+AUTOMATCH_BARS,0),-6,'after release: back to -6, not to the moved fader');
});
