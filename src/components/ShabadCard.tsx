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
      className="flex items-center gap-3.5 py-3 px-4 mx-2 my-1 bg-white/80 rounded-2xl border border-ink/5 hover:bg-white active:scale-[0.98] active:bg-ink/5 transition-all shadow-sm text-left group touch-manipulation"
    >
      {iconType === "play" ? (
        <div className="bg-accent/10 p-2 rounded-full group-hover:bg-accent/20 group-active:bg-accent/30 transition-colors shrink-0">
          <Icon className="w-4 h-4 text-accent-dark ml-0.5" />
        </div>
      ) : (
        <div className="bg-ink/5 p-2 rounded-xl shrink-0 group-active:bg-ink/10 transition-colors">
          {Icon ? <Icon className="w-4 h-4 text-ink-light" /> : <BookOpenText className="w-4 h-4 text-ink-light" />}
        </div>
      )}
      <span className="text-base font-bold leading-tight flex-1 text-ink">
        {title}
      </span>
      <ChevronRight className="w-4 h-4 text-ink-light/40 group-hover:text-ink-light transition-colors shrink-0" />
    </button>
  );
});

export default ShabadCard;
