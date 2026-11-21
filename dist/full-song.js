// Full-length editable arrangements, separate from the short reference fixtures.
export function fullSongBars(bpm){return Math.min(128,Math.max(64,Math.round(bpm*3.5/4/4)*4));}
export function expandFactorySong(project){
 const bars=fullSongBars(project.bpm),middle=bars-40;
 const layout=[['INTRO',8,0],['COUPLET A',16,1],['PRÉ-REFRAIN',4,2],['REFRAIN A',8,3],['BREAK',4,0],['COUPLET B',middle-24,2],['REFRAIN B',12,3],['OUTRO',12,0]];
 // Last section absorbs rounding so all bars are contiguous.
 const total=layout.reduce((s,x)=>s+x[1],0);layout[layout.length-1][1]+=bars-total;
 let cursor=0;const sections=layout.filter(x=>x[1]>0).map(([name,length,source])=>{const part={name,start:cursor,length,source};cursor+=length;return part;});
 for(const [role,track] of project.tracks.entries()){
 const originals=track.clips.slice();track.clips=[];
 for(const [si,part] of sections.entries())for(let offset=0;offset<part.length;offset+=4){
  const source=originals.find(c=>c.start===part.source*4);if(!source)continue;
  if(part.name==='BREAK'&&(role===0||role===1)||part.name==='OUTRO'&&offset>=4&&[0,1,5].includes(role)||part.name==='INTRO'&&offset===0&&[0,1].includes(role))continue;
  const clip=structuredClone(source);clip.id=crypto.randomUUID();clip.start=part.start+offset;clip.length=Math.min(4,part.length-offset);clip.patternSteps=clip.length*16;clip.name=part.name+' / '+track.name;
  if(clip.notes){clip.notes=clip.notes.filter(n=>n.step<clip.patternSteps).map((n,i)=>({...n,id:crypto.randomUUID(),len:Math.min(n.len,clip.patternSteps-n.step),velocity:Math.min(1,n.velocity*(part.name==='OUTRO'?.65:si===6?1.08:.94+(offset%12)*.012))}));if(role===5&&offset%8===4)clip.notes=clip.notes.filter((n,i)=>i%3!==1);}
  if(clip.pattern){for(const [voice,row] of Object.entries(clip.pattern)){clip.pattern[voice]=row.slice(0,clip.patternSteps).map((v,i)=>v*(i%16===0?1:.92));}if(offset+4>=part.length&&part.name!=='OUTRO'){for(const i of [60,62,63])if(i<clip.patternSteps)clip.pattern.tom[i]=.35;}if(part.name==='OUTRO')clip.pattern.kick=clip.pattern.kick.map((v,i)=>i>=32?0:v);}
  track.clips.push(clip);
 }
 }
 project.bars=bars;project.sections=sections.map(({source,...part})=>part);project.demoRevision=5;project.fullSong=true;return project;
}
