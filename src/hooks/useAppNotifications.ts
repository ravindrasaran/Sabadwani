import { useState, useEffect } from "react";
import { collection, onSnapshot, Firestore } from "firebase/firestore";
import { Preferences } from "@capacitor/preferences";

export type Notification = {
  id: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
};

const WELCOME_KEY = "sabadwani_hasSeenWelcome";
const READ_NOTIFS_KEY = "sabadwani_readNotifications";
const IGNORED_NOTIFS_KEY = "sabadwani_ignoredNotifications";

const getPref = async (key: string, defaultValue: any) => {
  try {
    const { value } = await Preferences.get({ key });
    return value ? JSON.parse(value) : defaultValue;
  } catch {
    return defaultValue;
  }
};

const setPref = async (key: string, value: any) => {
  try {
    await Preferences.set({ key, value: JSON.stringify(value) });
  } catch {}
};

export const useAppNotifications = (db: Firestore, showToast: (msg: string) => void) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [readIds, setReadIds] = useState<string[]>([]);
  const [, setIgnoredIds] = useState<string[]>([]);
  const [, setHasSeenWelcomeState] = useState<boolean>(true);

  // Load preferences first
  useEffect(() => {
    const loadPrefs = async () => {
      const seenWelcome = await getPref(WELCOME_KEY, false);
      const read = await getPref(READ_NOTIFS_KEY, []);
      const ignored = await getPref(IGNORED_NOTIFS_KEY, []);
      
      setHasSeenWelcomeState(seenWelcome);
      setReadIds(read);
      setIgnoredIds(ignored);
    };
    loadPrefs();
  }, []);

  useEffect(() => {
    if (!db) return;

    const unsubNotifications = onSnapshot(collection(db, "notifications"), async (snapshot) => {
      let fetchedNotifs: Notification[] = [];
      if (!snapshot.empty) {
        fetchedNotifs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Notification));
      }

      // 1. Process prefs inline to avoid race conditions with state
      const seenWelcome = await getPref(WELCOME_KEY, false);
      let ignored = await getPref(IGNORED_NOTIFS_KEY, []);
      const read = await getPref(READ_NOTIFS_KEY, []);

      // NEW LOGIC: Old user detection.
      // If they have read notifications that are not just "welcome", they are an old user.
      const hasReadOtherNotifs = read.some((id: string) => id !== "welcome");
      
      if (!seenWelcome && hasReadOtherNotifs) {
        // Automatically consider an old user as having seen the welcome
        await setPref(WELCOME_KEY, true);
        setHasSeenWelcomeState(true);
      }

      // 2. Filter out ignored notifications
      const visibleNotifs = fetchedNotifs.filter(n => !ignored.includes(n.id));

      // 3. Override "read" status based on local array (don't trust global)
      let listNotifs = visibleNotifs.map(n => ({ ...n, read: read.includes(n.id) }));

      // 4. Fresh user guarantee: If they haven't seen welcome and aren't an old user,
      // they MUST only see the welcome notification.
      if (!seenWelcome && !hasReadOtherNotifs) {
        // Force list to only be the welcome notification
        listNotifs = [{
          id: "welcome",
          title: "स्वागत है!",
          message: "सबदवाणी ऐप में आपका स्वागत है। यहाँ आपको गुरु जम्भेश्वर भगवान की वाणी और बिश्नोई समाज की जानकारी मिलेगी।",
          date: "अभी",
          read: read.includes("welcome"),
        }];
        
        // Also ensure all currently fetched DB notifications are permanently ignored 
        // for this user so they don't suddenly appear when they mark Welcome as read.
        const unseenIds = fetchedNotifs.map(n => n.id).filter(id => !ignored.includes(id));
        if (unseenIds.length > 0) {
          ignored = [...ignored, ...unseenIds];
          await setPref(IGNORED_NOTIFS_KEY, ignored);
          setIgnoredIds(ignored);
        }
      }

      setNotifications((prev) => {
        const prevIds = new Set(prev.map((n) => n.id));
        const added = listNotifs.filter((n) => !prevIds.has(n.id) && n.id !== "welcome");
        if (added.length > 0 && prev.length > 0) {
          showToast(`नई सूचना: ${added[0].title}`);
        }
        return listNotifs;
      });
    });

    return () => unsubNotifications();
  }, [db, showToast]);

  const markRead = async (id: string) => {
    if (id === "welcome") {
      await setPref(WELCOME_KEY, true);
      setHasSeenWelcomeState(true);
    }

    const newReadIds = [...readIds, id];
    setReadIds([...new Set(newReadIds)]);
    await setPref(READ_NOTIFS_KEY, [...new Set(newReadIds)]);
    
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllRead = async () => {
    await setPref(WELCOME_KEY, true);
    setHasSeenWelcomeState(true);

    const allNotifIds = notifications.map(n => n.id);
    const newReadIds = [...readIds, ...allNotifIds];
    
    setReadIds([...new Set(newReadIds)]);
    await setPref(READ_NOTIFS_KEY, [...new Set(newReadIds)]);

    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return {
    showNotifications,
    setShowNotifications,
    notifications,
    unreadCount,
    markRead,
    markAllRead,
  };
};

