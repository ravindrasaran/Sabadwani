import { Capacitor } from '@capacitor/core';
import { Playlist } from '@mustafaj/capacitor-plugin-playlist';
import { AudioCacheService } from './AudioCacheService';

// ─── Constants ────────────────────────────────────────────────────────────────
// The @mustafaj/capacitor-plugin-playlist plugin reports currentPosition in
// MILLISECONDS but the Web Audio API and MediaSession use SECONDS everywhere.
// All internal state is kept in SECONDS; we convert at the plugin boundary.
const MS_TO_S = 0.001;

class AudioWrapper {
  private audio: HTMLAudioElement | null = null;
  private isNative = Capacitor.isNativePlatform();
  private listeners: { [key: string]: Function[] } = {};

  public _src = '';
  public _currentTime = 0;   // seconds
  public _duration = 0;      // seconds
  public _paused = true;
  public _ended = false;
  public _volume = 1;
  public _playbackRate = 1;
  public _metadata: any = null;

  private _playSequence = 0;
  private _isNativeInitialized = false;

  constructor() {
    if (!this.isNative) {
      this.initWeb();
    } else {
      this.initNative();
    }
  }

  private initWeb() {
    this.audio = new Audio();
    this.audio.crossOrigin = 'anonymous';
    this.audio.preload = 'metadata';

    const events = ['timeupdate', 'playing', 'play', 'pause', 'waiting', 'canplay', 'ended', 'error'];
    events.forEach(evt => {
      this.audio!.addEventListener(evt, (e) => {
        this._currentTime = this.audio!.currentTime;
        this._duration = this.audio!.duration || 0;
        this._paused = this.audio!.paused;
        this._ended = this.audio!.ended;
        this.emit(evt, e);
      });
    });
  }

  private initNative() {
    if (this._isNativeInitialized) return;
    this._isNativeInitialized = true;

    Playlist.initialize();

    Playlist.addListener('status', (data: any) => {
      const val = data.value || {};

      // ── Position / duration update (msgType 40 = POSITION_UPDATE) ──────────
      // BUG FIX: Plugin sends currentPosition in MILLISECONDS → convert to seconds.
      if (data.msgType === 40 || val.currentPosition !== undefined || val.position !== undefined) {
        const rawMs =
          val.currentPosition !== undefined
            ? val.currentPosition
            : val.position !== undefined
            ? val.position
            : this._currentTime / MS_TO_S;

        this._currentTime = rawMs * MS_TO_S;

        if (val.duration !== undefined) {
          // Duration also arrives in ms from the plugin
          this._duration = val.duration * MS_TO_S;
        }
        this.emit('timeupdate', {});
      }

      // ── Playback state ──────────────────────────────────────────────────────
      if (val.status === 'playing' || data.msgType === 30) {
        this._paused = false;
        this._ended = false;
        this.emit('playing', {});
        this.emit('play', {});
      } else if (val.status === 'paused' || data.msgType === 35) {
        this._paused = true;
        this.emit('pause', {});
      } else if (val.status === 'loading' || data.msgType === 10 || data.msgType === 25) {
        this.emit('waiting', {});
      } else if (val.status === 'ready' || data.msgType === 11 || data.msgType === 15) {
        this.emit('canplay', {});
      } else if (
        val.status === 'completed' ||
        val.status === 'stopped' ||
        data.msgType === 50 ||
        data.msgType === 60 ||
        (data.msgType === 100 && val.isAtEnd)
      ) {
        this._paused = true;
        this._ended = true;
        Playlist.pause();
        this.emit('ended', {});
      }

      // ── Lock-screen / notification Next / Prev commands ────────────────────
      if (data.msgType === 'command') {
        if (val.command === 'next') globalAudioCallbacks?.onNext?.();
        else if (val.command === 'previous') globalAudioCallbacks?.onPrev?.();
      } else if (data.msgType === 90) {
        globalAudioCallbacks?.onNext?.();
      } else if (data.msgType === 95) {
        globalAudioCallbacks?.onPrev?.();
      } else if (data.msgType === 'error') {
        this.emit('error', { name: 'NotAllowedError' });
      }
    });
  }

