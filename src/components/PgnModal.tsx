import React, { useState } from 'react';
import { Chess } from 'chess.js';
import { X, Upload, Zap, AlertCircle, Search, Loader2, FileText, Bookmark, Check } from 'lucide-react';
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

type TabType = 'username' | 'paste' | 'presets';

export const PgnModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onAnalyze,
  currentPgn,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('username');
  const [pgnText, setPgnText] = useState(currentPgn || DEFAULT_PGN);
  const [depth, setDepth] = useState<number>(10);
  const [error, setError] = useState<string | null>(null);
  const [username, setUsername] = useState<string>('');
  const [isFetchingUser, setIsFetchingUser] = useState<boolean>(false);
  const [fetchSuccess, setFetchSuccess] = useState<string | null>(null);
  const [selectedPresetLabel, setSelectedPresetLabel] = useState<string | null>(null);

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
      setError('Please enter or select a PGN game to analyze.');
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
    { label: 'demonexe2 vs ccobb09', pgn: DEFAULT_PGN, desc: 'London System with tactic' },
    { label: 'demonexe2 vs 100LoseStreak', pgn: DEMONEXE2_VS_100LOSESTREAK_PGN, desc: 'Sharp tactical middlegame' },
    { label: 'Byrne vs Fischer', pgn: FISCHER_BYRNE_PGN, desc: 'The Game of the Century (1956)' },
    { label: 'Morphy Opera Game', pgn: OPERA_GAME_PGN, desc: 'Classic attack and mating net (1858)' },
    { label: 'Carlsen vs Nakamura', pgn: CARLSEN_NAKAMURA_PGN, desc: 'Elite grandmaster blitz clash' },
    { label: "Scholar's Mate", pgn: SCHOLARS_MATE_PGN, desc: '4-move checkmate demonstration' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-colors">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <Upload className="text-slate-700 dark:text-zinc-300" size={18} />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Import Game for Analysis
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-900 transition"
          >
            <X size={18} />
          </button>
        </div>
        <div className="flex items-center border-b border-slate-200 dark:border-zinc-800 px-5 bg-slate-50/70 dark:bg-zinc-950/80">
          <button
            type="button"
            onClick={() => {
              setActiveTab('username');
              setError(null);
            }}
            className={`flex items-center gap-1.5 py-3 px-3 text-xs font-semibold border-b-2 transition -mb-[1px] ${
              activeTab === 'username'
                ? 'border-slate-900 dark:border-sky-400 text-slate-900 dark:text-sky-400'
                : 'border-transparent text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
            }`}
          >
            <Search size={14} />
            <span>Chess.com User</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('paste');
              setError(null);
            }}
            className={`flex items-center gap-1.5 py-3 px-3 text-xs font-semibold border-b-2 transition -mb-[1px] ${
              activeTab === 'paste'
                ? 'border-slate-900 dark:border-sky-400 text-slate-900 dark:text-sky-400'
                : 'border-transparent text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
            }`}
          >
            <FileText size={14} />
            <span>Paste PGN</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('presets');
              setError(null);
            }}
            className={`flex items-center gap-1.5 py-3 px-3 text-xs font-semibold border-b-2 transition -mb-[1px] ${
              activeTab === 'presets'
                ? 'border-slate-900 dark:border-sky-400 text-slate-900 dark:text-sky-400'
                : 'border-transparent text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
            }`}
          >
            <Bookmark size={14} />
            <span>Sample Games</span>
          </button>
        </div>
        <div className="p-5 flex flex-col gap-4 overflow-y-auto flex-1">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-800 dark:text-red-300">
              <AlertCircle size={16} className="shrink-0 text-red-600 dark:text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {fetchSuccess && (
            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
              <span>{fetchSuccess}</span>
              <button
                type="button"
                onClick={() => setActiveTab('paste')}
                className="underline font-semibold ml-2 hover:text-emerald-950 dark:hover:text-emerald-200"
              >
                View PGN
              </button>
            </div>
          )}
          {activeTab === 'username' && (
            <div className="flex flex-col gap-4">
              <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                Fetch the most recently completed public game for any player on Chess.com directly into the engine.
              </p>

              <form onSubmit={handleFetchUserGame} className="p-4 rounded-lg bg-slate-50 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 flex flex-col gap-3">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <Search size={14} className="text-slate-500 dark:text-zinc-400" />
                  Enter Username
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. demonexe2, hikaru, magnuscarlsen"
                    className="flex-1 px-3 py-2 bg-white dark:bg-black border border-slate-300 dark:border-zinc-700 rounded-md text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-slate-500 dark:focus:border-sky-500 transition"
                  />
                  <button
                    type="submit"
                    disabled={isFetchingUser}
                    className="px-4 py-2 bg-slate-900 dark:bg-sky-500 hover:bg-slate-800 dark:hover:bg-sky-400 disabled:bg-slate-400 text-white dark:text-slate-950 rounded-md text-xs font-semibold transition flex items-center gap-1.5 shrink-0"
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
              </form>

              {pgnText && (
                <div className="p-3 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-black text-xs flex flex-col gap-1">
                  <span className="font-semibold text-slate-700 dark:text-zinc-300">Ready to Analyze:</span>
                  <p className="font-mono text-slate-500 dark:text-zinc-400 truncate">
                    {pgnText.slice(0, 120)}...
                  </p>
                </div>
              )}
            </div>
          )}
          {activeTab === 'paste' && (
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-zinc-400">
                Paste Portable Game Notation (PGN)
              </label>
              <textarea
                value={pgnText}
                onChange={(e) => {
                  setPgnText(e.target.value);
                  if (error) setError(null);
                }}
                rows={9}
                placeholder="Paste PGN here (e.g. 1. d4 d5 2. Bf4 ...)"
                className="w-full bg-slate-50 dark:bg-black border border-slate-300 dark:border-zinc-800 rounded-lg p-3 text-xs font-mono text-slate-900 dark:text-zinc-200 focus:bg-white dark:focus:bg-zinc-950 focus:outline-none focus:border-slate-500 dark:focus:border-sky-500 transition resize-none leading-relaxed"
              />
            </div>
          )}
          {activeTab === 'presets' && (
            <div className="flex flex-col gap-2">
              <p className="text-xs text-slate-600 dark:text-zinc-400 mb-1">
                Select a famous historic match or test game to load into the engine:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {presetGames.map((preset) => {
                  const isSelected = pgnText === preset.pgn || selectedPresetLabel === preset.label;
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        setPgnText(preset.pgn);
                        setSelectedPresetLabel(preset.label);
                        setError(null);
                        setFetchSuccess(null);
                      }}
                      className={`text-left p-3 rounded-lg border transition flex flex-col gap-1 ${
                        isSelected
                          ? 'bg-slate-900 dark:bg-sky-950/60 border-slate-900 dark:border-sky-500 text-white'
                          : 'bg-slate-50 dark:bg-zinc-900/60 hover:bg-slate-100 dark:hover:bg-zinc-800/80 border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold ${isSelected ? 'text-white dark:text-sky-300' : 'text-slate-900 dark:text-white'}`}>
                          {preset.label}
                        </span>
                        {isSelected && <Check size={14} className="text-emerald-400 dark:text-sky-400 shrink-0" />}
                      </div>
                      <span className={`text-[11px] leading-snug ${isSelected ? 'text-slate-300 dark:text-sky-200/70' : 'text-slate-500 dark:text-zinc-400'}`}>
                        {preset.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        <form onSubmit={handleSubmit} className="border-t border-slate-200 dark:border-zinc-800 p-4 bg-slate-50 dark:bg-zinc-950/80 flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <Zap size={16} className="text-amber-500" />
              <div>
                <span className="text-xs font-semibold text-slate-900 dark:text-white block">
                  Engine Depth
                </span>
                <span className="text-[11px] text-slate-500 dark:text-zinc-400">
                  Depth 10: fast (~1-2s) &bull; Depth 14-16: deep analysis
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
                      ? 'bg-slate-900 dark:bg-sky-500 border-slate-900 dark:border-sky-500 text-white dark:text-slate-950 font-semibold'
                      : 'bg-white dark:bg-zinc-900 hover:bg-slate-100 dark:hover:bg-zinc-800 border-slate-300 dark:border-zinc-700 text-slate-700 dark:text-zinc-300'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold rounded-md bg-slate-900 dark:bg-sky-500 hover:bg-slate-800 dark:hover:bg-sky-400 text-white dark:text-slate-950 transition flex items-center gap-1.5 shadow-sm"
            >
              <Zap size={14} className="fill-current" />
              Start Full Analysis
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
