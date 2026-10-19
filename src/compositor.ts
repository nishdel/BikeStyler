import type {
  Project,
  Part,
  PartStyle,
  CatalogueEntry,
  Design,
  Point,
} from "./types";
import { canvas, loadImage, maskAlpha, imagePixels } from "./images";
import { effectiveMask, recolourPixels, refineMask } from "./pixels";
import { CATALOGUE } from "./catalogue";
import { renderComponent } from "./componentRenderers";
import { applyLocalFit } from "./placement";
import { rasterPart, clearRasterPartCache } from "./rasterParts";

export type ViewTransform = {
  scale: number;
  x: number;
  y: number;
  width: number;
  height: number;
};
const maskCache = new Map<string, Promise<Uint8ClampedArray>>();
function getMask(url: string | undefined, w: number, h: number) {
  const key = `${w}:${h}:${url || ""}`;
  if (!maskCache.has(key)) {
    maskCache.set(key, maskAlpha(url, w, h));
    if (maskCache.size > 65) maskCache.delete(maskCache.keys().next().value!);
  }
  return maskCache.get(key)!;
}
const sourceCache = new Map<string, Promise<ImageData>>();
function getSource(url: string, w: number, h: number) {
  const key = `${w}:${h}:${url}`;
  if (!sourceCache.has(key)) {
    sourceCache.set(key, imagePixels(url, w, h));
    if (sourceCache.size > 3)
      sourceCache.delete(sourceCache.keys().next().value!);
  }
  return sourceCache.get(key)!;
}
function union(...masks: (Uint8ClampedArray | undefined)[]) {
  const a = new Uint8ClampedArray(masks.find((m) => m)?.length || 0);
  for (const m of masks)
    if (m) for (let i = 0; i < a.length; i++) a[i] = Math.max(a[i], m[i]);
  return a;
}
const alphaCanvasCache = new WeakMap<Uint8ClampedArray, HTMLCanvasElement>();
function alphaCanvas(a: Uint8ClampedArray, w: number, h: number) {
  const cached = alphaCanvasCache.get(a);
  if (cached) return cached;
  const c = canvas(w, h),
    ctx = c.getContext("2d")!,
    d = ctx.createImageData(w, h);
  for (let i = 0; i < a.length; i++) {
    d.data[i * 4] = 255;
    d.data[i * 4 + 1] = 255;
    d.data[i * 4 + 2] = 255;
    d.data[i * 4 + 3] = a[i];
  }
  ctx.putImageData(d, 0, 0);
  alphaCanvasCache.set(a, c);
  return c;
}
function entryFor(p: Project, id?: string) {
  return [...p.customEntries, ...CATALOGUE].find((e) => e.id === id);
}
const paintOnly = new Set(["frame", "fork"]);

