import { useEffect, useState } from 'react';
import type { BoardType, Level } from './board';

export type Score = {
  id: string; // 单次完成记录的唯一键
  player: string | null; // 访客记为 null
  date: number; // 完成时的本地时间戳
  type: BoardType | 'irregular' | 'circle' | 'circleHex'; // 兼容旧版棋盘的成绩
  level: Level; // 完成轮次使用的等阶
  durationMs: number; // 完成训练的毫秒耗时
};

/** 在当前浏览器保存状态，存储受限时仍允许训练 */
export function useStoredState<T>(key: string, fallback: T) {
  const storageKey = `schulte.v1.${key}`;
  const [value, setValue] = useState<T>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved === null ? fallback : (JSON.parse(saved) as T) ?? fallback;
    } catch {
      return fallback;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(value));
    } catch {
      // 无痕窗口或存储空间不足时保留当前会话状态
    }
  }, [storageKey, value]);

  return [value, setValue] as const;
}
