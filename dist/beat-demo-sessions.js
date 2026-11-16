// Additional original, editable scores; the six earlier public demos stay intact.
import {createContentTrack} from './content.js';
import {DRUM_VOICES} from './plugins.js';
import {masteringSettings} from './mastering.js';

const uid=()=>Math.random().toString(36).slice(2,12);
const styles={
 drill:{label:'Drill',name:'WARLIKE · Drill nocturne',bpm:142,swing:0,keyName:'Fa mineur',key:5,
  roots:[29,25,32,27],chords:[[65,68,72,79],[61,65,68,72],[68,72,75,79],[63,67,70,77]],
  description:'Batterie half-time décalée, roulements de charley à la triple croche, 808 courte et piano sombre.',
  palette:[
   ['drums','DRILL · HALF-TIME',-11,{kit:0,punch:.7,decay:.16,hat:.43}],
   ['bass','808 · OCTAVES SOMBRES',-9,{body:.85,harmonics:.23,release:.07}],
   ['keys','KEYS · MOTIF NOCTURNE',-13,{attack:.009,release:.23,detune:2}],
   ['wlrompler','ATLAS · CLOCHE FROIDE',-13,{wave:0,texture:1,layer:.45,cutoff:5800,attack:.004,release:.2,space:.12,output:-5}],
   ['pad','HALO · BRUME',-26,{attack:.5,release:.7,width:8}],
   ['drums','HI-HAT · ROULEMENTS 1/32',-16,{kit:0,punch:.5,decay:.1,hat:.34}]
  ]},
 trap808:{label:'Trap 808',name:'WARLIKE · Trap 808 Pressure',bpm:150,swing:2,keyName:'Sol mineur',key:7,
  roots:[31,27,34,29],chords:[[67,70,74,81],[63,67,70,74],[70,74,77,81],[65,69,72,79]],
  description:'808 soutenue avec harmoniques, kick espacé, claps half-time, cloches et réponse de synthé.',
  palette:[
   ['drums','TRAP · POCKET',-11,{kit:0,punch:.78,decay:.14,hat:.5}],
   ['bass','808 · PRESSURE SUB',-8,{body:.95,harmonics:.36,release:.09}],
   ['pluck','STRING · BELL HOOK',-13,{decay:.42,brightness:6400,body:.38}],
   ['keys','VELVET · ACCORDS MINEURS',-17,{attack:.018,release:.4,detune:3}],
   ['lead','NOVA · RÉPONSES',-17,{cutoff:2400,detune:5,release:.1}],
   ['drums','HI-HAT · FILLS 1/32',-17,{kit:0,punch:.5,decay:.1,hat:.37}]
  ]},
 funk:{label:'Funk',name:'WARLIKE · Funk Pocket',bpm:110,swing:8,keyName:'Mi mineur',key:4,
  roots:[40,33,38,35],chords:[[55,59,62,66],[55,61,64,71],[54,57,61,64],[57,63,66,69]],
  description:'Basse pincée syncopée, guitares étouffées, accords de neuvième au clavier FM et batterie acoustique.',
  palette:[
   ['drums','FUNK · LIVE POCKET',-11,{kit:2,punch:.62,decay:.2,hat:.48}],
   ['wljazz','BASSE · CORDES PINCÉES',-8,{brightness:2200,body:.85,pickPosition:.28,damping:.15,attack:.004,decay:.7,release:.06,drive:0,output:-2}],
   ['keys','VELVET · NINTH CHORDS',-11,{attack:.008,release:.12,detune:1.5}],
   ['wlmuted','MUTED · SIXTEENTH CHOPS',-9,{brightness:6200,body:.62,pickPosition:.18,damping:.6,attack:.003,decay:.55,release:.05,drive:0,output:-3}],
   ['wlclean','CLEAN · RÉPONSE',-12,{brightness:6500,body:.65,pickPosition:.23,damping:.35,attack:.005,decay:.7,release:.1,drive:0,output:-4}],
   ['wlvirtual','VANGUARD · STABS',-13,{detune:2,cutoff:1900,resonance:.7,attack:.004,release:.08,pulse:.15,width:.18,output:-6}]
  ]}
};
export const BEAT_DEMOS=Object.freeze(Object.fromEntries(Object.entries(styles).map(([id,x])=>[id,Object.freeze({label:x.label,name:x.name,bpm:x.bpm,description:x.description})])));

