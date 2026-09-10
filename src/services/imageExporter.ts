import { Chess } from 'chess.js';
import type { MoveAnalysis, GameHeaders } from '../types/chess';

export interface ExportImageOptions {
  headers?: GameHeaders;
  currentMove?: MoveAnalysis;
  fen: string;
  orientation?: 'white' | 'black';
}

const PIECE_SYMBOLS: Record<string, string> = {
  wK: '♔', wQ: '♕', wR: '♖', wB: '♗', wN: '♘', wP: '♙',
  bK: '♚', bQ: '♛', bR: '♜', bB: '♝', bN: '♞', bP: '♟'
};

export async function exportPositionImage({
  headers,
  currentMove,
  fen,
  orientation = 'white',
}: ExportImageOptions): Promise<string> {
  const canvas = document.createElement('canvas');
  const width = 800;
  const height = 960;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to create canvas context');

  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = '#18181b';
  ctx.strokeStyle = '#27272a';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(30, 30, width - 60, height - 60, 16);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
  const whiteName = headers?.White || 'White';
  const blackName = headers?.Black || 'Black';
  ctx.fillText(`${whiteName} vs ${blackName}`, 60, 80);

  ctx.fillStyle = '#a1a1aa';
  ctx.font = '14px system-ui, -apple-system, sans-serif';
  const dateResult = `${headers?.Date || 'Date: -'} • Result: ${headers?.Result || '*'}`;
  ctx.fillText(dateResult, 60, 105);

  const boardX = 60;
  const boardY = 135;
  const boardSize = 680;
  const squareSize = boardSize / 8;

  ctx.strokeStyle = '#3f3f46';
  ctx.lineWidth = 2;
  ctx.strokeRect(boardX, boardY, boardSize, boardSize);

  const chess = new Chess(fen);
  const board = chess.board();

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

  const footerY = boardY + boardSize + 35;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';

  if (currentMove) {
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px system-ui, -apple-system, sans-serif';
    const moveText = `Move ${currentMove.moveNumber}${currentMove.color === 'w' ? '.' : '...'} ${currentMove.san}`;
    ctx.fillText(moveText, 60, footerY);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 15px ui-monospace, monospace';
    let evalText = '';
    if (currentMove.isMate) {
      evalText = `Mate in ${Math.abs(currentMove.mateIn ?? 1)}`;
    } else {
      const pawns = (currentMove.evalScore / 100).toFixed(2);
      evalText = `Eval: ${currentMove.evalScore >= 0 ? '+' : ''}${pawns}`;
    }
    ctx.fillText(evalText, 60, footerY + 28);

    if (currentMove.bestMoveSan && currentMove.bestMoveSan !== currentMove.san) {
      ctx.fillStyle = '#34d399';
      ctx.fillText(`Optimal Engine Move: ${currentMove.bestMoveSan}`, 300, footerY + 28);
    }
  } else {
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px system-ui, -apple-system, sans-serif';
    ctx.fillText('Starting Position', 60, footerY);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 15px ui-monospace, monospace';
    ctx.fillText('Eval: +0.20', 60, footerY + 28);
  }

  ctx.fillStyle = '#71717a';
  ctx.font = '13px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('Analyzed with Chess Move Analyzer (Stockfish)', width - 60, footerY);

  return canvas.toDataURL('image/png');
}

export function downloadImage(dataUrl: string, filename = 'chess_position.png') {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
