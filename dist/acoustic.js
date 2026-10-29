import {ACOUSTIC_BANKS} from './acoustic-manifest.js?v=0.14.0';
export {ACOUSTIC_BANKS};
const specs=[
 ['piano','GRAND','PIANO À QUEUE','#d5c49b',1.1,'Piano à queue Kawai : deux nuances enregistrées sur la majeure partie du clavier, attaque de marteau et décroissance naturelle.'],
 ['upright','UPRIGHT','PIANO DROIT','#b89b7d',.65,'Piano droit Yamaha : une autre caisse, un grain plus proche et deux nuances enregistrées.'],
 ['epiano','FM KEYS','PIANO ÉLECTRIQUE FM','#a3c2c7',.75,'Clavier FM TX81Z enregistré : attaque métallique et corps doux pour les accords R&B.'],
 ['harp','HARP','HARPE DE CONCERT','#c5b68a',1.2,'Cordes de harpe réellement pincées, avec résonances et décroissance enregistrées.'],
 ['marimba','MARIMBA','LAMES DE BOIS','#c29473',.35,'Marimba acoustique : attaque de mailloche et résonance du bois.'],
 ['vibes','VIBES','VIBRAPHONE','#9bbed0',1.1,'Vibraphone aux mailloches douces : lames métalliques et longue résonance.'],
 ['kalimba','KALIMBA','KALIMBA / MBIRA','#c6ac7f',.5,'Kalimba kényane enregistrée : lames pincées, bruit de doigt et corps boisé.'],
 ['strum','STRUM','STRUMSTICK PINCÉ','#bda38a',.45,'Strumstick acoustique à trois cordes, joué aux doigts.'],
 ['violin','VIOLIN','VIOLON SOLO','#bd9db3',.23,'Violon solo à l’archet avec vibrato enregistré et sustain bouclé.'],
 ['cello','CELLO','ENSEMBLE DE VIOLONCELLES','#a9a4cd',.3,'Ensemble de violoncelles à l’archet, avec vibrato enregistré et sustain bouclé.'],
 ['flute','FLUTE','FLÛTE TRAVERSIÈRE','#9abfad',.18,'Flûte traversière enregistrée : souffle, attaque naturelle et sustain bouclé.'],
 ['trumpet','TRUMPET','TROMPETTE','#cbb07b',.17,'Trompette acoustique enregistrée, attaque cuivrée et sustain bouclé.']
];
export const ACOUSTIC_INSTRUMENTS=Object.fromEntries(specs.map(([id,name,subtitle,color,release,description])=>[id,{name,subtitle,color,description,sampled:true,controls:[
 {key:'brightness',name:'Brillance',min:500,max:18000,step:50,default:16000,unit:'Hz'},
 {key:'tone',name:'Couleur',min:-8,max:8,step:.25,default:0,unit:'dB'},
 {key:'attack',name:'Attaque',min:.001,max:.8,step:.001,default:.001,unit:'s'},
 {key:'release',name:'Relâchement',min:.05,max:3,step:.01,default:release,unit:'s'},
 {key:'dynamics',name:'Dynamique',min:0,max:1,step:.01,default:.8,unit:'%'},
 {key:'width',name:'Largeur',min:0,max:1,step:.01,default:1,unit:'%'},
 {key:'transpose',name:'Transposition',min:-24,max:24,step:1,default:0,unit:'st'},
 {key:'output',name:'Sortie',min:-18,max:6,step:.25,default:0,unit:'dB'}
]}]));
export const ACOUSTIC_PRESETS=Object.fromEntries(specs.map(([id,name,,color,release])=>[id,[
 {name:({piano:'Grand naturel',upright:'Droit intime',epiano:'FM velours',harp:'Harpe de concert',marimba:'Marimba naturel',vibes:'Vibraphone doux',kalimba:'Kalimba bois',strum:'Strumstick naturel',violin:'Violon expressif',cello:'Violoncelles ensemble',flute:'Flûte naturelle',trumpet:'Trompette ouverte'})[id],values:{}},
 {name:name+' · Feutré',values:{brightness:3400,tone:-4,release:Math.min(3,release*1.35),dynamics:.9}},
 {name:name+' · Brillant',values:{brightness:18000,tone:3.5,release:Math.max(.05,release*.8),dynamics:.65}},
 {name:name+' · Lent',values:{attack:.16,brightness:6500,tone:-1,release:Math.min(3,release*1.8)}}
]]));
export function sampleSettings(type,values={}){const def=ACOUSTIC_INSTRUMENTS[type];if(!def)throw Error('Instrument échantillonné inconnu.');return Object.fromEntries(def.controls.map(c=>[c.key,Number.isFinite(values[c.key])?Math.max(c.min,Math.min(c.max,c.step===1?Math.round(values[c.key]):values[c.key])):c.default]));}
export function sampleZones(type,midi,velocity,params={}){
 const bank=ACOUSTIC_BANKS[type];if(!bank)throw Error('Banque inconnue.');const p=sampleSettings(type,params),note=Math.max(0,Math.min(127,midi+p.transpose)),v=Math.max(0,Math.min(1,Number.isFinite(velocity)?velocity:1));
 const roots=[...new Set(bank.samples.map(s=>s.root))],root=roots.reduce((best,n)=>Math.abs(n-note)<Math.abs(best-note)?n:best),zones=bank.samples.filter(s=>s.root===root).sort((a,b)=>a.layer-b.layer);
 const blend=Math.max(0,Math.min(1,(v-.2)/.65));return zones.map((zone,i)=>({...zone,rate:2**((note-root)/12),weight:zones.length===1?1:Math.sqrt(i?blend:1-blend)})).filter(s=>s.weight>0);
}