  // ── src ─────────────────────────────────────────────────────────────────────
  get src() { return this._src; }
  set src(val: string) {
    this._src = val;
    this._playSequence++;
    const currentSeq = this._playSequence;

    if (!val) {
      if (this.isNative) Playlist.pause();
      else if (this.audio) this.audio.src = '';
      return;
    }

    if (this.isNative) {
      Playlist.pause();
      this.emit('waiting', {});

      AudioCacheService.getLocalUrl(val).then(cachedUrl => {
        if (this._playSequence !== currentSeq) return;

        if (cachedUrl === val && val.startsWith('http')) {
          AudioCacheService.downloadToCache(val);
        }

        let localLogoPath = 'https://bishnoi.co.in/logo.png';
        try { localLogoPath = new URL('/logo.png', window.location.origin).href; } catch (e) {}

        Playlist.setPlaylistItems({
          items: [{
            trackId: 't_' + currentSeq,
            assetUrl: cachedUrl,
            title: this._metadata?.title || 'सबदवाणी',
            artist: this._metadata?.artist || 'बिश्नोई समाज',
            album: this._metadata?.album || 'सबदवाणी',
            albumArt: this._metadata?.artwork || localLogoPath,
            isStream: false
          }],
          options: { startPaused: true, retainPosition: false, playFromId: 't_' + currentSeq }
        }).then(() => {
          if (this._playSequence !== currentSeq) return;
          this.emit('canplay', {});
        }).catch(() => {
          this.emit('error', { name: 'NotAllowedError' });
        });
      }).catch(() => {
        if (this._playSequence !== currentSeq) return;
        Playlist.setPlaylistItems({
          items: [{
            trackId: 't_' + currentSeq,
            assetUrl: val,
            title: this._metadata?.title || 'सबदवाणी',
            artist: this._metadata?.artist || 'बिश्नोई समाज',
            album: this._metadata?.album || 'सबदवाणी',
            albumArt: 'https://bishnoi.co.in/logo.png',
            isStream: true
          }],
          options: { startPaused: true }
        }).then(() => {
          if (this._playSequence !== currentSeq) return;
          this.emit('canplay', {});
        }).catch(() => {
          this.emit('error', { name: 'NotAllowedError' });
        });
      });
    } else {
      if (this.audio) { this.audio.src = val; this.audio.load(); }
    }
  }

  // ── currentTime ─────────────────────────────────────────────────────────────
  get currentTime() { return this._currentTime; }
  set currentTime(val: number) {
    this._currentTime = val;
    if (this.isNative) {
      // BUG FIX: Plugin expects MILLISECONDS. Old code passed seconds directly.
      Playlist.seekTo({ position: Math.round(val * 1000) });
    } else if (this.audio) {
      this.audio.currentTime = val;
    }
  }

  // ── Other getters / setters ─────────────────────────────────────────────────
  get duration() { return this._duration; }
  get paused()   { return this._paused; }
  get ended()    { return this._ended; }

  get volume() { return this._volume; }
  set volume(val: number) {
    this._volume = val;
    if (this.isNative) Playlist.setPlaybackVolume({ volume: val });
    else if (this.audio) this.audio.volume = val;
  }

  get playbackRate() { return this._playbackRate; }
  set playbackRate(val: number) {
    this._playbackRate = val;
    if (this.isNative) Playlist.setPlaybackRate({ rate: val });
    else if (this.audio) this.audio.playbackRate = val;
  }

  load() { if (!this.isNative && this.audio) this.audio.load(); }

  async play() {
    if (this.isNative) {
      try {
        await Playlist.play();
        this._paused = false;
        this.emit('canplay', {});
        this.emit('playing', {});
        this.emit('play', {});
      } catch (e: any) {
        if (e.name !== 'AbortError') {
          console.error('Audio play error:', e);
        }
      }
    } else if (this.audio) {
      try {
        await this.audio.play();
      } catch (e: any) {
        if (e.name !== 'AbortError') console.error('Audio play error:', e);
      }
    }
  }

