import { useState } from "react";
import type { Part, PartStyle, Project } from "./types";
import { productDataset } from "./products";
import { matchingSelections, productVisual, selectionFor, productForPart } from "./productVisuals";
import Thumbnail from "./Thumbnail";

export default function ProductVisualPicker({project,part,compatible,onApply,onCatalogue}:{
  project:Project;part:Part;compatible:boolean;onApply:(style:PartStyle)=>void;onCatalogue:()=>void;
}) {
  const [search,setSearch]=useState(''),[variants,setVariants]=useState<Record<string,string>>({}),[limit,setLimit]=useState(12);
  const data=productDataset(project);
  const products=data.products.filter(p=>productForPart(p,part) && `${p.brand} ${p.model} ${p.tags.join(' ')}`.toLowerCase().includes(search.toLowerCase()))
    .map(product=>({product,visual:productVisual(product,project),matches:matchingSelections(product,data,project.bikeMeasurements).filter(s=>productForPart(product,part,s.variantId))}))
    .filter(item=>!compatible||item.matches.length>0)
    .sort((a,b)=>Number(b.visual.kind==='reference')-Number(a.visual.kind==='reference'));
  return <section className="visual-products" aria-label={compatible?'Compatible real parts':'Real parts to visualise'}>
    <p className="hint">{compatible?'Matches your confirmed measurements only; this is not a fit guarantee.':'Try the appearance of a real product. No measurements needed.'}</p>
    <label className="search"><span>⌕</span><input type="search" aria-label="Find real parts" placeholder="Brand or model…" value={search} onChange={e=>{setSearch(e.target.value);setLimit(12)}}/></label>
    {compatible&&<button className="text-button" onClick={onCatalogue}>Edit measurements in the catalogue ↗</button>}
    <p className="result-count" aria-live="polite">{products.length} {compatible?'matching':'available'} {products.length===1?'product':'products'}</p>
    <div className="product-visual-grid">
      {products.slice(0,limit).map(({product,visual,matches})=>{
        const selected=project.styles[part.id]?.product?.product.id===product.id;
        const savedVariant=variants[product.id]??(selected?project.styles[part.id]?.product?.variantId:undefined);
        const variantId=compatible?(matches.find(s=>s.variantId===savedVariant)||matches[0])?.variantId:savedVariant;
        const options=product.variants.filter(v=>productForPart(product,part,v.id)&&(!compatible||matches.some(s=>s.variantId===v.id)));
        return <article className={`product-visual-card ${selected?'active':''}`} key={product.id}>
          {visual.entry&&<Thumbnail entry={visual.entry}/>}
          <span className="brand-label">{product.brand}</span><strong>{product.model}</strong>
          <small>{visual.kind==='reference'?'Reference-based cutout · approximate':visual.kind==='generic'?'Generic shape preview':'No visual asset yet'}</small>
          {options.length>0&&<select aria-label={`${product.model} variant`} value={variantId||''} onChange={e=>setVariants({...variants,[product.id]:e.target.value})}>
            {!compatible&&<option value="">Any variant · appearance only</option>}{options.map(v=><option value={v.id} key={v.id}>{v.label}</option>)}
          </select>}
          <button className="apply-product" disabled={!visual.entry||part.locked||part.status!=='confirmed'} onClick={()=>onApply({entryId:visual.entry!.id,product:selectionFor(product,data,variantId),approvedApproximation:true})}>
            {selected?'Apply again':'Preview on bicycle'}
          </button>
          <details><summary>Product reference</summary><p>{visual.kind==='reference'?'A prepared image based on product references; fine details may differ.':'This product currently uses a generic shape proxy, not a model-specific image.'}</p><a href={data.sources.find(s=>product.sourceIds.includes(s.id))?.url} target="_blank" rel="noreferrer">View source & product photos ↗</a></details>
        </article>;
      })}
    </div>
    {!products.length&&<div className="empty-state"><p>{compatible?'No verified matches yet. Add confirmed measurements in the catalogue, or explore all real parts for appearance.':'No matching products in this category. Try a different search.'}</p></div>}
    {products.length>limit&&<button onClick={()=>setLimit(limit+12)}>Show more real parts</button>}
  </section>;
}
