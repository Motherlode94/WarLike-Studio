import test from 'node:test';
import assert from 'node:assert/strict';
import {createFactorySession,SESSION_TEMPLATES} from '../dist/content.js';

test('public Trap demo is a playable, self-contained 16-bar arrangement',()=>{
  const template=SESSION_TEMPLATES.find(x=>x.id==='nocturne');
  assert.ok(template);
  assert.equal(template.bpm,138);
  const demo=createFactorySession('nocturne');
  assert.equal(demo.bars,16);
  assert.equal(demo.pianoScale,'minor');
  assert.equal(demo.pianoKey,6);
  assert.equal(demo.tracks.length,9);
  assert.equal(demo.tracks.filter(x=>x.type==='audio').length,3);
  assert.ok(demo.tracks.some(x=>x.type==='drums'&&x.clips.some(c=>Object.values(c.pattern||{}).some(row=>row.some(Boolean)))));
  assert.ok(demo.tracks.some(x=>x.type==='bass'&&x.clips.some(c=>c.notes?.length)));
  assert.ok(demo.tracks.filter(x=>x.type!=='audio').every(x=>x.clips.length));
  assert.equal(demo.tracks.some(x=>x.clips.some(c=>c.audioId)),false);
});
test('demo visitors can receive independent local copies without modifying source session',()=>{
  const a=createFactorySession('nocturne'),b=createFactorySession('nocturne');
  const original=b.tracks[0].clips[0].pattern.kick.slice();
  a.tracks[0].clips[0].pattern.kick.fill(0);
  assert.deepEqual(b.tracks[0].clips[0].pattern.kick,original);
  assert.notEqual(a.tracks[0].id,b.tracks[0].id);
  assert.notEqual(a.tracks[0].clips[0].id,b.tracks[0].clips[0].id);
});
