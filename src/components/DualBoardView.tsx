import React, { useState, useEffect, useMemo } from 'react';
import { Chessboard } from 'react-chessboard';
import type { Arrow } from 'react-chessboard';
import { Chess } from 'chess.js';
import type { MoveAnalysis } from '../types/chess';
import { 
  ChevronLeft, 
  ChevronRight, 
  RotateCcw, 
  CheckCircle2, 
  Layers
} from 'lucide-react';

interface Props {
  currentMove?: MoveAnalysis;
  orientation: 'white' | 'black';
  onFlipBoard: () => void;
}

export const DualBoardView: React.FC<Props> = ({
  currentMove,
  orientation,
  onFlipBoard,
}) => {
  const [optimalStepIndex, setOptimalStepIndex] = useState<number>(0);
  const [optimalFen, setOptimalFen] = useState<string>('');
  const [optimalHistory, setOptimalHistory] = useState<{ san: string; from: string; to: string; fen: string }[]>([]);

  useEffect(() => {
    if (!currentMove) {
      setOptimalFen('');
      setOptimalHistory([]);
      setOptimalStepIndex(0);
      return;
    }

    try {
      const chess = new Chess(currentMove.fenBefore);
      const history: { san: string; from: string; to: string; fen: string }[] = [];

      if (currentMove.optimalLine && currentMove.optimalLine.length > 0) {
        for (let i = 0; i < Math.min(8, currentMove.optimalLine.length); i++) {
          const san = currentMove.optimalLine[i];
          try {
            const m = chess.move(san);
            if (m) {
              history.push({ san: m.san, from: m.from, to: m.to, fen: chess.fen() });
            } else {
              break;
            }
          } catch {
            break;
          }
        }
      } else if (currentMove.bestMoveFrom && currentMove.bestMoveTo) {
        const move = chess.move({
          from: currentMove.bestMoveFrom,
          to: currentMove.bestMoveTo,
          promotion: 'q',
        });
        if (move) {
          history.push({ san: move.san, from: move.from, to: move.to, fen: chess.fen() });
        }
      }

      setOptimalHistory(history);
      setOptimalStepIndex(0);
      setOptimalFen(history.length > 0 ? history[0].fen : currentMove.fenBefore);
    } catch {
      setOptimalFen(currentMove.fenBefore);
    }
  }, [currentMove]);

  const handleStepOptimal = (newIdx: number) => {
    if (newIdx < 0 || newIdx >= optimalHistory.length) return;
    setOptimalStepIndex(newIdx);
    setOptimalFen(optimalHistory[newIdx].fen);
  };

  const actualArrows = useMemo<Arrow[]>(() => {
    if (!currentMove?.from || !currentMove?.to) return [];
    return [{
      startSquare: currentMove.from,
      endSquare: currentMove.to,
      color: 'rgba(234, 179, 8, 0.85)',
    }];
  }, [currentMove]);

  const currentOptimalMove = optimalHistory[optimalStepIndex];

  const optimalArrows = useMemo<Arrow[]>(() => {
    if (!currentOptimalMove?.from || !currentOptimalMove?.to) return [];
    return [{
      startSquare: currentOptimalMove.from,
      endSquare: currentOptimalMove.to,
      color: 'rgba(16, 185, 129, 0.95)',
    }];
  }, [currentOptimalMove]);

  if (!currentMove) return null;

  const formatEvalText = (score: number, isMate?: boolean, mateIn?: number) => {
    if (isMate) {
      if (mateIn === 0 || Math.abs(score) >= 50000) {
        return score >= 0 ? 'White delivered Checkmate' : 'Black delivered Checkmate';
      }
      if (mateIn !== undefined) {
        return `Mate in ${Math.abs(mateIn)}`;
      }
    }
    return `${(score / 100).toFixed(2)} pawns`;
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      {}
      <div className="flex items-center justify-between bg-white border border-slate-200 rounded-lg px-4 py-3 shadow-xs">
        <div className="flex items-center gap-2">
          <Layers className="text-slate-700" size={17} />
          <span className="font-semibold text-sm text-slate-900">
            Dual Board View — Actual Game vs Optimal Play
          </span>
        </div>
        <button
          onClick={onFlipBoard}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 border border-slate-300 transition"
        >
          <RotateCcw size={13} className="text-slate-500" />
          <span>Flip ({orientation === 'white' ? 'White' : 'Black'})</span>
        </button>
      </div>

      {}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {}
        <div className="flex flex-col items-center bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
          <div className="flex items-center justify-between w-full mb-3 px-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-700 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              Actual Game Played
            </span>
            <span className="text-sm font-mono font-bold text-slate-900">
              {currentMove.moveNumber}{currentMove.color === 'w' ? '.' : '...'} {currentMove.san}
            </span>
          </div>

          <div className="aspect-square w-full max-w-[420px] rounded-none overflow-hidden border border-slate-300 shadow-xs">
            <Chessboard
              options={{
                position: currentMove.fenAfter,
                boardOrientation: orientation,
                allowDragging: false,
                arrows: actualArrows,
                squareStyles: {
                  [currentMove.from]: { backgroundColor: 'rgba(234, 179, 8, 0.3)' },
                  [currentMove.to]: { backgroundColor: 'rgba(234, 179, 8, 0.3)' },
                },
                darkSquareStyle: { backgroundColor: '#779952' },
                lightSquareStyle: { backgroundColor: '#edeed1' },
              }}
            />
          </div>

          <div className="w-full mt-3 p-2.5 rounded-md bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
            <span className="text-slate-500">Position Eval:</span>
            <span className="font-mono font-bold text-slate-900">
              {formatEvalText(currentMove.evalScore, currentMove.isMate, currentMove.mateIn)}
            </span>
          </div>
        </div>

        {}
        <div className="flex flex-col items-center bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
          <div className="flex items-center justify-between w-full mb-3 px-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
              <CheckCircle2 size={14} />
              Optimal Continuation
            </span>
            <span className="text-sm font-mono font-bold text-emerald-800">
              {currentMove.bestMoveSan || currentMove.san}
            </span>
          </div>

          <div className="aspect-square w-full max-w-[420px] rounded-none overflow-hidden border border-slate-300 shadow-xs">
            <Chessboard
              options={{
                position: optimalFen || currentMove.fenBefore,
                boardOrientation: orientation,
                allowDragging: false,
                arrows: optimalArrows,
                squareStyles: currentOptimalMove
                  ? {
                      [currentOptimalMove.from]: { backgroundColor: 'rgba(16, 185, 129, 0.3)' },
                      [currentOptimalMove.to]: { backgroundColor: 'rgba(16, 185, 129, 0.3)' },
                    }
                  : {},
                darkSquareStyle: { backgroundColor: '#779952' },
                lightSquareStyle: { backgroundColor: '#edeed1' },
              }}
            />
          </div>

          {}
          <div className="w-full mt-3 p-2.5 rounded-md bg-slate-50 border border-slate-200 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleStepOptimal(optimalStepIndex - 1)}
                disabled={optimalStepIndex <= 0}
                className="p-1.5 rounded bg-white hover:bg-slate-100 border border-slate-300 disabled:opacity-30 text-slate-700 transition"
                title="Step back in optimal line"
              >
                <ChevronLeft size={15} />
              </button>
              <button
                onClick={() => handleStepOptimal(optimalStepIndex + 1)}
                disabled={optimalStepIndex >= optimalHistory.length - 1}
                className="p-1.5 rounded bg-white hover:bg-slate-100 border border-slate-300 disabled:opacity-30 text-slate-700 transition"
                title="Step forward in optimal line"
              >
                <ChevronRight size={15} />
              </button>
            </div>

            <div className="text-xs text-slate-600 flex items-center gap-1.5 truncate">
              <span className="text-slate-400">Step {optimalStepIndex + 1}/{Math.max(1, optimalHistory.length)}:</span>
              <span className="font-mono font-bold text-slate-900">
                {currentOptimalMove?.san || currentMove.bestMoveSan}
              </span>
            </div>

            <span className="text-xs font-mono font-medium text-slate-900">
              {(() => {
                if (currentMove.bestMoveScore === undefined) return 'Optimal';
                if (currentMove.bestMoveIsMate) {
                  if (currentMove.bestMoveMateIn === 0 || Math.abs(currentMove.bestMoveScore) >= 50000) {
                    return currentMove.bestMoveScore >= 0 ? '1-0' : '0-1';
                  }
                  if (currentMove.bestMoveMateIn !== undefined) {
                    return currentMove.bestMoveMateIn > 0
                      ? `+M${currentMove.bestMoveMateIn}`
                      : `-M${Math.abs(currentMove.bestMoveMateIn)}`;
                  }
                  return currentMove.bestMoveScore > 0 ? '+Mate' : '-Mate';
                }
                const pawns = currentMove.bestMoveScore / 100;
                return pawns > 0 ? `+${pawns.toFixed(2)}` : pawns.toFixed(2);
              })()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
