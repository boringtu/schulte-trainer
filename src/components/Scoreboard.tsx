import dayjs from 'dayjs';
import type { Ref } from 'react';
import type { Copy } from '../i18n';
import { formatTimer } from '../round';
import type { Score } from '../storage';
import { Icon } from './Icon';

type Props = {
  text: Copy; // 当前语言文案
  dialogRef: Ref<HTMLDialogElement>; // 主界面用于打开原生对话框
  scores: Score[]; // 按完成时间从新到旧排列的成绩
};

/** 用原生对话框展示本地训练成绩 */
export function Scoreboard({ text, dialogRef, scores }: Props) {
  const shapes = { ...text.legacyShapes, ...text.shapes }; // 旧成绩保留实际训练过的棋盘名称
  return (
    <dialog ref={dialogRef} className="score-dialog screen-only" aria-labelledby="scores-title"
      onClick={(event) => {
        if (event.target === event.currentTarget) event.currentTarget.close();
      }}>
      <div className="score-inner">
        <header className="score-header flex items-start justify-between gap-4">
          <div>
            <span className="score-kicker"><Icon name="scores" />{text.scoreboard}</span>
            <h2 id="scores-title">{text.scoreHeading}</h2>
            <p>{text.scoreDescription}</p>
          </div>
          <form method="dialog">
            <button type="submit" className="icon-button" aria-label={text.close}><Icon name="close" /></button>
          </form>
        </header>
        {scores.length === 0 ? (
          <p className="empty-scores">{text.emptyScores}</p>
        ) : (
          <div className="score-table-wrap">
            <table>
              <thead><tr>
                <th scope="col">{text.player}</th>
                <th scope="col">{text.time}</th>
                <th scope="col">{text.layout}</th>
                <th scope="col">{text.duration}</th>
              </tr></thead>
              <tbody>
                {scores.map((score) => (
                  <tr key={score.id}>
                    <td>{score.player ?? text.guest}</td>
                    <td>{dayjs(score.date).format('YYYY-MM-DD HH:mm:ss')}</td>
                    <td>{shapes[score.type]} · {text.levelName(score.level)}</td>
                    <td className="score-time">{formatTimer(score.durationMs)}.{Math.floor(score.durationMs % 1000 / 100)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </dialog>
  );
}
