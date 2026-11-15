// Three original vocal recording/mixing sessions built entirely with WarLike DSP.
// Vocal audio is intentionally absent: these are ready-to-record vocal templates,
// not synthetic speech or a falsely claimed prerecorded performance.
import {createFactorySession} from './content.js';
import {applyNativeChain} from './native-vocal-chains.js';

export const VOCAL_DEMOS=Object.freeze({
  'vox-trap':{
    template:'nocturne',name:'WARLIKE · Trap VOX Mix',label:'Trap VOX',
    vocals:[
      {name:'LEAD · TRAP VOX',volume:-5,pan:0,chain:'modern',color:'#e29baf'},
      {name:'DOUBLES · TRAP',volume:-11,pan:-.28,chain:'tracking',color:'#8db4d6'},
      {name:'ADLIBS · TRAP',volume:-14,pan:.34,chain:'creative',color:'#c1a2e9'}
    ]
  },
  'vox-afro':{
    template:'soleil',name:'WARLIKE · Afro VOX Mix',label:'Afro VOX',
    vocals:[
      {name:'LEAD · AFRO VOX',volume:-5,pan:0,chain:'modern',color:'#e4b678'},
      {name:'HARMONIES · AFRO',volume:-10,pan:-.26,chain:'tracking',color:'#81c5b6'},
      {name:'RÉPONSES · AFRO',volume:-12,pan:.32,chain:'creative',color:'#c0a4df'}
    ]
  },
  'vox-rnb':{
    template:'brume',name:'WARLIKE · R&B VOX Mix',label:'R&B VOX',
    vocals:[
      {name:'LEAD · R&B SOUL',volume:-5,pan:0,chain:'modern',color:'#d68ca9'},
      {name:'HARMONIES · R&B',volume:-10,pan:-.3,chain:'tracking',color:'#91b1dc'},
      {name:'ADLIBS · R&B',volume:-14,pan:.32,chain:'creative',color:'#b8a2d2'}
    ]
  }
});
export function createVocalDemoSession(kind){
 const definition=VOCAL_DEMOS[kind];
 if(!definition)throw Error('Démo vocale inconnue.');
 const project=createFactorySession(definition.template);
 project.name=definition.name;
 project.demoRevision=4;
 project.vocalDemo=true;
 project.vocalDemoKind=kind;
 const voices=project.tracks.filter(track=>track.type==='audio');
 if(voices.length!==definition.vocals.length)throw Error('Nombre de pistes vocales inattendu.');
 voices.forEach((track,index)=>{
   const preset=definition.vocals[index];
   track.name=preset.name;
   track.volume=preset.volume;
   track.pan=preset.pan;
   track.color=preset.color;
   track.recordArm=false;
   track.recordInput=String(index===1?2:1);
   track.clips=[];
   // Inserts are native processor instances with real, editable DSP parameters.
   applyNativeChain(track,preset.chain,{replace:true});
 });
 project.vocalDemoInfo={
   title:definition.label,
   instructions:'Enregistre ta voix sur LEAD, puis les doubles/harmonies et les adlibs. Chaque piste possède un mix WarLike natif prêt à modifier.',
   hasRecordedVoice:false,
   pluginMix:true
 };
 return project;
}
