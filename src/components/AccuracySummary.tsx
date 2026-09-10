import React from 'react';
import type { GameAnalysisResult } from '../types/chess';
import { 
  Sparkles, 
  CheckCircle2, 
  Star,
  ThumbsUp,
  BookOpen,
  HelpCircle,
  AlertTriangle, 
  AlertOctagon, 
  XCircle, 
  Award 
} from 'lucide-react';

interface Props {
  analysis: GameAnalysisResult;
}

export const AccuracySummary: React.FC<Props> = ({ analysis }) => {
  const { whiteAccuracy, blackAccuracy, whiteStats, blackStats, headers } = analysis;

  const getAccuracyColor = (acc: number) => {
    if (acc >= 90) return 'text-emerald-700';
    if (acc >= 75) return 'text-teal-700';
    if (acc >= 60) return 'text-amber-700';
    return 'text-red-700';
  };

  const getBarColor = (acc: number) => {
    if (acc >= 90) return 'bg-emerald-600';
    if (acc >= 75) return 'bg-teal-600';
    if (acc >= 60) return 'bg-amber-500';
    return 'bg-red-600';
  };

  const statCategories = [
    { label: 'Brilliant', icon: Sparkles, color: 'text-cyan-700', key: 'brilliant' as const },
    { label: 'Best Moves', icon: CheckCircle2, color: 'text-emerald-700', key: 'best' as const },
    { label: 'Excellent', icon: Star, color: 'text-teal-700', key: 'excellent' as const },
    { label: 'Good', icon: ThumbsUp, color: 'text-blue-700', key: 'good' as const },
    { label: 'Book Moves', icon: BookOpen, color: 'text-slate-600', key: 'book' as const },
    { label: 'Inaccuracies', icon: HelpCircle, color: 'text-amber-700', key: 'inaccuracy' as const },
    { label: 'Mistakes', icon: AlertTriangle, color: 'text-orange-700', key: 'mistake' as const },
    { label: 'Blunders', icon: AlertOctagon, color: 'text-red-700', key: 'blunder' as const },
    { label: 'Missed Wins', icon: XCircle, color: 'text-rose-700', key: 'missed_win' as const },
  ];

  return (
    <div className="bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-lg p-4 shadow-xs flex flex-col gap-4 transition-colors">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-2">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
          <Award size={16} className="text-slate-700 dark:text-zinc-300" />
          Game Performance &amp; Accuracy
        </h3>
        <span className="text-xs font-mono text-slate-500 dark:text-zinc-400">
          Result: <strong className="text-slate-900 dark:text-white">{headers.Result || '*'}</strong>
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-50 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 rounded-md p-3 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-700 dark:text-zinc-300 truncate max-w-[120px]">
              {headers.White || 'White'}
            </span>
            <span className={`text-xl font-bold font-mono ${getAccuracyColor(whiteAccuracy)}`}>
              {whiteAccuracy}%
            </span>
          </div>
          <div className="w-full h-2 bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div
              className={`h-full ${getBarColor(whiteAccuracy)} rounded-full transition-all duration-500`}
              style={{ width: `${whiteAccuracy}%` }}
            />
          </div>
        </div>
        <div className="bg-slate-50 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 rounded-md p-3 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-700 dark:text-zinc-300 truncate max-w-[120px]">
              {headers.Black || 'Black'}
            </span>
            <span className={`text-xl font-bold font-mono ${getAccuracyColor(blackAccuracy)}`}>
              {blackAccuracy}%
            </span>
          </div>
          <div className="w-full h-2 bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div
              className={`h-full ${getBarColor(blackAccuracy)} rounded-full transition-all duration-500`}
              style={{ width: `${blackAccuracy}%` }}
            />
          </div>
        </div>
      </div>
      <div className="space-y-1 pt-1 text-xs">
        {statCategories.map((cat) => {
          const Icon = cat.icon;
          const whiteCount = whiteStats[cat.key] || 0;
          const blackCount = blackStats[cat.key] || 0;

          return (
            <div
              key={cat.key}
              className="grid grid-cols-[1fr_auto_1fr] items-center px-2 py-1 rounded bg-slate-50/70 dark:bg-zinc-900/30 hover:bg-slate-100 dark:hover:bg-zinc-900/80 transition"
            >
              <span className="font-mono font-semibold text-slate-800 dark:text-zinc-200 text-left pl-2">
                {whiteCount}
              </span>
              <div className="flex items-center justify-center gap-1.5 text-slate-600 dark:text-zinc-300 font-medium">
                <Icon size={13} className={cat.color} />
                <span>{cat.label}</span>
              </div>
              <span className="font-mono font-semibold text-slate-800 dark:text-zinc-200 text-right pr-2">
                {blackCount}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
