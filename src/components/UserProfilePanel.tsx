import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, LogOut, ShieldCheck, ListMusic, LogIn, Phone, Lock, 
  User, Camera, Image, Check, ChevronLeft, RefreshCw, Mail
} from "lucide-react";
import { auth, db, storage } from "../firebase";
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithCredential,
  signOut,
  EmailAuthProvider,
  linkWithCredential,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
} from "firebase/auth";
import { Capacitor } from "@capacitor/core";
import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  limit
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Ripple } from "./Ripple";

// 8 Divine, elegant presets utilizing gradients with spiritual symbols
const PRESET_AVATARS = [
  { id: "peacock", symbol: "🦚", start: "#F59E0B", end: "#D97706", name: "मोरपंख" },
  { id: "lamp", symbol: "🪔", start: "#EA580C", end: "#C2410C", name: "दीपक" },
  { id: "tree", symbol: "🌱", start: "#16A34A", end: "#15803D", name: "खेजड़ी" },
  { id: "om", symbol: "🕉️", start: "#4F46E5", end: "#4338CA", name: "ॐ" },
  { id: "lotus", symbol: "🏵️", start: "#0D9488", end: "#0F766E", name: "कमल" },
  { id: "sparkles", symbol: "✨", start: "#9333EA", end: "#7E22CE", name: "तेज" },
  { id: "sunrise", symbol: "🌅", start: "#DC2626", end: "#B91C1C", name: "सूर्योदय" },
  { id: "prayer", symbol: "🙏", start: "#2563EB", end: "#1D4ED8", name: "नमन" },
];

