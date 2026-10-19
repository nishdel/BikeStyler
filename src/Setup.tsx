import { fixStageFrame } from "./portable";
import { useEffect, useRef, useState } from "react";
import type { Project, Point, Wheel, Part, Category } from "./types";
import { CATEGORIES } from "./types";
import {
  alphaURL,
  canvas,
  imagePixels,
  loadImage,
  maskAlpha,
  transformPhoto,
  uid,
  wheelParts,
} from "./images";
import { refineMask } from "./pixels";

type Props = {
  project: Project;
  initialPart?: string;
  initialProtection?: boolean;
  onChange: (p: Project) => void;
  onClose: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  notify: (s: string) => void;
};
type Tool =
  | "keep"
  | "remove"
  | "polygon"
  | "sample"
  | "locate"
  | "wheel-front"
  | "wheel-rear"
  | "crop"
  | "pan";
export default function Setup({
  project: p,
  initialPart,
  initialProtection,
  onChange,
  onClose,
  undo,
  redo,
  canUndo,
  canRedo,
  notify,
}: Props) {
  const [step, setStep] = useState(initialPart ? 2 : 1),
    [tool, setTool] = useState<Tool>("remove"),
    [brush, setBrush] = useState(18),
    [tolerance, setTolerance] = useState(24),
    [connected, setConnected] = useState(false),
    [zoom, setZoom] = useState(1),
    [fit, setFit] = useState(1),
    [guide, setGuide] = useState(false),
    [selected, setSelected] = useState(initialPart || "frame"),
    [protect, setProtect] = useState(!!initialProtection),
    [protectScope, setProtectScope] = useState<"part" | "all">("part"),
    [polygon, setPolygon] = useState<Point[]>([]),
    [wheelPoint, setWheelPoint] = useState<Point | null>(null),
    [busy, setBusy] = useState(""),
    [progress, setProgress] = useState(0),
    [newName, setNewName] = useState(""),
    [newCategory, setNewCategory] = useState<Category>("bottles"),
    [crop, setCrop] = useState<{
      x: number;
      y: number;
      width: number;
      height: number;
    } | null>(null);
  const view = useRef<HTMLCanvasElement>(null),
    viewport = useRef<HTMLDivElement>(null),
    mask = useRef<HTMLCanvasElement | null>(null),
    worker = useRef<Worker | null>(null),
    job = useRef(0),
    drawing = useRef(false),
    last = useRef<Point | null>(null),
    cropStart = useRef<Point | null>(null),
    pan = useRef<{ x: number; y: number; left: number; top: number } | null>(
      null,
    ),
    latest = useRef(p);
  latest.current = p;
  const part = p.parts.find((x) => x.id === selected),
    target = step === 1 ? "cutout" : protect ? "protection" : "part";
  const maskUrl =
    target === "cutout"
      ? p.cutout
      : target === "protection"
        ? protectScope === "all"
          ? p.protection
          : part?.protection
        : part?.mask;
  useEffect(() => {
    const el = viewport.current;
    if (!el) return;
    const resize = () =>
      setFit(
        Math.min(
          (el.clientWidth - 50) / p.workWidth,
          (el.clientHeight - 50) / p.workHeight,
        ),
      );
    resize();
    const o = new ResizeObserver(resize);
    o.observe(el);
    return () => o.disconnect();
  }, [p.workWidth, p.workHeight]);
  useEffect(() => {
    let active = true;
    (async () => {
      const c = canvas(p.workWidth, p.workHeight);
      if (maskUrl)
        c.getContext("2d")!.drawImage(
          await loadImage(maskUrl),
          0,
          0,
          p.workWidth,
          p.workHeight,
        );
      if (active) {
        mask.current = c;
        draw(c);
      }
    })().catch((e) => notify(String(e)));
    return () => {
      active = false;
    };
  }, [
    maskUrl,
    step,
    protect,
    protectScope,
    selected,
    p.source,
    p.cutout,
    guide,
  ]);
  useEffect(() => {
    draw();
  }, [polygon, crop, wheelPoint, selected, p.parts, step]);
  useEffect(
    () => () => {
      worker.current?.terminate();
    },
    [],
  );
  async function draw(current = mask.current) {
    const targetCanvas = view.current;
    if (!targetCanvas) return;
    const ctx = targetCanvas.getContext("2d")!,
      src = await loadImage(p.source);
    ctx.clearRect(0, 0, p.workWidth, p.workHeight);
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, p.workWidth, p.workHeight);
    if (guide) {
      ctx.globalAlpha = 0.2;
      ctx.drawImage(src, 0, 0, p.workWidth, p.workHeight);
      ctx.globalAlpha = 1;
    }
    const layer = canvas(p.workWidth, p.workHeight),
      lc = layer.getContext("2d")!;
    lc.drawImage(src, 0, 0, p.workWidth, p.workHeight);
    lc.globalCompositeOperation = "destination-in";
    const cut =
      target === "cutout" && current ? current : await loadImage(p.cutout);
    lc.drawImage(cut, 0, 0, p.workWidth, p.workHeight);
    ctx.drawImage(layer, 0, 0);
    if (step === 2 && current) {
      const overlay = canvas(p.workWidth, p.workHeight),
        oc = overlay.getContext("2d")!;
      oc.fillStyle = protect ? "#8e55e9" : "#51b99b";
      oc.fillRect(0, 0, overlay.width, overlay.height);
      oc.globalCompositeOperation = "destination-in";
      oc.drawImage(current, 0, 0);
      ctx.globalAlpha = 0.48;
      ctx.drawImage(overlay, 0, 0);
      ctx.globalAlpha = 1;
    }
    const s = p.workWidth / p.width;
    ctx.lineWidth = 2 / Math.max(fit * zoom, 0.2);
    ctx.strokeStyle = "#24795b";
    ctx.fillStyle = "#24795b";
    if (step === 2 && part) {
      const a = part.anchor;
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(
        (a.x - a.width / 2) * s,
        (a.y - a.height / 2) * s,
        a.width * s,
        a.height * s,
      );
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.arc(
        part.marker.x * s,
        part.marker.y * s,
        5 / Math.max(fit * zoom, 0.3),
        0,
        Math.PI * 2,
      );
      ctx.fill();
      if (part.wheel)
        for (const r of [1, part.wheel.innerRatio, part.wheel.rimRatio]) {
          ctx.beginPath();
          ctx.ellipse(
            part.wheel.cx * s,
            part.wheel.cy * s,
            part.wheel.rx * s * r,
            part.wheel.ry * s * r,
            ((part.wheel.rotation || 0) * Math.PI) / 180,
            0,
            Math.PI * 2,
          );
          ctx.stroke();
        }
    }
    if (polygon.length) {
      ctx.beginPath();
      polygon.forEach((q, i) =>
        i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y),
      );
      ctx.stroke();
      for (const q of polygon) {
        ctx.beginPath();
        ctx.arc(q.x, q.y, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    if (wheelPoint) {
      ctx.beginPath();
      ctx.arc(wheelPoint.x, wheelPoint.y, 6, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (crop) {
      ctx.strokeStyle = "#b36b23";
      ctx.strokeRect(crop.x, crop.y, crop.width, crop.height);
    }
  }
  function protectedProject(current: Project, url: string): Project {
    return protectScope === "all"
      ? { ...current, protection: url }
      : {
          ...current,
          parts: current.parts.map((t) =>
            t.id === selected ? { ...t, protection: url } : t,
          ),
        };
  }
  function commitMask() {
    if (!mask.current) return;
    const url = mask.current.toDataURL();
    const current = latest.current;
    onChange(
      target === "cutout"
        ? { ...current, cutout: url }
        : target === "protection"
          ? protectedProject(current, url)
          : {
              ...current,
              parts: current.parts.map((t) =>
                t.id === selected
                  ? { ...t, mask: url, status: "suggested" }
                  : t,
              ),
            },
    );
  }
  function pt(event: React.PointerEvent<HTMLCanvasElement>): Point {
    const r = event.currentTarget.getBoundingClientRect();
    return {
      x: Math.max(
        0,
        Math.min(
          p.workWidth,
          ((event.clientX - r.left) * p.workWidth) / r.width,
        ),
      ),
      y: Math.max(
        0,
        Math.min(
          p.workHeight,
          ((event.clientY - r.top) * p.workHeight) / r.height,
        ),
      ),
    };
  }
  function paint(a: Point, b: Point) {
    const ctx = mask.current?.getContext("2d");
    if (!ctx) return;
    ctx.globalCompositeOperation =
      tool === "remove" ? "destination-out" : "source-over";
    ctx.strokeStyle = "white";
    ctx.fillStyle = "white";
    ctx.lineWidth = brush;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(b.x, b.y, brush / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";
    draw();
  }
  function pointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    if (busy) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const point = pt(e);
    if (tool === "pan") {
      const v = viewport.current!;
      pan.current = {
        x: e.clientX,
        y: e.clientY,
        left: v.scrollLeft,
        top: v.scrollTop,
      };
      return;
    }
    if (tool === "polygon") {
      setPolygon((q) => [...q, point]);
      return;
    }
    if (tool === "crop") {
      cropStart.current = point;
      return;
    }
    if (tool === "locate" && part) {
      const s = p.width / p.workWidth;
      onChange({
        ...p,
        parts: p.parts.map((t) =>
          t.id === selected
            ? {
                ...t,
                marker: { x: point.x * s, y: point.y * s },
                anchor: { ...t.anchor, x: point.x * s, y: point.y * s },
              }
            : t,
        ),
      });
      return;
    }
    if (tool.startsWith("wheel-")) {
      if (!wheelPoint) setWheelPoint(point);
      else {
        const s = p.width / p.workWidth,
          r = Math.hypot(point.x - wheelPoint.x, point.y - wheelPoint.y) * s;
        if (r < 10) return;
        applyWheel(
          {
            cx: wheelPoint.x * s,
            cy: wheelPoint.y * s,
            rx: r,
            ry: r,
            innerRatio: 0.89,
            rimRatio: 0.83,
          },
          tool === "wheel-front" ? "front" : "rear",
        );
        setWheelPoint(null);
        setTool("keep");
      }
      return;
    }
    if (tool === "sample") {
      run("sample", point);
      return;
    }
    drawing.current = true;
    last.current = point;
    paint(point, point);
  }
  function pointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (pan.current) {
      const v = viewport.current!;
      v.scrollLeft = pan.current.left - (e.clientX - pan.current.x);
      v.scrollTop = pan.current.top - (e.clientY - pan.current.y);
      return;
    }
    const point = pt(e);
    if (cropStart.current) {
      const a = cropStart.current;
      setCrop({
        x: Math.min(a.x, point.x),
        y: Math.min(a.y, point.y),
        width: Math.abs(a.x - point.x),
        height: Math.abs(a.y - point.y),
      });
    }
    if (drawing.current && last.current) {
      paint(last.current, point);
      last.current = point;
    }
  }
  function pointerUp() {
    pan.current = null;
    cropStart.current = null;
    if (drawing.current) {
      drawing.current = false;
      last.current = null;
      commitMask();
    }
  }
  function applyPolygon(keep: boolean) {
    if (polygon.length < 3 || !mask.current) return;
    const ctx = mask.current.getContext("2d")!;
    ctx.globalCompositeOperation = keep ? "source-over" : "destination-out";
    ctx.fillStyle = "white";
    ctx.beginPath();
    polygon.forEach((q, i) =>
      i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y),
    );
    ctx.closePath();
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";
    setPolygon([]);
    commitMask();
  }
  function cancel() {
    worker.current?.terminate();
    worker.current = null;
    job.current++;
    setBusy("");
    notify("Processing cancelled. Your previous mask is unchanged.");
  }
  async function run(kind: "background" | "sample" | "wheels", seed?: Point) {
    const processingStarted = performance.now(),
      token = ++job.current;
    setBusy(
      kind === "wheels"
        ? "Looking for circular edges…"
        : "Selecting background colours…",
    );
    setProgress(5);
    try {
      const size = kind === "wheels" ? Math.min(1, 360 / p.workWidth) : 1,
        w = Math.round(p.workWidth * size),
        h = Math.round(p.workHeight * size),
        pixels = await imagePixels(p.source, w, h);
      if (token !== job.current) return;
      const samples = seed
        ? [
            Array.from(
              pixels.data.slice(
                (Math.floor(seed.y) * w + Math.floor(seed.x)) * 4,
                (Math.floor(seed.y) * w + Math.floor(seed.x)) * 4 + 3,
              ),
            ),
          ]
        : undefined;
      const task = new Worker(new URL("./setup.worker.ts", import.meta.url), {
        type: "module",
      });
      worker.current = task;
      task.onmessage = async (event) => {
        if (token !== job.current) return;
        const data = event.data;
        if (data.progress) {
          setProgress(data.progress);
          return;
        }
        task.terminate();
        worker.current = null;
        setBusy("");
        if (data.error) {
          notify(data.error);
          return;
        }
        const current = {
          ...latest.current,
          metrics: {
            ...latest.current.metrics,
            setupMs:
              latest.current.metrics.setupMs +
              performance.now() -
              processingStarted,
          },
        };
        if (kind === "wheels") {
          const wheels = (data.result as Wheel[]).map((wh) => ({
            ...wh,
            cx: ((wh.cx / size) * p.width) / p.workWidth,
            cy: ((wh.cy / size) * p.width) / p.workWidth,
            rx: ((wh.rx / size) * p.width) / p.workWidth,
            ry: ((wh.ry / size) * p.width) / p.workWidth,
          }));
          if (wheels.length !== 2) {
            notify(
              "No reliable wheel pair found. Use Set front/rear wheel: click its centre, then its outside edge.",
            );
            return;
          }
          const left = p.orientation === "right" ? "rear" : "front",
            right = p.orientation === "right" ? "front" : "rear";
          const replacements = [
            ...wheelParts(wheels[0], left, current),
            ...wheelParts(wheels[1], right, current),
          ];
          onChange({
            ...current,
            parts: [
              ...current.parts.filter(
                (t) => !replacements.some((q) => q.id === t.id),
              ),
              ...replacements,
            ],
          });
          setSelected("front-tyre");
          notify(
            "Circular-edge suggestions added. Adjust the circles and confirm both wheels.",
          );
        } else {
          let alpha = new Uint8ClampedArray(data.result);
          if (kind === "sample") {
            const previous = await maskAlpha(
              step === 1
                ? current.cutout
                : protect
                  ? protectScope === "all"
                    ? current.protection
                    : current.parts.find((t) => t.id === selected)?.protection
                  : current.parts.find((t) => t.id === selected)?.mask,
              w,
              h,
            );
            alpha = alpha.map((a, i) =>
              step === 1
                ? Math.min(a, previous[i])
                : Math.max(255 - a, previous[i]),
            );
          }
          if (token !== job.current) return;
          const untouched = alpha.every((a) => a === 255);
          const url = alphaURL(alpha, w, h);
          if (step === 1) onChange({ ...current, cutout: url });
          else if (protect) onChange(protectedProject(current, url));
          else
            onChange({
              ...current,
              parts: current.parts.map((t) =>
                t.id === selected
                  ? { ...t, mask: url, status: "suggested" }
                  : t,
              ),
            });
          notify(
            untouched && kind === "background"
              ? "This background is too varied for a safe automatic selection. Sample individual background regions, use polygons and brushes, or retake against a plain backdrop."
              : "Selection ready. Check spokes, pale parts and lettering before accepting.",
          );
        }
      };
      task.onerror = () => {
        task.terminate();
        setBusy("");
        notify(
          "Processing failed. Your previous work is intact; use brush or polygon selection.",
        );
      };
      task.postMessage(
        {
          id: token,
          kind: kind === "wheels" ? "wheels" : "background",
          data: pixels.data.buffer,
          width: w,
          height: h,
          tolerance,
          seeds: samples,
          connected,
          seedPoint: seed,
        },
        [pixels.data.buffer],
      );
    } catch (e) {
      setBusy("");
      notify(String(e));
    }
  }
  function applyWheel(wh: Wheel, side: "front" | "rear") {
    const current = latest.current;
    const replacements = wheelParts(wh, side, current).map((next) => {
      const old = current.parts.find((t) => t.id === next.id);
      return {
        ...next,
        locked: old?.locked || false,
        protection: old?.protection,
      };
    });
    onChange({
      ...current,
      parts: [
        ...current.parts.filter(
          (t) => !replacements.some((q) => q.id === t.id),
        ),
        ...replacements,
      ],
    });
    setSelected(`${side}-tyre`);
  }
  function editWheel(key: keyof Wheel, value: number) {
    if (!part?.wheel) return;
    const wh = { ...part.wheel, [key]: value };
    if (wh.rimRatio >= wh.innerRatio) wh.rimRatio = wh.innerRatio - 0.02;
    applyWheel(wh, part.id.startsWith("front") ? "front" : "rear");
  }
  async function refine(mode: "soften" | "expand" | "contract") {
    if (!mask.current) return;
    const a = await maskAlpha(
        mask.current.toDataURL(),
        p.workWidth,
        p.workHeight,
      ),
      url = alphaURL(
        refineMask(a, p.workWidth, p.workHeight, mode),
        p.workWidth,
        p.workHeight,
      );
    mask.current.getContext("2d")!.clearRect(0, 0, p.workWidth, p.workHeight);
    mask.current.getContext("2d")!.drawImage(await loadImage(url), 0, 0);
    commitMask();
  }
  function confirmPart() {
    if (!part?.mask) {
      notify(
        "Paint or draw an actual source mask first. A marker alone cannot replace a component.",
      );
      return;
    }
    const ids = part.wheel
      ? p.parts
          .filter(
            (t) =>
              t.id.startsWith(
                part.id.startsWith("front") ? "front-" : "rear-",
              ) && t.wheel,
          )
          .map((t) => t.id)
      : [part.id];
    onChange({
      ...p,
      parts: p.parts.map((t) =>
        ids.includes(t.id) ? { ...t, status: "confirmed" } : t,
      ),
    });
    notify(
      part.wheel
        ? "Wheel geometry confirmed. Protect overlapping frame, fork and brakes before a full wheel swap."
        : `${part.name} mask confirmed.`,
    );
  }
  function addPart() {
    if (p.parts.length >= 100) {
      notify("A project can contain up to 100 parts.");
      return;
    }
    if (!newName.trim()) return;
    const id = `part-${uid()}`,
      np: Part = {
        id,
        name: newName.trim().slice(0, 60),
        category: newCategory,
        marker: { x: p.width / 2, y: p.height / 2 },
        anchor: {
          x: p.width / 2,
          y: p.height / 2,
          width: p.width * 0.15,
          height: p.height * 0.15,
          rotation: 0,
        },
        locked: false,
        status: "missing",
      };
    onChange({ ...p, parts: [...p.parts, np] });
    setSelected(id);
    setNewName("");
    setTool("locate");
  }
  function suggestTubes() {
    const rear = p.parts.find((t) => t.id === "rear-tyre")?.wheel,
      front = p.parts.find((t) => t.id === "front-tyre")?.wheel;
    if (!rear || !front) {
      notify("Set both wheel circles first.");
      return;
    }
    const s = p.workWidth / p.width,
      dx = front.cx - rear.cx,
      bb = { x: rear.cx + dx * 0.42, y: rear.cy + rear.ry * 0.1 },
      seat = { x: rear.cx + dx * 0.31, y: rear.cy - rear.ry * 0.94 },
      head = { x: rear.cx + dx * 0.82, y: front.cy - front.ry * 0.96 };
    const c = canvas(p.workWidth, p.workHeight),
      ctx = c.getContext("2d")!;
    ctx.scale(s, s);
    ctx.strokeStyle = "white";
    ctx.lineWidth = p.width * 0.012;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(rear.cx, rear.cy);
    ctx.lineTo(seat.x, seat.y);
    ctx.lineTo(bb.x, bb.y);
    ctx.lineTo(rear.cx, rear.cy);
    ctx.moveTo(seat.x, seat.y);
    ctx.lineTo(head.x, head.y);
    ctx.lineTo(bb.x, bb.y);
    ctx.stroke();
    onChange({
      ...p,
      parts: p.parts.map((t) =>
        t.id === "frame"
          ? {
              ...t,
              mask: c.toDataURL(),
              status: "suggested",
              marker: { x: (head.x + bb.x) / 2, y: (head.y + bb.y) / 2 },
            }
          : t,
      ),
    });
    setSelected("frame");
    notify(
      "An adjustable geometry template was added, not detected frame tubes. Correct its mask to your actual frame.",
    );
  }
  const ready = ["frame", "front-tyre", "rear-tyre"].every((id) =>
    p.parts.some((t) => t.id === id && t.status === "confirmed"),
  );
  return (
    <div
      className="setup-shell"
      role="dialog"
      aria-modal="true"
      aria-label="Bicycle setup"
    >
      <header className="setup-header">
        <div>
          <span className="eyebrow">ONE-TIME SETUP</span>
          <h2>Your bicycle, ready to style.</h2>
        </div>
        <button
          className="icon-button"
          onClick={onClose}
          aria-label="Close setup"
        >
          ×
        </button>
      </header>
      <div className="setup-tabs">
        <button
          className={step === 0 ? "active" : ""}
          onClick={() => setStep(0)}
        >
          01 <span>Prepare photo</span>
        </button>
        <button
          className={step === 1 ? "active" : ""}
          onClick={() => {
            setStep(1);
            setTool("remove");
            setProtect(false);
          }}
        >
          02 <span>Isolate bicycle</span>
        </button>
        <button
          className={step === 2 ? "active" : ""}
          onClick={() => {
            setStep(2);
            setTool("keep");
          }}
        >
          03 <span>Map your parts</span>
        </button>
      </div>
      <div className="setup-body">
        <aside className="setup-tools">
          {step === 0 ? (
            <>
              <h3>A better starting point</h3>
              <p>
                Use a level, complete side view. A plain contrasting background
                and even light help preserve thin spokes. A drivetrain-side
                photo works well.
              </p>
              <div className="button-row">
                <button
                  onClick={async () => {
                    try {
                      onChange(await transformPhoto(p, -90));
                    } catch (e) {
                      notify(String(e));
                    }
                  }}
                >
                  ↶ Rotate
                </button>
                <button
                  onClick={async () => {
                    try {
                      onChange(await transformPhoto(p, 90));
                    } catch (e) {
                      notify(String(e));
                    }
                  }}
                >
                  Rotate ↷
                </button>
              </div>
              <button
                className={tool === "crop" ? "selected" : ""}
                onClick={() => setTool("crop")}
              >
                Crop photo · drag a rectangle
              </button>
              {crop && (
                <button
                  disabled={crop.width < 100 || crop.height < 100}
                  onClick={async () => {
                    const s = p.width / p.workWidth;
                    try {
                      onChange(
                        await transformPhoto(p, 0, {
                          x: crop.x * s,
                          y: crop.y * s,
                          width: crop.width * s,
                          height: crop.height * s,
                        }),
                      );
                      setCrop(null);
                    } catch (e) {
                      notify(String(e));
                    }
                  }}
                >
                  Apply crop
                </button>
              )}
              <p className="hint">
                The uploaded original is retained. Geometry follows rotation and
                crop. Export uses the oriented source up to 4096 px.
              </p>
              <label>
                Front wheel faces
                <select
                  value={p.orientation}
                  onChange={(e) =>
                    onChange({
                      ...p,
                      orientation: e.target.value as "left" | "right",
                    })
                  }
                >
                  <option value="right">Right</option>
                  <option value="left">Left</option>
                </select>
              </label>
              <button className="primary" onClick={() => setStep(1)}>
                Continue to cut-out →
              </button>
            </>
          ) : (
            <>
              {step === 1 ? (
                <>
                  <h3>Keep the bike. Lose the room.</h3>
                  <p>
                    Start with a colour selection, then recover details with the
                    brush. The preview is always on white.
                  </p>
                  <button
                    className="primary"
                    disabled={!!busy}
                    onClick={() => run("background")}
                  >
                    Remove border colours
                  </button>
                  <label>
                    Colour tolerance <b>{tolerance}</b>
                    <input
                      type="range"
                      min="3"
                      max="85"
                      value={tolerance}
                      onChange={(e) => setTolerance(+e.target.value)}
                    />
                  </label>
                  <label className="check">
                    <input
                      type="checkbox"
                      checked={connected}
                      onChange={(e) => setConnected(e.target.checked)}
                    />{" "}
                    Connected region only
                  </label>
                  <p className="hint">
                    Leave unchecked to reach background inside frame triangles
                    and between spokes. Similar-coloured bicycle details may
                    need Keep corrections.
                  </p>
                </>
              ) : (
                <>
                  <h3>Give each part a place.</h3>
                  <select
                    aria-label="Part to configure"
                    value={selected}
                    onChange={(e) => {
                      setSelected(e.target.value);
                      setPolygon([]);
                    }}
                  >
                    {p.parts.map((t) => (
                      <option value={t.id} key={t.id}>
                        {t.status === "confirmed"
                          ? "✓"
                          : t.status === "suggested"
                            ? "◌"
                            : "○"}{" "}
                        {t.name}
                      </option>
                    ))}
                  </select>
                  <div className="status-line">
                    {part?.status === "confirmed"
                      ? "Confirmed geometry"
                      : part?.status === "suggested"
                        ? "Suggestion · needs your check"
                        : "Needs setup · location is a placeholder"}
                  </div>
                  <button disabled={!!busy} onClick={() => run("wheels")}>
                    Find circular wheel edges
                  </button>
                  <div className="button-row">
                    <button
                      onClick={() => {
                        setTool("wheel-front");
                        setWheelPoint(null);
                      }}
                    >
                      Set front wheel
                    </button>
                    <button
                      onClick={() => {
                        setTool("wheel-rear");
                        setWheelPoint(null);
                      }}
                    >
                      Set rear wheel
                    </button>
                  </div>
                  {tool.startsWith("wheel-") && (
                    <p className="callout">
                      {wheelPoint
                        ? "Now click the outer tyre edge."
                        : "Click the centre of the wheel."}
                    </p>
                  )}
                  <button onClick={suggestTubes}>
                    Suggest a frame-tube guide
                  </button>
                  <label className="check">
                    <input
                      type="checkbox"
                      checked={protect}
                      onChange={(e) => setProtect(e.target.checked)}
                    />{" "}
                    Paint protected details / overlaps
                  </label>
                  {protect && (
                    <label>
                      Protection applies to
                      <select
                        value={protectScope}
                        onChange={(e) =>
                          setProtectScope(e.target.value as "part" | "all")
                        }
                      >
                        <option value="part">This component only</option>
                        <option value="all">Every component</option>
                      </select>
                    </label>
                  )}
                  <p className="hint">
                    Green = selected part. Purple = protected lettering, cables
                    and overlaps. Protection keeps original pixels above
                    replacements.
                  </p>
                </>
              )}
              <div className="tool-grid">
                {(
                  [
                    ["keep", step === 1 ? "＋ Keep this" : "＋ Add to mask"],
                    ["remove", step === 1 ? "− Remove this" : "− Erase mask"],
                    ["polygon", "◇ Polygon"],
                    [
                      "sample",
                      step === 1 ? "⌾ Sample background" : "⌾ Select by colour",
                    ],
                    ["pan", "✥ Pan"],
                    ...(step === 2 ? [["locate", "⊙ Place anchor"]] : []),
                  ] as [Tool, string][]
                ).map(([id, label]) => (
                  <button
                    key={id}
                    className={tool === id ? "selected" : ""}
                    onClick={() => {
                      setTool(id);
                      setPolygon([]);
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <label>
                Brush size <b>{brush} px</b>
                <input
                  type="range"
                  min="1"
                  max="120"
                  value={brush}
                  onChange={(e) => setBrush(+e.target.value)}
                />
              </label>
              {step === 2 && tool === "sample" && (
                <>
                  <label>
                    Colour tolerance
                    <input
                      type="range"
                      min="3"
                      max="85"
                      value={tolerance}
                      onChange={(e) => setTolerance(+e.target.value)}
                    />
                  </label>
                  <label className="check">
                    <input
                      type="checkbox"
                      checked={connected}
                      onChange={(e) => setConnected(e.target.checked)}
                    />{" "}
                    Connected region only
                  </label>
                </>
              )}
              {tool === "polygon" && (
                <>
                  <p className="hint">
                    Click around the boundary, then choose an action.
                  </p>
                  <div className="button-row">
                    <button
                      disabled={polygon.length < 3}
                      onClick={() => applyPolygon(true)}
                    >
                      Keep polygon
                    </button>
                    <button
                      disabled={polygon.length < 3}
                      onClick={() => applyPolygon(false)}
                    >
                      Remove polygon
                    </button>
                  </div>
                  <button
                    disabled={!polygon.length}
                    onClick={() => setPolygon([])}
                  >
                    Clear points
                  </button>
                </>
              )}
              <details>
                <summary>Refine edges</summary>
                <p className="hint">
                  One working pixel per click. Expanding or softening can affect
                  thin spokes; undo if needed.
                </p>
                <div className="button-row">
                  <button onClick={() => refine("soften")}>Soften</button>
                  <button onClick={() => refine("expand")}>Expand</button>
                  <button onClick={() => refine("contract")}>Contract</button>
                </div>
              </details>
              {step === 2 && part?.wheel && (
                <details open>
                  <summary>Wheel alignment</summary>
                  {(
                    [
                      "cx",
                      "cy",
                      "rx",
                      "ry",
                      "rotation",
                      "hubX",
                      "hubY",
                    ] as (keyof Wheel)[]
                  ).map((k) => (
                    <label className="number-field" key={k}>
                      {
                        (
                          {
                            cx: "Centre X",
                            cy: "Centre Y",
                            rx: "Major radius",
                            ry: "Minor radius",
                            rotation: "Ellipse angle (degrees)",
                            hubX: "Axle X",
                            hubY: "Axle Y",
                          } as Record<string, string>
                        )[k]
                      }
                      <input
                        type="number"
                        min={
                          k === "rotation" ? -360 : k.startsWith("r") ? 10 : 0
                        }
                        max={p.width * 2}
                        value={Math.round(
                          part.wheel![k] ??
                            (k === "hubX"
                              ? part.wheel!.cx
                              : k === "hubY"
                                ? part.wheel!.cy
                                : 0),
                        )}
                        onChange={(e) =>
                          editWheel(
                            k,
                            k === "rotation"
                              ? +e.target.value
                              : Math.max(1, +e.target.value),
                          )
                        }
                      />
                    </label>
                  ))}
                  <label>
                    Tyre inner boundary
                    <input
                      type="range"
                      min=".65"
                      max=".97"
                      step=".005"
                      value={part.wheel.innerRatio}
                      onChange={(e) => editWheel("innerRatio", +e.target.value)}
                    />
                  </label>
                  <label>
                    Rim inner boundary
                    <input
                      type="range"
                      min=".5"
                      max={part.wheel.innerRatio - 0.02}
                      step=".005"
                      value={part.wheel.rimRatio}
                      onChange={(e) => editWheel("rimRatio", +e.target.value)}
                    />
                  </label>
                </details>
              )}
              {step === 2 && part && (
                <>
                  <details>
                    <summary>Attachment & source mask</summary>
                    <p className="hint">
                      Mask the old component completely. Place the anchor at its
                      attachment centre, then set the graphic bounds.
                    </p>
                    {(["width", "height", "rotation"] as const).map((k) => (
                      <label className="number-field" key={k}>
                        {k}
                        <input
                          type="number"
                          value={Math.round(part.anchor[k])}
                          onChange={(e) =>
                            onChange({
                              ...p,
                              parts: p.parts.map((t) =>
                                t.id === part.id
                                  ? {
                                      ...t,
                                      anchor: {
                                        ...t.anchor,
                                        [k]:
                                          k === "rotation"
                                            ? +e.target.value
                                            : Math.max(1, +e.target.value),
                                      },
                                    }
                                  : t,
                              ),
                            })
                          }
                        />
                      </label>
                    ))}
                    <button
                      onClick={() =>
                        onChange({
                          ...p,
                          parts: p.parts.map((t) =>
                            t.id === part.id
                              ? {
                                  ...t,
                                  mask: alphaURL(
                                    new Uint8ClampedArray(
                                      p.workWidth * p.workHeight,
                                    ),
                                    p.workWidth,
                                    p.workHeight,
                                  ),
                                  status: "missing",
                                }
                              : t,
                          ),
                        })
                      }
                    >
                      Clear part mask
                    </button>
                  </details>
                  <button className="primary" onClick={confirmPart}>
                    ✓ Confirm {part.wheel ? "wheel geometry" : part.name}
                  </button>
                  <details>
                    <summary>Add another part</summary>
                    <label>
                      Part name
                      <input
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="e.g. Touring bag"
                        maxLength={60}
                      />
                    </label>
                    <label>
                      Catalogue category
                      <select
                        value={newCategory}
                        onChange={(e) =>
                          setNewCategory(e.target.value as Category)
                        }
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <button disabled={!newName.trim()} onClick={addPart}>
                      Add part & place anchor
                    </button>
                    <p className="hint">
                      For a new accessory with no original pixels, confirm an
                      empty mask after placing its anchor. There is nothing to
                      suppress.
                    </p>
                    <button
                      onClick={() => {
                        if (part.mask) return;
                        onChange({
                          ...p,
                          parts: p.parts.map((t) =>
                            t.id === part.id
                              ? {
                                  ...t,
                                  mask: alphaURL(
                                    new Uint8ClampedArray(
                                      p.workWidth * p.workHeight,
                                    ),
                                    p.workWidth,
                                    p.workHeight,
                                  ),
                                  status: "confirmed",
                                }
                              : t,
                          ),
                        });
                      }}
                    >
                      This is an added accessory
                    </button>
                  </details>
                </>
              )}
              {step === 1 && (
                <button
                  className="primary"
                  onClick={() => {
                    setStep(2);
                    setTool("keep");
                  }}
                >
                  Accept cut-out & map parts →
                </button>
              )}
            </>
          )}
        </aside>
        <div className="setup-work">
          <div className="canvas-toolbar">
            <div className="button-row">
              <button onClick={undo} disabled={!canUndo} title="Undo">
                ↶
              </button>
              <button onClick={redo} disabled={!canRedo} title="Redo">
                ↷
              </button>
            </div>
            <label className="check">
              <input
                type="checkbox"
                checked={guide}
                onChange={(e) => setGuide(e.target.checked)}
              />{" "}
              Original guide
            </label>
            <div className="zoom-control">
              <button
                onClick={() => setZoom((v) => Math.max(0.5, v - 0.25))}
                aria-label="Zoom out"
              >
                −
              </button>
              <span>{Math.round(zoom * 100)}%</span>
              <button
                onClick={() => setZoom((v) => Math.min(5, v + 0.25))}
                aria-label="Zoom in"
              >
                ＋
              </button>
              <button onClick={() => setZoom(1)}>Fit</button>
            </div>
          </div>
          <div ref={viewport} className="setup-viewport">
            <canvas
              ref={view}
              width={p.workWidth}
              height={p.workHeight}
              style={{
                width: p.workWidth * fit * zoom,
                height: p.workHeight * fit * zoom,
                cursor: tool === "pan" ? "grab" : "crosshair",
              }}
              onPointerDown={pointerDown}
              onPointerMove={pointerMove}
              onPointerUp={pointerUp}
              onPointerCancel={pointerUp}
            />
          </div>
          <div className="setup-caption">
            <span>Original kept · masks remain editable</span>
            <span>
              {p.width} × {p.height} source · {p.workWidth} px working preview
            </span>
          </div>
          {busy && (
            <div className="processing">
              <div>
                <span className="spinner" />
                <h3>{busy}</h3>
                <progress value={progress} max="100" />
                <button onClick={cancel}>Cancel processing</button>
              </div>
            </div>
          )}
        </div>
      </div>
      <footer className="setup-footer">
        <p>
          {ready
            ? "Your frame and both tyres are confirmed. You can refine any other part later."
            : "Confirm the frame and both tyre masks to complete the core setup."}
        </p>
        <button
          className="primary"
          disabled={!ready || !!busy}
          onClick={() => {
            void fixStageFrame({ ...p, setupAccepted: true })
              .then((next) => {
                onChange(next);
                onClose();
              })
              .catch((e) => notify(String(e)));
          }}
        >
          Enter the garage →
        </button>
      </footer>
    </div>
  );
}
