import { describe, expect, it } from 'vitest';
import { Bin } from '../src/bin.js';
import { Item } from '../src/item.js';

const D = 0; // 0 decimals for easy reasoning

describe('Bin basic placement', () => {
  it('places a single item that fits at the origin', () => {
    const bin = new Bin({ partno: 'B', whd: [100, 100, 100], maxWeight: 1000 }, D);
    const item = new Item({ partno: 'I', whd: [50, 50, 50], weight: 100 }, D);
    expect(bin.putItem(item, [0, 0, 0])).toBe(true);
    expect(bin.items).toHaveLength(1);
    expect(item.position).toEqual([0, 0, 0]);
  });

  it('rejects items that exceed bin dimensions in every rotation', () => {
    const bin = new Bin({ partno: 'B', whd: [10, 10, 10], maxWeight: 1000 }, D);
    const item = new Item({ partno: 'I', whd: [50, 50, 50], weight: 1 }, D);
    expect(bin.putItem(item, [0, 0, 0])).toBe(false);
    expect(bin.items).toHaveLength(0);
  });

  it('rejects items that exceed maxWeight', () => {
    const bin = new Bin({ partno: 'B', whd: [100, 100, 100], maxWeight: 100 }, D);
    const a = new Item({ partno: 'A', whd: [10, 10, 10], weight: 80 }, D);
    const b = new Item({ partno: 'B', whd: [10, 10, 10], weight: 30 }, D);
    expect(bin.putItem(a, [0, 0, 0])).toBe(true);
    expect(bin.putItem(b, [20, 0, 0])).toBe(false);
  });

  it('rejects overlap with already placed item', () => {
    const bin = new Bin({ partno: 'B', whd: [100, 100, 100], maxWeight: 1000 }, D);
    bin.putItem(new Item({ partno: 'A', whd: [50, 50, 50], weight: 1 }, D), [0, 0, 0]);
    const b = new Item({ partno: 'B', whd: [50, 50, 50], weight: 1 }, D);
    expect(bin.putItem(b, [10, 10, 10])).toBe(false); // overlaps A
    expect(bin.putItem(b, [50, 0, 0])).toBe(true);    // fits beside A
  });
});

describe('Bin fragile / nonStackable', () => {
  it('forbids stacking on top of a fragile item', () => {
    const bin = new Bin({ partno: 'B', whd: [100, 100, 100], maxWeight: 1000 }, D);
    const glass = new Item({ partno: 'G', whd: [50, 20, 50], weight: 10, fragile: true }, D);
    bin.putItem(glass, [0, 0, 0]); // sits at y=0..20

    const top = new Item({ partno: 'T', whd: [50, 20, 50], weight: 10 }, D);
    expect(bin.putItem(top, [0, 20, 0])).toBe(false); // directly on top

    const beside = new Item({ partno: 'S', whd: [50, 20, 50], weight: 10 }, D);
    expect(bin.putItem(beside, [50, 0, 0])).toBe(true); // beside, not on top
  });

  it('nonStackable behaves the same as fragile for this check', () => {
    const bin = new Bin({ partno: 'B', whd: [100, 100, 100], maxWeight: 1000 }, D);
    const ns = new Item({ partno: 'N', whd: [50, 20, 50], weight: 10, nonStackable: true }, D);
    bin.putItem(ns, [0, 0, 0]);

    const top = new Item({ partno: 'T', whd: [50, 20, 50], weight: 10 }, D);
    expect(bin.putItem(top, [0, 20, 0])).toBe(false);
  });
});

describe('Bin fixPoint', () => {
  it('drops a floating item onto the floor when fixPoint=true', () => {
    const bin = new Bin({ partno: 'B', whd: [100, 100, 100], maxWeight: 1000, fixPoint: true, checkStable: false }, D);
    const item = new Item({ partno: 'I', whd: [50, 50, 50], weight: 10 }, D);
    bin.putItem(item, [0, 30, 0]); // pivot Y=30, but floor is empty
    expect(item.position[1]).toBe(0); // pulled down to floor
  });
});

