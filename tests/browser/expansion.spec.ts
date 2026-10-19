import { test, expect } from "@playwright/test";
import fs from "node:fs/promises";

test("product evidence, scoped fit, filter retention and grouped slider undo", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: /Try the practice illustration/ })
    .click();
  await expect(page.locator(".garage")).toBeVisible();
  await expect(page.locator(".save-status")).toHaveText("Saved locally");
  await page
    .getByRole("button", { name: "Catalogue & fit ↗", exact: true })
    .click();
  await page
    .locator(".product-filters select")
    .first()
    .selectOption("brake_levers");
  await page.getByRole("searchbox").fill("S-500");
  await expect(page.locator(".product-card")).toHaveCount(2);
  await page.locator(".product-card").filter({ hasText: "S-500 Road" }).click();
  await expect(page.locator(".product-detail")).toContainText("Check required");
  await expect(page.locator(".product-detail")).toContainText(
    "Generic shape preview",
  );
  await expect(
    page.getByRole("button", { name: "Preview on bicycle" }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Close product details" }).click();
  await expect(page.getByRole("searchbox")).toHaveValue("S-500");
  await page.getByRole("button",{name:"Close catalogue"}).click();
  await page.locator(".part-marker").filter({ hasText: "Front tyre" }).click();
  await page.getByLabel("Search component catalogue").fill("tan");
  await page
    .locator(".card-main")
    .filter({ hasText: "Tan-wall road slick narrow" })
    .click();
  await page.getByText("Placement & overlap", { exact: true }).click();
  const slider = page.getByLabel("Visual size", { exact: true });
  const before = await slider.inputValue();
  await slider.dispatchEvent("pointerdown", { pointerId: 1 });
  for (const n of ["1.05", "1.12", "1.24"]) await slider.fill(n);
  await slider.dispatchEvent("pointerup", { pointerId: 1 });
  await expect(slider).toHaveValue("1.24");
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(slider).toHaveValue(before);
  await page.locator(".part-marker").filter({ hasText: "Frame" }).click();
  await page.locator(".part-marker").filter({ hasText: "Front tyre" }).click();
  await expect(page.getByLabel("Search component catalogue")).toHaveValue(
    "tan",
  );
});

test("two tabs preserve both versions when a stale editor saves", async ({
  page,
  context,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: /Try the practice illustration/ })
    .click();
  await expect(page.locator(".garage")).toBeVisible();
  await expect(page.locator(".save-status")).toHaveText("Saved locally");
  const other = await context.newPage();
  await other.goto("/");
  await expect(other.locator(".garage")).toBeVisible();
  await expect(other.locator(".save-status")).toHaveText("Saved locally");
  await page.getByRole("button", { name: "Forest", exact: true }).click();
  await expect(page.locator(".save-status")).toHaveText("Saved locally");
  await other.getByRole("button", { name: "Copper", exact: true }).click();
  await expect(other.getByRole("alert")).toContainText("Another tab saved");
  await expect(
    other.getByRole("button", { name: "Copper", exact: true }),
  ).toHaveClass(/chosen/);
  await other.getByRole("button", { name: "Save separate copy" }).click();
  await expect(other.locator(".save-status")).toHaveText("Saved locally");
  await page.reload();
  await expect(page.locator(".garage")).toBeVisible();
  const records = await page.evaluate(async () => {
    const { listProjects } = await import("/src/storage.ts");
    return (await listProjects()).map((p) => ({
      name: p.name,
      colour: p.styles.frame?.colour,
    }));
  });
  expect(records).toHaveLength(2);
  expect(new Set(records.map((p) => p.colour))).toEqual(
    new Set(["#2c5749", "#b47951"]),
  );
});

