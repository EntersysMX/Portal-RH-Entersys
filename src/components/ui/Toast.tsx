import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useToastStore, type Toast as ToastData, type ToastType } from '@/store/toastStore';
import { parseFrappeError } from '@/lib/frappeErrors';

/* ── Global toast helper (import from anywhere) ── */

export const toast = {
  success: (title: string, message?: string) =>
    useToastStore.getState().addToast({ type: 'success', title, message }),
  error: (title: string, message?: string, code?: string) =>
    useToastStore.getState().addToast({ type: 'error', title, message, code }),
  warning: (title: string, message?: string) =>
    useToastStore.getState().addToast({ type: 'warning', title, message }),
  info: (title: string, message?: string) =>
    useToastStore.getState().addToast({ type: 'info', title, message }),
  fromError: (error: unknown) => {
    const parsed = parseFrappeError(error);
    useToastStore.getState().addToast({
      type: 'error',
      title: 'Error',
      message: parsed.message,
      code: parsed.code,
    });
  },
};

/* ── Styles per variant ── */

const variantStyles: Record<ToastType, { bg: string; border: string; icon: string; titleColor: string; msgColor: string }> = {
  success: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    icon: 'text-green-500',
    titleColor: 'text-green-800',
    msgColor: 'text-green-700',
  },
  error: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    icon: 'text-red-500',
    titleColor: 'text-red-800',
    msgColor: 'text-red-700',
  },
  warning: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    icon: 'text-yellow-500',
    titleColor: 'text-yellow-800',
    msgColor: 'text-yellow-700',
  },
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    icon: 'text-blue-500',
    titleColor: 'text-blue-800',
    msgColor: 'text-blue-700',
  },
};

const variantIcons: Record<ToastType, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

/* ── Single toast item ── */

function ToastItem({ data, onClose }: { data: ToastData; onClose: () => void }) {
  const [visible, setVisible] = useState(false);
  const styles = variantStyles[data.type];
  const Icon = variantIcons[data.type];

  useEffect(() => {
    // Trigger enter animation
    const raf = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      className={`pointer-events-auto w-80 rounded-lg border shadow-lg transition-all duration-300 ease-out ${styles.bg} ${styles.border} ${
        visible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      <div className="flex items-start gap-3 p-4">
        <Icon className={`mt-0.5 h-5 w-5 flex-shrink-0 ${styles.icon}`} />
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold ${styles.titleColor}`}>{data.title}</p>
          {data.message && (
            <p className={`mt-1 text-sm ${styles.msgColor}`}>{data.message}</p>
          )}
          {data.code && (
            <p className={`mt-1 text-xs font-mono ${styles.msgColor} opacity-75`}>
              Código: {data.code}
            </p>
          )}
        </div>
        <button
          onClick={onClose}
          className="flex-shrink-0 rounded p-0.5 text-gray-400 hover:bg-white/50 hover:text-gray-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/* ── Container (mount in App.tsx) ── */

export default function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[9999] flex flex-col gap-3">
      {toasts.map((t) => (
        <ToastItem key={t.id} data={t} onClose={() => removeToast(t.id)} />
      ))}
    </div>
  );
}
