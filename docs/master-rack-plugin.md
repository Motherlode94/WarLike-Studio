# CHAYAH MASTER RACK

Le Master possède désormais un rack natif dans une fenêtre déplaçable,
redimensionnable et réductible. Le bouton Mastering et le bouton du canal
Master ouvrent ce même processeur. La Playlist ou le Mix reste derrière lui.
Il s'agit du rack du bus Master ; cette version ne fournit pas de VST externe
ni de rack supplémentaire à insérer sur chaque piste.

## Utilisation

- Clique sur un emplacement pour choisir un effet ou un preset. Clique sur
  un effet chargé pour ouvrir sa fenêtre de réglages, puis referme cette
  fenêtre pour revenir au rack. Les surfaces natives existantes restent
  disponibles pour les premiers exemplaires ; les exemplaires supplémentaires
  disposent de contrôles propres à leur instance.
- La colonne gauche est la chaîne série, parcourue de haut en bas.
  Une division occupe un emplacement et réunit ses voies avant l'effet suivant.
- Ajoute une division parallèle ou par bandes depuis un emplacement vide.
  Les voies possèdent leur chaîne d'effets, niveau, panoramique, Mute, Solo,
  sélection Stéréo/Mid/Side/Gauche/Droite et mesure de crête réelle.
- Déplace un effet en le glissant vers un emplacement ; deux effets s'échangent.
  Ctrl/Cmd + glisser copie dans un emplacement vide. Les boutons ↑, ↓, Copier
  et × offrent les mêmes opérations à la souris ou au clavier.
- Les macros disposent de plusieurs cibles, de plages de départ/fin et de
  sens inversables. Un paramètre ne peut appartenir qu'à une seule macro.
- A/B conserve deux configurations complètes pendant la session courante.
  Le bypass global reste indépendant. La configuration active est sauvegardée
  dans le projet ; les deux instantanés de comparaison sont temporaires.
- Entrée, Sortie et Traité/direct agissent réellement sur le signal.
  Le bypass global contourne aussi ces gains.
- Presets → Sauver le rack exporte les voies, instances et macros au format
  `chayah-master-rack` version 2. Les anciennes chaînes série restent lisibles.
  Les presets WAR linéaires conservent leur propre format ; leur capture
  renvoie vers cette sauvegarde complète lorsqu'un rack version 2 est actif.
- Mesures & assistant regroupe les outils d'analyse existants et CHAYAH AI
  MASTER, qui reste un assistant d'analyse DSP locale avec validation manuelle.

## Routage et limites

12 emplacements dans la chaîne principale et dans chaque voie ; 64 modules
maximum au total. Une division parallèle contient 2 à 8 voies, une division
fréquentielle 2 à 5 bandes. Pas de division imbriquée ni de boucle de retour.
Une voie ajoutée démarre en Mute. Les deux voies parallèles initiales sont
atténuées de 6,02 dB chacune pour conserver le niveau sans traitement.

Les bandes sont complémentaires : LP1, LP2−LP1, puis Entrée−LPn. Sans effets,
leur somme reconstitue le signal. Elles ne sont pas présentées comme des
filtres Linkwitz–Riley ou à phase linéaire. Le mode Mid vaut (L+R)/2 sur les
deux sorties ; le mode Side vaut (L−R)/2 avec polarité inverse à droite.

Les voies courtes et le chemin direct reçoivent un retard compensateur fondé
sur les latences déclarées des processeurs natifs. L'affichage indique une
estimation, pas une mesure automatique de chaque processeur.
Le même graphe sert à la lecture et au rendu WAV hors ligne.

## Vérification reproductible

```sh
npm test
npm run check
npm run build
npm install --no-save playwright@1.56.1
npx playwright install chromium
node tests/master-rack-dsp-browser.mjs
node tests/master-rack-browser.mjs
```

Les essais audio utilisent les vrais nœuds Web Audio : somme parallèle,
reconstruction Mid/Side et trois bandes, Solo/Mute, instances GLUE/BALANCE
indépendantes, bypass, gains, rendu et décodage WAV float, sauvegarde et
récupération du même PCM. Les essais d'interface manipulent la fenêtre, les
inserts, les copies et déplacements, Annuler, A/B, macros et plages, coupures,
ajout de voie, export portable et réouverture à froid. Captures bureau/mobile
et mesures sont déposées dans `artifacts/master-rack/` par la CI.
Les cinq suites matérielles ouvrent désormais chaque processeur séparément.

