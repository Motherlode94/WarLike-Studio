import test from 'node:test';
import assert from 'node:assert/strict';
import {defaultProject} from '../dist/audio.js';
import {INSTRUMENTS,EFFECTS,ensurePlugins} from '../dist/plugins.js';
import {FACTORY_PRESETS,applyFactoryPreset,matchPreset,exportRack,importRack} from '../dist/bundle.js';
import {constrainWindow} from '../dist/windows.js';

test('every factory sound stays within its processor range',()=>{
  const project=defaultProject();project.tracks.forEach(ensurePlugins);
  for(const [id,presets] of Object.entries(FACTORY_PRESETS)){
    const instrument=INSTRUMENTS[id],track={type:instrument?id:'audio'};ensurePlugins(track);
    const def=instrument||EFFECTS[id],target=instrument?'instrument':id;
    for(let i=0;i<presets.length;i++){applyFactoryPreset(track,target,i);assert.equal(matchPreset(track,target),i);for(const c of def.controls){const v=(instrument?track.instrument:track.effects[id])[c.key];assert.ok(v>=c.min&&v<=c.max);}}
  }
});
test('rack export/import preserves zero settings and bypass',()=>{
  const track=defaultProject().tracks[1];ensurePlugins(track);track.instrument.harmonics=0;track.effects.color.drive=0;track.effects.echo.enabled=false;track.effects.aura.mix=.42;
  const saved=exportRack(track),destination=defaultProject().tracks[1];ensurePlugins(destination);importRack(destination,saved);
  assert.deepEqual(exportRack(destination),saved);assert.equal(destination.instrument.harmonics,0);assert.equal(destination.effects.color.drive,0);assert.equal(destination.effects.echo.enabled,false);
});
test('changing a preset on one track leaves another track untouched',()=>{
  const [drums,bass]=defaultProject().tracks;[drums,bass].forEach(ensurePlugins);const before=exportRack(bass);applyFactoryPreset(drums,'instrument',1);assert.deepEqual(exportRack(bass),before);
});
test('invalid or mismatched racks leave the destination unchanged',()=>{
  const project=defaultProject();project.tracks.forEach(ensurePlugins);const track=project.tracks[0],before=exportRack(track);
  assert.throws(()=>importRack(track,exportRack(project.tracks[1])));assert.deepEqual(exportRack(track),before);
  const invalid=structuredClone(before);invalid.effects.color.drive='invalid';assert.throws(()=>importRack(track,invalid));assert.deepEqual(exportRack(track),before);
});
test('floating windows keep their title bar and close button reachable',()=>{
  const pos=constrainWindow(-100,-100,850,600,1365,936);assert.deepEqual(pos,{x:8,y:8});
  const edge=constrainWindow(9000,9000,850,600,1365,936);assert.equal(edge.x,507);assert.equal(edge.y,868);
  assert.deepEqual(constrainWindow(200,200,850,600,320,500),{x:8,y:200});
});
