import { Chess } from 'chess.js';
import type { GameAnalysisResult } from '../types/chess';

export interface SummaryCardOptions {
  analysis: GameAnalysisResult;
  fen?: string;
  orientation?: 'white' | 'black';
}

const PIECE_SYMBOLS: Record<string, string> = {
  wK: '♔', wQ: '♕', wR: '♖', wB: '♗', wN: '♘', wP: '♙',
  bK: '♚', bQ: '♛', bR: '♜', bB: '♝', bN: '♞', bP: '♟'
};

const STAT_COLORS = {
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

export async function exportMatchSummaryCard({
  analysis,
  fen,
  orientation = 'white',
}: SummaryCardOptions): Promise<string> {
  const canvas = document.createElement('canvas');
  const width = 1200;
  const height = 630;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context not available');

  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = '#18181b';
  ctx.strokeStyle = '#27272a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(24, 24, width - 48, height - 48, 20);
  ctx.fill();
  ctx.stroke();

  const boardSize = 510;
  const boardX = 54;
  const boardY = (height - boardSize) / 2;
  const squareSize = boardSize / 8;

  const displayFen = fen || analysis.moves[analysis.moves.length - 1]?.fenAfter || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  let chess: Chess;
  try {
    chess = new Chess(displayFen);
  } catch {
    chess = new Chess();
  }
  const board = chess.board();

  ctx.strokeStyle = '#3f3f46';
  ctx.lineWidth = 2;
  ctx.strokeRect(boardX, boardY, boardSize, boardSize);

  const lightColor = '#edeed1';
  const darkColor = '#779952';

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const isLight = (row + col) % 2 === 0;
      const x = boardX + col * squareSize;
      const y = boardY + row * squareSize;

      ctx.fillStyle = isLight ? lightColor : darkColor;
      ctx.fillRect(x, y, squareSize, squareSize);

      const actualRow = orientation === 'white' ? row : 7 - row;
      const actualCol = orientation === 'white' ? col : 7 - col;
      const piece = board[actualRow][actualCol];

      if (piece) {
        const symbolKey = `${piece.color}${piece.type.toUpperCase()}`;
        const symbol = PIECE_SYMBOLS[symbolKey] || '';
        const cx = x + squareSize / 2;
        const cy = y + squareSize / 2 + 3;
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

  // Draw board coordinates
  ctx.font = 'bold 11px system-ui, sans-serif';
  for (let i = 0; i < 8; i++) {
    const rankLabel = orientation === 'white' ? `${8 - i}` : `${i + 1}`;
    const fileLabel = orientation === 'white' ? String.fromCharCode(97 + i) : String.fromCharCode(104 - i);

    ctx.fillStyle = (i % 2 === 0) ? darkColor : lightColor;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(rankLabel, boardX + 4, boardY + i * squareSize + 3);

    ctx.fillStyle = ((7 + i) % 2 === 0) ? darkColor : lightColor;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillText(fileLabel, boardX + (i + 1) * squareSize - 4, boardY + boardSize - 3);
  }

  const infoX = 600;
  let cursorY = 75;

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 30px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('Match Performance Review', infoX, cursorY);

  cursorY += 28;
  ctx.fillStyle = '#a1a1aa';
  ctx.font = '14px system-ui, sans-serif';
  const openingName = analysis.headers.Event || 'Game Analysis';
  const dateStr = analysis.headers.Date || new Date().toISOString().split('T')[0];
  ctx.fillText(`${openingName} • ${dateStr} • Result: ${analysis.headers.Result || '*'}`, infoX, cursorY);

  cursorY += 45;

  const cardW = 250;
  const cardH = 115;
  const gap = 30;

  // White Card
  ctx.fillStyle = '#27272a';
  ctx.beginPath();
  ctx.roundRect(infoX, cursorY, cardW, cardH, 12);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 16px system-ui, sans-serif';
  ctx.fillText(analysis.headers.White || 'White', infoX + 16, cursorY + 30);

  ctx.fillStyle = '#a1a1aa';
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillText(`Rating: ${analysis.headers.WhiteElo || 'Unrated'}`, infoX + 16, cursorY + 50);

  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 36px monospace';
  ctx.fillText(`${analysis.whiteAccuracy.toFixed(1)}%`, infoX + 16, cursorY + 95);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillText('ACCURACY', infoX + 165, cursorY + 90);

  // Black Card
  const blackX = infoX + cardW + gap;
  ctx.fillStyle = '#27272a';
  ctx.beginPath();
  ctx.roundRect(blackX, cursorY, cardW, cardH, 12);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 16px system-ui, sans-serif';
  ctx.fillText(analysis.headers.Black || 'Black', blackX + 16, cursorY + 30);

  ctx.fillStyle = '#a1a1aa';
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillText(`Rating: ${analysis.headers.BlackElo || 'Unrated'}`, blackX + 16, cursorY + 50);

  ctx.fillStyle = '#34d399';
  ctx.font = 'bold 36px monospace';
  ctx.fillText(`${analysis.blackAccuracy.toFixed(1)}%`, blackX + 16, cursorY + 95);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillText('ACCURACY', blackX + 165, cursorY + 90);

  cursorY += cardH + 45;

  ctx.fillStyle = '#e4e4e7';
  ctx.font = 'bold 14px system-ui, sans-serif';
  ctx.fillText('MOVE QUALITY BREAKDOWN', infoX, cursorY);

  cursorY += 20;

  const categories = [
    { label: 'Brilliant', key: 'brilliant', color: STAT_COLORS.brilliant },
    { label: 'Great', key: 'great', color: STAT_COLORS.great },
    { label: 'Best', key: 'best', color: STAT_COLORS.best },
    { label: 'Inaccuracy', key: 'inaccuracy', color: STAT_COLORS.inaccuracy },
    { label: 'Mistake', key: 'mistake', color: STAT_COLORS.mistake },
    { label: 'Blunder', key: 'blunder', color: STAT_COLORS.blunder },
  ] as const;

  const colW = (cardW * 2 + gap) / 3;
  categories.forEach((cat, idx) => {
    const cx = infoX + (idx % 3) * colW;
    const cy = cursorY + Math.floor(idx / 3) * 60;

    const wCount = analysis.whiteStats[cat.key] || 0;
    const bCount = analysis.blackStats[cat.key] || 0;

    ctx.fillStyle = '#27272a';
    ctx.beginPath();
    ctx.roundRect(cx, cy, colW - 12, 48, 8);
    ctx.fill();

    ctx.fillStyle = cat.color;
    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.fillText(cat.label, cx + 10, cy + 20);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px monospace';
    ctx.fillText(`W: ${wCount}  •  B: ${bCount}`, cx + 10, cy + 38);
  });

  cursorY += 150;
  ctx.fillStyle = '#71717a';
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillText(`Total Moves Analyzed: ${analysis.moves.length} • Analyzed with Stockfish 18 Engine`, infoX, cursorY);

  return canvas.toDataURL('image/png');
}

export function downloadSummaryCardImage(dataUrl: string, filename = 'match_summary.png'): void {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
