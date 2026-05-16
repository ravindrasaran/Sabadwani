import { useState, useEffect } from "react";
import { collection, onSnapshot, Firestore } from "firebase/firestore";

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

  useEffect(() => {
    if (!db) return;

    const unsubNotifications = onSnapshot(collection(db, "notifications"), (snapshot) => {
      let fetchedNotifs: Notification[] = [];
      if (!snapshot.empty) {
        fetchedNotifs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Notification));
      }

      // Synchronous LocalStorage checks
      const hasSeenWelcome = localStorage.getItem(WELCOME_KEY) === "true";
      const isAppInit = localStorage.getItem(APP_INIT_KEY) === "true";
      
      let ignoredIds: string[] = [];
      try {
        const storedIgnored = localStorage.getItem(IGNORED_NOTIFS_KEY);
        if (storedIgnored) ignoredIds = JSON.parse(storedIgnored);
      } catch (e) {}

      let readIds: string[] = [];
      try {
        const storedRead = localStorage.getItem(READ_NOTIFS_KEY);
        if (storedRead) readIds = JSON.parse(storedRead);
      } catch (e) {}

      // If this is the absolute first time the app is loading for this user:
      if (!isAppInit) {
        // We consider them a "fresh user". 
        // We want to HIDE all existing notifications from them forever.
        const currentDbNotifIds = fetchedNotifs.map(n => n.id);
        
        // Merge with any existing ignored ids just to be safe
        const mergedIgnored = Array.from(new Set([...ignoredIds, ...currentDbNotifIds]));
        ignoredIds = mergedIgnored;
        
        localStorage.setItem(IGNORED_NOTIFS_KEY, JSON.stringify(mergedIgnored));
        localStorage.setItem(APP_INIT_KEY, "true");
      }

      // Filter out ignored notifications
      const visibleNotifs = fetchedNotifs.filter(n => !ignoredIds.includes(n.id));

      // Override "read" status based on local array
      let listNotifs = visibleNotifs.map(n => ({ ...n, read: readIds.includes(n.id) }));

      // Inject local welcome notification if not seen
      if (!hasSeenWelcome) {
        listNotifs.unshift({
          id: "welcome",
          title: "स्वागत है!",
          message: "सबदवाणी ऐप में आपका स्वागत है। यहाँ आपको गुरु जम्भेश्वर भगवान की वाणी और बिश्नोई समाज की जानकारी मिलेगी।",
          date: "अभी",
          read: readIds.includes("welcome"),
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
  }, [db, showToast]);

  const markRead = (id: string) => {
    if (id === "welcome") {
      localStorage.setItem(WELCOME_KEY, "true");
    }

    let readIds: string[] = [];
    try {
      const storedRead = localStorage.getItem(READ_NOTIFS_KEY);
      if (storedRead) readIds = JSON.parse(storedRead);
    } catch (e) {}

    const newReadIds = Array.from(new Set([...readIds, id]));
    localStorage.setItem(READ_NOTIFS_KEY, JSON.stringify(newReadIds));
    
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllRead = () => {
    localStorage.setItem(WELCOME_KEY, "true");

    let readIds: string[] = [];
    try {
      const storedRead = localStorage.getItem(READ_NOTIFS_KEY);
      if (storedRead) readIds = JSON.parse(storedRead);
    } catch (e) {}

    const allNotifIds = notifications.map(n => n.id);
    const newReadIds = Array.from(new Set([...readIds, ...allNotifIds]));
    localStorage.setItem(READ_NOTIFS_KEY, JSON.stringify(newReadIds));

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


