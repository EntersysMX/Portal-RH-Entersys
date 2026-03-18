import { useState, useMemo } from 'react';
import { Package, RotateCcw } from 'lucide-react';
import { clsx } from 'clsx';
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
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { ALL_MODULES } from '@/modules/registry';
import { useModuleStore } from '@/store/moduleStore';
import { toast } from '@/components/ui/Toast';
import ModuleStoreCard from '@/components/admin/ModuleStoreCard';
import SidebarPreview from '@/components/admin/SidebarPreview';

const CATEGORY_LABELS: Record<string, string> = {
  core: 'Core',
  hr: 'Recursos Humanos',
  payroll: 'Nómina y Finanzas',
  talent: 'Talento',
  admin: 'Administración',
  portal: 'Portal Empleado',
};

export default function AdminModules() {
  const { manifest, toggleModule, setManifest, updateModuleOrder } = useModuleStore();
  const [filter, setFilter] = useState<string>('all');

  const categories = useMemo(
    () => ['all', ...Array.from(new Set(ALL_MODULES.map((m) => m.category)))],
    []
  );

  // Modules sorted by current manifest order
  const sortedModules = useMemo(() => {
    const mods = [...ALL_MODULES].sort(
      (a, b) => (manifest[a.id]?.order ?? 999) - (manifest[b.id]?.order ?? 999)
    );
    if (filter === 'all') return mods;
    return mods.filter((m) => m.category === filter);
  }, [manifest, filter]);

  const moduleIds = useMemo(() => sortedModules.map((m) => m.id), [sortedModules]);

  const enabledCount = ALL_MODULES.filter((m) => manifest[m.id]?.enabled).length;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    // Build new full order (we operate on ALL modules, not just filtered)
    const allSorted = [...ALL_MODULES].sort(
      (a, b) => (manifest[a.id]?.order ?? 999) - (manifest[b.id]?.order ?? 999)
    );
    const allIds = allSorted.map((m) => m.id);
    const oldIndex = allIds.indexOf(String(active.id));
    const newIndex = allIds.indexOf(String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = [...allIds];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);

    await updateModuleOrder(reordered);
  };

  const handleReset = async () => {
    const all: Record<string, { enabled: boolean; order: number }> = {};
    ALL_MODULES.forEach((m, i) => { all[m.id] = { enabled: true, order: i }; });
    await setManifest(all);
    toast.success('Módulos restaurados', 'Todos los módulos han sido habilitados y ordenados por defecto');
  };

  const handleToggle = async (moduleId: string) => {
    const wasEnabled = manifest[moduleId]?.enabled ?? false;
    await toggleModule(moduleId);
    const mod = ALL_MODULES.find((m) => m.id === moduleId);
    toast.success(
      wasEnabled ? 'Módulo deshabilitado' : 'Módulo habilitado',
      `"${mod?.label}" ${wasEnabled ? 'ya no estará' : 'estará'} disponible en el sistema`
    );
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tienda de Módulos</h1>
          <p className="mt-1 text-gray-500">
            Arrastra para reordenar el sidebar. Habilita o deshabilita módulos para todos los usuarios.
          </p>
        </div>
        <button onClick={handleReset} className="btn-secondary">
          <RotateCcw className="h-4 w-4" />
          Restaurar todos
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-primary-600">{enabledCount}</p>
          <p className="text-sm text-gray-500">Módulos activos</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-gray-400">{ALL_MODULES.length - enabledCount}</p>
          <p className="text-sm text-gray-500">Módulos inactivos</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{ALL_MODULES.length}</p>
          <p className="text-sm text-gray-500">Total disponibles</p>
        </div>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={clsx(
              'rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
              filter === cat
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            {cat === 'all' ? 'Todos' : CATEGORY_LABELS[cat] || cat}
          </button>
        ))}
      </div>

      {/* 2-column layout */}
      <div className="flex gap-6">
        {/* Left: DnD module list */}
        <div className="flex-1 space-y-2">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={moduleIds} strategy={verticalListSortingStrategy}>
              {sortedModules.map((mod) => (
                <ModuleStoreCard
                  key={mod.id}
                  module={mod}
                  enabled={manifest[mod.id]?.enabled ?? false}
                  onToggle={() => handleToggle(mod.id)}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>

        {/* Right: Sidebar preview (sticky) */}
        <div className="hidden w-56 flex-shrink-0 lg:block">
          <div className="sticky top-6">
            <SidebarPreview />
          </div>
        </div>
      </div>

      {/* Info box */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-start gap-3">
          <Package className="mt-0.5 h-5 w-5 text-blue-600" />
          <div className="text-sm text-blue-700">
            <p className="font-medium">Nota sobre módulos</p>
            <p className="mt-1">
              Los cambios se aplican inmediatamente para todos los usuarios.
              Arrastra los módulos para cambiar el orden en el sidebar.
              Los módulos deshabilitados dejan de ser visibles en la navegación pero sus datos se conservan.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
