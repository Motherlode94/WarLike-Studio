// Encode the completed Web Audio render in bounded blocks. The DSP graph is
// rendered once: delays, reverbs and compressor state never restart at a seam.
import {encodeWav} from './wav.js?v=0.14.0';

const BLOCK_FRAMES=32768;
const yieldTask=()=>new Promise(resolve=>setTimeout(resolve,0));
function checkAbort(signal){signal?.throwIfAborted();}

export function wavExportInfo(buffer,{bits=16}={}){
  const channels=buffer?.numberOfChannels,frames=buffer?.length,rate=buffer?.sampleRate;
  if(![16,24,32].includes(bits))throw Error('Résolution WAV invalide.');
  if(!Number.isInteger(channels)||channels<1||channels>32||!Number.isSafeInteger(frames)||frames<0||!Number.isInteger(rate)||rate<1||rate>384000||typeof buffer.getChannelData!=='function')throw Error('Audio à exporter invalide.');
  const dataBytes=frames*channels*(bits/8);
  if(!Number.isSafeInteger(dataBytes)||dataBytes>0xffffffff-36)throw Error('Le fichier dépasse la limite WAV de 4 Go.');
  return {channels,frames,rate,dataBytes,bytes:44+dataBytes};
}

export async function* wavExportChunks(buffer,{bits=16,dither=false,signal,onProgress}={}){
  const info=wavExportInfo(buffer,{bits});checkAbort(signal);
  const channels=Array.from({length:info.channels},(_,c)=>buffer.getChannelData(c));
  if(channels.some(channel=>!channel||channel.length<info.frames))throw Error('Canal audio incomplet.');
  // Reuse the existing encoder for exact PCM/dither/float compatibility. A
  // zero-frame buffer supplies the header without allocating the full WAV.
  const header=encodeWav({numberOfChannels:info.channels,length:0,sampleRate:info.rate,getChannelData:()=>new Float32Array(0)},{bits});
  const view=new DataView(header);view.setUint32(4,36+info.dataBytes,true);view.setUint32(40,info.dataBytes,true);
  yield header;
  for(let start=0;start<info.frames;start+=BLOCK_FRAMES){
    checkAbort(signal);
    const end=Math.min(start+BLOCK_FRAMES,info.frames);
    const block=encodeWav({numberOfChannels:info.channels,length:end-start,sampleRate:info.rate,getChannelData:c=>channels[c].subarray(start,end)},{bits,dither});
    yield new Uint8Array(block,44);
    onProgress?.({frames:end,totalFrames:info.frames,bytes:44+end*info.channels*(bits/8),totalBytes:info.bytes});
    // Release the UI thread so progress, cancellation and other tabs stay live.
    await yieldTask();
  }
  checkAbort(signal);
}

export async function encodeWavBlob(buffer,options={}){
  const chunks=[];
  for await(const chunk of wavExportChunks(buffer,options))chunks.push(chunk);
  return new Blob(chunks,{type:'audio/wav'});
}

// The caller owns close/abort, so failed renders never commit a partial file.
export async function writeWav(buffer,writer,options={}){
  if(typeof writer?.write!=='function')throw Error('Destination WAV invalide.');
  for await(const chunk of wavExportChunks(buffer,options))await writer.write(chunk);
  return wavExportInfo(buffer,options);
}

let crcTable;
function updateCrc(crc,bytes){
  crcTable??=Uint32Array.from({length:256},(_,i)=>{let n=i;for(let j=0;j<8;j++)n=n&1?0xedb88320^(n>>>1):n>>>1;return n>>>0;});
  for(const byte of bytes)crc=crcTable[(crc^byte)&255]^(crc>>>8);
  return crc;
}

// Store already-encoded WAV Blobs directly in ZIP parts. Only CRC calculation
// reads their bytes, in 1 MiB slices; no full-sized Uint8Array copy is needed.
export async function zipWavBlobs(files,{signal,onProgress}={}){
  if(files.length>65535)throw Error('Trop de fichiers pour cette archive ZIP.');
  const names=new TextEncoder(),entries=[],parts=[];let offset=0;
  for(let index=0;index<files.length;index++){
    checkAbort(signal);const file=files[index],name=names.encode(file.name),blob=file.data;
    if(!(blob instanceof Blob)||name.length>65535||blob.size>0xffffffff)throw Error('Fichier ZIP invalide ou trop volumineux.');
    if(offset+30+name.length+blob.size>0xffffffff)throw Error('L’archive dépasse la limite ZIP de 4 Go.');
    let crc=0xffffffff;
    for(let start=0;start<blob.size;start+=1048576){
      checkAbort(signal);crc=updateCrc(crc,new Uint8Array(await blob.slice(start,start+1048576).arrayBuffer()));
      await yieldTask();
    }
    crc=(crc^0xffffffff)>>>0;
    const header=new Uint8Array(30+name.length),v=new DataView(header.buffer);
    v.setUint32(0,0x04034b50,true);v.setUint16(4,20,true);v.setUint16(6,0x800,true);v.setUint32(14,crc,true);v.setUint32(18,blob.size,true);v.setUint32(22,blob.size,true);v.setUint16(26,name.length,true);header.set(name,30);
    parts.push(header,blob);entries.push({name,size:blob.size,crc,offset});offset+=header.length+blob.size;
    onProgress?.({files:index+1,totalFiles:files.length});
  }
  const centralStart=offset;
  for(const entry of entries){
    const header=new Uint8Array(46+entry.name.length),v=new DataView(header.buffer);
    v.setUint32(0,0x02014b50,true);v.setUint16(4,20,true);v.setUint16(6,20,true);v.setUint16(8,0x800,true);v.setUint32(16,entry.crc,true);v.setUint32(20,entry.size,true);v.setUint32(24,entry.size,true);v.setUint16(28,entry.name.length,true);v.setUint32(42,entry.offset,true);header.set(entry.name,46);
    parts.push(header);offset+=header.length;
  }
  if(offset+22>0xffffffff)throw Error('L’archive dépasse la limite ZIP de 4 Go.');
  checkAbort(signal);
  const end=new Uint8Array(22),v=new DataView(end.buffer);
  v.setUint32(0,0x06054b50,true);v.setUint16(8,entries.length,true);v.setUint16(10,entries.length,true);v.setUint32(12,offset-centralStart,true);v.setUint32(16,centralStart,true);parts.push(end);
  return new Blob(parts,{type:'application/zip'});
}
