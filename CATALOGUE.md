# Catalogue and asset extension

The catalogue has two independent layers: real-product metadata and appearance assets. A verified product record is not an exact photographic preview or a fit guarantee.

Current inventory: 100 real products, 68 nested documented variants, 103 source records and 117 unfinished candidates. Visual inventory: 211 styles in 35 populated categories, comprising 207 deterministic drawings, one generic generated lever style and three generated product-reference styles. The generic total is 208. Four real products map to the three reference styles. Exact manufacturer-photo previews: zero.

## Add product facts

1. Read [productTypes.ts](src/productTypes.ts) and [products.schema.json](schemas/products.schema.json). Use stable IDs, category IDs, source URLs, review dates and explicit fact status.
2. Add reviewed metadata to [verified-products.json](research/verified-products.json) or [product-visual-expansion.json](research/product-visual-expansion.json). Keep unknown facts unknown. Put incomplete research in the backlog rather than inventing facts or dimensions.
3. Run `npm run catalogue:build`. It validates and merges the inputs, writes [products.generated.json](src/products.generated.json) and refreshes [coverage-report.json](research/coverage-report.json). Run unit checks and review the generated diff.
4. Map an approved visual in [productVisuals.ts](src/productVisuals.ts). Check variant choices, persistence and the displayed generic/reference label. Do not label a generated image as a manufacturer photograph.

## Add an appearance asset

Use the [catalogue schema](schemas/catalogue.schema.json) and existing entries as examples. Supply stable category/renderer IDs, attachment anchors, provenance, licence/permission, limitations and `visualOrigin`. Set `embeddingAllowed` only when project redistribution is permitted.

For raster parts, prepare a clean transparent PNG or WebP with real alpha openings, no background/checkerboard, and an angle close to the expected side photograph. Keep enough resolution for placement and inspect the result on white and grey. Strip identifying metadata before committing. Record reference links separately from image redistribution permission. Do not include manufacturer source photographs without appropriate permission.

Define the mount point in the asset's own coordinate system; check saddle rails, spindle position and wheel axle/rim bounds. Use [rasterParts.ts](src/rasterParts.ts) and the existing photographic entries for crop, lighting and wheel-plane parameters. Test both sides and foreground overlap. A generated reference should remain visibly labelled even if it looks photographic.

Imported custom assets belong to the user's local project. Publishing an example or screenshot requires a separate rights and privacy review. [Asset ledger](docs/ASSETS.md).
