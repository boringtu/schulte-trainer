// 棋盘坐标在浏览器和打印版中共用同一个视图
const size = 600;
const middle = size / 2;
const radius = 282;
const margin = 15;
const sqrt3 = Math.sqrt(3);

// 图形键用于设置和成绩存档
export const boardTypes = ['square', 'hex', 'irregular1', 'irregular2', 'rings', 'circleIrregular'] as const;
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
  ring?: number; // 同心环的编号，中心格不属于任何环
};
export type Cell = Tile & {
  number: number; // 当前单元格的随机数字
  ink?: string; // 数字颜色
  fill?: string; // 单元背景色
};
export type Board = {
  cells: Cell[]; // 当前随机棋盘的单元格
  circular: boolean; // 是否绘制圆形边框
  ringDurations: number[]; // 各圆环转动一周所需的秒数
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

/** 以一组共用的网格顶点生成方格或轻微扭曲的四边形 */
function quadrilaterals(level: Level, random?: Random) {
  const step = (size - margin * 2) / level;
  const lattice = Array.from({ length: level + 1 }, (_, row) =>
    Array.from({ length: level + 1 }, (_, column) => ({
      // 外侧顶点只沿边框移动，内部偏移小于格宽的五分之一
      x: margin + (column + (random && column > 0 && column < level ? (random() - 0.5) * 0.36 : 0)) * step,
      y: margin + (row + (random && row > 0 && row < level ? (random() - 0.5) * 0.36 : 0)) * step,
    })),
  );

  return lattice.slice(0, -1).flatMap((row, y) => row.slice(0, -1).map((point, x) => {
    const vertices = [point, row[x + 1], lattice[y + 1][x + 1], lattice[y + 1][x]];
    return random ? polygonTile(vertices) : {
      x: point.x + step / 2,
      y: point.y + step / 2,
      font: step * 0.44,
      path: polygon(vertices),
    };
  }));
}

/** 按点顶六边形的六个角生成顶点 */
function hexPoints({ x, y }: Point, r: number) {
  return Array.from({ length: 6 }, (_, index) => {
    const angle = (index * 60 - 90) * Math.PI / 180;
    return { x: x + r * Math.cos(angle), y: y + r * Math.sin(angle) };
  });
}

/** 将平铺的六边形缩放到棋盘范围内 */
function honeycomb(level: Level) {
  const centers = Array.from({ length: level }, (_, row) =>
    Array.from({ length: level }, (_, column) => ({
      x: (column + (row % 2) / 2) * sqrt3,
      y: row * 1.5,
    })),
  ).flat();
  const vertices = centers.flatMap((point) => hexPoints(point, 1));
  const xs = vertices.map(({ x }) => x);
  const ys = vertices.map(({ y }) => y);
  const width = Math.max(...xs) - Math.min(...xs);
  const height = Math.max(...ys) - Math.min(...ys);
  const center = { x: Math.min(...xs) + width / 2, y: Math.min(...ys) + height / 2 };
  const scale = (size - margin * 2) / Math.max(width, height);
  return centers.map(({ x, y }) => {
    const point = { x: middle + (x - center.x) * scale, y: middle + (y - center.y) * scale };
    return { ...point, font: scale * 0.78, path: polygon(hexPoints(point, scale)) };
  });
}

/** 按圆周长度分配中心之外的数字 */
function ringCounts(level: Level, ringCount: number) {
  const totalWeight = ringCount * (ringCount + 1);
  let previous = 0;
  return Array.from({ length: ringCount }, (_, index) => {
    const ring = index + 1;
    const cumulative = Math.round((level ** 2 - 1) * ring * (ring + 1) / totalWeight);
    const count = cumulative - previous;
    previous = cumulative;
    return count;
  });
}

/** 将极坐标转换为棋盘上的点 */
function polar(r: number, angle: number): Point {
  return { x: middle + r * Math.cos(angle), y: middle + r * Math.sin(angle) };
}

/** 生成由两条圆弧和两条径向边围成的扇区 */
function sectorPath(inner: number, outer: number, start: number, end: number) {
  const a = polar(outer, start);
  const b = polar(outer, end);
  const c = polar(inner, end);
  const d = polar(inner, start);
  return `M ${a.x},${a.y} A ${outer},${outer} 0 0 1 ${b.x},${b.y} L ${c.x},${c.y} A ${inner},${inner} 0 0 0 ${d.x},${d.y} Z`;
}

/** 用同心扇区铺满圆盘，圆心保留一个独立的圆格 */
function ringLayout(level: Level) {
  const counts = ringCounts(level, Math.floor(level / 2) + Number(level >= 5));
  const thickness = radius / (counts.length + 0.5);
  const centerRadius = thickness / 2;
  const center = { x: middle, y: middle };
  const sectors = counts.flatMap((count, ring) => {
    const inner = centerRadius + thickness * ring;
    const outer = inner + thickness;
    const midRadius = (inner + outer) / 2;
    const angleStep = 2 * Math.PI / count;
    const phase = -Math.PI / 2 + (ring % 2) * angleStep / 2;
    const font = Math.min(thickness, 2 * midRadius * Math.sin(angleStep / 2)) * 0.53;
    return Array.from({ length: count }, (_, index) => {
      const start = phase + index * angleStep;
      const end = start + angleStep;
      return { ...polar(midRadius, (start + end) / 2), font, ring, path: sectorPath(inner, outer, start, end) };
    });
  });
  return [{ ...center, font: thickness * 0.51, path: circlePath(center, centerRadius) }, ...sectors];
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

/** 用面积加权的重心定位数字，避免圆弧上的密集顶点拉偏中心 */
function polygonCenter(vertices: Point[]): Point {
  let twiceArea = 0;
  let x = 0;
  let y = 0;
  for (let index = 0; index < vertices.length; index++) {
    const from = vertices[index];
    const to = vertices[(index + 1) % vertices.length];
    const cross = from.x * to.y - to.x * from.y;
    twiceArea += cross;
    x += (from.x + to.x) * cross;
    y += (from.y + to.y) * cross;
  }
  return { x: x / (3 * twiceArea), y: y / (3 * twiceArea) };
}

/** 按重心到最近边的距离确定数字的可用空间 */
function polygonTile(vertices: Point[]): Tile {
  const center = polygonCenter(vertices);
  const clearance = Math.min(...vertices.map((from, index) => {
    const to = vertices[(index + 1) % vertices.length];
    const length = Math.hypot(to.x - from.x, to.y - from.y);
    if (length < 1e-7) return Infinity;
    return Math.abs((to.x - from.x) * (center.y - from.y) - (to.y - from.y) * (center.x - from.x)) / length;
  }));
  return { ...center, font: clearance * 1.02, path: polygon(vertices) };
}

/** 将边界内的空间按最近点切成相邻多边形 */
function voronoi(sites: Point[], boundary: Point[]) {
  return sites.map((site) => sites.reduce(
    (cell, other) => other === site ? cell : clipCell(cell, site, other),
    boundary,
  ));
}

/** 在方形边界内随机分布点位，生成边数不同的多边形 */
function irregularSquare(level: Level, random: Random) {
  const step = (size - margin * 2) / level;
  const farEdge = size - margin;
  const boundary = [
    { x: margin, y: margin }, { x: farEdge, y: margin },
    { x: farEdge, y: farEdge }, { x: margin, y: farEdge },
  ];
  const sites = Array.from({ length: level ** 2 }, (_, index) => ({
    x: margin + (index % level + 0.5 + (random() - 0.5) * 0.65) * step,
    y: margin + (Math.floor(index / level) + 0.5 + (random() - 0.5) * 0.65) * step,
  }));
  return voronoi(sites, boundary).map(polygonTile);
}

/** 以近似等面积的环带安排初始点，再放松网格以缩短外围格 */
function circleIrregular(level: Level, random: Random) {
  const total = level ** 2;
  const spacing = radius / level;
  let sites = [polar(0, 0)];
  for (const [ring, count] of ringCounts(level, Math.floor(level / 2)).entries()) {
    // 面积与半径平方成正比，按面积中点放置环带点位
    const r = radius * Math.sqrt((sites.length + count / 2) / total);
    const phase = ring * 1.7 + random();
    for (let index = 0; index < count; index++) {
      const angle = phase + (index + (random() - 0.5) * 0.36) * 2 * Math.PI / count;
      sites.push(polar(r + (random() - 0.5) * spacing * 0.62, angle));
    }
  }
  const boundary = Array.from({ length: 144 }, (_, index) => polar(radius, index * 2 * Math.PI / 144));
  // 向面积重心移动两次，减少外围细长格，同时保留布局的随机变化
  let cells = voronoi(sites, boundary);
  for (let pass = 0; pass < 2; pass++) {
    sites = cells.map((vertices, index) => {
      const centroid = polygonCenter(vertices);
      const site = sites[index];
      return { x: (site.x + 2 * centroid.x) / 3, y: (site.y + 2 * centroid.y) / 3 };
    });
    cells = voronoi(sites, boundary);
  }
  return cells.map(polygonTile);
}

// 为每种图形分配对应的几何生成方法
const layouts: Record<BoardType, Layout> = {
  square: (level) => quadrilaterals(level),
  irregular1: quadrilaterals,
  irregular2: irregularSquare,
  hex: honeycomb,
  rings: ringLayout,
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
  // 随机分配不重叠的速度区间，确保相邻圆环速度不同
  const ringCount = (tiles.at(-1)?.ring ?? -1) + 1;
  const speedBands = Array.from({ length: ringCount }, (_, index) => index);
  const ringDurations = Array.from({ length: ringCount }, () => {
    const [band] = speedBands.splice(Math.floor(random() * speedBands.length), 1);
    return 48 + band * 11 + random() * 9;
  });
  return {
    circular: settings.type === 'rings' || settings.type === 'circleIrregular',
    ringDurations,
    cells: tiles.map((tile, index) => ({
      ...tile,
      number: numbers[index],
      ink: settings.colorful ? inks[Math.floor(random() * inks.length)] : undefined,
      fill: settings.tinted ? fills[Math.floor(random() * fills.length)] : undefined,
    })),
  };
}
