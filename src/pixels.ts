import type { Wheel } from "./types";

export const clamp = (n: number, a = 0, b = 255) => Math.min(b, Math.max(a, n));
export function colourDistance(a: ArrayLike<number>, b: ArrayLike<number>) {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) / Math.sqrt(3);
}

// Colour selection is deliberately conventional. Unconnected matching regions
// include frame holes; the user can recover light details with a Keep brush.
export function backgroundMask(
  data: Uint8ClampedArray,
  w: number,
  h: number,
  tolerance: number,
  seeds?: number[][],
  connected = false,
  seedPoint?: { x: number; y: number },
) {
  let samples = seeds?.length ? [...seeds] : [];
  if (!samples.length) {
    for (let t = 0; t <= 8; t++) {
      const x = Math.round((t * (w - 1)) / 8),
        y = Math.round((t * (h - 1)) / 8);
      for (const i of [x, (h - 1) * w + x, y * w, y * w + w - 1])
        samples.push(Array.from(data.slice(i * 4, i * 4 + 3)));
    }
    // A varied border is not a background model. Refuse broad automatic
    // deletion unless one colour cluster represents most of the perimeter.
    let dominant: number[][] = [];
    for (const sample of samples) {
      const cluster = samples.filter(
        (c) => colourDistance(c, sample) < Math.max(8, tolerance),
      );
      if (cluster.length > dominant.length) dominant = cluster;
    }
    if (dominant.length < samples.length * 0.7)
      return Uint8ClampedArray.from(
        { length: w * h },
        (_, i) => data[i * 4 + 3],
      );
    samples = [
      [0, 1, 2].map(
        (channel) =>
          dominant.map((c) => c[channel]).sort((a, b) => a - b)[
            Math.floor(dominant.length / 2)
          ],
      ),
    ];
  }
  const candidate = new Uint8Array(w * h),
    out = new Uint8ClampedArray(w * h);
  for (let i = 0; i < w * h; i++) {
    const r = data[i * 4],
      g = data[i * 4 + 1],
      b = data[i * 4 + 2];
    let d = 255;
    for (const c of samples)
      d = Math.min(d, Math.hypot(r - c[0], g - c[1], b - c[2]) / 1.7320508);
    candidate[i] = d < tolerance ? 1 : 0;
    out[i] = data[i * 4 + 3];
  }
  if (!connected) {
    for (let i = 0; i < out.length; i++) if (candidate[i]) out[i] = 0;
    return out;
  }
  const queue = new Int32Array(w * h);
  let head = 0,
    tail = 0;
  const push = (i: number) => {
    if (candidate[i] === 1) {
      candidate[i] = 2;
      queue[tail++] = i;
    }
  };
  if (seedPoint)
    push(
      clamp(Math.round(seedPoint.y), 0, h - 1) * w +
        clamp(Math.round(seedPoint.x), 0, w - 1),
    );
  else {
    for (let x = 0; x < w; x++) {
      push(x);
      push((h - 1) * w + x);
    }
    for (let y = 0; y < h; y++) {
      push(y * w);
      push(y * w + w - 1);
    }
  }
  while (head < tail) {
    const i = queue[head++];
    out[i] = 0;
    const x = i % w;
    if (x > 0) push(i - 1);
    if (x < w - 1) push(i + 1);
    if (i >= w) push(i - w);
    if (i < w * (h - 1)) push(i + w);
  }
  return out;
}
export function refineMask(
  alpha: Uint8ClampedArray,
  w: number,
  h: number,
  mode: "soften" | "expand" | "contract",
) {
  const out = new Uint8ClampedArray(alpha);
  for (let y = 1; y < h - 1; y++)
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x,
        values = [
          alpha[i],
          alpha[i - 1],
          alpha[i + 1],
          alpha[i - w],
          alpha[i + w],
        ];
      out[i] =
        mode === "expand"
          ? Math.max(...values)
          : mode === "contract"
            ? Math.min(...values)
            : Math.round(values.reduce((a, b) => a + b) / 5);
    }
  return out;
}
export function annulusAlpha(
  w: number,
  h: number,
  wheel: Wheel,
  outer = 1,
  inner = wheel.innerRatio,
) {
  const a = new Uint8ClampedArray(w * h), angle=(wheel.rotation||0)*Math.PI/180,
    co=Math.cos(angle), si=Math.sin(angle),
    boundX=Math.hypot(wheel.rx*co,wheel.ry*si)*outer,
    boundY=Math.hypot(wheel.rx*si,wheel.ry*co)*outer;
  for (
    let y = Math.max(0, Math.floor(wheel.cy - boundY - 1));
    y < Math.min(h, wheel.cy + boundY + 2);
    y++
  )
    for (
      let x = Math.max(0, Math.floor(wheel.cx - boundX - 1));
      x < Math.min(w, wheel.cx + boundX + 2);
      x++
    ) {
      const r = Math.hypot(
        ((x-wheel.cx)*co+(y-wheel.cy)*si) / wheel.rx,
        (-(x-wheel.cx)*si+(y-wheel.cy)*co) / wheel.ry,
      );
      const feather = 1 / Math.max(wheel.rx, wheel.ry);
      a[y * w + x] = Math.round(
        255 *
          Math.min(
            clamp((outer - r) / feather + 0.5, 0, 1),
            clamp((r - inner) / feather + 0.5, 0, 1),
          ),
      );
    }
  return a;
}
export function effectiveMask(
  mask: Uint8ClampedArray,
  cutout: Uint8ClampedArray,
  protection?: Uint8ClampedArray,
) {
  return mask.map((v, i) =>
    Math.round(((v * cutout[i]) / 255) * (1 - (protection?.[i] || 0) / 255)),
  );
}
export function recolourPixels(
  source: Uint8ClampedArray,
  mask: Uint8ClampedArray,
  hex: string,
  finish = "satin",
) {
  const out = new Uint8ClampedArray(source),
    c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  for (let i = 0; i < mask.length; i++)
    if (mask[i]) {
      const k = i * 4,
        light =
          (source[k] * 0.2126 +
            source[k + 1] * 0.7152 +
            source[k + 2] * 0.0722) /
          255;
      const shade =
        finish === "matte" ? 0.55 + light * 0.45 : 0.25 + light * 0.85;
      const highlight =
        finish === "gloss"
          ? Math.max(0, light - 0.75) * 160
          : finish === "metallic"
            ? Math.max(0, light - 0.6) * 95 + (((i * 13) % 11) - 5) * 1.2
            : 0;
      for (let j = 0; j < 3; j++)
        out[k + j] = Math.round(
          source[k + j] * (1 - mask[i] / 255) +
            (clamp(c[j] * shade + highlight) * mask[i]) / 255,
        );
    }
  return out;
}

