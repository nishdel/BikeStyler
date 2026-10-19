import type { Project, Part } from "./types";
import { canvas, alphaURL, initialParts, uid, wheelParts } from "./images";
// Original deterministic illustration, explicitly labelled as practice data.
// It is never used to claim automatic processing of a photograph.
export function practiceProject(): Project {
  const width = 1100,
    height = 650,
    bike = canvas(width, height),
    ctx = bike.getContext("2d")!,
    masks: Record<string, string> = {},
    parts = initialParts(width, height),
    date = new Date().toISOString();
  const line = (
    c: CanvasRenderingContext2D,
    pts: number[][],
    colour: string,
    weight: number,
  ) => {
    c.strokeStyle = colour;
    c.lineWidth = weight;
    c.lineCap = "round";
    c.lineJoin = "round";
    c.beginPath();
    pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
    c.stroke();
  };
  const component = (
    id: string,
    fn: (c: CanvasRenderingContext2D) => void,
    x: number,
    y: number,
    w: number,
    h: number,
  ) => {
    const l = canvas(width, height),
      lc = l.getContext("2d")!;
    fn(lc);
    ctx.drawImage(l, 0, 0);
    const px = lc.getImageData(0, 0, width, height).data;
    masks[id] = alphaURL(
      Uint8ClampedArray.from(
        { length: width * height },
        (_, i) => px[i * 4 + 3],
      ),
      width,
      height,
    );
    const part = parts.find((t) => t.id === id);
    if (part) {
      part.mask = masks[id];
      part.status = "confirmed";
      part.marker = { x, y };
      part.anchor = { x, y, width: w, height: h, rotation: 0 };
    }
  };
  const rear = {
      cx: 245,
      cy: 423,
      rx: 160,
      ry: 160,
      innerRatio: 0.92,
      rimRatio: 0.89,
    },
    front = { ...rear, cx: 825 };
  for (const wheel of [rear, front]) {
    const c = wheel.cx,
      y = wheel.cy;
    for (let i = 0; i < 32; i++) {
      const a = (i * Math.PI) / 16;
      line(
        ctx,
        [
          [c + Math.cos(a + 0.35) * 6, y + Math.sin(a + 0.35) * 6],
          [c + Math.cos(a) * 143, y + Math.sin(a) * 143],
        ],
        i % 2 ? "#969c9b" : "#b8bfbd",
        1.3,
      );
    }
    ctx.strokeStyle = "#242a28";
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.arc(c, y, 153, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = "#9da6a5";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(c, y, 144.5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "#929c9c";
    ctx.beginPath();
    ctx.arc(c, y, 8, 0, Math.PI * 2);
    ctx.fill();
  }
  component(
    "frame",
    (c) => {
      const g = c.createLinearGradient(0, 235, 0, 430);
      g.addColorStop(0, "#d2bd8d");
      g.addColorStop(0.5, "#b5a174");
      g.addColorStop(1, "#8d7955");
      line(
        c,
        [
          [245, 423],
          [415, 245],
          [485, 435],
          [245, 423],
        ],
        "#aa976e",
        8,
      );
      c.strokeStyle = g;
      c.lineWidth = 13;
      c.lineCap = "round";
      c.lineJoin = "round";
      c.beginPath();
      c.moveTo(415, 245);
      c.lineTo(738, 245);
      c.lineTo(725, 290);
      c.lineTo(485, 435);
      c.lineTo(415, 245);
      c.stroke();
      line(
        c,
        [
          [420, 242],
          [731, 242],
        ],
        "#e1d0ac",
        2,
      );
    },
    568,
    330,
    380,
    220,
  );
  component(
    "fork",
    (c) => {
      line(
        c,
        [
          [725, 286],
          [777, 395],
          [825, 423],
        ],
        "#bda77b",
        12,
      );
      line(
        c,
        [
          [730, 285],
          [781, 393],
          [825, 423],
        ],
        "#e0cda3",
        2,
      );
    },
    779,
    356,
    105,
    155,
  );
  component(
    "seatpost",
    (c) =>
      line(
        c,
        [
          [416, 244],
          [399, 203],
        ],
        "#a2aaaa",
        10,
      ),
    407,
    223,
    14,
    50,
  );
  component(
    "saddle",
    (c) => {
      c.fillStyle = "#292f2c";
      c.beginPath();
      c.moveTo(350, 192);
      c.bezierCurveTo(380, 181, 420, 191, 460, 195);
      c.lineTo(458, 203);
      c.bezierCurveTo(422, 205, 377, 213, 349, 203);
      c.closePath();
      c.fill();
      line(
        c,
        [
          [376, 213],
          [411, 213],
          [429, 204],
        ],
        "#8b9492",
        3,
      );
    },
    401,
    200,
    120,
    34,
  );
  component(
    "stem",
    (c) =>
      line(
        c,
        [
          [738, 242],
          [748, 204],
          [780, 204],
        ],
        "#9ca6a5",
        11,
      ),
    760,
    210,
    55,
    45,
  );
  component(
    "tape",
    (c) => {
      c.strokeStyle = "#285f86";
      c.lineWidth = 14;
      c.lineCap = "round";
      c.beginPath();
      c.moveTo(774, 204);
      c.bezierCurveTo(830, 195, 847, 217, 842, 247);
      c.bezierCurveTo(836, 272, 816, 277, 804, 270);
      c.stroke();
      for (let i = 0; i < 7; i++)
        line(
          c,
          [
            [783 + i * 7, 199 + i * 0.9],
            [785 + i * 7, 209 + i * 0.9],
          ],
          "#76a2bc",
          1.3,
        );
    },
    820,
    231,
    85,
    90,
  );
  component(
    "hoods",
    (c) => {
      line(
        c,
        [
          [828, 205],
          [839, 195],
          [848, 200],
          [845, 225],
        ],
        "#252d2c",
        11,
      );
      line(
        c,
        [
          [847, 223],
          [858, 253],
        ],
        "#9da6a5",
        4,
      );
    },
    842,
    217,
    35,
    62,
  );
  component(
    "brake-front",
    (c) => {
      line(
        c,
        [
          [751, 300],
          [738, 285],
          [756, 280],
          [768, 300],
        ],
        "#87928e",
        6,
      );
    },
    752,
    292,
    40,
    30,
  );
  component(
    "brake-rear",
    (c) => {
      line(
        c,
        [
          [355, 307],
          [374, 295],
          [382, 309],
        ],
        "#87928e",
        6,
      );
    },
    369,
    303,
    40,
    26,
  );
  component(
    "pedals",
    (c) => {
      c.strokeStyle = "#8f9995";
      c.lineWidth = 7;
      c.beginPath();
      c.arc(485, 435, 36, 0, Math.PI * 2);
      c.stroke();
      line(
        c,
        [
          [485, 435],
          [525, 464],
        ],
        "#aeb7b3",
        9,
      );
      line(
        c,
        [
          [511, 468],
          [545, 468],
        ],
        "#262e2a",
        9,
      );
      line(
        c,
        [
          [485, 435],
          [245, 423],
          [245, 443],
          [485, 469],
        ],
        "#717d74",
        2,
      );
    },
    507,
    451,
    105,
    80,
  );
  // Lettering is its own protected source layer.
  const protect = canvas(width, height),
    pc = protect.getContext("2d")!;
  pc.save();
  pc.translate(597, 365);
  pc.rotate(-0.54);
  pc.font = "bold 15px sans-serif";
  pc.fillStyle = "#39433a";
  pc.fillText("ATELIER", -33, 0);
  pc.restore();
  ctx.drawImage(protect, 0, 0);
  const source = canvas(width, height),
    sc = source.getContext("2d")!;
  sc.fillStyle = "#eeede7";
  sc.fillRect(0, 0, width, height);
  sc.drawImage(bike, 0, 0);
  const pixels = ctx.getImageData(0, 0, width, height).data,
    alpha = Uint8ClampedArray.from(
      { length: width * height },
      (_, i) => pixels[i * 4 + 3],
    );
  parts.find((t) => t.id === "frame")!.marker = { x: 600, y: 365 };
  parts.find((t) => t.id === "fork")!.marker = { x: 760, y: 360 };
  parts.find((t) => t.id === "tape")!.marker = { x: 839, y: 231 };
  let p: Project = {
    format: "bikestyler-project",
    version: 1,
    id: uid(),
    name: "Atelier 01 · practice illustration",
    createdAt: date,
    updatedAt: date,
    original: source.toDataURL(),
    source: source.toDataURL(),
    width,
    height,
    workWidth: width,
    workHeight: height,
    cutout: alphaURL(alpha, width, height),
    protection: protect.toDataURL(),
    orientation: "right",
    parts,
    styles: {},
    decals: [],
    designs: [],
    customEntries: [],
    favourites: [],
    setupAccepted: true,
    metrics: { setupMs: 0, edits: [] },
  };
  const wheels = [
    ...wheelParts(front, "front", p),
    ...wheelParts(rear, "rear", p),
  ].map((t) => ({ ...t, status: "confirmed" as const }));
  p = {
    ...p,
    parts: [
      ...parts.filter((t) => !wheels.some((q) => q.id === t.id)),
      ...wheels,
    ],
  };
  return p;
}
