# R08.8 — Prélecture avant la prise

Dans **Réglages micro → Plage de prise**, choisis une section ou deux bornes, puis une prélecture de 1, 2 ou 4 mesures. Studio lit le morceau avant la borne de début pour retrouver le rythme et le contexte musical. La capture commence uniquement sur cette borne et se termine à la borne de fin. Au début du morceau, la prélecture est raccourcie au nombre de mesures disponibles.

Le décompte facultatif précède la prélecture. Le transport indique successivement **Décompte**, **Prélecture**, puis la prise. Stop avant le départ de la capture annule la préparation, ne crée aucun média et retrouve le curseur précédent. Stop après le départ conserve la partie enregistrée. Les prises précédentes et leurs sources restent disponibles dans les playlists.

Les bornes de la capture sont programmées dans AudioWorklet avant la prélecture. Le rafraîchissement de l’interface ne décide pas du départ de la prise. Le morceau entendu ne passe pas dans la capture PCM ; celle-ci conserve les entrées du microphone avant les effets. Le monitoring acoustique par les enceintes peut toujours être repris par un vrai micro.

Le choix reste dans le projet et dans son fichier `.chayah`, avec Annuler/Rétablir. Désactiver la plage désactive aussi la prélecture. Les anciens projets gardent le départ habituel sans prélecture.

Validation automatique : plan temporel, raccourcissement à l’origine, annulation et suspension de l’horloge ; parcours Chromium avec entrée stéréo synthétique, écoute du morceau avant la prise, blocage de l’interface au départ, bornes natives et conservation des médias. Les tests avec interfaces et micros physiques restent à réaliser séparément.
