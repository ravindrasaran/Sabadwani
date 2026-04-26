/**
 * ─── AudioEngine v2.2 — All Critical Bugs Fixed ──────────────────────────────
 *
 * FIXES in this version:
 *
 * Fix 1 — SINGLE CLICK PLAY:
 *   togglePlay() now checks globalAudio._isLoading before calling play() directly.
 *   If a loadAndPlay() is already in progress, we let it complete (it calls play() itself).
 *   If not loading, we call play() immediately — no unnecessary waits.
 *
 * Fix 2 — APP CLOSES AFTER ONE TRACK (foreground service killed):
 *   OLD: updateMediaSessionState('none') on 'ended' event
 *        → @capgo plugin stops foreground service notification
 *        → Android has no reason to keep app alive → kills it
 *   NEW: updateMediaSessionState('paused') on 'ended'
 *        → foreground service stays alive during track transition
 *        → 'none' only set on explicit player close (clearMediaSession)
 *
 * Fix 3 — LOCK SCREEN NEXT/PREV STALE CALLBACKS:
 *   AudioPlayer.registerCallbacks() now has proper deps so lock screen
 *   next/prev always calls the latest handleAudioSwipe with correct state.
 *
 * Fix 4 — RACE CONDITION on fast track switches:
 *   _playSequence guard in loadAndPlay ensures only the latest track loads.
 *   _isLoading flag prevents play() calls on partially-loaded elements.
 *
 * Fix 5 — CONTINUOUS AUTOPLAY after track end:
 *   onEnded → handleAudioSwipe("left") → startTrack(nextItem)
 *   startTrack sets autoPlayAudio:true → AudioEngine subscription fires → new track loads+plays.
 *   Works from app foreground AND lock screen (via MediaSession nexttrack handler).
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
  private _posUpdateTimer = 0;
  private _initialized = false;
  private _unsubStore: (() => void) | null = null;
  private _settings: any = null;

  // ── init ──────────────────────────────────────────────────────────────────
  init() {
    if (this._initialized) return;
    this._initialized = true;
    setupGlobalMediaSessionListener();
    this._attachAudioListeners();
    this._watchStore();
  }

  // ── _attachAudioListeners ────────────────────────────────────────────────
  private _attachAudioListeners() {

    // playing — audio frames confirmed
    globalAudio.addEventListener('playing', () => {
      useAppStore.getState().setAudioPlaybackState({
        audioIsPlaying:   true,
        audioIsBuffering: false,
        audioError:       null,
      });
      updateMediaSessionState('playing');
      try { globalAudioCallbacks?.onPlay?.(); } catch (_) {}
    });

    // pause
    globalAudio.addEventListener('pause', () => {
      useAppStore.getState().setAudioPlaybackState({ audioIsPlaying: false });
      if (isClearingSession) return;
      // Only update MediaSession if not mid-transition (isLoading = transitioning to next track)
      if (!globalAudio._isLoading) updateMediaSessionState('paused');
      const isAtEnd = globalAudio.duration > 0
        && Math.abs(globalAudio.duration - globalAudio.currentTime) < 0.5;
      if (!globalAudio.ended && !isAtEnd) {
        try { globalAudioCallbacks?.onPause?.(); } catch (_) {}
      }
    });

    // waiting / canplay — buffering state
    globalAudio.addEventListener('waiting', () => {
      useAppStore.getState().setAudioPlaybackState({ audioIsBuffering: true });
    });
    globalAudio.addEventListener('canplay', () => {
      useAppStore.getState().setAudioPlaybackState({ audioIsBuffering: false });
    });

    // timeupdate
    globalAudio.addEventListener('timeupdate', () => {
      const cur = globalAudio.currentTime;
      const dur = globalAudio.duration;
      if (dur > 0 && isFinite(dur)) {
        useAppStore.getState().setAudioPlaybackState({
          audioCurrentTime: cur,
          audioDuration:    dur,
          audioProgress:    (cur / dur) * 100,
        });
        const now = Date.now();
        if (now - this._posUpdateTimer >= 250) {
          this._posUpdateTimer = now;
          updateMediaSessionPosition(cur, dur, globalAudio.playbackRate);
        }
      }
    });

    // ended — CRITICAL FIX: set 'paused' NOT 'none'
    // 'none' kills the Android foreground service → app gets killed after 1 track
    // 'paused' keeps the foreground service alive during the brief transition to next track
    globalAudio.addEventListener('ended', () => {
      useAppStore.getState().setAudioPlaybackState({
        audioIsPlaying:   false,
        audioIsBuffering: false,
        audioProgress:    0,
        audioCurrentTime: 0,
      });
      // Keep foreground service alive → set 'paused', not 'none'
      updateMediaSessionState('paused');
      // Fire onEnded → handleAudioSwipe("left") → startTrack(nextItem) → auto-advance
      try { globalAudioCallbacks?.onEnded?.(); } catch (_) {}
    });

    // error
    globalAudio.addEventListener('error', async () => {
      useAppStore.getState().setAudioPlaybackState({
        audioIsPlaying:   false,
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

  // ── _watchStore — react to playingSabad changes ───────────────────────────
  private _watchStore() {
    this._unsubStore = useAppStore.subscribe((state, prevState) => {
      const sabad = state.playingSabad;
      const prev  = prevState.playingSabad;

      if (!sabad || !sabad.audioUrl) return;

      // Detect a genuine track-change request:
      // 1. Different sabad object or different id (new track selected)
      // 2. Same track but autoPlay just turned true AND audio is not playing
      //    (user clicked play after pause via startTrack on same track)
      const isNewTrack = sabad !== prev || sabad.id !== prev?.id;
      const isReplayRequest =
        sabad.id === prev?.id &&
        state.autoPlayAudio === true &&
        prevState.autoPlayAudio === false;

      if (!isNewTrack && !isReplayRequest) return;

      this._loadTrack(sabad.audioUrl, state.autoPlayAudio, sabad);
    });
  }

  // ── _loadTrack ────────────────────────────────────────────────────────────
  private async _loadTrack(url: string, autoPlay: boolean, sabad: SabadItem) {
    this._playSequence++;
    const seq = this._playSequence;

    // ① Stop current audio immediately
    globalAudio.pause();

    // ② Spinner ON immediately — user sees < 16ms
    useAppStore.getState().setAudioPlaybackState({
      audioIsPlaying:   false,
      audioIsBuffering: true,
      audioProgress:    0,
      audioCurrentTime: 0,
      audioDuration:    0,
      audioError:       null,
      audioLoadedUrl:   url,
    });

    // ③ Lock-screen metadata — fire-and-forget (NOT awaited)
    //    Awaiting this blocked audio start by 50-200ms in old code
    updateMediaSessionMetadata({
      title:   sabad.title || 'सबदवाणी',
      artist:  'सबदवाणी',
      album:   'बिश्नोई',
      artwork: this._settings?.logoUrl || '/logo.png',
    }).catch(() => {});

    if (!autoPlay) {
      // Just set src for preload, don't play yet
      globalAudio.src = url;
      useAppStore.getState().setAudioPlaybackState({ audioIsBuffering: false });
      return;
    }

    // ④ loadAndPlay atomically (cache lookup → set src → play)
    //    No external setTimeout, no dynamic imports — ~20ms on cached, ~100ms on stream
    try {
      await (globalAudio as any).loadAndPlay(url, () => this._playSequence !== seq);
    } catch (e: any) {
      if (e?.name === 'AbortError') return;
      const isOnline = await checkIsOnline();
      useAppStore.getState().setAudioPlaybackState({
        audioIsPlaying:   false,
        audioIsBuffering: false,
        audioError: isOnline
          ? 'ऑडियो चलाने में समस्या आ रही है।'
          : 'इंटरनेट कनेक्शन उपलब्ध नहीं है। नेटवर्क जांचें।',
      });
    }
  }

  // ── togglePlay — called by play button AND lock screen ────────────────────
  togglePlay(forceState?: 'play' | 'pause') {
    const shouldPlay = forceState === 'play'  ? true
                     : forceState === 'pause' ? false
                     : globalAudio.paused;

    if (shouldPlay) {
      // ① Immediate spinner feedback — no waiting
      useAppStore.getState().setAudioPlaybackState({
        audioIsBuffering: true,
        audioError: null,
      });

      // ② If loadAndPlay is already running, it will call play() itself when ready
      //    Don't interfere — just let it complete
      if (globalAudio._isLoading) return;

      // ③ No src loaded at all — load from current playingSabad
      const { playingSabad } = useAppStore.getState();
      if (!globalAudio.src && playingSabad?.audioUrl) {
        this._loadTrack(playingSabad.audioUrl, true, playingSabad);
        return;
      }

      // ④ Src already loaded — play immediately
      globalAudio.play().catch((e) => {
        if (e?.name === 'AbortError') return;
        useAppStore.getState().setAudioPlaybackState({
          audioIsPlaying:   false,
          audioIsBuffering: false,
          audioError: e?.name === 'NotAllowedError'
            ? 'प्लेबैक के लिए कृपया बटन दबाएं।'
            : 'ऑडियो चलाने में समस्या आ रही है।',
        });
      });
    } else {
      // Immediate pause — no delay
      globalAudio.pause();
      useAppStore.getState().setAudioPlaybackState({
        audioIsPlaying:   false,
        audioIsBuffering: false,
      });
    }
  }

  seek(seconds: number) {
    if (!isFinite(seconds) || seconds < 0) return;
    globalAudio.currentTime = seconds;
    const d = globalAudio.duration;
    if (isFinite(d) && d > 0) {
      useAppStore.getState().setAudioPlaybackState({
        audioCurrentTime: seconds,
        audioProgress:    (seconds / d) * 100,
      });
    }
  }

  seekByProgress(pct: number) {
    const d = globalAudio.duration;
    if (!isFinite(d) || d <= 0) return;
    this.seek((pct / 100) * d);
  }

  async stopAndClear() {
    this._playSequence++; // Cancel any in-progress load
    await clearMediaSession();
    useAppStore.getState().setAudioPlaybackState({
      audioIsPlaying:   false,
      audioIsBuffering: false,
      audioProgress:    0,
      audioCurrentTime: 0,
      audioDuration:    0,
      audioError:       null,
      audioLoadedUrl:   '',
    });
  }

  // ── registerCallbacks ────────────────────────────────────────────────────
  // Called from AudioPlayer whenever any callback prop changes.
  // This keeps lock-screen next/prev always pointing to the latest
  // handleAudioSwipe with fresh playingSabad, aartis, bhajans etc.
  registerCallbacks(callbacks: {
    onPlay?:    (() => void) | null;
    onPause?:   (() => void) | null;
    onEnded?:   (() => void) | null;
    onNext?:    (() => void) | null;
    onPrev?:    (() => void) | null;
    onClose?:   (() => void) | null;
    showToast?: ((m: string) => void) | null;
  }) {
    setGlobalAudioCallbacks({
      ...globalAudioCallbacks,
      ...callbacks,
      togglePlay: (fs?: 'play' | 'pause') => this.togglePlay(fs),
    });
  }

  setSettings(s: any) { this._settings = s; }

  destroy() {
    this._unsubStore?.();
    this._initialized = false;
  }
}

export const audioEngine = new AudioEngine();
