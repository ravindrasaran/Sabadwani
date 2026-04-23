import React from "react";
import { LucideIcon } from "lucide-react";

interface CategoryCardProps {
  onClick: () => void;
  icon: LucideIcon;
  titleLine1: string;
  titleLine2: string;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ onClick, icon: Icon, titleLine1, titleLine2 }) => {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center p-2 sm:p-3 md:p-4 bg-white/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl border border-ink/5 hover:bg-white hover:shadow-md active:scale-95 active:bg-white/90 transition-all duration-200 shadow-sm group aspect-square"
    >
      <div className="bg-accent/10 p-2 sm:p-2.5 md:p-3 rounded-xl sm:rounded-2xl mb-1 sm:mb-1.5 md:mb-2 group-hover:bg-accent/20 group-active:bg-accent/30 transition-all group-hover:scale-110 group-active:scale-95 duration-200">
        <Icon className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-accent-dark group-active:text-accent-darker" />
      </div>
      <span className="text-[10px] sm:text-xs md:text-sm font-bold text-ink text-center leading-tight">
        {titleLine1}
        {titleLine2 && <br />}
        {titleLine2}
      </span>
    </button>
  );
};

export default CategoryCard;
