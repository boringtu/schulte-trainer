import type { Board } from '../board';

type Props = {
  board: Board; // 与打印版共用的棋盘
  label: string; // 棋盘图形的无障碍名称
  next: number; // 第一个未完成的数字
  wrong: number | null; // 最近一次错误点击的数字
  markSelected: boolean; // 控制已选格子的视觉提示
  locked: boolean; // 淡出期间禁止操作旧棋盘
  onNumber: (number: number) => void; // 尝试选中数字
};

/** 渲染可使用鼠标、触屏和键盘操作的棋盘 */
export function BoardView({ board, label, next, wrong, locked, markSelected, onNumber }: Props) {
  return (
    <svg className="board-svg" viewBox="0 0 600 600" role="group" aria-label={label}>
      {board.circular && <circle className="board-outline" cx="300" cy="300" r="282" />}
      {board.cells.map((cell) => {
        const done = cell.number < next;
        const interactive = !locked && !done;
        return (
          <g key={cell.number} role="button" aria-label={String(cell.number)} aria-disabled={!interactive}
            tabIndex={interactive ? 0 : -1} className="board-cell" data-marked={markSelected && done} data-wrong={wrong === cell.number}
            onClick={() => interactive && onNumber(cell.number)}
            onKeyDown={(event) => {
              if (interactive && !event.repeat && (event.key === 'Enter' || event.key === ' ')) {
                event.preventDefault();
                onNumber(cell.number);
              }
            }}>
            <path className="cell-shape" d={cell.path} style={{ fill: cell.fill }} />
            <text className="cell-number" x={cell.x} y={cell.y} dy=".35em" textAnchor="middle"
              fontSize={cell.font} style={{ fill: cell.ink }}>
              {cell.number}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
