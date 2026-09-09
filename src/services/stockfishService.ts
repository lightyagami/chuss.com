export interface PositionEval {
  score: number;
  isMate: boolean;
  mateIn?: number;
  bestMoveUci: string;
  pvUci: string[];
  depth: number;
}

interface EvalJob {
  id: number;
  fen: string;
  depth: number;
  activeColor: 'w' | 'b';
  resolve: (result: PositionEval) => void;
  timeoutId?: ReturnType<typeof setTimeout>;
}

export class StockfishService {
  private worker: Worker | null = null;
  private isReady = false;
  private isSyncing = false;
  private queue: EvalJob[] = [];
  private activeJob: EvalJob | null = null;
  private currentEval: Partial<PositionEval> = {};
  private jobIdCounter = 0;
  private readyCallbacks: (() => void)[] = [];
  private hasReceivedScore = false;

  constructor() {
    this.initWorker();
  }

  private initWorker() {
    try {
      if (typeof window === 'undefined') return;

      this.worker = new Worker('/stockfish.js');

      this.worker.onmessage = (event: MessageEvent) => {
        const line = typeof event.data === 'string' ? event.data : '';
        this.handleEngineOutput(line);
      };

      this.worker.onerror = (err) => {
        console.warn('Stockfish worker error, recreating worker:', err);
        this.restartWorker();
      };

      this.worker.postMessage('uci');
      this.worker.postMessage('setoption name MultiPV value 1');
      this.worker.postMessage('isready');
    } catch (e) {
      console.warn('Could not initialize Stockfish web worker:', e);
    }
  }

  private restartWorker() {
    if (this.worker) {
      try {
        this.worker.terminate();
      } catch {}
      this.worker = null;
    }
    this.isReady = false;
    this.isSyncing = false;

    const pendingJobs = [...this.queue];
    this.queue = [];
    for (const job of pendingJobs) {
      clearTimeout(job.timeoutId);
      job.resolve(this.heuristicFallbackEval(job.fen));
    }

    if (this.activeJob) {
      clearTimeout(this.activeJob.timeoutId);
      const job = this.activeJob;
      this.activeJob = null;
      job.resolve(this.heuristicFallbackEval(job.fen));
    }
    this.initWorker();
  }

  private handleEngineOutput(line: string) {
    if (line === 'uciok' || line === 'readyok') {
      if (this.isSyncing) {
        this.isSyncing = false;
        this.processQueue();
        return;
      }
      this.isReady = true;
      const cbs = [...this.readyCallbacks];
      this.readyCallbacks = [];
      cbs.forEach((cb) => cb());
      this.processQueue();
      return;
    }

    if (this.isSyncing) return;

    if (line.startsWith('info') && line.includes('score')) {
      this.hasReceivedScore = true;
      const depthMatch = line.match(/\bdepth\s+(\d+)/);
      const cpMatch = line.match(/\bscore\s+cp\s+(-?\d+)/);
      const mateMatch = line.match(/\bscore\s+mate\s+(-?\d+)/);
      const pvMatch = line.match(/\bpv\s+(.+)$/);

      if (depthMatch) {
        this.currentEval.depth = parseInt(depthMatch[1], 10);
      }

      if (mateMatch) {
        this.currentEval.isMate = true;
        this.currentEval.mateIn = parseInt(mateMatch[1], 10);
        this.currentEval.score = this.currentEval.mateIn > 0 ? 100000 : -100000;
      } else if (cpMatch) {
        this.currentEval.isMate = false;
        this.currentEval.score = parseInt(cpMatch[1], 10);
      }

      if (pvMatch) {
        this.currentEval.pvUci = pvMatch[1].trim().split(/\s+/);
      }
    }

    if (line.startsWith('bestmove') && this.activeJob) {
      const parts = line.split(/\s+/);
      const bestMoveUci = parts[1] || '';
      const job = this.activeJob;
      clearTimeout(job.timeoutId);
      this.activeJob = null;

      if (!this.hasReceivedScore) {
        const fallback = this.heuristicFallbackEval(job.fen);
        const result: PositionEval = {
          ...fallback,
          bestMoveUci: bestMoveUci || fallback.bestMoveUci,
          depth: job.depth,
        };
        job.resolve(result);
        this.processQueue();
        return;
      }

      let score = this.currentEval.score ?? 0;
      let mateIn = this.currentEval.mateIn;

      if (job.activeColor === 'b') {
        score = -score;
        if (mateIn !== undefined) {
          mateIn = -mateIn;
        }
      }

      const result: PositionEval = {
        score,
        isMate: this.currentEval.isMate ?? false,
        mateIn,
        bestMoveUci: bestMoveUci || (this.currentEval.pvUci?.[0] ?? ''),
        pvUci: this.currentEval.pvUci ?? (bestMoveUci ? [bestMoveUci] : []),
        depth: this.currentEval.depth ?? job.depth,
      };

      job.resolve(result);

      this.processQueue();
    }
  }

