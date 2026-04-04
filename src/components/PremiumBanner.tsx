import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Quote, Bell, CalendarDays, Flame, Users, Sun, CheckCircle } from "lucide-react";
import { getCurrentHinduDate, generateAmavasyaForYear } from "../lib/astro";
import { DYNAMIC_GREETINGS } from "../constants";
import { vibrate } from "../lib/utils";

const PremiumBanner = ({ meles, badhais, dailyThought, notices }: any) => {
  const greetings = useMemo(() => {
    const today = new Date();
    const { month, tithi } = getCurrentHinduDate(today);
    
    const dynamicGreetings = DYNAMIC_GREETINGS.filter(g => g.condition(month, tithi, today)).map(g => ({
      text: g.text,
      sender: g.title,
      imageUrl: "/logo.png"
    }));

    const userGreetings = (badhais || []).filter((b: any) => b.isActive).map((b: any) => ({
      text: b.text,
      sender: b.name,
      imageUrl: b.photoUrl
    }));
    
    return [...dynamicGreetings, ...userGreetings];
  }, [badhais]);

  const activeNotices = useMemo(() => {
    return (notices || []).filter((n: any) => n.isActive);
  }, [notices]);

  const [currentBanner, setCurrentBanner] = useState<"flash" | "badhai" | "thought" | "notice">("thought");
  const [flashAlert, setFlashAlert] = useState<any>(null);
  const [greetingIndex, setGreetingIndex] = useState(0);
  const [noticeIndex, setNoticeIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);


  const bannerAmavasyaList = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return [
      ...generateAmavasyaForYear(currentYear),
      ...generateAmavasyaForYear(currentYear + 1)
    ];
  }, []);

  useEffect(() => {

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const upcomingMelaDays = new Date(today);
    upcomingMelaDays.setDate(today.getDate() + 7);

    const upcomingAmavasyaDays = new Date(today);
    upcomingAmavasyaDays.setDate(today.getDate() + 7); 

    let foundMela = null;
    let foundAmavasya = null;


    let closestMela = null;
    let minMelaDiffDays = Infinity;

    for (const mela of meles) {
      if (!mela.dateStr || typeof mela.dateStr !== 'string') continue;
      const [year, month, day] = mela.dateStr.split('-').map(Number);
      const melaDate = new Date(year, month - 1, day);
      if (melaDate >= today && melaDate <= upcomingMelaDays) {
        const diffTime = melaDate.getTime() - today.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays >= 0 && diffDays < minMelaDiffDays) {
          minMelaDiffDays = diffDays;
          closestMela = { ...mela, diffDays };
        }
      }
    }
    foundMela = closestMela;

    const now = new Date();


    for (const amavasya of bannerAmavasyaList) {
      if (!amavasya.startDate || !amavasya.endDate) continue;


      if (now > amavasya.endDate) continue;
      
      const startDay = new Date(amavasya.startDate);
      startDay.setHours(0,0,0,0);
      
      const endDay = new Date(amavasya.endDate);
      endDay.setHours(23,59,59,999);
      

      if (today >= startDay && today <= endDay) {
        foundAmavasya = { ...amavasya, diffDays: 0 };
        break;
      }
      

      if (startDay > today && startDay <= upcomingAmavasyaDays) {
        const diffTime = startDay.getTime() - today.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
        foundAmavasya = { ...amavasya, diffDays };
        break;
      }
    }

    if (foundMela || foundAmavasya) {
      setFlashAlert({
        mela: foundMela ? {
          name: foundMela.name,
          diffDays: foundMela.diffDays,
          location: foundMela.location || "जांगलू"
        } : null,
        amavasya: foundAmavasya ? {
          diffDays: foundAmavasya.diffDays,
          start: foundAmavasya.start,
          end: foundAmavasya.end
        } : null
      });
      setCurrentBanner("flash");
    } else if (activeNotices.length > 0) {
      setCurrentBanner("notice");
    } else {
      setCurrentBanner(greetings.length > 0 ? "badhai" : "thought");
    }
  }, [meles, bannerAmavasyaList, greetings, activeNotices]);

  useEffect(() => {
    if (!isHovered) {
      const timer = setInterval(() => {
        const availableBanners: ("flash" | "badhai" | "thought" | "notice")[] = [];
        if (flashAlert) availableBanners.push("flash");
        if (activeNotices.length > 0) availableBanners.push("notice");
        if (greetings.length > 0) availableBanners.push("badhai");
        availableBanners.push("thought");

        const currentIndex = availableBanners.indexOf(currentBanner);
        const nextBanner = availableBanners[(currentIndex + 1) % availableBanners.length] || "thought";
        
        if (nextBanner === "badhai" && greetings.length > 0) {
          setGreetingIndex(prev => {
            if (greetings.length <= 1) return 0;
            let next = Math.floor(Math.random() * greetings.length);
            while (next === prev) {
              next = Math.floor(Math.random() * greetings.length);
            }
            return next;
          });
        }

        if (nextBanner === "notice" && activeNotices.length > 0) {
          setNoticeIndex(prev => {
            if (activeNotices.length <= 1) return 0;
            let next = Math.floor(Math.random() * activeNotices.length);
            while (next === prev) {
              next = Math.floor(Math.random() * activeNotices.length);
            }
            return next;
          });
        }

        setCurrentBanner(nextBanner);
      }, 7000);
      return () => clearInterval(timer);
    }
  }, [greetings, activeNotices, isHovered, flashAlert, currentBanner]);

  return (
    <div 
      className="mx-4 my-1.5 h-[110px] relative cursor-pointer"
      onClick={() => {
        vibrate(10);
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={() => setIsHovered(true)}
      onTouchEnd={() => setIsHovered(false)}
    >
      <AnimatePresence mode="wait">
        {currentBanner === "flash" && flashAlert && (
          <motion.div
            key="flashAlert"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.5 }}
            className="absolute inset-0 p-4 bg-gradient-to-br from-accent to-accent-dark rounded-[2rem] text-white shadow-[0_8px_30px_rgba(230,138,0,0.2)] flex flex-col justify-center overflow-hidden border border-white/10"
          >
            <div className="absolute -right-4 -top-4 opacity-10 pointer-events-none">
              <CalendarDays className="w-32 h-32" />
            </div>
            
            <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-red-500/90 text-white text-[10px] font-bold px-3 py-0.5 rounded-b-lg shadow-md z-20 flex items-center gap-1 border border-t-0 border-white/20">
              <Bell className="w-3 h-3 animate-pulse" /> {(flashAlert.mela?.diffDays === 0 || flashAlert.amavasya?.diffDays === 0) ? "सूचना" : "आगामी सूचना"}
            </div>
            
            <div className="relative z-10 flex flex-col justify-center items-center h-full w-full pt-3">
              <div className="flex items-center justify-center w-full gap-0 px-1">
                
                {/* Case 1: Both Mela and Amavasya exist */}
                {flashAlert.mela && flashAlert.amavasya ? (
                  <div className="flex items-center justify-around w-full gap-2">
                    {/* Left Side: Mela */}
                    <div className="flex flex-col items-center text-center max-w-[48%]">
                      <Flame className="w-5 h-5 text-yellow-400 mb-1 fill-current" />
                      <p className="text-[11px] font-bold leading-tight">
                        {flashAlert.mela.name} {flashAlert.mela.diffDays === 0 ? "आज है।" : flashAlert.mela.diffDays === 1 ? "कल है।" : `${flashAlert.mela.diffDays} दिन बाद है।`}
                      </p>
                      <p className="text-[9px] opacity-90 w-full mt-0.5 whitespace-normal break-words line-clamp-2">
                        स्थान: {flashAlert.mela.location}
                      </p>
                    </div>
                    
                    <div className="w-px h-12 bg-white/20 shrink-0" />
                    
                    {/* Right Side: Amavasya */}
                    <div className="flex flex-col items-center text-center max-w-[48%]">
                      <div className="text-sm mb-1">🌙</div>
                      <p className="text-[11px] font-bold leading-tight">
                        अमावस्या {flashAlert.amavasya.diffDays === 0 ? "आज है।" : flashAlert.amavasya.diffDays === 1 ? "कल है।" : `${flashAlert.amavasya.diffDays} दिन बाद है।`}
                      </p>
                      <div className="flex flex-col items-center mt-0.5">
                        <p className="text-[8px] opacity-90 leading-tight">
                          प्रारम्भ: {flashAlert.amavasya.start}
                        </p>
                        <p className="text-[8px] opacity-90 leading-tight mt-0.5">
                          समाप्त: {flashAlert.amavasya.end}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : flashAlert.mela ? (
                  /* Case 2: Only Mela exists */
                  <div className="flex flex-col items-center justify-center text-center">
                    <Flame className="w-6 h-6 text-yellow-400 mb-1.5 fill-current drop-shadow-md" />
                    <p className="text-[13px] font-bold leading-tight drop-shadow-sm">
                      {flashAlert.mela.name} {flashAlert.mela.diffDays === 0 ? "आज है।" : flashAlert.mela.diffDays === 1 ? "कल है।" : `${flashAlert.mela.diffDays} दिन बाद है।`}
                    </p>
                    <p className="text-[10px] opacity-90 mt-0.5 font-medium">
                      स्थान: {flashAlert.mela.location}
                    </p>
                  </div>
                ) : flashAlert.amavasya ? (
                  /* Case 3: Only Amavasya exists */
                  <div className="flex flex-col items-center justify-center text-center">
                    <div className="text-xs mb-1">🌙</div>
                    <p className="text-[13px] font-bold leading-tight drop-shadow-sm mb-1.5">
                      अमावस्या {flashAlert.amavasya.diffDays === 0 ? "आज है।" : flashAlert.amavasya.diffDays === 1 ? "कल है।" : `${flashAlert.amavasya.diffDays} दिन बाद है।`}
                    </p>
                    <div className="flex items-center justify-center gap-2 text-[8px] bg-white/10 px-3 py-1 rounded-xl border border-white/10 whitespace-nowrap">
                      <p className="opacity-90">
                        <span className="text-yellow-100 font-bold">प्रारम्भ:</span> {flashAlert.amavasya.start}
                      </p>
                      <div className="w-px h-2.5 bg-white/20" />
                      <p className="opacity-90">
                        <span className="text-yellow-100 font-bold">समाप्त:</span> {flashAlert.amavasya.end}
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
            
            <motion.div 
              initial={{ width: "100%" }} 
              animate={{ width: "0%" }} 
              transition={{ duration: 15, ease: "linear" }}
              className="absolute bottom-0 left-0 h-1.5 bg-gradient-to-r from-yellow-200 to-yellow-500 rounded-b-[2rem]"
            />
          </motion.div>
        )}

        {currentBanner === "badhai" && greetings.length > 0 && (
          <motion.div
            key={`badhai-${greetingIndex}`}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.5 }}
            className="absolute inset-0 p-3 sm:p-4 bg-gradient-to-br from-accent to-accent-dark rounded-[2rem] text-white shadow-[0_8px_30px_rgba(230,138,0,0.2)] flex items-center overflow-hidden border border-white/10"
          >
            <div className="absolute -right-4 -top-4 opacity-10"><Users className="w-24 h-24" /></div>
            <div className="absolute -left-6 -bottom-6 opacity-5 rotate-12"><Flame className="w-32 h-32" /></div>
            
            {/* Decorative Sparkles */}
            <div className="absolute top-2 right-10 text-yellow-200/40 animate-sparkle" style={{ animationDelay: '0.2s' }}><Sun className="w-3 h-3" /></div>
            <div className="absolute bottom-4 left-1/2 text-yellow-200/30 animate-sparkle" style={{ animationDelay: '0.8s' }}><Sun className="w-2 h-2" /></div>
            <div className="absolute top-10 left-4 text-yellow-200/20 animate-sparkle" style={{ animationDelay: '1.5s' }}><Sun className="w-4 h-4" /></div>
            
            <div className="relative z-10 flex gap-3 sm:gap-4 w-full h-full items-center">
              <div className="shrink-0 w-[24vw] h-[24vw] max-w-[95px] max-h-[95px] min-w-[75px] min-h-[75px] relative ml-1">
                <div className="absolute inset-0 bg-white/30 rounded-2xl rotate-3 scale-105 blur-[1px]"></div>
                <div className="absolute inset-0 bg-accent-dark/20 rounded-2xl -rotate-2 scale-105"></div>
                <img 
                  src={(greetings[greetingIndex] || greetings[0]).imageUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent((greetings[greetingIndex] || greetings[0]).sender || 'User')}`} 
                  alt="Profile" 
                  className="w-full h-full object-cover object-[center_top] rounded-2xl border-2 border-white shadow-xl bg-white/20 relative z-10" 
                  referrerPolicy="no-referrer" 
                  onError={(e) => { 
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = "/logo.png"; 
                  }}
                />
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-70 z-20"></div>
                <div className="absolute -bottom-1 -right-1 bg-yellow-400 p-1 rounded-full shadow-lg z-30 border border-white">
                  <CheckCircle className="w-3 h-3 text-accent-dark" />
                </div>
              </div>
              
              <div className="flex-1 flex flex-col justify-center items-start text-left h-full py-1 pr-1 sm:pr-3 overflow-hidden">
                <div className="flex items-center gap-2 w-full pt-1 mb-1">
                  <h3 className="text-[11px] sm:text-[12px] font-bold italic font-serif leading-normal drop-shadow-md text-yellow-200 truncate w-full pt-0.5">
                    {(greetings[greetingIndex] || greetings[0]).sender || "बधाई संदेश"}
                  </h3>
                </div>
                <div className="w-full">
                  <p className="text-[10px] sm:text-[11px] text-white drop-shadow-sm font-medium italic font-serif leading-normal line-clamp-4 break-words w-full">
                    {(greetings[greetingIndex] || greetings[0]).text}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {currentBanner === "thought" && (
          <motion.div
            key="thought"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 p-4 bg-gradient-to-br from-accent to-accent-dark text-white rounded-[2rem] shadow-[0_8px_30px_rgba(230,138,0,0.2)] flex flex-col justify-center overflow-hidden border border-white/10"
          >
            <div className="absolute -right-4 -top-4 opacity-10">
              <Sun className="w-24 h-24" />
            </div>
            <div className="relative z-10 h-full flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-1 opacity-90">
                <Quote className="w-4 h-4" />
                <h3 className="text-[10px] font-bold tracking-wider uppercase">
                  आज का सुविचार
                </h3>
              </div>
              <p className="text-sm md:text-base font-medium leading-snug line-clamp-2 break-words">
                "{typeof dailyThought === 'string' ? dailyThought : dailyThought?.text || ""}"
              </p>
              <p className="text-[10px] opacity-80 text-right font-semibold mt-1">
                - {dailyThought?.author || "गुरु जम्भेश्वर"}
              </p>
            </div>
          </motion.div>
        )}

        {currentBanner === "notice" && activeNotices.length > 0 && (
          <motion.div
            key={`notice-${noticeIndex}`}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.5 }}
            className="absolute inset-0 p-4 bg-gradient-to-br from-accent to-accent-dark text-white rounded-[2rem] shadow-[0_8px_30px_rgba(230,138,0,0.2)] flex flex-col justify-center overflow-hidden border border-white/10"
          >
            <div className="absolute -right-4 -top-4 opacity-10 pointer-events-none">
              <Bell className="w-32 h-32 animate-bell-swing" />
            </div>
            
            <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-red-500/90 text-yellow-200 drop-shadow-md text-[10px] font-bold px-3 py-0.5 rounded-b-lg shadow-md z-20 flex items-center gap-1 border border-t-0 border-white/20">
              <Bell className="w-3 h-3 animate-pulse" /> आवश्यक सूचना / अपील
            </div>
            
            <div className="relative z-10 flex flex-col justify-center items-center h-full w-full pt-3">
              <div className="flex flex-col items-center justify-center text-center">
                <p className="text-[13px] sm:text-[14px] font-bold leading-tight drop-shadow-md mb-1.5 text-yellow-200">
                  {activeNotices[noticeIndex]?.title || "सूचना"}
                </p>
                <p className="text-[10px] sm:text-[11px] opacity-90 font-medium leading-normal line-clamp-3 break-words px-2 py-0.5">
                  {activeNotices[noticeIndex]?.text || ""}
                </p>
              </div>
            </div>

            <div className="absolute bottom-2 right-6 z-30">
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PremiumBanner;
