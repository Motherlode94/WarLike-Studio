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
 assert.throws(()=>c.saveProject(id,{name:'A'},0),/Révision/);
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
