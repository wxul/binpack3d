# Enums

## `RotationType`

Integer enum naming the 6 axis-aligned rotations of a cuboid. Values match the upstream Python [`py3dbp`](https://github.com/jerry800416/3D-bin-packing) library so results are reproducible across implementations.

```ts
enum RotationType {
  WHD = 0,
  HWD = 1,
  HDW = 2,
  DHW = 3,
  DWH = 4,
  WDH = 5,
}
```

| Member | Value | Effective `[w, h, d]` given base `[W, H, D]` | Notes                    |
| ------ | ----- | -------------------------------------------- | ------------------------ |
| `WHD`  | `0`   | `[W, H, D]`                                  | identity                 |
| `HWD`  | `1`   | `[H, W, D]`                                  | swap W ↔ H               |
| `HDW`  | `2`   | `[H, D, W]`                                  | upside-down              |
| `DHW`  | `3`   | `[D, H, W]`                                  | swap W ↔ D               |
| `DWH`  | `4`   | `[D, W, H]`                                  | upside-down              |
| `WDH`  | `5`   | `[W, D, H]`                                  | swap H ↔ D (lay on side) |

### Upright subset

When [`Item`](./Item.md) is constructed with `updown: false`, only the two rotations that keep the input `H` dimension along `Axis.HEIGHT` (index 1) are considered:

```ts
[RotationType.WHD, RotationType.DHW]
```

`WHD = [w, h, d]` and `DHW = [d, h, w]` both place `h` at index 1; the horizontal pair `(W, D)` may swap, but the item never tips on its side. (Note: the Python upstream uses `[WHD, HWD]` here, but `HWD = [h, w, d]` actually puts the input height along Axis.WIDTH — i.e. it tips the item. This library corrects that.)

### Example

```ts
import { Item, RotationType } from 'binpack3d';

const i = new Item({ partno: 'A', whd: [10, 20, 30], weight: 1 }, 0);

i.rotationType = RotationType.WDH;
i.getDimension();   // [10, 30, 20]
```

---

## `Axis`

Integer enum for the three spatial axes. Used as indices into [`Vec3`](./types.md#vec3) tuples — `vec[Axis.WIDTH]` is the same as `vec[0]`.

```ts
enum Axis {
  WIDTH  = 0,
  HEIGHT = 1,
  DEPTH  = 2,
}
```

| Member  | Value | Used as index for          |
| ------- | ----- | -------------------------- |
| `WIDTH` | `0`   | First component of `Vec3`  |
| `HEIGHT`| `1`   | Second component of `Vec3` |
| `DEPTH` | `2`   | Third component of `Vec3`  |

The library uses `HEIGHT` as the *gravity* axis: items settle along `−HEIGHT`, fragile items reject anything above on the `HEIGHT` axis, and the four gravity-quadrants are computed in the `WIDTH × DEPTH` plane.

### Example

```ts
import { Axis } from 'binpack3d';
import type { Vec3 } from 'binpack3d';

const pos: Vec3 = [3, 5, 7];
pos[Axis.HEIGHT];   // 5
```

## See also

- [`Item`](./Item.md) — uses `RotationType`
- [`Bin`](./Bin.md) — uses `Axis` internally for settle / fragile / stability checks
- [`Vec3`](./types.md#vec3)
