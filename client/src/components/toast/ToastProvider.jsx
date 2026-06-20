import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";

const ToastContext = createContext(null);

const TOAST_DURATION = 4000;

const toastStyles = {
  success: {
    icon: CheckCircle2,
    wrapper: "border-green-200 bg-green-50 text-green-900",
    iconClass: "text-green-600",
  },
  error: {
    icon: AlertCircle,
    wrapper: "border-red-200 bg-red-50 text-red-900",
    iconClass: "text-red-600",
  },
  info: {
    icon: Info,
    wrapper: "border-blue-200 bg-blue-50 text-blue-900",
    iconClass: "text-blue-600",
  },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timeoutsRef = useRef(new Map());

  const removeToast = (id) => {
    const timeoutId = timeoutsRef.current.get(id);
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutsRef.current.delete(id);
    }

    setToasts((current) => current.filter((toast) => toast.id !== id));
  };

  const showToast = ({ title, message, type = "info", duration = TOAST_DURATION }) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const nextToast = {
      id,
      title,
      message,
      type: toastStyles[type] ? type : "info",
    };

    setToasts((current) => [...current, nextToast]);

    const timeoutId = setTimeout(() => {
      removeToast(id);
    }, duration);

    timeoutsRef.current.set(id, timeoutId);
  };

  useEffect(() => {
    const timeoutEntries = timeoutsRef.current;

    return () => {
      timeoutEntries.forEach((timeoutId) => clearTimeout(timeoutId));
      timeoutEntries.clear();
    };
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}

      <div className="pointer-events-none fixed right-4 top-4 z-[9999] flex w-full max-w-sm flex-col gap-3">
        {toasts.map((toast) => {
          const config = toastStyles[toast.type] || toastStyles.info;
          const Icon = config.icon;

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto rounded-2xl border shadow-lg backdrop-blur-sm ${config.wrapper}`}
            >
              <div className="flex items-start gap-3 p-4">
                <Icon className={`mt-0.5 h-5 w-5 flex-shrink-0 ${config.iconClass}`} />
                <div className="min-w-0 flex-1">
                  {toast.title ? (
                    <p className="text-sm font-semibold">{toast.title}</p>
                  ) : null}
                  <p className="text-sm">{toast.message}</p>
                </div>
                <button
                  type="button"
                  onClick={() => removeToast(toast.id)}
                  className="rounded-full p-1 text-gray-500 transition hover:bg-white/60 hover:text-gray-700"
                  aria-label="Close toast"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }

  return context;
}
