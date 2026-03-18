import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Check, X } from 'lucide-react';
import { clsx } from 'clsx';
import type { ModuleDefinition } from '@/modules/types';

const CATEGORY_LABELS: Record<string, string> = {
  core: 'Core',
  hr: 'RH',
  payroll: 'Nómina',
  talent: 'Talento',
  admin: 'Admin',
  portal: 'Portal',
};

const CATEGORY_COLORS: Record<string, string> = {
  core: 'bg-gray-100 text-gray-700',
  hr: 'bg-blue-100 text-blue-700',
  payroll: 'bg-green-100 text-green-700',
  talent: 'bg-purple-100 text-purple-700',
  admin: 'bg-orange-100 text-orange-700',
  portal: 'bg-cyan-100 text-cyan-700',
};

const CATEGORY_ICON_BG: Record<string, string> = {
  core: 'bg-gray-100 text-gray-600',
  hr: 'bg-blue-50 text-blue-600',
  payroll: 'bg-green-50 text-green-600',
  talent: 'bg-purple-50 text-purple-600',
  admin: 'bg-orange-50 text-orange-600',
  portal: 'bg-cyan-50 text-cyan-600',
};

interface Props {
  module: ModuleDefinition;
  enabled: boolean;
  onToggle: () => void;
}

export default function ModuleStoreCard({ module, enabled, onToggle }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: module.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const Icon = module.icon;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={clsx(
        'flex items-center gap-3 rounded-xl border bg-white px-3 py-3 transition-all',
        isDragging && 'z-50 shadow-lg ring-2 ring-primary-300',
        !enabled && 'opacity-50',
        enabled ? 'border-gray-200' : 'border-gray-100'
      )}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="flex-shrink-0 cursor-grab touch-none rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 active:cursor-grabbing"
        tabIndex={-1}
      >
        <GripVertical className="h-4 w-4" />
      </button>

      {/* Module icon */}
      <div className={clsx(
        'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg',
        enabled ? CATEGORY_ICON_BG[module.category] : 'bg-gray-100 text-gray-400'
      )}>
        <Icon className="h-5 w-5" />
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-gray-900">{module.label}</p>
        <p className="truncate text-xs text-gray-500">{module.description}</p>
        <div className="mt-1 flex flex-wrap gap-1">
          <span className={clsx('rounded-full px-2 py-0.5 text-[10px] font-medium', CATEGORY_COLORS[module.category])}>
            {CATEGORY_LABELS[module.category]}
          </span>
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500">
            {module.permissions.length} permisos
          </span>
        </div>
      </div>

      {/* Toggle */}
      <button
        onClick={onToggle}
        className={clsx(
          'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full transition-colors',
          enabled
            ? 'bg-green-100 text-green-600 hover:bg-green-200'
            : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
        )}
        title={enabled ? 'Deshabilitar' : 'Habilitar'}
      >
        {enabled ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
      </button>
    </div>
  );
}
