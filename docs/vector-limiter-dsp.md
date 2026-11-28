# Limiteur unique et niveau des démos

PEAK et VECTOR LIMIT utilisent le même moteur AudioWorklet. L'ancien assemblage
DynamicsCompressor + WaveShaper a été supprimé des deux limiteurs. Aucun mode
Classic, deuxième traitement parallèle ou repli vers l'ancien algorithme.
Les compresseurs de bus restent des compresseurs, indépendants de ce changement.

Le moteur adapte l'enveloppe publiée par
[Signalsmith Basics](https://github.com/Signalsmith-Audio/basics/blob/main/include/signalsmith-basics/limiter.h),
sous licence MIT, conservée dans `dist/licenses/signalsmith-limiter.txt`.
Le [raisonnement et les contraintes du limiteur](https://signalsmith-audio.co.uk/writing/2022/limiter/)
constituent la référence technique. Aucune équivalence avec le DSP propriétaire
de Waves n'est revendiquée.

## Traitement

- Anticipation de `ceil(sampleRate × 0,006)` échantillons : 265 à 44,1 kHz,
  288 à 48 kHz, 576 à 96 kHz. La compensation des pistes et voies du rack utilise
  ces durées effectives, y compris pour les instances répétées.
- Minimum glissant du gain admissible, maintien de 3 ms, relâchement exponentiel
  de l'énergie du gain et deux moyennes finies, puis racine carrée. Les longueurs
  et le coefficient de relâchement suivent le schéma Signalsmith à deux étages.
- Une enveloppe commune aux deux canaux préserve leur rapport. Le signal sous
  le plafond traverse à gain unitaire, avec le seul retard d'anticipation.
- Une baisse automatisée du plafond borne aussi les échantillons déjà retardés,
  par un gain commun de sécurité. Les transitoires à plafond constant sont
  contrôlées par l'anticipation ; aucun écrêteur n'est chargé.
- Entrée de 0 à +24 dB ; plafond de −12 à −0,1 dBFS ; relâchement de 20 à 500 ms.
  Les trois paramètres et les identifiants existants restent compatibles avec
  les projets/presets. Leur rendu utilise désormais le nouveau moteur.
- Réduction de gain issue du processeur réel, publiée à 10 Hz en lecture.
  Les rendus hors ligne ne publient pas ces messages. La suppression d'une
  instance ferme son port et arrête son processeur.

Il s'agit d'un limiteur de crêtes d'échantillons. L'anticipation et le lissage
ne constituent ni une certification True Peak, ni un traitement à suréchantillonnage,
ni une garantie d'absence d'artefacts sur tout matériau musical. AudioWorklet et
un contexte sécurisé sont requis ; aucun traitement ancien n'est conservé comme secours.

## Cause du faible niveau et correction

Les masters des démos contenaient des atténuations fixes de −9 à −12 dB.
Sur quatre mesures de refrain à 48 kHz, avant ce changement :

| Démo complète | Avant (LUFS) | Après (LUFS) | Ancien master |
| --- | ---: | ---: | ---: |
| Nocturne | −26,04 | −15,91 | −9 dB |
| Soleil | −31,60 | −15,95 | −9 dB |
| Brume | −33,95 | −16,05 | −9 dB |

Les 31 extraits corrigés mesurés sont entre −17,71 et −14,77 LUFS. Leurs crêtes
d'échantillons sont au plus à −1,5 dBFS. Les valeurs détaillées sont dans
`docs/vector-limiter-measurements.json`.

Le remplacement du limiteur seul ne corrige pas ces atténuations. Les nouvelles
copies du catalogue et les préécoutes des chansons complètes reçoivent un master
à 0 dB et un gain d'entrée PEAK mesuré pour chaque arrangement. Les démos publiques
avec groupes/FX et voix disposent de leurs propres profils : elles ne réutilisent
pas aveuglément le gain de la version instrumentale.

L'objectif de préparation est proche de −16 LUFS sur ces extraits, sans écraser
les différences entre arrangements. Le plafond des échantillons reste −1,5 dBFS.
Ces réglages sont visibles dans le projet et partagés par Play et le WAV ; aucun
amplificateur d'écoute caché. Les projets sauvegardés/importés ne reçoivent pas
de modification automatique de leur volume. Pour entendre les nouveaux réglages,
ouvrir une nouvelle copie depuis le catalogue.

Les profils sont dans `dist/demo-playback-level.js`. Le rapport de mesures joint
décrit des extraits, pas le loudness intégré des morceaux entiers et pas une
certification commerciale ou normative.

## Vérification reproductible

`npm test` couvre le plafond, les transitoires, le rapport stéréo, le retard exact,
le gain unitaire, les instances indépendantes et la récupération selon le release.

`tests/vector-limit-dsp-browser.mjs` utilise de vrais AudioWorklet/OfflineAudioContext
à 44,1/48/96 kHz. Il vérifie le gain demandé, le signal sous le plafond, les
transitoires, le résidu d'une sinusoïde limitée, une baisse automatisée du plafond,
l'identité du DSP PEAK/VECTOR, l'alignement du rack parallèle/dry-wet à 44,1 kHz
et l'identité des échantillons exportés en WAV float. Le WAV et le rapport sont
publiés dans les artefacts CI `vector-limit-hardware`.

`tests/demo-playback-level-browser.mjs` rend les refrains des 18 chansons complètes
et des 13 démos publiques, avec leurs instruments, bus, effets et voix réels.
Chaque extrait doit être fini, entre −20 et −12 LUFS et sous −1,5 dBFS sur les
échantillons. Les mesures sont dans l'artefact CI `studio-demo-playback-levels`.
Le bruit de réverbération et certains instruments étant aléatoires, les valeurs
exactes peuvent varier légèrement entre deux rendus.
