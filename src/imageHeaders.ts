/** Read dimensions before asking a browser decoder to allocate the raster. */
export function rasterDimensions(
  buffer: ArrayBuffer,
  mime: string,
): { width: number; height: number } | null {
  const b = new Uint8Array(buffer),
    v = new DataView(buffer),
    ascii = (i: number, n: number) => String.fromCharCode(...b.slice(i, i + n));
  if (
    mime === "image/png" &&
    b.length >= 24 &&
    b[0] === 137 &&
    ascii(1, 3) === "PNG"
  )
    return { width: v.getUint32(16), height: v.getUint32(20) };
  if (mime === "image/jpeg" && b[0] === 255 && b[1] === 216) {
    let i = 2;
    while (i + 8 < b.length) {
      if (b[i] !== 255) {
        i++;
        continue;
      }
      const marker = b[i + 1];
      if (marker === 216 || marker === 217) {
        i += 2;
        continue;
      }
      const length = v.getUint16(i + 2);
      if (length < 2 || i + length + 2 > b.length) return null;
      if (
        [
          192, 193, 194, 195, 197, 198, 199, 201, 202, 203, 205, 206, 207,
        ].includes(marker)
      )
        return { width: v.getUint16(i + 7), height: v.getUint16(i + 5) };
      i += length + 2;
    }
  }
  if (
    mime === "image/webp" &&
    b.length >= 30 &&
    ascii(0, 4) === "RIFF" &&
    ascii(8, 4) === "WEBP"
  ) {
    const kind = ascii(12, 4);
    if (kind === "VP8X")
      return {
        width: 1 + b[24] + (b[25] << 8) + (b[26] << 16),
        height: 1 + b[27] + (b[28] << 8) + (b[29] << 16),
      };
    if (kind === "VP8 " && b[23] === 157 && b[24] === 1 && b[25] === 42)
      return {
        width: v.getUint16(26, true) & 16383,
        height: v.getUint16(28, true) & 16383,
      };
    if (kind === "VP8L" && b[20] === 47)
      return {
        width: 1 + b[21] + ((b[22] & 63) << 8),
        height: 1 + (b[22] >> 6) + (b[23] << 2) + ((b[24] & 15) << 10),
      };
  }
  return null;
}
export function checkRasterDimensions(
  dim: { width: number; height: number } | null,
  maxPixels = 64000000,
) {
  if (
    !dim ||
    dim.width < 1 ||
    dim.height < 1 ||
    dim.width * dim.height > maxPixels
  )
    throw new Error(
      "The image header is invalid or its dimensions are too large. Use a valid JPG, PNG or WebP within the pixel limit.",
    );
  return dim;
}
