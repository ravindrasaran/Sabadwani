import React, { useState, useEffect, useRef, useMemo, Component, ErrorInfo, ReactNode } from "react";
import {
  Book,
  Calendar,
  Home,
  Heart,
  Info,
  Lock,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  BookOpenText,
  Music,
  Play,
  Pause,
  Search,
  Settings,
  PlusCircle,
  Sun,
  ShieldCheck,
  HeartHandshake,
  Share2,
  UploadCloud,
  Upload,
  Bookmark,
  Bell,
  Quote,
  Users,
  CheckCircle,
  XCircle,
  Edit3,
  Image as ImageIcon,
  KeyRound,
  X,
  MapPin,
  Loader2,
  Target,
  ListOrdered,
  RotateCcw,
  Flame,
  AlertTriangle,
  AlertCircle,
  Hand,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useGesture } from "@use-gesture/react";
import SunCalc from "suncalc";
import { julian, moonposition, solar, base, deltat } from "astronomia";
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from "date-fns";
import { hi } from "date-fns/locale";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, onSnapshot, setDoc, getDoc } from "firebase/firestore";
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

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("App crashed:", error, errorInfo);
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

type Screen =
  | "home"
  | "shabad_list"
  | "reading"
  | "amavasya"
  | "category_list"
  | "audio_reading"
  | "donate"
  | "about"
  | "privacy"
  | "contribute"
  | "search"
  | "admin_login"
  | "admin"
  | "community_posts"
  | "choghadiya"
  | "bichhuda"
  | "mele"
  | "mala"
  | "niyam";

type SabadItem = {
  id: string;
  title: string;
  icon?: any;
  audioUrl?: string;
  text?: string;
  author?: string;
  sequence?: number;
};

type AppSettings = {
  logoUrl: string;
  qrCodeUrl: string;
  adText: string;
  adLink?: string;
  isAdEnabled?: boolean;
  upiId: string;
  jaapAudioUrl?: string;
};

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

function PremiumHeader({ title, onBack, icon: Icon }: { title: string; onBack: () => void; icon?: any }) {
  return (
    <div className="sticky top-[57px] z-20 bg-gradient-to-r from-accent to-accent-dark text-white p-3 rounded-b-[2rem] shadow-lg flex items-center gap-3 mb-3 -mt-2">
      <button
        onClick={onBack}
        className="p-2 rounded-full hover:bg-white/20 transition-colors"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      <h1 className="text-xl sm:text-2xl font-bold font-heading flex-1 text-center truncate">
        || {title} ||
      </h1>
      {Icon ? <Icon className="w-8 h-8 opacity-80" /> : <div className="w-8" />}
    </div>
  );
}

function Header({
  onNavigate,
  logoUrl,
  isAdminAuthenticated,
  unreadCount,
  onNotificationClick,
}: {
  onNavigate: (screen: Screen) => void;
  logoUrl: string;
  isAdminAuthenticated: boolean;
  unreadCount: number;
  onNotificationClick: () => void;
}) {
  const [clickCount, setClickCount] = useState(0);

  const handleLogoClick = () => {
    if (clickCount === 0) {
      onNavigate("home");
    }
    setClickCount((prev) => prev + 1);
    if (clickCount + 1 >= 5) {
      if (isAdminAuthenticated) {
        onNavigate("admin");
      } else {
        onNavigate("admin_login");
      }
      setClickCount(0);
    }
  };

  useEffect(() => {
    if (clickCount > 0) {
      const timer = setTimeout(() => setClickCount(0), 2000);
      return () => clearTimeout(timer);
    }
  }, [clickCount]);

  return (
    <header className="sticky top-0 z-40 bg-paper/95 backdrop-blur-md border-b border-ink/10 px-4 py-2 flex items-center justify-between shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
      <div
        className="flex items-center gap-3 cursor-pointer"
        onClick={handleLogoClick}
      >
        <div className="relative">
          <img
            src={logoUrl || "/logo.png"}
            alt="App Logo"
            className="w-10 h-10 rounded-full shadow-md border-2 border-white object-cover"
            referrerPolicy="no-referrer"
            onError={(e) => { e.currentTarget.src = "/logo.png"; }}
          />
          <div className="absolute -bottom-1 -right-1 bg-green-500 w-3 h-3 rounded-full border-2 border-white"></div>
        </div>
        <h1 className="font-heading text-2xl text-ink tracking-wide mt-1">
          सबदवाणी
        </h1>
      </div>
      <div className="flex items-center gap-4 text-ink-light">
        <button
          onClick={() => onNavigate("search")}
          className="hover:text-ink transition-colors"
        >
          <Search className="w-6 h-6" />
        </button>
        <button
          onClick={onNotificationClick}
          className="hover:text-ink transition-colors relative"
        >
          <Bell className={`w-6 h-6 ${unreadCount > 0 ? "animate-[bell-swing_2s_infinite]" : ""}`} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold flex items-center justify-center rounded-full border-2 border-paper animate-pulse">
              {unreadCount}
            </span>
          )}
        </button>
        <button
          onClick={() => onNavigate("contribute")}
          className="hover:text-ink transition-colors relative"
        >
          <PlusCircle className="w-6 h-6" />
        </button>
      </div>
    </header>
  );
}

function AdBanner({ text, link }: { text: string, link?: string }) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (!text) return;
    const interval = setInterval(() => {
      setIsVisible(prev => !prev);
    }, 30000);
    return () => clearInterval(interval);
  }, [text]);

  if (!text) return null;

  const content = (
    <>
      <span className="bg-ink/10 text-ink px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider">
        AD
      </span>
      <span className="text-xs font-semibold text-ink-light truncate">
        {text}
      </span>
      {link && <ChevronRight className="w-4 h-4 text-ink-light/50 shrink-0" />}
    </>
  );

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-white/90 backdrop-blur-md border-t border-ink/10 p-2 text-center flex items-center justify-center gap-3 shadow-[0_-4px_20px_rgba(0,0,0,0.04)] overflow-hidden"
        >
          {link ? (
            <a href={link} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-3 w-full hover:opacity-80 transition-opacity">
              {content}
            </a>
          ) : (
            <div className="flex items-center justify-center gap-3 w-full">
              {content}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function AudioPlayer({ url, onEnded, onPlay, onPause, autoPlay = false, title = 'सबदवाणी' }: { 
  url: string, 
  onEnded?: () => void, 
  onPlay?: () => void, 
  onPause?: () => void,
  autoPlay?: boolean,
  title?: string
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlay = () => {
      setIsPlaying(true);
      if (onPlay) onPlay();
      if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'playing';
      }
    };

    const handlePause = () => {
      setIsPlaying(false);
      if (onPause) onPause();
      if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'paused';
      }
    };

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: title,
        artist: 'गुरु जम्भेश्वर भगवान',
      });
      navigator.mediaSession.setActionHandler('play', () => audio.play());
      navigator.mediaSession.setActionHandler('pause', () => audio.pause());
    }

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, [url, title, onPlay, onPause]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.load();
      if (autoPlay) {
        // Add a small delay to ensure DOM is ready and user interaction is registered
        timer = setTimeout(() => {
          if (audioRef.current) {
            audioRef.current.play().catch((e) => {
              setIsPlaying(false);
            });
          }
        }, 100);
      } else {
        setIsPlaying(false);
      }
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [url, autoPlay]); // Added autoPlay to dependency array

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(e => {});
      }
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const current = audioRef.current.currentTime;
      const duration = audioRef.current.duration;
      if (duration > 0) {
        setProgress((current / duration) * 100);
      }
    }
  };

  return (
    <div className="bg-gradient-to-br from-paper-light to-white border border-ink/10 rounded-2xl p-4 mb-4 shadow-md flex flex-col gap-3 w-full max-w-md mx-auto">
      <audio
        ref={audioRef}
        src={url || undefined}
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => {
          setIsPlaying(false);
          setProgress(0);
          if (onEnded) onEnded();
        }}
      />
      <div className="flex items-center gap-4">
        <button
          onClick={togglePlay}
          className="bg-gradient-to-r from-accent to-accent-dark text-white p-3.5 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all flex-shrink-0"
        >
          {isPlaying ? (
            <Pause className="w-6 h-6 fill-current" />
          ) : (
            <Play className="w-6 h-6 fill-current ml-1" />
          )}
        </button>
        <div
          className="flex-1 h-3 bg-ink/10 rounded-full overflow-hidden cursor-pointer relative shadow-inner"
          onClick={(e) => {
            if (audioRef.current && audioRef.current.duration) {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = e.clientX - rect.left;
              const clickedValue = x / rect.width;
              audioRef.current.currentTime =
                clickedValue * audioRef.current.duration;
              setProgress(clickedValue * 100);
            }
          }}
        >
          <div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-accent to-accent-dark transition-all duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}


// --- Precise Astronomical Calculations (Top Level) ---

const getJD = (date: Date) => new julian.CalendarGregorian().fromDate(date).toJD();

const getJDE = (jd: number) => {
  const year = new julian.CalendarGregorian().fromJD(jd).toYear();
  return jd + deltat.deltaT(year) / 86400;
};

const getLahiriAyanamsa = (jd: number) => {
  const T = (jd - 2415020.5) / 36525;
  return 22.460848 + 1.396042 * T + 0.000308 * T * T;
};

const getMoonLongitude = (jd: number) => {
  const jde = getJDE(jd);
  const pos = moonposition.position(jde);
  return (pos.lon * 180) / Math.PI;
};

const getSunLongitude = (jd: number) => {
  const jde = getJDE(jd);
  const T = base.J2000Century(jde);
  const lon = solar.apparentLongitude(T);
  return (lon * 180) / Math.PI;
};

const getTithiDiff = (jd: number) => {
  const m = getMoonLongitude(jd);
  const s = getSunLongitude(jd);
  return (m - s + 360) % 360;
};

const findTransition = (
  startJD: number,
  endJD: number,
  target: number,
  func: (jd: number) => number,
) => {
  let low = startJD;
  let high = endJD;
  const v1 = func(low);
  
  for (let i = 0; i < 40; i++) {
    let mid = (low + high) / 2;
    let vMid = func(mid);
    
    let diffMid = (vMid - v1 + 360) % 360;
    let diffTarget = (target - v1 + 360) % 360;
    
    if (diffMid < diffTarget) low = mid;
    else high = mid;
  }
  return (low + high) / 2;
};

const getSiderealSun = (jd: number) => {
  const s = getSunLongitude(jd);
  const a = getLahiriAyanamsa(jd);
  return (s - a + 360) % 360;
};

const getTithiName = (jd: number) => {
  const diff = getTithiDiff(jd);
  const tithiNum = Math.floor(diff / 12) + 1;
  const names = [
    "प्रतिपदा", "द्वितीया", "तृतीया", "चतुर्थी", "पंचमी", "षष्ठी", "सप्तमी", "अष्टमी", "नवमी", "दशमी", "एकादशी", "द्वादशी", "त्रयोदशी", "चतुर्दशी", "पूर्णिमा"
  ];
  
  let paksha = tithiNum <= 15 ? "शुक्ल" : "कृष्ण";
  let nameIndex = (tithiNum - 1) % 15;
  let name = names[nameIndex];
  
  if (tithiNum === 15) name = "पूर्णिमा";
  if (tithiNum === 30) {
    paksha = "कृष्ण";
    name = "अमावस्या";
  }
  
  return `${paksha} ${name}`;
};

const getSamvat = (jd: number) => {
  const date = new julian.CalendarGregorian().fromJD(jd).toDate();
  const year = date.getFullYear();
  
  // Find Phalguna Amavasya of this Gregorian year to determine Samvat transition
  // Phalguna Amavasya is when Sun is in Kumbha (Rashi 10)
  let searchJD = getJD(new Date(year, 1, 15)); // Start searching around Feb 15
  let phalgunaAmavasyaJD = 0;
  
  for (let i = -30; i <= 60; i++) {
    const tJD = searchJD + i;
    const diff = getTithiDiff(tJD);
    if (diff > 350 || diff < 10) {
      const fJD = findTransition(tJD - 2, tJD + 2, 0, getTithiDiff);
      const sSun = getSiderealSun(fJD);
      if (Math.floor(sSun / 30) === 10) {
        phalgunaAmavasyaJD = fJD;
        break;
      }
    }
  }
  
  // Samvat changes after Phalguna Amavasya (at the start of Chaitra Shukla 1)
  if (jd > phalgunaAmavasyaJD) return year + 57;
  return year + 56;
};

// Precise Amavasya Logic
const generateAmavasyaForYear = (year: number) => {
  const amavasyas = [];
  const hindiMonthNames = [
    "वैशाख", "ज्येष्ठ", "आषाढ़", "श्रावण", "भाद्रपद", "आश्विन", 
    "कार्तिक", "मार्गशीर्ष", "पौष", "माघ", "फाल्गुन", "चैत्र"
  ];

  let jd = getJD(new Date(year, 0, 1));
  const endJD = getJD(new Date(year + 1, 0, 15));

  while (jd < endJD) {
    const diff = getTithiDiff(jd);
    if (diff > 340 || diff < 20) {
      const startJD = findTransition(jd - 2, jd + 2, 348, getTithiDiff);
      const finishJD = findTransition(startJD, startJD + 2, 0, getTithiDiff);
      
      const sSun = getSiderealSun(finishJD);
      const rashi = Math.floor(sSun / 30);
      
      amavasyas.push({ startJD, finishJD, rashi });
      jd = finishJD + 25;
    } else {
      jd += 1;
    }
  }

  return amavasyas
    .filter(a => {
      const d = new julian.CalendarGregorian().fromJD(a.startJD).toDate();
      return d.getFullYear() === year;
    })
    .map((a, idx, arr) => {
      const startDate = new julian.CalendarGregorian().fromJD(a.startJD).toDate();
      const endDate = new julian.CalendarGregorian().fromJD(a.finishJD).toDate();
      
      let monthName = hindiMonthNames[a.rashi];
      
      // Adhik Maas: Two Amavasyas in the same Rashi
      const isAdhik = arr[idx + 1] && arr[idx + 1].rashi === a.rashi;
      const wasAdhik = arr[idx - 1] && arr[idx - 1].rashi === a.rashi;
      
      if (isAdhik) monthName = "अधिक " + monthName;
      else if (wasAdhik) monthName = "शुद्ध " + monthName;
      
      const samvat = getSamvat(a.finishJD);

      return {
        hindiMonth: monthName,
        gregorianMonth: format(startDate, "MMMM", { locale: hi }),
        sub: `विक्रम संवत ${samvat}`,
        start: format(startDate, "dd MMMM, EEEE, hh:mm:ss a", { locale: hi }),
        end: format(endDate, "dd MMMM, EEEE, hh:mm:ss a", { locale: hi }),
        startDate,
        endDate,
      };
    });
};

