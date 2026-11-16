import test from 'node:test';
import assert from 'node:assert/strict';
import {StudioCloudClient} from '../dist/studio-cloud-client.js';
import {createStudioSync} from '../dist/studio-cloud-workflow.js';
import {onRequest as proxy} from '../functions/api/studio/[[path]].js';
import {onRequestPost} from '../functions/api/studio/session.js';
import {getToken,readLimitedBody} from '../functions/_studio-session.js';
const origin='https://warlike-studio.pages.dev',id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const tokenA='a'.repeat(43),tokenB='b'.repeat(43),cookie=token=>'__Host-warlike-studio='+token;
function environment(){
 const writes=[];
 const env={WARLIKE_APP:{fetch:async request=>{
  const token=request.headers.get('Authorization')?.slice(7),userId=token===tokenA?'alice':token===tokenB?'bob':null;
  if(!userId)return Response.json({error:'Unauthorized'},{status:401});
  if(new URL(request.url).pathname==='/api/studio/me')return Response.json({userId,studioAccess:true});
  writes.push({userId,path:new URL(request.url).pathname,method:request.method,body:await request.text()});
  return Response.json({id,revision:1,projects:[]});
 }}};
 return {env,writes};
}
function transport(state,env){return async(url,options={})=>{
 const headers=new Headers(options.headers);headers.set('Cookie',cookie(state.token));if(options.method&&options.method!=='GET')headers.set('Origin',origin);
 const request=new Request(url,{...options,headers});return proxy({request,env,params:{path:new URL(url).pathname.slice('/api/studio/'.length).split('/')}});
}}
test('a cookie switched by another tab cannot send an unlinked Alice project as Bob',async()=>{
 const {env,writes}=environment(),state={token:tokenA};let invalidated=0;
 const api=new StudioCloudClient({baseUrl:origin,fetchImpl:transport(state,env)}),sync=createStudioSync({api,onIdentityLost:()=>invalidated++});
 await sync.connect();state.token=tokenB;
 await assert.rejects(sync.push({project:{name:'Alice private',tracks:[],secret:'never to Bob'},assets:[]}),error=>error.status===401&&error.code==='ACCOUNT_CHANGED');
 assert.equal(writes.length,0);assert.equal(sync.identity(),null);assert.equal(invalidated,1);
 await assert.rejects(sync.push({project:{name:'Retry',tracks:[]},assets:[]}),/Connecte|Compte/);assert.equal(writes.length,0);
 // Reconnection is deliberate; it cannot revive a project already linked to Alice.
 await sync.connect();assert.equal(sync.identity().userId,'bob');
 await assert.rejects(sync.push({project:{name:'Alice linked',tracks:[]},assets:[],cloudId:id,revision:1,ownerId:'alice'}),/autre compte/);assert.equal(writes.length,0);
});
test('account preconditions protect lists, project mutations and audio in both directions',async()=>{
 for(const token of [tokenA,tokenB])for(const [method,path] of [['GET','projects'],['POST','projects'],['GET','projects/'+id],['PUT','projects/'+id],['DELETE','projects/'+id],['POST','projects/'+id+'/assets'],['GET','projects/'+id+'/assets/'+id]]){
  const {env,writes}=environment();let reads=0;
  const body=new ReadableStream({pull(controller){reads++;controller.enqueue(new Uint8Array([123,125]));controller.close()}},{highWaterMark:0});
  const request=new Request(origin+'/api/studio/'+path,{method,headers:{Cookie:cookie(token),Origin:origin,'Content-Type':'application/json','X-Warlike-Studio-Account':token===tokenA?'bob':'alice'},...(['GET','HEAD'].includes(method)?{}:{body,duplex:'half'})});
  const response=await proxy({request,env,params:{path:path.split('/')}});
  assert.equal(response.status,401,method+' '+path);assert.equal((await response.json()).code,'ACCOUNT_CHANGED');assert.equal(writes.length,0);assert.equal(reads,0,'reject before consuming private bytes');assert.equal(response.headers.get('Cache-Control'),'private, no-store');
 }
});
test('the expected account is a precondition, never an identity claim',async()=>{
 const {env,writes}=environment();const base={Origin:origin,Cookie:cookie(tokenB),'Content-Type':'application/json','X-User-Id':'alice','X-Warlike-Identity':'alice'};
 for(const account of [undefined,'alice','bob']){
  const response=await proxy({request:new Request(origin+'/api/studio/projects',{method:'POST',headers:{...base,...(account?{'X-Warlike-Studio-Account':account}:{})},body:'{"project":{"ownerId":"alice"}}'}),env,params:{path:['projects']}});
  assert.equal(response.status,account==='bob'?200:account?401:428);
 }
 assert.equal(writes.length,1);assert.equal(writes[0].userId,'bob');
 assert.equal(getToken(new Request(origin,{headers:{Cookie:cookie(tokenA)+'; '+cookie(tokenB)}})),null);
 assert.equal(getToken(new Request(origin,{headers:{Cookie:cookie(tokenA)+'; __Host-warlike-studio=broken'}})),null);
});
test('body limits stop a chunked request while reading, and cancel the producer',async()=>{
 let cancelled=false,pulls=0;
 const body=new ReadableStream({pull(controller){pulls++;controller.enqueue(new Uint8Array(800))},cancel(){cancelled=true}},{highWaterMark:0});
 await assert.rejects(readLimitedBody(new Request(origin,{method:'POST',body,duplex:'half'}),1000),error=>error.status===413);
 assert.equal(cancelled,true);assert.equal(pulls,2);
 for(const headers of [{'Content-Length':'1001'},{'Content-Length':'invalid'},{'Content-Encoding':'gzip'}]){
  let read=false;const stream=new ReadableStream({pull(){read=true}},{highWaterMark:0});
  await assert.rejects(readLimitedBody(new Request(origin,{method:'POST',headers,body:stream,duplex:'half'}),1000),error=>[413,415].includes(error.status));assert.equal(read,false);
 }
});
test('session exchange rejects oversized streams, invalid UTF-8 and malformed server expiry',async()=>{
 let called=0;const env={WARLIKE_APP:{fetch:async()=>{called++;return Response.json({token:tokenA})}}};
 const request=body=>new Request(origin+'/api/studio/session',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body});
 assert.equal((await onRequestPost({request:request('x'.repeat(2049)),env})).status,413);
 assert.equal((await onRequestPost({request:request(new Uint8Array([255])),env})).status,400);
 assert.equal(called,0);
 assert.equal((await onRequestPost({request:request(JSON.stringify({code:'c'.repeat(43),verifier:'v'.repeat(43)})),env})).status,502);
});
test('losing authentication aborts an upload and cancels all queued publications',async()=>{
 let release,signal,creates=0,lost=0;
 const sync=createStudioSync({onIdentityLost:()=>lost++,api:{identity:async()=>({userId:'alice',studioAccess:true}),uploadAsset:async(_id,_file,options)=>{signal=options.signal;return new Promise((_resolve,reject)=>{release=()=>reject(Object.assign(Error('expired'),{status:401}))})},createProject:async()=>{creates++;return {id,revision:1}}}});
 await sync.connect();const first=sync.push({project:{name:'First',tracks:[]},assets:[{id:'audio',data:new ArrayBuffer(44)}],cloudId:id,revision:1,ownerId:'alice'});
 await new Promise(resolve=>setImmediate(resolve));const queued=sync.push({project:{name:'Queued Alice',tracks:[]},assets:[]});
 release();await assert.rejects(first,error=>error.status===401);await assert.rejects(queued,/Compte cloud modifié/);
 assert.equal(signal.aborted,true);assert.equal(lost,1);assert.equal(creates,0);assert.equal(sync.identity(),null);
});
test('returning to an old tab detects a cookie change without adopting the new account',async()=>{
 let userId='alice',lost=0;
 const sync=createStudioSync({onIdentityLost:()=>lost++,api:{identity:async()=>({userId,studioAccess:true})}});await sync.connect();userId='bob';
 await assert.rejects(sync.verifyIdentity(),error=>error.code==='ACCOUNT_CHANGED');assert.equal(sync.identity(),null);assert.equal(lost,1);
});
test('a failed first audio upload cannot be restored as a complete silent cloud project',async()=>{
 let remote=null,fail=true;
 const sync=createStudioSync({api:{identity:async()=>({userId:'alice',studioAccess:true}),createProject:async project=>{remote=project;return {id,revision:1}},uploadAsset:async()=>{if(fail)throw Error('offline');return {id}},saveProject:async(_id,project,revision)=>{remote=project;return {revision:revision+1}},getProject:async()=>({project:remote,revision:1}),downloadAsset:async()=>new ArrayBuffer(44)}});
 await sync.connect();const args={project:{name:'Partial',tracks:[],unknown:{preserved:true}},assets:[{id:'voice',data:new ArrayBuffer(44)}]};
 await assert.rejects(sync.push(args),/offline/);assert.equal(remote.__cloudUploadPending,true);await assert.rejects(sync.fetchProject(id),/Transfert audio incomplet/);
 fail=false;await sync.push({...args,cloudId:id,revision:1,ownerId:'alice'});assert.equal(remote.__cloudUploadPending,undefined);assert.deepEqual(remote.unknown,{preserved:true});assert.equal((await sync.fetchProject(id)).media.length,1);
});
test('an identity refresh cannot change the pinned owner of an older workflow operation',async()=>{
 const {env,writes}=environment(),state={token:tokenA};
 const api=new StudioCloudClient({baseUrl:origin,fetchImpl:transport(state,env)}),sync=createStudioSync({api});await sync.connect();
 // A refresh may update the transport before the workflow's continuation runs.
 state.token=tokenB;await api.identity();assert.equal(sync.identity().userId,'alice');
 await assert.rejects(sync.push({project:{name:'Still Alice private',tracks:[]},assets:[]}),error=>error.code==='ACCOUNT_CHANGED');assert.equal(writes.length,0);
});
