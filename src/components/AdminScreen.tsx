import { motion } from "motion/react";
import { ShieldCheck, PlusCircle, CheckCircle, XCircle, Edit3, Pause, Play, Settings, BookOpenText, Upload, AlertCircle } from "lucide-react";
import PremiumHeader from "./PremiumHeader";

export default function AdminScreen(props: any) {
  const {
    navigateTo, isSubmitting, contribAudioError, contribPhotoError, showToast, checkIsOnline, db,
    setContribAudioError, setContribPhotoError, setIsSubmitting, contribTitle, contribType, contribAudio,
    contribText, contribAuthor, contribDate, contribLocation, contribPhotoUrl, setContribTitle, setContribType,
    setContribAudio, setContribText, setContribAuthor, setContribDate, setContribLocation, setContribPhotoUrl,
    addDoc, collection, sabads, openEditModal, handleDelete, aartis, bhajans, sakhis, mantras, thoughts, meles, badhais, toggleBadhaiStatus, notices, toggleNoticeStatus, settings, setSettings, setSettingsLogoFile, settingsLogoFile, setSettingsQrCodeFile, settingsQrCodeFile, setSettingsJaapAudioFile, settingsJaapAudioFile, handleSaveSettings, pendingPosts, approvePost, rejectPost, editItemData, handleEditSave, setEditItemData,
    contribAudioFile, uploadFileToStorage, contribPhotoFile, contribSequence, setContribSequence, setContribAudioFile, setContribPhotoFile, handleFileSelect, uploadProgress, editModalOpen, setEditModalOpen, editAudioError, editPhotoError, setEditAudioError, setEditPhotoError
  } = props;

  return (
<motion.div
            key="admin"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pb-32 bg-paper min-h-screen"
          >
            <PremiumHeader title="Admin Dashboard" onBack={() => navigateTo("home")} icon={ShieldCheck} noGlobalHeader={true} />

            <div className="space-y-8 px-4 pt-4">
              {/* Add New Content Section */}
              <div className="bg-white/90 p-6 rounded-3xl shadow-sm border border-ink/10">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2 border-b border-ink/10 pb-2">
                  <PlusCircle className="w-5 h-5" /> नई सामग्री जोड़ें (Add
                  Content)
                </h2>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (isSubmitting) return;
                    if (contribAudioError || contribPhotoError) {
                      showToast("कृपया पहले फाइल से जुड़ी त्रुटि को ठीक करें।");
                      return;
                    }
                    const isOnline = await checkIsOnline();
                    if (!isOnline) {
                      showToast("इंटरनेट कनेक्शन उपलब्ध नहीं है। कृपया अपना नेटवर्क जांचें और पुनः प्रयास करें।");
                      return;
                    }
                    if (!db) {
                      showToast("Firebase is not configured.");
                      return;
                    }
                    
                    setIsSubmitting(true);
                    try {
                      let finalAudioUrl = contribAudio;
                      let finalPhotoUrl = contribPhotoUrl;

                      if (contribAudioFile) {
                        finalAudioUrl = await uploadFileToStorage(contribAudioFile, "audio");
                      }
                      if (contribPhotoFile) {
                        finalPhotoUrl = await uploadFileToStorage(contribPhotoFile, "images");
                      }

                      if (contribType === "मेले") {
                        const newMela = {
                          name: contribTitle,
                          dateStr: contribDate,
                          location: contribLocation,
                          desc: contribText,
                        };
                        await addDoc(collection(db, "meles"), newMela);
                        showToast("नया मेला सफलतापूर्वक जोड़ा गया!");
                      } else if (contribType === "बधाई संदेश") {
                        const newBadhai = {
                          name: contribTitle,
                          photoUrl: finalPhotoUrl,
                          text: contribText,
                          isActive: true,
                        };
                        await addDoc(collection(db, "badhais"), newBadhai);
                        showToast("नया बधाई संदेश सफलतापूर्वक जोड़ा गया!");
                      } else if (contribType === "आवश्यक सूचना") {
                        const newNotice = {
                          title: contribTitle,
                          text: contribText,
                          isActive: true,
                        };
                        await addDoc(collection(db, "notices"), newNotice);
                        showToast("नई आवश्यक सूचना सफलतापूर्वक जोड़ी गई!");
                      } else {
                        const newContent: any = {
                          title: contribTitle,
                          text: contribText,
                          audioUrl: finalAudioUrl,
                          author: "Admin",
                        };
                        if (contribSequence !== "") {
                          newContent.sequence = Number(contribSequence);
                        }

                        if (contribType === "शब्द") {
                          await addDoc(collection(db, "shabads"), newContent);
                          showToast("नया शब्द सफलतापूर्वक जोड़ा गया!");
                        } else if (contribType === "भजन") {
                          await addDoc(collection(db, "bhajans"), newContent);
                          showToast("नया भजन सफलतापूर्वक जोड़ा गया!");
                        } else if (contribType === "आरती") {
                          await addDoc(collection(db, "aartis"), newContent);
                          showToast("नई आरती सफलतापूर्वक जोड़ी गई!");
                        } else if (contribType === "मंत्र") {
                          await addDoc(collection(db, "mantras"), newContent);
                          showToast("नया मंत्र सफलतापूर्वक जोड़ा गया!");
                        } else if (contribType === "साखी") {
                          await addDoc(collection(db, "sakhis"), newContent);
                          showToast("नई साखी सफलतापूर्वक जोड़ी गई!");
                        } else if (contribType === "सुविचार") {
                          await addDoc(collection(db, "thoughts"), { text: contribText, author: contribAuthor || "गुरु जम्भेश्वर" });
                          showToast("नया सुविचार सफलतापूर्वक जोड़ा गया!");
                        }
                        
                        // Send Notification
                        await addDoc(collection(db, "notifications"), {
                          title: `नया ${contribType} जोड़ा गया`,
                          message: `नया ${contribType} "${contribTitle}" ऐप में जोड़ दिया गया है।`,
                          date: "अभी",
                          read: false,
                        });
                      }

                      setContribTitle("");
                      setContribText("");
                      setContribAudio("");
                      setContribSequence("");
                      setContribType("शब्द");
                      setContribDate("");
                      setContribLocation("");
                      setContribPhotoUrl("");
                      setContribAudioFile(null);
                      setContribPhotoFile(null);
                    } catch (error: any) {
                      if (error.message?.includes("Missing or insufficient permissions")) {
                        showToast("जोड़ने की अनुमति नहीं है। कृपया Firebase Console में Firestore Security Rules को अपडेट करें (allow write: if request.auth != null;).");
                      } else {
                        showToast("सामग्री जोड़ने में त्रुटि हुई।");
                      }
                    } finally {
                      setIsSubmitting(false);
                    }
                  }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-sm mb-1">
                        प्रकार (Type)
                      </label>
                      <select
                        value={contribType}
                        onChange={(e) => setContribType(e.target.value)}
                        className="w-full p-3 rounded-xl border border-ink/20 bg-white focus:border-accent outline-none transition-colors"
                      >
                        <option>शब्द</option>
                        <option>भजन</option>
                        <option>आरती</option>
                        <option>साखी</option>
                        <option>मंत्र</option>
                        <option>सुविचार</option>
                        <option>मेले</option>
                        <option>बधाई संदेश</option>
                        <option>आवश्यक सूचना</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-sm mb-1">
                        क्रम (Sequence)
                      </label>
                      <input
                        type="number"
                        value={contribSequence}
                        onChange={(e) => setContribSequence(e.target.value ? Number(e.target.value) : "")}
                        placeholder="Ex: 1, 2, 3..."
                        className="w-full p-3 rounded-xl border border-ink/20 bg-white focus:border-accent outline-none transition-colors"
                      />
                    </div>
                  </div>

                  {contribType !== "सुविचार" && contribType !== "मेले" && (
                    <>
                      <div>
                        <label className="block font-bold text-sm mb-1">
                          {contribType === "बधाई संदेश" ? "नाम (Name)" : "शीर्षक (Title)"}
                        </label>
                        <input
                          value={contribTitle}
                          onChange={(e) => setContribTitle(e.target.value)}
                          required
                          type="text"
                          className="w-full p-3 rounded-xl border border-ink/20 bg-white focus:border-accent outline-none transition-colors"
                          placeholder={contribType === "बधाई संदेश" ? "नाम लिखें..." : "शीर्षक लिखें..."}
                        />
                      </div>
                      {contribType !== "आवश्यक सूचना" && contribType !== "बधाई संदेश" && (
                      <div>
                        <label className="block font-bold text-sm mb-1">
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
                                onChange={(e) => handleFileSelect(e, (file) => {
                                  setContribAudioFile(file);
                                  if (file) setContribAudio("");
                                }, false, setContribAudioError)}
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
                      )}
                    </>
                  )}

                  {contribType === "बधाई संदेश" && (
                    <>
                      <div>
                        <label className="block font-bold text-sm mb-1">
                          बधाई संदेश की हेडिंग (Greeting Heading)
                        </label>
                        <input
                          value={contribTitle}
                          onChange={(e) => setContribTitle(e.target.value)}
                          required
                          type="text"
                          className="w-full p-3 rounded-xl border border-ink/20 bg-white focus:border-accent outline-none transition-colors"
                          placeholder="हेडिंग लिखें..."
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-sm mb-1">
                          फोटो लिंक (Photo URL) या फोटो अपलोड करें
                        </label>
                        <div className="flex flex-col gap-2">
                          <div className="flex gap-2">
                            <input
                              value={contribPhotoUrl}
                              onChange={(e) => {
                                setContribPhotoUrl(e.target.value);
                                if (e.target.value) setContribPhotoFile(null);
                              }}
                              required={!contribPhotoFile}
                              type="url"
                              className="flex-1 p-3 rounded-xl border border-ink/20 bg-white focus:border-accent outline-none transition-colors"
                              placeholder="https://..."
                            />
                            <label className="flex items-center justify-center px-4 bg-accent/10 text-accent-dark rounded-xl cursor-pointer hover:bg-accent/20 transition-colors whitespace-nowrap">
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleFileSelect(e, (file) => {
                                  setContribPhotoFile(file);
                                  if (file) setContribPhotoUrl("");
                                }, true, setContribPhotoError)}
                              />
                              <Upload className="w-5 h-5" />
                            </label>
                          </div>
                          {contribPhotoError && (
                            <motion.div 
                              initial={{ opacity: 0, y: -5 }} 
                              animate={{ opacity: 1, y: 0 }} 
                              className="mt-2 p-2 bg-red-50 text-red-600 rounded-lg text-xs font-medium flex items-center gap-2 justify-center text-center border border-red-100"
                            >
                              <AlertCircle className="w-4 h-4 flex-shrink-0" />
                              <span>{contribPhotoError}</span>
                            </motion.div>
                          )}
                          {contribPhotoFile && !contribPhotoError && (
                            <p className="text-xs text-green-600 font-medium">चयनित: {contribPhotoFile.name}</p>
                          )}
                          {uploadProgress !== null && (
                            <div className="w-full bg-ink/10 rounded-full h-1.5 mt-1">
                              <div className="bg-accent h-1.5 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  {contribType === "मेले" && (
                    <>
                      <div>
                        <label className="block font-bold text-sm mb-1">
                          मेले का नाम (Name)
                        </label>
                        <input
                          value={contribTitle}
                          onChange={(e) => setContribTitle(e.target.value)}
                          required
                          type="text"
                          className="w-full p-3 rounded-xl border border-ink/20 bg-white focus:border-accent outline-none transition-colors"
                          placeholder="मेले का नाम..."
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-sm mb-1">
                          तिथि (Date)
                        </label>
                        <input
                          value={contribDate}
                          onChange={(e) => setContribDate(e.target.value)}
                          required
                          type="date"
                          className="w-full p-3 rounded-xl border border-ink/20 bg-white focus:border-accent outline-none transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-sm mb-1">
                          स्थान (Location)
                        </label>
                        <input
                          value={contribLocation}
                          onChange={(e) => setContribLocation(e.target.value)}
                          required
                          type="text"
                          className="w-full p-3 rounded-xl border border-ink/20 bg-white focus:border-accent outline-none transition-colors"
                          placeholder="स्थान..."
                        />
                      </div>
                    </>
                  )}

                  <div>
                    <label className="block font-bold text-sm mb-1">
                      {contribType === "सुविचार"
                        ? "सुविचार (Thought)"
                        : contribType === "मेले"
                          ? "विवरण (Description)"
                          : contribType === "बधाई संदेश"
                            ? "बधाई संदेश - 25-30 शब्द (Greeting Message)"
                            : contribType === "आवश्यक सूचना"
                              ? "सूचना का विवरण (Notice Details)"
                              : "पाठ (Text / Lyrics)"}
                    </label>
                    {contribType === "सुविचार" && (
                      <div className="mb-4">
                        <label className="block font-bold text-sm mb-1">
                          लेखक (Author)
                        </label>
                        <input
                          value={contribAuthor}
                          onChange={(e) => setContribAuthor(e.target.value)}
                          type="text"
                          className="w-full p-3 rounded-xl border border-ink/20 bg-white focus:border-accent outline-none transition-colors"
                          placeholder="गुरु जम्भेश्वर"
                        />
                      </div>
                    )}
                    <textarea
                      value={contribText}
                      onChange={(e) => setContribText(e.target.value)}
                      required
                      className="w-full p-3 rounded-xl border border-ink/20 bg-white h-32 focus:border-accent outline-none transition-colors"
                      placeholder="यहाँ लिखें..."
                    ></textarea>
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-accent to-accent-dark text-white font-bold py-3.5 rounded-xl shadow-md hover:shadow-lg transition-all"
                  >
                    जोड़ें (Add)
                  </button>
                </form>
              </div>

              {/* Manage Content Section */}
              <div className="bg-white/90 p-6 rounded-3xl shadow-sm border border-ink/10">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2 border-b border-ink/10 pb-2">
                  <Edit3 className="w-5 h-5" /> सामग्री प्रबंधित करें (Manage
                  Content)
                </h2>

                <div className="space-y-6">
                  {/* Shabads */}
                  <div>
                    <h3 className="font-bold text-lg mb-2 text-accent-dark">
                      सबदवाणी
                    </h3>
                    <div className="max-h-40 overflow-y-auto space-y-2 pr-2">
                      {(sabads || []).map((s) => (
                        <div
                          key={s.id}
                          className="flex items-center justify-between bg-paper p-3 rounded-xl border border-ink/5"
                        >
                          <span className="font-medium truncate flex-1">
                            {s.title}
                          </span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => openEditModal("शब्द", s)}
                              className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete("शब्द", s.id)}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Aartis */}
                  <div>
                    <h3 className="font-bold text-lg mb-2 text-accent-dark">
                      आरती
                    </h3>
                    <div className="max-h-40 overflow-y-auto space-y-2 pr-2">
                      {(aartis || []).map((m) => (
                        <div
                          key={m.id}
                          className="flex items-center justify-between bg-paper p-3 rounded-xl border border-ink/5"
                        >
                          <span className="font-medium truncate flex-1">
                            {m.title}
                          </span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => openEditModal("आरती", m)}
                              className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete("आरती", m.id)}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Bhajans */}
                  <div>
                    <h3 className="font-bold text-lg mb-2 text-accent-dark">
                      भजन
                    </h3>
                    <div className="max-h-40 overflow-y-auto space-y-2 pr-2">
                      {(bhajans || []).map((m) => (
                        <div
                          key={m.id}
                          className="flex items-center justify-between bg-paper p-3 rounded-xl border border-ink/5"
                        >
                          <span className="font-medium truncate flex-1">
                            {m.title}
                          </span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => openEditModal("भजन", m)}
                              className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete("भजन", m.id)}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Sakhis */}
                  <div>
                    <h3 className="font-bold text-lg mb-2 text-accent-dark">
                      साखी
                    </h3>
                    <div className="max-h-40 overflow-y-auto space-y-2 pr-2">
                      {(sakhis || []).map((m) => (
                        <div
                          key={m.id}
                          className="flex items-center justify-between bg-paper p-3 rounded-xl border border-ink/5"
                        >
                          <span className="font-medium truncate flex-1">
                            {m.title}
                          </span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => openEditModal("साखी", m)}
                              className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete("साखी", m.id)}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Mantras */}
                  <div>
                    <h3 className="font-bold text-lg mb-2 text-accent-dark">
                      मंत्र
                    </h3>
                    <div className="max-h-40 overflow-y-auto space-y-2 pr-2">
                      {(mantras || []).map((m) => (
                        <div
                          key={m.id}
                          className="flex items-center justify-between bg-paper p-3 rounded-xl border border-ink/5"
                        >
                          <span className="font-medium truncate flex-1">
                            {m.title}
                          </span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => openEditModal("मंत्र", m)}
                              className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete("मंत्र", m.id)}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Thoughts */}
                  <div>
                    <h3 className="font-bold text-lg mb-2 text-accent-dark">
                      सुविचार
                    </h3>
                    <div className="max-h-40 overflow-y-auto space-y-2 pr-2">
                      {(thoughts || []).map((t, i) => (
                        <div
                          key={t.id}
                          className="flex items-center justify-between bg-paper p-3 rounded-xl border border-ink/5"
                        >
                          <span className="font-medium truncate flex-1 text-sm">
                            {t.text}
                          </span>
                          <div className="flex gap-2">
                            <button
                              onClick={() =>
                                openEditModal("सुविचार", t, i)
                              }
                              className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete("सुविचार", t.id, i)}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Meles */}
                  <div>
                    <h3 className="font-bold text-lg mb-2 text-accent-dark">
                      मेले
                    </h3>
                    <div className="max-h-40 overflow-y-auto space-y-2 pr-2">
                      {(meles || []).map((m, i) => (
                        <div
                          key={m.id}
                          className="flex items-center justify-between bg-paper p-3 rounded-xl border border-ink/5"
                        >
                          <span className="font-medium truncate flex-1 text-sm">
                            {m.name} - {m.dateStr}
                          </span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => openEditModal("मेले", m, i)}
                              className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete("मेले", m.id, i)}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Badhais */}
                  <div>
                    <h3 className="font-bold text-lg mb-2 text-accent-dark">
                      बधाई संदेश
                    </h3>
                    <div className="max-h-40 overflow-y-auto space-y-2 pr-2">
                      {(badhais || []).map((b) => (
                        <div
                          key={b.id}
                          className={`flex items-center justify-between bg-paper p-3 rounded-xl border border-ink/5 transition-opacity ${!b.isActive ? "opacity-50" : "opacity-100"}`}
                        >
                          <span className="font-medium truncate flex-1 text-sm">
                            {b.name}
                          </span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => toggleBadhaiStatus(b.id, b.isActive)}
                              className={`p-1.5 rounded-lg ${b.isActive ? "text-orange-500 hover:bg-orange-50" : "text-green-500 hover:bg-green-50"}`}
                              title={b.isActive ? "Pause" : "Resume"}
                            >
                              {b.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => openEditModal("बधाई संदेश", b)}
                              className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete("बधाई संदेश", b.id)}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Notices */}
                  <div>
                    <h3 className="font-bold text-lg mb-2 text-accent-dark">
                      आवश्यक सूचना
                    </h3>
                    <div className="max-h-40 overflow-y-auto space-y-2 pr-2">
                      {(notices || []).map((n) => (
                        <div
                          key={n.id}
                          className={`flex items-center justify-between bg-paper p-3 rounded-xl border border-ink/5 transition-opacity ${!n.isActive ? "opacity-50" : "opacity-100"}`}
                        >
                          <span className="font-medium truncate flex-1 text-sm">
                            {n.title}
                          </span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => toggleNoticeStatus(n.id, n.isActive)}
                              className={`p-1.5 rounded-lg ${n.isActive ? "text-orange-500 hover:bg-orange-50" : "text-green-500 hover:bg-green-50"}`}
                              title={n.isActive ? "Pause" : "Resume"}
                            >
                              {n.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => openEditModal("आवश्यक सूचना", n)}
                              className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete("आवश्यक सूचना", n.id)}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Settings Section */}
              <div className="bg-white/90 p-6 rounded-3xl shadow-sm border border-ink/10">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2 border-b border-ink/10 pb-2">
                  <Settings className="w-5 h-5" /> App Settings
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block font-bold text-sm mb-1">
                      Logo URL या अपलोड करें
                    </label>
                    <div className="flex flex-col gap-2">
                      <div className="flex gap-2">
                        <input
                          type="url"
                          value={settings.logoUrl}
                          onChange={(e) =>
                            setSettings({ ...settings, logoUrl: e.target.value })
                          }
                          className="flex-1 p-2 rounded-lg border border-ink/20 bg-white text-sm"
                        />
                        <label className="flex items-center justify-center px-3 bg-accent/10 text-accent-dark rounded-lg cursor-pointer hover:bg-accent/20 transition-colors">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleFileSelect(e, setSettingsLogoFile, true)}
                          />
                          <Upload className="w-4 h-4" />
                        </label>
                      </div>
                      {settingsLogoFile && (
                        <p className="text-xs text-green-600 font-medium mt-1">चयनित: {settingsLogoFile.name}</p>
                      )}
                      {uploadProgress !== null && (
                        <div className="w-full bg-ink/10 rounded-full h-1 mt-1">
                          <div className="bg-accent h-1 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block font-bold text-sm mb-1">
                      UPI ID
                    </label>
                    <input
                      type="text"
                      value={settings.upiId}
                      onChange={(e) =>
                        setSettings({ ...settings, upiId: e.target.value })
                      }
                      className="w-full p-2 rounded-lg border border-ink/20 bg-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-sm mb-1">
                      QR Code URL या अपलोड करें
                    </label>
                    <div className="flex flex-col gap-2">
                      <div className="flex gap-2">
                        <input
                          type="url"
                          value={settings.qrCodeUrl}
                          onChange={(e) =>
                            setSettings({ ...settings, qrCodeUrl: e.target.value })
                          }
                          className="flex-1 p-2 rounded-lg border border-ink/20 bg-white text-sm"
                        />
                        <label className="flex items-center justify-center px-3 bg-accent/10 text-accent-dark rounded-lg cursor-pointer hover:bg-accent/20 transition-colors">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleFileSelect(e, setSettingsQrCodeFile, true)}
                          />
                          <Upload className="w-4 h-4" />
                        </label>
                      </div>
                      {settingsQrCodeFile && (
                        <p className="text-xs text-green-600 font-medium mt-1">चयनित: {settingsQrCodeFile.name}</p>
                      )}
                      {uploadProgress !== null && (
                        <div className="w-full bg-ink/10 rounded-full h-1 mt-1">
                          <div className="bg-accent h-1 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block font-bold text-sm mb-1">
                      Ad Banner Text
                    </label>
                    <input
                      type="text"
                      value={settings.adText}
                      onChange={(e) =>
                        setSettings({ ...settings, adText: e.target.value })
                      }
                      className="w-full p-2 rounded-lg border border-ink/20 bg-white text-sm mb-4"
                    />
                  </div>
                  <div className="flex items-center gap-3 mb-4">
                    <label className="font-bold text-sm">विज्ञापन दिखाएं (Show Ad)</label>
                    <button
                      type="button"
                      onClick={() => setSettings({ ...settings, isAdEnabled: settings.isAdEnabled !== false ? false : true })}
                      className={`w-12 h-6 rounded-full transition-colors relative ${settings.isAdEnabled !== false ? 'bg-green-500' : 'bg-gray-300'}`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all ${settings.isAdEnabled !== false ? 'left-6' : 'left-0.5'}`}></div>
                    </button>
                  </div>
                  <div>
                    <label className="block font-bold text-sm mb-1">
                      Ad Banner Link (Optional)
                    </label>
                    <input
                      type="url"
                      value={settings.adLink || ""}
                      onChange={(e) =>
                        setSettings({ ...settings, adLink: e.target.value })
                      }
                      placeholder="https://example.com"
                      className="w-full p-2 rounded-lg border border-ink/20 bg-white text-sm mb-4"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-sm mb-1">
                      जाप माला ऑडियो (Jaap Audio URL)
                    </label>
                    <div className="flex flex-col gap-2">
                      <div className="flex gap-2">
                        <input
                          type="url"
                          value={settings.jaapAudioUrl || ""}
                          onChange={(e) =>
                            setSettings({ ...settings, jaapAudioUrl: e.target.value })
                          }
                          placeholder="https://example.com/audio.mp3"
                          className="flex-1 p-2 rounded-lg border border-ink/20 bg-white text-sm"
                        />
                        <label className="flex items-center justify-center px-3 bg-accent/10 text-accent-dark rounded-lg cursor-pointer hover:bg-accent/20 transition-colors">
                          <input
                            type="file"
                            accept="audio/*,.mp3,.aac,.m4a,.wav,.ogg"
                            className="hidden"
                            onChange={(e) => handleFileSelect(e, setSettingsJaapAudioFile, false)}
                          />
                          <Upload className="w-4 h-4" />
                        </label>
                      </div>
                      {settingsJaapAudioFile && (
                        <p className="text-xs text-green-600 font-medium mt-1">चयनित: {settingsJaapAudioFile.name}</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={handleSaveSettings}
                    className="w-full bg-accent text-white font-bold py-3 rounded-xl hover:bg-accent-dark transition-colors"
                  >
                    Save Settings
                  </button>
                </div>
              </div>

              {/* Pending Posts Section */}
              <div className="bg-white/90 p-6 rounded-3xl shadow-sm border border-ink/10">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2 border-b border-ink/10 pb-2">
                  <BookOpenText className="w-5 h-5" /> Pending Approvals (
                  {(pendingPosts || []).length})
                </h2>
                <div className="space-y-4">
                  {(pendingPosts || []).length === 0 ? (
                    <p className="text-ink-light text-center py-4">
                      No pending posts.
                    </p>
                  ) : (
                    (pendingPosts || []).map((post: any) => (
                      <div
                        key={post.id}
                        className="bg-paper p-4 rounded-xl border border-ink/10"
                      >
                        <h3 className="font-bold text-lg">{post.title}</h3>
                        <p className="text-xs text-ink-light mb-2">
                          By: {post.author} | Type: {post.type}
                        </p>
                        <div className="text-sm mb-3 bg-white/50 p-3 rounded break-words max-h-60 overflow-y-auto whitespace-pre-wrap">
                          {post.text}
                        </div>
                        {post.audioUrl && (
                          <div className="mb-3">
                            <audio controls src={post.audioUrl} crossOrigin="anonymous" className="w-full h-10" />
                          </div>
                        )}
                        <div className="flex gap-2">
                          <button
                            onClick={() => approvePost(post)}
                            className="flex-1 bg-green-500 text-white py-2 rounded-lg font-bold flex items-center justify-center gap-1"
                          >
                            <CheckCircle className="w-4 h-4" /> Approve
                          </button>
                          <button
                            onClick={() => rejectPost(post)}
                            className="flex-1 bg-red-500 text-white py-2 rounded-lg font-bold flex items-center justify-center gap-1"
                          >
                            <XCircle className="w-4 h-4" /> Reject
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Edit Modal */}
            {editModalOpen && editItemData && (
              <div className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
                  <h2 className="text-xl font-bold mb-4">
                    संपादित करें (Edit)
                  </h2>
                  <form onSubmit={handleEditSave} className="space-y-4">
                    {editItemData.type !== "सुविचार" &&
                      editItemData.type !== "मेले" &&
                      editItemData.type !== "बधाई संदेश" && (
                        <>
                          <div>
                            <label className="block font-bold text-sm mb-1">
                              शीर्षक (Title)
                            </label>
                            <input
                              value={editItemData.title || ""}
                              onChange={(e) =>
                                setEditItemData({
                                  ...editItemData,
                                  title: e.target.value,
                                })
                              }
                              required
                              type="text"
                              className="w-full p-3 rounded-xl border border-ink/20 bg-white focus:border-accent outline-none"
                            />
                          </div>
                          {editItemData.type !== "आवश्यक सूचना" && (
                            <>
                              <div>
                                <label className="block font-bold text-sm mb-1">
                                  ऑडियो लिंक (Audio URL) या अपलोड करें
                                </label>
                            <div className="flex flex-col gap-2">
                              <div className="flex gap-2">
                                <input
                                  value={editItemData.audioUrl || ""}
                                  onChange={(e) =>
                                    setEditItemData({
                                      ...editItemData,
                                      audioUrl: e.target.value,
                                      audioFile: e.target.value ? null : editItemData.audioFile
                                    })
                                  }
                                  type="url"
                                  className="flex-1 p-3 rounded-xl border border-ink/20 bg-white focus:border-accent outline-none"
                                />
                                <label className="flex items-center justify-center px-4 bg-accent/10 text-accent-dark rounded-xl cursor-pointer hover:bg-accent/20 transition-colors whitespace-nowrap">
                                  <input
                                    type="file"
                                    accept="audio/*,.mp3,.aac,.m4a,.wav,.ogg"
                                    className="hidden"
                                    onChange={(e) => {
                                      handleFileSelect(e, (file) => setEditItemData({ ...editItemData, audioFile: file, audioUrl: file ? "" : editItemData.audioUrl }), false, setEditAudioError);
                                    }}
                                  />
                                  <Upload className="w-5 h-5" />
                                </label>
                              </div>
                              {editAudioError && (
                                <motion.div 
                                  initial={{ opacity: 0, y: -5 }} 
                                  animate={{ opacity: 1, y: 0 }} 
                                  className="mt-2 p-2 bg-red-50 text-red-600 rounded-lg text-xs font-medium flex items-center gap-2 justify-center text-center border border-red-100"
                                >
                                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                  <span>{editAudioError}</span>
                                </motion.div>
                              )}
                              {editItemData.audioFile && !editAudioError && (
                                <p className="text-xs text-green-600 font-medium">चयनित: {editItemData.audioFile.name}</p>
                              )}
                              {uploadProgress !== null && (
                                <div className="w-full bg-ink/10 rounded-full h-1.5 mt-1">
                                  <div className="bg-accent h-1.5 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                                </div>
                              )}
                            </div>
                          </div>
                          <div>
                            <label className="block font-bold text-sm mb-1">
                              क्रम (Sequence)
                            </label>
                            <input
                              value={editItemData.sequence || ""}
                              onChange={(e) =>
                                setEditItemData({
                                  ...editItemData,
                                  sequence: e.target.value ? Number(e.target.value) : "",
                                })
                              }
                              type="number"
                              className="w-full p-3 rounded-xl border border-ink/20 bg-white focus:border-accent outline-none"
                            />
                          </div>
                          </>
                          )}
                        </>
                      )}
                    {editItemData.type === "मेले" && (
                      <>
                        <div>
                          <label className="block font-bold text-sm mb-1">
                            मेले का नाम (Name)
                          </label>
                          <input
                            value={editItemData.name || ""}
                            onChange={(e) =>
                              setEditItemData({
                                ...editItemData,
                                name: e.target.value,
                              })
                            }
                            required
                            type="text"
                            className="w-full p-3 rounded-xl border border-ink/20 bg-white focus:border-accent outline-none"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-sm mb-1">
                            तिथि (Date)
                          </label>
                          <input
                            value={editItemData.dateStr || ""}
                            onChange={(e) =>
                              setEditItemData({
                                ...editItemData,
                                dateStr: e.target.value,
                              })
                            }
                            required
                            type="date"
                            className="w-full p-3 rounded-xl border border-ink/20 bg-white focus:border-accent outline-none"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-sm mb-1">
                            स्थान (Location)
                          </label>
                          <input
                            value={editItemData.location || ""}
                            onChange={(e) =>
                              setEditItemData({
                                ...editItemData,
                                location: e.target.value,
                              })
                            }
                            required
                            type="text"
                            className="w-full p-3 rounded-xl border border-ink/20 bg-white focus:border-accent outline-none"
                          />
                        </div>
                      </>
                    )}
                    {editItemData.type === "बधाई संदेश" && (
                      <>
                        <div>
                          <label className="block font-bold text-sm mb-1">
                            बधाई संदेश की हेडिंग (Greeting Heading)
                          </label>
                          <input
                            value={editItemData.name || ""}
                            onChange={(e) =>
                              setEditItemData({
                                ...editItemData,
                                name: e.target.value,
                              })
                            }
                            required
                            type="text"
                            className="w-full p-3 rounded-xl border border-ink/20 bg-white focus:border-accent outline-none"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-sm mb-1">
                            फोटो लिंक (Photo URL) या फोटो अपलोड करें
                          </label>
                          <div className="flex flex-col gap-2">
                            <div className="flex gap-2">
                              <input
                                value={editItemData.photoUrl || ""}
                                onChange={(e) =>
                                  setEditItemData({
                                    ...editItemData,
                                    photoUrl: e.target.value,
                                    photoFile: e.target.value ? null : editItemData.photoFile
                                  })
                                }
                                required={!editItemData.photoFile}
                                type="url"
                                className="flex-1 p-3 rounded-xl border border-ink/20 bg-white focus:border-accent outline-none"
                              />
                              <label className="flex items-center justify-center px-4 bg-accent/10 text-accent-dark rounded-xl cursor-pointer hover:bg-accent/20 transition-colors whitespace-nowrap">
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => {
                                    handleFileSelect(e, (file) => setEditItemData({ ...editItemData, photoFile: file, photoUrl: file ? "" : editItemData.photoUrl }), true, setEditPhotoError);
                                  }}
                                />
                                <Upload className="w-5 h-5" />
                              </label>
                            </div>
                            {editPhotoError && (
                              <motion.div 
                                initial={{ opacity: 0, y: -5 }} 
                                animate={{ opacity: 1, y: 0 }} 
                                className="mt-2 p-2 bg-red-50 text-red-600 rounded-lg text-xs font-medium flex items-center gap-2 justify-center text-center border border-red-100"
                              >
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                <span>{editPhotoError}</span>
                              </motion.div>
                            )}
                            {editItemData.photoFile && !editPhotoError && (
                              <p className="text-xs text-green-600 font-medium">चयनित: {editItemData.photoFile.name}</p>
                            )}
                            {uploadProgress !== null && (
                              <div className="w-full bg-ink/10 rounded-full h-1.5 mt-1">
                                <div className="bg-accent h-1.5 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                              </div>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                    <div>
                      <label className="block font-bold text-sm mb-1">
                        {editItemData.type === "सुविचार"
                          ? "सुविचार"
                          : editItemData.type === "मेले"
                            ? "विवरण (Description)"
                            : editItemData.type === "बधाई संदेश"
                              ? "बधाई संदेश (Greeting Message)"
                              : editItemData.type === "आवश्यक सूचना"
                                ? "सूचना का विवरण (Notice Details)"
                                : "पाठ (Text)"}
                      </label>
                      <textarea
                        value={editItemData.text || editItemData.desc || ""}
                        onChange={(e) =>
                          setEditItemData({
                            ...editItemData,
                            [editItemData.type === "मेले" ? "desc" : "text"]:
                              e.target.value,
                          })
                        }
                        required
                        className="w-full p-3 rounded-xl border border-ink/20 bg-white h-32 focus:border-accent outline-none"
                      ></textarea>
                    </div>
                    {editItemData.type === "सुविचार" && (
                      <div>
                        <label className="block font-bold text-sm mb-1">
                          लेखक (Author)
                        </label>
                        <input
                          type="text"
                          value={editItemData.author || ""}
                          onChange={(e) =>
                            setEditItemData({
                              ...editItemData,
                              author: e.target.value,
                            })
                          }
                          className="w-full p-3 rounded-xl border border-ink/20 bg-white focus:border-accent outline-none"
                          placeholder="गुरु जम्भेश्वर"
                        />
                      </div>
                    )}
                    <div className="flex gap-3 mt-6">
                      <button
                        type="button"
                        onClick={() => setEditModalOpen(false)}
                        className="flex-1 bg-ink/10 text-ink font-bold py-3 rounded-xl"
                      >
                        रद्द करें
                      </button>
                      <button
                        type="submit"
                        className="flex-1 bg-accent text-white font-bold py-3 rounded-xl"
                      >
                        सेव करें
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </motion.div>
        
  );
}
