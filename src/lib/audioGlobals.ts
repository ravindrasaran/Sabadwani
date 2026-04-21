import { Capacitor } from '@capacitor/core';
import { Playlist } from '@mustafaj/capacitor-plugin-playlist';
import { AudioCacheService } from './AudioCacheService';

class AudioWrapper {
  private audio: HTMLAudioElement | null = null;
  private isNative = Capacitor.isNativePlatform();
  private listeners: { [key: string]: Function[] } = {};
  private _loadPromise: Promise<void> | null = null;
  
  public _src = '';
  public _currentTime = 0;
  public _duration = 0;
  public _paused = true;
  public _ended = false;
  public _volume = 1;
  public _playbackRate = 1;
  public _metadata: any = null;

  constructor() {
    if (!this.isNative && typeof window !== 'undefined') {
      this.audio = new Audio();
      this.audio.crossOrigin = "anonymous";
      this.audio.preload = "metadata";
      
      const events = ['timeupdate', 'playing', 'play', 'pause', 'waiting', 'canplay', 'ended', 'error'];
      events.forEach(evt => {
        this.audio!.addEventListener(evt, (e) => {
          this._currentTime = this.audio!.currentTime;
          this._duration = this.audio!.duration;
          this._paused = this.audio!.paused;
          this._ended = this.audio!.ended;
          this.emit(evt, e);
        });
      });
    } else if (this.isNative) {
      Playlist.initialize();
      Playlist.addListener('status', (data: any) => {
        const val = data.value || {};
        
        // Handle playback position updates
        if (data.msgType === 40 || val.currentPosition !== undefined || val.position !== undefined) {
          this._currentTime = val.currentPosition !== undefined ? val.currentPosition : (val.position !== undefined ? val.position : this._currentTime);
          this._duration = val.duration !== undefined ? val.duration : this._duration;
          this.emit('timeupdate', {});
        }

        if (data.msgType === 100) {
           if (val.currentIndex === 0 && globalAudioCallbacks?.onPrev) {
               // Hit dummy_prev from Lock Screen "Prev"
               globalAudioCallbacks.onPrev();
           } else if (val.currentIndex === 2) {
               // Hit dummy_next from natural playback finish or manual next
               // Note that explicit Next button is also caught by msgType 90/command
               this._paused = true;
               this._ended = true;
               this.emit('ended', {});
           }
        }

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
        } else if (val.status === 'stopped' || data.msgType === 50 || data.msgType === 60 || (data.msgType === 100 && val.isAtEnd)) {
          this._paused = true;
          this._ended = true;
          this.emit('ended', {});
        }
        
        // Handle native media controls (Next/Prev from lock screen)
        if (data.msgType === 'command') {
           if (val.command === 'next' && globalAudioCallbacks?.onNext) {
             globalAudioCallbacks.onNext();
           } else if (val.command === 'previous' && globalAudioCallbacks?.onPrev) {
             globalAudioCallbacks.onPrev();
           }
        } else if (data.msgType === 90 && globalAudioCallbacks?.onNext) {
           // 90: RMX_STATUS_SKIP_FORWARD
           globalAudioCallbacks.onNext();
        } else if (data.msgType === 95 && globalAudioCallbacks?.onPrev) {
           // 95: RMX_STATUS_SKIP_BACK
           globalAudioCallbacks.onPrev();
        }

        if (data.msgType === 'error') {
          this.emit('error', { name: 'NotAllowedError' });
        }
      });
    }
  }

  get src() { return this._src; }
  set src(val: string) {
    this._src = val;
    if (!val) {
      if (this.audio) this.audio.src = '';
      return;
    }

    if (this.isNative) {
      // Async wrapper to handle caching logic
      this._loadPromise = (async () => {
        try {
          const cachedUrl = await AudioCacheService.getLocalUrl(val);
          
          // If we fallback to remote, optionally trigger background cache
          if (cachedUrl === val && val.startsWith('http')) {
            AudioCacheService.downloadToCache(val);
          }

          await Playlist.setPlaylistItems({
            items: [
              {
                trackId: 'dummy_prev',
                assetUrl: 'https://bishnoi.co.in/silent.mp3', // dummy to force back button
                title: 'पिछला शब्द',
                artist: 'बिश्नोई समाज',
                isStream: false
              },
              {
                trackId: 'track_current',
                assetUrl: cachedUrl,
                title: this._metadata?.title || 'सबदवाणी',
                artist: this._metadata?.artist || 'बिश्नोई समाज',
                album: this._metadata?.album || 'सबदवाणी',
                albumArt: this._metadata?.artwork || new URL('/logo.png', window.location.origin).href,
                // Set isStream to false so lock screen shows progress bar and seek controls
                isStream: false 
              },
              {
                trackId: 'dummy_next',
                assetUrl: 'https://bishnoi.co.in/silent.mp3', // dummy to force next button
                title: 'अगला शब्द',
                artist: 'बिश्नोई समाज',
                isStream: false
              }
            ],
            options: { startPaused: true, retainPosition: false, playFromId: 'track_current' }
          });
        } catch (err) {
          console.warn("Error setting playlist items with cache:", err);
        }
      })();
    } else if (this.audio) {
      this.audio.src = val;
    }
  }

  get currentTime() { return this._currentTime; }
  set currentTime(val: number) {
    this._currentTime = val;
    if (this.isNative) {
      Playlist.seekTo({ position: val });
    } else if (this.audio) {
      this.audio.currentTime = val;
    }
  }

  get duration() { return this._duration; }
  get paused() { return this._paused; }
  get ended() { return this._ended; }

  get volume() { return this._volume; }
  set volume(val: number) {
    this._volume = val;
    if (this.isNative) {
      Playlist.setPlaybackVolume({ volume: val });
    } else if (this.audio) {
      this.audio.volume = val;
    }
  }

  get playbackRate() { return this._playbackRate; }
  set playbackRate(val: number) {
    this._playbackRate = val;
    if (this.isNative) {
      Playlist.setPlaybackRate({ rate: val });
    } else if (this.audio) {
      this.audio.playbackRate = val;
    }
  }

  load() {
    if (this.audio) this.audio.load();
  }

  async play() {
    if (this.isNative) {
      if (this._loadPromise) {
        await this._loadPromise;
      }
      await Playlist.play();
      this._paused = false;
    } else if (this.audio) {
      return this.audio.play();
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

// Pro Feature: Smooth Fading Logic
const FADE_DURATION = 500; // 0.5 seconds
let fadeInterval: NodeJS.Timeout | null = null;

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
    const nextVolume = startVolume + (volumeStep * currentStep);
    globalAudio.volume = Math.max(0, Math.min(1, nextVolume));

    if (currentStep >= steps) {
      if (fadeInterval) clearInterval(fadeInterval);
      globalAudio.volume = targetVolume;
      if (onComplete) onComplete();
    }
  }, stepDuration);
};

