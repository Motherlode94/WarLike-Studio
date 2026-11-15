import test from 'node:test';
import assert from 'node:assert/strict';
import {StudioCloudClient,StudioCloudError} from '../dist/studio-cloud-client.js';

const id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const response=(data,status=200)=>({ok:status>=200&&status<300,status,json:async()=>data});
test('cloud client requires HTTPS',()=>{
 assert.throws(()=>new StudioCloudClient({baseUrl:'http://warlike.example'}),/HTTPS/);
});
test('uses credentials, does not send client-selected owner ID',async()=>{
 let seen;
 const client=new StudioCloudClient({baseUrl:'https://example.test',fetchImpl:async(url,opts)=>{seen={url,opts};return response({id,revision:1});}});
 await client.createProject({name:'A'});
 assert.equal(seen.opts.credentials,'include');
 assert.equal(seen.opts.cache,'no-store');
 assert.equal(seen.opts.method,'POST');
 assert.deepEqual(JSON.parse(seen.opts.body),{project:{name:'A'}});
 assert.equal(seen.url,'https://example.test/api/studio/projects');
});
test('rejects missing or invalid server identity',async()=>{
 const c=new StudioCloudClient({baseUrl:'https://example.test',fetchImpl:async()=>response({userId:'a',studioAccess:false})});
 await assert.rejects(c.identity(),StudioCloudError);
});
test('denied project access fails closed',async()=>{
 const c=new StudioCloudClient({baseUrl:'https://example.test',fetchImpl:async()=>response({code:'FORBIDDEN'},403)});
 await assert.rejects(c.getProject(id),e=>e.status===403);
});
test('refuses stale writes and requires expected revision',async()=>{
 let seen;
 const c=new StudioCloudClient({baseUrl:'https://example.test',fetchImpl:async(_url,opts)=>{seen=opts;return response({code:'CONFLICT'},409);}});
 await assert.rejects(c.saveProject(id,{name:'A'},0),/Révision/);
 await assert.rejects(c.saveProject(id,{name:'A'},2),e=>e.status===409);
 assert.equal(JSON.parse(seen.body).expectedRevision,2);
});
test('rejects unsafe identifiers before fetch',async()=>{
 const c=new StudioCloudClient({baseUrl:'https://example.test',fetchImpl:async()=>{throw Error('should not reach network')}});
 await assert.rejects(c.getProject('../private'),TypeError);
});
test('network outage remains an explicit error, not a fake success',async()=>{
 const c=new StudioCloudClient({baseUrl:'https://example.test',fetchImpl:async()=>{throw Error('offline')}});
 await assert.rejects(c.listProjects(),e=>e.code==='NETWORK');
});

test('private audio upload includes session credentials but no owner ID',async()=>{
 let seen;
 const c=new StudioCloudClient({baseUrl:'https://example.test',fetchImpl:async(url,options)=>{seen={url,options};return response({id});}});
 const file=new Blob(['RIFFfakeWAVE'],{type:'audio/wav'});
 const reply=await c.uploadAsset(id,file);
 assert.equal(reply.id,id);
 assert.equal(seen.options.credentials,'include');
 assert.equal(seen.options.method,'POST');
 assert.equal(seen.options.headers['Content-Type'],undefined);
 assert.equal(seen.url,'https://example.test/api/studio/projects/'+id+'/assets');
});
test('private audio download returns binary and rejects unauthorized access',async()=>{
 const c=new StudioCloudClient({baseUrl:'https://example.test',fetchImpl:async(_url,options)=>({ok:true,status:200,arrayBuffer:async()=>new Uint8Array([1,2,3]).buffer})});
 const bytes=await c.downloadAsset(id,id);
 assert.equal(new Uint8Array(bytes).length,3);
 const denied=new StudioCloudClient({baseUrl:'https://example.test',fetchImpl:async()=>response({code:'DENIED'},403)});
 await assert.rejects(denied.downloadAsset(id,id),e=>e.status===403);
});

test('rejects malformed UUIDs that previously matched length-only checks',async()=>{
 const client=new StudioCloudClient({baseUrl:'https://example.test',fetchImpl:async()=>{throw Error('must not fetch')}});
 for(const invalid of ['------------------------------------','aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa','aaaa-aaaa-aaaa-aaaa-aaaa-aaaa-aaaa','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaxxxx']){
  await assert.rejects(client.getProject(invalid),TypeError);
 }
});
test('rejects API URLs with credentials, port, paths, query and hash',()=>{
 for(const url of ['https://user:pass@example.test','https://example.test:8443','https://example.test/api','https://example.test/?key=x','https://example.test/#session']){
  assert.throws(()=>new StudioCloudClient({baseUrl:url}),TypeError,url);
 }
});
test('rejects array response bodies from cloud project API',async()=>{
 const client=new StudioCloudClient({baseUrl:'https://example.test',fetchImpl:async()=>response([])});
 await assert.rejects(client.listProjects(),e=>e.code==='INVALID_RESPONSE');
});