const generatePresetDataUrl = (symbol: string, startColor: string, endColor: string) => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${startColor};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${endColor};stop-opacity:1" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="50" fill="url(#grad)" />
      <text x="50%" y="55%" font-size="50" font-family="system-ui, sans-serif" dominant-baseline="middle" text-anchor="middle">${symbol}</text>
    </svg>
  `.trim().replace(/\s+/g, ' ');
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

// Firebase requires a password of at least 6 characters, so we map the 4-digit MPIN into a safe 14-character virtual password
const getFirebasePasswordFromMpin = (mpin: string): string => {
  return `${mpin}_sabadwani`;
};

const cleanErrorMessage = (error: any, fallback: string): string => {
  if (!error) return fallback;
  const rawMsg = error.message || "";
  if (rawMsg.includes("Missing or insufficient permissions") || rawMsg.includes("permission-denied")) {
    return "यह कार्य करने की अनुमति नहीं है।";
  }
  // Sanitize Firebase branding and technical strings
  const cleaned = rawMsg
    .replace(/FirebaseError:/gi, "")
    .replace(/Firebase:/gi, "")
    .replace(/\(auth\/[^\)]+\)/gi, "")
    .replace(/auth\/[a-zA-Z0-9-]+/gi, "त्रुटि")
    .replace(/Firestore/gi, "सर्वर")
    .trim();
  
  return cleaned || fallback;
};

interface UserProfilePanelProps {
  showProfile: boolean;
  setShowProfile: (show: boolean) => void;
  currentUser: any;
  showToast: (msg: string) => void;
  myPendingPosts: any[];
  recentApprovedPosts: any[];
}

export default function UserProfilePanel({
  showProfile,
  setShowProfile,
  currentUser,
  showToast,
  myPendingPosts,
  recentApprovedPosts,
}: UserProfilePanelProps) {
  // Authentication Options / Views: 'login' | 'register'
  const [authTab, setAuthTab] = useState<"login" | "register">("login");

  // Input states for Phone Login / Reg
  const [loginMobile, setLoginMobile] = useState("");
  const [loginMpin, setLoginMpin] = useState("");
  const [registerName, setRegisterName] = useState("");
  const [registerMobile, setRegisterMobile] = useState("");
  const [registerMpin, setRegisterMpin] = useState("");

  // State flags
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Premium Onboarding state variables
  const [onboardPhone, setOnboardPhone] = useState("");
  const [onboardMpin, setOnboardMpin] = useState("");
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  const isRegisteredUser = currentUser && !currentUser.isAnonymous;
  const isGoogleUser = !!(currentUser && currentUser.email && 
    !currentUser.email.endsWith("@bishnoi.co.in") && 
    !currentUser.email.endsWith("@sabadwani.com"));

  const isOnboardingActive = !isLoadingProfile && !!(
    currentUser && 
    isGoogleUser && 
    (!profileData || !profileData.mobile)
  );



  // Load database Profile Document when currentUser updates
  useEffect(() => {
    if (currentUser) {
      setIsLoadingProfile(true);
      const fetchProfile = async () => {
        try {
          const userDocRef = doc(db, "userProfiles", currentUser.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const data = userDoc.data();
            setProfileData(data);
            
            // Auto-trigger onboarding modal for Google auth users with no mobile number
            const isGoogle = !!(currentUser.email && 
              !currentUser.email.endsWith("@bishnoi.co.in") && 
              !currentUser.email.endsWith("@sabadwani.com"));

            if (isGoogle && !data.mobile) {
              setShowProfile(true);
              setOnboardPhone("");
              setOnboardMpin("");
            }
          } else {
            setProfileData(null);
            
            const isGoogle = !!(currentUser.email && 
              !currentUser.email.endsWith("@bishnoi.co.in") && 
              !currentUser.email.endsWith("@sabadwani.com"));

            if (isGoogle) {
              setShowProfile(true);
              setOnboardPhone("");
              setOnboardMpin("");
            }
          }
        } catch (err) {
          console.error("Error fetching user profile doc:", err);
        } finally {
          setIsLoadingProfile(false);
        }
      };
      fetchProfile();
    } else {
      setProfileData(null);
      setIsLoadingProfile(false);
    }
  }, [currentUser, setShowProfile]);

  const handleGoogleLogin = async () => {
    if (!auth) {
      showToast("सर्वर सेवा शुरू नहीं हुई है।");
      return;
    }
    try {
      let user;

      if (Capacitor.isNativePlatform()) {
        const { GoogleAuth } = await import("@codetrix-studio/capacitor-google-auth");
        
        try {
          await GoogleAuth.initialize({
            clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || "269129763640-o5mtq5b1lb7pjn7u61ju4dber0g109u6.apps.googleusercontent.com",
            scopes: ["profile", "email"],
            grantOfflineAccess: true,
          });
        } catch (initErr) {
          console.warn("GoogleAuth dynamic initialization warning/bypass:", initErr);
        }

        const googleUser = await GoogleAuth.signIn();
        if (!googleUser || !googleUser.authentication?.idToken) {
          throw new Error("गूगल क्रेडेंशियल (idToken) प्राप्त नहीं हो सका।");
        }

        const credential = GoogleAuthProvider.credential(googleUser.authentication.idToken);
        const userCredential = await signInWithCredential(auth, credential);
        user = userCredential.user;
      } else {
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });
        const userCredential = await signInWithPopup(auth, provider);
        user = userCredential.user;
      }

      if (user) {
        const userRef = doc(db, "userProfiles", user.uid);
        const userDoc = await getDoc(userRef);
        
        const profilePayload: any = {
          uid: user.uid,
          displayName: user.displayName || "अज्ञात भक्त",
          photoURL: user.photoURL || "",
        };

        if (user.email) {
          profilePayload.email = user.email;
        }

        if (!userDoc.exists()) {
          profilePayload.createdAt = new Date().toISOString();
        }

        await setDoc(userRef, profilePayload, { merge: true });

        // Refresh state
        const updatedDoc = await getDoc(userRef);
        const hasMobile = updatedDoc.exists() && updatedDoc.data()?.mobile;
        if (updatedDoc.exists()) {
          setProfileData(updatedDoc.data());
        }

        if (hasMobile) {
          showToast("सफलतापूर्वक लॉग-इन किया गया!");
          setShowProfile(false);
        } else {
          showToast("गूगल लॉग-इन सफल! कृपया सुरक्षा हेतु अंतिम चरण पूरा करें।");
          setOnboardPhone("");
          setOnboardMpin("");
          setShowProfile(true);
        }
      }
    } catch (error: any) {
      console.error("Google Login Error:", error);
      if (error.code === "auth/popup-blocked") {
        showToast("पॉपअप ब्लॉक हो गया है, कृपया ब्राउज़र में पॉपअप अनुमति दें।");
      } else if (error.code === "auth/operation-not-allowed") {
        showToast("गूगल लॉग-इन अभी सक्रिय नहीं है।");
      } else if (error.code === "auth/unauthorized-domain" || (error.message && error.message.includes("unauthorized-domain"))) {
        showToast("यह डोमेन (Domain) आपके फ़ायरबेस प्रोजेक्ट में अधिकृत नहीं है। कृपया फ़ायरबेस कंसोल में जाकर इस डोमेन को Authorized Domains में जोड़ें।");
      } else {
        showToast("लॉग-इन करने में विफल: " + cleanErrorMessage(error, "अज्ञात त्रुटि"));
      }
    }
  };

  const handleLogout = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      showToast("सफलतापूर्वक लॉग-आउट किया गया।");
      setShowProfile(false);
    } catch (error: any) {
      showToast("लॉग-आउट करने में विफल: " + cleanErrorMessage(error, "अज्ञात त्रुटि"));
    }
  };

  const handlePhoneRegister = async () => {
    if (!registerName.trim()) {
      showToast("कृपया अपना नाम भरें।");
      return;
    }
    if (registerMobile.length !== 10) {
      showToast("कृपया वैध 10-अंकों का मोबाइल नंबर दर्ज करें।");
      return;
    }
    if (registerMpin.length !== 4) {
      showToast("सुरक्षा के लिए MPIN 4-अंकों का डालें।");
      return;
    }

    setIsSubmitting(true);
    try {
      let isDuplicate = false;
      try {
        const q = query(collection(db, "userProfiles"), where("mobile", "==", registerMobile), limit(1));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          isDuplicate = true;
        }
      } catch (queryErr) {
        console.warn("UserProfiles query pre-check bypassed due to Firestore rule constraints (will rely on Auth uniqueness):", queryErr);
      }

      if (isDuplicate) {
        showToast("यह मोबाइल नंबर पहले से पंजीकृत है।");
        setIsSubmitting(false);
        return;
      }

      const virtualEmail = `${registerMobile}@bishnoi.co.in`;
      const firebasePassword = getFirebasePasswordFromMpin(registerMpin);
      const userCredential = await createUserWithEmailAndPassword(auth, virtualEmail, firebasePassword);
      const newUser = userCredential.user;

      await updateProfile(newUser, { displayName: registerName });

      const userRef = doc(db, "userProfiles", newUser.uid);
      const profile = {
        uid: newUser.uid,
        mobile: registerMobile,
        mpin: registerMpin,
        displayName: registerName,
        photoURL: "",
        createdAt: new Date().toISOString()
      };
      await setDoc(userRef, profile);

      setProfileData(profile);
      showToast("पंजीकरण और लॉग-इन सफल रहा!");
      setShowProfile(false);
      
      setRegisterName("");
      setRegisterMobile("");
      setRegisterMpin("");
    } catch (error: any) {
      console.error("Phone Register Error:", error);
      if (error.code === "auth/email-already-in-use") {
        showToast("यह मोबाइल नंबर पहले से पंजीकृत है।");
      } else {
        showToast("पंजीकरण में विफल: " + cleanErrorMessage(error, "अज्ञात त्रुटि"));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePhoneLogin = async () => {
    if (loginMobile.length !== 10) {
      showToast("कृपया 10-अंकों का मोबाइल नंबर भरें।");
      return;
    }
    if (loginMpin.length !== 4) {
      showToast("कृपया 4-अंकों का MPIN भरें।");
      return;
    }

    setIsSubmitting(true);
    try {
      const firebasePassword = getFirebasePasswordFromMpin(loginMpin);
      let emailToLogin = `${loginMobile}@bishnoi.co.in`;

      // Check Firestore if there is a profile for this mobile that saved the original email
      try {
        const q = query(collection(db, "userProfiles"), where("mobile", "==", loginMobile), limit(1));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const docData = snapshot.docs[0].data();
          if (docData.email) {
            emailToLogin = docData.email;
          }
        }
      } catch (err) {
        console.warn("Could not retrieve profile email for routing, falling back to virtual email:", err);
      }

      try {
        await signInWithEmailAndPassword(auth, emailToLogin, firebasePassword);
      } catch (loginErr: any) {
        // Fallback to virtual domain or legacy domain for existing users
        if (loginErr.code === "auth/user-not-found" || loginErr.code === "auth/invalid-credential") {
          try {
            if (emailToLogin !== `${loginMobile}@bishnoi.co.in`) {
              await signInWithEmailAndPassword(auth, `${loginMobile}@bishnoi.co.in`, firebasePassword);
            } else {
              throw loginErr;
            }
          } catch (innerErr: any) {
            const legacyEmail = `${loginMobile}@sabadwani.com`;
            await signInWithEmailAndPassword(auth, legacyEmail, firebasePassword);
          }
        } else {
          throw loginErr;
        }
      }
      showToast("सफलतापूर्वक लॉग-इन किया गया!");
      setShowProfile(false);
      
      setLoginMobile("");
      setLoginMpin("");
    } catch (error: any) {
      console.error("Phone Login Error:", error);
      if (error.code === "auth/invalid-credential" || error.code === "auth/wrong-password" || error.code === "auth/user-not-found") {
        showToast("गलत मोबाइल नंबर या MPIN। कृपया पुनः प्रयास करें।");
      } else {
        showToast("लॉग-इन करने में विफल: " + cleanErrorMessage(error, "अज्ञात त्रुटि"));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotMpin = () => {
    if (loginMobile.length !== 10) {
      showToast("कृपया पहले 'मोबाइल नंबर' बॉक्स में अपना 10-अंकों का मोबाइल नंबर दर्ज करें।");
      return;
    }
    const message = `प्रणाम जी, मैं सबदवाणी ऐप में अपना MPIN भूल गया हूँ।\nमेरा पंजीकृत मोबाइल नंबर: +91 ${loginMobile} है।\nकृपया नया पिन सेट करने में मेरी सहायता करें।`;
    const encodedMsg = encodeURIComponent(message);
    const adminWhatsApp = "917877773277"; // Shabadwani Admin Contact
    window.open(`https://wa.me/${adminWhatsApp}?text=${encodedMsg}`, "_blank");
    showToast("व्हाट्सएप पर पिन रीसेट (Reset) अनुरोध भेजा जा रहा है...");
  };



  const handleOnboardingSubmit = async () => {
    if (!auth?.currentUser) return;
    if (onboardPhone.length !== 10) {
      showToast("कृपया वैध 10-अंकों का मोबाइल नंबर दर्ज करें।");
      return;
    }
    if (onboardMpin.length !== 4) {
      showToast("कृपया सुरक्षित 4-अंकीय MPIN चुनें।");
      return;
    }

    setIsSubmitting(true);
    try {
      // Step A: Pre-Check if of this mobile is already associated
      let isDuplicate = false;
      try {
        const q = query(collection(db, "userProfiles"), where("mobile", "==", onboardPhone), limit(1));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          isDuplicate = true;
        }
      } catch (queryErr) {
        console.warn("UserProfiles onboarding query check bypassed due to Firestore rule constraints (will rely on Auth uniqueness):", queryErr);
      }

      if (isDuplicate) {
        showToast("यह मोबाइल नंबर पहले से किसी खाते से जुड़ा है।");
        setIsSubmitting(false);
        return;
      }

      // Capture original Google/social email before linking alters the currentUser email object
      const originalEmail = auth.currentUser.email && 
        !(auth.currentUser.email.endsWith("@bishnoi.co.in") || auth.currentUser.email.endsWith("@sabadwani.com"))
        ? auth.currentUser.email
        : null;

      // Step B: Set up credentials (use original email if available so virtual email is avoided in Auth list)
      const emailToLink = originalEmail || `${onboardPhone}@bishnoi.co.in`;
      const firebasePassword = getFirebasePasswordFromMpin(onboardMpin);
      const credential = EmailAuthProvider.credential(emailToLink, firebasePassword);
      
      try {
        await linkWithCredential(auth.currentUser, credential);
      } catch (linkError: any) {
        console.warn("Linking error details:", linkError);
        if (linkError.code === "auth/credential-already-in-use" || linkError.code === "auth/email-already-in-use") {
          showToast("यह मोबाइल नंबर पहले से किसी खाते से जुड़ा है।");
          setIsSubmitting(false);
          return;
        }
      }

      // Step C: Set database profile doc
      const userRef = doc(db, "userProfiles", auth.currentUser.uid);
      const profile: any = {
        uid: auth.currentUser.uid,
        mobile: onboardPhone,
        mpin: onboardMpin,
        displayName: auth.currentUser.displayName || "अज्ञात भक्त",
        photoURL: auth.currentUser.photoURL || "",
        createdAt: new Date().toISOString()
      };

      if (originalEmail) {
        profile.email = originalEmail;
      } else if (auth.currentUser.email && !(auth.currentUser.email.endsWith("@bishnoi.co.in") || auth.currentUser.email.endsWith("@sabadwani.com"))) {
        profile.email = auth.currentUser.email;
      }
      await setDoc(userRef, profile);
      
      setProfileData(profile);
      showToast("सुरक्षित लॉगिन सेट-अप पूर्ण हुआ!");
      setShowProfile(false);
    } catch (error: any) {
      console.error("Onboarding Submit Error:", error);
      showToast("त्रुटि: " + cleanErrorMessage(error, "पिन सुरक्षित करने में विफलता।"));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Change Profile image handlers
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showToast("फ़ाइल का आकार 2MB से कम होना चाहिए।");
      return;
    }

    setUploading(true);
    try {
      if (!storage) {
        throw new Error("फ़ायरबेस स्टोरेज लोड नहीं हुआ है।");
      }
      const storageRef = ref(storage, `profiles/${currentUser.uid}_${Date.now()}.jpg`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      await updateProfile(auth.currentUser, { photoURL: downloadURL });
      await setDoc(doc(db, "userProfiles", currentUser.uid), { photoURL: downloadURL }, { merge: true });

      showToast("प्रोफाइल चित्र सफलता से अपडेट हुआ!");
      setShowAvatarPicker(false);
    } catch (err: any) {
      console.error("Upload error:", err);
      showToast("अपलोड करने में विफल: " + (err.message || "अज्ञात त्रुटि"));
    } finally {
      setUploading(false);
    }
  };

  const handleSelectPresetAvatar = async (dataUrl: string) => {
    setUploading(true);
    try {
      await updateProfile(auth.currentUser, { photoURL: dataUrl });
      await setDoc(doc(db, "userProfiles", currentUser.uid), { photoURL: dataUrl }, { merge: true });

      showToast("सुंदर आध्यात्मिक अवतार सफलता से सेट हुआ!");
      setShowAvatarPicker(false);
    } catch (err: any) {
      console.error("Preset selection error:", err);
      showToast("अवतार लगाने में विफल: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const totalContributions = myPendingPosts.length + recentApprovedPosts.filter(p => p.userId === currentUser?.uid).length;

  return (
    <AnimatePresence>
      {showProfile && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          {/* Background backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              if (isOnboardingActive) {
                showToast("लॉगिन पूर्ण करने के लिए मोबाइल नंबर और MPIN सेट करें, या लॉग-आउट करें।");
              } else {
                setShowProfile(false);
              }
            }}
            className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
          />

          {/* Centered Modal Content Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: "spring", damping: 26, stiffness: 330 }}
            className="relative w-full max-w-[360px] bg-white rounded-[2rem] shadow-2xl border border-ink/10 overflow-hidden font-sans z-10 flex flex-col"
          >
            {/* Header */}
            <div className={`${isOnboardingActive ? 'p-3' : 'p-4'} border-b border-ink/5 relative flex justify-center items-center bg-paper/30`}>
              <h3 className="font-extrabold text-ink flex items-center justify-center gap-2 text-center select-none leading-none">
                <img src="/logo.png" alt="Logo" className="w-5 h-5 rounded-full object-cover shadow-sm shrink-0 relative -top-[1px]" onError={(e) => { e.currentTarget.src = "/logo.png" }} />
                <span className="relative top-[1px]">
                  {isOnboardingActive 
                    ? "सुरक्षित लॉगिन सेट-अप" 
                    : showAvatarPicker 
                      ? "प्रोफ़ाइल चित्र बदलें" 
                      : "प्रोफ़ाइल"
                  }
                </span>
              </h3>
              {!isOnboardingActive && (
                <button
                  onClick={() => {
                    if (showAvatarPicker) {
                      setShowAvatarPicker(false);
                    } else {
                      setShowProfile(false);
                    }
                  }}
                  className="absolute right-4 p-1.5 rounded-full hover:bg-ink/5 text-ink-light hover:text-ink transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

          {/* Profile Picture & Preset Avatar Picker Panel */}
          {showAvatarPicker ? (
            <div className="p-5 text-center">
              <button
                onClick={() => setShowAvatarPicker(false)}
                className="flex items-center gap-1.5 text-xs text-accent-dark font-bold mb-3 hover:underline"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>वापस जाएँ</span>
              </button>

              {uploading ? (
                <div className="flex flex-col items-center py-10 gap-3">
                  <RefreshCw className="w-8 h-8 text-accent animate-spin" />
                  <p className="text-xs text-ink-light font-bold">प्रोफ़ाइल फ़ोटो अपलोड हो रही है...</p>
                </div>
              ) : (
                <>
                  {/* File Upload Selector */}
                  <label className="flex flex-col items-center justify-center gap-1.5 p-4 border border-dashed border-accent-dark/30 rounded-2xl bg-accent/5 hover:bg-accent/10 transition-all cursor-pointer mb-4">
                    <div className="w-9 h-9 rounded-full bg-accent/10 flex items-center justify-center">
                      <Image className="w-4.5 h-4.5 text-accent-dark" />
                    </div>
                    <span className="text-xs font-bold text-accent-dark">गैलरी से चित्र चुनें</span>
                    <span className="text-[10px] text-ink-light">समर्थित: JPG, PNG (Max 2MB)</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>

                  <div className="w-full h-[1px] bg-ink/5 mb-3" />

                  {/* Spiritual Avatar Grid */}
                  <p className="text-[10px] text-ink-light font-bold uppercase tracking-wider mb-2.5 text-left">या सुंदर आध्यात्मिक अवतार चुनें:</p>
                  <div className="grid grid-cols-4 gap-2.5">
                    {PRESET_AVATARS.map((av) => {
                      const presetUrl = generatePresetDataUrl(av.symbol, av.start, av.end);
                      return (
                        <button
                          key={av.id}
                          onClick={() => handleSelectPresetAvatar(presetUrl)}
                          className="flex flex-col items-center gap-1 p-0.5 hover:scale-105 active:scale-95 transition-all focus:outline-none"
                        >
                          <div
                            className="w-11 h-11 rounded-full flex items-center justify-center shadow-sm border-2 border-white"
                            style={{ background: `linear-gradient(135deg, ${av.start}, ${av.end})` }}
                          >
                            <span className="text-xl leading-none">{av.symbol}</span>
                          </div>
                          <span className="text-[9px] text-ink-light font-bold">{av.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          ) : (
            /* Main authentication, User Details, or linking UI */
            <div className={`${isOnboardingActive ? 'p-3.5 sm:p-4' : 'p-4 sm:p-5'} max-h-[85vh] overflow-y-auto custom-scrollbar focus:outline-none`}>
              {isOnboardingActive ? (
                /* LUXURIOUS AND CLEAN COMPACT ONBOARDING FORM MATCHING THE PROFILE VIEW */
                <div className="flex flex-col text-center select-none w-full">
                  {/* User Profile avatar matching design exactly but slightly more compact */}
                  <div className="relative mb-1.5 group">
                    <img
                      src={currentUser.photoURL || "/logo.png"}
                      alt={currentUser.displayName || "User"}
                      className="w-14 h-14 rounded-full border-4 border-white shadow-md object-cover object-top mx-auto transition-all"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = "/logo.png";
                      }}
                    />
                  </div>

                  <h4 className="font-extrabold text-base text-ink flex items-center gap-1.5 justify-center leading-none">
                    <span>{currentUser.displayName || "भक्त"}</span>
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  </h4>
                  
                  <div className="text-[11px] text-ink-light mt-1 mb-2.5 font-bold space-y-0.5 leading-none">
                    {currentUser.email && !(currentUser.email.endsWith("@bishnoi.co.in") || currentUser.email.endsWith("@sabadwani.com")) && (
                      <div className="opacity-80">{currentUser.email}</div>
                    )}
                  </div>

                  {/* Input Card Container - Designed exactly like profile card layouts */}
                  <div className="w-full bg-accent/5 rounded-2xl p-2.5 border border-accent/10 mb-3.5 text-left">
                    <div className="space-y-2.5">
                      {/* Mobile Box */}
                      <div className="flex flex-col">
                        <label className="text-[10px] text-accent-dark font-extrabold uppercase tracking-widest mb-1 ml-0.5">
                          पंजीकरण मोबाइल नंबर
                        </label>
                        <div className="relative flex items-center">
                          <span className="absolute left-3.5 text-xs font-black text-ink-light select-none">
                            🇮🇳 +91
                          </span>
                          <input
                            type="tel"
                            pattern="[0-9]*"
                            inputMode="numeric"
                            maxLength={10}
                            placeholder="xxxxxxxxxx"
                            value={onboardPhone}
                            onChange={(e) => setOnboardPhone(e.target.value.replace(/\D/g, ""))}
                            className="w-full bg-white border border-accent/20 focus:border-accent hover:border-accent/40 text-ink text-sm font-bold font-mono tracking-wider pl-15 pr-3 py-2 rounded-xl outline-none transition-all focus:ring-4 focus:ring-accent/10"
                          />
                        </div>
                      </div>

                      {/* MPIN Box */}
                      <div className="flex flex-col">
                        <label className="text-[10px] text-accent-dark font-extrabold uppercase tracking-widest mb-1 ml-0.5">
                          सुरक्षित 4-अंकीय MPIN बनाएँ
                        </label>
                        <div className="relative">
                          <input
                            type="password"
                            pattern="[0-9]*"
                            inputMode="numeric"
                            maxLength={4}
                            placeholder="••••"
                            value={onboardMpin}
                            onChange={(e) => setOnboardMpin(e.target.value.replace(/\D/g, ""))}
                            className="w-full bg-white border border-accent/20 focus:border-accent hover:border-accent/40 text-ink text-base font-extrabold tracking-widest px-4 py-2 rounded-xl outline-none transition-all text-center focus:ring-4 focus:ring-accent/10 font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Submit & Exit Buttons - consistent with profile view margins */}
                  <div className="w-full space-y-2">
                    <button
                      disabled={isSubmitting}
                      onClick={handleOnboardingSubmit}
                      className="relative overflow-hidden w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all outline-none bg-gradient-to-r from-accent to-accent-dark text-white shadow hover:shadow-md active:scale-95 cursor-pointer"
                    >
                      <Ripple color="rgba(255, 255, 255, 0.2)" />
                      {isSubmitting ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <ShieldCheck className="w-3.5 h-3.5" />
                      )}
                      <span>सुरक्षित लॉगिन पूर्ण करें</span>
                    </button>

                    <button
                      onClick={handleLogout}
                      className="relative overflow-hidden w-full bg-red-50 text-red-600 hover:bg-red-100 font-bold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all active:scale-95 text-xs cursor-pointer"
                    >
                      <Ripple color="rgba(239, 68, 68, 0.1)" />
                      <LogOut className="w-4 h-4" />
                      <span>लॉग-आउट करें (Sign Out)</span>
                    </button>
                  </div>
                </div>
              ) : isRegisteredUser ? (
                <div className="flex flex-col items-center text-center">
                  {/* User Profile avatar */}
                  <div className="relative mb-2.5 group">
                    <img
                      src={currentUser.photoURL || "/logo.png"}
                      alt={currentUser.displayName || "User"}
                      className="w-18 h-18 rounded-full border-4 border-white shadow-md object-cover object-top transition-all"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = "/logo.png";
                      }}
                    />
                    <button
                      onClick={() => setShowAvatarPicker(true)}
                      className="absolute bottom-0 right-0 bg-accent text-white rounded-full p-1 border-2 border-white shadow-md hover:bg-accent-dark transition-all scale-95"
                      title="प्रोफ़ाइल बदलें"
                    >
                      <Camera className="w-3 h-3" />
                    </button>
                  </div>

                  {/* User name & email block with consistent spacing */}
                  <div className="flex flex-col items-center gap-2 mt-1 mb-5 w-full">
                    <h4 className="font-extrabold text-base text-ink flex items-center gap-1.5 justify-center leading-none">
                      <span>{currentUser.displayName || "भक्त"}</span>
                      <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    </h4>
                    
                    {/* Styled Gmail Info (Simple and Clean) */}
                    {((profileData?.email) || (currentUser.email && !(currentUser.email.endsWith("@bishnoi.co.in") || currentUser.email.endsWith("@sabadwani.com")))) && (
                      <div className="flex items-center gap-1.5 justify-center text-[12px] font-medium text-ink-light opacity-85 w-full select-all">
                        <Mail className="w-3.5 h-3.5 text-accent shrink-0" />
                        <span className="truncate leading-none">{profileData?.email || currentUser.email}</span>
                      </div>
                    )}
                  </div>

                  {/* Contribution Stats */}
                  <div className="w-full bg-accent/5 rounded-2xl p-3 border border-accent/10 mb-5 flex items-center justify-around">
                    <div className="flex items-center gap-2">
                      <ListMusic className="w-6 h-6 text-accent-dark shrink-0" />
                      <div className="text-left">
                        <p className="text-[8px] text-ink-light font-bold uppercase tracking-wider leading-none">योगदान</p>
                        <p className="text-base font-black text-ink leading-none mt-1">{totalContributions}</p>
                      </div>
                    </div>
                    <div className="h-5 w-[1px] bg-ink/10" />
                    <div className="text-left">
                      <p className="text-[8px] text-ink-light font-bold uppercase tracking-wider leading-none">स्वीकृत</p>
                      <p className="text-xs font-black text-emerald-600 mt-1">{recentApprovedPosts.filter(p => p.userId === currentUser.uid).length} पोस्ट</p>
                      <p className="text-[8px] text-amber-600 font-bold leading-none mt-0.5">लंबित: {myPendingPosts.length}</p>
                    </div>
                  </div>

                  {/* Logout Button */}
                  <button
                    onClick={handleLogout}
                    className="relative overflow-hidden w-full bg-red-50 text-red-600 hover:bg-red-100 font-bold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all active:scale-95 text-xs cursor-pointer"
                  >
                    <Ripple color="rgba(239, 68, 68, 0.1)" />
                    <LogOut className="w-4 h-4" />
                    <span>लॉग-आउट करें (Sign Out)</span>
                  </button>
                </div>
              ) : (
                /* AUTHENTICATION TAB LAYOUT (When logged out) */
                <div className="flex flex-col py-0.5">
                  {/* Select Tab */}
                  <div className="flex bg-ink/5 p-1 rounded-xl mb-3.5">
                    <button
                      onClick={() => setAuthTab("login")}
                      className={`flex-1 text-center py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${authTab === "login" ? "bg-white text-ink shadow-sm" : "text-ink-light hover:text-ink"}`}
                    >
                      लॉग-इन
                    </button>
                    <button
                      onClick={() => setAuthTab("register")}
                      className={`flex-1 text-center py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${authTab === "register" ? "bg-white text-ink shadow-sm" : "text-ink-light hover:text-ink"}`}
                    >
                      नया खाता
                    </button>
                  </div>

                  {/* Tab: Login (Unified Google + Mobile MPIN) */}
                  {authTab === "login" && (
                    <div className="flex flex-col gap-2.5">
                      {/* Google One-Click Login */}
                      <button
                        onClick={handleGoogleLogin}
                        className="relative overflow-hidden w-full bg-gradient-to-r from-accent to-accent-dark text-white font-bold py-2.5 px-4 rounded-xl shadow-md hover:shadow-lg hover:scale-[1.01] transition-all flex items-center justify-center gap-2 active:scale-[0.98] cursor-pointer text-xs"
                      >
                        <Ripple color="rgba(255, 255, 255, 0.2)" />
                        <svg className="w-4 h-4 fill-current bg-white p-0.5 rounded-full text-accent-dark shrink-0" viewBox="0 0 24 24">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                        </svg>
                        <span>गूगल वन-क्लिक लॉग-इन</span>
                      </button>

                      {/* Accent text separator */}
                      <div className="flex items-center my-1 select-none">
                        <div className="flex-1 border-t border-ink/5"></div>
                        <span className="px-2 text-[9px] text-ink-light font-bold">या फिर मोबाइल नंबर से लॉग-इन करें</span>
                        <div className="flex-1 border-t border-ink/5"></div>
                      </div>

                      {/* Mobile Pin login fields */}
                      <div className="flex flex-col text-left gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-ink-light mb-0.5 uppercase tracking-wider">मोबाइल नंबर</label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-2.5 w-4 h-4 text-ink-light" />
                            <input
                              type="tel"
                              maxLength={10}
                              placeholder="पंजीकृत मोबाइल नंबर"
                              value={loginMobile}
                              onChange={(e) => setLoginMobile(e.target.value.replace(/\D/g, ""))}
                              className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-ink/10 bg-white focus:border-accent outline-none font-sans"
                            />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between items-center mb-0.5">
                            <label className="block text-[10px] font-bold text-ink-light uppercase tracking-wider">4-अंकों का MPIN</label>
                            <button
                              type="button"
                              onClick={handleForgotMpin}
                              className="text-[9px] font-bold text-accent-dark hover:underline flex items-center gap-0.5 cursor-pointer bg-transparent border-none p-0"
                            >
                              🔑 पिन भूल गए?
                            </button>
                          </div>
                          <div className="relative">
                            <Lock className="absolute left-3 top-2.5 w-4 h-4 text-ink-light" />
                            <input
                              type="password"
                              maxLength={4}
                              placeholder="अपना 4-अंकों का पिन डालें"
                              value={loginMpin}
                              onChange={(e) => setLoginMpin(e.target.value.replace(/\D/g, ""))}
                              className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-ink/10 bg-white focus:border-accent outline-none font-sans"
                            />
                          </div>
                        </div>

                        <button
                          onClick={handlePhoneLogin}
                          disabled={isSubmitting}
                          className="w-full bg-gradient-to-r from-accent to-accent-dark text-white font-bold py-2.5 rounded-xl shadow hover:shadow-md active:scale-95 transition-all text-xs flex items-center justify-center gap-1.5 mt-1 cursor-pointer"
                        >
                          {isSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <LogIn className="w-3.5 h-3.5" />}
                          <span>सुरक्षित लॉग-इन करें</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Tab: New Account Registration */}
                  {authTab === "register" && (
                    <div className="flex flex-col gap-2.5">
                      {/* Google One-Click Register */}
                      <button
                        onClick={handleGoogleLogin}
                        className="relative overflow-hidden w-full bg-gradient-to-r from-accent to-accent-dark text-white font-bold py-2.5 px-4 rounded-xl shadow-md hover:shadow-lg hover:scale-[1.01] transition-all flex items-center justify-center gap-2 active:scale-[0.98] cursor-pointer text-xs"
                      >
                        <Ripple color="rgba(255, 255, 255, 0.2)" />
                        <svg className="w-4 h-4 fill-current bg-white p-0.5 rounded-full text-accent-dark shrink-0" viewBox="0 0 24 24">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                        </svg>
                        <span>गूगल वन-क्लिक साइन-अप/लॉग-इन</span>
                      </button>

                      {/* Accent text separator */}
                      <div className="flex items-center my-1 select-none">
                        <div className="flex-1 border-t border-ink/5"></div>
                        <span className="px-2 text-[9px] text-ink-light font-bold">या फिर नया खाता बनाएं</span>
                        <div className="flex-1 border-t border-ink/5"></div>
                      </div>

                      {/* Manual Register fields */}
                      <div className="flex flex-col text-left gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-ink-light mb-0.5 uppercase tracking-wider">पूरा नाम (Full Name)</label>
                          <div className="relative">
                            <User className="absolute left-3 top-2.5 w-4 h-4 text-ink-light" />
                            <input
                              type="text"
                              placeholder="भजन/साखी भेजने के लिए अपना नाम"
                              value={registerName}
                              onChange={(e) => setRegisterName(e.target.value)}
                              className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-ink/10 bg-white focus:border-accent outline-none font-sans"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-ink-light mb-0.5 uppercase tracking-wider">मोबाइल नंबर</label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-2.5 w-4 h-4 text-ink-light" />
                            <input
                              type="tel"
                              maxLength={10}
                              placeholder="10-अंकों का मोबाइल नंबर"
                              value={registerMobile}
                              onChange={(e) => setRegisterMobile(e.target.value.replace(/\D/g, ""))}
                              className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-ink/10 bg-white focus:border-accent outline-none font-sans"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-ink-light mb-0.5 uppercase tracking-wider">नया 4-अंकीय MPIN (पासवर्ड)</label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-2.5 w-4 h-4 text-ink-light" />
                            <input
                              type="password"
                              maxLength={4}
                              placeholder="याद रखने योग्य 4-अंकीय पिन बनाएं"
                              value={registerMpin}
                              onChange={(e) => setRegisterMpin(e.target.value.replace(/\D/g, ""))}
                              className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-ink/10 bg-white focus:border-accent outline-none font-sans"
                            />
                          </div>
                          <p className="text-[9px] text-ink-light mt-0.5">इस पिन का उपयोग मोबाइल नंबर के साथ दोबारा लॉग-इन के लिए किया जा सकेगा।</p>
                        </div>

                        <button
                          onClick={handlePhoneRegister}
                          disabled={isSubmitting}
                          className="w-full bg-gradient-to-r from-accent to-accent-dark text-white font-bold py-2.5 rounded-xl shadow hover:shadow-md active:scale-95 transition-all text-xs flex items-center justify-center gap-1.5 mt-1 cursor-pointer"
                        >
                          {isSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                          <span>नया खाता बनाएं</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>
    )}
  </AnimatePresence>
  );
}
