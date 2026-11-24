# R08.15 — Comparer avant et après le montage

Dans **Prises / comping**, deux commandes permettent de décider si un nouvel extrait convient avant de le garder :

- **A · Avant montage** écoute les clips actuellement actifs sur la piste.
- **B · Après montage** écoute le nouvel extrait proposé, avec l’ajustement de gain et les fondus choisis.

Les autres pistes restent audibles. Si la piste actuelle est vide, muette ou sans clip dans la plage, A écoute son silence avec l’accompagnement ; B permet alors de comparer le remplissage du passage. A et B utilisent la même plage Début / Fin, avec un temps de contexte avant et après les raccords, borné au morceau. Chaque commande redémarre au début de cette plage ; elle ne bascule pas à la position courante. **Boucler la plage pendant l’écoute** fonctionne pour les deux versions. Le statut et les boutons indiquent la version écoutée.

Cliquer sur l’autre version remplace l’écoute temporaire en cours. **Stop**, la fin de la plage, un changement de réglage ou la fermeture de la fenêtre arrêtent la comparaison et restaurent le curseur et les modes de transport précédents. A reste disponible sans prise source valide ni réglage de gain/fondu valide pour B ; les bornes de la plage doivent rester valides.

Aucune comparaison ne change les clips, les playlists, les fichiers ou l’historique Annuler/Rétablir. Les commandes **Créer une playlist de montage** / **Ajouter l’extrait à ce montage** conservent le résultat de B. Les boutons **Écouter** des prises restent disponibles pour comparer des alternatives brutes.

Les tests vérifient l’alternance A/B/A, le même début et les mêmes bornes, le contexte musical, les boutons actifs, Stop et la fermeture, la conservation du projet et la restauration du transport. Dans Chromium, des fréquences distinctes identifient réellement l’audio actuel et l’extrait proposé avec leur accompagnement. Le parcours conserve les contrôles WAV, Annuler/Rétablir et réouverture, et fait fonctionner A dans les quatre thèmes mobiles. Ces signaux synthétiques vérifient le routage ; l’appréciation musicale reste une écoute du morceau.
