import React, { useState, useEffect, useRef } from "react";
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
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useDrag } from "@use-gesture/react";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, onSnapshot } from "firebase/firestore";
import { db } from "./firebase";

// --- Types & Data ---

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

type ShabadItem = {
  id: string;
  title: string;
  icon?: any;
  audioUrl?: string;
  text?: string;
  author?: string;
  order?: number;
};

type AppSettings = {
  logoUrl: string;
  qrCodeUrl: string;
  adText: string;
  upiId: string;
};

type Notification = {
  id: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
};

// --- Amavasya Auto-Calculation Logic ---
const KNOWN_AMAVASYA = new Date(Date.UTC(2024, 0, 11, 11, 27, 0)).getTime();
const KNOWN_MONTH_INDEX = 0; // पौष
const SYNODIC_MONTH = 29.530588853 * 24 * 60 * 60 * 1000;
const HINDU_MONTHS = [
  "पौष", "माघ", "फाल्गुन", "चैत्र", "वैशाख", "ज्येष्ठ", 
  "आषाढ़", "श्रावण", "भाद्रपद", "आश्विन", "कार्तिक", "मार्गशीर्ष"
];

function generateAmavasyaForYear(year: number) {
  const dates = [];
  const yearStart = new Date(year, 0, 1).getTime();
  const yearEnd = new Date(year, 11, 31, 23, 59, 59).getTime();

  let diff = yearStart - KNOWN_AMAVASYA;
  let monthsOffset = Math.floor(diff / SYNODIC_MONTH);
  let currentAmavasya = KNOWN_AMAVASYA + monthsOffset * SYNODIC_MONTH;

  while (currentAmavasya < yearStart) { currentAmavasya += SYNODIC_MONTH; }
  while (currentAmavasya - SYNODIC_MONTH >= yearStart) { currentAmavasya -= SYNODIC_MONTH; }

  const formatter = new Intl.DateTimeFormat("hi-IN", {
    day: "2-digit", month: "long", hour: "2-digit", minute: "2-digit", hour12: true,
  });
  const monthFormatter = new Intl.DateTimeFormat("hi-IN", { month: "long", year: "numeric" });

  while (currentAmavasya <= yearEnd) {
    const peak = new Date(currentAmavasya);
    const start = new Date(currentAmavasya - 14 * 60 * 60 * 1000);
    const end = new Date(currentAmavasya + 10 * 60 * 60 * 1000);

    let exactOffset = Math.round((currentAmavasya - KNOWN_AMAVASYA) / SYNODIC_MONTH);
    let monthIndex = (KNOWN_MONTH_INDEX + exactOffset) % 12;
    if (monthIndex < 0) monthIndex += 12;

    dates.push({
      gregorianMonth: monthFormatter.format(peak),
      hindiMonth: HINDU_MONTHS[monthIndex],
      sub: `विक्रम सम्वत ${year + 57}`,
      start: formatter.format(start),
      end: formatter.format(end),
    });
    currentAmavasya += SYNODIC_MONTH;
  }
  return dates;
}

// --- Components ---

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
    <header className="sticky top-0 z-40 bg-paper/95 backdrop-blur-md border-b border-ink/10 px-4 py-3 flex items-center justify-between shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
      <div
        className="flex items-center gap-3 cursor-pointer"
        onClick={handleLogoClick}
      >
        <div className="relative">
          <img
            src={logoUrl}
            alt="App Logo"
            className="w-10 h-10 rounded-full shadow-md border-2 border-white object-cover"
          />
          <div className="absolute -bottom-1 -right-1 bg-green-500 w-3 h-3 rounded-full border-2 border-white"></div>
        </div>
        <h1 className="font-heading text-2xl text-ink tracking-wide mt-1">
          शब्दवाणी
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
          <Bell className="w-6 h-6" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold flex items-center justify-center rounded-full border-2 border-paper">
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

function AdBanner({ text }: { text: string }) {
  if (!text) return null;
  return (
    <div className="bg-white/90 backdrop-blur-md border-t border-ink/10 p-2 text-center flex items-center justify-center gap-3 shadow-[0_-4px_20px_rgba(0,0,0,0.04)]">
      <span className="bg-ink/10 text-ink px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider">
        AD
      </span>
      <span className="text-xs font-semibold text-ink-light truncate">
        {text}
      </span>
      <ChevronRight className="w-4 h-4 text-ink-light/50 shrink-0" />
    </div>
  );
}

function AudioPlayer({ url, onEnded }: { url: string, onEnded?: () => void }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.load();
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((e) => {
        console.error("Audio auto-play failed:", e);
        setIsPlaying(false);
      });
    }
  }, [url]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current
          .play()
          .catch((e) => console.error("Audio play failed:", e));
      }
      setIsPlaying(!isPlaying);
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
        src={url}
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

