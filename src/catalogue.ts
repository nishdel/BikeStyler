import { EXPANDED_CATALOGUE, EXPANDED_RENDERER_IDS } from "./expandedCatalogue";
import { PHOTOGRAPHIC_CATALOGUE } from './photographicCatalogue';
import type { CatalogueEntry, Category } from "./types";

export const CATALOGUE_VERSION = 1;
export const RENDERER_IDS: string[] = [...EXPANDED_RENDERER_IDS,
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
];

type Row = [
  name: string,
  form: string,
  details: string,
  parameters?: CatalogueEntry["parameters"],
];
const GROUPS: [Category, Row[]][] = [
  [
    "tyres",
    [
      [
        "Road slick narrow",
        "slick",
        "Smooth tread with a narrow dark sidewall.",
        { width: 7, innerRatio: 0.9 },
      ],
      [
        "Tan-wall road slick narrow",
        "slick",
        "Narrow smooth road tread with a tan sidewall.",
        { width: 7, innerRatio: 0.9, sidewall: "#b79462" },
      ],
      [
        "Road slick wide",
        "slick",
        "Smooth tread with a wider dark sidewall.",
        { width: 12, innerRatio: 0.81 },
      ],
      [
        "Grooved commuter",
        "grooved",
        "Continuous circumferential grooves.",
        { width: 10, innerRatio: 0.85 },
      ],
      [
        "Tan-wall commuter",
        "grooved",
        "Grooved tread and a broad tan sidewall.",
        { width: 10, innerRatio: 0.85, sidewall: "#b79462" },
      ],
      [
        "Fine file gravel",
        "file",
        "Fine alternating dash texture.",
        { width: 11, innerRatio: 0.83 },
      ],
      [
        "Tan-wall file gravel",
        "file",
        "Fine tread texture with a tan sidewall.",
        { width: 11, innerRatio: 0.83, sidewall: "#b79462" },
      ],
      [
        "Small-block trail",
        "knobby",
        "Closely spaced rectangular shoulder blocks.",
        { width: 13, innerRatio: 0.79, blockCount: 52 },
      ],
      [
        "Large-block trail",
        "knobby",
        "Openly spaced large shoulder blocks.",
        { width: 16, innerRatio: 0.74, blockCount: 30 },
      ],
      [
        "Directional chevron",
        "chevron",
        "Directional angled tread strokes.",
        { width: 13, innerRatio: 0.79 },
      ],
      [
        "Cream-wall touring",
        "grooved",
        "Touring grooves with a broad cream sidewall.",
        { width: 12, innerRatio: 0.81, sidewall: "#d8d1b8" },
      ],
    ],
  ],
  [
    "wheels",
    [
      [
        "Classic 32-spoke",
        "radial",
        "Slim rim with 32 radial spokes.",
        { count: 32, depth: 4 },
      ],
      [
        "Light 20-spoke",
        "radial",
        "Slim rim with 20 radial spokes.",
        { count: 20, depth: 4 },
      ],
      [
        "Deep 24-spoke",
        "radial",
        "Deep rim with 24 spokes.",
        { count: 24, depth: 10 },
      ],
      [
        "Paired-spoke aero",
        "paired",
        "Six paired spoke groups and a medium rim.",
        { count: 12, depth: 7 },
      ],
      [
        "Three-blade wheel",
        "blade",
        "Three broad curved blades with open spaces.",
        { count: 3, depth: 6 },
      ],
      [
        "Five-blade wheel",
        "blade",
        "Five broad curved blades with open spaces.",
        { count: 5, depth: 6 },
      ],
      [
        "Cross-laced touring",
        "cross",
        "Alternating crossing spokes and a shallow rim.",
        { count: 36, depth: 4 },
      ],
    ],
  ],
  [
    "rims",
    [
      [
        "Shallow box rim",
        "box",
        "Narrow parallel-edged rim section.",
        { depth: 3 },
      ],
      [
        "Touring box rim",
        "box",
        "Wider parallel-edged rim section.",
        { depth: 5 },
      ],
      [
        "Medium aero rim",
        "aero",
        "Medium-depth ring with a highlighted brake track.",
        { depth: 8 },
      ],
      [
        "Deep aero rim",
        "aero",
        "Deep ring with a highlighted outer track.",
        { depth: 13 },
      ],
      [
        "Scalloped aero rim",
        "scalloped",
        "Repeating scallops on the inner rim edge.",
        { depth: 10 },
      ],
      [
        "Segmented accent rim",
        "segments",
        "Alternating small panels around a medium-depth rim.",
        { depth: 7 },
      ],
    ],
  ],
  [
    "spokes",
    [
      [
        "Radial 20",
        "radial",
        "Twenty evenly spaced straight spokes.",
        { count: 20 },
      ],
      [
        "Radial 32",
        "radial",
        "Thirty-two evenly spaced straight spokes.",
        { count: 32 },
      ],
      [
        "Cross-laced 24",
        "cross",
        "Twenty-four alternating tangential spokes.",
        { count: 24 },
      ],
      [
        "Cross-laced 36",
        "cross",
        "Thirty-six alternating tangential spokes.",
        { count: 36 },
      ],
      [
        "Paired twelve",
        "paired",
        "Twelve spokes in six tight pairs.",
        { count: 12 },
      ],
      [
        "Three broad blades",
        "blade",
        "Three broad shaped blades.",
        { count: 3 },
      ],
    ],
  ],
  [
    "hubs",
    [
      ["Compact barrel", "barrel", "Compact barrel and small end flanges."],
      [
        "Oversize barrel",
        "barrel",
        "Larger central barrel and axle.",
        { size: 1.35 },
      ],
      ["High-flange hub", "high", "Prominent drilled end flanges."],
      ["Dynamo hub", "dynamo", "Large cylindrical body with raised ribs."],
      [
        "Disc-mount hub",
        "disc",
        "Asymmetric body with a six-bolt rotor mount.",
      ],
    ],
  ],
  [
    "handlebars",
    [
      ["Flat bar", "flat", "Straight flat bar with short end grips."],
      ["Riser bar", "riser", "Raised grips and a shallow central sweep."],
      ["Deep drop bar", "drop", "Classic deep curved drops."],
      [
        "Compact drop bar",
        "drop",
        "Shorter-reach, shallower drops.",
        { compact: true },
      ],
      ["Bullhorn bar", "bullhorn", "Forward horns with upward-curved ends."],
      ["Swept city bar", "swept", "Long rearward swept grips."],
      ["Moustache bar", "moustache", "Rounded forward sweep and curled ends."],
      [
        "Butterfly trekking bar",
        "butterfly",
        "Continuous loop-shaped trekking bar.",
      ],
    ],
  ],
  [
    "tape",
    [
      [
        "Overlapping spiral tape",
        "spiral",
        "Clearly overlapping diagonal wrap lines.",
      ],
      [
        "Diamond texture tape",
        "diamond",
        "Cross-hatched diamond grip texture.",
      ],
      [
        "Perforated tape",
        "perforated",
        "Regular rows of small circular perforations.",
      ],
      ["Ribbed grip", "ribbed", "Closely spaced vertical grip ribs."],
      ["Hex texture grip", "hex", "Small repeated hexagonal grip cells."],
      [
        "Speckled cork tape",
        "cork",
        "Deterministic irregular cork-like flecks.",
      ],
    ],
  ],
  [
    "hoods",
    [
      ["Rounded hood", "round", "Smooth rounded raised rubber hood."],
      [
        "Tall endurance hood",
        "tall",
        "High upright head and long palm platform.",
      ],
      ["Low compact hood", "compact", "Short low-profile palm platform."],
      ["Angular hood", "angular", "Squared head with angular shoulder."],
      ["Flat-top hood", "flat", "Long horizontal palm rest and upright nose."],
    ],
  ],
  [
    "brakes",
    [
      [
        "Single-pivot calliper",
        "single",
        "Arched road calliper and central cable.",
      ],
      [
        "Dual-pivot calliper",
        "dual",
        "Asymmetric overlapping road calliper arms.",
      ],
      ["V-brake", "vee", "Tall separated arms joined by a cable noodle."],
      [
        "Cantilever brake",
        "cantilever",
        "Short angled arms and a triangular straddle cable.",
      ],
      [
        "Hydraulic disc",
        "disc",
        "Perforated rotor with compact hydraulic calliper.",
      ],
      [
        "Mechanical disc",
        "disc",
        "Perforated rotor with an external cable lever.",
        { mechanical: true },
      ],
    ],
  ],
  [
    "saddles",
    [
      ["Slim race saddle", "race", "Long narrow nose and thin tail."],
      [
        "Wide touring saddle",
        "touring",
        "Wide padded rear and gently tapered nose.",
      ],
      [
        "Central cut-out saddle",
        "cutout",
        "Open central cut-out in a slim saddle.",
      ],
      ["Split-nose saddle", "split", "Two separated short nose lobes."],
      [
        "Sprung city saddle",
        "sprung",
        "Deep padded top with visible twin springs.",
      ],
      ["Short-nose saddle", "short", "Compact rounded nose with a broad tail."],
      [
        "Long-nose saddle",
        "race",
        "Extended slim nose and low padded tail.",
        { length: 1.14 },
      ],
    ],
  ],
  [
    "stems",
    [
      [
        "Quill stem",
        "quill",
        "Tall bent quill with a short forward extension.",
      ],
      ["Level stem", "straight", "Horizontal extension and round end clamps."],
      ["Rise stem", "straight", "Upward-sloping extension.", { rise: 20 }],
      [
        "Negative-rise stem",
        "straight",
        "Downward-sloping extension.",
        { rise: -15 },
      ],
      [
        "Adjustable stem",
        "adjustable",
        "Visible central angle-adjustment hinge.",
      ],
      ["Aero stem", "aero", "Wide tapered wedge between clamps."],
    ],
  ],
  [
    "seatposts",
    [
      [
        "Straight seatpost",
        "straight",
        "Straight shaft and centered saddle clamp.",
      ],
      [
        "Setback seatpost",
        "setback",
        "Shaft with a rearward-offset top clamp.",
      ],
      ["Aero seatpost", "aero", "Broad tapered shaft and compact clamp."],
      [
        "Dropper seatpost",
        "dropper",
        "Narrow upper shaft and a visible seal collar.",
      ],
      [
        "Suspension seatpost",
        "suspension",
        "Exposed upper spring and short collar.",
      ],
      [
        "Twin-rail seatpost",
        "twin",
        "Two narrow supports joined below the clamp.",
      ],
    ],
  ],
  [
    "pedals",
    [
      ["Open flat pedal", "flat", "Open rectangular body with grip pins."],
      [
        "Classic cage pedal",
        "cage",
        "Thin outer cage and crossed inner supports.",
      ],
      ["Toe-clip pedal", "toeclip", "Cage pedal with an arched toe clip."],
      ["Solid platform pedal", "platform", "Broad body with inset grip pads."],
      [
        "Compact clipless pedal",
        "clipless",
        "Small oval body with central retention mechanism.",
      ],
      [
        "Road clipless pedal",
        "road",
        "Broad triangular road retention platform.",
      ],
      [
        "Wide studded pedal",
        "flat",
        "Wide flat body with dense raised edge pins.",
        { wide: true },
      ],
    ],
  ],
  [
    "bottles",
    [
      [
        "Round sports bottle",
        "round",
        "Cylindrical bottle with a grip waist and nozzle.",
      ],
      ["Aero bottle", "aero", "Flat tapered bottle with a low shoulder."],
      [
        "Insulated bottle",
        "round",
        "Tall double-wall-style bottle with a band.",
        { insulated: true },
      ],
      [
        "Wire bottle cage",
        "wire",
        "Open wire cage with side rails and a bottom cradle.",
      ],
      [
        "Wrap bottle cage",
        "wrap",
        "Broad wraparound cage with an open middle.",
      ],
      [
        "Tool canister",
        "tool",
        "Short cylindrical tool container with a screw-top lid.",
      ],
    ],
  ],
  [
    "mudguards",
    [
      [
        "Full curved guard",
        "full",
        "Long wheel-following arch with support stays.",
      ],
      ["Short curved guard", "short", "Short upper wheel-following arc."],
      [
        "Rear splash tail",
        "tail",
        "Tapered flat tail with a small mounting bracket.",
      ],
      [
        "Wide utility guard",
        "full",
        "Broad wheel-following guard and stays.",
        { width: 8 },
      ],
      ["Two-piece guard", "split", "Separated front and rear arch sections."],
    ],
  ],
  [
    "racks",
    [
      ["Rear carrier", "rear", "Flat top platform with two triangular stays."],
      [
        "Front carrier",
        "front",
        "Short top platform with upright supporting legs.",
      ],
      [
        "Low-rider rack",
        "low",
        "Low pannier frame and compact upper attachment.",
      ],
      [
        "Wide platform rack",
        "platform",
        "Broad slatted top with braced supports.",
      ],
      [
        "Seatpost-mounted rack",
        "seatpost",
        "Cantilever platform with a forward post clamp.",
      ],
    ],
  ],
  [
    "bags",
    [
      [
        "Compact saddle bag",
        "saddle",
        "Tapered under-saddle pouch with two straps.",
      ],
      [
        "Top-tube pouch",
        "top",
        "Long slim pouch with a sloped front and top zip.",
      ],
      [
        "Triangle frame bag",
        "frame",
        "Triangular bag with a diagonal zipped panel.",
      ],
      [
        "Touring pannier",
        "pannier",
        "Tall rectangular pannier with flap and buckles.",
      ],
      [
        "Handlebar barrel bag",
        "barrel",
        "Horizontal barrel bag with circular end seams.",
      ],
      ["Open basket", "basket", "Tapered open basket with a visible grid."],
      [
        "Handlebar bedroll",
        "roll",
        "Horizontal rolled bundle with two compression straps.",
      ],
    ],
  ],
  [
    "lights",
    [
      [
        "Round bullet headlight",
        "bullet",
        "Rounded body with a circular forward lens.",
      ],
      [
        "Compact box headlight",
        "box",
        "Rectangular headlight and short mounting foot.",
      ],
      [
        "Twin-lens headlight",
        "twin",
        "Two adjacent round lenses in a wide housing.",
      ],
      ["Oval rear light", "rear", "Red oval lens with a dark mounting base."],
      [
        "Slim rear light",
        "strip",
        "Narrow vertical red lens and small bracket.",
      ],
      [
        "Classic dynamo lamp",
        "dynamo",
        "Large domed headlight on a curved fork bracket.",
      ],
    ],
  ],
  [
    "decals",
    [
      ["Single racing stripe", "stripe", "One long tapered stripe."],
      ["Twin racing stripes", "double", "Two parallel tapered stripes."],
      ["Triple transverse bands", "bands", "Three thick diagonal bands."],
      [
        "Forward chevrons",
        "chevron",
        "Three repeated forward-facing chevrons.",
      ],
      ["Shield badge", "badge", "Shield outline with a small inset star."],
      ["Race number 27", "number", "Bold number 27 on a rounded outline."],
      [
        "Checker patch",
        "checker",
        "Alternating square racing checker pattern.",
      ],
      ["Graduated dots", "dots", "A row of dots decreasing in size."],
    ],
  ],
];

