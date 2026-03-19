import { useState, useMemo } from 'react';
import { Package, RotateCcw } from 'lucide-react';
import { clsx } from 'clsx';
import type { ModuleDefinition } from '@/modules/types';
import Modal from '@/components/ui/Modal';
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
  const [infoModule, setInfoModule] = useState<ModuleDefinition | null>(null);

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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
      <div className="flex flex-col gap-6 lg:flex-row">
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
                  onInfo={() => setInfoModule(mod)}
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

      {/* Modal de información del módulo */}
      <Modal
        isOpen={!!infoModule}
        onClose={() => setInfoModule(null)}
        title={infoModule?.label ?? ''}
        size="md"
        footer={
          <button onClick={() => setInfoModule(null)} className="btn-secondary">
            Cerrar
          </button>
        }
      >
        {infoModule && (
          <div className="space-y-4">
            {/* Header con icono */}
            <div className="flex items-center gap-3">
              <div className={clsx(
                'flex h-12 w-12 items-center justify-center rounded-xl',
                CATEGORY_CARD_BG[infoModule.category] || 'bg-gray-100 text-gray-600'
              )}>
                <infoModule.icon className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{infoModule.label}</h3>
                <span className={clsx(
                  'inline-block rounded-full px-2 py-0.5 text-[10px] font-medium',
                  CATEGORY_BADGE[infoModule.category] || 'bg-gray-100 text-gray-700'
                )}>
                  {CATEGORY_LABELS[infoModule.category] || infoModule.category}
                </span>
              </div>
            </div>

            {/* Descripción corta */}
            <p className="text-sm text-gray-600">{infoModule.description}</p>

            {/* Detalles largos */}
            {infoModule.details && (
              <div className="rounded-lg bg-gray-50 p-3">
                <p className="text-sm text-gray-700 leading-relaxed">{infoModule.details}</p>
              </div>
            )}

            {/* Secciones */}
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400">Secciones</p>
              <div className="flex flex-wrap gap-1.5">
                {infoModule.sections.map((s) => (
                  <span key={s} className="rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">{s}</span>
                ))}
              </div>
            </div>

            {/* Permisos */}
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400">Permisos ({infoModule.permissions.length})</p>
              <div className="grid grid-cols-2 gap-1.5">
                {infoModule.permissions.map((p) => (
                  <div key={p.id} className="flex items-center gap-1.5 text-xs text-gray-600">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-400" />
                    {p.label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

const CATEGORY_CARD_BG: Record<string, string> = {
  core: 'bg-gray-100 text-gray-600',
  hr: 'bg-blue-50 text-blue-600',
  payroll: 'bg-emerald-50 text-emerald-600',
  talent: 'bg-violet-50 text-violet-600',
  admin: 'bg-orange-50 text-orange-600',
  portal: 'bg-cyan-50 text-cyan-600',
};

const CATEGORY_BADGE: Record<string, string> = {
  core: 'bg-gray-100 text-gray-700',
  hr: 'bg-blue-100 text-blue-700',
  payroll: 'bg-emerald-100 text-emerald-700',
  talent: 'bg-violet-100 text-violet-700',
  admin: 'bg-orange-100 text-orange-700',
  portal: 'bg-cyan-100 text-cyan-700',
};
