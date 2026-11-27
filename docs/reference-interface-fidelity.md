# Interface — corrections après comparaison FL Studio / Pro Tools

L’audit a porté sur le site en ligne et main après la fusion de #295. Le profil FL gardait des commandes Pro Tools dans la barre principale, le Browser latéral restait une liste plate et les tranches du mixeur dépassaient de 81 px leur hauteur visible. Les valeurs de niveau et les noms inférieurs nécessitaient un défilement vertical, y compris en 1920×1080.

## Comportement livré

- Le mixeur flottant FL utilise neuf rangées explicites. Faders, valeurs numériques, noms, choix d’instrument, entrées et sorties tiennent dans la fenêtre avant tout défilement. Le défilement horizontal reste disponible pour les sessions larges ; les inserts de la tranche sélectionnée restent à droite. La fenêtre conserve une hauteur minimale qui protège les commandes.
- F6, F7 et F9 ouvrent puis masquent respectivement Channel Rack, Piano Roll et Mixer dans le profil FL sur ordinateur. F5 expose la Playlist intégrée en fermant ces trois fenêtres de composition ; la Playlist reste une surface intégrée, pas une nouvelle fenêtre détachable. Les plugins indépendants restent gérés séparément. Les champs de saisie, modales et prises en cours gardent leurs protections.
- Le Piano Roll flottant ne laisse plus un éditeur inférieur vide qui consomme de la place derrière lui. Les déplacements, redimensionnements et dispositions enregistrées continuent d’utiliser le gestionnaire existant.
- Le Browser latéral emploie les mêmes identités de collection et famille que le sélecteur d’insertion. Les boutons de modules existants sont conservés. Chaque module possède une branche de presets, classés par source (Usine, Projet, Appareil) et famille de son. Le kit Pulse et Tune restent accessibles.
- La recherche trouve aussi les presets, ouvre leurs ancêtres et rétablit les dossiers repliés lorsqu’on l’efface. Les presets sont relus avant application ; les changements de bibliothèque ou de projet ne permettent pas d’appliquer silencieusement un ancien index. Une sélection crée un seul point d’annulation. Un preset d’effet utilise les vrais inserts et refuse une chaîne pleine avant de modifier le projet. L’accès mobile passe par Pistes → Sons.
- En FL, Shuffle, Spot, Selector et Crossfade restent disponibles dans Outils d’édition. La barre principale expose les outils de composition. En Pro Tools, ces mêmes commandes retrouvent leur place et leurs libellés. Le changement de profil ne remplace pas les commandes musicales ni leurs listeners.

## Vérification

`tests/reference-fidelity-browser.mjs` utilise l’application réelle dans Chromium avec une session de neuf pistes. Il vérifie les fenêtres et raccourcis, les champs protégés, les limites des commandes en 1920×1080, 1366×768 et 1024×600, la recherche sous dossiers fermés, les presets usine/projet/appareil, les inserts effectifs, l’annulation, le Browser à 390×844 et la réouverture à froid du projet. Les captures et mesures sont déposées dans `artifacts/reference-fidelity` et jointes au workflow des espaces de travail.

```sh
npm test
npm run check
npm run build
node tests/reference-fidelity-browser.mjs
```

Playwright et Chromium sont nécessaires au test navigateur ; `STUDIO_TEST_CHROMIUM_PATH` permet de sélectionner un navigateur installé. Les parcours existants de dispositions, fenêtres de plugins, dossiers de presets et matrice de thèmes complètent cette vérification.

Ce changement corrige les écarts observés. Il ne rend pas l’application identique pixel par pixel à FL Studio ou Pro Tools et ne certifie pas toutes leurs fonctions, l’audio matériel ou les navigateurs mobiles physiques.
