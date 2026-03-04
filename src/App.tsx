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
  CloudUpload, // Naya Icon
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

// --- INITIAL OFFLINE DATA (SIRF UPLOAD KE LIYE) ---
const initialDailyThoughts = [
  "जीव दया पालणी, रूंख लीलो नहीं घावै।",
  "हवन करै नित प्रति, पातक भस्म हो जावै।",
  "शील संतोष रखै, क्षमा धारण करै।",
  "चोरी निंदा झूठ न बोलै, वाद विवाद न करै।",
  "अमावस्या व्रत रखै, विष्णु नाम जपै।",
  "प्रातः काल उठ स्नान करै, संध्या वंदन करै।",
  "पानी वाणी छाण पीवै, ईंधन छाण जलावै।",
];

const initialMeles = [
  {
    name: "मुकाम मेला (फाल्गुन)",
    dateStr: `${new Date().getFullYear()}-03-17`,
    location: "मुकाम, बीकानेर (राजस्थान)",
    desc: "बिश्नोई समाज का सबसे बड़ा और पवित्र मेला। यहाँ गुरु जाम्भेश्वर भगवान की समाधि है।",
  },
  {
    name: "समराथल धोरा मेला",
    dateStr: `${new Date().getFullYear()}-04-02`,
    location: "समराथल, बीकानेर",
    desc: "जहाँ गुरु जाम्भेश्वर ने बिश्नोई पंथ की स्थापना की थी।",
  },
  {
    name: "जांगलू मेला",
    dateStr: `${new Date().getFullYear()}-04-15`,
    location: "जांगलू, बीकानेर",
    desc: "बिश्नोई समाज का एक और महत्वपूर्ण धार्मिक स्थल।",
  },
  {
    name: "मुकाम मेला (आश्विन)",
    dateStr: `${new Date().getFullYear()}-10-10`,
    location: "मुकाम, बीकानेर (राजस्थान)",
    desc: "आश्विन माह की अमावस्या का विशाल मेला।",
  },
  {
    name: "लोदीपुर मेला",
    dateStr: `${new Date().getFullYear()}-11-24`,
    location: "लोदीपुर, उत्तर प्रदेश",
    desc: "उत्तर प्रदेश में बिश्नोई समाज का प्रमुख मेला (कार्तिक पूर्णिमा)।",
  },
];

