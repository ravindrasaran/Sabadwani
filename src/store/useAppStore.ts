import { create } from 'zustand';
import { Screen, SabadItem } from '../types';
import { Preferences } from '@capacitor/preferences';

// ─── Audio Playback State (Single Source of Truth) ──────────────────────────
// These fields are written ONLY by AudioEngine (audioEngine.ts).
// All UI components (MainPlayer, MiniPlayer, LockScreen) read from here.
// This guarantees perfect sync — one store, one truth.
export interface AudioPlaybackState {
  audioIsPlaying: boolean;
  audioIsBuffering: boolean;
  audioProgress: number;     // 0–100 (percentage)
  audioCurrentTime: number;  // seconds
  audioDuration: number;     // seconds
  audioError: string | null;
  audioLoadedUrl: string;    // which URL is currently loaded in globalAudio
}

interface AppState extends AudioPlaybackState {
  currentScreen: Screen;
  setCurrentScreen: (screen: Screen) => void;

  selectedSabad: SabadItem | null;
  setSelectedSabad: (sabad: SabadItem | null) => void;

  playingSabad: SabadItem | null;
  setPlayingSabad: (sabad: SabadItem | null) => void;

  isAudioActive: boolean;
  setIsAudioActive: (active: boolean) => void;

  selectedCategory: "aarti" | "bhajan" | "sakhi" | "mantra";
  setSelectedCategory: (cat: "aarti" | "bhajan" | "sakhi" | "mantra") => void;

  readingTheme: 'light' | 'sepia' | 'dark';
  setReadingTheme: (theme: 'light' | 'sepia' | 'dark') => void;

  fontSize: number;
  setFontSize: (size: number | ((prev: number) => number)) => void;

  hasSeenSwipeHint: boolean;
  setHasSeenSwipeHint: (seen: boolean) => void;

  autoPlayAudio: boolean;
  setAutoPlayAudio: (autoPlay: boolean) => void;

  isMiniPlayerDismissed: boolean;
  setIsMiniPlayerDismissed: (dismissed: boolean) => void;

  slideDir: number;
  setSlideDir: (dir: number) => void;

  // ── Audio Engine interface ────────────────────────────────────────────────
  // Atomic action: sets playingSabad + autoPlay + isAudioActive + dismisses MiniPlayer.
  // AudioEngine subscribes to playingSabad changes and loads the new track automatically.
  // Call this whenever a new track should start playing.
  startTrack: (sabad: SabadItem) => void;

  // Called exclusively by AudioEngine to push playback state to the store.
  setAudioPlaybackState: (state: Partial<AudioPlaybackState>) => void;

  hydrateStore: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  currentScreen: 'home',
  setCurrentScreen: (screen) => set({ currentScreen: screen }),

  selectedSabad: null,
  setSelectedSabad: (sabad) => set({ selectedSabad: sabad }),

  playingSabad: null,
  setPlayingSabad: (sabad) => set({ playingSabad: sabad }),

  isAudioActive: false,
  setIsAudioActive: (active) => set({ isAudioActive: active }),

  selectedCategory: 'aarti',
  setSelectedCategory: (cat) => set({ selectedCategory: cat }),

  readingTheme: 'light',
  setReadingTheme: (theme) => {
    Preferences.set({ key: 'sabadwani_readingTheme', value: theme });
    set({ readingTheme: theme });
  },

  fontSize: 20,
  setFontSize: (size) => set((state) => {
    const newSize = typeof size === 'function' ? size(state.fontSize) : size;
    Preferences.set({ key: 'sabadwani_fontSize', value: String(newSize) });
    return { fontSize: newSize };
  }),

  hasSeenSwipeHint: false,
  setHasSeenSwipeHint: (seen) => {
    Preferences.set({ key: 'sabadwani_swipeHint', value: String(seen) });
    set({ hasSeenSwipeHint: seen });
  },

  autoPlayAudio: false,
  setAutoPlayAudio: (autoPlay) => set({ autoPlayAudio: autoPlay }),

  isMiniPlayerDismissed: false,
  setIsMiniPlayerDismissed: (dismissed) => set({ isMiniPlayerDismissed: dismissed }),

  slideDir: 0,
  setSlideDir: (dir) => set({ slideDir: dir }),

  // ── Audio Playback State (initial values) ──────────────────────────────────
  audioIsPlaying: false,
  audioIsBuffering: false,
  audioProgress: 0,
  audioCurrentTime: 0,
  audioDuration: 0,
  audioError: null,
  audioLoadedUrl: '',

  // ── startTrack — single entry point for all track changes ─────────────────
  // Atomically updates the store so AudioEngine sees a consistent snapshot.
  startTrack: (sabad: SabadItem) => {
    set({
      playingSabad: sabad,
      isAudioActive: true,
      isMiniPlayerDismissed: false,
      autoPlayAudio: true,
      // Reset playback state immediately so UI shows loading state
      audioIsPlaying: false,
      audioIsBuffering: !!sabad.audioUrl,
      audioProgress: 0,
      audioCurrentTime: 0,
      audioError: null,
    });
    // AudioEngine is subscribed to store — it will detect playingSabad change
    // and call loadTrack() automatically (see audioEngine.ts)
  },

  // ── setAudioPlaybackState — AudioEngine → Store ───────────────────────────
  setAudioPlaybackState: (state) => set(state as any),

  hydrateStore: async () => {
    try {
      const themeRes = await Preferences.get({ key: 'sabadwani_readingTheme' });
      const sizeRes  = await Preferences.get({ key: 'sabadwani_fontSize' });
      const hintRes  = await Preferences.get({ key: 'sabadwani_swipeHint' });
      set((s) => ({
        readingTheme: (themeRes.value as any) || s.readingTheme,
        fontSize: sizeRes.value ? parseInt(sizeRes.value) : s.fontSize,
        hasSeenSwipeHint: hintRes.value === 'true',
      }));
    } catch (_) {}
  },
}));
