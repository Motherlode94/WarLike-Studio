// Crash-recovery journal for unfinished microphone captures.
// Audio never leaves this browser; recordings are stored separately from projects.
const DB_NAME='warlike-studio-recording-recovery';
const DB_VERSION=1;
const GROUP_SECONDS=2;
export const MAX_JOURNAL_BACKLOG_SECONDS=12;
export function journalBacklogExceeded(backlogFrames,incomingFrames,sampleRate,limitSeconds=MAX_JOURNAL_BACKLOG_SECONDS){
  return backlogFrames+incomingFrames>Math.max(4096,Math.round(sampleRate*limitSeconds));
}
function requestDone(request){
  return new Promise((resolve,reject)=>{request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error||Error('Stockage local indisponible.'));});
}
function transactionDone(transaction){
  return new Promise((resolve,reject)=>{
    transaction.oncomplete=()=>resolve();
    transaction.onerror=()=>reject(transaction.error||Error('Écriture interrompue.'));
    transaction.onabort=()=>reject(transaction.error||Error('Écriture annulée.'));
  });
}
export async function openRecordingRecoveryDB(){
  if(typeof indexedDB==='undefined')throw Error('IndexedDB indisponible : récupération des prises impossible.');
  const request=indexedDB.open(DB_NAME,DB_VERSION);
  request.onupgradeneeded=()=>{
    const db=request.result;
    if(!db.objectStoreNames.contains('recordings'))db.createObjectStore('recordings',{keyPath:'id'});
    if(!db.objectStoreNames.contains('blocks'))db.createObjectStore('blocks',{keyPath:['id','index']});
  };
  return requestDone(request);
}
export function groupRecordingChunks(groups,expectedChannels){
  if(!groups.length)throw Error('Aucune donnée audio à restaurer.');
  const total=groups.reduce((sum,group)=>sum+group.length,0);
  const output=Array.from({length:expectedChannels},()=>new Float32Array(total));
  let offset=0;
  for(const group of groups){
    if(group.channels.length!==expectedChannels)throw Error('Nombre de canaux incompatible dans la récupération.');
    for(let i=0;i<expectedChannels;i++){
      if(group.channels[i].length!==group.length)throw Error('Bloc audio incomplet.');
      output[i].set(group.channels[i],offset);
    }
    offset+=group.length;
  }
  return {length:total,numberOfChannels:expectedChannels,getChannelData:i=>output[i]};
}
export async function beginRecordingJournal({sampleRate,channels,projectName='Session',onError}={}){
  const db=await openRecordingRecoveryDB();
  const id=typeof crypto!=='undefined'&&crypto.randomUUID?crypto.randomUUID():String(Date.now())+'-'+Math.random().toString(36).slice(2);
  const meta={id,sampleRate,channels,projectName:String(projectName).slice(0,90),createdAt:Date.now()};
  try{
    const tx=db.transaction('recordings','readwrite');
    tx.objectStore('recordings').put(meta);
    await transactionDone(tx);
  }catch(error){db.close();throw error;}
  let pending=[],pendingFrames=0,queuedFrames=0,totalFrames=0,index=0,writeQueue=Promise.resolve(),failure=null,closed=false,saturated=false;
  const limit=Math.max(4096,Math.round(sampleRate*GROUP_SECONDS));
  function queueWrite(){
    if(!pendingFrames)return;
    const blocks=pending;pending=[];const length=pendingFrames;pendingFrames=0;
    queuedFrames+=length;
    writeQueue=writeQueue.then(async()=>{
      const merged=Array.from({length:channels},()=>new Float32Array(length));
      let offset=0;
      for(const block of blocks){
        if(block.length!==channels)throw Error('Canaux PCM incorrects.');
        const size=block[0].length;
        for(let c=0;c<channels;c++)merged[c].set(block[c],offset);
        offset+=size;
      }
      const tx=db.transaction('blocks','readwrite');
      tx.objectStore('blocks').put({id,index:index++,length,channels:merged});
      await transactionDone(tx);
    }).catch(error=>{if(!failure){failure=error;try{onError?.(error);}catch{}}throw error;})
      .finally(()=>{queuedFrames-=length;});
    // Avoid unhandled rejections while the caller awaits flush() later.
    writeQueue.catch(()=>{});
  }
  return {
    id,
    get frames(){return totalFrames;},
    get backlogSeconds(){return (queuedFrames+pendingFrames)/sampleRate;},
    get saturated(){return saturated;},
    append(chunk){
      if(closed||failure||saturated)return false;
      if(!Array.isArray(chunk)||chunk.length!==channels||!chunk[0]?.length)return false;
      if(journalBacklogExceeded(queuedFrames+pendingFrames,chunk[0].length,sampleRate)){
        saturated=true;
        try{onError?.(Error('Stockage trop lent : le journal atteint 12 secondes de retard. Arrêt de sécurité ; les blocs déjà reçus sont conservés.'));}catch{}
        return false;
      }
      pending.push(chunk);
      pendingFrames+=chunk[0].length;
      totalFrames+=chunk[0].length;
      if(pendingFrames>=limit)queueWrite();
      return true;
    },
    async flush(){
      if(closed)throw Error('Journal déjà terminé.');
      queueWrite();
      await writeQueue;
      if(failure)throw failure;
    },
    async toAudioBuffer(ctx){
      await this.flush();
      if(!totalFrames)throw Error('Aucune donnée audio enregistrée.');
      const buffer=ctx.createBuffer(channels,totalFrames,sampleRate);
      const destinations=Array.from({length:channels},(_,c)=>buffer.getChannelData(c));
      let offset=0;
      const tx=db.transaction('blocks','readonly');
      await new Promise((resolve,reject)=>{
        const request=tx.objectStore('blocks').openCursor(IDBKeyRange.bound([id,0],[id,Number.MAX_SAFE_INTEGER]));
        let bad=null;
        request.onsuccess=()=>{
          const cursor=request.result;
          if(!cursor)return;
          try{
            const group=cursor.value;
            if(group.channels.length!==channels||group.channels.some(values=>values.length!==group.length)||offset+group.length>totalFrames)
              throw Error('Bloc du journal audio incomplet ou invalide.');
            for(let c=0;c<channels;c++)destinations[c].set(group.channels[c],offset);
            offset+=group.length;
            cursor.continue();
          }catch(error){bad=error;tx.abort();}
        };
        request.onerror=()=>{bad=request.error||Error('Lecture du journal impossible.');};
        tx.oncomplete=()=>offset===totalFrames?resolve():reject(Error('Journal PCM incomplet : échantillons manquants.'));
        tx.onerror=()=>reject(bad||tx.error||Error('Lecture du journal impossible.'));
        tx.onabort=()=>reject(bad||tx.error||Error('Lecture du journal interrompue.'));
      });
      return buffer;
    },
    async clear(){
      if(closed)return;
      await this.flush();
      const tx=db.transaction(['recordings','blocks'],'readwrite');
      tx.objectStore('recordings').delete(id);
      const range=IDBKeyRange.bound([id,0],[id,Number.MAX_SAFE_INTEGER]);
      tx.objectStore('blocks').delete(range);
      await transactionDone(tx);
      closed=true;db.close();
    },
    close(){closed=true;db.close();}
  };
}
export async function listRecoverableRecordings(){
  const db=await openRecordingRecoveryDB();
  try{
    const tx=db.transaction('recordings','readonly');
    const completed=transactionDone(tx);
    const result=await requestDone(tx.objectStore('recordings').getAll());
    await completed;
    return result.sort((a,b)=>b.createdAt-a.createdAt);
  }finally{db.close();}
}
export async function readRecoverableRecording(id){
  const db=await openRecordingRecoveryDB();
  try{
    const tx=db.transaction(['recordings','blocks'],'readonly');
    const completed=transactionDone(tx);
    const metadata=await requestDone(tx.objectStore('recordings').get(id));
    if(!metadata)throw Error('Prise introuvable.');
    const range=IDBKeyRange.bound([id,0],[id,Number.MAX_SAFE_INTEGER]);
    const blocks=await requestDone(tx.objectStore('blocks').getAll(range));
    await completed;
    return {...metadata,buffer:groupRecordingChunks(blocks,metadata.channels),blockCount:blocks.length};
  }finally{db.close();}
}
export async function discardRecoverableRecording(id){
  const db=await openRecordingRecoveryDB();
  try{
    const tx=db.transaction(['recordings','blocks'],'readwrite');
    tx.objectStore('recordings').delete(id);
    tx.objectStore('blocks').delete(IDBKeyRange.bound([id,0],[id,Number.MAX_SAFE_INTEGER]));
    await transactionDone(tx);
  }finally{db.close();}
}
