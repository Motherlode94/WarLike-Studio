// Four arrangements with explicit musical direction. Shared code assembles clips;
// no shared chord progression, chord-index melody or transposed genre template.
import {createContentTrack} from './content.js';
import {DRUM_VOICES,placeInsert} from './plugins.js';
import {masteringSettings} from './mastering.js';
const uid=()=>Math.random().toString(36).slice(2,12);
const styles={
 drill:{label:'Drill',name:'WARLIKE · Drill nocturne',bpm:142,swing:0,keyName:'Fa mineur',key:5,scale:'minor',
  description:'Départ de piano conservé, harmonies et espace enrichis, ostinato et 808 glissée.',
  palette:[
   ['drums','DRILL · SNARE DÉCALÉE',-10,{kit:0,punch:.8,decay:.13,hat:.4}],
   ['bass','808 · SLIDES',-8,{body:.88,harmonics:.4,release:.035}],
   ['violin','VIOLON · OSTINATO DRILL',-11,{attack:.012,release:.07,brightness:5200,dynamics:.85,output:0}],
   ['piano','PIANO · TENSION',-11,{release:.24,brightness:2600}],
   ['cello','CELLO · DRONE FA',-23,{attack:.08,release:.2,brightness:2100,dynamics:.7,width:.3,output:0}],
   ['drums','HI-HAT · DRILL ROLLS',-15,{kit:0,punch:.5,decay:.1,hat:.32}]
  ]},
 trap808:{label:'Trap Atlanta · sombre',name:'WARLIKE · Atlanta After Dark',bpm:140,swing:0,keyName:'Do mineur',key:0,scale:'minor',
  description:'Piano mineur profond, texture discrète, 808 lourde et espace pour rapper.',
  palette:[
   ['drums','ATL · KICK / SNARE',-9,{kit:0,punch:.92,decay:.13,hat:.47}],
   ['bass','808 · ATL FOUNDATION',-8,{body:.97,harmonics:.34,release:.045}],
   ['piano','PIANO · AFTER DARK',-9,{brightness:4700,tone:-1.5,release:.7,dynamics:.85,width:.65}],
   ['wlrompler','TEXTURE · LOW LIGHT',-27,{wave:1,texture:0,layer:.32,cutoff:1500,attack:.5,release:1.1,space:.1,output:-8}],
   ['epiano','KEYS · DISTANT ANSWER',-20,{brightness:3100,release:.45,tone:-2,width:.75}],
   ['drums','HI-HAT · ATL TRIPLETS',-15,{kit:0,punch:.5,decay:.1,hat:.37}]
  ]},
 'trap-air':{label:'Trap Atlanta · aérienne',name:'WARLIKE · Atlanta Floating',bpm:146,swing:0,keyName:'Si mineur',key:11,scale:'minor',
  description:'Guitare mélodique, harmonies ouvertes, réponses de flûte et 808 souple.',
  palette:[
   ['drums','ATL · FLOATING POCKET',-10,{kit:0,punch:.86,decay:.12,hat:.42}],
   ['bass','808 · MELODIC LOW END',-9,{body:.9,harmonics:.27,release:.04}],
   ['wlnylon','GUITAR · FLOATING LOOP',-5,{brightness:6200,body:.78,attack:.007,decay:1.35,release:.12,drive:0,pickPosition:.25,damping:.12,output:2}],
   ['pad','PAD · OPEN HARMONIES',-24,{attack:.45,release:.8,width:9}],
   ['flute','FLUTE · ANSWERS',-19,{brightness:4800,attack:.02,release:.16,output:0}],
   ['drums','HI-HAT · AIR TRIPLETS',-16,{kit:0,punch:.5,decay:.1,hat:.34}]
  ]},
 funk:{label:'Funk brésilien',name:'WARLIKE · Baile Tamborzão',bpm:130,swing:0,keyName:'Fa mineur',key:5,scale:'minor',
  description:'Tamborzão à toms, congas et slaps secs, sub court et motif synthétique minimal.',
  palette:[
   ['drums','TAMBORZÃO · TOMS / CONGAS',-7,{kit:4,punch:.9,decay:.18,hat:.4}],
   ['bass','SUB · BAILE',-9,{body:.88,harmonics:.24,release:.03}],
   ['wlvirtual','STAB · BAILE HOOK',-12,{detune:0,cutoff:2500,resonance:1.5,attack:.003,release:.055,pulse:.5,width:.1,output:0}],
   ['drums','CONGAS · BREQUES',-12,{kit:4,punch:.6,decay:.14,hat:.4}]
  ]}
};
export const BEAT_DEMOS=Object.freeze(Object.fromEntries(Object.entries(styles).map(([id,x])=>[id,Object.freeze({label:x.label,name:x.name,bpm:x.bpm,description:x.description})])));
const rows=()=>Object.fromEntries(Object.keys(DRUM_VOICES).map(v=>[v,Array(64).fill(0)]));
const hit=(p,voice,bar,events)=>events.forEach(([step,velocity])=>{p[voice][bar*16+step]=velocity;});
function phrase(out,offset,events,gain=1){for(const [step,midi,len,velocity=.7,slide] of events){const n={id:uid(),step:offset+step,midi,len,velocity:velocity*gain};if(slide)n.slide=slide;out.push(n);}}

