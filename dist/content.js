import {INSTRUMENTS,EFFECTS,DRUM_VOICES,ensurePlugins} from './plugins.js?v=0.11.1';
import {FACTORY_PRESETS,applyFactoryPreset} from './bundle.js?v=0.11.1';
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
export const SESSION_TEMPLATES=[
  {id:'nocturne',name:'Nocturne Trap',style:'Trap mélodique',bpm:138,swing:0,groove:'trap-night',description:'Intro atmosphérique, couplet et refrain. 808, accords, pluck, nappe et mélodie.'},
  {id:'soleil',name:'Soleil Afro',style:'Afro mélodique',bpm:108,swing:16,groove:'afro-pulse',description:'Percussions syncopées, basse ronde, touches courtes et son pincé lumineux.'},
  {id:'brume',name:'Brume R&B',style:'R&B / soul',bpm:84,swing:28,groove:'rnb-pocket',description:'Batterie espacée, accords doux, nappe lente et mélodie feutrée.'}
];
export function createContentTrack(type,presetIndex=0){
  const def=INSTRUMENTS[type];if(!def)throw new Error('Instrument inconnu.');
  const track={id:id(),name:def.name+(type==='bass'?' · 808':''),type,color:def.color,volume:({drums:-8,bass:-12,keys:-17,pad:-22,lead:-20,pluck:-18})[type],pan:0,mute:false,solo:false,clips:[]};
  ensurePlugins(track);applyFactoryPreset(track,'instrument',presetIndex);return track;
}
export function createContentClip(type,name,start=0,length=2,grooveId='trap-night'){
  const clip={id:id(),name,start,length};
  if(type==='drums')clip.pattern=copy((DRUM_GROOVES.find(g=>g.id===grooveId)||DRUM_GROOVES[0]).pattern);else clip.notes=copy(PHRASES[type]||[]);
  return clip;
}
export function createFactorySession(templateId='nocturne'){
  const template=SESSION_TEMPLATES.find(t=>t.id===templateId);if(!template)throw new Error('Session inconnue.');
  const indices=templateId==='soleil'?{drums:3,bass:3,keys:2,pad:2,lead:1,pluck:2}:templateId==='brume'?{drums:1,bass:0,keys:4,pad:1,lead:1,pluck:1}:{drums:0,bass:1,keys:0,pad:0,lead:0,pluck:0};
  const tracks=['drums','bass','keys','pad','lead','pluck'].map(type=>createContentTrack(type,indices[type]));
  for(const track of tracks){
    track.inserts=['color','sculpt','prism','echo','aura'];for(const key of track.inserts)track.effects[key].enabled=true;
    const starts=track.type==='drums'||track.type==='keys'?[0,4,8,12]:track.type==='bass'?[4,8,12]:track.type==='pad'?[0,12]:track.type==='lead'?[8,12]:[4,12];
    for(const start of starts){const section=start===0?'INTRO':start===12?'REFRAIN':'COUPLET',groove=track.type==='drums'&&start===0?'ambient-pulse':track.type==='drums'&&start===12&&templateId==='nocturne'?'double-time':template.groove;const c=createContentClip(track.type,section+' / '+INSTRUMENTS[track.type].name,start,4,groove);
      if(templateId==='soleil'&&track.type==='keys')c.notes.forEach(n=>n.len=3);
      if(track.type==='lead'&&templateId==='brume')c.notes=c.notes.filter((_,i)=>i%2===0);
      track.clips.push(c);
    }
    if(['keys','pad','pluck','lead'].includes(track.type)){track.effects.aura.mix=track.type==='pad'?.28:.12;track.effects.echo.mix=['pluck','lead'].includes(track.type)?.16:.06;}
    if(track.type==='bass')track.effects.prism.high=-4;
  }
  for(const [name,volume,color] of [['LEAD VOX',-3,'#ca909a'],['BACKS',-7,'#8fa7c4'],['ADLIBS',-9,'#b1a584']]){const track={id:id(),name,type:'audio',color,volume,pan:0,mute:false,solo:false,clips:[]};ensurePlugins(track);tracks.push(track);}
  return {version:1,demo:true,name:template.name,bpm:template.bpm,bars:16,swing:template.swing,masterVolume:-4,recording:{gainDb:0,autoLevel:true},sections:[{name:'INTRO',start:0,length:4},{name:'COUPLET A',start:4,length:4},{name:'COUPLET B',start:8,length:4},{name:'REFRAIN',start:12,length:4}],tracks};
}
export function contentCounts(){return {instruments:Object.keys(INSTRUMENTS).length,effects:Object.keys(EFFECTS).length,presets:Object.values(FACTORY_PRESETS).reduce((total,list)=>total+list.length,0),grooves:DRUM_GROOVES.length,drums:Object.keys(DRUM_VOICES).length,sessions:SESSION_TEMPLATES.length};}
