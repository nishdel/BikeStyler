# Testing and known limitations

Use the commands in [DEVELOPMENT.md](DEVELOPMENT.md). The [Checks workflow](../.github/workflows/checks.yml) installs the lockfile, checks TypeScript, runs Vitest, builds production assets and runs the Playwright suite with read-only repository permissions. It does not upload screenshots, traces or personal projects.

## Release evidence — 19 October 2026

The sanitized checkout passed TypeScript checks, all 23 unit checks and the production build. Its contributed public example was imported through the actual UI, saved to a portable file, reopened, reloaded offline and exported as an opaque white PNG. Four genuine screenshots were captured and visually inspected. The full browser suite's final result is recorded in [UPDATE-REPORT.md](UPDATE-REPORT.md).

Playwright covers Chromium, Firefox and WebKit desktop engines. Firefox/WebKit run the expansion, placement and photographic-part checks; Chromium also runs the broader editing/import/export workflows and the contributed-example release check. This is automated browser-engine coverage, not physical-device testing. A mobile viewport overflow check is not a real phone test.

The existing WebKit offline portable-asset reload check remains explicitly skipped. Windows WebKit previously failed inside the engine after `context.setOffline(true)`; that path remains unverified. The skip is retained on CI as well and must not be described as a passing WebKit offline test.

## Manual review and limits

Check frame/fork overlap, saddle rails, crank/pedal alignment, wheel ellipses/hubs and alpha edges in your own photograph. The published screenshots expose the current behaviour, including imperfect hidden-area reconstruction around the crank.

- Mask suggestions are classical image processing, not object recognition. Clutter, shadows and dark spokes often need manual correction.
- Single-view replacement is two-dimensional. Large viewpoint changes, exact product geometry and hidden surfaces are not recovered.
- Generated assets can differ in colour, embossing, spoke/tooth counts and small details; generic previews represent broad shapes.
- Compatibility checks are incomplete by design; see the [user guide](USER-GUIDE.md#catalogue-and-compatibility).
- Browser storage can be cleared or evicted. Export portable backups before changing origins or resetting storage.
- Fresh-cache offline operation requires a successful initial production cache. Development mode and WebKit's skipped reload path are not covered by an offline guarantee.

Before reporting a visual bug, reproduce with a bundled example if possible. Keep private images and project files out of issues and CI artifacts.