// F-minor ostinato and a four-bar sub conversation with late octave/fifth slides.
const drillString=[
 [0,77,1.4,.7],[3,72,.8,.45],[6,73,.7,.6],[7.5,72,.45,.4],[10,68,1.7,.56],
 [16,77,1,.65],[19,72,.7,.43],[22,73,1,.6],[26,72,1.3,.5],[30,65,1,.48]
];
const drillSub=[
 [[0,29,2.2,.9],[5,29,1.4,.82],[7,29,2.1,.9,12],[11,41,1.1,.7],[14,36,1.3,.8,-7]],
 [[0,29,3.8,.86,12],[6,41,1.3,.75],[10,27,2,.85],[13,29,1.2,.8],[15,32,.5,.72]],
 [[0,25,2.6,.9],[4,25,2.1,.85,12],[8,37,1.7,.75],[11,36,1.3,.8,-7],[14,29,1.4,.87]],
 [[0,29,4.6,.88,-2],[6,27,1.4,.8],[9,29,2.1,.9,12],[13,36,2.4,.82,-7]]
];
function drillPart(role,section){
 const out=[],intro=section===0,bridge=section===2;
 if(role===1)for(let b=0;b<4;b++)phrase(out,b*16,bridge?drillSub[b].filter((_,i)=>i===0||i===drillSub[b].length-1):drillSub[b],intro?.82:1);
 if(role===2){phrase(out,0,drillString,bridge?.6:1);phrase(out,32,drillString,bridge?.6:1);if(section===3)phrase(out,0,[[15,80,.5,.42],[47,80,.5,.45]]);}
 if(role===3)phrase(out,0,bridge?[[0,53,7,.52],[0,60,7,.35],[32,49,6,.5],[32,60,6,.3]]:
  [[0,53,3,.46],[.04,60,2.8,.35],[23,54,1.5,.32],[32,49,3,.45],[32.04,60,2.8,.3],[55,60,1.5,.35]]);
 if(role===4)phrase(out,0,[[0,41,14,.35],[32,41,14,.35]],bridge?1.4:1);
 if(role===3){
  const depth=[
   [16,56,6,.24],[16.04,63,5.8,.2],[27,68,1.3,.3],[29,67,1,.24],
   [32.08,56,6,.25],[32.12,65,5.8,.23],[43,72,1.5,.3],[46,68,1,.25],
   [48,55,5,.22],[48.04,58,4.8,.2],[48.08,64,4.7,.19],[59,67,1.2,.28],[61,65,1.5,.3]
  ];
  // Extra voicings answer the existing piano in its gaps, never replace it.
  phrase(out,0,depth,section===3?1.2:1);
  if(!intro)phrase(out,0,[[.08,56,6,.25],[.12,63,5.8,.22],[.16,67,5.6,.18],[12,68,1.2,.28],[14,67,1.2,.24]]);
 }
 return out;
}
function drillDrums(section,rolls){
 const p=rows(),intro=section===0,bridge=section===2;
 for(let b=0;b<4;b++){
  if(rolls){hit(p,'hat',b,b%2?[[3,.32],[4,.22],[5,.3],[14,.35],[15,.3]]:[[6,.28],[7,.35],[14,.32],[15,.24]]);continue;}
  hit(p,'kick',b,bridge?[[0,.82]]:b%2?[[0,.96],[6,.7],[9,.84],[14,.7]]:[[0,.96],[5,.72],[11,.85]]);
  // Delayed snare on alternating bars gives the lurch; not the trap backbeat.
  hit(p,'clap',b,b%2?[[10,.86]]:[[8,.88]]);
  hit(p,'hat',b,(bridge?[0,3,6,11,14]:[0,3,6,8,11,14]).map((s,i)=>[s,i%2?.28:.44]));
  if(!intro){hit(p,'rim',b,[[7,.24],[15,.18]]);hit(p,'open',b,[[12,.24]]);}
 }
 return p;
}

