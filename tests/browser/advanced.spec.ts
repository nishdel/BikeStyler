import { test, expect } from "@playwright/test";
import { writeFile } from "node:fs/promises";
test("full-wheel suppression, protected overlaps, narrow tyre width and source transforms", async ({
  page,
}) => {
  await page.goto("/");
  const result = await page.evaluate(async () => {
    const { practiceProject } = await import("/src/fixture.ts"),
      { compose } = await import("/src/compositor.ts"),
      { CATALOGUE } = await import("/src/catalogue.ts"),
      { maskAlpha, transformPhoto } = await import("/src/images.ts");
    const p = practiceProject(),
      base = await compose(p, "original"),
      bd = base.getContext("2d")!.getImageData(0, 0, p.width, p.height).data;
    const blade = CATALOGUE.find(
      (e) => e.category === "wheels" && e.parameters.form === "blade",
    )!;
    p.styles = { "front-wheel": { entryId: blade.id, colour: "#233749" } };
    const wheel = await compose(p),
      wd = wheel.getContext("2d")!.getImageData(0, 0, p.width, p.height).data;
    const pm = await Promise.all(
      p.parts
        .filter((t) =>
          ["frame", "fork", "brakes", "seatposts", "pedals"].includes(
            t.category,
          ),
        )
        .map((t) => maskAlpha(t.mask, p.width, p.height)),
    );
    let protectedChanges = 0,
      removedSpokePixels = 0;
    for (let i = 0; i < p.width * p.height; i++) {
      if (pm.some((m) => m[i] === 255) && bd[i * 4 + 3] === 255)
        for (let k = 0; k < 4; k++)
          if (wd[i * 4 + k] !== bd[i * 4 + k]) protectedChanges++;
      const x = i % p.width,
        y = Math.floor(i / p.width),
        r = Math.hypot(x - 825, y - 423);
      if (
        r > 20 &&
        r < 138 &&
        !pm.some((m) => m[i]) &&
        bd[i * 4 + 3] > 200 &&
        wd[i * 4 + 3] === 0
      )
        removedSpokePixels++;
    }
    const tyre = CATALOGUE.find(
      (e) => e.category === "tyres" && e.parameters.sidewall,
    )!;
    p.styles = { "front-tyre": { entryId: tyre.id, scale: 0.5 } };
    const narrow = await compose(p),
      nd = narrow.getContext("2d")!.getImageData(0, 0, p.width, p.height).data;
    let innerChanges = 0;
    for (let y = 300; y < 545; y++)
      for (let x = 700; x < 950; x++)
        if (Math.hypot(x - 825, y - 423) < 140) {
          const i = (y * p.width + x) * 4;
          for (let k = 0; k < 4; k++)
            if (nd[i + k] !== bd[i + k]) innerChanges++;
        }
    p.styles = { "front-spokes": { colour: "#ff0000" } };
    const coloured = await compose(p),
      cd = coloured
        .getContext("2d")!
        .getImageData(0, 0, p.width, p.height).data;
    let recolourOverlapChanges = 0;
    for (let i = 0; i < p.width * p.height; i++)
      if (pm.some((m) => m[i] === 255) && bd[i * 4 + 3] === 255)
        for (let k = 0; k < 4; k++)
          if (cd[i * 4 + k] !== bd[i * 4 + k]) recolourOverlapChanges++;
    p.styles = {
      frame: { colour: "#233749" },
      saddle: { offsetX: 10, offsetY: 20 },
    };
    const original = p.original,
      m = p.parts.find((t) => t.id === "frame")!.marker;
    const rotated = await transformPhoto(p, 90),
      rm = rotated.parts.find((t) => t.id === "frame")!.marker;
    const cropped = await transformPhoto(p, 0, {
        x: 80,
        y: 80,
        width: 950,
        height: 550,
      }),
      cm = cropped.parts.find((t) => t.id === "frame")!.marker;
    return {
      protectedChanges,
      recolourOverlapChanges,
      removedSpokePixels,
      innerChanges,
      rotationAligned:
        Math.abs(rm.x - (p.height - m.y)) < 0.01 && Math.abs(rm.y - m.x) < 0.01,
      rotatedOffsets: rotated.styles.saddle,
      cropAligned: cm.x === m.x - 80 && cm.y === m.y - 80,
      originalPreserved:
        original === rotated.original && original === cropped.original,
    };
  });
  expect(result.protectedChanges).toBe(0);
  expect(result.recolourOverlapChanges).toBe(0);
  expect(result.removedSpokePixels).toBeGreaterThan(200);
  expect(result.innerChanges).toBe(0);
  expect(result.rotationAligned).toBe(true);
  expect(result.cropAligned).toBe(true);
  expect(result.originalPreserved).toBe(true);
  expect(result.rotatedOffsets.offsetX).toBeCloseTo(-20);
  expect(result.rotatedOffsets.offsetY).toBeCloseTo(10);
});
test("JPEG EXIF orientation, PNG/WebP imports and predecode invalid dimension rejection", async ({
  page,
}) => {
  await page.goto("/");
  const result = await page.evaluate(async () => {
    const { canvas, importPhoto } = await import("/src/images.ts");
    const c = canvas(240, 120),
      ctx = c.getContext("2d")!;
    ctx.fillStyle = "#ce7d41";
    ctx.fillRect(0, 0, 240, 120);
    const jpeg = await new Promise<Blob>((r) =>
      c.toBlob((b) => r(b!), "image/jpeg"),
    );
    const bytes = new Uint8Array(await jpeg.arrayBuffer());
    const exif = new Uint8Array([
      255, 225, 0, 34, 69, 120, 105, 102, 0, 0, 77, 77, 0, 42, 0, 0, 0, 8, 0, 1,
      1, 18, 0, 3, 0, 0, 0, 1, 0, 6, 0, 0, 0, 0, 0, 0,
    ]);
    const exifBytes = new Uint8Array(bytes.length + exif.length);
    exifBytes.set(bytes.slice(0, 2));
    exifBytes.set(exif, 2);
    exifBytes.set(bytes.slice(2), 2 + exif.length);
    const oriented = await importPhoto(
      new File([exifBytes], "rotated.jpg", { type: "image/jpeg" }),
    );
    const formats = [];
    for (const type of ["image/png", "image/webp"]) {
      const blob = await new Promise<Blob>((r) => c.toBlob((b) => r(b!), type));
      const p = await importPhoto(
        new File([blob], "photo." + type.split("/")[1], { type }),
      );
      formats.push({ type, width: p.width, height: p.height });
    }
    let invalid = false;
    try {
      await importPhoto(
        new File(["not an image"], "bad.png", { type: "image/png" }),
      );
    } catch {
      invalid = true;
    }
    return { width: oriented.width, height: oriented.height, formats, invalid };
  });
  expect(result.width).toBe(120);
  expect(result.height).toBe(240);
  expect(result.formats.every((f) => f.width === 240 && f.height === 120)).toBe(
    true,
  );
  expect(result.invalid).toBe(true);
});
test("cached edit-to-next-frame latency, keyboard undo and saved design comparison", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: /Try the practice illustration/ })
    .click();
  await expect(
    page.getByRole("heading", { name: "Atelier 01 · practice illustration" }),
  ).toBeVisible();
  await expect(page.locator(".save-status")).toHaveText("Saved locally");
  for (const name of [
    "Forest",
    "Burgundy",
    "Sage",
    "Copper",
    "Midnight navy",
    "Forest",
  ]) {
    const before = await page.evaluate(
      () =>
        performance.getEntriesByName("BikeStyler edit to next frame").length,
    );
    await page.getByRole("button", { name, exact: true }).click();
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            performance.getEntriesByName("BikeStyler edit to next frame")
              .length,
        ),
      )
      .toBeGreaterThan(before);
  }
  const measures = await page.evaluate(() => ({
    browser: navigator.userAgent,
    source: "1100 × 650 deterministic practice raster",
    metric:
      "UI colour action to next animation frame after preview canvas draw",
    milliseconds: performance
      .getEntriesByName("BikeStyler edit to next frame")
      .map((e) => e.duration),
  }));
  await writeFile(
    "test-results/visible-latency-measurements.json",
    JSON.stringify(measures, null, 2),
  );
  await page.getByRole("textbox", { name: "Design name" }).fill("Forest one");
  await page
    .getByRole("button", { name: "＋ Save design", exact: true })
    .click();
  await page.getByRole("button", { name: "Copper", exact: true }).click();
  await page.getByRole("textbox", { name: "Design name" }).fill("Copper two");
  await page
    .getByRole("button", { name: "＋ Save design", exact: true })
    .click();
  await page.getByRole("button", { name: "◫ Compare", exact: true }).click();
  await page
    .getByRole("combobox", { name: "Left", exact: true })
    .selectOption({ label: "Forest one" });
  await page
    .getByRole("combobox", { name: "Right", exact: true })
    .selectOption({ label: "Copper two" });
  await expect(page.locator(".compare-label.left")).toHaveText("Forest one");
  await expect(page.locator(".compare-label.right")).toHaveText("Copper two");
  await page.getByRole("button", { name: "Style", exact: true }).click();
  await page
    .getByRole("button", { name: "Reset this part", exact: false })
    .click();
  await expect(
    page.getByRole("button", { name: "Copper", exact: true }),
  ).not.toHaveClass(/chosen/);
  await page.keyboard.press("Control+z");
  await expect(
    page.getByRole("button", { name: "Copper", exact: true }),
  ).toHaveClass(/chosen/);
});
