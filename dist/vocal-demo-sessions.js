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

// Distinct processor orders and sound targets for each genre. Every processor
// is a real, editable native WarLike effect (never a cosmetic preset label).
const GENRE_VOCAL_CHAINS={
 'vox-trap':[
  [{id:'voxtune',params:{speed:5,amount:1}},{id:'vectoreq',params:{g1:-3,g4:2.5,g5:1.8}},{id:'vectorcomp',params:{threshold:-26,ratio:5,attack:5,release:80}},{id:'sibil',params:{threshold:-28}},{id:'alterecho',params:{mix:.12,feedback:.32}}],
  [{id:'voxclean',params:{highpass:105,range:6}},{id:'vectorcomp',params:{threshold:-23,ratio:4,attack:8,release:95}},{id:'alterdouble',params:{mix:.16,depth:1.7}}],
  [{id:'vectoreq',params:{g1:-4,g4:3}},{id:'circuitcolor',params:{drive:9,mix:.38}},{id:'alterecho',params:{mix:.34,feedback:.48}},{id:'exospace',params:{mix:.08}}]
 ],
 'vox-afro':[
  [{id:'voxclean',params:{highpass:75,range:3}},{id:'vectoreq',params:{g2:-1,g4:1.3,g5:1.8}},{id:'voxlevel',params:{ratio:2.4,levelThreshold:-22,mix:.88}},{id:'sibil',params:{threshold:-23}},{id:'exospace',params:{mix:.2}}],
  [{id:'vectoreq',params:{g1:-2,g4:.7}},{id:'voxlevel',params:{ratio:2,levelThreshold:-20}},{id:'alterdouble',params:{mix:.23,depth:2.1}},{id:'exospace',params:{mix:.24}}],
  [{id:'voxclean',params:{highpass:120,range:5}},{id:'vectorcomp',params:{threshold:-20,ratio:2.5}},{id:'alterecho',params:{mix:.18,feedback:.22}}]
 ],
 'vox-rnb':[
  [{id:'circuiteq',params:{body:1.7,presence:.4,air:1.2}},{id:'circuitbus',params:{threshold:-18,ratio:2,attack:32,release:240}},{id:'sibil',params:{threshold:-23}},{id:'exospace',params:{mix:.28}}],
  [{id:'circuiteq',params:{body:.5,presence:1.1,air:1.4}},{id:'voxlevel',params:{ratio:2.1,levelThreshold:-22}},{id:'alterdouble',params:{mix:.32,depth:2.6}},{id:'exospace',params:{mix:.34}}],
  [{id:'vectoreq',params:{g1:-2,g5:2}},{id:'vectorcomp',params:{threshold:-19,ratio:2.2,attack:25,release:200}},{id:'alterecho',params:{mix:.1,feedback:.18}},{id:'exospace',params:{mix:.37}}]
 ]
};

export function createVocalDemoSession(kind){
 const definition=VOCAL_DEMOS[kind];
 if(!definition)throw Error('Démo vocale inconnue.');
 const project=createFactorySession(definition.template);
 project.name=definition.name;
 project.demoRevision=5;
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
   applyNativeChain(track,GENRE_VOCAL_CHAINS[kind][index],{replace:true});
 });
 project.vocalDemoInfo={
   title:definition.label,
   instructions:'Enregistre ta voix sur LEAD, puis les doubles/harmonies et les adlibs. Chaque piste possède un mix WarLike natif prêt à modifier.',
   hasRecordedVoice:false,
   pluginMix:true,
   sonicIdentity:{'vox-trap':'rap sec, syncopes serrées, correction rapide et écho court','vox-afro':'chant rebondissant, réponse mélodique et espace chaleureux','vox-rnb':'chant legato, harmonies longues et réverbération ample'}[kind]
 };
 return project;
}
