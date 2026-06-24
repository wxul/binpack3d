import { describe, expect, it } from 'vitest';
import { Axis } from '../src/constants.js';
import { aabbOverlap, rectIntersect } from '../src/intersect.js';

describe('rectIntersect', () => {
  it('returns true when boxes overlap on WIDTH×DEPTH plane', () => {
    // Box A at origin (10×10×10), Box B at (5,0,5) (10×10×10) — they overlap
    expect(
      rectIntersect([0, 0, 0], [10, 10, 10], [5, 0, 5], [10, 10, 10], Axis.WIDTH, Axis.DEPTH),
    ).toBe(true);
  });

  it('returns false when boxes only touch (no strict overlap)', () => {
    // Touching at x=10 — Python returns false
    expect(
      rectIntersect([0, 0, 0], [10, 10, 10], [10, 0, 0], [10, 10, 10], Axis.WIDTH, Axis.DEPTH),
    ).toBe(false);
  });

  it('returns false when boxes are fully separated', () => {
    expect(
      rectIntersect([0, 0, 0], [10, 10, 10], [20, 0, 0], [10, 10, 10], Axis.WIDTH, Axis.DEPTH),
    ).toBe(false);
  });
});

describe('aabbOverlap', () => {
  it('requires overlap on all three axes', () => {
    expect(aabbOverlap([0, 0, 0], [10, 10, 10], [5, 5, 5], [10, 10, 10])).toBe(true);
    // overlap on W and H but not D
    expect(aabbOverlap([0, 0, 0], [10, 10, 10], [5, 5, 20], [10, 10, 10])).toBe(false);
  });
});
