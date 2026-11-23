# R08.4 — original editable compositions

Two instrumental scores join the existing three full sessions. Open them through
**Projet → Sessions complètes** or **Bibliothèque → Sessions**. Opening uses the
existing confirmation and previous-session backup; every opening creates a fresh
editable project with native clips, presets and inserts.

| Composition | Style / key | Tempo | Form | Duration, without tail |
| --- | --- | --- | --- | --- |
| Rives de Kin | Afro, G major | 106 BPM | 88 bars | 3:19.25 |
| Après la pluie | R&B, E-flat major | 78 BPM | 72 bars | 3:41.54 |

Both arrangements have an intro, two verses, a build, two choruses, a bridge and
an outro. These are new scores: chorus melodies, bridge harmony, bass patterns,
drum fills and orchestration develop across sections. The short 16-bar reference
form remains available to code through `createFactorySession(id)`; the user-facing
session command opens the complete score with `createFactorySession(id, true)`.

Rives de Kin combines muted guitar, kora, mbira, flute, electric bass and
percussion. Après la pluie combines FM keys, piano, tonewheel, vibraphone,
electric bass and a soft drum pocket. Each project has six scored instrument
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
- The factory browser matrix now includes `rives` and `pluie`, retaining all three
  older songs. Each new song is opened through the actual catalog, saved,
  reopened cold, imported as a portable project, played and fully exported.
- The complete stereo 24-bit/44.1 kHz WAV is decoded to check finite PCM, duration,
  audible sections and absence of clipping. The new WAVs, editable `.chayah`
  projects, editor/mobile captures and metrics are uploaded to
  `studio-factory-sessions-rives` and `studio-factory-sessions-pluie` for seven days.

Automated level checks do not replace artistic listening or physical recording
and latency tests. The scores can be adjusted further after listening in Studio.
