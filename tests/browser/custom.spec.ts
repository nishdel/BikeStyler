import { test, expect } from "@playwright/test";
test("custom raster anchors and assets survive project and catalogue round trips", async ({
  page,
}) => {
  await page.goto("/");
  const result = await page.evaluate(async () => {
    const { practiceProject } = await import("/src/fixture.ts"),
      { canvas, alphaURL } = await import("/src/images.ts"),
      { compose } = await import("/src/compositor.ts"),
      { parseProject, parsePack, validateProjectImages } = await import(
        "/src/validation.ts"
      );
    const p = practiceProject(),
      asset = canvas(40, 40),
      ctx = asset.getContext("2d")!;
    ctx.fillStyle = "#ff0000";
    ctx.fillRect(0, 0, 20, 20);
    const entry = {
      id: "custom-fixture",
      category: "bottles",
      name: "Custom fixture",
      description: "Deterministic custom raster fixture.",
      tags: ["custom"],
      renderer: "asset",
      parameters: {},
      colours: [],
      anchors: [{ name: "attachment", x: 0, y: 0 }],
      view: "side",
      orientation: "both",
      licence: "CC0-1.0",
      provenance: "Original test artwork",
      limitations: ["Test only"],
      asset: asset.toDataURL(),
      custom: true,
    };
    p.customEntries = [entry];
    p.parts.push({
      id: "custom-part",
      name: "New bottle",
      category: "bottles",
      marker: { x: 550, y: 90 },
      anchor: { x: 550, y: 90, width: 100, height: 100, rotation: 0 },
      status: "confirmed",
      locked: false,
      mask: alphaURL(
        new Uint8ClampedArray(p.width * p.height),
        p.width,
        p.height,
      ),
    });
    p.styles["custom-part"] = {
      entryId: entry.id,
      approvedApproximation: true,
    };
    const portable = parseProject(JSON.stringify(p));
    await validateProjectImages(portable);
    const pack = parsePack(
      JSON.stringify({
        format: "bikestyler-catalogue",
        version: 1,
        entries: [entry],
      }),
    );
    const out = await compose(portable);
    const pixel = Array.from(
      out.getContext("2d")!.getImageData(555, 95, 1, 1).data,
    );
    return {
      pixel,
      assetRoundtrip:
        portable.customEntries[0].asset === entry.asset &&
        pack.entries[0].asset === entry.asset,
      anchorRoundtrip: pack.entries[0].anchors[0].x === 0,
      sourcePreserved: portable.original === p.original,
    };
  });
  expect(result.pixel).toEqual([255, 0, 0, 255]);
  expect(result.assetRoundtrip).toBe(true);
  expect(result.anchorRoundtrip).toBe(true);
  expect(result.sourcePreserved).toBe(true);
});
