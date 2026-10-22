import { createContext, useContext, useCallback, useState } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '../../utils/cn';

const ToastContext = createContext(null);
const LIMIT = 5;

const TYPE_STYLES = {
  success: { icon: CheckCircle2, tile: 'bg-emerald-50 text-emerald-600', bar: 'bg-emerald-500' },
  error: { icon: XCircle, tile: 'bg-rose-50 text-rose-600', bar: 'bg-rose-500' },
  warning: { icon: AlertTriangle, tile: 'bg-amber-50 text-amber-600', bar: 'bg-amber-500' },
  info: { icon: Info, tile: 'bg-brand-50 text-brand-600', bar: 'bg-brand-500' },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    ({ title, description, type = 'info', duration = 4000 }) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      setToasts((prev) => [{ id, title, description, type, duration }, ...prev].slice(0, LIMIT));
      if (duration > 0) {
        setTimeout(() => dismiss(id), duration);
      }
      return id;
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ show, dismiss }}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[70] flex w-full max-w-sm flex-col gap-2.5">
        {toasts.map((t) => {
          const style = TYPE_STYLES[t.type] || TYPE_STYLES.info;
          const Icon = style.icon;
          return (
            <div
              key={t.id}
              role="alert"
              aria-live="polite"
              className="pointer-events-auto relative flex items-start gap-3 overflow-hidden rounded-xl border border-slate-200 bg-white p-4 pr-10 shadow-lg shadow-slate-900/5 animate-fade-up"
            >
              <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', style.tile)}>
                <Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1 pt-0.5">
                <p className="text-sm font-semibold leading-tight text-slate-900">{t.title}</p>
                {t.description && (
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">{t.description}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                className="absolute right-2.5 top-2.5 rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                aria-label="Dismiss"
              >
                <X className="h-3.5 w-3.5" />
              </button>
              <span className={cn('absolute inset-y-0 left-0 w-1', style.bar)} />
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context;
}
