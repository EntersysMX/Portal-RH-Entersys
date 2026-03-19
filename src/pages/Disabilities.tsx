import { useState } from 'react';
import { ShieldPlus, Plus, Calendar, DollarSign, Trash2, Edit, Activity } from 'lucide-react';
import { clsx } from 'clsx';
import StatsCard from '@/components/ui/StatsCard';
import DataTable, { Column } from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import RoleGuard from '@/components/auth/RoleGuard';
import { useIncapacities, useCreateIncapacity } from '@/hooks/useFrappe';
import { toast } from '@/components/ui/Toast';
import type { Incapacity } from '@/types/frappe';

const TYPE_COLORS: Record<string, string> = {
  'Enfermedad General': 'bg-blue-100 text-blue-700',
  'Riesgo de Trabajo': 'bg-red-100 text-red-700',
  'Maternidad': 'bg-pink-100 text-pink-700',
  'Paternidad': 'bg-cyan-100 text-cyan-700',
};

const STATUS_COLORS: Record<string, string> = {
  Active: 'bg-green-100 text-green-700',
  Completed: 'bg-gray-100 text-gray-600',
  Cancelled: 'bg-red-100 text-red-600',
};

export default function Disabilities() {
  const { data: incapacities, isLoading, isError, refetch } = useIncapacities();
  const createMutation = useCreateIncapacity();
  const [showNewModal, setShowNewModal] = useState(false);
  const [form, setForm] = useState({
    employee: '',
    employee_name: '',
    incapacity_type: 'Enfermedad General' as Incapacity['incapacity_type'],
    folio: '',
    start_date: '',
    end_date: '',
    days: 0,
    estimated_cost: 0,
    notes: '',
  });

  const activeCount = incapacities?.filter((i) => i.status === 'Active').length ?? 0;
  const totalDays = incapacities?.reduce((sum, i) => sum + (i.days || 0), 0) ?? 0;
  const totalCost = incapacities?.reduce((sum, i) => sum + (i.estimated_cost || 0), 0) ?? 0;
  const typeCount: Record<string, number> = {};
  incapacities?.forEach((i) => { typeCount[i.incapacity_type] = (typeCount[i.incapacity_type] || 0) + 1; });
  const topType = Object.entries(typeCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—';

  const columns: Column<Incapacity>[] = [
    { key: 'employee_name', header: 'Empleado', render: (i) => <p className="font-medium text-gray-900">{i.employee_name}</p> },
    {
      key: 'incapacity_type', header: 'Tipo',
      render: (i) => <span className={clsx('rounded-full px-2.5 py-0.5 text-xs font-medium', TYPE_COLORS[i.incapacity_type])}>{i.incapacity_type}</span>,
    },
    { key: 'folio', header: 'Folio', render: (i) => <span className="text-sm text-gray-600">{i.folio || '—'}</span> },
    { key: 'start_date', header: 'Inicio' },
    { key: 'end_date', header: 'Fin' },
    { key: 'days', header: 'Días', render: (i) => <span className="font-medium">{i.days}</span> },
    {
      key: 'status', header: 'Estado',
      render: (i) => <span className={clsx('rounded-full px-2 py-0.5 text-xs font-medium', STATUS_COLORS[i.status])}>{i.status}</span>,
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
      } as Partial<Incapacity>);
      toast.success('Incapacidad registrada', 'Se registró correctamente.');
      setShowNewModal(false);
      setForm({ employee: '', employee_name: '', incapacity_type: 'Enfermedad General', folio: '', start_date: '', end_date: '', days: 0, estimated_cost: 0, notes: '' });
    } catch (err) {
      toast.fromError(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Incapacidades</h1>
          <p className="mt-1 text-gray-500">Control de incapacidades médicas y seguimiento</p>
        </div>
        <RoleGuard section="disabilities" action="create">
          <button onClick={() => setShowNewModal(true)} className="btn-primary">
            <Plus className="h-4 w-4" />
            Nueva Incapacidad
          </button>
        </RoleGuard>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <StatsCard title="Activas" value={activeCount} icon={ShieldPlus} color="green" />
        <StatsCard title="Total Días Perdidos" value={totalDays} icon={Calendar} color="red" />
        <StatsCard title="Tipo más Frecuente" value={topType} icon={Activity} color="purple" />
        <StatsCard title="Costo Estimado" value={`$${totalCost.toLocaleString()}`} icon={DollarSign} color="orange" />
      </div>

      <DataTable
        columns={columns}
        data={incapacities ?? []}
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        emptyMessage="No hay incapacidades registradas."
      />

      <Modal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        title="Nueva Incapacidad"
        size="lg"
        footer={
          <>
            <button onClick={() => setShowNewModal(false)} className="btn-secondary">Cancelar</button>
            <button onClick={handleCreate} disabled={createMutation.isPending || !form.employee} className="btn-primary">
              {createMutation.isPending ? 'Guardando...' : 'Registrar'}
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Tipo</label>
              <select className="input" value={form.incapacity_type} onChange={(e) => setForm({ ...form, incapacity_type: e.target.value as Incapacity['incapacity_type'] })}>
                <option value="Enfermedad General">Enfermedad General</option>
                <option value="Riesgo de Trabajo">Riesgo de Trabajo</option>
                <option value="Maternidad">Maternidad</option>
                <option value="Paternidad">Paternidad</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Folio</label>
              <input className="input" value={form.folio} onChange={(e) => setForm({ ...form, folio: e.target.value })} placeholder="Folio IMSS" />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Fecha Inicio</label>
              <input type="date" className="input" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Fecha Fin</label>
              <input type="date" className="input" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Días</label>
              <input type="number" className="input" value={form.days} onChange={(e) => setForm({ ...form, days: Number(e.target.value) })} />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Costo Estimado</label>
            <input type="number" className="input" value={form.estimated_cost} onChange={(e) => setForm({ ...form, estimated_cost: Number(e.target.value) })} placeholder="0" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Notas</label>
            <textarea className="input min-h-[60px]" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Notas adicionales..." />
          </div>
        </div>
      </Modal>
    </div>
  );
}
