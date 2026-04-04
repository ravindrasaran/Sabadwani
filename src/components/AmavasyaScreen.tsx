import { useEffect } from "react";
import { motion } from "motion/react";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { vibrate } from "../lib/utils";
import PremiumHeader from "./PremiumHeader";

function AmavasyaScreen({ amavasyaList, selectedYear, setSelectedYear, handleBack }: any) {
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
        <div className="flex items-center justify-between bg-white/90 shadow-md border border-ink/10 rounded-full py-1 px-6 mb-4 max-w-[280px] mx-auto gap-6">
          <button
            onClick={() => { vibrate(10); setSelectedYear((y: number) => y - 1); }}
            className="p-3 hover:bg-ink/10 rounded-full transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <span className="text-2xl font-bold text-accent-dark">
            {selectedYear}
          </span>
          <button
            onClick={() => { vibrate(10); setSelectedYear((y: number) => y + 1); }}
            className="p-3 hover:bg-ink/10 rounded-full transition-colors"
          >
            <ChevronRight className="w-6 h-6" />
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

export default AmavasyaScreen;
