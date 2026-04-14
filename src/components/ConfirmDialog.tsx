import { motion, AnimatePresence } from "motion/react";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  isAlert?: boolean; // If true, only show one button
}

export default function ConfirmDialog({ 
  isOpen, 
  title, 
  message, 
  onConfirm, 
  onCancel,
  confirmText = "हां, हटाएं",
  cancelText = "रद्द करें",
  isAlert = false
}: ConfirmDialogProps) {
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
              {!isAlert && (
                <button
                  onClick={onCancel}
                  className="flex-1 py-3 rounded-xl font-bold text-ink bg-ink/5 hover:bg-ink/10 transition-colors"
                >
                  {cancelText}
                </button>
              )}
              <button
                onClick={() => {
                  onConfirm();
                  if (!isAlert) onCancel();
                }}
                className={`flex-1 py-3 rounded-xl font-bold text-white transition-colors ${
                  isAlert ? 'bg-primary hover:bg-primary-dark' : 'bg-red-500 hover:bg-red-600'
                }`}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
