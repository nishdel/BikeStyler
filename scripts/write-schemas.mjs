import { writeFile } from "node:fs/promises";
import { CATEGORIES } from '../src/types.ts';
import { EXPANDED_RENDERER_IDS } from '../src/expandedCatalogue.ts';
const text = (maxLength = 200) => ({ type: "string", maxLength });
const num = (minimum = -100000, maximum = 100000) => ({
  type: "number",
  minimum,
  maximum,
});
const arr = (items, maxItems = 500) => ({ type: "array", items, maxItems });
const obj = (properties, required = Object.keys(properties)) => ({
  type: "object",
  properties,
  required,
  additionalProperties: false,
});
const colour = { type: "string", pattern: "^#[0-9a-fA-F]{6}$" };
const image = {
  type: "string",
  maxLength: 94371840,
  pattern: "^data:image/(png|jpeg|webp);base64,[A-Za-z0-9+/]+=*$",
};
const mask = { ...image, pattern: "^data:image/png;base64,[A-Za-z0-9+/]+=*$" };
const categories = [
  "frame",
  "fork",
  "tyres",
  "wheels",
  "rims",
  "spokes",
  "hubs",
  "handlebars",
  "tape",
  "hoods",
  "brakes",
  "saddles",
  "stems",
  "seatposts",
  "pedals",
  "bottles",
  "mudguards",
  "racks",
  "bags",
  "lights",
  "decals",
  "custom",
];
const point = obj({ x: num(), y: num() });
for(const category of CATEGORIES)if(!categories.includes(category.id))categories.push(category.id);
const anchor = obj({
  x: num(),
  y: num(),
  width: num(0.1, 20000),
  height: num(0.1, 20000),
  rotation: num(-720, 720),
});
const entry = obj(
  {
    id: { type: "string", pattern: "^[a-zA-Z0-9_-]+$", maxLength: 100 },
    category: { enum: categories },
    name: text(100),
    description: text(1000),
    tags: arr(text(60), 30),
    renderer: { enum: [...categories.filter((c) => c !== "custom"), ...EXPANDED_RENDERER_IDS, "asset"] },
    parameters: {
      type: "object",
      maxProperties: 40,
      propertyNames: { pattern: "^[A-Za-z][A-Za-z0-9]*$" },
      additionalProperties: {
        oneOf: [num(-1000, 1000), text(80), { type: "boolean" }],
      },
    },
    colours: arr(colour, 30),
    anchors: arr(
      obj({ name: text(50), x: num(-100, 200), y: num(-100, 200) }),
      10,
    ),
    view: { const: "side" },
    orientation: { const: "both" },
    licence: text(200),
    provenance: text(500),
    limitations: arr(text(600), 20),
    asset: {
      ...image,
      maxLength: 8388608,
      pattern: "^data:image/(png|webp);base64,[A-Za-z0-9+/]+=*$",
    },
    custom: { type: "boolean" },
    thumbnail: image,
    visualOrigin: {enum:['deterministic_render','generated_illustration','licensed_photo','user_photo']},
    assetId:text(160),assetView:text(80),embeddingAllowed:{type:'boolean'},
  },
  [
    "id",
    "category",
    "name",
    "description",
    "tags",
    "renderer",
    "parameters",
    "colours",
    "anchors",
    "view",
    "orientation",
    "licence",
    "provenance",
    "limitations",
  ],
);
const fact=obj({key:text(100),value:{type:['string','number','boolean']},unit:text(80),scope:text(1000),sourceId:text(160),statement:text(4000)},['key','value','scope','sourceId','statement']);
const source=obj({id:text(160),url:{type:'string',format:'uri',pattern:'^https://',maxLength:2000},publisher:text(160),verifiedAt:text(50),kind:text(100),scope:text(2000),rights:text(2000),notes:text(4000)},['id','url','publisher','verifiedAt','kind','scope','rights']);
const product=obj({id:text(160),brand:text(150),model:text(200),category:text(100),family:text(200),tags:arr(text(100),40),sourceIds:arr(text(160),60),status:{const:'verified-product'},facts:arr(fact,80),variants:arr(obj({id:text(160),label:text(300),facts:arr(fact,80),sourceIds:arr(text(160),60)}),150),previewStatus:{enum:['unavailable','reviewed']},previewReason:text(2000),visualEntryId:text(160)},['id','brand','model','category','family','tags','sourceIds','status','facts','variants','previewStatus','previewReason']);
const productDataset=obj({version:{const:1},sources:arr(source,2000),products:arr(product,2000),backlog:arr(obj({id:text(160),brand:text(150),model:text(200),category:text(100),sourceUrls:arr(text(2000),20),reason:text(3000)}),3000)});
const selection=obj({product,variantId:text(160),sources:arr(source,2000)},['product','sources']);
const measurement=obj({value:{type:['string','number']},unit:text(30),status:{enum:['confirmed','provisional','conflicting']},evidence:text(1000),recordedAt:text(50)},['value','status','evidence','recordedAt']);
const style = obj(
  {
    entryId: text(100),
    colour,
    finish: { enum: ["satin", "gloss", "matte", "metallic"] },
    scale: num(0.1, 4),
    widthScale:num(0.25,2),heightScale:num(0.25,2),skew:num(-45,45),crankAngle:num(-180,180),crankReach:num(0.35,1.35),
    brightness:num(0.5,1.5),contrast:num(0.5,1.5),warmth:num(-1,1),
    rotation: num(-360, 360),
    offsetX: num(),
    offsetY: num(),
    opacity: num(0, 1),
    approvedApproximation: { type: "boolean" },
    product:selection,layerOrder:num(-100,100),mirror:{type:'boolean'},
  },
  [],
);
const styles = {
  type: "object",
  maxProperties: 200,
  additionalProperties: style,
};
const decal = obj(
  {
    id: text(100),
    kind: {
      enum: [
        "stripe",
        "bands",
        "number",
        "text",
        "chevron",
        "badge",
        "artwork",
      ],
    },
    text: text(100),
    colour,
    x: num(),
    y: num(),
    scale: num(0.05, 10),
    rotation: num(-360, 360),
    opacity: num(0, 1),
    asset: { ...image, maxLength: 8388608 },
    partId: text(100),
  },
  [
    "id",
    "kind",
    "text",
    "colour",
    "x",
    "y",
    "scale",
    "rotation",
    "opacity",
    "partId",
  ],
);
const wheel = obj({
  cx: num(),
  cy: num(),
  rx: num(1, 5000),
  ry: num(1, 5000),
  innerRatio: num(0.4, 0.99),
  rimRatio: num(0.1, 0.98),
  rotation:num(-1080,1080),hubX:num(),hubY:num(),
},['cx','cy','rx','ry','innerRatio','rimRatio']);
const part = obj(
  {
    id: text(100),
    name: text(100),
    category: { enum: categories },
    marker: point,
    status: { enum: ["suggested", "confirmed", "missing"] },
    locked: { type: "boolean" },
    mask,
    protection: mask,
    anchor,
    wheel,
  },
  ["id", "name", "category", "marker", "status", "locked", "anchor"],
);
const design = obj({
  id: text(100),
  name: text(100),
  styles,
  decals: arr(decal, 100),
  createdAt: text(50),
});
const project = obj(
  {
    format: { const: "bikestyler-project" },
    version: { enum: [1,2] },
    id: text(100),
    name: text(200),
    createdAt: text(50),
    updatedAt: text(50),
    original: { ...image, maxLength: 37748736 },
    source: image,
    width: num(100, 4096),
    height: num(100, 4096),
    workWidth: num(1, 1440),
    workHeight: num(1, 1440),
    cutout: mask,
    protection: mask,
    orientation: { enum: ["left", "right"] },
    parts: { ...arr(part, 100), minItems: 1 },
    styles,
    decals: arr(decal, 100),
    designs: arr(design, 40),
    customEntries: arr(entry, 600),
    stageFrame:obj({x:num(),y:num(),width:num(1,20000),height:num(1,20000)}),
    bikeMeasurements:{type:'object',maxProperties:80,additionalProperties:measurement},
    productCatalogue:productDataset,sampleCredit:text(2000),
    favourites: arr(text(100), 500),
    setupAccepted: { type: "boolean" },
    metrics: obj({ setupMs: num(0, 1e12), edits: arr(num(0, 1e9), 200) }),
  },
  [
    "format",
    "version",
    "id",
    "name",
    "createdAt",
    "updatedAt",
    "original",
    "source",
    "width",
    "height",
    "workWidth",
    "workHeight",
    "cutout",
    "orientation",
    "parts",
    "styles",
    "decals",
    "designs",
    "customEntries",
    "favourites",
    "setupAccepted",
    "metrics",
  ],
);
const pack = obj({
  format: { const: "bikestyler-catalogue" },
  version: { const: 1 },
  entries: arr(entry, 600),
});
for (const [file, schema, title] of [
  ["project", project, "BikeStyler portable project v2 (v1 migration accepted)"],
  ["catalogue", pack, "BikeStyler data-only catalogue pack v1"],
  ["products",obj({format:{const:'bikestyler-products'},data:productDataset}),"BikeStyler sourced products pack v1"],
])
  await writeFile(
    `schemas/${file}.schema.json`,
    JSON.stringify(
      {
        $schema: "https://json-schema.org/draft/2020-12/schema",
        title,
        ...schema,
      },
      null,
      2,
    ) + "\n",
  );
console.log("Wrote project v2, visual catalogue v1 and product pack v1 schemas.");
