import { describe, expect, it } from 'vitest';
import { pack } from '../src/packer.js';

describe('pack — single bin', () => {
  it('fits a single item smaller than the bin', () => {
    const result = pack({
      bins: [{ partno: 'B', whd: [100, 100, 100], maxWeight: 1000 }],
      items: [{ partno: 'I', whd: [50, 50, 50], weight: 10 }],
      options: { numberOfDecimals: 0 },
    });
    expect(result.bins[0].fittedItems).toHaveLength(1);
    expect(result.unfitItems).toHaveLength(0);
    expect(result.bins[0].utilization).toBeGreaterThan(0);
  });

  it('reports unfit items with no_space when bin is full', () => {
    const result = pack({
      bins: [{ partno: 'B', whd: [10, 10, 10], maxWeight: 1000 }],
      items: [
        { partno: 'A', whd: [10, 10, 10], weight: 1 },
        { partno: 'B', whd: [10, 10, 10], weight: 1 },
      ],
      options: { numberOfDecimals: 0 },
    });
    expect(result.bins[0].fittedItems).toHaveLength(1);
    expect(result.unfitItems).toHaveLength(1);
    expect(result.unfitItems[0].reason).toBe('no_space');
  });

  it('reports weight_exceeded when cumulative weight (not the item alone) overflows', () => {
    // Bin maxWeight=10, two items each weight=6: the first fits (total=6),
    // the second is rejected by the weight gate (6+6 > 10). Neither item
    // alone exceeds maxWeight, but the cumulative-weight path should be
    // recognized and reported as weight_exceeded, not no_space.
    const result = pack({
      bins: [{ partno: 'B', whd: [100, 100, 100], maxWeight: 10 }],
      items: [
        { partno: 'A', whd: [10, 10, 10], weight: 6 },
        { partno: 'B', whd: [10, 10, 10], weight: 6 },
      ],
      options: { numberOfDecimals: 0 },
    });
    expect(result.bins[0].fittedItems).toHaveLength(1);
    expect(result.unfitItems).toHaveLength(1);
    expect(result.unfitItems[0].reason).toBe('weight_exceeded');
  });
});

describe('pack — multi-bin distribute', () => {
  it('distributes items across bins when distributeItems=true', () => {
    const result = pack({
      bins: [
        { partno: 'B1', whd: [50, 50, 50], maxWeight: 1000 },
        { partno: 'B2', whd: [50, 50, 50], maxWeight: 1000 },
      ],
      items: [
        { partno: 'A', whd: [50, 50, 50], weight: 1 },
        { partno: 'B', whd: [50, 50, 50], weight: 1 },
      ],
      options: { distributeItems: true, numberOfDecimals: 0 },
    });
    expect(result.bins[0].fittedItems.length + result.bins[1].fittedItems.length).toBe(2);
    expect(result.unfitItems).toHaveLength(0);
  });

  it('duplicates items into each bin when distributeItems=false', () => {
    const result = pack({
      bins: [
        { partno: 'B1', whd: [100, 100, 100], maxWeight: 1000 },
        { partno: 'B2', whd: [100, 100, 100], maxWeight: 1000 },
      ],
      items: [{ partno: 'X', whd: [50, 50, 50], weight: 1 }],
      options: { distributeItems: false, numberOfDecimals: 0 },
    });
    expect(result.bins[0].fittedItems).toHaveLength(1);
    expect(result.bins[1].fittedItems).toHaveLength(1);
  });
});

describe('pack — binding', () => {
  it('keeps grouped items in the same bin or rejects all', () => {
    const result = pack({
      bins: [
        { partno: 'B1', whd: [60, 60, 60], maxWeight: 1000 },
        { partno: 'B2', whd: [60, 60, 60], maxWeight: 1000 },
      ],
      items: [
        { partno: 'G1A', whd: [50, 50, 50], weight: 1, group: 'g1' },
        { partno: 'G1B', whd: [50, 50, 50], weight: 1, group: 'g1' }, // doesn't fit with G1A in same bin
      ],
      options: { distributeItems: true, numberOfDecimals: 0 },
    });
    // Both must be unfit (binding broken) since they can't co-locate
    expect(result.unfitItems).toHaveLength(2);
    expect(result.unfitItems.every((u) => u.reason === 'binding_broken')).toBe(true);
  });
});

