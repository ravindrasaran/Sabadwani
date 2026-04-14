import { useState, useEffect } from "react";
import { Bell, Search, PlusCircle } from "lucide-react";
import { Screen } from "../types";

function Header({
  onNavigate,
  logoUrl,
  isAdminAuthenticated,
  unreadCount,
  onNotificationClick,
}: {
  onNavigate: (screen: Screen) => void;
  logoUrl: string;
  isAdminAuthenticated: boolean;
  unreadCount: number;
  onNotificationClick: () => void;
}) {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const [clickCount, setClickCount] = useState(0);

  const handleLogoClick = () => {
    if (clickCount === 0) {
      onNavigate("home");
    }
    setClickCount((prev) => prev + 1);
    if (clickCount + 1 >= 5) {
      if (isAdminAuthenticated) {
        onNavigate("admin");
      } else {
        onNavigate("admin_login");
      }
      setClickCount(0);
    }
  };

  useEffect(() => {
    if (clickCount > 0) {
      const timer = setTimeout(() => setClickCount(0), 2000);
      return () => clearTimeout(timer);
    }
  }, [clickCount]);

  return (
    <header className={`sticky top-0 z-40 bg-paper/95 backdrop-blur-md border-b border-ink/10 px-4 py-2 pt-safe flex items-center justify-between transition-shadow duration-300 ${isScrolled ? 'shadow-[0_4px_20px_rgba(0,0,0,0.08)]' : 'shadow-none'}`}>
      <div
        className="flex items-center gap-3 cursor-pointer"
        onClick={handleLogoClick}
      >
        <div className="relative">
          <img
            src={logoUrl || "/logo.png"}
            alt="App Logo"
            className="w-10 h-10 rounded-full shadow-md border-2 border-white object-cover"
            referrerPolicy="no-referrer"
            onError={(e) => { 
              e.currentTarget.onerror = null;
              e.currentTarget.src = "/logo.png"; 
            }}
          />
          <div className="absolute -bottom-1 -right-1 bg-green-500 w-3 h-3 rounded-full border-2 border-white"></div>
        </div>
        <h1 className="font-heading text-2xl text-ink tracking-wide mt-1">
          सबदवाणी
        </h1>
      </div>
      <div className="flex items-center gap-4 text-ink-light">
        <button
          onClick={() => onNavigate("search")}
          className="hover:text-ink transition-colors"
        >
          <Search className="w-6 h-6" />
        </button>
        <button
          onClick={onNotificationClick}
          className="hover:text-ink transition-colors relative"
        >
          <Bell className={`w-6 h-6 ${unreadCount > 0 ? "animate-[bell-swing_2s_infinite]" : ""}`} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold flex items-center justify-center rounded-full border-2 border-paper animate-pulse">
              {unreadCount}
            </span>
          )}
        </button>
        <button
          onClick={() => onNavigate("contribute")}
          className="hover:text-ink transition-colors relative"
        >
          <PlusCircle className="w-6 h-6" />
        </button>
      </div>
    </header>
  );
}

export default Header;
