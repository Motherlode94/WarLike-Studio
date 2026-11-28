// Factory-copy mix offsets in dB; never apply to reopened user projects.
export function balancePublicDemo(project){
 if(!project?.publicDemo||project.demoMixRevision===1)return project;
 for(const track of project.tracks||[]){
  if(!Number.isFinite(track.volume)||!track.clips?.length)continue;
  const name=String(track.name||'');
  const vocal=track.type==='audio'||track.type==='wlvox';
  const bass=track.type==='bass'||/\b(?:808|bass|basse|sub)\b/i.test(name);
  const offset=vocal?-2:track.type==='drums'?-1:bass?1:4;
  track.volume=Math.min(0,track.volume+offset);
 }
 // Preserve existing master attenuation and limiter; offsets are not measured loudness.
 project.demoMixRevision=1;
 return project;
}

// Pre-master gain staging for public demos, measured on the app pipeline (48 kHz render,
// master bypassed): the gain that brings the mix crest to about -6 dBFS.
export const PUBLIC_DEMO_STAGING_DB=Object.freeze({funk:3.75,rock:6.5,pop:15.25,rumba:20.25});
// Limiter input after staging, measured so playback stays at the common demo level (~-16.3 LUFS).
export const PUBLIC_DEMO_STAGED_DRIVE=Object.freeze({funk:11.5,rock:15.5,pop:14.25,rumba:11.75});
// Gain goes on tracks feeding the master (faders capped at +12 dB); post-fader sends of those
// tracks are lowered by the same amount so effect returns keep their balance. The mastering
// compressor threshold and limiter input move down by the same gain, so the master reacts as
// before while the mix itself now carries the level. The master fader only takes a remainder.
export function stagePublicDemoMix(project,kind){
 const gain=PUBLIC_DEMO_STAGING_DB[kind];
 if(!project?.publicDemo||!gain||project.demoStagingRevision===1)return project;
 const roots=(project.tracks||[]).filter(t=>(t.output||'master')==='master'&&Number.isFinite(t.volume));
 const headroom=Math.min(...roots.map(t=>12-t.volume),gain);
 const onTracks=Math.max(0,Math.round(headroom*4)/4);
 for(const t of roots){
  t.volume=Math.round((t.volume+onTracks)*100)/100;
  for(const s of t.sends||[])if(!s.pre&&Number.isFinite(s.level))s.level=Math.max(-60,Math.round((s.level-onTracks)*100)/100);
 }
 const rest=Math.round((gain-onTracks)*100)/100;
 if(rest>0)project.masterVolume=Math.min(12,(Number.isFinite(project.masterVolume)?project.masterVolume:0)+rest);
 const m=project.mastering;
 if(m?.press&&Number.isFinite(m.press.threshold))m.press.threshold=Math.max(-40,Math.round((m.press.threshold-gain)*10)/10);
 if(m?.peak&&Number.isFinite(m.peak.drive))m.peak.drive=PUBLIC_DEMO_STAGED_DRIVE[kind]??Math.max(0,m.peak.drive-gain);
 project.demoStagingRevision=1;
 return project;
}
