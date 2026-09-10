import React from 'react';
import { Chess, type Square } from 'chess.js';

export interface SquareHeat {
  square: Square;
  whiteAttacks: boolean;
  blackAttacks: boolean;
}

export function computeBoardHeatmap(fen: string): Record<string, React.CSSProperties> {
  let chess: Chess;
  try {
    chess = new Chess(fen);
  } catch {
    return {};
  }

  const styles: Record<string, React.CSSProperties> = {};
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = ['1', '2', '3', '4', '5', '6', '7', '8'];

  for (const f of files) {
    for (const r of ranks) {
      const sq = `${f}${r}` as Square;
      const whiteAttacks = chess.isAttacked(sq, 'w');
      const blackAttacks = chess.isAttacked(sq, 'b');

      if (whiteAttacks && blackAttacks) {
        styles[sq] = {
          backgroundColor: 'rgba(234, 179, 8, 0.28)',
          boxShadow: 'inset 0 0 4px rgba(234, 179, 8, 0.4)',
        };
      } else if (whiteAttacks) {
        styles[sq] = {
          backgroundColor: 'rgba(59, 130, 246, 0.20)',
        };
      } else if (blackAttacks) {
        styles[sq] = {
          backgroundColor: 'rgba(239, 68, 68, 0.20)',
        };
      }
    }
  }

  return styles;
}