const initialNiyamList = [
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

const initialShabadList = [
  { title: "वैदिक-मन्त्राः", text: "यहाँ वैदिक मन्त्र आएँगे..." },
  { title: "गायत्री-मन्त्रः", text: "ॐ भूर्भुवः स्वः..." },
  { title: "प्रातःकालीन-सायङ्कालीन वैदि-हवन-मन्त्राः", text: "यहाँ हवन मन्त्र आएँगे..." },
  { title: "अथ गोत्रचार प्रारम्भ", text: "यहाँ गोत्रचार आएगा..." },
  { title: "शब्द 1", text: "ओ३म् गुरु चीन्हों गुरु चिन्ह पुरोहीत..." },
  { title: "शब्द 2", text: "शब्द 2 का पाठ..." },
];

const initialAartiList = [
  { title: "जाम्भोजी की आरती", text: "आरती श्री जाम्भेश्वर जी की...\n\n(यहाँ आरती के सम्पूर्ण बोल आएँगे।)\n\nधूप दीप नैवेद्य आरती..." },
];

const initialBhajanList = [
  { title: "भजन: गुरु महिमा", text: "गुरु ब्रह्मा गुरु विष्णु...\n\n(भजन के बोल यहाँ प्रदर्शित होंगे)" },
];

const initialSakhiList = [
  { title: "साखी: प्रथम", text: "साखी के बोल यहाँ प्रदर्शित होंगे..." },
];

const initialMantraList = [
  { title: "गायत्री मन्त्र", text: "ॐ भूर्भुवः स्वः\nतत्सवितुर्वरेण्यं\nभर्गो देवस्य धीमहि\nधियो यो नः प्रचोदयात्॥" },
];


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
    if (clickCount === 0) onNavigate("home");
    setClickCount((prev) => prev + 1);
    if (clickCount + 1 >= 5) {
      if (isAdminAuthenticated) onNavigate("admin");
      else onNavigate("admin_login");
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
      <div className="flex items-center gap-3 cursor-pointer" onClick={handleLogoClick}>
        <div className="relative">
          <img src={logoUrl} alt="App Logo" className="w-10 h-10 rounded-full shadow-md border-2 border-white object-cover" />
          <div className="absolute -bottom-1 -right-1 bg-green-500 w-3 h-3 rounded-full border-2 border-white"></div>
        </div>
        <h1 className="font-heading text-2xl text-ink tracking-wide mt-1">शब्दवाणी</h1>
      </div>
      <div className="flex items-center gap-4 text-ink-light">
        <button onClick={() => onNavigate("search")} className="hover:text-ink transition-colors"><Search className="w-6 h-6" /></button>
        <button onClick={onNotificationClick} className="hover:text-ink transition-colors relative">
          <Bell className="w-6 h-6" />
          {unreadCount > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold flex items-center justify-center rounded-full border-2 border-paper">{unreadCount}</span>}
        </button>
        <button onClick={() => onNavigate("contribute")} className="hover:text-ink transition-colors relative"><PlusCircle className="w-6 h-6" /></button>
      </div>
    </header>
  );
}

function AdBanner({ text }: { text: string }) {
  if (!text) return null;
  return (
    <div className="bg-white/90 backdrop-blur-md border-t border-ink/10 p-2 text-center flex items-center justify-center gap-3 shadow-[0_-4px_20px_rgba(0,0,0,0.04)]">
      <span className="bg-ink/10 text-ink px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider">AD</span>
      <span className="text-xs font-semibold text-ink-light truncate">{text}</span>
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
      audioRef.current.play().then(() => setIsPlaying(true)).catch((e) => setIsPlaying(false));
    }
  }, [url]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) audioRef.current.pause();
      else audioRef.current.play().catch((e) => console.error("Audio play failed:", e));
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const current = audioRef.current.currentTime;
      const duration = audioRef.current.duration;
      if (duration > 0) setProgress((current / duration) * 100);
    }
  };

  return (
    <div className="bg-gradient-to-br from-paper-light to-white border border-ink/10 rounded-2xl p-4 mb-4 shadow-md flex flex-col gap-3 w-full max-w-md mx-auto">
      <audio ref={audioRef} src={url} onTimeUpdate={handleTimeUpdate} onEnded={() => { setIsPlaying(false); setProgress(0); if (onEnded) onEnded(); }} />
      <div className="flex items-center gap-4">
        <button onClick={togglePlay} className="bg-gradient-to-r from-accent to-accent-dark text-white p-3.5 rounded-full shadow-lg flex-shrink-0">
          {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
        </button>
        <div className="flex-1 h-3 bg-ink/10 rounded-full overflow-hidden cursor-pointer relative shadow-inner" onClick={(e) => {
            if (audioRef.current && audioRef.current.duration) {
              const rect = e.currentTarget.getBoundingClientRect();
              const clickedValue = (e.clientX - rect.left) / rect.width;
              audioRef.current.currentTime = clickedValue * audioRef.current.duration;
              setProgress(clickedValue * 100);
            }
          }}>
          <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-accent to-accent-dark transition-all duration-100 ease-linear" style={{ width: `${progress}%` }} />
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
      window.speechSynthesis.speak(utterance);
    }
  } catch (e) {}
};

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("home");
  const [selectedShabad, setSelectedShabad] = useState<ShabadItem | null>(null);
  const [fontSize, setFontSize] = useState(18);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isSaving, setIsSaving] = useState(false); // Loading state for single items
  const [isUploadingAll, setIsUploadingAll] = useState(false); // Loading state for bulk upload

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [amavasyaList, setAmavasyaList] = useState(() => generateAmavasyaForYear(selectedYear));

  // --- Completely Empty Initial State, Everything from Firebase Now ---
  const [shabads, setShabads] = useState<ShabadItem[]>([]);
  const [aartis, setAartis] = useState<ShabadItem[]>([]);
  const [bhajans, setBhajans] = useState<ShabadItem[]>([]);
  const [sakhis, setSakhis] = useState<ShabadItem[]>([]);
  const [mantras, setMantras] = useState<ShabadItem[]>([]);
  const [thoughts, setThoughts] = useState<string[]>([]);
  const [meles, setMeles] = useState<any[]>([]);
  const [niyams, setNiyams] = useState<string[]>([]); // New Niyam State

  const [selectedCategory, setSelectedCategory] = useState<"aarti" | "bhajan" | "sakhi" | "mantra">("aarti");
  const [pendingPosts, setPendingPosts] = useState<ShabadItem[]>([]);
  const [approvedPosts, setApprovedPosts] = useState<ShabadItem[]>([]);

  useEffect(() => {
    // Fetch ONLY from Firebase now
    const unsubShabads = onSnapshot(collection(db, "shabads"), (snapshot) => {
      setShabads(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as ShabadItem)));
    });
    const unsubAartis = onSnapshot(collection(db, "aartis"), (snapshot) => {
      setAartis(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as ShabadItem)));
    });
    const unsubBhajans = onSnapshot(collection(db, "bhajans"), (snapshot) => {
      setBhajans(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as ShabadItem)));
    });
    const unsubSakhis = onSnapshot(collection(db, "sakhis"), (snapshot) => {
      setSakhis(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as ShabadItem)));
    });
    const unsubMantras = onSnapshot(collection(db, "mantras"), (snapshot) => {
      setMantras(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as ShabadItem)));
    });
    const unsubThoughts = onSnapshot(collection(db, "thoughts"), (snapshot) => {
      setThoughts(snapshot.docs.map((doc) => doc.data().text as string));
    });
    const unsubMeles = onSnapshot(collection(db, "meles"), (snapshot) => {
      setMeles(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as any)));
    });
    const unsubNiyams = onSnapshot(collection(db, "niyams"), (snapshot) => {
        setNiyams(snapshot.docs.map((doc) => doc.data().text as string));
    });
    const unsubPending = onSnapshot(collection(db, "pendingPosts"), (snapshot) => {
      setPendingPosts(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as ShabadItem)));
    });
    const unsubApproved = onSnapshot(collection(db, "approvedPosts"), (snapshot) => {
      setApprovedPosts(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as ShabadItem)));
    });

    return () => {
      unsubShabads(); unsubAartis(); unsubBhajans(); unsubSakhis();
      unsubMantras(); unsubThoughts(); unsubMeles(); unsubPending(); unsubApproved(); unsubNiyams();
    };
  }, []);

  const [dailyThought, setDailyThought] = useState("");
  useEffect(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const dayOfYear = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if(thoughts && thoughts.length > 0){
        setDailyThought(thoughts[dayOfYear % thoughts.length]);
    } else {
        setDailyThought("Loading...");
    }
  }, [thoughts]);

  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([
    { id: "n1", title: "नया अपडेट", message: "अब डेटा सीधा Firebase से आ रहा है।", date: "आज", read: false },
  ]);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
  };

  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState("");
  const [settings, setSettings] = useState<AppSettings>({
    logoUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=shabadwani&backgroundColor=e68a00",
    qrCodeUrl: "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=shabadwani@upi&pn=Shabadwani",
    adText: "प्रीमियम पूजा सामग्री और साहित्य खरीदें - 20% छूट",
    upiId: "shabadwani@upi",
  });

  const [contribTitle, setContribTitle] = useState("");
  const [contribType, setContribType] = useState("शब्द");
  const [contribAudio, setContribAudio] = useState("");
  const [contribText, setContribText] = useState("");
  const [contribAuthor, setContribAuthor] = useState("");
  const [contribDate, setContribDate] = useState("");
  const [contribLocation, setContribLocation] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [malaCount, setMalaCount] = useState(0);
  const [malaLaps, setMalaLaps] = useState(0);

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
      alert("बदलाव सफलतापूर्वक सेव किए गए! ✅");
    } catch (error) {
      alert("अपडेट करने में त्रुटि हुई ❌");
    }
    setIsSaving(false);
  };

  const handleDelete = async (type: string, id: string) => {
    if (!window.confirm("क्या आप वाकई इसे हटाना चाहते हैं?")) return;
    try {
      const coll = type === "शब्द" ? "shabads" : type === "मंत्र" ? "mantras" : type === "आरती" ? "aartis" : type === "भजन" ? "bhajans" : type === "साखी" ? "sakhis" : type === "सुविचार" ? "thoughts" : type === "नियम" ? "niyams" : "meles";
      await deleteDoc(doc(db, coll, id));
      alert("सफलतापूर्वक हटा दिया गया! 🗑️");
    } catch (error) {
      alert("हटाने में त्रुटि हुई ❌");
    }
  };

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

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (contribType === "मेले") {
        await addDoc(collection(db, "meles"), { name: contribTitle, dateStr: contribDate, location: contribLocation, desc: contribText });
      } else {
        const newContent = { title: contribTitle, text: contribText, audioUrl: contribAudio, author: "Admin" };
        const coll = contribType === "शब्द" ? "shabads" : contribType === "भजन" ? "bhajans" : contribType === "आरती" ? "aartis" : contribType === "मंत्र" ? "mantras" : contribType === "साखी" ? "sakhis" : contribType === "नियम" ? "niyams" : "thoughts";
        await addDoc(collection(db, coll), (contribType === "सुविचार" || contribType === "नियम") ? { text: contribText } : newContent);
      }
      alert("नया डेटा सफलतापूर्वक सेव हो गया है! ✅");
      setContribTitle(""); setContribText(""); setContribAudio(""); setContribType("शब्द"); setContribDate(""); setContribLocation("");
    } catch (error) {
      alert("सामग्री जोड़ने में त्रुटि हुई ❌");
    }
    setIsSaving(false);
  };

  // --- MAGIC BUTTON LOGIC: UPLOAD ALL OFFLINE DATA TO FIREBASE ---
  const handleBulkUpload = async () => {
      if (!window.confirm("क्या आप पक्का सारा ऑफलाइन डेटा Firebase पर डालना चाहते हैं? (सिर्फ एक बार ही करें वरना डुप्लीकेट हो जाएगा)")) return;
      setIsUploadingAll(true);
      try {
          for(const item of initialShabadList) await addDoc(collection(db, "shabads"), { title: item.title, text: item.text, author: "Admin" });
          for(const item of initialAartiList) await addDoc(collection(db, "aartis"), { title: item.title, text: item.text, author: "Admin" });
          for(const item of initialBhajanList) await addDoc(collection(db, "bhajans"), { title: item.title, text: item.text, author: "Admin" });
          for(const item of initialSakhiList) await addDoc(collection(db, "sakhis"), { title: item.title, text: item.text, author: "Admin" });
          for(const item of initialMantraList) await addDoc(collection(db, "mantras"), { title: item.title, text: item.text, author: "Admin" });
          for(const item of initialDailyThoughts) await addDoc(collection(db, "thoughts"), { text: item });
          for(const item of initialNiyamList) await addDoc(collection(db, "niyams"), { text: item });
          for(const item of initialMeles) await addDoc(collection(db, "meles"), { name: item.name, dateStr: item.dateStr, location: item.location, desc: item.desc });
          
          alert("बधाई हो! सारा ऑफलाइन डेटा Firebase पर लाइव हो चुका है! 🚀");
      } catch (e) {
          console.error(e);
          alert("Error aayi upload me!");
      }
      setIsUploadingAll(false);
  }


  const renderScreen = () => {
    switch (currentScreen) {
      case "home":
        return (
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="pb-32">
            <div className="mx-4 my-4 p-6 bg-gradient-to-br from-accent to-accent-dark rounded-[2rem] text-white shadow-[0_8px_30px_rgba(230,138,0,0.2)] relative overflow-hidden">
              <div className="absolute -right-4 -top-4 opacity-10"><Sun className="w-32 h-32" /></div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-3 opacity-90"><Quote className="w-5 h-5" /><h3 className="text-sm font-bold tracking-wider uppercase">आज का सुविचार</h3></div>
                <p className="text-xl font-medium leading-snug mb-3">"{dailyThought}"</p>
                <p className="text-sm opacity-80 text-right font-semibold">- गुरु जाम्भेश्वर</p>
              </div>
            </div>

            <div className="flex flex-col gap-4 px-4 mt-6">
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => navigateTo("shabad_list")} className="flex flex-col items-center justify-center p-6 bg-white/80 backdrop-blur-sm rounded-[2rem] border border-ink/5 hover:shadow-lg transition-all group">
                  <div className="bg-accent/10 p-4 rounded-2xl mb-3 group-hover:scale-110 transition-transform"><Book className="w-8 h-8 text-accent-dark" /></div>
                  <span className="text-lg font-bold text-ink text-center leading-tight">संपूर्ण<br />शब्दवाणी</span>
                </button>
                <button onClick={() => navigateTo("amavasya")} className="flex flex-col items-center justify-center p-6 bg-white/80 backdrop-blur-sm rounded-[2rem] border border-ink/5 hover:shadow-lg transition-all group">
                  <div className="bg-accent/10 p-4 rounded-2xl mb-3 group-hover:scale-110 transition-transform"><CalendarDays className="w-8 h-8 text-accent-dark" /></div>
                  <span className="text-lg font-bold text-ink text-center leading-tight">अमावस्या<br />दर्शन</span>
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <button onClick={() => { setSelectedCategory("aarti"); navigateTo("category_list"); }} className="flex flex-col items-center justify-center p-4 bg-white/80 backdrop-blur-sm rounded-[1.5rem] border border-ink/5 hover:shadow-lg transition-all group">
                  <div className="bg-accent/10 p-3 rounded-2xl mb-2 group-hover:scale-110 transition-transform"><Music className="w-6 h-6 text-accent-dark" /></div>
                  <span className="text-sm font-bold text-ink text-center leading-tight">आरती</span>
                </button>
                <button onClick={() => { setSelectedCategory("bhajan"); navigateTo("category_list"); }} className="flex flex-col items-center justify-center p-4 bg-white/80 backdrop-blur-sm rounded-[1.5rem] border border-ink/5 hover:shadow-lg transition-all group">
                  <div className="bg-accent/10 p-3 rounded-2xl mb-2 group-hover:scale-110 transition-transform"><Music className="w-6 h-6 text-accent-dark" /></div>
                  <span className="text-sm font-bold text-ink text-center leading-tight">भजन</span>
                </button>
                <button onClick={() => { setSelectedCategory("sakhi"); navigateTo("category_list"); }} className="flex flex-col items-center justify-center p-4 bg-white/80 backdrop-blur-sm rounded-[1.5rem] border border-ink/5 hover:shadow-lg transition-all group">
                  <div className="bg-accent/10 p-3 rounded-2xl mb-2 group-hover:scale-110 transition-transform"><BookOpenText className="w-6 h-6 text-accent-dark" /></div>
                  <span className="text-sm font-bold text-ink text-center leading-tight">साखी</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => { setSelectedCategory("mantra"); navigateTo("category_list"); }} className="flex flex-col items-center justify-center p-6 bg-white/80 backdrop-blur-sm rounded-[2rem] border border-ink/5 hover:shadow-lg transition-all group">
                  <div className="bg-accent/10 p-4 rounded-2xl mb-3 group-hover:scale-110 transition-transform"><Music className="w-8 h-8 text-accent-dark" /></div>
                  <span className="text-lg font-bold text-ink text-center leading-tight">मंत्र</span>
                </button>
                <button onClick={() => navigateTo("mala")} className="flex flex-col items-center justify-center p-6 bg-white/80 backdrop-blur-sm rounded-[2rem] border border-ink/5 hover:shadow-lg transition-all group">
                  <div className="bg-accent/10 p-4 rounded-2xl mb-3 group-hover:scale-110 transition-transform"><Target className="w-8 h-8 text-accent-dark" /></div>
                  <span className="text-lg font-bold text-ink text-center leading-tight">जाप<br />माला</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => navigateTo("mele")} className="flex flex-col items-center justify-center p-6 bg-white/80 backdrop-blur-sm rounded-[2rem] border border-ink/5 hover:shadow-lg transition-all group">
                  <div className="bg-accent/10 p-4 rounded-2xl mb-3 group-hover:scale-110 transition-transform"><Users className="w-8 h-8 text-accent-dark" /></div>
                  <span className="text-lg font-bold text-ink text-center leading-tight">प्रमुख<br />मेले</span>
                </button>
                <button onClick={() => navigateTo("niyam")} className="flex flex-col items-center justify-center p-6 bg-white/80 backdrop-blur-sm rounded-[2rem] border border-ink/5 hover:shadow-lg transition-all group">
                  <div className="bg-accent/10 p-4 rounded-2xl mb-3 group-hover:scale-110 transition-transform"><ListOrdered className="w-8 h-8 text-accent-dark" /></div>
                  <span className="text-lg font-bold text-ink text-center leading-tight">२९<br />नियम</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => navigateTo("choghadiya")} className="flex flex-col items-center justify-center p-6 bg-white/80 backdrop-blur-sm rounded-[2rem] border border-ink/5 hover:shadow-lg transition-all group">
                  <div className="bg-accent/10 p-4 rounded-2xl mb-3 group-hover:scale-110 transition-transform"><Sun className="w-8 h-8 text-accent-dark" /></div>
                  <span className="text-lg font-bold text-ink text-center leading-tight">चौघड़िया<br />मुहूर्त</span>
                </button>
                <button onClick={() => navigateTo("bichhuda")} className="flex flex-col items-center justify-center p-6 bg-white/80 backdrop-blur-sm rounded-[2rem] border border-ink/5 hover:shadow-lg transition-all group">
                  <div className="bg-accent/10 p-4 rounded-2xl mb-3 group-hover:scale-110 transition-transform"><Book className="w-8 h-8 text-accent-dark" /></div>
                  <span className="text-lg font-bold text-ink text-center leading-tight">बिछुड़ा<br />(पंचक)</span>
                </button>
              </div>
            </div>
            
            <div className="px-4 mt-4">
              <button onClick={() => navigateTo("community_posts")} className="w-full flex flex-col items-center justify-center p-6 bg-white/80 backdrop-blur-sm rounded-[2rem] border border-ink/5 hover:shadow-lg transition-all group relative">
                {approvedPosts.length > 0 && <span className="absolute top-4 right-4 w-3 h-3 bg-red-500 rounded-full border-2 border-white shadow-sm"></span>}
                <div className="bg-accent/10 p-4 rounded-2xl mb-3 group-hover:scale-110 transition-transform"><HeartHandshake className="w-8 h-8 text-accent-dark" /></div>
                <span className="text-lg font-bold text-ink text-center leading-tight">भक्त<br />योगदान</span>
              </button>
            </div>
          </motion.div>
        );

      case "mala":
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="pb-32 min-h-[calc(100vh-60px)] flex flex-col">
            <div className="sticky top-[60px] z-10 bg-paper/90 backdrop-blur-sm border-b border-ink-light/30 p-4 flex items-center justify-center shadow-sm">
              <button onClick={() => navigateTo('home')} className="absolute left-4 p-2 -ml-2 rounded-full hover:bg-ink/10"><ChevronLeft className="w-6 h-6" /></button>
              <h1 className="font-heading text-2xl tracking-wide text-center w-full">|| डिजिटल जाप माला ||</h1>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center relative px-4 mt-8">
              <div className="text-8xl font-heading text-accent mb-2 drop-shadow-sm z-10 flex items-center justify-center w-40 h-40 bg-white/50 rounded-full shadow-inner border border-ink/10">{malaCount}</div>
              <div className="text-lg font-bold text-ink-light mb-12 bg-white/50 px-6 py-2 rounded-full border border-ink/10 z-10 mt-4">माला पूर्ण: <span className="text-accent-dark">{malaLaps}</span></div>
              <div className="relative flex items-center justify-center">
                <div className="absolute flex items-center justify-center pointer-events-none opacity-5">
                  <div className="w-64 h-64 rounded-full border-[20px] border-ink"></div>
                  <div className="absolute w-80 h-80 rounded-full border-[2px] border-ink border-dashed"></div>
                </div>
                <button onClick={() => { if (navigator.vibrate) navigator.vibrate(50); playOmVishnu(); if (malaCount + 1 >= 108) { if (navigator.vibrate) navigator.vibrate([200, 100, 200]); setMalaCount(0); setMalaLaps(l => l + 1); } else { setMalaCount(c => c + 1); } }} className="relative w-56 h-56 rounded-full bg-gradient-to-br from-accent to-accent-dark text-white shadow-2xl flex items-center justify-center active:scale-95 transition-all border-[12px] border-white/30 group z-10">
                  <div className="absolute inset-0 rounded-full bg-white/20 opacity-0 group-active:opacity-100 transition-opacity"></div>
                  <span className="text-3xl font-bold font-heading tracking-wider">जाप करें</span>
                </button>
              </div>
              <button onClick={() => { if(window.confirm('क्या आप माला रीसेट करना चाहते हैं?')) { setMalaCount(0); setMalaLaps(0); } }} className="mt-16 flex items-center gap-2 text-ink-light hover:text-ink transition-colors bg-white/50 px-4 py-2 rounded-xl z-10"><RotateCcw className="w-4 h-4" /> रीसेट करें</button>
            </div>
          </motion.div>
        );

      case "niyam":
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="pb-32">
            <div className="sticky top-[60px] z-10 bg-paper/90 backdrop-blur-sm border-b border-ink-light/30 p-4 flex items-center justify-center shadow-sm">
              <button onClick={() => navigateTo('home')} className="absolute left-4 p-2 -ml-2 rounded-full hover:bg-ink/10"><ChevronLeft className="w-6 h-6" /></button>
              <h1 className="font-heading text-2xl tracking-wide text-center w-full">|| २९ नियम ||</h1>
            </div>
            <div className="px-4 pt-6">
              <div className="bg-white/90 p-6 rounded-3xl shadow-sm border border-ink/10 mb-6 text-center">
                <p className="text-ink leading-relaxed font-medium">बिश्नोई समाज की स्थापना गुरु जाम्भेश्वर भगवान ने इन्हीं 29 नियमों के आधार पर की थी। "बीस और नौ बिश्नोई" - जो इन 29 नियमों का पालन करता है, वही बिश्नोई है。</p>
              </div>
              <div className="space-y-3">
                {niyams.length > 0 ? niyams.map((niyam, idx) => (
                  <div key={idx} className="flex items-start gap-4 bg-white p-4 rounded-2xl shadow-sm border border-ink/5 hover:border-accent/30 transition-colors">
                    <div className="w-8 h-8 shrink-0 rounded-full bg-accent/10 text-accent font-bold flex items-center justify-center text-sm">{idx + 1}</div>
                    <p className="text-ink font-medium pt-1 leading-relaxed">{niyam}</p>
                  </div>
                )) : <div className="text-center text-ink-light py-10"><Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" /> डेटा लोड हो रहा है...</div>}
              </div>
            </div>
          </motion.div>
        );

      case "shabad_list":
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="pb-32">
            <div className="sticky top-[60px] z-10 bg-paper/90 backdrop-blur-sm border-b border-ink-light/30 p-4 flex items-center justify-center shadow-sm">
              <button onClick={handleBack} className="absolute left-4 p-2 -ml-2 rounded-full hover:bg-ink/10"><ChevronLeft className="w-6 h-6" /></button>
              <h1 className="font-heading text-2xl tracking-wide text-center w-full">|| संपूर्ण शब्दवाणी ||</h1>
            </div>
            <div className="flex flex-col p-2 mt-2">
              {shabads.length > 0 ? shabads.map((item) => (
                <button key={item.id} onClick={() => handleShabadClick(item)} className="flex items-center p-4 mx-2 my-1.5 bg-white/60 rounded-2xl border border-ink/5 hover:bg-white/90 transition-all shadow-sm text-left group">
                  <BookOpenText className="w-6 h-6 mr-4 text-ink-light shrink-0" />
                  <span className="text-xl font-semibold leading-tight flex-1 text-ink">{item.title}</span>
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
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="pb-32">
            <div className="sticky top-[60px] z-10 bg-paper/90 backdrop-blur-sm border-b border-ink-light/30 p-4 flex items-center justify-center shadow-sm">
              <button onClick={handleBack} className="absolute left-4 p-2 -ml-2 rounded-full hover:bg-ink/10"><ChevronLeft className="w-6 h-6" /></button>
              <h1 className="font-heading text-2xl tracking-wide text-center w-full">|| {categoryData.title} ||</h1>
            </div>
            <div className="flex flex-col p-2 mt-2">
              {categoryData.list.length > 0 ? categoryData.list.map((item) => (
                <button key={item.id} onClick={() => { setSelectedShabad(item); navigateTo("audio_reading"); }} className="flex items-center p-4 mx-2 my-1.5 bg-white/60 rounded-2xl border border-ink/5 hover:bg-white/90 transition-all shadow-sm text-left group">
                  <div className="bg-accent/10 p-2.5 rounded-full mr-4"><Play className="w-5 h-5 text-accent-dark ml-0.5" /></div>
                  <span className="text-xl font-semibold leading-tight flex-1 text-ink">{item.title}</span>
                  <ChevronRight className="w-5 h-5 text-ink-light/40" />
                </button>
              )) : <div className="text-center text-ink-light py-10"><Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" /> डेटा लोड हो रहा है...</div>}
            </div>
          </motion.div>
        );

      case "community_posts":
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="pb-32">
            <div className="sticky top-[60px] z-10 bg-paper/90 backdrop-blur-sm border-b border-ink-light/30 p-4 flex items-center justify-center shadow-sm">
              <button onClick={handleBack} className="absolute left-4 p-2 -ml-2 rounded-full hover:bg-ink/10"><ChevronLeft className="w-6 h-6" /></button>
              <h1 className="font-heading text-2xl tracking-wide text-center w-full">|| भक्त योगदान ||</h1>
            </div>
            <div className="flex flex-col p-4 gap-4">
              {approvedPosts.length === 0 ? (
                <div className="text-center text-ink-light mt-10">
                  <Users className="w-16 h-16 mx-auto opacity-20 mb-4" />
                  <p className="text-xl">अभी तक कोई योगदान नहीं है।</p>
                  <button onClick={() => navigateTo("contribute")} className="mt-4 text-accent font-bold underline">पहला योगदान दें</button>
                </div>
              ) : (
                approvedPosts.map((item) => (
                  <div key={item.id} className="bg-white/80 rounded-3xl p-5 shadow-sm border border-ink/10">
                    <h3 className="text-xl font-bold text-ink mb-2">{item.title}</h3>
                    <p className="text-sm text-ink-light mb-4 flex items-center gap-2"><Users className="w-4 h-4" /> {item.author}</p>
                    <p className="text-ink whitespace-pre-wrap line-clamp-3 mb-4">{item.text}</p>
                    <button onClick={() => { setSelectedShabad(item); navigateTo("reading"); }} className="text-accent-dark font-bold flex items-center gap-1">पूरा पढ़ें <ChevronRight className="w-4 h-4" /></button>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        );

      case "reading":
      case "audio_reading":
        return (
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="min-h-screen flex flex-col pb-32">
            <div className="sticky top-[60px] z-10 bg-paper/95 backdrop-blur-md p-3 flex items-center justify-between shadow-sm border-b border-ink/10">
              <button onClick={handleBack} className="p-2 -ml-1 rounded-full hover:bg-ink/10 shrink-0"><ChevronLeft className="w-6 h-6" /></button>
              <div className="flex items-center gap-1 font-bold shrink-0 bg-ink/5 rounded-full px-2 py-1">
                <button onClick={() => setFontSize((f) => Math.max(f - 2, 12))} className="p-1.5 hover:bg-ink/10 rounded-full text-sm">A-</button>
                <div className="w-px h-4 bg-ink/20 mx-1"></div>
                <button onClick={() => setFontSize((f) => Math.min(f + 2, 32))} className="p-1.5 hover:bg-ink/10 rounded-full text-sm">A+</button>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => setIsBookmarked(!isBookmarked)} className="p-2 rounded-full hover:bg-ink/10 transition-colors">
                  <Bookmark className={`w-5 h-5 ${isBookmarked ? "fill-accent text-accent" : "text-ink-light"}`} />
                </button>
                <button onClick={handleShare} className="p-2 rounded-full hover:bg-ink/10 transition-colors"><Share2 className="w-5 h-5 text-ink-light" /></button>
              </div>
            </div>
            <AnimatePresence mode="wait">
              <motion.div key={selectedShabad?.id} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} transition={{ type: "spring", stiffness: 300, damping: 30 }} {...bindSwipe()} className="px-5 py-6 flex-1 flex flex-col items-center w-full touch-pan-y">
                {currentScreen === "audio_reading" && selectedShabad?.audioUrl && <AudioPlayer url={selectedShabad.audioUrl} onEnded={handleAudioEnded} />}
                <div className="w-full max-w-md bg-gradient-to-r from-accent to-accent-dark text-white text-center py-3 px-4 rounded-2xl shadow-md mb-6 border border-ink/20 relative overflow-hidden">
                  <h2 className="text-2xl font-semibold relative z-10">{selectedShabad?.title}</h2>
                  {selectedShabad?.author && <p className="text-xs opacity-80 mt-1 relative z-10">द्वारा: {selectedShabad.author}</p>}
                </div>
                <div className="text-center leading-relaxed max-w-2xl whitespace-pre-wrap mt-2 bg-white/60 p-6 sm:p-8 rounded-3xl shadow-sm border border-ink/10 text-ink select-none" style={{ fontSize: `${fontSize}px` }}>
                  {selectedShabad?.text || sampleText}
                </div>
                <div className="flex justify-between w-full max-w-md mt-8 text-ink-light/50 px-4">
                  <div className="flex items-center gap-1 text-xs"><ChevronLeft className="w-4 h-4" /> पिछला</div>
                  <div className="flex items-center gap-1 text-xs">अगला <ChevronRight className="w-4 h-4" /></div>
                </div>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        );

      case "amavasya":
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="pb-32 px-4">
            <div className="sticky top-[60px] z-10 bg-paper/90 backdrop-blur-sm py-4 flex items-center justify-center shadow-sm border-b border-ink/10 mb-6">
              <button onClick={handleBack} className="absolute left-0 p-2 rounded-full hover:bg-ink/10"><ChevronLeft className="w-6 h-6" /></button>
              <h1 className="font-heading text-2xl tracking-wide text-center w-full">|| अमावस्या दर्शन ||</h1>
            </div>
            <div className="flex items-center justify-between bg-white/90 shadow-md border border-ink/10 rounded-full py-3 px-6 mb-8 max-w-sm mx-auto">
              <button onClick={() => setSelectedYear((y) => y - 1)} className="p-2 hover:bg-ink/10 rounded-full transition-colors"><ChevronLeft className="w-6 h-6" /></button>
              <span className="text-3xl font-bold text-accent-dark">{selectedYear}</span>
              <button onClick={() => setSelectedYear((y) => y + 1)} className="p-2 hover:bg-ink/10 rounded-full transition-colors"><ChevronRight className="w-6 h-6" /></button>
            </div>
            <div className="space-y-6 max-w-2xl mx-auto">
              {amavasyaList.map((item, idx) => (
                <div key={idx} className="border border-accent/20 rounded-[2rem] bg-white/80 shadow-lg relative overflow-hidden group hover:shadow-xl transition-all backdrop-blur-sm">
                  <div className="p-6 flex items-center justify-between border-b border-ink/5 relative z-10">
                    <div>
                      <h3 className="text-4xl font-heading text-accent-dark mb-1 drop-shadow-sm">{item.hindiMonth}</h3>
                      <p className="text-sm font-bold text-ink/60 tracking-wide">{item.gregorianMonth} • {item.sub}</p>
                    </div>
                  </div>
                  <div className="p-6 bg-gradient-to-b from-transparent to-paper-light/50 relative z-10">
                    <div className="flex flex-col gap-4">
                      <div className="flex items-start gap-4">
                        <div className="mt-1 bg-green-100 p-2 rounded-full shadow-inner"><div className="w-3 h-3 rounded-full bg-green-500"></div></div>
                        <div><p className="text-xs font-bold text-ink/50 uppercase mb-0.5">प्रारम्भ</p><p className="text-ink font-medium">{item.start}</p></div>
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="mt-1 bg-red-100 p-2 rounded-full shadow-inner"><div className="w-3 h-3 rounded-full bg-red-500"></div></div>
                        <div><p className="text-xs font-bold text-ink/50 uppercase mb-0.5">समाप्त</p><p className="text-ink font-medium">{item.end}</p></div>
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
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pb-32 px-6 pt-6 text-center">
            <HeartHandshake className="w-20 h-20 mx-auto text-accent mb-4" />
            <h2 className="font-heading text-3xl mb-4">विशेष सहयोग</h2>
            <div className="bg-white/90 p-6 rounded-3xl shadow-xl border border-ink/10 flex flex-col items-center">
              <h3 className="text-xl font-bold mb-6 text-ink">UPI द्वारा सहयोग करें</h3>
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-ink/10 mb-6 relative group">
                <img src={settings.qrCodeUrl} alt="UPI QR Code" className="w-40 h-40 object-contain" />
              </div>
              <p className="text-xl font-mono bg-paper p-4 rounded-xl border border-ink/20 mb-4 w-full text-center font-bold tracking-wide">{settings.upiId}</p>
              <button onClick={() => { navigator.clipboard.writeText(settings.upiId); alert("UPI ID कॉपी हो गई है!"); }} className="bg-gradient-to-r from-accent to-accent-dark text-white px-8 py-3.5 rounded-full font-bold shadow-lg w-full">Copy UPI ID</button>
            </div>
          </motion.div>
        );

      case "about":
      case "privacy":
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pb-32 px-6 pt-6 text-center">
            <ShieldCheck className="w-20 h-20 mx-auto text-accent mb-4" />
            <h2 className="font-heading text-3xl mb-4">जानकारी</h2>
            <div className="bg-white/80 p-6 rounded-3xl shadow-md border border-ink/10 text-left space-y-4 text-lg">
              <p>यह ऐप पूरी तरह से शैक्षिक और भक्ति (Devotional) उद्देश्यों के लिए बनाया गया है।</p>
            </div>
          </motion.div>
        );

      case "contribute":
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pb-32 px-6 pt-6">
            <div className="text-center mb-6"><UploadCloud className="w-16 h-16 mx-auto text-accent mb-2" /><h2 className="font-heading text-3xl">सामग्री जोड़ें</h2></div>
            <form className="space-y-4 bg-white/80 p-6 rounded-3xl shadow-md border border-ink/10" onSubmit={handleContributeSubmit}>
              <input value={contribAuthor} onChange={(e) => setContribAuthor(e.target.value)} required type="text" className="w-full p-3 rounded-xl border border-ink/20" placeholder="आपका नाम..." />
              <input value={contribTitle} onChange={(e) => setContribTitle(e.target.value)} required type="text" className="w-full p-3 rounded-xl border border-ink/20" placeholder="शीर्षक..." />
              <select value={contribType} onChange={(e) => setContribType(e.target.value)} className="w-full p-3 rounded-xl border border-ink/20">
                <option>शब्द</option><option>भजन</option><option>आरती</option><option>मंत्र</option>
              </select>
              <textarea value={contribText} onChange={(e) => setContribText(e.target.value)} required className="w-full p-3 rounded-xl border border-ink/20 h-32" placeholder="यहाँ बोल लिखें..."></textarea>
              <button type="submit" className="w-full bg-gradient-to-r from-accent to-accent-dark text-white font-bold py-3.5 rounded-xl shadow-md">सबमिट करें</button>
            </form>
          </motion.div>
        );

      case "search":
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pb-32 px-4 pt-4">
            <div className="flex items-center gap-3 mb-6">
              <button onClick={handleBack} className="p-2 rounded-full hover:bg-ink/10"><ChevronLeft className="w-6 h-6" /></button>
              <div className="flex-1 bg-white border border-ink/20 rounded-2xl p-3 flex items-center gap-3 shadow-inner"><Search className="w-5 h-5 text-ink-light" /><input autoFocus type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="खोजें..." className="bg-transparent border-none outline-none w-full text-lg" /></div>
            </div>
          </motion.div>
        );

      case "choghadiya":
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pb-32 px-4 pt-4">
             <div className="flex items-center gap-3 mb-6 bg-gradient-to-r from-accent to-accent-dark text-white p-4 rounded-3xl shadow-lg">
              <button onClick={() => navigateTo("home")} className="p-2 rounded-full hover:bg-white/20"><ChevronLeft className="w-6 h-6" /></button>
              <h1 className="text-2xl font-bold flex-1 text-center">|| चौघड़िया मुहूर्त ||</h1>
            </div>
          </motion.div>
        );

      case "bichhuda":
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pb-32 px-4 pt-4">
             <div className="flex items-center gap-3 mb-6 bg-gradient-to-r from-accent to-accent-dark text-white p-4 rounded-3xl shadow-lg">
              <button onClick={() => navigateTo("home")} className="p-2 rounded-full hover:bg-white/20"><ChevronLeft className="w-6 h-6" /></button>
              <h1 className="text-2xl font-bold flex-1 text-center">|| बिछुड़ा (पंचक) ||</h1>
            </div>
          </motion.div>
        );

      case "mele":
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pb-32 px-4 pt-4">
             <div className="flex items-center gap-3 mb-6 bg-gradient-to-r from-accent to-accent-dark text-white p-4 rounded-3xl shadow-lg">
              <button onClick={() => navigateTo("home")} className="p-2 rounded-full hover:bg-white/20"><ChevronLeft className="w-6 h-6" /></button>
              <h1 className="text-2xl font-bold flex-1 text-center">|| आगामी प्रमुख मेले ||</h1>
            </div>
            <div className="space-y-4">
              {meles.map((mela, idx) => (
                <div key={idx} className="bg-white/90 p-5 rounded-3xl shadow-sm border border-ink/5">
                  <h3 className="font-bold text-xl text-accent-dark mb-1">{mela.name}</h3>
                  <p className="text-sm font-semibold text-ink mb-1">{mela.dateStr}</p>
                  <p className="text-sm text-ink-light mb-3">{mela.location}</p>
                  <p className="text-sm bg-paper p-3 rounded-xl">{mela.desc}</p>
                </div>
              ))}
            </div>
          </motion.div>
        );

      case "admin_login":
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-screen flex flex-col items-center justify-center px-6 pb-32">
            <div className="bg-white/90 backdrop-blur-md p-8 rounded-3xl shadow-2xl border border-ink/10 w-full max-w-sm text-center">
              <KeyRound className="w-16 h-16 mx-auto text-accent mb-4" />
              <h2 className="text-2xl font-heading mb-2 text-ink">|| Admin Access ||</h2>
              <form onSubmit={(e) => { e.preventDefault(); if (adminPasswordInput === "2929") { setIsAdminAuthenticated(true); setAdminPasswordInput(""); navigateTo("admin"); } else { alert("गलत पासवर्ड!"); setAdminPasswordInput(""); } }}>
                <input type="password" value={adminPasswordInput} onChange={(e) => setAdminPasswordInput(e.target.value)} placeholder="पासवर्ड" className="w-full p-4 rounded-xl border border-ink/20 text-center mb-6" autoFocus />
                <button type="submit" className="w-full bg-gradient-to-r from-accent to-accent-dark text-white font-bold py-3.5 rounded-xl shadow-lg">लॉगिन करें</button>
              </form>
            </div>
          </motion.div>
        );

      case "admin":
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pb-32 px-4 pt-4">
            <div className="flex items-center gap-3 mb-6 bg-ink text-white p-4 rounded-3xl shadow-lg">
              <button onClick={() => navigateTo("home")} className="p-2 rounded-full hover:bg-white/20"><ChevronLeft className="w-6 h-6" /></button>
              <h1 className="text-2xl font-bold flex-1 text-center">|| Admin Dashboard ||</h1>
            </div>

            <div className="space-y-8">
              
              {/* MAGIC BUTTON TO UPLOAD OFFLINE DATA TO FIREBASE */}
              <div className="bg-orange-100 p-6 rounded-3xl shadow-sm border border-orange-300">
                <h2 className="text-xl font-bold mb-2 text-orange-800 flex items-center gap-2">
                  <CloudUpload className="w-6 h-6" /> डेटाबेस सेटअप
                </h2>
                <p className="text-sm text-orange-700 mb-4">इस बटन को सिर्फ <b>एक बार</b> दबाएं। यह ऐप में लिखे पुराने डेटा (आरती, भजन, नियम) को Firebase पर सेव कर देगा।</p>
                <button 
                  onClick={handleBulkUpload} 
                  disabled={isUploadingAll}
                  className="w-full bg-orange-500 text-white font-bold py-3 rounded-xl flex justify-center items-center gap-2"
                >
                  {isUploadingAll ? <Loader2 className="w-5 h-5 animate-spin" /> : <CloudUpload className="w-5 h-5" />}
                  {isUploadingAll ? "अपलोड हो रहा है... कृपया रुकें" : "सभी डेटा Firebase पर अपलोड करें"}
                </button>
              </div>

              <div className="bg-white/90 p-6 rounded-3xl shadow-sm border border-ink/10">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2 border-b border-ink/10 pb-2">
                  <PlusCircle className="w-5 h-5" /> नई सामग्री जोड़ें
                </h2>
                <form onSubmit={handleAdminSubmit} className="space-y-4">
                  <select value={contribType} onChange={(e) => setContribType(e.target.value)} className="w-full p-3 rounded-xl border border-ink/20 bg-white">
                    <option>शब्द</option><option>भजन</option><option>आरती</option><option>साखी</option>
                    <option>मंत्र</option><option>सुविचार</option><option>नियम</option><option>मेले</option>
                  </select>
                  
                  {contribType !== "सुविचार" && contribType !== "नियम" && contribType !== "मेले" && (
                    <>
                      <input value={contribTitle} onChange={(e) => setContribTitle(e.target.value)} required type="text" className="w-full p-3 rounded-xl border border-ink/20 bg-white" placeholder="शीर्षक लिखें..." />
                      <input value={contribAudio} onChange={(e) => setContribAudio(e.target.value)} type="url" className="w-full p-3 rounded-xl border border-ink/20 bg-white" placeholder="Audio URL..." />
                    </>
                  )}

                  {contribType === "मेले" && (
                    <>
                      <input value={contribTitle} onChange={(e) => setContribTitle(e.target.value)} required type="text" className="w-full p-3 rounded-xl border border-ink/20 bg-white" placeholder="मेले का नाम..." />
                      <input value={contribDate} onChange={(e) => setContribDate(e.target.value)} required type="date" className="w-full p-3 rounded-xl border border-ink/20 bg-white" />
                      <input value={contribLocation} onChange={(e) => setContribLocation(e.target.value)} required type="text" className="w-full p-3 rounded-xl border border-ink/20 bg-white" placeholder="स्थान..." />
                    </>
                  )}

                  <textarea value={contribText} onChange={(e) => setContribText(e.target.value)} required className="w-full p-3 rounded-xl border border-ink/20 bg-white h-32" placeholder="यहाँ लिखें..."></textarea>
                  
                  <button type="submit" disabled={isSaving} className="w-full bg-gradient-to-r from-accent to-accent-dark text-white font-bold py-3.5 rounded-xl flex justify-center items-center gap-2">
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
                            <button onClick={() => openEditModal("शब्द", s)} className="p-1.5 text-blue-500 hover:bg-blue-50"><Edit3 className="w-4 h-4" /></button>
                            <button onClick={() => handleDelete("शब्द", s.id)} className="p-1.5 text-red-500 hover:bg-red-50"><XCircle className="w-4 h-4" /></button>
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
                            <button onClick={() => openEditModal("आरती", m)} className="p-1.5 text-blue-500"><Edit3 className="w-4 h-4" /></button>
                            <button onClick={() => handleDelete("आरती", m.id)} className="p-1.5 text-red-500"><XCircle className="w-4 h-4" /></button>
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
                            <button onClick={() => handleDelete("नियम", "", i)} className="p-1.5 text-red-500"><XCircle className="w-4 h-4" /></button>
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
                            <button onClick={() => handleDelete("सुविचार", "", i)} className="p-1.5 text-red-500"><XCircle className="w-4 h-4" /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
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
          <div className="bg-white/95 backdrop-blur-xl border-t border-ink/10 flex justify-around items-center py-2 px-1 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] pb-safe">
            <NavItem icon={<Home className="w-6 h-6" />} label="होम" isActive={currentScreen === "home"} onClick={() => navigateTo("home")} />
            <NavItem icon={<HeartHandshake className="w-6 h-6" />} label="सहयोग" isActive={currentScreen === "donate"} onClick={() => navigateTo("donate")} />
            <NavItem icon={<CalendarDays className="w-6 h-6" />} label="अमावस" isActive={currentScreen === "amavasya"} onClick={() => navigateTo("amavasya")} />
            <NavItem icon={<Settings className="w-6 h-6" />} label="एडमिन" isActive={currentScreen === "admin_login"} onClick={() => navigateTo("admin_login")} />
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