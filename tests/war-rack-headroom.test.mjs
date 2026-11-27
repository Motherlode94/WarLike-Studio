import test from 'node:test';import assert from 'node:assert/strict';
import {adaptRackHeadroom,filterRacks} from '../dist/war-rack-browser.js';
import {makeRack} from '../dist/war-rack-core.js';
test('measured trim preserves a creative EQ rather than replacing its colour',()=>{
 const r=makeRack('test','Prémix coloré','Tous','Keys','premix',[['tilteq',{tilt:4,pivot:1800,mix:.6,output:2}]]);
 const result=adaptRackHeadroom(r,{gainDb:-6});
 assert.equal(result.stages.length,2);assert.equal(result.stages[0].values.output,-6);assert.deepEqual(result.stages[1],r.stages[0]);assert.equal(r.stages.length,1);
 assert.throws(()=>adaptRackHeadroom(r,{gainDb:null}),/Source/);assert.throws(()=>adaptRackHeadroom(r,{gainDb:-13}),/Réduction/);
});
test('neutral trim combines gain within range and accent-insensitive search finds a preset',()=>{
 const r=makeRack('test','Prémix coloré','Tous','Keys','premix',[['tilteq',{tilt:0,mix:1,output:-2}]]);
 assert.equal(adaptRackHeadroom(r,{gainDb:-4}).stages[0].values.output,-6);
 assert.equal(filterRacks([r],{track:{type:'piano'},query:'premix colore'}).length,1);
 assert.throws(()=>adaptRackHeadroom(r,{gainDb:-12}),/Trim/);
});