## Référence de l'organisation

Référence vérifiée : [Waves StudioRack v2, vues et contrôles d'entrée/sortie](https://assets.wavescdn.com/pdf/plugins/studiorack-v2.pdf), pages 9–12 et 21–22.

| Élément de la référence | Implémentation native |
| --- | --- |
| Entrée rotative et inverseur de polarité à gauche | Contrôleur rotatif existant, Ø réellement appliqué au DSP, indicateurs d'entrée après gain |
| Chaîne principale à gauche, divisions au centre | Huit emplacements visibles ; I–L accessibles pour conserver les douze emplacements des sessions WarLike |
| Fader de sortie vertical et L/R à droite | Niveau de sortie réel, extinction exacte en bas, crêtes stéréo mesurées et valeurs sous les rails |
| Vumètre GR | Source explicitement assignable parmi les compresseurs natifs ; lecture du processeur choisi, sans déduction fictive à partir des niveaux d'entrée/sortie |
| Entrée/sortie présentes dans les différentes vues | Commandes et vumètres restent visibles dans Rack, Macros et Mesures |
| Contrôles pan/niveau en bas de chaque voie | Panoramique rotatif et fader vertical reliés aux paramètres de la voie |

Les marques et ressources graphiques Waves ne sont pas incorporées. Les quatre
emplacements supplémentaires et les limites du graphe sont documentés ; le rack
n'est pas présenté comme un hôte VST3 universel.

## Comportement des fenêtres à la souris

Le gestionnaire commun sert au rack, à ses modules et aux fenêtres individuelles
d'effets/instruments :

- Glissement par la barre de titre ; les boutons du bandeau et les paramètres
  ne déclenchent pas ce déplacement.
- Redimensionnement par les quatre bords et les quatre coins, avec curseurs
  directionnels, tailles minimales et bord opposé conservé.
- Clic pour donner le focus et passer devant ; le focus d'un module imbriqué
  ne remonte pas son rack propriétaire au-dessus de lui.
- Position et dimensions conservées après réduction et réouverture.
- Défilement du contenu à l'intérieur de la fenêtre, titre accessible ; une
  rotation de bouton ou un mouvement de fader ne déplace pas la fenêtre.
- Réglages rotatifs relatifs, Maj pour affiner, double-clic pour le défaut,
  molette sur les boutons et faders. Les gestes concernent l'instance visée.
- Capture de pointeur relâchée à la fin ou lors d'une interruption du geste.

`node tests/window-mouse-browser.mjs` exécute les mouvements et clics réels du
pointeur sur les fenêtres de production, contrôle les huit directions, le focus,
les paramètres, les fenêtres imbriquées et la réouverture. Il complète les
essais existants du gestionnaire, des presets et des espaces de travail.

### Couverture des autres effets et instruments

`node tests/plugin-mouse-matrix-browser.mjs` parcourt les 52 effets et les 54
instruments du registre natif. Deux sessions séparées respectent la limite de
64 pistes de l'application. Pour chaque éditeur, le test utilise le clic
sur son insert réel, le glissement du titre, le bord droit et le coin, puis
un réglage rotatif à la souris, Annuler, Réduire, Fermer et Rouvrir. Il vérifie
le focus, les dimensions conservées, le paramètre restauré et la préservation
du projet exporté. Le test commun des huit directions et des fenêtres imbriquées
reste complémentaire.

La CI exécute séparément les familles `effect` et `instrument` via
`STUDIO_MOUSE_FAMILY`. Les rapports listent chaque identifiant réellement testé.
Cette couverture concerne le comportement des fenêtres et des commandes ;
elle ne constitue pas une certification sonore de tous les processeurs.

Le badge d'information « Mises à jour en cours » est placé sous les fenêtres
flottantes : il ne peut plus intercepter le coin de redimensionnement d'un
éditeur situé en bas à droite.
