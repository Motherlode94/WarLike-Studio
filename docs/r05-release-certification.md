# R05.6 — General certification / release gate

Scope: browser DAW integration, before R06 VECTOR hardware UI. This is a validation gate, not a claim that Studio has been certified on physical hardware.

## Automated evidence
- Existing Node CI, recording integrity, cloud integration, Quality Gates (DSP, export, long arrangements), context menus and workspaces remain required.
- New integrated Chromium job imports an original deterministic 440 Hz WAV, edits clips by real contextual menus, uses a native insert, changes all four themes, plays the session, saves, exports 24-bit stereo at 44.1 kHz, cold reopens, compares project media/parameters and actual PCM output, reimports the portable session and checks mobile controls.
- The job uploads WAVs, .chayah fixtures, theme and mobile screenshots, and a machine-readable report. These are synthetic QA files, not user data.
- Require all checks on the exact candidate revision. R05.4 #141 must be merged and its browser-local preset bank tested on the integrated revision before closing R05.6; it was not yet in main at branch creation.

## Manual acceptance still required
- Real dual physical inputs, direct monitoring, headphone latency and 30–60 minute uninterrupted recording.
- Human audition of full Trap, Afro and R&B exports, EQ/dynamics/time FX and silence/clipping issues.
- Chrome/Edge and actual mobile hardware, keyboard and pointer interaction, four themes and FL/PT layouts.
- Account separation and real device sync in deployed authenticated environment; do not substitute test CI for production verification.
- Verify R05.4 factory/user preset pickers, cross-project user presets, portable import/export and invalid files.
- No PR with red or pending checks may be merged. Document manual evidence and known limitations before marking the release certified.
