import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { listingForPart, listingSelection, listingVisual, searchListings } from "../src/researchCatalogue";
import type { ResearchIndex, ListingDetail } from "../src/researchCatalogue";
import { parseProject } from "../src/validation";
import { PRODUCT_DATA } from "../src/products";
import type { Project } from "../src/types";
const index = JSON.parse(readFileSync("public/catalogue/index.json", "utf8")) as ResearchIndex;
const details = Object.assign({}, ...readdirSync("public/catalogue/details").map(f => JSON.parse(readFileSync(`public/catalogue/details/${f}`, "utf8")))) as Record<string, ListingDetail>;
const sample = () => JSON.parse(readFileSync("public/sample/champagne.bike.json", "utf8")) as Project;

describe("research catalogue boundaries", () => {
  it("retains each source identity, variant and image reference exactly once", () => {
    expect(index.listings).toHaveLength(4454);
    expect(new Set(index.listings.map(l => l.id)).size).toBe(4454);
    const variants = Object.values(details).flatMap(d => d.variants), images = Object.values(details).flatMap(d => d.images);
    expect(variants).toHaveLength(24070); expect(new Set(variants.map(v => v.id)).size).toBe(24070);
    expect(images).toHaveLength(22534); expect(new Set(images.map(i => i.id)).size).toBe(22534);
    expect(Math.max(...Object.values(details).map(d => d.variants.length))).toBe(250);
    for(const l of index.listings) {expect(details[l.id].variants).toHaveLength(l.variantCount);expect(details[l.id].images).toHaveLength(l.imageCount);expect(details[l.id].compatibility).toBe("unknown");}
    expect(images.every(i => i.redistributionAllowed === false)).toBe(true);
  });
  it("preserves reviewed data and groups exact aliases without promoting source variants", () => {
    expect(PRODUCT_DATA.products).toHaveLength(100);
    expect(PRODUCT_DATA.products.reduce((n,p)=>n+p.variants.length,0)).toBe(68);
    const aliases=index.listings.filter(l=>l.reviewedProductId);
    expect(aliases).toHaveLength(9);
    for(const l of aliases) {expect(PRODUCT_DATA.products.some(p=>p.id===l.reviewedProductId)).toBe(true);expect(details[l.id].compatibility).toBe("unknown");}
  });
  it("prevents misleading helmet and accessory previews and preserves searchable records", () => {
    const helmet=searchListings(index.listings,"Cinelli Kask Protone Icon Blu")[0];
    expect(helmet.category).toBe("out_of_scope"); expect(listingVisual(helmet)).toBeUndefined();
    expect(index.listings.find(l=>l.name==="Bar Mount Dropper Remote Lever")?.visualCategory).toBeNull();
    expect(searchListings(index.listings,"panaracer gravelking").length).toBeGreaterThan(0);
  });
  it("round-trips a small provenance snapshot and rejects forged compatibility or mixed selections", () => {
    const p=sample(), l=index.listings.find(l=>l.visualCategory==="saddles"&&!l.reviewedProductId)!;
    const entry=listingVisual(l)!;
    p.styles.saddle={entryId:entry.id,listing:listingSelection(l,index,details[l.id].variants[0]),approvedApproximation:true};
    const saved=parseProject(JSON.stringify(p));
    expect(saved.styles.saddle.listing).toEqual(p.styles.saddle.listing);
    expect(JSON.stringify(saved.styles.saddle.listing).length).toBeLessThan(3000);
    const fake=JSON.parse(JSON.stringify(p)); fake.styles.saddle.listing.compatibility="matches";
    expect(()=>parseProject(JSON.stringify(fake))).toThrow();
    fake.styles.saddle.listing.compatibility="unknown"; fake.styles.saddle.listing.category="wheels";
    expect(()=>parseProject(JSON.stringify(fake))).toThrow();
    p.styles.saddle.product=sample().styles.saddle.product;
    expect(()=>parseProject(JSON.stringify(p))).toThrow();
  });
  it("respects front/rear wheel placement and rejects non-public selection URLs", () => {
    const p=sample(), front=p.parts.find(p=>p.id==="front-wheel")!, rear=p.parts.find(p=>p.id==="rear-wheel")!;
    const l=index.listings.find(l=>l.visualCategory==="wheels"&&/\bFront\b/.test(l.name)&&!/\bRear\b/.test(l.name))!;
    expect(listingForPart(l,front)).toBe(true);expect(listingForPart(l,rear)).toBe(false);
    const saddle=index.listings.find(l=>l.visualCategory==="saddles")!;
    for(const productUrl of ["javascript:alert(1)","https://localhost/private","https://127.0.0.1/private","https://user:secret@example.com/"]) {
      p.styles.saddle={entryId:listingVisual(saddle)!.id,listing:{...listingSelection(saddle,index),productUrl}};
      expect(()=>parseProject(JSON.stringify(p))).toThrow();
    }
  });
});
