// HARDI: original first-party synthesis and signal processors, no external VSTs.
const c=(key,name,min,max,step,def,unit='')=>({key,name,min,max,step,default:def,unit});
const common=[c('attack','Attack',.002,1,.001,.02,'s'),c('release','Release',.04,4,.01,.6,'s'),c('tone','Tone',300,12000,50,6200,'Hz'),c('body','Body',0,1,.01,.6,'%'),c('motion','Motion',0,1,.01,.25,'%'),c('output','Output',-24,3,.5,-12,'dB')];
const ins=(name,subtitle,description,family,defaults={})=>({name,subtitle,description,family,pack:'hardi-instruments',color:'#a6b9c6',controls:common.map(k=>({...k,...(Object.hasOwn(defaults,k.key)?{default:defaults[k.key]}:{})}))});
export const HARDI_INSTRUMENTS={
 hardiharpa:ins('HARDI HARPA','HARP / PLUCK','Harpes pincées avec harmoniques et décroissance expressive.','Cordes',{attack:.006,release:1.1,tone:7200}),
 hardimbira:ins('HARDI MBIRA','LAMELLOPHONE','Lames métalliques à partiels inharmoniques.','Percussions',{attack:.004,release:1.2,tone:6600}),
 hardicelesta:ins('HARDI CELESTA','BELL KEYS','Célesta et carillons à attaques douces.','Claviers',{attack:.008,release:1.5,tone:8200}),
 hardimallet:ins('HARDI MALLET','WOODEN MALLETS','Marimba et maillets accordés aux résonances boisées.','Percussions',{attack:.003,release:.55,tone:3800}),
 hardiflute:ins('HARDI FLUTE','BREATHY WIND','Flûte synthétisée avec souffle et vibrato subtil.','Vents',{attack:.09,release:.35,tone:6700}),
 hardireed:ins('HARDI REED','REED WIND','Anche douce avec partiels cuivrés et vibrato.','Vents',{attack:.065,release:.42,tone:4400}),
 hardibrass:ins('HARDI BRASS','BRASS ENSEMBLE','Cuivres synthétiques avec filtre dynamique sensible à la vélocité.','Cuivres',{attack:.10,release:.65,tone:4000,body:.75}),
 hardistrings:ins('HARDI STRINGS','STRING ENSEMBLE','Cordes orchestrales multi-oscillateurs avec évolution des harmoniques.','Cordes',{attack:.3,release:1.6,tone:5600}),
 hardichoira:ins('HARDI CHOIRA','VOWEL PAD','Nappe chorale synthétique sans samples ni voix humaines.','Nappes',{attack:.42,release:1.8,tone:3900}),
 hardisoul:ins('HARDI SOUL','SOUL ORGAN','Orgue additif chaud et expressif.','Claviers',{attack:.012,release:.3,tone:5200,body:.8}),
 hardipulse:ins('HARDI PULSE','ANALOG PLUCK','Pluck analogique filtré et animé, adapté aux séquences et arpèges.','Synthés',{attack:.004,release:.26,tone:7200,motion:.5}),
 hardiambient:ins('HARDI AMBIENT','CINEMATIC PAD','Textures évolutives avec couches harmoniques et mouvement panoramique.','Synthés',{attack:.62,release:2.2,tone:4600,motion:.7})
};
const fx=(name,subtitle,description,controls)=>({name,subtitle,description,controls,color:'#adbbc2',pack:'hardi-mix-master',defaultEnabled:false});
export const HARDI_EFFECTS={
 harditilt:fx('HARDI TILT','MIX / MASTER EQ','Tilt spectral doux pour ouvrir ou réchauffer un bus.',[c('tilt','Tilt',-6,6,.25,0,'dB'),c('pivot','Pivot',350,4000,50,1200,'Hz'),c('mix','Mix',0,1,.01,1,'%'),c('output','Trim',-12,6,.25,0,'dB')]),
 hardibus:fx('HARDI BUS','PARALLEL BUS COMP','Compression parallèle de bus, drums ou master.',[c('threshold','Threshold',-40,0,.5,-18,'dB'),c('ratio','Ratio',1,8,.1,2,':1'),c('attack','Attack',1,100,1,30,'ms'),c('release','Release',30,900,10,180,'ms'),c('mix','Parallel',0,1,.01,.5,'%'),c('output','Makeup',-12,12,.25,0,'dB')]),
 hardistage:fx('HARDI STAGE','STEREO MATRIX','Contrôle du centre et de la largeur mid/side avec repli mono.',[c('width','Width',0,1.5,.01,1,'%'),c('mix','Mix',0,1,.01,1,'%'),c('output','Trim',-12,6,.25,0,'dB')]),
 harditape:fx('HARDI TAPE','TAPE SATURATION','Saturation douce oversamplée et filtre tonal compensé.',[c('drive','Drive',0,18,.25,3,'dB'),c('tone','Tone',1200,18000,100,10000,'Hz'),c('mix','Mix',0,1,.01,.3,'%'),c('output','Trim',-12,6,.25,-1,'dB')])
};
const bank=(rows)=>Object.fromEntries(Object.entries(rows).map(([id,arr])=>[id,arr.map(([name,values])=>({name,values}))]));
export const HARDI_INSTRUMENT_PRESETS=bank({
 hardiharpa:[['Golden Harp',{tone:7200,release:1.2}],['Velvet Pluck',{tone:3500,release:1.6,body:.8}],['Bright Arpeggio',{tone:9700,release:.5,body:.3}]],
 hardimbira:[['Silver Tines',{tone:7600,release:.9}],['Low Mbira',{tone:2300,release:1.4,body:.9}],['Soft Kalimba',{tone:4900,release:.6,body:.45}]],
 hardicelesta:[['Glass Stars',{tone:9500,release:1.7}],['Velvet Bell',{tone:4200,release:2.4,body:.7}],['Tiny Bells',{tone:10500,release:.6}]],
 hardimallet:[['Wooden Marimba',{tone:3400,release:.5}],['Deep Mallet',{tone:1700,body:.85,release:.85}],['Bright Xylo',{tone:9700,body:.3,release:.28}]],
 hardiflute:[['Air Flute',{tone:6500,attack:.09}],['Dark Woodwind',{tone:2800,attack:.15,body:.8}],['Solo Whisper',{tone:9000,attack:.16,body:.35}]],
 hardireed:[['Warm Reed',{tone:4000}],['Bright Reed',{tone:7800,body:.8}],['Hollow Wind',{tone:2300,release:.8}]],
 hardibrass:[['Soul Brass',{tone:3900,attack:.1}],['Pop Horns',{tone:8000,attack:.025}],['Cinematic Swell',{tone:2500,attack:.45,release:1.8}]],
 hardistrings:[['Film Strings',{tone:5900,attack:.32,release:1.8}],['Warm Chamber',{tone:2900,attack:.55,release:2.4}],['Staccato',{tone:8500,attack:.015,release:.25}]],
 hardichoira:[['Ah Cloud',{tone:4300,attack:.48}],['Oh Dream',{tone:2400,attack:.65,release:2.5}],['Air Choir',{tone:7300,attack:.8,body:.3}]],
 hardisoul:[['Soul Drawbars',{tone:4800,body:.85}],['Gospel Bright',{tone:9000,body:.7}],['Warm Jazz',{tone:2500,body:.9}]],
 hardipulse:[['Neon Pluck',{tone:7700,release:.22}],['Soft Motion',{tone:3300,release:.65,motion:.8}],['Sharp Sequence',{tone:10000,release:.14,motion:.45}]],
 hardiambient:[['Wide Horizon',{tone:4600,attack:.6,release:2.2}],['Dark Film',{tone:1800,attack:.9,release:2.8}],['Shimmer Drift',{tone:10000,attack:.38,motion:.85}]]
});
export const HARDI_EFFECT_PRESETS=bank({
 harditilt:[['Open Air',{tilt:2,pivot:1900,mix:.75}],['Warm Master',{tilt:-1.5,pivot:900,mix:.75}],['Neutral',{tilt:0,mix:1}]],
 hardibus:[['Mix Glue',{threshold:-18,ratio:1.7,attack:30,release:180,mix:.45}],['Drum Cohesion',{threshold:-24,ratio:3,attack:20,release:110,mix:.65}],['Master Gentle',{threshold:-12,ratio:1.5,attack:45,release:240,mix:.35}]],
 hardistage:[['Natural Stereo',{width:1,mix:1}],['Wide Atmosphere',{width:1.25,mix:.7}],['Mono Check',{width:0,mix:1}]],
 harditape:[['Warm Glue',{drive:3,tone:9000,mix:.27}],['Vintage Color',{drive:8,tone:5800,mix:.4}],['Soft Master',{drive:1.5,tone:14000,mix:.18}]]
});
export const HARDI_PACKS={
 'hardi-instruments':{name:'HARDI Instruments',label:'HARDI / 12 INSTRUMENTS',color:'#a6b9c6',description:'Douze instruments natifs à synthèses différenciées.',instruments:Object.keys(HARDI_INSTRUMENTS),modules:[]},
 'hardi-mix-master':{name:'HARDI Mix & Master',label:'HARDI / 4 MIX & MASTER',color:'#a6b9c6',description:'Quatre processeurs natifs pour pistes, bus et mastering.',instruments:[],modules:Object.keys(HARDI_EFFECTS)}
};