describe('Bin corner', () => {
  it('does not inject anything when corner=0 (default)', () => {
    const bin = new Bin({ partno: 'B', whd: [100, 100, 100], maxWeight: 1000 }, D);
    bin.injectObstacles();
    expect(bin.items).toHaveLength(0);
  });

  it('injects 8 corner cubes at the 8 bin vertices when corner>0', () => {
    const bin = new Bin({ partno: 'B', whd: [100, 100, 100], maxWeight: 1000, corner: 10 }, D);
    bin.injectObstacles();
    expect(bin.items).toHaveLength(8);
    expect(bin.items.every((it) => it.isObstacle)).toBe(true);
    // Every obstacle's AABB must lie at a bin vertex
    const vertices = new Set([
      [0, 0, 0], [0, 0, 90], [0, 90, 0], [0, 90, 90],
      [90, 0, 0], [90, 0, 90], [90, 90, 0], [90, 90, 90],
    ].map((v) => v.join(',')));
    for (const it of bin.items) {
      expect(vertices.has(it.position.join(','))).toBe(true);
      expect(it.getDimension()).toEqual([10, 10, 10]);
      expect(it.weight).toBe(0);
    }
  });

  it('injectObstacles is idempotent', () => {
    const bin = new Bin({ partno: 'B', whd: [100, 100, 100], maxWeight: 1000, corner: 5 }, D);
    bin.injectObstacles();
    bin.injectObstacles();
    bin.injectObstacles();
    expect(bin.items).toHaveLength(8);
  });

  it('blocks items from occupying corner cube positions', () => {
    const bin = new Bin({ partno: 'B', whd: [100, 100, 100], maxWeight: 1000, corner: 10 }, D);
    bin.injectObstacles();
    const item = new Item({ partno: 'I', whd: [10, 10, 10], weight: 1 }, D);
    // (0,0,0) is occupied by a corner cube — direct placement must fail.
    expect(bin.putItem(item, [0, 0, 0])).toBe(false);
    // But it fits flush against the (0,0,0) cube on the +W face.
    expect(bin.putItem(item, [10, 0, 0])).toBe(true);
  });

  it('throws when corner is negative', () => {
    expect(
      () => new Bin({ partno: 'B', whd: [100, 100, 100], maxWeight: 1000, corner: -1 }, D),
    ).toThrow(/corner/);
  });

  it('throws when corner*2 exceeds smallest dimension', () => {
    expect(
      () => new Bin({ partno: 'B', whd: [100, 100, 50], maxWeight: 1000, corner: 26 }, D),
    ).toThrow(/corner/);
  });

  it('allows corner*2 == smallest dimension (cubes touch faces)', () => {
    // Touching faces are not overlap — should succeed.
    expect(
      () => new Bin({ partno: 'B', whd: [100, 100, 50], maxWeight: 1000, corner: 25 }, D),
    ).not.toThrow();
  });
});

describe('Bin obstacles', () => {
  it('injects user-defined obstacles', () => {
    const bin = new Bin(
      {
        partno: 'B',
        whd: [100, 100, 100],
        maxWeight: 1000,
        obstacles: [{ position: [40, 0, 40], whd: [20, 20, 20] }],
      },
      D,
    );
    bin.injectObstacles();
    expect(bin.items).toHaveLength(1);
    expect(bin.items[0].isObstacle).toBe(true);
    expect(bin.items[0].position).toEqual([40, 0, 40]);
    expect(bin.items[0].getDimension()).toEqual([20, 20, 20]);
  });

  it('blocks items that would overlap an obstacle', () => {
    const bin = new Bin(
      {
        partno: 'B',
        whd: [100, 100, 100],
        maxWeight: 1000,
        obstacles: [{ position: [40, 0, 40], whd: [20, 20, 20] }],
      },
      D,
    );
    bin.injectObstacles();
    const item = new Item(
      { partno: 'I', whd: [30, 30, 30], weight: 1 },
      D,
    );
    // (35, 0, 35)..(65, 30, 65) overlaps the obstacle (40,0,40)..(60,20,60)
    expect(
      bin.putItem(
        new Item({ partno: 'X', whd: [30, 30, 30], weight: 1 }, D),
        [35, 0, 35],
      ),
    ).toBe(false);
    // Adjacent placement should succeed.
    expect(bin.putItem(item, [0, 0, 0])).toBe(true);
  });

  it('throws when an obstacle extends outside the bin', () => {
    expect(
      () =>
        new Bin(
          {
            partno: 'B',
            whd: [100, 100, 100],
            maxWeight: 1000,
            obstacles: [{ position: [90, 0, 0], whd: [20, 10, 10] }],
          },
          D,
        ),
    ).toThrow(/outside bin bounds/);
  });

  it('throws on non-positive obstacle dimensions', () => {
    expect(
      () =>
        new Bin(
          {
            partno: 'B',
            whd: [100, 100, 100],
            maxWeight: 1000,
            obstacles: [{ position: [0, 0, 0], whd: [0, 10, 10] }],
          },
          D,
        ),
    ).toThrow(/non-positive/);
  });

  it('throws when two obstacles overlap', () => {
    expect(
      () =>
        new Bin(
          {
            partno: 'B',
            whd: [100, 100, 100],
            maxWeight: 1000,
            obstacles: [
              { position: [10, 10, 10], whd: [20, 20, 20] },
              { position: [20, 20, 20], whd: [20, 20, 20] },
            ],
          },
          D,
        ),
    ).toThrow(/overlap/);
  });

  it('throws when a user obstacle overlaps an injected corner cube', () => {
    expect(
      () =>
        new Bin(
          {
            partno: 'B',
            whd: [100, 100, 100],
            maxWeight: 1000,
            corner: 10,
            obstacles: [{ position: [0, 0, 0], whd: [5, 5, 5] }],
          },
          D,
        ),
    ).toThrow(/overlap/);
  });
});