test("v1 migration retains originals, rotated geometry, stable framing and portable assets", async ({
  page,
}) => {
  await page.goto("/");
  const result = await page.evaluate(async () => {
    const { practiceProject } = await import("/src/fixture.ts"),
      { parseProject, validateProjectImages } = await import(
        "/src/validation.ts"
      ),
      { fixStageFrame, portableProject } = await import("/src/portable.ts"),
      { viewTransform, compose } = await import("/src/compositor.ts"),
      { CATALOGUE } = await import("/src/catalogue.ts"),
      { transformPhoto, maskAlpha } = await import("/src/images.ts");
    let p = practiceProject();
    p.version = 1;
    const original = p.original;
    p = parseProject(JSON.stringify(p));
    p = await fixStageFrame(p);
    const a = await viewTransform(p, 1440, 900);
    const beforeSource = await compose(p, "original");
    p.styles = { frame: { colour: "#2c5749" } };
    const afterSource = await compose(p);
    const before = beforeSource
        .getContext("2d")!
        .getImageData(0, 0, p.workWidth, p.workHeight).data,
      after = afterSource
        .getContext("2d")!
        .getImageData(0, 0, p.workWidth, p.workHeight).data;
    let protectedChanges = 0;
    for (const part of p.parts.filter((t) => t.locked)) {
      const mask = await maskAlpha(part.mask, p.workWidth, p.workHeight);
      for (let i = 0; i < mask.length; i++)
        if (mask[i] === 255 && before[i * 4 + 3] === 255)
          for (let k = 0; k < 4; k++)
            if (before[i * 4 + k] !== after[i * 4 + k]) protectedChanges++;
    }
    const frame = await viewTransform(
      { ...p, cutout: p.parts[0].mask! },
      1440,
      900,
    );
    const lever = CATALOGUE.find(
      (e) => e.visualOrigin === "generated_illustration",
    )!;
    p.parts.push({
      id: "test-lever",
      name: "Test lever",
      category: "brake_levers",
      marker: { x: 800, y: 200 },
      anchor: { x: 800, y: 200, width: 100, height: 100, rotation: 0 },
      status: "confirmed",
      locked: false,
      mask: p.parts[0].mask,
    });
    p.styles["test-lever"] = { entryId: lever.id, approvedApproximation: true };
    p.designs.push({
      id: "asset-design",
      name: "Asset variant",
      styles: structuredClone(p.styles),
      decals: [],
      createdAt: p.createdAt,
    });
    const portable = await portableProject(p);
    await validateProjectImages(parseProject(JSON.stringify(portable)));
    const w = p.parts.find((t) => t.wheel)!;
    w.wheel = {
      ...w.wheel!,
      rotation: 25,
      hubX: w.wheel!.cx + 7,
      hubY: w.wheel!.cy + 9,
    };
    const rotated = await transformPhoto(p, 90);
    return {
      version: p.version,
      originalMatches: p.original === original,
      framingSame: JSON.stringify(a) === JSON.stringify(frame),
      asset: portable.customEntries
        .find((e) => e.id === lever.id)
        ?.asset?.startsWith("data:image/"),
      thumbnail: portable.customEntries
        .find((e) => e.id === lever.id)
        ?.thumbnail?.startsWith("data:image/"),
      hub: rotated.parts.find((t) => t.id === w.id)?.wheel,
      expectedHub: { x: p.height - w.wheel.hubY!, y: w.wheel.hubX },
      protectedChanges,
    };
  });
  expect(result.version).toBe(2);
  expect(result.originalMatches).toBe(true);
  expect(result.framingSame).toBe(true);
  expect(result.asset).toBe(true);
  expect(result.thumbnail).toBe(true);
  expect(result.hub?.rotation).toBe(115);
  expect(result.hub?.hubX).toBeCloseTo(result.expectedHub.x);
  expect(result.hub?.hubY).toBeCloseTo(result.expectedHub.y);
  expect(result.protectedChanges).toBe(0);
});

test("production bundle reopens a portable generated asset with the network disabled", async ({
  page,
  context,
  browserName,
}, testInfo) => {
  test.skip(
    browserName === "webkit",
    "Windows WebKit 26 fails inside the engine on reload after context.setOffline(true). Reproduced twice; offline reopening remains unverified in this engine. Chromium and Firefox run this check.",
  );
  test.setTimeout(120000);
  await page.goto("/");
  const portable = await page.evaluate(async () => {
    const { practiceProject } = await import("/src/fixture.ts"),
      { CATALOGUE } = await import("/src/catalogue.ts"),
      { portableProject, fixStageFrame } = await import("/src/portable.ts");
    const p = practiceProject(),
      e = CATALOGUE.find((e) => e.visualOrigin === "generated_illustration")!;
    p.parts.push({
      id: "offline-lever",
      name: "Offline lever",
      category: "brake_levers",
      marker: { x: 800, y: 200 },
      anchor: { x: 800, y: 200, width: 100, height: 130, rotation: 0 },
      status: "confirmed",
      locked: false,
      mask: p.parts.find((t) => t.id === "hoods")!.mask,
    });
    p.styles["offline-lever"] = { entryId: e.id, approvedApproximation: true };
    return await portableProject(await fixStageFrame(p));
  });
  await page.goto(`http://127.0.0.1:${process.env.BIKESTYLER_PREVIEW_PORT || "4173"}/`);
  await page
    .getByLabel("Import portable project")
    .setInputFiles({
      name: "portable.bike.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(portable)),
    });
  await expect(page.locator(".garage")).toBeVisible();
  await expect(page.locator(".save-status")).toHaveText("Saved locally");
  await expect(page.locator(".app-footer")).toContainText("Ready offline", {
    timeout: 45000,
  });
  await page.reload();
  await expect(page.locator(".garage")).toBeVisible();
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator(".garage")).toBeVisible();
  await expect(page.locator(".save-status")).toHaveText("Saved locally");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: /Export PNG/ }).click();
  const file = await download;
  await file.saveAs(testInfo.outputPath("offline-white.png"));
  expect(
    (await fs.stat(testInfo.outputPath("offline-white.png"))).size,
  ).toBeGreaterThan(1000);
  await context.setOffline(false);
});
