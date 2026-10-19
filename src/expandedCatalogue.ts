import type { CatalogueEntry, Category } from "./types";

type Row = [name: string, form: string, description: string];
/** A form is counted once. Finishes, colours and alternate views are not styles. */
const GROUPS: [Category, Row[]][] = [
  [
    "brake_levers",
    [
      [
        "Aero curved brake-only lever",
        "aero",
        "Low hood and a curved single brake blade; no shift paddle.",
      ],
      [
        "Classic exposed-cable brake lever",
        "classic",
        "Tall round hood, overhead cable exit and polished curved blade.",
      ],
      [
        "Two-finger flat-bar brake lever",
        "short",
        "Compact clamp body with a short hooked brake blade.",
      ],
      [
        "Four-finger flat-bar brake lever",
        "long",
        "Broad clamp body with a long gently curved brake blade.",
      ],
      [
        "Bullhorn end brake lever",
        "bullhorn",
        "Plug-in bar-end housing and an outward swept brake blade.",
      ],
      [
        "Inline cross-top brake lever",
        "inline",
        "Inline round clamp and shallow horizontal brake blade.",
      ],
      [
        "Time-trial straight brake lever",
        "tt",
        "Slim axial bar-end body with a narrow straight brake blade.",
      ],
      [
        "Compact interrupter brake lever",
        "interrupter",
        "Small split clamp with a downward hooked auxiliary blade.",
      ],
    ],
  ],
  [
    "controls",
    [
      [
        "Compact integrated road control",
        "compact-road",
        "Low-profile road hood with a brake blade and separate inner shift paddle.",
      ],
      [
        "Tall integrated road control",
        "tall-road",
        "Tall hydraulic-style hood, long brake blade and small inner paddle.",
      ],
      [
        "Mechanical twin-paddle control",
        "twin-paddle",
        "Road hood with two visibly offset control paddles behind the brake blade.",
      ],
      [
        "Flat-bar combined trigger control",
        "flat-trigger",
        "Single clamp joining a flat-bar brake blade and two lower trigger paddles.",
      ],
      [
        "Compact electronic button control",
        "button",
        "Small oval bar-mounted control pod with two separated buttons.",
      ],
      [
        "Bar-end dual control",
        "bar-end",
        "Axial plug mount with a brake blade and offset thumb paddle.",
      ],
    ],
  ],
  [
    "shifters",
    [
      [
        "Downtube friction lever",
        "downtube",
        "Slender tapered lever around a small exposed fixing boss.",
      ],
      [
        "Raised thumb shifter",
        "thumb",
        "Top-mounted thumb lever above a round handlebar clamp.",
      ],
      [
        "Bar-end friction shifter",
        "bar-end",
        "Cylindrical bar-end plug with an angled operating paddle.",
      ],
      [
        "Twin trigger shifter",
        "trigger",
        "Compact body with two staggered lower thumb paddles.",
      ],
      [
        "Twist sleeve shifter",
        "twist",
        "Ribbed rotating sleeve and broad indicator shoulder.",
      ],
      [
        "Stem-mounted twin levers",
        "stem",
        "Paired upright friction levers on a narrow shared mounting bridge.",
      ],
    ],
  ],
  [
    "cranksets",
    [
      [
        "Classic five-arm crankset",
        "five-arm",
        "Five narrow arms, two concentric chainrings and a tapered crank arm.",
      ],
      [
        "Six-arm track crankset",
        "six-arm",
        "Six radial arms around a single large chainring and slender crank.",
      ],
      [
        "Asymmetric four-arm crankset",
        "four-arm",
        "Four offset broad spider arms, paired rings and a hollow-profile crank.",
      ],
      [
        "Solid-disc urban crankset",
        "disc",
        "Solid circular chainguard with a plain broad crank arm.",
      ],
      [
        "Open three-arm crankset",
        "three-arm",
        "Three swept spider arms and one exposed narrow-wide-style ring.",
      ],
      [
        "Guarded trekking triple crankset",
        "triple",
        "Three stepped rings with an external guard and a straight crank arm.",
      ],
      [
        "Sculpted direct-mount crankset",
        "direct",
        "Lobed direct-mount ring surrounding a broad sculpted crank arm.",
      ],
    ],
  ],
  [
    "chainrings",
    [
      [
        "Five-spider round chainring",
        "five",
        "Round toothed chainring with five long open spider arms.",
      ],
      [
        "Oval five-spider chainring",
        "oval",
        "Clearly oval outer ring with five slim spider arms.",
      ],
      [
        "Asymmetric four-spider chainring",
        "four",
        "Four unevenly spaced broad mounting arms and a round outer ring.",
      ],
      [
        "Enclosed guard chainring",
        "guard",
        "Broad disc-shaped outer guard with small radial ventilation slots.",
      ],
      [
        "Wave six-spider chainring",
        "wave",
        "Six curved arms and a scalloped inner ring boundary.",
      ],
      [
        "Thin track chainring",
        "track",
        "Thin open ring with five short spokes and a large central opening.",
      ],
    ],
  ],
  [
    "bottom_brackets",
    [
      [
        "External-cup bottom bracket",
        "external",
        "Two external flanged bearing cups joined by a narrow sleeve.",
      ],
      [
        "Square-taper cartridge bottom bracket",
        "cartridge",
        "Sealed cylindrical body with square-ended spindle extensions.",
      ],
      [
        "Press-fit sleeve bottom bracket",
        "pressfit",
        "Smooth wide sleeve with shallow pressed bearing shoulders.",
      ],
      [
        "One-piece crank bearing set",
        "one-piece",
        "Small paired domed cups and a long stepped bearing spindle.",
      ],
    ],
  ],
  [
    "chains",
    [
      [
        "Rounded link chain",
        "rounded",
        "Paired rounded side plates with dark pins and open roller spaces.",
      ],
      [
        "Half-link chain",
        "half-link",
        "Staggered bent half-link plates with closely spaced pins.",
      ],
      [
        "Wide solid-plate chain",
        "wide",
        "Broad square-ended plates with large exposed rivets.",
      ],
      [
        "Hollow-plate chain",
        "hollow",
        "Slim elongated side plates with visible inset lightening slots.",
      ],
    ],
  ],
  [
    "freewheels",
    [
      [
        "Slim single-speed freewheel",
        "single",
        "Thin single sprocket with a small recessed lockring.",
      ],
      [
        "Wide-flange single-speed freewheel",
        "wide",
        "Single broad sprocket around a wide stepped central flange.",
      ],
      [
        "Open-window single-speed freewheel",
        "window",
        "Single sprocket with six open web windows.",
      ],
      [
        "Three-sprocket freewheel",
        "triple",
        "Three visibly stepped toothed sprockets around a common axle.",
      ],
      [
        "Five-sprocket freewheel",
        "five",
        "Five nested stepped sprockets with small central lockring.",
      ],
    ],
  ],
  [
    "cassettes",
    [
      [
        "Classic stepped road cassette",
        "classic",
        "Seven closely graded concentric sprocket outlines.",
      ],
      [
        "Narrow close-ratio cassette",
        "close",
        "Nine tight sprocket steps with a broad small-sprocket centre.",
      ],
      [
        "Eleven-step road cassette",
        "road",
        "Eleven fine stepped sprocket outlines with a compact outer diameter.",
      ],
      [
        "Wide-range trail cassette",
        "wide",
        "Twelve widely spread sprocket steps and a broad outer climbing sprocket.",
      ],
      [
        "Open-spider climbing cassette",
        "open",
        "Broad outer sprocket on six open support arms and compact inner stack.",
      ],
      [
        "Compact cluster cassette",
        "compact",
        "Compact six-step cluster with a deep small centre sprocket.",
      ],
    ],
  ],
  [
    "derailleurs",
    [
      [
        "Short-cage rear derailleur",
        "short",
        "Compact parallelogram and two closely spaced jockey wheels.",
      ],
      [
        "Long-cage rear derailleur",
        "long",
        "Long slender pulley cage beneath a compact upper body.",
      ],
      [
        "Clutch-body rear derailleur",
        "clutch",
        "Large round upper clutch housing and an offset medium-length pulley cage.",
      ],
      [
        "Compact electronic rear derailleur",
        "electronic",
        "Angular upper motor pod and a deep sculpted pulley cage.",
      ],
      [
        "Clamp-on front derailleur",
        "front-clamp",
        "Circular seat-tube clamp connected to a shallow curved chain guide.",
      ],
      [
        "Braze-on front derailleur",
        "front-tab",
        "Small vertical mounting tab above a long bowed chain guide.",
      ],
    ],
  ],
  [
    "tubes",
    [
      [
        "Slim tube with long valve",
        "slim",
        "Thin circular spare-tube outline with a long narrow valve.",
      ],
      [
        "Touring tube with short valve",
        "touring",
        "Medium-width circular spare-tube outline and short valve.",
      ],
      [
        "Wide tube with broad valve",
        "wide",
        "Broad circular spare-tube outline with a thick short valve stem.",
      ],
      [
        "Folded spare inner tube",
        "folded",
        "Folded rectangular spare tube with a retaining band and protruding valve.",
      ],
    ],
  ],
  [
    "adapters",
    [
      [
        "Arched post-mount brake adapter",
        "post",
        "Arched caliper bridge with two separated round mounting eyes.",
      ],
      [
        "Flat brake mounting plate",
        "flat",
        "Flat elongated plate with offset countersunk mounting holes.",
      ],
      [
        "Split handlebar shim",
        "shim",
        "Short split cylindrical sleeve with a visible longitudinal seam.",
      ],
      [
        "Stepped bearing spacer",
        "spacer",
        "Concentric stepped spacer ring with a broad central opening.",
      ],
    ],
  ],
  [
    "grips",
    [
      [
        "Flanged mushroom grip",
        "mushroom",
        "Dense soft ribs with a large circular inner flange.",
      ],
      [
        "Ergonomic palm-support grip",
        "ergonomic",
        "Broad tapered wing supporting the palm and a slim outer clamp.",
      ],
      [
        "Straight cork-style grip",
        "cork",
        "Simple rounded sleeve with fine irregular stippled texture.",
      ],
      [
        "Segmented double-lock grip",
        "lock-on",
        "Tapered segmented rubber sleeve between two metal clamps.",
      ],
    ],
  ],
  [
    "baskets",
    [
      [
        "Open wire front basket",
        "wire",
        "Shallow tapered wire basket with a thick top rim and lower supports.",
      ],
      [
        "Woven front basket",
        "woven",
        "Rounded rectangular basket with an illustrated woven panel and top handle.",
      ],
      [
        "Deep rear shopping basket",
        "deep",
        "Tall open mesh basket with a vertical rear edge and rack attachment feet.",
      ],
      [
        "Slatted cargo box",
        "box",
        "Low rectangular cargo box with horizontal slats and corner reinforcements.",
      ],
    ],
  ],
  [
    "cargo_cages",
    [
      [
        "Three-bolt cargo cage",
        "triple",
        "Tall narrow open cage with three aligned mounting bosses and a lower foot.",
      ],
      [
        "Wide fork cargo cage",
        "wide",
        "Broad rectangular support cage with side wings and a wide lower platform.",
      ],
      [
        "Strapped load cradle",
        "strapped",
        "Deep curved cradle with two horizontal retaining straps.",
      ],
      [
        "Compact utility cage",
        "compact",
        "Short open double-loop cage with a compact lower support.",
      ],
    ],
  ],
  [
    "disc_rotors",
    [
      [
        "Six-arm drilled disc rotor",
        "six",
        "Six narrow radial arms and a drilled round braking track.",
      ],
      [
        "Centre-lock spoke rotor",
        "centerlock",
        "Slim centre-lock ring, ten spokes and narrow round braking track.",
      ],
      [
        "Floating wave disc rotor",
        "floating",
        "Wavy outer track, contrasting spider and six visible floating rivets.",
      ],
      [
        "Solid vented disc rotor",
        "vented",
        "Broad slotted braking track and small five-arm carrier.",
      ],
      [
        "Eight-spoke light rotor",
        "eight",
        "Eight fine straight spokes and a thin outer braking track.",
      ],
      [
        "Two-piece scalloped rotor",
        "scalloped",
        "Deeply scalloped braking track around a broad four-arm carrier.",
      ],
    ],
  ],
];

