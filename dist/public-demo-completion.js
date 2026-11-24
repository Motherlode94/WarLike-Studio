// Completion of previously instrumental-only public demos with original,
// clearly labelled synthetic formant-vowel performances.
import {createContentTrack} from './content.js';
import {applyNativeChain} from './native-vocal-chains.js';

const uid=()=>globalThis.crypto?.randomUUID?.().replaceAll('-','')||Math.random().toString(36).slice(2,12);
const roles=[
 {role:'lead',name:'DEMO LEAD · VOIX SYNTHÉTIQUE',volume:-18,pan:0,vowel:1,
  chain:[{id:'voxclean',params:{highpass:90,range:4}},{id:'voxlevel',params:{ratio:2.4,levelThreshold:-24,mix:.8}},{id:'sibil',params:{threshold:-24}}]},
 {role:'backs',name:'DEMO HARMONIES · VOIX SYNTHÉTIQUE',volume:-25,pan:-.22,vowel:2,
  chain:[{id:'voxclean',params:{highpass:120,range:3}},{id:'voxlevel',params:{ratio:2,levelThreshold:-23,mix:.7}},{id:'voxdoubler',params:{mix:.17}}]},
 {role:'adlibs',name:'DEMO RÉPONSES · VOIX SYNTHÉTIQUE',volume:-27,pan:.24,vowel:3,
  chain:[{id:'voxclean',params:{highpass:145,range:3}},{id:'alterecho',params:{mix:.18,feedback:.22}}]}
];
const hasVoiceSection=(role,name)=>{
 const section=String(name).toUpperCase();
 if(/INTRO|OUTRO|BREAK|MONTÉE/.test(section))return false;
 return role==='backs'?/REFRAIN/.test(section):/COUPLET|REFRAIN/.test(section);
};
function pitchesFor(project,section){
 const numbers=(project.tracks||[]).filter(t=>!['drums','bass','audio','bus','wlvox'].includes(t.type))
  .flatMap(t=>(t.clips||[]).filter(c=>c.notes?.length&&c.start<section.start+section.length&&c.start+c.length>section.start))
  .flatMap(c=>c.notes.slice(0,8).map(n=>n.midi))).filter(Number.isFinite);
 return numbers.length?numbers:[60,63,67,70];
}
export function completePublicDemoVocals(project){
 if(!project?.publicDemo||!['drill','trap808','trap-air','funk'].includes(project.demoGenre))return project;
 if(project.demoCompletedVocals===1)return project;
 if(!Number.isInteger(project.bars)||project.bars<16||!Array.isArray(project.sections))throw Error('Arrangement musical de démo invalide.');
 if(project.tracks.some(t=>t.type==='wlvox'&&t.clips?.length))return project;
 const created=roles.map(role=>{
  const track=createContentTrack('wlvox');
  track.name=role.name;track.volume=role.volume;track.pan=role.pan;
  Object.assign(track.instrument,{vowel:role.vowel,attack:.075,release:.27,vibrato:.18,output:-18});
  applyNativeChain(track,role.chain,{replace:true});
  for(const section of project.sections){
   if(!hasVoiceSection(role.role,section.name))continue;
   const melody=pitchesFor(project,section);
   for(let start=section.start;start<section.start+section.length;start+=4){
    const length=Math.min(4,section.start+section.length-start),notes=[];
    for(let bar=0;bar<length;bar++){
     const offsets=role.role==='lead'?[0,5,10]:role.role==='backs'?[0,8]:[3,12];
     for(let i=0;i<offsets.length;i++){
      const source=melody[(bar*2+i+(role.role==='backs'?1:0))%melody.length];
      const midi=Math.max(52,Math.min(82,source+12*Math.round((67-source)/12)+(role.role==='backs'?-5:0)));
      const step=bar*16+offsets[i];
      const len=Math.min(role.role==='backs'?6.5:3.8,length*16-step);
      if(len>0)notes.push({id:uid(),step,midi,len,velocity:role.role==='lead'?.38:role.role==='backs'?.24:.26});
     }
    }
    if(notes.length)track.clips.push({id:uid(),name:section.name+' · '+role.name,start,length,patternSteps:length*16,
     notes,description:'Voix vocalique synthétique originale WarLike, pas une prise humaine.'});
   }
  }
  return track;
 });
 if(created.some(t=>!t.clips.length))throw Error('Démo incomplète : voix manquantes.');
 project.tracks.push(...created);
 project.demoCompletedVocals=1;
 project.demoVocalType='synthetic-formant';
 return project;
}
