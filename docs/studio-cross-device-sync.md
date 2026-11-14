# Synchronisation de Studio entre appareils — intégration progressive

## État précis
- Tests de l'accueil : validés dans la PR #5 (Node CI + Studio quality gates).
- `dist/studio-cloud-client.js` : **client API et tests uniquement** ; **aucune synchronisation effective n'est activée**.
- WarLike Server `warlike-server.pages.dev` : page de statut, pas un backend authentifié fonctionnel pour les projets Studio.
- Les données locales restent dans IndexedDB. Ne pas remplacer ce stockage ni prétendre à l'isolation des utilisateurs.

## Prérequis backend bloquants
1. Déployer une application serveur Cloudflare Workers HTTPS avec D1, R2 et une identité WarLike fiable. Jamais se fier à un `ownerId` fourni par le navigateur.
2. Exposer `/api/studio/me` avec `userId` et `studioAccess` authentifiés côté serveur.
3. Implémenter les routes `/api/studio/projects`, `/api/studio/projects/:id` avec les autorisations du propriétaire et la révision optimiste.
4. Ajouter le protocole de transfert audio privé et la reprise pour les gros médias (pas d'URL R2 publique permanente).
5. Définir une stratégie de conflit 409, export local de secours, quota et suppression.
6. Limiter CORS aux domaines de Studio et protéger les changements d'état avec une défense CSRF adaptée à la méthode d'authentification.
7. Tester deux comptes A/B, deux appareils, session expirée, reprise après panne, upload et accès refusé aux fichiers R2.

## Prochaine intégration frontend
N'activer le client qu'après réponse valide de `GET /api/studio/me`. Garder les projets hors ligne dans leur propre espace, et ne jamais uploader automatiquement la session historique commune `current`.
Le navigateur ne choisit jamais le propriétaire : l'identité doit provenir du serveur. En cas de 401/403, masquer les projets distants et conserver la copie locale sans la transmettre.
En cas de 409, conserver les deux versions et demander une résolution. Un succès HTTP de métadonnées ne prouve pas que les médias sont synchronisés ; afficher un statut séparé pour les assets.
