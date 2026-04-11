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
          <p className="text-xs text-ink/70 mb-4">अंतिम अपडेट: 8 अप्रैल 2026</p>
          <p>आपकी गोपनीयता हमारे लिए अत्यंत महत्वपूर्ण है। यह ऐप (सबदवाणी / Shabadwani) Google Play Store की नीतियों का पूर्ण रूप से पालन करता है। यह गोपनीयता नीति बताती है कि हम आपकी जानकारी कैसे एकत्र, उपयोग और सुरक्षित करते हैं。</p>
          
          <h3 className="font-bold mt-4 text-accent-dark">1. जानकारी का संग्रह (Data Collection)</h3>
          <ul className="list-disc pl-5 space-y-1 text-ink/90">
            <li><strong>व्यक्तिगत जानकारी:</strong> जब आप ऐप में लॉगिन करते हैं (Google Authentication के माध्यम से), तो हम आपका नाम, ईमेल पता और प्रोफाइल फोटो प्राप्त करते हैं।</li>
            <li><strong>ऐप उपयोग डेटा:</strong> हम आपके द्वारा बुकमार्क की गई सामग्री, रीडिंग हिस्ट्री (पढ़ी गई सामग्री), और डिवाइस आईडी एकत्र करते हैं। यह डेटा केवल आपके ऐप अनुभव को बेहतर बनाने, व्यक्तिगत सुझाव देने और ऐप के प्रदर्शन को सुधारने के लिए उपयोग किया जाता है।</li>
            <li><strong>यूज़र द्वारा अपलोड किया गया डेटा:</strong> आपके द्वारा अपलोड की गई सामग्री (जैसे भजन, साखी, ऑडियो फाइलें, और तस्वीरें) हमारे सुरक्षित सर्वर पर स्टोर की जाती है।</li>
            <li><strong>ऑफ़लाइन कैशिंग (Offline Caching):</strong> बेहतर अनुभव के लिए, ऐप ऑडियो फाइल्स और अन्य सामग्री को आपके डिवाइस पर स्थानीय रूप से कैश (cache) करता है, ताकि आप उन्हें इंटरनेट के बिना भी सुन सकें। यह डेटा केवल आपके डिवाइस पर स्टोर होता है।</li>
            <li><strong>डिवाइस और उपयोग डेटा:</strong> ऐप के प्रदर्शन को बेहतर बनाने के लिए क्रैश लॉग्स और सामान्य उपयोग डेटा (Firebase Analytics के माध्यम से) एकत्र किया जा सकता है।</li>
          </ul>

          <h3 className="font-bold mt-4 text-accent-dark">1.1 डेटा सुरक्षा (Data Security)</h3>
          <p className="text-ink/90">हम स्पष्ट करते हैं कि आपका कोई भी डेटा किसी भी थर्ड-पार्टी (Third-Party) को विज्ञापन या मार्केटिंग के लिए <strong>बेचा या साझा नहीं किया जाता है</strong>।</p>

          <h3 className="font-bold mt-4 text-accent-dark">2. अनुमतियां (Permissions)</h3>
          <ul className="list-disc pl-5 space-y-1 text-ink/80">
            <li><strong>स्थान (Location):</strong> 'चोघड़िया' और पंचांग जैसी सुविधाओं के लिए आपके डिवाइस के स्थान (Location) का उपयोग किया जाता है। <strong>महत्वपूर्ण:</strong> यह डेटा केवल आपके डिवाइस पर प्रोसेस होता है और हमारे सर्वर पर न तो भेजा जाता है और न ही सेव किया जाता है।</li>
            <li><strong>माइक्रोफोन (Microphone):</strong> 'वॉइस सर्च' (Voice Search) सुविधा के लिए आपके माइक्रोफोन का उपयोग किया जाता है। आपकी आवाज़ को केवल सर्च करने के लिए प्रोसेस किया जाता है और इसे हमारे सर्वर पर सेव नहीं किया जाता है।</li>
            <li><strong>वाइब्रेशन (Vibration):</strong> 'जाप माला' सुविधा में गिनती पूरी होने पर आपको सूचित करने के लिए वाइब्रेशन का उपयोग किया जाता है।</li>
            <li><strong>इंटरनेट (Internet):</strong> ऑडियो चलाने, डेटा सिंक करने और सामग्री डाउनलोड/अपलोड करने के लिए इंटरनेट एक्सेस की आवश्यकता होती है।</li>
            <li><strong>बैकग्राउंड ऑडियो और नोटिफिकेशन्स (Background Audio & Notifications):</strong> ऐप को बैकग्राउंड में ऑडियो चलाने (Foreground Service) और लॉक स्क्रीन पर मीडिया कंट्रोल्स दिखाने के लिए अनुमति की आवश्यकता होती है।</li>
          </ul>

          <h3 className="font-bold mt-4 text-accent-dark">3. थर्ड-पार्टी सेवाएं (Third-Party Services)</h3>
          <p className="text-ink/90">यह ऐप निम्नलिखित थर्ड-पार्टी सेवाओं का उपयोग करता है, जिनकी अपनी गोपनीयता नीतियां हो सकती हैं:</p>
          <ul className="list-disc pl-5 space-y-1 text-ink/80">
            <li>Google Play Services</li>
            <li>Google Analytics for Firebase</li>
            <li>Firebase Authentication & Cloud Firestore</li>
          </ul>

          <h3 className="font-bold mt-4 text-accent-dark">4. जानकारी का उपयोग (Data Usage)</h3>
          <ul className="list-disc pl-5 space-y-1 text-ink/80">
            <li>एकत्र की गई जानकारी का उपयोग केवल ऐप की सेवाएं प्रदान करने, यूज़र अकाउंट प्रबंधित करने और आपके अनुभव को बेहतर बनाने के लिए किया जाता है।</li>
            <li>हम आपका व्यक्तिगत डेटा किसी भी तीसरे पक्ष (Third Party) को विज्ञापन या मार्केटिंग के लिए <strong>बेचते या साझा नहीं करते हैं</strong>।</li>
          </ul>

          <h3 className="font-bold mt-4 text-accent-dark">5. डेटा सुरक्षा और डिलीशन (Data Security & Deletion)</h3>
          <ul className="list-disc pl-5 space-y-1 text-ink/80">
            <li><strong>सुरक्षा:</strong> आपका डेटा सुरक्षित सर्वर (Firebase) पर एन्क्रिप्टेड रूप में स्टोर किया जाता है। हम आपके डेटा की सुरक्षा के लिए व्यावसायिक रूप से स्वीकार्य साधनों का उपयोग সুইস करते हैं।</li>
            <li><strong>डेटा डिलीशन (Data Deletion):</strong> यदि आप अपना खाता या अपना सारा डेटा डिलीट करना चाहते हैं, तो आप ऐप के अंदर दिए गए विकल्पों का उपयोग कर सकते हैं या नीचे दिए गए ईमेल पर हमसे संपर्क कर सकते हैं। आपके अनुरोध पर आपका सारा डेटा (प्रोफाइल, अपलोड की गई सामग्री) हमारे सर्वर से स्थायी रूप से हटा दिया जाएगा।</li>
          </ul>

          <h3 className="font-bold mt-4 text-accent-dark">5.1 प्रीमियम फीचर्स और डेटा (Premium Features & Data)</h3>
          <p className="text-ink/90">ऐप में कुछ प्रीमियम फीचर्स (जैसे 'जाप माला' और 'नोट्स') आपके अनुभव को बेहतर बनाने के लिए दिए गए हैं।</p>
          <ul className="list-disc pl-5 space-y-1 text-ink/80">
            <li><strong>जाप माला (Mala Count):</strong> आपकी माला की गिनती केवल आपके डिवाइस (Local Storage) पर स्टोर की जाती है।</li>
            <li><strong>पसंदीदा (Bookmarks):</strong> आपके बुकमार्क आपके अकाउंट से जुड़े होते हैं ताकि आप उन्हें किसी भी डिवाइस पर एक्सेस कर सकें।</li>
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
