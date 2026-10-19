import type { CatalogueEntry } from "./types";

type Paint = string | CanvasGradient;

const TAU = Math.PI * 2;
const limit = (value: number, low: number, high: number) =>
  Math.max(low, Math.min(high, value));

function number(entry: CatalogueEntry, key: string, fallback: number): number {
  const value = entry.parameters[key];
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

/** Mix a colour without depending on CSS or a second canvas. */
function tint(colour: string, target: string, amount: number): string {
  const parse = (value: string): number[] => {
    const short = /^#([\da-f])([\da-f])([\da-f])$/i.exec(value);
    const full = /^#([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(value);
    if (short) return short.slice(1).map((channel) => parseInt(channel + channel, 16));
    if (full) return full.slice(1).map((channel) => parseInt(channel, 16));
    return [75, 82, 79];
  };
  const base = parse(colour);
  const other = parse(target);
  return `rgb(${base.map((channel, index) => Math.round(channel + (other[index] - channel) * amount)).join(",")})`;
}

function circle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  paint: Paint,
): void {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, TAU);
  ctx.fillStyle = paint;
  ctx.fill();
}

function ring(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  inner: number,
  paint: Paint,
): void {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, TAU);
  ctx.arc(x, y, inner, 0, TAU, true);
  ctx.fillStyle = paint;
  ctx.fill("evenodd");
}

function stroke(
  ctx: CanvasRenderingContext2D,
  paint: Paint,
  width: number,
  draw: () => void,
): void {
  ctx.beginPath();
  draw();
  ctx.strokeStyle = paint;
  ctx.lineWidth = width;
  ctx.stroke();
}

/**
 * Original generic saddle illustration. Local coordinates retain the existing
 * catalogue silhouette and the rail/clamp reference around (50, 71). No ground
 * shadow or backing rectangle is painted; cut-outs remain genuinely transparent.
 */
