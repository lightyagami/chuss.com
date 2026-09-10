import React from 'react';
import { Upload, RotateCcw, Layers, Zap, Eye, Radio, Sun, Moon } from 'lucide-react';

interface Props {
  mode: 'review' | 'live';
  onSelectMode: (mode: 'review' | 'live') => void;
  onOpenImport: () => void;
  orientation: 'white' | 'black';
  onFlipBoard: () => void;
  showDualBoard: boolean;
  onToggleDualBoard: () => void;
  onReanalyze: () => void;
  isAnalyzing: boolean;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export const Navbar: React.FC<Props> = ({
  mode,
  onSelectMode,
  onOpenImport,
  orientation,
  onFlipBoard,
  showDualBoard,
  onToggleDualBoard,
  onReanalyze,
  isAnalyzing,
  theme,
  onToggleTheme,
}) => {
  return (
    <header className="w-full bg-white dark:bg-black border-b border-slate-200 dark:border-zinc-800 sticky top-0 z-40 px-4 py-3 shadow-xs transition-colors">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Brand & Mode Switcher */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-slate-900 dark:bg-zinc-900 border dark:border-zinc-700 flex items-center justify-center text-white shadow-xs">
              <Eye size={18} />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                Chess Move Analyzer
              </h1>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                Stockfish Engine
              </p>
            </div>
          </div>

          {/* Mode Pill Toggle: Game Review vs Live Match */}
          <div className="flex items-center bg-slate-100 dark:bg-zinc-900 p-1 rounded-lg border border-slate-200 dark:border-zinc-800 text-xs font-medium">
            <button
              onClick={() => onSelectMode('review')}
              className={`px-3 py-1 rounded-md transition ${
                mode === 'review'
                  ? 'bg-white dark:bg-black text-slate-900 dark:text-white shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Review
            </button>
            <button
              onClick={() => onSelectMode('live')}
              className={`flex items-center gap-1 px-3 py-1 rounded-md transition ${
                mode === 'live'
                  ? 'bg-white dark:bg-black text-emerald-800 dark:text-emerald-400 shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Radio size={12} className={mode === 'live' ? 'text-emerald-600 dark:text-emerald-400 animate-pulse' : 'text-slate-400'} />
              <span>Live Match</span>
            </button>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center flex-wrap gap-2 sm:gap-3">
          {mode === 'review' && (
            <>
              <div className="flex items-center bg-slate-100 dark:bg-zinc-900 p-0.5 rounded-lg border border-slate-200 dark:border-zinc-800 text-xs font-medium">
                <button
                  onClick={onFlipBoard}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-md text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-zinc-800/60 transition"
                  title="Toggle Board Perspective (White / Black)"
                >
                  <RotateCcw size={12} className="text-slate-500 dark:text-zinc-400 shrink-0" />
                  <span className="hidden sm:inline">Side:</span>
                  <span className="font-semibold text-slate-900 dark:text-white capitalize">{orientation}</span>
                </button>

                <div className="w-[1px] h-3.5 bg-slate-300 dark:bg-zinc-700 mx-0.5" />

                <button
                  onClick={onToggleDualBoard}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition ${
                    showDualBoard
                      ? 'bg-white dark:bg-black text-slate-900 dark:text-white font-semibold shadow-xs'
                      : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title="Toggle Side-by-Side Dual Board Comparison"
                >
                  <Layers size={12} className="shrink-0" />
                  <span>{showDualBoard ? 'Dual Board' : 'Single Board'}</span>
                </button>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={onReanalyze}
                  disabled={isAnalyzing}
                  className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-md bg-white dark:bg-zinc-950 hover:bg-slate-50 dark:hover:bg-zinc-900 border border-slate-300 dark:border-zinc-800 text-xs font-semibold text-slate-800 dark:text-zinc-200 disabled:opacity-50 transition shadow-2xs"
                >
                  <Zap size={13} className="text-amber-500 shrink-0" />
                  <span className="hidden sm:inline">{isAnalyzing ? 'Analyzing...' : 'Re-Analyze'}</span>
                  <span className="sm:hidden">{isAnalyzing ? '...' : 'Analyze'}</span>
                </button>

                <button
                  onClick={onOpenImport}
                  className="flex items-center gap-1 sm:gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-md bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-zinc-100 text-xs font-semibold text-white dark:text-black transition shadow-xs"
                >
                  <Upload size={13} className="shrink-0" />
                  <span>Import</span>
                </button>
              </div>
            </>
          )}
          <button
            onClick={onToggleTheme}
            className="p-1.5 rounded-md bg-white dark:bg-zinc-950 hover:bg-slate-50 dark:hover:bg-zinc-900 border border-slate-300 dark:border-zinc-800 text-slate-700 dark:text-zinc-200 transition"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={15} className="text-amber-400" /> : <Moon size={15} className="text-slate-600" />}
          </button>
        </div>
      </div>
    </header>
  );
};
