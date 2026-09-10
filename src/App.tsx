import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Chess } from 'chess.js';
import type { GameAnalysisResult, MoveAnalysis } from './types/chess';
import { analyzePgn } from './services/analyzer';
import { stockfishService } from './services/stockfishService';
import { DEFAULT_PGN } from './data/samplePgn';
import { Navbar } from './components/Navbar';
import { GameHeader } from './components/GameHeader';
import { ChessBoardContainer } from './components/ChessBoardContainer';
import { PlaybackControls } from './components/PlaybackControls';
import { MoveList } from './components/MoveList';
import { OptimalComparison } from './components/OptimalComparison';
import { DualBoardView } from './components/DualBoardView';
import { AccuracySummary } from './components/AccuracySummary';
import { PgnModal } from './components/PgnModal';
import { LiveMatchTracker } from './components/LiveMatchTracker';
import { EvalGraph } from './components/EvalGraph';
import { AnalysisSkeleton } from './components/AnalysisSkeleton';

export const App: React.FC = () => {
  const [mode, setMode] = useState<'review' | 'live'>('review');
  const [pgn, setPgn] = useState<string>(DEFAULT_PGN);
  const [orientation, setOrientation] = useState<'white' | 'black'>('white');
  const [showDualBoard, setShowDualBoard] = useState<boolean>(false);
  const [showBestMoveArrow, setShowBestMoveArrow] = useState<boolean>(true);
  const [isViewingOptimal, setIsViewingOptimal] = useState<boolean>(false);
  const [currentPly, setCurrentPly] = useState<number>(0);
  const [analysis, setAnalysis] = useState<GameAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [progress, setProgress] = useState<{ current: number; total: number; message: string } | undefined>(undefined);
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentDepth, setCurrentDepth] = useState<number>(10);
  const totalPly = analysis?.moves.length ?? 0;
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('chuss-theme');
      if (saved === 'dark' || saved === 'light') return saved;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('chuss-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const [fens, setFens] = useState<string[]>(['rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1']);

  const activeAnalysisIdRef = useRef<number>(0);

  const runAnalysis = useCallback(async (pgnString: string, depth = 10) => {
    setCurrentDepth(depth);
    const thisAnalysisId = ++activeAnalysisIdRef.current;
    setIsAnalyzing(true);
    setIsPlaying(false);
    setIsViewingOptimal(false);
    setAnalysis(null);
    stockfishService.reset();

    try {
      const chess = new Chess();
      chess.loadPgn(pgnString);
      const moves = chess.history({ verbose: true });

      const replay = new Chess();
      const fenList: string[] = [replay.fen()];
      for (const m of moves) {
        replay.move(m);
        fenList.push(replay.fen());
      }
      setFens(fenList);
      setCurrentPly(0);

      const result = await analyzePgn(
        pgnString,
        depth,
        (p) => {
          if (activeAnalysisIdRef.current === thisAnalysisId) {
            setProgress(p);
          }
        },
        () => activeAnalysisIdRef.current !== thisAnalysisId
      );

      if (activeAnalysisIdRef.current === thisAnalysisId) {
        setAnalysis(result);
        setCurrentPly(1);
      }
    } catch (err: any) {
      if (err?.message !== 'Analysis cancelled') {
        console.error('Failed to parse or analyze PGN:', err);
      }
    } finally {
      if (activeAnalysisIdRef.current === thisAnalysisId) {
        setIsAnalyzing(false);
        setProgress(undefined);
      }
    }
  }, []);

  useEffect(() => {
    runAnalysis(DEFAULT_PGN, 10);
    return () => {
      activeAnalysisIdRef.current++;
      stockfishService.reset();
    };
  }, [runAnalysis]);

  useEffect(() => {
    if (!isPlaying) return;

    const timer = window.setInterval(() => {
      setIsViewingOptimal(false);
      setCurrentPly((prev) => {
        if (prev >= totalPly) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 1500);

    return () => window.clearInterval(timer);
  }, [isPlaying, totalPly]);

  const handleJumpToStart = () => {
    setIsPlaying(false);
    setIsViewingOptimal(false);
    setCurrentPly(0);
  };

  const handlePrev = () => {
    setIsPlaying(false);
    setIsViewingOptimal(false);
    setCurrentPly((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setIsPlaying(false);
    setIsViewingOptimal(false);
    setCurrentPly((prev) => Math.min(totalPly, prev + 1));
  };

  const handleJumpToEnd = () => {
    setIsPlaying(false);
    setIsViewingOptimal(false);
    setCurrentPly(totalPly);
  };

  const handleTogglePlay = () => {
    if (totalPly === 0) return;
    if (currentPly >= totalPly) {
      setCurrentPly(0);
    }
    setIsPlaying((prev) => !prev);
  };

  const handleFlipBoard = () => {
    setOrientation((prev) => (prev === 'white' ? 'black' : 'white'));
  };

  const currentMove: MoveAnalysis | undefined =
    analysis && currentPly > 0 ? analysis.moves[currentPly - 1] : undefined;

  const optimalFen = useMemo(() => {
    if (!currentMove?.fenBefore) return null;
    if (!currentMove.bestMoveSan && !currentMove.bestMoveUci) return null;

    try {
      const chess = new Chess(currentMove.fenBefore);
      if (currentMove.bestMoveSan) {
        const m = chess.move(currentMove.bestMoveSan);
        if (m) return chess.fen();
      }
      if (currentMove.bestMoveFrom && currentMove.bestMoveTo) {
        const m = chess.move({
          from: currentMove.bestMoveFrom,
          to: currentMove.bestMoveTo,
          promotion: 'q',
        });
        if (m) return chess.fen();
      }
    } catch {
      return null;
    }
    return null;
  }, [currentMove]);

  const hasOptimalAlternative = Boolean(
    currentMove &&
    currentMove.bestMoveSan &&
    currentMove.bestMoveSan !== currentMove.san &&
    optimalFen
  );

  const displayFen = isViewingOptimal && optimalFen
    ? optimalFen
    : fens[currentPly] || fens[0] || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black text-slate-900 dark:text-slate-100 flex flex-col transition-colors">
      <Navbar
        mode={mode}
        onSelectMode={setMode}
        onOpenImport={() => setIsImportModalOpen(true)}
        orientation={orientation}
        onFlipBoard={handleFlipBoard}
        showDualBoard={showDualBoard}
        onToggleDualBoard={() => setShowDualBoard((prev) => !prev)}
        onReanalyze={() => runAnalysis(pgn, currentDepth)}
        isAnalyzing={isAnalyzing}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-4 md:p-6 flex flex-col gap-6">
        {mode === 'live' ? (
          <LiveMatchTracker
            onReviewFinishedGame={(finishedPgn) => {
              setPgn(finishedPgn);
              setMode('review');
              runAnalysis(finishedPgn, 10);
            }}
          />
        ) : (
          <>
            <GameHeader
              headers={analysis?.headers || { White: 'demonexe2', Black: 'ccobb09', Result: '1-0' }}
              whiteAccuracy={analysis?.whiteAccuracy}
              blackAccuracy={analysis?.blackAccuracy}
              isAnalyzing={isAnalyzing}
              progress={progress}
            />

            {showDualBoard ? (
              <div className="flex flex-col gap-6">
                <DualBoardView
                  currentMove={currentMove}
                  orientation={orientation}
                  onFlipBoard={handleFlipBoard}
                />

                <div className="max-w-2xl mx-auto w-full">
                  <PlaybackControls
                    currentPly={currentPly}
                    totalPly={totalPly}
                    isPlaying={isPlaying}
                    onJumpToStart={handleJumpToStart}
                    onPrev={handlePrev}
                    onNext={handleNext}
                    onJumpToEnd={handleJumpToEnd}
                    onTogglePlay={handleTogglePlay}
                    onFlipBoard={handleFlipBoard}
                    orientation={orientation}
                    disabled={isImportModalOpen}
                  />
                </div>
                {analysis && analysis.moves.length > 0 && (
                  <div className="w-full">
                    <EvalGraph
                      moves={analysis.moves}
                      currentPly={currentPly}
                      onSelectPly={(ply) => {
                        setIsPlaying(false);
                        setIsViewingOptimal(false);
                        setCurrentPly(ply);
                      }}
                      orientation={orientation}
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                  <OptimalComparison
                    currentMove={currentMove}
                    showDualBoard={showDualBoard}
                    onToggleDualBoard={() => setShowDualBoard(false)}
                    showBestMoveArrow={showBestMoveArrow}
                    onToggleBestMoveArrow={() => setShowBestMoveArrow((p) => !p)}
                  />

                  <div className="h-[420px]">
                    <MoveList
                      moves={analysis?.moves || []}
                      currentPly={currentPly}
                      onSelectPly={(ply) => {
                        setIsPlaying(false);
                        setIsViewingOptimal(false);
                        setCurrentPly(ply);
                      }}
                      whiteName={analysis?.headers.White || 'White'}
                      blackName={analysis?.headers.Black || 'Black'}
                    />
                  </div>

                  {analysis && <AccuracySummary analysis={analysis} />}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-7 flex flex-col items-center gap-4">
                  <ChessBoardContainer
                    fen={displayFen}
                    orientation={orientation}
                    currentMove={currentMove}
                    showBestMoveArrow={showBestMoveArrow}
                    whiteName={analysis?.headers.White || 'demonexe2'}
                    blackName={analysis?.headers.Black || 'ccobb09'}
                    whiteElo={analysis?.headers.WhiteElo || '1085'}
                    blackElo={analysis?.headers.BlackElo || '536'}
                    isViewingOptimal={isViewingOptimal}
                    onToggleViewOptimal={() => setIsViewingOptimal((prev) => !prev)}
                    hasOptimalAlternative={hasOptimalAlternative}
                  />

                  <div className="w-full max-w-[560px]">
                    <PlaybackControls
                      currentPly={currentPly}
                      totalPly={totalPly}
                      isPlaying={isPlaying}
                      onJumpToStart={handleJumpToStart}
                      onPrev={handlePrev}
                      onNext={handleNext}
                      onJumpToEnd={handleJumpToEnd}
                      onTogglePlay={handleTogglePlay}
                      onFlipBoard={handleFlipBoard}
                      orientation={orientation}
                      disabled={isImportModalOpen}
                    />
                  </div>
                  {analysis && analysis.moves.length > 0 && (
                    <div className="w-full max-w-[560px]">
                      <EvalGraph
                        moves={analysis.moves}
                        currentPly={currentPly}
                        onSelectPly={(ply) => {
                          setIsPlaying(false);
                          setIsViewingOptimal(false);
                          setCurrentPly(ply);
                        }}
                        orientation={orientation}
                      />
                    </div>
                  )}
                </div>

                <div className="lg:col-span-5 flex flex-col gap-5">
                  {isAnalyzing && !analysis ? (
                    <AnalysisSkeleton progress={progress} depth={currentDepth} />
                  ) : (
                    <>
                      <OptimalComparison
                        currentMove={currentMove}
                        showDualBoard={showDualBoard}
                        onToggleDualBoard={() => setShowDualBoard(true)}
                        showBestMoveArrow={showBestMoveArrow}
                        onToggleBestMoveArrow={() => setShowBestMoveArrow((p) => !p)}
                      />

                      <div className="h-[300px]">
                        <MoveList
                          moves={analysis?.moves || []}
                          currentPly={currentPly}
                          onSelectPly={(ply) => {
                            setIsPlaying(false);
                            setIsViewingOptimal(false);
                            setCurrentPly(ply);
                          }}
                          whiteName={analysis?.headers.White || 'White'}
                          blackName={analysis?.headers.Black || 'Black'}
                        />
                      </div>

                      {analysis && <AccuracySummary analysis={analysis} />}
                    </>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      <PgnModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        currentPgn={pgn}
        onAnalyze={(newPgn, depth) => {
          setPgn(newPgn);
          runAnalysis(newPgn, depth);
        }}
      />
    </div>
  );
};

export default App;
