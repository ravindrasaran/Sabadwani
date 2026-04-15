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

export let isClearingSession = false;

const DEFAULT_LOGO = '/logo.png';

export const updateMediaSessionMetadata = async (metadata: { title: string; artist: string; album: string; artwork?: string }) => {
  isClearingSession = false; // Reset clearing state if we are intentionally setting new metadata
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
  if (isClearingSession && state !== 'none') return;
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

export const clearMediaSession = async () => {
  isClearingSession = true;
  if (globalAudio) {
    globalAudio.pause();
    // Forcefully clear the source to tell the browser this media is finished
    globalAudio.src = "";
    globalAudio.load();
  }

  if (Capacitor.isNativePlatform()) {
    try {
      await MediaSession.setPlaybackState({ playbackState: 'none' });
      await MediaSession.setMetadata({
        title: '',
        artist: '',
        album: '',
        artwork: []
      });
      const actions = [
        'play', 'pause', 'seekbackward', 'seekforward', 'previoustrack', 'nexttrack', 'seekto', 'stop'
      ];
      for (const action of actions) {
        await MediaSession.setActionHandler({ action: action as any }, null);
      }
    } catch (e) {}
  } else if ('mediaSession' in navigator) {
    // Setting playbackState to 'none' and metadata to null is the standard way to clear
    navigator.mediaSession.playbackState = 'none';
    navigator.mediaSession.metadata = null;
    
    // Explicitly remove all action handlers
    const actions: MediaSessionAction[] = [
      'play', 'pause', 'seekbackward', 'seekforward', 'previoustrack', 'nexttrack', 'seekto', 'stop'
    ];
    actions.forEach(action => {
      try {
        navigator.mediaSession.setActionHandler(action, null);
      } catch (e) {}
    });
  }
  
  // Reset the setup flag so it can be re-initialized when a new player starts
  isMediaSessionSetup = false;
  
  setTimeout(() => {
    isClearingSession = false;
  }, 500);
};

let lastPositionUpdate = 0;
export const updateMediaSessionPosition = async (position: number, duration: number, playbackRate: number) => {
  if (isClearingSession) return;
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
  isClearingSession = false; // Ensure we accept events when setting up a new listener
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
    play: () => safeCallback(() => globalAudioCallbacks?.togglePlay?.('play')),
    pause: () => safeCallback(() => globalAudioCallbacks?.togglePlay?.('pause')),
    stop: () => safeCallback(() => globalAudioCallbacks?.onClose?.()),
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
