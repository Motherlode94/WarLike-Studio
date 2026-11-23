# R08.6 — Décompte avant la prise

Le transport et les réglages micro proposent **Aucun**, **1 mesure** ou **2 mesures** de décompte. Ce choix est enregistré dans le projet et le fichier `.chayah`. Les anciens projets conservent le départ immédiat.

Les mesures comptent quatre temps au tempo du projet. Les clics sont programmés sur l’horloge `AudioContext`, avec un accent au premier temps. Le curseur reste au point choisi pendant le décompte. Les pistes, l’automation et le processeur PCM démarrent au même instant audio prévu ; le décompte n’ajoute pas de silence au début du clip.

Stop ou un second clic sur Enregistrer annule le décompte. Avant le départ, aucune prise ni source audio n’est ajoutée ; l’entrée et le journal de secours sont libérés. Une suspension de l’audio ou le masquage de la page annule également cette préparation. Les commandes de déplacement, de durée et de mode sont bloquées pendant la prise. Une fois la capture commencée, Stop finalise la prise par le chemin habituel.

Le clic est envoyé à la sortie, séparément de l’entrée micro et du master du projet. Un casque évite qu’il soit repris acoustiquement par le micro. Le test navigateur utilise une entrée stéréo synthétique pour contrôler le départ PCM, le placement, les deux canaux, l’annulation, la conservation des anciennes prises et les thèmes mobiles. Il ne remplace pas les essais avec une vraie interface, deux micros physiques et une mesure de latence casque.

La limite de capture de 20 minutes reste celle du dispositif actuel.
