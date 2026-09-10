import React, { useState } from 'react';
import { Users, Search, Loader2, Swords, AlertTriangle } from 'lucide-react';
import { fetchRecentGamesByUsername, fetchPlayerProfile, type ChessComGame, type PlayerProfile } from '../services/chessComService';

export const PlayerCompare: React.FC = () => {
  const [userA, setUserA] = useState<string>('hikaru');
  const [userB, setUserB] = useState<string>('magnuscarlsen');
  const [profileA, setProfileA] = useState<PlayerProfile | null>(null);
  const [profileB, setProfileB] = useState<PlayerProfile | null>(null);
  const [gamesA, setGamesA] = useState<ChessComGame[]>([]);
  const [gamesB, setGamesB] = useState<ChessComGame[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleCompare = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanA = userA.trim().toLowerCase();
    const cleanB = userB.trim().toLowerCase();
    if (!cleanA || !cleanB) return;

    setLoading(true);
    setError(null);
    try {
      const [pA, pB, gA, gB] = await Promise.all([
        fetchPlayerProfile(cleanA),
        fetchPlayerProfile(cleanB),
        fetchRecentGamesByUsername(cleanA, 10),
        fetchRecentGamesByUsername(cleanB, 10),
      ]);

      if (!pA || !pB) {
        throw new Error('One or both players could not be found.');
      }

      setProfileA(pA);
      setProfileB(pB);
      setGamesA(gA);
      setGamesB(gB);
    } catch (err: any) {
      setError(err?.message || 'Failed fetching player data.');
    } finally {
      setLoading(false);
    }
  };

  const getWinRate = (games: ChessComGame[], username: string) => {
    if (games.length === 0) return 0;
    const clean = username.toLowerCase();
    const wins = games.filter(
      (g) =>
        (g.white.username.toLowerCase() === clean && g.white.result === 'win') ||
        (g.black.username.toLowerCase() === clean && g.black.result === 'win')
    ).length;
    return Math.round((wins / games.length) * 100);
  };

  const winRateA = profileA ? getWinRate(gamesA, profileA.username) : 0;
  const winRateB = profileB ? getWinRate(gamesB, profileB.username) : 0;

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-xl p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-sky-50 dark:bg-zinc-900 border border-sky-200 dark:border-zinc-800 text-sky-600 dark:text-sky-400">
            <Users size={20} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Head-to-Head Player Comparison
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Compare profiles, win rates, recent form, and repertoire clash side-by-side.
            </p>
          </div>
        </div>

        <form onSubmit={handleCompare} className="flex items-center gap-2 flex-wrap">
          <input
            type="text"
            value={userA}
            onChange={(e) => setUserA(e.target.value)}
            placeholder="Player 1"
            className="w-32 sm:w-36 px-3 py-1.5 bg-slate-50 dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 rounded-md text-xs text-slate-900 dark:text-white focus:outline-none"
          />
          <Swords size={14} className="text-slate-400" />
          <input
            type="text"
            value={userB}
            onChange={(e) => setUserB(e.target.value)}
            placeholder="Player 2"
            className="w-32 sm:w-36 px-3 py-1.5 bg-slate-50 dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 rounded-md text-xs text-slate-900 dark:text-white focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-1.5 rounded-md bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-zinc-100 text-white dark:text-black text-xs font-semibold disabled:opacity-50 transition flex items-center gap-1.5"
          >
            {loading ? <Loader2 size={13} className="animate-spin" /> : <Search size={13} />}
            <span>Compare</span>
          </button>
        </form>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      {profileA && profileB && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-xl p-5 shadow-xs flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="text-base font-bold text-slate-900 dark:text-white">
                  {profileA.username}
                </span>
                {profileA.title && (
                  <span className="text-xs font-mono font-bold text-amber-500">
                    [{profileA.title}]
                  </span>
                )}
              </div>
              <span className="text-xs text-slate-500 dark:text-zinc-400">Player 1</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 flex flex-col gap-1">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400">Recent Win Rate</span>
                <span className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">{winRateA}%</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 flex flex-col gap-1">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400">Sample Analyzed</span>
                <span className="text-xl font-bold font-mono text-slate-900 dark:text-white">{gamesA.length} Games</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-xl p-5 shadow-xs flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="text-base font-bold text-slate-900 dark:text-white">
                  {profileB.username}
                </span>
                {profileB.title && (
                  <span className="text-xs font-mono font-bold text-amber-500">
                    [{profileB.title}]
                  </span>
                )}
              </div>
              <span className="text-xs text-slate-500 dark:text-zinc-400">Player 2</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 flex flex-col gap-1">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400">Recent Win Rate</span>
                <span className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">{winRateB}%</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 flex flex-col gap-1">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400">Sample Analyzed</span>
                <span className="text-xl font-bold font-mono text-slate-900 dark:text-white">{gamesB.length} Games</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
