import type { Ref } from 'react';
import { boardTypes, levels } from '../board';
import type { BoardSettings } from '../board';
import type { Copy, Language } from '../i18n';
import { Icon } from './Icon';

type Props = {
  text: Copy; // 当前语言文案
  language: Language; // 当前界面语言
  rotateRings: boolean; // 是否开启同心环转动
  markSelected: boolean; // 是否标记本轮已正确选中的数字
  settings: BoardSettings; // 用户选中的棋盘参数
  open: boolean; // 侧栏是否展开
  panelRef: Ref<HTMLElement>; // 用于识别侧栏外点击
  onMouseEnter: () => void; // 鼠标移入时取消首次自动收起
  onClose: () => void; // 收起设置
  onRotateRingsChange: (enabled: boolean) => void; // 切换圆环转动
  onMarkSelectedChange: (enabled: boolean) => void; // 即时切换标记
  onChange: (settings: BoardSettings) => void; // 应用棋盘参数
  onLanguage: (language: Language) => void; // 切换语言
  onShuffle: () => void; // 重新生成当前棋盘
  onPrint: () => void; // 打开打印对话框
  onScores: () => void; // 打开计分板
};

/** 渲染悬浮训练设置和快捷操作 */
export function Settings({
  text, language, settings, markSelected, open, panelRef, onMouseEnter, onClose, onChange, onMarkSelectedChange,
  rotateRings, onRotateRingsChange, onLanguage, onShuffle, onPrint, onScores,
}: Props) {
  return (
    <aside id="training-settings" ref={panelRef} className="settings-panel screen-only"
      data-open={open} inert={!open} aria-labelledby="settings-title" onMouseEnter={onMouseEnter}>
      <div className="settings-head flex items-center justify-between">
        <h2 id="settings-title">{text.settings}</h2>
        <button type="button" className="icon-button" onClick={onClose} aria-label={text.close}>
          <Icon name="close" />
        </button>
      </div>

      <div className="settings-body">
        <fieldset>
          <legend>{text.layout}</legend>
          <div className="layout-options grid grid-cols-2">
            {boardTypes.map((type) => (
              <label className="layout-option" key={type}>
                <input type="radio" name="layout" value={type} checked={type === settings.type}
                  onChange={() => onChange({ ...settings, type })} />
                <span className="layout-card"><Icon name={type} />{text.shapes[type]}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend>{text.difficulty}</legend>
          <div className="level-options grid grid-cols-5">
            {levels.map((level) => (
              <label className="level-option" key={level}>
                <input type="radio" name="level" value={level} checked={level === settings.level}
                  onChange={() => onChange({ ...settings, level })} />
                <span><b>{level ** 2}</b><small>{text.levelName(level)}</small></span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="toggles">
          {settings.type === 'rings' && (
            <label className="setting-row">
              <span>{text.rotateRings}</span>
              <input type="checkbox" role="switch" checked={rotateRings}
                onChange={(event) => onRotateRingsChange(event.target.checked)} />
            </label>
          )}
          <label className="setting-row">
            <span>{text.colorful}</span>
            <input type="checkbox" role="switch" checked={settings.colorful}
              onChange={(event) => onChange({ ...settings, colorful: event.target.checked })} />
          </label>
          <label className="setting-row">
            <span>{text.tinted}</span>
            <input type="checkbox" role="switch" checked={settings.tinted}
              onChange={(event) => onChange({ ...settings, tinted: event.target.checked })} />
          </label>
          <label className="setting-row">
            <span>{text.markSelected}</span>
            <input type="checkbox" role="switch" checked={markSelected}
              onChange={(event) => onMarkSelectedChange(event.target.checked)} />
          </label>
          <label className="setting-row">
            <span className="flex items-center gap-2"><Icon name="globe" />{text.language}</span>
            <select value={language} onChange={(event) => onLanguage(event.target.value as Language)}>
              <option value="zh-CN">简体中文</option>
              <option value="en">English</option>
            </select>
          </label>
        </div>
      </div>

      <div className="settings-actions grid grid-cols-2">
        <button type="button" className="action secondary" onClick={onShuffle}>
          <Icon name="shuffle" />{text.regenerate}
        </button>
        <button type="button" className="action primary" onClick={onPrint}>
          <Icon name="print" />{text.print}
        </button>
        <button type="button" className="action scoreboard-link col-span-2" onClick={onScores}>
          <Icon name="scores" />{text.scoreboard}
        </button>
      </div>
    </aside>
  );
}