export const EXPANDED_RENDERER_IDS = GROUPS.map(
  ([category]) => `expanded-${category}`,
);
const attachment: Partial<Record<Category, [number, number, string]>> = {
  brake_levers: [28, 31, "bar-mount"],
  controls: [28, 31, "bar-mount"],
  shifters: [35, 55, "mount"],
  cranksets: [43, 43, "spindle"],
  chainrings: [50, 50, "spindle"],
  bottom_brackets: [50, 50, "spindle"],
  chains: [50, 40, "path-centre"],
  freewheels: [50, 50, "axle"],
  cassettes: [50, 50, "axle"],
  derailleurs: [38, 19, "hanger"],
  tubes: [50, 50, "centre"],
  adapters: [29, 51, "mount"],
  grips: [20, 50, "inner-bar-end"],
  baskets: [54, 82, "lower-mount"],
  cargo_cages: [50, 45, "middle-bolt"],
  disc_rotors: [50, 50, "axle"],
};
const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
export const EXPANDED_CATALOGUE: CatalogueEntry[] = GROUPS.flatMap(
  ([category, rows]) =>
    rows.map(([name, form, description]) => {
      let [x, y, anchorName] = attachment[category]!;
      if (category === "brake_levers" && ["aero", "classic"].includes(form))
        [x, y] = [20, 34];
      if (
        category === "controls" &&
        (form.includes("road") || form === "twin-paddle")
      )
        [x, y] = [20, 34];
      if (category === "shifters" && form === "bar-end") [x, y] = [24, 55];
      if (category === "tubes" && form !== "folded") [x, y] = [50, 52];
      if (category === "derailleurs" && form.startsWith("front"))
        [x, y, anchorName] = [38, 27, "seat-tube-mount"];
      if (category === "adapters" && form === "spacer")
        [x, y, anchorName] = [50, 50, "bearing-centre"];
      const id = `expanded-${category}-${slug(name)}`;
      return {
        id,
        category,
        name,
        description: `${description} Illustration — appearance approximate.`,
        tags: [category, form, "generic", "illustration", "side-view"],
        renderer: `expanded-${category}`,
        parameters: { form },
        colours: ["#303735", "#9ba5a5", "#bca77a", "#233749", "#783c4c"],
        anchors: [
          { name: "attachment", x, y },
          { name: anchorName, x, y },
        ],
        view: "side" as const,
        orientation: "both" as const,
        licence: "CC0-1.0",
        provenance:
          "Original code-defined illustration created for BikeStyler; no manufacturer images, logos or product tracing.",
        limitations: [
          "Illustration — appearance approximate; no real-product identity, dimensions or compatibility claim.",
          "Side-view geometry; align attachment, scale and angle to your photograph. Hidden surfaces require a protection mask.",
          ...(category === "tubes"
            ? [
                "Installed inner tubes are hidden by tyres. These spare-tube illustrations are for inventory/layout exploration, not a visible tyre replacement.",
              ]
            : []),
          ...(category === "bottom_brackets"
            ? [
                "Most of a fitted bottom bracket is hidden by the frame and crank; use protection masks and expect only bearing edges to be visible.",
              ]
            : []),
          ...(category === "chains"
            ? [
                "A short illustrative chain path; it does not automatically trace your bicycle's chain line.",
              ]
            : []),
        ],
        thumbnail: `/components/thumbnails/${id}.webp`,
        visualOrigin: "deterministic_render",
        embeddingAllowed: true,
      };
    }),
);

