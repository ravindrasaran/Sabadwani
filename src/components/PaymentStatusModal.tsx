import { HeartHandshake, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PaymentStatusModalProps {
  status: 'pending' | 'success' | 'cancelled' | null;
  onStatusChange: (status: 'success' | 'cancelled' | null) => void;
}

export default function PaymentStatusModal({ status, onStatusChange }: PaymentStatusModalProps) {
  if (!status) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-ink/5 relative overflow-hidden"
        >
          {status === 'pending' && (
            <div className="text-center">
              <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <HeartHandshake className="w-8 h-8 text-accent" />
              </div>
              <h3 className="text-xl font-bold text-ink mb-2">क्या आपका सहयोग सफल रहा?</h3>
              <p className="text-sm text-ink-light mb-6">
                कृपया पुष्टि करें कि आपका पेमेंट सफलतापूर्वक पूरा हो गया है।
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => onStatusChange('success')}
                  className="w-full bg-accent text-white py-3.5 rounded-xl font-bold hover:bg-accent-dark transition-colors shadow-md shadow-accent/20"
                >
                  हाँ, सफल रहा
                </button>
                <button
                  onClick={() => onStatusChange('cancelled')}
                  className="w-full bg-ink/5 text-ink py-3.5 rounded-xl font-bold hover:bg-ink/10 transition-colors"
                >
                  नहीं, किसी कारणवश नहीं हो पाया
                </button>
              </div>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center py-4">
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", bounce: 0.5 }}
                className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </motion.div>
              <h3 className="text-2xl font-bold text-ink mb-2">सहयोग के लिए आपका बहुत-बहुत धन्यवाद! 🙏</h3>
              <p className="text-sm text-ink-light">
                आपका यह योगदान ऐप को बेहतर बनाने में मदद करेगा।
              </p>
            </div>
          )}

          {status === 'cancelled' && (
            <div className="text-center py-4">
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", bounce: 0.5 }}
                className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <HeartHandshake className="w-10 h-10 text-orange-500" />
              </motion.div>
              <h3 className="text-xl font-bold text-ink mb-2">सहयोग के प्रयास के लिए आपका बहुत-बहुत धन्यवाद! 🙏</h3>
              <p className="text-sm text-ink-light">
                कोई बात नहीं, आप भविष्य में कभी भी सहयोग कर सकते हैं।
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
