import { useMemo, useState } from "react";
import type { Part, PartStyle, Project } from "./types";
import { searchListings, useResearchIndex } from "./researchCatalogue";
import ListingCard from "./ListingCard";
import CataloguePagination from "./CataloguePagination";

const remembered = {search: "", category: "all", brand: "all", page: 1};
export default function ResearchBrowser({project,onChange,onPreview,notify}: {
  project: Project | null; onChange: (p: Project) => void; onPreview?: () => void; notify: (s: string) => void;
}) {
  const {index,error,retry}=useResearchIndex();
  const [search,setSearch]=useState(remembered.search), [category,setCategory]=useState(remembered.category), [brand,setBrand]=useState(remembered.brand), [page,setPage]=useState(remembered.page);
  const rows=useMemo(()=>index?searchListings(index.listings,search,category,brand):[],[index,search,category,brand]);
  function apply(style: PartStyle,part: Part) {
    if(!project||part.locked||part.status!=='confirmed')return;
    if(['wheels','rims','spokes'].includes(part.category)&&!['frame','fork'].every(id=>project.parts.find(p=>p.id===id)?.status==='confirmed')){notify('Confirm frame and fork masks before replacing wheels.');return;}
    const styles={...project.styles},side=part.id.startsWith('front')?'front':'rear';
    if(part.wheel){if(part.category==='wheels')for(const suffix of ['rim','spokes','hub'])delete styles[`${side}-${suffix}`];else if(['rims','spokes','hubs'].includes(part.category))delete styles[`${side}-wheel`];}
    styles[part.id]={...styles[part.id],...style};
    onChange({...project,styles});notify('Generic preview applied. Fitment remains unknown.');onPreview?.();
  }
  function update(values: Partial<typeof remembered>) {Object.assign(remembered,values);setSearch(remembered.search);setCategory(remembered.category);setBrand(remembered.brand);setPage(remembered.page);}
  return <section className="research-browser" aria-label="Source listings">
    <h3>Explore source listings</h3>
    <p>{index?`${index.counts.listings.toLocaleString()} listings · ${index.counts.variants.toLocaleString()} source variants · ${index.asOf}`:'Loading catalogue…'}</p>
    <p className="hint">Browse appearance ideas. Fitment is unknown; a generic preview is not an exact product image. Use Reviewed products & fit for recorded measurement checks.</p>
    {error&&<p role="alert">{error} <button onClick={retry}>Retry catalogue</button></p>}
    <div className="product-filters">
      <label>Search listings<input type="search" value={search} onChange={e=>update({search:e.target.value,page:1})} placeholder="Brand, product or category"/></label>
      <label>Listing category<select value={category} onChange={e=>update({category:e.target.value,page:1})}><option value="all">All categories</option>{index?.categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
      <label>Listing brand<select value={brand} onChange={e=>update({brand:e.target.value,page:1})}><option value="all">All brands</option>{[...new Set(index?.listings.map(l=>l.brand))].sort().map(b=><option key={b}>{b}</option>)}</select></label>
    </div>
    <p className="result-count" aria-live="polite">{rows.length} source listings</p>
    <div className="research-results">{index&&rows.slice((page-1)*24,page*24).map(l=><ListingCard key={l.id} listing={l} index={index} project={project} onApply={project?apply:undefined}/>)}</div>
    {index&&!rows.length&&<p>No matching listings. Clear search or change the category.</p>}
    <CataloguePagination page={page} total={rows.length} onPage={n=>{update({page:n});document.querySelector('.catalogue-products')?.scrollTo({top:0})}}/>
  </section>;
}
