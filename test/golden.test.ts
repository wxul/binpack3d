import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { pack } from '../src/packer.js';
import type { PackInput } from '../src/types.js';

const goldenUrl = new URL('./golden.json', import.meta.url);
const golden = JSON.parse(readFileSync(goldenUrl, 'utf8')) as {
  input: PackInput;
  expected: {
    fittedCount: number;
    unfitCount: number;
    utilizationApprox: number;
    items: { partno: string; position: [number, number, number]; rotationType: number }[];
  };
};

describe('golden parity with Python example', () => {
  const result = pack(golden.input);

  it('matches fitted count', () => {
    expect(result.bins[0].fittedItems.length).toBe(golden.expected.fittedCount);
  });

  it('matches unfit count', () => {
    expect(result.unfitItems.length).toBe(golden.expected.unfitCount);
  });

  it('matches utilization within 1%', () => {
    expect(Math.abs(result.bins[0].utilization - golden.expected.utilizationApprox)).toBeLessThan(0.01);
  });

  // Per-item position/rotation parity with the Python reference was removed
  // when bin.putItem moved from first-fit to a best-fit rotation picker —
  // we still place every reference item, but at different corners. The
  // high-level invariants above (fit-count, unfit-count, utilization) cover
  // externally-observable behavior.
  it('places every reference-fitted item', () => {
    for (const ex of golden.expected.items) {
      const got = result.bins[0].fittedItems.find((i) => i.partno === ex.partno);
      expect(got, `item ${ex.partno} not placed`).toBeDefined();
    }
  });
});
