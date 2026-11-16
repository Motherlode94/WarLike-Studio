import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createStudioSync} from '../dist/studio-cloud-workflow.js';
const id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
test('cloud autosave serializes revisions and never invents an owner',async()=>{
 const calls=[];
 const api={
  identity:async()=>({userId:'alice',studioAccess:true}),
  createProject:async()=>({id,revision:1}),
  saveProject:async(_id,project,revision)=>{calls.push({revision,name:project.name});return {revision:revision+1}},
  uploadAsset:async()=>{throw Error('unexpected media')},
  listProjects:async()=>[],
  getProject:async()=>({project:{name:'Test',tracks:[]},revision:4})
 };
 const sync=createStudioSync({api});await sync.connect();
 const initial=await sync.push({project:{name:'First',tracks:[]},assets:[]});
 assert.equal(initial.cloudId,id);assert.equal(initial.cloudOwner,'alice');assert.equal(initial.cloudRevision,2);
 const second=await sync.push({project:{name:'Updated',tracks:[]},assets:[],cloudId:id,revision:1,ownerId:'alice'});
 assert.equal(second.cloudRevision,3);
 assert.deepEqual(calls,[{revision:1,name:'First'},{revision:2,name:'Updated'}]);
});
test('cross-account reuse is rejected before any remote operation',async()=>{
 let writes=0;
 const sync=createStudioSync({api:{
  identity:async()=>({userId:'bob',studioAccess:true}),
  saveProject:async()=>{writes++;return {revision:2}}
 }});
 await sync.connect();
 await assert.rejects(sync.push({project:{name:'Other',tracks:[]},assets:[],cloudId:id,revision:1,ownerId:'alice'}),/autre compte/);
 assert.equal(writes,0);
});
test('remote 409 preserves conflict for user decision instead of overwriting',async()=>{
 const sync=createStudioSync({api:{
  identity:async()=>({userId:'alice',studioAccess:true}),
  saveProject:async()=>{const error=new Error('Conflit 409');error.status=409;throw error;}
 }});
 await sync.connect();
 await assert.rejects(sync.push({project:{name:'A',tracks:[]},assets:[],cloudId:id,revision:2,ownerId:'alice'}),error=>error.status===409);
});
test('cloud restore obtains all referenced private audio assets',async()=>{
 const data=new Uint8Array([82,73,70,70]).buffer;
 const sync=createStudioSync({api:{
  identity:async()=>({userId:'alice',studioAccess:true}),
  getProject:async()=>({project:{name:'Mix',tracks:[],__cloudAssets:{voice:id}},revision:6}),
  downloadAsset:async()=>data
 }});
 await sync.connect();
 const restore=await sync.fetchProject(id);
 assert.equal(restore.media.length,1);
 assert.equal(restore.media[0].id,'voice');
 assert.deepEqual(restore.cloudAssets,{voice:id});
 assert.equal(restore.cloudOwner,'alice');
 assert.equal(restore.cloudRevision,6);
});
test('a restored project retains its media association across a local metadata save',async()=>{
 let uploads=0,saved;
 const sync=createStudioSync({api:{identity:async()=>({userId:'alice',studioAccess:true}),getProject:async()=>({project:{name:'Restored',tracks:[],__cloudAssets:{voice:id}},revision:2}),downloadAsset:async()=>new ArrayBuffer(44),uploadAsset:async()=>{uploads++;return {id}},saveProject:async(_id,project,revision)=>{saved=project;return {revision:revision+1}}}});await sync.connect();
 const restored=await sync.fetchProject(id);
 // Same metadata assignment as rememberCloudState when opening a cloud project locally.
 const local={...restored.project,__cloudAssets:restored.cloudAssets};
 await sync.push({project:local,assets:restored.media,cloudId:restored.cloudId,revision:restored.cloudRevision,ownerId:restored.cloudOwner});
 assert.equal(uploads,0);assert.deepEqual(saved.__cloudAssets,{voice:id});
});
