import { Chess } from 'chess.js';
import type { GameAnalysisResult, MoveClassification } from '../types/chess';

export type VideoExportMode = 'actual' | 'optimal' | 'dual';

export interface VideoExportOptions {
  analysis: GameAnalysisResult;
  mode: VideoExportMode;
  secondsPerMove?: number;
  orientation?: 'white' | 'black';
  onProgress?: (prog: { current: number; total: number; percent: number; message: string }) => void;
  isCancelled?: () => boolean;
}

interface FrameData {
  ply: number;
  moveNumber: number;
  color: 'w' | 'b';
  san: string;
  from?: string;
  to?: string;
  fen: string;
  evalScore: number;
  isMate: boolean;
  mateIn?: number;
  classification?: MoveClassification;
  explanation?: string;
}

interface DualFrameData {
  ply: number;
  actual: FrameData;
  optimal: FrameData;
}

const PIECE_SYMBOLS: Record<string, string> = {
  wK: '♔', wQ: '♕', wR: '♖', wB: '♗', wN: '♘', wP: '♙',
  bK: '♚', bQ: '♛', bR: '♜', bB: '♝', bN: '♞', bP: '♟'
};

const CLASSIFICATION_COLORS: Record<string, string> = {
  brilliant: '#06b6d4',
  great: '#10b981',
  best: '#10b981',
  excellent: '#14b8a6',
  good: '#3b82f6',
  inaccuracy: '#f59e0b',
  mistake: '#f97316',
  blunder: '#ef4444',
  missed_win: '#f43f5e',
  book: '#64748b',
};

function buildActualFrames(analysis: GameAnalysisResult): FrameData[] {
  const frames: FrameData[] = [];
  const startFen = analysis.moves[0]?.fenBefore || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

  frames.push({
    ply: 0,
    moveNumber: 1,
    color: 'w',
    san: 'Start',
    fen: startFen,
    evalScore: 20,
    isMate: false,
    explanation: 'Initial Position',
  });

  for (const m of analysis.moves) {
    frames.push({
      ply: m.ply,
      moveNumber: m.moveNumber,
      color: m.color,
      san: m.san,
      from: m.from,
      to: m.to,
      fen: m.fenAfter,
      evalScore: m.evalScore,
      isMate: m.isMate,
      mateIn: m.mateIn,
      classification: m.classification,
      explanation: m.explanation,
    });
  }

  return frames;
}

function buildOptimalFrames(analysis: GameAnalysisResult): FrameData[] {
  const frames: FrameData[] = [];
  const startFen = analysis.moves[0]?.fenBefore || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

  frames.push({
    ply: 0,
    moveNumber: 1,
    color: 'w',
    san: 'Start',
    fen: startFen,
    evalScore: 20,
    isMate: false,
    explanation: 'Initial Position',
  });

  let divergenceIndex = -1;
  for (let i = 0; i < analysis.moves.length; i++) {
    const m = analysis.moves[i];
    if (m.classification === 'blunder' || m.classification === 'missed_win' || m.classification === 'mistake') {
      if (m.optimalLine && m.optimalLine.length > 0) {
        divergenceIndex = i;
        break;
      }
    }
  }

  if (divergenceIndex === -1) {
    return buildActualFrames(analysis);
  }

  for (let i = 0; i < divergenceIndex; i++) {
    const m = analysis.moves[i];
    frames.push({
      ply: m.ply,
      moveNumber: m.moveNumber,
      color: m.color,
      san: m.san,
      from: m.from,
      to: m.to,
      fen: m.fenAfter,
      evalScore: m.evalScore,
      isMate: m.isMate,
      mateIn: m.mateIn,
      classification: m.classification,
      explanation: m.explanation,
    });
  }

  const divMove = analysis.moves[divergenceIndex];
  try {
    const chess = new Chess(divMove.fenBefore);
    for (let k = 0; k < divMove.optimalLine.length; k++) {
      const san = divMove.optimalLine[k];
      const m = chess.move(san);
      if (!m) break;
      const stepPly = divMove.ply + k;
      const stepMoveNum = Math.floor((stepPly - 1) / 2) + 1;
      frames.push({
        ply: stepPly,
        moveNumber: stepMoveNum,
        color: m.color,
        san: m.san,
        from: m.from,
        to: m.to,
        fen: chess.fen(),
        evalScore: divMove.bestMoveScore ?? divMove.evalScore,
        isMate: divMove.bestMoveIsMate ?? false,
        mateIn: divMove.bestMoveMateIn,
        classification: k === 0 ? 'best' : undefined,
        explanation: k === 0 ? `Optimal engine alternative to ${divMove.san}` : 'Optimal continuation',
      });
    }
  } catch {}

  return frames;
}

