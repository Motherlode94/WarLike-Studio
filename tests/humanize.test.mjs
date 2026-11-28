import test from 'node:test';
import assert from 'node:assert/strict';
import {hash01,noteVariance,hitVariance,humanizeNotes,humanizePattern,HUMANIZE_PRESETS} from '../dist/humanize.js';
import {INSTRUMENTS,NEW_TRACK_FEEL} from '../dist/plugins.js';
import {createContentTrack} from '../dist/content.js';

test('variance is seeded by musical position: same input, same result',()=>{
  assert.deepEqual(noteVariance(.3,'t',12),noteVariance(.3,'t',12));
  assert.notDeepEqual(noteVariance(.3,'t',12),noteVariance(.3,'t',16));
  assert.deepEqual(noteVariance(0,'t',12),{cents:0,gain:1});assert.deepEqual(hitVariance(0,'t','kick',4),{gain:1,pitch:1,decay:1});
});

test('ranges follow the documented maximums',()=>{
  for(let i=0;i<500;i++){const n=noteVariance(1,'s',i),h=hitVariance(1,'s','snare',i);
    assert.ok(Math.abs(n.cents)<=15&&Number.isInteger(n.cents));assert.ok(Math.abs(20*Math.log10(n.gain))<=1.5+1e-9);
    assert.ok(Math.abs(20*Math.log10(h.gain))<=2+1e-9);assert.ok(Math.abs(1200*Math.log2(h.pitch))<=30+1e-9);assert.ok(Math.abs(h.decay-1)<=.08+1e-9);}
});

test('per-hit variance is not a short cycle',()=>{
  const values=Array.from({length:64},(_,i)=>hitVariance(1,'t','kick',i*4).gain.toFixed(4));
  assert.ok(new Set(values).size>50,'64 consecutive kicks are (almost) all different');
});

test('Logic-style Humanize moves position, velocity and length within the preset',()=>{
  const notes=Array.from({length:40},(_,i)=>({id:'n'+i,step:i,len:2,midi:60,velocity:.8}));
  const p=HUMANIZE_PRESETS.subtle,out=humanizeNotes(notes,p,'seed',64);
  assert.ok(out.some((n,i)=>n.step!==notes[i].step)&&out.some((n,i)=>n.velocity!==notes[i].velocity));
  for(const [i,n] of out.entries()){assert.ok(Math.abs(n.step-notes[i].step)<=p.position/240+1/96);assert.ok(Math.abs(n.velocity-.8)<=p.velocity/127+.001);assert.equal(n.midi,60);}
  assert.deepEqual(humanizeNotes(notes,p,'seed',64),out,'same seed, same result');
  const pat=humanizePattern({kick:[1,0,0,0,1]},{velocity:10},'x');assert.equal(pat.kick[1],0);assert.ok(pat.kick[0]<=1&&pat.kick[0]>=.9);
  assert.ok(hash01('a')!==hash01('b'));
});

test('saved projects keep their sound, new tracks start with a human feel',()=>{
  for(const id of ['bass','keys','lead','pad','pluck'])assert.equal(INSTRUMENTS[id].controls.find(c=>c.key==='analog').default,0);
  assert.equal(INSTRUMENTS.drums.controls.find(c=>c.key==='humanize').default,0);
  assert.equal(createContentTrack('lead').instrument.analog,NEW_TRACK_FEEL.lead.analog);
  assert.equal(createContentTrack('drums').instrument.humanize,NEW_TRACK_FEEL.drums.humanize);
});
