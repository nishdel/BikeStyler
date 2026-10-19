import { useEffect, useMemo, useState } from "react";
import type { Part, Project } from "./types";
import type {
  Product,
  ProductSelection,
  BikeMeasurement,
} from "./productTypes";
import { productDataset, productCategory } from "./products";
import { checkCompatibility, MEASUREMENT_FIELDS } from "./compatibility";
import { mergeProductDatasets, parseProductPack } from "./productValidation";
import { download } from "./images";
import { CATEGORIES } from "./types";
import { matchingSelections, productVisual, selectionFor, productForPart } from "./productVisuals";
import Thumbnail from "./Thumbnail";
const filterMemory = new Map<
  string,
  { search: string; category: string; brand: string; page: number }
>();

export default function ProductBrowser({
  project: p,
  part,
  onChange,
  notify,
  onPreview,
}: {
  project: Project | null;
  part?: Part;
  onChange: (p: Project) => void;
  notify: (message: string) => void;
  onPreview?: () => void;
}) {
  const filterKey = `${p?.id || "library"}:${part?.id || "all"}`,
    saved = filterMemory.get(filterKey);
  const data = productDataset(p || undefined),
    [search, setSearch] = useState(saved?.search || ""),
    [category, setCategory] = useState(
      saved?.category || part?.category || "all",
    ),
    [brand, setBrand] = useState(saved?.brand || "all"),
    [selected, setSelected] = useState<Product>(),
    [variant, setVariant] = useState(""),
    [target, setTarget] = useState(part?.id || ""),
    [page, setPage] = useState(saved?.page || 1),
    [compatibleOnly,setCompatibleOnly] = useState(false);
  useEffect(() => {
    filterMemory.set(filterKey, { search, category, brand, page });
    if (filterMemory.size > 200)
      filterMemory.delete(filterMemory.keys().next().value!);
  }, [filterKey, search, category, brand, page]);
  const products = useMemo(
    () =>
      data.products.filter(
        (product) =>
          (category === "all" ||
            productCategory(product.category) === category) &&
          (brand === "all" || product.brand === brand) &&
          (!compatibleOnly || matchingSelections(product,data,p?.bikeMeasurements).length>0) &&
          `${product.brand} ${product.model} ${product.family} ${product.tags.join(" ")}`
            .toLowerCase()
            .includes(search.toLowerCase()),
      ),
    [data, category, brand, search,compatibleOnly,p?.bikeMeasurements],
  );
  const selection: ProductSelection | undefined = selected
    ? {
        product: selected,
        variantId: variant || undefined,
        sources: data.sources.filter(
          (source) =>
            selected.sourceIds.includes(source.id) ||
            selected.variants.some((v) => v.sourceIds.includes(source.id)) ||
            [
              ...selected.facts,
              ...selected.variants.flatMap((v) => v.facts),
            ].some((f) => f.sourceId === source.id),
        ),
      }
    : undefined;
  const fit = selection
    ? checkCompatibility(selection, p?.bikeMeasurements)
    : undefined;
  const current = part && p?.styles[part.id]?.product;
  const eligibleVariants = selected ? matchingSelections(selected,data,p?.bikeMeasurements).map(s=>s.variantId) : [];
  useEffect(() => {
    if (!compatibleOnly || !selected) return;
    if (!eligibleVariants.length) setSelected(undefined);
    else if (!eligibleVariants.includes(variant || undefined)) setVariant(eligibleVariants[0] || "");
  }, [compatibleOnly,selected,variant,p?.bikeMeasurements]);
  async function importPack(file: File) {
    try {
      if (!p)
        throw Error("Open a bicycle first to keep an imported product pack.");
      if (file.size > 12 * 1024 * 1024)
        throw Error("Product packs must be 12 MB or smaller.");
      const incoming = parseProductPack(await file.text());
      mergeProductDatasets(data, incoming);
      const merged = mergeProductDatasets(
        p.productCatalogue || {
          version: 1,
          sources: [],
          products: [],
          backlog: [],
        },
        incoming,
      );
      onChange({ ...p, productCatalogue: merged });
      notify(
        `Product pack validated: ${incoming.products.length} records. Existing identities were preserved.`,
      );
    } catch (e) {
      notify(String(e));
    }
  }
  function choose(product: Product) {
    setSelected(product);
    setVariant(
      current?.product.id === product.id ? current.variantId || "" : compatibleOnly ? matchingSelections(product,data,p?.bikeMeasurements)[0]?.variantId || "" : "",
    );
    setTarget(
      part && productForPart(product,part) ? part.id : p?.parts.find(t=>productForPart(product,t)&&!t.locked&&t.status==='confirmed')?.id || "",
    );
    requestAnimationFrame(() =>
      document
        .querySelector(".panel-scroll,.catalogue-products")
        ?.scrollTo({ top: 0 }),
    );
  }
  return (
    <section
      className={`product-browser ${selected ? "has-selection" : ""}`}
      aria-label="Sourced products"
    >
      <div className="product-intro">
        <span className="eyebrow">REAL PRODUCTS & FIT</span>
        <h3>Your parts catalogue.</h3>
        <p>
          {data.products.length} models / families ·{" "}
          {data.products.reduce((sum, x) => sum + x.variants.length, 0)}{" "}
          documented variants. Browse freely, or use known measurements to
          narrow the choices. Appearance previews are available in Visual styles.
        </p>
      </div>
      {p && <Measurements project={p} onChange={onChange} />}
      <label className="compatible-toggle"><input type="checkbox" checked={compatibleOnly} onChange={e=>{setCompatibleOnly(e.target.checked);setPage(1)}}/>Only compatible with my recorded measurements</label>
      {compatibleOnly&&<p className="hint">Only verified matches are shown. Unknown or conflicting measurements are excluded. Matching these checks is not a complete fit guarantee.</p>}
      {current && (
        <div className="selected-product">
          <strong>
            Selected: {current.product.brand} {current.product.model}
          </strong>
          <span>{checkCompatibility(current, p?.bikeMeasurements).status}</span>
          <button onClick={() => choose(current.product)}>
            Review selection
          </button>
          <button
            onClick={() =>
              p &&
              onChange({
                ...p,
                styles: {
                  ...p.styles,
                  [part!.id]: { ...p.styles[part!.id], product: undefined },
                },
              })
            }
          >
            Remove selection
          </button>
        </div>
      )}
      <div className="product-filters">
        <label>
          Search products
          <input
            type="search"
            value={search}
            placeholder="Brand, model or riding style"
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </label>
        <label>
          Category
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">All categories</option>
            {CATEGORIES.filter((c) =>
              data.products.some(
                (product) => productCategory(product.category) === c.id,
              ),
            ).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Brand
          <select
            value={brand}
            onChange={(e) => {
              setBrand(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">All brands</option>
            {[...new Set(data.products.map((x) => x.brand))].sort().map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
      </div>
      <p className="result-count" aria-live="polite">
        {products.length} {compatibleOnly?'matching':'sourced'}{" "}
        {products.length === 1 ? "product" : "products"}
      </p>
      <div className="product-results">
        {products.slice((page - 1) * 24, page * 24).map((product) => (
          <button
            key={product.id}
            className={`product-card ${selected?.id === product.id ? "chosen" : ""}`}
            onClick={() => choose(product)}
          >
            {productVisual(product,p).entry&&<Thumbnail entry={productVisual(product,p).entry!}/>}
            <span className="brand-label">{product.brand}</span>
            <strong>{product.model}</strong>
            <span>{product.family}</span>
            <small>
              {product.variants.length
                ? `${product.variants.length} documented variants`
                : "Variant details not recorded"}{" "}
              · {productVisual(product,p).kind==='reference'?'Reference-based cutout':'Generic shape preview'}
            </small>
          </button>
        ))}
      </div>
      {!products.length && (
        <p className="empty-state">
          {compatibleOnly?'No verified matches for the measurements entered. Add or review measurements, or turn off the compatibility filter to browse all products.':'No matching records. Clear the search or choose another category.'}
        </p>
      )}
      {page > 1 && <button onClick={() => setPage(page - 1)}>Previous page</button>}
      {products.length > page * 24 && (
        <button onClick={() => setPage(page + 1)}>Show 24 more</button>
      )}
      {selected && selection && fit && (
        <article className="product-detail" aria-label="Product details">
          <div className="section-label">
            <h3>
              {selected.brand} {selected.model}
            </h3>
            <button
              aria-label="Close product details"
              onClick={() => setSelected(undefined)}
            >
              ×
            </button>
          </div>
          <p className="visual-disclosure">
            {productVisual(selected,p).kind==='reference'?'Reference-based cutout — generated appearance approximation.':'Generic shape preview — a model-specific image is not yet available.'}
            {" "}Visualisation only; appearance does not prove physical fit.
          </p>
          {!!selected.variants.length && (
            <label>
              Documented variant
              <select
                value={variant}
                onChange={(e) => setVariant(e.target.value)}
              >
                {!compatibleOnly && <option value="">Select a variant…</option>}
                {selected.variants.filter(v=>!compatibleOnly||eligibleVariants.includes(v.id)).map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.label}
                  </option>
                ))}
              </select>
            </label>
          )}
          <div
            className={`fit-status ${fit.status === "Does not match" ? "mismatch" : ""}`}
          >
            <strong>{fit.status}</strong>
            <details><summary>Measurements checked</summary>
            {fit.checks.map((check) => (
              <p key={check.field}>
                <b>{check.label}: </b>
                {check.reason}
              </p>
            ))}
            <small>{fit.scope}</small>
            </details>
          </div>
          <details>
            <summary>Specifications & evidence</summary>
            <dl className="product-facts">
              {[
                ...selected.facts,
                ...(selected.variants.find((v) => v.id === variant)?.facts ||
                  []),
              ].map((fact, i) => (
                <div key={i}>
                  <dt>{fact.key.replace(/([A-Z])/g, " $1")}</dt>
                  <dd>
                    {String(fact.value)} {fact.unit || ""}
                    <small>
                      {fact.scope} · {fact.statement}
                    </small>
                    <a
                      href={
                        selection.sources.find((s) => s.id === fact.sourceId)
                          ?.url
                      }
                      target="_blank"
                      rel="noreferrer"
                    >
                      Source ↗
                    </a>
                  </dd>
                </div>
              ))}
            </dl>
          </details>
          <details>
            <summary>Sources & permitted image use</summary>
            {selection.sources.map((source) => (
              <p key={source.id}>
                <a href={source.url} target="_blank" rel="noreferrer">
                  {source.publisher} · {source.scope} ↗
                </a>
                <small>
                  Verified {source.verifiedAt}. {source.rights} {source.notes}
                </small>
              </p>
            ))}
          </details>
          {p && (
            <>
              <label>
                Preview on component
                <select
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                >
                  <option value="">Choose a component…</option>
                  {p.parts
                    .filter(
                      (t) => productForPart(selected,t,variant),
                    )
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                </select>
              </label>
              {!p.parts.some(
                (t) => t.category === productCategory(selected.category),
              ) && (
                <p className="hint">
                  Add a component in Refine setup with category{" "}
                  {CATEGORIES.find(
                    (c) => c.id === productCategory(selected.category),
                  )?.name || selected.category}{" "}
                  first.
                </p>
              )}
              <button
                className="primary"
                disabled={
                  !target || !productForPart(selected,p.parts.find(t=>t.id===target)!,variant) || p.parts.find((t) => t.id === target)?.locked || p.parts.find((t)=>t.id===target)?.status!=='confirmed' || !productVisual(selected,p).entry || (compatibleOnly && fit.status!=="Matches recorded requirements")
                }
                onClick={() => {
                  const entry=productVisual(selected,p).entry,part=p.parts.find(t=>t.id===target);
                  if(!entry||!part)return;
                  if(['wheels','rims','spokes'].includes(part.category)&&!['frame','fork'].every(id=>p.parts.find(t=>t.id===id)?.status==='confirmed')){notify('Confirm the frame and fork masks before replacing wheels.');return;}
                  const styles={...p.styles};
                  if(part.wheel){const side=part.id.startsWith('front')?'front':'rear';if(part.category==='wheels')for(const suffix of ['rim','spokes','hub'])delete styles[`${side}-${suffix}`];else if(['rims','spokes','hubs'].includes(part.category))delete styles[`${side}-wheel`];}
                  onChange({
                    ...p,
                    styles: {
                      ...styles,
                      [target]: { ...p.styles[target], listing:undefined, product: selectionFor(selected,data,variant),entryId:entry.id,approvedApproximation:true },
                    },
                  });
                  notify(
                    "Product preview applied. Appearance does not establish physical fit.",
                  );
                  onPreview?.();
                }}
              >
                Preview on bicycle
              </button>
            </>
          )}
        </article>
      )}
      <details className="product-packs">
        <summary>Local product packs & coverage</summary>
        <p>
          {data.products.length} sourced models ·{" "}
          {data.products.reduce((n, x) => n + x.variants.length, 0)} variants ·{" "}
          {data.products.filter((x) => x.previewStatus === "reviewed").length}{" "}
          reviewed product images · {data.backlog.length} research candidates.
          Candidates are excluded from selectable products.
        </p>
        <div className="button-row">
          <label className="file-button">
            Import product pack
            <input
              type="file"
              accept=".json"
              onChange={(e) => {
                if (e.target.files?.[0]) void importPack(e.target.files[0]);
                e.target.value = "";
              }}
            />
          </label>
          <button
            onClick={() =>
              download(
                "bikestyler-products.json",
                new Blob(
                  [JSON.stringify({ format: "bikestyler-products", data })],
                  { type: "application/json" },
                ),
              )
            }
          >
            Export product pack
          </button>
        </div>
      </details>
    </section>
  );
}

function Measurements({
  project: p,
  onChange,
}: {
  project: Project;
  onChange: (p: Project) => void;
}) {
  const [opened,setOpened] = useState(() => !window.matchMedia('(max-width:640px)').matches);
  const [field, setField] = useState<string>("barClampDiameter"),
    [value, setValue] = useState(""),
    [status, setStatus] = useState<BikeMeasurement["status"]>("confirmed"),
    [evidence, setEvidence] = useState("");
  const descriptor = MEASUREMENT_FIELDS.find((f) => f[0] === field)!;
  return (
    <details className="measurement-disclosure" open={opened} onToggle={e=>setOpened(e.currentTarget.open)}><summary>Optional bicycle measurements</summary>
    <section className="measurements catalogue-measurements" aria-label="My bicycle measurements">
      <h3>My bicycle measurements</h3>
      <p>
        Optional. Enter values you know to filter the catalogue. Leave unknown
        values empty; the picture is not a measurement.
      </p>
      <details><summary>{Object.keys(p.bikeMeasurements||{}).length} saved measurements</summary>
      <ul>
        {Object.entries(p.bikeMeasurements || {}).map(([key, m]) => (
          <li key={key}>
            <strong>
              {MEASUREMENT_FIELDS.find((f) => f[0] === key)?.[1] || key}:{" "}
              {String(m.value)} {m.unit}
            </strong>
            <span>
              {m.status} · {m.evidence}
            </span>
            <button
              onClick={() => {
                setField(key);
                setValue(String(m.value));
                setStatus(m.status);
                setEvidence(m.evidence);
              }}
            >
              Edit
            </button>
            <button
              aria-label={`Remove ${key} measurement`}
              onClick={() => {
                const next = { ...p.bikeMeasurements };
                delete next[key];
                onChange({ ...p, bikeMeasurements: next });
              }}
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
      </details>
      <div className="measurement-entry">
      <label>
        Measurement
        <select
          value={field}
          onChange={(e) => {
            setField(e.target.value);
            setValue("");
            setEvidence("");
            setStatus("confirmed");
          }}
        >
          {MEASUREMENT_FIELDS.map(([key, label, unit]) => (
            <option key={key} value={key}>
              {label}
              {unit ? ` (${unit})` : ""}
            </option>
          ))}
        </select>
      </label>
      <label>Value{descriptor[2] && ` (${descriptor[2]})`}<input value={value} onChange={e=>setValue(e.target.value)} maxLength={160}/></label>
      <button disabled={!value.trim() || (Boolean(descriptor[2]) && (!Number.isFinite(Number(value)) || Number(value)<=0))} onClick={()=>{
        onChange({...p,bikeMeasurements:{...p.bikeMeasurements,[field]:{value:descriptor[2]?Number(value):value.trim(),unit:descriptor[2],status,evidence:evidence.trim()||'Entered by the user',recordedAt:new Date().toISOString().slice(0,10)}}});
        setValue('');setEvidence('');
      }}>Save known value</button>
      </div>
      <details><summary>Add a note or mark this value uncertain</summary>
      <label>
        Evidence
        <input
          value={evidence}
          onChange={(e) => setEvidence(e.target.value)}
          placeholder="How and where was this measured?"
          maxLength={500}
        />
      </label>
      <label>
        Confidence
        <select
          value={status}
          onChange={(e) =>
            setStatus(e.target.value as BikeMeasurement["status"])
          }
        >
          <option value="provisional">Provisional</option>
          <option value="confirmed">Confirmed measurement</option>
          <option value="conflicting">Conflicting evidence</option>
        </select>
      </label>
      </details>
    </section></details>
  );
}
