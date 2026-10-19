import { describe, it, expect } from "vitest";
import { PRODUCT_DATA } from "../src/products";
import {
  validateProductDataset,
  mergeProductDatasets,
  parseProductPack,
} from "../src/productValidation";
import { checkCompatibility } from "../src/compatibility";
import { matchingSelections, productForPart } from "../src/productVisuals";
import type { Part } from "../src/types";
import type { ProductSelection } from "../src/productTypes";
describe("sourced product identity and fit evidence", () => {
  it("validates all installed source references and keeps ROAD and AERO separate", () => {
    const data = validateProductDataset(PRODUCT_DATA);
    expect(data.products.length).toBeGreaterThanOrEqual(100);
    expect(data.products.reduce((n, p) => n + p.variants.length, 0)).toBeGreaterThanOrEqual(41);
    const road = data.products.find((p) =>
      p.facts.some((f) => String(f.value) === "BL-500-ROAD-A1"),
    );
    const aero = data.products.find((p) =>
      p.facts.some((f) => String(f.value) === "BL-500-AERO-A1"),
    );
    expect(road).toBeDefined();
    expect(aero).toBeDefined();
    expect(road?.id).not.toBe(aero?.id);
    expect(data.products.every((p) => p.previewStatus === "unavailable")).toBe(
      true,
    );
  });
  it("filters variants against confirmed values without treating unknowns as matches",()=>{
    const source=PRODUCT_DATA.sources[0];
    const product={...PRODUCT_DATA.products[0],category:'seatposts',facts:[],variants:[27.2,31.6].map(value=>({id:`diameter-${value}`,label:String(value),sourceIds:[source.id],facts:[{key:'seatpostDiameter',value,unit:'mm',scope:'variant',sourceId:source.id,statement:'Nominal diameter'}]}))};
    const data={...PRODUCT_DATA,products:[product]};
    const value={value:27.2,unit:'mm',status:'confirmed' as const,evidence:'User entry',recordedAt:'2026-10-18'};
    expect(matchingSelections(product,data,{})).toHaveLength(0);
    expect(matchingSelections(product,data,{seatpostDiameter:{...value,status:'provisional'}})).toHaveLength(0);
    expect(matchingSelections(product,data,{seatpostDiameter:value}).map(s=>s.variantId)).toEqual(['diameter-27.2']);
    expect(matchingSelections(product,data,{seatpostDiameter:{...value,value:26}})).toHaveLength(0);
  });
  it("does not offer front-only products for a rear wheel",()=>{
    const front={...PRODUCT_DATA.products[0],category:'wheelsets',model:'Enterprise front wheel',tags:['front']};
    const part={id:'rear-wheel',category:'wheels',wheel:{cx:0,cy:0,rx:10,ry:10,innerRatio:.9,rimRatio:.8}} as Part;
    expect(productForPart(front,part)).toBe(false);
    expect(productForPart(front,{...part,id:'front-wheel'})).toBe(true);
    expect(productForPart({...front,model:'Road wheelset',tags:[]},part)).toBe(true);
    const pair={...front,model:'Road wheelset',tags:[],variants:[{id:'front',label:'21 mm front · 5/100 mm',facts:[],sourceIds:[]},{id:'rear',label:'21 mm rear · 5/130 mm',facts:[],sourceIds:[]}]};
    expect(productForPart(pair,part,'front')).toBe(false);
    expect(productForPart(pair,part,'rear')).toBe(true);
  });
  it("rejects duplicate or conflicting IDs, missing evidence and unsafe packs", () => {
    const bad = structuredClone(PRODUCT_DATA);
    bad.products.push(bad.products[0]);
    expect(() => validateProductDataset(bad)).toThrow(/duplicate/);
    const changed = structuredClone(PRODUCT_DATA);
    changed.products[0].model += " changed";
    expect(() => mergeProductDatasets(PRODUCT_DATA, changed)).toThrow(
      /conflicts/,
    );
    expect(() =>
      parseProductPack(
        '{"format":"bikestyler-products","data":{"__proto__":{}}}',
      ),
    ).toThrow();
    const missing = structuredClone(PRODUCT_DATA);
    missing.products[0].facts[0].sourceId = "absent";
    expect(() => validateProductDataset(missing)).toThrow(/source/);
    expect(
      mergeProductDatasets(PRODUCT_DATA, structuredClone(PRODUCT_DATA)),
    ).toEqual(PRODUCT_DATA);
  });
  it("never upgrades approximate or missing measurements to a fit claim", () => {
    const product = {
      ...PRODUCT_DATA.products[0],
      category: "handlebars",
      variants: [],
      facts: [
        {
          key: "barClampDiameter",
          value: 26,
          unit: "mm",
          scope: "single selected model",
          sourceId: PRODUCT_DATA.sources[0].id,
          statement: "Manufacturer nominal clamp",
        },
      ],
    };
    const selection: ProductSelection = {
      product,
      sources: [PRODUCT_DATA.sources[0]],
    };
    const measurement = {
      value: 26,
      unit: "mm",
      status: "provisional" as const,
      evidence: "Approximate user measurement",
      recordedAt: "2026-10-18",
    };
    expect(checkCompatibility(selection).status).toBe("Check required");
    expect(
      checkCompatibility(selection, { barClampDiameter: measurement }).status,
    ).toBe("Check required");
    expect(
      checkCompatibility(selection, {
        barClampDiameter: { ...measurement, status: "confirmed" },
      }).status,
    ).toBe("Matches recorded requirements");
    expect(
      checkCompatibility(selection, {
        barClampDiameter: { ...measurement, status: "confirmed", value: 31.8 },
      }).status,
    ).toBe("Does not match");
    product.category = "tyres";
    expect(
      checkCompatibility(selection, {
        barClampDiameter: { ...measurement, status: "confirmed" },
      }).status,
    ).toBe("Check required");
  });
});
