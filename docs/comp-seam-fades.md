# R08.13 — Régler les fondus de raccord

Dans **Prises / comping**, **Fondus de raccord (ms)** règle les nouvelles jonctions entre l’extrait choisi et le montage. La durée va de 0 à 50 ms ; 8 ms conserve la valeur utilisée auparavant. Une valeur de 0 désactive ces fondus.

La préécoute utilise le réglage choisi. La validation l’applique aux extraits insérés et aux bords des clips qui les touchent. Les références audio, offsets, gains et courbes de fondu existantes restent conservés. Les fichiers source ne sont pas réencodés. Sur un clip très court, chaque nouveau fondu est limité à la moitié de sa durée.

La playlist Montage mémorise la durée pour les ajouts suivants, y compris après renommage et réouverture. Modifier ce réglage ne réécrit pas les raccords déjà assemblés. Annuler/Rétablir restaure ensemble l’ajout et sa durée. Une simple préécoute ne change pas le projet ; changer la durée interrompt la préécoute en cours.

Les valeurs invalides ou vides sont refusées avant modification. Les montages plus anciens utilisent 8 ms tant qu’aucune autre durée n’a été choisie.

Les tests vérifient les jonctions, les clips voisins, les valeurs nulles et fractionnaires, la limite sur les petits extraits, la conservation des sources et des raccords précédents, la sauvegarde et la réouverture. Un rendu audio synthétique à phases opposées compare également les sauts d’échantillons aux raccords avec et sans fondus. Cette mesure illustre ce cas de test ; elle ne garantit pas l’absence de tous les bruits sur des enregistrements physiques.
