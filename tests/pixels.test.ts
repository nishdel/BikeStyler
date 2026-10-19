import { describe, it, expect } from "vitest";
import {
  backgroundMask,
  annulusAlpha,
  effectiveMask,
  recolourPixels,
  refineMask,
  suggestWheels,
} from "../src/pixels";
const rgb = (rows: number[][]) =>
  new Uint8ClampedArray(rows.flatMap((p) => [...p, 255]));
describe("conventional colour and mask operations", () => {
  it("reaches enclosed background holes without treating a wheel disc as solid", () => {
    const data = rgb(
      Array.from({ length: 25 }, (_, i) =>
        [6, 7, 8, 11, 13, 16, 17, 18].includes(i)
          ? [20, 20, 20]
          : [240, 240, 240],
      ),
    );
    const all = backgroundMask(data, 5, 5, 10, [[240, 240, 240]]);
    expect(all[12]).toBe(0);
    expect(all[7]).toBe(255);
    const connected = backgroundMask(data, 5, 5, 10, [[240, 240, 240]], true);
    expect(connected[12]).toBe(255);
    expect(connected[0]).toBe(0);
  });
  it("selects a clicked connected region separately from similar regions", () => {
    const data = rgb([
      [240, 240, 240],
      [0, 0, 0],
      [240, 240, 240],
      [240, 240, 240],
      [0, 0, 0],
      [240, 240, 240],
    ]);
    const a = backgroundMask(data, 3, 2, 5, [[240, 240, 240]], true, {
      x: 0,
      y: 0,
    });
    expect([...a]).toEqual([0, 255, 255, 0, 255, 255]);
  });
  it("keeps tyre masks annular and leaves rim/spoke/hub pixels alone", () => {
    const a = annulusAlpha(120, 120, {
      cx: 60,
      cy: 60,
      rx: 50,
      ry: 45,
      innerRatio: 0.9,
      rimRatio: 0.85,
    });
    expect(a[60 * 120 + 60]).toBe(0);
    expect(a[60 * 120 + 100]).toBe(0);
    expect(a[60 * 120 + 108]).toBeGreaterThan(250);
    expect(a[60 * 120 + 114]).toBe(0);
  });
  it("uses cut-out and protected details to constrain effective masks", () => {
    expect([
      ...effectiveMask(
        new Uint8ClampedArray([255, 255, 255, 0]),
        new Uint8ClampedArray([255, 0, 255, 255]),
        new Uint8ClampedArray([0, 0, 255, 0]),
      ),
    ]).toEqual([255, 0, 0, 0]);
  });
  it("changes only selected source pixels and retains lightness variation", () => {
    const source = rgb([
        [240, 240, 240],
        [80, 70, 60],
        [150, 140, 130],
        [200, 220, 240],
      ]),
      m = new Uint8ClampedArray([0, 255, 255, 0]);
    const result = recolourPixels(source, m, "#204e3e");
    expect([...result.slice(0, 4)]).toEqual([...source.slice(0, 4)]);
    expect([...result.slice(12)]).toEqual([...source.slice(12)]);
    expect(result[9]).toBeGreaterThan(result[5]);
    expect(source[5]).toBe(70);
  });
  it("is deterministic across repeated non-destructive colour selections", () => {
    const source = rgb([[100, 120, 130]]),
      m = new Uint8ClampedArray([255]);
    const a = recolourPixels(source, m, "#aabbcc", "metallic");
    recolourPixels(source, m, "#112233", "gloss");
    expect([...recolourPixels(source, m, "#aabbcc", "metallic")]).toEqual([
      ...a,
    ]);
  });
  it("edge refinement is explicit and bounded to one pixel", () => {
    const a = new Uint8ClampedArray(25);
    a[12] = 255;
    const b = refineMask(a, 5, 5, "expand");
    expect(b[12]).toBe(255);
    expect(b[11]).toBe(255);
    expect(b[10]).toBe(0);
    expect(a[11]).toBe(0);
  });
  it("suggests circles from actual raster edges and rejects a featureless image", () => {
    const w = 320,
      h = 200,
      d = new Uint8ClampedArray(w * h * 4).fill(255);
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++)
        if (
          [75, 240].some((cx) => Math.abs(Math.hypot(x - cx, y - 132) - 53) < 3)
        ) {
          const i = (y * w + x) * 4;
          d[i] = d[i + 1] = d[i + 2] = 25;
        }
    const result = suggestWheels(d, w, h);
    expect(result).toHaveLength(2);
    expect(Math.abs(result[0].cx - 75)).toBeLessThan(8);
    expect(Math.abs(result[1].cx - 240)).toBeLessThan(8);
    expect(
      suggestWheels(new Uint8ClampedArray(w * h * 4).fill(255), w, h),
    ).toHaveLength(0);
  });
});
