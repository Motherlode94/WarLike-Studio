import {forwardServer,guardOrigin,sessionCookie,noSessionCookie,getToken,privateJson,readLimitedBody,StudioRequestError} from '../../_studio-session.js';
export async function onRequestPost(context){
 const {request}=context;
 if(!guardOrigin(request))return privateJson({error:'Origine refusée'},403);
 if(request.headers.get('content-type')?.split(';')[0].trim().toLowerCase()!=='application/json')return privateJson({error:'JSON requis'},415);
 try{
  const raw=await readLimitedBody(request,2048);let body;
  try{body=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(raw))}catch{return privateJson({error:'JSON invalide'},400)}
  if(!body||Array.isArray(body)||typeof body!=='object'||!/^[A-Za-z0-9_-]{43}$/.test(body.code||'')||!/^[A-Za-z0-9_-]{43,128}$/.test(body.verifier||''))return privateJson({error:'Code ou vérificateur invalide'},400);
  const response=await forwardServer(context,'/api/studio/exchange',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code:body.code,verifier:body.verifier})});
  if(!response.ok)return privateJson({error:'Association refusée'},response.status>=400?response.status:502);
  const output=await response.json(),maxAge=Math.min(28800,Math.floor((output?.expiresAt-Date.now())/1000));
  if(!/^[A-Za-z0-9_-]{43}$/.test(output?.token||'')||!Number.isSafeInteger(output?.expiresAt)||maxAge<1)return privateJson({error:'Réponse serveur invalide'},502);
  return privateJson({connected:true},200,{'Set-Cookie':sessionCookie(output.token,maxAge)});
 }catch(error){return privateJson({error:error instanceof StudioRequestError?error.message:'Association Studio indisponible'},error instanceof StudioRequestError?error.status:503)}
}
export async function onRequestDelete(context){
 const {request}=context;
 if(!guardOrigin(request))return privateJson({error:'Origine refusée'},403);
 const token=getToken(request);let revoked=!token;
 if(token){try{const response=await forwardServer(context,'/api/studio/revoke',{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:'{}'});revoked=response.ok;}catch{revoked=false;}}
 return privateJson({connected:false,revoked},revoked?200:202,{'Set-Cookie':noSessionCookie()});
}
