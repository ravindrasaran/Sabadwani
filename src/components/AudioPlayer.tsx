import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "motion/react";
import { Play, Pause, ChevronLeft, ChevronRight, Loader2, AlertCircle, X } from "lucide-react";
import { globalAudio, setGlobalAudioCallbacks, updateMediaSessionMetadata, updateMediaSessionState, updateMediaSessionPosition, clearMediaSession } from "../lib/audioGlobals";
import { checkIsOnline, vibrate } from "../lib/utils";

const logger = {
  error: (...args: any[]) => {
    if (process.env.NODE_ENV !== 'production') {
      console.error(...args);
    }
  }
};

function AudioPlayer({ url, onEnded, onPlay, onPause, onNext, onPrev, autoPlay = false, title = 'सबदवाणी', showToast, variant = 'full', onClose, onClick, hideTitle = false, logoUrl }: { 
  url: string, 
  onEnded?: () => void, 
  onPlay?: () => void, 
  onPause?: () => void,
  onNext?: () => void,
  onPrev?: () => void,
  autoPlay?: boolean,
  title?: string,
  showToast?: (msg: string) => void,
  variant?: 'full' | 'mini',
  onClose?: () => void,
  onClick?: () => void,
  hideTitle?: boolean,
  logoUrl?: string
}) {
  const [isPlaying, setIsPlaying] = useState(globalAudio ? !globalAudio.paused : false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [progress, setProgress] = useState(0);
  const [localError, setLocalError] = useState<string | null>(null);
  const playAttempted = useRef(false);
  const isDraggingRef = useRef(false);
  const callbacksRef = useRef<any>({ onEnded, onPlay, onPause, onNext, onPrev, showToast });

  const handleSeek = (e: React.PointerEvent<HTMLDivElement>) => {
    if (globalAudio && globalAudio.duration && isFinite(globalAudio.duration)) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
      const clickedValue = x / rect.width;
      setProgress(clickedValue * 100);
      globalAudio.currentTime = clickedValue * globalAudio.duration;
    }
  };

  // Update notification metadata when track changes
  useEffect(() => {
    if (!globalAudio || !url) return;

    const metadata = {
      title: title || 'सबदवाणी',
      artist: 'सबदवाणी',
      album: 'बिश्नोई',
      artwork: logoUrl || '/logo.png'
    };

    updateMediaSessionMetadata(metadata);
    updateMediaSessionState(globalAudio.paused ? 'paused' : 'playing');
  }, [url, title, logoUrl]);

  useEffect(() => {
    const handleOnline = () => {
      setLocalError(null);
      if (globalAudio && globalAudio.src) {
        globalAudio.load();
      }
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);

  useEffect(() => {
    if (!globalAudio) return;

    const handleTimeUpdate = () => {
      if (isDraggingRef.current) return;
      const current = globalAudio.currentTime;
      const duration = globalAudio.duration;
      if (duration > 0 && isFinite(duration)) {
        setProgress((current / duration) * 100);
        updateMediaSessionPosition(current, duration, globalAudio.playbackRate);
      }
    };

    const handleWaiting = () => {
      setIsBuffering(true);
      updateMediaSessionState('none');
    };
    const handleCanPlay = () => setIsBuffering(false);
    const handlePlaying = () => {
      setIsBuffering(false);
      updateMediaSessionState('playing');
    };

    const handleError = () => {
      setIsBuffering(false);
      if (!playAttempted.current && !autoPlay) return;
      if (!navigator.onLine) {
        setLocalError("इंटरनेट कनेक्शन उपलब्ध नहीं है। कृपया अपना नेटवर्क जांचें और पुनः प्रयास करें।");
      } else {
        setLocalError("ऑडियो लोड करने में विफल।");
      }
      setIsPlaying(false);
    };

    const handlePlayEvent = () => {
      setIsPlaying(true);
      setIsBuffering(false);
      try {
        if (callbacksRef.current.onPlay) callbacksRef.current.onPlay();
      } catch (e) {
        logger.error("Error in onPlay callback:", e);
      }
      updateMediaSessionState('playing');
    };

    const handlePauseEvent = () => {
      setIsPlaying(false);
      updateMediaSessionState('paused');
      if (!globalAudio.ended) {
        try {
          if (callbacksRef.current.onPause) callbacksRef.current.onPause();
        } catch (e) {
          logger.error("Error in onPause callback:", e);
        }
      }
    };

    const handleEndedEvent = () => {
      setIsPlaying(false);
      setProgress(0);
      clearMediaSession();
      try {
        if (callbacksRef.current.onEnded) callbacksRef.current.onEnded();
      } catch (e) {
        logger.error("Error in onEnded callback:", e);
      }
    };

    globalAudio.addEventListener('timeupdate', handleTimeUpdate);
    globalAudio.addEventListener('error', handleError);
    globalAudio.addEventListener('waiting', handleWaiting);
    globalAudio.addEventListener('canplay', handleCanPlay);
    globalAudio.addEventListener('playing', handlePlaying);
    globalAudio.addEventListener('play', handlePlayEvent);
    globalAudio.addEventListener('pause', handlePauseEvent);
    globalAudio.addEventListener('ended', handleEndedEvent);

    return () => {
      globalAudio.removeEventListener('timeupdate', handleTimeUpdate);
      globalAudio.removeEventListener('error', handleError);
      globalAudio.removeEventListener('waiting', handleWaiting);
      globalAudio.removeEventListener('canplay', handleCanPlay);
      globalAudio.removeEventListener('playing', handlePlaying);
      globalAudio.removeEventListener('play', handlePlayEvent);
      globalAudio.removeEventListener('pause', handlePauseEvent);
      globalAudio.removeEventListener('ended', handleEndedEvent);
      
      // If this is the full player being unmounted, we might want to keep the mini player
      // But if the whole audio system is being stopped, we should clear it.
      // For now, let's just ensure state is paused if we're not playing anymore.
      if (globalAudio.paused) {
        updateMediaSessionState('paused');
      }
    };
  }, [autoPlay, url]);

  useEffect(() => {
    if (globalAudio && url) {
      // Parse URLs to ensure accurate comparison
      const currentSrc = globalAudio.src;
      const newSrc = new URL(url, window.location.origin).href;
      
      if (currentSrc !== newSrc) {
        globalAudio.pause();
        globalAudio.src = url;
        globalAudio.load();
        if (autoPlay) {
          playAttempted.current = true;
          
          const attemptPlay = () => {
            setLocalError(null);
            
            if (globalAudio) {
              setIsPlaying(true);
              const playPromise = globalAudio.play();
              if (playPromise !== undefined) {
                playPromise.catch(async (e) => {
                  logger.error("AutoPlay failed:", e);
                  setIsBuffering(false);
                  setIsPlaying(false);
                  
                  let isOnline = await checkIsOnline();
                  if (!isOnline) {
                    setLocalError("इंटरनेट कनेक्शन उपलब्ध नहीं है। कृपया अपना नेटवर्क जांचें और पुनः प्रयास करें।");
                  } else {
                    setLocalError("ऑडियो चलाने में समस्या आ रही है।");
                  }
                });
              }
            }
          };
          
          attemptPlay();
        } else {
          playAttempted.current = false;
          setIsPlaying(false);
        }
      } else {
        // If URL is the same, just sync state
        setIsPlaying(!globalAudio.paused);
        if (globalAudio.duration > 0) {
          setProgress((globalAudio.currentTime / globalAudio.duration) * 100);
        }
      }
    }
  }, [url, autoPlay]);

  const togglePlay = useCallback((forceState?: 'play' | 'pause' | any) => {
    vibrate(10);
    if (!globalAudio) return;

    // Determine target state - if forceState is not 'play' or 'pause', it's a toggle
    const isPaused = globalAudio.paused;
    const shouldPlay = forceState === 'play' ? true : forceState === 'pause' ? false : isPaused;

    if (shouldPlay) {
      // Play logic
      playAttempted.current = true;
      setLocalError(null);
      
      // Optimistic UI update
      setIsPlaying(true);
      
      // Ensure we have a valid source
      if ((!globalAudio.src || globalAudio.src === window.location.href) && url) {
        globalAudio.src = url;
        globalAudio.load();
      }
      
      const playPromise = globalAudio.play();
      if (playPromise !== undefined) {
        playPromise.catch((e) => {
          // Only handle non-abort errors
          if (e.name !== 'AbortError') {
            logger.error("Play failed:", e);
            setIsPlaying(false);
            
            if (e.name === 'NotAllowedError') {
              setLocalError("प्लेबैक शुरू करने के लिए कृपया बटन पर क्लिक करें।");
            } else {
              setLocalError("ऑडियो चलाने में समस्या आ रही है।");
            }
          }
        });
      }
    } else {
      // Pause logic
      globalAudio.pause();
      setIsPlaying(false);
    }
  }, [url]);

  // Callbacks sync logic
  useEffect(() => {
    callbacksRef.current = { onEnded, onPlay, onPause, onNext, onPrev, showToast, togglePlay };
    setGlobalAudioCallbacks(callbacksRef.current);
  }, [onEnded, onPlay, onPause, onNext, onPrev, showToast, togglePlay]);

  if (variant === 'mini') {
    return (
      <motion.div 
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        drag="y"
        dragConstraints={{ top: 0, bottom: 100 }}
        onDragEnd={(_, info) => {
          if (info.offset.y > 50 && onClose) onClose();
        }}
        onClick={onClick}
        className={`w-[95%] mx-auto mb-2 max-w-md bg-white/70 backdrop-blur-2xl border border-white/40 p-3 shadow-[0_8px_30px_rgba(0,0,0,0.12)] z-[90] flex items-center gap-3 rounded-2xl transition-transform ${onClick ? 'cursor-pointer active:scale-[0.98]' : ''}`}
      >
        <button
          onClick={(e) => { 
            e.preventDefault();
            e.stopPropagation(); 
            togglePlay(); 
          }}
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
                  <motion.div animate={{ height: ["3px", "12px", "3px"] }} transition={{ repeat: Infinity, duration: 0.8 }} className="w-[3px] bg-accent rounded-full" />
                  <motion.div animate={{ height: ["6px", "3px", "6px"] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0.2 }} className="w-[3px] bg-accent rounded-full" />
                  <motion.div animate={{ height: ["3px", "9px", "3px"] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0.4 }} className="w-[3px] bg-accent rounded-full" />
                </div>
              )}
            </div>
          )}
          
          <div
            className="h-1 bg-ink/10 rounded-full overflow-hidden cursor-pointer relative touch-none"
            onPointerDown={(e) => {
              e.stopPropagation();
              isDraggingRef.current = true;
              e.currentTarget.setPointerCapture(e.pointerId);
              handleSeek(e);
            }}
            onPointerMove={(e) => {
              e.stopPropagation();
              if (isDraggingRef.current) {
                handleSeek(e);
              }
            }}
            onPointerUp={(e) => {
              e.stopPropagation();
              isDraggingRef.current = false;
              e.currentTarget.releasePointerCapture(e.pointerId);
            }}
          >
            <div
              className="absolute top-0 left-0 h-full bg-accent transition-all duration-100 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>

          {localError && (
            <motion.div 
              initial={{ opacity: 0, y: -5 }} 
              animate={{ opacity: 1, y: 0 }} 
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

  return (
    <div className="bg-gradient-to-br from-paper-light to-white border border-ink/10 rounded-2xl p-2 mb-2 shadow-sm flex flex-col gap-1 w-full max-w-md mx-auto relative overflow-hidden">
      {/* Subtle background visualizer effect */}
      {isPlaying && (
        <div className="absolute inset-0 opacity-5 pointer-events-none flex items-center justify-center gap-2">
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className="w-4 bg-accent rounded-full"
              animate={{ height: ["20%", "60%", "20%"] }}
              transition={{
                repeat: Infinity,
                duration: 0.8 + Math.random() * 0.5,
                delay: Math.random() * 0.5,
                ease: "easeInOut"
              }}
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
          <button onClick={() => { 
            vibrate(10); 
            try {
              onPrev(); 
            } catch (e) {
              logger.error("Error calling onPrev:", e);
            }
          }} className="p-2.5 -ml-1 text-ink-light hover:text-ink transition-colors touch-manipulation">
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}
        
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            togglePlay();
          }}
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
          <button onClick={() => { 
            vibrate(10); 
            try {
              onNext(); 
            } catch (e) {
              logger.error("Error calling onNext:", e);
            }
          }} className="p-2.5 -mr-1 text-ink-light hover:text-ink transition-colors touch-manipulation">
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
        
        <div
          className="flex-1 h-2 bg-ink/10 rounded-full overflow-hidden cursor-pointer relative shadow-inner touch-none"
          onPointerDown={(e) => {
            isDraggingRef.current = true;
            e.currentTarget.setPointerCapture(e.pointerId);
            handleSeek(e);
          }}
          onPointerMove={(e) => {
            if (isDraggingRef.current) {
              handleSeek(e);
            }
          }}
          onPointerUp={(e) => {
            isDraggingRef.current = false;
            e.currentTarget.releasePointerCapture(e.pointerId);
          }}
        >
          <div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-accent to-accent-dark transition-all duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>

        {isPlaying && (
          <div className="flex gap-1 items-end h-4 pr-1">
            <motion.div animate={{ height: ["4px", "16px", "4px"] }} transition={{ repeat: Infinity, duration: 0.8 }} className="w-1 bg-accent rounded-full" />
            <motion.div animate={{ height: ["8px", "4px", "8px"] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0.2 }} className="w-1 bg-accent rounded-full" />
            <motion.div animate={{ height: ["4px", "12px", "4px"] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0.4 }} className="w-1 bg-accent rounded-full" />
          </div>
        )}
      </div>
      
      {localError && (
        <motion.div 
          initial={{ opacity: 0, y: -5 }} 
          animate={{ opacity: 1, y: 0 }} 
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
