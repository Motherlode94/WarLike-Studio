import test from 'node:test';
import assert from 'node:assert/strict';
import {EFFECTS,formatParam} from '../dist/plugins.js';
import {readFile} from 'node:fs/promises';

const keys=id=>EFFECTS[id].controls.map(c=>c.key);

test('thin core effects gained real controls', ()=>{
  assert.deepEqual(keys('aura'),['mix','preDelay','decay','tone']);
  assert.deepEqual(keys('echo'),['mix','feedback','division','tone']);
  assert.deepEqual(keys('sculpt'),['highpass','cutoff','resonance']);
  assert.deepEqual(keys('color'),['drive','mix','output','tone']);
});

test('new controls default to the historical sound', ()=>{
  const d=(id,key)=>EFFECTS[id].controls.find(c=>c.key===key).default;
  assert.equal(d('aura','decay'),1.8,'historical AURA tail');
  assert.equal(d('aura','preDelay'),0);
  assert.equal(d('echo','division'),.75,'historical dotted-eighth echo');
  assert.equal(d('sculpt','resonance'),.5,'historical filter Q');
  for(const [id,key] of [['color','tone'],['echo','tone'],['aura','tone']])assert.equal(d(id,key),20000);
  assert.equal(formatParam(EFFECTS.echo.controls.find(c=>c.key==='division'),.75),'0.75 ♩');
});

test('the DSP wires every new control and bypasses tone filters at 20 kHz', async()=>{
  const src=await readFile(new URL('../dist/audio.js',import.meta.url),'utf8');
  for(const needle of ['ch.colorTone.frequency','ch.echoTone.frequency','ch.auraPreDelay.delayTime','ch.auraTone.frequency','this.impulse(ch.input.context,decay)','e.sculpt.resonance','e.echo?.division??.75','echo?.division??.75'])
    assert.ok(src.includes(needle.replace('e.echo?.','tr.effects?.echo?.').replace(/^echo/,'tr.effects?.echo'))||src.includes(needle),needle);
  assert.match(src,/v>=19950\?ch\.input\.context\.sampleRate\/2/);
});
