// ─── Static imports only — NO dynamic imports in hot path ──────────────────
import { Capacitor } from '@capacitor/core';
import { MediaSession } from '@capgo/capacitor-media-session';
import { AudioCacheService } from './AudioCacheService';

class AudioWrapper {
  private audio: HTMLAudioElement;
  private listeners: { [key: string]: Function[] } = {};
  private _playSequence = 0;

  // Track whether a loadAndPlay() is currently in progress.
  // AudioEngine reads this to avoid calling play() during an active load.
  public _isLoading = false;

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
    this.audio.setAttribute('playsinline', '');
    this._initListeners();
  }

  private _initListeners() {
    const sync = () => {
      this._currentTime = this.audio.currentTime;
      this._duration    = isFinite(this.audio.duration) ? this.audio.duration : 0;
      this._paused      = this.audio.paused;
      this._ended       = this.audio.ended;
    };

    this.audio.addEventListener('timeupdate',    () => { sync(); this.emit('timeupdate', {}); });
    this.audio.addEventListener('playing',       () => { sync(); this._paused = false; this._ended = false; this._isLoading = false; this.emit('playing', {}); });
    this.audio.addEventListener('pause',         () => { sync(); this.emit('pause', {}); });
    this.audio.addEventListener('waiting',       () => { this.emit('waiting', {}); });
    this.audio.addEventListener('canplay',       () => { sync(); this.emit('canplay', {}); });
    this.audio.addEventListener('ended',         () => { sync(); this._ended = true; this._paused = true; this._isLoading = false; this.emit('ended', {}); });
    this.audio.addEventListener('error',         (e) => { this._paused = true; this._isLoading = false; this.emit('error', e); });
    this.audio.addEventListener('loadedmetadata',() => { this._duration = isFinite(this.audio.duration) ? this.audio.duration : 0; this.emit('canplay', {}); });
    this.audio.addEventListener('stalled',       () => { this.emit('waiting', {}); });
    this.audio.addEventListener('durationchange',() => { this._duration = isFinite(this.audio.duration) ? this.audio.duration : 0; });
  }

  // ── src (simple assignment — loadAndPlay is preferred for autoplay) ────────
  get src() { return this._src; }
  set src(val: string) {
    this._src = val;
    this._playSequence++;
    const seq = this._playSequence;

    if (!val) {
      this.audio.pause();
      this.audio.removeAttribute('src');
      this.audio.load();
      this._isLoading = false;
      return;
    }

    // On native: async cache lookup with seq guard
    if (Capacitor.isNativePlatform()) {
      this.emit('waiting', {});
      this.audio.pause();

      AudioCacheService.getLocalUrl(val).then(cachedUrl => {
        if (this._playSequence !== seq) return;
        this.audio.src = cachedUrl;
        this.audio.load();
        if (cachedUrl === val && val.startsWith('http')) {
          AudioCacheService.downloadToCache(val).catch(() => {});
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

  get currentTime() { return this.audio.currentTime; }
  set currentTime(val: number) {
    if (isFinite(val) && val >= 0) {
      this.audio.currentTime = val;
      this._currentTime = val;
    }
  }

  get duration()     { const d = this.audio.duration; return isFinite(d) ? d : this._duration; }
  get paused()       { return this.audio.paused; }
  get ended()        { return this.audio.ended; }

  get volume()       { return this._volume; }
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
      this._ended  = false;
    } catch (e: any) {
      if (e?.name !== 'AbortError') throw e;
    }
  }

  pause() {
    this.audio.pause();
    this._paused = true;
  }

  // ── loadAndPlay — atomic cache-resolve + play ─────────────────────────────
  // KEY FIXES vs previous version:
  //  1. Uses STATIC imports (Capacitor, AudioCacheService already imported at top)
  //     → No more await import() 200-300ms hang on first call
  //  2. Sets _isLoading = true so AudioEngine knows not to call play() separately
  //  3. Checks isStale() at every async boundary
  async loadAndPlay(url: string, isStale: () => boolean): Promise<void> {
    this.pause();
    if (!url) return;

    this._isLoading = true;
    this._src = url;
    // NOTE: Do NOT increment _playSequence here.
    // _loadTrack already incremented it and passed isStale() = () => _playSequence !== seq.
    // If we increment again, isStale() becomes permanently true → audio never plays.
    // _playSequence is owned by _loadTrack. loadAndPlay only uses the isStale() signal.

    let resolvedUrl = url;

    // Cache lookup — static imports, no dynamic import delay
    if (Capacitor.isNativePlatform()) {
      try {
        resolvedUrl = await AudioCacheService.getLocalUrl(url);
        if (resolvedUrl === url && url.startsWith('http')) {
          AudioCacheService.downloadToCache(url).catch(() => {});
        }
      } catch (_) {
        resolvedUrl = url;
      }
    }

    if (isStale()) {
      this._isLoading = false;
      return;
    }

    this.audio.src = resolvedUrl;
    this.audio.load();

    if (isStale()) {
      this._isLoading = false;
      return;
    }

    try {
      await this.audio.play();
      this._paused    = false;
      this._ended     = false;
      this._isLoading = false;
    } catch (e: any) {
      this._isLoading = false;
      if (e?.name !== 'AbortError') throw e;
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
    (this.listeners[event] || []).forEach(cb => { try { cb(data); } catch (_) {} });
  }
}

export const globalAudio = new AudioWrapper();

// ─── Fade (skip on native — conflicts with audio focus) ────────────────────
const FADE_DURATION = 400;
let _fadeTimer: ReturnType<typeof setInterval> | null = null;

export const fadeAudio = (targetVol: number, onComplete?: () => void) => {
  if (_fadeTimer) clearInterval(_fadeTimer);
  if (Capacitor.isNativePlatform()) {
    globalAudio.volume = targetVol;
    onComplete?.();
    return;
  }
  const start = globalAudio.volume;
  const steps = 16;
  const stepVol = (targetVol - start) / steps;
  let i = 0;
  _fadeTimer = setInterval(() => {
    i++;
    globalAudio.volume = Math.max(0, Math.min(1, start + stepVol * i));
    if (i >= steps) {
      clearInterval(_fadeTimer!);
      globalAudio.volume = targetVol;
      onComplete?.();
    }
  }, FADE_DURATION / steps);
};

// ─── Global callbacks (onPlay / onPause / onEnded / onNext / onPrev) ────────
export let globalAudioCallbacks: any = {};

export const setGlobalAudioCallbacks = (callbacks: any) => {
  globalAudioCallbacks = callbacks;
  // NOTE: Do NOT call _registerMediaSessionHandlers() here.
  // The MediaSession handlers are closures: () => globalAudioCallbacks.onNext?.()
  // They always read the LATEST globalAudioCallbacks at call time.
  // Re-registering on every render causes many expensive Capacitor bridge calls.
  // Handlers are registered once in setupGlobalMediaSessionListener().
};

export let isClearingSession = false;

const DEFAULT_LOGO = (() => {
  try { return new URL('/logo.png', window.location.origin).href; }
  catch { return '/logo.png'; }
})();

// ─── MediaSession metadata ──────────────────────────────────────────────────
export const updateMediaSessionMetadata = async (meta: {
  title: string; artist: string; album: string; artwork?: string;
}) => {
  isClearingSession = false;
  const artwork = meta.artwork || DEFAULT_LOGO;
  globalAudio._metadata = { ...meta, artwork };
  const artworkArr = [{ src: artwork, sizes: '512x512', type: 'image/png' }];

  if (Capacitor.isNativePlatform()) {
    try { await MediaSession.setMetadata({ title: meta.title, artist: meta.artist, album: meta.album, artwork: artworkArr }); }
    catch (e) { console.error('[MediaSession] setMetadata:', e); }
  } else if ('mediaSession' in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({ title: meta.title, artist: meta.artist, album: meta.album, artwork: artworkArr });
  }
};

// ─── MediaSession playback state ───────────────────────────────────────────
export const updateMediaSessionState = async (state: 'playing' | 'paused' | 'none') => {
  if (isClearingSession && state !== 'none') return;
  if (Capacitor.isNativePlatform()) {
    try { await MediaSession.setPlaybackState({ playbackState: state }); }
    catch (e) { console.error('[MediaSession] setPlaybackState:', e); }
  } else if ('mediaSession' in navigator) {
    navigator.mediaSession.playbackState = state === 'none' ? 'none' : state;
  }
};

// ─── MediaSession clear (only on explicit player close) ────────────────────
export const clearMediaSession = async () => {
  isClearingSession = true;
  if (globalAudio) {
    globalAudio.pause();
    globalAudio.src = '';
  }
  const actions = ['play','pause','seekbackward','seekforward','previoustrack','nexttrack','seekto','stop'] as const;
  if (Capacitor.isNativePlatform()) {
    try { await MediaSession.setPlaybackState({ playbackState: 'none' }); } catch (_) {}
    try { await MediaSession.setMetadata({ title:'', artist:'', album:'', artwork:[] }); } catch (_) {}
    for (const a of actions) { try { await MediaSession.setActionHandler({ action: a as any }, null); } catch (_) {} }
  } else if ('mediaSession' in navigator) {
    navigator.mediaSession.playbackState = 'none';
    navigator.mediaSession.metadata = null;
    actions.forEach(a => { try { navigator.mediaSession.setActionHandler(a, null); } catch (_) {} });
  }
  setTimeout(() => { isClearingSession = false; }, 1500);
};

// ─── MediaSession position (throttled 250ms) ───────────────────────────────
let _lastPosUpdate = 0;
export const updateMediaSessionPosition = async (pos: number, dur: number, rate: number) => {
  if (isClearingSession) return;
  const now = Date.now();
  if (now - _lastPosUpdate < 250) return;
  _lastPosUpdate = now;
  if (!isFinite(dur) || dur <= 0 || !isFinite(pos) || pos < 0 || pos > dur || !isFinite(rate) || rate <= 0) return;
  if (Capacitor.isNativePlatform()) {
    try { await MediaSession.setPositionState({ duration: dur, playbackRate: rate, position: pos }); } catch (_) {}
  } else if ('mediaSession' in navigator && navigator.mediaSession.setPositionState) {
    try { navigator.mediaSession.setPositionState({ duration: dur, playbackRate: rate, position: pos }); } catch (_) {}
  }
};

// ─── MediaSession action handlers ──────────────────────────────────────────
const _registerMediaSessionHandlers = () => {
  const safe = (cb: () => void) => { try { cb(); } catch (_) {} };

  const handlers: Record<string, (d?: any) => void> = {
    play:          () => safe(() => globalAudioCallbacks?.togglePlay?.('play')),
    pause:         () => safe(() => globalAudioCallbacks?.togglePlay?.('pause')),
    stop:          () => safe(() => globalAudioCallbacks?.onClose?.()),
    nexttrack:     () => safe(() => globalAudioCallbacks?.onNext?.()),
    previoustrack: () => safe(() => globalAudioCallbacks?.onPrev?.()),
    seekbackward:  (d: any) => safe(() => { if (globalAudio) globalAudio.currentTime = Math.max(globalAudio.currentTime - (d?.seekOffset ?? 10), 0); }),
    seekforward:   (d: any) => safe(() => {
      if (!globalAudio) return;
      const max = isFinite(globalAudio.duration) && globalAudio.duration > 0 ? globalAudio.duration : Infinity;
      globalAudio.currentTime = Math.min(globalAudio.currentTime + (d?.seekOffset ?? 10), max);
    }),
    seekto: (d: any) => safe(() => { if (globalAudio && d?.seekTime != null) globalAudio.currentTime = d.seekTime; }),
  };

  if (Capacitor.isNativePlatform()) {
    Object.entries(handlers).forEach(async ([action, handler]) => {
      try { await MediaSession.setActionHandler({ action: action as any }, handler); }
      catch (e) { console.error('[MediaSession] setActionHandler failed for', action, e); }
    });
  } else {
    if (!('mediaSession' in navigator)) return;
    Object.entries(handlers).forEach(([action, handler]) => {
      try { navigator.mediaSession.setActionHandler(action as MediaSessionAction, handler); } catch (_) {}
    });
  }
};

export const setupGlobalMediaSessionListener = async () => {
  isClearingSession = false;
  _registerMediaSessionHandlers();
};
