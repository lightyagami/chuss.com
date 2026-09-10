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

interface ActiveMultiPvJob {
  id: number;
  fen: string;
  activeColor: string;
  candidates: Record<number, Partial<MultiPvCandidate>>;
  resolve: (results: MultiPvCandidate[]) => void;
  timeoutId: ReturnType<typeof setTimeout>;
}

export class MultiPvEngine {
  private worker: Worker | null = null;
  private activeJob: ActiveMultiPvJob | null = null;
  private jobCounter = 0;

  constructor() {
    this.init();
  }

  private init() {
    try {
      if (typeof window === 'undefined') return;
      this.worker = new Worker('/stockfish.js');
      this.worker.addEventListener('message', this.handleMessage.bind(this));
      this.worker.postMessage('uci');
      this.worker.postMessage('setoption name MultiPV value 3');
      this.worker.postMessage('isready');
    } catch (e) {
      console.warn('MultiPvEngine worker init error:', e);
    }
  }

  private handleMessage(e: MessageEvent) {
    if (!this.activeJob) return;
    const line = typeof e.data === 'string' ? e.data : '';

    if (line.startsWith('info') && line.includes('multipv')) {
      const multiPvMatch = line.match(/\bmultipv\s+(\d+)/);
      const cpMatch = line.match(/\bscore\s+cp\s+(-?\d+)/);
      const mateMatch = line.match(/\bscore\s+mate\s+(-?\d+)/);
      const pvMatch = line.match(/\bpv\s+(.+)$/);

      if (multiPvMatch) {
        const rank = parseInt(multiPvMatch[1], 10);
        if (!this.activeJob.candidates[rank]) {
          this.activeJob.candidates[rank] = { rank };
        }

        if (mateMatch) {
          this.activeJob.candidates[rank].isMate = true;
          const mIn = parseInt(mateMatch[1], 10);
          this.activeJob.candidates[rank].mateIn = mIn;
          this.activeJob.candidates[rank].score = mIn > 0 ? 100000 : -100000;
        } else if (cpMatch) {
          this.activeJob.candidates[rank].isMate = false;
          this.activeJob.candidates[rank].score = parseInt(cpMatch[1], 10);
        }

        if (pvMatch) {
          const uciList = pvMatch[1].trim().split(/\s+/);
          this.activeJob.candidates[rank].uci = uciList[0];
          this.activeJob.candidates[rank].pv = uciList;
        }
      }
    }

    if (line.startsWith('bestmove')) {
      const job = this.activeJob;
      clearTimeout(job.timeoutId);
      this.activeJob = null;
      const formatted = this.formatResults(job.fen, job.candidates, job.activeColor);
      job.resolve(formatted);
    }
  }

  cancel() {
    if (this.activeJob) {
      clearTimeout(this.activeJob.timeoutId);
      const job = this.activeJob;
      this.activeJob = null;
      job.resolve(this.fallbackBranches(job.fen));
    }
    if (this.worker) {
      this.worker.postMessage('stop');
    }
  }

  async evaluateTopBranches(fen: string, depth = 10, linesCount = 3): Promise<MultiPvCandidate[]> {
    if (!this.worker) {
      return this.fallbackBranches(fen);
    }

    this.cancel();

    const jobId = ++this.jobCounter;
    const activeColor = fen.split(' ')[1] || 'w';

    return new Promise<MultiPvCandidate[]>((resolve) => {
      const timeoutId = setTimeout(() => {
        if (this.activeJob && this.activeJob.id === jobId) {
          const job = this.activeJob;
          this.activeJob = null;
          resolve(this.formatResults(fen, job.candidates, activeColor));
        }
      }, Math.max(3000, depth * 500));

      this.activeJob = {
        id: jobId,
        fen,
        activeColor,
        candidates: {},
        resolve,
        timeoutId,
      };

      this.worker!.postMessage(`setoption name MultiPV value ${linesCount}`);
      this.worker!.postMessage(`position fen ${fen}`);
      this.worker!.postMessage(`go depth ${depth}`);
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
