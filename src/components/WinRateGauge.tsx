import React from 'react';
import { calculateWinChance } from '../services/analyzer';

interface Props {
  evalScore: number;
  isMate?: boolean;
  mateIn?: number;
  whiteName: string;
  blackName: string;
}

export const WinRateGauge: React.FC<Props> = ({
  evalScore,
  isMate,
  mateIn,
  whiteName,
  blackName,
}) => {
  let whiteWinPct = Math.round(calculateWinChance(evalScore));
  if (isMate) {
    whiteWinPct = (mateIn ?? evalScore) > 0 ? 100 : 0;
  }
  const blackWinPct = 100 - whiteWinPct;

  const size = 96;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (whiteWinPct / 100) * circumference;

  return (
    <div className="glass-panel-subtle rounded-xl p-3 flex items-center justify-between gap-4">
      {}
      <div className="relative flex items-center justify-center shrink-0">
        <svg width={size} height={size} className="rotate-[-90deg]">
          {}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="rgba(244, 63, 94, 0.3)"
            strokeWidth={strokeWidth}
          />
          {}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="url(#winGaugeGradient)"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
          <defs>
            <linearGradient id="winGaugeGradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
          </defs>
        </svg>

        {}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-base font-bold font-mono text-white tracking-tighter">
            {whiteWinPct >= blackWinPct ? `${whiteWinPct}%` : `${blackWinPct}%`}
          </span>
          <span className="text-[9px] uppercase font-semibold tracking-wider text-slate-400">
            {whiteWinPct >= 50 ? 'White' : 'Black'}
          </span>
        </div>
      </div>

      {}
      <div className="flex flex-col gap-1.5 flex-1 min-w-0">
        <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400">
          Win Probability
        </span>

        {}
        <div className="space-y-1 text-xs font-mono">
          <div className="flex items-center justify-between">
            <span className="text-slate-300 truncate max-w-[90px]">{whiteName}</span>
            <span className="font-bold text-sky-400">{whiteWinPct}%</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden flex">
            <div
              className="h-full bg-gradient-to-r from-sky-400 to-emerald-400 transition-all duration-500 rounded-l-full"
              style={{ width: `${whiteWinPct}%` }}
            />
            <div
              className="h-full bg-gradient-to-r from-rose-500 to-amber-500 transition-all duration-500 rounded-r-full"
              style={{ width: `${blackWinPct}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-slate-400">
            <span className="truncate max-w-[90px]">{blackName}</span>
            <span className="font-bold text-rose-400">{blackWinPct}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};
