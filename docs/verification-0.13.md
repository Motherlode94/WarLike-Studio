# Warlike Studio 0.13 — vérification

## Audio

La sélection contient 132 enregistrements distincts (9 709 105 octets MP3),
provenant de VCSL et VSCO 2 CE sous CC0. Les WAV originaux ont été vérifiés par
leur SHA Git avant conversion. La hauteur d’une référence par instrument a été
mesurée : les conventions d’octave diffèrent selon les collections. Les offsets
nécessaires sont enregistrés dans la provenance et dans les notes racines.

Le test navigateur `tests/acoustic-browser.html` rend effectivement les sons
avec OfflineAudioContext à 48 kHz : décodage des 132 MP3, niveau audible et fini
des douze banques, dynamique et différence de timbre entre nuances du piano,
transposition d’octave, release réglable, absence de notes bloquées, sustain
bouclé des cordes/vents, largeur mono et export d’accords sans insert ajouté.
Il vérifie aussi les huit percussions PULSE et le silence d’une piste Instrument
sans générateur.

## Modèle et interface

80 tests Node : banque complète, contrôles bornés, correspondance hauteur/rate,
interpolation des nuances, racks, conservation des notes et effets lors d’un
changement d’instrument, séparation FX/instruments par registre et catégories,
favoris filtrés par type, piste Instrument non assignée et chargement en échec
réessayable. Les tests antérieurs sur mix, montage, MIDI, export et EXO passent.

Le build vérifie la syntaxe des 37 modules et la présence/taille de chaque MP3.
La source temporaire de QA sous dist est retirée avant publication.

## Limites

Banques compactes, sans toutes les articulations ou couches du matériel original.
Les notes intermédiaires sont transposées. Les pianos ne modélisent pas les cordes
sympathiques ou une pédale MIDI continue. Polyphonie de 48 voix par contexte ;
cache de banques à éviction, chargé sur demande. Pas de benchmark de grande
session ni de test sur clavier MIDI physique pour cette livraison.

## Vérification visuelle

Création par type Audio/Instrument/Bus, sélecteur Instrument sans effet,
sélecteur FX sans instrument, recherche AIR, insertion sur A, fenêtre liée à
la piste et bypass direct vérifiés. Remplacement GRAND par FLUTE en conservant
EXO AIR bypassé ; changement GRAND/FLUTE/GRAND dans le piano roll avec huit
notes conservées. Banque affichée : 110 sons, 48 presets échantillonnés,
190 presets au total. Capture inspectée : `docs/inserts-0.13.jpg`.

Les neuf contrôles audio du navigateur ont réussi, y compris PULSE et le
silence d’une piste Instrument sans générateur.
