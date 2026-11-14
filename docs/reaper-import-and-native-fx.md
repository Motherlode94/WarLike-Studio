# Importer REAPER dans WarLike Studio

## État de la fonction
Import expérimental REAPER **.rpp** (et **.rpp-bak**) ; n'altère jamais le projet REAPER d'origine. La conversion ne prétend pas être 100 % compatible.

Dans Studio : **Projet → Importer REAPER (.rpp)**. Sélectionner le fichier projet et les WAV, MP3 ou OGG associés. Le dialogue indique les fichiers manquants et refuse de créer un projet dont les fichiers audio ne sont pas disponibles. Il est possible d'ajouter des fichiers complémentaires. Le navigateur ne peut pas retrouver seul les chemins absolus du PC REAPER.

### Données actuellement transférées
- Tempo constant compris entre 40 et 240 BPM, référence 4/4.
- Jusqu'à 64 pistes, noms, volume, panoramique, mute et solo.
- Clips audio (position et durée en secondes converties en mesures), noms et chemins de sources audio, fades simples, offset.
- Médias importés physiquement après validation et décodage, puis projet enregistré dans la bibliothèque locale WarLike.
- Liste des effets REAPER et des suggestions de traitements WarLike natifs.

### Limitations explicites
- MIDI, routages complexes (sends/folders/bus), enveloppes, changements de tempo, marqueurs, prises multiples, time stretching, sources vidéo et formats de média non pris en charge ne sont pas convertis de manière fidèle.
- Le format RPP **n'inclut généralement pas** les fichiers audio ; fournir les médias séparément.
- VST/VST3/AU/CLAP/JSFX : les binaires et états propriétaires ne sont pas lisibles ni exécutables dans le navigateur. Les traitements disponibles sont des **alternatives originales WarLike** comparables par fonction, sans garantie d'identité sonore.
- Les pistes ignorées ou médias manquants sont signalés ; un import sans les médias requis est refusé.
- Les projets volumineux restent soumis aux limites actuelles de stockage local du navigateur et aux contraintes audio du moteur.

## Alternatives fonctionnelles aux plugins de mixage usuels

| Fonction de référence | Traitement WarLike original |
|---|---|
| Antares Auto-Tune Artist / EFX+ (correction monophonique) | VOX TUNE (limites de détection/rendu différentes) |
| FabFilter Pro-Q, EQ Waves, ReaEQ | VECTOR EQ |
| FabFilter Pro-C, Waves RComp/RVox, ReaComp | VECTOR COMP / VOX LEVEL |
| FabFilter Pro-L, limiteurs de mastering | VECTOR LIMIT |
| Waves de-esser | SIBIL |
| iZotope / nettoyage vocal | VOX CLEAN (traitement limité) |
| Valhalla réverbération | EXO SPACE |
| Soundtoys EchoBoy | ALTER ECHO |
| Soundtoys MicroShift / doubler | ALTER DOUBLE |
| Saturation analogique | CIRCUIT COLOR |

Dans **Projet → Chaînes FX WarLike**, appliquer les chaînes *Prise vocale propre*, *Justesse vocale*, *Voix moderne*, *Mixage transparent*, *Couleur analogique*, *Voix créative* ou *Pré-master*. Elles utilisent les véritables traitements natifs déjà pris en charge dans le moteur audio. Ne pas utiliser ces réglages comme une reproduction exacte de presets propriétaires.

### Validation
Tests automatisés : parseur REAPER, résolution des médias, propositions de substitutions, chaînes d'effets ; parcours Playwright avec import d'un RPP minimal et d'un fichier WAV.

Avant de considérer la fonction prête pour une production professionnelle : tester plusieurs vrais projets REAPER provenant de versions différentes, des pistes stéréo, plusieurs prises, une grande session audio, les inserts et le rendu comparé à REAPER.
