# R08.4 — original editable compositions

Six instrumental scores join the existing three full sessions. Open them through
**Projet → Sessions complètes** or **Bibliothèque → Sessions**. Opening uses the
existing confirmation and previous-session backup; every opening creates a fresh
editable project with native clips, presets and inserts.

| Composition | Style / key | Tempo | Form | Duration, without tail |
| --- | --- | --- | --- | --- |
| Rives de Kin | Afro, G major | 106 BPM | 88 bars | 3:19.25 |
| Après la pluie | R&B, E-flat major | 78 BPM | 72 bars | 3:41.54 |
| Horizon de cuivre | Amapiano, F minor | 112 BPM | 96 bars | 3:25.71 |
| Éclats d’asphalte | Alternative rock, E minor | 124 BPM | 112 bars | 3:36.77 |
| Kin après minuit | Congolese rumba, G major | 104 BPM | 96 bars | 3:41.54 |
| Lumière en ville | Organic pop, D major | 116 BPM | 104 bars | 3:35.17 |

All six arrangements have an intro, two verses, a build, two choruses, a bridge (a sebene in Kin après minuit) and an outro. These are new scores: chorus melodies, bridge harmony, bass patterns,
drum fills and orchestration develop across sections. The short 16-bar reference
form remains available to code through `createFactorySession(id)`; the user-facing
session command opens the complete score with `createFactorySession(id, true)`.

Rives de Kin combines muted guitar, kora, mbira, flute, electric bass and
percussion. Après la pluie combines FM keys, piano, tonewheel, vibraphone,
electric bass and a soft drum pocket. Horizon de cuivre uses a tuned synthetic
NGOMA log drum, FM keys, mbira, kora and tonewheel over shakers. Éclats d’asphalte
uses synthetic crunch/clean/steel/hollow guitars, an electric bass and a backbeat
that changes to half-time in the bridge. Two dedicated preview grooves are also
available in the groove bank: Horizon Pocket and Éclats Backbeat.

Kin après minuit develops interlocking nylon, clean, muted and steel guitar parts
through a 16-bar sebene. Its catalog card labels that section correctly. Lumière
en ville develops a piano pulse, a clean-guitar hook, acoustic strums and an ATLAS
pad, with a softer bridge. Their Kin Sebene and Lumière Pop preview grooves join
the groove bank, bringing the catalog to nine full sessions and sixteen grooves.

Each project has six scored instrument
tracks plus three **empty audio tracks** (LEAD VOX, BACKS, ADLIBS) for recording.
No human vocal performance or lyrics are included.

The catalog displays the actual bar counts instead of the old automatic duration
estimate. All notes and drum events can be edited; no rendered backing track hides
the score. Existing acoustic instruments use the recordings already bundled with
Studio. A light delay is confined to the response instrument; the session PEAK
stage and -1 dB master retain export headroom. Instrument faders compensate
for the quiet native source presets; the full-render gate requires mix RMS
above 0.02, peak between 0.2 and 0.95 and every section RMS above 0.005.

Validation:

- Node checks cover score bounds, native parameter ranges, diatonic pitches,
  section development, deterministic musical content and isolation of copies.
- The factory browser matrix now includes `rives`, `pluie`, `horizon`, `eclats`, `kin` and `lumiere`, retaining all three
  older songs. Each new song is opened through the actual catalog, saved,
  reopened cold, imported as a portable project, played and fully exported.
- The complete stereo 24-bit/44.1 kHz WAV is decoded to check finite PCM, duration,
  audible sections and absence of clipping. The new WAVs, editable `.chayah`
  projects, editor/mobile captures and metrics are uploaded to
  `studio-factory-sessions-{rives,pluie,horizon,eclats,kin,lumiere}` for seven days.

Automated level checks do not replace artistic listening or physical recording
and latency tests. The scores can be adjusted further after listening in Studio.
