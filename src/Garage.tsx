import ProductVisualPicker from "./ProductVisualPicker";
import { productForPart } from "./productVisuals";
import { useEffect, useRef, useState } from "react";
import type {
  CatalogueEntry,
  Design,
  Part,
  PartStyle,
  Project,
  Decal,
} from "./types";
import { PALETTE } from "./types";
import { CATALOGUE } from "./catalogue";
import { renderPreview, toView, getPartStyleSummary } from "./compositor";
import type { ViewTransform } from "./compositor";
import { readArtwork, uid } from "./images";
import Thumbnail from "./Thumbnail";

type Props = {
  project: Project;
  onChange: (p: Project) => void;
  onSetup: (partId?: string, protection?: boolean) => void;
  notify: (s: string) => void;
  onCatalogue: (mode?: "visual" | "products") => void;
  recordLatency: (ms: number) => void;
};
export default function Garage({
  project: p,
  onChange,
  onSetup,
  notify,
  onCatalogue,
  recordLatency,
}: Props) {
  const [selected, setSelected] = useState("frame"),
    [tab, setTab] = useState<"style" | "decals">("style"),
    [visualMode,setVisualMode] = useState<"styles" | "real" | "compatible">("styles"),
    [hover, setHover] = useState<string>(),
    [markers, setMarkers] = useState(true),
    [clean, setClean] = useState(false),
    [linkWheels, setLinkWheels] = useState(true),
    [linkFrame, setLinkFrame] = useState(false),
    [search, setSearch] = useState(""),
    [visibleCards, setVisibleCards] = useState(36),
    [favourites, setFavourites] = useState(false),
    [tag, setTag] = useState("all"),
    [compare, setCompare] = useState(false),
    [compareA, setCompareA] = useState("original"),
    [compareB, setCompareB] = useState("current"),
    [split, setSplit] = useState(50),
    [designName, setDesignName] = useState(""),
    [transform, setTransform] = useState<ViewTransform>(),
    [latency, setLatency] = useState(0),
    [drawer, setDrawer] = useState(true),
    [expandedSheet, setExpandedSheet] = useState(false),
    [activeDecal, setActiveDecal] = useState<string>(),
    [approx, setApprox] = useState(false);
  const view = useRef<HTMLCanvasElement>(null),
    comparison = useRef<HTMLCanvasElement>(null),
    revision = useRef(0),
    frame = useRef(0),
    fresh = useRef(p),
    editStarted = useRef(0);
  fresh.current = p;
  useEffect(() => setVisibleCards(36), [search, tag, favourites, selected]);
  const part = p.parts.find((t) => t.id === selected) || p.parts[0],
    style = p.styles[part.id] || {},
    entries = [
      ...new Map(
        [...CATALOGUE, ...p.customEntries].map((e) => [e.id, e]),
      ).values(),
    ].filter((e) => e.category === part.category),
    tags = [...new Set(entries.flatMap((e) => e.tags))].filter(
      (t) =>
        !["original", "side-view", "illustrated", part.category].includes(t),
    ),
    filtered = entries.filter(
      (e) =>
        (!favourites || p.favourites.includes(e.id)) &&
        (tag === "all" || e.tags.includes(tag)) &&
        `${e.name} ${e.description} ${e.tags.join(" ")}`
          .toLowerCase()
          .includes(search.toLowerCase()),
    ),
    decal = p.decals.find((d) => d.id === activeDecal);
  const artworkActive = Boolean(
    entries.find((e) => e.id === style.entryId)?.asset,
  );
  const panel = useRef<HTMLDivElement>(null),
    filters = useRef(
      new Map<
        string,
        { search: string; tag: string; favourites: boolean; scroll: number }
      >(),
    );
  function selectPart(id: string) {
    filters.current.set(selected, {
      search,
      tag,
      favourites,
      scroll: panel.current?.scrollTop || 0,
    });
    const kept = filters.current.get(id);
    setSelected(id);
    setSearch(kept?.search || "");
    setTag(kept?.tag || "all");
    setFavourites(kept?.favourites || false);
    setApprox(false);
    requestAnimationFrame(() => {
      if (panel.current) panel.current.scrollTop = kept?.scroll || 0;
    });
  }

  useEffect(() => {
    const token = ++revision.current;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(async () => {
      try {
        const mode = (id: string): "current" | "original" | Design =>
          id === "current"
            ? "current"
            : id === "original"
              ? "original"
              : p.designs.find((d) => d.id === id) || "original";
        // Render off-screen so a stale async result never overwrites the newest selection.
        const off = document.createElement("canvas");
        off.width = 1440;
        off.height = 900;
        const result = await renderPreview(
          p,
          off,
          compare ? mode(compareB) : "current",
          clean ? undefined : hover,
        );
        if (token !== revision.current || !view.current) return;
        view.current.getContext("2d")!.drawImage(off, 0, 0);
        setTransform(result.transform);
        setLatency(result.ms);
        if (!hover && !compare) recordLatency(result.ms);
        if (editStarted.current) {
          const started = editStarted.current;
          editStarted.current = 0;
          requestAnimationFrame(() => {
            const ms = performance.now() - started;
            performance.measure("BikeStyler edit to next frame", {
              start: started,
              end: performance.now(),
            });
            setLatency(ms);
          });
        }
        if (compare && comparison.current) {
          const other = document.createElement("canvas");
          other.width = 1440;
          other.height = 900;
          await renderPreview(p, other, mode(compareA));
          if (token === revision.current)
            comparison.current?.getContext("2d")!.drawImage(other, 0, 0);
        }
      } catch (e) {
        notify(String(e));
      }
    });
    return () => {
      cancelAnimationFrame(frame.current);
    };
  }, [p, hover, compare, compareA, compareB, clean]);
  function setStyle(change: PartStyle, reset = false) {
    if (part.locked) {
      notify(`${part.name} is locked. Unlock it to make changes.`);
      return;
    }
    if (part.status !== "confirmed") {
      notify("Confirm the source mask and attachment in Setup first.");
      return;
    }
    editStarted.current = performance.now();
    const next = { ...p.styles };
    const ids = [part.id];
    if (linkFrame && ["frame", "fork"].includes(part.id))
      ids.push(part.id === "frame" ? "fork" : "frame");
    if (linkWheels && part.wheel && !change.listing && (!change.product || change.product.product.category === "wheelsets")) {
      const peer = part.id.startsWith("front")
        ? part.id.replace("front", "rear")
        : part.id.replace("rear", "front");
      const peerPart = p.parts.find(t => t.id === peer);
      if (!change.product || (peerPart && productForPart(change.product.product, peerPart,change.product.variantId))) ids.push(peer);
    }
    for (const id of ids) {
      const t = p.parts.find((q) => q.id === id);
      if (!t || t.locked || t.status !== "confirmed") continue;
      if (t.wheel && !reset) {
        const side = id.startsWith("front") ? "front" : "rear";
        if (t.category === "wheels")
          for (const suffix of ["rim", "spokes", "hub"])
            delete next[side + "-" + suffix];
        else if (["rims", "spokes", "hubs"].includes(t.category))
          delete next[side + "-wheel"];
      }
      if (reset)
        next[id] = next[id]?.product ? { product: next[id].product } : next[id]?.listing ? {listing: next[id].listing} : {};
      else next[id] = { ...next[id], ...change };
    }
    onChange({ ...p, styles: next });
  }
  function choose(entry: CatalogueEntry) {
    if (
      !["tyres", "rims", "spokes", "hubs", "wheels"].includes(part.category) &&
      !approx &&
      !style.approvedApproximation
    ) {
      notify(
        "Review the hidden-surface limitation and enable the illustrative swap below.",
      );
      return;
    }
    setStyle({
      entryId: entry.id,
      product: undefined,
      listing: undefined,
      approvedApproximation: approx || style.approvedApproximation,
    });
  }
  function saveDesign() {
    if (!designName.trim()) {
      notify("Give this design a name first.");
      return;
    }
    if (p.designs.length >= 40) {
      notify(
        "This project already has 40 designs. Remove a saved design first.",
      );
      return;
    }
    onChange({
      ...p,
      designs: [
        ...p.designs,
        {
          id: uid(),
          name: designName.trim().slice(0, 60),
          styles: structuredClone(p.styles),
          decals: structuredClone(p.decals),
          createdAt: new Date().toISOString(),
        },
      ],
    });
    setDesignName("");
    notify("Named design saved in this browser.");
  }
  function updateDecal(change: Partial<Decal>) {
    onChange({
      ...p,
      decals: p.decals.map((d) =>
        d.id === activeDecal ? { ...d, ...change } : d,
      ),
    });
  }
  function addDecal(kind: Decal["kind"], asset?: string) {
    if (p.decals.length >= 100) {
      notify("A project can contain up to 100 decals.");
      return;
    }
    const target =
      p.parts.find(
        (t) => t.id === part.id && t.mask && t.status === "confirmed",
      ) || p.parts.find((t) => t.id === "frame" && t.status === "confirmed");
    if (!target || target.locked) {
      notify("Select a confirmed, unlocked surface first.");
      return;
    }
    const id = uid();
    onChange({
      ...p,
      decals: [
        ...p.decals,
        {
          id,
          kind,
          text: kind === "number" ? "27" : "ATELIER",
          colour: "#f1e9d6",
          x: target.marker.x,
          y: target.marker.y,
          scale: 1,
          rotation: -25,
          opacity: 1,
          asset,
          partId: target.id,
        },
      ],
    });
    setActiveDecal(id);
  }
  const important = [
    "frame",
    "fork",
    "front-tyre",
    "rear-tyre",
    "tape",
    "saddle",
  ];
  const marked = p.parts.filter(
    (t) =>
      t.status === "confirmed" &&
      (important.includes(t.id) || t.id === part.id),
  );
  const sorted = [...marked].sort((a, b) => a.marker.x - b.marker.x);
  function labelPosition(t: Part) {
    const i = sorted.findIndex((q) => q.id === t.id),
      top = i % 2 === 0;
    const row = sorted.filter((_, j) => (j % 2 === 0) === top);
    const j = row.findIndex((q) => q.id === t.id);
    return {
      x: 200 + (j * 1040) / Math.max(1, row.length - 1),
      y: top ? 100 : 790,
    };
  }
  const wheelMissing =
    ["wheels", "rims", "spokes"].includes(part.category) &&
    !["frame", "fork"].every(
      (id) => p.parts.find((t) => t.id === id)?.status === "confirmed",
    );
  return (
    <main className={`garage ${clean ? "clean-mode" : ""} ${expandedSheet ? "sheet-full" : ""} ${drawer ? "sheet-open" : "sheet-collapsed"}`}>
      <section className="garage-main">
        <div className="workspace-heading">
          <div>
            <span className="eyebrow">YOUR PERSONAL WORKSHOP</span>
            <h1>{p.name}</h1>
          </div>
          <button className="soft-button" onClick={() => onSetup()}>
            ⌘ <span>Refine cut-out</span>
          </button>
        </div>
        {!p.setupAccepted && (
          <div className="setup-banner">
            <span>
              Your photo is ready for setup. Isolate it on white and confirm the
              editable parts.
            </span>
            <button onClick={() => onSetup()}>Continue setup →</button>
          </div>
        )}
        {p.name.includes("practice illustration") && (
          <div className="practice-label">
            PRACTICE BICYCLE{" "}
            <span>
              Original illustration · upload a photo to style your actual bike
            </span>
          </div>
        )}
        {p.sampleCredit && (
          <p className="sample-credit">
            {p.sampleCredit}{" "}
            <a href="/sample/README.md" target="_blank" rel="noreferrer">
              Source & licence
            </a>
          </p>
        )}
        <div className="bike-stage">
          <canvas
            ref={view}
            width="1440"
            height="900"
            aria-label="Bicycle visual preview"
            role="img"
          />
          {compare && (
            <canvas
              className="comparison-canvas"
              ref={comparison}
              width="1440"
              height="900"
              style={{ clipPath: `inset(0 ${100 - split}% 0 0)` }}
              aria-label="Comparison bicycle"
              role="img"
            />
          )}
          {!compare && markers && !clean && transform && (
            <svg
              className="marker-lines"
              viewBox="0 0 1440 900"
              aria-hidden="true"
            >
              {sorted.map((t) => {
                const point = toView(t.marker, transform),
                  label = labelPosition(t);
                return (
                  <g key={t.id}>
                    <path
                      d={`M ${point.x} ${point.y} L ${point.x} ${label.y} L ${label.x} ${label.y}`}
                      fill="none"
                      stroke={part.id === t.id ? "#245c49" : "#a5b3a9"}
                      strokeWidth="1.5"
                      strokeDasharray={part.id === t.id ? undefined : "4 5"}
                    />
                    <circle
                      cx={point.x}
                      cy={point.y}
                      r={part.id === t.id ? 9 : 6}
                      fill={part.id === t.id ? "#245c49" : "#fff"}
                      stroke="#245c49"
                      strokeWidth="2"
                    />
                  </g>
                );
              })}
            </svg>
          )}
          {!compare &&
            markers &&
            !clean &&
            sorted.map((t) => {
              const q = labelPosition(t);
              return (
                <button
                  key={t.id}
                  className={`part-marker ${part.id === t.id ? "active" : ""}`}
                  style={{ left: `${q.x / 14.4}%`, top: `${q.y / 9}%` }}
                  onClick={() => {
                    selectPart(t.id);
                    setDrawer(true);
                    setTab("style");
                  }}
                  onMouseEnter={() => setHover(t.id)}
                  onMouseLeave={() => setHover(undefined)}
                  onFocus={() => setHover(t.id)}
                  onBlur={() => setHover(undefined)}
                >
                  {t.name}
                  <span>{t.locked ? "⌑" : "＋"}</span>
                </button>
              );
            })}
          {compare && (
            <>
              <div className="compare-divider" style={{ left: `${split}%` }}>
                <span>↔</span>
              </div>
              <input
                className="compare-slider"
                aria-label="Comparison divider"
                type="range"
                min="0"
                max="100"
                value={split}
                onChange={(e) => setSplit(+e.target.value)}
              />
              <div className="compare-label left">
                {compareA === "original"
                  ? "Original on white"
                  : p.designs.find((d) => d.id === compareA)?.name || "Current"}
              </div>
              <div className="compare-label right">
                {compareB === "current"
                  ? "Current design"
                  : p.designs.find((d) => d.id === compareB)?.name ||
                    "Original"}
              </div>
            </>
          )}
          <div className="stage-caption">
            <span className="small-dot" />{" "}
            {compare
              ? "Slide to compare"
              : "Made from your source. Styled by you."}
          </div>
        </div>
        <div className="stage-controls">
          <div className="segmented">
            <button
              className={!compare ? "active" : ""}
              onClick={() => setCompare(false)}
            >
              Style
            </button>
            <button
              className={compare ? "active" : ""}
              onClick={() => setCompare(true)}
            >
              ◫ Compare
            </button>
          </div>
          <div className="button-row">
            <button
              className={markers ? "selected" : ""}
              onClick={() => setMarkers((v) => !v)}
              aria-pressed={markers}
            >
              ⊙ <span>Markers</span>
            </button>
            <button onClick={() => setClean((v) => !v)} aria-pressed={clean}>
              {clean ? "Exit preview" : "⛶ Clean preview"}
            </button>
          </div>
        </div>
        {compare && (
          <div className="compare-selects">
            <label>
              Left
              <select
                value={compareA}
                onChange={(e) => setCompareA(e.target.value)}
              >
                <option value="original">Original on white</option>
                <option value="current">Current design</option>
                {p.designs.map((d) => (
                  <option value={d.id} key={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Right
              <select
                value={compareB}
                onChange={(e) => setCompareB(e.target.value)}
              >
                <option value="current">Current design</option>
                <option value="original">Original on white</option>
                {p.designs.map((d) => (
                  <option value={d.id} key={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}
        {!clean && (
          <>
            <div className="component-strip" aria-label="Bicycle components">
              {p.parts.map((t) => (
                <button
                  key={t.id}
                  className={part.id === t.id ? "active" : ""}
                  onClick={() => {
                    selectPart(t.id);
                    setDrawer(true);
                  }}
                  onMouseEnter={() => setHover(t.id)}
                  onMouseLeave={() => setHover(undefined)}
                >
                  <span>
                    {t.wheel ? "◉" : t.category === "frame" ? "△" : "◇"}
                  </span>
                  {t.name}
                  <small>
                    {t.locked
                      ? "Locked"
                      : t.status === "confirmed"
                        ? getPartStyleSummary(t, p.styles[t.id], p)
                        : "Set up"}
                  </small>
                </button>
              ))}
              <button onClick={() => onSetup(part.id)}>
                <span>＋</span>Add another part
                <small>Customise your bicycle</small>
              </button>
            </div>
            <div className="design-bar">
              <div>
                <strong>Keep a good idea.</strong>
                <span>Save variations and compare them side by side.</span>
              </div>
              <input
                aria-label="Design name"
                placeholder="Name this design…"
                value={designName}
                onChange={(e) => setDesignName(e.target.value)}
                maxLength={60}
              />
              <button onClick={saveDesign}>＋ Save design</button>
            </div>
            {p.designs.length > 0 && (
              <div className="saved-designs">
                {p.designs.map((d) => (
                  <div key={d.id}>
                    <button
                      onClick={() => {
                        onChange({
                          ...p,
                          styles: structuredClone(d.styles),
                          decals: structuredClone(d.decals),
                        });
                        notify(`Loaded ${d.name}.`);
                      }}
                    >
                      ◈ {d.name}
                    </button>
                    <button
                      className="icon-button"
                      aria-label={`Delete design ${d.name}`}
                      onClick={() =>
                        onChange({
                          ...p,
                          designs: p.designs.filter((x) => x.id !== d.id),
                        })
                      }
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
        <p className="compatibility">
          For visualisation only. A convincing preview does not prove physical
          fit and should not be your sole basis for a purchase.
        </p>
      </section>
      {!clean && (
        <aside
          className={`style-panel ${drawer ? "drawer-open" : "drawer-closed"}`}
        >
          <button
            className="drawer-handle"
            onClick={() => {setDrawer(!drawer);setExpandedSheet(false)}}
            aria-expanded={drawer}
            aria-label={
              drawer ? "Collapse component panel" : "Expand component panel"
            }
          >
            <span />
          </button>
          <div className="panel-top">
            <div>
              <span className="eyebrow">MAKE IT YOURS</span>
              <h2>{part.name}</h2>
            </div>
            <button className="sheet-expand" onClick={()=>{setExpandedSheet(!expandedSheet);setDrawer(true)}}>{expandedSheet?'Back to bicycle':'Browse full screen'}</button>
            <button
              className={part.locked ? "lock-button locked" : "lock-button"}
              onClick={() =>
                onChange({
                  ...p,
                  parts: p.parts.map((t) =>
                    t.id === part.id ? { ...t, locked: !t.locked } : t,
                  ),
                })
              }
              aria-label={
                part.locked ? `Unlock ${part.name}` : `Lock ${part.name}`
              }
            >
              {part.locked ? "⌑ Locked" : "⌑ Lock"}
            </button>
          </div>
          <div className="panel-tabs">
            <button
              className={tab === "style" ? "active" : ""}
              onClick={() => setTab("style")}
            >
              Visual styles
            </button>
            <button
              className={tab === "decals" ? "active" : ""}
              onClick={() => setTab("decals")}
            >
              Decals
            </button>
            <button onClick={() => onCatalogue("products")}>Catalogue & fit ↗</button>
          </div>
          <div className="panel-scroll" ref={panel}>
            <div className="button-row part-refinement">
              <button onClick={() => onSetup(part.id)}>Refine part mask</button>
              <button onClick={() => onSetup(part.id, true)}>
                Refine overlap
              </button>
            </div>
            {part.locked && (
              <p className="callout">
                This part is locked to preserve its original appearance. Unlock
                it to edit.
              </p>
            )}
            {part.status !== "confirmed" && (
              <div className="callout">
                This part needs a source mask and confirmed geometry.
                <button onClick={() => onSetup(part.id)}>
                  Set up this part →
                </button>
              </div>
            )}
            {tab === "style" ? (
              <>
                {entries.length>0&&<>
                  <div className="section-label explore-heading"><h3>Explore components</h3></div>
                  <div className="visual-mode-options" role="group" aria-label="Choose component collection">
                    <button aria-pressed={visualMode==='styles'} onClick={()=>setVisualMode('styles')}>Styles</button>
                    <button aria-pressed={visualMode==='real'} onClick={()=>setVisualMode('real')}>Real parts</button>
                    <button aria-pressed={visualMode==='compatible'} onClick={()=>setVisualMode('compatible')}>Compatible real parts</button>
                  </div>
                  {visualMode!=='styles'&&<ProductVisualPicker key={`${part.id}:${visualMode}`} project={p} part={part} compatible={visualMode==='compatible'} onCatalogue={()=>onCatalogue('products')} onApply={change=>{
                    if(wheelMissing){notify('Confirm frame and fork masks before replacing wheels.');return;}
                    setStyle(change);setExpandedSheet(false);notify('Product preview applied. Appearance does not establish physical fit.');
                  }}/>}
                </>}
                {(visualMode==='styles'||!entries.length)&&<>
                <div className="section-label">
                  <h3>Colour palette</h3>
                  <span>
                    {style.colour
                      ? PALETTE.find((c) => c[1] === style.colour)?.[0] ||
                        "Custom"
                      : "Original"}
                  </span>
                </div>
                <div className="swatches">
                  {PALETTE.map(([name, hex]) => (
                    <button
                      key={hex}
                      title={name}
                      aria-label={name}
                      disabled={
                        part.locked ||
                        part.status !== "confirmed" ||
                        artworkActive
                      }
                      className={style.colour === hex ? "chosen" : ""}
                      style={{ background: hex }}
                      onClick={() => setStyle({ colour: hex })}
                    >
                      {style.colour === hex ? "✓" : ""}
                    </button>
                  ))}
                </div>
                <label className="custom-colour">
                  Custom colour{" "}
                  <input
                    type="color"
                    aria-label="Custom part colour"
                    disabled={
                      part.locked ||
                      part.status !== "confirmed" ||
                      artworkActive
                    }
                    value={style.colour || "#bca77a"}
                    onChange={(e) => setStyle({ colour: e.target.value })}
                  />
                  <span>{style.colour || "Original"}</span>
                </label>
                {artworkActive && (
                  <p className="hint">
                    This cutout keeps its material colours. Adjust its lighting
                    in Placement & overlap.
                  </p>
                )}
                <div className="section-label">
                  <h3>Finish</h3>
                  <span>
                    {style.entryId
                      ? "Source recolouring only"
                      : "Visual approximation"}
                  </span>
                </div>
                <div className="finish-options">
                  {(["satin", "gloss", "matte", "metallic"] as const).map(
                    (f) => (
                      <button
                        className={
                          (style.finish || "satin") === f ? "active" : ""
                        }
                        key={f}
                        onClick={() =>
                          setStyle({
                            finish: f,
                            colour: style.colour || "#bca77a",
                          })
                        }
                        disabled={
                          part.locked ||
                          part.status !== "confirmed" ||
                          !!style.entryId
                        }
                      >
                        {f}
                      </button>
                    ),
                  )}
                </div>
                {["frame", "fork"].includes(part.id) && (
                  <label className="check link-check">
                    <input
                      type="checkbox"
                      checked={linkFrame}
                      onChange={(e) => setLinkFrame(e.target.checked)}
                    />{" "}
                    Match frame & fork colours
                  </label>
                )}
                {part.wheel && (
                  <label className="check link-check">
                    <input
                      type="checkbox"
                      checked={linkWheels}
                      onChange={(e) => setLinkWheels(e.target.checked)}
                    />{" "}
                    Match front & rear {part.category}
                  </label>
                )}
                <div className="section-label catalogue-heading">
                  <h3>
                    {entries.length
                      ? "Visual styles"
                      : "Original frame, new character"}
                  </h3>
                  <span>
                    {entries.length
                      ? `${entries.length} styles`
                      : "Source proportions retained"}
                  </span>
                </div>
                {entries.length > 0 && (
                  <>
                    <label className="search">
                      <span>⌕</span>
                      <input
                        aria-label="Search component catalogue"
                        placeholder={`Search ${part.category}…`}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                    </label>
                    <div className="catalogue-filters">
                      <select
                        aria-label="Filter component styles"
                        value={tag}
                        onChange={(e) => setTag(e.target.value)}
                      >
                        <option value="all">All styles</option>
                        {tags.map((t) => (
                          <option value={t} key={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                      <button
                        aria-pressed={favourites}
                        className={favourites ? "selected" : ""}
                        onClick={() => setFavourites(!favourites)}
                      >
                        ☆ Favourites
                      </button>
                    </div>
                    {wheelMissing && (
                      <p className="callout">
                        Confirm frame and fork masks in Setup to protect them
                        during wheel swaps.
                      </p>
                    )}
                    {!part.wheel && (
                      <label className="check approximation">
                        <input
                          type="checkbox"
                          checked={approx || !!style.approvedApproximation}
                          onChange={(e) => setApprox(e.target.checked)}
                        />
                        <span>
                          Enable replacement preview. Hidden surfaces may need
                          an overlap correction.
                        </span>
                      </label>
                    )}
                    <div className="catalogue-grid">
                      <button
                        className={`catalogue-card original-card ${!style.entryId ? "active" : ""}`}
                        disabled={part.locked}
                        onClick={() => setStyle({}, true)}
                      >
                        <div className="original-thumb">↶</div>
                        <strong>Original</strong>
                        <small>Your source component</small>
                      </button>
                      {filtered.slice(0, visibleCards).map((e) => (
                        <div
                          className={`catalogue-card ${style.entryId === e.id ? "active" : ""}`}
                          key={e.id}
                        >
                          <button
                            className="card-main"
                            disabled={
                              part.locked ||
                              part.status !== "confirmed" ||
                              wheelMissing
                            }
                            onClick={() => choose(e)}
                          >
                            <Thumbnail entry={e} />
                            <strong>{e.name}</strong>
                            <small>
                              {style.entryId === e.id
                                ? "✓ Currently selected"
                                : e.tags[1]}
                            </small>
                          </button>
                          <button
                            className="favourite"
                            aria-label={`${p.favourites.includes(e.id) ? "Unfavourite" : "Favourite"} ${e.name}`}
                            onClick={() =>
                              onChange({
                                ...p,
                                favourites: p.favourites.includes(e.id)
                                  ? p.favourites.filter((id) => id !== e.id)
                                  : [...p.favourites, e.id],
                              })
                            }
                          >
                            {p.favourites.includes(e.id) ? "★" : "☆"}
                          </button>
                        </div>
                      ))}
                    </div>
                    {filtered.length > visibleCards && (
                      <button
                        onClick={() => setVisibleCards(visibleCards + 36)}
                      >
                        Show more visual styles
                      </button>
                    )}
                    <p className="hint">
                      Appearance preview only. Cutouts and drawn styles are
                      labelled; neither proves physical fit.
                    </p>
                    {filtered.length === 0 && (
                      <p className="hint">
                        No matching components. Try a shorter search or clear
                        filters.
                      </p>
                    )}
                  </>
                )}
                </>}
                {style.entryId && (
                  <details className="alignment">
                    <summary>Placement & overlap</summary>
                    <label>
                      Layer order (higher is in front)
                      <input
                        type="number"
                        min="-100"
                        max="100"
                        value={style.layerOrder || 0}
                        onChange={(e) =>
                          setStyle({
                            layerOrder: Math.max(
                              -100,
                              Math.min(100, +e.target.value),
                            ),
                          })
                        }
                      />
                    </label>
                    {[
                      "cranksets",
                      "chainrings",
                      "freewheels",
                      "cassettes",
                      "derailleurs",
                      "chains",
                    ].includes(part.category) ? (
                      <p className="hint">
                        Drive-side illustration only. Opposite-side geometry is
                        unavailable; drivetrain artwork is never mirrored.
                      </p>
                    ) : (
                      !part.wheel && (
                        <label>
                          <input
                            type="checkbox"
                            checked={style.mirror ?? p.orientation === "left"}
                            onChange={(e) =>
                              setStyle({ mirror: e.target.checked })
                            }
                          />{" "}
                          Mirror this illustration
                        </label>
                      )
                    )}
                    <p className="hint">
                      Visual proportions only. These controls do not establish
                      physical compatibility.
                    </p>
                    {[
                      ["scale", "Visual size", 0.5, 1.5, 0.01],
                      ["widthScale", "Width / foreshortening", 0.25, 2, 0.01],
                      ["heightScale", "Height / foreshortening", 0.25, 2, 0.01],
                      ["skew", "Viewing angle / shear", -45, 45, 1],
                      ["rotation", "Rotation", -45, 45, 1],
                      [
                        "offsetX",
                        "Horizontal position",
                        -p.width * 0.15,
                        p.width * 0.15,
                        1,
                      ],
                      [
                        "offsetY",
                        "Vertical position",
                        -p.height * 0.15,
                        p.height * 0.15,
                        1,
                      ],
                    ].map(([key, label, min, max, step]) => (
                      <label key={key}>
                        {label}
                        <input
                          type="range"
                          min={min}
                          max={max}
                          step={step}
                          value={Number(
                            style[key as keyof PartStyle] ??
                              (["scale","widthScale","heightScale"].includes(String(key)) ? 1 : 0),
                          )}
                          onChange={(e) => setStyle({ [key]: +e.target.value })}
                        />
                      </label>
                    ))}
                    {part.category==='cranksets'&&!artworkActive&&<label>Crank arm angle<input type="range" min="-180" max="180" step="1" value={style.crankAngle??48} onChange={e=>setStyle({crankAngle:+e.target.value})}/></label>}
                    {part.category==='cranksets'&&!artworkActive&&<label>Crank arm reach<input type="range" min="0.35" max="1.35" step="0.01" value={style.crankReach??1} onChange={e=>setStyle({crankReach:+e.target.value})}/></label>}
                    {artworkActive&&<fieldset className="cutout-lighting"><legend>Match photo lighting</legend>
                      <label>Brightness<input type="range" min="0.5" max="1.5" step="0.01" value={style.brightness??1} onChange={e=>setStyle({brightness:+e.target.value})}/></label>
                      <label>Contrast<input type="range" min="0.5" max="1.5" step="0.01" value={style.contrast??1} onChange={e=>setStyle({contrast:+e.target.value})}/></label>
                      <label>Warmth<input type="range" min="-1" max="1" step="0.02" value={style.warmth??0} onChange={e=>setStyle({warmth:+e.target.value})}/></label>
                      <button onClick={()=>setStyle({brightness:1,contrast:1,warmth:0})}>Reset lighting</button>
                    </fieldset>}
                    <button onClick={()=>setStyle({scale:1,widthScale:1,heightScale:1,skew:0,rotation:0,offsetX:0,offsetY:0,crankAngle:undefined,crankReach:undefined})}>Reset placement</button>
                    <button
                      onClick={() => {
                        const current = [...CATALOGUE, ...p.customEntries].find(
                          (e) => e.id === style.entryId,
                        );
                        if (!current) return;
                        const duplicate = {
                          ...structuredClone(current),
                          id: `custom-${uid()}`,
                          name: `${current.name} · custom`,
                          custom: true,
                          parameters: { ...current.parameters },
                        };
                        onChange({
                          ...p,
                          customEntries: [...p.customEntries, duplicate],
                          styles: {
                            ...p.styles,
                            [part.id]: { ...style, entryId: duplicate.id },
                          },
                        });
                        notify(
                          "Custom copy added. Its colour and alignment can now be adjusted independently.",
                        );
                      }}
                    >
                      Duplicate as custom component
                    </button>
                  </details>
                )}
                {entries.length === 0 && (
                  <p className="hint">
                    Paint follows your exact source mask and retains the
                    original shading. Protect lettering and cables in Setup.
                    Metallic and gloss finishes are deterministic effects.
                  </p>
                )}
                <button className="text-button" onClick={()=>onCatalogue("visual")}>
                  Browse the entire catalogue ↗
                </button>
              </>
            ) : (
              <>
                <h3>Small details. Big difference.</h3>
                <p className="hint">
                  Decals clip to this part’s confirmed mask, including the
                  cut-out and protected details.
                </p>
                <div className="decal-types">
                  {(
                    [
                      ["stripe", "Pinstripes"],
                      ["bands", "Bands"],
                      ["chevron", "Chevrons"],
                      ["number", "Number"],
                      ["text", "Lettering"],
                      ["badge", "Round badge"],
                    ] as [Decal["kind"], string][]
                  ).map(([kind, label]) => (
                    <button key={kind} onClick={() => addDecal(kind)}>
                      {label}
                    </button>
                  ))}
                  <label className="file-button">
                    ＋ Upload artwork
                    <input
                      type="file"
                      accept="image/png,image/webp"
                      onChange={async (e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        if (
                          !["image/png", "image/webp"].includes(f.type) ||
                          f.size > 4 * 1024 * 1024
                        ) {
                          notify("Use a PNG or WebP up to 4 MB.");
                          return;
                        }
                        try {
                          addDecal("artwork", await readArtwork(f));
                        } catch (error) {
                          notify(String(error));
                        }
                        e.target.value = "";
                      }}
                    />
                  </label>
                </div>
                <div className="decal-list">
                  {p.decals.map((d) => (
                    <button
                      key={d.id}
                      className={d.id === activeDecal ? "selected" : ""}
                      onClick={() => setActiveDecal(d.id)}
                    >
                      {d.kind === "text" ? d.text : d.kind}{" "}
                      <small>
                        {p.parts.find((t) => t.id === d.partId)?.name}
                      </small>
                    </button>
                  ))}
                </div>
                {decal && (
                  <div className="decal-editor">
                    {["text", "number", "badge"].includes(decal.kind) && (
                      <label>
                        Text
                        <input
                          value={decal.text}
                          maxLength={100}
                          onChange={(e) =>
                            updateDecal({ text: e.target.value })
                          }
                        />
                      </label>
                    )}
                    <label>
                      Colour
                      <input
                        type="color"
                        value={decal.colour}
                        onChange={(e) =>
                          updateDecal({ colour: e.target.value })
                        }
                      />
                    </label>
                    {[
                      ["x", "Position X", 0, p.width, 1],
                      ["y", "Position Y", 0, p.height, 1],
                      ["scale", "Visual size", 0.1, 4, 0.05],
                      ["rotation", "Rotation", -180, 180, 1],
                      ["opacity", "Opacity", 0, 1, 0.05],
                    ].map(([key, label, min, max, step]) => (
                      <label key={key}>
                        {label}
                        <input
                          type="range"
                          min={min}
                          max={max}
                          step={step}
                          value={Number(decal[key as keyof Decal])}
                          onChange={(e) =>
                            updateDecal({ [key]: +e.target.value })
                          }
                        />
                      </label>
                    ))}
                    <button
                      onClick={() =>
                        onChange({
                          ...p,
                          decals: p.decals.filter((d) => d.id !== decal.id),
                        })
                      }
                    >
                      Remove decal
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
          <div className="panel-footer">
            <button onClick={() => setStyle({}, true)} disabled={part.locked}>
              ↶ Reset this part
            </button>
            <span
              className="performance-dot"
              title="Last preview render including cached compositing"
            >
              {latency ? "Preview ready" : "Preparing preview…"}
            </span>
          </div>
        </aside>
      )}
    </main>
  );
}
