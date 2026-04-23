import { useState, useEffect } from "react";
import { collection, onSnapshot, updateDoc, doc, Firestore } from "firebase/firestore";
import { Preferences } from "@capacitor/preferences";

export type Notification = {
  id: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
};

// BUG FIX: Old code used localStorage for hasSeenWelcome.
// On Android/iOS, localStorage can be cleared by the OS under memory pressure,
// causing the welcome message to reappear after every low-memory restart.
// Capacitor Preferences (backed by SharedPreferences on Android, NSUserDefaults
// on iOS) is persistent and the correct storage for native apps.
const WELCOME_KEY = "sabadwani_hasSeenWelcome";

const getHasSeenWelcome = async (): Promise<boolean> => {
  try {
    const { value } = await Preferences.get({ key: WELCOME_KEY });
    return value === "true";
  } catch {
    return false;
  }
};

const setHasSeenWelcome = async () => {
  try {
    await Preferences.set({ key: WELCOME_KEY, value: "true" });
  } catch {}
};

export const useAppNotifications = (db: Firestore, showToast: (msg: string) => void) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    if (!db) return;

    const unsubNotifications = onSnapshot(collection(db, "notifications"), async (snapshot) => {
      let newNotifs: Notification[] = [];
      if (!snapshot.empty) {
        newNotifs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Notification));
      }

      // Inject local welcome notification for first-time users
      const hasSeenWelcome = await getHasSeenWelcome();
      if (!hasSeenWelcome) {
        newNotifs.unshift({
          id: "welcome",
          title: "स्वागत है!",
          message: "सबदवाणी ऐप में आपका स्वागत है। यहाँ आपको गुरु जम्भेश्वर भगवान की वाणी और बिश्नोई समाज की जानकारी मिलेगी।",
          date: "अभी",
          read: false,
        });
      }

      setNotifications((prev) => {
        const prevIds = new Set(prev.map((n) => n.id));
        const added = newNotifs.filter((n) => !prevIds.has(n.id) && n.id !== "welcome");
        if (added.length > 0 && prev.length > 0) {
          showToast(`नई सूचना: ${added[0].title}`);
        }
        return newNotifs;
      });
    });

    return () => unsubNotifications();
  }, [db, showToast]);

  const markRead = async (id: string) => {
    if (id === "welcome") {
      await setHasSeenWelcome();
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
      return;
    }

    // Optimistic UI update
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));

    if (!db) return;
    try {
      updateDoc(doc(db, "notifications", id), { read: true }).catch(() => {});
    } catch {}
  };

  const markAllRead = async () => {
    await setHasSeenWelcome();

    const unread = notifications.filter((n) => !n.read && n.id !== "welcome");
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

    if (!db) return;
    try {
      unread.forEach((n) => {
        updateDoc(doc(db, "notifications", n.id), { read: true }).catch(() => {});
      });
    } catch {}
  };

  return {
    showNotifications,
    setShowNotifications,
    notifications,
    unreadCount,
    markRead,
    markAllRead,
  };
};
