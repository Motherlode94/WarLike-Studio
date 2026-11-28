# EXO, HARDI et ELIANA : fin de la migration des traitements dynamiques

EXO STRIP, HARDI BUS, HARDI VOCALCOMP, HARDI DEESS, ELIANA EMBRACE et
ELIANA GUARD utilisent le noyau AudioWorklet mesuré introduit avec les cinq
compresseurs principaux. Aucun appel à `createDynamicsCompressor` ne reste dans
`dist`. Aucun ancien moteur, option Classic ou gain automatique n'est conservé.
La loi et la référence scientifique restent celles de [la documentation du
compresseur](compressor-dsp.md).

| Module | Traitement | Anticipation |
| --- | --- | --- |
| EXO STRIP | Quatre filtres, compression liée, sortie explicite | Un étage |
| HARDI BUS | Compression liée, mélange parallèle aligné, gain final | Un étage |
| HARDI VOCALCOMP | Compression liée, make-up du chemin traité | Un étage |
| HARDI DEESS | Séparation complémentaire, compression de la bande aiguë, recombinaison | Un étage |
| ELIANA EMBRACE | Compression liée à knee doux, trim du chemin traité | Un étage |
| ELIANA GUARD | Compression parallèle puis limiteur stéréo commun aux deux chemins | Deux étages |

Un étage représente exactement `ceil(sampleRate × 0,006)` frames. Le chemin sec,
les métadonnées des pistes et du rack et les voies parallèles utilisent le même
calcul. À 44,1 kHz cela donne 265 frames par étage, pas 264,6. Le mono reste mono
jusqu'à la loi de panoramique du host. Les instances et leurs enveloppes restent
indépendantes. Les ports de mesure sont fermés et les processeurs arrêtés à leur
suppression. Tous les contrôles des six modules sont reliés aux AudioParams du
host ; la fréquence du dé-esseur et le plafond GUARD sont automatisables.

Le vumètre de réduction du rack propose les six modules supplémentaires.
L'indication GUARD additionne les maxima de réduction de ses deux étages sur
leurs fenêtres de 100 ms ; elle ne représente pas une mesure simultanée des
deux enveloppes. EXO affiche la fréquence du contexte réel et recalcule la
réponse de ses filtres à cette fréquence, au lieu d'afficher systématiquement
48 kHz.

## Dé-esseur complémentaire

L'ancien assemblage de deux filtres biquad Q=0,5 n'était pas une séparation
complémentaire de premier ordre, et le grave arrivait avant la bande compressée.
Le nouveau DSP utilise un passe-bas bilinéaire de premier ordre (6 dB/octave),
avec `high = input - low`. Le grave et les aigus sont retardés du même nombre de
frames. Seule la bande aiguë traverse l'enveloppe de compression. Sous le seuil,
ou à ratio 1, la somme reconstruit le signal d'entrée retardé, y compris pendant
l'automation de la fréquence. La stéréo utilise une réduction commune aux deux
bandes aiguës.

Le contrôle Sibilance fixe la séparation ; Threshold et Reduction commandent le
détecteur de la bande aiguë. Mix dose le résultat recombiné. Une fréquence de
séparation plus élevée laisse une plus grande part du signal hors compression.
Ce traitement n'est pas une reconnaissance phonétique des consonnes.

## GUARD : un plafond réel après le mélange

La clé sauvegardée `ceiling` correspond maintenant à un plafond d'échantillons,
au lieu d'un simple trim. `Comp mix` dose uniquement la compression préalable.
Le limiteur partagé avec PEAK/VECTOR LIMIT est placé après la somme sec/traité :
le plafond reste actif à Comp mix zéro. Le bypass du host retire tout le module,
protection et latence comprises. Attaque et ratio règlent la compression ;
Release pilote la compression et le limiteur (conversion secondes/ms explicite).

Le plafond accepté va de −6 à −0,1 dBFS. Une ancienne valeur 0 est ramenée à
−0,1 par la normalisation des paramètres. Il s'agit de crêtes d'échantillons ;
aucune certification True Peak n'est revendiquée. Le moteur du limiteur, sa
licence MIT et son algorithme restent ceux déjà livrés avec PEAK/VECTOR LIMIT.
Le réglage de canaux préserve ici les entrées mono.

## Mesures et compatibilité

Les projets et presets conservent leurs clés et leurs réglages éditables. Ils
utilisent désormais ce DSP ; l'identité sonore avec l'ancien compresseur du
navigateur et son gain implicite n'est pas recherchée. Les projets sauvegardés
ne reçoivent pas une normalisation automatique. Le nouveau sens de Ceiling
GUARD s'applique aussi aux projets anciens.

Vérifications locales :

- 717 tests Node, vérification syntaxique et build.
- 171 contrôles avec les vrais AudioWorklet sur les six modules à 44,1/48/96 kHz.
  Ils couvrent retard, niveau sous le seuil, transfert, gain explicite, canaux,
  somme parallèle, dé-essing, plafond à trois mélanges, automation, pistes et
  master, bypass, import/export de rack, compensation entre voies et libération.
- 96 contrôles du noyau et des cinq compresseurs précédents toujours réussis.
- Façade EXO : commandes, graphe, fréquence du contexte, vraie réduction de gain,
  presets piste/master et affichage mobile vérifiés.
- 31 refrains du catalogue entre −17,29 et −15,87 LUFS, crêtes d'échantillons au
  plus à −1,5 dBFS. Six rendus séparés voix/instrumental conservent un rapport
  RMS supérieur à 0,35 dans le routage public complet.
- R&B 2005 : sauvegarde, réouverture à froid, import portable, lecture puis WAV
  complet de 224,7 secondes en stéréo 24 bits / 44,1 kHz. Aucun échantillon
  invalide ou hors plage ; toutes les sections ont un signal audible.

Les mesures détaillées sont dans `pack-dynamics-measurements.json`. Le diagnostic
PCM du morceau complet signale 22 sauts candidats sur le canal droit ; ce
critère heuristique ne distingue pas un transitoire musical d'un clic. Ces
résultats ne remplacent pas l'écoute critique ni une certification commerciale.
La CI conserve les rapports et un WAV GUARD avec Comp mix zéro dans l'artefact
`studio-compressor-dsp`.
