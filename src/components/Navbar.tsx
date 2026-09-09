import React from 'react';
import { Upload, RotateCcw, Layers, Zap, Eye } from 'lucide-react';

interface Props {
  onOpenImport: () => void;
  orientation: 'white' | 'black';
  onFlipBoard: () => void;
  showDualBoard: boolean;
  onToggleDualBoard: () => void;
  onReanalyze: () => void;
  isAnalyzing: boolean;
}

export const Navbar: React.FC<Props> = ({
  onOpenImport,
  orientation,
  onFlipBoard,
  showDualBoard,
  onToggleDualBoard,
  onReanalyze,
  isAnalyzing,
}) => {
  return (
    <header className="w-full bg-white border-b border-slate-200 sticky top-0 z-40 px-4 py-3 shadow-xs">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-md bg-slate-900 flex items-center justify-center text-white">
            <Eye size={18} />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 leading-tight">
              Chess Move Analyzer
            </h1>
            <p className="text-[11px] text-slate-500">
              Stockfish Engine &amp; Optimal Play Comparison
            </p>
          </div>
        </div>

        {}
        <div className="flex items-center flex-wrap gap-1.5 sm:gap-2">
          {}
          <button
            onClick={onFlipBoard}
            className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-md bg-white hover:bg-slate-50 border border-slate-300 text-xs font-medium text-slate-700 transition"
            title="Toggle Board Perspective (White / Black)"
          >
            <RotateCcw size={13} className="text-slate-500 shrink-0" />
            <span className="hidden sm:inline">Side: </span>
            <span className="font-semibold text-slate-900 capitalize">{orientation}</span>
          </button>

          {}
          <button
            onClick={onToggleDualBoard}
            className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-md border text-xs font-medium transition ${
              showDualBoard
                ? 'bg-slate-900 border-slate-900 text-white'
                : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-700'
            }`}
            title="Toggle Side-by-Side Dual Board Comparison"
          >
            <Layers size={13} className="shrink-0" />
            <span>{showDualBoard ? 'Dual' : 'Single'}</span>
          </button>

          {}
          <button
            onClick={onReanalyze}
            disabled={isAnalyzing}
            className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-md bg-white hover:bg-slate-50 border border-slate-300 text-xs font-medium text-slate-700 disabled:opacity-50 transition"
          >
            <Zap size={13} className="text-slate-600 shrink-0" />
            <span className="hidden sm:inline">{isAnalyzing ? 'Analyzing...' : 'Re-Analyze'}</span>
            <span className="sm:hidden">{isAnalyzing ? '...' : 'Analyze'}</span>
          </button>

          {}
          <button
            onClick={onOpenImport}
            className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-xs font-medium text-white transition"
          >
            <Upload size={13} className="shrink-0" />
            <span>Import</span>
          </button>
        </div>
      </div>
    </header>
  );
};
