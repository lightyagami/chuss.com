import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import type { Arrow } from 'react-chessboard';
import { 
  Radio, 
  Search, 
  RotateCcw, 
  Zap, 
  TrendingUp, 
  Compass, 
  ExternalLink,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { fetchOngoingGames, type ChessComLiveGame } from '../services/chessComService';
import { stockfishService, type PositionEval } from '../services/stockfishService';
import { uciToSan, convertPvToSan, calculateWinChance } from '../services/analyzer';
import { EvalBar } from './EvalBar';

interface Props {
  onReviewFinishedGame: (pgn: string) => void;
}

export const LiveMatchTracker: React.FC<Props> = ({ onReviewFinishedGame }) => {
  const [username, setUsername] = useState<string>('demonexe2');
  const [isPolling, setIsPolling] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('Enter a username to track an ongoing match');
  const [activeGame, setActiveGame] = useState<ChessComLiveGame | null>(null);
  const [currentFen, setCurrentFen] = useState<string>('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  const [orientation, setOrientation] = useState<'white' | 'black'>('white');
  const [evalResult, setEvalResult] = useState<PositionEval | null>(null);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [showBestMoveArrow, setShowBestMoveArrow] = useState<boolean>(true);
  const [lastMoveSquares, setLastMoveSquares] = useState<{ from?: string; to?: string }>({});

  const previousFenRef = useRef<string>('');
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef<boolean>(true);
  const activeGameUrlRef = useRef<string>('');
  const activeGamePgnRef = useRef<string>('');

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    };
  }, []);

  const evaluateLiveFen = useCallback(async (fen: string) => {
    setIsEvaluating(true);
    try {
      const evaluation = await stockfishService.evaluatePosition(fen, 10);
      if (!isMountedRef.current) return;
      setEvalResult(evaluation);
    } catch (e) {
      console.warn('Live Stockfish eval error:', e);
    } finally {
      if (isMountedRef.current) setIsEvaluating(false);
    }
  }, []);

  const pollGame = useCallback(async () => {
    if (!username.trim() || !isPolling) return;

    try {
      const cleanUser = username.trim().toLowerCase();
      const ongoingGames = await fetchOngoingGames(cleanUser);

      if (!isMountedRef.current) return;

      if (ongoingGames.length === 0) {
        if (activeGameUrlRef.current && activeGamePgnRef.current) {
          setStatusMessage('Game finished! You can load it for complete post-match review.');
        } else {
          setStatusMessage(`No active live game found for "${username}". Waiting for next game...`);
        }
      } else {
        const game = ongoingGames[0];
        setActiveGame(game);
        activeGameUrlRef.current = game.url;
        activeGamePgnRef.current = game.pgn || '';
        setStatusMessage(`Live Match Active: ${game.time_class || 'game'} (${game.time_control})`);

        const whiteUser = game.white.split('/').pop() || 'White';
        const isWhite = whiteUser.toLowerCase() === cleanUser;
        setOrientation(isWhite ? 'white' : 'black');

        if (game.fen !== previousFenRef.current) {
          previousFenRef.current = game.fen;
          setCurrentFen(game.fen);

          try {
            if (game.pgn) {
              const c = new Chess();
              c.loadPgn(game.pgn);
              const history = c.history({ verbose: true });
              if (history.length > 0) {
                const last = history[history.length - 1];
                setLastMoveSquares({ from: last.from, to: last.to });
              }
            }
          } catch {
          }

          evaluateLiveFen(game.fen);
        }
      }
    } catch (err: any) {
      if (isMountedRef.current) {
        setStatusMessage(`Sync error: ${err?.message || 'Connection lost'}`);
      }
    } finally {
      if (isMountedRef.current && isPolling) {
        pollTimerRef.current = setTimeout(pollGame, 3000);
      }
    }
  }, [username, isPolling, evaluateLiveFen]);

  useEffect(() => {
    if (isPolling) {
      pollGame();
    } else {
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    }
    return () => {
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    };
  }, [isPolling, pollGame]);

  const toggleTracking = () => {
    if (!username.trim()) return;
    if (!isPolling) {
      previousFenRef.current = '';
      setEvalResult(null);
      setActiveGame(null);
      setIsPolling(true);
      setStatusMessage(`Connecting to Chess.com live stream for "${username.trim()}"...`);
    } else {
      setIsPolling(false);
      setStatusMessage('Live tracking stopped.');
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    }
  };

  const optimalMoveData = React.useMemo(() => {
    if (!evalResult || !evalResult.bestMoveUci || !currentFen) return null;
    try {
      const chess = new Chess(currentFen);
      const converted = uciToSan(chess, evalResult.bestMoveUci);
      const pvSan = convertPvToSan(currentFen, evalResult.pvUci);
      return {
        bestSan: converted?.san || evalResult.bestMoveUci,
        from: converted?.from || evalResult.bestMoveUci.slice(0, 2),
        to: converted?.to || evalResult.bestMoveUci.slice(2, 4),
        continuation: pvSan,
      };
    } catch {
      return null;
    }
  }, [evalResult, currentFen]);

  const arrows: Arrow[] = React.useMemo(() => {
    if (!showBestMoveArrow || !optimalMoveData) return [];
    return [
      {
        startSquare: optimalMoveData.from as any,
        endSquare: optimalMoveData.to as any,
        color: 'rgba(16, 185, 129, 0.9)',
      },
    ];
  }, [showBestMoveArrow, optimalMoveData]);

  const customSquareStyles = React.useMemo(() => {
    const styles: Record<string, { backgroundColor: string }> = {};
    if (lastMoveSquares.from) {
      styles[lastMoveSquares.from] = { backgroundColor: 'rgba(234, 179, 8, 0.3)' };
    }
    if (lastMoveSquares.to) {
      styles[lastMoveSquares.to] = { backgroundColor: 'rgba(234, 179, 8, 0.3)' };
    }
    return styles;
  }, [lastMoveSquares]);

  const whitePlayerName = activeGame?.white ? activeGame.white.split('/').pop() || 'White' : 'White';
  const blackPlayerName = activeGame?.black ? activeGame.black.split('/').pop() || 'Black' : 'Black';
  const topPlayer = orientation === 'white' ? { name: blackPlayerName, color: 'Black' } : { name: whitePlayerName, color: 'White' };
  const bottomPlayer = orientation === 'white' ? { name: whitePlayerName, color: 'White' } : { name: blackPlayerName, color: 'Black' };

  const winChance = evalResult ? calculateWinChance(evalResult.score) : 50;

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-200">
      {/* Search & Tracker Control Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 transition-colors">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${isPolling ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'}`}>
            <Radio size={19} className={isPolling ? 'animate-pulse text-emerald-600 dark:text-emerald-400' : ''} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Live Match Assistant</h2>
              {isPolling && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400 animate-ping" />
                  LIVE SYNC
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">{statusMessage}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-60">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Chess.com Username"
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 rounded-md text-xs text-slate-900 dark:text-white focus:bg-white dark:focus:bg-black focus:outline-none focus:border-slate-500 dark:focus:border-sky-500 transition font-medium"
            />
            <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400 dark:text-zinc-500" />
          </div>

          <button
            onClick={toggleTracking}
            className={`px-4 py-1.5 rounded-md text-xs font-semibold transition shrink-0 ${
              isPolling
                ? 'bg-red-50 dark:bg-red-950/60 hover:bg-red-100 dark:hover:bg-red-900/80 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
                : 'bg-slate-900 dark:bg-sky-500 hover:bg-slate-800 dark:hover:bg-sky-400 text-white dark:text-slate-950'
            }`}
          >
            {isPolling ? 'Stop Tracking' : 'Track Live Match'}
          </button>
        </div>
      </div>

      {/* Main Grid: Board & Real-Time Engine Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Board + Live Eval Bar */}
        <div className="lg:col-span-7 flex flex-col items-center gap-3">
          <div className="flex items-stretch gap-2 md:gap-3 justify-center w-full max-w-[560px]">
            {/* Dynamic Eval Bar */}
            <div className="flex flex-col py-4 sm:py-8 shrink-0">
              <EvalBar
                score={evalResult?.score ?? 0}
                isMate={evalResult?.isMate}
                mateIn={evalResult?.mateIn}
                orientation={orientation}
              />
            </div>

            {/* Board Column */}
            <div className="flex flex-col flex-1 min-w-0 max-w-[500px]">
              {/* Top Player Banner */}
              <div className="flex items-center justify-between px-3 py-1.5 bg-white dark:bg-black rounded-t-lg border border-slate-200 dark:border-zinc-800 text-xs shadow-xs transition-colors">
                <div className="flex items-center gap-2">
                  <div className={`w-3.5 h-3.5 rounded-full border border-slate-400 dark:border-zinc-700 ${topPlayer.color === 'Black' ? 'bg-slate-900 dark:bg-zinc-900' : 'bg-white'}`} />
                  <span className="font-semibold text-slate-900 dark:text-white truncate max-w-[180px]">
                    {topPlayer.name}
                  </span>
                </div>
                {activeGame?.turn && (
                  <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${
                    activeGame.turn.toLowerCase() === topPlayer.color.toLowerCase()
                      ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                      : 'bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-800'
                  }`}>
                    {activeGame.turn.toLowerCase() === topPlayer.color.toLowerCase() ? 'To Move' : 'Waiting'}
                  </span>
                )}
              </div>

              {/* Chessboard */}
              <div className="aspect-square w-full rounded-none overflow-hidden border-x border-slate-300 dark:border-zinc-800 shadow-sm relative">
                <Chessboard
                  options={{
                    position: currentFen,
                    boardOrientation: orientation,
                    allowDragging: false,
                    arrows: arrows,
                    squareStyles: customSquareStyles,
                    darkSquareStyle: { backgroundColor: '#779952' },
                    lightSquareStyle: { backgroundColor: '#edeed1' },
                  }}
                />
              </div>

              {/* Bottom Player Banner */}
              <div className="flex items-center justify-between px-3 py-1.5 bg-white dark:bg-black rounded-b-lg border border-slate-200 dark:border-zinc-800 text-xs shadow-xs transition-colors">
                <div className="flex items-center gap-2">
                  <div className={`w-3.5 h-3.5 rounded-full border border-slate-400 dark:border-zinc-700 ${bottomPlayer.color === 'Black' ? 'bg-slate-900 dark:bg-zinc-900' : 'bg-white'}`} />
                  <span className="font-semibold text-slate-900 dark:text-white truncate max-w-[180px]">
                    {bottomPlayer.name}
                  </span>
                </div>
                {activeGame?.turn && (
                  <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${
                    activeGame.turn.toLowerCase() === bottomPlayer.color.toLowerCase()
                      ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                      : 'bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-800'
                  }`}>
                    {activeGame.turn.toLowerCase() === bottomPlayer.color.toLowerCase() ? 'To Move' : 'Waiting'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Board Actions & Orientation */}
          <div className="flex items-center justify-between w-full max-w-[560px] bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs transition-colors">
            <button
              onClick={() => setOrientation((prev) => (prev === 'white' ? 'black' : 'white'))}
              className="flex items-center gap-1.5 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition font-medium"
            >
              <RotateCcw size={13} className="text-slate-500 dark:text-zinc-400" />
              <span>Flip Board ({orientation})</span>
            </button>

            <button
              onClick={() => setShowBestMoveArrow((p) => !p)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded border transition font-medium ${
                showBestMoveArrow
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                  : 'bg-slate-50 dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-800'
              }`}
            >
              <Compass size={13} />
              <span>Optimal Arrow: {showBestMoveArrow ? 'ON' : 'OFF'}</span>
            </button>
          </div>
        </div>

        {/* Right Column: Live Optimal Recommendation & Engine Insights */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Best Move Box */}
          <div className="bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-xl p-4 shadow-xs flex flex-col gap-3 transition-colors">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <Zap size={16} className="text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Real-Time Stockfish Engine
                </span>
              </div>
              {isEvaluating && (
                <span className="text-[11px] text-slate-500 dark:text-zinc-400 font-mono animate-pulse">
                  Computing...
                </span>
              )}
            </div>

            {optimalMoveData ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-800 dark:text-emerald-400 block">
                      Recommended Optimal Move
                    </span>
                    <span className="text-xl font-mono font-black text-emerald-900 dark:text-emerald-200">
                      {optimalMoveData.bestSan}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-400 block uppercase font-medium">
                      Position Eval
                    </span>
                    <span className="text-base font-mono font-bold text-emerald-900 dark:text-emerald-200">
                      {evalResult?.isMate 
                        ? `Mate in ${evalResult.mateIn}` 
                        : `${((evalResult?.score ?? 0) / 100).toFixed(2)}`}
                    </span>
                  </div>
                </div>

                {/* Best continuation variation */}
                {optimalMoveData.continuation.length > 0 && (
                  <div className="flex flex-col gap-1.5 p-3 rounded-lg bg-slate-50 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800">
                    <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                      <TrendingUp size={13} className="text-slate-500 dark:text-zinc-400" />
                      Stockfish Recommended Line:
                    </span>
                    <div className="flex flex-wrap gap-1 font-mono text-xs">
                      {optimalMoveData.continuation.slice(0, 8).map((san, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-zinc-200"
                        >
                          {san}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Win Chance Probability Bar */}
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between text-xs text-slate-600 dark:text-zinc-400 font-medium">
                    <span>White: {winChance.toFixed(1)}%</span>
                    <span>Black: {(100 - winChance).toFixed(1)}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden flex">
                    <div
                      className="bg-slate-900 dark:bg-white h-full transition-all duration-300"
                      style={{ width: `${winChance}%` }}
                    />
                    <div
                      className="bg-slate-400 dark:bg-zinc-600 h-full transition-all duration-300"
                      style={{ width: `${100 - winChance}%` }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-slate-400 dark:text-zinc-500 bg-slate-50 dark:bg-zinc-900/40 rounded-lg border border-slate-100 dark:border-zinc-800/80">
                {isPolling ? 'Waiting for move to land...' : 'Start tracking to compute live optimal moves.'}
              </div>
            )}
          </div>

          {/* Match Link & Post-Review Trigger */}
          {activeGame && (
            <div className="bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-xl p-4 shadow-xs flex flex-col gap-3 transition-colors">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-900 dark:text-white">Game Information</span>
                <a
                  href={activeGame.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition font-medium"
                >
                  <span>Open on Chess.com</span>
                  <ExternalLink size={12} />
                </a>
              </div>

              {activeGame.pgn && (
                <button
                  onClick={() => onReviewFinishedGame(activeGame.pgn!)}
                  className="w-full py-2 bg-slate-900 dark:bg-sky-500 hover:bg-slate-800 dark:hover:bg-sky-400 text-white dark:text-slate-950 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5"
                >
                  <span>Switch to Full Game Review</span>
                  <ChevronRight size={14} />
                </button>
              )}
            </div>
          )}

          {/* Minimal info banner */}
          <div className="p-3 bg-slate-50 dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800 rounded-lg text-xs text-slate-500 dark:text-zinc-400 flex items-start gap-2">
            <ShieldCheck size={16} className="text-slate-500 dark:text-zinc-400 shrink-0 mt-0.5" />
            <span>
              Real-time Stockfish Web Worker evaluates each new board position as soon as it is played on Chess.com.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