async function prepare(p: Project, w: number, h: number) {
  const source = await getSource(p.source, w, h),
    cutout = await getMask(p.cutout, w, h);
  const original = canvas(w, h),
    oc = original.getContext("2d")!;
  oc.putImageData(source, 0, 0);
  oc.globalCompositeOperation = "destination-in";
  oc.drawImage(alphaCanvas(cutout, w, h), 0, 0);
  const globalProtect = await getMask(p.protection, w, h),
    masks = new Map<string, Uint8ClampedArray>();
  await Promise.all(
    p.parts.map(async (part) =>
      masks.set(part.id, await getMask(part.mask, w, h)),
    ),
  );
  const locked = union(
    globalProtect,
    ...p.parts.filter((t) => t.locked).map((t) => masks.get(t.id)),
  );
  const overlap = union(
    ...p.parts
      .filter((t) =>
        [
          "frame",
          "fork",
          "brakes",
          "seatposts",
          "pedals",
          "cranksets",
          "chainrings",
        ].includes(t.category),
      )
      .map((t) => masks.get(t.id)),
  );
  const protectedCache = new Map<string, Uint8ClampedArray>(),
    effectiveCache = new Map<string, Uint8ClampedArray>(),
    suppressionCache = new Map<string, Uint8ClampedArray>();
  async function protection(part: Part, wheel = false) {
    const key = part.id + (wheel ? "wheel" : "colour");
    if (!protectedCache.has(key))
      protectedCache.set(
        key,
        union(
          locked,
          await getMask(part.protection, w, h),
          wheel ? overlap : undefined,
        ),
      );
    return protectedCache.get(key)!;
  }
  async function effective(part: Part, wheel = false) {
    const key = part.id + (wheel ? "wheel" : "colour");
    if (!effectiveCache.has(key))
      effectiveCache.set(
        key,
        effectiveMask(
          masks.get(part.id)!,
          cutout,
          await protection(part, wheel),
        ),
      );
    return effectiveCache.get(key)!;
  }
  async function suppression(part: Part, wheel = false) {
    const key = part.id + (wheel ? "wheel" : "colour");
    if (!suppressionCache.has(key)) {
      const protect = await protection(part, wheel),
        expanded = part.wheel
          ? masks.get(part.id)!
          : refineMask(masks.get(part.id)!, w, h, "expand");
      suppressionCache.set(
        key,
        expanded.map((v, i) => {
          if (!v) return 0;
          if (part.wheel) {
            const wh = part.wheel,
              scale = w / p.width;
            const angle = ((wh.rotation || 0) * Math.PI) / 180,
              dx = (i % w) - wh.cx * scale,
              dy = Math.floor(i / w) - wh.cy * scale;
            const r = Math.hypot(
              (dx * Math.cos(angle) + dy * Math.sin(angle)) / (wh.rx * scale),
              (-dx * Math.sin(angle) + dy * Math.cos(angle)) / (wh.ry * scale),
            );
            if (part.category === "tyres" && r < wh.innerRatio) return 0;
            if (["wheels", "rims"].includes(part.category) && r > wh.innerRatio)
              return 0;
          }
          return 255 - protect[i];
        }),
      );
    }
    return suppressionCache.get(key)!;
  }
  type Tile = { image: HTMLCanvasElement; x: number; y: number };
  const colours = new Map<string, Tile>();
  const paintInputs = new Map<
    string,
    {
      source: Uint8ClampedArray;
      mask: Uint8ClampedArray;
      x: number;
      y: number;
      width: number;
      height: number;
    }
  >();
  async function colourLayer(part: Part, style: PartStyle): Promise<Tile> {
    const key = part.id + ":" + style.colour + ":" + style.finish;
    if (colours.has(key)) return colours.get(key)!;
    let input = paintInputs.get(part.id);
    if (!input) {
      const alpha = await effective(part, !!part.wheel);
      let x0 = w,
        y0 = h,
        x1 = 0,
        y1 = 0;
      for (let i = 0; i < alpha.length; i++)
        if (alpha[i]) {
          const x = i % w,
            y = Math.floor(i / w);
          x0 = Math.min(x0, x);
          y0 = Math.min(y0, y);
          x1 = Math.max(x1, x);
          y1 = Math.max(y1, y);
        }
      if (x0 > x1) {
        x0 = y0 = x1 = y1 = 0;
      }
      const tw = x1 - x0 + 1,
        th = y1 - y0 + 1,
        data = new Uint8ClampedArray(tw * th * 4),
        mask = new Uint8ClampedArray(tw * th);
      for (let y = 0; y < th; y++) {
        data.set(
          source.data.subarray(
            ((y + y0) * w + x0) * 4,
            ((y + y0) * w + x0 + tw) * 4,
          ),
          y * tw * 4,
        );
        mask.set(
          alpha.subarray((y + y0) * w + x0, (y + y0) * w + x0 + tw),
          y * tw,
        );
      }
      input = { source: data, mask, x: x0, y: y0, width: tw, height: th };
      paintInputs.set(part.id, input);
    }
    const pixels = recolourPixels(
        input.source,
        input.mask,
        style.colour!,
        style.finish,
      ),
      layer = canvas(input.width, input.height);
    for (let i = 0; i < input.mask.length; i++)
      pixels[i * 4 + 3] = input.mask[i];
    layer
      .getContext("2d")!
      .putImageData(new ImageData(pixels, input.width, input.height), 0, 0);
    const result = { image: layer, x: input.x, y: input.y };
    colours.set(key, result);
    if (colours.size > 12) colours.delete(colours.keys().next().value!);
    return result;
  }
  return {
    colourLayer,
    bases: new Map<string, HTMLCanvasElement>(),
    replacements: new Map<string, HTMLCanvasElement>(),
    source,
    cutout,
    original,
    masks,
    protection,
    effective,
    suppression,
  };
}
let preparedCache: {
  parts: Part[];
  source: string;
  cutout: string;
  protection?: string;
  w: number;
  h: number;
  promise: ReturnType<typeof prepare>;
}[] = [];
function getPrepared(p: Project, w: number, h: number) {
  let found = preparedCache.find(
    (c) =>
      c.parts === p.parts &&
      c.source === p.source &&
      c.cutout === p.cutout &&
      c.protection === p.protection &&
      c.w === w &&
      c.h === h,
  );
  if (!found) {
    found = {
      parts: p.parts,
      source: p.source,
      cutout: p.cutout,
      protection: p.protection,
      w,
      h,
      promise: prepare(p, w, h),
    };
    preparedCache.push(found);
    if (preparedCache.length > 2) preparedCache.shift();
  }
  return found.promise;
}
export function clearCompositorCaches() {
  clearRasterPartCache();
  maskCache.clear();
  sourceCache.clear();
  preparedCache = [];
}

