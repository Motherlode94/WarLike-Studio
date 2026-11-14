export async function onRequestGet(context){
 if(!context.env.WARLIKE_APP)return Response.json({ready:false,reason:'WARLIKE_APP service binding manquant'},{status:503,headers:{'Cache-Control':'no-store'}});
 try{
  const response=await context.env.WARLIKE_APP.fetch('https://warlike-server.pages.dev/api/health');
  if(!response.ok)throw Error('backend unavailable');
  return Response.json({ready:true},{headers:{'Cache-Control':'no-store'}});
 }catch{return Response.json({ready:false,reason:'Serveur WarLike indisponible'},{status:503,headers:{'Cache-Control':'no-store'}});}
}
