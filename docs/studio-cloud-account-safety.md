# Studio Cloud — comptes et sauvegarde audio

Le transport de Studio conserve le bearer dans un cookie HttpOnly de Studio et utilise le binding `WARLIKE_APP` vers Server. Le navigateur utilise uniquement les routes de sa propre origine. Les projets locaux restent sur l’appareil : la bibliothèque IndexedDB demeure commune aux utilisateurs du même profil et n’est pas chiffrée.

## Compte attendu et compte authentifié

`GET /api/studio/me` vérifie la session auprès de Server. Le client retient ensuite son `userId` et ajoute `X-Warlike-Studio-Account` aux listes, projets et médias. Cette valeur est une **précondition**, jamais une preuve d’identité.

La Pages Function capture le bearer de la requête, résout `/api/studio/me` avec ce même bearer, compare le compte attendu, puis transmet l’opération avec ce bearer. Une modification du cookie dans un autre onglet ne permet donc pas de traiter le projet d’Alice comme une nouvelle création de Bob. Le contrôle précède la lecture des octets du projet ou du média. `ownerId` et les en-têtes d’identité du navigateur restent sans autorité.

- Précondition absente : 428, `IDENTITY_REQUIRED`. Actualiser les anciens onglets puis reconnecter Studio.
- Compte différent : 401, `ACCOUNT_CHANGED`, sans effacer la session légitime du nouvel utilisateur.
- Perte de session ou d’accès : les requêtes navigateur et les envois en attente sont annulés, les caches de révision et de médias invalidés.
- Réassociation ou déconnexion dans un autre onglet : notification `BroadcastChannel` sans token ni identifiant. Le retour au premier plan vérifie aussi la session. Le contrôle serveur reste nécessaire même sans cette notification.
- Conflit de révision : 409, sans écrasement automatique de la copie locale.

Une requête déjà acceptée par Server peut finir sous son compte d’origine malgré l’annulation côté navigateur. L’annulation ne constitue pas une transaction distribuée. La séparation des profils navigateur et le chiffrement de la bibliothèque locale restent des travaux distincts.

## Relais interne et limites de corps

Après validation de l’origine HTTPS de Studio, le relais fixe l’origine canonique de sa requête interne à `https://warlike-server.pages.dev`. Les routes d’écriture Server vérifient cette origine ; son absence pouvait refuser une sauvegarde même lorsque `/availability` annonçait le service disponible. Les cookies du navigateur ne sont pas transmis à Server.

Les corps sont lus progressivement avec un plafond vérifié pendant la lecture, même sans Content-Length : 2 048 octets pour l’échange de code, 900 000 pour les métadonnées et 13 Mio pour le multipart. Le transfert audio reste limité par Server à 12 Mio par média. Une longueur malformée ou une compression non prise en charge est refusée. Les cookies de session ambigus sont rejetés ; les réponses privées et les erreurs portent `private, no-store`.

## Premier transfert audio interrompu

Server doit créer un projet avant de recevoir ses médias privés. Cette entrée initiale porte `__cloudUploadPending:true`. Studio refuse sa restauration comme un projet terminé tant que tous les médias n’ont pas été envoyés et que la nouvelle révision n’a pas été enregistrée. La copie locale reste utilisable pour reprendre le transfert. Le marqueur disparaît à la publication complète, et les propriétés inconnues du projet sont conservées.

## Vérification reproductible

`npm test` couvre notamment le remplacement silencieux du cookie A par B, les listes/écritures/médias, les envois en file, la perte de session, les plafonds sans longueur déclarée, les réponses d’association invalides et le premier transfert audio interrompu.

Le workflow **Studio cloud integration** utilise le vrai runtime WarLike Server épinglé au commit `6bc85c1611ff28c6a9874926180197088403fe20`, avec des comptes fictifs, une D1 et un R2 locaux jetables. Chromium charge la véritable interface Studio ; les routes de test invoquent les vraies Pages Functions et relaient vers le Worker isolé. Il vérifie la connexion native et PKCE, la sauvegarde et la restauration sur un second profil navigateur, le hash d’un WAV stéréo synthétique, les paramètres et inserts, les conflits de révision, les refus A/B, le changement de cookie sans notification et la déconnexion entre onglets.

Les captures et le rapport JSON sont publiés comme artefact CI. Ce test ne remplace pas un essai sur deux ordinateurs physiques, une interface audio réelle ou une écoute humaine. Il n’utilise aucun compte ni stockage de production. Le routage Pages et son service binding en production restent vérifiés séparément lors du déploiement.
