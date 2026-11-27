# WAR STUDIORACKS
Open from the existing rack or Mix/Master Templates → WAR STUDIORACKS. Filter stage, source and genre, preview ordered effects and numeric parameters, choose append or replace, then apply. Replacement is undoable. Premix can measure the dry pre-fader capture and propose attenuation via neutral TILT EQ (±12 dB); nothing changes until Apply. The current active chain can be downloaded as JSON and imported elsewhere; bypassed effects are excluded. Native individual plugin editors remain authoritative. Export Rack appears in Bounce: profiles configure the existing exporter, optional PCM validation inspects the same render before encoding; no second master chain. True Peak is estimated, not certified. Stacked PRs: merge in numeric order, retarget to main when preceding branch is merged, rerun CI. Unit coverage is not listening or browser acceptance. No new DSP required for initial rack families; dedicated trim and phase-alignment interfaces remain candidates if existing processors prove insufficient.

## Reprise vers main — 27 novembre 2026

Les anciennes PR RACK02–RACK10 ciblaient des branches intermédiaires. Leurs fusions ont eu lieu après le départ de leurs parents vers main : seule la base RACK01 y était livrée. Le lot de reprise réintègre ces changements en cinq PR cumulatives qui ciblent toutes main.

| Partie | Fonction disponible après le lot |
| --- | --- |
| Navigateur | Bouton WAR RACKS sur chaque tranche, filtres source/genre/étape, aperçu ordonné et disposition mobile |
| Voix et prémix | 15 chaînes prémix et 36 chaînes vocales par rôle et genre |
| Instruments et WAR 808 | 54 chaînes instrumentales, racks 808, batteries, percussions et log drum |
| Bus et master | Chaînes de bus/auxiliaire et master, avec destinations séparées |
| Presets et export | Chaîne active portable en JSON, huit profils WAV et contrôle du buffer avant écriture |

Le catalogue complet contient 235 racks : 191 de mix, 29 de master et 15 de prémix. Ces nombres incluent les presets déjà présents, pas uniquement les ajouts du lot.

La mesure de source prépare une réduction de gain, sans appliquer la chaîne avant confirmation. Elle conserve les réglages d'un EQ coloré. Un changement de sélection pendant le calcul invalide le résultat en attente. L'application est indisponible tant que la mesure se poursuit.

Les huit profils d'export définissent format et destination ; ils ne garantissent pas l'acceptation par une radio ou un distributeur. Le contrôle inspecte le rendu réel avant encodage et conserve l'estimation de crête interpolée comme indication, sans certification normative.

Vérification : `npm test`, `npm run check`, `npm run build`. Le parcours `node tests/rack-recovery-browser.mjs` nécessite Playwright ; l'option `STUDIO_TEST_CHROMIUM_PATH` sélectionne un exécutable Chromium. Il vérifie le parcours réel du mixeur, Annuler, sauvegarde/réouverture, mesure périmée, traitement OfflineAudioContext, WAV et limites mobiles. L'écoute musicale de chaque preset reste distincte de ces contrôles.

Résultat de la reprise : 675 tests Node réussis ; build vérifié sur 246 modules. Le parcours Chromium a passé application/Annuler, sauvegarde/réouverture, rejet d'une mesure périmée, aller-retour JSON, limites mobiles et rendu WAV réel. Le signal de contrôle du rack WAR 808 donne une crête absolue de 0,02360 et un WAV de 88 641 frames à 44,1 kHz. Ce signal technique ne certifie pas la qualité musicale de tous les presets.
