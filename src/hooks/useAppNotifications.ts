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

const WELCOME_KEY = "hasSeenWelcome";
const READ_NOTIFS_KEY = "readNotifications";
const IGNORED_NOTIFS_KEY = "ignoredNotifications";
const APP_INIT_KEY = "app_initialized_v2";

export const useAppNotifications = (db: Firestore, showToast: (msg: string) => void) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [localPrefs, setLocalPrefs] = useState({
    hasSeenWelcome: false,
    isAppInit: false,
    ignoredIds: [] as string[],
    readIds: [] as string[]
  });

  // Hydrate preferences on mount
  useEffect(() => {
    const loadPrefs = async () => {
      try {
        const welcome = await Preferences.get({ key: WELCOME_KEY });
        const init = await Preferences.get({ key: APP_INIT_KEY });
        const ignored = await Preferences.get({ key: IGNORED_NOTIFS_KEY });
        const read = await Preferences.get({ key: READ_NOTIFS_KEY });
        
        let parsedIgnored: string[] = [];
        if (ignored.value) {
          try { parsedIgnored = JSON.parse(ignored.value); } catch (_) {}
        }
        
        let parsedRead: string[] = [];
        if (read.value) {
          try { parsedRead = JSON.parse(read.value); } catch (_) {}
        }
        
        setLocalPrefs({
          hasSeenWelcome: welcome.value === "true",
          isAppInit: init.value === "true",
          ignoredIds: parsedIgnored,
          readIds: parsedRead
        });
      } catch (e) {
        console.error("Failed to load native notification Preferences", e);
      } finally {
        setIsHydrated(true);
      }
    };
    loadPrefs();
  }, []);

  useEffect(() => {
    if (!db || !isHydrated) return;

    const unsubNotifications = onSnapshot(collection(db, "notifications"), async (snapshot) => {
      let fetchedNotifs: Notification[] = [];
      if (!snapshot.empty) {
        fetchedNotifs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Notification));
      }

      let currentIgnored = [...localPrefs.ignoredIds];
      let currentRead = [...localPrefs.readIds];

      // If this is the absolute first time the app is loading for this user:
      if (!localPrefs.isAppInit) {
        // We consider them a "fresh user". 
        // We want to HIDE all existing notifications from them forever.
        const currentDbNotifIds = fetchedNotifs.map(n => n.id);
        
        // Merge with any existing ignored ids just to be safe
        const mergedIgnored = Array.from(new Set([...currentIgnored, ...currentDbNotifIds]));
        currentIgnored = mergedIgnored;
        
        await Preferences.set({ key: IGNORED_NOTIFS_KEY, value: JSON.stringify(mergedIgnored) });
        await Preferences.set({ key: APP_INIT_KEY, value: "true" });

        setLocalPrefs(prev => ({
          ...prev,
          isAppInit: true,
          ignoredIds: mergedIgnored
        }));
      }

      // Filter out ignored notifications
      const visibleNotifs = fetchedNotifs.filter(n => !currentIgnored.includes(n.id));

      // Override "read" status based on local array
      let listNotifs = visibleNotifs.map(n => ({ ...n, read: currentRead.includes(n.id) }));

      // Inject local welcome notification if not seen
      if (!localPrefs.hasSeenWelcome) {
        listNotifs.unshift({
          id: "welcome",
          title: "स्वागत है!",
          message: "सबदवाणी ऐप में आपका स्वागत है। यहाँ आपको गुरु जम्भेश्वर भगवान की वाणी और बिश्नोई समाज की जानकारी मिलेगी।",
          date: "अभी",
          read: currentRead.includes("welcome"),
        });
      }

      setNotifications((prev) => {
        // check if there are new unread notifications that were just added
        const prevIds = new Set(prev.map(n => n.id));
        const added = listNotifs.filter(n => !prevIds.has(n.id) && n.id !== "welcome");
        
        // Only toast if we already had notifications loaded previously (prev.length > 0)
        // AND it's not the initial boot flash.
        if (added.length > 0 && prev.length > 0) {
          showToast(`नई सूचना: ${added[0].title}`);
        }
        return listNotifs;
      });
    });

    return () => unsubNotifications();
  }, [db, showToast, isHydrated, localPrefs]);

  const markRead = async (id: string) => {
    if (id === "welcome") {
      await Preferences.set({ key: WELCOME_KEY, value: "true" });
    }

    const currentRead = [...localPrefs.readIds];
    const newReadIds = Array.from(new Set([...currentRead, id]));
    await Preferences.set({ key: READ_NOTIFS_KEY, value: JSON.stringify(newReadIds) });
    
    setLocalPrefs(prev => ({
      ...prev,
      hasSeenWelcome: id === "welcome" ? true : prev.hasSeenWelcome,
      readIds: newReadIds
    }));

    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllRead = async () => {
    await Preferences.set({ key: WELCOME_KEY, value: "true" });

    const currentRead = [...localPrefs.readIds];
    const allNotifIds = notifications.map(n => n.id);
    const newReadIds = Array.from(new Set([...currentRead, ...allNotifIds]));
    await Preferences.set({ key: READ_NOTIFS_KEY, value: JSON.stringify(newReadIds) });

    setLocalPrefs(prev => ({
      ...prev,
      hasSeenWelcome: true,
      readIds: newReadIds
    }));

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


