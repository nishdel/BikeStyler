import { describe, it, expect } from "vitest";
import { CATALOGUE } from "../src/catalogue";
import { readFileSync } from 'node:fs';
import {
  parsePack,
  parseProject,
  validateEntry,
  validateDataURL,
} from "../src/validation";
describe("portable data validation", () => {
  it("round-trips every bundled catalogue style as plain data", () => {
    const portable=CATALOGUE.map(entry=>{const result={...entry};for(const key of ['asset','thumbnail'] as const){if(result[key]?.startsWith('/components/'))result[key]='data:image/webp;base64,'+readFileSync('public'+result[key]).toString('base64')}return result});
    const pack = parsePack(
      JSON.stringify({
        format: "bikestyler-catalogue",
        version: 1,
        entries: portable,
      }),
    );
    expect(pack.entries).toEqual(portable);
    expect(pack.entries.length).toBeGreaterThanOrEqual(100);
    expect(
      new Set(pack.entries.map((x) => x.category)).size,
    ).toBeGreaterThanOrEqual(15);
  });
  it("rejects executable renderers and expressions", () => {
    expect(() =>
      validateEntry({ ...CATALOGUE[0], renderer: "eval" }),
    ).toThrow();
    expect(() =>
      validateEntry({ ...CATALOGUE[0], parameters: { width: "alert(1)" } }),
    ).toThrow();
    expect(() =>
      validateEntry({
        ...CATALOGUE[0],
        parameters: { source: "https://evil.example/a.png" },
      }),
    ).toThrow();
  });
  it("rejects SVG, remote image references and oversized data", () => {
    expect(() =>
      validateDataURL("data:image/svg+xml;base64,PHN2Zz4="),
    ).toThrow();
    expect(() => validateDataURL("https://example.com/image.png")).toThrow();
    expect(() =>
      validateDataURL("data:image/png;base64," + "A".repeat(100), false, 30),
    ).toThrow();
  });
  it("rejects prototype keys, duplicates and incompatible schema versions", () => {
    expect(() =>
      parsePack(
        '{"format":"bikestyler-catalogue","version":1,"entries":[],"__proto__":{"x":1}}',
      ),
    ).toThrow();
    expect(() =>
      parsePack(
        JSON.stringify({
          format: "bikestyler-catalogue",
          version: 1,
          entries: [CATALOGUE[0], CATALOGUE[0]],
        }),
      ),
    ).toThrow();
    expect(() =>
      parsePack('{"format":"bikestyler-catalogue","version":99,"entries":[]}'),
    ).toThrow();
  });
  it("rejects malformed projects and invalid number bounds", () => {
    expect(() => parseProject("{")).toThrow();
    expect(() =>
      parseProject(
        JSON.stringify({ format: "bikestyler-project", version: 2 }),
      ),
    ).toThrow();
    expect(() =>
      validateEntry({ ...CATALOGUE[0], parameters: { width: Infinity } }),
    ).toThrow();
    expect(() =>
      validateEntry({
        ...CATALOGUE[0],
        anchors: [{ name: "anchor", x: 1e6, y: 0 }],
      }),
    ).toThrow();
  });
});
