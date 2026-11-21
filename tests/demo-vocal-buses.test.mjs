import test from 'node:test';
import assert from 'node:assert/strict';
import {routeVocalSubgroups} from '../dist/demo-vocal-buses.js';
import {routePublicDemoGroups} from '../dist/demo-group-buses.js';
import {createVocalDemoSession} from '../dist/vocal-demo-sessions.js';
for(const kind of ['vox-trap','vox-afro','vox-rnb'])test(kind+' subgroup routing',()=>{
 const p=createVocalDemoSession(kind);p.publicDemo=true;
 const voices=p.tracks.filter(t=>t.type==='audio');
 for(const t of voices)t.clips=[{id:'clip'}];
 routePublicDemoGroups(p);
 const before=structuredClone(voices);
 routeVocalSubgroups(p);
 const master=p.tracks.find(t=>t.id==='demobusvocals');
 assert.equal(master.output,'master');
 for(const [i,role] of ['lead','backing','adlibs'].entries()){
  const bus=p.tracks.find(t=>t.id==='demovox'+role);
  assert.equal(bus.output,master.id);assert.equal(bus.volume,0);
  assert.equal(voices[i].output,bus.id);
  assert.deepEqual({...voices[i],output:before[i].output},before[i]);
 }
 const snapshot=structuredClone(p);routeVocalSubgroups(p);assert.deepEqual(p,snapshot);
});
test('user projects remain untouched',()=>{
 const p=createVocalDemoSession('vox-trap');delete p.publicDemo;const before=structuredClone(p);routeVocalSubgroups(p);assert.deepEqual(p,before);
});