  pause() {
    if (this.isNative) {
      Playlist.pause();
      this._paused = true;
    } else if (this.audio) {
      this.audio.pause();
    }
  }

  addEventListener(event: string, callback: Function) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
  }

  removeEventListener(event: string, callback: Function) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
  }

  private emit(event: string, data: any) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(cb => cb(data));
    }
  }
}

export const globalAudio = new AudioWrapper();

// ─── Fade ──────────────────────────────────────────────────────────────────────
const FADE_DURATION = 500;
let fadeInterval: ReturnType<typeof setInterval> | null = null;

export const fadeAudio = (targetVolume: number, onComplete?: () => void) => {
  if (!globalAudio) return;
  if (fadeInterval) clearInterval(fadeInterval);

  if (Capacitor.isNativePlatform()) {
    globalAudio.volume = targetVolume;
    if (onComplete) onComplete();
    return;
  }

  const startVolume = globalAudio.volume;
  const steps = 20;
  const volumeStep = (targetVolume - startVolume) / steps;
  const stepDuration = FADE_DURATION / steps;
  let currentStep = 0;

  fadeInterval = setInterval(() => {
    currentStep++;
    const nextVolume = startVolume + volumeStep * currentStep;
    globalAudio.volume = Math.max(0, Math.min(1, nextVolume));

    if (currentStep >= steps) {
      if (fadeInterval) clearInterval(fadeInterval);
      globalAudio.volume = targetVolume;
      if (onComplete) onComplete();
    }
  }, stepDuration);
};

// ─── MediaSession initialisation ───────────────────────────────────────────────
if (typeof window !== 'undefined' && 'mediaSession' in navigator) {
  (navigator as any).mediaSession.playbackState = 'none';
}

// ─── Callbacks ─────────────────────────────────────────────────────────────────
export let globalAudioCallbacks: any = {};

export const setGlobalAudioCallbacks = (callbacks: any) => {
  globalAudioCallbacks = callbacks;
  // BUG FIX: Re-register MediaSession action handlers every time callbacks are
  // updated so lock-screen buttons always call the latest onNext/onPrev/togglePlay.
  _registerMediaSessionHandlers();
};

export let isClearingSession = false;

const DEFAULT_LOGO =
  typeof window !== 'undefined'
    ? new URL('/logo.png', window.location.origin).href
    : '/logo.png';

// ─── MediaSession metadata ──────────────────────────────────────────────────────
export const updateMediaSessionMetadata = async (metadata: {
  title: string;
  artist: string;
  album: string;
  artwork?: string;
}) => {
  isClearingSession = false;
  const artworkUrl = metadata.artwork || DEFAULT_LOGO;

  globalAudio._metadata = {
    title: metadata.title,
    artist: metadata.artist,
    album: metadata.album,
    artwork: artworkUrl,
  };

  if ('mediaSession' in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: metadata.title,
      artist: metadata.artist,
      album: metadata.album,
      artwork: [{ src: artworkUrl, sizes: '512x512', type: 'image/png' }],
    });
  }
};

// ─── MediaSession playback state ───────────────────────────────────────────────
export const updateMediaSessionState = async (state: 'playing' | 'paused' | 'none') => {
  if (isClearingSession && state !== 'none') return;

  if ('mediaSession' in navigator) {
    navigator.mediaSession.playbackState = state === 'none' ? 'none' : state;
  }
};

