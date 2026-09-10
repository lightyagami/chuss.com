import React, { useState, useRef, useEffect } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { X, CheckCircle2, RotateCcw, Sparkles, HelpCircle, ArrowRight } from 'lucide-react';
import type { MoveAnalysis } from '../types/chess';
import { soundEffects } from '../services/soundEffects';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  move?: MoveAnalysis | null;
  orientation?: 'white' | 'black';
}

export const PracticeAlternativeModal: React.FC<Props> = ({
  isOpen,
  onClose,
  move,
  orientation = 'white',
}) => {
  const [fen, setFen] = useState<string>(() => move?.fenBefore || new Chess().fen());
  const [status, setStatus] = useState<'playing' | 'solved' | 'wrong'>('playing');
  const [message, setMessage] = useState<string>('Find and play the optimal move for this position.');
  const [showHint, setShowHint] = useState<boolean>(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearPendingTimeout = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  useEffect(() => {
    return () => clearPendingTimeout();
  }, []);

  useEffect(() => {
    clearPendingTimeout();
    if (move?.fenBefore) {
      setFen(move.fenBefore);
      setStatus('playing');
      setMessage('Find and play the optimal move for this position.');
      setShowHint(false);
    }
  }, [move]);

  if (!isOpen || !move) return null;

  const handleReset = () => {
    clearPendingTimeout();
    setFen(move.fenBefore);
    setStatus('playing');
    setMessage('Find and play the optimal move for this position.');
    setShowHint(false);
  };

  const handlePieceDrop = ({ sourceSquare, targetSquare }: { sourceSquare: string; targetSquare: string | null }): boolean => {
    if (status === 'solved' || !targetSquare) return false;

    try {
      const chess = new Chess(fen);
      const attemptedMove = chess.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q',
      });

      if (!attemptedMove) return false;

      const isTargetOptimal =
        (move.bestMoveFrom && move.bestMoveTo && attemptedMove.from === move.bestMoveFrom && attemptedMove.to === move.bestMoveTo) ||
        (move.bestMoveSan && attemptedMove.san === move.bestMoveSan);

      if (isTargetOptimal) {
        setFen(chess.fen());
        setStatus('solved');
        soundEffects.playBrilliant();
        setMessage(`Brilliant! You found the optimal move: ${attemptedMove.san}`);

        if (move.optimalLine && move.optimalLine.length > 1) {
          timeoutRef.current = setTimeout(() => {
            try {
              const counter = move.optimalLine[1];
              const counterRes = chess.move(counter);
              if (counterRes) {
                setFen(chess.fen());
                soundEffects.playMove();
                setMessage(`Solved! Engine responded: ${counterRes.san}`);
              }
            } catch {}
          }, 600);
        }
        return true;
      } else {
        setStatus('wrong');
        soundEffects.playBlunder();
        setMessage(`Not quite. ${attemptedMove.san} is not the best move. Try again!`);
        timeoutRef.current = setTimeout(() => {
          setFen(move.fenBefore);
          setStatus('playing');
        }, 800);
        return true;
      }
    } catch {
      return false;
    }
  };

  const boardOrientation = orientation === 'white' ? (move.color === 'w' ? 'white' : 'black') : 'white';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400">
              <Sparkles size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Practice Optimal Alternative
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                Move {move.moveNumber} ({move.color === 'w' ? 'White' : 'Black'}) to play
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-900 transition"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 flex flex-col items-center gap-4">
          <div className={`w-full p-3 rounded-xl border text-xs font-medium flex items-center justify-between transition-colors ${
            status === 'solved'
              ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
              : status === 'wrong'
              ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300'
              : 'bg-slate-50 dark:bg-zinc-900/60 border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300'
          }`}>
            <div className="flex items-center gap-2">
              {status === 'solved' ? (
                <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
              ) : (
                <HelpCircle size={16} className="text-slate-400 shrink-0" />
              )}
              <span>{message}</span>
            </div>
            <button
              onClick={handleReset}
              className="p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/10 text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white transition"
              title="Reset Position"
            >
              <RotateCcw size={14} />
            </button>
          </div>

          <div className="w-full max-w-[360px] aspect-square rounded-xl overflow-hidden border border-slate-200 dark:border-zinc-800 shadow-md">
            <Chessboard
              options={{
                position: fen,
                boardOrientation,
                allowDragging: status !== 'solved',
                onPieceDrop: ({ sourceSquare, targetSquare }) =>
                  handlePieceDrop({ sourceSquare, targetSquare }),
                darkSquareStyle: { backgroundColor: '#779952' },
                lightSquareStyle: { backgroundColor: '#edeed1' },
                animationDurationInMs: 200,
              }}
            />
          </div>

          <div className="w-full flex items-center justify-between pt-1 text-xs">
            <button
              type="button"
              onClick={() => setShowHint(true)}
              disabled={showHint || status === 'solved'}
              className="text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white underline disabled:opacity-40"
            >
              Need a hint?
            </button>

            {showHint && move.bestMoveFrom && (
              <span className="font-mono text-indigo-600 dark:text-indigo-400 font-medium">
                Hint: Piece on {move.bestMoveFrom}
              </span>
            )}

            {status === 'solved' && (
              <button
                type="button"
                onClick={onClose}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs transition"
              >
                <span>Continue Replay</span>
                <ArrowRight size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
