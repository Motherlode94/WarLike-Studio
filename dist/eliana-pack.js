// ELIANA: four original gentle vocal/musical effects. No external DSP or vendor assets.
const c=(key,name,min,max,step,def,unit='')=>({key,name,min,max,step,default:def,unit});
const fx=(name,subtitle,description,controls)=>({name,subtitle,description,pack:'eliana',color:'#d9b9cf',defaultEnabled:false,controls});
export const ELIANA_EFFECTS={
 elianaveil:fx('ELIANA VEIL','SOFT VOCAL COLOR','Voile chaleureux : filtre coupe-bas doux, corps et haut du spectre délicat.',[
 c('lowcut','Low cut',20,240,5,70,'Hz'),c('warmth','Warmth',-3,4,.25,1,'dB'),c('air','Silk air',-4,3,.25,-.5,'dB'),c('mix','Mix',0,1,.01,.65,'%')]),
 elianaembrace:fx('ELIANA EMBRACE','GENTLE LEVELING','Compression musicale discrète à attaque souple, pour garder la respiration des voix.',[
 c('threshold','Threshold',-36,-4,.5,-19,'dB'),c('ratio','Ratio',1,4,.1,1.7,':1'),c('attack','Attack',5,80,1,32,'ms'),c('release','Release',80,650,10,240,'ms'),c('mix','Parallel',0,1,.01,.45,'%'),c('output','Trim',-6,6,.25,0,'dB')]),
 eliananest:fx('ELIANA NEST','TENDER ROOM','Petite chambre feutrée à échos courts et filtrés, pour envelopper sans noyer.',[
 c('size','Room size',25,125,1,70,'ms'),c('feedback','Decay',0,.48,.01,.2,'%'),c('tone','Tone',700,10000,100,3800,'Hz'),c('mix','Mix',0,.5,.01,.13,'%')]),
 elianaguard:fx('ELIANA GUARD','LINKED PEAK GUARD','Compression parallèle suivie d’un limiteur stéréo à anticipation. Ceiling fixe le plafond des échantillons, y compris à Mix zéro ; bypass désactive toute la protection. Mesure true-peak non revendiquée.',[
 c('threshold','Threshold',-18,-1,.25,-6,'dB'),c('ratio','Ratio',2,15,.5,8,':1'),c('attack','Attack',1,15,1,3,'ms'),c('release','Release',40,350,10,130,'ms'),c('mix','Comp mix',0,1,.01,1,'%'),c('ceiling','Ceiling',-6,-.1,.25,-1,'dB')])
};
export const ELIANA_PRESETS={
 elianaveil:[['Berceuse',{lowcut:65,warmth:1.5,air:-1,mix:.7}],['Voix de velours',{lowcut:80,warmth:2,air:-.25,mix:.55}],['Piano tendre',{lowcut:45,warmth:.5,air:-1.5,mix:.5}]],
 elianaembrace:[['Parole douce',{threshold:-19,ratio:1.6,attack:38,release:260,mix:.4}],['Chant protecteur',{threshold:-23,ratio:2,attack:28,release:190,mix:.55}],['Cordes délicates',{threshold:-16,ratio:1.4,attack:45,release:340,mix:.35}]],
 eliananest:[['Petit cocon',{size:60,feedback:.16,tone:3600,mix:.12}],['Nuage tendre',{size:115,feedback:.3,tone:5100,mix:.2}],['Chambre intime',{size:35,feedback:.1,tone:2900,mix:.08}]],
 elianaguard:[['Protection légère',{threshold:-5,ratio:6,attack:5,release:150,mix:.8,ceiling:-1}],['Voix protégée',{threshold:-7,ratio:9,attack:3,release:110,mix:1,ceiling:-1.5}],['Bus doux',{threshold:-9,ratio:4,attack:10,release:220,mix:.65,ceiling:-2}]]
};
export const ELIANA_PACK={name:'ELIANA',label:'ELIANA / DOUCEUR & PROTECTION',color:'#d9b9cf',
 description:'Quatre effets tendres pour les voix, les instruments et les ambiances, avec de la place pour la respiration.',modules:Object.keys(ELIANA_EFFECTS),instruments:[]};
