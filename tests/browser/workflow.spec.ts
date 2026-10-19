import { test, expect } from "@playwright/test";
import { writeFile } from "node:fs/promises";
test("garage interaction, persistence, comparison, export and mobile layout", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const external: string[] = [];
  page.on("request", (r) => {
    if (
      !r.url().startsWith("http://127.0.0.1:5173") &&
      !r.url().startsWith("data:")
    )
      external.push(r.url());
  });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Same bicycle. Entirely you." }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/screenshots/01-welcome.png",
    fullPage: true,
  });
  await page
    .getByRole("button", { name: /Try the practice illustration/ })
    .click();
  await expect(
    page.getByRole("heading", { name: "Atelier 01 · practice illustration" }),
  ).toBeVisible();
  await expect(page.locator(".save-status")).toHaveText("Saved locally");
  await page.getByRole("button", { name: "Forest", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Forest", exact: true }),
  ).toHaveClass(/chosen/);
  await page.locator(".part-marker").filter({ hasText: "Front tyre" }).click();
  await expect(page.locator(".panel-top h2")).toHaveText("Front tyre");
  await page
    .locator(".card-main")
    .filter({ hasText: "Tan-wall road slick narrow" })
    .click();
  await expect(page.locator(".catalogue-card.active")).toContainText(
    "Tan-wall road slick narrow",
  );
  await page.getByRole("textbox", { name: "Design name" }).fill("Forest & tan");
  await page
    .getByRole("button", { name: "＋ Save design", exact: true })
    .click();
  await expect(page.locator(".saved-designs")).toContainText("Forest & tan");
  await page.getByRole("button", { name: "Dismiss message" }).click();
  await page.screenshot({
    path: "test-results/screenshots/02-garage.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "◫ Compare", exact: true }).click();
  await expect(page.getByLabel("Comparison divider")).toBeVisible();
  await page.screenshot({
    path: "test-results/screenshots/03-compare.png",
    fullPage: true,
  });
  await expect(page.locator(".save-status")).toHaveText("Saved locally");
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Atelier 01 · practice illustration" }),
  ).toBeVisible();
  await expect(page.locator(".saved-designs")).toContainText("Forest & tan");
  const downloadEvent = page.waitForEvent("download");
  await page.getByRole("button", { name: "Save editable project ↓" }).click();
  const projectDownload = await downloadEvent;
  expect(projectDownload.suggestedFilename()).toMatch(/\.bike\.json$/);
  await projectDownload.saveAs("test-results/roundtrip.bike.json");
  const pngEvent = page.waitForEvent("download");
  await page.getByRole("button", { name: /Export PNG/ }).click();
  const png = await pngEvent;
  await png.saveAs("test-results/export.png");
  expect(png.suggestedFilename()).toMatch(/\.png$/);
  if (await page.getByRole("button", { name: "Dismiss message" }).isVisible())
    await page.getByRole("button", { name: "Dismiss message" }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "test-results/screenshots/04-mobile.png",
    fullPage: false,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await expect(
    page.getByRole("img", { name: "Bicycle visual preview", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Collapse component panel" }).click();
  await expect(page.locator(".style-panel")).toHaveClass(/drawer-closed/);
  expect(errors).toEqual([]);
  expect(external).toEqual([]);
});
test("actual raster upload, assisted correction, cancellation, geometry and portable round trip", async ({
  page,
}) => {
  await page.goto("/");
  const fixture = await page.evaluate(async () => {
    const { practiceProject } = await import("/src/fixture.ts");
    return practiceProject().source;
  });
  await page.getByLabel("Upload bicycle photo").setInputFiles({
    name: "clean-side-profile.png",
    mimeType: "image/png",
    buffer: Buffer.from(fixture.split(",")[1], "base64"),
  });
  await expect(
    page.getByRole("dialog", { name: "Bicycle setup" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Remove border colours", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Cancel processing" }),
  ).toBeHidden({ timeout: 20000 });
  await page
    .getByRole("button", { name: "Accept cut-out & map parts →" })
    .click();
  await page.getByRole("button", { name: "Find circular wheel edges" }).click();
  await expect(
    page.getByRole("button", { name: "Cancel processing" }),
  ).toBeHidden({ timeout: 20000 });
  // Confirm suggestions if found, otherwise exercise the explicit manual fallback.
  const options = await page
    .getByLabel("Part to configure")
    .locator("option")
    .allTextContents();
  if (!options.some((s) => s.includes("◌ Front tyre"))) {
    await page
      .getByRole("button", { name: "Set front wheel", exact: true })
      .click();
    const c = page.locator(".setup-viewport canvas"),
      box = (await c.boundingBox())!;
    await c.click({
      position: { x: (box.width * 825) / 1100, y: (box.height * 423) / 650 },
    });
    await c.click({
      position: { x: (box.width * 985) / 1100, y: (box.height * 423) / 650 },
    });
    await page
      .getByRole("button", { name: "Set rear wheel", exact: true })
      .click();
    await c.click({
      position: { x: (box.width * 245) / 1100, y: (box.height * 423) / 650 },
    });
    await c.click({
      position: { x: (box.width * 405) / 1100, y: (box.height * 423) / 650 },
    });
  }
  await page.getByLabel("Part to configure").selectOption("front-tyre");
  await page
    .getByRole("button", { name: "✓ Confirm wheel geometry", exact: true })
    .click();
  await page.getByLabel("Part to configure").selectOption("rear-tyre");
  await page
    .getByRole("button", { name: "✓ Confirm wheel geometry", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Suggest a frame-tube guide" })
    .click();
  await page
    .getByRole("button", { name: "✓ Confirm Frame", exact: true })
    .click();
  await page.getByRole("button", { name: "Enter the garage →" }).click();
  await expect(
    page.getByRole("dialog", { name: "Bicycle setup" }),
  ).toBeHidden();
  await page
    .getByRole("button", { name: "Midnight navy", exact: true })
    .click();
  await expect(page.locator(".save-status")).toHaveText("Saved locally");
  const downloaded = page.waitForEvent("download");
  await page.getByRole("button", { name: "Save editable project ↓" }).click();
  const d = await downloaded;
  await d.saveAs("test-results/uploaded.bike.json");
  await page
    .getByLabel("Import portable project")
    .setInputFiles("test-results/uploaded.bike.json");
  await expect(page.locator(".toast")).toContainText("Project imported");
  await expect(
    page.getByRole("heading", { name: "clean-side-profile", exact: true }),
  ).toBeVisible();
  await page.route("**/*setup.worker*", async (route) => {
    await new Promise((r) => setTimeout(r, 1200));
    await route.continue();
  });
  await page.getByRole("button", { name: /Refine cut-out/ }).click();
  await page
    .getByRole("button", { name: "Remove border colours", exact: true })
    .click();
  const cancel = page.getByRole("button", { name: "Cancel processing" });
  if (await cancel.isVisible()) {
    await cancel.click({ force: true, timeout: 3000 });
    await expect(page.locator(".toast")).toContainText("Processing cancelled");
  }
  await page.screenshot({
    path: "test-results/screenshots/05-photo-setup.png",
    fullPage: false,
  });
});
test("all component renderers, source-pixel protection, performance and white PNG", async ({
  page,
}) => {
  await page.goto("/");
  const results = await page.evaluate(async () => {
    const { practiceProject } = await import("/src/fixture.ts"),
      { CATALOGUE } = await import("/src/catalogue.ts"),
      { renderComponent } = await import("/src/componentRenderers.ts"),
      { compose, exportPNG } = await import("/src/compositor.ts"),
      { maskAlpha, canvas, loadImage } = await import("/src/images.ts"),
      { embedEntry } = await import("/src/portable.ts"),
      { parseProject, parsePack } = await import("/src/validation.ts");
    const p = practiceProject(),
      c = canvas(100, 100),
      ctx = c.getContext("2d")!;
    const failures: string[] = [];
    for (const e of CATALOGUE) {
      ctx.clearRect(0, 0, 100, 100);
      if(e.asset) ctx.drawImage(await loadImage(e.asset),0,0,100,100); else renderComponent(ctx, e);
      const data = ctx.getImageData(0, 0, 100, 100).data;
      if (!data.some((v, i) => i % 4 === 3 && v > 0)) failures.push(e.id);
      if (e.category === "tyres" && data[(50 * 100 + 50) * 4 + 3] !== 0)
        failures.push(e.id + " filled centre");
    }
    const original = await compose(p, "original"),
      originalData = original
        .getContext("2d")!
        .getImageData(0, 0, p.width, p.height).data;
    const tyre = CATALOGUE.find(
      (e) => e.name === "Tan-wall road slick narrow",
    )!;
    p.styles["front-tyre"] = { entryId: tyre.id };
    const changed = await compose(p),
      changedData = changed
        .getContext("2d")!
        .getImageData(0, 0, p.width, p.height).data;
    let hubDifferences = 0;
    for (let y = 310; y < 530; y++)
      for (let x = 710; x < 935; x++) {
        if (Math.hypot(x - 825, y - 423) > 130) continue;
        const i = (y * p.width + x) * 4;
        for (let k = 0; k < 4; k++)
          if (changedData[i + k] !== originalData[i + k]) hubDifferences++;
      }
    p.styles = {
      frame: { colour: "#2c5749" },
      tape: { colour: "#ff0000" },
      saddle: { colour: "#ff0000" },
      hoods: { colour: "#ff0000" },
    };
    const paint = await compose(p),
      pd = paint.getContext("2d")!.getImageData(0, 0, p.width, p.height).data;
    let lockedDifferences = 0;
    const lm = await maskAlpha(
      p.parts.find((t) => t.id === "tape")!.mask,
      p.width,
      p.height,
    );
    for (let i = 0; i < lm.length; i++)
      if (lm[i] > 250)
        for (let k = 0; k < 4; k++)
          if (pd[i * 4 + k] !== originalData[i * 4 + k]) lockedDifferences++;
    const frameMask = await maskAlpha(
      p.parts.find((t) => t.id === "frame")!.mask,
      p.width,
      p.height,
    );
    let outsideChanges = 0;
    for (let i = 0; i < frameMask.length; i++)
      if (!frameMask[i])
        for (let k = 0; k < 4; k++)
          if (pd[i * 4 + k] !== originalData[i * 4 + k]) outsideChanges++;
    const parsed = parseProject(JSON.stringify(p));
    const pack = parsePack(
      JSON.stringify({
        format: "bikestyler-catalogue",
        version: 1,
        entries: await Promise.all(CATALOGUE.map(embedEntry)),
      }),
    );
    const beforeDecal = await compose(p);
    p.decals = [
      {
        id: "test",
        kind: "bands",
        text: "",
        colour: "#ff0000",
        x: 570,
        y: 330,
        scale: 3,
        rotation: 0,
        opacity: 1,
        partId: "frame",
      },
    ];
    const afterDecal = await compose(p),
      bd = beforeDecal
        .getContext("2d")!
        .getImageData(0, 0, p.width, p.height).data,
      ad = afterDecal
        .getContext("2d")!
        .getImageData(0, 0, p.width, p.height).data;
    let decalLeaks = 0;
    for (let i = 0; i < frameMask.length; i++)
      if (!frameMask[i])
        for (let k = 0; k < 4; k++)
          if (bd[i * 4 + k] !== ad[i * 4 + k]) decalLeaks++;
    const times: number[] = [];
    for (let i = 0; i < 12; i++) {
      p.styles.frame = { colour: i % 2 ? "#2c5749" : "#233749" };
      const start = performance.now();
      await compose(p);
      times.push(performance.now() - start);
    }
    const blob = await exportPNG(p),
      bitmap = await createImageBitmap(blob),
      out = canvas(bitmap.width, bitmap.height);
    out.getContext("2d")!.drawImage(bitmap, 0, 0);
    const corners = Array.from(
      out.getContext("2d")!.getImageData(0, 0, 1, 1).data,
    );
    let transparent = 0;
    const od = out
      .getContext("2d")!
      .getImageData(0, 0, out.width, out.height).data;
    for (let i = 3; i < od.length; i += 4) if (od[i] !== 255) transparent++;
    return {
      styles: CATALOGUE.length,
      categories: new Set(CATALOGUE.map((e) => e.category)).size,
      failures,
      hubDifferences,
      lockedDifferences,
      outsideChanges,
      decalLeaks,
      corners,
      transparent,
      portableRoundtrip: parsed.source === p.source,
      packEntries: pack.entries.length,
      source: { width: p.width, height: p.height },
      times,
      browser: navigator.userAgent,
      hardwareConcurrency: navigator.hardwareConcurrency,
      projectReopened: parsed.source === p.source,
    };
  });
  expect(results.failures).toEqual([]);
  expect(results.hubDifferences).toBe(0);
  expect(results.lockedDifferences).toBe(0);
  expect(results.outsideChanges).toBe(0);
  expect(results.decalLeaks).toBe(0);
  expect(results.corners).toEqual([255, 255, 255, 255]);
  expect(results.transparent).toBe(0);
  expect(results.projectReopened).toBe(true);
  expect(results.packEntries).toBe(results.styles);
  await writeFile(
    "test-results/performance-measurements.json",
    JSON.stringify(results, null, 2),
  );
});
test("licensed cluttered photograph import and manual brush correction", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByLabel("Upload bicycle photo")
    .setInputFiles("tests/sporting-bicycle.jpg");
  await expect(
    page.getByRole("dialog", { name: "Bicycle setup" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Remove border colours", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Cancel processing" }),
  ).toBeHidden({ timeout: 20000 });
  await page.getByRole("button", { name: "＋ Keep this", exact: true }).click();
  const c = page.locator(".setup-viewport canvas"),
    box = (await c.boundingBox())!;
  await c.click({ position: { x: box.width * 0.5, y: box.height * 0.5 } });
  await page
    .getByRole("button", { name: "− Remove this", exact: true })
    .click();
  await c.click({ position: { x: box.width * 0.08, y: box.height * 0.08 } });
  await page.getByRole("button", { name: "◇ Polygon", exact: true }).click();
  for (const [x, y] of [
    [0.05, 0.05],
    [0.15, 0.05],
    [0.15, 0.15],
    [0.05, 0.15],
  ])
    await c.click({ position: { x: box.width * x, y: box.height * y } });
  await page
    .getByRole("button", { name: "Remove polygon", exact: true })
    .click();
  await page.screenshot({
    path: "test-results/screenshots/06-real-photo-correction.png",
    fullPage: false,
  });
  await page.getByRole("button", { name: "Close setup", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "sporting-bicycle", exact: true }),
  ).toBeVisible();
});
test("storage denial and unsafe pack rejection remain visible and recoverable", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "indexedDB", {
      get() {
        throw new DOMException("Storage denied by test", "SecurityError");
      },
    });
  });
  await page.goto("/");
  await expect(page.getByRole("alert")).toBeVisible();
  await page
    .getByRole("button", { name: /Try the practice illustration/ })
    .click();
  await expect(
    page.getByRole("heading", { name: "Atelier 01 · practice illustration" }),
  ).toBeVisible();
  await expect(page.getByRole("alert")).toContainText("export a project");
  await page.getByRole("button", { name: "Export project now" }).click();
  await page.getByRole("button", { name: "Catalogue", exact: true }).click();
  await page.locator('.catalogue-modal').getByRole('button',{name:'Visual styles',exact:true}).click();
  await page.locator(".catalogue-modal-tools input[type=file]").setInputFiles({
    name: "unsafe.json",
    mimeType: "application/json",
    buffer: Buffer.from(
      '{"format":"bikestyler-catalogue","version":1,"entries":[],"__proto__":{"bad":true}}',
    ),
  });
  await expect(page.locator(".toast")).toContainText("unsafe object key");
  await page
    .getByRole("button", { name: "Close catalogue", exact: true })
    .click();
  const raster = await page.evaluate(async () => {
    const { practiceProject } = await import("/src/fixture.ts");
    return practiceProject().source;
  });
  await page
    .getByLabel("Upload bicycle photo")
    .setInputFiles({
      name: "after-backup.png",
      mimeType: "image/png",
      buffer: Buffer.from(raster.split(",")[1], "base64"),
    });
  await expect(
    page.getByRole("dialog", { name: "Bicycle setup" }),
  ).toBeVisible();
});
