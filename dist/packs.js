// CHAYAH originals. Functional references are described in docs; no vendor DSP/assets.
export const EFFECT_PACKS={
  vocal:{name:'Vocal Essentials',label:'VOCAL / CONTROL',color:'#88b8bf',description:'Sibilantes et passages calmes : deux outils pour préparer une voix avant le mix.',modules:['hush','sibil']},
  motion:{name:'Motion & Color',label:'CREATIVE / EFFECTS',color:'#cd9a7d',description:'Du grain, de la largeur et du mouvement pour les voix, instruments et batteries.',modules:['ember','orbit','sway','relay']}
};
export const PACK_EFFECTS={
  hush:{name:'HUSH',subtitle:'SOFT GATE',pack:'vocal',color:'#88b8bf',defaultEnabled:false,description:'Atténue les passages sous le seuil avec une transition douce. Response règle la vitesse de l’enveloppe ; Range fixe l’atténuation maximale.',controls:[
    {key:'threshold',name:'Threshold',min:-70,max:-15,step:1,default:-45,unit:'dB'},
    {key:'range',name:'Range',min:0,max:60,step:1,default:30,unit:'dB'},
    {key:'response',name:'Response',min:5,max:100,step:1,default:18,unit:'ms'}]},
  sibil:{name:'SIBIL',subtitle:'DYNAMIC DE-ESSER',pack:'vocal',color:'#88b8bf',defaultEnabled:false,description:'Atténuation dynamique d’une bande aiguë : Frequency cible les sifflantes, Threshold déclenche le traitement, Range limite la réduction.',controls:[
    {key:'frequency',name:'Frequency',min:3000,max:10000,step:100,default:6500,unit:'Hz'},
    {key:'threshold',name:'Threshold',min:-48,max:-6,step:1,default:-24,unit:'dB'},
    {key:'range',name:'Range',min:0,max:18,step:.5,default:8,unit:'dB'},
    {key:'mix',name:'Mix',min:0,max:1,step:.01,default:1,unit:'%'}]},
  ember:{name:'EMBER',subtitle:'CHARACTER SATURATOR',pack:'motion',color:'#cd9a7d',defaultEnabled:false,description:'Saturation asymétrique originale. Character fait varier la forme, Tone adoucit l’aigu, Mix et Output dosent le grain et le niveau.',controls:[
    {key:'drive',name:'Drive',min:0,max:24,step:.5,default:6,unit:'dB'},
    {key:'character',name:'Character',min:0,max:1,step:.01,default:.2,unit:'%'},
    {key:'tone',name:'Tone',min:800,max:18000,step:100,default:10000,unit:'Hz'},
    {key:'mix',name:'Mix',min:0,max:1,step:.01,default:.5,unit:'%'},
    {key:'output',name:'Output',min:-18,max:6,step:.5,default:-2,unit:'dB'}]},
  orbit:{name:'ORBIT',subtitle:'STEREO CHORUS',pack:'motion',color:'#b9a4d1',defaultEnabled:false,description:'Deux retards courts modulés en sens opposés créent un chorus stéréo. Width déploie les côtés ; Rate reste exprimé en Hz.',controls:[
    {key:'rate',name:'Rate',min:.05,max:4,step:.05,default:.35,unit:'Hz'},
    {key:'depth',name:'Depth',min:0,max:1,step:.01,default:.35,unit:'%'},
    {key:'width',name:'Width',min:0,max:1,step:.01,default:1,unit:'%'},
    {key:'mix',name:'Mix',min:0,max:1,step:.01,default:.3,unit:'%'}]},
  sway:{name:'SWAY',subtitle:'TREMOLO / AUTOPAN',pack:'motion',color:'#a3b98c',defaultEnabled:false,description:'Mouvement de volume et de panoramique commandé par un LFO. Depth règle le tremolo et Pan depth son déplacement stéréo.',controls:[
    {key:'rate',name:'Rate',min:.1,max:12,step:.1,default:2,unit:'Hz'},
    {key:'depth',name:'Depth',min:0,max:1,step:.01,default:.5,unit:'%'},
    {key:'pan',name:'Pan depth',min:0,max:1,step:.01,default:.6,unit:'%'},
    {key:'mix',name:'Mix',min:0,max:1,step:.01,default:1,unit:'%'}]},
  relay:{name:'RELAY',subtitle:'DUAL TEMPO ECHO',pack:'motion',color:'#d2b47f',defaultEnabled:false,description:'Deux retards croisés gauche/droite, avec répétitions filtrées. Time est un multiple de la noire ; le côté droit dure 1,5 fois le gauche.',controls:[
    {key:'beats',name:'Time',min:.125,max:2,step:.125,default:.5,unit:'beat'},
    {key:'feedback',name:'Feedback',min:0,max:.7,step:.01,default:.35,unit:'%'},
    {key:'tone',name:'Tone',min:800,max:16000,step:100,default:6000,unit:'Hz'},
    {key:'mix',name:'Mix',min:0,max:1,step:.01,default:.25,unit:'%'}]}
};
export const PACK_PRESETS={
  hush:[['Room Soft',{threshold:-50,range:18,response:25}],['Rap Gaps',{threshold:-42,range:36,response:12}],['Breath Keep',{threshold:-58,range:12,response:35}],['Tight Drums',{threshold:-35,range:48,response:6}],['Gentle Space',{threshold:-46,range:24,response:60}]],
  sibil:[['Soft Ess',{frequency:6500,threshold:-24,range:6}],['Rap Bright',{frequency:7000,threshold:-28,range:9}],['Low Sibilance',{frequency:4500,threshold:-26,range:7}],['Air Guard',{frequency:8500,threshold:-22,range:5}],['Strong Ess',{frequency:6000,threshold:-32,range:12}]],
  ember:[['Warm Console',{drive:4,character:.15,tone:14000,mix:.35,output:-2}],['Sand Drive',{drive:15,character:.5,tone:8500,mix:.65,output:-5}],['Dark Tape',{drive:8,character:.3,tone:4200,mix:.55,output:-3}],['Drum Heat',{drive:20,character:.65,tone:12000,mix:.45,output:-5}],['Fragile Tube',{drive:6,character:.8,tone:10000,mix:.4,output:-3}]],
  orbit:[['Vocal Width',{rate:.25,depth:.25,width:1,mix:.25}],['Slow Cloud',{rate:.1,depth:.65,width:1,mix:.4}],['Glass Chorus',{rate:1.2,depth:.35,width:.8,mix:.35}],['Tape Swim',{rate:.7,depth:.85,width:.6,mix:.55}],['Narrow Double',{rate:.35,depth:.15,width:.35,mix:.2}]],
  sway:[['Slow Pan',{rate:.4,depth:0,pan:.8,mix:1}],['Pulse Two',{rate:2,depth:.65,pan:0,mix:1}],['Orbit Rhythm',{rate:1.2,depth:.35,pan:.7,mix:.8}],['Chop Eight',{rate:8,depth:1,pan:.2,mix:1}],['Gentle Motion',{rate:.6,depth:.2,pan:.35,mix:.6}]],
  relay:[['Vocal Throw',{beats:.75,feedback:.35,tone:6000,mix:.22}],['Dub Room',{beats:1,feedback:.62,tone:2800,mix:.4}],['Wide Slap',{beats:.125,feedback:.08,tone:11000,mix:.25}],['Floating Dots',{beats:.5,feedback:.5,tone:8500,mix:.3}],['Dark Trails',{beats:1.5,feedback:.55,tone:1800,mix:.35}]]
};

export const packPresetBank=()=>Object.fromEntries(Object.entries(PACK_PRESETS).map(([id,list])=>[id,list.map(([name,values])=>({name,values:{...values}}))]));
export const gain=db=>10**(db/20);
export function gateControl(x,range){const floor=gain(-range),v=Math.max(0,Math.min(1,(Math.abs(x)-.2)/.3));return floor+(1-floor)*v*v*(3-2*v);}
export function deessControl(x,range,mix=1){const relative=Math.abs(x)*32,attenuation=relative<=1?1:Math.max(gain(-range),relative**(-5/6));return (attenuation-1)*mix;}
export function relayTimes(bpm,beats){return [60/bpm*beats,60/bpm*beats*1.5];}
export function packTail(project){let tail=4.5;for(const track of project.tracks){const e=track.effects?.relay;if(e?.enabled&&e.mix>0){const times=relayTimes(project.bpm,e.beats),repeats=e.feedback>0?Math.ceil(Math.log(.001)/Math.log(e.feedback)):1;tail=Math.max(tail,Math.min(20,Math.max(...times)*repeats));}}return tail;}
