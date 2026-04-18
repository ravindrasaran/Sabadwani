import { useState, useEffect } from "react";
import { collection, onSnapshot, updateDoc, doc, Firestore } from "firebase/firestore";

export type Notification = {
  id: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
};

export const useAppNotifications = (db: Firestore, showToast: (msg: string) => void) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    if (!db) return;
    const unsubNotifications = onSnapshot(collection(db, "notifications"), (snapshot) => {
      let newNotifs: Notification[] = [];
      if (!snapshot.empty) {
        newNotifs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Notification));
      }
      
      const hasSeenWelcome = localStorage.getItem("hasSeenWelcome");
      if (!hasSeenWelcome) {
        newNotifs.unshift({
          id: "welcome",
          title: "स्वागत है!",
          message: "सबदवाणी ऐप में आपका स्वागत है। यहाँ आपको गुरु जम्भेश्वर भगवान की वाणी और बिश्नोई समाज की जानकारी मिलेगी।",
          date: "अभी",
          read: false
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
      localStorage.setItem("hasSeenWelcome", "true");
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
      return;
    }
    
    // Optimistic UI update
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    
    if (!db) return;
    try {
      updateDoc(doc(db, "notifications", id), { read: true }).catch(() => {});
    } catch (e) {}
  };

  const markAllRead = async () => {
    localStorage.setItem("hasSeenWelcome", "true");
    
    const unread = notifications.filter((n) => !n.read && n.id !== "welcome");
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    
    if (!db) return;
    try {
      unread.forEach((n) => {
        updateDoc(doc(db, "notifications", n.id), { read: true }).catch(() => {});
      });
    } catch (error) {}
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
