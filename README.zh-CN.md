# binpack3d

[English](./README.md) | [中文](./README.zh-CN.md)

[![npm version](https://img.shields.io/npm/v/binpack3d.svg)](https://www.npmjs.com/package/binpack3d)
[![CI](https://github.com/wxul/binpack3d/actions/workflows/ci.yml/badge.svg)](https://github.com/wxul/binpack3d/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

实用型 3D 装箱算法库，把若干长方体物品装入一个或多个容器，支持旋转、重量上限、承重、易碎品、绑定分组、重力下沉、稳定性校验等约束。TypeScript 编写，纯 ESM 发布，零运行时依赖。

> **来源:** 本项目是迁移自 Python 库 [`py3dbp`](https://github.com/jerry800416/3D-bin-packing)(<https://github.com/jerry800416/3D-bin-packing>)的 TypeScript 版本。整数旋转编码与装箱启发式与上游保持一致，两端结果可复现对齐。

**[▶ 在线演示](https://wxul.github.io/binpack3d/)** —— 基于 Three.js 的可视化 demo，支持自定义输入和多个预设场景。

## 亮点

- 多箱装箱 + 角点(corner-point)启发式
- 每个物品 6 种轴向旋转(`updown: false` 时限制为 2 种竖直)
- 重量上限 + 物品级承重
- 易碎 / 不可堆叠物品
- 绑定分组(原子装入)
- 重力下沉 + 稳定性校验
- 跨箱分发或每箱复制
- 每箱体积利用率 + 4 象限重量分布
- 箱内障碍物:py3dbp 兼容的 `corner` 立方体 + 通用 AABB 障碍(用于固定结构,或外部代码生成的斜切 ULD 如 LD3 等)
- TypeScript 优先,ESM,零运行时依赖

完整逐符号 API 文档:**[docs/api/](./docs/api/README.md)**(英文)。

## 安装

```bash
npm install binpack3d
```

要求 Node.js >= 18(浏览器端通过任意现代打包工具即可)。

## 快速上手

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

console.log(result.bins[0].fittedItems);   // 已装入物品列表
console.log(result.bins[0].utilization);   // 体积填充率 0..1
console.log(result.bins[0].gravity);       // [FL%, FR%, BL%, BR%]
console.log(result.unfitItems);            // 未装入物品及原因
```

多箱 / 绑定分组 / 限制旋转等示例见 [docs/api/pack.md](./docs/api/pack.md#examples)。

## API 速览

```ts
import {
  pack,                       // 顶层装箱函数
  Bin, Item,                  // 底层类
  RotationType, Axis,         // 枚举
  type PackInput, type PackOptions, type PackResult,
  type BinInput, type BinResult,
  type ItemInput, type PlacedItem, type UnfitItem,
  type Vec3,
} from 'binpack3d';
```

| 符号           | 文档                                                       |
| -------------- | ---------------------------------------------------------- |
| `pack`         | [docs/api/pack.md](./docs/api/pack.md)                     |
| `Bin`          | [docs/api/Bin.md](./docs/api/Bin.md)                       |
| `Item`         | [docs/api/Item.md](./docs/api/Item.md)                     |
| `RotationType`、`Axis` | [docs/api/enums.md](./docs/api/enums.md)           |
| 全部类型       | [docs/api/types.md](./docs/api/types.md)                   |

## 鸣谢

- 核心算法移植自 Python 库 [`py3dbp`](https://github.com/jerry800416/3D-bin-packing) —— 旋转编码、角点 pivot、易碎/承重/分组/稳定性规则。
- Best-fit 旋转评分(`fillW × fillH × fillD` + 低高度优先)借鉴自 [`olragon/binpackingjs`](https://github.com/olragon/binpackingjs) —— 替换上游的 first-fit 选择策略,在输入维度顺序变化时结果更稳定,装箱密度也略好。

## 协议

[MIT](./LICENSE) © Albert
