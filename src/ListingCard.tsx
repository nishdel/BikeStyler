import { useState } from "react";
import type { Part, PartStyle, Project } from "./types";
import { listingForPart, listingSelection, listingVisual, loadListingDetail } from "./researchCatalogue";
import type { ListingDetail, ResearchIndex, SourceListing } from "./researchCatalogue";
import Thumbnail from "./Thumbnail";

export default function ListingCard({listing, index, project, part, onApply}: {
  listing: SourceListing; index: ResearchIndex; project?: Project | null; part?: Part;
  onApply?: (style: PartStyle, part: Part) => void;
}) {
  const [detail, setDetail] = useState<ListingDetail>(), [error, setError] = useState("");
  const [loading, setLoading] = useState(false), [variantId, setVariantId] = useState("");
  const [target, setTarget] = useState("");
  const visual = listingVisual(listing), variant = detail?.variants.find(v => v.id === variantId);
  const eligible = project?.parts.filter(p => listingForPart(listing, p, variant)) || [];
  const selectedPart = part || eligible.find(p => p.id === target) || eligible[0];
  const selected = selectedPart && project?.styles[selectedPart.id]?.listing?.listingId === listing.id;
  const savedVariant = selected && project?.styles[selectedPart!.id]?.listing?.variant;
  async function details() {
    setLoading(true); setError("");
    try { const value = await loadListingDetail(listing); setDetail(value); if (savedVariant && !variantId) setVariantId(savedVariant.id); }
    catch (e) { setError(String(e instanceof Error ? e.message : e)); }
    finally { setLoading(false); }
  }
  return <article className={`product-visual-card source-listing-card ${selected ? "active" : ""}`} data-listing-id={listing.id}>
    {visual ? <Thumbnail entry={visual}/> : <div className="no-preview">Preview unavailable</div>}
    <span className="brand-label">{listing.brand}</span><strong>{listing.name}</strong>
    <small>{visual ? "Generic shape preview" : "Catalogue only"} · Fitment unknown</small>
    <small>{listing.classificationReview === "provisional" ? "Category awaiting review" : "Category reviewed"}</small>
    {detail ? <label className="variant-label">Source variant
      <select aria-label={`${listing.name} source variant`} value={variantId} onChange={e => setVariantId(e.target.value)}>
        <option value="">Any variant · appearance only</option>
        {detail.variants.filter(v => !part || listingForPart(listing, part, v)).map(v => <option key={v.id} value={v.id}>{v.label}{v.available === false ? " · unavailable in source snapshot" : ""}</option>)}
      </select>
    </label> : <button className="variant-button" onClick={() => void details()} disabled={loading}>{loading ? "Loading variants…" : `Choose variant (${listing.variantCount})`}</button>}
    {error && <p role="alert">{error} <button onClick={() => void details()}>Retry</button></p>}
    {!part && eligible.length > 0 && <label>On component<select aria-label={`${listing.name} target component`} value={selectedPart?.id || ""} onChange={e => setTarget(e.target.value)}>{eligible.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>}
    {onApply && visual && <button className="apply-product" disabled={!selectedPart || selectedPart.locked || selectedPart.status !== "confirmed" || !listingForPart(listing, selectedPart, variant)} onClick={() => {
      if (selectedPart) onApply({entryId: visual.id, listing: listingSelection(listing, index, variant || (!detail ? savedVariant || undefined : undefined)), product: undefined, approvedApproximation: true}, selectedPart);
    }}>{selected ? "Apply again" : "Preview on bicycle"}</button>}
    {project && !selectedPart && visual && <small>Set up a matching component to preview this listing.</small>}
    <details><summary>Product reference</summary><p>Source listing dated {index.asOf}. Options and availability describe that snapshot. A generic preview does not reproduce the exact product or prove physical fit.</p>
      {listing.reviewNote && <p>{listing.reviewNote}</p>}
      <a href={listing.productUrl} target="_blank" rel="noreferrer">View source & product photos ↗</a>
      {detail && <p>{detail.images.length} image references; redistribution permission unverified. Reference photographs are not loaded by BikeStyler.</p>}
    </details>
  </article>;
}
