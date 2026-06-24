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
