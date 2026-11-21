import {MAX_BARS,fitSession,saveActivePlaylist} from './studio-model.js?v=0.14.0';
export function arrangementShift(items,desired,bars){
 const min=Math.min(...items.map(c=>c.start)),end=Math.max(...items.map(c=>c.start+c.length));
 const shift=Math.max(-min,Math.min(MAX_BARS-end,desired));
 return {shift,bars:fitSession(bars,end+shift)};
}
export function arrangementWidth(available,zoom,bars){
 return Math.max(320,available*zoom,bars*18*zoom);
}

export function canTransferClip(source,target,clip){
 if(!source||!target||source===target||source.frozenTrack||target.frozenTrack||target.type==='bus'||source.type==='bus')return false;
 if(!source.clips.includes(clip)||target.clips.some(c=>c.id===clip.id)||target.clips.length>=512)return false;
 if(clip.audioId)return source.type==='audio'&&target.type==='audio'&&!clip.groupId;
 if(source.type==='audio'||target.type==='audio')return false;
 return (source.type==='drums')===(target.type==='drums');
}
// A shared pattern is track-addressed. Moving a single occurrence must preserve
// its resolved notes without redirecting the original pattern's other channels.
export function transferClip(project,source,target,clip){
 if(!canTransferClip(source,target,clip))return false;
 const pattern=project.patterns?.find(p=>p.id===clip.patternId);
 const channel=pattern?.channels?.[source.id];
 if(clip.patternId){if(channel){Object.assign(clip,structuredClone(channel),{patternSteps:pattern.bars*16});}delete clip.patternId;}
 source.clips.splice(source.clips.indexOf(clip),1);target.clips.push(clip);
 saveActivePlaylist(source);saveActivePlaylist(target);
 return true;
}
