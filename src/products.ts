import seed from "./products.generated.json";
import type { Project } from "./types";
import type { ProductDataset } from "./productTypes";
import { mergeProductDatasets } from "./productValidation";
export const PRODUCT_DATA = seed as ProductDataset;
export { productCategory } from "./productCategories";
const mergedCache = new WeakMap<ProductDataset, ProductDataset>();
export function productDataset(p?: Project | null) {
  if (!p?.productCatalogue) return PRODUCT_DATA;
  let data = mergedCache.get(p.productCatalogue);
  if (!data) {
    data = mergeProductDatasets(PRODUCT_DATA, p.productCatalogue);
    mergedCache.set(p.productCatalogue, data);
  }
  return data;
}
