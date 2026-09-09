import { Chess, type Move } from 'chess.js';
import type { GameAnalysisResult, GameHeaders, MoveAnalysis, MoveClassification } from '../types/chess';
import { stockfishService, type PositionEval } from './stockfishService';

/**
 * Calculates win chance percentage (0 to 100) from centipawn evaluation.
 * Formula used by Lichess and modern chess statistics.
 */
export function calculateWinChance(centipawns: number): number {
  if (centipawns > 10000) return 100;
  if (centipawns < -10000) return 0;
  return 50 + 50 * (2 / (1 + Math.exp(-0.00368208 * centipawns)) - 1);
}

/**
 * Converts UCI move string (e.g. "e2e4", "g8f6", "e7e8q") into SAN using Chess instance.
 */
export function uciToSan(chessInstance: Chess, uci: string): { san: string; from: string; to: string } | null {
  if (!uci || uci.length < 4) return null;
  const from = uci.slice(0, 2);
  const to = uci.slice(2, 4);
  const promotion = uci.slice(4, 5) || undefined;

  try {
    const move = chessInstance.move({ from, to, promotion });
    if (move) {
      chessInstance.undo();
      return { san: move.san, from: move.from, to: move.to };
    }
  } catch {
  }
  return null;
}

/**
 * Converts a sequence of UCI moves to SAN moves from a given starting FEN.
 */
export function convertPvToSan(startingFen: string, pvUci: string[]): string[] {
  const chess = new Chess(startingFen);
  const sanList: string[] = [];

  for (const uci of pvUci) {
    if (!uci || uci.length < 4) break;
    const from = uci.slice(0, 2);
    const to = uci.slice(2, 4);
    const promotion = uci.slice(4, 5) || undefined;
    try {
      const move = chess.move({ from, to, promotion });
      if (move) {
        sanList.push(move.san);
      } else {
        break;
      }
    } catch {
      break;
    }
  }
  return sanList;
}

/**
 * Finds the square of the King that is currently in check.
 */
export function findInCheckKingSquare(chess: Chess): string | undefined {
  if (!chess.inCheck()) return undefined;
  const turn = chess.turn();
  const board = chess.board();
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (p && p.type === 'k' && p.color === turn) {
        const file = String.fromCharCode('a'.charCodeAt(0) + c);
        const rank = 8 - r;
        return `${file}${rank}`;
      }
    }
  }
  return undefined;
}

export function classifyMove(
  isBestMove: boolean,
  color: 'w' | 'b',
  evalBefore: number,
  evalAfter: number,
  isMateBefore: boolean,
  isMateAfter: boolean,
  isSacrifice: boolean,
  playedMove: Move,
  ply: number
): { classification: MoveClassification; centipawnLoss: number; winChanceDelta: number; explanation: string } {
  const playerEvalBefore = color === 'w' ? evalBefore : -evalBefore;
  const playerEvalAfter = color === 'w' ? evalAfter : -evalAfter;

  const winChanceBefore = calculateWinChance(playerEvalBefore);
  const winChanceAfter = calculateWinChance(playerEvalAfter);
  const winChanceDelta = Math.max(0, winChanceBefore - winChanceAfter);
  const centipawnLoss = Math.max(0, playerEvalBefore - playerEvalAfter);

  if (playedMove.san.includes('#')) {
    return {
      classification: 'best',
      centipawnLoss: 0,
      winChanceDelta: 0,
      explanation: 'Checkmate! The game is won.',
    };
  }

  if (ply <= 4 && winChanceDelta <= 1.0) {
    return {
      classification: 'book',
      centipawnLoss,
      winChanceDelta,
      explanation: 'Book move. Established opening theory.',
    };
  }

  if (isSacrifice && isBestMove && winChanceAfter >= 75 && winChanceDelta <= 1.5) {
    return {
      classification: 'brilliant',
      centipawnLoss,
      winChanceDelta,
      explanation: 'Brilliant move! A tactical piece sacrifice that maintains a winning attack.',
    };
  }

  if (isBestMove || winChanceDelta < 1.0) {
    return {
      classification: 'best',
      centipawnLoss,
      winChanceDelta,
      explanation: 'Optimal engine move.',
    };
  }

  if (winChanceBefore > 85 && winChanceAfter < 65) {
    return {
      classification: 'missed_win',
      centipawnLoss,
      winChanceDelta,
      explanation: 'Missed win! You had a decisive winning advantage.',
    };
  }

  if (winChanceDelta >= 20 || centipawnLoss >= 250 || (isMateBefore && !isMateAfter)) {
    let explanation = `Blunder! Severely compromises position (eval dropped ${(centipawnLoss / 100).toFixed(1)} pawns).`;
    if (isMateBefore && playerEvalBefore > 50000 && playerEvalAfter < 50000) {
      explanation = 'Blunder! Missed a forced checkmate sequence.';
    } else if (!isMateBefore && isMateAfter && playerEvalAfter < -50000) {
      explanation = 'Blunder! Allows the opponent a forced checkmate.';
    }

    return {
      classification: 'blunder',
      centipawnLoss,
      winChanceDelta,
      explanation,
    };
  }

  if (winChanceDelta >= 10 || centipawnLoss >= 120) {
    return {
      classification: 'mistake',
      centipawnLoss,
      winChanceDelta,
      explanation: `Mistake! Gives away advantage (dropped ${(centipawnLoss / 100).toFixed(1)} pawns).`,
    };
  }

  if (winChanceDelta >= 4 || centipawnLoss >= 50) {
    return {
      classification: 'inaccuracy',
      centipawnLoss,
      winChanceDelta,
      explanation: 'Inaccuracy. There were more active or solid alternatives.',
    };
  }

  if (winChanceDelta <= 2.0) {
    return {
      classification: 'excellent',
      centipawnLoss,
      winChanceDelta,
      explanation: 'Excellent move, nearly as strong as the engine recommendation.',
    };
  }

  return {
    classification: 'good',
    centipawnLoss,
    winChanceDelta,
    explanation: 'Good, solid move.',
  };
}

