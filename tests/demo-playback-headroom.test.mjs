import test from 'node:test';
import assert from 'node:assert/strict';
import {createFactorySession} from '../dist/content.js';
import {createVocalDemoSession} from '../dist/vocal-demo-sessions.js';
import {masteringSettings} from '../dist/mastering.js';

const factory=['nocturne','soleil','brume'];
const vocal=['vox-trap','vox-afro','vox-rnb'];

test('Trap, Afro and R&B factory demos reserve gain headroom and protect the stereo output',()=>{
 for(const style of factory){
  const session=createFactorySession(style);
  assert.equal(session.demo,true,style);
  assert.equal(session.bars,16,style);
  assert.equal(session.masterVolume,-9,style);
  const rack=masteringSettings(session.mastering);
  assert.equal(rack.bypass,false,style);
  assert.equal(rack.inserts[0],'peak',style);
  assert.equal(rack.peak.enabled,true,style);
  assert.equal(rack.peak.drive,0,style);
  assert.equal(rack.peak.ceiling,-1.5,style);
  assert.equal(rack.peak.release,140,style);
  assert.ok(session.tracks.some(track=>track.type==='drums'&&track.clips.length),style);
  assert.ok(session.tracks.some(track=>track.type!=='audio'&&track.type!=='drums'&&track.clips.length),style);
  for(const track of session.tracks){
   assert.ok(Number.isFinite(track.volume),style+': '+track.name);
   assert.ok(track.volume<=0,style+': '+track.name);
  }
 }
});

test('vocal demos inherit safety headroom without touching editable vocal inserts',()=>{
 for(const kind of vocal){
  const session=createVocalDemoSession(kind);
  assert.equal(session.masterVolume,-9,kind);
  assert.equal(masteringSettings(session.mastering).peak.enabled,true,kind);
  const tracks=session.tracks.filter(t=>t.type==='audio');
  assert.equal(tracks.length,3,kind);
  assert.ok(tracks.every(t=>t.inserts.filter(Boolean).length>=3),kind);
 }
});

test('changing a demo master rack never mutates a newly created demo',()=>{
 const a=createFactorySession('soleil');
 const b=createFactorySession('soleil');
 a.mastering.peak.ceiling=-6;
 a.mastering.inserts.length=0;
 assert.equal(b.mastering.peak.ceiling,-1.5);
 assert.deepEqual(b.mastering.inserts,['peak']);
});
