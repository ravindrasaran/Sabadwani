import React from "react";

function NavItem({
  icon,
  label,
  isActive,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center w-[65px] h-12 rounded-2xl transition-all duration-300 touch-manipulation ${isActive ? "text-accent-dark scale-110" : "text-ink-light hover:bg-ink/5"}`}
    >
      <div
        className={`mb-0.5 transition-transform duration-300 ${isActive ? "-translate-y-0.5" : ""}`}
      >
        {icon}
      </div>
      <span
        className={`text-[10px] font-bold leading-none transition-opacity duration-300 ${isActive ? "opacity-100" : "opacity-70"}`}
      >
        {label}
      </span>
      {isActive && (
        <div className="absolute bottom-1 w-1 h-1 bg-accent-dark rounded-full"></div>
      )}
    </button>
  );
}

export default NavItem;
