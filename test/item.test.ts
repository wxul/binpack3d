import { describe, expect, it } from 'vitest';
import { ALL_ROTATIONS, NOTUPDOWN_ROTATIONS, RotationType } from '../src/constants.js';
import { Item } from '../src/item.js';

describe('Item', () => {
  it('scales float dims into integer units by numberOfDecimals', () => {
    const it1 = new Item({ partno: 'A', whd: [1.23, 2.34, 3.45], weight: 5.6 }, 2);
    // 1.23 cm * 10^2 = 123 mm-equivalent integer
    expect(it1.getDimension()).toEqual([123, 234, 345]);
    expect(it1.weight).toBe(560);
  });

  it('rotates dimensions by RotationType', () => {
    const i = new Item({ partno: 'A', whd: [10, 20, 30], weight: 1 }, 0);

    i.rotationType = RotationType.WHD;
    expect(i.getDimension()).toEqual([10, 20, 30]);

    i.rotationType = RotationType.HWD;
    expect(i.getDimension()).toEqual([20, 10, 30]);

    i.rotationType = RotationType.HDW;
    expect(i.getDimension()).toEqual([20, 30, 10]);

    i.rotationType = RotationType.DHW;
    expect(i.getDimension()).toEqual([30, 20, 10]);

    i.rotationType = RotationType.DWH;
    expect(i.getDimension()).toEqual([30, 10, 20]);

    i.rotationType = RotationType.WDH;
    expect(i.getDimension()).toEqual([10, 30, 20]);
  });

  it('getVolume is independent of rotation', () => {
    const i = new Item({ partno: 'A', whd: [10, 20, 30], weight: 1 }, 0);
    const v0 = i.getVolume();
    i.rotationType = RotationType.DWH;
    expect(i.getVolume()).toBe(v0);
    expect(v0).toBe(6000);
  });

  it('getAllowedRotations respects updown flag', () => {
    const allowAll = new Item({ partno: 'A', whd: [1, 1, 1], weight: 1, updown: true }, 0);
    expect(allowAll.getAllowedRotations()).toEqual(ALL_ROTATIONS);

    const upright = new Item({ partno: 'B', whd: [1, 1, 1], weight: 1, updown: false }, 0);
    expect(upright.getAllowedRotations()).toEqual(NOTUPDOWN_ROTATIONS);
  });

  it('defaults: level=1, loadbear=100, updown=true, fragile=false, nonStackable=false', () => {
    const i = new Item({ partno: 'A', whd: [1, 1, 1], weight: 1 }, 0);
    expect(i.level).toBe(1);
    expect(i.loadbear).toBe(100);
    expect(i.updown).toBe(true);
    expect(i.fragile).toBe(false);
    expect(i.nonStackable).toBe(false);
  });

  it('name falls back to partno when omitted', () => {
    const i = new Item({ partno: 'ABC', whd: [1, 1, 1], weight: 1 }, 0);
    expect(i.name).toBe('ABC');
  });
});
