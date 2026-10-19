import { useEffect, useRef, useState } from "react";
import type { CatalogueEntry } from "./types";
import { renderComponent } from "./componentRenderers";
import { loadImage } from "./images";
const cache = new Map<string, HTMLCanvasElement>();
export default function Thumbnail({
  entry,
  colour,
}: {
  entry: CatalogueEntry;
  colour?: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null),
    [visible, setVisible] = useState(false);
  useEffect(() => {
    if (entry.thumbnail) return;
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (items) => {
        if (items.some((i) => i.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "160px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [entry.thumbnail]);
  useEffect(() => {
    if (!visible || entry.thumbnail) return;
    let live = true;
    const key = JSON.stringify([entry, colour]);
    (async () => {
      let c = cache.get(key);
      if (!c) {
        c = document.createElement("canvas");
        c.width = 200;
        c.height = 140;
        const ctx = c.getContext("2d")!;
        if (entry.asset) {
          const im = await loadImage(entry.asset),
            scale = Math.min(116 / im.width, 116 / im.height);
          ctx.drawImage(
            im,
            100 - (im.width * scale) / 2,
            70 - (im.height * scale) / 2,
            im.width * scale,
            im.height * scale,
          );
        } else {
          ctx.translate(42, 10);
          ctx.scale(1.16, 1.16);
          renderComponent(ctx, entry, colour);
        }
        cache.set(key, c);
        if (cache.size > 160) cache.delete(cache.keys().next().value!);
      }
      if (live && ref.current) {
        const ctx = ref.current.getContext("2d")!;
        ctx.clearRect(0, 0, 200, 140);
        ctx.drawImage(c, 0, 0);
      }
    })().catch(() => {});
    return () => {
      live = false;
    };
  }, [entry, colour, visible]);
  return entry.thumbnail ? (
    <img
      className="component-thumbnail"
      src={entry.thumbnail}
      loading="lazy"
      decoding="async"
      alt={`${entry.name} preview`}
    />
  ) : (
    <canvas
      ref={ref}
      width="200"
      height="140"
      aria-label={`${entry.name} preview`}
      role="img"
    />
  );
}
