import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, ChevronRight, Bookmark, Share2, Pause, ChevronsDown, Hand } from "lucide-react";
import AudioPlayer from "../AudioPlayer";
import { SabadItem } from "../../types";

export interface ReadingScreenProps {
  currentScreen: string;
  selectedSabad: SabadItem | null;
  selectedCategory: string;
  sabads: SabadItem[];
  aartis: SabadItem[];
  bhajans: SabadItem[];
  sakhis: SabadItem[];
  mantras: SabadItem[];
  readingTheme: 'dark' | 'sepia' | 'light';
  setReadingTheme: (theme: 'dark' | 'sepia' | 'light') => void;
  hasSeenSwipeHint: boolean;
  handleBack: () => void;
  fontSize: number;
  setFontSize: (size: number | ((prev: number) => number)) => void;
  isAutoScrolling: boolean;
  toggleAutoScroll: () => void;
  autoScrollSpeed: number;
  cycleAutoScrollSpeed: () => void;
  toggleBookmark: (id: string) => void;
  bookmarks: string[];
  handleShare: () => void;
  autoPlayAudio: boolean;
  setAutoPlayAudio: (play: boolean) => void;
  playingSabad: SabadItem | null;
  setPlayingSabad: (sabad: SabadItem | null) => void;
  setIsAudioActive: (active: boolean) => void;
  handleAudioEnded: () => void;
  handleSwipe: (dir: "left" | "right") => void;
  handleAudioSwipe: (dir: "left" | "right") => void;
  showToast: (msg: string) => void;
  settings: any;
  vibrate: (ms: number) => void;
  slideDir: number;
  bindGestures: () => any;
}

