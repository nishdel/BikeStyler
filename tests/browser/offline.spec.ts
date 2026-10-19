import { test, expect } from "@playwright/test";
test("production build prepares locally, reloads offline and runs its setup worker", async ({
  page,
  context,
}) => {
  const remote: string[] = [],
    errors: string[] = [];
  page.on("request", (r) => {
    if (
      !r.url().startsWith(`http://127.0.0.1:${process.env.BIKESTYLER_PREVIEW_PORT || "4173"}`) &&
      !r.url().startsWith("data:") &&
      !r.url().startsWith("blob:")
    )
      remote.push(r.url());
  });
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(`http://127.0.0.1:${process.env.BIKESTYLER_PREVIEW_PORT || "4173"}`);
  await expect(page.locator(".app-footer")).toContainText("Ready offline", {
    timeout: 20000,
  });
  await page
    .getByRole("button", { name: /Try the practice illustration/ })
    .click();
  await expect(page.locator(".save-status")).toHaveText("Saved locally");
  await page.getByRole("button", { name: "Forest", exact: true }).click();
  await expect(page.locator(".save-status")).toHaveText("Saved locally");
  await context.setOffline(true);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Atelier 01 · practice illustration" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Forest", exact: true }),
  ).toHaveClass(/chosen/);
  await page.getByRole("button", { name: /Refine cut-out/ }).click();
  await page
    .getByRole("button", { name: "Remove border colours", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Cancel processing" }),
  ).toBeHidden({ timeout: 20000 });
  await expect(page.locator(".toast")).toContainText("Selection ready");
  await page.getByRole("button", { name: "Close setup", exact: true }).click();
  await expect(page.locator(".app-footer")).toContainText("Ready offline");
  expect(remote).toEqual([]);
  expect(errors).toEqual([]);
  await context.setOffline(false);
});
