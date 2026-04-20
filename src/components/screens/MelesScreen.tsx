import { useEffect } from "react";
import { motion } from "motion/react";
import { Users, CalendarDays, Home } from "lucide-react";
import PremiumHeader from "../PremiumHeader";
import { MelaSkeleton } from "../Skeleton";

export interface MelesScreenProps {
  isLoading: boolean;
  meles: any[];
  processedMeles: any[];
  navigateTo: (screen: string) => void;
}

export default function MelesScreen({ isLoading, meles, processedMeles, navigateTo }: MelesScreenProps) {
  const isLoaderShowing = isLoading || (processedMeles.length === 0 && meles.length === 0);

  // Scroll to upcoming mela smoothly after a short delay (like Amavasya Darshan)
  useEffect(() => {
    if (!isLoaderShowing && processedMeles.length > 0) {
      const timer = setTimeout(() => {
        const targetIdx = processedMeles.findIndex(m => m.upcoming);
        if (targetIdx !== -1) {
          const cards = document.querySelectorAll('.mela-card');
          if (cards[targetIdx]) {
            cards[targetIdx].scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
      }, 500); // 500ms delay to let user see top of screen before scrolling
      return () => clearTimeout(timer);
    }
  }, [isLoaderShowing, processedMeles]);

  return (
    <motion.div
      key="mele"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pb-32 bg-paper min-h-screen"
    >
      <PremiumHeader title="आगामी प्रमुख मेले" onBack={() => navigateTo("home")} icon={Users} />

      <div className="px-4 pt-4 space-y-4">
        {isLoaderShowing ? (
          <>
            <MelaSkeleton />
            <MelaSkeleton />
            <MelaSkeleton />
          </>
        ) : (
          processedMeles.map((mela, i) => (
            <div
              key={mela.id || i}
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
}
