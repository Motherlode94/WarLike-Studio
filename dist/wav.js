const clip=x=>Math.max(-1,Math.min(1,x));
export function encodeWav(buffer,{bits=16,dither=false}={}){
  if(![16,24,32].includes(bits))throw Error('Résolution WAV invalide.');const channels=buffer.numberOfChannels,n=buffer.length,bytes=bits/8,size=n*channels*bytes;
  if(size>0xffffffff-36)throw Error('Le fichier dépasse la limite WAV de 4 Go.');const array=new ArrayBuffer(44+size),v=new DataView(array),str=(i,s)=>[...s].forEach((c,j)=>v.setUint8(i+j,c.charCodeAt(0)));
  str(0,'RIFF');v.setUint32(4,36+size,true);str(8,'WAVE');str(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,bits===32?3:1,true);v.setUint16(22,channels,true);v.setUint32(24,buffer.sampleRate,true);v.setUint32(28,buffer.sampleRate*channels*bytes,true);v.setUint16(32,channels*bytes,true);v.setUint16(34,bits,true);str(36,'data');v.setUint32(40,size,true);
  const data=Array.from({length:channels},(_,c)=>buffer.getChannelData(c));let offset=44;
  for(let i=0;i<n;i++)for(let c=0;c<channels;c++){let x=Number.isFinite(data[c][i])?data[c][i]:0;if(bits===32)v.setFloat32(offset,x,true);else{const scale=2**(bits-1);if(dither)x+=(Math.random()-Math.random())/scale;const value=Math.round(clip(x)*(x<0?scale:scale-1));if(bits===16)v.setInt16(offset,value,true);else{v.setUint8(offset,value&255);v.setUint8(offset+1,(value>>8)&255);v.setUint8(offset+2,(value>>16)&255);}}offset+=bytes;}
  return array;
}
let crcTable;
function crc32(bytes){crcTable??=Uint32Array.from({length:256},(_,i)=>{let n=i;for(let j=0;j<8;j++)n=n&1?0xedb88320^(n>>>1):n>>>1;return n>>>0;});let n=0xffffffff;for(const b of bytes)n=crcTable[(n^b)&255]^(n>>>8);return (n^0xffffffff)>>>0;}
export function zipFiles(files){const chunks=[],entries=[],encoder=new TextEncoder();let offset=0;for(const f of files){const name=encoder.encode(f.name),data=new Uint8Array(f.data),crc=crc32(data),header=new Uint8Array(30+name.length),v=new DataView(header.buffer);v.setUint32(0,0x04034b50,true);v.setUint16(4,20,true);v.setUint16(6,0x800,true);v.setUint32(14,crc,true);v.setUint32(18,data.length,true);v.setUint32(22,data.length,true);v.setUint16(26,name.length,true);header.set(name,30);chunks.push(header,data);entries.push({name,data,crc,offset});offset+=header.length+data.length;}
  const centralStart=offset;for(const e of entries){const b=new Uint8Array(46+e.name.length),v=new DataView(b.buffer);v.setUint32(0,0x02014b50,true);v.setUint16(4,20,true);v.setUint16(6,20,true);v.setUint16(8,0x800,true);v.setUint32(16,e.crc,true);v.setUint32(20,e.data.length,true);v.setUint32(24,e.data.length,true);v.setUint16(28,e.name.length,true);v.setUint32(42,e.offset,true);b.set(e.name,46);chunks.push(b);offset+=b.length;}
  const end=new Uint8Array(22),v=new DataView(end.buffer);v.setUint32(0,0x06054b50,true);v.setUint16(8,entries.length,true);v.setUint16(10,entries.length,true);v.setUint32(12,offset-centralStart,true);v.setUint32(16,centralStart,true);chunks.push(end);return new Blob(chunks,{type:'application/zip'});
}
