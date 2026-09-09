export type MoveClassification =
  | 'brilliant'
  | 'great'
  | 'best'
  | 'excellent'
  | 'good'
  | 'inaccuracy'
  | 'mistake'
  | 'blunder'
  | 'missed_win'
  | 'book';

export interface GameHeaders {
  Event?: string;
  Site?: string;
  Date?: string;
  Round?: string;
  White?: string;
  Black?: string;
  Result?: string;
  WhiteElo?: string;
  BlackElo?: string;
  TimeControl?: string;
  Termination?: string;
  [key: string]: string | undefined;
}

export interface MoveAnalysis {
  moveNumber: number;
  ply: number;
  color: 'w' | 'b';
  san: string;
  uci: string;
  from: string;
  to: string;
  fenBefore: string;
  fenAfter: string;
  checkSquare?: string;
  
  evalScore: number;
  isMate: boolean;
  mateIn?: number;
  
  bestMoveSan?: string;
  bestMoveUci?: string;
  bestMoveFrom?: string;
  bestMoveTo?: string;
  bestMoveScore?: number;
  bestMoveIsMate?: boolean;
  bestMoveMateIn?: number;
  optimalLine: string[];
  
  classification?: MoveClassification;
  centipawnLoss?: number;
  winChanceDelta?: number;
  explanation?: string;
}

export interface GameAnalysisResult {
  headers: GameHeaders;
  moves: MoveAnalysis[];
  whiteAccuracy: number;
  blackAccuracy: number;
  whiteStats: Record<MoveClassification, number>;
  blackStats: Record<MoveClassification, number>;
  analyzedAt: string;
}
