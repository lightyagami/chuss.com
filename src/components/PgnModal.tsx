import React, { useState } from 'react';
import { Chess } from 'chess.js';
import { X, Upload, Zap, AlertCircle, Search, Loader2 } from 'lucide-react';
import { 
  DEFAULT_PGN, 
  DEMONEXE2_VS_100LOSESTREAK_PGN,
  FISCHER_BYRNE_PGN, 
  OPERA_GAME_PGN, 
  CARLSEN_NAKAMURA_PGN,
  SCHOLARS_MATE_PGN 
} from '../data/samplePgn';
import { fetchLatestGameByUsername } from '../services/chessComService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAnalyze: (pgn: string, depth: number) => void;
  currentPgn: string;
}

export const PgnModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onAnalyze,
  currentPgn,
}) => {
  const [pgnText, setPgnText] = useState(currentPgn || DEFAULT_PGN);
  const [depth, setDepth] = useState<number>(10);
  const [error, setError] = useState<string | null>(null);
  const [username, setUsername] = useState<string>('');
  const [isFetchingUser, setIsFetchingUser] = useState<boolean>(false);
  const [fetchSuccess, setFetchSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFetchUserGame = async (e?: React.SyntheticEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setFetchSuccess(null);

    const cleanUser = username.trim();
    if (!cleanUser) {
      setError('Please enter a Chess.com username.');
      return;
    }

    setIsFetchingUser(true);
    try {
      const { pgn: fetchedPgn, game } = await fetchLatestGameByUsername(cleanUser);
      setPgnText(fetchedPgn);
      const whiteRating = game.white.rating !== undefined ? game.white.rating : 'unrated';
      const blackRating = game.black.rating !== undefined ? game.black.rating : 'unrated';
      setFetchSuccess(
        `Fetched latest game: ${game.white.username} (${whiteRating}) vs ${game.black.username} (${blackRating})`
      );
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch game from Chess.com.');
    } finally {
      setIsFetchingUser(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmed = pgnText.trim();
    if (!trimmed) {
      setError('Please enter a PGN or move list.');
      return;
    }

    try {
      const chess = new Chess();
      chess.loadPgn(trimmed);
      const moves = chess.history();
      if (moves.length === 0) {
        setError('No valid chess moves found in the provided PGN.');
        return;
      }
    } catch (err: any) {
      setError(err?.message || 'Invalid PGN format. Please check the move notation.');
      return;
    }

    onAnalyze(trimmed, depth);
    onClose();
  };

  const presetGames = [
    { label: 'demonexe2 vs ccobb09', pgn: DEFAULT_PGN, highlight: true },
    { label: 'demonexe2 vs 100LoseStreak', pgn: DEMONEXE2_VS_100LOSESTREAK_PGN, highlight: true },
    { label: 'Byrne vs Fischer', pgn: FISCHER_BYRNE_PGN },
    { label: 'Morphy Opera Game', pgn: OPERA_GAME_PGN },
    { label: 'Carlsen vs Nakamura', pgn: CARLSEN_NAKAMURA_PGN },
    { label: "Scholar's Mate", pgn: SCHOLARS_MATE_PGN },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Upload className="text-slate-700" size={18} />
            <h2 className="text-base font-bold text-slate-900">
              Import PGN Game
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4 overflow-y-auto">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800">
              <AlertCircle size={16} className="shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {fetchSuccess && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
              {fetchSuccess}
            </div>
          )}

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex flex-col gap-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Search size={14} className="text-slate-600" />
              Fetch Latest Game from Chess.com
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    e.stopPropagation();
                    handleFetchUserGame();
                  }
                }}
                placeholder="e.g. demonexe2 or 100LoseStreak"
                className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-md text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-500 transition"
              />
              <button
                type="button"
                onClick={handleFetchUserGame}
                disabled={isFetchingUser}
                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white rounded-md text-xs font-medium transition flex items-center gap-1.5 shrink-0"
              >
                {isFetchingUser ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    Fetching...
                  </>
                ) : (
                  'Fetch Game'
                )}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-slate-500 font-medium">Test Games &amp; Presets:</span>
            <div className="flex flex-wrap gap-1.5">
              {presetGames.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    setPgnText(preset.pgn);
                    setError(null);
                    setFetchSuccess(null);
                  }}
                  className={`px-2.5 py-1 text-xs rounded-md transition font-medium border ${
                    preset.highlight
                      ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-900 font-semibold'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Paste PGN or Chess.com Move Export
            </label>
            <textarea
              value={pgnText}
              onChange={(e) => {
                setPgnText(e.target.value);
                if (error) setError(null);
              }}
              rows={8}
              placeholder="Paste PGN here (e.g. 1. d4 d5 2. Bf4 ...)"
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:border-slate-500 transition resize-none leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div className="flex items-center gap-2">
              <Zap size={16} className="text-slate-600" />
              <div>
                <span className="text-xs font-semibold text-slate-900 block">
                  Stockfish Analysis Depth
                </span>
                <span className="text-[11px] text-slate-500">
                  Higher depth evaluates deeper positions
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {[
                { label: 'Depth 10', value: 10 },
                { label: 'Depth 12', value: 12 },
                { label: 'Depth 14', value: 14 },
                { label: 'Depth 16', value: 16 },
              ].map((d) => (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => setDepth(d.value)}
                  className={`px-2.5 py-1 text-xs rounded-md transition font-medium border ${
                    depth === d.value
                      ? 'bg-slate-900 border-slate-900 text-white font-semibold'
                      : 'bg-white hover:bg-slate-100 border-slate-300 text-slate-700'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-medium rounded-md bg-slate-900 hover:bg-slate-800 text-white transition flex items-center gap-1.5"
            >
              <Zap size={14} />
              Start Full Analysis
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