// Pro Feature: Audio Focus Handling (For Calls/Other Media)
if (typeof window !== 'undefined' && 'mediaSession' in navigator) {
  (navigator as any).mediaSession.playbackState = 'none';
}

export let globalAudioCallbacks: any = {};
export const setGlobalAudioCallbacks = (callbacks: any) => {
  globalAudioCallbacks = callbacks;
};

export let isClearingSession = false;

const DEFAULT_LOGO = typeof window !== 'undefined' ? new URL('/logo.png', window.location.origin).href : '/logo.png';

export const updateMediaSessionMetadata = async (metadata: { title: string; artist: string; album: string; artwork?: string }) => {
  isClearingSession = false;
  const artworkUrl = metadata.artwork || DEFAULT_LOGO;
  
  // Save metadata for native plugin
  globalAudio._metadata = {
    title: metadata.title,
    artist: metadata.artist,
    album: metadata.album,
    artwork: artworkUrl
  };

  if (!Capacitor.isNativePlatform() && 'mediaSession' in navigator) {
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
  
  if (!Capacitor.isNativePlatform() && 'mediaSession' in navigator) {
    navigator.mediaSession.playbackState = state === 'none' ? 'none' : state;
  }
};

export const clearMediaSession = async () => {
  isClearingSession = true;
  if (globalAudio) {
    globalAudio.pause();
    globalAudio.src = "";
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
  
  setTimeout(() => { isClearingSession = false; }, 500);
};

let lastPositionUpdate = 0;
export const updateMediaSessionPosition = async (position: number, duration: number, playbackRate: number) => {
  if (isClearingSession) return;
  const now = Date.now();
  if (now - lastPositionUpdate < 1000) return;
  lastPositionUpdate = now;

  if (!Capacitor.isNativePlatform() && 'mediaSession' in navigator && navigator.mediaSession.setPositionState) {
    try {
      navigator.mediaSession.setPositionState({ duration, playbackRate, position });
    } catch (e) {}
  }
};

let isMediaSessionSetup = false;
export const setupGlobalMediaSessionListener = async () => {
  isClearingSession = false;
  
  if (isMediaSessionSetup) return;
  isMediaSessionSetup = true;

  const safeCallback = (cb: () => void) => {
    try { cb(); } catch (err) {}
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
        try { navigator.mediaSession.setActionHandler(action as MediaSessionAction, handler); } catch (e) {}
      });
    }
  }
};
