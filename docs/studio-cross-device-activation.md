# WarLike Studio — activation contrôlée de la synchronisation inter-appareils

**État observé le 14 novembre 2026 :** le domaine de production répond `{ready:true}` sur `/api/studio/availability` et refuse `/api/studio/me` sans session. Cela valide la présence du binding et la santé du serveur, pas le parcours authentifié complet. Aucun test sur deux ordinateurs physiques n'a été effectué.

## Chaîne de confiance
1. Studio obtient un challenge PKCE SHA-256 et ouvre `https://warlike-server.pages.dev/connect/studio`.
2. L'utilisateur s'identifie sur WarLike Server puis autorise explicitement Studio.
3. Un code unique, valable 120 secondes, revient dans le **fragment** d'URL de Studio.
4. Une Pages Function de Studio échange code + vérificateur avec le Worker lié via `WARLIKE_APP` et reçoit un jeton opaque **uniquement côté serveur**.
5. Studio stocke ce jeton dans un cookie `__Host-warlike-studio`, `Secure; HttpOnly; SameSite=Strict`, puis passe par les routes internes `/api/studio/*`.
6. La Pages Function transmet le jeton en `Authorization: Bearer` uniquement au service Worker, lequel contrôle la session D1 et le propriétaire pour chaque projet ou média.
7. Les projets locaux ne sont pas envoyés sans clic explicite « Synchroniser le projet ouvert ». Les sauvegardes suivantes sont automatiques uniquement pour ce projet associé au compte.
8. Les écritures portent une révision et un conflit 409 **n'écrase jamais la copie locale**.

## Configuration requise (à vérifier lors d’une nouvelle installation)
- Fusionner puis déployer les routes de la PR WarLike Server #4 **après revue de sécurité**.
- Appliquer les migrations `0008_studio_projects.sql` et `0009_studio_pairing.sql` sur la D1 existante `warlike-server`, en préservant les données.
- Connecter le service binding Cloudflare Pages **`WARLIKE_APP`** du projet `warlike-studio` au Worker existant `warlike-server-runtime`. Ce binding est désormais déclaré dans `wrangler.jsonc` ; le Worker doit conserver ses bindings `DB` et `BUCKET`.
- Déployer la branche Studio avec ses Pages Functions ; vérifier `GET /api/studio/availability` = `{ready:true}` sur le domaine Studio.
- Tester consentement, session, refus 401/403, expirations, révocation, protection CSRF et dépendance aux cookies.
- Vérifier que `warlike-server.pages.dev` renvoie bien les pages du runtime privé. Le sous-domaine direct du Worker n'est pas requis quand le service binding fonctionne.

## Vérification inter-appareils (non effectuée)
**Appareil A, compte Alice :** créer un projet avec trois pistes et un enregistrement WAV; associer Alice, synchroniser, fermer le navigateur.
**Appareil B, compte Alice :** se connecter, ouvrir « Mes projets cloud », télécharger le projet et comparer pistes, BPM, inserts et audio par écoute.
**Appareil B, compte Bob :** tenter la liste, la lecture et l'export de l'identifiant d'Alice ; résultat attendu : aucun accès.
**Conflit :** modifier le même projet sur A et B hors ligne, puis synchroniser ; une écriture doit produire 409, les deux versions doivent rester récupérables localement.
**Déconnexion :** révoquer la session Studio, rejeter le même token, vérifier qu'aucun projet d'Alice ne reste exposé côté cloud après connexion de Bob.
**Média long :** depuis Studio 0.15.1, les WAV PCM/flottants de plus de 12 Mio sont segmentés en WAV valides, sans réencodage, jusqu’à 512 Mio par source. Chaque requête respecte le plafond serveur existant. Le téléchargement reconstitue les octets du fichier original avant décodage. Une erreur conserve la copie locale et empêche de publier la nouvelle révision du projet. La reprise réutilise les morceaux terminés pendant la même session d’onglet ; la reprise après fermeture de l’onglet reste à développer.

## Limites
- La confidentialité de la bibliothèque **locale** sur un navigateur partagé reste non garantie sans stockage local chiffré et séparation de profils.
- Audio : WAV/OGG/MP3 jusqu’à 12 Mio par requête ; segmentation sans perte des WAV PCM/flottants jusqu’à 512 Mio par source. Les gros fichiers compressés, WAV extensibles/compressés et RF64 ne sont pas segmentés.
- Les sessions cloud expirent après 8 h ; le client doit gérer une nouvelle association.
- Pas de fusion automatique sur 409. La copie locale est conservée pour résolution.
- Les tests CI et les navigateurs simulés ne prouvent pas encore la synchronisation sur deux machines physiques.
