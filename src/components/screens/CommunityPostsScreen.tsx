import { useRef } from "react";
import { motion } from "motion/react";
import { Info, PlusCircle, ChevronRight, Clock, User, HeartHandshake, Users } from "lucide-react";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import PremiumHeader from "../PremiumHeader";
import { PostSkeleton } from "../Skeleton";
import { auth } from "../../firebase";
import { SabadItem } from "../../types";

export interface CommunityPostsScreenProps {
  isLoading: boolean;
  recentApprovedPosts: any[];
  myPendingPosts: any[];
  handleBack: () => void;
  navigateTo: (screen: string) => void;
  setSelectedSabad: (sabad: SabadItem) => void;
  setSelectedCategory: (cat: 'aarti' | 'bhajan' | 'sakhi' | 'mantra') => void;
  setAutoPlayAudio: (play: boolean) => void;
}

export default function CommunityPostsScreen(props: CommunityPostsScreenProps) {
  const {
    isLoading, recentApprovedPosts, myPendingPosts,
    handleBack, navigateTo, setSelectedSabad, setSelectedCategory, setAutoPlayAudio
  } = props;

  const listRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useWindowVirtualizer({
    count: isLoading ? 3 : recentApprovedPosts.length,
    estimateSize: () => 230, // estimated height of post card
    overscan: 2,
  });

  return (
    <motion.div
      key="community_posts"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="pb-32 bg-paper min-h-screen"
    >
      <PremiumHeader title="भक्त योगदान" onBack={handleBack} icon={HeartHandshake} />
      <div className="flex flex-col p-4 gap-4">
        <div className="bg-white/50 backdrop-blur-sm p-5 rounded-[2rem] border border-accent/10 mb-2 shadow-sm flex gap-4 items-center">
          <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
            <Info className="w-5 h-5 text-accent-dark" />
          </div>
          <p className="text-xs text-ink-light leading-relaxed font-medium">
            यहाँ सबदवाणी परिवार के सज्जनों द्वारा भेजे गए नवीनतम 10 योगदान दिखाए जा रहे हैं। आप भी अपना योगदान भेज सकते हैं।
          </p>
        </div>

        {isLoading ? (
          <div className="flex flex-col gap-5">
            {[...Array(3)].map((_, i) => <PostSkeleton key={i} />)}
          </div>
        ) : recentApprovedPosts.length === 0 && myPendingPosts.length === 0 ? (
          <div className="text-center text-ink-light mt-10">
            <Users className="w-16 h-16 mx-auto opacity-20 mb-4" />
            <p className="text-xl">अभी तक कोई योगदान नहीं है।</p>
            <button
              onClick={() => navigateTo("contribute")}
              className="mt-4 text-accent font-bold underline"
            >
              पहला योगदान दें
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {/* User's own contribution prompt if they haven't sent anything */}
            {!recentApprovedPosts.some(p => p.userId === auth?.currentUser?.uid) && myPendingPosts.length === 0 && (
              <button
                onClick={() => navigateTo("contribute")}
                className="bg-accent/5 p-6 rounded-[2rem] border border-dashed border-accent/30 flex items-center justify-between group hover:bg-accent/10 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                    <PlusCircle className="w-6 h-6 text-accent-dark" />
                  </div>
                  <div className="text-left">
                    <h4 className="font-bold text-ink">अपना योगदान भेजें</h4>
                    <p className="text-[10px] text-ink-light">सबदवाणी परिवार में अपना योगदान जोड़ें</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-accent-dark group-hover:translate-x-1 transition-transform" />
              </button>
            )}

            {/* Pending Section */}
            {myPendingPosts.length > 0 && (
              <div className="flex flex-col gap-3">
                <h4 className="text-xs font-bold text-accent-dark uppercase tracking-widest ml-2">मेरे लंबित योगदान</h4>
                {myPendingPosts.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white/40 rounded-[2rem] p-6 shadow-sm border border-dashed border-accent/30 relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 bg-accent/10 px-4 py-1.5 rounded-bl-2xl text-[10px] font-bold text-accent uppercase tracking-wider">
                      समीक्षाधीन
                    </div>
                    <h3 className="text-lg font-bold text-ink mb-2">
                      {item.title}
                    </h3>
                    <div className="flex items-center gap-3 text-ink-light text-xs mb-4">
                      <span className="bg-accent/5 text-accent-dark px-2.5 py-1 rounded-full font-bold">{item.type}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(item.timestamp).toLocaleDateString('hi-IN')}</span>
                    </div>
                    <p className="text-ink-light text-sm line-clamp-2 italic">
                      "{item.text}"
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Recent Feed */}
            <div ref={listRef}>
              <div
                style={{
                  height: `${rowVirtualizer.getTotalSize()}px`,
                  width: '100%',
                  position: 'relative',
                }}
              >
                {rowVirtualizer.getVirtualItems().map((virtualItem) => {
                  const isLoader = isLoading || virtualItem.index >= recentApprovedPosts.length;
                  const item = !isLoader ? recentApprovedPosts[virtualItem.index] : null;

                  return (
                    <div
                      key={virtualItem.key}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        transform: `translateY(${virtualItem.start}px)`,
                        paddingBottom: '20px',
                      }}
                      ref={rowVirtualizer.measureElement}
                      data-index={virtualItem.index}
                    >
                      {isLoader ? (
                        <PostSkeleton />
                      ) : (
                        <div
                          className={`group bg-white rounded-[2rem] p-6 shadow-sm border ${auth?.currentUser?.uid === item.userId ? "border-accent/50 ring-1 ring-accent/20" : "border-ink/5"} hover:shadow-xl hover:shadow-accent/5 transition-all duration-500 relative overflow-hidden`}
                        >
                          <div className="absolute -right-4 -top-4 w-24 h-24 bg-accent/5 rounded-full blur-2xl group-hover:bg-accent/10 transition-colors"></div>
                          
                          <div className="flex flex-col mb-4">
                            <h3 className="text-xl font-bold text-ink group-hover:text-accent-dark transition-colors leading-tight">
                              {item.title}
                            </h3>
                            <div className="flex items-center gap-2 mt-1.5">
                              <span className="bg-accent/10 text-accent-dark text-[10px] font-bold px-2.5 py-0.5 rounded-md uppercase tracking-wider">
                                {item.type}
                              </span>
                              {auth?.currentUser?.uid === item.userId && (
                                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100 uppercase tracking-wider">आपका योगदान</span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2.5 text-ink-light text-sm mb-6">
                            <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center border border-accent/5">
                              <User className="w-4 h-4 text-accent-dark" />
                            </div>
                            <div className="flex flex-col">
                              <span className="font-bold text-ink/90 text-xs leading-none mb-0.5">{item.author}</span>
                              <span className="text-[10px] opacity-60">सबदवाणी परिवार</span>
                            </div>
                          </div>

                          <div className="relative mb-6 pl-4 border-l-2 border-accent/20">
                            <p className="text-ink-light text-sm line-clamp-3 leading-relaxed">
                              {item.text}
                            </p>
                          </div>

                          <button
                            onClick={() => {
                              setSelectedSabad(item);
                              if (item.type === "शब्द") {
                                navigateTo("reading");
                              } else {
                                if (item.type === "भजन") setSelectedCategory("bhajan");
                                else if (item.type === "आरती") setSelectedCategory("aarti");
                                else if (item.type === "मंत्र") setSelectedCategory("mantra");
                                else if (item.type === "साखी") setSelectedCategory("sakhi");
                                setAutoPlayAudio(true);
                                navigateTo("audio_reading");
                              }
                            }}
                            className="w-full py-4 bg-ink/5 hover:bg-accent hover:text-white active:bg-accent-dark active:scale-[0.98] text-ink font-bold rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 group/btn"
                          >
                            पूरा पढ़ें <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
