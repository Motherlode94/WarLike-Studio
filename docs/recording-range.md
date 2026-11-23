# R08.7 — Prise d’une plage

Dans Réglages micro, active **Enregistrer uniquement la plage choisie**, puis choisis une section du morceau ou deux bornes personnalisées. Le début indique une mesure ; l’arrêt correspond au début de la mesure indiquée. Par exemple, début 5 et arrêt 9 couvrent les mesures 5 à 8.

Le transport affiche un bouton Plage pour revenir à ces réglages. À l’enregistrement, le curseur rejoint la borne de début ; le décompte choisi la précède. Le processeur AudioWorklet termine la capture au nombre d’échantillons prévu. Cette borne ne dépend pas du rafraîchissement de l’interface.

La finalisation utilise le chemin habituel : les fichiers sont sauvegardés localement et les prises superposées restent dans les playlists. Stop conserve la partie déjà enregistrée. Une annulation avant le départ ne crée aucune prise et retrouve le curseur précédent. Une compensation de latence conserve le placement dans la plage en rognant la lecture du clip ; les échantillons sources restent disponibles.

La plage est sauvegardée dans le projet et son fichier `.chayah`. La désactiver retrouve l’enregistrement au curseur avec arrêt manuel. Une plage active invalide ou dépassant le morceau est refusée. La limite de capture de 20 minutes est conservée.

Les tests Node contrôlent les bornes au niveau des échantillons et la finalisation unique du processeur. Le parcours Chromium utilise deux signaux synthétiques pour contrôler une coupure automatique pendant un blocage de l’interface, la conservation des prises, les réglages et les quatre thèmes. Les essais sur une interface et des micros physiques restent distincts.
