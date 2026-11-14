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

test('public Afro and R&B demos have distinct complete musical arrangements',()=>{
  for(const [id,bpm,key,type] of [['soleil',108,2,'strum'],['brume',84,0,'epiano']]){
    const template=SESSION_TEMPLATES.find(x=>x.id===id);
    assert.ok(template);
    assert.equal(template.bpm,bpm);
    const session=createFactorySession(id);
    assert.equal(session.bars,16);
    assert.equal(session.bpm,bpm);
    assert.equal(session.pianoKey,key);
    assert.equal(session.tracks.length,9);
    assert.equal(session.tracks.filter(x=>x.type==='audio').length,3);
    assert.ok(session.tracks.some(x=>x.type===type&&x.clips.some(c=>c.notes?.length)));
    assert.ok(session.tracks.some(x=>x.type==='drums'&&x.clips.some(c=>Object.values(c.pattern||{}).some(row=>row.some(Boolean)))));
    assert.equal(session.tracks.some(x=>x.clips.some(c=>c.audioId)),false);
  }
  const afro=createFactorySession('soleil'),rnb=createFactorySession('brume');
  assert.notDeepEqual(afro.tracks[0].clips[0].pattern,rnb.tracks[0].clips[0].pattern);
  assert.notEqual(afro.tracks[0].id,rnb.tracks[0].id);
});
