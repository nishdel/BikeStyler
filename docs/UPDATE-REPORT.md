# Public release preparation — 19 October 2026

The public distribution preserves the existing editor and rendering behaviour. Changes cover a sanitized source tree, reviewed examples/screenshots, public documentation, reproducible test configuration, CI and one autosave-status correction. Original working files and richer saved projects remain local.

Measured inventory: 100 real product records, 68 documented variants, 103 sources, 117 incomplete candidates, and 211 visual styles in 35 populated categories. The visual styles comprise 207 deterministic drawings, one generic generated lever and three product-reference-generated cutouts. No exact manufacturer-photo preview is claimed.

Type checking, 23 unit checks and production build passed in the sanitized checkout. Across the full browser run and focused reruns, all 38 runnable browser checks passed; one existing WebKit offline reload check remains skipped. The first full run had 36 passes and two test-environment failures (a preview server transition and a fixed-port network assertion). Both passed after correcting the test setup. The final production example import/save/reopen/opaque-white-export/offline check also passed after the last asset-provenance edit. These are automated engine checks, not physical-device testing.

The first published [CI run](https://github.com/nishdel/BikeStyler/actions/runs/39202223352) passed installation, type checking, 23 unit checks, build and 37 browser checks, with one failure and one existing skip. The offline test exposed stale “Saved locally” feedback before an edited revision was persisted. Edits now mark the save status immediately; the regression checks the pending status and selected colour before saving, then verifies the colour survives an offline reload. After that correction, type checking, all 23 unit checks, build and six focused Chromium browser checks passed locally, including offline persistence, undo, two-tab conflicts and the public example. Subsequent CI results are available from the repository’s Checks workflow.

The code licence remains undecided. Asset attribution, permissions and generated-reference labels are retained separately. Private prompts, reference downloads, diagnostic logs, source-room pixels and identifying image metadata are excluded from the distribution. See [licensing](LICENSING.md), [assets](ASSETS.md) and [maintenance](MAINTENANCE.md).

## Catalogue and phone update — 19 October 2026

Added 4,454 source listings with 24,070 explicit variants and 22,534 image references from 30 publishers, while retaining the existing 100 reviewed product records and 68 documented variants. Nine exact source aliases are grouped in the visual picker; counts overlap and are not unique models. All incoming fitment is unknown and excluded from Compatible real parts. The 117 older unfinished candidates remain separate.

All 73 priority candidates were reviewed: 58 can use existing labelled generic previews and 15 are catalogue-only. Classification corrections prevent a helmet and unrelated accessories from appearing as bicycle replacement parts. No newly approved manufacturer photograph or generated image was added; reference photos and CAD remain outside the distribution.

Phone styling now has collapsed, half-height and expanded component panels, larger controls, responsive search, pagination and optional measurement disclosure. Applying a choice returns from expanded browsing to the bicycle. Source listing identity and selected literal options survive portable save/reopen without carrying the whole catalogue.

Type checking, 28 unit checks, three protected Python checks and the production build passed. The full run and focused corrections cover 55 passing browser checks. The original WebKit offline skip remains, and a newly observed cached-catalogue fetch failure is explicitly skipped too. Both offline paths pass in the engines where they are exercised; no physical-device testing is claimed. Six genuine example screenshots, including two phone views, are included. See [TESTING.md](TESTING.md) for scope and historical failures.

LAB implementation attempts were blocked by snapshot size and then the unchanged whole-host RAM guard. No local-model patch was accepted; Codex completed and reviewed the implementation directly. Canonical public documentation and native OpenWiki remain the documentation sources; private LAB evidence and integration configuration are not published.
