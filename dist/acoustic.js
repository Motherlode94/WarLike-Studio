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
const bankPresets={
 piano:[['Grand naturel',{}],['Marteaux de scène',{brightness:18000,tone:2.25,dynamics:.95,release:.65,width:.85}],['Grand nocturne',{brightness:6200,tone:-2.5,dynamics:.9,release:1.4,width:.7}],['Grand cinéma',{attack:.009,brightness:13500,release:2.4,dynamics:.55,width:1}]],
 upright:[['Droit intime',{}],['Salon feutré',{brightness:4100,tone:-3.25,dynamics:.95,release:.38,width:.3}],['Droit percussif',{brightness:12500,tone:1.5,release:.16,dynamics:.7,width:.45}],['Droit ouvert',{brightness:16000,tone:.75,release:.85,dynamics:.85,width:.8}]],
 epiano:[['FM velours',{}],['Tines R&B',{brightness:8500,tone:2.75,release:1.1,dynamics:.95,width:.8}],['FM rond',{brightness:2900,tone:-2,release:.42,dynamics:.65,width:.5}],['FM cristallin',{brightness:18000,tone:4,release:1.65,dynamics:.8,width:1}]],
 harp:[['Harpe de concert',{}],['Cordes de chambre',{brightness:7200,release:.65,dynamics:.95,width:.45}],['Harpe aérienne',{attack:.025,brightness:14000,tone:2,release:2.8,dynamics:.55,width:1}],['Harpe étouffée',{brightness:5200,tone:-2,release:.12,dynamics:.9,width:.35}]],
 marimba:[['Marimba naturel',{}],['Mailloches douces',{brightness:3600,tone:-3,release:.21,dynamics:.95,width:.55}],['Lames d’attaque',{brightness:15500,tone:3,release:.13,dynamics:.7,width:.75}],['Bois résonant',{brightness:8500,tone:-.75,release:.85,dynamics:.85,width:.9}]],
 vibes:[['Vibraphone doux',{}],['Jazz rapproché',{brightness:7800,tone:-1.25,release:.72,width:.45,dynamics:.95}],['Métal scintillant',{brightness:18000,tone:3.5,release:2.7,width:1,dynamics:.65}],['Lames étouffées',{brightness:9200,release:.09,width:.4,dynamics:.85}]],
 kalimba:[['Kalimba bois',{}],['Mbira proche',{brightness:10500,tone:1.25,release:.24,width:.15,dynamics:.95}],['Lames rondes',{brightness:3200,tone:-3.5,release:.65,width:.5,dynamics:.75}],['Kalimba éclat',{brightness:17000,tone:3,release:.95,width:.85,dynamics:.6}]],
 strum:[['Strumstick naturel',{}],['Cordes sèches',{brightness:11500,tone:1,release:.08,width:.2,dynamics:.95}],['Bois de salon',{brightness:4800,tone:-2.75,release:.36,width:.35,dynamics:.85}],['Cordes ouvertes',{brightness:16000,tone:2.5,release:1.15,width:.8,dynamics:.7}]],
 violin:[['Violon expressif',{}],['Archet intime',{attack:.055,brightness:6500,tone:-2,release:.18,width:.2,dynamics:.95}],['Violon lyrique',{attack:.095,brightness:12500,tone:.5,release:.6,width:.65,dynamics:.75}],['Archet incisif',{attack:.006,brightness:17000,tone:2.25,release:.07,width:.35,dynamics:.9}]],
 cello:[['Violoncelles ensemble',{}],['Pupitre sombre',{attack:.075,brightness:3700,tone:-3,release:.45,width:.55,dynamics:.9}],['Cordes de cinéma',{attack:.19,brightness:9500,tone:.75,release:1.4,width:1,dynamics:.6}],['Ensemble précis',{attack:.018,brightness:11500,tone:1.5,release:.09,width:.7,dynamics:.95}]],
 flute:[['Flûte naturelle',{}],['Souffle de chambre',{attack:.045,brightness:7300,tone:-1.5,release:.24,width:.25,dynamics:.95}],['Flûte brillante',{attack:.009,brightness:16500,tone:2,release:.11,width:.5,dynamics:.8}],['Flûte suspendue',{attack:.13,brightness:9200,tone:-.5,release:.75,width:.8,dynamics:.65}]],
 trumpet:[['Trompette ouverte',{}],['Cuivre doux',{attack:.035,brightness:4700,tone:-3.75,release:.28,width:.25,dynamics:1}],['Cuivre tranchant',{attack:.003,brightness:18000,tone:3,release:.075,width:.35,dynamics:.85}],['Trompette large',{attack:.07,brightness:11000,tone:1,release:.55,width:.9,dynamics:.65}]]
};
export const ACOUSTIC_PRESETS=Object.fromEntries(Object.entries(bankPresets).map(([id,presets])=>[id,presets.map(([name,values])=>({name,values}))]));
export function sampleSettings(type,values={}){const def=ACOUSTIC_INSTRUMENTS[type];if(!def)throw Error('Instrument échantillonné inconnu.');return Object.fromEntries(def.controls.map(c=>[c.key,Number.isFinite(values[c.key])?Math.max(c.min,Math.min(c.max,c.step===1?Math.round(values[c.key]):values[c.key])):c.default]));}
export function sampleZones(type,midi,velocity,params={}){
 const bank=ACOUSTIC_BANKS[type];if(!bank)throw Error('Banque inconnue.');const p=sampleSettings(type,params),note=Math.max(0,Math.min(127,midi+p.transpose)),v=Math.max(0,Math.min(1,Number.isFinite(velocity)?velocity:1));
 const roots=[...new Set(bank.samples.map(s=>s.root))],root=roots.reduce((best,n)=>Math.abs(n-note)<Math.abs(best-note)?n:best),zones=bank.samples.filter(s=>s.root===root).sort((a,b)=>a.layer-b.layer);
 const blend=Math.max(0,Math.min(1,(v-.2)/.65));return zones.map((zone,i)=>({...zone,rate:2**((note-root)/12),weight:zones.length===1?1:Math.sqrt(i?blend:1-blend)})).filter(s=>s.weight>0);
}
