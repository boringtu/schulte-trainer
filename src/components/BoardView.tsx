import type { Cell, Board } from '../board';

type Props = {
  board: Board; // 与打印版共用的棋盘
  label: string; // 棋盘图形的无障碍名称
  next: number; // 第一个未完成的数字
  wrong: number | null; // 最近一次错误点击的数字
  markSelected: boolean; // 控制已选格子的视觉提示
  locked: boolean; // 淡出期间禁止操作旧棋盘
  rotating: boolean; // 是否播放圆环动画
  onNumber: (number: number) => void; // 尝试选中数字
};

/** 渲染可使用鼠标、触屏和键盘操作的棋盘 */
export function BoardView({ board, label, next, wrong, locked, markSelected, rotating, onNumber }: Props) {
  /** 扇区和普通格子共用同一套交互逻辑 */
  function renderCell(cell: Cell) {
    const done = cell.number < next;
    const interactive = !locked && !done;
    const onRing = cell.ring !== undefined;
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
        <text className={onRing ? 'cell-number ring-number' : 'cell-number'} x={cell.x} y={cell.y} dy=".35em"
          textAnchor="middle" fontSize={cell.font}
          style={{ fill: cell.ink, transformOrigin: onRing ? `${cell.x}px ${cell.y}px` : undefined }}>
          {cell.number}
        </text>
      </g>
    );
  }

  return (
    <svg className="board-svg" viewBox="0 0 600 600" role="group" aria-label={label} data-rotating={rotating}>
      {board.circular && <circle className="board-outline" cx="300" cy="300" r="282" />}
      {board.cells.filter((cell) => cell.ring === undefined).map(renderCell)}
      {board.ringDurations.map((duration, ring) => (
        <g key={ring} className="board-ring" data-reverse={ring % 2 !== 0} style={{ animationDuration: `${duration}s` }}>
          {board.cells.filter((cell) => cell.ring === ring).map(renderCell)}
        </g>
      ))}
    </svg>
  );
}
