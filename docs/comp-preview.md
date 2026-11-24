# R08.11 — Préécouter un montage avant de le garder

Dans **Prises / comping**, choisis une prise source et la plage Début / Fin. **Préécouter le montage** remplace temporairement cet extrait dans la lecture, avec les autres pistes du morceau et un temps de contexte avant et après pour entendre les raccords. Le choix de boucle d’écoute reste disponible. Stop, un changement de source ou de bornes, ou la fermeture du dialogue annulent cette préécoute.

**Créer une playlist de montage** conserve le résultat dans une nouvelle playlist « Montage ». La playlist qui était active et les prises source restent disponibles. Les parties extérieures à la plage sont reprises de l’arrangement précédent ; l’extrait choisi conserve son fichier, son gain et son décalage de source. Les nouvelles coupes utilisent les courts fondus existants du comping. Aucun fichier audio source n’est réencodé.

La création se sauvegarde comme les autres modifications et peut être annulée/rétablie. Les champs invalides, une source vide sur la plage ou un média manquant sont refusés avant de modifier le montage. Une simple préécoute ne crée aucune playlist et ne modifie pas le projet.

Les tests vérifient la préparation sans mutation, les offsets, les playlists conservées, le refus d’un montage devenu obsolète et les bornes de contexte. Le parcours navigateur contrôle les sons avant/pendant/après l’extrait, le résultat dans le rendu WAV, Annuler/Rétablir, la réouverture et les quatre thèmes sur mobile. Ces essais utilisent des fichiers synthétiques sans demander le micro.

Le test visuel mobile des effets attend aussi la fin du redimensionnement de Studio avant de cliquer sur PRISM, au lieu de cliquer pendant la reconstruction de l’interface.
