import fs from "node:fs/promises";
import { validateProductDataset, mergeProductDatasets } from "../src/productValidation.ts";
const path = process.argv[2] || "research/verified-products.json";
let data = validateProductDataset(
  JSON.parse(await fs.readFile(path, "utf8")),
);
if (!process.argv[2]) {
  const expansion = JSON.parse(await fs.readFile("research/product-visual-expansion.json", "utf8"));
  data = mergeProductDatasets(data, validateProductDataset(expansion));
  const resolved = new Set(expansion.research.resolvedBacklogIds);
  data.backlog = data.backlog.filter(item => !resolved.has(item.id));
}
await fs.writeFile("src/products.generated.json", JSON.stringify(data));
const report = {
  verifiedModels: data.products.length,
  documentedVariants: data.products.reduce((n, p) => n + p.variants.length, 0),
  reviewedRealProductPreviews: data.products.filter(
    (p) => p.previewStatus === "reviewed",
  ).length,
  sources: data.sources.length,
  incompleteCandidates: data.backlog.length,
  categories: Object.fromEntries(
    [...new Set(data.products.map((p) => p.category))]
      .sort()
      .map((category) => [
        category,
        data.products.filter((p) => p.category === category).length,
      ]),
  ),
};
await fs.writeFile(
  "research/coverage-report.json",
  JSON.stringify(report, null, 2),
);
console.log(JSON.stringify(report, null, 2));
