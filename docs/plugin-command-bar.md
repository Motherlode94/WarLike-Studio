# R08.3g.3 — Barre de commandes commune

Les fenêtres d'instruments et d'effets des pistes disposent d'une barre commune au-dessus de leur interface propre. Les composants CSS/SVG, analyseurs existants et traitements audio ne sont pas remplacés.

- La piste, le rôle Instrument/Insert et le preset courant restent identifiables.
- Le sélecteur de piste ouvre la vue correspondante sans réaffecter la fenêtre d'origine.
- Les presets d'usine et leurs flèches utilisent les commandes existantes.
- Les effets disposent de leur bypass et de la comparaison A/B existante. Ces commandes ne sont pas proposées aux instruments dont le modèle ne les prend pas en charge.
- **Plus** contient Reset, la copie A/B pour les effets et l'accès aux presets personnels/racks. Échap ferme ce menu avant de fermer une fenêtre.
- Les banques du projet, de l'appareil et les imports/exports de racks restent disponibles dans **Mes presets et racks**.

## Annuler et rétablir un plugin

Les deux boutons de la barre restaurent uniquement les paramètres du plugin de cette fenêtre, y compris son bypass et sa comparaison A/B. Les notes, clips, routages, autres inserts et autres pistes restent inchangés. Un geste continu de potentiomètre forme une étape ; l'historique est borné à 40 étapes par vue ouverte.

Pour EXO SLICE, cet historique inclut aussi le sample sélectionné, Reverse, la note racine, le mode de lecture et les limites des slices. Les références de sample sont restaurées sans retirer les fichiers audio encore nécessaires au projet ou au rétablissement. La normalisation des marqueurs et des valeurs par défaut ne constitue pas une nouvelle modification.

Cet historique est temporaire : fermeture de la vue, changement de projet ou annulation/rétablissement global de la session le réinitialisent. Un changement de type d'instrument ne peut pas réutiliser l'historique de l'ancien instrument. Les annulations locales restent elles-mêmes annulables depuis l'historique global de la session.

Les commandes de la barre refusent une modification pendant une prise, sa préparation ou sa finalisation. Le Master conserve sa vue Mastering dédiée.

## Vérification

Les tests Node vérifient l'isolation entre propriétaires, les gestes regroupés, les limites d'historique, les changements de type, le bypass/A/B et la conservation des données étrangères au plugin. Le scénario Chromium `tests/plugin-windows-browser.mjs` exerce les boutons réels, les réglages au clavier, deux GLUE distincts, les presets, les menus et la largeur mobile. Les captures sont jointes au workflow **Studio workspace layouts**. La validation navigateur doit réussir avant fusion.
