import { Capacitor } from '@capacitor/core';
import { MediaSession } from '@capgo/capacitor-media-session';
import { AudioCacheService } from './AudioCacheService';

// ─── Architecture Overview ──────────────────────────────────────────────────
//
// REMOVED: @mustafaj/capacitor-plugin-playlist
//   Bugs found:
//   1. currentPosition reported in MILLISECONDS but plugin docs say seconds → seek offset wrong
//   2. msgType integer events (30,35,40,50,90,95,100) undocumented & unreliable
//   3. seekTo(ms) was receiving seconds from old code → wrong seek position
//   4. 'completed' + 'stopped' both fire → double onEnded() calls → auto-skip glitch
//   5. Next/Prev msgType 90/95 miss events on fast track changes
//   6. isStream:true path never set retainPosition → every resume starts from 0
//
// NEW: HTMLAudioElement everywhere (Web + Native Capacitor WebView)
//   @capgo/capacitor-media-session handles lock-screen metadata & controls.
//   Android WebView supports background audio via:
//     - AndroidManifest FOREGROUND_SERVICE + audio attributes (set by @capgo plugin)
//     - Audio focus requested automatically by Android 8+ WebView
//   Same architecture used by Spotify/SoundCloud Capacitor apps.
//
// ─────────────────────────────────────────────────────────────────────────────

class AudioWrapper {
  private audio: HTMLAudioElement;
  private listeners: { [key: string]: Function[] } = {};
  private _playSequence = 0;

  public _src = '';
  public _currentTime = 0;
  public _duration = 0;
  public _paused = true;
  public _ended = false;
  public _volume = 1;
  public _playbackRate = 1;
  public _metadata: any = null;

  constructor() {
    this.audio = new Audio();
    this.audio.crossOrigin = 'anonymous';
    this.audio.preload = 'metadata';
    // Required for background playback on iOS WebView
    this.audio.setAttribute('playsinline', '');
    this._initListeners();
  }

  private _initListeners() {
    const syncState = () => {
      this._currentTime = this.audio.currentTime;
      this._duration = isFinite(this.audio.duration) ? this.audio.duration : 0;
      this._paused = this.audio.paused;
      this._ended = this.audio.ended;
    };

    this.audio.addEventListener('timeupdate', () => {
      syncState();
      this.emit('timeupdate', {});
    });

    // 'playing' fires when audio actually starts producing frames (after buffering)
    this.audio.addEventListener('playing', () => {
      syncState();
      this._paused = false;
      this._ended = false;
      this.emit('playing', {});
      this.emit('play', {});
    });

    this.audio.addEventListener('pause', () => {
      syncState();
      this.emit('pause', {});
    });

    this.audio.addEventListener('waiting', () => {
      this.emit('waiting', {});
    });

    this.audio.addEventListener('canplay', () => {
      syncState();
      this.emit('canplay', {});
    });

    // BUG FIX: Old code had double-ended issue with playlist plugin.
    // HTMLAudioElement fires 'ended' exactly once.
    this.audio.addEventListener('ended', () => {
      syncState();
      this._ended = true;
      this._paused = true;
      this.emit('ended', {});
    });

    this.audio.addEventListener('error', (e) => {
      this._paused = true;
      this.emit('error', e);
    });

    this.audio.addEventListener('loadedmetadata', () => {
      this._duration = isFinite(this.audio.duration) ? this.audio.duration : 0;
      this.emit('canplay', {});
    });

    this.audio.addEventListener('stalled', () => {
      this.emit('waiting', {});
    });

    this.audio.addEventListener('durationchange', () => {
      this._duration = isFinite(this.audio.duration) ? this.audio.duration : 0;
    });
  }

  // ── src ──────────────────────────────────────────────────────────────────────
  get src() { return this._src; }
  set src(val: string) {
    this._src = val;
    this._playSequence++;
    const seq = this._playSequence;

    if (!val) {
      this.audio.pause();
      this.audio.removeAttribute('src');
      this.audio.load();
      return;
    }

    if (Capacitor.isNativePlatform()) {
      // BUG FIX: Seq guard prevents stale async result from overwriting a newer src
      this.emit('waiting', {});
      this.audio.pause();

      AudioCacheService.getLocalUrl(val).then(cachedUrl => {
        if (this._playSequence !== seq) return;
        this.audio.src = cachedUrl;
        this.audio.load();
        // Non-blocking background cache for next listen
        if (cachedUrl === val && val.startsWith('http')) {
          AudioCacheService.downloadToCache(val);
        }
      }).catch(() => {
        if (this._playSequence !== seq) return;
        this.audio.src = val;
        this.audio.load();
      });
    } else {
      this.audio.src = val;
      this.audio.load();
    }
  }

