# R03-UI.6 — workspace theme certification

Automated Node tests cover dark/light palette text contrast (4.5:1), token references and shared workspace CSS rules. They do not validate browser cascade, rendered geometry or semantic indicators.

Before release, manually test both FL and PT profiles in light and dark at 1920×1080, 1366×768 and 390×844. For each combination open Projects, menus, arrangement, mixer, piano roll, rack and plugin windows. Switch theme while windows remain open. Verify text contrast, keyboard focus, scroll ownership, no clipped actions, no horizontal page overflow, selection, mute/solo/arm, clip colors, meters and bypass. Save and reopen session; ensure profile/theme changes do not alter audio data. Capture screenshots and record failures. Browser matrix remains pending until executed.
