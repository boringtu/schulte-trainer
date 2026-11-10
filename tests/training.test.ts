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

  test.each(['irregular', 'circleIrregular'] as const)('%s 的字号随格子大小变化', (type) => {
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
