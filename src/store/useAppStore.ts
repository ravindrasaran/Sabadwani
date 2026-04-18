import { create } from 'zustand';
import { Screen, SabadItem } from '../types';
import { Preferences } from '@capacitor/preferences';

interface AppState {
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
  
  hydrateStore: () => Promise<void>;
}

export const useAppStore = create<AppState>((set) => ({
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

  hydrateStore: async () => {
    try {
      const themeRes = await Preferences.get({ key: 'sabadwani_readingTheme' });
      const sizeRes = await Preferences.get({ key: 'sabadwani_fontSize' });
      const hintRes = await Preferences.get({ key: 'sabadwani_swipeHint' });
      
      set((state) => ({
        readingTheme: (themeRes.value as any) || state.readingTheme,
        fontSize: sizeRes.value ? parseInt(sizeRes.value) : state.fontSize,
        hasSeenSwipeHint: hintRes.value === 'true'
      }));
    } catch(e) {}
  }
}));
