# R08.3g.6 — Dossiers de presets

Dans le sélecteur d'instrument ou d'insert, **Afficher → Presets** présente une arborescence : **source → collection → famille → plugin → genre → preset**. Les presets d'usine et ceux de cet appareil restent distincts même lorsqu'ils portent le même nom. Les filtres de collection, famille, favoris, source et recherche se combinent.

Chaque fenêtre individuelle possède aussi **Parcourir les presets**, sous sa barre de commandes. Elle regroupe les presets **Usine**, **Mes presets · projet** (effets) et **Mes presets · cet appareil** (instruments et effets), avec une recherche et un filtre de source propres à cette fenêtre. Charger un résultat utilise les commandes existantes du plugin propriétaire et son historique Annuler/Rétablir. Les paramètres d'un autre insert ou d'une autre piste ne sont pas modifiés.

Les genres correspondent aux préfixes explicites des collections : Trap, Drill, Amapiano, Afrobeat, R&B / Neo Soul, Funk, Gospel, Rock alternatif, Metal, Ambient et Cinematic. Les noms sans ce préfixe restent dans **Général**. Le sélecteur natif de la barre conserve ses valeurs et regroupe aussi ses options par genre ; les flèches précédent/suivant conservent l'ordre d'origine du catalogue.

Les dossiers s'ouvrent au clic, au toucher et avec Entrée/Espace. Une recherche ouvre les chemins correspondants ; l'effacer restaure les dossiers repliés. Échap ferme d'abord le navigateur de presets de la fenêtre avant de fermer le plugin. La recherche et la source choisies survivent aux rafraîchissements de cette fenêtre ; fermer la fenêtre les réinitialise.

**Mes presets et racks** conserve les commandes de sauvegarde, suppression et import/export. Le Master conserve sa vue et ses banques dédiées. Aucune migration de projet, nouvelle banque de sons ou modification de DSP n'est introduite. Le stockage personnel reste local au profil du navigateur ; les presets de projet sont transportés dans le fichier `.chayah`.

## Vérification

Les tests Node contrôlent la couverture des registres d'instruments et d'effets, les indices d'origine, les valeurs inchangées, les filtres et les noms identiques dans des sources différentes. `tests/preset-folders-browser.mjs`, dans le workflow **Studio workspace layouts**, vérifie les vraies commandes d'application, deux fenêtres du même instrument/effet, Annuler/Rétablir, les sources projet/appareil, les noms rendus en texte, la recherche, le repli des dossiers, l'affichage mobile et l'export/import du projet. Les captures se trouvent dans l'artefact `preset-folders`. Le scénario existant des fenêtres individuelles reste exécuté.
