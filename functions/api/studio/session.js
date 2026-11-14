import {forwardServer,guardOrigin,sessionCookie,noSessionCookie,getToken} from '../../_studio-session.js';
const json=(data,status=200,headers={})=>Response.json(data,{status,headers:{'Cache-Control':'no-store',...headers}});
export async function onRequestPost(context){
 const {request}=context;
 if(!guardOrigin(request))return json({error:'Origine refusée'},403);
 if(request.headers.get('content-type')?.split(';')[0].trim()!=='application/json')return json({error:'JSON requis'},415);
 try{
  const raw=await request.text();if(raw.length>2048)return json({error:'Requête invalide'},413);
  const body=JSON.parse(raw);
  if(!/^[A-Za-z0-9_-]{43}$/.test(body.code||'')||!/^[A-Za-z0-9_-]{43,128}$/.test(body.verifier||''))return json({error:'Code ou vérificateur invalide'},400);
  const response=await forwardServer(context,'/api/studio/exchange',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code:body.code,verifier:body.verifier})});
  if(!response.ok)return json({error:'Association refusée'},response.status);
  const output=await response.json();
  if(typeof output.token!=='string'||!/^[A-Za-z0-9_-]{43}$/.test(output.token))return json({error:'Réponse serveur invalide'},502);
  return json({connected:true},200,{'Set-Cookie':sessionCookie(output.token)});
 }catch{return json({error:'Association Studio indisponible'},503);}
}
export async function onRequestDelete(context){
 const {request}=context;
 if(!guardOrigin(request))return json({error:'Origine refusée'},403);
 const token=getToken(request);
 let revoked=!token;
 if(token){try{const response=await forwardServer(context,'/api/studio/revoke',{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:'{}'});revoked=response.ok;}catch{revoked=false;}}
 // Always drop the local credential, but report when remote revocation could not be confirmed.
 return json({connected:false,revoked},revoked?200:202,{'Set-Cookie':noSessionCookie()});
}
