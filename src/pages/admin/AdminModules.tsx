import { useState } from 'react';
import { Package, Check, X, RotateCcw } from 'lucide-react';
import { clsx } from 'clsx';
import { ALL_MODULES } from '@/modules/registry';
import { useModuleStore } from '@/store/moduleStore';
import { toast } from '@/components/ui/Toast';

const CATEGORY_LABELS: Record<string, string> = {
  core: 'Core',
  hr: 'Recursos Humanos',
  payroll: 'Nómina y Finanzas',
  talent: 'Talento',
  admin: 'Administración',
  portal: 'Portal Empleado',
};

const CATEGORY_COLORS: Record<string, string> = {
  core: 'bg-gray-100 text-gray-700',
  hr: 'bg-blue-100 text-blue-700',
  payroll: 'bg-green-100 text-green-700',
  talent: 'bg-purple-100 text-purple-700',
  admin: 'bg-orange-100 text-orange-700',
  portal: 'bg-cyan-100 text-cyan-700',
};

export default function AdminModules() {
  const { manifest, toggleModule, setManifest } = useModuleStore();
  const [filter, setFilter] = useState<string>('all');

  const categories = ['all', ...new Set(ALL_MODULES.map((m) => m.category))];
  const filtered = filter === 'all'
    ? ALL_MODULES
    : ALL_MODULES.filter((m) => m.category === filter);

  const enabledCount = ALL_MODULES.filter((m) => manifest[m.id]?.enabled).length;

  const handleReset = async () => {
    const all: Record<string, { enabled: boolean }> = {};
    ALL_MODULES.forEach((m) => { all[m.id] = { enabled: true }; });
    await setManifest(all);
    toast.success('Módulos restaurados', 'Todos los módulos han sido habilitados');
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Módulos del Sistema</h1>
          <p className="mt-1 text-gray-500">
            Habilita o deshabilita módulos para esta instancia. Los módulos deshabilitados no aparecen en el menú ni son accesibles.
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

      {/* Module grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {filtered.map((mod) => {
          const enabled = manifest[mod.id]?.enabled ?? false;
          const Icon = mod.icon;
          return (
            <div
              key={mod.id}
              className={clsx(
                'card relative overflow-hidden p-5 transition-all',
                enabled ? 'border-l-4 border-l-green-500' : 'opacity-60'
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className={clsx(
                    'rounded-lg p-2',
                    enabled ? 'bg-primary-50 text-primary-600' : 'bg-gray-100 text-gray-400'
                  )}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{mod.label}</h3>
                    <p className="mt-0.5 text-sm text-gray-500">{mod.description}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      <span className={clsx('rounded-full px-2 py-0.5 text-[10px] font-medium', CATEGORY_COLORS[mod.category])}>
                        {CATEGORY_LABELS[mod.category]}
                      </span>
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500">
                        {mod.permissions.length} permisos
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={async () => {
                    await toggleModule(mod.id);
                    toast.success(
                      enabled ? 'Módulo deshabilitado' : 'Módulo habilitado',
                      `"${mod.label}" ${enabled ? 'ya no estará' : 'estará'} disponible en el sistema`
                    );
                  }}
                  className={clsx(
                    'flex h-8 w-8 items-center justify-center rounded-full transition-colors',
                    enabled
                      ? 'bg-green-100 text-green-600 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                  )}
                  title={enabled ? 'Deshabilitar' : 'Habilitar'}
                >
                  {enabled ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Info box */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-start gap-3">
          <Package className="mt-0.5 h-5 w-5 text-blue-600" />
          <div className="text-sm text-blue-700">
            <p className="font-medium">Nota sobre módulos</p>
            <p className="mt-1">
              Los cambios en módulos se aplican inmediatamente. Los módulos deshabilitados dejan de ser visibles
              en la navegación y sus rutas quedan protegidas. Los datos asociados se conservan y estarán
              disponibles al reactivar el módulo.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
