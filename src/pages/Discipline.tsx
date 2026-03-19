import { useState } from 'react';
import { Scale, Plus, AlertTriangle, Users, Calendar, Trash2, Edit } from 'lucide-react';
import { clsx } from 'clsx';
import StatsCard from '@/components/ui/StatsCard';
import DataTable, { Column } from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import RoleGuard from '@/components/auth/RoleGuard';
import { useDisciplinaryActions, useCreateDisciplinaryAction } from '@/hooks/useFrappe';
import { toast } from '@/components/ui/Toast';
import type { DisciplinaryAction } from '@/types/frappe';

const SANCTION_SEVERITY: Record<string, { color: string; level: number }> = {
  'Verbal': { color: 'bg-yellow-100 text-yellow-700', level: 1 },
  'Escrita 1': { color: 'bg-orange-100 text-orange-700', level: 2 },
  'Escrita 2': { color: 'bg-orange-200 text-orange-800', level: 3 },
  'Suspensión 1d': { color: 'bg-red-100 text-red-700', level: 4 },
  'Suspensión 3d': { color: 'bg-red-200 text-red-800', level: 5 },
};

const CATEGORY_COLORS: Record<string, string> = {
  EPP: 'bg-blue-100 text-blue-700',
  Inocuidad: 'bg-green-100 text-green-700',
  Conducta: 'bg-purple-100 text-purple-700',
  Puntualidad: 'bg-cyan-100 text-cyan-700',
  Otro: 'bg-gray-100 text-gray-700',
};

export default function Discipline() {
  const { data: actions, isLoading, isError, refetch } = useDisciplinaryActions();
  const createMutation = useCreateDisciplinaryAction();
  const [showNewModal, setShowNewModal] = useState(false);
  const [form, setForm] = useState({
    employee: '',
    employee_name: '',
    date: new Date().toISOString().split('T')[0],
    category: 'Conducta' as DisciplinaryAction['category'],
    reason: '',
    sanction_type: 'Verbal' as DisciplinaryAction['sanction_type'],
    notes: '',
  });

  const activeCount = actions?.filter((a) => a.status === 'Active').length ?? 0;
  const catCount: Record<string, number> = {};
  actions?.forEach((a) => { catCount[a.category] = (catCount[a.category] || 0) + 1; });
  const topCategory = Object.entries(catCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—';
  const empCount: Record<string, number> = {};
  actions?.forEach((a) => { empCount[a.employee_name] = (empCount[a.employee_name] || 0) + 1; });
  const topEmployee = Object.entries(empCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—';
  const currentMonth = new Date().toISOString().substring(0, 7);
  const thisMonthCount = actions?.filter((a) => a.date?.startsWith(currentMonth)).length ?? 0;

  const columns: Column<DisciplinaryAction>[] = [
    { key: 'employee_name', header: 'Empleado', render: (a) => <p className="font-medium text-gray-900">{a.employee_name}</p> },
    { key: 'date', header: 'Fecha' },
    {
      key: 'category', header: 'Categoría',
      render: (a) => <span className={clsx('rounded-full px-2.5 py-0.5 text-xs font-medium', CATEGORY_COLORS[a.category] || CATEGORY_COLORS['Otro'])}>{a.category}</span>,
    },
    {
      key: 'sanction_type', header: 'Sanción',
      render: (a) => {
        const sev = SANCTION_SEVERITY[a.sanction_type] || SANCTION_SEVERITY['Verbal'];
        return <span className={clsx('rounded-full px-2.5 py-0.5 text-xs font-medium', sev.color)}>{a.sanction_type}</span>;
      },
    },
    { key: 'reason', header: 'Motivo', render: (a) => <p className="max-w-xs truncate text-sm text-gray-600">{a.reason}</p> },
    {
      key: 'status', header: 'Estado',
      render: (a) => (
        <span className={clsx('rounded-full px-2 py-0.5 text-xs font-medium',
          a.status === 'Active' ? 'bg-green-100 text-green-700' : a.status === 'Resolved' ? 'bg-gray-100 text-gray-600' : 'bg-red-100 text-red-600'
        )}>{a.status}</span>
      ),
    },
    {
      key: 'actions', header: 'Acciones',
      render: () => (
        <div className="flex gap-1">
          <button className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"><Edit className="h-4 w-4" /></button>
          <button className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
        </div>
      ),
    },
  ];

  const handleCreate = async () => {
    try {
      await createMutation.mutateAsync({
        ...form,
        status: 'Active',
      } as Partial<DisciplinaryAction>);
      toast.success('Acta registrada', 'La acción disciplinaria fue registrada.');
      setShowNewModal(false);
      setForm({ employee: '', employee_name: '', date: new Date().toISOString().split('T')[0], category: 'Conducta', reason: '', sanction_type: 'Verbal', notes: '' });
    } catch (err) {
      toast.fromError(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Disciplina</h1>
          <p className="mt-1 text-gray-500">Gestión de amonestaciones y actas administrativas</p>
        </div>
        <RoleGuard section="discipline" action="create">
          <button onClick={() => setShowNewModal(true)} className="btn-primary">
            <Plus className="h-4 w-4" />
            Nueva Acta
          </button>
        </RoleGuard>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <StatsCard title="Activas" value={activeCount} icon={Scale} color="red" />
        <StatsCard title="Categoría Top" value={topCategory} icon={AlertTriangle} color="orange" />
        <StatsCard title="Más Incidencias" value={topEmployee} icon={Users} color="purple" />
        <StatsCard title="Este Mes" value={thisMonthCount} icon={Calendar} color="blue" />
      </div>

      <DataTable
        columns={columns}
        data={actions ?? []}
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        emptyMessage="No hay acciones disciplinarias registradas."
      />

      <Modal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        title="Nueva Acción Disciplinaria"
        size="lg"
        footer={
          <>
            <button onClick={() => setShowNewModal(false)} className="btn-secondary">Cancelar</button>
            <button onClick={handleCreate} disabled={createMutation.isPending || !form.employee || !form.reason} className="btn-primary">
              {createMutation.isPending ? 'Guardando...' : 'Registrar Acta'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Fecha</label>
              <input type="date" className="input" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Categoría</label>
              <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as DisciplinaryAction['category'] })}>
                <option value="EPP">EPP</option>
                <option value="Inocuidad">Inocuidad</option>
                <option value="Conducta">Conducta</option>
                <option value="Puntualidad">Puntualidad</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Tipo de Sanción</label>
              <select className="input" value={form.sanction_type} onChange={(e) => setForm({ ...form, sanction_type: e.target.value as DisciplinaryAction['sanction_type'] })}>
                <option value="Verbal">Amonestación Verbal</option>
                <option value="Escrita 1">Escrita 1</option>
                <option value="Escrita 2">Escrita 2</option>
                <option value="Suspensión 1d">Suspensión 1 día</option>
                <option value="Suspensión 3d">Suspensión 3 días</option>
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Motivo</label>
            <textarea className="input min-h-[80px]" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Describe el motivo de la acción disciplinaria..." />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Notas adicionales</label>
            <textarea className="input min-h-[60px]" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Notas..." />
          </div>
        </div>
      </Modal>
    </div>
  );
}
