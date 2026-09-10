import React from 'react';
import type { MoveAnalysis } from '../types/chess';
import { ClassificationBadge } from './ClassificationBadge';
import { 
  Lightbulb, 
  TrendingUp, 
  Columns2, 
  Compass, 
  CheckCircle2,
  Play
} from 'lucide-react';

interface Props {
  currentMove?: MoveAnalysis;
  showDualBoard: boolean;
  onToggleDualBoard: () => void;
  showBestMoveArrow: boolean;
  onToggleBestMoveArrow: () => void;
  onPreviewOptimalLine?: (line: string[]) => void;
}

export const OptimalComparison: React.FC<Props> = ({
  currentMove,
  showDualBoard,
  onToggleDualBoard,
  showBestMoveArrow,
  onToggleBestMoveArrow,
}) => {
  if (!currentMove) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 text-center text-slate-600 dark:text-slate-400 flex flex-col items-center gap-2 shadow-xs transition-colors">
        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300">
          <Play size={18} className="ml-0.5" />
        </div>
        <h4 className="font-semibold text-sm text-slate-900 dark:text-white">Starting Position</h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">
          Use the playback controls or press the <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[10px] text-slate-700 dark:text-slate-300">Right Arrow</kbd> to step through the game and view move-by-move engine analysis.
        </p>
      </div>
    );
  }

  const isWhite = currentMove.color === 'w';
  const playerLabel = isWhite ? 'White' : 'Black';
  const playedMoveSan = currentMove.san;
  const bestMoveSan = currentMove.bestMoveSan || 'Same';
  const isOptimal = playedMoveSan === bestMoveSan || currentMove.classification === 'best';

  const formatEval = (score: number, isMate?: boolean, mateIn?: number) => {
    if (isMate) {
      if (mateIn === 0 || Math.abs(score) >= 50000) {
        return score >= 0 ? '1-0 (Mate)' : '0-1 (Mate)';
      }
      if (mateIn !== undefined) {
        return mateIn > 0 ? `+M${mateIn}` : `-M${Math.abs(mateIn)}`;
      }
    }
    const pawns = score / 100;
    return pawns > 0 ? `+${pawns.toFixed(2)}` : pawns.toFixed(2);
  };

  return (
    <div className="bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-lg p-4 shadow-xs flex flex-col gap-4 transition-colors">
      <div className="flex flex-col gap-2.5 border-b border-slate-100 dark:border-zinc-800 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isWhite ? 'bg-white border border-slate-400 dark:border-zinc-600' : 'bg-slate-900 dark:bg-zinc-900 border dark:border-zinc-700'}`} />
            <span className="font-semibold text-sm text-slate-900 dark:text-white">
              Move {currentMove.moveNumber}{isWhite ? '.' : '...'} ({playerLabel})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <ClassificationBadge classification={currentMove.classification} size="md" />
          </div>
        </div>
        {currentMove.explanation && (
          <div className="flex items-start gap-2 p-2 rounded-md bg-slate-50/80 dark:bg-zinc-900/60 border border-slate-200/80 dark:border-zinc-800/80 text-xs text-slate-600 dark:text-zinc-300">
            <Lightbulb size={14} className="text-amber-500 shrink-0 mt-0.5" />
            <span className="leading-snug">
              {currentMove.explanation}
            </span>
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className={`p-3 rounded-md border flex flex-col gap-1.5 ${
          isOptimal
            ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800'
            : currentMove.classification === 'blunder'
            ? 'bg-red-50/70 dark:bg-red-950/20 border-red-200 dark:border-red-900'
            : 'bg-slate-50 dark:bg-zinc-900/40 border-slate-200 dark:border-zinc-800'
        }`}>
          <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-zinc-400">
            Played Move
          </span>
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold font-mono text-slate-900 dark:text-white">
              {playedMoveSan}
            </span>
            <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300">
              {formatEval(currentMove.evalScore, currentMove.isMate, currentMove.mateIn)}
            </span>
          </div>
        </div>
        <div className="p-3 rounded-md bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 flex flex-col gap-1.5">
          <span className="text-[11px] font-medium uppercase tracking-wider text-emerald-800 dark:text-emerald-400 flex items-center gap-1">
            <CheckCircle2 size={12} /> Optimal Move
          </span>
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold font-mono text-emerald-800 dark:text-emerald-400">
              {bestMoveSan}
            </span>
            <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-white dark:bg-zinc-900 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300">
              {formatEval(currentMove.bestMoveScore ?? currentMove.evalScore, currentMove.bestMoveIsMate, currentMove.bestMoveMateIn)}
            </span>
          </div>
        </div>
      </div>
      {currentMove.optimalLine && currentMove.optimalLine.length > 0 && (
        <div className="p-3 rounded-md bg-slate-50 dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800 flex flex-col gap-2">
          <span className="text-xs font-medium text-slate-600 dark:text-zinc-400 flex items-center gap-1.5">
            <TrendingUp size={13} className="text-slate-500 dark:text-zinc-400" />
            Stockfish Best Continuation Line:
          </span>
          <div className="flex flex-wrap gap-1.5 text-xs font-mono">
            {currentMove.optimalLine.slice(0, 8).map((san, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-zinc-200"
              >
                {san}
              </span>
            ))}
          </div>
        </div>
      )}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-zinc-800 text-xs">
        <button
          onClick={onToggleBestMoveArrow}
          className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md border transition ${
            showBestMoveArrow
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 font-medium'
              : 'bg-white dark:bg-zinc-950 hover:bg-slate-50 dark:hover:bg-zinc-900 border-slate-300 dark:border-zinc-700 text-slate-600 dark:text-zinc-300'
          }`}
        >
          <Compass size={14} />
          <span>Optimal Arrow: {showBestMoveArrow ? 'ON' : 'OFF'}</span>
        </button>

        <button
          onClick={onToggleDualBoard}
          className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md border transition ${
            showDualBoard
              ? 'bg-slate-900 dark:bg-white border-slate-900 dark:border-white text-white dark:text-black font-semibold'
              : 'bg-white dark:bg-zinc-950 hover:bg-slate-50 dark:hover:bg-zinc-900 border-slate-300 dark:border-zinc-700 text-slate-700 dark:text-zinc-200'
          }`}
        >
          <Columns2 size={14} />
          <span>{showDualBoard ? 'Close Comparison' : 'Side-by-Side'}</span>
        </button>
      </div>
    </div>
  );
};
