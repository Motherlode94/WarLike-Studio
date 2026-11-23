# Sons pour Engine

**Bibliothèque → Sons pour Engine** et **Projet → Sons pour Engine · WAV** ouvrent 24 sons originaux de synthèse : quatre sons par dossier Interface, Gameplay, Mouvements, Impacts, Science-fiction et Ambiances.

- **Écouter** lance un aperçu sec atténué, indépendant des FX et du mastering de la session. **Arrêter l’écoute**, changer de filtre, d'onglet ou de vue arrête cet aperçu.
- **Ajouter piste** insère le son comme véritable clip audio, sur une nouvelle piste au curseur de lecture. L'opération respecte la limite de 64 pistes et refuse l'ajout pendant une prise. Si le projet change pendant l'initialisation audio, l'ajout est abandonné. La durée du clip est calculée au tempo de la session.
- **Télécharger WAV** exporte le son sec en mono PCM 24 bits / 48 kHz.
- **Télécharger le pack filtré · ZIP** exporte tous les résultats du filtre actif, y compris ceux des autres pages, dans des sous-dossiers par catégorie. `manifest.json` indexe les noms, chemins et durées ; `README.txt` explique le transfert. Le filtre vide désactive l'export de pack.

Les clips ajoutés sont intégrés aux fichiers `.chayah` avec leurs octets audio et à la sauvegarde locale habituelle. Annuler retire la piste et sa référence du projet ; Rétablir retrouve le même fichier. Les notes, inserts et routages des autres pistes sont conservés.

## Utilisation dans Engine

Télécharge un WAV, ou décompresse le ZIP, puis utilise l'import de fichier audio de ta source audio Engine. Les fichiers sont des WAV standards ; le manifeste est documentaire et ne déclenche pas d'import automatique. Aucun fichier n'est envoyé à WarLike Server et aucune scène Engine n'est modifiée par Studio.

Ces créations sont utilisables dans tes jeux et projets WarLike. Elles ne contiennent pas d'enregistrement ni de pack de samples tiers. Les pas, impacts, pluie et moteurs sont des interprétations synthétiques, pas des prises de son réalistes. Les ambiances sont des extraits de quatre secondes avec fondus ; elles ne sont pas certifiées comme boucles sans raccord. Les exports n'incluent pas les FX ou volumes de piste ajoutés ensuite dans Studio ; utilise l'export de session ou de stems pour ces traitements.

## Validation

Les tests Node rendent les 24 profils à 44,1 et 48 kHz : valeurs finies, niveau audible, marge de crête, offset continu, extrémités, déterminisme et signaux distincts. Ils décodent indépendamment les en-têtes/échantillons des WAV 24 bits et contrôlent le contenu des packs filtrés.

`tests/game-sounds-browser.mjs` vérifie recherche, catégories et pages, écoute/arrêt, téléchargement WAV et ZIP, ajout de piste audio, Annuler/Rétablir, sauvegarde/import/réouverture, préservation du MIDI et quatre thèmes mobiles. Web Audio décode les 24 WAV et produit un rapport de crête/RMS. Le workflow **Studio workspace layouts** publie les captures et un WAV d'exemple dans l'artefact `game-sounds`. La qualité artistique reste à apprécier à l'écoute ; la validation ne couvre pas encore un import dans un navigateur Engine réel.
