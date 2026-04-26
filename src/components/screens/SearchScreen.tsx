import { useRef, useDeferredValue } from "react";
import { motion } from "motion/react";
import { Search } from "lucide-react";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import PremiumHeader from "../PremiumHeader";
import { ShabadSkeleton } from "../Skeleton";
import { SabadItem } from "../../types";
import { useAppStore } from "../../store/useAppStore";

export interface SearchScreenProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isLoading: boolean;
  sabads: SabadItem[];
  aartis: SabadItem[];
  bhajans: SabadItem[];
  sakhis: SabadItem[];
  mantras: SabadItem[];
  meles: any[];
  matchSearch: (title: string, text?: string) => boolean;
  handleSabadClick: (sabad: SabadItem) => void;
  setSelectedSabad: (sabad: SabadItem) => void;
  setSelectedCategory: (cat: 'aarti' | 'bhajan' | 'sakhi' | 'mantra') => void;
  setAutoPlayAudio: (play: boolean) => void;
  navigateTo: (screen: string) => void;
}

export default function SearchScreen(props: SearchScreenProps) {
  const {
    searchQuery, setSearchQuery, isLoading,
    sabads, aartis, bhajans, sakhis, mantras, meles,
    matchSearch, handleSabadClick, setSelectedSabad,
    setSelectedCategory, setAutoPlayAudio, navigateTo
  } = props;
  
  const deferredQuery = useDeferredValue(searchQuery);

  const filteredSabads = deferredQuery ? sabads.filter(s => matchSearch(s.title, s.text)).map(item => ({ ...item, listType: 'sabad' })) : [];
  const filteredAartis = deferredQuery ? aartis.filter(m => matchSearch(m.title, m.text)).map(item => ({ ...item, listType: 'aarti' })) : [];
  const filteredBhajans = deferredQuery ? bhajans.filter(m => matchSearch(m.title, m.text)).map(item => ({ ...item, listType: 'bhajan' })) : [];
  const filteredSakhis = deferredQuery ? sakhis.filter(m => matchSearch(m.title, m.text)).map(item => ({ ...item, listType: 'sakhi' })) : [];
  const filteredMantras = deferredQuery ? mantras.filter(m => matchSearch(m.title, m.text)).map(item => ({ ...item, listType: 'mantra' })) : [];
  const filteredMeles = deferredQuery ? meles.filter(m => matchSearch(m.name, m.location)).map(item => ({ ...item, listType: 'mele' })) : [];

  // Flatten the array with headers
  const flattenedList: any[] = [];
  
  if (filteredSabads.length > 0) {
    flattenedList.push({ isHeader: true, title: `सबदवाणी (${filteredSabads.length})` });
    flattenedList.push(...filteredSabads);
  }
  if (filteredAartis.length > 0) {
    flattenedList.push({ isHeader: true, title: `आरती (${filteredAartis.length})` });
    flattenedList.push(...filteredAartis);
  }
  if (filteredBhajans.length > 0) {
    flattenedList.push({ isHeader: true, title: `भजन (${filteredBhajans.length})` });
    flattenedList.push(...filteredBhajans);
  }
  if (filteredSakhis.length > 0) {
    flattenedList.push({ isHeader: true, title: `साखी (${filteredSakhis.length})` });
    flattenedList.push(...filteredSakhis);
  }
  if (filteredMantras.length > 0) {
    flattenedList.push({ isHeader: true, title: `मंत्र (${filteredMantras.length})` });
    flattenedList.push(...filteredMantras);
  }
  if (filteredMeles.length > 0) {
    flattenedList.push({ isHeader: true, title: `मेले (${filteredMeles.length})` });
    flattenedList.push(...filteredMeles);
  }

  const listRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useWindowVirtualizer({
    count: flattenedList.length,
    estimateSize: (index) => {
      const item = flattenedList[index];
      if (item.isHeader) return 36; // Header height approx
      if (item.listType === 'mele') return 80;
      return 80; // Item height approx
    },
    overscan: 5,
  });

  return (
    <motion.div key="search" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pb-32 bg-paper min-h-screen">
      <PremiumHeader title="खोजें (Search)" onBack={() => navigateTo('home')} icon={Search} />
      <div className="px-6 pt-4">
        <div className="relative mb-4 flex items-center">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-ink-light" />
          <input 
            autoFocus
            type="text" 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="शब्द, भजन, आरती, साखी या मेले खोजें..." 
            className="w-full pl-12 py-3 rounded-2xl border border-ink/20 bg-white focus:border-accent outline-none shadow-sm pr-4"
          />
        </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => <ShabadSkeleton key={i} />)}
        </div>
      ) : searchQuery && flattenedList.length > 0 ? (
        <div ref={listRef} style={{ paddingBottom: '1rem' }}>
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualItem) => {
              const item = flattenedList[virtualItem.index];

              return (
                <div
                  key={virtualItem.key}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${virtualItem.start}px)`,
                    paddingBottom: '12px'
                  }}
                  ref={rowVirtualizer.measureElement}
                  data-index={virtualItem.index}
                >
                  {item.isHeader ? (
                    <h3 className="font-bold text-lg text-accent-dark pt-2">{item.title}</h3>
                  ) : item.listType === 'mele' ? (
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-ink/5">
                      <h4 className="font-bold text-ink">{item.name}</h4>
                      <p className="text-sm text-ink-light mt-1">{item.location} • {item.dateStr}</p>
                    </div>
                  ) : (
                    <button 
                      onClick={() => {
                        if (item.listType === 'sabad') {
                          handleSabadClick(item);
                        } else {
                          setSelectedSabad(item);
                          setSelectedCategory(item.listType);
                          if (item.audioUrl) {
                            useAppStore.getState().setAudioPlaybackState({
                              playingSabad: item,
                              isAudioActive: true,
                              isMiniPlayerDismissed: false,
                              autoPlayAudio: false,
                              audioProgress: 0,
                              audioCurrentTime: 0,
                            });
                            navigateTo("audio_reading");
                          } else {
                            setAutoPlayAudio(false);
                            navigateTo("reading");
                          }
                        }
                      }} 
                      className="w-full text-left bg-white p-4 rounded-2xl shadow-sm border border-ink/5"
                    >
                      <h4 className="font-bold text-ink">{item.title}</h4>
                      <p className="text-sm text-ink-light line-clamp-1 mt-1 break-words">{item.text}</p>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : searchQuery ? (
        <div className="text-center py-12 text-ink-light">
          <Search className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p>कोई परिणाम नहीं मिला</p>
        </div>
      ) : null}
      </div>
    </motion.div>
  );
}
