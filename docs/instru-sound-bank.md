# Banque Instru — 152 presets de sons

Accès : **Bibliothèque → Instru** ou **Projet → Banque Instru**. Cette banque est une collection de sons à jouer avec les plugins WarLike, pas une collection de morceaux.

| Sélection | Presets | Moteur existant |
| --- | ---: | --- |
| Harpes | 8 | HARP, enregistrements acoustiques locaux |
| Flûtes | 8 | FLUTE, enregistrements acoustiques locaux |
| Synthèse analogique virtuelle | 12 | WL VANGUARD |
| Sons multicouches | 8 | WL ATLAS |
| Textures et couleurs spectrales | 8 | WL NEBULA |
| Guitares modélisées | 42 | 7 moteurs : acier, nylon, 12 cordes, jazz, clean, crunch, muted |
| Synthèse à deux couches et arpèges | 8 | EXO |
| Autres sons | 58 | Basses, orgues, claviers, cordes, vents, lames, chœurs et percussions |
| **Total** | **152** | **41 instruments** |

Les directions demandées (Nexus, Omnisphere, Heat Up, Sylenth, Ample Guitar) guident la variété des banques et les usages de production. Les presets et moteurs sont ceux de WarLike : aucun de ces produits tiers n’est chargé ou nécessaire. ATLAS reste une synthèse multicouche ; il n’est pas une nouvelle banque de samples de ces produits. Les guitares restent nos modèles de cordes existants. Les paramètres disponibles, leurs formats et le DSP ne changent pas.

## Utilisation

- Recherche par nom, instrument, style ou description, sans distinction d’accents : « harpe », « flute », « supersaw », « wl vanguard », « afro ».
- Neuf familles et pages de 12 sons, adaptées au mobile.
- **Écouter** joue le preset avec son moteur réel ; **Arrêter l’écoute** arrête aussi un chargement en attente.
- **Ajouter piste** crée une piste avec une phrase MIDI modifiable de deux mesures. La banque fournit des sons, la phrase sert à les essayer.
- **Appliquer** remplace les paramètres de l’instrument sélectionné lorsqu’il correspond au preset. Les clips, inserts, routages et autres pistes sont conservés. Annuler/Rétablir restent disponibles.
- Les réglages se sauvegardent dans le projet `.chayah` et peuvent être conservés dans les presets personnels du plugin.

La collection est séparée des presets usine existants : leurs indices et leur contenu restent inchangés. Chaque nouveau son reconstruit tous les paramètres à partir des valeurs initiales de son moteur, puis de son patch, pour éviter de conserver les réglages d’un preset précédent. EXO conserve ses paramètres d’arpégiateur natifs ; les notes ne sont développées qu’une fois par le moteur.

EXO SLICE demande un audio utilisateur : il ne reçoit pas de « nouveau son » sans sample. Les chœurs et ORIGINS sont des synthèses ; HARP et FLUTE utilisent les banques enregistrées déjà installées dans Studio.

## Validation

`tests/instru-presets.test.mjs` contrôle les 152 patches, les plages et pas de chaque paramètre, la diversité des états de synthèse, la recherche, les phrases et la préservation des pistes/presets existants.

`tests/instru-bank-browser.mjs` contrôle l’interface, les pages, l’écoute et l’arrêt, l’application/annulation, l’ajout de pistes harpe/flûte/VANGUARD, l’export/import et la réouverture locale. Il rend les 152 sons dans les véritables moteurs Web Audio, vérifie les valeurs finies, l’absence de silence/écrêtage sur une note de contrôle et décode dix WAV 24 bits représentatifs. Ces contrôles techniques ne sont pas une certification artistique ni une mesure de fidélité aux produits cités. L’artefact CI `instru-sound-bank` contient le rapport audio, les WAV, `listen.html` et les captures de l’interface.
