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
