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
      className="flex flex-col items-center justify-center p-2.5 bg-white/80 backdrop-blur-sm rounded-2xl border border-ink/5 hover:bg-white hover:shadow-md transition-all shadow-sm group"
    >
      <div className="bg-accent/10 p-2 rounded-xl mb-1.5 group-hover:bg-accent/20 transition-colors group-hover:scale-110 duration-300">
        <Icon className="w-5 h-5 text-accent-dark" />
      </div>
      <span className="text-xs font-bold text-ink text-center leading-tight">
        {titleLine1}
        <br />
        {titleLine2}
      </span>
    </button>
  );
};

export default CategoryCard;
