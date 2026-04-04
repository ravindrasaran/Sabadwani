import { Capacitor } from '@capacitor/core';
import { MediaSession } from '@capgo/capacitor-media-session';

export const globalAudio = typeof window !== 'undefined' ? new Audio() : null;
if (globalAudio) {
  globalAudio.crossOrigin = "anonymous";
  globalAudio.preload = "metadata";
}

export let globalAudioCallbacks: any = {};
export const setGlobalAudioCallbacks = (callbacks: any) => {
  globalAudioCallbacks = callbacks;
};

const DEFAULT_LOGO = '/logo.png';

export const updateMediaSessionMetadata = async (metadata: { title: string; artist: string; album: string; artwork?: string }) => {
  const artworkUrl = metadata.artwork || DEFAULT_LOGO;
  if (Capacitor.isNativePlatform()) {
    try {
      await MediaSession.setMetadata({
        title: metadata.title,
        artist: metadata.artist,
        album: metadata.album,
        artwork: [{ src: artworkUrl, sizes: '512x512', type: 'image/png' }]
      });
    } catch (e) {
      console.error("MediaSession setMetadata error:", e);
    }
  } else if ('mediaSession' in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: metadata.title,
      artist: metadata.artist,
      album: metadata.album,
      artwork: [{ src: artworkUrl, sizes: '512x512', type: 'image/png' }]
    });
  }
};

export const updateMediaSessionState = async (state: 'playing' | 'paused' | 'none') => {
  if (Capacitor.isNativePlatform()) {
    try {
      await MediaSession.setPlaybackState({ playbackState: state });
    } catch (e) {
      console.error("MediaSession setPlaybackState error:", e);
    }
  } else if ('mediaSession' in navigator) {
    navigator.mediaSession.playbackState = state === 'none' ? 'none' : state;
  }
};

let lastPositionUpdate = 0;
export const updateMediaSessionPosition = async (position: number, duration: number, playbackRate: number) => {
  const now = Date.now();
  // Throttle to once per second to avoid overwhelming the bridge
  if (now - lastPositionUpdate < 1000) return;
  lastPositionUpdate = now;

  if (Capacitor.isNativePlatform()) {
    try {
      await MediaSession.setPositionState({
        duration: duration,
        playbackRate: playbackRate,
        position: position
      });
    } catch (e) {}
  } else if ('mediaSession' in navigator && navigator.mediaSession.setPositionState) {
    try {
      navigator.mediaSession.setPositionState({
        duration: duration,
        playbackRate: playbackRate,
        position: position
      });
    } catch (e) {}
  }
};

let isMediaSessionSetup = false;
export const setupGlobalMediaSessionListener = async () => {
  if (isMediaSessionSetup) return;
  isMediaSessionSetup = true;

  const safeCallback = (cb: () => void) => {
    try {
      cb();
    } catch (err) {
      console.error("MediaSession callback error:", err);
    }
  };

  const handlers = {
    play: () => safeCallback(() => {
      if (globalAudio) {
        globalAudio.play().then(() => {
          updateMediaSessionState('playing');
        }).catch((e) => {
          console.error("CapacitorMediaSession: Play error", e);
          // Fallback to callback if direct play fails
          globalAudioCallbacks?.togglePlay?.('play');
        });
      } else {
        globalAudioCallbacks?.togglePlay?.('play');
      }
    }),
    pause: () => safeCallback(() => {
      if (globalAudio) {
        globalAudio.pause();
        updateMediaSessionState('paused');
      }
      // Always notify the callback as well
      globalAudioCallbacks?.togglePlay?.('pause');
    }),
    nexttrack: () => safeCallback(() => globalAudioCallbacks?.onNext?.()),
    previoustrack: () => safeCallback(() => globalAudioCallbacks?.onPrev?.()),
    seekbackward: (details: any) => safeCallback(() => {
      if (globalAudio) {
        const offset = details?.seekOffset || 10;
        globalAudio.currentTime = Math.max(globalAudio.currentTime - offset, 0);
      }
    }),
    seekforward: (details: any) => safeCallback(() => {
      if (globalAudio) {
        const offset = details?.seekOffset || 10;
        let newTime = globalAudio.currentTime + offset;
        if (isFinite(globalAudio.duration)) {
          newTime = Math.min(newTime, globalAudio.duration);
        }
        globalAudio.currentTime = newTime;
      }
    }),
    seekto: (details: any) => safeCallback(() => {
      if (globalAudio && details?.seekTime !== undefined) {
        globalAudio.currentTime = details.seekTime;
      }
    })
  };

  if (!Capacitor.isNativePlatform()) {
    if ('mediaSession' in navigator) {
      Object.entries(handlers).forEach(([action, handler]) => {
        try {
          navigator.mediaSession.setActionHandler(action as MediaSessionAction, handler);
        } catch (e) {}
      });
    }
  } else {
    try {
      for (const [action, handler] of Object.entries(handlers)) {
        await MediaSession.setActionHandler({ action: action as any }, handler);
      }
    } catch (e) {
      console.error("Native MediaSession setup error:", e);
    }
  }
};