// ─── MediaSession clear ────────────────────────────────────────────────────────
export const clearMediaSession = async () => {
  isClearingSession = true;
  if (globalAudio) {
    globalAudio.pause();
    globalAudio.src = '';
    globalAudio.load();
  }

  if (Capacitor.isNativePlatform()) {
    try {
      await Playlist.clearAllItems();
    } catch (e) {}
  } else if ('mediaSession' in navigator) {
    navigator.mediaSession.playbackState = 'none';
    navigator.mediaSession.metadata = null;
  }

  // BUG FIX: Increased from 500ms to 1500ms so rapid track-changes don't
  // prematurely allow stale events through while the next track is loading.
  setTimeout(() => {
    isClearingSession = false;
  }, 1500);
};

// ─── MediaSession position ──────────────────────────────────────────────────────
let lastPositionUpdate = 0;

export const updateMediaSessionPosition = async (
  position: number,
  duration: number,
  playbackRate: number,
) => {
  if (isClearingSession) return;

  // BUG FIX: Throttle reduced from 1000ms → 250ms for smoother lock-screen
  // progress bar updates.
  const now = Date.now();
  if (now - lastPositionUpdate < 250) return;
  lastPositionUpdate = now;

  if ('mediaSession' in navigator && navigator.mediaSession.setPositionState) {
    try {
      // BUG FIX: Guard against NaN/Infinity/out-of-range values that cause
      // DOMException in some Android WebViews.
      if (
        isFinite(duration) &&
        duration > 0 &&
        isFinite(position) &&
        position >= 0 &&
        position <= duration &&
        isFinite(playbackRate) &&
        playbackRate > 0
      ) {
        navigator.mediaSession.setPositionState({ duration, playbackRate, position });
      }
    } catch (e) {
      // Swallow — some Android WebViews throw even with valid values.
    }
  }
};

// ─── MediaSession action handlers ──────────────────────────────────────────────
// BUG FIX: Extracted into a named function so it can be called BOTH on first
// setup AND on every setGlobalAudioCallbacks call. The old `isMediaSessionSetup`
// flag prevented handler re-registration on new tracks, leaving lock-screen
// Next / Prev / Seek wired to stale (already-unmounted) component callbacks.
const _registerMediaSessionHandlers = () => {
  if (!('mediaSession' in navigator)) return;

  const safeCallback = (cb: () => void) => {
    try { cb(); } catch (err) {}
  };

  const handlers: Record<string, (details?: any) => void> = {
    play: () => safeCallback(() => globalAudioCallbacks?.togglePlay?.('play')),
    pause: () => safeCallback(() => globalAudioCallbacks?.togglePlay?.('pause')),
    stop: () => safeCallback(() => globalAudioCallbacks?.onClose?.()),
    nexttrack: () => safeCallback(() => globalAudioCallbacks?.onNext?.()),
    previoustrack: () => safeCallback(() => globalAudioCallbacks?.onPrev?.()),
    seekbackward: (details: any) =>
      safeCallback(() => {
        if (globalAudio) {
          const offset = details?.seekOffset || 10;
          globalAudio.currentTime = Math.max(globalAudio.currentTime - offset, 0);
        }
      }),
    seekforward: (details: any) =>
      safeCallback(() => {
        if (globalAudio) {
          const offset = details?.seekOffset || 10;
          let newTime = globalAudio.currentTime + offset;
          if (isFinite(globalAudio.duration) && globalAudio.duration > 0) {
            newTime = Math.min(newTime, globalAudio.duration);
          }
          globalAudio.currentTime = newTime;
        }
      }),
    seekto: (details: any) =>
      safeCallback(() => {
        if (globalAudio && details?.seekTime !== undefined) {
          globalAudio.currentTime = details.seekTime;
        }
      }),
  };

  Object.entries(handlers).forEach(([action, handler]) => {
    try {
      navigator.mediaSession.setActionHandler(action as MediaSessionAction, handler);
    } catch (e) {}
  });
};

// Public entry point — called from AudioPlayer on mount and on track change.
// BUG FIX: `isMediaSessionSetup` singleton flag removed. It blocked handler
// re-registration across track changes, causing stale lock-screen controls.
export const setupGlobalMediaSessionListener = async () => {
  isClearingSession = false;
  _registerMediaSessionHandlers();
};
