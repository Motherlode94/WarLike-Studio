# CHAYAH Studio 0.10 — Inserts à la main

Demande : ne pas préplacer de plugin hors des démos. Une nouvelle session et le
premier démarrage sans sauvegarde créent une seule piste audio, gain unitaire,
avec inserts vides. Les pistes et sons ajoutés ne reçoivent pas d’effet. Les
modules des projets déjà sauvegardés sont migrés dans les emplacements explicites.

## Vérification

- 48 tests Node : nouveaux projets/pistes vides, remplacement, retrait, bypass,
  ordre, conservation des paramètres, racks, migration et modules master ; les
  contrôles précédents du montage, de TUNE et de l’enregistrement restent verts.
- Contrôle syntaxique de tous les modules et build statique.
- Chrome, prévisualisation Sites : nouvelle session vide (9 pistes du squelette
  initial, puis réduction finale du nouveau squelette à une seule piste audio),
  choix de PRISM, bypass conservant l’emplacement, échange A/C, remplacement par
  GLUE, retrait et Annuler. Master PEAK ajouté et déplacé A/C ; le rechargement
  retrouve GLUE et PEAK dans leurs emplacements C.
- Parcours final : nouvelle session à une piste audio, inserts piste et master
  vides ; ajout explicite d’une piste audio sans effet, puis retour à la session
  vide pour la capture de contrôle.
- `tests/inserts-browser.html` : huit contrôles OfflineAudioContext. Le graphe
  vide reproduit les échantillons stéréo d’entrée (erreur maximale mesurée : 0).
  Le bypass et le retrait retrouvent ce signal. L’inversion COLOR/SCULPT change
  le rendu (différence RMS 0,2721 sur le signal de test). La reconnexion du graphe
  existant suit le nouvel ordre. Master vide/bypassé sans limiteur automatique.
  Chacun des douze effets inséré seul produit un signal fini et non silencieux.
  Le rendu WAV respecte aussi l’ordre des inserts.

## Portée

Douze emplacements A–L par piste, un exemplaire de chaque type d’effet par piste.
Trois emplacements master pour BALANCE/PRESS/PEAK. Déplacement par échange de
positions depuis le menu ⋯. Les instruments sont choisis à la création de leur
piste ; TUNE reste un traitement explicite après la prise. Pas de chargement de
VST3 externes. Le retrait du limiteur automatique historique est intentionnel.
L’insertion et le bypass reconnectent les nœuds ; ils ne promettent pas une
transition inaudible en toutes conditions. Les modules non routés peuvent encore
avoir des nœuds de contrôle alloués, mais ne traitent pas le signal de sortie.

Le déploiement natif vérifie la publication. L’interface a été contrôlée sur la
prévisualisation ; la production privée affiche une demande de connexion dans
le navigateur de contrôle.
