# CHAYAH Studio 0.11 — vérification

## Contrôles exécutés

- `npm test` : 66 tests réussis, sans échec ni test ignoré. Les nouveaux tests
  couvrent routage et cycles, solo des bus, compensation des délais connus,
  playlists/comping et décalages source, fondus, automation, WAV 24/32 bits,
  ZIP, placement des prises, WSOLA, inserts répétés, rétention des médias,
  patterns liés, notes hors grille, vélocité, loudness et changement de tempo.
- Le processeur PCM est exécuté dans un banc VM : départ exact en frames,
  deux canaux, blocs complets et vidage final partiel. Cela ne remplace pas
  une capture avec une interface physique.
- `tests/studio-browser.html` : rendu OfflineAudioContext réel. Atténuation
  −6 dB par un bus, envoi pré-fader et mute, solo avec bus, automation et mute,
  deux PRISM indépendants, fondus, WAV 24/48 kHz et float32, capture pré-fader
  pour le gel, pattern de quatre mesures et vélocité (écart mesuré −12,04 dB).
  Tous ces essais ont réussi. Le cas AudioWorklet a été ignoré sur le preview
  HTTP, où cette API sécurisée est indisponible.
- ZIP : contrôle des noms et du contenu avec `zipfile` Python, y compris CRC.
  L’export navigateur prépare le lien ZIP d’un bus seul après correction du
  cas qui produisait initialement un WAV. Le téléchargement automatique suivant
  n’a pas été récupéré par l’événement du navigateur de test ; les données WAV,
  l’encodeur ZIP et l’état « prêt à télécharger » ont été vérifiés séparément.

## Interactions navigateur vérifiées

- Démarrage, version 0.11, session neutre et inserts vides.
- Channel Rack, ajout VELVET et PULSE, ouverture d’un piano roll de pattern,
  accord, déplacement de trois notes ensemble, durée de groupe, vélocité
  individuelle (34/127 contre 102/127 pour les deux autres).
- Placement en Playlist, lecture SONG, application d’un groove de batterie
  et remplissage de hi-hat un pas sur deux sur 32 pas (16 coups).
- Création d’une version nommée puis restauration : notes et vélocités retrouvées.
- Import d’un projet de test de 128 mesures avec deux prises et un bus VOX.
  Comping d’une plage : trois segments, sources et décalages conservés.
- Time-stretch d’un segment 0,5 → 0,75 mesure par le worker puis annulation.
- Saisie de deux points d’automation de volume et affichage de la courbe.
- Analyse du morceau : valeurs numériques LUFS et crêtes affichées.
- Préparation d’un export de bus, 48 kHz / PCM 24 bits, plage choisie,
  lien ZIP explicitement disponible.
- Capture d’écran du piano roll agrandi inspectée avant publication.

## Portée et limites

La capture micro réelle, les entrées M-Audio, le bouclage physique, le monitoring
et le clavier MIDI n’ont pas été testés avec du matériel. HTTPS et l’autorisation
du navigateur sont nécessaires. La page privée de production affiche une
connexion dans le navigateur de test ; aucune connexion n’a été entreprise
pour les contrôles de publication.

La compensation des plugins connaît les 6 ms de GLUE ; elle ne découvre pas
la latence de plugins arbitraires. Les inserts CHAYAH ne sont pas des binaires
VST/AAX/AU. Plusieurs instances sont fonctionnelles, avec un coût mémoire CPU
qui n’a pas fait l’objet d’un benchmark de grande session.

Le time-stretch WSOLA est expérimental : ratio 0,5–2, hauteur ±12 demi-tons,
segment limité à cinq minutes. Il ne revendique pas la qualité Elastic Audio
ou Flex. L’analyse de loudness utilise les coefficients K à 48 kHz et les
portes absolue/relative ; la crête interpolée 4× reste une estimation et non
une mesure true-peak certifiée. Le gain cible n’est appliqué que sur demande.

Le rendu offline est en mémoire, protégé par une limite estimée de 768 Mio.
La session accepte 2048 mesures, les patterns 32 mesures, les envois huit par
piste et les inserts douze. Une prise continue est bornée à vingt minutes.
Le gel des bus n’est pas proposé. Les sauvegardes locales dépendent du stockage
du navigateur : exporter le projet pour une copie indépendante.

Les résultats décrivent CHAYAH et ses essais, sans prétendre à une équivalence
complète avec FL Studio, Pro Tools ou Logic Pro.
