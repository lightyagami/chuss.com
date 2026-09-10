import React, { useState, useRef, useEffect } from 'react';
import { X, Play, Download, Film, Sparkles, Columns, CheckCircle2, AlertCircle } from 'lucide-react';
import type { GameAnalysisResult } from '../types/chess';
import { exportGameplayVideo, downloadVideoBlob, type VideoExportMode } from '../services/videoExporter';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  analysis: GameAnalysisResult | null;
  orientation: 'white' | 'black';
}

export const VideoExportModal: React.FC<Props> = ({
  isOpen,
  onClose,
  analysis,
  orientation,
}) => {
  const [mode, setMode] = useState<VideoExportMode>('actual');
  const [speed, setSpeed] = useState<number>(1.0);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [progress, setProgress] = useState<{ current: number; total: number; percent: number; message: string }>({
    current: 0,
    total: 0,
    percent: 0,
    message: '',
  });
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isCancelledRef = useRef<boolean>(false);
  const videoUrlRef = useRef<string | null>(null);

  useEffect(() => {
    videoUrlRef.current = videoUrl;
  }, [videoUrl]);

  useEffect(() => {
    return () => {
      if (videoUrlRef.current) {
        URL.revokeObjectURL(videoUrlRef.current);
      }
    };
  }, []);

  if (!isOpen) return null;

  const handleClose = () => {
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
      setVideoUrl(null);
    }
    setVideoBlob(null);
    setIsExporting(false);
    setError(null);
    isCancelledRef.current = false;
    onClose();
  };

  const handleStartExport = async () => {
    if (!analysis) return;
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
      setVideoUrl(null);
    }
    setVideoBlob(null);
    setError(null);
    setIsExporting(true);
    isCancelledRef.current = false;

    try {
      const blob = await exportGameplayVideo({
        analysis,
        mode,
        secondsPerMove: speed,
        orientation,
        onProgress: (p) => setProgress(p),
        isCancelled: () => isCancelledRef.current,
      });

      setVideoBlob(blob);
      const url = URL.createObjectURL(blob);
      setVideoUrl(url);
    } catch (err: unknown) {
      if (!isCancelledRef.current) {
        setError(err instanceof Error ? err.message : 'Export failed');
      }
    } finally {
      setIsExporting(false);
    }
  };

  const handleCancelExport = () => {
    isCancelledRef.current = true;
    setIsExporting(false);
  };

  const handleDownload = () => {
    if (!videoBlob || !analysis) return;
    const white = (analysis.headers.White || 'White').replace(/\s+/g, '_');
    const black = (analysis.headers.Black || 'Black').replace(/\s+/g, '_');
    const filename = `${white}_vs_${black}_${mode}.webm`;
    downloadVideoBlob(videoBlob, filename);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-zinc-800 shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400">
              <Film size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Export Animated Gameplay
              </h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Generate high-definition animated video replay with evaluation & annotations
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-900 transition"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-2.5">
              Select Presentation Mode
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                disabled={isExporting}
                onClick={() => setMode('actual')}
                className={`p-3.5 rounded-xl border text-left transition flex flex-col gap-1.5 ${
                  mode === 'actual'
                    ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-900 dark:text-indigo-200'
                    : 'border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-950 text-slate-700 dark:text-zinc-300'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-sm">
                  <Play size={16} className={mode === 'actual' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'} />
                  <span>Actual Gameplay</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
                  The match exactly as played with real-time eval bar, accuracy badge, and notation card.
                </p>
              </button>

              <button
                type="button"
                disabled={isExporting}
                onClick={() => setMode('optimal')}
                className={`p-3.5 rounded-xl border text-left transition flex flex-col gap-1.5 ${
                  mode === 'optimal'
                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-200'
                    : 'border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-950 text-slate-700 dark:text-zinc-300'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-sm">
                  <Sparkles size={16} className={mode === 'optimal' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'} />
                  <span>Optimized Play</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
                  Plays actual book moves, then diverges into Stockfish optimal continuation on inaccuracies.
                </p>
              </button>

              <button
                type="button"
                disabled={isExporting}
                onClick={() => setMode('dual')}
                className={`p-3.5 rounded-xl border text-left transition flex flex-col gap-1.5 ${
                  mode === 'dual'
                    ? 'border-purple-500 bg-purple-50/50 dark:bg-purple-950/20 text-purple-900 dark:text-purple-200'
                    : 'border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-950 text-slate-700 dark:text-zinc-300'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-sm">
                  <Columns size={16} className={mode === 'dual' ? 'text-purple-600 dark:text-purple-400' : 'text-slate-400'} />
                  <span>Dual Side-by-Side</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
                  Split screen comparing actual play on the left vs optimal Stockfish line on the right simultaneously.
                </p>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-2">
              Animation Speed (Pace per move)
            </label>
            <div className="flex items-center gap-2">
              {[
                { label: 'Fast (0.6s)', val: 0.6 },
                { label: 'Normal (1.0s)', val: 1.0 },
                { label: 'Relaxed (1.5s)', val: 1.5 },
              ].map((s) => (
                <button
                  key={s.val}
                  type="button"
                  disabled={isExporting}
                  onClick={() => setSpeed(s.val)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition ${
                    speed === s.val
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-black border-transparent font-semibold shadow-xs'
                      : 'border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-950 text-slate-700 dark:text-zinc-300'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {isExporting && (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 space-y-3">
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="text-slate-700 dark:text-zinc-300 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
                  {progress.message || 'Initializing recorder...'}
                </span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {progress.percent}%
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-zinc-800 overflow-hidden">
                <div
                  className="h-full bg-indigo-600 dark:bg-indigo-500 transition-all duration-200 rounded-full"
                  style={{ width: `${progress.percent}%` }}
                />
              </div>
            </div>
          )}

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex items-center gap-2.5 text-xs text-rose-700 dark:text-rose-400">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {videoUrl && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 size={15} />
                  Video rendered successfully
                </span>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition"
                >
                  <Download size={14} />
                  <span>Download WebM</span>
                </button>
              </div>
              <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-zinc-800 bg-black flex items-center justify-center max-h-[340px]">
                <video
                  controls
                  autoPlay
                  loop
                  src={videoUrl}
                  className="max-h-[340px] w-auto max-w-full"
                />
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 shrink-0 flex items-center justify-between">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-900 text-xs font-medium text-slate-700 dark:text-zinc-300 transition"
          >
            Close
          </button>

          <div className="flex items-center gap-2">
            {isExporting ? (
              <button
                type="button"
                onClick={handleCancelExport}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition"
              >
                Cancel
              </button>
            ) : (
              <button
                type="button"
                onClick={handleStartExport}
                className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition shadow-xs"
              >
                <Film size={14} />
                <span>{videoUrl ? 'Re-Render Video' : 'Render Video'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
