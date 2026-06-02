import { motion } from "motion/react";
import { Calendar } from "lucide-react";
import { format } from "date-fns";
import { hi } from "date-fns/locale";
import { getJD, getTithiName, getSamvat } from "../../lib/astro";
import PremiumBanner from "../PremiumBanner";
import CategoryGrid from "../CategoryGrid";
import { BannerSkeleton, CategorySkeleton } from "../Skeleton";
import { Ripple } from "../Ripple";

export interface HomeScreenProps {
  processedMeles: any[];
  badhais: any[];
  dailyThought: any;
  notices: any[];
  isLoading?: boolean;
  handleOpenCategory: (
    targetScreen: 'reading' | 'audio_reading',
    listScreen: 'shabad_list' | 'category_list',
    category?: 'aarti' | 'bhajan' | 'sakhi' | 'mantra'
  ) => void;
  navigateTo: (screen: string) => void;
}

export default function HomeScreen({
  processedMeles,
  badhais,
  dailyThought,
  notices,
  isLoading,
  handleOpenCategory,
  navigateTo
}: HomeScreenProps) {
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
      <div className="px-4 mb-2 shrink-0 font-sans">
        <button 
          onClick={() => navigateTo('panchang_calendar')}
          className="relative overflow-hidden w-full bg-white/90 backdrop-blur-md rounded-2xl p-2.5 border border-ink/5 shadow-sm flex items-center justify-between text-left hover:bg-white/95 active:scale-[0.99] transition-all cursor-pointer focus:outline-none"
        >
          <Ripple color="rgba(230, 138, 0, 0.15)" />
          {/* Left Block: Today's Gregorian Date (No Icon) */}
          <div className="flex flex-col flex-1 min-w-0 pointer-events-none">
            <h4 className="text-[10px] font-black text-accent-dark uppercase tracking-widest mb-0.5 truncate">
              आज का पंचांग
            </h4>
            <p className="text-[12px] font-extrabold text-ink truncate">
              {format(new Date(), "dd MMMM, EEEE", { locale: hi })}
            </p>
          </div>

          {/* Center Block: Luxurious Circular Button badge with radiating sun rays effect */}
          <div className="relative mx-3 shrink-0 flex items-center justify-center">
            {/* Ambient dynamic pulsing rays/rings */}
            <div className="absolute h-14 w-14 rounded-full border border-dashed border-accent/30 animate-spin-slow shrink-0" />
            <div className="absolute h-16 w-16 rounded-full border border-accent/10 animate-pulse scale-90 shrink-0" />
            <div className="absolute inset-0 rounded-full bg-accent/15 animate-ping opacity-40 scale-110 shrink-0" />
            
            {/* The main core circle button */}
            <div className="relative h-11 w-11 rounded-full bg-gradient-to-tr from-accent/25 via-accent/5 to-accent/35 border border-accent/40 shadow-sm flex flex-col items-center justify-center text-[8px] font-black text-accent-dark leading-none gap-1 transition-all">
              <Calendar className="w-3.5 h-3.5 text-accent-dark shrink-0" />
              <span>कैलेंडर</span>
            </div>
          </div>

          {/* Right Block: Today's Hindu Tithi & Samvat */}
          <div className="text-right flex-1 min-w-0">
            <p className="text-[11px] font-black text-accent-dark truncate">
              {getTithiName(getJD(new Date(new Date().setHours(6, 0, 0, 0))))}
            </p>
            <p className="text-[9px] font-bold text-ink-light uppercase mt-0.5 truncate">
              विक्रमी संवत {getSamvat(getJD(new Date(new Date().setHours(6, 0, 0, 0))))}
            </p>
          </div>
        </button>
      </div>

      {/* Premium Grid Layout for Main Categories - Compact 3-Column Design */}
      {isLoading ? (
        <div className="grid grid-cols-3 gap-3 px-4 mt-2 flex-1 overflow-y-auto pb-12 hide-scrollbar">
          {Array.from({ length: 12 }).map((_, i) => (
            <CategorySkeleton key={i} />
          ))}
        </div>
      ) : (
        <CategoryGrid 
          handleOpenCategory={handleOpenCategory} 
          navigateTo={navigateTo} 
        />
      )}
    </motion.div>
  );
}
