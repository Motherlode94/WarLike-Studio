// Session, routing and audio playlists. Musical note creation is intentionally unchanged.
export const MAX_BARS=2048;
const copy=v=>structuredClone(v),clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export const sessionBars=value=>clamp(Math.ceil(Number(value)||16),1,MAX_BARS);
export const fitSession=(current,end)=>sessionBars(Math.max(current,Math.ceil(end)));
export const audioAssetIds=p=>new Set(p.tracks.flatMap(t=>[...t.clips,...(t.playlists||[]).flatMap(l=>l.clips),...(t.frozenTrack?.clips||[]),...(t.frozenTrack?.playlists||[]).flatMap(l=>l.clips)].flatMap(c=>[c.audioId,c.originalAudioId,c.editOriginal?.audioId])).filter(Boolean));
export function edges(track){return [track.output||'master',...(track.sends||[]).map(s=>s.target)].filter(id=>id&&id!=='master');}
export function reaches(tracks,from,to,seen=new Set()){
  if(from===to)return true;if(seen.has(from))return false;seen.add(from);const t=tracks.find(t=>t.id===from);return t?edges(t).some(id=>reaches(tracks,id,to,seen)):false;
}
export function routeAllowed(tracks,from,to){return to==='master'||tracks.some(t=>t.id===to&&t.type==='bus')&&!reaches(tracks,to,from);}
export function normaliseRouting(project){
  const tracks=project.tracks,pending=new Map(tracks.map(t=>[t.id,Array.isArray(t.sends)?t.sends:[]]));for(const t of tracks)t.sends=[];
  for(const t of tracks)t.output=routeAllowed(tracks,t.id,t.output||'master')?(t.output||'master'):'master';
  for(const t of tracks)for(const s of pending.get(t.id).slice(0,8))if(s&&typeof s.id==='string'&&routeAllowed(tracks,t.id,s.target))t.sends.push({id:s.id,target:s.target,level:clamp(Number.isFinite(s.level)?s.level:-12,-60,12),pre:!!s.pre,enabled:s.enabled!==false});
}
export function audibleIds(tracks){
  const solos=tracks.filter(t=>t.solo);if(!solos.length)return new Set(tracks.map(t=>t.id));
  const set=new Set();for(const t of tracks)if(solos.some(s=>reaches(tracks,s.id,t.id)||reaches(tracks,t.id,s.id)))set.add(t.id);return set;
}
export function trackLatency(track){return (track.inserts||[]).reduce((sum,id)=>sum+(id&&track.effects?.[id]?.enabled&&['glue','exostrip'].includes(id.split('__')[0])?.006:0),0);}
export function compensationDelays(tracks){
  const incoming=id=>tracks.filter(t=>edges(t).includes(id)),memo=new Map();
  const arrival=(t,seen=new Set())=>{if(memo.has(t.id))return memo.get(t.id);if(seen.has(t.id))return 0;const next=new Set([...seen,t.id]);const value=(t.type==='bus'?Math.max(0,...incoming(t.id).map(s=>arrival(s,next))):0)+trackLatency(t);memo.set(t.id,value);return value;};
  const max=Math.max(0,...tracks.map(t=>arrival(t)));const delays=new Map();for(const t of tracks){const own=arrival(t),target=t.output&&t.output!=='master'?tracks.find(x=>x.id===t.output):null;const at=target?Math.max(0,...incoming(target.id).map(s=>arrival(s))):max;delays.set(t.id,Math.max(0,at-own));for(const s of t.sends||[]){const target=tracks.find(n=>n.id===s.target);if(target){const atSend=Math.max(0,...incoming(target.id).map(n=>arrival(n)));delays.set(t.id+':send:'+s.id,Math.max(0,atSend-own));}}}return delays;
}
export function ensurePlaylists(track,idFactory){
  if(track.type!=='audio')return;track.playlists=Array.isArray(track.playlists)?track.playlists:[];
  if(!track.playlists.length){const id=idFactory();track.playlists=[{id,name:'Principale',clips:copy(track.clips)}];track.activePlaylist=id;}
  if(!track.playlists.some(l=>l.id===track.activePlaylist))track.activePlaylist=track.playlists[0].id;
}
export function saveActivePlaylist(track){const l=track.playlists?.find(l=>l.id===track.activePlaylist);if(l)l.clips=copy(track.clips);}
export function switchPlaylist(track,id){const l=track.playlists?.find(l=>l.id===id);if(!l)return false;saveActivePlaylist(track);track.activePlaylist=id;track.clips=copy(l.clips);return true;}
export function newPlaylist(track,idFactory,{empty=false,name='Nouvelle prise'}={}){ensurePlaylists(track,idFactory);saveActivePlaylist(track);const l={id:idFactory(),name,clips:empty?[]:copy(track.clips)};track.playlists.push(l);track.activePlaylist=l.id;track.clips=copy(l.clips);return l;}
export function recordTake(track,clip,bpm,idFactory,keepTakes=true){
  const overlap=track.clips.some(c=>c.audioId&&c.start<clip.start+clip.length&&c.start+c.length>clip.start);
  if(keepTakes&&overlap){newPlaylist(track,idFactory,{name:'Prise '+(track.playlists?.length+1||2)});track.clips=subtractRange(track.clips,clip.start,clip.start+clip.length,bpm,idFactory);}
  track.clips.push(clip);saveActivePlaylist(track);return overlap;
}
function sliceClip(c,start,end,bpm,idFactory){const result={...copy(c),id:idFactory(),start,length:end-start};if(c.audioId)result.sourceOffset=(c.sourceOffset||0)+(start-c.start)*240/bpm;else result.patternOffset=(c.patternOffset||0)+(start-c.start)*16;if(start>c.start)result.fadeIn=.008;if(end<c.start+c.length)result.fadeOut=.008;return result;}
export function subtractRange(clips,start,end,bpm,idFactory){return clips.flatMap(c=>{const finish=c.start+c.length;if(finish<=start||c.start>=end)return [copy(c)];const parts=[];if(c.start<start)parts.push(sliceClip(c,c.start,start,bpm,idFactory));if(finish>end)parts.push(sliceClip(c,end,finish,bpm,idFactory));return parts;});}
export function compPlaylist(track,sourceId,start,end,bpm,idFactory){
  if(!(end>start&&start>=0))throw Error('Choisis une plage valide.');const source=track.playlists?.find(l=>l.id===sourceId);if(!source||sourceId===track.activePlaylist)throw Error('Choisis une autre prise source.');saveActivePlaylist(track);
  const pieces=source.clips.filter(c=>c.start<end&&c.start+c.length>start).map(c=>sliceClip(c,Math.max(start,c.start),Math.min(end,c.start+c.length),bpm,idFactory));if(!pieces.length)throw Error('Cette prise est vide dans la plage choisie.');
  track.clips=[...subtractRange(track.clips,start,end,bpm,idFactory),...pieces].sort((a,b)=>a.start-b.start);saveActivePlaylist(track);return pieces;
}
export function applyCrossfade(track,clipId,bpm){
  const c=track.clips.find(c=>c.id===clipId),next=track.clips.filter(n=>n.id!==clipId&&n.start>c.start&&n.start<c.start+c.length).sort((a,b)=>a.start-b.start)[0];if(!next)throw Error('Fais chevaucher deux clips audio pour créer un fondu croisé.');
  const duration=Math.min(c.start+c.length-next.start,next.length)*240/bpm;c.fadeOut=duration;next.fadeIn=duration;c.fadeCurve=next.fadeCurve='equalPower';return duration;
}
export function fadeValue(clip,elapsed,total){const a=Math.max(0,clip.fadeIn??.005),b=Math.max(0,clip.fadeOut??.005);let v=1;if(a&&elapsed<a)v*=clip.fadeCurve==='equalPower'?Math.sin(Math.PI/2*clamp(elapsed/a,0,1)):clamp(elapsed/a,0,1);if(b&&elapsed>total-b)v*=clip.fadeCurve==='equalPower'?Math.sin(Math.PI/2*clamp((total-elapsed)/b,0,1)):clamp((total-elapsed)/b,0,1);return v;}

export function changeAudioTempo(project,nextBpm){const ratio=nextBpm/project.bpm;const scale=c=>{if(c.audioId){c.start*=ratio;c.length*=ratio;if(c.editOriginal){c.editOriginal.start*=ratio;c.editOriginal.length*=ratio;}}};for(const t of project.tracks)if(t.type==='audio'){for(const c of t.clips)scale(c);for(const l of t.playlists||[])for(const c of l.clips)scale(c);for(const points of Object.values(t.automation?.curves||{}))for(const point of points)point.bar*=ratio;}project.bpm=nextBpm;project.bars=fitSession(project.bars,Math.max(0,...project.tracks.flatMap(t=>t.clips.map(c=>c.start+c.length))));}
