import { motion } from "motion/react";
import { HeartHandshake } from "lucide-react";
import PremiumHeader from "./PremiumHeader";
import { Screen } from "../types";

interface DonateScreenProps {
  navigateTo: (screen: Screen) => void;
  settings: {
    qrCodeUrl?: string;
    upiId: string;
  };
  showToast: (msg: string) => void;
}

export default function DonateScreen({ navigateTo, settings, showToast }: DonateScreenProps) {
  return (
    <motion.div
      key="donate"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pb-32"
    >
      <PremiumHeader title="विशेष सहयोग" onBack={() => navigateTo('home')} icon={HeartHandshake} />
      
      <div className="px-4 pt-2 text-center">
        <p className="text-sm mb-6 text-ink-light px-4 leading-relaxed">
          इस निःशुल्क और विज्ञापन-मुक्त ऐप को सुचारू रूप से चलाने के लिए आपके सहयोग की आवश्यकता है।
        </p>

        <div className="bg-white/90 p-5 rounded-[2.5rem] shadow-xl border border-ink/10 flex flex-col items-center max-w-sm mx-auto">
          <h3 className="text-lg font-bold mb-4 text-ink">
            UPI द्वारा सहयोग करें
          </h3>

          {/* QR Code Section */}
          <div className="bg-white p-3 rounded-2xl shadow-sm border border-ink/10 mb-4 relative group">
            <div className="absolute inset-0 bg-accent/5 rounded-2xl transform scale-105 -z-10"></div>
            <img
              src={settings.qrCodeUrl || "/logo.png"}
              alt="UPI QR Code"
              className="w-32 h-32 object-contain"
              referrerPolicy="no-referrer"
              onError={(e) => { 
                e.currentTarget.onerror = null;
                e.currentTarget.src = "/logo.png"; 
              }}
            />
          </div>

          <div className="w-full relative mb-4 mt-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-ink/10"></div>
            </div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-bold">
              <span className="px-3 bg-white text-ink-light/60">
                UPI ID कॉपी करें
              </span>
            </div>
          </div>

          <p className="text-lg font-mono bg-paper p-3 rounded-xl border border-ink/10 mb-4 w-full text-center font-bold tracking-tight text-ink-light truncate">
            {settings.upiId}
          </p>
          <button
            onClick={() => {
              navigator.clipboard.writeText(settings.upiId);
              showToast("UPI ID कॉपी हो गई है!");
            }}
            className="bg-gradient-to-r from-accent to-accent-dark text-white px-8 py-3 rounded-2xl font-bold shadow-lg w-full hover:shadow-xl active:scale-[0.98] transition-all text-sm"
          >
            UPI ID कॉपी करें
          </button>
        </div>
      </div>
    </motion.div>
  );
}
