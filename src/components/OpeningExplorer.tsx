import React, { useState, useMemo } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { BookOpen, Search, RotateCcw, ArrowRight, Compass, Sparkles } from 'lucide-react';
import openingBookRaw from '../data/openingBook.json';
import openingMovesRaw from '../data/openingMoves.json';

interface Props {
  onLoadOpeningToAnalyzer: (pgn: string) => void;
}

const openingBook = openingBookRaw as Record<string, string>;
const openingMoves = openingMovesRaw as Record<string, string[]>;

export const OpeningExplorer: React.FC<Props> = ({ onLoadOpeningToAnalyzer }) => {
  const [searchQuery, setSearchQuery] = useState<string>('Sicilian');
  const [fen, setFen] = useState<string>(() => new Chess().fen());
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [selectedOpening, setSelectedOpening] = useState<string>('Starting Position');
  const [orientation, setOrientation] = useState<'white' | 'black'>('white');

  const allOpeningsList = useMemo(() => {
    const entries = Object.entries(openingBook);
    const map = new Map<string, string>();
    for (const [f, name] of entries) {
      if (!map.has(name)) {
        map.set(name, f);
      }
    }
    return Array.from(map.entries()).map(([name, f]) => ({ name, fen: f }));
  }, []);

  const filteredOpenings = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return allOpeningsList.slice(0, 40);
    return allOpeningsList
      .filter((op) => op.name.toLowerCase().includes(q))
      .slice(0, 40);
  }, [allOpeningsList, searchQuery]);

  const currentOpeningName = useMemo(() => {
    const key = fen.split(' ').slice(0, 4).join(' ');
    if (key === 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq -') {
      return 'Starting Position';
    }
    return openingBook[key] || selectedOpening || 'Custom Position';
  }, [fen, selectedOpening]);

  const bookContinuations = useMemo(() => {
    const continuations: { san: string; from: string; to: string; nextName?: string }[] = [];
    try {
      const c = new Chess(fen);
      const moves = c.moves({ verbose: true });
      for (const m of moves) {
        c.move(m);
        const nextFenKey = c.fen().split(' ').slice(0, 4).join(' ');
        const name = openingBook[nextFenKey];
        c.undo();
        if (name) {
          continuations.push({ san: m.san, from: m.from, to: m.to, nextName: name });
        }
      }
    } catch {}
    return continuations;
  }, [fen]);

  const handleSelectOpening = (name: string, targetFen: string) => {
    setSelectedOpening(name);
    const key = targetFen.split(' ').slice(0, 4).join(' ');
    const knownMoves = openingMoves[key];
    if (knownMoves && knownMoves.length > 0) {
      const c = new Chess();
      for (const m of knownMoves) {
        try {
          c.move(m);
        } catch {}
      }
      setFen(c.fen());
      setMoveHistory(c.history());
    } else {
      try {
        const c = new Chess(targetFen);
        setFen(c.fen());
        setMoveHistory([]);
      } catch {
        setFen(targetFen);
        setMoveHistory([]);
      }
    }
  };

  const handleMakeMove = (sourceSquare: string, targetSquare: string) => {
    try {
      const c = new Chess(fen);
      const move = c.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q',
      });
      if (move) {
        setFen(c.fen());
        setMoveHistory((prev) => [...prev, move.san]);
        const key = c.fen().split(' ').slice(0, 4).join(' ');
        if (openingBook[key]) {
          setSelectedOpening(openingBook[key]);
        }
        return true;
      }
    } catch {}
    return false;
  };

  const handleResetBoard = () => {
    const c = new Chess();
    setFen(c.fen());
    setMoveHistory([]);
    setSelectedOpening('Starting Position');
  };

  const handleLoadCurrentToAnalyzer = () => {
    if (moveHistory.length > 0) {
      try {
        const c = new Chess();
        for (const san of moveHistory) {
          c.move(san);
        }
        onLoadOpeningToAnalyzer(c.pgn() || '1. e4 e5');
        return;
      } catch {}
    }
    const cleanFen = fen.includes(' ') && fen.split(' ').length >= 4
      ? (fen.split(' ').length === 4 ? `${fen} 0 1` : fen)
      : fen;
    onLoadOpeningToAnalyzer(`[SetUp "1"]\n[FEN "${cleanFen}"]\n\n*`);
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-xl p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-sky-50 dark:bg-zinc-900 border border-sky-200 dark:border-zinc-800 text-sky-600 dark:text-sky-400">
            <BookOpen size={20} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Opening Explorer & Theory Prep
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-400 font-semibold">
                3,000+ Lines
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Interactive opening book database. Test continuation lines, explore transpositions, and load lines into the engine.
            </p>
          </div>
        </div>

        <button
          onClick={handleLoadCurrentToAnalyzer}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-zinc-100 text-white dark:text-black text-xs font-semibold transition shadow-xs shrink-0"
        >
          <Sparkles size={14} />
          <span>Analyze this Line</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 flex flex-col items-center gap-4">
          <div className="w-full max-w-[500px] flex items-center justify-between px-4 py-2.5 rounded-t-lg bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 text-xs shadow-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-sky-600 dark:text-sky-400 tracking-wider block">
                Current Line
              </span>
              <span className="font-bold text-slate-900 dark:text-white text-sm">
                {currentOpeningName}
              </span>
            </div>
            <button
              onClick={() => setOrientation((p) => (p === 'white' ? 'black' : 'white'))}
              className="px-2.5 py-1 rounded bg-slate-100 dark:bg-zinc-900 hover:bg-slate-200 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 transition text-[11px]"
            >
              Flip ({orientation})
            </button>
          </div>

          <div className="aspect-square w-full max-w-[500px] rounded-none overflow-hidden border-x border-slate-300 dark:border-zinc-800 shadow-sm relative bg-white dark:bg-black">
            <Chessboard
              options={{
                position: fen,
                boardOrientation: orientation,
                allowDragging: true,
                onPieceDrop: ({ sourceSquare, targetSquare }) => {
                  if (!targetSquare) return false;
                  return handleMakeMove(sourceSquare, targetSquare);
                },
                darkSquareStyle: { backgroundColor: '#779952' },
                lightSquareStyle: { backgroundColor: '#edeed1' },
              }}
            />
          </div>

          <div className="w-full max-w-[500px] flex items-center justify-between p-3 rounded-b-lg bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 text-xs shadow-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleResetBoard}
                className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-slate-100 dark:bg-zinc-900 hover:bg-slate-200 dark:hover:bg-zinc-800 border border-slate-300 dark:border-zinc-700 text-slate-700 dark:text-zinc-200 font-medium transition"
              >
                <RotateCcw size={13} />
                <span>Reset to Start</span>
              </button>
            </div>

            <span className="font-mono text-xs text-slate-500 dark:text-zinc-400">
              {moveHistory.length > 0 ? moveHistory.join(' ') : 'No moves played'}
            </span>
          </div>

          {bookContinuations.length > 0 && (
            <div className="w-full max-w-[500px] bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-lg p-3 shadow-xs flex flex-col gap-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900 dark:text-white">
                <Compass size={14} className="text-emerald-500" />
                <span>Book Continuation Candidates ({bookContinuations.length}):</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {bookContinuations.map((cont) => (
                  <button
                    key={cont.san}
                    onClick={() => handleMakeMove(cont.from, cont.to)}
                    className="p-2 rounded-md bg-slate-50 dark:bg-zinc-900/60 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800 text-left transition flex flex-col gap-0.5"
                  >
                    <span className="font-mono font-bold text-xs text-emerald-800 dark:text-emerald-400">
                      {cont.san}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-zinc-400 truncate">
                      {cont.nextName}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-xl p-4 shadow-xs flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-zinc-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Search Theory Database
              </span>
              <span className="text-[11px] text-slate-500 dark:text-zinc-400 font-mono">
                {filteredOpenings.length} matches
              </span>
            </div>

            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search openings (e.g. French, Sicilian, Caro-Kann)..."
                className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 rounded-lg text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-sky-500 transition"
              />
              <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
            </div>

            <div className="flex flex-col gap-1.5 max-h-[480px] overflow-y-auto pr-1">
              {filteredOpenings.map((op) => (
                <button
                  key={op.fen}
                  onClick={() => handleSelectOpening(op.name, op.fen)}
                  className={`p-2.5 rounded-lg border text-left transition flex items-center justify-between gap-2 ${
                    currentOpeningName === op.name
                      ? 'bg-sky-50 dark:bg-zinc-900 border-sky-400 dark:border-sky-500 text-sky-950 dark:text-sky-300 font-semibold'
                      : 'bg-slate-50/70 dark:bg-zinc-900/40 hover:bg-slate-100 dark:hover:bg-zinc-800 border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-300'
                  }`}
                >
                  <span className="text-xs truncate">{op.name}</span>
                  <ArrowRight size={13} className="text-slate-400 shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
