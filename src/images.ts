import type { Project, Part, Wheel, Category } from "./types";
import { annulusAlpha } from "./pixels";
import { checkRasterDimensions, rasterDimensions } from "./imageHeaders";
export const uid = () => crypto.randomUUID();
export function canvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = Math.round(w);
  c.height = Math.round(h);
  return c;
}
const imageCache = new Map<string, Promise<HTMLImageElement>>();
export function loadImage(src: string): Promise<HTMLImageElement> {
  if (imageCache.has(src)) return imageCache.get(src)!;
  const p = new Promise<HTMLImageElement>((resolve, reject) => {
    const im = new Image();
    im.onload = () => resolve(im);
    im.onerror = () => reject(new Error("This image could not be decoded."));
    im.src = src;
  });
  imageCache.set(src, p);
  if (imageCache.size > 90) imageCache.delete(imageCache.keys().next().value!);
  return p;
}
export function clearImageCache() {
  imageCache.clear();
}
export function readDataURL(file: Blob) {
  return new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error("Could not read the file."));
    r.readAsDataURL(file);
  });
}
export async function readArtwork(file: File) {
  if (
    !["image/png", "image/webp"].includes(file.type) ||
    file.size > 4 * 1024 * 1024
  )
    throw new Error("Use a PNG or WebP no larger than 4 MB.");
  const d = checkRasterDimensions(
    rasterDimensions(await file.arrayBuffer(), file.type),
    16777216,
  );
  if (d.width > 4096 || d.height > 4096)
    throw new Error("Artwork must be at most 4096 pixels per side.");
  return readDataURL(file);
}
export function alphaURL(alpha: Uint8ClampedArray, w: number, h: number) {
  const c = canvas(w, h),
    ctx = c.getContext("2d")!,
    im = ctx.createImageData(w, h);
  for (let i = 0; i < alpha.length; i++) {
    im.data[i * 4] = 255;
    im.data[i * 4 + 1] = 255;
    im.data[i * 4 + 2] = 255;
    im.data[i * 4 + 3] = alpha[i];
  }
  ctx.putImageData(im, 0, 0);
  return c.toDataURL("image/png");
}
export async function maskAlpha(url: string | undefined, w: number, h: number) {
  if (!url) return new Uint8ClampedArray(w * h);
  const c = canvas(w, h),
    ctx = c.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(await loadImage(url), 0, 0, w, h);
  const d = ctx.getImageData(0, 0, w, h).data;
  return Uint8ClampedArray.from({ length: w * h }, (_, i) => d[i * 4 + 3]);
}
export async function imagePixels(src: string, w: number, h: number) {
  const c = canvas(w, h);
  const ctx = c.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(await loadImage(src), 0, 0, w, h);
  return ctx.getImageData(0, 0, w, h);
}
export async function importPhoto(file: File): Promise<Project> {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
    throw new Error("Choose a JPG, PNG or WebP photograph.");
  if (file.size > 24 * 1024 * 1024)
    throw new Error(
      "This photo is larger than 24 MB. Please resize it before importing.",
    );
  checkRasterDimensions(rasterDimensions(await file.arrayBuffer(), file.type));
  const original = await readDataURL(file);
  let bitmap: ImageBitmap | HTMLImageElement;
  if ("createImageBitmap" in window)
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  else bitmap = await loadImage(original);
  const bw = bitmap.width,
    bh = bitmap.height;
  if (bw < 100 || bh < 100 || bw * bh > 64000000) {
    if ("close" in bitmap) bitmap.close();
    throw new Error(
      "Use a photo at least 100 × 100 and no larger than 64 megapixels.",
    );
  }
  const s = Math.min(1, 4096 / Math.max(bw, bh));
  const w = Math.round(bw * s),
    h = Math.round(bh * s),
    c = canvas(w, h);
  c.getContext("2d")!.drawImage(bitmap, 0, 0, w, h);
  if ("close" in bitmap) bitmap.close();
  const workScale = Math.min(1, 1440 / Math.max(w, h)),
    ww = Math.round(w * workScale),
    wh = Math.round(h * workScale);
  const time = new Date().toISOString();
  return {
    format: "bikestyler-project",
    version: 2,
    id: uid(),
    name: file.name.replace(/\.[^.]+$/, ""),
    createdAt: time,
    updatedAt: time,
    original,
    source: c.toDataURL("image/png"),
    width: w,
    height: h,
    workWidth: ww,
    workHeight: wh,
    cutout: alphaURL(new Uint8ClampedArray(ww * wh).fill(255), ww, wh),
    orientation: "right",
    parts: initialParts(w, h),
    styles: {},
    decals: [],
    designs: [],
    customEntries: [],
    favourites: [],
    setupAccepted: false,
    metrics: { setupMs: 0, edits: [] },
  };
}
export function initialParts(w: number, h: number): Part[] {
  const defs: [string, string, Category, number, number, number, number][] = [
    ["frame", "Frame", "frame", 0.49, 0.52, 0.45, 0.45],
    ["fork", "Fork", "fork", 0.72, 0.56, 0.08, 0.32],
    ["front-tyre", "Front tyre", "tyres", 0.77, 0.66, 0.37, 0.65],
    ["rear-tyre", "Rear tyre", "tyres", 0.23, 0.66, 0.37, 0.65],
    ["tape", "Tape / grips", "tape", 0.74, 0.29, 0.12, 0.18],
    ["saddle", "Saddle", "saddles", 0.4, 0.28, 0.16, 0.07],
    ["hoods", "Brake hoods", "hoods", 0.77, 0.3, 0.06, 0.07],
    ["brake-front", "Front brake", "brakes", 0.71, 0.44, 0.06, 0.07],
    ["brake-rear", "Rear brake", "brakes", 0.36, 0.44, 0.06, 0.07],
    ["stem", "Stem", "stems", 0.68, 0.3, 0.08, 0.05],
    ["seatpost", "Seatpost", "seatposts", 0.41, 0.36, 0.03, 0.14],
    ["pedals", "Crank / pedals", "pedals", 0.49, 0.68, 0.12, 0.09],
  ];
  return defs.map(([id, name, category, x, y, aw, ah]) => ({
    id,
    name,
    category,
    marker: { x: x * w, y: y * h },
    status: "missing",
    locked: ["tape", "saddle", "hoods"].includes(id),
    anchor: { x: x * w, y: y * h, width: aw * w, height: ah * h, rotation: 0 },
  }));
}
export function wheelParts(
  wheel: Wheel,
  side: "front" | "rear",
  p: Project,
): Part[] {
  const s = p.workWidth / p.width,
    sw = {
      ...wheel,
      cx: wheel.cx * s,
      cy: wheel.cy * s,
      rx: wheel.rx * s,
      ry: wheel.ry * s,
    };
  const defs: [string, string, Category, number, number][] = [
    ["tyre", "tyre", "tyres", 1, wheel.innerRatio],
    ["wheel", "wheel", "wheels", wheel.innerRatio, 0],
    ["rim", "rim", "rims", wheel.innerRatio, wheel.rimRatio],
    ["spokes", "spokes", "spokes", wheel.rimRatio, 0.07],
    ["hub", "hub", "hubs", 0.09, 0],
  ];
  return defs.map(([id, name, category, outer, inner]) => ({
    id: `${side}-${id}`,
    name: `${side === "front" ? "Front" : "Rear"} ${name}`,
    category,
    marker: {
      x: wheel.cx + (id === "tyre" ? wheel.rx * 0.75 : 0),
      y: wheel.cy - (id === "tyre" ? wheel.ry * 0.66 : 0),
    },
    status: "suggested",
    locked: false,
    wheel,
    anchor: {
      x: wheel.cx,
      y: wheel.cy,
      width: wheel.rx * 2,
      height: wheel.ry * 2,
      rotation: wheel.rotation || 0,
    },
    mask: alphaURL(
      annulusAlpha(
        p.workWidth,
        p.workHeight,
        id === "hub"
          ? {
              ...sw,
              cx: (wheel.hubX ?? wheel.cx) * s,
              cy: (wheel.hubY ?? wheel.cy) * s,
            }
          : sw,
        outer,
        inner,
      ),
      p.workWidth,
      p.workHeight,
    ),
  }));
}
export async function transformPhoto(
  p: Project,
  rotation: number,
  crop?: { x: number; y: number; width: number; height: number },
): Promise<Project> {
  const image = await loadImage(p.source),
    r = crop || { x: 0, y: 0, width: p.width, height: p.height };
  const sideways = Math.abs(rotation) % 180 === 90;
  const c = canvas(
      sideways ? r.height : r.width,
      sideways ? r.width : r.height,
    ),
    ctx = c.getContext("2d")!;
  ctx.translate(c.width / 2, c.height / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.drawImage(
    image,
    r.x,
    r.y,
    r.width,
    r.height,
    -r.width / 2,
    -r.height / 2,
    r.width,
    r.height,
  );
  const source = c.toDataURL("image/png"),
    ratio = Math.min(1, 1440 / Math.max(c.width, c.height)),
    ww = Math.round(c.width * ratio),
    wh = Math.round(c.height * ratio);
  // Geometry and designs are transformed along with the source, including masks.
  const point = (x: number, y: number) => {
    const a = (rotation * Math.PI) / 180,
      xx = x - r.x - r.width / 2,
      yy = y - r.y - r.height / 2;
    return {
      x: xx * Math.cos(a) - yy * Math.sin(a) + c.width / 2,
      y: xx * Math.sin(a) + yy * Math.cos(a) + c.height / 2,
    };
  };
  const mask = async (url?: string) => {
    if (!url) return undefined;
    const out = canvas(ww, wh),
      o = out.getContext("2d")!;
    o.scale(ww / c.width, wh / c.height);
    o.translate(c.width / 2, c.height / 2);
    o.rotate((rotation * Math.PI) / 180);
    o.drawImage(
      await loadImage(url),
      (r.x / p.width) * p.workWidth,
      (r.y / p.height) * p.workHeight,
      (r.width / p.width) * p.workWidth,
      (r.height / p.height) * p.workHeight,
      -r.width / 2,
      -r.height / 2,
      r.width,
      r.height,
    );
    return out.toDataURL();
  };
  const parts = await Promise.all(
    p.parts.map(async (part) => ({
      ...part,
      marker: point(part.marker.x, part.marker.y),
      anchor: {
        ...part.anchor,
        ...point(part.anchor.x, part.anchor.y),
        rotation: part.anchor.rotation + rotation,
      },
      mask: await mask(part.mask),
      protection: await mask(part.protection),
      wheel: part.wheel
        ? {
            ...part.wheel,
            cx: point(part.wheel.cx, part.wheel.cy).x,
            cy: point(part.wheel.cx, part.wheel.cy).y,
            rx: part.wheel.rx,
            ry: part.wheel.ry,
            rotation: (part.wheel.rotation || 0) + rotation,
            ...(part.wheel.hubX !== undefined && part.wheel.hubY !== undefined
              ? {
                  hubX: point(part.wheel.hubX, part.wheel.hubY).x,
                  hubY: point(part.wheel.hubX, part.wheel.hubY).y,
                }
              : {}),
          }
        : undefined,
    })),
  );
  const transformDecal = (d: Project["decals"][number]) => ({
    ...d,
    ...point(d.x, d.y),
    rotation: d.rotation + rotation,
  });
  const transformStyles = (styles: Project["styles"]) =>
    Object.fromEntries(
      Object.entries(styles).map(([id, style]) => {
        const a = (rotation * Math.PI) / 180,
          x = style.offsetX || 0,
          y = style.offsetY || 0;
        return [
          id,
          {
            ...style,
            offsetX: x * Math.cos(a) - y * Math.sin(a),
            offsetY: x * Math.sin(a) + y * Math.cos(a),
          },
        ];
      }),
    );
  return {
    ...p,
    source,
    stageFrame: undefined,
    width: c.width,
    height: c.height,
    workWidth: ww,
    workHeight: wh,
    cutout: (await mask(p.cutout))!,
    protection: await mask(p.protection),
    parts,
    styles: transformStyles(p.styles),
    decals: p.decals.map(transformDecal),
    designs: p.designs.map((d) => ({
      ...d,
      styles: transformStyles(d.styles),
      decals: d.decals.map(transformDecal),
    })),
  };
}
export function download(name: string, blob: Blob) {
  const url = URL.createObjectURL(blob),
    a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
export function safeName(s: string) {
  return s.replace(/[^\p{L}\p{N} _-]/gu, "").slice(0, 70) || "bikestyler";
}
