# WarLike Studio — moteurs audio spécialisés

Ce dossier prépare des intégrations **facultatives**. Aucune bibliothèque tierce n'est intégrée, téléchargée ni exécutée par ce changement. Le Studio actuel reste fonctionnel hors ligne.

## Architecture

| Service | Entrée | Sortie | Exécution prévue |
| --- | --- | --- | --- |
| Demucs | WAV/FLAC audio | pistes séparées (voix, batterie, basse, autres) | Worker Python GPU/CPU |
| Basic Pitch | audio monophonique de préférence | MIDI standard | Worker Python ou adaptation navigateur |
| Pedalboard | audio PCM et chaîne d'effets | audio traité | Worker Python, rendu hors ligne |
| Surge XT | notes MIDI, paramètres | audio synthétisé | Port WASM à évaluer ou service dédié |
| FluidSynth | notes MIDI + SoundFont autorisée | audio PCM | WASM/AudioWorklet à évaluer |
| sfizz | MIDI + instruments SFZ autorisés | audio PCM | Port WASM à évaluer |
| DDSP / neutone | audio ou contrôles de synthèse | audio transformé | modèle/serveur spécialisé |

## Contrat de traitement

Le navigateur reste l'interface de référence. Les traitements longs passent par un service isolé, **sans donner les clés API au client**. Le serveur renvoie un identifiant de tâche, un état et un résultat récupérable.

- `POST /api/audio/jobs` : `{engine,operation,sourceAssetId,parameters}` → `{jobId,status}`.
- `GET /api/audio/jobs/:jobId` : `{jobId,status,progress,error?,outputAssets?}`.
- `POST /api/audio/jobs/:jobId/cancel` : demande d'annulation.

Les fichiers sont stockés dans R2 avec autorisation par projet et durée de conservation définie. Les métadonnées de tâches sont stockées dans D1. Vérifier le propriétaire de chaque ressource à chaque requête. Mettre en place quotas, taille maximale, délais, antivirus/validation de formats, journal d'erreurs sans contenu audio et suppression des fichiers temporaires.

## Intégration à l'interface

- **Mixer > Inserts** : effets temps réel natifs du navigateur; « Rendu avancé » ouvre Pedalboard hors ligne.
- **Piano Roll > Instruments** : choix du synthétiseur; MIDI transmis à un moteur instrument avec sortie audio.
- **Édition audio > Outils IA** : séparation Demucs et extraction Basic Pitch, avec résultat importé en nouvelles pistes.
- Aucune nouvelle barre permanente : options contextuelles uniquement, inspirées des flux Edit/Mix professionnels.

## Critères de validation avant activation

1. Audio d'entrée/sortie réellement audible, gain mesuré, absence de silence accidentel.
2. Tests de phase, clipping, latence, synchronisation et annulation.
3. Comparaison A/B avec volume égalisé; mesure CPU/mémoire sur ordinateur limité.
4. Vérification licences des moteurs, modèles, SoundFonts et banques SFZ.
5. Tests d'autorisation inter-comptes, limites de stockage et suppression.
6. Déploiement serveur et tests navigateur sur projet réel.

**État : conception et contrat uniquement. Aucun moteur tiers ni endpoint serveur n'est encore déployé.**
