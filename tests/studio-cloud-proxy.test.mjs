import {test} from 'node:test';
import assert from 'node:assert/strict';
import {onRequest as proxy} from '../functions/api/studio/[[path]].js';
import {onRequestPost,onRequestDelete} from '../functions/api/studio/session.js';
const token='t'.repeat(43),origin='https://warlike-studio.pages.dev',cookie='__Host-warlike-studio='+token;
test('Studio Pages proxy refuses missing credentials and unsafe routes',async()=>{
 const env={WARLIKE_APP:{fetch:async()=>{throw Error('should not reach')}}};
 assert.equal((await proxy({request:new Request(origin+'/api/studio/projects'),params:{path:['projects']},env})).status,401);
 assert.equal((await proxy({request:new Request(origin+'/api/studio/private'),params:{path:['private']},env})).status,404);
});
test('Pages proxy forwards bearer only to internal Worker and strips cookies',async()=>{
 let captured;
 const env={WARLIKE_APP:{fetch:async req=>{captured=req;return Response.json({projects:[]})}}};
 const request=new Request(origin+'/api/studio/projects',{headers:{Cookie:cookie}});
 const result=await proxy({request,params:{path:['projects']},env});
 assert.equal(result.status,200);
 assert.equal(captured.headers.get('Authorization'),'Bearer '+token);
 assert.equal(captured.headers.has('Cookie'),false);
 assert.equal(result.headers.get('Cache-Control'),'private, no-store');
});
test('cross-origin updates are blocked before contacting service binding',async()=>{
 const env={WARLIKE_APP:{fetch:async()=>{throw Error('should not reach')}}};
 const request=new Request(origin+'/api/studio/projects',{method:'POST',headers:{Cookie:cookie,Origin:'https://attacker.test','Content-Type':'application/json'},body:'{}'});
 assert.equal((await proxy({request,params:{path:['projects']},env})).status,403);
});
test('PKCE exchange sets only an HttpOnly cookie on same origin',async()=>{
 const env={WARLIKE_APP:{fetch:async()=>Response.json({token,expiresAt:Date.now()+10000})}};
 const request=new Request(origin+'/api/studio/session',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({code:'c'.repeat(43),verifier:'v'.repeat(43)})});
 const result=await onRequestPost({request,env});
 assert.equal(result.status,200);
 assert.match(result.headers.get('Set-Cookie'),/HttpOnly; SameSite=Strict/);
 assert.doesNotMatch(await result.text(),new RegExp(token));
});
test('logout clears the local HttpOnly cookie and attempts backend revocation',async()=>{
 let called=false;
 const env={WARLIKE_APP:{fetch:async req=>{called=true;assert.equal(req.headers.get('Authorization'),'Bearer '+token);return Response.json({revoked:true})}}};
 const request=new Request(origin+'/api/studio/session',{method:'DELETE',headers:{Origin:origin,Cookie:cookie}});
 const result=await onRequestDelete({request,env});
 assert.equal(result.status,200);assert.equal(called,true);
 assert.match(result.headers.get('Set-Cookie'),/Max-Age=0/);
});
