// R08.4 factory-production finishing pass.
// Applied to NEW factory copies only; user-created projects and previously saved
// copies are never touched. No automatic mastering based on unmeasured LUFS.
import {ensurePlugins} from './plugins.js';
import {demoMasteringSettings} from './demo-mastering.js';
const genre={
 nocturne:'trap',soleil:'afro',brume:'rnb',
 'trap-abyss':'trap','trap-enigma':'trap',
 'rnb-2005':'rnb','popstar-2008':'pop',
 'etoiles-interdites':'pop','derriere-les-murs':'pop','un-dernier-soleil':'pop',
 'au-bord-du-ciel':'rnb','promesses-de-pluie':'rnb',
 rives:'afro',pluie:'rnb',horizon:'afro',eclats:'rock',kin:'rumba',lumiere:'pop'
};
const get=(tr,id)=>{const fx=tr.effects?.[id];return fx&&tr.inserts?.includes(id)&&fx.enabled;};
function add(tr,id,params){
 if(!tr.effects?.[id]||get(tr,id))return false;
 const slot=tr.inserts?.indexOf(null)??-1;if(slot<0)return false;
 tr.inserts[slot]=id;Object.assign(tr.effects[id],params,{enabled:true});return true;
}
export function finishFactorySong(project,id){
 if(!project?.demo||!project.fullSong||!Object.hasOwn(genre,id))return project;
 if(project.factoryProductionRevision===1)return project;
 const style=genre[id],music=project.tracks.filter(t=>t.clips?.length&&t.type!=='audio'&&t.type!=='bus');
 const isCinematic=['pop','rnb'].includes(style);
 for(const [index,tr] of music.entries()){
  ensurePlugins(tr);
  const drums=tr.type==='drums',bass=index===1,lead=index>=3;
  // Keep the approved racks; add just enough processing to fill holes.
  const hasTone=['sculpt','circuiteq','vectoreq','harditilt','prism'].some(k=>get(tr,k));
  const hasDynamics=['glue','vectorcomp','circuitbus','hardibus'].some(k=>get(tr,k));
  const hasSpace=['aura','exospace','echo','alterecho','voxambience','eliananest'].some(k=>get(tr,k));
  if(!hasTone&&!drums)add(tr,'sculpt',{highpass:bass?25:lead?145:65,cutoff:bass?11800:lead?11500:14500});
  if(!hasDynamics&&(drums||bass||index===2))add(tr,'glue',{
   threshold:drums?-20:bass?-19:-21,ratio:drums?1.6:1.4,
   attack:drums?30:bass?28:38,release:drums?160:220,mix:drums?.28:bass?.32:.23,makeup:0
  });
  if(lead&&!hasSpace&&index===5)add(tr,'aura',{mix:isCinematic?.09:.065});
  // A clear center for drums/bass and vocal space, but no forced stereo spread.
  if(drums||bass)tr.pan=0;
 }
 // PEAK alone is an export safety net, not a full mastering chain.
 const enabled=(project.mastering?.inserts||[]).filter(x=>x&&project.mastering?.[x]?.enabled);
 if(enabled.length<=1){
  const profile=demoMasteringSettings(style);
  if(profile){
   // Production profiles are subdued: no loudness maximisation or added gain
   // until a true rendered waveform has passed loudness/true-peak QA.
   if(profile.circuitcolor)Object.assign(profile.circuitcolor,{drive:0,mix:0,enabled:false});
   if(profile.press)Object.assign(profile.press,{makeup:0,ratio:Math.min(1.6,profile.press.ratio)});
   if(profile.peak)Object.assign(profile.peak,{drive:0,ceiling:-1.5});
   project.mastering=profile;
  }
 }
 project.factoryProductionRevision=1;
 return project;
}
// The earlier three factory styles were expanded by copying 4-bar reference
// phrases. Refine expression by section while preserving melody and harmony.
export function articulateLegacyFactorySong(project,id){
 if(!['nocturne','soleil','brume'].includes(id)||!project?.fullSong)return project;
 for(const [role,tr] of project.tracks.entries()){
  if(tr.type==='audio')continue;
  for(const clip of tr.clips){
   const section=project.sections.find(s=>clip.start>=s.start&&clip.start<s.start+s.length);
   if(!section)continue;
   const hook=section.name.startsWith('REFRAIN'),outro=section.name==='OUTRO';
   const turn=(Math.floor(clip.start/4)+role)%4;
   if(Array.isArray(clip.notes)){
    clip.notes=clip.notes.map((note,i)=>{
     const dynamic=hook?1.06:outro?.77:section.name==='PRÉ-REFRAIN'?1.01:.89;
     const phrase=(i+turn)%5===0?.93:(i+turn)%5===3?1.06:1;
     return {...note,velocity:Math.max(.12,Math.min(.95,Number((note.velocity*dynamic*phrase).toFixed(4))))};
    });
    if(role>=3&&section.name==='BREAK')clip.notes=clip.notes.filter((_,i)=>i%5!==3);
   }
   if(clip.pattern){
    for(const [voice,row] of Object.entries(clip.pattern)){
     if(!Array.isArray(row))continue;
     clip.pattern[voice]=row.map((v,i)=>v?Number(Math.min(1,v*((i+turn)%8===0?1.08:(i+turn)%4===0?.96:.86)).toFixed(4)):0);
    }
   }
  }
 }
 return project;
}
