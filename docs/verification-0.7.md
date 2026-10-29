# Vérification 0.7.0 — 29 octobre 2026

Deux packs CHAYAH originaux, six effets, 30 presets supplémentaires. Banque totale :
90 presets. La Suite comprend 22 modules, mastering et TUNE inclus.

`npm run build` vérifie 14 modules JavaScript et les assets. `npm test` : 34 tests.
Le banc `tests/packs-browser.html` a été exécuté dans Chrome avec les vrais nœuds
Web Audio et OfflineAudioContext, sans permission micro.

| Essai de signal | Résultat observé |
| --- | --- |
| Six nouveaux effets bypassés | Signal préservé à une erreur inférieure à 1e-5 |
| HUSH | Signal faible atténué de 36 dB, signal fort préservé |
| SIBIL | Bande de 6,5 kHz atténuée de 9 dB ; grave à 300 Hz préservé |
| SIBIL sous le seuil | Signal préservé |
| EMBER | Harmoniques mesurées sur une sinusoïde |
| ORBIT | Signal latéral stéréo RMS 0,1580 sur entrée mono |
| SWAY autopan | Alternance gauche/droite mesurée |
| SWAY tremolo | Creux de modulation mesuré |
| RELAY | Échos croisés au tempo, tolérance d’un bloc de feedback natif |
| Export WAV | WAV stéréo non silencieux, six modules actifs sur PULSE |

Le banc `tests/content-browser.html` a également été exécuté après l’ajout : tous
les essais précédents de synthèse, percussions, mix, mastering et export passent.
Les 30 presets de packs sont bornés et complets ; les anciens racks gardent leurs
réglages et reçoivent les six nouveaux modules désactivés.

Vérification UI : catalogue Packs, filtre Motion & Color, preset Sand Drive appliqué
à la piste choisie, fenêtre EMBER avec ses cinq paramètres, SIBIL et changements de
presets pendant la lecture sans erreur de l’application.

Références de familles fonctionnelles, sans reprise d’algorithmes :
- https://www.waves.com/plugins/sibilance
- https://www.soundtoys.com/product/effect-rack/

Ces tests utilisent des signaux synthétiques. Ils ne constituent pas une mesure
comparative de qualité face aux produits des éditeurs cités.
