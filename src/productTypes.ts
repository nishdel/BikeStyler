export type ProductSource = {
  id: string;
  url: string;
  publisher: string;
  verifiedAt: string;
  kind: string;
  scope: string;
  rights: string;
  notes?: string;
};
export type ProductFact = {
  key: string;
  value: string | number | boolean;
  unit?: string;
  scope: string;
  sourceId: string;
  statement: string;
};
export type ProductVariant = {
  id: string;
  label: string;
  facts: ProductFact[];
  sourceIds: string[];
};
export type Product = {
  id: string;
  brand: string;
  model: string;
  category: string;
  family: string;
  tags: string[];
  sourceIds: string[];
  status: "verified-product";
  facts: ProductFact[];
  variants: ProductVariant[];
  previewStatus: "unavailable" | "reviewed";
  previewReason: string;
  visualEntryId?: string;
};
export type ResearchCandidate = {
  id: string;
  brand: string;
  model: string;
  category: string;
  sourceUrls: string[];
  reason: string;
};
export type ProductDataset = {
  version: 1;
  sources: ProductSource[];
  products: Product[];
  backlog: ResearchCandidate[];
};
export type ProductSelection = {
  product: Product;
  variantId?: string;
  sources: ProductSource[];
};
export type BikeMeasurement = {
  value: string | number;
  unit?: string;
  status: "confirmed" | "provisional" | "conflicting";
  evidence: string;
  recordedAt: string;
};
