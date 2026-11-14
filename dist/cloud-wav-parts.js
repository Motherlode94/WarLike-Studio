// Lossless transport for long PCM/float WAVs through the existing private audio API.
// Every part is an independently valid WAV; no resampling or sample conversion.
export const CLOUD_AUDIO_LIMIT=12*1024*1024;
export const MAX_CLOUD_WAV=512*1024*1024;
export const WAV_PARTS_KIND='warlike.wav-parts.v1';
const tag=(bytes,offset)=>String.fromCharCode(...bytes.subarray(offset,offset+4));
function wavLayout(data){
 if(!(data instanceof ArrayBuffer)||data.byteLength<44)throw Error('WAV PCM non reconnu.');
 const bytes=new Uint8Array(data),v=new DataView(data);
 if(tag(bytes,0)!=='RIFF'||tag(bytes,8)!=='WAVE'||v.getUint32(4,true)!==data.byteLength-8)throw Error('WAV RIFF incomplet ou non pris en charge.');
 let format=null;
 for(let offset=12;offset+8<=bytes.length;){
  const length=v.getUint32(offset+4,true),end=offset+8+length;
  if(end+(length%2)>bytes.length)throw Error('Bloc WAV incomplet.');
  const kind=tag(bytes,offset);
  if(kind==='fmt '){
   if(length<16)throw Error('Format WAV incomplet.');
   const encoding=v.getUint16(offset+8,true),channels=v.getUint16(offset+10,true),rate=v.getUint32(offset+12,true),align=v.getUint16(offset+20,true),bits=v.getUint16(offset+22,true);
   if(![1,3].includes(encoding)||channels<1||channels>32||rate<1||![8,16,24,32,64].includes(bits)||encoding===3&&![32,64].includes(bits)||align!==channels*bits/8)throw Error('Les longues prises cloud nécessitent un WAV PCM ou flottant.');
   format={align};
  }
  if(kind==='data'){
   if(!format||!length||length%format.align)throw Error('Données WAV non alignées.');
   const start=offset+8,tail=end+(length%2);
   if(start+bytes.length-tail>256*1024)throw Error('Métadonnées WAV trop volumineuses.');
   return {start,length,tail,align:format.align,lengthOffset:offset+4};
  }
  offset=end+(length%2);
 }
 throw Error('Données WAV absentes.');
}
export function planWavParts(data,{limit=CLOUD_AUDIO_LIMIT}={}){
 if(data?.byteLength>MAX_CLOUD_WAV)throw Error('Prise WAV limitée à 512 Mo pour la synchronisation. Copie locale conservée.');
 const layout=wavLayout(data),tailSize=data.byteLength-layout.tail;
 const unit=layout.align%2?layout.align*2:layout.align;
 const capacity=Math.floor((limit-layout.start-tailSize-1)/unit)*unit;
 if(capacity<unit)throw Error('Emplacement cloud insuffisant pour ce WAV.');
 const count=Math.ceil(layout.length/capacity);
 return {size:data.byteLength,dataSize:layout.length,count,*parts(){
  for(let offset=0;offset<layout.length;offset+=capacity){
   const length=Math.min(capacity,layout.length-offset),pad=length%2;
   const part=new Uint8Array(layout.start+length+pad+tailSize),view=new DataView(part.buffer);
   part.set(new Uint8Array(data,0,layout.start));
   part.set(new Uint8Array(data,layout.start+offset,length),layout.start);
   if(pad)part[layout.start+length]=new Uint8Array(data)[layout.start+layout.length];
   part.set(new Uint8Array(data,layout.tail),layout.start+length+pad);
   view.setUint32(4,part.byteLength-8,true);view.setUint32(layout.lengthOffset,length,true);
   yield part.buffer;
  }
 }};
}
export function validateWavManifest(value){
 if(!value||value.kind!==WAV_PARTS_KIND||!Number.isSafeInteger(value.size)||value.size<44||value.size>MAX_CLOUD_WAV||!Number.isSafeInteger(value.dataSize)||value.dataSize<1||value.dataSize>value.size-44||!Array.isArray(value.parts)||!value.parts.length||value.parts.length>128||value.parts.some(id=>typeof id!=='string'||! /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)))throw Error('Liste de morceaux WAV invalide.');
 return value;
}
// Assemble incrementally, keeping only the final file and the current download.
export async function restoreWavParts(manifest,download){
 validateWavManifest(manifest);
 const result=new Uint8Array(manifest.size);let first=null,written=0,last=null;
 for(let index=0;index<manifest.parts.length;index++){
  const data=await download(manifest.parts[index]);
  if(data.byteLength>CLOUD_AUDIO_LIMIT)throw Error('Morceau WAV trop volumineux.');
  const layout=wavLayout(data),bytes=new Uint8Array(data);
  if(!first){first=layout;result.set(bytes.subarray(0,layout.start));}
  else {
   if(layout.start!==first.start||layout.align!==first.align)throw Error('Morceaux WAV incompatibles.');
   for(let i=0;i<layout.start;i++)if(!(i>=4&&i<8)&&!(i>=layout.lengthOffset&&i<layout.lengthOffset+4)&&bytes[i]!==result[i])throw Error('En-têtes WAV incompatibles.');
  }
  if(written+layout.length>manifest.dataSize||layout.start+manifest.dataSize>result.length)throw Error('Longueur WAV incohérente.');
  result.set(bytes.subarray(layout.start,layout.start+layout.length),first.start+written);written+=layout.length;
  if(index===manifest.parts.length-1)last={bytes,layout};
 }
 const end=first.start+written,pad=written%2,tail=last.bytes.subarray(last.layout.tail);
 if(written!==manifest.dataSize||end+pad+tail.length!==manifest.size)throw Error('Téléchargement WAV incomplet.');
 if(pad)result[end]=last.bytes[last.layout.start+last.layout.length];
 result.set(tail,end+pad);const view=new DataView(result.buffer);view.setUint32(4,result.byteLength-8,true);view.setUint32(first.lengthOffset,written,true);
 return result.buffer;
}
