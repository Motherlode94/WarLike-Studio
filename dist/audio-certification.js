const db=x=>x>0?20*Math.log10(x):-Infinity;
export function auditRouting(project){
 const tracks=project.tracks||[],map=new Map(tracks.map(t=>[t.id,t])),issues=[];
 if(map.size!==tracks.length)issues.push('Identifiants dupliqués');
 const visited=new Set(),active=new Set();
 function visit(id){if(id==='master'||visited.has(id))return;if(active.has(id)){issues.push('Boucle : '+id);return;}const t=map.get(id);if(!t)return;active.add(id);
 for(const target of [t.output||'master',...(t.sends||[]).map(s=>s.target)]){if(target==='master')continue;if(map.get(target)?.type!=='bus')issues.push('Destination invalide : '+id+' → '+target);else visit(target);}
 active.delete(id);visited.add(id);}
 for(const t of tracks)visit(t.id);return issues;
}
export function measureAudio(buffer){
 let peak=0,sum=0,invalid=0,clipped=0,count=0;
 for(let c=0;c<buffer.numberOfChannels;c++)for(const x of buffer.getChannelData(c)){if(!Number.isFinite(x)){invalid++;continue;}peak=Math.max(peak,Math.abs(x));sum+=x*x;count++;if(Math.abs(x)>1)clipped++;}
 return {peakDb:db(peak),rmsDb:db(Math.sqrt(sum/Math.max(1,count))),invalid,clipped};
}
export function verifyWav32(bytes,buffer){
 const v=new DataView(bytes),size=buffer.length*buffer.numberOfChannels*4;
 if(v.byteLength!==44+size)return false;
 const tag=(o,s)=>[...s].every((ch,i)=>v.getUint8(o+i)===ch.charCodeAt(0));
 if(!tag(0,'RIFF')||!tag(8,'WAVE')||!tag(12,'fmt ')||!tag(36,'data')||v.getUint32(4,true)!==36+size||v.getUint16(20,true)!==3||v.getUint16(22,true)!==buffer.numberOfChannels||v.getUint32(24,true)!==buffer.sampleRate||v.getUint16(34,true)!==32||v.getUint32(40,true)!==size)return false;
 const channels=Array.from({length:buffer.numberOfChannels},(_,i)=>buffer.getChannelData(i));let offset=44;
 for(let i=0;i<buffer.length;i++)for(const ch of channels){if(!Number.isFinite(ch[i])||v.getFloat32(offset,true)!==ch[i])return false;offset+=4;}return true;
}
