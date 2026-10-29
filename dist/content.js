import {createFactoryArrangement,FACTORY_STYLES} from './factory-arrangements.js?v=0.14.0';
import {INSTRUMENTS,EFFECTS,DRUM_VOICES,ensurePlugins} from './plugins.js?v=0.14.0';
import {FACTORY_PRESETS,applyFactoryPreset} from './bundle.js?v=0.14.0';
const id=()=>Math.random().toString(36).slice(2,11),copy=value=>JSON.parse(JSON.stringify(value));
const pattern=hits=>Object.fromEntries(Object.keys(DRUM_VOICES).map(voice=>[voice,Array.from({length:16},(_,s)=>(hits[voice]||[]).includes(s)?1:0)]));
const even=[0,2,4,6,8,10,12,14],all=Array.from({length:16},(_,i)=>i);
export const DRUM_GROOVES=[
  {id:'trap-night',name:'Trap Night',style:'Trap',bpm:138,pattern:pattern({kick:[0,6,10],clap:[4,12],hat:[...even,7,15],open:[14],rim:[11]})},
  {id:'trap-bounce',name:'Trap Bounce',style:'Trap',bpm:144,pattern:pattern({kick:[0,3,7,10,14],clap:[4,12],hat:[...even,5,7,13,15],open:[6],perc:[11]})},
  {id:'drill-shadow',name:'Drill Shadow',style:'Drill',bpm:142,pattern:pattern({kick:[0,5,11,14],clap:[8],hat:[0,3,6,8,11,14,15],open:[10],rim:[7,15],tom:[13]})},
  {id:'afro-pulse',name:'Afro Pulse',style:'Afro',bpm:108,pattern:pattern({kick:[0,6,10],clap:[4,12],hat:[2,6,10,14],rim:[3,7,11,15],shaker:all,perc:[2,5,9,14]})},
  {id:'afro-sun',name:'Afro Sun',style:'Afro',bpm:112,pattern:pattern({kick:[0,3,8,10],clap:[4,12],hat:even,open:[6,14],rim:[7,15],tom:[5,13],shaker:[1,3,5,7,9,11,13,15],perc:[2,10]})},
  {id:'boom-dust',name:'Boom Dust',style:'Hip-hop',bpm:92,pattern:pattern({kick:[0,5,10],clap:[4,12],hat:even,rim:[15]})},
  {id:'rnb-pocket',name:'R&B Pocket',style:'R&B',bpm:84,pattern:pattern({kick:[0,7,10],clap:[4,12],hat:[0,3,6,8,11,14],open:[15],rim:[6]})},
  {id:'house-room',name:'House Room',style:'House',bpm:124,pattern:pattern({kick:[0,4,8,12],clap:[4,12],hat:[2,6,10,14],open:[6,14],shaker:[1,3,5,7,9,11,13,15]})},
  {id:'piano-dusk',name:'Piano Dusk',style:'Amapiano',bpm:112,pattern:pattern({kick:[0,6,8],clap:[4,12],hat:even,tom:[3,7,10,14],shaker:all,perc:[5,13]})},
  {id:'percussion-circle',name:'Percussion Circle',style:'Percussions',bpm:106,pattern:pattern({kick:[0,8],rim:[3,6,11,14],tom:[2,10],shaker:even,perc:[1,5,9,13]})},
  {id:'ambient-pulse',name:'Ambient Pulse',style:'Ambient',bpm:90,pattern:pattern({kick:[0],hat:[4,10],rim:[8],perc:[14]})},
  {id:'double-time',name:'Double Time',style:'Trap',bpm:150,pattern:pattern({kick:[0,6,10,15],clap:[4,12],hat:all,open:[14],tom:[13],perc:[7]})}
];
export const PHRASES={
  bass:[{step:0,midi:33,len:5},{step:6,midi:33,len:2},{step:10,midi:40,len:3},{step:14,midi:36,len:2},{step:16,midi:29,len:6},{step:24,midi:29,len:3},{step:28,midi:31,len:4}],
  keys:[57,60,64,67].map(midi=>({step:0,midi,len:14})).concat([53,57,60,64].map(midi=>({step:16,midi,len:14}))),
  pad:[57,60,64].map(midi=>({step:0,midi,len:15})).concat([53,57,60].map(midi=>({step:16,midi,len:15}))),
  lead:[69,72,76,74,72,69,67,69].map((midi,i)=>({step:[0,4,7,12,16,20,24,28][i],midi,len:i===7?4:2})),
  pluck:[69,72,76,79,76,65,69,72,76,72].map((midi,i)=>({step:[0,3,6,8,12,16,19,22,24,28][i],midi,len:2}))
};
PHRASES.exo=PHRASES.keys.map(n=>({...n}));
for(const [type,def] of Object.entries(INSTRUMENTS))if(def.sampled)PHRASES[type]=PHRASES[['violin','cello'].includes(type)?'pad':['flute','trumpet'].includes(type)?'lead':['harp','marimba','vibes','kalimba','strum'].includes(type)?'pluck':'keys'].map(n=>({...n}));
export const SESSION_TEMPLATES=[
  {id:'nocturne',name:'Nocturne Trap',style:'Trap mélodique',bpm:138,swing:0,groove:'trap-night',description:'Trap half-time : 808 syncopée, cloches EXO, piano feutré et progression en Fa♯ mineur.'},
  {id:'soleil',name:'Soleil Afro',style:'Afro mélodique',bpm:108,swing:0,groove:'afro-pulse',description:'Afro mélodique : strumstick en contretemps, marimba, kalimba et percussions entrelacées en Ré majeur.'},
  {id:'brume',name:'Brume R&B',style:'R&B / soul',bpm:84,swing:28,groove:'rnb-pocket',description:'R&B / neo soul : clavier FM enregistré, accords de neuvième, basse ronde et batterie souple en Do mineur.'}
];
export function createContentTrack(type,presetIndex=0){
  const def=INSTRUMENTS[type];if(!def)throw new Error('Instrument inconnu.');
  const track={id:id(),name:def.name+(type==='bass'?' · 808':''),type,color:def.color,volume:({exo:-8,drums:-8,bass:-12,keys:-17,pad:-22,lead:-20,pluck:-18})[type]??-8,pan:0,mute:false,solo:false,clips:[]};
  ensurePlugins(track);applyFactoryPreset(track,'instrument',presetIndex);return track;
}
export function createContentClip(type,name,start=0,length=2,grooveId='trap-night'){
  const clip={id:id(),name,start,length};
  if(type==='drums')clip.pattern=copy((DRUM_GROOVES.find(g=>g.id===grooveId)||DRUM_GROOVES[0]).pattern);else clip.notes=copy(PHRASES[type]||[]);
  return clip;
}
export function createFactorySession(templateId='nocturne'){
  const template=SESSION_TEMPLATES.find(t=>t.id===templateId);if(!template)throw new Error('Session inconnue.');
  const project=createFactoryArrangement(template,createContentTrack);project.tracks.forEach(ensurePlugins);return project;
}

export {FACTORY_STYLES};
export function contentCounts(){return {instruments:Object.keys(INSTRUMENTS).length,effects:Object.keys(EFFECTS).length,presets:Object.values(FACTORY_PRESETS).reduce((total,list)=>total+list.length,0),grooves:DRUM_GROOVES.length,drums:Object.keys(DRUM_VOICES).length,sessions:SESSION_TEMPLATES.length};}
