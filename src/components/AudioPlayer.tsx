import React, { useRef, useCallback, useEffect } from "react";
import { motion } from "motion/react";
import { Play, Pause, ChevronLeft, ChevronRight, Loader2, AlertCircle, X } from "lucide-react";
import { useAppStore } from "../store/useAppStore";
import { audioEngine } from "../lib/audioEngine";
import { vibrate } from "../lib/utils";

/**
 * ─── AudioPlayer — Premium Audio Player Component ───────────────────────────
 *
 * Design is UNCHANGED. Internal logic upgraded to Architecture v2:
 * - Reads isPlaying / isBuffering / progress from useAppStore (not local state).
 * - All players (Main + Mini) are always in perfect sync via the global store.
 * - Track switching is instant (< 100ms) via AudioEngine + PlaySequence guard.
 * - No more preventAutoPause race condition.
 * - Lock screen controls always in sync (MediaSession via AudioEngine).
 *
 * ────────────────────────────────────────────────────────────────────────────
 */

function AudioPlayer({
  url,
  onEnded,
  onPlay,
  onPause,
  onNext,
  onPrev,
  autoPlay = false,
  title = 'सबदवाणी',
  showToast,
  variant = 'full',
  onClose,
  onClick,
  hideTitle = false,
  logoUrl,
  // preventAutoPause is kept for API compatibility but is no longer used.
  // Track management is fully handled by AudioEngine now.
  preventAutoPause,
  playingSabad,
  selectedSabad,
}: {
  url: string;
  onEnded?: () => void;
  onPlay?: () => void;
  onPause?: () => void;
  onNext?: () => void;
  onPrev?: () => void;
  autoPlay?: boolean;
  title?: string;
  showToast?: (msg: string) => void;
  variant?: 'full' | 'mini';
  onClose?: () => void;
  onClick?: () => void;
  hideTitle?: boolean;
  logoUrl?: string;
  preventAutoPause?: boolean;
  playingSabad?: any;
  selectedSabad?: any;
}) {
  // ── Read from global store (Single Source of Truth) ──────────────────────
  const audioIsPlaying   = useAppStore(s => s.audioIsPlaying);
  const audioIsBuffering = useAppStore(s => s.audioIsBuffering);
  const audioProgress    = useAppStore(s => s.audioProgress);
  const audioError       = useAppStore(s => s.audioError);
  const storePlayingSabad = useAppStore(s => s.playingSabad);

  // Is THIS player's track the one currently loaded in the engine?
  const isActiveTrack = !!url && (url === storePlayingSabad?.audioUrl);

  // Use global state if this is the active track, otherwise show idle
  const isPlaying   = isActiveTrack ? audioIsPlaying   : false;
  const isBuffering = isActiveTrack ? audioIsBuffering : false;
  const progress    = isActiveTrack ? audioProgress    : 0;
  const localError  = isActiveTrack ? audioError       : null;

  // ── Seek drag state (only local state we need) ────────────────────────────
  const isDraggingRef = useRef(false);
  const dragProgressRef = useRef(0); // visual progress during drag (not in state, updated via DOM)
  const progressBarRef = useRef<HTMLDivElement>(null);

  // ── Register callbacks with AudioEngine whenever they change ─────────────
  const callbacksRef = useRef<any>({});
  useEffect(() => {
    callbacksRef.current = { onEnded, onPlay, onPause, onNext, onPrev, showToast, onClose };
  });

  useEffect(() => {
    audioEngine.registerCallbacks({
      onPlay:    () => { try { callbacksRef.current.onPlay?.();    } catch (_) {} },
      onPause:   () => { try { callbacksRef.current.onPause?.();   } catch (_) {} },
      onEnded:   () => { try { callbacksRef.current.onEnded?.();   } catch (_) {} },
      onNext:    () => { try { callbacksRef.current.onNext?.();    } catch (_) {} },
      onPrev:    () => { try { callbacksRef.current.onPrev?.();    } catch (_) {} },
      onClose:   () => { try { callbacksRef.current.onClose?.();   } catch (_) {} },
      showToast: (m: string) => { try { callbacksRef.current.showToast?.(m); } catch (_) {} },
    });
  }, []); // Register once — callbacksRef always has latest values

  // ── togglePlay — single entry point for play/pause ───────────────────────
  const togglePlay = useCallback((forceState?: 'play' | 'pause' | any) => {
    vibrate(10);
    audioEngine.togglePlay(
      forceState === 'play' || forceState === 'pause' ? forceState : undefined
    );
  }, []);

  // ── Seek handlers ─────────────────────────────────────────────────────────
  const computeProgressFromEvent = (e: React.PointerEvent<HTMLDivElement>): number => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    return (x / rect.width) * 100;
  };

  const handleSeekPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (!isActiveTrack) return;
    isDraggingRef.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragProgressRef.current = computeProgressFromEvent(e);
    // Immediate visual feedback via inline style (no re-render needed)
    updateProgressBarDOM(dragProgressRef.current);
  };

  const handleSeekPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (!isDraggingRef.current || !isActiveTrack) return;
    dragProgressRef.current = computeProgressFromEvent(e);
    updateProgressBarDOM(dragProgressRef.current);
  };

  const handleSeekPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    e.currentTarget.releasePointerCapture(e.pointerId);
    audioEngine.seekByProgress(dragProgressRef.current);
  };

  // Update progress bar DOM directly for < 16ms visual response during drag
  const updateProgressBarDOM = (pct: number) => {
    const bar = progressBarRef.current?.querySelector('[data-progress-fill]') as HTMLDivElement;
    if (bar) bar.style.width = `${pct}%`;
  };

  // ─── RENDER — Mini variant ────────────────────────────────────────────────
  if (variant === 'mini') {
    return (
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 20, opacity: 0 }}
        drag="y"
        dragConstraints={{ top: 0, bottom: 50 }}
        onDragEnd={(_, info) => {
          if (info.offset.y > 30 && onClose) onClose();
        }}
        onClick={onClick}
        className={`w-[95%] mx-auto mb-2 max-w-md bg-white/70 backdrop-blur-2xl border border-white/40 p-3 shadow-[0_8px_30px_rgba(0,0,0,0.12)] z-[90] flex items-center gap-3 rounded-2xl transition-transform ${onClick ? 'cursor-pointer active:scale-[0.98]' : ''}`}
      >
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); togglePlay(); }}
          className="text-ink p-3 -ml-1 rounded-full hover:bg-ink/5 transition-colors flex-shrink-0 touch-manipulation"
        >
          {isBuffering ? (
            <Loader2 className="w-6 h-6 animate-spin text-accent" />
          ) : isPlaying ? (
            <Pause className="w-6 h-6 fill-current" />
          ) : (
            <Play className="w-6 h-6 fill-current ml-0.5" />
          )}
        </button>

        <div className="flex-1 flex flex-col gap-1 overflow-hidden pl-1">
          {!hideTitle && (
            <div className="text-sm font-semibold text-ink truncate px-1 flex items-center justify-between">
              <span className="truncate">{title}</span>
              {isPlaying && (
                <div className="flex gap-0.5 items-end h-3 ml-2 flex-shrink-0">
                  <motion.div animate={{ height: ["3px","12px","3px"] }} transition={{ repeat: Infinity, duration: 0.8 }} className="w-[3px] bg-accent rounded-full" />
                  <motion.div animate={{ height: ["6px","3px","6px"] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0.2 }} className="w-[3px] bg-accent rounded-full" />
                  <motion.div animate={{ height: ["3px","9px","3px"] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0.4 }} className="w-[3px] bg-accent rounded-full" />
                </div>
              )}
            </div>
          )}

          <div
            ref={progressBarRef}
            className="h-1 bg-ink/10 rounded-full overflow-hidden cursor-pointer relative touch-none"
            onPointerDown={handleSeekPointerDown}
            onPointerMove={handleSeekPointerMove}
            onPointerUp={handleSeekPointerUp}
          >
            <div
              data-progress-fill
              className="absolute top-0 left-0 h-full bg-accent transition-all duration-100 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>

          {localError && (
            <motion.div
              initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
              className="text-[11px] text-red-600 font-medium leading-tight flex items-center gap-1.5 justify-center bg-red-50 p-1.5 rounded-lg w-full"
            >
              <AlertCircle className="w-3 h-3 flex-shrink-0" />
              {localError}
            </motion.div>
          )}
        </div>

        {onClose && (
          <button
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="p-3 -mr-2 text-ink/50 hover:text-ink hover:bg-ink/5 rounded-full transition-all flex-shrink-0 touch-manipulation"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </motion.div>
    );
  }

  // ─── RENDER — Full variant ────────────────────────────────────────────────
  return (
    <div className="bg-gradient-to-br from-paper-light to-white border border-ink/10 rounded-2xl p-2 mb-2 shadow-sm flex flex-col gap-1 w-full max-w-md mx-auto relative overflow-hidden">
      {/* Background visualizer */}
      {isPlaying && (
        <div className="absolute inset-0 opacity-5 pointer-events-none flex items-center justify-center gap-2">
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className="w-4 bg-accent rounded-full"
              animate={{ height: ["20%","60%","20%"] }}
              transition={{ repeat: Infinity, duration: 0.8 + Math.random() * 0.5, delay: Math.random() * 0.5, ease: "easeInOut" }}
            />
          ))}
        </div>
      )}

      {!hideTitle && (
        <div className="flex items-center justify-between px-2 mb-1 relative z-10">
          <span className="text-sm font-bold text-ink/90 truncate">{title}</span>
        </div>
      )}

      <div className="flex items-center gap-3 relative z-10">
        {onPrev && (
          <button
            onClick={() => { vibrate(10); try { onPrev(); } catch (_) {} }}
            className="p-2.5 -ml-1 text-ink-light hover:text-ink transition-colors touch-manipulation"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); togglePlay(); }}
          className="bg-gradient-to-r from-accent to-accent-dark text-white p-3 rounded-full shadow-md hover:shadow-lg hover:scale-105 transition-all flex-shrink-0 touch-manipulation"
        >
          {isBuffering ? (
            <Loader2 className="w-6 h-6 animate-spin text-white" />
          ) : isPlaying ? (
            <Pause className="w-6 h-6 fill-current" />
          ) : (
            <Play className="w-6 h-6 fill-current ml-0.5" />
          )}
        </button>

        {onNext && (
          <button
            onClick={() => { vibrate(10); try { onNext(); } catch (_) {} }}
            className="p-2.5 -mr-1 text-ink-light hover:text-ink transition-colors touch-manipulation"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}

        <div
          ref={progressBarRef}
          className="flex-1 h-2 bg-ink/10 rounded-full overflow-hidden cursor-pointer relative shadow-inner touch-none"
          onPointerDown={handleSeekPointerDown}
          onPointerMove={handleSeekPointerMove}
          onPointerUp={handleSeekPointerUp}
        >
          <div
            data-progress-fill
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-accent to-accent-dark transition-all duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>

        {isPlaying && (
          <div className="flex gap-1 items-end h-4 pr-1">
            <motion.div animate={{ height: ["4px","16px","4px"] }} transition={{ repeat: Infinity, duration: 0.8 }} className="w-1 bg-accent rounded-full" />
            <motion.div animate={{ height: ["8px","4px","8px"] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0.2 }} className="w-1 bg-accent rounded-full" />
            <motion.div animate={{ height: ["4px","12px","4px"] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0.4 }} className="w-1 bg-accent rounded-full" />
          </div>
        )}
      </div>

      {localError && (
        <motion.div
          initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
          className="text-xs text-red-600 font-medium relative z-10 flex items-center justify-center text-center gap-2 bg-red-50 p-2 rounded-xl mx-2 mb-2 border border-red-100"
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{localError}</span>
        </motion.div>
      )}
    </div>
  );
}

export default AudioPlayer;