export function renderDetailedSaddle(
  ctx: CanvasRenderingContext2D,
  entry: CatalogueEntry,
  colour: string,
): void {
  const form = String(entry.parameters.form ?? "race");
  const wide = form === "touring" || form === "sprung";
  const short = form === "short" || form === "split";
  const end = limit((short ? 75 : 86) * number(entry, "length", 1), 60, 95);
  const bottom = wide ? 64 : 58;
  const rearTop = wide ? 24 : 30;
  const surface = new Path2D();
  surface.moveTo(9, 42);
  surface.bezierCurveTo(11, rearTop, 36, rearTop - 1.5, 53, 40);
  surface.bezierCurveTo(64, 44.8, end - 10, 43.9, end - 3, 43.4);
  if (form === "split") {
    surface.bezierCurveTo(end + 0.5, 43.5, end + 1.5, 45.1, end + 1.5, 46.3);
    surface.bezierCurveTo(end - 12, 46, 57, 45.6, 49, 45.3);
    surface.bezierCurveTo(55, 47.8, end - 12, 48.7, end + 1.5, 49.4);
    surface.bezierCurveTo(end + 1.2, 51.4, end + 0.6, 52.4, end - 0.3, 53.2);
  } else {
    surface.bezierCurveTo(end + 2.2, 43.5, end + 2.4, 50.1, end - 0.3, 53.2);
  }
  surface.bezierCurveTo(end - 4, 57.1, 64, 55.7, 51, 57.1);
  surface.bezierCurveTo(39, bottom + 0.8, 21, bottom + 2, 13, bottom - 3.6);
  surface.bezierCurveTo(8.4, bottom - 8.5, 7.7, 48.9, 9, 42);
  surface.closePath();

  if (form === "cutout") {
    surface.moveTo(27.1, 42.9);
    surface.bezierCurveTo(34, 39.5, 50, 41.9, 63, 46.6);
    surface.bezierCurveTo(50, 48.5, 34.5, 47.1, 27.1, 44.6);
    surface.closePath();
  }
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // Both rails share a short straight clamp section. The far rail is visible
  // above the near one, rather than forming the old, implausible V-shaped wire.
  const rail = (offset: number) => {
    ctx.moveTo(22, bottom - 1 + offset);
    ctx.bezierCurveTo(27, 61 + offset, 29, 70.5 + offset, 40, 70.5 + offset);
    ctx.lineTo(55, 70.5 + offset);
    ctx.bezierCurveTo(66, 70.5 + offset, 66, 59 + offset, end - 14, 54 + offset);
  };
  stroke(ctx, "#444a49", 1.45, () => rail(-3.3));
  stroke(ctx, "#a4aaa6", 0.48, () => rail(-3.6));
  stroke(ctx, "#343b39", 1.7, () => rail(0.5));
  const railMetal = ctx.createLinearGradient(20, 61, 60, 74);
  railMetal.addColorStop(0, "#9ca29d");
  railMetal.addColorStop(0.35, "#d6d7ca");
  railMetal.addColorStop(0.6, "#666e69");
  railMetal.addColorStop(1, "#b4bab1");
  stroke(ctx, railMetal, 0.96, () => rail(0.16));

  if (form === "sprung") {
    for (const x of [24, 39]) {
      ctx.beginPath();
      ctx.ellipse(x, 76.5, 4.8, 1.6, 0, 0, TAU);
      ctx.fillStyle = "#3f4642";
      ctx.fill();
      for (let i = 0; i < 5; i++) {
        const y = 62 + i * 2.9;
        stroke(ctx, "#3c4440", 1.15, () => {
          ctx.ellipse(x, y, 4.5, 1.8, 0, 0, TAU);
        });
        stroke(ctx, "#aeb5aa", 0.65, () => {
          ctx.ellipse(x, y - 0.25, 4.3, 1.5, 0, Math.PI * 1.05, TAU);
        });
      }
    }
  }

  // The shell's lower edge is material, not a cast shadow over the photograph.
  const upholstery = ctx.createLinearGradient(40, rearTop, 52, bottom + 2);
  upholstery.addColorStop(0, tint(colour, "#ffffff", 0.24));
  upholstery.addColorStop(0.3, tint(colour, "#ffffff", 0.09));
  upholstery.addColorStop(0.58, colour);
  upholstery.addColorStop(0.84, tint(colour, "#101612", 0.4));
  upholstery.addColorStop(1, tint(colour, "#080d09", 0.63));
  ctx.fillStyle = upholstery;
  ctx.fill(surface, "evenodd");

  ctx.save();
  ctx.clip(surface, "evenodd");
  const crown = ctx.createRadialGradient(30, rearTop + 10, 2, 35, rearTop + 9, 34);
  crown.addColorStop(0, "rgba(255,249,226,0.13)");
  crown.addColorStop(0.55, "rgba(255,249,226,0.025)");
  crown.addColorStop(1, "rgba(255,249,226,0)");
  ctx.fillStyle = crown;
  ctx.fillRect(8, rearTop - 3, end, bottom - rearTop + 9);

  // Fine, low-contrast deterministic grain; no salt-and-pepper speckles.
  for (let i = 0; i < 560; i++) {
    const x = 9 + ((i * 73) % 857) / 10;
    const y = rearTop + ((i * 41) % 371) / 10;
    ctx.fillStyle = i % 3 ? "rgba(0,0,0,0.047)" : "rgba(255,249,225,0.064)";
    ctx.fillRect(x, y, 0.13, 0.08);
  }

  stroke(ctx, tint(colour, "#0c110f", 0.55), 0.65, () => {
    ctx.moveTo(11.8, bottom - 6);
    ctx.bezierCurveTo(33, bottom + 0.8, 50, 53.1, end - 1, 52.1);
  });
  stroke(ctx, "rgba(255,245,222,0.18)", 0.4, () => {
    ctx.moveTo(12.7, bottom - 7.2);
    ctx.bezierCurveTo(33, bottom - 0.3, 50, 52.2, end - 1, 51.3);
  });
  stroke(ctx, "rgba(255,249,228,0.22)", 0.45, () => {
    ctx.moveTo(12.3, 40.7);
    ctx.bezierCurveTo(19, rearTop + 0.5, 38, rearTop + 3, 53, 42.1);
    ctx.bezierCurveTo(64, 46.5, end - 12, 45.1, end - 2.6, 45.3);
  });
  if (form === "cutout") {
    stroke(ctx, tint(colour, "#101612", 0.58), 0.8, () => {
      ctx.moveTo(27.1, 42.9);
      ctx.bezierCurveTo(34, 39.5, 50, 41.9, 63, 46.6);
    });
    stroke(ctx, "rgba(255,248,220,0.22)", 0.4, () => {
      ctx.moveTo(27.2, 45.1);
      ctx.bezierCurveTo(39, 48.2, 50, 48.8, 61, 47.4);
    });
  }
  ctx.restore();

  // Small underside attachment plates sit within the existing shell footprint.
  stroke(ctx, "#373d37", 1.4, () => {
    ctx.moveTo(20, bottom - 1);
    ctx.lineTo(25, bottom);
    ctx.moveTo(end - 17, 55.5);
    ctx.lineTo(end - 11.5, 55);
  });
  ctx.restore();
}

