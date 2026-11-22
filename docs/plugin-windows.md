# R08.3g.2 — Individual plugin windows

Each track instrument and each inserted effect has one view for its existing
session identity `(trackId, insertId)`. Opening another processor keeps the first
view open. Opening an existing processor focuses and expands its view. The
underlying instrument/effect state stays in the project; closing a view never
removes an insert, bypasses it, or resets its settings.

- Headers identify both the processor and its track.
- Pointer and keyboard focus raise the chosen window. Escape closes only the
  active plugin; each window has its own minimize and close controls.
- Fenêtres & outils lists every open processor by name and track. Choosing a
  minimized plugin in that list expands it.
- Geometry is saved by instance and workspace profile. Closing and reopening a
  processor restores its desktop position and dimensions. Mobile sizing does
  not overwrite desktop geometry.
- Removing an insert or track disposes its affected views. Project changes clear
  every old plugin view and its global resize/pointer listeners.
- Controls resolve inside their own window. Inactive control IDs are namespaced;
  `#pluginFloat` and its original child IDs remain aliases for the active view.
  This preserves existing hardware browser gates while keeping DOM IDs unique.
- Rack-file import captures its initiating instance, so changing focus while a
  file is selected cannot redirect the import to a different track.

Validation: Node window lifecycle and geometry tests, full suite and static
build; the workspace workflow also runs `tests/plugin-windows-browser.mjs` for
same-effect track isolation, presets, focus, minimize, close/reopen geometry,
insert removal, project disposal, unique IDs and a mobile viewport.

This lot covers the host for track plugins. Master processors retain their
existing Mastering view. UI layout redesign and full graphical/audio
certification follow the roadmap below; this is not a production audio
certification.

| Lot | Scope |
| --- | --- |
| R08.3g.2 | Individual plugin window manager (this change) |
| R08.3g.3 | Shared command bar |
| R08.3g.4 | Individual instrument redesign |
| R08.3g.5 | Individual effect redesign |
| R08.3g.6 | Preset organization |
| R08.3g.7 | Graphical and functional certification |
| R08.4 | New musical compositions |
