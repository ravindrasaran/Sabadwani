import React from "react";
import { motion } from "motion/react";
import { Target, RotateCcw } from "lucide-react";
import PremiumHeader from "./PremiumHeader";

interface JaapMalaScreenProps {
  malaCount: number;
  malaLaps: number;
  onBack: () => void;
  onJap: () => void;
  onReset: () => void;
}

const JaapMalaScreen: React.FC<JaapMalaScreenProps> = ({
  malaCount,
  malaLaps,
  onBack,
  onJap,
  onReset,
}) => {
  return (
    <motion.div
      key="mala"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3, ease: "circOut" }}
      style={{ willChange: "transform, opacity", transform: "translateZ(0)" }}
      className="pb-32 min-h-screen flex flex-col bg-paper"
    >
      <PremiumHeader title="डिजिटल जाप माला" onBack={onBack} icon={Target} />
      
      <div className="flex-1 flex flex-col items-center justify-center relative px-4 w-full max-w-lg mx-auto">
        <div className="text-6xl sm:text-7xl md:text-8xl font-heading text-accent mb-4 drop-shadow-sm z-10 flex items-center justify-center w-32 h-32 sm:w-40 sm:h-40 bg-white/50 rounded-full shadow-inner border border-ink/10">{malaCount}</div>
        <div className="text-sm sm:text-base font-bold text-ink-light mb-10 bg-white/50 px-5 py-1.5 rounded-full border border-ink/10 z-10">
          माला पूर्ण: <span className="text-accent-dark">{malaLaps}</span>
        </div>
        
        <div className="relative flex items-center justify-center w-full max-w-[250px] sm:max-w-[300px] aspect-square mt-6 mb-10">
          {/* Decorative background rings */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
            <div className="w-full h-full rounded-full border-[10px] sm:border-[12px] border-ink"></div>
            <div className="absolute w-[115%] h-[115%] rounded-full border-[1.5px] sm:border-[2px] border-ink border-dashed"></div>
          </div>

          <button 
            onClick={onJap}
            className="relative w-full h-full rounded-full bg-gradient-to-br from-accent to-accent-dark text-white shadow-2xl flex items-center justify-center active:scale-95 transition-all border-[6px] sm:border-[8px] border-white/30 group z-10"
          >
            <div className="absolute inset-0 rounded-full bg-white/20 opacity-0 group-active:opacity-100 transition-opacity"></div>
            <span className="text-2xl sm:text-3xl md:text-4xl font-bold font-heading tracking-wider">जाप करें</span>
          </button>
        </div>
        
        <button 
          onClick={onReset}
          className="mt-12 flex items-center gap-2 text-ink-light hover:text-ink transition-colors bg-white/50 px-5 py-3 rounded-xl z-10 text-base font-bold"
        >
          <RotateCcw className="w-5 h-5" /> रीसेट करें
        </button>
      </div>
    </motion.div>
  );
};

export default JaapMalaScreen;
