import { ChevronLeft } from "lucide-react";

function PremiumHeader({ title, onBack, icon: Icon }: { title: string; onBack: () => void; icon?: any }) {
  return (
    <div className="sticky top-[calc(50px+env(safe-area-inset-top))] z-20 bg-gradient-to-r from-accent to-accent-dark text-white p-3 rounded-b-[2rem] shadow-lg flex items-center justify-center relative mb-4 -mt-[1px]">
      <button
        onClick={onBack}
        className="absolute left-2 p-3 rounded-full hover:bg-white/20 active:bg-white/30 active:scale-90 transition-all touch-manipulation shrink-0"
      >
        <ChevronLeft className="w-7 h-7" />
      </button>
      <h1 className="text-xl sm:text-2xl font-bold font-heading text-center truncate px-14">
        || {title} ||
      </h1>
      {Icon ? <Icon className="absolute right-4 w-8 h-8 opacity-80 shrink-0" /> : <div className="absolute right-4 w-8 shrink-0" />}
    </div>
  );
}

export default PremiumHeader;
