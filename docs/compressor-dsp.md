# Compresseurs de mix : traitement et contrôle mesurables

VECTOR COMP, CIRCUIT BUS, GLUE, PRESS et les deux étages de VOX LEVEL utilisent
désormais le même noyau de compression WarLike. Le `DynamicsCompressorNode`
a été supprimé de ces cinq traitements. Aucun sélecteur Classic, aucun ancien
moteur en parallèle et aucun repli vers l'ancien traitement.

L’extension [EXO, HARDI et ELIANA](pack-dynamics-dsp.md) remplace également
les six derniers traitements de cette famille. Il ne reste aucun appel à
`createDynamicsCompressor` dans le code de production.

## Référence et choix

Le traitement est une implémentation originale des équations de compression
feedforward présentées par Giannoulis, Massberg et Reiss,
[JAES 60(6), 2012](https://eecs.qmul.ac.uk/~josh/documents/2012/GiannoulisMassbergReiss-dynamicrangecompression-JAES2012.pdf).
La loi de knee progressif et le détecteur découplé lissé dans le domaine des dB
suivent les équations (4), (17) et (23). Le signal stéréo partage une enveloppe,
calculée à partir de la plus grande amplitude instantanée des deux canaux.

Le compresseur Web Audio précédent incluait un gain de compensation qui
dépendait des réglages. La
[spécification Web Audio, section traitement du DynamicsCompressorNode](https://www.w3.org/TR/webaudio/#DynamicsCompressorNode)
décrit cette compensation automatique et autorise certaines différences de
courbe et d'enveloppe entre navigateurs. Le nouveau traitement n'ajoute aucun
make-up automatique : seuls Sortie ou Make-up augmentent le niveau.

Ce noyau ne prétend pas reproduire un circuit analogique précis. Les façades et
presets conservent leurs identités ; les différences de réglages restent visibles.

## Comportement

| Fonction | Comportement |
| --- | --- |
| Courbe VECTOR | Même fonction mathématique dans l'affichage et le DSP, avant sortie et mix |
| Gain sous le knee | Unitaire à l'état établi, hors gain de sortie explicite |
| Attaque | Lissage exponentiel de la réduction en dB ; 63,2 % d'un échelon après une constante de temps |
| Relâchement | Retour exponentiel vers la réduction demandée, suivi du lissage d'attaque ; réponse découplée documentée et testée |
| Stéréo | Gain commun, sans modification du rapport gauche/droite |
| Mono | Un canal reste mono ; pas de conversion stéréo qui modifierait la loi de panoramique du host |
| Anticipation | `ceil(sampleRate × 0,006)` frames par étage, partagées avec les métadonnées de compensation |
| VOX LEVEL | Deux instances indépendantes en série : crêtes puis niveau de phrase |
| Mix parallèle | Sec et traité alignés au nombre exact de frames, y compris à 44,1 kHz |
| Automatisation | AudioParams à résolution d'échantillon ; réglage manuel lissé par le host |
| Mesure | Réduction réellement appliquée ; indication maximale sur une fenêtre de 100 ms en lecture |
| Suppression | Fermeture du port et arrêt explicite du processeur ; création GLUE/PRESS uniquement lorsqu'ils sont présents |

L'indication totale VOX LEVEL additionne les indications de ses deux étages.
Le calcul du signal conserve des buffers typés et n'alloue pas d'objet par frame.
Les noms et plages des contrôles restent compatibles avec les projets et racks.
Le rendu utilise le nouveau moteur : une identité sonore avec l'ancien algorithme
n'est pas revendiquée. AudioWorklet et un contexte sécurisé sont requis.

Les clients qui construisent directement un graphe de test doivent d’abord
attendre `prepareStudioContext(ctx)`. `AudioEngine.init()` et `renderRange()`
assurent déjà ce chargement pour les parcours de production. Les anciennes pages
QA ont été adaptées à ce contrat.

Un compresseur conserve des transitoires et n'est pas un plafond de sécurité.
PEAK/VECTOR LIMIT restent les limiteurs de crêtes d'échantillons ; ce changement
ne constitue pas une certification True Peak.

## Niveaux et voix des démos

La disparition de la compensation implicite exige un nouveau réglage des presets.
Les gains sont définis dans les contrôles existants et restent modifiables :
sortie des pistes vocales, sortie du retour parallèle et gain de mastering.
Les voix enregistrées sont contrôlées seules face au mix instrumental, puis
dans le routage complet avec leurs bus et effets. Le contrôle de stems a aussi
corrigé la programmation de pistes acoustiques muettes lors d'un export : elles
ne demandent plus de voix à une banque volontairement non chargée.

Les profils du catalogue sont recalculés sur quatre mesures de refrain. Ils
s'appliquent aux nouvelles copies et préécoutes, jamais automatiquement aux
projets déjà sauvegardés. Les gains et le DSP sont communs à Play et au WAV.
Lors de la première étape (#300), les 31 refrains recontrôlés se situaient entre −17,32 et −15,87 LUFS, avec des
crêtes d'échantillons au plus à −1,5 dBFS. La voix principale des six démos
enregistrées est aussi mesurée avec le routage public complet (bus et FX) ;
le rapport RMS voix/instrumental doit dépasser 0,35. Ces critères de préparation
ne remplacent pas une écoute critique ni une certification normative.

## Vérifications

`tests/compressor-dsp.test.mjs` vérifie la courbe, sa continuité, les constantes
de temps, le gain unitaire, l'indépendance des instances et le retard à
44,1/48/96 kHz.

`tests/compressor-dsp-browser.mjs` effectue 96 contrôles avec les vrais AudioWorklet et le moteur
Studio : transfert des cinq modules, sortie, mono/stéréo, mix parallèle,
automatisation, bypass, instances de rack, suppression, mesures et WAV float.
Il mesure également le résidu d'une sinusoïde à 1 kHz dans un réglage défini ;
ce résultat n'est pas une garantie de distorsion sur toute musique.

La CI publie `studio-compressor-dsp` avec les mesures et un WAV. Le contrôle des
31 démos publie le loudness, les crêtes et l'audibilité de la voix principale dans
`studio-demo-playback-levels`. Les fenêtres et commandes restent couvertes par
les tests de façades et les gestes réels de souris. Les mesures détaillées sont dans
`docs/compressor-measurements.json`. Le rendu complet de Nocturne (208,7 s,
WAV stéréo 24 bits à 44,1 kHz) a également été contrôlé.

Les mesures de l’extension sont dans `docs/pack-dynamics-measurements.json`.
