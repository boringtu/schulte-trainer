import { useEffect, useRef, useState } from 'react';
import { createBoard } from './board';
import type { BoardSettings } from './board';
import { BoardView } from './components/BoardView';
import { Icon } from './components/Icon';
import { PlayerPicker } from './components/PlayerPicker';
import { Scoreboard } from './components/Scoreboard';
import { Settings } from './components/Settings';
import { copy } from './i18n';
import type { Language } from './i18n';
import { advanceRound, createRound, formatTimer } from './round';
import { useStoredState } from './storage';
import type { Score } from './storage';

// 默认使用经典五阶棋盘，关闭随机前景和底色
const defaultSettings: BoardSettings = { type: 'square', level: 5, colorful: false, tinted: false };
const fadeMs = 210; // 棋盘淡出和淡入各自的时长

/** 管理当前棋盘、轮次以及训练者和成绩 */
export default function App() {
  // 本机保存语言、训练者和历史成绩
  const [language, setLanguage] = useStoredState<Language>('language', 'zh-CN');
  const text = copy[language] ?? copy['zh-CN'];
  const [names, setNames] = useStoredState<string[]>('players', []);
  const [player, setPlayer] = useStoredState<string | null>('player', null);
  const [scores, setScores] = useStoredState<Score[]>('scores', []);
  // 分开保存当前设置和实际可见的棋盘，淡出期间保留旧题
  const [settings, setSettings] = useState(defaultSettings);
  const [display, setDisplay] = useState(() => ({ board: createBoard(defaultSettings), settings: defaultSettings }));
  // 保存当前轮次的进度、计时与交互反馈
  const [round, setRound] = useState(createRound);
  const [elapsed, setElapsed] = useState(0);
  const [wrong, setWrong] = useState<number | null>(null);
  const [fading, setFading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  // 管理侧栏焦点、计分板对话框以及可取消的定时任务
  const sidebar = useRef<HTMLElement>(null);
  const sidebarButton = useRef<HTMLButtonElement>(null);
  const scoreDialog = useRef<HTMLDialogElement>(null);
  const introTimer = useRef<number | undefined>(undefined);
  const boardTimer = useRef<number | undefined>(undefined);
  const pendingSettings = useRef<BoardSettings | null>(null); // 动画期间仅应用最后一次设置
  const errorTimer = useRef<number | undefined>(undefined);
  // 从当前显示的棋盘推导轮次状态
  const total = display.board.cells.length;
  const finished = round.durationMs !== null;
  const running = round.startedAt !== null && !finished;

  useEffect(() => {
    document.documentElement.lang = language;
    document.title = text.brand;
  }, [language, text.brand]);

  useEffect(() => {
    // 初次提示显示一秒，用户开始操作后取消自动收起
    introTimer.current = window.setTimeout(() => setSidebarOpen(false), 1000);
    return () => {
      window.clearTimeout(introTimer.current);
      window.clearTimeout(boardTimer.current);
      window.clearTimeout(errorTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!sidebarOpen) return;
    /** 在侧栏外操作时收起，保留原点击目标的行为 */
    function handlePointer(event: PointerEvent) {
      window.clearTimeout(introTimer.current);
      const target = event.target as Node;
      if (!sidebar.current?.contains(target) && !sidebarButton.current?.contains(target)) setSidebarOpen(false);
    }
    /** 关闭侧栏时恢复键盘焦点 */
    function handleKey(event: KeyboardEvent) {
      window.clearTimeout(introTimer.current);
      if (event.key === 'Escape' && !event.defaultPrevented && !scoreDialog.current?.open) {
        setSidebarOpen(false);
        sidebarButton.current?.focus();
      }
    }
    document.addEventListener('pointerdown', handlePointer);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('pointerdown', handlePointer);
      document.removeEventListener('keydown', handleKey);
    };
  }, [sidebarOpen]);

  useEffect(() => {
    if (!running || round.startedAt === null) return;
    const startedAt = round.startedAt;
    // 每次读单调时钟，浏览器暂停回调时不会丢失耗时
    const timer = window.setInterval(() => setElapsed(performance.now() - startedAt), 100);
    return () => window.clearInterval(timer);
  }, [running, round.startedAt]);

  /** 在旧棋盘完全淡出后替换，再淡入新棋盘 */
  function replaceBoard() {
    const nextSettings = pendingSettings.current;
    if (nextSettings === null) return;
    pendingSettings.current = null;
    window.clearTimeout(boardTimer.current);
    setDisplay({ board: createBoard(nextSettings), settings: nextSettings });
    setRound(createRound());
    setElapsed(0);
    setWrong(null);
    setFading(false);
  }

  /** 请求新棋盘，并等待旧棋盘淡出 */
  function regenerate(nextSettings: BoardSettings) {
    window.clearTimeout(boardTimer.current);
    window.clearTimeout(errorTimer.current);
    pendingSettings.current = nextSettings;
    setSettings(nextSettings);
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      replaceBoard();
      return;
    }
    setFading(true);
    // 打印预览等场景可能取消动画事件，为换题保留兜底
    boardTimer.current = window.setTimeout(replaceBoard, fadeMs + 100);
  }

  /** 处理按序选择，完成时保存一次成绩 */
  function pickNumber(number: number) {
    if (fading || finished) return;
    const now = performance.now();
    const updated = advanceRound(round, number, total, now);
    window.clearTimeout(errorTimer.current);
    if (updated === round) {
      setWrong(number);
      errorTimer.current = window.setTimeout(() => setWrong(null), 320);
      return;
    }
    setRound(updated);
    setWrong(null);
    if (updated.durationMs !== null) {
      const date = Date.now();
      const score: Score = {
        id: globalThis.crypto?.randomUUID?.() ?? `${date}-${Math.random()}`,
        player,
        date,
        type: display.settings.type,
        level: display.settings.level,
        durationMs: updated.durationMs,
      };
      setScores((previous) => [score, ...previous]);
    }
  }

  /** 新增名字或选中已存在的同名训练者 */
  function addPlayer(name: string) {
    setNames((previous) => previous.includes(name) ? previous : [...previous, name]);
    setPlayer(name);
  }

  // 标题和打印元数据跟随实际可见的棋盘
  const shape = text.shapes[display.settings.type];
  const level = text.levelName(display.settings.level);
  const selected = round.next - 1;

  return (
    <div className="app-shell">
      <header className="topbar screen-only">
        <div className="topbar-inner flex items-center justify-between">
          <div className="brand flex items-center">
            <span className="brand-mark"><Icon name="focus" /></span>
            <span>{text.brand}</span>
          </div>
          <button ref={sidebarButton} type="button" className="settings-trigger" aria-label={text.settings} aria-expanded={sidebarOpen}
            aria-controls="training-settings" onClick={() => {
              window.clearTimeout(introTimer.current);
              setSidebarOpen(!sidebarOpen);
            }}>
            <Icon name="panel" /><span>{text.settings}</span>
          </button>
        </div>
      </header>

      <Settings text={text} language={language} settings={settings} open={sidebarOpen} panelRef={sidebar}
        onClose={() => {
          setSidebarOpen(false);
          sidebarButton.current?.focus();
        }}
        onChange={regenerate} onLanguage={setLanguage} onShuffle={() => regenerate(settings)}
        onPrint={() => window.print()} onScores={() => scoreDialog.current?.showModal()} />

      <main className="workspace">
        <div className="intro screen-only">
          <p className="eyebrow"><span />{text.lab}</p>
          <h1>{shape}</h1>
          <div className="board-meta"><span className="level-badge">{level}</span><span>{text.cells(total)}</span></div>
        </div>

        <div className="print-only print-header">
          <h1>{text.printTitle}</h1>
          <p>{shape} · {level} · {text.cells(total)}</p>
          <p>{text.printHint}</p>
        </div>

        <section className="training-card" aria-label={shape}>
          <div className="statusbar screen-only">
            <PlayerPicker text={text} names={names} player={player} locked={running} onSelect={setPlayer} onAdd={addPlayer} />
            <div className="timer">
              <span className="status-label">{text.timer}</span>
              <time aria-label={text.timer}>{formatTimer(round.durationMs ?? elapsed)}</time>
            </div>
            <div className="next">
              <span className="status-label">{text.next}</span>
              <span className="next-chip" aria-live="polite" aria-label={finished ? text.complete : undefined}>
                {finished ? <Icon name="check" /> : round.next}
              </span>
            </div>
          </div>

          <div className="board-stage">
            <div className="board-visibility" data-fading={fading} style={{ transitionDuration: `${fadeMs}ms` }}
              onTransitionEnd={(event) => {
                if (fading && event.target === event.currentTarget && event.propertyName === 'opacity') replaceBoard();
              }}>
              <BoardView board={display.board} label={shape} next={round.next} wrong={wrong} locked={fading} onNumber={pickNumber} />
            </div>
          </div>

          <div className="training-foot screen-only">
            <div className="progress-track" aria-hidden="true"><span style={{ width: `${selected / total * 100}%` }} /></div>
            <div className="round-hint flex items-center justify-between gap-2">
              <span role="status"><Icon name={finished ? 'check' : 'focus'} />
                {finished ? text.saved : running ? text.playing : text.ready}
              </span>
              <span>{text.count(selected, total)}</span>
            </div>
          </div>
        </section>

        <div className="print-only print-footer">{text.printFooter}</div>
      </main>
      <Scoreboard text={text} dialogRef={scoreDialog} scores={scores} />
    </div>
  );
}
