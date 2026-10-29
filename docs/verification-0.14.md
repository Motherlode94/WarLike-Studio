# WarLike Studio 0.14 — vérification

## Contrôles automatiques

94 tests Node passent : pistes, clips, banques enregistrées, inserts, presets, routage,
automation, export, enregistrement, démos, dossiers, variantes, sampler et nouveau noyau vocal.
Le noyau vocal corrige un signal monophonique de 215 Hz vers 220 Hz et conserve les
canaux stéréo avec le Mix à zéro. Les crossfades à tension liée restent complémentaires
en énergie. Les transformations audio conservent les sources. Les références et
les samples personnels sont inclus dans les médias du projet.

`npm run check`, `npm run build` et `git diff --check` passent.

## Audio navigateur

Rendu intégral des trois démos : quatre sections audibles par démo, échantillons finis,
sortie stéréo, crêtes −13,3 / −13,8 / −17,1 dBFS. Douze changements successifs de session gardent neuf
canaux et aucun pack FX inutilisé. Création et retrait d’instances multiples vérifiés.

Onze nouveaux processeurs passent les mesures réelles sur piste et sur master : signal
audible, fini et différent du bypass. VECTOR LIMIT respecte son plafond d’échantillons.
Le sampler transpose une source de 440 Hz à 880 Hz. VOX TUNE est vérifié au niveau du
noyau par Node ; l’intégration AudioWorklet est contrôlée sur l’hébergement HTTPS
avec `diagnostics.html` (le preview HTTP n’expose pas AudioWorklet).

## Interface

Menus Fichier/Édition, clé et gamme du transport, quatre espaces, fermeture de l’inspecteur,
dossier repliable avec deux pistes routées vers son bus, nouvel EQ du master (réglage
graphique au clavier), point d’automation au clic, flèche de réglage et zoom vérifiés.
Deux prises PCM de test : audition de l’alternative, arrêt et comping d’une plage réussis.
Poignée de fondu réglée au clavier. Sample WAV importé dans EXO Slice, quatre attaques
détectées, pads auditionnés, pattern créé et sample encore présent après rechargement.
Channel Rack : 128 pas visibles pour les huit voix PULSE, premier kick activé.
Variante B créée en copie ; référence WAV écoutée séparément puis retour au mix.
Aucune erreur d’application dans le journal de ces parcours (messages de l’extension
de navigateur exclus).

## Annotation visuelle

Capture de la vue, ellipse et flèche tracées, note numérotée et commentaire général
saisis. Le PNG téléchargé a été ouvert et inspecté : la capture, les marques et les
commentaires sont présents. Brouillon conservé en mémoire jusqu’au rechargement.
Bouton dans la barre et les fenêtres ; raccourci Alt+Maj+A.

## Limites

Pas de validation physique du micro, du MIDI ou de la latence aller-retour ;
pas de benchmark de grande session. Le correcteur live reste monophonique et
granulaire ; les consonnes non voisées passent par le chemin sec aligné. La
compensation additionne 40 ms pour VOX TUNE, 12 ms pour VOX LEVEL et 6 ms pour les
compresseurs natifs alignés. La comparaison de référence utilise RMS, pas une mesure
psychoacoustique de loudness. Les groupes de pistes ne remplacent pas un gestionnaire
complet de dossiers imbriqués. Le tempo intelligent présenté dans les idées de
produit reste une évolution ultérieure.