describe('pack — corner & obstacles', () => {
  it('corner=0 default leaves results unchanged', () => {
    const baseline = pack({
      bins: [{ partno: 'B', whd: [50, 50, 50], maxWeight: 1000 }],
      items: [{ partno: 'A', whd: [50, 50, 50], weight: 1 }],
      options: { numberOfDecimals: 0 },
    });
    expect(baseline.bins[0].fittedItems).toHaveLength(1);
    expect(baseline.bins[0].utilization).toBe(1);
  });

  it('excludes corner cubes from fittedItems and utilization', () => {
    const result = pack({
      bins: [{ partno: 'B', whd: [100, 100, 100], maxWeight: 1000, corner: 10 }],
      items: [{ partno: 'A', whd: [50, 50, 50], weight: 1 }],
      options: { numberOfDecimals: 0 },
    });
    // No corner cubes in output.
    expect(result.bins[0].fittedItems).toHaveLength(1);
    expect(result.bins[0].fittedItems[0].partno).toBe('A');
    // Utilization should be 50³ / 100³ = 0.125, NOT inflated by 8×10³ corner volume.
    expect(result.bins[0].utilization).toBeCloseTo(0.125, 5);
  });

  it('first real item still tries origin when (0,0,0) is free of obstacles', () => {
    // Obstacle far from origin — first item must still place at (0,0,0).
    const result = pack({
      bins: [
        {
          partno: 'B',
          whd: [100, 100, 100],
          maxWeight: 1000,
          obstacles: [{ position: [80, 0, 80], whd: [20, 20, 20] }],
        },
      ],
      items: [{ partno: 'A', whd: [50, 50, 50], weight: 1 }],
      options: { numberOfDecimals: 0 },
    });
    expect(result.bins[0].fittedItems).toHaveLength(1);
    expect(result.bins[0].fittedItems[0].position).toEqual([0, 0, 0]);
  });

  it('LD3-style stair-step obstacle approximates a chamfer', () => {
    // Build a 10-step stair along the bottom-back-low-D edge of a 100×100×100 bin.
    // Each step is 10×10×10 starting at (0, step*10, 0), extending into +W.
    // (Crude triangular prism approximation — for test, just verify items pack
    // around it.)
    const obstacles = Array.from({ length: 10 }, (_, i) => ({
      position: [0, i * 10, 0] as const,
      whd: [(10 - i) * 10, 10, 30] as const,
    }));
    const result = pack({
      bins: [{ partno: 'LD3-ish', whd: [100, 100, 100], maxWeight: 1000, obstacles }],
      items: Array.from({ length: 5 }, (_, i) => ({
        partno: `cargo-${i}`,
        whd: [30, 30, 30] as const,
        weight: 1,
      })),
      options: { numberOfDecimals: 0 },
    });
    // Some cargo must fit, none may overlap obstacles.
    expect(result.bins[0].fittedItems.length).toBeGreaterThan(0);
    for (const item of result.bins[0].fittedItems) {
      // Footprint must not poke into the obstacle column (x < 100 - stairWidth at this height)
      for (const o of obstacles) {
        const ox0 = o.position[0], ox1 = ox0 + o.whd[0];
        const oy0 = o.position[1], oy1 = oy0 + o.whd[1];
        const oz0 = o.position[2], oz1 = oz0 + o.whd[2];
        const ix0 = item.position[0], ix1 = ix0 + item.rotatedWhd[0];
        const iy0 = item.position[1], iy1 = iy0 + item.rotatedWhd[1];
        const iz0 = item.position[2], iz1 = iz0 + item.rotatedWhd[2];
        const overlap =
          ix0 < ox1 && ix1 > ox0 &&
          iy0 < oy1 && iy1 > oy0 &&
          iz0 < oz1 && iz1 > oz0;
        expect(overlap).toBe(false);
      }
    }
  });
});

describe('pack — load order', () => {
  it('assigns loadOrder 1..N in placement order', () => {
    const result = pack({
      bins: [{ partno: 'B', whd: [200, 50, 50], maxWeight: 1000 }],
      items: [
        { partno: 'A', whd: [50, 50, 50], weight: 1 },
        { partno: 'B', whd: [50, 50, 50], weight: 1 },
        { partno: 'C', whd: [50, 50, 50], weight: 1 },
      ],
      options: { numberOfDecimals: 0 },
    });
    const orders = result.bins[0].fittedItems.map((i) => i.loadOrder).sort();
    expect(orders).toEqual([1, 2, 3]);
  });
});