const WHEEL_CATEGORIES = new Set<Category>([
  "tyres",
  "wheels",
  "rims",
  "spokes",
  "hubs",
]);
const slug = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/** Original, deterministic vector-like Canvas assets. Each row is a selectable style, not a colour SKU. */
const BASE_CATALOGUE: CatalogueEntry[] = GROUPS.flatMap(([category, rows]) =>
  rows.map(([name, form, details, parameters = {}]) => ({
    id: `${category}-${slug(name)}`,
    category,
    name,
    description: `${details} Original side-view illustration; scale and alignment are adjustable.`,
    tags: [category, form, "original", "side-view", "illustrated"],
    renderer: category,
    parameters: { form, ...parameters },
    colours: ["#303735", "#9ba5a5", "#bca77a", "#233749", "#783c4c"],
    anchors: WHEEL_CATEGORIES.has(category)
      ? [
          { name: "attachment", x: 50, y: 50 },
          { name: "axle", x: 50, y: 50 },
          { name: "outer-top", x: 50, y: 2 },
          { name: "outer-right", x: 98, y: 50 },
        ]
      : [
          { name: "attachment", x: 50, y: 50 },
          { name: "centre", x: 50, y: 50 },
          { name: "left", x: 8, y: 50 },
          { name: "right", x: 92, y: 50 },
        ],
    view: "side",
    orientation: "both",
    licence: "CC0-1.0",
    provenance:
      "Original code-defined Canvas illustration created for BikeStyler; no third-party images, logos, or product tracing.",
    limitations: [
      "Generic illustrated component, not a dimensionally accurate product model.",
      "Side view only; manual scale, position and rotation may be needed.",
      ...(category === "tape" || category === "hoods"
        ? [
            "Silhouette replacement requires the part to be unlocked and aligned manually.",
          ]
        : []),
      ...(WHEEL_CATEGORIES.has(category)
        ? [
            "Wheel fit is an elliptical approximation; hidden or occluded geometry needs a protection mask.",
          ]
        : []),
    ],
  })),
);

export const CATALOGUE = [...BASE_CATALOGUE, ...EXPANDED_CATALOGUE, ...PHOTOGRAPHIC_CATALOGUE];