function buildDualFrames(analysis: GameAnalysisResult): DualFrameData[] {
  const actual = buildActualFrames(analysis);
  const optimal = buildOptimalFrames(analysis);
  const total = Math.max(actual.length, optimal.length);
  const dual: DualFrameData[] = [];

  for (let i = 0; i < total; i++) {
    const act = actual[i] || actual[actual.length - 1];
    const opt = optimal[i] || optimal[optimal.length - 1];
    dual.push({
      ply: i,
      actual: act,
      optimal: opt,
    });
  }

  return dual;
}

function drawBoard(
  ctx: CanvasRenderingContext2D,
  fen: string,
  boardX: number,
  boardY: number,
  boardSize: number,
  orientation: 'white' | 'black',
  fromSq?: string,
  toSq?: string,
  highlightColor = 'rgba(234, 179, 8, 0.35)'
) {
  const squareSize = boardSize / 8;
  const lightColor = '#edeed1';
  const darkColor = '#779952';

  ctx.strokeStyle = '#27272a';
  ctx.lineWidth = 2;
  ctx.strokeRect(boardX, boardY, boardSize, boardSize);

  let board: (any)[][] = [];
  try {
    const c = new Chess(fen);
    board = c.board();
  } catch {
    board = new Chess().board();
  }

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const isLight = (row + col) % 2 === 0;
      const x = boardX + col * squareSize;
      const y = boardY + row * squareSize;

      ctx.fillStyle = isLight ? lightColor : darkColor;
      ctx.fillRect(x, y, squareSize, squareSize);

      const actualRow = orientation === 'white' ? row : 7 - row;
      const actualCol = orientation === 'white' ? col : 7 - col;

      const fileLetter = String.fromCharCode(97 + actualCol);
      const rankNum = 8 - actualRow;
      const squareName = `${fileLetter}${rankNum}`;

      if (squareName === fromSq || squareName === toSq) {
        ctx.fillStyle = highlightColor;
        ctx.fillRect(x, y, squareSize, squareSize);
      }

      const piece = board[actualRow][actualCol];
      if (piece) {
        const symbolKey = `${piece.color}${piece.type.toUpperCase()}`;
        const symbol = PIECE_SYMBOLS[symbolKey] || '';
        const cx = x + squareSize / 2;
        const cy = y + squareSize / 2 + 4;
        ctx.font = `${squareSize * 0.72}px system-ui, "DejaVu Sans", "Segoe UI Symbol", "Apple Color Emoji", serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.strokeStyle = piece.color === 'w' ? '#0f172a' : '#f8fafc';
        ctx.lineWidth = piece.color === 'w' ? 2 : 1;
        ctx.strokeText(symbol, cx, cy);
        ctx.fillStyle = piece.color === 'w' ? '#ffffff' : '#09090b';
        ctx.fillText(symbol, cx, cy);
      }
    }
  }

  ctx.font = 'bold 10px system-ui, sans-serif';
  for (let i = 0; i < 8; i++) {
    const rankLabel = orientation === 'white' ? `${8 - i}` : `${i + 1}`;
    const fileLabel = orientation === 'white' ? String.fromCharCode(97 + i) : String.fromCharCode(104 - i);

    ctx.fillStyle = (i % 2 === 0) ? darkColor : lightColor;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(rankLabel, boardX + 3, boardY + i * squareSize + 3);

    ctx.fillStyle = ((7 + i) % 2 === 0) ? darkColor : lightColor;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillText(fileLabel, boardX + (i + 1) * squareSize - 3, boardY + boardSize - 3);
  }
}

function drawSingleFrame(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  analysis: GameAnalysisResult,
  frame: FrameData,
  orientation: 'white' | 'black',
  subTitle: string
) {
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = '#18181b';
  ctx.strokeStyle = '#27272a';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(24, 24, width - 48, height - 48, 16);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 20px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  const whiteName = analysis.headers.White || 'White';
  const blackName = analysis.headers.Black || 'Black';
  ctx.fillText(`${whiteName} vs ${blackName}`, 48, 64);

  ctx.fillStyle = '#a1a1aa';
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillText(subTitle, 48, 86);

  const boardSize = Math.min(width - 96, height - 240);
  const boardX = (width - boardSize) / 2;
  const boardY = 110;

  drawBoard(
    ctx,
    frame.fen,
    boardX,
    boardY,
    boardSize,
    orientation,
    frame.from,
    frame.to
  );

  const footerY = boardY + boardSize + 36;
  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 18px system-ui, sans-serif';
  const moveText = frame.ply === 0
    ? 'Starting Position'
    : `Move ${frame.moveNumber}${frame.color === 'w' ? '.' : '...'} ${frame.san}`;
  ctx.fillText(moveText, 48, footerY);

  let evalText = '';
  if (frame.isMate) {
    evalText = `Mate in ${Math.abs(frame.mateIn ?? 1)}`;
  } else {
    const pawns = frame.evalScore / 100;
    const absVal = Math.abs(pawns) < 0.05 ? '0.0' : (pawns > 0 ? `+${pawns.toFixed(2)}` : pawns.toFixed(2));
    evalText = `Eval: ${absVal}`;
  }
  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 14px monospace';
  ctx.fillText(evalText, 48, footerY + 26);

  if (frame.classification) {
    const badgeColor = CLASSIFICATION_COLORS[frame.classification] || '#10b981';
    ctx.fillStyle = badgeColor;
    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.textAlign = 'right';
    const tag = frame.classification.toUpperCase().replace('_', ' ');
    ctx.fillText(tag, width - 48, footerY);

    if (frame.explanation) {
      ctx.fillStyle = '#a1a1aa';
      ctx.font = '12px system-ui, sans-serif';
      ctx.fillText(frame.explanation, width - 48, footerY + 24);
    }
  }
}

function drawDualFrame(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  _analysis: GameAnalysisResult,
  dual: DualFrameData,
  orientation: 'white' | 'black'
) {
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = '#18181b';
  ctx.strokeStyle = '#27272a';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(24, 20, width - 48, height - 40, 16);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 20px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('Actual Gameplay vs Optimal Engine Play', width / 2, 54);

  const boardSize = 480;
  const boardY = 110;
  const gap = 60;
  const totalBoardWidth = boardSize * 2 + gap;
  const leftBoardX = (width - totalBoardWidth) / 2;
  const rightBoardX = leftBoardX + boardSize + gap;

  ctx.textAlign = 'center';
  ctx.font = 'bold 14px system-ui, sans-serif';
  ctx.fillStyle = '#f59e0b';
  ctx.fillText('ACTUAL PLAYED GAME', leftBoardX + boardSize / 2, 92);

  ctx.fillStyle = '#10b981';
  ctx.fillText('OPTIMAL ENGINE PLAY', rightBoardX + boardSize / 2, 92);

  drawBoard(
    ctx,
    dual.actual.fen,
    leftBoardX,
    boardY,
    boardSize,
    orientation,
    dual.actual.from,
    dual.actual.to,
    'rgba(234, 179, 8, 0.4)'
  );

  drawBoard(
    ctx,
    dual.optimal.fen,
    rightBoardX,
    boardY,
    boardSize,
    orientation,
    dual.optimal.from,
    dual.optimal.to,
    'rgba(16, 185, 129, 0.4)'
  );

  const footerY = boardY + boardSize + 32;

  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 16px system-ui, sans-serif';
  const actText = dual.actual.ply === 0
    ? 'Start'
    : `Move ${dual.actual.moveNumber}${dual.actual.color === 'w' ? '.' : '...'} ${dual.actual.san}`;
  ctx.fillText(actText, leftBoardX + boardSize / 2, footerY);

  const actPawns = (dual.actual.evalScore / 100).toFixed(2);
  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 13px monospace';
  ctx.fillText(`Eval: ${dual.actual.evalScore >= 0 ? '+' : ''}${actPawns}`, leftBoardX + boardSize / 2, footerY + 22);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 16px system-ui, sans-serif';
  const optText = dual.optimal.ply === 0
    ? 'Start'
    : `Move ${dual.optimal.moveNumber}${dual.optimal.color === 'w' ? '.' : '...'} ${dual.optimal.san}`;
  ctx.fillText(optText, rightBoardX + boardSize / 2, footerY);

  const optPawns = (dual.optimal.evalScore / 100).toFixed(2);
  ctx.fillStyle = '#34d399';
  ctx.font = 'bold 13px monospace';
  ctx.fillText(`Optimal Eval: ${dual.optimal.evalScore >= 0 ? '+' : ''}${optPawns}`, rightBoardX + boardSize / 2, footerY + 22);
}

export async function exportGameplayVideo({
  analysis,
  mode,
  secondsPerMove = 1.0,
  orientation = 'white',
  onProgress,
  isCancelled,
}: VideoExportOptions): Promise<Blob> {
  const isDual = mode === 'dual';
  const width = isDual ? 1280 : 800;
  const height = isDual ? 760 : 960;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');

  const stream = canvas.captureStream(30);

  let mimeType = 'video/webm;codecs=vp9';
  if (!MediaRecorder.isTypeSupported(mimeType)) {
    mimeType = 'video/webm';
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = '';
    }
  }

  const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
  const chunks: Blob[] = [];

  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) {
      chunks.push(e.data);
    }
  };

  recorder.start();

  const subTitle = mode === 'actual'
    ? 'Replay of Actual Game with Evaluation'
    : 'Stockfish Optimal Continuation Line';

  const singleFrames = !isDual
    ? (mode === 'actual' ? buildActualFrames(analysis) : buildOptimalFrames(analysis))
    : [];
  const dualFrames = isDual ? buildDualFrames(analysis) : [];
  const totalFrames = isDual ? dualFrames.length : singleFrames.length;

  const stepMs = Math.max(400, Math.round(secondsPerMove * 1000));

  for (let idx = 0; idx < totalFrames; idx++) {
    if (isCancelled?.()) {
      recorder.stop();
      throw new Error('Video export cancelled');
    }

    if (onProgress) {
      const percent = Math.round(((idx + 1) / totalFrames) * 100);
      onProgress({
        current: idx + 1,
        total: totalFrames,
        percent,
        message: `Rendering move ${idx + 1} of ${totalFrames} (${percent}%)...`,
      });
    }

    if (isDual) {
      drawDualFrame(ctx, width, height, analysis, dualFrames[idx], orientation);
    } else {
      drawSingleFrame(ctx, width, height, analysis, singleFrames[idx], orientation, subTitle);
    }

    await new Promise((r) => setTimeout(r, stepMs));
  }

  await new Promise((r) => setTimeout(r, 1200));

  return new Promise<Blob>((resolve) => {
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      resolve(blob);
    };
    recorder.stop();
  });
}

export function downloadVideoBlob(blob: Blob, filename = 'gameplay_analysis.webm'): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
