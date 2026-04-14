import { ChevronLeft } from "lucide-react";

function PremiumHeader({ title, onBack, icon: Icon, noGlobalHeader = false }: { title: string; onBack: () => void; icon?: any; noGlobalHeader?: boolean }) {
  return (
    <div className={`sticky ${noGlobalHeader ? "top-0 pt-safe" : "top-[calc(50px+env(safe-area-inset-top))]"} z-20 bg-gradient-to-r from-accent to-accent-dark text-white rounded-b-[2rem] shadow-lg mb-4 -mt-[1px]`}>
      <div className="relative flex items-center justify-center p-3 min-h-[64px]">
        <button
          onClick={onBack}
          className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-white/20 active:bg-white/30 active:scale-90 transition-all touch-manipulation shrink-0"
        >
          <ChevronLeft className="w-7 h-7" />
        </button>
        <h1 className="text-xl sm:text-2xl font-bold font-heading text-center truncate px-14">
          || {title} ||
        </h1>
        {Icon ? <Icon className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 opacity-80 shrink-0" /> : <div className="absolute right-4 w-8 shrink-0" />}
      </div>
    </div>
  );
}

export default PremiumHeader;
