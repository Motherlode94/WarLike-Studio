# Browser checks after Studio viewport changes

Studio schedules a complete workspace render after a viewport resize. The resize
API returning establishes the new viewport dimensions; the existing controls may
still be replaced by the scheduled render.

Two post-merge failures on `6374f24` exposed this race:

- VECTOR Suite read `boundingBox().width` while its master panel was being replaced.
  The bounding box was null.
- The Éclats factory check started a session-card screenshot before the card was
  replaced. Playwright reported a detached element. That run stopped before the
  full WAV export step.

`tests/browser-viewport.mjs` provides `resizeStudio(page, size)`. It captures an
existing track-row handle, changes the viewport, and waits until the actual render
has replaced that row. It then waits for loaded fonts and the next painted frames.
The handle is disposed after synchronization. A missing render remains a timeout
failure; the helper does not retry failed assertions or suppress browser errors.

Factory-session and VECTOR checks now exercise mobile → desktop → mobile before
capturing the final mobile view. The game-sound bank repeats desktop → mobile for
each of the four themes and includes geometry in assertion failures. The existing
24-case workspace theme matrix uses the same helper and retains its focused-search
resize regression.

All previous audio, geometry, persistence and preset assertions remain active.
The factory matrix still renders and decodes every complete song, checking duration,
PCM validity, levels, headroom and every section. No job timeout or audio threshold
changes are part of this correction.
