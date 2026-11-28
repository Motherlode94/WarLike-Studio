# Latence VOX SHIFT et accès réel à l’automation

L’audit de main après #300 a reproduit un retard VOX SHIFT de 112,5 ms à
48/96 kHz, déclaré à zéro dans les pistes et dans le rack. L’éditeur d’automation
ignorait aussi les familles EXO, HARDI et ELIANA, même lorsque des AudioParams
étaient reliés au moteur. Ce complément de #301 corrige ces deux parcours.

## Alignement et fin de rendu

`voice-shift-timing.js` définit le centre de la fenêtre à deux grains, arrondi
à l’échantillon : `round(2,5 × max(512, round(sampleRate × 0,045)))`.
Le processeur, les pistes, les bus, les branches et le mélange global du rack
utilisent la même valeur : 4 963 frames à 44,1 kHz, 5 400 à 48 kHz, 10 800 à
96 kHz. Il s’agit de la latence nominale du centre des grains ; un signal
transposé n’est pas une copie dont toutes les phases resteraient identiques.

Le retour à zéro demi-ton rend le chemin neutre, même si la phase des grains
avait bougé auparavant. Le mono reste mono. Le buffer circulaire est dimensionné
pour la fenêtre réelle du contexte ; la suppression ferme le port et arrête le
processeur. Il n’y a aucun second moteur ou option Legacy.

Les délais des sorties et envois de pistes sont agrandis si la compensation
nécessaire dépasse leur capacité, au lieu de plafonner silencieusement à une
seconde. Le rack disposait déjà d’une capacité de quatre secondes.

Le WAV réserve la latence maximale du routage et du master en fin de rendu,
y compris lorsque les queues d’effets sont désactivées. La durée inclut donc
la durée musicale, la marge de départ existante de 10 ms, la latence réservée
et, si demandées, les queues d’effets. Aucun décalage global du début du fichier
n’est soustrait ; la latence reste audible en lecture et présente dans le WAV.
Cette réserve commune au projet garde la durée des stems d’un même mode
cohérente et évite de perdre les derniers échantillons retardés.

## Automation

La liste de capacités est partagée par le sélecteur de l’éditeur, WRITE et la
résolution des cibles audio. Chaque paramètre proposé doit posséder au moins
un véritable AudioParam. Les instances dupliquées gardent leur identifiant
et leurs courbes indépendants.

Les six nouveaux traitements dynamiques sont entièrement proposés. Les autres
modules EXO/HARDI/ELIANA exposent leurs paramètres reliés : EQ, filtres,
largeur, délais, mix et gains. Les commandes qui reconstruisent une courbe de
WaveShaper ou une réponse impulsionnelle, comme Drive HARDI TAPE ou Decay EXO
SPACE, restent manuelles ; elles ne sont pas proposées comme une automation
sans effet. Les commandes liées entre elles qui exigeraient une modulation
coordonnée conservent également leur réglage manuel.

Les liaisons manquantes des modules VOX à AudioParams directs ont été ajoutées.
Les deux seuils de VOX LEVEL commandent chacun leur étage. Les profils de micro
conservent leurs corrections de gain pendant l’automation. EXO SPACE conserve
sa loi de niveau mono lorsque son mix est automatisé. Un module sans liaison
ne tombe plus dans une fausse branche RELAY qui pouvait interrompre une
simple automation de volume.

## Vérification

- 722 tests Node, check et build.
- `studio-alignment-browser.mjs` : 247 contrôles sur les vrais processeurs,
  routages et paramètres proposés, à 44,1/48/96 kHz, dont douze VOX SHIFT en
  série, le mélange parallèle du rack, le retour à zéro après transposition et
  une impulsion en toute fin de WAV sans queue d’effet.
- Le parcours UI ouvre HARDI BUS, sélectionne Threshold dans l’éditeur, crée un
  point, exporte le projet puis vérifie la valeur après réouverture à froid.
- Les 171 contrôles des nouveaux compresseurs de pack et les 96 contrôles du
  noyau principal restent requis ; les 31 démos et l’export complet sont
  recontrôlés après le changement de durée de rendu.

Les délais natifs Web Audio emploient une précision limitée pour leurs temps.
À 44,1 kHz, le test des douze étages mesure une erreur de centre de 0,001953125
échantillon entre les deux chemins ; elle est nulle à 48/96 kHz. Le test exige
moins de 0,01 échantillon et la conservation de la somme de l’impulsion, sans
revendiquer une identité PCM bit à bit entre un retard natif et douze étages.
Les mesures détaillées sont dans `studio-alignment-measurements.json` et les
captures/projets portables sont conservés par le workflow VOICE FX.

La gestion MIDI Note On/Note Off des voix tenues n’est pas modifiée par ce lot.
