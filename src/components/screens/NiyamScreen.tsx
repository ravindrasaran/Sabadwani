import { motion } from "motion/react";
import { ListOrdered } from "lucide-react";
import PremiumHeader from "../PremiumHeader";

export interface NiyamScreenProps {
  niyamList: string[];
  navigateTo: (screen: string) => void;
}

export default function NiyamScreen({ niyamList, navigateTo }: NiyamScreenProps) {
  return (
    <motion.div
      key="niyam"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3, ease: "circOut" }}
      style={{ willChange: "transform, opacity", transform: "translateZ(0)" }}
      className="pb-32 bg-paper min-h-screen"
    >
      <PremiumHeader title="२९ नियम" onBack={() => navigateTo('home')} icon={ListOrdered} />
      
      <div className="px-4 pt-6">
        <div className="bg-white/90 p-6 rounded-3xl shadow-sm border border-ink/10 mb-6 text-center">
          <p className="text-ink leading-relaxed font-medium">
            बिश्नोई समाज की स्थापना गुरु जम्भेश्वर भगवान ने इन्हीं 29 नियमों के आधार पर की थी। 
            "बीस और नौ बिश्नोई" - जो इन 29 नियमों का पालन करता है, वही बिश्नोई है।
          </p>
        </div>

        <div className="space-y-3">
          {niyamList.map((niyam, idx) => (
            <div key={`niyam-${idx}`} className="flex items-start gap-4 bg-white p-4 rounded-2xl shadow-sm border border-ink/5 hover:border-accent/30 transition-colors">
              <div className="w-8 h-8 shrink-0 rounded-full bg-accent/10 text-accent font-bold flex items-center justify-center text-sm">
                {idx + 1}
              </div>
              <p className="text-ink font-medium pt-1 leading-relaxed">{niyam}</p>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
