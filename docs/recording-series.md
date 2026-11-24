# R08.9 — Séries de prises

Dans **Réglages micro → Plage de prise → Prises successives**, choisis une prise, deux prises ou quatre prises. La série utilise les mêmes bornes, entrées, tempo, décompte et prélecture pour chaque passage. Le transport indique le numéro de la prise en cours.

Chaque passage se termine aux bornes audio prévues, sauvegarde ses médias et son projet localement, puis prépare le passage suivant. Il existe une pause de finalisation entre les prises : cette fonction ne promet pas un enregistrement cyclique continu. Les prises de la série sont toujours conservées dans les playlists, même si la conservation des prises était désactivée pour une capture isolée.

**Stop interrompt toute la série**, y compris pendant une sauvegarde ou l’attente de l’entrée audio. Avant le départ, aucune prise vide n’est créée ; après le départ, la partie enregistrée est conservée. Les passages déjà sauvegardés restent disponibles. La fermeture de l’onglet ne relance jamais une série sauvegardée.

Une erreur de capture ou de sauvegarde, un changement du projet, du tempo ou des réglages, ou le passage de Studio en arrière-plan empêchent la relance automatique. Une prise encore en mémoire après un échec de sauvegarde peut être exportée depuis la session. Une série interrompue ne reprend pas seule : le prochain clic sur Enregistrer lance une nouvelle série.

Le nombre de prises est enregistré dans le projet et le fichier `.chayah`, avec Annuler/Rétablir. Les anciens projets gardent une prise unique. Désactiver la plage désactive la série.

Les tests automatiques vérifient le quota, la sauvegarde avant relance, Stop pendant une sauvegarde, les captures stéréo, les médias et playlists précédents, les pannes et les réglages persistants. L’entrée audio des tests navigateur est synthétique ; les essais avec de vrais micros et les longues sessions restent distincts.
