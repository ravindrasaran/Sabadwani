import { motion } from "motion/react";
import { ShieldCheck } from "lucide-react";
import PremiumHeader from "./PremiumHeader";
import { Screen } from "../types";

interface PrivacyScreenProps {
  navigateTo: (screen: Screen) => void;
}

export default function PrivacyScreen({ navigateTo }: PrivacyScreenProps) {
  return (
    <motion.div
      key="privacy"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pb-32 bg-paper min-h-screen"
    >
      <PremiumHeader title="गोपनीयता नीति" onBack={() => navigateTo('home')} icon={ShieldCheck} />
      
      <div className="px-6 pt-2 text-center">
        <ShieldCheck className="w-20 h-20 mx-auto text-accent mb-4" />
        <div className="bg-white/80 p-6 rounded-3xl shadow-md border border-ink/10 text-left space-y-4 text-sm md:text-base text-ink">
          <p className="font-bold text-lg mb-2">गोपनीयता नीति (Privacy Policy)</p>
          <p className="text-xs text-ink/70 mb-4">अंतिम अपडेट: 18 अप्रैल 2026</p>
          <p>आपकी गोपनीयता हमारे लिए अत्यंत महत्वपूर्ण है। यह ऐप (सबदवाणी / Shabadwani) Google Play Store की नीतियों का पूर्ण रूप से पालन करता है। यह गोपनीयता नीति बताती है कि हम आपकी जानकारी कैसे एकत्र, उपयोग और सुरक्षित करते हैं।</p>
          
          <h3 className="font-bold mt-4 text-accent-dark">1. जानकारी का संग्रह (Data Collection)</h3>
          <ul className="list-disc pl-5 space-y-1 text-ink/90">
            <li><strong>व्यक्तिगत जानकारी:</strong> जब आप ऐप में लॉगिन करते हैं (Google Authentication के माध्यम से), तो हम आपका नाम, ईमेल पता और प्रोफाइल फोटो प्राप्त करते हैं।</li>
            <li><strong>ऐप उपयोग डेटा:</strong> हम आपके द्वारा बुकमार्क की गई सामग्री, और डिवाइस आईडी एकत्र करते हैं। यह डेटा केवल आपके ऐप अनुभव को बेहतर बनाने और ऐप के प्रदर्शन को सुधारने के लिए उपयोग किया जाता है।</li>
            <li><strong>यूज़र द्वारा उत्पन्न सामग्री (User Generated Content - UGC):</strong> आपके द्वारा अपलोड की गई सामग्री (जैसे सामुदायिक पोस्ट, भजन, साखी) हमारे सुरक्षित सर्वर पर स्टोर की जाती है। हम आपत्तिजनक सामग्री के खिलाफ सख्त नीतियां लागू करते हैं।</li>
            <li><strong>ऑफ़लाइन कैशिंग (Offline Caching):</strong> बेहतर अनुभव के लिए, ऐप थीम, सेटिंग्स, ऑडियो फाइल्स और अन्य डेटा को आपके डिवाइस के 'Native Preferences (स्थानीय डिवाइस स्टोरेज)' में सुरक्षित रूप से स्टोर करता है, ताकि आप इंटरनेट के बिना भी ऐप का उपयोग कर सकें।</li>
            <li><strong>क्रैश लॉग्स और डायग्नोस्टिक्स:</strong> ऐप की स्थिरता सुधारने के लिए 'Firebase Crashlytics' के माध्यम से क्रैश लॉग्स और तकनीकी समस्याएं अनाम (anonymous) रूप में एकत्र की जा सकती हैं।</li>
          </ul>

          <h3 className="font-bold mt-4 text-accent-dark">1.1 यूज़र जनरेटेड कंटेंट (UGC) और रिपोर्टिंग नियंत्रण</h3>
          <p className="text-ink/90">Google Play Store की UGC नीतियों के तहत हम स्पैम या अनुचित सामग्री को बर्दाश्त नहीं करते हैं। यूज़र्स किसी भी सामग्री को अनुचित (Inappropriate) रिपोर्ट कर सकते हैं। एडमिनिस्ट्रेटर को रिपोर्ट की गई सामग्री की तुरंत जांच करने और हटाने का पूर्ण अधिकार है।</p>

          <h3 className="font-bold mt-4 text-accent-dark">2. अनुमतियां (Permissions)</h3>
          <ul className="list-disc pl-5 space-y-1 text-ink/80">
            <li><strong>स्थान (Location):</strong> 'चोघड़िया' और पंचांग जैसी सुविधाओं के लिए आपके डिवाइस के स्थान का उपयोग किया जाता है। यह डेटा केवल आपके डिवाइस पर प्रोसेस होता है।</li>
            <li><strong>बैकग्राउंड ऑडियो:</strong> ऐप को बैकग्राउंड में ऑडियो (Native Media Service द्वारा) चलाने और लॉक स्क्रीन मीडिया कंट्रोल्स दिखाने के लिए अनुमति की आवश्यकता होती है।</li>
            <li><strong>इंटरनेट और स्टोरेज:</strong> डेटा सिंक करने और सामग्री डाउनलोड करने के लिए इंटरनेट और कैश नेटवर्क अनुमति ली जाती है।</li>
            <li><strong>वाइब्रेशन:</strong> जाप माला गिनती पूरी होने पर सूचित करने के लिए उपयोग किया जाता है।</li>
          </ul>

          <h3 className="font-bold mt-4 text-accent-dark">3. थर्ड-पार्टी सेवाएं (Third-Party Services)</h3>
          <p className="text-ink/90">यह ऐप निम्नलिखित थर्ड-पार्टी सेवाओं का उपयोग करता है:</p>
          <ul className="list-disc pl-5 space-y-1 text-ink/80">
            <li>Google Play Services</li>
            <li>Firebase Authentication & App Check</li>
            <li>Cloud Firestore & Firebase Crashlytics</li>
          </ul>

          <h3 className="font-bold mt-4 text-accent-dark">4. डेटा सुरक्षा और डिलीशन (Data Security & Deletion)</h3>
          <ul className="list-disc pl-5 space-y-1 text-ink/80">
            <li>आपका डेटा सुरक्षित रूप से एन्क्रिप्टेड (Encrypted) है। हमारा ऐप विज्ञापनों या थर्ड-पार्टी मार्केटिंग के लिए कभी भी यूज़र का डेटा <strong>बेचता या साझा नहीं करता है</strong>।</li>
            <li><strong>डेटा डिलीशन (Data Deletion):</strong> यदि आप अपना सारा डेटा या अकाउंट डिलीट करना चाहते हैं, तो आप ऐप के अंदर दिए गए विकल्पों का उपयोग कर सकते हैं या नीचे दिए गए ईमेल पर हमसे संपर्क कर सकते हैं।</li>
          </ul>

          <h3 className="font-bold mt-4 text-accent-dark">5. प्रीमियम फीचर्स और डेटा (Premium Features & Data)</h3>
          <ul className="list-disc pl-5 space-y-1 text-ink/80">
            <li><strong>जाप माला (Mala Count) और रीडिंग थीम:</strong> आपकी माला की गिनती और सेटिंग्स आपके डिवाइस के स्थानीय स्टोरेज (Native Database) पर पूरी तरह सुरक्षित रहती हैं।</li>
            <li><strong>पसंदीदा (Bookmarks):</strong> आपके बुकमार्क क्लाउड और डिवाइस दोनों पर सुरक्षित रहते हैं ताकि ऑफलाइन भी एक्सेस किया जा सके।</li>
          </ul>

          <h3 className="font-bold mt-4 text-accent-dark">6. बच्चों की गोपनीयता (Children's Privacy)</h3>
          <p className="text-ink/90">यह ऐप 13 वर्ष से कम उम्र के बच्चों से जानबूझकर व्यक्तिगत जानकारी एकत्र नहीं करता है। यदि हमें पता चलता है कि किसी बच्चे ने हमें व्यक्तिगत जानकारी प्रदान की है, तो हम उसे तुरंत अपने सर्वर से हटा देते हैं।</p>

          <h3 className="font-bold mt-4 text-accent-dark">7. संपर्क करें (Contact Us)</h3>
          <p className="text-ink/90">यदि इस गोपनीयता नीति के संबंध में आपके कोई प्रश्न या सुझाव हैं, तो कृपया हमसे संपर्क करें:</p>
          <div className="mt-2 bg-paper p-3 rounded-xl border border-ink/10">
            <p className="font-semibold text-accent-dark">Email: vishnoimilan@gmail.com</p>
            <p className="font-semibold text-accent-dark">Website: www.bishnoi.co.in</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
