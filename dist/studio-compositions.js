// Original R08.4 scores. Native MIDI/drum clips remain editable in Studio.
import {DRUM_VOICES} from './plugins.js';
const uid=()=>crypto.randomUUID().replaceAll('-','');
export const COMPOSITION_TEMPLATES=[
 {id:'rives',name:'Rives de Kin',style:'Afro · instrumental original',bpm:106,swing:8,groove:'afro-sun',bars:88,description:'Afro lumineux : guitare étouffée, kora, mbira et flûte dialoguent sur une basse électrique. Deux couplets, deux refrains et un pont allégé.'},
 {id:'pluie',name:'Après la pluie',style:'R&B · instrumental original',bpm:78,swing:22,groove:'rnb-pocket',bars:72,description:'R&B nocturne : accords de neuvième au clavier FM, réponses au piano et vibraphone, orgue discret et basse ronde. De la place pour enregistrer les voix.'}
];
export const COMPOSITION_STYLES={
 rives:{key:7,scale:'major',keyName:'Sol majeur',harmony:'Em9 · Cmaj9 · G6 · D(add9)',palette:'Guitare muted, kora, mbira, flûte et basse électrique',
  verse:[[52,55,59,62,66],[48,52,55,59,62],[55,59,62,64],[50,54,57,64]],roots:[28,24,31,26],
  bridge:[[48,52,55,59],[50,54,57,64],[52,55,59,62],[55,59,62,66]],bridgeRoots:[24,26,28,31],
  tracks:[['drums','AFRO · PERCUSSIONS',3,-10,{}],['wltitan','TITAN · BASSE DANSANTE',0,-13,{brightness:1800,release:.13}],['wlmuted','MUTED · CONTRETEMPS',1,-17,{brightness:4200,release:.1}],['wlkora','KORA · THÈME',0,-15,{release:.23}],['wlmbira','MBIRA · RÉPONSES',0,-19,{release:.17}],['flute','FLÛTE · ÉCHAPPÉE',0,-19,{release:.15}]],
  layout:[['INTRO',8,'intro'],['COUPLET A',16,'verse'],['MONTÉE',8,'pre'],['REFRAIN A',12,'hook'],['PONT',8,'bridge'],['COUPLET B',16,'verse'],['REFRAIN B',12,'hook'],['OUTRO',8,'outro']]},
 pluie:{key:3,scale:'major',keyName:'Mi♭ majeur',harmony:'E♭maj9 · Cm9 · A♭maj9 · B♭13',palette:'Clavier FM, piano, orgue, vibraphone et basse électrique',
  verse:[[51,55,58,62,65],[48,55,58,62,63],[56,60,63,67,70],[58,62,65,67,72]],roots:[27,24,32,34],
  bridge:[[53,56,60,63,67],[58,62,65,67,72],[55,58,62,65],[48,55,58,62,63]],bridgeRoots:[29,34,31,24],
  tracks:[['drums','R&B · POCKET FEUTRÉ',1,-12,{}],['wltitan','TITAN · BASSE RONDE',2,-14,{brightness:1400,release:.22}],['epiano','FM KEYS · ACCORDS',1,-13,{brightness:4300,release:.45}],['piano','GRAND · FILIGRANE',2,-20,{release:.5}],['wltonewheel','TONEWHEEL · SOUFFLE',0,-25,{release:.6}],['vibes','VIBES · MÉLODIE',1,-18,{release:.65}]],
  layout:[['INTRO',8,'intro'],['COUPLET A',12,'verse'],['MONTÉE',4,'pre'],['REFRAIN A',8,'hook'],['PONT',8,'bridge'],['COUPLET B',12,'verse'],['REFRAIN B',12,'hook'],['OUTRO',8,'outro']]}
};
function drums(style,kind,cycle){
 const rows=Object.fromEntries(Object.keys(DRUM_VOICES).map(v=>[v,Array(64).fill(0)]));
 const hit=(voice,step,v)=>{rows[voice][step]=Math.min(1,v);};
 for(let bar=0;bar<4;bar++){
  const b=bar*16,hook=kind==='hook',sparse=['intro','bridge','outro'].includes(kind),variant=(cycle+bar)%2;
  if(style==='rives'){
   for(const s of (sparse?[0,10]:variant?[0,3,8,11]:[0,6,10]))hit('kick',b+s,s===0?.82:.61);
   for(const s of [3,7,11,15])hit('rim',b+s,s===7?.48:.29);
   for(let s=0;s<16;s++)if(!sparse||s%2)hit('shaker',b+s,s%4===3?.27:.15);
   if(!sparse)for(const s of [4,12])hit('clap',b+s,.4);
   for(const s of (sparse?[5,13]:[2,5,9,14]))hit('perc',b+s,.24+(s===9?.12:0));
   if(hook){for(const s of [2,6,10,14])hit('hat',b+s,.22);hit('open',b+14,.2);}
  }else{
   for(const s of (sparse?[0]:variant?[0,7,11]:[0,6,10]))hit('kick',b+s,s===0?.69:.44);
   if(kind!=='bridge')for(const s of [4,12])hit('clap',b+s,sparse?.26:.41);
   for(const s of (sparse?[2,10]:[0,3,6,8,11,14]))hit('hat',b+s,s%4===0?.22:.13);
   if(!sparse)hit('rim',b+15,.17);
   if(hook&&variant)hit('open',b+14,.15);
  }
  if(bar===3&&!sparse){for(const s of [13,14,15])hit('tom',b+s,(hook?.32:.21)+(s-13)*.05);}
  if(kind==='bridge')rows.kick.fill(0,b,b+16);
 }
 return rows;
}
function melody(style,role,kind,cycle){
 const spec=COMPOSITION_STYLES[style],bridge=kind==='bridge',hook=kind==='hook',intro=kind==='intro',out=[];
 const chords=bridge?spec.bridge:spec.verse,roots=bridge?spec.bridgeRoots:spec.roots;
 const add=(step,midi,len=1,velocity=.6)=>{
  if(step>=64)return;
  out.push({id:uid(),step,midi,len:Math.min(len,64-step),velocity:velocity*(kind==='outro'?.55:1)});
 };
 const chord=(b,c,len,v,spread=.04)=>c.forEach((pitch,i)=>add(b+i*spread,pitch,len-i*spread,v-i*.015));
 for(let bar=0;bar<4;bar++){
  const b=bar*16,c=chords[bar],root=roots[bar],alt=(cycle+bar)%2;
  if(role===1){
   const steps=style==='rives'?[0,3,6,10,14]:[0,6.18,10.12,14.1];
   if(bridge&&bar%2)continue;
   for(const [i,s] of steps.entries())if(!intro||i===0||i===3)add(b+s,root+(i===2?7:i===4?12:0),style==='rives'?(i===0?2.2:1.2):(i===0?4.5:1.6),i===0?.78:.59);
  }
  if(style==='rives'){
   if(role===2)for(const s of (intro||bridge?[2,10]:[2,5,8,11,14]))chord(b+s,c.slice(0,3),.7,hook?.57:.44,.055);
   if(role===3){
    const sequence=hook?[2,4,2,1,0,2]:bridge?[1,2,0]:[0,2,1,2];
    const steps=hook?[0,3,6,9,12,14]:bridge?[1,7,12]:[0,3,7,12];
    for(const [i,s] of steps.entries())add(b+s,c[Math.min(sequence[(i+alt)%sequence.length],c.length-1)]+12,i===steps.length-1?2:1.1,hook?.63:.53);
   }
   if(role===4&&!intro)for(const [i,s] of (hook?[1,5,8,11,15]:[6,14]).entries())add(b+s,c[(i+cycle)%c.length]+12,.8,.43+i%2*.06);
   if(role===5&&['hook','pre','bridge'].includes(kind)){
    // The second half answers the first motif instead of doubling every beat.
    const steps=alt?[2,6,10,13]:[1,5,8,12],sequence=hook?[2,1,3,2]:[1,0,2,1];
    for(const [i,s] of steps.entries())add(b+s,c[sequence[i]%c.length]+12,i===3?2.7:1.7,hook?.58:.46);
   }
  }else{
   if(role===2){chord(b+.14,c,bridge?10:6.8,intro?.43:hook?.59:.51,.07);if(!intro&&!bridge)chord(b+9.2,[...c.slice(1),c[0]+12],5,.4,.06);}
   if(role===3&&!intro)for(const [i,s] of (hook?[2.12,5.12,11.12,14.12]:[7.15,13.15]).entries())add(b+s,c[(i+2+alt)%c.length]+12,1.55,.36+i%2*.05);
   if(role===4&&!intro)chord(b+.2,c.slice(1,4),14.7,hook?.29:.22,.06);
   if(role===5&&['hook','pre','bridge'].includes(kind)){
    const sequence=hook?[4,3,2,1,2]:bridge?[2,1,0]:[3,2,1];
    const steps=hook?[.12,3.15,7.12,10.15,13.1]:[2.15,7.12,12.15];
    for(const [i,s] of steps.entries())add(b+s,c[sequence[(i+alt)%sequence.length]%c.length]+12,i===steps.length-1?2.3:1.8,hook?.56:.44);
   }
  }
 }
 return out;
}
export function createStudioComposition(template,makeTrack,full=false){
 const spec=COMPOSITION_STYLES[template.id];if(!spec)throw Error('Composition inconnue.');
 const layout=full?spec.layout:[['INTRO',4,'intro'],['COUPLET A',4,'verse'],['MONTÉE',4,'pre'],['REFRAIN A',4,'hook']];
 let cursor=0;const sections=layout.map(([name,length,kind])=>{const part={name,start:cursor,length,kind};cursor+=length;return part;});
 const tracks=spec.tracks.map(([type,name,preset,volume,params],role)=>{
  const t=makeTrack(type,preset);Object.assign(t,{name,volume,pan:role===2?-.17:role===4?.2:role===3?.1:0,instrument:{...t.instrument,...params}});
  t.inserts=Array(12).fill(null);
  if(role===5){t.inserts[0]='echo';Object.assign(t.effects.echo,{enabled:true,mix:.065,feedback:.18});}
  for(const [section,part] of sections.entries())for(let offset=0;offset<part.length;offset+=4){
   if(full&&((part.kind==='intro'&&offset===0&&role<2)||(part.kind==='outro'&&offset>=4&&role<2)))continue;
   const clip={id:uid(),name:part.name+' / '+name,start:part.start+offset,length:Math.min(4,part.length-offset),patternSteps:Math.min(4,part.length-offset)*16};
   const cycle=section+offset/4;
   if(type==='drums')clip.pattern=drums(template.id,part.kind,cycle);
   else clip.notes=melody(template.id,role,part.kind,cycle);
   if(type==='drums'||clip.notes.length)t.clips.push(clip);
  }
  return t;
 });
 for(const [name,volume] of [['LEAD VOX',-3],['BACKS',-7],['ADLIBS',-9]]){
  const t=makeTrack('keys');Object.assign(t,{type:'audio',name,volume,instrument:{},clips:[],recordArm:false});tracks.push(t);
 }
 return {version:1,demo:true,demoRevision:full?6:4,fullSong:full,name:template.name,bpm:template.bpm,bars:cursor,swing:template.swing,masterVolume:-9,
  mastering:{inserts:['peak'],peak:{enabled:true,drive:0,ceiling:-1.5,release:140}},recording:{gainDb:0,autoLevel:true},
  pianoKey:spec.key,pianoScale:spec.scale,keyName:spec.keyName,sections:sections.map(({kind,...part})=>part),tracks};
}
