import ProductBrowser from "./ProductBrowser";
import { PRODUCT_DATA } from "./products";
import { embedEntry } from "./portable";
import { useState, useEffect } from "react";
import type { Category, Project, CatalogueEntry } from "./types";
import { CATEGORIES } from "./types";
import { CATALOGUE } from "./catalogue";
import { parsePack } from "./validation";
import { download, readArtwork, uid, loadImage, canvas } from "./images";
import Thumbnail from "./Thumbnail";
import { checkRasterDimensions, rasterDimensions } from "./imageHeaders";
export default function Catalogue({
  project: p,
  onChange,
  onClose,
  notify,
  initialMode = "products",
}: {
  project: Project | null;
  onChange: (p: Project) => void;
  onClose: () => void;
  notify: (s: string) => void;
  initialMode?: "visual" | "products";
}) {
  const [mode, setMode] = useState<"visual" | "products">(initialMode),
    [visibleCards, setVisibleCards] = useState(48);
  const [category, setCategory] = useState<Category>("tyres"),
    [search, setSearch] = useState(""),
    [fav, setFav] = useState(false),
    [custom, setCustom] = useState(false),
    [asset, setAsset] = useState(""),
    [name, setName] = useState("My component"),
    [ax, setAx] = useState(50),
    [ay, setAy] = useState(50),
    [chosen, setChosen] = useState<CatalogueEntry>(),
    [target, setTarget] = useState(""),
    [approved, setApproved] = useState(false);
  const entries = [
    ...new Map(
      [...CATALOGUE, ...(p?.customEntries || [])].map((e) => [e.id, e]),
    ).values(),
  ].filter(
    (e) =>
      e.category === category &&
      (!fav || p?.favourites.includes(e.id)) &&
      `${e.name} ${e.tags.join(" ")}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  useEffect(() => setVisibleCards(48), [category, search, fav]);
  async function importPack(file: File) {
    try {
      if (!p)
        throw new Error(
          "Create a bicycle project first to keep imported components.",
        );
      if (file.size > 32 * 1024 * 1024)
        throw new Error("Catalogue packs must be 32 MB or smaller.");
      const pack = parsePack(await file.text());
      const known = new Set(
        [...CATALOGUE, ...p.customEntries].map((e) => e.id),
      );
      const added = pack.entries.filter((e) => !known.has(e.id));
      if (p.customEntries.length + added.length > 300)
        throw new Error(
          "A project can contain up to 300 custom catalogue entries.",
        );
      for (const entry of added)
        if (entry.asset) {
          const blob = await (await fetch(entry.asset)).blob();
          const dim = checkRasterDimensions(
            rasterDimensions(await blob.arrayBuffer(), blob.type),
            16777216,
          );
          if (dim.width > 4096 || dim.height > 4096)
            throw new Error("Custom image dimensions exceed 4096 px.");
          const image = await loadImage(entry.asset);
          if (image.width > 4096 || image.height > 4096)
            throw new Error("Custom image dimensions exceed 4096 px.");
        }
      onChange({ ...p, customEntries: [...p.customEntries, ...added] });
      notify(`Imported ${added.length} components. Existing IDs were kept.`);
    } catch (e) {
      notify(String(e));
    }
  }
  async function importAsset(file: File) {
    try {
      if (
        !["image/png", "image/webp"].includes(file.type) ||
        file.size > 4 * 1024 * 1024
      )
        throw new Error("Use a transparent PNG or WebP up to 4 MB.");
      const url = await readArtwork(file),
        im = await loadImage(url);
      if (im.width > 4096 || im.height > 4096)
        throw new Error("Use an image at most 4096 px on each side.");
      const c = canvas(100, 100),
        ctx = c.getContext("2d")!;
      ctx.drawImage(im, 0, 0, 100, 100);
      const d = ctx.getImageData(0, 0, 100, 100).data;
      if (!d.some((v, i) => i % 4 === 3 && v < 250))
        throw new Error(
          "This image has no transparency. Remove its background before importing as a component.",
        );
      setAsset(url);
    } catch (e) {
      notify(String(e));
    }
  }
  function saveCustom() {
    if (!p || !asset) return;
    if (p.customEntries.length >= 300) {
      notify("A project can contain up to 300 custom components.");
      return;
    }
    const entry: CatalogueEntry = {
      id: `custom-${uid()}`,
      category,
      name: name.trim() || "My component",
      description: "User-imported side-view component.",
      tags: [category, "custom"],
      renderer: "asset",
      parameters: {},
      colours: [],
      anchors: [{ name: "attachment", x: ax, y: ay }],
      view: "side",
      orientation: "both",
      licence: "User supplied; verify usage rights.",
      provenance: "Imported locally by the user.",
      limitations: [
        "Side view; manual alignment and overlap correction required.",
      ],
      asset,
      custom: true,
    };
    onChange({ ...p, customEntries: [...p.customEntries, entry] });
    setCustom(false);
    setAsset("");
    notify("Custom component added with its attachment anchor.");
  }
  function apply() {
    if (!p || !chosen) return;
    const part = p.parts.find((t) => t.id === target);
    if (!part || part.locked || part.status !== "confirmed") return;
    if (
      ["wheels", "rims", "spokes"].includes(part.category) &&
      !["frame", "fork"].every(
        (id) => p.parts.find((t) => t.id === id)?.status === "confirmed",
      )
    ) {
      notify(
        "Confirm frame and fork masks in Setup before changing wheel interiors.",
      );
      return;
    }
    if (!approved && !part.wheel) {
      notify(
        "Acknowledge the hidden-surface limitation before applying this silhouette.",
      );
      return;
    }
    const styles = { ...p.styles };
    if (part.wheel) {
      const side = part.id.startsWith("front") ? "front" : "rear";
      if (part.category === "wheels")
        for (const suffix of ["rim", "spokes", "hub"])
          delete styles[side + "-" + suffix];
      else if (["rims", "spokes", "hubs"].includes(part.category))
        delete styles[side + "-wheel"];
    }
    onChange({
      ...p,
      styles: {
        ...styles,
        [part.id]: {
          ...p.styles[part.id],
          entryId: chosen.id,
          approvedApproximation: approved,
        },
      },
    });
    notify(`${chosen.name} applied to ${part.name}.`);
    setChosen(undefined);
    onClose();
  }
  return (
    <div className="modal-backdrop">
      <section
        className="catalogue-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Component catalogue"
      >
        <header>
          <div>
            <span className="eyebrow">THE PARTS SHELF</span>
            <h2>A little change. A different ride.</h2>
            <p>
              {CATALOGUE.length} visual styles ·{" "}
              {PRODUCT_DATA.products.length} sourced product records · offline
            </p>
          </div>
          <button
            className="icon-button"
            aria-label="Close catalogue"
            onClick={onClose}
          >
            ×
          </button>
        </header>
        <div className="panel-tabs">
          <button
            className={mode === "visual" ? "active" : ""}
            onClick={() => setMode("visual")}
          >
            Visual styles
          </button>
          <button
            className={mode === "products" ? "active" : ""}
            onClick={() => setMode("products")}
          >
            Real products & fit
          </button>
        </div>
        {mode === "products" ? (
          <div className="catalogue-products">
            <ProductBrowser project={p} onChange={onChange} notify={notify} onPreview={onClose}/>
          </div>
        ) : (
          <>
            <div className="catalogue-modal-tools">
              <label className="search">
                <span>⌕</span>
                <input
                  aria-label="Search all catalogue entries"
                  placeholder="Find your next detail…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </label>
              <button
                className={fav ? "selected" : ""}
                onClick={() => setFav(!fav)}
              >
                ☆ Favourites
              </button>
              <button disabled={!p} onClick={() => setCustom(!custom)}>
                ＋ Custom component
              </button>
              <label className="file-button">
                Import pack
                <input
                  type="file"
                  accept=".json"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) importPack(f);
                    e.target.value = "";
                  }}
                />
              </label>
              <button
                onClick={async () => {
                  try {
                    const entries = await Promise.all(
                      [
                        ...new Map(
                          [...CATALOGUE, ...(p?.customEntries || [])].map(
                            (e) => [e.id, e],
                          ),
                        ).values(),
                      ].map(embedEntry),
                    );
                    download(
                      "bikestyler-catalogue.json",
                      new Blob(
                        [
                          JSON.stringify({
                            format: "bikestyler-catalogue",
                            version: 1,
                            entries,
                          }),
                        ],
                        { type: "application/json" },
                      ),
                    );
                  } catch (e) {
                    notify(String(e));
                  }
                }}
              >
                Export pack ↓
              </button>
            </div>
            <div className="catalogue-modal-body">
              <nav aria-label="Catalogue categories">
                {CATEGORIES.filter(
                  (c) => !["frame", "fork", "custom"].includes(c.id),
                ).map((c) => (
                  <button
                    className={category === c.id ? "active" : ""}
                    key={c.id}
                    onClick={() => {
                      setCategory(c.id);
                      setChosen(undefined);
                    }}
                  >
                    {c.name}
                    <small>
                      {
                        [
                          ...new Map(
                            [...CATALOGUE, ...(p?.customEntries || [])].map(
                              (e) => [e.id, e],
                            ),
                          ).values(),
                        ].filter((e) => e.category === c.id).length
                      }
                    </small>
                  </button>
                ))}
              </nav>
              <div className="catalogue-results">
                {custom && (
                  <div className="custom-import">
                    <h3>Make your own component</h3>
                    <p>
                      Import a transparent side-view image. The anchor is where
                      it attaches to your bicycle, expressed as a percentage of
                      the artwork.
                    </p>
                    <label>
                      Component name
                      <input
                        value={name}
                        maxLength={80}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </label>
                    <label className="file-button">
                      Choose PNG / WebP
                      <input
                        type="file"
                        accept="image/png,image/webp"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) importAsset(f);
                        }}
                      />
                    </label>
                    {asset && (
                      <img
                        src={asset}
                        className="custom-asset-preview"
                        alt="Imported component"
                      />
                    )}
                    <div className="button-row">
                      <label>
                        Anchor X
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={ax}
                          onChange={(e) =>
                            setAx(Math.min(100, Math.max(0, +e.target.value)))
                          }
                        />
                      </label>
                      <label>
                        Anchor Y
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={ay}
                          onChange={(e) =>
                            setAy(Math.min(100, Math.max(0, +e.target.value)))
                          }
                        />
                      </label>
                    </div>
                    <button
                      className="primary"
                      disabled={!asset || !p}
                      onClick={saveCustom}
                    >
                      Add to {CATEGORIES.find((c) => c.id === category)?.name}
                    </button>
                  </div>
                )}
                {chosen && (
                  <div className="catalogue-apply">
                    <strong>{chosen.name}</strong>
                    <p>{chosen.description}</p>
                    {p ? (
                      <>
                        <label>
                          Apply to
                          <select
                            aria-label="Target part"
                            value={target}
                            onChange={(e) => setTarget(e.target.value)}
                          >
                            <option value="">Choose a confirmed part</option>
                            {p.parts
                              .filter((t) => t.category === chosen.category)
                              .map((t) => (
                                <option
                                  disabled={
                                    t.locked || t.status !== "confirmed"
                                  }
                                  key={t.id}
                                  value={t.id}
                                >
                                  {t.name}
                                  {t.locked
                                    ? " (locked)"
                                    : t.status !== "confirmed"
                                      ? " (needs setup)"
                                      : ""}
                                </option>
                              ))}
                          </select>
                        </label>
                        {![
                          "tyres",
                          "wheels",
                          "rims",
                          "spokes",
                          "hubs",
                        ].includes(chosen.category) && (
                          <label className="check">
                            <input
                              type="checkbox"
                              checked={approved}
                              onChange={(e) => setApproved(e.target.checked)}
                            />{" "}
                            Illustrative swap; hidden surfaces may need manual
                            setup.
                          </label>
                        )}
                        <button
                          className="primary"
                          disabled={!target}
                          onClick={apply}
                        >
                          Apply component
                        </button>
                        <p className="hint">
                          Missing a target? Add a part in Setup, select its
                          source pixels and define its anchor.
                        </p>
                      </>
                    ) : (
                      <p>
                        Upload a bicycle or open the practice illustration to
                        try components.
                      </p>
                    )}
                  </div>
                )}
                <div className="catalogue-grid">
                  {entries.slice(0, visibleCards).map((e) => (
                    <div
                      className={`catalogue-card ${chosen?.id === e.id ? "active" : ""}`}
                      key={e.id}
                    >
                      <button
                        className="card-main"
                        onClick={() => {
                          setChosen(e);
                          setTarget("");
                          setApproved(false);
                        }}
                      >
                        <Thumbnail entry={e} />
                        <strong>{e.name}</strong>
                        <small>{e.tags[1] || "Custom"}</small>
                      </button>
                      {p && (
                        <button
                          className="favourite"
                          aria-label={`Favourite ${e.name}`}
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
                      )}
                    </div>
                  ))}
                </div>
                {entries.length > visibleCards && (
                  <button onClick={() => setVisibleCards(visibleCards + 48)}>
                    Show more visual styles
                  </button>
                )}
                {entries.length === 0 && <p>No styles match this search.</p>}
              </div>
            </div>
          </>
        )}
        <footer>
          Generic illustrations and reference-based cutouts. No price or compatibility
          claims. Colour choices are separate from style counts.
        </footer>
      </section>
    </div>
  );
}
