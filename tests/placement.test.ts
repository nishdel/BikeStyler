import { describe, expect, it } from "vitest";
import { projectWheelPoint } from "../src/placement";

describe("photograph wheel projection", () => {
  it("places the axle at the measured hub without changing the rim boundary", () => {
    for (const radius of [42, 48]) {
      for (const [x, y] of [[0, 0], [9, 14], [-14, 8]]) {
        expect(projectWheelPoint(50, 50, x, y, radius)).toEqual({ x: 50 + x, y: 50 + y });
        for (let angle = 0; angle < Math.PI * 2; angle += 0.13) {
          const rim = projectWheelPoint(50 + radius * Math.cos(angle), 50 + radius * Math.sin(angle), x, y, radius);
          expect(Math.hypot(rim.x - 50, rim.y - 50)).toBeCloseTo(radius, 9);
        }
      }
    }
  });

  it("retains straight spokes and handles excessive offsets without singularities", () => {
    for (const [dx, dy] of [[12, -9], [500, 900]]) {
      const a = projectWheelPoint(52, 49, dx, dy);
      const b = projectWheelPoint(80, 77, dx, dy);
      const middle = projectWheelPoint(66, 63, dx, dy);
      expect((middle.x - a.x) * (b.y - a.y) - (middle.y - a.y) * (b.x - a.x)).toBeCloseTo(0, 9);
      for (let angle = 0; angle < 6.3; angle += 0.1) {
        const point = projectWheelPoint(50 + 48 * Math.cos(angle), 50 + 48 * Math.sin(angle), dx, dy);
        expect(Number.isFinite(point.x) && Number.isFinite(point.y)).toBe(true);
      }
    }
  });
});
