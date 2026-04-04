import { useState, useEffect } from "react";
import { ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

function AdBanner({ text, link }: { text: string, link?: string }) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (!text) return;
    const interval = setInterval(() => {
      setIsVisible(prev => !prev);
    }, 30000);
    return () => clearInterval(interval);
  }, [text]);

  if (!text) return null;

  const content = (
    <>
      <span className="bg-ink/10 text-ink px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider">
        AD
      </span>
      <span className="text-xs font-semibold text-ink-light truncate">
        {text}
      </span>
      {link && <ChevronRight className="w-4 h-4 text-ink-light/50 shrink-0" />}
    </>
  );

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-white/90 backdrop-blur-md border-t border-ink/10 p-2 text-center flex items-center justify-center gap-3 shadow-[0_-4px_20px_rgba(0,0,0,0.04)] overflow-hidden"
        >
          {link ? (
            <a href={link} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-3 w-full hover:opacity-80 transition-opacity">
              {content}
            </a>
          ) : (
            <div className="flex items-center justify-center gap-3 w-full">
              {content}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default AdBanner;
