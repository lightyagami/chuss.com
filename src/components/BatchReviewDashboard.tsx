import React, { useState } from 'react';
import { Layers, Search, Loader2, Play, Award, TrendingUp, AlertTriangle } from 'lucide-react';
import { fetchRecentGamesByUsername, type ChessComGame } from '../services/chessComService';
import { analyzePgn, getOpeningName } from '../services/analyzer';
import type { GameAnalysisResult } from '../types/chess';

interface Props {
  onSelectGameToReview: (pgn: string) => void;
}

interface AnalyzedMatch {
  game: ChessComGame;
  analysis: GameAnalysisResult;
  opening: string;
}

export const BatchReviewDashboard: React.FC<Props> = ({ onSelectGameToReview }) => {
  const [username, setUsername] = useState<string>('demonexe2');
  const [searchedUser, setSearchedUser] = useState<string>('demonexe2');
  const [gameCount, setGameCount] = useState<number>(5);
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [progressMsg, setProgressMsg] = useState<string>('');
  const [matches, setMatches] = useState<AnalyzedMatch[]>([]);
  const [error, setError] = useState<string | null>(null);
  const isCancelledRef = React.useRef<boolean>(false);

  React.useEffect(() => {
    return () => {
      isCancelledRef.current = true;
    };
  }, []);

  const handleStartBatchAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUser = username.trim();
    if (!cleanUser) return;

    isCancelledRef.current = false;
    setSearchedUser(cleanUser);
    setError(null);
    setIsFetching(true);
    setMatches([]);

    try {
      setProgressMsg(`Fetching recent ${gameCount} games from Chess.com...`);
      const recentGames = await fetchRecentGamesByUsername(cleanUser, gameCount);

      if (isCancelledRef.current) return;

      if (recentGames.length === 0) {
        throw new Error(`No games found for "${cleanUser}".`);
      }

      const analyzedList: AnalyzedMatch[] = [];

      for (let i = 0; i < recentGames.length; i++) {
        if (isCancelledRef.current) break;
        const g = recentGames[i];
        setProgressMsg(`Analyzing match ${i + 1} of ${recentGames.length}...`);
        try {
          const result = await analyzePgn(
            g.pgn,
            10,
            undefined,
            () => isCancelledRef.current
          );
          let opening = 'Standard Opening';
          for (let m = Math.min(15, result.moves.length - 1); m >= 0; m--) {
            const name = getOpeningName(result.moves[m]?.fenAfter);
            if (name) {
              opening = name;
              break;
            }
          }
          analyzedList.push({
            game: g,
            analysis: result,
            opening,
          });
        } catch (e: any) {
          if (e?.message === 'Analysis cancelled') break;
          console.warn('Failed analyzing game in batch:', e);
        }
      }

      if (!isCancelledRef.current) {
        setMatches(analyzedList);
      }
    } catch (err: any) {
      if (!isCancelledRef.current) {
        setError(err?.message || 'Failed to complete batch analysis.');
      }
    } finally {
      if (!isCancelledRef.current) {
        setIsFetching(false);
        setProgressMsg('');
      }
    }
  };

  const avgAccuracy = matches.length > 0
    ? Math.round(
        matches.reduce((sum, m) => {
          const isWhite = m.game.white.username.toLowerCase() === searchedUser.toLowerCase();
          return sum + (isWhite ? m.analysis.whiteAccuracy : m.analysis.blackAccuracy);
        }, 0) / matches.length
      )
    : 0;

  const totalBlunders = matches.reduce((sum, m) => {
    const isWhite = m.game.white.username.toLowerCase() === searchedUser.toLowerCase();
    const stats = isWhite ? m.analysis.whiteStats : m.analysis.blackStats;
    return sum + (stats.blunder || 0);
  }, 0);

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-xl p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-sky-50 dark:bg-zinc-900 border border-sky-200 dark:border-zinc-800 text-sky-600 dark:text-sky-400">
            <Layers size={20} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Multi-Game Batch Review & Player Report Card
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Run full engine analysis across recent match history to track accuracy trends and blunder habits.
            </p>
          </div>
        </div>

        <form onSubmit={handleStartBatchAnalysis} className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-48">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 rounded-md text-xs text-slate-900 dark:text-white focus:outline-none focus:border-sky-500 transition"
            />
            <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
          </div>

          <select
            value={gameCount}
            onChange={(e) => setGameCount(Number(e.target.value))}
            className="px-2.5 py-1.5 bg-slate-50 dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 rounded-md text-xs text-slate-900 dark:text-white focus:outline-none"
          >
            <option value={3}>3 games</option>
            <option value={5}>5 games</option>
            <option value={10}>10 games</option>
          </select>

          <button
            type="submit"
            disabled={isFetching}
            className="px-4 py-1.5 rounded-md bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-zinc-100 text-white dark:text-black text-xs font-semibold disabled:opacity-50 transition flex items-center gap-1.5 shrink-0"
          >
            {isFetching ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} />}
            <span>{isFetching ? 'Analyzing...' : 'Run Report'}</span>
          </button>
        </form>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      {isFetching && (
        <div className="p-8 text-center flex flex-col items-center gap-3 bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-xl">
          <Loader2 size={24} className="animate-spin text-sky-500" />
          <span className="text-xs font-semibold text-slate-800 dark:text-zinc-200">
            {progressMsg}
          </span>
          <span className="text-[11px] text-slate-500 dark:text-zinc-400">
            Stockfish is calculating multi-move evaluations in parallel...
          </span>
        </div>
      )}

      {matches.length > 0 && !isFetching && (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-xl p-4 flex flex-col gap-1 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                Average Match Accuracy
              </span>
              <div className="flex items-center gap-2">
                <Award className="text-sky-500" size={20} />
                <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
                  {avgAccuracy}%
                </span>
              </div>
            </div>

            <div className="bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-xl p-4 flex flex-col gap-1 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                Total Blunders Flagged
              </span>
              <div className="flex items-center gap-2">
                <AlertTriangle className="text-rose-500" size={20} />
                <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
                  {totalBlunders}
                </span>
              </div>
            </div>

            <div className="bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-xl p-4 flex flex-col gap-1 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                Games Evaluated
              </span>
              <div className="flex items-center gap-2">
                <TrendingUp className="text-emerald-500" size={20} />
                <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
                  {matches.length} Matches
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-xl p-4 shadow-xs flex flex-col gap-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white border-b border-slate-100 dark:border-zinc-800 pb-2">
              Recent Game Performance Breakdown
            </h3>

            <div className="flex flex-col gap-2">
              {matches.map((m, idx) => {
                const isWhite = m.game.white.username.toLowerCase() === username.toLowerCase();
                const userAcc = isWhite ? m.analysis.whiteAccuracy : m.analysis.blackAccuracy;
                const oppAcc = isWhite ? m.analysis.blackAccuracy : m.analysis.whiteAccuracy;
                const opponentName = isWhite ? m.game.black.username : m.game.white.username;

                return (
                  <div
                    key={idx}
                    className="p-3.5 rounded-lg bg-slate-50/70 dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                  >
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          vs {opponentName}
                        </span>
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-200/60 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300">
                          {isWhite ? 'White' : 'Black'}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-zinc-400">
                          Result: {m.analysis.headers.Result || '*'}
                        </span>
                      </div>
                      <span className="text-xs text-slate-500 dark:text-zinc-400 truncate max-w-md">
                        {m.opening}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                      <div className="flex items-center gap-2 text-xs font-mono">
                        <span className="font-bold text-emerald-800 dark:text-emerald-400">
                          {userAcc}% acc
                        </span>
                        <span className="text-slate-400">vs</span>
                        <span className="text-slate-600 dark:text-zinc-400">
                          {oppAcc}%
                        </span>
                      </div>

                      <button
                        onClick={() => onSelectGameToReview(m.game.pgn)}
                        className="px-3 py-1.5 rounded-md bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-zinc-100 text-white dark:text-black text-xs font-medium transition"
                      >
                        Review Game
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