/**
 * Original generic drive-side crank. The ring and spider retain spindle (43,43)
 * and outer radius 35. crankAngle controls only the crank arm, measured clockwise
 * from local +X; the default 48° places its pedal eye at approximately (82,86).
 * crankLength adjusts the reach in local units (20–80; default about 58).
 * At arbitrary angles the arm can extend outside the reference 100×100 box.
 */
export function renderDetailedCrank(
  ctx: CanvasRenderingContext2D,
  entry: CatalogueEntry,
  colour: string,
): void {
  const form = String(entry.parameters.form ?? "five-arm");
  const center = 43;
  const broad = form === "four-arm" || form === "direct";
  const arms = form === "six-arm" ? 6 : form === "four-arm" ? 4 : form === "three-arm" ? 3 : 5;
  const metal = ctx.createLinearGradient(14, 9, 69, 77);
  metal.addColorStop(0, tint(colour, "#f5f3e8", 0.79));
  metal.addColorStop(0.19, tint(colour, "#a4aaa3", 0.5));
  metal.addColorStop(0.37, tint(colour, "#eff0e4", 0.7));
  metal.addColorStop(0.57, tint(colour, "#363e38", 0.25));
  metal.addColorStop(0.77, tint(colour, "#bcc2b8", 0.62));
  metal.addColorStop(1, tint(colour, "#1f2821", 0.5));

  const gear = (radius: number, inner: number, teeth: number, paint: Paint, offset = 0) => {
    const path = new Path2D();
    const toothDepth = radius > 28 ? 1.55 : 1.1;
    for (let i = 0; i < teeth; i++) {
      // Narrow rounded-looking tooth crowns retain translucent antialiased edges.
      for (const [fraction, height] of [[0, -toothDepth], [0.24, -toothDepth], [0.36, 0], [0.63, 0], [0.77, -toothDepth], [1, -toothDepth]]) {
        const angle = ((i + fraction) / teeth) * TAU;
        const x = center + Math.cos(angle) * (radius + height);
        const y = center + offset + Math.sin(angle) * (radius + height);
        if (i === 0 && fraction === 0) path.moveTo(x, y);
        else path.lineTo(x, y);
      }
    }
    path.closePath();
    path.moveTo(center + inner, center + offset);
    path.arc(center, center + offset, inner, 0, TAU, true);
    ctx.fillStyle = paint;
    ctx.fill(path, "evenodd");
  };
  const outline = (radius: number, paint: Paint, width: number, start = 0, end = TAU) => {
    stroke(ctx, paint, width, () => ctx.arc(center, center, radius, start, end));
  };
  const bolt = (x: number, y: number, radius: number) => {
    circle(ctx, x, y + 0.3, radius + 0.45, "#454d46");
    circle(ctx, x, y, radius, "#aeb4a8");
    stroke(ctx, "#e0dfcf", 0.3, () => ctx.arc(x, y, radius - 0.28, Math.PI, TAU));
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = i * TAU / 6;
      const px = x + Math.cos(angle) * radius * 0.48;
      const py = y + Math.sin(angle) * radius * 0.48;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = "#313a33";
    ctx.fill();
  };

  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  if (form === "triple") {
    gear(18, 13.8, 24, "#60695f", 1.5);
    outline(15.7, "#b1b5a6", 0.45);
  }
  if (form === "triple" || form === "five-arm" || form === "four-arm") {
    gear(25.2, 21.5, 34, "#535e54", 1.1);
    gear(25, 21.8, 34, metal, 0.35);
    outline(23, "#d8d8c8", 0.35);
  }

  const ringInner = form === "disc" ? 5 : form === "direct" ? 25 : 30.6;
  gear(35, ringInner, 48, "#4d584d", 0.75);
  gear(35, ringInner, 48, metal);
  outline(32.2, "rgba(235,233,211,0.64)", 0.42);
  outline(30.9, "rgba(30,40,30,0.47)", 0.42);
  outline(33.4, "rgba(246,243,220,0.45)", 0.3, Math.PI * 1.05, Math.PI * 1.87);

  if (form === "disc") {
    // Subtle concentric turning marks distinguish a solid urban guard.
    for (let radius = 8; radius < 31; radius += 2.2) outline(radius, "rgba(35,45,33,0.12)", 0.16);
    ring(ctx, center, center, 31.2, 30.5, "#c1c6b6");
  } else {
    for (let i = 0; i < arms; i++) {
      const angle = i * TAU / arms - Math.PI / 2 + (form === "four-arm" ? (i % 2 ? 0.16 : -0.16) : 0);
      const bend = form === "three-arm" ? 0.26 : 0;
      const width = broad ? 4.1 : form === "three-arm" ? 3.4 : 2.5;
      const radius = form === "direct" ? 27 : 31;
      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(angle);
      const arm = new Path2D();
      arm.moveTo(4, -width * 0.9);
      arm.bezierCurveTo(12, -width * 0.8 - bend * 12, 23, -width - bend * 12, radius, -width * 0.62);
      arm.lineTo(radius + 0.6, width * 0.62);
      arm.bezierCurveTo(22, width + bend * 5, 12, width, 4, width);
      arm.closePath();
      ctx.fillStyle = metal;
      ctx.fill(arm);
      stroke(ctx, "rgba(238,238,213,0.5)", 0.42, () => {
        ctx.moveTo(7, -width * 0.66);
        ctx.quadraticCurveTo(18, -width - bend * 7, radius - 1, -width * 0.3);
      });
      ctx.restore();
      if (form !== "direct") bolt(center + Math.cos(angle) * 28.3, center + Math.sin(angle) * 28.3, 1.55);
    }
    if (form === "triple") {
      ring(ctx, center, center, 38, 36.5, "#687467");
      outline(37.5, "#bac0b0", 0.4);
    }
  }

  // The forged arm moves independently from the fixed chainring/spider pattern.
  const crankAngle = number(entry, "crankAngle", 48) * Math.PI / 180;
  const length = limit(number(entry, "crankLength", Math.hypot(82 - center, 86 - center)), 20, 80);
  const reach = (value: number) => value * length / Math.hypot(39, 43);
  ctx.save();
  ctx.translate(center, center);
  ctx.rotate(crankAngle);
  const armWidth = broad ? 5.2 : 3.9;
  const arm = new Path2D();
  arm.moveTo(-5.4, -4.5);
  arm.bezierCurveTo(0.4, -6.1, reach(7), -armWidth, reach(14), -armWidth + 0.8);
  arm.bezierCurveTo(reach(29), -armWidth + 1.4, reach(43), -3.2, length - 2.2, -4.05);
  arm.bezierCurveTo(length + 4.2, -4.5, length + 5.9, -1.1, length + 4.3, 3.3);
  arm.bezierCurveTo(length + 3, 6, length - 1.8, 6.4, length - 5.2, 4.5);
  arm.bezierCurveTo(reach(32), 3.5, reach(16), 4.2, 3.7, 5.7);
  arm.bezierCurveTo(-2.8, 6.9, -6.7, 2.2, -5.4, -4.5);
  arm.closePath();
  const armMetal = ctx.createLinearGradient(12, -6, 12, 7);
  armMetal.addColorStop(0, tint(colour, "#f5f3e4", 0.86));
  armMetal.addColorStop(0.17, tint(colour, "#ccd1c2", 0.67));
  armMetal.addColorStop(0.4, tint(colour, "#eff0dd", 0.76));
  armMetal.addColorStop(0.65, tint(colour, "#899486", 0.4));
  armMetal.addColorStop(0.88, tint(colour, "#465343", 0.4));
  armMetal.addColorStop(1, "#5a6657");
  ctx.fillStyle = armMetal;
  ctx.fill(arm);
  ctx.save();
  ctx.clip(arm);
  stroke(ctx, "rgba(244,243,217,0.8)", 0.5, () => {
    ctx.moveTo(reach(8), -2.6);
    ctx.quadraticCurveTo(reach(28), -1.7, length - 5, -2.2);
  });
  stroke(ctx, "rgba(49,62,45,0.28)", broad ? 1.5 : 0.8, () => {
    ctx.moveTo(reach(13), 1.2);
    ctx.quadraticCurveTo(reach(32), 1.6, length - 8, 1.9);
  });
  if (broad) {
    stroke(ctx, "rgba(242,241,217,0.41)", 0.3, () => {
      ctx.moveTo(reach(14), 0.3);
      ctx.lineTo(length - 9, 0.8);
    });
  }
  ctx.restore();
  circle(ctx, length, 0.55, 3, "#4b5548");
  ring(ctx, length, 0.55, 3.75, 2.7, "#c5c9b8");
  circle(ctx, length, 0.55, 2.15, "#2c352a");
  stroke(ctx, "#737e6d", 0.33, () => ctx.arc(length, 0.55, 1.65, 0.2, Math.PI * 1.2));
  ctx.restore();

  circle(ctx, center, center, 5.5, "#5c685a");
  circle(ctx, center, center - 0.2, 4.85, metal);
  bolt(center, center, 3.45);
  ctx.restore();
}
