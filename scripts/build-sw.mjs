import { readdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
const html = await readFile("dist/index.html", "utf8");
await writeFile(
  "dist/index.html",
  html.replace(
    "<head>",
    `<head><meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; worker-src 'self' blob:; connect-src 'self' data: blob:; object-src 'none'; base-uri 'none'">`,
  ),
);
const files = (await readdir("dist", { recursive: true }))
  .filter((f) => /\.(html|js|css|svg|wasm|png|webp|jpg|json|md)$/.test(f) && f !== "sw.js")
  .map((f) => "/" + f.replaceAll("\\", "/"));
const hash = createHash("sha256");
for (const f of files) hash.update(await readFile("dist" + f));
const version = "bikestyler-" + hash.digest("hex").slice(0, 16);
await writeFile(
  "dist/sw.js",
  `const CACHE=${JSON.stringify(version)};const ASSETS=${JSON.stringify(["/", ...files])};
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS))));
// No skipWaiting: updates never replace an active version beneath unsaved work.
self.addEventListener('activate',e=>e.waitUntil(Promise.all([caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('bikestyler-')&&k!==CACHE).map(k=>caches.delete(k)))),self.clients.claim()])));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET'||new URL(e.request.url).origin!==self.location.origin)return;e.respondWith(caches.open(CACHE).then(async c=>(await c.match(e.request,{ignoreSearch:true}))||fetch(e.request)));});
`,
);
console.log("Offline bundle:", files.length, "local assets;", version);
