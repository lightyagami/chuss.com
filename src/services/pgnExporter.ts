import type { GameAnalysisResult, MoveClassification } from '../types/chess';

const NAG_MAP: Partial<Record<MoveClassification, string>> = {
  brilliant: '$3',
  best: '$1',
  great: '$1',
  excellent: '',
  good: '',
  inaccuracy: '$6',
  mistake: '$2',
  blunder: '$4',
  missed_win: '$4',
  book: '$146',
};

export function exportAnnotatedPgn(analysis: GameAnalysisResult): string {
  const headers = analysis.headers || {};
  const headerLines: string[] = [];

  const standardKeys = [
    'Event',
    'Site',
    'Date',
    'Round',
    'White',
    'Black',
    'Result',
    'WhiteElo',
    'BlackElo',
    'TimeControl',
    'Termination',
  ];

  for (const key of standardKeys) {
    if (headers[key]) {
      headerLines.push(`[${key} "${headers[key]}"]`);
    }
  }

  headerLines.push(`[Annotator "Chess Move Analyzer (Stockfish)"]`);
  headerLines.push(`[WhiteAccuracy "${analysis.whiteAccuracy.toFixed(1)}%"]`);
  headerLines.push(`[BlackAccuracy "${analysis.blackAccuracy.toFixed(1)}%"]`);
  headerLines.push('');

  const moveChunks: string[] = [];

  for (let i = 0; i < analysis.moves.length; i++) {
    const m = analysis.moves[i];
    const isWhite = m.color === 'w';
    let text = '';

    if (isWhite) {
      text += `${m.moveNumber}. `;
    } else {
      text += `${m.moveNumber}... `;
    }

    text += m.san;

    if (m.classification && NAG_MAP[m.classification]) {
      text += ` ${NAG_MAP[m.classification]}`;
    }

    const commentParts: string[] = [];

    if (m.isMate) {
      if (m.mateIn !== undefined && m.mateIn !== 0) {
        commentParts.push(`[%eval #${m.mateIn}]`);
      } else {
        commentParts.push(m.evalScore >= 0 ? '[%eval #1]' : '[%eval #-1]');
      }
    } else {
      const evalPawns = (m.evalScore / 100).toFixed(2);
      commentParts.push(`[%eval ${m.evalScore >= 0 ? '+' : ''}${evalPawns}]`);
    }

    if (m.classification && m.classification !== 'good' && m.classification !== 'book') {
      if (m.bestMoveSan && m.bestMoveSan !== m.san) {
        const bestEval = m.bestMoveScore !== undefined ? (m.bestMoveScore / 100).toFixed(2) : '';
        const evalStr = bestEval ? ` (${m.bestMoveScore! >= 0 ? '+' : ''}${bestEval})` : '';
        commentParts.push(`Optimal: ${m.bestMoveSan}${evalStr}`);
      }
    }

    if (commentParts.length > 0) {
      text += ` { ${commentParts.join(' ')} }`;
    }

    moveChunks.push(text);
  }

  const result = headers.Result || '*';
  moveChunks.push(result);

  return `${headerLines.join('\n')}\n${moveChunks.join(' ')}\n`;
}

export function downloadPgnFile(content: string, filename = 'analyzed_game.pgn') {
  const blob = new Blob([content], { type: 'application/x-chess-pgn' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
