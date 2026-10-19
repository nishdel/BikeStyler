import type {
  BikeMeasurement,
  ProductDataset,
  ProductSelection,
} from "./productTypes";
export type Point = { x: number; y: number };
export type Category =
  | "frame"
  | "fork"
  | "tyres"
  | "wheels"
  | "rims"
  | "spokes"
  | "hubs"
  | "handlebars"
  | "tape"
  | "hoods"
  | "brakes"
  | "saddles"
  | "stems"
  | "seatposts"
  | "pedals"
  | "bottles"
  | "mudguards"
  | "racks"
  | "bags"
  | "lights"
  | "decals"
  | "custom"
  | "brake_levers"
  | "controls"
  | "shifters"
  | "cranksets"
  | "chainrings"
  | "bottom_brackets"
  | "chains"
  | "freewheels"
  | "cassettes"
  | "derailleurs"
  | "tubes"
  | "adapters"
  | "grips"
  | "baskets"
  | "cargo_cages"
  | "disc_rotors";
export type CatalogueEntry = {
  id: string;
  category: Category;
  name: string;
  description: string;
  tags: string[];
  renderer: string;
  parameters: Record<string, number | string | boolean>;
  colours: string[];
  anchors: { name: string; x: number; y: number }[];
  view: "side";
  orientation: "both";
  licence: string;
  provenance: string;
  limitations: string[];
  asset?: string;
  thumbnail?: string;
  visualOrigin?:
    | "deterministic_render"
    | "generated_illustration"
    | "licensed_photo"
    | "user_photo";
  assetId?: string;
  assetView?: string;
  embeddingAllowed?: boolean;
  custom?: boolean;
};
export type CataloguePack = {
  format: "bikestyler-catalogue";
  version: 1;
  entries: CatalogueEntry[];
};
export type Anchor = {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
};
export type Wheel = {
  rotation?: number;
  hubX?: number;
  hubY?: number;
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  innerRatio: number;
  rimRatio: number;
};
export type Part = {
  id: string;
  name: string;
  category: Category;
  marker: Point;
  status: "suggested" | "confirmed" | "missing";
  locked: boolean;
  mask?: string;
  protection?: string;
  anchor: Anchor;
  wheel?: Wheel;
};
export type Finish = "satin" | "gloss" | "matte" | "metallic";
export type PartStyle = {
  listing?: import("./researchCatalogue").ListingSelection;
  product?: ProductSelection;
  layerOrder?: number;
  mirror?: boolean;
  entryId?: string;
  colour?: string;
  finish?: Finish;
  scale?: number;
  widthScale?: number;
  heightScale?: number;
  skew?: number;
  crankAngle?: number;
  crankReach?: number;
  brightness?: number;
  contrast?: number;
  warmth?: number;
  rotation?: number;
  offsetX?: number;
  offsetY?: number;
  opacity?: number;
  approvedApproximation?: boolean;
};
export type Decal = {
  id: string;
  kind:
    | "stripe"
    | "bands"
    | "number"
    | "text"
    | "chevron"
    | "badge"
    | "artwork";
  text: string;
  colour: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  opacity: number;
  asset?: string;
  partId: string;
};
export type Design = {
  id: string;
  name: string;
  styles: Record<string, PartStyle>;
  decals: Decal[];
  createdAt: string;
};
export type Project = {
  format: "bikestyler-project";
  version: 1 | 2;
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  original: string;
  source: string;
  width: number;
  height: number;
  workWidth: number;
  workHeight: number;
  cutout: string;
  protection?: string;
  orientation: "right" | "left";
  parts: Part[];
  styles: Record<string, PartStyle>;
  decals: Decal[];
  designs: Design[];
  customEntries: CatalogueEntry[];
  favourites: string[];
  setupAccepted: boolean;
  metrics: { setupMs: number; edits: number[] };
  stageFrame?: { x: number; y: number; width: number; height: number };
  bikeMeasurements?: Record<string, BikeMeasurement>;
  productCatalogue?: ProductDataset;
  sampleCredit?: string;
};
export const CATEGORIES: { id: Category; name: string }[] = [
  { id: "frame", name: "Frame" },
  { id: "fork", name: "Fork" },
  { id: "tyres", name: "Tyres" },
  { id: "wheels", name: "Complete wheels" },
  { id: "rims", name: "Rims" },
  { id: "spokes", name: "Spokes" },
  { id: "hubs", name: "Hubs" },
  { id: "handlebars", name: "Handlebars" },
  { id: "tape", name: "Tape & grips" },
  { id: "hoods", name: "Brake hoods" },
  { id: "brakes", name: "Brakes" },
  { id: "saddles", name: "Saddles" },
  { id: "stems", name: "Stems" },
  { id: "seatposts", name: "Seatposts" },
  { id: "pedals", name: "Pedals" },
  { id: "bottles", name: "Bottles & cages" },
  { id: "mudguards", name: "Mudguards" },
  { id: "racks", name: "Racks" },
  { id: "bags", name: "Bags" },
  { id: "lights", name: "Lights" },
  { id: "decals", name: "Decals" },
  { id: "custom", name: "Custom" },
  { id: "brake_levers", name: "Brake-only levers" },
  { id: "controls", name: "Combined brake / shift controls" },
  { id: "shifters", name: "Shifters" },
  { id: "cranksets", name: "Cranksets" },
  { id: "chainrings", name: "Chainrings" },
  { id: "bottom_brackets", name: "Bottom brackets" },
  { id: "chains", name: "Chains" },
  { id: "freewheels", name: "Freewheels" },
  { id: "cassettes", name: "Cassettes" },
  { id: "derailleurs", name: "Derailleurs" },
  { id: "tubes", name: "Inner tubes" },
  { id: "adapters", name: "Cockpit adapters" },
  { id: "grips", name: "Grips" },
  { id: "baskets", name: "Baskets" },
  { id: "cargo_cages", name: "Cargo cages" },
  { id: "disc_rotors", name: "Disc rotors" },
];
export const PALETTE = [
  ["Champagne", "#bca77a"],
  ["Midnight navy", "#233749"],
  ["Metallic blue", "#467ca1"],
  ["Forest", "#2c5749"],
  ["Burgundy", "#783c4c"],
  ["Sage", "#92a18a"],
  ["Porcelain", "#e4e2d5"],
  ["Silver grey", "#a1a6a8"],
  ["Copper", "#b47951"],
  ["Black", "#282c2b"],
  ["Sky", "#8dbecc"],
  ["Rust", "#a9573d"],
] as const;
