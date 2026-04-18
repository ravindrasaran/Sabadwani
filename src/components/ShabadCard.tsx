import React from "react";
import { ChevronRight, BookOpenText } from "lucide-react";

interface ShabadCardProps {
  title: string;
  icon?: any;
  onClick: () => void;
  iconType?: "book" | "play";
}

const ShabadCard: React.FC<ShabadCardProps> = React.memo(({ title, icon: Icon, onClick, iconType = "book" }) => {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-4 py-3.5 px-5 mx-2 my-1.5 w-[calc(100%-1rem)] bg-white/90 backdrop-blur-sm rounded-[1.25rem] border border-accent/10 hover:border-accent/30 hover:bg-white active:scale-[0.98] active:bg-accent/5 transition-all shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_20px_-6px_rgba(0,0,0,0.1)] text-left group touch-manipulation relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-accent/0 via-accent/0 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      
      {iconType === "play" ? (
        <div className="bg-gradient-to-br from-accent/10 to-accent/20 p-2.5 rounded-full group-hover:scale-110 group-active:scale-95 transition-all shrink-0 shadow-sm border border-accent/10 relative z-10">
          <Icon className="w-4 h-4 text-accent-dark ml-0.5" />
        </div>
      ) : (
        <div className="bg-gradient-to-br from-ink/5 to-ink/10 p-2.5 rounded-[0.85rem] shrink-0 group-hover:scale-110 group-active:scale-95 transition-all shadow-sm border border-ink/5 relative z-10">
          {Icon ? <Icon className="w-4 h-4 text-ink-light" /> : <BookOpenText className="w-4 h-4 text-ink-light" />}
        </div>
      )}
      <span className="text-[17px] font-bold leading-snug flex-1 text-ink group-hover:text-accent-dark transition-colors relative z-10 tracking-tight">
        {title}
      </span>
      <ChevronRight className="w-5 h-5 text-ink/20 group-hover:text-accent group-hover:translate-x-0.5 transition-all shrink-0 relative z-10" />
    </button>
  );
});

export default ShabadCard;
