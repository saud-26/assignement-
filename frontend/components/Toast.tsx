'use client';

import { useEffect, useState } from 'react';

export type ToastType = 'success' | 'error' | 'warning';

interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
}

export function showToast(message: string, type: ToastType = 'success') {
  const event = new CustomEvent('app-toast', { detail: { message, type } });
  window.dispatchEvent(event);
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const handleToast = (e: Event) => {
      const customEvent = e as CustomEvent;
      const newToast = {
        id: Date.now() + Math.random(),
        message: customEvent.detail.message,
        type: customEvent.detail.type,
      };
      setToasts((prev) => [...prev, newToast]);

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
      }, 4000);
    };

    window.addEventListener('app-toast', handleToast);
    return () => window.removeEventListener('app-toast', handleToast);
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`px-5 py-3 rounded-xl shadow-xl text-white font-medium flex items-center gap-3 transition-all transform animate-toast ${
            t.type === 'success' ? 'bg-emerald-500 shadow-emerald-500/20' : 
            t.type === 'error' ? 'bg-red-500 shadow-red-500/20' : 
            'bg-amber-500 shadow-amber-500/20'
          }`}
        >
          {t.type === 'success' && (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )}
          {t.type === 'error' && (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
          {t.type === 'warning' && (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          )}
          {t.message}
        </div>
      ))}
    </div>
  );
}
