import test from 'node:test';
import assert from 'node:assert/strict';
import {masteringSettings,MASTER_PRESETS,MASTER_MODULES,applyMasterPreset,matchMasterPreset,exportMasterRack,importMasterRack} from '../dist/mastering.js';
import {createFactorySession} from '../dist/content.js';

test('legacy sessions get disabled master modules and bounded parameters',()=>{
  const defaults=masteringSettings();assert.equal(defaults.bypass,false);
  for(const id of Object.keys(MASTER_MODULES))assert.equal(defaults[id].enabled,false);
  const result=masteringSettings({balance:{enabled:true,low:100,mid:NaN},peak:{enabled:true,ceiling:4,drive:-30}});
  assert.equal(result.balance.low,6);assert.equal(result.balance.mid,0);assert.equal(result.peak.ceiling,-.1);assert.equal(result.peak.drive,0);
});
test('master presets preserve track settings and master fader; projects do not share state',()=>{
  const first=createFactorySession(),second=createFactorySession(),tracks=structuredClone(first.tracks),volume=first.masterVolume;
  for(let i=0;i<MASTER_PRESETS.length;i++){applyMasterPreset(first,i);assert.equal(matchMasterPreset(first),i);assert.deepEqual(first.tracks,tracks);assert.equal(first.masterVolume,volume);}
  assert.equal(second.mastering,undefined);assert.throws(()=>applyMasterPreset(first,100));
});
test('master racks round-trip including bypass; invalid imports are atomic',()=>{
  const project=createFactorySession();applyMasterPreset(project,2);project.mastering.bypass=true;
  const saved=exportMasterRack(project),destination=createFactorySession();importMasterRack(destination,saved);assert.deepEqual(exportMasterRack(destination),saved);
  const invalid=structuredClone(saved);invalid.mastering.peak.ceiling='oops';assert.throws(()=>importMasterRack(destination,invalid));assert.deepEqual(exportMasterRack(destination),saved);
  saved.mastering.press.threshold=0;assert.notEqual(destination.mastering.press.threshold,0);
});
