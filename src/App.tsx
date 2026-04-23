import ConfirmDialog from "./components/ConfirmDialog";
import AudioPlayer from "./components/AudioPlayer";
import Header from "./components/Header";
import AdBanner from "./components/AdBanner";
import NotificationsPanel from "./components/NotificationsPanel";
import NavItem from "./components/NavItem";
import { useWakeLock } from "./hooks/useWakeLock";
import { useSabadData } from "./hooks/useSabadData";
import { generateAmavasyaForYear, getBichhudaList } from "./lib/astro";
import { vibrate, checkIsOnline, getSearchSkeleton, getTransliteratedSearch } from "./lib/utils";
import { globalAudio, setupGlobalMediaSessionListener, clearMediaSession } from "./lib/audioGlobals";
import React, { useState, useEffect, useRef, useMemo, useCallback, ReactNode, Suspense, lazy } from "react";
import { useInitialSetup } from "./hooks/useInitialSetup";
import { usePushNotifications } from "./hooks/usePushNotifications";
import { useAppNotifications } from "./hooks/useAppNotifications";
import { Preferences } from '@capacitor/preferences';

const AdminScreen = lazy(() => import("./components/AdminScreen"));
const JaapMalaScreen = lazy(() => import("./components/JaapMalaScreen"));
const AboutScreen = lazy(() => import("./components/AboutScreen"));
const PrivacyScreen = lazy(() => import("./components/PrivacyScreen"));
const ContributeScreen = lazy(() => import("./components/ContributeScreen"));
const DonateScreen = lazy(() => import("./components/DonateScreen"));
const ReadingScreen = lazy(() => import("./components/screens/ReadingScreen"));
const SearchScreen = lazy(() => import("./components/screens/SearchScreen"));
const CommunityPostsScreen = lazy(() => import("./components/screens/CommunityPostsScreen"));
const AdminLoginScreen = lazy(() => import("./components/screens/AdminLoginScreen"));
const HomeScreen = lazy(() => import("./components/screens/HomeScreen"));
const NiyamScreen = lazy(() => import("./components/screens/NiyamScreen"));
const ShabadListScreen = lazy(() => import("./components/screens/ShabadListScreen"));
const CategoryListScreen = lazy(() => import("./components/screens/CategoryListScreen"));
const MelesScreen = lazy(() => import("./components/screens/MelesScreen"));
const AmavasyaScreen = lazy(() => import("./components/AstroScreens").then(module => ({ default: module.AmavasyaScreen })));
const ChoghadiyaScreen = lazy(() => import("./components/AstroScreens").then(module => ({ default: module.ChoghadiyaScreen })));
const BichhudaScreen = lazy(() => import("./components/AstroScreens").then(module => ({ default: module.BichhudaScreen })));
import {
  Home,
  Info,
  CalendarDays,
  ShieldCheck,
  HeartHandshake,
  AlertTriangle,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useGesture } from "@use-gesture/react";
