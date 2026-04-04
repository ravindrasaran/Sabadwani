import ConfirmDialog from "./components/ConfirmDialog";
import AdminScreen from "./components/AdminScreen";
import AudioPlayer from "./components/AudioPlayer";
import PremiumHeader from "./components/PremiumHeader";
import Header from "./components/Header";
import AdBanner from "./components/AdBanner";
import AmavasyaScreen from "./components/AmavasyaScreen";
import NavItem from "./components/NavItem";
import PremiumBanner from "./components/PremiumBanner";
import CategoryCard from "./components/CategoryCard";
import ShabadCard from "./components/ShabadCard";
import { useWakeLock } from "./hooks/useWakeLock";
import { useSabadData } from "./hooks/useSabadData";
import { generateAmavasyaForYear, getBichhudaList, getJD, getTithiName, getSamvat } from "./lib/astro";
import { vibrate, checkIsOnline } from "./lib/utils";
import { ShabadSkeleton, PostSkeleton, BannerSkeleton, CategorySkeleton, MelaSkeleton } from "./components/Skeleton";
import { globalAudio, setupGlobalMediaSessionListener, updateMediaSessionState } from "./lib/audioGlobals";
import React, { useState, useEffect, useRef, useMemo, ReactNode } from "react";
import {
  Book,
  Home,
  Info,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  BookOpenText,
  Music,
  Play,
  Search,
  PlusCircle,
  Sun,
  ShieldCheck,
  HeartHandshake,
  Share2,
  UploadCloud,
  Upload,
  Bookmark,
  Users,
  KeyRound,
  X,
  MapPin,
  Loader2,
  Target,
  ListOrdered,
  RotateCcw,
  AlertTriangle,
  AlertCircle,
  Clock,
  User,
  Hand,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useGesture } from "@use-gesture/react";
