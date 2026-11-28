// Original HARDI vocal processors; real Web Audio DSP, not a claimed AI singer or pitch-corrector.
const control=(key,name,min,max,step,def,unit='')=>({key,name,min,max,step,default:def,unit});
const effect=(name,subtitle,description,controls)=>({name,subtitle,description,pack:'hardi-vocal',color:'#c2a8c9',defaultEnabled:false,controls});
export const HARDI_VOCAL_EFFECTS={
 hardivoice:effect('HARDI VOICE','VOCAL TONE / AIR','Trois bandes de présence, coupe-bas et air pour la voix enregistrée.',[
  control('highpass','Low cut',40,350,5,85,'Hz'),control('body','Body',-9,9,.5,0,'dB'),control('presence','Presence',-9,9,.5,1.5,'dB'),control('air','Air',-9,9,.5,1,'dB'),control('mix','Mix',0,1,.01,1,'%')]),
 hardivocalcomp:effect('HARDI VOCALCOMP','VOCAL LEVELER','Compression transparente pour couplets et refrains, attaque et release réglables.',[
  control('threshold','Threshold',-50,0,.5,-22,'dB'),control('ratio','Ratio',1,10,.1,3,':1'),control('attack','Attack',1,80,1,12,'ms'),control('release','Release',30,600,10,130,'ms'),control('mix','Parallel',0,1,.01,.75,'%'),control('output','Make-up',-12,9,.5,0,'dB')]),
 hardideess:effect('HARDI DEESS','DYNAMIC SIBILANCE','Compression de la bande aiguë sur une séparation complémentaire. La bande grave reste alignée ; sous le seuil, les bandes reconstruisent le signal sans coloration.',[
  control('frequency','Sibilance',3500,10500,100,6500,'Hz'),control('threshold','Threshold',-50,-6,.5,-24,'dB'),control('ratio','Reduction',1,12,.5,5,':1'),control('mix','Mix',0,1,.01,.7,'%')]),
 hardidoubler:effect('HARDI DOUBLER','VOCAL MICRO DELAYS','Deux doublures légèrement décalées et panoramisées, compatibles avec une voix lead centrale.',[
  control('delay','Delay',12,55,1,28,'ms'),control('width','Width',0,1,.01,.7,'%'),control('mix','Mix',0,1,.01,.18,'%'),control('tone','Tone',1400,12000,100,7000,'Hz'),{key:'detune',name:'Detune',min:0,max:1,step:0.01,default:0,unit:'%'}])
};
export const HARDI_VOCAL_PRESETS={
 hardivoice:[['Clarté R&B',{highpass:90,body:.5,presence:1.5,air:2,mix:.85}],['Chant intime',{highpass:70,body:1.5,presence:0,air:.5,mix:.7}],['Pop scintillante',{highpass:110,body:-1,presence:2,air:3,mix:.75}]],
 hardivocalcomp:[['Lead stable',{threshold:-22,ratio:2.5,attack:15,release:150,mix:.7}],['Refrain large',{threshold:-20,ratio:3.2,attack:9,release:100,mix:.6}],['Rap doux',{threshold:-27,ratio:3.8,attack:5,release:85,mix:.65}]],
 hardideess:[['S doux',{frequency:6500,threshold:-25,ratio:4,mix:.6}],['Voix brillante',{frequency:8000,threshold:-22,ratio:5,mix:.7}],['Sifflantes fortes',{frequency:5500,threshold:-30,ratio:8,mix:.85}]],
 hardidoubler:[['Doux stéréo',{delay:24,width:.65,mix:.14,tone:8000}],['Refrain aérien',{delay:36,width:.95,mix:.25,tone:9500}],['Écho court',{delay:44,width:.35,mix:.22,tone:4800}]]
};
export const HARDI_VOCAL_PACK={name:'HARDI Vocal',label:'HARDI / 4 VOCAL FX',description:'Égalisation vocale, compression, dé-essing et doublage, traitement audio original.',color:'#c2a8c9',modules:Object.keys(HARDI_VOCAL_EFFECTS),instruments:[]};