// Two original Atlanta directions. Piano and guitar each own a four-bar phrase.
const darkPiano=[
 [0,48,10,.55],[.04,63,7,.55],[.08,67,6.8,.49],[.12,70,6.6,.43],[.16,74,6.4,.37],
 [8,72,2.7,.58],[11,70,2.3,.46],[14,67,1.6,.5],
 [16,48,10,.48],[16.04,62,7,.42],[16.08,63,6.8,.5],[16.12,67,6.6,.45],
 [24,75,2.7,.58],[28,74,1.7,.44],[30,72,1.6,.52],
 [32,44,11,.55],[32.04,60,7,.5],[32.08,63,6.8,.48],[32.12,67,6.6,.44],
 [40,70,3,.54],[44,67,2.2,.45],[47,63,.8,.48],
 [48,43,10,.5],[48.04,59,7,.45],[48.08,62,6.8,.46],[48.12,65,6.6,.43],
 [56,74,2.8,.55],[59,72,2.3,.48],[62,71,1.5,.42]
];
const darkBass=[
 [[0,24,5.8,.94],[7,24,2.4,.88],[11,24,2,.87],[14,36,1.25,.78]],
 [[0,24,6,.94],[8,24,3,.87],[12,31,1.1,.8],[14,24,1.25,.87]],
 [[0,32,5.2,.94],[6,32,3,.85],[10,32,2.3,.88],[13,39,1,.77],[15,32,.45,.72]],
 [[0,31,6.5,.94],[8,31,3,.86],[12,31,1,.8],[14,24,1.25,.88]]
];
const airyGuitar=[
 [0,54,2.8,.62],[.035,59,2.7,.64],[.07,62,2.6,.58],[2,66,1.6,.6],[4,73,2.5,.72],[7,69,1.8,.58],[10,66,1.6,.63],[12,62,1.5,.55],[14,66,1.7,.6],
 [16,55,2.8,.6],[16.035,59,2.7,.64],[16.07,62,2.6,.57],[18,66,1.6,.58],[20,71,2.4,.7],[23,69,1.6,.57],[26,66,1.8,.63],[29,62,2,.58],
 [32,54,2.8,.6],[32.035,57,2.7,.62],[32.07,61,2.6,.57],[34,64,1.7,.6],[36,69,2.4,.7],[39,71,1.7,.62],[42,73,2.2,.68],[45,66,2.4,.57],
 [48,57,2.8,.6],[48.035,61,2.7,.63],[48.07,64,2.6,.58],[50,71,2.3,.68],[54,67,1.8,.58],[57,64,1.6,.6],[60,66,1.5,.62],[62,69,1.7,.65]
];
const airyBass=[
 [[0,35,4,.85],[6,35,2.5,.77],[10,42,1.3,.7],[12,35,2,.8],[15,35,.45,.65]],
 [[0,31,4.8,.87],[6,31,2,.78],[9,38,1.4,.71],[12,31,2.3,.8]],
 [[0,38,4,.85],[6,38,2.4,.77],[10,45,1.3,.7],[12,38,2,.8],[15,38,.45,.64]],
 [[0,33,5.1,.86],[7,33,2,.78],[10,40,1.4,.7],[13,33,2.1,.8]]
];
function atlantaPart(airy,role,section){
 const out=[],bridge=section===2,intro=section===0;
 if(role===1)for(let b=0;b<4;b++)phrase(out,b*16,bridge?(airy?airyBass:darkBass)[b].slice(0,1):(airy?airyBass:darkBass)[b],intro?.8:1);
 if(role===2)phrase(out,0,airy?airyGuitar:darkPiano,bridge?.82:1);
 if(role===3&&(!intro||airy)){
  const chords=airy?[[59,62,66,73],[55,59,62,69],[54,57,61,64],[57,61,64,71]]:[[48,55,58],[48,55,58],[44,51,55],[43,50,53]];
  for(let b=0;b<4;b++)phrase(out,b*16,chords[b].map(m=>[0,m,14.8,airy?.28:.19]));
 }
 if(role===4&&!intro){
  const answer=airy?[[13,74,2,.45],[29,73,2.2,.43],[45,71,2,.45],[61,69,2.2,.4]]:
   [[15,79,.7,.32],[31,77,.7,.29],[47,75,.7,.3],[63,74,.7,.28]];
  phrase(out,0,answer,section===3?1:.65);
 }
 return out;
}
function atlantaDrums(airy,section,phase){
 const p=rows(),bridge=section===2,intro=section===0;
 for(let b=0;b<4;b++){
  if(phase){
   if(b%2===1||section===3)hit(p,'hat',b,(phase<.5?[13,15]:[12,14]).map((s,i)=>[s,i?.3:.38]));
   continue;
  }
  hit(p,'kick',b,bridge?[[0,.86]]:airy?(b%2?[[0,.9],[6,.72],[12,.79]]:[[0,.94],[6,.72],[10,.8]]):
   b%2?[[0,.98],[7,.8],[12,.86]]:[[0,.98],[6,.82],[11,.86]]);
  if(!intro||b>=2)hit(p,'clap',b,[[8,airy?.78:.9]]);
  const hats=intro?[0,4,8,12]:bridge?[2,6,10,14]:[0,2,4,6,8,10,12,14];
  hit(p,'hat',b,hats.map((s,i)=>[s,i%2?(airy?.2:.25):(airy?.3:.4)]));
  if(!intro&&!bridge)hit(p,'open',b,[[airy?14:6,airy?.2:.3]]);
 }
 return p;
}
// Tamborzao core: kick/tom -> two high slaps -> low tom -> open low conga.
// Original variation informed by Caceres/Ferrari/Palombini (2014), figs. 5-7.
function baileDrums(section,fills){
 const p=rows();
 for(let b=0;b<4;b++){
  if(fills){if(b%2===1){hit(p,'clap',b,[[10,.4],[11,.55]]);hit(p,'perc',b,[[14,.62],[15,.45]]);}continue;}
  hit(p,'kick',b,[[0,.95],[6,.87]]);hit(p,'tom',b,[[0,.74],[8,.86]]);
  hit(p,'clap',b,[[3,.8],[6,.92]]);hit(p,'rim',b,[[12,.72]]);hit(p,'perc',b,[[12,.92]]);
  if(section!==0)hit(p,'shaker',b,[[2,.22],[7,.19],[10,.23],[15,.2]]);
  if(section===3)hit(p,'kick',b,[[10,.62]]);
  if(section===2&&b<2){p.kick.fill(0,b*16,b*16+16);p.tom[b*16]=0;}
 }
 return p;
}
function bailePart(role,section){
 const out=[];
 if(role===1)for(let b=0;b<4;b++)phrase(out,b*16,[[0,29,1.4,.84],[6,29,1,.78],[8,41,.65,.64],[12,29,1.3,.82]],section===2?.65:1);
 if(role===2)for(let b=0;b<4;b++)phrase(out,b*16,b%2?[[2,72,.6,.6],[6,68,.65,.65],[12,65,.8,.68]]:[[0,65,.7,.65],[3,68,.55,.57],[6,72,.7,.7],[12,68,.8,.6]],section===2?.65:1);
 return out;
}
const composers={drill:drillPart,trap808:(r,s)=>atlantaPart(false,r,s),'trap-air':(r,s)=>atlantaPart(true,r,s),funk:bailePart};
function demoEffects(track,style,role){
 const melodic=style==='drill'?role===3:style==='trap808'||style==='trap-air'?role===2||role===4:false;
 if(!melodic)return;
 placeInsert(track,0,'sculpt');Object.assign(track.effects.sculpt,{highpass:style==='drill'?90:140,cutoff:style==='trap-air'?8500:6500});
 placeInsert(track,1,'aura');track.effects.aura.mix=style==='drill'?.16:style==='trap-air'?.18:.22;
 placeInsert(track,2,'echo');Object.assign(track.effects.echo,{mix:style==='drill'?.07:style==='trap-air'?.1:.08,feedback:.2});
}
export function createBeatDemoSession(style){
 if(!Object.hasOwn(styles,style))throw Error('Démo musicale inconnue.');
 const x=styles[style],sections=['INTRO','COUPLET','BREAK','REFRAIN'].map((name,i)=>({name,start:i*4,length:4}));
 const tracks=x.palette.map(([type,name,volume,settings],role)=>{
  const t=createContentTrack(type,0);Object.assign(t,{name,volume,pan:role===3?-.24:role===4?.24:0});Object.assign(t.instrument,settings);
  demoEffects(t,style,role);
  for(let sec=0;sec<4;sec++){
   const atl=style==='trap808'||style==='trap-air',rolls=type==='drums'&&role===5;
   const phases=rolls?(atl?[1/3,2/3]:[.5]):[0];
   for(const phase of phases){
    const offset=phase/16;
    const clip={id:uid(),name:sections[sec].name+' · '+name,start:sec*4+offset,length:4-offset,patternSteps:64};
    if(type==='drums')clip.pattern=style==='drill'?drillDrums(sec,rolls):style==='funk'?baileDrums(sec,role===3):atlantaDrums(style==='trap-air',sec,phase);
    else clip.notes=composers[style](role,sec);
    if(type==='drums'||clip.notes.length)t.clips.push(clip);
   }
  }
  return t;
 });
 for(const [name,volume] of [['LEAD VOX (vide)',-5],['BACKS (vide)',-10],['ADLIBS (vide)',-13]]){
  const t=createContentTrack('keys');Object.assign(t,{name,type:'audio',volume,instrument:{},clips:[]});tracks.push(t);
 }
 return {version:1,demo:true,demoRevision:3,demoGenre:style,name:x.name,description:x.description,
  bpm:x.bpm,bars:16,swing:x.swing,pianoKey:x.key,pianoScale:x.scale,keyName:x.keyName,masterVolume:-9,
  mastering:masteringSettings({inserts:['peak'],bypass:false,peak:{enabled:true,drive:0,ceiling:-1.5,release:140}}),
  recording:{gainDb:0,autoLevel:true},sections,tracks};
}