// Precise Bichhuda Logic
const getBichhudaList = (year: number) => {
  const list = [];
  let jd = getJD(new Date(year, 0, 1));
  const endJD = getJD(new Date(year + 1, 0, 5));

  const getSiderealMoon = (jd: number) => {
    const m = getMoonLongitude(jd);
    const a = getLahiriAyanamsa(jd);
    return (m - a + 360) % 360;
  };

  while (jd < endJD) {
    const sMoon = getSiderealMoon(jd);
    // Scorpio is 210 to 240
    if (sMoon > 200 && sMoon < 215) {
      const startJD = findTransition(jd - 1, jd + 1, 210, getSiderealMoon);
      const finishJD = findTransition(startJD, startJD + 3, 240, getSiderealMoon);

      const startDate = new julian.CalendarGregorian().fromJD(startJD).toDate();
      const endDate = new julian.CalendarGregorian().fromJD(finishJD).toDate();

      if (startDate.getFullYear() === year) {
        list.push({
          monthName: format(startDate, "MMMM", { locale: hi }),
          start: format(startDate, "dd MMMM, EEEE, hh:mm:ss a", { locale: hi }),
          end: format(endDate, "dd MMMM, EEEE, hh:mm:ss a", { locale: hi }),
          isUpcoming: endDate > new Date(),
          rawStart: startDate,
        });
      }
      jd = finishJD + 20; // Skip to next month
    } else {
      jd += 0.5;
    }
  }
  return list;
};

