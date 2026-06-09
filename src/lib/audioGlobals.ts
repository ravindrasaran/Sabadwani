import { Capacitor } from '@capacitor/core';
import { MediaSession } from '@capgo/capacitor-media-session';

import { App as CapacitorApp } from '@capacitor/app';

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

// Track if the app is currently in the foreground (active) to avoid starting native foreground services from the background
let isAppActive = typeof window !== 'undefined' ? document.visibilityState === 'visible' : true;

if (typeof window !== 'undefined') {
  if (Capacitor.isNativePlatform()) {
    // Get initial state natively immediately
    CapacitorApp.getState().then((state) => {
      isAppActive = state.isActive;
    }).catch(() => {
      isAppActive = true;
    });

    // Listen to native OS lifecycle events for 100% instant precision
    CapacitorApp.addListener('appStateChange', (state) => {
      isAppActive = state.isActive;
    });
  } else {
    document.addEventListener('visibilitychange', () => {
      isAppActive = document.visibilityState === 'visible';
    });
  }
}

const DEFAULT_LOGO = '/logo.png';

export const updateMediaSessionMetadata = async (metadata: { title: string; artist: string; album: string; artwork?: string }) => {
  isClearingSession = false; // Reset clearing state if we are intentionally setting new metadata
  const artworkUrl = metadata.artwork || DEFAULT_LOGO;
  
  // 1. Always update browser/WebView navigator.mediaSession if supported (this is safe and does not trigger native background restrictions)
  if ('mediaSession' in navigator) {
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: metadata.title,
        artist: metadata.artist,
        album: metadata.album,
        artwork: [{ src: artworkUrl, sizes: '512x512', type: 'image/png' }]
      });
    } catch (e) {
      console.error("Web MediaSession setMetadata error:", e);
    }
  }

  // 2. Only invoke native Capacitor plugin if on native platform AND app is in the foreground
  if (Capacitor.isNativePlatform() && isAppActive) {
    try {
      await MediaSession.setMetadata({
        title: metadata.title,
        artist: metadata.artist,
        album: metadata.album,
        artwork: [{ src: artworkUrl, sizes: '512x512', type: 'image/png' }]
      });
    } catch (e) {
      console.error("Native MediaSession setMetadata error:", e);
    }
  }
};

export const updateMediaSessionState = async (state: 'playing' | 'paused' | 'none') => {
  if (isClearingSession && state !== 'none') return;
  
  // Handle Background Mode for Native Platforms
  if (Capacitor.isNativePlatform() && (window as any).cordova?.plugins?.backgroundMode) {
    const bgMode = (window as any).cordova.plugins.backgroundMode;
    if (state === 'playing') {
      if (!bgMode.isActive()) {
        bgMode.enable();
        bgMode.overrideBackButton();
        bgMode.setDefaults({
          title: 'सबदवाणी प्लेयर सक्रिय है',
          text: 'भजन/आरती बैकग्राउंड में चल रही है',
          icon: 'icon', // This should match your app icon name
          color: 'F59E0B', // Accent color
          resume: true,
          hidden: false,
          bigText: true
        });
      }
    } else if (state === 'none' || state === 'paused') {
      // We keep it enabled if paused to allow resuming from lock screen, 
      // but disable if stopped (none)
      if (state === 'none' && bgMode.isActive()) {
        bgMode.disable();
      }
    }
  }

  // 1. Always update standard browser/WebView playbackState (fully background-safe)
  if ('mediaSession' in navigator) {
    try {
      navigator.mediaSession.playbackState = state === 'none' ? 'none' : state;
    } catch (e) {
      console.error("Web MediaSession setPlaybackState error:", e);
    }
  }

  // 2. Only invoke native Capacitor plugin if-and-only-if app is in the foreground to prevent fatal background start service crashes
  if (Capacitor.isNativePlatform() && isAppActive) {
    try {
      await MediaSession.setPlaybackState({ playbackState: state });
    } catch (e) {
      console.error("Native MediaSession setPlaybackState error:", e);
    }
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

  // 1. Clear standard browser/WebView mediaSession
  if ('mediaSession' in navigator) {
    try {
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
    } catch (e) {}
  }

  // 2. Only call native plugin to clear state if-and-only-if app is active in foreground
  if (Capacitor.isNativePlatform() && isAppActive) {
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

  // 1. Always update browser if supported
  if ('mediaSession' in navigator && navigator.mediaSession.setPositionState) {
    try {
      navigator.mediaSession.setPositionState({
        duration: duration,
        playbackRate: playbackRate,
        position: position
      });
    } catch (e) {}
  }

  // 2. Only update native Capacitor plugin if in foreground
  if (Capacitor.isNativePlatform() && isAppActive) {
    try {
      await MediaSession.setPositionState({
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
  
  // Initialize Background Mode if on Native Platform
  if (Capacitor.isNativePlatform() && (window as any).cordova?.plugins?.backgroundMode) {
    const bgMode = (window as any).cordova.plugins.backgroundMode;
    bgMode.setDefaults({
      title: 'सबदवाणी',
      text: 'ऑडियो प्लेयर तैयार है',
      icon: 'icon',
      color: 'F59E0B',
      resume: true,
      hidden: true // Hidden until playback starts
    });
  }

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
