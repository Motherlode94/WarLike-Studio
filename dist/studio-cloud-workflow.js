import {StudioCloudClient,StudioCloudError} from './studio-cloud-client.js';
import {CLOUD_AUDIO_LIMIT,planWavParts,restoreWavParts,WAV_PARTS_KIND} from './cloud-wav-parts.js';

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
export function createStudioSync({baseUrl=typeof location==='undefined'?'https://localhost':location.origin, api,onIdentityLost=()=>{}}={}){
 const client=api||new StudioCloudClient({baseUrl});
 let identity=null;
 let queue=Promise.resolve();
 const knownRevision=new Map(),knownAssets=new Map(),pendingParts=new Map();
 let generation=0,connectTicket=0,controller=new AbortController(),verification=null;
 const changed=()=>new StudioCloudError('Compte cloud modifié. Copie locale conservée.',401,'ACCOUNT_CHANGED');
 const clear=()=>{generation++;verification=null;controller.abort();controller=new AbortController();knownRevision.clear();knownAssets.clear();pendingParts.clear();};
 const invalidate=()=>{const hadIdentity=!!identity;identity=null;connectTicket++;clear();client.clearIdentity?.();if(hadIdentity)onIdentityLost();};
 async function checked(task,session=generation){try{return await task()}catch(error){if(session===generation&&[401,403,428].includes(error.status))invalidate();throw error}}
 const connect=async()=>{const ticket=++connectTicket,session=generation;const next=await checked(()=>client.identity({signal:controller.signal}),session);if(ticket!==connectTicket)throw changed();if(identity?.userId!==next.userId)clear();identity=next;return identity;};
 const enqueue=task=>{
  const pending=queue.catch(()=>{}).then(task);queue=pending.catch(()=>{});return pending;
 };
 async function push({project,assets,cloudId,revision,ownerId,onCreated,onProgress=()=>{}}){
  if(!identity)throw Error('Connecte ton compte WarLike avant la synchronisation.');
  if(ownerId&&ownerId!==identity.userId)throw Error('Ce projet local appartient à un autre compte cloud.');
  const session=generation,userId=identity.userId;
  const check=()=>{if(session!==generation||identity?.userId!==userId)throw Error('Compte cloud modifié. Copie locale conservée.');};
  // Parts remain real WAV audio under the existing private upload limit.
  const plans=new Map();
  for(const asset of assets)if(asset.data.byteLength>CLOUD_AUDIO_LIMIT)plans.set(asset.id,planWavParts(asset.data));
  let id=cloudId,rev=revision||0;
  if(!id){const {__cloudAssets,...initial}=project;const created=await checked(()=>client.createProject({...initial,__cloudUploadPending:true},{signal:controller.signal,expectedAccount:userId}),session);check();id=created.id;rev=created.revision;if(onCreated)await onCreated({cloudId:id,cloudRevision:rev,cloudOwner:userId,cloudAssets:{}});check();}
  const mapping={...(cloudId?project.__cloudAssets:{}),...(knownAssets.get(id)||{})};
  for(const asset of assets){
   check();
   if(mapping[asset.id])continue;
   const plan=plans.get(asset.id);
   if(plan){
    const key=id+':'+asset.id;
    let pending=pendingParts.get(key);
    if(!pending||pending.size!==plan.size){pending={size:plan.size,parts:[]};pendingParts.set(key,pending);}
    let index=0;
    for(const data of plan.parts()){
     check();
     if(!pending.parts[index]){
      onProgress({name:asset.name||'Prise audio',part:index+1,total:plan.count});
      const file=new File([data],(asset.name||'Prise')+'.part-'+(index+1)+'.wav',{type:'audio/wav'});
      const uploaded=await checked(()=>client.uploadAsset(id,file,{signal:controller.signal,expectedAccount:userId}),session);check();pending.parts[index]=uploaded.id;
     }
     index++;
    }
    mapping[asset.id]={kind:WAV_PARTS_KIND,size:plan.size,dataSize:plan.dataSize,parts:[...pending.parts],name:asset.name||'Prise.wav'};
    knownAssets.set(id,{...mapping});pendingParts.delete(key);
    continue;
   }
   const extension=asset.name?.match(/\.(wav|mp3|ogg)$/i)?.[1]?.toLowerCase()||'wav';
   const mime=extension==='mp3'?'audio/mpeg':extension==='ogg'?'audio/ogg':'audio/wav';
   const file=new File([asset.data],asset.name||('audio-'+asset.id+'.'+extension),{type:mime});
   onProgress({name:asset.name||'Audio',part:1,total:1});
   const uploaded=await checked(()=>client.uploadAsset(id,file,{signal:controller.signal,expectedAccount:userId}),session);check();
   mapping[asset.id]=uploaded.id;
   knownAssets.set(id,{...mapping});
  }
  check();
  const {__cloudUploadPending,...complete}=project;
  const updated={...complete,__cloudAssets:mapping};
  const saved=await checked(()=>client.saveProject(id,updated,knownRevision.get(id)||rev,{signal:controller.signal,expectedAccount:userId}),session);
  check();
  knownRevision.set(id,saved.revision);knownAssets.set(id,mapping);
  return {cloudId:id,cloudRevision:saved.revision,cloudOwner:userId,cloudAssets:mapping};
 }
 async function fetchProject(id){
  if(!identity)throw Error('Connexion requise.');
  const session=generation,userId=identity.userId;
  const check=()=>{if(session!==generation||identity?.userId!==userId)throw Error('Compte cloud modifié. Téléchargement interrompu.');};
  const result=await checked(()=>client.getProject(id,{signal:controller.signal,expectedAccount:userId}),session),project=result.project;check();
  if(project?.__cloudUploadPending)throw Error('Transfert audio incomplet. Termine la synchronisation depuis la copie locale avant de télécharger ce projet.');
  const media=[];
  for(const [assetId,remoteId] of Object.entries(project.__cloudAssets||{})){
   const download=async remote=>{check();const data=await checked(()=>client.downloadAsset(id,remote,{signal:controller.signal,expectedAccount:userId}),session);check();return data;};
   const data=typeof remoteId==='string'?await download(remoteId):await restoreWavParts(remoteId,download);
   media.push({id:assetId,name:typeof remoteId==='object'?remoteId.name||'Prise.wav':'Enregistrement '+assetId+'.wav',data});
  }
  return {project,media,cloudId:id,cloudRevision:result.revision,cloudOwner:userId,cloudAssets:structuredClone(project.__cloudAssets||{})};
 }
 const verifyIdentity=()=>{
  if(!identity)return Promise.resolve(null);
  if(verification)return verification;
  const session=generation,userId=identity.userId;
  const task=checked(()=>client.identity({signal:controller.signal}),session).then(next=>{if(session!==generation)throw changed();if(next.userId!==userId){invalidate();throw changed()}identity=next;return identity});
  verification=task;task.finally(()=>{if(verification===task)verification=null}).catch(()=>{});return task;
 };
 return {connect,verifyIdentity,invalidate,identity:()=>identity,list:async()=>{if(!identity)throw changed();const session=generation,userId=identity.userId;const rows=await checked(()=>client.listProjects({signal:controller.signal,expectedAccount:userId}),session);if(session!==generation)throw changed();return rows},push:args=>{
  const session=generation;
  return enqueue(()=>{if(session!==generation)throw Error('Compte cloud modifié. Copie locale conservée.');return push(args);});
 },fetchProject,logout:async()=>{
  invalidate();const response=await fetch('/api/studio/session',{method:'DELETE',credentials:'same-origin'});if(!response.ok)throw Error('Déconnexion locale effectuée ; révocation serveur non confirmée.');const result=await response.json();if(result.revoked!==true)throw Error('Déconnexion locale effectuée ; révocation serveur non confirmée.');
 }};
}
