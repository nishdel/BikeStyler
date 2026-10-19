import { supportedProductCategory } from "./productCategories.ts";
import type {
  ProductDataset,
  ProductSelection,
  ProductFact,
} from "./productTypes";
const bad = (message: string): never => {
  throw new Error(`Invalid product data: ${message}`);
};
const obj = (v: unknown): Record<string, unknown> => {
  if (!v || typeof v !== "object" || Array.isArray(v))
    bad("expected an object");
  return v as Record<string, unknown>;
};
const text = (v: unknown, n = 500) => {
  if (typeof v !== "string" || v.length > n) bad("missing or oversized text");
  return v as string;
};
const list = (v: unknown, n = 1000) => {
  if (!Array.isArray(v) || v.length > n) bad("missing or oversized list");
  return v as unknown[];
};
const id = (v: unknown) => {
  const s = text(v, 160);
  if (
    !/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(s) ||
    ["constructor", "prototype", "__proto__"].includes(s)
  )
    bad("unsafe ID");
  return s;
};
function url(v: unknown) {
  const s = text(v, 2000);
  let u: URL;
  try {
    u = new URL(s);
  } catch {
    bad("invalid source URL");
  }
  if (u!.protocol !== "https:" || u!.username || u!.password)
    bad("sources must use public HTTPS URLs");
  return s;
}
function unique(a: string[], label: string) {
  if (new Set(a).size !== a.length) bad(`duplicate ${label} IDs`);
}
export function rejectUnsafeTree(v: unknown, depth = 0) {
  if (depth > 20) bad("nesting limit");
  if (v && typeof v === "object")
    for (const [k, x] of Object.entries(v)) {
      if (["__proto__", "constructor", "prototype"].includes(k))
        bad("unsafe key");
      rejectUnsafeTree(x, depth + 1);
    }
}
export function validateProductDataset(input: unknown): ProductDataset {
  rejectUnsafeTree(input);
  const d = obj(input);
  if (d.version !== 1) bad("unsupported version");
  const sourceIds = list(d.sources, 2000).map((v) => {
    const s = obj(v);
    id(s.id);
    url(s.url);
    text(s.publisher, 160);
    if (!/^\d{4}-\d{2}-\d{2}/.test(text(s.verifiedAt, 50)))
      bad("verification date required");
    text(s.kind, 100);
    text(s.scope, 2000);
    text(s.rights, 2000);
    if (s.notes !== undefined) text(s.notes, 4000);
    return s.id as string;
  });
  unique(sourceIds, "source");
  const sourceSet = new Set(sourceIds);
  const refs = (v: unknown) => {
    for (const ref of list(v, 60))
      if (!sourceSet.has(text(ref, 160))) bad(`unknown source ${String(ref)}`);
  };
  const fact = (v: unknown): ProductFact => {
    const f = obj(v);
    text(f.key, 100);
    if (
      !["number", "boolean", "string"].includes(typeof f.value) ||
      (typeof f.value === "number" && !Number.isFinite(f.value))
    )
      bad("invalid fact");
    if (typeof f.value === "string") text(f.value, 2000);
    if (f.unit !== undefined) text(f.unit, 80);
    text(f.scope, 1000);
    text(f.statement, 4000);
    if (!sourceSet.has(text(f.sourceId, 160))) bad("fact missing source");
    return f as ProductFact;
  };
  const productIds = list(d.products, 2000).map((v) => {
    const p = obj(v);
    id(p.id);
    text(p.brand, 150);
    text(p.model, 200);
    if (!supportedProductCategory(text(p.category, 100))) bad(`unsupported product category ${String(p.category)}`);
    text(p.family, 200);
    list(p.tags, 40).forEach((t) => text(t, 100));
    refs(p.sourceIds);
    if (!list(p.sourceIds).length) bad("product needs evidence");
    if (p.status !== "verified-product")
      bad("candidate cannot be a verified product");
    list(p.facts, 80).forEach(fact);
    const variants = list(p.variants, 150).map((v) => {
      const q = obj(v);
      id(q.id);
      text(q.label, 300);
      refs(q.sourceIds);
      list(q.facts, 80).forEach(fact);
      return q.id as string;
    });
    unique(variants, "variant");
    if (!["unavailable", "reviewed"].includes(text(p.previewStatus, 30)))
      bad("invalid preview status");
    text(p.previewReason, 2000);
    if (p.visualEntryId !== undefined) id(p.visualEntryId);
    if (p.previewStatus === "reviewed" && !p.visualEntryId)
      bad("reviewed preview needs a visual asset");
    return p.id as string;
  });
  unique(productIds, "product");
  const backlogIds = list(d.backlog, 3000).map((v) => {
    const b = obj(v);
    id(b.id);
    text(b.brand, 150);
    text(b.model, 200);
    text(b.category, 100);
    list(b.sourceUrls, 20).forEach(url);
    text(b.reason, 3000);
    return b.id as string;
  });
  unique(backlogIds, "candidate");
  return d as ProductDataset;
}
export function validateProductSelection(v: unknown): ProductSelection {
  const s = obj(v);
  validateProductDataset({
    version: 1,
    sources: s.sources,
    products: [s.product],
    backlog: [],
  });
  if (
    s.variantId !== undefined &&
    !(s.product as ProductSelection["product"]).variants.some(
      (q) => q.id === s.variantId,
    )
  )
    bad("unknown selected variant");
  return s as ProductSelection;
}
export function parseProductPack(json: string) {
  if (json.length > 12 * 1024 * 1024) bad("pack exceeds 12 MB");
  const p = obj(JSON.parse(json));
  if (p.format !== "bikestyler-products") bad("not a product pack");
  return validateProductDataset(p.data);
}
export function mergeProductDatasets(
  a: ProductDataset,
  b: ProductDataset,
): ProductDataset {
  const merge = <T extends { id: string }>(
    left: T[],
    right: T[],
    label: string,
  ) => {
    const map = new Map(left.map((v) => [v.id, v]));
    for (const item of right) {
      const previous = map.get(item.id);
      if (previous && JSON.stringify(previous) !== JSON.stringify(item))
        bad(
          `${label} ${item.id} conflicts with an installed record; keep its ID stable and review the update`,
        );
      map.set(item.id, item);
    }
    return [...map.values()];
  };
  return validateProductDataset({
    version: 1,
    sources: merge(a.sources, b.sources, "source"),
    products: merge(a.products, b.products, "product"),
    backlog: merge(a.backlog, b.backlog, "candidate"),
  });
}
