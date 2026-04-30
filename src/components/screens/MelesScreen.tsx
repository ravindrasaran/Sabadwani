import { useEffect, useRef } from "react";
import { motion } from "motion/react";
import { Users, CalendarDays, Home } from "lucide-react";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import PremiumHeader from "../PremiumHeader";
import { MelaSkeleton } from "../Skeleton";

export interface MelesScreenProps {
  isLoading: boolean;
  meles: any[];
  processedMeles: any[];
  navigateTo: (screen: string) => void;
}

export default function MelesScreen({ isLoading, meles, processedMeles, navigateTo }: MelesScreenProps) {
  const listRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useWindowVirtualizer({
    count: isLoading || (processedMeles.length === 0 && meles.length === 0) ? 3 : processedMeles.length,
    estimateSize: () => 180, // estimated height of Mela card
    overscan: 5,
  });

  // Scroll to upcoming mela smoothly after a short delay
  useEffect(() => {
    const timer = setTimeout(() => {
      const targetIdx = processedMeles.findIndex(m => m.upcoming);
      if (targetIdx !== -1) {
        rowVirtualizer.scrollToIndex(targetIdx, { align: 'center', behavior: 'smooth' });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [processedMeles, rowVirtualizer]);

  return (
    <motion.div
      key="mele"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pb-32 bg-paper min-h-screen"
    >
      <PremiumHeader title="आगामी प्रमुख मेले" onBack={() => navigateTo("home")} icon={Users} />

      <div className="flex flex-col px-4 pt-4 mt-2" ref={listRef}>
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualItem) => {
            const isLoader = isLoading || (processedMeles.length === 0 && meles.length === 0);
            const mela = !isLoader ? processedMeles[virtualItem.index] : null;

            return (
              <div
                key={virtualItem.key}
                data-index={virtualItem.index}
                ref={rowVirtualizer.measureElement}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualItem.start}px)`,
                  paddingBottom: '16px' // space-y-4 equivalent
                }}
              >
                {isLoader ? (
                  <MelaSkeleton />
                ) : (
                  <div
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
                )}
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
