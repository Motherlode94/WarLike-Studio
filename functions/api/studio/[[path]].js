import {ACCOUNT_HEADER,validAccount,getToken,forwardServer,guardOrigin,secureHeaders,privateJson,readLimitedBody,StudioRequestError} from '../../_studio-session.js';
const uuid='[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}';
const routes=[
 {pattern:/^me$/,verbs:['GET']},
 {pattern:/^projects$/,verbs:['GET','POST']},
 {pattern:new RegExp('^projects/'+uuid+'$'),verbs:['GET','PUT','DELETE']},
 {pattern:new RegExp('^projects/'+uuid+'/assets$'),verbs:['POST']},
 {pattern:new RegExp('^projects/'+uuid+'/assets/'+uuid+'$'),verbs:['GET']}
];
export async function onRequest(context){
 const {request}=context,path=Array.isArray(context.params.path)?context.params.path.join('/'):String(context.params.path||'');
 const route=routes.find(item=>item.pattern.test(path));
 if(!route)return privateJson({error:'Route inconnue'},404);
 if(!route.verbs.includes(request.method))return privateJson({error:'Méthode interdite'},405);
 const token=getToken(request);
 if(!token)return privateJson({error:'Connexion WarLike requise'},401);
 if(!['GET','HEAD'].includes(request.method)&&!guardOrigin(request))return privateJson({error:'Origine refusée'},403);
 const headers=new Headers({Authorization:'Bearer '+token,Accept:'application/json'});
 try{
  if(path!=='me'){
   const expected=request.headers.get(ACCOUNT_HEADER);
   if(!validAccount(expected))return privateJson({error:'Vérifie le compte connecté avant cette opération.',code:'IDENTITY_REQUIRED'},428);
   // This is a precondition, never proof of identity. Resolve the actual principal
   // from the exact captured HttpOnly bearer that will also authorize the operation.
   // A different tab may have replaced the cookie since the browser last read /me.
   const proof=await forwardServer(context,'/api/studio/me',{headers});
   if(proof.status>=300&&proof.status<400)return privateJson({error:'Réponse WarLike Server invalide'},502);
   if(!proof.ok)return new Response(proof.body,{status:proof.status,headers:secureHeaders(proof)});
   const identity=await proof.json();
   if(!validAccount(identity?.userId)||identity.studioAccess!==true)return privateJson({error:'Identité WarLike non vérifiée.'},502);
   if(identity.userId!==expected)return privateJson({error:'Le compte WarLike a changé. Reconnecte Studio.',code:'ACCOUNT_CHANGED'},401);
  }
  let body;
  if(!['GET','HEAD'].includes(request.method)){
   const type=request.headers.get('Content-Type')||'',media=path.endsWith('/assets');
   if(media?!/^multipart\/form-data;\s*boundary=/i.test(type):type.split(';')[0].trim().toLowerCase()!=='application/json')return privateJson({error:'Format non autorisé'},415);
   body=await readLimitedBody(request,media?13*1024*1024:900000);headers.set('Content-Type',type);
  }
  const response=await forwardServer(context,'/api/studio/'+path,{method:request.method,headers,body});
  if(response.status>=300&&response.status<400)return privateJson({error:'Réponse WarLike Server invalide'},502);
  return new Response(response.body,{status:response.status,headers:secureHeaders(response)});
 }catch(error){return privateJson({error:error instanceof StudioRequestError?error.message:'Connexion WarLike Server indisponible'},error instanceof StudioRequestError?error.status:503)}
}
