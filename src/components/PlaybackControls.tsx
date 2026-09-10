import React, { useEffect } from 'react';
import { 
  ChevronsLeft, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsRight, 
  Play, 
  Pause, 
  RotateCcw
} from 'lucide-react';

interface Props {
  currentPly: number;
  totalPly: number;
  isPlaying: boolean;
  onJumpToStart: () => void;
  onPrev: () => void;
  onNext: () => void;
  onJumpToEnd: () => void;
  onTogglePlay: () => void;
  onFlipBoard: () => void;
  orientation: 'white' | 'black';
  disabled?: boolean;
}

export const PlaybackControls: React.FC<Props> = ({
  currentPly,
  totalPly,
  isPlaying,
  onJumpToStart,
  onPrev,
  onNext,
  onJumpToEnd,
  onTogglePlay,
  onFlipBoard,
  orientation,
  disabled = false,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (disabled) return;
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        onPrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        onNext();
      } else if (e.key === 'Home') {
        e.preventDefault();
        onJumpToStart();
      } else if (e.key === 'End') {
        e.preventDefault();
        onJumpToEnd();
      } else if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        onTogglePlay();
      } else if (e.key.toLowerCase() === 'f') {
        e.preventDefault();
        onFlipBoard();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [disabled, onPrev, onNext, onJumpToStart, onJumpToEnd, onTogglePlay, onFlipBoard]);

  return (
    <div className="flex flex-col gap-2 w-full bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-lg p-3 shadow-xs transition-colors">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <button
            onClick={onJumpToStart}
            disabled={currentPly === 0}
            title="Start (Home key)"
            className="p-2 rounded-md bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 border border-slate-300 dark:border-zinc-700 disabled:opacity-30 transition text-slate-700 dark:text-zinc-200"
          >
            <ChevronsLeft size={17} />
          </button>

          <button
            onClick={onPrev}
            disabled={currentPly === 0}
            title="Previous Move (Left Arrow)"
            className="p-2 rounded-md bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 border border-slate-300 dark:border-zinc-700 disabled:opacity-30 transition text-slate-700 dark:text-zinc-200"
          >
            <ChevronLeft size={17} />
          </button>

          <button
            onClick={onTogglePlay}
            disabled={totalPly === 0}
            title={isPlaying ? 'Pause (Space)' : 'Auto-play (Space)'}
            className={`p-2 rounded-md font-medium flex items-center gap-1 transition ${
              isPlaying
                ? 'bg-amber-600 hover:bg-amber-700 text-white'
                : 'bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-zinc-200 text-white dark:text-black font-semibold'
            }`}
          >
            {isPlaying ? <Pause size={17} /> : <Play size={17} />}
          </button>

          <button
            onClick={onNext}
            disabled={currentPly >= totalPly}
            title="Next Move (Right Arrow)"
            className="p-2 rounded-md bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 border border-slate-300 dark:border-zinc-700 disabled:opacity-30 transition text-slate-700 dark:text-zinc-200"
          >
            <ChevronRight size={17} />
          </button>

          <button
            onClick={onJumpToEnd}
            disabled={currentPly >= totalPly}
            title="End of Game (End key)"
            className="p-2 rounded-md bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 border border-slate-300 dark:border-zinc-700 disabled:opacity-30 transition text-slate-700 dark:text-zinc-200"
          >
            <ChevronsRight size={17} />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onFlipBoard}
            title="Flip Board View (F key)"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 border border-slate-300 dark:border-zinc-700 text-xs font-medium text-slate-700 dark:text-zinc-200 transition"
          >
            <RotateCcw size={13} className="text-slate-500 dark:text-zinc-400" />
            <span>Flip ({orientation === 'white' ? 'White' : 'Black'})</span>
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-zinc-400 px-1">
        <span>
          Move: <strong className="text-slate-800 dark:text-zinc-200 font-mono">{Math.floor((currentPly + 1) / 2)}</strong> / {Math.floor((totalPly + 1) / 2)} (Ply {currentPly}/{totalPly})
        </span>
        <span className="hidden sm:inline text-slate-400 dark:text-zinc-500">
          Keys: <kbd className="px-1 py-0.5 bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded text-[10px] text-slate-700 dark:text-zinc-300">Left</kbd> <kbd className="px-1 py-0.5 bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded text-[10px] text-slate-700 dark:text-zinc-300">Right</kbd> <kbd className="px-1 py-0.5 bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded text-[10px] text-slate-700 dark:text-zinc-300">Space</kbd> <kbd className="px-1 py-0.5 bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded text-[10px] text-slate-700 dark:text-zinc-300">F</kbd>
        </span>
      </div>
    </div>
  );
};
