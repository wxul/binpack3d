# `Item`

Low-level cuboid class. Holds the unrotated base dimensions plus the current rotation/position state set by [`Bin#putItem`](./Bin.md#putitemitem-item-pivot-vec3-boolean).

## Constructor

```ts
new Item(input: ItemInput, numberOfDecimals?: number)
```

| Param              | Type                                  | Default | Description                                |
| ------------------ | ------------------------------------- | ------- | ------------------------------------------ |
| `input`            | [`ItemInput`](./types.md#iteminput)   | —       | Item spec (whd, weight, fragile, …)        |
| `numberOfDecimals` | `number`                              | `2`     | Decimal places for integer scaling         |

Stored values (`baseWhd`, `weight`, `loadbear`) are integer-scaled by `10 ** numberOfDecimals`.

## Properties

| Name           | Type                  | Description                                                       |
| -------------- | --------------------- | ----------------------------------------------------------------- |
| `partno`       | `string`              | Identifier from input.                                            |
| `name`         | `string`              | Display name; falls back to `partno` when omitted.                |
| `weight`       | `number`              | Integer-scaled.                                                   |
| `level`        | `number`              | Priority `1` (high) .. `3` (low). Default `1`.                    |
| `loadbear`     | `number`              | Integer-scaled. Max weight allowed on top. Default `100` pre-scale. |
| `updown`       | `boolean`             | Whether sideways/upside-down rotations are allowed. Default `true`. |
| `color`        | `string`              | Hex color hint. Default `'#888'`.                                 |
| `fragile`      | `boolean`             | Nothing may stack on top. Default `false`.                        |
| `nonStackable` | `boolean`             | Same effect as `fragile` (semantic split reserved).               |
| `group`        | `string \| undefined` | Binding key for atomic packing.                                   |
| `rotationType` | [`RotationType`](./enums.md#rotationtype) | Current rotation. Defaults to `WHD`.                |
| `position`     | [`Vec3`](./types.md#vec3) | Integer-scaled near-bottom-left corner. Defaults to `[0,0,0]`.|

The unrotated dimensions are stored internally (`baseWhd`) but are not exposed; use `getDimension()` to read the effective dimensions for the current rotation.

## Methods

### `getVolume(): number`

Returns the item's volume in integer-scaled units. Rotation-independent.

### `getDimension(): Vec3`

Returns `[width, height, depth]` after applying `rotationType`:

| `rotationType` | Returned `[w, h, d]`        |
| -------------- | --------------------------- |
| `WHD` (0)      | `[W, H, D]`                 |
| `HWD` (1)      | `[H, W, D]`                 |
| `HDW` (2)      | `[H, D, W]`                 |
| `DHW` (3)      | `[D, H, W]`                 |
| `DWH` (4)      | `[D, W, H]`                 |
| `WDH` (5)      | `[W, D, H]`                 |

### `getAllowedRotations(): readonly RotationType[]`

Returns the rotation set the packer will try for this item:

- `updown: true` → all 6 (`ALL_ROTATIONS`)
- `updown: false` → 2 upright orientations only: `[WHD, DHW]` (the two rotations that keep input `H` along `Axis.HEIGHT`)

## Example

```ts
import { Item, RotationType } from 'binpack3d';

const i = new Item({ partno: 'A', whd: [10, 20, 30], weight: 5 }, 0);

i.getDimension();        // [10, 20, 30]
i.rotationType = RotationType.DHW;
i.getDimension();        // [30, 20, 10]
i.getVolume();           // 6000  (rotation-independent)
```

### Restricting rotations

```ts
const upright = new Item({
  partno: 'fragile-box',
  whd: [40, 20, 30],
  weight: 2,
  updown: false,        // never tip onto side
}, 0);

upright.getAllowedRotations();   // [RotationType.WHD, RotationType.DHW]
```

## Notes

- **`position` and `rotationType` are mutable** and are set as a side effect of `Bin#putItem`. Outside the packer they default to `[0,0,0]` and `WHD`.
- **All numeric fields are integer-scaled** by `10 ** numberOfDecimals`. To convert back to your input units divide by `10 ** numberOfDecimals`.
- **`level` is *not* scaled** — it's used only for sort comparison and stays in its original integer form.

## See also

- [`Bin`](./Bin.md)
- [`ItemInput`](./types.md#iteminput)
- [`RotationType`](./enums.md#rotationtype)
