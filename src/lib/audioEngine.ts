/**
 * ─── AudioEngine — Premium Audio Playback Singleton ──────────────────────────
 *
 * This is the ONLY place that touches globalAudio directly.
 * It subscribes to useAppStore for track changes and pushes playback
 * state back into the store so all UI components stay in sync.
 *
 * Architecture:
 *   useAppStore.startTrack(sabad)
 *         ↓ (store subscription fires)
 *   audioEngine._loadTrack(url, autoPlay, sabad)
 *         ↓ (HTMLAudioElement events)
 *   useAppStore.setAudioPlaybackState({ isPlaying, progress, ... })
 *         ↓ (Zustand re-render, shallow compare)
 *   MainPlayer + MiniPlayer + LockScreen all update simultaneously
 *
 * ────────────────────────────────────────────────────────────────────────────
 */

import { Capacitor } from '@capacitor/core';
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

  // ── init — call once on app startup ────────────────────────────────────────
  init() {
    if (this._initialized) return;
    this._initialized = true;

    setupGlobalMediaSessionListener();
    this._attachGlobalAudioListeners();
    this._subscribeToStoreChanges();
  }

  // ── _attachGlobalAudioListeners ────────────────────────────────────────────
  // globalAudio events → useAppStore (all UI reads from store)
  private _attachGlobalAudioListeners() {
    // playing — audio frames actually started
    globalAudio.addEventListener('playing', () => {
      useAppStore.getState().setAudioPlaybackState({
        audioIsPlaying: true,
        audioIsBuffering: false,
        audioError: null,
      });
      updateMediaSessionState('playing');

      // Fire registered onPlay callback (e.g. setAutoPlayAudio(true))
      try { globalAudioCallbacks?.onPlay?.(); } catch (_) {}
    });

    // pause — audio paused by user or system
    globalAudio.addEventListener('pause', () => {
      useAppStore.getState().setAudioPlaybackState({ audioIsPlaying: false });

      if (isClearingSession) return;
      updateMediaSessionState('paused');

      // Don't fire onPause when audio reached the end naturally
      const isAtEnd = globalAudio.duration > 0
        && Math.abs(globalAudio.duration - globalAudio.currentTime) < 0.5;
      if (!globalAudio.ended && !isAtEnd) {
        try { globalAudioCallbacks?.onPause?.(); } catch (_) {}
      }
    });

    // waiting — buffering
    globalAudio.addEventListener('waiting', () => {
      useAppStore.getState().setAudioPlaybackState({ audioIsBuffering: true });
    });

    // canplay — enough data to start
    globalAudio.addEventListener('canplay', () => {
      useAppStore.getState().setAudioPlaybackState({ audioIsBuffering: false });
    });

    // timeupdate — position changed
    globalAudio.addEventListener('timeupdate', () => {
      const current  = globalAudio.currentTime;
      const duration = globalAudio.duration;

      if (duration > 0 && isFinite(duration)) {
        const progress = (current / duration) * 100;

        useAppStore.getState().setAudioPlaybackState({
          audioCurrentTime: current,
          audioDuration: duration,
          audioProgress: progress,
        });

        // Throttle MediaSession position update to 250ms
        const now = Date.now();
        if (now - this._positionUpdateTimer >= 250) {
          this._positionUpdateTimer = now;
          updateMediaSessionPosition(current, duration, globalAudio.playbackRate);
        }
      }
    });

    // ended — track finished → fire onEnded callback (auto-next)
    globalAudio.addEventListener('ended', () => {
      useAppStore.getState().setAudioPlaybackState({
        audioIsPlaying: false,
        audioProgress: 0,
        audioCurrentTime: 0,
      });
      updateMediaSessionState('none');
      try { globalAudioCallbacks?.onEnded?.(); } catch (_) {}
    });

    // error — network / decode failure
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

    // durationchange — update duration once metadata loads
    globalAudio.addEventListener('loadedmetadata', () => {
      const duration = globalAudio.duration;
      if (isFinite(duration) && duration > 0) {
        useAppStore.getState().setAudioPlaybackState({ audioDuration: duration });
      }
    });
  }

  // ── _subscribeToStoreChanges ────────────────────────────────────────────────
  // Watch playingSabad — when it changes, load the new track.
  // This is the ONLY place that reacts to track changes, preventing
  // race conditions and double-loads.
  private _subscribeToStoreChanges() {
    let prevPlayingSabadId: string | undefined;

    this._unsubStore = useAppStore.subscribe((state, prevState) => {
      const sabad = state.playingSabad;
      const prevSabad = prevState.playingSabad;

      // Only react when playingSabad actually changed to a new track
      if (!sabad || sabad === prevSabad || sabad.id === prevPlayingSabadId) return;
      if (!sabad.audioUrl) return;

      prevPlayingSabadId = sabad.id;
      const autoPlay = state.autoPlayAudio;

      // Load the new track (settings passed via setSettings() for MediaSession artwork)
      this._loadTrack(sabad.audioUrl, autoPlay, sabad, this._settings);
    });
  }

  // ── _loadTrack — internal track loader ─────────────────────────────────────
  private async _loadTrack(
    url: string,
    autoPlay: boolean,
    sabad: SabadItem,
    settings?: any,
  ) {
    this._playSequence++;
    const seq = this._playSequence;

    // Step 1: Immediately stop current audio (< 1ms)
    globalAudio.pause();

    // Step 2: Reset UI state
    useAppStore.getState().setAudioPlaybackState({
      audioIsPlaying: false,
      audioIsBuffering: autoPlay, // show spinner only if auto-playing
      audioProgress: 0,
      audioCurrentTime: 0,
      audioDuration: 0,
      audioError: null,
      audioLoadedUrl: url,
    });

    // Step 3: Update lock-screen metadata immediately
    await updateMediaSessionMetadata({
      title: sabad.title || 'सबदवाणी',
      artist: 'सबदवाणी',
      album: 'बिश्नोई',
      artwork: settings?.logoUrl || '/logo.png',
    });

    // Step 4: Set source (AudioWrapper handles cache lookup internally)
    globalAudio.src = url;

    // Step 5: Auto-play if requested
    if (!autoPlay) return;

    // Small delay for Android WebView to initialize audio context
    await new Promise(r => setTimeout(r, Capacitor.isNativePlatform() ? 80 : 10));

    // Stale check — a newer track was requested while we were waiting
    if (this._playSequence !== seq) return;

    try {
      await globalAudio.play();
    } catch (e: any) {
      if (e?.name === 'AbortError') return; // Interrupted by newer track — safe

      const isOnline = await checkIsOnline();
      useAppStore.getState().setAudioPlaybackState({
        audioIsPlaying: false,
        audioIsBuffering: false,
        audioError: isOnline
          ? 'ऑडियो चलाने में समस्या आ रही है।'
          : 'इंटरनेट कनेक्शन उपलब्ध नहीं है। नेटवर्क जांचें।',
      });
    }
  }

  // ── Public API (called by AudioPlayer UI) ──────────────────────────────────

  /**
   * Toggle play/pause for the currently loaded track.
   * @param forceState - 'play' | 'pause' to force a specific state
   */
  togglePlay(forceState?: 'play' | 'pause') {
    const shouldPlay = forceState === 'play' ? true
                     : forceState === 'pause' ? false
                     : globalAudio.paused;

    if (shouldPlay) {
      // If nothing is loaded, load the current playingSabad
      const { playingSabad, autoPlayAudio } = useAppStore.getState();
      if (!globalAudio.src && playingSabad?.audioUrl) {
        this._loadTrack(playingSabad.audioUrl, true, playingSabad);
        return;
      }

      useAppStore.getState().setAudioPlaybackState({ audioError: null });
      globalAudio.play().catch((e) => {
        if (e?.name === 'AbortError') return;
        useAppStore.getState().setAudioPlaybackState({
          audioIsPlaying: false,
          audioError: e?.name === 'NotAllowedError'
            ? 'प्लेबैक के लिए कृपया बटन दबाएं।'
            : 'ऑडियो चलाने में समस्या आ रही है।',
        });
      });
    } else {
      globalAudio.pause();
    }
  }

  /**
   * Seek to a specific time in seconds.
   */
  seek(seconds: number) {
    if (!isFinite(seconds) || seconds < 0) return;
    globalAudio.currentTime = seconds;
    const duration = globalAudio.duration;
    if (isFinite(duration) && duration > 0) {
      useAppStore.getState().setAudioPlaybackState({
        audioCurrentTime: seconds,
        audioProgress: (seconds / duration) * 100,
      });
    }
  }

  /**
   * Seek by progress ratio (0–100).
   * Called from AudioPlayer seek bar during drag.
   */
  seekByProgress(progress: number) {
    const duration = globalAudio.duration;
    if (!isFinite(duration) || duration <= 0) return;
    const seconds = (progress / 100) * duration;
    this.seek(seconds);
  }

  /**
   * Completely stop and clear the audio session.
   * Called when user closes the player.
   */
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

  /**
   * Register UI callbacks (onPlay/onPause/onEnded/onNext/onPrev).
   * AudioEngine calls these at the right time (on events from globalAudio).
   * Pass in null for any callback you want to unregister.
   */
  registerCallbacks(callbacks: {
    onPlay?: (() => void) | null;
    onPause?: (() => void) | null;
    onEnded?: (() => void) | null;
    onNext?: (() => void) | null;
    onPrev?: (() => void) | null;
    onClose?: (() => void) | null;
    showToast?: ((msg: string) => void) | null;
  }) {
    // Build full callbacks object merging with existing ones
    const merged = {
      ...globalAudioCallbacks,
      ...callbacks,
      // Lock-screen play/pause/seek go through togglePlay (already registered in audioGlobals.ts)
      togglePlay: (forceState?: 'play' | 'pause') => this.togglePlay(forceState),
    };
    setGlobalAudioCallbacks(merged);
  }

  // ── settings passthrough (for MediaSession artwork) ────────────────────────
  // Called from App.tsx when settings load
  private _settings: any = null;
  setSettings(settings: any) {
    this._settings = settings;
  }

  destroy() {
    this._unsubStore?.();
    this._initialized = false;
  }
}

// Export singleton
export const audioEngine = new AudioEngine();
