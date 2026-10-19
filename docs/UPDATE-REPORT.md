# Public release preparation — 19 October 2026

The public distribution preserves the existing editor and rendering behaviour. Changes are limited to a sanitized source tree, reviewed examples/screenshots, public documentation, reproducible test configuration and CI. Original working files and richer saved projects remain local.

Measured inventory: 100 real product records, 68 documented variants, 103 sources, 117 incomplete candidates, and 211 visual styles in 35 populated categories. The visual styles comprise 207 deterministic drawings, one generic generated lever and three product-reference-generated cutouts. No exact manufacturer-photo preview is claimed.

Type checking, 23 unit checks and production build passed in the sanitized checkout. Across the full browser run and focused reruns, all 38 runnable browser checks passed; one existing WebKit offline reload check remains skipped. The first full run had 36 passes and two test-environment failures (a preview server transition and a fixed-port network assertion). Both passed after correcting the test setup. The final production example import/save/reopen/opaque-white-export/offline check also passed after the last asset-provenance edit. These are automated engine checks, not physical-device testing.

The code licence remains undecided. Asset attribution, permissions and generated-reference labels are retained separately. Private prompts, reference downloads, diagnostic logs, source-room pixels and identifying image metadata are excluded from the distribution. See [licensing](LICENSING.md), [assets](ASSETS.md) and [maintenance](MAINTENANCE.md).
