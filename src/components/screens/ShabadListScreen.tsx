import { useRef } from "react";
import { motion } from "motion/react";
import { Book } from "lucide-react";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import PremiumHeader from "../PremiumHeader";
import { ShabadSkeleton } from "../Skeleton";
import ShabadCard from "../ShabadCard";

export interface ShabadListScreenProps {
  isLoading: boolean;
  sabads: any[];
  handleBack: () => void;
  handleSabadClick: (sabad: any) => void;
}

export default function ShabadListScreen({ isLoading, sabads, handleBack, handleSabadClick }: ShabadListScreenProps) {
  const listRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useWindowVirtualizer({
    count: isLoading ? 8 : sabads.length,
    estimateSize: () => 80, // estimated height of ShabadCard
    overscan: 5,
  });

  return (
    <motion.div
      key="shabad_list"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3, ease: "circOut" }}
      style={{ willChange: "transform, opacity", transform: "translateZ(0)" }}
      className="pb-32 bg-paper min-h-screen"
    >
      <PremiumHeader title="संपूर्ण सबदवाणी" onBack={handleBack} icon={Book} />
      <div className="flex flex-col p-2 mt-2" ref={listRef}>
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualItem) => {
            const isLoader = isLoading || virtualItem.index >= sabads.length;
            const item = !isLoader ? sabads[virtualItem.index] : null;

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
                    icon={item.icon}
                    onClick={() => handleSabadClick(item)}
                    iconType="book"
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
