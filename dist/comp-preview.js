import {compPlaylist,newPlaylist,saveActivePlaylist} from './studio-model.js?v=0.14.0';
const base=track=>JSON.stringify({activePlaylist:track.activePlaylist,clips:track.clips,comp:track.playlists?.find(l=>l.id===track.activePlaylist)?.comp??null});
export function canContinueComp(track){const active=track.playlists?.find(l=>l.id===track.activePlaylist),meta=active?.comp;return meta?.version===1&&typeof meta.basePlaylistId==='string'&&meta.basePlaylistId!==active.id&&track.playlists.some(l=>l.id===meta.basePlaylistId);}
function destination(track,mode){
 if(!['new','append'].includes(mode))throw Error('Choisis une destination de montage valide.');
 if(mode==='append'&&!canContinueComp(track))throw Error('Crée d’abord une playlist Montage pour conserver les prises d’origine.');
 if(mode==='new'&&track.playlists?.length>=64)throw Error('Cette piste atteint la limite de 64 playlists. Aucun montage supplémentaire n’est créé.');
}
export function compFadeMs(value=8){if(!Number.isFinite(value)||value<0||value>50)throw Error('Choisis un fondu de raccord entre 0 et 50 ms.');return value;}
function seamFades(clips,pieces,range,bpm,milliseconds){
 const inserted=new Set(pieces.map(c=>c.id)),seconds=milliseconds/1000;
 for(const c of clips){if(!c.audioId)continue;const amount=Math.min(seconds,c.length*240/bpm/2);if(inserted.has(c.id)||Math.abs(c.start-range.end)<1e-8)c.fadeIn=amount;if(inserted.has(c.id)||Math.abs(c.start+c.length-range.start)<1e-8)c.fadeOut=amount;}
}
export function prepareComp(project,trackId,sourceId,range,idFactory,{mode='new',fadeMs=8}={}){
 const {start,end}=range,track=project.tracks.find(t=>t.id===trackId);
 if(!track||track.type!=='audio')throw Error('Sélectionne une piste audio.');
 destination(track,mode);
 fadeMs=compFadeMs(fadeMs);
 if(![start,end].every(Number.isFinite)||start<0||end<=start||end>project.bars)throw Error('Choisis une plage de montage valide dans le morceau.');
 const candidate=structuredClone(track),pieces=compPlaylist(candidate,sourceId,start,end,project.bpm,idFactory);
 seamFades(candidate.clips,pieces,range,project.bpm,fadeMs);
 if(candidate.clips.length>512)throw Error('Le montage dépasse la limite de 512 clips par piste. Réduis le nombre d’extraits.');
 return {trackId,sourceId,range:{start,end},mode,fadeMs,base:base(track),clips:candidate.clips,pieces};
}
export function compContext(range,bars){return {start:Math.max(0,range.start-.25),end:Math.min(bars,range.end+.25)};}
export function commitComp(track,prepared,idFactory){
 const mode=prepared.mode||'new',fadeMs=compFadeMs(prepared.fadeMs);destination(track,mode);
 if(track.id!==prepared.trackId||base(track)!==prepared.base)throw Error('Le montage a changé. Prépare à nouveau cet extrait.');
 const basePlaylistId=track.activePlaylist,playlist=mode==='append'?track.playlists.find(l=>l.id===track.activePlaylist):newPlaylist(track,idFactory,{name:'Montage '+(track.playlists.length+1)});
 if(mode==='new')playlist.comp={version:1,basePlaylistId};
 playlist.comp.fadeMs=fadeMs;
 track.clips=structuredClone(prepared.clips);saveActivePlaylist(track);return playlist;
}
