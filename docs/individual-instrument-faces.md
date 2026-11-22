# R08.3g.4 — Interfaces individuelles des instruments

Les 42 instruments natifs possèdent une façade vectorielle, une matière visuelle et un regroupement de commandes adaptés à leur moteur. Le code de présentation est séparé dans `instrument-face-model.js`, `instrument-faces.js` et `instrument-faces.css`.

| Famille | Organisation |
| --- | --- |
| HARP, WL KORA, STRING | Pincement, résonance et accordage |
| FLUTE, ORIGINS | Couleur, souffle, articulation et expression |
| Guitares | Position de pincement, caisse, amortissement et jeu ; saturation mise en avant pour WL CRUNCH |
| Pianos et claviers | Couleur, toucher, tenue et espace |
| Cordes et ensembles | Corps, archet, dynamique et largeur |
| WL VANGUARD, NOVA | Oscillateurs, unisson et filtre |
| WL ATLAS, EXO | Couches, filtre, matière et enveloppe |
| WL NEBULA, WL MATRIX | Modulation, spectre et enveloppe |
| PULSE, WL NGOMA | Kit ou membrane, frappe et extinction |
| MONO 808, WL ABYSS | Fondamentale, chute de hauteur et couleur |
| EXO SLICE | Audio, découpe et pads existants, puis accordage et contour |

La façade affiche deux paramètres réellement configurés sur la piste. Les emblèmes SVG sont décoratifs : ils ne représentent pas un signal audio. Les dix instruments WL EXPANSION conservent leurs diagrammes calculés et leurs banques de commandes spécialisées.

## Compatibilité

Les 314 commandes d’origine sont conservées. Les groupes déplacent leurs nœuds DOM sans les cloner : écouteurs, édition numérique, gestes de potentiomètre, valeurs initiales et paramètres audio restent ceux du module natif. Un plan vérifie tous les paramètres avant le déplacement ; un module inconnu conserve son interface.

Les deux conteneurs EXO restent séparés : macros principales et commandes avancées repliables. Les sélecteurs de couches et d’arpégiateur ne sont pas déplacés dans la zone principale. Les navigateurs de samples, sources/crédits, progressions de chargement, touches, forme d’onde et pads restent fonctionnels.

Les règles CSS ciblent uniquement les panneaux d’instruments. Les effets et la barre commune conservent leur présentation. Le DSP, les formats de projet et les banques de presets ne changent pas, y compris les 152 sons Instru.

## Validation

Les tests de modèle vérifient la couverture des 42 instruments, des 314 paramètres, des groupes EXO et des libellés de lecture. Chromium ouvre chaque instrument, modifie une commande réelle, vérifie sa lecture et Annuler/Rétablir, puis charge un preset. Il contrôle aussi l’isolation de deux harpes, les outils spécialisés, l’absence de façade d’instrument sur un effet, six variantes mobiles et l’export/import avec réouverture et conservation des octets audio.

Le workflow existant `Studio workspace layouts` conserve les preuves dans l’artefact `instrument-faces` : captures et rapport par instrument. Les contrôles de régression de la banque Instru et de l’historique EXO SLICE sont exécutés dans ce même workflow.
