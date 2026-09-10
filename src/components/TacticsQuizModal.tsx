import React, { useState, useMemo } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import type { Arrow } from 'react-chessboard';
import { X, Target, CheckCircle2, AlertCircle, RotateCcw, ChevronRight, Award, Trophy } from 'lucide-react';
import type { GameAnalysisResult } from '../types/chess';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  analysis: GameAnalysisResult | null;
}

interface PuzzleItem {
  id: number;
  moveNumber: number;
  color: 'w' | 'b';
  fenBefore: string;
  playedSan: string;
  bestSan: string;
  bestFrom: string;
  bestTo: string;
  optimalLine: string[];
  explanation?: string;
  type: 'blunder' | 'missed_win';
}

export const TacticsQuizModal: React.FC<Props> = ({ isOpen, onClose, analysis }) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [userMoveState, setUserMoveState] = useState<'unsolved' | 'correct' | 'incorrect'>('unsolved');
  const [score, setScore] = useState<number>(0);
  const [showSolutionArrow, setShowSolutionArrow] = useState<boolean>(false);
  const [boardFen, setBoardFen] = useState<string>('');

  const puzzles = useMemo<PuzzleItem[]>(() => {
    if (!analysis) return [];
    const list: PuzzleItem[] = [];
    for (let i = 0; i < analysis.moves.length; i++) {
      const m = analysis.moves[i];
      if ((m.classification === 'blunder' || m.classification === 'missed_win') && m.bestMoveSan && m.bestMoveFrom && m.bestMoveTo) {
        list.push({
          id: i,
          moveNumber: m.moveNumber,
          color: m.color,
          fenBefore: m.fenBefore,
          playedSan: m.san,
          bestSan: m.bestMoveSan,
          bestFrom: m.bestMoveFrom,
          bestTo: m.bestMoveTo,
          optimalLine: m.optimalLine,
          explanation: m.explanation,
          type: m.classification,
        });
      }
    }
    return list;
  }, [analysis]);

  const currentPuzzle = puzzles[currentIndex];

  const handlePieceDrop = ({ sourceSquare, targetSquare }: { sourceSquare: string; targetSquare: string | null }) => {
    if (!currentPuzzle || userMoveState === 'correct') return false;
    if (!targetSquare) return false;

    try {
      const c = new Chess(boardFen || currentPuzzle.fenBefore);
      const move = c.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q',
      });

      if (!move) return false;

      if (sourceSquare === currentPuzzle.bestFrom && targetSquare === currentPuzzle.bestTo) {
        setBoardFen(c.fen());
        setUserMoveState('correct');
        setScore((s) => s + 10);
        return true;
      } else {
        setUserMoveState('incorrect');
        return false;
      }
    } catch {
      return false;
    }
  };

  const handleNextPuzzle = () => {
    if (currentIndex < puzzles.length - 1) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      setUserMoveState('unsolved');
      setShowSolutionArrow(false);
      if (puzzles[nextIdx]) {
        setBoardFen(puzzles[nextIdx].fenBefore);
      }
    }
  };

  const handleRetry = () => {
    if (currentPuzzle) {
      setBoardFen(currentPuzzle.fenBefore);
    }
    setUserMoveState('unsolved');
    setShowSolutionArrow(false);
  };

  const arrows = useMemo<Arrow[]>(() => {
    if (!currentPuzzle || (!showSolutionArrow && userMoveState !== 'correct')) return [];
    return [{
      startSquare: currentPuzzle.bestFrom,
      endSquare: currentPuzzle.bestTo,
      color: 'rgba(16, 185, 129, 0.95)',
    }];
  }, [currentPuzzle, showSolutionArrow, userMoveState]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] transition-colors">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <Target className="text-amber-500" size={18} />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Critical Moments & Missed-Wins Quiz
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-zinc-900 border border-amber-200 dark:border-zinc-800 text-xs font-semibold text-amber-700 dark:text-amber-400">
              <Trophy size={13} />
              <span>{score} pts</span>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-900 transition"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {puzzles.length === 0 ? (
          <div className="p-10 text-center flex flex-col items-center gap-3 text-slate-500 dark:text-zinc-400">
            <Award size={36} className="text-emerald-500" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Clean Game!</h3>
            <p className="text-xs max-w-sm leading-relaxed">
              No severe blunders or missed wins were found in this game. Play or load a sharp tactical match to solve personal puzzles!
            </p>
          </div>
        ) : (
          <div className="p-5 flex flex-col gap-4 overflow-y-auto flex-1 items-center">
            <div className="w-full flex items-center justify-between text-xs text-slate-600 dark:text-zinc-400 pb-2 border-b border-slate-100 dark:border-zinc-800">
              <span className="font-semibold text-slate-900 dark:text-white">
                Puzzle {currentIndex + 1} of {puzzles.length}
              </span>
              <span className="capitalize px-2 py-0.5 rounded text-[11px] font-medium bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
                Turn: {currentPuzzle.color === 'w' ? 'White to Move' : 'Black to Move'} ({currentPuzzle.type.replace('_', ' ')})
              </span>
            </div>

            <div className="aspect-square w-full max-w-[400px] rounded-none overflow-hidden border border-slate-300 dark:border-zinc-800 shadow-sm relative bg-white dark:bg-black">
              <Chessboard
                options={{
                  position: boardFen || currentPuzzle.fenBefore,
                  boardOrientation: currentPuzzle.color === 'w' ? 'white' : 'black',
                  allowDragging: true,
                  onPieceDrop: ({ sourceSquare, targetSquare }) =>
                    handlePieceDrop({ sourceSquare, targetSquare }),
                  arrows,
                  darkSquareStyle: { backgroundColor: '#779952' },
                  lightSquareStyle: { backgroundColor: '#edeed1' },
                }}
              />
            </div>

            {userMoveState === 'unsolved' && (
              <p className="text-xs text-slate-500 dark:text-zinc-400 text-center">
                In the actual game, <strong className="text-slate-900 dark:text-white">{currentPuzzle.playedSan}</strong> was played. Can you find Stockfish's best move?
              </p>
            )}

            {userMoveState === 'correct' && (
              <div className="w-full p-3.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-start gap-2.5 text-xs text-emerald-900 dark:text-emerald-200 animate-in fade-in">
                <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div className="flex flex-col gap-1 flex-1">
                  <span className="font-bold">Correct! You found {currentPuzzle.bestSan}!</span>
                  <span className="text-[11px] text-emerald-800/80 dark:text-emerald-300/80 leading-relaxed">
                    {currentPuzzle.explanation || 'Optimal continuation found.'}
                  </span>
                </div>
              </div>
            )}

            {userMoveState === 'incorrect' && (
              <div className="w-full p-3.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 flex items-start gap-2.5 text-xs text-red-900 dark:text-red-200 animate-in fade-in">
                <AlertCircle size={18} className="text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                <div className="flex flex-col gap-1 flex-1">
                  <span className="font-bold">Not the best move. Try again!</span>
                  <span className="text-[11px] text-red-800/80 dark:text-red-300/80">
                    Look for tactical threats, captures, or checks.
                  </span>
                </div>
              </div>
            )}

            <div className="w-full flex items-center justify-between pt-2 border-t border-slate-100 dark:border-zinc-800 gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRetry}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-slate-100 dark:bg-zinc-900 hover:bg-slate-200 dark:hover:bg-zinc-800 text-xs font-medium text-slate-700 dark:text-zinc-200 border border-slate-300 dark:border-zinc-700 transition"
                >
                  <RotateCcw size={12} />
                  <span>Reset Board</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowSolutionArrow((p) => !p)}
                  className="px-3 py-1.5 rounded-md text-xs font-medium text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white transition underline"
                >
                  {showSolutionArrow ? 'Hide Answer' : 'Show Solution'}
                </button>
              </div>

              <button
                type="button"
                onClick={handleNextPuzzle}
                disabled={currentIndex >= puzzles.length - 1}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-md bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-zinc-100 text-white dark:text-black text-xs font-semibold disabled:opacity-40 transition shadow-xs"
              >
                <span>Next Puzzle</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
