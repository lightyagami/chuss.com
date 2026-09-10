import React, { useMemo, useState } from 'react';
import { Chessboard } from 'react-chessboard';
import type { Arrow } from 'react-chessboard';
import { EvalBar } from './EvalBar';
import type { MoveAnalysis } from '../types/chess';
import { CheckCircle2, Shuffle, Flame } from 'lucide-react';
import { computeBoardHeatmap } from '../utils/boardHeatmap';

interface Props {
  fen: string;
  orientation: 'white' | 'black';
  currentMove?: MoveAnalysis;
  showBestMoveArrow?: boolean;
  whiteName?: string;
  blackName?: string;
  whiteElo?: string;
  blackElo?: string;
  isViewingOptimal?: boolean;
  onToggleViewOptimal?: () => void;
  hasOptimalAlternative?: boolean;
}

export const ChessBoardContainer: React.FC<Props> = ({
  fen,
  orientation,
  currentMove,
  showBestMoveArrow = true,
  whiteName = 'White',
  blackName = 'Black',
  whiteElo,
  blackElo,
  isViewingOptimal = false,
  onToggleViewOptimal,
  hasOptimalAlternative = false,
}) => {
  const [showHeatmap, setShowHeatmap] = useState<boolean>(false);
  const arrows = useMemo<Arrow[]>(() => {
    const list: Arrow[] = [];

    if (currentMove) {
      if (isViewingOptimal) {
        if (currentMove.bestMoveFrom && currentMove.bestMoveTo) {
          list.push({
            startSquare: currentMove.bestMoveFrom,
            endSquare: currentMove.bestMoveTo,
            color: 'rgba(16, 185, 129, 0.95)',
          });
        }
      } else {
        if (currentMove.from && currentMove.to) {
          const isBlunder = currentMove.classification === 'blunder';
          const isMistake = currentMove.classification === 'mistake';
          const color = isBlunder
            ? 'rgba(239, 68, 68, 0.85)'
            : isMistake
            ? 'rgba(249, 115, 22, 0.85)'
            : 'rgba(234, 179, 8, 0.75)';
          list.push({ startSquare: currentMove.from, endSquare: currentMove.to, color });
        }

        if (
          showBestMoveArrow &&
          currentMove.bestMoveFrom &&
          currentMove.bestMoveTo &&
          (currentMove.bestMoveFrom !== currentMove.from || currentMove.bestMoveTo !== currentMove.to)
        ) {
          list.push({
            startSquare: currentMove.bestMoveFrom,
            endSquare: currentMove.bestMoveTo,
            color: 'rgba(16, 185, 129, 0.95)',
          });
        }
      }
    }

    return list;
  }, [currentMove, showBestMoveArrow, isViewingOptimal]);

  const squareStyles = useMemo(() => {
    const styles: Record<string, React.CSSProperties> = showHeatmap ? computeBoardHeatmap(fen) : {};
    if (currentMove) {
      if (isViewingOptimal && currentMove.bestMoveFrom && currentMove.bestMoveTo) {
        styles[currentMove.bestMoveFrom] = { backgroundColor: 'rgba(16, 185, 129, 0.4)' };
        styles[currentMove.bestMoveTo] = { backgroundColor: 'rgba(16, 185, 129, 0.4)' };
      } else if (currentMove.from && currentMove.to) {
        const isBlunder = currentMove.classification === 'blunder';
        const bg = isBlunder ? 'rgba(239, 68, 68, 0.45)' : 'rgba(234, 179, 8, 0.35)';
        styles[currentMove.from] = { backgroundColor: bg };
        styles[currentMove.to] = { backgroundColor: bg };
      }
    }

    if (!isViewingOptimal && currentMove?.checkSquare) {
      styles[currentMove.checkSquare] = {
        backgroundColor: 'rgba(239, 68, 68, 0.55)',
      };
    }

    return styles;
  }, [currentMove, isViewingOptimal, showHeatmap, fen]);

  const topPlayer = orientation === 'white'
    ? { name: blackName, elo: blackElo, color: 'Black' }
    : { name: whiteName, elo: whiteElo, color: 'White' };

  const bottomPlayer = orientation === 'white'
    ? { name: whiteName, elo: whiteElo, color: 'White' }
    : { name: blackName, elo: blackElo, color: 'Black' };

  return (
    <div className="flex items-stretch gap-2 md:gap-3 justify-center w-full max-w-[560px]">
      {}
      <div className="flex flex-col py-4 sm:py-8 shrink-0">
        <EvalBar
          score={isViewingOptimal ? (currentMove?.bestMoveScore ?? currentMove?.evalScore ?? 0) : (currentMove?.evalScore ?? 0)}
          isMate={isViewingOptimal ? currentMove?.bestMoveIsMate : currentMove?.isMate}
          mateIn={isViewingOptimal ? currentMove?.bestMoveMateIn : currentMove?.mateIn}
          orientation={orientation}
        />
      </div>
      <div className="flex flex-col flex-1 min-w-0 max-w-[500px]">
        <div className="flex items-center justify-between px-3 py-1.5 bg-white dark:bg-black rounded-t-lg border border-slate-200 dark:border-zinc-800 text-xs shadow-xs transition-colors">
          <div className="flex items-center gap-2">
            <div className={`w-3.5 h-3.5 rounded-full border border-slate-400 dark:border-zinc-700 ${topPlayer.color === 'Black' ? 'bg-slate-900 dark:bg-zinc-900' : 'bg-white'}`} />
            <span className="font-semibold text-slate-900 dark:text-white truncate max-w-[140px] sm:max-w-[200px]">
              {topPlayer.name}
            </span>
            {topPlayer.elo && (
              <span className="text-slate-500 dark:text-zinc-400 font-mono text-[11px]">({topPlayer.elo})</span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setShowHeatmap(!showHeatmap)}
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition ${
                showHeatmap
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-zinc-900 hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-300 dark:border-zinc-800'
              }`}
              title="Toggle square control and tension heatmap"
            >
              <Flame size={11} className={showHeatmap ? 'text-white' : 'text-amber-500'} />
              <span>Heatmap</span>
            </button>
            {hasOptimalAlternative && onToggleViewOptimal && (
              <button
                onClick={onToggleViewOptimal}
                className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-medium transition ${
                  isViewingOptimal
                    ? 'bg-emerald-700 text-white'
                    : 'bg-slate-100 dark:bg-zinc-900 hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200 border border-slate-300 dark:border-zinc-700'
                }`}
                title="Toggle between actual played move and optimal move on the board"
              >
                <Shuffle size={12} />
                <span>{isViewingOptimal ? 'Viewing: Optimal' : 'Viewing: Played'}</span>
              </button>
            )}
          </div>
        </div>
        <div className="relative rounded-none overflow-hidden border-x border-slate-200 dark:border-zinc-800 bg-white dark:bg-black aspect-square w-full shadow-xs">
          <Chessboard
            options={{
              position: fen,
              boardOrientation: orientation,
              allowDragging: false,
              arrows,
              squareStyles,
              darkSquareStyle: { backgroundColor: '#779952' },
              lightSquareStyle: { backgroundColor: '#edeed1' },
              animationDurationInMs: 200,
            }}
          />
        </div>
        <div className="flex items-center justify-between px-3 py-1.5 bg-white dark:bg-black rounded-b-lg border border-slate-200 dark:border-zinc-800 text-xs shadow-xs transition-colors">
          <div className="flex items-center gap-2">
            <div className={`w-3.5 h-3.5 rounded-full border border-slate-400 dark:border-zinc-700 ${bottomPlayer.color === 'Black' ? 'bg-slate-900 dark:bg-zinc-900' : 'bg-white'}`} />
            <span className="font-semibold text-slate-900 dark:text-white truncate max-w-[140px] sm:max-w-[200px]">
              {bottomPlayer.name}
            </span>
            {bottomPlayer.elo && (
              <span className="text-slate-500 dark:text-zinc-400 font-mono text-[11px]">({bottomPlayer.elo})</span>
            )}
          </div>

          {isViewingOptimal && (
            <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-mono font-medium flex items-center gap-1">
              <CheckCircle2 size={12} /> Optimal: {currentMove?.bestMoveSan}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
