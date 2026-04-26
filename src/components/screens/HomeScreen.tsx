import { motion } from "motion/react";
import { Sun } from "lucide-react";
import { format } from "date-fns";
import { hi } from "date-fns/locale";
import { getJD, getTithiName, getSamvat } from "../../lib/astro";
import { BannerSkeleton } from "../Skeleton";
import PremiumBanner from "../PremiumBanner";
import CategoryGrid from "../CategoryGrid";

export interface HomeScreenProps {
  isLoading: boolean;
  processedMeles: any[];
  badhais: any[];
  dailyThought: string;
  notices: any[];
  handleOpenCategory: (
    targetScreen: 'reading' | 'audio_reading',
    listScreen: 'shabad_list' | 'category_list',
    category?: 'aarti' | 'bhajan' | 'sakhi' | 'mantra'
  ) => void;
  navigateTo: (screen: string) => void;
}

export default function HomeScreen({
  isLoading,
  processedMeles,
  badhais,
  dailyThought,
  notices,
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
        <PremiumBanner 
          meles={processedMeles} 
          badhais={badhais} 
          dailyThought={dailyThought} 
          notices={notices}
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
      <CategoryGrid 
        handleOpenCategory={handleOpenCategory} 
        navigateTo={navigateTo} 
      />
    </motion.div>
  );
}
