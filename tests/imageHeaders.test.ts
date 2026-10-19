import { it, expect } from "vitest";
import { rasterDimensions, checkRasterDimensions } from "../src/imageHeaders";
it("reads PNG header dimensions before allocating a decoded raster", () => {
  const b = new Uint8Array(24);
  b.set([137, 80, 78, 71]);
  const v = new DataView(b.buffer);
  v.setUint32(16, 1600);
  v.setUint32(20, 1000);
  expect(rasterDimensions(b.buffer, "image/png")).toEqual({
    width: 1600,
    height: 1000,
  });
  v.setUint32(16, 100000);
  expect(() =>
    checkRasterDimensions(rasterDimensions(b.buffer, "image/png")),
  ).toThrow();
});
it("reads JPEG frame dimensions and rejects malformed segment lengths", () => {
  const b = new Uint8Array([
    255, 216, 255, 192, 0, 11, 8, 1, 44, 2, 88, 1, 0, 0, 0,
  ]);
  expect(rasterDimensions(b.buffer, "image/jpeg")).toEqual({
    width: 600,
    height: 300,
  });
  b[5] = 0;
  expect(rasterDimensions(b.buffer, "image/jpeg")).toBeNull();
  expect(() => checkRasterDimensions(null)).toThrow();
});
it("reads extended WebP dimensions", () => {
  const b = new Uint8Array(30);
  b.set([82, 73, 70, 70], 0);
  b.set([87, 69, 66, 80], 8);
  b.set([86, 80, 56, 88], 12);
  b[24] = 255;
  b[25] = 3;
  b[27] = 255;
  b[28] = 1;
  expect(rasterDimensions(b.buffer, "image/webp")).toEqual({
    width: 1024,
    height: 512,
  });
});
