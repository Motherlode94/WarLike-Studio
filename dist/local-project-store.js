// Audio IDs are immutable: edits/recordings create new IDs. Store each source
// once, separately from the frequently updated arrangement and mix settings.
const key=id=>'project:'+id;
const mediaKey=(id,asset)=>key(id)+':media:'+asset;
export function writeLocalProject(db,id,{project,masterVolume=0,assets=[]},index){
 return new Promise((resolve,reject)=>{
  const tx=db.transaction('sessions','readwrite'),store=tx.objectStore('sessions');
  tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||Error('Sauvegarde annulée.'));
  for(const asset of assets){
   if(typeof asset.id!=='string'||!(asset.data instanceof ArrayBuffer)){tx.abort();return;}
   const request=store.getKey(mediaKey(id,asset.id));
   request.onsuccess=()=>{if(request.result===undefined)store.put({id:asset.id,name:asset.name,data:asset.data},mediaKey(id,asset.id));};
  }
  store.put({mediaVersion:2,project,masterVolume,assets:assets.map(a=>({id:a.id,name:a.name}))},key(id));
  store.put(index,'project-index');
 });
}
export function readLocalProject(db,id){
 return new Promise((resolve,reject)=>{
  const tx=db.transaction('sessions'),store=tx.objectStore('sessions');let state,error;
  tx.oncomplete=()=>error?reject(error):resolve(state);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||error||Error('Lecture annulée.'));
  const request=store.get(key(id));
  request.onsuccess=()=>{
   state=request.result;
   // Older projects still contain their audio inline. First successful save
   // migrates them in the same transaction as the new project record.
   if(!state||state.mediaVersion!==2)return;
   state.assets=state.assets.map(asset=>{
    const request=store.get(mediaKey(id,asset.id));
    request.onsuccess=()=>{if(!request.result?.data){error=Error('Audio local manquant : '+asset.name);return;}Object.assign(asset,request.result,{name:asset.name});};
    return asset;
   });
  };
 });
}