export async function compose(
  p: Project,
  mode: "current" | "original" | Design = "current",
  highResolution = false,
) {
  const w = highResolution ? p.width : p.workWidth,
    h = highResolution ? p.height : p.workHeight,
    s = w / p.width;
  const prepared = await getPrepared(p, w, h),
    { original } = prepared;
  const out = canvas(w, h),
    ctx = out.getContext("2d")!;
  ctx.drawImage(original, 0, 0);
  if (mode === "original") return out;
  const styles = typeof mode === "string" ? p.styles : mode.styles,
    decals = typeof mode === "string" ? p.decals : mode.decals;
  const ordered = [...p.parts].sort(
    (a, b) => (styles[a.id]?.layerOrder || 0) - (styles[b.id]?.layerOrder || 0),
  );
  const baseKey = ordered
    .filter(
      (part) =>
        !part.locked &&
        part.status === "confirmed" &&
        !paintOnly.has(part.category) &&
        part.category !== "decals" &&
        entryFor(p, styles[part.id]?.entryId),
    )
    .map((part) => part.id)
    .sort()
    .join("|");
  const existingBase = prepared.bases.get(baseKey);
  if (existingBase) {
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(existingBase, 0, 0);
  } else {
    // Remove source silhouettes before placing any replacement, so later masks cannot erase earlier layers.
    for (const part of ordered) {
      const style = styles[part.id],
        entry = entryFor(p, style?.entryId);
      if (
        !entry ||
        part.locked ||
        part.status !== "confirmed" ||
        paintOnly.has(part.category) ||
        part.category === "decals"
      )
        continue;
      if (
        ["wheels", "rims", "spokes"].includes(part.category) &&
        !["frame", "fork"].every(
          (id) => p.parts.find((t) => t.id === id)?.status === "confirmed",
        )
      )
        continue;
      ctx.globalCompositeOperation = "destination-out";
      ctx.drawImage(
        alphaCanvas(await prepared.suppression(part, !!part.wheel), w, h),
        0,
        0,
      );
    }
    ctx.globalCompositeOperation = "source-over";
    const base = canvas(w, h);
    base.getContext("2d")!.drawImage(out, 0, 0);
    prepared.bases.set(baseKey, base);
    if (prepared.bases.size > 4)
      prepared.bases.delete(prepared.bases.keys().next().value!);
  }
  for (const part of ordered) {
    const style = styles[part.id],
      entry = entryFor(p, style?.entryId);
    if (
      style?.colour &&
      !part.locked &&
      part.status === "confirmed" &&
      (!style.entryId || paintOnly.has(part.category))
    ) {
      const tile = await prepared.colourLayer(part, style);
      ctx.drawImage(tile.image, tile.x, tile.y);
      continue;
    }
    if (
      part.locked ||
      part.status !== "confirmed" ||
      !style ||
      !entry ||
      paintOnly.has(part.category)
    )
      continue;
    const wheelFamily = ["tyres", "wheels", "rims", "spokes", "hubs"].includes(
      part.category,
    );
    if (
      ["wheels", "rims", "spokes"].includes(part.category) &&
      !["frame", "fork"].every(
        (id) => p.parts.find((t) => t.id === id)?.status === "confirmed",
      )
    )
      continue;
    const replacementKey = JSON.stringify([
      part.id,
      p.orientation,
      entry.id,
      entry.parameters,
      style.colour,
      style.scale,
      style.widthScale,style.heightScale,style.skew,style.crankAngle,style.crankReach,style.finish,
      style.brightness,style.contrast,style.warmth,
      style.rotation,
      style.offsetX,
      style.offsetY,
      style.opacity,
      style.mirror,
    ]);
    const cachedReplacement = prepared.replacements.get(replacementKey);
    if (cachedReplacement) {
      ctx.drawImage(cachedReplacement, 0, 0);
      continue;
    }
    const protectedPixels = await prepared.protection(part, wheelFamily);
    const effective = await prepared.effective(part, wheelFamily);
    const layer = canvas(w, h),
      lc = layer.getContext("2d")!;
    const a = part.anchor,
      scale = part.category === "tyres" ? 1 : style.scale || 1;
    lc.save();
    lc.translate(
      (a.x + (style.offsetX || 0)) * s,
      (a.y + (style.offsetY || 0)) * s,
    );
    lc.rotate(((a.rotation + (style.rotation || 0)) * Math.PI) / 180);
    lc.scale((a.width * scale * s) / 100, (a.height * scale * s) / 100);
    lc.translate(-50, -50);
    lc.globalAlpha = style.opacity ?? 1;
    let renderedEntry: CatalogueEntry = entry;
    if (
      (style.mirror ?? p.orientation === "left") &&
      !part.wheel &&
      ![
        "cranksets",
        "chainrings",
        "freewheels",
        "cassettes",
        "derailleurs",
        "chains",
      ].includes(part.category)
    ) {
      lc.translate(100, 0);
      lc.scale(-1, 1);
    }
    const attachment = entry.anchors.find((a) => a.name === "attachment");
    if (attachment) lc.translate(50 - attachment.x, 50 - attachment.y);
    // Legacy saddle anchors describe the illustration centre; the actual rail
    // clamp is lower. Preserve old placement while fitting about the clamp.
    const fitAttachment = entry.anchors.find(a => a.name === "rail-clamp") || (part.category === "saddles" && !entry.asset
      ? { x: 50, y: 71 }
      : attachment || { x: 50, y: 50 });
    applyLocalFit(lc,fitAttachment,style.widthScale??1,style.heightScale??1,style.skew??0);
    renderedEntry={...entry,parameters:{...entry.parameters,finish:style.finish||'satin',...(style.crankAngle!==undefined?{crankAngle:style.crankAngle}:{}),...(style.crankReach!==undefined?{crankLength:58*style.crankReach}:{})}};
    if (part.wheel) {
      // Renderer outer circle is r=48. Normalise it to the user's confirmed r.
      lc.translate(50, 50);
      lc.scale(50 / 48, 50 / 48);
      lc.translate(-50, -50);
      const wheelScale =
        part.category === "wheels" || part.category === "rims"
          ? part.wheel.innerRatio
          : part.category === "spokes"
            ? (part.wheel.rimRatio * 48) / 42
            : part.category === "hubs"
              ? 0.16
              : 1;
      lc.translate(50, 50);
      lc.scale(wheelScale, wheelScale);
      lc.translate(-50, -50);
      renderedEntry = {
        ...renderedEntry,
        parameters: {
          ...renderedEntry.parameters,
          innerRatio: part.wheel.innerRatio,
          rimRatio: part.wheel.rimRatio,
          spokeWidth: Math.max(0.12, (100 / (part.wheel.rx * 2)) * 1.2),
          hubRadius: Math.max(0.7, (100 / (part.wheel.rx * 2)) * 12),
          rimDepth:
            48 *
            (1 - part.wheel.rimRatio / part.wheel.innerRatio) *
            ((Number(entry.parameters.depth) || 5) / 5),
          hubOffsetX:
            (((((part.wheel.hubX ?? part.wheel.cx) - part.wheel.cx) *
              Math.cos(((part.wheel.rotation || 0) * Math.PI) / 180) +
              ((part.wheel.hubY ?? part.wheel.cy) - part.wheel.cy) *
                Math.sin(((part.wheel.rotation || 0) * Math.PI) / 180)) /
              part.wheel.rx) *
              48) /
            wheelScale,
          hubOffsetY:
            (((-((part.wheel.hubX ?? part.wheel.cx) - part.wheel.cx) *
              Math.sin(((part.wheel.rotation || 0) * Math.PI) / 180) +
              ((part.wheel.hubY ?? part.wheel.cy) - part.wheel.cy) *
                Math.cos(((part.wheel.rotation || 0) * Math.PI) / 180)) /
              part.wheel.ry) *
              48) /
            wheelScale,
          ...(part.category === "tyres"
            ? {
                visualWidth:
                  ((Number(entry.parameters.width) || 10) / 10) *
                  (style.scale || 1),
              }
            : {}),
        },
      };
    }
    if (entry.asset) lc.drawImage(await rasterPart(entry,style,renderedEntry.parameters), 0, 0, 100, 100);
    else renderComponent(lc, renderedEntry, style.colour);
    lc.restore();
    if (part.category === "decals") {
      lc.globalCompositeOperation = "destination-in";
      lc.drawImage(alphaCanvas(effective, w, h), 0, 0);
    }
    lc.globalCompositeOperation = "destination-out";
    lc.drawImage(alphaCanvas(protectedPixels, w, h), 0, 0);
    prepared.replacements.set(replacementKey, layer);
    if (prepared.replacements.size > 8)
      prepared.replacements.delete(prepared.replacements.keys().next().value!);
    ctx.drawImage(layer, 0, 0);
    // Surfaces under the removed part are not recovered. The UI requires a
    // user acknowledgement for non-annular silhouette changes.
  }
  for (const decal of decals) {
    const part = p.parts.find((t) => t.id === decal.partId);
    if (!part || part.locked || part.status !== "confirmed") continue;
    const layer = canvas(w, h),
      lc = layer.getContext("2d")!;
    lc.save();
    lc.translate(decal.x * s, decal.y * s);
    lc.rotate((decal.rotation * Math.PI) / 180);
    lc.scale(s * decal.scale, s * decal.scale);
    lc.globalAlpha = decal.opacity;
    lc.fillStyle = decal.colour;
    lc.strokeStyle = decal.colour;
    lc.textAlign = "center";
    lc.textBaseline = "middle";
    lc.font = "bold 32px sans-serif";
    if (decal.kind === "artwork" && decal.asset)
      lc.drawImage(await loadImage(decal.asset), -75, -35, 150, 70);
    else if (decal.kind === "text" || decal.kind === "number")
      lc.fillText(decal.text, 0, 0, 420);
    else if (decal.kind === "stripe") {
      lc.fillRect(-150, -4, 300, 3);
      lc.fillRect(-150, 3, 300, 3);
    } else if (decal.kind === "bands") {
      for (let i = 0; i < 3; i++) lc.fillRect(-32 + i * 25, -60, 12, 120);
    } else if (decal.kind === "chevron") {
      lc.lineWidth = 7;
      for (let i = 0; i < 3; i++) {
        lc.beginPath();
        lc.moveTo(-35 + i * 30, -35);
        lc.lineTo(i * 30, 0);
        lc.lineTo(-35 + i * 30, 35);
        lc.stroke();
      }
    } else {
      lc.beginPath();
      lc.arc(0, 0, 27, 0, Math.PI * 2);
      lc.stroke();
      lc.font = "bold 20px sans-serif";
      lc.fillText(decal.text || "BS", 0, 0);
    }
    lc.restore();
    lc.globalCompositeOperation = "destination-in";
    lc.drawImage(alphaCanvas(await prepared.effective(part), w, h), 0, 0);
    ctx.drawImage(layer, 0, 0);
  }
  return out;
}
export async function viewTransform(
  p: Project,
  width: number,
  height: number,
): Promise<ViewTransform> {
  if (p.stageFrame) {
    const f = p.stageFrame,
      scale = Math.min((width * 0.82) / f.width, (height * 0.74) / f.height);
    return {
      scale,
      x: width / 2 - (f.x + f.width / 2) * scale,
      y: height / 2 - (f.y + f.height / 2) * scale,
      width,
      height,
    };
  }
  const alpha = await getMask(p.cutout, p.workWidth, p.workHeight);
  let x0 = p.workWidth,
    y0 = p.workHeight,
    x1 = 0,
    y1 = 0;
  for (let y = 0; y < p.workHeight; y += 2)
    for (let x = 0; x < p.workWidth; x += 2)
      if (alpha[y * p.workWidth + x] > 30) {
        x0 = Math.min(x0, x);
        x1 = Math.max(x1, x);
        y0 = Math.min(y0, y);
        y1 = Math.max(y1, y);
      }
  if (x1 <= x0 || y1 <= y0) {
    x0 = 0;
    y0 = 0;
    x1 = p.workWidth;
    y1 = p.workHeight;
  }
  const src = p.width / p.workWidth;
  x0 *= src;
  x1 *= src;
  y0 *= src;
  y1 *= src;
  const scale = Math.min(
    (width * 0.82) / (x1 - x0),
    (height * 0.74) / (y1 - y0),
  );
  return {
    scale,
    x: width / 2 - ((x0 + x1) * scale) / 2,
    y: height / 2 - ((y0 + y1) * scale) / 2,
    width,
    height,
  };
}
export async function renderPreview(
  p: Project,
  target: HTMLCanvasElement,
  mode: "current" | "original" | Design = "current",
  highlight?: string,
) {
  const start = performance.now(),
    scene = await compose(p, mode),
    t = await viewTransform(p, target.width, target.height),
    ctx = target.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, target.width, target.height);
  ctx.drawImage(scene, t.x, t.y, p.width * t.scale, p.height * t.scale);
  const part = p.parts.find((t) => t.id === highlight);
  if (part?.mask) {
    const layer = canvas(p.workWidth, p.workHeight),
      lc = layer.getContext("2d")!;
    lc.fillStyle = "#9ac06e";
    lc.fillRect(0, 0, layer.width, layer.height);
    lc.globalCompositeOperation = "destination-in";
    lc.drawImage(await loadImage(part.mask), 0, 0);
    ctx.globalAlpha = 0.4;
    ctx.drawImage(layer, t.x, t.y, p.width * t.scale, p.height * t.scale);
    ctx.globalAlpha = 1;
  }
  return { transform: t, ms: performance.now() - start };
}
export async function exportPNG(p: Project) {
  const size = Math.min(4096, Math.max(p.width, 1600)),
    out = canvas(size, Math.round((size * 2) / 3)),
    ctx = out.getContext("2d")!,
    scene = await compose(p, "current", true),
    t = await viewTransform(p, out.width, out.height);
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, out.width, out.height);
  ctx.drawImage(scene, t.x, t.y, p.width * t.scale, p.height * t.scale);
  return new Promise<Blob>((resolve, reject) =>
    out.toBlob((b) => {
      if (p.width !== p.workWidth) {
        const prefix = `${p.width}:${p.height}:`;
        for (const key of maskCache.keys())
          if (key.startsWith(prefix)) maskCache.delete(key);
        for (const key of sourceCache.keys())
          if (key.startsWith(prefix)) sourceCache.delete(key);
        preparedCache = preparedCache.filter(
          (c) => c.w !== p.width || c.h !== p.height,
        );
      }
      b ? resolve(b) : reject(new Error("PNG export failed."));
    }, "image/png"),
  );
}
export function toView(point: Point, t: ViewTransform) {
  return { x: point.x * t.scale + t.x, y: point.y * t.scale + t.y };
}
export function getPartStyleSummary(
  part: Part,
  style?: PartStyle,
  p?: Project,
) {
  if (!style || (!style.entryId && !style.colour)) return "Original";
  return (p && entryFor(p, style.entryId)?.name) || style.colour || "Custom";
}
