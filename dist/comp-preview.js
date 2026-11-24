import {compPlaylist,newPlaylist,saveActivePlaylist} from './studio-model.js?v=0.14.0';
const base=track=>JSON.stringify({activePlaylist:track.activePlaylist,clips:track.clips,comp:track.playlists?.find(l=>l.id===track.activePlaylist)?.comp??null});
export function canContinueComp(track){const active=track.playlists?.find(l=>l.id===track.activePlaylist),meta=active?.comp;return meta?.version===1&&typeof meta.basePlaylistId==='string'&&meta.basePlaylistId!==active.id&&track.playlists.some(l=>l.id===meta.basePlaylistId);}
function destination(track,mode){
 if(!['new','append'].includes(mode))throw Error('Choisis une destination de montage valide.');
 if(mode==='append'&&!canContinueComp(track))throw Error('Crée d’abord une playlist Montage pour conserver les prises d’origine.');
 if(mode==='new'&&track.playlists?.length>=64)throw Error('Cette piste atteint la limite de 64 playlists. Aucun montage supplémentaire n’est créé.');
}
export function prepareComp(project,trackId,sourceId,range,idFactory,{mode='new'}={}){
 const {start,end}=range,track=project.tracks.find(t=>t.id===trackId);
 if(!track||track.type!=='audio')throw Error('Sélectionne une piste audio.');
 destination(track,mode);
 if(![start,end].every(Number.isFinite)||start<0||end<=start||end>project.bars)throw Error('Choisis une plage de montage valide dans le morceau.');
 const candidate=structuredClone(track),pieces=compPlaylist(candidate,sourceId,start,end,project.bpm,idFactory);
 if(candidate.clips.length>512)throw Error('Le montage dépasse la limite de 512 clips par piste. Réduis le nombre d’extraits.');
 return {trackId,sourceId,range:{start,end},mode,base:base(track),clips:candidate.clips,pieces};
}
export function compContext(range,bars){return {start:Math.max(0,range.start-.25),end:Math.min(bars,range.end+.25)};}
export function commitComp(track,prepared,idFactory){
 const mode=prepared.mode||'new';destination(track,mode);
 if(track.id!==prepared.trackId||base(track)!==prepared.base)throw Error('Le montage a changé. Prépare à nouveau cet extrait.');
 const basePlaylistId=track.activePlaylist,playlist=mode==='append'?track.playlists.find(l=>l.id===track.activePlaylist):newPlaylist(track,idFactory,{name:'Montage '+(track.playlists.length+1)});
 if(mode==='new')playlist.comp={version:1,basePlaylistId};
 track.clips=structuredClone(prepared.clips);saveActivePlaylist(track);return playlist;
}
