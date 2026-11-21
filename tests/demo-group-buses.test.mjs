import test from 'node:test';
import assert from 'node:assert/strict';
import {routePublicDemoGroups} from '../dist/demo-group-buses.js';
const track=(id,type,output='master')=>({id,type,name:id,output,volume:-8,clips:[{id:'clip-'+id}],sends:[]});
test('factory tracks route to independent unity gain buses',()=>{
 const p={publicDemo:true,masterVolume:-6,tracks:[track('kick','drums'),track('808','bass'),track('piano','keys'),track('lead','audio')]};
 const original=structuredClone(p.tracks);
 routePublicDemoGroups(p);
 assert.equal(p.tracks.length,8);
 for(const [i,role] of ['drums','bass','music','vocals'].entries()){
  const t=p.tracks[i],bus=p.tracks.find(x=>x.id===t.output);
  assert.equal(bus.id,'demo-bus-'+role);assert.equal(bus.type,'bus');assert.equal(bus.output,'master');assert.equal(bus.volume,0);
  assert.deepEqual({...t,output:'master'},original[i]);
 }
 assert.equal(p.masterVolume,-6);
 const snapshot=structuredClone(p);routePublicDemoGroups(p);assert.deepEqual(p,snapshot);
});
test('existing routing, sends and user sessions are preserved',()=>{
 const t=track('keys','keys','custom');t.sends=[{id:'send',target:'custom'}];
 const p={publicDemo:true,tracks:[t,{id:'custom',type:'bus',output:'master',clips:[]}]};
 const original=structuredClone(p.tracks);routePublicDemoGroups(p);assert.deepEqual(p.tracks,original);
 const user={tracks:[track('kick','drums')]};const snapshot=structuredClone(user);routePublicDemoGroups(user);assert.deepEqual(user,snapshot);
});
