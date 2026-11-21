import test from 'node:test';
import assert from 'node:assert/strict';
import {balancePublicDemo} from '../dist/demo-gain-staging.js';
const make=()=>({publicDemo:true,masterVolume:-9,tracks:[{type:'piano',volume:-15,clips:[{}]},{type:'drums',volume:-7,clips:[{}]},{type:'exo',name:'SOUL BASS',volume:-7,clips:[{}]},{type:'audio',volume:-5,clips:[{}]},{type:'audio',volume:-3,clips:[]}]});
test('demo melody gains relative presence without raising master',()=>{
 const p=make();balancePublicDemo(p);assert.deepEqual(p.tracks.map(t=>t.volume),[-11,-8,-6,-7,-3]);assert.equal(p.masterVolume,-9);const snap=structuredClone(p);balancePublicDemo(p);assert.deepEqual(p,snap);
});
test('user projects are untouched',()=>{const p=make();delete p.publicDemo;const snap=structuredClone(p);balancePublicDemo(p);assert.deepEqual(p,snap)});
test('boost does not exceed unity and invalid values untouched',()=>{const p={publicDemo:true,tracks:[{type:'keys',volume:-1,clips:[{}]},{type:'keys',volume:NaN,clips:[{}]}]};balancePublicDemo(p);assert.equal(p.tracks[0].volume,0);assert.ok(Number.isNaN(p.tracks[1].volume))});