const playOmVishnu = () => {
  try {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance("ॐ विष्णु");
      utterance.lang = 'hi-IN';
      utterance.rate = 0.8;
      utterance.pitch = 0.6;
      utterance.volume = 0.5;
      
      const voices = window.speechSynthesis.getVoices();
      const hindiVoice = voices.find(v => v.lang.includes('hi') || v.lang.includes('hi-IN'));
      if (hindiVoice) {
        utterance.voice = hindiVoice;
      }
      
      window.speechSynthesis.speak(utterance);
    }
  } catch (e) {
    console.log("Speech synthesis failed", e);
  }
};

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("home");
  const [selectedShabad, setSelectedShabad] = useState<ShabadItem | null>(null);
  const [fontSize, setFontSize] = useState(18);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [amavasyaList, setAmavasyaList] = useState(() =>
    generateAmavasyaForYear(selectedYear),
  );

  // --- State is now completely Empty (Data comes from Firebase directly) ---
  const [shabads, setShabads] = useState<ShabadItem[]>([]);
  const [aartis, setAartis] = useState<ShabadItem[]>([]);
  const [bhajans, setBhajans] = useState<ShabadItem[]>([]);
  const [sakhis, setSakhis] = useState<ShabadItem[]>([]);
  const [mantras, setMantras] = useState<ShabadItem[]>([]);
  const [thoughts, setThoughts] = useState<string[]>([]);
  const [meles, setMeles] = useState<any[]>([]);
  const [niyams, setNiyams] = useState<string[]>([]);

  const [selectedCategory, setSelectedCategory] = useState<"aarti" | "bhajan" | "sakhi" | "mantra">("aarti");

  const [pendingPosts, setPendingPosts] = useState<ShabadItem[]>([]);
  const [approvedPosts, setApprovedPosts] = useState<ShabadItem[]>([]);

  useEffect(() => {
    // Ordered Fetch Logic from Firebase
    const unsubShabads = onSnapshot(collection(db, "shabads"), (snapshot) => {
      if (!snapshot.empty) {
        let fetched = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as ShabadItem));
        fetched.sort((a, b) => (a.order || 0) - (b.order || 0));
        setShabads(fetched);
      } else { setShabads([]); }
    });
    const unsubAartis = onSnapshot(collection(db, "aartis"), (snapshot) => {
      if (!snapshot.empty) {
        let fetched = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as ShabadItem));
        fetched.sort((a, b) => (a.order || 0) - (b.order || 0));
        setAartis(fetched);
      } else { setAartis([]); }
    });
    const unsubBhajans = onSnapshot(collection(db, "bhajans"), (snapshot) => {
      if (!snapshot.empty) {
        let fetched = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as ShabadItem));
        fetched.sort((a, b) => (a.order || 0) - (b.order || 0));
        setBhajans(fetched);
      } else { setBhajans([]); }
    });
    const unsubSakhis = onSnapshot(collection(db, "sakhis"), (snapshot) => {
      if (!snapshot.empty) {
        let fetched = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as ShabadItem));
        fetched.sort((a, b) => (a.order || 0) - (b.order || 0));
        setSakhis(fetched);
      } else { setSakhis([]); }
    });
    const unsubMantras = onSnapshot(collection(db, "mantras"), (snapshot) => {
      if (!snapshot.empty) {
        let fetched = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as ShabadItem));
        fetched.sort((a, b) => (a.order || 0) - (b.order || 0));
        setMantras(fetched);
      } else { setMantras([]); }
    });
    const unsubThoughts = onSnapshot(collection(db, "thoughts"), (snapshot) => {
      if (!snapshot.empty) {
        let fetched = snapshot.docs.map(doc => doc.data());
        fetched.sort((a, b) => (a.order || 0) - (b.order || 0));
        setThoughts(fetched.map(f => f.text));
      } else { setThoughts([]); }
    });
    const unsubNiyams = onSnapshot(collection(db, "niyams"), (snapshot) => {
      if (!snapshot.empty) {
        let fetched = snapshot.docs.map(doc => doc.data());
        fetched.sort((a, b) => (a.order || 0) - (b.order || 0));
        setNiyams(fetched.map(f => f.text));
      } else { setNiyams([]); }
    });
    const unsubMeles = onSnapshot(collection(db, "meles"), (snapshot) => {
      if (!snapshot.empty) {
        let fetched = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as any));
        fetched.sort((a, b) => (a.order || 0) - (b.order || 0));
        setMeles(fetched);
      } else { setMeles([]); }
    });
    const unsubPending = onSnapshot(collection(db, "pendingPosts"), (snapshot) => {
      if (!snapshot.empty) {
        setPendingPosts(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as ShabadItem)));
      } else {
        setPendingPosts([]);
      }
    });
    const unsubApproved = onSnapshot(collection(db, "approvedPosts"), (snapshot) => {
      if (!snapshot.empty) {
        setApprovedPosts(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as ShabadItem)));
      } else {
        setApprovedPosts([]);
      }
    });

    return () => {
      unsubShabads(); unsubAartis(); unsubBhajans(); unsubSakhis();
      unsubMantras(); unsubThoughts(); unsubNiyams(); unsubMeles();
      unsubPending(); unsubApproved();
    };
  }, []);

  const [dailyThought, setDailyThought] = useState("सुविचार लोड हो रहा है...");

  useEffect(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now.getTime() - start.getTime();
    const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
    if(thoughts && thoughts.length > 0){
        setDailyThought(thoughts[dayOfYear % thoughts.length]);
    }
  }, [thoughts]);

  // --- Notifications ---
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "n1",
      title: "नया अपडेट",
      message: "अमावस्या दर्शन में नए फीचर्स जोड़े गए हैं।",
      date: "आज",
      read: false,
    },
  ]);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
  };

  // --- Admin State ---
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState("");

  const [settings, setSettings] = useState<AppSettings>({
    logoUrl:
      "https://api.dicebear.com/7.x/shapes/svg?seed=shabadwani&backgroundColor=e68a00",
    qrCodeUrl:
      "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=shabadwani@upi&pn=Shabadwani",
    adText: "प्रीमियम पूजा सामग्री और साहित्य खरीदें - 20% छूट",
    upiId: "shabadwani@upi",
  });

  // --- Form State for Contribution ---
  const [contribTitle, setContribTitle] = useState("");
  const [contribType, setContribType] = useState("शब्द");
  const [contribAudio, setContribAudio] = useState("");
  const [contribText, setContribText] = useState("");
  const [contribAuthor, setContribAuthor] = useState("");
  const [contribDate, setContribDate] = useState("");
  const [contribLocation, setContribLocation] = useState("");

  // --- Premium Features State ---
  const [searchQuery, setSearchQuery] = useState("");
  const [malaCount, setMalaCount] = useState(0);
  const [malaLaps, setMalaLaps] = useState(0);

  // --- Admin Edit State ---
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editItemData, setEditItemData] = useState<any>(null);

  const openEditModal = (type: string, item: any, index?: number) => {
    setEditItemData({ type, ...item, index });
    setEditModalOpen(true);
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const docRef = doc(db, editItemData.type === "शब्द" ? "shabads" : editItemData.type === "मंत्र" ? "mantras" : editItemData.type === "आरती" ? "aartis" : editItemData.type === "भजन" ? "bhajans" : editItemData.type === "साखी" ? "sakhis" : editItemData.type === "सुविचार" ? "thoughts" : editItemData.type === "नियम" ? "niyams" : "meles", editItemData.id);
      
      if (editItemData.type === "मेले") {
        await updateDoc(docRef, { name: editItemData.name, dateStr: editItemData.dateStr, location: editItemData.location, desc: editItemData.desc });
      } else if (editItemData.type === "सुविचार" || editItemData.type === "नियम") {
        await updateDoc(docRef, { text: editItemData.text });
      } else {
        await updateDoc(docRef, { title: editItemData.title, text: editItemData.text, audioUrl: editItemData.audioUrl });
      }
      setEditModalOpen(false);
      alert("बदलाव सफलतापूर्वक सेव किए गए!");
    } catch (error) {
      console.error("Error updating document: ", error);
      alert("अपडेट करने में त्रुटि हुई।");
    }
    setIsSaving(false);
  };

  const handleDelete = async (type: string, id: string) => {
    if (!window.confirm("क्या आप वाकई इसे हटाना चाहते हैं?")) return;
    try {
      const coll = type === "शब्द" ? "shabads" : type === "मंत्र" ? "mantras" : type === "आरती" ? "aartis" : type === "भजन" ? "bhajans" : type === "साखी" ? "sakhis" : type === "सुविचार" ? "thoughts" : type === "नियम" ? "niyams" : "meles";
      await deleteDoc(doc(db, coll, id));
      alert("सफलतापूर्वक हटा दिया गया!");
    } catch (error) {
      console.error("Error deleting document: ", error);
      alert("हटाने में त्रुटि हुई।");
    }
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

  const calculateChoghadiya = async (
    loc = choghadiyaLocation,
    dateStr = choghadiyaDate,
  ) => {
    setChoghadiyaLoading(true);
    setChoghadiyaError("");
    try {
      const geoRes = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(loc)}&format=json&limit=1&addressdetails=1`,
      );
      const geoData = await geoRes.json();
      if (!geoData || geoData.length === 0)
        throw new Error("स्थान नहीं मिला। कृपया सही शहर का नाम दर्ज करें।");

      const lat = geoData[0].lat;
      const lon = geoData[0].lon;

      const address = geoData[0].address || {};
      const city =
        address.city ||
        address.town ||
        address.village ||
        address.county ||
        geoData[0].name ||
        loc;
      const state = address.state || "";
      const country = address.country || "";

      const resolvedName = [city, state, country === "India" ? "" : country]
        .filter(Boolean)
        .join(", ");
      setChoghadiyaLocation(resolvedName);

      const sunRes = await fetch(
        `https://api.sunrise-sunset.org/json?lat=${lat}&lng=${lon}&date=${dateStr}&formatted=0`,
      );
      const sunData = await sunRes.json();

      const nextDate = new Date(dateStr);
      nextDate.setDate(nextDate.getDate() + 1);
      const nextSunRes = await fetch(
        `https://api.sunrise-sunset.org/json?lat=${lat}&lng=${lon}&date=${nextDate.toISOString().split("T")[0]}&formatted=0`,
      );
      const nextSunData = await nextSunRes.json();

      const sunrise = new Date(sunData.results.sunrise);
      const sunset = new Date(sunData.results.sunset);
      const nextSunrise = new Date(nextSunData.results.sunrise);

      const dayDurationMs = sunset.getTime() - sunrise.getTime();
      const nightDurationMs = nextSunrise.getTime() - sunset.getTime();

      const daySlotMs = dayDurationMs / 8;
      const nightSlotMs = nightDurationMs / 8;

      const dayOfWeek = new Date(dateStr).getDay();

      const daySequences = [
        ["उद्वेग", "चर", "लाभ", "अमृत", "काल", "शुभ", "रोग", "उद्वेग"],
        ["अमृत", "काल", "शुभ", "रोग", "उद्वेग", "चर", "लाभ", "अमृत"],
        ["रोग", "उद्वेग", "चर", "लाभ", "अमृत", "काल", "शुभ", "रोग"],
        ["लाभ", "अमृत", "काल", "शुभ", "रोग", "उद्वेग", "चर", "लाभ"],
        ["शुभ", "रोग", "उद्वेग", "चर", "लाभ", "अमृत", "काल", "शुभ"],
        ["चर", "लाभ", "अमृत", "काल", "शुभ", "रोग", "उद्वेग", "चर"],
        ["काल", "शुभ", "रोग", "उद्वेग", "चर", "लाभ", "अमृत", "काल"],
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
        d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

      const generateSlots = (
        sequence: string[],
        startTime: Date,
        slotDurationMs: number,
      ) => {
        return sequence.map((name, idx) => {
          let type = "normal";
          if (["अमृत", "शुभ", "लाभ"].includes(name)) type = "good";
          if (["रोग", "काल", "उद्वेग"].includes(name)) type = "bad";
          const slotStart = new Date(
            startTime.getTime() + idx * slotDurationMs,
          );
          const slotEnd = new Date(
            startTime.getTime() + (idx + 1) * slotDurationMs,
          );
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

  useEffect(() => {
    if (currentScreen === "choghadiya" && choghadiyaSlots.day.length === 0) {
      calculateChoghadiya();
    }
  }, [currentScreen]);

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert("आपका ब्राउज़र लोकेशन सपोर्ट नहीं करता है।");
      return;
    }
    setChoghadiyaLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
          );
          const data = await res.json();
          const address = data.address || {};
          const city =
            address.city ||
            address.town ||
            address.village ||
            address.county ||
            "Unknown Location";
          const state = address.state || "";
          const country = address.country || "";
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
      () => {
        setChoghadiyaError("लोकेशन की अनुमति नहीं मिली।");
        setChoghadiyaLoading(false);
      },
    );
  };

  // --- Bichhuda State & Logic ---
  const [bichhudaYear, setBichhudaYear] = useState(new Date().getFullYear());
  const [bichhudaMonth, setBichhudaMonth] = useState(new Date().getMonth());

  const generateBichhudaDates = (year: number, month: number) => {
    const seed = year * 12 + month;
    const startDay = ((seed * 7) % 20) + 5; 

    const startDate = new Date(year, month, startDay, 10, 30);
    const endDate = new Date(year, month, startDay + 4, 14, 45);

    const format = (d: Date) =>
      d.toLocaleDateString("hi-IN", {
        day: "2-digit",
        month: "long",
        hour: "2-digit",
        minute: "2-digit",
      });

    return {
      monthName: startDate.toLocaleDateString("hi-IN", { month: "long" }),
      start: format(startDate),
      end: format(endDate),
      isUpcoming: endDate > new Date(),
    };
  };

  const bichhudaList = Array.from({ length: 12 }, (_, i) =>
    generateBichhudaDates(bichhudaYear, i),
  );

  // --- Mele Logic ---
  const processedMeles = meles
    .map((mela) => {
      const melaDate = new Date(mela.dateStr);
      return {
        ...mela,
        dateFormatted: melaDate.toLocaleDateString("hi-IN", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }),
        upcoming: melaDate >= new Date(),
      };
    })
    .sort(
      (a, b) => new Date(a.dateStr).getTime() - new Date(b.dateStr).getTime(),
    );

  // --- Swipe Gesture Logic ---
  const handleSwipe = (direction: "left" | "right") => {
    if (!selectedShabad) return;

    let currentList: ShabadItem[] = [];
    if (currentScreen === "reading") currentList = shabads;
    else if (currentScreen === "audio_reading") {
      if (selectedCategory === "aarti") currentList = aartis;
      else if (selectedCategory === "bhajan") currentList = bhajans;
      else if (selectedCategory === "sakhi") currentList = sakhis;
      else if (selectedCategory === "mantra") currentList = mantras;
    }
    else if (currentScreen === "community_posts") currentList = approvedPosts;

    const currentIndex = currentList.findIndex(
      (item) => item.id === selectedShabad.id,
    );
    if (currentIndex === -1) return;

    if (direction === "left" && currentIndex < currentList.length - 1) {
      setSelectedShabad(currentList[currentIndex + 1]);
    } else if (direction === "right" && currentIndex > 0) {
      setSelectedShabad(currentList[currentIndex - 1]);
    }
  };

  const handleAudioEnded = () => {
    handleSwipe("left");
  };

  const bindSwipe = useDrag(
    ({ swipe: [swipeX] }) => {
      if (swipeX === -1) handleSwipe("left"); // Swiped left
      if (swipeX === 1) handleSwipe("right"); // Swiped right
    },
    { filterTaps: true, swipe: { distance: 50 } },
  );

  useEffect(() => {
    setAmavasyaList(generateAmavasyaForYear(selectedYear));
  }, [selectedYear]);

  const navigateTo = (screen: Screen) => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setCurrentScreen(screen);
    setShowNotifications(false);
  };

  const handleShabadClick = (shabad: ShabadItem) => {
    setSelectedShabad(shabad);
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
          title: selectedShabad?.title || "शब्दवाणी",
          text:
            "शब्दवाणी ऐप से यह पाठ पढ़ें:\n\n" +
            (selectedShabad?.text || "डेटा लोड हो रहा है...").substring(0, 100) +
            "...",
          url: window.location.href,
        });
      } catch (error) {
        console.log("Error sharing", error);
      }
    } else {
      alert("लिंक कॉपी कर लिया गया है!");
    }
  };

  const handleContributeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newPost = {
      title: contribTitle,
      text: contribText,
      audioUrl: contribAudio,
      author: contribAuthor || "अज्ञात भक्त",
      type: contribType,
      timestamp: new Date().toISOString(),
    };
    
    try {
      await addDoc(collection(db, "pendingPosts"), newPost);
      alert("धन्यवाद! आपकी सामग्री समीक्षा के लिए भेज दी गई है।");
      setContribTitle("");
      setContribText("");
      setContribAudio("");
      setContribAuthor("");
      navigateTo("home");
    } catch (error) {
      console.error("Error adding document: ", error);
      alert("सामग्री भेजने में त्रुटि हुई। कृपया पुनः प्रयास करें।");
    }
  };

  const approvePost = async (post: any) => {
    try {
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
        order: Date.now() 
      });
      
      await deleteDoc(doc(db, "pendingPosts", post.id));

      setNotifications([
        {
          id: Date.now().toString(),
          title: "नया योगदान स्वीकृत",
          message: `"${post.title}" को ऐप में जोड़ दिया गया है।`,
          date: "अभी",
          read: false,
        },
        ...notifications,
      ]);
    } catch (error) {
      console.error("Error approving post: ", error);
      alert("स्वीकृत करने में त्रुटि हुई।");
    }
  };

  const rejectPost = async (id: string) => {
    try {
      await deleteDoc(doc(db, "pendingPosts", id));
    } catch (error) {
      console.error("Error rejecting post: ", error);
      alert("अस्वीकृत करने में त्रुटि हुई।");
    }
  };

  const handleAdminSubmitData = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const orderVal = Date.now(); 
      if (contribType === "मेले") {
        await addDoc(collection(db, "meles"), { name: contribTitle, dateStr: contribDate, location: contribLocation, desc: contribText, order: orderVal });
      } else {
        const newContent = { title: contribTitle, text: contribText, audioUrl: contribAudio, author: "Admin", order: orderVal };
        const coll = contribType === "शब्द" ? "shabads" : contribType === "भजन" ? "bhajans" : contribType === "आरती" ? "aartis" : contribType === "मंत्र" ? "mantras" : contribType === "साखी" ? "sakhis" : contribType === "नियम" ? "niyams" : "thoughts";
        await addDoc(collection(db, coll), (contribType === "सुविचार" || contribType === "नियम") ? { text: contribText, order: orderVal } : newContent);
      }
      alert("नया डेटा सफलतापूर्वक सेव हो गया है! ✅");
      setContribTitle(""); setContribText(""); setContribAudio(""); setContribType("शब्द"); setContribDate(""); setContribLocation("");
    } catch (error) {
      alert("सामग्री जोड़ने में त्रुटि हुई ❌");
    }
    setIsSaving(false);
  };


  const renderScreen = () => {
    switch (currentScreen) {
      case "home":
        return (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="pb-32"
          >
            {/* Thought of the Day Card */}
            <div className="mx-4 my-4 p-6 bg-gradient-to-br from-accent to-accent-dark rounded-[2rem] text-white shadow-[0_8px_30px_rgba(230,138,0,0.2)] relative overflow-hidden">
              <div className="absolute -right-4 -top-4 opacity-10">
                <Sun className="w-32 h-32" />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-3 opacity-90">
                  <Quote className="w-5 h-5" />
                  <h3 className="text-sm font-bold tracking-wider uppercase">
                    आज का सुविचार
                  </h3>
                </div>
                <p className="text-xl font-medium leading-snug mb-3">
                  "{dailyThought}"
                </p>
                <p className="text-sm opacity-80 text-right font-semibold">
                  - गुरु जाम्भेश्वर
                </p>
              </div>
            </div>

            {/* Premium Grid Layout for Main Categories */}
            <div className="flex flex-col gap-4 px-4 mt-6">
              {/* Group 1: Shabadwani and Amavasya */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => navigateTo("shabad_list")}
                  className="flex flex-col items-center justify-center p-6 bg-white/80 backdrop-blur-sm rounded-[2rem] border border-ink/5 hover:bg-white hover:shadow-lg transition-all shadow-sm group"
                >
                  <div className="bg-accent/10 p-4 rounded-2xl mb-3 group-hover:bg-accent/20 transition-colors group-hover:scale-110 duration-300">
                    <Book className="w-8 h-8 text-accent-dark" />
                  </div>
                  <span className="text-lg font-bold text-ink text-center leading-tight">
                    संपूर्ण
                    <br />
                    शब्दवाणी
                  </span>
                </button>

                <button
                  onClick={() => navigateTo("amavasya")}
                  className="flex flex-col items-center justify-center p-6 bg-white/80 backdrop-blur-sm rounded-[2rem] border border-ink/5 hover:bg-white hover:shadow-lg transition-all shadow-sm group"
                >
                  <div className="bg-accent/10 p-4 rounded-2xl mb-3 group-hover:bg-accent/20 transition-colors group-hover:scale-110 duration-300">
                    <CalendarDays className="w-8 h-8 text-accent-dark" />
                  </div>
                  <span className="text-lg font-bold text-ink text-center leading-tight">
                    अमावस्या
                    <br />
                    दर्शन
                  </span>
                </button>
              </div>

              {/* Group 2: Aarti, Bhajan, Sakhi */}
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => { setSelectedCategory("aarti"); navigateTo("category_list"); }}
                  className="flex flex-col items-center justify-center p-4 bg-white/80 backdrop-blur-sm rounded-[1.5rem] border border-ink/5 hover:bg-white hover:shadow-lg transition-all shadow-sm group"
                >
                  <div className="bg-accent/10 p-3 rounded-2xl mb-2 group-hover:bg-accent/20 transition-colors group-hover:scale-110 duration-300">
                    <Music className="w-6 h-6 text-accent-dark" />
                  </div>
                  <span className="text-sm font-bold text-ink text-center leading-tight">
                    आरती
                  </span>
                </button>

                <button
                  onClick={() => { setSelectedCategory("bhajan"); navigateTo("category_list"); }}
                  className="flex flex-col items-center justify-center p-4 bg-white/80 backdrop-blur-sm rounded-[1.5rem] border border-ink/5 hover:bg-white hover:shadow-lg transition-all shadow-sm group"
                >
                  <div className="bg-accent/10 p-3 rounded-2xl mb-2 group-hover:bg-accent/20 transition-colors group-hover:scale-110 duration-300">
                    <Music className="w-6 h-6 text-accent-dark" />
                  </div>
                  <span className="text-sm font-bold text-ink text-center leading-tight">
                    भजन
                  </span>
                </button>

                <button
                  onClick={() => { setSelectedCategory("sakhi"); navigateTo("category_list"); }}
                  className="flex flex-col items-center justify-center p-4 bg-white/80 backdrop-blur-sm rounded-[1.5rem] border border-ink/5 hover:bg-white hover:shadow-lg transition-all shadow-sm group"
                >
                  <div className="bg-accent/10 p-3 rounded-2xl mb-2 group-hover:bg-accent/20 transition-colors group-hover:scale-110 duration-300">
                    <BookOpenText className="w-6 h-6 text-accent-dark" />
                  </div>
                  <span className="text-sm font-bold text-ink text-center leading-tight">
                    साखी
                  </span>
                </button>
              </div>

              {/* Group 3: Mantra and Jap Mala */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => { setSelectedCategory("mantra"); navigateTo("category_list"); }}
                  className="flex flex-col items-center justify-center p-6 bg-white/80 backdrop-blur-sm rounded-[2rem] border border-ink/5 hover:bg-white hover:shadow-lg transition-all shadow-sm group"
                >
                  <div className="bg-accent/10 p-4 rounded-2xl mb-3 group-hover:bg-accent/20 transition-colors group-hover:scale-110 duration-300">
                    <Music className="w-8 h-8 text-accent-dark" />
                  </div>
                  <span className="text-lg font-bold text-ink text-center leading-tight">
                    मंत्र
                  </span>
                </button>

                <button
                  onClick={() => navigateTo("mala")}
                  className="flex flex-col items-center justify-center p-6 bg-white/80 backdrop-blur-sm rounded-[2rem] border border-ink/5 hover:bg-white hover:shadow-lg transition-all shadow-sm group"
                >
                  <div className="bg-accent/10 p-4 rounded-2xl mb-3 group-hover:bg-accent/20 transition-colors group-hover:scale-110 duration-300">
                    <Target className="w-8 h-8 text-accent-dark" />
                  </div>
                  <span className="text-lg font-bold text-ink text-center leading-tight">
                    जाप
                    <br />
                    माला
                  </span>
                </button>
              </div>

              {/* Group 4: Pramukh Mele and 29 Niyam */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => navigateTo("mele")}
                  className="flex flex-col items-center justify-center p-6 bg-white/80 backdrop-blur-sm rounded-[2rem] border border-ink/5 hover:bg-white hover:shadow-lg transition-all shadow-sm group"
                >
                  <div className="bg-accent/10 p-4 rounded-2xl mb-3 group-hover:bg-accent/20 transition-colors group-hover:scale-110 duration-300">
                    <Users className="w-8 h-8 text-accent-dark" />
                  </div>
                  <span className="text-lg font-bold text-ink text-center leading-tight">
                    प्रमुख
                    <br />
                    मेले
                  </span>
                </button>

                <button
                  onClick={() => navigateTo("niyam")}
                  className="flex flex-col items-center justify-center p-6 bg-white/80 backdrop-blur-sm rounded-[2rem] border border-ink/5 hover:bg-white hover:shadow-lg transition-all shadow-sm group"
                >
                  <div className="bg-accent/10 p-4 rounded-2xl mb-3 group-hover:bg-accent/20 transition-colors group-hover:scale-110 duration-300">
                    <ListOrdered className="w-8 h-8 text-accent-dark" />
                  </div>
                  <span className="text-lg font-bold text-ink text-center leading-tight">
                    २९
                    <br />
                    नियम
                  </span>
                </button>
              </div>

              {/* Group 5: Choghadiya and Bichhuda */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => navigateTo("choghadiya")}
                  className="flex flex-col items-center justify-center p-6 bg-white/80 backdrop-blur-sm rounded-[2rem] border border-ink/5 hover:bg-white hover:shadow-lg transition-all shadow-sm group"
                >
                  <div className="bg-accent/10 p-4 rounded-2xl mb-3 group-hover:bg-accent/20 transition-colors group-hover:scale-110 duration-300">
                    <Sun className="w-8 h-8 text-accent-dark" />
                  </div>
                  <span className="text-lg font-bold text-ink text-center leading-tight">
                    चौघड़िया
                    <br />
                    मुहूर्त
                  </span>
                </button>

                <button
                  onClick={() => navigateTo("bichhuda")}
                  className="flex flex-col items-center justify-center p-6 bg-white/80 backdrop-blur-sm rounded-[2rem] border border-ink/5 hover:bg-white hover:shadow-lg transition-all shadow-sm group"
                >
                  <div className="bg-accent/10 p-4 rounded-2xl mb-3 group-hover:bg-accent/20 transition-colors group-hover:scale-110 duration-300">
                    <Book className="w-8 h-8 text-accent-dark" />
                  </div>
                  <span className="text-lg font-bold text-ink text-center leading-tight">
                    बिछुड़ा
                    <br />
                    (पंचक)
                  </span>
                </button>
              </div>
            </div>
            
            <div className="px-4 mt-4">
              <button
                onClick={() => navigateTo("community_posts")}
                className="w-full flex flex-col items-center justify-center p-6 bg-white/80 backdrop-blur-sm rounded-[2rem] border border-ink/5 hover:bg-white hover:shadow-lg transition-all shadow-sm group relative"
              >
                {approvedPosts.length > 0 && (
                  <span className="absolute top-4 right-4 w-3 h-3 bg-red-500 rounded-full border-2 border-white shadow-sm"></span>
                )}
                <div className="bg-accent/10 p-4 rounded-2xl mb-3 group-hover:bg-accent/20 transition-colors group-hover:scale-110 duration-300">
                  <HeartHandshake className="w-8 h-8 text-accent-dark" />
                </div>
                <span className="text-lg font-bold text-ink text-center leading-tight">
                  भक्त
                  <br />
                  योगदान
                </span>
              </button>
            </div>
          </motion.div>
        );

      case "mala":
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="pb-32 min-h-[calc(100vh-60px)] flex flex-col">
            <div className="sticky top-[60px] z-10 bg-paper/90 backdrop-blur-sm border-b border-ink-light/30 p-4 flex items-center justify-center shadow-sm">
              <button
                onClick={() => navigateTo('home')}
                className="absolute left-4 p-2 -ml-2 rounded-full hover:bg-ink/10"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <h1 className="font-heading text-2xl tracking-wide text-center w-full">|| डिजिटल जाप माला ||</h1>
            </div>
            
            <div className="flex-1 flex flex-col items-center justify-center relative px-4 mt-8">
              <div className="text-8xl font-heading text-accent mb-2 drop-shadow-sm z-10 flex items-center justify-center w-40 h-40 bg-white/50 rounded-full shadow-inner border border-ink/10">{malaCount}</div>
              <div className="text-lg font-bold text-ink-light mb-12 bg-white/50 px-6 py-2 rounded-full border border-ink/10 z-10 mt-4">
                माला पूर्ण: <span className="text-accent-dark">{malaLaps}</span>
              </div>
              
              <div className="relative flex items-center justify-center">
                {/* Decorative background rings */}
                <div className="absolute flex items-center justify-center pointer-events-none opacity-5">
                  <div className="w-64 h-64 rounded-full border-[20px] border-ink"></div>
                  <div className="absolute w-80 h-80 rounded-full border-[2px] border-ink border-dashed"></div>
                </div>

                <button 
                  onClick={() => {
                    if (navigator.vibrate) navigator.vibrate(50);
                    playOmVishnu();
                    if (malaCount + 1 >= 108) {
                      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
                      setMalaCount(0);
                      setMalaLaps(l => l + 1);
                    } else {
                      setMalaCount(c => c + 1);
                    }
                  }}
                  className="relative w-56 h-56 rounded-full bg-gradient-to-br from-accent to-accent-dark text-white shadow-2xl flex items-center justify-center active:scale-95 transition-all border-[12px] border-white/30 group z-10"
                >
                  <div className="absolute inset-0 rounded-full bg-white/20 opacity-0 group-active:opacity-100 transition-opacity"></div>
                  <span className="text-3xl font-bold font-heading tracking-wider">जाप करें</span>
                </button>
              </div>
              
              <button 
                onClick={() => { 
                  if(window.confirm('क्या आप माला रीसेट करना चाहते हैं?')) {
                    setMalaCount(0); setMalaLaps(0); 
                  }
                }} 
                className="mt-16 flex items-center gap-2 text-ink-light hover:text-ink transition-colors bg-white/50 px-4 py-2 rounded-xl z-10"
              >
                <RotateCcw className="w-4 h-4" /> रीसेट करें
              </button>
            </div>
          </motion.div>
        );

      case "niyam":
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="pb-32">
            <div className="sticky top-[60px] z-10 bg-paper/90 backdrop-blur-sm border-b border-ink-light/30 p-4 flex items-center justify-center shadow-sm">
              <button
                onClick={() => navigateTo('home')}
                className="absolute left-4 p-2 -ml-2 rounded-full hover:bg-ink/10"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <h1 className="font-heading text-2xl tracking-wide text-center w-full">|| २९ नियम ||</h1>
            </div>
            
            <div className="px-4 pt-6">
              <div className="bg-white/90 p-6 rounded-3xl shadow-sm border border-ink/10 mb-6 text-center">
                <p className="text-ink leading-relaxed font-medium">
                  बिश्नोई समाज की स्थापना गुरु जाम्भेश्वर भगवान ने इन्हीं 29 नियमों के आधार पर की थी। 
                  "बीस और नौ बिश्नोई" - जो इन 29 नियमों का पालन करता है, वही बिश्नोई है।
                </p>
              </div>

              <div className="space-y-3">
                {niyams.length > 0 ? niyams.map((niyam, idx) => (
                  <div key={idx} className="flex items-start gap-4 bg-white p-4 rounded-2xl shadow-sm border border-ink/5 hover:border-accent/30 transition-colors">
                    <div className="w-8 h-8 shrink-0 rounded-full bg-accent/10 text-accent font-bold flex items-center justify-center text-sm">
                      {idx + 1}
                    </div>
                    <p className="text-ink font-medium pt-1 leading-relaxed">{niyam}</p>
                  </div>
                )) : <div className="text-center text-ink-light py-10"><Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" /> डेटा लोड हो रहा है...</div>}
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
            className="pb-32"
          >
            <div className="sticky top-[60px] z-10 bg-paper/90 backdrop-blur-sm border-b border-ink-light/30 p-4 flex items-center justify-center shadow-sm">
              <button
                onClick={handleBack}
                className="absolute left-4 p-2 -ml-2 rounded-full hover:bg-ink/10"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <h1 className="font-heading text-2xl tracking-wide text-center w-full">
                || संपूर्ण शब्दवाणी ||
              </h1>
            </div>
            <div className="flex flex-col p-2 mt-2">
              {shabads.length > 0 ? shabads.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleShabadClick(item)}
                  className="flex items-center p-4 mx-2 my-1.5 bg-white/60 rounded-2xl border border-ink/5 hover:bg-white/90 transition-all shadow-sm text-left group"
                >
                  <BookOpenText className="w-6 h-6 mr-4 text-ink-light shrink-0" />
                  <span className="text-xl font-semibold leading-tight flex-1 text-ink">
                    {item.title}
                  </span>
                  <ChevronRight className="w-5 h-5 text-ink-light/40 group-hover:text-ink-light transition-colors" />
                </button>
              )) : <div className="text-center text-ink-light py-10"><Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" /> डेटा लोड हो रहा है...</div>}
            </div>
          </motion.div>
        );

      case "category_list":
        const categoryData = {
          aarti: { title: "आरती", list: aartis },
          bhajan: { title: "भजन", list: bhajans },
          sakhi: { title: "साखी", list: sakhis },
          mantra: { title: "मंत्र", list: mantras },
        }[selectedCategory];

        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="pb-32"
          >
            <div className="sticky top-[60px] z-10 bg-paper/90 backdrop-blur-sm border-b border-ink-light/30 p-4 flex items-center justify-center shadow-sm">
              <button
                onClick={handleBack}
                className="absolute left-4 p-2 -ml-2 rounded-full hover:bg-ink/10"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <h1 className="font-heading text-2xl tracking-wide text-center w-full">
                || {categoryData.title} ||
              </h1>
            </div>
            <div className="flex flex-col p-2 mt-2">
              {categoryData.list.length > 0 ? categoryData.list.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setSelectedShabad(item);
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
              )) : <div className="text-center text-ink-light py-10"><Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" /> डेटा लोड हो रहा है...</div>}
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
            <div className="sticky top-[60px] z-10 bg-paper/90 backdrop-blur-sm border-b border-ink-light/30 p-4 flex items-center justify-center shadow-sm">
              <button
                onClick={handleBack}
                className="absolute left-4 p-2 -ml-2 rounded-full hover:bg-ink/10"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <h1 className="font-heading text-2xl tracking-wide text-center w-full">
                || भक्त योगदान ||
              </h1>
            </div>
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
                    <p className="text-sm text-ink-light mb-4 flex items-center gap-2">
                      <Users className="w-4 h-4" /> {item.author}
                    </p>
                    <p className="text-ink whitespace-pre-wrap line-clamp-3 mb-4">
                      {item.text}
                    </p>
                    <button
                      onClick={() => {
                        setSelectedShabad(item);
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
      case "audio_reading":
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="min-h-screen flex flex-col pb-32"
          >
            <div className="sticky top-[60px] z-10 bg-paper/95 backdrop-blur-md p-3 flex items-center justify-between shadow-sm border-b border-ink/10">
              <button
                onClick={handleBack}
                className="p-2 -ml-1 rounded-full hover:bg-ink/10 shrink-0"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

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
                  onClick={() => setIsBookmarked(!isBookmarked)}
                  className="p-2 rounded-full hover:bg-ink/10 transition-colors"
                >
                  <Bookmark
                    className={`w-5 h-5 ${isBookmarked ? "fill-accent text-accent" : "text-ink-light"}`}
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
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedShabad?.id}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                {...bindSwipe()}
                className="px-5 py-6 flex-1 flex flex-col items-center w-full touch-pan-y"
              >
                {currentScreen === "audio_reading" &&
                  selectedShabad?.audioUrl && (
                    <AudioPlayer url={selectedShabad.audioUrl} onEnded={handleAudioEnded} />
                  )}

                <div className="w-full max-w-md bg-gradient-to-r from-accent to-accent-dark text-white text-center py-3 px-4 rounded-2xl shadow-md mb-6 border border-ink/20 relative overflow-hidden">
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20"></div>
                  <h2 className="text-2xl font-semibold relative z-10">
                    {selectedShabad?.title}
                  </h2>
                  {selectedShabad?.author && (
                    <p className="text-xs opacity-80 mt-1 relative z-10">
                      द्वारा: {selectedShabad.author}
                    </p>
                  )}
                </div>

                <div
                  className="text-center leading-relaxed max-w-2xl whitespace-pre-wrap mt-2 bg-white/60 p-6 sm:p-8 rounded-3xl shadow-sm border border-ink/10 text-ink select-none"
                  style={{ fontSize: `${fontSize}px` }}
                >
                  {selectedShabad?.text || "डेटा लोड हो रहा है..."}
                </div>

                {/* Swipe Indicators */}
                <div className="flex justify-between w-full max-w-md mt-8 text-ink-light/50 px-4">
                  <div className="flex items-center gap-1 text-xs">
                    <ChevronLeft className="w-4 h-4" /> पिछला
                  </div>
                  <div className="flex items-center gap-1 text-xs">
                    अगला <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        );

      case "amavasya":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="pb-32 px-4"
          >
            <div className="sticky top-[60px] z-10 bg-paper/90 backdrop-blur-sm py-4 flex items-center justify-center shadow-sm border-b border-ink/10 mb-6">
              <button
                onClick={handleBack}
                className="absolute left-0 p-2 rounded-full hover:bg-ink/10"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <h1 className="font-heading text-2xl tracking-wide text-center w-full">
                || अमावस्या दर्शन ||
              </h1>
            </div>

            <div className="flex items-center justify-between bg-white/90 shadow-md border border-ink/10 rounded-full py-3 px-6 mb-8 max-w-sm mx-auto">
              <button
                onClick={() => setSelectedYear((y) => y - 1)}
                className="p-2 hover:bg-ink/10 rounded-full transition-colors"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <span className="text-3xl font-bold text-accent-dark">
                {selectedYear}
              </span>
              <button
                onClick={() => setSelectedYear((y) => y + 1)}
                className="p-2 hover:bg-ink/10 rounded-full transition-colors"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6 max-w-2xl mx-auto">
              {amavasyaList.map((item, idx) => (
                <div
                  key={idx}
                  className="border border-accent/20 rounded-[2rem] bg-white/80 shadow-lg relative overflow-hidden group hover:shadow-xl transition-all backdrop-blur-sm"
                >
                  {/* Decorative background mandala/pattern */}
                  <div className="absolute -right-10 -top-10 w-40 h-40 bg-accent/10 rounded-full blur-3xl group-hover:bg-accent/20 transition-all"></div>

                  {/* Premium Header for Card */}
                  <div className="p-6 flex items-center justify-between border-b border-ink/5 relative z-10">
                    <div>
                      <h3 className="text-4xl font-heading text-accent-dark mb-1 drop-shadow-sm">
                        {item.hindiMonth}
                      </h3>
                      <p className="text-sm font-bold text-ink/60 tracking-wide">
                        {item.gregorianMonth} • {item.sub}
                      </p>
                    </div>
                    {/* Jambho Ji Photo in Header */}
                    <div className="shrink-0 ml-4 relative">
                      <div className="absolute inset-0 bg-accent rounded-full blur-md opacity-40 animate-pulse"></div>
                      <img
                        src="https://images.unsplash.com/photo-1588414734732-660b07304ddb?auto=format&fit=crop&q=80&w=100&h=100"
                        alt="Jambho Ji"
                        className="w-16 h-16 rounded-full border-2 border-white ring-4 ring-accent/30 shadow-lg object-cover relative z-10"
                      />
                    </div>
                  </div>

                  <div className="p-6 bg-gradient-to-b from-transparent to-paper-light/50 relative z-10">
                    <div className="flex flex-col gap-4">
                      <div className="flex items-start gap-4">
                        <div className="mt-1 bg-green-100 p-2 rounded-full shadow-inner">
                          <div className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-ink/50 uppercase tracking-wider mb-0.5">
                            प्रारम्भ
                          </p>
                          <p className="text-ink font-medium">{item.start}</p>
                        </div>
                      </div>

                      <div className="w-px h-6 bg-ink/10 ml-5 -my-2"></div>

                      <div className="flex items-start gap-4">
                        <div className="mt-1 bg-red-100 p-2 rounded-full shadow-inner">
                          <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]"></div>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-ink/50 uppercase tracking-wider mb-0.5">
                            समाप्त
                          </p>
                          <p className="text-ink font-medium">{item.end}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        );

      case "donate":
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pb-32 px-6 pt-6 text-center"
          >
            <HeartHandshake className="w-20 h-20 mx-auto text-accent mb-4" />
            <h2 className="font-heading text-3xl mb-4">विशेष सहयोग</h2>
            <p className="text-lg mb-8 text-ink-light">
              इस निःशुल्क और विज्ञापन-मुक्त ऐप को सुचारू रूप से चलाने और नए
              फीचर्स जोड़ने के लिए आपके सहयोग की आवश्यकता है।
            </p>

            <div className="bg-white/90 p-6 rounded-3xl shadow-xl border border-ink/10 flex flex-col items-center">
              <h3 className="text-xl font-bold mb-6 text-ink">
                UPI द्वारा सहयोग करें
              </h3>

              {/* QR Code Section */}
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-ink/10 mb-6 relative group">
                <div className="absolute inset-0 bg-accent/5 rounded-2xl transform scale-105 -z-10 transition-transform group-hover:scale-110"></div>
                <img
                  src={settings.qrCodeUrl}
                  alt="UPI QR Code"
                  className="w-40 h-40 object-contain"
                />
              </div>

              <div className="w-full relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-ink/10"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-ink-light">
                    या UPI ID कॉपी करें
                  </span>
                </div>
              </div>

              <p className="text-xl font-mono bg-paper p-4 rounded-xl border border-ink/20 mb-4 w-full text-center font-bold tracking-wide">
                {settings.upiId}
              </p>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(settings.upiId);
                  alert("UPI ID कॉपी हो गई है!");
                }}
                className="bg-gradient-to-r from-accent to-accent-dark text-white px-8 py-3.5 rounded-full font-bold shadow-lg w-full hover:shadow-xl hover:scale-[1.02] transition-all"
              >
                Copy UPI ID
              </button>
            </div>
          </motion.div>
        );

      case "about":
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pb-32 px-6 pt-6 text-center"
          >
            <div className="relative inline-block mb-6">
              <img
                src={settings.logoUrl}
                alt="Logo"
                className="w-24 h-24 rounded-full shadow-lg border-4 border-white object-cover"
              />
            </div>
            <h2 className="font-heading text-3xl mb-4">हमारे बारे में</h2>
            <div className="bg-white/80 p-6 rounded-3xl shadow-md border border-ink/10 text-left space-y-4 text-lg">
              <p>
                <b>शब्दवाणी</b> ऐप बिश्नोई समाज और अन्य श्रद्धालुओं के लिए एक
                निःशुल्क, सामुदायिक पहल है।
              </p>
              <p>
                <b>कॉपीराइट अस्वीकरण (Disclaimer):</b> इस ऐप में संकलित
                शब्दवाणी, भजन और आरती सार्वजनिक डोमेन (Public Domain) और भक्तों
                के स्वैच्छिक योगदान पर आधारित हैं। यह ऐप पूरी तरह से शैक्षिक और
                भक्ति (Devotional) उद्देश्यों के लिए बनाया गया है। इसका उद्देश्य
                किसी भी प्रकार का व्यावसायिक लाभ कमाना नहीं है।
              </p>
              <p>
                यदि आपको किसी सामग्री से संबंधित कोई आपत्ति है, तो कृपया हमसे
                संपर्क करें।
              </p>
            </div>
          </motion.div>
        );

      case "privacy":
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pb-32 px-6 pt-6 text-center"
          >
            <ShieldCheck className="w-20 h-20 mx-auto text-accent mb-4" />
            <h2 className="font-heading text-3xl mb-4">गोपनीयता नीति</h2>
            <div className="bg-white/80 p-6 rounded-3xl shadow-md border border-ink/10 text-left space-y-4 text-lg">
              <p>आपकी गोपनीयता हमारे लिए अत्यंत महत्वपूर्ण है।</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  हम आपका कोई भी व्यक्तिगत डेटा (Personal Data) सर्वर पर सेव
                  नहीं करते हैं।
                </li>
                <li>
                  ऐप को चलाने के लिए किसी विशेष परमिशन (जैसे कैमरा, लोकेशन) की
                  आवश्यकता नहीं है।
                </li>
                <li>यह ऐप पूरी तरह से सुरक्षित है।</li>
              </ul>
            </div>
          </motion.div>
        );

      case "contribute":
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pb-32 px-6 pt-6"
          >
            <div className="text-center mb-6">
              <UploadCloud className="w-16 h-16 mx-auto text-accent mb-2" />
              <h2 className="font-heading text-3xl">सामग्री जोड़ें</h2>
              <p className="text-ink-light">भजन, आरती या शब्दवाणी अपलोड करें</p>
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
                  <option>शब्द</option>
                  <option>भजन</option>
                  <option>आरती</option>
                  <option>मंत्र</option>
                </select>
              </div>
              <div>
                <label className="block font-bold mb-1 text-ink">
                  ऑडियो लिंक (Audio URL - Optional)
                </label>
                <input
                  value={contribAudio}
                  onChange={(e) => setContribAudio(e.target.value)}
                  type="url"
                  className="w-full p-3 rounded-xl border border-ink/20 bg-white focus:border-accent outline-none transition-colors"
                  placeholder="https://..."
                />
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
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-accent to-accent-dark text-white font-bold py-3.5 rounded-xl shadow-md mt-4 hover:shadow-lg hover:scale-[1.02] transition-all"
              >
                सबमिट करें (Submit)
              </button>
              <p className="text-xs text-center text-ink-light mt-3">
                * सभी सबमिशन एडमिन द्वारा रिव्यु किए जाएंगे।
              </p>
            </form>
          </motion.div>
        );

      case "search":
        const filteredShabads = searchQuery ? shabads.filter(s => s.title.toLowerCase().includes(searchQuery.toLowerCase()) || (s.text && s.text.toLowerCase().includes(searchQuery.toLowerCase()))) : [];
        const filteredAartis = searchQuery ? aartis.filter(m => m.title.toLowerCase().includes(searchQuery.toLowerCase()) || (m.text && m.text.toLowerCase().includes(searchQuery.toLowerCase()))) : [];
        const filteredBhajans = searchQuery ? bhajans.filter(m => m.title.toLowerCase().includes(searchQuery.toLowerCase()) || (m.text && m.text.toLowerCase().includes(searchQuery.toLowerCase()))) : [];
        const filteredSakhis = searchQuery ? sakhis.filter(m => m.title.toLowerCase().includes(searchQuery.toLowerCase()) || (m.text && m.text.toLowerCase().includes(searchQuery.toLowerCase()))) : [];
        const filteredMantras = searchQuery ? mantras.filter(m => m.title.toLowerCase().includes(searchQuery.toLowerCase()) || (m.text && m.text.toLowerCase().includes(searchQuery.toLowerCase()))) : [];
        const filteredMeles = searchQuery ? meles.filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()) || m.location.toLowerCase().includes(searchQuery.toLowerCase())) : [];
        
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pb-32 px-4 pt-4">
            <div className="flex items-center gap-3 mb-6">
              <button onClick={() => navigateTo('home')} className="p-2 bg-white rounded-full shadow-sm border border-ink/10">
                <ChevronLeft className="w-6 h-6" />
              </button>
              <div className="flex-1 relative">
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
                {filteredShabads.length > 0 && (
                  <div>
                    <h3 className="font-bold text-lg mb-3 text-accent-dark">शब्दवाणी ({filteredShabads.length})</h3>
                    <div className="space-y-3">
                      {filteredShabads.map(s => (
                        <button key={s.id} onClick={() => handleShabadClick(s)} className="w-full text-left bg-white p-4 rounded-2xl shadow-sm border border-ink/5">
                          <h4 className="font-bold text-ink">{s.title}</h4>
                          <p className="text-sm text-ink-light line-clamp-1 mt-1">{s.text}</p>
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
                        <button key={m.id} onClick={() => { setSelectedShabad(m); setSelectedCategory("aarti"); navigateTo('audio_reading'); }} className="w-full text-left bg-white p-4 rounded-2xl shadow-sm border border-ink/5">
                          <h4 className="font-bold text-ink">{m.title}</h4>
                          <p className="text-sm text-ink-light line-clamp-1 mt-1">{m.text}</p>
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
                        <button key={m.id} onClick={() => { setSelectedShabad(m); setSelectedCategory("bhajan"); navigateTo('audio_reading'); }} className="w-full text-left bg-white p-4 rounded-2xl shadow-sm border border-ink/5">
                          <h4 className="font-bold text-ink">{m.title}</h4>
                          <p className="text-sm text-ink-light line-clamp-1 mt-1">{m.text}</p>
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
                        <button key={m.id} onClick={() => { setSelectedShabad(m); setSelectedCategory("sakhi"); navigateTo('audio_reading'); }} className="w-full text-left bg-white p-4 rounded-2xl shadow-sm border border-ink/5">
                          <h4 className="font-bold text-ink">{m.title}</h4>
                          <p className="text-sm text-ink-light line-clamp-1 mt-1">{m.text}</p>
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
                        <button key={m.id} onClick={() => { setSelectedShabad(m); setSelectedCategory("mantra"); navigateTo('audio_reading'); }} className="w-full text-left bg-white p-4 rounded-2xl shadow-sm border border-ink/5">
                          <h4 className="font-bold text-ink">{m.title}</h4>
                          <p className="text-sm text-ink-light line-clamp-1 mt-1">{m.text}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {filteredMeles.length > 0 && (
                  <div>
                    <h3 className="font-bold text-lg mb-3 text-accent-dark">मेले ({filteredMeles.length})</h3>
                    <div className="space-y-3">
                      {filteredMeles.map((m, idx) => (
                        <div key={idx} className="bg-white p-4 rounded-2xl shadow-sm border border-ink/5">
                          <h4 className="font-bold text-ink">{m.name}</h4>
                          <p className="text-sm text-ink-light mt-1">{m.location} • {m.dateStr}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {filteredShabads.length === 0 && filteredAartis.length === 0 && filteredBhajans.length === 0 && filteredSakhis.length === 0 && filteredMantras.length === 0 && filteredMeles.length === 0 && (
                  <div className="text-center py-12 text-ink-light">
                    <Search className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>कोई परिणाम नहीं मिला</p>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        );

      case "choghadiya":
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pb-32 px-4 pt-4"
          >
            <div className="flex items-center gap-3 mb-6 bg-gradient-to-r from-accent to-accent-dark text-white p-4 rounded-3xl shadow-lg">
              <button
                onClick={() => navigateTo("home")}
                className="p-2 rounded-full hover:bg-white/20"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <h1 className="text-2xl font-bold flex-1 text-center">|| चौघड़िया मुहूर्त ||</h1>
              <Sun className="w-8 h-8" />
            </div>

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
                            key={idx}
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
                            key={idx}
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
                      नोट: यह समय {choghadiyaLocation} के सटीक
                      सूर्योदय/सूर्यास्त पर आधारित है।
                    </p>
                  </div>
                )}
            </div>
          </motion.div>
        );

      case "bichhuda":
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pb-32 px-4 pt-4"
          >
            <div className="flex items-center gap-3 mb-6 bg-gradient-to-r from-accent to-accent-dark text-white p-4 rounded-3xl shadow-lg">
              <button
                onClick={() => navigateTo("home")}
                className="p-2 rounded-full hover:bg-white/20"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <h1 className="text-2xl font-bold flex-1 text-center">
                || बिछुड़ा (पंचक) ||
              </h1>
              <Book className="w-8 h-8" />
            </div>

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
                    <option key={i} value={i}>
                      {m}
                    </option>
                  ))}
                </select>
                <select
                  value={bichhudaYear}
                  onChange={(e) => setBichhudaYear(Number(e.target.value))}
                  className="p-2 rounded-xl border border-ink/20 bg-white font-bold text-accent-dark text-sm"
                >
                  {[
                    new Date().getFullYear() - 1,
                    new Date().getFullYear(),
                    new Date().getFullYear() + 1,
                  ].map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-3 mb-8">
                {bichhudaList
                  .filter((_, i) => i === bichhudaMonth)
                  .map((item, idx) => (
                    <div
                      key={idx}
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
            className="pb-32 px-4 pt-4"
          >
            <div className="flex items-center gap-3 mb-6 bg-gradient-to-r from-accent to-accent-dark text-white p-4 rounded-3xl shadow-lg">
              <button
                onClick={() => navigateTo("home")}
                className="p-2 rounded-full hover:bg-white/20"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <h1 className="text-2xl font-bold flex-1 text-center">|| आगामी प्रमुख मेले ||</h1>
              <Users className="w-8 h-8" />
            </div>

            <div className="space-y-4">
              {processedMeles.map((mela, idx) => (
                <div
                  key={idx}
                  className={`bg-white/90 p-5 rounded-3xl shadow-sm border ${mela.upcoming ? "border-accent/50 ring-1 ring-accent/20" : "border-ink/5"} relative overflow-hidden`}
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
            className="min-h-screen flex flex-col items-center justify-center px-6 pb-32"
          >
            <div className="bg-white/90 backdrop-blur-md p-8 rounded-3xl shadow-2xl border border-ink/10 w-full max-w-sm text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-accent to-accent-dark"></div>
              <KeyRound className="w-16 h-16 mx-auto text-accent mb-4" />
              <h2 className="text-2xl font-heading mb-2 text-ink">
                || Admin Access ||
              </h2>
              <p className="text-sm text-ink-light mb-6">
                कृपया व्यवस्थापक पासवर्ड दर्ज करें
              </p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  // Default password is '2929' (29 rules of Bishnoi)
                  if (adminPasswordInput === "2929") {
                    setIsAdminAuthenticated(true);
                    setAdminPasswordInput("");
                    navigateTo("admin");
                  } else {
                    alert("गलत पासवर्ड!");
                    setAdminPasswordInput("");
                  }
                }}
              >
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
                  className="w-full bg-gradient-to-r from-accent to-accent-dark text-white font-bold py-3.5 rounded-xl shadow-lg hover:shadow-xl transition-all"
                >
                  लॉगिन करें
                </button>
              </form>
              <button
                onClick={() => navigateTo("home")}
                className="mt-6 text-ink-light text-sm underline hover:text-ink"
              >
                वापस जाएं
              </button>
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
              <h1 className="text-2xl font-bold flex-1 text-center">|| Admin Dashboard ||</h1>
              <ShieldCheck className="w-8 h-8" />
            </div>

            <div className="space-y-8">

              {/* Add New Content Section */}
              <div className="bg-white/90 p-6 rounded-3xl shadow-sm border border-ink/10">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2 border-b border-ink/10 pb-2">
                  <PlusCircle className="w-5 h-5" /> नई सामग्री जोड़ें (Add
                  Content)
                </h2>
                <form onSubmit={handleAdminSubmitData} className="space-y-4">
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
                      <option>नियम</option>
                      <option>मेले</option>
                    </select>
                  </div>

                  {contribType !== "सुविचार" && contribType !== "नियम" && contribType !== "मेले" && (
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
                          ऑडियो लिंक (Audio URL - Optional)
                        </label>
                        <input
                          value={contribAudio}
                          onChange={(e) => setContribAudio(e.target.value)}
                          type="url"
                          className="w-full p-3 rounded-xl border border-ink/20 bg-white focus:border-accent outline-none transition-colors"
                          placeholder="https://..."
                        />
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
                        : contribType === "नियम"
                        ? "नियम (Rule)"
                        : contribType === "मेले"
                          ? "विवरण (Description)"
                          : "पाठ (Text / Lyrics)"}
                    </label>
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
                    disabled={isSaving}
                    className="w-full bg-gradient-to-r from-accent to-accent-dark text-white font-bold py-3.5 rounded-xl flex justify-center items-center gap-2 shadow-md hover:shadow-lg transition-all"
                  >
                    {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                    {isSaving ? "सेव हो रहा है..." : "जोड़ें (Save)"}
                  </button>
                </form>
              </div>

              {/* Manage Content Section */}
              <div className="bg-white/90 p-6 rounded-3xl shadow-sm border border-ink/10">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2 border-b border-ink/10 pb-2"><Edit3 className="w-5 h-5" /> प्रबंधित करें (Manage)</h2>
                <div className="space-y-6">
                  {/* Shabads */}
                  <div><h3 className="font-bold text-lg mb-2 text-accent-dark">शब्दवाणी ({shabads.length})</h3>
                    <div className="max-h-40 overflow-y-auto space-y-2 pr-2">
                      {shabads.map((s) => (
                        <div key={s.id} className="flex items-center justify-between bg-paper p-3 rounded-xl border border-ink/5">
                          <span className="font-medium truncate flex-1">{s.title}</span>
                          <div className="flex gap-2">
                            <button onClick={() => openEditModal("शब्द", s)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg"><Edit3 className="w-4 h-4" /></button>
                            <button onClick={() => handleDelete("शब्द", s.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><XCircle className="w-4 h-4" /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Aartis */}
                  <div><h3 className="font-bold text-lg mb-2 text-accent-dark">आरती ({aartis.length})</h3>
                    <div className="max-h-40 overflow-y-auto space-y-2 pr-2">
                      {aartis.map((m) => (
                        <div key={m.id} className="flex items-center justify-between bg-paper p-3 rounded-xl border border-ink/5">
                          <span className="font-medium truncate flex-1">{m.title}</span>
                          <div className="flex gap-2">
                            <button onClick={() => openEditModal("आरती", m)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg"><Edit3 className="w-4 h-4" /></button>
                            <button onClick={() => handleDelete("आरती", m.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><XCircle className="w-4 h-4" /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Bhajans */}
                  <div><h3 className="font-bold text-lg mb-2 text-accent-dark">भजन ({bhajans.length})</h3>
                    <div className="max-h-40 overflow-y-auto space-y-2 pr-2">
                      {bhajans.map((m) => (
                        <div key={m.id} className="flex items-center justify-between bg-paper p-3 rounded-xl border border-ink/5">
                          <span className="font-medium truncate flex-1">{m.title}</span>
                          <div className="flex gap-2">
                            <button onClick={() => openEditModal("भजन", m)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg"><Edit3 className="w-4 h-4" /></button>
                            <button onClick={() => handleDelete("भजन", m.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><XCircle className="w-4 h-4" /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Sakhis */}
                  <div><h3 className="font-bold text-lg mb-2 text-accent-dark">साखी ({sakhis.length})</h3>
                    <div className="max-h-40 overflow-y-auto space-y-2 pr-2">
                      {sakhis.map((m) => (
                        <div key={m.id} className="flex items-center justify-between bg-paper p-3 rounded-xl border border-ink/5">
                          <span className="font-medium truncate flex-1">{m.title}</span>
                          <div className="flex gap-2">
                            <button onClick={() => openEditModal("साखी", m)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg"><Edit3 className="w-4 h-4" /></button>
                            <button onClick={() => handleDelete("साखी", m.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><XCircle className="w-4 h-4" /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Mantras */}
                  <div><h3 className="font-bold text-lg mb-2 text-accent-dark">मंत्र ({mantras.length})</h3>
                    <div className="max-h-40 overflow-y-auto space-y-2 pr-2">
                      {mantras.map((m) => (
                        <div key={m.id} className="flex items-center justify-between bg-paper p-3 rounded-xl border border-ink/5">
                          <span className="font-medium truncate flex-1">{m.title}</span>
                          <div className="flex gap-2">
                            <button onClick={() => openEditModal("मंत्र", m)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg"><Edit3 className="w-4 h-4" /></button>
                            <button onClick={() => handleDelete("मंत्र", m.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><XCircle className="w-4 h-4" /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Niyams */}
                  <div><h3 className="font-bold text-lg mb-2 text-accent-dark">नियम ({niyams.length})</h3>
                    <div className="max-h-40 overflow-y-auto space-y-2 pr-2">
                      {niyams.map((t, i) => (
                        <div key={i} className="flex items-center justify-between bg-paper p-3 rounded-xl border border-ink/5">
                          <span className="font-medium truncate flex-1 text-sm">{t}</span>
                          <div className="flex gap-2">
                            <button onClick={() => handleDelete("नियम", t)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><XCircle className="w-4 h-4" /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Thoughts */}
                  <div><h3 className="font-bold text-lg mb-2 text-accent-dark">सुविचार ({thoughts.length})</h3>
                    <div className="max-h-40 overflow-y-auto space-y-2 pr-2">
                      {thoughts.map((t, i) => (
                        <div key={i} className="flex items-center justify-between bg-paper p-3 rounded-xl border border-ink/5">
                          <span className="font-medium truncate flex-1 text-sm">{t}</span>
                          <div className="flex gap-2">
                            <button onClick={() => handleDelete("सुविचार", t)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><XCircle className="w-4 h-4" /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Meles */}
                  <div><h3 className="font-bold text-lg mb-2 text-accent-dark">मेले ({meles.length})</h3>
                    <div className="max-h-40 overflow-y-auto space-y-2 pr-2">
                      {meles.map((m, i) => (
                        <div key={i} className="flex items-center justify-between bg-paper p-3 rounded-xl border border-ink/5">
                          <span className="font-medium truncate flex-1 text-sm">{m.name} - {m.dateStr}</span>
                          <div className="flex gap-2">
                            <button onClick={() => openEditModal("मेले", m, i)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg"><Edit3 className="w-4 h-4" /></button>
                            <button onClick={() => handleDelete("मेले", m.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><XCircle className="w-4 h-4" /></button>
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
                      Logo URL
                    </label>
                    <input
                      type="text"
                      value={settings.logoUrl}
                      onChange={(e) =>
                        setSettings({ ...settings, logoUrl: e.target.value })
                      }
                      className="w-full p-2 rounded-lg border border-ink/20 bg-white text-sm"
                    />
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
                      QR Code URL
                    </label>
                    <input
                      type="text"
                      value={settings.qrCodeUrl}
                      onChange={(e) =>
                        setSettings({ ...settings, qrCodeUrl: e.target.value })
                      }
                      className="w-full p-2 rounded-lg border border-ink/20 bg-white text-sm"
                    />
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
                      className="w-full p-2 rounded-lg border border-ink/20 bg-white text-sm"
                    />
                  </div>
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
                        <p className="text-sm line-clamp-2 mb-3 bg-white/50 p-2 rounded">
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
                            onClick={() => rejectPost(post.id)}
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
                  <h2 className="text-xl font-bold mb-4">संपादित करें</h2>
                  <form onSubmit={handleEditSave} className="space-y-4">
                    {editItemData.type !== "सुविचार" && editItemData.type !== "नियम" && editItemData.type !== "मेले" && (
                        <>
                          <input value={editItemData.title || ""} onChange={(e) => setEditItemData({ ...editItemData, title: e.target.value }) } required type="text" className="w-full p-3 rounded-xl border border-ink/20" />
                          <input value={editItemData.audioUrl || ""} onChange={(e) => setEditItemData({ ...editItemData, audioUrl: e.target.value }) } type="url" className="w-full p-3 rounded-xl border border-ink/20" />
                        </>
                      )}
                    {editItemData.type === "मेले" && (
                      <>
                        <input value={editItemData.name || ""} onChange={(e) => setEditItemData({ ...editItemData, name: e.target.value }) } required type="text" className="w-full p-3 rounded-xl border border-ink/20" />
                        <input value={editItemData.dateStr || ""} onChange={(e) => setEditItemData({ ...editItemData, dateStr: e.target.value }) } required type="date" className="w-full p-3 rounded-xl border border-ink/20" />
                        <input value={editItemData.location || ""} onChange={(e) => setEditItemData({ ...editItemData, location: e.target.value }) } required type="text" className="w-full p-3 rounded-xl border border-ink/20" />
                      </>
                    )}
                    <textarea value={editItemData.text || editItemData.desc || ""} onChange={(e) => setEditItemData({ ...editItemData, [editItemData.type === "मेले" ? "desc" : "text"]: e.target.value }) } required className="w-full p-3 rounded-xl border border-ink/20 h-32" ></textarea>
                    <div className="flex gap-3 mt-6">
                      <button type="button" onClick={() => setEditModalOpen(false)} className="flex-1 bg-ink/10 text-ink font-bold py-3 rounded-xl">रद्द करें</button>
                      <button type="submit" disabled={isSaving} className="flex-1 bg-accent text-white font-bold py-3 rounded-xl flex justify-center items-center gap-2">
                        {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : "सेव करें"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </motion.div>
        );

      default: return null;
    }
  };

  return (
    <div className="min-h-screen max-w-md mx-auto relative shadow-2xl bg-paper overflow-x-hidden flex flex-col">
      {currentScreen !== "admin" && currentScreen !== "admin_login" && (
        <Header onNavigate={navigateTo} logoUrl={settings.logoUrl} isAdminAuthenticated={isAdminAuthenticated} unreadCount={unreadCount} onNotificationClick={() => setShowNotifications(true)} />
      )}
      <div className="flex-1 relative"><AnimatePresence mode="wait">{renderScreen()}</AnimatePresence></div>
      {currentScreen !== "admin" && currentScreen !== "admin_login" && (
        <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto z-50 flex flex-col">
          <AdBanner text={settings.adText} />
          <div className="bg-white/95 backdrop-blur-xl border-t border-ink/10 flex justify-around items-center py-2 px-1 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] pb-safe">
            <NavItem icon={<Home className="w-6 h-6" />} label="होम" isActive={currentScreen === "home"} onClick={() => navigateTo("home")} />
            <NavItem icon={<HeartHandshake className="w-6 h-6" />} label="सहयोग" isActive={currentScreen === "donate"} onClick={() => navigateTo("donate")} />
            <NavItem icon={<CalendarDays className="w-6 h-6" />} label="अमावस" isActive={currentScreen === "amavasya"} onClick={() => navigateTo("amavasya")} />
            <NavItem icon={<Info className="w-6 h-6" />} label="हमारे बारे" isActive={currentScreen === "about"} onClick={() => navigateTo("about")} />
            <NavItem icon={<ShieldCheck className="w-6 h-6" />} label="गोपनीयता" isActive={currentScreen === "privacy"} onClick={() => navigateTo("privacy")} />
          </div>
        </div>
      )}
    </div>
  );
}

function NavItem({ icon, label, isActive, onClick }: { icon: React.ReactNode; label: string; isActive: boolean; onClick: () => void; }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center justify-center w-[70px] h-14 rounded-2xl transition-all duration-300 ${isActive ? "text-accent-dark scale-110" : "text-ink-light hover:bg-ink/5"}`}>
      <div className={`mb-1 transition-transform duration-300 ${isActive ? "-translate-y-1" : ""}`}>{icon}</div>
      <span className={`text-[10px] font-bold leading-none transition-opacity duration-300 ${isActive ? "opacity-100" : "opacity-70"}`}>{label}</span>
      {isActive && <div className="absolute bottom-1 w-1 h-1 bg-accent-dark rounded-full"></div>}
    </button>
  );
}