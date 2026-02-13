import { useState } from 'react';
import { Bell, ChevronDown, ChevronUp, Info, AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';
import { useNotices } from '@/hooks/useFrappe';
import type { Notice } from '@/types/frappe';

const TYPE_CONFIG: Record<Notice['type'], { bg: string; border: string; icon: React.ComponentType<{className?: string}>; badge: string }> = {
  info: { bg: 'bg-blue-50', border: 'border-l-blue-500', icon: Info, badge: 'bg-blue-100 text-blue-700' },
  warning: { bg: 'bg-yellow-50', border: 'border-l-yellow-500', icon: AlertTriangle, badge: 'bg-yellow-100 text-yellow-700' },
  success: { bg: 'bg-green-50', border: 'border-l-green-500', icon: CheckCircle, badge: 'bg-green-100 text-green-700' },
  urgent: { bg: 'bg-red-50', border: 'border-l-red-500', icon: AlertCircle, badge: 'bg-red-100 text-red-700' },
};

export default function MyNotices() {
  const { data: notices, isLoading } = useNotices();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const activeNotices = notices?.filter((n) => n.status === 'Active') || [];

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Avisos</h1>
        <p className="mt-1 text-gray-500">Comunicados y avisos del departamento de RH</p>
      </div>

      {activeNotices.length === 0 ? (
        <div className="card p-8 text-center">
          <Bell className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-semibold text-gray-700">Sin avisos</h3>
          <p className="mt-2 text-gray-500">No hay avisos activos en este momento.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {activeNotices.map((notice) => {
            const config = TYPE_CONFIG[notice.type];
            const isExpanded = expandedId === notice.name;
            const Icon = config.icon;
            return (
              <div
                key={notice.name}
                className={clsx(
                  'card overflow-hidden border-l-4 transition-shadow hover:shadow-md',
                  config.border
                )}
              >
                <button
                  onClick={() => setExpandedId(isExpanded ? null : notice.name)}
                  className="flex w-full items-center justify-between p-4 text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className={clsx('rounded-lg p-2', config.bg)}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{notice.title}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className={clsx('rounded-full px-2 py-0.5 text-xs font-medium', config.badge)}>
                          {notice.type.charAt(0).toUpperCase() + notice.type.slice(1)}
                        </span>
                        <span className="text-xs text-gray-400">{notice.posted_date}</span>
                        <span className="text-xs text-gray-400">· {notice.author}</span>
                      </div>
                    </div>
                  </div>
                  {isExpanded ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
                </button>
                {isExpanded && (
                  <div className={clsx('border-t px-4 py-4', config.bg)}>
                    <p className="text-sm leading-relaxed text-gray-700">{notice.content}</p>
                    {notice.expiry_date && (
                      <p className="mt-3 text-xs text-gray-400">Expira: {notice.expiry_date}</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
