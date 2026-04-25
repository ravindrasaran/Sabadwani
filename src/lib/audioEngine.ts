/**
 * ─── AudioEngine — Premium Audio Playback Singleton ──────────────────────────
 *
 * PERFORMANCE FIX v2.1:
 *   Bug 1: await updateMediaSessionMetadata() was blocking src assignment by
 *          50-200ms (Capacitor bridge call) → audio never started feeling instant
 *   Bug 2: await setTimeout(80ms) — explicit delay before play() — removed
 *   Bug 3: togglePlay() didn't set audioIsBuffering=true immediately →
 *          no spinner shown until 'waiting' event (100-500ms later)
 *   Bug 4: AudioWrapper src setter is async (cache lookup) but play() was
 *          called before the cache resolved → AbortError on fast network
 *
 *   Fix: loadAndPlay() on AudioWrapper handles src + play atomically.
 *        MediaSession updated fire-and-forget (not awaited).
 *        Spinner shown immediately on click (< 16ms).
 *
 * ────────────────────────────────────────────────────────────────────────────
 */

import {
  globalAudio,
  globalAudioCallbacks,
  setGlobalAudioCallbacks,
  updateMediaSessionMetadata,
  updateMediaSessionState,
  updateMediaSessionPosition,
  clearMediaSession,
  setupGlobalMediaSessionListener,
  isClearingSession,
} from './audioGlobals';
import { useAppStore } from '../store/useAppStore';
import { checkIsOnline } from './utils';
import { SabadItem } from '../types';

class AudioEngine {
  private _playSequence = 0;
  private _positionUpdateTimer = 0;
  private _initialized = false;
  private _unsubStore: (() => void) | null = null;
  private _settings: any = null;

  // ── init — call once on app startup ──────────────────────────────────────
  init() {
    if (this._initialized) return;
    this._initialized = true;
    setupGlobalMediaSessionListener();
    this._attachGlobalAudioListeners();
    this._subscribeToStoreChanges();
  }

  // ── _attachGlobalAudioListeners ───────────────────────────────────────────
  private _attachGlobalAudioListeners() {
    globalAudio.addEventListener('playing', () => {
      useAppStore.getState().setAudioPlaybackState({
        audioIsPlaying: true,
        audioIsBuffering: false,
        audioError: null,
      });
      updateMediaSessionState('playing');
      try { globalAudioCallbacks?.onPlay?.(); } catch (_) {}
    });

    globalAudio.addEventListener('pause', () => {
      useAppStore.getState().setAudioPlaybackState({ audioIsPlaying: false });
      if (isClearingSession) return;
      updateMediaSessionState('paused');
      const isAtEnd = globalAudio.duration > 0
        && Math.abs(globalAudio.duration - globalAudio.currentTime) < 0.5;
      if (!globalAudio.ended && !isAtEnd) {
        try { globalAudioCallbacks?.onPause?.(); } catch (_) {}
      }
    });

    globalAudio.addEventListener('waiting', () => {
      useAppStore.getState().setAudioPlaybackState({ audioIsBuffering: true });
    });

    globalAudio.addEventListener('canplay', () => {
      useAppStore.getState().setAudioPlaybackState({ audioIsBuffering: false });
    });

    globalAudio.addEventListener('timeupdate', () => {
      const current  = globalAudio.currentTime;
      const duration = globalAudio.duration;
      if (duration > 0 && isFinite(duration)) {
        useAppStore.getState().setAudioPlaybackState({
          audioCurrentTime: current,
          audioDuration: duration,
          audioProgress: (current / duration) * 100,
        });
        const now = Date.now();
        if (now - this._positionUpdateTimer >= 250) {
          this._positionUpdateTimer = now;
          updateMediaSessionPosition(current, duration, globalAudio.playbackRate);
        }
      }
    });

    globalAudio.addEventListener('ended', () => {
      useAppStore.getState().setAudioPlaybackState({
        audioIsPlaying: false,
        audioProgress: 0,
        audioCurrentTime: 0,
      });
      updateMediaSessionState('none');
      try { globalAudioCallbacks?.onEnded?.(); } catch (_) {}
    });

    globalAudio.addEventListener('error', async () => {
      useAppStore.getState().setAudioPlaybackState({
        audioIsPlaying: false,
        audioIsBuffering: false,
      });
      updateMediaSessionState('paused');
      const isOnline = await checkIsOnline();
      useAppStore.getState().setAudioPlaybackState({
        audioError: isOnline
          ? 'ऑडियो लोड करने में विफल।'
          : 'इंटरनेट कनेक्शन उपलब्ध नहीं है। नेटवर्क जांचें।',
      });
    });

    globalAudio.addEventListener('loadedmetadata', () => {
      const d = globalAudio.duration;
      if (isFinite(d) && d > 0) {
        useAppStore.getState().setAudioPlaybackState({ audioDuration: d });
      }
    });
  }

