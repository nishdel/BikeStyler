import { useEffect, useState } from "react";
import { CATALOGUE } from "./catalogue";
import type { CatalogueEntry, Category, Part } from "./types";

export type SourceListing = {
  id: string; name: string; brand: string; category: string;
  visualCategory: Category | null; publisherId: string; productUrl: string;
  variantCount: number; imageCount: number; classificationReview: "reviewed" | "provisional";
  reviewedProductId?: string;
  reviewNote?: string;
};
export type SourceVariant = { id: string; label: string; options: Record<string, string | number>; available: boolean; imageId?: string | null };
export type ListingDetail = {
  id: string; checkedOn: string; sourceUrl: string; compatibility: "unknown";
  variants: SourceVariant[]; images: {id: string; url: string; license: string; redistributionAllowed: boolean; contentStatus: string}[];
};
export type ListingSelection = {
  version: 1; catalogueId: string; listingId: string; name: string; brand: string;
  category: Category; productUrl: string; asOf: string; compatibility: "unknown";
  classificationReview: "reviewed" | "provisional";
  variant?: { id: string; label: string; options: Record<string, string | number>; available: boolean };
};
export type ResearchIndex = {
  version: 1; catalogueId: string; asOf: string; listings: SourceListing[];
  counts: Record<string, number>; categories: {id: string; name: string; visualCategory: Category | null}[];
};
let indexRequest: Promise<ResearchIndex> | undefined;
const detailRequests = new Map<string, Promise<Record<string, ListingDetail>>>();
async function localJSON<T>(path: string): Promise<T> {
  const response = await fetch(path);
  if (!response.ok) throw new Error("Catalogue files are unavailable. Retry when the local app is running.");
  return response.json() as Promise<T>;
}
export function loadResearchIndex() {
  return indexRequest ||= localJSON<ResearchIndex>("/catalogue/index.json").catch(error => { indexRequest = undefined; throw error; });
}
export function useResearchIndex(enabled = true) {
  const [index, setIndex] = useState<ResearchIndex>(), [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    setError("");
    loadResearchIndex().then(data => { if (alive) setIndex(data); }).catch(e => { if (alive) setError(String(e.message)); });
    return () => { alive = false; };
  }, [enabled, retry]);
  return {index, error, retry: () => setRetry(n => n + 1)};
}
export async function loadListingDetail(listing: SourceListing) {
  if (!/^[a-z_]+$/.test(listing.category)) throw new Error("Invalid catalogue category");
  let request = detailRequests.get(listing.category);
  if (!request) {
    request = localJSON<Record<string, ListingDetail>>(`/catalogue/details/${listing.category}.json`).catch(error => { detailRequests.delete(listing.category); throw error; });
    detailRequests.set(listing.category, request);
  }
  const detail = (await request)[listing.id];
  if (!detail || detail.id !== listing.id) throw new Error("Listing details are unavailable");
  return detail;
}
const genericEntries = new Map<Category, CatalogueEntry>();
for (const entry of CATALOGUE) if (!entry.asset && !genericEntries.has(entry.category)) genericEntries.set(entry.category, entry);
export const listingVisual = (listing: Pick<SourceListing, "visualCategory">) => listing.visualCategory ? genericEntries.get(listing.visualCategory) : undefined;
export function listingForPart(listing: SourceListing, part: Part, variant?: SourceVariant) {
  if (listing.visualCategory !== part.category || !listingVisual(listing)) return false;
  if (part.category !== "wheels") return true;
  const words = `${listing.name} ${variant?.label || ""}`.toLowerCase();
  if (/\bfront\b/.test(words) && !/\brear\b/.test(words) && part.id.startsWith("rear")) return false;
  if (/\brear\b/.test(words) && !/\bfront\b/.test(words) && part.id.startsWith("front")) return false;
  return true;
}
export function listingSelection(listing: SourceListing, index: ResearchIndex, variant?: SourceVariant): ListingSelection {
  if (!listing.visualCategory) throw new Error("No supported visualization category");
  return {version: 1, catalogueId: index.catalogueId, listingId: listing.id, name: listing.name, brand: listing.brand,
    category: listing.visualCategory, productUrl: listing.productUrl, asOf: index.asOf, compatibility: "unknown",
    classificationReview: listing.classificationReview,
    ...(variant ? {variant: {id: variant.id, label: variant.label, options: variant.options, available: variant.available}} : {})};
}
export function searchListings(listings: SourceListing[], query: string, category = "all", brand = "all") {
  const terms = query.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
  return listings.filter(l => (category === "all" || l.category === category || l.visualCategory === category) &&
    (brand === "all" || l.brand === brand) && terms.every(t => `${l.brand} ${l.name} ${l.category}`.toLocaleLowerCase().includes(t)));
}
