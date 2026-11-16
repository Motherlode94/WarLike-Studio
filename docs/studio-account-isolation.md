# WarLike Studio — Contrat d'isolation des comptes (P0)

Statut : protection des opérations cloud par session Server et précondition de compte ; voir [le fonctionnement et les tests](studio-cloud-account-safety.md). La bibliothèque IndexedDB locale reste partagée et non chiffrée. La connexion native et les routes Studio existent dans WarLike Server ; leur disponibilité ne remplace pas les essais authentifiés.

## Identité fiable
- Le navigateur ne peut jamais choisir librement son `userId`. Aucun en-tête `X-User-Id`, champ JSON `ownerId`, localStorage ou IndexedDB ne vaut preuve d'identité.
- Le backend Studio vérifie une session authentifiée par le serveur d'identité WarLike (token opaque vérifiable serveur à serveur, ou cookie HttpOnly Secure SameSite approprié). Refuser (401) en l'absence de preuve ; refuser (403) si compte suspendu ou accès Studio absent.
- Les réponses privées : `Cache-Control: private, no-store`; CORS limité aux origines explicitement autorisées avec vérification CSRF des requêtes qui modifient des données si cookies.
- Ne jamais transférer secrets de signature, token d'administration ou identifiants d'un autre membre au navigateur.

## API proposée (toutes les routes privées)
- `GET /api/studio/me` -> identité affichable, droits Studio ; 401 sinon.
- `GET /api/studio/projects` -> uniquement les projets du principal authentifié.
- `POST /api/studio/projects` -> crée un UUID côté serveur ; ownerId dérivé de la session, jamais de la requête.
- `GET /api/studio/projects/:id` -> vérifie propriétaire avant lecture.
- `PUT /api/studio/projects/:id` -> vérifie propriétaire et révision attendue (conflits 409).
- `DELETE /api/studio/projects/:id` -> vérifie propriétaire, suppression douce ou définitive explicitement décidée.
- `POST /api/studio/projects/:id/assets` -> contrôle propriétaire, taille, type réel du média et quota avant écriture R2.
- `GET /api/studio/projects/:id/assets/:assetId` -> valide propriétaire **avant** de charger les octets R2.
- Les exports et les versions sont soumis aux mêmes autorisations ; aucune URL publique R2 permanente.

## D1 et R2
Voir `docs/studio-projects-d1.sql`. Chaque requête sur un projet filtre `WHERE id = ? AND owner_id = ?` avec ownerId fourni par la session vérifiée.
Clé R2 recommandée : `studio/<ownerId>/<projectId>/<assetUUID>`; les valeurs ne doivent pas provenir directement d'un chemin arbitraire envoyé par le client. Une clé R2 n'est pas une autorisation.

## Migration sans fuite
1. Conserver intacte l'ancienne clé IndexedDB `current` et l'afficher seulement comme import manuel local.
2. À la connexion validée, masquer la bibliothèque locale partagée par défaut ; n'afficher que les projets renvoyés par l'API privée.
3. Importer l'ancien `.chayah` dans un **nouveau** projet de l'utilisateur connecté, après choix explicite. Ne jamais attribuer silencieusement une ancienne session à la personne qui vient de se connecter.
4. Sur changement de compte ou déconnexion : arrêter lecture/enregistrement, annuler autosaves et requêtes en cours, vider audio et projet en mémoire, fermer les contextes audio, effacer les caches sensibles.
5. Une sauvegarde hors ligne doit être chiffrée avec une clé liée à une session/profil sûr ou désactivée sur navigateur partagé ; préfixer une clé IndexedDB par userId ne garantit pas la confidentialité.

## Tests d'acceptation indispensables
- A crée P1 ; B ne peut ni lister, ni ouvrir, ni modifier, ni supprimer P1 (403/404).
- B ne peut récupérer aucun asset de P1, même avec un ID ou une URL connus.
- Modifier `ownerId` dans le JSON, le chemin ou des en-têtes est sans effet.
- A et B dans deux onglets sur le même navigateur : aucune sauvegarde de A après le changement d'identité vers B.
- Déconnexion puis connexion sur la même machine : aucun son ni projet précédent à l'écran.
- Session expirée ou suspendue : refus immédiat et sauvegarde locale non transmise sous une autre identité.
- Deux modifications simultanées avec même version : une seule gagne, l'autre reçoit 409.
- Tentatives d'énumération d'IDs, path traversal, upload volumineux et CORS non autorisé refusées.
- Sauvegarde ancienne préservée, migration manuelle testée sur une copie et export restitué.

**Condition de fusion** : backend authentifié accessible et tests négatifs A/B réussis. Sans cela le correctif reste en branche expérimentale.
