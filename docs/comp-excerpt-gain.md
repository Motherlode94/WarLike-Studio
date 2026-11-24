# R08.14 — Ajuster le niveau d’un extrait de prise

Dans **Prises / comping**, **Ajustement de l’extrait (dB)** ajoute de −24 à +24 dB au gain des clips de la prise source dans la plage choisie. Une prise déjà à +3 dB avec un ajustement de −6 dB donne un nouvel extrait à −3 dB. 0 conserve le gain source.

**Préécouter le montage** utilise ce réglage avec les autres pistes du morceau. Modifier puis valider le champ arrête l’écoute en cours ; relance la préécoute pour entendre le nouveau niveau. Le réglage concerne le montage proposé ; les boutons **Écouter** des prises continuent de comparer leurs niveaux d’origine.

Créer ou continuer le Montage conserve le gain dans les nouveaux clips. Les fichiers audio, les playlists source, les clips voisins et les extraits précédents ne sont pas modifiés. Aucun nouveau fichier audio n’est créé. Le gain enregistré fonctionne à la lecture et à l’export WAV, après sauvegarde et réouverture. Annuler/Rétablir restaure l’ajout complet.

Le champ repart à 0 dB à l’ouverture et après chaque ajout, pour éviter de réutiliser involontairement la correction d’une autre prise. Chaque clip conserve son propre gain final. Une valeur vide, non finie ou hors plage est refusée. Si un des gains finaux sort de la plage native de −24 à +36 dB, l’ensemble de l’ajout est refusé avant modification, sans écrêtage silencieux du réglage.

Il s’agit d’un ajustement manuel, sans analyse automatique de loudness ni normalisation. Un gain positif peut faire dépasser les crêtes disponibles : écoute le résultat et vérifie les niveaux de sortie.

Les tests vérifient plusieurs clips source avec des gains différents, les limites, la préservation des prises, les ajouts successifs et l’absence de mutation pendant la préécoute. Le parcours Chromium compare les amplitudes de signaux synthétiques à −6 puis +3 dB dans la lecture native et le WAV, avec un accompagnement inchangé ; il vérifie aussi Annuler/Rétablir, la réouverture et quatre thèmes mobiles. Ce parcours ne remplace pas une écoute musicale sur des voix enregistrées.
