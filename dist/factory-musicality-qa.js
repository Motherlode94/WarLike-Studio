// Factory arrangement diagnostic, independent of subjective loudness/mastering.
const round=(n,p=3)=>Number(n.toFixed(p));
const roleOf=(t,index)=>{
 if(t.type==='audio')return 'voice';
 if(t.type==='drums')return 'drums';
 if(index===1)return 'bass';
 return index>=3?'melody':'harmony';
};
const pct=(a,b)=>b?round(a/b,2):0;
function noteStats(clips){
 let notes=0,duration=0,energy=0,min=128,max=0;
 const phrases=new Set(),pitches=new Set(),rhythms=new Set();
 for(const c of clips)for(const n of c.notes||[]){
  if(n.muted)continue;
  notes++;duration+=n.len;energy+=n.velocity*n.velocity;
  pitches.add(n.midi);min=Math.min(min,n.midi);max=Math.max(max,n.midi);
  // A phrase is four bars; ignore all unique IDs and section names.
  const phrase=Math.floor((c.start*16+n.step)/64);
  const degree=n.midi%12;
  phrases.add(phrase+':'+degree);
  rhythms.add(phrase+':'+round(n.step%16,1));
 }
 return {notes,duration:round(duration),avgVelocity:notes?round(Math.sqrt(energy/notes)):0,pitchRange:notes?max-min:0,pitchClasses:pitches.size,rhythmEvents:rhythms.size,phraseEvents:phrases.size};
}
function drumStats(clips){
 let hits=0,weightedHits=0;const voices=new Set(),steps=new Set();
 for(const c of clips)for(const [voice,row] of Object.entries(c.pattern||{}))for(const [step,value] of row.entries())if(value>0){
  hits++;weightedHits+=value;voices.add(voice);steps.add((c.start*16+step)%64);
 }
 return {hits,weightedHits:round(weightedHits),voices:voices.size,uniqueSteps:steps.size};
}
export function auditFactoryArrangement(project){
 if(!project||!Array.isArray(project.sections)||!Array.isArray(project.tracks)||!Number.isFinite(project.bpm)||project.bpm<=0)throw Error('Projet musical invalide.');
 const issues=[],warnings=[],sections=[];
 let prev=0;
 for(const section of project.sections){
  if(!Number.isFinite(section.start)||!Number.isFinite(section.length)||section.start!==prev||section.length<=0)
   issues.push('Structure discontinue : '+section.name);
  prev=section.start+section.length;
  const tracks=project.tracks.map((track,index)=>{
   const selected=(track.clips||[]).filter(clip=>clip.start<section.start+section.length&&clip.start+clip.length>section.start);
   const role=roleOf(track,index),note=noteStats(selected),drum=drumStats(selected);
   const material=note.notes+drum.hits;
   return {name:track.name,role,material,notes:note,drums:drum,clipCount:selected.length};
  });
  const sounding=tracks.filter(t=>t.material>0);
  if(!sounding.length)issues.push('Section sans aucun instrument : '+section.name);
  const drums=tracks.some(t=>t.role==='drums'&&t.material>0);
  const bass=tracks.some(t=>t.role==='bass'&&t.material>0);
  const harmony=tracks.some(t=>t.role==='harmony'&&t.material>0);
  const melody=tracks.some(t=>t.role==='melody'&&t.material>0);
  if(!harmony&&!melody)warnings.push('Peu de contenu mélodique : '+section.name);
  if(section.name.startsWith('REFRAIN')&&(!bass||!drums))warnings.push('Refrain sans fondation rythmique complète : '+section.name);
  sections.push({name:section.name,start:section.start,bars:section.length,tracks,sounding:sounding.length,material:sounding.reduce((n,t)=>n+t.material,0),drums,bass,harmony,melody});
 }
 if(prev!==project.bars)issues.push('Durée des sections incohérente.');
 const verse=sections.find(s=>s.name.startsWith('COUPLET')),hook=sections.find(s=>s.name.startsWith('REFRAIN'));
 if(verse&&hook){
  const signature=s=>s.tracks.filter(t=>t.role!=='voice'&&t.material).map(t=>t.role+':'+pct(t.material,s.bars)).join('|');
  if(signature(verse)===signature(hook))warnings.push('Densité identique entre premier couplet et refrain : vérifier les contrastes à l’écoute');
 }
 const active=project.tracks.filter(t=>t.type!=='audio'&&t.clips?.length);
 const fxless=active.filter(t=>!(t.inserts||[]).some(id=>id&&t.effects?.[id]?.enabled)).map(t=>t.name);
 if(fxless.length)warnings.push('Pistes sans insert actif : '+fxless.join(', '));
 const master=(project.mastering?.inserts||[]).filter(id=>id&&project.mastering[id]?.enabled);
 if(master.length<3)warnings.push('Master limité : '+master.join(', '));
 const voices=project.tracks.filter(t=>t.type==='audio');
 const emptyVoices=voices.filter(t=>!t.clips?.length).map(t=>t.name);
 return {name:project.name,bpm:project.bpm,bars:project.bars,sections,issues,warnings,
  mix:{activeTracks:active.length,fxless,master,emptyVoices},verdict:issues.length?'structural-failure':warnings.length?'listen-and-review':'structurally-ready'};
}
// Signal-domain measures for the browser's already-rendered stereo PCM.
export function measureFactorySectionAudio(buffer,project){
 if(!buffer||buffer.numberOfChannels<1||buffer.length<1||buffer.sampleRate<=0)throw Error('Audio PCM invalide.');
 const measurements=[];
 for(const section of project.sections){
  const a=Math.max(0,Math.round(section.start*240/project.bpm*buffer.sampleRate));
  const b=Math.min(buffer.length,Math.round((section.start+section.length)*240/project.bpm*buffer.sampleRate));
  if(b<=a)throw Error('Section hors du rendu : '+section.name);
  let peak=0,sum=0,invalid=0,clip=0,channels=0;
  for(let c=0;c<buffer.numberOfChannels;c++){
   const pcm=buffer.getChannelData(c);channels++;
   for(let i=a;i<b;i++){
    const v=pcm[i];if(!Number.isFinite(v)){invalid++;continue;}
    const level=Math.abs(v);peak=Math.max(peak,level);sum+=v*v;if(level>=1)clip++;
   }
  }
  const rms=Math.sqrt(sum/Math.max(1,(b-a)*channels-invalid));
  measurements.push({name:section.name,bars:section.length,peak:round(peak,5),rms:round(rms,6),
   crestDb:rms?round(20*Math.log10(peak/rms),2):null,
   rmsDb:rms?round(20*Math.log10(rms),2):null,invalid,clipped:clip});
 }
 const problems=measurements.filter(x=>x.invalid||x.clipped||x.rms<.0005).map(x=>x.name);
 return {sections:measurements,problems,passed:problems.length===0};
}
