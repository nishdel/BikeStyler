# Architecture

BikeStyler is a React/TypeScript single-page application built with Vite. All editing happens in the browser. There is no application backend.

```mermaid
flowchart LR
  Photo[Photo or portable project] --> Validation[Image and project validation]
  Validation --> Setup[Setup editor and processing worker]
  Setup --> Project[Project state]
  Catalogue[Local styles and product facts] --> Project
  Project --> Canvas[Canvas compositor]
  Canvas --> Preview[Editor and comparison]
  Canvas --> PNG[White PNG export]
  Project --> Storage[IndexedDB autosave]
  Project --> Portable[Portable JSON with permitted assets]
  Build[Production build] --> Cache[Versioned service worker cache]
```

| Area | Source |
| --- | --- |
| App state, import/export coordination | [App.tsx](../src/App.tsx) |
| Photo setup, masks and worker operations | [Setup.tsx](../src/Setup.tsx), [setup.worker.ts](../src/setup.worker.ts), [pixels.ts](../src/pixels.ts) |
| Editor, styles, comparison and placement UI | [Garage.tsx](../src/Garage.tsx) |
| Masked compositing and opaque exports | [compositor.ts](../src/compositor.ts) |
| Raster lighting and wheel projection | [rasterParts.ts](../src/rasterParts.ts) |
| Catalogue, generic geometry and reference styles | [catalogue.ts](../src/catalogue.ts), [expandedCatalogue.ts](../src/expandedCatalogue.ts), [photographicCatalogue.ts](../src/photographicCatalogue.ts) |
| Product selection and optional fit checks | [ProductVisualPicker.tsx](../src/ProductVisualPicker.tsx), [compatibility.ts](../src/compatibility.ts) |
| Validation, persistence and portable assets | [validation.ts](../src/validation.ts), [storage.ts](../src/storage.ts), [portable.ts](../src/portable.ts) |
| Production caching and CSP | [build-sw.mjs](../scripts/build-sw.mjs) |

The compositor separates source pixels, cut-out alpha, part masks and protection masks. Recolouring preserves local shading. Replacement drawing uses attachment anchors; wheel rendering accounts for ellipse and hub placement. Foreground protection retains original frame/hardware pixels where appropriate. This is two-dimensional compositing, not geometry reconstruction or a physical bicycle model.

Product metadata and visual style entries are separate. A real product may use a generic style and is labelled accordingly. Compatibility evaluates only recognized, recorded requirements. Portable projects embed selected redistributable catalogue assets so a saved design does not depend on a remote product image URL.
