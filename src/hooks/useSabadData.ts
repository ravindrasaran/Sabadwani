import { useState, useEffect, useTransition } from "react";
import {
  collection, query, orderBy,
  getDocs, getDocsFromCache,
  doc, getDoc, getDocFromCache,
  QuerySnapshot
} from "firebase/firestore";
import { db } from "../firebase";
import { SabadItem, AppSettings, Thought, Mele, Notice, Badhai } from "../types";

export const normalizeText = (text: any): string => {
  if (typeof text === 'string') return text;
  if (Array.isArray(text)) return text.map(t => normalizeText(t)).join('\n');
  if (typeof text === 'object' && text !== null) return normalizeText(text.text);
  return String(text || '');
};

// ── Collection query builders ─────────────────────────────────────────────────
const makeQuery = (collName: string, ordered: boolean) => {
  const ref = collection(db!, collName);
  return ordered ? query(ref, orderBy("sequence", "asc")) : ref;
};

// ── Per-collection mappers ────────────────────────────────────────────────────
const makeSabadMapper = (type: string) => (d: any): SabadItem => {
  const data = d.data();
  let title = normalizeText(data.title).replace(/^\|\|\s*/, "").replace(/\s*\|\|$/, "");
  const text = normalizeText(data.text);
  if (!title && text && type === "मंत्र") title = text.split('\n')[0].substring(0, 30) + "...";
  return { id: d.id, ...data, title, text, type: data.type || type };
};

const mapThought  = (d: any): Thought  => ({ id: d.id, text: normalizeText(d.data().text), author: d.data().author });
const mapMela     = (d: any): Mele     => ({ id: d.id, name: normalizeText(d.data().name), desc: normalizeText(d.data().desc), location: normalizeText(d.data().location), date: d.data().date, dateStr: d.data().dateStr });
const mapNotice   = (d: any): Notice   => ({ id: d.id, title: normalizeText(d.data().title), text: normalizeText(d.data().text), active: d.data().active, isActive: d.data().isActive ?? d.data().active });
const mapBadhai   = (d: any): Badhai   => ({ id: d.id, title: d.data().title || d.data().name || "", name: d.data().name || d.data().title || "", imageUrl: d.data().imageUrl || d.data().photoUrl, photoUrl: d.data().photoUrl || d.data().imageUrl, text: d.data().text || "", active: d.data().active, isActive: d.data().isActive ?? d.data().active });
const mapPending  = (d: any): SabadItem => ({ id: d.id, ...d.data(), title: normalizeText(d.data().title), text: normalizeText(d.data().text) });

const DEFAULT_SETTINGS: AppSettings = {
  logoUrl: "",
  qrCodeUrl: "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=ravindrasaran@icici&pn=Sabadwani",
  upiId: "ravindrasaran@icici",
  jaapAudioUrl: "",
  adText: "सबदवाणी PDF अभी डाउनलोड करें - बिल्कुल फ्री!",
  adLink: "",
  isAdEnabled: true
};

// ── Safely read a snapshot (returns null on cache miss) ───────────────────────
async function tryCache(q: any): Promise<QuerySnapshot | null> {
  try {
    const snap = await getDocsFromCache(q);
    return snap.empty ? null : snap;
  } catch (_) {
    return null;
  }
}