export default function ReadingScreen(props: ReadingScreenProps) {
  const {
    currentScreen, selectedSabad, selectedCategory,
    sabads, aartis, bhajans, sakhis, mantras,
    readingTheme, setReadingTheme, hasSeenSwipeHint, handleBack,
    fontSize, setFontSize, isAutoScrolling, toggleAutoScroll,
    autoScrollSpeed, cycleAutoScrollSpeed, toggleBookmark, bookmarks,
    handleShare, autoPlayAudio, setAutoPlayAudio, playingSabad,
    setPlayingSabad, setIsAudioActive, handleAudioEnded,
    handleSwipe, handleAudioSwipe, showToast, settings, vibrate,
    slideDir, bindGestures
  } = props;

  let readingList: SabadItem[] = [];
  if (currentScreen === "reading") readingList = sabads;
  else if (currentScreen === "audio_reading") {
    if (selectedCategory === "aarti") readingList = aartis;
    else if (selectedCategory === "bhajan") readingList = bhajans;
    else if (selectedCategory === "sakhi") readingList = sakhis;
    else if (selectedCategory === "mantra") readingList = mantras;
  }

  // Fallback to ensure navigation works even if category is not set
  if (readingList.length === 0 && selectedSabad) {
    if (selectedSabad.type === "शब्द") readingList = sabads;
    else if (selectedSabad.type === "आरती") readingList = aartis;
    else if (selectedSabad.type === "भजन") readingList = bhajans;
    else if (selectedSabad.type === "साखी") readingList = sakhis;
    else if (selectedSabad.type === "मंत्र") readingList = mantras;
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

      <div className={`sticky top-[50px] z-10 px-1.5 sm:px-2 py-2 sm:py-2.5 flex items-center justify-between gap-1 sm:gap-1.5 shadow-sm border-b transition-colors duration-300 overflow-x-auto ${
        readingTheme === 'dark' ? 'bg-[#1a1a1a]/95 border-white/10 text-white' : 
        readingTheme === 'sepia' ? 'bg-[#f4ecd8]/95 border-[#5c4b37]/10 text-[#5c4b37]' : 
        'bg-paper/95 border-ink/10 text-ink'
      } backdrop-blur-md [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]`}>
        <button
          onClick={handleBack}
          className={`p-1.5 sm:p-2 -ml-0.5 sm:-ml-1 rounded-full shrink-0 transition-all touch-manipulation active:scale-90 ${
            readingTheme === 'dark' ? 'bg-white/5 hover:bg-white/10 active:bg-white/20' : 
            readingTheme === 'sepia' ? 'bg-[#5c4b37]/5 hover:bg-[#5c4b37]/10 active:bg-[#5c4b37]/20' : 
            'bg-ink/5 hover:bg-ink/10 active:bg-ink/20'
          }`}
        >
          <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.5} />
        </button>

        {/* Position Indicator */}
        {readingIndex !== -1 && totalCount > 0 && (
          <div className={`flex flex-col items-center justify-center text-[10px] sm:text-[11px] md:text-xs font-extrabold px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl tracking-wide shrink-0 leading-tight ${
            readingTheme === 'dark' ? 'bg-white/10 text-white/80' : 
            readingTheme === 'sepia' ? 'bg-[#5c4b37]/10 text-[#5c4b37]/80' : 
            'bg-ink/5 text-ink-light'
          }`}>
            <span>{readingIndex + 1} / {totalCount}</span>
            <span className="text-[9px] sm:text-[10px] md:text-[11px] opacity-90 mt-0.5">{categoryLabel}</span>
          </div>
        )}

        {/* Theme Switcher */}
        <div className={`flex items-center gap-0.5 sm:gap-1 shrink-0 rounded-full px-1 sm:px-1.5 py-1 sm:py-1.5 ${
          readingTheme === 'dark' ? 'bg-white/10' : 
          readingTheme === 'sepia' ? 'bg-[#5c4b37]/10' : 
          'bg-ink/5'
        }`}>
          <button onClick={() => { vibrate(5); setReadingTheme('light'); }} className={`p-1 sm:p-1.5 rounded-full touch-manipulation active:scale-90 ${readingTheme === 'light' ? 'bg-white shadow-sm' : 'opacity-50 hover:opacity-80'}`}>
            <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-white border border-gray-300"></div>
          </button>
          <button onClick={() => { vibrate(5); setReadingTheme('sepia'); }} className={`p-1 sm:p-1.5 rounded-full touch-manipulation active:scale-90 ${readingTheme === 'sepia' ? 'bg-[#f4ecd8] shadow-sm' : 'opacity-50 hover:opacity-80'}`}>
            <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-[#f4ecd8] border border-[#d4c4a8]"></div>
          </button>
          <button onClick={() => { vibrate(5); setReadingTheme('dark'); }} className={`p-1 sm:p-1.5 rounded-full touch-manipulation active:scale-90 ${readingTheme === 'dark' ? 'bg-[#1a1a1a] shadow-sm' : 'opacity-50 hover:opacity-80'}`}>
            <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-[#1a1a1a] border border-gray-600"></div>
          </button>
        </div>

        {/* Font Size Controls */}
        <div className={`flex items-center gap-0.5 sm:gap-1 font-extrabold shrink-0 rounded-full px-1 sm:px-1.5 py-1 sm:py-1.5 ${
          readingTheme === 'dark' ? 'bg-white/10' : 
          readingTheme === 'sepia' ? 'bg-[#5c4b37]/10' : 
          'bg-ink/5'
        }`}>
          <button
            onClick={() => { vibrate(5); setFontSize((f: number) => Math.max(f - 2, 12)); }}
            className={`p-1 sm:p-1.5 rounded-full text-[11px] sm:text-xs transition-colors touch-manipulation active:scale-90 ${
              readingTheme === 'dark' ? 'hover:bg-white/10' : 
              readingTheme === 'sepia' ? 'hover:bg-[#5c4b37]/10' : 
              'hover:bg-ink/10'
            }`}
          >
            A-
          </button>
          <div className={`w-px h-3 sm:h-4 mx-0.5 ${
            readingTheme === 'dark' ? 'bg-white/20' : 
            readingTheme === 'sepia' ? 'bg-[#5c4b37]/20' : 
            'bg-ink/20'
          }`}></div>
          <button
            onClick={() => { vibrate(5); setFontSize((f: number) => Math.min(f + 2, 32)); }}
            className={`p-1 sm:p-1.5 rounded-full text-[11px] sm:text-xs transition-colors touch-manipulation active:scale-90 ${
              readingTheme === 'dark' ? 'hover:bg-white/10' : 
              readingTheme === 'sepia' ? 'hover:bg-[#5c4b37]/10' : 
              'hover:bg-ink/10'
            }`}
          >
            A+
          </button>
        </div>

        {/* Auto Scroll Controls */}
        <div className={`auto-scroll-control flex items-center gap-0.5 sm:gap-1 shrink-0 rounded-full px-1 sm:px-1.5 py-1 sm:py-1.5 ${
          readingTheme === 'dark' ? 'bg-white/10' : 
          readingTheme === 'sepia' ? 'bg-[#5c4b37]/10' : 
          'bg-ink/5'
        }`}>
          <button
            onClick={toggleAutoScroll}
            className={`p-1 sm:p-1.5 rounded-full transition-colors touch-manipulation active:scale-90 ${
              isAutoScrolling 
                ? 'bg-accent text-white shadow-sm' 
                : readingTheme === 'dark' ? 'hover:bg-white/10' : readingTheme === 'sepia' ? 'hover:bg-[#5c4b37]/10' : 'hover:bg-ink/10'
            }`}
          >
            {isAutoScrolling ? <Pause className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={2.5} /> : <ChevronsDown className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={2.5} />}
          </button>
          {isAutoScrolling && (
            <button
              onClick={cycleAutoScrollSpeed}
              className={`text-[10px] sm:text-[11px] font-extrabold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full ${
                readingTheme === 'dark' ? 'bg-white/20' : 
                readingTheme === 'sepia' ? 'bg-[#5c4b37]/20' : 
                'bg-ink/10'
              }`}
            >
              {autoScrollSpeed}x
            </button>
          )}
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
                strokeWidth={2.5}
                className={`w-4 h-4 sm:w-5 sm:h-5 ${bookmarks.includes(selectedSabad?.id || "") ? "fill-accent text-accent" : (readingTheme === 'dark' ? "text-white/70" : readingTheme === 'sepia' ? "text-[#5c4b37]/70" : "text-ink-light")}`}
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
            <Share2 strokeWidth={2.5} className={`w-4 h-4 sm:w-5 sm:h-5 ${readingTheme === 'dark' ? "text-white/70" : readingTheme === 'sepia' ? "text-[#5c4b37]/70" : "text-ink-light"}`} />
          </button>
        </div>
      </div>

      {/* Audio Player (Fixed outside swipeable container) */}
      {currentScreen === "audio_reading" && selectedSabad?.audioUrl && (
        <div className="w-full max-w-md mx-auto px-5 pt-2 shrink-0 z-10 relative">
          <AudioPlayer 
            key={selectedSabad.id}
            url={selectedSabad.audioUrl} 
            onEnded={handleAudioEnded} 
            autoPlay={autoPlayAudio}
            onPlay={() => { setIsAudioActive(true); setAutoPlayAudio(true); setPlayingSabad(selectedSabad); }}
            onPause={() => {
              setAutoPlayAudio(false);
            }}
            onNext={() => {
              handleSwipe("left");
            }}
            onPrev={() => {
              handleSwipe("right");
            }}
            title={selectedSabad.title}
            playingSabad={playingSabad}
            selectedSabad={selectedSabad}
            showToast={showToast}
            variant="full"
            hideTitle={true}
            logoUrl={settings?.logoUrl}
          />
        </div>
      )}

      {/* Title Card (Static Container, Fading Content) */}
      <div className={`w-full max-w-md mx-auto px-5 ${currentScreen === "audio_reading" && selectedSabad?.audioUrl ? "pt-3" : "pt-5"} pb-2 shrink-0 z-10 relative text-center`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedSabad?.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="inline-flex flex-col items-center justify-center relative z-10"
          >
            <div className="bg-accent/10 text-accent-dark px-6 py-1 rounded-full border border-accent/20 shadow-sm backdrop-blur-sm">
              <h2 className="text-xl md:text-2xl font-bold font-serif tracking-wide">
                {selectedSabad?.title ? `॥ ${selectedSabad.title} ॥` : ""}
              </h2>
            </div>
            {selectedSabad?.author && selectedSabad.author.toLowerCase() !== "admin" && (
              <p className="text-xs text-ink-light font-medium mt-2">
                द्वारा: {selectedSabad.author}
              </p>
            )}
          </motion.div>
        </AnimatePresence>
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
              className={`text-center leading-relaxed w-full whitespace-pre-wrap mt-2 p-6 sm:p-8 rounded-3xl shadow-sm border select-none mb-6 transition-colors duration-300 font-medium ${
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
                disabled={readingList === sabads && readingIndex === 119 ? false : readingIndex >= totalCount - 1}
                className={`flex items-center justify-center gap-1.5 px-5 sm:px-8 py-3.5 rounded-2xl font-medium border shadow-md transition-all active:scale-95 touch-manipulation ${
                  (readingList === sabads && readingIndex === 119) ? '' : (readingIndex >= totalCount - 1 ? 'opacity-40 cursor-not-allowed' : '')
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
