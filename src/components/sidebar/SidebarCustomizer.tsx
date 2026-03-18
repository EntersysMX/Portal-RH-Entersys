import { useMemo } from 'react';
import { GripVertical, RotateCcw, X } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { clsx } from 'clsx';
import { useSidebarOrder } from '@/hooks/useSidebarOrder';
import type { ModuleDefinition } from '@/modules/types';

interface Props {
  onClose: () => void;
}

export default function SidebarCustomizer({ onClose }: Props) {
  const { orderedModules, reorderModules, resetToDefault } = useSidebarOrder();

  const moduleIds = useMemo(() => orderedModules.map((m) => m.id), [orderedModules]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 3 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const ids = [...moduleIds];
    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;

    const [moved] = ids.splice(oldIndex, 1);
    ids.splice(newIndex, 0, moved);
    reorderModules(ids);
  };

  const handleReset = () => {
    resetToDefault();
  };

  return (
    <div className="absolute bottom-0 left-0 top-0 z-50 flex w-64 flex-col border-r border-gray-200 bg-white shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        <h3 className="text-sm font-semibold text-gray-900">Personalizar sidebar</h3>
        <button
          onClick={onClose}
          className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Instructions */}
      <p className="border-b border-gray-100 px-4 py-2 text-xs text-gray-500">
        Arrastra para reordenar los elementos del menú.
      </p>

      {/* DnD list */}
      <div className="flex-1 overflow-y-auto px-2 py-2">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={moduleIds} strategy={verticalListSortingStrategy}>
            {orderedModules.map((mod) => (
              <SortableNavItem key={mod.id} module={mod} />
            ))}
          </SortableContext>
        </DndContext>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 p-3">
        <button
          onClick={handleReset}
          className="flex w-full items-center justify-center gap-2 rounded-lg py-2 text-sm text-gray-600 transition-colors hover:bg-gray-100"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Restaurar orden
        </button>
      </div>
    </div>
  );
}

function SortableNavItem({ module }: { module: ModuleDefinition }) {
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
  const firstNav = module.navItems[0];

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={clsx(
        'flex items-center gap-2 rounded-lg px-2 py-2 mb-0.5',
        isDragging && 'z-50 bg-primary-50 shadow-md ring-1 ring-primary-200'
      )}
    >
      <button
        {...attributes}
        {...listeners}
        className="flex-shrink-0 cursor-grab touch-none rounded p-0.5 text-gray-400 hover:text-gray-600 active:cursor-grabbing"
        tabIndex={-1}
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>
      <Icon className="h-4 w-4 flex-shrink-0 text-gray-500" />
      <span className="truncate text-sm text-gray-700">
        {firstNav?.label || module.label}
      </span>
    </div>
  );
}
