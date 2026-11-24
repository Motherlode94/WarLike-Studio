import {compPlaylist,newPlaylist,saveActivePlaylist} from './studio-model.js?v=0.14.0';
import {CLIP_GAIN_MIN_DB,CLIP_GAIN_MAX_DB} from './recording.js?v=0.14.0';
const base=track=>JSON.stringify({activePlaylist:track.activePlaylist,clips:track.clips,comp:track.playlists?.find(l=>l.id===track.activePlaylist)?.comp??null});
export function canContinueComp(track){const active=track.playlists?.find(l=>l.id===track.activePlaylist),meta=active?.comp;return meta?.version===1&&typeof meta.basePlaylistId==='string'&&meta.basePlaylistId!==active.id&&track.playlists.some(l=>l.id===meta.basePlaylistId);}
function destination(track,mode){
 if(!['new','append'].includes(mode))throw Error('Choisis une destination de montage valide.');
 if(mode==='append'&&!canContinueComp(track))throw Error('Crée d’abord une playlist Montage pour conserver les prises d’origine.');
 if(mode==='new'&&track.playlists?.length>=64)throw Error('Cette piste atteint la limite de 64 playlists. Aucun montage supplémentaire n’est créé.');
}
export function compFadeMs(value=8){if(!Number.isFinite(value)||value<0||value>50)throw Error('Choisis un fondu de raccord entre 0 et 50 ms.');return value;}
export function compGainOffsetDb(value=0){if(!Number.isFinite(value)||value< -24||value>24)throw Error('Choisis un ajustement de niveau entre −24 et +24 dB.');return value;}
function validRange({start,end},bars){if(![start,end,bars].every(Number.isFinite)||start<0||end<=start||end>bars)throw Error('Choisis une plage de montage valide dans le morceau.');}
function seamFades(clips,pieces,range,bpm,milliseconds){
 const inserted=new Set(pieces.map(c=>c.id)),seconds=milliseconds/1000;
 for(const c of clips){if(!c.audioId)continue;const amount=Math.min(seconds,c.length*240/bpm/2);if(inserted.has(c.id)||Math.abs(c.start-range.end)<1e-8)c.fadeIn=amount;if(inserted.has(c.id)||Math.abs(c.start+c.length-range.start)<1e-8)c.fadeOut=amount;}
}
export function prepareComp(project,trackId,sourceId,range,idFactory,{mode='new',fadeMs=8,gainOffsetDb=0}={}){
 const {start,end}=range,track=project.tracks.find(t=>t.id===trackId);
 if(!track||track.type!=='audio')throw Error('Sélectionne une piste audio.');
 destination(track,mode);
 fadeMs=compFadeMs(fadeMs);
 gainOffsetDb=compGainOffsetDb(gainOffsetDb);
 validRange(range,project.bars);
 const candidate=structuredClone(track),pieces=compPlaylist(candidate,sourceId,start,end,project.bpm,idFactory);
 for(const c of pieces){if(!c.audioId)continue;const gain=(c.gainDb??0)+gainOffsetDb;if(!Number.isFinite(gain)||gain<CLIP_GAIN_MIN_DB||gain>CLIP_GAIN_MAX_DB)throw Error('Le gain final d’un extrait doit rester entre −24 et +36 dB. Réduis l’ajustement.');if(gainOffsetDb!==0)c.gainDb=gain;}
 seamFades(candidate.clips,pieces,range,project.bpm,fadeMs);
 if(candidate.clips.length>512)throw Error('Le montage dépasse la limite de 512 clips par piste. Réduis le nombre d’extraits.');
 return {trackId,sourceId,range:{start,end},mode,fadeMs,gainOffsetDb,base:base(track),clips:candidate.clips,pieces};
}
export function compContext(range,bars){validRange(range,bars);return {start:Math.max(0,range.start-.25),end:Math.min(bars,range.end+.25)};}
export function commitComp(track,prepared,idFactory){
 const mode=prepared.mode||'new',fadeMs=compFadeMs(prepared.fadeMs);destination(track,mode);
 compGainOffsetDb(prepared.gainOffsetDb);
 if(track.id!==prepared.trackId||base(track)!==prepared.base)throw Error('Le montage a changé. Prépare à nouveau cet extrait.');
 const basePlaylistId=track.activePlaylist,playlist=mode==='append'?track.playlists.find(l=>l.id===track.activePlaylist):newPlaylist(track,idFactory,{name:'Montage '+(track.playlists.length+1)});
 if(mode==='new')playlist.comp={version:1,basePlaylistId};
 playlist.comp.fadeMs=fadeMs;
 track.clips=structuredClone(prepared.clips);saveActivePlaylist(track);return playlist;
}

/**
 * R08.16 — non-destructive edit-point audit.
 * Structural warnings only: actual clicks/clipping require audio audition.
 * Report separately for both boundaries of the proposed excerpt.
 */
export function auditCompSeams(project,prepared){
 if(!project||!prepared||!Array.isArray(prepared.clips)||!Number.isFinite(project.bpm)||project.bpm<=0)
  throw Error('Montage invalide pour le contrôle des raccords.');
 validRange(prepared.range,project.bars);
 const {start,end}=prepared.range;
 const tolerance=1e-6;
 const clips=prepared.clips.filter(c=>c.audioId&&!c.muted).sort((a,b)=>a.start-b.start||a.length-b.length);
 const seams=[start,end].map(bar=>{
  const ending=clips.filter(c=>Math.abs(c.start+c.length-bar)<tolerance);
  const starting=clips.filter(c=>Math.abs(c.start-bar)<tolerance);
  const previous=ending.at(-1)||null,next=starting[0]||null;
  const warnings=[];
  if(!previous||!next)warnings.push('Raccord sans audio des deux côtés : vérifier le silence.');
  if(previous&&next){
   const a=Number(previous.gainDb??0),b=Number(next.gainDb??0);
   if(!Number.isFinite(a)||!Number.isFinite(b))warnings.push('Gain de clip non valide.');
   else if(Math.abs(a-b)>6)warnings.push('Écart de niveau supérieur à 6 dB : écouter le raccord.');
   const fadeOut=Number(previous.fadeOut??0),fadeIn=Number(next.fadeIn??0);
   if(!Number.isFinite(fadeOut)||!Number.isFinite(fadeIn)||fadeOut<0||fadeIn<0)
    warnings.push('Fondu de raccord non valide.');
   else if(fadeOut<.003&&fadeIn<.003)
    warnings.push('Pas de fondu de sécurité ≥ 3 ms sur ce raccord : risque de clic.');
  }
  return {bar,previousId:previous?.id??null,nextId:next?.id??null,warnings};
 });
 return {seams,warnings:seams.flatMap(s=>s.warnings),clean:seams.every(s=>s.warnings.length===0)};
}
