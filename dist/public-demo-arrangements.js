// Full-length arrangements for new public-demo copies only.
// Original 16-bar fixtures stay available and unchanged for existing projects.
const uid=()=>globalThis.crypto?.randomUUID?.().replaceAll('-','')||Math.random().toString(36).slice(2,12);
const ARRANGEMENTS=Object.freeze({
 trap808:[
  ['INTRO',8,0],['COUPLET A',16,1],['MONTÉE',8,2],['REFRAIN A',8,3],
  ['COUPLET B',16,1],['BREAK',8,2],['COUPLET C',16,1],
  ['REFRAIN FINAL',16,3],['OUTRO',16,0]
 ],
 trap:[
  ['INTRO',8,0],['COUPLET A',16,1],['REFRAIN A',8,3],['COUPLET B',16,2],
  ['REFRAIN B',8,3],['BREAK',8,0],['COUPLET FINAL',16,1],
  ['REFRAIN FINAL',12,3],['OUTRO',4,0]
 ]
});
function adaptPattern(clip,role,partName,repetition){
 if(!clip.pattern)return;
 if(partName==='BREAK'||partName==='OUTRO'){
  for(const [voice,row] of Object.entries(clip.pattern)){
   if(voice==='kick'||voice==='open')clip.pattern[voice]=row.map((v,i)=>i>=16||partName==='BREAK'?0:v);
   else if(voice==='hat')clip.pattern[voice]=row.map((v,i)=>i%4?v*.5:v);
  }
 }else if(repetition%4===3&&role===0){
  const row=clip.pattern.hat;
  if(row)for(const i of [59,61,62,63])row[i]=Math.max(row[i]||0,.18+(i-59)*.06);
 }
}
export function extendPublicDemoArrangement(project,kind){
 const layout=ARRANGEMENTS[kind];
 if(!layout||!project||!Array.isArray(project.tracks)||project.bars!==16)throw Error('Arrangement public de 16 mesures requis');
 const sections=[];let cursor=0;
 for(const [name,length,source] of layout){sections.push({name,start:cursor,length,source});cursor+=length}
 for(const [role,track] of project.tracks.entries()){
  const originals=track.clips.map(c=>structuredClone(c)),expanded=[];
  for(const section of sections){
   for(let relative=0;relative<section.length;relative+=4){
    const block=Math.min(4,section.length-relative);
    const sourceClips=originals.filter(c=>Math.floor(c.start/4)===section.source);
    for(const original of sourceClips){
     // No artificial vocals in the intro, break or outro. For derived vocal
     // recordings, reuse licensed source explicitly, never claim a new take.
     if(track.type==='audio'&&['INTRO','BREAK','OUTRO','MONTÉE'].includes(section.name))continue;
     if(section.name==='OUTRO'&&role<=1)continue;
     if(section.name==='BREAK'&&role===1)continue;
     const local=original.start-section.source*4;
     if(local<0||local>=block)continue;
     const clip={...structuredClone(original),id:uid(),start:section.start+relative+local,
      length:Math.min(original.length,block-local),
      name:section.name+' · '+original.name};
     if(clip.length<=0)continue;
     if(clip.pattern){
      clip.patternSteps=Math.ceil(clip.length*16);
      for(const voice of Object.keys(clip.pattern))clip.pattern[voice]=clip.pattern[voice].slice(0,clip.patternSteps);
      adaptPattern(clip,role,section.name,Math.floor(relative/4));
     }
     if(clip.notes){
      clip.notes=clip.notes.filter(n=>n.step<clip.length*16).map(n=>({...n,id:uid(),len:Math.min(n.len,clip.length*16-n.step)}));
      if(section.name==='OUTRO')clip.notes=clip.notes.filter((n,i)=>i%2===0);
      if(section.name==='BREAK'&&role>=2)clip.notes=clip.notes.filter((n,i)=>i%3===0);
     }
     if(clip.audioId){
      clip.gainDb=(Number.isFinite(clip.gainDb)?clip.gainDb:0)-(role===0?7:role===1?9:10);
      clip.fadeIn=Math.max(.035,clip.fadeIn||0);
      clip.fadeOut=Math.max(.055,clip.fadeOut||0);
      clip.derivedRepeat=true;
      clip.name+=' (reprise de prise existante)';
     }
     expanded.push(clip);
    }
   }
  }
  track.clips=expanded;
 }
 project.bars=cursor;
 project.sections=sections.map(({source,...section})=>section);
 project.demoRevision=kind==='trap'?8:4;
 project.fullSong=true;
 if(kind==='trap'){
  // Conservative headroom before the full group/FX/master chain is applied.
  project.masterVolume=Math.min(-12,Number.isFinite(project.masterVolume)?project.masterVolume:0);
  for(const track of project.tracks){
   if(track.type==='audio')track.volume=Math.min(track.volume,-8);
   else if(track.type!=='bus')track.volume=Math.min(0,(Number(track.volume)||0)-3);
  }
 }
 return project;
}
