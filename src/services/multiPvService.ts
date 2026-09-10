import { Chess } from 'chess.js';
import { uciToSan } from './analyzer';

export interface MultiPvCandidate {
  rank: number;
  uci: string;
  san: string;
  score: number;
  isMate: boolean;
  mateIn?: number;
  pv: string[];
  pvSan: string[];
}

export class MultiPvEngine {
  private worker: Worker | null = null;

  constructor() {
    this.init();
  }

  private init() {
    try {
      if (typeof window === 'undefined') return;
      this.worker = new Worker('/stockfish.js');
      this.worker.postMessage('uci');
      this.worker.postMessage('setoption name MultiPV value 3');
      this.worker.postMessage('isready');
    } catch (e) {
      console.warn('MultiPvEngine worker init error:', e);
    }
  }

  async evaluateTopBranches(fen: string, depth = 10, linesCount = 3): Promise<MultiPvCandidate[]> {
    if (!this.worker) {
      return this.fallbackBranches(fen);
    }

    const workerInstance = this.worker;

    return new Promise<MultiPvCandidate[]>((resolve) => {
      const candidates: Record<number, Partial<MultiPvCandidate>> = {};
      const activeColor = fen.split(' ')[1] || 'w';

      const timeout = setTimeout(() => {
        cleanup();
        resolve(this.formatResults(fen, candidates, activeColor));
      }, Math.max(3000, depth * 500));

      const handler = (e: MessageEvent) => {
        const line = typeof e.data === 'string' ? e.data : '';

        if (line.startsWith('info') && line.includes('multipv')) {
          const multiPvMatch = line.match(/\bmultipv\s+(\d+)/);
          const cpMatch = line.match(/\bscore\s+cp\s+(-?\d+)/);
          const mateMatch = line.match(/\bscore\s+mate\s+(-?\d+)/);
          const pvMatch = line.match(/\bpv\s+(.+)$/);

          if (multiPvMatch) {
            const rank = parseInt(multiPvMatch[1], 10);
            if (!candidates[rank]) candidates[rank] = { rank };

            if (mateMatch) {
              candidates[rank].isMate = true;
              const mIn = parseInt(mateMatch[1], 10);
              candidates[rank].mateIn = mIn;
              candidates[rank].score = mIn > 0 ? 100000 : -100000;
            } else if (cpMatch) {
              candidates[rank].isMate = false;
              candidates[rank].score = parseInt(cpMatch[1], 10);
            }

            if (pvMatch) {
              const uciList = pvMatch[1].trim().split(/\s+/);
              candidates[rank].uci = uciList[0];
              candidates[rank].pv = uciList;
            }
          }
        }

        if (line.startsWith('bestmove')) {
          cleanup();
          resolve(this.formatResults(fen, candidates, activeColor));
        }
      };

      const cleanup = () => {
        clearTimeout(timeout);
        workerInstance.removeEventListener('message', handler);
      };

      workerInstance.addEventListener('message', handler);
      workerInstance.postMessage('stop');
      workerInstance.postMessage(`setoption name MultiPV value ${linesCount}`);
      workerInstance.postMessage(`position fen ${fen}`);
      workerInstance.postMessage(`go depth ${depth}`);
    });
  }

  private formatResults(
    fen: string,
    candidates: Record<number, Partial<MultiPvCandidate>>,
    activeColor: string
  ): MultiPvCandidate[] {
    const list: MultiPvCandidate[] = [];
    const ranks = Object.keys(candidates).map(Number).sort((a, b) => a - b);

    for (const rank of ranks) {
      const c = candidates[rank];
      if (!c.uci) continue;

      let score = c.score ?? 0;
      let mateIn = c.mateIn;
      if (activeColor === 'b') {
        score = -score;
        if (mateIn !== undefined) mateIn = -mateIn;
      }

      const chess = new Chess(fen);
      const converted = uciToSan(chess, c.uci);
      const san = converted?.san || c.uci;

      const pvSan: string[] = [];
      try {
        const replay = new Chess(fen);
        for (const uciMove of (c.pv || []).slice(0, 6)) {
          const from = uciMove.slice(0, 2);
          const to = uciMove.slice(2, 4);
          const promo = uciMove.slice(4, 5) || undefined;
          const m = replay.move({ from, to, promotion: promo });
          if (m) {
            pvSan.push(m.san);
          } else {
            break;
          }
        }
      } catch {}

      list.push({
        rank,
        uci: c.uci,
        san,
        score,
        isMate: c.isMate ?? false,
        mateIn,
        pv: c.pv || [],
        pvSan,
      });
    }

    if (list.length === 0) {
      return this.fallbackBranches(fen);
    }

    return list;
  }

  private fallbackBranches(fen: string): MultiPvCandidate[] {
    try {
      const chess = new Chess(fen);
      const legalMoves = chess.moves({ verbose: true });
      return legalMoves.slice(0, 3).map((m, idx) => ({
        rank: idx + 1,
        uci: `${m.from}${m.to}${m.promotion || ''}`,
        san: m.san,
        score: 0,
        isMate: false,
        pv: [`${m.from}${m.to}`],
        pvSan: [m.san],
      }));
    } catch {
      return [];
    }
  }
}

export const multiPvEngine = new MultiPvEngine();
