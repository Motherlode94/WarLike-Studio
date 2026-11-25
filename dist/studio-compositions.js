// Original R08.4 scores. Native MIDI/drum clips remain editable in Studio.
import {DRUM_VOICES} from './plugins.js';
import {applyNativeChain} from './native-vocal-chains.js';
import {demoMasteringSettings} from './demo-mastering.js';
const uid=()=>crypto.randomUUID().replaceAll('-','');
export const COMPOSITION_TEMPLATES=[
 {id:'trap-abyss',name:'WARLIKE · Minuit sans étoiles',style:'Trap sombre · instrumental original',bpm:142,swing:0,groove:'abyss-half-time',bars:112,description:'808 profonde, piano mineur menaçant, synthé analogique en contrechant et nappes souterraines. Deux refrains évolutifs, pauses dramatiques et espace pour poser une voix.'},
 {id:'trap-enigma',name:'WARLIKE · Le Code des Ombres',style:'Trap énigmatique · instrumental original',bpm:126,swing:4,groove:'enigma-morse',bars:100,description:'Claviers suspendus, synthé spectral interrogatif, flûte en réponse et 808 souple. Silences, indices mélodiques et retournements de tension.'},
 {id:'rnb-2005',name:'WARLIKE · Nos heures secrètes',style:'R&B français 2002–2009 · instrumental original',bpm:94,swing:11,groove:'french-rnb-2005',bars:88,description:'R&B français début 2000 : Rhodes, basse électrique, guitare muted, cordes discrètes et refrains chantables. Batterie percutante, réponses mélodiques et espace pour les voix.'},
 {id:'popstar-2008',name:'WARLIKE · Sous les néons',style:'Pop-star française 2002–2009 · instrumental original',bpm:112,swing:3,groove:'french-popstar-2008',bars:104,description:'Pop/R&B française années 2000 : piano frontal, guitares, basse, synthés brillants en arrière-plan et refrains grandioses. Pont dramatique et véritable montée finale.'},
 {"id":"etoiles-interdites","name":"WARLIKE · Les étoiles interdites","style":"Pop française cinématographique · chanson instrumentale originale","bpm":96,"swing":5,"bars":92,"groove":"rnb-pocket","description":"Piano mystérieux, cordes en crescendo, guitare délicate et percussions feutrées ; refrain porté par une mélodie ample."},
 {"id":"derriere-les-murs","name":"WARLIKE · Derrière les murs","style":"Pop orientale cinématographique · chanson instrumentale originale","bpm":102,"swing":7,"bars":96,"groove":"rnb-pocket","description":"Flûte expressive, claviers nocturnes, percussions syncopées et basse profonde ; mystère, mouvement et refrains évocateurs."},
 {"id":"un-dernier-soleil","name":"WARLIKE · Un dernier soleil","style":"Pop dramatique à grands refrains · chanson instrumentale originale","bpm":112,"swing":2,"bars":104,"groove":"rnb-pocket","description":"Piano et basse en ouverture, guitares claires et synthés panoramiques ; montée vocale et grand final émotionnel."},
 {"id":"au-bord-du-ciel","name":"WARLIKE · Au bord du ciel","style":"Pop orchestrale et ballade puissante · chanson instrumentale originale","bpm":84,"swing":0,"bars":80,"groove":"rnb-pocket","description":"Ballade portée par un piano sensible, des nappes et cordes en réponse ; pont dépouillé avant un refrain final puissant."},
 {"id":"promesses-de-pluie","name":"WARLIKE · Promesses de pluie","style":"R&B français mélodique et pop émotionnelle · chanson instrumentale originale","bpm":90,"swing":12,"bars":88,"groove":"rnb-pocket","description":"Groove R&B français, Rhodes, basse électrique, guitare muted et violons ; couplets intimistes, refrains chantables et contrechants."},
 {id:'rives',name:'Rives de Kin',style:'Afro · instrumental original',bpm:106,swing:8,groove:'afro-sun',bars:88,description:'Afro lumineux : guitare étouffée, kora, mbira et flûte dialoguent sur une basse électrique. Deux couplets, deux refrains et un pont allégé.'},
 {id:'pluie',name:'Après la pluie',style:'R&B · instrumental original',bpm:78,swing:22,groove:'rnb-pocket',bars:72,description:'R&B nocturne : accords de neuvième au clavier FM, réponses au piano et vibraphone, orgue discret et basse ronde. De la place pour enregistrer les voix.'},
 {id:'horizon',name:'Horizon de cuivre',style:'Amapiano · instrumental original',bpm:112,swing:12,groove:'horizon-pocket',bars:96,description:'Amapiano : log drum synthétique, clavier FM, mbira et kora se répondent sur des shakers. Introduction progressive, refrains dansants et pont suspendu.'},
 {id:'eclats',name:"Éclats d’asphalte",style:'Rock alternatif · instrumental original',bpm:124,swing:0,groove:'eclats-backbeat',bars:112,description:'Rock alternatif : riffs de guitare crunch, arpèges clean, cordes acier et basse électrique. Refrains ouverts, pont en half-time et guitare lead originale.'},
 {id:'kin',name:'Kin après minuit',style:'Rumba congolaise · instrumental original',bpm:104,swing:8,groove:'kin-sebene',bars:96,bridgeLabel:'SEBENE',description:'Rumba : guitare nylon, solo clean et contrechants acier se croisent autour d’une basse ronde. Le sebene développe les échanges entre guitares.'},
 {id:'lumiere',name:'Lumière en ville',style:'Pop organique · instrumental original',bpm:116,swing:2,groove:'lumiere-pop',bars:104,description:'Pop lumineuse : piano, thème de guitare clean, strums acoustiques et nappe douce. Deux refrains ouverts et un pont plus intime.'}
];
export const COMPOSITION_STYLES={
 'trap-abyss':{key:6,scale:'minor',keyName:'Fa♯ mineur',harmony:'F♯m · D · A · E',palette:'808 MONO, piano, ATLAS, VANGUARD, clavier FM',
  verse:[[54,57,61,66],[50,54,57,62],[57,61,64,69],[52,56,59,64]],roots:[30,26,33,28],
  bridge:[[49,52,56,61],[47,50,54,59],[50,54,57,62],[52,56,59,64]],bridgeRoots:[25,23,26,28],
  tracks:[['drums','DARK · KICK / CLAP',0,-21,{kit:0,punch:.83,decay:.14,hat:.33}],['bass','MONO · 808 ABYSS',0,-23,{body:.92,harmonics:.19,release:.055}],['piano','GRAND · PIANO NOCTURNE',0,-23,{brightness:3200,release:.48}],['wlrompler','ATLAS · SOUS-TERRE',0,-31,{wave:1,texture:0,layer:.28,cutoff:1700,attack:.45,release:1.65,space:.13,output:-16}],['wlvirtual','VANGUARD · APPEL SOMBRE',0,-30,{detune:5,cutoff:2300,resonance:1.5,attack:.008,release:.2,width:.4,output:-17}],['epiano','FM KEYS · RÉPONSE LOIN',0,-29,{brightness:2800,release:.42}]],
  layout:[['INTRO',8,'intro'],['COUPLET A',16,'verse'],['MONTÉE',8,'pre'],['REFRAIN A',16,'hook'],['PONT',8,'bridge'],['COUPLET B',16,'verse'],['REFRAIN B',24,'hook'],['OUTRO',16,'outro']]},
 'trap-enigma':{key:0,scale:'minor',keyName:'Do mineur',harmony:'Cm · A♭ · E♭ · B♭',palette:'808 MONO, FM keys, ATLAS, NEBULA spectral, flûte',
  verse:[[48,51,55,60],[44,48,51,56],[51,55,58,63],[46,50,53,58]],roots:[24,32,27,34],
  bridge:[[53,56,60,65],[44,48,51,56],[46,50,53,58],[48,51,55,60]],bridgeRoots:[29,32,34,24],
  tracks:[['drums','ENIGMA · POCKET CODÉ',0,-23,{kit:0,punch:.75,decay:.14,hat:.28}],['bass','MONO · 808 PHANTOM',0,-25,{body:.83,harmonics:.15,release:.08}],['epiano','FM KEYS · QUESTIONS',0,-24,{brightness:2800,release:.67}],['wlrompler','ATLAS · VOILE MYSTÉRIEUX',0,-33,{wave:2,texture:1,layer:.32,cutoff:1900,attack:.56,release:2.1,space:.18,output:-18}],['wlspectral','NEBULA · SIGNES',0,-31,{fm:.29,harmonics:.39,motion:.25,cutoff:3200,attack:.04,release:.53,width:.52,output:-18}],['flute','FLÛTE · RÉPONSES',0,-31,{brightness:4100,attack:.025,release:.22,output:-3}]],
  layout:[['INTRO',8,'intro'],['COUPLET A',16,'verse'],['MONTÉE',8,'pre'],['REFRAIN A',16,'hook'],['PONT',8,'bridge'],['COUPLET B',16,'verse'],['REFRAIN B',16,'hook'],['OUTRO',12,'outro']]},
 'rnb-2005':{key:9,scale:'minor',keyName:'La mineur',harmony:'Am9 · Fmaj9 · Cmaj9 · G6',palette:'Rhodes, basse TITAN, muted guitar, violons, piano et batterie R&B',
  verse:[[57,60,64,67,71],[53,57,60,64,67],[60,64,67,71],[55,59,62,67]],roots:[33,29,36,31],
  bridge:[[53,57,60,64],[55,59,62,67],[57,60,64,67],[52,55,59,64]],bridgeRoots:[29,31,33,28],
  tracks:[['drums','2005 · R&B LIVE KICK',2,-17,{kit:2,punch:.72,decay:.25,hat:.4}],['wltitan','TITAN · BASSE SOUL',0,-18,{brightness:2700,attack:.009,release:.2}],['epiano','RHODES · ACCORDS INTIMES',0,-19,{brightness:3900,release:.43}],['wlmuted','MUTED · GUITARE RÉPONSE',1,-21,{brightness:4800,damping:.6,release:.1,output:-9}],['violin','VIOLONS · REFRAIN',0,-27,{}],['piano','PIANO · REFLETS',0,-23,{brightness:4800,release:.46}]],
  layout:[['INTRO',8,'intro'],['COUPLET A',16,'verse'],['PRÉ-REFRAIN',8,'pre'],['REFRAIN A',16,'hook'],['PONT',8,'bridge'],['COUPLET B',16,'verse'],['REFRAIN B',12,'hook'],['OUTRO',4,'outro']]},
 'popstar-2008':{key:2,scale:'major',keyName:'Ré majeur',harmony:'Dmaj9 · A(add9) · Bm7 · Gmaj9',palette:'Piano, basse électrique, guitares steel/clean, synthé VANGUARD, violons',
  verse:[[50,54,57,61,64],[57,61,64,69],[59,62,66,69],[55,59,62,66]],roots:[26,33,35,31],
  bridge:[[59,62,66,69],[55,59,62,66],[50,54,57,61],[57,61,64,69]],bridgeRoots:[35,31,26,33],
  tracks:[['drums','2008 · POP LIVE',2,-15,{kit:2,punch:.69,decay:.27,hat:.45}],['wltitan','TITAN · BASSE POP',0,-18,{brightness:3100,attack:.008,release:.21}],['piano','GRAND · PIANO STAR',1,-18,{brightness:5800,release:.39}],['wlclean','CLEAN · GUITARE HOOK',0,-22,{brightness:5900,drive:0,release:.24,output:-9}],['wlsteel','STEEL · STRUMS',1,-24,{brightness:6200,release:.18,output:-9}],['wlvirtual','VANGUARD · REFRAIN ÉCLAT',0,-29,{detune:4,cutoff:4800,resonance:1.2,attack:.045,release:.46,width:.45,output:-17}]],
  layout:[['INTRO',8,'intro'],['COUPLET A',16,'verse'],['PRÉ-REFRAIN',8,'pre'],['REFRAIN A',16,'hook'],['PONT',8,'bridge'],['COUPLET B',16,'verse'],['REFRAIN B',24,'hook'],['OUTRO',8,'outro']]},
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
  tracks:[['drums','ROCK · BACKBEAT',2,-12,{kit:1,punch:.68,decay:.28,hat:.5}],['wltitan','TITAN · BASSE ÉLECTRIQUE',1,-16,{brightness:3200,attack:.006,release:.18}],['wlcrunch','CRUNCH · RIFF PRINCIPAL',1,-20,{drive:.34,brightness:6600,pickPosition:.22,damping:.32,decay:.66,release:.13,output:-10}],['wlclean','CLEAN · ARPÈGES',0,-23,{drive:0,brightness:6100,pickPosition:.38,decay:1.4,release:.24,output:-9}],['wlsteel','STEEL · ACCORDS OUVERTS',1,-23,{brightness:6100,release:.2}],['wljazz','HOLLOW · GUITARE LEAD',1,-22,{drive:.18,brightness:5900,release:.23}]],
  layout:[['INTRO',8,'intro'],['COUPLET A',16,'verse'],['MONTÉE',8,'pre'],['REFRAIN A',16,'hook'],['PONT',16,'bridge'],['COUPLET B',16,'verse'],['REFRAIN B',24,'hook'],['OUTRO',8,'outro']]},
 kin:{key:7,scale:'major',keyName:'Sol majeur',harmony:'Gmaj7 · D(add9) · Em7 · Cmaj9',palette:'Guitares nylon, clean, muted et acier, basse et percussions',
  verse:[[55,59,62,66],[50,54,57,64],[52,55,59,62],[48,52,55,59,62]],roots:[31,26,28,24],
  bridge:[[48,52,55,59],[47,55,59,62],[45,52,55,60],[50,54,57,59]],bridgeRoots:[24,35,33,26],
  tracks:[['drums','RUMBA · PERCUSSIONS',3,-12,{kit:3,decay:.22,hat:.42}],['wltitan','TITAN · BASSE RONDE',2,-16,{brightness:2550,attack:.008,release:.22}],['wlnylon','NYLON · ACCOMPAGNEMENT',0,-18,{brightness:4400,body:.78,drive:0,release:.2}],['wlclean','CLEAN · THÈME SEBENE',0,-19,{brightness:6800,body:.6,pickPosition:.27,drive:0,decay:.82,release:.14,output:-9}],['wlmuted','MUTED · CONTRETEMPS',1,-24,{brightness:4400,damping:.65,drive:0,release:.07,output:-9}],['wlsteel','STEEL · CONTRECHANT',0,-23,{brightness:5100,release:.21}]],
  layout:[['INTRO',8,'intro'],['COUPLET A',16,'verse'],['MONTÉE',8,'pre'],['REFRAIN A',12,'hook'],['SEBENE',16,'bridge'],['COUPLET B',16,'verse'],['REFRAIN B',12,'hook'],['OUTRO',8,'outro']]},
 lumiere:{key:2,scale:'major',keyName:'Ré majeur',harmony:'Dmaj9 · Bm7 · G6 · A(add9)',palette:'Piano, guitares clean et acier, nappe ATLAS, basse et batterie',
  verse:[[50,54,57,61,64],[47,54,57,62],[55,59,62,64],[57,61,64,71]],roots:[26,35,31,33],
  bridge:[[52,55,59,62],[55,59,62,66],[50,54,57,64],[57,61,64,67]],bridgeRoots:[28,31,26,33],
  tracks:[['drums','POP · GROOVE OUVERT',2,-12,{kit:2,punch:.58,decay:.25,hat:.43}],['wltitan','TITAN · BASSE POP',0,-16,{brightness:3100,attack:.006,release:.2}],['piano','GRAND · ACCORDS',1,-15,{brightness:5900,release:.4}],['wlclean','CLEAN · THÈME LUMIÈRE',0,-20,{brightness:6200,pickPosition:.35,drive:0,release:.2,output:-9}],['wlsteel','STEEL · STRUMS',1,-23,{brightness:6400,pickPosition:.4,release:.17,output:-9}],['wlrompler','ATLAS · AIR DOUX',2,-26,{cutoff:2600,attack:.35,release:1.1,output:-14}]],
  layout:[['INTRO',8,'intro'],['COUPLET A',16,'verse'],['MONTÉE',8,'pre'],['REFRAIN A',16,'hook'],['PONT',8,'bridge'],['COUPLET B',16,'verse'],['REFRAIN B',24,'hook'],['OUTRO',8,'outro']]}

};
// Five fully original French pop/R&B scores; classic DAW instruments and native effects only.
// Related palettes share harmonic vocabulary, not melodies, rhythms or song structure.
const CINEMATIC_POP_SONGS=[{"id":"etoiles-interdites","base":"popstar-2008","flavor":1,"layout":[8,16,8,16,8,20,12,4]},{"id":"derriere-les-murs","base":"trap-enigma","flavor":2,"layout":[8,16,8,16,8,16,16,8]},{"id":"un-dernier-soleil","base":"popstar-2008","flavor":3,"layout":[8,16,8,16,8,16,24,8]},{"id":"au-bord-du-ciel","base":"pluie","flavor":4,"layout":[8,12,8,12,8,12,12,8]},{"id":"promesses-de-pluie","base":"rnb-2005","flavor":5,"layout":[8,16,8,16,8,16,12,4]}];
for(const song of CINEMATIC_POP_SONGS){
 const parent=COMPOSITION_STYLES[song.base];
 const sections=['INTRO','COUPLET A','MONTÉE','REFRAIN A','PONT','COUPLET B','REFRAIN B','OUTRO'];
 const kinds=['intro','verse','pre','hook','bridge','verse','hook','outro'];
 const tracks=parent.tracks.map(([type,name,preset,volume,params],i)=>{
  const nameParts=['RYTHME','BASSE','HARMONIE','CONTRECHANT','TEXTURE','MÉLODIE'];
  return [type,'WARLIKE · '+nameParts[i]+' '+song.flavor,preset,volume,structuredClone(params)];
 });
 // Give each record distinct orchestrations and entirely different rhythmic/melodic motifs.
 if(song.flavor===1){tracks[4]=['violin','CORDES · ÉTOILES',0,-28,{}];tracks[5]=['flute','FLÛTE · LUEURS',0,-27,{release:.21}];}
 if(song.flavor===2){tracks[1]=['wltitan','TITAN · BASSE VOYAGE',0,-20,{brightness:2700,attack:.008,release:.22}];tracks[3]=['wlrompler','ATLAS · CINÉMATIQUE',0,-29,{wave:2,texture:1,layer:.25,cutoff:2200,attack:.35,release:1.3,space:.12,output:-16}];}
 if(song.flavor===3){tracks[4]=['violin','CORDES · GRAND REFRAIN',0,-28,{}];tracks[5]=['wlvirtual','VANGUARD · ENVELOPPE',0,-30,{detune:4,cutoff:4300,resonance:1.1,attack:.07,release:.44,width:.36,output:-17}];}
 if(song.flavor===4){tracks[3]=['violin','VIOLONS · HORIZON',0,-28,{}];tracks[5]=['flute','FLÛTE · RESPIRATION',0,-29,{release:.25}];}
 if(song.flavor===5){tracks[4]=['violin','CORDES · MÉMOIRES',0,-28,{}];}
 COMPOSITION_STYLES[song.id]={...parent,tracks,flavor:song.flavor,
  layout:song.layout.map((length,i)=>[sections[i],length,kinds[i]])};
}
const introOrQuiet=(kind,bar)=>kind==='intro'&&bar<2;
function drums(style,kind,cycle){
 const rows=Object.fromEntries(Object.keys(DRUM_VOICES).map(v=>[v,Array(64).fill(0)]));
 const hit=(voice,step,v)=>{rows[voice][step]=Math.min(1,v);};
 for(let bar=0;bar<4;bar++){
  const b=bar*16,hook=kind==='hook',intro=kind==='intro',sparse=['intro','bridge','outro'].includes(kind),variant=(cycle+bar)%2;
  if(style==='trap-abyss'||style==='trap-enigma'){
   const abyss=style==='trap-abyss';
   const kicks=abyss?(sparse?[0]:hook?(variant?[0,5,8,11,14]:[0,6,10,14]):variant?[0,7,11]:[0,6,11]):
    sparse?[0]:hook?(variant?[0,6,9,13]:[0,5,10,14]):variant?[0,7,13]:[0,5,11];
   for(const step of kicks)hit('kick',b+step,step===0?.82:.57);
   if(!introOrQuiet(kind,bar))hit('clap',b+(abyss?8:12),hook?.67:.56);
   const hats=sparse?[0,6,12]:abyss?[0,2,4,6,8,10,12,14]:[0,3,6,9,12,14];
   for(const step of hats)hit('hat',b+step,step%4===0?.3:.19);
   if(!sparse&&hook){for(const step of (variant?[13,14,15]:[14,15]))hit('hat',b+step,.24+(step===15?.1:0));hit('open',b+(abyss?6:14),.2);}
   if(!intro&&!sparse){hit('rim',b+(abyss?15:7),.17);if(!abyss)hit('perc',b+11,.16);}
  }
  if(style==='rnb-2005'||style==='popstar-2008'){
   const rnb=style==='rnb-2005';
   for(const step of (sparse?[0,8]:rnb?(variant?[0,6,10,14]:[0,7,10]):variant?[0,4,8,11,14]:[0,6,8,12]))hit('kick',b+step,step===0?.74:.55);
   if(!introOrQuiet(kind,bar))for(const step of [4,12])hit('clap',b+step,hook?.65:.51);
   for(const step of (sparse?[0,8]:rnb?[0,3,6,8,11,14]:[0,2,4,6,8,10,12,14]))hit('hat',b+step,step%4===0?.24:.15);
   if(!sparse){hit('rim',b+15,rnb?.19:.11);if(hook){hit('open',b+14,.24);hit('shaker',b+7,.2);}}
   if(kind==='pre'&&bar===3)for(const step of [12,14,15])hit('tom',b+step,.18+(step-12)*.045);
  }
  const cinematic=COMPOSITION_STYLES[style]?.flavor;
  if(cinematic){
   const mode=cinematic,beat=mode===4?[0,8]:mode===2?[0,6,11]:mode===5?[0,6,10,14]:[0,4,8,12];
   const kicks=sparse?[0]:hook?[...beat,14]:beat;
   for(const step of kicks)hit('kick',b+step,step===0?.72:.49);
   if(!introOrQuiet(kind,bar))for(const step of (mode===2?[8]:[4,12]))hit('clap',b+step,hook?.6:.4);
   for(const step of (sparse?[0,8]:mode===2?[0,3,6,9,12,15]:mode===5?[0,3,6,8,11,14]:[0,2,4,6,8,10,12,14]))hit('hat',b+step,step%4===0?.22:.14);
   if(!sparse&&mode===2)for(const step of [3,7,11,15])hit('perc',b+step,.17+(step===11?.13:0));
   if(!sparse&&mode===5)for(const step of [3,7,11,15])hit('shaker',b+step,.16+(step===15?.09:0));
   if(hook){hit('open',b+14,.22);if(bar===0)hit('open',b,.3);}
   if(kind==='pre'&&bar===3)for(const step of [12,14,15])hit('tom',b+step,.17+(step-12)*.03);
  }
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
   for(const s of (half?[8]:[4,12]))hit('clap',b+s,(sparse?.42:hook?.68:.56)*(bar%2?.92:1));
   for(const s of (sparse?[0,4,8,12]:[0,2,4,6,8,10,12,14]))hit('hat',b+s,s%4===0?.28:.2);
   if(hook){hit('open',b+6,.26);hit('open',b+14,.29);}if((bar===0&&['hook','pre'].includes(kind))||(bar===3&&!sparse))hit('open',b+(bar===3?15:0),.46);
   if(half)hit('rim',b+15,.23);
  }
  if(style==='kin'){
   for(const step of (kind==='bridge'?[0,6,8,10]:sparse?[0]:[0,8]))hit('kick',b+step,step===0?.68:.48);
   if(!sparse||kind==='bridge')hit('clap',b+12,bar%2?.29:.37);
   for(const step of (kind==='bridge'?[2,6,10,14]:[0,4,8,12]))hit('hat',b+step,step===8?.23:.14);
   for(const step of [1,4,7,9,12,15])hit('shaker',b+step,(step%4===3?.28:.19)*(bar%2?.87:1));
   for(const step of [3,7,11,15])hit('rim',b+step,.27+(step===7?.08:0));
   for(const step of (kind==='bridge'?[2,5,9,13,14]:[5,13]))hit('perc',b+step,step===13?.2:.29);
   // Existing eight-voice kit: open hi-hat is a cymbal accent, not a separate ride/crash sample.
   if((bar===0&&['hook','bridge'].includes(kind))||(bar===3&&hook))hit('open',b+(bar===3?14:0),hook?.42:.32);
  }
  if(style==='lumiere'){
   for(const step of (sparse?[0,8]:variant?[0,3,8,10]:[0,6,8,12]))hit('kick',b+step,step===0?.72:.56);
   for(const step of [4,12])hit('clap',b+step,(sparse?.3:.48)*(bar%2?.94:1));
   for(const step of (sparse?[2,10]:[0,2,4,6,8,10,12,14]))hit('hat',b+step,step%4===0?.23:.16);
   for(const step of [3,7,11,15])hit('shaker',b+step,hook?.24:.17);
   if(hook)hit('open',b+14,.23);if(bar===0&&['hook','pre'].includes(kind))hit('open',b,.34);
  }
  if(bar===3&&!sparse){for(const s of [13,14,15])hit('tom',b+s,(hook?.32:.21)+(s-13)*.05);}
  if(kind==='bridge'&&!['eclats','kin','trap-abyss','trap-enigma'].includes(style))rows.kick.fill(0,b,b+16);
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
  if(style==='trap-abyss'){
   if(role===1){
    const steps=bridge?[0,10]:intro?[0,10]:hook?(alt?[0,5,8,12,14]:[0,6,10,13]):alt?[0,7,11]:[0,6,11];
    for(const [i,step] of steps.entries())add(b+step,root+(i===steps.length-1&&hook?12:0),i===0?4.2:step===14?.7:2.1,i===0?.69:.55);
   }
   if(role===2){chord(b+.08,c,intro||bridge?9:5.9,hook?.44:.35,.04);if(!intro&&!bridge)for(const [i,step] of (hook?[9,11,14]:[11,14]).entries())add(b+step,c[(i+2+alt)%c.length]+12,1.35,.38);}
   if(role===3&&(!intro||bar%2===0)){chord(b+.16,c.slice(0,3),14.1,bridge?.22:hook?.24:.16,.035);if(hook&&bar%2===0)add(b+10,c[2]+12,2,.2);}
   if(role===4&&!intro){const steps=hook?[2,5,7,10,13]:bridge?[7,14]:[3,7,13];for(const [i,step] of steps.entries())add(b+step,c[(i+alt+2)%c.length]+12,step===13?2:.85,hook?.47:.35);}
   if(role===5&&['hook','pre','bridge'].includes(kind)){const steps=hook?[4,11,15]:[6,14];for(const [i,step] of steps.entries())add(b+step,c[(i+1+alt)%c.length]+24,.8,hook?.34:.27);}
  }
  if(style==='trap-enigma'){
   if(role===1){const steps=bridge?[0,11]:intro?[0]:hook?(alt?[0,4,9,14]:[0,6,10,14]):alt?[0,7,12]:[0,6,11];for(const [i,step] of steps.entries())add(b+step,root+(i===steps.length-1&&hook?12:0),i===0?5.1:1.8,i===0?.65:.48);}
   if(role===2){chord(b+.12,c,intro||bridge?10:6.3,hook?.39:.33,.07);if(!intro&&!bridge)for(const [i,step] of (hook?[7,10,14]:[11,14]).entries())add(b+step,c[(i+alt+2)%c.length]+12,1.2,.35);}
   if(role===3){chord(b+.1,c.slice(1,4),14.1,bridge?.21:hook?.25:.17,.06);if(hook&&bar%2===1)add(b+9,c[3]+12,2,.2);}
   if(role===4&&!intro){const steps=hook?[1,4,7,10,13]:bridge?[5,11]:[2,7,13];for(const [i,step] of steps.entries())add(b+step,c[(i+alt+(hook?2:1))%c.length]+24,i===steps.length-1?1.8:.95,hook?.42:.31);}
   if(role===5&&['pre','hook','bridge'].includes(kind)){const steps=hook?[3,8,14]:[6,13];for(const [i,step] of steps.entries())add(b+step,c[(i+alt)%c.length]+24,1.25,hook?.37:.29);}
  }
  if(style==='rnb-2005'||style==='popstar-2008'){
   const rnb=style==='rnb-2005',loud=hook?1:.82;
   if(role===1)for(const [i,step] of (intro?[0,8]:bridge?[0,8,13]:rnb?(alt?[0,5,8,11,14]:[0,6,8,12,15]):alt?[0,3,8,11,14]:[0,5,8,12,15]).entries())
    add(b+step,root+(i===2?7:i===4&&hook?12:0),i===0?3.7:1.4,(i===0?.72:.53)*loud);
   if(role===2){chord(b+.08,c,bridge?10:intro?9:hook?4.7:6.4,hook?.58:.42,.075);if(!intro&&!bridge)chord(b+9.1,[...c.slice(1),c[0]+12],hook?3.7:5,.36,.065);}
   if(role===3&&!intro){
    const steps=hook?(rnb?[2,5,8,11,14]:[0,3,6,9,12,14]):bridge?[4,12]:[3,7,11,14];
    for(const [i,step] of steps.entries())add(b+step,c[(i+alt+1)%c.length]+12,i===steps.length-1?1.7:.95,(hook?.54:.38)*loud);
   }
   if(role===4&&!intro){
    if(rnb){if(hook||kind==='pre')chord(b+.2,c.slice(0,3),13.5,hook?.34:.24,.085);}
    else for(const step of (hook?[2,6,10,14]:[2,10]))chord(b+step,c.slice(0,3),hook?1.8:4.4,hook?.42:.28,.08);
   }
   if(role===5&&['pre','hook','bridge'].includes(kind)){
    if(rnb){for(const [i,step] of (hook?[2,6,10,14]:[5,12]).entries())add(b+step,c[(i+alt+2)%c.length]+12,1.9,hook?.45:.31);}
    else {chord(b+.1,c.slice(1,4),hook?14.2:10,hook?.3:.2,.04);if(hook)for(const step of [7,15])add(b+step,c[2]+12,.85,.23);}
   }
  }
  const cinema=COMPOSITION_STYLES[style]?.flavor;
  if(cinema){
   const seed=cinema,shape=(seed+cycle+bar)%3;
   if(role===1){
    const steps=bridge?[0,9]:intro?[0,8]:hook?[[0,5,8,11,14],[0,6,10,14],[0,4,8,12,15]][shape]:[[0,7,10],[0,5,11,14],[0,6,9,13]][shape];
    for(const [i,step] of steps.entries())add(b+step,root+(hook&&i===steps.length-1?12:i===2?7:0),i===0?4:1.5,hook?.65:.49);
   }
   if(role===2){chord(b+.12,c,intro?11:bridge?10:hook?6:8,hook?.55:.4,.07);if(!intro&&!bridge&&seed!==4)chord(b+9.25,[...c.slice(1),c[0]+12],hook?3.5:4.6,.3,.06);}
   if(role===3&&!intro){
    const steps=bridge?[3,11]:hook?[[0,3,7,10,13],[2,5,9,12,15],[0,5,8,11,14]][shape]:[[3,9,14],[2,7,12],[4,8,13]][shape];
    for(const [i,step] of steps.entries())add(b+step,c[(seed+i+shape)%c.length]+12,step===15?.8:1.7,hook?.54:.35);
   }
   if(role===4&&!intro&&(hook||kind==='pre'||seed===2)){
    if(seed===2)for(const step of [3,7,11,15])add(b+step,c[(step+seed)%c.length]+12,1.15,.29);
    else chord(b+.18,c.slice(0,3),hook?13.7:8.5,hook?.32:.19,.08);
   }
   if(role===5&&['pre','hook','bridge'].includes(kind)){
    const steps=seed===4?[5,12]:seed===2?[2,6,10,14]:hook?[0,4,8,12,15]:[6,13];
    for(const [i,step] of steps.entries())add(b+step,c[(seed+i+shape+1)%c.length]+12,step===15?.85:1.5,hook?.43:.28);
   }
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
   if(role===1)for(const [i,step] of (bridge?[0,8,13]:intro?[0,8]:hook?(alt?[0,3,6,8,11,14]:[0,2,5,8,10,13]):alt?[0,5,8,11,14]:[0,6,8,12,15]).entries())add(b+step,root+(i===2?7:i===4&&hook?12:0),bridge?3.5:hook?1.5:1.9,.78-i%3*.09);
   if(role===2){
    const steps=intro?[0,8]:bridge?[0,8]:hook?[0,2,4,7,8,10,12,14]:[0,3,6,8,11,14];
    for(const step of steps)chord(b+step,[root+12,root+19,root+24],bridge?6.8:intro?5.8:hook?1.3:1.05,hook?.6:bridge?.44:.49,.04);
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
   if(role===1)for(const [i,step] of (bridge?[0,3,6,8,11,14]:intro?[0,8]:alt?[0,3,7,9,12,15]:[0,5,8,10,14]).entries())add(b+step,root+(i%4===1?7:i%4===3?12:0),i===0?2.65:.85,.7-i%2*.1);
   if(role===2)for(const step of (intro?[0,8]:alt?[1,5,9,13]:[0,4,8,12]))chord(b+step,c.slice(0,3),bridge?2.1:2.65,hook?.48:.39,.11);
   if(role===3){
    const steps=bridge?[0,1.5,3,4.5,6,8,9.5,11,12.5,14]:hook?[0,2,4,7,8,10,12,14]:intro?[0,7,12]:[0,3,6,9,11,14];
    const seq=bridge?[2,1,3,2,0,1]:hook?[2,3,1,2,0,1]:[0,2,1,3];
    for(const [i,step] of steps.entries())add(b+step,c[seq[(i+alt)%seq.length]%c.length]+12,bridge?.95:i===steps.length-1?1.65:1.15,bridge?.58:hook?.56:.46);
   }
   if(role===4&&!intro)for(const [i,step] of (alt?[3,7,11,15]:[2,6,10,14]).entries())add(b+step,c[(i+alt)%c.length]+12,.42,bridge?.42:.34);
   if(role===5&&['pre','hook','bridge'].includes(kind)){
    const steps=bridge?[1,4,7,10,13,15]:[3,7,11,14];
    for(const [i,step] of steps.entries())add(b+step,c[(i+alt+1)%c.length]+12,Math.min(1.25,16-step),bridge?.46:.38);
   }
  }
  if(style==='lumiere'){
   if(role===1)for(const [i,step] of (intro||bridge?[0,8]:hook?(alt?[0,3,6,8,11,14]:[0,4,7,8,12,15]):alt?[0,5,8,13]:[0,6,8,14]).entries())add(b+step,root+(i%4===2?7:0),intro||bridge?4.8:i===0?2.8:1.45,.73-i%2*.11);
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
  if(template.id==='trap-abyss'||template.id==='trap-enigma'){
   // Original WarLike-native FX, deliberately low drive and conservative gains.
   // These are editable processor instances, not external VST binaries.
   const chains=[
    [{id:'vectorcomp',params:{threshold:-18,ratio:1.8,attack:25,release:145,mix:.4}}],
    [{id:'sculpt',params:{highpass:25,cutoff:13500}},{id:'vectorcomp',params:{threshold:-18,ratio:1.6,attack:28,release:150,mix:.34}}],
    [{id:'circuiteq',params:{body:-.5,presence:.5}},{id:'vectorcomp',params:{threshold:-19,ratio:1.5,attack:28,release:180,mix:.25}}],
    [{id:'sculpt',params:{highpass:150,cutoff:8500}},{id:'exospace',params:{mix:.12}}],
    [{id:'circuiteq',params:{body:-1,presence:.5}},{id:'alterecho',params:{mix:.1,feedback:.22}}],
    [{id:'sculpt',params:{highpass:170,cutoff:11000}},{id:'alterecho',params:{mix:.08,feedback:.2}},{id:'exospace',params:{mix:.1}}]
   ];
   applyNativeChain(t,chains[role],{replace:true});
  }else if(role===5){t.inserts[0]='echo';Object.assign(t.effects.echo,{enabled:true,mix:.065,feedback:.18});}
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
 const isDarkTrap=['trap-abyss','trap-enigma'].includes(template.id);
 const trapMaster=isDarkTrap?demoMasteringSettings('trap'):null;
 if(trapMaster){trapMaster.circuitcolor.mix=0;trapMaster.circuitcolor.drive=0;trapMaster.peak.drive=0;trapMaster.peak.ceiling=-1.5;}
 return {version:1,demo:true,demoRevision:full?6:4,fullSong:full,name:template.name,bpm:template.bpm,bars:cursor,swing:template.swing,masterVolume:-1,
  mastering:trapMaster||{inserts:['peak'],peak:{enabled:true,drive:0,ceiling:-1.5,release:140}},recording:{gainDb:0,autoLevel:true},
  pianoKey:spec.key,pianoScale:spec.scale,keyName:spec.keyName,sections:sections.map(({kind,...part})=>part),tracks};
}
