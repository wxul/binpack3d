# Types

All exported types. Imported with the `type` keyword:

```ts
import type {
  PackInput, PackOptions, PackResult,
  BinInput, BinResult, ItemInput, ObstacleInput, PlacedItem, UnfitItem,
  Vec3,
} from 'binpack3d';
```

---

## `Vec3`

```ts
type Vec3 = readonly [number, number, number];
```

A fixed-length 3-tuple of numbers. Used for sizes (`[width, height, depth]`) and positions (`[x, y, z]`). Index with [`Axis`](./enums.md#axis): `vec[Axis.WIDTH]` is `vec[0]`.

`readonly` means tuples returned from the library cannot be mutated in place. Construct fresh `Vec3` values when you need to modify one.

---

## `ItemInput`

```ts
interface ItemInput {
  partno: string;
  name?: string;
  whd: Vec3;
  weight: number;
  level?: number;
  loadbear?: number;
  updown?: boolean;
  color?: string;
  fragile?: boolean;
  nonStackable?: boolean;
  group?: string;
}
```

| Field          | Required | Default      | Description                                                                              |
| -------------- | -------- | ------------ | ---------------------------------------------------------------------------------------- |
| `partno`       | ✓        | —            | Stable identifier. Echoed in output.                                                     |
| `name`         |          | `partno`     | Display name. Echoed in `PlacedItem.name` and `UnfitItem.name`.                          |
| `whd`          | ✓        | —            | `[width, height, depth]`. Same unit as your bins.                                        |
| `weight`       | ✓        | —            | Item weight. Same unit as `BinInput.maxWeight`.                                          |
| `level`        |          | `1`          | Priority `1` (highest) .. `3` (lowest). Tiebreaker after volume and `loadbear` in sort.  |
| `loadbear`     |          | `100`        | Max weight allowed stacked on top of this item.                                          |
| `updown`       |          | `true`       | If `false`, only upright rotations are tried (item never lies on its side).              |
| `color`        |          | `'#888'`     | Hex color hint for visualizers. Not used by the algorithm.                               |
| `fragile`      |          | `false`      | Nothing may stack on top.                                                                |
| `nonStackable` |          | `false`      | Same effect as `fragile` in this version. Reserved for future semantic split.            |
| `group`        |          | —            | Binding key — items sharing a `group` value must end up in the same bin or all rejected. |

---

## `BinInput`

```ts
interface BinInput {
  partno: string;
  whd: Vec3;
  maxWeight: number;
  fixPoint?: boolean;
  checkStable?: boolean;
  supportSurfaceRatio?: number;
  putType?: 1 | 2;
  corner?: number;
  obstacles?: ObstacleInput[];
}
```

| Field                 | Required | Default | Description                                                                              |
| --------------------- | -------- | ------- | ---------------------------------------------------------------------------------------- |
| `partno`              | ✓        | —       | Bin identifier. Echoed in `BinResult.partno`.                                            |
| `whd`                 | ✓        | —       | `[width, height, depth]`.                                                                |
| `maxWeight`           | ✓        | —       | Total weight ceiling. Enforced against the sum of all `item.weight` in the bin.          |
| `fixPoint`            |          | `true`  | Settle items toward the floor (eliminate floating).                                      |
| `checkStable`         |          | `true`  | Reject placements lacking 4-corner support or `supportSurfaceRatio` of supported area.   |
| `supportSurfaceRatio` |          | `0.75`  | Stability threshold (0..1) when corners aren't all supported.                            |
| `putType`             |          | `1`     | Reserved — future open-top container behavior. Not currently consulted by the algorithm. |
| `corner`              |          | `0`     | py3dbp-compatible shorthand. Place a `corner × corner × corner` cube at each of the bin's 8 vertices before packing. Must satisfy `corner*2 ≤ min(whd)`. `0` disables. |
| `obstacles`           |          | `[]`    | Extra user-defined AABB blockers (see [`ObstacleInput`](#obstacleinput)). Combined with `corner`-derived cubes; pairwise non-overlap is enforced. |

---

## `ObstacleInput`

```ts
interface ObstacleInput {
  position: Vec3;
  whd: Vec3;
}
```

Axis-aligned solid block injected into the bin before packing. Real items must not overlap it. Excluded from `BinResult.fittedItems` and from `utilization` volume.

| Field      | Required | Description                                                                                  |
| ---------- | -------- | -------------------------------------------------------------------------------------------- |
| `position` | ✓        | Near-bottom-left corner inside the bin (same units as `BinInput.whd`).                       |
| `whd`      | ✓        | `[width, height, depth]`. All > 0. The obstacle must fit entirely inside the bin.            |

Validation runs at `Bin` construction. Throws on out-of-bounds, non-positive dimension, or any AABB overlap with another obstacle or with a `corner`-derived cube.

This is the only obstacle primitive the library exposes — no container presets ship in-tree. Build chamfered ULDs (LD3 etc.), wheel wells, or posts by generating a list of AABBs that approximate the geometry (a stair-step is a good way to model a flat diagonal cut with AABB-only collision).

---

## `PackOptions`

```ts
interface PackOptions {
  biggerFirst?: boolean;
  distributeItems?: boolean;
  numberOfDecimals?: number;
}
```

| Field              | Default | Description                                                                                  |
| ------------------ | ------- | -------------------------------------------------------------------------------------------- |
| `biggerFirst`      | `true`  | Sort bins by volume descending before packing.                                               |
| `distributeItems`  | `false` | Distribute ungrouped items across bins. When `false`, the same item list is tried in each bin (the same item may be reported in multiple bins). |
| `numberOfDecimals` | `2`     | Decimal places of precision for internal integer scaling.                                    |

---

## `PackInput`

```ts
interface PackInput {
  bins: BinInput[];
  items: ItemInput[];
  options?: PackOptions;
}
```

Top-level argument to [`pack()`](./pack.md).

| Field     | Required | Default | Description                |
| --------- | -------- | ------- | -------------------------- |
| `bins`    | ✓        | —       | At least one bin required. |
| `items`   | ✓        | —       | Can be empty.              |
| `options` |          | `{}`    | See `PackOptions` above.   |

---

## `PlacedItem`

```ts
interface PlacedItem {
  partno: string;
  name: string;
  position: Vec3;
  rotatedWhd: Vec3;
  rotationType: RotationType;
  weight: number;
  color: string;
  fragile: boolean;
  nonStackable: boolean;
  loadOrder: number;
}
```

| Field          | Description                                                                                  |
| -------------- | -------------------------------------------------------------------------------------------- |
| `partno`       | Echo of `ItemInput.partno`.                                                                  |
| `name`         | Echo of `ItemInput.name` (or `partno` if not provided).                                      |
| `position`     | Near-bottom-left corner in the bin, in original input units.                                 |
| `rotatedWhd`   | Effective `[width, height, depth]` after applying `rotationType`, in original input units.   |
| `rotationType` | One of [`RotationType`](./enums.md#rotationtype).                                            |
| `weight`       | In original input units.                                                                     |
| `color`        | Echo of `ItemInput.color` (or `'#888'`).                                                     |
| `fragile`      | Echo.                                                                                        |
| `nonStackable` | Echo.                                                                                        |
| `loadOrder`    | 1-based placement order within this bin. Not a load-order constraint — purely informational. |

---

## `BinResult`

```ts
interface BinResult {
  partno: string;
  whd: Vec3;
  maxWeight: number;
  fittedItems: PlacedItem[];
  totalWeight: number;
  utilization: number;
  gravity: readonly [number, number, number, number];
}
```

| Field         | Description                                                                                      |
| ------------- | ------------------------------------------------------------------------------------------------ |
| `partno`      | Echo of `BinInput.partno`.                                                                       |
| `whd`         | Echo of `BinInput.whd`.                                                                          |
| `maxWeight`   | Echo of `BinInput.maxWeight`.                                                                    |
| `fittedItems` | Items placed in this bin. Sorted by placement order (matches `loadOrder` ascending).             |
| `totalWeight` | Sum of `fittedItems[*].weight`.                                                                  |
| `utilization` | Volume fill ratio `0..1`. `0` for empty bins or zero-volume bins.                                |
| `gravity`     | Weight % across the 4 horizontal quadrants: `[FrontLeft, FrontRight, BackLeft, BackRight]`. Sums to ~100 when bin is non-empty. `[0,0,0,0]` for an empty bin. F=low W half, L=low D half. |

---

## `UnfitItem`

```ts
interface UnfitItem {
  partno: string;
  name: string;
  reason: 'no_space' | 'weight_exceeded' | 'binding_broken';
}
```

| `reason`            | When                                                                                                |
| ------------------- | --------------------------------------------------------------------------------------------------- |
| `no_space`          | The item couldn't be placed anywhere in any bin given current contents.                             |
| `weight_exceeded`   | Either the item's weight alone exceeds the first bin's (post-sort) `maxWeight`, **or** `bin.totalWeight + item.weight` would exceed `maxWeight`. |
| `binding_broken`    | The item is part of a `group` and the group couldn't fit atomically into any bin.                   |

> ⚠️ `weight_exceeded` is inferred against `bins[0]` (the first bin after sorting). With heterogeneous bins this categorization may be misleading.

---

## `PackResult`

```ts
interface PackResult {
  bins: BinResult[];
  unfitItems: UnfitItem[];
}
```

Top-level return type from [`pack()`](./pack.md).

| Field        | Description                                                                                                       |
| ------------ | ----------------------------------------------------------------------------------------------------------------- |
| `bins`       | One entry per input bin, in the same order *after* the bin-sort step (see `PackOptions.biggerFirst`).             |
| `unfitItems` | Items that could not be placed. Each appears at most once per group (for `binding_broken`) or once total otherwise. |

## See also

- [`pack`](./pack.md)
- [`Bin`](./Bin.md), [`Item`](./Item.md)
- [`RotationType`, `Axis`](./enums.md)
