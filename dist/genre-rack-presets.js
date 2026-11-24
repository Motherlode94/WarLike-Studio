// Genres: real native DSP insert chains, never fake VST instances.
// These are starting points; the individual editor remains authoritative.
const preset=(genre,name,description,stages)=>({
 category:genre,genre,name:genre.toUpperCase()+' / '+name,description,
 stages:stages.map(([id,values])=>({id,values}))
});
export const GENRE_RACK_PRESETS=Object.freeze({
 trapVocal:preset('Trap','LEAD VOX','Voix devant la 808 : correction rapide, présence et slap.',[
  ['voxclean',{highpass:100,range:5}],['voxtune',{speed:12,amount:.9,mix:1}],
  ['voxlevel',{peakThreshold:-15,levelThreshold:-26,ratio:3}],
  ['sibil',{frequency:6800,range:5}],['voxambience',{slap:90,room:.12,mix:.15}]
 ]),
 drillVocal:preset('Drill','LEAD VOX','Voix dense, contrôlée et courte dans une production drill.',[
  ['voxclean',{highpass:105,range:5}],['voxtune',{speed:16,amount:.85,mix:.95}],
  ['vectorcomp',{threshold:-21,ratio:3,attack:16,release:120,mix:.85}],
  ['sibil',{frequency:6700,range:5}],['voxambience',{slap:80,room:.1,mix:.12}]
 ]),
 afroVocal:preset('Afrobeat','LEAD VOX','Voix chaude, naturelle et aérienne.',[
  ['voxclean',{highpass:90,range:4}],['voxtune',{speed:80,amount:.55,mix:.65}],
  ['voxlevel',{peakThreshold:-12,levelThreshold:-22,ratio:2}],
  ['voxaireq',{air:2,presence:1,mix:.8}],['voxambience',{slap:125,room:.3,mix:.22}]
 ]),
 amapianoVocal:preset('Amapiano','LEAD VOX','Voix douce avec espace et groove discret.',[
  ['voxclean',{highpass:95,range:4}],['voxlevel',{peakThreshold:-12,levelThreshold:-23,ratio:2}],
  ['sibil',{frequency:6800,range:4}],['voxaireq',{air:1.5,presence:.75,mix:.8}],
  ['voxambience',{slap:130,room:.36,mix:.24}]
 ]),
 rnbVocal:preset('R&B','SILK VOX','Dynamique douce, air et élargissement léger.',[
  ['voxclean',{highpass:75,range:3}],['voxlevel',{peakThreshold:-11,levelThreshold:-23,ratio:2}],
  ['voxwarm',{drive:3,mix:.2,output:-1}],['voxdoubler',{delay:24,detune:8,width:.8,mix:.18}],
  ['voxambience',{slap:118,room:.4,mix:.25}]
 ]),
 rockVocal:preset('Rock','LEAD VOX','Présence rock, maîtrise des sifflantes et grain contrôlé.',[
  ['voxclean',{highpass:95,range:4}],['sibil',{frequency:6700,range:5}],
  ['voxlevel',{peakThreshold:-16,levelThreshold:-24,ratio:3.4}],
  ['circuitcolor',{drive:3,mix:.18}],['voxambience',{slap:95,room:.18,mix:.14}]
 ]),
 popVocal:preset('Pop','LEAD VOX','Justesse progressive, présence et brillance.',[
  ['voxclean',{highpass:90,range:4}],['voxtune',{speed:35,amount:.8,mix:.9}],
  ['voxlevel',{peakThreshold:-13,levelThreshold:-23,ratio:2.6}],
  ['voxaireq',{presence:1.5,air:2.5}],['voxambience',{slap:109,room:.25,mix:.2}]
 ]),
 rumbaVocal:preset('Rumba','LEAD VOX','Voix souple et chaleureuse pour rumba congolaise.',[
  ['voxclean',{highpass:80,range:3}],['sibil',{frequency:6300,range:4}],
  ['voxlevel',{peakThreshold:-12,levelThreshold:-22,ratio:2.1}],
  ['circuiteq',{body:1,presence:1,air:.5}],['voxambience',{slap:115,room:.3,mix:.2}]
 ]),
 funkVocal:preset('Funk','LEAD VOX','Attaque intelligible, présence et room courte.',[
  ['voxclean',{highpass:105,range:4}],['vectorcomp',{threshold:-18,ratio:2,attack:25,release:140,mix:.7}],
  ['circuiteq',{body:-1,presence:1.5}],['voxambience',{slap:85,room:.12,mix:.14}]
 ]),
 gospelVocal:preset('Gospel','LEAD VOX','Voix expressive, dynamique naturelle et espace.',[
  ['voxclean',{highpass:85,range:3}],['voxlevel',{peakThreshold:-11,levelThreshold:-22,ratio:2}],
  ['voxaireq',{presence:1,air:1.5}],['voxambience',{slap:125,room:.42,mix:.26}]
 ]),
 danceVocal:preset('Dance','LEAD VOX','Voix présente et contrôlée pour dance électronique.',[
  ['voxclean',{highpass:105,range:5}],['voxtune',{speed:25,amount:.8,mix:.9}],
  ['vectorcomp',{threshold:-20,ratio:3,attack:16,release:140,mix:.85}],
  ['sibil',{frequency:7100,range:5}],['voxambience',{slap:112,room:.28,mix:.23}]
 ]),
 soulVocal:preset('Soul','LEAD VOX','Timbre naturel et saturation douce.',[
  ['voxclean',{highpass:75,range:3}],['voxlevel',{peakThreshold:-11,levelThreshold:-22,ratio:2}],
  ['voxwarm',{drive:2,mix:.16,output:-1}],['voxambience',{slap:124,room:.3,mix:.2}]
 ])
});
export const GENRE_RACK_CATEGORIES=Object.freeze(['Trap','Drill','Afrobeat','Amapiano','R&B','Rock','Pop','Rumba','Funk','Gospel','Dance','Soul']);
