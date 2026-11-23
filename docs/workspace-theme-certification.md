# R08.3g.7 — rendered workspace certification

The `Rendered themes and project integrity` job in `workspace-layouts.yml` runs
`tests/workspace-theme-browser.mjs` against the built app in Chromium. It exercises
24 combinations, using the real layout/theme selectors and native plugin windows:

| Dimension | Cases |
| --- | --- |
| Theme | Forest, Graphite, Slate, Ivory |
| Layout | Pro Tools, FL Studio |
| Viewport | 1920×1080, 1366×768, 390×844 |

Each case checks rendered library text contrast (4.5:1), a visible search focus
ring, library/panel horizontal bounds, native harp parameter preservation while
switching theme, factory preset search/Escape, focus/query preservation through a real debounced
resize while typing, a GLUE window and unique DOM IDs.
Plugin cases also check preset-bar labels and the effect caption against their
actual backgrounds. Desktop cases check the rendered brand contrast. Library and plugin captures
and measured ratios are uploaded as the `workspace-theme-matrix` artifact. On
failure the artifact includes `failure.png` and the completed cases in `report.json`.

The project is exported through the real Save command before and after the matrix
and after a cold reload. The normalized project must match exactly; the final
layout and theme must reopen as FL/Ivory. This catches appearance changes that
accidentally mutate music or reset preferences.

The shell now themes the library heading, tabs, cards, search and branding with
shared palette tokens. Previously the Ivory accent became dark text over a
hardcoded blue heading, and the brand stayed pale over a white topbar. Dedicated
instrument/effect hardware palettes remain governed by their own styles.

Complementary checks in the existing jobs:

- `instrument-faces-browser.mjs`: all 42 native instruments, controls/readouts,
  presets, scoped history, two-window isolation, sampled media, MIDI and portable
  project import/export/cold reopen.
- `effect-faces-browser.mjs`: every entry in `EFFECTS` (currently 38), exact native
  control coverage, live readouts, scoped undo, representative captures and a
  mobile PRISM panel; machine-readable inventory in `effect-faces/report.json`.
- `preset-folders-browser.mjs`: factory/project/device banks, search, source
  isolation, mobile picker and portable preset roundtrip.
- `game-sounds-browser.mjs`: all 24 SFX, audible decoded WAVs, ZIP manifest,
  audio-track insertion, undo/redo and media persistence.
- `r05-integrated-browser.mjs`: actual audio import, editing, playback, project
  persistence and decoded WAV PCM comparison before/after cold reopening.

Node palette tests remain useful for token integrity, but do not replace the
rendered-cascade checks. This matrix samples shared chrome with harp/GLUE; it does
not claim every plugin at every theme/size, human musical listening, multiple
physical inputs, monitoring latency, 30–60 minute hardware endurance, real-device
mobile browsers or production account/device sync. See `r05-release-certification.md`
for the remaining manual release checks. A green run certifies these automated
paths on that exact commit, not the untested hardware paths.
