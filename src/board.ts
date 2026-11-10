// 棋盘坐标在浏览器和打印版中共用同一个视图
const size = 600;
const middle = size / 2;
const radius = 282;
const margin = 15;
const sqrt3 = Math.sqrt(3);

// 图形键用于设置和成绩存档
export const boardTypes = ['square', 'irregular', 'hex', 'circle', 'circleHex', 'circleIrregular'] as const;
export const levels = [3, 4, 5, 6, 7] as const;

export type BoardType = typeof boardTypes[number]; // 图形类型
export type Level = typeof levels[number]; // 等阶，数字个数为等阶的平方
export type BoardSettings = {
  type: BoardType; // 当前图形
  level: Level; // 当前等阶
  colorful: boolean; // 是否随机分配数字颜色
  tinted: boolean; // 是否随机分配单元底色
};

type Point = {
  x: number; // 横坐标
  y: number; // 纵坐标
};
type Tile = Point & {
  path: string; // 单元格的 SVG 描边
  font: number; // 由单元格内的可用空间决定
};
export type Cell = Tile & {
  number: number; // 当前单元格的随机数字
  ink?: string; // 数字颜色
  fill?: string; // 单元背景色
};
export type Board = {
  cells: Cell[]; // 当前随机棋盘的单元格
  circular: boolean; // 是否绘制圆形边框
};

type Random = () => number; // 可注入的随机数来源
type Layout = (level: Level, random: Random) => Tile[]; // 将等阶映射为一组格子

// 配对使用高对比度前景色与低饱和浅色背景
const inks = ['#0a5a45', '#643281', '#23447b', '#8c3128', '#754509', '#2d4352'];
const fills = ['#e6f3e9', '#f2ebf8', '#e8eff8', '#faece7', '#f9f0da', '#e8f2f3'];

/** 将闭合多边形转换为 SVG 路径 */
function polygon(points: Point[]) {
  return `M ${points.map(({ x, y }) => `${x},${y}`).join(' L ')} Z`;
}

/** 根据中心和半径生成圆形 SVG 路径 */
function circlePath({ x, y }: Point, r: number) {
  return `M ${x - r},${y} a ${r},${r} 0 1 0 ${2 * r},0 a ${r},${r} 0 1 0 ${-2 * r},0 Z`;
}

/** 计算一行或一列的边界位置 */
function divisions(level: Level, random?: Random) {
  // 交替的基准权重在随机值相近时仍能产生可辨识的格宽差异
  const weights = Array.from({ length: level }, (_, i) =>
    random ? 0.65 + (i % 2) * 0.45 + random() * 0.8 : 1,
  );
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  const boundaries = [margin];
  for (const weight of weights) {
    boundaries.push(boundaries.at(-1)! + (size - margin * 2) * weight / total);
  }
  return boundaries;
}

/** 按行生成规则或不规则的矩形格 */
function rectangles(level: Level, random?: Random) {
  const rows = divisions(level, random);
  return rows.slice(0, -1).flatMap((top, row) => {
    const bottom = rows[row + 1];
    const columns = divisions(level, random);
    return columns.slice(0, -1).map((left, column) => {
      const right = columns[column + 1];
      return {
        x: (left + right) / 2,
        y: (top + bottom) / 2,
        font: Math.min(right - left, bottom - top) * 0.44,
        path: polygon([
          { x: left, y: top },
          { x: right, y: top },
          { x: right, y: bottom },
          { x: left, y: bottom },
        ]),
      };
    });
  });
}

/** 按点顶六边形的六个角生成顶点 */
function hexPoints({ x, y }: Point, r: number) {
  return Array.from({ length: 6 }, (_, index) => {
    const angle = (index * 60 - 90) * Math.PI / 180;
    return { x: x + r * Math.cos(angle), y: y + r * Math.sin(angle) };
  });
}

/** 将平铺或聚拢的六边形缩放到棋盘范围内 */
function honeycomb(level: Level, circular: boolean) {
  const span = circular ? 2 * level + 1 : level;
  const centers = Array.from({ length: span }, (_, row) =>
    Array.from({ length: span }, (_, column) => ({
      x: (column - (circular ? level : 0) + (row % 2) / 2) * sqrt3,
      y: (row - (circular ? level : 0)) * 1.5,
    })),
  ).flat();
  // 圆形布局优先选取最靠近中心的格子
  const chosen = circular
    ? centers.sort((a, b) => Math.hypot(a.x, a.y) - Math.hypot(b.x, b.y)).slice(0, level ** 2)
    : centers;
  const vertices = chosen.flatMap((point) => hexPoints(point, 1));
  const xs = vertices.map(({ x }) => x);
  const ys = vertices.map(({ y }) => y);
  const width = Math.max(...xs) - Math.min(...xs);
  const height = Math.max(...ys) - Math.min(...ys);
  const center = { x: Math.min(...xs) + width / 2, y: Math.min(...ys) + height / 2 };
  const scale = circular
    ? (radius - 14) / Math.max(...vertices.map(({ x, y }) => Math.hypot(x - center.x, y - center.y)))
    : (size - margin * 2) / Math.max(width, height);
  return chosen.map(({ x, y }) => {
    const point = { x: middle + (x - center.x) * scale, y: middle + (y - center.y) * scale };
    return { ...point, font: scale * 0.78, path: polygon(hexPoints(point, scale)) };
  });
}

