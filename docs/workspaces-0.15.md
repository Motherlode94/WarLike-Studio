# WarLike Studio 0.15 — flux de travail inspiré de FL Studio

Ce module rend immédiatement accessibles les fenêtres **Playlist (F5)**, **Channel Rack (F6)**, **Piano Roll (F7)** et **Mixer (F9)**. Il réutilise les véritables éditeurs de WarLike Studio, leurs projets et leur moteur audio : aucune seconde interface factice n'est créée.

## Navigation

- **F5 — Playlist :** revient à la timeline multipiste.
- **F6 — Channel Rack :** ouvre la fenêtre des canaux, patterns et pas.
- **F7 — Piano Roll :** ouvre le canal instrument sélectionné ; utilise le premier instrument disponible si la sélection est une piste audio ou un bus. Si aucun instrument n'existe, signale de l'ajouter.
- **F9 — Mixer :** ouvre les voies du mixeur avec leurs inserts.
- Les mêmes commandes existent dans la nouvelle barre WORKSPACES, y compris sur mobile.

Les raccourcis ne sont pas capturés dans un champ texte, une zone éditable, une modale ouverte, pendant un enregistrement, ou avec Ctrl/Alt/Meta/Maj. Ainsi, le studio évite de casser les opérations d'édition et les prises.

## Tests et limites

`tests/workspace-shortcuts.test.mjs` vérifie la table des fonctions, le filtrage des événements et le dispatch. `npm test` et `npm run build` restent les commandes de contrôle du dépôt. Les vérifications GitHub et le déploiement sont à confirmer après exécution.

Cette évolution apporte un workflow plus proche de FL Studio, **mais ne rend pas WarLike Studio entièrement équivalent à FL Studio** : compatibilité VST natifs, automation avancée, moteur audio à faible latence et ergonomie multi-fenêtres demandent encore des travaux spécifiques.
