import test from 'node:test';
import assert from 'node:assert/strict';
import {onRequest} from '../functions/api/studio/[[path]].js';
const origin='https://warlike-studio.pages.dev',token='a'.repeat(43),cookie='__Host-warlike-studio='+token;
const sourceId='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
function context(account,real='WL-ALICE'){
 const calls=[];
 const env={WARLIKE_APP:{fetch:async request=>{
  const path=new URL(request.url).pathname;calls.push(path);
  return Response.json(path==='/api/studio/me'?{userId:real,studioAccess:true}:{id:sourceId,status:'published',mediaReady:false});
 }}};
 const request=new Request(origin+'/api/studio/publish',{method:'POST',headers:{Origin:origin,Cookie:cookie,'Content-Type':'application/json','X-Warlike-Studio-Account':account},body:JSON.stringify({sourceId,title:'Mon morceau'})});
 return {params:{path:['publish']},env,request,calls};
}
test('publish requires verified Studio identity and does not trust selected owner',async()=>{
 const wrong=context('WL-BOB','WL-ALICE');
 const rejected=await onRequest(wrong);assert.equal(rejected.status,401);
 assert.deepEqual(wrong.calls,['/api/studio/me']);
 const right=context('WL-ALICE');
 const accepted=await onRequest(right);assert.equal(accepted.status,200);
 assert.deepEqual(right.calls,['/api/studio/me','/api/studio/publish']);
});
test('publish refuses cross-site origin and missing session',async()=>{
 const absent=context('WL-ALICE');absent.request.headers.delete('Cookie');
 assert.equal((await onRequest(absent)).status,401);
 const foreign=context('WL-ALICE');foreign.request.headers.set('Origin','https://attacker.test');
 assert.equal((await onRequest(foreign)).status,403);
});
