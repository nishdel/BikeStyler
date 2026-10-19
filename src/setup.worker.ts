import { backgroundMask, suggestWheels } from "./pixels";
self.onmessage = (event: MessageEvent) => {
  const {
    id,
    kind,
    data,
    width,
    height,
    tolerance,
    seeds,
    connected,
    seedPoint,
  } = event.data;
  try {
    self.postMessage({ id, progress: 15 });
    if (kind === "background") {
      const alpha = backgroundMask(
        new Uint8ClampedArray(data),
        width,
        height,
        tolerance,
        seeds,
        connected,
        seedPoint,
      );
      (
        self as unknown as {
          postMessage: (value: unknown, transfer: Transferable[]) => void;
        }
      ).postMessage({ id, result: alpha }, [alpha.buffer]);
    } else
      self.postMessage({
        id,
        result: suggestWheels(new Uint8ClampedArray(data), width, height),
      });
  } catch (error) {
    self.postMessage({ id, error: String(error) });
  }
};
