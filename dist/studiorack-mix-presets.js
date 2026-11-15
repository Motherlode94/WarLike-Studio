// Factory presets for the LIVE Studio inserts. Standalone catalog only:
// these presets do NOT modify public demo projects or automatically load on a track.
// Order is signal-flow order (left to right in the rack).
const rack=(name,category,description,stages)=>({name,category,description,stages:stages.map(([id,values={}])=>({id,values}))});
export const STUDIORACK_MIX_PRESETS=Object.freeze({
 rockLead:rack('ROCK / LEAD VOX','Voix','Présence rock, compression soutenue et pièce courte.',[
  ['voxclean',{highpass:95,range:4}],['sibil',{frequency:6700,range:5}],['voxlevel',{peakThreshold:-16,levelThreshold:-24,ratio:3.4}],['circuitcolor',{drive:3,mix:.18}],['voxaireq',{presence:2,air:1,mix:.85}],['voxambience',{slap:95,room:.18,mix:.14}]
 ]),
 popLead:rack('POP / LEAD VOX','Voix','Justesse progressive, équilibre de niveau et air propre.',[
  ['voxclean',{highpass:90,range:4}],['voxtune',{speed:35,amount:.8,mix:.9}],['sibil',{frequency:7200,range:5}],['voxlevel',{peakThreshold:-13,levelThreshold:-23,ratio:2.6}],['voxaireq',{presence:1.5,air:2.5}],['voxambience',{slap:109,room:.25,mix:.2}]
 ]),
 rumbaLead:rack('RUMBA / LEAD VOX','Voix','Voix chaude en avant, dynamique douce et profondeur discrète.',[
  ['voxclean',{highpass:80,range:3}],['sibil',{frequency:6300,range:4}],['voxlevel',{peakThreshold:-12,levelThreshold:-22,ratio:2.1}],['circuiteq',{body:1,presence:1,air:.5}],['voxambience',{slap:115,room:.3,mix:.2}]
 ]),
 backingVocals:rack('BACKING / HARMONIES','Voix','Chœurs élargis sans déséquilibrer le centre.',[
  ['voxclean',{highpass:115,range:5}],['sibil',{range:5}],['vectorcomp',{threshold:-22,ratio:2.5,mix:.9}],['voxdoubler',{voices:2,detune:7,delay:25,width:.75,mix:.26}],['exospace',{mix:.18}]
 ]),
 adlibs:rack('TRAP / ADLIBS','Voix','Effets parallèles et ponctuation stéréo pour ad-libs.',[
  ['voxclean',{highpass:130,range:7}],['vectorcomp',{threshold:-24,ratio:3.5}],['alterdouble',{mix:.3}],['alterecho',{mix:.2,feedback:.33}],['exospace',{mix:.1}]
 ]),
 spoken:rack('SPOKEN / PODCAST','Voix','Voix parlée intelligible avec peu d’effets de spatialisation.',[
  ['voxclean',{highpass:75,range:6}],['sibil',{frequency:6700,range:6}],['voxlevel',{peakThreshold:-15,levelThreshold:-24,ratio:2.8}],['voxaireq',{presence:1,air:.75,mix:.8}]
 ]),
 rockGuitar:rack('ROCK / GUITAR BUS','Guitares','Contrôle des médiums, saturation modérée et compression de bus.',[
  ['circuiteq',{body:-1,presence:1.5}],['circuitcolor',{drive:2,mix:.18}],['circuitbus',{threshold:-18,ratio:2,attack:30,release:180,mix:.85}]
 ]),
 guitarClean:rack('CLEAN / ACOUSTIC','Guitares','Guitare acoustique et électrique claire, sans effet agressif.',[
  ['circuiteq',{body:-1,air:1}],['vectorcomp',{threshold:-19,ratio:2,attack:24,release:180,mix:.65}],['voxambience',{slap:100,room:.2,mix:.12}]
 ]),
 rumbaGuitar:rack('RUMBA / GUITARES','Guitares','Sébène et contretemps : présence, attaque et petite pièce.',[
  ['circuiteq',{body:-1.5,presence:2}],['vectorcomp',{threshold:-19,ratio:2,attack:28,release:140,mix:.65}],['voxambience',{slap:83,feedback:.06,room:.15,mix:.12}]
 ]),
 bass808:rack('808 / SUB BASS','Basse','Assise grave maîtrisée avec saturation harmonique subtile.',[
  ['vectoreq',{g0:-1,g2:-2}],['vectorcomp',{threshold:-16,ratio:2.5,attack:20,release:140,mix:.7}],['circuitcolor',{drive:3,mix:.15}]
 ]),
 bassLive:rack('LIVE / BASS','Basse','Stabilisation du niveau d’une basse électrique ou acoustique.',[
  ['circuiteq',{body:1,presence:.5}],['vectorcomp',{threshold:-21,ratio:3,attack:25,release:170,mix:.8}],['circuitcolor',{drive:2,mix:.12}]
 ]),
 drumBus:rack('DRUM BUS / PUNCH','Batterie','Transitoires et cohésion de la batterie, traitement modéré.',[
  ['circuiteq',{body:1,presence:1}],['circuitbus',{threshold:-18,ratio:3,attack:30,release:125,mix:.75}],['circuitcolor',{drive:2.5,mix:.16}]
 ]),
 percussionAfro:rack('AFRO / PERCUSSIONS','Batterie','Attaque des percussions, mouvement léger et espace court.',[
  ['vectoreq',{g1:-1,g3:1}],['vectorcomp',{threshold:-19,ratio:2,attack:24,release:120,mix:.65}],['voxambience',{slap:95,room:.2,mix:.12}]
 ]),
 pianoKeys:rack('PIANO / KEYS','Instruments','Nettoyage des bas médiums et dynamique douce du clavier.',[
  ['vectoreq',{g1:-1.5,g4:1}],['vectorcomp',{threshold:-20,ratio:2,attack:32,release:240,mix:.6}],['exospace',{mix:.14}]
 ]),
 synthPad:rack('SYNTH / PADS','Instruments','Couleur large et espace contrôlé sur nappes.',[
  ['alterfilter',{mix:.25}],['voxaireq',{air:1.5,mix:.65}],['exospace',{mix:.25}]
 ]),
 mixBus:rack('MIX BUS / GLUE','Bus','Mixage général : corrections discrètes, colle et garde-fou léger.',[
  ['vectoreq',{g1:-.5,g5:.5}],['circuitbus',{threshold:-12,ratio:1.5,attack:35,release:200,mix:.75}],['circuitcolor',{drive:1,mix:.09}]
 ]),
 vocalBus:rack('VOCAL BUS / GROUP','Bus','Groupe voix : contrôle des crêtes et de la présence.',[
  ['vectoreq',{g1:-1,g4:1}],['vectorcomp',{threshold:-16,ratio:2,attack:28,release:165,mix:.75}],['sibil',{range:3}],['voxaireq',{air:1,mix:.8}]
 ]),
 masterClean:rack('MASTER / CLEAN','Master','Pré-master sobre avec limiteur de crête, sans loudness garanti.',[
  ['vectoreq',{g1:-.5,g5:.5}],['vectorcomp',{threshold:-14,ratio:1.5,attack:36,release:200,mix:.75}],['vectorlimit',{ceiling:-1,drive:0}]
 ]),
 masterLoud:rack('MASTER / DENSE','Master','Pré-master plus énergique ; vérifier les crêtes, la dynamique et le LUFS.',[
  ['vectoreq',{g1:-.75,g5:.6}],['circuitbus',{threshold:-16,ratio:2,attack:28,release:150,mix:.85}],['vectorlimit',{ceiling:-1,drive:2}]
 ])
});
export const STUDIORACK_CATEGORIES=Object.freeze(['Voix','Guitares','Basse','Batterie','Instruments','Bus','Master']);
