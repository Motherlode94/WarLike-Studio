# CHAYAH Studio 0.8 — Edit / Mix

- 40 tests Node passent, dont six tests de montage : coupes, rognage, source non modifiée, offsets audio live/export/reprise, phase des patterns et notes hors grille.
- Le test OfflineAudioContext de tests/editing-browser.html passe : comparaison WAV après coupe hors raccord et transitoire de filtres, lecture à +2 s après rognage (ratio RMS 16.01), silence après la fin et WAV stéréo 44,1 kHz / 16 bits.
- Navigateur : passage Edit/Mix, lecture et activité du vumètre, coupe (17 → 18 clips), annulation (18 → 17), rognage par souris (4 → 3 mesures), annulation (3 → 4), éditeur ouvert au double clic, insert SIBIL ajouté à LEAD VOX.
- Changer la sélection sur PULSE laisse la fenêtre SIBIL sur LEAD VOX.
- Référence visuelle : captures Edit et Mix Pro Tools fournies par l’utilisateur ; structure Edit/Mix, transport argenté, compteurs verts, clips contrastés, inserts en en-tête et faders verticaux.
- Pas de modification des prises utilisateurs en production. Les sessions existantes sont rechargées depuis IndexedDB avec valeurs par défaut compatibles.
- Limites : édition d’un clip à la fois, pas d’automation/comping, pas de compensation complète de latence, pas de chargeur VST3 natif. Les fondus automatiques de 5 ms aux extrémités sont conservés.