const PremiumBanner = ({ meles, badhais, dailyThought }: any) => {
  const greetings = useMemo(() => {
    return (badhais || []).filter((b: any) => b.isActive).map((b: any) => ({
      text: b.text,
      sender: b.name,
      imageUrl: b.photoUrl
    }));
  }, [badhais]);

  const [currentBanner, setCurrentBanner] = useState<"flash" | "badhai" | "thought">("thought");
  const [flashAlert, setFlashAlert] = useState<any>(null);
  const [greetingIndex, setGreetingIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Generate Amavasya list for current and next year to ensure we don't miss upcoming ones at year-end
  const bannerAmavasyaList = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return [
      ...generateAmavasyaForYear(currentYear),
      ...generateAmavasyaForYear(currentYear + 1)
    ];
  }, []);

  useEffect(() => {
    // Check for Flash Alert
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const upcomingMelaDays = new Date(today);
    upcomingMelaDays.setDate(today.getDate() + 7); // Mela for 7 days

    const upcomingAmavasyaDays = new Date(today);
    upcomingAmavasyaDays.setDate(today.getDate() + 7); // Amavasya for 7 days

    let foundMela = null;
    let foundAmavasya = null;

    // Check Meles
    let closestMela = null;
    let minMelaDiffDays = Infinity;

    for (const mela of meles) {
      if (!mela.dateStr || typeof mela.dateStr !== 'string') continue;
      const [year, month, day] = mela.dateStr.split('-').map(Number);
      const melaDate = new Date(year, month - 1, day);
      if (melaDate >= today && melaDate <= upcomingMelaDays) {
        const diffTime = melaDate.getTime() - today.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays >= 0 && diffDays < minMelaDiffDays) {
          minMelaDiffDays = diffDays;
          closestMela = { ...mela, diffDays };
        }
      }
    }
    foundMela = closestMela;

    // Check Amavasya
    for (const amavasya of bannerAmavasyaList) {
      if (!amavasya.startDate || !amavasya.endDate) continue;
      
      const startDay = new Date(amavasya.startDate);
      startDay.setHours(0,0,0,0);
      
      const endDay = new Date(amavasya.endDate);
      endDay.setHours(23,59,59,999);
      
      // If today is within the Amavasya period, it's today (diffDays = 0)
      if (today >= startDay && today <= endDay) {
        foundAmavasya = { ...amavasya, diffDays: 0 };
        break;
      }
      
      // If it's in the future
      if (startDay > today && startDay <= upcomingAmavasyaDays) {
        const diffTime = startDay.getTime() - today.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
        foundAmavasya = { ...amavasya, diffDays };
        break;
      }
    }

    if (foundMela || foundAmavasya) {
      setFlashAlert({
        mela: foundMela ? {
          name: foundMela.name,
          diffDays: foundMela.diffDays,
          location: foundMela.location || "जांगलू"
        } : null,
        amavasya: foundAmavasya ? {
          diffDays: foundAmavasya.diffDays,
          start: foundAmavasya.start,
          end: foundAmavasya.end
        } : null
      });
      setCurrentBanner("flash");
    } else {
      setCurrentBanner(greetings.length > 0 ? "badhai" : "thought");
    }
  }, [meles, bannerAmavasyaList, greetings]);

  useEffect(() => {
    if (!isHovered) {
      const timer = setInterval(() => {
        let nextBanner: "flash" | "badhai" | "thought" = "thought";
        if (currentBanner === "flash") {
          nextBanner = greetings.length > 0 ? "badhai" : "thought";
        } else if (currentBanner === "badhai") {
          nextBanner = "thought";
        } else {
          if (flashAlert) nextBanner = "flash";
          else nextBanner = greetings.length > 0 ? "badhai" : "thought";
        }
        
        if (nextBanner === "badhai" && greetings.length > 0) {
          setGreetingIndex(prev => {
            if (greetings.length <= 1) return 0;
            let next = Math.floor(Math.random() * greetings.length);
            while (next === prev) {
              next = Math.floor(Math.random() * greetings.length);
            }
            return next;
          });
        }
        setCurrentBanner(nextBanner);
      }, 7000);
      return () => clearInterval(timer);
    }
  }, [greetings, isHovered, flashAlert, currentBanner]);

  return (
    <div 
      className="mx-4 my-1.5 h-[110px] relative cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={() => setIsHovered(true)}
      onTouchEnd={() => setIsHovered(false)}
    >
      <AnimatePresence mode="wait">
        {currentBanner === "flash" && flashAlert && (
          <motion.div
            key="flashAlert"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.5 }}
            className="absolute inset-0 p-4 bg-gradient-to-br from-accent to-accent-dark rounded-3xl text-white shadow-[0_8px_30px_rgba(230,138,0,0.2)] flex flex-col justify-center overflow-hidden border border-white/10"
          >
            <div className="absolute -right-4 -top-4 opacity-10 pointer-events-none">
              <CalendarDays className="w-32 h-32" />
            </div>
            
            <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-red-500/90 text-white text-[10px] font-bold px-3 py-0.5 rounded-b-lg shadow-md z-20 flex items-center gap-1 border border-t-0 border-white/20">
              <Bell className="w-3 h-3 animate-pulse" /> आगामी सूचना
            </div>
            
            <div className="relative z-10 flex flex-col justify-center items-center h-full w-full pt-3">
              <div className="flex items-center justify-center w-full gap-0 px-1">
                
                {/* Case 1: Both Mela and Amavasya exist */}
                {flashAlert.mela && flashAlert.amavasya ? (
                  <div className="flex items-center justify-around w-full gap-2">
                    {/* Left Side: Mela */}
                    <div className="flex flex-col items-center text-center max-w-[48%]">
                      <Flame className="w-5 h-5 text-yellow-400 mb-1 fill-current" />
                      <p className="text-[11px] font-bold leading-tight">
                        {flashAlert.mela.name} {flashAlert.mela.diffDays === 0 ? "आज है।" : flashAlert.mela.diffDays === 1 ? "कल है।" : `${flashAlert.mela.diffDays} दिन बाद है।`}
                      </p>
                      <p className="text-[9px] opacity-90 w-full mt-0.5 whitespace-normal break-words line-clamp-2">
                        स्थान: {flashAlert.mela.location}
                      </p>
                    </div>
                    
                    <div className="w-px h-12 bg-white/20 shrink-0" />
                    
                    {/* Right Side: Amavasya */}
                    <div className="flex flex-col items-center text-center max-w-[48%]">
                      <div className="text-sm mb-1">🌙</div>
                      <p className="text-[11px] font-bold leading-tight">
                        अमावस्या {flashAlert.amavasya.diffDays === 0 ? "आज है।" : flashAlert.amavasya.diffDays === 1 ? "कल है।" : `${flashAlert.amavasya.diffDays} दिन बाद है।`}
                      </p>
                      <div className="flex flex-col items-center mt-0.5">
                        <p className="text-[8px] opacity-90 leading-tight">
                          प्रारम्भ: {flashAlert.amavasya.start}
                        </p>
                        <p className="text-[8px] opacity-90 leading-tight mt-0.5">
                          समाप्त: {flashAlert.amavasya.end}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : flashAlert.mela ? (
                  /* Case 2: Only Mela exists */
                  <div className="flex flex-col items-center justify-center text-center">
                    <Flame className="w-6 h-6 text-yellow-400 mb-1.5 fill-current drop-shadow-md" />
                    <p className="text-[13px] font-bold leading-tight drop-shadow-sm">
                      {flashAlert.mela.name} {flashAlert.mela.diffDays === 0 ? "आज है।" : flashAlert.mela.diffDays === 1 ? "कल है।" : `${flashAlert.mela.diffDays} दिन बाद है।`}
                    </p>
                    <p className="text-[10px] opacity-90 mt-0.5 font-medium">
                      स्थान: {flashAlert.mela.location}
                    </p>
                  </div>
                ) : flashAlert.amavasya ? (
                  /* Case 3: Only Amavasya exists */
                  <div className="flex flex-col items-center justify-center text-center">
                    <div className="text-xs mb-1">🌙</div>
                    <p className="text-[13px] font-bold leading-tight drop-shadow-sm mb-1.5">
                      अमावस्या {flashAlert.amavasya.diffDays === 0 ? "आज है।" : flashAlert.amavasya.diffDays === 1 ? "कल है।" : `${flashAlert.amavasya.diffDays} दिन बाद है।`}
                    </p>
                    <div className="flex items-center justify-center gap-2 text-[8px] bg-white/10 px-3 py-1 rounded-xl border border-white/10 whitespace-nowrap">
                      <p className="opacity-90">
                        <span className="text-yellow-100 font-bold">प्रारम्भ:</span> {flashAlert.amavasya.start}
                      </p>
                      <div className="w-px h-2.5 bg-white/20" />
                      <p className="opacity-90">
                        <span className="text-yellow-100 font-bold">समाप्त:</span> {flashAlert.amavasya.end}
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
            
            <motion.div 
              initial={{ width: "100%" }} 
              animate={{ width: "0%" }} 
              transition={{ duration: 15, ease: "linear" }}
              className="absolute bottom-0 left-0 h-1.5 bg-gradient-to-r from-yellow-200 to-yellow-500 rounded-b-[2rem]"
            />
          </motion.div>
        )}

        {currentBanner === "badhai" && greetings.length > 0 && (
          <motion.div
            key={`badhai-${greetingIndex}`}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.5 }}
            className="absolute inset-0 p-2.5 bg-gradient-to-br from-accent to-accent-dark rounded-[2.5rem] text-white shadow-[0_15px_35px_rgba(230,138,0,0.3)] flex items-center overflow-hidden border-2 border-white/30"
          >
            <div className="absolute -right-4 -top-4 opacity-10"><Users className="w-24 h-24" /></div>
            <div className="absolute -left-6 -bottom-6 opacity-5 rotate-12"><Flame className="w-32 h-32" /></div>
            
            {/* Decorative Sparkles */}
            <div className="absolute top-2 right-10 text-yellow-200/40 animate-sparkle" style={{ animationDelay: '0.2s' }}><Sun className="w-3 h-3" /></div>
            <div className="absolute bottom-4 left-1/2 text-yellow-200/30 animate-sparkle" style={{ animationDelay: '0.8s' }}><Sun className="w-2 h-2" /></div>
            <div className="absolute top-10 left-4 text-yellow-200/20 animate-sparkle" style={{ animationDelay: '1.5s' }}><Sun className="w-4 h-4" /></div>
            
            <div className="relative z-10 flex gap-4 w-full h-full items-center">
              <div className="shrink-0 w-[28%] h-full flex items-center justify-center relative">
                <div className="absolute inset-0 bg-white/30 rounded-2xl rotate-3 scale-105 blur-[1px]"></div>
                <div className="absolute inset-0 bg-accent-dark/20 rounded-2xl -rotate-2 scale-105"></div>
                <img 
                  src={(greetings[greetingIndex] || greetings[0]).imageUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent((greetings[greetingIndex] || greetings[0]).sender || 'User')}`} 
                  alt="Profile" 
                  className="w-full h-full object-cover rounded-2xl border-2 border-white shadow-xl bg-white/20 relative z-10" 
                  referrerPolicy="no-referrer" 
                  onError={(e) => { e.currentTarget.src = "/logo.png"; }}
                />
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-70 z-20"></div>
                <div className="absolute -bottom-1 -right-1 bg-yellow-400 p-1 rounded-full shadow-lg z-30 border border-white">
                  <CheckCircle className="w-3 h-3 text-accent-dark" />
                </div>
              </div>
              
              <div className="flex-1 flex flex-col justify-center items-start text-left h-full py-1 pr-3 overflow-hidden">
                <div className="flex items-center gap-2 mb-1.5 w-full">
                  <h3 className="font-heading text-[10px] sm:text-[12px] tracking-wide drop-shadow-md text-yellow-200 uppercase font-black leading-tight truncate w-full">
                    {(greetings[greetingIndex] || greetings[0]).sender || "बधाई संदेश"}
                  </h3>
                </div>
                <div className="w-full">
                  <p className="text-[10px] sm:text-[12px] font-bold leading-[1.3] line-clamp-4 w-full opacity-100 italic font-serif text-white drop-shadow-sm break-words">
                    {(greetings[greetingIndex] || greetings[0]).text}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {currentBanner === "thought" && (
          <motion.div
            key="thought"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 bg-gradient-to-br from-accent to-accent-dark text-white rounded-[2rem] shadow-[0_8px_30px_rgba(230,138,0,0.2)] overflow-hidden p-4"
          >
            <div className="absolute -right-4 -top-4 opacity-10">
              <Sun className="w-24 h-24" />
            </div>
            <div className="relative z-10 h-full flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-1 opacity-90">
                <Quote className="w-4 h-4" />
                <h3 className="text-[10px] font-bold tracking-wider uppercase">
                  आज का सुविचार
                </h3>
              </div>
              <p className="text-sm md:text-base font-medium leading-snug line-clamp-2 break-words">
                "{typeof dailyThought === 'string' ? dailyThought : dailyThought?.text || ""}"
              </p>
              <p className="text-[10px] opacity-80 text-right font-semibold mt-1">
                - {dailyThought?.author || "गुरु जम्भेश्वर"}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

function MainApp() {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const [currentScreen, setCurrentScreen] = useState<Screen>("home");
  const [selectedSabad, setSelectedSabad] = useState<SabadItem | null>(null);
  const [fontSize, setFontSize] = useState(18);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [slideDir, setSlideDir] = useState(1);
  const [hasSeenSwipeHint, setHasSeenSwipeHint] = useState(() => {
    return localStorage.getItem("hasSeenSwipeHint") === "true";
  });

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
    const savedLastRead = localStorage.getItem("lastReadSabad");
    if (savedLastRead) {
      try {
        const parsed = JSON.parse(savedLastRead);
        if (parsed && parsed.sabad && parsed.screen === targetScreen && parsed.category === category) {
          setSelectedSabad(parsed.sabad);
          if (category) setSelectedCategory(category);
          navigateTo(targetScreen);
          return;
        }
      } catch (e) {}
    }
    
    if (category) setSelectedCategory(category);
    navigateTo(listScreen);
  };

  const [bookmarks, setBookmarks] = useState<string[]>(() => {
    const saved = localStorage.getItem("shabad_bookmarks");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem("shabad_bookmarks", JSON.stringify(bookmarks));
  }, [bookmarks]);

  const toggleBookmark = (id: string) => {
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
  const [sabads, setSabads] = useState<SabadItem[]>([]);
  const [aartis, setAartis] = useState<SabadItem[]>([]);
  const [bhajans, setBhajans] = useState<SabadItem[]>([]);
  const [sakhis, setSakhis] = useState<SabadItem[]>([]);
  const [mantras, setMantras] = useState<SabadItem[]>([]);
  const [thoughts, setThoughts] = useState<any[]>([]);
  const [greetings, setGreetings] = useState<any[]>([]);
  const [badhais, setBadhais] = useState<any[]>([]);
  const [meles, setMeles] = useState<any[]>([]);

  const [autoPlayAudio, setAutoPlayAudio] = useState(false);

  const [pendingPosts, setPendingPosts] = useState<SabadItem[]>([]);
  const [approvedPosts, setApprovedPosts] = useState<SabadItem[]>([]);

  useEffect(() => {
    if (!db) return;

    const sortItems = (items: SabadItem[]) => {
      return items.sort((a, b) => {
        // Try to sort by sequence field if it exists
        if (a.sequence !== undefined && b.sequence !== undefined) {
          return a.sequence - b.sequence;
        }
        if (a.sequence !== undefined) return -1;
        if (b.sequence !== undefined) return 1;
        
        // Fallback to extracting numbers from title
        const numA = parseInt(a.title.match(/\d+/)?.[0] || "999999");
        const numB = parseInt(b.title.match(/\d+/)?.[0] || "999999");
        if (numA !== numB) return numA - numB;
        return a.title.localeCompare(b.title);
      });
    };

    const normalizeText = (text: any): string => {
      if (typeof text === 'string') return text;
      if (Array.isArray(text)) {
        return text.map(t => normalizeText(t)).join('\n');
      }
      if (typeof text === 'object' && text !== null) {
        return normalizeText(text.text);
      }
      return String(text || '');
    };

    const unsubSabads = onSnapshot(collection(db, "shabads"), (snapshot) => {
      if (!snapshot.empty) {
        const fetched = snapshot.docs.map((doc) => {
          const data = doc.data();
          let title = normalizeText(data.title);
          title = title.replace(/^\|\|\s*/, "").replace(/\s*\|\|$/, "");
          return { id: doc.id, ...data, title, text: normalizeText(data.text) } as SabadItem;
        });
        setSabads(sortItems(fetched));
      } else {
        setSabads([]);
      }
    });
    const unsubAartis = onSnapshot(collection(db, "aartis"), (snapshot) => {
      if (!snapshot.empty) {
        const fetched = snapshot.docs.map((doc) => {
          const data = doc.data();
          let title = normalizeText(data.title);
          title = title.replace(/^\|\|\s*/, "").replace(/\s*\|\|$/, "");
          return { id: doc.id, ...data, title, text: normalizeText(data.text) } as SabadItem;
        });
        setAartis(sortItems(fetched));
      } else {
        setAartis([]);
      }
    });
    const unsubBhajans = onSnapshot(collection(db, "bhajans"), (snapshot) => {
      if (!snapshot.empty) {
        const fetched = snapshot.docs.map((doc) => {
          const data = doc.data();
          let title = normalizeText(data.title);
          title = title.replace(/^\|\|\s*/, "").replace(/\s*\|\|$/, "");
          return { id: doc.id, ...data, title, text: normalizeText(data.text) } as SabadItem;
        });
        setBhajans(sortItems(fetched));
      } else {
        setBhajans([]);
      }
    });
    const unsubSakhis = onSnapshot(collection(db, "sakhis"), (snapshot) => {
      if (!snapshot.empty) {
        const fetched = snapshot.docs.map((doc) => {
          const data = doc.data();
          let title = normalizeText(data.title);
          title = title.replace(/^\|\|\s*/, "").replace(/\s*\|\|$/, "");
          return { id: doc.id, ...data, title, text: normalizeText(data.text) } as SabadItem;
        });
        setSakhis(sortItems(fetched));
      } else {
        setSakhis([]);
      }
    });
    const unsubMantras = onSnapshot(collection(db, "mantras"), (snapshot) => {
      if (!snapshot.empty) {
        const fetched = snapshot.docs.map((doc) => {
          const data = doc.data();
          let title = normalizeText(data.title);
          title = title.replace(/^\|\|\s*/, "").replace(/\s*\|\|$/, "");
          const text = normalizeText(data.text);
          if (!title && text) {
            title = text.split('\n')[0].substring(0, 30) + "...";
          }
          return { id: doc.id, ...data, title, text } as SabadItem;
        });
        setMantras(sortItems(fetched));
      } else {
        setMantras([]);
      }
    });
    const unsubThoughts = onSnapshot(collection(db, "thoughts"), (snapshot) => {
      if (!snapshot.empty) {
        setThoughts(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data(), text: normalizeText(doc.data().text) })));
      } else {
        setThoughts([]);
      }
    });
    const unsubGreetings = onSnapshot(collection(db, "greetings"), (snapshot) => {
      if (!snapshot.empty) {
        setGreetings(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data(), text: normalizeText(doc.data().text) } as any)));
      } else {
        setGreetings([]);
      }
    });
    const unsubMeles = onSnapshot(collection(db, "meles"), (snapshot) => {
      if (!snapshot.empty) {
        setMeles(snapshot.docs.map((doc) => {
          const data = doc.data();
          return { id: doc.id, ...data, name: normalizeText(data.name), desc: normalizeText(data.desc), location: normalizeText(data.location) } as any;
        }));
      } else {
        setMeles([]);
      }
    });
    const unsubBadhais = onSnapshot(collection(db, "badhais"), (snapshot) => {
      if (!snapshot.empty) {
        setBadhais(snapshot.docs.map((doc) => {
          const data = doc.data();
          return { id: doc.id, ...data, name: normalizeText(data.name), text: normalizeText(data.text) } as any;
        }));
      } else {
        setBadhais([]);
      }
    });
    const unsubPending = onSnapshot(collection(db, "pendingPosts"), (snapshot) => {
      if (!snapshot.empty) {
        setPendingPosts(snapshot.docs.map((doc) => {
          const data = doc.data();
          return { id: doc.id, ...data, title: normalizeText(data.title), text: normalizeText(data.text) } as SabadItem;
        }));
      } else {
        setPendingPosts([]);
      }
    });
    const unsubApproved = onSnapshot(collection(db, "approvedPosts"), (snapshot) => {
      if (!snapshot.empty) {
        setApprovedPosts(snapshot.docs.map((doc) => {
          const data = doc.data();
          return { id: doc.id, ...data, title: normalizeText(data.title), text: normalizeText(data.text) } as SabadItem;
        }));
      } else {
        setApprovedPosts([]);
      }
    });
    const unsubSettings = onSnapshot(doc(db, "settings", "general"), (doc) => {
      if (doc.exists()) {
        setSettings((prev) => ({ ...prev, ...doc.data() }));
      }
    });

    return () => {
      unsubSabads();
      unsubAartis();
      unsubBhajans();
      unsubSakhis();
      unsubMantras();
      unsubThoughts();
      unsubGreetings();
      unsubMeles();
      unsubPending();
      unsubApproved();
      unsubSettings();
    };
  }, []);

  // --- Daily Thought ---
  const [dailyThought, setDailyThought] = useState<any>(thoughts[0] || { text: "गुरु जम्भेश्वर भगवान की जय", author: "गुरु जम्भेश्वर" });

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
      setDailyThought({ text: "गुरु जम्भेश्वर भगवान की जय", author: "गुरु जम्भेश्वर" });
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
    try {
      if (!db) return;
      await updateDoc(doc(db, "notifications", id), { read: true });
    } catch (e) {
      showToast("सूचना को अपडेट करने में त्रुटि हुई।");
    }
  };

  const markAllRead = async () => {
    localStorage.setItem("hasSeenWelcome", "true");
    if (!db) return;
    try {
      const unread = notifications.filter(n => !n.read && n.id !== "welcome");
      const batch = unread.map(n => updateDoc(doc(db, "notifications", n.id), { read: true }));
      await Promise.all(batch);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      showToast("सभी सूचनाओं को अपडेट करने में त्रुटि हुई।");
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

  const [settings, setSettings] = useState<AppSettings>({
    logoUrl:
      "https://api.dicebear.com/7.x/shapes/svg?seed=shabadwani&backgroundColor=e68a00",
    qrCodeUrl:
      "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=sabadwani@upi&pn=Sabadwani",
    adText: "प्रीमियम पूजा सामग्री और साहित्य खरीदें - 20% छूट",
    upiId: "shabadwani@upi",
    isAdEnabled: true,
    jaapAudioUrl: "https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3", // Default placeholder
  });

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
      jaapAudioRef.current.play().catch(e => {});
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
        // Ignore speech synthesis errors
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
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editItemData, setEditItemData] = useState<any>(null);
  const [editAudioError, setEditAudioError] = useState("");
  const [editPhotoError, setEditPhotoError] = useState("");
  const [confirmDialog, setConfirmDialog] = useState<{isOpen: boolean, title: string, message: string, onConfirm: () => void} | null>(null);

  const toggleBadhaiStatus = async (id: string, currentStatus: boolean) => {
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
    if (editAudioError || editPhotoError) {
      showToast("कृपया पहले फाइल से जुड़ी त्रुटि को ठीक करें।");
      return;
    }
    if (!navigator.onLine) {
      showToast("आप अभी ऑफ़लाइन हैं। कृपया इंटरनेट कनेक्शन की जांच करें।");
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
        });
      } else if (editItemData.type === "मंत्र") {
        await updateDoc(doc(db, "mantras", editItemData.id), {
          title: editItemData.title,
          text: editItemData.text,
          audioUrl: finalAudioUrl,
          sequence: editItemData.sequence !== undefined ? Number(editItemData.sequence) : null,
        });
      } else if (editItemData.type === "आरती") {
        await updateDoc(doc(db, "aartis", editItemData.id), {
          title: editItemData.title,
          text: editItemData.text,
          audioUrl: finalAudioUrl,
          sequence: editItemData.sequence !== undefined ? Number(editItemData.sequence) : null,
        });
      } else if (editItemData.type === "भजन") {
        await updateDoc(doc(db, "bhajans", editItemData.id), {
          title: editItemData.title,
          text: editItemData.text,
          audioUrl: finalAudioUrl,
          sequence: editItemData.sequence !== undefined ? Number(editItemData.sequence) : null,
        });
      } else if (editItemData.type === "साखी") {
        await updateDoc(doc(db, "sakhis", editItemData.id), {
          title: editItemData.title,
          text: editItemData.text,
          audioUrl: finalAudioUrl,
          sequence: editItemData.sequence !== undefined ? Number(editItemData.sequence) : null,
        });
      } else if (editItemData.type === "सुविचार") {
        if (editItemData.id) {
          await updateDoc(doc(db, "thoughts", editItemData.id), {
            text: editItemData.text,
            author: editItemData.author || "गुरु जम्भेश्वर",
          });
        }
      } else if (editItemData.type === "मेले") {
        await updateDoc(doc(db, "meles", editItemData.id), {
          name: editItemData.name,
          dateStr: editItemData.dateStr,
          location: editItemData.location,
          desc: editItemData.desc,
        });
      } else if (editItemData.type === "बधाई संदेश") {
        await updateDoc(doc(db, "badhais", editItemData.id), {
          name: editItemData.name,
          photoUrl: finalPhotoUrl,
          text: editItemData.text,
          isActive: editItemData.isActive,
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

  const handleDelete = async (type: string, id: string, index?: number) => {
    if (!navigator.onLine) {
      showToast("आप अभी ऑफ़लाइन हैं। कृपया इंटरनेट कनेक्शन की जांच करें।");
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
            "बधाई संदेश": "badhais"
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
    if (!navigator.geolocation) {
      showToast("आपका ब्राउज़र लोकेशन सपोर्ट नहीं करता है।");
      return;
    }
    setChoghadiyaLoading(true);
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
          calculateChoghadiya(resolvedName, choghadiyaDate);
        } catch (error) {
          setChoghadiyaError("लोकेशन प्राप्त करने में त्रुटि।");
          setChoghadiyaLoading(false);
        }
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setChoghadiyaError("लोकेशन की अनुमति नहीं मिली। कृपया सेटिंग्स में जाकर अनुमति दें।");
        } else {
          setChoghadiyaError("लोकेशन प्राप्त करने में त्रुटि।");
        }
        setChoghadiyaLoading(false);
      },
    );
  };

  // --- Precise Astronomical Calculations ---
  
  const calculateChoghadiya = async (
    loc = choghadiyaLocation,
    dateStr = choghadiyaDate,
  ) => {
    setChoghadiyaLoading(true);
    setChoghadiyaError("");
    try {
      let lat = 28.0229; // Default Bikaner
      let lon = 73.3119;

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
        console.warn("Geo lookup failed, using defaults");
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
  const processedMeles = meles
    .filter((mela) => mela.dateStr && typeof mela.dateStr === 'string')
    .map((mela) => {
      const [year, month, day] = mela.dateStr.split('-').map(Number);
      const melaDate = new Date(year, month - 1, day);
      return {
        ...mela,
        dateFormatted: melaDate.toLocaleDateString("hi-IN", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }),
        upcoming: melaDate >= new Date(new Date().setHours(0,0,0,0)),
      };
    })
    .sort(
      (a, b) => {
        if (!a.dateStr || !b.dateStr || typeof a.dateStr !== 'string' || typeof b.dateStr !== 'string') return 0;
        const [aY, aM, aD] = a.dateStr.split('-').map(Number);
        const [bY, bM, bD] = b.dateStr.split('-').map(Number);
        return new Date(aY, aM - 1, aD).getTime() - new Date(bY, bM - 1, bD).getTime();
      }
    );

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
    else if (currentScreen === "community_posts") currentList = approvedPosts;

    const currentIndex = currentList.findIndex(
      (item) => item.id === selectedSabad.id,
    );
    if (currentIndex === -1) return;

    if (direction === "left" && currentIndex < currentList.length - 1) {
      // Swipe Left -> Next Item
      setSlideDir(1);
      setSelectedSabad(currentList[currentIndex + 1]);
    } else if (direction === "right" && currentIndex > 0) {
      // Swipe Right -> Prev Item
      setSlideDir(-1);
      setSelectedSabad(currentList[currentIndex - 1]);
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

  const navigateTo = (screen: Screen) => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setCurrentScreen(screen);
    setShowNotifications(false);
  };

  const handleSabadClick = (shabad: SabadItem) => {
    setSelectedSabad(shabad);
    setIsBookmarked(false);
    navigateTo("reading");
  };

  const handleBack = () => {
    if (currentScreen === "reading") navigateTo("shabad_list");
    else if (currentScreen === "shabad_list") navigateTo("home");
    else if (currentScreen === "audio_reading") navigateTo("category_list");
    else if (currentScreen === "community_posts") navigateTo("home");
    else if (currentScreen === "admin_login") navigateTo("home");
    else navigateTo("home");
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: selectedSabad?.title || "सबदवाणी",
          text:
            "सबदवाणी ऐप से यह पाठ पढ़ें:\n\n" +
            (selectedSabad?.text || "").substring(0, 100) +
            "...",
          url: window.location.href,
        });
      } catch (error) {
        // Ignore share cancellation or errors
      }
    } else {
      showToast("लिंक कॉपी कर लिया गया है!");
    }
  };

  const handleContributeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (contribAudioError) {
      showToast("कृपया पहले ऑडियो से जुड़ी त्रुटि को ठीक करें।");
      return;
    }
    if (!navigator.onLine) {
      showToast("आप अभी ऑफलाइन हैं। इंटरनेट चालू होने पर प्रयास करें।");
      return;
    }
    if (parseInt(captchaAnswer) !== captchaExpected) {
      showToast("कृपया सही सुरक्षा कोड (Captcha) दर्ज करें।");
      generateCaptcha();
      return;
    }
    if (!db) {
      showToast("Firebase is not configured. Please set the API keys.");
      return;
    }
    
    setIsSubmitting(true);
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
    if (!navigator.onLine) {
      showToast("आप अभी ऑफ़लाइन हैं। कृपया इंटरनेट कनेक्शन की जांच करें।");
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
    if (!navigator.onLine) {
      showToast("आप अभी ऑफ़लाइन हैं। कृपया इंटरनेट कनेक्शन की जांच करें।");
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
        audioUrl: post.audioUrl,
        author: post.author,
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
    if (!navigator.onLine) {
      showToast("आप अभी ऑफ़लाइन हैं। कृपया इंटरनेट कनेक्शन की जांच करें।");
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
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="h-[calc(100dvh-150px)] overflow-hidden flex flex-col"
          >
            {/* Premium Rotating Banner System */}
            <div className="shrink-0">
              <PremiumBanner 
                meles={meles} 
                badhais={badhais} 
                dailyThought={dailyThought} 
              />
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
            <div className="grid grid-cols-3 gap-1 px-4 mt-0.5 flex-1 overflow-y-auto pb-4 scrollbar-hide">
              {/* 1. Sabadwani */}
              <button
                onClick={() => handleOpenCategory("reading", "shabad_list")}
                className="flex flex-col items-center justify-center p-2.5 bg-white/80 backdrop-blur-sm rounded-2xl border border-ink/5 hover:bg-white hover:shadow-md transition-all shadow-sm group"
              >
                <div className="bg-accent/10 p-2 rounded-xl mb-1.5 group-hover:bg-accent/20 transition-colors group-hover:scale-110 duration-300">
                  <Book className="w-5 h-5 text-accent-dark" />
                </div>
                <span className="text-[10px] font-bold text-ink text-center leading-tight">
                  संपूर्ण
                  <br />
                  सबदवाणी
                </span>
              </button>

              {/* 2. Amavasya */}
              <button
                onClick={() => navigateTo("amavasya")}
                className="flex flex-col items-center justify-center p-2.5 bg-white/80 backdrop-blur-sm rounded-2xl border border-ink/5 hover:bg-white hover:shadow-md transition-all shadow-sm group"
              >
                <div className="bg-accent/10 p-2 rounded-xl mb-1.5 group-hover:bg-accent/20 transition-colors group-hover:scale-110 duration-300">
                  <CalendarDays className="w-5 h-5 text-accent-dark" />
                </div>
                <span className="text-[10px] font-bold text-ink text-center leading-tight">
                  अमावस्या
                  <br />
                  दर्शन
                </span>
              </button>

              {/* 3. Aarti */}
              <button
                onClick={() => handleOpenCategory("audio_reading", "category_list", "aarti")}
                className="flex flex-col items-center justify-center p-2.5 bg-white/80 backdrop-blur-sm rounded-2xl border border-ink/5 hover:bg-white hover:shadow-md transition-all shadow-sm group"
              >
                <div className="bg-accent/10 p-2 rounded-xl mb-1.5 group-hover:bg-accent/20 transition-colors group-hover:scale-110 duration-300">
                  <Music className="w-5 h-5 text-accent-dark" />
                </div>
                <span className="text-[10px] font-bold text-ink text-center leading-tight">
                  आरती
                  <br />
                  संग्रह
                </span>
              </button>

              {/* 4. Bhajan */}
              <button
                onClick={() => handleOpenCategory("audio_reading", "category_list", "bhajan")}
                className="flex flex-col items-center justify-center p-2.5 bg-white/80 backdrop-blur-sm rounded-2xl border border-ink/5 hover:bg-white hover:shadow-md transition-all shadow-sm group"
              >
                <div className="bg-accent/10 p-2 rounded-xl mb-1.5 group-hover:bg-accent/20 transition-colors group-hover:scale-110 duration-300">
                  <Music className="w-5 h-5 text-accent-dark" />
                </div>
                <span className="text-[10px] font-bold text-ink text-center leading-tight">
                  भजन
                  <br />
                  संग्रह
                </span>
              </button>

              {/* 5. Sakhi */}
              <button
                onClick={() => handleOpenCategory("audio_reading", "category_list", "sakhi")}
                className="flex flex-col items-center justify-center p-2.5 bg-white/80 backdrop-blur-sm rounded-2xl border border-ink/5 hover:bg-white hover:shadow-md transition-all shadow-sm group"
              >
                <div className="bg-accent/10 p-2 rounded-xl mb-1.5 group-hover:bg-accent/20 transition-colors group-hover:scale-110 duration-300">
                  <BookOpenText className="w-5 h-5 text-accent-dark" />
                </div>
                <span className="text-[10px] font-bold text-ink text-center leading-tight">
                  साखी
                  <br />
                  संग्रह
                </span>
              </button>

              {/* 6. Mantra */}
              <button
                onClick={() => handleOpenCategory("audio_reading", "category_list", "mantra")}
                className="flex flex-col items-center justify-center p-2.5 bg-white/80 backdrop-blur-sm rounded-2xl border border-ink/5 hover:bg-white hover:shadow-md transition-all shadow-sm group"
              >
                <div className="bg-accent/10 p-2 rounded-xl mb-1.5 group-hover:bg-accent/20 transition-colors group-hover:scale-110 duration-300">
                  <Music className="w-5 h-5 text-accent-dark" />
                </div>
                <span className="text-[10px] font-bold text-ink text-center leading-tight">
                  गुरु
                  <br />
                  मंत्र
                </span>
              </button>

              {/* 7. Jap Mala */}
              <button
                onClick={() => navigateTo("mala")}
                className="flex flex-col items-center justify-center p-2.5 bg-white/80 backdrop-blur-sm rounded-2xl border border-ink/5 hover:bg-white hover:shadow-md transition-all shadow-sm group"
              >
                <div className="bg-accent/10 p-2 rounded-xl mb-1.5 group-hover:bg-accent/20 transition-colors group-hover:scale-110 duration-300">
                  <Target className="w-5 h-5 text-accent-dark" />
                </div>
                <span className="text-[10px] font-bold text-ink text-center leading-tight">
                  जाप
                  <br />
                  माला
                </span>
              </button>

              {/* 8. Mele */}
              <button
                onClick={() => navigateTo("mele")}
                className="flex flex-col items-center justify-center p-2.5 bg-white/80 backdrop-blur-sm rounded-2xl border border-ink/5 hover:bg-white hover:shadow-md transition-all shadow-sm group"
              >
                <div className="bg-accent/10 p-2 rounded-xl mb-1.5 group-hover:bg-accent/20 transition-colors group-hover:scale-110 duration-300">
                  <Users className="w-5 h-5 text-accent-dark" />
                </div>
                <span className="text-[10px] font-bold text-ink text-center leading-tight">
                  प्रमुख
                  <br />
                  मेले
                </span>
              </button>

              {/* 9. 29 Niyam */}
              <button
                onClick={() => navigateTo("niyam")}
                className="flex flex-col items-center justify-center p-2.5 bg-white/80 backdrop-blur-sm rounded-2xl border border-ink/5 hover:bg-white hover:shadow-md transition-all shadow-sm group"
              >
                <div className="bg-accent/10 p-2 rounded-xl mb-1.5 group-hover:bg-accent/20 transition-colors group-hover:scale-110 duration-300">
                  <ListOrdered className="w-5 h-5 text-accent-dark" />
                </div>
                <span className="text-[10px] font-bold text-ink text-center leading-tight">
                  २९
                  <br />
                  नियम
                </span>
              </button>

              {/* 10. Choghadiya */}
              <button
                onClick={() => navigateTo("choghadiya")}
                className="flex flex-col items-center justify-center p-2.5 bg-white/80 backdrop-blur-sm rounded-2xl border border-ink/5 hover:bg-white hover:shadow-md transition-all shadow-sm group"
              >
                <div className="bg-accent/10 p-2 rounded-xl mb-1.5 group-hover:bg-accent/20 transition-colors group-hover:scale-110 duration-300">
                  <Sun className="w-5 h-5 text-accent-dark" />
                </div>
                <span className="text-[10px] font-bold text-ink text-center leading-tight">
                  चौघड़िया
                  <br />
                  मुहूर्त
                </span>
              </button>

              {/* 11. Bichhuda */}
              <button
                onClick={() => navigateTo("bichhuda")}
                className="flex flex-col items-center justify-center p-2.5 bg-white/80 backdrop-blur-sm rounded-2xl border border-ink/5 hover:bg-white hover:shadow-md transition-all shadow-sm group"
              >
                <div className="bg-accent/10 p-2 rounded-xl mb-1.5 group-hover:bg-accent/20 transition-colors group-hover:scale-110 duration-300">
                  <Book className="w-5 h-5 text-accent-dark" />
                </div>
                <span className="text-[10px] font-bold text-ink text-center leading-tight">
                  बिछुड़ा (विदर)
                </span>
              </button>

              {/* 12. Community */}
              <button
                onClick={() => navigateTo("community_posts")}
                className="flex flex-col items-center justify-center p-2.5 bg-white/80 backdrop-blur-sm rounded-2xl border border-ink/5 hover:bg-white hover:shadow-md transition-all shadow-sm group relative"
              >
                {approvedPosts.length > 0 && (
                  <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full border border-white shadow-sm"></span>
                )}
                <div className="bg-accent/10 p-2 rounded-xl mb-1.5 group-hover:bg-accent/20 transition-colors group-hover:scale-110 duration-300">
                  <HeartHandshake className="w-5 h-5 text-accent-dark" />
                </div>
                <span className="text-[10px] font-bold text-ink text-center leading-tight">
                  भक्त
                  <br />
                  योगदान
                </span>
              </button>
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
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pb-32">
            <PremiumHeader title="खोजें (Search)" onBack={() => navigateTo('home')} icon={Search} />
            <div className="px-4">
              <div className="relative mb-6">
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
            </div>

            {searchQuery && (
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
          </motion.div>
        );

      case "mala":
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: "circOut" }}
            style={{ willChange: "transform, opacity", transform: "translateZ(0)" }}
            className="pb-20 h-[calc(100dvh-150px)] flex flex-col"
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
                    try {
                      if (navigator.vibrate) navigator.vibrate(50);
                    } catch (e) {
                      // Ignore vibration errors
                    }
                    playOmVishnu();
                    if (malaCount + 1 >= 108) {
                      try {
                        if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
                      } catch (e) {
                        // Ignore vibration errors
                      }
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
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: "circOut" }}
            style={{ willChange: "transform, opacity", transform: "translateZ(0)" }}
            className="pb-32"
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
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: "circOut" }}
            style={{ willChange: "transform, opacity", transform: "translateZ(0)" }}
            className="pb-32"
          >
            <PremiumHeader title="संपूर्ण सबदवाणी" onBack={handleBack} icon={Book} />
            <div className="flex flex-col p-2 mt-2">
              {sabads.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSabadClick(item)}
                  className="flex items-center p-4 mx-2 my-1.5 bg-white/60 rounded-2xl border border-ink/5 hover:bg-white/90 transition-all shadow-sm text-left group"
                >
                  {item.icon ? (
                    <item.icon className="w-6 h-6 mr-4 text-ink-light shrink-0" />
                  ) : (
                    <BookOpenText className="w-6 h-6 mr-4 text-ink-light shrink-0" />
                  )}
                  <span className="text-xl font-semibold leading-tight flex-1 text-ink">
                    {item.title}
                  </span>
                  <ChevronRight className="w-5 h-5 text-ink-light/40 group-hover:text-ink-light transition-colors" />
                </button>
              ))}
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
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: "circOut" }}
            style={{ willChange: "transform, opacity", transform: "translateZ(0)" }}
            className="pb-32"
          >
            <PremiumHeader title={`${categoryData.title} संग्रह`} onBack={handleBack} icon={categoryData.icon} />
            <div className="flex flex-col p-2 mt-2">
              {categoryData.list.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setSelectedSabad(item);
                    setAutoPlayAudio(false);
                    navigateTo("audio_reading");
                  }}
                  className="flex items-center p-4 mx-2 my-1.5 bg-white/60 rounded-2xl border border-ink/5 hover:bg-white/90 transition-all shadow-sm text-left group"
                >
                  <div className="bg-accent/10 p-2.5 rounded-full mr-4 group-hover:bg-accent/20 transition-colors">
                    <Play className="w-5 h-5 text-accent-dark ml-0.5" />
                  </div>
                  <span className="text-xl font-semibold leading-tight flex-1 text-ink">
                    {item.title}
                  </span>
                  <ChevronRight className="w-5 h-5 text-ink-light/40 group-hover:text-ink-light transition-colors" />
                </button>
              ))}
            </div>
          </motion.div>
        );

      case "community_posts":
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="pb-32"
          >
            <PremiumHeader title="भक्त योगदान" onBack={handleBack} icon={HeartHandshake} />
            <div className="flex flex-col p-4 gap-4">
              {approvedPosts.length === 0 ? (
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
                approvedPosts.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white/80 rounded-3xl p-5 shadow-sm border border-ink/10"
                  >
                    <h3 className="text-xl font-bold text-ink mb-2">
                      {item.title}
                    </h3>
                    {item.author && item.author.toLowerCase() !== "admin" && (
                      <p className="text-sm text-ink-light mb-4 flex items-center gap-2">
                        <Users className="w-4 h-4" /> {item.author}
                      </p>
                    )}
                    <p className="text-ink whitespace-pre-wrap line-clamp-3 mb-4 break-words">
                      {item.text}
                    </p>
                    <button
                      onClick={() => {
                        setSelectedSabad(item);
                        navigateTo("reading");
                      }}
                      className="text-accent-dark font-bold flex items-center gap-1"
                    >
                      पूरा पढ़ें <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                ))
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

        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="min-h-screen flex flex-col pb-32 relative"
          >
            {!hasSeenSwipeHint && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-ink text-white px-5 py-3 rounded-full shadow-2xl text-sm flex items-center gap-3 z-50 pointer-events-none whitespace-nowrap"
              >
                <Hand className="w-5 h-5 animate-pulse text-accent" />
                अगला {categoryLabel} देखने के लिए बाएं swipe करें
              </motion.div>
            )}

            <div className="sticky top-[60px] z-10 bg-paper/95 backdrop-blur-md p-3 flex items-center justify-between shadow-sm border-b border-ink/10">
              <button
                onClick={handleBack}
                className="p-2 -ml-1 rounded-full hover:bg-ink/10 shrink-0"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              {/* Position Indicator */}
              {readingIndex !== -1 && totalCount > 0 && (
                <div className="text-xs font-bold text-ink-light bg-ink/5 px-3 py-1.5 rounded-full tracking-wide">
                  {readingIndex + 1} / {totalCount} {categoryLabel}
                </div>
              )}

              {/* Font Size Controls */}
              <div className="flex items-center gap-1 font-bold shrink-0 bg-ink/5 rounded-full px-2 py-1">
                <button
                  onClick={() => setFontSize((f) => Math.max(f - 2, 12))}
                  className="p-1.5 hover:bg-ink/10 rounded-full text-sm"
                >
                  A-
                </button>
                <div className="w-px h-4 bg-ink/20 mx-1"></div>
                <button
                  onClick={() => setFontSize((f) => Math.min(f + 2, 32))}
                  className="p-1.5 hover:bg-ink/10 rounded-full text-sm"
                >
                  A+
                </button>
              </div>

              {/* Action Icons */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => toggleBookmark(selectedSabad?.id || "")}
                  className="p-2 rounded-full hover:bg-ink/10 transition-colors"
                >
                  <Bookmark
                    className={`w-5 h-5 ${bookmarks.includes(selectedSabad?.id || "") ? "fill-accent text-accent" : "text-ink-light"}`}
                  />
                </button>
                <button
                  onClick={handleShare}
                  className="p-2 rounded-full hover:bg-ink/10 transition-colors"
                >
                  <Share2 className="w-5 h-5 text-ink-light" />
                </button>
              </div>
            </div>

            {/* Swipeable Container */}
            <AnimatePresence mode="popLayout" custom={slideDir}>
              <motion.div
                key={selectedSabad?.id}
                custom={slideDir}
                initial={(dir) => ({ opacity: 0, x: dir > 0 ? 50 : -50 })}
                animate={{ opacity: 1, x: 0 }}
                exit={(dir) => ({ opacity: 0, x: dir < 0 ? 50 : -50 })}
                transition={{ duration: 0.3, ease: "circOut" }}
                {...(bindGestures() as any)}
                className="px-5 py-6 flex-1 flex flex-col items-center w-full touch-pan-y overflow-y-auto"
                style={{
                  willChange: "transform, opacity",
                  transform: "translateZ(0)",
                  WebkitOverflowScrolling: "touch",
                  scrollBehavior: "smooth",
                  touchAction: "pan-y"
                }}
              >
                {currentScreen === "audio_reading" &&
                  selectedSabad?.audioUrl && (
                    <AudioPlayer 
                      url={selectedSabad.audioUrl} 
                      onEnded={handleAudioEnded} 
                      autoPlay={autoPlayAudio}
                      onPlay={() => setAutoPlayAudio(true)}
                      onPause={() => setAutoPlayAudio(false)}
                      title={selectedSabad.title}
                    />
                  )}

                <div className="w-full max-w-md bg-gradient-to-r from-accent to-accent-dark text-white text-center py-3 px-4 rounded-2xl shadow-md mb-6 border border-ink/20 relative overflow-hidden">
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20"></div>
                  <h2 className="text-2xl font-semibold relative z-10">
                    {selectedSabad?.title && !selectedSabad.title.includes("मन्त्र") && !selectedSabad.title.includes("मंत्र") && !selectedSabad.title.includes("गोत्रचार")
                      ? `|| ${selectedSabad.title} ||`
                      : selectedSabad?.title}
                  </h2>
                  {selectedSabad?.author && selectedSabad.author.toLowerCase() !== "admin" && (
                    <p className="text-xs opacity-80 mt-1 relative z-10">
                      द्वारा: {selectedSabad.author}
                    </p>
                  )}
                </div>

                <div
                  className="text-center leading-relaxed max-w-2xl whitespace-pre-wrap mt-2 bg-white/60 p-6 sm:p-8 rounded-3xl shadow-sm border border-ink/10 text-ink select-none mb-8"
                  style={{ fontSize: `${fontSize}px` }}
                >
                  {selectedSabad?.text || ""}
                </div>

                {/* Navigation Buttons */}
                <div className="flex justify-between w-full max-w-md mt-4 mb-8 px-4">
                  <button 
                    onClick={() => handleSwipe("right")}
                    disabled={readingIndex <= 0}
                    className={`flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-white hover:bg-ink/5 text-ink font-medium border border-ink/10 shadow-sm transition-all active:scale-95 ${readingIndex <= 0 ? 'opacity-40 cursor-not-allowed' : ''}`}
                  >
                    <ChevronLeft className="w-5 h-5" /> पिछला
                  </button>
                  <button 
                    onClick={() => handleSwipe("left")}
                    disabled={readingIndex >= totalCount - 1}
                    className={`flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-white hover:bg-ink/5 text-ink font-medium border border-ink/10 shadow-sm transition-all active:scale-95 ${readingIndex >= totalCount - 1 ? 'opacity-40 cursor-not-allowed' : ''}`}
                  >
                    अगला <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        );
      }

      case "amavasya":
        return (
          <AmavasyaScreen amavasyaList={amavasyaList} selectedYear={selectedYear} setSelectedYear={setSelectedYear} handleBack={handleBack} />
        );

      case "donate":
        return (
          <motion.div
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
                  onError={(e) => { e.currentTarget.src = "/logo.png"; }}
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pb-32"
          >
            <PremiumHeader title="हमारे बारे में" onBack={() => navigateTo('home')} icon={Info} />
            
            <div className="px-6 pt-2 text-center">
              <div className="relative inline-block mb-6">
                <img
                  src={settings.logoUrl || "/logo.png"}
                  alt="Logo"
                  className="w-24 h-24 rounded-full shadow-lg border-4 border-white object-cover"
                  referrerPolicy="no-referrer"
                  onError={(e) => { e.currentTarget.src = "/logo.png"; }}
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pb-32"
          >
            <PremiumHeader title="गोपनीयता नीति" onBack={() => navigateTo('home')} icon={ShieldCheck} />
            
            <div className="px-6 pt-2 text-center">
              <ShieldCheck className="w-20 h-20 mx-auto text-accent mb-4" />
              <div className="bg-white/80 p-6 rounded-3xl shadow-md border border-ink/10 text-left space-y-4 text-sm md:text-base text-ink">
                <p className="font-bold text-lg mb-2">गोपनीयता नीति (Privacy Policy)</p>
                <p className="text-xs text-ink/60 mb-4">अंतिम अपडेट: 14 मार्च 2026</p>
                <p>आपकी गोपनीयता हमारे लिए अत्यंत महत्वपूर्ण है। यह ऐप (सबदवाणी / Shabadwani) Google Play Store की नीतियों का पूर्ण रूप से पालन करता है। यह गोपनीयता नीति बताती है कि हम आपकी जानकारी कैसे एकत्र, उपयोग और सुरक्षित करते हैं।</p>
                
                <h3 className="font-bold mt-4 text-accent-dark">1. जानकारी का संग्रह (Data Collection)</h3>
                <ul className="list-disc pl-5 space-y-1 text-ink/80">
                  <li><strong>व्यक्तिगत जानकारी:</strong> जब आप ऐप में लॉगिन करते हैं (Google Authentication के माध्यम से), तो हम आपका नाम, ईमेल पता और प्रोफाइल फोटो प्राप्त करते हैं।</li>
                  <li><strong>यूज़र द्वारा अपलोड किया गया डेटा:</strong> आपके द्वारा अपलोड की गई सामग्री (जैसे भजन, साखी, ऑडियो फाइलें, और तस्वीरें) हमारे सुरक्षित सर्वर पर स्टोर की जाती है।</li>
                  <li><strong>डिवाइस और उपयोग डेटा:</strong> ऐप के प्रदर्शन को बेहतर बनाने के लिए क्रैश लॉग्स और सामान्य उपयोग डेटा (Firebase Analytics के माध्यम से) एकत्र किया जा सकता है।</li>
                </ul>

                <h3 className="font-bold mt-4 text-accent-dark">2. अनुमतियां (Permissions)</h3>
                <ul className="list-disc pl-5 space-y-1 text-ink/80">
                  <li><strong>स्थान (Location):</strong> 'चोघड़िया' और पंचांग जैसी सुविधाओं के लिए आपके डिवाइस के स्थान (Location) का उपयोग किया जाता है। <strong>महत्वपूर्ण:</strong> यह डेटा केवल आपके डिवाइस पर प्रोसेस होता है और हमारे सर्वर पर न तो भेजा जाता है और न ही सेव किया जाता है।</li>
                  <li><strong>वाइब्रेशन (Vibration):</strong> 'जाप माला' सुविधा में गिनती पूरी होने पर आपको सूचित करने के लिए वाइब्रेशन का उपयोग किया जाता है।</li>
                  <li><strong>इंटरनेट (Internet):</strong> ऑडियो चलाने, डेटा सिंक करने और सामग्री डाउनलोड/अपलोड करने के लिए इंटरनेट एक्सेस की आवश्यकता होती है।</li>
                </ul>

                <h3 className="font-bold mt-4 text-accent-dark">3. थर्ड-पार्टी सेवाएं (Third-Party Services)</h3>
                <p className="text-ink/80">यह ऐप निम्नलिखित थर्ड-पार्टी सेवाओं का उपयोग करता है, जिनकी अपनी गोपनीयता नीतियां हो सकती हैं:</p>
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

                <h3 className="font-bold mt-4 text-accent-dark">6. बच्चों की गोपनीयता (Children's Privacy)</h3>
                <p className="text-ink/80">यह ऐप 13 वर्ष से कम उम्र के बच्चों से जानबूझकर व्यक्तिगत जानकारी एकत्र नहीं करता है। यदि हमें पता चलता है कि किसी बच्चे ने हमें व्यक्तिगत जानकारी प्रदान की है, तो हम उसे तुरंत अपने सर्वर से हटा देते हैं।</p>

                <h3 className="font-bold mt-4 text-accent-dark">7. संपर्क करें (Contact Us)</h3>
                <p className="text-ink/80">यदि इस गोपनीयता नीति के संबंध में आपके कोई प्रश्न या सुझाव हैं, तो कृपया हमसे संपर्क करें:</p>
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pb-32"
          >
            <PremiumHeader title="सामग्री जोड़ें" onBack={handleBack} icon={UploadCloud} />
            
            <div className="px-6 pt-2">
              <div className="text-center mb-6">
                <p className="text-ink-light">भजन, आरती या सबदवाणी अपलोड करें</p>
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
                      onChange={(e) => setContribAudio(e.target.value)}
                      type="url"
                      className="flex-1 p-3 rounded-xl border border-ink/20 bg-white focus:border-accent outline-none transition-colors"
                      placeholder="https://..."
                    />
                    <label className="flex items-center justify-center px-4 bg-accent/10 text-accent-dark rounded-xl cursor-pointer hover:bg-accent/20 transition-colors whitespace-nowrap">
                      <input
                        type="file"
                        accept="audio/*"
                        className="hidden"
                        onChange={(e) => handleFileSelect(e, setContribAudioFile, false, setContribAudioError)}
                      />
                      <Upload className="w-5 h-5" />
                    </label>
                  </div>
                  {contribAudioError && (
                    <p className="text-xs text-red-500 font-medium flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3 h-3" /> {contribAudioError}
                    </p>
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pb-32"
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
                <div className="p-4 bg-red-50 text-red-600 rounded-xl mb-6 border border-red-200 text-sm font-medium flex items-center gap-2">
                  <XCircle className="w-5 h-5" /> {choghadiyaError}
                </div>
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
                        {choghadiyaSlots.day.map((slot, idx) => (
                          <div
                            key={`day-${slot.name}-${idx}`}
                            className={`flex justify-between p-3 rounded-xl border ${slot.type === "good" ? "bg-green-50 border-green-200 text-green-800" : slot.type === "bad" ? "bg-red-50 border-red-200 text-red-800" : "bg-blue-50 border-blue-200 text-blue-800"}`}
                          >
                            <span className="font-bold">{slot.name}</span>
                            <span className="text-sm font-medium">
                              {slot.time}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="font-bold text-lg text-ink mb-3 flex items-center gap-2">
                        <Book className="w-5 h-5" /> रात का चौघड़िया
                      </h3>
                      <div className="grid grid-cols-1 gap-2">
                        {choghadiyaSlots.night.map((slot, idx) => (
                          <div
                            key={`night-${slot.name}-${idx}`}
                            className={`flex justify-between p-3 rounded-xl border ${slot.type === "good" ? "bg-green-50 border-green-200 text-green-800" : slot.type === "bad" ? "bg-red-50 border-red-200 text-red-800" : "bg-blue-50 border-blue-200 text-blue-800"}`}
                          >
                            <span className="font-bold">{slot.name}</span>
                            <span className="text-sm font-medium">
                              {slot.time}
                            </span>
                          </div>
                        ))}
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pb-32"
          >
            <PremiumHeader title="बिछुड़ा (विदर)" onBack={() => navigateTo("home")} icon={Book} />

            <div className="px-4">
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pb-32 pt-0"
          >
            <PremiumHeader title="आगामी प्रमुख मेले" onBack={() => navigateTo("home")} icon={Users} />

            <div className="space-y-4 px-4">
              {processedMeles.map((mela) => (
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
              ))}
            </div>
          </motion.div>
        );

      case "admin_login":
        return (
          <motion.div
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
                  <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-xl text-sm text-left">
                    {adminLoginError}
                  </div>
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
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pb-32 px-4 pt-4"
          >
            <div className="flex items-center gap-3 mb-6 bg-ink text-white p-4 rounded-3xl shadow-lg">
              <button
                onClick={() => navigateTo("home")}
                className="p-2 rounded-full hover:bg-white/20"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <h1 className="text-xl sm:text-2xl font-bold flex-1 text-center whitespace-nowrap">|| Admin Dashboard ||</h1>
              <ShieldCheck className="w-8 h-8" />
            </div>

            <div className="space-y-8">
              {/* Add New Content Section */}
              <div className="bg-white/90 p-6 rounded-3xl shadow-sm border border-ink/10">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2 border-b border-ink/10 pb-2">
                  <PlusCircle className="w-5 h-5" /> नई सामग्री जोड़ें (Add
                  Content)
                </h2>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (isSubmitting) return;
                    if (contribAudioError || contribPhotoError) {
                      showToast("कृपया पहले फाइल से जुड़ी त्रुटि को ठीक करें।");
                      return;
                    }
                    if (!navigator.onLine) {
                      showToast("आप अभी ऑफ़लाइन हैं। कृपया इंटरनेट कनेक्शन की जांच करें।");
                      return;
                    }
                    if (!db) {
                      showToast("Firebase is not configured.");
                      return;
                    }
                    
                    setIsSubmitting(true);
                    try {
                      let finalAudioUrl = contribAudio;
                      let finalPhotoUrl = contribPhotoUrl;

                      if (contribAudioFile) {
                        finalAudioUrl = await uploadFileToStorage(contribAudioFile, "audio");
                      }
                      if (contribPhotoFile) {
                        finalPhotoUrl = await uploadFileToStorage(contribPhotoFile, "images");
                      }

                      if (contribType === "मेले") {
                        const newMela = {
                          name: contribTitle,
                          dateStr: contribDate,
                          location: contribLocation,
                          desc: contribText,
                        };
                        await addDoc(collection(db, "meles"), newMela);
                        showToast("नया मेला सफलतापूर्वक जोड़ा गया!");
                      } else if (contribType === "बधाई संदेश") {
                        const newBadhai = {
                          name: contribTitle,
                          photoUrl: finalPhotoUrl,
                          text: contribText,
                          isActive: true,
                        };
                        await addDoc(collection(db, "badhais"), newBadhai);
                        showToast("नया बधाई संदेश सफलतापूर्वक जोड़ा गया!");
                      } else {
                        const newContent: any = {
                          title: contribTitle,
                          text: contribText,
                          audioUrl: finalAudioUrl,
                          author: "Admin",
                        };
                        if (contribSequence !== "") {
                          newContent.sequence = Number(contribSequence);
                        }

                        if (contribType === "शब्द") {
                          await addDoc(collection(db, "shabads"), newContent);
                          showToast("नया शब्द सफलतापूर्वक जोड़ा गया!");
                        } else if (contribType === "भजन") {
                          await addDoc(collection(db, "bhajans"), newContent);
                          showToast("नया भजन सफलतापूर्वक जोड़ा गया!");
                        } else if (contribType === "आरती") {
                          await addDoc(collection(db, "aartis"), newContent);
                          showToast("नई आरती सफलतापूर्वक जोड़ी गई!");
                        } else if (contribType === "मंत्र") {
                          await addDoc(collection(db, "mantras"), newContent);
                          showToast("नया मंत्र सफलतापूर्वक जोड़ा गया!");
                        } else if (contribType === "साखी") {
                          await addDoc(collection(db, "sakhis"), newContent);
                          showToast("नई साखी सफलतापूर्वक जोड़ी गई!");
                        } else if (contribType === "सुविचार") {
                          await addDoc(collection(db, "thoughts"), { text: contribText, author: contribAuthor || "गुरु जम्भेश्वर" });
                          showToast("नया सुविचार सफलतापूर्वक जोड़ा गया!");
                        }
                        
                        // Send Notification
                        await addDoc(collection(db, "notifications"), {
                          title: `नया ${contribType} जोड़ा गया`,
                          message: `नया ${contribType} "${contribTitle}" ऐप में जोड़ दिया गया है।`,
                          date: "अभी",
                          read: false,
                        });
                      }

                      setContribTitle("");
                      setContribText("");
                      setContribAudio("");
                      setContribSequence("");
                      setContribType("शब्द");
                      setContribDate("");
                      setContribLocation("");
                      setContribPhotoUrl("");
                      setContribAudioFile(null);
                      setContribPhotoFile(null);
                    } catch (error: any) {
                      if (error.message?.includes("Missing or insufficient permissions")) {
                        showToast("जोड़ने की अनुमति नहीं है। कृपया Firebase Console में Firestore Security Rules को अपडेट करें (allow write: if request.auth != null;).");
                      } else {
                        showToast("सामग्री जोड़ने में त्रुटि हुई।");
                      }
                    } finally {
                      setIsSubmitting(false);
                    }
                  }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-sm mb-1">
                        प्रकार (Type)
                      </label>
                      <select
                        value={contribType}
                        onChange={(e) => setContribType(e.target.value)}
                        className="w-full p-3 rounded-xl border border-ink/20 bg-white focus:border-accent outline-none transition-colors"
                      >
                        <option>शब्द</option>
                        <option>भजन</option>
                        <option>आरती</option>
                        <option>साखी</option>
                        <option>मंत्र</option>
                        <option>सुविचार</option>
                        <option>मेले</option>
                        <option>बधाई संदेश</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-sm mb-1">
                        क्रम (Sequence)
                      </label>
                      <input
                        type="number"
                        value={contribSequence}
                        onChange={(e) => setContribSequence(e.target.value ? Number(e.target.value) : "")}
                        placeholder="Ex: 1, 2, 3..."
                        className="w-full p-3 rounded-xl border border-ink/20 bg-white focus:border-accent outline-none transition-colors"
                      />
                    </div>
                  </div>

                  {contribType !== "सुविचार" && contribType !== "मेले" && contribType !== "बधाई संदेश" && (
                    <>
                      <div>
                        <label className="block font-bold text-sm mb-1">
                          शीर्षक (Title)
                        </label>
                        <input
                          value={contribTitle}
                          onChange={(e) => setContribTitle(e.target.value)}
                          required
                          type="text"
                          className="w-full p-3 rounded-xl border border-ink/20 bg-white focus:border-accent outline-none transition-colors"
                          placeholder="शीर्षक लिखें..."
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-sm mb-1">
                          ऑडियो लिंक (Audio URL - Optional) या अपलोड करें
                        </label>
                        <div className="flex flex-col gap-2">
                          <div className="flex gap-2">
                            <input
                              value={contribAudio}
                              onChange={(e) => setContribAudio(e.target.value)}
                              type="url"
                              className="flex-1 p-3 rounded-xl border border-ink/20 bg-white focus:border-accent outline-none transition-colors"
                              placeholder="https://..."
                            />
                            <label className="flex items-center justify-center px-4 bg-accent/10 text-accent-dark rounded-xl cursor-pointer hover:bg-accent/20 transition-colors whitespace-nowrap">
                              <input
                                type="file"
                                accept="audio/*"
                                className="hidden"
                                onChange={(e) => handleFileSelect(e, setContribAudioFile, false, setContribAudioError)}
                              />
                              <Upload className="w-5 h-5" />
                            </label>
                          </div>
                          {contribAudioError && (
                            <p className="text-xs text-red-500 font-medium flex items-center gap-1 mt-1">
                              <AlertCircle className="w-3 h-3" /> {contribAudioError}
                            </p>
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
                    </>
                  )}

                  {contribType === "बधाई संदेश" && (
                    <>
                      <div>
                        <label className="block font-bold text-sm mb-1">
                          बधाई संदेश की हेडिंग (Greeting Heading)
                        </label>
                        <input
                          value={contribTitle}
                          onChange={(e) => setContribTitle(e.target.value)}
                          required
                          type="text"
                          className="w-full p-3 rounded-xl border border-ink/20 bg-white focus:border-accent outline-none transition-colors"
                          placeholder="हेडिंग लिखें..."
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-sm mb-1">
                          फोटो लिंक (Photo URL) या फोटो अपलोड करें
                        </label>
                        <div className="flex flex-col gap-2">
                          <div className="flex gap-2">
                            <input
                              value={contribPhotoUrl}
                              onChange={(e) => setContribPhotoUrl(e.target.value)}
                              required={!contribPhotoFile}
                              type="url"
                              className="flex-1 p-3 rounded-xl border border-ink/20 bg-white focus:border-accent outline-none transition-colors"
                              placeholder="https://..."
                            />
                            <label className="flex items-center justify-center px-4 bg-accent/10 text-accent-dark rounded-xl cursor-pointer hover:bg-accent/20 transition-colors whitespace-nowrap">
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleFileSelect(e, setContribPhotoFile, true, setContribPhotoError)}
                              />
                              <Upload className="w-5 h-5" />
                            </label>
                          </div>
                          {contribPhotoError && (
                            <p className="text-xs text-red-500 font-medium flex items-center gap-1 mt-1">
                              <AlertCircle className="w-3 h-3" /> {contribPhotoError}
                            </p>
                          )}
                          {contribPhotoFile && !contribPhotoError && (
                            <p className="text-xs text-green-600 font-medium">चयनित: {contribPhotoFile.name}</p>
                          )}
                          {uploadProgress !== null && (
                            <div className="w-full bg-ink/10 rounded-full h-1.5 mt-1">
                              <div className="bg-accent h-1.5 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  {contribType === "मेले" && (
                    <>
                      <div>
                        <label className="block font-bold text-sm mb-1">
                          मेले का नाम (Name)
                        </label>
                        <input
                          value={contribTitle}
                          onChange={(e) => setContribTitle(e.target.value)}
                          required
                          type="text"
                          className="w-full p-3 rounded-xl border border-ink/20 bg-white focus:border-accent outline-none transition-colors"
                          placeholder="मेले का नाम..."
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-sm mb-1">
                          तिथि (Date)
                        </label>
                        <input
                          value={contribDate}
                          onChange={(e) => setContribDate(e.target.value)}
                          required
                          type="date"
                          className="w-full p-3 rounded-xl border border-ink/20 bg-white focus:border-accent outline-none transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-sm mb-1">
                          स्थान (Location)
                        </label>
                        <input
                          value={contribLocation}
                          onChange={(e) => setContribLocation(e.target.value)}
                          required
                          type="text"
                          className="w-full p-3 rounded-xl border border-ink/20 bg-white focus:border-accent outline-none transition-colors"
                          placeholder="स्थान..."
                        />
                      </div>
                    </>
                  )}

                  <div>
                    <label className="block font-bold text-sm mb-1">
                      {contribType === "सुविचार"
                        ? "सुविचार (Thought)"
                        : contribType === "मेले"
                          ? "विवरण (Description)"
                          : contribType === "बधाई संदेश"
                            ? "बधाई संदेश - 25-30 शब्द (Greeting Message)"
                            : "पाठ (Text / Lyrics)"}
                    </label>
                    {contribType === "सुविचार" && (
                      <div className="mb-4">
                        <label className="block font-bold text-sm mb-1">
                          लेखक (Author)
                        </label>
                        <input
                          value={contribAuthor}
                          onChange={(e) => setContribAuthor(e.target.value)}
                          type="text"
                          className="w-full p-3 rounded-xl border border-ink/20 bg-white focus:border-accent outline-none transition-colors"
                          placeholder="गुरु जम्भेश्वर"
                        />
                      </div>
                    )}
                    <textarea
                      value={contribText}
                      onChange={(e) => setContribText(e.target.value)}
                      required
                      className="w-full p-3 rounded-xl border border-ink/20 bg-white h-32 focus:border-accent outline-none transition-colors"
                      placeholder="यहाँ लिखें..."
                    ></textarea>
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-accent to-accent-dark text-white font-bold py-3.5 rounded-xl shadow-md hover:shadow-lg transition-all"
                  >
                    जोड़ें (Add)
                  </button>
                </form>
              </div>

              {/* Manage Content Section */}
              <div className="bg-white/90 p-6 rounded-3xl shadow-sm border border-ink/10">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2 border-b border-ink/10 pb-2">
                  <Edit3 className="w-5 h-5" /> सामग्री प्रबंधित करें (Manage
                  Content)
                </h2>

                <div className="space-y-6">
                  {/* Shabads */}
                  <div>
                    <h3 className="font-bold text-lg mb-2 text-accent-dark">
                      सबदवाणी
                    </h3>
                    <div className="max-h-40 overflow-y-auto space-y-2 pr-2">
                      {sabads.map((s) => (
                        <div
                          key={s.id}
                          className="flex items-center justify-between bg-paper p-3 rounded-xl border border-ink/5"
                        >
                          <span className="font-medium truncate flex-1">
                            {s.title}
                          </span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => openEditModal("शब्द", s)}
                              className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete("शब्द", s.id)}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Aartis */}
                  <div>
                    <h3 className="font-bold text-lg mb-2 text-accent-dark">
                      आरती
                    </h3>
                    <div className="max-h-40 overflow-y-auto space-y-2 pr-2">
                      {aartis.map((m) => (
                        <div
                          key={m.id}
                          className="flex items-center justify-between bg-paper p-3 rounded-xl border border-ink/5"
                        >
                          <span className="font-medium truncate flex-1">
                            {m.title}
                          </span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => openEditModal("आरती", m)}
                              className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete("आरती", m.id)}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Bhajans */}
                  <div>
                    <h3 className="font-bold text-lg mb-2 text-accent-dark">
                      भजन
                    </h3>
                    <div className="max-h-40 overflow-y-auto space-y-2 pr-2">
                      {bhajans.map((m) => (
                        <div
                          key={m.id}
                          className="flex items-center justify-between bg-paper p-3 rounded-xl border border-ink/5"
                        >
                          <span className="font-medium truncate flex-1">
                            {m.title}
                          </span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => openEditModal("भजन", m)}
                              className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete("भजन", m.id)}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Sakhis */}
                  <div>
                    <h3 className="font-bold text-lg mb-2 text-accent-dark">
                      साखी
                    </h3>
                    <div className="max-h-40 overflow-y-auto space-y-2 pr-2">
                      {sakhis.map((m) => (
                        <div
                          key={m.id}
                          className="flex items-center justify-between bg-paper p-3 rounded-xl border border-ink/5"
                        >
                          <span className="font-medium truncate flex-1">
                            {m.title}
                          </span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => openEditModal("साखी", m)}
                              className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete("साखी", m.id)}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Mantras */}
                  <div>
                    <h3 className="font-bold text-lg mb-2 text-accent-dark">
                      मंत्र
                    </h3>
                    <div className="max-h-40 overflow-y-auto space-y-2 pr-2">
                      {mantras.map((m) => (
                        <div
                          key={m.id}
                          className="flex items-center justify-between bg-paper p-3 rounded-xl border border-ink/5"
                        >
                          <span className="font-medium truncate flex-1">
                            {m.title}
                          </span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => openEditModal("मंत्र", m)}
                              className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete("मंत्र", m.id)}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Thoughts */}
                  <div>
                    <h3 className="font-bold text-lg mb-2 text-accent-dark">
                      सुविचार
                    </h3>
                    <div className="max-h-40 overflow-y-auto space-y-2 pr-2">
                      {thoughts.map((t, i) => (
                        <div
                          key={t.id}
                          className="flex items-center justify-between bg-paper p-3 rounded-xl border border-ink/5"
                        >
                          <span className="font-medium truncate flex-1 text-sm">
                            {t.text}
                          </span>
                          <div className="flex gap-2">
                            <button
                              onClick={() =>
                                openEditModal("सुविचार", t, i)
                              }
                              className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete("सुविचार", t.id, i)}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Meles */}
                  <div>
                    <h3 className="font-bold text-lg mb-2 text-accent-dark">
                      मेले
                    </h3>
                    <div className="max-h-40 overflow-y-auto space-y-2 pr-2">
                      {meles.map((m, i) => (
                        <div
                          key={m.id}
                          className="flex items-center justify-between bg-paper p-3 rounded-xl border border-ink/5"
                        >
                          <span className="font-medium truncate flex-1 text-sm">
                            {m.name} - {m.dateStr}
                          </span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => openEditModal("मेले", m, i)}
                              className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete("मेले", m.id, i)}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Badhais */}
                  <div>
                    <h3 className="font-bold text-lg mb-2 text-accent-dark">
                      बधाई संदेश
                    </h3>
                    <div className="max-h-40 overflow-y-auto space-y-2 pr-2">
                      {badhais.map((b) => (
                        <div
                          key={b.id}
                          className={`flex items-center justify-between bg-paper p-3 rounded-xl border border-ink/5 transition-opacity ${!b.isActive ? "opacity-50" : "opacity-100"}`}
                        >
                          <span className="font-medium truncate flex-1 text-sm">
                            {b.name}
                          </span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => toggleBadhaiStatus(b.id, b.isActive)}
                              className={`p-1.5 rounded-lg ${b.isActive ? "text-orange-500 hover:bg-orange-50" : "text-green-500 hover:bg-green-50"}`}
                              title={b.isActive ? "Pause" : "Resume"}
                            >
                              {b.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => openEditModal("बधाई संदेश", b)}
                              className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete("बधाई संदेश", b.id)}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Settings Section */}
              <div className="bg-white/90 p-6 rounded-3xl shadow-sm border border-ink/10">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2 border-b border-ink/10 pb-2">
                  <Settings className="w-5 h-5" /> App Settings
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block font-bold text-sm mb-1">
                      Logo URL या अपलोड करें
                    </label>
                    <div className="flex flex-col gap-2">
                      <div className="flex gap-2">
                        <input
                          type="url"
                          value={settings.logoUrl}
                          onChange={(e) =>
                            setSettings({ ...settings, logoUrl: e.target.value })
                          }
                          className="flex-1 p-2 rounded-lg border border-ink/20 bg-white text-sm"
                        />
                        <label className="flex items-center justify-center px-3 bg-accent/10 text-accent-dark rounded-lg cursor-pointer hover:bg-accent/20 transition-colors">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleFileSelect(e, setSettingsLogoFile, true)}
                          />
                          <Upload className="w-4 h-4" />
                        </label>
                      </div>
                      {settingsLogoFile && (
                        <p className="text-xs text-green-600 font-medium mt-1">चयनित: {settingsLogoFile.name}</p>
                      )}
                      {uploadProgress !== null && (
                        <div className="w-full bg-ink/10 rounded-full h-1 mt-1">
                          <div className="bg-accent h-1 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block font-bold text-sm mb-1">
                      UPI ID
                    </label>
                    <input
                      type="text"
                      value={settings.upiId}
                      onChange={(e) =>
                        setSettings({ ...settings, upiId: e.target.value })
                      }
                      className="w-full p-2 rounded-lg border border-ink/20 bg-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-sm mb-1">
                      QR Code URL या अपलोड करें
                    </label>
                    <div className="flex flex-col gap-2">
                      <div className="flex gap-2">
                        <input
                          type="url"
                          value={settings.qrCodeUrl}
                          onChange={(e) =>
                            setSettings({ ...settings, qrCodeUrl: e.target.value })
                          }
                          className="flex-1 p-2 rounded-lg border border-ink/20 bg-white text-sm"
                        />
                        <label className="flex items-center justify-center px-3 bg-accent/10 text-accent-dark rounded-lg cursor-pointer hover:bg-accent/20 transition-colors">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleFileSelect(e, setSettingsQrCodeFile, true)}
                          />
                          <Upload className="w-4 h-4" />
                        </label>
                      </div>
                      {settingsQrCodeFile && (
                        <p className="text-xs text-green-600 font-medium mt-1">चयनित: {settingsQrCodeFile.name}</p>
                      )}
                      {uploadProgress !== null && (
                        <div className="w-full bg-ink/10 rounded-full h-1 mt-1">
                          <div className="bg-accent h-1 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block font-bold text-sm mb-1">
                      Ad Banner Text
                    </label>
                    <input
                      type="text"
                      value={settings.adText}
                      onChange={(e) =>
                        setSettings({ ...settings, adText: e.target.value })
                      }
                      className="w-full p-2 rounded-lg border border-ink/20 bg-white text-sm mb-4"
                    />
                  </div>
                  <div className="flex items-center gap-3 mb-4">
                    <label className="font-bold text-sm">विज्ञापन दिखाएं (Show Ad)</label>
                    <button
                      type="button"
                      onClick={() => setSettings({ ...settings, isAdEnabled: settings.isAdEnabled !== false ? false : true })}
                      className={`w-12 h-6 rounded-full transition-colors relative ${settings.isAdEnabled !== false ? 'bg-green-500' : 'bg-gray-300'}`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all ${settings.isAdEnabled !== false ? 'left-6' : 'left-0.5'}`}></div>
                    </button>
                  </div>
                  <div>
                    <label className="block font-bold text-sm mb-1">
                      Ad Banner Link (Optional)
                    </label>
                    <input
                      type="url"
                      value={settings.adLink || ""}
                      onChange={(e) =>
                        setSettings({ ...settings, adLink: e.target.value })
                      }
                      placeholder="https://example.com"
                      className="w-full p-2 rounded-lg border border-ink/20 bg-white text-sm mb-4"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-sm mb-1">
                      जाप माला ऑडियो (Jaap Audio URL)
                    </label>
                    <div className="flex flex-col gap-2">
                      <div className="flex gap-2">
                        <input
                          type="url"
                          value={settings.jaapAudioUrl || ""}
                          onChange={(e) =>
                            setSettings({ ...settings, jaapAudioUrl: e.target.value })
                          }
                          placeholder="https://example.com/audio.mp3"
                          className="flex-1 p-2 rounded-lg border border-ink/20 bg-white text-sm"
                        />
                        <label className="flex items-center justify-center px-3 bg-accent/10 text-accent-dark rounded-lg cursor-pointer hover:bg-accent/20 transition-colors">
                          <input
                            type="file"
                            accept="audio/*"
                            className="hidden"
                            onChange={(e) => handleFileSelect(e, setSettingsJaapAudioFile, false)}
                          />
                          <Upload className="w-4 h-4" />
                        </label>
                      </div>
                      {settingsJaapAudioFile && (
                        <p className="text-xs text-green-600 font-medium mt-1">चयनित: {settingsJaapAudioFile.name}</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={handleSaveSettings}
                    className="w-full bg-accent text-white font-bold py-3 rounded-xl hover:bg-accent-dark transition-colors"
                  >
                    Save Settings
                  </button>
                </div>
              </div>

              {/* Pending Posts Section */}
              <div className="bg-white/90 p-6 rounded-3xl shadow-sm border border-ink/10">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2 border-b border-ink/10 pb-2">
                  <BookOpenText className="w-5 h-5" /> Pending Approvals (
                  {pendingPosts.length})
                </h2>
                <div className="space-y-4">
                  {pendingPosts.length === 0 ? (
                    <p className="text-ink-light text-center py-4">
                      No pending posts.
                    </p>
                  ) : (
                    pendingPosts.map((post) => (
                      <div
                        key={post.id}
                        className="bg-paper p-4 rounded-xl border border-ink/10"
                      >
                        <h3 className="font-bold text-lg">{post.title}</h3>
                        <p className="text-xs text-ink-light mb-2">
                          By: {post.author}
                        </p>
                        <p className="text-sm line-clamp-2 mb-3 bg-white/50 p-2 rounded break-words">
                          {post.text}
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => approvePost(post)}
                            className="flex-1 bg-green-500 text-white py-2 rounded-lg font-bold flex items-center justify-center gap-1"
                          >
                            <CheckCircle className="w-4 h-4" /> Approve
                          </button>
                          <button
                            onClick={() => rejectPost(post)}
                            className="flex-1 bg-red-500 text-white py-2 rounded-lg font-bold flex items-center justify-center gap-1"
                          >
                            <XCircle className="w-4 h-4" /> Reject
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Edit Modal */}
            {editModalOpen && editItemData && (
              <div className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl">
                  <h2 className="text-xl font-bold mb-4">
                    संपादित करें (Edit)
                  </h2>
                  <form onSubmit={handleEditSave} className="space-y-4">
                    {editItemData.type !== "सुविचार" &&
                      editItemData.type !== "मेले" &&
                      editItemData.type !== "बधाई संदेश" && (
                        <>
                          <div>
                            <label className="block font-bold text-sm mb-1">
                              शीर्षक (Title)
                            </label>
                            <input
                              value={editItemData.title || ""}
                              onChange={(e) =>
                                setEditItemData({
                                  ...editItemData,
                                  title: e.target.value,
                                })
                              }
                              required
                              type="text"
                              className="w-full p-3 rounded-xl border border-ink/20 bg-white focus:border-accent outline-none"
                            />
                          </div>
                          <div>
                            <label className="block font-bold text-sm mb-1">
                              ऑडियो लिंक (Audio URL) या अपलोड करें
                            </label>
                            <div className="flex flex-col gap-2">
                              <div className="flex gap-2">
                                <input
                                  value={editItemData.audioUrl || ""}
                                  onChange={(e) =>
                                    setEditItemData({
                                      ...editItemData,
                                      audioUrl: e.target.value,
                                    })
                                  }
                                  type="url"
                                  className="flex-1 p-3 rounded-xl border border-ink/20 bg-white focus:border-accent outline-none"
                                />
                                <label className="flex items-center justify-center px-4 bg-accent/10 text-accent-dark rounded-xl cursor-pointer hover:bg-accent/20 transition-colors whitespace-nowrap">
                                  <input
                                    type="file"
                                    accept="audio/*"
                                    className="hidden"
                                    onChange={(e) => handleFileSelect(e, (file) => setEditItemData({ ...editItemData, audioFile: file }), false, setEditAudioError)}
                                  />
                                  <Upload className="w-5 h-5" />
                                </label>
                              </div>
                              {editAudioError && (
                                <p className="text-xs text-red-500 font-medium flex items-center gap-1 mt-1">
                                  <AlertCircle className="w-3 h-3" /> {editAudioError}
                                </p>
                              )}
                              {editItemData.audioFile && !editAudioError && (
                                <p className="text-xs text-green-600 font-medium">चयनित: {editItemData.audioFile.name}</p>
                              )}
                              {uploadProgress !== null && (
                                <div className="w-full bg-ink/10 rounded-full h-1.5 mt-1">
                                  <div className="bg-accent h-1.5 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                                </div>
                              )}
                            </div>
                          </div>
                          <div>
                            <label className="block font-bold text-sm mb-1">
                              क्रम (Sequence)
                            </label>
                            <input
                              value={editItemData.sequence || ""}
                              onChange={(e) =>
                                setEditItemData({
                                  ...editItemData,
                                  sequence: e.target.value ? Number(e.target.value) : "",
                                })
                              }
                              type="number"
                              className="w-full p-3 rounded-xl border border-ink/20 bg-white focus:border-accent outline-none"
                            />
                          </div>
                        </>
                      )}
                    {editItemData.type === "मेले" && (
                      <>
                        <div>
                          <label className="block font-bold text-sm mb-1">
                            मेले का नाम (Name)
                          </label>
                          <input
                            value={editItemData.name || ""}
                            onChange={(e) =>
                              setEditItemData({
                                ...editItemData,
                                name: e.target.value,
                              })
                            }
                            required
                            type="text"
                            className="w-full p-3 rounded-xl border border-ink/20 bg-white focus:border-accent outline-none"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-sm mb-1">
                            तिथि (Date)
                          </label>
                          <input
                            value={editItemData.dateStr || ""}
                            onChange={(e) =>
                              setEditItemData({
                                ...editItemData,
                                dateStr: e.target.value,
                              })
                            }
                            required
                            type="date"
                            className="w-full p-3 rounded-xl border border-ink/20 bg-white focus:border-accent outline-none"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-sm mb-1">
                            स्थान (Location)
                          </label>
                          <input
                            value={editItemData.location || ""}
                            onChange={(e) =>
                              setEditItemData({
                                ...editItemData,
                                location: e.target.value,
                              })
                            }
                            required
                            type="text"
                            className="w-full p-3 rounded-xl border border-ink/20 bg-white focus:border-accent outline-none"
                          />
                        </div>
                      </>
                    )}
                    {editItemData.type === "बधाई संदेश" && (
                      <>
                        <div>
                          <label className="block font-bold text-sm mb-1">
                            बधाई संदेश की हेडिंग (Greeting Heading)
                          </label>
                          <input
                            value={editItemData.name || ""}
                            onChange={(e) =>
                              setEditItemData({
                                ...editItemData,
                                name: e.target.value,
                              })
                            }
                            required
                            type="text"
                            className="w-full p-3 rounded-xl border border-ink/20 bg-white focus:border-accent outline-none"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-sm mb-1">
                            फोटो लिंक (Photo URL) या फोटो अपलोड करें
                          </label>
                          <div className="flex flex-col gap-2">
                            <div className="flex gap-2">
                              <input
                                value={editItemData.photoUrl || ""}
                                onChange={(e) =>
                                  setEditItemData({
                                    ...editItemData,
                                    photoUrl: e.target.value,
                                  })
                                }
                                required={!editItemData.photoFile}
                                type="url"
                                className="flex-1 p-3 rounded-xl border border-ink/20 bg-white focus:border-accent outline-none"
                              />
                              <label className="flex items-center justify-center px-4 bg-accent/10 text-accent-dark rounded-xl cursor-pointer hover:bg-accent/20 transition-colors whitespace-nowrap">
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => handleFileSelect(e, (file) => setEditItemData({ ...editItemData, photoFile: file }), true, setEditPhotoError)}
                                />
                                <Upload className="w-5 h-5" />
                              </label>
                            </div>
                            {editPhotoError && (
                              <p className="text-xs text-red-500 font-medium flex items-center gap-1 mt-1">
                                <AlertCircle className="w-3 h-3" /> {editPhotoError}
                              </p>
                            )}
                            {editItemData.photoFile && !editPhotoError && (
                              <p className="text-xs text-green-600 font-medium">चयनित: {editItemData.photoFile.name}</p>
                            )}
                            {uploadProgress !== null && (
                              <div className="w-full bg-ink/10 rounded-full h-1.5 mt-1">
                                <div className="bg-accent h-1.5 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                              </div>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                    <div>
                      <label className="block font-bold text-sm mb-1">
                        {editItemData.type === "सुविचार"
                          ? "सुविचार"
                          : editItemData.type === "मेले"
                            ? "विवरण (Description)"
                            : editItemData.type === "बधाई संदेश"
                              ? "बधाई संदेश (Greeting Message)"
                              : "पाठ (Text)"}
                      </label>
                      <textarea
                        value={editItemData.text || editItemData.desc || ""}
                        onChange={(e) =>
                          setEditItemData({
                            ...editItemData,
                            [editItemData.type === "मेले" ? "desc" : "text"]:
                              e.target.value,
                          })
                        }
                        required
                        className="w-full p-3 rounded-xl border border-ink/20 bg-white h-32 focus:border-accent outline-none"
                      ></textarea>
                    </div>
                    {editItemData.type === "सुविचार" && (
                      <div>
                        <label className="block font-bold text-sm mb-1">
                          लेखक (Author)
                        </label>
                        <input
                          type="text"
                          value={editItemData.author || ""}
                          onChange={(e) =>
                            setEditItemData({
                              ...editItemData,
                              author: e.target.value,
                            })
                          }
                          className="w-full p-3 rounded-xl border border-ink/20 bg-white focus:border-accent outline-none"
                          placeholder="गुरु जम्भेश्वर"
                        />
                      </div>
                    )}
                    <div className="flex gap-3 mt-6">
                      <button
                        type="button"
                        onClick={() => setEditModalOpen(false)}
                        className="flex-1 bg-ink/10 text-ink font-bold py-3 rounded-xl"
                      >
                        रद्द करें
                      </button>
                      <button
                        type="submit"
                        className="flex-1 bg-accent text-white font-bold py-3 rounded-xl"
                      >
                        सेव करें
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </motion.div>
        );
    }
  };

  return (
    <div className="min-h-screen max-w-md mx-auto relative shadow-2xl bg-paper overflow-x-hidden flex flex-col">
      <AnimatePresence>
        {isOffline && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-0 left-1/2 -translate-x-1/2 z-[110] bg-red-500 text-white px-4 py-1.5 rounded-b-lg shadow-lg text-xs font-medium flex items-center gap-2 w-full max-w-md justify-center"
          >
            इंटरनेट कनेक्शन नहीं है। आप ऑफलाइन मोड में हैं।
          </motion.div>
        )}
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] bg-ink text-white px-6 py-3 rounded-full shadow-2xl text-sm font-medium flex items-center gap-2 whitespace-nowrap"
          >
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
        <AnimatePresence mode="wait">{renderScreen()}</AnimatePresence>
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
      <AnimatePresence>
        {confirmDialog?.isOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-sm border border-ink/10"
            >
              <h3 className="text-xl font-bold text-ink mb-2">{confirmDialog.title}</h3>
              <p className="text-ink-light mb-6">{confirmDialog.message}</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmDialog(null)}
                  className="flex-1 py-3 rounded-xl font-bold text-ink bg-ink/5 hover:bg-ink/10 transition-colors"
                >
                  रद्द करें
                </button>
                <button
                  onClick={() => {
                    confirmDialog.onConfirm();
                    setConfirmDialog(null);
                  }}
                  className="flex-1 py-3 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 transition-colors"
                >
                  हां, हटाएं
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AmavasyaScreen({ amavasyaList, selectedYear, setSelectedYear, handleBack }: any) {
  const currentMonthRef = useRef<HTMLDivElement>(null);
  const currentMonthHindi = format(new Date(), "MMMM", { locale: hi }); // This is gregorian, but we can match roughly or use index

  useEffect(() => {
    const today = new Date();
    const currentYear = today.getFullYear();
    if (selectedYear === currentYear) {
      const currentMonthIdx = today.getMonth();
      
      // Find the card for the current month and scroll to it
      const timer = setTimeout(() => {
        const cards = document.querySelectorAll('.amavasya-card');
        const targetIdx = amavasyaList.findIndex((a: any) => a.startDate && a.startDate.getMonth() === currentMonthIdx);
        if (targetIdx !== -1 && cards[targetIdx]) {
          cards[targetIdx].scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [selectedYear, amavasyaList]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="pb-32"
    >
      <PremiumHeader title="अमावस्या दर्शन" onBack={handleBack} icon={CalendarDays} />

      <div className="px-4">
        <div className="flex items-center justify-between bg-white/90 shadow-md border border-ink/10 rounded-full py-2 px-6 mb-8 max-w-[280px] mx-auto">
          <button
            onClick={() => setSelectedYear((y: number) => y - 1)}
            className="p-1.5 hover:bg-ink/10 rounded-full transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-2xl font-bold text-accent-dark">
            {selectedYear}
          </span>
          <button
            onClick={() => setSelectedYear((y: number) => y + 1)}
            className="p-1.5 hover:bg-ink/10 rounded-full transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6 max-w-2xl mx-auto">
        {amavasyaList.map((item: any) => (
          <div
            key={item.start}
            className="amavasya-card border border-accent/20 rounded-[2rem] bg-white/80 shadow-lg relative overflow-hidden group hover:shadow-xl transition-all backdrop-blur-sm"
          >
            {/* Decorative background mandala/pattern */}
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-accent/10 rounded-full blur-3xl group-hover:bg-accent/20 transition-all"></div>

            {/* Premium Header for Card */}
            <div className="p-5 flex items-center justify-between border-b border-ink/5 relative z-10">
              <div>
                <h3 className="text-3xl font-heading text-accent-dark mb-0.5 drop-shadow-sm">
                  {item.hindiMonth}
                </h3>
                <p className="text-[10px] font-bold text-ink/60 tracking-wide uppercase">
                  {item.gregorianMonth} • {item.sub}
                </p>
              </div>
              {/* Jambho Ji Photo in Header */}
              <div className="shrink-0 ml-4 relative">
                <div className="absolute inset-0 bg-accent rounded-full blur-md opacity-40 animate-pulse"></div>
                <img
                  src="https://images.unsplash.com/photo-1588414734732-660b07304ddb?auto=format&fit=crop&q=80&w=100&h=100"
                  alt="Jambho Ji"
                  className="w-12 h-12 rounded-full border-2 border-white ring-4 ring-accent/30 shadow-lg object-cover relative z-10"
                  referrerPolicy="no-referrer"
                  onError={(e) => { e.currentTarget.src = "/logo.png"; }}
                />
              </div>
            </div>

            <div className="p-5 bg-gradient-to-b from-transparent to-paper-light/50 relative z-10">
              <div className="flex flex-col gap-3">
                <div className="flex items-start gap-3">
                  <div className="mt-1 bg-green-100 p-1.5 rounded-full shadow-inner">
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-ink/50 uppercase tracking-wider mb-0.5">
                      प्रारम्भ
                    </p>
                    <p className="text-sm text-ink font-medium">{item.start}</p>
                  </div>
                </div>

                <div className="w-px h-4 bg-ink/10 ml-4 -my-1"></div>

                <div className="flex items-start gap-3">
                  <div className="mt-1 bg-red-100 p-1.5 rounded-full shadow-inner">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]"></div>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-ink/50 uppercase tracking-wider mb-0.5">
                      समाप्त
                    </p>
                    <p className="text-sm text-ink font-medium">{item.end}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      </div>
    </motion.div>
  );
}
function NavItem({
  icon,
  label,
  isActive,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center w-[65px] h-12 rounded-2xl transition-all duration-300 ${isActive ? "text-accent-dark scale-110" : "text-ink-light hover:bg-ink/5"}`}
    >
      <div
        className={`mb-0.5 transition-transform duration-300 ${isActive ? "-translate-y-0.5" : ""}`}
      >
        {icon}
      </div>
      <span
        className={`text-[9px] font-bold leading-none transition-opacity duration-300 ${isActive ? "opacity-100" : "opacity-70"}`}
      >
        {label}
      </span>
      {isActive && (
        <div className="absolute bottom-1 w-1 h-1 bg-accent-dark rounded-full"></div>
      )}
    </button>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <MainApp />
    </ErrorBoundary>
  );
}
