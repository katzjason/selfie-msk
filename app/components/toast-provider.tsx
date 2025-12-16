"use client"

import React, { createContext, useContext, useCallback, useRef, useState } from "react";

type Toast = { id : number, message: string };

type ToastCtx = { 
    showToast: (message: string, durationMs?: number) => void;
};

const ToastContext = createContext<ToastCtx | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null);
  const timerRef = useRef<number | null>(null);

  const showToast = useCallback((message: string, durationMs = 3000) => {
    const id = Date.now();

    // Clear any existing timer + toast
    if (timerRef.current) window.clearTimeout(timerRef.current);
    setToast({ id, message });

    timerRef.current = window.setTimeout(() => {
      setToast((t) => (t?.id === id ? null : t));
      timerRef.current = null;
    }, durationMs);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Simple popup / toast */}
      {toast && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none">
          <div
            className="
              animate-bounce2
              rounded-2xl
              bg-gradient-to-br from-yellow-500 to-pink-500
              px-8 py-10
              shadow-xl
              flex flex-col items-center gap-6
              min-h-[180px]
              w-[70%]
              max-w-md
            "
          >
            {/* Text */}
            <div className="text-white font-bold text-2xl uppercase text-center">
              {toast.message}
            </div>
        
            {/* Checkmark container */}
            <div className="flex items-center justify-center h-14 w-14 rounded-full bg-white">
              <svg
                className="h-7 w-7"
                viewBox="0 0 24 24"
                fill="none"
                stroke="url(#check-gradient)"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <defs>
                  <linearGradient id="check-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#eab308" /> {/* yellow-500 */}
                    <stop offset="100%" stopColor="#ec4899" /> {/* pink-500 */}
                  </linearGradient>
                </defs>
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}