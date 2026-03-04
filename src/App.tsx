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
];

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

const initialShabadList: ShabadItem[] = [
  { id: "vedic", title: "वैदिक-मन्त्राः", icon: BookOpenText },
  { id: "gayatri", title: "गायत्री-मन्त्रः", icon: BookOpenText },
];

const initialAartiList: ShabadItem[] = [
  { id: "aarti1", title: "जाम्भोजी की आरती", icon: Music, text: "आरती श्री जाम्भेश्वर जी की..." },
];

const initialBhajanList: ShabadItem[] = [
  { id: "bhajan1", title: "भजन: गुरु महिमा", icon: Music, text: "गुरु ब्रह्मा गुरु विष्णु..." },
];

const initialSakhiList: ShabadItem[] = [
  { id: "sakhi1", title: "साखी: प्रथम", icon: BookOpenText, text: "साखी के बोल यहाँ प्रदर्शित होंगे..." },
];

const initialMantraList: ShabadItem[] = [
  { id: "gayatri_mantra", title: "गायत्री मन्त्र", icon: Music, text: "ॐ भूर्भुवः स्वः..." },
];

const sampleText = `ओ३म् गुरु चीन्हों गुरु चिन्ह पुरोहीत, गुरु मुख धर्म बखाणी...`;

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
  const [isSaving, setIsSaving] = useState(false); // Naya Loading state

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [amavasyaList, setAmavasyaList] = useState(() => generateAmavasyaForYear(selectedYear));

  // --- Content State (Merging Initial + Firebase Data) ---
  const [shabads, setShabads] = useState<ShabadItem[]>(initialShabadList);
  const [aartis, setAartis] = useState<ShabadItem[]>(initialAartiList);
  const [bhajans, setBhajans] = useState<ShabadItem[]>(initialBhajanList);
  const [sakhis, setSakhis] = useState<ShabadItem[]>(initialSakhiList);
  const [mantras, setMantras] = useState<ShabadItem[]>(initialMantraList);
  const [thoughts, setThoughts] = useState<string[]>(initialDailyThoughts);
  const [meles, setMeles] = useState(initialMeles);

  const [selectedCategory, setSelectedCategory] = useState<"aarti" | "bhajan" | "sakhi" | "mantra">("aarti");
  const [pendingPosts, setPendingPosts] = useState<ShabadItem[]>([]);
  const [approvedPosts, setApprovedPosts] = useState<ShabadItem[]>([]);

  useEffect(() => {
    // Purana data aur naya firebase data dono milakar dikhayenge
    const unsubShabads = onSnapshot(collection(db, "shabads"), (snapshot) => {
      const fetched = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as ShabadItem));
      setShabads([...initialShabadList, ...fetched]);
    });
    const unsubAartis = onSnapshot(collection(db, "aartis"), (snapshot) => {
      const fetched = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as ShabadItem));
      setAartis([...initialAartiList, ...fetched]);
    });
    const unsubBhajans = onSnapshot(collection(db, "bhajans"), (snapshot) => {
      const fetched = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as ShabadItem));
      setBhajans([...initialBhajanList, ...fetched]);
    });
    const unsubSakhis = onSnapshot(collection(db, "sakhis"), (snapshot) => {
      const fetched = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as ShabadItem));
      setSakhis([...initialSakhiList, ...fetched]);
    });
    const unsubMantras = onSnapshot(collection(db, "mantras"), (snapshot) => {
      const fetched = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as ShabadItem));
      setMantras([...initialMantraList, ...fetched]);
    });
    const unsubThoughts = onSnapshot(collection(db, "thoughts"), (snapshot) => {
      const fetched = snapshot.docs.map((doc) => doc.data().text as string);
      setThoughts([...initialDailyThoughts, ...fetched]);
    });
    const unsubMeles = onSnapshot(collection(db, "meles"), (snapshot) => {
      const fetched = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as any));
      setMeles([...initialMeles, ...fetched]);
    });
    const unsubPending = onSnapshot(collection(db, "pendingPosts"), (snapshot) => {
      setPendingPosts(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as ShabadItem)));
    });
    const unsubApproved = onSnapshot(collection(db, "approvedPosts"), (snapshot) => {
      setApprovedPosts(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as ShabadItem)));
    });

    return () => {
      unsubShabads(); unsubAartis(); unsubBhajans(); unsubSakhis();
      unsubMantras(); unsubThoughts(); unsubMeles(); unsubPending(); unsubApproved();
    };
  }, []);

  const [dailyThought, setDailyThought] = useState(thoughts[0]);
  useEffect(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const dayOfYear = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if(thoughts && thoughts.length > 0){
        setDailyThought(thoughts[dayOfYear % thoughts.length]);
    }
  }, [thoughts]);

  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([
    { id: "n1", title: "नया अपडेट", message: "अमावस्या दर्शन में नए फीचर्स जोड़े गए हैं।", date: "आज", read: false },
  ]);
  const unreadCount = notifications.filter((n) => !n.read).length;

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
      const docRef = doc(db, editItemData.type === "शब्द" ? "shabads" : editItemData.type === "मंत्र" ? "mantras" : editItemData.type === "आरती" ? "aartis" : editItemData.type === "भजन" ? "bhajans" : editItemData.type === "साखी" ? "sakhis" : editItemData.type === "सुविचार" ? "thoughts" : "meles", editItemData.id);
      
      if (editItemData.type === "मेले") {
        await updateDoc(docRef, { name: editItemData.name, dateStr: editItemData.dateStr, location: editItemData.location, desc: editItemData.desc });
      } else if (editItemData.type === "सुविचार") {
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

  const handleDelete = async (type: string, id: string, index?: number) => {
    if (!window.confirm("क्या आप वाकई इसे हटाना चाहते हैं?")) return;
    try {
      const coll = type === "शब्द" ? "shabads" : type === "मंत्र" ? "mantras" : type === "आरती" ? "aartis" : type === "भजन" ? "bhajans" : type === "साखी" ? "sakhis" : type === "सुविचार" ? "thoughts" : "meles";
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
        const coll = contribType === "शब्द" ? "shabads" : contribType === "भजन" ? "bhajans" : contribType === "आरती" ? "aartis" : contribType === "मंत्र" ? "mantras" : contribType === "साखी" ? "sakhis" : "thoughts";
        await addDoc(collection(db, coll), contribType === "सुविचार" ? { text: contribText } : newContent);
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
              {shabads.map((item) => (
                <button key={item.id} onClick={() => handleShabadClick(item)} className="flex items-center p-4 mx-2 my-1.5 bg-white/60 rounded-2xl border border-ink/5 hover:bg-white/90 transition-all shadow-sm text-left group">
                  <BookOpenText className="w-6 h-6 mr-4 text-ink-light shrink-0" />
                  <span className="text-xl font-semibold leading-tight flex-1 text-ink">{item.title}</span>
                  <ChevronRight className="w-5 h-5 text-ink-light/40 group-hover:text-ink-light transition-colors" />
                </button>
              ))}
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
              {categoryData.list.map((item) => (
                <button key={item.id} onClick={() => { setSelectedShabad(item); navigateTo("audio_reading"); }} className="flex items-center p-4 mx-2 my-1.5 bg-white/60 rounded-2xl border border-ink/5 hover:bg-white/90 transition-all shadow-sm text-left group">
                  <div className="bg-accent/10 p-2.5 rounded-full mr-4"><Play className="w-5 h-5 text-accent-dark ml-0.5" /></div>
                  <span className="text-xl font-semibold leading-tight flex-1 text-ink">{item.title}</span>
                  <ChevronRight className="w-5 h-5 text-ink-light/40" />
                </button>
              ))}
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
            </div>
            <div className="px-5 py-6 flex-1 flex flex-col items-center w-full">
              {currentScreen === "audio_reading" && selectedShabad?.audioUrl && <AudioPlayer url={selectedShabad.audioUrl} />}
              <div className="w-full max-w-md bg-gradient-to-r from-accent to-accent-dark text-white text-center py-3 px-4 rounded-2xl shadow-md mb-6 border border-ink/20 relative overflow-hidden">
                <h2 className="text-2xl font-semibold relative z-10">{selectedShabad?.title}</h2>
              </div>
              <div className="text-center leading-relaxed max-w-2xl whitespace-pre-wrap mt-2 bg-white/60 p-6 sm:p-8 rounded-3xl shadow-sm border border-ink/10 text-ink" style={{ fontSize: `${fontSize}px` }}>
                {selectedShabad?.text || "डेटा उपलब्ध नहीं है"}
              </div>
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
              <div className="bg-white/90 p-6 rounded-3xl shadow-sm border border-ink/10">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2 border-b border-ink/10 pb-2">
                  <PlusCircle className="w-5 h-5" /> नई सामग्री जोड़ें
                </h2>
                <form onSubmit={handleAdminSubmit} className="space-y-4">
                  <select value={contribType} onChange={(e) => setContribType(e.target.value)} className="w-full p-3 rounded-xl border border-ink/20 bg-white">
                    <option>शब्द</option><option>भजन</option><option>आरती</option>
                    <option>साखी</option><option>मंत्र</option><option>सुविचार</option><option>मेले</option>
                  </select>
                  {contribType !== "सुविचार" && contribType !== "मेले" && (
                    <input value={contribTitle} onChange={(e) => setContribTitle(e.target.value)} required type="text" className="w-full p-3 rounded-xl border border-ink/20 bg-white" placeholder="शीर्षक लिखें..." />
                  )}
                  <textarea value={contribText} onChange={(e) => setContribText(e.target.value)} required className="w-full p-3 rounded-xl border border-ink/20 bg-white h-32" placeholder="यहाँ लिखें..."></textarea>
                  <button type="submit" disabled={isSaving} className="w-full bg-gradient-to-r from-accent to-accent-dark text-white font-bold py-3.5 rounded-xl flex justify-center items-center gap-2 shadow-md hover:shadow-lg transition-all">
                    {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                    {isSaving ? "सेव हो रहा है..." : "जोड़ें (Save)"}
                  </button>
                </form>
              </div>
            </div>
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