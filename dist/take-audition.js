export function takeSelection(from,to,bars){
 if(![from,to,bars].every(Number.isFinite)||bars<1/16)throw Error('Plage d’écoute invalide.');
 const start=Math.max(0,Math.min(bars-1/16,Math.round(Math.min(from,to)*16)/16)),end=Math.min(bars,Math.max(start+1/16,Math.round(Math.max(from,to)*16)/16));return {start,end};
}
export function takeAuditionProject(project,trackId,playlistId,range,proposedClips,{allowSilentTarget=false}={}){
 const {start,end}=range;if(![start,end].every(Number.isFinite)||start<0||end<=start||end>project.bars)throw Error('Choisis une plage d’écoute valide dans le morceau.');
 const target=project.tracks.find(t=>t.id===trackId),playlist=target?.playlists?.find(l=>l.id===playlistId),source=proposedClips??playlist?.clips;if(!target||!Array.isArray(source))throw Error('Prise introuvable.');
 if(!allowSilentTarget&&!source.some(c=>c.audioId&&!c.muted&&c.start<end&&c.start+c.length>start))throw Error('Cette prise ne contient pas d’audio dans la plage choisie.');
 const snapshot=structuredClone(project);snapshot.bars=end;
 for(const t of snapshot.tracks){const clips=t.id===trackId?structuredClone(source):t.clips;t.clips=clips.flatMap(c=>{const left=Math.max(start,c.start),right=Math.min(end,c.start+c.length);if(right<=left)return [];const cut=left-c.start,result={...c,start:left,length:right-left};if(c.audioId){result.sourceOffset=(c.sourceOffset||0)+cut*240/project.bpm;if(cut>0)result.fadeIn=.005;if(right<c.start+c.length)result.fadeOut=.005;}else result.patternOffset=(c.patternOffset||0)+cut*16;return [result];});}
 return snapshot;
}
export function createTakeAudition({engine,project,trackId,onChange=()=>{},setTimer=setInterval,clearTimer=clearInterval}){
 let saved=null,preview=null,timer,request=0,disposed=false;
 function stop(){request++;clearTimer(timer);if(preview&&engine.takePreview===preview&&engine.getProject()===project){engine.pause();engine.takePreview=saved.takePreview;engine.loop=saved.loop;engine.patternMode=saved.patternMode;engine.clipPreview=saved.clipPreview;engine.position=saved.position;}saved=null;preview=null;onChange({status:'idle'});}
 return {stop,dispose(){if(disposed)return;stop();disposed=true;},async listen(playlistId,range,{loop=false,clips,comparison=null}={}){
  if(disposed)return;const snapshot=takeAuditionProject(project,trackId,playlistId,range,clips,{allowSilentTarget:comparison==='before'});stop();const token=++request;
  engine.pause();saved={position:engine.position,loop:engine.loop,patternMode:engine.patternMode,clipPreview:engine.clipPreview,takePreview:engine.takePreview};
  preview={project:snapshot,trackId,playlistId,range:{...range},comparison};engine.takePreview=preview;engine.patternMode=null;engine.clipPreview=null;engine.loop=loop;engine.position=range.start*16;onChange({status:'preparing',playlistId,comparison});
  try{await engine.play();if(token!==request||disposed)return;if(!engine.playing)throw Error('Écoute interrompue.');onChange({status:'playing',playlistId,comparison});timer=setTimer(()=>{if(!engine.playing||engine.takePreview!==preview||engine.getProject()!==project)stop();},50);}
  catch(error){if(token!==request||disposed)return;stop();throw error;}
 }};
}
