// Toasts are the small pop-up messages ("Link copied", "Alex joined the meeting").
// Any component can show one with: const { showToast } = useToast(); showToast('Hello', 'success');

import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import Icon from '../components/Icon';

const ToastContext = createContext(null);
const TOAST_DURATION_MS = 4000;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(1);

  const dismissToast = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  // type can be: 'info' | 'success' | 'error'
  const showToast = useCallback(
    (message, type = 'info') => {
      const id = nextId.current++;
      setToasts((current) => [...current.slice(-3), { id, message, type }]); // keep at most 4
      setTimeout(() => dismissToast(id), TOAST_DURATION_MS);
    },
    [dismissToast]
  );

  const value = useMemo(() => ({ showToast }), [showToast]);

  const iconFor = { info: 'info', success: 'check', error: 'alert' };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-stack" aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            <Icon name={iconFor[toast.type]} size={18} />
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const value = useContext(ToastContext);
  if (!value) throw new Error('useToast must be used inside <ToastProvider>');
  return value;
}
