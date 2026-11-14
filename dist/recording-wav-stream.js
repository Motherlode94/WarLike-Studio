// WAV recovery export without allocating a full AudioBuffer or full WAV ArrayBuffer.
// File System Access API streams to a user-selected local file when available;
// ordinary browser downloads use bounded PCM chunks assembled into a Blob.
import {openRecordingRecoveryDB} from './recording-recovery.js';
const MAX_WAV_DATA=0xffffffff-36;
function req(request){return new Promise((resolve,reject)=>{request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error||Error('Lecture IndexedDB échouée.'));});}
export function wavFloatHeader({sampleRate,channels,frames}){
  if(!Number.isSafeInteger(sampleRate)||sampleRate<8000||sampleRate>384000)throw Error('Fréquence invalide.');
  if(!Number.isInteger(channels)||channels<1||channels>2)throw Error('Nombre de canaux invalide.');
  if(!Number.isSafeInteger(frames)||frames<=0)throw Error('La prise ne contient aucun échantillon.');
  const bytes=frames*channels*4;
  if(!Number.isSafeInteger(bytes)||bytes>MAX_WAV_DATA)throw Error('La prise dépasse la limite du WAV standard (4 Go).');
  const array=new ArrayBuffer(44),v=new DataView(array);
  const str=(offset,s)=>[...s].forEach((ch,i)=>v.setUint8(offset+i,ch.charCodeAt(0)));
  str(0,'RIFF');v.setUint32(4,36+bytes,true);str(8,'WAVE');str(12,'fmt ');
  v.setUint32(16,16,true);v.setUint16(20,3,true);v.setUint16(22,channels,true);
  v.setUint32(24,sampleRate,true);v.setUint32(28,sampleRate*channels*4,true);
  v.setUint16(32,channels*4,true);v.setUint16(34,32,true);
  str(36,'data');v.setUint32(40,bytes,true);
  return array;
}
export function encodeFloatGroup(block,channels){
  if(!block||block.channels?.length!==channels||!Number.isSafeInteger(block.length)||block.length<=0||
      block.channels.some(c=>c.length!==block.length))throw Error('Bloc PCM incomplet.');
  const output=new ArrayBuffer(block.length*channels*4),view=new DataView(output);
  let offset=0;
  for(let i=0;i<block.length;i++)for(let c=0;c<channels;c++){
    const value=block.channels[c][i];
    view.setFloat32(offset,Number.isFinite(value)?value:0,true);
    offset+=4;
  }
  return output;
}
export async function exportRecoveryWav(id,{writer,onProgress}={}){
  const db=await openRecordingRecoveryDB();
  try{
    const meta=await req(db.transaction('recordings','readonly').objectStore('recordings').get(id));
    if(!meta)throw Error('Prise de secours introuvable.');
    // First pass: validate contiguous block indices and calculate header length.
    // This requires only bounded batches from IndexedDB, never the full recording.
    const inspect=await walkSegments(db,meta,async()=>{},false);
    const header=wavFloatHeader({...meta,frames:inspect.frames});
    const parts=writer?null:[header];
    if(writer)await writer.write(header);
    let writtenFrames=0;
    const result=await walkSegments(db,meta,async(block)=>{
      const chunk=encodeFloatGroup(block,meta.channels);
      if(writer)await writer.write(chunk);
      else parts.push(chunk);
      writtenFrames+=block.length;
      onProgress?.({frames:writtenFrames,totalFrames:inspect.frames});
    },true);
    if(result.frames!==inspect.frames||result.count!==inspect.count)throw Error('La prise a changé pendant l’export.');
    if(writer) return {frames:result.frames,channels:meta.channels,bytes:44+result.frames*meta.channels*4};
    return {blob:new Blob(parts,{type:'audio/wav'}),frames:result.frames,channels:meta.channels,bytes:44+result.frames*meta.channels*4};
  }finally{db.close();}
}
async function walkSegments(db,meta,onBlock,shouldWrite){
  let next=0,frames=0,count=0;
  while(true){
    // 8 groups (~16 seconds) per transaction cap peak memory during export.
    const range=IDBKeyRange.bound([meta.id,next],[meta.id,Number.MAX_SAFE_INTEGER]);
    const group=await req(db.transaction('blocks','readonly').objectStore('blocks').getAll(range,8));
    if(group.length===0)break;
    for(const block of group){
      if(block.index!==next)throw Error('Bloc PCM manquant : '+next);
      if(block.channels?.length!==meta.channels||!Number.isSafeInteger(block.length)||block.length<=0||block.channels.some(ch=>ch.length!==block.length))
        throw Error('Bloc PCM incomplet : '+next);
      if(shouldWrite)await onBlock(block);
      frames+=block.length;next++;count++;
    }
  }
  if(!count)throw Error('Aucun segment audio récupérable.');
  return {frames,count};
}
