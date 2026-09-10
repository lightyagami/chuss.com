import React from 'react';

interface Props {
  score: number;
  isMate?: boolean;
  mateIn?: number;
  orientation?: 'white' | 'black';
  height?: number | string;
}

export const EvalBar: React.FC<Props> = ({
  score,
  isMate = false,
  mateIn,
  orientation = 'white',
  height = '100%',
}) => {
  let whitePercent = 50;
  let label = '0.0';

  if (isMate) {
    if (mateIn === 0 || Math.abs(score) >= 50000) {
      if (score >= 0) {
        whitePercent = 100;
        label = '1-0';
      } else {
        whitePercent = 0;
        label = '0-1';
      }
    } else if (mateIn !== undefined) {
      if (mateIn > 0) {
        whitePercent = 100;
        label = `M${mateIn}`;
      } else {
        whitePercent = 0;
        label = `-M${Math.abs(mateIn)}`;
      }
    }
  } else {
    const winRate = 1 / (1 + Math.exp(-0.00368208 * score));
    whitePercent = Math.min(96, Math.max(4, winRate * 100));

    const pawns = score / 100;
    if (Math.abs(pawns) < 0.05) {
      label = '0.0';
    } else {
      label = pawns > 0 ? `+${pawns.toFixed(1)}` : pawns.toFixed(1);
    }
  }

  const topPercent = orientation === 'white' ? 100 - whitePercent : whitePercent;
  const bottomPercent = orientation === 'white' ? whitePercent : 100 - whitePercent;
  const isWhiteAdvantage = score > 0 || (isMate && (score >= 0 || (mateIn ?? 0) > 0));

  const showLabelOnTop = orientation === 'white' ? !isWhiteAdvantage : isWhiteAdvantage;
  const showLabelOnBottom = orientation === 'white' ? isWhiteAdvantage : !isWhiteAdvantage;

  return (
    <div
      style={{ height }}
      className="w-8 md:w-9 bg-white dark:bg-black border border-slate-300 dark:border-zinc-800 rounded-md overflow-hidden flex flex-col shadow-xs relative select-none transition-colors"
      title={`Evaluation: ${label}`}
    >
      <div
        style={{ height: `${topPercent}%` }}
        className={`transition-all duration-300 ease-out flex items-start justify-center pt-1.5 ${
          orientation === 'white' ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-900'
        }`}
      >
        {showLabelOnTop && topPercent > 12 && (
          <span className="text-[10px] md:text-xs font-bold font-mono tracking-tighter">
            {label}
          </span>
        )}
      </div>
      <div className="h-0.5 bg-slate-400 dark:bg-zinc-700 w-full shrink-0 z-10" />
      <div
        style={{ height: `${bottomPercent}%` }}
        className={`transition-all duration-300 ease-out flex items-end justify-center pb-1.5 ${
          orientation === 'white' ? 'bg-white text-slate-900' : 'bg-slate-800 text-white'
        }`}
      >
        {showLabelOnBottom && bottomPercent > 12 && (
          <span className="text-[10px] md:text-xs font-bold font-mono tracking-tighter">
            {label}
          </span>
        )}
      </div>
    </div>
  );
};
