# CHAYAH Studio 0.9 — Pistes et propriétés

## Validation

- 43 tests Node passent. Les nouveaux tests couvrent le réordonnancement sans copie des pistes/clips/effets, les bornes des déplacements et la saisie de gain (−48 à +12 dB).
- Le test navigateur OfflineAudioContext de tests/tracks-browser.html passe : les deux pistes réordonnées donnent le même WAV à deux unités de quantification près ; le passage de −12 à 0 dB mesure +12.03 dB.
- Glissement validé dans les trois surfaces : liste des pistes, en-tête Edit et nom de tranche Mix. Ordre commun mis à jour ; Ctrl+Z restaure l’ordre initial. Les flèches de propriétés utilisent la même opération.
- Clic sur VOL, fader rapide (y compris borne +12 dB), saisie numérique 3.5 dB et synchronisation avec le panneau validés. Les valeurs du panneau et des en-têtes suivent la bonne piste.
- L’ordre et le gain survivent au rechargement ; la session de test est ensuite revenue à son ordre et au gain PULSE de −8 dB.
- Panneau de propriétés validé par clic sur un nom, bouton de barre d’outils et clic droit. Fermeture et réouverture fonctionnent. Le panneau reste lié à la sélection ; les fenêtres de plugins gardent leur propre identifiant de piste.
- Les commandes de réordonnancement sont bloquées pendant une prise micro.

## Sources

La capture Inserts A–E fournie par l’utilisateur et la documentation officielle Avid ont guidé la disposition et les gestes. Les liens et la portée de l’implémentation sont conservés dans README.md, section 0.9. Le texte des manuels n’a pas été reproduit.

## Portée

Cette correction rend le réordonnancement et le gain de piste utilisables. Elle conserve la chaîne DSP existante. Elle n’introduit pas un rack A–E à ordre arbitraire, le routage libre, l’automation ou le comping.