import SunCalc from "suncalc";
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Routes, Route, useNavigate, useLocation, Navigate } from "react-router-dom";
import { addDays } from "date-fns";
import { collection, addDoc, updateDoc, deleteDoc, doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { signInAnonymously } from "firebase/auth";
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { db, auth, storage } from "./firebase";

const getPathFromURL = (url: string) => {
  try {
    const urlObj = new URL(url);
    const path = decodeURIComponent(urlObj.pathname.split("/o/")[1].split("?")[0]);
    return path;
  } catch (e) {
    return "";
  }
};

// --- Types & Data ---

class ErrorBoundary extends React.Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log the error to Firebase
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    
    // In a premium setup, we log to Crashlytics here. 
    // Assuming standard Firebase SDK availability:
    // logEvent(analytics, 'app_crash', { error: error.message, componentStack: errorInfo.componentStack });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen max-w-md mx-auto relative shadow-2xl bg-paper flex flex-col items-center justify-center p-6 text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
          <h1 className="text-2xl font-bold text-ink mb-2">तकनीकी समस्या</h1>
          <p className="text-ink-light mb-6">क्षमा करें, ऐप में कोई तकनीकी समस्या आ गई है। इसे ठीक करने की रिपोर्ट भेज दी गई है। कृपया ऐप को रीस्टार्ट करें।</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-accent text-white px-6 py-3 rounded-full font-bold shadow-lg"
          >
            ऐप रीस्टार्ट करें
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

import { Screen, SabadItem } from "./types";

const niyamList = [
  "तीस दिन सूतक रखना (जन्म के बाद 30 दिन तक सूतक मानना)।",
  "ऋतुवंती स्त्री को पांच दिन अलग रखना।",
  "प्रातःकाल उठकर स्नान करना।",
  "शील, संतोष और शुचिता (पवित्रता) रखना।",
  "प्रातः और संध्या के समय ईश्वर की वंदना करना।",
  "संध्या के समय आरती करना और ईश्वर के गुण गाना।",
  "प्रतिदिन प्रातःकाल हवन करना।",
  "पानी, ईंधन और दूध को छानकर/देखकर काम में लेना।",
  "वाणी को छानकर (सोच-समझकर) बोलना।",
  "क्षमा धारण करना।",
  "दया भाव रखना।",
  "चोरी नहीं करना।",
  "निंदा नहीं करना।",
  "झूठ नहीं बोलना।",
  "वाद-विवाद नहीं करना।",
  "अमावस्या का व्रत रखना।",
  "विष्णु (ईश्वर) का नाम जपना।",
  "जीवों पर दया करना (अहिंसा)।",
  "हरे वृक्ष नहीं काटना।",
  "काम, क्रोध, मोह, लोभ, अहंकार को वश में करना।",
  "स्वयं के हाथों से बना (या शुद्ध) भोजन करना।",
  "पशुओं को बधिया नहीं करना (थाट अमर रखना)।",
  "बैल को बधिया नहीं करना।",
  "अमल (अफीम) नहीं खाना।",
  "तम्बाकू का सेवन नहीं करना।",
  "भांग नहीं पीना।",
  "मद्य (शराब) नहीं पीना।",
  "मांस नहीं खाना।",
  "नीले वस्त्र नहीं पहनना।"
];

// --- Components ---

import { useAppStore } from "./store/useAppStore";

function MainApp() {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const paymentIntentPending = useRef(false);

  const {
    currentScreen, setCurrentScreen,
    selectedSabad, setSelectedSabad,
    playingSabad, setPlayingSabad,
    isAudioActive, setIsAudioActive,
    selectedCategory, setSelectedCategory,
    readingTheme, setReadingTheme,
    fontSize, setFontSize,
    hasSeenSwipeHint, setHasSeenSwipeHint,
    autoPlayAudio, setAutoPlayAudio,
    isMiniPlayerDismissed, setIsMiniPlayerDismissed,
    slideDir, setSlideDir
  } = useAppStore();

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  }, []);

  const setupMediaSession = useCallback(() => {
    setupGlobalMediaSessionListener();
  }, []);

  useInitialSetup(paymentIntentPending, showToast, setupMediaSession);
  usePushNotifications(showToast);

  const navigate = useNavigate();
  const location = useLocation();
  const openedDirectlyRef = useRef(false);

  // Sync route back to currentScreen in store
  useEffect(() => {
    const route = location.pathname.substring(1) || 'home';
    if (route !== currentScreen) {
      setCurrentScreen(route as Screen);
    }
  }, [location.pathname]);

  // Scroll to top instantly without jitter when route changes
  useEffect(() => {
    // Only scroll after a small timeout to let 'AnimatePresence mode=wait' finish unmounting the old screen.
    // Otherwise, scrolling will disrupt the unmount animation coordinate space resulting in a 'jhatka'.
    const t = setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "instant" });
    }, 150);
    return () => clearTimeout(t);
  }, [location.pathname]);

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      // Configure Status Bar for Edge-to-Edge
      StatusBar.setOverlaysWebView({ overlay: true }).catch(() => {});
      StatusBar.setStyle({ style: Style.Dark }).catch(() => {}); // Dark style means light text for orange background
      
      // Hide Splash Screen after app is ready
      SplashScreen.hide().catch(() => {});

      // Handle app state changes (background/foreground)
      CapacitorApp.addListener('appStateChange', ({ isActive }) => {
        if (!isActive) {
          // App is in background
          if (globalAudio && globalAudio.paused) {
            // If paused, maybe clear session to be safe
            // updateMediaSessionState('paused');
          }
        } else {
          // App returned to foreground
          if (paymentIntentPending.current) {
            paymentIntentPending.current = false;
            setTimeout(() => {
              showToast("सहयोग के प्रयास के लिए आपका बहुत-बहुत धन्यवाद! 🙏");
            }, 500);
          }
        }
      });
    }
  }, []);

  useWakeLock(currentScreen, isAudioActive);

  // Global safety: Manage media session based on player visibility
  // This ensures lock screen controls EXACTLY match the mini player's presence
  useEffect(() => {
    const isPlayerVisible = (isAudioActive && !isMiniPlayerDismissed) || (currentScreen === "audio_reading" && selectedSabad?.audioUrl);
    
    // If player is visible and we have an audio source, setup session
    if (isPlayerVisible && (playingSabad?.audioUrl || selectedSabad?.audioUrl)) {
      setupGlobalMediaSessionListener();
    } else {
      // If player is NOT visible, clear session to hide lock screen controls
      clearMediaSession();
    }
  }, [isAudioActive, currentScreen, isMiniPlayerDismissed, playingSabad, selectedSabad]);

  useEffect(() => {
    setIsMiniPlayerDismissed(false);
  }, [selectedSabad]);

  // Save last read sabad when it changes
  useEffect(() => {
    if (selectedSabad && (currentScreen === "reading" || currentScreen === "audio_reading")) {
      Preferences.set({ key: 'lastReadSabad', value: JSON.stringify({
        sabad: selectedSabad,
        screen: currentScreen,
        category: currentScreen === "audio_reading" ? selectedCategory : undefined
      })});
    }
  }, [selectedSabad, currentScreen, selectedCategory]);

  const handleOpenCategory = async (targetScreen: "reading" | "audio_reading", listScreen: "shabad_list" | "category_list", category?: "aarti" | "bhajan" | "sakhi" | "mantra") => {
    vibrate(10);
    const savedLastRead = await Preferences.get({ key: 'lastReadSabad' });
    if (savedLastRead?.value) {
      try {
        const parsed = JSON.parse(savedLastRead.value);
        if (parsed && parsed.sabad && parsed.screen === targetScreen && (category ? parsed.category === category : true)) {
          setSelectedSabad(parsed.sabad);
          if (category) setSelectedCategory(category);
          setAutoPlayAudio(false);
          
          openedDirectlyRef.current = true;
          navigateTo(targetScreen);
          return;
        }
      } catch (e) {
        // Ignore errors
      }
    }
    if (category) setSelectedCategory(category);
    navigateTo(listScreen);
  };

  const [bookmarks, setBookmarks] = useState<string[]>([]);

  useEffect(() => {
    Preferences.get({ key: 'shabad_bookmarks' }).then(res => {
      if (res.value) {
        try {
          setBookmarks(JSON.parse(res.value));
        } catch (e) {}
      }
    });
  }, []);

  useEffect(() => {
    Preferences.set({ key: 'shabad_bookmarks', value: JSON.stringify(bookmarks) });
  }, [bookmarks]);

  const toggleBookmark = (id: string) => {
    vibrate(7);
    setBookmarks(prev => 
      prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id]
    );
    showToast(bookmarks.includes(id) ? "बुकमार्क हटाया गया" : "बुकमार्क जोड़ा गया");
  };

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [amavasyaList, setAmavasyaList] = useState(() =>
    generateAmavasyaForYear(selectedYear),
  );

  // --- Content State ---

  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const [autoScrollSpeed, setAutoScrollSpeed] = useState(1); // 1 = slow, 2 = medium, 3 = fast
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const autoScrollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (currentScreen !== "reading" && currentScreen !== "audio_reading") {
      setIsAutoScrolling(false);
    }
  }, [currentScreen]);

  useEffect(() => {
    const handleTouch = (e: Event) => {
      // Ignore if clicking on the auto-scroll controls
      const target = e.target as HTMLElement;
      if (target.closest('.auto-scroll-control')) return;

      if (isAutoScrolling) {
        setIsAutoScrolling(false);
        showToast("ऑटो-स्क्रॉल बंद");
      }
    };

    if (isAutoScrolling) {
      window.addEventListener('touchstart', handleTouch, { passive: true });
      window.addEventListener('mousedown', handleTouch, { passive: true });
      window.addEventListener('wheel', handleTouch, { passive: true });
    }

    return () => {
      window.removeEventListener('touchstart', handleTouch);
      window.removeEventListener('mousedown', handleTouch);
      window.removeEventListener('wheel', handleTouch);
    };
  }, [isAutoScrolling]);

  useEffect(() => {
    if (isAutoScrolling && (currentScreen === "reading" || currentScreen === "audio_reading")) {
      const speedMap = { 1: 30, 2: 20, 3: 10 }; // milliseconds per pixel
      autoScrollIntervalRef.current = setInterval(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop += 1;
        } else {
          // Fallback to window scroll if container ref isn't attached
          window.scrollBy(0, 1);
        }
      }, speedMap[autoScrollSpeed as keyof typeof speedMap]);
    } else {
      if (autoScrollIntervalRef.current) {
        clearInterval(autoScrollIntervalRef.current);
      }
    }
    return () => {
      if (autoScrollIntervalRef.current) {
        clearInterval(autoScrollIntervalRef.current);
      }
    };
  }, [isAutoScrolling, autoScrollSpeed, currentScreen]);

  const toggleAutoScroll = (e?: React.MouseEvent | React.TouchEvent) => {
    if (e) e.stopPropagation();
    vibrate(5);
    setIsAutoScrolling(!isAutoScrolling);
    if (!isAutoScrolling) {
      showToast("ऑटो-स्क्रॉल चालू");
    } else {
      showToast("ऑटो-स्क्रॉल बंद");
    }
  };

  const cycleAutoScrollSpeed = (e?: React.MouseEvent | React.TouchEvent) => {
    if (e) e.stopPropagation();
    vibrate(5);
    setAutoScrollSpeed(prev => prev >= 3 ? 1 : prev + 1);
    showToast(`स्पीड: ${autoScrollSpeed >= 3 ? 'धीमी' : autoScrollSpeed === 1 ? 'मध्यम' : 'तेज़'}`);
  };

  const { isLoading, sabads, aartis, bhajans, sakhis, mantras, thoughts, meles, notices, badhais, pendingPosts, settings, setSettings } = useSabadData();

  const recentApprovedPosts = useMemo(() => {
    const getRecent = (arr: SabadItem[], type: string) => 
      arr.filter(item => item.author && item.author !== "Admin")
         .map(item => ({ ...item, type }));
         
    const allRecent = [
      ...getRecent(sabads, "शब्द"),
      ...getRecent(bhajans, "भजन"),
      ...getRecent(aartis, "आरती"),
      ...getRecent(mantras, "मंत्र"),
      ...getRecent(sakhis, "साखी")
    ];
    
    return allRecent
      .sort((a, b) => new Date(b.createdAt || b.timestamp || 0).getTime() - new Date(a.createdAt || a.timestamp || 0).getTime())
      .slice(0, 10);
  }, [sabads, bhajans, aartis, mantras, sakhis]);

  const myPendingPosts = useMemo(() => {
    const currentUserId = auth?.currentUser?.uid;
    if (!currentUserId) return [];
    return pendingPosts.filter(post => post.userId === currentUserId);
  }, [pendingPosts, auth?.currentUser]);

  // Set data loaded flag when the primary lists are populated
  useEffect(() => {
    if (sabads.length > 0 || aartis.length > 0 || bhajans.length > 0) {
      setIsDataLoaded(true);
    }
  }, [sabads.length, aartis.length, bhajans.length]);

  useEffect(() => {
    // Premium Migration: Hydrate async Zustand Native Preferences
    useAppStore.getState().hydrateStore();
  }, []);

  // --- Daily Thought ---
  const [dailyThought, setDailyThought] = useState<any>(thoughts[0] || { text: "विष्णु विष्णु तू भण रे प्राणी", author: "श्री गुरु जम्भेश्वर भगवान" });

  useEffect(() => {
    // Select thought based on day of year to change daily
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now.getTime() - start.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);
    if (thoughts.length > 0) {
      setDailyThought(thoughts[dayOfYear % thoughts.length]);
    } else {
      setDailyThought({ text: "विष्णु विष्णु तू भण रे प्राणी", author: "श्री गुरु जम्भेश्वर भगवान" });
    }
  }, [thoughts]);

  // --- Notifications ---
  const { showNotifications, setShowNotifications, notifications, unreadCount, markRead, markAllRead } = useAppNotifications(db, showToast);

  // --- Admin State ---
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [isAdminLoggingIn, setIsAdminLoggingIn] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState("");
  const [adminLoginError, setAdminLoginError] = useState("");

  const [settingsLogoFile, setSettingsLogoFile] = useState<File | null>(null);
  const [settingsQrCodeFile, setSettingsQrCodeFile] = useState<File | null>(null);
  const [settingsJaapAudioFile, setSettingsJaapAudioFile] = useState<File | null>(null);

  const jaapAudioRef = useRef<HTMLAudioElement | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (settings.jaapAudioUrl) {
      jaapAudioRef.current = new Audio(settings.jaapAudioUrl);
      jaapAudioRef.current.volume = 0.5;
      jaapAudioRef.current.load();
    } else {
      jaapAudioRef.current = null;
    }
  }, [settings.jaapAudioUrl]);

  useEffect(() => {
    if ('speechSynthesis' in window) {
      // Pre-load voices for Android WebView
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
  }, []);

  const playOmVishnu = async () => {
    if (Capacitor.isNativePlatform() && settings.jaapAudioUrl) {
       // Premium Setup: Prevent DOM element being killed in background/doze mode
       // Use Native Playlist API instead for Background Safety
       if (globalAudio) globalAudio.pause();
       // Import Playlist temporarily if needed or just use globalAudio
       globalAudio.src = settings.jaapAudioUrl;
       globalAudio.volume = 0.5;
       globalAudio.play().catch(()=>{});
    } else if (jaapAudioRef.current) {
      jaapAudioRef.current.currentTime = 0;
      jaapAudioRef.current.play().catch(() => {});
    } else {
      try {
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          
          if (!utteranceRef.current) {
            utteranceRef.current = new SpeechSynthesisUtterance("ॐ विष्णु");
            utteranceRef.current.lang = 'hi-IN';
            utteranceRef.current.rate = 0.8;
            utteranceRef.current.pitch = 0.6;
            utteranceRef.current.volume = 1.0;
          }
          
          const voices = window.speechSynthesis.getVoices();
          const hindiVoice = voices.find(v => v.lang.includes('hi') || v.lang.includes('hi-IN'));
          if (hindiVoice) {
            utteranceRef.current.voice = hindiVoice;
          }
          
          window.speechSynthesis.speak(utteranceRef.current);
        }
      } catch (e) {
      }
    }
  };

  // --- Form State for Contribution ---
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contribTitle, setContribTitle] = useState("");
  const [contribType, setContribType] = useState("भजन");
  const [contribSequence, setContribSequence] = useState<number | "">("");
  const [contribAudio, setContribAudio] = useState("");
  const [contribAudioFile, setContribAudioFile] = useState<File | null>(null);
  const [contribAudioError, setContribAudioError] = useState("");
  const [contribText, setContribText] = useState("");
  const [contribError, setContribError] = useState("");
  const [contribAuthor, setContribAuthor] = useState("");
  const [contribDate, setContribDate] = useState("");
  const [contribLocation, setContribLocation] = useState("");
  const [contribPhotoUrl, setContribPhotoUrl] = useState("");
  const [contribPhotoFile, setContribPhotoFile] = useState<File | null>(null);
  const [contribPhotoError, setContribPhotoError] = useState("");
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [captchaExpected, setCaptchaExpected] = useState(0);
  const [captchaQuestion, setCaptchaQuestion] = useState("");

  const generateCaptcha = () => {
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    setCaptchaExpected(num1 + num2);
    setCaptchaQuestion(`${num1} + ${num2} = ?`);
    setCaptchaAnswer("");
  };

  useEffect(() => {
    if (currentScreen === "contribute") {
      generateCaptcha();
      setContribType("भजन");
    }
  }, [currentScreen]);

  // --- Premium Features State ---
  const [searchQuery, setSearchQuery] = useState("");

  const [malaCount, setMalaCount] = useState(0);
  const [malaLaps, setMalaLaps] = useState(0);

  useEffect(() => {
    Preferences.get({ key: 'malaCount' }).then(res => res.value && setMalaCount(parseInt(res.value)));
    Preferences.get({ key: 'malaLaps' }).then(res => res.value && setMalaLaps(parseInt(res.value)));
  }, []);

  useEffect(() => {
    Preferences.set({ key: 'malaCount', value: malaCount.toString() });
    Preferences.set({ key: 'malaLaps', value: malaLaps.toString() });
  }, [malaCount, malaLaps]);

  // --- Admin Edit State ---
  const [pendingContributions, setPendingContributions] = useState<any[]>([]);
  const [editContribution, setEditContribution] = useState<any>(null);

  const handleUpdateContribution = async (id: string, data: any) => {
    if (!db) return;
    try {
      await updateDoc(doc(db, "contributions", id), data);
      showToast("योगदान अपडेट किया गया!");
    } catch (error) {
      showToast("अपडेट करने में त्रुटि हुई।");
    }
  };

  const handleDeleteContribution = async (id: string) => {
    if (!db) return;
    try {
      await deleteDoc(doc(db, "contributions", id));
      showToast("योगदान हटा दिया गया!");
    } catch (error) {
      showToast("हटाने में त्रुटि हुई।");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'audio' | 'photo') => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (type === 'audio') setContribAudioFile(file);
    else setContribPhotoFile(file);
  };
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editItemData, setEditItemData] = useState<any>(null);
  const [editAudioError, setEditAudioError] = useState("");
  const [editPhotoError, setEditPhotoError] = useState("");
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean, 
    title: string, 
    message: string, 
    onConfirm: () => void,
    confirmText?: string,
    cancelText?: string,
    isAlert?: boolean
  } | null>(null);

  const toggleNoticeStatus = async (id: string, currentStatus: boolean) => {
    const isOnline = await checkIsOnline();
    if (!isOnline) {
      showToast("इंटरनेट कनेक्शन उपलब्ध नहीं है। कृपया अपना नेटवर्क जांचें और पुनः प्रयास करें।");
      return;
    }
    if (!db) return;
    try {
      await updateDoc(doc(db, "notices", id), { isActive: !currentStatus });
    } catch (error: any) {
      showToast("स्टेटस बदलने में त्रुटि हुई।");
    }
  };

  const toggleBadhaiStatus = async (id: string, currentStatus: boolean) => {
    const isOnline = await checkIsOnline();
    if (!isOnline) {
      showToast("इंटरनेट कनेक्शन उपलब्ध नहीं है। कृपया अपना नेटवर्क जांचें और पुनः प्रयास करें।");
      return;
    }
    if (!db) return;
    try {
      await updateDoc(doc(db, "badhais", id), { isActive: !currentStatus });
    } catch (error: any) {
      showToast("स्टेटस बदलने में त्रुटि हुई।");
    }
  };

  const openEditModal = (type: string, item: any, index?: number) => {
    setEditItemData({ type, ...item, index });
    setEditAudioError("");
    setEditPhotoError("");
    setEditModalOpen(true);
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    
    const isOnline = await checkIsOnline();
    if (!isOnline) {
      showToast("इंटरनेट कनेक्शन उपलब्ध नहीं है। कृपया अपना नेटवर्क जांचें और पुनः प्रयास करें।");
      return;
    }

    if (editAudioError || editPhotoError) {
      showToast("कृपया पहले फाइल से जुड़ी त्रुटि को ठीक करें।");
      return;
    }
    if (!db) {
      showToast("Firebase is not configured.");
      return;
    }
    
    setIsSubmitting(true);
    try {
      if (auth && !auth.currentUser) {
        await signInAnonymously(auth);
      }
      let finalAudioUrl = editItemData.audioUrl;
      let finalPhotoUrl = editItemData.photoUrl;

      if (editItemData.audioFile) {
        finalAudioUrl = await uploadFileToStorage(editItemData.audioFile, "audio");
      }
      if (editItemData.photoFile) {
        finalPhotoUrl = await uploadFileToStorage(editItemData.photoFile, "images");
      }

      if (editItemData.type === "शब्द") {
        await updateDoc(doc(db, "shabads", editItemData.id), {
          title: editItemData.title,
          text: editItemData.text,
          audioUrl: finalAudioUrl,
          sequence: editItemData.sequence !== undefined ? Number(editItemData.sequence) : null,
          updatedAt: serverTimestamp()
        });
      } else if (editItemData.type === "मंत्र") {
        await updateDoc(doc(db, "mantras", editItemData.id), {
          title: editItemData.title,
          text: editItemData.text,
          audioUrl: finalAudioUrl,
          sequence: editItemData.sequence !== undefined ? Number(editItemData.sequence) : null,
          updatedAt: serverTimestamp()
        });
      } else if (editItemData.type === "आरती") {
        await updateDoc(doc(db, "aartis", editItemData.id), {
          title: editItemData.title,
          text: editItemData.text,
          audioUrl: finalAudioUrl,
          sequence: editItemData.sequence !== undefined ? Number(editItemData.sequence) : null,
          updatedAt: serverTimestamp()
        });
      } else if (editItemData.type === "भजन") {
        await updateDoc(doc(db, "bhajans", editItemData.id), {
          title: editItemData.title,
          text: editItemData.text,
          audioUrl: finalAudioUrl,
          sequence: editItemData.sequence !== undefined ? Number(editItemData.sequence) : null,
          updatedAt: serverTimestamp()
        });
      } else if (editItemData.type === "साखी") {
        await updateDoc(doc(db, "sakhis", editItemData.id), {
          title: editItemData.title,
          text: editItemData.text,
          audioUrl: finalAudioUrl,
          sequence: editItemData.sequence !== undefined ? Number(editItemData.sequence) : null,
          updatedAt: serverTimestamp()
        });
      } else if (editItemData.type === "सुविचार") {
        if (editItemData.id) {
          await updateDoc(doc(db, "thoughts", editItemData.id), {
            text: editItemData.text,
            author: editItemData.author || "गुरु जम्भेश्वर",
            updatedAt: serverTimestamp()
          });
        }
      } else if (editItemData.type === "मेले") {
        await updateDoc(doc(db, "meles", editItemData.id), {
          name: editItemData.name,
          dateStr: editItemData.dateStr,
          location: editItemData.location,
          desc: editItemData.desc,
          updatedAt: serverTimestamp()
        });
      } else if (editItemData.type === "बधाई संदेश") {
        await updateDoc(doc(db, "badhais", editItemData.id), {
          name: editItemData.name,
          photoUrl: finalPhotoUrl,
          text: editItemData.text,
          isActive: editItemData.isActive,
          updatedAt: serverTimestamp()
        });
      } else if (editItemData.type === "आवश्यक सूचना") {
        await updateDoc(doc(db, "notices", editItemData.id), {
          title: editItemData.title,
          text: editItemData.text,
          isActive: editItemData.isActive,
          updatedAt: serverTimestamp()
        });
      }
      setEditModalOpen(false);
      showToast("बदलाव सफलतापूर्वक सेव किए गए!");
    } catch (error: any) {
      if (error.message?.includes("Missing or insufficient permissions")) {
        showToast("अपडेट करने की अनुमति नहीं है। कृपया Firebase Console में Firestore Security Rules को अपडेट करें (allow write: if request.auth != null;).");
      } else {
        showToast("अपडेट करने में त्रुटि हुई।");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (type: string, id: string) => {
    const isOnline = await checkIsOnline();
    if (!isOnline) {
      showToast("इंटरनेट कनेक्शन उपलब्ध नहीं है। कृपया अपना नेटवर्क जांचें और पुनः प्रयास करें।");
      return;
    }
    setConfirmDialog({
      isOpen: true,
      title: "हटाएं",
      message: "क्या आप वाकई इसे हटाना चाहते हैं?",
      onConfirm: async () => {
        if (!db) {
          showToast("Firebase is not configured.");
          return;
        }
        try {
          const collectionMap: { [key: string]: string } = {
            "शब्द": "shabads",
            "मंत्र": "mantras",
            "आरती": "aartis",
            "भजन": "bhajans",
            "साखी": "sakhis",
            "सुविचार": "thoughts",
            "मेले": "meles",
            "बधाई संदेश": "badhais",
            "आवश्यक सूचना": "notices"
          };
          
          const collectionName = collectionMap[type];
          if (!collectionName) return;
          
          const docRef = doc(db, collectionName, id);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (storage) {
              if (data.audioUrl && data.audioUrl.includes("firebasestorage")) {
                try {
                  const path = getPathFromURL(data.audioUrl);
                  if (path) await deleteObject(ref(storage, path));
                } catch (e: any) {
                  if (e.code !== 'storage/object-not-found') {
                    showToast("ऑडियो फाइल हटाने में त्रुटि हुई।");
                  }
                }
              }
              if (data.photoUrl && data.photoUrl.includes("firebasestorage")) {
                try {
                  const path = getPathFromURL(data.photoUrl);
                  if (path) await deleteObject(ref(storage, path));
                } catch (e: any) {
                  if (e.code !== 'storage/object-not-found') {
                    showToast("फोटो फाइल हटाने में त्रुटि हुई।");
                  }
                }
              }
            }
          }
          
          await deleteDoc(docRef);
          showToast("सफलतापूर्वक हटा दिया गया।");
        } catch (error: any) {
          if (error.message?.includes("Missing or insufficient permissions")) {
            showToast("हटाने की अनुमति नहीं है। कृपया Firebase Console में Firestore Security Rules को अपडेट करें (allow write: if request.auth != null;).");
          } else {
            showToast("हटाने में त्रुटि हुई।");
          }
        }
      }
    });
  };

  // --- Choghadiya State & Logic ---
  const [choghadiyaDate, setChoghadiyaDate] = useState(() => {
    const now = new Date();
    if (now.getHours() < 6) {
      now.setDate(now.getDate() - 1);
    }
    const offset = now.getTimezoneOffset() * 60000;
    const localISOTime = new Date(now.getTime() - offset).toISOString().slice(0, -1);
    return localISOTime.split("T")[0];
  });
  const [choghadiyaLocation, setChoghadiyaLocation] =
    useState("Bikaner, Rajasthan");
  const [choghadiyaLoading, setChoghadiyaLoading] = useState(false);
  const [choghadiyaError, setChoghadiyaError] = useState("");
  const [choghadiyaSlots, setChoghadiyaSlots] = useState<{
    day: any[];
    night: any[];
  }>({ day: [], night: [] });

  useEffect(() => {
    if (currentScreen === "choghadiya" && choghadiyaSlots.day.length === 0) {
      calculateChoghadiya();
    }
  }, [currentScreen]);

  const [bichhudaYear, setBichhudaYear] = useState(new Date().getFullYear());
  const [bichhudaMonth, setBichhudaMonth] = useState(new Date().getMonth());

  const bichhudaList = useMemo(() => getBichhudaList(bichhudaYear), [bichhudaYear]);

  const handleGetLocation = async () => {
    setChoghadiyaLoading(true);
    setChoghadiyaError("");

    try {
      let position;
      if (Capacitor.isNativePlatform()) {
        // Native approach: Request permission if needed, then get position
        const permission = await Geolocation.checkPermissions();
        if (permission.location !== 'granted') {
          const request = await Geolocation.requestPermissions();
          if (request.location !== 'granted') {
            setChoghadiyaError("लोकेशन की अनुमति नहीं मिली। कृपया सेटिंग्स में जाकर अनुमति दें या सीधे अपने शहर का नाम लिखकर खोजें।");
            setChoghadiyaLoading(false);
            return;
          }
        }
        position = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 20000 });
      } else {
        // Web approach
        if (!navigator.geolocation) {
          setChoghadiyaError("आपके डिवाइस में लोकेशन की सुविधा उपलब्ध नहीं है।");
          setChoghadiyaLoading(false);
          return;
        }
        position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 20000, maximumAge: 60000 });
        });
      }

      const { latitude, longitude } = position.coords;
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=en&addressdetails=1`,
      );
      const data = await res.json();
      const addr = data.address || {};
      const city = addr.city || addr.town || addr.village || addr.suburb || "Unknown Location";
      const state = addr.state || "";
      const country = addr.country || "";
      const resolvedName = [city, state, country === "India" ? "" : country]
        .filter(Boolean)
        .join(", ");
      setChoghadiyaLocation(resolvedName);
      calculateChoghadiya(resolvedName, choghadiyaDate, { lat: latitude, lon: longitude });
    } catch (error: any) {
      console.error("Location error:", error);
      const errorMsg = error.message?.toLowerCase() || "";
      if (error.code === 2 || errorMsg.includes("disabled") || errorMsg.includes("unavailable") || errorMsg.includes("location services")) {
        setChoghadiyaError("कृपया अपने मोबाइल की लोकेशन (GPS) चालू करें।");
      } else {
        setChoghadiyaError("लोकेशन की अनुमति नहीं मिली। कृपया सेटिंग्स में जाकर अनुमति दें या सीधे अपने शहर का नाम लिखकर खोजें।");
      }
    } finally {
      setChoghadiyaLoading(false);
    }
  };

  // --- Precise Astronomical Calculations ---
  
  const calculateChoghadiya = async (
    loc = choghadiyaLocation,
    dateStr = choghadiyaDate,
    coords?: { lat: number; lon: number }
  ) => {
    setChoghadiyaLoading(true);
    setChoghadiyaError("");
    try {
      let lat = coords?.lat || 28.0229; // Default Bikaner
      let lon = coords?.lon || 73.3119;

      if (!coords) {
        try {
          const geoRes = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(loc)}&format=json&limit=1&accept-language=en&addressdetails=1`,
          );
          const geoData = await geoRes.json();
          if (geoData && geoData.length > 0) {
            lat = parseFloat(geoData[0].lat);
            lon = parseFloat(geoData[0].lon);
            const addr = geoData[0].address || {};
            const city = addr.city || addr.town || addr.village || addr.suburb || geoData[0].display_name.split(",")[0];
            const state = addr.state || "";
            setChoghadiyaLocation(city + (state ? ", " + state : ""));
          }
        } catch (e) {
          // Geo lookup failed, using defaults
        }
      }

      const [year, month, day] = dateStr.split("-").map(Number);
      const targetDate = new Date(year, month - 1, day, 12, 0, 0);
      const times = SunCalc.getTimes(targetDate, lat, lon);
      const nextDayTimes = SunCalc.getTimes(addDays(targetDate, 1), lat, lon);

      const sunrise = times.sunrise;
      const sunset = times.sunset;
      const nextSunrise = nextDayTimes.sunrise;

      const dayDurationMs = sunset.getTime() - sunrise.getTime();
      const nightDurationMs = nextSunrise.getTime() - sunset.getTime();

      const daySlotMs = dayDurationMs / 8;
      const nightSlotMs = nightDurationMs / 8;

      const dayOfWeek = targetDate.getDay();

      const daySequences = [
        ["उद्वेग", "चर", "लाभ", "अमृत", "काल", "शुभ", "रोग", "उद्वेग"], // Sun
        ["अमृत", "काल", "शुभ", "रोग", "उद्वेग", "चर", "लाभ", "अमृत"], // Mon
        ["रोग", "उद्वेग", "चर", "लाभ", "अमृत", "काल", "शुभ", "रोग"], // Tue
        ["लाभ", "अमृत", "काल", "शुभ", "रोग", "उद्वेग", "चर", "लाभ"], // Wed
        ["शुभ", "रोग", "उद्वेग", "चर", "लाभ", "अमृत", "काल", "शुभ"], // Thu
        ["चर", "लाभ", "अमृत", "काल", "शुभ", "रोग", "उद्वेग", "चर"], // Fri
        ["काल", "शुभ", "रोग", "उद्वेग", "चर", "लाभ", "अमृत", "काल"], // Sat
      ];

      const nightSequences = [
        ["शुभ", "अमृत", "चर", "रोग", "काल", "लाभ", "उद्वेग", "शुभ"],
        ["चर", "रोग", "काल", "लाभ", "उद्वेग", "शुभ", "अमृत", "चर"],
        ["काल", "लाभ", "उद्वेग", "शुभ", "अमृत", "चर", "रोग", "काल"],
        ["उद्वेग", "शुभ", "अमृत", "चर", "रोग", "काल", "लाभ", "उद्वेग"],
        ["अमृत", "चर", "रोग", "काल", "लाभ", "उद्वेग", "शुभ", "अमृत"],
        ["रोग", "काल", "लाभ", "उद्वेग", "शुभ", "अमृत", "चर", "रोग"],
        ["लाभ", "उद्वेग", "शुभ", "अमृत", "चर", "रोग", "काल", "लाभ"],
      ];

      const formatTime = (d: Date) =>
        d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

      const generateSlots = (
        sequence: string[],
        startTime: Date,
        slotDurationMs: number,
      ) => {
        return sequence.map((name, idx) => {
          let type = "normal";
          if (["अमृत", "शुभ", "लाभ"].includes(name)) type = "good";
          if (["रोग", "काल", "उद्वेग"].includes(name)) type = "bad";
          const slotStart = new Date(startTime.getTime() + idx * slotDurationMs);
          const slotEnd = new Date(startTime.getTime() + (idx + 1) * slotDurationMs);
          return {
            name: `${name} (${type === "good" ? "उत्तम" : type === "bad" ? "अशुभ" : "सामान्य"})`,
            time: `${formatTime(slotStart)} - ${formatTime(slotEnd)}`,
            type,
            startTime: slotStart,
            endTime: slotEnd,
          };
        });
      };

      setChoghadiyaSlots({
        day: generateSlots(daySequences[dayOfWeek], sunrise, daySlotMs),
        night: generateSlots(nightSequences[dayOfWeek], sunset, nightSlotMs),
      });
    } catch (err: any) {
      setChoghadiyaError(err.message || "कुछ त्रुटि हुई।");
    } finally {
      setChoghadiyaLoading(false);
    }
  };

  // --- Mele Logic ---
  const processedMeles = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return meles.map(mela => {
      let melaDate: Date;
      if (mela.dateStr) {
        const [year, month, day] = mela.dateStr.split('-').map(Number);
        melaDate = new Date(year, month - 1, day);
      } else if (mela.date?.toDate) {
        melaDate = mela.date.toDate();
      } else {
        melaDate = new Date(mela.date);
      }
      melaDate.setHours(0, 0, 0, 0);
      
      const diffTime = melaDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      return {
        ...mela,
        isUpcoming: diffDays >= 0,
        upcoming: diffDays >= 0, // Keep both for compatibility
        daysLeft: diffDays,
        formattedDate: melaDate.toLocaleDateString('hi-IN', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        }),
        dateFormatted: melaDate.toLocaleDateString('hi-IN', { // Keep both for compatibility
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        })
      };
    }).sort((a, b) => a.daysLeft - b.daysLeft);
  }, [meles]);

  useEffect(() => {
    if (currentScreen === "choghadiya") {
      const timer = setTimeout(() => {
        const currentSlot = document.getElementById('current-choghadiya-slot');
        if (currentSlot) {
          currentSlot.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [currentScreen, choghadiyaSlots]);

  // --- Swipe Gesture Logic ---
  const handleSwipe = (direction: "left" | "right") => {
    try {
      if (!selectedSabad) return;
      vibrate(10);
      
      if (!hasSeenSwipeHint) {
        setHasSeenSwipeHint(true);
      }

      let currentList: SabadItem[] = [];
      if (currentScreen === "reading") currentList = sabads;
      else if (currentScreen === "audio_reading") {
        if (selectedCategory === "aarti") currentList = aartis;
        else if (selectedCategory === "bhajan") currentList = bhajans;
        else if (selectedCategory === "sakhi") currentList = sakhis;
        else if (selectedCategory === "mantra") currentList = mantras;
      }
      else if (currentScreen === "community_posts") currentList = recentApprovedPosts;

      // Fallback if list is empty or not found
      if (!currentList || currentList.length === 0) {
        if (selectedSabad.type === "शब्द") currentList = sabads;
        else if (selectedSabad.type === "आरती" || selectedCategory === "aarti") currentList = aartis;
        else if (selectedSabad.type === "भजन" || selectedCategory === "bhajan") currentList = bhajans;
        else if (selectedSabad.type === "साखी" || selectedCategory === "sakhi") currentList = sakhis;
        else if (selectedSabad.type === "मंत्र" || selectedCategory === "mantra") currentList = mantras;
      }

      if (!currentList || currentList.length === 0) return;

      const currentIndex = currentList.findIndex(
        (item) => item && item.id === selectedSabad.id,
      );

      if (currentIndex === -1) return;

      let nextIndex = currentIndex;
      let prevIndex = currentIndex;

      const isSabadsList = currentList === sabads;

      if (direction === "left") {
        if (isSabadsList && currentIndex === 65) { // 66th sabad (index 65)
          nextIndex = 67; // Skip 67th (index 66) to 68th (index 67)
        } else if (isSabadsList && currentIndex === 119) { // 120th sabad (index 119)
          nextIndex = 66; // Loop to 67th (index 66)
        } else if (currentIndex < currentList.length - 1) {
          nextIndex = currentIndex + 1;
        } else {
          return; // End of list
        }
        setSlideDir(1);
        const nextItem = currentList[nextIndex];
        if (nextItem) {
          setSelectedSabad(nextItem);
          if (currentScreen === "audio_reading") {
            setPlayingSabad(nextItem);
          }
        }
      } else if (direction === "right") {
        if (isSabadsList && currentIndex === 67) { // 68th sabad (index 67)
          prevIndex = 65; // Back to 66th (index 65)
        } else if (isSabadsList && currentIndex === 66) { // 67th sabad (index 66)
          prevIndex = 119; // Back to 120th (index 119)
        } else if (currentIndex > 0) {
          prevIndex = currentIndex - 1;
        } else {
          return; // Start of list
        }
        setSlideDir(-1);
        const prevItem = currentList[prevIndex];
        if (prevItem) {
          setSelectedSabad(prevItem);
          if (currentScreen === "audio_reading") {
            setPlayingSabad(prevItem);
          }
        }
      }
    } catch (err) {
      console.error("Swipe error:", err);
    }
  };

  const handleAudioSwipe = (direction: "left" | "right") => {
    try {
      // If nothing is playing, fallback to regular swipe
      if (!playingSabad) {
        handleSwipe(direction);
        return;
      }
      
      let currentList: SabadItem[] = [];
      if (playingSabad.type === "शब्द") currentList = sabads;
      else if (playingSabad.type === "आरती") currentList = aartis;
      else if (playingSabad.type === "भजन") currentList = bhajans;
      else if (playingSabad.type === "साखी") currentList = sakhis;
      else if (playingSabad.type === "मंत्र") currentList = mantras;
      
      // Fallback if type is missing
      if (!currentList || currentList.length === 0) {
        if (selectedCategory === "aarti") currentList = aartis;
        else if (selectedCategory === "bhajan") currentList = bhajans;
        else if (selectedCategory === "sakhi") currentList = sakhis;
        else if (selectedCategory === "mantra") currentList = mantras;
        else currentList = sabads;
      }

      if (!currentList || currentList.length === 0) return;

      const currentIndex = currentList.findIndex(
        (item) => item && item.id === playingSabad.id,
      );

      if (currentIndex === -1) return;

      let nextIndex = currentIndex;
      let prevIndex = currentIndex;

      const isSabadsList = currentList === sabads;

      if (direction === "left") {
        if (isSabadsList && currentIndex === 65) { // 66th sabad (index 65)
          nextIndex = 67; // Skip 67th (index 66) to 68th (index 67)
        } else if (isSabadsList && currentIndex === 119) { // 120th sabad (index 119)
          nextIndex = 66; // Loop to 67th (index 66)
        } else if (currentIndex < currentList.length - 1) {
          nextIndex = currentIndex + 1;
        } else {
          return; // End of list
        }
        const nextItem = currentList[nextIndex];
        if (nextItem) {
          setPlayingSabad(nextItem);
          if ((currentScreen === "audio_reading" || currentScreen === "reading") && selectedSabad?.id === playingSabad.id) {
            setSlideDir(1);
            setSelectedSabad(nextItem);
          }
        }
      } else if (direction === "right") {
        if (isSabadsList && currentIndex === 67) { // 68th sabad (index 67)
          prevIndex = 65; // Back to 66th (index 65)
        } else if (isSabadsList && currentIndex === 66) { // 67th sabad (index 66)
          prevIndex = 119; // Back to 120th (index 119)
        } else if (currentIndex > 0) {
          prevIndex = currentIndex - 1;
        } else {
          return; // Start of list
        }
        const prevItem = currentList[prevIndex];
        if (prevItem) {
          setPlayingSabad(prevItem);
          if ((currentScreen === "audio_reading" || currentScreen === "reading") && selectedSabad?.id === playingSabad.id) {
            setSlideDir(-1);
            setSelectedSabad(prevItem);
          }
        }
      }
    } catch (err) {
      console.error("Audio swipe error:", err);
    }
  };

  const handleAudioEnded = () => {
    setAutoPlayAudio(true);
    handleAudioSwipe("left");
  };

  const bindGestures = useGesture(
    {
      onDragEnd: ({ swipe: [swipeX], movement: [mx] }) => {
        // Trigger if it's a fast swipe OR if the user dragged more than 60px
        if (swipeX === -1 || mx < -60) handleSwipe("left");
        else if (swipeX === 1 || mx > 60) handleSwipe("right");
      },
      onPinch: ({ delta: [d] }) => {
        setFontSize((s) => {
          const next = s + d / 5;
          return Math.min(Math.max(next, 12), 40);
        });
      },
    },
    {
      drag: { 
        axis: 'x', 
        filterTaps: true, 
        swipe: { distance: 30, velocity: 0.2 }, 
        touchAction: 'pan-y' 
      },
      pinch: { eventOptions: { passive: false } },
    },
  );

  useEffect(() => {
    setAmavasyaList(generateAmavasyaForYear(selectedYear));
  }, [selectedYear]);

  const navigateTo = (screen: Screen, replace = false) => {
    vibrate(10);
    // Removed window.scrollTo because 'smooth' scrolling combined with AnimatePresence
    // causes a nasty layout "jhatka" or jitter when exiting tall screens like Privacy Policy.
    if (screen === "amavasya") {
      setSelectedYear(new Date().getFullYear());
    }
    
    // Check if we are already on this screen
    const targetPath = screen === 'home' ? '/' : `/${screen}`;
    if (location.pathname === targetPath || (location.pathname === '/' && screen === 'home')) return;

    navigate(targetPath, { replace });
    setShowNotifications(false);
  };

  const [pendingDeepLinkId, setPendingDeepLinkId] = useState<string | null>(null);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // --- Deep Linking ---
  useEffect(() => {
    const handleUrl = (urlStr: string) => {
      try {
        const url = new URL(urlStr);
        let shabadId = "";
        
        if (url.protocol === 'sabadwani:') {
          const pathParts = url.pathname.split('/').filter(p => p);
          shabadId = pathParts[pathParts.length - 1];
        } else {
          const pathParts = url.pathname.split('/').filter(p => p);
          const validSlugs = ['shabad', 'sabad', 'bhajan', 'aarati', 'mantra', 'sakhi'];
          const foundSlug = validSlugs.find(slug => pathParts.includes(slug));
          
          if (foundSlug) {
            const idx = pathParts.indexOf(foundSlug);
            shabadId = pathParts[idx + 1];
          } else if (pathParts.length > 0) {
            shabadId = pathParts[pathParts.length - 1];
          }
          
          if (!shabadId || validSlugs.includes(shabadId)) {
            const params = new URLSearchParams(url.search);
            shabadId = params.get('id') || params.get('shabad') || shabadId;
          }
        }
        
        if (shabadId && !['shabad', 'sabad', 'bhajan', 'aarati', 'mantra', 'sakhi'].includes(shabadId)) {
          setPendingDeepLinkId(shabadId);
        }
      } catch (e) {
        if (urlStr.length > 5 && !urlStr.includes(' ')) {
          setPendingDeepLinkId(urlStr);
        }
      }
    };

    if (Capacitor.isNativePlatform()) {
      // Handle app opened from URL while running
      const listener = CapacitorApp.addListener('appUrlOpen', (event: any) => {
        handleUrl(event.url);
      });

      // Handle app opened from URL while closed (cold start)
      CapacitorApp.getLaunchUrl().then(ret => {
        if (ret && ret.url) {
          handleUrl(ret.url);
        }
      });

      return () => {
        listener.then(l => l.remove());
      };
    } else {
      // Handle web deep links on initial load
      const path = window.location.pathname;
      const pathParts = path.split('/').filter(p => p);
      if (pathParts.includes('shabad') || pathParts.includes('sabad')) {
        const idx = pathParts.indexOf('shabad') !== -1 ? pathParts.indexOf('shabad') : pathParts.indexOf('sabad');
        const shabadId = pathParts[idx + 1];
        if (shabadId) {
          setPendingDeepLinkId(shabadId);
        }
      }
    }
  }, []);

  // Process pending deep link once data is loaded
  useEffect(() => {
    if (pendingDeepLinkId && isDataLoaded) {
      const checkMatch = (item: any) => item.id === pendingDeepLinkId || item.shortId === pendingDeepLinkId || item.id.startsWith(pendingDeepLinkId);
      const shabad = sabads.find(checkMatch) || aartis.find(checkMatch) || bhajans.find(checkMatch) || sakhis.find(checkMatch) || mantras.find(checkMatch);
      
      if (shabad) {
        handleSabadClick(shabad);
        setPendingDeepLinkId(null);
      } else {
        const otherItem = meles.find(checkMatch) || notices.find(checkMatch);
        if (otherItem) {
          setSelectedSabad(otherItem as any);
          navigateTo("reading");
          setPendingDeepLinkId(null);
        }
      }
    }
  }, [pendingDeepLinkId, isDataLoaded, sabads, aartis, bhajans, sakhis, mantras, meles, notices]);

  const handleSabadClick = (shabad: SabadItem) => {
    vibrate(10);
    setSelectedSabad(shabad);
    setAutoPlayAudio(false);
    
    if (shabad.audioUrl) {
      navigateTo("audio_reading");
    } else {
      navigateTo("reading");
    }
  };

  const backPressCountRef = useRef(0);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const handleBackButton = async () => {
      if (currentScreen === "home") {
        if (backPressCountRef.current > 0) {
          CapacitorApp.exitApp();
        } else {
          showToast("बाहर निकलने के लिए फिर से दबाएं");
          vibrate(10);
          backPressCountRef.current = 1;
          setTimeout(() => {
            backPressCountRef.current = 0;
          }, 2000);
        }
      } else {
        handleBack();
      }
    };

    const backListener = CapacitorApp.addListener('backButton', handleBackButton);
    return () => {
      backListener.then(listener => listener.remove());
    };
  }, [currentScreen]);

  const handleBack = () => {
    vibrate(8);
    
    // 1. If we are on a reading screen, we MUST go to the list screen.
    if (currentScreen === "reading" || currentScreen === "audio_reading") {
        // Determine the correct list screen
        let listScreen: Screen = "shabad_list";
        if (currentScreen === "audio_reading") listScreen = "category_list";
        
        navigate(`/${listScreen}`, { replace: true });
        return;
    }

    // 2. If we are on a list screen, we MUST go to home.
    if (currentScreen === "shabad_list" || currentScreen === "category_list") {
        navigate('/', { replace: true }); // Replace with home
        return;
    }

    // 3. Default back for other screens
    navigate(-1);
  };

  const handleShare = async () => {
    vibrate(10);
    const playStoreLink = "https://play.google.com/store/apps/details?id=com.ravindrasaran.sabadwani";
    const contentType = selectedSabad?.type;
    const action = (contentType && (contentType.includes("भजन") || contentType.includes("आरती"))) ? "सुनें" : "पढ़ें";
    
    const introLine = contentType 
      ? `सबदवाणी ऐप से यह ${contentType} ${action}:` 
      : `सबदवाणी ऐप से यह ${action}:`;
      
    let slug = "sabad";
    if (contentType) {
      if (contentType.includes("भजन")) slug = "bhajan";
      else if (contentType.includes("आरती")) slug = "aarati";
      else if (contentType.includes("मंत्र")) slug = "mantra";
      else if (contentType.includes("साखी")) slug = "sakhi";
    }
    
    // Generate deep link
    const shareId = selectedSabad?.id ? ((selectedSabad as any).shortId || selectedSabad.id.substring(0, 8)) : "";
    const deepLink = shareId ? `\n\nसीधे ऐप में खोलें: https://bishnoi.co.in/${slug}/${shareId}` : "";
    
    const shareText = `${introLine}\n\n${selectedSabad?.title || "सबदवाणी"}\n\n${(selectedSabad?.text || "").substring(0, 200)}...${deepLink}\n\nऐप डाउनलोड करें: ${playStoreLink}`;
    
    try {
      await import('@capacitor/share').then(({ Share }) => {
        return Share.share({
          title: selectedSabad?.title || "सबदवाणी",
          text: shareText,
          dialogTitle: 'शेयर करें',
        });
      });
    } catch (error) {
      try {
        await navigator.clipboard.writeText(shareText);
        showToast("पाठ कॉपी कर लिया गया है!");
      } catch (err) {
        showToast("कॉपी करने में विफल!");
      }
    }
  };

  const handleContributeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    setContribError("");
    
    let isOnline = await checkIsOnline();
    
    // Alternative Solution: Retry for 10 seconds if offline
    if (!isOnline) {
      let retries = 5; // 5 retries * 2 seconds = 10 seconds
      while (retries > 0 && !isOnline) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        isOnline = await checkIsOnline();
        retries--;
      }
    }

    if (!isOnline) {
      setContribError("इंटरनेट कनेक्शन उपलब्ध नहीं है। कृपया अपना नेटवर्क जांचें और पुनः प्रयास करें।");
      setIsSubmitting(false);
      return;
    }

    if (contribAudioError) {
      showToast("कृपया पहले ऑडियो से जुड़ी त्रुटि को ठीक करें।");
      setIsSubmitting(false);
      return;
    }
    if (parseInt(captchaAnswer) !== captchaExpected) {
      showToast("कृपया सही सुरक्षा कोड (Captcha) दर्ज करें।");
      generateCaptcha();
      setIsSubmitting(false);
      return;
    }
    if (!db) {
      showToast("Firebase is not configured. Please set the API keys.");
      setIsSubmitting(false);
      return;
    }
    
    let finalAudioUrl = contribAudio;
    
    try {
      if (auth && !auth.currentUser) {
        await signInAnonymously(auth);
      }

      if (contribAudioFile) {
        finalAudioUrl = await uploadFileToStorage(contribAudioFile, "audio");
      }
      
      const newPost = {
        title: contribTitle,
        text: contribText,
        audioUrl: finalAudioUrl,
        author: contribAuthor || "अज्ञात भक्त",
        type: contribType,
        timestamp: new Date().toISOString(),
        userId: auth?.currentUser?.uid,
      };
      
      await addDoc(collection(db, "pendingPosts"), newPost);
      showToast("धन्यवाद! आपकी सामग्री समीक्षा के लिए भेज दी गई है।");
      setContribTitle("");
      setContribText("");
      setContribAudio("");
      setContribAudioFile(null);
      setContribAuthor("");
      navigateTo("home");
    } catch (error: any) {
      if (error.message?.includes("Missing or insufficient permissions")) {
        showToast("भेजने की अनुमति नहीं है। कृपया Firebase Console में Firestore Security Rules को अपडेट करें (allow write: if request.auth != null;).");
      } else {
        showToast("सामग्री भेजने में त्रुटि हुई। कृपया पुनः प्रयास करें।");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileSelect = async (
    e: React.ChangeEvent<HTMLInputElement>,
    setFileCallback: (file: File | null) => void,
    isImage: boolean = false,
    setErrorCallback?: (error: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (setErrorCallback) setErrorCallback("");

    if (isImage) {
      if (file.size > 2 * 1024 * 1024) {
        const msg = "इमेज का आकार 2MB से कम होना चाहिए। (प्रीमियम क्वालिटी)";
        if (setErrorCallback) setErrorCallback(msg);
        else showToast(msg);
        return;
      }
      try {
        const { compressImageToWebp } = await import('./utils/imageCompressor');
        const webpFile = await compressImageToWebp(file);
        setFileCallback(webpFile);
        showToast("इमेज सेलेक्ट हो गई है।");
      } catch (error) {
        setFileCallback(file);
        showToast("इमेज सेलेक्ट हो गई है।");
      }
    } else {
      if (file.size > 5 * 1024 * 1024) {
        const msg = "ऑडियो का आकार 5एमबी से कम होना चाहिए। (प्रीमियम क्वालिटी)";
        if (setErrorCallback) setErrorCallback(msg);
        else showToast(msg);
        return;
      }
      setFileCallback(file);
      showToast("ऑडियो सेलेक्ट हो गया है।");
    }
  };

  const uploadFileToStorage = async (file: File, folder: string): Promise<string> => {
    if (!storage) throw new Error("Storage not initialized");
    const storageRef = ref(storage, `${folder}/${Date.now()}_${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);
    
    return new Promise((resolve, reject) => {
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (error) => {
          setUploadProgress(null);
          reject(error);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          setUploadProgress(null);
          resolve(downloadURL);
        }
      );
    });
  };


  const handleSaveSettings = async () => {
    const isOnline = await checkIsOnline();
    if (!isOnline) {
      showToast("इंटरनेट कनेक्शन उपलब्ध नहीं है। कृपया अपना नेटवर्क जांचें और पुनः प्रयास करें।");
      return;
    }
    if (!db) return;
    try {
      let finalLogoUrl = settings.logoUrl;
      let finalQrCodeUrl = settings.qrCodeUrl;
      let finalJaapAudioUrl = settings.jaapAudioUrl;

      if (settingsLogoFile) {
        finalLogoUrl = await uploadFileToStorage(settingsLogoFile, "images");
      }
      if (settingsQrCodeFile) {
        finalQrCodeUrl = await uploadFileToStorage(settingsQrCodeFile, "images");
      }
      if (settingsJaapAudioFile) {
        finalJaapAudioUrl = await uploadFileToStorage(settingsJaapAudioFile, "audio");
      }

      const updatedSettings = {
        ...settings,
        logoUrl: finalLogoUrl,
        qrCodeUrl: finalQrCodeUrl,
        jaapAudioUrl: finalJaapAudioUrl,
      };

      await setDoc(doc(db, "settings", "general"), updatedSettings);
      setSettings(updatedSettings);
      setSettingsLogoFile(null);
      setSettingsQrCodeFile(null);
      setSettingsJaapAudioFile(null);
      showToast("Settings saved successfully!");
    } catch (error: any) {
      if (error.message?.includes("Missing or insufficient permissions")) {
        showToast("सेटिंग्स सेव करने की अनुमति नहीं है। कृपया Firebase Console में Firestore Security Rules को अपडेट करें (allow write: if request.auth != null;).");
      } else {
        showToast("Failed to save settings.");
      }
    }
  };

  const approvePost = async (post: any) => {
    const isOnline = await checkIsOnline();
    if (!isOnline) {
      showToast("इंटरनेट कनेक्शन उपलब्ध नहीं है। कृपया अपना नेटवर्क जांचें और पुनः प्रयास करें।");
      return;
    }
    if (!db) {
      showToast("Firebase is not configured.");
      return;
    }
    try {
      // Add to appropriate collection based on type
      const collectionName = post.type === "शब्द" ? "shabads" :
                             post.type === "भजन" ? "bhajans" :
                             post.type === "आरती" ? "aartis" :
                             post.type === "मंत्र" ? "mantras" :
                             post.type === "साखी" ? "sakhis" : "approvedPosts";
                             
      await addDoc(collection(db, collectionName), {
        title: post.title,
        text: post.text,
        audioUrl: post.audioUrl || "",
        author: post.author || "अज्ञात भक्त",
        type: post.type || "भजन",
        createdAt: post.createdAt || new Date().toISOString(),
        userId: post.userId || "",
      });
      
      // Remove from pending
      await deleteDoc(doc(db, "pendingPosts", post.id));

      // Send Notification
      await addDoc(collection(db, "notifications"), {
        title: "नया योगदान स्वीकृत",
        message: `"${post.title}" को ऐप में जोड़ दिया गया है।`,
        date: "अभी",
        read: false,
      });
    } catch (error: any) {
      if (error.message?.includes("Missing or insufficient permissions")) {
        showToast("स्वीकृत करने की अनुमति नहीं है। कृपया Firebase Console में Firestore Security Rules को अपडेट करें (allow write: if request.auth != null;).");
      } else {
        showToast("स्वीकृत करने में त्रुटि हुई।");
      }
    }
  };

  const rejectPost = async (post: any) => {
    const isOnline = await checkIsOnline();
    if (!isOnline) {
      showToast("इंटरनेट कनेक्शन उपलब्ध नहीं है। कृपया अपना नेटवर्क जांचें और पुनः प्रयास करें।");
      return;
    }
    setConfirmDialog({
      isOpen: true,
      title: "अस्वीकार करें",
      message: "क्या आप वाकई इस पोस्ट को अस्वीकार (Reject) और डिलीट करना चाहते हैं? इससे जुड़ी सभी फाइलें भी डिलीट हो जाएंगी।",
      onConfirm: async () => {
        if (!db) {
          showToast("Firebase is not configured.");
          return;
        }
        try {
          if (storage) {
            if (post.audioUrl && post.audioUrl.includes("firebasestorage")) {
              try {
                const path = getPathFromURL(post.audioUrl);
                if (path) await deleteObject(ref(storage, path));
              } catch (e: any) {
                if (e.code !== 'storage/object-not-found') {
                  showToast("ऑडियो फाइल हटाने में त्रुटि हुई।");
                }
              }
            }
            if (post.photoUrl && post.photoUrl.includes("firebasestorage")) {
              try {
                const path = getPathFromURL(post.photoUrl);
                if (path) await deleteObject(ref(storage, path));
              } catch (e: any) {
                if (e.code !== 'storage/object-not-found') {
                  showToast("फोटो फाइल हटाने में त्रुटि हुई।");
                }
              }
            }
          }
          await deleteDoc(doc(db, "pendingPosts", post.id));
          showToast("पोस्ट और उससे जुड़ी फाइलें सफलतापूर्वक हटा दी गईं।");
        } catch (error: any) {
          if (error.message?.includes("Missing or insufficient permissions")) {
            showToast("अस्वीकृत करने की अनुमति नहीं है। कृपया Firebase Console में Firestore Security Rules को अपडेट करें (allow write: if request.auth != null;).");
          } else {
            showToast("अस्वीकृत करने में त्रुटि हुई।");
          }
        }
      }
    });
  };


  return (
    <div className="min-h-screen max-w-md mx-auto relative shadow-2xl bg-paper overflow-x-hidden flex flex-col">
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] bg-ink text-white px-5 py-2.5 rounded-full shadow-2xl text-[13px] font-medium flex items-center justify-center gap-2.5 whitespace-nowrap"
          >
            <img src="/logo.png" alt="Logo" className="w-5 h-5 rounded-full shadow-sm" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {currentScreen !== "admin" && currentScreen !== "admin_login" && (
        <Header
          onNavigate={navigateTo}
          logoUrl={settings.logoUrl}
          isAdminAuthenticated={isAdminAuthenticated}
          unreadCount={unreadCount}
          onNotificationClick={() => setShowNotifications(true)}
        />
      )}

      <div className="flex-1 relative">
        <AnimatePresence mode="wait">
          <Suspense fallback={<div className="flex-1 bg-paper flex items-center justify-center min-h-screen"><img src="/logo.png" alt="Loading" className="w-16 h-16 opacity-50 animate-pulse" /></div>}>
            <Routes location={location} key={location.pathname}>
            <Route path="/" element={<HomeScreen isLoading={isLoading} processedMeles={processedMeles} badhais={badhais} dailyThought={dailyThought} notices={notices} handleOpenCategory={handleOpenCategory} navigateTo={navigateTo} />} />
            <Route path="/search" element={<SearchScreen searchQuery={searchQuery} setSearchQuery={setSearchQuery} isLoading={isLoading} sabads={sabads} aartis={aartis} bhajans={bhajans} sakhis={sakhis} mantras={mantras} meles={meles} matchSearch={(title, text) => {
              if (!searchQuery) return false;
              const query = searchQuery.toLowerCase().trim();
              if (title.toLowerCase().includes(query)) return true;
              if (text && text.toLowerCase().includes(query)) return true;
              
              // If the user typed in Hindi/Devnagari, the standard .includes() above is perfectly accurate.
              // We skip skeleton searching for Devnagari completely to prevent severe false positives 
              // (e.g. "राम" -> "rm" -> matches "धर्म", "कर्म", "मर्म", etc.)
              const isDevnagari = /[\u0900-\u097F]/.test(searchQuery);
              
              if (!isDevnagari) {
                // Use transliterated search to keep vowel context intact.
                // This is much safer than pure skeleton and perfectly matches 'aaj' -> 'aj' inside longer strings
                const searchTransl = getTransliteratedSearch(searchQuery);
                if (searchTransl.length > 0) {
                  const titleTransl = getTransliteratedSearch(title);
                  if (titleTransl.includes(searchTransl)) return true;
                  
                  if (text) {
                    const textTransl = getTransliteratedSearch(text);
                    if (searchTransl.length <= 4) {
                      const words = textTransl.split(' ');
                      if (words.some(w => w === searchTransl)) return true;
                    } else {
                      if (textTransl.includes(searchTransl)) return true;
                    }
                  }
                }
                
                // Fallback to pure skeleton match ONLY for long queries to catch severe misspellings (like zameendar vs jamindar)
                if (query.length >= 4) {
                  const searchSkeleton = getSearchSkeleton(searchQuery);
                  if (searchSkeleton.length >= 3) {
                    const titleSkeleton = getSearchSkeleton(title);
                    if (titleSkeleton.includes(searchSkeleton)) return true;
                    
                    if (text) {
                      const textSkeleton = getSearchSkeleton(text);
                      if (searchSkeleton.length <= 4) {
                        const words = textSkeleton.split(' ');
                        if (words.some(w => w === searchSkeleton)) return true;
                      } else {
                        if (textSkeleton.includes(searchSkeleton)) return true;
                      }
                    }
                  }
                }
              }
              
              return false;
            }} handleSabadClick={handleSabadClick} setSelectedSabad={setSelectedSabad} setSelectedCategory={setSelectedCategory} setAutoPlayAudio={setAutoPlayAudio} navigateTo={navigateTo} />} />
            <Route path="/mala" element={<JaapMalaScreen malaCount={malaCount} malaLaps={malaLaps} onBack={() => navigateTo('home')} onJap={() => { vibrate(12); playOmVishnu(); if (malaCount + 1 >= 108) { vibrate([50, 30, 100, 30, 50]); setMalaCount(0); setMalaLaps(l => l + 1); } else { setMalaCount(c => c + 1); } }} onReset={() => { setConfirmDialog({ isOpen: true, title: "माला रीसेट", message: "क्या आप वाकई माला रीसेट करना चाहते हैं?", onConfirm: () => { setMalaCount(0); setMalaLaps(0); } }); }} />} />
            <Route path="/niyam" element={<NiyamScreen niyamList={niyamList} navigateTo={navigateTo} />} />
            <Route path="/shabad_list" element={<ShabadListScreen isLoading={isLoading} sabads={sabads} handleBack={handleBack} handleSabadClick={handleSabadClick} />} />
            <Route path="/category_list" element={<CategoryListScreen isLoading={isLoading} selectedCategory={selectedCategory} aartis={aartis} bhajans={bhajans} sakhis={sakhis} mantras={mantras} handleBack={handleBack} navigateTo={navigateTo} setSelectedSabad={setSelectedSabad} setPlayingSabad={setPlayingSabad} setAutoPlayAudio={setAutoPlayAudio} />} />
            <Route path="/community_posts" element={<CommunityPostsScreen isLoading={isLoading} recentApprovedPosts={recentApprovedPosts} myPendingPosts={myPendingPosts} handleBack={handleBack} navigateTo={navigateTo} setSelectedSabad={setSelectedSabad} setPlayingSabad={setPlayingSabad} setSelectedCategory={setSelectedCategory} setAutoPlayAudio={setAutoPlayAudio} />} />
            <Route path="/reading" element={<ReadingScreen currentScreen="reading" selectedSabad={selectedSabad} selectedCategory={selectedCategory} sabads={sabads} aartis={aartis} bhajans={bhajans} sakhis={sakhis} mantras={mantras} readingTheme={readingTheme} setReadingTheme={setReadingTheme} hasSeenSwipeHint={hasSeenSwipeHint} handleBack={handleBack} fontSize={fontSize} setFontSize={setFontSize} isAutoScrolling={isAutoScrolling} toggleAutoScroll={toggleAutoScroll} autoScrollSpeed={autoScrollSpeed} cycleAutoScrollSpeed={cycleAutoScrollSpeed} toggleBookmark={toggleBookmark} bookmarks={bookmarks} handleShare={handleShare} autoPlayAudio={autoPlayAudio} setAutoPlayAudio={setAutoPlayAudio} playingSabad={playingSabad} setPlayingSabad={setPlayingSabad} setIsAudioActive={setIsAudioActive} handleAudioEnded={handleAudioEnded} handleSwipe={handleSwipe} handleAudioSwipe={handleAudioSwipe} showToast={showToast} settings={settings} vibrate={vibrate} slideDir={slideDir} bindGestures={bindGestures} />} />
            <Route path="/audio_reading" element={<ReadingScreen currentScreen="audio_reading" selectedSabad={selectedSabad} selectedCategory={selectedCategory} sabads={sabads} aartis={aartis} bhajans={bhajans} sakhis={sakhis} mantras={mantras} readingTheme={readingTheme} setReadingTheme={setReadingTheme} hasSeenSwipeHint={hasSeenSwipeHint} handleBack={handleBack} fontSize={fontSize} setFontSize={setFontSize} isAutoScrolling={isAutoScrolling} toggleAutoScroll={toggleAutoScroll} autoScrollSpeed={autoScrollSpeed} cycleAutoScrollSpeed={cycleAutoScrollSpeed} toggleBookmark={toggleBookmark} bookmarks={bookmarks} handleShare={handleShare} autoPlayAudio={autoPlayAudio} setAutoPlayAudio={setAutoPlayAudio} playingSabad={playingSabad} setPlayingSabad={setPlayingSabad} setIsAudioActive={setIsAudioActive} handleAudioEnded={handleAudioEnded} handleSwipe={handleSwipe} handleAudioSwipe={handleAudioSwipe} showToast={showToast} settings={settings} vibrate={vibrate} slideDir={slideDir} bindGestures={bindGestures} />} />
            <Route path="/amavasya" element={<motion.div key="amavasya" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="bg-paper min-h-screen"><AmavasyaScreen amavasyaList={amavasyaList} selectedYear={selectedYear} setSelectedYear={setSelectedYear} handleBack={handleBack} /></motion.div>} />
            <Route path="/donate" element={<DonateScreen navigateTo={navigateTo} settings={settings} showToast={showToast} />} />
            <Route path="/about" element={<AboutScreen navigateTo={navigateTo} settings={settings} />} />
            <Route path="/privacy" element={<PrivacyScreen navigateTo={navigateTo} />} />
            <Route path="/contribute" element={<ContributeScreen handleBack={handleBack} contribAuthor={contribAuthor} setContribAuthor={setContribAuthor} contribTitle={contribTitle} setContribTitle={setContribTitle} contribType={contribType} setContribType={setContribType} contribAudio={contribAudio} setContribAudio={setContribAudio} contribAudioFile={contribAudioFile} setContribAudioFile={setContribAudioFile} contribAudioError={contribAudioError} setContribAudioError={setContribAudioError} contribText={contribText} setContribText={setContribText} captchaQuestion={captchaQuestion} captchaAnswer={captchaAnswer} setCaptchaAnswer={setCaptchaAnswer} contribError={contribError} isSubmitting={isSubmitting} uploadProgress={uploadProgress} handleContributeSubmit={handleContributeSubmit} handleFileSelect={handleFileSelect} />} />
            <Route path="/choghadiya" element={<ChoghadiyaScreen choghadiyaDate={choghadiyaDate} setChoghadiyaDate={setChoghadiyaDate} choghadiyaLocation={choghadiyaLocation} setChoghadiyaLocation={setChoghadiyaLocation} handleGetLocation={handleGetLocation} calculateChoghadiya={calculateChoghadiya} choghadiyaLoading={choghadiyaLoading} choghadiyaError={choghadiyaError} choghadiyaSlots={choghadiyaSlots} handleBack={() => navigateTo("home")} />} />
            <Route path="/bichhuda" element={<BichhudaScreen bichhudaMonth={bichhudaMonth} setBichhudaMonth={setBichhudaMonth} bichhudaYear={bichhudaYear} setBichhudaYear={setBichhudaYear} bichhudaList={bichhudaList} handleBack={() => navigateTo("home")} />} />
            <Route path="/mele" element={<MelesScreen isLoading={isLoading} meles={meles} processedMeles={processedMeles} navigateTo={navigateTo} />} />
            <Route path="/admin_login" element={<AdminLoginScreen isAdminLoggingIn={isAdminLoggingIn} adminLoginError={adminLoginError} adminPasswordInput={adminPasswordInput} auth={auth} setIsAdminLoggingIn={setIsAdminLoggingIn} setAdminLoginError={setAdminLoginError} setAdminPasswordInput={setAdminPasswordInput} setIsAdminAuthenticated={setIsAdminAuthenticated} navigateTo={navigateTo} />} />
            <Route path="/admin" element={<AdminScreen {...{
              navigateTo, isSubmitting, contribAudioError, contribPhotoError, showToast, checkIsOnline, db,
              setContribAudioError, setContribPhotoError, setIsSubmitting, contribTitle, contribType, contribAudio,
              contribText, contribAuthor, contribDate, contribLocation, contribPhotoUrl, setContribTitle, setContribType,
              setContribAudio, setContribText, setContribAuthor, setContribDate, setContribLocation, setContribPhotoUrl,
              addDoc, collection, serverTimestamp, setContribError, contribError, pendingContributions, setPendingContributions,
              doc, updateDoc, deleteDoc, setConfirmDialog, editModalOpen, setEditModalOpen, editAudioError, editPhotoError,
              setEditAudioError, setEditPhotoError, editContribution, setEditContribution, handleUpdateContribution, handleDeleteContribution, handleFileChange,
              contribAudioFile, uploadFileToStorage, contribPhotoFile, contribSequence, setContribSequence, setContribAudioFile, setContribPhotoFile, handleFileSelect, uploadProgress, sabads, openEditModal, handleDelete, aartis, bhajans, sakhis, mantras, thoughts, meles, notices, badhais, toggleNoticeStatus, toggleBadhaiStatus, settings, setSettings, setSettingsLogoFile, settingsLogoFile, setSettingsQrCodeFile, settingsQrCodeFile, setSettingsJaapAudioFile, settingsJaapAudioFile, handleSaveSettings, pendingPosts, approvePost, rejectPost, editItemData, handleEditSave, setEditItemData
            }} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </AnimatePresence>
      </div>

      {/* Notifications Panel */}
      <NotificationsPanel
        showNotifications={showNotifications}
        setShowNotifications={setShowNotifications}
        notifications={notifications}
        unreadCount={unreadCount}
        markAllRead={markAllRead}
        markRead={markRead}
      />

      {/* Fixed Bottom Section (Ad + Nav) */}
      {currentScreen !== "admin" && currentScreen !== "admin_login" && (
        <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto z-50 flex flex-col">
          {/* Mini Player */}
          <AnimatePresence>
            {isAudioActive && playingSabad?.audioUrl && !isMiniPlayerDismissed && (currentScreen !== "audio_reading" || playingSabad.id !== selectedSabad?.id) && (
              <div className={settings.isAdEnabled !== false ? "mb-0" : "mb-2"}>
                <AudioPlayer
                  key={playingSabad.id}
                  url={playingSabad.audioUrl}
                  title={playingSabad.title}
                  variant="mini"
                  playingSabad={playingSabad}
                  selectedSabad={selectedSabad}
                  preventAutoPause={true}
                  onClose={() => {
                    if (globalAudio) globalAudio.pause();
                    clearMediaSession();
                    setIsMiniPlayerDismissed(true);
                    setIsAudioActive(false);
                    setPlayingSabad(null);
                    setAutoPlayAudio(false);
                  }}
                  onClick={() => {
                    setSelectedSabad(playingSabad);
                    if (currentScreen !== "audio_reading") {
                      navigateTo("audio_reading");
                    }
                  }}
                  onNext={() => handleAudioSwipe("left")}
                  onPrev={() => handleAudioSwipe("right")}
                  onEnded={handleAudioEnded}
                  autoPlay={autoPlayAudio}
                  onPlay={() => setAutoPlayAudio(true)}
                  onPause={() => setAutoPlayAudio(false)}
                  logoUrl={settings.logoUrl}
                />
              </div>
            )}
          </AnimatePresence>

          {settings.isAdEnabled !== false && <AdBanner text={settings.adText} link={settings.adLink} />}
          <div className="bg-white/95 backdrop-blur-xl border-t border-ink/10 flex justify-around items-center py-1.5 px-1 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] pb-safe">
            <NavItem
              icon={<Home className="w-6 h-6" />}
              label="होम"
              isActive={currentScreen === "home"}
              onClick={() => navigateTo("home")}
            />
            <NavItem
              icon={<HeartHandshake className="w-6 h-6" />}
              label="सहयोग"
              isActive={currentScreen === "donate"}
              onClick={() => navigateTo("donate")}
            />
            <NavItem
              icon={<CalendarDays className="w-6 h-6" />}
              label="अमावस"
              isActive={currentScreen === "amavasya"}
              onClick={() => navigateTo("amavasya")}
            />
            <NavItem
              icon={<Info className="w-6 h-6" />}
              label="हमारे बारे में"
              isActive={currentScreen === "about"}
              onClick={() => navigateTo("about")}
            />
            <NavItem
              icon={<ShieldCheck className="w-6 h-6" />}
              label="गोपनीयता"
              isActive={currentScreen === "privacy"}
              onClick={() => navigateTo("privacy")}
            />
          </div>
        </div>
      )}

      {/* Custom Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!confirmDialog?.isOpen}
        title={confirmDialog?.title || ""}
        message={confirmDialog?.message || ""}
        onConfirm={confirmDialog?.onConfirm || (() => {})}
        onCancel={() => setConfirmDialog(null)}
        confirmText={confirmDialog?.confirmText}
        cancelText={confirmDialog?.cancelText}
        isAlert={confirmDialog?.isAlert}
      />

    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <MainApp />
    </ErrorBoundary>
  );
}
