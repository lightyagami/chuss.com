import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Chess } from 'chess.js';
import type { GameAnalysisResult, MoveAnalysis } from './types/chess';
import { analyzePgn } from './services/analyzer';
import { stockfishService } from './services/stockfishService';
import { exportAnnotatedPgn, downloadPgnFile } from './services/pgnExporter';
import { exportPositionImage, downloadImage } from './services/imageExporter';
import { DEFAULT_PGN } from './data/samplePgn';
import { Navbar, type AppMode } from './components/Navbar';
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
import { OpeningExplorer } from './components/OpeningExplorer';
import { BatchReviewDashboard } from './components/BatchReviewDashboard';
import { OpponentScout } from './components/OpponentScout';
import { PlayerCompare } from './components/PlayerCompare';
import { TacticsQuizModal } from './components/TacticsQuizModal';
import { VideoExportModal } from './components/VideoExportModal';

export const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>('review');
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
  const [isQuizModalOpen, setIsQuizModalOpen] = useState<boolean>(false);
  const [isVideoExportModalOpen, setIsVideoExportModalOpen] = useState<boolean>(false);
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

  const runAnalysis = useCallback(async (pgnToAnalyze: string, depth = 10) => {
    const currentId = ++activeAnalysisIdRef.current;
    setIsAnalyzing(true);
    setCurrentPly(0);
    setIsPlaying(false);
    setIsViewingOptimal(false);
    setCurrentDepth(depth);

    try {
      const chess = new Chess();
      chess.loadPgn(pgnToAnalyze);
      const history = chess.history();
      const rawHdrs = chess.header();
      const initialFen = rawHdrs.SetUp === '1' && rawHdrs.FEN ? rawHdrs.FEN : undefined;
      const replay = initialFen ? new Chess(initialFen) : new Chess();
      const generatedFens: string[] = [replay.fen()];
      for (const san of history) {
        replay.move(san);
        generatedFens.push(replay.fen());
      }
      setFens(generatedFens);
    } catch {
      setFens(['rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1']);
    }

    try {
      const result = await analyzePgn(
        pgnToAnalyze,
        depth,
        (prog) => {
          if (activeAnalysisIdRef.current === currentId) {
            setProgress(prog);
          }
        },
        () => activeAnalysisIdRef.current !== currentId
      );

      if (activeAnalysisIdRef.current === currentId) {
        setAnalysis(result);
        setIsAnalyzing(false);
        setProgress(undefined);
      }
    } catch (err) {
      if (activeAnalysisIdRef.current === currentId) {
        console.error('Analysis error:', err);
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

  const handlePrev = useCallback(() => {
    setIsPlaying(false);
    setIsViewingOptimal(false);
    setCurrentPly((prev) => Math.max(0, prev - 1));
  }, []);

  const handleNext = useCallback(() => {
    setIsPlaying(false);
    setIsViewingOptimal(false);
    setCurrentPly((prev) => Math.min(totalPly, prev + 1));
  }, [totalPly]);

  const handleJumpToStart = useCallback(() => {
    setIsPlaying(false);
    setIsViewingOptimal(false);
    setCurrentPly(0);
  }, []);

  const handleJumpToEnd = useCallback(() => {
    setIsPlaying(false);
    setIsViewingOptimal(false);
    setCurrentPly(totalPly);
  }, [totalPly]);

  const handleFlipBoard = useCallback(() => {
    setOrientation((prev) => (prev === 'white' ? 'black' : 'white'));
  }, []);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentPly((prev) => {
          if (prev >= totalPly) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, totalPly]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (mode !== 'review' || isImportModalOpen || isQuizModalOpen) {
        return;
      }
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        setIsPlaying((prev) => !prev);
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        handleFlipBoard();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode, isImportModalOpen, isQuizModalOpen, handlePrev, handleNext, handleFlipBoard]);

  const currentMove: MoveAnalysis | undefined =
    currentPly > 0 && analysis?.moves ? analysis.moves[currentPly - 1] : undefined;

  const optimalFen = useMemo<string | null>(() => {
    if (!currentMove) return null;
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

  const handleExportAnnotatedPgn = () => {
    if (!analysis) return;
    const pgnString = exportAnnotatedPgn(analysis);
    const white = analysis.headers.White || 'White';
    const black = analysis.headers.Black || 'Black';
    downloadPgnFile(pgnString, `${white}_vs_${black}_annotated.pgn`);
  };

  const handleExportCardImage = async () => {
    try {
      const dataUrl = await exportPositionImage({
        headers: analysis?.headers,
        currentMove,
        fen: displayFen,
        orientation,
      });
      downloadImage(dataUrl, `chess_move_${currentPly}.png`);
    } catch (e) {
      console.warn('Export image error:', e);
    }
  };

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
        onOpenTacticsQuiz={() => setIsQuizModalOpen(true)}
        onExportPgn={analysis ? handleExportAnnotatedPgn : undefined}
        onExportImage={handleExportCardImage}
        onOpenVideoModal={analysis ? () => setIsVideoExportModalOpen(true) : undefined}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-4 md:p-6 flex flex-col gap-6">
        {mode === 'live' && (
          <LiveMatchTracker
            onReviewFinishedGame={(finishedPgn) => {
              setPgn(finishedPgn);
              setMode('review');
              runAnalysis(finishedPgn, 10);
            }}
          />
        )}

        {mode === 'openings' && (
          <OpeningExplorer
            onLoadOpeningToAnalyzer={(openingPgn) => {
              setPgn(openingPgn);
              setMode('review');
              runAnalysis(openingPgn, 10);
            }}
          />
        )}

        {mode === 'batch' && (
          <BatchReviewDashboard
            onSelectGameToReview={(batchPgn) => {
              setPgn(batchPgn);
              setMode('review');
              runAnalysis(batchPgn, 10);
            }}
          />
        )}

        {mode === 'scout' && (
          <OpponentScout
            onReviewMatch={(scoutPgn) => {
              setPgn(scoutPgn);
              setMode('review');
              runAnalysis(scoutPgn, 10);
            }}
          />
        )}

        {mode === 'compare' && (
          <PlayerCompare />
        )}

        {mode === 'review' && (
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
                    onTogglePlay={() => setIsPlaying((prev) => !prev)}
                    orientation={orientation}
                    onFlipBoard={handleFlipBoard}
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
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-7 flex flex-col items-center gap-4">
                  <ChessBoardContainer
                    fen={displayFen}
                    orientation={orientation}
                    currentMove={currentMove}
                    showBestMoveArrow={showBestMoveArrow}
                    whiteName={analysis?.headers.White || 'White'}
                    blackName={analysis?.headers.Black || 'Black'}
                    whiteElo={analysis?.headers.WhiteElo}
                    blackElo={analysis?.headers.BlackElo}
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
                      onTogglePlay={() => setIsPlaying((prev) => !prev)}
                      orientation={orientation}
                      onFlipBoard={handleFlipBoard}
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
                        onExportCardImage={handleExportCardImage}
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

      <TacticsQuizModal
        isOpen={isQuizModalOpen}
        onClose={() => setIsQuizModalOpen(false)}
        analysis={analysis}
      />

      <VideoExportModal
        isOpen={isVideoExportModalOpen}
        onClose={() => setIsVideoExportModalOpen(false)}
        analysis={analysis}
        orientation={orientation}
      />
    </div>
  );
};

export default App;