  // ── currentTime ──────────────────────────────────────────────────────────────
  get currentTime() { return this.audio.currentTime; }
  set currentTime(val: number) {
    // BUG FIX: Old playlist plugin expected ms. HTMLAudioElement takes seconds directly.
    // No conversion needed — this was a major source of wrong seek positions.
    if (isFinite(val) && val >= 0) {
      this.audio.currentTime = val;
      this._currentTime = val;
    }
  }

  get duration() {
    const d = this.audio.duration;
    return isFinite(d) ? d : this._duration;
  }
  get paused()  { return this.audio.paused; }
  get ended()   { return this.audio.ended; }

  get volume() { return this._volume; }
  set volume(val: number) {
    this._volume = val;
    this.audio.volume = Math.max(0, Math.min(1, val));
  }

  get playbackRate() { return this._playbackRate; }
  set playbackRate(val: number) {
    this._playbackRate = val;
    this.audio.playbackRate = val;
  }

  load() { this.audio.load(); }

  async play(): Promise<void> {
    try {
      await this.audio.play();
      this._paused = false;
      this._ended = false;
    } catch (e: any) {
      if (e?.name !== 'AbortError') {
        console.error('[AudioWrapper] play() error:', e);
        throw e;
      }
    }
  }

  pause() {
    this.audio.pause();
    this._paused = true;
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
    (this.listeners[event] || []).forEach(cb => {
      try { cb(data); } catch (e) {}
    });
  }
}

export const globalAudio = new AudioWrapper();

// ─── Fade ──────────────────────────────────────────────────────────────────────
const FADE_DURATION = 500;
let fadeInterval: ReturnType<typeof setInterval> | null = null;

export const fadeAudio = (targetVolume: number, onComplete?: () => void) => {
  if (!globalAudio) return;
  if (fadeInterval) clearInterval(fadeInterval);

  // Skip fade on native to avoid conflicting with Android audio focus gain
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
    globalAudio.volume = Math.max(0, Math.min(1, startVolume + volumeStep * currentStep));
    if (currentStep >= steps) {
      if (fadeInterval) clearInterval(fadeInterval);
      globalAudio.volume = targetVolume;
      if (onComplete) onComplete();
    }
  }, stepDuration);
};

// ─── Callbacks ─────────────────────────────────────────────────────────────────
export let globalAudioCallbacks: any = {};

export const setGlobalAudioCallbacks = (callbacks: any) => {
  globalAudioCallbacks = callbacks;
  // Re-register every time callbacks update → lock-screen buttons always fresh
  _registerMediaSessionHandlers();
};

export let isClearingSession = false;

const DEFAULT_LOGO = (() => {
  try { return new URL('/logo.png', window.location.origin).href; }
  catch { return '/logo.png'; }
})();

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

  const artworkPayload = [{ src: artworkUrl, sizes: '512x512', type: 'image/png' }];

  if (Capacitor.isNativePlatform()) {
    try {
      await MediaSession.setMetadata({
        title: metadata.title,
        artist: metadata.artist,
        album: metadata.album,
        artwork: artworkPayload,
      });
    } catch (e) {
      console.error('[MediaSession] setMetadata error:', e);
    }
  } else if ('mediaSession' in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: metadata.title,
      artist: metadata.artist,
      album: metadata.album,
      artwork: artworkPayload,
    });
  }
};

