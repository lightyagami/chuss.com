import React from 'react';
import { 
  Upload, 
  RotateCcw, 
  Layers, 
  Zap, 
  Radio, 
  Sun, 
  Moon, 
  BookOpen, 
  Target, 
  Shield, 
  Users, 
  FileDown,
  Camera
} from 'lucide-react';

export type AppMode = 'review' | 'live' | 'openings' | 'batch' | 'scout' | 'compare';

interface Props {
  mode: AppMode;
  onSelectMode: (m: AppMode) => void;
  onOpenImport: () => void;
  orientation: 'white' | 'black';
  onFlipBoard: () => void;
  showDualBoard: boolean;
  onToggleDualBoard: () => void;
  onReanalyze: () => void;
  isAnalyzing: boolean;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onOpenTacticsQuiz?: () => void;
  onExportPgn?: () => void;
  onExportImage?: () => void;
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
  onOpenTacticsQuiz,
  onExportPgn,
  onExportImage,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-black/95 backdrop-blur-md border-b border-slate-200 dark:border-zinc-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 shrink-0">
          <div 
            onClick={() => onSelectMode('review')}
            className="flex items-center gap-2 cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-slate-900 dark:bg-white flex items-center justify-center text-white dark:text-black font-bold text-base shadow-xs">
              ♔
            </div>
            <div className="hidden sm:block">
              <h1 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                Chess Move Analyzer
              </h1>
              <p className="text-[10px] text-slate-500 dark:text-zinc-400">
                Stockfish Engine
              </p>
            </div>
          </div>

          <div className="flex items-center bg-slate-100 dark:bg-zinc-900 p-0.5 rounded-lg border border-slate-200 dark:border-zinc-800 text-xs font-medium overflow-x-auto max-w-[280px] sm:max-w-none scrollbar-none">
            <button
              onClick={() => onSelectMode('review')}
              className={`px-2.5 py-1 rounded-md transition shrink-0 ${
                mode === 'review'
                  ? 'bg-white dark:bg-black text-slate-900 dark:text-white shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Review
            </button>
            <button
              onClick={() => onSelectMode('live')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition shrink-0 ${
                mode === 'live'
                  ? 'bg-white dark:bg-black text-emerald-800 dark:text-emerald-400 shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Radio size={11} className={mode === 'live' ? 'text-emerald-600 dark:text-emerald-400 animate-pulse' : 'text-slate-400'} />
              <span>Live</span>
            </button>
            <button
              onClick={() => onSelectMode('openings')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition shrink-0 ${
                mode === 'openings'
                  ? 'bg-white dark:bg-black text-sky-800 dark:text-sky-400 shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <BookOpen size={11} />
              <span>Openings</span>
            </button>
            <button
              onClick={() => onSelectMode('batch')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition shrink-0 ${
                mode === 'batch'
                  ? 'bg-white dark:bg-black text-purple-800 dark:text-purple-400 shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Layers size={11} />
              <span>Batch</span>
            </button>
            <button
              onClick={() => onSelectMode('scout')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition shrink-0 ${
                mode === 'scout'
                  ? 'bg-white dark:bg-black text-amber-800 dark:text-amber-400 shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Shield size={11} />
              <span>Scout</span>
            </button>
            <button
              onClick={() => onSelectMode('compare')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition shrink-0 ${
                mode === 'compare'
                  ? 'bg-white dark:bg-black text-cyan-800 dark:text-cyan-400 shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Users size={11} />
              <span>Compare</span>
            </button>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-1.5 sm:gap-2">
          {mode === 'review' && (
            <>
              {onOpenTacticsQuiz && (
                <button
                  onClick={onOpenTacticsQuiz}
                  className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-md bg-amber-50 dark:bg-zinc-900 hover:bg-amber-100 dark:hover:bg-zinc-800 border border-amber-200 dark:border-zinc-800 text-xs font-semibold text-amber-700 dark:text-amber-400 transition"
                  title="Practice Missed Wins Quiz"
                >
                  <Target size={13} />
                  <span className="hidden md:inline">Quiz</span>
                </button>
              )}

              {onExportPgn && (
                <button
                  onClick={onExportPgn}
                  className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-md bg-white dark:bg-zinc-950 hover:bg-slate-50 dark:hover:bg-zinc-900 border border-slate-300 dark:border-zinc-800 text-xs font-medium text-slate-700 dark:text-zinc-200 transition"
                  title="Export Annotated PGN with evaluations"
                >
                  <FileDown size={13} />
                  <span className="hidden md:inline">PGN</span>
                </button>
              )}

              {onExportImage && (
                <button
                  onClick={onExportImage}
                  className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-md bg-white dark:bg-zinc-950 hover:bg-slate-50 dark:hover:bg-zinc-900 border border-slate-300 dark:border-zinc-800 text-xs font-medium text-slate-700 dark:text-zinc-200 transition"
                  title="Export Board Card as Image"
                >
                  <Camera size={13} />
                  <span className="hidden md:inline">PNG</span>
                </button>
              )}

              <div className="hidden sm:flex items-center bg-slate-100 dark:bg-zinc-900 p-0.5 rounded-lg border border-slate-200 dark:border-zinc-800 text-xs font-medium">
                <button
                  onClick={onFlipBoard}
                  className="flex items-center gap-1 px-2 py-1 rounded-md text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white transition"
                  title="Toggle Board Perspective"
                >
                  <RotateCcw size={12} className="text-slate-500 dark:text-zinc-400" />
                  <span className="capitalize">{orientation}</span>
                </button>

                <div className="w-[1px] h-3.5 bg-slate-300 dark:bg-zinc-700 mx-0.5" />

                <button
                  onClick={onToggleDualBoard}
                  className={`flex items-center gap-1 px-2 py-1 rounded-md transition ${
                    showDualBoard
                      ? 'bg-white dark:bg-black text-slate-900 dark:text-white font-semibold shadow-xs'
                      : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title="Toggle Dual Board View"
                >
                  <Layers size={12} />
                  <span>{showDualBoard ? 'Dual' : 'Single'}</span>
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={onReanalyze}
                  disabled={isAnalyzing}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-white dark:bg-zinc-950 hover:bg-slate-50 dark:hover:bg-zinc-900 border border-slate-300 dark:border-zinc-800 text-xs font-semibold text-slate-800 dark:text-zinc-200 disabled:opacity-50 transition"
                >
                  <Zap size={13} className="text-amber-500 shrink-0" />
                  <span className="hidden sm:inline">{isAnalyzing ? '...' : 'Analyze'}</span>
                </button>

                <button
                  onClick={onOpenImport}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-zinc-100 text-xs font-semibold text-white dark:text-black transition shadow-xs"
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
