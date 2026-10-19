import { defineConfig, devices } from "@playwright/test";
import { fileURLToPath } from "node:url";
process.env.PLAYWRIGHT_BROWSERS_PATH ||= fileURLToPath(
  new URL("./.cache/browsers", import.meta.url),
);
const devPort = process.env.BIKESTYLER_TEST_PORT || "5173";
const previewPort = process.env.BIKESTYLER_PREVIEW_PORT || "4173";
export default defineConfig({
  testDir: "tests/browser",
  timeout: 60000,
  expect: { timeout: 15000 },
  fullyParallel: false,
  workers: 1,
  reporter: [
    ["list"],
    ["json", { outputFile: "test-results/browser-results.json" }],
  ],
  use: {
    baseURL: `http://127.0.0.1:${devPort}`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "firefox",
      testMatch: ["**/expansion.spec.ts", "**/realism.spec.ts", "**/photographic.spec.ts", "**/catalogue-mobile.spec.ts"],
      use: {
        ...devices["Desktop Firefox"],
        viewport: { width: 1440, height: 1000 },
      },
    },
    {
      name: "webkit",
      testMatch: ["**/expansion.spec.ts", "**/realism.spec.ts", "**/photographic.spec.ts", "**/catalogue-mobile.spec.ts"],
      use: {
        ...devices["Desktop Safari"],
        viewport: { width: 1440, height: 1000 },
      },
    },
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 1000 },
      },
    },
  ],
  webServer: [
    {
      command: `npm run dev -- --port ${devPort}`,
      url: `http://127.0.0.1:${devPort}`,
      reuseExistingServer: !process.env.CI,
      timeout: 30000,
    },
    {
      command: `npm run preview -- --port ${previewPort} --strictPort`,
      url: `http://127.0.0.1:${previewPort}`,
      reuseExistingServer: !process.env.CI,
      timeout: 30000,
    },
  ],
});
