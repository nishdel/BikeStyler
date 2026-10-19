import { CATALOGUE } from "./catalogue";
import { productCategory } from "./productCategories";
import { checkCompatibility } from "./compatibility";
import type { Product, ProductDataset, ProductSelection, BikeMeasurement } from "./productTypes";
import type { CatalogueEntry, Part, Project } from "./types";

/** Reviewed image associations live separately from immutable sourced records. */
export const PRODUCT_VISUAL_IDS: Record<string, string> = {
  "vintage-brooks-england-b17": "photo-brooks-b17",
  "vintage-ene-ciclo-dia-compe-chain-wheel-double": "photo-ene-ciclo-double",
  "velo-orange-enterprise-front-wheel": "photo-velo-orange-enterprise",
  "velo-orange-enterprise-rear-wheel-130": "photo-velo-orange-enterprise",
};

export function selectionFor(product: Product, data: ProductDataset, variantId?: string): ProductSelection {
  const ids = new Set([...product.sourceIds, ...product.facts.map(f => f.sourceId), ...product.variants.flatMap(v => [...v.sourceIds, ...v.facts.map(f => f.sourceId)])]);
  return { product, variantId: variantId || undefined, sources: data.sources.filter(s => ids.has(s.id)) };
}

export function matchingSelections(product: Product, data: ProductDataset, measurements: Record<string, BikeMeasurement> = {}) {
  const variants = product.variants.length ? product.variants.map(v => v.id) : [undefined];
  return variants.map(id => selectionFor(product, data, id)).filter(s => checkCompatibility(s, measurements).status === "Matches recorded requirements");
}

export function productForPart(product:Product,part:Part,variantId?:string) {
  if(productCategory(product.category)!==part.category)return false;
  if(!part.wheel||part.category!=='wheels')return true;
  const label=`${product.model} ${product.tags.join(' ')} ${product.variants.find(v=>v.id===variantId)?.label||''}`.toLowerCase();
  if(/\bfront\b/.test(label)&&!/\brear\b/.test(label)&&part.id.startsWith('rear'))return false;
  if(/\brear\b/.test(label)&&!/\bfront\b/.test(label)&&part.id.startsWith('front'))return false;
  return true;
}

export function productVisual(product: Product, project?: Project | null): {entry?: CatalogueEntry; kind: "reference" | "generic" | "unavailable"} {
  const entries = [...new Map([...CATALOGUE, ...(project?.customEntries || [])].map(e => [e.id, e])).values()];
  const category = productCategory(product.category);
  const id = product.visualEntryId || PRODUCT_VISUAL_IDS[product.id];
  const reference = entries.find(e => e.id === id && e.category === category);
  if (reference) return {entry: reference, kind: "reference"};
  // A clearly labelled shape proxy keeps every supported product selectable.
  // It never becomes an exact-product photograph or compatibility evidence.
  const candidates = entries.filter(e => e.category === category && !e.asset);
  const words = `${product.model} ${product.family} ${product.tags.join(' ')}`.toLowerCase();
  const preferred = candidates.find(e => {
    const form = String(e.parameters.form || '');
    return (words.includes('leather') && form === 'leather') ||
      (words.includes('gravel') && /gravel|touring/.test(e.name.toLowerCase())) ||
      (words.includes('carbon') && /carbon|deep/.test(e.name.toLowerCase()));
  });
  const entry = preferred || candidates[0];
  return {entry, kind: entry ? "generic" : "unavailable"};
}
