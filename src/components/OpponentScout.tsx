import React, { useState } from 'react';
import { Shield, Search, Loader2, Zap, AlertTriangle, BookOpen } from 'lucide-react';
import { fetchRecentGamesByUsername, fetchPlayerProfile, type ChessComGame, type PlayerProfile } from '../services/chessComService';
import { Chess } from 'chess.js';
import { getOpeningName } from '../services/analyzer';

interface Props {
  onReviewMatch: (pgn: string) => void;
}

export const OpponentScout: React.FC<Props> = ({ onReviewMatch }) => {
  const [targetUser, setTargetUser] = useState<string>('hikaru');
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [games, setGames] = useState<ChessComGame[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleScout = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = targetUser.trim().toLowerCase();
    if (!clean) return;

    setLoading(true);
    setError(null);
    try {
      const [p, g] = await Promise.all([
        fetchPlayerProfile(clean),
        fetchRecentGamesByUsername(clean, 15),
      ]);

      if (g.length === 0) {
        throw new Error(`No recent games found for "${clean}".`);
      }

      setProfile(p);
      setGames(g);
    } catch (err: any) {
      setError(err?.message || 'Failed scouting user.');
    } finally {
      setLoading(false);
    }
  };

  const scoutStats = React.useMemo(() => {
    if (games.length === 0) return null;
    const clean = targetUser.toLowerCase();

    const whiteOpenings: Record<string, number> = {};
    const blackOpenings: Record<string, number> = {};
    let wins = 0;
    let losses = 0;
    let draws = 0;

    for (const g of games) {
      const isWhite = g.white.username.toLowerCase() === clean;
      const res = isWhite ? g.white.result : g.black.result;
      if (res === 'win') wins++;
      else if (res === 'resigned' || res === 'checkmated' || res === 'timeout') losses++;
      else draws++;

      try {
        const c = new Chess();
        c.loadPgn(g.pgn);
        const history = c.history();
        if (history.length > 0) {
          const replay = new Chess();
          const fens: string[] = [];
          for (let i = 0; i < Math.min(14, history.length); i++) {
            replay.move(history[i]);
            fens.push(replay.fen());
          }
          let opName = 'Standard Opening';
          for (let i = fens.length - 1; i >= 0; i--) {
            const name = getOpeningName(fens[i]);
            if (name) {
              opName = name;
              break;
            }
          }
          if (isWhite) {
            whiteOpenings[opName] = (whiteOpenings[opName] || 0) + 1;
          } else {
            blackOpenings[opName] = (blackOpenings[opName] || 0) + 1;
          }
        }
      } catch {}
    }

    const sortOps = (obj: Record<string, number>) =>
      Object.entries(obj).sort((a, b) => b[1] - a[1]);

    return {
      wins,
      losses,
      draws,
      winRate: Math.round((wins / games.length) * 100),
      topWhite: sortOps(whiteOpenings).slice(0, 3),
      topBlack: sortOps(blackOpenings).slice(0, 3),
    };
  }, [games, targetUser]);

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-xl p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-zinc-900 border border-emerald-200 dark:border-zinc-800 text-emerald-600 dark:text-emerald-400">
            <Shield size={20} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Opponent Scouting & Preparation
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Scout opponents' most played openings, recent win streaks, and tactical prep recommendations.
            </p>
          </div>
        </div>

        <form onSubmit={handleScout} className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-52">
            <input
              type="text"
              value={targetUser}
              onChange={(e) => setTargetUser(e.target.value)}
              placeholder="Opponent Username"
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 rounded-md text-xs text-slate-900 dark:text-white focus:outline-none focus:border-sky-500 transition"
            />
            <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="px-4 py-1.5 rounded-md bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-zinc-100 text-white dark:text-black text-xs font-semibold disabled:opacity-50 transition flex items-center gap-1.5 shrink-0"
          >
            {loading ? <Loader2 size={13} className="animate-spin" /> : <Zap size={13} />}
            <span>Scout</span>
          </button>
        </form>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      {scoutStats && profile && (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-xl p-4 flex flex-col gap-1 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                Scouted Player
              </span>
              <span className="text-lg font-bold text-slate-900 dark:text-white truncate">
                {profile.username}
              </span>
              {profile.title && (
                <span className="text-xs text-amber-500 font-bold font-mono">
                  [{profile.title}]
                </span>
              )}
            </div>

            <div className="bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-xl p-4 flex flex-col gap-1 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                Recent Win Rate
              </span>
              <span className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                {scoutStats.winRate}%
              </span>
            </div>

            <div className="bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-xl p-4 flex flex-col gap-1 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                Form Record (W / L / D)
              </span>
              <span className="text-xl font-bold font-mono text-slate-900 dark:text-white">
                {scoutStats.wins}W - {scoutStats.losses}L - {scoutStats.draws}D
              </span>
            </div>

            <div className="bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-xl p-4 flex flex-col gap-1 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                Sample Size
              </span>
              <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
                {games.length} Games
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-xl p-4 shadow-xs flex flex-col gap-3">
              <div className="flex items-center gap-2 border-b border-slate-100 dark:border-zinc-800 pb-2">
                <BookOpen size={16} className="text-sky-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Favorite Openings with White
                </h3>
              </div>
              <div className="flex flex-col gap-2">
                {scoutStats.topWhite.map(([name, count]) => (
                  <div
                    key={name}
                    className="p-2.5 rounded-lg bg-slate-50 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 flex items-center justify-between text-xs"
                  >
                    <span className="font-semibold text-slate-900 dark:text-white truncate max-w-[240px]">
                      {name}
                    </span>
                    <span className="font-mono text-slate-500 dark:text-zinc-400">
                      {count} games
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-xl p-4 shadow-xs flex flex-col gap-3">
              <div className="flex items-center gap-2 border-b border-slate-100 dark:border-zinc-800 pb-2">
                <BookOpen size={16} className="text-emerald-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Favorite Openings with Black
                </h3>
              </div>
              <div className="flex flex-col gap-2">
                {scoutStats.topBlack.map(([name, count]) => (
                  <div
                    key={name}
                    className="p-2.5 rounded-lg bg-slate-50 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 flex items-center justify-between text-xs"
                  >
                    <span className="font-semibold text-slate-900 dark:text-white truncate max-w-[240px]">
                      {name}
                    </span>
                    <span className="font-mono text-slate-500 dark:text-zinc-400">
                      {count} games
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-xl p-4 shadow-xs flex flex-col gap-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white border-b border-slate-100 dark:border-zinc-800 pb-2">
              Recent Scouted Games
            </h3>
            <div className="flex flex-col gap-2">
              {games.slice(0, 5).map((g, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg bg-slate-50 dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800 flex items-center justify-between text-xs"
                >
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {g.white.username} ({g.white.rating || '?'}) vs {g.black.username} ({g.black.rating || '?'})
                  </span>
                  <button
                    onClick={() => onReviewMatch(g.pgn)}
                    className="px-3 py-1 rounded bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-zinc-100 text-white dark:text-black font-medium transition"
                  >
                    Review Game
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
