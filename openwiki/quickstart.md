---
type: guide
title: "BikeStyler: start here"
description: "Source-grounded BikeStyler documentation entry point."
tags: [bicycle, visualization, local]
sources:
  - id: openwiki-source-23775c3de52f3ab95a13cb8b
    resource: repo://README.md
  - id: openwiki-source-54631e6ebf1d3b815c4a5eed
    resource: repo://src/App.tsx
generated: { by: "codex", at: "2026-10-19T12:42:53.720Z" }
verified:
  - by: openwiki/0.7.2
    at: 2026-10-19T12:49:33.437Z
---

# BikeStyler: start here

BikeStyler is a local browser tool for exploring bicycle appearance using a photograph, manual/classical masking, component choices, comparison and white PNG export. The app performs no AI inference. Some static illustrations were generated during development.

Use the canonical [README](../README.md) for installation and the [user guide](../docs/USER-GUIDE.md) for editing. The [public repository](https://github.com/nishdel/BikeStyler) is independent of OmniLAB and OpenWiki.

For quick styling on a phone, open a prepared bicycle, choose a component and use **Visual styles → Real parts**. Expand the component panel for searching and return to the bicycle after applying a choice. Use **Catalogue → Expanded source catalogue** for all incoming listings; their fitment remains unknown. **Compatible real parts** is limited to the existing recorded-requirement checks.

The [catalogue guide](../CATALOGUE.md#research-listings) distinguishes the 100 reviewed records from 4,454 source listings and their explicit variants. New source cards use labelled generic previews where supported; manufacturer reference photographs are not bundled. Start with the [phone workflow](../docs/USER-GUIDE.md#on-a-phone), [setup and offline commands](../docs/DEVELOPMENT.md) or [dated update evidence](../docs/UPDATE-REPORT.md).

[Architecture](architecture/system.md) · [Testing and limitations](operations/use-and-verify.md)
