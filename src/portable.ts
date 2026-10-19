import type { Project, CatalogueEntry } from "./types";
import { CATALOGUE } from "./catalogue";
import { readDataURL, maskAlpha } from "./images";
export async function embedEntry(
  entry: CatalogueEntry,
): Promise<CatalogueEntry> {
  const result = { ...entry };
  for (const key of ["asset", "thumbnail"] as const) {
    const url = result[key];
    if (!url || url.startsWith("data:")) continue;
    if (!entry.embeddingAllowed)
      throw new Error(
        `${entry.name}: embedding permission is missing. Use a permitted replacement before exporting.`,
      );
    if (!url.startsWith("/components/") || url.includes(".."))
      throw new Error("Only bundled component assets can be embedded.");
    const response = await fetch(url);
    if (!response.ok)
      throw new Error(`${entry.name}: required offline asset is missing.`);
    const blob = await response.blob();
    if (blob.size > 4 * 1024 * 1024)
      throw new Error("Component image exceeds 4 MB.");
    result[key] = await readDataURL(blob);
  }
  return result;
}
export async function portableProject(p: Project): Promise<Project> {
  const used = new Set(
    [p, ...p.designs].flatMap((d) =>
      Object.values(d.styles)
        .map((s) => s.entryId)
        .filter(Boolean),
    ),
  );
  const custom = new Map(p.customEntries.map((e) => [e.id, e]));
  for (const e of CATALOGUE)
    if (used.has(e.id)) custom.set(e.id, custom.get(e.id) || e);
  return {
    ...p,
    version: 2,
    customEntries: await Promise.all([...custom.values()].map(embedEntry)),
  };
}
export async function fixStageFrame(p: Project): Promise<Project> {
  if (p.stageFrame) return p;
  const a = await maskAlpha(p.cutout, p.workWidth, p.workHeight);
  let x0 = p.workWidth,
    y0 = p.workHeight,
    x1 = 0,
    y1 = 0;
  for (let y = 0; y < p.workHeight; y++)
    for (let x = 0; x < p.workWidth; x++)
      if (a[y * p.workWidth + x] > 30) {
        x0 = Math.min(x, x0);
        y0 = Math.min(y, y0);
        x1 = Math.max(x, x1);
        y1 = Math.max(y, y1);
      }
  if (x1 <= x0 || y1 <= y0)
    return {
      ...p,
      stageFrame: { x: 0, y: 0, width: p.width, height: p.height },
    };
  const s = p.width / p.workWidth;
  return {
    ...p,
    stageFrame: {
      x: x0 * s,
      y: y0 * s,
      width: (x1 - x0) * s,
      height: (y1 - y0) * s,
    },
  };
}
