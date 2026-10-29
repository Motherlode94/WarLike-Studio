# Warlike Studio 0.12 — EXO

## Contenu

Un instrument EXO à 32 presets et quatre effets à cinq presets chacun. Le
registre comporte sept instruments et seize effets, plus les trois modules de
mastering et TUNE : 27 modules. Les presets du catalogue totalisent 142 sons
et réglages. La création de pistes et le choix d’un son n’insèrent aucun effet.

## Validation

- 72 tests Node réussis : limites et unicité des 32 presets, huit catégories,
  transpositions, vélocités et modes d’arpégiateur, racks, anciennes sessions,
  inserts répétés, latence connue, queues de réverbération et stéréo amont.
- Rendus OfflineAudioContext à 48 kHz dans `tests/exo-browser.html` : les
  32 presets donnent un signal fini, audible et sous 0 dBFS pour la note testée.
- EXO STRIP : gain de sortie −6 dB, signal parallèle sec conservé et image
  stéréo préservée. Deux instances à −3 dB produisent le gain cumulé attendu.
- EXO FOCUS : réduction sur la bande dépassant le seuil, conservation du
  signal faible et du signal hors bande.
- EXO AIR : harmoniques mesurables ajoutées aux aigus, graves préservés.
- EXO SPACE : pré-délai, queue de convolution et différence gauche/droite.
- Automation de sortie EXO AIR : rampe réelle mesurée dans le rendu.
- Pattern EXO avec arpégiateur : rendu offline stéréo audible.

Le test historique du catalogue a été adapté pour tester chaque processeur
sur une piste indépendante : seize types d’effets ne peuvent pas tous occuper
simultanément les douze inserts d’une piste.

- Interface navigateur : création EXO avec inserts vides, recherche Glass,
  préécoute, favoris, chargement de preset et mise à jour des macros.
- Sauvegarde d’un preset personnel, rechargement de la page et recherche du
  son retrouvé ; nettoyage du preset de test. Mode avancé conservé après
  modification de l’arpégiateur. Insertion volontaire puis retrait de STRIP.
- Capture finale inspectée : `docs/exo-0.12.jpg`.

## Portée

Sons et réponses de convolution originaux générés par synthèse, sans contenu
Waves, Omnisphere ou Nexus. Les références de workflow sont liées dans README.
EXO n’est pas un rompler acoustique ni un chargeur d’expansions commerciales.
L’espace interne du synthé est un ensemble de retards courts ; EXO SPACE est
le processeur de convolution séparé, à insérer volontairement.

Les favoris et la banque User dépendent du stockage local ; le rack exporté
conserve les paramètres du son sélectionné. La polyphonie est limitée à 24
notes simultanées par contexte EXO, avec unisson de trois oscillateurs par
couche. Il n’y a pas de benchmark de grande session, de validation certifiée
de mastering ni de test de matériel MIDI physique dans cette livraison.

EXO FOCUS est un contrôle dynamique de bande à détection d’enveloppe, sans
modèle neuronal ni suppression générale du bruit. La compensation connue de
STRIP couvre les 6 ms de son compresseur. Les limites du moteur web décrites
dans les vérifications précédentes restent applicables.
