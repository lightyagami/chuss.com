import React, { useRef, useState, useMemo, useCallback } from 'react';
import type { MoveAnalysis } from '../types/chess';
import { TrendingUp } from 'lucide-react';

interface Props {
  moves: MoveAnalysis[];
  currentPly: number;
  onSelectPly: (ply: number) => void;
  orientation: 'white' | 'black';
}

export const EvalGraph: React.FC<Props> = ({
  moves,
  currentPly,
  onSelectPly,
  orientation,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [hoverPly, setHoverPly] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const totalMoves = moves.length;
  const width = 1000;
  const height = 140;
  const paddingY = 16;
  const zeroY = height / 2;

  const evalToY = useCallback((score: number, isMate?: boolean) => {
    let effective = score;
    if (isMate) {
      effective = score > 0 ? 1000 : -1000;
    }
    const clamped = Math.max(-1000, Math.min(1000, effective));
    const displayScore = orientation === 'black' ? -clamped : clamped;
    const usableHeight = height - paddingY * 2;
    const ratio = (displayScore + 1000) / 2000;
    return height - paddingY - ratio * usableHeight;
  }, [orientation, height, paddingY]);

  const points = useMemo(() => {
    if (totalMoves === 0) return [];
    
    const pts = [{ x: 0, y: zeroY, ply: 0, move: null as MoveAnalysis | null }];
    const stepX = width / Math.max(1, totalMoves);

    moves.forEach((m, idx) => {
      const x = (idx + 1) * stepX;
      const y = evalToY(m.evalScore, m.isMate);
      pts.push({ x, y, ply: m.ply, move: m });
    });

    return pts;
  }, [moves, totalMoves, width, zeroY, evalToY]);

  const linePath = useMemo(() => {
    if (points.length < 2) return '';
    return points.reduce((acc, p, idx) => {
      return idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
    }, '');
  }, [points]);

  const fillAreaPath = useMemo(() => {
    if (points.length < 2) return '';
    const first = points[0];
    const last = points[points.length - 1];
    return `${linePath} L ${last.x} ${zeroY} L ${first.x} ${zeroY} Z`;
  }, [points, linePath, zeroY]);

  const currentX = useMemo(() => {
    if (totalMoves === 0) return 0;
    const pt = points.find((p) => p.ply === currentPly);
    return pt ? pt.x : (currentPly / totalMoves) * width;
  }, [points, currentPly, totalMoves, width]);

  const getPlyFromMouse = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || totalMoves === 0) return 0;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const percent = mouseX / rect.width;
    const targetPly = Math.round(percent * totalMoves);
    return Math.max(0, Math.min(totalMoves, targetPly));
  }, [totalMoves]);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    const ply = getPlyFromMouse(e);
    onSelectPly(ply);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const ply = getPlyFromMouse(e);
    setHoverPly(ply);
    if (isDragging) {
      onSelectPly(ply);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setHoverPly(null);
    setIsDragging(false);
  };

  const activeHoverMove = useMemo(() => {
    if (hoverPly === null || hoverPly === 0) return null;
    return moves.find((m) => m.ply === hoverPly) || null;
  }, [hoverPly, moves]);

  if (totalMoves === 0) return null;

  return (
    <div className="glass-panel rounded-2xl p-4 flex flex-col gap-2 relative select-none">
      {}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <TrendingUp size={13} />
          </div>
          <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
            Evaluation Timeline
          </h4>
        </div>

        <div className="flex items-center gap-3 text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
            Brilliant
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
            Blunder
          </span>
          <span className="font-mono text-slate-300">
            Ply {currentPly}/{totalMoves}
          </span>
        </div>
      </div>

      {}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        className="relative h-28 w-full cursor-crosshair rounded-xl overflow-hidden bg-slate-950/70 border border-white/5 shadow-inner"
      >
        <svg
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
          className="w-full h-full"
        >
          <defs>
            {}
            <linearGradient id="evalGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(56, 189, 248, 0.45)" />
              <stop offset="50%" stopColor="rgba(99, 102, 241, 0.15)" />
              <stop offset="100%" stopColor="rgba(244, 63, 94, 0.45)" />
            </linearGradient>

            <linearGradient id="curveGlow" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="50%" stopColor="#818cf8" />
              <stop offset="100%" stopColor="#c084fc" />
            </linearGradient>
          </defs>

          {}
          <line
            x1="0"
            y1={zeroY}
            x2={width}
            y2={zeroY}
            stroke="rgba(255, 255, 255, 0.15)"
            strokeDasharray="4 4"
            strokeWidth="1"
          />
          <line
            x1="0"
            y1={paddingY}
            x2={width}
            y2={paddingY}
            stroke="rgba(255, 255, 255, 0.05)"
            strokeWidth="1"
          />
          <line
            x1="0"
            y1={height - paddingY}
            x2={width}
            y2={height - paddingY}
            stroke="rgba(255, 255, 255, 0.05)"
            strokeWidth="1"
          />

          {}
          <path d={fillAreaPath} fill="url(#evalGradient)" />

          {}
          <path
            d={linePath}
            fill="none"
            stroke="url(#curveGlow)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {}
          {points.map((p) => {
            if (!p.move) return null;
            const cls = p.move.classification;
            if (cls === 'brilliant') {
              return (
                <circle
                  key={p.ply}
                  cx={p.x}
                  cy={p.y}
                  r="5"
                  fill="#22d3ee"
                  stroke="#ffffff"
                  strokeWidth="1.5"
                  className="animate-pulse"
                />
              );
            }
            if (cls === 'blunder') {
              return (
                <circle
                  key={p.ply}
                  cx={p.x}
                  cy={p.y}
                  r="5"
                  fill="#f43f5e"
                  stroke="#ffffff"
                  strokeWidth="1.5"
                />
              );
            }
            if (cls === 'missed_win') {
              return (
                <circle
                  key={p.ply}
                  cx={p.x}
                  cy={p.y}
                  r="4"
                  fill="#fb7185"
                  stroke="#ffffff"
                  strokeWidth="1"
                />
              );
            }
            return null;
          })}

          {}
          <line
            x1={currentX}
            y1="0"
            x2={currentX}
            y2={height}
            stroke="#ffffff"
            strokeWidth="2"
            className="drop-shadow-[0_0_6px_rgba(255,255,255,0.8)]"
          />
          <circle
            cx={currentX}
            cy={points.find((p) => p.ply === currentPly)?.y ?? zeroY}
            r="5"
            fill="#ffffff"
            stroke="#6366f1"
            strokeWidth="2.5"
            className="drop-shadow-[0_0_8px_rgba(99,102,241,0.9)]"
          />
        </svg>

        {}
        {activeHoverMove && hoverPly !== null && (
          <div
            className="pointer-events-none absolute top-2 z-20 -translate-x-1/2 glass-panel-subtle px-2.5 py-1 rounded-lg text-xs font-mono text-slate-200 border border-white/15 shadow-xl flex items-center gap-1.5"
            style={{
              left: `${Math.max(10, Math.min(90, (hoverPly / totalMoves) * 100))}%`,
            }}
          >
            <span className="font-bold text-white">
              {activeHoverMove.moveNumber}
              {activeHoverMove.color === 'w' ? '.' : '...'} {activeHoverMove.san}
            </span>
            <span className="text-slate-400">|</span>
            <span
              className={`font-semibold ${
                activeHoverMove.evalScore >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {activeHoverMove.isMate
                ? `#${activeHoverMove.mateIn ?? ''}`
                : `${(activeHoverMove.evalScore / 100).toFixed(1)}`}
            </span>
            {activeHoverMove.classification && (
              <span className="text-[10px] uppercase font-bold text-cyan-300">
                {activeHoverMove.classification}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
