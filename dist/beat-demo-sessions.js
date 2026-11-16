// Three independently composed scores. Shared code only assembles editable clips;
// no shared chord progression, chord-index melody or transposed genre template.
import {createContentTrack} from './content.js';
import {DRUM_VOICES} from './plugins.js';
import {masteringSettings} from './mastering.js';
const uid=()=>Math.random().toString(36).slice(2,12);
const styles={
 drill:{label:'Drill',name:'WARLIKE · Drill nocturne',bpm:142,swing:0,keyName:'Fa mineur',key:5,scale:'minor',
  description:'Ostinato de cordes sombre, silences, caisse claire décalée et vrais glissés de 808.',
  palette:[
   ['drums','DRILL · SNARE DÉCALÉE',-10,{kit:0,punch:.8,decay:.13,hat:.4}],
   ['bass','808 · SLIDES',-8,{body:.88,harmonics:.4,release:.035}],
   ['violin','VIOLON · OSTINATO DRILL',-11,{attack:.012,release:.07,brightness:5200,dynamics:.85,output:0}],
   ['piano','PIANO · TENSION',-15,{release:.24,brightness:2600}],
   ['cello','CELLO · DRONE FA',-23,{attack:.08,release:.2,brightness:2100,dynamics:.7,width:.3,output:0}],
   ['drums','HI-HAT · DRILL ROLLS',-15,{kit:0,punch:.5,decay:.1,hat:.32}]
  ]},
 trap808:{label:'Trap 808',name:'WARLIKE · Trap 808 Pressure',bpm:150,swing:0,keyName:'Do♯ mineur',key:1,scale:'minor',
  description:'Boucle de cloches FM sur deux mesures, clap half-time régulier, 808 longue et fills serrés.',
  palette:[
   ['drums','TRAP · HALF-TIME CLAP',-10,{kit:0,punch:.82,decay:.14,hat:.52}],
   ['bass','808 · LONG SUB',-8,{body:.96,harmonics:.29,release:.05}],
   ['wlspectral','BELLS · TWO-BAR HOOK',-9,{fm:.75,harmonics:.18,motion:0,cutoff:6500,attack:.003,release:.33,width:.2,output:-2}],
   ['pad','HALO · ACCORDS TENUS',-24,{attack:.22,release:.5,width:9}],
   ['keys','VELVET · FIN DE PHRASE',-14,{attack:.009,release:.15,detune:0}],
   ['drums','HI-HAT · TRAP FILLS',-16,{kit:0,punch:.5,decay:.1,hat:.37}]
  ]},
 funk:{label:'Funk',name:'WARLIKE · Funk Pocket',bpm:110,swing:8,keyName:'Mi · funk/blues',key:4,scale:'chromatic',
  description:'Vamp de Mi9, riff de basse syncopé, guitare en doubles croches, ghost notes et réponses de clavier.',
  palette:[
   ['drums','FUNK · BACKBEAT & GHOSTS',-8,{kit:1,punch:.7,decay:.18,hat:.55}],
   ['wlvirtual','BASS · FUNK RIFF',-3,{detune:0,cutoff:850,resonance:.8,attack:.003,release:.035,pulse:.25,width:0,output:3}],
   ['keys','VELVET · E9 STABS',-8,{attack:.006,release:.09,detune:0}],
   ['wlmuted','GUITAR · SIXTEENTH CHANKS',-3,{brightness:7200,body:.55,pickPosition:.15,damping:.4,attack:.002,decay:.5,release:.04,drive:0,output:1}],
   ['wlclean','GUITAR · CALL & RESPONSE',-8,{brightness:6300,body:.6,pickPosition:.19,damping:.2,attack:.004,decay:.5,release:.06,drive:0,output:0}],
   ['pluck','CLAVI · PERCUSSIVE ANSWERS',-10,{decay:.09,brightness:5200,body:.4}]
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

// C#-minor FM bell hook. Its two-bar rhythm and intervals are authored directly,
// not obtained by indexing whatever chord happens to be under a shared melody.
const trapBells=[
 [0,85,1.8,.72],[3,80,1.1,.5],[6,88,2,.64],[10,83,1.3,.58],[14,80,1.1,.48],
 [18,85,1.3,.68],[20,83,1.2,.52],[23,80,2,.6],[28,88,1.4,.65],[30,87,1.2,.5]
];
const trapSub=[
 [[0,25,5.4,.92],[7,25,2.2,.85],[11,25,2.3,.89],[14,37,1.2,.78]],
 [[0,25,6.3,.9],[8,25,3.1,.87],[12,32,1.1,.77],[14,25,1.2,.85]],
 [[0,28,5.4,.92],[6,28,3.2,.84],[10,28,3.2,.88],[14,40,1.2,.78]],
 [[0,32,6.3,.9],[8,32,3.2,.87],[12,25,1.2,.84],[14,25,.4,.76],[15,25,.4,.7]]
];
function trapPart(role,section){
 const out=[],bridge=section===2;
 if(role===1)for(let b=0;b<4;b++)phrase(out,b*16,bridge?trapSub[b].slice(0,1):trapSub[b],section===0?.85:1);
 if(role===2){phrase(out,0,trapBells,bridge?.65:1);phrase(out,32,trapBells,bridge?.65:1);if(section===3)phrase(out,0,[[15,92,.5,.36],[47,92,.5,.36]]);}
 if(role===3)for(const [b,chord] of [[0,[49,56,59]],[2,[52,59,63]],[3,[44,51,56]]])phrase(out,b*16,chord.map(m=>[0,m,b===0?29:13,.3]));
 if(role===4&&section!==0)phrase(out,0,[[15,73,.7,.45],[15.05,76,.65,.35],[31,71,.7,.42],[31.05,75,.65,.32],[47,76,.7,.46],[47.05,80,.65,.35],[63,68,.7,.4]]);
 return out;
}
function trapDrums(section,rolls){
 const p=rows(),bridge=section===2;
 for(let b=0;b<4;b++){
  if(rolls){hit(p,'hat',b,b%2?[[6,.22],[7,.3],[12,.27],[13,.35],[14,.28],[15,.4]]:[[14,.3],[15,.37]]);continue;}
  hit(p,'kick',b,bridge?[[0,.86]]:b%2?[[0,.95],[7,.8],[12,.83],[15,.6]]:[[0,.95],[6,.8],[11,.84]]);
  hit(p,'clap',b,[[8,.9]]);
  hit(p,'hat',b,(bridge?[0,4,8,12]:[0,2,4,6,8,10,12,14,15]).map((s,i)=>[s,i%2?.24:.4]));
  if(section!==0&&!bridge){hit(p,'open',b,[[6,.32]]);hit(p,'rim',b,[[13,.23]]);}
 }
 return p;
}

// Bass-led E9 vamp with an A9 turnaround. Explicit syncopated call/answer bars,
// blue thirds, chromatic approach notes and short, interlocking guitar voicings.
const funkBass=[
 [[0,40,.9,.95],[1.5,43,.45,.66],[3,45,.6,.82],[4.5,40,.3,.22],[6,40,.55,.88],[7,44,.4,.65],[8,47,.8,.88],[10,50,.55,.7],[11.5,47,.4,.7],[14,52,.6,.86],[15,39,.4,.62]],
 [[0,40,.8,.95],[2,52,.6,.8],[3.5,50,.4,.67],[6,47,.7,.87],[8,45,.6,.84],[9.5,43,.4,.6],[10.5,44,.4,.65],[12,47,.65,.82],[14.5,39,.5,.65]],
 [[0,40,1,.95],[3,43,.45,.67],[4,44,.5,.76],[6,47,.6,.88],[7.5,50,.4,.65],[8.5,52,.7,.86],[10.5,50,.5,.68],[12,47,.55,.84],[13.5,45,.4,.64],[15,44,.45,.65]],
 [[0,33,.9,.95],[2.5,40,.5,.72],[4,43,.65,.82],[6,45,.55,.84],[7.5,43,.4,.6],[9,40,.65,.84],[11,42,.5,.72],[12.5,43,.45,.76],[15,39,.4,.7]]
];
function funkPart(role,section){
 const out=[],bridge=section===2;
 if(role===1)for(let b=0;b<4;b++)phrase(out,b*16,bridge?funkBass[b].filter((e,i)=>i%2===0):funkBass[b]);
 for(let b=0;b<4;b++){
  const base=b*16,chord=b===3?[55,61,64,71]:[56,62,66,71];
  if(role===2)for(const s of (bridge?[2,10]:b%2?[2,7,10,14]:[2,5,10,13]))phrase(out,base+s,chord.map((m,j)=>[j*.018,m,.75,j===3?.53:.45]));
  if(role===3)for(const [i,s] of (bridge?[2,6,10,14]:[1,2,5,6,9,10,13,14,15]).entries())phrase(out,base+s,chord.slice(0,3).map((m,j)=>[j*.012,m,.28,i%3===1?.8:.48]));
  if(role===4)phrase(out,base, b%2?[[3,64,.55,.62],[3.03,71,.5,.5],[11,62,.6,.55],[11.03,68,.55,.48]]:[[7,66,.5,.65],[7.03,71,.45,.52],[15,64,.5,.6]]);
  if(role===5&&!bridge)phrase(out,base,b%2?[[4.5,76,.3,.5],[7.5,74,.3,.48],[12.5,71,.35,.57]]:[[3.5,71,.35,.55],[11.5,74,.3,.5],[14.5,76,.3,.6]]);
 }
 return out;
}
function funkDrums(section){
 const p=rows();
 for(let b=0;b<4;b++){
  hit(p,'kick',b,b%2?[[0,.9],[3,.68],[6,.86],[10,.8],[14,.68]]:[[0,.94],[6,.8],[8,.86],[11,.67],[14,.78]]);
  hit(p,'clap',b,[[4,.82],[7,.17],[11,.13],[12,.88],[15,.2]]);
  hit(p,'hat',b,(section===2?[0,2,4,6,8,10,12,14]:[0,1,2,3,4,6,7,8,9,10,11,12,14,15]).map((s,i)=>[s,s%4===2?.5:i%2?.2:.34]));
  hit(p,'open',b,[[14,.3]]);if(section===3&&b===3)hit(p,'tom',b,[[13,.4],[14,.5],[15,.63]]);
 }
 return p;
}
const composers={drill:drillPart,trap808:trapPart,funk:funkPart};
const percussion={drill:drillDrums,trap808:trapDrums,funk:funkDrums};
export function createBeatDemoSession(style){
 if(!Object.hasOwn(styles,style))throw Error('Démo musicale inconnue.');
 const x=styles[style],sections=['INTRO','COUPLET','BREAK','REFRAIN'].map((name,i)=>({name,start:i*4,length:4}));
 const tracks=x.palette.map(([type,name,volume,settings],role)=>{
  const t=createContentTrack(type,0);Object.assign(t,{name,volume,pan:role===3?-.24:role===4?.24:0});Object.assign(t.instrument,settings);
  for(let sec=0;sec<4;sec++){
   const rolls=type==='drums'&&role===5,offset=rolls?1/32:0;
   const clip={id:uid(),name:sections[sec].name+' · '+name,start:sec*4+offset,length:4-offset,patternSteps:64};
   if(type==='drums')clip.pattern=percussion[style](sec,rolls);else clip.notes=composers[style](role,sec);
   if(type==='drums'||clip.notes.length)t.clips.push(clip);
  }
  return t;
 });
 for(const [name,volume] of [['LEAD VOX (vide)',-5],['BACKS (vide)',-10],['ADLIBS (vide)',-13]]){
  const t=createContentTrack('keys');Object.assign(t,{name,type:'audio',volume,instrument:{},clips:[]});tracks.push(t);
 }
 return {version:1,demo:true,demoRevision:2,demoGenre:style,name:x.name,description:x.description,
  bpm:x.bpm,bars:16,swing:x.swing,pianoKey:x.key,pianoScale:x.scale,keyName:x.keyName,masterVolume:-9,
  mastering:masteringSettings({inserts:['peak'],bypass:false,peak:{enabled:true,drive:0,ceiling:-1.5,release:140}}),
  recording:{gainDb:0,autoLevel:true},sections,tracks};
}
