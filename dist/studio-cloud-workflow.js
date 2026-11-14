import {StudioCloudClient} from './studio-cloud-client.js';

const base64url=bytes=>btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,'');
const digest=async data=>base64url(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(data))));
const PAIR_KEY='warlike-studio-pkce';

export async function beginStudioPairing({origin='https://warlike-server.pages.dev', navigate=url=>location.assign(url),storage=sessionStorage}={}){
 const available=await fetch('/api/studio/availability',{cache:'no-store'});
 if(!available.ok)throw Error('Le service WarLike Cloud n’est pas encore configuré.');
 const verifier=base64url(crypto.getRandomValues(new Uint8Array(32)));
 const state=base64url(crypto.getRandomValues(new Uint8Array(24)));
 storage.setItem(PAIR_KEY,JSON.stringify({verifier,state,createdAt:Date.now()}));
 const challenge=await digest(verifier);
 navigate(origin+'/connect/studio?challenge='+encodeURIComponent(challenge)+'&state='+encodeURIComponent(state));
}
export async function completeStudioPairing({hash=location.hash,storage=sessionStorage,send=fetch}={}){
 const params=new URLSearchParams(hash.replace(/^#/,''));
 const code=params.get('warlike_studio_pair'),state=params.get('state');
 if(!code)return false;
 const raw=storage.getItem(PAIR_KEY);
 storage.removeItem(PAIR_KEY);
 history.replaceState(null,'',location.pathname+location.search);
 if(!raw)throw Error('Association inattendue. Recommence depuis Studio.');
 const previous=JSON.parse(raw);
 if(previous.state!==state||Date.now()-previous.createdAt>5*60000)throw Error('Association expirée ou invalide.');
 const response=await send('/api/studio/session',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({code,verifier:previous.verifier})});
 if(!response.ok)throw Error('Association refusée. Réessaie.');
 return true;
}
export function createStudioSync({baseUrl=typeof location==='undefined'?'https://localhost':location.origin, api}={}){
 const client=api||new StudioCloudClient({baseUrl});
 let identity=null;
 let queue=Promise.resolve();
 const knownRevision=new Map(),knownAssets=new Map();
 const connect=async()=>{identity=await client.identity();return identity;};
 const enqueue=task=>{
  const pending=queue.catch(()=>{}).then(task);queue=pending.catch(()=>{});return pending;
 };
 async function push({project,assets,cloudId,revision,ownerId}){
  if(!identity)throw Error('Connecte ton compte WarLike avant la synchronisation.');
  if(ownerId&&ownerId!==identity.userId)throw Error('Ce projet local appartient à un autre compte cloud.');
  // Local file IDs remain stable. Cloud audio objects are stored privately in R2.
  let id=cloudId,rev=revision||0;
  if(!id){const created=await client.createProject(project);id=created.id;rev=created.revision;}
  const mapping={...(project.__cloudAssets||{}),...(knownAssets.get(id)||{})};
  for(const asset of assets){
   if(mapping[asset.id])continue;
   const extension=asset.name?.match(/\.(wav|mp3|ogg)$/i)?.[1]?.toLowerCase()||'wav';
   const mime=extension==='mp3'?'audio/mpeg':extension==='ogg'?'audio/ogg':'audio/wav';
   const file=new File([asset.data],asset.name||('audio-'+asset.id+'.'+extension),{type:mime});
   if(file.size>12*1024*1024)throw Error('Enregistrement trop volumineux pour le cloud (12 Mo par fichier). Copie locale conservée.');
   const uploaded=await client.uploadAsset(id,file);
   mapping[asset.id]=uploaded.id;
  }
  const updated={...project,__cloudAssets:mapping};
  const saved=await client.saveProject(id,updated,knownRevision.get(id)||rev);
  knownRevision.set(id,saved.revision);knownAssets.set(id,mapping);
  return {cloudId:id,cloudRevision:saved.revision,cloudOwner:identity.userId,cloudAssets:mapping};
 }
 async function fetchProject(id){
  if(!identity)throw Error('Connexion requise.');
  const result=await client.getProject(id),project=result.project;
  const media=[];
  for(const [assetId,remoteId] of Object.entries(project.__cloudAssets||{})){
   const data=await client.downloadAsset(id,remoteId);
   media.push({id:assetId,name:'Enregistrement '+assetId+'.wav',data});
  }
  return {project,media,cloudId:id,cloudRevision:result.revision,cloudOwner:identity.userId};
 }
 return {connect,identity:()=>identity,list:()=>client.listProjects(),push:args=>enqueue(()=>push(args)),fetchProject,logout:async()=>{
  await fetch('/api/studio/session',{method:'DELETE',credentials:'same-origin',headers:{Origin:location.origin}});identity=null;
 }};
}
