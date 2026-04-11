import { motion } from "motion/react";
import { Info } from "lucide-react";
import PremiumHeader from "./PremiumHeader";
import { Screen } from "../types";

interface AboutScreenProps {
  navigateTo: (screen: Screen) => void;
  settings: {
    logoUrl?: string;
  };
}

export default function AboutScreen({ navigateTo, settings }: AboutScreenProps) {
  return (
    <motion.div
      key="about"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pb-32"
    >
      <PremiumHeader title="हमारे बारे में" onBack={() => navigateTo('home')} icon={Info} />
      
      <div className="px-6 pt-2 text-center">
        <div className="relative inline-block mb-4">
          <img
            src={settings.logoUrl || "/logo.png"}
            alt="Logo"
            className="w-24 h-24 rounded-full shadow-lg border-4 border-white object-cover"
            referrerPolicy="no-referrer"
            onError={(e) => { 
              e.currentTarget.onerror = null;
              e.currentTarget.src = "/logo.png"; 
            }}
          />
        </div>
        <div className="bg-white/80 p-6 rounded-3xl shadow-md border border-ink/10 text-left space-y-4 text-lg">
          <p>
            <b>सबदवाणी</b> ऐप बिश्नोई समाज और अन्य श्रद्धालुओं के लिए एक
            निःशुल्क, सामुदायिक पहल है।
          </p>
          <p>
            <b>कॉपीराइट अस्वीकरण (Disclaimer):</b> इस ऐप में संकलित
            सबदवाणी, भजन और आरती सार्वजनिक डोमेन (Public Domain) और भक्तों
            के स्वैच्छिक योगदान पर आधारित हैं। यह ऐप पूरी तरह से शैक्षिक और
            भक्ति (Devotional) उद्देश्यों के लिए बनाया गया है। इसका उद्देश्य
            किसी भी प्रकार का व्यावसायिक लाभ कमाना नहीं है।
          </p>
          <p>
            यदि आपको किसी सामग्री से संबंधित कोई आपत्ति है, तो कृपया हमसे
            संपर्क करें।
          </p>
        </div>
      </div>
    </motion.div>
  );
}
