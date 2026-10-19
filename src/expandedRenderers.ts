import type { CatalogueEntry } from "./types";
import { EXPANDED_RENDERER_IDS } from "./expandedCatalogue";

/** Original deterministic side-view illustrations in a transparent 100×100 box. */
export function renderExpandedComponent(
  ctx: CanvasRenderingContext2D,
  entry: CatalogueEntry,
  colour = "#34413d",
): boolean {
  if (!EXPANDED_RENDERER_IDS.includes(entry.renderer)) return false;
  const category = entry.renderer.slice("expanded-".length);
  const form = String(entry.parameters.form ?? "");
  const silver = "#adb5b5",
    light = "#e1e6e4",
    dark = "#202927";
  const metal = ctx.createLinearGradient(10, 8, 78, 90);
  metal.addColorStop(0, light);
  metal.addColorStop(0.3, colour);
  metal.addColorStop(0.65, colour);
  metal.addColorStop(1, dark);
  const line = (
    points: number[][],
    width = 3,
    stroke: string | CanvasGradient = colour,
    close = false,
    fill?: string | CanvasGradient,
  ) => {
    ctx.beginPath();
    points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    if (close) ctx.closePath();
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    if (width) {
      ctx.lineWidth = width;
      ctx.strokeStyle = stroke;
      ctx.stroke();
    }
  };
  const circle = (
    x: number,
    y: number,
    r: number,
    fill: string | CanvasGradient,
    stroke?: string,
    width = 1,
  ) => {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = width;
      ctx.stroke();
    }
  };
  const ring = (
    x: number,
    y: number,
    outer: number,
    inner: number,
    fill: string | CanvasGradient = colour,
  ) => {
    ctx.beginPath();
    ctx.arc(x, y, outer, 0, Math.PI * 2);
    ctx.arc(x, y, inner, 0, Math.PI * 2, true);
    ctx.fillStyle = fill;
    ctx.fill("evenodd");
  };
  const rect = (
    x: number,
    y: number,
    w: number,
    h: number,
    fill: string | CanvasGradient = colour,
    radius = 2,
  ) => {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, radius);
    ctx.fillStyle = fill;
    ctx.fill();
  };
  const curve = (
    draw: () => void,
    width = 4,
    stroke: string | CanvasGradient = colour,
  ) => {
    ctx.beginPath();
    draw();
    ctx.lineWidth = width;
    ctx.strokeStyle = stroke;
    ctx.stroke();
  };
  const bolt = (x: number, y: number, r = 2.2) => {
    circle(x, y, r + 1, dark);
    circle(x, y, r, silver);
    line(
      [
        [x - r * 0.45, y],
        [x + r * 0.45, y],
      ],
      0.7,
      dark,
    );
  };
  const gear = (
    x: number,
    y: number,
    radius: number,
    inner: number,
    teeth = 36,
    fill: string | CanvasGradient = colour,
    wave = 0,
  ) => {
    ctx.beginPath();
    for (let i = 0; i <= teeth * 4; i++) {
      const a = (i / (teeth * 4)) * Math.PI * 2;
      const r = radius - (i % 4 < 2 ? 0 : 1.9) + Math.sin(a * 6) * wave;
      const px = x + Math.cos(a) * r,
        py = y + Math.sin(a) * r;
      i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    }
    ctx.closePath();
    ctx.moveTo(x + inner, y);
    ctx.arc(x, y, inner, 0, Math.PI * 2, true);
    ctx.fillStyle = fill;
    ctx.fill("evenodd");
  };
  const spider = (
    x: number,
    y: number,
    outer: number,
    inner: number,
    count: number,
    width = 6,
    fill: string | CanvasGradient = colour,
    swept = false,
    asymmetric = false,
  ) => {
    for (let i = 0; i < count; i++) {
      const a =
        (i / count) * Math.PI * 2 -
        Math.PI / 2 +
        (asymmetric ? (i % 2 ? 0.2 : -0.2) : 0);
      const twist = swept ? 0.42 : 0;
      line(
        [
          [x + Math.cos(a + twist) * inner, y + Math.sin(a + twist) * inner],
          [x + Math.cos(a) * outer, y + Math.sin(a) * outer],
        ],
        width,
        fill,
      );
      bolt(x + Math.cos(a) * (outer - 2), y + Math.sin(a) * (outer - 2), 1.1);
    }
    ring(x, y, inner + 3, Math.max(3, inner - 3), fill);
  };
  const blade = (
    x: number,
    y: number,
    endX: number,
    endY: number,
    width = 6,
  ) => {
    curve(
      () => {
        ctx.moveTo(x, y);
        ctx.bezierCurveTo(x + 9, y + 16, endX - 15, endY - 13, endX, endY);
      },
      width,
      metal,
    );
    curve(
      () => {
        ctx.moveTo(x - 1, y + 4);
        ctx.bezierCurveTo(
          x + 5,
          y + 18,
          endX - 13,
          endY - 12,
          endX - 2,
          endY - 1,
        );
      },
      0.7,
      silver,
    );
  };
  const hood = (tall = false, classic = false) => {
    ctx.beginPath();
    ctx.moveTo(19, 26);
    ctx.quadraticCurveTo(36, 35, 53, 25);
    ctx.bezierCurveTo(59, 20, 58, tall ? 5 : 12, 67, tall ? 7 : 16);
    ctx.quadraticCurveTo(77, 23, 69, 37);
    ctx.lineTo(62, 47);
    ctx.quadraticCurveTo(36, 52, 21, 41);
    ctx.closePath();
    ctx.fillStyle = classic ? "#7d6250" : colour;
    ctx.fill();
    curve(
      () => {
        ctx.moveTo(22, 29);
        ctx.quadraticCurveTo(38, 39, 54, 29);
      },
      1,
      "#77817b",
    );
    blade(66, 42, 61, 91);
    bolt(65, 42);
  };
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  switch (category) {
    case "brake_levers":
      if (form === "aero" || form === "classic") {
        hood(form === "classic", form === "classic");
        if (form === "classic")
          curve(
            () => {
              ctx.moveTo(53, 25);
              ctx.bezierCurveTo(51, 3, 27, 4, 24, 13);
            },
            2,
            silver,
          );
      } else if (
        form === "short" ||
        form === "long" ||
        form === "interrupter" ||
        form === "inline"
      ) {
        ring(28, 31, form === "interrupter" ? 10 : 13, 7, metal);
        line(
          [
            [34, 27],
            [51, 29],
            [55, 40],
            [39, 44],
            [32, 39],
          ],
          1,
          dark,
          true,
          metal,
        );
        bolt(49, 36);
        const endX = form === "long" ? 92 : form === "inline" ? 83 : 78;
        curve(
          () => {
            ctx.moveTo(48, 38);
            ctx.bezierCurveTo(
              57,
              form === "inline" ? 40 : 53,
              69,
              form === "interrupter" ? 78 : 58,
              endX,
              form === "inline" ? 47 : form === "interrupter" ? 66 : 56,
            );
          },
          form === "long" ? 7 : 5,
          metal,
        );
        rect(37, 19, 13, 5, silver);
        line(
          [
            [50, 21],
            [62, 21],
          ],
          2,
          dark,
        );
      } else {
        ctx.save();
        ctx.translate(28, 31);
        ctx.rotate(form === "bullhorn" ? -0.32 : 0.25);
        rect(-10, -9, 30, 18, metal, 5);
        ring(-5, 0, 10, 7, dark);
        if (form === "bullhorn")
          curve(
            () => {
              ctx.moveTo(17, 2);
              ctx.bezierCurveTo(36, 5, 38, 42, 28, 53);
            },
            6,
            metal,
          );
        else
          line(
            [
              [18, 2],
              [37, 23],
              [44, 54],
            ],
            5,
            metal,
          );
        bolt(17, 2);
        ctx.restore();
      }
      break;
    case "controls":
      if (form.includes("road") || form === "twin-paddle") {
        hood(form === "tall-road");
        line(
          [
            [60, 48],
            [49, 72],
            [53, 76],
          ],
          4,
          silver,
        );
        if (form === "twin-paddle")
          line(
            [
              [55, 45],
              [41, 66],
              [44, 70],
            ],
            4,
            colour,
          );
        if (form === "tall-road") rect(28, 37, 11, 7, dark);
      } else if (form === "button") {
        ring(28, 31, 13, 8, metal);
        rect(34, 23, 38, 26, colour, 12);
        rect(42, 28, 10, 14, silver, 3);
        rect(57, 28, 10, 14, dark, 3);
        line(
          [
            [46, 32],
            [46, 38],
          ],
          1,
          dark,
        );
        line(
          [
            [44, 35],
            [48, 35],
          ],
          1,
          dark,
        );
        line(
          [
            [60, 35],
            [64, 35],
          ],
          1,
          silver,
        );
      } else if (form === "flat-trigger") {
        ring(28, 31, 12, 7, metal);
        rect(36, 27, 24, 20, colour, 6);
        curve(
          () => {
            ctx.moveTo(54, 35);
            ctx.quadraticCurveTo(65, 54, 91, 53);
          },
          5,
          metal,
        );
        line(
          [
            [48, 44],
            [60, 64],
            [68, 66],
          ],
          5,
          colour,
        );
        line(
          [
            [41, 43],
            [41, 58],
            [33, 62],
          ],
          4,
          silver,
        );
        bolt(52, 36);
      } else {
        rect(18, 23, 34, 17, metal, 5);
        ring(27, 31, 11, 7, dark);
        blade(50, 35, 62, 86, 5);
        line(
          [
            [44, 39],
            [29, 58],
            [33, 61],
          ],
          5,
          colour,
        );
        bolt(50, 35);
      }
      break;
    case "shifters":
      if (form === "downtube") {
        ring(35, 55, 11, 4, metal);
        line(
          [
            [32, 51],
            [58, 15],
            [66, 15],
            [68, 21],
            [39, 60],
          ],
          1,
          dark,
          true,
          metal,
        );
        bolt(35, 55);
      } else if (form === "thumb") {
        ring(35, 55, 13, 8, metal);
        rect(32, 29, 21, 18, colour, 7);
        line(
          [
            [43, 34],
            [69, 19],
            [79, 26],
            [75, 32],
            [46, 41],
          ],
          1,
          dark,
          true,
          metal,
        );
        bolt(43, 36);
      } else if (form === "bar-end") {
        rect(17, 45, 33, 20, metal, 4);
        ring(24, 55, 11, 7, dark);
        line(
          [
            [43, 52],
            [63, 20],
            [75, 24],
            [52, 60],
          ],
          1,
          dark,
          true,
          colour,
        );
        bolt(45, 54);
      } else if (form === "trigger") {
        ring(35, 55, 13, 8, metal);
        rect(39, 38, 32, 24, colour, 8);
        line(
          [
            [56, 59],
            [76, 77],
            [86, 72],
          ],
          6,
          metal,
        );
        line(
          [
            [48, 60],
            [43, 80],
            [33, 79],
          ],
          5,
          colour,
        );
        bolt(57, 51);
      } else if (form === "twist") {
        rect(18, 40, 63, 30, metal, 7);
        rect(49, 35, 17, 40, colour, 4);
        for (let x = 24; x < 47; x += 4)
          line(
            [
              [x, 43],
              [x, 67],
            ],
            2,
            dark,
          );
        for (let x = 70; x < 80; x += 3)
          line(
            [
              [x, 44],
              [x, 66],
            ],
            1,
            dark,
          );
        bolt(35, 55);
      } else {
        ring(35, 55, 10, 6, metal);
        rect(24, 48, 39, 10, metal);
        line(
          [
            [28, 53],
            [18, 17],
          ],
          7,
          colour,
        );
        line(
          [
            [59, 53],
            [71, 17],
          ],
          7,
          colour,
        );
        bolt(29, 53);
        bolt(58, 53);
      }
      break;
    case "cranksets": {
      const x = 43,
        y = 43,
        count =
          form === "six-arm"
            ? 6
            : form === "four-arm"
              ? 4
              : form === "three-arm"
                ? 3
                : 5;
      if (form === "disc") {
        gear(x, y, 35, 5, 40, metal);
        ring(x, y, 31, 29, silver);
      } else {
        if (form === "triple" || form === "five-arm" || form === "four-arm")
          gear(x, y, 25, 22, 30, silver);
        if (form === "triple") gear(x, y, 18, 15, 23, dark);
        gear(
          x,
          y,
          35,
          form === "direct" ? 23 : 30,
          42,
          metal,
          form === "direct" ? 1.3 : 0,
        );
        spider(
          x,
          y,
          form === "direct" ? 26 : 31,
          8,
          count,
          form === "four-arm" || form === "direct" ? 8 : 4,
          metal,
          form === "three-arm",
          form === "four-arm",
        );
        if (form === "triple") ring(x, y, 38, 36, "#727d76");
      }
      line(
        [
          [x - 5, y - 5],
          [x + 6, y - 3],
          [87, 82],
          [85, 91],
          [77, 93],
          [x - 4, y + 7],
        ],
        1,
        dark,
        true,
        metal,
      );
      if (form === "four-arm" || form === "direct")
        line(
          [
            [x + 9, y + 9],
            [77, 80],
          ],
          2,
          silver,
        );
      bolt(x, y, 4);
      ring(82, 86, 5, 2.4, silver);
      break;
    }
    case "chainrings": {
      ctx.save();
      if (form === "oval") {
        ctx.translate(50, 50);
        ctx.scale(1, 0.78);
        ctx.translate(-50, -50);
      }
      gear(
        50,
        50,
        44,
        form === "guard" ? 15 : 36,
        48,
        metal,
        form === "wave" ? 0.9 : 0,
      );
      if (form === "guard") {
        for (let i = 0; i < 12; i++) {
          const a = (i * Math.PI) / 6;
          line(
            [
              [50 + Math.cos(a) * 22, 50 + Math.sin(a) * 22],
              [50 + Math.cos(a) * 32, 50 + Math.sin(a) * 32],
            ],
            2.5,
            dark,
          );
        }
      } else
        spider(
          50,
          50,
          37,
          form === "track" ? 23 : 12,
          form === "wave" ? 6 : form === "four" ? 4 : 5,
          form === "four" ? 8 : form === "track" ? 3 : 5,
          metal,
          form === "wave",
          form === "four",
        );
      ctx.restore();
      break;
    }
    case "bottom_brackets":
      rect(15, 44, 70, 12, silver, form === "cartridge" ? 0 : 4);
      rect(28, 33, 44, 34, metal, 4);
      if (form === "external") {
        rect(21, 29, 13, 42, colour, 3);
        rect(66, 29, 13, 42, colour, 3);
      }
      if (form === "cartridge") {
        rect(27, 31, 9, 38, colour, 1);
        rect(65, 31, 8, 38, colour, 1);
        rect(10, 43, 13, 14, dark, 0);
        rect(79, 43, 12, 14, dark, 0);
      }
      if (form === "pressfit") {
        rect(24, 32, 8, 36, silver, 3);
        rect(68, 32, 8, 36, silver, 3);
        line(
          [
            [34, 38],
            [65, 38],
          ],
          1,
          light,
        );
      }
      if (form === "one-piece") {
        rect(8, 46, 84, 8, dark, 1);
        rect(28, 30, 11, 40, silver, 5);
        rect(61, 30, 11, 40, silver, 5);
      }
      for (let x = 25; x < 31; x += 2)
        line(
          [
            [x, 35],
            [x, 65],
          ],
          0.7,
          dark,
        );
      break;
    case "chains":
      for (let i = 0; i < 9; i++) {
        const x = 10 + i * 9,
          y = 50 - Math.sin((i / 8) * Math.PI) * 10;
        const nextY = 50 - Math.sin(((i + 1) / 8) * Math.PI) * 10;
        if (i < 8) {
          line(
            [
              [x, y],
              [x + 9, nextY],
            ],
            form === "wide" ? 10 : form === "half-link" ? 8 : 7,
            i % 2 ? silver : metal,
          );
          if (form === "hollow")
            line(
              [
                [x + 3, y + (nextY - y) / 3],
                [x + 6, y + ((nextY - y) * 2) / 3],
              ],
              2.5,
              dark,
            );
          if (form === "half-link")
            line(
              [
                [x, y - 3],
                [x + 4, y - 5],
                [x + 9, nextY - 2],
              ],
              2,
              colour,
            );
        }
        bolt(x, y, form === "wide" ? 2 : 1.6);
      }
      break;
    case "freewheels": {
      const count = form === "triple" ? 3 : form === "five" ? 5 : 1;
      if (form === "window") {
        gear(50, 50, 39, 31, 28, metal);
        spider(50, 50, 33, 15, 6, 5, metal);
      } else {
        for (let i = 0; i < count; i++)
          gear(
            50,
            50,
            40 - i * (count === 5 ? 5.7 : 9),
            i === count - 1 ? 13 : 15,
            28 - i * 3,
            i % 2 ? silver : metal,
          );
      }
      ring(
        50,
        50,
        form === "wide" ? 29 : 18,
        11,
        form === "wide" ? colour : silver,
      );
      ring(50, 50, 12, 8, dark);
      for (let i = 0; i < 4; i++) {
        const a = (i * Math.PI) / 2;
        circle(50 + Math.cos(a) * 15, 50 + Math.sin(a) * 15, 1.5, dark);
      }
      break;
    }
    case "cassettes": {
      const count =
        form === "classic"
          ? 7
          : form === "close"
            ? 9
            : form === "road"
              ? 11
              : form === "wide"
                ? 12
                : form === "compact"
                  ? 6
                  : 7;
      const outer = form === "compact" ? 34 : form === "road" ? 39 : 45;
      if (form === "open") {
        gear(50, 50, outer, 37, 44, metal);
        spider(50, 50, 39, 18, 6, 5, colour, true);
      }
      for (let i = form === "open" ? 3 : 0; i < count; i++) {
        const r =
          outer - ((outer - (form === "close" ? 21 : 16)) * i) / (count - 1);
        gear(
          50,
          50,
          r,
          Math.max(10, r - (outer - 15) / count - 0.8),
          Math.max(14, 42 - i * 2),
          i % 2 ? silver : metal,
        );
      }
      ring(50, 50, 15, 7, dark);
      ring(50, 50, 11, 7, silver);
      break;
    }
    case "derailleurs":
      if (form.startsWith("front")) {
        if (form === "front-clamp") ring(38, 27, 14, 9, metal);
        else {
          rect(33, 13, 10, 30, metal, 2);
          bolt(38, 27);
        }
        line(
          [
            [40, 39],
            [51, 50],
            [73, 49],
            [84, 62],
            [75, 73],
            [33, 68],
            [28, 58],
            [40, 51],
          ],
          2,
          dark,
          true,
          metal,
        );
        curve(
          () => {
            ctx.moveTo(35, 59);
            ctx.quadraticCurveTo(58, 68, 77, 61);
          },
          4,
          dark,
        );
        bolt(45, 47);
      } else {
        ring(38, 19, 9, 4, metal);
        line(
          [
            [39, 27],
            [50, 28],
            [62, 42],
            [46, 55],
            [30, 40],
          ],
          1,
          dark,
          true,
          metal,
        );
        line(
          [
            [37, 30],
            [48, 44],
          ],
          3,
          silver,
        );
        line(
          [
            [46, 29],
            [58, 42],
          ],
          3,
          colour,
        );
        bolt(34, 38);
        bolt(57, 40);
        if (form === "clutch") {
          circle(50, 45, 13, colour, silver, 1.5);
          circle(50, 45, 6, dark);
        }
        if (form === "electronic") {
          line(
            [
              [48, 26],
              [69, 29],
              [73, 44],
              [60, 49],
              [53, 40],
            ],
            1,
            dark,
            true,
            colour,
          );
          rect(63, 28, 7, 8, silver);
        }
        const y2 = form === "short" ? 77 : form === "long" ? 94 : 88;
        const x2 = form === "electronic" ? 48 : form === "clutch" ? 41 : 34;
        line(
          [
            [50, 51],
            [x2, y2],
          ],
          form === "electronic" ? 11 : 7,
          metal,
        );
        gear(50, 55, 10, 3, 11, dark);
        gear(x2, y2 - 5, 10, 3, 11, dark);
        bolt(50, 55);
        bolt(x2, y2 - 5);
      }
      break;
    case "tubes":
      if (form === "folded") {
        rect(26, 24, 49, 55, dark, 10);
        rect(32, 29, 37, 44, colour, 6);
        for (let y = 35; y < 73; y += 9)
          curve(
            () => {
              ctx.moveTo(32, y);
              ctx.quadraticCurveTo(50, y + 4, 69, y);
            },
            2,
            dark,
          );
        rect(45, 22, 13, 60, "#796c55", 2);
        rect(69, 37, 15, 5, silver, 1);
      } else {
        const width = form === "slim" ? 4 : form === "touring" ? 7 : 11;
        ring(50, 52, 36, 36 - width, colour);
        const length = form === "slim" ? 14 : 9;
        rect(48, 16 - length, form === "wide" ? 5 : 3, length + 4, silver, 1);
        rect(47, 16 - length, form === "wide" ? 7 : 5, 4, dark, 1);
      }
      break;
    case "adapters":
      if (form === "post") {
        ctx.beginPath();
        ctx.moveTo(20, 51);
        ctx.bezierCurveTo(25, 14, 77, 14, 85, 52);
        ctx.bezierCurveTo(84, 65, 68, 65, 67, 52);
        ctx.bezierCurveTo(63, 34, 42, 34, 38, 51);
        ctx.bezierCurveTo(38, 64, 20, 64, 20, 51);
        ctx.closePath();
        ctx.moveTo(33, 51);
        ctx.arc(29, 51, 4, 0, Math.PI * 2, true);
        ctx.moveTo(80, 52);
        ctx.arc(76, 52, 4, 0, Math.PI * 2, true);
        ctx.fillStyle = metal;
        ctx.fill("evenodd");
      } else if (form === "flat") {
        line(
          [
            [20, 46],
            [69, 37],
            [84, 46],
            [80, 57],
            [30, 63],
            [19, 56],
          ],
          1,
          dark,
          true,
          metal,
        );
        circle(29, 51, 4, dark);
        circle(73, 48, 4, dark);
        circle(50, 52, 2, dark);
      } else if (form === "shim") {
        rect(22, 29, 57, 45, metal, 9);
        line(
          [
            [24, 60],
            [77, 60],
          ],
          2,
          dark,
        );
        ring(29, 51, 11, 7, silver);
      } else {
        ring(50, 50, 32, 20, metal);
        ring(50, 50, 25, 20, silver);
      }
      break;
    case "grips":
      if (form === "ergonomic") {
        line(
          [
            [20, 39],
            [66, 35],
            [86, 43],
            [82, 63],
            [63, 70],
            [23, 60],
          ],
          1,
          dark,
          true,
          metal,
        );
        rect(18, 37, 8, 26, silver);
        rect(79, 42, 7, 22, dark);
        curve(
          () => {
            ctx.moveTo(29, 45);
            ctx.quadraticCurveTo(56, 43, 77, 55);
          },
          1,
          silver,
        );
      } else {
        rect(18, 36, 67, 28, form === "cork" ? "#ad8961" : colour, 9);
        if (form === "mushroom") {
          rect(15, 28, 8, 44, metal, 4);
          for (let x = 26; x < 81; x += 3)
            line(
              [
                [x, 39],
                [x, 61],
              ],
              1.6,
              dark,
            );
        }
        if (form === "lock-on") {
          rect(17, 35, 8, 30, silver);
          rect(78, 35, 8, 30, silver);
          for (let x = 30; x < 75; x += 9)
            line(
              [
                [x, 41],
                [x + 4, 59],
              ],
              3,
              dark,
            );
        }
        if (form === "cork")
          for (let i = 0; i < 60; i++)
            circle(
              25 + ((i * 13.7) % 53),
              41 + ((i * 7.1) % 18),
              0.55,
              "#806444",
            );
      }
      break;
    case "baskets": {
      const top = form === "deep" ? 15 : 29,
        left = form === "box" ? 14 : 9,
        bottom = form === "deep" ? 79 : 72;
      if (form === "woven" || form === "box") {
        line(
          [
            [left, top],
            [90, top],
            [82, bottom],
            [21, bottom],
          ],
          2,
          colour,
          true,
          form === "woven" ? "#b7986c" : "#9a8060",
        );
        for (let y = top + 6; y < bottom; y += form === "box" ? 10 : 4)
          line(
            [
              [left + 4, y],
              [86, y],
            ],
            form === "box" ? 2 : 0.8,
            form === "box" ? "#584c3d" : "#806443",
          );
        for (let x = 24; x < 84; x += form === "box" ? 52 : 6)
          line(
            [
              [x, top + 2],
              [x, bottom - 1],
            ],
            form === "box" ? 5 : 1,
            colour,
          );
        if (form === "woven")
          curve(
            () => {
              ctx.moveTo(29, top);
              ctx.bezierCurveTo(29, 9, 72, 9, 72, top);
            },
            4,
            "#806443",
          );
      } else {
        line(
          [
            [left, top],
            [91, top],
            [80, bottom],
            [24, bottom],
            [left, top],
          ],
          3,
          metal,
        );
        for (let x = 18; x < 89; x += 8)
          line(
            [
              [x, top + 2],
              [27 + (x - 18) * 0.72, bottom - 2],
            ],
            1,
            colour,
          );
        for (let y = top + 9; y < bottom; y += 9)
          line(
            [
              [left + (y - top) * 0.3, y],
              [91 - (y - top) * 0.24, y],
            ],
            1,
            colour,
          );
      }
      line(
        [
          [36, bottom],
          [38, 82],
          [69, 82],
          [71, bottom],
        ],
        3,
        metal,
      );
      break;
    }
    case "cargo_cages": {
      const wide = form === "wide",
        compact = form === "compact",
        top = compact ? 29 : 13,
        bottom = compact ? 75 : 87;
      rect(45, top, 10, bottom - top, metal, 4);
      [top + 8, 45, bottom - 8].forEach((y) => bolt(50, y, 1.8));
      const left = wide ? 20 : 29,
        right = wide ? 80 : 71;
      if (form === "strapped") {
        curve(
          () => {
            ctx.moveTo(32, top);
            ctx.bezierCurveTo(16, 41, 25, 86, 50, 88);
            ctx.bezierCurveTo(75, 86, 84, 41, 68, top);
          },
          5,
          metal,
        );
        rect(24, 34, 52, 7, dark, 2);
        rect(24, 63, 52, 7, dark, 2);
        rect(65, 33, 9, 10, silver, 1);
      } else {
        line(
          [
            [50, top + 5],
            [left, top + 14],
            [left, bottom - 7],
            [50, bottom],
            [right, bottom - 7],
            [right, top + 14],
            [50, top + 5],
          ],
          4,
          metal,
        );
        line(
          [
            [left, 45],
            [right, 45],
          ],
          3,
          colour,
        );
        line(
          [
            [left, bottom - 7],
            [right, bottom - 7],
          ],
          wide ? 7 : 4,
          colour,
        );
        if (compact)
          curve(
            () => {
              ctx.moveTo(left, 50);
              ctx.quadraticCurveTo(50, 24, right, 50);
            },
            3,
            silver,
          );
      }
      break;
    }
    case "disc_rotors": {
      const count =
        form === "centerlock"
          ? 10
          : form === "eight"
            ? 8
            : form === "scalloped"
              ? 4
              : form === "vented"
                ? 5
                : 6;
      const inner = form === "vented" ? 30 : form === "eight" ? 39 : 35;
      if (form === "floating" || form === "scalloped")
        gear(
          50,
          50,
          44,
          inner,
          form === "floating" ? 30 : 24,
          silver,
          form === "scalloped" ? 2 : 1,
        );
      else ring(50, 50, 44, inner, silver);
      spider(
        50,
        50,
        inner + 1,
        form === "centerlock" ? 12 : 10,
        count,
        form === "scalloped" ? 9 : form === "eight" ? 2.8 : 4,
        metal,
        form === "floating",
      );
      for (let i = 0; i < (form === "vented" ? 18 : 30); i++) {
        const a = (i / (form === "vented" ? 18 : 30)) * Math.PI * 2;
        if (form === "vented")
          line(
            [
              [50 + Math.cos(a) * 34, 50 + Math.sin(a) * 34],
              [50 + Math.cos(a + 0.06) * 40, 50 + Math.sin(a + 0.06) * 40],
            ],
            1.6,
            dark,
          );
        else circle(50 + Math.cos(a) * 40, 50 + Math.sin(a) * 40, 0.9, dark);
      }
      if (form === "centerlock") gear(50, 50, 13, 7, 20, dark);
      else ring(50, 50, 13, 7, metal);
      if (form === "floating")
        for (let i = 0; i < 6; i++) {
          const a = (i * Math.PI) / 3 - Math.PI / 2;
          bolt(50 + Math.cos(a) * 35, 50 + Math.sin(a) * 35, 2);
        }
      break;
    }
  }
  ctx.restore();
  return true;
}
