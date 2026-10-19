import type { Project, CatalogueEntry, CataloguePack } from "./types";
import { CATEGORIES } from "./types";
import { RENDERER_IDS, CATALOGUE } from "./catalogue";
import { checkRasterDimensions, rasterDimensions } from "./imageHeaders";
import {
  validateProductDataset,
  validateProductSelection,
} from "./productValidation";
const fail = (s: string): never => {
  throw new Error(`Invalid file: ${s}`);
};
const object = (x: unknown): Record<string, unknown> => {
  if (!x || typeof x !== "object" || Array.isArray(x))
    fail("expected an object.");
  return x as Record<string, unknown>;
};
const string = (x: unknown, max = 200) => {
  if (typeof x !== "string" || x.length > max)
    fail("text is missing or too long.");
  return x as string;
};
const number = (x: unknown, min = -100000, max = 100000) => {
  if (typeof x !== "number" || !Number.isFinite(x) || x < min || x > max)
    fail("a number is out of range.");
  return x as number;
};
const array = (x: unknown, max = 500) => {
  if (!Array.isArray(x) || x.length > max)
    fail("an array is missing or too large.");
  return x as unknown[];
};
const bool = (x: unknown) => {
  if (typeof x !== "boolean") fail("expected a boolean.");
};
const colour = (x: unknown) => {
  if (!/^#[0-9a-fA-F]{6}$/.test(string(x, 7))) fail("invalid colour.");
};
const one = (x: unknown, values: unknown[]) => {
  if (!values.includes(x)) fail("unsupported value.");
};
const keys = (x: Record<string, unknown>, allowed: string[]) => {
  if (Object.keys(x).some((k) => !allowed.includes(k)))
    fail("unknown fields are not allowed.");
};
export function validateDataURL(
  x: unknown,
  mask = false,
  max = 36 * 1024 * 1024,
) {
  const s = string(x, max);
  if (
    !(
      mask
        ? /^data:image\/png;base64,[A-Za-z0-9+/]+=*$/
        : /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+=*$/
    ).test(s)
  )
    fail("only embedded PNG, JPG and WebP images are allowed.");
  const base = s.split(",")[1];
  if (base.length < 12 || base.length % 4 !== 0)
    fail("invalid image encoding.");
  return s;
}
function safeTree(x: unknown, depth = 0) {
  if (depth > 25) fail("too deeply nested.");
  if (x && typeof x === "object")
    for (const [k, v] of Object.entries(x)) {
      if (["__proto__", "constructor", "prototype"].includes(k))
        fail("unsafe object key.");
      safeTree(v, depth + 1);
    }
}
function point(x: unknown) {
  const a = object(x);
  number(a.x);
  number(a.y);
}
function style(x: unknown) {
  const s = object(x);
  if (s.product !== undefined) validateProductSelection(s.product);
  if (s.layerOrder !== undefined) number(s.layerOrder, -100, 100);
  if (s.mirror !== undefined) bool(s.mirror);
  if (s.entryId !== undefined) string(s.entryId, 100);
  if (s.colour !== undefined) colour(s.colour);
  if (s.finish !== undefined)
    one(s.finish, ["satin", "matte", "gloss", "metallic"]);
  if (s.scale !== undefined) number(s.scale, 0.1, 4);
    if (s.widthScale !== undefined) number(s.widthScale, 0.25, 2);
    if (s.heightScale !== undefined) number(s.heightScale, 0.25, 2);
    if (s.skew !== undefined) number(s.skew, -45, 45);
    if (s.crankAngle !== undefined) number(s.crankAngle, -180, 180);
    if (s.crankReach !== undefined) number(s.crankReach, 0.35, 1.35);
  if (s.brightness !== undefined) number(s.brightness, 0.5, 1.5);
  if (s.contrast !== undefined) number(s.contrast, 0.5, 1.5);
  if (s.warmth !== undefined) number(s.warmth, -1, 1);
  if (s.rotation !== undefined) number(s.rotation, -360, 360);
  if (s.offsetX !== undefined) number(s.offsetX);
  if (s.offsetY !== undefined) number(s.offsetY);
  if (s.opacity !== undefined) number(s.opacity, 0, 1);
  if (s.approvedApproximation !== undefined) bool(s.approvedApproximation);
}
function styles(x: unknown) {
  const s = object(x);
  if (Object.keys(s).length > 200) fail("too many style settings.");
  for (const v of Object.values(s)) style(v);
}
function decals(x: unknown) {
  for (const v of array(x, 100)) {
    const d = object(v);
    string(d.id, 100);
    string(d.partId, 100);
    one(d.kind, [
      "stripe",
      "bands",
      "number",
      "text",
      "chevron",
      "badge",
      "artwork",
    ]);
    string(d.text, 100);
    colour(d.colour);
    number(d.x);
    number(d.y);
    number(d.scale, 0.05, 10);
    number(d.rotation, -360, 360);
    number(d.opacity, 0, 1);
    if (d.asset) validateDataURL(d.asset, false, 8 * 1024 * 1024);
  }
}
export function validateEntry(x: unknown): CatalogueEntry {
  const e = object(x);
  string(e.id, 100);
  if (!/^[a-zA-Z0-9_-]+$/.test(e.id as string)) fail("invalid component ID.");
  one(
    e.category,
    CATEGORIES.map((c) => c.id),
  );
  string(e.name, 100);
  string(e.description, 1000);
  one(e.renderer, [...RENDERER_IDS, "asset"]);
  one(e.view, ["side"]);
  one(e.orientation, ["both"]);
  string(e.licence, 200);
  string(e.provenance, 500);
  keys(e, [
    "id",
    "category",
    "name",
    "description",
    "tags",
    "renderer",
    "parameters",
    "colours",
    "anchors",
    "view",
    "orientation",
    "licence",
    "provenance",
    "limitations",
    "asset",
    "custom",
    "thumbnail",
    "visualOrigin",
    "assetId",
    "assetView",
    "embeddingAllowed",
  ]);
  for (const tag of array(e.tags, 30)) string(tag, 60);
  for (const c of array(e.colours, 30)) colour(c);
  for (const l of array(e.limitations, 20)) string(l, 600);
  for (const a of array(e.anchors, 10)) {
    point(a);
    string(object(a).name, 50);
    number(object(a).x, -100, 200);
    number(object(a).y, -100, 200);
  }
  const p = object(e.parameters);
  if (Object.keys(p).length > 40) fail("too many parameters.");
  for (const [k, v] of Object.entries(p)) {
    if (!/^[A-Za-z][A-Za-z0-9]*$/.test(k)) fail("unsafe parameter name.");
    if (typeof v === "number") number(v, -1000, 1000);
    else if (typeof v === "string") {
      string(v, 80);
      if (
        /[<>{}();=]|(?:https?:|javascript:|data:|url\(|import|eval|function)/i.test(
          v,
        )
      )
        fail("executable or external component parameter.");
    } else if (typeof v !== "boolean") fail("parameters must be plain values.");
  }
  if (e.asset) {
    validateDataURL(e.asset, false, 8 * 1024 * 1024);
    if (!/^data:image\/(png|webp);/.test(String(e.asset)))
      fail("custom components must use PNG or WebP.");
  }
  if (e.thumbnail) validateDataURL(e.thumbnail, false, 8 * 1024 * 1024);
  if (e.visualOrigin !== undefined)
    one(e.visualOrigin, [
      "deterministic_render",
      "generated_illustration",
      "licensed_photo",
      "user_photo",
    ]);
  if (e.assetId !== undefined) string(e.assetId, 160);
  if (e.assetView !== undefined) string(e.assetView, 80);
  if (e.embeddingAllowed !== undefined) bool(e.embeddingAllowed);
  if (e.renderer === "asset" && !e.asset)
    fail("a custom component is missing its image.");
  return e as CatalogueEntry;
}
export function parsePack(text: string): CataloguePack {
  if (text.length > 32 * 1024 * 1024) fail("catalogue pack exceeds 32 MB.");
  const x = JSON.parse(text);
  safeTree(x);
  const p = object(x);
  keys(p, ["format", "version", "entries"]);
  one(p.format, ["bikestyler-catalogue"]);
  one(p.version, [1]);
  const entries = array(p.entries, 600).map(validateEntry);
  if (new Set(entries.map((e) => e.id)).size !== entries.length)
    fail("duplicate catalogue IDs.");
  return { format: "bikestyler-catalogue", version: 1, entries };
}
export function parseProject(text: string): Project {
  if (text.length > 150 * 1024 * 1024) fail("project exceeds 150 MB.");
  const x = JSON.parse(text);
  safeTree(x);
  const p = object(x);
  one(p.format, ["bikestyler-project"]);
  one(p.version, [1, 2]);
  if (p.productCatalogue !== undefined)
    validateProductDataset(p.productCatalogue);
  if (p.sampleCredit !== undefined) string(p.sampleCredit, 2000);
  if (p.stageFrame !== undefined) {
    const frame = object(p.stageFrame);
    point(frame);
    number(frame.width, 1, 20000);
    number(frame.height, 1, 20000);
  }
  if (p.bikeMeasurements !== undefined) {
    const measurements = object(p.bikeMeasurements);
    if (Object.keys(measurements).length > 60)
      fail("too many bike measurements");
    for (const [key, value] of Object.entries(measurements)) {
      string(key, 100);
      const m = object(value);
      if (typeof m.value === "number") number(m.value, -100000, 100000);
      else string(m.value, 200);
      one(m.status, ["confirmed", "provisional", "conflicting"]);
      string(m.evidence, 2000);
      string(m.recordedAt, 50);
      if (m.unit !== undefined) string(m.unit, 30);
    }
  }
  string(p.id, 100);
  string(p.name, 200);
  string(p.createdAt, 50);
  string(p.updatedAt, 50);
  const w = number(p.width, 100, 4096),
    h = number(p.height, 100, 4096);
  if (w * h > 16777216) fail("source dimensions are too large.");
  number(p.workWidth, 1, 1440);
  number(p.workHeight, 1, 1440);
  validateDataURL(p.original);
  validateDataURL(p.source, false, 90 * 1024 * 1024);
  validateDataURL(p.cutout, true);
  if (p.protection) validateDataURL(p.protection, true);
  one(p.orientation, ["left", "right"]);
  bool(p.setupAccepted);
  const ids: string[] = [];
  if (array(p.parts, 100).length === 0)
    fail("a project needs at least one configured or pending part.");
  for (const v of array(p.parts, 100)) {
    const t = object(v);
    ids.push(string(t.id, 100));
    string(t.name, 100);
    one(
      t.category,
      CATEGORIES.map((c) => c.id),
    );
    one(t.status, ["missing", "suggested", "confirmed"]);
    point(t.marker);
    bool(t.locked);
    const a = object(t.anchor);
    point(a);
    number(a.width, 0.1, 20000);
    number(a.height, 0.1, 20000);
    number(a.rotation, -720, 720);
    if (t.mask) validateDataURL(t.mask, true);
    if (t.protection) validateDataURL(t.protection, true);
    if (t.wheel) {
      const wh = object(t.wheel);
      number(wh.cx);
      number(wh.cy);
      number(wh.rx, 1, 5000);
      number(wh.ry, 1, 5000);
      number(wh.innerRatio, 0.4, 0.99);
      number(wh.rimRatio, 0.1, 0.98);
      if (wh.rotation !== undefined) number(wh.rotation, -1080, 1080);
      if (wh.hubX !== undefined) number(wh.hubX);
      if (wh.hubY !== undefined) number(wh.hubY);
      if (Number(wh.rimRatio) >= Number(wh.innerRatio))
        fail("rim must be inside the tyre.");
    }
  }
  if (new Set(ids).size !== ids.length) fail("duplicate part IDs.");
  styles(p.styles);
  decals(p.decals);
  for (const v of array(p.designs, 40)) {
    const d = object(v);
    string(d.id, 100);
    string(d.name, 100);
    string(d.createdAt, 50);
    styles(d.styles);
    decals(d.decals);
  }
  array(p.customEntries, 600).forEach(validateEntry);
  for (const f of array(p.favourites, 500)) string(f, 100);
  const m = object(p.metrics);
  number(m.setupMs, 0, 1e12);
  for (const n of array(m.edits, 200)) number(n, 0, 1e9);
  const project = p as Project,
    known = new Map(
      [...CATALOGUE, ...project.customEntries].map((e) => [e.id, e]),
    );
  for (const part of project.parts)
    if (part.status === "confirmed" && !part.mask)
      fail("a confirmed part is missing its source mask.");
  for (const settings of [project, ...project.designs]) {
    for (const [id, s] of Object.entries(settings.styles)) {
      const part = project.parts.find((t) => t.id === id);
      if (!part) fail("a design refers to an unknown part.");
      if (
        s.entryId &&
        (!known.has(s.entryId) ||
          known.get(s.entryId)!.category !== part?.category)
      )
        fail(
          "a component asset is missing or belongs to a different category.",
        );
    }
    for (const d of settings.decals)
      if (!ids.includes(d.partId)) fail("a decal refers to an unknown part.");
  }
  return {
    ...project,
    version: 2,
    bikeMeasurements: project.bikeMeasurements || {},
  };
}
export async function validateProjectImages(p: Project) {
  const entries = [
    p.source,
    p.cutout,
    p.protection,
    ...p.parts.flatMap((t) => [t.mask, t.protection]),
    ...p.customEntries.map((e) => e.asset),
    ...p.customEntries.map((e) => e.thumbnail),
    ...p.decals.map((d) => d.asset),
    ...p.designs.flatMap((d) => d.decals.map((x) => x.asset)),
    p.original,
  ].filter(Boolean) as string[];
  for (const src of [...new Set(entries)]) {
    const blob = await (await fetch(src)).blob();
    const dim = checkRasterDimensions(
      rasterDimensions(await blob.arrayBuffer(), blob.type),
      16777216,
    );
    if (dim.width > 8192 || dim.height > 8192)
      fail("embedded image dimensions are unsafe.");
    if (src === p.source && (dim.width !== p.width || dim.height !== p.height))
      fail("source dimensions do not match the project.");
    if (
      src === p.cutout &&
      (dim.width !== p.workWidth || dim.height !== p.workHeight)
    )
      fail("cut-out dimensions do not match the working image.");
    if ("createImageBitmap" in globalThis) {
      const bitmap = await createImageBitmap(blob);
      bitmap.close();
    } else {
      await new Promise<void>((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve();
        image.onerror = () => reject(new Error("Invalid embedded image."));
        image.src = src;
      });
    }
  }
}
