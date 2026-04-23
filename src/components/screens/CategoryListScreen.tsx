import { useRef } from "react";
import { motion } from "motion/react";
import { Music, BookOpenText, Play } from "lucide-react";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import PremiumHeader from "../PremiumHeader";
import { ShabadSkeleton } from "../Skeleton";
import ShabadCard from "../ShabadCard";

export interface CategoryListScreenProps {
  isLoading: boolean;
  selectedCategory: string;
  aartis: any[];
  bhajans: any[];
  sakhis: any[];
  mantras: any[];
  handleBack: () => void;
  navigateTo: (screen: string) => void;
  setSelectedSabad: (sabad: any) => void;
  setAutoPlayAudio: (play: boolean) => void;
}

export default function CategoryListScreen({ 
  isLoading, selectedCategory, aartis, bhajans, sakhis, mantras, 
  handleBack, navigateTo, setSelectedSabad, setAutoPlayAudio 
}: CategoryListScreenProps) {
  
  const categoryData = {
    aarti: { title: "आरती", list: aartis, icon: Music },
    bhajan: { title: "भजन", list: bhajans, icon: Music },
    sakhi: { title: "साखी", list: sakhis, icon: BookOpenText },
    mantra: { title: "मंत्र", list: mantras, icon: Music },
  }[selectedCategory as "aarti" | "bhajan" | "sakhi" | "mantra"];

  const listRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useWindowVirtualizer({
    count: isLoading || !categoryData ? 6 : categoryData.list.length,
    estimateSize: () => 80,
    overscan: 5,
  });

  if (!categoryData) return null;

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
      <div className="flex flex-col p-2 mt-2" ref={listRef}>
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualItem) => {
            const isLoader = isLoading || !categoryData || virtualItem.index >= categoryData.list.length;
            const item = !isLoader ? categoryData.list[virtualItem.index] : null;

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
                }}
              >
                {isLoader ? (
                  <ShabadSkeleton />
                ) : (
                  <ShabadCard
                    title={item.title}
                    icon={Play}
                    onClick={() => {
                      setSelectedSabad(item);
                      setAutoPlayAudio(true);
                      navigateTo("audio_reading");
                    }}
                    iconType="play"
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
