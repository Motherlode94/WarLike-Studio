// Original WarLike instruments. Seven DISTINCT modeled guitar engines and three
// synthesis architectures. No third-party presets, samples or proprietary code.
const c=(key,name,min,max,step,value,unit='')=>({key,name,min,max,step,default:value,unit});
export const GUITAR_VOICES={
  wlsteel:{name:'WL STEEL 6',subtitle:'STEEL STRING / FINGERSTYLE',color:'#cfa675',style:'steel',description:'Six cordes acoustiques modélisées : attaque brillante, corps de caisse et décroissance naturelle.'},
  wlnylon:{name:'WL NYLON',subtitle:'CLASSICAL NYLON',color:'#c9a98f',style:'nylon',description:'Nylon doux, transitoires amortis et caisse ronde.'},
  wlfolk12:{name:'WL FOLK 12',subtitle:'TWELVE STRING CHORUS',color:'#dfbe88',style:'twelve',description:'Doublage de cordes avec octaves et microdésaccord.'},
  wljazz:{name:'WL JAZZ HOLLOW',subtitle:'HOLLOW BODY ELECTRIC',color:'#b29378',style:'jazz',description:'Attaque chaude de guitare jazz avec filtre de caisse creuse.'},
  wlclean:{name:'WL CLEAN SINGLE',subtitle:'CLEAN ELECTRIC',color:'#9ab6b3',style:'clean',description:'Guitare électrique claire, attaque serrée et éclat des cordes.'},
  wlcrunch:{name:'WL CRUNCH',subtitle:'AMP DRIVEN ELECTRIC',color:'#d29680',style:'crunch',description:'Guitare électrique saturée, dynamique au médiator et filtre post-ampli.'},
  wlmuted:{name:'WL MUTED FUNK',subtitle:'PALM MUTE / RHYTHM',color:'#cbb48e',style:'muted',description:'Cordes étouffées, notes courtes et tranchantes pour funk/Afro.'}
};
const guitarControls=[
 c('brightness','Pick / Brightness',450,16000,50,7600,'Hz'),
 c('body','Body',0,1,.01,.52,'%'),
 c('attack','Pick Attack',.001,.1,.001,.007,'s'),
 c('decay','String Decay',.07,3.2,.01,1.3,'s'),
 c('release','Release',.04,2,.01,.23,'s'),
 c('drive','Amp Drive',0,1,.01,.14,'%'),
 c('width','Double Width',0,1,.01,.42,'%'),
 c('output','Output',-24,6,.5,-8,'dB')
];
export const GUITAR_INSTRUMENTS=Object.fromEntries(Object.entries(GUITAR_VOICES).map(([id,v])=>[id,{...v,pack:'wlguitars',modeled:true,controls:guitarControls}]));
export const SYNTH_INSTRUMENTS={
 wlrompler:{name:'WL ATLAS',subtitle:'LAYERED ROMPLER-STYLE SYNTH',color:'#7eb9d5',pack:'wlatlas',description:'Synthèse multicouche pour sons prêts à jouer ; oscillateurs internes originaux (pas de ROM de samples commerciales).',controls:[
   c('layer','Layer Balance',0,1,.01,.45,'%'),c('wave','Layer A Wave',0,3,1,2,'mode'),c('texture','Layer B Wave',0,3,1,1,'mode'),
   c('cutoff','Filter',150,18000,50,7000,'Hz'),c('attack','Attack',.002,2,.001,.025,'s'),c('release','Release',.05,5,.01,1.2,'s'),
   c('space','Space',0,1,.01,.2,'%'),c('output','Output',-24,3,.5,-11,'dB')]},
 wlvirtual:{name:'WL VANGUARD',subtitle:'VIRTUAL ANALOG / UNISON',color:'#b99ee8',pack:'wlvanguard',description:'Double oscillateur analogique virtuel, unisson désaccordé et enveloppe de filtre.',controls:[
   c('detune','Detune',0,40,.1,12,'ct'),c('cutoff','Cutoff',100,18000,50,3200,'Hz'),c('resonance','Resonance',.3,8,.1,1.2,'Q'),
   c('attack','Attack',.002,2,.001,.012,'s'),c('release','Release',.03,4,.01,.5,'s'),c('pulse','Pulse Blend',0,1,.01,.4,'%'),
   c('width','Stereo Width',0,1,.01,.75,'%'),c('output','Output',-24,3,.5,-12,'dB')]},
 wlspectral:{name:'WL NEBULA',subtitle:'SPECTRAL / HYBRID SYNTH',color:'#86d5ce',pack:'wlnebula',description:'Synthèse FM et harmonique avec filtres animés et couches de texture, sans banque propriétaire.',controls:[
   c('fm','FM Index',0,1,.01,.4,'%'),c('harmonics','Harmonic Color',0,1,.01,.5,'%'),
   c('motion','Motion',0,1,.01,.4,'%'),c('cutoff','Spectral Filter',250,16000,50,5500,'Hz'),
   c('attack','Attack',.003,3,.001,.3,'s'),c('release','Release',.05,6,.01,2,'s'),
   c('width','Width',0,1,.01,.7,'%'),c('output','Output',-24,3,.5,-12,'dB')]}
};
export const HERITAGE_PACK={
 name:'WL HERITAGE ROOMS',label:'VINTAGE CONSOLE / ROOM / TAPE',color:'#c1a17c',
 description:'Chaînes studio analogiques originales : console, saturation, compression et espaces courts. Inspiration historique de workflows de grands studios, sans affiliation Abbey Road.',
 modules:['circuiteq','circuitcolor','circuitbus','voxambience','alterecho','vectorlimit']
};
export const GUITAR_PACK={name:'WL GUITAR COLLECTION',label:'SEVEN MODELED GUITARS',color:'#d5ae83',description:'Sept instruments de cordes modélisées, sans samples Ample Sound.',instruments:Object.keys(GUITAR_INSTRUMENTS),modules:[]};
export const SYNTH_PACKS={
 wlatlas:{name:'WL ATLAS',label:'LAYERED PRESET SYNTH',color:'#7eb9d5',description:'Couches synthétiques originales, approche production immédiate.',instruments:['wlrompler'],modules:[]},
 wlvanguard:{name:'WL VANGUARD',label:'VIRTUAL ANALOG SYNTH',color:'#b99ee8',description:'Oscillateurs et unisson originaux, workflow synthèse analogique.',instruments:['wlvirtual'],modules:[]},
 wlnebula:{name:'WL NEBULA',label:'HYBRID SPECTRAL SYNTH',color:'#86d5ce',description:'FM, harmoniques et textures originales.',instruments:['wlspectral'],modules:[]}
};
