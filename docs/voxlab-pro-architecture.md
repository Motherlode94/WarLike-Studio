# VOX LAB PRO — architecture contractuelle (WarLike original)

## Positionnement

Ce document constitue la feuille de route de **douze modules dédiés** à produire progressivement. Il n'existe aucune affiliation officielle avec Antares et aucun algorithme propriétaire externe n'est reproduit. La seule chaîne immédiatement disponible dans le catalogue est le pack VOX LAB PRO Starter à sept processeurs déjà existants.

## Modules et paramètres

| ID stable | Nom | Paramètres déclarés | Implémentation requise |
| --- | --- | --- | --- |
| `voxtunelive` | VOX TUNE LIVE | key, scale, speed, amount, humanize, mix | AudioWorklet pitch suivi, validation latence et formants |
| `voxtunegraph` | VOX TUNE GRAPH | snap, drift, transition, amount, formant | Éditeur offline non destructif, pas un insert |
| `voxharmony` | VOX HARMONY | voices, interval, humanize, timing, spread, mix | Pitch polyphonique, formants et transport |
| `voxdoubler` | VOX DOUBLER | voices, detune, delay, width, mix | Réseau delay modulé, stabilité stéréo |
| `voxmicmodel` | VOX MIC COLOR | source, target, proximity, presence, air, mix | Profils tonaux génériques, sans émulation de marque |
| `voxhroat` | VOX THROAT | formant, body, breath, mix | Transposition formant séparée du pitch |
| `voxair` | VOX BREATH | frequency, threshold, range, amount, mix | Dynamique spectrale, contrôle du souffle |
| `voxsybil` | VOX SIBIL | frequency, threshold, range, release, mix | Dé-esseur et listen filtré |
| `voxcleanpro` | VOX CLEAN PRO | highpass, mud, gate, range, mix | Filtre + réduction contrôlée |
| `voxlevelpro` | VOX LEVEL PRO | peakThreshold, levelThreshold, ratio, release, mix, output | Deux étages de compression avec dry aligné |
| `voxwarm` | VOX WARM | drive, bias, tone, mix, output | Saturation antialiasée, compensation de volume |
| `voxmutate` | VOX MUTATE | pitch, formant, texture, width, mix | Worklet vocal créatif, contrôle du retard |

Les bornes min/max, pas, valeurs initiales et unités sont définies dans `dist/voxlab-pro-spec.js` ; les presets doivent obligatoirement utiliser ces bornes. Aucune fonction non implémentée ne doit être présentée comme active.

## Ordre de signal recommandé

```text
Entrée microphone / clip
  → VOX MIC COLOR → VOX CLEAN PRO → VOX SIBIL
  → VOX TUNE LIVE (OU VOX TUNE GRAPH en rendu offline)
  → VOX THROAT
  → VOX HARMONY / VOX DOUBLER (branches parallèles)
  → VOX LEVEL PRO → VOX WARM
  → VOX MUTATE (optionnel) → VOX BREATH
  → Bus de voix → Master
```

**VOX TUNE GRAPH n'est pas un effet temps réel** : un clip doit être analysé, les notes modifiées dans un éditeur non destructif puis rendu dans un nouveau média avant le reste de la chaîne. Les branches HARMONY et DOUBLER nécessitent une compensation de latence et un mélange dry/wet en phase.

## Structure JS prévue

```js
import {VOXPRO_PACK,VOXPRO_MODULES,VOXPRO_STARTER_MODULES} from './voxlab-pro-spec.js';

// Le pack utilisable sur la version actuelle — sept effets DSP existants :
STUDIO_PACKS.voxpro = {...VOXPRO_PACK,modules:VOXPRO_STARTER_MODULES};

// À effectuer module par module après un DSP Web Audio réellement implémenté :
const moduleId = 'voxwarm';
STUDIO_EFFECTS[moduleId] = VOXPRO_MODULES[moduleId];
// 1. Ajouter createStudioEffects(ctx, scope, ...) pour moduleId.
// 2. Ajouter syncStudioEffect(ctx, moduleId, ...) pour ses paramètres.
// 3. Ajouter des tests de changement audible, bypass, mono/stéréo, export.
// 4. Ajouter moduleId au pack lorsqu'il est réellement jouable.
```

Une simple entrée `STUDIO_EFFECTS` **ne suffit pas** : le moteur doit acheminer des nœuds audio à travers `createStudioEffects` et les actualiser via `syncStudioEffect`, sinon l'insert risque d'être silencieux ou déconnecté.

## Gates de validation

1. **Registre** : contrôle unique des identifiants, valeurs finies et paramètres conformes aux bornes.
2. **DSP** : mesure OfflineAudioContext prouvant une réponse différente quand un contrôle change.
3. **Bypass** : signal dry non dégradé et sans saut de gain intempestif.
4. **Temps réel** : absence de craquements, déclenchements stables et suivi du transport.
5. **Phase et latence** : mesurer et compenser le chemin dry, les doublages et les harmonies.
6. **Export** : comparaison Play / WAV sur cas mono et stéréo.
7. **Erreurs** : lorsque Web Audio ou AudioWorklet est absent, afficher une erreur explicite plutôt qu'un effet factice.
8. **Performance** : limiter la polyphonie et les allocations dans le callback audio.

Chaque module doit posséder ses propres tests et des presets qui modifient réellement le son. Les visuels `docs/bundles/*.svg` ne sont pas une démonstration de conformité.
