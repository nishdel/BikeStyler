import { renderExpandedComponent } from "./expandedRenderers";
import { renderDetailedWheel } from "./detailedWheels";
import { renderDetailedSaddle,renderDetailedCrank } from "./realisticParts";
import type { CatalogueEntry } from "./types";

/** Transparent local 100x100 reference box; wide tyres may extend beyond it. Caller owns transforms. */
export function renderComponent(
  ctx: CanvasRenderingContext2D,
  entry: CatalogueEntry,
  colour = "#34413d",
): void {
  if(entry.renderer==='saddles'){renderDetailedSaddle(ctx,entry,colour);return;}
  if(entry.renderer==='expanded-cranksets'){renderDetailedCrank(ctx,entry,colour);return;}
  if(renderDetailedWheel(ctx,entry,colour))return;
  if (renderExpandedComponent(ctx, entry, colour)) return;
  const p = entry.parameters;
  const form = String(p.form ?? "");
  const n = (key: string, fallback: number) =>
    typeof p[key] === "number" && Number.isFinite(p[key])
      ? Number(p[key])
      : fallback;
  const clamp = (value: number, min: number, max: number) =>
    Math.max(min, Math.min(max, value));
  const path = (
    points: number[][],
    stroke = colour,
    width = 3,
    close = false,
    fill?: string,
  ) => {
    ctx.beginPath();
    points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    if (close) ctx.closePath();
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    if (width) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = width;
      ctx.stroke();
    }
  };
  const circle = (
    x: number,
    y: number,
    radius: number,
    fill?: string,
    stroke?: string,
    width = 1,
  ) => {
    ctx.beginPath();
    ctx.arc(x, y, Math.max(0, radius), 0, Math.PI * 2);
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = width;
      ctx.stroke();
    }
  };
  const rect = (
    x: number,
    y: number,
    w: number,
    h: number,
    fill = colour,
    radius = 0,
  ) => {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, radius);
    ctx.fillStyle = fill;
    ctx.fill();
  };
  const ring = (outer: number, inner: number, fill = colour) => {
    ctx.beginPath();
    ctx.arc(50, 50, outer, 0, Math.PI * 2);
    ctx.arc(50, 50, Math.max(0, inner), 0, Math.PI * 2, true);
    ctx.fillStyle = fill;
    ctx.fill("evenodd");
  };
  const curve = (draw: () => void, width = 5, stroke = colour) => {
    ctx.beginPath();
    draw();
    ctx.lineWidth = width;
    ctx.strokeStyle = stroke;
    ctx.stroke();
  };
  const spokes = (
    spokeForm: string,
    count: number,
    radius = 42,
    spokeColour = colour,
  ) => {
    const hx = 50 + n("hubOffsetX", 0),
      hy = 50 + n("hubOffsetY", 0);
    count = clamp(Math.round(count), 3, 72);
    for (let i = 0; i < count; i++) {
      const angle =
        (i * 2 * Math.PI) / count +
        (spokeForm === "paired" ? (i % 2 ? -0.13 : 0.13) : 0);
      const offset = spokeForm === "cross" ? (i % 2 ? 0.5 : -0.5) : 0;
      const x = 50 + Math.cos(angle) * radius,
        y = 50 + Math.sin(angle) * radius;
      if (spokeForm === "blade") {
        ctx.beginPath();
        ctx.moveTo(
          hx + Math.cos(angle - 0.5) * 5,
          hy + Math.sin(angle - 0.5) * 5,
        );
        ctx.quadraticCurveTo(
          50 + Math.cos(angle + 0.3) * radius * 0.6,
          50 + Math.sin(angle + 0.3) * radius * 0.6,
          x,
          y,
        );
        ctx.lineTo(
          50 + Math.cos(angle + 0.19) * radius,
          50 + Math.sin(angle + 0.19) * radius,
        );
        ctx.quadraticCurveTo(
          50 + Math.cos(angle + 0.5) * radius * 0.5,
          50 + Math.sin(angle + 0.5) * radius * 0.5,
          hx,
          hy,
        );
        ctx.closePath();
        ctx.fillStyle = spokeColour;
        ctx.fill();
      } else {
        path(
          [
            [
              hx + Math.cos(angle + offset) * 5,
              hy + Math.sin(angle + offset) * 5,
            ],
            [x, y],
          ],
          spokeColour,
          n("spokeWidth", 1.15),
        );
      }
    }
  };
  const silver = "#aab4b3";
  const dark = "#202927";
  const pale = "#d2d9d3";
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  switch (entry.renderer) {
    case "tyres": {
      // A true annulus; never paint a disc or clear the already-composited wheel centre.
      const inner =
        48 * clamp(n("innerRatio", 1 - n("width", 10) / 64), 0.5, 0.98);
      const visualWidth = clamp(
        n("visualWidth", n("width", 10) / 10),
        0.5,
        1.5,
      );
      const outer = inner + (48 - inner) * visualWidth;
      const thickness = outer - inner;
      ring(outer, inner, colour);
      ctx.save();
      ctx.beginPath();
      ctx.arc(50, 50, outer, 0, Math.PI * 2);
      ctx.arc(50, 50, inner, 0, Math.PI * 2, true);
      ctx.clip("evenodd");
      if (typeof p.sidewall === "string")
        ring(outer - thickness * 0.3, inner, p.sidewall);
      circle(50, 50, outer - 0.6, undefined, "#49504a", 0.6);
      circle(50, 50, inner + 0.55, undefined, "#171e1b", 0.8);
      if (form === "grooved") {
        circle(50, 50, outer - thickness * 0.22, undefined, "#72746a", 0.65);
        circle(50, 50, outer - thickness * 0.43, undefined, "#0f1713", 0.7);
      }
      const count = clamp(
        Math.round(
          form === "knobby" ? n("blockCount", 44) : form === "file" ? 90 : 56,
        ),
        8,
        120,
      );
      if (form !== "slick" && form !== "grooved")
        for (let i = 0; i < count; i++) {
          ctx.save();
          ctx.translate(50, 50);
          ctx.rotate((i * Math.PI * 2) / count);
          const span = thickness * (p.sidewall ? 0.28 : 0.6);
          if (form === "knobby")
            rect(-1.3, -outer + 0.1, 2.6, Math.max(0.7, span), "#555b51", 0.25);
          else if (form === "chevron")
            path(
              [
                [-1.5, -outer + 0.8],
                [1, -outer + 0.8 + span / 2],
                [-1.5, -outer + 0.8 + span],
              ],
              "#646b61",
              0.65,
            );
          else
            path(
              [
                [-0.7, -outer + 0.7],
                [0.7, -outer + 0.7 + span],
              ],
              "#62675e",
              0.6,
            );
          ctx.restore();
        }
      ctx.restore();
      break;
    }
    case "wheels": {
      const depth = clamp(n("rimDepth", n("depth", 5)), 0.7, 18);
      ring(48, 48 - depth);
      circle(50, 50, 47, undefined, silver, 0.8);
      spokes(
        form,
        n("count", 24),
        48 - depth + 0.5,
        String(p.spokeColour || silver),
      );
      circle(
        50 + n("hubOffsetX", 0),
        50 + n("hubOffsetY", 0),
        n("hubRadius", 5),
        silver,
        dark,
        n("spokeWidth", 1),
      );
      circle(
        50 + n("hubOffsetX", 0),
        50 + n("hubOffsetY", 0),
        n("hubRadius", 5) * 0.3,
        dark,
      );
      break;
    }
    case "rims": {
      const depth = clamp(n("depth", 5), 2, 18);
      if (form === "scalloped") {
        ctx.beginPath();
        ctx.arc(50, 50, 48, 0, Math.PI * 2);
        ctx.moveTo(50 + 48 - depth, 50);
        for (let i = 0; i <= 180; i++) {
          const a = (-i / 180) * Math.PI * 2,
            r = 48 - depth + Math.sin(a * 12) * 1.8;
          ctx.lineTo(50 + Math.cos(a) * r, 50 + Math.sin(a) * r);
        }
        ctx.closePath();
        ctx.fillStyle = colour;
        ctx.fill("evenodd");
      } else ring(48, 48 - depth);
      circle(50, 50, 47, undefined, silver, form === "aero" ? 1.5 : 0.6);
      if (form === "segments")
        for (let i = 0; i < 16; i++) {
          ctx.beginPath();
          ctx.arc(
            50,
            50,
            48 - depth / 2,
            (i * Math.PI) / 8,
            (i * Math.PI) / 8 + 0.15,
          );
          ctx.strokeStyle = silver;
          ctx.lineWidth = Math.max(1, depth - 2);
          ctx.stroke();
        }
      break;
    }
    case "spokes":
      spokes(form, n("count", 24), 42);
      circle(50 + n("hubOffsetX", 0), 50 + n("hubOffsetY", 0), 3, colour);
      break;
    case "hubs": {
      ctx.translate(n("hubOffsetX", 0), n("hubOffsetY", 0));
      const size = n("size", 1);
      circle(
        50,
        50,
        (form === "high" ? 20 : form === "dynamo" ? 22 : 14) * size,
        colour,
        silver,
        2,
      );
      circle(50, 50, 9 * size, silver, dark, 1);
      circle(50, 50, 3, dark);
      if (form === "high" || form === "disc")
        for (let i = 0; i < 12; i++) {
          const a = (i * Math.PI) / 6;
          circle(50 + Math.cos(a) * 16, 50 + Math.sin(a) * 16, 1.5, dark);
        }
      if (form === "dynamo")
        for (let i = 0; i < 12; i++) {
          const a = (i * Math.PI) / 6;
          path(
            [
              [50 + Math.cos(a) * 12, 50 + Math.sin(a) * 12],
              [50 + Math.cos(a) * 20, 50 + Math.sin(a) * 20],
            ],
            silver,
            1.5,
          );
        }
      if (form === "disc") circle(50, 50, 24, undefined, colour, 3);
      break;
    }
    case "frame": {
      const slope = n("slope", 0),
        bb = [48, 80],
        rear = [8, 79],
        head = [82, 25],
        seat = [39, 23 + slope];
      path([rear, seat, bb, rear], colour, 4.5);
      path([bb, [77, 40], head], colour, 6);
      path([[43, 12], bb], colour, 5);
      if (form === "step")
        curve(() => {
          ctx.moveTo(39, 36);
          ctx.quadraticCurveTo(48, 67, 77, 40);
        }, 6);
      else if (form === "arched")
        curve(() => {
          ctx.moveTo(...(seat as [number, number]));
          ctx.quadraticCurveTo(59, 3, 82, 25);
        }, 6);
      else path([seat, head], colour, 5);
      if (form === "truss") path([seat, [65, 55]], colour, 3.5);
      if (form === "mixte") {
        path([rear, head], colour, 3);
        path(
          [
            [8, 83],
            [82, 29],
          ],
          colour,
          2,
        );
      }
      circle(48, 80, 6, colour, silver, 1);
      break;
    }
    case "fork": {
      path(
        [
          [49, 9],
          [49, 27],
        ],
        silver,
        7,
      );
      if (form === "suspension" || form === "dual") {
        path(
          [
            [34, 31],
            [34, 83],
          ],
          colour,
          10,
        );
        path(
          [
            [65, 31],
            [65, 83],
          ],
          colour,
          10,
        );
        path(
          [
            [34, 28],
            [34, 53],
          ],
          silver,
          5,
        );
        path(
          [
            [65, 28],
            [65, 53],
          ],
          silver,
          5,
        );
        path(
          [
            [30, 27],
            [69, 27],
          ],
          colour,
          7,
        );
        path(
          [
            [34, 59],
            [40, 50],
            [59, 50],
            [65, 59],
          ],
          colour,
          5,
        );
        if (form === "dual")
          path(
            [
              [30, 14],
              [69, 14],
            ],
            colour,
            6,
          );
      } else {
        for (const x of [37, 61])
          curve(
            () => {
              ctx.moveTo(x, 29);
              ctx.quadraticCurveTo(
                x + (form === "curved" ? -8 : 0),
                61,
                x + 9,
                86,
              );
            },
            form === "aero" ? 12 : 6,
          );
        path(
          [
            [37, 29],
            [49, 24],
            [61, 29],
          ],
          colour,
          8,
        );
      }
      break;
    }
    case "handlebars": {
      const draw = () => {
        if (form === "flat")
          path(
            [
              [8, 49],
              [92, 49],
            ],
            colour,
            5,
          );
        if (form === "riser")
          path(
            [
              [8, 38],
              [30, 38],
              [39, 51],
              [61, 51],
              [70, 38],
              [92, 38],
            ],
            colour,
            5,
          );
        if (form === "drop") {
          const y = p.compact ? 66 : 79;
          curve(() => {
            ctx.moveTo(13, 30);
            ctx.lineTo(66, 30);
            ctx.bezierCurveTo(96, 30, 99, y, 74, y);
            ctx.lineTo(58, y);
          }, 5);
          path(
            [
              [64, 29],
              [79, 38],
            ],
            dark,
            8,
          );
        }
        if (form === "bullhorn")
          curve(() => {
            ctx.moveTo(12, 65);
            ctx.lineTo(72, 65);
            ctx.quadraticCurveTo(90, 64, 90, 28);
          }, 5);
        if (form === "swept")
          curve(() => {
            ctx.moveTo(10, 70);
            ctx.quadraticCurveTo(50, 20, 90, 70);
          }, 5);
        if (form === "moustache")
          curve(() => {
            ctx.moveTo(9, 62);
            ctx.bezierCurveTo(4, 15, 33, 28, 50, 44);
            ctx.bezierCurveTo(67, 28, 96, 15, 91, 62);
          }, 5);
        if (form === "butterfly")
          curve(() => {
            ctx.moveTo(50, 58);
            ctx.bezierCurveTo(2, 93, 0, 18, 32, 29);
            ctx.quadraticCurveTo(50, 40, 68, 29);
            ctx.bezierCurveTo(100, 18, 98, 93, 50, 58);
          }, 5);
      };
      draw();
      circle(50, form === "flat" ? 49 : 51, 5, silver);
      break;
    }
    case "tape": {
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(9, 33, 82, 34, 10);
      ctx.clip();
      rect(8, 32, 84, 36);
      if (form === "spiral" || form === "diamond")
        for (let x = -20; x < 120; x += 10) {
          path(
            [
              [x, 30],
              [x + 20, 70],
            ],
            pale,
            1,
          );
          if (form === "diamond")
            path(
              [
                [x, 70],
                [x + 20, 30],
              ],
              pale,
              1,
            );
        }
      if (form === "ribbed")
        for (let x = 13; x < 91; x += 5)
          path(
            [
              [x, 35],
              [x, 65],
            ],
            dark,
            1.5,
          );
      if (form === "perforated")
        for (let x = 15; x < 90; x += 9)
          for (let y = 39; y < 65; y += 9) circle(x, y, 1.6, dark);
      if (form === "hex")
        for (let x = 8; x < 95; x += 10)
          for (let y = 34; y < 74; y += 9) {
            const points = Array.from({ length: 6 }, (_, i) => [
              x + Math.cos((i * Math.PI) / 3) * 4,
              y + Math.sin((i * Math.PI) / 3) * 4,
            ]);
            path(points, pale, 0.65, true);
          }
      if (form === "cork")
        for (let i = 0; i < 85; i++)
          circle(
            10 + ((i * 37) % 80),
            34 + ((i * 19) % 32),
            0.6 + (i % 3) * 0.35,
            i % 2 ? pale : dark,
          );
      ctx.restore();
      break;
    }
    case "hoods": {
      const head = form === "tall" ? 15 : form === "compact" ? 37 : 23;
      ctx.beginPath();
      ctx.moveTo(15, 64);
      ctx.lineTo(36, 56);
      if (form === "angular") {
        ctx.lineTo(48, 23);
        ctx.lineTo(67, 23);
        ctx.lineTo(77, 37);
      } else {
        ctx.quadraticCurveTo(42, head, 57, head);
        ctx.quadraticCurveTo(75, head, 76, 47);
      }
      ctx.lineTo(form === "flat" ? 90 : 80, 64);
      ctx.quadraticCurveTo(61, 76, 15, 72);
      ctx.closePath();
      ctx.fillStyle = colour;
      ctx.fill();
      curve(
        () => {
          ctx.moveTo(75, 58);
          ctx.quadraticCurveTo(85, 73, 65, 89);
        },
        3,
        silver,
      );
      path(
        [
          [23, 64],
          [50, 59],
        ],
        pale,
        1,
      );
      break;
    }
    case "brakes": {
      if (form === "disc") {
        ring(34, 28, silver);
        circle(50, 50, 10, undefined, silver, 4);
        for (let i = 0; i < 6; i++) {
          const a = (i * Math.PI) / 3;
          path(
            [
              [50 + Math.cos(a) * 11, 50 + Math.sin(a) * 11],
              [50 + Math.cos(a + 0.25) * 28, 50 + Math.sin(a + 0.25) * 28],
            ],
            silver,
            3,
          );
        }
        rect(70, 25, 15, 30, colour, 4);
        if (p.mechanical)
          path(
            [
              [77, 25],
              [88, 12],
              [89, 5],
            ],
            colour,
            3,
          );
      } else if (form === "vee" || form === "cantilever") {
        const top = form === "vee" ? 23 : 42;
        path(
          [
            [22, 80],
            [30, top],
          ],
          colour,
          6,
        );
        path(
          [
            [78, 80],
            [70, top],
          ],
          colour,
          6,
        );
        path(
          [
            [30, top],
            [50, 13],
            [70, top],
          ],
          silver,
          1.5,
        );
        path(
          [
            [50, 13],
            [50, 4],
          ],
          silver,
          2,
        );
        rect(29, 65, 9, 17, dark, 2);
        rect(62, 65, 9, 17, dark, 2);
      } else {
        curve(() => {
          ctx.moveTo(21, 79);
          ctx.bezierCurveTo(9, 27, 85, 27, 79, 79);
        }, 7);
        if (form === "dual")
          curve(
            () => {
              ctx.moveTo(28, 66);
              ctx.quadraticCurveTo(68, 25, 78, 42);
            },
            4,
            silver,
          );
        circle(50, 39, 5, silver);
        path(
          [
            [50, 37],
            [50, 9],
          ],
          silver,
          2,
        );
        rect(18, 72, 13, 15, dark, 2);
        rect(69, 72, 13, 15, dark, 2);
      }
      break;
    }
    case "saddles": {
      const wide = form === "touring" || form === "sprung",
        short = form === "short" || form === "split";
      const end = Math.min(95, (short ? 75 : 86) * n("length", 1));
      ctx.beginPath();
      ctx.moveTo(9, 42);
      ctx.bezierCurveTo(14, wide ? 18 : 27, 43, 33, 54, 41);
      ctx.quadraticCurveTo(72, 47, end, 43);
      ctx.quadraticCurveTo(end + 8, 54, end - 3, 56);
      ctx.lineTo(27, wide ? 66 : 59);
      ctx.quadraticCurveTo(5, 62, 9, 42);
      ctx.closePath();
      if (form === "cutout") {
        ctx.moveTo(26, 45);
        ctx.ellipse(45, 47, 20, 3.5, 0, 0, Math.PI * 2);
      }
      if (form === "split") {
        ctx.moveTo(61, 45);
        ctx.rect(61, 46, 20, 5);
      }
      ctx.fillStyle = colour;
      ctx.fill("evenodd");
      path(
        [
          [22, 62],
          [37, 76],
          [69, 63],
        ],
        silver,
        2,
      );
      if (form === "sprung")
        for (const x of [23, 43]) {
          for (let y = 64; y < 79; y += 4)
            path(
              [
                [x, y],
                [x + 9, y + 3],
              ],
              silver,
              2,
            );
        }
      break;
    }
    case "stems": {
      if (form === "quill") {
        path(
          [
            [27, 88],
            [27, 37],
            [75, 37],
          ],
          colour,
          11,
        );
        circle(75, 37, 9, colour, silver, 2);
      } else {
        const endY = form === "adjustable" ? 27 : 50 - n("rise", 0);
        if (form === "aero")
          path(
            [
              [20, 37],
              [80, 45],
              [80, 58],
              [20, 66],
            ],
            colour,
            0,
            true,
            colour,
          );
        else
          path(
            [
              [22, 57],
              [78, endY],
            ],
            colour,
            12,
          );
        circle(22, 57, 12, colour, silver, 2);
        circle(78, endY, 10, colour, silver, 2);
        if (form === "adjustable") circle(42, 46, 8, silver, dark, 2);
      }
      break;
    }
    case "seatposts": {
      const x = form === "setback" ? 65 : 50;
      path(
        [
          [50, 90],
          [50, 35],
          [x, 23],
        ],
        colour,
        form === "aero" ? 15 : 9,
      );
      if (form === "twin") {
        path(
          [
            [42, 78],
            [42, 25],
          ],
          silver,
          4,
        );
        path(
          [
            [58, 78],
            [58, 25],
          ],
          silver,
          4,
        );
      }
      if (form === "dropper" || form === "suspension") {
        path(
          [
            [50, 52],
            [50, 26],
          ],
          silver,
          5,
        );
        rect(42, 50, 16, 6, dark, 2);
      }
      if (form === "suspension")
        for (let y = 28; y < 49; y += 4)
          path(
            [
              [45, y],
              [55, y + 3],
            ],
            colour,
            2,
          );
      path(
        [
          [x - 13, 20],
          [x + 13, 20],
        ],
        silver,
        5,
      );
      circle(x, 24, 4, dark);
      break;
    }
    case "pedals": {
      path(
        [
          [3, 54],
          [24, 54],
        ],
        silver,
        5,
      );
      if (form === "road")
        path(
          [
            [29, 26],
            [89, 48],
            [75, 76],
            [26, 69],
          ],
          colour,
          4,
          true,
          colour,
        );
      else if (form === "clipless") {
        ctx.beginPath();
        ctx.ellipse(55, 52, 27, 17, 0, 0, Math.PI * 2);
        ctx.fillStyle = colour;
        ctx.fill();
        rect(44, 39, 23, 26, silver, 4);
        rect(50, 44, 11, 16, dark, 1);
      } else {
        const top = p.wide ? 30 : 38,
          height = p.wide ? 45 : 30;
        ctx.beginPath();
        ctx.roundRect(23, top, 68, height, 4);
        ctx.strokeStyle = colour;
        ctx.lineWidth = 5;
        ctx.stroke();
        path(
          [
            [26, top + 3],
            [87, top + height - 3],
          ],
          colour,
          3,
        );
        path(
          [
            [26, top + height - 3],
            [87, top + 3],
          ],
          colour,
          3,
        );
        if (form === "platform") {
          rect(26, 40, 62, 26);
          rect(31, 43, 22, 19, dark, 2);
          rect(61, 43, 22, 19, dark, 2);
        }
        if (form === "flat")
          for (let x = 29; x < 90; x += p.wide ? 8 : 12) {
            circle(x, top, 1.6, silver);
            circle(x, top + height, 1.6, silver);
          }
        if (form === "toeclip")
          curve(
            () => {
              ctx.moveTo(28, 42);
              ctx.bezierCurveTo(24, 5, 77, 3, 81, 40);
            },
            3,
            silver,
          );
      }
      break;
    }
    case "bottles": {
      if (form === "wire" || form === "wrap") {
        curve(
          () => {
            ctx.moveTo(33, 15);
            ctx.lineTo(26, 76);
            ctx.quadraticCurveTo(50, 95, 74, 76);
            ctx.lineTo(67, 15);
          },
          form === "wire" ? 3 : 8,
        );
        path(
          [
            [33, 40],
            [50, 55],
            [67, 40],
          ],
          colour,
          form === "wire" ? 3 : 7,
        );
        path(
          [
            [43, 84],
            [44, 18],
            [56, 18],
            [57, 84],
          ],
          colour,
          3,
        );
      } else {
        const top = form === "tool" ? 37 : 20;
        ctx.beginPath();
        ctx.moveTo(39, top);
        ctx.lineTo(61, top);
        ctx.lineTo(form === "aero" ? 69 : 72, top + 12);
        ctx.lineTo(69, 84);
        ctx.quadraticCurveTo(50, 91, 31, 84);
        ctx.lineTo(form === "aero" ? 36 : 28, top + 12);
        ctx.closePath();
        ctx.fillStyle = colour;
        ctx.fill();
        rect(38, top - 7, 24, 8, dark, 2);
        if (form !== "tool") rect(46, top - 12, 8, 5, silver, 1);
        path(
          [
            [32, 51],
            [68, 51],
          ],
          pale,
          p.insulated ? 8 : 3,
        );
        path(
          [
            [34, 66],
            [66, 66],
          ],
          pale,
          2,
        );
      }
      break;
    }
    case "mudguards": {
      if (form === "tail") {
        path(
          [
            [14, 29],
            [32, 35],
            [89, 66],
            [83, 75],
            [26, 44],
          ],
          colour,
          2,
          true,
          colour,
        );
        circle(22, 36, 3, silver);
      } else {
        const start = form === "short" ? Math.PI * 1.15 : Math.PI,
          end = form === "short" ? Math.PI * 1.85 : Math.PI * 2;
        ctx.beginPath();
        ctx.arc(50, 65, 41, start, form === "split" ? Math.PI * 1.4 : end);
        ctx.strokeStyle = colour;
        ctx.lineWidth = n("width", 4);
        ctx.stroke();
        if (form === "split") {
          ctx.beginPath();
          ctx.arc(50, 65, 41, Math.PI * 1.6, end);
          ctx.stroke();
        }
        if (form === "full") {
          path(
            [
              [12, 50],
              [50, 84],
            ],
            silver,
            1.5,
          );
          path(
            [
              [88, 50],
              [50, 84],
            ],
            silver,
            1.5,
          );
        }
      }
      break;
    }
    case "racks": {
      if (form === "low") {
        path(
          [
            [24, 15],
            [24, 83],
            [81, 83],
            [81, 43],
            [24, 43],
          ],
          colour,
          3,
        );
        path(
          [
            [24, 15],
            [69, 15],
            [69, 43],
          ],
          colour,
          3,
        );
      } else if (form === "seatpost") {
        path(
          [
            [9, 73],
            [19, 34],
            [89, 34],
          ],
          colour,
          5,
        );
        path(
          [
            [21, 57],
            [75, 34],
          ],
          colour,
          3,
        );
      } else {
        path(
          [
            [11, 31],
            [88, 31],
            [88, 40],
            [11, 40],
          ],
          colour,
          3,
          true,
        );
        path(
          [
            [18, 40],
            [38, 86],
            [78, 40],
          ],
          colour,
          3,
        );
        path(
          [
            [78, 40],
            [78, 83],
          ],
          colour,
          3,
        );
        if (form === "front")
          path(
            [
              [18, 40],
              [18, 83],
            ],
            colour,
            3,
          );
        if (form === "platform")
          for (let x = 21; x < 88; x += 11)
            path(
              [
                [x, 24],
                [x, 47],
              ],
              colour,
              3,
            );
      }
      break;
    }
    case "bags": {
      if (form === "frame") {
        path(
          [
            [10, 22],
            [91, 31],
            [41, 84],
          ],
          dark,
          2,
          true,
          colour,
        );
        path(
          [
            [24, 33],
            [73, 39],
          ],
          pale,
          1.5,
        );
      } else if (form === "top") {
        path(
          [
            [10, 43],
            [72, 30],
            [91, 66],
            [10, 66],
          ],
          dark,
          2,
          true,
          colour,
        );
        path(
          [
            [18, 45],
            [70, 35],
          ],
          pale,
          1.5,
        );
      } else if (form === "pannier") {
        rect(22, 19, 58, 67, colour, 6);
        rect(17, 16, 68, 26, dark, 5);
        for (const x of [31, 64]) {
          rect(x, 31, 6, 25, silver, 1);
          rect(x - 2, 43, 10, 8, dark, 2);
        }
      } else if (form === "basket") {
        path(
          [
            [13, 27],
            [87, 27],
            [77, 80],
            [23, 80],
          ],
          colour,
          4,
          true,
        );
        for (let y = 38; y < 80; y += 10)
          path(
            [
              [15 + (y - 27) / 5, y],
              [85 - (y - 27) / 5, y],
            ],
            colour,
            1,
          );
        for (let x = 23; x < 85; x += 10)
          path(
            [
              [x, 29],
              [50 + (x - 50) * 0.72, 78],
            ],
            colour,
            1,
          );
      } else if (form === "saddle") {
        path(
          [
            [11, 34],
            [84, 34],
            [69, 73],
            [34, 65],
          ],
          dark,
          2,
          true,
          colour,
        );
        path(
          [
            [25, 25],
            [32, 50],
          ],
          dark,
          6,
        );
        path(
          [
            [65, 25],
            [69, 49],
          ],
          dark,
          6,
        );
      } else {
        rect(9, 30, 82, 41, colour, 17);
        for (const x of [29, 67]) rect(x, 29, 6, 43, dark, 2);
        if (form === "barrel") {
          ctx.beginPath();
          ctx.ellipse(20, 50, 8, 16, 0, 0, Math.PI * 2);
          ctx.strokeStyle = pale;
          ctx.lineWidth = 1;
          ctx.stroke();
        } else {
          circle(17, 50, 9, undefined, pale, 1);
          circle(17, 50, 4, undefined, pale, 1);
        }
      }
      break;
    }
    case "lights": {
      if (form === "rear" || form === "strip") {
        rect(
          form === "strip" ? 40 : 17,
          25,
          form === "strip" ? 20 : 67,
          48,
          dark,
          10,
        );
        rect(
          form === "strip" ? 44 : 22,
          29,
          form === "strip" ? 12 : 57,
          36,
          "#d34f46",
          10,
        );
        path(
          [
            [49, 73],
            [49, 86],
          ],
          dark,
          5,
        );
      } else {
        rect(27, 65, 33, 9, dark, 2);
        if (form === "bullet" || form === "dynamo") {
          ctx.beginPath();
          ctx.ellipse(47, 47, 34, 22, 0, 0, Math.PI * 2);
          ctx.fillStyle = colour;
          ctx.fill();
          ctx.beginPath();
          ctx.ellipse(73, 47, 9, 19, 0, 0, Math.PI * 2);
          ctx.fillStyle = "#e9d896";
          ctx.fill();
        } else {
          rect(14, 30, 72, 35, colour, 7);
          if (form === "twin") {
            circle(39, 47, 13, "#e9d896", silver, 2);
            circle(68, 47, 13, "#e9d896", silver, 2);
          } else rect(70, 35, 11, 25, "#e9d896", 3);
        }
        if (form === "dynamo")
          curve(
            () => {
              ctx.moveTo(47, 68);
              ctx.quadraticCurveTo(47, 86, 30, 87);
            },
            4,
            silver,
          );
      }
      break;
    }
    case "decals": {
      if (form === "stripe" || form === "double") {
        path(
          [
            [8, 42],
            [92, 42],
            [78, 51],
            [8, 51],
          ],
          colour,
          0,
          true,
          colour,
        );
        if (form === "double")
          path(
            [
              [8, 57],
              [79, 57],
              [65, 66],
              [8, 66],
            ],
            colour,
            0,
            true,
            colour,
          );
      }
      if (form === "bands")
        for (const x of [17, 40, 63])
          path(
            [
              [x, 27],
              [x + 14, 27],
              [x + 27, 73],
              [x + 13, 73],
            ],
            colour,
            0,
            true,
            colour,
          );
      if (form === "chevron")
        for (const x of [13, 38, 63])
          path(
            [
              [x, 29],
              [x + 18, 50],
              [x, 71],
            ],
            colour,
            8,
          );
      if (form === "badge") {
        path(
          [
            [24, 21],
            [76, 21],
            [72, 64],
            [50, 82],
            [28, 64],
          ],
          colour,
          4,
          true,
        );
        const points = Array.from({ length: 10 }, (_, i) => {
          const a = -Math.PI / 2 + (i * Math.PI) / 5,
            r = i % 2 ? 7 : 16;
          return [50 + Math.cos(a) * r, 46 + Math.sin(a) * r];
        });
        path(points, colour, 0, true, colour);
      }
      if (form === "number") {
        ctx.beginPath();
        ctx.roundRect(10, 18, 80, 64, 9);
        ctx.strokeStyle = colour;
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.font = "bold 48px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = colour;
        ctx.fillText("27", 50, 52);
      }
      if (form === "checker")
        for (let x = 0; x < 6; x++)
          for (let y = 0; y < 4; y++)
            if ((x + y) % 2 === 0) rect(14 + x * 12, 26 + y * 12, 12, 12);
      if (form === "dots")
        for (let i = 0; i < 6; i++)
          circle(14 + i * 15, 50, 9 - i * 1.1, colour);
      break;
    }
    default:
      break; // Unsupported imported renderer IDs must be rejected during pack validation.
  }
  ctx.restore();
}
