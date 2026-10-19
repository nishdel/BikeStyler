# Catalogue and asset extension

The catalogue has two independent layers: real-product metadata and appearance assets. A verified product record is not an exact photographic preview or a fit guarantee.

Current inventory: 100 real products, 68 nested documented variants, 103 source records and 117 unfinished candidates. Visual inventory: 211 styles in 35 populated categories, comprising 207 deterministic drawings, one generic generated lever style and three generated product-reference styles. The generic total is 208. Four real products map to the three reference styles. Exact manufacturer-photo previews: zero.

## Add product facts

The reviewed-product layer below remains separate from the larger research layer. Imported source options are never promoted into verified fitment facts automatically.

1. Read [productTypes.ts](src/productTypes.ts) and [products.schema.json](schemas/products.schema.json). Use stable IDs, category IDs, source URLs, review dates and explicit fact status.
2. Add reviewed metadata to [verified-products.json](research/verified-products.json) or [product-visual-expansion.json](research/product-visual-expansion.json). Keep unknown facts unknown. Put incomplete research in the backlog rather than inventing facts or dimensions.
3. Run `npm run catalogue:build`. It validates and merges the inputs, writes [products.generated.json](src/products.generated.json) and refreshes [coverage-report.json](research/coverage-report.json). Run unit checks and review the generated diff.
4. Map an approved visual in [productVisuals.ts](src/productVisuals.ts). Check variant choices, persistence and the displayed generic/reference label. Do not label a generated image as a manufacturer photograph.

## Add an appearance asset

Use the [catalogue schema](schemas/catalogue.schema.json) and existing entries as examples. Supply stable category/renderer IDs, attachment anchors, provenance, licence/permission, limitations and `visualOrigin`. Set `embeddingAllowed` only when project redistribution is permitted.

For raster parts, prepare a clean transparent PNG or WebP with real alpha openings, no background/checkerboard, and an angle close to the expected side photograph. Keep enough resolution for placement and inspect the result on white and grey. Strip identifying metadata before committing. Record reference links separately from image redistribution permission. Do not include manufacturer source photographs without appropriate permission.

Define the mount point in the asset's own coordinate system; check saddle rails, spindle position and wheel axle/rim bounds. Use [rasterParts.ts](src/rasterParts.ts) and the existing photographic entries for crop, lighting and wheel-plane parameters. Test both sides and foreground overlap. A generated reference should remain visibly labelled even if it looks photographic.

Imported custom assets belong to the user's local project. Publishing an example or screenshot requires a separate rights and privacy review. [Asset ledger](docs/ASSETS.md).

## Research listings

The 18 October 2026 snapshot contains 4,454 listings, 24,070 explicit variants, 22,534 image references and 30 publishers. Its original taxonomy contains 70 categories, with 63 populated. The reviewed app taxonomy adds a **Not a bicycle component** category for a misclassified helmet: 71 categories, 64 populated. Listing counts include finishes, generations, bundles and other possible duplicates; they are not unique-model or availability claims.

All incoming fitment remains unknown. Generic previews are available only for mapped categories with existing renderers. Unsupported entries can be browsed without an Apply action. Measurements do not come from marketing names, option labels or photographs. Availability describes the source snapshot, not current stock. Classification review, image permission and physical fit are separate states.

The [73-candidate review](research/catalogue-review.json) records visual inspection, unsuitable angles, placeholders and category corrections. It yields 58 generic-preview candidates and 15 catalogue-only candidates; zero newly approved photographs. Public image URLs are reference metadata, never runtime image loads. Original reference JPEGs, spreadsheet and STEP files are not bundled.

Maintainers with the original research ZIP can reproduce the metadata with Python 3.10 or newer:

```sh
python tests/catalogue_options_check.py
python scripts/import-research-catalogue.py path/to/BikeStyler_Catalogue_Codex_Pack.zip
npm test
npm run build
```

The importer validates the archive's 103 checksums, identities, relationships, category filenames and count conservation. It preserves explicit variant combinations—including 250-variant products—and removes retired generated category shards. Review [catalogue-aliases.json](research/catalogue-aliases.json) and the candidate ledger when updating; unknown or stale aliases fail rather than silently replacing existing records. The [import receipt](research/catalogue-import.json) identifies the source snapshot by SHA-256.

Committed `public/catalogue/` JSON is sufficient to build and run the app; ordinary users do not need Python or the original archive. The interface parses a compact index and requests category details when needed. Cards are paginated at 24, and only reviewed products enter compatibility evaluation. The production service worker downloads all catalogue files (about 14.7 MB before compression) before **Ready offline**, including detail files the interface has not yet opened.

Selected source listings save an optional `listing` snapshot in project version 2: identity, source date/link, category and the selected variant's literal options. It is mutually exclusive with the older `product` selection. Existing project versions 1/2 and version-1 reviewed-product packs remain readable. The whole research catalogue is never copied into a portable project. Older app versions do not understand the new listing provenance; use the current app to retain it fully.
