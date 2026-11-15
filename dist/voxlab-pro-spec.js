// VOX LAB PRO — original WarLike vocal-suite product specification.
// NOT merged into STUDIO_EFFECTS: adding an effect without real DSP would
// turn it into an inaudible/bypassed insert. Promote one module at a time
// only after a real createStudioEffects/syncStudioEffect implementation and tests.
const c=(key,name,min,max,step,value,unit)=>({key,name,min,max,step,default:value,unit});
const db=(key,name,min,max,value)=>c(key,name,min,max,.5,value,'dB');
const pct=(key,name,value=0)=>c(key,name,0,1,.01,value,'%');
const ms=(key,name,min,max,value)=>c(key,name,min,max,1,value,'ms');
const effect=(name,subtitle,description,processor,controls)=>({name,subtitle,pack:'voxpro',color:'#d9a0ee',defaultEnabled:false,description,processor,controls});
export const VOXPRO_MODULES={
 voxtunelive:effect('VOX TUNE LIVE','MONOPHONIC PITCH','Retune monophonique basse latence. Préserver consonnes, phases et formants nécessite des essais audio réels.','worklet-pitch',[c('key','Key',0,11,1,9,'key'),c('scale','Scale',0,2,1,0,'scale'),ms('speed','Retune',0,250,35),pct('amount','Amount',1),pct('humanize','Humanize',.25),pct('mix','Mix',1)]),
 voxtunegraph:effect('VOX TUNE GRAPH','OFFLINE NOTE EDITOR','Édition hors ligne note par note : nécessite une interface d’édition et un rendu non destructif, pas un simple insert audio.','offline-editor',[c('snap','Snap',0,1,.01,.8,'%'),pct('drift','Drift',.5),ms('transition','Transition',5,250,45),pct('amount','Amount',1),c('formant','Formant',-12,12,.1,0,'st')]),
 voxharmony:effect('VOX HARMONY','MULTIVOICE HARMONIES','Voix harmonisées pilotées par gamme/accord, avec indépendance de hauteur et contrôle des formants.','multivoice-worklet',[c('voices','Voices',1,8,1,4,'voices'),c('interval','Interval',-12,12,1,4,'st'),pct('humanize','Humanize',.2),c('timing','Timing',0,70,1,15,'ms'),pct('spread','Spread',.65),pct('mix','Mix',.35)]),
 voxdoubler:effect('VOX DOUBLER','STEREO VOICE DOUBLER','Retards et micro-modulations pour épaissir les voix sans reproduction parfaite de doubles réels.','native-delay',[c('voices','Voices',1,4,1,2,'voices'),c('detune','Detune',0,30,1,8,'ct'),ms('delay','Delay',8,70,24),pct('width','Width',.7),pct('mix','Mix',.3)]),
 voxmicmodel:effect('VOX MIC COLOR','SOURCE / TARGET TONE','Profils tonaux génériques ; aucune émulation revendiquée d’un microphone propriétaire.','eq-color',[c('source','Source',0,3,1,0,'profile'),c('target','Target',0,3,1,1,'profile'),db('proximity','Proximity',-9,9,0),db('presence','Presence',-9,9,0),db('air','Air',-9,9,0),pct('mix','Mix',1)]),
 voxhroat:effect('VOX THROAT','FORMANT CHARACTER','Transformation timbrale par décalage des formants, indépendante du pitch, nécessitant DSP temps réel.','formant-worklet',[c('formant','Formant',-7,7,.1,0,'st'),pct('body','Body',.5),pct('breath','Breath',.1),pct('mix','Mix',1)]),
 voxair:effect('VOX BREATH','BREATH / AIR CONTROL','Contrôle fréquentiel et dynamique du souffle ; pas de séparation neuronale des sources.','spectral-dynamics',[c('frequency','Air Band',2500,14000,100,7500,'Hz'),db('threshold','Threshold',-60,0,-30),db('range','Range',-18,18,0),pct('amount','Amount',.4),pct('mix','Mix',1)]),
 voxsybil:effect('VOX SIBIL','DYNAMIC DE-ESS','Dé-esseur dynamique avec écoute de bande et réduction limitée.','band-dynamics',[c('frequency','Frequency',3000,12000,100,6500,'Hz'),db('threshold','Threshold',-60,-3,-25),c('range','Range',0,18,.5,6,'dB'),ms('release','Release',20,350,100),pct('mix','Mix',1)]),
 voxcleanpro:effect('VOX CLEAN PRO','VOCAL PREP','Coupe-bas, atténuation de bas-médiums et gate doux ; aucun débruitage IA affirmé.','filter-gate',[c('highpass','Low Cut',35,350,5,85,'Hz'),db('mud','Mud',-12,0,-2),db('gate','Gate',-65,-15,-45),db('range','Range',0,40,12),pct('mix','Mix',1)]),
 voxlevelpro:effect('VOX LEVEL PRO','PEAK / PHRASE LEVEL','Compresseur de crêtes suivi de nivellement de phrase avec dry aligné.','dual-compressor',[db('peakThreshold','Peak Threshold',-45,0,-14),db('levelThreshold','Level Threshold',-50,0,-24),c('ratio','Ratio',1,8,.1,2.5,':1'),ms('release','Release',40,800,240),pct('mix','Mix',1),db('output','Output',-12,12,0)]),
 voxwarm:effect('VOX WARM','VOCAL HARMONICS','Coloration harmonique originale avec contrôle de niveau en sortie.','waveshaper',[c('drive','Drive',0,18,.5,3,'dB'),c('bias','Bias',-1,1,.01,.1,'%'),c('tone','Tone',1500,18000,100,10000,'Hz'),pct('mix','Mix',.25),db('output','Output',-18,6,-1)]),
 voxmutate:effect('VOX MUTATE','CREATIVE VOICE FX','Pitch et formants créatifs, hors traitement vocal naturel.','creative-worklet',[c('pitch','Pitch',-24,24,1,0,'st'),c('formant','Formant',-12,12,.1,0,'st'),pct('texture','Texture',.25),pct('width','Width',.4),pct('mix','Mix',.5)])
};
export const VOXPRO_PACK={
 name:'VOX LAB PRO',label:'VOCAL SUITE / CRÉATION & FINITION',color:'#d9a0ee',
 description:'Suite originale WarLike : plan produit de 12 traitements vocaux. Certains nécessitent encore des processeurs ou éditeurs dédiés.',
 modules:Object.keys(VOXPRO_MODULES)
};
export const VOXPRO_SIGNAL_ORDER=[
 ['preparation',['voxmicmodel','voxcleanpro','voxsybil']],
 ['pitch-and-timbre',['voxtunelive','voxtunegraph','voxhroat']],
 ['harmonies-and-doubles',['voxharmony','voxdoubler']],
 ['dynamics-and-color',['voxlevelpro','voxwarm']],
 ['creative-and-air',['voxmutate','voxair']]
];
// Modules that can already be used as ORIGINAL Web Audio effects in Studio.
// This starter chain is intentionally distinct from the 12 future dedicated
// VOXPRO_MODULES ids; no nonfunctional processor is registered as usable.
export const VOXPRO_STARTER_MODULES=['voxclean','sibil','voxtune','voxlevel','alterdouble','circuitcolor','exoair'];
