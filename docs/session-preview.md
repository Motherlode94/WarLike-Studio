# R08.5 — musical session previews

The Sessions library has an **Écouter** action on every composition. It prepares
and plays four bars from the first chorus, including the scored instruments,
drums and mix settings. The existing **Rythme** button auditions the drum groove;
**Ouvrir** retains the existing confirmation and previous-session backup.

A shared preview panel names the composition and section, shows elapsed time and
provides Stop during preparation and playback. Enter/Space activate the real
buttons. The controls use all four theme palettes and survive viewport reflows.

The excerpt is rendered at 44.1 kHz in stereo with the production audio renderer.
An independent playback context keeps the open project's tempo, master level,
routing, clips and media outside the audition graph. A short fade protects the
start/end; previews are played once. No microphone is requested by this feature.

Only one audition owns playback. Stop, another audition, a library search/filter,
leaving the library, opening a modal/project, normal transport, recording and a
hidden page invalidate its request. Abort signals are passed to rendering; a late
render/playback setup cannot restart cancelled sound. Native offline work already
in flight can finish, but its result cannot start playback after cancellation.
The two most recently rendered public factory excerpts are cached in RAM. They
contain no user media and are not saved into the user's project or undo history.

Validation:

- Node tests cover all nine chorus ranges, isolated scores, render/setup cancellation,
  out-of-order results, a two-entry LRU cache, natural end and error recovery.
- Chromium uses the actual UI and renderer for all nine excerpts. It checks stereo
  PCM, duration, finite samples, audible levels and headroom; natural completion,
  keyboard, Stop, cache and replacement are exercised.
- Controlled holds verify cancellation by Stop, search, navigation, confirmation and
  project switch. A pending microphone request is simulated without requesting a
  real device, to verify the recording guard.
- Exported user project, media bytes, master level and undo availability must remain
  identical after auditions. Existing transport is then exercised separately.
- Four mobile theme captures and an audio metrics report are uploaded in the
  `session-preview` CI artifact. Existing full-song export checks remain active.
