import test from 'node:test';
import assert from 'node:assert/strict';
import {createFactorySession} from '../dist/content.js';
import {FRENCH_SONG_IDS} from '../dist/song-production.js';
import {presetsFor} from '../dist/bundle.js';
import {INSTRUMENTS} from '../dist/plugins.js';
const voices=['LEAD VOX','BACKS','ADLIBS'];
const signature=p=>p.tracks.map(t=>({
 type:t.type,preset:t.productionPreset,inserts:t.inserts,
 notes:t.clips.map(c=>c.notes?.map(({id,...n})=>n)||c.pattern)
}));
test('all seven French pop/R&B songs load explicit factory presets and six independent racks',()=>{
 assert.equal(FRENCH_SONG_IDS.length,7);
 for(const id of FRENCH_SONG_IDS){
  const song=createFactorySession(id,true);
  assert.equal(song.tracks.length,9,id);
  assert.deepEqual(song.tracks.slice(-3).map(t=>t.name),voices);
  assert(song.tracks.slice(-3).every(t=>t.type==='audio'&&t.clips.length===0));
  for(const [role,track] of song.tracks.slice(0,6).entries()){
   assert(INSTRUMENTS[track.type],id+': instrument '+track.type);
   assert.equal(track.productionPreset,presetsFor(track,'instrument')[track.productionPresetIndex]?.name,id+' role '+role);
   assert(track.productionPreset.length>0,id+' role '+role+' should not be an unlabelled generic default');
   assert(track.inserts.some(x=>x&&x!=='echo'),id+' role '+role+' requires useful native processing');
   assert(track.clips.length>=6,id+' role '+role+' requires arranged music');
  }
  assert(song.tracks[0].instrument.kit===2||song.tracks[0].instrument.kit===0||song.tracks[0].instrument.kit===1);
  assert.equal(song.mastering.peak.ceiling,-1.5,id);
 }
});
test('performances are deterministic but expressive and do not have identical note dynamics',()=>{
 for(const id of FRENCH_SONG_IDS){
  const a=createFactorySession(id,true),b=createFactorySession(id,true);
  assert.deepEqual(signature(a),signature(b),id+' unexpectedly random playback');
  const noteTracks=a.tracks.slice(1,6).flatMap(t=>t.clips.flatMap(c=>c.notes||[]));
  assert(noteTracks.length>90,id+' needs significant MIDI composition');
  const velocities=new Set(noteTracks.map(n=>Math.round(n.velocity*1000)));
  const fractionalOffsets=noteTracks.filter(n=>Math.abs(n.step-Math.round(n.step))>.01);
  assert(velocities.size>18,id+' must not use one robotic note velocity');
  assert(fractionalOffsets.length>noteTracks.length*.08,id+' must have gentle human timing');
  for(const t of a.tracks.slice(0,6))for(const c of t.clips)for(const n of c.notes||[]){
   assert(n.step>=0&&n.len>0&&n.step+n.len<=c.patternSteps+.00011,id+' bad clip note');
   assert(n.velocity>0&&n.velocity<=1,id+' clipped velocity');
  }
 }
});
test('unchanged older catalog songs retain their native unprocessed production path',()=>{
 const older=createFactorySession('rives',true);
 assert(older.tracks.slice(0,6).every(t=>!t.productionPreset));
 assert.equal(older.tracks[0].clips[0].pattern.kick.length,64);
});
