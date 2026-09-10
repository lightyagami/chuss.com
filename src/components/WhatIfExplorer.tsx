import React, { useState, useEffect } from 'react';
import { GitBranch, Play, Loader2, Award, ChevronRight } from 'lucide-react';
import { multiPvEngine, type MultiPvCandidate } from '../services/multiPvService';

interface Props {
  fen: string;
  onPreviewBranch?: (fen: string, sanMoves: string[]) => void;
  onSelectAlternativeMove?: (san: string) => void;
}

export const WhatIfExplorer: React.FC<Props> = ({
  fen,
  onSelectAlternativeMove,
}) => {
  const [branches, setBranches] = useState<MultiPvCandidate[]>([]);
  const [analyzingFen, setAnalyzingFen] = useState<string>('');
  const [selectedRank, setSelectedRank] = useState<number>(1);

  const loading = analyzingFen !== fen;

  useEffect(() => {
    let isCancelled = false;
    multiPvEngine
      .evaluateTopBranches(fen, 10, 3)
      .then((res) => {
        if (!isCancelled) {
          setBranches(res);
          setAnalyzingFen(fen);
          setSelectedRank(1);
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setAnalyzingFen(fen);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [fen]);

  const formatScore = (c: MultiPvCandidate) => {
    if (c.isMate) {
      if (c.mateIn === 0) return 'Mate';
      return `M${c.mateIn}`;
    }
    const pawns = c.score / 100;
    return pawns >= 0 ? `+${pawns.toFixed(2)}` : pawns.toFixed(2);
  };

  return (
    <div className="bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-lg p-4 shadow-xs flex flex-col gap-3 transition-colors">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-2.5">
        <div className="flex items-center gap-2">
          <GitBranch size={16} className="text-sky-500" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
            What-If Branch Explorer
          </span>
        </div>
        {loading && (
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-zinc-400 font-mono">
            <Loader2 size={13} className="animate-spin text-sky-500" />
            <span>Calculating top 3 branches...</span>
          </div>
        )}
      </div>

      <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
        Explore Stockfish's top candidate moves from this exact position to see alternative variations and evaluation differences.
      </p>

      <div className="flex flex-col gap-2">
        {branches.map((branch) => {
          const isSelected = selectedRank === branch.rank;
          return (
            <div
              key={branch.rank}
              onClick={() => setSelectedRank(branch.rank)}
              className={`p-3 rounded-lg border transition cursor-pointer flex flex-col gap-2 ${
                isSelected
                  ? 'bg-sky-50/50 dark:bg-zinc-900/80 border-sky-300 dark:border-sky-500/60'
                  : 'bg-slate-50/70 dark:bg-zinc-900/30 hover:bg-slate-100 dark:hover:bg-zinc-900/60 border-slate-200 dark:border-zinc-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300">
                    #{branch.rank}
                  </span>
                  <span className="text-sm font-mono font-bold text-slate-900 dark:text-white">
                    {branch.san}
                  </span>
                  {branch.rank === 1 && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                      <Award size={12} /> Best
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-zinc-200">
                    {formatScore(branch)}
                  </span>
                  {onSelectAlternativeMove && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectAlternativeMove(branch.san);
                      }}
                      className="p-1 rounded bg-sky-500 hover:bg-sky-400 text-white dark:text-slate-950 text-xs transition"
                      title="Play this move on board"
                    >
                      <Play size={11} className="fill-current" />
                    </button>
                  )}
                </div>
              </div>

              {branch.pvSan.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap text-xs font-mono text-slate-600 dark:text-zinc-400 pt-1 border-t border-slate-200/60 dark:border-zinc-800/60">
                  <span className="text-[10px] uppercase font-semibold text-slate-400 dark:text-zinc-500">
                    Continuation:
                  </span>
                  {branch.pvSan.slice(0, 5).map((san, idx) => (
                    <span
                      key={idx}
                      className="px-1.5 py-0.5 rounded bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300"
                    >
                      {san}
                    </span>
                  ))}
                  {branch.pvSan.length > 5 && (
                    <ChevronRight size={12} className="text-slate-400" />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
