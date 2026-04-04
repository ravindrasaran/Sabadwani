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
      className="flex items-center gap-4 p-4 mx-2 my-1.5 bg-white/60 rounded-2xl border border-ink/5 hover:bg-white/90 transition-all shadow-sm text-left group"
    >
      {iconType === "play" ? (
        <div className="bg-accent/10 p-2.5 rounded-full group-hover:bg-accent/20 transition-colors shrink-0">
          <Icon className="w-5 h-5 text-accent-dark ml-0.5" />
        </div>
      ) : Icon ? (
        <Icon className="w-6 h-6 text-ink-light shrink-0" />
      ) : (
        <BookOpenText className="w-6 h-6 text-ink-light shrink-0" />
      )}
      <span className="text-xl font-semibold leading-tight flex-1 text-ink">
        {title}
      </span>
      <ChevronRight className="w-5 h-5 text-ink-light/40 group-hover:text-ink-light transition-colors shrink-0" />
    </button>
  );
});

export default ShabadCard;
