import React from 'react';
import { Loader2 } from 'lucide-react';

interface Props {
  progress?: { current: number; total: number; message: string };
  depth: number;
}

export const AnalysisSkeleton: React.FC<Props> = ({ progress, depth }) => {
  const percent = progress && progress.total > 0
    ? Math.round((progress.current / progress.total) * 100)
    : 0;

  return (
    <div className="flex flex-col gap-5 animate-pulse">
      <div className="bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-lg p-4 shadow-xs flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Loader2 size={16} className="text-amber-500 animate-spin" />
            <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Evaluating Move Positions
            </span>
          </div>
          <span className="text-xs font-mono font-semibold text-slate-700 dark:text-zinc-300">
            Depth {depth} &bull; {percent}%
          </span>
        </div>

        <div className="w-full h-2 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-slate-900 dark:bg-sky-500 transition-all duration-300 rounded-full"
            style={{ width: `${Math.max(4, percent)}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-zinc-400">
          <span>{progress?.message || 'Stockfish is calculating multi-pv continuations...'}</span>
          <span>
            {progress ? `${progress.current} of ${progress.total} plies` : 'Initializing engine...'}
          </span>
        </div>
      </div>
      <div className="bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-lg p-4 shadow-xs flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
          <div className="h-4 w-32 bg-slate-200 dark:bg-zinc-800 rounded" />
          <div className="h-5 w-16 bg-slate-200 dark:bg-zinc-800 rounded-full" />
        </div>

        <div className="h-10 w-full bg-slate-100 dark:bg-zinc-900/60 rounded-md" />

        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-md bg-slate-50 dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800 h-16 flex flex-col justify-between">
            <div className="h-3 w-16 bg-slate-200 dark:bg-zinc-700 rounded" />
            <div className="h-5 w-24 bg-slate-300 dark:bg-zinc-600 rounded" />
          </div>
          <div className="p-3 rounded-md bg-slate-50 dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800 h-16 flex flex-col justify-between">
            <div className="h-3 w-16 bg-slate-200 dark:bg-zinc-700 rounded" />
            <div className="h-5 w-24 bg-slate-300 dark:bg-zinc-600 rounded" />
          </div>
        </div>

        <div className="h-12 w-full bg-slate-100 dark:bg-zinc-900/40 rounded-md" />
      </div>
      <div className="bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-lg p-3 shadow-xs flex flex-col gap-2 h-[260px] overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-2 px-1">
          <div className="h-3 w-20 bg-slate-200 dark:bg-zinc-800 rounded" />
          <div className="h-3 w-24 bg-slate-200 dark:bg-zinc-800 rounded" />
        </div>

        <div className="flex flex-col gap-1.5 pt-1">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex items-center gap-2 px-2 py-1.5 rounded bg-slate-50 dark:bg-zinc-900/50">
              <span className="w-5 text-[11px] font-mono text-slate-400 dark:text-zinc-500">{i}.</span>
              <div className="h-4 flex-1 bg-slate-200 dark:bg-zinc-800 rounded" />
              <div className="h-4 flex-1 bg-slate-200 dark:bg-zinc-800 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
