# Vérification 0.6.0 — 28 octobre 2026

`npm run build` : 12 modules JavaScript vérifiés et assets résolus.
`npm test` : 30 tests réussis, dont compatibilité des racks, isolation des réglages,
contenu des sessions, gains d’enregistrement et correction de hauteur sur le signal.

Le banc `tests/content-browser.html` a été exécuté dans Chrome avec les vrais
OfflineAudioContext. Résultats observés :

| Essai | Résultat |
| --- | --- |
| 6 instruments | Échantillons finis et RMS non nul |
| 8 percussions WAV | Huit WAV mono à 44,1 kHz, non silencieux |
| PRISM +12 dB dans le grave | Ratio RMS 3,59 |
| PRISM fréquence/Q | Bande déplacée à 3 kHz, amplification localisée |
| GLUE | Ratio RMS compressé/dry 0,42 |
| GLUE parallèle | RMS intermédiaire à 50 %, entre dry et compressé |
| COLOR | Dosages 0/50/100 % et atténuation de sortie −6 dB validés |
| BALANCE | Ratio RMS grave 1,95 |
| PRESS | Ratio RMS compressé/dry 0,50 |
| PEAK, entrée +18 dB | Crêtes à −1,000, −6,000 et −12,000 dBFS selon plafond |
| PEAK stéréo | Plafonds vérifiés sur deux canaux en opposition de phase |
| Bypass mastering | Signal identique à la chaîne désactivée |
| Session + Trap Focus | WAV stéréo de 5,70 Mo, crête −1,0 dBFS |

Les mesures RMS dépendent des paramètres du signal de test ; elles ne constituent
pas une spécification de loudness pour la musique.

Vérification UI : ancien projet restauré avec sa prise audio ; ajout de Neon Hook ;
recherche de presets ; session Nocturne Trap de 16 mesures / 9 pistes chargée avec
repères puis restauration de la session précédente et de sa prise ; mastering,
activation, preset, saisie du plafond et A/B ; changement Warm/Crush de COLOR pendant
la lecture sans erreur de l’application ; saisie numérique de fréquence PRISM et
courbe affichée. La persistance du projet et de la prise a été vérifiée après reload.

Captures : `chayah-mix-0.6.jpg` et `chayah-mastering-0.6.jpg`.
La chaîne de mastering est également exercée à l’export par le banc de signal.
Le micro physique de l’utilisateur n’a pas été retesté.