import SunCalc from "suncalc";
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { AppUpdate } from '@capawesome/capacitor-app-update';
import { format, addDays } from "date-fns";
import { hi } from "date-fns/locale";
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { signInAnonymously, signInWithEmailAndPassword } from "firebase/auth";
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

  componentDidCatch() {
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen max-w-md mx-auto relative shadow-2xl bg-paper flex flex-col items-center justify-center p-6 text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
          <h1 className="text-2xl font-bold text-ink mb-2">कुछ गलत हो गया</h1>
          <p className="text-ink-light mb-6">क्षमा करें, ऐप में कोई तकनीकी समस्या आ गई है। कृपया ऐप को रीस्टार्ट करें।</p>
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

type Notification = {
  id: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
};

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

function MainApp() {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    setupGlobalMediaSessionListener();

    const performAppUpdate = async () => {
      if (Capacitor.isNativePlatform()) {
        try {
          const result = await AppUpdate.getAppUpdateInfo();
          if (result.updateAvailability === 2) { // UPDATE_AVAILABLE
            if (result.immediateUpdateAllowed) {
              await AppUpdate.performImmediateUpdate();
            } else if (result.flexibleUpdateAllowed) {
              await AppUpdate.startFlexibleUpdate();
            }
          }
        } catch (error) {
          console.error("App update check failed:", error);
        }
      }
    };
    performAppUpdate();
  }, []);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const historyIndex = useRef(
    typeof window !== 'undefined' && window.history.state && window.history.state.index !== undefined 
      ? window.history.state.index 
      : 0
  );

  const [currentScreen, setCurrentScreen] = useState<Screen>(() => {
    if (typeof window !== 'undefined' && window.history.state && window.history.state.screen) {
      return window.history.state.screen;
    }
    return "home";
  });

  useEffect(() => {
    if (!window.history.state) {
      window.history.replaceState({ screen: currentScreen, index: historyIndex.current }, "", `#${currentScreen}`);
    }

    const handlePopState = (event: PopStateEvent) => {
      if (event.state && event.state.screen) {
        setCurrentScreen(event.state.screen);
        historyIndex.current = event.state.index || 0;
      } else {
        setCurrentScreen("home");
        historyIndex.current = 0;
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);
  const [isAudioActive, setIsAudioActive] = useState(false);

  useEffect(() => {
    // Only destroy if explicitly needed, don't destroy on every state change
  }, []);

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      // Configure Status Bar
      StatusBar.setStyle({ style: Style.Light }).catch(() => {});
      StatusBar.setBackgroundColor({ color: '#f27d26' }).catch(() => {}); // Match theme color
      
      // Hide Splash Screen after app is ready
      SplashScreen.hide().catch(() => {});

      // Handle back button
      const backListener = CapacitorApp.addListener('backButton', () => {
        if (currentScreen === 'home') {
          CapacitorApp.exitApp();
        } else {
          window.history.back();
        }
      });

      return () => {
        backListener.then(l => l.remove());
      };
    }
  }, [currentScreen]);

  const [selectedSabad, setSelectedSabad] = useState<SabadItem | null>(null);
  const [isMiniPlayerDismissed, setIsMiniPlayerDismissed] = useState(false);
  const [fontSize, setFontSize] = useState(18);
  const [slideDir, setSlideDir] = useState(1);
  const [hasSeenSwipeHint, setHasSeenSwipeHint] = useState(() => {
    return localStorage.getItem("hasSeenSwipeHint") === "true";
  });

  useWakeLock(currentScreen, isAudioActive);

  useEffect(() => {
    setIsMiniPlayerDismissed(false);
  }, [selectedSabad]);

  const [selectedCategory, setSelectedCategory] = useState<"aarti" | "bhajan" | "sakhi" | "mantra">("aarti");

  // Save last read sabad when it changes
  useEffect(() => {
    if (selectedSabad && (currentScreen === "reading" || currentScreen === "audio_reading")) {
      localStorage.setItem("lastReadSabad", JSON.stringify({
        sabad: selectedSabad,
        screen: currentScreen,
        category: currentScreen === "audio_reading" ? selectedCategory : undefined
      }));
    }
  }, [selectedSabad, currentScreen, selectedCategory]);

  const handleOpenCategory = (targetScreen: "reading" | "audio_reading", listScreen: "shabad_list" | "category_list", category?: "aarti" | "bhajan" | "sakhi" | "mantra") => {
    vibrate(10);
    const savedLastRead = localStorage.getItem("lastReadSabad");
    if (savedLastRead) {
      try {
        const parsed = JSON.parse(savedLastRead);
        if (parsed && parsed.sabad && parsed.screen === targetScreen && (category ? parsed.category === category : true)) {
          setSelectedSabad(parsed.sabad);
          if (category) setSelectedCategory(category);
          setAutoPlayAudio(false);
          
          const nextIndex = historyIndex.current + 1;
          window.history.pushState({ screen: listScreen, index: nextIndex }, "", `#${listScreen}`);
          const finalIndex = nextIndex + 1;
          window.history.pushState({ screen: targetScreen, index: finalIndex }, "", `#${targetScreen}`);
          
          historyIndex.current = finalIndex;
          setCurrentScreen(targetScreen);
          return;
        }
      } catch (e) {
        // Ignore errors
      }
    }
    if (category) setSelectedCategory(category);
    navigateTo(listScreen);
  };

  const [bookmarks, setBookmarks] = useState<string[]>(() => {
    const saved = localStorage.getItem("shabad_bookmarks");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem("shabad_bookmarks", JSON.stringify(bookmarks));
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

  const [autoPlayAudio, setAutoPlayAudio] = useState(false);
  const [readingTheme, setReadingTheme] = useState<'light' | 'sepia' | 'dark'>('light');

  const { isLoading, sabads, aartis, bhajans, sakhis, mantras, thoughts, meles, notices, badhais, pendingPosts, settings, setSettings } = useSabadData();

  const recentApprovedPosts = useMemo(() => {
    const all = [
      ...sabads.map(s => ({ ...s, type: "शब्द" })),
      ...bhajans.map(s => ({ ...s, type: "भजन" })),
      ...aartis.map(s => ({ ...s, type: "आरती" })),
      ...mantras.map(s => ({ ...s, type: "मंत्र" })),
      ...sakhis.map(s => ({ ...s, type: "साखी" }))
    ];
    return all
      .filter(item => item.author && item.author !== "Admin")
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
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    if (!db) return;
    const unsubNotifications = onSnapshot(collection(db, "notifications"), (snapshot) => {
      let newNotifs: Notification[] = [];
      if (!snapshot.empty) {
        newNotifs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Notification));
      }
      
      const hasSeenWelcome = localStorage.getItem("hasSeenWelcome");
      if (!hasSeenWelcome) {
        newNotifs.unshift({
          id: "welcome",
          title: "स्वागत है!",
          message: "सबदवाणी ऐप में आपका स्वागत है। यहाँ आपको गुरु जम्भेश्वर भगवान की वाणी और बिश्नोई समाज की जानकारी मिलेगी।",
          date: "अभी",
          read: false
        });
      }

      setNotifications(prev => {
        const prevIds = new Set(prev.map(n => n.id));
        const added = newNotifs.filter(n => !prevIds.has(n.id) && n.id !== "welcome");
        if (added.length > 0 && prev.length > 0) {
          showToast(`नई सूचना: ${added[0].title}`);
        }
        return newNotifs;
      });
    });
    return () => unsubNotifications();
  }, []);

  const markRead = async (id: string) => {
    if (id === "welcome") {
      localStorage.setItem("hasSeenWelcome", "true");
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      return;
    }
    
    // Optimistic UI update
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    
    if (!db) return;
    try {
      // Let Firestore handle offline queue, don't await
      updateDoc(doc(db, "notifications", id), { read: true }).catch(() => {
      });
    } catch (e) {
    }
  };

  const markAllRead = async () => {
    localStorage.setItem("hasSeenWelcome", "true");
    
    const unread = notifications.filter(n => !n.read && n.id !== "welcome");
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    
    if (!db) return;
    try {
      unread.forEach(n => {
        updateDoc(doc(db, "notifications", n.id), { read: true }).catch(() => {
        });
      });
    } catch (error) {
    }
  };

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

  const playOmVishnu = () => {
    if (jaapAudioRef.current) {
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
  const [malaCount, setMalaCount] = useState(() => {
    const saved = localStorage.getItem("malaCount");
    return saved ? parseInt(saved) : 0;
  });
  const [malaLaps, setMalaLaps] = useState(() => {
    const saved = localStorage.getItem("malaLaps");
    return saved ? parseInt(saved) : 0;
  });

  useEffect(() => {
    localStorage.setItem("malaCount", malaCount.toString());
    localStorage.setItem("malaLaps", malaLaps.toString());
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
  const [confirmDialog, setConfirmDialog] = useState<{isOpen: boolean, title: string, message: string, onConfirm: () => void} | null>(null);

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
  const [choghadiyaDate, setChoghadiyaDate] = useState(
    new Date().toISOString().split("T")[0],
  );
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

  const handleGetLocation = () => {
    setChoghadiyaLoading(true);
    
    const fallbackToIP = async (originalError?: any) => {
      try {
        const res = await fetch("https://ipapi.co/json/");
        const data = await res.json();
        if (data.city) {
          const resolvedName = [data.city, data.region, data.country_name === "India" ? "" : data.country_name]
            .filter(Boolean)
            .join(", ");
          setChoghadiyaLocation(resolvedName);
          calculateChoghadiya(resolvedName, choghadiyaDate, { lat: data.latitude, lon: data.longitude });
          return;
        }
      } catch (e) {
        // ipapi.co fallback failed, trying ipinfo.io
        try {
          const res2 = await fetch("https://ipinfo.io/json");
          const data2 = await res2.json();
          if (data2.city) {
            const resolvedName = [data2.city, data2.region, data2.country === "IN" ? "" : data2.country]
              .filter(Boolean)
              .join(", ");
            setChoghadiyaLocation(resolvedName);
            const [lat, lon] = (data2.loc || "").split(",").map(Number);
            calculateChoghadiya(resolvedName, choghadiyaDate, lat && lon ? { lat, lon } : undefined);
            return;
          }
        } catch (e2) {
          // ipinfo.io fallback failed
        }
      }

      if (originalError && originalError.code === originalError.PERMISSION_DENIED) {
        setChoghadiyaError("लोकेशन की अनुमति नहीं मिली। कृपया सेटिंग्स में जाकर अनुमति दें या शहर का नाम लिखें।");
      } else {
        setChoghadiyaError("लोकेशन प्राप्त करने में त्रुटि। कृपया शहर का नाम लिखें।");
      }
      setChoghadiyaLoading(false);
    };

    if (!navigator.geolocation) {
      fallbackToIP();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
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
        } catch (error) {
          fallbackToIP(error);
        }
      },
      (error) => {
        fallbackToIP(error);
      },
      { timeout: 10000, maximumAge: 60000 }
    );
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

      const targetDate = new Date(dateStr);
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
        isUpcoming: diffDays >= 0 && diffDays <= 30,
        upcoming: diffDays >= 0 && diffDays <= 30, // Keep both for compatibility
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

  // Scroll to upcoming mela when mele screen is opened
  useEffect(() => {
    if (currentScreen === "mele") {
      const timer = setTimeout(() => {
        const cards = document.querySelectorAll('.mela-card');
        const targetIdx = processedMeles.findIndex((m: any) => m.upcoming);
        if (targetIdx !== -1 && cards[targetIdx]) {
          cards[targetIdx].scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [currentScreen, processedMeles]);

  // --- Swipe Gesture Logic ---
  const handleSwipe = (direction: "left" | "right") => {
    try {
      vibrate(10);
      if (!hasSeenSwipeHint) {
        setHasSeenSwipeHint(true);
        localStorage.setItem("hasSeenSwipeHint", "true");
      }

      if (!selectedSabad) return;

      let currentList: SabadItem[] = [];
      if (currentScreen === "reading") currentList = sabads;
      else if (currentScreen === "audio_reading") {
        if (selectedCategory === "aarti") currentList = aartis;
        else if (selectedCategory === "bhajan") currentList = bhajans;
        else if (selectedCategory === "sakhi") currentList = sakhis;
        else if (selectedCategory === "mantra") currentList = mantras;
      }
      else if (currentScreen === "community_posts") currentList = recentApprovedPosts;

      let currentIndex = currentList.findIndex(
        (item) => item.id === selectedSabad.id,
      );

      if (currentIndex === -1 && selectedSabad) {
        if (selectedSabad.type === "शब्द") currentList = sabads;
        else if (selectedSabad.type === "आरती" || selectedCategory === "aarti") currentList = aartis;
        else if (selectedSabad.type === "भजन" || selectedCategory === "bhajan") currentList = bhajans;
        else if (selectedSabad.type === "साखी" || selectedCategory === "sakhi") currentList = sakhis;
        else if (selectedSabad.type === "मंत्र" || selectedCategory === "mantra") currentList = mantras;
        
        currentIndex = currentList.findIndex(
          (item) => item.id === selectedSabad.id,
        );
      }

      if (currentIndex === -1) return;

      if (direction === "left" && currentIndex < currentList.length - 1) {
        setSlideDir(1);
        setSelectedSabad(currentList[currentIndex + 1]);
      } else if (direction === "right" && currentIndex > 0) {
        setSlideDir(-1);
        setSelectedSabad(currentList[currentIndex - 1]);
      }
    } catch (err) {
    }
  };

  const handleAudioEnded = () => {
    setAutoPlayAudio(true);
    handleSwipe("left");
  };

  const bindGestures = useGesture(
    {
      onDrag: ({ swipe: [swipeX] }) => {
        if (swipeX === -1) handleSwipe("left"); // Swiped left
        if (swipeX === 1) handleSwipe("right"); // Swiped right
      },
      onPinch: ({ delta: [d] }) => {
        setFontSize((s) => {
          const next = s + d / 5;
          return Math.min(Math.max(next, 12), 40);
        });
      },
    },
    {
      drag: { axis: 'x', filterTaps: true, swipe: { distance: 50 } },
      pinch: { eventOptions: { passive: false } },
    },
  );

  useEffect(() => {
    setAmavasyaList(generateAmavasyaForYear(selectedYear));
  }, [selectedYear]);

  const navigateTo = (screen: Screen, replace = false) => {
    vibrate(10);
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (screen === "amavasya") {
      setSelectedYear(new Date().getFullYear());
    }
    
    if (replace) {
      window.history.replaceState({ screen, index: historyIndex.current }, "", `#${screen}`);
    } else if (currentScreen !== screen) {
      const newIndex = historyIndex.current + 1;
      window.history.pushState({ screen, index: newIndex }, "", `#${screen}`);
      historyIndex.current = newIndex;
    }
    
    setCurrentScreen(screen);
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
          if (pathParts.includes('shabad')) {
            const idx = pathParts.indexOf('shabad');
            shabadId = pathParts[idx + 1];
          } else if (pathParts.length > 0) {
            shabadId = pathParts[pathParts.length - 1];
          }
          
          if (!shabadId || shabadId === 'shabad') {
            const params = new URLSearchParams(url.search);
            shabadId = params.get('id') || params.get('shabad') || shabadId;
          }
        }
        
        if (shabadId && shabadId !== 'shabad') {
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
      if (pathParts.includes('shabad')) {
        const idx = pathParts.indexOf('shabad');
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
      const allSabads = [...sabads, ...aartis, ...bhajans, ...sakhis, ...mantras];
      const shabad = allSabads.find(item => item.id === pendingDeepLinkId);
      
      if (shabad) {
        handleSabadClick(shabad);
        setPendingDeepLinkId(null);
      } else {
        const otherItems = [...meles, ...notices];
        const otherItem = otherItems.find(item => item.id === pendingDeepLinkId);
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
    setIsAudioActive(false);
    setIsMiniPlayerDismissed(false);
    setAutoPlayAudio(false);
    
    if (shabad.audioUrl) {
      navigateTo("audio_reading");
    } else {
      navigateTo("reading");
    }
  };

  const [backPressCount, setBackPressCount] = useState(0);

  useEffect(() => {
    const handleBackButton = async () => {
      if (currentScreen === "home") {
        if (backPressCount > 0) {
          CapacitorApp.exitApp();
        } else {
          showToast("बाहर निकलने के लिए फिर से दबाएं");
          setBackPressCount(1);
          setTimeout(() => setBackPressCount(0), 2000);
        }
      } else {
        handleBack();
      }
    };

    const backListener = CapacitorApp.addListener('backButton', handleBackButton);
    return () => {
      backListener.then(listener => listener.remove());
    };
  }, [currentScreen, backPressCount]);

  const handleBack = () => {
    vibrate(8);
    if (historyIndex.current > 0) {
      window.history.back();
    } else {
      let prevScreen: Screen = "home";
      if (currentScreen === "reading") prevScreen = "shabad_list";
      else if (currentScreen === "audio_reading") prevScreen = "category_list";
      else if (currentScreen === "shabad_list" || currentScreen === "category_list") prevScreen = "home";
      
      navigateTo(prevScreen, true);
    }
  };

  const handleShare = async () => {
    vibrate(10);
    const playStoreLink = "https://play.google.com/store/apps/details?id=com.ravindrasaran.sabadwani";
    const contentType = selectedSabad?.type;
    const action = (contentType && (contentType.includes("भजन") || contentType.includes("आरती"))) ? "सुनें" : "पढ़ें";
    
    const introLine = contentType 
      ? `सबदवाणी ऐप से यह ${contentType} ${action}:` 
      : `सबदवाणी ऐप से यह ${action}:`;
    
    const shareText = `${introLine}\n\n${selectedSabad?.title || "सबदवाणी"}\n\n${(selectedSabad?.text || "").substring(0, 200)}...\n\nऐप डाउनलोड करें एवं ${action}: ${playStoreLink}`;
    
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

  const renderScreen = () => {
    switch (currentScreen) {
      case "home":
        return (
          <motion.div
            key="home"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="min-h-screen pb-32 flex flex-col bg-paper"
          >
            {/* Premium Rotating Banner System */}
            <div className="shrink-0">
              {isLoading ? (
                <BannerSkeleton />
              ) : (
                <PremiumBanner 
                  meles={processedMeles} 
                  badhais={badhais} 
                  dailyThought={dailyThought} 
                  notices={notices}
                />
              )}
            </div>

            {/* Premium Daily Panchang Summary */}
            <div className="px-4 mb-1.5 shrink-0">
              <div className="bg-white/80 backdrop-blur-md rounded-2xl p-2 border border-ink/5 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="bg-accent/10 p-1.5 rounded-xl">
                    <Sun className="w-4 h-4 text-accent-dark animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-[10px] font-black text-accent-dark uppercase tracking-widest mb-0.5">आज का पंचांग</h4>
                    <p className="text-[13px] font-bold text-ink">
                      {format(new Date(), "dd MMMM, EEEE", { locale: hi })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[12px] font-black text-accent-dark">
                    {getTithiName(getJD(new Date(new Date().setHours(6, 0, 0, 0))))}
                  </p>
                  <p className="text-[10px] font-bold text-ink-light uppercase mt-0.5">
                    विक्रमी संवत {getSamvat(getJD(new Date(new Date().setHours(6, 0, 0, 0))))}
                  </p>
                </div>
              </div>
            </div>

            {/* Premium Grid Layout for Main Categories - Compact 3-Column Design */}
            <div className="grid grid-cols-3 gap-1 px-4 mt-0.5 flex-1 overflow-y-auto pb-4 hide-scrollbar">
              {isLoading ? (
                [...Array(12)].map((_, i) => <CategorySkeleton key={i} />)
              ) : (
                <>
                  {/* 1. Sabadwani */}
                  <CategoryCard
                    onClick={() => handleOpenCategory("reading", "shabad_list")}
                    icon={Book}
                    titleLine1="संपूर्ण"
                    titleLine2="सबदवाणी"
                  />

                  {/* 2. Amavasya */}
                  <CategoryCard
                    onClick={() => navigateTo("amavasya")}
                    icon={CalendarDays}
                    titleLine1="अमावस्या"
                    titleLine2="दर्शन"
                  />

                  {/* 3. Aarti */}
                  <CategoryCard
                    onClick={() => handleOpenCategory("audio_reading", "category_list", "aarti")}
                    icon={Music}
                    titleLine1="आरती"
                    titleLine2="संग्रह"
                  />

                  {/* 4. Bhajan */}
                  <CategoryCard
                    onClick={() => handleOpenCategory("audio_reading", "category_list", "bhajan")}
                    icon={Music}
                    titleLine1="भजन"
                    titleLine2="संग्रह"
                  />

                  {/* 5. Sakhi */}
                  <CategoryCard
                    onClick={() => handleOpenCategory("audio_reading", "category_list", "sakhi")}
                    icon={BookOpenText}
                    titleLine1="साखी"
                    titleLine2="संग्रह"
                  />

                  {/* 6. Mantra */}
                  <CategoryCard
                    onClick={() => handleOpenCategory("audio_reading", "category_list", "mantra")}
                    icon={Music}
                    titleLine1="गुरु"
                    titleLine2="मंत्र"
                  />

                  {/* 7. Jap Mala */}
                  <CategoryCard
                    onClick={() => navigateTo("mala")}
                    icon={Target}
                    titleLine1="जाप"
                    titleLine2="माला"
                  />

                  {/* 8. Mele */}
                  <CategoryCard
                    onClick={() => navigateTo("mele")}
                    icon={Users}
                    titleLine1="प्रमुख"
                    titleLine2="मेले"
                  />

                  {/* 9. 29 Niyam */}
                  <CategoryCard
                    onClick={() => navigateTo("niyam")}
                    icon={ListOrdered}
                    titleLine1="२९"
                    titleLine2="नियम"
                  />

                  {/* 10. Choghadiya */}
                  <CategoryCard
                    onClick={() => navigateTo("choghadiya")}
                    icon={Sun}
                    titleLine1="चौघड़िया"
                    titleLine2="मुहूर्त"
                  />

                  {/* 11. Bichhuda */}
                  <CategoryCard
                    onClick={() => navigateTo("bichhuda")}
                    icon={Book}
                    titleLine1="बिछुड़ा (विदर)"
                    titleLine2=""
                  />

                  {/* 12. Community */}
                  <CategoryCard
                    onClick={() => navigateTo("community_posts")}
                    icon={HeartHandshake}
                    titleLine1="भक्त"
                    titleLine2="योगदान"
                  />
                </>
              )}
            </div>
          </motion.div>
        );

      case "search":
        const filteredSabads = searchQuery ? sabads.filter(s => s.title.toLowerCase().includes(searchQuery.toLowerCase()) || (s.text && s.text.toLowerCase().includes(searchQuery.toLowerCase()))) : [];
        const filteredAartis = searchQuery ? aartis.filter(m => m.title.toLowerCase().includes(searchQuery.toLowerCase()) || (m.text && m.text.toLowerCase().includes(searchQuery.toLowerCase()))) : [];
        const filteredBhajans = searchQuery ? bhajans.filter(m => m.title.toLowerCase().includes(searchQuery.toLowerCase()) || (m.text && m.text.toLowerCase().includes(searchQuery.toLowerCase()))) : [];
        const filteredSakhis = searchQuery ? sakhis.filter(m => m.title.toLowerCase().includes(searchQuery.toLowerCase()) || (m.text && m.text.toLowerCase().includes(searchQuery.toLowerCase()))) : [];
        const filteredMantras = searchQuery ? mantras.filter(m => m.title.toLowerCase().includes(searchQuery.toLowerCase()) || (m.text && m.text.toLowerCase().includes(searchQuery.toLowerCase()))) : [];
        const filteredMeles = searchQuery ? meles.filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()) || m.location.toLowerCase().includes(searchQuery.toLowerCase())) : [];
        
        return (
          <motion.div key="search" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pb-32 bg-paper min-h-screen">
            <PremiumHeader title="खोजें (Search)" onBack={() => navigateTo('home')} icon={Search} />
            <div className="px-6 pt-4">
              <div className="relative mb-4">
                <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-ink-light" />
                <input 
                  autoFocus
                  type="text" 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="शब्द, भजन, आरती, साखी या मेले खोजें..." 
                  className="w-full pl-12 pr-4 py-3 rounded-2xl border border-ink/20 bg-white focus:border-accent outline-none shadow-sm"
                />
              </div>

            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => <ShabadSkeleton key={i} />)}
              </div>
            ) : searchQuery && (
              <div className="space-y-6">
                {filteredSabads.length > 0 && (
                  <div>
                    <h3 className="font-bold text-lg mb-3 text-accent-dark">सबदवाणी ({filteredSabads.length})</h3>
                    <div className="space-y-3">
                      {filteredSabads.map(s => (
                        <button key={s.id} onClick={() => handleSabadClick(s)} className="w-full text-left bg-white p-4 rounded-2xl shadow-sm border border-ink/5">
                          <h4 className="font-bold text-ink">{s.title}</h4>
                          <p className="text-sm text-ink-light line-clamp-1 mt-1 break-words">{s.text}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {filteredAartis.length > 0 && (
                  <div>
                    <h3 className="font-bold text-lg mb-3 text-accent-dark">आरती ({filteredAartis.length})</h3>
                    <div className="space-y-3">
                      {filteredAartis.map(m => (
                        <button key={m.id} onClick={() => { setSelectedSabad(m); setSelectedCategory("aarti"); setAutoPlayAudio(false); navigateTo('audio_reading'); }} className="w-full text-left bg-white p-4 rounded-2xl shadow-sm border border-ink/5">
                          <h4 className="font-bold text-ink">{m.title}</h4>
                          <p className="text-sm text-ink-light line-clamp-1 mt-1 break-words">{m.text}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {filteredBhajans.length > 0 && (
                  <div>
                    <h3 className="font-bold text-lg mb-3 text-accent-dark">भजन ({filteredBhajans.length})</h3>
                    <div className="space-y-3">
                      {filteredBhajans.map(m => (
                        <button key={m.id} onClick={() => { setSelectedSabad(m); setSelectedCategory("bhajan"); setAutoPlayAudio(false); navigateTo('audio_reading'); }} className="w-full text-left bg-white p-4 rounded-2xl shadow-sm border border-ink/5">
                          <h4 className="font-bold text-ink">{m.title}</h4>
                          <p className="text-sm text-ink-light line-clamp-1 mt-1 break-words">{m.text}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {filteredSakhis.length > 0 && (
                  <div>
                    <h3 className="font-bold text-lg mb-3 text-accent-dark">साखी ({filteredSakhis.length})</h3>
                    <div className="space-y-3">
                      {filteredSakhis.map(m => (
                        <button key={m.id} onClick={() => { setSelectedSabad(m); setSelectedCategory("sakhi"); setAutoPlayAudio(false); navigateTo('audio_reading'); }} className="w-full text-left bg-white p-4 rounded-2xl shadow-sm border border-ink/5">
                          <h4 className="font-bold text-ink">{m.title}</h4>
                          <p className="text-sm text-ink-light line-clamp-1 mt-1 break-words">{m.text}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {filteredMantras.length > 0 && (
                  <div>
                    <h3 className="font-bold text-lg mb-3 text-accent-dark">मंत्र ({filteredMantras.length})</h3>
                    <div className="space-y-3">
                      {filteredMantras.map(m => (
                        <button key={m.id} onClick={() => { setSelectedSabad(m); setSelectedCategory("mantra"); setAutoPlayAudio(false); navigateTo('audio_reading'); }} className="w-full text-left bg-white p-4 rounded-2xl shadow-sm border border-ink/5">
                          <h4 className="font-bold text-ink">{m.title}</h4>
                          <p className="text-sm text-ink-light line-clamp-1 mt-1 break-words">{m.text}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {filteredMeles.length > 0 && (
                  <div>
                    <h3 className="font-bold text-lg mb-3 text-accent-dark">मेले ({filteredMeles.length})</h3>
                    <div className="space-y-3">
                      {filteredMeles.map((m) => (
                        <div key={m.id} className="bg-white p-4 rounded-2xl shadow-sm border border-ink/5">
                          <h4 className="font-bold text-ink">{m.name}</h4>
                          <p className="text-sm text-ink-light mt-1">{m.location} • {m.dateStr}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {filteredSabads.length === 0 && filteredAartis.length === 0 && filteredBhajans.length === 0 && filteredSakhis.length === 0 && filteredMantras.length === 0 && filteredMeles.length === 0 && (
                  <div className="text-center py-12 text-ink-light">
                    <Search className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>कोई परिणाम नहीं मिला</p>
                  </div>
                )}
              </div>
            )}
            </div>
          </motion.div>
        );

      case "mala":
        return (
          <motion.div
            key="mala"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: "circOut" }}
            style={{ willChange: "transform, opacity", transform: "translateZ(0)" }}
            className="pb-32 min-h-screen flex flex-col bg-paper"
          >
            <PremiumHeader title="डिजिटल जाप माला" onBack={() => navigateTo('home')} icon={Target} />
            
            <div className="flex-1 flex flex-col items-center justify-center relative px-4 mt-8">
              <div className="text-7xl font-heading text-accent mb-4 drop-shadow-sm z-10 flex items-center justify-center w-36 h-36 bg-white/50 rounded-full shadow-inner border border-ink/10">{malaCount}</div>
              <div className="text-sm font-bold text-ink-light mb-12 bg-white/50 px-5 py-1.5 rounded-full border border-ink/10 z-10 mt-2">
                माला पूर्ण: <span className="text-accent-dark">{malaLaps}</span>
              </div>
              
              <div className="relative flex items-center justify-center scale-90 sm:scale-100 mt-4 mb-8">
                {/* Decorative background rings */}
                <div className="absolute flex items-center justify-center pointer-events-none opacity-5">
                  <div className="w-64 h-64 rounded-full border-[15px] border-ink"></div>
                  <div className="absolute w-80 h-80 rounded-full border-[2px] border-ink border-dashed"></div>
                </div>

                <button 
                  onClick={() => {
                    vibrate(12);
                    playOmVishnu();
                    if (malaCount + 1 >= 108) {
                      vibrate([50, 30, 100, 30, 50]);
                      setMalaCount(0);
                      setMalaLaps(l => l + 1);
                    } else {
                      setMalaCount(c => c + 1);
                    }
                  }}
                  className="relative w-56 h-56 rounded-full bg-gradient-to-br from-accent to-accent-dark text-white shadow-2xl flex items-center justify-center active:scale-95 transition-all border-[10px] border-white/30 group z-10"
                >
                  <div className="absolute inset-0 rounded-full bg-white/20 opacity-0 group-active:opacity-100 transition-opacity"></div>
                  <span className="text-3xl font-bold font-heading tracking-wider">जाप करें</span>
                </button>
              </div>
              
              <button 
                onClick={() => { 
                  setConfirmDialog({
                    isOpen: true,
                    title: "माला रीसेट",
                    message: "क्या आप वाकई माला रीसेट करना चाहते हैं?",
                    onConfirm: () => {
                      setMalaCount(0); 
                      setMalaLaps(0); 
                    }
                  });
                }} 
                className="mt-12 flex items-center gap-2 text-ink-light hover:text-ink transition-colors bg-white/50 px-5 py-3 rounded-xl z-10 text-base font-bold"
              >
                <RotateCcw className="w-5 h-5" /> रीसेट करें
              </button>
            </div>
          </motion.div>
        );

      case "niyam":
        return (
          <motion.div
            key="niyam"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: "circOut" }}
            style={{ willChange: "transform, opacity", transform: "translateZ(0)" }}
            className="pb-32 bg-paper min-h-screen"
          >
            <PremiumHeader title="२९ नियम" onBack={() => navigateTo('home')} icon={ListOrdered} />
            
            <div className="px-4 pt-6">
              <div className="bg-white/90 p-6 rounded-3xl shadow-sm border border-ink/10 mb-6 text-center">
                <p className="text-ink leading-relaxed font-medium">
                  बिश्नोई समाज की स्थापना गुरु जम्भेश्वर भगवान ने इन्हीं 29 नियमों के आधार पर की थी। 
                  "बीस और नौ बिश्नोई" - जो इन 29 नियमों का पालन करता है, वही बिश्नोई है।
                </p>
              </div>

              <div className="space-y-3">
                {niyamList.map((niyam, idx) => (
                  <div key={`niyam-${idx}`} className="flex items-start gap-4 bg-white p-4 rounded-2xl shadow-sm border border-ink/5 hover:border-accent/30 transition-colors">
                    <div className="w-8 h-8 shrink-0 rounded-full bg-accent/10 text-accent font-bold flex items-center justify-center text-sm">
                      {idx + 1}
                    </div>
                    <p className="text-ink font-medium pt-1 leading-relaxed">{niyam}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        );

      case "shabad_list":
        return (
          <motion.div
            key="shabad_list"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: "circOut" }}
            style={{ willChange: "transform, opacity", transform: "translateZ(0)" }}
            className="pb-32 bg-paper min-h-screen"
          >
            <PremiumHeader title="संपूर्ण सबदवाणी" onBack={handleBack} icon={Book} />
            <div className="flex flex-col p-2 mt-2">
              {isLoading ? (
                [...Array(8)].map((_, i) => <ShabadSkeleton key={i} />)
              ) : (
                sabads.map((item) => (
                  <ShabadCard
                    key={item.id}
                    title={item.title}
                    icon={item.icon}
                    onClick={() => handleSabadClick(item)}
                    iconType="book"
                  />
                ))
              )}
            </div>
          </motion.div>
        );

      case "category_list":
        const categoryData = {
          aarti: { title: "आरती", list: aartis, icon: Music },
          bhajan: { title: "भजन", list: bhajans, icon: Music },
          sakhi: { title: "साखी", list: sakhis, icon: BookOpenText },
          mantra: { title: "मंत्र", list: mantras, icon: Music },
        }[selectedCategory];

        return (
          <motion.div
            key="category_list"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: "circOut" }}
            style={{ willChange: "transform, opacity", transform: "translateZ(0)" }}
            className="pb-32 bg-paper min-h-screen"
          >
            <PremiumHeader title={`${categoryData.title} संग्रह`} onBack={handleBack} icon={categoryData.icon} />
            <div className="flex flex-col p-2 mt-2">
              {isLoading ? (
                [...Array(6)].map((_, i) => <ShabadSkeleton key={i} />)
              ) : (
                categoryData.list.map((item) => (
                  <ShabadCard
                    key={item.id}
                    title={item.title}
                    icon={Play}
                    onClick={() => {
                      setSelectedSabad(item);
                      setAutoPlayAudio(false);
                      navigateTo("audio_reading");
                    }}
                    iconType="play"
                  />
                ))
              )}
            </div>
          </motion.div>
        );

      case "community_posts":
        return (
          <motion.div
            key="community_posts"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="pb-32 bg-paper min-h-screen"
          >
            <PremiumHeader title="भक्त योगदान" onBack={handleBack} icon={HeartHandshake} />
            <div className="flex flex-col p-4 gap-4">
              <div className="bg-white/50 backdrop-blur-sm p-5 rounded-[2rem] border border-accent/10 mb-2 shadow-sm flex gap-4 items-center">
                <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                  <Info className="w-5 h-5 text-accent-dark" />
                </div>
                <p className="text-xs text-ink-light leading-relaxed font-medium">
                  यहाँ सबदवाणी परिवार के सज्जनों द्वारा भेजे गए नवीनतम 10 योगदान दिखाए जा रहे हैं। आप भी अपना योगदान भेज सकते हैं।
                </p>
              </div>

              {isLoading ? (
                <div className="flex flex-col gap-5">
                  {[...Array(3)].map((_, i) => <PostSkeleton key={i} />)}
                </div>
              ) : recentApprovedPosts.length === 0 && myPendingPosts.length === 0 ? (
                <div className="text-center text-ink-light mt-10">
                  <Users className="w-16 h-16 mx-auto opacity-20 mb-4" />
                  <p className="text-xl">अभी तक कोई योगदान नहीं है।</p>
                  <button
                    onClick={() => navigateTo("contribute")}
                    className="mt-4 text-accent font-bold underline"
                  >
                    पहला योगदान दें
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-5">
                  {/* User's own contribution prompt if they haven't sent anything */}
                  {!recentApprovedPosts.some(p => p.userId === auth?.currentUser?.uid) && myPendingPosts.length === 0 && (
                    <button
                      onClick={() => navigateTo("contribute")}
                      className="bg-accent/5 p-6 rounded-[2rem] border border-dashed border-accent/30 flex items-center justify-between group hover:bg-accent/10 transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                          <PlusCircle className="w-6 h-6 text-accent-dark" />
                        </div>
                        <div className="text-left">
                          <h4 className="font-bold text-ink">अपना योगदान भेजें</h4>
                          <p className="text-[10px] text-ink-light">सबदवाणी परिवार में अपना योगदान जोड़ें</p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-accent-dark group-hover:translate-x-1 transition-transform" />
                    </button>
                  )}

                  {/* Pending Section */}
                  {myPendingPosts.length > 0 && (
                    <div className="flex flex-col gap-3">
                      <h4 className="text-xs font-bold text-accent-dark uppercase tracking-widest ml-2">मेरे लंबित योगदान</h4>
                      {myPendingPosts.map((item) => (
                        <div
                          key={item.id}
                          className="bg-white/40 rounded-[2rem] p-6 shadow-sm border border-dashed border-accent/30 relative overflow-hidden"
                        >
                          <div className="absolute top-0 right-0 bg-accent/10 px-4 py-1.5 rounded-bl-2xl text-[10px] font-bold text-accent uppercase tracking-wider">
                            समीक्षाधीन
                          </div>
                          <h3 className="text-lg font-bold text-ink mb-2">
                            {item.title}
                          </h3>
                          <div className="flex items-center gap-3 text-ink-light text-xs mb-4">
                            <span className="bg-accent/5 text-accent-dark px-2.5 py-1 rounded-full font-bold">{item.type}</span>
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(item.timestamp).toLocaleDateString('hi-IN')}</span>
                          </div>
                          <p className="text-ink-light text-sm line-clamp-2 italic">
                            "{item.text}"
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Recent Feed */}
                  <div className="flex flex-col gap-5">
                    {recentApprovedPosts.map((item) => (
                      <div
                        key={item.id}
                        className={`group bg-white rounded-[2rem] p-6 shadow-sm border ${auth?.currentUser?.uid === item.userId ? "border-accent/50 ring-1 ring-accent/20" : "border-ink/5"} hover:shadow-xl hover:shadow-accent/5 transition-all duration-500 relative overflow-hidden`}
                      >
                        <div className="absolute -right-4 -top-4 w-24 h-24 bg-accent/5 rounded-full blur-2xl group-hover:bg-accent/10 transition-colors"></div>
                        
                        <div className="flex flex-col mb-4">
                          <h3 className="text-xl font-bold text-ink group-hover:text-accent-dark transition-colors leading-tight">
                            {item.title}
                          </h3>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="bg-accent/10 text-accent-dark text-[10px] font-bold px-2.5 py-0.5 rounded-md uppercase tracking-wider">
                              {item.type}
                            </span>
                            {auth?.currentUser?.uid === item.userId && (
                              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100 uppercase tracking-wider">आपका योगदान</span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5 text-ink-light text-sm mb-6">
                          <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center border border-accent/5">
                            <User className="w-4 h-4 text-accent-dark" />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-ink/90 text-xs leading-none mb-0.5">{item.author}</span>
                            <span className="text-[10px] opacity-60">सबदवाणी परिवार</span>
                          </div>
                        </div>

                        <div className="relative mb-6 pl-4 border-l-2 border-accent/20">
                          <p className="text-ink-light text-sm line-clamp-3 leading-relaxed">
                            {item.text}
                          </p>
                        </div>

                        <button
                          onClick={() => {
                            setSelectedSabad(item);
                            if (item.type === "शब्द") {
                              navigateTo("reading");
                            } else {
                              if (item.type === "भजन") setSelectedCategory("bhajan");
                              else if (item.type === "आरती") setSelectedCategory("aarti");
                              else if (item.type === "मंत्र") setSelectedCategory("mantra");
                              else if (item.type === "साखी") setSelectedCategory("sakhi");
                              setAutoPlayAudio(false);
                              navigateTo("audio_reading");
                            }
                          }}
                          className="w-full py-4 bg-ink/5 hover:bg-accent hover:text-white active:bg-accent-dark active:scale-[0.98] text-ink font-bold rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 group/btn"
                        >
                          पूरा पढ़ें <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        );

      case "reading":
      case "audio_reading": {
        let readingList: SabadItem[] = [];
        if (currentScreen === "reading") readingList = sabads;
        else if (currentScreen === "audio_reading") {
          if (selectedCategory === "aarti") readingList = aartis;
          else if (selectedCategory === "bhajan") readingList = bhajans;
          else if (selectedCategory === "sakhi") readingList = sakhis;
          else if (selectedCategory === "mantra") readingList = mantras;
        }
        const readingIndex = selectedSabad ? readingList.findIndex(item => item.id === selectedSabad.id) : -1;
        const totalCount = readingList.length;
        const categoryLabel = currentScreen === "reading" ? "शब्द" : selectedCategory === "aarti" ? "आरती" : selectedCategory === "bhajan" ? "भजन" : selectedCategory === "sakhi" ? "साखी" : selectedCategory === "mantra" ? "मंत्र" : "शब्द";
        const isFeminine = (currentScreen === "audio_reading" && (selectedCategory === "aarti" || selectedCategory === "sakhi"));
        const nextWord = isFeminine ? "अगली" : "अगला";

        return (
          <motion.div
            key={currentScreen}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className={`min-h-screen flex flex-col pb-32 relative transition-colors duration-300 ${
              readingTheme === 'dark' ? 'bg-[#121212] text-white' : 
              readingTheme === 'sepia' ? 'bg-[#f4ecd8] text-[#5c4b37]' : 
              'bg-paper text-ink'
            }`}
          >
            {!hasSeenSwipeHint && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-ink text-white px-5 py-3 rounded-full shadow-2xl text-sm flex items-center gap-3 z-50 pointer-events-none whitespace-nowrap"
              >
                <Hand className="w-5 h-5 animate-pulse text-accent" />
                {nextWord} {categoryLabel} देखने के लिए बाएं swipe करें
              </motion.div>
            )}

            <div className={`sticky top-[50px] z-10 p-2 sm:p-3 flex items-center justify-between gap-1 sm:gap-3 shadow-sm border-b transition-colors duration-300 ${
              readingTheme === 'dark' ? 'bg-[#1a1a1a]/95 border-white/10 text-white' : 
              readingTheme === 'sepia' ? 'bg-[#f4ecd8]/95 border-[#5c4b37]/10 text-[#5c4b37]' : 
              'bg-paper/95 border-ink/10 text-ink'
            } backdrop-blur-md`}>
              <button
                onClick={handleBack}
                className={`p-2 -ml-1 rounded-full shrink-0 transition-all touch-manipulation active:scale-90 ${
                  readingTheme === 'dark' ? 'hover:bg-white/10 active:bg-white/20' : 
                  readingTheme === 'sepia' ? 'hover:bg-[#5c4b37]/10 active:bg-[#5c4b37]/20' : 
                  'hover:bg-ink/10 active:bg-ink/20'
                }`}
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              {/* Position Indicator */}
              {readingIndex !== -1 && totalCount > 0 && (
                <div className={`flex flex-col sm:flex-row items-center justify-center text-xs font-bold px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl sm:rounded-full tracking-wide shrink-0 leading-tight sm:leading-normal ${
                  readingTheme === 'dark' ? 'bg-white/10 text-white/80' : 
                  readingTheme === 'sepia' ? 'bg-[#5c4b37]/10 text-[#5c4b37]/80' : 
                  'bg-ink/5 text-ink-light'
                }`}>
                  <span>{readingIndex + 1} / {totalCount}</span>
                  <span className="text-[10px] sm:text-xs sm:ml-1">{categoryLabel}</span>
                </div>
              )}

              {/* Theme Switcher */}
              <div className={`flex items-center gap-1 shrink-0 rounded-full px-1.5 py-1 ${
                readingTheme === 'dark' ? 'bg-white/10' : 
                readingTheme === 'sepia' ? 'bg-[#5c4b37]/10' : 
                'bg-ink/5'
              }`}>
                <button onClick={() => { vibrate(5); setReadingTheme('light'); }} className={`p-1.5 rounded-full touch-manipulation active:scale-90 ${readingTheme === 'light' ? 'bg-white shadow-sm' : 'opacity-50'}`}>
                  <div className="w-4 h-4 rounded-full bg-white border border-gray-300"></div>
                </button>
                <button onClick={() => { vibrate(5); setReadingTheme('sepia'); }} className={`p-1.5 rounded-full touch-manipulation active:scale-90 ${readingTheme === 'sepia' ? 'bg-[#f4ecd8] shadow-sm' : 'opacity-50'}`}>
                  <div className="w-4 h-4 rounded-full bg-[#f4ecd8] border border-[#d4c4a8]"></div>
                </button>
                <button onClick={() => { vibrate(5); setReadingTheme('dark'); }} className={`p-1.5 rounded-full touch-manipulation active:scale-90 ${readingTheme === 'dark' ? 'bg-[#1a1a1a] shadow-sm' : 'opacity-50'}`}>
                  <div className="w-4 h-4 rounded-full bg-[#1a1a1a] border border-gray-600"></div>
                </button>
              </div>

              {/* Font Size Controls */}
              <div className={`flex items-center gap-0.5 sm:gap-1 font-bold shrink-0 rounded-full px-1 sm:px-2 py-1 ${
                readingTheme === 'dark' ? 'bg-white/10' : 
                readingTheme === 'sepia' ? 'bg-[#5c4b37]/10' : 
                'bg-ink/5'
              }`}>
                <button
                  onClick={() => { vibrate(5); setFontSize((f) => Math.max(f - 2, 12)); }}
                  className={`p-1 sm:p-1.5 rounded-full text-sm transition-colors touch-manipulation active:scale-90 ${
                    readingTheme === 'dark' ? 'hover:bg-white/10' : 
                    readingTheme === 'sepia' ? 'hover:bg-[#5c4b37]/10' : 
                    'hover:bg-ink/10'
                  }`}
                >
                  A-
                </button>
                <div className={`w-px h-4 mx-0.5 sm:mx-1 ${
                  readingTheme === 'dark' ? 'bg-white/20' : 
                  readingTheme === 'sepia' ? 'bg-[#5c4b37]/20' : 
                  'bg-ink/20'
                }`}></div>
                <button
                  onClick={() => { vibrate(5); setFontSize((f) => Math.min(f + 2, 32)); }}
                  className={`p-1 sm:p-1.5 rounded-full text-sm transition-colors touch-manipulation active:scale-90 ${
                    readingTheme === 'dark' ? 'hover:bg-white/10' : 
                    readingTheme === 'sepia' ? 'hover:bg-[#5c4b37]/10' : 
                    'hover:bg-ink/10'
                  }`}
                >
                  A+
                </button>
              </div>

              {/* Action Icons */}
              <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
                <button
                  onClick={() => toggleBookmark(selectedSabad?.id || "")}
                  className={`p-1.5 sm:p-2 rounded-full transition-colors touch-manipulation active:scale-95 ${
                    readingTheme === 'dark' ? 'hover:bg-white/10' : 
                    readingTheme === 'sepia' ? 'hover:bg-[#5c4b37]/10' : 
                    'hover:bg-ink/10'
                  }`}
                >
                  <motion.div
                    key={bookmarks.includes(selectedSabad?.id || "") ? "bookmarked" : "not-bookmarked"}
                    initial={{ scale: 1 }}
                    animate={{ scale: [1, 1.25, 1] }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                  >
                    <Bookmark
                      className={`w-5 h-5 ${bookmarks.includes(selectedSabad?.id || "") ? "fill-accent text-accent" : (readingTheme === 'dark' ? "text-white/70" : readingTheme === 'sepia' ? "text-[#5c4b37]/70" : "text-ink-light")}`}
                    />
                  </motion.div>
                </button>
                <button
                  onClick={handleShare}
                  className={`p-1.5 sm:p-2 rounded-full transition-colors touch-manipulation active:scale-95 ${
                    readingTheme === 'dark' ? 'hover:bg-white/10' : 
                    readingTheme === 'sepia' ? 'hover:bg-[#5c4b37]/10' : 
                    'hover:bg-ink/10'
                  }`}
                >
                  <Share2 className={`w-5 h-5 ${readingTheme === 'dark' ? "text-white/70" : readingTheme === 'sepia' ? "text-[#5c4b37]/70" : "text-ink-light"}`} />
                </button>
              </div>
            </div>

            {/* Audio Player (Fixed outside swipeable container) */}
            {currentScreen === "audio_reading" && selectedSabad?.audioUrl && (
              <div className="w-full max-w-md mx-auto px-5 pt-4 shrink-0 z-10 relative">
                <AudioPlayer 
                  url={selectedSabad.audioUrl} 
                  onEnded={handleAudioEnded} 
                  autoPlay={autoPlayAudio}
                  onPlay={() => { setIsAudioActive(true); setAutoPlayAudio(true); }}
                  onPause={() => setAutoPlayAudio(false)}
                  onNext={() => handleSwipe("left")}
                  onPrev={() => handleSwipe("right")}
                  title={selectedSabad.title}
                  showToast={showToast}
                  variant="full"
                  hideTitle={true}
                  logoUrl={settings.logoUrl}
                />
              </div>
            )}

            {/* Title Card (Static Container, Fading Content) */}
            <div className="w-full max-w-md mx-auto px-5 pt-4 shrink-0 z-10 relative">
              <div className="w-full bg-gradient-to-r from-accent to-accent-dark text-white text-center py-3 px-4 rounded-2xl shadow-md border border-ink/20 relative overflow-hidden min-h-[72px] flex flex-col justify-center">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20"></div>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={selectedSabad?.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="relative z-10"
                  >
                    <h2 className="text-2xl font-semibold">
                      {selectedSabad?.title && !selectedSabad.title.includes("मन्त्र") && !selectedSabad.title.includes("मंत्र") && !selectedSabad.title.includes("गोत्रचार")
                        ? `|| ${selectedSabad.title} ||`
                        : selectedSabad?.title}
                    </h2>
                    {selectedSabad?.author && selectedSabad.author.toLowerCase() !== "admin" && (
                      <p className="text-xs opacity-80 mt-1">
                        द्वारा: {selectedSabad.author}
                      </p>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            {/* Swipeable Container */}
            <div
              {...(bindGestures() as any)}
              className="px-5 pt-2 pb-2 flex-1 flex flex-col items-center w-full touch-pan-y overflow-y-auto overflow-x-hidden hide-scrollbar"
              style={{
                WebkitOverflowScrolling: "touch",
                scrollBehavior: "smooth",
                touchAction: "pan-y"
              }}
            >
              <AnimatePresence mode="wait" custom={slideDir}>
                <motion.div
                  key={selectedSabad?.id}
                  custom={slideDir}
                  variants={{
                    enter: (dir) => ({ opacity: 0, x: dir > 0 ? 50 : -50 }),
                    center: { opacity: 1, x: 0 },
                    exit: (dir) => ({ opacity: 0, x: dir < 0 ? 50 : -50 })
                  }}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ type: 'spring', stiffness: 260, damping: 28, mass: 0.5 }}
                  className="w-full flex flex-col items-center max-w-2xl"
                  style={{ 
                    willChange: "transform, opacity",
                    transform: "translateZ(0)"
                  }}
                >
                  <div
                    className={`text-center leading-relaxed w-full whitespace-pre-wrap mt-2 p-6 sm:p-8 rounded-3xl shadow-sm border select-none mb-6 transition-colors duration-300 ${
                      readingTheme === 'dark' ? 'bg-[#1a1a1a] border-white/10 text-[#e0e0e0]' : 
                      readingTheme === 'sepia' ? 'bg-[#fdf8ed] border-[#5c4b37]/10 text-[#5c4b37]' : 
                      'bg-white/60 border-ink/10 text-ink'
                    }`}
                    style={{ fontSize: `${fontSize}px` }}
                  >
                    {selectedSabad?.text || ""}
                  </div>

                  {/* Navigation Buttons (Dynamic) */}
                  <div className="flex justify-between items-center w-full mb-8 px-4 sm:px-6 shrink-0 z-10">
                    <button 
                      onClick={() => handleSwipe("right")}
                      disabled={readingIndex <= 0}
                      className={`flex items-center justify-center gap-1.5 px-5 sm:px-8 py-3.5 rounded-2xl font-medium border shadow-md transition-all active:scale-95 touch-manipulation ${
                        readingIndex <= 0 ? 'opacity-40 cursor-not-allowed' : ''
                      } ${
                        readingTheme === 'dark' ? 'bg-[#1a1a1a] border-white/10 text-white hover:bg-white/5 active:bg-white/10' : 
                        readingTheme === 'sepia' ? 'bg-[#fdf8ed] border-[#5c4b37]/10 text-[#5c4b37] hover:bg-[#5c4b37]/5 active:bg-[#5c4b37]/10' : 
                        'bg-white border-ink/10 text-ink hover:bg-ink/5 active:bg-ink/10'
                      }`}
                    >
                      <ChevronLeft className="w-5 h-5" /> पिछला
                    </button>
                    <button 
                      onClick={() => handleSwipe("left")}
                      disabled={readingIndex >= totalCount - 1}
                      className={`flex items-center justify-center gap-1.5 px-5 sm:px-8 py-3.5 rounded-2xl font-medium border shadow-md transition-all active:scale-95 touch-manipulation ${
                        readingIndex >= totalCount - 1 ? 'opacity-40 cursor-not-allowed' : ''
                      } ${
                        readingTheme === 'dark' ? 'bg-[#1a1a1a] border-white/10 text-white hover:bg-white/5 active:bg-white/10' : 
                        readingTheme === 'sepia' ? 'bg-[#fdf8ed] border-[#5c4b37]/10 text-[#5c4b37] hover:bg-[#5c4b37]/5 active:bg-[#5c4b37]/10' : 
                        'bg-white border-ink/10 text-ink hover:bg-ink/5 active:bg-ink/10'
                      }`}
                    >
                      अगला <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        );
      }

      case "amavasya":
        return (
          <motion.div key="amavasya" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="bg-paper min-h-screen">
            <AmavasyaScreen amavasyaList={amavasyaList} selectedYear={selectedYear} setSelectedYear={setSelectedYear} handleBack={handleBack} />
          </motion.div>
        );

      case "donate":
        return (
          <motion.div
            key="donate"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pb-32"
          >
            <PremiumHeader title="विशेष सहयोग" onBack={() => navigateTo('home')} icon={HeartHandshake} />
            
            <div className="px-4 pt-2 text-center">
              <p className="text-sm mb-6 text-ink-light px-4 leading-relaxed">
                इस निःशुल्क और विज्ञापन-मुक्त ऐप को सुचारू रूप से चलाने के लिए आपके सहयोग की आवश्यकता है।
              </p>

            <div className="bg-white/90 p-5 rounded-[2.5rem] shadow-xl border border-ink/10 flex flex-col items-center max-w-sm mx-auto">
              <h3 className="text-lg font-bold mb-4 text-ink">
                UPI द्वारा सहयोग करें
              </h3>

              {/* QR Code Section */}
              <div className="bg-white p-3 rounded-2xl shadow-sm border border-ink/10 mb-4 relative group">
                <div className="absolute inset-0 bg-accent/5 rounded-2xl transform scale-105 -z-10"></div>
                <img
                  src={settings.qrCodeUrl || "/logo.png"}
                  alt="UPI QR Code"
                  className="w-32 h-32 object-contain"
                  referrerPolicy="no-referrer"
                  onError={(e) => { 
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = "/logo.png"; 
                  }}
                />
              </div>

              <div className="w-full relative mb-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-ink/10"></div>
                </div>
                <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-bold">
                  <span className="px-3 bg-white text-ink-light/60">
                    या UPI ID कॉपी करें
                  </span>
                </div>
              </div>

              <p className="text-lg font-mono bg-paper p-3 rounded-xl border border-ink/10 mb-4 w-full text-center font-bold tracking-tight text-ink-light truncate">
                {settings.upiId}
              </p>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(settings.upiId);
                  showToast("UPI ID कॉपी हो गई है!");
                }}
                className="bg-gradient-to-r from-accent to-accent-dark text-white px-8 py-3 rounded-2xl font-bold shadow-lg w-full hover:shadow-xl active:scale-[0.98] transition-all text-sm"
              >
                Copy UPI ID
              </button>
            </div>
            </div>
          </motion.div>
        );

      case "about":
        return (
          <motion.div
            key="about"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pb-32"
          >
            <PremiumHeader title="हमारे बारे में" onBack={() => navigateTo('home')} icon={Info} />
            
            <div className="px-6 pt-2 text-center">
              <div className="relative inline-block mb-4">
                <img
                  src={settings.logoUrl || "/logo.png"}
                  alt="Logo"
                  className="w-24 h-24 rounded-full shadow-lg border-4 border-white object-cover"
                  referrerPolicy="no-referrer"
                  onError={(e) => { 
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = "/logo.png"; 
                  }}
                />
              </div>
              <div className="bg-white/80 p-6 rounded-3xl shadow-md border border-ink/10 text-left space-y-4 text-lg">
              <p>
                <b>सबदवाणी</b> ऐप बिश्नोई समाज और अन्य श्रद्धालुओं के लिए एक
                निःशुल्क, सामुदायिक पहल है।
              </p>
              <p>
                <b>कॉपीराइट अस्वीकरण (Disclaimer):</b> इस ऐप में संकलित
                सबदवाणी, भजन और आरती सार्वजनिक डोमेन (Public Domain) और भक्तों
                के स्वैच्छिक योगदान पर आधारित हैं। यह ऐप पूरी तरह से शैक्षिक और
                भक्ति (Devotional) उद्देश्यों के लिए बनाया गया है। इसका उद्देश्य
                किसी भी प्रकार का व्यावसायिक लाभ कमाना नहीं है।
              </p>
              <p>
                यदि आपको किसी सामग्री से संबंधित कोई आपत्ति है, तो कृपया हमसे
                संपर्क करें।
              </p>
            </div>
            </div>
          </motion.div>
        );

      case "privacy":
        return (
          <motion.div
            key="privacy"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pb-32 bg-paper min-h-screen"
          >
            <PremiumHeader title="गोपनीयता नीति" onBack={() => navigateTo('home')} icon={ShieldCheck} />
            
            <div className="px-6 pt-2 text-center">
              <ShieldCheck className="w-20 h-20 mx-auto text-accent mb-4" />
              <div className="bg-white/80 p-6 rounded-3xl shadow-md border border-ink/10 text-left space-y-4 text-sm md:text-base text-ink">
                <p className="font-bold text-lg mb-2">गोपनीयता नीति (Privacy Policy)</p>
                <p className="text-xs text-ink/70 mb-4">अंतिम अपडेट: 2 अप्रैल 2026</p>
                <p>आपकी गोपनीयता हमारे लिए अत्यंत महत्वपूर्ण है। यह ऐप (सबदवाणी / Shabadwani) Google Play Store की नीतियों का पूर्ण रूप से पालन करता है। यह गोपनीयता नीति बताती है कि हम आपकी जानकारी कैसे एकत्र, उपयोग और सुरक्षित करते हैं।</p>
                
                <h3 className="font-bold mt-4 text-accent-dark">1. जानकारी का संग्रह (Data Collection)</h3>
                <ul className="list-disc pl-5 space-y-1 text-ink/90">
                  <li><strong>व्यक्तिगत जानकारी:</strong> जब आप ऐप में लॉगिन करते हैं (Google Authentication के माध्यम से), तो हम आपका नाम, ईमेल पता और प्रोफाइल फोटो प्राप्त करते हैं।</li>
                  <li><strong>ऐप उपयोग डेटा:</strong> हम आपके द्वारा बुकमार्क की गई सामग्री, रीडिंग हिस्ट्री (पढ़ी गई सामग्री), और डिवाइस आईडी एकत्र करते हैं। यह डेटा केवल आपके ऐप अनुभव को बेहतर बनाने, व्यक्तिगत सुझाव देने और ऐप के प्रदर्शन को सुधारने के लिए उपयोग किया जाता है।</li>
                  <li><strong>यूज़र द्वारा अपलोड किया गया डेटा:</strong> आपके द्वारा अपलोड की गई सामग्री (जैसे भजन, साखी, ऑडियो फाइलें, और तस्वीरें) हमारे सुरक्षित सर्वर पर स्टोर की जाती है।</li>
                  <li><strong>ऑफ़लाइन कैशिंग (Offline Caching):</strong> बेहतर अनुभव के लिए, ऐप ऑडियो फाइल्स और अन्य सामग्री को आपके डिवाइस पर स्थानीय रूप से कैश (cache) करता है, ताकि आप उन्हें इंटरनेट के बिना भी सुन सकें। यह डेटा केवल आपके डिवाइस पर स्टोर होता है।</li>
                  <li><strong>डिवाइस और उपयोग डेटा:</strong> ऐप के प्रदर्शन को बेहतर बनाने के लिए क्रैश लॉग्स और सामान्य उपयोग डेटा (Firebase Analytics के माध्यम से) एकत्र किया जा सकता है।</li>
                </ul>

                <h3 className="font-bold mt-4 text-accent-dark">1.1 डेटा सुरक्षा (Data Security)</h3>
                <p className="text-ink/90">हम स्पष्ट करते हैं कि आपका कोई भी डेटा किसी भी थर्ड-पार्टी (Third-Party) को विज्ञापन या मार्केटिंग के लिए <strong>बेचा या साझा नहीं किया जाता है</strong>।</p>

                <h3 className="font-bold mt-4 text-accent-dark">2. अनुमतियां (Permissions)</h3>
                <ul className="list-disc pl-5 space-y-1 text-ink/80">
                  <li><strong>स्थान (Location):</strong> 'चोघड़िया' और पंचांग जैसी सुविधाओं के लिए आपके डिवाइस के स्थान (Location) का उपयोग किया जाता है। <strong>महत्वपूर्ण:</strong> यह डेटा केवल आपके डिवाइस पर प्रोसेस होता है और हमारे सर्वर पर न तो भेजा जाता है और न ही सेव किया जाता है।</li>
                  <li><strong>वाइब्रेशन (Vibration):</strong> 'जाप माला' सुविधा में गिनती पूरी होने पर आपको सूचित करने के लिए वाइब्रेशन का उपयोग किया जाता है।</li>
                  <li><strong>इंटरनेट (Internet):</strong> ऑडियो चलाने, डेटा सिंक करने और सामग्री डाउनलोड/अपलोड करने के लिए इंटरनेट एक्सेस की आवश्यकता होती है।</li>
                  <li><strong>बैकग्राउंड ऑडियो और नोटिफिकेशन्स (Background Audio & Notifications):</strong> ऐप को बैकग्राउंड में ऑडियो चलाने (Foreground Service) और लॉक स्क्रीन पर मीडिया कंट्रोल्स दिखाने के लिए अनुमति की आवश्यकता होती है।</li>
                </ul>

                <h3 className="font-bold mt-4 text-accent-dark">3. थर्ड-पार्टी सेवाएं (Third-Party Services)</h3>
                <p className="text-ink/90">यह ऐप निम्नलिखित थर्ड-पार्टी सेवाओं का उपयोग करता है, जिनकी अपनी गोपनीयता नीतियां हो सकती हैं:</p>
                <ul className="list-disc pl-5 space-y-1 text-ink/80">
                  <li>Google Play Services</li>
                  <li>Google Analytics for Firebase</li>
                  <li>Firebase Authentication & Cloud Firestore</li>
                </ul>

                <h3 className="font-bold mt-4 text-accent-dark">4. जानकारी का उपयोग (Data Usage)</h3>
                <ul className="list-disc pl-5 space-y-1 text-ink/80">
                  <li>एकत्र की गई जानकारी का उपयोग केवल ऐप की सेवाएं प्रदान करने, यूज़र अकाउंट प्रबंधित करने और आपके अनुभव को बेहतर बनाने के लिए किया जाता है।</li>
                  <li>हम आपका व्यक्तिगत डेटा किसी भी तीसरे पक्ष (Third Party) को विज्ञापन या मार्केटिंग के लिए <strong>बेचते या साझा नहीं करते हैं</strong>।</li>
                </ul>

                <h3 className="font-bold mt-4 text-accent-dark">5. डेटा सुरक्षा और डिलीशन (Data Security & Deletion)</h3>
                <ul className="list-disc pl-5 space-y-1 text-ink/80">
                  <li><strong>सुरक्षा:</strong> आपका डेटा सुरक्षित सर्वर (Firebase) पर एन्क्रिप्टेड रूप में स्टोर किया जाता है। हम आपके डेटा की सुरक्षा के लिए व्यावसायिक रूप से स्वीकार्य साधनों का उपयोग करते हैं।</li>
                  <li><strong>डेटा डिलीशन (Data Deletion):</strong> यदि आप अपना खाता या अपना सारा डेटा डिलीट करना चाहते हैं, तो आप ऐप के अंदर दिए गए विकल्पों का उपयोग कर सकते हैं या नीचे दिए गए ईमेल पर हमसे संपर्क कर सकते हैं। आपके अनुरोध पर आपका सारा डेटा (प्रोफाइल, अपलोड की गई सामग्री) हमारे सर्वर से स्थायी रूप से हटा दिया जाएगा।</li>
                </ul>

                <h3 className="font-bold mt-4 text-accent-dark">5.1 प्रीमियम फीचर्स और डेटा (Premium Features & Data)</h3>
                <p className="text-ink/90">ऐप में कुछ प्रीमियम फीचर्स (जैसे 'जाप माला' और 'नोट्स') आपके अनुभव को बेहतर बनाने के लिए दिए गए हैं।</p>
                <ul className="list-disc pl-5 space-y-1 text-ink/80">
                  <li><strong>जाप माला (Mala Count):</strong> आपकी माला की गिनती केवल आपके डिवाइस (Local Storage) पर स्टोर की जाती है।</li>
                  <li><strong>पसंदीदा (Bookmarks):</strong> आपके बुकमार्क आपके अकाउंट से जुड़े होते हैं ताकि आप उन्हें किसी भी डिवाइस पर एक्सेस कर सकें।</li>
                </ul>

                <h3 className="font-bold mt-4 text-accent-dark">6. बच्चों की गोपनीयता (Children's Privacy)</h3>
                <p className="text-ink/90">यह ऐप 13 वर्ष से कम उम्र के बच्चों से जानबूझकर व्यक्तिगत जानकारी एकत्र नहीं करता है। यदि हमें पता चलता है कि किसी बच्चे ने हमें व्यक्तिगत जानकारी प्रदान की है, तो हम उसे तुरंत अपने सर्वर से हटा देते हैं।</p>

                <h3 className="font-bold mt-4 text-accent-dark">7. संपर्क करें (Contact Us)</h3>
                <p className="text-ink/90">यदि इस गोपनीयता नीति के संबंध में आपके कोई प्रश्न या सुझाव हैं, तो कृपया हमसे संपर्क करें:</p>
                <div className="mt-2 bg-paper p-3 rounded-xl border border-ink/10">
                  <p className="font-semibold text-accent-dark">Email: vishnoimilan@gmail.com</p>
                  <p className="font-semibold text-accent-dark">Website: www.bishnoi.co.in</p>
                </div>
              </div>
            </div>
          </motion.div>
        );

      case "contribute":
        return (
          <motion.div
            key="contribute"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pb-32 bg-paper min-h-screen"
          >
            <PremiumHeader title="सामग्री जोड़ें" onBack={handleBack} icon={UploadCloud} />
            
            <div className="px-6 pt-2">
              <div className="text-center mb-6">
                <p className="text-ink-light">भजन, आरती, मंत्र या साखी अपलोड करें</p>
              </div>

            <form
              className="space-y-4 bg-white/80 p-6 rounded-3xl shadow-md border border-ink/10"
              onSubmit={handleContributeSubmit}
            >
              <div>
                <label className="block font-bold mb-1 text-ink">
                  आपका नाम (Author)
                </label>
                <input
                  value={contribAuthor}
                  onChange={(e) => setContribAuthor(e.target.value)}
                  required
                  type="text"
                  className="w-full p-3 rounded-xl border border-ink/20 bg-white focus:border-accent outline-none transition-colors"
                  placeholder="अपना नाम लिखें..."
                />
              </div>
              <div>
                <label className="block font-bold mb-1 text-ink">
                  शीर्षक (Title)
                </label>
                <input
                  value={contribTitle}
                  onChange={(e) => setContribTitle(e.target.value)}
                  required
                  type="text"
                  className="w-full p-3 rounded-xl border border-ink/20 bg-white focus:border-accent outline-none transition-colors"
                  placeholder="उदा. नया भजन..."
                />
              </div>
              <div>
                <label className="block font-bold mb-1 text-ink">
                  प्रकार (Type)
                </label>
                <select
                  value={contribType}
                  onChange={(e) => setContribType(e.target.value)}
                  className="w-full p-3 rounded-xl border border-ink/20 bg-white focus:border-accent outline-none transition-colors"
                >
                  <option>भजन</option>
                  <option>आरती</option>
                  <option>मंत्र</option>
                  <option>साखी</option>
                </select>
              </div>
              <div>
                <label className="block font-bold mb-1 text-ink">
                  ऑडियो लिंक (Audio URL - Optional) या अपलोड करें
                </label>
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <input
                      value={contribAudio}
                      onChange={(e) => {
                        setContribAudio(e.target.value);
                        if (e.target.value) setContribAudioFile(null);
                      }}
                      type="url"
                      className="flex-1 p-3 rounded-xl border border-ink/20 bg-white focus:border-accent outline-none transition-colors"
                      placeholder="https://..."
                    />
                    <label className="flex items-center justify-center px-4 bg-accent/10 text-accent-dark rounded-xl cursor-pointer hover:bg-accent/20 transition-colors whitespace-nowrap">
                      <input
                        type="file"
                        accept="audio/*,.mp3,.aac,.m4a,.wav,.ogg"
                        className="hidden"
                        onChange={(e) => {
                          handleFileSelect(e, (file) => {
                            setContribAudioFile(file);
                            if (file) setContribAudio("");
                          }, false, setContribAudioError);
                        }}
                      />
                      <Upload className="w-5 h-5" />
                    </label>
                  </div>
                  {contribAudioError && (
                    <motion.div 
                      initial={{ opacity: 0, y: -5 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      className="mt-2 p-2 bg-red-50 text-red-600 rounded-lg text-xs font-medium flex items-center gap-2 justify-center text-center border border-red-100"
                    >
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{contribAudioError}</span>
                    </motion.div>
                  )}
                  {contribAudioFile && !contribAudioError && (
                    <p className="text-xs text-green-600 font-medium">चयनित: {contribAudioFile.name}</p>
                  )}
                  {uploadProgress !== null && (
                    <div className="w-full bg-ink/10 rounded-full h-1.5 mt-1">
                      <div className="bg-accent h-1.5 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block font-bold mb-1 text-ink">
                  पाठ (Text / Lyrics)
                </label>
                <textarea
                  value={contribText}
                  onChange={(e) => setContribText(e.target.value)}
                  required
                  className="w-full p-3 rounded-xl border border-ink/20 bg-white h-32 focus:border-accent outline-none transition-colors"
                  placeholder="यहाँ बोल लिखें..."
                ></textarea>
              </div>
              <div>
                <label className="block font-bold mb-1 text-ink">
                  सुरक्षा कोड (Captcha): {captchaQuestion}
                </label>
                <input
                  value={captchaAnswer}
                  onChange={(e) => setCaptchaAnswer(e.target.value)}
                  required
                  type="number"
                  className="w-full p-3 rounded-xl border border-ink/20 bg-white focus:border-accent outline-none transition-colors"
                  placeholder="उत्तर लिखें..."
                />
              </div>
              {contribError && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  className="mb-4 p-4 bg-red-50 text-red-700 rounded-2xl text-sm flex items-center gap-3 justify-center text-center border border-red-100"
                >
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span>{contribError}</span>
                </motion.div>
              )}
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full bg-gradient-to-r from-accent to-accent-dark text-white font-bold py-3.5 rounded-xl shadow-md mt-4 hover:shadow-lg hover:scale-[1.02] transition-all ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {isSubmitting ? 'सबमिट हो रहा है...' : 'सबमिट करें (Submit)'}
              </button>
              <p className="text-xs text-center text-ink-light mt-3">
                * सभी सबमिशन एडमिन द्वारा रिव्यु किए जाएंगे।
              </p>
            </form>
            </div>
          </motion.div>
        );

      case "choghadiya":
        return (
          <motion.div
            key="choghadiya"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pb-32 bg-paper min-h-screen"
          >
            <PremiumHeader title="चौघड़िया मुहूर्त" onBack={() => navigateTo("home")} icon={Sun} />

            <div className="px-4">
              <div className="bg-white/90 p-6 rounded-3xl shadow-sm border border-ink/10 mb-6">
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block font-bold text-sm mb-1">
                    तिथि (Date)
                  </label>
                  <input
                    type="date"
                    value={choghadiyaDate}
                    onChange={(e) => setChoghadiyaDate(e.target.value)}
                    className="w-full p-3 rounded-xl border border-ink/20 bg-white focus:border-accent outline-none font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-sm mb-1">
                    स्थान (Location)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={choghadiyaLocation}
                      onChange={(e) => setChoghadiyaLocation(e.target.value)}
                      placeholder="शहर का नाम दर्ज करें..."
                      className="flex-1 p-3 rounded-xl border border-ink/20 bg-white focus:border-accent outline-none font-medium"
                    />
                    <button
                      onClick={handleGetLocation}
                      className="p-3 bg-accent/10 text-accent-dark rounded-xl hover:bg-accent/20 transition-colors"
                      title="मेरी वर्तमान लोकेशन"
                    >
                      <MapPin className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => calculateChoghadiya()}
                  disabled={choghadiyaLoading}
                  className="w-full p-3 bg-accent text-white font-bold rounded-xl hover:bg-accent-dark transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  {choghadiyaLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Sun className="w-5 h-5" />
                  )}
                  मुहूर्त निकालें
                </button>
              </div>

              {choghadiyaError && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  className="mb-6 p-4 bg-red-50 text-red-700 rounded-2xl text-sm flex items-center gap-3 justify-center text-center border border-red-100"
                >
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span>{choghadiyaError}</span>
                </motion.div>
              )}

              {!choghadiyaLoading &&
                !choghadiyaError &&
                choghadiyaSlots.day.length > 0 && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-bold text-lg text-accent-dark mb-3 flex items-center gap-2">
                        <Sun className="w-5 h-5" /> दिन का चौघड़िया
                      </h3>
                      <div className="grid grid-cols-1 gap-2">
                        {choghadiyaSlots.day.map((slot, idx) => {
                          const now = new Date();
                          const isToday = choghadiyaDate === now.toISOString().split('T')[0];
                          const isCurrent = isToday && now >= slot.startTime && now < slot.endTime;
                          return (
                          <div
                            key={`day-${slot.name}-${idx}`}
                            id={isCurrent ? "current-choghadiya-slot" : undefined}
                            className={`flex justify-between p-3 rounded-xl border ${isCurrent ? "ring-2 ring-accent shadow-md scale-[1.02] transition-transform" : ""} ${slot.type === "good" ? "bg-green-50 border-green-200 text-green-800" : slot.type === "bad" ? "bg-red-50 border-red-200 text-red-800" : "bg-blue-50 border-blue-200 text-blue-800"}`}
                          >
                            <div className="flex flex-col">
                              <span className="font-bold">{slot.name}</span>
                              {isCurrent && <span className="text-xs font-bold text-accent">अभी चल रहा है</span>}
                            </div>
                            <span className="text-sm font-medium flex items-center">
                              {slot.time}
                            </span>
                          </div>
                        )})}
                      </div>
                    </div>

                    <div>
                      <h3 className="font-bold text-lg text-ink mb-3 flex items-center gap-2">
                        <Book className="w-5 h-5" /> रात का चौघड़िया
                      </h3>
                      <div className="grid grid-cols-1 gap-2">
                        {choghadiyaSlots.night.map((slot, idx) => {
                          const now = new Date();
                          const isToday = choghadiyaDate === now.toISOString().split('T')[0];
                          const isCurrent = isToday && now >= slot.startTime && now < slot.endTime;
                          return (
                          <div
                            key={`night-${slot.name}-${idx}`}
                            id={isCurrent ? "current-choghadiya-slot" : undefined}
                            className={`flex justify-between p-3 rounded-xl border ${isCurrent ? "ring-2 ring-accent shadow-md scale-[1.02] transition-transform" : ""} ${slot.type === "good" ? "bg-green-50 border-green-200 text-green-800" : slot.type === "bad" ? "bg-red-50 border-red-200 text-red-800" : "bg-blue-50 border-blue-200 text-blue-800"}`}
                          >
                            <div className="flex flex-col">
                              <span className="font-bold">{slot.name}</span>
                              {isCurrent && <span className="text-xs font-bold text-accent">अभी चल रहा है</span>}
                            </div>
                            <span className="text-sm font-medium flex items-center">
                              {slot.time}
                            </span>
                          </div>
                        )})}
                      </div>
                    </div>
                    <p className="text-xs text-ink-light mt-4 italic text-center">
                      नोट: यह समय {choghadiyaLocation} के सटीक सूर्योदय/सूर्यास्त पर आधारित है।
                      <br />
                      गुरु जम्भेश्वर भगवान ने 365 दिन के हर क्षण को ही अच्छा माना है, उन्होंने इस प्रकार के आडंबरों से बिश्नोई समाज को मुक्त रखा है फिर भी आज के समय की मांग के लिए यहां दिए गए हैं।
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        );

      case "bichhuda":
        return (
          <motion.div
            key="bichhuda"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pb-32 bg-paper min-h-screen"
          >
            <PremiumHeader title="बिछुड़ा (विदर)" onBack={() => navigateTo("home")} icon={Book} />

            <div className="px-4 pt-4">
              <div className="bg-white/90 p-6 rounded-3xl shadow-sm border border-ink/10 mb-6">
              <div className="flex items-center justify-between mb-6 gap-2">
                <h2 className="font-bold text-lg flex-1">बिछुड़ा तिथियां</h2>
                <select
                  value={bichhudaMonth}
                  onChange={(e) => setBichhudaMonth(Number(e.target.value))}
                  className="p-2 rounded-xl border border-ink/20 bg-white font-bold text-accent-dark text-sm"
                >
                  {Array.from({ length: 12 }, (_, i) =>
                    new Date(2000, i, 1).toLocaleDateString("hi-IN", {
                      month: "long",
                    }),
                  ).map((m, i) => (
                    <option key={`month-${i}`} value={i}>
                      {m}
                    </option>
                  ))}
                </select>
                <select
                  value={bichhudaYear}
                  onChange={(e) => setBichhudaYear(Number(e.target.value))}
                  className="p-2 rounded-xl border border-ink/20 bg-white font-bold text-accent-dark text-sm"
                >
                  {Array.from({ length: 101 }, (_, i) => new Date().getFullYear() - 50 + i).map((y) => (
                    <option key={`year-${y}`} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-3 mb-8">
                {bichhudaList
                  .filter((item) => item.rawStart.getMonth() === bichhudaMonth)
                  .map((item) => (
                    <div
                      key={item.start}
                      className={`bg-paper p-4 rounded-2xl border ${item.isUpcoming ? "border-accent/50 ring-1 ring-accent/20" : "border-ink/5"} flex flex-col relative overflow-hidden`}
                    >
                      {item.isUpcoming && (
                        <div className="absolute top-0 right-0 bg-accent text-white text-[10px] font-bold px-2 py-0.5 rounded-bl-lg">
                          आगामी
                        </div>
                      )}
                      <span className="font-bold text-accent-dark mb-2 text-lg">
                        {item.monthName} {bichhudaYear}
                      </span>
                      <div className="flex flex-col gap-1 text-sm text-ink-light">
                        <span className="flex justify-between border-b border-ink/5 pb-1">
                          <span>प्रारंभ:</span>{" "}
                          <span className="font-semibold text-ink">
                            {item.start}
                          </span>
                        </span>
                        <span className="flex justify-between pt-1">
                          <span>समाप्त:</span>{" "}
                          <span className="font-semibold text-ink">
                            {item.end}
                          </span>
                        </span>
                      </div>
                    </div>
                  ))}
              </div>

              <div className="space-y-4">
                <div className="bg-red-50 p-4 rounded-2xl border border-red-100">
                  <h3 className="font-bold text-lg mb-2 text-red-700">
                    वर्जित कार्य
                  </h3>
                  <ul className="list-disc list-inside text-sm space-y-1 text-red-600">
                    <li>लकड़ी या ईंधान इकट्ठा करना</li>
                    <li>चारपाई या पलंग बुनवाना</li>
                    <li>घर की छत ढलवाना</li>
                    <li>दक्षिण दिशा की यात्रा करना</li>
                  </ul>
                </div>
                <p className="text-xs text-ink-light mt-4 italic text-center">
                  नोट: गुरु जम्भेश्वर भगवान ने 365 दिन के हर क्षण को ही अच्छा माना है, उन्होंने इस प्रकार के आडंबरों से बिश्नोई समाज को मुक्त रखा है फिर भी आज के समय की मांग के लिए यहां दिए गए हैं।
                </p>
              </div>
            </div>
            </div>
          </motion.div>
        );

      case "mele":
        return (
          <motion.div
            key="mele"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pb-32 bg-paper min-h-screen"
          >
            <PremiumHeader title="आगामी प्रमुख मेले" onBack={() => navigateTo("home")} icon={Users} />

            <div className="space-y-4 px-4 pt-4">
              {isLoading || (processedMeles.length === 0 && meles.length === 0) ? (
                Array.from({ length: 3 }).map((_, i) => <MelaSkeleton key={i} />)
              ) : (
                processedMeles.map((mela) => (
                  <div
                    key={mela.id}
                    className={`mela-card bg-white/90 p-5 rounded-3xl shadow-sm border ${mela.upcoming ? "border-accent/50 ring-1 ring-accent/20" : "border-ink/5"} relative overflow-hidden`}
                  >
                    {mela.upcoming && (
                      <div className="absolute top-0 right-0 bg-accent text-white text-xs font-bold px-3 py-1 rounded-bl-xl">
                        आगामी (Upcoming)
                      </div>
                    )}
                    <h3 className="font-bold text-xl text-accent-dark mb-1 pr-16">
                      {mela.name}
                    </h3>
                    <p className="text-sm font-semibold text-ink mb-1 flex items-center gap-1">
                      <CalendarDays className="w-4 h-4 text-accent" />{" "}
                      {mela.dateFormatted}
                    </p>
                    <p className="text-sm text-ink-light mb-3 flex items-center gap-1">
                      <Home className="w-4 h-4" /> {mela.location}
                    </p>
                    <p className="text-sm bg-paper p-3 rounded-xl leading-relaxed">
                      {mela.desc}
                    </p>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        );

      case "admin_login":
        return (
          <motion.div
            key="admin_login"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen flex flex-col"
          >
            <PremiumHeader title="Admin Access" onBack={() => navigateTo('home')} icon={KeyRound} />
            
            <div className="flex-1 flex items-center justify-center px-6 pb-32">
              <div className="bg-white/90 backdrop-blur-md p-8 rounded-3xl shadow-2xl border border-ink/10 w-full max-w-sm text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-accent to-accent-dark"></div>
                <KeyRound className="w-16 h-16 mx-auto text-accent mb-4" />
                <p className="text-sm text-ink-light mb-6">
                  कृपया व्यवस्थापक पासवर्ड दर्ज करें
                </p>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (isAdminLoggingIn) return;
                  setAdminLoginError("");
                  
                  if (!adminPasswordInput) {
                    setAdminLoginError("कृपया पासवर्ड दर्ज करें।");
                    return;
                  }

                  setIsAdminLoggingIn(true);
                  try {
                    if (auth) {
                      // Login with the specific admin email and user-provided password
                      await signInWithEmailAndPassword(auth, "ravindrasaran@gmail.com", adminPasswordInput);
                    }
                    setIsAdminAuthenticated(true);
                    setAdminPasswordInput("");
                    navigateTo("admin");
                  } catch (error: any) {
                    if (error.code === 'auth/network-request-failed') {
                      setAdminLoginError("इंटरनेट कनेक्शन उपलब्ध नहीं है। कृपया अपना नेटवर्क जांचें और पुनः प्रयास करें।");
                    } else if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
                      setAdminLoginError("गलत पासवर्ड! कृपया सही पासवर्ड दर्ज करें।");
                    } else if (error.code === 'auth/user-not-found') {
                      setAdminLoginError("एडमिन अकाउंट नहीं मिला। कृपया Firebase Console में ravindrasaran@gmail.com अकाउंट बनाएं।");
                    } else if (error.code === 'auth/operation-not-allowed') {
                      setAdminLoginError("Firebase Authentication में 'Email/Password' लॉगिन इनेबल नहीं है। कृपया इसे इनेबल करें।");
                    } else {
                      setAdminLoginError("लॉगिन में त्रुटि हुई: " + error.message);
                    }
                    setAdminPasswordInput("");
                  } finally {
                    setIsAdminLoggingIn(false);
                  }
                }}
              >
                {adminLoginError && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    className="mb-4 p-4 bg-red-50 text-red-700 rounded-2xl text-sm flex items-center gap-3 justify-center text-center border border-red-100"
                  >
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span>{adminLoginError}</span>
                  </motion.div>
                )}
                <input
                  type="password"
                  value={adminPasswordInput}
                  onChange={(e) => setAdminPasswordInput(e.target.value)}
                  placeholder="पासवर्ड"
                  className="w-full p-4 rounded-xl border border-ink/20 bg-paper/50 text-center text-2xl tracking-widest mb-6 focus:border-accent outline-none transition-colors"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={isAdminLoggingIn}
                  className={`w-full bg-gradient-to-r from-accent to-accent-dark text-white font-bold py-3.5 rounded-xl shadow-lg hover:shadow-xl transition-all ${isAdminLoggingIn ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {isAdminLoggingIn ? 'लॉगिन हो रहा है...' : 'लॉगिन करें'}
                </button>
              </form>
              <button
                onClick={() => navigateTo("home")}
                className="mt-6 text-ink-light text-sm underline hover:text-ink"
              >
                वापस जाएं
              </button>
            </div>
            </div>
          </motion.div>
        );

      case "admin":
        return <AdminScreen {...{
          navigateTo, isSubmitting, contribAudioError, contribPhotoError, showToast, checkIsOnline, db,
          setContribAudioError, setContribPhotoError, setIsSubmitting, contribTitle, contribType, contribAudio,
          contribText, contribAuthor, contribDate, contribLocation, contribPhotoUrl, setContribTitle, setContribType,
          setContribAudio, setContribText, setContribAuthor, setContribDate, setContribLocation, setContribPhotoUrl,
          addDoc, collection, serverTimestamp, setContribError, contribError, pendingContributions, setPendingContributions,
          doc, updateDoc, deleteDoc, setConfirmDialog, editModalOpen, setEditModalOpen, editAudioError, editPhotoError,
          setEditAudioError, setEditPhotoError, editContribution, setEditContribution, handleUpdateContribution, handleDeleteContribution, handleFileChange,
          contribAudioFile, uploadFileToStorage, contribPhotoFile, contribSequence, setContribSequence, setContribAudioFile, setContribPhotoFile, handleFileSelect, uploadProgress, sabads, openEditModal, handleDelete, aartis, bhajans, sakhis, mantras, thoughts, meles, notices, badhais, toggleNoticeStatus, toggleBadhaiStatus, settings, setSettings, setSettingsLogoFile, settingsLogoFile, setSettingsQrCodeFile, settingsQrCodeFile, setSettingsJaapAudioFile, settingsJaapAudioFile, handleSaveSettings, pendingPosts, approvePost, rejectPost, editItemData, handleEditSave, setEditItemData
        }} />;
    }
  };

  return (
    <div className="min-h-screen max-w-md mx-auto relative shadow-2xl bg-paper overflow-x-hidden flex flex-col">
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] bg-ink text-white px-6 py-3 rounded-full shadow-2xl text-sm font-medium flex items-center gap-2 whitespace-nowrap"
          >
            <img src="/logo.png" alt="Logo" className="w-5 h-5 rounded-full" />
            {toastMessage}
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
        <AnimatePresence mode="popLayout">{renderScreen()}</AnimatePresence>
      </div>

      {/* Notifications Panel */}
      <AnimatePresence>
        {showNotifications && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-[60px] right-4 w-80 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-ink/10 z-50 overflow-hidden"
          >
            <div className="p-4 border-b border-ink/10 flex justify-between items-center bg-paper/50">
              <h3 className="font-bold text-ink">नोटिफिकेशन्स</h3>
              <div className="flex gap-3">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-xs text-accent font-bold hover:underline"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-ink-light hover:text-ink"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.filter(n => !n.read).length === 0 ? (
                <div className="p-6 text-center text-ink-light text-sm">
                  कोई नया नोटिफिकेशन नहीं है।
                </div>
              ) : (
                notifications.filter(n => !n.read).map((n) => (
                  <div
                    key={n.id}
                    onClick={() => markRead(n.id)}
                    className="p-4 border-b border-ink/5 last:border-0 bg-accent/5 cursor-pointer hover:bg-accent/10 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-bold text-sm text-ink">{n.title}</h4>
                      <span className="text-[10px] text-ink-light">
                        {n.date}
                      </span>
                    </div>
                    <p className="text-xs text-ink-light leading-relaxed">
                      {n.message}
                    </p>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fixed Bottom Section (Ad + Nav) */}
      {currentScreen !== "admin" && currentScreen !== "admin_login" && (
        <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto z-50 flex flex-col">
          {/* Mini Player */}
          <AnimatePresence>
            {isAudioActive && currentScreen !== "audio_reading" && selectedSabad?.audioUrl && !isMiniPlayerDismissed && (
              <AudioPlayer
                url={selectedSabad.audioUrl}
                title={selectedSabad.title}
                variant="mini"
                onClose={() => {
                  if (globalAudio) globalAudio.pause();
                  updateMediaSessionState('none');
                  setIsMiniPlayerDismissed(true);
                  setIsAudioActive(false);
                }}
                onClick={() => {
                  navigateTo("audio_reading");
                }}
                onNext={() => handleSwipe("left")}
                onPrev={() => handleSwipe("right")}
                onEnded={handleAudioEnded}
                autoPlay={autoPlayAudio}
                onPlay={() => setAutoPlayAudio(true)}
                onPause={() => setAutoPlayAudio(false)}
                logoUrl={settings.logoUrl}
              />
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
