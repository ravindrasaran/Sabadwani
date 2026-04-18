import { motion } from "motion/react";
import { KeyRound, AlertCircle } from "lucide-react";
import PremiumHeader from "../PremiumHeader";
import { signInWithEmailAndPassword } from "firebase/auth";

export interface AdminLoginScreenProps {
  isAdminLoggingIn: boolean;
  adminLoginError: string;
  adminPasswordInput: string;
  auth: any;
  setIsAdminLoggingIn: (val: boolean) => void;
  setAdminLoginError: (val: string) => void;
  setAdminPasswordInput: (val: string) => void;
  setIsAdminAuthenticated: (val: boolean) => void;
  navigateTo: (screen: string) => void;
}

export default function AdminLoginScreen({
  isAdminLoggingIn,
  adminLoginError,
  adminPasswordInput,
  auth,
  setIsAdminLoggingIn,
  setAdminLoginError,
  setAdminPasswordInput,
  setIsAdminAuthenticated,
  navigateTo
}: AdminLoginScreenProps) {
  return (
    <motion.div
      key="admin_login"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex flex-col relative"
    >
      {/* Subtle background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-accent/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 -left-20 w-72 h-72 bg-accent-dark/5 rounded-full blur-3xl"></div>
      </div>

      <PremiumHeader title="Admin Access" onBack={() => navigateTo('home')} icon={KeyRound} noGlobalHeader={true} />
      
      <div className="flex-1 overflow-y-auto relative z-10">
        <div className="min-h-full flex flex-col items-center justify-center px-6 py-8">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-white/50 w-full max-w-sm text-center relative overflow-hidden shrink-0"
          >
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-accent to-accent-dark"></div>
          <div className="w-20 h-20 mx-auto bg-accent/10 rounded-full flex items-center justify-center mb-6">
            <KeyRound className="w-10 h-10 text-accent" />
          </div>
          <h2 className="text-2xl font-bold text-ink mb-2">Admin Login</h2>
          <p className="text-sm text-ink-light mb-8">
            कृपया व्यवस्थापक पासवर्ड दर्ज करें
          </p>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (isAdminLoggingIn) return;
            setAdminLoginError("");
            
            if (!adminPasswordInput) {
              setAdminLoginError("कृपया पासवर्ड दर्ज करें।");
              return;
            }

            setIsAdminLoggingIn(true);
            try {
              if (auth) {
                // Login with the specific admin email and user-provided password
                await signInWithEmailAndPassword(auth, "ravindrasaran@gmail.com", adminPasswordInput);
              }
              setIsAdminAuthenticated(true);
              setAdminPasswordInput("");
              navigateTo("admin");
            } catch (error: any) {
              if (error.code === 'auth/network-request-failed') {
                setAdminLoginError("इंटरनेट कनेक्शन उपलब्ध नहीं है। कृपया अपना नेटवर्क जांचें और पुनः प्रयास करें।");
              } else if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
                setAdminLoginError("गलत पासवर्ड! कृपया सही पासवर्ड दर्ज करें।");
              } else if (error.code === 'auth/user-not-found') {
                setAdminLoginError("एडमिन अकाउंट नहीं मिला। कृपया Firebase Console में ravindrasaran@gmail.com अकाउंट बनाएं।");
              } else if (error.code === 'auth/operation-not-allowed') {
                setAdminLoginError("Firebase Authentication में 'Email/Password' लॉगिन इनेबल नहीं है। कृपया इसे इनेबल करें।");
              } else {
                setAdminLoginError("लॉगिन में त्रुटि हुई: " + error.message);
              }
              setAdminPasswordInput("");
            } finally {
              setIsAdminLoggingIn(false);
            }
          }}
        >
          {adminLoginError && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="mb-4 p-4 bg-red-50 text-red-700 rounded-2xl text-sm flex items-center gap-3 justify-center text-center border border-red-100"
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{adminLoginError}</span>
            </motion.div>
          )}
          <input
            type="password"
            value={adminPasswordInput}
            onChange={(e) => setAdminPasswordInput(e.target.value)}
            placeholder="पासवर्ड"
            className="w-full p-4 rounded-xl border border-ink/20 bg-paper/50 text-center text-2xl tracking-widest mb-6 focus:border-accent outline-none transition-colors"
            autoFocus
          />
          <button
            type="submit"
            disabled={isAdminLoggingIn}
            className={`w-full bg-gradient-to-r from-accent to-accent-dark text-white font-bold py-3.5 rounded-xl shadow-lg hover:shadow-xl transition-all ${isAdminLoggingIn ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isAdminLoggingIn ? 'लॉगिन हो रहा है...' : 'लॉगिन करें'}
          </button>
        </form>
        <button
          onClick={() => navigateTo("home")}
          className="mt-6 text-ink-light text-sm underline hover:text-ink transition-colors"
        >
          वापस जाएं
        </button>
        </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
