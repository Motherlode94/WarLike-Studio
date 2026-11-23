// Original R08.4 scores. Native MIDI/drum clips remain editable in Studio.
import {DRUM_VOICES} from './plugins.js';
const uid=()=>crypto.randomUUID().replaceAll('-','');
export const COMPOSITION_TEMPLATES=[
 {id:'rives',name:'Rives de Kin',style:'Afro · instrumental original',bpm:106,swing:8,groove:'afro-sun',bars:88,description:'Afro lumineux : guitare étouffée, kora, mbira et flûte dialoguent sur une basse électrique. Deux couplets, deux refrains et un pont allégé.'},
 {id:'pluie',name:'Après la pluie',style:'R&B · instrumental original',bpm:78,swing:22,groove:'rnb-pocket',bars:72,description:'R&B nocturne : accords de neuvième au clavier FM, réponses au piano et vibraphone, orgue discret et basse ronde. De la place pour enregistrer les voix.'},
 {id:'horizon',name:'Horizon de cuivre',style:'Amapiano · instrumental original',bpm:112,swing:12,groove:'horizon-pocket',bars:96,description:'Amapiano : log drum synthétique, clavier FM, mbira et kora se répondent sur des shakers. Introduction progressive, refrains dansants et pont suspendu.'},
 {id:'eclats',name:"Éclats d’asphalte",style:'Rock alternatif · instrumental original',bpm:124,swing:0,groove:'eclats-backbeat',bars:112,description:'Rock alternatif : riffs de guitare crunch, arpèges clean, cordes acier et basse électrique. Refrains ouverts, pont en half-time et guitare lead originale.'},
 {id:'kin',name:'Kin après minuit',style:'Rumba congolaise · instrumental original',bpm:104,swing:8,groove:'kin-sebene',bars:96,bridgeLabel:'SEBENE',description:'Rumba : guitare nylon, solo clean et contrechants acier se croisent autour d’une basse ronde. Le sebene développe les échanges entre guitares.'},
 {id:'lumiere',name:'Lumière en ville',style:'Pop organique · instrumental original',bpm:116,swing:2,groove:'lumiere-pop',bars:104,description:'Pop lumineuse : piano, thème de guitare clean, strums acoustiques et nappe douce. Deux refrains ouverts et un pont plus intime.'}
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
  layout:[['INTRO',8,'intro'],['COUPLET A',12,'verse'],['MONTÉE',4,'pre'],['REFRAIN A',8,'hook'],['PONT',8,'bridge'],['COUPLET B',12,'verse'],['REFRAIN B',12,'hook'],['OUTRO',8,'outro']]},
 horizon:{key:5,scale:'minor',keyName:'Fa mineur',harmony:'Fm9 · D♭maj7 · A♭maj9 · E♭6',palette:'Log drum synthétique NGOMA, clavier FM, mbira, kora et orgue',
  verse:[[53,56,60,63,67],[49,53,56,60],[56,60,63,67,70],[51,55,58,60]],roots:[29,25,32,27],
  bridge:[[46,53,56,60],[51,55,58,63],[49,53,56,60],[53,56,60,63]],bridgeRoots:[22,27,25,29],
  tracks:[['drums','AMAPIANO · SHAKERS ET POCKET',3,-11,{decay:.2,hat:.48}],['wlngoma','NGOMA · LOG DRUM SYNTHÉTIQUE',0,-10,{skin:.8,strike:.28,decay:.86,release:.12}],['epiano','FM KEYS · VOICINGS',1,-14,{brightness:3900,release:.4}],['wlmbira','MBIRA · THÈME CUIVRÉ',1,-17,{release:.18}],['wlkora','KORA · CONTRECHANT',1,-22,{release:.21}],['wltonewheel','TONEWHEEL · RÉPONSES',0,-24,{release:.35}]],
  layout:[['INTRO',8,'intro'],['COUPLET A',16,'verse'],['MONTÉE',8,'pre'],['REFRAIN A',16,'hook'],['PONT',8,'bridge'],['COUPLET B',16,'verse'],['REFRAIN B',16,'hook'],['OUTRO',8,'outro']]},
 eclats:{key:4,scale:'minor',keyName:'Mi mineur',harmony:'Em9 · Cmaj7 · G · D(add9)',palette:'Guitares crunch, clean, acier et hollow, basse électrique et batterie',
  verse:[[52,55,59,62,66],[48,52,55,59],[55,59,62,67],[50,54,57,64]],roots:[28,24,31,26],
  bridge:[[45,52,55,60],[47,54,57,62],[48,52,55,59,62],[50,54,57,62]],bridgeRoots:[33,35,36,38],
  tracks:[['drums','ROCK · BACKBEAT',2,-12,{punch:.68,decay:.28,hat:.5}],['wltitan','TITAN · BASSE ÉLECTRIQUE',1,-14,{brightness:2700,release:.14}],['wlcrunch','CRUNCH · RIFF PRINCIPAL',1,-19,{drive:.25,brightness:5700,decay:.8,release:.13}],['wlclean','CLEAN · ARPÈGES',0,-22,{drive:0,brightness:5200,decay:1.25,release:.3}],['wlsteel','STEEL · ACCORDS OUVERTS',1,-23,{brightness:6100,release:.2}],['wljazz','HOLLOW · GUITARE LEAD',1,-22,{drive:.18,brightness:5900,release:.23}]],
  layout:[['INTRO',8,'intro'],['COUPLET A',16,'verse'],['MONTÉE',8,'pre'],['REFRAIN A',16,'hook'],['PONT',16,'bridge'],['COUPLET B',16,'verse'],['REFRAIN B',24,'hook'],['OUTRO',8,'outro']]},
 kin:{key:7,scale:'major',keyName:'Sol majeur',harmony:'Gmaj7 · D(add9) · Em7 · Cmaj9',palette:'Guitares nylon, clean, muted et acier, basse et percussions',
  verse:[[55,59,62,66],[50,54,57,64],[52,55,59,62],[48,52,55,59,62]],roots:[31,26,28,24],
  bridge:[[48,52,55,59],[47,55,59,62],[45,52,55,60],[50,54,57,59]],bridgeRoots:[24,35,33,26],
  tracks:[['drums','RUMBA · PERCUSSIONS',3,-12,{decay:.22,hat:.42}],['wltitan','TITAN · BASSE RONDE',2,-15,{brightness:1800,release:.16}],['wlnylon','NYLON · ACCOMPAGNEMENT',0,-18,{brightness:4400,body:.78,drive:0,release:.2}],['wlclean','CLEAN · THÈME SEBENE',0,-18,{brightness:4900,body:.68,drive:0,decay:1.1,release:.18}],['wlmuted','MUTED · CONTRETEMPS',1,-23,{brightness:3700,drive:0,release:.08}],['wlsteel','STEEL · CONTRECHANT',0,-23,{brightness:5100,release:.21}]],
  layout:[['INTRO',8,'intro'],['COUPLET A',16,'verse'],['MONTÉE',8,'pre'],['REFRAIN A',12,'hook'],['SEBENE',16,'bridge'],['COUPLET B',16,'verse'],['REFRAIN B',12,'hook'],['OUTRO',8,'outro']]},
 lumiere:{key:2,scale:'major',keyName:'Ré majeur',harmony:'Dmaj9 · Bm7 · G6 · A(add9)',palette:'Piano, guitares clean et acier, nappe ATLAS, basse et batterie',
  verse:[[50,54,57,61,64],[47,54,57,62],[55,59,62,64],[57,61,64,71]],roots:[26,35,31,33],
  bridge:[[52,55,59,62],[55,59,62,66],[50,54,57,64],[57,61,64,67]],bridgeRoots:[28,31,26,33],
  tracks:[['drums','POP · GROOVE OUVERT',2,-12,{punch:.58,decay:.25,hat:.43}],['wltitan','TITAN · PULSATION',0,-14,{brightness:2300,release:.16}],['piano','GRAND · ACCORDS',1,-15,{brightness:5900,release:.4}],['wlclean','CLEAN · THÈME LUMIÈRE',0,-19,{brightness:5400,drive:0,release:.22}],['wlsteel','STEEL · STRUMS',1,-23,{brightness:5900,release:.19}],['wlrompler','ATLAS · AIR DOUX',2,-26,{cutoff:2600,attack:.35,release:1.1,output:-14}]],
  layout:[['INTRO',8,'intro'],['COUPLET A',16,'verse'],['MONTÉE',8,'pre'],['REFRAIN A',16,'hook'],['PONT',8,'bridge'],['COUPLET B',16,'verse'],['REFRAIN B',24,'hook'],['OUTRO',8,'outro']]}

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
  }else if(style==='pluie'){
   for(const s of (sparse?[0]:variant?[0,7,11]:[0,6,10]))hit('kick',b+s,s===0?.69:.44);
   if(kind!=='bridge')for(const s of [4,12])hit('clap',b+s,sparse?.26:.41);
   for(const s of (sparse?[2,10]:[0,3,6,8,11,14]))hit('hat',b+s,s%4===0?.22:.13);
   if(!sparse)hit('rim',b+15,.17);
   if(hook&&variant)hit('open',b+14,.15);
  }
  if(style==='horizon'){
   for(const s of (sparse?[0,10]:variant?[0,7,10]:[0,6,10]))hit('kick',b+s,s===0?.73:.5);
   if(!sparse)for(const s of [4,12])hit('clap',b+s,.36);
   for(let s=0;s<16;s++)hit('shaker',b+s,s%4===3?.31:s%2?.23:.12);
   for(const s of [3,7,11,15])hit('rim',b+s,.22+(s===15?.07:0));
   if(hook){for(const s of [2,6,10,14])hit('hat',b+s,.24);hit('open',b+14,.19);}
  }
  if(style==='eclats'){
   const half=kind==='bridge';
   for(const s of (half?[0,10]:sparse?[0,8]:hook?[0,4,8,10,14]:variant?[0,6,8,11]:[0,7,8,10]))hit('kick',b+s,s===0?.78:.63);
   for(const s of (half?[8]:[4,12]))hit('clap',b+s,sparse?.42:hook?.68:.56);
   for(const s of (sparse?[0,4,8,12]:[0,2,4,6,8,10,12,14]))hit('hat',b+s,s%4===0?.28:.2);
   if(hook){hit('open',b+6,.26);hit('open',b+14,.29);}
   if(half)hit('rim',b+15,.23);
  }
  if(style==='kin'){
   for(const step of (kind==='bridge'?[0,6,8,10]:sparse?[0]:[0,8]))hit('kick',b+step,step===0?.68:.48);
   if(!sparse||kind==='bridge')hit('clap',b+12,.34);
   for(const step of [2,6,10,14])hit('hat',b+step,.17);
   for(const step of [1,4,7,9,12,15])hit('shaker',b+step,step%4===3?.28:.19);
   for(const step of [3,7,11,15])hit('rim',b+step,.27+(step===7?.08:0));
   for(const step of (kind==='bridge'?[2,5,9,13,14]:[5,13]))hit('perc',b+step,.25);
  }
  if(style==='lumiere'){
   for(const step of (sparse?[0,8]:variant?[0,3,8,10]:[0,6,8,12]))hit('kick',b+step,step===0?.72:.56);
   for(const step of [4,12])hit('clap',b+step,sparse?.3:.48);
   for(const step of (sparse?[2,10]:[0,2,4,6,8,10,12,14]))hit('hat',b+step,step%4===0?.23:.16);
   for(const step of [3,7,11,15])hit('shaker',b+step,hook?.24:.17);
   if(hook)hit('open',b+14,.23);
  }
  if(bar===3&&!sparse){for(const s of [13,14,15])hit('tom',b+s,(hook?.32:.21)+(s-13)*.05);}
  if(kind==='bridge'&&!['eclats','kin'].includes(style))rows.kick.fill(0,b,b+16);
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
  if(role===1&&['rives','pluie'].includes(style)){
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
  }else if(style==='pluie'){
   if(role===2){chord(b+.14,c,bridge?10:6.8,intro?.43:hook?.59:.51,.07);if(!intro&&!bridge)chord(b+9.2,[...c.slice(1),c[0]+12],5,.4,.06);}
   if(role===3&&!intro)for(const [i,s] of (hook?[2.12,5.12,11.12,14.12]:[7.15,13.15]).entries())add(b+s,c[(i+2+alt)%c.length]+12,1.55,.36+i%2*.05);
   if(role===4&&!intro)chord(b+.2,c.slice(1,4),14.7,hook?.29:.22,.06);
   if(role===5&&['hook','pre','bridge'].includes(kind)){
    const sequence=hook?[4,3,2,1,2]:bridge?[2,1,0]:[3,2,1];
    const steps=hook?[.12,3.15,7.12,10.15,13.1]:[2.15,7.12,12.15];
    for(const [i,s] of steps.entries())add(b+s,c[sequence[(i+alt)%sequence.length]%c.length]+12,i===steps.length-1?2.3:1.8,hook?.56:.44);
   }
  }
  if(style==='horizon'){
   if(role===1&&!intro){
    // Tuned NGOMA plays a syncopated log-drum figure, not a sustained bass line.
    const steps=bridge?[3,11]:hook?[0,3,6.5,10,14,15.25]:[0,6.5,10,14.25];
    for(const [i,step] of steps.entries())add(b+step,root+(i===2||i===5?12:i===3&&alt?7:0),i===0?1.15:.45,i===0?.79:i%2?.6:.69);
   }
   if(role===2){chord(b+.12,c,intro||bridge?11:5.4,hook?.53:.43,.065);if(!intro&&!bridge)chord(b+10.15,[...c.slice(1),c[0]+12],4.9,.38,.055);}
   if(role===3){
    const steps=hook?[0,3,6,9,12,14]:bridge?[1,8,12]:[0,5,9,12];
    const seq=hook?[2,1,3,2,0,1]:[0,2,1,3];
    for(const [i,step] of steps.entries())add(b+step,c[seq[(i+alt)%seq.length]%c.length]+12,i===steps.length-1?2:.95,hook?.6:.45);
   }
   if(role===4&&!intro)for(const [i,step] of (hook?[2,7,11,15]:[7,14]).entries())add(b+step,c[(i+alt+1)%c.length]+12,.75,.39);
   if(role===5&&['pre','hook','bridge'].includes(kind))for(const step of (hook?[2,6,10,14]:[5,13]))chord(b+step,c.slice(1,4),.9,hook?.33:.25,.03);
  }
  if(style==='eclats'){
   if(role===1)for(const [i,step] of (bridge?[0,10]:intro?[0,8]:hook?[0,2,4,6,8,10,12,14]:[0,6,8,10,14]).entries())add(b+step,root+(i%4===3?7:0),bridge?4.5:hook?1.65:2,.72-i%2*.11);
   if(role===2){
    const steps=intro?[0,8]:bridge?[0,8]:hook?[0,2,4,7,8,10,12,14]:[0,3,6,8,11,14];
    for(const step of steps)chord(b+step,[root+12,root+19,root+24],bridge?6.8:intro?5.8:hook?1.65:1.15,hook?.61:bridge?.44:.49,.012);
   }
   if(role===3){
    const steps=hook?[0,2,5,7,10,12,14]:bridge?[1,5,9,13]:[0,3,7,10,14];
    for(const [i,step] of steps.entries())add(b+step,c[(i+alt+(hook?1:0))%c.length]+12,hook?1.3:1.8,hook?.46:.4);
   }
   if(role===4){for(const step of (hook?[0,4,8,12]:[0,8]))chord(b+step,c.slice(0,3),hook?3.1:6.5,hook?.41:.31,.045);}
   if(role===5&&['pre','hook','bridge'].includes(kind)){
    const steps=hook?[1,4,6,9,12,14]:bridge?[0,5,8,11,14]:[3,8,13],seq=hook?[2,3,1,2,0,1]:[1,2,0,3];
    for(const [i,step] of steps.entries())add(b+step,c[seq[(i+alt)%seq.length]%c.length]+12,i===steps.length-1?1.7:1.35,hook?.57:.45);
   }
  }

  if(style==='kin'){
   if(role===1)for(const [i,step] of (bridge?[0,3,6,8,11,14]:intro?[0,8]:[0,6,8,12,15]).entries())add(b+step,root+(i%4===1?7:i%4===3?12:0),i===0?3:1.05,.7-i%2*.12);
   if(role===2)for(const step of (intro?[0,8]:[0,4,8,12]))chord(b+step,c.slice(0,3),bridge?2.1:3.15,hook?.48:.39,.055);
   if(role===3){
    const steps=bridge?[0,1.5,3,4.5,6,8,9.5,11,12.5,14]:hook?[0,2,4,7,8,10,12,14]:intro?[0,7,12]:[0,3,6,9,11,14];
    const seq=bridge?[2,1,3,2,0,1]:hook?[2,3,1,2,0,1]:[0,2,1,3];
    for(const [i,step] of steps.entries())add(b+step,c[seq[(i+alt)%seq.length]%c.length]+12,bridge?.95:i===steps.length-1?1.65:1.15,bridge?.58:hook?.56:.46);
   }
   if(role===4&&!intro)for(const [i,step] of [2,6,10,14].entries())add(b+step,c[(i+alt)%c.length]+12,.65,bridge?.42:.34);
   if(role===5&&['pre','hook','bridge'].includes(kind)){
    const steps=bridge?[1,4,7,10,13,15]:[3,7,11,14];
    for(const [i,step] of steps.entries())add(b+step,c[(i+alt+1)%c.length]+12,Math.min(1.25,16-step),bridge?.46:.38);
   }
  }
  if(style==='lumiere'){
   if(role===1)for(const [i,step] of (intro||bridge?[0,8]:hook?[0,4,6,8,12,14]:[0,6,8,14]).entries())add(b+step,root+(i%4===2?7:0),intro||bridge?4.8:i===0?3.2:1.5,.73-i%2*.11);
   if(role===2)for(const step of (intro||bridge?[0,8]:hook?[0,4,8,12]:[0,8]))chord(b+step,c,hook?3.4:6.8,hook?.53:.42,.045);
   if(role===3){
    const steps=hook?[0,3,6,8,11,14]:intro?[0,8]:bridge?[1,7,12]:[0,5,9,13],seq=hook?[2,3,1,2,0,1]:[0,2,1,3];
    for(const [i,step] of steps.entries())add(b+step,c[seq[(i+alt)%seq.length]%c.length]+12,i===steps.length-1?1.8:1.4,hook?.56:.42);
   }
   if(role===4)for(const step of (intro||bridge?[2,10]:[2,6,10,14]))chord(b+step,c.slice(0,3),intro||bridge?3.2:1.35,hook?.43:.31,.065);
   if(role===5&&['pre','hook','bridge'].includes(kind))chord(b+.1,c.slice(1,4),14.7,hook?.25:.18,.04);
  }

 }
 return out;
}
export function createStudioComposition(template,makeTrack,full=false){
 const spec=COMPOSITION_STYLES[template.id];if(!spec)throw Error('Composition inconnue.');
 const layout=full?spec.layout:[['INTRO',4,'intro'],['COUPLET A',4,'verse'],['MONTÉE',4,'pre'],['REFRAIN A',4,'hook']];
 let cursor=0;const sections=layout.map(([name,length,kind])=>{const part={name,start:cursor,length,kind};cursor+=length;return part;});
 const tracks=spec.tracks.map(([type,name,preset,volume,params],role)=>{
  const t=makeTrack(type,preset);Object.assign(t,{name,volume:volume+12,pan:role===2?-.17:role===4?.2:role===3?.1:0,instrument:{...t.instrument,...params}});
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
 return {version:1,demo:true,demoRevision:full?6:4,fullSong:full,name:template.name,bpm:template.bpm,bars:cursor,swing:template.swing,masterVolume:-1,
  mastering:{inserts:['peak'],peak:{enabled:true,drive:0,ceiling:-1.5,release:140}},recording:{gainDb:0,autoLevel:true},
  pianoKey:spec.key,pianoScale:spec.scale,keyName:spec.keyName,sections:sections.map(({kind,...part})=>part),tracks};
}
