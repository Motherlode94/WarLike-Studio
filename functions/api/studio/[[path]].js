import {getToken,forwardServer,guardOrigin,secureHeaders} from '../../_studio-session.js';
const uuid='[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}';
const routes=[
 {pattern:/^me$/,verbs:['GET']},
 {pattern:/^projects$/,verbs:['GET','POST']},
 {pattern:new RegExp('^projects/'+uuid+'$'),verbs:['GET','PUT','DELETE']},
 {pattern:new RegExp('^projects/'+uuid+'/assets$'),verbs:['POST']},
 {pattern:new RegExp('^projects/'+uuid+'/assets/'+uuid+'$'),verbs:['GET']}
];
export async function onRequest(context){
 const {request}=context;
 const path=Array.isArray(context.params.path)?context.params.path.join('/'):String(context.params.path||'');
 const route=routes.find(item=>item.pattern.test(path));
 if(!route)return Response.json({error:'Route inconnue'},{status:404});
 if(!route.verbs.includes(request.method))return Response.json({error:'Méthode interdite'},{status:405});
 const token=getToken(request);
 if(!token)return Response.json({error:'Connexion WarLike requise'},{status:401,headers:{'Cache-Control':'no-store'}});
 if(!['GET','HEAD'].includes(request.method)&&!guardOrigin(request))return Response.json({error:'Origine refusée'},{status:403});
 const header=new Headers({Authorization:'Bearer '+token,Accept:'application/json'});
 let body;
 if(!['GET','HEAD'].includes(request.method)){
  const type=request.headers.get('Content-Type')||'';
  const media=path.endsWith('/assets');
  if(!type.startsWith(media?'multipart/form-data;':'application/json'))return Response.json({error:'Format non autorisé'},{status:415});
  const max=media?13*1024*1024:900000;
  if(Number(request.headers.get('Content-Length')||0)>max)return Response.json({error:'Fichier trop volumineux'},{status:413});
  const input=await request.arrayBuffer();
  if(input.byteLength>max)return Response.json({error:'Requête trop volumineuse'},{status:413});
  header.set('Content-Type',type);
  body=input;
 }
 try{
  const response=await forwardServer(context,'/api/studio/'+path,{method:request.method,headers:header,body});
  return new Response(response.body,{status:response.status,headers:secureHeaders(response)});
 }catch{return Response.json({error:'Connexion WarLike Server indisponible'},{status:503,headers:{'Cache-Control':'no-store'}});}
}
