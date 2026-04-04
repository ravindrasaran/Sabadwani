import { motion, AnimatePresence } from "motion/react";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({ isOpen, title, message, onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-sm border border-ink/10"
          >
            <h3 className="text-xl font-bold text-ink mb-2">{title}</h3>
            <p className="text-ink-light mb-6">{message}</p>
            <div className="flex gap-3">
              <button
                onClick={onCancel}
                className="flex-1 py-3 rounded-xl font-bold text-ink bg-ink/5 hover:bg-ink/10 transition-colors"
              >
                रद्द करें
              </button>
              <button
                onClick={() => {
                  onConfirm();
                  onCancel();
                }}
                className="flex-1 py-3 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 transition-colors"
              >
                हां, हटाएं
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
