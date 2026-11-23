import {encodeWav,zipFiles} from './wav.js';

export const GAME_SOUND_CATEGORIES=Object.freeze({interface:'Interface',gameplay:'Gameplay',movement:'Mouvements',impact:'Impacts',scifi:'Science-fiction',ambience:'Ambiances'});
// Original procedural sound designs. No recordings or third-party sample packs.
const definitions=[
 ['ui-confirm','Confirmation','interface','chime',.32,660,990],
 ['ui-cancel','Annulation','interface','chime',.3,330,220],
 ['ui-hover','Survol du menu','interface','chirp',.12,900,1300],
 ['ui-notify','Notification','interface','chime',.65,780,1170],
 ['coin-pickup','Pièce récupérée','gameplay','chime',.45,1100,1650],
 ['checkpoint','Point de contrôle','gameplay','chime',1.1,440,880],
 ['healing','Soin magique','gameplay','charge',1.4,330,660],
 ['level-up','Niveau supérieur','gameplay','chime',1.6,523.25,1046.5],
 ['step-stone','Pas sur pierre','movement','thud',.3,140,65],
 ['step-grass','Pas dans l’herbe','movement','crunch',.4,270,110],
 ['jump','Saut arcade','movement','chirp',.4,180,700],
 ['landing','Réception au sol','movement','thud',.65,110,38],
 ['hit-wood','Impact bois','impact','thud',.45,250,90],
 ['hit-metal','Impact métal','impact','metal',1.2,420,1350],
 ['hit-shield','Bouclier énergétique','impact','metal',.9,720,1900],
 ['crate-break','Caisse brisée','impact','crunch',.85,180,45],
 ['laser-shot','Tir laser','scifi','chirp',.48,2200,120],
 ['laser-charge','Charge laser','scifi','charge',1.8,110,1500],
 ['door-mechanism','Porte mécanique','scifi','mechanism',1.4,75,210],
 ['engine-start','Démarrage moteur SF','scifi','mechanism',2.3,40,180],
 ['wind','Vent synthétique','ambience','wind',4,90,170],
 ['rain','Pluie synthétique','ambience','rain',4,300,900],
 ['fire','Feu synthétique','ambience','fire',4,150,600],
 ['ship-hum','Bourdonnement spatial','ambience','hum',4,55,110]
];
export const GAME_SOUNDS=Object.freeze(definitions.map(([id,name,category,mode,duration,frequency,endFrequency],i)=>Object.freeze({id,name,category,mode,duration,frequency,endFrequency,seed:271828+i*7919,loop:false})));
export function gameSound(id){const sound=GAME_SOUNDS.find(s=>s.id===id);if(!sound)throw Error('Son de jeu inconnu.');return sound;}
const normal=s=>String(s).toLowerCase().normalize('NFD').replace(/\p{M}/gu,'');
export function filterGameSounds(query='',category='all'){
 const words=normal(query).trim().split(/\s+/).filter(Boolean);
 return GAME_SOUNDS.filter(s=>(category==='all'||s.category===category)&&words.every(w=>normal(s.id+' '+s.name+' '+GAME_SOUND_CATEGORIES[s.category]).includes(w)));
}
export function renderGameSound(id,sampleRate=48000){
 const sound=gameSound(id);
 if(![44100,48000].includes(sampleRate))throw Error('Fréquence audio invalide.');
 const {duration,frequency:f,endFrequency:end,mode}=sound,length=Math.round(duration*sampleRate),pcm=new Float32Array(length),tau=Math.PI*2;
 let seed=sound.seed,low=0,crackle=0,total=0;
 for(let i=0;i<length;i++){
  seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;
  const noise=(seed>>>0)/2147483648-1,t=i/sampleRate,u=t/duration;
  low+=.035*(noise-low);crackle=crackle*.98+Math.max(0,noise-.975)*9;
  const phase=tau*(f*t+(end-f)*t*t/(2*duration)),sweep=Math.sin(phase);
  let value=0;
  if(mode==='chime'){
   const step=Math.min(3,Math.floor(u*4)),local=t-step*duration/4;
   const note=[f,f*1.25,f*1.5,end][step];
   value=(Math.sin(tau*note*local)+.2*Math.sin(tau*note*2*local))*Math.exp(-local*12)*Math.max(0,Math.min(1,local/.003,(duration/4-local)/.008));
  }else if(mode==='chirp')value=(sweep+.12*Math.sin(phase*2))*Math.exp(-u*3);
  else if(mode==='charge')value=(sweep*.6+Math.sin(phase+2*Math.sin(tau*17*t))*.25+low*.5)*(.2+.8*u);
  else if(mode==='thud')value=(sweep*.65+noise*.25+low*.5)*Math.exp(-u*9);
  else if(mode==='crunch')value=(noise*.55+low*.6+crackle*.2)*Math.exp(-u*5)*(1+.3*Math.sin(tau*31*t));
  else if(mode==='metal')value=(Math.sin(tau*f*t)+.5*Math.sin(tau*f*1.413*t)+.3*Math.sin(tau*end*t))*Math.exp(-u*6)+noise*.1*Math.exp(-u*20);
  else if(mode==='mechanism')value=(sweep*.3+Math.sin(phase*2)*.15+low)*(1+.2*Math.sin(tau*23*t));
  else if(mode==='wind')value=low*(1+.45*Math.sin(tau*.6*t))+.05*noise;
  else if(mode==='rain')value=.3*(noise-low)+low*.15;
  else if(mode==='fire')value=low*.65+noise*.08+crackle*.35;
  else if(mode==='hum')value=.5*Math.sin(tau*f*t)+.15*Math.sin(tau*end*t)+.07*Math.sin(tau*83*t)+low*.12;
  const attack=sound.category==='ambience'?.12:.003,release=sound.category==='ambience'?.16:.035;
  const envelope=Math.min(1,t/attack,(duration-t-1/sampleRate)/release);
  pcm[i]=value*Math.max(0,envelope);total+=pcm[i];
 }
 const mean=total/length;let peak=0;
 for(let i=0;i<length;i++){pcm[i]=(pcm[i]-mean)*Math.min(1,i/8,(length-1-i)/8);peak=Math.max(peak,Math.abs(pcm[i]));}
 for(let i=0;i<length;i++)pcm[i]*=.65/Math.max(peak,.000001);
 return {sampleRate,length,duration:length/sampleRate,numberOfChannels:1,getChannelData(channel){if(channel!==0)throw Error('Canal mono uniquement.');return pcm;}};
}
export function gameSoundWav(id){return encodeWav(renderGameSound(id),{bits:24});}
export function gameSoundFiles(query='',category='all'){
 const sounds=filterGameSounds(query,category);
 if(!sounds.length)throw Error('Aucun son à exporter.');
 const files=sounds.map(s=>({name:s.category+'/'+s.id+'.wav',data:gameSoundWav(s.id)}));
 const manifest={format:'warlike-game-sounds',version:1,origin:'WarLike Studio · original procedural synthesis',sampleRate:48000,bits:24,channels:1,sounds:sounds.map(s=>({id:s.id,name:s.name,category:s.category,file:s.category+'/'+s.id+'.wav',duration:s.duration,loop:false}))};
 files.push({name:'manifest.json',data:new TextEncoder().encode(JSON.stringify(manifest,null,2))});
 files.push({name:'README.txt',data:new TextEncoder().encode('WarLike Studio — Sons pour Engine\nSons originaux générés par synthèse, utilisables dans vos jeux et projets WarLike.\nWAV mono PCM 24 bits / 48 kHz, sans FX ni mastering de session.\nDécompressez ce pack, importez les WAV dans le projet Engine et affectez-les à vos sources audio.\nLe manifeste est un index documentaire ; il ne déclenche aucun import automatique.\nLes ambiances sont des extraits de 4 secondes avec fondus, pas des boucles sans raccord.\n')});
 return files;
}
export function gameSoundPack(query='',category='all'){return zipFiles(gameSoundFiles(query,category));}
