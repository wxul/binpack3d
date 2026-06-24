# API Reference

Per-symbol reference for everything exported from `binpack3d`.

| Symbol            | Kind     | Doc                          |
| ----------------- | -------- | ---------------------------- |
| `pack`            | function | [pack.md](./pack.md)         |
| `Bin`             | class    | [Bin.md](./Bin.md)           |
| `Item`            | class    | [Item.md](./Item.md)         |
| `RotationType`    | enum     | [enums.md](./enums.md#rotationtype) |
| `Axis`            | enum     | [enums.md](./enums.md#axis)  |
| `PackInput`       | type     | [types.md](./types.md#packinput)    |
| `PackOptions`     | type     | [types.md](./types.md#packoptions)  |
| `PackResult`      | type     | [types.md](./types.md#packresult)   |
| `BinInput`        | type     | [types.md](./types.md#bininput)     |
| `BinResult`       | type     | [types.md](./types.md#binresult)    |
| `ItemInput`       | type     | [types.md](./types.md#iteminput)    |
| `PlacedItem`      | type     | [types.md](./types.md#placeditem)   |
| `UnfitItem`       | type     | [types.md](./types.md#unfititem)    |
| `Vec3`            | type     | [types.md](./types.md#vec3)         |

## Module entry point

```ts
import {
  // runtime
  pack,
  Bin,
  Item,
  RotationType,
  Axis,
  // types (type-only)
  type PackInput,
  type PackOptions,
  type PackResult,
  type BinInput,
  type BinResult,
  type ItemInput,
  type PlacedItem,
  type UnfitItem,
  type Vec3,
} from 'binpack3d';
```

Everything is re-exported from `binpack3d`'s root. There are no deep imports.