  private processQueue() {
    if (this.activeJob !== null || !this.isReady || this.isSyncing || this.queue.length === 0) {
      return;
    }

    const job = this.queue.shift();
    if (!job) return;

    this.activeJob = job;
    this.hasReceivedScore = false;
    this.currentEval = {
      score: 0,
      isMate: false,
      pvUci: [],
      depth: 0,
    };

    const timeoutMs = Math.max(4000, job.depth * 700);
    job.timeoutId = setTimeout(() => {
      this.handleJobTimeout(job.id);
    }, timeoutMs);

    if (this.worker) {
      this.worker.postMessage(`position fen ${job.fen}`);
      this.worker.postMessage(`go depth ${job.depth}`);
    } else {
      clearTimeout(job.timeoutId);
      this.activeJob = null;
      job.resolve(this.heuristicFallbackEval(job.fen));
      this.processQueue();
    }
  }

  private handleJobTimeout(jobId: number) {
    if (this.activeJob && this.activeJob.id === jobId) {
      console.warn('Evaluation timed out for job', jobId, this.activeJob.fen);
      const job = this.activeJob;
      this.activeJob = null;
      job.resolve(this.heuristicFallbackEval(job.fen));

      this.resyncEngine();
    }
  }

  private resyncEngine() {
    if (!this.worker) return;
    this.isSyncing = true;
    try {
      this.worker.postMessage('stop');
      this.worker.postMessage('isready');
    } catch {
      this.restartWorker();
    }
  }

  /**
   * Resets any in-flight or queued jobs and puts engine in ready state.
   */
  reset() {
    const pendingJobs = [...this.queue];
    this.queue = [];
    for (const job of pendingJobs) {
      clearTimeout(job.timeoutId);
      job.resolve(this.heuristicFallbackEval(job.fen));
    }

    if (this.activeJob) {
      clearTimeout(this.activeJob.timeoutId);
      const job = this.activeJob;
      this.activeJob = null;
      job.resolve(this.heuristicFallbackEval(job.fen));
    }

    this.resyncEngine();
  }

  /**
   * Evaluates a FEN position at a given depth.
   * Returns a promise guaranteed to resolve (either from Stockfish or fallback).
   */
  evaluatePosition(fen: string, depth = 10): Promise<PositionEval> {
    if (!this.worker) {
      return Promise.resolve(this.heuristicFallbackEval(fen));
    }

    return new Promise<PositionEval>((resolve) => {
      const activeColor = (fen.split(' ')[1] || 'w') as 'w' | 'b';
      this.queue.push({
        id: ++this.jobIdCounter,
        fen,
        depth,
        activeColor,
        resolve,
      });

      this.processQueue();
    });
  }

  /**
   * Fast heuristic fallback if worker is unavailable or times out
   */
  private heuristicFallbackEval(fen: string): PositionEval {
    const pieceValues: Record<string, number> = {
      p: 100, n: 320, b: 330, r: 500, q: 900, k: 0,
      P: 100, N: 320, B: 330, R: 500, Q: 900, K: 0,
    };
    const boardPart = fen.split(' ')[0] || '';
    let whiteScore = 0;
    let blackScore = 0;
    for (const ch of boardPart) {
      if (pieceValues[ch] !== undefined) {
        if (ch >= 'A' && ch <= 'Z') {
          whiteScore += pieceValues[ch];
        } else {
          blackScore += pieceValues[ch];
        }
      }
    }
    return {
      score: whiteScore - blackScore,
      isMate: false,
      bestMoveUci: '',
      pvUci: [],
      depth: 1,
    };
  }

  terminate() {
    if (this.worker) {
      try {
        this.worker.postMessage('quit');
        this.worker.terminate();
      } catch {}
      this.worker = null;
    }
  }
}

export const stockfishService = new StockfishService();
