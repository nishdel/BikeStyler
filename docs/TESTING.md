# Testing and known limitations

Use the commands in [DEVELOPMENT.md](DEVELOPMENT.md). The [Checks workflow](../.github/workflows/checks.yml) installs the lockfile, checks TypeScript, runs Vitest, builds production assets and runs the Playwright suite with read-only repository permissions. It does not upload screenshots, traces or personal projects.

## Catalogue and phone update — 19 October 2026

The update passed TypeScript, 28 Vitest checks, three Python source-option checks and the production build. Across the full browser run and focused corrections, all 55 runnable checks passed; two WebKit offline checks are explicitly skipped below. The focused 28-check rerun passed 27 and exposed the second WebKit limitation, which is now recorded as a skip rather than successful offline coverage.

The added checks cover source identity/variant conservation, exact aliases, category corrections, small portable snapshots, explicit option selection, save/reopen, pagination and retained filters. Phone workflows run at 360, 390 and 430 px, with 844×390 landscape, a 768×1024 tablet viewport and a 480 px reduced-height keyboard simulation. They check apply, sheet states, 44 px browse control, comparison, export and overflow. They do not emulate every mobile browser keyboard or constitute physical-device tests.

Six screenshots were captured from the public example through the application, inspected visually and stripped of metadata without changing their pixels. The example retained its saved designs and generated assets through portable save/reopen and an opaque white PNG export. The research importer also produced byte-identical JSON on a repeat import.

## Initial public release — 19 October 2026

The sanitized checkout passed TypeScript checks, all 23 unit checks and the production build. Its contributed public example was imported through the actual UI, saved to a portable file, reopened, reloaded offline and exported as an opaque white PNG. Four genuine screenshots were captured and visually inspected. The full browser suite's final result is recorded in [UPDATE-REPORT.md](UPDATE-REPORT.md).

Playwright covers Chromium, Firefox and WebKit desktop engines. Firefox/WebKit run the expansion, placement, photographic-part and catalogue/mobile checks; Chromium also runs the broader editing/import/export workflows and the contributed-example release check. This is automated browser-engine coverage, not physical-device testing. Phone viewport checks are browser emulation, not physical-device testing.

Two WebKit offline checks are explicitly skipped: the existing portable-asset reload and the added research-catalogue offline fetch. Windows WebKit failed inside the engine on offline reload, and could not fetch the service-worker-cached index from an already-open offline page. Chromium and Firefox exercise the research catalogue after offline reload. The WebKit paths remain unverified; these skips are retained on CI and are not passing offline tests.

## Manual review and limits

Check frame/fork overlap, saddle rails, crank/pedal alignment, wheel ellipses/hubs and alpha edges in your own photograph. The published screenshots expose the current behaviour, including imperfect hidden-area reconstruction around the crank.

- Mask suggestions are classical image processing, not object recognition. Clutter, shadows and dark spokes often need manual correction.
- Single-view replacement is two-dimensional. Large viewpoint changes, exact product geometry and hidden surfaces are not recovered.
- Generated assets can differ in colour, embossing, spoke/tooth counts and small details; generic previews represent broad shapes.
- Compatibility checks are incomplete by design; see the [user guide](USER-GUIDE.md#catalogue-and-compatibility).
- Browser storage can be cleared or evicted. Export portable backups before changing origins or resetting storage.
- Fresh-cache offline operation requires a successful initial production cache. Development mode and WebKit's skipped offline paths are not covered by an offline guarantee.

Before reporting a visual bug, reproduce with a bundled example if possible. Keep private images and project files out of issues and CI artifacts.
