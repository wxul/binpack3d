# `Bin`

Low-level container class. Use [`pack()`](./pack.md) for normal cases; instantiate `Bin` directly when you need fine-grained control over placement or want to drive the heuristic yourself.

## Constructor

```ts
new Bin(input: BinInput, numberOfDecimals?: number)
```

| Param              | Type                                  | Default | Description                                            |
| ------------------ | ------------------------------------- | ------- | ------------------------------------------------------ |
| `input`            | [`BinInput`](./types.md#bininput)     | —       | Bin spec (whd, maxWeight, fixPoint, …)                 |
| `numberOfDecimals` | `number`                              | `2`     | Decimal places for internal integer scaling            |

All dimensions and `maxWeight` are stored multiplied by `10 ** numberOfDecimals` and rounded.

## Properties

| Name                  | Type                  | Description                                                              |
| --------------------- | --------------------- | ------------------------------------------------------------------------ |
| `partno`              | `string`              | Bin identifier from input.                                               |
| `whd`                 | [`Vec3`](./types.md#vec3) | `[width, height, depth]` in integer-scaled units.                    |
| `maxWeight`           | `number`              | Integer-scaled weight ceiling.                                           |
| `fixPoint`            | `boolean`             | Whether to gravity-settle on placement.                                  |
| `checkStable`         | `boolean`             | Whether to enforce the stability check.                                  |
| `supportSurfaceRatio` | `number`              | Minimum supported-area ratio for stability (when corners aren't all in). |
| `putType`             | `1 \| 2`              | Reserved.                                                                |
| `items`               | `Item[]`              | Items currently placed in this bin (mutated by `putItem`).               |
| `unfittedInBin`       | `Item[]`              | Reserved; currently unused.                                              |

## Methods

### `getVolume(): number`

Returns the bin's volume in integer-scaled units (`whd[0] * whd[1] * whd[2]`).

### `getTotalWeight(): number`

Returns the sum of `item.weight` over all currently-placed `items`, in integer-scaled units.

### `putItem(item: Item, pivot: Vec3): boolean`

Try to place `item` at `pivot` (integer-scaled position). Returns `true` on success and **mutates** `item` (`item.position` is set, `item.rotationType` may change) and pushes it into `this.items`. Returns `false` and leaves `item` unchanged on failure.

The method tries every allowed rotation for the item, runs the same gate checks on each one, and picks the **best-fit** rotation by score (not the first that passes). Checks in order, applied per rotation:

1. **Bin bounds** — rotated dims fit within `whd` from `pivot`.
2. **AABB overlap** — strict overlap test (touching faces is OK) against every item in `this.items`.
3. **Total weight cap** — `getTotalWeight() + item.weight ≤ maxWeight`.
4. **Fragile / nonStackable** — no fragile/nonStackable item whose top-face footprint vertically overlaps the new item's pivot footprint.
5. **Loadbear** — every item directly under the new item's footprint (where `placed.top === pivot.y`) must satisfy `placed.loadbear ≥ item.weight`.
6. **`fixPoint` settle** — if enabled, slide item toward `−H`, then `−W`, then `−D`, stopping at first contact.
7. **`checkStable`** — if enabled and `fixPoint` is on, reject placements that fail the stability rule.
8. **Score** — among rotations that pass all gates, compute:

   ```text
   fill_axis = floor(avail_axis / dim_axis) * dim_axis / avail_axis
   score     = fillW * fillH * fillD − settledHeight × 1e-9
   ```

   where `avail_axis = bin.whd[axis] - item.position[axis]`. The product (not sum) rewards rotations that tile cleanly across **all** three axes; the height term is a sub-epsilon tiebreaker favoring lower (gravity-stable) placements.

On success the rotation/position with the highest score is committed and the item is appended to `this.items`. If no rotation passes the gates, the item is left unchanged and the method returns `false`.

The rotation-score heuristic comes from [olragon/binpackingjs](https://github.com/olragon/binpackingjs); the rest of the placement pipeline follows [py3dbp](https://github.com/jerry800416/3D-bin-packing).

### `gravityCenter(): readonly [number, number, number, number]`

Returns weight percentages `[FL, FR, BL, BR]` in the horizontal `WIDTH × DEPTH` plane:

- **F**ront = low `WIDTH` half
- **B**ack = high `WIDTH` half
- **L**eft = low `DEPTH` half
- **R**ight = high `DEPTH` half

Weights are distributed by the fraction of each item's footprint that overlaps each quadrant. Sums to `~100` (within float rounding). Returns `[0, 0, 0, 0]` when the bin is empty.

## Example

```ts
import { Bin, Item } from 'binpack3d';

const bin = new Bin(
  { partno: 'B', whd: [100, 100, 100], maxWeight: 1000 },
  0, // 0 decimals — work in integer units
);

const a = new Item({ partno: 'A', whd: [50, 50, 50], weight: 10 }, 0);
bin.putItem(a, [0, 0, 0]);          // true

const b = new Item({ partno: 'B', whd: [50, 50, 50], weight: 10 }, 0);
bin.putItem(b, [50, 0, 0]);         // true — fits beside A

const c = new Item({ partno: 'C', whd: [50, 50, 50], weight: 10 }, 0);
bin.putItem(c, [10, 10, 10]);       // false — overlaps A

console.log(bin.items.length);      // 2
console.log(bin.getTotalWeight());  // 20
console.log(bin.gravityCenter());   // [25, 25, 25, 25] roughly
```

## Notes

- **Coordinate system.** `pivot` is the near-bottom-left corner the item is placed at; the item occupies `[pivot, pivot + dim]` along each axis. The bin's origin is `[0, 0, 0]` and its far-top-right corner is `whd`.
- **`fixPoint` may move the item** even after `putItem` returns. The position reflected back is the *settled* position, not the original `pivot`.
- **Stability requires `fixPoint`.** If `fixPoint` is false, `checkStable` is effectively skipped (the heuristic guards against running stability on un-settled items).

## See also

- [`Item`](./Item.md)
- [`pack()`](./pack.md) — uses `Bin` internally
- [`BinInput`](./types.md#bininput)
