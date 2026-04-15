import { useEffect } from "react";
import { motion } from "motion/react";
import { ChevronLeft, ChevronRight, CalendarDays, Sun, MapPin, MapPinOff, Loader2, Book } from "lucide-react";
import PremiumHeader from "./PremiumHeader";
import { vibrate } from "../lib/utils";

// --- AmavasyaScreen ---
export function AmavasyaScreen({ amavasyaList, selectedYear, setSelectedYear, handleBack }: any) {
  useEffect(() => {
    const today = new Date();
    const currentYear = today.getFullYear();
    if (selectedYear === currentYear) {
      const currentMonthIdx = today.getMonth();
      
      // Find the card for the current month and scroll to it
      const timer = setTimeout(() => {
        const cards = document.querySelectorAll('.amavasya-card');
        const targetIdx = amavasyaList.findIndex((a: any) => a.startDate && a.startDate.getMonth() === currentMonthIdx);
        if (targetIdx !== -1 && cards[targetIdx]) {
          cards[targetIdx].scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [selectedYear, amavasyaList]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="pb-32 bg-paper min-h-screen"
    >
      <PremiumHeader title="अमावस्या दर्शन" onBack={handleBack} icon={CalendarDays} />

      <div className="px-4 pt-2">
        <div className="flex items-center justify-between bg-gradient-to-r from-accent/5 via-accent/10 to-accent/5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-accent/20 backdrop-blur-md rounded-full py-1.5 px-4 mb-6 max-w-[240px] mx-auto">
          <button
            onClick={() => { vibrate(10); setSelectedYear((y: number) => y - 1); }}
            className="p-2.5 hover:bg-accent/20 active:scale-90 text-accent-dark rounded-full transition-all touch-manipulation"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-xl font-bold text-accent-dark tracking-wide font-heading">
            {selectedYear}
          </span>
          <button
            onClick={() => { vibrate(10); setSelectedYear((y: number) => y + 1); }}
            className="p-2.5 hover:bg-accent/20 active:scale-90 text-accent-dark rounded-full transition-all touch-manipulation"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6 max-w-2xl mx-auto">
        {amavasyaList.map((item: any) => (
          <div
            key={item.start}
            className="amavasya-card border border-accent/20 rounded-[2rem] bg-white/80 shadow-lg relative overflow-hidden group hover:shadow-xl transition-all backdrop-blur-sm"
          >
            {/* Decorative background mandala/pattern */}
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-accent/10 rounded-full blur-3xl group-hover:bg-accent/20 transition-all"></div>

            {/* Premium Header for Card */}
            <div className="p-5 flex items-center justify-between border-b border-ink/5 relative z-10">
              <div>
                <h3 className="text-3xl font-heading text-accent-dark mb-0.5 drop-shadow-sm">
                  {item.hindiMonth}
                </h3>
                <p className="text-[10px] font-bold text-ink/70 tracking-wide uppercase">
                  {item.gregorianMonth} • {item.sub}
                </p>
              </div>
              {/* Jambho Ji Photo in Header */}
              <div className="shrink-0 ml-4 relative">
                <div className="absolute inset-0 bg-accent rounded-full blur-md opacity-40 animate-pulse"></div>
                <img
                  src="/logo.png"
                  alt="Jambho Ji"
                  className="w-12 h-12 rounded-full border-2 border-white ring-4 ring-accent/30 shadow-lg object-cover relative z-10"
                  referrerPolicy="no-referrer"
                  onError={(e) => { 
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = "/logo.png"; 
                  }}
                />
              </div>
            </div>

            <div className="p-5 bg-gradient-to-b from-transparent to-paper-light/50 relative z-10">
              <div className="flex flex-col gap-3">
                <div className="flex items-start gap-3">
                  <div className="mt-1 bg-green-100 p-1.5 rounded-full shadow-inner">
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-ink/50 uppercase tracking-wider mb-0.5">
                      प्रारम्भ
                    </p>
                    <p className="text-sm text-ink font-medium">{item.start}</p>
                  </div>
                </div>

                <div className="w-px h-4 bg-ink/10 ml-4 -my-1"></div>

                <div className="flex items-start gap-3">
                  <div className="mt-1 bg-red-100 p-1.5 rounded-full shadow-inner">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]"></div>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-ink/50 uppercase tracking-wider mb-0.5">
                      समाप्त
                    </p>
                    <p className="text-sm text-ink font-medium">{item.end}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      </div>
    </motion.div>
  );
}

// --- ChoghadiyaScreen ---
export function ChoghadiyaScreen({ 
  choghadiyaDate, setChoghadiyaDate, 
  choghadiyaLocation, setChoghadiyaLocation, 
  handleGetLocation, calculateChoghadiya, 
  choghadiyaLoading, choghadiyaError, 
  choghadiyaSlots, handleBack 
}: any) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pb-32 bg-paper min-h-screen"
    >
      <PremiumHeader title="चौघड़िया मुहूर्त" onBack={handleBack} icon={Sun} />

      <div className="px-4">
        <div className="bg-white/90 p-6 rounded-3xl shadow-sm border border-ink/10 mb-6">
        <div className="space-y-4 mb-6">
          <div>
            <label className="block font-bold text-sm mb-1">
              तिथि (Date)
            </label>
            <input
              type="date"
              value={choghadiyaDate}
              onChange={(e) => setChoghadiyaDate(e.target.value)}
              className="w-full p-3 rounded-xl border border-ink/20 bg-white focus:border-accent outline-none font-medium"
            />
          </div>
          <div>
            <label className="block font-bold text-sm mb-1">
              स्थान (Location)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={choghadiyaLocation}
                onChange={(e) => setChoghadiyaLocation(e.target.value)}
                placeholder="शहर का नाम दर्ज करें..."
                className="flex-1 p-3 rounded-xl border border-ink/20 bg-white focus:border-accent outline-none font-medium"
              />
              <button
                onClick={handleGetLocation}
                className="p-3 bg-accent/10 text-accent-dark rounded-xl hover:bg-accent/20 transition-colors"
                title="मेरी वर्तमान लोकेशन"
              >
                <MapPin className="w-5 h-5" />
              </button>
            </div>
          </div>
          <button
            onClick={() => calculateChoghadiya()}
            disabled={choghadiyaLoading}
            className="w-full p-3 bg-accent text-white font-bold rounded-xl hover:bg-accent-dark transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            {choghadiyaLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Sun className="w-5 h-5" />
            )}
            मुहूर्त निकालें
          </button>
        </div>

        {choghadiyaError && (
          <motion.div 
            initial={{ opacity: 0, y: -10, scale: 0.95 }} 
            animate={{ opacity: 1, y: 0, scale: 1 }} 
            className="mb-6 p-4 sm:p-5 bg-gradient-to-br from-red-50 to-red-100/50 text-red-800 rounded-[1.25rem] text-sm flex flex-col sm:flex-row items-center gap-3 sm:gap-4 justify-center text-center sm:text-left border border-red-200/60 shadow-[0_4px_15px_-5px_rgba(239,68,68,0.15)]"
          >
            <div className="bg-red-100/80 p-2.5 rounded-full shrink-0 shadow-sm">
              <MapPinOff className="w-6 h-6 text-red-600" />
            </div>
            <div className="flex-1">
              <span className="text-red-800 font-medium leading-snug">{choghadiyaError}</span>
            </div>
          </motion.div>
        )}

        {!choghadiyaLoading &&
          !choghadiyaError &&
          choghadiyaSlots.day.length > 0 && (
            <div className="space-y-6">
              <div>
                <h3 className="font-bold text-lg text-accent-dark mb-3 flex items-center gap-2">
                  <Sun className="w-5 h-5" /> दिन का चौघड़िया
                </h3>
                <div className="grid grid-cols-1 gap-2">
                  {choghadiyaSlots.day.map((slot: any, idx: number) => {
                    const now = new Date();
                    const isCurrent = now >= slot.startTime && now < slot.endTime;
                    return (
                    <div
                      key={`day-${slot.name}-${idx}`}
                      id={isCurrent ? "current-choghadiya-slot" : undefined}
                      className={`flex justify-between p-3 rounded-xl border ${isCurrent ? "ring-2 ring-accent shadow-md scale-[1.02] transition-transform" : ""} ${slot.type === "good" ? "bg-green-50 border-green-200 text-green-800" : slot.type === "bad" ? "bg-red-50 border-red-200 text-red-800" : "bg-blue-50 border-blue-200 text-blue-800"}`}
                    >
                      <div className="flex flex-col">
                        <span className="font-bold">{slot.name}</span>
                        {isCurrent && <span className="text-xs font-bold text-accent">अभी चल रहा है</span>}
                      </div>
                      <span className="text-sm font-medium flex items-center">
                        {slot.time}
                      </span>
                    </div>
                  )})}
                </div>
              </div>

              <div>
                <h3 className="font-bold text-lg text-ink mb-3 flex items-center gap-2">
                  <Book className="w-5 h-5" /> रात का चौघड़िया
                </h3>
                <div className="grid grid-cols-1 gap-2">
                  {choghadiyaSlots.night.map((slot: any, idx: number) => {
                    const now = new Date();
                    const isCurrent = now >= slot.startTime && now < slot.endTime;
                    return (
                    <div
                      key={`night-${slot.name}-${idx}`}
                      id={isCurrent ? "current-choghadiya-slot" : undefined}
                      className={`flex justify-between p-3 rounded-xl border ${isCurrent ? "ring-2 ring-accent shadow-md scale-[1.02] transition-transform" : ""} ${slot.type === "good" ? "bg-green-50 border-green-200 text-green-800" : slot.type === "bad" ? "bg-red-50 border-red-200 text-red-800" : "bg-blue-50 border-blue-200 text-blue-800"}`}
                    >
                      <div className="flex flex-col">
                        <span className="font-bold">{slot.name}</span>
                        {isCurrent && <span className="text-xs font-bold text-accent">अभी चल रहा है</span>}
                      </div>
                      <span className="text-sm font-medium flex items-center">
                        {slot.time}
                      </span>
                    </div>
                  )})}
                </div>
              </div>
              <p className="text-xs text-ink-light mt-4 italic text-center">
                नोट: यह समय {choghadiyaLocation} के सटीक सूर्योदय/सूर्यास्त पर आधारित है।
                <br />
                गुरु जम्भेश्वर भगवान ने 365 दिन के हर क्षण को ही अच्छा माना है, उन्होंने इस प्रकार के आडंबरों से बिश्नोई समाज को मुक्त रखा है फिर भी आज के समय की मांग के लिए यहां दिए गए हैं।
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// --- BichhudaScreen ---
export function BichhudaScreen({ 
  bichhudaMonth, setBichhudaMonth, 
  bichhudaYear, setBichhudaYear, 
  bichhudaList, handleBack 
}: any) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pb-32 bg-paper min-h-screen"
    >
      <PremiumHeader title="बिछुड़ा (विदर)" onBack={handleBack} icon={Book} />

      <div className="px-4 pt-4">
        <div className="bg-white/90 p-6 rounded-3xl shadow-sm border border-ink/10 mb-6">
        <div className="flex items-center justify-between mb-6 gap-2">
          <h2 className="font-bold text-lg flex-1">बिछुड़ा तिथियां</h2>
          <select
            value={bichhudaMonth}
            onChange={(e) => setBichhudaMonth(Number(e.target.value))}
            className="p-2 rounded-xl border border-ink/20 bg-white font-bold text-accent-dark text-sm"
          >
            {Array.from({ length: 12 }, (_, i) =>
              new Date(2000, i, 1).toLocaleDateString("hi-IN", {
                month: "long",
              }),
            ).map((m, i) => (
              <option key={`month-${i}`} value={i}>
                {m}
              </option>
            ))}
          </select>
          <select
            value={bichhudaYear}
            onChange={(e) => setBichhudaYear(Number(e.target.value))}
            className="p-2 rounded-xl border border-ink/20 bg-white font-bold text-accent-dark text-sm"
          >
            {Array.from({ length: 101 }, (_, i) => new Date().getFullYear() - 50 + i).map((y) => (
              <option key={`year-${y}`} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-3 mb-8">
          {bichhudaList
            .filter((item: any) => item.rawStart.getMonth() === bichhudaMonth)
            .map((item: any) => (
              <div
                key={item.start}
                className={`bg-paper p-4 rounded-2xl border flex flex-col relative overflow-hidden transition-all ${
                  item.isRunning 
                    ? "border-accent/50 ring-2 ring-accent/20 shadow-sm" 
                    : item.isUpcoming 
                      ? "border-accent/50 ring-1 ring-accent/20" 
                      : "border-ink/20"
                }`}
              >
                {item.isRunning && (
                  <div className="absolute top-0 right-0 bg-accent text-white text-[10px] font-bold px-2 py-0.5 rounded-bl-lg flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                    चल रहा है
                  </div>
                )}
                {item.isUpcoming && (
                  <div className="absolute top-0 right-0 bg-accent text-white text-[10px] font-bold px-2 py-0.5 rounded-bl-lg">
                    आगामी
                  </div>
                )}
                <span className="font-bold text-accent-dark mb-2 text-lg">
                  {item.monthName} {bichhudaYear}
                </span>
                <div className="flex flex-col gap-1 text-sm text-ink-light">
                  <span className="flex justify-between border-b border-ink/5 pb-1">
                    <span>प्रारंभ:</span>{" "}
                    <span className="font-semibold text-ink">
                      {item.start}
                    </span>
                  </span>
                  <span className="flex justify-between pt-1">
                    <span>समाप्त:</span>{" "}
                    <span className="font-semibold text-ink">
                      {item.end}
                    </span>
                  </span>
                </div>
              </div>
            ))}
        </div>

        <div className="space-y-4">
          <div className="bg-red-50 p-4 rounded-2xl border border-red-100">
            <h3 className="font-bold text-lg mb-2 text-red-700">
              वर्जित कार्य
            </h3>
            <ul className="list-disc list-inside text-sm space-y-1 text-red-600">
              <li>लकड़ी या ईंधान इकट्ठा करना</li>
              <li>चारपाई या पलंग बुनवाना</li>
              <li>घर की छत ढलवाना</li>
              <li>दक्षिण दिशा की यात्रा करना</li>
            </ul>
          </div>
          <p className="text-xs text-ink-light mt-4 italic text-center">
            नोट: गुरु जम्भेश्वर भगवान ने 365 दिन के हर क्षण को ही अच्छा माना है, उन्होंने इस प्रकार के आडंबरों से बिश्नोई समाज को मुक्त रखा है फिर भी आज के समय की मांग के लिए यहां दिए गए हैं।
          </p>
        </div>
      </div>
      </div>
    </motion.div>
  );
}
