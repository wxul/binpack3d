# `pack(input)`

The top-level entry point. Packs a list of items into a list of bins and returns the placements plus anything that didn't fit.

## Signature

```ts
function pack(input: PackInput): PackResult
```

- [`PackInput`](./types.md#packinput)
- [`PackResult`](./types.md#packresult)

## Behavior

1. Build `Bin` and `Item` instances from `input.bins` / `input.items`, scaling all dimensions by `10 ** numberOfDecimals` into integers (default precision 2 decimals).
2. Sort bins:
   - `biggerFirst: true` (default) → bin volume descending
   - `biggerFirst: false` → ascending
3. Sort items by `(volume desc, loadbear desc, level asc)`.
4. Partition items into **groups** (those with a `group` key) and **ungrouped**.
5. For each bin in order:
   - For each group, snapshot the bin, attempt to pack every member; on any partial failure revert the bin and let the next bin try.
   - Then attempt to pack ungrouped items into the bin using the corner-point heuristic.
   - If `distributeItems: true`, ungrouped items that landed in this bin are removed from the candidate pool; otherwise the same list is offered to the next bin (allowing the same item to appear in multiple bins).
6. Build `BinResult` per bin (echoing dims back to original units), and `UnfitItem` entries for every group / ungrouped item that never landed.

The algorithm is a single deterministic greedy pass — same input always produces the same output. No backtracking, no retries with reordering.

## Placement heuristic (per item, per bin)

```text
if bin is empty:
    try (0, 0, 0)
else:
    for each already-placed item P (in placement order):
        for each axis in [WIDTH, HEIGHT, DEPTH]:
            pivot = P.position shifted by P's dimension along that axis

            best = null
            for each allowed rotation of the new item:
                if rotation fits bin bounds
                   AND no AABB overlap with placed items
                   AND total weight + this weight ≤ bin.maxWeight
                   AND no fragile/nonStackable item below the footprint
                   AND every supporting item satisfies loadbear ≥ this weight:
                    optionally settle (slide -H, -W, -D until contact)
                    optionally check stability
                    score = fillW * fillH * fillD - settledHeight * 1e-9
                    if score > best.score: best = (rotation, settled position, score)

            if best is not null:
                commit best and stop searching pivots
```

**First accepted *pivot* wins**, but within that pivot the *rotation* is chosen by score, not in iteration order. Score is the product of per-axis grid fill ratios (`floor(avail/dim) * dim / avail`); the tiny height term breaks ties in favor of lower placements. No scoring is performed across different pivots.

## Unit handling

All input dimensions and weights are floats in whatever unit you choose (commonly cm and kg). Internally each value is multiplied by `10 ** numberOfDecimals` and rounded; output values divide back. Use `numberOfDecimals: 0` if your inputs are already integers — this skips the scaling and makes positions easier to reason about in tests.

## Examples

### Single bin

```ts
import { pack } from 'binpack3d';

const result = pack({
  bins: [{ partno: 'A', whd: [40, 30, 30], maxWeight: 30 }],
  items: [
    { partno: 'i1', whd: [10, 10, 10], weight: 2 },
    { partno: 'i2', whd: [20, 10, 15], weight: 3 },
  ],
});

result.bins[0].fittedItems;     // PlacedItem[]
result.bins[0].utilization;     // 0..1
result.unfitItems;              // []
```

### Multi-bin distribute

```ts
const result = pack({
  bins: [
    { partno: 'S', whd: [30, 30, 30], maxWeight: 20 },
    { partno: 'L', whd: [60, 50, 40], maxWeight: 80 },
  ],
  items: [
    { partno: 'a', whd: [25, 25, 25], weight: 5 },
    { partno: 'b', whd: [40, 30, 20], weight: 12 },
  ],
  options: { distributeItems: true },
});

// Each item lands in exactly one bin total.
```

### Duplicate same items into multiple bins (default)

```ts
const result = pack({
  bins: [
    { partno: 'A', whd: [100, 100, 100], maxWeight: 100 },
    { partno: 'B', whd: [100, 100, 100], maxWeight: 100 },
  ],
  items: [{ partno: 'x', whd: [50, 50, 50], weight: 1 }],
  // distributeItems defaults to false
});

// result.bins[0].fittedItems has 1 item, result.bins[1].fittedItems has 1 item.
// Useful for packing N identical orders into N identical cartons in one call.
```

### Binding group

```ts
const result = pack({
  bins: [
    { partno: 'B1', whd: [60, 60, 60], maxWeight: 100 },
    { partno: 'B2', whd: [60, 60, 60], maxWeight: 100 },
  ],
  items: [
    { partno: 'G1', whd: [40, 40, 40], weight: 5, group: 'kit' },
    { partno: 'G2', whd: [40, 40, 40], weight: 5, group: 'kit' },
  ],
  options: { distributeItems: true },
});

// G1 + G2 are atomic: both fit in the same bin, or both end up in unfitItems
// with reason: 'binding_broken'.
```

## Edge cases & gotchas

- **Empty `items`** → returns a result with each bin's `fittedItems: []`, `utilization: 0`, `gravity: [0, 0, 0, 0]`.
- **Empty `bins`** → still iterates: every grouped item is reported `binding_broken` and ungrouped items will throw on the `bins[0]` lookup used to infer unfit reason. **Pass at least one bin.**
- **Mixed units** — all `whd` / `weight` values across bins and items must share the same unit; the library does not convert.
- **`maxWeight` is checked against the *bin's* total**, not per-item. A single item heavier than `bin.maxWeight` is rejected by the weight gate.
- **Position precision** — positions returned are integers (under the scaling) divided back. With `numberOfDecimals: 0` positions are exact integers; with `numberOfDecimals: 2` you can see values like `0.01` from the settle step.
- **`unfitItems` reason for `weight_exceeded`** is inferred against `bins[0]` only (the first bin after sorting). The check covers both single-item overflow (`item.weight > bin.maxWeight`) and cumulative overflow (`bin.totalWeight + item.weight > bin.maxWeight` after the placement attempts). With heterogeneous bins, an item that fits weight-wise in some bins but not others may report `no_space` or `weight_exceeded` depending on which bin is first.
- **Determinism** — given identical input the output is identical. There is no randomness.

## See also

- [`Bin`](./Bin.md) — for direct low-level placement
- [`Item`](./Item.md) — for direct rotation / volume math
- [`PackOptions`](./types.md#packoptions) — all tuning knobs
- [`UnfitItem.reason`](./types.md#unfititem) — failure categories
