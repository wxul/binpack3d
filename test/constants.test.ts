import { describe, expect, it } from 'vitest';
import { ALL_AXES, ALL_ROTATIONS, Axis, NOTUPDOWN_ROTATIONS, RotationType } from '../src/constants.js';

describe('RotationType', () => {
  it("matches the Python library's integer values", () => {
    expect(RotationType.WHD).toBe(0);
    expect(RotationType.HWD).toBe(1);
    expect(RotationType.HDW).toBe(2);
    expect(RotationType.DHW).toBe(3);
    expect(RotationType.DWH).toBe(4);
    expect(RotationType.WDH).toBe(5);
  });

  it('ALL_ROTATIONS lists all 6', () => {
    expect(ALL_ROTATIONS).toHaveLength(6);
    expect([...ALL_ROTATIONS].sort()).toEqual([0, 1, 2, 3, 4, 5]);
  });

  // Intentional divergence from the Python reference. The original
  // NOTUPDOWN_ROTATIONS = [WHD, HWD] put H along Axis.HEIGHT in WHD but
  // along Axis.WIDTH in HWD — i.e. HWD actually flips the item on its
  // side. The two rotations that keep the item's H upright (the natural
  // meaning of "not updown") are WHD and DHW.
  it('NOTUPDOWN_ROTATIONS keeps H vertical (= [WHD, DHW])', () => {
    expect([...NOTUPDOWN_ROTATIONS]).toEqual([RotationType.WHD, RotationType.DHW]);
  });
});

describe('Axis', () => {
  it('matches Python library values', () => {
    expect(Axis.WIDTH).toBe(0);
    expect(Axis.HEIGHT).toBe(1);
    expect(Axis.DEPTH).toBe(2);
  });

  it('ALL_AXES lists all 3', () => {
    expect([...ALL_AXES].sort()).toEqual([0, 1, 2]);
  });
});
