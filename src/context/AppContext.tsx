import { createContext, useContext, useState, ReactNode } from 'react';
import { Screen } from '../types';

interface AppContextType {
  currentScreen: Screen;
  setCurrentScreen: (screen: Screen) => void;
  selectedSabad: any | null;
  setSelectedSabad: (sabad: any | null) => void;
  isMiniPlayerDismissed: boolean;
  setIsMiniPlayerDismissed: (dismissed: boolean) => void;
  fontSize: number;
  setFontSize: (size: number) => void;
  isBookmarked: boolean;
  setIsBookmarked: (bookmarked: boolean) => void;
  isAudioActive: boolean;
  setIsAudioActive: (active: boolean) => void;
  toastMessage: string | null;
  showToast: (message: string) => void;
  selectedCategory: "aarti" | "bhajan" | "sakhi" | "mantra";
  setSelectedCategory: (category: "aarti" | "bhajan" | "sakhi" | "mantra") => void;
  slideDir: number;
  setSlideDir: (dir: number) => void;
  hasSeenSwipeHint: boolean;
  setHasSeenSwipeHint: (seen: boolean) => void;
  settings: any;
  setSettings: (settings: any) => void;
  isAdminAuthenticated: boolean;
  setIsAdminAuthenticated: (auth: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [currentScreen, setCurrentScreen] = useState<Screen>("home");
  const [selectedSabad, setSelectedSabad] = useState<any | null>(null);
  const [isMiniPlayerDismissed, setIsMiniPlayerDismissed] = useState(false);
  const [fontSize, setFontSize] = useState(18);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isAudioActive, setIsAudioActive] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<"aarti" | "bhajan" | "sakhi" | "mantra">("aarti");
  const [slideDir, setSlideDir] = useState(1);
  const [hasSeenSwipeHint, setHasSeenSwipeHint] = useState(() => {
    return typeof localStorage !== 'undefined' ? localStorage.getItem("hasSeenSwipeHint") === "true" : false;
  });
  const [settings, setSettings] = useState<any>({
    logoUrl:
      "https://api.dicebear.com/7.x/shapes/svg?seed=shabadwani&backgroundColor=e68a00",
    qrCodeUrl:
      "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=ravindrasaran@icici&pn=Sabadwani",
    adText: "सबदवाणी PDF अभी डाउनलोड करें - बिल्कुल फ्री!",
    upiId: "ravindrasaran@icici",
    isAdEnabled: true,
    jaapAudioUrl: "https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3",
  });
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <AppContext.Provider value={{
      currentScreen, setCurrentScreen,
      selectedSabad, setSelectedSabad,
      isMiniPlayerDismissed, setIsMiniPlayerDismissed,
      fontSize, setFontSize,
      isBookmarked, setIsBookmarked,
      isAudioActive, setIsAudioActive,
      toastMessage, showToast,
      selectedCategory, setSelectedCategory,
      slideDir, setSlideDir,
      hasSeenSwipeHint, setHasSeenSwipeHint,
      settings, setSettings,
      isAdminAuthenticated, setIsAdminAuthenticated
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