// Radial edge voting, no trained model. Scores are only used internally to
// reject weak suggestions; they are not recognition-confidence percentages.
export function suggestWheels(
  data: Uint8ClampedArray,
  w: number,
  h: number,
): Wheel[] {
  const gray = new Float32Array(w * h),
    edge = new Float32Array(w * h);
  for (let i = 0; i < gray.length; i++)
    gray[i] = (data[i * 4] + data[i * 4 + 1] + data[i * 4 + 2]) / 3;
  for (let y = 1; y < h - 1; y++)
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      edge[i] = Math.hypot(
        gray[i + 1] - gray[i - 1],
        gray[i + w] - gray[i - w],
      );
    }
  const angles = Array.from({ length: 48 }, (_, i) => [
    Math.cos((i * Math.PI) / 24),
    Math.sin((i * Math.PI) / 24),
  ]);
  const best: { x: number; y: number; r: number; score: number }[] = [];
  for (let r = Math.round(h * 0.19); r < h * 0.47; r += 3)
    for (let y = Math.round(h * 0.42); y < h - r; y += 4)
      for (let x = r; x < w - r; x += 4) {
        let score = 0,
          hits = 0;
        for (const [c, s] of angles) {
          const xx = Math.round(x + c * r),
            yy = Math.round(y + s * r);
          const e = edge[yy * w + xx] || 0;
          score += Math.min(150, e);
          if (e > 45) hits++;
        }
        if (hits >= 19) best.push({ x, y, r, score: score / 48 });
      }
  best.sort((a, b) => b.score - a.score);
  let pair: typeof best = [];
  let pairScore = 0;
  for (const a of best.slice(0, 120))
    for (const b of best.slice(0, 200)) {
      if (
        b.x - a.x < a.r * 2.1 ||
        Math.abs(a.y - b.y) > h * 0.09 ||
        Math.abs(a.r - b.r) > a.r * 0.13
      )
        continue;
      const score =
        a.score + b.score - Math.abs(a.r - b.r) * 2 - Math.abs(a.y - b.y);
      if (score > pairScore) {
        pairScore = score;
        pair = [a, b];
      }
    }
  return pair.map((p) => ({
    cx: p.x,
    cy: p.y,
    rx: p.r,
    ry: p.r,
    innerRatio: 0.89,
    rimRatio: 0.83,
  }));
}
