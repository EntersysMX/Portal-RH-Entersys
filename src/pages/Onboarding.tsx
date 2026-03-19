import { useState } from 'react';
import { UserCheck, Plus, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';
import StatsCard from '@/components/ui/StatsCard';
import Modal from '@/components/ui/Modal';
import RoleGuard from '@/components/auth/RoleGuard';
import { useOnboardingChecklists, useCreateOnboardingChecklist, useUpdateOnboardingChecklist } from '@/hooks/useFrappe';
import { toast } from '@/components/ui/Toast';
import type { OnboardingChecklist, OnboardingItem } from '@/types/frappe';

const DEFAULT_ONBOARDING_ITEMS: OnboardingItem[] = [
  { idx: 1, title: 'Documentos entregados', is_completed: false },
  { idx: 2, title: 'Cuenta de correo creada', is_completed: false },
  { idx: 3, title: 'Equipo asignado', is_completed: false },
  { idx: 4, title: 'Capacitación inicial', is_completed: false },
  { idx: 5, title: 'Presentación al equipo', is_completed: false },
];

const DEFAULT_OFFBOARDING_ITEMS: OnboardingItem[] = [
  { idx: 1, title: 'Devolución de equipo', is_completed: false },
  { idx: 2, title: 'Desactivar accesos', is_completed: false },
  { idx: 3, title: 'Entrevista de salida', is_completed: false },
  { idx: 4, title: 'Finiquito procesado', is_completed: false },
];

export default function Onboarding() {
  const { data: checklists, isLoading, isError, refetch } = useOnboardingChecklists();
  const createMutation = useCreateOnboardingChecklist();
  const updateMutation = useUpdateOnboardingChecklist();
  const [showNewModal, setShowNewModal] = useState(false);
  const [form, setForm] = useState({
    employee: '',
    employee_name: '',
    checklist_type: 'Onboarding' as OnboardingChecklist['checklist_type'],
  });

  const activeChecklists = checklists?.filter((c) => c.status === 'In Progress') || [];
  const completedCount = checklists?.filter((c) => c.status === 'Completed').length ?? 0;
  const avgProgress = activeChecklists.length > 0
    ? activeChecklists.reduce((sum, c) => sum + (c.progress || 0), 0) / activeChecklists.length
    : 0;
  const pendingCount = activeChecklists.length;

  const handleCreate = async () => {
    try {
      const items = form.checklist_type === 'Onboarding' ? DEFAULT_ONBOARDING_ITEMS : DEFAULT_OFFBOARDING_ITEMS;
      await createMutation.mutateAsync({
        ...form,
        status: 'In Progress',
        progress: 0,
        items,
      } as Partial<OnboardingChecklist>);
      toast.success('Proceso creado', `${form.checklist_type} iniciado para ${form.employee_name || form.employee}.`);
      setShowNewModal(false);
      setForm({ employee: '', employee_name: '', checklist_type: 'Onboarding' });
    } catch (err) {
      toast.fromError(err);
    }
  };

  const handleToggleItem = async (checklist: OnboardingChecklist, itemIdx: number) => {
    const items = [...(checklist.items || [])];
    const item = items.find((i) => i.idx === itemIdx);
    if (!item) return;
    item.is_completed = !item.is_completed;
    if (item.is_completed) item.completed_date = new Date().toISOString().split('T')[0];
    else item.completed_date = undefined;

    const completed = items.filter((i) => i.is_completed).length;
    const progress = Math.round((completed / items.length) * 100);
    const status = progress === 100 ? 'Completed' : 'In Progress';

    try {
      await updateMutation.mutateAsync({ name: checklist.name, data: { items, progress, status } });
    } catch (err) {
      toast.fromError(err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2">
        <p className="text-gray-500">Error al cargar los datos.</p>
        <button onClick={() => refetch()} className="btn-primary">Reintentar</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Onboarding / Offboarding</h1>
          <p className="mt-1 text-gray-500">Gestión de procesos de integración y salida</p>
        </div>
        <RoleGuard section="onboarding" action="create">
          <button onClick={() => setShowNewModal(true)} className="btn-primary">
            <Plus className="h-4 w-4" />
            Nuevo Proceso
          </button>
        </RoleGuard>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <StatsCard title="Procesos Activos" value={activeChecklists.length} icon={UserCheck} color="blue" />
        <StatsCard title="Completados" value={completedCount} icon={CheckCircle} color="green" />
        <StatsCard title="Avance Promedio" value={`${Math.round(avgProgress)}%`} icon={Clock} color="purple" />
        <StatsCard title="Pendientes" value={pendingCount} icon={AlertCircle} color="orange" />
      </div>

      {/* Checklist Cards */}
      {checklists?.length === 0 ? (
        <div className="card py-12 text-center text-gray-400">
          No hay procesos de onboarding/offboarding. Crea el primero desde el botón "Nuevo Proceso".
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {checklists?.map((checklist) => (
            <div key={checklist.name} className="card">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{checklist.employee_name || checklist.employee}</p>
                  <span className={clsx(
                    'inline-block mt-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
                    checklist.checklist_type === 'Onboarding' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                  )}>
                    {checklist.checklist_type}
                  </span>
                </div>
                <span className={clsx(
                  'rounded-full px-2 py-0.5 text-xs font-medium',
                  checklist.status === 'Completed' ? 'bg-green-100 text-green-700' : checklist.status === 'In Progress' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                )}>
                  {checklist.status}
                </span>
              </div>

              {/* Progress bar */}
              <div className="mb-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Progreso</span>
                  <span className="font-medium text-gray-900">{checklist.progress ?? 0}%</span>
                </div>
                <div className="mt-1 h-2 w-full rounded-full bg-gray-100">
                  <div
                    className={clsx('h-2 rounded-full transition-all', checklist.progress === 100 ? 'bg-green-500' : 'bg-blue-500')}
                    style={{ width: `${checklist.progress ?? 0}%` }}
                  />
                </div>
              </div>

              {/* Items */}
              <div className="space-y-1.5">
                {checklist.items?.map((item) => (
                  <label key={item.idx} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={item.is_completed}
                      onChange={() => handleToggleItem(checklist, item.idx)}
                      className="h-4 w-4 rounded border-gray-300 text-primary-600"
                    />
                    <span className={clsx('text-sm', item.is_completed ? 'text-gray-400 line-through' : 'text-gray-700')}>
                      {item.title}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        title="Nuevo Proceso"
        footer={
          <>
            <button onClick={() => setShowNewModal(false)} className="btn-secondary">Cancelar</button>
            <button onClick={handleCreate} disabled={createMutation.isPending || !form.employee} className="btn-primary">
              {createMutation.isPending ? 'Creando...' : 'Iniciar Proceso'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Tipo</label>
            <select className="input" value={form.checklist_type} onChange={(e) => setForm({ ...form, checklist_type: e.target.value as OnboardingChecklist['checklist_type'] })}>
              <option value="Onboarding">Onboarding</option>
              <option value="Offboarding">Offboarding</option>
            </select>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">ID Empleado</label>
              <input className="input" value={form.employee} onChange={(e) => setForm({ ...form, employee: e.target.value })} placeholder="HR-EMP-00001" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Nombre Empleado</label>
              <input className="input" value={form.employee_name} onChange={(e) => setForm({ ...form, employee_name: e.target.value })} placeholder="Nombre completo" />
            </div>
          </div>
          <div className="rounded-lg bg-gray-50 p-3">
            <p className="text-sm font-medium text-gray-700 mb-2">Items pre-configurados:</p>
            <ul className="space-y-1 text-sm text-gray-600">
              {(form.checklist_type === 'Onboarding' ? DEFAULT_ONBOARDING_ITEMS : DEFAULT_OFFBOARDING_ITEMS).map((item) => (
                <li key={item.idx} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
                  {item.title}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Modal>
    </div>
  );
}