describe('Bin stability', () => {
  it('obstacles do not count as supports — items cannot rest on a chamfer/corner', () => {
    // 100×100×100 bin, single obstacle at (0,0,0)..(50,50,50) acting like
    // a chamfer block. With obstacles excluded from supports, an item
    // placed directly on top with no real cargo below must fail stability.
    const bin = new Bin(
      {
        partno: 'B',
        whd: [100, 100, 100],
        maxWeight: 1000,
        obstacles: [{ position: [0, 0, 0], whd: [50, 50, 50] }],
      },
      D,
    );
    bin.injectObstacles();
    // Item exactly on top of the obstacle: footprint fully covered by the
    // obstacle's top face, but obstacle is excluded from supports → no
    // real support → stability check rejects.
    const item = new Item({ partno: 'I', whd: [50, 10, 50], weight: 5 }, D);
    expect(bin.putItem(item, [0, 50, 0])).toBe(false);
  });

  it('balanced overhang on a narrower support is rejected (area ratio below threshold)', () => {
    // Real boxes don't have their mass at the geometric center, so we don't
    // trust a centroid-over-support check. Stability falls back to area
    // ratio once the 4-corner check fails.
    const bin = new Bin({ partno: 'B', whd: [200, 200, 100], maxWeight: 1000 }, D);
    bin.putItem(
      new Item({ partno: 'base', whd: [120, 80, 100], weight: 50, updown: false }, D),
      [0, 0, 0],
    );
    // Lid 180 wide: 4-corner fails (extends X=0..180, base only 0..120).
    // Area ratio = 120/180 = 67% < 75% → rejected.
    const top = new Item({ partno: 'top', whd: [180, 40, 100], weight: 30, updown: false }, D);
    expect(bin.putItem(top, [0, 80, 0])).toBe(false);
  });

  it('overhang far past the support fails stability', () => {
    const bin = new Bin({ partno: 'B', whd: [200, 200, 100], maxWeight: 1000 }, D);
    bin.putItem(
      new Item({ partno: 'base', whd: [60, 80, 100], weight: 50, updown: false }, D),
      [0, 0, 0],
    );
    // Lid 180 wide. Area = 60/180 = 33% < 75%. 4-corner also fails.
    const top = new Item({ partno: 'top', whd: [180, 40, 100], weight: 30, updown: false }, D);
    expect(bin.putItem(top, [0, 80, 0])).toBe(false);
  });
});

describe('Bin gravityCenter', () => {
  it('returns equal quadrants when one centered item is placed', () => {
    const bin = new Bin({ partno: 'B', whd: [100, 100, 100], maxWeight: 1000 }, D);
    bin.putItem(new Item({ partno: 'I', whd: [100, 50, 100], weight: 40 }, D), [0, 0, 0]);
    const g = bin.gravityCenter();
    // The single item spans both halves on W and D evenly → 25/25/25/25
    expect(g.map((n) => Math.round(n))).toEqual([25, 25, 25, 25]);
  });

  it('concentrates weight in one quadrant when item is in a corner', () => {
    const bin = new Bin({ partno: 'B', whd: [100, 100, 100], maxWeight: 1000 }, D);
    bin.putItem(new Item({ partno: 'I', whd: [40, 40, 40], weight: 100 }, D), [0, 0, 0]);
    const g = bin.gravityCenter();
    // Item at (0..40, 0..40, 0..40) → entirely in front-left quadrant
    expect(g[0]).toBeGreaterThan(99);
  });
});
