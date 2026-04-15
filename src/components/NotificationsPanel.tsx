import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";

interface NotificationsPanelProps {
  showNotifications: boolean;
  setShowNotifications: (show: boolean) => void;
  notifications: any[];
  unreadCount: number;
  markAllRead: () => void;
  markRead: (id: string) => void;
}

export default function NotificationsPanel({
  showNotifications,
  setShowNotifications,
  notifications,
  unreadCount,
  markAllRead,
  markRead,
}: NotificationsPanelProps) {
  return (
    <AnimatePresence>
      {showNotifications && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="absolute top-[60px] right-4 w-80 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-ink/10 z-50 overflow-hidden"
        >
          <div className="p-4 border-b border-ink/10 flex justify-between items-center bg-paper/50">
            <h3 className="font-bold text-ink">नोटिफिकेशन्स</h3>
            <div className="flex gap-3">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs text-accent font-bold hover:underline"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setShowNotifications(false)}
                className="text-ink-light hover:text-ink"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.filter((n) => !n.read).length === 0 ? (
              <div className="p-6 text-center text-ink-light text-sm">
                कोई नया नोटिफिकेशन नहीं है।
              </div>
            ) : (
              notifications
                .filter((n) => !n.read)
                .map((n) => (
                  <div
                    key={n.id}
                    onClick={() => markRead(n.id)}
                    className="p-4 border-b border-ink/5 last:border-0 bg-accent/5 cursor-pointer hover:bg-accent/10 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-bold text-sm text-ink">{n.title}</h4>
                      <span className="text-[10px] text-ink-light">{n.date}</span>
                    </div>
                    <p className="text-xs text-ink-light leading-relaxed">
                      {n.message}
                    </p>
                  </div>
                ))
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
