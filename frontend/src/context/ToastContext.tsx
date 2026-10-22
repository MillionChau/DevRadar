import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { AppIcon } from '../components/common/Icon';

export type ToastType = 'success' | 'warning' | 'error' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  title?: string;
  duration?: number;
}

export interface ToastContextType {
  toasts: ToastItem[];
  showToast: (type: ToastType, message: string, title?: string, duration?: number) => string;
  dismissToast: (id: string) => void;
  success: (message: string, title?: string, duration?: number) => string;
  warning: (message: string, title?: string, duration?: number) => string;
  error: (message: string, title?: string, duration?: number) => string;
  info: (message: string, title?: string, duration?: number) => string;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Reference for global non-hook usage
let globalToastHandler: ((type: ToastType, message: string, title?: string, duration?: number) => string) | null = null;

export const toast = {
  success: (message: string, title?: string, duration?: number) =>
    globalToastHandler ? globalToastHandler('success', message, title, duration) : '',
  warning: (message: string, title?: string, duration?: number) =>
    globalToastHandler ? globalToastHandler('warning', message, title, duration) : '',
  error: (message: string, title?: string, duration?: number) =>
    globalToastHandler ? globalToastHandler('error', message, title, duration) : '',
  info: (message: string, title?: string, duration?: number) =>
    globalToastHandler ? globalToastHandler('info', message, title, duration) : '',
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timersRef = useRef<Record<string, number>>({});

  const dismissToast = useCallback((id: string) => {
    if (timersRef.current[id]) {
      clearTimeout(timersRef.current[id]);
      delete timersRef.current[id];
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (type: ToastType, message: string, title?: string, duration = 4500): string => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const newToast: ToastItem = { id, type, message, title, duration };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        const timer = window.setTimeout(() => {
          dismissToast(id);
        }, duration);
        timersRef.current[id] = timer;
      }

      return id;
    },
    [dismissToast]
  );

  const success = useCallback(
    (msg: string, title?: string, duration?: number) => showToast('success', msg, title, duration),
    [showToast]
  );
  const warning = useCallback(
    (msg: string, title?: string, duration?: number) => showToast('warning', msg, title, duration),
    [showToast]
  );
  const error = useCallback(
    (msg: string, title?: string, duration?: number) => showToast('error', msg, title, duration),
    [showToast]
  );
  const info = useCallback(
    (msg: string, title?: string, duration?: number) => showToast('info', msg, title, duration),
    [showToast]
  );

  // Link global toast reference
  globalToastHandler = showToast;

  const typeConfig: Record<
    ToastType,
    { icon: string; border: string; bg: string; text: string; defaultTitle: string }
  > = {
    success: {
      icon: 'checkCircle',
      border: 'border-status-success/40',
      bg: 'bg-surface-card/95',
      text: 'text-status-success',
      defaultTitle: 'Thành công',
    },
    warning: {
      icon: 'alertTriangle',
      border: 'border-status-warning/40',
      bg: 'bg-surface-card/95',
      text: 'text-status-warning',
      defaultTitle: 'Cảnh báo',
    },
    error: {
      icon: 'alertCircle',
      border: 'border-status-danger/40',
      bg: 'bg-surface-card/95',
      text: 'text-status-danger',
      defaultTitle: 'Đã có lỗi xảy ra',
    },
    info: {
      icon: 'info',
      border: 'border-brand-primary/40',
      bg: 'bg-surface-card/95',
      text: 'text-brand-secondary',
      defaultTitle: 'Thông báo',
    },
  };

  return (
    <ToastContext.Provider value={{ toasts, showToast, dismissToast, success, warning, error, info }}>
      {children}

      {/* Toast Notification Container */}
      <div
        className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm sm:max-w-md w-full px-4 pointer-events-none"
        aria-live="polite"
        aria-atomic="true"
      >
        {toasts.map((t) => {
          const cfg = typeConfig[t.type];
          return (
            <div
              key={t.id}
              role="alert"
              className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-card border shadow-2xl backdrop-blur-md transition-all duration-200 transform translate-y-0 opacity-100 ${cfg.bg} ${cfg.border}`}
            >
              <div className={`mt-0.5 flex-shrink-0 ${cfg.text}`}>
                <AppIcon name={cfg.icon} size={20} />
              </div>

              <div className="flex-1 min-w-0 pr-1">
                <h5 className={`text-xs font-bold leading-tight ${cfg.text}`}>
                  {t.title || cfg.defaultTitle}
                </h5>
                <p className="text-xs text-text-main mt-1 leading-relaxed whitespace-pre-line break-words">
                  {t.message}
                </p>
              </div>

              <button
                type="button"
                onClick={() => dismissToast(t.id)}
                className="text-text-muted hover:text-text-main transition-colors p-1 rounded-btn hover:bg-surface-elevated flex-shrink-0 -mr-1 -mt-1"
                aria-label="Đóng thông báo"
              >
                <AppIcon name="close" size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