/** 生成中心和同心环上的点位 */
function rings(level: Level) {
  const ringCount = Math.floor(level / 2);
  const step = (radius - 16) / (ringCount + 0.53);
  const weights = ringCount * (ringCount + 1) / 2;
  const points: Point[] = [{ x: middle, y: middle }];
  let distributed = 0;
  for (let ring = 1; ring <= ringCount; ring++) {
    // 按环周长分配数字，最后一环吸收舍入误差
    const cumulative = Math.round((level ** 2 - 1) * ring * (ring + 1) / (2 * weights));
    const count = cumulative - distributed;
    for (let index = 0; index < count; index++) {
      const angle = (index + (ring % 2) / 2) * 2 * Math.PI / count;
      points.push({ x: middle + Math.cos(angle) * step * ring, y: middle + Math.sin(angle) * step * ring });
    }
    distributed = cumulative;
  }
  return { points, step };
}

/** 沿两点的垂直平分线裁剪多边形 */
function clipCell(vertices: Point[], site: Point, other: Point) {
  const dx = other.x - site.x;
  const dy = other.y - site.y;
  const limit = ((site.x + other.x) * dx + (site.y + other.y) * dy) / 2;
  const result: Point[] = [];
  for (let index = 0; index < vertices.length; index++) {
    const from = vertices[index];
    const to = vertices[(index + 1) % vertices.length];
    const start = from.x * dx + from.y * dy - limit;
    const end = to.x * dx + to.y * dy - limit;
    if (start <= 0) result.push(from);
    if ((start <= 0) !== (end <= 0)) {
      const fraction = start / (start - end);
      result.push({ x: from.x + (to.x - from.x) * fraction, y: from.y + (to.y - from.y) * fraction });
    }
  }
  return result;
}

/** 将圆盘按最近点划分为不规则格 */
function circleIrregular(level: Level, random: Random) {
  const { points, step } = rings(level);
  const sites = points.map(({ x, y }, index) => {
    const angle = (index * 2.4 + random()) * Math.PI;
    const offset = step * (0.09 + random() * 0.17);
    return { x: x + Math.cos(angle) * offset, y: y + Math.sin(angle) * offset };
  });
  // 用足够密的圆周顶点作为裁剪边界
  const boundary = Array.from({ length: 96 }, (_, index) => {
    const angle = index * Math.PI / 48;
    return { x: middle + radius * Math.cos(angle), y: middle + radius * Math.sin(angle) };
  });
  return sites.map((site) => {
    const vertices = sites.reduce((cell, other) => other === site ? cell : clipCell(cell, site, other), boundary);
    // 使用凸多边形各顶点的平均点，并按到最近边的距离适配字号
    const center = vertices.reduce(
      (point, vertex) => ({ x: point.x + vertex.x / vertices.length, y: point.y + vertex.y / vertices.length }),
      { x: 0, y: 0 },
    );
    const clearance = Math.min(...vertices.map((from, index) => {
      const to = vertices[(index + 1) % vertices.length];
      return Math.abs((to.x - from.x) * (center.y - from.y) - (to.y - from.y) * (center.x - from.x))
        / Math.hypot(to.x - from.x, to.y - from.y);
    }));
    return { ...center, font: clearance * 0.88, path: polygon(vertices) };
  });
}

// 为每种图形分配对应的几何生成方法
const layouts: Record<BoardType, Layout> = {
  square: (level) => rectangles(level),
  irregular: rectangles,
  hex: (level) => honeycomb(level, false),
  circle: (level) => {
    const { points, step } = rings(level);
    // 给每环最接近的两个圆格留出间隙
    const r = step * 0.355;
    return points.map((point) => ({ ...point, font: r * 0.94, path: circlePath(point, r) }));
  },
  circleHex: (level) => honeycomb(level, true),
  circleIrregular,
};

/** 生成棋盘几何、数字排列和可选配色 */
export function createBoard(settings: BoardSettings, random: Random = Math.random): Board {
  const tiles = layouts[settings.type](settings.level, random);
  const numbers = tiles.map((_, index) => index + 1);
  // 用 Fisher–Yates 洗牌保持排列的均匀性
  for (let index = numbers.length - 1; index > 0; index--) {
    const swap = Math.floor(random() * (index + 1));
    [numbers[index], numbers[swap]] = [numbers[swap], numbers[index]];
  }
  return {
    circular: settings.type.startsWith('circle'),
    cells: tiles.map((tile, index) => ({
      ...tile,
      number: numbers[index],
      ink: settings.colorful ? inks[Math.floor(random() * inks.length)] : undefined,
      fill: settings.tinted ? fills[Math.floor(random() * fills.length)] : undefined,
    })),
  };
}
