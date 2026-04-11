import React from "react";
import { motion } from "motion/react";
import { UploadCloud, Upload, AlertCircle } from "lucide-react";
import PremiumHeader from "./PremiumHeader";

interface ContributeScreenProps {
  handleBack: () => void;
  contribAuthor: string;
  setContribAuthor: (val: string) => void;
  contribTitle: string;
  setContribTitle: (val: string) => void;
  contribType: string;
  setContribType: (val: string) => void;
  contribAudio: string;
  setContribAudio: (val: string) => void;
  contribAudioFile: File | null;
  setContribAudioFile: (file: File | null) => void;
  contribAudioError: string;
  setContribAudioError: (err: string) => void;
  contribText: string;
  setContribText: (val: string) => void;
  captchaQuestion: string;
  captchaAnswer: string;
  setCaptchaAnswer: (val: string) => void;
  contribError: string;
  isSubmitting: boolean;
  uploadProgress: number | null;
  handleContributeSubmit: (e: React.FormEvent) => void;
  handleFileSelect: (
    e: React.ChangeEvent<HTMLInputElement>,
    setFileCallback: (file: File | null) => void,
    isImage?: boolean,
    setErrorCallback?: (error: string) => void
  ) => void;
}

export default function ContributeScreen({
  handleBack,
  contribAuthor,
  setContribAuthor,
  contribTitle,
  setContribTitle,
  contribType,
  setContribType,
  contribAudio,
  setContribAudio,
  contribAudioFile,
  setContribAudioFile,
  contribAudioError,
  setContribAudioError,
  contribText,
  setContribText,
  captchaQuestion,
  captchaAnswer,
  setCaptchaAnswer,
  contribError,
  isSubmitting,
  uploadProgress,
  handleContributeSubmit,
  handleFileSelect,
}: ContributeScreenProps) {
  return (
    <motion.div
      key="contribute"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pb-32 bg-paper min-h-screen"
    >
      <PremiumHeader title="सामग्री जोड़ें" onBack={handleBack} icon={UploadCloud} />
      
      <div className="px-6 pt-2">
        <div className="text-center mb-6">
          <p className="text-ink-light">भजन, आरती, मंत्र या साखी अपलोड करें</p>
        </div>

        <form
          className="space-y-4 bg-white/80 p-6 rounded-3xl shadow-md border border-ink/10"
          onSubmit={handleContributeSubmit}
        >
          <div>
            <label className="block font-bold mb-1 text-ink">
              आपका नाम (Author)
            </label>
            <input
              value={contribAuthor}
              onChange={(e) => setContribAuthor(e.target.value)}
              required
              type="text"
              className="w-full p-3 rounded-xl border border-ink/20 bg-white focus:border-accent outline-none transition-colors"
              placeholder="अपना नाम लिखें..."
            />
          </div>
          <div>
            <label className="block font-bold mb-1 text-ink">
              शीर्षक (Title)
            </label>
            <input
              value={contribTitle}
              onChange={(e) => setContribTitle(e.target.value)}
              required
              type="text"
              className="w-full p-3 rounded-xl border border-ink/20 bg-white focus:border-accent outline-none transition-colors"
              placeholder="उदा. नया भजन..."
            />
          </div>
          <div>
            <label className="block font-bold mb-1 text-ink">
              प्रकार (Type)
            </label>
            <select
              value={contribType}
              onChange={(e) => setContribType(e.target.value)}
              className="w-full p-3 rounded-xl border border-ink/20 bg-white focus:border-accent outline-none transition-colors"
            >
              <option>भजन</option>
              <option>आरती</option>
              <option>मंत्र</option>
              <option>साखी</option>
            </select>
          </div>
          <div>
            <label className="block font-bold mb-1 text-ink">
              ऑडियो लिंक (Audio URL - Optional) या अपलोड करें
            </label>
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <input
                  value={contribAudio}
                  onChange={(e) => {
                    setContribAudio(e.target.value);
                    if (e.target.value) setContribAudioFile(null);
                  }}
                  type="url"
                  className="flex-1 p-3 rounded-xl border border-ink/20 bg-white focus:border-accent outline-none transition-colors"
                  placeholder="https://..."
                />
                <label className="flex items-center justify-center px-4 bg-accent/10 text-accent-dark rounded-xl cursor-pointer hover:bg-accent/20 transition-colors whitespace-nowrap">
                  <input
                    type="file"
                    accept="audio/*,.mp3,.aac,.m4a,.wav,.ogg"
                    className="hidden"
                    onChange={(e) => {
                      handleFileSelect(e, (file) => {
                        setContribAudioFile(file);
                        if (file) setContribAudio("");
                      }, false, setContribAudioError);
                    }}
                  />
                  <Upload className="w-5 h-5" />
                </label>
              </div>
              {contribAudioError && (
                <motion.div 
                  initial={{ opacity: 0, y: -5 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  className="mt-2 p-2 bg-red-50 text-red-600 rounded-lg text-xs font-medium flex items-center gap-2 justify-center text-center border border-red-100"
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{contribAudioError}</span>
                </motion.div>
              )}
              {contribAudioFile && !contribAudioError && (
                <p className="text-xs text-green-600 font-medium">चयनित: {contribAudioFile.name}</p>
              )}
              {uploadProgress !== null && (
                <div className="w-full bg-ink/10 rounded-full h-1.5 mt-1">
                  <div className="bg-accent h-1.5 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                </div>
              )}
            </div>
          </div>
          <div>
            <label className="block font-bold mb-1 text-ink">
              पाठ (Text / Lyrics)
            </label>
            <textarea
              value={contribText}
              onChange={(e) => setContribText(e.target.value)}
              required
              className="w-full p-3 rounded-xl border border-ink/20 bg-white h-32 focus:border-accent outline-none transition-colors"
              placeholder="यहाँ बोल लिखें..."
            ></textarea>
          </div>
          <div>
            <label className="block font-bold mb-1 text-ink">
              सुरक्षा कोड (Captcha): {captchaQuestion}
            </label>
            <input
              value={captchaAnswer}
              onChange={(e) => setCaptchaAnswer(e.target.value)}
              required
              type="number"
              className="w-full p-3 rounded-xl border border-ink/20 bg-white focus:border-accent outline-none transition-colors"
              placeholder="उत्तर लिखें..."
            />
          </div>
          {contribError && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="mb-4 p-4 bg-red-50 text-red-700 rounded-2xl text-sm flex items-center gap-3 justify-center text-center border border-red-100"
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{contribError}</span>
            </motion.div>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full bg-gradient-to-r from-accent to-accent-dark text-white font-bold py-3.5 rounded-xl shadow-md mt-4 hover:shadow-lg hover:scale-[1.02] transition-all ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isSubmitting ? 'सबमिट हो रहा है...' : 'सबमिट करें (Submit)'}
          </button>
          <p className="text-xs text-center text-ink-light mt-3">
            * सभी सबमिशन एडमिन द्वारा रिव्यु किए जाएंगे।
          </p>
        </form>
      </div>
    </motion.div>
  );
}
