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
