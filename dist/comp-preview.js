import {compPlaylist,newPlaylist,saveActivePlaylist} from './studio-model.js?v=0.14.0';
const base=track=>JSON.stringify({activePlaylist:track.activePlaylist,clips:track.clips});
export function prepareComp(project,trackId,sourceId,range,idFactory){
 const {start,end}=range,track=project.tracks.find(t=>t.id===trackId);
 if(!track||track.type!=='audio')throw Error('Sélectionne une piste audio.');
 if(track.playlists?.length>=64)throw Error('Cette piste atteint la limite de 64 playlists. Aucun montage supplémentaire n’est créé.');
 if(![start,end].every(Number.isFinite)||start<0||end<=start||end>project.bars)throw Error('Choisis une plage de montage valide dans le morceau.');
 const candidate=structuredClone(track),pieces=compPlaylist(candidate,sourceId,start,end,project.bpm,idFactory);
 return {trackId,sourceId,range:{start,end},base:base(track),clips:candidate.clips,pieces};
}
export function compContext(range,bars){return {start:Math.max(0,range.start-.25),end:Math.min(bars,range.end+.25)};}
export function commitComp(track,prepared,idFactory){
 if(track.playlists?.length>=64)throw Error('Cette piste atteint la limite de 64 playlists. Aucun montage supplémentaire n’est créé.');
 if(track.id!==prepared.trackId||base(track)!==prepared.base)throw Error('Le montage a changé. Prépare à nouveau cet extrait.');
 const playlist=newPlaylist(track,idFactory,{name:'Montage '+(track.playlists.length+1)});track.clips=structuredClone(prepared.clips);saveActivePlaylist(track);return playlist;
}
