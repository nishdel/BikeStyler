# Development and local operation

Use Node.js **24.x** (the supported/tested runtime line), its bundled npm, Git and a current desktop browser. No API keys, model runtime, Python, database server or private configuration are required. Install from the checked-in lockfile with `npm ci`; avoid changing dependency versions incidentally.

| Command | Purpose |
| --- | --- |
| `npm run dev` | Vite development server on loopback, normally port 5173 |
| `npm run typecheck` | TypeScript project checks |
| `npm test` | Vitest unit checks |
| `npm run build` | TypeScript, Vite bundle and offline service worker |
| `npm run preview` | Serve the built app on loopback, normally port 4173 |
| `npm run catalogue:build` | Validate/merge research inputs and regenerate product data/counts |
| `npm run test:browser` | Playwright browser suite; build first |

Stop a foreground server with Ctrl+C. To use another port, pass `-- --port 5174` to development or `-- --port 4174 --strictPort` to preview. The app's storage is scoped to the browser and origin: export/import a portable project to move between ports or browsers.

## Browser tests

```sh
npm ci
npx playwright install --with-deps chromium firefox webkit
npm run typecheck
npm test
npm run build
npm run test:browser
```

The Playwright config defaults to `.cache/browsers`; use `PLAYWRIGHT_BROWSERS_PATH=.cache/browsers` for the installation command (PowerShell: `$env:PLAYWRIGHT_BROWSERS_PATH='.cache/browsers'`). A pre-set `PLAYWRIGHT_BROWSERS_PATH` is respected. Playwright's Linux system dependencies require the privileges its installer describes.

`BIKESTYLER_TEST_PORT` and `BIKESTYLER_PREVIEW_PORT` select isolated test ports. `CI=true` prevents reuse of an unrelated server. Tests use disposable browser contexts and public fixture data. Diagnostic traces remain ignored locally and are not uploaded by CI.

## Offline operation and privacy

Package installation and Playwright browser installation require downloads unless already cached. The built app serves its fonts through system font stacks and its images/scripts locally. The service worker precaches the build and bundled assets on the first successful production load; wait for **Ready offline**. That initial cache needs enough browser storage and a complete response from the local server.

After caching, editing and production reload can work with the network disabled in supported engines. Keep the preview server running for reliable reopening of the same local URL. Browser storage eviction, private browsing, a new origin or an interrupted first cache can prevent offline reopening. A new version waits for old tabs to close rather than replacing an active editor.

Catalogue source links deliberately open external websites when followed; those pages require connectivity and have their own policies. The app does not fetch product photographs on demand. No application AI inference or cloud upload is part of editing. The public sample is already sanitized, but importing your own original photo retains that image in your local portable project.
