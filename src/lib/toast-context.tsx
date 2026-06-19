import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface ToastState {
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 3200);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <div
          className={`fixed top-[max(1rem,env(safe-area-inset-top))] left-1/2 -translate-x-1/2 z-[100] px-5 py-3 toast-glass text-sm font-medium max-w-[90vw] text-center ${
            toast.type === 'success'
              ? 'text-[#248a3d]'
              : toast.type === 'error'
                ? 'text-[#d70015]'
                : 'text-[var(--color-ink)]'
          }`}
          role="status"
        >
          {toast.message}
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
