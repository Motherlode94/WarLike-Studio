import test from 'node:test';import assert from 'node:assert/strict';
import {masteringSettings,MASTER_MODULES,exportMasterRack,importMasterRack} from '../dist/mastering.js';
import {insertRackSplit,placeRackModule,moveRackItem,removeRackItem,rackLeaves,setRackMacro,masterRackLatency} from '../dist/master-rack-model.js';
test('parallel lanes and repeated effects preserve independent values and their serial position',()=>{
 let s=masteringSettings(),split=insertRackSplit(s,3);const [a,b]=s.splits[split].branches;
 const first=placeRackModule(s,{splitId:split,branchId:a.id,index:0},'glue',MASTER_MODULES),second=placeRackModule(s,{splitId:split,branchId:b.id,index:0},'glue',MASTER_MODULES);
 assert.notEqual(first,second);s[first].threshold=-30;s[second].threshold=-10;s=masteringSettings(s);assert.equal(s[first].threshold,-30);assert.equal(s[second].threshold,-10);assert.equal(s.inserts[3],split);assert.equal(masterRackLatency(s),.006);
 moveRackItem(s,{splitId:split,branchId:b.id,index:0},{index:0});assert.equal(s.inserts[0],second);assert.equal(masterRackLatency(s),.012);
 moveRackItem(s,{index:0},{index:1},{duplicate:true});assert.equal(rackLeaves(s).length,3);removeRackItem(s,{index:3});assert.equal(rackLeaves(s).length,2);
});
test('full rack export roundtrips branches, stereo modes, gains and macro mappings atomically',()=>{
 const project={mastering:masteringSettings()},s=project.mastering,id=insertRackSplit(s,0,'bands'),branch=s.splits[id].branches[0];branch.mode='mid';branch.gainDb=-3;
 const fx=placeRackModule(s,{splitId:id,branchId:branch.id,index:0},'vectoreq',MASTER_MODULES);s.macros=[{name:'Air',value:0,targets:[{moduleId:fx,key:'g5',min:-6,max:6}]}];setRackMacro(s,0,.75);assert.equal(s[fx].g5,3);
 const saved=exportMasterRack(project);assert.equal(saved.version,2);const target={};importMasterRack(target,saved);assert.deepEqual(target.mastering,masteringSettings(s));
 const bad=structuredClone(saved);bad.mastering.splits[id].frequencies=[NaN];assert.throws(()=>importMasterRack(target,bad));assert.deepEqual(exportMasterRack(target),saved);
});
test('malformed, cyclic and over-budget routing cannot enter a rack',()=>{
 const s=masteringSettings(),id=insertRackSplit(s,0),[a,b]=s.splits[id].branches;const fx=placeRackModule(s,{splitId:id,branchId:a.id,index:0},'glue',MASTER_MODULES);
 b.inserts[0]=fx;assert.throws(()=>masteringSettings(s),/deux fois/);b.inserts[0]=id;assert.throws(()=>masteringSettings(s));
 b.inserts[0]=null;assert.throws(()=>moveRackItem(s,{index:0},{splitId:id,branchId:b.id,index:0}),/principale/);
 s.splits[id].branches=Array.from({length:9},()=>structuredClone(a));assert.throws(()=>masteringSettings(s));
});
test('invalid extra-instance parameters fail import without replacing the current graph',()=>{
 const project={mastering:masteringSettings()},s=project.mastering,split=insertRackSplit(s,0),[a,b]=s.splits[split].branches;
 placeRackModule(s,{splitId:split,branchId:a.id,index:0},'glue',MASTER_MODULES);const extra=placeRackModule(s,{splitId:split,branchId:b.id,index:0},'glue',MASTER_MODULES),saved=exportMasterRack(project);
 for(const wrong of [undefined,NaN,'-20']){const malformed=structuredClone(saved);malformed.mastering[extra].threshold=wrong;assert.throws(()=>importMasterRack(project,malformed),/invalides/);assert.deepEqual(exportMasterRack(project),saved);}
});
test('the 64-module budget includes every parallel lane and copied instance',()=>{
 const s=masteringSettings(),split=insertRackSplit(s,0),base=s.splits[split].branches[0];s.splits[split].branches=Array.from({length:6},(_,i)=>({...structuredClone(base),id:'bbudget'+i}));
 for(let i=0;i<64;i++)placeRackModule(s,{splitId:split,branchId:s.splits[split].branches[Math.floor(i/12)].id,index:i%12},'color',MASTER_MODULES);
 assert.equal(rackLeaves(masteringSettings(s)).length,64);const destination={splitId:split,branchId:s.splits[split].branches[5].id,index:4};assert.throws(()=>placeRackModule(s,destination,'glue',MASTER_MODULES),/64/);assert.equal(rackLeaves(s).length,64);
 const bad=structuredClone(s);moveRackItem(bad,{splitId:split,branchId:s.splits[split].branches[0].id,index:0},destination,{duplicate:true});assert.throws(()=>masteringSettings(bad),/64/);
});
test('macro ranges may run in reverse and reject overlapping assignments',()=>{
 const s=masteringSettings(),id=placeRackModule(s,{index:0},'glue',MASTER_MODULES);s.rackVersion=2;s.macros=[{name:'Compression',value:0,targets:[{moduleId:id,key:'threshold',min:0,max:-40}]}];setRackMacro(s,0,.75);assert.equal(masteringSettings(s)[id].threshold,-30);
 s.macros.push(structuredClone(s.macros[0]));assert.throws(()=>masteringSettings(s),/déjà utilisée/);
});
