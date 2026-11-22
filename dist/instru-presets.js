import {INSTRUMENTS,pluginDefaults} from './plugins.js';
import {exoArpeggiate} from './exo.js';
// A separate, original sound collection. Factory preset indices and engines stay intact.
const G='Guitares',K='Claviers & orgues',B='Basses',P='Mallets & cordes pincées',W='Cordes & vents',L='Leads & arpèges',T='Nappes & textures',D='Batteries & percussions',V='Chœurs';
const banks={
 harp:[
 ['Rosée',P,'Harpe douce, attaque arrondie et longue extinction.','Ambient · Ballade',{brightness:5600,tone:-2.25,attack:.025,release:2.15,dynamics:.7,width:.8}],
 ['Perles sèches',P,'Pincement précis et court pour les arpèges rythmiques.','Pop · Afro',{brightness:11700,tone:1.25,attack:.001,release:.11,dynamics:.9,width:.3}],
 ['Harpe de verre',P,'Aigus ouverts, toucher régulier et résonance ample.','Cinématique',{brightness:17500,tone:3.25,attack:.012,release:2.65,dynamics:.45,width:1}],
 ['Harpe de velours',P,'Registre feutré et intime pour les accords espacés.','R&B',{brightness:3300,tone:-4,attack:.04,release:1.35,dynamics:.95,width:.35}],
 ['Cordes de pluie',P,'Contour doux et notes qui se chevauchent.','Ambient',{brightness:8900,tone:-.5,attack:.075,release:2.9,dynamics:.6,width:.95}],
 ['Harpe staccato',P,'Pincements courts et clairs, faciles à superposer aux percussions.','Afro · House',{brightness:14100,tone:2,attack:.002,release:.07,dynamics:.55,width:.55}],
 ['Harpe grave',P,'Cordes transposées une octave sous le clavier.','Cinématique',{brightness:4700,tone:-1.75,attack:.008,release:1.75,dynamics:.8,width:.65,transpose:-12}],
 ['Harmoniques hautes',P,'Une octave au-dessus, toucher léger et brillant.','Pop · Ambient',{brightness:15500,tone:2.5,attack:.018,release:1.05,dynamics:.65,width:.85,transpose:12}]
 ],
 flute:[
 ['Souffle du fleuve',W,'Flûte grave et douce, avec attaque progressive.','Afro · Ambient',{brightness:5100,tone:-2.5,attack:.075,release:.38,dynamics:.9,width:.25}],
 ['Flûte de cristal',W,'Articulation vive et registre aigu ouvert.','Trap · Pop',{brightness:17200,tone:2.75,attack:.004,release:.09,dynamics:.65,width:.45}],
 ['Réponse courte',W,'Phrase sèche et rapprochée pour répondre à une voix.','R&B · Afro',{brightness:10300,tone:.75,attack:.012,release:.06,dynamics:.95,width:.1}],
 ['Brume suspendue',W,'Entrée lente et sortie longue pour les notes tenues.','Cinématique',{brightness:6800,tone:-1.25,attack:.28,release:1.3,dynamics:.5,width:.9}],
 ['Octave de bambou',W,'Transposition grave et couleur mate du sample de flûte.','Ambient',{brightness:3900,tone:-3,attack:.055,release:.55,dynamics:.8,width:.4,transpose:-12}],
 ['Aile légère',W,'Médium clair, dynamique expressive et contour souple.','Pop',{brightness:13400,tone:1.5,attack:.028,release:.32,dynamics:1,width:.7}],
 ['Flûte miniature',W,'Une octave au-dessus pour les ornements courts.','Trap · Drill',{brightness:14900,tone:.25,attack:.006,release:.14,dynamics:.75,width:.5,transpose:12}],
 ['Flûte de chambre sombre',W,'Flûte centrée, sombre et lente pour les contrechants.','Soul',{brightness:2900,tone:-4.5,attack:.16,release:.8,dynamics:.85,width:.15}]
 ],
 wlvirtual:[
 ['Aurore supersaw',L,'Unisson large, filtre ouvert et extinction moyenne.','Trance · Dance',{detune:29,cutoff:9800,resonance:.8,attack:.008,release:.44,pulse:.08,width:1,output:-17}],
 ['Velours analogique',T,'Nappe sombre à faible désaccord, attaque lente.','Ambient · R&B',{detune:7,cutoff:1450,resonance:.5,attack:1.2,release:3.1,pulse:.25,width:.8,output:-15}],
 ['Pluck Ibiza',P,'Attaque immédiate et extinction courte, filtre résonant.','House · Dance',{detune:13,cutoff:3600,resonance:2.7,attack:.002,release:.06,pulse:.32,width:.65,output:-17}],
 ['Lead solaire',L,'Lead brillant à impulsion, unisson serré.','Dance · Pop',{detune:5,cutoff:7400,resonance:1.8,attack:.005,release:.14,pulse:.9,width:.3,output:-17}],
 ['Basse acide',B,'Filtre bas et résonant, largeur centrée.','House · Techno',{detune:0,cutoff:650,resonance:4.8,attack:.002,release:.05,pulse:.58,width:0,output:-18}],
 ['Nappe boréale',T,'Unisson très large avec ouverture lente.','Trance · Cinématique',{detune:35,cutoff:6800,resonance:.6,attack:1.65,release:3.7,pulse:.15,width:1,output:-18}],
 ['Accords néon',K,'Accords analogiques ouverts, attaque douce et relâchement court.','Synthwave',{detune:19,cutoff:4100,resonance:1,attack:.055,release:.28,pulse:.48,width:.9,output:-17}],
 ['Pulse sec',L,'Impulsion étroite, sans largeur et sans queue longue.','Electro',{detune:1,cutoff:11600,resonance:.7,attack:.002,release:.04,pulse:1,width:.05,output:-18}],
 ['Basse satinée',B,'Grave rond, unisson modéré et filtre très doux.','R&B · Pop',{detune:3,cutoff:900,resonance:.4,attack:.018,release:.25,pulse:.12,width:.1,output:-14}],
 ['Pluck de cuivre',P,'Pluck dense, désaccord prononcé et couleur résonante.','Afro House',{detune:22,cutoff:2300,resonance:3.2,attack:.003,release:.09,pulse:.66,width:.75,output:-18}],
 ['Lead noctambule',L,'Médium filtré, attaque arrondie et largeur discrète.','Trap · R&B',{detune:9,cutoff:1800,resonance:1.4,attack:.065,release:.38,pulse:.73,width:.35,output:-15}],
 ['Chœur de scies',T,'Nappe brillante et épaisse, extinction très ample.','Dance · Ambient',{detune:38,cutoff:13200,resonance:.3,attack:.48,release:2.65,pulse:.03,width:1,output:-19}]
 ],
 origins:[
 ['Ney de nuit',W,'Vent synthétique soufflé à attaque lente.','Orient · Ambient',{voice:33,tone:.1,breath:.62,vibrato:.18,expression:.7,attack:.18,release:.48}],
 ['Bansuri limpide',W,'Vent synthétique doux à vibrato discret.','Inde · Soul',{voice:29,tone:.28,breath:.24,vibrato:.24,expression:.8,attack:.045,release:.24}],
 ['Duduk de cendre',W,'Anche synthétique sombre, expressive et tenue.','Cinématique',{voice:32,tone:.06,breath:.31,vibrato:.42,expression:.72,attack:.12,release:.65}],
 ['Quena du matin',W,'Flûte synthétique plus claire et articulée.','World · Pop',{voice:35,tone:.57,breath:.3,vibrato:.12,expression:.82,attack:.025,release:.12}]
 ],
 wlvox:[['Hum de velours',V,'Voyelle synthétique fermée, douce et lente.','R&B',{vowel:0,breath:.09,vibrato:.15,attack:.3,release:.85,tone:.2,output:-18}],['Ah lumineux',V,'Voyelle synthétique ouverte à attaque courte.','Gospel · Pop',{vowel:1,breath:.2,vibrato:.4,attack:.04,release:.2,tone:.8,output:-18}]],
 wlsteel:[['Bois des quais',G,'Cordes acier sombres et résonantes.','Ballade',{brightness:3900,body:.86,pickPosition:.21,damping:.15,attack:.013,decay:2.4,release:.55,drive:0,width:.18,output:-11}],['Médiator solaire',G,'Attaque brillante et décroissance resserrée.','Pop',{brightness:12800,body:.45,pickPosition:.48,damping:.6,attack:.002,decay:.72,release:.1,drive:.04,width:.6,output:-13}]],
 wlnylon:[['Nylon de lune',G,'Doigts doux, caisse ronde et cordes longues.','R&B',{brightness:2800,body:.9,pickPosition:.18,damping:.12,attack:.022,decay:2.7,release:.7,drive:0,width:.2,output:-11}],['Nylon dansant',G,'Attaque nette pour les arpèges rapides.','Afro',{brightness:7900,body:.56,pickPosition:.4,damping:.48,attack:.003,decay:.6,release:.08,drive:0,width:.45,output:-12}]],
 wlfolk12:[['Douze étoiles',G,'Doublage étendu et cordes brillantes.','Indie',{brightness:14300,body:.55,pickPosition:.36,damping:.12,attack:.008,decay:2.8,release:.65,drive:.02,width:1,output:-14}],['Folk de chambre',G,'Douze cordes mates et rapprochées.','Ballade',{brightness:4200,body:.8,pickPosition:.2,damping:.55,attack:.025,decay:1,release:.2,drive:0,width:.25,output:-12}]],
 wljazz:[['Minuit au club',G,'Caisse creuse ronde, attaque lente et micro proche.','Jazz',{brightness:1900,body:.9,pickPosition:.16,damping:.35,attack:.025,decay:1.6,release:.35,drive:.03,width:.1,output:-11}],['Hollow rythmique',G,'Accords courts et grain légèrement poussé.','Neo Soul',{brightness:6100,body:.6,pickPosition:.47,damping:.72,attack:.003,decay:.37,release:.06,drive:.22,width:.4,output:-14}]],
 wlclean:[['Sébène clair',G,'Pincement clair et court pour les réponses rapides.','Rumba',{brightness:10700,body:.5,pickPosition:.42,damping:.42,attack:.002,decay:.68,release:.09,drive:.02,width:.3,output:-13}],['Électrique soyeuse',G,'Cordes propres, attaque souple et extinction longue.','R&B',{brightness:3500,body:.85,pickPosition:.2,damping:.18,attack:.04,decay:2.4,release:.8,drive:0,width:.75,output:-12}]],
 wlcrunch:[['Mur de cuivre',G,'Saturation dense et cordes courtes.','Rock',{brightness:5200,body:.76,pickPosition:.46,damping:.65,attack:.001,decay:.65,release:.08,drive:.88,width:.85,output:-17}],['Braise solo',G,'Grain moins saturé et note plus longue.','Blues',{brightness:3100,body:.85,pickPosition:.22,damping:.12,attack:.012,decay:2.7,release:.65,drive:.43,width:.2,output:-15}]],
 wlmuted:[['Chop Kin',G,'Notes étouffées brillantes et très courtes.','Rumba · Afro',{brightness:11800,body:.43,pickPosition:.5,damping:.9,attack:.001,decay:.2,release:.04,drive:.03,width:.35,output:-13}],['Pocket mat',G,'Attaque ronde, caisse présente et corde amortie.','Funk · Soul',{brightness:2700,body:.83,pickPosition:.17,damping:.72,attack:.008,decay:.42,release:.08,drive:.12,width:.15,output:-12}]],
 wlrompler:[['Atlas de brume',T,'Couches douces et espace ample.','Ambient',{wave:1,texture:0,layer:.67,cutoff:1850,attack:1.4,release:4.3,space:.7,output:-17}],['Atlas perlé',K,'Couche claire et enveloppe serrée.','Pop',{wave:0,texture:3,layer:.23,cutoff:11200,attack:.003,release:.16,space:.12,output:-15}]],
 wlspectral:[['Verre liquide',P,'FM brillante avec peu de mouvement et queue courte.','Afro House',{fm:.85,harmonics:.22,motion:.08,cutoff:12100,attack:.004,release:.17,width:.55,output:-17}],['Nébuleuse sombre',T,'Spectre dense, mouvement lent et longue extinction.','Cinématique',{fm:.18,harmonics:.9,motion:.78,cutoff:1300,attack:1.8,release:4.8,width:1,output:-18}]],
 wltitan:[['Basse des quais',B,'Corde ronde, micro côté manche et note tenue.','Rumba · Soul',{pickup:.13,brightness:1650,damping:.25,attack:.012,release:.45,output:-12}],['Basse incisive',B,'Micro plus près du chevalet et corde amortie.','Funk',{pickup:.62,brightness:7400,damping:.82,attack:.002,release:.06,output:-15}]],
 wlabyss:[['Sub profond',B,'Faible chute initiale et longue tenue.','Trap',{drop:3,time:.03,drive:.12,attack:.008,release:.55,output:-15}],['Impact abyssal',B,'Grande chute de hauteur et saturation courte.','Drill · Cinématique',{drop:23,time:.16,drive:.68,attack:.002,release:.09,output:-18}]],
 wlimperial:[['Cordes de velours',W,'Ensemble de cordes lent, cuivres discrets.','Cinématique',{strings:.95,brass:.04,width:.95,attack:.65,release:2.1,output:-16}],['Cuivres de scène',W,'Accents de cuivres courts et centrés.','Afro · Funk',{strings:.12,brass:.9,width:.35,attack:.012,release:.075,output:-17}]],
 wltonewheel:[['Gospel au bois',K,'Fondamentale et quintes présentes, percussion douce.','Gospel',{sub:.35,fundamental:.82,third:.72,octave:.58,high:.22,percussion:.23,attack:.006,release:.18,output:-17}],['Orgue de salon',K,'Tirettes graves et attaque arrondie, sans percussion.','Neo Soul',{sub:.62,fundamental:.95,third:.08,octave:.12,high:0,percussion:0,attack:.044,release:.65,output:-15}]],
 wlmbira:[['Lames anciennes',P,'Métal mat et buzz discret, résonance longue.','Afro · Ambient',{metal:.16,decay:1.7,buzz:.08,attack:.012,release:.65,output:-14}],['Cuivre claquant',P,'Partiels métalliques et extinction courte.','Afro House',{metal:.92,decay:.24,buzz:.55,attack:.002,release:.07,output:-17}]],
 wlngoma:[['Log de nuit',D,'Membrane grave, peau souple et longue résonance.','Amapiano',{skin:.16,decay:1.3,strike:.78,attack:.002,release:.45,output:-16}],['Peau tendue',D,'Frappe brillante et courte.','Afro · Rumba',{skin:.95,decay:.13,strike:.96,attack:.002,release:.03,output:-17}]],
 wlkora:[['Kora de soie',P,'Cordes résonantes, pincement proche du manche.','World · Ambient',{pluck:.14,resonance:.87,decay:2.7,attack:.018,release:.8,output:-15}],['Kora perlée',P,'Pincement incisif et résonance courte.','Afro',{pluck:.62,resonance:.12,decay:.36,attack:.002,release:.06,output:-15}]],
 wlchoir:[['Ooh lointain',V,'Chœur synthétique sombre et lent.','Cinématique',{vowel:.94,spread:21,width:1,attack:.85,release:2.6,output:-17}],['Ah rapproché',V,'Chœur synthétique clair et peu étalé.','Gospel',{vowel:.08,spread:5,width:.3,attack:.044,release:.2,output:-17}]],
 wldrift:[['Poussière orbitale',T,'Petits grains espacés et dispersion large.','Ambient',{grain:.035,density:11,scatter:.92,attack:.75,release:2.2,output:-18}],['Nuage continu',T,'Grains longs et denses, dispersion réduite.','Cinématique',{grain:.18,density:38,scatter:.12,attack:.35,release:1.5,output:-18}]],
 wlmatrix:[['Log FM souple',B,'FM grave avec modulation courte et peu métallique.','Amapiano',{ratioA:1,ratioB:2,indexA:1.8,indexB:.1,decay:.12,attack:.002,release:.08,output:-16}],['Cloche asymétrique',P,'Rapports inharmoniques et longue extinction métallique.','Trap · Ambient',{ratioA:2.5,ratioB:6.5,indexA:2.6,indexB:1.3,decay:1.65,attack:.004,release:1.15,output:-18}]],
 piano:[['Feutre nocturne',K,'Piano sombre, dynamique sensible et corps long.','R&B',{brightness:4500,tone:-3,attack:.006,release:1.65,dynamics:.95,width:.6,output:-6}],['Marteaux pop',K,'Piano clair, touche régulière et extinction serrée.','Pop',{brightness:14900,tone:2,attack:.001,release:.32,dynamics:.55,width:.85,output:-8}]],
 upright:[['Salon ancien',K,'Piano droit mat et rapproché.','Neo Soul',{brightness:3500,tone:-4,attack:.012,release:.55,dynamics:.95,width:.2,output:-6}],['Droit rythmique',K,'Attaque ouverte et notes courtes.','Pop',{brightness:14300,tone:2.5,attack:.001,release:.12,dynamics:.6,width:.6,output:-8}]],
 epiano:[['FM miel',K,'Tines sombres et longues pour les accords espacés.','R&B',{brightness:3700,tone:-1.75,attack:.012,release:1.4,dynamics:.95,width:.75,output:-7}],['Tines claquantes',K,'Clavier FM brillant à extinction courte.','Funk',{brightness:15100,tone:3,attack:.001,release:.14,dynamics:.7,width:.45,output:-9}]],
 marimba:[['Bois profond',P,'Lames douces à résonance longue.','Afro',{brightness:2900,tone:-3.5,attack:.012,release:.65,dynamics:.9,width:.5,output:-6}],['Marimba miniature',P,'Lames aiguës et courtes, une octave plus haut.','Pop',{brightness:13800,tone:2.75,attack:.001,release:.07,dynamics:.6,width:.8,transpose:12,output:-9}]],
 vibes:[['Lames de minuit',P,'Vibraphone mat et intime.','Jazz',{brightness:5100,tone:-2.25,attack:.01,release:1.55,dynamics:.95,width:.35,output:-7}],['Vibes de verre',P,'Métal ouvert et très longue extinction.','Ambient',{brightness:16600,tone:3.25,attack:.025,release:2.85,dynamics:.5,width:1,output:-10}]],
 kalimba:[['Pouces feutrés',P,'Lames sombres et proches.','R&B',{brightness:3100,tone:-4,attack:.012,release:.78,dynamics:.95,width:.15,output:-6}],['Kalimba de scène',P,'Attaque brillante et courte pour les contretemps.','Afro',{brightness:15200,tone:2.5,attack:.001,release:.12,dynamics:.6,width:.65,output:-9}]],
 strum:[['Cordes du matin',G,'Cordes ouvertes, toucher doux et large.','Folk',{brightness:7200,tone:-1.25,attack:.014,release:.95,dynamics:.9,width:.75,output:-7}],['Strum pointillé',G,'Cordes sèches et aiguës.','Afro',{brightness:14700,tone:2.75,attack:.001,release:.06,dynamics:.65,width:.2,output:-9}]],
 violin:[['Archet de nuit',W,'Violon sombre, attaque lente et sortie douce.','Cinématique',{brightness:4100,tone:-3.25,attack:.22,release:.75,dynamics:.8,width:.55,output:-7}],['Archet vif',W,'Violon clair et court pour les ostinatos.','Drill',{brightness:14400,tone:1.75,attack:.003,release:.06,dynamics:.95,width:.3,output:-9}]],
 cello:[['Cello des ombres',W,'Ensemble grave, sombre et ample.','Cinématique',{brightness:2700,tone:-3.75,attack:.32,release:1.7,dynamics:.75,width:.9,output:-7}],['Cello précis',W,'Archet court et médium plus ouvert.','Drill',{brightness:12400,tone:2,attack:.008,release:.06,dynamics:.95,width:.4,output:-9}]],
 trumpet:[['Cuivre de nuit',W,'Trompette sombre à entrée douce.','Jazz',{brightness:3300,tone:-4.25,attack:.08,release:.48,dynamics:.95,width:.2,output:-8}],['Appel cuivré',W,'Attaque franche et extinction courte.','Afro · Funk',{brightness:16700,tone:2.75,attack:.002,release:.06,dynamics:.65,width:.5,output:-10}]],
 drums:[['Pulse sec',D,'Kit synthétique, grosse caisse sèche et charley discret.','Trap',{punch:.94,decay:.12,hat:.32,kit:0}],['Peaux baile',D,'Kit synthétique à toms et congas, plus résonant.','Funk brésilien',{punch:.7,decay:.46,hat:.5,kit:4}]],
 bass:[['Sub de velours',B,'Fondamentale douce, sans ajout harmonique.','R&B',{body:.58,harmonics:0,release:.48}],['808 de braise',B,'Grave dense, harmoniques présentes et sortie courte.','Trap · Drill',{body:.87,harmonics:.43,release:.07}]],
 keys:[['Tines intimes',K,'FM sans désaccord, toucher rapide et queue courte.','Neo Soul',{attack:.007,release:.24,detune:0}],['Velvet suspendu',T,'Attaque douce et désaccord large.','Ambient',{attack:.38,release:1.75,detune:19}]],
 lead:[['Fil électrique',L,'Lead très clair, précis et serré.','Electro',{cutoff:10800,detune:3,release:.06}],['Nova feutrée',L,'Lead sombre, élargi et plus long.','R&B',{cutoff:850,detune:27,release:.65}]],
 pad:[['Halo proche',T,'Nappe rapide, presque centrée et courte.','Pop',{attack:.08,release:.35,width:2}],['Halo immense',T,'Nappe lente, désaccordée et très longue.','Ambient',{attack:1.75,release:3.6,width:31}]],
 pluck:[['Corde de bois',P,'Pincement mat et caisse ronde.','Afro',{decay:.88,brightness:1800,body:.46}],['Aiguille percussive',P,'Corde très courte, brillante et peu résonante.','House',{decay:.08,brightness:10900,body:.08}]],
 exo:[
 ['Harpe électronique',P,'Cloche FM et triangle, enveloppe pincée.','Ambient',{waveA:7,waveB:1,transposeB:12,blend:.2,fm:.3,cutoff:8500,attack:.004,decay:.75,sustain:0,release:.45,space:.35,output:-16}],
 ['Souffle numérique',W,'Sine et couche creuse, attaque progressive.','R&B',{waveA:0,waveB:4,transposeB:12,blend:.12,fm:.04,cutoff:2600,attack:.085,decay:.6,sustain:.7,release:.32,motion:.08,space:.18,output:-15}],
 ['Arp solaire',L,'Séquence montante sur deux octaves.','Dance',{waveA:2,waveB:5,transposeB:0,blend:.42,cutoff:7100,detune:21,attack:.003,decay:.15,sustain:.05,release:.07,arpMode:1,arpRate:.5,arpOctaves:2,arpGate:.36,output:-18}],
 ['Arp de minuit',L,'Cloche descendante avec notes plus longues.','Trap',{waveA:7,waveB:0,blend:.18,fm:.58,cutoff:9100,decay:.65,sustain:0,release:.4,arpMode:2,arpRate:2,arpOctaves:2,arpGate:.8,space:.4,output:-17}],
 ['Nappe de soie',T,'Triangle et orgue, mouvement lent et queue ample.','Ambient',{waveA:1,waveB:6,transposeB:0,blend:.4,cutoff:1700,attack:1.4,sustain:.78,release:3.4,motion:.42,motionRate:.15,space:.65,output:-17}],
 ['Basse élastique',B,'Deux couches graves, filtre résonant et centre mono.','House',{waveA:2,waveB:0,transposeA:-12,transposeB:-12,blend:.6,cutoff:1100,resonance:2.8,detune:0,width:0,attack:.003,decay:.13,sustain:.18,release:.06,motion:0,space:0,output:-17}],
 ['Cloche de glace',P,'Deux couches FM à rapports différents.','Trap',{waveA:7,waveB:7,transposeB:19,blend:.22,fm:.85,cutoff:15100,decay:1.6,sustain:0,release:1.1,space:.5,output:-18}],
 ['Cuivre de synthèse',K,'Scie et impulsion, attaque douce et tenue dense.','Funk',{waveA:2,waveB:3,transposeB:0,blend:.3,cutoff:3200,resonance:1.2,detune:9,attack:.035,decay:.32,sustain:.65,release:.2,space:.08,output:-18}]
 ]
};
// Additional production-oriented patches for the layered, spectral and guitar engines.
banks.wlrompler.push(
 ['Atlas keys doux',K,'Oscillateurs sinusoïdaux et attaque arrondie, sans sample de piano.','Neo Soul',{wave:0,texture:1,layer:.14,cutoff:3100,attack:.016,release:.8,space:.18,output:-14}],
 ['Atlas chœur électrique',T,'Deux couches harmoniques à attaque lente.','Gospel · Ambient',{wave:3,texture:1,layer:.58,cutoff:2800,attack:.8,release:2.7,space:.45,output:-18}],
 ['Atlas cloche pop',P,'Couche claire pincée, sans espace long.','Pop · Trap',{wave:0,texture:3,layer:.72,cutoff:14500,attack:.002,release:.09,space:.05,output:-17}],
 ['Atlas cuivres courts',K,'Scie et couche carrée pour les accords accentués.','Afro · Funk',{wave:2,texture:3,layer:.33,cutoff:4700,attack:.018,release:.12,space:.08,output:-18}],
 ['Atlas tapis de soie',T,'Couches filtrées et extinction très longue.','R&B',{wave:1,texture:2,layer:.19,cutoff:950,attack:1.7,release:4.7,space:.65,output:-17}],
 ['Atlas pulse brillant',L,'Impulsions nettes et filtre ouvert pour les hooks.','Trap · Dance',{wave:3,texture:2,layer:.8,cutoff:12800,attack:.002,release:.22,space:.22,output:-18}]
);
banks.wlspectral.push(
 ['Nébuleuse métallique',L,'FM dense et haut du spectre ouvert.','Electro',{fm:.98,harmonics:.82,motion:.13,cutoff:14500,attack:.003,release:.13,width:.4,output:-19}],
 ['Nébuleuse de soie',T,'Faible FM, harmoniques douces et entrée lente.','Ambient',{fm:.05,harmonics:.16,motion:.22,cutoff:3100,attack:2.3,release:5.4,width:.85,output:-16}],
 ['Cristaux mobiles',P,'Pluck spectral brillant et animé.','Trap',{fm:.66,harmonics:.5,motion:.92,cutoff:10300,attack:.008,release:.42,width:.95,output:-18}],
 ['Nébuleuse grave',B,'Spectre contenu et note courte pour les lignes de basse.','Electro',{fm:.32,harmonics:.62,motion:0,cutoff:700,attack:.004,release:.09,width:.05,output:-17}],
 ['Horizon tendu',T,'Spectre animé dans le médium, entrée progressive.','Cinématique',{fm:.76,harmonics:.73,motion:.68,cutoff:3900,attack:.85,release:3.4,width:.9,output:-19}],
 ['Fil de lumière',L,'Couleur presque sinusoïdale et articulation légère.','R&B',{fm:.13,harmonics:.08,motion:.06,cutoff:6700,attack:.035,release:.28,width:.2,output:-15}]
);
const guitarExtras={
 wlsteel:[['Acier aux doigts','Folk',4300,.8,.14,.1,.018,2.6,.55,0,.12],['Acier studio sec','Pop',9700,.58,.43,.77,.002,.32,.05,.02,.35],['Acier scintillant','Ambient',15500,.35,.58,.04,.055,3.1,1.5,0,.95],['Acier mordant','Rock',7100,.68,.52,.48,.001,.85,.16,.32,.55]],
 wlnylon:[['Nylon solo proche','Classique',5400,.88,.19,.22,.012,2.2,.5,0,.08],['Nylon pointillé','Afro',12300,.4,.55,.86,.001,.24,.04,0,.3],['Nylon suspendu','Ambient',3900,.75,.12,.03,.085,3.1,1.8,0,.85],['Nylon médium','Rumba',6400,.68,.39,.55,.004,.88,.13,.03,.45]],
 wlfolk12:[['Douze cordes rythmiques','Pop',11200,.6,.45,.73,.002,.48,.07,.05,.7],['Douze cordes sombres','R&B',2100,.93,.13,.28,.04,2.3,.6,0,.35],['Douze cordes célestes','Ambient',9800,.42,.28,.02,.09,3.2,1.9,0,1],['Douze cordes mordantes','Rock',7200,.7,.56,.52,.001,.75,.12,.38,.8]],
 wljazz:[['Jazz au médiator','Jazz',4700,.73,.5,.55,.002,.95,.12,.13,.18],['Hollow cotonneuse','R&B',1200,.98,.09,.12,.07,2.8,1.1,0,.55],['Accords manouche électriques','Swing',9300,.48,.6,.86,.001,.27,.05,.21,.25],['Hollow saturée douce','Blues',3200,.82,.3,.18,.018,2.6,.7,.52,.45]],
 wlclean:[['Clean funk serrée','Funk',14500,.37,.6,.91,.001,.18,.04,.06,.2],['Clean chorus naturel','Pop',8200,.58,.32,.18,.018,2.2,.65,0,1],['Clean atmosphère','Ambient',2600,.89,.12,.02,.095,3.2,1.95,0,.9],['Clean blues poussé','Blues',5600,.72,.48,.4,.003,1.3,.25,.4,.35]],
 wlcrunch:[['Crunch rythmique serré','Rock',8400,.6,.58,.88,.001,.25,.04,.97,.7],['Crunch feutré','Soul',1800,.97,.14,.35,.04,1.7,.4,.2,.18],['Lead ample','Rock',6900,.74,.28,.06,.012,3.1,1.5,.72,.75],['Crunch garage','Indie',13200,.33,.62,.65,.002,.55,.08,.62,.25]],
 wlmuted:[['Mute cliquetant','Funk',15100,.25,.62,.97,.001,.1,.04,.08,.15],['Mute rond','Neo Soul',1500,.96,.1,.62,.035,.65,.15,.02,.2],['Mute stéréo','Afro',8700,.56,.36,.79,.003,.3,.06,0,1],['Mute sale','Rock',5800,.7,.51,.88,.001,.21,.04,.58,.5]]
};
for(const [type,rows]of Object.entries(guitarExtras))for(const [name,tags,brightness,body,pickPosition,damping,attack,decay,release,drive,width]of rows)banks[type].push([name,G,'Réglage de corde, position de pincement, amortissement et couleur d’ampli adaptés au jeu '+tags+'.',tags,{brightness,body,pickPosition,damping,attack,decay,release,drive,width,output:drive>.3?-17:-14}]);
export const INSTRU_PRESETS=Object.freeze(Object.entries(banks).flatMap(([type,rows])=>rows.map(([name,category,description,tags,values],index)=>Object.freeze({id:type+'-'+(index+1),type,name,category,description,tags,values:Object.freeze(values)}))));
export const INSTRU_CATEGORIES=Object.freeze([...new Set(INSTRU_PRESETS.map(p=>p.category))]);
const byId=new Map(INSTRU_PRESETS.map(p=>[p.id,p]));
export const findInstruPreset=id=>byId.get(id)||null;
export function instruValues(id){const preset=findInstruPreset(id);if(!preset)throw Error('Son Instru inconnu.');return {...pluginDefaults(preset.type).instrument,...preset.values};}
export function applyInstruPreset(track,id){const preset=findInstruPreset(id);if(!preset||track?.type!==preset.type)throw Error('Sélectionne une piste '+(INSTRUMENTS[preset?.type]?.name||'compatible')+' ou ajoute une nouvelle piste.');track.instrument={...track.instrument,...instruValues(id)};return preset.name;}
export function instruPhrase(id,{arpeggiate=true}={}){
 const p=findInstruPreset(id);if(!p)throw Error('Son Instru inconnu.');
 const bass=p.category===B,held=p.category===T||p.category===V,percussion=p.category===D;
 let notes=(bass?[36,36,43,39]:held?[57,60,64]:percussion?[60,64,67,60]:[60,64,67,72,67,64]).map((midi,i)=>({midi,step:held?0:i*(bass?4:2),len:held?12:percussion?.8:bass?2.8:1.5,velocity:held?.55:i%2?.6:.8}));
 if(p.type==='exo'&&arpeggiate)notes=exoArpeggiate(notes,32,instruValues(id));
 return notes;
}
