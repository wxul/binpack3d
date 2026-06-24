# binpack3d

[English](./README.md) | [中文](./README.zh-CN.md)

[![npm version](https://img.shields.io/npm/v/binpack3d.svg)](https://www.npmjs.com/package/binpack3d)
[![CI](https://github.com/wxul/binpack3d/actions/workflows/ci.yml/badge.svg)](https://github.com/wxul/binpack3d/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

A practical 3D bin packing library for placing cuboid items into one or more containers, with support for rotation, weight limits, load-bearing, fragile items, binding groups, gravity settling, and stability checks. Written in TypeScript, ships ESM, zero runtime dependencies.

> **Origin:** this project is a TypeScript migration of the Python library [`py3dbp`](https://github.com/jerry800416/3D-bin-packing) (<https://github.com/jerry800416/3D-bin-packing>). The integer rotation codes and packing heuristic match upstream, so results are reproducible across the two implementations.

**[▶ Live demo](https://wxul.github.io/binpack3d/)** — interactive Three.js viewer with editable inputs and preset scenarios.

## Highlights

- Multi-bin packing with corner-point heuristic
- 6 axis-aligned rotations per item (or 2 upright via `updown: false`)
- Weight cap + per-item load-bearing
- Fragile / non-stackable items
- Binding groups (atomic placement)
- Gravity settle + stability check
- Distribute across bins or duplicate per bin
- Per-bin volume utilization + 4-quadrant weight balance
- In-bin obstacles: py3dbp-compatible `corner` cubes + generic AABB blockers for fixtures or chamfered ULDs (LD3 etc., built externally)
- TypeScript-first, ESM, zero runtime dependencies

Full per-symbol API: **[docs/api/](./docs/api/README.md)**.

## Installation

```bash
npm install binpack3d
```

Requires Node.js >= 18 (works in any modern bundler for the browser).

## Quick start

```ts
import { pack } from 'binpack3d';

const result = pack({
  bins: [
    { partno: 'box-A', whd: [40, 30, 30], maxWeight: 30 },
  ],
  items: [
    { partno: 'item-1', whd: [10, 10, 10], weight: 2 },
    { partno: 'item-2', whd: [20, 10, 15], weight: 3, fragile: true },
    { partno: 'item-3', whd: [15, 15, 10], weight: 5, loadbear: 50 },
  ],
  options: { biggerFirst: true, numberOfDecimals: 2 },
});

console.log(result.bins[0].fittedItems);   // PlacedItem[]
console.log(result.bins[0].utilization);   // 0..1
console.log(result.bins[0].gravity);       // [FL%, FR%, BL%, BR%]
console.log(result.unfitItems);            // items that didn't fit
```

For multi-bin / binding-group / restricted-rotation examples see [docs/api/pack.md](./docs/api/pack.md#examples).

## API at a glance

```ts
import {
  pack,                       // top-level packer
  Bin, Item,                  // low-level classes
  RotationType, Axis,         // enums
  type PackInput, type PackOptions, type PackResult,
  type BinInput, type BinResult,
  type ItemInput, type PlacedItem, type UnfitItem,
  type Vec3,
} from 'binpack3d';
```

| Symbol         | Doc                                                      |
| -------------- | -------------------------------------------------------- |
| `pack`         | [docs/api/pack.md](./docs/api/pack.md)                   |
| `Bin`          | [docs/api/Bin.md](./docs/api/Bin.md)                     |
| `Item`         | [docs/api/Item.md](./docs/api/Item.md)                   |
| `RotationType`, `Axis` | [docs/api/enums.md](./docs/api/enums.md)         |
| All types      | [docs/api/types.md](./docs/api/types.md)                 |

## Acknowledgements

- Core algorithm ported from [`py3dbp`](https://github.com/jerry800416/3D-bin-packing) (Python) — rotation codes, corner-point pivots, fragile/loadbear/group/stability rules.
- Best-fit rotation scoring (`fillW × fillH × fillD` with low-height tiebreaker) is borrowed from [`olragon/binpackingjs`](https://github.com/olragon/binpackingjs) — replaces the upstream first-fit picker for more stable results under input permutations and slightly better packing density.

## License

[MIT](./LICENSE) © Albert