export async function analyzePgn(
  pgn: string,
  depth = 10,
  onProgress?: (progress: { current: number; total: number; message: string }) => void,
  isCancelled?: () => boolean
): Promise<GameAnalysisResult> {
  const chess = new Chess();
  chess.loadPgn(pgn);

  const rawHeaders = chess.header();
  const cleanHeader = (val: string | null | undefined) => (val && val !== '?' ? val : undefined);

  const headers: GameHeaders = {
    White: rawHeaders.White || 'White',
    Black: rawHeaders.Black || 'Black',
    Result: rawHeaders.Result || '*',
    Date: cleanHeader(rawHeaders.Date) || new Date().toISOString().split('T')[0],
    Site: cleanHeader(rawHeaders.Site) || 'Unknown Site',
    WhiteElo: cleanHeader(rawHeaders.WhiteElo),
    BlackElo: cleanHeader(rawHeaders.BlackElo),
    TimeControl: cleanHeader(rawHeaders.TimeControl),
    Termination: cleanHeader(rawHeaders.Termination),
    Event: cleanHeader(rawHeaders.Event),
  };

  const historyMoves = chess.history({ verbose: true });
  const totalMoves = historyMoves.length;

  const replayChess = new Chess();
  const moveAnalyses: MoveAnalysis[] = [];

  const whiteStats: Record<MoveClassification, number> = {
    brilliant: 0,
    great: 0,
    best: 0,
    excellent: 0,
    good: 0,
    inaccuracy: 0,
    mistake: 0,
    blunder: 0,
    missed_win: 0,
    book: 0,
  };

  const blackStats: Record<MoveClassification, number> = {
    brilliant: 0,
    great: 0,
    best: 0,
    excellent: 0,
    good: 0,
    inaccuracy: 0,
    mistake: 0,
    blunder: 0,
    missed_win: 0,
    book: 0,
  };

  let whiteWinLossSum = 0;
  let whiteCount = 0;
  let blackWinLossSum = 0;
  let blackCount = 0;

  let lastEval: PositionEval = {
    score: 20,
    isMate: false,
    bestMoveUci: 'e2e4',
    pvUci: ['e2e4', 'e7e5'],
    depth,
  };

  if (totalMoves > 0) {
    if (onProgress) {
      onProgress({
        current: 0,
        total: totalMoves,
        message: 'Initializing engine...',
      });
    }
    lastEval = await stockfishService.evaluatePosition(replayChess.fen(), depth);
  }

  for (let i = 0; i < totalMoves; i++) {
    if (isCancelled?.()) {
      throw new Error('Analysis cancelled');
    }

    const move = historyMoves[i];
    const fenBefore = replayChess.fen();
    const color = move.color;
    const moveNumber = Math.floor(i / 2) + 1;
    const ply = i + 1;

    if (onProgress) {
      onProgress({
        current: i + 1,
        total: totalMoves,
        message: `Analyzing move ${moveNumber}${color === 'w' ? '.' : '...'} ${move.san}`,
      });
    }

    const evalBefore = lastEval;

    if (isCancelled?.()) {
      throw new Error('Analysis cancelled');
    }

    const tempChess = new Chess(fenBefore);
    const bestMoveConverted = uciToSan(tempChess, evalBefore.bestMoveUci);
    const optimalLineSan = convertPvToSan(fenBefore, evalBefore.pvUci);

    replayChess.move(move);
    const fenAfter = replayChess.fen();
    const checkSquare = findInCheckKingSquare(replayChess);

    let evalAfter: PositionEval;
    if (replayChess.isCheckmate()) {
      evalAfter = {
        score: color === 'w' ? 100000 : -100000,
        isMate: true,
        mateIn: 0,
        bestMoveUci: '',
        pvUci: [],
        depth,
      };
    } else if (replayChess.isDraw()) {
      evalAfter = {
        score: 0,
        isMate: false,
        bestMoveUci: '',
        pvUci: [],
        depth,
      };
    } else {
      evalAfter = await stockfishService.evaluatePosition(fenAfter, depth);
    }
    lastEval = evalAfter;

    if (isCancelled?.()) {
      throw new Error('Analysis cancelled');
    }

    const playedUci = `${move.from}${move.to}${move.promotion || ''}`;
    const isBestMove = playedUci === evalBefore.bestMoveUci || move.san === bestMoveConverted?.san;

    const pieceValues: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
    const movedVal = pieceValues[move.piece] || 0;
    const capturedVal = move.captured ? pieceValues[move.captured] || 0 : 0;
    const opponentColor = color === 'w' ? 'b' : 'w';
    const isAttacked = replayChess.isAttacked(move.to as any, opponentColor as any);
    const isDefended = replayChess.isAttacked(move.to as any, color as any);
    // True sacrifice: major/minor piece moves into attack, captures less than moved value,
    // and is either completely undefended or moved a higher piece (Q/R) into attack by lower piece
    const isSacrifice =
      movedVal >= 3 &&
      isAttacked &&
      capturedVal < movedVal &&
      (!isDefended || (movedVal >= 5 && capturedVal <= 1));

    const classificationData = classifyMove(
      isBestMove,
      color,
      evalBefore.score,
      evalAfter.score,
      evalBefore.isMate,
      evalAfter.isMate,
      isSacrifice,
      move,
      ply
    );

    if (color === 'w') {
      whiteStats[classificationData.classification]++;
      whiteWinLossSum += classificationData.winChanceDelta;
      whiteCount++;
    } else {
      blackStats[classificationData.classification]++;
      blackWinLossSum += classificationData.winChanceDelta;
      blackCount++;
    }

    moveAnalyses.push({
      moveNumber,
      ply,
      color,
      san: move.san,
      uci: playedUci,
      from: move.from,
      to: move.to,
      fenBefore,
      fenAfter,
      checkSquare,
      evalScore: evalAfter.score,
      isMate: evalAfter.isMate,
      mateIn: evalAfter.mateIn,
      bestMoveSan: bestMoveConverted?.san,
      bestMoveUci: evalBefore.bestMoveUci,
      bestMoveFrom: bestMoveConverted?.from,
      bestMoveTo: bestMoveConverted?.to,
      bestMoveScore: evalBefore.score,
      bestMoveIsMate: evalBefore.isMate,
      bestMoveMateIn: evalBefore.mateIn,
      optimalLine: optimalLineSan,
      classification: classificationData.classification,
      centipawnLoss: classificationData.centipawnLoss,
      winChanceDelta: classificationData.winChanceDelta,
      explanation: classificationData.explanation,
    });
  }

  const whiteAvgWinLoss = whiteCount > 0 ? whiteWinLossSum / whiteCount : 0;
  const blackAvgWinLoss = blackCount > 0 ? blackWinLossSum / blackCount : 0;

  const whiteAccuracy = Math.max(10, Math.min(100, Math.round((100 - whiteAvgWinLoss * 1.5) * 10) / 10));
  const blackAccuracy = Math.max(10, Math.min(100, Math.round((100 - blackAvgWinLoss * 1.5) * 10) / 10));

  return {
    headers,
    moves: moveAnalyses,
    whiteAccuracy,
    blackAccuracy,
    whiteStats,
    blackStats,
    analyzedAt: new Date().toISOString(),
  };
}
