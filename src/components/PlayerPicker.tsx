import { useEffect, useRef, useState } from 'react';
import type { Copy } from '../i18n';
import { Icon } from './Icon';

type Props = {
  text: Copy; // 当前语言文案
  names: string[]; // 已添加的训练者
  player: string | null; // 当前训练者
  locked: boolean; // 当前轮次进行时锁定选择
  onSelect: (name: string | null) => void; // 切换训练者
  onAdd: (name: string) => void; // 新增并选中训练者
};

/** 提供训练者选择和键盘新增入口 */
export function PlayerPicker({ text, names, player, locked, onSelect, onAdd }: Props) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const container = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    /** 点击选择器外部时收起选项 */
    function dismiss(event: PointerEvent) {
      if (!container.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener('pointerdown', dismiss);
    return () => document.removeEventListener('pointerdown', dismiss);
  }, [open]);

  /** 关闭选项并将键盘焦点交还给触发按钮 */
  function close() {
    setOpen(false);
    trigger.current?.focus();
  }

  return (
    <div className="player-picker" ref={container} onKeyDown={(event) => {
      if (event.key === 'Escape' && open) {
        event.stopPropagation();
        close();
      }
    }}>
      <span className="status-label">{text.player}</span>
      <button ref={trigger} type="button" className="player-trigger" aria-label={text.choosePlayer}
        aria-expanded={open && !locked} aria-controls="player-options" disabled={locked}
        onClick={() => setOpen(!open)}>
        <Icon name="user" /><span>{player ?? text.choosePlayer}</span><Icon name="chevron" />
      </button>
      {open && !locked && (
        <div id="player-options" className="player-options">
          {names.length > 0 && (
            <ul>
              {[null, ...names].map((name) => (
                <li key={name === null ? 'guest' : `name:${name}`}>
                  <button type="button" aria-pressed={name === player} onClick={() => {
                    onSelect(name);
                    close();
                  }}>
                    <span>{name ?? text.guest}</span>
                    {name === player && <Icon name="check" />}
                  </button>
                </li>
              ))}
            </ul>
          )}
          <form onSubmit={(event) => {
            event.preventDefault();
            const name = draft.trim();
            if (!name) return;
            onAdd(name);
            setDraft('');
            close();
          }}>
            <input aria-label={text.addPlayer} placeholder={text.addPlayer} value={draft}
              maxLength={40} onChange={(event) => setDraft(event.target.value)} />
          </form>
        </div>
      )}
    </div>
  );
}
