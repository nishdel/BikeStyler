---
type: guide
title: "Rendering, products and persistence"
description: "Source-grounded BikeStyler documentation entry point."
tags: [bicycle, visualization, local]
verified:
  - by: openwiki/0.7.2
    at: 2026-10-19T12:49:33.437Z
sources:
  - id: openwiki-source-36034c1eb17e14fbab81be12
    resource: repo://docs/USER-GUIDE.md
  - id: openwiki-source-58f297a34ca1d00e8e0b84c3
    resource: repo://src/compatibility.ts
  - id: openwiki-source-b6f42c4642e3d79f54d13fdc
    resource: repo://src/ListingCard.tsx
  - id: openwiki-source-2d0b7b700466a2d66f5d52d2
    resource: repo://src/ProductVisualPicker.tsx
  - id: openwiki-source-42ff4f6ef94112b8105c45e3
    resource: repo://src/researchCatalogue.ts
  - id: openwiki-source-8c41f6af2f7fae813233a574
    resource: repo://src/validation.ts
generated: { by: "codex", at: "2026-10-19T12:42:53.720Z" }
---

# Rendering, products and persistence

React state coordinates setup and editing. Canvas compositing combines photograph pixels, masks, protection and replacement styles. IndexedDB saves local projects; portable JSON embeds permitted selected assets.

The catalogue separates product facts from appearance styles. Compatible real parts only evaluates the recognized confirmed requirements and recorded bicycle values. It does not prove physical fit.

Read the canonical [architecture](../../docs/ARCHITECTURE.md), [catalogue guide](../../CATALOGUE.md), [compatibility implementation](../../src/compatibility.ts) and [portable-project implementation](../../src/portable.ts). These maintained sources are authoritative.

## Source listings and phone presentation

The expanded research layer loads a local index and requests category details on demand. Only the chosen listing and explicit option snapshot are stored with the existing visual style. Unsupported categories remain browsable without an Apply action. Source listings have unknown fitment and do not enter Compatible real parts. The production service worker precaches all local catalogue shards; lazy UI loading does not mean a partial offline cache.

Project validation rejects mixed reviewed-product/source-listing selections and a listing attached to a different component category. The renderer still uses the existing style entry and generic or generated-reference labels. Reference image URLs are metadata; the editor does not load those external images.

Phone panels share the desktop project and compositor. Collapsed, half-height and expanded states adjust controls around the bicycle; applying a choice exits expanded browsing. Visual viewport height and larger controls improve the quick-styling workflow, while precision setup remains a desktop-oriented task.

See [research state and loader](../../src/researchCatalogue.ts), [selection cards](../../src/ListingCard.tsx), [project validation](../../src/validation.ts), [phone presentation](../../src/mobile.css) and [use and verification](../operations/use-and-verify.md).

[Start here](../quickstart.md)
