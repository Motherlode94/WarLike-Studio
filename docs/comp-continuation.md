# R08.12 — Assembler plusieurs extraits dans un même montage

Dans **Prises / comping**, **Destination** propose une nouvelle playlist Montage ou **Continuer ce montage** lorsque la playlist active est un montage créé avec cette version. La seconde option ajoute l’extrait choisi au montage existant, avec la même préécoute et le même contexte de raccords que précédemment.

Après un ajout, le dialogue reste ouvert. Les bornes et la source choisies sont conservées ; sélectionne un autre extrait pour continuer. Le nom du montage et le nombre de playlists restent inchangés. Les parties en dehors de la nouvelle plage, les extraits assemblés auparavant et les prises d’origine restent disponibles. Ferme le dialogue pour Annuler/Rétablir chaque ajout.

Le choix **Nouvelle playlist Montage** crée une copie indépendante même si un montage est actif. Une prise brute ne peut pas être écrasée par l’option de continuation. Les anciens montages restent lisibles et comparables ; pour les poursuivre avec ce mode, crée d’abord une nouvelle playlist Montage à partir d’eux.

La continuation, le nom et les extraits se conservent dans le projet et son fichier `.chayah`. Elle fonctionne aussi quand la piste contient déjà 64 playlists, puisqu’elle n’en crée pas de nouvelle. Un montage dépassant les 512 clips acceptés par les projets est refusé avant modification.

Les tests contrôlent plusieurs extraits dans le même montage, les offsets, les sources et les extraits antérieurs, le renommage, la création volontaire d’une copie, les limites du projet, la préécoute, Annuler/Rétablir, le WAV, la réouverture et les quatre thèmes mobiles. Les fichiers audio de validation sont synthétiques ; aucun micro n’est demandé.
