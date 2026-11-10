import { describe, expect, test } from '@jest/globals';
import { boardTypes, createBoard, levels } from '../src/board';
import { advanceRound, createRound, formatTimer } from '../src/round';

describe('训练棋盘', () => {
  test.each(boardTypes ?? [])('%s 支持全部等阶并包含连续且唯一的数字', (type) => {
    for (const level of levels) {
      // 检查每个图形能完整渲染并容纳所有标签
      const board = createBoard({ type, level, colorful: true, tinted: true }, () => 0.35);
      expect(board.cells.map((cell) => cell.number).sort((a, b) => a - b)).toEqual(
        Array.from({ length: level ** 2 }, (_, index) => index + 1),
      );
      for (const cell of board.cells) {
        expect(cell.x).toBeGreaterThan(0);
        expect(cell.y).toBeGreaterThan(0);
        expect(cell.x).toBeLessThan(600);
        expect(cell.y).toBeLessThan(600);
        expect(cell.font).toBeGreaterThan(8);
        expect(cell.ink).toBeTruthy();
        expect(cell.fill).toBeTruthy();
      }
    }
  });

  test.each(levels)('圆环在 %s 阶时有静止中心和完整的扇区', (level) => {
    const board = createBoard({ type: 'rings', level, colorful: false, tinted: false }, () => 0.35);
    // 环内单元包含两段同心圆弧，中心独立于所有转动组
    expect(board.cells.filter((cell) => cell.ring === undefined)).toHaveLength(1);
    expect(new Set(board.ringDurations).size).toBe(board.ringDurations.length);
    for (const ring of board.ringDurations.keys()) {
      const sectors = board.cells.filter((cell) => cell.ring === ring);
      expect(sectors.length).toBeGreaterThanOrEqual(3);
      expect(sectors.every((cell) => cell.path.split(' A ').length === 3)).toBe(true);
    }
  });

  test.each(levels)('不规则方格 1 在 %s 阶时每条内部边由两个四边形共用', (level) => {
    const board = createBoard({ type: 'irregular1', level, colorful: false, tinted: false });
    const edges = new Map<string, number>(); // 记录相同几何边被使用的次数
    for (const cell of board.cells) {
      const points = cell.path.slice(2, -2).split(' L ');
      expect(points).toHaveLength(4);
      for (const [index, point] of points.entries()) {
        const edge = [point, points[(index + 1) % points.length]].sort().join('|');
        edges.set(edge, (edges.get(edge) ?? 0) + 1);
      }
    }
    expect([...edges.values()].filter((count) => count === 1)).toHaveLength(4 * level);
    expect([...edges.values()].filter((count) => count === 2)).toHaveLength(2 * level * (level - 1));
  });

  test('不规则方格 2 包含不同边数的多边形', () => {
    let seed = 42; // 固定种子，让测试使用可复现的非均匀点位
    const board = createBoard({ type: 'irregular2', level: 7, colorful: false, tinted: false }, () => {
      seed = (1664525 * seed + 1013904223) >>> 0;
      return seed / 2 ** 32;
    });
    expect(new Set(board.cells.map((cell) => cell.path.split(' L ').length)).size).toBeGreaterThan(2);
  });

  test.each(['irregular1', 'irregular2', 'circleIrregular'] as const)('%s 的字号随格子大小变化', (type) => {
    // 固定随机源以便比较不规则单元的字体尺寸
    const board = createBoard({ type, level: 5, colorful: false, tinted: false }, () => 0.35);
    expect(new Set(board.cells.map((cell) => Math.round(cell.font))).size).toBeGreaterThan(1);
    expect(board.cells.every((cell) => !cell.ink && !cell.fill)).toBe(true);
  });
});

describe('训练计时', () => {
  test('只有点中 1 才计时，最后一个数字完成后锁定成绩', () => {
    // 依序模拟错误点击、开始和结束
    const idle = createRound();
    expect(advanceRound(idle, 2, 3, 100)).toBe(idle);
    const started = advanceRound(idle, 1, 3, 200);
    expect(started).toEqual({ next: 2, startedAt: 200, durationMs: null });
    expect(advanceRound(started, 3, 3, 300)).toBe(started);
    const midway = advanceRound(started, 2, 3, 900);
    const finished = advanceRound(midway, 3, 3, 2100);
    expect(finished).toEqual({ next: 4, startedAt: 200, durationMs: 1900 });
    expect(advanceRound(finished, 3, 3, 3000)).toBe(finished);
  });

  test('计时器保持 mm:ss 格式', () => {
    expect(formatTimer(0)).toBe('00:00');
    expect(formatTimer(65001)).toBe('01:05');
    expect(formatTimer(6000000)).toBe('100:00');
  });
});