function drums(style,section,rolls=false){
 const rows=Object.fromEntries(Object.keys(DRUM_VOICES).map(v=>[v,Array(64).fill(0)]));
 const intro=section===0,bridge=section===2,hook=section===3;
 const hit=(voice,b,positions,level)=>positions.forEach((s,i)=>{rows[voice][b+s]=level*(i%2?.8:1);});
 for(let bar=0;bar<4;bar++){
  const b=bar*16;
  if(rolls){
   // These clips start half a sixteenth late. Together with the main hat row,
   // integer pattern events form editable 1/32 rolls in the existing scheduler.
   hit('hat',b,intro?[14]:bridge?[14,15]:style==='drill'?(bar%2?[3,4,5,14,15]:[6,7,14,15]):bar%2?[6,7,12,13,14,15]:[14,15],hook?.38:.27);
  }else if(style==='drill'){
   hit('kick',b,intro?[0,10]:bridge?[0,11]:bar%2?[0,6,11,14]:[0,5,10],.88);
   hit('clap',b,bar%2?[10]:[8],intro?.45:.78);
   hit('hat',b,intro?[0,3,6,10,14]:bridge?[0,3,6,14]:[0,3,6,8,10,12,14,15],hook?.46:.35);
   if(!intro){hit('open',b,[7],.27);hit('rim',b,[13],.26);}
  }else if(style==='trap808'){
   hit('kick',b,intro?[0,11]:bridge?[0]:bar%2?[0,7,12]:[0,6,11],.86);
   if(!bridge||bar>1)hit('clap',b,[8],intro?.48:.82);
   hit('hat',b,intro?[0,4,8,12]:bridge?[2,6,10,14]:[0,2,4,6,8,10,12,14,15],hook?.44:.34);
   if(!intro&&!bridge){hit('open',b,[6],.28);hit('rim',b,[15],.2);}
  }else{
   hit('kick',b,intro?[0,6,10]:bar%2?[0,3,7,10]:[0,6,8,14],.82);
   hit('clap',b,[4,12],.63);if(!intro)hit('clap',b,[7,15],.16);
   hit('hat',b,intro?[0,2,4,6,8,10,12,14]:[0,1,2,3,4,6,8,9,10,11,12,14,15],.32);
   if(!intro){hit('open',b,[14],.23);hit('shaker',b,[3,7,11,15],.24);}
   if(hook&&bar===3)hit('tom',b,[13,14,15],.35);
  }
 }
 return rows;
}

