import React from 'react';
import type { GameHeaders } from '../types/chess';
import { Calendar, Clock, Award } from 'lucide-react';

interface Props {
  headers: GameHeaders;
  whiteAccuracy?: number;
  blackAccuracy?: number;
  isAnalyzing: boolean;
  progress?: { current: number; total: number; message: string };
}

export const GameHeader: React.FC<Props> = ({
  headers,
  whiteAccuracy,
  blackAccuracy,
  isAnalyzing,
  progress,
}) => {
  return (
    <div className="w-full bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-xl p-3 sm:p-4 shadow-xs flex flex-col gap-3 transition-colors">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-md bg-slate-100 dark:bg-zinc-900 border border-slate-300 dark:border-zinc-800 flex items-center justify-center font-bold text-slate-800 dark:text-slate-100 shrink-0 text-xs sm:text-sm">
            W
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="font-bold text-sm sm:text-base text-slate-900 dark:text-white truncate">
                {headers.White || 'White'}
              </span>
              {headers.WhiteElo && (
                <span className="hidden sm:inline-block text-xs px-1.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 font-mono text-slate-600 dark:text-zinc-300 shrink-0">
                  {headers.WhiteElo}
                </span>
              )}
            </div>
            {whiteAccuracy !== undefined && (
              <span className="text-[11px] sm:text-xs text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-1 mt-0.5 truncate">
                <Award size={12} className="shrink-0" /> {whiteAccuracy}%
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-col items-center px-1 sm:px-3 shrink-0">
          <span className="text-sm sm:text-base font-bold font-mono text-slate-900 dark:text-white bg-slate-100 dark:bg-zinc-900 px-2 sm:px-3 py-0.5 sm:py-1 rounded border border-slate-200 dark:border-zinc-800">
            {headers.Result || '*'}
          </span>
          <div className="hidden sm:flex items-center gap-2 text-[10px] text-slate-500 dark:text-zinc-400 mt-1">
            {headers.Date && (
              <span className="flex items-center gap-1">
                <Calendar size={10} className="text-slate-400 dark:text-zinc-500" />
                {headers.Date}
              </span>
            )}
            {headers.TimeControl && (
              <span className="flex items-center gap-1">
                <Clock size={10} className="text-slate-400 dark:text-zinc-500" />
                {headers.TimeControl}
              </span>
            )}
          </div>
          {headers.Termination && (
            <span className="hidden md:inline-block text-[10px] text-slate-500 dark:text-zinc-400 mt-0.5 italic text-center max-w-[200px] truncate" title={headers.Termination}>
              {headers.Termination}
            </span>
          )}
        </div>
        <div className="flex items-center justify-end gap-2 sm:gap-3 min-w-0">
          <div className="text-right min-w-0 flex-1">
            <div className="flex items-center gap-1.5 justify-end min-w-0">
              {headers.BlackElo && (
                <span className="hidden sm:inline-block text-xs px-1.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 font-mono text-slate-600 dark:text-zinc-300 shrink-0">
                  {headers.BlackElo}
                </span>
              )}
              <span className="font-bold text-sm sm:text-base text-slate-900 dark:text-white truncate">
                {headers.Black || 'Black'}
              </span>
            </div>
            {blackAccuracy !== undefined && (
              <span className="text-[11px] sm:text-xs text-emerald-700 dark:text-emerald-400 font-medium flex items-center justify-end gap-1 mt-0.5 truncate">
                <Award size={12} className="shrink-0" /> {blackAccuracy}%
              </span>
            )}
          </div>
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-md bg-slate-900 dark:bg-zinc-900 border border-slate-900 dark:border-zinc-800 flex items-center justify-center font-bold text-white shrink-0 text-xs sm:text-sm">
            B
          </div>
        </div>
      </div>
      {isAnalyzing && progress && (
        <div className="flex flex-col gap-1.5 pt-3 border-t border-slate-100 dark:border-zinc-800">
          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-zinc-400">
            <span className="font-medium">
              Stockfish Engine Analysis: {progress.message}
            </span>
            <span className="font-mono font-bold text-slate-900 dark:text-white">
              {Math.round((progress.current / progress.total) * 100)}% ({progress.current}/{progress.total})
            </span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 dark:bg-zinc-900 rounded-full overflow-hidden">
            <div
              className="h-full bg-slate-900 dark:bg-white transition-all duration-200"
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
