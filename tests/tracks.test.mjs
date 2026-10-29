import test from 'node:test';
import assert from 'node:assert/strict';
import {reorderTrackList,stepTrackDestination,clampTrackVolume} from '../dist/tracks.js';

test('reordering preserves track identity, clips, asset links and effects',()=>{
  const tracks=[{id:'a',clips:[{id:'take',audioId:'asset',sourceOffset:2.25}],effects:{glue:{enabled:true,threshold:-22}},volume:-9,pan:.4},{id:'b',clips:[]},{id:'c',clips:[]}];
  const moved=reorderTrackList(tracks,'a',null);
  assert.deepEqual(moved.map(t=>t.id),['b','c','a']);assert.deepEqual(tracks.map(t=>t.id),['a','b','c']);
  assert.equal(moved[2],tracks[0]);assert.equal(moved[2].clips,tracks[0].clips);assert.equal(moved[2].effects,tracks[0].effects);
  const restored=reorderTrackList(moved,'a','b');assert.deepEqual(restored,tracks);
  assert.equal(restored[0].clips[0].sourceOffset,2.25);assert.equal(restored[0].volume,-9);assert.equal(restored[0].pan,.4);
});
test('up/down destinations and invalid drops cannot remove or duplicate tracks',()=>{
  const tracks=['a','b','c','d'].map(id=>({id}));
  assert.deepEqual(reorderTrackList(tracks,'b',stepTrackDestination(tracks,'b',1)).map(t=>t.id),['a','c','b','d']);
  assert.deepEqual(reorderTrackList(tracks,'b',stepTrackDestination(tracks,'b',-1)).map(t=>t.id),['b','a','c','d']);
  for(const [id,before] of [['a','a'],['a','b'],['missing','a'],['a','missing']])assert.equal(reorderTrackList(tracks,id,before),tracks);
  assert.equal(stepTrackDestination(tracks,'a',-1),'a');assert.equal(stepTrackDestination(tracks,'d',1),'d');
});
test('track gain permits boosts to +12 dB and rejects non-finite edits',()=>{
  assert.equal(clampTrackVolume(12),12);assert.equal(clampTrackVolume(90),12);assert.equal(clampTrackVolume(-99),-48);
  assert.equal(clampTrackVolume('3.5'),3.5);assert.equal(clampTrackVolume('invalid'),null);assert.equal(clampTrackVolume(Infinity),null);assert.equal(clampTrackVolume(''),null);assert.equal(clampTrackVolume(null),null);
});