function score(style,role,section){
 const x=styles[style],notes=[],intro=section===0,bridge=section===2,hook=section===3;
 const add=(step,midi,len=1,velocity=.6)=>notes.push({id:uid(),step,midi,len,velocity});
 for(let bar=0;bar<4;bar++){
  const b=bar*16,c=x.chords[bar],r=x.roots[bar];
  if(style==='funk'){
   if(role===1){
    const positions=intro?[0,6,10,14]:bridge?[0,7,10,14]:[0,3,6,7.5,10,12,14,15];
    positions.forEach((s,i)=>add(b+s,r+[0,12,7,0,0,10,12,7][i],s===0?1.9:.55,i%2?.57:.78));
   }
   if(role===2)for(const s of (intro?[2,10]:bridge?[2,10,14]:[2,5,10,13,15]))c.forEach((m,j)=>add(b+s+j*.025,m,s===2?1.3:.6,hook?.55:.45));
   if(role===3)for(const [i,s] of (intro?[2,6,10,14]:[1,2,5,6,9,10,13,14,15]).entries())for(const m of c.slice(0,2))add(b+s,m+12,.34,i%3===1?.61:.38);
   if(role===4&&!intro)for(const [i,s] of [3,7,11,14].entries())add(b+s,c[[2,1,3,2][i]]+12,.65,.57);
   if(role===5&&!intro)for(const s of (bridge?[0]:[0,7,12]))for(const m of c.slice(0,3))add(b+s,m,.8,hook?.59:.43);
  }else{
   if(role===1){
    const positions=intro?[0,10]:bridge?[0,11]:style==='drill'?(bar%2?[0,6,11,14]:[0,5,10,12,14]):bar%2?[0,7,12,14]:[0,6,11,14];
    positions.forEach((s,i)=>{
     const gap=(positions[i+1]??16)-s;
     const pitch=r+(style==='drill'&&i===positions.length-1?12:hook&&i===2?7:0);
     // Keep space for the 808 release; do not stack sustained sub notes.
     add(b+s,pitch,Math.min(style==='drill'?3.3:7,gap-1),intro?.65:hook?.92:.82);
    });
   }
   if(style==='drill'){
    if(role===2)for(const [i,s] of (bridge?[0,8]:[0,3,6,10,14]).entries())add(b+s,c[[2,1,0,3,1][i]],Math.min(2.2,16-s),hook?.68:.52);
    if(role===3&&!intro)for(const [i,s] of [2,7,11,14].entries())add(b+s,c[[3,2,1,2][i]]+12,1.15,hook?.7:.53);
    if(role===4)c.slice(0,3).forEach(m=>add(b,m-12,14.5,bridge?.5:.37));
   }else{
    if(role===2)for(const [i,s] of (bridge?[0,10]:[0,2,7,10,14]).entries())add(b+s,c[[2,3,1,2,0][i]]+12,Math.min(1.3,16-s),hook?.7:.56);
    if(role===3)for(const s of (intro?[0]:[0,8]))c.slice(0,3).forEach((m,j)=>add(b+s+j*.025,m-12,5.5,hook?.5:.38));
    if(role===4&&!intro)for(const [i,s] of (bridge?[12]:[3,11,14]).entries())add(b+s,c[[2,3,1][i]],1.25,hook?.6:.43);
   }
  }
 }
 return notes;
}

export function createBeatDemoSession(style){
 if(!Object.hasOwn(styles,style))throw Error('Démo musicale inconnue.');
 const x=styles[style],sections=['INTRO','COUPLET','BREAK','REFRAIN'].map((name,i)=>({name,start:i*4,length:4}));
 const tracks=x.palette.map(([type,name,volume,settings],role)=>{
  const t=createContentTrack(type,0);Object.assign(t,{name,volume,pan:role===3?-.22:role===4?.2:0});
  Object.assign(t.instrument,settings);
  for(let sec=0;sec<4;sec++){
   const rolls=type==='drums'&&role===5,offset=rolls?1/32:0;
   const clip={id:uid(),name:sections[sec].name+' · '+name,start:sec*4+offset,length:4-offset,patternSteps:64};
   if(type==='drums')clip.pattern=drums(style,sec,rolls);else clip.notes=score(style,role,sec);
   if(type==='drums'||clip.notes.length)t.clips.push(clip);
  }
  return t;
 });
 for(const [name,volume] of [['LEAD VOX (vide)',-5],['BACKS (vide)',-10],['ADLIBS (vide)',-13]]){
  const t=createContentTrack('keys');Object.assign(t,{name,type:'audio',volume,instrument:{},clips:[]});tracks.push(t);
 }
 return {version:1,demo:true,demoRevision:1,demoGenre:style,name:x.name,description:x.description,
  bpm:x.bpm,bars:16,swing:x.swing,pianoKey:x.key,pianoScale:'minor',keyName:x.keyName,masterVolume:-9,
  mastering:masteringSettings({inserts:['peak'],bypass:false,peak:{enabled:true,drive:0,ceiling:-1.5,release:140}}),
  recording:{gainDb:0,autoLevel:true},sections,tracks};
}
