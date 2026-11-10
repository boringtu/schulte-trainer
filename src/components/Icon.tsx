// 使用共用线宽和网格绘制界面图标
const paths = {
  focus: 'M8 4H4v4m12-4h4v4m0 8v4h-4m-8 0H4v-4m8-7v6m-3-3h6',
  panel: 'M3 5h18v14H3zM9 5v14',
  close: 'm6 6 12 12M18 6 6 18',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0',
  chevron: 'm7 10 5 5 5-5',
  shuffle: 'M4 6h3l10 12h3m-4-4 4 4-4 4M4 18h3l3-4m4-4 3-4h3m-4-4 4 4-4 4',
  print: 'M6 9V3h12v6M6 17H3V9h18v8h-3M6 14h12v7H6zm11-2h1',
  scores: 'M8 20h8m-4 0v-5M8 4h8v7a4 4 0 0 1-8 0V4Zm0 2H4v3a3 3 0 0 0 4 3m8-6h4v3a3 3 0 0 1-4 3',
  globe: 'M3 12h18m-9-9a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 0c2.5 2.5 3.5 5.5 3.5 9s-1 6.5-3.5 9c-2.5-2.5-3.5-5.5-3.5-9s1-6.5 3.5-9Z',
  clock: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 5v4l3 2',
  check: 'm5 12 4 4L19 6',
  square: 'M3 3h18v18H3zM3 9h18M3 15h18M9 3v18m6-18v18',
  irregular: 'M3 3h18v18H3zM3 10h18M3 16h18M8 3v7m7-7v7m-3 0v6m-5 0v5m9-5v5',
  hex: 'm8 3 4 2.3v4.4L8 12 4 9.7V5.3Zm8 0 4 2.3v4.4L16 12l-4-2.3V5.3Zm-4 7 4 2.3v4.4L12 19l-4-2.3v-4.4Z',
  circle: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 4v1m0 8v1M7 12h1m8 0h1m-5 0h.01',
  circleHex: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 5 4.4 2.5v5L12 17l-4.4-2.5v-5Z',
  circleIrregular: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20ZM4 6l8 4 5-6m-5 6-2 5 5 6m-5-6-8 2m10-7 9 3',
};

type IconName = keyof typeof paths; // 图标在路径表中的键

/** 输出无需外部图标字体的装饰图形 */
export function Icon({ name }: { name: IconName }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={paths[name]} />
    </svg>
  );
}
