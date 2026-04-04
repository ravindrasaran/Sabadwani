import { useState, useEffect } from "react";
import { collection, onSnapshot, doc } from "firebase/firestore";
import { db } from "../firebase";
import { SabadItem, AppSettings } from "../types";

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

export const sortItems = (items: SabadItem[]) => {
  return items.sort((a, b) => {
    if (a.sequence !== undefined && b.sequence !== undefined) {
      return a.sequence - b.sequence;
    }
    if (a.sequence !== undefined) return -1;
    if (b.sequence !== undefined) return 1;
    
    const numA = parseInt(a.title.match(/\d+/)?.[0] || "999999");
    const numB = parseInt(b.title.match(/\d+/)?.[0] || "999999");
    if (numA !== numB) return numA - numB;
    return a.title.localeCompare(b.title);
  });
};

export function useSabadData() {
  const [isLoading, setIsLoading] = useState(true);
  const [sabads, setSabads] = useState<SabadItem[]>([]);
  const [aartis, setAartis] = useState<SabadItem[]>([]);
  const [bhajans, setBhajans] = useState<SabadItem[]>([]);
  const [sakhis, setSakhis] = useState<SabadItem[]>([]);
  const [mantras, setMantras] = useState<SabadItem[]>([]);
  const [thoughts, setThoughts] = useState<any[]>([]);
  const [meles, setMeles] = useState<any[]>([]);
  const [notices, setNotices] = useState<any[]>([]);
  const [badhais, setBadhais] = useState<any[]>([]);
  const [pendingPosts, setPendingPosts] = useState<SabadItem[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    logoUrl: "",
    qrCodeUrl: "",
    upiId: "",
    jaapAudioUrl: "",
    adText: "",
    adLink: "",
    isAdEnabled: true
  });

  useEffect(() => {
    if (!db) return;

    const unsubSabads = onSnapshot(collection(db, "shabads"), (snapshot) => {
      if (!snapshot.empty) {
        const fetched = snapshot.docs.map((doc) => {
          const data = doc.data();
          let title = normalizeText(data.title);
          title = title.replace(/^\|\|\s*/, "").replace(/\s*\|\|$/, "");
          return { id: doc.id, ...data, title, text: normalizeText(data.text) } as SabadItem;
        });
        setSabads(sortItems(fetched));
      } else {
        setSabads([]);
      }
      setIsLoading(false);
    });
    const unsubAartis = onSnapshot(collection(db, "aartis"), (snapshot) => {
      if (!snapshot.empty) {
        const fetched = snapshot.docs.map((doc) => {
          const data = doc.data();
          let title = normalizeText(data.title);
          title = title.replace(/^\|\|\s*/, "").replace(/\s*\|\|$/, "");
          return { id: doc.id, ...data, title, text: normalizeText(data.text) } as SabadItem;
        });
        setAartis(sortItems(fetched));
      } else {
        setAartis([]);
      }
    });
    const unsubBhajans = onSnapshot(collection(db, "bhajans"), (snapshot) => {
      if (!snapshot.empty) {
        const fetched = snapshot.docs.map((doc) => {
          const data = doc.data();
          let title = normalizeText(data.title);
          title = title.replace(/^\|\|\s*/, "").replace(/\s*\|\|$/, "");
          return { id: doc.id, ...data, title, text: normalizeText(data.text) } as SabadItem;
        });
        setBhajans(sortItems(fetched));
      } else {
        setBhajans([]);
      }
    });
    const unsubSakhis = onSnapshot(collection(db, "sakhis"), (snapshot) => {
      if (!snapshot.empty) {
        const fetched = snapshot.docs.map((doc) => {
          const data = doc.data();
          let title = normalizeText(data.title);
          title = title.replace(/^\|\|\s*/, "").replace(/\s*\|\|$/, "");
          return { id: doc.id, ...data, title, text: normalizeText(data.text) } as SabadItem;
        });
        setSakhis(sortItems(fetched));
      } else {
        setSakhis([]);
      }
    });
    const unsubMantras = onSnapshot(collection(db, "mantras"), (snapshot) => {
      if (!snapshot.empty) {
        const fetched = snapshot.docs.map((doc) => {
          const data = doc.data();
          let title = normalizeText(data.title);
          title = title.replace(/^\|\|\s*/, "").replace(/\s*\|\|$/, "");
          const text = normalizeText(data.text);
          if (!title && text) {
            title = text.split('\n')[0].substring(0, 30) + "...";
          }
          return { id: doc.id, ...data, title, text } as SabadItem;
        });
        setMantras(sortItems(fetched));
      } else {
        setMantras([]);
      }
    });
    const unsubThoughts = onSnapshot(collection(db, "thoughts"), (snapshot) => {
      if (!snapshot.empty) {
        setThoughts(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data(), text: normalizeText(doc.data().text) })));
      } else {
        setThoughts([]);
      }
    });
    const unsubMeles = onSnapshot(collection(db, "meles"), (snapshot) => {
      if (!snapshot.empty) {
        setMeles(snapshot.docs.map((doc) => {
          const data = doc.data();
          return { id: doc.id, ...data, name: normalizeText(data.name), desc: normalizeText(data.desc), location: normalizeText(data.location) } as any;
        }));
      } else {
        setMeles([]);
      }
    });
    const unsubNotices = onSnapshot(collection(db, "notices"), (snapshot) => {
      if (!snapshot.empty) {
        setNotices(snapshot.docs.map((doc) => {
          const data = doc.data();
          return { id: doc.id, ...data, title: normalizeText(data.title), text: normalizeText(data.text) } as any;
        }));
      } else {
        setNotices([]);
      }
    });
    const unsubBadhais = onSnapshot(collection(db, "badhais"), (snapshot) => {
      if (!snapshot.empty) {
        setBadhais(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      } else {
        setBadhais([]);
      }
    });
    const unsubPending = onSnapshot(collection(db, "pendingPosts"), (snapshot) => {
      if (!snapshot.empty) {
        setPendingPosts(snapshot.docs.map((doc) => {
          const data = doc.data();
          return { id: doc.id, ...data, title: normalizeText(data.title), text: normalizeText(data.text) } as SabadItem;
        }));
      } else {
        setPendingPosts([]);
      }
    });
    const unsubSettings = onSnapshot(doc(db, "settings", "general"), (doc) => {
      if (doc.exists()) {
        setSettings((prev) => ({ ...prev, ...doc.data() }));
      }
    });

    return () => {
      unsubSabads();
      unsubAartis();
      unsubBhajans();
      unsubSakhis();
      unsubMantras();
      unsubThoughts();
      unsubMeles();
      unsubNotices();
      unsubBadhais();
      unsubPending();
      unsubSettings();
    };
  }, []);

  return { isLoading, sabads, aartis, bhajans, sakhis, mantras, thoughts, meles, notices, badhais, pendingPosts, settings, setSettings };
}