  // ── _subscribeToStoreChanges ──────────────────────────────────────────────
  private _subscribeToStoreChanges() {
    let prevId: string | undefined;

    this._unsubStore = useAppStore.subscribe((state, prevState) => {
      const sabad = state.playingSabad;
      if (!sabad || sabad === prevState.playingSabad || sabad.id === prevId) return;
      if (!sabad.audioUrl) return;
      prevId = sabad.id;
      this._loadTrack(sabad.audioUrl, state.autoPlayAudio, sabad);
    });
  }

  // ── _loadTrack ────────────────────────────────────────────────────────────
  // PERFORMANCE: No awaits before audio starts. MediaSession is fire-and-forget.
  private async _loadTrack(url: string, autoPlay: boolean, sabad: SabadItem) {
    this._playSequence++;
    const seq = this._playSequence;

    // ① Stop current audio immediately (< 1ms)
    globalAudio.pause();

    // ② Show spinner instantly — user sees feedback in < 16ms
    useAppStore.getState().setAudioPlaybackState({
      audioIsPlaying: false,
      audioIsBuffering: true,   // ← always true here, not conditional on autoPlay
      audioProgress: 0,
      audioCurrentTime: 0,
      audioDuration: 0,
      audioError: null,
      audioLoadedUrl: url,
    });

    // ③ Update MediaSession metadata — FIRE AND FORGET (not awaited!)
    //    Old code awaited this — Capacitor bridge call = 50-200ms blocking delay.
    updateMediaSessionMetadata({
      title: sabad.title || 'सबदवाणी',
      artist: 'सबदवाणी',
      album: 'बिश्नोई',
      artwork: this._settings?.logoUrl || '/logo.png',
    }).catch(() => {});

    // ④ Set source and play atomically (handles cache + seq guard internally)
    if (autoPlay) {
      // loadAndPlay() sets src → waits for cache → calls play()
      // No external setTimeout needed — everything resolved inside
      await (globalAudio as any).loadAndPlay(url, () => this._playSequence !== seq);
    } else {
      globalAudio.src = url;
    }
  }

  // ── togglePlay ────────────────────────────────────────────────────────────
  togglePlay(forceState?: 'play' | 'pause') {
    const shouldPlay = forceState === 'play' ? true
                     : forceState === 'pause' ? false
                     : globalAudio.paused;

    if (shouldPlay) {
      // ① Immediate spinner — user sees feedback < 16ms from click
      useAppStore.getState().setAudioPlaybackState({
        audioIsBuffering: true,
        audioError: null,
      });

      // ② If no src loaded yet, load and play from current playingSabad
      const { playingSabad } = useAppStore.getState();
      if (!globalAudio.src && playingSabad?.audioUrl) {
        this._loadTrack(playingSabad.audioUrl, true, playingSabad);
        return;
      }

      // ③ Src already loaded — just play
      globalAudio.play().catch((e) => {
        if (e?.name === 'AbortError') return;
        useAppStore.getState().setAudioPlaybackState({
          audioIsPlaying: false,
          audioIsBuffering: false,
          audioError: e?.name === 'NotAllowedError'
            ? 'प्लेबैक के लिए कृपया बटन दबाएं।'
            : 'ऑडियो चलाने में समस्या आ रही है।',
        });
      });
    } else {
      // Immediate pause feedback
      useAppStore.getState().setAudioPlaybackState({
        audioIsPlaying: false,
        audioIsBuffering: false,
      });
      globalAudio.pause();
    }
  }

  seek(seconds: number) {
    if (!isFinite(seconds) || seconds < 0) return;
    globalAudio.currentTime = seconds;
    const d = globalAudio.duration;
    if (isFinite(d) && d > 0) {
      useAppStore.getState().setAudioPlaybackState({
        audioCurrentTime: seconds,
        audioProgress: (seconds / d) * 100,
      });
    }
  }

  seekByProgress(progress: number) {
    const d = globalAudio.duration;
    if (!isFinite(d) || d <= 0) return;
    this.seek((progress / 100) * d);
  }

  async stopAndClear() {
    await clearMediaSession();
    useAppStore.getState().setAudioPlaybackState({
      audioIsPlaying: false,
      audioIsBuffering: false,
      audioProgress: 0,
      audioCurrentTime: 0,
      audioDuration: 0,
      audioError: null,
      audioLoadedUrl: '',
    });
  }

  registerCallbacks(callbacks: {
    onPlay?: (() => void) | null;
    onPause?: (() => void) | null;
    onEnded?: (() => void) | null;
    onNext?: (() => void) | null;
    onPrev?: (() => void) | null;
    onClose?: (() => void) | null;
    showToast?: ((msg: string) => void) | null;
  }) {
    setGlobalAudioCallbacks({
      ...globalAudioCallbacks,
      ...callbacks,
      togglePlay: (forceState?: 'play' | 'pause') => this.togglePlay(forceState),
    });
  }

  setSettings(settings: any) {
    this._settings = settings;
  }

  destroy() {
    this._unsubStore?.();
    this._initialized = false;
  }
}

export const audioEngine = new AudioEngine();
