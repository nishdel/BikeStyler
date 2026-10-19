import { test, expect } from "@playwright/test";
import { readFile, writeFile } from "node:fs/promises";

test("licensed side photograph: manual setup, actual-photo styling, save, reopen and export", async ({
  page,
}) => {
  test.setTimeout(120000);
  await page.goto("/");
  await page
    .getByLabel("Upload bicycle photo")
    .setInputFiles("tests/raleigh-road-bike.jpg");
  await expect(
    page.getByRole("dialog", { name: "Bicycle setup" }),
  ).toBeVisible();
  const c = page.locator(".setup-viewport canvas");
  // Manually annotated locations in the 1984 × 1273 inspection image.
  // These are test inputs, never detection results or bundled app templates.
  const click = async (x: number, y: number) => {
    const b = (await c.boundingBox())!;
    await c.click({
      position: { x: (b.width * x) / 1984, y: (b.height * y) / 1273 },
    });
  };
  const wait = async () => {
    await expect(
      page.getByRole("button", { name: "Cancel processing" }),
    ).toBeHidden({ timeout: 20000 });
    await expect(page.locator(".save-status")).toHaveText("Saved locally");
  };
  await page
    .getByRole("button", { name: "Remove border colours", exact: true })
    .click();
  await wait();
  await page
    .getByRole("button", { name: "⌾ Sample background", exact: true })
    .click();
  for (const point of [
    [1800, 220],
    [1000, 600],
    [1000, 1180],
  ]) {
    await click(...(point as [number, number]));
    await wait();
  }
  await page
    .getByRole("button", { name: "Accept cut-out & map parts →" })
    .click();
  for (const [side, x, y, rx, ry] of [
    ["front", 1447, 831, 322, 338],
    ["rear", 420, 790, 385, 375],
  ] as const) {
    await page
      .getByRole("button", { name: `Set ${side} wheel`, exact: true })
      .click();
    await click(x, y);
    await click(x + rx, y);
    await page
      .getByLabel("Minor radius", { exact: true })
      .fill(String(Math.round((ry * 1367) / 1273)));
    await page.getByLabel("Tyre inner boundary").fill("0.95");
    await page
      .getByRole("button", { name: "✓ Confirm wheel geometry", exact: true })
      .click();
  }
  await page.getByLabel("Part to configure").selectOption("frame");
  await page.getByRole("button", { name: "◇ Polygon", exact: true }).click();
  for (const polygon of [
    [
      [725, 276],
      [1298, 309],
      [1298, 334],
      [732, 303],
    ],
    [
      [707, 300],
      [733, 295],
      [868, 843],
      [843, 851],
    ],
    [
      [1302, 405],
      [1326, 420],
      [940, 803],
      [917, 783],
    ],
    [
      [440, 775],
      [856, 850],
      [853, 872],
      [436, 802],
    ],
    [
      [697, 310],
      [710, 320],
      [457, 769],
      [444, 760],
    ],
  ]) {
    for (const [x, y] of polygon) await click(x, y);
    await page
      .getByRole("button", { name: "Keep polygon", exact: true })
      .click();
  }
  await page
    .getByRole("button", { name: "✓ Confirm Frame", exact: true })
    .click();
  await page.getByRole("button", { name: "Enter the garage →" }).click();
  await page.getByRole("button", { name: "Forest", exact: true }).click();
  await page.locator(".part-marker").filter({ hasText: "Front tyre" }).click();
  await page
    .locator(".card-main")
    .filter({ hasText: "Tan-wall road slick narrow" })
    .click();
  await page
    .getByRole("textbox", { name: "Design name" })
    .fill("Photo · forest & tan");
  await page
    .getByRole("button", { name: "＋ Save design", exact: true })
    .click();
  await expect(page.locator(".save-status")).toHaveText("Saved locally");
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "raleigh-road-bike", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".saved-designs")).toContainText(
    "Photo · forest & tan",
  );
  const projectEvent = page.waitForEvent("download");
  await page.getByRole("button", { name: "Save editable project ↓" }).click();
  await (await projectEvent).saveAs("test-results/real-photo.bike.json");
  const p = JSON.parse(
    await readFile("test-results/real-photo.bike.json", "utf8"),
  );
  expect(p.original).toBe(
    "data:image/jpeg;base64," +
      (await readFile("tests/raleigh-road-bike.jpg")).toString("base64"),
  );
  expect(p.parts.find((t: any) => t.id === "frame").status).toBe("confirmed");
  expect(p.styles.frame.colour).toBe("#2c5749");
  expect(p.styles["front-tyre"].entryId).toBeTruthy();
  await writeFile(
    "test-results/photo-workflow-measurements.json",
    JSON.stringify(
      {
        source: { width: p.width, height: p.height },
        working: { width: p.workWidth, height: p.workHeight },
        setupProcessingMs: p.metrics.setupMs,
        method:
          "Border/sample colour selection; manually annotated wheels and frame polygons through the UI. Rough cut-out requires further detail correction; not automatic semantic segmentation.",
        sourcePreserved: true,
        savedDesigns: p.designs.length,
      },
      null,
      2,
    ),
  );
  const pngEvent = page.waitForEvent("download");
  await page.getByRole("button", { name: /Export PNG/ }).click();
  await (await pngEvent).saveAs("test-results/real-photo.png");
  if (await page.getByRole("button", { name: "Dismiss message" }).isVisible())
    await page.getByRole("button", { name: "Dismiss message" }).click();
  await page.screenshot({
    path: "test-results/screenshots/07-real-photo-garage.png",
    fullPage: true,
  });
});