// One style, two views. Only the calibrated profile is eligible for placement.
EXPANDED_CATALOGUE.push({
  id: "generic-black-aero-road-brake-lever-001",
  category: "brake_levers",
  name: "Sculpted black aero brake-only lever",
  description:
    "Generic aero hood with one curved brake blade and a small silver pivot. Illustration — appearance approximate.",
  tags: [
    "brake_levers",
    "aero",
    "brake-only",
    "generated-illustration",
    "side-view",
  ],
  renderer: "expanded-brake_levers",
  parameters: { form: "aero", illustratedAsset: true },
  colours: ["#282c2b"],
  anchors: [
    { name: "attachment", x: 20.6, y: 31 },
    { name: "bar-mount", x: 20.6, y: 31 },
    { name: "blade-pivot", x: 71.5, y: 37.8 },
  ],
  view: "side",
  orientation: "both",
  licence:
    "Contributor-supplied generated illustration; publication and project embedding authorized",
  provenance:
    "Supplied BikeStyler Expansion Kit, generated 2026-10-18. Generic unbranded concept; not a photograph of a real product. Local deterministic WebP conversion only.",
  limitations: [
    "Illustration — appearance approximate; no named product, dimensions or compatibility evidence.",
    "Mount and pivot anchors are manually estimated from pixels; physical scale and camera geometry remain unverified.",
    "Side image is for compositing. The separate three-quarter image is for selection/detail only and is not a calibrated alternate view.",
    "Use a protection mask for tape and bars; verify scale and mount position on the actual bicycle photograph.",
  ],
  asset: "/components/generic-black-road-lever-side.webp",
  thumbnail: "/components/generic-black-road-lever-three-quarter.webp",
  visualOrigin: "generated_illustration",
  assetId: "generic-black-road-lever-side",
  assetView: "right_side_profile",
  embeddingAllowed: true,
});
