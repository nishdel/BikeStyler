---
type: guide
title: "Verification, assets and maintenance"
description: "Source-grounded BikeStyler documentation entry point."
tags: [bicycle, visualization, local]
sources:
  - id: openwiki-source-158a8452d53f612cbb00745f
    resource: repo://docs/ASSETS.md
  - id: openwiki-source-dc730a3bd4dd85cac7b18620
    resource: repo://docs/LICENSING.md
  - id: openwiki-source-a7d435908d0721e4eb6a0989
    resource: repo://docs/TESTING.md
  - id: openwiki-source-37d161eee67fb0cdf9b82ae2
    resource: repo://research/catalogue-review.json
  - id: openwiki-source-61536db03c492eb260d2d49d
    resource: repo://tests/browser/catalogue-mobile.spec.ts
generated: { by: "codex", at: "2026-10-19T12:42:53.720Z" }
verified:
  - by: openwiki/0.7.2
    at: 2026-10-19T12:49:33.437Z
---

# Verification, assets and maintenance

Use the canonical [development commands](../../docs/DEVELOPMENT.md) and [testing record](../../docs/TESTING.md). The [release report](../../docs/UPDATE-REPORT.md) records actual executed checks; a wiki scan is not a new test run.

Generated product-reference cutouts approximate appearance and can need manual correction. Hidden surfaces behind the original crank are not recovered. The code licence remains undecided; read [licensing](../../docs/LICENSING.md) and [asset provenance](../../docs/ASSETS.md).

Public Markdown remains canonical. This wiki is a source-linked navigation layer maintained through the native OpenWiki lifecycle. Private allowlists and synchronization settings stay outside the repository. See [maintenance](../../docs/MAINTENANCE.md). No generated Q&A or live-model acceptance is implied.

## Catalogue and phone verification

The 19 October catalogue update records 28 unit checks, three protected Python checks and 55 runnable browser checks passing across the full run and focused corrections. Phone tests use browser viewport emulation, including reduced height; physical devices were not tested. Two WebKit offline checks are explicitly skipped: portable reload and cached catalogue fetch. See the [dated evidence and limitations](../../docs/TESTING.md).

The metadata importer verifies the source archive and emits committed local JSON. Ordinary app builds do not need that private archive or Python. The [catalogue guide](../../CATALOGUE.md#research-listings) explains reproducible import and variant preservation. All 73 priority images were reviewed, with no newly approved photograph for redistribution; unsupported or misleading candidates remain catalogue-only and supported entries use labelled generic previews.

LAB's bounded implementation attempts hit snapshot size and then the whole-host RAM guard. No model patch was accepted. Codex completed and checked the implementation directly; model limits were preserved. This result and the distinction between document staging, native wiki generation and downstream indexing are documented in [maintenance](../../docs/MAINTENANCE.md).

[Architecture and state](../architecture/system.md) · [Start here](../quickstart.md)
