export type Round = {
  next: number; // 下一枚待选数字
  startedAt: number | null; // 计时开始的单调时钟时间
  durationMs: number | null; // 完成后固定的总耗时
};

/** 建立等待点击数字 1 的新轮次 */
export function createRound(): Round {
  return { next: 1, startedAt: null, durationMs: null };
}

/** 仅接受按序点击，在最后一个数字处结束计时 */
export function advanceRound(round: Round, number: number, total: number, now: number): Round {
  if (round.durationMs !== null || number !== round.next) return round;
  const startedAt = round.startedAt ?? now;
  return {
    next: number + 1,
    startedAt,
    durationMs: number === total ? now - startedAt : null,
  };
}

/** 将耗时格式化为分钟和秒 */
export function formatTimer(durationMs: number) {
  const seconds = Math.floor(durationMs / 1000);
  const minutes = Math.floor(seconds / 60);
  return `${String(minutes).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}
