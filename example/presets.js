// Preset datasets that exercise different features of binpack3d.
// Each preset has a label, a short description (used as a tooltip), and the input config.

export const presets = [
  {
    id: 'golden',
    label: 'Golden test (13 mixed items)',
    description: 'The same input used in unit tests — verifies parity with the upstream Python implementation.',
    bins: [
      { partno: 'example1', whd: [5.6875, 10.75, 15.0], maxWeight: 70, fixPoint: true, checkStable: true, supportSurfaceRatio: 0.75 },
    ],
    items: [
      { partno: '50g [powder 1]',  whd: [2, 2, 4], weight: 1, color: '#ff5252' },
      { partno: '50g [powder 2]',  whd: [2, 2, 4], weight: 2, color: '#4f8cff' },
      { partno: '50g [powder 3]',  whd: [2, 2, 4], weight: 3, color: '#8a91a4' },
      { partno: '50g [powder 4]',  whd: [2, 2, 4], weight: 3, color: '#ff9a40' },
      { partno: '50g [powder 5]',  whd: [2, 2, 4], weight: 3, color: '#7cd14d' },
      { partno: '50g [powder 6]',  whd: [2, 2, 4], weight: 3, color: '#b06bf0' },
      { partno: '50g [powder 7]',  whd: [1, 1, 5], weight: 3, color: '#f3d34a' },
      { partno: '250g [powder 8]', whd: [4, 4, 2], weight: 4, color: '#ff70b3' },
      { partno: '250g [powder 9]', whd: [4, 4, 2], weight: 5, color: '#a66a3a' },
      { partno: '250g [powder 10]', whd: [4, 4, 2], weight: 6, color: '#46d2da' },
      { partno: '250g [powder 11]', whd: [4, 4, 2], weight: 7, color: '#a4a23b' },
      { partno: '250g [powder 12]', whd: [4, 4, 2], weight: 8, color: '#2c8e4a' },
      { partno: '250g [powder 13]', whd: [4, 4, 2], weight: 9, color: '#ff9a40' },
    ],
    options: { biggerFirst: true, distributeItems: false, numberOfDecimals: 0 },
  },

  {
    id: 'fragile',
    label: 'Fragile + loadbear',
    description: 'A heavy bottom item with low loadbear blocks stacking. Fragile items refuse anything on top.',
    bins: [
      { partno: 'crate', whd: [60, 60, 60], maxWeight: 200 },
    ],
    items: [
      { partno: 'low-loadbear', whd: [40, 20, 40], weight: 30, loadbear: 5, color: '#a66a3a' },
      { partno: 'fragile-glass', whd: [40, 20, 40], weight: 10, fragile: true, color: '#46d2da' },
      { partno: 'heavy-1', whd: [20, 20, 20], weight: 50, color: '#ff5252' },
      { partno: 'heavy-2', whd: [20, 20, 20], weight: 50, color: '#ff9a40' },
      { partno: 'light-1', whd: [20, 20, 20], weight: 2, color: '#4f8cff' },
      { partno: 'light-2', whd: [20, 20, 20], weight: 2, color: '#7cd14d' },
      { partno: 'light-3', whd: [20, 20, 20], weight: 2, color: '#b06bf0' },
    ],
    options: { biggerFirst: true, distributeItems: false, numberOfDecimals: 0 },
  },

  {
    id: 'grouped',
    label: 'Binding groups (atomic packing)',
    description: 'Items sharing a group must end up in the same bin. Splittable items distribute across bins.',
    bins: [
      { partno: 'box-A', whd: [50, 50, 50], maxWeight: 100 },
      { partno: 'box-B', whd: [50, 50, 50], maxWeight: 100 },
    ],
    items: [
      { partno: 'kit-1a', whd: [30, 30, 30], weight: 5, group: 'kit1', color: '#4f8cff' },
      { partno: 'kit-1b', whd: [30, 20, 20], weight: 3, group: 'kit1', color: '#4f8cff' },
      { partno: 'kit-2a', whd: [40, 40, 40], weight: 6, group: 'kit2', color: '#ff70b3' },
      { partno: 'kit-2b', whd: [20, 20, 40], weight: 2, group: 'kit2', color: '#ff70b3' },
      { partno: 'loose-1', whd: [15, 15, 15], weight: 1, color: '#7cd14d' },
      { partno: 'loose-2', whd: [15, 15, 15], weight: 1, color: '#7cd14d' },
      { partno: 'loose-3', whd: [15, 15, 15], weight: 1, color: '#7cd14d' },
    ],
    options: { biggerFirst: true, distributeItems: true, numberOfDecimals: 0 },
  },

  {
    id: 'multi-bin',
    label: 'Multi-bin distribute',
    description: 'A spread of items across two differently-sized bins with distributeItems on.',
    bins: [
      { partno: 'small', whd: [40, 40, 40], maxWeight: 30 },
      { partno: 'large', whd: [80, 60, 50], maxWeight: 120 },
    ],
    items: [
      { partno: 'a', whd: [30, 30, 30], weight: 5, color: '#4f8cff' },
      { partno: 'b', whd: [50, 30, 20], weight: 12, color: '#ff70b3' },
      { partno: 'c', whd: [25, 25, 25], weight: 4, color: '#7cd14d' },
      { partno: 'd', whd: [40, 40, 30], weight: 15, color: '#b06bf0' },
      { partno: 'e', whd: [20, 20, 20], weight: 2, color: '#f3d34a' },
      { partno: 'f', whd: [15, 15, 15], weight: 1, color: '#46d2da' },
      { partno: 'g', whd: [35, 20, 40], weight: 8, color: '#ff9a40' },
    ],
    options: { biggerFirst: true, distributeItems: true, numberOfDecimals: 0 },
  },

  {
    id: 'weight',
    label: 'Weight exceeded',
    description: 'Items individually exceed the bin\'s maxWeight — shows the weight_exceeded reason.',
    bins: [
      { partno: 'small-light', whd: [60, 60, 60], maxWeight: 10 },
    ],
    items: [
      { partno: 'too-heavy-1', whd: [20, 20, 20], weight: 15, color: '#ff5252' },
      { partno: 'too-heavy-2', whd: [20, 20, 20], weight: 12, color: '#ff5252' },
      { partno: 'ok-1', whd: [20, 20, 20], weight: 3, color: '#7cd14d' },
      { partno: 'ok-2', whd: [20, 20, 20], weight: 4, color: '#4f8cff' },
    ],
    options: { biggerFirst: true, distributeItems: false, numberOfDecimals: 0 },
  },

  {
    id: 'corner',
    label: 'Container corner (py3dbp compatible)',
    description: 'Eight cube corners pre-placed at the bin\'s vertices. Cargo must pack around them.',
    bins: [
      { partno: 'crate-with-corners', whd: [80, 80, 80], maxWeight: 200, corner: 8 },
    ],
    items: [
      { partno: 'mid-1', whd: [40, 40, 40], weight: 8, color: '#4f8cff' },
      { partno: 'mid-2', whd: [40, 40, 40], weight: 8, color: '#46d2da' },
      { partno: 'mid-3', whd: [40, 40, 40], weight: 8, color: '#ff70b3' },
      { partno: 'small-1', whd: [20, 20, 20], weight: 2, color: '#7cd14d' },
      { partno: 'small-2', whd: [20, 20, 20], weight: 2, color: '#f3d34a' },
      { partno: 'small-3', whd: [20, 20, 20], weight: 2, color: '#b06bf0' },
      { partno: 'small-4', whd: [20, 20, 20], weight: 2, color: '#ff9a40' },
    ],
    options: { biggerFirst: true, distributeItems: false, numberOfDecimals: 0 },
  },

  // LD3 demo. Bin uses simplified round dimensions (200×160×150 cm) — real
  // LD3 outside is ~200.7×162.6×153.4 cm. The chamfer along one bottom edge
  // is approximated by 8 stair-step AABBs (10 cm steps). Real ULDs would use
  // finer steps; 10 cm keeps the demo readable.
  (() => {
    const W = 200, H = 160, D = 150;
    const CHAMFER_W = 40;   // bottom cut depth (along +W axis, inward)
    const CHAMFER_H = 80;   // height over which the chamfer tapers
    const STEPS = 8;
    const stepH = CHAMFER_H / STEPS;
    const obstacles = Array.from({ length: STEPS }, (_, i) => {
      const widthAtStep = CHAMFER_W * (1 - i / STEPS);
      return {
        position: [W - widthAtStep, i * stepH, 0],
        whd: [widthAtStep, stepH, D],
      };
    });
    return {
      id: 'ld3-chamfer',
      label: 'LD3-style chamfered ULD (stair-step obstacles)',
      description: 'A chamfered air-cargo container modeled with 8 stair-step AABB obstacles along one bottom edge. The chamfer is non-load-bearing (excluded from stability supports); items can overhang into the empty column above the chamfer as long as enough of their footprint still sits over real cargo below.',
      bins: [
        // Default stability check (checkStable: true) is intentional — combined
        // with obstacle exclusion, the chamfer can't be used as a support.
        // Wide-on-narrow overhang relies on the area-ratio path
        // (supportSurfaceRatio default 0.75), so the base is sized so the lid
        // covers ≥75% of its own footprint.
        { partno: 'LD3-ish', whd: [W, H, D], maxWeight: 1500, obstacles },
      ],
      items: [
        // Base — placed first (largest volume). updown:false keeps it upright.
        // Sits clear of the chamfer at the floor (chamfer starts at X=160).
        // Square footprint (140×140) keeps W/D rotations equivalent, so the
        // packer can't swap to an orientation that starves the lid of support.
        { partno: 'base', whd: [140, 80, 140], weight: 80, color: '#b06bf0', updown: false },
        // Wide flat lids — sit on top of the base at H=80 (chamfer ends there),
        // overhanging 40cm past the base into the empty column above the
        // chamfer. 140×100 / 180×100 ≈ 78% support-area ratio clears the 0.75 default.
        { partno: 'lid-1', whd: [180, 40, 100], weight: 40, color: '#4f8cff', updown: false },
        { partno: 'lid-2', whd: [180, 40, 100], weight: 40, color: '#46d2da', updown: false },
        // Side cargo — sits on the lids in the Z-direction corridor above the
        // base depth, filling out the upper half of the container.
        { partno: 'crate-1', whd: [60, 60, 50], weight: 20, color: '#ff70b3' },
        { partno: 'crate-2', whd: [60, 60, 50], weight: 20, color: '#ff9a40' },
      ],
      options: { biggerFirst: true, distributeItems: false, numberOfDecimals: 0 },
    };
  })(),

  {
    id: 'upright',
    label: 'Upright only (updown: false)',
    description: 'These items cannot lie on their side — only 2 rotations are tried.',
    bins: [
      { partno: 'pallet', whd: [100, 120, 100], maxWeight: 300, checkStable: false },
    ],
    items: [
      { partno: 'tall-1', whd: [30, 80, 30], weight: 8, updown: false, color: '#4f8cff' },
      { partno: 'tall-2', whd: [30, 80, 30], weight: 8, updown: false, color: '#46d2da' },
      { partno: 'tall-3', whd: [30, 80, 30], weight: 8, updown: false, color: '#b06bf0' },
      { partno: 'short-1', whd: [40, 30, 40], weight: 5, color: '#ff9a40' },
      { partno: 'short-2', whd: [40, 30, 40], weight: 5, color: '#f3d34a' },
      { partno: 'short-3', whd: [40, 30, 40], weight: 5, color: '#7cd14d' },
    ],
    options: { biggerFirst: true, distributeItems: false, numberOfDecimals: 0 },
  },
];