// ─── MediaSession playback state ───────────────────────────────────────────────
export const updateMediaSessionState = async (state: 'playing' | 'paused' | 'none') => {
  if (isClearingSession && state !== 'none') return;

  if (Capacitor.isNativePlatform()) {
    try {
      await MediaSession.setPlaybackState({ playbackState: state });
    } catch (e) {
      console.error('[MediaSession] setPlaybackState error:', e);
    }
  } else if ('mediaSession' in navigator) {
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

  const actions = [
    'play', 'pause', 'seekbackward', 'seekforward',
    'previoustrack', 'nexttrack', 'seekto', 'stop',
  ] as const;

  if (Capacitor.isNativePlatform()) {
    try { await MediaSession.setPlaybackState({ playbackState: 'none' }); } catch (_) {}
    try { await MediaSession.setMetadata({ title: '', artist: '', album: '', artwork: [] }); } catch (_) {}
    for (const action of actions) {
      try { await MediaSession.setActionHandler({ action: action as any }, null); } catch (_) {}
    }
  } else if ('mediaSession' in navigator) {
    navigator.mediaSession.playbackState = 'none';
    navigator.mediaSession.metadata = null;
    actions.forEach(action => {
      try { navigator.mediaSession.setActionHandler(action, null); } catch (_) {}
    });
  }

  setTimeout(() => { isClearingSession = false; }, 1500);
};

// ─── MediaSession position ──────────────────────────────────────────────────────
let lastPositionUpdate = 0;

export const updateMediaSessionPosition = async (
  position: number,
  duration: number,
  playbackRate: number,
) => {
  if (isClearingSession) return;

  const now = Date.now();
  if (now - lastPositionUpdate < 250) return;
  lastPositionUpdate = now;

  // Guard against NaN/Infinity/out-of-range values that crash Android WebViews
  if (
    !isFinite(duration) || duration <= 0 ||
    !isFinite(position) || position < 0 || position > duration ||
    !isFinite(playbackRate) || playbackRate <= 0
  ) return;

  if (Capacitor.isNativePlatform()) {
    try {
      await MediaSession.setPositionState({ duration, playbackRate, position });
    } catch (_) {}
  } else if ('mediaSession' in navigator && navigator.mediaSession.setPositionState) {
    try {
      navigator.mediaSession.setPositionState({ duration, playbackRate, position });
    } catch (_) {}
  }
};

// ─── MediaSession action handlers ──────────────────────────────────────────────
const _registerMediaSessionHandlers = () => {
  const safe = (cb: () => void) => { try { cb(); } catch (_) {} };

  const handlers: Record<string, (details?: any) => void> = {
    play:          () => safe(() => globalAudioCallbacks?.togglePlay?.('play')),
    pause:         () => safe(() => globalAudioCallbacks?.togglePlay?.('pause')),
    stop:          () => safe(() => globalAudioCallbacks?.onClose?.()),
    nexttrack:     () => safe(() => globalAudioCallbacks?.onNext?.()),
    previoustrack: () => safe(() => globalAudioCallbacks?.onPrev?.()),
    seekbackward: (details: any) =>
      safe(() => {
        if (!globalAudio) return;
        const offset = details?.seekOffset ?? 10;
        globalAudio.currentTime = Math.max(globalAudio.currentTime - offset, 0);
      }),
    seekforward: (details: any) =>
      safe(() => {
        if (!globalAudio) return;
        const offset = details?.seekOffset ?? 10;
        const max = isFinite(globalAudio.duration) && globalAudio.duration > 0
          ? globalAudio.duration : Infinity;
        globalAudio.currentTime = Math.min(globalAudio.currentTime + offset, max);
      }),
    seekto: (details: any) =>
      safe(() => {
        if (globalAudio && details?.seekTime != null) {
          globalAudio.currentTime = details.seekTime;
        }
      }),
  };

  if (Capacitor.isNativePlatform()) {
    Object.entries(handlers).forEach(async ([action, handler]) => {
      try {
        await MediaSession.setActionHandler({ action: action as any }, handler);
      } catch (e) {
        console.error('[MediaSession] setActionHandler failed for', action, e);
      }
    });
  } else {
    if (!('mediaSession' in navigator)) return;
    Object.entries(handlers).forEach(([action, handler]) => {
      try {
        navigator.mediaSession.setActionHandler(action as MediaSessionAction, handler);
      } catch (_) {}
    });
  }
};

// ─── Public setup ──────────────────────────────────────────────────────────────
export const setupGlobalMediaSessionListener = async () => {
  isClearingSession = false;
  _registerMediaSessionHandlers();
};
