import { useState, useEffect } from "react";
import { collection, query, orderBy, getDocs, getDocsFromCache, doc, getDoc, getDocFromCache } from "firebase/firestore";
import { db } from "../firebase";
import { SabadItem, AppSettings, Thought, Mele, Notice, Badhai } from "../types";

export const normalizeText = (text: any): string => {
  if (typeof text === 'string') return text;
  if (Array.isArray(text)) {
    return text.map(t => normalizeText(t)).join('\n');
  }
  if (typeof text === 'object' && text !== null) {
    return normalizeText(text.text);
  }
  return String(text || '');
};

export function useSabadData() {
  const [isLoading, setIsLoading] = useState(true);
  const [sabads, setSabads] = useState<SabadItem[]>([]);
  const [aartis, setAartis] = useState<SabadItem[]>([]);
  const [bhajans, setBhajans] = useState<SabadItem[]>([]);
  const [sakhis, setSakhis] = useState<SabadItem[]>([]);
  const [mantras, setMantras] = useState<SabadItem[]>([]);
  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const [meles, setMeles] = useState<Mele[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [badhais, setBadhais] = useState<Badhai[]>([]);
  const [pendingPosts, setPendingPosts] = useState<SabadItem[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    logoUrl: "",
    qrCodeUrl: "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=ravindrasaran@icici&pn=Sabadwani",
    upiId: "ravindrasaran@icici",
    jaapAudioUrl: "",
    adText: "सबदवाणी PDF अभी डाउनलोड करें - बिल्कुल फ्री!",
    adLink: "",
    isAdEnabled: true
  });

  useEffect(() => {
    let mounted = true;

    async function fetchWithStaleWhileRevalidate(
      collName: string, 
      type: string, 
      setter: any, 
      hasSequence: boolean = true,
      customMapper?: (doc: any) => any
    ) {
      if (!db) return;
      
      let q = collection(db, collName) as any;
      if (hasSequence) {
        q = query(q, orderBy("sequence", "asc"));
      }

      const mapper = customMapper || ((docData: any) => {
        const data = docData.data();
        let title = normalizeText(data.title);
        title = title.replace(/^\|\|\s*/, "").replace(/\s*\|\|$/, "");
        const text = normalizeText(data.text);
        let finalTitle = title;
        if (!title && text && type === "मंत्र") {
          finalTitle = text.split('\n')[0].substring(0, 30) + "...";
        }
        return { id: docData.id, ...data, title: finalTitle, text, type: data.type || type } as any;
      });

      // 1. Instant UI Paint: Try Cache First
      try {
        const cacheSnap = await getDocsFromCache(q);
        if (!cacheSnap.empty && mounted) {
          setter(cacheSnap.docs.map(mapper));
          // If we successfully get Sabads from cache, we can turn off global loader instantly!
          if (collName === "shabads") setIsLoading(false); 
        }
      } catch (e) {
        // Cache miss
      }

      // 2. Background Sync: Fetch from Server
      try {
        const serverSnap = await getDocs(q); // Native getDocs is smart enough to do delta-sync to save quota
        if (mounted) {
          setter(serverSnap.docs.map(mapper));
          if (collName === "shabads") setIsLoading(false);
        }
      } catch (e) {
        // Complete offline scenario handled gracefully because cache is already there
        console.warn(`Offline sync failed for ${collName}`);
      }
    }

    async function loadSettings() {
      if (!db) return;
      const docRef = doc(db, "settings", "general");
      try {
        const cacheSnap = await getDocFromCache(docRef);
        if (cacheSnap.exists() && mounted) setSettings((prev) => ({ ...prev, ...cacheSnap.data() }));
      } catch(e) {}
      
      try {
        const serverSnap = await getDoc(docRef);
        if (serverSnap.exists() && mounted) setSettings((prev) => ({ ...prev, ...serverSnap.data() }));
      } catch(e) {}
    }

    if (db) {
      // Trigger all parallel load streams silently
      loadSettings();
      fetchWithStaleWhileRevalidate("shabads", "शब्द", setSabads, true);
      fetchWithStaleWhileRevalidate("aartis", "आरती", setAartis, true);
      fetchWithStaleWhileRevalidate("bhajans", "भजन", setBhajans, true);
      fetchWithStaleWhileRevalidate("sakhis", "साखी", setSakhis, true);
      fetchWithStaleWhileRevalidate("mantras", "मंत्र", setMantras, true);

      // Meta Collections without sequence ordering
      fetchWithStaleWhileRevalidate("thoughts", "thought", setThoughts, false, (doc) => ({ id: doc.id, text: normalizeText(doc.data().text), author: doc.data().author } as Thought));
      fetchWithStaleWhileRevalidate("meles", "mele", setMeles, false, (doc) => ({ id: doc.id, name: normalizeText(doc.data().name), desc: normalizeText(doc.data().desc), location: normalizeText(doc.data().location), date: doc.data().date, dateStr: doc.data().dateStr } as Mele));
      fetchWithStaleWhileRevalidate("notices", "notice", setNotices, false, (doc) => ({ id: doc.id, title: normalizeText(doc.data().title), text: normalizeText(doc.data().text), active: doc.data().active, isActive: doc.data().isActive ?? doc.data().active } as Notice));
      fetchWithStaleWhileRevalidate("badhais", "badhai", setBadhais, false, (doc) => ({ id: doc.id, title: doc.data().title || doc.data().name || "", name: doc.data().name || doc.data().title || "", imageUrl: doc.data().imageUrl || doc.data().photoUrl, photoUrl: doc.data().photoUrl || doc.data().imageUrl, text: doc.data().text || "", active: doc.data().active, isActive: doc.data().isActive ?? doc.data().active } as Badhai));
      fetchWithStaleWhileRevalidate("pendingPosts", "pending", setPendingPosts, false, (doc) => ({ id: doc.id, ...doc.data(), title: normalizeText(doc.data().title), text: normalizeText(doc.data().text) } as SabadItem));
      
      // Fallback timeout in case both cache and server fail to respond quickly
      setTimeout(() => { if(mounted) setIsLoading(false); }, 3000);
    }

    return () => { mounted = false; };
  }, []);

  return { isLoading, sabads, aartis, bhajans, sakhis, mantras, thoughts, meles, notices, badhais, pendingPosts, settings, setSettings };
}