export function useSabadData() {
  const [isLoading, setIsLoading] = useState(true);
  const [sabads,      setSabads]      = useState<SabadItem[]>([]);
  const [aartis,      setAartis]      = useState<SabadItem[]>([]);
  const [bhajans,     setBhajans]     = useState<SabadItem[]>([]);
  const [sakhis,      setSakhis]      = useState<SabadItem[]>([]);
  const [mantras,     setMantras]     = useState<SabadItem[]>([]);
  const [thoughts,    setThoughts]    = useState<Thought[]>([]);
  const [meles,       setMeles]       = useState<Mele[]>([]);
  const [notices,     setNotices]     = useState<Notice[]>([]);
  const [badhais,     setBadhais]     = useState<Badhai[]>([]);
  const [pendingPosts,setPendingPosts]= useState<SabadItem[]>([]);
  const [settings,    setSettings]    = useState<AppSettings>(DEFAULT_SETTINGS);

  // startTransition marks server-refresh renders as non-urgent.
  // React will NOT block the current frame to apply them → zero visible jank
  // on the server-refresh path (stale-while-revalidate).
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (!db) return;
    let mounted = true;

    // ── Build all queries ───────────────────────────────────────────────────
    const queries = {
      sabads:      makeQuery("shabads",     true),
      aartis:      makeQuery("aartis",      true),
      bhajans:     makeQuery("bhajans",     true),
      sakhis:      makeQuery("sakhis",      true),
      mantras:     makeQuery("mantras",     true),
      thoughts:    makeQuery("thoughts",    false),
      meles:       makeQuery("meles",       false),
      notices:     makeQuery("notices",     false),
      badhais:     makeQuery("badhais",     false),
      pending:     makeQuery("pendingPosts",false),
    };
    const settingsRef = doc(db, "settings", "general");

    // ── Apply a complete data snapshot to state (ONE batch setState) ────────
    // React 18 batches all setState calls inside a single synchronous function,
    // so this entire block causes exactly ONE re-render, not 10.
    function applyAll(
      snaps: Record<string, QuerySnapshot | null>,
      settingsData: any | null
    ) {
      if (!mounted) return;

      // Only update collections that actually returned data
      if (snaps.sabads)   setSabads(snaps.sabads.docs.map(makeSabadMapper("शब्द")));
      if (snaps.aartis)   setAartis(snaps.aartis.docs.map(makeSabadMapper("आरती")));
      if (snaps.bhajans)  setBhajans(snaps.bhajans.docs.map(makeSabadMapper("भजन")));
      if (snaps.sakhis)   setSakhis(snaps.sakhis.docs.map(makeSabadMapper("साखी")));
      if (snaps.mantras)  setMantras(snaps.mantras.docs.map(makeSabadMapper("मंत्र")));
      if (snaps.thoughts) setThoughts(snaps.thoughts.docs.map(mapThought));
      if (snaps.meles)    setMeles(snaps.meles.docs.map(mapMela));
      if (snaps.notices)  setNotices(snaps.notices.docs.map(mapNotice));
      if (snaps.badhais)  setBadhais(snaps.badhais.docs.map(mapBadhai));
      if (snaps.pending)  setPendingPosts(snaps.pending.docs.map(mapPending));
      if (settingsData)   setSettings(prev => ({ ...prev, ...settingsData }));

      setIsLoading(false);
    }

    async function load() {
      // ── PHASE 1: Cache — all in parallel, single batch setState ──────────
      // All tryCache() calls run simultaneously via Promise.all.
      // If ANY collection has cache → we can show the full UI immediately.
      const [
        cachedSabads, cachedAartis, cachedBhajans, cachedSakhis, cachedMantras,
        cachedThoughts, cachedMeles, cachedNotices, cachedBadhais, cachedPending,
        cachedSettingsSnap,
      ] = await Promise.all([
        tryCache(queries.sabads),
        tryCache(queries.aartis),
        tryCache(queries.bhajans),
        tryCache(queries.sakhis),
        tryCache(queries.mantras),
        tryCache(queries.thoughts),
        tryCache(queries.meles),
        tryCache(queries.notices),
        tryCache(queries.badhais),
        tryCache(queries.pending),
        // Settings cache
        (async () => { try { const s = await getDocFromCache(settingsRef); return s.exists() ? s : null; } catch(_) { return null; } })(),
      ]);

      const hasCachedData = !!(cachedSabads || cachedAartis || cachedBhajans);

      if (hasCachedData && mounted) {
        // ONE render — all collections set simultaneously
        applyAll({
          sabads:   cachedSabads,
          aartis:   cachedAartis,
          bhajans:  cachedBhajans,
          sakhis:   cachedSakhis,
          mantras:  cachedMantras,
          thoughts: cachedThoughts,
          meles:    cachedMeles,
          notices:  cachedNotices,
          badhais:  cachedBadhais,
          pending:  cachedPending,
        }, cachedSettingsSnap?.data() || null);
      }

      // ── PHASE 2: Server — all in parallel, single batch setState ─────────
      // getDocs() returns the MERGED result (cache + server delta) automatically.
      // Run all fetches in parallel — whichever finishes last triggers the batch.
      try {
        const [
          serverSabads, serverAartis, serverBhajans, serverSakhis, serverMantras,
          serverThoughts, serverMeles, serverNotices, serverBadhais, serverPending,
          serverSettings,
        ] = await Promise.all([
          getDocs(queries.sabads),
          getDocs(queries.aartis),
          getDocs(queries.bhajans),
          getDocs(queries.sakhis),
          getDocs(queries.mantras),
          getDocs(queries.thoughts),
          getDocs(queries.meles),
          getDocs(queries.notices),
          getDocs(queries.badhais),
          getDocs(queries.pending),
          getDoc(settingsRef),
        ]);

        if (!mounted) return;

        // If we already showed cached data, wrap the server update in
        // startTransition so React defers this render and never blocks the UI.
        // The user sees cached content immediately; fresh data blends in smoothly.
        const apply = () => applyAll({
          sabads:   serverSabads,
          aartis:   serverAartis,
          bhajans:  serverBhajans,
          sakhis:   serverSakhis,
          mantras:  serverMantras,
          thoughts: serverThoughts,
          meles:    serverMeles,
          notices:  serverNotices,
          badhais:  serverBadhais,
          pending:  serverPending,
        }, serverSettings.exists() ? serverSettings.data() : null);

        if (hasCachedData) {
          startTransition(apply); // Low-priority update — no jank
        } else {
          apply(); // First install: no cache, apply directly
        }

      } catch (e) {
        // Fully offline and no cache — show empty state
        if (!hasCachedData && mounted) setIsLoading(false);
        console.warn("Offline — served from cache or empty state");
      }
    }

    load();

    // Safety valve: if both cache AND server fail within 4s, stop spinner
    const safety = setTimeout(() => { if (mounted) setIsLoading(false); }, 4000);

    return () => {
      mounted = false;
      clearTimeout(safety);
    };
  }, []);

  return {
    isLoading, sabads, aartis, bhajans, sakhis, mantras,
    thoughts, meles, notices, badhais, pendingPosts, settings, setSettings
  };
}
