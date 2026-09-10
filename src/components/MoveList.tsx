import React, { useEffect, useRef } from 'react';
import type { MoveAnalysis } from '../types/chess';
import { getClassificationDetails } from './ClassificationBadge';

interface Props {
  moves: MoveAnalysis[];
  currentPly: number;
  onSelectPly: (ply: number) => void;
  whiteName: string;
  blackName: string;
}

export const MoveList: React.FC<Props> = ({
  moves,
  currentPly,
  onSelectPly,
  whiteName,
  blackName,
}) => {
  const activeRowRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const movePairs: { moveNumber: number; white?: MoveAnalysis; black?: MoveAnalysis }[] = [];
  let i = 0;
  if (moves.length > 0 && moves[0].color === 'b') {
    movePairs.push({
      moveNumber: moves[0].moveNumber,
      white: undefined,
      black: moves[0],
    });
    i = 1;
  }
  for (; i < moves.length; i += 2) {
    movePairs.push({
      moveNumber: moves[i].moveNumber,
      white: moves[i],
      black: moves[i + 1],
    });
  }

  useEffect(() => {
    const activeEl = activeRowRef.current;
    const container = containerRef.current;
    if (!activeEl || !container) return;

    const rowTop = activeEl.offsetTop;
    const rowBottom = rowTop + activeEl.clientHeight;
    const containerTop = container.scrollTop;
    const containerBottom = containerTop + container.clientHeight;

    if (rowTop < containerTop) {
      container.scrollTo({ top: rowTop - 6, behavior: 'smooth' });
    } else if (rowBottom > containerBottom) {
      container.scrollTo({ top: rowBottom - container.clientHeight + 6, behavior: 'smooth' });
    }
  }, [currentPly]);

  const renderEval = (move?: MoveAnalysis) => {
    if (!move) return null;
    if (move.isMate) {
      if (move.mateIn === 0 || Math.abs(move.evalScore) >= 50000) {
        return '#';
      }
      if (move.mateIn !== undefined) {
        return move.mateIn > 0 ? `M${move.mateIn}` : `-M${Math.abs(move.mateIn)}`;
      }
    }
    const pawns = move.evalScore / 100;
    if (Math.abs(pawns) < 0.05) {
      return '0.0';
    }
    return pawns > 0 ? `+${pawns.toFixed(1)}` : pawns.toFixed(1);
  };

  const renderBadgeIcon = (move?: MoveAnalysis) => {
    if (!move?.classification) return null;
    const details = getClassificationDetails(move.classification);
    if (!details) return null;
    const Icon = details.icon;
    return (
      <span title={details.label} className="shrink-0">
        <Icon size={13} className={details.color.split(' ')[0]} />
      </span>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-lg overflow-hidden shadow-xs transition-colors">
      <div className="grid grid-cols-[44px_1fr_1fr] bg-slate-50 dark:bg-zinc-950 border-b border-slate-200 dark:border-zinc-800 text-xs font-semibold text-slate-600 dark:text-zinc-400 py-2 px-3">
        <span>#</span>
        <span className="truncate pr-1">{whiteName}</span>
        <span className="truncate pr-1">{blackName}</span>
      </div>
      <div ref={containerRef} className="flex-1 overflow-y-auto p-1.5 space-y-0.5 text-xs font-mono">
        {movePairs.map((pair) => {
          const isWhiteActive = currentPly === pair.white?.ply;
          const isBlackActive = currentPly === pair.black?.ply;
          const isRowActive = isWhiteActive || isBlackActive;

          return (
            <div
              key={pair.white?.ply ?? pair.black?.ply ?? pair.moveNumber}
              ref={isRowActive ? activeRowRef : null}
              className={`grid grid-cols-[44px_1fr_1fr] items-center rounded px-2 py-1 transition ${
                pair.moveNumber % 2 === 0
                  ? 'bg-slate-50/50 dark:bg-zinc-950/40'
                  : 'bg-white dark:bg-black'
              }`}
            >
              <span className="text-slate-400 dark:text-zinc-500 font-sans font-medium text-[11px]">
                {pair.moveNumber}.
              </span>
              {pair.white ? (
                <button
                  onClick={() => onSelectPly(pair.white!.ply)}
                  className={`flex items-center justify-between px-2 py-1 rounded transition text-left mr-1 ${
                    isWhiteActive
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-black font-bold'
                      : 'hover:bg-slate-100 dark:hover:bg-zinc-900 text-slate-800 dark:text-zinc-200'
                  }`}
                >
                  <span className="truncate">{pair.white.san}</span>
                  <div className="flex items-center gap-1 shrink-0 ml-1">
                    {renderBadgeIcon(pair.white)}
                    <span className={`text-[10px] font-sans ${isWhiteActive ? 'text-slate-300 dark:text-zinc-800 font-medium' : 'text-slate-500 dark:text-zinc-400'}`}>
                      {renderEval(pair.white)}
                    </span>
                  </div>
                </button>
              ) : (
                <span />
              )}
              {pair.black ? (
                <button
                  onClick={() => onSelectPly(pair.black!.ply)}
                  className={`flex items-center justify-between px-2 py-1 rounded transition text-left ml-1 ${
                    isBlackActive
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-black font-bold'
                      : 'hover:bg-slate-100 dark:hover:bg-zinc-900 text-slate-800 dark:text-zinc-200'
                  }`}
                >
                  <span className="truncate">{pair.black.san}</span>
                  <div className="flex items-center gap-1 shrink-0 ml-1">
                    {renderBadgeIcon(pair.black)}
                    <span className={`text-[10px] font-sans ${isBlackActive ? 'text-slate-300 dark:text-zinc-800 font-medium' : 'text-slate-500 dark:text-zinc-400'}`}>
                      {renderEval(pair.black)}
                    </span>
                  </div>
                </button>
              ) : (
                <span />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
